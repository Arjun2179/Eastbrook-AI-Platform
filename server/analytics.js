const NUMERIC_FIELDS = [
  'dataset_user_key',
  'day',
  'ai_prompts_per_day',
  'micro_checks_per_day',
  'screen_time_hours',
  'continuous_use_minutes',
  'breaks_taken',
  'verification_complexity',
  'verification_rate',
  'error_rate',
  'decision_latency_seconds',
  'decision_latency_with_ai_sec',
  'decision_latency_without_ai_sec',
  'confidence_without_ai',
  'eye_dryness_score',
  'neck_pain_score',
  'headaches_per_week',
  'mood_checkins',
  'emotional_support_requests',
  'harmful_exposure_count',
  'ai_reliance_baseline',
  'planning_skill',
  'online_intensity',
];

const RELIANCE_LABELS = [
  { key: 'overreliance', label: 'Over-reliant' },
  { key: 'appropriate', label: 'Appropriate' },
  { key: 'underreliance', label: 'Under-reliant' },
];

const SESSION_BUCKETS = [
  { label: '< 60 min', min: 0, max: 60 },
  { label: '60–120 min', min: 60, max: 120 },
  { label: '120–180 min', min: 120, max: 180 },
  { label: '> 180 min', min: 180, max: Number.POSITIVE_INFINITY },
];

const BREAK_BUCKETS = [
  { label: '0 Breaks', min: 0, max: 1 },
  { label: '1 Break', min: 1, max: 2 },
  { label: '2 Breaks', min: 2, max: 3 },
  { label: '3+ Breaks', min: 3, max: Number.POSITIVE_INFINITY },
];

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function r1(value) {
  return Math.round(value * 10) / 10;
}

function r2(value) {
  return Math.round(value * 100) / 100;
}

function r3(value) {
  return Math.round(value * 1000) / 1000;
}

function seededRandom(seed) {
  let current = seed;
  return () => {
    current = (current * 16807) % 2147483647;
    return current / 2147483647;
  };
}

