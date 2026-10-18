import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import {
  buildMessages,
  classifyTags,
  googleMapsLink,
  normalizePhone,
  normalizeProspect,
  parseSearchFilters,
  prospectKey,
  scoreProspect,
  whatsappLink,
} from '../src/prospects.js';
import { bboxAround, fromOsmElement, searchOverpass } from '../src/prospecting/overpass.js';
import { createPlacesClient, matchPlace, toGoogleInfo } from '../src/prospecting/places.js';
import { looksHuman, prospectFacts } from '../src/prospecting/writer.js';
import { createProspector } from '../src/prospecting/runner.js';

const PASSWORD = 'mot-de-passe-de-test';
const silent = { info() {}, warn() {}, error() {} };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Formules creuses et tics de rédaction automatique à proscrire des messages.
const BANNED = /n[’']hésitez pas|je me permets|en tant que|booster|digital|optimis|solution|j[’']espère que vous allez bien|[\u{1F300}-\u{1FAFF}]/iu;

const salon = {
  name: 'Salon Test',
  kind: 'shop=hairdresser',
  phone: '+33 6 12 34 56 78',
  address: { street: '3 rue Lakanal', postcode: '38000', city: 'Grenoble' },
  instagram: 'https://www.instagram.com/salontest/',
};

describe('prospection : modèle', () => {
  test('classe les activités OpenStreetMap', () => {
    assert.deepEqual(classifyTags({ shop: 'hairdresser' }), { sector: 'coiffeur', kind: 'shop=hairdresser', label: 'Coiffeur' });
    assert.equal(classifyTags({ shop: 'hairdresser', name: 'Barber Club' }).label, 'Barbier');
    assert.equal(classifyTags({ amenity: 'restaurant', cuisine: 'italian' }).label, 'Restaurant italien');
    assert.equal(classifyTags({ amenity: 'restaurant', cuisine: 'pizza' }).label, 'Pizzeria');
    assert.equal(classifyTags({ craft: 'plumber' }).sector, 'artisan');
    assert.equal(classifyTags({ shop: 'unknown_thing' }).sector, 'commerce');
    assert.equal(classifyTags({}).sector, 'autre');
  });

  test('normalise les téléphones français', () => {
    assert.equal(normalizePhone('+33 6 12 34 56 78'), '0612345678');
    assert.equal(normalizePhone('06.12.34.56.78; 04 76 00 00 00'), '0612345678');
    assert.equal(normalizePhone('0033476000000'), '0476000000');
    assert.equal(normalizePhone('12345'), '');
    assert.equal(normalizePhone('+33 (0)6 12 34 56 78'), '0612345678');
    assert.equal(normalizePhone('https://wa.me/33612345678'), '0612345678');
    assert.equal(normalizePhone('https://api.whatsapp.com/send?phone=33612345678'), '0612345678');
    assert.equal(whatsappLink('06 12 34 56 78', 'Bonjour à vous'), 'https://wa.me/33612345678?text=Bonjour+%C3%A0+vous');
    assert.equal(whatsappLink('abc'), '');
  });

  test('dédoublonne par téléphone puis par nom et ville', () => {
    assert.equal(prospectKey({ phone: '+33612345678' }), prospectKey({ phone: '06 12 34 56 78' }));
    assert.equal(prospectKey({ name: 'Chez Léa', address: { city: 'Grenoble' } }), prospectKey({ name: 'chez lea', city: 'grenoble' }));
  });

  test('le score favorise les commerces sans site joignables sur mobile', () => {
    const good = scoreProspect({ sector: 'coiffeur', website: '', phoneKind: 'mobile', instagram: 'x' });
    const bad = scoreProspect({ sector: 'coiffeur', website: 'https://salon.fr', phoneKind: 'fixe' });
    assert.ok(good.score > bad.score);
    assert.ok(good.reasons.some((r) => r.text === 'Sans site' && r.good));
    assert.equal(scoreProspect({ sector: 'restaurant', google: { status: 'CLOSED_PERMANENTLY' } }).score, 2);
    const rated = scoreProspect({ sector: 'restaurant', phoneKind: 'whatsapp', google: { rating: 4.7, reviews: 120 } });
    assert.equal(rated.label, 'Très bon');
    assert.ok(rated.score <= 55);
  });

  test('lien vers la fiche Google Maps : exacte quand connue, sinon recherche nom + adresse', () => {
    assert.equal(googleMapsLink({ name: 'X', google: { mapsUrl: 'https://maps.app.goo.gl/abc' } }), 'https://maps.app.goo.gl/abc');
    const link = googleMapsLink(normalizeProspect(salon));
    assert.ok(link.startsWith('https://www.google.com/maps/search/?api=1&query='));
    assert.equal(decodeURIComponent(link.split('query=')[1]), 'Salon Test 3 rue Lakanal 38000 Grenoble');
    assert.equal(googleMapsLink({}), '');
  });

  test('l’ajustement du rédacteur et le marqueur « non retrouvée » survivent au recalcul', () => {
    const base = { sector: 'coiffeur', website: '', phoneKind: 'mobile' };
    const plain = scoreProspect(base).score;
    const boosted = scoreProspect({ ...base, scoreAdjust: 6, scoreAdjustReason: 'gérante très active' });
    assert.equal(boosted.score, plain + 6);
    assert.ok(boosted.reasons.some((r) => r.text === '+6 : gérante très active' && r.good));
    const unseen = scoreProspect({ ...base, verified: { found: false } });
    assert.equal(unseen.score, plain - 5);
    assert.ok(unseen.reasons.some((r) => r.text === 'Non retrouvée en ligne' && !r.good));
    // Borné à ±10 et conservé par la normalisation.
    const p = normalizeProspect({ ...salon, scoreAdjust: 40, scoreAdjustReason: 'x', verified: { found: false, note: 'rien trouvé' } });
    assert.equal(p.scoreAdjust, 10);
    assert.equal(p.verified.found, false);
    assert.equal(p.score, scoreProspect(p).score);
  });

  test('les messages sont stables, personnalisés et sans tics de rédaction automatique', () => {
    const p = normalizeProspect(salon);
    assert.equal(p.sector, 'coiffeur');
    assert.equal(p.phoneKind, 'mobile');
    assert.match(p.message, /Salon Test/);
    assert.match(p.message, /^Bonjour/);
    assert.doesNotMatch(p.message, BANNED);
    assert.doesNotMatch(p.message, /https?:\/\//);
    assert.ok(p.message.length > 300 && p.message.length < 750, `longueur ${p.message.length}`);
    assert.ok(p.followUp.length > 120 && p.followUp.length < 500);
    assert.equal(buildMessages(p).message, p.message);
    assert.equal(p.analysis.split(/(?<=\.)\s/).length, 2);
    // Un autre commerce reçoit une autre combinaison.
    const other = normalizeProspect({ ...salon, id: 'autre', name: 'Pizza Luigi', kind: 'amenity=restaurant', phone: '07 00 00 00 01', google: { rating: 4.6, reviews: 90 } });
    assert.match(other.message, /4,6 sur Google avec 90 avis/);
    assert.match(other.message, /TheFork|commission/);
    const withSite = normalizeProspect({ ...salon, id: 'site', name: 'Chez Site', website: 'https://chez-site.fr' });
    assert.match(withSite.message, /votre site|le site de Chez Site/);
    assert.doesNotMatch(withSite.message, /pas de site/);
    const far = normalizeProspect({ ...salon, id: 'lyon', name: 'Salon Lyon', address: { city: 'Lyon', postcode: '69001' }, lat: 45.76, lon: 4.83 });
    assert.doesNotMatch(far.message, /je passe/);
  });

  test('un message modifié à la main n’est jamais régénéré', async () => {
    const { refreshProspect } = await import('../src/prospects.js');
    const p = normalizeProspect({ ...salon, message: 'Texte à moi', messageSource: 'manuel' });
    assert.equal(refreshProspect({ ...p, website: 'https://x.fr' }).message, 'Texte à moi');
    assert.notEqual(refreshProspect({ ...p, messageSource: 'modele' }).message, 'Texte à moi');
  });

  test('borne les filtres de recherche', () => {
    const f = parseSearchFilters({ city: '  Voiron ', radiusKm: '99', max: '3', sectors: ['coiffeur', 'inconnu'], onlyNoWebsite: undefined, onlyMobile: 'on' });
    assert.deepEqual(f, { city: 'Voiron', radiusKm: 30, sectors: ['coiffeur'], onlyNoWebsite: true, onlyMobile: true, max: 10, enrich: true });
    const d = parseSearchFilters({});
    assert.equal(d.city, 'Grenoble');
    assert.equal(d.sectors.length, 8);
    assert.equal(d.onlyMobile, true);
    assert.equal(parseSearchFilters({ onlyNoWebsite: '' }).onlyNoWebsite, false);
    // Case décochée : seul le champ caché « 0 » est envoyé ; cochée : ['0', '1'].
    assert.equal(parseSearchFilters({ onlyNoWebsite: '0' }).onlyNoWebsite, false);
    assert.equal(parseSearchFilters({ onlyNoWebsite: ['0', '1'] }).onlyNoWebsite, true);
    assert.equal(normalizeProspect({ ...salon, lat: null, lon: '' }).lat, null);
    assert.equal(normalizeProspect({ ...salon, lat: '45.1', lon: 5.7 }).lat, 45.1);
  });
});

const osmElements = [
  { type: 'node', id: 1, lat: 45.19, lon: 5.72, tags: { name: 'Salon Test', shop: 'hairdresser', 'contact:mobile': '06 12 34 56 78', 'contact:instagram': 'salontest', 'addr:city': 'Grenoble', 'addr:street': 'rue Lakanal', 'addr:housenumber': '3' } },
  { type: 'way', id: 2, center: { lat: 45.18, lon: 5.73 }, tags: { name: 'Bistrot Avec Site', amenity: 'restaurant', phone: '+33 4 76 00 00 00', website: 'https://bistrot.fr' } },
  { type: 'node', id: 3, lat: 45.17, lon: 5.71, tags: { name: 'Bar du Coin', amenity: 'bar', phone: '04 76 11 22 33', opening_hours: 'Mo-Sa 17:00-01:00' } },
  { type: 'node', id: 4, lat: 45.17, lon: 5.7, tags: { name: 'Boulangerie Franchise', shop: 'bakery', phone: '06 00 00 00 00', brand: 'Marie Blachère' } },
  { type: 'node', id: 5, lat: 45.17, lon: 5.7, tags: { name: 'Sans téléphone', shop: 'tattoo' } },
];

// Réseau simulé : géocodage Nominatim et requêtes Overpass.
const fakeFetch = async (url) => {
  if (url.includes('nominatim')) return { ok: true, status: 200, text: JSON.stringify([{ lat: '45.188', lon: '5.724', name: 'Grenoble', display_name: 'Grenoble, Isère' }]) };
  if (url.includes('overpass')) return { ok: true, status: 200, text: JSON.stringify({ elements: osmElements }) };
  return { ok: false, status: 404, text: '' };
};

describe('prospection : sources', () => {
  test('convertit un élément OSM en prospect', () => {
    const p = fromOsmElement(osmElements[0]);
    assert.equal(p.phone, '0612345678');
    assert.equal(p.phoneKind, 'mobile');
    assert.equal(p.instagram, 'https://www.instagram.com/salontest/');
    assert.equal(p.address.street, '3 rue Lakanal');
    assert.equal(fromOsmElement(osmElements[4]), null);
    assert.equal(fromOsmElement(osmElements[3]).chain, true);
  });

  test('emprise autour d’un point et recherche Overpass avec repli de serveur', async () => {
    assert.match(bboxAround(45.188, 5.724, 5), /^45\.14\d+,5\.66\d+,45\.23\d+,5\.78\d+$/);
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(new URL(url).host);
      if (calls.length === 1) return { ok: false, status: 503, text: 'saturé' };
      return fakeFetch(url);
    };
    const { items, failures } = await searchOverpass({ bbox: '0,0,1,1', sectors: ['coiffeur'], endpoints: ['https://a.overpass/api', 'https://b.overpass/api'], fetchImpl, retryDelayMs: 5 });
    assert.equal(failures, 0);
    assert.equal(items.length, 4);
    assert.deepEqual(calls, ['a.overpass', 'b.overpass']);
    let attempts = 0;
    await assert.rejects(
      searchOverpass({ bbox: '0,0,1,1', sectors: ['coiffeur'], endpoints: ['https://a.overpass/api'], fetchImpl: async () => { attempts += 1; return { ok: false, status: 429, text: '' }; }, retryDelayMs: 5 }),
      /Overpass 429/,
    );
    assert.equal(attempts, 2, 'une seconde passe après la pause');
  });

  test('associe le bon résultat Google et en extrait les avis', async () => {
    const places = [
      { id: 'a', displayName: { text: 'Autre' }, nationalPhoneNumber: '04 00 00 00 00' },
      { id: 'b', displayName: { text: 'Salon Test Coiffure' }, nationalPhoneNumber: '06 12 34 56 78', rating: 4.8, userRatingCount: 42, businessStatus: 'OPERATIONAL', googleMapsUri: 'https://maps.google.com/?cid=1', websiteUri: '', reviews: [{ rating: 5, text: { text: 'Super  accueil\nau top' }, relativePublishTimeDescription: 'il y a un mois', authorAttribution: { displayName: 'Léa' } }] },
    ];
    assert.equal(matchPlace({ name: 'Salon Test', phone: '0612345678' }, places).id, 'b');
    assert.equal(matchPlace({ name: 'Salon Test', phone: '' }, places).id, 'b');
    assert.equal(matchPlace({ name: 'Inconnu', phone: '' }, places), null);
    const info = toGoogleInfo(places[1]);
    assert.equal(info.reviews, 42);
    assert.deepEqual(info.samples[0], { rating: 5, text: 'Super accueil au top', when: 'il y a un mois', author: 'Léa' });
    let sent;
    const client = createPlacesClient({
      apiKey: 'k',
      fetchImpl: async (url, init) => {
        sent = { url, init };
        return { ok: true, status: 200, json: async () => ({ places }) };
      },
    });
    const patch = await client.lookup({ name: 'Salon Test', phone: '0612345678', address: { city: 'Grenoble' }, lat: 45.1, lon: 5.7 });
    assert.equal(sent.init.headers['X-Goog-Api-Key'], 'k');
    assert.match(sent.init.headers['X-Goog-FieldMask'], /places\.reviews/);
    assert.equal(JSON.parse(sent.init.body).textQuery, 'Salon Test Grenoble');
    assert.equal(patch.google.rating, 4.8);
    assert.equal(createPlacesClient({}), null);
  });

  test('garde-fous de la rédaction par Claude', () => {
    const facts = prospectFacts(normalizeProspect(salon));
    assert.equal(facts.site_internet, 'aucun');
    assert.equal(facts.ville, 'Grenoble');
    assert.ok(looksHuman(normalizeProspect(salon).message));
    assert.equal(looksHuman('Bonjour, n’hésitez pas à me contacter. '.repeat(10)), false);
    assert.equal(looksHuman('trop court'), false);
  });

  test('une recherche dont tous les serveurs échouent se termine proprement', async () => {
    const store = { prospects: [], addProspects: async () => [], setLastProspectSearch: async () => {} };
    const prospector = createProspector({ config: { googlePlacesKey: '', prospectAi: false }, store, log: silent, fetchImpl: async () => ({ ok: false, status: 503, text: 'down' }), places: null, writer: null, retryDelayMs: 5 });
    await prospector.start(parseSearchFilters({ sectors: ['coiffeur'] }));
    assert.equal(prospector.state.running, false);
    assert.ok(prospector.state.errors.length);
  });
});

