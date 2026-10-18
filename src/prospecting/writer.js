// Rédaction par Claude (facultative) de l'analyse et des messages de chaque
// prospect. Nécessite ANTHROPIC_API_KEY ; sans clé, les modèles de messages
// de prospects.js sont utilisés. Chaque appel est facturé par Anthropic.

import { cityOf, isNearGrenoble, sectorOf } from '../prospects.js';

export const DEFAULT_MODEL = 'claude-opus-5-5';

const STYLE_GUIDE = `Tu es Raphaël Scotton, développeur web indépendant à Grenoble (Subnet, subnet-online.com). Tu fais des sites sur mesure pour les commerces et les indépendants : réservation en ligne, acompte, devis, prise de rendez-vous, carte ou catalogue, panneau d'administration simple. Pas de commission ni d'abonnement du genre Planity, TheFork ou Treatwell : le site appartient au commerçant.

Tu écris à un commerçant que tu ne connais pas, sur WhatsApp, depuis ton téléphone. Il doit avoir l'impression qu'un jeune du coin, sérieux et direct, lui écrit personnellement, pas qu'un logiciel a généré un texte.

Le message (350 à 600 caractères, 3 ou 4 paragraphes séparés par une ligne vide) :
- « Bonjour » puis qui tu es en une phrase courte (prénom, Grenoble, ce que tu fais). Jamais « j'espère que vous allez bien », jamais « je me permets ».
- Une ou deux observations concrètes et VRAIES sur ce commerce, tirées uniquement des données fournies : pas de site, seulement la fiche Google ou Instagram, la note et le nombre d'avis, un détail qui revient dans les avis, la spécialité, le quartier. Cite les chiffres tels quels (« 4,7 sur 86 avis »). N'invente rien : si un fait n'est pas dans les données, il n'existe pas.
- Une phrase sur ce que tu proposes pour SON métier, avec un bénéfice précis (réservations qui tombent le soir, acompte contre les rendez-vous non honorés, devis demandés en deux minutes, carte à jour sans appeler personne).
- Une proposition légère et une porte de sortie : passer montrer un exemple cinq minutes quand c'est calme (si le commerce est près de Grenoble), ou envoyer un exemple ici ; « sinon pas de souci ».
- Une formule finale courte. Le prénom « Raphaël » apparaît une fois (au début ou en signature).
- Vouvoiement. Phrases courtes, quelques tournures orales (« je suis tombé sur », « ça marche bien », « c'est costaud »), pas de jargon.
- Interdits absolus : emojis, listes, tirets cadratins, majuscules d'insistance, « n'hésitez pas », « je me permets », « en tant que », « solution », « optimiser », « booster », « digital », « visibilité », « présence en ligne », « accompagner », « site vitrine », « clé en main », superlatifs, promesses chiffrées, point d'exclamation à chaque phrase, lien ou URL.

La relance (2 ou 3 phrases, une semaine plus tard) : rappelle qui tu es en quelques mots, une seule relance, propose d'arrêter là si ce n'est pas le moment.

L'analyse (deux phrases, pour Raphaël lui-même) : 1) le commerce et sa présence en ligne (site, Instagram, plateformes, avis) ; 2) l'angle d'approche et ce qui peut freiner.`;

// Variantes imposées pour que cinquante messages ne se ressemblent pas.
const OPENERS = [
  'Commence par « Bonjour, je m’appelle Raphaël, … » et présente-toi en une phrase.',
  'Commence par « Bonjour, Raphaël de Subnet, … » (ce que tu fais, Grenoble).',
  'Commence par « Bonjour ! Raphaël, développeur web à Grenoble. » puis enchaîne directement sur l’observation.',
  'Commence par « Bonjour, » suivi directement de l’observation sur le commerce ; présente-toi seulement dans la deuxième phrase.',
];
const CLOSERS = [
  'Termine par une proposition de passer montrer un exemple cinq minutes, quand c’est calme, et « sinon pas de souci ».',
  'Termine en proposant d’envoyer ici un exemple de site pour son métier, sans engagement.',
  'Termine par une question simple (« ça vaut le coup qu’on en parle ? ») et une porte de sortie.',
];
const variation = (p) => {
  const seed = [...String(p.id || p.name || '')].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const closers = isNearGrenoble(p) ? CLOSERS : CLOSERS.slice(1);
  return `${OPENERS[seed % OPENERS.length]} ${closers[seed % closers.length]}`;
};

