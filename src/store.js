import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { defaults, SECTOR_SLUGS } from './defaults.js';
import { DEMO_POST } from './demo-post.js';

const MESSAGE_RETENTION_MS = 3 * 365 * 24 * 60 * 60 * 1000;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
function migrate(raw) {
  if (!isPlainObject(raw) || (raw.meta?.version ?? 1) >= defaults.meta.version) return raw;
  const { page, ...contact } = isPlainObject(raw.contact) ? raw.contact : {};
  return {
    meta: raw.meta,
    site: isPlainObject(raw.site) ? { ...raw.site, tagline: undefined, description: undefined } : undefined,
    contact,
    projects: raw.projects,
    legal: isPlainObject(raw.legal) ? { identity: raw.legal.identity } : undefined,
  };
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

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw new Error(`Lecture impossible de ${file} : ${err.message}`);
  }
}

async function writeJsonAtomic(file, data) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, file);
}

export class Store {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.uploadsDir = path.join(dataDir, 'uploads');
    this.contentFile = path.join(dataDir, 'content.json');
    this.messagesFile = path.join(dataDir, 'messages.json');
    this.postsFile = path.join(dataDir, 'posts.json');
    this.queue = Promise.resolve();
    this.content = null;
    this.messages = [];
    this.posts = [];
  }

  async init() {
    await fs.mkdir(this.uploadsDir, { recursive: true });
    const saved = await readJson(this.contentFile, null);
    this.content = normalizeContent(saved);
    if (!saved) await this.#persist(this.contentFile, this.content);
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

  async saveContent(next) {
    const content = normalizeContent(next);
    content.meta = { ...content.meta, updatedAt: new Date().toISOString() };
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

  // Publication programmée : les articles dont l'heure est passée sont mis en ligne.
  async publishDue(now = Date.now()) {
    const due = this.posts.filter((p) => p.status === 'scheduled' && p.scheduledAt && Date.parse(p.scheduledAt) <= now);
    for (const post of due) {
      await this.updatePost(post.id, { status: 'published', publishedAt: post.scheduledAt, scheduledAt: null });
    }
    return due.length;
  }
}
