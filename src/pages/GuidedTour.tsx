import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Bell, BarChart3, LogIn, ClipboardList, BrainCircuit, TrendingUp, Users, ShieldCheck, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    portal: 'Student Portal',
    color: '#3B82F6',
    bgLight: 'rgba(59,130,246,0.12)',
    borderLight: 'rgba(59,130,246,0.25)',
    icon: <BookOpen size={24} />,
    role: 'student',
    intro: 'The Student Portal is the daily touchpoint for every enrolled Eastbrook student. It tracks AI usage, delivers well-being training, and surfaces personal safety scores.',
    steps: [
      { icon: <LogIn size={18} />, title: 'Click "Student Portal"', desc: 'On the landing page, click the blue "Student Portal" card. You are instantly signed in as a demo student — no password needed.' },
      { icon: <ClipboardList size={18} />, title: 'Log a Session', desc: 'Go to "Log AI Session" in the sidebar. Fill in the AI tool used, duration, verification checkbox, and eye dryness scale. Submit to save the record.' },
      { icon: <BrainCircuit size={18} />, title: 'Complete a Training Module', desc: 'Navigate to "AI Training" and open any module. Read the content and mark it complete. Watch your training progress bar update in real time.' },
      { icon: <TrendingUp size={18} />, title: 'View My Progress', desc: 'Open "My Progress" to see your well-being score trend, screen time log, and completed training badges. This page is the student\'s personal health dashboard.' },
    ]
  },
  {
    portal: 'Educator Console',
    color: '#10B981',
    bgLight: 'rgba(16,185,129,0.12)',
    borderLight: 'rgba(16,185,129,0.25)',
    icon: <Bell size={24} />,
    role: 'educator',
    intro: 'The Educator Console gives teachers a live view of every student in their cohort. It surfaces risk flags, enables instant nudges, and shows aggregate trends across the whole class.',
    steps: [
      { icon: <LogIn size={18} />, title: 'Click "Educator Console"', desc: 'Back on the landing page, click the green "Educator Console" card to sign in as a demo educator.' },
      { icon: <Users size={18} />, title: 'Review the Cohort Dashboard', desc: 'The home page shows live KPIs: total students, average well-being score, high-risk student count, and pending nudges. Scan for red indicators.' },
      { icon: <ShieldCheck size={18} />, title: 'Check Risk Trends', desc: 'Click "Risk Trends" in the sidebar to view time-series charts of screen time, eye dryness, and verification compliance across the whole class.' },
      { icon: <Bell size={18} />, title: 'Send a Nudge', desc: 'Open the "Student Roster", click any at-risk student row, and use the "Send Nudge" button to dispatch a supportive check-in message. View sent nudges under "Nudge History".' },
    ]
  },
  {
    portal: 'Analyst Dashboard',
    color: '#A855F7',
    bgLight: 'rgba(168,85,247,0.12)',
    borderLight: 'rgba(168,85,247,0.25)',
    icon: <BarChart3 size={24} />,
    role: 'analyst',
    intro: 'The Analyst Dashboard is the research layer of the platform. It holds both the AS-IS (pre-intervention) and TO-BE (post-intervention) datasets and lets a researcher answer the five key research questions of the Eastbrook project.',
    steps: [
      { icon: <LogIn size={18} />, title: 'Click "Analyst Dashboard"', desc: 'On the landing page, click the purple "Analyst Dashboard" card to sign in as a demo analyst.' },
      { icon: <BarChart3 size={18} />, title: 'Open the Overview', desc: 'The main dashboard shows side-by-side metric comparisons: verification rate, screen time, eye dryness, and well-being scores between the AS-IS and TO-BE cohorts.' },
      { icon: <TrendingUp size={18} />, title: 'Explore Each Research Question', desc: 'Use the sidebar links RQ1–RQ5 to navigate to each focused analysis. Each section surfaces specific charts answering one research question with statistical evidence.' },
      { icon: <ClipboardList size={18} />, title: 'Public Comparison (no login needed)', desc: 'You can also go directly to /compare from the browser URL bar. This is a public-access page that visualises the AS-IS vs TO-BE comparison without requiring any sign-in.' },
    ]
  }
]

