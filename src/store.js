import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { defaults, PRIVACY_AUDIENCE, PRIVACY_FORM_PAGE, SECTOR_SLUGS } from './defaults.js';
import { PAGES } from './schema.js';
import { DEMO_POST } from './demo-post.js';
import { normalizeProspect, prospectKey } from './prospects.js';

const MESSAGE_RETENTION_MS = 3 * 365 * 24 * 60 * 60 * 1000;
// Liste de départ de la prospection, importée au premier démarrage.
const PROSPECTS_SEED_FILE = path.join(import.meta.dirname, 'prospects-seed.json');

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Une entrée invalide est écartée plutôt que de bloquer le démarrage.
function safeProspect(raw) {
  if (!isPlainObject(raw)) return null;
  try {
    const p = normalizeProspect(raw);
    return p.name ? p : null;
  } catch {
    return null;
  }
}

// Complète un contenu sauvegardé avec les valeurs par défaut manquantes
// (utile quand une nouvelle version du site ajoute des champs).
export function mergeDefaults(def, saved) {
  if (saved === undefined || saved === null) return structuredClone(def);
  if (def === null) return saved;
  if (Array.isArray(def)) return Array.isArray(saved) ? saved : structuredClone(def);
  if (isPlainObject(def)) {
    if (!isPlainObject(saved)) return structuredClone(def);
    const out = {};
    for (const key of Object.keys(def)) out[key] = mergeDefaults(def[key], saved[key]);
    return out;
  }
  return typeof saved === typeof def ? saved : def;
}

// Version 1 : offre « site vitrine ». Les textes de présentation sont remplacés
// par ceux de l'offre actuelle ; les informations propres à l'entreprise sont conservées.
function migrateFromV1(raw) {
  const { page, ...contact } = isPlainObject(raw.contact) ? raw.contact : {};
  return {
    meta: raw.meta,
    site: isPlainObject(raw.site) ? { ...raw.site, tagline: undefined, description: undefined } : undefined,
    contact,
    projects: raw.projects,
    legal: isPlainObject(raw.legal) ? { identity: raw.legal.identity } : undefined,
  };
}

// Version 2 : référencement local. Les textes encore identiques à ceux d'origine
// prennent la nouvelle version (qui mentionne Grenoble) ; les autres sont conservés.
// Titres, descriptions et H1 changent sur toutes les pages : leur date de
// modification (plan du site) est mise à jour.
const V2_DESCRIPTION =
  'Sites sur mesure avec réservation en ligne, acompte, devis, gestion des horaires et panneau d’administration, pour restaurateurs, tatoueurs, instituts, TPE et PME.';
const V2_AREAS = ['', 'Région AURA / Toute la France via zoom'];

function migrateFromV2(raw) {
  const out = structuredClone(raw);
  if (isPlainObject(out.site) && out.site.description === V2_DESCRIPTION) delete out.site.description;
  if (isPlainObject(out.contact) && V2_AREAS.includes(String(out.contact.area ?? '').trim())) delete out.contact.area;
  const now = new Date().toISOString();
  out.meta = { ...out.meta, sections: Object.fromEntries(PAGES.map((p) => [p.id, now])) };
  return out;
}

// Version 3 : la politique de confidentialité disait « aucun outil de mesure
// d'audience ». Si cette phrase d'origine est toujours là, elle est remplacée et
// la section « Mesure d'audience » est ajoutée ; un texte réécrit n'est pas touché.
const V3_PRIVACY_SENTENCE = 'Le site n’utilise aucun outil de mesure d’audience ni aucun cookie publicitaire.';

function migrateFromV3(raw) {
  const body = raw.legal?.privacy?.body;
  if (typeof body !== 'string' || !body.includes(V3_PRIVACY_SENTENCE)) return raw;
  const out = structuredClone(raw);
  let next = body.replace(V3_PRIVACY_SENTENCE, PRIVACY_FORM_PAGE);
  next = next.includes('\n## Vos droits') ? next.replace('\n## Vos droits', `\n${PRIVACY_AUDIENCE}\n\n## Vos droits`) : `${next.trimEnd()}\n\n${PRIVACY_AUDIENCE}`;
  out.legal.privacy.body = next;
  out.meta = { ...out.meta, sections: { ...(isPlainObject(out.meta?.sections) ? out.meta.sections : {}), legal: new Date().toISOString() } };
  return out;
}

function migrate(raw) {
  if (!isPlainObject(raw)) return raw;
  let data = raw;
  const version = raw.meta?.version ?? 1;
  if (version < 2) data = migrateFromV1(data);
  if (version < 3) data = migrateFromV2(data);
  if (version < 4) data = migrateFromV3(data);
  return data;
}

