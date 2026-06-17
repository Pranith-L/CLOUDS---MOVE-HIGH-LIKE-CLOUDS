import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OAuthButtons from '../components/OAuthButtons'
import './Auth.css'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || (err.message?.includes('Network') ? 'Cannot reach the API. Confirm VITE_API_URL points to your Render backend, then redeploy Vercel.' : err.message) || 'Login failed. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <main className="auth-page">
      <div className="auth-card glass">
        <div className="auth-logo">
          <span className="auth-logo-icon">☁</span>
          <span className="auth-logo-text text-gradient">CLOUDS</span>
        </div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-sub">Sign in to your CLOUDS account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" name="email" type="email" className="input"
              placeholder="you@example.com" value={form.email} onChange={handle} required />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" name="password" type="password" className="input"
              placeholder="••••••••" value={form.password} onChange={handle} required />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" id="login-submit-btn" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : 'Sign In →'}
          </button>
        </form>

        <OAuthButtons />

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </main>
  )
}
