import { useEffect, useState } from 'react'
import { Search, UserRound } from 'lucide-react'
import { apiFetch, formatDateTime } from '../../lib/api'

interface RosterStudent {
  id: string
  full_name: string
  email: string
  grade: string
  age_group: string
  average_risk: number
  total_sessions: number
  verification_rate: number
  last_session_at: string | null
  last_activity_label: string | null
  open_alerts: number
  active_nudges: number
}

interface RosterResponse {
  roster: RosterStudent[]
}

interface StudentDetailResponse {
  profile: {
    id: string
    full_name: string
    email: string
    grade: string
    age_group: string
  }
  baseline: {
    avgVerificationRate: number
    avgPromptsPerDay: number
    avgEyeDryness: number
    avgNeckPain: number
    dominantRelianceType: string
  } | null
  summary: {
    averageRisk: number
    verificationRate: number
  }
  alerts: Array<{ id: string; alert_level: string; reason: string; status: string }>
  nudges: Array<{ id: string; status: string; nudge_type: string; created_at: string }>
  training: Array<{ id: number; title: string; progress: { passed: boolean; best_score: number } | null }>
}

function riskColor(value: number) {
  if (value >= 70) return 'var(--danger)'
  if (value >= 50) return 'var(--warning)'
  return 'var(--success)'
}

export default function StudentRoster() {
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('all')
  const [sort, setSort] = useState('name')
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [detail, setDetail] = useState<StudentDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadRoster() {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          search,
          risk,
          sort,
        })
        const response = await apiFetch<RosterResponse>(`/api/educator/roster?${params.toString()}`)
        if (active) {
          setRoster(response.roster)
          if (!selectedStudentId && response.roster[0]) {
            setSelectedStudentId(response.roster[0].id)
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load roster')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadRoster()

    return () => {
      active = false
    }
  }, [risk, search, sort])

  useEffect(() => {
    if (!selectedStudentId) return
    let active = true

    async function loadDetail() {
      try {
        setDetailLoading(true)
        const response = await apiFetch<StudentDetailResponse>(`/api/educator/students/${selectedStudentId}`)
        if (active) {
          setDetail(response)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load student detail')
        }
      } finally {
        if (active) {
          setDetailLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      active = false
    }
  }, [selectedStudentId])

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Student Roster</h2>
      <p style={{ marginBottom: 24 }}>
        Search, filter, and sort the educator cohort using server-side data, then inspect a student’s live detail view.
      </p>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'stretch' }}>
        <div className="card card-scroll-shell card-scroll-lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by student name or email"
                style={{ paddingLeft: 32 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select className="form-input" value={risk} onChange={(event) => setRisk(event.target.value)} style={{ width: 'auto' }}>
                <option value="all">All risk levels</option>
                <option value="high">High risk</option>
                <option value="moderate">Moderate risk</option>
                <option value="low">Low risk</option>
              </select>
              <select className="form-input" value={sort} onChange={(event) => setSort(event.target.value)} style={{ width: 'auto' }}>
                <option value="name">Sort by name</option>
                <option value="risk">Sort by risk</option>
                <option value="sessions">Sort by sessions</option>
                <option value="verification">Sort by verification</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-page" style={{ minHeight: 220 }}>
              <div className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : (
            <div className="card-scroll-body">
              <div className="table-wrap table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Risk</th>
                      <th>Verification</th>
                      <th>Sessions</th>
                      <th>Alerts</th>
                      <th>Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((student) => (
                      <tr
                        key={student.id}
                        onClick={() => setSelectedStudentId(student.id)}
                        style={{ cursor: 'pointer', background: selectedStudentId === student.id ? 'var(--brand-50)' : undefined }}
                      >
                        <td>
                          <div style={{ fontWeight: 600 }}>{student.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Grade {student.grade} • {student.age_group}
                          </div>
                        </td>
                        <td style={{ color: riskColor(student.average_risk), fontWeight: 700 }}>{student.average_risk}</td>
                        <td>{student.verification_rate}%</td>
                        <td>{student.total_sessions}</td>
                        <td>{student.open_alerts}</td>
                        <td>{student.last_activity_label || formatDateTime(student.last_session_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="card card-scroll-shell card-scroll-lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <UserRound size={18} color="#2563EB" />
            <h3 style={{ margin: 0 }}>Student Detail</h3>
          </div>

          {detailLoading ? (
            <div className="loading-page" style={{ minHeight: 220 }}>
              <div className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : detail ? (
            <div className="card-scroll-body">
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.92rem' }}>{detail.profile.full_name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {detail.profile.email} • Grade {detail.profile.grade}
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Average Risk</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: riskColor(detail.summary.averageRisk) }}>{detail.summary.averageRisk}</div>
                  </div>
                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Verification</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{detail.summary.verificationRate}%</div>
                  </div>
                </div>

                <div>
                  <strong style={{ display: 'block', marginBottom: 8, fontSize: '0.84rem' }}>Current Alerts</strong>
                  {detail.alerts.length ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {detail.alerts.slice(0, 3).map((alert) => (
                        <div key={alert.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius)', background: 'var(--brand-50)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <strong style={{ fontSize: '0.8rem' }}>{alert.alert_level}</strong>
                            <span className="badge badge-gray">{alert.status}</span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{alert.reason}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0 }}>No alerts on record.</p>
                  )}
                </div>

                <div>
                  <strong style={{ display: 'block', marginBottom: 8, fontSize: '0.84rem' }}>Training Status</strong>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {detail.training.map((module) => (
                      <div key={module.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--brand-100)' }}>
                        <span style={{ fontSize: '0.8rem' }}>{module.title}</span>
                        <span className={`badge ${module.progress?.passed ? 'badge-green' : 'badge-gray'}`}>
                          {module.progress?.passed ? `${module.progress.best_score}%` : 'Not passed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {detail.baseline && (
                  <div>
                    <strong style={{ display: 'block', marginBottom: 8, fontSize: '0.84rem' }}>Dataset Baseline</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      Verification {detail.baseline.avgVerificationRate}% • Prompts {detail.baseline.avgPromptsPerDay}/day
                      <br />
                      Eye dryness {detail.baseline.avgEyeDryness}/10 • Dominant reliance {detail.baseline.dominantRelianceType}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ margin: 0 }}>Select a student to view detail.</p>
          )}
        </div>
      </div>
    </div>
  )
}
