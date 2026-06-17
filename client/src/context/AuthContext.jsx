/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

// eslint-disable-next-line
const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('clouds_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.get('/api/auth/me')
        .then(r => setUser(r.data))
        .catch(() => { setToken(null); localStorage.removeItem('clouds_token') })
        .finally(() => setLoading(false))
    } else {
      // eslint-disable-next-line
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('clouds_token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return data
  }

  const register = async (name, email, password) => {
    const { data } = await axios.post('/api/auth/register', { name, email, password })
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('clouds_token', data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return data
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('clouds_token')
    delete axios.defaults.headers.common['Authorization']
  }

  const applyToken = useCallback(async (newToken) => {
    setToken(newToken)
    localStorage.setItem('clouds_token', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    const { data } = await axios.get('/api/auth/me')
    setUser(data)
    return data
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, applyToken }}>
      {children}
    </AuthContext.Provider>
  )
}
