import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTokens, renderMarkdown } from '../src/markdown.js';
import { sanitizeObject } from '../src/sanitize.js';
import { cleanUrl, formatPhone, frenchTypography, organizationJsonLd, phoneE164, sectorJsonLd, telHref } from '../src/helpers.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Store, mergeDefaults } from '../src/store.js';
import { Auth } from '../src/auth.js';
import { detectImage } from '../src/routes/admin.js';
import { defaults } from '../src/defaults.js';

describe('markdown', () => {
  test('le HTML saisi est neutralisé', () => {
    const html = renderMarkdown('<script>alert(1)</script> **gras**');
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('<strong>gras</strong>'));
  });

  test('seuls les liens sûrs sont conservés', () => {
    assert.ok(renderMarkdown('[ok](https://exemple.fr)').includes('href="https://exemple.fr"'));
    assert.ok(renderMarkdown('[ok](/contact)').includes('href="/contact"'));
    assert.ok(!renderMarkdown('[piège](javascript:alert(1))').includes('href'));
    assert.ok(!renderMarkdown('[piège](//evil.example)').includes('href'));
  });

  test('titres, listes et emails', () => {
    const html = renderMarkdown('## Titre\n\n- un\n- deux\n\nÉcrire à contact@exemple.fr');
    assert.ok(html.includes('<h2>Titre</h2>'));
    assert.ok(html.includes('<ul><li>un</li><li>deux</li></ul>'));
    assert.ok(html.includes('<a href="mailto:contact@exemple.fr">contact@exemple.fr</a>'));
  });
});

describe('balises des pages légales', () => {
  test('remplacement, ligne facultative supprimée, valeur manquante signalée', () => {
    const out = applyTokens('Nom : {{entreprise}}\nTVA : {{tva}}\nSIRET : {{siret}}', { entreprise: 'Subnet', tva: '', siret: '' }, new Set(['tva']));
    assert.equal(out, 'Nom : Subnet\nSIRET : ⟦à compléter⟧');
    assert.ok(renderMarkdown(out).includes('<mark class="todo">à compléter</mark>'));
  });
});

describe('validation des champs', () => {
  const fields = [
    { key: 'title', type: 'text', label: 'Titre', required: true, max: 10 },
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'link', type: 'link', label: 'Lien' },
    { key: 'image', type: 'image', label: 'Image' },
    { key: 'items', type: 'list', label: 'Liste', maxItems: 2 },
  ];

  test('nettoyage et limites', () => {
    const ctx = { errors: [], trail: [] };
    const out = sanitizeObject(
      fields,
      { title: '  Un titre beaucoup trop long  ', email: 'A@B.FR', link: 'exemple.fr', image: '', items: ['a', '', 'b', 'c'] },
      {},
      ctx,
    );
    assert.deepEqual(ctx.errors, []);
    assert.equal(out.title, 'Un titre b');
    assert.equal(out.email, 'a@b.fr');
    assert.equal(out.link, 'https://exemple.fr');
    assert.deepEqual(out.items, ['a', 'b']);
  });

  test('valeurs dangereuses refusées', () => {
    const ctx = { errors: [], trail: [] };
    sanitizeObject(fields, { title: '', email: 'x', link: 'javascript:alert(1)', image: '/uploads/../../etc/passwd' }, {}, ctx);
    assert.equal(ctx.errors.length, 4);
  });
});

