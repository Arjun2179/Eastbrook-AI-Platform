import bcrypt from 'bcryptjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, withClient } from './db.js';
import { TRAINING_CATALOG } from './trainingCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '..', '..', 'Arjun', 'synthetic_eastbrook_user_day.csv');
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Password123!';

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Avery', 'Riley', 'Morgan', 'Parker', 'Logan', 'Skyler',
  'Bella', 'Carlos', 'Diana', 'Ethan', 'Fatima', 'Gabriel', 'Hannah', 'Ivan', 'Jasmine', 'Kai',
  'Luna', 'Marcus', 'Nadia', 'Omar', 'Priya', 'Rafael', 'Sofia', 'Theo', 'Uma', 'Victor',
  'Willow', 'Xander', 'Yara', 'Zara', 'Aaron', 'Bianca', 'Connor', 'Demi', 'Elijah', 'Faith',
  'Grant', 'Holly', 'Imani', 'Jaxon', 'Kira', 'Liam', 'Maya', 'Nash', 'Olivia', 'Remy',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor',
  'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Clark', 'Lewis', 'Walker',
  'Patel', 'Kumar', 'Singh', 'Ali', 'Khan', 'Zhang', 'Wang', 'Li', 'Chen', 'Liu',
];

function normalizeBool(value) {
  return value === '1' || value === 'true' || value === true;
}

function parseCsvLine(line) {
  return line.split(',').map((value) => value.trim());
}

function loadDatasetRowsFromCsv(rawCsv) {
  const lines = rawCsv.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return row;
  });
}

function toMetricRecord(row) {
  return {
    dataset_user_key: Number(row.user_id),
    day: Number(row.day),
    phase: row.phase,
    age_group: row.age_group,
    verification_nudge: normalizeBool(row.verification_nudge),
    interaction_limit: normalizeBool(row.interaction_limit),
    persuasive_notifications_reduced: normalizeBool(row.persuasive_notifications_reduced),
    ai_unavailable: normalizeBool(row.ai_unavailable),
    ai_prompts_per_day: Number(row.ai_prompts_per_day),
    micro_checks_per_day: Number(row.micro_checks_per_day),
    screen_time_hours: Number(row.screen_time_hours),
    continuous_use_minutes: Number(row.continuous_use_minutes),
    breaks_taken: Number(row.breaks_taken),
    verification_complexity: Number(row.verification_complexity),
    verification_rate: Number(row.verification_rate),
    reliance_type: row.reliance_type,
    accept_without_verification: normalizeBool(row.accept_without_verification),
    error_rate: Number(row.error_rate),
    decision_latency_seconds: Number(row.decision_latency_seconds),
    decision_latency_with_ai_sec: Number(row.decision_latency_with_ai_sec),
    decision_latency_without_ai_sec: Number(row.decision_latency_without_ai_sec),
    confidence_without_ai: Number(row.confidence_without_ai),
    eye_dryness_score: Number(row.eye_dryness_score),
    neck_pain_score: Number(row.neck_pain_score),
    headaches_per_week: Number(row.headaches_per_week),
    ai_for_social_messages: normalizeBool(row.ai_for_social_messages),
    mood_checkins: Number(row.mood_checkins),
    emotional_support_requests: Number(row.emotional_support_requests),
    serious_topics_with_ai: normalizeBool(row.serious_topics_with_ai),
    pii_shared: normalizeBool(row.pii_shared),
    harmful_exposure_count: Number(row.harmful_exposure_count),
    ai_reliance_baseline: Number(row.ai_reliance_baseline),
    planning_skill: Number(row.planning_skill),
    online_intensity: Number(row.online_intensity),
  };
}

export async function loadDatasetRows() {
  const csv = await readFile(CSV_PATH, 'utf8');
  return loadDatasetRowsFromCsv(csv).map(toMetricRecord);
}

function buildStudentIdentity(datasetUserKey, ageGroup) {
  const firstName = FIRST_NAMES[(datasetUserKey - 1) % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor((datasetUserKey - 1) / FIRST_NAMES.length) % LAST_NAMES.length];
  const fullName = `${firstName} ${lastName}`;
  const email = `${firstName}.${lastName}${datasetUserKey}`.toLowerCase().replace(/[^a-z0-9.@]/g, '') + '@eastbrook.edu';
  const gradeOptions = ageGroup === '13-14' ? ['8', '9'] : ['10', '11', '12'];
  const grade = gradeOptions[(datasetUserKey - 1) % gradeOptions.length];
  return { fullName, email, grade };
}

