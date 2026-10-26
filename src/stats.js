// Statistiques de visite, sans cookie.
//
// Rien n'est déposé ni lu sur l'appareil du visiteur, et aucune adresse IP n'est
// conservée : chaque page vue met seulement à jour des compteurs du jour (page,
// site d'origine, type d'appareil), enregistrés dans stats.json.
// Une « visite » est une arrivée sur le site : page ouverte sans venir d'une autre
// page du site (lien externe, moteur de recherche, adresse tapée, favori).
// Les robots, les préchargements, l'administrateur connecté et les appareils qu'il
// a choisi d'ignorer ne sont pas comptés.

import path from 'node:path';
import { readJson, writeJsonAtomic } from './store.js';

// Treize mois (annoncé dans la politique de confidentialité).
export const RETENTION_DAYS = 395;
const FLUSH_MS = 60 * 1000;
const OTHER = '(autres)';
// Nombre maximal de lignes par jour et par liste : au-delà, regroupées dans « autres ».
const CAPS = { paths: 300, entries: 200, sources: 60, referrers: 100, campaigns: 60, notFound: 100, contactFrom: 100 };

// Provenances reconnues : moteurs de recherche, assistants, réseaux sociaux.
// L'ordre compte : gemini.google.com et la messagerie Gmail avant Google.
export const SOURCES = [
  { key: 'gemini', label: 'Gemini', group: 'ia', hosts: /^gemini\.google\.com$/ },
  { key: 'email', label: 'Email', group: 'email', hosts: /^(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com|webmail\..+|com\.google\.android\.gm)$/ },
  { key: 'google', label: 'Google', group: 'recherche', hosts: /(^|\.)google\.[a-z.]+$|^com\.google\.android\.googlequicksearchbox$/ },
  { key: 'bing', label: 'Bing', group: 'recherche', hosts: /(^|\.)bing\.com$/ },
  { key: 'duckduckgo', label: 'DuckDuckGo', group: 'recherche', hosts: /(^|\.)duckduckgo\.com$/ },
  { key: 'qwant', label: 'Qwant', group: 'recherche', hosts: /(^|\.)qwant\.com$/ },
  { key: 'ecosia', label: 'Ecosia', group: 'recherche', hosts: /(^|\.)ecosia\.org$/ },
  { key: 'yahoo', label: 'Yahoo', group: 'recherche', hosts: /(^|\.)yahoo\.[a-z.]+$/ },
  { key: 'brave', label: 'Brave Search', group: 'recherche', hosts: /^search\.brave\.com$/ },
  { key: 'chatgpt', label: 'ChatGPT', group: 'ia', hosts: /(^|\.)chatgpt\.com$|^chat\.openai\.com$/ },
  { key: 'perplexity', label: 'Perplexity', group: 'ia', hosts: /(^|\.)perplexity\.ai$/ },
  { key: 'claude', label: 'Claude', group: 'ia', hosts: /(^|\.)claude\.ai$/ },
  { key: 'copilot', label: 'Copilot', group: 'ia', hosts: /^copilot\.microsoft\.com$/ },
  { key: 'lechat', label: 'Le Chat (Mistral)', group: 'ia', hosts: /^chat\.mistral\.ai$/ },
  { key: 'facebook', label: 'Facebook', group: 'social', hosts: /(^|\.)facebook\.com$|^fb\.me$|^com\.facebook\.(katana|orca)$/ },
  { key: 'instagram', label: 'Instagram', group: 'social', hosts: /(^|\.)instagram\.com$|^com\.instagram\.android$/ },
  { key: 'linkedin', label: 'LinkedIn', group: 'social', hosts: /(^|\.)linkedin\.com$|^lnkd\.in$|^com\.linkedin\.android$/ },
  { key: 'whatsapp', label: 'WhatsApp', group: 'social', hosts: /(^|\.)whatsapp\.com$|^wa\.me$|^com\.whatsapp(\.w4b)?$/ },
  { key: 'tiktok', label: 'TikTok', group: 'social', hosts: /(^|\.)tiktok\.com$/ },
  { key: 'x', label: 'X (Twitter)', group: 'social', hosts: /^(.+\.)?(x\.com|twitter\.com)$|^t\.co$/ },
  { key: 'youtube', label: 'YouTube', group: 'social', hosts: /(^|\.)youtube\.com$|^youtu\.be$/ },
  { key: 'pinterest', label: 'Pinterest', group: 'social', hosts: /(^|\.)pinterest\.[a-z.]+$/ },
];
const SPECIAL_SOURCES = {
  direct: { label: 'Accès direct', group: 'direct' },
  site: { label: 'Autres sites', group: 'site' },
  campagne: { label: 'Liens de campagne', group: 'campagne' },
};