describe('utilitaires', () => {
  test('typographie française', () => {
    assert.equal(frenchTypography('Pourquoi ? Voici : « oui » !'), 'Pourquoi ? Voici : « oui » !');
    assert.equal(frenchTypography('https://exemple.fr'), 'https://exemple.fr');
  });

  test('liens téléphone', () => {
    assert.equal(telHref('06 12 34 56 78'), 'tel:+33612345678');
    assert.equal(telHref('+32 2 123 45 67'), 'tel:+3221234567');
    assert.equal(telHref('+33 7 66 65 35 09'), 'tel:+33766653509');
  });

  test('téléphone lisible et format international', () => {
    assert.equal(formatPhone('0766653509'), '07 66 65 35 09');
    assert.equal(formatPhone('+33 7 66 65 35 09'), '07 66 65 35 09');
    assert.equal(formatPhone('0033766653509'), '07 66 65 35 09');
    assert.equal(formatPhone('+32 2 123 45 67'), '+32 2 123 45 67', 'numéro étranger inchangé');
    assert.equal(phoneE164('07 66 65 35 09'), '+33766653509');
  });

  test('liens de réseaux sociaux sans paramètres de suivi', () => {
    assert.equal(
      cleanUrl('https://www.linkedin.com/in/raphael-scotton-a86297418/?isSelfProfile=true'),
      'https://www.linkedin.com/in/raphael-scotton-a86297418/',
    );
    assert.equal(cleanUrl('https://www.instagram.com/subnet/?igsh=abc&utm_source=x&hl=fr'), 'https://www.instagram.com/subnet/?hl=fr');
    assert.equal(cleanUrl('pas une adresse'), 'pas une adresse');
  });

  test('données structurées de l’entreprise et des secteurs', () => {
    const c = structuredClone(defaults);
    c.contact.phone = '0766653509';
    c.contact.postalCode = '38000';
    c.contact.socials = [{ network: 'linkedin', url: 'https://www.linkedin.com/in/exemple/?isSelfProfile=true' }];
    const org = organizationJsonLd(c, 'https://exemple.fr');
    assert.equal(org['@id'], 'https://exemple.fr/#business');
    assert.equal(org.telephone, '+33766653509');
    assert.deepEqual(org.address, {
      '@type': 'PostalAddress',
      addressLocality: 'Grenoble',
      postalCode: '38000',
      addressRegion: 'Auvergne-Rhône-Alpes',
      addressCountry: 'FR',
    });
    assert.deepEqual(org.areaServed.map((a) => a['@type']), ['City', 'AdministrativeArea', 'AdministrativeArea', 'Country']);
    assert.deepEqual(org.sameAs, ['https://www.linkedin.com/in/exemple/']);
    assert.equal(org.logo, 'https://exemple.fr/assets/images/logo-512.png');
    assert.equal(org.founder.name, 'Raphaël Scotton');
    const [service, breadcrumb] = sectorJsonLd(c, c.sectors[0], 'https://exemple.fr');
    assert.equal(service['@type'], 'Service');
    assert.equal(service.provider['@id'], org['@id']);
    assert.deepEqual(breadcrumb.itemListElement.map((i) => i.item), [
      'https://exemple.fr/',
      'https://exemple.fr/secteurs',
      'https://exemple.fr/secteurs/restaurateurs',
    ]);
  });

  test('fusion avec les valeurs par défaut', () => {
    const merged = mergeDefaults({ a: 1, b: { c: 2, d: 3 }, list: [1], when: null }, { b: { c: 5 }, list: [], extra: true, when: '2026' });
    assert.deepEqual(merged, { a: 1, b: { c: 5, d: 3 }, list: [], when: '2026' });
  });

  test('migration des contenus de la première version', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-migration-'));
    await fs.writeFile(
      path.join(dir, 'content.json'),
      JSON.stringify({
        meta: { version: 1 },
        site: { name: 'Mon Studio', tagline: 'Sites vitrines' },
        contact: { email: 'bonjour@studio.fr', page: { title: 'Ancien titre' } },
        home: { hero: { title: 'L’essentiel, magnifiquement présenté.' } },
        legal: { identity: { siret: '123' } },
      }),
    );
    const store = new Store(dir);
    await store.init();
    const content = store.getContent();
    assert.equal(content.meta.version, defaults.meta.version);
    assert.equal(content.site.name, 'Mon Studio');
    assert.equal(content.contact.email, 'bonjour@studio.fr');
    assert.equal(content.legal.identity.siret, '123');
    assert.equal(content.home.hero.title, 'Le site qui fait tourner votre activité.');
    assert.ok(content.site.tagline.includes('réservation'));
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('migration de la version 2 : référencement local', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-seo-'));
    const file = path.join(dir, 'content.json');
    await fs.writeFile(
      file,
      JSON.stringify({
        meta: { version: 2, updatedAt: '2026-01-01T10:00:00.000Z' },
        site: {
          name: 'Subnet',
          description:
            'Sites sur mesure avec réservation en ligne, acompte, devis, gestion des horaires et panneau d’administration, pour restaurateurs, tatoueurs, instituts, TPE et PME.',
        },
        contact: { email: 'hello@exemple.fr', phone: '0766653509', area: 'Région AURA / Toute la France via zoom' },
        home: { hero: { eyebrow: 'Mon surtitre', title: 'Mon slogan.' } },
      }),
    );
    const store = new Store(dir);
    await store.init();
    const content = store.getContent();
    assert.ok(content.site.description.includes('Grenoble'), 'description d’origine remplacée');
    assert.equal(content.contact.area, defaults.contact.area);
    assert.equal(content.contact.email, 'hello@exemple.fr');
    assert.equal(content.home.hero.title, 'Mon slogan.', 'textes personnalisés conservés');
    assert.equal(content.home.seo.h1, defaults.home.seo.h1);
    assert.equal(content.sectors[0].seo.title, defaults.sectors[0].seo.title);
    assert.ok(content.meta.sections.home > '2026-01-01', 'date de modification des pages mise à jour');
    const saved = JSON.parse(await fs.readFile(file, 'utf8'));
    assert.equal(saved.meta.version, defaults.meta.version, 'migration enregistrée une seule fois');
    const original = JSON.parse(await fs.readFile(`${file}.v2.bak`, 'utf8'));
    assert.equal(original.meta.version, 2, 'version précédente gardée de côté');

    await fs.writeFile(file, JSON.stringify({ meta: { version: 2 }, site: { description: 'Ma description.' }, contact: { area: 'Lyon' } }));
    const custom = new Store(dir);
    await custom.init();
    assert.equal(custom.getContent().site.description, 'Ma description.');
    assert.equal(custom.getContent().contact.area, 'Lyon');
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('illustrations ajoutées aux contenus existants', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-illustrations-'));
    const steps = defaults.offer.structure.steps.map(({ image, imageFormat, ...step }) => step);
    steps[1].image = '';
    steps.push({ title: 'Module personnalisé', text: '', items: [] });
    const projects = defaults.projects.map(({ mobileImage, ...project }) => project);
    projects[1].image = '/uploads/mon-projet.webp';
    await fs.writeFile(
      path.join(dir, 'content.json'),
      JSON.stringify({ meta: { version: 2 }, offer: { structure: { steps } }, projects }),
    );
    const store = new Store(dir);
    await store.init();
    const content = store.getContent();
    const [first, second] = content.offer.structure.steps;
    assert.equal(first.image, defaults.offer.structure.steps[0].image);
    assert.equal(first.imageFormat, 'phone');
    assert.equal(second.image, '');
    assert.equal(content.offer.structure.steps.at(-1).image, undefined);
    assert.equal(content.projects[0].mobileImage, defaults.projects[0].mobileImage);
    assert.equal(content.projects[1].mobileImage, undefined);
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('détection du format des images', () => {
    assert.equal(detectImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])), 'jpg');
    assert.equal(detectImage(Buffer.from('RIFF0000WEBPVP8 ', 'latin1')), 'webp');
    assert.equal(detectImage(Buffer.from('<svg></svg>xxxxx')), null);
  });
});

