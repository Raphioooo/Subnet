import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { findMarkers, uniqueSlug, validatePost } from '../src/posts.js';
import { renderMarkdown } from '../src/markdown.js';

const PASSWORD = 'mot-de-passe-de-test';
const API_KEY = 'cle-de-test-0123456789abcdef';
const silent = { info() {}, warn() {}, error() {} };

let server;
let base;
let app;
let dataDir;
let cookie = '';

const article = (overrides = {}) => ({
  topicId: 'T99',
  title: 'Réservation en ligne : le guide pour les restaurateurs',
  metaTitle: 'Réservation en ligne restaurant : le guide | Subnet',
  metaDescription:
    'Comment proposer la réservation en ligne dans votre restaurant : outils, acompte, rappels et données clients. Des conseils concrets pour bien choisir.',
  excerpt: 'Tout ce qu’il faut savoir pour proposer la réservation en ligne dans votre restaurant.',
  category: 'restaurants',
  tags: ['réservation', 'restaurant'],
  targetKeyword: 'réservation en ligne restaurant',
  content: '## Pourquoi proposer la réservation en ligne ?\n\nParce que vos clients réservent le soir.\n\n## Combien ça coûte ?\n\n| Option | Coût |\n| --- | --- |\n| Plateforme | Commission |\n| Votre site | Abonnement |\n\n[À COMPLÉTER : exemple réel d’un client]',
  faq: [{ question: 'Faut-il un acompte ?', answer: 'Pour les groupes, c’est conseillé.' }],
  coverAlt: null,
  ...overrides,
});

async function request(pathname, { method = 'GET', headers = {}, body, auth = false, origin = true, key } = {}) {
  const h = { ...headers };
  if (origin && method !== 'GET') h.Origin = base;
  if (auth) h.Cookie = cookie;
  if (key) h.Authorization = `Bearer ${key}`;
  return fetch(base + pathname, { method, headers: h, body, redirect: 'manual' });
}

const api = (pathname, { method = 'GET', data, key = API_KEY } = {}) =>
  request(`/api/admin/posts${pathname}`, {
    method,
    key,
    origin: false,
    headers: data === undefined ? {} : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : typeof data === 'string' ? data : JSON.stringify(data),
  });

const admin = (pathname, data) =>
  request(`/admin/api/articles${pathname}`, {
    method: 'POST',
    auth: true,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-blog-'));
  const config = loadConfig({ NODE_ENV: 'test', DATA_DIR: dataDir, ADMIN_PASSWORD: PASSWORD, BLOG_API_KEY: API_KEY, BASE_URL: 'https://subnet-online.com' });
  app = await createApp(config, { log: silent });
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
  const res = await request('/admin/connexion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ password: PASSWORD }),
  });
  cookie = res.headers.getSetCookie().find((c) => c.startsWith('subnet_session=')).split(';')[0];
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(dataDir, { recursive: true, force: true });
});

describe('modèle des articles', () => {
  test('validation stricte des longueurs et des enums', () => {
    const { errors } = validatePost(article({ metaTitle: 'x'.repeat(61), metaDescription: 'trop court', category: 'autre', tags: Array(7).fill('t').map((t, i) => t + i) }));
    const fields = errors.map((e) => e.field);
    for (const f of ['metaTitle', 'metaDescription', 'category', 'tags']) assert.ok(fields.includes(f), f);
  });

  test('HTML et liens javascript: refusés', () => {
    assert.ok(validatePost(article({ content: 'Texte <script>alert(1)</script>' })).errors.some((e) => e.field === 'content'));
    assert.ok(validatePost(article({ content: '[clic](javascript:alert(1))' })).errors.some((e) => e.field === 'content'));
  });

  test('image de couverture sans texte alternatif refusée', () => {
    assert.ok(validatePost(article({ coverImage: '/uploads/a.webp', coverAlt: '' })).errors.some((e) => e.field === 'coverAlt'));
  });

  test('marqueurs, adresses uniques et tableaux', () => {
    assert.equal(findMarkers(article()).length, 1);
    assert.equal(uniqueSlug('Mon article', [{ id: 'a', slug: 'mon-article' }]), 'mon-article-2');
    assert.equal(uniqueSlug('Mon article', [{ id: 'a', slug: 'mon-article' }, { id: 'b', slug: 'mon-article-2' }]), 'mon-article-3');
    const html = renderMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |');
    assert.match(html, /<table>.*<th>A<\/th>.*<td>2<\/td>/s);
  });
});