export function sourceLabel(key) {
  return SOURCES.find((s) => s.key === key)?.label || SPECIAL_SOURCES[key]?.label || key;
}

// Robots, aperçus de liens, outils de test et de surveillance.
const BOT_RE =
  /bot\b|bot\/|crawl|spider|slurp|scrap|preview|fetch|facebookexternalhit|embedly|whatsapp|telegram|discord|slack|skype|vkshare|lighthouse|pagespeed|gtmetrix|headless|phantom|selenium|playwright|puppeteer|monitor|uptime|pingdom|statuscake|check|validator|semrush|ahrefs|mj12|dotbot|petal|yandex|baidu|bytespider|gptbot|chatgpt-user|oai-searchbot|claude|perplexity|ccbot|amazonbot|applebot|qwantify|seznam|curl|wget|python|java\/|okhttp|go-http|httpclient|axios|node|libwww/i;

export function isHumanBrowser(userAgent = '') {
  const ua = String(userAgent);
  return ua.length > 20 && ua.length < 500 && ua.startsWith('Mozilla/') && !BOT_RE.test(ua);
}

export function deviceOf(userAgent = '') {
  const ua = String(userAgent);
  if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) return 'tablette';
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile';
  return 'ordinateur';
}

export const DEVICE_LABELS = { ordinateur: 'Ordinateur', mobile: 'Mobile', tablette: 'Tablette' };

// Cookie posé par l'administrateur, sur son seul appareil, pour ne plus y être compté.
export const IGNORE_COOKIE = 'subnet_ignore';

// Quand on ouvre une page, un vrai navigateur envoie la langue de l'utilisateur et,
// depuis 2023 sur tous les navigateurs courants, « Sec-Fetch-Mode: navigate ».
// Beaucoup de robots qui se présentent comme Chrome n'envoient ni l'un ni l'autre.
export function hasBrowserHeaders(req) {
  const language = req.get('accept-language') || '';
  return /[a-z]{2}/i.test(language) && req.get('sec-fetch-mode') === 'navigate';
}

function isPrefetch(req) {
  const purpose = `${req.get('sec-purpose') || ''} ${req.get('purpose') || ''} ${req.get('x-purpose') || ''} ${req.get('x-moz') || ''}`;
  return /prefetch|preview|prerender/i.test(purpose);
}

// Chemin propre et borné ; null pour ce qui n'est pas une page.
export function pagePath(rawPath = '/') {
  let p = String(rawPath || '/');
  // Une barre inversée ou un espace ferait d'un lien « /\autre-site » une adresse externe.
  if (p.length > 160 || /[\s\\]/.test(p)) return null;
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  if (/^\/(admin|api|assets|uploads)(\/|$)/.test(p)) return null;
  if (/\.[a-z0-9]{1,5}$/i.test(p) && !/\.html?$/i.test(p)) return null;
  return p || '/';
}

// Hôte d'une adresse (sans « www. »), ou '' si illisible.
function hostOf(value) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

// Le lien précédent vient-il du site lui-même (même hôte et même port) ?
function sameSite(referrer, ownHost) {
  try {
    const strip = (h) => String(h).toLowerCase().replace(/^www\./, '');
    return strip(new URL(referrer).host) === strip(ownHost);
  } catch {
    return false;
  }
}

