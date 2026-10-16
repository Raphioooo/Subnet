// Contenus par défaut du site. Ils sont copiés dans DATA_DIR/content.json
// au premier démarrage, puis modifiables depuis l'espace d'administration.

export const SECTOR_SLUGS = ['restaurateurs', 'tatoueurs', 'instituts', 'tpe-pme'];

export const LEGAL_PAGES = [
  { key: 'mentions', slug: 'mentions-legales' },
  { key: 'privacy', slug: 'confidentialite' },
  { key: 'cookies', slug: 'cookies' },
  { key: 'terms', slug: 'conditions-generales' },
];

const MENTIONS = `## Éditeur du site

Le site {{nom_site}} ({{url}}) est édité par :

**{{entreprise}}**, {{forme_juridique}}
Capital social : {{capital}}
Siège : {{adresse}}
SIRET : {{siret}}
Immatriculation : {{rcs}}
N° de TVA intracommunautaire : {{tva}}
Email : {{email}}
Téléphone : {{telephone}}

Directeur ou directrice de la publication : {{directeur_publication}}

## Hébergement

Le site est hébergé par :

**{{hebergeur}}**
{{hebergeur_adresse}}
{{hebergeur_contact}}

## Propriété intellectuelle

L’ensemble des contenus présents sur ce site (textes, images, éléments graphiques, logo, structure) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation ou adaptation, totale ou partielle, sans autorisation écrite préalable est interdite.

## Responsabilité

Les informations publiées sur ce site sont fournies à titre indicatif et régulièrement mises à jour. L’éditeur ne saurait être tenu responsable d’une erreur, d’une omission ou d’une indisponibilité temporaire du site.

## Liens externes

Le site peut contenir des liens vers des sites tiers. L’éditeur n’exerce aucun contrôle sur leur contenu et décline toute responsabilité à leur égard.

## Données personnelles

Le traitement des données transmises via le formulaire de contact est détaillé dans la [politique de confidentialité](/confidentialite).

## Droit applicable

Les présentes mentions légales sont soumises au droit français.`;

const PRIVACY = `Cette politique explique comment {{entreprise}} collecte et utilise les données personnelles des visiteurs du site {{nom_site}}, dans le respect du Règlement général sur la protection des données (RGPD) et de la loi Informatique et Libertés.

## Responsable du traitement

{{entreprise}}, {{adresse}}.
Contact : {{email}}

## Données collectées

Lorsque vous utilisez le formulaire de contact, nous collectons les informations que vous nous transmettez : nom et prénom, adresse email et, si vous les renseignez, numéro de téléphone, nom de votre entreprise, secteur d’activité et contenu de votre message.

Le site n’utilise aucun outil de mesure d’audience ni aucun cookie publicitaire.

## Finalité et base légale

Ces données sont utilisées uniquement pour répondre à votre demande et, le cas échéant, vous adresser un devis. Ce traitement repose sur l’exécution de mesures précontractuelles prises à votre demande.

## Destinataires

Les données sont destinées exclusivement à {{entreprise}}. Elles ne sont ni vendues, ni cédées, ni louées à des tiers. Elles sont stockées chez notre hébergeur ({{hebergeur}}).

## Durée de conservation

Les messages sont conservés au maximum trois ans à compter de leur réception, puis supprimés automatiquement.

## Vos droits

Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation et d’opposition au traitement de vos données, ainsi que d’un droit à la portabilité. Pour les exercer, écrivez-nous à {{email}}.

Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL ([www.cnil.fr](https://www.cnil.fr)).

## Sécurité

Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données contre tout accès non autorisé, toute perte ou toute altération.`;

const COOKIES = `## Ce que nous utilisons

Le site {{nom_site}} n’utilise aucun cookie de mesure d’audience, de publicité ou de réseaux sociaux. Aucun consentement n’est donc requis pour le consulter.

## Cookie strictement nécessaire

Un unique cookie technique est déposé lorsque l’administrateur du site se connecte à l’espace d’administration. Il sert uniquement à maintenir la session de connexion et expire automatiquement. Il n’est jamais déposé lors d’une simple visite.

## Gérer les cookies

Vous pouvez à tout moment configurer votre navigateur pour bloquer ou supprimer les cookies. La navigation sur le site reste possible sans cookie.

Pour toute question : {{email}}`;