describe('prospection : administration', () => {
  let server;
  let base;
  let app;
  let dataDir;
  let cookie = '';
  const written = [];

  const request = (pathname, { method = 'GET', headers = {}, body, origin = true } = {}) => {
    const h = { Cookie: cookie, ...headers };
    if (origin && method !== 'GET') h.Origin = base;
    return fetch(base + pathname, { method, headers: h, body, redirect: 'manual' });
  };
  const formBody = (data) => new URLSearchParams(data).toString();
  const FORM = { 'Content-Type': 'application/x-www-form-urlencoded' };

  before(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-prospects-'));
    const config = loadConfig({ NODE_ENV: 'test', DATA_DIR: dataDir, ADMIN_PASSWORD: PASSWORD });
    const writer = {
      async write(p) {
        written.push(p.name);
        if (p.name !== 'Salon Test') return null;
        return { analysis: 'Salon de quartier sans site, actif sur Instagram. Angle : la prise de rendez-vous en ligne.', message: `Bonjour, je m’appelle Raphaël, je crée des sites internet à Grenoble.\n\nJ’ai vu ${p.name} sur Instagram, les photos sont belles mais il n’y a pas de site ni de prise de rendez-vous en ligne.\n\nJe fais des sites de salon avec réservation en ligne, sans commission. Si ça vous parle, je passe vous montrer un exemple en cinq minutes.\n\nBonne journée !`, followUp: 'Bonjour, c’est Raphaël. Petite relance, sans insister : si ce n’est pas le moment, dites-le-moi et j’arrête là.' };
      },
    };
    app = await createApp(config, { log: silent, seedProspects: false, prospecting: { fetchImpl: fakeFetch, places: null, writer, retryDelayMs: 5 } });
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
    const login = await fetch(`${base}/admin/connexion`, { method: 'POST', headers: { ...FORM, Origin: base }, body: formBody({ password: PASSWORD }), redirect: 'manual' });
    cookie = login.headers.get('set-cookie').split(';')[0];
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  test('la page exige une session et affiche le formulaire de recherche', async () => {
    const anonymous = await fetch(`${base}/admin/prospection`, { redirect: 'manual' });
    assert.equal(anonymous.status, 303);
    const res = await request('/admin/prospection');
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /Aucune entreprise pour le moment/);
    assert.match(html, /name="city"/);
    assert.match(html, /messages rédigés par Claude/);
    assert.match(html, /GOOGLE_PLACES_API_KEY/);
  });

  test('une recherche ajoute les commerces sans site, hors enseignes, avec messages', async () => {
    const forbidden = await request('/admin/prospection/recherche', { method: 'POST', headers: FORM, body: formBody({ city: 'Grenoble' }), origin: false });
    assert.equal(forbidden.status, 403);
    const res = await request('/admin/prospection/recherche', { method: 'POST', headers: FORM, body: formBody({ city: 'Grenoble', radiusKm: '5', sectors: 'coiffeur', max: '20', onlyMobile: '0' }) });
    assert.equal(res.status, 303);
    assert.ok(app.ctx.prospector.state.running);
    await app.ctx.prospector.job;
    const state = app.ctx.prospector.state;
    assert.equal(state.running, false);
    // Le rédacteur simulé ne produit rien pour le bar : signalé, message modèle conservé.
    assert.deepEqual(state.errors, ['Rédaction : réponse inutilisable pour Bar du Coin, message modèle conservé.']);
    assert.equal(state.added, 2, 'le salon et le bar ; pas le bistrot avec site ni la franchise');
    assert.equal(state.written, 1);
    assert.deepEqual(written.sort(), ['Bar du Coin', 'Salon Test']);
    const again = await request('/admin/prospection/recherche', { method: 'POST', headers: FORM, body: formBody({ city: 'Grenoble', sectors: 'coiffeur', onlyMobile: '0' }) });
    assert.equal(again.status, 303);
    const busy = await request('/admin/prospection/recherche', { method: 'POST', headers: FORM, body: formBody({ city: 'Grenoble', sectors: 'coiffeur' }) });
    assert.equal(busy.status, 303);
    assert.match(busy.headers.get('location'), /erreur=.*cours/);
    await app.ctx.prospector.job;
    assert.equal(app.ctx.store.prospects.length, 2, 'une seconde recherche ne crée pas de doublons');

    const html = await (await request('/admin/prospection')).text();
    assert.match(html, /Salon Test/);
    assert.match(html, /Bar du Coin/);
    assert.doesNotMatch(html, /Bistrot Avec Site/);
    assert.match(html, /Rédigé par Claude/);
    assert.match(html, /Message modèle/);
    assert.match(html, /wa\.me\/33612345678\?text=/);
    assert.match(html, /4 commerces trouvés,\s+0 ajouté, 4 écartés/);
    // L'état décrit la seconde recherche : mêmes commerces, rien de nouveau.
    const etat = await (await request('/admin/prospection/etat')).json();
    assert.equal(etat.ok, true);
    assert.equal(etat.found, 4);
    assert.equal(etat.added, 0);
    assert.equal(etat.skipped, 4);
  });

  test('filtres, statut, note, message, export et suppression', async () => {
    const salonProspect = app.ctx.store.prospects.find((p) => p.name === 'Salon Test');
    const bar = app.ctx.store.prospects.find((p) => p.name === 'Bar du Coin');
    assert.ok(salonProspect.score > bar.score);
    const filtered = await (await request('/admin/prospection?secteur=bar')).text();
    assert.match(filtered, /Bar du Coin/);
    assert.doesNotMatch(filtered, /Salon Test<\/strong>/);
    const searched = await (await request('/admin/prospection?q=lakanal')).text();
    assert.match(searched, /Salon Test/);

    let res = await request(`/admin/prospection/${salonProspect.id}/statut`, { method: 'POST', headers: FORM, body: formBody({ status: 'envoye', retour: '/admin/prospection?statut=envoye' }) });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), `/admin/prospection?statut=envoye#p-${salonProspect.id}`);
    assert.equal(app.ctx.store.getProspect(salonProspect.id).status, 'envoye');
    assert.ok(app.ctx.store.getProspect(salonProspect.id).contactedAt);

    res = await request(`/admin/prospection/${bar.id}/message`, { method: 'POST', headers: FORM, body: formBody({ message: 'Bonjour, c’est Raphaël, un message à moi.', followUp: '' }) });
    assert.equal(res.status, 303);
    const edited = app.ctx.store.getProspect(bar.id);
    assert.equal(edited.message, 'Bonjour, c’est Raphaël, un message à moi.');
    assert.equal(edited.messageSource, 'manuel');
    assert.ok(edited.followUp.length > 50, 'la relance vide garde l’ancienne');

    res = await request(`/admin/prospection/${bar.id}/regenerer`, { method: 'POST', headers: FORM, body: formBody({}) });
    assert.equal(res.status, 303);
    assert.equal(app.ctx.store.getProspect(bar.id).messageSource, 'modele');
    assert.match(app.ctx.store.getProspect(bar.id).message, /Bar du Coin/);
    const firstModel = app.ctx.store.getProspect(bar.id).message;
    await request(`/admin/prospection/${bar.id}/regenerer`, { method: 'POST', headers: FORM, body: formBody({}) });
    assert.notEqual(app.ctx.store.getProspect(bar.id).message, firstModel, 'un nouveau modèle change le texte');

    res = await request(`/admin/prospection/${bar.id}/note`, { method: 'POST', headers: FORM, body: formBody({ note: 'Rappeler jeudi' }) });
    assert.equal(app.ctx.store.getProspect(bar.id).note, 'Rappeler jeudi');

    const sent = await request(`/admin/api/prospection/${bar.id}/envoye`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Bonjour, texte retouché juste avant l’envoi.' }) });
    const payload = await sent.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.changed, true);
    assert.equal(payload.status, 'envoye');
    assert.equal(payload.toContact, 0);
    assert.equal(app.ctx.store.getProspect(bar.id).message, 'Bonjour, texte retouché juste avant l’envoi.');
    assert.equal(app.ctx.store.getProspect(bar.id).messageSource, 'manuel');
    const again2 = await (await request(`/admin/api/prospection/${bar.id}/envoye`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json();
    assert.equal(again2.changed, false, 'un second envoi ne change plus le statut');

    const csv = await request('/admin/prospection/export.csv');
    assert.equal(csv.status, 200);
    const text = await csv.text();
    assert.ok(text.replace(/^﻿/, '').startsWith('"Nom";"Activité"'));
    assert.match(text, /"Salon Test";"Coiffeur"/);
    assert.match(text, /wa\.me\/33612345678/);

    res = await request(`/admin/prospection/${bar.id}/supprimer`, { method: 'POST', headers: FORM, body: formBody({}) });
    assert.equal(res.status, 303);
    assert.equal(app.ctx.store.getProspect(bar.id), null);
    const saved = JSON.parse(await fs.readFile(path.join(dataDir, 'prospects.json'), 'utf8'));
    assert.equal(saved.items.length, 1);
    assert.equal(saved.lastSearch.place, 'Grenoble');
  });
});

