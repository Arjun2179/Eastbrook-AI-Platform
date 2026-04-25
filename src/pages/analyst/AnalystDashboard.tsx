import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiFetch } from '../../lib/api'

interface DashboardPayload {
  dashboard: {
    heroStats: {
      totalDailyPrompts: number
      avgScreenTime: number
      avgVerificationRate: number
      avgEyeDryness: number
    }
    dailyTotals: Array<{ label: string; totalPrompts: number; avgVerification: number }>
    slope: Array<{ label: string; verificationRate: number }>
    sessionBuckets: Array<{ label: string; eyeDryness: number; neckPain: number; headaches: number }>
    breaksBuckets: Array<{ label: string; eyeDryness: number; neckPain: number; headaches: number }>
    latencyComparison: Array<{ group: string; withAI: number; withoutAI: number }>
    cognitiveByReliance: Array<{ group: string; planningSkill: number; confidenceWithoutAI: number; errorRate: number }>
    socialByReliance: Array<{ group: string; moodCheckins: number; emotionalSupport: number; socialMessaging: number; seriousTopics: number }>
    relianceDist: Array<{ label: string; count: number }>
    ageComparison: Array<{ group: string; avgScreenTime: number; avgContinuousUseHrs: number; avgPromptsPerDay: number }>
  }
}

interface ComparisonPayload {
  comparison: {
    overview: {
      asIs: {
        totalDailyPrompts: number
        avgScreenTime: number
        avgVerificationRate: number
        avgEyeDryness: number
      }
      toBe: {
        totalDailyPrompts: number
        avgScreenTime: number
        avgVerificationRate: number
        avgEyeDryness: number
      }
    }
    comparisons: Array<{ key: string; label: string; asIs: number; toBe: number; unit: string; delta: number }>
    dailyComparison: Array<{ label: string; asIsVerification: number | null; toBeVerification: number | null }>
  }
}

interface KpiPayload {
  kpis: {
    cards: Array<{ key: string; title: string; description: string; asIs: number; toBe: number; unit: string; delta: number }>
  }
}

type PhaseFilter = 'all' | 'AS-IS' | 'TO-BE'

const SECTION_META: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: 'Research Overview',
    subtitle: 'A unified view of the imported Eastbrook dataset plus AS-IS vs TO-BE comparison.',
  },
  rq1: {
    title: 'RQ1: AI Usage Intensity',
    subtitle: 'Prompt volume, screen time, and age-group patterns.',
  },
  rq2: {
    title: 'RQ2: Verification Habits',
    subtitle: 'How complexity and phase affect verification behaviour.',
  },
  rq3: {
    title: 'RQ3: Physical Strain',
    subtitle: 'How session length, breaks, and symptoms move together.',
  },
  rq4: {
    title: 'RQ4: Cognitive Independence',
    subtitle: 'Latency gaps and cognitive markers across reliance groups.',
  },
  rq5: {
    title: 'RQ5: Social and Emotional AI Use',
    subtitle: 'Social messaging, emotional support, and serious-topic patterns.',
  },
}

function buildQueryString(filters: {
  phase: PhaseFilter
  ageGroup: string
  relianceType: string
  dayStart: string
  dayEnd: string
}) {
  const params = new URLSearchParams()
  if (filters.phase !== 'all') params.set('phase', filters.phase)
  if (filters.ageGroup !== 'all') params.set('age_group', filters.ageGroup)
  if (filters.relianceType !== 'all') params.set('reliance_type', filters.relianceType)
  if (filters.dayStart) params.set('day_start', filters.dayStart)
  if (filters.dayEnd) params.set('day_end', filters.dayEnd)
  return params.toString()
}