const TERMS = `Les présentes conditions générales régissent les prestations de création de sites internet proposées par {{entreprise}} (ci-après « le Prestataire ») à ses clients professionnels (ci-après « le Client »).

## 1. Objet

Le Prestataire conçoit et réalise des sites internet vitrines ainsi que les prestations associées décrites dans le devis : conception graphique, intégration des contenus, mise en place de l’espace d’administration et mise en ligne.

## 2. Devis et commande

Chaque prestation fait l’objet d’un devis détaillé, valable pour la durée qui y est indiquée. La commande devient ferme à réception du devis daté et signé, accompagné de la mention « Bon pour accord » et, le cas échéant, de l’acompte prévu.

## 3. Prix et paiement

Les prix sont ceux indiqués dans le devis, qui précise également les modalités de paiement (acompte, échéances, solde).

Conformément aux articles L. 441-10 et D. 441-5 du Code de commerce, tout retard de paiement entraîne de plein droit des pénalités calculées au taux de trois fois le taux d’intérêt légal, ainsi qu’une indemnité forfaitaire pour frais de recouvrement de 40 euros.

## 4. Délais

Les délais de réalisation sont indiqués dans le devis. Ils dépendent notamment de la transmission par le Client des contenus nécessaires (textes, photos, logo, informations légales) et de ses retours lors des étapes de validation.

## 5. Obligations du Client

Le Client fournit des contenus dont il détient les droits et garantit le Prestataire contre toute réclamation à ce titre. Il s’engage à collaborer activement à la réalisation du projet et à valider les étapes qui lui sont soumises.

## 6. Validation et mise en ligne

À l’issue de la réalisation, le site est présenté au Client pour validation avant sa mise en ligne. Les modalités de validation sont précisées dans le devis.

## 7. Propriété intellectuelle

Le transfert des droits d’exploitation sur les éléments créés spécifiquement pour le Client intervient après paiement intégral du prix. Le Prestataire peut mentionner la réalisation parmi ses références, sauf refus écrit du Client.

## 8. Responsabilité

Le Prestataire est tenu à une obligation de moyens. Sa responsabilité ne saurait être engagée en cas de contenu fourni par le Client, de mauvaise utilisation de l’espace d’administration ou de défaillance d’un service tiers (hébergeur, registraire de nom de domaine, messagerie).

## 9. Droit applicable et litiges

Les présentes conditions sont soumises au droit français. En cas de litige, les parties rechercheront une solution amiable avant toute action judiciaire.

Contact : {{email}}`;