export default function GuidedTour() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      color: '#fff',
      fontFamily: 'var(--font-family, system-ui, sans-serif)',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=2400&q=80&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
        zIndex: -2,
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, rgba(2,6,23,0.97) 0%, rgba(15,23,42,0.93) 60%, rgba(30,41,59,0.95) 100%)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        zIndex: -1,
      }} />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 40px', height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-heading, "Outfit", sans-serif)', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em', color: '#fff' }}>
          Eastbrook <span style={{ color: '#93C5FD', fontWeight: 600 }}>Youth AI</span>
          <span style={{ fontWeight: 400, marginLeft: 8, fontSize: '1.1rem', color: '#CBD5E1', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 10 }}>Well-Being Platform</span>
        </span>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: '99px', padding: '9px 22px',
            color: '#CBD5E1', fontWeight: 600, fontSize: '0.9rem',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >
          <ArrowLeft size={16} /> Back to Portal
        </button>
      </nav>

      {/* Content */}
      <div style={{ paddingTop: 112, paddingBottom: 100, paddingLeft: '5%', paddingRight: '5%', maxWidth: 1100, margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
            borderRadius: '999px', padding: '8px 22px', marginBottom: 28,
            fontSize: '0.82rem', color: '#BFDBFE', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            End-to-End Testing Guide
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
            fontSize: 'clamp(2.4rem, 4vw, 3.8rem)', fontWeight: 800,
            lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20,
            background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            How to Test the Platform
          </h1>
          <p style={{
            fontSize: '1.15rem', color: '#94A3B8', maxWidth: 600, margin: '0 auto',
            lineHeight: 1.7, fontWeight: 400,
          }}>
            Follow the steps below to explore every feature of the Eastbrook prototype — no setup, no passwords, just click a portal card and go.
          </p>
        </div>

        {/* Portal Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {STEPS.map((portal) => (
            <div key={portal.role} style={{
              background: 'rgba(15,23,42,0.65)',
              border: `1px solid ${portal.borderLight}`,
              borderRadius: '24px',
              overflow: 'hidden',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.45)',
            }}>
              {/* Portal header band */}
              <div style={{
                background: portal.bgLight,
                borderBottom: `1px solid ${portal.borderLight}`,
                padding: '28px 36px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  background: `${portal.color}22`,
                  border: `1px solid ${portal.borderLight}`,
                  color: portal.color,
                  padding: 14, borderRadius: 16,
                  display: 'flex', alignItems: 'center',
                }}>
                  {portal.icon}
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: '1.55rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>
                    {portal.portal}
                  </h2>
                  <p style={{ color: '#94A3B8', fontSize: '0.95rem', margin: 0 }}>{portal.intro}</p>
                </div>
              </div>

              {/* Steps */}
              <div style={{ padding: '32px 36px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
                {portal.steps.map((step, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '16px', padding: '22px 20px',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        background: portal.bgLight, color: portal.color,
                        border: `1px solid ${portal.borderLight}`,
                        borderRadius: '10px', padding: '7px',
                        display: 'flex', alignItems: 'center',
                        minWidth: 36, minHeight: 36, justifyContent: 'center',
                      }}>
                        {step.icon}
                      </div>
                      <div style={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Step {idx + 1}
                      </div>
                    </div>
                    <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.98rem' }}>{step.title}</div>
                    <div style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.65 }}>{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: 72 }}>
          <p style={{ color: '#64748B', marginBottom: 24, fontSize: '0.95rem' }}>
            Ready to start? Head back to the portal and pick your role.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#3B82F6',
              border: 'none', borderRadius: '99px',
              padding: '14px 36px', color: '#fff',
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,130,246,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.35)')}
          >
            Go to Portal <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </div>
  )
}
