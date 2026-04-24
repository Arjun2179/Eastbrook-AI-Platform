import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BarChart3, Bell, BookOpen, Shield } from 'lucide-react'
import { apiFetch } from '../lib/api'

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
  demoUsers: {
    student: { email: string; full_name: string } | null
    educator: { email: string; full_name: string } | null
    analyst: { email: string; full_name: string } | null
  }
}

const FEATURES = [
  {
    icon: <BookOpen size={24} />,
    title: 'Student Portal',
    description: 'Students log real AI sessions, complete training modules, review nudges, and track healthier habits over time.',
    accent: 'var(--student)',
    bg: 'var(--student-light)',
  },
  {
    icon: <Bell size={24} />,
    title: 'Educator Console',
    description: 'Educators monitor cohort risk, review alerts, send nudges, and drill into each student using live operational data.',
    accent: 'var(--educator)',
    bg: 'var(--educator-light)',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Analyst Dashboard',
    description: 'Analysts explore the full Eastbrook dataset with research-question views, AS-IS vs TO-BE comparison, and KPI tracking.',
    accent: 'var(--analyst)',
    bg: 'var(--analyst-light)',
  },
]

export default function Landing() {
  const [data, setData] = useState<PublicOverviewResponse | null>(null)
  const [error, setError] = useState('')

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

  const heroStats = data?.overview.heroStats
  const statTiles = [
    {
      value: heroStats ? heroStats.totalDailyPrompts.toLocaleString() : '...',
      label: 'Average Daily AI Prompts',
      color: 'var(--student)',
    },
    {
      value: heroStats ? `${heroStats.avgScreenTime} hrs` : '...',
      label: 'Average Screen Time',
      color: 'var(--warning)',
    },
    {
      value: heroStats ? `${heroStats.avgVerificationRate}%` : '...',
      label: 'Verification Rate',
      color: 'var(--success)',
    },
    {
      value: heroStats ? `${heroStats.avgEyeDryness}/10` : '...',
      label: 'Average Eye Dryness',
      color: 'var(--danger)',
    },
  ]

  return (
    <div>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(15,23,42,.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          padding: '0 32px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={20} color="#60A5FA" />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
            Eastbrook <span style={{ color: '#93C5FD' }}>AI Well-Being</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/login" className="btn btn-ghost" style={{ color: 'rgba(255,255,255,.8)' }}>
            Log In
          </Link>
          <Link to="/signup" className="btn btn-primary btn-sm">
            Create Account
          </Link>
        </div>
      </nav>

      <section className="landing-hero" style={{ paddingTop: 140 }}>
        <div className="landing-hero-content">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(96,165,250,.12)',
              border: '1px solid rgba(96,165,250,.2)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              marginBottom: 24,
              fontSize: '0.78rem',
              color: '#BFDBFE',
              fontWeight: 600,
            }}
          >
            <Shield size={14} /> Unified Research + Intervention Platform
          </div>
          <h1>
            One Eastbrook Website for
            <br />
            <span>Student AI Safety and Analytics</span>
          </h1>
          <p>
            The platform now combines the coursework dashboard, the prototype workflow, and the live app into one
            dynamic product backed by PostgreSQL. Students log sessions, educators intervene, and analysts measure
            whether habits improve across the full Eastbrook dataset.
          </p>
          <div className="landing-hero-btns">
            <Link to="/login" className="btn btn-primary btn-xl">
              Open Demo
            </Link>
            <Link to="/signup" className="btn btn-white-outline btn-xl">
              Create New Account
            </Link>
          </div>
          <div className="landing-trust">
            <div className="landing-trust-item">
              <div className="val">{data?.overview.studentCount ?? '...'}</div>
              <div className="lbl">Seeded Students</div>
            </div>
            <div className="landing-trust-item">
              <div className="val">{data?.overview.observationCount.toLocaleString() ?? '...'}</div>
              <div className="lbl">Student-Day Observations</div>
            </div>
            <div className="landing-trust-item">
              <div className="val">{data?.overview.phases.join(' + ') ?? '...'}</div>
              <div className="lbl">Dataset Phases</div>
            </div>
            <div className="landing-trust-item">
              <div className="val">3</div>
              <div className="lbl">Live Role Portals</div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-stats">
        <div className="landing-stats-inner">
          <div className="landing-section-header" style={{ marginBottom: 32 }}>
            <h2>Baseline Data at a Glance</h2>
            <p>The landing view now pulls directly from the imported Eastbrook dataset.</p>
          </div>
          {error ? (
            <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          ) : (
            <div className="landing-stats-grid">
              {statTiles.map((tile) => (
                <div className="stat-tile card" key={tile.label}>
                  <div className="stat-val" style={{ color: tile.color }}>
                    {tile.value}
                  </div>
                  <div className="stat-label">{tile.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="landing-section landing-gray">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2>How the Intervention Loop Works</h2>
            <p>Every part of the product now feeds the same live workflow.</p>
          </div>
          <div className="step-grid">
            <div className="card card-hover step-card">
              <div className="step-num">1</div>
              <h3>Students record real sessions</h3>
              <p>Session logs capture prompts, verification status, breaks, and symptom scores.</p>
            </div>
            <div className="card card-hover step-card">
              <div className="step-num">2</div>
              <h3>Risk is scored on the server</h3>
              <p>Alerts open automatically when behaviour crosses risk thresholds defined in the shared scoring service.</p>
            </div>
            <div className="card card-hover step-card">
              <div className="step-num">3</div>
              <h3>Educators nudge and analysts measure</h3>
              <p>Interventions are tracked end to end, and analyst views compare AS-IS and TO-BE outcomes dynamically.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2>Three Dynamic Portals</h2>
            <p>Each area reads from the same data source instead of a separate mock branch.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <div className="feature-card card-hover" key={feature.title}>
                <div className="feature-icon" style={{ background: feature.bg, color: feature.accent }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p style={{ fontSize: '0.88rem' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-dark">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2>Demo Access</h2>
            <p>Use the seeded accounts after running the database setup script.</p>
          </div>
          <div className="grid grid-3">
            <div className="card" style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.08)' }}>
              <h3 style={{ color: '#fff', marginBottom: 8 }}>Student</h3>
              <p style={{ color: 'rgba(255,255,255,.72)', margin: 0 }}>
                {data?.demoUsers.student?.email ?? 'Seeded during setup'}
              </p>
            </div>
            <div className="card" style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.08)' }}>
              <h3 style={{ color: '#fff', marginBottom: 8 }}>Educator</h3>
              <p style={{ color: 'rgba(255,255,255,.72)', margin: 0 }}>
                {data?.demoUsers.educator?.email ?? 'educator@eastbrook.edu'}
              </p>
            </div>
            <div className="card" style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.08)' }}>
              <h3 style={{ color: '#fff', marginBottom: 8 }}>Analyst</h3>
              <p style={{ color: 'rgba(255,255,255,.72)', margin: 0 }}>
                {data?.demoUsers.analyst?.email ?? 'analyst@eastbrook.edu'}
              </p>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, color: '#FDE68A', fontSize: '0.82rem' }}>
            <AlertTriangle size={16} /> The demo password is the one printed by `npm run db:init`.
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <h2>Ship the Final Eastbrook Experience</h2>
        <p>Sign in to review the unified app, or create an account to add a fresh user to the workflow.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn btn-primary btn-xl">
            Open the App
          </Link>
          <Link to="/signup" className="btn btn-white-outline btn-xl">
            Create an Account
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Eastbrook Youth AI Well-Being Platform · Unified app implementation</p>
      </footer>
    </div>
  )
}
