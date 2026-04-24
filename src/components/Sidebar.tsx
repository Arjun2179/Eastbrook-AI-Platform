import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Shield, LayoutDashboard, ClipboardList, Timer, BookOpen, Trophy,
  Users, BarChart3, Bell, TrendingUp, BrainCircuit, Heart, MessageSquare, Eye,
  Menu, X
} from 'lucide-react'
import { useState } from 'react'

const STUDENT_LINKS = [
  { to: '/app/student', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/app/student/log-session', icon: <ClipboardList size={18} />, label: 'Log Session' },
  { to: '/app/student/break-timer', icon: <Timer size={18} />, label: 'Break Timer' },
  { to: '/app/student/training', icon: <BookOpen size={18} />, label: 'AI Training' },
  { to: '/app/student/progress', icon: <Trophy size={18} />, label: 'My Progress' },
]

const EDUCATOR_LINKS = [
  { to: '/app/educator', icon: <LayoutDashboard size={18} />, label: 'Overview', end: true },
  { to: '/app/educator/roster', icon: <Users size={18} />, label: 'Student Roster' },
  { to: '/app/educator/nudges', icon: <Bell size={18} />, label: 'Nudge History' },
  { to: '/app/educator/trends', icon: <TrendingUp size={18} />, label: 'Risk Trends' },
]

const ANALYST_LINKS = [
  { to: '/app/analyst', icon: <LayoutDashboard size={18} />, label: 'Overview', end: true },
  { to: '/app/analyst/rq1', icon: <BrainCircuit size={18} />, label: 'RQ1: AI Usage' },
  { to: '/app/analyst/rq2', icon: <Eye size={18} />, label: 'RQ2: Verification' },
  { to: '/app/analyst/rq3', icon: <Heart size={18} />, label: 'RQ3: Physical' },
  { to: '/app/analyst/rq4', icon: <BarChart3 size={18} />, label: 'RQ4: Cognitive' },
  { to: '/app/analyst/rq5', icon: <MessageSquare size={18} />, label: 'RQ5: Social' },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const role = profile?.role || 'student'

  const links = role === 'educator' ? EDUCATOR_LINKS : role === 'analyst' ? ANALYST_LINKS : STUDENT_LINKS
  const accentColor = role === 'educator' ? 'var(--educator)' : role === 'analyst' ? 'var(--analyst)' : 'var(--student)'

  const initials = profile?.full_name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="topbar-btn"
        onClick={() => setMobileOpen(true)}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 101,
          display: 'none',
        }}
        id="mobile-menu-btn"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 99 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Shield size={22} color="#3B82F6" />
          <h2>Eastbrook <span>AI</span></h2>
          {mobileOpen && (
            <button onClick={() => setMobileOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              {role === 'student' ? 'Student Portal' : role === 'educator' ? 'Educator Console' : 'Analytics'}
            </div>
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                data-role={role}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => isActive ? { borderLeftColor: accentColor } : {}}
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar" style={{ background: accentColor }}>
            {initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{profile?.full_name}</div>
            <div className="sidebar-user-role">{role}</div>
          </div>
          <button
            onClick={signOut}
            className="btn-icon"
            style={{ background: 'none', border: 'none', color: 'var(--brand-500)', cursor: 'pointer', padding: 4 }}
            title="Sign out"
          >
            <X size={16} />
          </button>
        </div>
      </aside>

      <style>{`
        @media(max-width:768px){
          #mobile-menu-btn{display:flex!important}
        }
      `}</style>
    </>
  )
}