describe('sessions', () => {
  test('mot de passe changé par un autre processus', async () => {
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-auth-'));
    const log = { warn() {}, info() {} };
    const server = new Auth({ dataDir, log });
    await server.init();
    const token = server.createToken();
    const script = new Auth({ dataDir, log });
    await script.init();
    await script.setPassword('nouveau-mot-de-passe');
    assert.equal(await server.verifyPassword('nouveau-mot-de-passe'), false);
    await server.refresh();
    assert.equal(await server.verifyPassword('nouveau-mot-de-passe'), true);
    assert.equal(server.isTemporary, false);
    assert.equal(server.verifyToken(token), false);
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  test('jetons signés, expirés ou falsifiés', async () => {
    const auth = new Auth({ dataDir: '/tmp', adminPassword: 'secret-123', sessionSecret: 'x'.repeat(64) });
    auth.secret = 'x'.repeat(64);
    const token = auth.createToken(Date.now());
    assert.equal(auth.verifyToken(token), true);
    assert.equal(auth.verifyToken(token, Date.now() + 8 * 24 * 3600 * 1000), false);
    assert.equal(auth.verifyToken(token.slice(0, -2) + 'aa'), false);
    assert.equal(await auth.verifyPassword('secret-123'), true);
    assert.equal(await auth.verifyPassword('autre'), false);
  });

  test('jeton de formulaire : délai minimal', () => {
    const auth = new Auth({ dataDir: '/tmp', sessionSecret: 'y'.repeat(64) });
    auth.secret = 'y'.repeat(64);
    const now = Date.now();
    const token = auth.createFormToken(now);
    assert.equal(auth.checkFormToken(token, 3000, now + 1000), false);
    assert.equal(auth.checkFormToken(token, 3000, now + 4000), true);
    assert.equal(auth.checkFormToken(token, 3000, now + 25 * 3600 * 1000), false);
  });
});
