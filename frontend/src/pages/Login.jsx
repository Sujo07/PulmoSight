import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    if (result.success) {
      navigate('/upload')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#00d4ff" strokeWidth="1.5" />
            <path d="M8 14 Q11 8 14 14 Q17 20 20 14" stroke="#00ff9d" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="14" cy="14" r="2.5" fill="#00d4ff" />
          </svg>
          <h1 className="login-title">PulmoSight</h1>
          <p className="login-subtitle">Radiologist Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="dr.name@hospital.com" required autoFocus
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-disclaimer">
          ⚠ For authorized medical personnel only
        </p>
      </div>
    </div>
  )
}
