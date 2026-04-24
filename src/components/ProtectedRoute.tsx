import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Loading...</p>
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    const redirectMap: Record<string, string> = {
      student: '/app/student',
      educator: '/app/educator',
      analyst: '/app/analyst',
    }
    return <Navigate to={redirectMap[profile.role] || '/app/student'} replace />
  }

  return <>{children}</>
}