describe('API de brouillons', () => {
  let created;

  test('clé absente ou invalide : 401', async () => {
    assert.equal((await api('', { key: '' })).status, 401);
    assert.equal((await api('', { key: 'mauvaise-cle' })).status, 401);
    assert.equal((await api('', { method: 'POST', data: article(), key: 'mauvaise-cle' })).status, 401);
  });

  test('création d’un brouillon : 201, statut forcé à draft', async () => {
    const res = await api('', { method: 'POST', data: article({ status: 'published' }) });
    assert.equal(res.status, 201);
    created = await res.json();
    assert.equal(created.slug, 'reservation-en-ligne-le-guide-pour-les-restaurateurs');
    assert.equal(created.previewUrl, `https://subnet-online.com/blog/${created.slug}?preview`);
    assert.equal(created.adminUrl, `https://subnet-online.com/admin/articles/${created.id}`);
    const post = app.ctx.store.getPost(created.id);
    assert.equal(post.status, 'draft');
    assert.equal(post.source, 'api');
  });

  test('payload invalide : 422 avec le détail', async () => {
    const res = await api('', { method: 'POST', data: article({ topicId: 'T98', metaDescription: 'court', inconnu: 1 }) });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(body.errors.some((e) => e.field === 'metaDescription'));
    assert.ok(body.errors.some((e) => e.field === 'inconnu'));
    assert.equal((await api('', { method: 'POST', data: '{json' })).status, 400);
  });

  test('sujet déjà traité refusé, collision d’adresse suffixée -2', async () => {
    assert.equal((await api('', { method: 'POST', data: article() })).status, 422);
    const res = await api('', { method: 'POST', data: article({ topicId: 'T97' }) });
    assert.equal(res.status, 201);
    assert.equal((await res.json()).slug, 'reservation-en-ligne-le-guide-pour-les-restaurateurs-2');
  });

  test('liste légère pour éviter les doublons', async () => {
    const res = await api('?fields=slug,title,targetKeyword,topicId,status');
    assert.equal(res.status, 200);
    const { posts } = await res.json();
    const mine = posts.find((p) => p.id === created.id);
    assert.deepEqual(Object.keys(mine).sort(), ['id', 'slug', 'status', 'targetKeyword', 'title', 'topicId']);
    assert.ok(!('content' in mine));
  });

  test('modification d’un brouillon, refusée hors brouillon', async () => {
    const res = await api(`/${created.id}`, { method: 'PATCH', data: { excerpt: 'Nouveau résumé.', status: 'published' } });
    assert.equal(res.status, 200);
    assert.equal(app.ctx.store.getPost(created.id).excerpt, 'Nouveau résumé.');
    assert.equal(app.ctx.store.getPost(created.id).status, 'draft');
    const other = app.ctx.store.listPosts().find((p) => p.topicId === 'T97');
    await app.ctx.store.updatePost(other.id, { status: 'published', publishedAt: new Date().toISOString() });
    assert.equal((await api(`/${other.id}`, { method: 'PATCH', data: { excerpt: 'x' } })).status, 409);
    await app.ctx.store.updatePost(other.id, { status: 'draft', publishedAt: null });
  });

  test('aucun endpoint ne publie, chaque appel est journalisé', async () => {
    assert.equal((await api(`/${created.id}`, { method: 'PUT', data: {} })).status, 404);
    const log = await fs.readFile(path.join(dataDir, 'blog-api.log'), 'utf8');
    assert.ok(log.trim().split('\n').length >= 5);
    assert.ok(!log.includes(API_KEY));
  });

  test('corps de plus de 200 Ko refusé', async () => {
    const res = await api('', { method: 'POST', data: article({ topicId: 'T96', content: 'x'.repeat(210 * 1024) }) });
    assert.equal(res.status, 413);
  });
});

