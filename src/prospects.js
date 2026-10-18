// Prospection : entreprises locales sans site à contacter sur WhatsApp.
// Modèle, secteurs, score de réponse estimé et messages prêts à envoyer.

import crypto from 'node:crypto';
import { cleanText, isPlainObject } from './sanitize.js';

export const PROSPECT_STATUSES = [
  { value: 'a-contacter', label: 'À contacter' },
  { value: 'envoye', label: 'Message envoyé' },
  { value: 'repondu', label: 'A répondu' },
  { value: 'rdv', label: 'Rendez-vous' },
  { value: 'client', label: 'Client' },
  { value: 'refus', label: 'Pas intéressé' },
  { value: 'stop', label: 'Ne plus contacter' },
];

// Secteurs de prospection, avec le nom utilisé dans les messages et la
// fonctionnalité du site à mettre en avant.
export const PROSPECT_SECTORS = [
  { value: 'restaurant', label: 'Restaurants', noun: 'un restaurant', plural: 'restaurants', feature: 'la réservation en ligne', base: 18 },
  { value: 'bar', label: 'Bars et cafés', noun: 'un bar', plural: 'bars', feature: 'la carte et la réservation en ligne', base: 12 },
  { value: 'coiffeur', label: 'Coiffeurs et barbiers', noun: 'un coiffeur', plural: 'coiffeurs', feature: 'la prise de rendez-vous en ligne', base: 16 },
  { value: 'beaute', label: 'Instituts et beauté', noun: 'un institut', plural: 'instituts', feature: 'la prise de rendez-vous et l’acompte en ligne', base: 18 },
  { value: 'tatoueur', label: 'Tatoueurs', noun: 'un tatoueur', plural: 'tatoueurs', feature: 'l’acompte en ligne', base: 20 },
  { value: 'bien-etre', label: 'Bien-être et sport', noun: 'un pro du bien-être', plural: 'pros du bien-être', feature: 'la réservation des séances', base: 14 },
  { value: 'artisan', label: 'Artisans et services', noun: 'un artisan', plural: 'artisans', feature: 'la demande de devis en ligne', base: 12 },
  { value: 'commerce', label: 'Commerces', noun: 'un commerce', plural: 'commerces', feature: 'la commande en ligne', base: 10 },
  { value: 'autre', label: 'Autres', noun: 'une entreprise', plural: 'entreprises', feature: 'la prise de contact en ligne', base: 8 },
];

export const sectorOf = (value) => PROSPECT_SECTORS.find((s) => s.value === value) || PROSPECT_SECTORS.at(-1);
export const prospectSectorLabel = (value) => sectorOf(value).label;
export const prospectStatusLabel = (value) => PROSPECT_STATUSES.find((s) => s.value === value)?.label || value;

