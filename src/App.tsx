import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'

import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'

import StudentDashboard from './pages/student/StudentDashboard'
import SessionLogger from './pages/student/SessionLogger'
import BreakTimer from './pages/student/BreakTimer'
import Training from './pages/student/Training'
import MyProgress from './pages/student/MyProgress'

import EducatorDashboard from './pages/educator/EducatorDashboard'
import StudentRoster from './pages/educator/StudentRoster'
import NudgeHistory from './pages/educator/NudgeHistory'
import RiskTrends from './pages/educator/RiskTrends'

import AnalystDashboard from './pages/analyst/AnalystDashboard'
import PublicComparison from './pages/PublicComparison'
import GuidedTour from './pages/GuidedTour'

function RoleRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
  if (!profile) return <Navigate to="/login" replace />
  const map: Record<string, string> = {
    student: '/app/student',
    educator: '/app/educator',
    analyst: '/app/analyst',
  }
  return <Navigate to={map[profile.role] || '/app/student'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/compare" element={<PublicComparison />} />
      <Route path="/tour" element={<GuidedTour />} />

      {/* Role redirect */}
      <Route path="/app" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

      {/* Student Portal */}
      <Route path="/app/student" element={<ProtectedRoute allowedRoles={['student']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="log-session" element={<SessionLogger />} />
        <Route path="break-timer" element={<BreakTimer />} />
        <Route path="training" element={<Training />} />
        <Route path="progress" element={<MyProgress />} />
      </Route>

      {/* Educator Console */}
      <Route path="/app/educator" element={<ProtectedRoute allowedRoles={['educator']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<EducatorDashboard />} />
        <Route path="roster" element={<StudentRoster />} />
        <Route path="nudges" element={<NudgeHistory />} />
        <Route path="trends" element={<RiskTrends />} />
      </Route>

      {/* Analyst Dashboard */}
      <Route path="/app/analyst" element={<ProtectedRoute allowedRoles={['analyst']}><AppLayout /></ProtectedRoute>}>
        <Route index element={<AnalystDashboard />} />
        <Route path="rq1" element={<AnalystDashboard />} />
        <Route path="rq2" element={<AnalystDashboard />} />
        <Route path="rq3" element={<AnalystDashboard />} />
        <Route path="rq4" element={<AnalystDashboard />} />
        <Route path="rq5" element={<AnalystDashboard />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
