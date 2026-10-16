import path from 'node:path';
import express from 'express';
import compression from 'compression';
import { Store } from './store.js';
import { Auth } from './auth.js';
import { createMailer } from './mailer.js';
import { securityHeaders } from './security.js';
import { viewContent, viewHelpers } from './helpers.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';

export async function createApp(config, { log = console } = {}) {
  const store = new Store(config.dataDir);
  await store.init();
  const auth = new Auth({
    dataDir: config.dataDir,
    adminPassword: config.adminPassword,
    sessionSecret: config.sessionSecret,
    log,
  });
  await auth.init();
  const mailer = createMailer(config.smtp, log);
  const ctx = { config, store, auth, mailer, log };

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

  // Contenu « affichage » disponible dans toutes les vues publiques.
  app.use((req, res, next) => {
    const content = store.getContent();
    res.locals.c = viewContent(content);
    res.locals.currentPath = req.path;
    res.locals.baseUrl = config.baseUrl || content.site.url.replace(/\/+$/, '') || `${req.protocol}://${req.host}`;
    next();
  });

  app.use('/admin', adminRouter(ctx));
  app.use(publicRouter(ctx));

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
