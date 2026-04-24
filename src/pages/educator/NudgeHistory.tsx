import { useEffect, useMemo, useState } from 'react'
import { Bell, Send } from 'lucide-react'
import { apiFetch, formatDateTime } from '../../lib/api'

interface RosterResponse {
  roster: Array<{
    id: string
    full_name: string
    grade: string
  }>
}

interface NudgesResponse {
  nudges: Array<{
    id: string
    student_id: string
    student_name: string
    grade: string
    nudge_type: string
    message: string
    status: string
    created_at: string
    impact?: { improvement: number } | null
  }>
}

const TEMPLATES = [
  {
    type: 'verification',
    label: 'Verification reminder',
    message: 'Please cross-check the key AI outputs from your recent work using the Source → Logic → Cross-check process.',
  },
  {
    type: 'break',
    label: 'Break suggestion',
    message: 'Your recent session pattern suggests fatigue. Please take a short screen break and use the 25-5 timer before the next task.',
  },
  {
    type: 'coaching',
    label: 'Coaching check-in',
    message: 'Please review the training module tied to your recent alert so we can improve verification habits before your next submission.',
  },
]

export default function NudgeHistory() {
  const [students, setStudents] = useState<RosterResponse['roster']>([])
  const [nudges, setNudges] = useState<NudgesResponse['nudges']>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [templateIndex, setTemplateIndex] = useState(0)
  const [message, setMessage] = useState(TEMPLATES[0].message)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadPageData() {
    try {
      setLoading(true)
      const [rosterResponse, nudgeResponse] = await Promise.all([
        apiFetch<RosterResponse>('/api/educator/roster?search=&risk=all&sort=name'),
        apiFetch<NudgesResponse>('/api/educator/nudges'),
      ])
      setStudents(rosterResponse.roster)
      setNudges(nudgeResponse.nudges)
      setSelectedStudentId((current) => current || rosterResponse.roster[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nudge history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [])

  const selectedTemplate = TEMPLATES[templateIndex]

  useEffect(() => {
    setMessage(selectedTemplate.message)
  }, [selectedTemplate])

  const groupedNudges = useMemo(() => nudges.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)), [nudges])

  async function sendNudge() {
    if (!selectedStudentId) return
    setSaving(true)
    setError('')

    try {
      await apiFetch('/api/educator/nudges', {
        method: 'POST',
        body: {
          student_id: selectedStudentId,
          nudge_type: selectedTemplate.label,
          message,
        },
      })
      await loadPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send nudge')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Nudge History</h2>
      <p style={{ marginBottom: 24 }}>
        Send new nudges from the live roster and review the full intervention trail, including status updates and verification change.
      </p>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid grid-2" style={{ alignItems: 'stretch' }}>
        <div className="card card-scroll-shell card-scroll-md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Send size={18} color="#3B82F6" />
            <h3 style={{ margin: 0 }}>Send New Nudge</h3>
          </div>

          {loading ? (
            <div className="loading-page" style={{ minHeight: 200 }}>
              <div className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : (
            <div className="card-scroll-body">
              <div style={{ display: 'grid', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select className="form-input" value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name} • Grade {student.grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Template</label>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {TEMPLATES.map((template, index) => (
                      <button
                        key={template.type}
                        type="button"
                        onClick={() => setTemplateIndex(index)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius)',
                          border: `2px solid ${templateIndex === index ? 'var(--student)' : 'var(--card-border)'}`,
                          background: templateIndex === index ? 'var(--student-light)' : '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <strong style={{ fontSize: '0.84rem' }}>{template.label}</strong>
                        <p style={{ fontSize: '0.78rem', margin: '4px 0 0' }}>{template.message}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-input"
                    rows={5}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </div>

                <button className="btn btn-primary" disabled={saving || !selectedStudentId || !message.trim()} onClick={sendNudge}>
                  {saving ? 'Sending...' : 'Send Nudge'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card card-scroll-shell card-scroll-md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bell size={18} color="#F59E0B" />
            <h3 style={{ margin: 0 }}>Nudge Audit Trail</h3>
          </div>

          {loading ? (
            <div className="loading-page" style={{ minHeight: 200 }}>
              <div className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : groupedNudges.length ? (
            <div className="card-scroll-body">
              <div style={{ display: 'grid', gap: 12 }}>
                {groupedNudges.map((nudge) => (
                  <div key={nudge.id} style={{ padding: '12px 14px', borderRadius: 'var(--radius)', background: 'var(--brand-50)', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                      <strong style={{ fontSize: '0.84rem' }}>{nudge.student_name}</strong>
                      <span className="badge badge-gray">{nudge.status}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {nudge.nudge_type} • Grade {nudge.grade}
                    </div>
                    <p style={{ fontSize: '0.8rem', margin: '6px 0' }}>{nudge.message}</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(nudge.created_at)}</div>
                    {nudge.impact && (
                      <div style={{ marginTop: 6, fontSize: '0.76rem', color: nudge.impact.improvement >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        Verification change {Math.round(nudge.impact.improvement * 100)} pts
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ margin: 0 }}>No nudges have been sent yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