// Activités OpenStreetMap → secteur et libellé en français.
const KINDS = {
  'amenity=restaurant': ['restaurant', 'Restaurant'],
  'amenity=fast_food': ['restaurant', 'Restauration rapide'],
  'amenity=food_court': ['restaurant', 'Restaurant'],
  'amenity=cafe': ['bar', 'Café'],
  'amenity=bar': ['bar', 'Bar'],
  'amenity=pub': ['bar', 'Pub'],
  'amenity=biergarten': ['bar', 'Bar'],
  'amenity=nightclub': ['bar', 'Discothèque'],
  'amenity=ice_cream': ['commerce', 'Glacier'],
  'amenity=driving_school': ['autre', 'Auto-école'],
  'amenity=veterinary': ['bien-etre', 'Vétérinaire'],
  'amenity=music_school': ['autre', 'École de musique'],
  'amenity=language_school': ['autre', 'École de langues'],
  'amenity=dojo': ['bien-etre', 'Dojo'],
  'shop=hairdresser': ['coiffeur', 'Coiffeur'],
  'shop=beauty': ['beaute', 'Institut de beauté'],
  'shop=nails': ['beaute', 'Onglerie'],
  'shop=cosmetics': ['beaute', 'Cosmétiques'],
  'shop=perfumery': ['beaute', 'Parfumerie'],
  'shop=massage': ['bien-etre', 'Massage'],
  'shop=tattoo': ['tatoueur', 'Tatoueur'],
  'shop=piercing': ['tatoueur', 'Piercing'],
  'shop=florist': ['commerce', 'Fleuriste'],
  'shop=bakery': ['commerce', 'Boulangerie'],
  'shop=pastry': ['commerce', 'Pâtisserie'],
  'shop=butcher': ['commerce', 'Boucherie'],
  'shop=cheese': ['commerce', 'Fromagerie'],
  'shop=deli': ['commerce', 'Épicerie fine'],
  'shop=chocolate': ['commerce', 'Chocolaterie'],
  'shop=confectionery': ['commerce', 'Confiserie'],
  'shop=greengrocer': ['commerce', 'Primeur'],
  'shop=seafood': ['commerce', 'Poissonnerie'],
  'shop=wine': ['commerce', 'Caviste'],
  'shop=coffee': ['commerce', 'Torréfacteur'],
  'shop=tea': ['commerce', 'Salon de thé'],
  'shop=caterer': ['restaurant', 'Traiteur'],
  'shop=clothes': ['commerce', 'Boutique de vêtements'],
  'shop=shoes': ['commerce', 'Boutique de chaussures'],
  'shop=boutique': ['commerce', 'Boutique'],
  'shop=jewelry': ['commerce', 'Bijouterie'],
  'shop=watches': ['commerce', 'Horlogerie'],
  'shop=bag': ['commerce', 'Maroquinerie'],
  'shop=gift': ['commerce', 'Boutique cadeaux'],
  'shop=books': ['commerce', 'Librairie'],
  'shop=toys': ['commerce', 'Magasin de jouets'],
  'shop=games': ['commerce', 'Boutique de jeux'],
  'shop=sports': ['commerce', 'Articles de sport'],
  'shop=outdoor': ['commerce', 'Boutique outdoor'],
  'shop=bicycle': ['artisan', 'Vélociste'],
  'shop=car_repair': ['artisan', 'Garage'],
  'shop=tyres': ['artisan', 'Pneus'],
  'shop=motorcycle': ['artisan', 'Motos'],
  'shop=photo': ['artisan', 'Photographe'],
  'shop=tailor': ['artisan', 'Retoucherie'],
  'shop=dry_cleaning': ['artisan', 'Pressing'],
  'shop=laundry': ['artisan', 'Laverie'],
  'shop=locksmith': ['artisan', 'Serrurier'],
  'shop=pet_grooming': ['beaute', 'Toilettage'],
  'shop=pet': ['commerce', 'Animalerie'],
  'shop=optician': ['commerce', 'Opticien'],
  'shop=furniture': ['commerce', 'Magasin de meubles'],
  'shop=interior_decoration': ['commerce', 'Décoration'],
  'shop=frame': ['artisan', 'Encadreur'],
  'shop=art': ['commerce', 'Galerie'],
  'shop=craft': ['commerce', 'Loisirs créatifs'],
  'shop=fabric': ['commerce', 'Tissus'],
  'shop=music': ['commerce', 'Disquaire'],
  'shop=musical_instrument': ['commerce', 'Instruments de musique'],
  'shop=second_hand': ['commerce', 'Friperie'],
  'shop=health_food': ['commerce', 'Épicerie bio'],
  'shop=herbalist': ['commerce', 'Herboristerie'],
  'shop=hardware': ['commerce', 'Quincaillerie'],
  'shop=e-cigarette': ['commerce', 'Boutique de vape'],
  'shop=mobile_phone': ['artisan', 'Réparation de téléphones'],
  'shop=computer': ['artisan', 'Informatique'],
  'shop=copyshop': ['artisan', 'Reprographie'],
  'shop=travel_agency': ['autre', 'Agence de voyages'],
  'leisure=fitness_centre': ['bien-etre', 'Salle de sport'],
  'leisure=sports_centre': ['bien-etre', 'Centre sportif'],
  'leisure=dance': ['bien-etre', 'École de danse'],
  'leisure=sauna': ['bien-etre', 'Sauna'],
  'leisure=escape_game': ['autre', 'Escape game'],
  'leisure=bowling_alley': ['autre', 'Bowling'],
  'leisure=climbing': ['bien-etre', 'Salle d’escalade'],
  'leisure=horse_riding': ['bien-etre', 'Centre équestre'],
  'healthcare=physiotherapist': ['bien-etre', 'Kinésithérapeute'],
  'healthcare=osteopath': ['bien-etre', 'Ostéopathe'],
  'healthcare=psychotherapist': ['bien-etre', 'Psychothérapeute'],
  'healthcare=nutrition_counselling': ['bien-etre', 'Diététicien'],
  'healthcare=alternative': ['bien-etre', 'Médecine douce'],
  'healthcare=podiatrist': ['bien-etre', 'Podologue'],
  'healthcare=midwife': ['bien-etre', 'Sage-femme'],
  'healthcare=speech_therapist': ['bien-etre', 'Orthophoniste'],
  'healthcare=occupational_therapist': ['bien-etre', 'Ergothérapeute'],
  'office=architect': ['autre', 'Architecte'],
  'office=accountant': ['autre', 'Expert-comptable'],
  'office=estate_agent': ['autre', 'Agence immobilière'],
  'office=coworking': ['autre', 'Coworking'],
  'office=graphic_design': ['autre', 'Graphiste'],
  'office=advertising_agency': ['autre', 'Agence de communication'],
  'office=photographer': ['artisan', 'Photographe'],
  'office=consulting': ['autre', 'Conseil'],
  'office=it': ['autre', 'Informatique'],
  'office=association': ['autre', 'Association'],
  'office=therapist': ['bien-etre', 'Thérapeute'],
  'office=yoga': ['bien-etre', 'Yoga'],
  'office=tutoring': ['autre', 'Soutien scolaire'],
  'office=company': ['autre', 'Entreprise'],
};

