// Enrichissement Google (facultatif) : note, nombre d'avis, extraits d'avis,
// site et statut d'ouverture, via l'API Places (New). Nécessite GOOGLE_PLACES_API_KEY.
// Chaque appel est facturé par Google (tarif « Enterprise + Atmosphere »).

import { fold, normalizePhone } from '../prospects.js';

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.googleMapsUri',
  'places.reviews',
].join(',');

// Extrait court d'un avis, sans retour à la ligne.
const snippet = (text) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, 240);

// Le résultat qui correspond : même téléphone, sinon nom très proche.
export function matchPlace(prospect, places) {
  const phone = normalizePhone(prospect.phone);
  const byPhone = places.find((pl) => normalizePhone(pl.nationalPhoneNumber) === phone && phone);
  if (byPhone) return byPhone;
  const wanted = fold(prospect.name);
  return places.find((pl) => {
    const got = fold(pl.displayName?.text);
    return got && (got === wanted || got.includes(wanted) || wanted.includes(got));
  }) || null;
}

export function toGoogleInfo(place) {
  return {
    rating: typeof place.rating === 'number' ? place.rating : null,
    reviews: place.userRatingCount || 0,
    status: place.businessStatus || '',
    mapsUrl: place.googleMapsUri || '',
    placeId: place.id || '',
    samples: (place.reviews || [])
      .filter((r) => r.text?.text)
      .slice(0, 3)
      .map((r) => ({ rating: r.rating ?? null, text: snippet(r.text.text), when: r.relativePublishTimeDescription || '', author: r.authorAttribution?.displayName || '' })),
    fetchedAt: new Date().toISOString(),
  };
}

export function createPlacesClient({ apiKey, fetchImpl = fetch, log } = {}) {
  if (!apiKey) return null;
  return {
    // Complète un prospect : retourne les champs à fusionner, ou null si rien ne correspond.
    async lookup(prospect, { signal } = {}) {
      const textQuery = [prospect.name, prospect.address?.city || 'Grenoble'].join(' ');
      const body = { textQuery, languageCode: 'fr', regionCode: 'FR', pageSize: 5 };
      if (prospect.lat && prospect.lon) body.locationBias = { circle: { center: { latitude: prospect.lat, longitude: prospect.lon }, radius: 1500 } };
      // Délai maximal par fiche, en plus de l'annulation par l'utilisateur.
      const limit = AbortSignal.timeout(15000);
      const res = await fetchImpl(ENDPOINT, {
        method: 'POST',
        signal: signal ? AbortSignal.any([signal, limit]) : limit,
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELDS },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 200);
        const error = new Error(`Google Places ${res.status}${detail ? ` : ${detail}` : ''}`);
        error.status = res.status;
        throw error;
      }
      const data = await res.json();
      const place = matchPlace(prospect, data.places || []);
      if (!place) return null;
      const patch = { google: toGoogleInfo(place) };
      if (place.websiteUri && !prospect.website) patch.website = place.websiteUri;
      if (!prospect.phone && place.nationalPhoneNumber) patch.phone = normalizePhone(place.nationalPhoneNumber);
      log?.info?.(`Prospection : ${prospect.name} enrichi via Google (${patch.google.rating ?? '–'} ★, ${patch.google.reviews} avis).`);
      return patch;
    },
  };
}
