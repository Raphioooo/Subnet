// Source OpenStreetMap : commerces d'une zone via l'API Overpass, et
// géocodage de la ville via Nominatim. Données © les contributeurs d'OpenStreetMap (ODbL).

import { classifyTags, normalizePhone } from '../prospects.js';

const USER_AGENT = 'Subnet prospection/1.0 (https://subnet-online.com ; hello@subnet-online.com)';

// Serveurs essayés dans l'ordre : le principal, puis des miroirs publics.
export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// Attributs OSM interrogés, par secteur de prospection. Les requêtes sont
// découpées par famille : les miroirs refusent les requêtes trop lourdes.
const FAMILIES = {
  restaurant: ['nwr["amenity"~"^(restaurant|fast_food|food_court)$"]["name"];', 'nwr["shop"="caterer"]["name"];'],
  bar: ['nwr["amenity"~"^(cafe|bar|pub|biergarten|nightclub)$"]["name"];'],
  coiffeur: ['nwr["shop"="hairdresser"]["name"];'],
  beaute: ['nwr["shop"~"^(beauty|nails|cosmetics|perfumery|pet_grooming)$"]["name"];'],
  tatoueur: ['nwr["shop"~"^(tattoo|piercing)$"]["name"];'],
  'bien-etre': [
    'nwr["shop"="massage"]["name"];nwr["leisure"~"^(fitness_centre|sports_centre|dance|sauna|climbing|horse_riding)$"]["name"];',
    'nwr["healthcare"~"^(physiotherapist|osteopath|psychotherapist|nutrition_counselling|alternative|podiatrist|midwife|speech_therapist|occupational_therapist)$"]["name"];nwr["office"~"^(therapist|yoga)$"]["name"];nwr["amenity"~"^(dojo|veterinary)$"]["name"];',
  ],
  artisan: [
    'nwr["craft"]["name"];',
    'nwr["shop"~"^(bicycle|car_repair|tyres|motorcycle|photo|tailor|dry_cleaning|laundry|locksmith|mobile_phone|computer|copyshop|frame)$"]["name"];nwr["office"="photographer"]["name"];',
  ],
  commerce: [
    'nwr["shop"~"^(florist|bakery|pastry|butcher|cheese|deli|chocolate|confectionery|greengrocer|seafood|wine|coffee|tea|health_food|herbalist)$"]["name"];nwr["amenity"="ice_cream"]["name"];',
    'nwr["shop"~"^(clothes|shoes|boutique|jewelry|watches|bag|gift|books|toys|games|sports|outdoor|optician|furniture|interior_decoration|art|craft|fabric|music|musical_instrument|second_hand|hardware|e-cigarette|pet)$"]["name"];',
  ],
  autre: [
    'nwr["office"~"^(architect|accountant|estate_agent|coworking|graphic_design|advertising_agency|consulting|it|association|tutoring)$"]["name"];nwr["amenity"~"^(driving_school|music_school|language_school)$"]["name"];nwr["leisure"~"^(escape_game|bowling_alley)$"]["name"];nwr["shop"="travel_agency"]["name"];',
  ],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Taille maximale d'une réponse (les miroirs sont des serveurs tiers).
const MAX_RESPONSE_BYTES = 30 * 1024 * 1024;

async function readBounded(res, maxBytes) {
  if (Number(res.headers.get('content-length')) > maxBytes) throw new Error('réponse trop volumineuse');
  const chunks = [];
  let size = 0;
  for await (const chunk of res.body) {
    size += chunk.byteLength;
    if (size > maxBytes) throw new Error('réponse trop volumineuse');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function fetchText(url, { method = 'GET', body, timeoutMs = 90000, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const res = await fetch(url, { method, body, signal: controller.signal, headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    try {
      return { ok: res.ok, status: res.status, text: await readBounded(res, MAX_RESPONSE_BYTES) };
    } catch (err) {
      controller.abort();
      throw err;
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

// Ville → coordonnées et emprise. Nominatim limite à une requête par seconde.
const geocodeCache = new Map();
export async function geocodeCity(city, { fetchImpl = fetchText, signal } = {}) {
  const key = city.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: city, format: 'jsonv2', limit: '1', countrycodes: 'fr', 'accept-language': 'fr' })}`;
  const res = await fetchImpl(url, { timeoutMs: 15000, signal });
  if (!res.ok) throw new Error(`Géocodage impossible (${res.status}).`);
  const [hit] = JSON.parse(res.text);
  if (!hit) throw new Error(`Ville introuvable : « ${city} ».`);
  const place = { name: hit.name || city, displayName: hit.display_name, lat: Number(hit.lat), lon: Number(hit.lon) };
  geocodeCache.set(key, place);
  return place;
}

// Emprise (sud, ouest, nord, est) autour d'un point.
export function bboxAround(lat, lon, radiusKm) {
  const dLat = radiusKm / 111;
  const dLon = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return [lat - dLat, lon - dLon, lat + dLat, lon + dLon].map((n) => n.toFixed(5)).join(',');
}

// Chaque serveur est essayé à tour de rôle ; après un échec général, une
// seconde passe a lieu après une pause (les serveurs publics saturent par moments).
async function runQuery(query, { endpoints, fetchImpl, signal, log, retryDelayMs }) {
  let lastError = 'Overpass indisponible.';
  for (let pass = 1; pass <= 2; pass += 1) {
    for (const endpoint of endpoints) {
      if (signal?.aborted) throw new Error('Recherche interrompue.');
      const host = new URL(endpoint).host;
      try {
        const res = await fetchImpl(`${endpoint}?${new URLSearchParams({ data: query })}`, { timeoutMs: 95000, signal });
        if (res.ok) return JSON.parse(res.text).elements || [];
        lastError = `Overpass ${res.status} (${host})`;
      } catch (err) {
        lastError = `${host} : ${err.message}`;
      }
      log?.warn?.(`Prospection : ${lastError}`);
    }
    if (pass === 1) await sleep(retryDelayMs);
  }
  throw new Error(lastError);
}

// Élément OSM → prospect brut (avant score et messages).
export function fromOsmElement(el) {
  const t = el.tags || {};
  const phone = normalizePhone(t['contact:whatsapp']) || normalizePhone(t['contact:mobile']) || normalizePhone(t.mobile) || normalizePhone(t['contact:phone']) || normalizePhone(t.phone);
  if (!phone || !t.name) return null;
  const { sector, kind, label } = classifyTags(t);
  const instagram = t['contact:instagram'] || '';
  return {
    source: 'osm',
    sourceId: `${el.type}/${el.id}`,
    name: t.name,
    sector,
    kind,
    kindLabel: label,
    phone,
    phoneKind: t['contact:whatsapp'] ? 'whatsapp' : /^0[67]/.test(phone) ? 'mobile' : 'fixe',
    address: {
      street: [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '),
      postcode: t['addr:postcode'] || '',
      city: t['addr:city'] || '',
    },
    lat: el.lat ?? el.center?.lat ?? null,
    lon: el.lon ?? el.center?.lon ?? null,
    website: t.website || t['contact:website'] || t.url || '',
    instagram: /^https?:/.test(instagram) ? instagram : instagram ? `https://www.instagram.com/${instagram.replace(/^@/, '')}/` : '',
    facebook: t['contact:facebook'] || '',
    email: t['contact:email'] || t.email || '',
    openingHours: t.opening_hours || '',
    chain: Boolean(t.brand || t['brand:wikidata']),
    osmEditedAt: el.timestamp || '',
  };
}

// Recherche les commerces d'une zone. onProgress(famille, nombre) suit l'avancement.
export async function searchOverpass({ bbox, sectors, onProgress, endpoints = OVERPASS_ENDPOINTS, fetchImpl = fetchText, signal, log, retryDelayMs = 15000 }) {
  const seen = new Map();
  let failures = 0;
  let consecutive = 0;
  const families = sectors.flatMap((sector) => (FAMILIES[sector] || []).map((body) => [sector, body]));
  for (const [sector, body] of families) {
    const query = `[out:json][timeout:60][bbox:${bbox}];(${body});out tags center meta;`;
    try {
      const elements = await runQuery(query, { endpoints, fetchImpl, signal, log, retryDelayMs });
      for (const el of elements) {
        const p = fromOsmElement(el);
        if (p && !seen.has(p.sourceId)) seen.set(p.sourceId, p);
      }
      onProgress?.(sector, seen.size);
      consecutive = 0;
    } catch (err) {
      if (signal?.aborted) throw new Error('Recherche interrompue.');
      failures += 1;
      consecutive += 1;
      log?.warn?.(`Prospection : ${sector} ignoré (${err.message})`);
      // Deux échecs d'affilée sur tous les serveurs : inutile d'insister.
      if (failures >= families.length || consecutive >= 2) throw err;
    }
    // Un peu de répit entre deux requêtes : les miroirs publics sont partagés.
    if (families.length > 1) await sleep(signal ? 1500 : 0);
  }
  return { items: [...seen.values()], failures };
}
