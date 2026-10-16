// Validation et nettoyage des données envoyées par l'administration,
// à partir de la description des champs (src/schema.js).

import crypto from 'node:crypto';

const DEFAULT_MAX = {
  text: 200,
  textarea: 1500,
  markdown: 40000,
  url: 500,
  link: 500,
  email: 200,
  tel: 40,
  image: 300,
};

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const TEL_RE = /^\+?[0-9 ().-]{6,30}$/;
const IMAGE_RE = /^\/(uploads|assets\/images)\/[A-Za-z0-9._/-]+$/;
const ID_RE = /^[a-z0-9-]{1,64}$/;
const SAFE_LINK_RE = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function getAt(obj, dotted) {
  if (!dotted) return obj;
  return dotted.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function cleanText(value, max = 200, multiline = false) {
  let s = typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
  s = s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  s = multiline ? s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n') : s.replace(/\s*\n\s*/g, ' ');
  s = s.trim();
  return s.length > max ? s.slice(0, max).trim() : s;
}

export function isSafeLink(value) {
  return value === '' || SAFE_LINK_RE.test(value);
}

export function isEmail(value) {
  return EMAIL_RE.test(value) && value.length <= 200;
}

// Complète « exemple.fr/page » ou « www.exemple.fr » en adresse https://.
function withScheme(value) {
  if (!value || /^[a-z][a-z0-9+.-]*:/i.test(value) || /^[/#]/.test(value)) return value;
  return /^[^\s/@]+\.[a-z]{2,}(?:[/?#]|$)/i.test(value) ? `https://${value}` : value;
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname);
  } catch {
    return false;
  }
}

function fail(ctx, field, message) {
  const where = [...ctx.trail, field.label].filter(Boolean).join(' › ');
  ctx.errors.push(`${where} : ${message}`);
}

function isBlankItem(fields, input) {
  if (!isPlainObject(input)) return true;
  return fields.every((f) => {
    if (['hidden', 'toggle', 'select'].includes(f.type)) return true;
    const v = input[f.key];
    if (Array.isArray(v)) return v.every((x) => (isPlainObject(x) ? isBlankItem(f.fields || [], x) : !cleanText(x)));
    if (isPlainObject(v)) return isBlankItem(f.fields || [], v);
    return !cleanText(v, 100000, true);
  });
}

function sanitizeField(field, input, prev, ctx) {
  const max = field.max ?? DEFAULT_MAX[field.type] ?? 200;
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'markdown': {
      const value = cleanText(input, max, field.type !== 'text');
      if (field.required && !value) fail(ctx, field, 'ce champ est obligatoire.');
      return value;
    }
    case 'email': {
      const value = cleanText(input, max).toLowerCase();
      if (value && !isEmail(value)) fail(ctx, field, 'adresse email invalide.');
      if (field.required && !value) fail(ctx, field, 'ce champ est obligatoire.');
      return value;
    }
    case 'tel': {
      const value = cleanText(input, max);
      if (value && !TEL_RE.test(value)) fail(ctx, field, 'numéro de téléphone invalide.');
      return value;
    }
    case 'url': {
      const value = withScheme(cleanText(input, max));
      if (value && !isHttpUrl(value)) fail(ctx, field, 'adresse invalide (elle doit commencer par https://).');
      if (field.required && !value) fail(ctx, field, 'ce champ est obligatoire.');
      return value;
    }
    case 'link': {
      const value = withScheme(cleanText(input, max));
      if (!isSafeLink(value)) fail(ctx, field, 'lien invalide (exemples : /contact, https://…, mailto:…).');
      return value;
    }
    case 'image': {
      const value = cleanText(input, max);
      if (value && (!IMAGE_RE.test(value) || value.includes('..'))) fail(ctx, field, 'image invalide.');
      if (field.required && !value) fail(ctx, field, 'une image est obligatoire.');
      return value;
    }
    case 'toggle':
      if (input === undefined) return typeof prev === 'boolean' ? prev : Boolean(field.default);
      return input === true || input === 'true' || input === 'on';
    case 'select': {
      const values = field.options.map((o) => o.value);
      if (values.includes(input)) return input;
      if (values.includes(prev)) return prev;
      return field.default ?? values[0];
    }
    case 'list': {
      const items = Array.isArray(input) ? input : [];
      return items
        .map((v) => cleanText(v, field.itemMax ?? 300))
        .filter(Boolean)
        .slice(0, field.maxItems ?? 30);
    }
    case 'group':
      return sanitizeObject(field.fields, input, isPlainObject(prev) ? prev : {}, {
        ...ctx,
        trail: field.label ? [...ctx.trail, field.label] : ctx.trail,
      });
    case 'repeater':
      return sanitizeRepeater(field, input, prev, ctx);
    case 'hidden':
      return prev ?? '';
    default:
      return prev;
  }
}

function sanitizeRepeater(field, input, prev, ctx) {
  const items = (Array.isArray(input) ? input : []).filter(isPlainObject);
  const prevItems = Array.isArray(prev) ? prev.filter(isPlainObject) : [];
  const labelField = field.fields.find((f) => f.key === field.itemLabel);
  const itemName = (item) => {
    const raw = item?.[field.itemLabel];
    if (labelField?.type === 'select') return labelField.options.find((o) => o.value === raw)?.label || '';
    return cleanText(raw, 40);
  };
  const itemCtx = (item, index) => ({
    ...ctx,
    trail: [...ctx.trail, `${field.label} n° ${index + 1}${itemName(item) ? ` (${itemName(item)})` : ''}`],
  });

  if (field.fixed) {
    // Liste fermée (ex. secteurs) : on ne peut ni ajouter ni supprimer d'élément.
    const byKey = new Map(prevItems.map((it) => [it[field.matchKey], it]));
    const seen = new Set();
    const out = [];
    items.forEach((item, index) => {
      const key = item[field.matchKey];
      if (!byKey.has(key) || seen.has(key)) return;
      seen.add(key);
      const base = byKey.get(key);
      out.push({ ...base, ...sanitizeObject(field.fields, item, base, itemCtx(item, index)), [field.matchKey]: key });
    });
    for (const it of prevItems) if (!seen.has(it[field.matchKey])) out.push(it);
    return out;
  }

  const kept = items.filter((item) => !isBlankItem(field.fields, item)).slice(0, field.maxItems ?? 50);
  const usedIds = new Set();
  return kept.map((item, index) => {
    const prevItem = field.idKey
      ? prevItems.find((p) => p[field.idKey] === item[field.idKey])
      : prevItems[index];
    const clean = sanitizeObject(field.fields, item, prevItem || {}, itemCtx(item, index));
    if (field.idKey) {
      let id = typeof item[field.idKey] === 'string' && ID_RE.test(item[field.idKey]) ? item[field.idKey] : '';
      if (!id || usedIds.has(id)) id = crypto.randomUUID().slice(0, 8);
      usedIds.add(id);
      clean[field.idKey] = id;
    }
    return clean;
  });
}

export function sanitizeObject(fields, input, prev, ctx) {
  const source = isPlainObject(input) ? input : {};
  const previous = isPlainObject(prev) ? prev : {};
  const out = {};
  for (const field of fields) {
    out[field.key] = sanitizeField(field, source[field.key], previous[field.key], ctx);
  }
  return out;
}

// Applique les données d'une page d'administration sur une copie du contenu.
export function applyPageInput(page, content, payload) {
  const errors = [];
  const draft = structuredClone(content);
  const sections = Array.isArray(payload?.sections) ? payload.sections : [];
  page.sections.forEach((section, index) => {
    const input = sections[index];
    if (!isPlainObject(input)) return;
    const target = getAt(draft, section.path);
    if (!isPlainObject(target)) return;
    const clean = sanitizeObject(section.fields, input, target, { errors, trail: [section.title] });
    Object.assign(target, clean);
  });
  return { draft, errors };
}