function normalizeContent(raw) {
  const content = mergeDefaults(defaults, migrate(raw));
  content.meta.version = defaults.meta.version;
  // Les secteurs ont des adresses fixes : on garantit leur présence
  // tout en conservant l'ordre choisi dans l'administration.
  const saved = (content.sectors || []).filter((s, i, all) => SECTOR_SLUGS.includes(s?.slug) && all.findIndex((x) => x?.slug === s.slug) === i);
  const missing = SECTOR_SLUGS.filter((slug) => !saved.some((s) => s.slug === slug)).map((slug) => ({ slug }));
  content.sectors = [...saved, ...missing].map((s) => mergeDefaults(defaults.sectors.find((d) => d.slug === s.slug), s));
  addIllustrations(content.offer.structure.steps, defaults.offer.structure.steps, (d, s) => d.title === s.title);
  addIllustrations(content.projects, defaults.projects, (d, p) => d.id === p.id && d.image === p.image);
  return content;
}

// Les illustrations ajoutées par une version récente du site sont reprises sur
// les éléments d'origine encore inchangés ; une image retirée volontairement
// (champ vide) n'est pas remise.
function addIllustrations(items, defaultItems, sameItem) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    const def = isPlainObject(item) && defaultItems.find((d) => sameItem(d, item));
    if (!def) continue;
    for (const key of ['image', 'imageFormat', 'mobileImage']) {
      if (item[key] === undefined && def[key] !== undefined) item[key] = def[key];
    }
  }
}

export async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw new Error(`Lecture impossible de ${file} : ${err.message}`);
  }
}

export async function writeJsonAtomic(file, data) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, file);
}

export class Store {
  constructor(dataDir, { seedProspects = true, seedFile = PROSPECTS_SEED_FILE, log = console } = {}) {
    this.dataDir = dataDir;
    this.uploadsDir = path.join(dataDir, 'uploads');
    this.contentFile = path.join(dataDir, 'content.json');
    this.messagesFile = path.join(dataDir, 'messages.json');
    this.postsFile = path.join(dataDir, 'posts.json');
    this.prospectsFile = path.join(dataDir, 'prospects.json');
    this.seedProspects = seedProspects;
    this.seedFile = seedFile;
    this.log = log;
    this.prospectsSeededAt = null;
    this.queue = Promise.resolve();
    this.content = null;
    this.messages = [];
    this.posts = [];
    this.prospects = [];
    this.prospectSearch = null;
  }

  async init() {
    await fs.mkdir(this.uploadsDir, { recursive: true });
    const saved = await readJson(this.contentFile, null);
    this.content = normalizeContent(saved);
    if (!saved) {
      this.content.meta.createdAt = new Date().toISOString();
      await this.#persist(this.contentFile, this.content);
    } else if ((saved.meta?.version ?? 1) < this.content.meta.version) {
      // Contenu d'une version précédente : migré une seule fois, l'original est gardé de côté.
      await fs.copyFile(this.contentFile, `${this.contentFile}.v${saved.meta?.version ?? 1}.bak`);
      await this.#persist(this.contentFile, this.content);
    }
    const messages = await readJson(this.messagesFile, []);
    this.messages = Array.isArray(messages) ? messages : [];
    await this.purgeOldMessages();
    const posts = await readJson(this.postsFile, null);
    if (Array.isArray(posts)) {
      this.posts = posts;
    } else {
      // Premier démarrage : un article de démonstration en brouillon.
      const now = new Date().toISOString();
      this.posts = [{ ...structuredClone(DEMO_POST), id: crypto.randomUUID(), createdAt: now, updatedAt: now }];
      await this.#persist(this.postsFile, this.posts);
    }
    const prospects = await readJson(this.prospectsFile, null);
    const stored = isPlainObject(prospects) && Array.isArray(prospects.items) ? prospects : null;
    if (stored) {
      this.prospects = stored.items.map(safeProspect).filter(Boolean);
      this.prospectSearch = isPlainObject(stored.lastSearch) ? stored.lastSearch : null;
      this.prospectsSeededAt = typeof stored.seededAt === 'string' ? stored.seededAt : null;
    }
    // Premier démarrage : la liste de départ (entreprises vérifiées en ligne),
    // importée une seule fois. Une liste absente ou illisible ne bloque jamais
    // le site : l'import est retenté au démarrage suivant.
    if (this.seedProspects && !this.prospectsSeededAt && !this.prospects.length && !this.prospectSearch) {
      await this.#importProspectsSeed();
    }
  }

