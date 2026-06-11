import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { applyToken } = useAuth()

  const [message, setMessage] = useState(() => {
    const err = searchParams.get('error')
    const token = searchParams.get('token')
    if (err) return decodeURIComponent(err)
    if (!token) return 'Missing token. Try signing in again.'
    return 'Signing you in…'
  })

  useEffect(() => {
    let cancelled = false
    let timer
    const err = searchParams.get('error')
    const token = searchParams.get('token')

    if (err) {
      timer = setTimeout(() => {
        if (!cancelled) navigate('/login', { replace: true })
      }, 3200)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }

    if (!token) {
      timer = setTimeout(() => {
        if (!cancelled) navigate('/login', { replace: true })
      }, 2800)
      return () => {
        cancelled = true
        clearTimeout(timer)
      }
    }

    applyToken(token)
      .then(() => {
        if (!cancelled) navigate('/', { replace: true })
      })
      .catch(() => {
        setTimeout(() => {
          if (!cancelled) setMessage('Could not complete sign-in.')
        }, 0)
        timer = setTimeout(() => {
          if (!cancelled) navigate('/login', { replace: true })
        }, 2800)
      })

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchParams, applyToken, navigate])

  return (
    <main className="auth-page">
      <div className="auth-card glass">
        <div className="auth-logo">
          <span className="auth-logo-icon">☁</span>
          <span className="auth-logo-text text-gradient">CLOUDS</span>
        </div>
        <p className="auth-sub" style={{ textAlign: 'center' }}>{message}</p>
      </div>
    </main>
  )
}