const CRAFTS = {
  plumber: 'Plombier',
  electrician: 'Électricien',
  carpenter: 'Menuisier',
  joiner: 'Menuisier',
  painter: 'Peintre en bâtiment',
  photographer: 'Photographe',
  tailor: 'Couturier',
  dressmaker: 'Couturière',
  shoemaker: 'Cordonnier',
  upholsterer: 'Tapissier',
  caterer: 'Traiteur',
  hvac: 'Chauffagiste',
  roofer: 'Couvreur',
  tiler: 'Carreleur',
  plasterer: 'Plâtrier',
  gardener: 'Paysagiste',
  beekeeper: 'Apiculteur',
  brewery: 'Brasserie artisanale',
  winery: 'Vigneron',
  jeweller: 'Joaillier',
  key_cutter: 'Serrurier',
  locksmith: 'Serrurier',
  cleaning: 'Nettoyage',
  window_construction: 'Menuisier',
  glaziery: 'Vitrier',
  blacksmith: 'Ferronnier',
  metal_construction: 'Métallier',
  pottery: 'Potier',
  confectionery: 'Confiseur',
  bakery: 'Boulanger',
  handicraft: 'Artisan',
  sculptor: 'Sculpteur',
  stonemason: 'Tailleur de pierre',
  floorer: 'Solier',
  parquet_layer: 'Parqueteur',
  scaffolder: 'Échafaudeur',
  builder: 'Maçon',
  mason: 'Maçon',
  insulation: 'Isolation',
  electronics_repair: 'Réparation électronique',
  car_repair: 'Garage',
  bicycle_repair: 'Réparateur de vélos',
  watchmaker: 'Horloger',
  optician: 'Opticien',
  printer: 'Imprimeur',
  signmaker: 'Enseigniste',
  cabinet_maker: 'Ébéniste',
  furniture: 'Ébéniste',
  interior_decorator: 'Décorateur',
  floor_layer: 'Solier',
  sawmill: 'Scierie',
  distillery: 'Distillerie',
  chocolatier: 'Chocolatier',
  piano_tuner: 'Accordeur de pianos',
  luthier: 'Luthier',
  bookbinder: 'Relieur',
};

const CUISINES = {
  italian: 'italien',
  pizza: 'pizzeria',
  japanese: 'japonais',
  sushi: 'sushis',
  chinese: 'chinois',
  thai: 'thaï',
  vietnamese: 'vietnamien',
  indian: 'indien',
  lebanese: 'libanais',
  kebab: 'kebab',
  burger: 'burgers',
  french: 'français',
  regional: 'traditionnel',
  crepe: 'crêperie',
  pancake: 'crêperie',
  savoyard: 'savoyard',
  asian: 'asiatique',
  korean: 'coréen',
  mexican: 'mexicain',
  spanish: 'espagnol',
  tapas: 'tapas',
  greek: 'grec',
  turkish: 'turc',
  moroccan: 'marocain',
  african: 'africain',
  american: 'américain',
  steak_house: 'grill',
  seafood: 'poissons et fruits de mer',
  vegetarian: 'végétarien',
  vegan: 'végan',
  sandwich: 'sandwichs',
  bagel: 'bagels',
  noodle: 'nouilles',
  ramen: 'ramen',
  tacos: 'tacos',
  brasserie: 'brasserie',
  bistro: 'bistrot',
  coffee_shop: 'coffee shop',
  tea: 'salon de thé',
  pastry: 'pâtisserie',
  ice_cream: 'glacier',
};

