import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, TrendingUp, Users } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiFetch, formatDateTime } from '../../lib/api'

interface DashboardResponse {
  summary: {
    assignedStudents: number
    openAlerts: number
    highRiskStudents: number
    averageVerificationRate: number
  }
  highRiskStudents: Array<{
    id: string
    full_name: string
    grade: string
    average_risk: number
    verification_rate: number
    open_alerts: number
  }>
  openAlerts: Array<{
    id: string
    student_name: string
    grade: string
    alert_level: string
    reason: string
    risk_score: number
    status: string
    created_at: string
  }>
  recentNudges: Array<{
    id: string
    student_name: string
    nudge_type: string
    status: string
    created_at: string
    impact?: { improvement: number } | null
  }>
  classTrend: Array<{
    label: string
    verificationRate: number
    averageRisk: number
    eyeDryness: number
    neckPain: number
  }>
}

function riskColor(value: number) {
  if (value >= 70) return 'var(--danger)'
  if (value >= 50) return 'var(--warning)'
  return 'var(--success)'
}

export default function EducatorDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const response = await apiFetch<DashboardResponse>('/api/educator/dashboard')
        if (active) {
          setData(response)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load educator dashboard')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p>Loading educator console...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <h2 style={{ marginBottom: 8 }}>Educator Console</h2>
        <p style={{ marginBottom: 16 }}>{error || 'Unable to load educator data.'}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: '#fff',
          marginBottom: 24,
          border: 'none',
        }}
      >
        <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: 6 }}>Educator Console</h2>
        <p style={{ color: 'rgba(255,255,255,.78)', margin: 0 }}>
          Your cohort overview is now driven by live alerts, sessions, nudges, and student mappings from PostgreSQL.
        </p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--educator)' }}>{data.summary.assignedStudents}</div>
          <div className="kpi-label">Assigned Students</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: data.summary.openAlerts ? 'var(--danger)' : 'var(--success)' }}>
            {data.summary.openAlerts}
          </div>
          <div className="kpi-label">Open Alerts</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: data.summary.highRiskStudents ? 'var(--warning)' : 'var(--success)' }}>
            {data.summary.highRiskStudents}
          </div>
          <div className="kpi-label">High-Risk Students</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--student)' }}>{data.summary.averageVerificationRate}%</div>
          <div className="kpi-label">Average Verification</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={18} color="#059669" />
            <h3 style={{ margin: 0 }}>Class Trend</h3>
          </div>
          {data.classTrend.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.classTrend} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Session', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }}
                  label={{ value: 'Verification (%)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }}
                  label={{ value: 'Risk Score', angle: 90, position: 'insideRight', fill: '#64748B', fontSize: 11, dx: 4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}`, String(name)]} labelFormatter={l => `Session: ${l}`} />
                <Line yAxisId="left" type="monotone" dataKey="verificationRate" stroke="#10B981" strokeWidth={2.5} name="Verification %" />
                <Line yAxisId="right" type="monotone" dataKey="averageRisk" stroke="#EF4444" strokeWidth={2.5} name="Risk score" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ margin: 0 }}>Class trends will appear after students start logging sessions.</p>
          )}
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderLeft: '4px solid #059669', borderRadius: 8, padding: '10px 14px', marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#059669', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>Class Performance Benchmark</div>
            <div style={{ fontSize: '0.75rem', color: '#065F46', lineHeight: 1.7 }}>A class-average verification rate <strong>above 65%</strong> with a risk score <strong>below 45</strong> is the Eastbrook study benchmark for a well-performing cohort. A ≥10% increase in class-average verification within 4 weeks of platform activation is the stated intervention success threshold. If verification is stagnant or falling alongside a rising risk score, review which students lack nudge-response history — they likely need a direct educator-initiated nudge rather than automated reminders.</div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={18} color="#2563EB" />
            <h3 style={{ margin: 0 }}>High-Risk Students</h3>
          </div>
          {data.highRiskStudents.length ? (
            <div className="section-scroll section-scroll-lg" style={{ display: 'grid', gap: 12 }}>
              {data.highRiskStudents.map((student) => (
                <div key={student.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--brand-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ fontSize: '0.86rem' }}>{student.full_name}</strong>
                    <span className="badge" style={{ background: 'var(--brand-100)', color: riskColor(student.average_risk) }}>
                      {student.average_risk}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Grade {student.grade} • Verification {student.verification_rate}% • {student.open_alerts} open alerts
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0 }}>No students are currently flagged as high risk.</p>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={18} color="#EF4444" />
            <h3 style={{ margin: 0 }}>Open Alerts</h3>
          </div>
          {data.openAlerts.length ? (
            <div className="section-scroll section-scroll-lg" style={{ display: 'grid', gap: 12 }}>
              {data.openAlerts.map((alert) => (
                <div key={alert.id} style={{ padding: '12px 14px', borderRadius: 'var(--radius)', background: 'var(--brand-50)', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.86rem' }}>{alert.student_name}</strong>
                    <span className={`badge ${alert.alert_level === 'high' ? 'badge-red' : 'badge-amber'}`}>
                      {alert.alert_level}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', margin: '0 0 6px' }}>{alert.reason}</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Risk {alert.risk_score} • Grade {alert.grade} • {formatDateTime(alert.created_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0 }}>There are no open alerts right now.</p>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bell size={18} color="#F59E0B" />
            <h3 style={{ margin: 0 }}>Recent Nudges</h3>
          </div>
          {data.recentNudges.length ? (
            <div className="section-scroll section-scroll-lg" style={{ display: 'grid', gap: 12 }}>
              {data.recentNudges.map((nudge) => (
                <div key={nudge.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--brand-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ fontSize: '0.86rem' }}>{nudge.student_name}</strong>
                    <span className="badge badge-gray">{nudge.status}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {nudge.nudge_type} • {formatDateTime(nudge.created_at)}
                  </div>
                  {nudge.impact && (
                    <div style={{ fontSize: '0.76rem', color: nudge.impact.improvement >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      Verification shift {Math.round(nudge.impact.improvement * 100)} pts
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0 }}>No nudges have been sent yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
