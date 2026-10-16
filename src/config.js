import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function parseTrustProxy(value) {
  if (value === undefined || value === '') return 'loopback, linklocal, uniquelocal';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'oui'].includes(String(value).toLowerCase());
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  return {
    root: ROOT,
    env: nodeEnv,
    isProd: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    port: Number(env.PORT) || 3000,
    host: env.HOST || '0.0.0.0',
    dataDir: path.resolve(ROOT, env.DATA_DIR || 'data'),
    baseUrl: (env.BASE_URL || '').replace(/\/+$/, ''),
    adminPassword: env.ADMIN_PASSWORD || '',
    sessionSecret: env.SESSION_SECRET || '',
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    blogApiKey: env.BLOG_API_KEY || '',
    contactMinDelayMs: env.CONTACT_MIN_DELAY_MS !== undefined ? Number(env.CONTACT_MIN_DELAY_MS) : 3000,
    smtp: {
      host: env.SMTP_HOST || '',
      port: Number(env.SMTP_PORT) || 587,
      secure: parseBool(env.SMTP_SECURE, Number(env.SMTP_PORT) === 465),
      user: env.SMTP_USER || '',
      pass: env.SMTP_PASS || '',
      from: env.MAIL_FROM || '',
      to: env.MAIL_TO || '',
    },
  };
}
