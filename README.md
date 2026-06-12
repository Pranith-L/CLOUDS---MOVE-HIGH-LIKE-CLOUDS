# CLOUDS — Move High Like Clouds

Custom tee store (React + Express + MongoDB).

**Live:** [clouds-move-high-like-clouds.vercel.app](https://clouds-move-high-like-clouds.vercel.app/)

## Production OAuth (Vercel + Render)

Frontend on Vercel, API on Render. Set these on **Render** → Environment:

| Variable | Value |
|----------|--------|
| `CLIENT_URL` | `https://clouds-move-high-like-clouds.vercel.app` |
| `OAUTH_REDIRECT_BASE` | `https://clouds-move-high-like-clouds.onrender.com` (optional after latest deploy) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `NODE_ENV` | `production` |

Set on **Vercel** → Environment (build time):

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://clouds-move-high-like-clouds.onrender.com` |

**Google Cloud Console** → OAuth client → Authorized redirect URIs:

```
https://clouds-move-high-like-clouds.onrender.com/api/oauth/google/callback
```

After changing env vars, **redeploy** Render and Vercel.
