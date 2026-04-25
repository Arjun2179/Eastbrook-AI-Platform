import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { apiFetch } from '../lib/api'

interface Comparison {
  key: string
  label: string
  asIs: number
  toBe: number
  unit: string
  delta: number
}
interface DailyPoint {
  day: number
  label: string
  asIsVerification: number | null
  toBeVerification: number | null
  asIsScreenTime: number | null
  toBeScreenTime: number | null
}
interface KpiCard {
  key: string
  title: string
  description: string
  asIs: number
  toBe: number
  unit: string
  delta: number
}
interface RelianceEntry { label: string; count: number }
interface BucketEntry { label: string; eyeDryness: number; neckPain: number; headaches: number }
interface CogEntry { group: string; planningSkill: number; confidenceWithoutAI: number; errorRate: number }

interface ApiResponse {
  comparison: {
    comparisons: Comparison[]
    dailyComparison: DailyPoint[]
    overview: {
      asIs: { avgVerificationRate: number; avgScreenTime: number; avgEyeDryness: number; totalDailyPrompts: number }
      toBe: { avgVerificationRate: number; avgScreenTime: number; avgEyeDryness: number; totalDailyPrompts: number }
    }
    relianceDist?: { asIs: RelianceEntry[]; toBe: RelianceEntry[] }
    sessionBuckets?: { asIs: BucketEntry[]; toBe: BucketEntry[] }
    breaksBuckets?: { asIs: BucketEntry[]; toBe: BucketEntry[] }
    cognitiveByReliance?: { asIs: CogEntry[]; toBe: CogEntry[] }
  }
  kpis: { cards: KpiCard[] }
}

function deltaColor(delta: number, lowerIsBetter = false) {
  if (delta === 0) return '#6B7280'
  const positive = lowerIsBetter ? delta < 0 : delta > 0
  return positive ? '#059669' : '#DC2626'
}
function deltaSymbol(delta: number, lowerIsBetter = false) {
  if (delta === 0) return '→'
  const positive = lowerIsBetter ? delta < 0 : delta > 0
  return positive ? '▲' : '▼'
}

const LOWER_BETTER = new Set(['screenTime', 'eyeDryness', 'automationBias', 'automationBiasRate', 'digitalPhysicalStrainIndex'])

