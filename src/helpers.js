import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { icon } from './icons.js';
import { escapeHtml, renderMarkdown, applyTokens } from './markdown.js';
import { CONTACT_SECTOR_OPTIONS, SECTOR_OPTIONS, SOCIAL_OPTIONS } from './schema.js';
import { INLINE_JS } from './security.js';

export const NAV = [
  { href: '/offre', label: 'L’offre' },
  { href: '/secteurs', label: 'Secteurs' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export const OPTIONAL_TOKENS = new Set(['capital', 'rcs', 'tva', 'telephone', 'hebergeur_contact']);

// Typographie française : espaces insécables avant « : ; ! ? » et dans les guillemets.
export function frenchTypography(text) {
  return text
    .replace(/ ([:»])/g, ' $1')
    .replace(/ ([;!?])/g, ' $1')
    .replace(/« /g, '« ');
}

export function mapStrings(value, fn) {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]));
  }
  return value;
}

const viewCache = new WeakMap();

// Version « affichage » du contenu : typographie appliquée, mise en cache
// tant que le contenu n'est pas modifié.
export function viewContent(content) {
  let view = viewCache.get(content);
  if (!view) {
    view = mapStrings(content, frenchTypography);
    viewCache.set(content, view);
  }
  return view;
}

export function legalTokens(content, baseUrl) {
  const id = content.legal.identity;
  return {
    nom_site: content.site.name,
    url: content.site.url || baseUrl,
    entreprise: id.company,
    forme_juridique: id.legalForm,
    capital: id.capital,
    siret: id.siret,
    rcs: id.rcs,
    tva: id.vat,
    adresse: id.address,
    directeur_publication: id.director,
    email: content.contact.email,
    telephone: content.contact.phone,
    hebergeur: id.hostName,
    hebergeur_adresse: id.hostAddress,
    hebergeur_contact: id.hostContact,
  };
}

export function renderLegal(body, content, baseUrl) {
  return renderMarkdown(applyTokens(body, legalTokens(content, baseUrl), OPTIONAL_TOKENS));
}

export function telHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(digits)) return `tel:+33${digits.slice(1)}`;
  return `tel:${digits}`;
}

export function mapsHref(address) {
  const query = String(address || '').replace(/\s*\n+\s*/g, ', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function nl2br(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' });
const shortDateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });

export function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : dateFormat.format(d);
}

export function formatShortDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : shortDateFormat.format(d);
}

export function relativeDate(iso, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return 'à l’instant';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day');
  return `le ${formatShortDate(iso)}`;
}

export function sectorLabel(value) {
  return (
    SECTOR_OPTIONS.find((o) => o.value === value)?.label ||
    CONTACT_SECTOR_OPTIONS.find((o) => o.value === value)?.label ||
    ''
  );
}

export function socialLabel(network) {
  return SOCIAL_OPTIONS.find((o) => o.value === network)?.label || 'Lien';
}

export function socialIcon(network, options) {
  const brand = icon(`brand-${network}`, options);
  return brand || icon('link', options);
}

// Versionne les fichiers statiques (cache navigateur longue durée).
export function createAssetHelper(publicDir, cacheable) {
  const cache = new Map();
  return function asset(file) {
    const clean = file.replace(/^\/+/, '');
    let version = cacheable ? cache.get(clean) : undefined;
    if (!version) {
      try {
        const data = fs.readFileSync(path.join(publicDir, clean));
        version = crypto.createHash('sha1').update(data).digest('hex').slice(0, 10);
      } catch {
        version = 'missing';
      }
      if (cacheable) cache.set(clean, version);
    }
    return `/assets/${clean}?v=${version}`;
  };
}

export function jsonForScript(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function viewHelpers(config) {
  return {
    icon,
    md: renderMarkdown,
    escapeHtml,
    nl2br,
    telHref,
    mapsHref,
    formatDate,
    formatShortDate,
    relativeDate,
    sectorLabel,
    socialLabel,
    socialIcon,
    jsonForScript,
    asset: createAssetHelper(path.join(config.root, 'public'), config.isProd),
    nav: NAV,
    inlineJs: INLINE_JS,
    year: () => new Date().getFullYear(),
  };
}

export function organizationJsonLd(c, baseUrl) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: c.site.name,
    description: c.site.description,
    url: `${baseUrl}/`,
    image: baseUrl + (c.site.shareImage || '/assets/images/og.jpg'),
  };
  if (c.site.logo) data.logo = baseUrl + c.site.logo;
  if (c.contact.email) data.email = c.contact.email;
  if (c.contact.phone) data.telephone = c.contact.phone;
  if (c.contact.address) data.address = c.contact.address.replace(/\s*\n+\s*/g, ', ');
  if (c.contact.area) data.areaServed = c.contact.area;
  const sameAs = c.contact.socials.map((s) => s.url).filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;
  return data;
}

export function faqJsonLd(c) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
