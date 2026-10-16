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
    telephone: formatPhone(content.contact.phone),
    hebergeur: id.hostName,
    hebergeur_adresse: id.hostAddress,
    hebergeur_contact: id.hostContact,
  };
}

export function renderLegal(body, content, baseUrl) {
  return renderMarkdown(applyTokens(body, legalTokens(content, baseUrl), OPTIONAL_TOKENS));
}

// Numéro français, quelle que soit sa saisie (06…, +33 6…, 0033 6…) : 10 chiffres.
function frenchNumber(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(digits)) return digits;
  if (/^\+33\d{9}$/.test(digits)) return `0${digits.slice(3)}`;
  if (/^0033\d{9}$/.test(digits)) return `0${digits.slice(4)}`;
  return '';
}

// Affichage : « 07 66 65 35 09 » ; un numéro étranger reste tel que saisi.
export function formatPhone(phone) {
  const fr = frenchNumber(phone);
  return fr ? fr.replace(/(\d{2})(?=\d)/g, '$1 ') : String(phone || '').trim();
}

// Format international (+33…), pour les liens et les moteurs de recherche.
export function phoneE164(phone) {
  const fr = frenchNumber(phone);
  return fr ? `+33${fr.slice(1)}` : String(phone || '').replace(/[^\d+]/g, '');
}

export function telHref(phone) {
  return `tel:${phoneE164(phone)}`;
}

// Paramètres de suivi ajoutés par les réseaux sociaux lors d'un copier-coller.
const TRACKING_PARAMS = /^(utm_\w+|isSelfProfile|igsh|igshid|fbclid|gclid|mibextid|si)$/i;

export function cleanUrl(url) {
  try {
    const u = new URL(url);
    for (const key of [...u.searchParams.keys()]) if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
    return u.toString();
  } catch {
    return url;
  }
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
    formatPhone,
    cleanUrl,
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

// Données structurées (schema.org) ----------------------------------------------

// L'entreprise, référencée par son identifiant depuis les autres pages.
function businessRef(c, baseUrl) {
  return { '@type': 'ProfessionalService', '@id': `${baseUrl}/#business`, name: c.site.name, url: `${baseUrl}/` };
}

function areasServed(contact) {
  const areas = contact.areasServed.filter(Boolean);
  if (!areas.length) return contact.area || undefined;
  return areas.map((name) => ({
    '@type': name === contact.city ? 'City' : /^france$/i.test(name) ? 'Country' : 'AdministrativeArea',
    name,
  }));
}

export function organizationJsonLd(c, baseUrl) {
  const ct = c.contact;
  const data = {
    '@context': 'https://schema.org',
    ...businessRef(c, baseUrl),
    description: c.site.description,
    image: baseUrl + (c.site.shareImage || '/assets/images/og.jpg'),
    logo: baseUrl + (c.site.logo || '/assets/images/logo-512.png'),
  };
  if (c.site.shareName && c.site.shareName !== c.site.name) data.alternateName = c.site.shareName;
  if (ct.email) data.email = ct.email;
  if (ct.phone) data.telephone = phoneE164(ct.phone);
  if (ct.city || ct.address) {
    data.address = { '@type': 'PostalAddress' };
    if (ct.address) data.address.streetAddress = ct.address.replace(/\s*\n+\s*/g, ', ');
    if (ct.city) data.address.addressLocality = ct.city;
    if (ct.postalCode) data.address.postalCode = ct.postalCode;
    if (ct.region) data.address.addressRegion = ct.region;
    data.address.addressCountry = 'FR';
  }
  const areas = areasServed(ct);
  if (areas) data.areaServed = areas;
  if (ct.founder) data.founder = { '@type': 'Person', name: ct.founder };
  const sameAs = ct.socials.map((s) => cleanUrl(s.url)).filter(Boolean);
  if (sameAs.length) data.sameAs = sameAs;
  // Les modules principaux de l'offre (les premiers de la liste).
  data.knowsAbout = [...new Set(['Création de site internet', ...c.offer.features.slice(0, 5).map((f) => f.title)])];
  return data;
}

// Page secteur : le service proposé à ce métier et le fil d'Ariane.
export function sectorJsonLd(c, sector, baseUrl) {
  const url = `${baseUrl}/secteurs/${sector.slug}`;
  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: sector.seo.h1 || sector.title,
    serviceType: 'Création de site internet',
    description: sector.seo.description || sector.intro,
    provider: businessRef(c, baseUrl),
    audience: { '@type': 'BusinessAudience', name: sector.name },
    url,
  };
  const areas = areasServed(c.contact);
  if (areas) service.areaServed = areas;
  return [service, breadcrumbJsonLd(baseUrl, [['Accueil', '/'], ['Secteurs', '/secteurs'], [sector.name, `/secteurs/${sector.slug}`]])];
}

export function breadcrumbJsonLd(baseUrl, trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: baseUrl + href })),
  };
}

export function faqJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