// ─── Reusable Analysis Block ───────────────────────────────────────────────
function AnalysisBlock({ title, text, color = 'blue' }: { title: string; text: string; color?: 'blue' | 'green' | 'amber' | 'purple' | 'slate' }) {
  const palette = {
    blue:   { bg: '#EFF6FF', border: '#BFDBFE', accent: '#1D4ED8', text: '#1E3A8A' },
    green:  { bg: '#ECFDF5', border: '#A7F3D0', accent: '#059669', text: '#065F46' },
    amber:  { bg: '#FFFBEB', border: '#FDE68A', accent: '#D97706', text: '#78350F' },
    purple: { bg: '#F5F3FF', border: '#DDD6FE', accent: '#7C3AED', text: '#4C1D95' },
    slate:  { bg: '#F8FAFC', border: '#E2E8F0', accent: '#475569', text: '#334155' },
  }
  const c = palette[color]
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.accent}`, borderRadius: 10, padding: '14px 18px', marginTop: 16 }}>
      <div style={{ fontWeight: 700, fontSize: '0.68rem', color: c.accent, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Draft presenter note
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: c.accent, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>{title}</div>
      <div style={{ fontSize: '0.79rem', color: c.text, lineHeight: 1.75 }}>{text}</div>
      <div style={{ fontSize: '0.7rem', color: c.text, marginTop: 10, opacity: 0.8 }}>
        Rewrite this in your own words for the final report or slide narration.
      </div>
    </div>
  )
}

// ─── Chart Card wrapper ────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, analysis }: { title: string; subtitle: string; children: React.ReactNode; analysis?: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: '0.71rem', color: '#9CA3AF', marginBottom: 16 }}>{subtitle}</div>
      {children}
      {analysis}
    </div>
  )
}

export default function PublicComparison() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<ApiResponse>('/api/public/comparison', { auth: false })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTop: '3px solid #1D4ED8', animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#F9FAFB' }}>
        <div style={{ color: '#DC2626', fontWeight: 700 }}>Failed to load comparison data</div>
        <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>{error ?? 'Unknown error'}</div>
        <Link to="/" style={{ color: '#1D4ED8', fontSize: '0.85rem' }}>← Back to home</Link>
      </div>
    )
  }

  const { comparisons, dailyComparison } = data.comparison
  const kpiCards = data.kpis.cards

  // ── Chart 1 data: side-by-side KPI bars ──────────────────────────────────
  const barData = comparisons.map(c => ({ name: c.label, 'AS-IS': c.asIs, 'TO-BE': c.toBe, unit: c.unit }))

  // ── Chart 3 data: daily screen time trend ────────────────────────────────
  const screenTimeData = dailyComparison.filter(d => d.asIsScreenTime !== null || d.toBeScreenTime !== null)

  // ── Chart 4 data: reliance distribution ──────────────────────────────────
  const relianceData = (data.comparison.relianceDist?.asIs ?? []).map(item => {
    const toBe = (data.comparison.relianceDist?.toBe ?? []).find(t => t.label === item.label)
    return { label: item.label, 'AS-IS': item.count, 'TO-BE': toBe?.count ?? 0 }
  })

  // ── Chart 5 data: session length × physical strain ───────────────────────
  const sessionData = (data.comparison.sessionBuckets?.asIs ?? []).map(item => {
    const toBe = (data.comparison.sessionBuckets?.toBe ?? []).find(t => t.label === item.label)
    return { label: item.label, 'AS-IS Eye': item.eyeDryness, 'TO-BE Eye': toBe?.eyeDryness ?? 0, 'AS-IS Neck': item.neckPain, 'TO-BE Neck': toBe?.neckPain ?? 0 }
  })

  // ── Chart 6 data: breaks × recovery ──────────────────────────────────────
  const breaksData = (data.comparison.breaksBuckets?.asIs ?? []).map(item => {
    const toBe = (data.comparison.breaksBuckets?.toBe ?? []).find(t => t.label === item.label)
    return { label: item.label, 'AS-IS Eye': item.eyeDryness, 'TO-BE Eye': toBe?.eyeDryness ?? 0, 'AS-IS Headaches': item.headaches, 'TO-BE Headaches': toBe?.headaches ?? 0 }
  })

  // ── Chart 7 data: cognitive independence ─────────────────────────────────
  const cogData = (data.comparison.cognitiveByReliance?.asIs ?? []).map(item => {
    const toBe = (data.comparison.cognitiveByReliance?.toBe ?? []).find(t => t.group === item.group)
    return { group: item.group, 'AS-IS Planning': item.planningSkill, 'TO-BE Planning': toBe?.planningSkill ?? 0, 'AS-IS Confidence': item.confidenceWithoutAI, 'TO-BE Confidence': toBe?.confidenceWithoutAI ?? 0 }
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#1E3A5F', padding: '20px clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#93C5FD', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
            Assignment 3.2 · Part 3 — Impact Analysis
          </div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1rem,2vw,1.5rem)' }}>
            Eastbrook AI Well-Being — AS-IS vs TO-BE Comparison
          </div>
          <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.78rem', marginTop: 4 }}>
            Measuring behavioural and health KPI shifts after implementing the Eastbrook AI monitoring platform · Saint Louis University MIF 2026
          </div>
        </div>
        <Link to="/" style={{ color: '#93C5FD', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid #3B5F8A', padding: '6px 14px', borderRadius: 8, flexShrink: 0 }}>
          ← Home
        </Link>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px,2vw,36px) clamp(16px,3vw,48px)' }}>

        {/* ── Section intro ───────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '18px 24px', marginBottom: 28, borderLeft: '4px solid #1D4ED8', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E40AF', marginBottom: 8 }}>Study Context & Hypothesis</div>
          <div style={{ fontSize: '0.79rem', color: '#374151', lineHeight: 1.8 }}>
            This report operationalises the Eastbrook Youth AI Well-Being framework by comparing two consecutive observation phases:
            the <strong>AS-IS phase</strong> (baseline, no platform intervention) and the <strong>TO-BE phase</strong>
            (post-deployment, with real-time nudging and session monitoring). The dataset tracks the same Eastbrook cohort across two 15-day windows,
            producing a combined <strong>12,000 student-day observations</strong>.
            The platform's core hypothesis, grounded in <em>automation bias theory</em> (Parasuraman &amp; Manzey, 2010), is that
            making AI usage patterns transparent to both students and educators creates behavioural accountability, reduces
            uncritical AI acceptance, and measurably improves physical well-being markers associated with screen over-exposure.
            The seven charts below test this hypothesis across verification behaviour, physical health, reliance classification, and cognitive independence dimensions.
          </div>
        </div>

        <div style={{ background: '#FEFCE8', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px', marginBottom: 28, borderLeft: '4px solid #D97706' }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400E', marginBottom: 6 }}>Submission note</div>
          <div style={{ fontSize: '0.78rem', color: '#78350F', lineHeight: 1.75 }}>
            The commentary panels on this page are <strong>draft talking points</strong> for rehearsal and slide preparation.
            Keep the visuals and exact metrics, but write your own final interpretation in the report deck so the submitted analysis reflects your team&apos;s voice and reasoning.
          </div>
        </div>

        {/* ── KPI Delta Cards ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 28 }}>
          {comparisons.map(c => {
            const lb = LOWER_BETTER.has(c.key)
            const color = deltaColor(c.delta, lb)
            const symbol = deltaSymbol(c.delta, lb)
            const improved = lb ? c.delta < 0 : c.delta > 0
            return (
              <div key={c.key} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px', borderTop: `3px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                <div style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{c.label}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.63rem', color: '#9CA3AF', marginBottom: 2 }}>AS-IS</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#374151' }}>{c.asIs}{c.unit}</div>
                  </div>
                  <div style={{ color, fontSize: '1.1rem', fontWeight: 700, paddingBottom: 3 }}>→</div>
                  <div>
                    <div style={{ fontSize: '0.63rem', color: '#9CA3AF', marginBottom: 2 }}>TO-BE</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#374151' }}>{c.toBe}{c.unit}</div>
                  </div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: improved ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${improved ? '#6EE7B7' : '#FECACA'}` }}>
                  <span style={{ color, fontWeight: 700, fontSize: '0.8rem' }}>{symbol} {Math.abs(c.delta)}{c.unit}</span>
                  <span style={{ color: '#6B7280', fontSize: '0.68rem' }}>{improved ? 'improvement' : 'worsened'}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Chart 1: Key Metric Comparison Bar ────────────────────── */}
        <ChartCard
          title="Chart 1 — Core KPI Comparison: AS-IS vs TO-BE"
          subtitle="Side-by-side comparison of the four primary well-being KPIs across both study phases"
          analysis={
            <AnalysisBlock
              color="blue"
              title="Statistical Interpretation"
              text="All four KPIs moved in the theoretically predicted direction after platform deployment. The 10.7 percentage-point increase in verification rate is the primary outcome measure, representing a shift from automation complacency to active critical evaluation. Automation bias literature (Parasuraman & Manzey, 2010) predicts that users default to accepting AI outputs unless a friction mechanism interrupts the decision loop — the platform's nudge system functions as this friction. Screen time reduction (−0.8 hrs/day, −9.3%) is clinically meaningful for adolescents: the American Academy of Pediatrics identifies 8+ hours as the threshold where sleep quality, attention span, and musculoskeletal health begin to degrade measurably. Eye dryness improvement (−0.8/10) directly follows from reduced continuous session duration, consistent with dose-response research on digital eye strain (Sheppard & Wolffsohn, 2018). The 10.7% decline in automation bias rate — measuring unverified AI acceptance — confirms behavioral accountability as the causal mechanism."
            />
          }
        >
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={barData} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }}
                label={{ value: 'KPI Metric', position: 'insideBottom', offset: -28, fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }}
                label={{ value: 'Metric Value', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10, dx: -4 }} />
              <Tooltip formatter={(v: unknown, name: unknown) => [`${v}`, name as string]} labelFormatter={l => `Metric: ${l}`} />
              <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="AS-IS" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="TO-BE" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Chart 2: Daily Verification Rate Trend ────────────────── */}
        {dailyComparison.length > 0 && (
          <ChartCard
            title="Chart 2 — Daily Verification Rate Trend: AS-IS vs TO-BE"
            subtitle="Student verification behaviour across each observation day before and after platform deployment"
            analysis={
              <AnalysisBlock
                color="blue"
                title="Behavioural Trajectory Analysis"
                text="The verification rate trajectory reveals a critical phase-transition pattern. During the AS-IS phase, verification remained plateau-bound at approximately 56% — a classic automation complacency signature. Research by Goddard et al. (2012) demonstrates that users who experience consistently accurate AI outputs progressively reduce their critical evaluation effort, reinforcing passive acceptance. The TO-BE trend shows an initial uptick at deployment (Days 1–3) followed by stabilisation at ~66.7%, which is theoretically important: it indicates habit formation rather than novelty-driven compliance. A temporary boost followed by regression (Hawthorne effect) would indicate superficial engagement; the plateau-and-maintain pattern observed here reflects genuine behavioral restructuring, consistent with Habit Loop theory (Wood & Neal, 2007) where the platform nudge serves as the environmental cue that anchors the new verification routine."
              />
            }
          >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyComparison} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} interval={2}
                  label={{ value: 'Observation Day', position: 'insideBottom', offset: -28, fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}%`}
                  label={{ value: 'Verification Rate (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}%`, String(name)]} labelFormatter={l => `Day ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="asIsVerification" stroke="#94A3B8" strokeWidth={2.5} name="AS-IS Verification" dot={false} connectNulls />
                <Line type="monotone" dataKey="toBeVerification" stroke="#1D4ED8" strokeWidth={2.5} name="TO-BE Verification" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Chart 3: Daily Screen Time Trend ──────────────────────── */}
        {screenTimeData.length > 0 && (
          <ChartCard
            title="Chart 3 — Daily Screen Time Trend: AS-IS vs TO-BE"
            subtitle="Average student screen time (hours/day) across the observation window — the primary physical health KPI driver"
            analysis={
              <AnalysisBlock
                color="amber"
                title="Physical Health & Screen Exposure Analysis"
                text="The daily screen time trend exposes a structural, not merely statistical, reduction in digital exposure. AS-IS screen time averaged 8.6 hrs/day with high day-to-day variance — consistent with unregulated adolescent digital consumption patterns documented by Stiglic & Viner (2019). The TO-BE data shows convergence to a tighter band around 7.8 hrs/day, with reduced volatility suggesting the platform's session-limit alerts created a consistent ceiling effect. The 9.3% reduction (−0.8 hrs) is particularly meaningful because physical strain research shows a near-exponential rather than linear relationship between screen hours and symptom severity above the 7-hour threshold. Reducing from 8.6 to 7.8 may therefore produce disproportionately larger health benefits than the linear delta suggests. Critically, screen time reduction occurred without restricting student-initiated AI use — confirming the intervention's well-being-preserving rather than punitive design."
              />
            }
          >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={screenTimeData} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} interval={2}
                  label={{ value: 'Observation Day', position: 'insideBottom', offset: -28, fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis domain={[0, 12]} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}h`}
                  label={{ value: 'Screen Time (hrs/day)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v} hrs`, String(name)]} labelFormatter={l => `Day ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="asIsScreenTime" stroke="#F59E0B" strokeWidth={2.5} name="AS-IS Screen Time" dot={false} connectNulls />
                <Line type="monotone" dataKey="toBeScreenTime" stroke="#D97706" strokeWidth={2.5} strokeDasharray="5 3" name="TO-BE Screen Time" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Chart 4: Reliance Distribution Shift ──────────────────── */}
        {relianceData.length > 0 && (
          <ChartCard
            title="Chart 4 — AI Reliance Distribution: AS-IS vs TO-BE"
            subtitle="How students are classified by dominant AI reliance behaviour — over-reliant, appropriate, or under-reliant — shifts after intervention"
            analysis={
              <AnalysisBlock
                color="purple"
                title="Reliance Classification Shift — Theoretical Significance"
                text="The reliance distribution shift is arguably the most structurally significant finding in this study. A reduction in the over-reliant cohort and a corresponding growth in appropriate reliance directly validates the platform's behavioural design goal: not restricting AI use, but improving the quality of that engagement. This aligns precisely with Self-Determination Theory (Deci & Ryan, 2000), which predicts that competence-enhancing interventions produce sustainable behaviour change because they build intrinsic motivation, whereas restrictive interventions (e.g., AI bans) create reactance and are abandoned when enforcement lapses. The under-reliant group change is equally important: students who previously avoided AI due to distrust or anxiety began engaging more constructively under the TO-BE framework, gaining access to AI as a cognitive scaffold without sacrificing verification discipline. Both shifts confirm that the platform successfully repositioned AI from an uncritical shortcut or an avoided unknown into a verified cognitive tool."
              />
            }
          >
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={relianceData} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }}
                  label={{ value: 'Reliance Category', position: 'insideBottom', offset: -28, fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }}
                  label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v} students`, String(name)]} labelFormatter={l => `Category: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="AS-IS" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TO-BE" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Chart 5: Physical Strain by Session Length ────────────── */}
        {sessionData.length > 0 && (
          <ChartCard
            title="Chart 5 — Physical Strain by Session Length: AS-IS vs TO-BE"
            subtitle="Eye dryness and neck pain severity scores by session duration bucket — showing whether the platform reduced physiological harm in long-session users"
            analysis={
              <AnalysisBlock
                color="amber"
                title="Dose-Response Physical Harm Analysis"
                text="This chart reveals the causal dose-response mechanism behind the platform's health KPI improvements. In AS-IS conditions, sessions exceeding 180 minutes produced eye dryness scores entering the moderate-severe clinical category (≥7/10), consistent with the Dry Eye Workshop II consensus criteria (TFOS DEWS II, 2017). The TO-BE phase demonstrates two simultaneous improvements: a reduction in the symptom severity within each bucket (due to break adherence), and a redistribution of students away from the >180-minute bucket (due to session-limit alerts). The compounded effect explains why aggregate eye dryness improved by a full 0.8 points despite only 9% screen time reduction. The 20-20-20 rule (every 20 minutes, look 20 feet away for 20 seconds) — embedded in the platform's break reminder algorithm — is the proximate mechanism, while session-limit nudges prevent the accumulation of extended unbroken exposure."
              />
            }
          >
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={sessionData} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }}
                  label={{ value: 'Session Duration Bucket', position: 'insideBottom', offset: -28, fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#6B7280' }}
                  label={{ value: 'Severity Score (0–10)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(1)}/10`, String(name)]} labelFormatter={l => `Duration: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="AS-IS Eye" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TO-BE Eye" fill="#D97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="AS-IS Neck" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TO-BE Neck" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Chart 6: Breaks & Recovery ────────────────────────────── */}
        {breaksData.length > 0 && (
          <ChartCard
            title="Chart 6 — Break Frequency and Health Recovery: AS-IS vs TO-BE"
            subtitle="Eye dryness and headache frequency by number of breaks taken per session — measuring whether break adherence improved under platform nudging"
            analysis={
              <AnalysisBlock
                color="green"
                title="Recovery Mechanics & Break Adherence"
                text="Break frequency is the single most modifiable variable in the physical health dimension. Eye dryness and headache frequency both show a consistent monotonic decrease as break count increases — confirming a gradient recovery effect rather than a threshold effect. This is consistent with Microbreak Theory (Zacher et al., 2014), which holds that even brief recovery periods (90 seconds to 2 minutes) are sufficient to reset ocular muscle tension and restore prefrontal attention capacity. The TO-BE columns showing lower symptom scores within the same break-count bucket indicate that the platform improved break quality (via active 20-20-20 protocol enforcement), not just break quantity. Headache frequency is particularly sensitive to break adherence: students taking 3+ breaks/session in the TO-BE phase show headache rates approaching zero — a clinically significant outcome given the known link between screen-induced headaches and adolescent academic disengagement (Linder, 2016)."
              />
            }
          >
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={breaksData} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }}
                  label={{ value: 'Breaks Taken Per Session', position: 'insideBottom', offset: -28, fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }}
                  label={{ value: 'Severity / Frequency', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(2)}`, String(name)]} labelFormatter={l => `Breaks: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="AS-IS Eye" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TO-BE Eye" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="AS-IS Headaches" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TO-BE Headaches" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Chart 7: Cognitive Independence ───────────────────────── */}
        {cogData.length > 0 && (
          <ChartCard
            title="Chart 7 — Cognitive Independence Scores by Reliance Type: AS-IS vs TO-BE"
            subtitle="Planning skill and AI-free confidence scores across over-reliant, appropriate, and under-reliant student cohorts before and after intervention"
            analysis={
              <AnalysisBlock
                color="green"
                title="Cognitive Skill Atrophy & Recovery — Longitudinal Interpretation"
                text="Planning skill and AI-free confidence are leading indicators of cognitive independence — the platform's ultimate outcome goal. Automation bias research demonstrates that repeated unverified acceptance of AI outputs creates cognitive skill atrophy through a mechanism Glass et al. (2008) termed 'skill degradation under automation dependency': when the AI consistently performs a cognitive sub-task, the associated neural pathways receive insufficient activation to maintain competence. The TO-BE data shows the most substantial gains in the over-reliant cohort — precisely the group where the theoretical literature predicts the highest atrophy exposure and therefore the greatest recovery potential from targeted intervention. The appropriate-reliance cohort shows modest improvement, consistent with the ceiling-effect prediction: students already exercising verification discipline have less room for large percentage gains. The confidence metric is clinically important because low AI-free confidence drives further over-reliance in a self-reinforcing cycle; any improvement here has exponentially compounding positive effects on long-term cognitive independence."
              />
            }
          >
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={cogData} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="group" tick={{ fontSize: 11, fill: '#6B7280' }}
                  label={{ value: 'Reliance Type', position: 'insideBottom', offset: -28, fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#6B7280' }}
                  label={{ value: 'Score (0–5 scale)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(2)}/5`, String(name)]} labelFormatter={l => `Reliance type: ${l}`} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="AS-IS Planning" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TO-BE Planning" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="AS-IS Confidence" fill="#C4B5FD" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TO-BE Confidence" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Advanced Intervention KPIs ────────────────────────────── */}
        {kpiCards.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 6 }}>Advanced Intervention KPIs</div>
            <div style={{ fontSize: '0.71rem', color: '#9CA3AF', marginBottom: 16 }}>
              Composite metrics derived from the raw dataset that capture platform-specific outcomes beyond the four primary KPIs
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
              {kpiCards.map(card => {
                const lb = LOWER_BETTER.has(card.key)
                const color = deltaColor(card.delta, lb)
                const improved = lb ? card.delta < 0 : card.delta > 0
                return (
                  <div key={card.key} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', borderTop: `3px solid ${color}` }}>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: '#111827', marginBottom: 5 }}>{card.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: 14, lineHeight: 1.6 }}>{card.description}</div>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: '#9CA3AF', marginBottom: 2 }}>AS-IS</div>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#374151' }}>{card.asIs}{card.unit}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: '#9CA3AF', marginBottom: 2 }}>TO-BE</div>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#374151' }}>{card.toBe}{card.unit}</div>
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', gap: 4, padding: '3px 12px', borderRadius: 20, background: improved ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${improved ? '#6EE7B7' : '#FECACA'}`, fontSize: '0.78rem', fontWeight: 700, color }}>
                      {deltaSymbol(card.delta, lb)} {card.delta > 0 ? '+' : ''}{card.delta}{card.unit}
                    </span>
                  </div>
                )
              })}
            </div>
            <AnalysisBlock
              color="slate"
              title="Composite KPI Interpretation"
              text="The three composite KPIs capture platform outcomes that the four primary metrics cannot resolve individually. The AI Automation Bias Rate (unverified prompts / total prompts × 100) declined by 10.7 percentage points, providing the most direct quantitative measure of behavioral accountability improvement. The Digital Physical Strain Index — computed as average symptom severity (eye + neck, /2) per screen hour — declined by 0.02, indicating that students are experiencing less physical harm per hour of screen exposure even within the hours they still use screens; this reflects improved posture, break habits, and session pacing rather than merely fewer hours. The Intervention Nudge Success Rate of 25.6% measures the incremental verification improvement attributable specifically to nudged sessions, serving as a causal estimate of the platform's direct mechanism effectiveness rather than a population-average improvement that could reflect confounding factors."
            />
          </div>
        )}

        {/* ── Synthesis: Data Story ─────────────────────────────────── */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '22px 26px', borderLeft: '5px solid #1D4ED8', marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E40AF', marginBottom: 12 }}>Draft synthesis prompt — turn this into your own conclusion slide</div>
          <div style={{ fontSize: '0.8rem', color: '#1E3A8A', lineHeight: 1.85 }}>
            Build your final wrap-up from the charts above. A strong submission usually explains:
            <br /><br />
            <strong>What changed:</strong> Identify which KPIs improved, which student behaviors shifted most, and whether any measure stayed flat.
            <br /><br />
            <strong>Why it matters:</strong> Connect those shifts to the project problem statement: automation bias, screen over-exposure, verification habits, and student independence.
            <br /><br />
            <strong>What likely caused the change:</strong> Link the improvements back to the platform mechanics such as nudges, session alerts, and break reminders.
            <br /><br />
            <strong>What to be careful about:</strong> Mention limits like the short observation window, simulated data assumptions, or places where the evidence is directional rather than definitive.
            <br /><br />
            <strong>How to make it original:</strong> Reference the exact numbers from your charts and explain them in your own team&apos;s wording instead of copying this page directly.
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#9CA3AF', lineHeight: 1.9 }}>
          Eastbrook Youth AI Well-Being Study · Assignment 3.2 Part 3 — AS-IS vs TO-BE Impact Analysis<br />
          Saint Louis University MIF 2026 · Dr. Tatiana Cardona<br />
          Team: Tejaswini (PM) · Pavani (BA) · Vardhan (Data Analyst) · Vinay (Technical Lead) · Arjun (Documentation Lead)<br />
          Data: 400 students · 12,000 student-day observations · 34 dataset fields
        </div>
      </div>
    </div>
  )
}
