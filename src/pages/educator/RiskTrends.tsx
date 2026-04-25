import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiFetch } from '../../lib/api'

interface TrendsResponse {
  benchmark: {
    totalDailyPrompts: number
    avgScreenTime: number
    avgVerificationRate: number
    avgEyeDryness: number
  }
  verificationTrend: Array<{
    label: string
    verificationRate: number
    averageRisk: number
    benchmarkVerification: number
  }>
  symptomTrend: Array<{
    label: string
    eyeDryness: number
    neckPain: number
    benchmarkEyeDryness: number
  }>
  riskTrend: Array<{
    label: string
    averageRisk: number
  }>
  nudgeImpact: Array<{
    id: string
    studentName: string
    status: string
    improvement: number
  }>
}

export default function RiskTrends() {
  const [data, setData] = useState<TrendsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadTrends() {
      try {
        const response = await apiFetch<TrendsResponse>('/api/educator/trends')
        if (active) {
          setData(response)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load trends')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadTrends()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p>Loading cohort trends...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <h2 style={{ marginBottom: 8 }}>Risk Trends</h2>
        <p style={{ marginBottom: 16 }}>{error || 'Unable to load trend data.'}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Risk Trends</h2>
      <p style={{ marginBottom: 24 }}>
        Compare live educator-cohort activity with Eastbrook benchmark values from the imported AS-IS dataset.
      </p>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--student)' }}>{data.benchmark.totalDailyPrompts}</div>
          <div className="kpi-label">Baseline Daily Prompts</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--warning)' }}>{data.benchmark.avgScreenTime} hrs</div>
          <div className="kpi-label">Baseline Screen Time</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{data.benchmark.avgVerificationRate}%</div>
          <div className="kpi-label">Baseline Verification</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>{data.benchmark.avgEyeDryness}/10</div>
          <div className="kpi-label">Baseline Eye Dryness</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Live Verification vs Baseline</h3>
          {data.verificationTrend.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.verificationTrend} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Session', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Verification Rate (%)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}%`, String(name)]} labelFormatter={l => `Session: ${l}`} />
                <Line type="monotone" dataKey="verificationRate" stroke="#10B981" strokeWidth={2.5} name="Live verification %" />
                <Line type="monotone" dataKey="benchmarkVerification" stroke="#64748B" strokeWidth={2} strokeDasharray="6 4" name="Benchmark %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ margin: 0 }}>Live verification trends appear after cohort session activity.</p>
          )}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderLeft: '4px solid #1D4ED8', borderRadius: 8, padding: '10px 14px', marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#1D4ED8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>Live vs Benchmark Gap</div>
            <div style={{ fontSize: '0.75rem', color: '#1E3A8A', lineHeight: 1.7 }}>The dashed benchmark line represents the AS-IS population average (56%) from the Eastbrook dataset. Your live cohort exceeding this benchmark confirms the platform is producing above-baseline outcomes. A <strong>persistent gap below the benchmark</strong> for 3+ consecutive sessions should trigger a cohort-wide intervention review. The benchmark is not a ceiling — the TO-BE study target is 66.7%, so any cohort sustaining above that level is operating in the top performance band.</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Risk Trend</h3>
          {data.riskTrend.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.riskTrend} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Session', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Average Risk Score', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown) => [`${v}`, 'Avg Risk Score']} labelFormatter={l => `Session: ${l}`} />
                <Bar dataKey="averageRisk" fill="#EF4444" radius={[6, 6, 0, 0]} name="Average Risk" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ margin: 0 }}>Risk trend data will appear after session activity.</p>
          )}
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '4px solid #EF4444', borderRadius: 8, padding: '10px 14px', marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#DC2626', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>Risk Score Composition</div>
            <div style={{ fontSize: '0.75rem', color: '#7F1D1D', lineHeight: 1.7 }}>Risk scores are computed from session duration (×0.3), prompt count (×0.15), unverified outputs (+25 pts), symptom severity above threshold (+3 pts each), and break deficit (−2 pts per break). A score <strong>above 70</strong> is flagged as high-risk and generates an automatic alert. A <strong>rising trend across 3+ sessions</strong> — even below 70 — warrants a proactive nudge, as trajectory is a stronger predictor of deterioration than any single score reading.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Symptom Trend vs Baseline</h3>
          {data.symptomTrend.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.symptomTrend} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Session', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 10]}
                  label={{ value: 'Severity Score (0–10)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}/10`, String(name)]} labelFormatter={l => `Session: ${l}`} />
                <Line type="monotone" dataKey="eyeDryness" stroke="#F59E0B" strokeWidth={2.5} name="Live eye dryness" />
                <Line type="monotone" dataKey="neckPain" stroke="#3B82F6" strokeWidth={2.5} name="Live neck pain" />
                <Line type="monotone" dataKey="benchmarkEyeDryness" stroke="#64748B" strokeWidth={2} strokeDasharray="6 4" name="Benchmark eye dryness" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ margin: 0 }}>Symptom trends appear after logged sessions.</p>
          )}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '4px solid #D97706', borderRadius: 8, padding: '10px 14px', marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#D97706', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>Physical Health Cohort Indicator</div>
            <div style={{ fontSize: '0.75rem', color: '#78350F', lineHeight: 1.7 }}>Cohort eye dryness above <strong>7.1/10</strong> (AS-IS baseline) signals unregulated extended sessions. The TO-BE target is below 6.3/10. Neck pain above <strong>6/10</strong> on consecutive sessions indicates inadequate ergonomic conditions alongside insufficient breaks. When live symptom scores consistently exceed the benchmark (dashed line), prioritise break-adherence nudges to the top 20% of students by session duration — the Pareto effect applies here: the longest-session users drive disproportionate cohort-level symptom averages.</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Nudge Impact Summary</h3>
          {data.nudgeImpact.length ? (
            <div className="section-scroll section-scroll-lg" style={{ display: 'grid', gap: 12 }}>
              {data.nudgeImpact.map((item) => (
                <div key={item.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--brand-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ fontSize: '0.84rem' }}>{item.studentName}</strong>
                    <span className="badge badge-gray">{item.status}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: item.improvement >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    Verification change {item.improvement} pts
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0 }}>Nudge impact metrics will appear once there are interventions and follow-up sessions.</p>
          )}
        </div>
      </div>
    </div>
  )
}
