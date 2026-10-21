import express from 'express';
import { LEGAL_PAGES } from '../defaults.js';
import { CONTACT_SECTOR_OPTIONS } from '../schema.js';
import { cleanText, isEmail } from '../sanitize.js';
import { createRateLimiter } from '../security.js';
import { isPublished } from '../posts.js';
import { faqJsonLd, localJsonLd, organizationJsonLd, renderLegal, sectorJsonLd } from '../helpers.js';

const TEL_RE = /^\+?[0-9 ().-]{6,30}$/;

// Page dédiée à la ville (référencement local).
export const LOCAL_PATH = '/creation-site-internet-grenoble';

// Page d'origine du formulaire → page affichée après l'envoi.
const SUCCESS_REDIRECTS = {
  contact: '/contact?envoye=1#formulaire',
  accueil: '/?envoye=1#contact',
};

// Page du site consultée juste avant le formulaire (chemin local uniquement).
export function localPath(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!/^\/(?!\/)[^\s?#\\]{0,159}$/.test(text) || /^\/admin(\/|$)/.test(text)) return '';
  return text.length > 1 ? text.replace(/\/+$/, '') : text;
}

function refererPath(req) {
  try {
    const url = new URL(req.get('referer') || '');
    if (url.host !== req.get('host')) return '';
    const path = localPath(url.pathname);
    return path === '/contact' ? '' : path;
  } catch {
    return '';
  }
}

// Fonctionnalités cochées : indices de la liste proposée, convertis en libellés.
function selectedModules(raw, available) {
  const list = (Array.isArray(raw) ? raw : raw ? [raw] : []).map(String);
  const indices = [...new Set(list.filter((v) => /^\d{1,2}$/.test(v) && Number(v) < available.length))];
  return { indices, labels: indices.map((i) => available[Number(i)]) };
}

function validateContact(body, availableModules = []) {
  const type = body.type === 'contact' ? 'contact' : 'devis';
  const modules = type === 'devis' ? selectedModules(body.modules, availableModules) : { indices: [], labels: [] };
  const values = {
    type,
    name: cleanText(body.name, 100),
    email: cleanText(body.email, 200).toLowerCase(),
    phone: cleanText(body.phone, 40),
    company: cleanText(body.company, 120),
    sector: CONTACT_SECTOR_OPTIONS.some((o) => o.value === body.sector) ? body.sector : '',
    message: cleanText(body.message, 5000, true),
    modules: modules.indices,
  };
  const errors = {};
  if (values.name.length < 2) errors.name = 'Indiquez votre nom.';
  if (!isEmail(values.email)) errors.email = 'Indiquez une adresse email valide.';
  if (values.phone && !TEL_RE.test(values.phone)) errors.phone = 'Ce numéro ne semble pas valide.';
  if (values.message.length < 10) {
    errors.message = type === 'devis' ? 'Décrivez votre projet en quelques mots.' : 'Écrivez votre message en quelques mots.';
  }
  return { values, errors, modules: modules.labels };
}

// Date de la dernière modification d'une page : celle des rubriques de
// l'administration qui composent son contenu, à défaut celle du site.
function lastModified(meta, pages) {
  const dates = pages.map((id) => meta.sections?.[id]).filter(Boolean).sort();
  const date = dates.at(-1) || meta.updatedAt || meta.createdAt;
  return date ? date.slice(0, 10) : '';
}

export function publicRouter({ config, store, auth, mailer, log, stats }) {
  const router = express.Router();
  const contactLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

  const visibleProjects = (c) => c.projects.filter((p) => p.visible && p.image);

  router.get('/', (req, res) => {
    const { c } = res.locals;
    res.render('pages/home', {
      page: { title: '', description: c.site.description, path: '/', seo: c.home.seo },
      projects: visibleProjects(c).slice(0, 4),
      jsonLd: organizationJsonLd(c, res.locals.baseUrl),
      sent: req.query.envoye === '1',
      token: auth.createFormToken(),
    });
  });

  router.get('/offre', (req, res) => {
    const { c } = res.locals;
    res.render('pages/offre', {
      page: { title: 'L’offre', description: c.offer.hero.subtitle || c.site.description, path: '/offre', seo: c.offer.seo },
    });
  });

  router.get('/secteurs', (req, res) => {
    const { c } = res.locals;
    res.render('pages/secteurs', {
      page: { title: 'Secteurs', description: c.sectorsPage.hero.subtitle, path: '/secteurs', seo: c.sectorsPage.seo },
    });
  });

  router.get('/secteurs/:slug', (req, res, next) => {
    const { c } = res.locals;
    const sector = c.sectors.find((s) => s.slug === req.params.slug);
    if (!sector) return next();
    res.render('pages/secteur', {
      page: { title: sector.name, description: sector.intro, path: `/secteurs/${sector.slug}`, image: sector.image, seo: sector.seo },
      sector,
      jsonLd: sectorJsonLd(c, sector, res.locals.baseUrl),
      others: c.sectors.filter((s) => s.slug !== sector.slug),
      projects: visibleProjects(c).filter((p) => p.sector === sector.slug).slice(0, 3),
    });
  });

  router.get(LOCAL_PATH, (req, res) => {
    const { c } = res.locals;
    res.render('pages/local', {
      page: { title: 'Création de site internet à Grenoble', description: c.local.hero.subtitle, path: LOCAL_PATH, seo: c.local.seo },
      jsonLd: localJsonLd(c, res.locals.baseUrl, LOCAL_PATH),
    });
  });

  router.get('/realisations', (req, res) => {
    const { c } = res.locals;
    const projects = visibleProjects(c);
    const used = new Set(projects.map((p) => p.sector));
    const filters = [
      ...c.sectors.map((s) => ({ value: s.slug, label: s.shortName || s.name })),
      { value: 'autre', label: 'Autres' },
    ].filter((f) => used.has(f.value));
    res.render('pages/realisations', {
      page: { title: 'Réalisations', description: c.projectsPage.hero.subtitle, path: '/realisations', seo: c.projectsPage.seo },
      projects,
      filters,
    });
  });

  router.get('/faq', (req, res) => {
    const { c } = res.locals;
    res.render('pages/faq', {
      page: { title: 'Questions fréquentes', description: c.faqPage.hero.subtitle, path: '/faq', seo: c.faqPage.seo },
      jsonLd: c.faq.length ? faqJsonLd(c.faq) : null,
    });
  });

  const renderContact = (req, res, { values = {}, errors = {}, formError = '', status = 200 } = {}) => {
    const { c } = res.locals;
    res.status(status).render('pages/contact', {
      page: { title: 'Contact', description: c.contact.page.intro, path: '/contact', seo: c.contact.page.seo },
      sent: req.query.envoye === '1' && status === 200 && !formError,
      values: { sector: '', type: 'devis', ...values },
      errors,
      formError,
      token: auth.createFormToken(),
      sectorOptions: CONTACT_SECTOR_OPTIONS,
    });
  };

  router.get('/contact', (req, res) => {
    const sector = CONTACT_SECTOR_OPTIONS.some((o) => o.value === req.query.secteur) ? req.query.secteur : '';
    const type = req.query.type === 'question' ? 'contact' : 'devis';
    renderContact(req, res, { values: { sector, type, from: refererPath(req) } });
  });

  router.post('/contact', express.urlencoded({ extended: false, limit: '32kb' }), async (req, res) => {
    const body = req.body || {};
    const { values, errors, modules } = validateContact(body, store.getContent().contact.page.modules);
    const source = Object.hasOwn(SUCCESS_REDIRECTS, body.source) ? body.source : 'contact';
    // Page consultée avant la demande : celle d'avant le formulaire de contact,
    // ou l'accueil pour le formulaire rapide.
    const page = source === 'accueil' ? '/' : localPath(body.from);
    values.from = page;

    // Champ piège invisible : rempli uniquement par les robots.
    if (cleanText(body.website)) return res.redirect(303, SUCCESS_REDIRECTS[source]);

    if (!auth.checkFormToken(body.token, config.contactMinDelayMs)) {
      return renderContact(req, res, {
        values,
        status: 400,
        formError: 'Votre message n’a pas pu être envoyé. Merci de réessayer dans quelques secondes.',
      });
    }
    if (Object.keys(errors).length) return renderContact(req, res, { values, errors, status: 400 });
    if (!contactLimiter.hit(req.ip)) {
      return renderContact(req, res, {
        values,
        status: 429,
        formError: 'Vous avez envoyé plusieurs messages récemment. Merci de réessayer dans quelques minutes.',
      });
    }

    const { from, ...fields } = values;
    const message = await store.addMessage({ ...fields, modules, source, page: from, status: 'nouvelle', note: '' });
    stats?.recordContact(from || '/contact');
    mailer.notifyNewMessage(message, store.getContent()).catch((err) => {
      log.error('Email de notification non envoyé :', err.message);
    });
    res.redirect(303, SUCCESS_REDIRECTS[source]);
  });

  for (const { key, slug } of LEGAL_PAGES) {
    router.get(`/${slug}`, (req, res, next) => {
      const { c, baseUrl } = res.locals;
      const legal = c.legal[key];
      if (!legal.published) return next();
      res.render('pages/legal', {
        page: { title: legal.title, description: `${legal.title} du site ${c.site.name}.`, path: `/${slug}` },
        legal,
        html: renderLegal(legal.body, c, baseUrl),
      });
    });
  }

  // OAI-SearchBot (recherche de ChatGPT) suit uniquement son propre groupe :
  // on y répète donc l'exclusion de /admin.
  router.get('/robots.txt', (req, res) => {
    res.type('text/plain').send([
      'User-agent: *',
      'Disallow: /admin',
      '',
      'User-agent: OAI-SearchBot',
      'Allow: /',
      'Disallow: /admin',
      '',
      `Sitemap: ${res.locals.baseUrl}/sitemap.xml`,
      '',
    ].join('\n'));
  });

  // Les pages légales restent accessibles et indexables, mais hors du plan du site.
  router.get('/sitemap.xml', (req, res) => {
    const { c, baseUrl } = res.locals;
    const posts = store.listPosts().filter((p) => isPublished(p));
    const entries = [
      ['/', ['general', 'home', 'offer', 'sectors', 'projects', 'contact']],
      ['/offre', ['offer']],
      ['/secteurs', ['sectors']],
      ...c.sectors.map((s) => [`/secteurs/${s.slug}`, ['sectors', 'projects']]),
      [LOCAL_PATH, ['local', 'sectors', 'offer']],
      ['/realisations', ['projects']],
      ['/faq', ['faq']],
      ['/contact', ['contact']],
    ];
    const url = (p, lastmod) => `  <url><loc>${baseUrl}${p}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
    // Le blog est daté par son article le plus récemment modifié.
    const blogLastmod = posts.map((p) => p.updatedAt).sort().at(-1)?.slice(0, 10) || '';
    const urls = [
      ...entries.map(([p, pages]) => url(p, lastModified(c.meta, pages))),
      url('/blog', blogLastmod),
      ...posts.map((p) => url(`/blog/${p.slug}`, p.updatedAt.slice(0, 10))),
    ].join('\n');
    res
      .type('application/xml')
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  });

  return router;
}
