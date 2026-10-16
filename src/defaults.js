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
      platform: {
        eyebrow: 'Site ou plateforme ?',
        title: 'Pourquoi un site plutôt qu’une plateforme ?',
        text: 'Les plateformes comme TheFork apportent de la visibilité, mais vos clients y réservent au milieu d’autres restaurants, selon les conditions de la plateforme. Votre propre site, lui, travaille d’abord pour vous.',
        points: [
          { title: 'Aucune commission sur vos couverts', text: 'Les réservations prises sur votre site ne vous coûtent rien de plus : ni frais par couvert, ni pourcentage. Seuls les frais du prestataire de paiement s’appliquent aux acomptes réglés en ligne.' },
          { title: 'Vos clients restent les vôtres', text: 'Noms, coordonnées et historique des réservations restent dans votre espace : vous recontactez vos habitués sans passer par un intermédiaire.' },
          { title: 'Votre restaurant au premier plan', text: 'Aucun établissement concurrent suggéré à côté du vôtre : votre carte, vos photos et votre ambiance occupent tout l’écran, du premier clic à la confirmation.' },
        ],
      },
      admin: {
        eyebrow: 'Panneau d’administration',
        title: 'Ce que vous gérez depuis votre panneau admin',
        text: 'Tout ce qui change d’un service à l’autre se modifie en quelques secondes, depuis votre ordinateur ou votre téléphone.',
        items: [
          'Les réservations du jour, par service et par nombre de couverts',
          'La capacité de chaque service et les créneaux ouverts à la réservation',
          'Les acomptes demandés pour les groupes et les soirées spéciales',
          'Les horaires, les jours de fermeture et les congés annuels',
          'La carte, les menus du moment et les photos',
          'Les demandes de privatisation et d’événements',
        ],
      },
      process: {
        eyebrow: 'Création',
        title: 'Comment se déroule la création de votre site',
        steps: [
          { title: 'Échange', text: 'Nous parlons de votre restaurant : vos services, votre capacité, vos règles de réservation et l’ambiance que vous voulez transmettre.' },
          { title: 'Maquette', text: 'Vous découvrez la maquette de votre site, avec votre carte et vos photos, et nous l’ajustons ensemble avant le développement.' },
          { title: 'Développement', text: 'Le site est construit avec la réservation de table, l’acompte pour les groupes et vos horaires, puis testé sur ordinateur et sur mobile.' },
          { title: 'Mise en ligne et formation', text: 'Le site est mis en ligne sur votre nom de domaine, et vous apprenez à gérer réservations, horaires et carte depuis votre espace.' },
        ],
      },
      faq: {
        title: 'Questions fréquentes – Restaurateurs',
        items: [
          { question: 'Le site gère-t-il les réservations de groupe ?', answer: 'Oui. Vous fixez à partir de combien de couverts un acompte est demandé. Les privatisations et les événements arrivent sous forme de demande de devis, avec toutes les informations utiles.' },
          { question: 'Est-ce que je paie une commission sur chaque réservation ?', answer: 'Non. Les réservations prises sur votre site ne sont soumises à aucune commission. Seuls les frais du prestataire de paiement s’appliquent aux acomptes réglés en ligne.' },
          { question: 'Puis-je fermer la réservation un soir ou pendant mes congés ?', answer: 'Oui. Depuis votre espace, vous fermez un service, une journée ou une période entière : les créneaux disparaissent aussitôt du site, et un bandeau peut prévenir vos clients.' },
          { question: 'Ma carte et mes menus sont-ils faciles à mettre à jour ?', answer: 'Oui. Plats, prix, menus du moment et photos se modifient depuis le panneau d’administration, sans passer par un développeur.' },
          { question: 'Puis-je garder une plateforme comme TheFork en plus de mon site ?', answer: 'Oui. Rien ne vous oblige à quitter une plateforme : votre site la complète, en offrant à vos habitués un moyen direct de réserver chez vous.' },
        ],
      },
      local: 'Basé à Grenoble, Subnet accompagne les restaurants de l’Isère et de toute la région Auvergne-Rhône-Alpes, de la brasserie de quartier à la table gastronomique. Ailleurs en France, tout se fait en visio.',
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
      platform: {
        eyebrow: 'Site ou messages privés ?',
        title: 'Pourquoi un site plutôt qu’Instagram et les messages privés ?',
        text: 'Instagram reste la vitrine idéale pour montrer votre travail. Mais gérer les projets en messages privés prend un temps fou : informations éparpillées, relances, rendez-vous oubliés. Votre site prend le relais là où les réseaux s’arrêtent.',
        points: [
          { title: 'Des demandes complètes dès le départ', text: 'Emplacement, taille, style et références : le formulaire pose les bonnes questions, et vous chiffrez sans multiplier les allers-retours.' },
          { title: 'Un acompte avant de bloquer la séance', text: 'La séance n’est réservée qu’une fois l’acompte réglé en ligne : les rendez-vous non honorés deviennent l’exception.' },
          { title: 'Votre portfolio mis en valeur', text: 'Vos réalisations classées par style, en grand format, sans publicité ni algorithme qui décide de qui les voit.' },
        ],
      },
      admin: {
        eyebrow: 'Panneau d’administration',
        title: 'Ce que vous gérez depuis votre panneau admin',
        text: 'Votre activité de studio réunie au même endroit, au lieu d’être dispersée entre messages, notes et agenda papier.',
        items: [
          'Les demandes de projet, avec leurs références et leurs photos',
          'Les devis envoyés, acceptés ou en attente',
          'Les acomptes reçus pour chaque séance',
          'L’agenda des séances et les disponibilités de chaque artiste',
          'Le portfolio, classé par style ou par projet',
          'Les consignes à suivre avant et après la séance',
        ],
      },
      process: {
        eyebrow: 'Création',
        title: 'Comment se déroule la création de votre site',
        steps: [
          { title: 'Échange', text: 'Nous parlons de votre style, de votre façon de travailler et de ce que vous attendez d’une demande de projet.' },
          { title: 'Maquette', text: 'Une maquette pensée comme une galerie, avec votre identité visuelle et vos plus belles pièces, ajustée avec vous.' },
          { title: 'Développement', text: 'Formulaire de projet, devis, acompte et agenda des séances sont mis en place, puis testés sur mobile, là où vos clients vous découvrent.' },
          { title: 'Mise en ligne et formation', text: 'Votre site est en ligne, et vous savez publier une pièce, répondre à une demande ou ouvrir des créneaux en quelques minutes.' },
        ],
      },
      faq: {
        title: 'Questions fréquentes – Tatoueurs',
        items: [
          { question: 'Puis-je demander un acompte pour un tatouage ?', answer: 'Oui. Vous fixez le montant de l’acompte, et la séance n’est confirmée qu’une fois le paiement reçu. Vos conditions d’annulation sont affichées au moment de réserver.' },
          { question: 'Mes clients peuvent-ils envoyer leurs références ?', answer: 'Oui. Le formulaire de projet accepte des photos de références et d’emplacement, en plus de la taille, du style et des détails du projet.' },
          { question: 'Puis-je gérer plusieurs artistes ?', answer: 'Oui. Chaque artiste a ses disponibilités et son agenda de séances, et une demande peut être adressée à un artiste en particulier.' },
          { question: 'Instagram ne suffit-il pas ?', answer: 'Instagram est parfait pour montrer votre travail, mais il n’est pas fait pour chiffrer un projet, encaisser un acompte ou tenir un agenda. Votre site s’en charge, et vos publications peuvent y renvoyer.' },
        ],
      },
      local: 'Basé à Grenoble, Subnet accompagne les tatoueurs et les studios de tatouage de l’Isère et de toute la région Auvergne-Rhône-Alpes. Ailleurs en France, tout se fait en visio.',
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
      platform: {
        eyebrow: 'Site ou plateforme ?',
        title: 'Pourquoi un site plutôt qu’une plateforme ?',
        text: 'Une plateforme comme Planity facilite la prise de rendez-vous, mais votre institut y apparaît parmi d’autres, avec la présentation de la plateforme. Avec votre propre site, la réservation se fait chez vous, dans votre univers.',
        points: [
          { title: 'Votre ambiance, au premier coup d’œil', text: 'Couleurs, photos, carte des soins : votre site reflète l’atmosphère de votre institut, là où une plateforme impose la même présentation à tous.' },
          { title: 'Vos clientes restent les vôtres', text: 'Fiches clientes, historique des soins et coordonnées restent dans votre espace, sans intermédiaire entre vous et vos habituées.' },
          { title: 'Aucune commission sur vos rendez-vous', text: 'Les rendez-vous pris sur votre site ne vous coûtent rien de plus. Seuls les frais du prestataire de paiement s’appliquent aux acomptes réglés en ligne.' },
        ],
      },
      admin: {
        eyebrow: 'Panneau d’administration',
        title: 'Ce que vous gérez depuis votre panneau admin',
        text: 'Votre planning, vos soins et vos clientes réunis dans un espace simple, pensé pour être consulté entre deux rendez-vous.',
        items: [
          'Le planning des rendez-vous, par soin et par membre de l’équipe',
          'La carte des soins, leurs durées et leurs tarifs',
          'Les acomptes réglés à la réservation',
          'Les horaires, les congés et les fermetures exceptionnelles',
          'Les fiches clientes et l’historique des soins',
          'Les confirmations et les rappels envoyés automatiquement',
        ],
      },
      process: {
        eyebrow: 'Création',
        title: 'Comment se déroule la création de votre site',
        steps: [
          { title: 'Échange', text: 'Nous faisons le tour de vos soins, de leurs durées, de votre équipe et de l’image que vous souhaitez donner de votre institut.' },
          { title: 'Maquette', text: 'Une maquette douce et élégante, avec votre carte des soins et vos photos, que nous affinons ensemble.' },
          { title: 'Développement', text: 'La prise de rendez-vous par soin, l’acompte et les rappels sont mis en place, puis testés sur ordinateur et sur mobile.' },
          { title: 'Mise en ligne et formation', text: 'Votre site est en ligne, et vous savez modifier un soin, bloquer un créneau ou consulter votre planning en quelques secondes.' },
        ],
      },
      faq: {
        title: 'Questions fréquentes – Instituts',
        items: [
          { question: 'Mes clientes peuvent-elles réserver un soin précis ?', answer: 'Oui. Elles choisissent le soin, sa durée et un créneau disponible selon vos horaires et l’agenda de votre équipe, puis reçoivent une confirmation par email.' },
          { question: 'Comment l’acompte limite-t-il les absences ?', answer: 'Un acompte réglé en ligne à la réservation engage la cliente : les rendez-vous oubliés se font rares, et vos conditions d’annulation sont affichées dès la réservation.' },
          { question: 'Les rappels de rendez-vous sont-ils automatiques ?', answer: 'Oui. Une confirmation est envoyée dès la réservation, puis un rappel par email avant le rendez-vous.' },
          { question: 'Puis-je bloquer mon agenda pendant mes congés ?', answer: 'Oui. Vous bloquez une journée ou une période entière depuis votre espace : les créneaux disparaissent aussitôt du site.' },
        ],
      },
      local: 'Basé à Grenoble, Subnet accompagne les instituts de beauté et de bien-être de l’Isère et de toute la région Auvergne-Rhône-Alpes. Ailleurs en France, tout se fait en visio.',
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
      platform: {
        eyebrow: 'Site ou outils séparés ?',
        title: 'Pourquoi un site plutôt que des outils séparés ?',
        text: 'Formulaire de contact d’un côté, devis sous tableur de l’autre, acomptes par virement à relancer : les demandes se perdent et le suivi prend du temps. Votre site réunit tout le parcours, de la demande à l’acompte.',
        points: [
          { title: 'Des demandes de devis exploitables', text: 'Le formulaire est construit autour de vos services : type de projet, dimensions, délais, photos. Vous avez tout pour chiffrer dès la première demande.' },
          { title: 'Un devis accepté en ligne', text: 'Vous envoyez le devis depuis votre espace, le client l’accepte en ligne et règle l’acompte : la commande est lancée sans attendre un courrier ou une signature scannée.' },
          { title: 'Une image à la hauteur de votre entreprise', text: 'Un site institutionnel clair et rassurant, qui présente vos services, vos réalisations et votre savoir-faire.' },
        ],
      },
      admin: {
        eyebrow: 'Panneau d’administration',
        title: 'Ce que vous gérez depuis votre panneau admin',
        text: 'Le suivi commercial de votre entreprise réuni au même endroit, accessible depuis le bureau comme depuis le terrain.',
        items: [
          'Les demandes de devis, avec leurs pièces jointes',
          'Les devis envoyés, acceptés ou refusés',
          'Les acomptes reçus à la commande',
          'Les rendez-vous, visites et interventions planifiés',
          'Vos services, vos réalisations et vos textes',
          'Vos pages légales et vos conditions générales',
        ],
      },
      process: {
        eyebrow: 'Création',
        title: 'Comment se déroule la création de votre site',
        steps: [
          { title: 'Échange', text: 'Nous analysons vos services, votre façon de chiffrer et le parcours idéal de vos clients, de la première demande à la commande.' },
          { title: 'Maquette', text: 'Une maquette sobre et rassurante, structurée autour de vos services et de vos réalisations, validée avec vous.' },
          { title: 'Développement', text: 'Formulaire de devis, envoi et acceptation en ligne, acompte et planification sont mis en place, puis testés.' },
          { title: 'Mise en ligne et formation', text: 'Le site est en ligne, et votre équipe sait traiter une demande, envoyer un devis et suivre les acomptes.' },
        ],
      },
      faq: {
        title: 'Questions fréquentes – TPE et PME',
        items: [
          { question: 'Mes clients peuvent-ils accepter un devis en ligne ?', answer: 'Oui. Le devis préparé dans votre espace est envoyé au client, qui l’accepte en ligne et peut régler l’acompte dans la foulée.' },
          { question: 'Le formulaire de devis peut-il être adapté à mes services ?', answer: 'Oui. Les questions sont choisies selon votre métier : type de prestation, dimensions, délais souhaités, photos. Vous recevez des demandes complètes, plus faciles à chiffrer.' },
          { question: 'Puis-je planifier des interventions ou des rendez-vous ?', answer: 'Oui. Visites, rendez-vous ou chantiers se planifient selon vos disponibilités, et le client reçoit une confirmation.' },
          { question: 'Le site convient-il à une petite entreprise ?', answer: 'Oui. Chaque site réunit les seuls modules utiles à votre activité : une TPE peut démarrer avec la présentation et les demandes de devis, puis ajouter l’acompte ou la planification plus tard.' },
        ],
      },
      local: 'Basé à Grenoble, Subnet accompagne les TPE et PME de l’Isère et de toute la région Auvergne-Rhône-Alpes : artisans, commerces et entreprises de services. Ailleurs en France, tout se fait en visio.',
      seo: {
        title: 'Création site internet TPE PME avec devis en ligne | Subnet',
        description:
          'Site internet pour TPE et PME : présentation, demandes de devis détaillées, devis accepté en ligne et acompte à la commande. Basé à Grenoble.',
        h1: 'Site internet pour TPE et PME avec devis en ligne',
      },
    },
  ],

  // Page « Création de site internet à Grenoble » (référencement local).
  local: {
    seo: {
      title: 'Création de site internet à Grenoble et en Isère | Subnet',
      description:
        'Création de sites internet sur mesure à Grenoble et en Isère : réservation, acompte, devis et panneau d’administration. Rendez-vous sur place ou en visio.',
      h1: 'Création de site internet à Grenoble',
    },
    hero: {
      eyebrow: 'Grenoble et Isère',
      title: 'Votre site sur mesure, conçu à Grenoble.',
      subtitle:
        'Subnet crée des sites internet complets pour les restaurants, studios de tatouage, instituts, TPE et PME de Grenoble et de l’Isère : réservation en ligne, acompte, devis, horaires et panneau d’administration.',
    },
    intro: {
      eyebrow: 'Sur mesure',
      title: 'Un site qui travaille pour votre activité.',
      text:
        'Un site internet ne se limite plus à une vitrine. À Grenoble comme ailleurs, vos clients veulent réserver une table, prendre rendez-vous ou demander un devis en quelques gestes, depuis leur téléphone. Chaque site Subnet est conçu autour de votre façon de travailler : vous choisissez les fonctionnalités utiles, et le site les réunit dans une expérience simple, rapide et à votre image.',
    },
    sectors: {
      eyebrow: 'Pour qui',
      title: 'Pour les pros de Grenoble et de l’Isère.',
      text: 'Restaurants du centre-ville, studios de tatouage, instituts de beauté, artisans et PME du bassin grenoblois : chaque métier a ses contraintes, et votre site s’y adapte.',
    },
    why: {
      eyebrow: 'Prestataire local',
      title: 'Pourquoi choisir un prestataire à Grenoble ?',
      text: 'Travailler avec un interlocuteur proche simplifie tout le projet, du premier échange au suivi après la mise en ligne.',
      items: [
        { icon: 'users', title: 'Un interlocuteur unique', text: 'Vous échangez directement avec la personne qui conçoit et développe votre site, sans intermédiaire.' },
        { icon: 'map-pin', title: 'Des rendez-vous sur place', text: 'À Grenoble et dans ses environs, nous pouvons nous retrouver pour lancer le projet ou pour la prise en main de votre espace d’administration.' },
        { icon: 'store', title: 'La connaissance du terrain', text: 'Clientèle étudiante, visiteurs en route vers les massifs, habitués du quartier : votre site s’adresse à ceux qui vous cherchent dans la région grenobloise.' },
        { icon: 'refresh-cw', title: 'Un suivi dans la durée', text: 'Une question, une évolution, une nouvelle fonctionnalité : vous savez à qui vous adresser, après la mise en ligne aussi.' },
      ],
    },
    process: {
      eyebrow: 'Déroulé',
      title: 'Comment se déroule votre projet ?',
      steps: [
        { title: 'Premier échange', text: 'À Grenoble ou en visio, nous faisons le point sur votre activité, vos clients et les fonctionnalités dont vous avez besoin.' },
        { title: 'Proposition et devis', text: 'Vous recevez une proposition claire : le périmètre du site, les modules retenus et un devis détaillé.' },
        { title: 'Conception et développement', text: 'La maquette est validée avec vous, puis le site est développé et testé sur ordinateur et sur mobile.' },
        { title: 'Mise en ligne et formation', text: 'Le site est mis en ligne sur votre nom de domaine, et vous êtes formé à votre espace d’administration.' },
      ],
    },
    areas: {
      title: 'Où intervenons-nous ?',
      text:
        'Subnet accompagne les entreprises de Grenoble et de toute l’agglomération (Échirolles, Saint-Martin-d’Hères, Meylan, Fontaine, Seyssinet-Pariset…), et plus largement de l’Isère, de Voiron au Grésivaudan. Pour le reste de l’Auvergne-Rhône-Alpes et partout en France, les échanges se font en visio. Où que soit votre clientèle, en centre-ville, sur le campus ou dans les vallées autour de Grenoble, votre site est pensé pour être trouvé par ceux qui vous cherchent près de chez eux.',
    },
    faq: {
      title: 'Questions fréquentes à Grenoble',
      items: [
        { question: 'Peut-on se rencontrer à Grenoble ?', answer: 'Oui. Pour les entreprises de Grenoble et de ses environs, le premier échange et la prise en main du site peuvent se faire en personne. Le reste du projet avance aussi bien en visio.' },
        { question: 'Combien coûte un site internet à Grenoble ?', answer: 'Le prix dépend des fonctionnalités choisies : un site de présentation avec demandes de devis ne demande pas le même travail qu’un site avec réservation et acompte en ligne. Après un premier échange, vous recevez un devis clair et détaillé.' },
        { question: 'Quel est le délai pour créer un site ?', answer: 'Il dépend du périmètre du projet et de la disponibilité de vos contenus : textes, photos, logo. Le calendrier est indiqué dans le devis, étape par étape.' },
        { question: 'Travaillez-vous uniquement avec des entreprises grenobloises ?', answer: 'Non. Subnet est basé à Grenoble et accompagne des entreprises dans toute la France : hors de la région grenobloise, les échanges se font en visio.' },
        { question: 'Mon site sera-t-il visible dans les recherches locales ?', answer: 'Votre site met en avant votre ville et votre zone d’intervention, et transmet à Google vos informations : adresse, zone desservie, coordonnées. Associé à une fiche Google Business Profile à jour, il vous aide à apparaître quand on cherche votre métier à Grenoble.' },
        { question: 'Mon site sera-t-il bien référencé sur Google ?', answer: 'Chaque site est rapide, adapté au mobile et structuré pour les moteurs de recherche : titres, descriptions, informations pour Google et plan du site sont en place dès la mise en ligne, et modifiables depuis votre espace.' },
      ],
    },
    homeLink: {
      text: 'Vous êtes à Grenoble ou en Isère ?',
      label: 'Création de site internet à Grenoble',
    },
  },

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
