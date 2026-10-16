import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { SESSION_COOKIE, SESSION_TTL_MS } from '../auth.js';
import { ICON_OPTIONS, PAGES, REQUEST_STATUSES, REQUEST_TYPES, getPage } from '../schema.js';
import { applyPageInput, cleanText, getAt, isPlainObject } from '../sanitize.js';
import { formatDate, sectorLabel } from '../helpers.js';
import { createRateLimiter, isSameOrigin } from '../security.js';

const MIN_PASSWORD_LENGTH = 10;

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0 && part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return '';
      }
    }
  }
  return '';
}

export function detectImage(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (['GIF87a', 'GIF89a'].includes(buf.toString('latin1', 0, 6))) return 'gif';
  if (buf.toString('latin1', 4, 12) === 'ftypavif') return 'avif';
  return null;
}

// Les demandes enregistrées avant l'ajout des types et statuts reçoivent des valeurs par défaut.
export function normalizeRequest(message) {
  return { type: 'devis', status: 'nouvelle', note: '', source: 'contact', modules: [], phone: '', company: '', sector: '', ...message };
}

const labelOf = (options, value) => options.find((o) => o.value === value)?.label || value;

// Cellule CSV : guillemets échappés et formules neutralisées (=, +, -, @).
function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

// Valeurs vides utilisées pour les nouveaux éléments d'une liste.
export function blankItem(fields) {
  const item = {};
  for (const f of fields) {
    if (f.type === 'toggle') item[f.key] = f.default ?? false;
    else if (f.type === 'select') item[f.key] = f.default ?? f.options[0].value;
    else if (f.type === 'list' || f.type === 'repeater') item[f.key] = [];
    else if (f.type === 'group') item[f.key] = blankItem(f.fields);
    else item[f.key] = '';
  }
  return item;
}

function setupChecklist(content, { auth, config }) {
  const id = content.legal.identity;
  return [
    { done: !auth.isTemporary, label: 'Choisir un mot de passe personnel', href: '/admin/compte' },
    { done: Boolean(content.contact.email), label: 'Renseigner votre email de contact', href: '/admin/pages/contact' },
    {
      done: ['company', 'legalForm', 'siret', 'address', 'director', 'hostName', 'hostAddress'].every((k) => id[k]),
      label: 'Compléter les informations légales',
      href: '/admin/pages/legal',
    },
    { done: Boolean(content.site.url || config.baseUrl), label: 'Indiquer l’adresse de votre site', href: '/admin/pages/general' },
    { done: Boolean(content.contact.phone), label: 'Ajouter un numéro de téléphone', href: '/admin/pages/contact' },
    {
      done: !content.projects.some((p) => String(p.id).startsWith('concept-')),
      label: 'Remplacer les exemples par vos réalisations',
      href: '/admin/pages/projects',
    },
  ];
}