  async #importProspectsSeed() {
    let seed = [];
    try {
      seed = await readJson(this.seedFile, []);
    } catch (err) {
      this.log.warn(`Prospection : liste de départ ignorée (${err.message})`);
      return;
    }
    const items = (Array.isArray(seed) ? seed : []).map((p) => safeProspect(isPlainObject(p) ? { ...p, source: 'liste-de-depart' } : null)).filter(Boolean);
    if (!items.length) {
      this.log.warn(`Prospection : liste de départ absente ou vide (${this.seedFile}).`);
      return;
    }
    this.prospects = items;
    this.prospectsSeededAt = new Date().toISOString();
    await this.#persistProspects();
    this.log.info(`Prospection : ${items.length} entreprises importées depuis la liste de départ.`);
  }

  // Les écritures sont sérialisées pour éviter toute corruption.
  #persist(file, data) {
    const run = this.queue.then(() => writeJsonAtomic(file, data));
    this.queue = run.catch(() => {});
    return run;
  }

  getContent() {
    return this.content;
  }

  // pages : rubriques de l'administration modifiées (date de mise à jour du plan du site).
  async saveContent(next, { pages = [] } = {}) {
    const content = normalizeContent(next);
    const now = new Date().toISOString();
    const sections = { ...content.meta.sections };
    for (const id of pages) sections[id] = now;
    content.meta = { ...content.meta, updatedAt: now, sections };
    try {
      await fs.copyFile(this.contentFile, `${this.contentFile}.bak`);
    } catch {
      // Pas encore de fichier à sauvegarder.
    }
    await this.#persist(this.contentFile, content);
    this.content = content;
    return content;
  }

  async updateContent(mutator) {
    const draft = structuredClone(this.content);
    mutator(draft);
    return this.saveContent(draft);
  }

  listMessages() {
    return [...this.messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  unreadCount() {
    return this.messages.filter((m) => !m.read).length;
  }

  async addMessage(fields) {
    const message = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
      ...fields,
    };
    this.messages = [...this.messages, message];
    await this.#persist(this.messagesFile, this.messages);
    return message;
  }

  async updateMessage(id, patch) {
    let found = false;
    this.messages = this.messages.map((m) => {
      if (m.id !== id) return m;
      found = true;
      return { ...m, ...patch };
    });
    if (found) await this.#persist(this.messagesFile, this.messages);
    return found;
  }

  async deleteMessage(id) {
    const before = this.messages.length;
    this.messages = this.messages.filter((m) => m.id !== id);
    if (this.messages.length !== before) await this.#persist(this.messagesFile, this.messages);
    return this.messages.length !== before;
  }

  async purgeOldMessages(now = Date.now()) {
    const kept = this.messages.filter((m) => now - Date.parse(m.createdAt) < MESSAGE_RETENTION_MS);
    if (kept.length !== this.messages.length) {
      this.messages = kept;
      await this.#persist(this.messagesFile, this.messages);
    }
  }

  // Articles du blog ----------------------------------------------------------

  listPosts() {
    return [...this.posts].sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt));
  }

  getPost(id) {
    return this.posts.find((p) => p.id === id) || null;
  }

  getPostBySlug(slug) {
    return this.posts.find((p) => p.slug === slug) || null;
  }

  async addPost(fields) {
    const now = new Date().toISOString();
    const post = { ...fields, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    this.posts = [...this.posts, post];
    await this.#persist(this.postsFile, this.posts);
    return post;
  }

  async updatePost(id, patch) {
    let updated = null;
    this.posts = this.posts.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...patch, id, createdAt: p.createdAt, updatedAt: new Date().toISOString() };
      return updated;
    });
    if (updated) await this.#persist(this.postsFile, this.posts);
    return updated;
  }

  async deletePost(id) {
    const before = this.posts.length;
    this.posts = this.posts.filter((p) => p.id !== id);
    if (this.posts.length !== before) await this.#persist(this.postsFile, this.posts);
    return this.posts.length !== before;
  }

  // Prospection ----------------------------------------------------------------

  #persistProspects() {
    return this.#persist(this.prospectsFile, { items: this.prospects, lastSearch: this.prospectSearch, seededAt: this.prospectsSeededAt });
  }

  listProspects() {
    return [...this.prospects].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'fr'));
  }

  getProspect(id) {
    return this.prospects.find((p) => p.id === id) || null;
  }

  // Ajoute les prospects inconnus (même téléphone ou même nom et ville = déjà présent).
  async addProspects(items) {
    const known = new Set(this.prospects.map(prospectKey));
    const added = [];
    for (const raw of items) {
      const p = normalizeProspect(raw);
      const key = prospectKey(p);
      if (!p.name || known.has(key)) continue;
      known.add(key);
      added.push(p);
    }
    if (added.length) {
      this.prospects = [...this.prospects, ...added];
      await this.#persistProspects();
    }
    return added;
  }

  async updateProspect(id, patch) {
    let updated = null;
    this.prospects = this.prospects.map((p) => {
      if (p.id !== id) return p;
      updated = normalizeProspect({ ...p, ...patch, id, createdAt: p.createdAt, updatedAt: new Date().toISOString() });
      return updated;
    });
    if (updated) await this.#persistProspects();
    return updated;
  }

  async deleteProspect(id) {
    const before = this.prospects.length;
    this.prospects = this.prospects.filter((p) => p.id !== id);
    if (this.prospects.length !== before) await this.#persistProspects();
    return this.prospects.length !== before;
  }

  async setLastProspectSearch(search) {
    this.prospectSearch = search;
    await this.#persistProspects();
  }

  // Publication programmée : les articles dont l'heure est passée sont mis en ligne.
  async publishDue(now = Date.now()) {
    const due = this.posts.filter((p) => p.status === 'scheduled' && p.scheduledAt && Date.parse(p.scheduledAt) <= now);
    for (const post of due) {
      await this.updatePost(post.id, { status: 'published', publishedAt: post.scheduledAt, scheduledAt: null });
    }
    return due.length;
  }
}
