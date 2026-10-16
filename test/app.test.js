import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';

const PASSWORD = 'mot-de-passe-de-test';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const silent = { info() {}, warn() {}, error() {} };

let server;
let base;
let app;
let dataDir;
let cookie = '';

async function request(pathname, { method = 'GET', headers = {}, body, auth = false, origin = true } = {}) {
  const h = { ...headers };
  if (origin && method !== 'GET') h.Origin = base;
  if (auth) h.Cookie = cookie;
  return fetch(base + pathname, { method, headers: h, body, redirect: 'manual' });
}

async function contactToken() {
  const html = await (await request('/contact')).text();
  return html.match(/name="token" value="([^"]+)"/)[1];
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-test-'));
  const config = loadConfig({
    NODE_ENV: 'test',
    DATA_DIR: dataDir,
    ADMIN_PASSWORD: PASSWORD,
    CONTACT_MIN_DELAY_MS: '0',
  });
  app = await createApp(config, { log: silent });
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(dataDir, { recursive: true, force: true });
});

describe('site public', () => {
  test('toutes les pages répondent', async () => {
    const pages = {
      '/': 'L’essentiel, magnifiquement présenté.',
      '/offre': 'Un site vitrine pensé comme un outil.',
      '/secteurs': 'Pensé pour votre métier.',
      '/secteurs/restaurateurs': 'Donnez envie de pousser la porte.',
      '/secteurs/tatoueurs': 'Un portfolio à la hauteur de votre style.',
      '/secteurs/instituts': 'L’expérience commence dès votre site.',
      '/secteurs/tpe-pme': 'Une image à la hauteur de votre sérieux.',
      '/realisations': 'Maison Olive',
      '/faq': 'Questions fréquentes.',
      '/contact': 'Parlons de votre projet.',
      '/mentions-legales': 'Mentions légales',
      '/confidentialite': 'Politique de confidentialité',
      '/cookies': 'Politique de cookies',
      '/conditions-generales': 'Conditions générales',
    };
    for (const [pathname, expected] of Object.entries(pages)) {
      const res = await request(pathname);
      assert.equal(res.status, 200, pathname);
      const html = await res.text();
      assert.ok(html.includes(expected), `${pathname} contient « ${expected} »`);
    }
  });

  test('page inconnue : 404', async () => {
    assert.equal((await request('/nexiste-pas')).status, 404);
    assert.equal((await request('/secteurs/inconnu')).status, 404);
  });

  test('en-têtes de sécurité', async () => {
    const res = await request('/');
    assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-powered-by'), null);
  });

  test('typographie française appliquée', async () => {
    const html = await (await request('/faq')).text();
    assert.ok(html.includes('À qui s’adresse cette offre ?'));
  });

  test('sitemap et robots', async () => {
    const sitemap = await (await request('/sitemap.xml')).text();
    assert.ok(sitemap.includes('/secteurs/tatoueurs'));
    assert.ok(sitemap.includes('/mentions-legales'));
    const robots = await (await request('/robots.txt')).text();
    assert.ok(robots.includes('Disallow: /admin'));
  });

  test('fichiers statiques versionnés', async () => {
    const html = await (await request('/')).text();
    const css = html.match(/href="(\/assets\/css\/site\.css\?v=[a-f0-9]+)"/);
    assert.ok(css, 'lien CSS versionné');
    const res = await request(css[1]);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/css/);
  });
});

describe('formulaire de contact', () => {
  test('envoi valide : message enregistré', async () => {
    const token = await contactToken();
    const res = await request('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: 'Camille Martin',
        email: 'Camille@Exemple.fr',
        phone: '06 12 34 56 78',
        company: 'Le Comptoir',
        sector: 'restaurateurs',
        message: 'Bonjour, je souhaite un site pour mon restaurant.',
        token,
      }),
    });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), '/contact?envoye=1#formulaire');
    const [message] = app.ctx.store.listMessages();
    assert.equal(message.name, 'Camille Martin');
    assert.equal(message.email, 'camille@exemple.fr');
    assert.equal(message.read, false);
    const confirmation = await (await request('/contact?envoye=1')).text();
    assert.ok(confirmation.includes('Message envoyé'));
  });

  test('champs invalides : erreurs affichées', async () => {
    const token = await contactToken();
    const res = await request('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: 'A', email: 'pas-un-email', message: 'Court', token }),
    });
    assert.equal(res.status, 400);
    const html = await res.text();
    assert.ok(html.includes('Indiquez une adresse email valide.'));
    assert.ok(html.includes('Décrivez votre projet en quelques mots.'));
  });

  test('robots : champ piège et jeton invalide', async () => {
    const before = app.ctx.store.messages.length;
    const token = await contactToken();
    const trap = await request('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: 'Robot', email: 'robot@spam.io', message: 'Achetez mes produits !', website: 'http://spam', token }),
    });
    assert.equal(trap.status, 303);
    const forged = await request('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: 'Robot', email: 'robot@spam.io', message: 'Achetez mes produits !', token: '123.faux' }),
    });
    assert.equal(forged.status, 400);
    assert.equal(app.ctx.store.messages.length, before);
  });
});

