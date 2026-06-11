import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OAuthButtons from '../components/OAuthButtons'
import './Auth.css'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <main className="auth-page">
      <div className="auth-card glass">
        <div className="auth-logo">
          <span className="auth-logo-icon">☁</span>
          <span className="auth-logo-text text-gradient">CLOUDS</span>
        </div>
        <h1 className="auth-title">Join CLOUDS</h1>
        <p className="auth-sub">Create your account and start designing</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="reg-name">Full Name</label>
            <input id="reg-name" name="name" type="text" className="input"
              placeholder="Your Name" value={form.name} onChange={handle} required />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-email">Email</label>
            <input id="reg-email" name="email" type="email" className="input"
              placeholder="you@example.com" value={form.email} onChange={handle} required />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" name="password" type="password" className="input"
              placeholder="Min. 6 characters" value={form.password} onChange={handle} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" id="register-submit-btn" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : 'Create Account →'}
          </button>
        </form>

        <OAuthButtons />

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
