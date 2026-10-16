import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { defaults, SECTOR_SLUGS } from './defaults.js';
import { PAGES } from './schema.js';

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

function migrate(raw) {
  if (!isPlainObject(raw)) return raw;
  let data = raw;
  const version = raw.meta?.version ?? 1;
  if (version < 2) data = migrateFromV1(data);
  if (version < 3) data = migrateFromV2(data);
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
    this.queue = Promise.resolve();
    this.content = null;
    this.messages = [];
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
}