export const defaults = {
  meta: { version: 1, updatedAt: null },

  site: {
    name: 'Subnet',
    tagline: 'Sites vitrines minimalistes et administrables',
    description:
      'Subnet conçoit des sites vitrines minimalistes, premium et administrables pour les restaurateurs, tatoueurs, instituts de beauté, TPE et PME.',
    url: '',
    logo: '',
    shareImage: '',
    notice: { enabled: false, text: '', linkLabel: '', link: '' },
  },

  contact: {
    email: '',
    phone: '',
    address: '',
    area: '',
    hours: [],
    socials: [],
    page: {
      eyebrow: 'Contact',
      title: 'Parlons de votre projet.',
      intro:
        'Quelques mots sur votre activité et vos objectifs suffisent. Nous vous proposons ensuite une structure adaptée et un devis clair.',
      infoTitle: 'Coordonnées',
      success: 'Merci, votre message a bien été envoyé. Nous revenons vers vous très vite.',
      privacy:
        'Vos informations sont utilisées uniquement pour répondre à votre demande. Elles ne sont jamais cédées à des tiers.',
    },
  },

  home: {
    hero: {
      eyebrow: 'Création de sites vitrines',
      title: 'L’essentiel, magnifiquement présenté.',
      subtitle:
        'Des sites minimalistes, premium et simples à gérer pour les restaurateurs, tatoueurs, instituts de beauté, TPE et PME.',
      primaryLabel: 'Demander un devis',
      primaryLink: '/contact',
      secondaryLabel: 'Découvrir l’offre',
      secondaryLink: '/offre',
    },
    pillars: {
      eyebrow: 'Positionnement',
      title: 'Plus qu’une vitrine. Un véritable outil commercial.',
      text:
        'Votre site ne se contente pas d’être beau. Il présente votre activité, rassure vos visiteurs et transforme leur intérêt en prise de contact.',
      items: [
        { title: 'Présenter votre activité', text: 'Ce que vous faites, pour qui et pourquoi vous : compris en quelques secondes.' },
        { title: 'Rassurer le visiteur', text: 'Des informations claires et des éléments de réassurance qui inspirent confiance.' },
        { title: 'Valoriser votre savoir-faire', text: 'Vos réalisations, votre lieu et votre univers mis en scène avec soin.' },
        { title: 'Faciliter la prise de contact', text: 'Des appels à l’action visibles et un parcours fluide jusqu’à la demande.' },
        { title: 'Développer votre visibilité', text: 'Une base sérieuse pour votre visibilité locale et la crédibilité de votre marque.' },
      ],
    },
    sectors: {
      eyebrow: 'Pour qui',
      title: 'Un site pensé pour votre métier.',
      text: 'Une base minimaliste qui laisse s’exprimer votre univers, quel que soit votre secteur.',
      note: 'Commerce ou activité de service ? L’offre s’adapte aussi à vous.',
    },
    offer: {
      eyebrow: 'L’offre',
      title: 'Tout ce qu’il faut. Rien de superflu.',
      text: 'Un site vitrine professionnel, conçu sur mesure dans sa structure, sa présentation et son organisation de contenu.',
      linkLabel: 'Voir le détail de l’offre',
    },
    admin: {
      eyebrow: 'Espace d’administration',
      title: 'Vous gardez la main.',
      text:
        'Textes, photos, horaires, prestations : mettez à jour l’essentiel en quelques clics, sans passer par un développeur pour chaque modification.',
      image: '/assets/images/admin-preview.webp',
      points: [
        { title: 'Un site toujours à jour', text: 'Vos informations restent exactes, même quand votre activité évolue.' },
        { title: 'Votre autonomie', text: 'Vous gardez le contrôle de vos contenus, à votre rythme.' },
      ],
    },
    why: {
      eyebrow: 'Pourquoi Subnet',
      title: 'Le juste équilibre.',
      text:
        'Ni outil à tout faire soi-même, ni dépendance totale à un prestataire : un site premium que vous faites vivre en toute simplicité.',
      linkLabel: 'Voir le comparatif',
      items: [
        { title: 'Un rendu premium', text: 'Sobre, professionnel et cohérent avec l’image de votre activité.' },
        { title: 'Une vraie autonomie', text: 'Vos contenus se gèrent depuis un espace d’administration simple.' },
        { title: 'Une approche métier', text: 'Une structure ciblée selon votre activité, pas un modèle générique.' },
      ],
    },
    projects: {
      eyebrow: 'Réalisations',
      title: 'Des univers, pas des modèles.',
      text: 'Chaque site part de la même exigence de clarté, puis s’adapte à l’univers de son activité.',
      linkLabel: 'Voir les réalisations',
    },
  },

  offer: {
    hero: {
      eyebrow: 'L’offre',
      title: 'Un site vitrine pensé comme un outil.',
      subtitle: 'Simple à parcourir pour vos visiteurs. Simple à administrer pour vous.',
    },
    scope: {
      eyebrow: 'Ce qui est inclus',
      title: 'Un périmètre clair, adapté à vos besoins.',
      text:
        'Chaque site est conçu sur mesure dans sa structure, sa présentation et son organisation de contenu. Le périmètre fonctionnel peut inclure :',
      closing:
        'La navigation reste fluide, les contenus sont hiérarchisés, et le design favorise la lisibilité, la confiance et la conversion.',
    },
    features: [
      { icon: 'house', title: 'Une page d’accueil travaillée', text: 'Pour présenter votre activité avec impact dès les premières secondes.' },
      { icon: 'layers', title: 'Vos services et prestations', text: 'Une ou plusieurs pages pour détailler clairement ce que vous proposez.' },
      { icon: 'images', title: 'Une galerie ou un portfolio', text: 'Vos réalisations, votre lieu et votre univers mis en valeur avec élégance.' },
      { icon: 'mail', title: 'Une page contact complète', text: 'Formulaire, téléphone, email, horaires, adresse et liens utiles.' },
      { icon: 'info', title: 'Des informations pratiques', text: 'L’essentiel en un coup d’œil : accès, horaires, réservation…' },
      { icon: 'mouse-pointer-click', title: 'Des appels à l’action', text: 'Des boutons visibles et cohérents avec les objectifs de votre site.' },
      { icon: 'scale', title: 'Les pages légales', text: 'Un socle de pages légales et administratives utiles à votre activité.' },
      { icon: 'smartphone', title: 'Parfait sur tous les écrans', text: 'Une consultation confortable sur ordinateur, tablette et mobile.' },
    ],
    structure: {
      eyebrow: 'Structure',
      title: 'Une base cohérente et efficace.',
      text: 'La structure peut varier selon votre métier. Elle comprend généralement :',
      steps: [
        {
          title: 'Page d’accueil',
          text: 'Elle résume votre identité, vos points forts et votre offre principale.',
          items: [
            'Un grand visuel ou une mise en scène épurée',
            'Une accroche claire',
            'Une présentation rapide de l’activité',
            'Les services ou catégories principales',
            'Des visuels de votre univers',
            'Un ou plusieurs appels à l’action',
            'Les informations essentielles, visibles rapidement',
          ],
        },
        {
          title: 'Services ou prestations',
          text:
            'Vos offres, détaillées de manière claire et ordonnée. Cette page convient aussi bien à un institut, un restaurant ou un tatoueur qu’à une entreprise de services.',
          items: [],
        },
        {
          title: 'Galerie, portfolio ou réalisations',
          text:
            'Un élément central pour les métiers visuels ou expérientiels, simple à mettre à jour et pensé pour mettre vos images en valeur avec élégance.',
          items: [
            'Les plats, le lieu ou l’ambiance pour un restaurant',
            'Les réalisations et les styles pour un tatoueur',
            'L’espace, les soins ou les résultats pour un institut',
            'Les chantiers, produits ou cas clients pour une TPE ou PME',
          ],
        },
        {
          title: 'Contact',
          text: 'Tout ce qu’il faut pour générer des prises de contact rapidement.',
          items: [
            'Formulaire de contact',
            'Numéro de téléphone et adresse email',
            'Adresse physique si besoin',
            'Horaires',
            'Liens vers les réseaux sociaux',
            'Carte ou informations d’accès si pertinent',
          ],
        },
        {
          title: 'Pages utiles et légales',
          text: 'Selon votre activité, le site intègre les pages nécessaires.',
          items: [
            'Mentions légales',
            'Politique de confidentialité',
            'Politique de cookies si nécessaire',
            'Conditions générales et d’utilisation',
            'Informations réglementaires utiles au secteur',
            'FAQ ou informations pratiques',
          ],
        },
      ],
    },
    admin: {
      eyebrow: 'Administration',
      title: 'Votre site, toujours à jour.',
      text:
        'Un espace d’administration vous permet de gérer vos contenus importants sans passer par un développeur pour chaque modification.',
      itemsTitle: 'Vous modifiez facilement :',
      items: [
        'Les textes principaux',
        'Les titres et sous-titres',
        'Les images de la galerie',
        'Les coordonnées de contact',
        'Les horaires',
        'L’adresse',
        'Les liens vers les réseaux sociaux',
        'Les prestations et catégories',
        'Les pages légales',
        'Les conditions générales',
        'Les informations pratiques',
      ],
      points: [
        { title: 'Un site toujours à jour', text: 'Vos informations restent exactes, même quand votre activité évolue.' },
        { title: 'Votre autonomie', text: 'Vous gardez la main sur vos contenus, sans délai ni surcoût.' },
      ],
      note:
        'En restauration, dans la beauté ou le tatouage, cette autonomie fait la différence : horaires, visuels, périodes de fermeture et prestations évoluent régulièrement.',
    },
    comparison: {
      eyebrow: 'Comparatif',
      title: 'Le juste équilibre.',
      text:
        'Beaucoup de solutions imposent soit de tout faire soi-même, soit de dépendre d’un prestataire pour la moindre modification. Cette offre équilibre image de marque, simplicité d’usage et autonomie.',
      columns: {
        criterion: 'Critère',
        diy: 'Outil à faire soi-même',
        agency: 'Agence classique',
        ours: 'Subnet',
      },
      rows: [
        { criterion: 'Mise en place', diy: 'Souvent longue', agency: 'Variable', ours: 'Structurée et pensée pour aller à l’essentiel' },
        { criterion: 'Qualité du rendu', diy: 'Dépend fortement de l’utilisateur', agency: 'Souvent bonne, mais plus coûteuse', ours: 'Premium, sobre et professionnelle' },
        { criterion: 'Simplicité', diy: 'Peut devenir complexe', agency: 'Bonne côté client, mais dépendance forte', ours: 'Simple à utiliser après la mise en place' },
        { criterion: 'Modifications du contenu', diy: 'À gérer seul', agency: 'Souvent facturées ou dépendantes du prestataire', ours: 'Gérables depuis l’espace d’administration' },
        { criterion: 'Galerie et visuels', diy: 'Pas toujours optimisés', agency: 'Selon la prestation', ours: 'Pensés comme des éléments centraux' },
        { criterion: 'Pages légales et infos utiles', diy: 'Souvent oubliées', agency: 'Variables', ours: 'Intégrées dans la structure du site' },
        { criterion: 'Adaptation métier', diy: 'Souvent générique', agency: 'Oui', ours: 'Oui, avec une approche ciblée par activité' },
      ],
    },
    design: {
      eyebrow: 'Design',
      title: 'Une esthétique maîtrisée.',
      text: 'Un design épuré, une typographie soignée et des espaces qui respirent, pour mettre votre contenu au premier plan.',
      items: [
        'Une grande clarté de lecture',
        'Des compositions propres',
        'Une hiérarchie visuelle forte',
        'Des visuels valorisés par l’espace',
        'Une esthétique premium mais discrète',
        'Des interfaces simples à comprendre',
        'Un sentiment de qualité et de maîtrise',
      ],
      closing:
        'Cela ne signifie pas que tous les sites se ressemblent. La base reste minimaliste pour mieux laisser s’exprimer votre univers : chaleureux et raffiné pour un restaurant, artistique et pointu pour un tatoueur, doux et élégant pour un institut, institutionnel et rassurant pour une PME.',
    },
    benefits: {
      eyebrow: 'Bénéfices',
      title: 'Ce que vous y gagnez.',
      text: '',
      items: [
        'Un site professionnel, moderne et cohérent avec l’image de votre activité',
        'Une vitrine claire et rassurante',
        'Vos photos, réalisations ou votre lieu mis en valeur',
        'Une prise de contact facilitée',
        'Des informations utiles centralisées',
        'La main sur vos contenus grâce à l’espace d’administration',
        'Un site durable, lisible et pensé pour inspirer confiance',
      ],
    },
  },

  sectorsPage: {
    hero: {
      eyebrow: 'Secteurs',
      title: 'Pensé pour votre métier.',
      subtitle:
        'Restaurant, studio de tatouage, institut ou entreprise : la structure et le ton s’adaptent à votre activité.',
    },
    note: {
      title: 'Commerce ou activité de service ?',
      text:
        'L’offre s’adresse aussi aux commerces et activités de service qui souhaitent un site vitrine moderne, administrable et durable.',
    },
  },

  sectors: [
    {
      slug: 'restaurateurs',
      shortName: 'Restaurant',
      name: 'Restaurateurs',
      icon: 'utensils',
      tone: 'Chaleureux et raffiné',
      title: 'Donnez envie de pousser la porte.',
      intro:
        'Un site qui met en avant l’univers de votre restaurant, votre carte et vos informations pratiques, pour transformer la curiosité en réservation.',
      highlightsTitle: 'Ce que votre site met en avant',
      highlights: [
        'L’univers de votre restaurant',
        'La carte ou vos spécialités',
        'Les photos du lieu et des plats',
        'Vos horaires',
        'Les informations de réservation',
        'L’adresse et l’accès',
        'Les événements et menus spéciaux',
      ],
      galleryTitle: 'Une galerie qui met en appétit',
      galleryText: 'Les plats, le lieu et l’ambiance, présentés avec élégance.',
      autonomyTitle: 'Toujours à jour',
      autonomyText:
        'Horaires, menus du moment, fermetures exceptionnelles : mettez-les à jour vous-même, en quelques secondes.',
      image: '/assets/images/concepts/restaurant-desktop.webp',
      mobileImage: '/assets/images/concepts/restaurant-mobile.webp',
    },
    {
      slug: 'tatoueurs',
      shortName: 'Tatouage',
      name: 'Tatoueurs & tatoueuses',
      icon: 'pen-tool',
      tone: 'Artistique et pointu',
      title: 'Un portfolio à la hauteur de votre style.',
      intro:
        'Un site pensé comme un portfolio premium, qui valorise votre style artistique et simplifie les demandes de projet.',
      highlightsTitle: 'Ce que votre site met en avant',
      highlights: [
        'Votre style artistique',
        'Une galerie classée par style ou par projet',
        'La présentation du ou des artistes',
        'Un formulaire de demande de projet',
        'Les informations de prise de rendez-vous',
        'Les consignes et informations utiles au client',
      ],
      galleryTitle: 'Un portfolio qui parle pour vous',
      galleryText: 'Vos réalisations et vos styles, classés pour guider vos futurs clients.',
      autonomyTitle: 'Toujours à jour',
      autonomyText:
        'Ajoutez vos dernières pièces, ouvrez vos réservations, précisez vos consignes : tout se gère depuis votre espace.',
      image: '/assets/images/concepts/tatouage-desktop.webp',
      mobileImage: '/assets/images/concepts/tatouage-mobile.webp',
    },
    {
      slug: 'instituts',
      shortName: 'Institut',
      name: 'Instituts & bien-être',
      icon: 'flower-2',
      tone: 'Doux et élégant',
      title: 'L’expérience commence dès votre site.',
      intro:
        'Un site qui reflète l’ambiance de votre institut, présente clairement vos prestations et facilite la prise de rendez-vous.',
      highlightsTitle: 'Ce que votre site met en avant',
      highlights: [
        'La présentation de votre institut',
        'Vos prestations',
        'L’ambiance du lieu',
        'Une galerie',
        'Vos horaires',
        'Les moyens de contact',
        'Les informations de réservation',
        'Des conseils ou une FAQ utile',
      ],
      galleryTitle: 'Une galerie tout en douceur',
      galleryText: 'L’espace, les soins, les résultats ou l’univers de votre marque.',
      autonomyTitle: 'Toujours à jour',
      autonomyText:
        'Nouvelles prestations, horaires ou périodes de fermeture : votre site suit l’évolution de votre institut.',
      image: '/assets/images/concepts/institut-desktop.webp',
      mobileImage: '/assets/images/concepts/institut-mobile.webp',
    },
    {
      slug: 'tpe-pme',
      shortName: 'Entreprise',
      name: 'TPE & PME',
      icon: 'briefcase',
      tone: 'Institutionnel et rassurant',
      title: 'Une image à la hauteur de votre sérieux.',
      intro:
        'Un site plus institutionnel et commercial, qui présente votre entreprise, vos services et vos réalisations, et génère des demandes de devis.',
      highlightsTitle: 'Ce que votre site met en avant',
      highlights: [
        'La présentation de votre entreprise',
        'Vos services',
        'Vos réalisations',
        'Vos valeurs',
        'Vos coordonnées',
        'Les demandes de devis',
        'Les pages légales et administratives',
        'Un site administrable qui suit l’évolution de votre activité',
      ],
      galleryTitle: 'Vos preuves, en images',
      galleryText: 'Chantiers, produits, réalisations ou cas clients.',
      autonomyTitle: 'Toujours à jour',
      autonomyText:
        'Vos services, réalisations et informations évoluent ? Votre site aussi, sans attendre un prestataire.',
      image: '/assets/images/concepts/pme-desktop.webp',
      mobileImage: '/assets/images/concepts/pme-mobile.webp',
    },
  ],

  projectsPage: {
    hero: {
      eyebrow: 'Réalisations',
      title: 'Des univers, pas des modèles.',
      subtitle:
        'Chaque site part de la même exigence de clarté, puis s’adapte à l’univers de son activité.',
    },
    emptyText: 'Les premières réalisations arrivent très bientôt.',
  },

  projects: [
    {
      id: 'concept-restaurant',
      visible: true,
      title: 'Maison Olive',
      badge: 'Concept',
      sector: 'restaurateurs',
      description:
        'Un univers chaleureux et raffiné : la carte de saison, l’ambiance du lieu et la réservation mises en avant dès l’accueil.',
      image: '/assets/images/concepts/restaurant-desktop.webp',
      url: '',
    },
    {
      id: 'concept-tatouage',
      visible: true,
      title: 'Atelier Noir',
      badge: 'Concept',
      sector: 'tatoueurs',
      description:
        'Un portfolio artistique et pointu : galerie classée par style, présentation des artistes et demande de projet en ligne.',
      image: '/assets/images/concepts/tatouage-desktop.webp',
      url: '',
    },
    {
      id: 'concept-institut',
      visible: true,
      title: 'Lumen Institut',
      badge: 'Concept',
      sector: 'instituts',
      description:
        'Une ambiance douce et élégante : prestations claires, univers apaisant et prise de rendez-vous facilitée.',
      image: '/assets/images/concepts/institut-desktop.webp',
      url: '',
    },
    {
      id: 'concept-pme',
      visible: true,
      title: 'Arbor Menuiserie',
      badge: 'Concept',
      sector: 'tpe-pme',
      description:
        'Une présence institutionnelle et rassurante : savoir-faire, réalisations, valeurs et demandes de devis.',
      image: '/assets/images/concepts/pme-desktop.webp',
      url: '',
    },
  ],

  faqPage: {
    hero: {
      eyebrow: 'FAQ',
      title: 'Questions fréquentes.',
      subtitle: 'L’essentiel à savoir avant de vous lancer.',
    },
  },

  faq: [
    {
      question: 'À qui s’adresse cette offre ?',
      answer:
        'Aux restaurateurs, tatoueurs et tatoueuses, instituts de beauté et de bien-être, TPE et PME, ainsi qu’aux commerces et activités de service qui souhaitent un site vitrine moderne, administrable et durable.',
    },
    {
      question: 'Pourrai-je modifier mon site moi-même ?',
      answer:
        'Oui. Un espace d’administration vous permet de modifier vos textes, titres, images de galerie, coordonnées, horaires, adresse, liens vers les réseaux sociaux, prestations et pages légales, sans passer par un développeur.',
    },
    {
      question: 'Quelles pages contiendra mon site ?',
      answer:
        'La structure s’adapte à votre métier. Une base efficace comprend généralement une page d’accueil, une page services, une galerie ou un portfolio, une page contact et les pages légales utiles à votre activité.',
    },
    {
      question: 'Mon site sera-t-il adapté aux mobiles ?',
      answer: 'Oui. Chaque site est pensé pour une consultation confortable sur ordinateur, tablette et mobile.',
    },
    {
      question: 'Mon site ressemblera-t-il à celui des autres ?',
      answer:
        'Non. La base visuelle reste minimaliste pour mieux laisser s’exprimer votre univers : chaleureux et raffiné pour un restaurant, artistique et pointu pour un tatoueur, doux et élégant pour un institut, institutionnel et rassurant pour une PME.',
    },
    {
      question: 'Les pages légales sont-elles prévues ?',
      answer:
        'Oui. Mentions légales, politique de confidentialité, conditions générales ou informations réglementaires : elles sont intégrées à la structure du site et modifiables depuis l’espace d’administration.',
    },
    {
      question: 'Comment se déroule un projet ?',
      answer:
        'Nous échangeons d’abord sur votre activité et vos objectifs. Nous définissons ensuite la structure du site, puis nous le concevons et le mettons en ligne. Vous recevez enfin vos accès à l’espace d’administration.',
    },
    {
      question: 'Combien coûte un site ?',
      answer:
        'Chaque projet est différent. Présentez-nous votre activité et vos besoins : nous vous adressons un devis clair et détaillé.',
    },
  ],

  cta: {
    title: 'Parlons de votre projet.',
    text: 'Présentez-nous votre activité et vos objectifs. Nous vous proposons une structure adaptée et un devis clair.',
    buttonLabel: 'Demander un devis',
    buttonLink: '/contact',
  },

  legal: {
    identity: {
      company: '',
      legalForm: '',
      capital: '',
      siret: '',
      rcs: '',
      vat: '',
      address: '',
      director: '',
      hostName: '',
      hostAddress: '',
      hostContact: '',
    },
    mentions: { title: 'Mentions légales', published: true, body: MENTIONS },
    privacy: { title: 'Politique de confidentialité', published: true, body: PRIVACY },
    cookies: { title: 'Politique de cookies', published: true, body: COOKIES },
    terms: { title: 'Conditions générales', published: true, body: TERMS },
  },
};
