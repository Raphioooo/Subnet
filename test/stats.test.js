import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { Store } from '../src/store.js';
import { VisitStats, addDays, classifySource, dayKey, deviceOf, isHumanBrowser, pagePath, ranking } from '../src/stats.js';
import { localPath } from '../src/routes/public.js';

const PASSWORD = 'mot-de-passe-de-test';
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const silent = { info() {}, warn() {}, error() {} };

describe('statistiques : classement des visites', () => {
  test('provenance : moteurs, assistants, réseaux, campagnes, accès direct', () => {
    const own = 'subnet-online.com';
    assert.equal(classifySource({ referrer: 'https://www.google.fr/', ownHost: own }).source, 'google');
    assert.equal(classifySource({ referrer: 'https://gemini.google.com/app', ownHost: own }).source, 'gemini');
    assert.equal(classifySource({ referrer: 'android-app://com.google.android.gm/', ownHost: own }).source, 'email');
    assert.equal(classifySource({ referrer: 'https://chatgpt.com/', ownHost: own }).source, 'chatgpt');
    assert.equal(classifySource({ referrer: 'https://lnkd.in/abc', ownHost: own }).source, 'linkedin');
    assert.deepEqual(classifySource({ referrer: 'https://www.pagesjaunes.fr/x', ownHost: own }), { source: 'site', host: 'pagesjaunes.fr' });
    assert.equal(classifySource({ referrer: '', ownHost: own }).source, 'direct');
    assert.equal(classifySource({ utm: 'LinkedIn' }).source, 'linkedin');
    assert.deepEqual(classifySource({ utm: 'Prospection WhatsApp' }), { source: 'campagne', campaign: 'prospection-whatsapp' });
  });

  test('robots et outils écartés, appareils reconnus, pages filtrées', () => {
    assert.ok(isHumanBrowser(CHROME));
    assert.ok(isHumanBrowser(IPHONE));
    // Le navigateur DuckDuckGo est un vrai visiteur ; son robot, non.
    assert.ok(isHumanBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 DuckDuckGo/7 Safari/605.1.15'));
    for (const ua of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0) Chrome/116 Safari/537.36',
      'WhatsApp/2.23.20.0',
      'Mozilla/5.0 (compatible; DuckDuckBot-Https/1.1; https://duckduckgo.com/duckduckbot)',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/129.0 Safari/537.36',
      'curl/8.5.0',
      'node',
      '',
    ]) assert.equal(isHumanBrowser(ua), false, ua);
    assert.equal(deviceOf(IPHONE), 'mobile');
    assert.equal(deviceOf('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'), 'tablette');
    assert.equal(deviceOf(CHROME), 'ordinateur');
    assert.equal(pagePath('/blog/'), '/blog');
    assert.equal(pagePath('/'), '/');
    for (const p of ['/assets/css/site.css', '/admin', '/uploads/a.jpg', '/wp-login.php', `/${'x'.repeat(200)}`, '/\\autre-site.fr/x', '/a b']) assert.equal(pagePath(p), null, p);
    assert.equal(localPath('/\\autre-site.fr'), '');
    assert.equal(localPath('//autre-site.fr'), '');
    assert.equal(localPath('/offre/'), '/offre');
  });

  test('compteurs du jour, plafond par liste, conservation limitée et relecture du fichier', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-stats-'));
    let now = new Date('2026-10-21T10:00:00Z');
    const stats = new VisitStats(dir, { log: silent, now: () => now });
    await stats.init();
    stats.recordView({ path: '/', entry: true, source: 'google', host: 'google.fr', device: 'mobile' });
    stats.recordView({ path: '/offre' });
    stats.recordContact('/offre');
    for (let i = 0; i < 320; i += 1) stats.recordView({ path: `/page-${i}` });
    // Des noms hérités d'Object.prototype restent de simples compteurs.
    stats.recordView({ path: '/', entry: true, source: 'site', host: 'constructor', campaign: 'tostring' });
    stats.recordView({ path: '/', entry: true, source: 'site', host: 'toString' });
    const day = stats.summarize('2026-10-21', '2026-10-21');
    assert.equal(day.views, 324);
    assert.equal(day.visits, 3);
    assert.equal(day.referrers.constructor, 1);
    assert.equal(day.referrers.toString, 1);
    assert.equal(ranking(day.referrers).sum, 3);
    assert.equal(day.contacts, 1);
    assert.equal(day.sources.google, 1);
    assert.equal(day.devices.mobile, 1);
    assert.equal(Object.keys(day.paths).length, 301, 'au-delà de 300 pages, regroupées');
    assert.ok(day.paths['(autres)'] > 0);
    const top = ranking({ a: 3, b: 1 });
    assert.deepEqual(top.rows.map((r) => [r.key, r.share, r.width]), [['a', 0.75, 1], ['b', 0.25, 1 / 3]]);
    await stats.flush();
    stats.stop();

    // Relecture : les compteurs reviennent ; une valeur invalide est ignorée.
    const saved = JSON.parse(await fs.readFile(path.join(dir, 'stats.json'), 'utf8'));
    saved.days['2026-10-21'].views = 'beaucoup';
    saved.days['2025-01-01'] = { views: 5 };
    saved.startedAt = 'hier';
    await fs.writeFile(path.join(dir, 'stats.json'), JSON.stringify(saved));
    now = new Date('2026-10-22T10:00:00Z');
    const again = new VisitStats(dir, { log: silent, now: () => now });
    await again.init();
    again.stop();
    assert.equal(again.summarize('2026-10-21', '2026-10-21').views, 0);
    assert.equal(again.summarize('2026-10-21', '2026-10-21').visits, 3);
    assert.equal(again.summarize('2026-10-21', '2026-10-21').referrers.constructor, 1);
    assert.equal(again.days['2025-01-01'], undefined, 'jours de plus de treize mois supprimés');
    assert.equal(again.startedAt, '2026-10-21T12:00:00.000Z', 'date de départ illisible : plus ancien jour gardé');
    const weeks = again.series('2026-10-01', '2026-10-21', 'week');
    assert.equal(weeks.length, 3);
    assert.equal(weeks.at(-1).end, '2026-10-21');
    assert.equal(again.series('2026-08-15', '2026-10-21', 'month').length, 3);
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('politique de confidentialité d’un site existant mise à jour une seule fois', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-privacy-'));
    const body = 'Intro.\n\n## Données collectées\n\nFormulaire.\n\nLe site n’utilise aucun outil de mesure d’audience ni aucun cookie publicitaire.\n\n## Vos droits\n\nDroits.';
    await fs.writeFile(path.join(dir, 'content.json'), JSON.stringify({ meta: { version: 3 }, legal: { privacy: { title: 'Politique de confidentialité', published: true, body } } }));
    const store = new Store(dir, { seedProspects: false, log: silent });
    await store.init();
    const next = store.getContent().legal.privacy.body;
    assert.doesNotMatch(next, /aucun outil de mesure d’audience/);
    assert.match(next, /## Mesure d’audience[\s\S]+## Vos droits/);
    assert.match(next, /la page du site que vous consultiez juste avant/);
    // Un texte déjà réécrit par l'administrateur n'est pas modifié.
    await fs.writeFile(path.join(dir, 'content.json'), JSON.stringify({ meta: { version: 3 }, legal: { privacy: { title: 'Confidentialité', published: true, body: 'Mon texte.' } } }));
    const other = new Store(dir, { seedProspects: false, log: silent });
    await other.init();
    assert.equal(other.getContent().legal.privacy.body, 'Mon texte.');
    await fs.rm(dir, { recursive: true, force: true });
  });
});