const SCHEMA = {
  type: 'object',
  properties: {
    analysis: { type: 'string', description: 'Analyse interne en deux phrases.' },
    message: { type: 'string', description: 'Premier message WhatsApp, prêt à envoyer.' },
    followUp: { type: 'string', description: 'Relance une semaine plus tard.' },
  },
  required: ['analysis', 'message', 'followUp'],
  additionalProperties: false,
};

// Faits transmis au modèle : uniquement ce qui est connu du prospect.
export function prospectFacts(p) {
  const g = p.google;
  return {
    nom: p.name,
    activite: p.kindLabel,
    secteur: sectorOf(p.sector).label,
    ville: cityOf(p),
    adresse: [p.address?.street, p.address?.postcode].filter(Boolean).join(', ') || undefined,
    distance: isNearGrenoble(p) ? 'proche de Grenoble (Raphaël peut passer)' : 'loin de Grenoble (pas de visite : exemple à distance ou appel)',
    telephone: p.phoneKind === 'whatsapp' ? 'WhatsApp confirmé' : p.phoneKind === 'mobile' ? 'numéro mobile (probablement WhatsApp)' : 'ligne fixe',
    site_internet: p.website ? p.website : 'aucun',
    instagram: p.instagram || undefined,
    facebook: p.facebook || undefined,
    horaires: p.openingHours || undefined,
    google: g ? { note: g.rating, nombre_avis: g.reviews, statut: g.status || undefined, extraits_avis: g.samples?.map((s) => `${s.rating ?? '?'}/5 : ${s.text}`) } : 'pas de données Google',
    verification: p.verified?.note || undefined,
    fonctionnalite_a_mettre_en_avant: sectorOf(p.sector).feature,
  };
}

const BANNED = /n[’']hésitez pas|je me permets|en tant que|booster|digital|optimiser|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|^\s*[-•]/imu;

// Vérifie qu'un texte généré respecte les règles de style les plus visibles.
export function looksHuman(text) {
  return typeof text === 'string' && text.length >= 200 && text.length <= 900 && !BANNED.test(text) && !/https?:\/\//.test(text);
}

export function createWriter({ apiKey, model = DEFAULT_MODEL, log, client } = {}) {
  if (!apiKey && !client) return null;
  let sdk = client;
  async function getClient() {
    if (sdk) return sdk;
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    sdk = new Anthropic({ apiKey, maxRetries: 2, timeout: 60000 });
    return sdk;
  }

  return {
    model,
    // Retourne { analysis, message, followUp } ou null si la réponse est inutilisable.
    async write(prospect, { signal } = {}) {
      const anthropic = await getClient();
      const response = await anthropic.messages.create(
        {
          model,
          // La réflexion du modèle compte dans max_tokens : large marge pour ne pas couper le JSON.
          max_tokens: 8000,
          system: [{ type: 'text', text: STYLE_GUIDE, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: `Contrainte de variation pour celui-ci : ${variation(prospect)}\n\nVoici le commerce :\n${JSON.stringify(prospectFacts(prospect), null, 2)}\n\nRédige l'analyse, le message et la relance.` }],
          output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        },
        { signal },
      );
      if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
        log?.warn?.(`Prospection : réponse incomplète du modèle pour ${prospect.name} (${response.stop_reason}).`);
        return null;
      }
      const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        log?.warn?.(`Prospection : JSON invalide du modèle pour ${prospect.name}.`);
        return null;
      }
      // Les données du commerce (nom, horaires, avis) sont des contenus tiers : tout
      // texte produit doit rester dans les bornes, sans lien ni formule interdite.
      const followUpOk = typeof data.followUp === 'string' && data.followUp.length >= 60 && data.followUp.length <= 600 && !BANNED.test(data.followUp) && !/https?:\/\//.test(data.followUp);
      const analysisOk = typeof data.analysis === 'string' && data.analysis.length >= 40 && data.analysis.length <= 600 && !/https?:\/\//.test(data.analysis);
      if (!looksHuman(data.message) || !followUpOk || !analysisOk) {
        log?.warn?.(`Prospection : message rejeté par les règles de style pour ${prospect.name}.`);
        return null;
      }
      return { analysis: data.analysis.trim(), message: data.message.trim(), followUp: data.followUp.trim() };
    },
  };
}
