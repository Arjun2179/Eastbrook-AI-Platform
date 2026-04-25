import { useEffect, useState } from 'react'
import { Award, Bell, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiFetch } from '../../lib/api'

interface ProgressResponse {
  summary: {
    averageRisk: number
    verificationRate: number
    averageDuration: number
    averagePrompts: number
    averageEyeDryness: number
    averageNeckPain: number
    breakAdherenceRate: number
    completedModules: number
    totalModules: number
    averageBestScore: number
    nudgeImprovement: number
  }
  training: Array<{
    id: number
    title: string
    durationMinutes: number
    progress: {
      attempts: number
      latest_score: number
      best_score: number
      passed: boolean
    } | null
  }>
  nudgeImpact: Array<{
    nudgeId: string
    beforeVerificationScore: number
    afterVerificationScore: number
    improvement: number
  }>
  verificationTrend: Array<{ label: string; verificationScore: number; riskScore: number }>
  symptomTrend: Array<{ label: string; eyeDryness: number; neckPain: number; breaksTaken: number }>
}

export default function MyProgress() {
  const [data, setData] = useState<ProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProgress() {
      try {
        const response = await apiFetch<ProgressResponse>('/api/student/progress')
        if (active) {
          setData(response)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load progress')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadProgress()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p>Loading your progress...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <h2 style={{ marginBottom: 8 }}>My Progress</h2>
        <p style={{ marginBottom: 16 }}>{error || 'Unable to load progress.'}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>My Progress</h2>
      <p style={{ marginBottom: 24 }}>
        This page combines your training outcomes, session behaviour, symptom trends, and nudge-response metrics.
      </p>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--analyst)' }}>
            {data.summary.completedModules}/{data.summary.totalModules}
          </div>
          <div className="kpi-label">Modules Passed</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{data.summary.averageBestScore}%</div>
          <div className="kpi-label">Average Best Quiz Score</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--student)' }}>{data.summary.breakAdherenceRate}%</div>
          <div className="kpi-label">Sessions With Breaks</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: data.summary.nudgeImprovement >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {data.summary.nudgeImprovement}%
          </div>
          <div className="kpi-label">Nudge Response Improvement</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={18} color="#10B981" />
            <h3 style={{ margin: 0 }}>Verification Progress</h3>
          </div>
          {data.verificationTrend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.verificationTrend} margin={{ top: 4, right: 16, left: 8, bottom: 22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Session', position: 'insideBottom', offset: -8, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }}
                  label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}`, String(name)]} labelFormatter={l => `Session: ${l}`} />
                <Line type="monotone" dataKey="verificationScore" stroke="#10B981" strokeWidth={2.5} name="Verification %" />
                <Line type="monotone" dataKey="riskScore" stroke="#EF4444" strokeWidth={2.5} name="Risk score" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ margin: 0 }}>Log sessions to build a verification trend.</p>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bell size={18} color="#F59E0B" />
            <h3 style={{ margin: 0 }}>Symptom Trend</h3>
          </div>
          {data.symptomTrend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.symptomTrend} margin={{ top: 4, right: 16, left: 8, bottom: 22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Session', position: 'insideBottom', offset: -8, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 10]}
                  label={{ value: 'Severity (0–10)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}/10`, String(name)]} labelFormatter={l => `Session: ${l}`} />
                <Bar dataKey="eyeDryness" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Eye Dryness" />
                <Bar dataKey="neckPain" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Neck Pain" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ margin: 0 }}>Symptom trends appear once sessions are logged.</p>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Award size={18} color="#7C3AED" />
            <h3 style={{ margin: 0 }}>Training History</h3>
          </div>
          <div className="section-scroll section-scroll-lg" style={{ display: 'grid', gap: 12 }}>
            {data.training.map((module) => (
              <div key={module.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--brand-100)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong style={{ fontSize: '0.86rem' }}>{module.title}</strong>
                  <span className={`badge ${module.progress?.passed ? 'badge-green' : 'badge-gray'}`}>
                    {module.progress?.passed ? 'Passed' : 'Not yet passed'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {module.durationMinutes} minutes • {module.progress ? `${module.progress.attempts} attempts` : 'No attempts yet'}
                </div>
                {module.progress && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Latest {module.progress.latest_score}% • Best {module.progress.best_score}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bell size={18} color="#F59E0B" />
            <h3 style={{ margin: 0 }}>Intervention Outcomes</h3>
          </div>
          {data.nudgeImpact.length ? (
            <div className="section-scroll section-scroll-lg" style={{ display: 'grid', gap: 12 }}>
              {data.nudgeImpact.map((item) => (
                <div key={item.nudgeId} style={{ paddingBottom: 12, borderBottom: '1px solid var(--brand-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ fontSize: '0.86rem' }}>Nudge {item.nudgeId.slice(0, 8)}</strong>
                    <span className={`badge ${item.improvement >= 0 ? 'badge-green' : 'badge-red'}`}>
                      {Math.round(item.improvement * 100)} pts
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Before {Math.round(item.beforeVerificationScore * 100)}% • After {Math.round(item.afterVerificationScore * 100)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0 }}>Nudge-response metrics will appear after educator interventions and later sessions.</p>
          )}
        </div>
      </div>
    </div>
  )
}
