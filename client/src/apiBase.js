/** Backend origin for production (e.g. https://api.yourdomain.com). Empty = same origin as the site. */
export function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

export function apiUrl(path) {
  const base = getApiBase()
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${p}` : p
}
