// Authentification de l'espace d'administration : mot de passe haché
// (scrypt) et session dans un cookie signé (HMAC), sans dépendance.

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const SESSION_COOKIE = 'subnet_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(String(password), salt, SCRYPT_KEYLEN, SCRYPT_OPTS, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt);
  return `scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyHash(password, stored) {
  const [alg, salt, expected] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !salt || !expected) return false;
  const key = await scrypt(password, Buffer.from(salt, 'base64url'));
  const exp = Buffer.from(expected, 'base64url');
  return exp.length === key.length && crypto.timingSafeEqual(exp, key);
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

export function generatePassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(16);
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
  return chars.match(/.{4}/g).join('-');
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export class Auth {
  constructor({ dataDir, adminPassword = '', sessionSecret = '', log = console }) {
    this.dataDir = dataDir;
    this.file = path.join(dataDir, 'auth.json');
    this.adminPassword = adminPassword;
    this.sessionSecret = sessionSecret;
    this.log = log;
    this.record = null;
  }

  async init() {
    await fs.mkdir(this.dataDir, { recursive: true });
    this.secret = this.sessionSecret || (await this.#loadOrCreateSecret());
    this.record = await readJson(this.file);

    if (this.usesEnvPassword) return;
    if (!this.record?.hash) {
      const password = generatePassword();
      await this.#save({ hash: await hashPassword(password), version: 1, temporary: true });
      this.log.warn(
        [
          '',
          '┌──────────────────────────────────────────────────────────┐',
          '│  Espace d’administration : mot de passe temporaire       │',
          `│  ${password.padEnd(56)}│`,
          '│  Changez-le depuis /admin (Compte) ou définissez         │',
          '│  ADMIN_PASSWORD dans le fichier .env.                     │',
          '└──────────────────────────────────────────────────────────┘',
          '',
        ].join('\n'),
      );
    } else if (this.record.temporary) {
      this.log.warn('Admin : le mot de passe temporaire est toujours actif. Lancez « npm run set-password » pour le remplacer.');
    }
  }

  get usesEnvPassword() {
    return Boolean(this.adminPassword);
  }

  get isTemporary() {
    return !this.usesEnvPassword && Boolean(this.record?.temporary);
  }

  get version() {
    if (this.usesEnvPassword) return `env-${sha256(this.adminPassword).toString('hex').slice(0, 12)}`;
    return String(this.record?.version ?? 1);
  }

  async #loadOrCreateSecret() {
    const file = path.join(this.dataDir, 'secret.key');
    try {
      const existing = (await fs.readFile(file, 'utf8')).trim();
      if (existing.length >= 32) return existing;
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    const secret = crypto.randomBytes(32).toString('hex');
    await fs.writeFile(file, secret + '\n', { mode: 0o600 });
    return secret;
  }

  async #save(record) {
    this.record = { ...record, updatedAt: new Date().toISOString() };
    const tmp = `${this.file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(this.record, null, 2), { mode: 0o600 });
    await fs.rename(tmp, this.file);
  }

  async verifyPassword(password) {
    if (typeof password !== 'string' || !password || password.length > 256) return false;
    if (this.usesEnvPassword) return crypto.timingSafeEqual(sha256(password), sha256(this.adminPassword));
    return verifyHash(password, this.record?.hash);
  }

  async setPassword(password) {
    if (this.usesEnvPassword) throw new Error('Le mot de passe est défini par la variable ADMIN_PASSWORD.');
    const version = Number(this.record?.version || 1) + 1;
    await this.#save({ hash: await hashPassword(password), version, temporary: false });
  }

  #sign(data) {
    return crypto.createHmac('sha256', this.secret).update(data).digest('base64url');
  }

  createToken(now = Date.now()) {
    const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_TTL_MS, v: this.version })).toString('base64url');
    return `${payload}.${this.#sign(payload)}`;
  }

  verifyToken(token, now = Date.now()) {
    if (typeof token !== 'string') return false;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;
    const expected = Buffer.from(this.#sign(payload));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      return data.exp > now && data.v === this.version;
    } catch {
      return false;
    }
  }

  // Jeton signé pour les formulaires publics (anti-robots) : horodatage.
  createFormToken(now = Date.now()) {
    const ts = String(now);
    return `${ts}.${this.#sign(`form:${ts}`)}`;
  }

  checkFormToken(token, minDelayMs, now = Date.now()) {
    if (typeof token !== 'string') return false;
    const [ts, signature] = token.split('.');
    if (!ts || !signature) return false;
    const expected = Buffer.from(this.#sign(`form:${ts}`));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
    const age = now - Number(ts);
    return age >= minDelayMs && age < 24 * 60 * 60 * 1000;
  }
}
