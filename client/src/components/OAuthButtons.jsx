import { useEffect, useState } from 'react'
import axios from 'axios'
import { apiUrl } from '../apiBase.js'

export default function OAuthButtons() {
  const [providers, setProviders] = useState({ google: false, facebook: false, instagram: false })

  useEffect(() => {
    axios.get('/api/oauth/providers').then((r) => setProviders(r.data)).catch(() => {})
  }, [])

  const any = providers.google || providers.facebook || providers.instagram

  return (
    <div className="oauth-wrap">
      <div className="oauth-divider">
        <span>{any ? 'Or continue with' : 'Social sign-in'}</span>
      </div>
      <div className="oauth-grid">
        {providers.google ? (
          <a className="oauth-btn oauth-google" href={apiUrl('/api/oauth/google')}>
            <span className="oauth-icon" aria-hidden>G</span> Google
          </a>
        ) : (
          <span className="oauth-btn oauth-btn--off" title="Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to server/.env">
            <span className="oauth-icon oauth-icon--muted" aria-hidden>G</span> Google
          </span>
        )}
        {providers.facebook ? (
          <a className="oauth-btn oauth-facebook" href={apiUrl('/api/oauth/facebook')}>
            <span className="oauth-icon" aria-hidden>f</span> Facebook
          </a>
        ) : (
          <span className="oauth-btn oauth-btn--off" title="Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to server/.env">
            <span className="oauth-icon oauth-icon--muted" aria-hidden>f</span> Facebook
          </span>
        )}
        {providers.instagram ? (
          <a className="oauth-btn oauth-instagram" href={apiUrl('/api/oauth/instagram')}>
            <span className="oauth-icon" aria-hidden>◎</span> Instagram
          </a>
        ) : (
          <span className="oauth-btn oauth-btn--off" title="Add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET (Meta app) to server/.env">
            <span className="oauth-icon oauth-icon--muted" aria-hidden>◎</span> Instagram
          </span>
        )}
      </div>
    </div>
  )
}
