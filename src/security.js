import crypto from 'node:crypto';

// Seul script en ligne autorisé : active les animations dès le premier rendu.
export const INLINE_JS = "document.documentElement.classList.add('js')";
const INLINE_JS_HASH = crypto.createHash('sha256').update(INLINE_JS).digest('base64');

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${INLINE_JS_HASH}'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export function securityHeaders(req, res, next) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  next();
}

// Vérifie qu'une requête de modification provient bien du site lui-même.
export function isSameOrigin(req) {
  const source = req.get('origin') || req.get('referer');
  if (!source) return false;
  try {
    return new URL(source).host === req.host;
  } catch {
    return false;
  }
}

export function createRateLimiter({ windowMs, max }) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (now - entry.start > windowMs) hits.delete(key);
  }, windowMs);
  timer.unref();
  return {
    hit(key) {
      const now = Date.now();
      let entry = hits.get(key);
      if (!entry || now - entry.start > windowMs) {
        entry = { start: now, count: 0 };
        hits.set(key, entry);
      }
      entry.count += 1;
      return entry.count <= max;
    },
    reset(key) {
      hits.delete(key);
    },
  };
}
