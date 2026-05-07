import { createContext, useContext, useState } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('ps_token'))
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('ps_user') || 'null'))
  const [loading, setLoading] = useState(false)

  async function login(email, password) {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token: t, user: u } = res.data
      setToken(t)
      setUser(u)
      localStorage.setItem('ps_token', t)
      localStorage.setItem('ps_user', JSON.stringify(u))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  async function signup(email, password, name) {
    setLoading(true)
    try {
      const res = await api.post('/auth/signup', { email, password, name })
      const { token: t, user: u } = res.data
      setToken(t)
      setUser(u)
      localStorage.setItem('ps_token', t)
      localStorage.setItem('ps_user', JSON.stringify(u))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' }
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('ps_token')
    localStorage.removeItem('ps_user')
  }

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

