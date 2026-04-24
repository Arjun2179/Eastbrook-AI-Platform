import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, BookOpen, GraduationCap, Loader2, Lock, Mail, Shield, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ROLES = [
  { value: 'student', label: 'Student', icon: <GraduationCap size={20} /> },
  { value: 'educator', label: 'Educator', icon: <BookOpen size={20} /> },
  { value: 'analyst', label: 'Analyst', icon: <BarChart3 size={20} /> },
]

const GRADES = ['8', '9', '10', '11', '12']

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('student')
  const [grade, setGrade] = useState('10')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const result = await signUp(email, password, fullName, role, role === 'student' ? grade : undefined)
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
          <h1>Create a Live Account</h1>
          <p style={{ marginTop: 12 }}>
            New users join the same unified product instead of a separate demo branch.
          </p>
          <div style={{ marginTop: 40, display: 'grid', gap: 12 }}>
            {[
              'Student signups can log sessions immediately',
              'New student accounts are assigned to the default educator cohort',
              'Educator and analyst signups work against the live backend',
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
          <h2>Create Account</h2>
          <p className="auth-sub">Choose your role and start using the live system.</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Avery Johnson"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@eastbrook.edu"
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <div className="role-selector">
                {ROLES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`role-option ${role === option.value ? 'selected' : ''}`}
                    data-role={option.value}
                    onClick={() => setRole(option.value)}
                  >
                    <div className="role-icon">{option.icon}</div>
                    <div className="role-name">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {role === 'student' && (
              <div className="form-group">
                <label className="form-label">Grade</label>
                <select className="form-input" value={grade} onChange={(event) => setGrade(event.target.value)}>
                  {GRADES.map((option) => (
                    <option key={option} value={option}>
                      Grade {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner" /> Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Log in instead</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
