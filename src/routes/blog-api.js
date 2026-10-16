// API de l'agent de rédaction : création et modification de brouillons uniquement.
// Aucun endpoint ne peut publier : la publication se fait dans l'admin, après relecture.

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { createRateLimiter } from '../security.js';
import { blankPost, findMarkers, uniqueSlug, validatePost } from '../posts.js';

const LIST_FIELDS = ['id', 'slug', 'title', 'targetKeyword', 'topicId', 'status', 'category', 'source', 'createdAt', 'updatedAt', 'publishedAt', 'scheduledAt'];
const DEFAULT_FIELDS = ['id', 'slug', 'title', 'targetKeyword', 'topicId', 'status'];
const EDITABLE = Object.keys(blankPost()).filter((k) => !['status', 'source', 'publishedAt', 'scheduledAt'].includes(k));

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest();

export function blogApiRouter({ config, store, mailer, log }) {
  const router = express.Router();
  const limiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20 });
  const logFile = path.join(config.dataDir, 'blog-api.log');
  const expected = config.blogApiKey ? sha256(config.blogApiKey) : null;

  // Journal de chaque appel (sans la clé).
  router.use((req, res, next) => {
    res.on('finish', () => {
      const line = JSON.stringify({ at: new Date().toISOString(), ip: req.ip, method: req.method, path: req.originalUrl, status: res.statusCode, post: res.locals.postId || undefined });
      fs.appendFile(logFile, line + '\n').catch((err) => log.error('Journal API :', err.message));
    });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    next();
  });

  // Authentification par clé (comparaison à temps constant) et limite de 20 requêtes par heure.
  router.use((req, res, next) => {
    if (!expected) return res.status(503).json({ ok: false, errors: [{ field: '', message: 'API désactivée : BLOG_API_KEY n’est pas configurée.' }] });
    const match = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '');
    const valid = Boolean(match) && crypto.timingSafeEqual(sha256(match[1]), expected);
    if (!limiter.hit(valid ? 'key' : `ip:${req.ip}`)) {
      res.setHeader('Retry-After', '3600');
      return res.status(429).json({ ok: false, errors: [{ field: '', message: 'Limite de 20 requêtes par heure atteinte.' }] });
    }
    if (!valid) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ ok: false, errors: [{ field: '', message: 'Clé d’API invalide ou absente.' }] });
    }
    next();
  });

  const json = express.json({ limit: '200kb' });

  const links = (res, post) => ({
    previewUrl: `${res.locals.baseUrl}/blog/${post.slug}?preview`,
    adminUrl: `${res.locals.baseUrl}/admin/articles/${post.id}`,
  });

  router.get('/', (req, res) => {
    const wanted = typeof req.query.fields === 'string' && req.query.fields ? req.query.fields.split(',').map((f) => f.trim()) : DEFAULT_FIELDS;
    const unknown = wanted.filter((f) => !LIST_FIELDS.includes(f));
    if (unknown.length) return res.status(422).json({ ok: false, errors: unknown.map((f) => ({ field: 'fields', message: `Champ inconnu : ${f}` })) });
    const fields = [...new Set(['id', ...wanted])];
    res.json({ ok: true, posts: store.listPosts().map((p) => Object.fromEntries(fields.map((f) => [f, p[f] ?? null]))) });
  });

  router.post('/', json, async (req, res) => {
    const { values, errors } = validatePost(req.body, { strict: true, unknownKeys: true });
    if (errors.length) return res.status(422).json({ ok: false, errors });
    if (values.topicId && store.posts.some((p) => p.topicId === values.topicId)) {
      return res.status(422).json({ ok: false, errors: [{ field: 'topicId', message: `Un article existe déjà pour le sujet ${values.topicId}.` }] });
    }
    const post = await store.addPost({
      ...blankPost(),
      ...values,
      slug: uniqueSlug(values.slug || values.title, store.posts),
      status: 'draft',
      source: 'api',
    });
    res.locals.postId = post.id;
    const urls = links(res, post);
    const markers = findMarkers(post);
    mailer.notifyNewDraft(post, { markers, ...urls }, store.getContent()).catch((err) => log.error('Email du brouillon non envoyé :', err.message));
    res.status(201).json({ id: post.id, slug: post.slug, ...urls, markers: markers.length });
  });

  router.patch('/:id', json, async (req, res) => {
    const post = store.getPost(req.params.id);
    if (!post) return res.status(404).json({ ok: false, errors: [{ field: '', message: 'Article introuvable.' }] });
    res.locals.postId = post.id;
    if (post.status !== 'draft') return res.status(409).json({ ok: false, errors: [{ field: 'status', message: 'Seuls les brouillons peuvent être modifiés par l’API.' }] });
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(422).json({ ok: false, errors: [{ field: '', message: 'Le corps de la requête doit être un objet JSON.' }] });
    }
    // Le brouillon complet (existant + modifications) doit respecter toutes les règles.
    const { status, ...changes } = body;
    const merged = { ...Object.fromEntries(EDITABLE.map((k) => [k, post[k]])), ...changes };
    const { values, errors } = validatePost(merged, { strict: true, unknownKeys: true });
    if (errors.length) return res.status(422).json({ ok: false, errors });
    const updated = await store.updatePost(post.id, { ...values, slug: uniqueSlug(values.slug || values.title, store.posts, post.id), status: 'draft' });
    res.json({ id: updated.id, slug: updated.slug, ...links(res, updated), markers: findMarkers(updated).length });
  });

  // Erreurs de lecture du corps (JSON invalide, plus de 200 Ko) au format JSON.
  // eslint-disable-next-line no-unused-vars
  router.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) log.error(err);
    const message = status === 413 ? 'Corps de requête trop volumineux (200 Ko maximum).' : status === 400 ? 'JSON invalide.' : 'Une erreur est survenue.';
    res.status(status).json({ ok: false, errors: [{ field: '', message }] });
  });

  return router;
}