function shuffle(values) {
  const next = seededRandom(42);
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(next() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function scoreVerification(status) {
  if (status === 'verified' || status === 'yes') return 1;
  if (status === 'partial') return 0.5;
  return 0;
}

export function computeRiskScore({
  durationMinutes,
  promptsSent,
  verificationStatus,
  breaksTaken,
  eyeDrynessScore,
  neckPainScore,
}) {
  let score = durationMinutes * 0.3 + promptsSent * 0.15;
  if (verificationStatus === 'unverified') score += 25;
  else if (verificationStatus === 'partial') score += 10;

  score += Math.max(0, eyeDrynessScore - 4) * 3;
  score += Math.max(0, neckPainScore - 4) * 3;
  score -= Math.min(breaksTaken, 5) * 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function normalizeMetricRow(row) {
  const normalized = { ...row };
  for (const key of NUMERIC_FIELDS) {
    if (normalized[key] !== null && normalized[key] !== undefined) {
      normalized[key] = Number(normalized[key]);
    }
  }
  return normalized;
}

function computeStats(rows) {
  const days = [...new Set(rows.map((row) => row.day))].sort((a, b) => a - b);
  const dailyTotals = days.map((day) => {
    const dayRows = rows.filter((row) => row.day === day);
    return {
      day,
      label: `D${day}`,
      totalPrompts: Math.round(dayRows.reduce((sum, row) => sum + row.ai_prompts_per_day, 0)),
      avgPrompts: r1(avg(dayRows.map((row) => row.ai_prompts_per_day))),
      avgVerification: r3(avg(dayRows.map((row) => row.verification_rate))),
    };
  });

  const avgVerificationRate = Math.round(avg(rows.map((row) => row.verification_rate)) * 1000) / 10;
  const heroStats = {
    totalDailyPrompts: Math.round(avg(dailyTotals.map((row) => row.totalPrompts))),
    avgScreenTime: r1(avg(rows.map((row) => row.screen_time_hours))),
    avgVerificationRate,
    avgEyeDryness: r1(avg(rows.map((row) => row.eye_dryness_score))),
  };

  const waffle = {
    verified: Math.round(avgVerificationRate),
    unverified: 100 - Math.round(avgVerificationRate),
  };

  const slope = [1, 2, 3].map((complexity) => {
    const complexityRows = rows.filter((row) => row.verification_complexity === complexity);
    return {
      complexity,
      label: complexity === 1 ? 'Low' : complexity === 2 ? 'Medium' : 'High',
      verificationRate: Math.round(avg(complexityRows.map((row) => row.verification_rate)) * 1000) / 10,
    };
  });

  const sessionBuckets = SESSION_BUCKETS.map((bucket) => {
    const bucketRows = rows.filter(
      (row) => row.continuous_use_minutes >= bucket.min && row.continuous_use_minutes < bucket.max,
    );
    return {
      label: bucket.label,
      eyeDryness: bucketRows.length ? r1(avg(bucketRows.map((row) => row.eye_dryness_score))) : 0,
      neckPain: bucketRows.length ? r1(avg(bucketRows.map((row) => row.neck_pain_score))) : 0,
      headaches: bucketRows.length ? r2(avg(bucketRows.map((row) => row.headaches_per_week))) : 0,
      count: bucketRows.length,
    };
  });

  const breaksBuckets = BREAK_BUCKETS.map((bucket) => {
    const bucketRows = rows.filter((row) => row.breaks_taken >= bucket.min && row.breaks_taken < bucket.max);
    return {
      label: bucket.label,
      eyeDryness: bucketRows.length ? r1(avg(bucketRows.map((row) => row.eye_dryness_score))) : 0,
      neckPain: bucketRows.length ? r1(avg(bucketRows.map((row) => row.neck_pain_score))) : 0,
      headaches: bucketRows.length ? r2(avg(bucketRows.map((row) => row.headaches_per_week))) : 0,
      count: bucketRows.length,
    };
  });

  const latencyComparison = RELIANCE_LABELS.map(({ key, label }) => {
    const relianceRows = rows.filter((row) => row.reliance_type === key);
    return {
      group: label,
      key,
      withAI: relianceRows.length ? Math.round(avg(relianceRows.map((row) => row.decision_latency_with_ai_sec))) : 0,
      withoutAI: relianceRows.length ? Math.round(avg(relianceRows.map((row) => row.decision_latency_without_ai_sec))) : 0,
      gap: relianceRows.length
        ? Math.round(avg(relianceRows.map((row) => row.decision_latency_without_ai_sec - row.decision_latency_with_ai_sec)))
        : 0,
    };
  });

  const cognitiveByReliance = RELIANCE_LABELS.map(({ key, label }) => {
    const relianceRows = rows.filter((row) => row.reliance_type === key);
    return {
      group: label,
      key,
      planningSkill: relianceRows.length ? r2(avg(relianceRows.map((row) => row.planning_skill))) : 0,
      confidenceWithoutAI: relianceRows.length ? r2(avg(relianceRows.map((row) => row.confidence_without_ai))) : 0,
      errorRate: relianceRows.length ? r2(avg(relianceRows.map((row) => row.error_rate))) : 0,
      acceptWithoutVerify: relianceRows.length
        ? r3(avg(relianceRows.map((row) => Number(Boolean(row.accept_without_verification)))))
        : 0,
    };
  });

  const socialByReliance = RELIANCE_LABELS.map(({ key, label }) => {
    const relianceRows = rows.filter((row) => row.reliance_type === key);
    const total = relianceRows.length || 1;
    return {
      group: label,
      key,
      moodCheckins: relianceRows.length ? r2(avg(relianceRows.map((row) => row.mood_checkins))) : 0,
      emotionalSupport: relianceRows.length ? r2(avg(relianceRows.map((row) => row.emotional_support_requests))) : 0,
      socialMessaging: Math.round((relianceRows.filter((row) => Boolean(row.ai_for_social_messages)).length / total) * 100),
      seriousTopics: Math.round((relianceRows.filter((row) => Boolean(row.serious_topics_with_ai)).length / total) * 100),
      piiShared: Math.round((relianceRows.filter((row) => Boolean(row.pii_shared)).length / total) * 100),
      harmfulExposure: relianceRows.length ? r2(avg(relianceRows.map((row) => row.harmful_exposure_count))) : 0,
    };
  });

  const studentDominant = {};
  for (const row of rows) {
    if (!studentDominant[row.dataset_user_key]) studentDominant[row.dataset_user_key] = {};
    studentDominant[row.dataset_user_key][row.reliance_type] =
      (studentDominant[row.dataset_user_key][row.reliance_type] || 0) + 1;
  }
  const dominantCounts = { overreliance: 0, appropriate: 0, underreliance: 0 };
  for (const counts of Object.values(studentDominant)) {
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (dominant) dominantCounts[dominant] += 1;
  }

  const relianceDist = [
    { label: 'Appropriate', key: 'appropriate', count: dominantCounts.appropriate || 0 },
    { label: 'Over-reliant', key: 'overreliance', count: dominantCounts.overreliance || 0 },
    { label: 'Under-reliant', key: 'underreliance', count: dominantCounts.underreliance || 0 },
  ];

  const packedBubble = [
    {
      label: 'Social Messaging',
      value: Math.round((rows.filter((row) => Boolean(row.ai_for_social_messages)).length / rows.length) * 1000) / 10,
      unit: '% of student-days',
      description: 'AI used for personal/social messages',
      color: '#DB2777',
    },
    {
      label: 'Serious Topics',
      value: Math.round((rows.filter((row) => Boolean(row.serious_topics_with_ai)).length / rows.length) * 1000) / 10,
      unit: '% of student-days',
      description: 'AI consulted on serious life topics',
      color: '#9333EA',
    },
    {
      label: 'PII Shared',
      value: Math.round((rows.filter((row) => Boolean(row.pii_shared)).length / rows.length) * 1000) / 10,
      unit: '% of student-days',
      description: 'Personal info shared with AI',
      color: '#DC2626',
    },
    {
      label: 'Mood Check-ins',
      value: r2(avg(rows.map((row) => row.mood_checkins))),
      unit: 'avg/day',
      description: 'Daily emotional check-ins via AI',
      color: '#D97706',
    },
    {
      label: 'Emotional Support',
      value: r2(avg(rows.map((row) => row.emotional_support_requests))),
      unit: 'req/day',
      description: 'Support requests sent to AI',
      color: '#2563EB',
    },
  ];

  const screenVsEye = shuffle(rows).slice(0, 500).map((row) => ({
    screenTime: r1(row.screen_time_hours),
    eyeDryness: r1(row.eye_dryness_score),
    reliance: row.reliance_type,
    ageGroup: row.age_group,
  }));

  const verifyVsError = shuffle(rows).slice(0, 400).map((row) => ({
    verificationRate: Math.round(row.verification_rate * 100),
    errorRate: Math.round(row.error_rate * 1000) / 10,
    reliance: row.reliance_type,
  }));

  const ageComparison = ['13-14', '15-17'].map((ageKey) => {
    const ageRows = rows.filter((row) => row.age_group === ageKey);
    return {
      group: ageKey === '13-14' ? 'Ages 13-14' : 'Ages 15-17',
      ageKey,
      avgScreenTime: ageRows.length ? r1(avg(ageRows.map((row) => row.screen_time_hours))) : 0,
      avgContinuousUseHrs: ageRows.length ? r1(avg(ageRows.map((row) => row.continuous_use_minutes)) / 60) : 0,
      avgPromptsPerDay: ageRows.length ? Math.round(avg(ageRows.map((row) => row.ai_prompts_per_day))) : 0,
      count: ageRows.length,
    };
  });

  return {
    heroStats,
    dailyTotals,
    waffle,
    slope,
    sessionBuckets,
    breaksBuckets,
    latencyComparison,
    cognitiveByReliance,
    socialByReliance,
    relianceDist,
    packedBubble,
    screenVsEye,
    verifyVsError,
    ageComparison,
  };
}

function computePhysicalStrainIndex(rows) {
  return r2(avg(rows.filter((row) => row.screen_time_hours > 0).map((row) => ((row.eye_dryness_score + row.neck_pain_score) / 2) / row.screen_time_hours)));
}

function computeAutomationBiasRate(rows) {
  return r1(avg(rows.map((row) => (1 - row.verification_rate) * 100)));
}

function computeNudgeSuccessRate(asIsRows, toBeRows) {
  const nudgeRows = toBeRows.filter((row) => Boolean(row.verification_nudge));
  if (!asIsRows.length || !nudgeRows.length) return 0;
  const before = avg(asIsRows.map((row) => row.verification_rate));
  const after = avg(nudgeRows.map((row) => row.verification_rate));
  if (before === 0) return 0;
  return r1(((after - before) / before) * 100);
}

export function computeAnalystDashboard(rows) {
  return computeStats(rows);
}

export function computeAnalystComparison(allRows) {
  const asIsRows = allRows.filter((row) => row.phase === 'AS-IS');
  const toBeRows = allRows.filter((row) => row.phase === 'TO-BE');
  const asIsStats = computeStats(asIsRows);
  const toBeStats = computeStats(toBeRows);
  const automationBiasAsIs = computeAutomationBiasRate(asIsRows);
  const automationBiasToBe = computeAutomationBiasRate(toBeRows);
  const physicalStrainAsIs = computePhysicalStrainIndex(asIsRows);
  const physicalStrainToBe = computePhysicalStrainIndex(toBeRows);

  const overview = {
    asIs: { ...asIsStats.heroStats, automationBiasRate: automationBiasAsIs, physicalStrainIndex: physicalStrainAsIs },
    toBe: { ...toBeStats.heroStats, automationBiasRate: automationBiasToBe, physicalStrainIndex: physicalStrainToBe },
  };

  const comparisons = [
    {
      key: 'verification',
      label: 'Verification Rate',
      asIs: asIsStats.heroStats.avgVerificationRate,
      toBe: toBeStats.heroStats.avgVerificationRate,
      unit: '%',
      delta: r1(toBeStats.heroStats.avgVerificationRate - asIsStats.heroStats.avgVerificationRate),
    },
    {
      key: 'screenTime',
      label: 'Screen Time',
      asIs: asIsStats.heroStats.avgScreenTime,
      toBe: toBeStats.heroStats.avgScreenTime,
      unit: 'hrs',
      delta: r1(toBeStats.heroStats.avgScreenTime - asIsStats.heroStats.avgScreenTime),
    },
    {
      key: 'eyeDryness',
      label: 'Eye Dryness',
      asIs: asIsStats.heroStats.avgEyeDryness,
      toBe: toBeStats.heroStats.avgEyeDryness,
      unit: '/10',
      delta: r1(toBeStats.heroStats.avgEyeDryness - asIsStats.heroStats.avgEyeDryness),
    },
    {
      key: 'automationBias',
      label: 'Automation Bias Rate',
      asIs: automationBiasAsIs,
      toBe: automationBiasToBe,
      unit: '%',
      delta: r1(automationBiasToBe - automationBiasAsIs),
    },
  ];

  const dailyComparison = [];
  for (let day = 1; day <= 30; day += 1) {
    const asIsDayRows = asIsRows.filter((row) => row.day === day);
    const toBeDayRows = toBeRows.filter((row) => row.day === day);
    if (!asIsDayRows.length && !toBeDayRows.length) continue;
    dailyComparison.push({
      day,
      label: `D${day}`,
      asIsVerification: asIsDayRows.length ? r1(avg(asIsDayRows.map((row) => row.verification_rate)) * 100) : null,
      toBeVerification: toBeDayRows.length ? r1(avg(toBeDayRows.map((row) => row.verification_rate)) * 100) : null,
      asIsScreenTime: asIsDayRows.length ? r1(avg(asIsDayRows.map((row) => row.screen_time_hours))) : null,
      toBeScreenTime: toBeDayRows.length ? r1(avg(toBeDayRows.map((row) => row.screen_time_hours))) : null,
    });
  }

  return {
    overview,
    comparisons,
    dailyComparison,
    relianceDist: {
      asIs: asIsStats.relianceDist,
      toBe: toBeStats.relianceDist,
    },
  };
}

export function computeAnalystKpis(allRows) {
  const asIsRows = allRows.filter((row) => row.phase === 'AS-IS');
  const toBeRows = allRows.filter((row) => row.phase === 'TO-BE');
  const automationBiasAsIs = computeAutomationBiasRate(asIsRows);
  const automationBiasToBe = computeAutomationBiasRate(toBeRows);
  const physicalStrainAsIs = computePhysicalStrainIndex(asIsRows);
  const physicalStrainToBe = computePhysicalStrainIndex(toBeRows);
  const nudgeSuccessRate = computeNudgeSuccessRate(asIsRows, toBeRows);

  return {
    cards: [
      {
        key: 'automationBiasRate',
        title: 'AI Automation Bias Rate',
        description: 'Percentage of AI outputs accepted without verification.',
        asIs: automationBiasAsIs,
        toBe: automationBiasToBe,
        unit: '%',
        delta: r1(automationBiasToBe - automationBiasAsIs),
      },
      {
        key: 'digitalPhysicalStrainIndex',
        title: 'Digital Physical Strain Index',
        description: 'Average symptom severity relative to screen exposure.',
        asIs: physicalStrainAsIs,
        toBe: physicalStrainToBe,
        unit: '',
        delta: r2(physicalStrainToBe - physicalStrainAsIs),
      },
      {
        key: 'nudgeSuccessRate',
        title: 'Intervention Nudge Success Rate',
        description: 'Improvement in verification behaviour after verification nudges in TO-BE.',
        asIs: 0,
        toBe: nudgeSuccessRate,
        unit: '%',
        delta: nudgeSuccessRate,
      },
    ],
    details: {
      automationBiasRate: {
        formula: 'Unverified prompts / total prompts * 100',
        benchmark: 'Lower is better',
      },
      digitalPhysicalStrainIndex: {
        formula: '((eye dryness + neck pain) / 2) / screen time',
        benchmark: 'Lower is better',
      },
      nudgeSuccessRate: {
        formula: '((verification after nudges - baseline verification) / baseline verification) * 100',
        benchmark: 'Higher is better',
      },
    },
  };
}

export function computeStudentBaseline(rows) {
  if (!rows.length) return null;
  return {
    avgPromptsPerDay: Math.round(avg(rows.map((row) => row.ai_prompts_per_day))),
    avgVerificationRate: r1(avg(rows.map((row) => row.verification_rate)) * 100),
    avgScreenTime: r1(avg(rows.map((row) => row.screen_time_hours))),
    avgEyeDryness: r1(avg(rows.map((row) => row.eye_dryness_score))),
    avgNeckPain: r1(avg(rows.map((row) => row.neck_pain_score))),
    dominantRelianceType:
      Object.entries(
        rows.reduce((accumulator, row) => {
          accumulator[row.reliance_type] = (accumulator[row.reliance_type] || 0) + 1;
          return accumulator;
        }, {}),
      ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'appropriate',
  };
}

export function computePublicOverview(rows) {
  const asIsRows = rows.filter((row) => row.phase === 'AS-IS');
  const heroStats = computeStats(asIsRows).heroStats;
  return {
    studentCount: new Set(rows.map((row) => row.dataset_user_key)).size,
    observationCount: rows.length,
    phases: [...new Set(rows.map((row) => row.phase))],
    heroStats,
  };
}

export function buildNudgeImpact(nudges, sessions) {
  return nudges.map((nudge) => {
    const orderedSessions = [...sessions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const beforeSessions = orderedSessions
      .filter((session) => new Date(session.created_at) < new Date(nudge.created_at));
    const afterSessions = orderedSessions
      .filter((session) => new Date(session.created_at) > new Date(nudge.created_at))
      .slice(0, 3);
    const recentBeforeSessions = beforeSessions.slice(-3);
    const beforeScore = recentBeforeSessions.length ? avg(recentBeforeSessions.map((session) => scoreVerification(session.verification_status))) : 0;
    const afterScore = afterSessions.length ? avg(afterSessions.map((session) => scoreVerification(session.verification_status))) : 0;
    return {
      nudgeId: nudge.id,
      beforeVerificationScore: r2(beforeScore),
      afterVerificationScore: r2(afterScore),
      improvement: r2(afterScore - beforeScore),
    };
  });
}

export function summarizeVerificationStatus(status) {
  return Math.round(scoreVerification(status) * 100);
}