export function adminRouter({ config, store, auth, mailer, log }) {
  const router = express.Router();
  const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

  router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const content = store.getContent();
    Object.assign(res.locals, {
      content,
      site: content.site,
      pages: PAGES,
      unread: store.unreadCount(),
      getAt,
      blankItem,
      iconOptions: ICON_OPTIONS,
      active: '',
    });
    next();
  });

  // Toute modification doit provenir du site lui-même (protection CSRF).
  router.use((req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || isSameOrigin(req)) return next();
    res.status(403);
    if (req.path.startsWith('/api/')) return res.json({ ok: false, errors: ['Requête refusée.'] });
    res.type('text/plain').send('Requête refusée.');
  });

  const setSession = (req, res) => {
    res.cookie(SESSION_COOKIE, auth.createToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      path: '/',
      maxAge: SESSION_TTL_MS,
    });
  };

  // Connexion -------------------------------------------------------------

  router.get('/connexion', (req, res) => {
    if (auth.verifyToken(readCookie(req, SESSION_COOKIE))) return res.redirect(303, '/admin');
    res.render('admin/login', { error: '', next: req.query.suite || '' });
  });

  router.post('/connexion', express.urlencoded({ extended: false, limit: '4kb' }), async (req, res) => {
    const next = typeof req.body?.suite === 'string' && /^\/admin(\/|$)/.test(req.body.suite) ? req.body.suite : '/admin';
    if (!loginLimiter.hit(req.ip)) {
      return res.status(429).render('admin/login', { error: 'Trop de tentatives. Réessayez dans quelques minutes.', next });
    }
    if (!(await auth.verifyPassword(req.body?.password))) {
      return res.status(401).render('admin/login', { error: 'Mot de passe incorrect.', next });
    }
    loginLimiter.reset(req.ip);
    setSession(req, res);
    res.redirect(303, next);
  });

  router.post('/deconnexion', (req, res) => {
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.redirect(303, '/admin/connexion');
  });

  // Tout ce qui suit nécessite d'être connecté.
  router.use((req, res, next) => {
    if (auth.verifyToken(readCookie(req, SESSION_COOKIE))) return next();
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ ok: false, errors: ['Votre session a expiré : reconnectez-vous.'] });
    }
    const suite = req.method === 'GET' ? `?suite=${encodeURIComponent(req.originalUrl)}` : '';
    res.redirect(303, `/admin/connexion${suite}`);
  });

  // Tableau de bord ---------------------------------------------------------

  router.get('/', (req, res) => {
    const content = store.getContent();
    res.render('admin/dashboard', {
      active: 'dashboard',
      checklist: setupChecklist(content, { auth, config }),
      messages: store.listMessages().slice(0, 4).map(normalizeRequest),
      totalMessages: store.messages.length,
      visibleProjects: content.projects.filter((p) => p.visible).length,
      mailEnabled: mailer.enabled,
      updatedAt: content.meta.updatedAt,
    });
  });

  // Édition des contenus ------------------------------------------------------

  router.get('/pages/:id', (req, res, next) => {
    const page = getPage(req.params.id);
    if (!page) return next();
    res.render('admin/editor', { active: page.id, page });
  });

  router.post('/api/pages/:id', express.json({ limit: '2mb' }), async (req, res) => {
    const page = getPage(req.params.id);
    if (!page) return res.status(404).json({ ok: false, errors: ['Page inconnue.'] });
    const { draft, errors } = applyPageInput(page, store.getContent(), req.body);
    if (errors.length) return res.status(400).json({ ok: false, errors });
    const saved = await store.saveContent(draft);
    res.json({ ok: true, updatedAt: saved.meta.updatedAt });
  });

  router.post('/api/upload', express.raw({ type: 'image/*', limit: '12mb' }), async (req, res) => {
    const ext = detectImage(req.body);
    if (!ext) {
      return res.status(400).json({ ok: false, errors: ['Format non pris en charge : utilisez une image JPEG, PNG, WebP, AVIF ou GIF.'] });
    }
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    await fs.writeFile(path.join(store.uploadsDir, name), req.body);
    res.json({ ok: true, url: `/uploads/${name}` });
  });

  // Demandes (formulaires de contact et de devis) -------------------------------

  router.get('/messages', (req, res) => res.redirect(301, '/admin/demandes'));

  router.get('/demandes', (req, res) => {
    const all = store.listMessages().map(normalizeRequest);
    const status = REQUEST_STATUSES.some((s) => s.value === req.query.statut) ? req.query.statut : '';
    const type = REQUEST_TYPES.some((t) => t.value === req.query.type) ? req.query.type : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
    const needle = q.toLowerCase();
    const requests = all.filter(
      (m) =>
        (!status || m.status === status) &&
        (!type || m.type === type) &&
        (!needle || [m.name, m.email, m.phone, m.company, m.message].join(' ').toLowerCase().includes(needle)),
    );
    const counts = Object.fromEntries(REQUEST_STATUSES.map((s) => [s.value, all.filter((m) => m.status === s.value).length]));
    res.render('admin/requests', {
      active: 'requests',
      requests,
      total: all.length,
      counts,
      filters: { status, type, q },
      query: new URLSearchParams(Object.entries({ statut: status, type, q }).filter(([, v]) => v)).toString(),
      statuses: REQUEST_STATUSES,
      types: REQUEST_TYPES,
    });
  });

  router.get('/demandes/export.csv', (req, res) => {
    const header = ['Date', 'Type', 'Statut', 'Nom', 'Email', 'Téléphone', 'Entreprise', 'Activité', 'Fonctionnalités', 'Message', 'Note interne', 'Envoyée depuis'];
    const rows = store.listMessages().map(normalizeRequest).map((m) => [
      formatDate(m.createdAt),
      labelOf(REQUEST_TYPES, m.type),
      labelOf(REQUEST_STATUSES, m.status),
      m.name,
      m.email,
      m.phone,
      m.company,
      sectorLabel(m.sector),
      m.modules.join(', '),
      m.message,
      m.note,
      m.source === 'accueil' ? 'Accueil' : 'Page contact',
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
    res.attachment(`demandes-${new Date().toISOString().slice(0, 10)}.csv`);
    res.type('text/csv; charset=utf-8').send(`\uFEFF${csv}\r\n`);
  });

  router.post('/api/messages/:id/read', async (req, res) => {
    const found = await store.updateMessage(req.params.id, { read: true });
    res.status(found ? 200 : 404).json({ ok: found, unread: store.unreadCount() });
  });

  const form = express.urlencoded({ extended: false, limit: '16kb' });
  const back = (req, id) => {
    const target = typeof req.body?.retour === 'string' && /^\/admin\/demandes(\?[^#\s]*)?$/.test(req.body.retour) ? req.body.retour : '/admin/demandes';
    return id ? `${target}#m-${id}` : target;
  };

  router.post('/demandes/:id/statut', form, async (req, res) => {
    const status = REQUEST_STATUSES.some((s) => s.value === req.body?.status) ? req.body.status : null;
    if (status) await store.updateMessage(req.params.id, { status, read: true });
    res.redirect(303, back(req, req.params.id));
  });

  router.post('/demandes/:id/note', form, async (req, res) => {
    await store.updateMessage(req.params.id, { note: cleanText(req.body?.note, 2000, true), read: true });
    res.redirect(303, back(req, req.params.id));
  });

  router.post('/demandes/:id/lu', form, async (req, res) => {
    const message = store.messages.find((m) => m.id === req.params.id);
    if (message) await store.updateMessage(message.id, { read: !message.read });
    res.redirect(303, back(req, req.params.id));
  });

  router.post('/demandes/:id/supprimer', form, async (req, res) => {
    await store.deleteMessage(req.params.id);
    res.redirect(303, back(req));
  });

  router.post('/demandes/tout-lu', form, async (req, res) => {
    for (const m of store.messages.filter((x) => !x.read)) await store.updateMessage(m.id, { read: true });
    res.redirect(303, back(req));
  });

  // Compte et sauvegarde ------------------------------------------------------

  const renderAccount = (res, { status = 200, error = '', success = '' } = {}) => {
    res.status(status).render('admin/account', {
      active: 'account',
      usesEnvPassword: auth.usesEnvPassword,
      isTemporary: auth.isTemporary,
      mailEnabled: mailer.enabled,
      error,
      success,
      minLength: MIN_PASSWORD_LENGTH,
    });
  };

  router.get('/compte', (req, res) => {
    renderAccount(res, { success: req.query.ok === '1' ? 'Votre mot de passe a été modifié.' : '' });
  });

  router.post('/compte/mot-de-passe', express.urlencoded({ extended: false, limit: '4kb' }), async (req, res) => {
    const { current = '', password = '', confirm = '' } = req.body || {};
    if (auth.usesEnvPassword) return renderAccount(res, { status: 400, error: 'Le mot de passe est défini par la variable ADMIN_PASSWORD.' });
    if (!(await auth.verifyPassword(current))) return renderAccount(res, { status: 400, error: 'Le mot de passe actuel est incorrect.' });
    if (password.length < MIN_PASSWORD_LENGTH) {
      return renderAccount(res, { status: 400, error: `Choisissez un mot de passe d’au moins ${MIN_PASSWORD_LENGTH} caractères.` });
    }
    if (password !== confirm) return renderAccount(res, { status: 400, error: 'Les deux mots de passe ne correspondent pas.' });
    await auth.setPassword(password);
    setSession(req, res);
    log.info('Admin : mot de passe modifié.');
    res.redirect(303, '/admin/compte?ok=1');
  });

  router.get('/sauvegarde', (req, res) => {
    const date = new Date().toISOString().slice(0, 10);
    res.attachment(`sauvegarde-site-${date}.json`);
    res.type('application/json').send(
      JSON.stringify({ app: 'subnet', exportedAt: new Date().toISOString(), content: store.getContent() }, null, 2),
    );
  });

  router.post('/api/import', express.json({ limit: '5mb' }), async (req, res) => {
    const data = isPlainObject(req.body?.content) ? req.body.content : req.body;
    if (!isPlainObject(data) || !isPlainObject(data.site) || !isPlainObject(data.home)) {
      return res.status(400).json({ ok: false, errors: ['Ce fichier n’est pas une sauvegarde valide.'] });
    }
    let draft = store.getContent();
    const errors = [];
    for (const page of PAGES) {
      const payload = { sections: page.sections.map((s) => getAt(data, s.path)) };
      const result = applyPageInput(page, draft, payload);
      errors.push(...result.errors);
      draft = result.draft;
    }
    if (errors.length) return res.status(400).json({ ok: false, errors: errors.slice(0, 10) });
    await store.saveContent(draft);
    res.json({ ok: true });
  });

  return router;
}
