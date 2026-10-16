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
      '/': 'Le site qui fait tourner votre activité.',
      '/offre': 'Un site complet, pensé pour votre activité.',
      '/secteurs': 'Pensé pour votre métier.',
      '/secteurs/restaurateurs': 'Vos tables se réservent, même en plein service.',
      '/secteurs/tatoueurs': 'Du projet à la séance, sans aller-retour.',
      '/secteurs/instituts': 'Votre agenda se remplit tout seul.',
      '/secteurs/tpe-pme': 'Du devis à l’acompte, tout se passe en ligne.',
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

  test('illustrations : parcours client, modules et réalisations', async () => {
    const sector = await (await request('/secteurs/tatoueurs')).text();
    assert.ok(sector.includes('Une demande claire, une séance confirmée.'));
    assert.ok(sector.includes('/assets/images/parcours/tatouage-demande.webp'));
    assert.ok(sector.includes('project-grid--single'));
    const offer = await (await request('/offre')).text();
    assert.equal(offer.match(/ step--media /g)?.length, 5);
    assert.ok(offer.includes('/assets/images/modules/horaires.webp'));
    const projects = await (await request('/realisations')).text();
    assert.equal(projects.match(/class="project-card__phone"/g)?.length, 4);
    for (const file of ['parcours/pme-suivi.webp', 'modules/horaires.webp']) {
      const res = await request(`/assets/images/${file}`);
      assert.equal(res.status, 200, file);
      assert.equal(res.headers.get('content-type'), 'image/webp');
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
    assert.ok(!sitemap.includes('/mentions-legales'), 'pages légales hors du plan du site');
    assert.equal((await request('/mentions-legales')).status, 200, 'mais toujours accessibles');
    assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    const robots = await (await request('/robots.txt')).text();
    assert.ok(robots.includes('Disallow: /admin'));
  });

  test('référencement : titre, description et un seul H1 par page', async () => {
    const c = app.ctx.store.getContent();
    const pages = [
      ['/', c.home.seo],
      ['/offre', c.offer.seo],
      ['/secteurs', c.sectorsPage.seo],
      ['/secteurs/tatoueurs', c.sectors.find((s) => s.slug === 'tatoueurs').seo],
      ['/realisations', c.projectsPage.seo],
      ['/faq', c.faqPage.seo],
      ['/contact', c.contact.page.seo],
      ['/creation-site-internet-grenoble', c.local.seo],
    ];
    for (const [url, seo] of pages) {
      // Espaces insécables de la typographie française ramenées à des espaces simples.
      const html = (await (await request(url)).text()).replace(/\u00a0/g, ' ');
      assert.equal(html.match(/<h1[\s>]/g)?.length, 1, `un seul H1 sur ${url}`);
      assert.ok(html.includes(`<title>${seo.title}</title>`), `title de ${url}`);
      assert.ok(html.includes(`<meta name="description" content="${seo.description}">`), `description de ${url}`);
      assert.ok(html.includes(`<meta property="og:title" content="${seo.title}">`), `og:title de ${url}`);
      assert.match(html, new RegExp(`<h1[^>]*>(<svg[\\s\\S]*?</svg>)?${seo.h1}</h1>`), `H1 de ${url}`);
      assert.ok(html.includes(`<meta property="og:site_name" content="${c.site.shareName}">`));
      // Seules les images vides de la visionneuse (remplies à l'ouverture) n'ont pas de description.
      const emptyAlt = (html.match(/<img[^>]*>/g) || []).filter((tag) => tag.includes('alt=""') && !tag.includes('data:image/gif'));
      assert.deepEqual(emptyAlt, [], `images sans description sur ${url}`);
    }
    const legal = await (await request('/mentions-legales')).text();
    assert.equal(legal.match(/<h1[\s>]/g)?.length, 1, 'un seul H1 sur les pages légales');
  });

  test('pages secteurs enrichies : plateforme, gestion, déroulé, FAQ et ancrage local', async () => {
    const sector = app.ctx.store.getContent().sectors.find((s) => s.slug === 'instituts');
    const html = (await (await request('/secteurs/instituts')).text()).replace(/[\u00a0\u202f]/g, ' ');
    for (const title of [sector.platform.title, sector.admin.title, sector.process.title, sector.faq.title]) {
      assert.ok(html.includes(title.replace(' – ', ' – ')), `section « ${title} »`);
    }
    assert.ok(html.includes('Isère'), 'paragraphe local');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
    assert.deepEqual(blocks.map((b) => b['@type']), ['Service', 'BreadcrumbList', 'FAQPage']);
    assert.equal(blocks[2].mainEntity.length, sector.faq.items.length);
  });

  test('page Grenoble : liée depuis l’accueil et le pied de page, dans le plan du site', async () => {
    const c = app.ctx.store.getContent();
    const html = await (await request('/creation-site-internet-grenoble')).text();
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
    assert.deepEqual(blocks.map((b) => b['@type']), ['Service', 'BreadcrumbList', 'FAQPage']);
    assert.equal(blocks[2].mainEntity.length, c.local.faq.items.length);
    const home = await (await request('/')).text();
    assert.equal(home.match(/href="\/creation-site-internet-grenoble"/g)?.length, 2, 'lien dans « Pour qui » et en pied de page');
    const sitemap = await (await request('/sitemap.xml')).text();
    assert.ok(sitemap.includes('/creation-site-internet-grenoble</loc>'));
  });

  test('fichiers statiques versionnés', async () => {
    const html = await (await request('/')).text();
    const css = html.match(/href="(\/assets\/css\/site\.css\?v=[a-f0-9]+)"/);
    assert.ok(css, 'lien CSS versionné');
    const res = await request(css[1]);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/css/);
    // Icône d'onglet versionnée : un nouveau logo s'affiche sans attendre l'expiration du cache.
    const ico = html.match(/href="(\/assets\/images\/favicon\.ico\?v=[a-f0-9]+)"/);
    assert.ok(ico, 'lien d’icône versionné');
    assert.equal((await request(ico[1])).status, 200);
  });
});

