
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Bell, BookOpen, ArrowRight, Users, Eye, Brain, Activity } from 'lucide-react'
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
        if (active) setData(response)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load overview')
      }
    }
    void loadOverview()
    return () => { active = false }
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
    <div style={{ 
      minHeight: '100vh', 
      position: 'relative',
      overflow: 'hidden',
      color: '#fff',
      fontFamily: 'var(--font-family, system-ui, sans-serif)'
    }}>
      {/* Background Image & Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=2400&q=80&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        zIndex: -2,
        transform: 'scale(1.02)'
      }} />
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.95) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(30, 41, 59, 0.9) 100%)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: -1
      }} />

      {/* Navigation */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 40px',
          height: 72,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em', color: '#fff' }}>
            Eastbrook <span style={{ color: '#93C5FD', fontWeight: 600 }}>Youth AI</span>
            <span style={{ fontWeight: 400, marginLeft: 8, fontSize: '1.1rem', color: '#CBD5E1', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 10 }}>Well-Being Platform</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button className="nav-btn" onClick={() => navigate('/tour')}>
            Guided Tour
          </button>
        </div>
      </nav>

      {/* Main Content Box */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        paddingTop: 140, 
        paddingBottom: 80, 
        paddingLeft: '5%',
        paddingRight: '5%',
        maxWidth: 1400, 
        margin: '0 auto' 
      }}>
        
        {/* Top Hero Layout */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 80 }}>
          <h1 style={{ 
            fontFamily: 'var(--font-heading, "Outfit", sans-serif)', 
            fontSize: 'clamp(3.5rem, 6vw, 5.5rem)', 
            fontWeight: 800, 
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: 24,
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: '900px'
          }}>
            Safeguarding Student AI Adoption
          </h1>
          
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#cbd5e1', 
            marginBottom: 40,
            lineHeight: 1.6,
            fontWeight: 400,
            maxWidth: '680px'
          }}>
            Welcome to Eastbrook's unified portal for digital well-being. Select an institutional role below to enter the live demonstration dashboard.
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              padding: '16px 24px',
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
              marginBottom: 32,
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {/* Premium Glass Metrics */}
          {overview && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 20,
              width: '100%',
              maxWidth: '900px',
              marginBottom: 20,
            }}>
              {[
                { label: 'Enrolled Profiles', value: overview.studentCount.toLocaleString(), sub: 'Active Eastbrook Students', icon: <Users size={18} /> },
                { label: 'Data Points', value: overview.observationCount.toLocaleString(), sub: 'AS-IS & TO-BE Combined', icon: <Activity size={18} /> },
                { label: 'Verification Rate', value: `${overview.heroStats.avgVerificationRate}%`, sub: 'Current AS-IS Baseline', icon: <Eye size={18} /> },
                { label: 'Daily Prompts', value: overview.heroStats.totalDailyPrompts.toLocaleString(), sub: 'Average System Load', icon: <Brain size={18} /> }
              ].map((stat, i) => (
                <div key={i} style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '20px',
                  padding: '24px 20px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, color: '#93C5FD', 
                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12
                  }}>
                    {stat.icon} {stat.label}
                  </div>
                  <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: 8, fontWeight: 500 }}>
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Portal Entry Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 28, 
          textAlign: 'left' 
        }}>
          {[
            {
              role: 'student' as const,
              title: 'Student Portal',
              desc: 'Log daily AI usage, complete training modules, and track your ongoing digital well-being score.',
              icon: <BookOpen size={28} />,
              color: '#3B82F6',
              bgLight: 'rgba(59, 130, 246, 0.15)',
              borderLight: 'rgba(59, 130, 246, 0.3)',
            },
            {
              role: 'educator' as const,
              title: 'Educator Console',
              desc: 'Monitor your cohort, review automated AI safety alerts, and send supportive nudges to students.',
              icon: <Bell size={28} />,
              color: '#10B981',
              bgLight: 'rgba(16, 185, 129, 0.15)',
              borderLight: 'rgba(16, 185, 129, 0.3)',
            },
            {
              role: 'analyst' as const,
              title: 'Analyst Dashboard',
              desc: 'Compare AS-IS vs TO-BE dataset phases to evaluate the impact of interventions.',
              icon: <BarChart3 size={28} />,
              color: '#A855F7',
              bgLight: 'rgba(168, 85, 247, 0.15)',
              borderLight: 'rgba(168, 85, 247, 0.3)',
            }
          ].map((entry) => (
            <button 
              key={entry.role}
              onClick={() => handleRoleSelect(entry.role)}
              className="premium-role-card"
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '40px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Glow Behind Icon */}
              <div style={{
                position: 'absolute',
                top: 30, right: 30,
                width: 80, height: 80,
                background: entry.color,
                filter: 'blur(50px)',
                opacity: 0.15,
                borderRadius: '50%',
                zIndex: 0
              }} />

              <div style={{ 
                background: entry.bgLight, 
                color: entry.color,
                border: `1px solid ${entry.borderLight}`,
                padding: '16px', 
                borderRadius: '18px',
                marginBottom: 28,
                zIndex: 1
              }}>
                {entry.icon}
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 12, zIndex: 1 }}>
                {entry.title}
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '1.05rem', marginBottom: 32, lineHeight: 1.6, flex: 1, zIndex: 1 }}>
                {entry.desc}
              </p>
              <div className="card-cta" style={{ 
                display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 600, fontSize: '0.95rem',
                background: entry.color,
                padding: '12px 24px',
                borderRadius: '99px',
                zIndex: 1,
                transition: 'transform 0.3s ease'
              }}>
                Enter Access <ArrowRight size={18} />
              </div>
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div style={{ marginTop: 80, textAlign: 'center', paddingTop: 60 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            Eastbrook High School Digital Well-Being Prototype. No actual student data is used.
          </p>
        </div>
      </div>

      <style>{`
        .nav-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .nav-btn:hover {
          color: #fff;
        }
        .premium-role-card:hover {
          transform: translateY(-8px);
          background: rgba(30, 41, 59, 0.7) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          box-shadow: 0 30px 60px -15px rgba(0,0,0,0.5) !important;
        }
        .premium-role-card:hover .card-cta {
          transform: translateX(4px);
        }
      `}</style>
    </div>
  )
}
