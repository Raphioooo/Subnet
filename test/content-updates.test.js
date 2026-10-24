import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { Store, eachAtPath } from '../src/store.js';
import { defaults } from '../src/defaults.js';
import { CONTENT_UPDATES } from '../src/content-updates.js';

const silent = { info() {}, warn() {}, error() {} };
const V5 = CONTENT_UPDATES[5];

const read = (content, pathname) => {
  const found = [];
  eachAtPath(content, pathname, (parent, key) => found.push(parent[key]));
  return found;
};

// Contenu d'un site resté en version 4 : anciens textes, sans les questions ajoutées.
function v4Content() {
  const old = structuredClone(defaults);
  for (const { path: p, from, to } of V5.changes) {
    eachAtPath(old, p, (parent, key) => {
      if (parent[key] === to) parent[key] = from;
    });
  }
  for (const { path: p, key, item } of V5.additions) {
    eachAtPath(old, p, (parent, k) => {
      parent[k] = parent[k].filter((x) => x[key] !== item[key]);
    });
  }
  old.meta = { ...old.meta, version: 4 };
  return old;
}

describe('textes retravaillés pour le référencement (contenus en version 5)', () => {
  test('les chemins des mises à jour existent tous dans les contenus par défaut', () => {
    for (const { path: p, to } of V5.changes) assert.ok(read(defaults, p).includes(to), p);
    for (const { path: p, key, item } of V5.additions) assert.equal(read(defaults, p)[0].filter((x) => x[key] === item[key]).length, 1, p);
  });

  test('un site existant reçoit les nouveaux textes, sauf ceux que son propriétaire a réécrits', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-v5-'));
    const saved = v4Content();
    assert.equal(saved.home.pillars.title, 'Plus qu’une vitrine. Votre outil de travail.', 'anciens textes reconstitués');
    // Réécrit, complété ou vidé depuis l'administration : à respecter.
    saved.home.journey.title = 'Mon accroche à moi';
    saved.faq.push({ question: 'Ma question à moi ?', answer: 'Ma réponse.' });
    saved.local.faq.items = [];
    await fs.writeFile(path.join(dir, 'content.json'), JSON.stringify(saved));

    const store = new Store(dir, { seedProspects: false, log: silent });
    await store.init();
    const c = store.getContent();
    assert.equal(c.meta.version, 5);
    assert.equal(c.home.journey.title, 'Mon accroche à moi');
    for (const { path: p, from, to } of V5.changes) {
      if (p === 'home.journey.title') continue;
      assert.ok(read(c, p).includes(to), p);
      assert.ok(!read(c, p).includes(from), p);
    }
    const questions = c.faq.map((x) => x.question);
    for (const { item } of V5.additions.filter((a) => a.path === 'faq')) assert.equal(questions.filter((q) => q === item.question).length, 1, item.question);
    assert.ok(questions.includes('Ma question à moi ?'));
    assert.deepEqual(c.local.faq.items, [], 'une FAQ vidée reste vide');
    assert.equal(c.sectors.find((s) => s.slug === 'restaurateurs').faq.items.at(-1).question, 'Combien coûte un site internet pour un restaurant ?');
    assert.ok(c.meta.sections.faq && c.meta.sections.sectors, 'dates du plan du site mises à jour');

    // L'original est gardé de côté, et la mise à jour ne se refait pas au démarrage suivant.
    await fs.access(path.join(dir, 'content.json.v4.bak'));
    const again = new Store(dir, { seedProspects: false, log: silent });
    await again.init();
    assert.equal(again.getContent().faq.length, c.faq.length);
    assert.equal(again.getContent().home.journey.title, 'Mon accroche à moi');
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('les pages affichent les nouveaux intertitres, questions et titres du blog', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-v5-app-'));
    await fs.writeFile(path.join(dir, 'content.json'), JSON.stringify(v4Content()));
    const config = loadConfig({ NODE_ENV: 'test', DATA_DIR: dir, ADMIN_PASSWORD: 'mot-de-passe-de-test' });
    const app = await createApp(config, { log: silent, seedProspects: false });
    const server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const page = async (p) => {
      const res = await fetch(base + p);
      assert.equal(res.status, 200, p);
      return res.text();
    };
    // Les espaces avant « ? » deviennent des espaces fines insécables à l'affichage.
    try {
      assert.match(await page('/'), /Plus qu’un site vitrine\. Votre outil de travail\./);
      const resto = await page('/secteurs/restaurateurs');
      assert.match(resto, /Ce que votre site de restaurant gère pour vous/);
      assert.match(resto, /Combien coûte un site internet pour un restaurant[\s\u202F]\?/);
      assert.match(resto, /Fonctionnalités – Restaurateurs/);
      assert.match(await page('/faq'), /Combien de temps faut-il pour créer un site internet[\s\u202F]\?/);
      assert.match(await page('/creation-site-internet-grenoble'), /Quelle différence avec une agence web[\s\u202F]\?/);
      assert.match(await page('/blog'), /<h1[^>]*>Conseils site internet pour les pros\.<\/h1>/);
      const tpe = await page('/blog/categorie/tpe-pme');
      assert.match(tpe, /<h1[^>]*>Conseils site internet pour les TPE et PME\.<\/h1>/);
      assert.match(tpe, /<meta name="description" content="Articles du blog Subnet pour les TPE et PME :/);
      assert.match(await page('/blog/categorie/guides'), /<h1[^>]*>Guides site internet pour les pros\.<\/h1>/);
    } finally {
      app.ctx.stats.stop();
      await new Promise((resolve) => server.close(resolve));
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
