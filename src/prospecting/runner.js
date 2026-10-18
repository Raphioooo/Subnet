// Recherche de prospects : géocodage, OpenStreetMap, enrichissement Google et
// rédaction (facultatifs), puis enregistrement. Une seule recherche à la fois ;
// son avancement est consultable depuis l'admin.

import crypto from 'node:crypto';
import { normalizeProspect, prospectKey, scoreProspect } from '../prospects.js';
import { bboxAround, geocodeCity, searchOverpass } from './overpass.js';
import { createPlacesClient } from './places.js';
import { createWriter } from './writer.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_SEARCH_MS = 30 * 60 * 1000;

export function createProspector({ config, store, log, fetchImpl, places, writer, retryDelayMs } = {}) {
  const placesClient = places !== undefined ? places : createPlacesClient({ apiKey: config.googlePlacesKey, log });
  const aiWriter = writer !== undefined ? writer : config.prospectAi ? createWriter({ apiKey: config.anthropicApiKey, model: config.anthropicModel, log }) : null;

  let state = idle();
  let controller = null;
  let current = null;

  function idle() {
    return { running: false, step: '', found: 0, added: 0, skipped: 0, enriched: 0, written: 0, errors: [], filters: null, startedAt: null, finishedAt: null, searchId: null };
  }

  const update = (patch) => {
    state = { ...state, ...patch };
  };

  async function run(filters, signal) {
    const searchId = crypto.randomUUID();
    update({ ...idle(), running: true, step: 'Localisation de la zone…', filters, startedAt: new Date().toISOString(), searchId });
    const place = await geocodeCity(filters.city, { signal, ...(fetchImpl ? { fetchImpl } : {}) });
    const bbox = bboxAround(place.lat, place.lon, filters.radiusKm);
    update({ step: `Recherche autour de ${place.name}…` });

    const { items, failures } = await searchOverpass({
      bbox,
      sectors: filters.sectors,
      signal,
      log,
      ...(fetchImpl ? { fetchImpl } : {}),
      ...(retryDelayMs !== undefined ? { retryDelayMs } : {}),
      onProgress: (sector, count) => update({ step: `Recherche autour de ${place.name} : ${count} commerces trouvés…`, found: count }),
    });
    if (failures) state.errors.push(`${failures} famille${failures > 1 ? 's' : ''} d’activités n’a pas pu être interrogée (serveur OpenStreetMap saturé).`);

    const existing = new Set(store.prospects.map(prospectKey));
    const candidates = items
      .filter((p) => (!filters.onlyNoWebsite || !p.website) && (!filters.onlyMobile || p.phoneKind !== 'fixe') && !p.chain)
      .map((p) => ({ ...p, city: p.address.city || place.name, address: { ...p.address, city: p.address.city || place.name } }))
      .filter((p) => !existing.has(prospectKey(p)))
      .sort((a, b) => scoreProspect(b).score - scoreProspect(a).score);
    update({ found: items.length, skipped: items.length - candidates.length });
    const selected = candidates.slice(0, filters.max);

    let enriched = 0;
    if (placesClient && filters.enrich) {
      for (const [i, p] of selected.entries()) {
        if (signal.aborted) throw new Error('Recherche interrompue.');
        update({ step: `Avis Google : ${i + 1} sur ${selected.length}…` });
        try {
          const patch = await placesClient.lookup(p, { signal });
          if (patch) {
            Object.assign(p, patch);
            enriched += 1;
          }
        } catch (err) {
          log?.warn?.(`Prospection : Google ignoré pour ${p.name} (${err.message})`);
          state.errors.push(`Google : ${err.message}`);
          if (err.status === 403 || err.status === 401 || err.status === 429) break;
        }
        update({ enriched });
      }
    }
    // Un commerce fermé ou déjà équipé d'un site trouvé via Google sort de la liste.
    const kept = selected.filter((p) => p.google?.status !== 'CLOSED_PERMANENTLY' && (!filters.onlyNoWebsite || !p.website));

    let written = 0;
    const prospects = [];
    for (const [i, raw] of kept.entries()) {
      if (signal.aborted) throw new Error('Recherche interrompue.');
      const p = normalizeProspect({ ...raw, searchId });
      if (aiWriter) {
        update({ step: `Rédaction des messages : ${i + 1} sur ${kept.length}…` });
        try {
          const texts = await aiWriter.write(p, { signal });
          if (texts) {
            Object.assign(p, texts, { messageSource: 'ia' });
            written += 1;
          } else {
            state.errors.push(`Rédaction : réponse inutilisable pour ${p.name}, message modèle conservé.`);
          }
        } catch (err) {
          log?.warn?.(`Prospection : rédaction par l’IA ignorée pour ${p.name} (${err.message})`);
          state.errors.push(`Rédaction : ${err.message}`);
          if (err.status === 401 || err.status === 403 || err.status === 429) break;
          await sleep(1000);
        }
        update({ written });
      }
      prospects.push(p);
    }

    update({ step: 'Enregistrement…' });
    const added = await store.addProspects(prospects);
    await store.setLastProspectSearch({ ...filters, place: place.name, at: new Date().toISOString(), found: items.length, added: added.length, searchId });
    update({ running: false, step: '', added: added.length, enriched, written, finishedAt: new Date().toISOString() });
    log?.info?.(`Prospection : ${added.length} prospect${added.length > 1 ? 's' : ''} ajouté${added.length > 1 ? 's' : ''} autour de ${place.name}.`);
  }

  return {
    get state() {
      return state;
    },
    get googleEnabled() {
      return Boolean(placesClient);
    },
    get aiEnabled() {
      return Boolean(aiWriter);
    },
    get writer() {
      return aiWriter;
    },
    // Promesse de la recherche en cours (null sinon).
    get job() {
      return current;
    },
    // Lance une recherche en arrière-plan ; une seule à la fois.
    start(filters) {
      if (state.running) throw new Error('Une recherche est déjà en cours.');
      controller = new AbortController();
      const { signal } = controller;
      // Une recherche ne peut pas bloquer les suivantes indéfiniment.
      const deadline = setTimeout(() => controller?.abort(), MAX_SEARCH_MS);
      deadline.unref();
      current = run(filters, signal)
        .catch((err) => {
          log?.error?.('Prospection :', err.message);
          update({ running: false, step: '', finishedAt: new Date().toISOString(), errors: [...state.errors, err.message] });
        })
        .finally(() => {
          clearTimeout(deadline);
          controller = null;
          current = null;
        });
      return current;
    },
    cancel() {
      controller?.abort();
    },
  };
}
