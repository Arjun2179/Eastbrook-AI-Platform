import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '../../lib/api'

const SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Computer Science', 'Arts']
const TASK_TYPES = ['Research', 'Writing', 'Problem Solving', 'Revision', 'Presentation']
const VERIFICATION_OPTIONS = [
  { value: 'verified', label: 'Verified all key outputs' },
  { value: 'partial', label: 'Verified some outputs' },
  { value: 'unverified', label: 'Did not verify outputs' },
]

interface SubmissionResponse {
  session: {
    id: string
    risk_score: number
    verification_status: 'verified' | 'partial' | 'unverified'
    duration_minutes: number
    prompts_sent: number
  }
  alert: {
    id: string
    alert_level: string
    reason: string
  } | null
}

function riskColor(value: number) {
  if (value >= 70) return 'var(--danger)'
  if (value >= 50) return 'var(--warning)'
  return 'var(--success)'
}

function riskLabel(value: number) {
  if (value >= 70) return 'High Risk'
  if (value >= 50) return 'Moderate Risk'
  return 'Low Risk'
}

function followUpLink(result: SubmissionResponse | null) {
  if (!result) return null
  if (result.session.verification_status === 'unverified') {
    return { to: '/app/student/training', label: 'Open Verification Training' }
  }
  if (result.session.risk_score >= 50) {
    return { to: '/app/student/break-timer', label: 'Start Break Timer' }
  }
  return { to: '/app/student', label: 'Return to Dashboard' }
}

export default function SessionLogger() {
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [taskType, setTaskType] = useState(TASK_TYPES[0])
  const [durationMin, setDurationMin] = useState(45)
  const [promptsSent, setPromptsSent] = useState(8)
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'partial' | 'unverified'>('verified')
  const [breaksTaken, setBreaksTaken] = useState(1)
  const [eyeDrynessScore, setEyeDrynessScore] = useState(3)
  const [neckPainScore, setNeckPainScore] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SubmissionResponse | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiFetch<SubmissionResponse>('/api/student/sessions', {
        method: 'POST',
        body: {
          subject,
          taskType,
          durationMin,
          promptsSent,
          verificationStatus,
          breaksTaken,
          eyeDrynessScore,
          neckPainScore,
        },
      })
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log session')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setResult(null)
    setError('')
  }

  const nextAction = followUpLink(result)

  if (result) {
    return (
      <div>
        <h2 style={{ marginBottom: 8 }}>Session Saved</h2>
        <p style={{ marginBottom: 24 }}>Your session has been written to the live backend and scored by the shared risk service.</p>

        <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Calculated Risk Score</div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: riskColor(result.session.risk_score), lineHeight: 1 }}>
            {result.session.risk_score}
          </div>
          <span
            className="badge"
            style={{
              marginTop: 8,
              background: result.session.risk_score >= 70 ? 'var(--danger-light)' : result.session.risk_score >= 50 ? 'var(--warning-light)' : 'var(--success-light)',
              color: result.session.risk_score >= 70 ? '#991B1B' : result.session.risk_score >= 50 ? '#92400E' : '#065F46',
            }}
          >
            {riskLabel(result.session.risk_score)}
          </span>
          <div className="risk-meter" style={{ maxWidth: 320, margin: '16px auto 0' }}>
            <div className="risk-meter-fill" style={{ width: `${result.session.risk_score}%`, background: riskColor(result.session.risk_score) }} />
          </div>
        </div>

        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Session Summary</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Duration</span>
                <strong>{result.session.duration_minutes} min</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Prompts</span>
                <strong>{result.session.prompts_sent}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Verification</span>
                <strong>{VERIFICATION_OPTIONS.find((item) => item.value === result.session.verification_status)?.label}</strong>
              </div>
            </div>
          </div>

          <div className="card" style={{ borderLeft: `4px solid ${result.alert ? riskColor(result.session.risk_score) : 'var(--success)'}` }}>
            <h3 style={{ marginBottom: 10 }}>{result.alert ? 'Alert Created' : 'Healthy Session'}</h3>
            <p style={{ marginBottom: 8 }}>
              {result.alert
                ? `${result.alert.alert_level.toUpperCase()} alert opened for your educator.`
                : 'No alert was needed for this session.'}
            </p>
            {result.alert ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong>Reason:</strong> {result.alert.reason}
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Keep using these habits.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {nextAction && (
            <Link to={nextAction.to} className="btn btn-primary">
              {nextAction.label} <ArrowRight size={16} />
            </Link>
          )}
          <button className="btn btn-secondary" onClick={resetForm}>
            Log Another Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Log AI Session</h2>
      <p style={{ marginBottom: 24 }}>
        Submit the real details of your AI-supported work. Risk scoring and alert creation happen on the server after save.
      </p>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-input" value={subject} onChange={(event) => setSubject(event.target.value)}>
                {SUBJECTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Task Type</label>
              <select className="form-input" value={taskType} onChange={(event) => setTaskType(event.target.value)}>
                {TASK_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input type="number" min={1} max={720} className="form-input" value={durationMin} onChange={(event) => setDurationMin(Number(event.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Prompts Sent</label>
                <input type="number" min={0} max={500} className="form-input" value={promptsSent} onChange={(event) => setPromptsSent(Number(event.target.value))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Verification Status</label>
              <div className="toggle-group">
                {VERIFICATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`toggle-opt ${verificationStatus === option.value ? 'sel-yes' : ''}`}
                    onClick={() => setVerificationStatus(option.value as 'verified' | 'partial' | 'unverified')}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">Breaks Taken</label>
                <input type="number" min={0} max={20} className="form-input" value={breaksTaken} onChange={(event) => setBreaksTaken(Number(event.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Eye Dryness (0-10)</label>
                <input type="number" min={0} max={10} className="form-input" value={eyeDrynessScore} onChange={(event) => setEyeDrynessScore(Number(event.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Neck Pain (0-10)</label>
                <input type="number" min={0} max={10} className="form-input" value={neckPainScore} onChange={(event) => setNeckPainScore(Number(event.target.value))} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? 'Saving Session...' : 'Save Session'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>What happens after save?</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', background: 'var(--brand-50)' }}>
              <strong style={{ fontSize: '0.84rem' }}>1. Risk score is calculated</strong>
              <p style={{ fontSize: '0.8rem', margin: '6px 0 0' }}>
                Duration, prompt volume, verification behaviour, breaks, and physical strain are scored on the backend.
              </p>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', background: 'var(--brand-50)' }}>
              <strong style={{ fontSize: '0.84rem' }}>2. Alerts can open automatically</strong>
              <p style={{ fontSize: '0.8rem', margin: '6px 0 0' }}>
                Moderate and high-risk sessions create alerts for the educator workflow.
              </p>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius)', background: 'var(--brand-50)' }}>
              <strong style={{ fontSize: '0.84rem' }}>3. Dashboards refresh with live data</strong>
              <p style={{ fontSize: '0.8rem', margin: '6px 0 0' }}>
                Your student dashboard, educator roster, and intervention metrics all update from the same write.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--warning)', fontSize: '0.82rem' }}>
            <AlertTriangle size={16} /> Only real API-backed fields are used here. No mock scoring is happening in the browser.
          </div>
        </div>
      </div>
    </div>
  )
}