describe('formulaire de contact', () => {
  test('le formulaire propose les fonctionnalités', async () => {
    const html = await (await request('/contact')).text();
    assert.equal((html.match(/name="modules"/g) || []).length, 6);
    assert.ok(html.includes('Paiement d’acompte'));
  });

  test('envoi valide : message enregistré', async () => {
    const token = await contactToken();
    const body = new URLSearchParams({
      name: 'Camille Martin',
      email: 'Camille@Exemple.fr',
      phone: '06 12 34 56 78',
      company: 'Le Comptoir',
      sector: 'restaurateurs',
      message: 'Bonjour, je souhaite un site avec réservation pour mon restaurant.',
      token,
    });
    for (const value of ['0', '1', '1', '99', 'x']) body.append('modules', value);
    const res = await request('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), '/contact?envoye=1#formulaire');
    const [message] = app.ctx.store.listMessages();
    assert.equal(message.name, 'Camille Martin');
    assert.equal(message.email, 'camille@exemple.fr');
    assert.deepEqual(message.modules, ['Réservation en ligne', 'Paiement d’acompte']);
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

  test('formulaire rapide de l’accueil : question enregistrée', async () => {
    const html = await (await request('/')).text();
    const token = html.match(/name="token" value="([^"]+)"/)[1];
    const res = await request('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        type: 'contact',
        source: 'accueil',
        name: 'Paul Renaud',
        email: 'paul@example.com',
        company: '=1+1',
        modules: '0',
        message: 'Bonjour, quels sont vos délais habituels ?',
        token,
      }),
    });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), '/?envoye=1#contact');
    const saved = app.ctx.store.messages.find((m) => m.name === 'Paul Renaud');
    assert.equal(saved.type, 'contact');
    assert.equal(saved.source, 'accueil');
    assert.equal(saved.status, 'nouvelle');
    assert.deepEqual(saved.modules, [], 'pas de fonctionnalités pour une simple question');
    assert.ok((await (await request('/?envoye=1')).text()).includes('Message envoyé'));
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
    for (const pathname of ['/admin/demandes', '/admin/compte']) {
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
      null,
      { hours: [{ label: 'Lundi – vendredi', value: '9 h – 18 h' }, { label: '', value: '' }] },
      { socials: [{ network: 'instagram', url: 'instagram.com/subnet' }] },
      null,
      {
        eyebrow: 'Contact',
        title: 'Écrivez-nous.',
        intro: 'Intro',
        modulesLabel: 'Besoins',
        modules: ['Réservation', '', 'Acompte'],
        infoTitle: 'Coordonnées',
        success: 'Merci',
        privacy: 'Données protégées',
      },
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
    assert.deepEqual(content.contact.page.modules, ['Réservation', 'Acompte']);
    assert.ok(html.includes('href="tel:+33600000000"'));
  });

  test('référencement vide : titre et H1 automatiques', async () => {
    const res = await request('/admin/api/pages/faq', {
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: [{ title: '', description: '', h1: '' }, null, null] }),
    });
    assert.equal(res.status, 200);
    const html = await (await request('/faq')).text();
    assert.ok(html.includes('<title>Questions fréquentes · Subnet</title>'));
    assert.match(html, /<h1 class="display[^"]*">Questions fréquentes\.<\/h1>/);
    assert.ok(app.ctx.store.getContent().meta.sections.faq, 'date de modification de la page enregistrée');
  });

  test('plan du site : date de modification propre à chaque page', async () => {
    await app.ctx.store.updateContent((draft) => {
      draft.meta.sections = { offer: '2025-05-05T08:00:00.000Z', faq: '2026-01-02T08:00:00.000Z' };
    });
    const sitemap = await (await request('/sitemap.xml')).text();
    assert.match(sitemap, /\/offre<\/loc><lastmod>2025-05-05</);
    assert.match(sitemap, /\/faq<\/loc><lastmod>2026-01-02</);
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
      body: JSON.stringify({ sections: [null, null, null, { sectors: [...reordered, { slug: 'pirate', name: 'Pirate' }] }] }),
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

  test('demandes : liste, filtres, statut, note et export', async () => {
    const legacy = await request('/admin/messages', { auth: true });
    assert.equal(legacy.status, 301);
    assert.equal(legacy.headers.get('location'), '/admin/demandes');

    const list = await (await request('/admin/demandes', { auth: true })).text();
    assert.ok(list.includes('Camille Martin'));
    assert.ok(list.includes('Paul Renaud'));
    const questions = await (await request('/admin/demandes?type=contact', { auth: true })).text();
    assert.ok(questions.includes('Paul Renaud'));
    assert.ok(!questions.includes('Camille Martin'));
    const search = await (await request('/admin/demandes?q=comptoir', { auth: true })).text();
    assert.ok(search.includes('Camille Martin') && !search.includes('Paul Renaud'));

    const [message] = app.ctx.store.listMessages().filter((m) => m.name === 'Camille Martin');
    const form = (data) => ({
      method: 'POST',
      auth: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data),
    });
    const status = await request(`/admin/demandes/${message.id}/statut`, form({ status: 'en-cours', retour: '/admin/demandes?type=devis' }));
    assert.equal(status.status, 303);
    assert.equal(status.headers.get('location'), `/admin/demandes?type=devis#m-${message.id}`);
    const note = await request(`/admin/demandes/${message.id}/note`, form({ note: 'Rappeler mardi', retour: 'https://evil.example' }));
    assert.equal(note.headers.get('location'), `/admin/demandes#m-${message.id}`);
    const saved = app.ctx.store.messages.find((m) => m.id === message.id);
    assert.equal(saved.status, 'en-cours');
    assert.equal(saved.note, 'Rappeler mardi');
    assert.equal(saved.read, true);
    const enCours = await (await request('/admin/demandes?statut=en-cours', { auth: true })).text();
    assert.ok(enCours.includes('Camille Martin') && !enCours.includes('Paul Renaud'));

    const csv = await request('/admin/demandes/export.csv', { auth: true });
    assert.equal(csv.status, 200);
    assert.match(csv.headers.get('content-type'), /text\/csv/);
    const text = await csv.text();
    assert.ok(text.includes('"En cours"') && text.includes('"Rappeler mardi"'));
    assert.ok(text.includes(`"'=1+1"`), 'formule neutralisée');
  });

  test('demandes : lecture et suppression', async () => {
    const [message] = app.ctx.store.listMessages();
    const read = await request(`/admin/api/messages/${message.id}/read`, { method: 'POST', auth: true });
    assert.equal(read.status, 200);
    assert.equal(app.ctx.store.messages.find((m) => m.id === message.id).read, true);
    const before = app.ctx.store.messages.length;
    const del = await request(`/admin/demandes/${message.id}/supprimer`, { method: 'POST', auth: true });
    assert.equal(del.status, 303);
    assert.equal(app.ctx.store.messages.length, before - 1);
  });

  test('déconnexion', async () => {
    const res = await request('/admin/deconnexion', { method: 'POST', auth: true });
    assert.equal(res.status, 303);
    assert.match(res.headers.getSetCookie().join(';'), /subnet_session=;/);
  });
});
