/** Public site URL (Vercel). Used for post-OAuth redirect and CORS. */
export function clientUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
}

/** Request host as https://api.example.com (Render / reverse proxy). */
export function apiOrigin(req) {
  if (!req) return '';
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  const host = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
  return host ? `${proto}://${host}`.replace(/\/$/, '') : '';
}

/**
 * OAuth provider callback base URL.
 * Split deploy (Vercel + Render): must be the API host, not the frontend.
 */
export function oauthRedirectBase(req) {
  const fromEnv = (process.env.OAUTH_REDIRECT_BASE || '').replace(/\/$/, '');
  if (fromEnv && !fromEnv.includes('localhost')) return fromEnv;

  const fromRequest = apiOrigin(req);
  if (fromRequest && !fromRequest.includes('localhost')) return fromRequest;

  const fallback = (process.env.OAUTH_REDIRECT_BASE || process.env.CLIENT_URL || 'http://localhost:5173').replace(
    /\/$/,
    ''
  );
  return fallback;
}

export function corsOrigins() {
  const fromEnv = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return [...new Set([...fromEnv, 'http://localhost:5173'])];
}