describe('prospection : rédaction par Claude (client simulé)', () => {
  const salonP = normalizeProspect({ ...salon, id: 'salon-ia' });
  const reply = (text, stop_reason = 'end_turn') => ({ stop_reason, content: [{ type: 'text', text }] });
  const good = { analysis: 'Salon de quartier sans site. Angle : le rendez-vous en ligne.', message: `Bonjour, je m’appelle Raphaël, je crée des sites internet pour les commerces de Grenoble.\n\nJe suis tombé sur Salon Test en cherchant un coiffeur dans le coin : pas de site, juste la fiche Google et le compte Instagram.\n\nJe fais des sites de salon avec la prise de rendez-vous en ligne, sans commission. Si ça vous parle, je passe vous montrer un exemple cinq minutes quand c’est calme, sinon pas de souci.\n\nBonne journée !`, followUp: 'Bonjour, c’est Raphaël. Petite relance, une seule : si ce n’est pas le moment, dites-le-moi et j’arrête là.' };

  const fakeClient = (responses) => {
    const calls = [];
    return {
      calls,
      messages: {
        async create(params) {
          calls.push(params);
          return responses.shift();
        },
      },
    };
  };

  test('envoie la bonne requête et accepte un message conforme', async () => {
    const { createWriter } = await import('../src/prospecting/writer.js');
    const client = fakeClient([reply(JSON.stringify(good))]);
    const writer = createWriter({ client, model: 'claude-opus-5-5', log: silent });
    const texts = await writer.write(salonP);
    assert.deepEqual(texts, good);
    const [params] = client.calls;
    assert.equal(params.model, 'claude-opus-5-5');
    assert.equal(params.output_config.format.type, 'json_schema');
    assert.deepEqual(params.output_config.format.schema.required, ['analysis', 'message', 'followUp']);
    assert.equal(params.system[0].cache_control.type, 'ephemeral');
    assert.match(params.messages[0].content, /Salon Test/);
    assert.match(params.messages[0].content, /Contrainte de variation/);
  });

  test('refuse les réponses inutilisables (refus, JSON invalide, tics de rédaction)', async () => {
    const { createWriter } = await import('../src/prospecting/writer.js');
    const client = fakeClient([
      reply('', 'refusal'),
      reply('pas du json'),
      reply(JSON.stringify({ ...good, message: `${good.message} N’hésitez pas à me contacter.` })),
      reply(JSON.stringify({ ...good, message: 'Trop court.' })),
    ]);
    const writer = createWriter({ client, log: silent });
    for (let i = 0; i < 4; i += 1) assert.equal(await writer.write(salonP), null, `réponse ${i + 1}`);
    assert.equal(createWriter({}), null);
  });
});

