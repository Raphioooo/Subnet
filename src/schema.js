// Description des contenus modifiables depuis l'administration.
// Chaque page d'admin est composée de sections ; chaque section cible un
// objet du contenu (chemin "path") et liste les champs modifiables.

import { SECTOR_SLUGS } from './defaults.js';

export const SECTOR_OPTIONS = [
  { value: 'restaurateurs', label: 'Restaurateurs' },
  { value: 'tatoueurs', label: 'Tatoueurs & tatoueuses' },
  { value: 'instituts', label: 'Instituts & bien-être' },
  { value: 'tpe-pme', label: 'TPE & PME' },
  { value: 'autre', label: 'Autre activité' },
];

// Types et statuts des demandes reçues via les formulaires.
export const REQUEST_TYPES = [
  { value: 'devis', label: 'Devis' },
  { value: 'contact', label: 'Question' },
];

export const REQUEST_STATUSES = [
  { value: 'nouvelle', label: 'Nouvelle' },
  { value: 'en-cours', label: 'En cours' },
  { value: 'traitee', label: 'Traitée' },
];

// Choix proposés dans le formulaire de contact public.
export const CONTACT_SECTOR_OPTIONS = [
  { value: 'restaurateurs', label: 'Restaurant' },
  { value: 'tatoueurs', label: 'Studio de tatouage' },
  { value: 'instituts', label: 'Institut de beauté ou bien-être' },
  { value: 'tpe-pme', label: 'TPE ou PME' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'autre', label: 'Autre activité' },
];

export const SOCIAL_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'threads', label: 'Threads' },
  { value: 'behance', label: 'Behance' },
  { value: 'dribbble', label: 'Dribbble' },
  { value: 'malt', label: 'Malt' },
  { value: 'github', label: 'GitHub' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'tripadvisor', label: 'Tripadvisor' },
  { value: 'googlemaps', label: 'Google Maps' },
  { value: 'autre', label: 'Autre lien' },
];

export const ICON_OPTIONS = [
  ['calendar-check', 'Réservation'], ['calendar-days', 'Calendrier'], ['calendar-clock', 'Créneaux'],
  ['credit-card', 'Paiement'], ['wallet', 'Acompte'], ['hand-coins', 'Encaissement'], ['badge-euro', 'Tarif'],
  ['receipt', 'Facture'], ['file-check', 'Devis accepté'], ['clipboard-list', 'Demande'], ['bell', 'Notification'],
  ['layout-dashboard', 'Tableau de bord'], ['chart-no-axes-column', 'Statistiques'], ['user-round', 'Client'],
  ['timer', 'Durée'], ['ticket', 'Billet'], ['list-checks', 'Liste'],
  ['house', 'Accueil'], ['layers', 'Services'], ['images', 'Galerie'], ['image', 'Image'],
  ['camera', 'Photo'], ['mail', 'Email'], ['phone', 'Téléphone'], ['message-circle', 'Message'],
  ['info', 'Information'], ['mouse-pointer-click', 'Action'], ['scale', 'Juridique'],
  ['smartphone', 'Mobile'], ['monitor-smartphone', 'Multi-écrans'], ['calendar', 'Agenda'],
  ['clock', 'Horaires'], ['map-pin', 'Adresse'], ['star', 'Étoile'], ['heart', 'Cœur'],
  ['sparkles', 'Étincelles'], ['gem', 'Premium'], ['shield-check', 'Confiance'],
  ['badge-check', 'Qualité'], ['award', 'Distinction'], ['users', 'Équipe'], ['globe', 'Web'],
  ['search', 'Référencement'], ['chart-line', 'Croissance'], ['zap', 'Rapidité'],
  ['palette', 'Design'], ['sliders-horizontal', 'Réglages'], ['target', 'Objectif'],
  ['store', 'Commerce'], ['utensils', 'Restauration'], ['wine', 'Vin'], ['coffee', 'Café'],
  ['pen-tool', 'Création'], ['flower-2', 'Bien-être'], ['leaf', 'Nature'], ['scissors', 'Beauté'],
  ['briefcase', 'Entreprise'], ['building-2', 'Bâtiment'], ['hammer', 'Artisanat'],
  ['wrench', 'Technique'], ['refresh-cw', 'Mise à jour'], ['key-round', 'Autonomie'],
  ['file-text', 'Document'], ['lock', 'Sécurité'], ['check', 'Validation'],
].map(([value, label]) => ({ value, label }));

