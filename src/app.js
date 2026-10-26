import path from 'node:path';
import express from 'express';
import compression from 'compression';
import { Store } from './store.js';
import { Auth, SESSION_COOKIE } from './auth.js';
import { createMailer } from './mailer.js';
import { securityHeaders } from './security.js';
import { viewContent, viewHelpers } from './helpers.js';
import { publicRouter } from './routes/public.js';
import { adminRouter, readCookie } from './routes/admin.js';
import { IGNORE_COOKIE, VisitStats } from './stats.js';
import { blogRouter } from './routes/blog.js';
import { blogApiRouter } from './routes/blog-api.js';
import { createProspector } from './prospecting/runner.js';

// prospecting : accès réseau et services remplaçables (tests).
export async function createApp(config, { log = console, prospecting = {}, seedProspects = true } = {}) {
  const store = new Store(config.dataDir, { seedProspects, log });
  await store.init();
  const auth = new Auth({
    dataDir: config.dataDir,
    adminPassword: config.adminPassword,
    sessionSecret: config.sessionSecret,
    log,
  });
  await auth.init();
  const mailer = createMailer(config.smtp, log);
  const prospector = createProspector({ config, store, log, ...prospecting });
  const stats = new VisitStats(config.dataDir, { log });
  await stats.init();
  const ctx = { config, store, auth, mailer, log, prospector, stats };

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.set('view engine', 'ejs');
  app.set('views', path.join(config.root, 'views'));
  app.set('view cache', config.isProd);
  Object.assign(app.locals, viewHelpers(config));

  app.use(compression());
  app.use(securityHeaders);

  // Fichiers statiques : cache long pour les URL versionnées (?v=…).
  app.use(
    '/assets',
    (req, res, next) => {
      res.locals.versioned = 'v' in req.query;
      next();
    },
    express.static(path.join(config.root, 'public'), {
      index: false,
      cacheControl: false,
      setHeaders(res) {
        let value = 'no-cache';
        if (config.isProd) value = res.locals.versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=86400';
        res.setHeader('Cache-Control', value);
      },
    }),
  );
  app.use(
    '/uploads',
    express.static(store.uploadsDir, {
      index: false,
      dotfiles: 'deny',
      cacheControl: false,
      setHeaders(res) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );
  app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(config.root, 'public/images/favicon.ico'), { maxAge: '1d' });
  });

  // Statistiques de visite, sans cookie (l'administrateur connecté, ou sur un appareil
  // qu'il a choisi d'ignorer, n'est pas compté).
  app.use(stats.middleware({ isAdmin: (req) => readCookie(req, IGNORE_COOKIE) === '1' || auth.verifyToken(readCookie(req, SESSION_COOKIE)) }));

  // Contenu « affichage » disponible dans toutes les vues publiques.
  app.use((req, res, next) => {
    const content = store.getContent();
    res.locals.c = viewContent(content);
    res.locals.currentPath = req.path;
    res.locals.baseUrl = config.baseUrl || content.site.url.replace(/\/+$/, '') || `${req.protocol}://${req.host}`;
    next();
  });

  app.use('/api/admin/posts', blogApiRouter(ctx));
  app.use('/admin', adminRouter(ctx));
  app.use(blogRouter(ctx));
  app.use(publicRouter(ctx));

  // Publication programmée des articles, vérifiée toutes les minutes.
  const publishTimer = setInterval(() => {
    store.publishDue().catch((err) => log.error('Publication programmée :', err.message));
  }, 60 * 1000);
  publishTimer.unref();

  app.use((req, res) => {
    res.status(404).render('pages/404', { page: { title: 'Page introuvable', noindex: true } });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) log.error(err);
    if (res.headersSent) return;
    if (req.accepts(['html', 'json']) === 'json' || req.is('json')) {
      res.status(status).json({ ok: false, errors: [status === 413 ? 'Fichier trop volumineux.' : 'Une erreur est survenue.'] });
      return;
    }
    res.status(status).render('pages/error', { page: { title: 'Erreur', noindex: true }, status });
  });

  app.ctx = ctx;
  return app;
}