export default function AnalystDashboard() {
  const location = useLocation()
  const section = useMemo(() => {
    const lastSegment = location.pathname.split('/').filter(Boolean).pop()
    if (!lastSegment || lastSegment === 'analyst') return 'overview'
    return lastSegment
  }, [location.pathname])

  const [filters, setFilters] = useState({
    phase: 'AS-IS' as PhaseFilter,
    ageGroup: 'all',
    relianceType: 'all',
    dayStart: '',
    dayEnd: '',
  })
  const [dashboard, setDashboard] = useState<DashboardPayload['dashboard'] | null>(null)
  const [comparison, setComparison] = useState<ComparisonPayload['comparison'] | null>(null)
  const [kpis, setKpis] = useState<KpiPayload['kpis'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadAnalytics() {
      try {
        setLoading(true)
        const query = buildQueryString(filters)
        const comparisonQuery = buildQueryString({ ...filters, phase: 'all' })
        const [dashboardResponse, comparisonResponse, kpiResponse] = await Promise.all([
          apiFetch<DashboardPayload>(`/api/analyst/dashboard?${query}`),
          apiFetch<ComparisonPayload>(`/api/analyst/comparison?${comparisonQuery}`),
          apiFetch<KpiPayload>(`/api/analyst/kpis?${comparisonQuery}`),
        ])

        if (active) {
          setDashboard(dashboardResponse.dashboard)
          setComparison(comparisonResponse.comparison)
          setKpis(kpiResponse.kpis)
          setError('')
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load analytics')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadAnalytics()

    return () => {
      active = false
    }
  }, [filters])

  const meta = SECTION_META[section] || SECTION_META.overview

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p>Loading analyst dashboard...</p>
      </div>
    )
  }

  if (error || !dashboard || !comparison || !kpis) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <h2 style={{ marginBottom: 8 }}>Analyst Dashboard</h2>
        <p style={{ marginBottom: 16 }}>{error || 'Unable to load analyst views.'}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    )
  }

  const showOverview = section === 'overview'

  return (
    <div>
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
          color: '#fff',
          marginBottom: 24,
          border: 'none',
        }}
      >
        <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: 6 }}>{meta.title}</h2>
        <p style={{ color: 'rgba(255,255,255,.78)', margin: 0 }}>{meta.subtitle}</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="grid grid-5">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phase</label>
            <select className="form-input" value={filters.phase} onChange={(event) => setFilters((current) => ({ ...current, phase: event.target.value as PhaseFilter }))}>
              <option value="all">All phases</option>
              <option value="AS-IS">AS-IS</option>
              <option value="TO-BE">TO-BE</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Age Group</label>
            <select className="form-input" value={filters.ageGroup} onChange={(event) => setFilters((current) => ({ ...current, ageGroup: event.target.value }))}>
              <option value="all">All groups</option>
              <option value="13-14">13-14</option>
              <option value="15-17">15-17</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Reliance Type</label>
            <select className="form-input" value={filters.relianceType} onChange={(event) => setFilters((current) => ({ ...current, relianceType: event.target.value }))}>
              <option value="all">All types</option>
              <option value="overreliance">Over-reliance</option>
              <option value="appropriate">Appropriate</option>
              <option value="underreliance">Under-reliance</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Day Start</label>
            <input className="form-input" type="number" min={1} max={30} value={filters.dayStart} onChange={(event) => setFilters((current) => ({ ...current, dayStart: event.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Day End</label>
            <input className="form-input" type="number" min={1} max={30} value={filters.dayEnd} onChange={(event) => setFilters((current) => ({ ...current, dayEnd: event.target.value }))} />
          </div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--student)' }}>{dashboard.heroStats.totalDailyPrompts.toLocaleString()}</div>
          <div className="kpi-label">Daily AI Prompts</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>{dashboard.heroStats.avgScreenTime} hrs</div>
          <div className="kpi-label">Average Screen Time</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{dashboard.heroStats.avgVerificationRate}%</div>
          <div className="kpi-label">Verification Rate</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>{dashboard.heroStats.avgEyeDryness}/10</div>
          <div className="kpi-label">Eye Dryness</div>
        </div>
      </div>

      {showOverview && (
        <div className="grid grid-3" style={{ marginBottom: 24 }}>
          {kpis.cards.map((card) => (
            <div key={card.key} className="card">
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10 }}>
                {card.title}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AS-IS</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{card.asIs}{card.unit}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TO-BE</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{card.toBe}{card.unit}</div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: '0.78rem', color: card.delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                Delta {card.delta}{card.unit}
              </div>
              <p style={{ fontSize: '0.8rem', marginTop: 10 }}>{card.description}</p>
            </div>
          ))}
        </div>
      )}

      {(showOverview || section === 'rq1') && (
        <div className="chart-card card">
          <div className="chart-title">AI Usage Intensity</div>
          <div className="chart-sub">Daily prompt volume and age-group usage patterns</div>
          <div className="grid grid-2">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dashboard.dailyTotals} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Observation Day', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }}
                  label={{ value: 'Total Prompts/Day', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }}
                  label={{ value: 'Verification Rate (%)', angle: 90, position: 'insideRight', fill: '#64748B', fontSize: 11, dx: 4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [String(name).includes('Verification') ? `${v}%` : Number(v).toLocaleString(), String(name)]} labelFormatter={l => `Day ${l}`} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="totalPrompts" stroke="#3B82F6" strokeWidth={2.5} name="Total prompts" />
                <Line yAxisId="right" type="monotone" dataKey="avgVerification" stroke="#10B981" strokeWidth={2.5} name="Verification %" />
              </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboard.ageComparison} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="group" tick={{ fontSize: 12 }}
                  label={{ value: 'Age Group', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Value', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [String(name).includes('Screen') ? `${v} hrs` : String(v), String(name)]} labelFormatter={l => `Age Group: ${l}`} />
                <Legend />
                <Bar dataKey="avgScreenTime" fill="#F59E0B" name="Screen time (hrs)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avgPromptsPerDay" fill="#3B82F6" name="Prompts/day" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(showOverview || section === 'rq2') && (
        <div className="chart-card card">
          <div className="chart-title">Verification Behaviour</div>
          <div className="chart-sub">Task complexity and intervention phase comparison</div>
          <div className="grid grid-2">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dashboard.slope} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Task Complexity', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Verification Rate (%)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown) => [`${v}%`, 'Verification Rate']} labelFormatter={l => `Complexity: ${l}`} />
                <Line type="monotone" dataKey="verificationRate" stroke="#10B981" strokeWidth={2.5} name="Verification %" />
              </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={comparison.dailyComparison} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Observation Day', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Verification Rate (%)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}%`, String(name)]} labelFormatter={l => `Day ${l}`} />
                <Legend />
                <Line type="monotone" dataKey="asIsVerification" stroke="#EF4444" strokeWidth={2.5} name="AS-IS %" />
                <Line type="monotone" dataKey="toBeVerification" stroke="#10B981" strokeWidth={2.5} name="TO-BE %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(showOverview || section === 'rq3') && (
        <div className="chart-card card">
          <div className="chart-title">Physical Strain</div>
          <div className="chart-sub">Session length and break frequency against symptom severity</div>
          <div className="grid grid-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboard.sessionBuckets} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Session Duration', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Severity Score (0–10)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(1)}`, String(name)]} labelFormatter={l => `Duration: ${l}`} />
                <Legend />
                <Bar dataKey="eyeDryness" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Eye Dryness" />
                <Bar dataKey="neckPain" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Neck Pain" />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboard.breaksBuckets} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Breaks Taken', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Severity Score (0–10)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(1)}`, String(name)]} labelFormatter={l => `Breaks: ${l}`} />
                <Legend />
                <Bar dataKey="eyeDryness" fill="#F97316" radius={[6, 6, 0, 0]} name="Eye Dryness" />
                <Bar dataKey="headaches" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Headaches/week" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(showOverview || section === 'rq4') && (
        <div className="chart-card card">
          <div className="chart-title">Cognitive Independence</div>
          <div className="chart-sub">Latency and cognitive indicators across reliance groups</div>
          <div className="grid grid-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboard.latencyComparison} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="group" tick={{ fontSize: 12 }}
                  label={{ value: 'Reliance Type', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Decision Time (seconds)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}s`, String(name)]} labelFormatter={l => `Reliance: ${l}`} />
                <Legend />
                <Bar dataKey="withAI" fill="#3B82F6" radius={[6, 6, 0, 0]} name="With AI (sec)" />
                <Bar dataKey="withoutAI" fill="#EF4444" radius={[6, 6, 0, 0]} name="Without AI (sec)" />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboard.cognitiveByReliance} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="group" tick={{ fontSize: 12 }}
                  label={{ value: 'Reliance Type', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Score (0–5 scale)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(2)}`, String(name)]} labelFormatter={l => `Reliance: ${l}`} />
                <Legend />
                <Bar dataKey="planningSkill" fill="#10B981" radius={[6, 6, 0, 0]} name="Planning Skill" />
                <Bar dataKey="confidenceWithoutAI" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Confidence w/o AI" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(showOverview || section === 'rq5') && (
        <div className="chart-card card">
          <div className="chart-title">Social and Emotional AI Use</div>
          <div className="chart-sub">Patterns that matter for safeguarding and well-being</div>
          <div className="grid grid-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboard.socialByReliance} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="group" tick={{ fontSize: 12 }}
                  label={{ value: 'Reliance Type', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Avg Daily Interactions', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(2)}/day`, String(name)]} labelFormatter={l => `Reliance: ${l}`} />
                <Legend />
                <Bar dataKey="moodCheckins" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Mood Check-ins" />
                <Bar dataKey="emotionalSupport" fill="#EC4899" radius={[6, 6, 0, 0]} name="Emotional Support" />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dashboard.relianceDist} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Reliance Category', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Number of Students', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown) => [`${v} students`, 'Count']} labelFormatter={l => `Category: ${l}`} />
                <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} name="Student Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {showOverview && (
        <div className="chart-card card">
          <div className="chart-title">AS-IS vs TO-BE Snapshot</div>
          <div className="chart-sub">High-level comparison across the imported dataset</div>
          <div className="grid grid-4" style={{ marginBottom: 16 }}>
            {comparison.comparisons.map((item) => (
              <div key={item.key} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 8 }}>{item.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>AS-IS {item.asIs}{item.unit}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>TO-BE {item.toBe}{item.unit}</div>
                <div style={{ marginTop: 6, fontSize: '0.76rem', color: item.delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  Delta {item.delta}{item.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