const eyebrow = { key: 'eyebrow', type: 'text', label: 'Surtitre', max: 80, half: true };
const title = { key: 'title', type: 'text', label: 'Titre', max: 160, required: true };
const text = (label = 'Texte', rows = 3) => ({ key: 'text', type: 'textarea', label, rows, max: 1200 });
const titleText = () => [
  { key: 'title', type: 'text', label: 'Titre', max: 120, required: true },
  { key: 'text', type: 'textarea', label: 'Texte', rows: 2, max: 600 },
];
const iconTitleText = () => [
  { key: 'icon', type: 'select', label: 'Icône', options: ICON_OPTIONS, iconPicker: true, half: true },
  { key: 'title', type: 'text', label: 'Titre', max: 120, required: true, half: true },
  { key: 'text', type: 'textarea', label: 'Texte', rows: 2, max: 600 },
];
const heroFields = [
  eyebrow,
  title,
  { key: 'subtitle', type: 'textarea', label: 'Sous-titre', rows: 2, max: 400 },
];
const journeyStepFields = [
  { key: 'title', type: 'text', label: 'Titre', max: 80, required: true },
  { key: 'text', type: 'textarea', label: 'Texte', rows: 2, max: 300 },
  { key: 'image', type: 'image', label: 'Capture d’écran (format téléphone)' },
];