// Provenance d'une visite : paramètre utm_source, sinon site d'origine.
export function classifySource({ referrer = '', utm = '', ownHost = '' } = {}) {
  const tag = String(utm || '').toLowerCase().trim();
  if (tag) {
    const known = SOURCES.find((s) => s.key === tag || s.label.toLowerCase() === tag);
    if (known) return { source: known.key };
    if (/^(e-?mail|newsletter|mailing)$/.test(tag)) return { source: 'email' };
    const campaign = tag.replace(/[^a-z0-9._-]+/g, '-').slice(0, 40);
    if (campaign) return { source: 'campagne', campaign };
  }
  const host = hostOf(referrer);
  if (!host || host === String(ownHost).replace(/:\d+$/, '').replace(/^www\./, '').toLowerCase()) return { source: 'direct' };
  const known = SOURCES.find((s) => s.hosts.test(host));
  if (known) return { source: known.key, host };
  return { source: 'site', host };
}

// Jour civil à Paris, au format AAAA-MM-JJ.
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
export function dayKey(date = new Date()) {
  return dayFormat.format(date);
}

export function addDays(key, delta) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function emptyDay() {
  return { views: 0, visits: 0, contacts: 0, paths: {}, entries: {}, sources: {}, referrers: {}, campaigns: {}, devices: {}, notFound: {}, contactFrom: {} };
}

