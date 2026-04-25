import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { pool, testConnection, withClient } from './db.js';
import {
  buildNudgeImpact,
  computeAnalystComparison,
  computeAnalystDashboard,
  computeAnalystKpis,
  computePublicOverview,
  computeRiskScore,
  computeStudentBaseline,
  normalizeMetricRow,
} from './analytics.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required.');
const ROLE_VALUES = ['student', 'educator', 'analyst'];
const VERIFICATION_VALUES = ['verified', 'partial', 'unverified'];
const ALERT_STATUS_VALUES = ['open', 'acknowledged', 'resolved'];
const NUDGE_STATUS_VALUES = ['sent', 'read', 'acknowledged', 'resolved'];

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/auth', authLimiter);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api', apiLimiter);

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value, digits = 1) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function verificationScore(status) {
  if (status === 'verified') return 1;
  if (status === 'partial') return 0.5;
  return 0;
}

function verificationLabel(status) {
  if (status === 'verified') return 'Verified';
  if (status === 'partial') return 'Partial';
  return 'Unverified';
}

function normalizeVerificationStatus(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'yes' || normalized === 'verified' || normalized === 'all') return 'verified';
  if (normalized === 'partial' || normalized === 'some') return 'partial';
  if (normalized === 'no' || normalized === 'unverified' || normalized === 'none') return 'unverified';
  return null;
}

function inferAgeGroup(grade) {
  if (!grade) return null;
  const numericGrade = Number(grade);
  if (Number.isNaN(numericGrade)) return null;
  if (numericGrade <= 9) return '13-14';
  return '15-17';
}

function getAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function requireAuth(req, res, next) {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (_error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to access this resource.' });
    }
    return next();
  };
}

function validateRequiredString(value, fieldName, { minLength = 1 } = {}) {
  if (typeof value !== 'string' || value.trim().length < minLength) {
    throw new Error(`${fieldName} is required.`);
  }
  return value.trim();
}

