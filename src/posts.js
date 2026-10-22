// Articles du blog : modèle, validation et calculs (marqueurs, temps de lecture, sommaire).

import { renderMarkdown, slugify } from './markdown.js';
import { cleanText, isPlainObject } from './sanitize.js';

// audience : à qui s'adressent les articles (titre et description de la catégorie).
export const POST_CATEGORIES = [
  { value: 'restaurants', label: 'Restaurants', sector: 'restaurateurs', audience: 'les restaurants' },
  { value: 'tatoueurs', label: 'Tatoueurs', sector: 'tatoueurs', audience: 'les tatoueurs' },
  { value: 'instituts', label: 'Instituts de beauté', sector: 'instituts', audience: 'les instituts de beauté' },
  { value: 'tpe-pme', label: 'TPE et PME', sector: 'tpe-pme', audience: 'les TPE et PME' },
  { value: 'guides', label: 'Guides', sector: '', audience: 'les pros' },
  { value: 'grenoble', label: 'Grenoble', sector: '', audience: 'les pros de Grenoble' },
];

export const POST_STATUSES = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'scheduled', label: 'Programmé' },
  { value: 'published', label: 'Publié' },
];

export const LIMITS = {
  slug: 70,
  title: 90,
  metaTitle: 60,
  metaDescriptionMin: 120,
  metaDescription: 158,
  excerpt: 300,
  content: 150000,
  tags: 6,
  tag: 40,
  faq: 6,
  question: 200,
  answer: 1500,
  targetKeyword: 120,
  coverAlt: 200,
};

export const META_SUFFIX = ' | Subnet';
export const POSTS_PER_PAGE = 12;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOPIC_RE = /^[A-Za-z0-9_-]{1,32}$/;
const IMAGE_RE = /^\/(uploads|assets\/images)\/[A-Za-z0-9._/-]+$/;
const HTML_RE = /<\/?[a-z!][^>]*>/i;
const UNSAFE_LINK_RE = /\]\(\s*(javascript|data|vbscript|file):/i;
const MARKER_RE = /\[\s*[ÀA]\s+COMPL[ÉE]TER\b[^\]]*\]?/giu;

const EDITABLE = ['slug', 'title', 'metaTitle', 'metaDescription', 'excerpt', 'content', 'coverImage', 'coverAlt', 'category', 'tags', 'faq', 'targetKeyword', 'topicId'];

export const categoryOf = (value) => POST_CATEGORIES.find((c) => c.value === value);
export const categoryLabel = (value) => categoryOf(value)?.label || value;
export const statusLabel = (value) => POST_STATUSES.find((s) => s.value === value)?.label || value;

// Titre de la page dans Google : metaTitle, sinon « titre | Subnet ».
export function effectiveMetaTitle(post) {
  return post.metaTitle || `${post.title}${META_SUFFIX}`;
}

// Marqueurs [À COMPLÉTER : …] restants, dans tous les textes de l'article.
export function findMarkers(post) {
  const texts = [post.title, post.metaTitle, post.metaDescription, post.excerpt, post.content, post.coverAlt, ...(post.faq || []).flatMap((f) => [f.question, f.answer])];
  return texts.flatMap((t) => String(t || '').match(MARKER_RE) || []);
}