describe('administration', () => {
  test('accès protégé', async () => {
    const res = await request('/admin');
    assert.equal(res.status, 303);
    assert.match(res.headers.get('location'), /^\/admin\/connexion/);
    const api = await request('/admin/api/pages/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(api.status, 401);
  });

  test('connexion', async () => {
    const wrong = await request('/admin/connexion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password: 'mauvais' }),
    });
    assert.equal(wrong.status, 401);
    const ok = await request('/admin/connexion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password: PASSWORD }),
    });
    assert.equal(ok.status, 303);
    const setCookie = ok.headers.getSetCookie().find((c) => c.startsWith('subnet_session='));
    assert.ok(setCookie, 'cookie de session');
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    cookie = setCookie.split(';')[0];
    const dashboard = await request('/admin', { auth: true });
    assert.equal(dashboard.status, 200);
    assert.ok((await dashboard.text()).includes('Tableau de bord'));
  });

  test('toutes les pages de l’administration s’affichent', async () => {
    for (const id of ['general', 'home', 'offer', 'sectors', 'projects', 'faq', 'contact', 'legal']) {
      const res = await request(`/admin/pages/${id}`, { auth: true });
      assert.equal(res.status, 200, id);
    }
    for (const pathname of ['/admin/messages', '/admin/compte']) {
      assert.equal((await request(pathname, { auth: true })).status, 200, pathname);
    }
  });

  test('requête d’un autre site refusée', async () => {
    const res = await request('/admin/api/pages/contact', {
      method: 'POST',
      auth: true,
      origin: false,
      headers: { 'Content-Type': 'application/json', Origin: 'https://site-malveillant.example' },
      body: '{}',
    });
    assert.equal(res.status, 403);
  });

  test('enregistrement d’une page et affichage public', async () => {
    const sections = [
      { email: 'bonjour@subnet.fr', phone: '06 00 00 00 00', address: '1 rue de Paris\n75001 Paris', area: 'France entière' },
      { hours: [{ label: 'Lundi – vendredi', value: '9 h – 18 h' }, { label: '', value: '' }] },
      { socials: [{ network: 'instagram', url: 'instagram.com/subnet' }] },
      { eyebrow: 'Contact', title: 'Écrivez-nous.', intro: 'Intro', infoTitle: 'Coordonnées', success: 'Merci', privacy: 'Données protégées' },
    ];
    const res = await request('/admin/api/pages/contact', {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections }),
    });
    assert.equal(res.status, 200);
    const content = app.ctx.store.getContent();
    assert.equal(content.contact.hours.length, 1, 'ligne vide ignorée');
    assert.equal(content.contact.socials[0].url, 'https://instagram.com/subnet');
    const html = await (await request('/contact')).text();
    assert.ok(html.includes('bonjour@subnet.fr'));
    assert.ok(html.includes('Écrivez-nous.'));
    assert.ok(html.includes('href="tel:+33600000000"'));
  });

  test('données invalides refusées', async () => {
    const res = await request('/admin/api/pages/general', {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: [{ name: '' }, { url: 'javascript:alert(1)' }] }),
    });
    assert.equal(res.status, 400);
    const { errors } = await res.json();
    assert.equal(errors.length, 2);
    assert.equal(app.ctx.store.getContent().site.name, 'Subnet');
  });

  test('les secteurs ne peuvent être ni ajoutés ni supprimés', async () => {
    const sectors = app.ctx.store.getContent().sectors;
    const reordered = [sectors[1], sectors[0]].map((s) => ({ ...s, name: `${s.name} (modifié)` }));
    const res = await request('/admin/api/pages/sectors', {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: [null, null, { sectors: [...reordered, { slug: 'pirate', name: 'Pirate' }] }] }),
    });
    assert.equal(res.status, 200);
    const saved = app.ctx.store.getContent().sectors;
    assert.deepEqual(saved.map((s) => s.slug), ['tatoueurs', 'restaurateurs', 'instituts', 'tpe-pme']);
    assert.ok(saved[0].name.endsWith('(modifié)'));
  });

  test('envoi d’image', async () => {
    const res = await request('/admin/api/upload', {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'image/png' },
      body: PNG,
    });
    assert.equal(res.status, 200);
    const { url } = await res.json();
    assert.match(url, /^\/uploads\/[a-z0-9-]+\.png$/);
    const image = await request(url);
    assert.equal(image.status, 200);
    assert.match(image.headers.get('content-type'), /image\/png/);

    const bad = await request('/admin/api/upload', {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'image/png' },
      body: Buffer.from('<svg onload="alert(1)"></svg>'),
    });
    assert.equal(bad.status, 400);
  });

  test('sauvegarde et restauration', async () => {
    const backup = await request('/admin/sauvegarde', { auth: true });
    assert.equal(backup.status, 200);
    const data = await backup.json();
    data.content.home.hero.title = 'Titre restauré.';
    const res = await request('/admin/api/import', {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    assert.equal(res.status, 200);
    assert.ok((await (await request('/')).text()).includes('Titre restauré.'));
  });

  test('messages : lecture et suppression', async () => {
    const [message] = app.ctx.store.listMessages();
    const read = await request(`/admin/api/messages/${message.id}/read`, { method: 'POST', auth: true });
    assert.equal(read.status, 200);
    assert.equal(app.ctx.store.messages.find((m) => m.id === message.id).read, true);
    const del = await request(`/admin/messages/${message.id}/supprimer`, { method: 'POST', auth: true });
    assert.equal(del.status, 303);
    assert.equal(app.ctx.store.messages.length, 0);
  });

  test('déconnexion', async () => {
    const res = await request('/admin/deconnexion', { method: 'POST', auth: true });
    assert.equal(res.status, 303);
    assert.match(res.headers.getSetCookie().join(';'), /subnet_session=;/);
  });
});
