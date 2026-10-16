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

Lorsque vous utilisez le formulaire de demande de devis, nous collectons les informations que vous nous transmettez : nom et prénom, adresse email et, si vous les renseignez, numéro de téléphone, nom de votre entreprise, secteur d’activité, fonctionnalités souhaitées et contenu de votre message.

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

Le Prestataire conçoit et réalise des sites et applications web sur mesure ainsi que les prestations associées décrites dans le devis : conception graphique, développement des fonctionnalités (réservation en ligne, paiement d’acompte, devis, gestion des horaires), mise en place du panneau d’administration, intégration des contenus et mise en ligne.

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

Le Prestataire est tenu à une obligation de moyens. Sa responsabilité ne saurait être engagée en cas de contenu fourni par le Client, de mauvaise utilisation de l’espace d’administration ou de défaillance d’un service tiers (hébergeur, prestataire de paiement, registraire de nom de domaine, messagerie).

## 9. Droit applicable et litiges

Les présentes conditions sont soumises au droit français. En cas de litige, les parties rechercheront une solution amiable avant toute action judiciaire.

Contact : {{email}}`;


export const defaults = {
  meta: { version: 3, updatedAt: null, createdAt: null, sections: null },

  site: {
    name: 'Subnet',
    tagline: 'Sites sur mesure avec réservation, acompte et devis',
    description:
      'Création de sites internet sur mesure à Grenoble et partout en France : réservation en ligne, acompte, devis, horaires et panneau d’administration pour restaurateurs, tatoueurs, instituts, TPE et PME.',
    shareName: 'Subnet – Création de sites internet',
    url: '',
    logo: '',
    shareImage: '',
    notice: { enabled: false, text: '', linkLabel: '', link: '' },
  },

  contact: {
    email: '',
    phone: '',
    address: '',
    area: 'Grenoble (Isère) · Auvergne-Rhône-Alpes · Toute la France en visio',
    city: 'Grenoble',
    postalCode: '',
    region: 'Auvergne-Rhône-Alpes',
    areasServed: ['Grenoble', 'Isère', 'Auvergne-Rhône-Alpes', 'France'],
    founder: 'Raphaël Scotton',
    hours: [],
    socials: [],
    page: {
      eyebrow: 'Demande de devis',
      title: 'Parlons de votre projet.',
      intro:
        'Dites-nous qui vous êtes et ce dont vous avez besoin : réservation, acompte, devis, horaires… Nous revenons vers vous avec une proposition et un devis clair.',
      modulesLabel: 'Fonctionnalités souhaitées',
      modules: [
        'Réservation en ligne',
        'Paiement d’acompte',
        'Devis en ligne',
        'Gestion des horaires',
        'Panneau d’administration',
        'Galerie ou portfolio',
      ],
      infoTitle: 'Coordonnées',
      success: 'Merci, votre demande a bien été envoyée. Nous revenons vers vous très vite avec une proposition.',
      privacy:
        'Vos informations sont utilisées uniquement pour répondre à votre demande. Elles ne sont jamais cédées à des tiers.',
      seo: {
        title: 'Devis site internet à Grenoble – Contact | Subnet',
        description:
          'Demandez un devis pour votre site internet sur mesure. Basé à Grenoble, Subnet accompagne les pros en Auvergne-Rhône-Alpes et dans toute la France.',
        h1: 'Demandez un devis pour votre site internet',
      },
    },
  },

  home: {
    seo: {
      title: 'Création de site internet sur mesure à Grenoble | Subnet',
      description:
        'Création de sites internet sur mesure à Grenoble pour restaurants, tatoueurs, instituts et TPE/PME : réservation, acompte, devis et panneau admin.',
      h1: 'Création de sites internet sur mesure à Grenoble',
    },
    hero: {
      eyebrow: 'Sites sur mesure, full stack',
      title: 'Le site qui fait tourner votre activité.',
      subtitle:
        'Réservation en ligne, acompte, devis, horaires et panneau d’administration : un site complet et élégant pour les restaurateurs, tatoueurs, instituts, TPE et PME.',
      primaryLabel: 'Demander un devis',
      primaryLink: '/contact',
      secondaryLabel: 'Découvrir l’offre',
      secondaryLink: '/offre',
    },
    pillars: {
      eyebrow: 'Positionnement',
      title: 'Plus qu’une vitrine. Votre outil de travail.',
      text:
        'Votre site ne se contente pas de présenter votre activité : il prend les réservations, sécurise vos rendez-vous, envoie vos devis et vous fait gagner du temps chaque jour.',
      items: [
        { title: 'Prendre des réservations', text: 'Vos clients réservent en ligne, à toute heure, sur les créneaux que vous ouvrez.' },
        { title: 'Sécuriser vos rendez-vous', text: 'Un acompte réglé en ligne à la réservation limite les annulations de dernière minute.' },
        { title: 'Envoyer vos devis', text: 'Des demandes complètes, des devis envoyés et acceptés en ligne, sans aller-retour.' },
        { title: 'Gérer vos horaires', text: 'Horaires, disponibilités et fermetures exceptionnelles à jour en quelques secondes.' },
        { title: 'Tout piloter au même endroit', text: 'Un panneau d’administration clair pour suivre réservations, paiements et demandes.' },
      ],
    },
    journey: {
      eyebrow: 'Côté client',
      title: 'Réserver devient un réflexe.',
      text: 'Un parcours limpide, du choix du créneau à la confirmation, en moins d’une minute sur mobile.',
      steps: [
        {
          title: 'Choisir son créneau',
          text: 'Prestation, date et heure disponibles, calculées selon vos horaires.',
          image: '/assets/images/journey/etape-1.webp',
        },
        {
          title: 'Régler l’acompte',
          text: 'Paiement sécurisé par carte, en quelques secondes.',
          image: '/assets/images/journey/etape-2.webp',
        },
        {
          title: 'Recevoir la confirmation',
          text: 'Confirmation immédiate et rappel par email avant le rendez-vous.',
          image: '/assets/images/journey/etape-3.webp',
        },
      ],
    },
    sectors: {
      eyebrow: 'Pour qui',
      title: 'Un site pensé pour votre métier.',
      text: 'Réservation de table, demande de projet, prise de rendez-vous ou devis : chaque site s’adapte à votre façon de travailler.',
      note: 'Commerce ou activité de service ? L’offre s’adapte aussi à vous.',
    },
    offer: {
      eyebrow: 'L’offre',
      title: 'Tout ce qu’il faut. Rien de superflu.',
      text: 'Un site sur mesure qui réunit présentation, réservation, paiement et gestion, conçu autour de votre activité.',
      linkLabel: 'Voir le détail de l’offre',
    },
    admin: {
      eyebrow: 'Panneau d’administration',
      title: 'Vous gardez la main.',
      text:
        'Réservations, acomptes, devis, horaires et contenus : tout se gère depuis un seul espace, simple et rapide, sans passer par un développeur.',
      image: '/assets/images/admin-preview.webp',
      points: [
        { icon: 'layout-dashboard', title: 'Votre journée en un coup d’œil', text: 'Réservations, paiements et demandes du jour, réunis sur un seul écran.' },
        { icon: 'key-round', title: 'Votre autonomie', text: 'Horaires, prestations, tarifs et contenus : vous modifiez tout, à votre rythme.' },
      ],
    },
    why: {
      eyebrow: 'Pourquoi Subnet',
      title: 'Le meilleur des deux mondes.',
      text:
        'Les fonctionnalités d’une plateforme de réservation, l’image d’un site premium à votre nom. Sans compromis.',
      linkLabel: 'Voir le comparatif',
      items: [
        { icon: 'gem', title: 'Votre marque, pas celle d’une plateforme', text: 'Vos clients réservent et paient sur votre site, à vos couleurs.' },
        { icon: 'layers', title: 'Un outil complet', text: 'Réservation, acompte, devis et horaires réunis dans un seul système.' },
        { icon: 'shield-check', title: 'Vos clients, vos données', text: 'Vous gardez la relation client et l’historique de votre activité.' },
      ],
    },
    projects: {
      eyebrow: 'Réalisations',
      title: 'Des univers, pas des modèles.',
      text: 'Chaque site part de la même exigence de clarté, puis s’adapte à l’univers et au fonctionnement de son activité.',
      linkLabel: 'Voir les réalisations',
    },
  },

  offer: {
    seo: {
      title: 'Site sur mesure avec réservation, devis et admin | Subnet',
      description:
        'Un site sur mesure avec réservation en ligne, acompte, devis, horaires et panneau d’administration. Conçu à Grenoble, pour toute la France.',
      h1: 'Un site internet sur mesure avec son panneau d’administration',
    },
    hero: {
      eyebrow: 'L’offre',
      title: 'Un site complet, pensé pour votre activité.',
      subtitle: 'Le design d’un site premium, les fonctionnalités d’un véritable outil métier.',
    },
    scope: {
      eyebrow: 'Ce qui est inclus',
      title: 'Un site sur mesure, de la présentation à la gestion.',
      text:
        'Chaque projet est conçu autour de votre activité : vous choisissez les fonctionnalités dont vous avez besoin, le site les réunit dans une expérience fluide.',
      closing:
        'Le tout dans un design épuré, rapide et pensé pour inspirer confiance, sur ordinateur comme sur mobile.',
    },
    features: [
      { icon: 'calendar-check', title: 'Réservation en ligne', text: 'Créneaux, prestations, capacité et confirmations automatiques, à toute heure.' },
      { icon: 'credit-card', title: 'Paiement d’acompte', text: 'Un acompte réglé en ligne, en toute sécurité, à la réservation ou à la commande.' },
      { icon: 'file-text', title: 'Devis en ligne', text: 'Des demandes complètes, des devis envoyés depuis votre espace et acceptés en ligne.' },
      { icon: 'clock', title: 'Gestion des horaires', text: 'Horaires d’ouverture, disponibilités, congés et fermetures exceptionnelles.' },
      { icon: 'layout-dashboard', title: 'Panneau d’administration', text: 'Réservations, paiements, devis, clients et contenus réunis au même endroit.' },
      { icon: 'bell', title: 'Notifications automatiques', text: 'Confirmations et rappels par email, pour vous comme pour vos clients.' },
      { icon: 'images', title: 'Présentation soignée', text: 'Services, galerie ou portfolio, carte et informations pratiques mis en valeur.' },
      { icon: 'smartphone', title: 'Parfait sur mobile', text: 'Réserver, payer ou demander un devis en quelques gestes, depuis un téléphone.' },
    ],
    structure: {
      eyebrow: 'Fonctionnalités',
      title: 'Des modules qui travaillent pour vous.',
      text: 'Chaque site combine les modules utiles à votre activité. Les plus demandés :',
      steps: [
        {
          title: 'Réservation en ligne',
          text: 'Vos clients choisissent une prestation, une date et un créneau disponible, puis reçoivent une confirmation immédiate.',
          items: [
            'Créneaux calculés selon vos horaires et disponibilités',
            'Prestations, durées, capacité ou nombre de couverts',
            'Confirmation et rappel automatiques par email',
            'Modification ou annulation selon vos conditions',
            'Planning des réservations dans votre espace',
          ],
          image: '/assets/images/concepts/restaurant-mobile.webp',
          imageFormat: 'phone',
        },
        {
          title: 'Acompte en ligne',
          text: 'Un acompte est demandé à la réservation ou à la commande pour sécuriser vos rendez-vous et vos projets.',
          items: [
            'Paiement sécurisé par carte bancaire',
            'Montant fixe ou pourcentage, selon la prestation',
            'Conditions d’annulation et de remboursement claires',
            'Suivi des paiements dans le panneau d’administration',
          ],
          image: '/assets/images/journey/etape-2.webp',
          imageFormat: 'phone',
        },
        {
          title: 'Devis',
          text: 'Les demandes arrivent complètes, vous répondez vite, et le client accepte le devis en ligne.',
          items: [
            'Formulaire de demande adapté à votre métier',
            'Devis préparé et envoyé depuis votre espace',
            'Acceptation en ligne et acompte à la signature',
            'Suivi des statuts : envoyé, accepté, refusé',
          ],
          image: '/assets/images/concepts/pme-mobile.webp',
          imageFormat: 'phone',
        },
        {
          title: 'Gestion des horaires',
          text: 'Vos horaires et disponibilités se gèrent à un seul endroit et se mettent à jour partout sur le site.',
          items: [
            'Horaires d’ouverture et services',
            'Disponibilités par prestation ou par membre de l’équipe',
            'Congés et fermetures exceptionnelles',
            'Bandeau d’information sur le site en un clic',
          ],
          image: '/assets/images/modules/horaires.webp',
          imageFormat: 'phone',
        },
        {
          title: 'Panneau d’administration',
          text: 'Un espace simple et rapide pour piloter votre activité au quotidien.',
          items: [
            'Réservations, acomptes et devis',
            'Fiches clients et historique',
            'Prestations, tarifs, textes et photos',
            'Pages légales et conditions générales',
          ],
          image: '/assets/images/admin-preview.webp',
          imageFormat: 'browser',
        },
      ],
    },
    admin: {
      eyebrow: 'Administration',
      title: 'Votre activité, sous contrôle.',
      text:
        'Un panneau d’administration pensé pour le quotidien : vous gérez votre activité sans passer par un développeur.',
      itemsTitle: 'Depuis votre espace, vous gérez :',
      items: [
        'Les réservations',
        'Les acomptes et paiements',
        'Les devis',
        'Les horaires et disponibilités',
        'Les fermetures exceptionnelles',
        'Les prestations et tarifs',
        'Les fiches clients',
        'Les textes et photos',
        'La galerie ou le portfolio',
        'Les coordonnées et réseaux sociaux',
        'Les pages légales et CGV',
      ],
      points: [
        { icon: 'refresh-cw', title: 'Toujours à jour', text: 'Horaires, disponibilités ou tarifs changent ? Le site suit immédiatement.' },
        { icon: 'key-round', title: 'Votre autonomie', text: 'Vous gardez la main sur vos réservations, vos paiements et vos contenus.' },
      ],
      note:
        'En restauration, dans la beauté ou le tatouage, cette autonomie fait la différence : services, créneaux, périodes de fermeture et prestations évoluent sans cesse.',
    },
    comparison: {
      eyebrow: 'Comparatif',
      title: 'Le juste équilibre.',
      text:
        'Assembler plusieurs outils soi-même prend du temps ; dépendre d’une plateforme de réservation impose son image et ses conditions. Subnet réunit le meilleur des deux.',
      columns: {
        criterion: 'Critère',
        diy: 'Site + outils à assembler',
        platform: 'Plateforme de réservation',
        ours: 'Subnet',
      },
      rows: [
        { criterion: 'Réservation en ligne', diy: 'Extension à configurer soi-même', platform: 'Oui, sur l’interface de la plateforme', ours: 'Intégrée à votre site, à vos couleurs' },
        { criterion: 'Acompte', diy: 'Rarement prévu', platform: 'Selon la plateforme et ses conditions', ours: 'Paiement sécurisé à la réservation' },
        { criterion: 'Devis', diy: 'Formulaire basique', platform: 'Rarement proposé', ours: 'Demande, envoi et acceptation en ligne' },
        { criterion: 'Horaires et disponibilités', diy: 'À mettre à jour à plusieurs endroits', platform: 'Gérés sur la plateforme', ours: 'Gérés une fois, à jour partout' },
        { criterion: 'Image de marque', diy: 'Dépend fortement de l’utilisateur', platform: 'Celle de la plateforme', ours: 'La vôtre, premium et cohérente' },
        { criterion: 'Relation client', diy: 'Dispersée entre plusieurs outils', platform: 'Partagée avec la plateforme', ours: 'Vos clients et vos données restent chez vous' },
        { criterion: 'Administration', diy: 'Plusieurs interfaces', platform: 'Interface imposée', ours: 'Un seul panneau, pensé pour vous' },
      ],
    },
    design: {
      eyebrow: 'Design',
      title: 'Une esthétique maîtrisée.',
      text:
        'Un design épuré, une typographie soignée et des parcours limpides : réserver, payer ou demander un devis devient évident.',
      items: [
        'Une grande clarté de lecture',
        'Des compositions propres',
        'Une hiérarchie visuelle forte',
        'Des visuels valorisés par l’espace',
        'Une esthétique premium mais discrète',
        'Des parcours simples à comprendre',
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
        'Des réservations prises à toute heure, sans décrocher le téléphone',
        'Moins de rendez-vous non honorés grâce à l’acompte',
        'Des devis envoyés et acceptés plus rapidement',
        'Des horaires et disponibilités toujours à jour',
        'Un seul espace pour gérer toute votre activité',
        'Votre image de marque, pas celle d’une plateforme',
        'Un site rapide, sécurisé et pensé pour inspirer confiance',
      ],
    },
  },

  sectorsPage: {
    seo: {
      title: 'Sites pour restaurants, tatoueurs, instituts et PME | Subnet',
      description:
        'Restaurant, studio de tatouage, institut de beauté ou PME : un site internet adapté à votre métier, avec réservation, devis et acompte en ligne.',
      h1: 'Des sites internet adaptés à chaque métier',
    },
    hero: {
      eyebrow: 'Secteurs',
      title: 'Pensé pour votre métier.',
      subtitle:
        'Réservation de table, demande de projet, rendez-vous ou devis : les fonctionnalités et le ton s’adaptent à votre activité.',
    },
    note: {
      title: 'Commerce ou activité de service ?',
      text:
        'L’offre s’adresse aussi aux commerces et aux activités de service : réservation, acompte, devis et gestion des horaires s’adaptent à votre fonctionnement.',
    },
  },

  sectors: [
    {
      slug: 'restaurateurs',
      shortName: 'Restaurant',
      name: 'Restaurateurs',
      icon: 'utensils',
      tone: 'Chaleureux et raffiné',
      title: 'Vos tables se réservent, même en plein service.',
      intro:
        'Un site élégant qui donne envie de venir, avec la réservation de table en ligne, l’acompte pour les groupes et vos horaires toujours à jour.',
      highlightsTitle: 'Ce que votre site gère pour vous',
      highlights: [
        'Réservation de table selon vos services et votre capacité',
        'Acompte pour les groupes, privatisations et soirées spéciales',
        'Demandes de devis pour les événements et privatisations',
        'Horaires des services et fermetures exceptionnelles',
        'Carte, menus du moment et photos modifiables',
        'Planning des réservations et des couverts dans votre espace',
      ],
      features: [
        { icon: 'calendar-check', title: 'Réservation de table', text: 'Date, heure et nombre de couverts : vos clients réservent et reçoivent une confirmation immédiate.' },
        { icon: 'credit-card', title: 'Acompte pour les groupes', text: 'Sécurisez les grandes tablées et les soirées spéciales avec un acompte réglé en ligne.' },
        { icon: 'clock', title: 'Services et horaires', text: 'Midi, soir, fermetures exceptionnelles : votre site et vos créneaux restent synchronisés.' },
      ],
      journeyTitle: 'Une table réservée en trois gestes.',
      journey: [
        {
          title: 'Choisir sa table',
          text: 'Date, couverts et service : seuls les créneaux encore disponibles sont proposés.',
          image: '/assets/images/concepts/restaurant-mobile.webp',
        },
        {
          title: 'Régler l’acompte',
          text: 'Pour les groupes, un acompte par couvert est réglé en ligne, en quelques secondes.',
          image: '/assets/images/parcours/restaurant-acompte.webp',
        },
        {
          title: 'Recevoir la confirmation',
          text: 'Confirmation immédiate par email, puis rappel la veille du repas.',
          image: '/assets/images/parcours/restaurant-confirmation.webp',
        },
      ],
      image: '/assets/images/concepts/restaurant-desktop.webp',
      imageAlt: 'Site de restaurant sur ordinateur : carte, horaires et réservation',
      mobileImage: '/assets/images/concepts/restaurant-mobile.webp',
      mobileImageAlt: 'Site de restaurant sur mobile avec réservation de table en ligne',
      seo: {
        title: 'Création site restaurant avec réservation en ligne | Subnet',
        description:
          'Site internet pour restaurant avec réservation de table en ligne, acompte pour les groupes, carte et horaires modifiables. Sans commission. Grenoble.',
        h1: 'Site internet pour restaurant avec réservation en ligne',
      },
    },
    {
      slug: 'tatoueurs',
      shortName: 'Tatouage',
      name: 'Tatoueurs & tatoueuses',
      icon: 'pen-tool',
      tone: 'Artistique et pointu',
      title: 'Du projet à la séance, sans aller-retour.',
      intro:
        'Un portfolio premium qui valorise votre style, avec la demande de projet, le devis, l’acompte et la réservation de séance réunis sur votre site.',
      highlightsTitle: 'Ce que votre site gère pour vous',
      highlights: [
        'Demande de projet détaillée : zone, taille, style, références',
        'Devis envoyé depuis votre espace et accepté en ligne',
        'Acompte versé à la réservation de la séance',
        'Agenda des séances et disponibilités par artiste',
        'Portfolio classé par style ou par projet',
        'Consignes avant et après la séance',
      ],
      features: [
        { icon: 'file-text', title: 'Demande de projet et devis', text: 'Les demandes arrivent complètes : vous chiffrez, envoyez le devis, le client l’accepte en ligne.' },
        { icon: 'credit-card', title: 'Acompte à la réservation', text: 'La séance est confirmée une fois l’acompte réglé : fini les rendez-vous oubliés.' },
        { icon: 'calendar-check', title: 'Agenda des séances', text: 'Vos disponibilités et celles de vos artistes, gérées depuis un seul espace.' },
      ],
      journeyTitle: 'Une demande claire, une séance confirmée.',
      journey: [
        {
          title: 'Décrire son projet',
          text: 'Style, emplacement, taille et références : la demande arrive complète.',
          image: '/assets/images/parcours/tatouage-demande.webp',
        },
        {
          title: 'Accepter le devis',
          text: 'Le devis envoyé depuis votre espace est accepté en ligne, avec l’acompte.',
          image: '/assets/images/concepts/tatouage-mobile.webp',
        },
        {
          title: 'Réserver sa séance',
          text: 'La séance est confirmée, avec vos consignes et un rappel la veille.',
          image: '/assets/images/parcours/tatouage-seance.webp',
        },
      ],
      image: '/assets/images/concepts/tatouage-desktop.webp',
      imageAlt: 'Site de studio de tatouage sur ordinateur avec portfolio par style',
      mobileImage: '/assets/images/concepts/tatouage-mobile.webp',
      mobileImageAlt: 'Site de tatoueur sur mobile avec portfolio et demande de projet',
      seo: {
        title: 'Site internet tatoueur : portfolio, devis, acompte | Subnet',
        description:
          'Site internet pour tatoueur et studio de tatouage : portfolio par style, demande de projet, devis et acompte en ligne, réservation de séance.',
        h1: 'Site internet pour tatoueur : portfolio, devis et acompte',
      },
    },
    {
      slug: 'instituts',
      shortName: 'Institut',
      name: 'Instituts & bien-être',
      icon: 'flower-2',
      tone: 'Doux et élégant',
      title: 'Votre agenda se remplit tout seul.',
      intro:
        'Un site qui reflète l’ambiance de votre institut, avec la prise de rendez-vous en ligne par prestation, l’acompte et vos horaires toujours à jour.',
      highlightsTitle: 'Ce que votre site gère pour vous',
      highlights: [
        'Prise de rendez-vous en ligne par prestation et par durée',
        'Acompte ou paiement à la réservation',
        'Horaires, créneaux, congés et fermetures exceptionnelles',
        'Carte des soins et tarifs modifiables',
        'Confirmations et rappels automatiques par email',
        'Planning et fiches clients dans votre espace',
      ],
      features: [
        { icon: 'calendar-check', title: 'Rendez-vous en ligne', text: 'Vos clientes choisissent leur soin et un créneau disponible, à toute heure.' },
        { icon: 'credit-card', title: 'Acompte sécurisé', text: 'Un acompte à la réservation limite les absences et les annulations tardives.' },
        { icon: 'bell', title: 'Rappels automatiques', text: 'Une confirmation puis un rappel par email avant chaque rendez-vous.' },
      ],
      journeyTitle: 'Un rendez-vous pris en moins d’une minute.',
      journey: [
        {
          title: 'Choisir son soin',
          text: 'Soin, date et créneau disponibles, selon vos horaires et votre équipe.',
          image: '/assets/images/journey/etape-1.webp',
        },
        {
          title: 'Régler l’acompte',
          text: 'Paiement sécurisé par carte : les rendez-vous non honorés se font rares.',
          image: '/assets/images/journey/etape-2.webp',
        },
        {
          title: 'Recevoir la confirmation',
          text: 'Confirmation immédiate, ajout à l’agenda et rappel la veille.',
          image: '/assets/images/journey/etape-3.webp',
        },
      ],
      image: '/assets/images/concepts/institut-desktop.webp',
      imageAlt: 'Site d’institut de beauté sur ordinateur avec liste des soins',
      mobileImage: '/assets/images/concepts/institut-mobile.webp',
      mobileImageAlt: 'Site d’institut de beauté sur mobile avec prise de rendez-vous',
      seo: {
        title: 'Site institut de beauté avec prise de RDV en ligne | Subnet',
        description:
          'Site internet pour institut de beauté et bien-être : prise de rendez-vous en ligne par soin, acompte, rappels et horaires à jour. Sans commission.',
        h1: 'Site internet pour institut de beauté avec rendez-vous en ligne',
      },
    },
    {
      slug: 'tpe-pme',
      shortName: 'Entreprise',
      name: 'TPE & PME',
      icon: 'briefcase',
      tone: 'Institutionnel et rassurant',
      title: 'Du devis à l’acompte, tout se passe en ligne.',
      intro:
        'Un site institutionnel et commercial qui présente votre entreprise, reçoit des demandes de devis complètes et sécurise vos commandes avec un acompte.',
      highlightsTitle: 'Ce que votre site gère pour vous',
      highlights: [
        'Demandes de devis structurées selon vos services',
        'Devis préparés, envoyés et suivis depuis votre espace',
        'Acompte à l’acceptation du devis ou à la commande',
        'Prise de rendez-vous ou planification d’interventions',
        'Présentation de l’entreprise, des services et des réalisations',
        'Pages légales et conditions générales intégrées',
      ],
      features: [
        { icon: 'file-text', title: 'Devis en ligne', text: 'Demande, chiffrage, envoi et acceptation : chaque devis est suivi de bout en bout.' },
        { icon: 'credit-card', title: 'Acompte à la commande', text: 'Le client accepte le devis et règle l’acompte en ligne, en toute sécurité.' },
        { icon: 'calendar-check', title: 'Rendez-vous et interventions', text: 'Visites, rendez-vous ou chantiers planifiés selon vos disponibilités.' },
      ],
      journeyTitle: 'Une demande complète, une commande lancée.',
      journey: [
        {
          title: 'Demander un devis',
          text: 'Type de projet, dimensions et photos : vous avez tout pour chiffrer.',
          image: '/assets/images/parcours/pme-demande.webp',
        },
        {
          title: 'Valider le devis',
          text: 'Le client accepte le devis en ligne et verse l’acompte à la commande.',
          image: '/assets/images/concepts/pme-mobile.webp',
        },
        {
          title: 'Planifier l’intervention',
          text: 'Acompte reçu, rendez-vous fixé : chaque étape du projet est suivie.',
          image: '/assets/images/parcours/pme-suivi.webp',
        },
      ],
      image: '/assets/images/concepts/pme-desktop.webp',
      imageAlt: 'Site de PME sur ordinateur présentant les services et réalisations',
      mobileImage: '/assets/images/concepts/pme-mobile.webp',
      mobileImageAlt: 'Site de PME sur mobile avec formulaire de demande de devis',
      seo: {
        title: 'Création site internet TPE PME avec devis en ligne | Subnet',
        description:
          'Site internet pour TPE et PME : présentation, demandes de devis détaillées, devis accepté en ligne et acompte à la commande. Basé à Grenoble.',
        h1: 'Site internet pour TPE et PME avec devis en ligne',
      },
    },
  ],

  projectsPage: {
    seo: {
      title: 'Exemples de sites internet par secteur | Subnet',
      description:
        'Exemples de sites sur mesure pour restaurant, studio de tatouage, institut et PME : réservation, devis, acompte et panneau d’administration.',
      h1: 'Exemples de sites internet par secteur',
    },
    hero: {
      eyebrow: 'Réalisations',
      title: 'Des univers, pas des modèles.',
      subtitle:
        'Chaque site part de la même exigence de clarté, puis s’adapte à l’univers et au fonctionnement de son activité.',
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
        'Réservation de table en ligne, acompte pour les groupes, carte et horaires gérés depuis le panneau d’administration.',
      image: '/assets/images/concepts/restaurant-desktop.webp',
      mobileImage: '/assets/images/concepts/restaurant-mobile.webp',
      url: '',
    },
    {
      id: 'concept-tatouage',
      visible: true,
      title: 'Atelier Noir',
      badge: 'Concept',
      sector: 'tatoueurs',
      description:
        'Portfolio classé par style, demande de projet, devis accepté en ligne et acompte à la réservation de la séance.',
      image: '/assets/images/concepts/tatouage-desktop.webp',
      mobileImage: '/assets/images/concepts/tatouage-mobile.webp',
      url: '',
    },
    {
      id: 'concept-institut',
      visible: true,
      title: 'Lumen Institut',
      badge: 'Concept',
      sector: 'instituts',
      description:
        'Prise de rendez-vous par soin, acompte sécurisé, rappels automatiques et planning dans l’espace d’administration.',
      image: '/assets/images/concepts/institut-desktop.webp',
      mobileImage: '/assets/images/concepts/institut-mobile.webp',
      url: '',
    },
    {
      id: 'concept-pme',
      visible: true,
      title: 'Arbor Menuiserie',
      badge: 'Concept',
      sector: 'tpe-pme',
      description:
        'Demandes de devis détaillées, devis acceptés en ligne avec acompte à la commande, réalisations et savoir-faire.',
      image: '/assets/images/concepts/pme-desktop.webp',
      mobileImage: '/assets/images/concepts/pme-mobile.webp',
      url: '',
    },
  ],

  faqPage: {
    seo: {
      title: 'FAQ création de site internet sur mesure | Subnet',
      description:
        'Réservation en ligne, acompte, devis, panneau d’administration, propriété des données : les réponses à vos questions avant de créer votre site.',
      h1: 'Questions fréquentes sur la création de votre site',
    },
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
        'Aux restaurateurs, tatoueurs et tatoueuses, instituts de beauté et de bien-être, TPE et PME, ainsi qu’aux commerces et activités de service qui veulent un site complet : réservation, acompte, devis, gestion des horaires et panneau d’administration.',
    },
    {
      question: 'Comment fonctionne la réservation en ligne ?',
      answer:
        'Vos clients choisissent une prestation, une date et un créneau disponible, calculé à partir de vos horaires et de vos disponibilités. Ils reçoivent une confirmation par email, et la réservation apparaît aussitôt dans votre panneau d’administration.',
    },
    {
      question: 'Comment fonctionne l’acompte ?',
      answer:
        'L’acompte est réglé en ligne par carte bancaire, via un prestataire de paiement sécurisé, au moment de la réservation ou de l’acceptation d’un devis. Vous choisissez le montant (fixe ou en pourcentage) et vos conditions d’annulation.',
    },
    {
      question: 'Puis-je envoyer des devis depuis mon site ?',
      answer:
        'Oui. Les demandes arrivent via un formulaire adapté à votre métier. Vous préparez et envoyez le devis depuis votre espace, et votre client l’accepte en ligne, avec un acompte si vous le souhaitez.',
    },
    {
      question: 'Puis-je modifier mes horaires et mes disponibilités moi-même ?',
      answer:
        'Oui. Horaires d’ouverture, créneaux, congés et fermetures exceptionnelles se modifient en quelques secondes depuis le panneau d’administration : le site et les réservations s’adaptent immédiatement.',
    },
    {
      question: 'Que contient le panneau d’administration ?',
      answer:
        'Vos réservations, acomptes, devis et fiches clients, ainsi que tous les contenus du site : textes, photos, prestations, tarifs, horaires, coordonnées et pages légales.',
    },
    {
      question: 'À qui appartiennent les données de mes clients ?',
      answer:
        'À vous. Contrairement à une plateforme de réservation, la relation client reste sur votre site et dans votre espace d’administration.',
    },
    {
      question: 'Mon site sera-t-il adapté aux mobiles ?',
      answer:
        'Oui. Chaque site est pensé d’abord pour le mobile : vos clients réservent, paient ou demandent un devis en quelques gestes.',
    },
    {
      question: 'Comment se déroule un projet ?',
      answer:
        'Nous échangeons d’abord sur votre activité et votre façon de travailler, puis nous définissons ensemble les fonctionnalités utiles. Nous concevons ensuite le site, le testons avec vous et le mettons en ligne. Vous recevez enfin vos accès au panneau d’administration.',
    },
    {
      question: 'Combien coûte un site ?',
      answer:
        'Chaque projet dépend des fonctionnalités choisies. Présentez-nous votre activité et vos besoins : nous vous adressons un devis clair et détaillé.',
    },
  ],

  cta: {
    title: 'Parlons de votre projet.',
    text: 'Présentez-nous votre activité et les fonctionnalités dont vous avez besoin : nous vous proposons une solution adaptée et un devis clair.',
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