async function dropLegacyObjects(client) {
  await client.query(`
    DROP TABLE IF EXISTS analytics_data CASCADE;
    DROP TABLE IF EXISTS sessions CASCADE;
    DROP TABLE IF EXISTS student_sessions CASCADE;
    DROP TABLE IF EXISTS nudges CASCADE;
    DROP TABLE IF EXISTS risk_alerts CASCADE;
    DROP TABLE IF EXISTS training_progress CASCADE;
    DROP TABLE IF EXISTS training_questions CASCADE;
    DROP TABLE IF EXISTS training_modules CASCADE;
    DROP TABLE IF EXISTS educator_student_map CASCADE;
    DROP TABLE IF EXISTS student_day_metrics CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
  `);
}

async function createTables(client) {
  await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await client.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student', 'educator', 'analyst')),
      grade TEXT,
      age_group TEXT,
      avatar_url TEXT,
      dataset_user_key INTEGER UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS educator_student_map (
      educator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (educator_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS student_day_metrics (
      dataset_user_key INTEGER NOT NULL,
      day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 30),
      phase TEXT NOT NULL CHECK (phase IN ('AS-IS', 'TO-BE')),
      age_group TEXT NOT NULL,
      verification_nudge BOOLEAN NOT NULL DEFAULT FALSE,
      interaction_limit BOOLEAN NOT NULL DEFAULT FALSE,
      persuasive_notifications_reduced BOOLEAN NOT NULL DEFAULT FALSE,
      ai_unavailable BOOLEAN NOT NULL DEFAULT FALSE,
      ai_prompts_per_day INTEGER NOT NULL DEFAULT 0,
      micro_checks_per_day INTEGER NOT NULL DEFAULT 0,
      screen_time_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
      continuous_use_minutes NUMERIC(6,1) NOT NULL DEFAULT 0,
      breaks_taken INTEGER NOT NULL DEFAULT 0,
      verification_complexity INTEGER NOT NULL DEFAULT 0,
      verification_rate NUMERIC(5,3) NOT NULL DEFAULT 0,
      reliance_type TEXT NOT NULL CHECK (reliance_type IN ('overreliance', 'appropriate', 'underreliance')),
      accept_without_verification BOOLEAN NOT NULL DEFAULT FALSE,
      error_rate NUMERIC(5,3) NOT NULL DEFAULT 0,
      decision_latency_seconds NUMERIC(8,2) NOT NULL DEFAULT 0,
      decision_latency_with_ai_sec NUMERIC(8,2) NOT NULL DEFAULT 0,
      decision_latency_without_ai_sec NUMERIC(8,2) NOT NULL DEFAULT 0,
      confidence_without_ai NUMERIC(5,2) NOT NULL DEFAULT 0,
      eye_dryness_score NUMERIC(5,2) NOT NULL DEFAULT 0,
      neck_pain_score NUMERIC(5,2) NOT NULL DEFAULT 0,
      headaches_per_week INTEGER NOT NULL DEFAULT 0,
      ai_for_social_messages BOOLEAN NOT NULL DEFAULT FALSE,
      mood_checkins INTEGER NOT NULL DEFAULT 0,
      emotional_support_requests INTEGER NOT NULL DEFAULT 0,
      serious_topics_with_ai BOOLEAN NOT NULL DEFAULT FALSE,
      pii_shared BOOLEAN NOT NULL DEFAULT FALSE,
      harmful_exposure_count INTEGER NOT NULL DEFAULT 0,
      ai_reliance_baseline NUMERIC(5,2) NOT NULL DEFAULT 0,
      planning_skill NUMERIC(5,2) NOT NULL DEFAULT 0,
      online_intensity NUMERIC(5,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (dataset_user_key, day)
    );

    CREATE TABLE IF NOT EXISTS training_modules (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      accent_color TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      slides_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS training_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id INTEGER NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
      question_order INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      correct_option TEXT NOT NULL,
      explanation TEXT,
      UNIQUE (module_id, question_order)
    );

    CREATE TABLE IF NOT EXISTS training_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      module_id INTEGER NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
      attempts INTEGER NOT NULL DEFAULT 0,
      latest_score INTEGER NOT NULL DEFAULT 0,
      best_score INTEGER NOT NULL DEFAULT 0,
      passed BOOLEAN NOT NULL DEFAULT FALSE,
      last_answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      completed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (student_id, module_id)
    );

    CREATE TABLE IF NOT EXISTS student_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      task_type TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
      prompts_sent INTEGER NOT NULL CHECK (prompts_sent >= 0),
      verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'partial', 'unverified')),
      breaks_taken INTEGER NOT NULL DEFAULT 0 CHECK (breaks_taken >= 0),
      eye_dryness_score NUMERIC(4,1) NOT NULL DEFAULT 0,
      neck_pain_score NUMERIC(4,1) NOT NULL DEFAULT 0,
      risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS risk_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      educator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      session_id UUID REFERENCES student_sessions(id) ON DELETE SET NULL,
      risk_score INTEGER NOT NULL,
      alert_level TEXT NOT NULL CHECK (alert_level IN ('moderate', 'high')),
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS nudges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      educator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      alert_id UUID REFERENCES risk_alerts(id) ON DELETE SET NULL,
      nudge_type TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'read', 'acknowledged', 'resolved')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read_at TIMESTAMPTZ,
      acknowledged_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
    CREATE INDEX IF NOT EXISTS idx_profiles_dataset_user_key ON profiles(dataset_user_key);
    CREATE INDEX IF NOT EXISTS idx_metrics_phase ON student_day_metrics(phase);
    CREATE INDEX IF NOT EXISTS idx_metrics_age_group ON student_day_metrics(age_group);
    CREATE INDEX IF NOT EXISTS idx_metrics_reliance_type ON student_day_metrics(reliance_type);
    CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON student_sessions(student_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON student_sessions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_student_status ON risk_alerts(student_id, status);
    CREATE INDEX IF NOT EXISTS idx_nudges_student_status ON nudges(student_id, status);
  `);
}

export async function ensureSchema({ reset = false } = {}) {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      if (reset) {
        await dropLegacyObjects(client);
      }
      await createTables(client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function seedBaseUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query(
        `
          INSERT INTO profiles (email, password_hash, full_name, role)
          VALUES
            ('educator@eastbrook.edu', $1, 'Dr. Sarah Smith', 'educator'),
            ('analyst@eastbrook.edu', $1, 'Jamie Rodriguez', 'analyst')
          ON CONFLICT (email)
          DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role
        `,
        [passwordHash],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function seedStudentProfiles(datasetRows) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const ageGroupByUser = new Map();

  for (const row of datasetRows) {
    if (!ageGroupByUser.has(row.dataset_user_key)) {
      ageGroupByUser.set(row.dataset_user_key, row.age_group);
    }
  }

  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const studentEntries = [...ageGroupByUser.entries()];
      const batchSize = 200;

      for (let start = 0; start < studentEntries.length; start += batchSize) {
        const batch = studentEntries.slice(start, start + batchSize);
        const params = [];
        const placeholders = batch.map(([datasetUserKey, ageGroup], rowIndex) => {
          const student = buildStudentIdentity(datasetUserKey, ageGroup);
          const values = [student.email, passwordHash, student.fullName, student.grade, ageGroup, datasetUserKey];
          params.push(...values);
          const offset = rowIndex * values.length;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, 'student', $${offset + 4}, $${offset + 5}, $${offset + 6})`;
        });

        await client.query(
          `
            INSERT INTO profiles (email, password_hash, full_name, role, grade, age_group, dataset_user_key)
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (dataset_user_key)
            DO UPDATE SET
              email = EXCLUDED.email,
              password_hash = EXCLUDED.password_hash,
              full_name = EXCLUDED.full_name,
              grade = EXCLUDED.grade,
              age_group = EXCLUDED.age_group
          `,
          params,
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function seedEducatorMappings() {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const educatorResult = await client.query(`SELECT id FROM profiles WHERE role = 'educator' ORDER BY created_at ASC LIMIT 1`);
      const educatorId = educatorResult.rows[0]?.id;

      if (!educatorId) {
        throw new Error('Cannot assign students without an educator account.');
      }

      await client.query('DELETE FROM educator_student_map');
      await client.query(`
        INSERT INTO educator_student_map (educator_id, student_id)
        SELECT $1, id
        FROM profiles
        WHERE role = 'student'
      `, [educatorId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function seedTrainingCatalog() {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('DELETE FROM training_questions');
      await client.query('DELETE FROM training_modules');

      for (const [index, module] of TRAINING_CATALOG.entries()) {
        await client.query(
          `
            INSERT INTO training_modules (
              id, slug, title, description, icon, accent_color, duration_minutes, order_index, slides_json
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
          `,
          [
            module.id,
            module.slug,
            module.title,
            module.description,
            module.icon,
            module.accentColor,
            module.durationMinutes,
            index + 1,
            JSON.stringify(module.slides),
          ],
        );

        for (const question of module.quiz) {
          await client.query(
            `
              INSERT INTO training_questions (
                module_id, question_order, prompt, options_json, correct_option, explanation
              )
              VALUES ($1, $2, $3, $4::jsonb, $5, $6)
            `,
            [
              module.id,
              module.quiz.indexOf(question) + 1,
              question.question,
              JSON.stringify(question.options),
              String(question.correct),
              question.explanation,
            ],
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function importDataset(datasetRows) {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      await client.query('DELETE FROM student_day_metrics');
      const columnsPerRow = 34;
      const batchSize = 250;

      for (let start = 0; start < datasetRows.length; start += batchSize) {
        const batch = datasetRows.slice(start, start + batchSize);
        const params = [];
        const placeholders = batch.map((row, rowIndex) => {
          const values = [
            row.dataset_user_key,
            row.day,
            row.phase,
            row.age_group,
            row.verification_nudge,
            row.interaction_limit,
            row.persuasive_notifications_reduced,
            row.ai_unavailable,
            row.ai_prompts_per_day,
            row.micro_checks_per_day,
            row.screen_time_hours,
            row.continuous_use_minutes,
            row.breaks_taken,
            row.verification_complexity,
            row.verification_rate,
            row.reliance_type,
            row.accept_without_verification,
            row.error_rate,
            row.decision_latency_seconds,
            row.decision_latency_with_ai_sec,
            row.decision_latency_without_ai_sec,
            row.confidence_without_ai,
            row.eye_dryness_score,
            row.neck_pain_score,
            row.headaches_per_week,
            row.ai_for_social_messages,
            row.mood_checkins,
            row.emotional_support_requests,
            row.serious_topics_with_ai,
            row.pii_shared,
            row.harmful_exposure_count,
            row.ai_reliance_baseline,
            row.planning_skill,
            row.online_intensity,
          ];
          params.push(...values);
          const offset = rowIndex * columnsPerRow;
          return `(${values.map((_, valueIndex) => `$${offset + valueIndex + 1}`).join(', ')})`;
        });

        await client.query(
          `
            INSERT INTO student_day_metrics (
              dataset_user_key, day, phase, age_group, verification_nudge, interaction_limit,
              persuasive_notifications_reduced, ai_unavailable, ai_prompts_per_day, micro_checks_per_day,
              screen_time_hours, continuous_use_minutes, breaks_taken, verification_complexity,
              verification_rate, reliance_type, accept_without_verification, error_rate,
              decision_latency_seconds, decision_latency_with_ai_sec, decision_latency_without_ai_sec,
              confidence_without_ai, eye_dryness_score, neck_pain_score, headaches_per_week,
              ai_for_social_messages, mood_checkins, emotional_support_requests, serious_topics_with_ai,
              pii_shared, harmful_exposure_count, ai_reliance_baseline, planning_skill, online_intensity
            )
            VALUES ${placeholders.join(', ')}
          `,
          params,
        );

        if ((start + batch.length) % 1000 === 0 || start + batch.length === datasetRows.length) {
          console.log(`Imported ${start + batch.length}/${datasetRows.length} metric rows...`);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

export async function getSetupSummary() {
  const profileCount = await pool.query(`SELECT role, COUNT(*)::int AS count FROM profiles GROUP BY role ORDER BY role`);
  const metricCount = await pool.query(`SELECT COUNT(*)::int AS count FROM student_day_metrics`);
  const firstStudent = await pool.query(`
    SELECT email, full_name
    FROM profiles
    WHERE role = 'student'
    ORDER BY dataset_user_key ASC
    LIMIT 1
  `);

  return {
    demoPassword: DEMO_PASSWORD,
    roles: profileCount.rows,
    metricCount: metricCount.rows[0]?.count ?? 0,
    firstStudent: firstStudent.rows[0] ?? null,
  };
}

export async function initializeDatabase({ reset = true } = {}) {
  console.log('Loading Eastbrook dataset from CSV...');
  const datasetRows = await loadDatasetRows();
  console.log('Preparing database schema...');
  await ensureSchema({ reset });
  console.log('Seeding educator and analyst accounts...');
  await seedBaseUsers();
  console.log('Seeding student profiles and cohort mappings...');
  await seedStudentProfiles(datasetRows);
  await seedEducatorMappings();
  console.log('Seeding training catalog...');
  await seedTrainingCatalog();
  console.log(`Importing ${datasetRows.length} student-day rows...`);
  await importDataset(datasetRows);
  return getSetupSummary();
}
