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

## Security (production)

Set on **Render** (never commit real values):

| Variable | Requirement |
|----------|-------------|
| `JWT_SECRET` | `openssl rand -base64 48` — min 32 chars, unique |
| `SEED_ADMIN_PASSWORD` | Min 12 chars — **not** `Admin123!` |
| `NODE_ENV` | `production` |

- Admin role is verified from **MongoDB**, not JWT alone.
- Login/register are **rate limited** (12 attempts / 15 min per IP).
- Passwords: min **8** characters; admin seed min **12**.