// Secteur et libellé d'activité à partir des attributs OpenStreetMap.
export function classifyTags(tags = {}) {
  if (tags.craft) {
    const label = CRAFTS[tags.craft] || 'Artisan';
    return { sector: 'artisan', kind: `craft=${tags.craft}`, label };
  }
  for (const key of ['shop', 'amenity', 'leisure', 'healthcare', 'office']) {
    const value = tags[key];
    if (!value) continue;
    const kind = `${key}=${value}`;
    const found = KINDS[kind];
    if (found) {
      let label = found[1];
      if (kind === 'shop=hairdresser' && ((tags.male === 'yes' && tags.female !== 'yes') || /barb/i.test(tags.name || ''))) label = 'Barbier';
      if (kind === 'shop=beauty' && tags.beauty) label = { nails: 'Onglerie', tanning: 'Centre de bronzage', spa: 'Spa', massage: 'Massage', hair_removal: 'Épilation' }[tags.beauty] || label;
      if ((kind === 'amenity=restaurant' || kind === 'amenity=fast_food') && tags.cuisine) {
        const cuisine = CUISINES[String(tags.cuisine).split(';')[0]];
        if (cuisine) label = /erie|pizzeria|glacier|brasserie|bistrot|coffee|salon|sushis|burgers|tacos|tapas|bagels|sandwichs|ramen|nouilles|kebab|grill/.test(cuisine) ? cap(cuisine) : `Restaurant ${cuisine}`;
      }
      return { sector: found[0], kind, label };
    }
    const fallback = { shop: ['commerce', 'Commerce'], amenity: ['autre', 'Établissement'], leisure: ['bien-etre', 'Loisirs'], healthcare: ['bien-etre', 'Santé'], office: ['autre', 'Bureau'] }[key];
    return { sector: fallback[0], kind, label: fallback[1] };
  }
  return { sector: 'autre', kind: '', label: 'Entreprise' };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Téléphone français à 10 chiffres (06 12 34 56 78 → 0612345678), sinon ''.
export function normalizePhone(raw) {
  if (!raw) return '';
  // Liens WhatsApp (https://wa.me/33612345678) et notation « +33 (0)6 … ».
  const cleaned = String(raw)
    .replace(/^(https?:\/\/)?(api\.)?(wa\.me|whatsapp\.com\/send\?phone=)\/?/i, '+')
    .replace(/\(0\)/g, '');
  const first = cleaned.split(/[;,/]| ou /)[0].trim();
  let d = first.replace(/[^\d+]/g, '');
  if (d.startsWith('+33')) d = `0${d.slice(3)}`;
  else if (d.startsWith('0033')) d = `0${d.slice(4)}`;
  else if (d.startsWith('33') && d.length === 11) d = `0${d.slice(2)}`;
  return /^0[1-9]\d{8}$/.test(d) ? d : '';
}

export const isMobile = (phone) => /^0[67]/.test(phone);

// Lien qui ouvre WhatsApp avec le message prérempli.
// Fiche Google Maps : l'adresse exacte de la fiche quand on la connaît (Google Places
// ou vérification manuelle), sinon une recherche Maps « nom + adresse » qui ouvre la fiche.
export function googleMapsLink(p) {
  if (p?.google?.mapsUrl) return p.google.mapsUrl;
  const address = p?.address || {};
  const query = [p?.name, address.street, address.postcode, address.city].filter(Boolean).join(' ').trim();
  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function whatsappLink(phone, text = '') {
  const digits = normalizePhone(phone);
  if (!digits) return '';
  const url = new URL(`https://wa.me/33${digits.slice(1)}`);
  if (text) url.searchParams.set('text', text);
  return url.toString();
}

// Clé de dédoublonnage : le téléphone, sinon le nom et la ville.
export function prospectKey(p) {
  const phone = normalizePhone(p.phone);
  if (phone) return `tel:${phone}`;
  return `nom:${fold(p.name)}|${fold(p.address?.city || p.city || '')}`;
}

export function fold(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Graine stable par entreprise : le même prospect reçoit toujours les mêmes variantes.
function seedOf(p) {
  const variant = Number(p.messageVariant) || 0;
  return crypto.createHash('sha1').update(`${p.id || p.sourceId || p.name || ''}#${variant}`).digest();
}
// Un octet différent de l'empreinte par emplacement : les variantes ne sont pas couplées.
const pick = (list, seed, slot) => list[seed[slot % seed.length] % list.length];

// Score : probabilité estimée (en %) d'obtenir une réponse positive. Les
// raisons sont affichées dans l'admin pour que le choix reste lisible.
export function scoreProspect(p) {
  const sector = sectorOf(p.sector);
  const reasons = [];
  let score = sector.base;
  const g = p.google || null;

  if (!p.website) {
    score += 10;
    reasons.push({ text: 'Sans site', good: true });
  } else {
    score -= 15;
    reasons.push({ text: 'A déjà un site', good: false });
  }
  if (p.phoneKind === 'whatsapp') {
    score += 8;
    reasons.push({ text: 'WhatsApp confirmé', good: true });
  } else if (p.phoneKind === 'mobile') {
    score += 5;
    reasons.push({ text: 'Numéro mobile', good: true });
  } else if (p.phone) {
    score -= 4;
    reasons.push({ text: 'Ligne fixe', good: false });
  }
  if (p.instagram && !p.website) {
    score += 5;
    reasons.push({ text: 'Instagram sans site', good: true });
  }
  if (p.chain) {
    score -= 12;
    reasons.push({ text: 'Enseigne ou franchise', good: false });
  }
  if (g && typeof g.rating === 'number' && g.reviews) {
    const stars = `${String(g.rating).replace('.', ',')} ★ (${g.reviews} avis)`;
    if (g.rating >= 4.5 && g.reviews >= 15 && g.reviews <= 400) {
      score += 6;
      reasons.push({ text: stars, good: true });
    } else if (g.rating >= 4 && g.reviews >= 5) {
      score += 3;
      reasons.push({ text: stars, good: true });
    } else if (g.rating < 3.8 && g.reviews >= 10) {
      score -= 2;
      reasons.push({ text: `${stars} : image à redresser`, good: false });
    } else {
      reasons.push({ text: stars, good: null });
    }
    if (g.reviews > 600) {
      score -= 4;
      reasons.push({ text: 'Très gros volume d’avis', good: false });
    }
  }
  if (g?.status === 'CLOSED_TEMPORARILY') {
    score -= 10;
    reasons.push({ text: 'Fermé temporairement', good: false });
  }
  if (g?.status === 'CLOSED_PERMANENTLY' || p.verified?.open === false) {
    score = 2;
    reasons.push({ text: 'Fermé définitivement', good: false });
  }
  if (p.openingHours) score += 1;
  if (p.verified?.open === true) {
    score += 2;
    reasons.push({ text: 'Activité vérifiée', good: true });
  }
  if (p.verified?.found === false) {
    score -= 5;
    reasons.push({ text: 'Non retrouvée en ligne', good: false });
  }
  const adjust = Math.max(-10, Math.min(10, Math.round(Number(p.scoreAdjust)) || 0));
  if (adjust) {
    score += adjust;
    reasons.push({ text: `${adjust > 0 ? '+' : ''}${adjust} : ${p.scoreAdjustReason || 'ajustement du rédacteur'}`, good: adjust > 0 });
  }
  score = Math.max(2, Math.min(55, Math.round(score)));
  const label = score >= 35 ? 'Très bon' : score >= 25 ? 'Bon' : score >= 15 ? 'Moyen' : 'Faible';
  return { score, label, reasons };
}

// Nom d'affichage de la ville (« Saint-Martin-d'Hères » plutôt qu'une chaîne vide).
export function cityOf(p) {
  return p.address?.city || p.city || 'Grenoble';
}

const INTROS = [
  'Bonjour, je m’appelle Raphaël, je crée des sites internet pour les indépendants de Grenoble et des environs.',
  'Bonjour, Raphaël de Subnet, je fais des sites pour les commerces du coin (je suis basé à Grenoble).',
  'Bonjour ! Raphaël, développeur web à Grenoble.',
];

const OFFERS = {
  restaurant: [
    'Je fais des sites avec la réservation intégrée (et un acompte si vous voulez limiter les no-show), sans commission, à l’inverse de TheFork.',
    'Mon truc, c’est le site de restaurant avec carte à jour, réservation en ligne et acompte possible, sans commission sur les couverts.',
  ],
  bar: [
    'Je fais des sites simples avec la carte, les horaires, les événements et la réservation de table ou la privatisation.',
    'Je fais des sites de bar qui servent vraiment : horaires, carte, soirées, et une réservation en ligne pour les groupes.',
  ],
  coiffeur: [
    'Je fais des sites avec la prise de rendez-vous en ligne, sans commission ni abonnement du type Planity.',
    'Je monte des sites de salon avec réservation en ligne 24h/24, les rappels par SMS, et pas d’abonnement Planity derrière.',
  ],
  beaute: [
    'Je fais des sites avec la prise de rendez-vous et l’acompte en ligne, sans passer par Planity et sans commission.',
    'Je monte des sites d’institut avec réservation en ligne, acompte pour les soins longs et rappels automatiques.',
  ],
  tatoueur: [
    'Je fais des sites de tatoueur avec portfolio, demande de projet et acompte en ligne, pour éviter les lapins.',
    'Je monte des sites avec le book, un formulaire de projet (taille, emplacement, références) et l’acompte réglé en ligne.',
  ],
  'bien-etre': [
    'Je fais des sites avec le planning et la réservation des séances en ligne, paiement inclus.',
    'Je monte des sites simples avec réservation de créneaux, paiement en ligne et rappels, pour que ça tourne sans vous.',
  ],
  artisan: [
    'Je fais des sites simples où les clients demandent un devis en deux minutes, avec vos réalisations et vos avis.',
    'Je monte des sites d’artisan qui ramènent des demandes de devis : réalisations, zone d’intervention, formulaire court.',
  ],
  commerce: [
    'Je fais des sites simples avec vos produits, vos horaires et la commande ou le click & collect en ligne.',
    'Je monte des sites de boutique avec les nouveautés, les horaires et la commande en ligne, sans plateforme au milieu.',
  ],
  autre: [
    'Je fais des sites simples et efficaces pour les indépendants : présentation, prise de contact, réservation si besoin.',
    'Je monte des sites clairs pour les pros : qui vous êtes, ce que vous faites, et un moyen simple de vous contacter.',
  ],
};

const CTAS = [
  'Si ça vous parle, je passe vous montrer un exemple en cinq minutes, quand c’est calme chez vous.',
  'Si vous voulez voir ce que ça donne, je vous envoie un exemple ici, sans engagement.',
  'Dites-moi si ça vaut le coup qu’on en discute, sinon pas de souci.',
];
// Trop loin de Grenoble pour « passer » : on propose un exemple à distance.
const REMOTE_CTAS = [
  'Si vous voulez voir ce que ça donne, je vous envoie un exemple ici, sans engagement.',
  'Dites-moi si ça vaut le coup qu’on en parle dix minutes au téléphone, sinon pas de souci.',
];

const GRENOBLE = { lat: 45.188, lon: 5.724 };

// Distance à vol d'oiseau avec Grenoble, en km (null si la position est inconnue).
export function distanceFromGrenoble(p) {
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return null;
  const rad = Math.PI / 180;
  const dLat = (p.lat - GRENOBLE.lat) * rad;
  const dLon = (p.lon - GRENOBLE.lon) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(GRENOBLE.lat * rad) * Math.cos(p.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export function isNearGrenoble(p) {
  const km = distanceFromGrenoble(p);
  if (km !== null) return km <= 35;
  return /^38/.test(p.address?.postcode || '') || /grenoble|échirolles|echirolles|meylan|fontaine|seyssinet|eybens|gières|gieres|tronche|saint-martin-d|sassenage|voiron|vizille|crolles/i.test(cityOf(p));
}

const SIGNOFFS = ['Bonne journée !', 'Belle journée,\nRaphaël', 'À bientôt peut-être !'];

const stars = (g) => `${String(g.rating).replace('.', ',')} sur Google avec ${g.reviews} avis`;

function hookFor(p, seed) {
  const noun = sectorOf(p.sector).noun;
  const city = cityOf(p);
  const g = p.google;
  const options = [];
  if (p.website) {
    options.push(`Je suis tombé sur ${p.name} en cherchant ${noun} à ${city}. J’ai regardé votre site : il présente bien l’activité, mais, si je ne me trompe pas, on ne peut ni réserver ni commander dessus.`);
    options.push(`J’ai vu le site de ${p.name} en cherchant ${noun} à ${city}. Il fait le travail, mais tout passe encore par le téléphone : pas de réservation ni de prise de contact rapide en ligne.`);
  } else if (g && g.rating >= 4.3 && g.reviews >= 10) {
    // Un chiffre vrai (note et avis Google) vaut mieux que n'importe quelle formule.
    const insta = p.instagram && !p.website ? ' Le compte Instagram est là, mais pas de site.' : '';
    options.push(`Je suis tombé sur ${p.name} en cherchant ${noun} à ${city} : ${stars(g)}, c’est costaud, mais pas de site pour le montrer, ni de réservation en ligne.${insta}`);
    options.push(`${stars(g)} pour ${p.name}, ça ne s’invente pas. Par contre je n’ai pas trouvé de site : tout passe par la fiche Google et le téléphone.${insta}`);
  } else if (p.instagram && !p.website) {
    options.push(`J’ai vu ${p.name} passer sur Instagram, les photos donnent envie, mais je n’ai pas trouvé de site, juste le compte et la fiche Google.`);
    options.push(`Je suis tombé sur le compte Instagram de ${p.name} : chouette compte, mais pas de site derrière, et donc rien pour réserver ou commander sans vous écrire.`);
  } else {
    options.push(`Je cherchais ${noun} du côté de ${city} et je suis tombé sur ${p.name} : pas de site si je ne me trompe pas, seulement la fiche Google et le téléphone.`);
    options.push(`En regardant les ${sectorOf(p.sector).plural} de ${city}, j’ai vu que ${p.name} n’avait pas de site, juste la fiche Google. C’est souvent par choix, mais ça fait perdre des clients le soir et le dimanche.`);
  }
  let hook = pick(options, seed, 2);
  if (p.phoneKind === 'whatsapp') hook += ' Vous gérez visiblement tout par WhatsApp : ça marche, mais ça demande d’être disponible tout le temps.';
  return hook;
}

// Message WhatsApp prêt à envoyer et relance une semaine plus tard.
export function buildMessages(p) {
  const seed = seedOf(p);
  const sector = sectorOf(p.sector);
  const intro = pick(INTROS, seed, 1);
  const hook = hookFor(p, seed);
  const offer = pick(OFFERS[sector.value] || OFFERS.autre, seed, 3);
  const cta = pick(isNearGrenoble(p) ? CTAS : REMOTE_CTAS, seed, 4);
  const signoff = pick(SIGNOFFS, seed, 5);
  const message = `${intro}\n\n${hook}\n\n${offer} ${cta}\n\n${signoff}`;
  const followUps = [
    `Bonjour, c’est Raphaël (sites internet, Grenoble). Je me doute que vous êtes pris, je relance juste une fois : si vous voulez voir un exemple de site pour ${sector.noun}, c’est quand vous voulez. Sinon, pas de souci, je ne vous embête plus. Bonne journée !`,
    `Bonjour, Raphaël encore. Petite relance pour ${p.name} : l’idée, c’est un site simple avec ${sector.feature}, que je peux vous montrer en deux minutes au téléphone. Si ce n’est pas le moment, dites-le-moi et j’arrête là. Bonne journée !`,
  ];
  return { message, followUp: pick(followUps, seed, 6) };
}

// Analyse en deux phrases : la situation, puis l'angle d'approche.
export function buildAnalysis(p) {
  const city = cityOf(p);
  const g = p.google;
  const presence = p.website
    ? 'a déjà un site'
    : p.instagram
      ? 'sans site, présent seulement sur Instagram et Google'
      : 'sans site, joignable uniquement par téléphone';
  const phone = p.phoneKind === 'whatsapp' ? 'sur WhatsApp' : p.phoneKind === 'mobile' ? 'sur un mobile' : 'sur une ligne fixe';
  const first = `${p.kindLabel || 'Entreprise'} à ${city}, ${presence}, ${phone}.`;
  let second;
  if (g && g.reviews) {
    const note = `${String(g.rating).replace('.', ',')}/5 sur ${g.reviews} avis Google`;
    second = g.rating >= 4.3
      ? `Clientèle fidèle (${note}) à mettre en avant : bonne cible pour ${sectorOf(p.sector).feature}.`
      : `Avis mitigés (${note}) : un site soigné aiderait à reprendre la main sur l’image, avec ${sectorOf(p.sector).feature}.`;
  } else {
    second = `Angle : ${sectorOf(p.sector).feature}, sans commission ni plateforme, avec une démonstration rapide sur place.`;
  }
  return `${first} ${second}`;
}

// Adresse web affichable : uniquement http(s), sinon rien (les données OSM et
// Google sont des contenus tiers et finissent dans des liens de l'admin).
export function safeUrl(value, max = 300) {
  const text = cleanText(value, max);
  if (!text) return '';
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

// Coordonnée réellement numérique (null et '' ne valent pas 0).
const coordinate = (value) => {
  if (typeof value !== 'number' && !(typeof value === 'string' && value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// Prospect complet et cohérent à partir d'une source (OSM, Google, liste de départ).
export function normalizeProspect(raw = {}) {
  const phone = normalizePhone(raw.phone);
  const classified = typeof raw.kind === 'string' && raw.kind.includes('=') && !raw.sector ? classifyTags(Object.fromEntries([raw.kind.split('=')])) : null;
  const sector = PROSPECT_SECTORS.some((s) => s.value === raw.sector) ? raw.sector : classified?.sector || 'autre';
  const address = isPlainObject(raw.address) ? raw.address : {};
  const google = isPlainObject(raw.google) && (raw.google.rating || raw.google.reviews || raw.google.status || raw.google.mapsUrl)
    ? {
        rating: Number(raw.google.rating) || null,
        reviews: Number(raw.google.reviews) || 0,
        status: cleanText(raw.google.status, 40),
        mapsUrl: safeUrl(raw.google.mapsUrl, 500),
        placeId: cleanText(raw.google.placeId, 200),
        samples: (Array.isArray(raw.google.samples) ? raw.google.samples : []).filter(isPlainObject).slice(0, 5).map((s) => ({
          rating: Number(s.rating) || null,
          text: cleanText(s.text, 600, true),
          when: cleanText(s.when, 60),
          author: cleanText(s.author, 80),
        })),
        fetchedAt: cleanText(raw.google.fetchedAt, 40),
      }
    : null;
  const p = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID(),
    source: cleanText(raw.source, 40) || 'osm',
    sourceId: cleanText(raw.sourceId, 120),
    searchId: cleanText(raw.searchId, 60),
    name: cleanText(raw.name, 120),
    sector,
    kind: cleanText(raw.kind, 80),
    kindLabel: cleanText(raw.kindLabel, 80) || classified?.label || sectorOf(sector).label,
    phone,
    phoneKind: raw.phoneKind === 'whatsapp' ? 'whatsapp' : isMobile(phone) ? 'mobile' : phone ? 'fixe' : '',
    address: {
      street: cleanText(address.street, 160),
      postcode: cleanText(address.postcode, 10),
      city: cleanText(address.city, 80),
    },
    lat: coordinate(raw.lat),
    lon: coordinate(raw.lon),
    website: safeUrl(raw.website, 300),
    instagram: safeUrl(raw.instagram, 200),
    facebook: safeUrl(raw.facebook, 200),
    email: cleanText(raw.email, 160),
    openingHours: cleanText(raw.openingHours, 300),
    chain: Boolean(raw.chain),
    google,
    verified: isPlainObject(raw.verified)
      ? {
          open: typeof raw.verified.open === 'boolean' ? raw.verified.open : null,
          website: typeof raw.verified.website === 'boolean' ? raw.verified.website : null,
          // false : aucune trace en ligne trouvée (seulement les données de carte).
          found: typeof raw.verified.found === 'boolean' ? raw.verified.found : null,
          note: cleanText(raw.verified.note, 400, true),
          sources: (Array.isArray(raw.verified.sources) ? raw.verified.sources : []).map((s) => safeUrl(s, 400)).filter(Boolean).slice(0, 6),
          at: cleanText(raw.verified.at, 40),
        }
      : null,
    analysis: cleanText(raw.analysis, 600, true),
    // Correction du score décidée par un rédacteur (humain ou IA), conservée à chaque recalcul.
    scoreAdjust: Math.max(-10, Math.min(10, Math.round(Number(raw.scoreAdjust)) || 0)),
    scoreAdjustReason: cleanText(raw.scoreAdjustReason, 160),
    score: Number.isFinite(Number(raw.score)) ? Number(raw.score) : null,
    scoreLabel: cleanText(raw.scoreLabel, 20),
    reasons: Array.isArray(raw.reasons) ? raw.reasons.filter(isPlainObject).slice(0, 10) : [],
    message: cleanText(raw.message, 1500, true),
    followUp: cleanText(raw.followUp, 800, true),
    messageSource: ['modele', 'ia', 'manuel'].includes(raw.messageSource) ? raw.messageSource : 'modele',
    messageVariant: Number.isInteger(raw.messageVariant) ? raw.messageVariant : 0,
    status: PROSPECT_STATUSES.some((s) => s.value === raw.status) ? raw.status : 'a-contacter',
    note: cleanText(raw.note, 2000, true),
    createdAt: cleanText(raw.createdAt, 40) || new Date().toISOString(),
    updatedAt: cleanText(raw.updatedAt, 40) || new Date().toISOString(),
    contactedAt: cleanText(raw.contactedAt, 40) || null,
  };
  const scored = scoreProspect(p);
  if (p.score === null) p.score = scored.score;
  if (!p.scoreLabel) p.scoreLabel = scored.label;
  if (!p.reasons.length) p.reasons = scored.reasons;
  if (!p.analysis) p.analysis = buildAnalysis(p);
  if (!p.message) Object.assign(p, buildMessages(p));
  else if (!p.followUp) p.followUp = buildMessages(p).followUp;
  return p;
}

// Recalcule le score et les textes générés (jamais un texte modifié à la main).
export function refreshProspect(p) {
  const scored = scoreProspect(p);
  const next = { ...p, score: scored.score, scoreLabel: scored.label, reasons: scored.reasons };
  if (p.messageSource === 'modele') Object.assign(next, buildMessages(p), { analysis: buildAnalysis(p) });
  return next;
}

// Filtres d'une recherche, nettoyés et bornés.
export const SEARCH_LIMITS = { radiusKm: [1, 30], max: [10, 200] };

export function parseSearchFilters(input = {}) {
  const num = (value, [min, max], fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  };
  const rawSectors = Array.isArray(input.sectors) ? input.sectors : input.sectors ? [input.sectors] : [];
  const sectors = [...new Set(rawSectors.map(String).filter((s) => PROSPECT_SECTORS.some((o) => o.value === s)))];
  // Une case décochée envoie « 0 » (champ caché) ; une case cochée envoie ['0', '1'].
  const bool = (value, fallback) => {
    const last = Array.isArray(value) ? value.at(-1) : value;
    return last === undefined ? fallback : ['1', 'true', 'on', 'oui', true].includes(last);
  };
  return {
    city: cleanText(input.city, 80) || 'Grenoble',
    radiusKm: num(input.radiusKm, SEARCH_LIMITS.radiusKm, 5),
    sectors: sectors.length ? sectors : PROSPECT_SECTORS.filter((s) => s.value !== 'autre').map((s) => s.value),
    onlyNoWebsite: bool(input.onlyNoWebsite, true),
    onlyMobile: bool(input.onlyMobile, true),
    max: num(input.max, SEARCH_LIMITS.max, 50),
    enrich: bool(input.enrich, true),
  };
}

// Ligne CSV : guillemets échappés et formules neutralisées (=, +, -, @).
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
