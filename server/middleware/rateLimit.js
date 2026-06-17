const buckets = new Map();

/** Simple in-memory rate limiter (per IP + route). */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, message = 'Too many attempts. Try again later.' }) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    let entry = buckets.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ message });
    }
    next();
  };
}
