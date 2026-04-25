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
  signInAsRole: (role: 'student' | 'educator' | 'analyst') => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)
const STORAGE_KEY = 'eastbrook_prototype_role'

function isPrototypeRole(value: string | null): value is Profile['role'] {
  return value === 'student' || value === 'educator' || value === 'analyst'
}

async function fetchPrototypeProfile(role: Profile['role']) {
  const response = await fetch('/api/auth/me', {
    headers: {
      'X-Prototype-Role': role,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to restore prototype profile.')
  }

  const payload = await response.json() as { user: Profile }
  return payload.user
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string, email: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function restorePrototypeAccess() {
      const savedRole = localStorage.getItem(STORAGE_KEY)
      if (!isPrototypeRole(savedRole)) {
        if (active) setLoading(false)
        return
      }

      try {
        const restoredProfile = await fetchPrototypeProfile(savedRole)
        if (!active) return
        setProfile(restoredProfile)
        setUser({ id: restoredProfile.id, email: restoredProfile.email })
        setToken(`prototype-${savedRole}`)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
        if (!active) return
        setProfile(null)
        setUser(null)
        setToken(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    void restorePrototypeAccess()

    return () => {
      active = false
    }
  }, [])

  async function signInAsRole(role: 'student' | 'educator' | 'analyst') {
    setLoading(true)
    try {
      const prototypeProfile = await fetchPrototypeProfile(role)
      localStorage.setItem(STORAGE_KEY, role)
      setProfile(prototypeProfile)
      setUser({ id: prototypeProfile.id, email: prototypeProfile.email })
      setToken(`prototype-${role}`)
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, profile, loading, signInAsRole, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
