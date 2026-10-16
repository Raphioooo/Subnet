import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { applyTokens, renderMarkdown } from '../src/markdown.js';
import { sanitizeObject } from '../src/sanitize.js';
import { frenchTypography, telHref } from '../src/helpers.js';
import { mergeDefaults } from '../src/store.js';
import { Auth } from '../src/auth.js';
import { detectImage } from '../src/routes/admin.js';

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
  });

  test('fusion avec les valeurs par défaut', () => {
    const merged = mergeDefaults({ a: 1, b: { c: 2, d: 3 }, list: [1], when: null }, { b: { c: 5 }, list: [], extra: true, when: '2026' });
    assert.deepEqual(merged, { a: 1, b: { c: 5, d: 3 }, list: [], when: '2026' });
  });

  test('détection du format des images', () => {
    assert.equal(detectImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])), 'jpg');
    assert.equal(detectImage(Buffer.from('RIFF0000WEBPVP8 ', 'latin1')), 'webp');
    assert.equal(detectImage(Buffer.from('<svg></svg>xxxxx')), null);
  });
});

describe('sessions', () => {
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
