import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Bell, BookOpen, Shield, ArrowRight } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

interface PublicOverviewResponse {
  overview: {
    studentCount: number
    observationCount: number
    phases: string[]
    heroStats: {
      totalDailyPrompts: number
      avgScreenTime: number
      avgVerificationRate: number
      avgEyeDryness: number
    }
  }
}

export default function Landing() {
  const [data, setData] = useState<PublicOverviewResponse | null>(null)
  const [error, setError] = useState('')
  const { signInAsRole } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    async function loadOverview() {
      try {
        const response = await apiFetch<PublicOverviewResponse>('/api/public/overview', { auth: false })
        if (active) {
          setData(response)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load overview')
        }
      }
    }

    void loadOverview()

    return () => {
      active = false
    }
  }, [])

  async function handleRoleSelect(role: 'student' | 'educator' | 'analyst') {
    try {
      setError('')
      await signInAsRole(role)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open prototype access.')
    }
  }

  const overview = data?.overview

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(15,23,42,.4)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,.05)',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={24} color="var(--primary)" />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
            Eastbrook <span style={{ color: 'var(--primary)' }}>Youth AI</span>
          </span>
        </div>
      </nav>

      <section className="landing-hero" style={{ paddingTop: 160, paddingBottom: 80, textAlign: 'center' }}>
        <div className="landing-hero-content" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(96,165,250,.1)',
              border: '1px solid rgba(96,165,250,.2)',
              borderRadius: 'var(--radius-full)',
              padding: '8px 20px',
              marginBottom: 32,
              fontSize: '0.85rem',
              color: '#BFDBFE',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            <Shield size={16} /> Prototype Access Portal
          </div>
          <h1 style={{ 
            fontFamily: 'var(--font-heading)', 
            fontSize: 'clamp(3rem, 5vw, 4.5rem)', 
            fontWeight: 800, 
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: 24,
            background: 'linear-gradient(to right, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI Safety & Well-Being
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'var(--text-secondary)', 
            marginBottom: 64,
            lineHeight: 1.6,
            maxWidth: 600,
            margin: '0 auto 64px'
          }}>
            Select a role below to enter the prototype. No email or password screen is required for the assignment submission.
          </p>

          {error && (
            <div style={{
              maxWidth: 680,
              margin: '0 auto 24px',
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.24)',
              color: '#FECACA',
              fontSize: '0.86rem',
              textAlign: 'left',
            }}>
              {error}
            </div>
          )}

          {overview && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
              marginBottom: 32,
            }}>
              <div className="card" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
                <div style={{ color: '#BFDBFE', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                  Dataset
                </div>
                <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>{overview.studentCount}</div>
                <div style={{ color: 'rgba(255,255,255,.64)', fontSize: '0.8rem' }}>linked student profiles</div>
              </div>
              <div className="card" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
                <div style={{ color: '#BFDBFE', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                  Observations
                </div>
                <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>{overview.observationCount.toLocaleString()}</div>
                <div style={{ color: 'rgba(255,255,255,.64)', fontSize: '0.8rem' }}>{overview.phases.join(' + ')}</div>
              </div>
              <div className="card" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
                <div style={{ color: '#BFDBFE', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                  AS-IS Verification
                </div>
                <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>{overview.heroStats.avgVerificationRate}%</div>
                <div style={{ color: 'rgba(255,255,255,.64)', fontSize: '0.8rem' }}>baseline behaviour</div>
              </div>
              <div className="card" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}>
                <div style={{ color: '#BFDBFE', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                  Daily Prompts
                </div>
                <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>{overview.heroStats.totalDailyPrompts.toLocaleString()}</div>
                <div style={{ color: 'rgba(255,255,255,.64)', fontSize: '0.8rem' }}>AS-IS average</div>
              </div>
            </div>
          )}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 24, 
            textAlign: 'left' 
          }}>
            {/* Student Card */}
            <button 
              onClick={() => handleRoleSelect('student')}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-lg)',
                padding: 32,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
              className="role-card-hover"
            >
              <div style={{ 
                background: 'rgba(59,130,246,0.15)', 
                color: '#60A5FA',
                padding: 16, 
                borderRadius: 'var(--radius-md)',
                marginBottom: 24
              }}>
                <BookOpen size={32} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: 12 }}>Student Portal</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5, flex: 1, textAlign: 'left' }}>
                Log daily AI usage, complete training modules, and track your digital well-being score.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60A5FA', fontWeight: 600 }}>
                Enter Portal <ArrowRight size={18} />
              </div>
            </button>

            {/* Educator Card */}
            <button 
              onClick={() => handleRoleSelect('educator')}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-lg)',
                padding: 32,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
              className="role-card-hover"
            >
              <div style={{ 
                background: 'rgba(16,185,129,0.15)', 
                color: '#34D399',
                padding: 16, 
                borderRadius: 'var(--radius-md)',
                marginBottom: 24
              }}>
                <Bell size={32} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: 12 }}>Educator Console</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5, flex: 1, textAlign: 'left' }}>
                Monitor your student cohort, review AI safety alerts, and send supportive nudges.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34D399', fontWeight: 600 }}>
                Enter Console <ArrowRight size={18} />
              </div>
            </button>

            {/* Analyst Card */}
            <button 
              onClick={() => handleRoleSelect('analyst')}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-lg)',
                padding: 32,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
              className="role-card-hover"
            >
              <div style={{ 
                background: 'rgba(168,85,247,0.15)', 
                color: '#C084FC',
                padding: 16, 
                borderRadius: 'var(--radius-md)',
                marginBottom: 24
              }}>
                <BarChart3 size={32} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: 12 }}>Analyst Dashboard</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5, flex: 1, textAlign: 'left' }}>
                Compare AS-IS vs TO-BE dataset phases and evaluate the impact of interventions.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#C084FC', fontWeight: 600 }}>
                Enter Dashboard <ArrowRight size={18} />
              </div>
            </button>
          </div>

          <div style={{
            marginTop: 28,
            padding: '18px 22px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            textAlign: 'left',
          }}>
            <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: 10 }}>How to access the prototype</div>
            <div style={{ color: 'rgba(255,255,255,.72)', fontSize: '0.86rem', lineHeight: 1.8 }}>
              1. Choose a role card to open the matching interface.
              <br />
              2. Use the sidebar to move through the student, educator, or analyst workflow.
              <br />
              3. Open <strong>/compare</strong> for the public AS-IS vs TO-BE comparison dashboard used in the assignment.
            </div>
          </div>
        </div>
      </section>

      {/* Inject some CSS for the hover effect */}
      <style>{`
        .role-card-hover:hover {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.15) !important;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  )
}