describe('prospection : garde-fous', () => {
  test('les liens tiers non http(s) sont écartés', async () => {
    const { safeUrl } = await import('../src/prospects.js');
    assert.equal(safeUrl('javascript:alert(1)'), '');
    assert.equal(safeUrl('data:text/html,hello'), '');
    assert.equal(safeUrl('https://salon.fr/'), 'https://salon.fr/');
    assert.equal(safeUrl('pas une url'), '');
    const p = normalizeProspect({ ...salon, website: 'javascript:alert(1)', instagram: 'data:x', facebook: 'ftp://x', google: { rating: 4, reviews: 3, mapsUrl: 'javascript:1' }, verified: { sources: ['javascript:2', 'https://ok.fr/'] } });
    assert.equal(p.website, '');
    assert.equal(p.instagram, '');
    assert.equal(p.facebook, '');
    assert.equal(p.google.mapsUrl, '');
    assert.deepEqual(p.verified.sources, ['https://ok.fr/']);
  });

  test('une réponse Overpass trop volumineuse est abandonnée', async () => {
    const { searchOverpass } = await import('../src/prospecting/overpass.js');
    // fetchImpl par défaut remplacé : on simule via un serveur local qui envoie un en-tête énorme.
    const http = await import('node:http');
    const server = http.createServer((req, res) => {
      res.setHeader('Content-Length', String(40 * 1024 * 1024));
      res.write('{"elements":[');
      setTimeout(() => res.end(']}'), 50);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const endpoint = `http://127.0.0.1:${server.address().port}/api/interpreter`;
    await assert.rejects(searchOverpass({ bbox: '0,0,1,1', sectors: ['coiffeur'], endpoints: [endpoint], retryDelayMs: 5 }), /volumineuse/);
    await new Promise((resolve) => server.close(resolve));
  });
});

describe('prospection : liste de départ', () => {
  test('importée une fois, tolérante aux entrées invalides, jamais bloquante', async () => {
    const { Store } = await import('../src/store.js');
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'subnet-seed-'));
    const seedFile = path.join(dir, 'seed.json');
    await fs.writeFile(seedFile, 'pas du json');
    let store = new Store(dir, { seedFile, log: silent });
    await store.init();
    assert.equal(store.prospects.length, 0, 'liste illisible ignorée');
    await fs.writeFile(seedFile, JSON.stringify([null, { name: '' }, { kind: 42, name: 'Sans kind', phone: '06 00 00 00 02', google: { rating: 4, reviews: 2, samples: [null] } }, { ...salon, verified: { sources: ['https://ok.fr/'], at: '2026-10-17T00:00:00.000Z' } }]));
    store = new Store(dir, { seedFile, log: silent });
    await store.init();
    assert.equal(store.prospects.length, 2, 'les entrées exploitables sont importées');
    assert.ok(store.prospects.every((p) => p.source === 'liste-de-depart'));
    const saved = JSON.parse(await fs.readFile(path.join(dir, 'prospects.json'), 'utf8'));
    assert.ok(saved.seededAt);
    // Tout retirer sans lancer de recherche ne réimporte pas la liste.
    for (const p of [...store.prospects]) await store.deleteProspect(p.id);
    store = new Store(dir, { seedFile, log: silent });
    await store.init();
    assert.equal(store.prospects.length, 0);
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('la liste livrée est complète, propre et prête à envoyer', async () => {
    const seedPath = new URL('../src/prospects-seed.json', import.meta.url);
    const raw = JSON.parse(await fs.readFile(seedPath, 'utf8'));
    assert.ok(Array.isArray(raw) && raw.length >= 50, `au moins 50 entreprises (${raw.length})`);
    const ids = new Set();
    const phones = new Set();
    for (const entry of raw) {
      const p = normalizeProspect(entry);
      assert.ok(p.name && p.phone && p.sector !== 'autre', `${entry.name} : nom, téléphone et secteur`);
      assert.match(p.phone, /^0[1-9]\d{8}$/, `${p.name} : téléphone normalisé`);
      assert.ok(!ids.has(p.id) && !phones.has(p.phone), `${p.name} : identifiant et téléphone uniques`);
      ids.add(p.id);
      phones.add(p.phone);
      assert.equal(p.website, '', `${p.name} : sans site`);
      assert.equal(p.source, 'liste-de-depart');
      assert.equal(p.messageSource, 'ia', `${p.name} : message rédigé`);
      assert.ok(p.message.length >= 300 && p.message.length <= 750, `${p.name} : longueur du message (${p.message.length})`);
      assert.ok(p.followUp.length >= 60 && p.followUp.length <= 600, `${p.name} : longueur de la relance`);
      for (const text of [p.message, p.followUp, p.analysis]) {
        assert.ok(!BANNED.test(text), `${p.name} : tic de rédaction (« ${text.match(BANNED)?.[0]} »)`);
        assert.ok(!/https?:\/\/|—/.test(text), `${p.name} : ni lien ni tiret cadratin`);
      }
      assert.ok(/Raphaël/.test(p.message), `${p.name} : signé`);
      assert.ok(p.verified && p.verified.at, `${p.name} : vérification datée`);
      assert.ok(p.score >= 2 && p.score <= 55 && p.scoreLabel, `${p.name} : score`);
      assert.equal(p.status, 'a-contacter');
      assert.deepEqual(entry, { ...entry, ...Object.fromEntries(Object.entries(p).filter(([k]) => k in entry)) }, `${p.name} : déjà normalisée`);
    }
    const mobiles = raw.filter((p) => p.phoneKind !== 'fixe').length;
    assert.ok(mobiles >= raw.length * 0.75, `majorité de mobiles (${mobiles}/${raw.length})`);
    assert.ok(raw.filter((p) => /^38/.test(p.address.postcode)).length >= 25, 'au moins 25 autour de Grenoble');
  });
});