describe('statistiques : mesure sur le site et page de l’admin', () => {
  let app;
  let server;
  let base;
  let dataDir;
  let cookie = '';
  const today = () => app.ctx.stats.summarize(dayKey(), dayKey());

  const get = async (pathname, { ua = CHROME, referer, headers = {}, auth = false } = {}) => {
    const h = { 'User-Agent': ua, ...headers };
    if (referer) h.Referer = referer;
    if (auth) h.Cookie = cookie;
    const res = await fetch(base + pathname, { headers: h, redirect: 'manual' });
    const text = await res.text();
    await new Promise((resolve) => setImmediate(resolve));
    return { res, text };
  };

  before(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-stats-app-'));
    const config = loadConfig({ NODE_ENV: 'test', DATA_DIR: dataDir, ADMIN_PASSWORD: PASSWORD, CONTACT_MIN_DELAY_MS: '0' });
    app = await createApp(config, { log: silent, seedProspects: false });
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
    const login = await fetch(`${base}/admin/connexion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: base },
      body: new URLSearchParams({ password: PASSWORD }),
      redirect: 'manual',
    });
    cookie = login.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  });

  after(async () => {
    app.ctx.stats.stop();
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  test('visites, pages vues, provenance, appareils et pages introuvables', async () => {
    await get('/');
    let day = today();
    assert.equal(day.views, 1);
    assert.equal(day.visits, 1);
    assert.equal(day.sources.direct, 1);
    assert.equal(day.entries['/'], 1);
    assert.equal(day.devices.ordinateur, 1);

    await get('/offre', { referer: `${base}/` });
    day = today();
    assert.equal(day.views, 2, 'page suivante de la même visite');
    assert.equal(day.visits, 1);

    await get('/secteurs/restaurateurs', { ua: IPHONE, referer: 'https://www.google.fr/' });
    await get('/?utm_source=linkedin');
    day = today();
    assert.equal(day.visits, 3);
    assert.equal(day.sources.google, 1);
    assert.equal(day.referrers['google.fr'], 1);
    assert.equal(day.sources.linkedin, 1);
    assert.equal(day.devices.mobile, 1);

    // Ni robots, ni fichiers, ni préchargements, ni administrateur connecté.
    await get('/', { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' });
    await get('/', { ua: 'node' });
    await get('/assets/css/site.css');
    await get('/faq', { headers: { 'Sec-Purpose': 'prefetch' } });
    await get('/realisations', { auth: true });
    assert.equal(today().views, 4);

    await get('/page-qui-n-existe-pas');
    assert.equal(today().notFound['/page-qui-n-existe-pas'], 1);
    assert.equal(today().views, 4);
  });

  test('une demande garde la page consultée juste avant le formulaire', async () => {
    const form = await get('/contact', { referer: `${base}/secteurs/restaurateurs` });
    assert.match(form.text, /name="from" value="\/secteurs\/restaurateurs"/);
    const token = form.text.match(/name="token" value="([^"]+)"/)[1];
    const res = await fetch(`${base}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: base, 'User-Agent': CHROME },
      body: new URLSearchParams({ type: 'devis', name: 'Camille Martin', email: 'camille@exemple.fr', message: 'Un site avec réservation pour mon restaurant.', source: 'contact', from: '/secteurs/restaurateurs', token, website: '' }),
      redirect: 'manual',
    });
    assert.equal(res.status, 303);
    const message = app.ctx.store.listMessages()[0];
    assert.equal(message.page, '/secteurs/restaurateurs');
    assert.equal(today().contacts, 1);
    assert.equal(today().contactFrom['/secteurs/restaurateurs'], 1);

    // Une adresse extérieure ou de l'admin n'est jamais retenue.
    const form2 = await get('/contact', { referer: 'https://exemple.fr/page' });
    assert.match(form2.text, /name="from" value=""/);

    const detail = await get('/admin/demandes', { auth: true });
    assert.match(detail.text, /après la page « Secteur · Restaurateurs »/);
  });

  test('page Statistiques, tableau de bord et politique de confidentialité', async () => {
    const page = await get('/admin/statistiques', { auth: true });
    assert.equal(page.res.status, 200);
    assert.match(page.text, /<h1>Statistiques<\/h1>/);
    assert.match(page.text, /href="\/admin\/statistiques"[^>]*aria-current="page"/);
    assert.match(page.text, /Visites par jour/);
    assert.match(page.text, /data-chart-col/);
    assert.match(page.text, /Secteur · Restaurateurs/);
    assert.match(page.text, /Google/);
    assert.match(page.text, /LinkedIn/);
    assert.match(page.text, /\/page-qui-n-existe-pas/);
    assert.match(page.text, /Afficher le tableau des chiffres/);
    for (const periode of ['7', '90', '365', 'inconnue']) {
      const res = await get(`/admin/statistiques?periode=${periode}`, { auth: true });
      assert.equal(res.res.status, 200, periode);
    }
    const anonymous = await fetch(`${base}/admin/statistiques`, { redirect: 'manual' });
    assert.equal(anonymous.status, 303);

    const dashboard = await get('/admin', { auth: true });
    assert.match(dashboard.text, /visites ces 7 derniers jours/);

    const privacy = await get('/confidentialite');
    assert.match(privacy.text, /Mesure d’audience/);
    assert.doesNotMatch(privacy.text, /aucun outil de mesure d’audience/);
  });

  test('les compteurs sont enregistrés sur disque', async () => {
    await app.ctx.stats.flush();
    const saved = JSON.parse(await fs.readFile(path.join(dataDir, 'stats.json'), 'utf8'));
    assert.equal(saved.days[dayKey()].visits, today().visits);
    assert.ok(saved.startedAt);
    assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  });
});
