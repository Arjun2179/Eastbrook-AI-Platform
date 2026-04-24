import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'student' | 'educator' | 'analyst'
  grade?: string
  age_group?: string
  avatar_url?: string
  dataset_user_key?: number | null
  created_at?: string
}

interface AuthState {
  user: { id: string, email: string } | null
  token: string | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role: string, grade?: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string, email: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(authToken: string) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) {
        const { user: profileData } = await res.json()
        setProfile(profileData)
        setUser({ id: profileData.id, email: profileData.email })
        setToken(authToken)
      } else {
        localStorage.removeItem('eastbrook_token')
        setToken(null)
        setUser(null)
        setProfile(null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('eastbrook_token')
    if (savedToken) {
      fetchProfile(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  function inferAgeGroup(grade?: string) {
    if (!grade) return null
    const numericGrade = Number(grade)
    if (!Number.isFinite(numericGrade)) return null
    return numericGrade <= 9 ? '13-14' : '15-17'
  }

  async function signUp(email: string, password: string, fullName: string, role: string, grade?: string) {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          grade,
          age_group: role === 'student' ? inferAgeGroup(grade) : null
        })
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error || 'Signup failed' }
      
      localStorage.setItem('eastbrook_token', data.token)
      await fetchProfile(data.token)
      return { error: null }
    } catch (e) {
      return { error: 'Network error' }
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error || 'Login failed' }
      
      localStorage.setItem('eastbrook_token', data.token)
      await fetchProfile(data.token)
      return { error: null }
    } catch (e) {
      return { error: 'Network error' }
    }
  }

  async function signOut() {
    localStorage.removeItem('eastbrook_token')
    setToken(null)
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