describe('blog public et administration', () => {
  let post;

  before(() => {
    post = app.ctx.store.listPosts().find((p) => p.topicId === 'T99');
  });

  test('brouillon invisible au public, aperçu pour l’admin', async () => {
    assert.equal((await request(`/blog/${post.slug}`)).status, 404);
    assert.equal((await request(`/blog/${post.slug}?preview`)).status, 404);
    const res = await request(`/blog/${post.slug}?preview`, { auth: true });
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /<meta name="robots" content="noindex">/);
    assert.ok(!(await (await request('/blog')).text()).includes(post.title));
  });

  test('publication bloquée par les marqueurs', async () => {
    const res = await admin(`/${post.id}`, { action: 'publish', post });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.errors.some((e) => e.includes('[À COMPLÉTER]')));
    assert.equal(app.ctx.store.getPost(post.id).status, 'draft');
  });

  test('publication après avoir rempli les marqueurs', async () => {
    const content = post.content.replace(/\[À COMPLÉTER[^\]]*\]/, 'Un vrai exemple.');
    const res = await admin(`/${post.id}`, { action: 'publish', post: { ...post, content } });
    assert.equal(res.status, 200);
    assert.equal(app.ctx.store.getPost(post.id).status, 'published');
  });

  test('article publié : balises, sommaire, FAQ, CTA et JSON-LD valide', async () => {
    const res = await request(`/blog/${post.slug}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /<title>Réservation en ligne restaurant : le guide \| Subnet<\/title>/);
    assert.match(html, /<link rel="canonical" href="https:\/\/subnet-online.com\/blog\/reservation-en-ligne/);
    assert.match(html, /<meta property="og:type" content="article">/);
    assert.match(html, /article:published_time/);
    assert.match(html, /<h1[^>]*>Réservation en ligne : le guide pour les restaurateurs<\/h1>/);
    assert.match(html, /href="#pourquoi-proposer-la-reservation-en-ligne"/);
    assert.match(html, /Parlons de votre projet/);
    assert.match(html, /href="\/secteurs\/restaurateurs"/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
    const types = blocks.map((b) => b['@type']);
    assert.deepEqual(types, ['BlogPosting', 'BreadcrumbList', 'FAQPage']);
    const posting = blocks[0];
    assert.equal(posting.author.name, 'Raphaël Scotton');
    assert.equal(posting.publisher['@id'], 'https://subnet-online.com/#business');
    assert.equal(blocks[1].itemListElement.length, 4);
    // CSP : aucun script inline ajouté (hors données structurées et script haché existant).
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/g)];
    assert.equal(inline.length, 1);
  });

  test('liste, catégorie, menu, sitemap et RSS', async () => {
    const list = await (await request('/blog')).text();
    assert.match(list, /<title>Blog : conseils site internet pour pros \| Subnet<\/title>/);
    assert.ok(list.includes(post.title));
    assert.match(list, /<a href="\/blog"/);
    assert.equal((await request('/blog/categorie/restaurants')).status, 200);
    assert.equal((await request('/blog/categorie/inconnue')).status, 404);
    assert.equal((await request('/blog?page=9')).status, 404);
    const sitemap = await (await request('/sitemap.xml')).text();
    assert.ok(sitemap.includes('<loc>https://subnet-online.com/blog</loc>'));
    assert.ok(sitemap.includes(`<loc>https://subnet-online.com/blog/${post.slug}</loc><lastmod>${app.ctx.store.getPost(post.id).updatedAt.slice(0, 10)}</lastmod>`));
    const drafts = app.ctx.store.posts.filter((p) => p.status === 'draft');
    for (const d of drafts) assert.ok(!sitemap.includes(`/blog/${d.slug}<`));
    const rss = await (await request('/blog/rss.xml')).text();
    assert.ok(rss.includes(`<link>https://subnet-online.com/blog/${post.slug}</link>`));
  });

  test('publication programmée', async () => {
    const other = app.ctx.store.listPosts().find((p) => p.topicId === 'T97');
    const content = other.content.replace(/\[À COMPLÉTER[^\]]*\]/, 'Exemple.');
    const past = await admin(`/${other.id}`, { action: 'schedule', post: { ...other, content }, scheduledAt: new Date(Date.now() - 1000).toISOString() });
    assert.equal(past.status, 400);
    const res = await admin(`/${other.id}`, { action: 'schedule', post: { ...other, content }, scheduledAt: new Date(Date.now() + 60_000).toISOString() });
    assert.equal(res.status, 200);
    assert.equal((await request(`/blog/${other.slug}`)).status, 404);
    await app.ctx.store.publishDue(Date.now() + 120_000);
    assert.equal(app.ctx.store.getPost(other.id).status, 'published');
  });

  test('dépublication et pages admin', async () => {
    const res = await admin(`/${post.id}`, { action: 'unpublish', post: app.ctx.store.getPost(post.id) });
    assert.equal(res.status, 200);
    assert.equal((await request(`/blog/${post.slug}`)).status, 404);
    const list = await request('/admin/articles', { auth: true });
    assert.equal(list.status, 200);
    const html = await list.text();
    assert.match(html, /tag--api/);
    assert.ok(html.includes('Commission TheFork restaurant'), 'article de démonstration');
    const editor = await request(`/admin/articles/${post.id}`, { auth: true });
    assert.equal(editor.status, 200);
    assert.equal((await request('/admin/articles/nouveau', { auth: true })).status, 200);
    assert.equal((await request('/admin/articles')).status, 303);
  });

  test('création et suppression depuis l’admin', async () => {
    const res = await admin('', { action: 'save', post: { title: 'Brouillon manuel', category: 'guides' } });
    assert.equal(res.status, 200);
    const { post: created } = await res.json();
    assert.equal(app.ctx.store.getPost(created.id).source, 'manual');
    const del = await request(`/admin/articles/${created.id}/supprimer`, { method: 'POST', auth: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: '' });
    assert.equal(del.status, 303);
    assert.equal(app.ctx.store.getPost(created.id), null);
  });
});
