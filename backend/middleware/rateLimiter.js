const buckets = new Map();

// Simple token bucket per key (ip or email)
export const rateLimiter = ({ windowMs = 5 * 60 * 1000, max = 10, key = (req) => req.ip }) => {
  return (req, res, next) => {
    const k = key(req);
    const now = Date.now();
    const entry = buckets.get(k) || { count: 0, expires: now + windowMs };
    if (now > entry.expires) {
      entry.count = 0;
      entry.expires = now + windowMs;
    }
    entry.count += 1;
    buckets.set(k, entry);
    if (entry.count > max) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }
    next();
  };
};

export default rateLimiter;