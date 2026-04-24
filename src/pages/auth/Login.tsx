import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Lock, Mail, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { apiFetch } from '../../lib/api'

interface DemoUsersResponse {
  demoUsers: {
    student: { email: string; full_name: string } | null
    educator: { email: string; full_name: string } | null
    analyst: { email: string; full_name: string } | null
  }
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoUsers, setDemoUsers] = useState<DemoUsersResponse['demoUsers'] | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    async function loadDemoUsers() {
      try {
        const response = await apiFetch<DemoUsersResponse>('/api/public/overview', { auth: false })
        if (active) {
          setDemoUsers(response.demoUsers)
        }
      } catch {
        if (active) {
          setDemoUsers(null)
        }
      }
    }

    void loadDemoUsers()

    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    navigate('/app')
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
            <Shield size={32} color="#60A5FA" />
            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              Eastbrook <span style={{ color: '#93C5FD' }}>AI Well-Being</span>
            </span>
          </div>
          <h1>Sign In to the Unified App</h1>
          <p style={{ marginTop: 12 }}>
            The final site now runs student operations, educator interventions, and analyst research views from one shared backend.
          </p>
          <div style={{ marginTop: 40, display: 'grid', gap: 14 }}>
            {[
              'Students track live AI session behaviour and nudges',
              'Educators monitor alerts and send interventions',
              'Analysts compare AS-IS and TO-BE data dynamically',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: '#86EFAC', fontWeight: 700 }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,.72)', fontSize: '0.88rem' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Log In</h2>
          <p className="auth-sub">Use your account to enter the Eastbrook platform.</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="you@eastbrook.edu"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer">
            Need a new account? <Link to="/signup">Create one here</Link>
          </div>

          <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--brand-50)', borderRadius: 'var(--radius)', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Seeded Demo Emails
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <strong>Student:</strong> {demoUsers?.student?.email ?? 'Created during setup'}<br />
              <strong>Educator:</strong> {demoUsers?.educator?.email ?? 'educator@eastbrook.edu'}<br />
              <strong>Analyst:</strong> {demoUsers?.analyst?.email ?? 'analyst@eastbrook.edu'}<br />
              <strong>Password:</strong> use the demo password printed by `npm run db:init`
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
