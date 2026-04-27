import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const [error, setError] = useState('')
  const { signInAsRole } = useAuth()
  const navigate = useNavigate()

  async function handleDemoLogin(role: 'student' | 'educator' | 'analyst') {
    try {
      setError('')
      await signInAsRole(role)
      navigate('/app')
    } catch {
      setError('Login failed')
    }
  }

  return (
    <div>
      <p onClick={() => handleDemoLogin('student')}>Student Login Demo</p>
      {error && <p>{error}</p>}
    </div>
  )
}
