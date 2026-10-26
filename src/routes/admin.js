import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { SESSION_COOKIE, SESSION_TTL_MS } from '../auth.js';
import { ICON_OPTIONS, PAGES, REQUEST_STATUSES, REQUEST_TYPES, getPage } from '../schema.js';
import { applyPageInput, cleanText, getAt, isPlainObject } from '../sanitize.js';
import { formatDate, sectorLabel } from '../helpers.js';
import { LEGAL_PAGES } from '../defaults.js';
import { LOCAL_PATH } from './public.js';
import { DEVICE_LABELS, IGNORE_COOKIE, SOURCES, addDays, dayKey, ranking, sourceLabel } from '../stats.js';
import { createRateLimiter, isSameOrigin } from '../security.js';
import { renderMarkdown } from '../markdown.js';
import { LIMITS, POST_CATEGORIES, POST_STATUSES, blankPost, categoryLabel, findMarkers, readingTime, uniqueSlug, validatePost, wordCount } from '../posts.js';
import { PROSPECT_SECTORS, PROSPECT_STATUSES, SEARCH_LIMITS, fold, googleMapsLink, parseSearchFilters, prospectSectorLabel, prospectStatusLabel, refreshProspect, whatsappLink } from '../prospects.js';

const MIN_PASSWORD_LENGTH = 10;

const FIELD_LABELS = {
  title: 'Titre',
  slug: 'Adresse',
  metaTitle: 'Titre Google',
  metaDescription: 'Description Google',
  excerpt: 'Résumé',
  content: 'Contenu',
  coverImage: 'Image de couverture',
  coverAlt: 'Texte alternatif',
  category: 'Catégorie',
  tags: 'Étiquettes',
  faq: 'FAQ',
  targetKeyword: 'Requête visée',
  topicId: 'Sujet',
};

