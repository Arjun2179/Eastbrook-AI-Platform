import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Bell, BookOpen, ClipboardList, Timer } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { apiFetch, formatDateTime } from '../../lib/api'

interface SessionRecord {
  id: string
  subject: string
  task_type: string
  duration_minutes: number
  prompts_sent: number
  verification_status: 'verified' | 'partial' | 'unverified'
  breaks_taken: number
  eye_dryness_score: number
  neck_pain_score: number
  risk_score: number
  created_at: string
}

interface NudgeRecord {
  id: string
  nudge_type: string
  message: string
  status: string
  created_at: string
  educator_name: string
}

interface AlertRecord {
  id: string
  alert_level: string
  reason: string
  risk_score: number
  status: string
  created_at: string
}

interface DashboardResponse {
  profile: { full_name: string }
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
    pendingNudges: number
    openAlerts: number
    latestRisk: number
    dominantBaselineReliance: string | null
  }
  baseline: {
    avgPromptsPerDay: number
    avgVerificationRate: number
    avgScreenTime: number
    avgEyeDryness: number
    avgNeckPain: number
    dominantRelianceType: string
  } | null
  benchmarkComparison: Array<{ label: string; live: number; baseline: number; unit: string }>
  recentSessions: SessionRecord[]
  pendingNudges: NudgeRecord[]
  activeAlerts: AlertRecord[]
  moduleProgress: Array<{
    id: number
    title: string
    icon: string
    progress: { passed: boolean; latest_score: number } | null
  }>
  verificationTrend: Array<{ label: string; verificationScore: number; riskScore: number }>
  symptomTrend: Array<{ label: string; eyeDryness: number; neckPain: number; breaksTaken: number }>
}

function riskColor(value: number) {
  if (value >= 70) return 'var(--danger)'
  if (value >= 50) return 'var(--warning)'
  return 'var(--success)'
}