export function wordCount(markdown) {
  return String(markdown || '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/[#*|>\-[\]]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function readingTime(markdown) {
  return Math.max(1, Math.round(wordCount(markdown) / 200));
}

export function renderPost(post) {
  const toc = [];
  const html = renderMarkdown(post.content, { headings: toc });
  return { html, toc };
}

function cleanList(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return null;
  return value.slice(0, maxItems + 1).map((v) => cleanText(v, maxLength + 1));
}

// Valide une saisie (API ou admin). Les longueurs sont vérifiées sans couper
// le texte, pour que l'erreur soit visible plutôt qu'une troncature silencieuse.
//  - strict : toutes les règles SEO (API et publication)
//  - partial : seuls les champs présents sont validés (PATCH)
//  - unknownKeys : refuse les champs inconnus
export function validatePost(input, { strict = true, partial = false, unknownKeys = false } = {}) {
  const errors = [];
  const values = {};
  const err = (field, message) => errors.push({ field, message });
  if (!isPlainObject(input)) return { values, errors: [{ field: '', message: 'Le corps de la requête doit être un objet JSON.' }] };

  if (unknownKeys) {
    for (const key of Object.keys(input)) {
      if (!EDITABLE.includes(key) && key !== 'status') err(key, 'Champ inconnu.');
    }
  }
  const has = (key) => !partial || Object.hasOwn(input, key);
  const str = (key, max, multiline = false) => {
    const raw = input[key];
    if (raw !== undefined && raw !== null && typeof raw !== 'string') err(key, 'Doit être une chaîne de caractères.');
    return cleanText(typeof raw === 'string' ? raw : '', max + 1000, multiline);
  };
  const tooLong = (key, value, max) => value.length > max && err(key, `${max} caractères maximum (actuellement ${value.length}).`);

  if (has('title')) {
    values.title = str('title', LIMITS.title);
    if (!values.title) err('title', 'Le titre est obligatoire.');
    tooLong('title', values.title, LIMITS.title);
  }
  if (has('slug') && (input.slug || !partial)) {
    const raw = str('slug', LIMITS.slug);
    values.slug = raw ? slugify(raw, 200) : '';
    if (values.slug && !SLUG_RE.test(values.slug)) err('slug', 'Adresse invalide.');
    tooLong('slug', values.slug, LIMITS.slug);
  }
  if (has('metaTitle')) {
    values.metaTitle = str('metaTitle', LIMITS.metaTitle);
    tooLong('metaTitle', values.metaTitle, LIMITS.metaTitle);
    if (strict && !values.metaTitle && values.title) {
      const fallback = `${values.title}${META_SUFFIX}`;
      if (fallback.length > LIMITS.metaTitle) err('metaTitle', `Titre trop long pour servir de titre Google : renseignez un metaTitle de ${LIMITS.metaTitle} caractères maximum.`);
    }
  }
  if (has('metaDescription')) {
    values.metaDescription = str('metaDescription', LIMITS.metaDescription);
    const n = values.metaDescription.length;
    if (strict && (n < LIMITS.metaDescriptionMin || n > LIMITS.metaDescription)) {
      err('metaDescription', `Entre ${LIMITS.metaDescriptionMin} et ${LIMITS.metaDescription} caractères (actuellement ${n}).`);
    } else if (!strict) tooLong('metaDescription', values.metaDescription, LIMITS.metaDescription);
  }
  if (has('excerpt')) {
    values.excerpt = str('excerpt', LIMITS.excerpt, true);
    tooLong('excerpt', values.excerpt, LIMITS.excerpt);
    if (strict && !values.excerpt) err('excerpt', 'Le résumé est obligatoire.');
  }
  if (has('content')) {
    values.content = typeof input.content === 'string' ? input.content.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim() : '';
    if (input.content !== undefined && typeof input.content !== 'string') err('content', 'Doit être une chaîne de caractères (Markdown).');
    if (strict && !values.content) err('content', 'Le contenu est obligatoire.');
    tooLong('content', values.content, LIMITS.content);
    if (HTML_RE.test(values.content)) err('content', 'Le HTML n’est pas accepté : utilisez uniquement le Markdown.');
    if (UNSAFE_LINK_RE.test(values.content)) err('content', 'Lien non autorisé (javascript:, data:…).');
  }
  if (has('coverImage')) {
    values.coverImage = str('coverImage', 300);
    if (values.coverImage && !IMAGE_RE.test(values.coverImage)) err('coverImage', 'Image invalide : utilisez une image envoyée depuis l’admin.');
  }
  if (has('coverAlt')) {
    values.coverAlt = str('coverAlt', LIMITS.coverAlt);
    tooLong('coverAlt', values.coverAlt, LIMITS.coverAlt);
  }
  if (!partial && values.coverImage && !values.coverAlt) {
    err('coverAlt', 'Le texte alternatif est obligatoire quand une image de couverture est renseignée.');
  }
  if (has('category')) {
    values.category = typeof input.category === 'string' ? input.category : '';
    if (!categoryOf(values.category)) err('category', `Catégorie invalide : ${POST_CATEGORIES.map((c) => c.value).join(', ')}.`);
  }
  if (has('tags')) {
    const tags = input.tags === undefined || input.tags === null ? [] : cleanList(input.tags, LIMITS.tags, LIMITS.tag);
    if (!tags) err('tags', 'Doit être une liste de chaînes.');
    else {
      values.tags = [...new Set(tags.filter(Boolean))];
      if (values.tags.length > LIMITS.tags) err('tags', `${LIMITS.tags} étiquettes maximum.`);
      if (values.tags.some((t) => t.length > LIMITS.tag)) err('tags', `${LIMITS.tag} caractères maximum par étiquette.`);
    }
  }
  if (has('faq')) {
    const faq = input.faq === undefined || input.faq === null ? [] : input.faq;
    if (!Array.isArray(faq)) err('faq', 'Doit être une liste de { question, answer }.');
    else {
      if (faq.length > LIMITS.faq) err('faq', `${LIMITS.faq} questions maximum.`);
      values.faq = faq.slice(0, LIMITS.faq).map((item, i) => {
        if (!isPlainObject(item)) {
          err(`faq[${i}]`, 'Doit être un objet { question, answer }.');
          return { question: '', answer: '' };
        }
        const question = cleanText(item.question, LIMITS.question + 1);
        const answer = cleanText(item.answer, LIMITS.answer + 1, true);
        if (!question || !answer) err(`faq[${i}]`, 'Question et réponse obligatoires.');
        if (question.length > LIMITS.question) err(`faq[${i}].question`, `${LIMITS.question} caractères maximum.`);
        if (answer.length > LIMITS.answer) err(`faq[${i}].answer`, `${LIMITS.answer} caractères maximum.`);
        if (HTML_RE.test(answer)) err(`faq[${i}].answer`, 'Le HTML n’est pas accepté.');
        return { question, answer };
      });
    }
  }
  if (has('targetKeyword')) {
    values.targetKeyword = str('targetKeyword', LIMITS.targetKeyword);
    tooLong('targetKeyword', values.targetKeyword, LIMITS.targetKeyword);
  }
  if (has('topicId')) {
    values.topicId = input.topicId === null || input.topicId === undefined ? '' : String(input.topicId).trim();
    if (values.topicId && !TOPIC_RE.test(values.topicId)) err('topicId', 'Identifiant de sujet invalide (lettres, chiffres, - et _).');
  }
  return { values, errors };
}

// Adresse unique : suffixe -2, -3… en cas de collision.
export function uniqueSlug(wanted, posts, exceptId = null) {
  const base = slugify(wanted, LIMITS.slug) || 'article';
  const taken = new Set(posts.filter((p) => p.id !== exceptId).map((p) => p.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, LIMITS.slug - suffix.length).replace(/-+$/, '')}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export function blankPost() {
  return {
    slug: '',
    title: '',
    metaTitle: '',
    metaDescription: '',
    excerpt: '',
    content: '',
    coverImage: '',
    coverAlt: '',
    category: 'guides',
    tags: [],
    faq: [],
    targetKeyword: '',
    topicId: '',
    status: 'draft',
    source: 'manual',
    publishedAt: null,
    scheduledAt: null,
  };
}

export const isPublished = (post, now = Date.now()) => post.status === 'published' && Date.parse(post.publishedAt || 0) <= now;