function validateNumber(value, fieldName, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, integer = false } = {}) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    throw new Error(`${fieldName} must be a number.`);
  }
  if (integer && !Number.isInteger(numericValue)) {
    throw new Error(`${fieldName} must be an integer.`);
  }
  if (numericValue < min || numericValue > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}.`);
  }
  return numericValue;
}

function buildMetricFilters(query, { includePhase = true } = {}) {
  const filters = {};

  if (includePhase && query.phase && query.phase !== 'all') {
    const phase = String(query.phase).toUpperCase();
    if (!['AS-IS', 'TO-BE'].includes(phase)) {
      throw new Error('phase must be AS-IS, TO-BE, or all.');
    }
    filters.phase = phase;
  }

  if (query.age_group && query.age_group !== 'all') {
    const ageGroup = String(query.age_group);
    if (!['13-14', '15-17'].includes(ageGroup)) {
      throw new Error('age_group must be 13-14, 15-17, or all.');
    }
    filters.ageGroup = ageGroup;
  }

  if (query.reliance_type && query.reliance_type !== 'all') {
    const relianceType = String(query.reliance_type);
    if (!['overreliance', 'appropriate', 'underreliance'].includes(relianceType)) {
      throw new Error('reliance_type must be overreliance, appropriate, underreliance, or all.');
    }
    filters.relianceType = relianceType;
  }

  if (query.day_start) {
    filters.dayStart = validateNumber(query.day_start, 'day_start', { min: 1, max: 30, integer: true });
  }

  if (query.day_end) {
    filters.dayEnd = validateNumber(query.day_end, 'day_end', { min: 1, max: 30, integer: true });
  }

  if (filters.dayStart && filters.dayEnd && filters.dayStart > filters.dayEnd) {
    throw new Error('day_start cannot be greater than day_end.');
  }

  return filters;
}

async function getProfileById(userId) {
  const result = await pool.query(
    `
      SELECT id, email, full_name, role, grade, age_group, avatar_url, dataset_user_key, created_at
      FROM profiles
      WHERE id = $1
    `,
    [userId],
  );
  return result.rows[0] ?? null;
}

async function getStudentDatasetRows(studentId) {
  const result = await pool.query(
    `
      SELECT m.*
      FROM profiles p
      JOIN student_day_metrics m ON m.dataset_user_key = p.dataset_user_key
      WHERE p.id = $1
      ORDER BY m.day ASC
    `,
    [studentId],
  );
  return result.rows.map(normalizeMetricRow);
}

async function fetchMetricRows(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.phase) {
    params.push(filters.phase);
    clauses.push(`phase = $${params.length}`);
  }
  if (filters.ageGroup) {
    params.push(filters.ageGroup);
    clauses.push(`age_group = $${params.length}`);
  }
  if (filters.relianceType) {
    params.push(filters.relianceType);
    clauses.push(`reliance_type = $${params.length}`);
  }
  if (filters.dayStart) {
    params.push(filters.dayStart);
    clauses.push(`day >= $${params.length}`);
  }
  if (filters.dayEnd) {
    params.push(filters.dayEnd);
    clauses.push(`day <= $${params.length}`);
  }

  const result = await pool.query(
    `
      SELECT *
      FROM student_day_metrics
      ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY day ASC, dataset_user_key ASC
    `,
    params,
  );

  return result.rows.map(normalizeMetricRow);
}

function normalizeSessionRow(row) {
  return {
    ...row,
    duration_minutes: Number(row.duration_minutes),
    prompts_sent: Number(row.prompts_sent),
    breaks_taken: Number(row.breaks_taken),
    eye_dryness_score: Number(row.eye_dryness_score),
    neck_pain_score: Number(row.neck_pain_score),
    risk_score: Number(row.risk_score),
  };
}

function normalizeProgressRow(row) {
  return {
    ...row,
    id: Number(row.id),
    duration_minutes: Number(row.duration_minutes),
    attempts: Number(row.attempts),
    latest_score: Number(row.latest_score),
    best_score: Number(row.best_score),
    slides_json: row.slides_json ?? [],
    progress: row.progress_id
      ? {
          attempts: Number(row.attempts),
          latest_score: Number(row.latest_score),
          best_score: Number(row.best_score),
          passed: Boolean(row.passed),
          completed_at: row.completed_at,
          updated_at: row.updated_at,
        }
      : null,
  };
}

function buildSessionSummary(sessions) {
  if (!sessions.length) {
    return {
      averageRisk: 0,
      verificationRate: 0,
      averageDuration: 0,
      averagePrompts: 0,
      averageEyeDryness: 0,
      averageNeckPain: 0,
      breakAdherenceRate: 0,
    };
  }

  return {
    averageRisk: round(average(sessions.map((session) => session.risk_score))),
    verificationRate: round(average(sessions.map((session) => verificationScore(session.verification_status))) * 100),
    averageDuration: round(average(sessions.map((session) => session.duration_minutes))),
    averagePrompts: round(average(sessions.map((session) => session.prompts_sent))),
    averageEyeDryness: round(average(sessions.map((session) => session.eye_dryness_score))),
    averageNeckPain: round(average(sessions.map((session) => session.neck_pain_score))),
    breakAdherenceRate: round((sessions.filter((session) => session.breaks_taken > 0).length / sessions.length) * 100),
  };
}

function buildSessionTrends(sessions) {
  const ordered = [...sessions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return {
    verificationTrend: ordered.map((session, index) => ({
      label: session.label ?? `S${index + 1}`,
      date: session.created_at,
      verificationScore: round(verificationScore(session.verification_status) * 100),
      riskScore: session.risk_score,
    })),
    symptomTrend: ordered.map((session, index) => ({
      label: session.label ?? `S${index + 1}`,
      date: session.created_at,
      eyeDryness: session.eye_dryness_score,
      neckPain: session.neck_pain_score,
      breaksTaken: session.breaks_taken,
    })),
  };
}

function buildBenchmarkComparison(liveSummary, baseline) {
  if (!baseline) return [];
  return [
    { label: 'Verification Rate', live: liveSummary.verificationRate, baseline: baseline.avgVerificationRate, unit: '%' },
    { label: 'Prompts per Session', live: liveSummary.averagePrompts, baseline: baseline.avgPromptsPerDay, unit: '' },
    { label: 'Eye Dryness', live: liveSummary.averageEyeDryness, baseline: baseline.avgEyeDryness, unit: '/10' },
    { label: 'Neck Pain', live: liveSummary.averageNeckPain, baseline: baseline.avgNeckPain, unit: '/10' },
  ];
}

function verificationStatusFromRate(rate) {
  if (rate >= 0.75) return 'verified';
  if (rate >= 0.45) return 'partial';
  return 'unverified';
}

function metricRowToHistoricalSession(row) {
  const verificationStatus = verificationStatusFromRate(Number(row.verification_rate));
  return {
    id: `historical-${row.dataset_user_key}-${row.day}`,
    source: 'historical',
    subject: 'Historical baseline',
    task_type: `Imported day ${row.day} (${row.phase})`,
    duration_minutes: Math.round(Number(row.continuous_use_minutes)),
    prompts_sent: Math.round(Number(row.ai_prompts_per_day)),
    verification_status: verificationStatus,
    breaks_taken: Number(row.breaks_taken),
    eye_dryness_score: Number(row.eye_dryness_score),
    neck_pain_score: Number(row.neck_pain_score),
    risk_score: computeRiskScore({
      durationMinutes: Number(row.continuous_use_minutes),
      promptsSent: Number(row.ai_prompts_per_day),
      verificationStatus,
      breaksTaken: Number(row.breaks_taken),
      eyeDrynessScore: Number(row.eye_dryness_score),
      neckPainScore: Number(row.neck_pain_score),
    }),
    created_at: new Date(Date.UTC(2026, 0, Number(row.day))).toISOString(),
    label: `D${row.day}`,
    phase: row.phase,
  };
}

function buildHistoricalSessions(metricRows) {
  return metricRows
    .map(metricRowToHistoricalSession)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

function buildCombinedStudentHistory(baselineRows, liveSessions) {
  const historicalSessions = buildHistoricalSessions(baselineRows);
  const orderedLiveSessions = [...liveSessions]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((session, index) => ({
      ...session,
      source: 'live',
      label: `L${index + 1}`,
    }));

  return [...historicalSessions, ...orderedLiveSessions];
}

function takeRecentHistory(history, count) {
  if (!history.length) return [];
  return history.slice(-count);
}

function buildMetricDailyTrend(metricRows) {
  const grouped = new Map();

  for (const row of metricRows) {
    const key = Number(row.day);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(metricRowToHistoricalSession(row));
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([day, daySessions]) => ({
      date: new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10),
      label: `D${day}`,
      averageRisk: round(average(daySessions.map((session) => session.risk_score))),
      verificationRate: round(average(daySessions.map((session) => verificationScore(session.verification_status))) * 100),
      eyeDryness: round(average(daySessions.map((session) => session.eye_dryness_score))),
      neckPain: round(average(daySessions.map((session) => session.neck_pain_score))),
      sessionCount: daySessions.length,
    }));
}

async function getStudentSessions(studentId, { limit } = {}) {
  const params = [studentId];
  let limitClause = '';
  if (limit) {
    params.push(limit);
    limitClause = `LIMIT $${params.length}`;
  }
  const result = await pool.query(
    `
      SELECT *
      FROM student_sessions
      WHERE student_id = $1
      ORDER BY created_at DESC
      ${limitClause}
    `,
    params,
  );
  return result.rows.map(normalizeSessionRow);
}

async function getStudentNudges(studentId, { unresolvedOnly = false } = {}) {
  const params = [studentId];
  const conditions = ['n.student_id = $1'];
  if (unresolvedOnly) {
    conditions.push(`n.status <> 'resolved'`);
  }
  const result = await pool.query(
    `
      SELECT
        n.*,
        educator.full_name AS educator_name,
        ra.reason AS alert_reason
      FROM nudges n
      JOIN profiles educator ON educator.id = n.educator_id
      LEFT JOIN risk_alerts ra ON ra.id = n.alert_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY n.created_at DESC
    `,
    params,
  );
  return result.rows;
}

async function getStudentAlerts(studentId) {
  const result = await pool.query(
    `
      SELECT *
      FROM risk_alerts
      WHERE student_id = $1
      ORDER BY created_at DESC
    `,
    [studentId],
  );
  return result.rows.map((row) => ({
    ...row,
    risk_score: Number(row.risk_score),
  }));
}

async function getStudentTrainingModules(studentId) {
  const result = await pool.query(
    `
      SELECT
        tm.id,
        tm.slug,
        tm.title,
        tm.description,
        tm.icon,
        tm.accent_color,
        tm.duration_minutes,
        tm.order_index,
        tm.slides_json,
        tp.id AS progress_id,
        COALESCE(tp.attempts, 0) AS attempts,
        COALESCE(tp.latest_score, 0) AS latest_score,
        COALESCE(tp.best_score, 0) AS best_score,
        COALESCE(tp.passed, FALSE) AS passed,
        tp.completed_at,
        tp.updated_at
      FROM training_modules tm
      LEFT JOIN training_progress tp
        ON tp.module_id = tm.id
       AND tp.student_id = $1
      ORDER BY tm.order_index ASC
    `,
    [studentId],
  );

  const moduleIds = result.rows.map((row) => row.id);
  const questionResult = await pool.query(
    `
      SELECT id, module_id, question_order, prompt, options_json
      FROM training_questions
      WHERE module_id = ANY($1::int[])
      ORDER BY module_id ASC, question_order ASC
    `,
    [moduleIds.length ? moduleIds : [0]],
  );

  const questionsByModule = questionResult.rows.reduce((accumulator, row) => {
    const key = Number(row.module_id);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push({
      id: row.id,
      order: Number(row.question_order),
      prompt: row.prompt,
      options: row.options_json ?? [],
    });
    return accumulator;
  }, {});

  return result.rows.map((row) => {
    const module = normalizeProgressRow(row);
    return {
      ...module,
      questions: questionsByModule[module.id] ?? [],
    };
  });
}

async function getEducatorScopedStudentIds(educatorId) {
  const result = await pool.query(
    `
      SELECT student_id
      FROM educator_student_map
      WHERE educator_id = $1
      ORDER BY created_at ASC
    `,
    [educatorId],
  );
  return result.rows.map((row) => row.student_id);
}

async function verifyEducatorStudentAccess(educatorId, studentId) {
  const result = await pool.query(
    `
      SELECT 1
      FROM educator_student_map
      WHERE educator_id = $1
        AND student_id = $2
    `,
    [educatorId, studentId],
  );
  return Boolean(result.rows[0]);
}

async function getEducatorRoster(educatorId, { search = '', risk = 'all', sort = 'name' } = {}) {
  const params = [educatorId];
  const filters = ['map.educator_id = $1'];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    filters.push(`(LOWER(p.full_name) LIKE $${params.length} OR LOWER(p.email) LIKE $${params.length})`);
  }

  const result = await pool.query(
    `
      SELECT
        p.id,
        p.full_name,
        p.email,
        p.grade,
        p.age_group,
        p.dataset_user_key,
        COUNT(s.id)::int AS total_sessions,
        MAX(s.created_at) AS last_session_at,
        COUNT(DISTINCT CASE WHEN ra.status = 'open' THEN ra.id END)::int AS open_alerts,
        COUNT(DISTINCT CASE WHEN n.status IN ('sent', 'read', 'acknowledged') THEN n.id END)::int AS active_nudges
      FROM educator_student_map map
      JOIN profiles p ON p.id = map.student_id
      LEFT JOIN student_sessions s ON s.student_id = p.id
      LEFT JOIN risk_alerts ra ON ra.student_id = p.id
      LEFT JOIN nudges n ON n.student_id = p.id
      WHERE ${filters.join(' AND ')}
      GROUP BY p.id
    `,
    params,
  );

  const rows = result.rows.map((row) => ({
    ...row,
    total_sessions: Number(row.total_sessions),
    open_alerts: Number(row.open_alerts),
    active_nudges: Number(row.active_nudges),
  }));

  if (!rows.length) {
    return [];
  }

  const studentIds = rows.map((row) => row.id);

  const [baselineResult, liveSessionResult] = await Promise.all([
    pool.query(
      `
        SELECT p.id AS student_id, m.*
        FROM profiles p
        JOIN student_day_metrics m ON m.dataset_user_key = p.dataset_user_key
        WHERE p.id = ANY($1::uuid[])
        ORDER BY p.id ASC, m.day ASC
      `,
      [studentIds],
    ),
    pool.query(
      `
        SELECT *
        FROM student_sessions
        WHERE student_id = ANY($1::uuid[])
        ORDER BY created_at ASC
      `,
      [studentIds],
    ),
  ]);

  const baselineByStudent = baselineResult.rows.reduce((accumulator, row) => {
    if (!accumulator[row.student_id]) accumulator[row.student_id] = [];
    accumulator[row.student_id].push(normalizeMetricRow(row));
    return accumulator;
  }, {});

  const liveSessionsByStudent = liveSessionResult.rows.reduce((accumulator, row) => {
    if (!accumulator[row.student_id]) accumulator[row.student_id] = [];
    accumulator[row.student_id].push(normalizeSessionRow(row));
    return accumulator;
  }, {});

  const enrichedRows = rows.map((row) => {
    const baselineRows = baselineByStudent[row.id] ?? [];
    const liveSessions = liveSessionsByStudent[row.id] ?? [];
    const combinedHistory = buildCombinedStudentHistory(baselineRows, liveSessions);
    const currentWindow = takeRecentHistory(combinedHistory, 10);
    const snapshot = buildSessionSummary(currentWindow.length ? currentWindow : combinedHistory);
    const latestHistoricalRow = baselineRows[baselineRows.length - 1];

    return {
      ...row,
      average_risk: snapshot.averageRisk,
      verification_rate: snapshot.verificationRate,
      last_activity_label: row.last_session_at
        ? null
        : (latestHistoricalRow ? `Historical day ${latestHistoricalRow.day} (${latestHistoricalRow.phase})` : 'No history'),
    };
  });

  const riskFiltered = enrichedRows.filter((row) => {
    if (risk === 'high') return row.average_risk >= 65;
    if (risk === 'moderate') return row.average_risk >= 40 && row.average_risk < 65;
    if (risk === 'low') return row.average_risk < 40;
    return true;
  });

  const sorters = {
    name: (a, b) => a.full_name.localeCompare(b.full_name),
    risk: (a, b) => b.average_risk - a.average_risk,
    sessions: (a, b) => b.total_sessions - a.total_sessions,
    verification: (a, b) => b.verification_rate - a.verification_rate,
  };

  return riskFiltered.sort(sorters[sort] || sorters.name);
}

async function getEducatorAlerts(educatorId, { status } = {}) {
  const params = [educatorId];
  const filters = ['map.educator_id = $1'];
  if (status && status !== 'all') {
    params.push(status);
    filters.push(`ra.status = $${params.length}`);
  }

  const result = await pool.query(
    `
      SELECT
        ra.*,
        student.full_name AS student_name,
        student.grade
      FROM risk_alerts ra
      JOIN educator_student_map map ON map.student_id = ra.student_id
      JOIN profiles student ON student.id = ra.student_id
      WHERE ${filters.join(' AND ')}
      ORDER BY ra.created_at DESC
    `,
    params,
  );

  return result.rows.map((row) => ({
    ...row,
    risk_score: Number(row.risk_score),
  }));
}

async function getEducatorNudges(educatorId) {
  const nudgeResult = await pool.query(
    `
      SELECT
        n.*,
        student.full_name AS student_name,
        student.grade,
        ra.reason AS alert_reason
      FROM nudges n
      JOIN educator_student_map map ON map.student_id = n.student_id
      JOIN profiles student ON student.id = n.student_id
      LEFT JOIN risk_alerts ra ON ra.id = n.alert_id
      WHERE map.educator_id = $1
      ORDER BY n.created_at DESC
    `,
    [educatorId],
  );

  const studentIds = [...new Set(nudgeResult.rows.map((row) => row.student_id))];
  const sessionResult = await pool.query(
    `
      SELECT *
      FROM student_sessions
      WHERE student_id = ANY($1::uuid[])
      ORDER BY created_at ASC
    `,
    [studentIds.length ? studentIds : ['00000000-0000-0000-0000-000000000000']],
  );

  const sessionsByStudent = sessionResult.rows.reduce((accumulator, row) => {
    if (!accumulator[row.student_id]) accumulator[row.student_id] = [];
    accumulator[row.student_id].push(normalizeSessionRow(row));
    return accumulator;
  }, {});

  return nudgeResult.rows.map((row) => {
    const impact = buildNudgeImpact([row], sessionsByStudent[row.student_id] ?? [])[0] ?? null;
    return {
      ...row,
      impact,
    };
  });
}

async function getEducatorBenchmarkRows(educatorId) {
  const result = await pool.query(
    `
      SELECT m.*
      FROM student_day_metrics m
      JOIN profiles p ON p.dataset_user_key = m.dataset_user_key
      JOIN educator_student_map map ON map.student_id = p.id
      WHERE map.educator_id = $1
      ORDER BY m.day ASC, m.dataset_user_key ASC
    `,
    [educatorId],
  );
  return result.rows.map(normalizeMetricRow);
}

function groupSessionsByCalendarDay(sessions) {
  const grouped = new Map();
  for (const session of sessions) {
    const key = new Date(session.created_at).toISOString().slice(0, 10);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(session);
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, daySessions]) => ({
      date,
      label: date.slice(5),
      averageRisk: round(average(daySessions.map((session) => session.risk_score))),
      verificationRate: round(average(daySessions.map((session) => verificationScore(session.verification_status))) * 100),
      eyeDryness: round(average(daySessions.map((session) => session.eye_dryness_score))),
      neckPain: round(average(daySessions.map((session) => session.neck_pain_score))),
      sessionCount: daySessions.length,
    }));
}

function buildCohortTrendSeries(baselineRows, liveSessions, { baselineWindow = 10, liveWindow = 10 } = {}) {
  const baselineTrend = buildMetricDailyTrend(baselineRows).slice(-baselineWindow);
  const liveTrend = groupSessionsByCalendarDay(liveSessions).slice(-liveWindow);
  return liveTrend.length ? [...baselineTrend, ...liveTrend] : baselineTrend;
}

function buildStudentDashboardPayload({ profile, sessions, nudges, alerts, modules, baselineRows }) {
  const combinedHistory = buildCombinedStudentHistory(baselineRows, sessions);
  const currentWindow = takeRecentHistory(combinedHistory, 10);
  const trendWindow = takeRecentHistory(combinedHistory, 12);
  const currentSummary = buildSessionSummary(currentWindow.length ? currentWindow : combinedHistory);
  const trends = buildSessionTrends(trendWindow.length ? trendWindow : combinedHistory);
  const baseline = computeStudentBaseline(baselineRows);
  const completedModules = modules.filter((module) => module.progress?.passed).length;
  const pendingNudges = nudges.filter((nudge) => ['sent', 'read', 'acknowledged'].includes(nudge.status));
  const openAlerts = alerts.filter((alert) => alert.status !== 'resolved');
  const recentCombinedHistory = [...combinedHistory].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);

  return {
    profile,
    summary: {
      ...currentSummary,
      completedModules,
      totalModules: modules.length,
      pendingNudges: pendingNudges.length,
      openAlerts: openAlerts.length,
      latestRisk: recentCombinedHistory[0]?.risk_score ?? 0,
      dominantBaselineReliance: baseline?.dominantRelianceType ?? null,
    },
    baseline,
    benchmarkComparison: buildBenchmarkComparison(currentSummary, baseline),
    recentSessions: recentCombinedHistory,
    pendingNudges: pendingNudges.slice(0, 5),
    activeAlerts: openAlerts.slice(0, 5),
    moduleProgress: modules.map((module) => ({
      id: module.id,
      title: module.title,
      icon: module.icon,
      progress: module.progress,
    })),
    ...trends,
  };
}

function buildStudentProgressPayload({ sessions, nudges, modules, baselineRows }) {
  const combinedHistory = buildCombinedStudentHistory(baselineRows, sessions);
  const currentWindow = takeRecentHistory(combinedHistory, 15);
  const trendWindow = takeRecentHistory(combinedHistory, 15);
  const summary = buildSessionSummary(currentWindow.length ? currentWindow : combinedHistory);
  const progressItems = modules.map((module) => ({
    id: module.id,
    title: module.title,
    durationMinutes: module.duration_minutes,
    progress: module.progress,
  }));
  const completedModules = progressItems.filter((item) => item.progress?.passed).length;
  const scores = progressItems
    .map((item) => item.progress?.best_score ?? null)
    .filter((value) => value !== null);
  const nudgeImpact = buildNudgeImpact(nudges, sessions);

  return {
    summary: {
      ...summary,
      completedModules,
      totalModules: progressItems.length,
      averageBestScore: scores.length ? round(average(scores)) : 0,
      nudgeImprovement: nudgeImpact.length ? round(average(nudgeImpact.map((item) => item.improvement)) * 100) : 0,
    },
    training: progressItems,
    nudgeImpact,
    ...buildSessionTrends(trendWindow.length ? trendWindow : combinedHistory),
  };
}

app.get('/api/health', async (_req, res) => {
  try {
    await testConnection();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/public/overview', async (_req, res) => {
  try {
    const rows = await fetchMetricRows();
    const overview = computePublicOverview(rows);
    const demoResult = await pool.query(
      `
        SELECT role, email, full_name
        FROM profiles
        WHERE role IN ('educator', 'analyst')
        UNION ALL
        SELECT role, email, full_name
        FROM profiles
        WHERE role = 'student'
        ORDER BY role, email
      `,
    );

    const firstStudent = demoResult.rows.find((row) => row.role === 'student') ?? null;
    const educator = demoResult.rows.find((row) => row.role === 'educator') ?? null;
    const analyst = demoResult.rows.find((row) => row.role === 'analyst') ?? null;

    res.json({
      overview,
      demoUsers: {
        student: firstStudent,
        educator,
        analyst,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load public overview.' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const email = validateRequiredString(req.body.email, 'email').toLowerCase();
    const password = validateRequiredString(req.body.password, 'password', { minLength: 8 });
    const fullName = validateRequiredString(req.body.full_name, 'full_name');
    const role = validateRequiredString(req.body.role, 'role');

    if (!ROLE_VALUES.includes(role)) {
      throw new Error('role must be student, educator, or analyst.');
    }

    const grade = req.body.grade ? String(req.body.grade) : null;
    const ageGroup = req.body.age_group ? String(req.body.age_group) : inferAgeGroup(grade);
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const insertResult = await client.query(
          `
            INSERT INTO profiles (email, password_hash, full_name, role, grade, age_group)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, full_name, role, grade, age_group, avatar_url, dataset_user_key
          `,
          [email, passwordHash, fullName, role, grade, ageGroup],
        );

        if (role === 'student') {
          const educatorResult = await client.query(`SELECT id FROM profiles WHERE role = 'educator' ORDER BY created_at ASC LIMIT 1`);
          const educatorId = educatorResult.rows[0]?.id;
          if (educatorId) {
            await client.query(
              `
                INSERT INTO educator_student_map (educator_id, student_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
              `,
              [educatorId, insertResult.rows[0].id],
            );
          }
        }

        await client.query('COMMIT');
        return insertResult.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    const token = jwt.sign({ id: result.id, email: result.email, role: result.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: result });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'That email is already registered.' });
    }
    return res.status(400).json({ error: error.message || 'Failed to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = validateRequiredString(req.body.email, 'email').toLowerCase();
    const password = validateRequiredString(req.body.password, 'password', { minLength: 8 });
    const result = await pool.query(`SELECT * FROM profiles WHERE email = $1`, [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    delete user.password_hash;
    return res.json({ token, user });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Failed to sign in.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const profile = await getProfileById(req.user.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found.' });
  }
  return res.json({ user: profile });
});

app.get('/api/student/dashboard', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const [profile, sessions, nudges, alerts, modules, baselineRows] = await Promise.all([
      getProfileById(req.user.id),
      getStudentSessions(req.user.id, { limit: 12 }),
      getStudentNudges(req.user.id, { unresolvedOnly: true }),
      getStudentAlerts(req.user.id),
      getStudentTrainingModules(req.user.id),
      getStudentDatasetRows(req.user.id),
    ]);

    res.json(buildStudentDashboardPayload({ profile, sessions, nudges, alerts, modules, baselineRows }));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load student dashboard.' });
  }
});

app.get('/api/student/sessions', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const [sessions, baselineRows] = await Promise.all([
      getStudentSessions(req.user.id, { limit: 25 }),
      getStudentDatasetRows(req.user.id),
    ]);
    const combinedHistory = buildCombinedStudentHistory(baselineRows, sessions);
    res.json({
      sessions,
      summary: buildSessionSummary(takeRecentHistory(combinedHistory, 15)),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load session history.' });
  }
});

app.post('/api/student/sessions', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const subject = validateRequiredString(req.body.subject, 'subject');
    const taskType = validateRequiredString(req.body.taskType, 'taskType');
    const durationMinutes = validateNumber(req.body.durationMin, 'durationMin', { min: 1, max: 720, integer: true });
    const promptsSent = validateNumber(req.body.promptsSent, 'promptsSent', { min: 0, max: 500, integer: true });
    const verificationStatus = normalizeVerificationStatus(req.body.verificationStatus);
    const breaksTaken = validateNumber(req.body.breaksTaken, 'breaksTaken', { min: 0, max: 20, integer: true });
    const eyeDrynessScore = validateNumber(req.body.eyeDrynessScore, 'eyeDrynessScore', { min: 0, max: 10 });
    const neckPainScore = validateNumber(req.body.neckPainScore, 'neckPainScore', { min: 0, max: 10 });

    if (!verificationStatus) {
      throw new Error('verificationStatus must be verified, partial, or unverified.');
    }

    const riskScore = computeRiskScore({
      durationMinutes,
      promptsSent,
      verificationStatus,
      breaksTaken,
      eyeDrynessScore,
      neckPainScore,
    });

    const alertLevel = riskScore >= 70 ? 'high' : riskScore >= 50 ? 'moderate' : null;
    const reasons = [];
    if (verificationStatus === 'unverified') reasons.push('No verification recorded');
    if (durationMinutes >= 90) reasons.push('Long continuous AI session');
    if (eyeDrynessScore >= 6 || neckPainScore >= 6) reasons.push('Physical strain symptoms reported');
    if (!reasons.length && alertLevel) reasons.push('Elevated combined risk score');

    const payload = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const sessionResult = await client.query(
          `
            INSERT INTO student_sessions (
              student_id, subject, task_type, duration_minutes, prompts_sent,
              verification_status, breaks_taken, eye_dryness_score, neck_pain_score, risk_score
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
          `,
          [
            req.user.id,
            subject,
            taskType,
            durationMinutes,
            promptsSent,
            verificationStatus,
            breaksTaken,
            eyeDrynessScore,
            neckPainScore,
            riskScore,
          ],
        );

        let alert = null;
        if (alertLevel) {
          const educatorResult = await client.query(
            `
              SELECT educator_id
              FROM educator_student_map
              WHERE student_id = $1
              ORDER BY created_at ASC
              LIMIT 1
            `,
            [req.user.id],
          );

          const alertResult = await client.query(
            `
              INSERT INTO risk_alerts (
                student_id, educator_id, session_id, risk_score, alert_level, reason, status
              )
              VALUES ($1, $2, $3, $4, $5, $6, 'open')
              RETURNING *
            `,
            [
              req.user.id,
              educatorResult.rows[0]?.educator_id ?? null,
              sessionResult.rows[0].id,
              riskScore,
              alertLevel,
              reasons.join(' • '),
            ],
          );

          alert = alertResult.rows[0];
        }

        await client.query('COMMIT');
        return {
          session: normalizeSessionRow(sessionResult.rows[0]),
          alert,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    res.status(201).json(payload);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to log session.' });
  }
});

app.get('/api/student/nudges', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const nudges = await getStudentNudges(req.user.id);
    res.json({ nudges });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load nudges.' });
  }
});

app.patch('/api/student/nudges/:id', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const status = validateRequiredString(req.body.status, 'status');
    if (!NUDGE_STATUS_VALUES.includes(status) || status === 'sent') {
      throw new Error('status must be read, acknowledged, or resolved.');
    }

    const updated = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const nudgeResult = await client.query(
          `SELECT * FROM nudges WHERE id = $1 AND student_id = $2`,
          [req.params.id, req.user.id],
        );
        const nudge = nudgeResult.rows[0];
        if (!nudge) {
          throw new Error('Nudge not found.');
        }

        const updateFields = ['status = $1'];
        const params = [status, req.params.id, req.user.id];
        if (status === 'read') {
          updateFields.push('read_at = COALESCE(read_at, NOW())');
        }
        if (status === 'acknowledged') {
          updateFields.push('read_at = COALESCE(read_at, NOW())');
          updateFields.push('acknowledged_at = COALESCE(acknowledged_at, NOW())');
        }
        if (status === 'resolved') {
          updateFields.push('read_at = COALESCE(read_at, NOW())');
          updateFields.push('acknowledged_at = COALESCE(acknowledged_at, NOW())');
          updateFields.push('resolved_at = COALESCE(resolved_at, NOW())');
        }

        const updateResult = await client.query(
          `
            UPDATE nudges
            SET ${updateFields.join(', ')}
            WHERE id = $2
              AND student_id = $3
            RETURNING *
          `,
          params,
        );

        if (status === 'resolved' && nudge.alert_id) {
          await client.query(
            `
              UPDATE risk_alerts
              SET status = 'resolved', resolved_at = NOW()
              WHERE id = $1
            `,
            [nudge.alert_id],
          );
        }

        await client.query('COMMIT');
        return updateResult.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    res.json({ nudge: updated });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to update nudge.' });
  }
});

app.get('/api/student/training', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const modules = await getStudentTrainingModules(req.user.id);
    res.json({ modules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load training modules.' });
  }
});

app.post('/api/student/training/:moduleId/attempt', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const moduleId = validateNumber(req.params.moduleId, 'moduleId', { min: 1, integer: true });
    const answers = req.body.answers;
    if (!answers || typeof answers !== 'object') {
      throw new Error('answers must be provided as an object.');
    }

    const questionResult = await pool.query(
      `
        SELECT id, question_order, correct_option
        FROM training_questions
        WHERE module_id = $1
        ORDER BY question_order ASC
      `,
      [moduleId],
    );

    if (!questionResult.rows.length) {
      throw new Error('Training module not found.');
    }

    const totalQuestions = questionResult.rows.length;
    const correctAnswers = questionResult.rows.filter((question) => {
      const submitted = answers[question.id] ?? answers[String(question.question_order)];
      return String(submitted) === String(question.correct_option);
    }).length;

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= 70;

    const progress = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const currentResult = await client.query(
          `
            SELECT *
            FROM training_progress
            WHERE student_id = $1
              AND module_id = $2
          `,
          [req.user.id, moduleId],
        );
        const current = currentResult.rows[0];

        let progressResult;
        if (current) {
          progressResult = await client.query(
            `
              UPDATE training_progress
              SET
                attempts = attempts + 1,
                latest_score = $3,
                best_score = GREATEST(best_score, $3),
                passed = passed OR $4,
                last_answers_json = $5::jsonb,
                completed_at = CASE WHEN $4 THEN NOW() ELSE completed_at END,
                updated_at = NOW()
              WHERE student_id = $1
                AND module_id = $2
              RETURNING *
            `,
            [req.user.id, moduleId, score, passed, JSON.stringify(answers)],
          );
        } else {
          progressResult = await client.query(
            `
              INSERT INTO training_progress (
                student_id, module_id, attempts, latest_score, best_score, passed, last_answers_json, completed_at
              )
              VALUES ($1, $2, 1, $3, $3, $4, $5::jsonb, CASE WHEN $4 THEN NOW() ELSE NULL END)
              RETURNING *
            `,
            [req.user.id, moduleId, score, passed, JSON.stringify(answers)],
          );
        }

        await client.query('COMMIT');
        return progressResult.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    res.json({
      moduleId,
      score,
      passed,
      correctAnswers,
      totalQuestions,
      progress,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to submit training attempt.' });
  }
});

app.get('/api/student/progress', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const [sessions, nudges, modules, baselineRows] = await Promise.all([
      getStudentSessions(req.user.id, { limit: 25 }),
      getStudentNudges(req.user.id),
      getStudentTrainingModules(req.user.id),
      getStudentDatasetRows(req.user.id),
    ]);

    res.json(buildStudentProgressPayload({ sessions, nudges, modules, baselineRows }));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load student progress.' });
  }
});

app.get('/api/educator/dashboard', requireAuth, requireRole('educator'), async (req, res) => {
  try {
    const [roster, alerts, nudges, studentIds, benchmarkRows] = await Promise.all([
      getEducatorRoster(req.user.id),
      getEducatorAlerts(req.user.id),
      getEducatorNudges(req.user.id),
      getEducatorScopedStudentIds(req.user.id),
      getEducatorBenchmarkRows(req.user.id),
    ]);

    const sessionResult = await pool.query(
      `
        SELECT *
        FROM student_sessions
        WHERE student_id = ANY($1::uuid[])
        ORDER BY created_at DESC
        LIMIT 100
      `,
      [studentIds.length ? studentIds : ['00000000-0000-0000-0000-000000000000']],
    );
    const sessions = sessionResult.rows.map(normalizeSessionRow);
    const classTrend = buildCohortTrendSeries(benchmarkRows, sessions, { baselineWindow: 10, liveWindow: 10 });

    res.json({
      summary: {
        assignedStudents: roster.length,
        openAlerts: alerts.filter((alert) => alert.status === 'open').length,
        highRiskStudents: roster.filter((student) => student.average_risk >= 65).length,
        averageVerificationRate: roster.length ? round(average(roster.map((student) => student.verification_rate))) : 0,
      },
      highRiskStudents: roster.slice().sort((a, b) => b.average_risk - a.average_risk).slice(0, 8),
      openAlerts: alerts.filter((alert) => alert.status === 'open').slice(0, 8),
      recentNudges: nudges.slice(0, 8),
      classTrend,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load educator dashboard.' });
  }
});

app.get('/api/educator/roster', requireAuth, requireRole('educator'), async (req, res) => {
  try {
    const roster = await getEducatorRoster(req.user.id, {
      search: req.query.search ? String(req.query.search) : '',
      risk: req.query.risk ? String(req.query.risk) : 'all',
      sort: req.query.sort ? String(req.query.sort) : 'name',
    });
    res.json({ roster });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to load roster.' });
  }
});

app.get('/api/educator/students/:id', requireAuth, requireRole('educator'), async (req, res) => {
  try {
    const allowed = await verifyEducatorStudentAccess(req.user.id, req.params.id);
    if (!allowed) {
      return res.status(404).json({ error: 'Student not found in your cohort.' });
    }

    const [profile, sessions, alerts, nudges, modules, baselineRows] = await Promise.all([
      getProfileById(req.params.id),
      getStudentSessions(req.params.id, { limit: 20 }),
      getStudentAlerts(req.params.id),
      getStudentNudges(req.params.id),
      getStudentTrainingModules(req.params.id),
      getStudentDatasetRows(req.params.id),
    ]);

    res.json({
      profile,
      baseline: computeStudentBaseline(baselineRows),
      sessions,
      alerts,
      nudges,
      nudgeImpact: buildNudgeImpact(nudges, sessions),
      training: modules.map((module) => ({
        id: module.id,
        title: module.title,
        progress: module.progress,
      })),
      summary: buildSessionSummary(takeRecentHistory(buildCombinedStudentHistory(baselineRows, sessions), 10)),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load student detail.' });
  }
});

app.get('/api/educator/alerts', requireAuth, requireRole('educator'), async (req, res) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    if (status && status !== 'all' && !ALERT_STATUS_VALUES.includes(status)) {
      throw new Error('status must be open, acknowledged, resolved, or all.');
    }
    const alerts = await getEducatorAlerts(req.user.id, { status });
    res.json({ alerts });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to load alerts.' });
  }
});

app.patch('/api/educator/alerts/:id', requireAuth, requireRole('educator'), async (req, res) => {
  try {
    const status = validateRequiredString(req.body.status, 'status');
    if (!ALERT_STATUS_VALUES.includes(status)) {
      throw new Error('status must be open, acknowledged, or resolved.');
    }

    const updated = await pool.query(
      `
        UPDATE risk_alerts ra
        SET
          status = $1,
          resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE ra.resolved_at END
        FROM educator_student_map map
        WHERE ra.id = $2
          AND map.student_id = ra.student_id
          AND map.educator_id = $3
        RETURNING ra.*
      `,
      [status, req.params.id, req.user.id],
    );

    if (!updated.rows[0]) {
      return res.status(404).json({ error: 'Alert not found.' });
    }

    res.json({ alert: updated.rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to update alert.' });
  }
});

app.get('/api/educator/nudges', requireAuth, requireRole('educator'), async (req, res) => {
  try {
    const nudges = await getEducatorNudges(req.user.id);
    res.json({ nudges });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load nudges.' });
  }
});

app.post('/api/educator/nudges', requireAuth, requireRole('educator'), async (req, res) => {
  try {
    const studentId = validateRequiredString(req.body.student_id, 'student_id');
    const nudgeType = validateRequiredString(req.body.nudge_type, 'nudge_type');
    const message = validateRequiredString(req.body.message, 'message', { minLength: 5 });
    const alertId = req.body.alert_id ? String(req.body.alert_id) : null;

    const allowed = await verifyEducatorStudentAccess(req.user.id, studentId);
    if (!allowed) {
      return res.status(404).json({ error: 'Student not found in your cohort.' });
    }

    const result = await pool.query(
      `
        INSERT INTO nudges (educator_id, student_id, alert_id, nudge_type, message, status)
        VALUES ($1, $2, $3, $4, $5, 'sent')
        RETURNING *
      `,
      [req.user.id, studentId, alertId, nudgeType, message],
    );

    res.status(201).json({ nudge: result.rows[0] });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to create nudge.' });
  }
});

app.get('/api/educator/trends', requireAuth, requireRole('educator'), async (req, res) => {
  try {
    const [studentIds, benchmarkRows, nudges] = await Promise.all([
      getEducatorScopedStudentIds(req.user.id),
      getEducatorBenchmarkRows(req.user.id),
      getEducatorNudges(req.user.id),
    ]);

    const sessionResult = await pool.query(
      `
        SELECT *
        FROM student_sessions
        WHERE student_id = ANY($1::uuid[])
        ORDER BY created_at ASC
      `,
      [studentIds.length ? studentIds : ['00000000-0000-0000-0000-000000000000']],
    );

    const sessions = sessionResult.rows.map(normalizeSessionRow);
    const baseline = computeAnalystDashboard(benchmarkRows.filter((row) => row.phase === 'AS-IS'));
    const trendSeries = buildCohortTrendSeries(benchmarkRows, sessions, { baselineWindow: 14, liveWindow: 14 });

    res.json({
      benchmark: baseline.heroStats,
      verificationTrend: trendSeries.map((item) => ({
        ...item,
        benchmarkVerification: baseline.heroStats.avgVerificationRate,
      })),
      symptomTrend: trendSeries.map((item) => ({
        ...item,
        benchmarkEyeDryness: baseline.heroStats.avgEyeDryness,
      })),
      riskTrend: trendSeries,
      nudgeImpact: nudges
        .filter((nudge) => nudge.impact)
        .map((nudge) => ({
          id: nudge.id,
          studentName: nudge.student_name,
          status: nudge.status,
          improvement: round((nudge.impact?.improvement ?? 0) * 100),
        })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load cohort trends.' });
  }
});

app.get('/api/analyst/dashboard', requireAuth, requireRole('analyst'), async (req, res) => {
  try {
    const filters = buildMetricFilters(req.query);
    const rows = await fetchMetricRows(filters);
    res.json({
      filters,
      rowCount: rows.length,
      dashboard: computeAnalystDashboard(rows),
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to load analyst dashboard.' });
  }
});

// Public comparison — no auth required (used for assignment Part 3 link)
app.get('/api/public/comparison', async (_req, res) => {
  try {
    const rows = await fetchMetricRows();
    const comparison = computeAnalystComparison(rows);
    const kpis = computeAnalystKpis(rows);
    res.json({ comparison, kpis });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load comparison data.' });
  }
});

app.get('/api/analyst/comparison', requireAuth, requireRole('analyst'), async (req, res) => {
  try {
    const filters = buildMetricFilters(req.query, { includePhase: false });
    const rows = await fetchMetricRows(filters);
    res.json({
      filters,
      comparison: computeAnalystComparison(rows),
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to load analyst comparison.' });
  }
});

app.get('/api/analyst/kpis', requireAuth, requireRole('analyst'), async (req, res) => {
  try {
    const filters = buildMetricFilters(req.query, { includePhase: false });
    const rows = await fetchMetricRows(filters);
    res.json({
      filters,
      kpis: computeAnalystKpis(rows),
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to load analyst KPIs.' });
  }
});

// Serve built frontend and SPA fallback (non-Vercel / local production)
if (process.env.VERCEL !== '1') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start HTTP server only when running directly (not as Vercel serverless)
if (process.env.VERCEL !== '1') {
  app.listen(port, async () => {
    try {
      await testConnection();
      console.log(`Eastbrook API connected and listening on ${port}.`);
    } catch (error) {
      console.error('Eastbrook API started, but the database connection failed.');
      console.error(error);
    }
  });
}

export default app;