export function readCookie(req, name) {
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

// Nom lisible d'une page du site, à partir de son adresse.
export function pageLabel(pathname, content, posts = []) {
  if (!pathname) return '';
  if (pathname === '(autres)') return 'Autres pages';
  const fixed = {
    '/': 'Accueil',
    '/offre': 'L’offre',
    '/secteurs': 'Secteurs',
    '/realisations': 'Réalisations',
    '/faq': 'FAQ',
    '/contact': 'Contact',
    '/blog': 'Blog',
    [LOCAL_PATH]: 'Création de site à Grenoble',
  };
  if (fixed[pathname]) return fixed[pathname];
  let m = pathname.match(/^\/secteurs\/([^/]+)$/);
  const sector = m && content.sectors.find((x) => x.slug === m[1]);
  if (sector) return `Secteur · ${sector.name}`;
  m = pathname.match(/^\/blog\/categorie\/([^/]+)$/);
  if (m) return `Blog · ${categoryLabel(m[1])}`;
  m = pathname.match(/^\/blog\/([^/]+)$/);
  const post = m && posts.find((p) => p.slug === m[1]);
  if (post) return post.title;
  const legal = LEGAL_PAGES.find((l) => `/${l.slug}` === pathname);
  if (legal) return content.legal[legal.key]?.title || pathname;
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

// Périodes de la page Statistiques : barres par jour, semaine ou mois.
export const STATS_PERIODS = [
  { value: '7', days: 7, label: '7 jours', unit: 'day', previous: '7 jours précédents' },
  { value: '30', days: 30, label: '30 jours', unit: 'day', previous: '30 jours précédents' },
  { value: '90', days: 90, label: '3 mois', unit: 'week', previous: '3 mois précédents' },
  { value: '365', days: 365, label: '12 mois', unit: 'month', previous: '' },
];

export function adminRouter({ config, store, auth, mailer, log, prospector, stats }) {
  const router = express.Router();
  const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

  router.use(async (req, res, next) => {
    await auth.refresh();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    const content = store.getContent();
    Object.assign(res.locals, {
      content,
      site: content.site,
      pages: PAGES,
      unread: store.unreadCount(),
      draftCount: store.posts.filter((p) => p.status === 'draft').length,
      toContact: store.prospects.filter((p) => p.status === 'a-contacter').length,
      pageLabel: (pathname) => pageLabel(pathname, content, store.posts),
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
      drafts: store.listPosts().filter((p) => p.status === 'draft').slice(0, 5).map((p) => ({ ...p, markers: findMarkers(p).length })),
      visibleProjects: content.projects.filter((p) => p.visible).length,
      mailEnabled: mailer.enabled,
      updatedAt: content.meta.updatedAt,
      weekVisits: stats ? stats.summarize(addDays(dayKey(), -6), dayKey()).visits : 0,
    });
  });

  // Statistiques de visite -----------------------------------------------------

  router.get('/statistiques', (req, res) => {
    const period = STATS_PERIODS.find((p) => p.value === req.query.periode) || STATS_PERIODS[1];
    const today = dayKey();
    const start = addDays(today, -(period.days - 1));
    // La période commence au plus tôt le jour où la mesure a démarré, et n'est
    // comparée à la précédente que si celle-ci a été entièrement mesurée.
    const firstDay = stats.startedAt ? dayKey(new Date(stats.startedAt)) : today;
    const from = start < firstDay ? firstDay : start;
    const comparable = Boolean(period.previous) && addDays(start, -period.days) >= firstDay;
    const current = stats.summarize(from, today);
    const previous = comparable ? stats.summarize(addDays(start, -period.days), addDays(start, -1)) : null;
    const content = store.getContent();
    const label = (p) => pageLabel(p, content, store.posts);
    const pages = (map) => ranking(map).rows.map((r) => ({ ...r, label: label(r.key), href: r.key === '(autres)' ? '' : r.key }));
    const knownHost = (host) => SOURCES.some((s) => s.hosts.test(host));
    const otherSites = Object.fromEntries(Object.entries(current.referrers).filter(([host]) => !knownHost(host)));
    res.render('admin/stats', {
      active: 'stats',
      period,
      periods: STATS_PERIODS,
      current,
      previous,
      series: stats.series(from, today, period.unit),
      startedAt: stats.startedAt,
      partial: from > start,
      deviceIgnored: readCookie(req, IGNORE_COOKIE) === '1',
      lists: {
        paths: pages(current.paths),
        entries: pages(current.entries),
        sources: ranking(current.sources).rows.map((r) => ({ ...r, label: sourceLabel(r.key) })),
        sites: ranking(otherSites).rows.map((r) => ({ ...r, label: r.key === '(autres)' ? 'Autres sites' : r.key })),
        campaigns: ranking(current.campaigns).rows.map((r) => ({ ...r, label: r.key === '(autres)' ? 'Autres campagnes' : r.key })),
        devices: ranking(current.devices).rows.map((r) => ({ ...r, label: DEVICE_LABELS[r.key] || r.key })),
        contactFrom: pages(current.contactFrom),
        notFound: pages(current.notFound),
      },
    });
  });

  // Ne plus compter (ou compter à nouveau) les visites de cet appareil, même déconnecté.
  router.post('/statistiques/appareil', express.urlencoded({ extended: false, limit: '1kb' }), (req, res) => {
    if (req.body?.ignorer === '1') {
      res.cookie(IGNORE_COOKIE, '1', { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/', maxAge: 400 * 24 * 60 * 60 * 1000 });
    } else {
      res.clearCookie(IGNORE_COOKIE, { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/' });
    }
    res.redirect(303, '/admin/statistiques');
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
    const saved = await store.saveContent(draft, { pages: [page.id] });
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

  // Articles du blog -----------------------------------------------------------

  router.get('/articles', async (req, res) => {
    await store.publishDue();
    const status = POST_STATUSES.some((s) => s.value === req.query.statut) ? req.query.statut : '';
    const category = POST_CATEGORIES.some((c) => c.value === req.query.categorie) ? req.query.categorie : '';
    const sort = req.query.tri === 'ancien' ? 'ancien' : 'recent';
    const all = store.posts.map((p) => ({ ...p, markers: findMarkers(p), words: wordCount(p.content) }));
    const date = (p) => p.publishedAt || p.scheduledAt || p.updatedAt;
    const posts = all
      .filter((p) => (!status || p.status === status) && (!category || p.category === category))
      .sort((a, b) => (sort === 'ancien' ? date(a).localeCompare(date(b)) : date(b).localeCompare(date(a))));
    res.render('admin/posts', {
      active: 'posts',
      posts,
      total: all.length,
      counts: Object.fromEntries(POST_STATUSES.map((s) => [s.value, all.filter((p) => p.status === s.value).length])),
      filters: { status, category, sort },
      statuses: POST_STATUSES,
      categories: POST_CATEGORIES,
    });
  });

  const renderPostEditor = (res, post) => {
    res.render('admin/post-editor', {
      active: 'posts',
      post,
      markers: findMarkers(post),
      limits: LIMITS,
      categories: POST_CATEGORIES,
      preview: renderMarkdown(post.content),
    });
  };

  router.get('/articles/nouveau', (req, res) => renderPostEditor(res, { ...blankPost(), id: '' }));

  router.get('/articles/:id', (req, res, next) => {
    const post = store.getPost(req.params.id);
    if (!post) return next();
    renderPostEditor(res, post);
  });

  router.post('/api/articles/apercu', express.json({ limit: '400kb' }), (req, res) => {
    const content = typeof req.body?.content === 'string' ? req.body.content : '';
    res.json({ ok: true, html: renderMarkdown(content), words: wordCount(content), minutes: readingTime(content) });
  });

  // Enregistrer, programmer, publier ou dépublier. La publication exige toutes
  // les règles SEO et aucun marqueur [À COMPLÉTER] restant.
  router.post(['/api/articles', '/api/articles/:id'], express.json({ limit: '400kb' }), async (req, res) => {
    const existing = req.params.id ? store.getPost(req.params.id) : null;
    if (req.params.id && !existing) return res.status(404).json({ ok: false, errors: ['Article introuvable.'] });
    const action = ['save', 'schedule', 'publish', 'unpublish'].includes(req.body?.action) ? req.body.action : 'save';
    const current = existing?.status || 'draft';
    const target = { save: current, schedule: 'scheduled', publish: 'published', unpublish: 'draft' }[action];
    const strict = target !== 'draft';
    const { values, errors } = validatePost(req.body?.post, { strict });
    const messages = errors.map((e) => `${FIELD_LABELS[e.field.replace(/\[.*$/, '')] || 'Article'} : ${e.message}`);
    const markers = findMarkers(values);
    if (strict && markers.length) {
      messages.push(`Publication impossible : ${markers.length} marqueur${markers.length > 1 ? 's' : ''} [À COMPLÉTER] à remplir.`);
    }
    let scheduledAt = null;
    if (target === 'scheduled') {
      const at = Date.parse(req.body?.scheduledAt);
      if (Number.isNaN(at) || at <= Date.now()) messages.push('Choisissez une date de programmation dans le futur.');
      else scheduledAt = new Date(at).toISOString();
    }
    if (messages.length) return res.status(400).json({ ok: false, errors: messages, markers });
    const fields = {
      ...values,
      slug: uniqueSlug(values.slug || values.title, store.posts, existing?.id),
      status: target,
      scheduledAt: target === 'scheduled' ? scheduledAt : null,
      publishedAt: target === 'published' ? existing?.publishedAt || new Date().toISOString() : existing?.publishedAt || null,
    };
    const post = existing ? await store.updatePost(existing.id, fields) : await store.addPost({ ...blankPost(), ...fields });
    res.json({ ok: true, post: { id: post.id, slug: post.slug, status: post.status, updatedAt: post.updatedAt, scheduledAt: post.scheduledAt, publishedAt: post.publishedAt }, markers });
  });

  router.post('/articles/:id/supprimer', express.urlencoded({ extended: false, limit: '4kb' }), async (req, res) => {
    await store.deletePost(req.params.id);
    res.redirect(303, '/admin/articles');
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

  // Prospection (entreprises sans site à contacter sur WhatsApp) -----------------

  const CONTACTED = ['envoye', 'repondu', 'rdv', 'client', 'refus'];
  const REPLIED = ['repondu', 'rdv', 'client'];

  const prospectBack = (req, id) => {
    const target = typeof req.body?.retour === 'string' && /^\/admin\/prospection(\?[^#\s]*)?$/.test(req.body.retour) ? req.body.retour : '/admin/prospection';
    return id ? `${target}#p-${id}` : target;
  };
  // Même page, avec un message d'erreur, que des filtres soient actifs ou non.
  const prospectError = (req, id, message) => {
    const url = new URL(prospectBack(req), 'http://localhost');
    url.searchParams.set('erreur', message);
    return `${url.pathname}${url.search}${id ? `#p-${id}` : ''}`;
  };

  router.get('/prospection', (req, res) => {
    const all = store.listProspects();
    const status = PROSPECT_STATUSES.some((s) => s.value === req.query.statut) ? req.query.statut : '';
    const sector = PROSPECT_SECTORS.some((s) => s.value === req.query.secteur) ? req.query.secteur : '';
    const city = typeof req.query.ville === 'string' ? req.query.ville.trim().slice(0, 80) : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
    const sort = ['score', 'nom', 'recent'].includes(req.query.tri) ? req.query.tri : 'score';
    const needle = fold(q);
    const prospects = all.filter(
      (p) =>
        (!status || p.status === status) &&
        (!sector || p.sector === sector) &&
        (!city || fold(p.address.city) === fold(city)) &&
        (!needle || fold([p.name, p.kindLabel, p.address.city, p.address.street, p.phone, p.note].join(' ')).includes(needle)),
    );
    if (sort === 'nom') prospects.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    if (sort === 'recent') prospects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const contacted = all.filter((p) => CONTACTED.includes(p.status)).length;
    const replied = all.filter((p) => REPLIED.includes(p.status)).length;
    res.render('admin/prospects', {
      active: 'prospects',
      prospects,
      total: all.length,
      counts: Object.fromEntries(PROSPECT_STATUSES.map((s) => [s.value, all.filter((p) => p.status === s.value).length])),
      cities: [...new Set(all.map((p) => p.address.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
      contacted,
      replied,
      filters: { status, sector, city, q, sort },
      query: new URLSearchParams(Object.entries({ statut: status, secteur: sector, ville: city, q, tri: sort === 'score' ? '' : sort }).filter(([, v]) => v)).toString(),
      statuses: PROSPECT_STATUSES,
      sectors: PROSPECT_SECTORS,
      job: prospector.state,
      lastSearch: store.prospectSearch,
      searchDefaults: parseSearchFilters(store.prospectSearch || {}),
      showSearch: req.query.recherche === '1' || (!all.length && !prospector.state.running),
      error: typeof req.query.erreur === 'string' ? req.query.erreur.slice(0, 200) : '',
      googleEnabled: prospector.googleEnabled,
      aiEnabled: prospector.aiEnabled,
      limits: SEARCH_LIMITS,
      hasGoogleData: all.some((p) => p.google),
      whatsappLink,
      googleMapsLink,
      sectorLabelOf: prospectSectorLabel,
      statusLabelOf: prospectStatusLabel,
    });
  });

  router.get('/prospection/etat', (req, res) => res.json({ ok: true, ...prospector.state }));

  router.post('/prospection/recherche', form, (req, res) => {
    const filters = parseSearchFilters(req.body || {});
    try {
      prospector.start(filters);
    } catch (err) {
      return res.redirect(303, `/admin/prospection?erreur=${encodeURIComponent(err.message)}`);
    }
    res.redirect(303, '/admin/prospection');
  });

  router.post('/prospection/recherche/annuler', form, (req, res) => {
    prospector.cancel();
    res.redirect(303, '/admin/prospection');
  });

  router.get('/prospection/export.csv', (req, res) => {
    const header = ['Nom', 'Activité', 'Secteur', 'Ville', 'Adresse', 'Téléphone', 'Type de numéro', 'Site', 'Instagram', 'Note Google', 'Avis Google', 'Score (%)', 'Statut', 'Analyse', 'Message', 'Relance', 'Note interne', 'Lien WhatsApp', 'Source', 'Ajouté le'];
    const rows = store.listProspects().map((p) => [
      p.name,
      p.kindLabel,
      prospectSectorLabel(p.sector),
      p.address.city,
      [p.address.street, p.address.postcode].filter(Boolean).join(', '),
      p.phone,
      { whatsapp: 'WhatsApp', mobile: 'Mobile', fixe: 'Fixe' }[p.phoneKind] || '',
      p.website,
      p.instagram,
      p.google?.rating ?? '',
      p.google?.reviews ?? '',
      p.score,
      prospectStatusLabel(p.status),
      p.analysis,
      p.message,
      p.followUp,
      p.note,
      whatsappLink(p.phone, p.message),
      p.source,
      formatDate(p.createdAt),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
    res.attachment(`prospection-${new Date().toISOString().slice(0, 10)}.csv`);
    res.type('text/csv; charset=utf-8').send(`﻿${csv}\r\n`);
  });

  const markSent = (p) => ({ status: 'envoye', contactedAt: p.contactedAt || new Date().toISOString() });

  router.post('/prospection/:id/statut', form, async (req, res) => {
    const p = store.getProspect(req.params.id);
    const status = PROSPECT_STATUSES.some((s) => s.value === req.body?.status) ? req.body.status : null;
    if (p && status) await store.updateProspect(p.id, status === 'envoye' ? markSent(p) : { status });
    res.redirect(303, prospectBack(req, req.params.id));
  });

  router.post('/prospection/:id/note', form, async (req, res) => {
    await store.updateProspect(req.params.id, { note: cleanText(req.body?.note, 2000, true) });
    res.redirect(303, prospectBack(req, req.params.id));
  });

  // Message et relance retouchés à la main : ils ne seront plus régénérés.
  router.post('/prospection/:id/message', form, async (req, res) => {
    const p = store.getProspect(req.params.id);
    if (p) {
      const message = cleanText(req.body?.message, 1500, true);
      const followUp = cleanText(req.body?.followUp, 800, true);
      await store.updateProspect(p.id, { message: message || p.message, followUp: followUp || p.followUp, messageSource: 'manuel' });
    }
    res.redirect(303, prospectBack(req, req.params.id));
  });

  // Nouveau message : modèle, ou rédaction par Claude quand la clé est configurée.
  router.post('/prospection/:id/regenerer', form, async (req, res) => {
    const p = store.getProspect(req.params.id);
    if (!p) return res.redirect(303, prospectBack(req));
    // Un autre jeu de variantes à chaque demande, sinon le texte serait identique.
    const variant = p.messageSource === 'modele' ? p.messageVariant + 1 : p.messageVariant;
    let patch = { ...refreshProspect({ ...p, messageSource: 'modele', messageVariant: variant }), messageSource: 'modele', messageVariant: variant };
    if (req.body?.ia === '1' && prospector.writer) {
      try {
        const texts = await prospector.writer.write(p);
        if (texts) patch = { ...texts, messageSource: 'ia' };
        else return res.redirect(303, prospectError(req, p.id, 'Claude n’a pas produit de message utilisable, réessayez.'));
      } catch (err) {
        log.error('Prospection : rédaction impossible :', err.message);
        return res.redirect(303, prospectError(req, p.id, `Rédaction impossible : ${err.message}`));
      }
    }
    await store.updateProspect(p.id, patch);
    res.redirect(303, prospectBack(req, p.id));
  });

  router.post('/prospection/:id/supprimer', form, async (req, res) => {
    await store.deleteProspect(req.params.id);
    res.redirect(303, prospectBack(req));
  });

  // Appelé à l'ouverture de WhatsApp depuis la fiche : le texte envoyé est
  // conservé et le prospect passe en « envoyé » s'il était encore à contacter.
  router.post('/api/prospection/:id/envoye', express.json({ limit: '8kb' }), async (req, res) => {
    const p = store.getProspect(req.params.id);
    if (!p) return res.status(404).json({ ok: false, errors: ['Prospect introuvable.'] });
    const patch = {};
    const message = cleanText(req.body?.message, 1500, true);
    if (message && message !== p.message) Object.assign(patch, { message, messageSource: 'manuel' });
    const changed = p.status === 'a-contacter';
    if (changed) Object.assign(patch, markSent(p));
    if (Object.keys(patch).length) await store.updateProspect(p.id, patch);
    res.json({ ok: true, changed, status: store.getProspect(p.id).status, toContact: store.prospects.filter((x) => x.status === 'a-contacter').length });
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
    await store.saveContent(draft, { pages: PAGES.map((p) => p.id) });
    res.json({ ok: true });
  });

  return router;
}