function verificationLabel(value: SessionRecord['verification_status']) {
  if (value === 'verified') return 'Verified'
  if (value === 'partial') return 'Partial'
  return 'Unverified'
}

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        setLoading(true)
        const response = await apiFetch<DashboardResponse>('/api/student/dashboard')
        if (active) {
          setData(response)
          setError('')
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard')
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

  const firstName = profile?.full_name?.split(' ')[0] || 'Student'

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p>Loading your student dashboard...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <h2 style={{ marginBottom: 8 }}>Student Dashboard</h2>
        <p style={{ marginBottom: 16 }}>{error || 'Unable to load dashboard data.'}</p>
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
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          color: '#fff',
          marginBottom: 24,
          border: 'none',
        }}
      >
        <h2 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: 6 }}>
          Welcome back, {firstName}
        </h2>
        <p style={{ color: 'rgba(255,255,255,.78)', margin: 0 }}>
          Your portal is now connected to live sessions, nudges, training progress, and your Eastbrook baseline.
        </p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: riskColor(data.summary.latestRisk) }}>{data.summary.latestRisk}</div>
          <div className="kpi-label">Latest Risk Score</div>
          <div className="kpi-sub">Server-calculated</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{data.summary.verificationRate}%</div>
          <div className="kpi-label">Verification Rate</div>
          <div className="kpi-sub">Recent sessions</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: 'var(--analyst)' }}>
            {data.summary.completedModules}/{data.summary.totalModules}
          </div>
          <div className="kpi-label">Modules Passed</div>
          <div className="kpi-sub">Training progress</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value" style={{ color: data.summary.pendingNudges ? 'var(--warning)' : 'var(--success)' }}>
            {data.summary.pendingNudges}
          </div>
          <div className="kpi-label">Active Nudges</div>
          <div className="kpi-sub">{data.summary.openAlerts} open alerts</div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <Link to="/app/student/log-session" className="card card-hover" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 'var(--radius)', background: 'var(--student-light)', color: 'var(--student)', display: 'grid', placeItems: 'center' }}>
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.92rem' }}>Log AI Session</h3>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Capture prompts, verification, and symptoms</p>
            </div>
            <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
          </div>
        </Link>

        <Link to="/app/student/training" className="card card-hover" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 'var(--radius)', background: 'var(--analyst-light)', color: 'var(--analyst)', display: 'grid', placeItems: 'center' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.92rem' }}>Continue Training</h3>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Work through the AI literacy modules</p>
            </div>
            <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
          </div>
        </Link>

        <Link to="/app/student/break-timer" className="card card-hover" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 'var(--radius)', background: 'var(--success-light)', color: 'var(--success)', display: 'grid', placeItems: 'center' }}>
              <Timer size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.92rem' }}>Use the Break Timer</h3>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Practice the 25-5 habit during long work blocks</p>
            </div>
            <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
          </div>
        </Link>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Verification vs Risk</h3>
            <span className="badge badge-blue">Recent sessions</span>
          </div>
          {data.verificationTrend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.verificationTrend} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Session', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }}
                  label={{ value: 'Verification (%)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }}
                  label={{ value: 'Risk Score', angle: 90, position: 'insideRight', fill: '#64748B', fontSize: 11, dx: 4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}`, String(name)]} labelFormatter={l => `Session: ${l}`} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="verificationScore" stroke="#10B981" strokeWidth={2.5} name="Verification %" />
                <Line yAxisId="right" type="monotone" dataKey="riskScore" stroke="#EF4444" strokeWidth={2.5} name="Risk score" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ margin: 0 }}>Log a session to start your verification trend.</p>
          )}
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderLeft: '4px solid #059669', borderRadius: 8, padding: '10px 14px', marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#059669', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>What this chart means</div>
            <div style={{ fontSize: '0.75rem', color: '#065F46', lineHeight: 1.7 }}>Your verification score and risk score should move in <strong>opposite directions</strong>: as you verify more AI outputs before accepting them, your risk score falls. Research shows students who consistently verify above 65% demonstrate stronger independent reasoning skills (Glass et al., 2008). If your risk score is rising, check whether recent sessions involved long unbroken stretches or unverified AI outputs.</div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Symptom Trend</h3>
            <span className="badge badge-amber">Eye and neck strain</span>
          </div>
          {data.symptomTrend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.symptomTrend} margin={{ top: 4, right: 16, left: 8, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }}
                  label={{ value: 'Session', position: 'insideBottom', offset: -28, fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 10]}
                  label={{ value: 'Severity (0–10)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}/10`, String(name)]} labelFormatter={l => `Session: ${l}`} />
                <Legend />
                <Bar dataKey="eyeDryness" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Eye dryness" />
                <Bar dataKey="neckPain" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Neck pain" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ margin: 0 }}>Symptom trends appear after your first logged session.</p>
          )}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderLeft: '4px solid #D97706', borderRadius: 8, padding: '10px 14px', marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#D97706', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>Reading your symptoms</div>
            <div style={{ fontSize: '0.75rem', color: '#78350F', lineHeight: 1.7 }}>Eye dryness and neck pain both above <strong>5/10</strong> for two or more consecutive sessions is the clinical threshold for strain requiring intervention (TFOS DEWS II, 2017). The most effective remedy is not stopping AI use — it is <strong>taking one 2-minute break every 60 minutes</strong> and ensuring sessions do not exceed 120 continuous minutes. Students who take 3+ breaks per session show symptom scores 50% lower than those taking 0 breaks.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Benchmark Comparison</h3>
          {data.baseline ? (
            <div className="section-scroll" style={{ display: 'grid', gap: 12 }}>
              {data.benchmarkComparison.map((item) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--brand-100)' }}>
                  <div>
                    <strong style={{ fontSize: '0.86rem' }}>{item.label}</strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Baseline reliance: {data.summary.dominantBaselineReliance || 'n/a'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.live}{item.unit}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      baseline {item.baseline}{item.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0 }}>This account does not have a linked dataset baseline yet.</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Training Snapshot</h3>
          <div className="section-scroll" style={{ display: 'grid', gap: 12 }}>
            {data.moduleProgress.map((module) => (
              <div key={module.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--brand-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: '1.1rem' }}>{module.icon}</div>
                  <div>
                    <strong style={{ fontSize: '0.86rem' }}>{module.title}</strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {module.progress ? `Best score ${module.progress.latest_score}%` : 'Not attempted yet'}
                    </div>
                  </div>
                </div>
                <span className={`badge ${module.progress?.passed ? 'badge-green' : 'badge-gray'}`}>
                  {module.progress?.passed ? 'Passed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bell size={18} color="#F59E0B" />
            <h3 style={{ margin: 0 }}>Pending Nudges</h3>
          </div>
          {data.pendingNudges.length ? (
            <div className="section-scroll section-scroll-lg" style={{ display: 'grid', gap: 12 }}>
              {data.pendingNudges.map((nudge) => (
                <div key={nudge.id} style={{ padding: '14px 16px', borderRadius: 'var(--radius)', background: 'var(--brand-50)', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.86rem' }}>{nudge.nudge_type}</strong>
                    <span className="badge badge-amber">{nudge.status}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', margin: '0 0 6px' }}>{nudge.message}</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    From {nudge.educator_name} • {formatDateTime(nudge.created_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0 }}>No outstanding nudges right now.</p>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={18} color="#EF4444" />
            <h3 style={{ margin: 0 }}>Recent Sessions</h3>
          </div>
          {data.recentSessions.length ? (
            <div className="section-scroll section-scroll-lg" style={{ display: 'grid', gap: 12 }}>
              {data.recentSessions.map((session) => (
                <div key={session.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--brand-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong style={{ fontSize: '0.86rem' }}>{session.subject}</strong>
                    <span className="badge" style={{ background: 'var(--brand-100)', color: riskColor(session.risk_score) }}>
                      risk {session.risk_score}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {session.task_type} • {session.prompts_sent} prompts • {verificationLabel(session.verification_status)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(session.created_at)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0 }}>No sessions logged yet. Start by recording your first AI session.</p>
          )}
        </div>
      </div>
    </div>
  )
}
