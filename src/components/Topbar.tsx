import { useAuth } from '../contexts/AuthContext'
import { Bell, LogOut } from 'lucide-react'

export default function Topbar({ title }: { title?: string }) {
  const { profile, signOut } = useAuth()
  const role = profile?.role || 'student'
  const accentColor = role === 'educator' ? 'var(--educator)' : role === 'analyst' ? 'var(--analyst)' : 'var(--student)'

  const greeting = role === 'student'
    ? `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Student'}`
    : role === 'educator'
    ? `Good morning, ${profile?.full_name || 'Educator'}`
    : 'Analytics Overview'

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title || greeting}</h1>
      </div>
      <div className="topbar-right">
        <button className="topbar-btn" title="Notifications">
          <Bell size={18} />
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 12px 6px 6px', borderRadius: 'var(--radius-full)',
          background: 'var(--brand-50)', border: '1px solid var(--card-border)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: accentColor,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.72rem', fontWeight: 700,
          }}>
            {profile?.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {profile?.full_name?.split(' ')[0]}
          </span>
          <span className="badge" style={{
            background: role === 'educator' ? 'var(--educator-light)' : role === 'analyst' ? 'var(--analyst-light)' : 'var(--student-light)',
            color: accentColor, fontSize: '0.65rem',
          }}>
            {role}
          </span>
        </div>
        <button className="topbar-btn" onClick={signOut} title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  )
}