// Object.hasOwn : un nom reçu comme « constructor » ne doit pas lire Object.prototype.
function bump(map, key, cap) {
  if (!key) return;
  if (!Object.hasOwn(map, key) && cap && Object.keys(map).length >= cap) key = OTHER;
  map[key] = (Object.hasOwn(map, key) ? map[key] : 0) + 1;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Jour relu depuis le fichier : seuls des compteurs entiers sont gardés.
function cleanDay(raw) {
  const day = emptyDay();
  if (!isPlainObject(raw)) return day;
  for (const k of ['views', 'visits', 'contacts']) day[k] = Number.isInteger(raw[k]) && raw[k] > 0 ? raw[k] : 0;
  for (const k of Object.keys(CAPS).concat('devices')) {
    if (!isPlainObject(raw[k])) continue;
    for (const [key, n] of Object.entries(raw[k])) if (Number.isInteger(n) && n > 0) day[k][key] = n;
  }
  return day;
}

export class VisitStats {
  constructor(dataDir, { log = console, flushMs = FLUSH_MS, now = () => new Date() } = {}) {
    this.file = path.join(dataDir, 'stats.json');
    this.log = log;
    this.flushMs = flushMs;
    this.now = now;
    this.days = {};
    this.startedAt = null;
    this.dirty = false;
    this.writing = Promise.resolve();
    this.timer = null;
  }

  async init() {
    const saved = await readJson(this.file, null).catch((err) => {
      this.log.warn(`Statistiques illisibles, nouveau départ : ${err.message}`);
      return null;
    });
    if (isPlainObject(saved) && isPlainObject(saved.days)) {
      for (const [key, day] of Object.entries(saved.days)) if (/^\d{4}-\d{2}-\d{2}$/.test(key)) this.days[key] = cleanDay(day);
      if (typeof saved.startedAt === 'string' && !Number.isNaN(Date.parse(saved.startedAt))) this.startedAt = saved.startedAt;
    }
    this.prune();
    // Date de départ illisible : on repart du plus ancien jour enregistré.
    const oldest = Object.keys(this.days).sort()[0];
    if (!this.startedAt && oldest) this.startedAt = `${oldest}T12:00:00.000Z`;
    this.timer = setInterval(() => this.flush().catch((err) => this.log.error('Statistiques non enregistrées :', err.message)), this.flushMs);
    this.timer.unref();
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  #day() {
    const key = dayKey(this.now());
    if (!this.days[key]) {
      this.days[key] = emptyDay();
      this.prune();
    }
    if (!this.startedAt) this.startedAt = this.now().toISOString();
    this.dirty = true;
    return this.days[key];
  }

  prune() {
    const oldest = addDays(dayKey(this.now()), -(RETENTION_DAYS - 1));
    for (const key of Object.keys(this.days)) if (key < oldest) delete this.days[key];
  }

  // Une page vue. entry : arrivée sur le site (visite), avec sa provenance.
  recordView({ path: page, entry = false, source = 'direct', host = '', campaign = '', device = 'ordinateur' }) {
    const day = this.#day();
    day.views += 1;
    bump(day.paths, page, CAPS.paths);
    if (!entry) return;
    day.visits += 1;
    bump(day.entries, page, CAPS.entries);
    bump(day.sources, source, CAPS.sources);
    if (host) bump(day.referrers, host, CAPS.referrers);
    if (campaign) bump(day.campaigns, campaign, CAPS.campaigns);
    bump(day.devices, device);
  }

  recordNotFound(page) {
    bump(this.#day().notFound, page, CAPS.notFound);
  }

  // Une demande envoyée, avec la page consultée juste avant.
  recordContact(from) {
    const day = this.#day();
    day.contacts += 1;
    bump(day.contactFrom, from || '/contact', CAPS.contactFrom);
  }

  async flush() {
    if (!this.dirty) return this.writing;
    this.dirty = false;
    const data = { version: 1, startedAt: this.startedAt, days: this.days };
    const run = this.writing.then(() => writeJsonAtomic(this.file, data));
    this.writing = run.catch(() => {
      this.dirty = true;
    });
    return run;
  }

  // Middleware : compte les pages servies aux vrais visiteurs, une fois la réponse partie.
  middleware({ isAdmin = () => false } = {}) {
    return (req, res, next) => {
      if (req.method !== 'GET') return next();
      const page = pagePath(req.path);
      if (!page) return next();
      const userAgent = req.get('user-agent') || '';
      if (!isHumanBrowser(userAgent) || !hasBrowserHeaders(req) || isPrefetch(req)) return next();
      res.on('finish', () => {
        try {
          if (isAdmin(req)) return;
          const status = res.statusCode;
          if (status === 404) {
            if (String(res.getHeader('content-type') || '').includes('text/html')) this.recordNotFound(page);
            return;
          }
          const html = String(res.getHeader('content-type') || '').includes('text/html');
          if (!(status === 304 || (status === 200 && html))) return;
          const referrer = req.get('referer') || '';
          const ownHost = req.get('host') || '';
          const fromOwnSite = Boolean(referrer) && sameSite(referrer, ownHost);
          const utm = typeof req.query?.utm_source === 'string' ? req.query.utm_source : '';
          if (fromOwnSite && !utm) return this.recordView({ path: page });
          const { source, host = '', campaign = '' } = classifySource({ referrer, utm, ownHost });
          this.recordView({ path: page, entry: true, source, host, campaign, device: deviceOf(userAgent) });
        } catch (err) {
          this.log.error('Statistiques :', err.message);
        }
      });
      next();
    };
  }

  // Totaux et classements sur une période [from, to] (jours inclus).
  summarize(from, to) {
    const total = emptyDay();
    for (const [key, day] of Object.entries(this.days)) {
      if (key < from || key > to) continue;
      for (const k of ['views', 'visits', 'contacts']) total[k] += day[k];
      for (const k of Object.keys(CAPS).concat('devices')) {
        for (const [name, n] of Object.entries(day[k])) total[k][name] = (Object.hasOwn(total[k], name) ? total[k][name] : 0) + n;
      }
    }
    return total;
  }

  // Série par jour, semaine ou mois selon la longueur de la période.
  series(from, to, unit = 'day') {
    const buckets = [];
    let key = from;
    while (key <= to) {
      const start = key;
      let end = key;
      if (unit === 'week') end = addDays(key, 6) < to ? addDays(key, 6) : to;
      if (unit === 'month') {
        const d = new Date(`${key}T12:00:00Z`);
        const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12)).toISOString().slice(0, 10);
        end = last < to ? last : to;
      }
      const sum = this.summarize(start, end);
      buckets.push({ start, end, views: sum.views, visits: sum.visits, contacts: sum.contacts });
      key = addDays(end, 1);
    }
    return buckets;
  }
}

// Lignes triées d'un classement, avec la part de chaque ligne.
export function ranking(map = {}, limit = 10) {
  const rows = Object.entries(map).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  const sum = rows.reduce((n, r) => n + r.count, 0);
  const top = rows.slice(0, limit);
  const rest = rows.slice(limit).reduce((n, r) => n + r.count, 0);
  const max = top[0]?.count || 0;
  return { rows: top.map((r) => ({ ...r, share: sum ? r.count / sum : 0, width: max ? r.count / max : 0 })), rest, sum };
}