export const PAGES = [
  {
    id: 'general',
    title: 'Général',
    icon: 'settings',
    description: 'Nom du site, logo, référencement, bandeau d’information et appel à l’action commun à toutes les pages.',
    view: '/',
    sections: [
      {
        title: 'Identité',
        path: 'site',
        fields: [
          { key: 'name', type: 'text', label: 'Nom du site', max: 60, required: true, half: true },
          { key: 'tagline', type: 'text', label: 'Signature', max: 120, half: true },
          {
            key: 'logo',
            type: 'image',
            label: 'Logo',
            help: 'Optionnel. Format horizontal sur fond transparent (PNG ou WebP). Sans logo, le nom du site est affiché.',
            keepAlpha: true,
          },
        ],
      },
      {
        title: 'Référencement et partage',
        path: 'site',
        fields: [
          {
            key: 'description',
            type: 'textarea',
            label: 'Description',
            rows: 3,
            max: 300,
            help: 'Affichée dans les résultats de recherche et en pied de page. Environ 150 caractères.',
          },
          {
            key: 'url',
            type: 'url',
            label: 'Adresse du site',
            placeholder: 'https://www.exemple.fr',
            help: 'Utilisée pour le plan du site et les liens de partage.',
          },
          {
            key: 'shareImage',
            type: 'image',
            label: 'Image de partage',
            help: 'Affichée lors d’un partage sur les réseaux sociaux (1200 × 630 px conseillé). Par défaut : visuel Subnet.',
          },
        ],
      },
      {
        title: 'Bandeau d’information',
        description: 'Un message affiché en haut de toutes les pages : fermeture exceptionnelle, nouveauté, offre du moment…',
        path: 'site.notice',
        fields: [
          { key: 'enabled', type: 'toggle', label: 'Afficher le bandeau' },
          { key: 'text', type: 'text', label: 'Message', max: 160 },
          { key: 'linkLabel', type: 'text', label: 'Texte du lien', max: 40, half: true },
          { key: 'link', type: 'link', label: 'Lien', placeholder: '/contact', half: true },
        ],
      },
      {
        title: 'Appel à l’action',
        description: 'Le bloc « Parlons de votre projet » affiché en bas des pages.',
        path: 'cta',
        fields: [
          title,
          text('Texte', 2),
          { key: 'buttonLabel', type: 'text', label: 'Texte du bouton', max: 40, half: true },
          { key: 'buttonLink', type: 'link', label: 'Lien du bouton', half: true },
        ],
      },
    ],
  },
  {
    id: 'home',
    title: 'Accueil',
    icon: 'house',
    description: 'Les textes et visuels de la page d’accueil.',
    view: '/',
    sections: [
      {
        title: 'Bandeau principal',
        path: 'home.hero',
        fields: [
          ...heroFields,
          { key: 'primaryLabel', type: 'text', label: 'Bouton principal', max: 40, half: true },
          { key: 'primaryLink', type: 'link', label: 'Lien du bouton principal', half: true },
          { key: 'secondaryLabel', type: 'text', label: 'Lien secondaire', max: 40, half: true },
          { key: 'secondaryLink', type: 'link', label: 'Destination du lien secondaire', half: true },
        ],
      },
      {
        title: 'Positionnement',
        path: 'home.pillars',
        fields: [
          eyebrow,
          title,
          text(),
          { key: 'items', type: 'repeater', label: 'Points clés', itemLabel: 'title', addLabel: 'Ajouter un point', maxItems: 6, fields: titleText() },
        ],
      },
      {
        title: 'Parcours client',
        description: 'Les trois étapes de réservation présentées sur la page d’accueil.',
        path: 'home.journey',
        fields: [
          eyebrow,
          title,
          text('Texte', 2),
          {
            key: 'steps',
            type: 'repeater',
            label: 'Étapes',
            itemLabel: 'title',
            thumbKey: 'image',
            addLabel: 'Ajouter une étape',
            maxItems: 4,
            fields: journeyStepFields,
          },
        ],
      },
      {
        title: 'Pour qui',
        description: 'Les cartes des secteurs se modifient dans la rubrique « Secteurs ».',
        path: 'home.sectors',
        fields: [eyebrow, title, text('Texte', 2), { key: 'note', type: 'text', label: 'Note', max: 200 }],
      },
      {
        title: 'L’offre',
        description: 'Les éléments de l’offre se modifient dans la rubrique « L’offre ».',
        path: 'home.offer',
        fields: [eyebrow, title, text('Texte', 2), { key: 'linkLabel', type: 'text', label: 'Texte du lien', max: 60 }],
      },
      {
        title: 'Espace d’administration',
        path: 'home.admin',
        fields: [
          eyebrow,
          title,
          text(),
          { key: 'image', type: 'image', label: 'Visuel' },
          { key: 'points', type: 'repeater', label: 'Avantages', itemLabel: 'title', addLabel: 'Ajouter un avantage', maxItems: 4, fields: iconTitleText() },
        ],
      },
      {
        title: 'Pourquoi nous',
        path: 'home.why',
        fields: [
          eyebrow,
          title,
          text(),
          { key: 'linkLabel', type: 'text', label: 'Texte du lien', max: 60 },
          { key: 'items', type: 'repeater', label: 'Arguments', itemLabel: 'title', addLabel: 'Ajouter un argument', maxItems: 4, fields: iconTitleText() },
        ],
      },
      {
        title: 'Réalisations',
        description: 'Les projets se gèrent dans la rubrique « Réalisations ».',
        path: 'home.projects',
        fields: [eyebrow, title, text('Texte', 2), { key: 'linkLabel', type: 'text', label: 'Texte du lien', max: 60 }],
      },
    ],
  },
  {
    id: 'offer',
    title: 'L’offre',
    icon: 'layers',
    description: 'Le détail de l’offre : périmètre, structure, administration, comparatif, design et bénéfices.',
    view: '/offre',
    sections: [
      { title: 'En-tête de page', path: 'offer.hero', fields: heroFields },
      {
        title: 'Périmètre',
        path: 'offer.scope',
        fields: [eyebrow, title, text(), { key: 'closing', type: 'textarea', label: 'Conclusion', rows: 2, max: 600 }],
      },
      {
        title: 'Éléments inclus',
        description: 'Affichés sur la page d’accueil et sur la page de l’offre.',
        path: 'offer',
        fields: [
          {
            key: 'features',
            type: 'repeater',
            label: 'Éléments',
            itemLabel: 'title',
            addLabel: 'Ajouter un élément',
            maxItems: 12,
            fields: [
              { key: 'icon', type: 'select', label: 'Icône', options: ICON_OPTIONS, iconPicker: true, half: true },
              { key: 'title', type: 'text', label: 'Titre', max: 80, required: true, half: true },
              { key: 'text', type: 'textarea', label: 'Texte', rows: 2, max: 300 },
            ],
          },
        ],
      },
      {
        title: 'Modules',
        path: 'offer.structure',
        fields: [
          eyebrow,
          title,
          text('Texte', 2),
          {
            key: 'steps',
            type: 'repeater',
            label: 'Modules',
            itemLabel: 'title',
            addLabel: 'Ajouter un module',
            maxItems: 10,
            thumbKey: 'image',
            fields: [
              { key: 'title', type: 'text', label: 'Titre', max: 80, required: true },
              { key: 'text', type: 'textarea', label: 'Texte', rows: 2, max: 600 },
              { key: 'items', type: 'list', label: 'Contenu', addLabel: 'Ajouter une ligne', maxItems: 12 },
              { key: 'image', type: 'image', label: 'Illustration (facultatif)', half: true },
              {
                key: 'imageFormat',
                type: 'select',
                label: 'Format de l’illustration',
                options: [
                  { value: 'phone', label: 'Écran de téléphone' },
                  { value: 'browser', label: 'Écran d’ordinateur' },
                ],
                half: true,
              },
            ],
          },
        ],
      },
      {
        title: 'Administration',
        path: 'offer.admin',
        fields: [
          eyebrow,
          title,
          text(),
          { key: 'itemsTitle', type: 'text', label: 'Titre de la liste', max: 80 },
          { key: 'items', type: 'list', label: 'Contenus modifiables', addLabel: 'Ajouter une ligne', maxItems: 20 },
          { key: 'points', type: 'repeater', label: 'Avantages', itemLabel: 'title', addLabel: 'Ajouter un avantage', maxItems: 4, fields: iconTitleText() },
          { key: 'note', type: 'textarea', label: 'Note', rows: 2, max: 600 },
        ],
      },
      {
        title: 'Comparatif',
        path: 'offer.comparison',
        fields: [
          eyebrow,
          title,
          text(),
          {
            key: 'columns',
            type: 'group',
            label: 'En-têtes des colonnes',
            fields: [
              { key: 'criterion', type: 'text', label: 'Colonne 1', max: 40, half: true },
              { key: 'diy', type: 'text', label: 'Colonne 2', max: 40, half: true },
              { key: 'platform', type: 'text', label: 'Colonne 3', max: 40, half: true },
              { key: 'ours', type: 'text', label: 'Colonne 4 (mise en avant)', max: 40, half: true },
            ],
          },
          {
            key: 'rows',
            type: 'repeater',
            label: 'Lignes',
            itemLabel: 'criterion',
            addLabel: 'Ajouter une ligne',
            maxItems: 15,
            fields: [
              { key: 'criterion', type: 'text', label: 'Critère', max: 80, required: true },
              { key: 'diy', type: 'text', label: 'Colonne 2', max: 160, half: true },
              { key: 'platform', type: 'text', label: 'Colonne 3', max: 160, half: true },
              { key: 'ours', type: 'text', label: 'Colonne 4 (mise en avant)', max: 160 },
            ],
          },
        ],
      },
      {
        title: 'Design',
        path: 'offer.design',
        fields: [
          eyebrow,
          title,
          text(),
          { key: 'items', type: 'list', label: 'Principes', addLabel: 'Ajouter un principe', maxItems: 12 },
          { key: 'closing', type: 'textarea', label: 'Conclusion', rows: 3, max: 800 },
        ],
      },
      {
        title: 'Bénéfices',
        path: 'offer.benefits',
        fields: [eyebrow, title, text('Texte (optionnel)', 2), { key: 'items', type: 'list', label: 'Bénéfices', addLabel: 'Ajouter un bénéfice', maxItems: 12 }],
      },
    ],
  },
  {
    id: 'sectors',
    title: 'Secteurs',
    icon: 'layout-grid',
    description: 'Les pages dédiées à chaque métier et leurs visuels.',
    view: '/secteurs',
    sections: [
      { title: 'En-tête de la page Secteurs', path: 'sectorsPage.hero', fields: heroFields },
      {
        title: 'Encadré « autres activités »',
        path: 'sectorsPage.note',
        fields: [
          { key: 'title', type: 'text', label: 'Titre', max: 120 },
          { key: 'text', type: 'textarea', label: 'Texte', rows: 2, max: 400 },
        ],
      },
      {
        title: 'Secteurs',
        description: 'Chaque secteur dispose de sa propre page. Leur ordre est modifiable.',
        path: '',
        fields: [
          {
            key: 'sectors',
            type: 'repeater',
            label: 'Secteurs',
            itemLabel: 'name',
            thumbKey: 'image',
            fixed: true,
            matchKey: 'slug',
            fields: [
              { key: 'slug', type: 'hidden' },
              { key: 'name', type: 'text', label: 'Nom', max: 60, required: true, half: true },
              { key: 'shortName', type: 'text', label: 'Nom court', max: 24, required: true, half: true, help: 'Utilisé dans les onglets de la page d’accueil.' },
              { key: 'tone', type: 'text', label: 'Ton', max: 60, half: true },
              { key: 'icon', type: 'select', label: 'Icône', options: ICON_OPTIONS, iconPicker: true, half: true },
              { key: 'title', type: 'text', label: 'Titre de la page', max: 120, required: true },
              { key: 'intro', type: 'textarea', label: 'Introduction', rows: 3, max: 600 },
              { key: 'highlightsTitle', type: 'text', label: 'Titre de la liste', max: 80 },
              { key: 'highlights', type: 'list', label: 'Ce que le site met en avant', addLabel: 'Ajouter une ligne', maxItems: 12 },
              {
                key: 'features',
                type: 'repeater',
                label: 'Fonctionnalités mises en avant',
                itemLabel: 'title',
                addLabel: 'Ajouter une fonctionnalité',
                maxItems: 4,
                fields: iconTitleText(),
              },
              { key: 'journeyTitle', type: 'text', label: 'Titre du parcours client', max: 120 },
              {
                key: 'journey',
                type: 'repeater',
                label: 'Parcours client',
                itemLabel: 'title',
                thumbKey: 'image',
                addLabel: 'Ajouter une étape',
                maxItems: 4,
                fields: journeyStepFields,
              },
              { key: 'image', type: 'image', label: 'Visuel ordinateur', half: true },
              { key: 'mobileImage', type: 'image', label: 'Visuel mobile', half: true },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'projects',
    title: 'Réalisations',
    icon: 'images',
    description: 'La galerie de projets : ajoutez, masquez ou réordonnez vos réalisations.',
    view: '/realisations',
    sections: [
      {
        title: 'En-tête de page',
        path: 'projectsPage',
        fields: [
          { key: 'hero', type: 'group', label: '', fields: heroFields },
          { key: 'emptyText', type: 'text', label: 'Message si aucune réalisation', max: 200 },
        ],
      },
      {
        title: 'Projets',
        description: 'Le premier projet de la liste apparaît en premier sur le site.',
        path: '',
        fields: [
          {
            key: 'projects',
            type: 'repeater',
            label: 'Projets',
            itemLabel: 'title',
            thumbKey: 'image',
            addLabel: 'Ajouter un projet',
            idKey: 'id',
            maxItems: 60,
            fields: [
              { key: 'id', type: 'hidden' },
              { key: 'visible', type: 'toggle', label: 'Afficher sur le site', default: true },
              { key: 'title', type: 'text', label: 'Nom du projet', max: 80, required: true, half: true },
              { key: 'badge', type: 'text', label: 'Étiquette', max: 30, placeholder: 'Client, Concept…', half: true },
              { key: 'sector', type: 'select', label: 'Secteur', options: SECTOR_OPTIONS, half: true },
              { key: 'url', type: 'url', label: 'Lien vers le site (optionnel)', placeholder: 'https://', half: true },
              { key: 'image', type: 'image', label: 'Image principale', required: true, half: true },
              { key: 'mobileImage', type: 'image', label: 'Capture mobile (facultatif)', half: true },
              { key: 'description', type: 'textarea', label: 'Description', rows: 3, max: 500 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: 'circle-help',
    description: 'Les questions fréquentes et leurs réponses.',
    view: '/faq',
    sections: [
      { title: 'En-tête de page', path: 'faqPage.hero', fields: heroFields },
      {
        title: 'Questions',
        path: '',
        fields: [
          {
            key: 'faq',
            type: 'repeater',
            label: 'Questions',
            itemLabel: 'question',
            addLabel: 'Ajouter une question',
            maxItems: 40,
            fields: [
              { key: 'question', type: 'text', label: 'Question', max: 200, required: true },
              { key: 'answer', type: 'markdown', label: 'Réponse', rows: 4, max: 3000 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'contact',
    title: 'Coordonnées',
    icon: 'map-pin',
    description: 'Email, téléphone, adresse, horaires et réseaux sociaux, affichés sur la page contact et en pied de page.',
    view: '/contact',
    sections: [
      {
        title: 'Coordonnées',
        path: 'contact',
        fields: [
          { key: 'email', type: 'email', label: 'Email', placeholder: 'contact@exemple.fr', half: true },
          { key: 'phone', type: 'tel', label: 'Téléphone', placeholder: '06 12 34 56 78', half: true },
          { key: 'address', type: 'textarea', label: 'Adresse', rows: 3, max: 300, help: 'Laissez vide si vous ne recevez pas de public.' },
          { key: 'area', type: 'text', label: 'Zone d’intervention', max: 160, placeholder: 'Ex. Lyon et alentours, ou partout en France à distance' },
        ],
      },
      {
        title: 'Horaires',
        path: 'contact',
        fields: [
          {
            key: 'hours',
            type: 'repeater',
            label: 'Horaires',
            itemLabel: 'label',
            addLabel: 'Ajouter une ligne',
            maxItems: 10,
            inline: true,
            fields: [
              { key: 'label', type: 'text', label: 'Jours', max: 60, placeholder: 'Lundi – vendredi', half: true },
              { key: 'value', type: 'text', label: 'Horaires', max: 80, placeholder: '9 h – 18 h', half: true },
            ],
          },
        ],
      },
      {
        title: 'Réseaux sociaux',
        path: 'contact',
        fields: [
          {
            key: 'socials',
            type: 'repeater',
            label: 'Réseaux',
            itemLabel: 'network',
            addLabel: 'Ajouter un réseau',
            maxItems: 12,
            inline: true,
            fields: [
              { key: 'network', type: 'select', label: 'Réseau', options: SOCIAL_OPTIONS, half: true },
              { key: 'url', type: 'url', label: 'Adresse du profil', placeholder: 'https://', required: true, half: true },
            ],
          },
        ],
      },
      {
        title: 'Page contact',
        path: 'contact.page',
        fields: [
          eyebrow,
          title,
          { key: 'intro', type: 'textarea', label: 'Introduction', rows: 2, max: 400 },
          { key: 'modulesLabel', type: 'text', label: 'Titre des cases à cocher', max: 80 },
          {
            key: 'modules',
            type: 'list',
            label: 'Fonctionnalités proposées dans le formulaire',
            addLabel: 'Ajouter une fonctionnalité',
            maxItems: 12,
            itemMax: 60,
          },
          { key: 'infoTitle', type: 'text', label: 'Titre des coordonnées', max: 60 },
          { key: 'success', type: 'text', label: 'Message de confirmation', max: 200 },
          { key: 'privacy', type: 'textarea', label: 'Mention sous le formulaire', rows: 2, max: 400 },
        ],
      },
    ],
  },
  {
    id: 'legal',
    title: 'Pages légales',
    icon: 'scale',
    description: 'Vos informations légales et le contenu des pages réglementaires.',
    view: '/mentions-legales',
    sections: [
      {
        title: 'Informations légales',
        description:
          'Ces informations alimentent automatiquement les pages légales grâce aux balises entre doubles accolades, par exemple {{entreprise}} ou {{siret}}.',
        path: 'legal.identity',
        fields: [
          { key: 'company', type: 'text', label: 'Raison sociale ou nom', max: 120, half: true, help: '{{entreprise}}' },
          { key: 'legalForm', type: 'text', label: 'Forme juridique', max: 80, half: true, placeholder: 'Entreprise individuelle, SAS…', help: '{{forme_juridique}}' },
          { key: 'siret', type: 'text', label: 'SIRET', max: 40, half: true, help: '{{siret}}' },
          { key: 'rcs', type: 'text', label: 'Immatriculation (RCS, RNE…)', max: 120, half: true, help: '{{rcs}} · optionnel' },
          { key: 'vat', type: 'text', label: 'N° de TVA intracommunautaire', max: 40, half: true, help: '{{tva}} · optionnel' },
          { key: 'capital', type: 'text', label: 'Capital social', max: 40, half: true, help: '{{capital}} · optionnel' },
          { key: 'address', type: 'textarea', label: 'Adresse du siège', rows: 2, max: 300, help: '{{adresse}}' },
          { key: 'director', type: 'text', label: 'Directeur ou directrice de la publication', max: 120, help: '{{directeur_publication}}' },
          { key: 'hostName', type: 'text', label: 'Hébergeur', max: 120, half: true, help: '{{hebergeur}}' },
          { key: 'hostContact', type: 'text', label: 'Contact de l’hébergeur', max: 160, half: true, help: '{{hebergeur_contact}} · optionnel' },
          { key: 'hostAddress', type: 'textarea', label: 'Adresse de l’hébergeur', rows: 2, max: 300, help: '{{hebergeur_adresse}}' },
        ],
      },
      ...[
        ['mentions', 'Mentions légales'],
        ['privacy', 'Politique de confidentialité'],
        ['cookies', 'Politique de cookies'],
        ['terms', 'Conditions générales'],
      ].map(([key, label]) => ({
        title: label,
        path: `legal.${key}`,
        collapsed: true,
        fields: [
          { key: 'published', type: 'toggle', label: 'Page publiée' },
          { key: 'title', type: 'text', label: 'Titre', max: 120, required: true },
          { key: 'body', type: 'markdown', label: 'Contenu', rows: 22, max: 40000 },
        ],
      })),
    ],
  },
];

export function getPage(id) {
  return PAGES.find((p) => p.id === id);
}

export { SECTOR_SLUGS };
