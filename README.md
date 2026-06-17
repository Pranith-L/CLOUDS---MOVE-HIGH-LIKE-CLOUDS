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
| `SEED_ADMIN_SYNC_PASSWORD` | Set to `true` **once** on Render if login says invalid password, then remove after redeploy |
| `NODE_ENV` | `production` |

## Admin login (production)

Local admin credentials **do not** apply to production unless that same user exists in your **production MongoDB** (Atlas).

On **Render** → Environment, set:

| Variable | Example |
|----------|---------|
| `SEED_ADMIN_EMAIL` | `admin@clouds.com` |
| `SEED_ADMIN_PASSWORD` | Strong password, **12+ chars** (not `Admin123!`) |

Redeploy Render after saving. On startup the API will **create** that admin (or **promote** an existing account with that email). Sign in on the live site with those two values.

**Already registered** `admin@clouds.com` on production? Use that account’s password — the server only promotes the role; it does not reset the password.

**Promote another email** (one-time, against production DB):

```bash
MONGODB_URI="your-atlas-uri" node make-admin.js you@example.com
```

Then log out and sign in again on Vercel so the Admin Panel link appears.

### "Invalid email or password" on production

Check **Render logs** after deploy. You want `✅ Created admin user` or `ℹ️ Admin user ready`.

Open `https://clouds-move-high-like-clouds.onrender.com/api/health` and look at the `admin` block:

| Field | Meaning |
|-------|---------|
| `exists: false` | Admin was never created — set `SEED_ADMIN_PASSWORD` on Render and redeploy |
| `hasPassword: false` | Account exists (often via Google) but has no password — redeploy with `SEED_ADMIN_SYNC_PASSWORD=true` once |
| `exists: true`, `hasPassword: true` | Wrong password typed, or password differs from `SEED_ADMIN_PASSWORD` — set `SEED_ADMIN_SYNC_PASSWORD=true`, redeploy once, sign in, then **remove** that variable |

**Fast fix from your PC** (uses your Atlas URI, same DB as Render):

```bash
MONGODB_URI="your-atlas-uri" SEED_ADMIN_EMAIL="admin@clouds.com" SEED_ADMIN_PASSWORD="your-12-char-password" node reset-admin-password.js
```

Use the **exact same** email and password when signing in on the live site.

- Admin role is verified from **MongoDB**, not JWT alone.
- Login/register are **rate limited** (12 attempts / 15 min per IP).
- Passwords: min **8** characters; admin seed min **12**.
