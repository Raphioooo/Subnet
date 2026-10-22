// Mises à jour des textes par défaut, appliquées une seule fois aux contenus déjà
// enregistrés (voir migrate() dans store.js). Un texte n'est remplacé que s'il est
// encore identique à l'ancien texte par défaut : ce que le propriétaire a réécrit
// depuis l'administration n'est jamais touché. Une question n'est ajoutée à une
// FAQ que si elle n'y figure pas déjà.
//
// Chemins : « a.b » pour une clé, « a[] » pour chaque élément d'une liste,
// « sectors[slug=x] » pour l'élément de la liste dont le slug vaut x.

// Version 5 : textes retravaillés pour le référencement (intertitres avec les mots
// recherchés, pages Secteurs, Réalisations et FAQ enrichies).
export const CONTENT_UPDATES = {
  5: {
    "changes": [
      {
        "path": "contact.page.intro",
        "from": "Dites-nous qui vous êtes et ce dont vous avez besoin : réservation, acompte, devis, horaires… Nous revenons vers vous avec une proposition et un devis clair.",
        "to": "Dites-nous qui vous êtes et ce dont votre site internet a besoin : réservation en ligne, acompte, devis, horaires… Nous revenons vers vous avec une proposition et un devis clair."
      },
      {
        "path": "home.hero.subtitle",
        "from": "Réservation en ligne, acompte, devis, horaires et panneau d’administration : un site complet et élégant pour les restaurateurs, tatoueurs, instituts, TPE et PME.",
        "to": "Réservation en ligne, acompte, devis, horaires et panneau d’administration : un site internet complet et élégant pour les restaurants, studios de tatouage, instituts de beauté, TPE et PME."
      },
      {
        "path": "home.pillars.title",
        "from": "Plus qu’une vitrine. Votre outil de travail.",
        "to": "Plus qu’un site vitrine. Votre outil de travail."
      },
      {
        "path": "home.pillars.text",
        "from": "Votre site ne se contente pas de présenter votre activité : il prend les réservations, sécurise vos rendez-vous, envoie vos devis et vous fait gagner du temps chaque jour.",
        "to": "Un site vitrine présente votre activité. Le vôtre va plus loin : il prend les réservations en ligne, sécurise vos rendez-vous avec un acompte, envoie vos devis et vous fait gagner du temps chaque jour."
      },
      {
        "path": "home.journey.title",
        "from": "Réserver devient un réflexe.",
        "to": "La réservation en ligne devient un réflexe."
      },
      {
        "path": "home.sectors.title",
        "from": "Un site pensé pour votre métier.",
        "to": "Un site internet pensé pour votre métier."
      },
      {
        "path": "home.offer.title",
        "from": "Tout ce qu’il faut. Rien de superflu.",
        "to": "Un site sur mesure. Rien de superflu."
      },
      {
        "path": "home.offer.text",
        "from": "Un site sur mesure qui réunit présentation, réservation, paiement et gestion, conçu autour de votre activité.",
        "to": "Présentation, réservation en ligne, paiement d’acompte et gestion : votre site réunit ce dont votre activité a besoin, et rien d’autre."
      },
      {
        "path": "home.why.title",
        "from": "Le meilleur des deux mondes.",
        "to": "Le meilleur des deux mondes, sans commission."
      },
      {
        "path": "home.why.text",
        "from": "Les fonctionnalités d’une plateforme de réservation, l’image d’un site premium à votre nom. Sans compromis.",
        "to": "Les fonctionnalités d’une plateforme de réservation, l’image d’un site premium à votre nom, et aucune commission sur vos réservations."
      },
      {
        "path": "home.projects.title",
        "from": "Des univers, pas des modèles.",
        "to": "Des sites sur mesure, pas des modèles."
      },
      {
        "path": "offer.seo.title",
        "from": "Site sur mesure avec réservation, devis et admin | Subnet",
        "to": "Site internet sur mesure avec réservation et devis | Subnet"
      },
      {
        "path": "offer.seo.description",
        "from": "Un site sur mesure avec réservation en ligne, acompte, devis, horaires et panneau d’administration. Conçu à Grenoble, pour toute la France.",
        "to": "Un site internet sur mesure avec réservation en ligne, acompte, devis, horaires et panneau d’administration. Conçu à Grenoble, partout en France."
      },
      {
        "path": "offer.structure.title",
        "from": "Des modules qui travaillent pour vous.",
        "to": "Réservation, acompte, devis : des modules qui travaillent pour vous."
      },
      {
        "path": "offer.admin.title",
        "from": "Votre activité, sous contrôle.",
        "to": "Un panneau d’administration pour piloter votre activité."
      },
      {
        "path": "offer.comparison.title",
        "from": "Le juste équilibre.",
        "to": "Site sur mesure, plateforme ou outils à assembler ?"
      },
      {
        "path": "offer.design.title",
        "from": "Une esthétique maîtrisée.",
        "to": "Un design soigné, sur mobile comme sur ordinateur."
      },
      {
        "path": "offer.benefits.title",
        "from": "Ce que vous y gagnez.",
        "to": "Ce qu’un site sur mesure vous fait gagner."
      },
      {
        "path": "sectorsPage.hero.subtitle",
        "from": "Réservation de table, demande de projet, rendez-vous ou devis : les fonctionnalités et le ton s’adaptent à votre activité.",
        "to": "Restaurant, studio de tatouage, institut de beauté ou PME : réservation de table, demande de projet, prise de rendez-vous ou devis en ligne, les fonctionnalités et le ton de votre site s’adaptent à votre métier."
      },
      {
        "path": "sectorsPage.note.text",
        "from": "L’offre s’adresse aussi aux commerces et aux activités de service : réservation, acompte, devis et gestion des horaires s’adaptent à votre fonctionnement.",
        "to": "L’offre s’adresse aussi aux artisans, aux commerces et aux activités de service, d’un salon de coiffure à une boutique : réservation en ligne, acompte, devis et gestion des horaires s’adaptent à votre fonctionnement."
      },
      {
        "path": "sectors[slug=restaurateurs].highlightsTitle",
        "from": "Ce que votre site gère pour vous",
        "to": "Ce que votre site de restaurant gère pour vous"
      },
      {
        "path": "sectors[slug=restaurateurs].admin.title",
        "from": "Ce que vous gérez depuis votre panneau admin",
        "to": "Gérez vos réservations, votre carte et vos horaires en ligne"
      },
      {
        "path": "sectors[slug=restaurateurs].process.title",
        "from": "Comment se déroule la création de votre site",
        "to": "Comment se déroule la création du site de votre restaurant ?"
      },
      {
        "path": "sectors[slug=tatoueurs].highlightsTitle",
        "from": "Ce que votre site gère pour vous",
        "to": "Ce que votre site de tatoueur gère pour vous"
      },
      {
        "path": "sectors[slug=tatoueurs].admin.title",
        "from": "Ce que vous gérez depuis votre panneau admin",
        "to": "Gérez vos demandes de projet, vos devis et vos séances en ligne"
      },
      {
        "path": "sectors[slug=tatoueurs].process.title",
        "from": "Comment se déroule la création de votre site",
        "to": "Comment se déroule la création du site de votre studio ?"
      },
      {
        "path": "sectors[slug=instituts].highlightsTitle",
        "from": "Ce que votre site gère pour vous",
        "to": "Ce que le site de votre institut gère pour vous"
      },
      {
        "path": "sectors[slug=instituts].admin.title",
        "from": "Ce que vous gérez depuis votre panneau admin",
        "to": "Gérez vos rendez-vous, vos soins et votre agenda en ligne"
      },
      {
        "path": "sectors[slug=instituts].process.title",
        "from": "Comment se déroule la création de votre site",
        "to": "Comment se déroule la création du site de votre institut ?"
      },
      {
        "path": "sectors[slug=tpe-pme].highlightsTitle",
        "from": "Ce que votre site gère pour vous",
        "to": "Ce que le site de votre entreprise gère pour vous"
      },
      {
        "path": "sectors[slug=tpe-pme].admin.title",
        "from": "Ce que vous gérez depuis votre panneau admin",
        "to": "Gérez vos demandes de devis et vos commandes en ligne"
      },
      {
        "path": "sectors[slug=tpe-pme].process.title",
        "from": "Comment se déroule la création de votre site",
        "to": "Comment se déroule la création du site de votre entreprise ?"
      },
      {
        "path": "local.intro.title",
        "from": "Un site qui travaille pour votre activité.",
        "to": "Un site internet sur mesure qui travaille pour vous."
      },
      {
        "path": "local.why.text",
        "from": "Travailler avec un interlocuteur proche simplifie tout le projet, du premier échange au suivi après la mise en ligne.",
        "to": "Plus souple qu’une agence web, plus complet qu’un site fait soi-même : travailler avec un développeur web à Grenoble simplifie tout le projet, du premier échange au suivi après la mise en ligne."
      },
      {
        "path": "local.areas.text",
        "from": "Subnet accompagne les entreprises de Grenoble et de toute l’agglomération (Échirolles, Saint-Martin-d’Hères, Meylan, Fontaine, Seyssinet-Pariset…), et plus largement de l’Isère, de Voiron au Grésivaudan. Pour le reste de l’Auvergne-Rhône-Alpes et partout en France, les échanges se font en visio. Où que soit votre clientèle, en centre-ville, sur le campus ou dans les vallées autour de Grenoble, votre site est pensé pour être trouvé par ceux qui vous cherchent près de chez eux.",
        "to": "Subnet accompagne les entreprises de Grenoble et de toute l’agglomération (Échirolles, Saint-Martin-d’Hères, Meylan, Fontaine, Seyssinet-Pariset, Saint-Égrève, Sassenage, Eybens…), et plus largement de l’Isère, de Voiron au Grésivaudan. Pour le reste de l’Auvergne-Rhône-Alpes et partout en France, les échanges se font en visio. Où que soit votre clientèle, en centre-ville, sur le campus ou dans les vallées autour de Grenoble, votre site est pensé pour être trouvé par ceux qui vous cherchent près de chez eux."
      },
      {
        "path": "projectsPage.hero.subtitle",
        "from": "Chaque site part de la même exigence de clarté, puis s’adapte à l’univers et au fonctionnement de son activité.",
        "to": "Restaurant, studio de tatouage, institut de beauté, menuiserie : ces concepts de sites montrent comment la réservation en ligne, l’acompte et les devis s’adaptent à chaque métier."
      },
      {
        "path": "projects[].description",
        "from": "Réservation de table en ligne, acompte pour les groupes, carte et horaires gérés depuis le panneau d’administration.",
        "to": "Concept de site pour un restaurant : réservation de table en ligne selon les services et les couverts, acompte pour les groupes, carte et horaires gérés depuis le panneau d’administration, sans commission."
      },
      {
        "path": "projects[].description",
        "from": "Portfolio classé par style, demande de projet, devis accepté en ligne et acompte à la réservation de la séance.",
        "to": "Concept de site pour un studio de tatouage : portfolio classé par style, demande de projet avec références, devis accepté en ligne et acompte réglé à la réservation de la séance."
      },
      {
        "path": "projects[].description",
        "from": "Prise de rendez-vous par soin, acompte sécurisé, rappels automatiques et planning dans l’espace d’administration.",
        "to": "Concept de site pour un institut de beauté : prise de rendez-vous en ligne par soin, acompte sécurisé, rappels automatiques et planning dans l’espace d’administration."
      },
      {
        "path": "projects[].description",
        "from": "Demandes de devis détaillées, devis acceptés en ligne avec acompte à la commande, réalisations et savoir-faire.",
        "to": "Concept de site pour un artisan menuisier : réalisations et savoir-faire, demandes de devis détaillées, devis accepté en ligne et acompte à la commande."
      },
      {
        "path": "faqPage.seo.title",
        "from": "FAQ création de site internet sur mesure | Subnet",
        "to": "FAQ création de site internet : prix et délais | Subnet"
      },
      {
        "path": "faqPage.seo.description",
        "from": "Réservation en ligne, acompte, devis, panneau d’administration, propriété des données : les réponses à vos questions avant de créer votre site.",
        "to": "Prix, délais, référencement, réservation en ligne, acompte et devis : les réponses à vos questions avant de créer votre site internet."
      },
      {
        "path": "faq[].question",
        "from": "Combien coûte un site ?",
        "to": "Combien coûte un site internet ?"
      },
      {
        "path": "faq[].answer",
        "from": "Chaque projet dépend des fonctionnalités choisies. Présentez-nous votre activité et vos besoins : nous vous adressons un devis clair et détaillé.",
        "to": "Le prix dépend des fonctionnalités choisies et du nombre de pages : un site vitrine avec formulaire de devis ne demande pas le même travail qu’un site avec réservation et acompte en ligne. Présentez-nous votre activité et vos besoins : nous vous adressons un devis clair et détaillé."
      },
      {
        "path": "cta.title",
        "from": "Parlons de votre projet.",
        "to": "Parlons de votre projet de site."
      }
    ],
    "additions": [
      {
        "path": "sectors[slug=restaurateurs].faq.items",
        "key": "question",
        "item": {
          "question": "Combien coûte un site internet pour un restaurant ?",
          "answer": "Le prix dépend des fonctionnalités retenues : réservation de table, acompte pour les groupes, carte en ligne, demandes de privatisation. Après un premier échange, vous recevez un devis clair et détaillé. Une fois le site en ligne, les réservations prises dessus ne vous coûtent aucune commission."
        }
      },
      {
        "path": "sectors[slug=tatoueurs].faq.items",
        "key": "question",
        "item": {
          "question": "Comment présenter mon portfolio de tatouage ?",
          "answer": "Vos réalisations sont classées par style, par exemple fine line, réalisme ou ornemental, avec de grandes photos mises en valeur sur ordinateur comme sur mobile. Vous ajoutez vos nouveaux tatouages depuis votre espace, sans passer par un développeur."
        }
      },
      {
        "path": "sectors[slug=instituts].faq.items",
        "key": "question",
        "item": {
          "question": "Mon site peut-il remplacer Planity ou Treatwell ?",
          "answer": "Oui, ou les compléter. Vos clientes réservent directement sur votre site, sans commission sur les rendez-vous, et vous gardez leurs coordonnées. Rien ne vous oblige à quitter une plateforme du jour au lendemain : votre site offre à vos habituées un moyen direct de réserver chez vous."
        }
      },
      {
        "path": "sectors[slug=tpe-pme].faq.items",
        "key": "question",
        "item": {
          "question": "Un site avec devis en ligne convient-il aux artisans ?",
          "answer": "Oui. Menuisiers, électriciens, plombiers, paysagistes ou peintres reçoivent des demandes complètes, avec photos et dimensions, préparent leur devis depuis leur espace et le font accepter en ligne, avec un acompte à la commande si besoin."
        }
      },
      {
        "path": "local.faq.items",
        "key": "question",
        "item": {
          "question": "Créez-vous aussi des sites vitrines ?",
          "answer": "Oui. Un site vitrine présente votre activité, vos services, vos photos et vos coordonnées, avec un formulaire de contact ou de demande de devis. La réservation en ligne, l’acompte ou les devis peuvent s’y ajouter plus tard, quand votre activité en a besoin."
        }
      },
      {
        "path": "local.faq.items",
        "key": "question",
        "item": {
          "question": "Quelle différence avec une agence web ?",
          "answer": "Vous échangez directement avec la personne qui conçoit et développe votre site, du premier rendez-vous au suivi après la mise en ligne. Pas d’intermédiaire entre vos demandes et le développement : tout se passe à Grenoble, ou en visio si vous êtes plus loin."
        }
      },
      {
        "path": "faq",
        "key": "question",
        "item": {
          "question": "Combien de temps faut-il pour créer un site internet ?",
          "answer": "Le délai dépend du nombre de pages, des fonctionnalités retenues (réservation, acompte, devis) et de la disponibilité de vos contenus : textes, photos, logo. Le calendrier est précisé dans le devis, étape par étape, de la maquette à la mise en ligne."
        }
      },
      {
        "path": "faq",
        "key": "question",
        "item": {
          "question": "Quelle différence entre un site vitrine et un site avec réservation ?",
          "answer": "Un site vitrine présente votre activité : services, photos, horaires et coordonnées. Un site avec réservation va plus loin : vos clients réservent un créneau, règlent un acompte ou acceptent un devis en ligne, et tout arrive dans votre panneau d’administration. Vous pouvez commencer par une vitrine et ajouter ces fonctionnalités ensuite."
        }
      },
      {
        "path": "faq",
        "key": "question",
        "item": {
          "question": "Le référencement sur Google est-il inclus ?",
          "answer": "Oui, les bases du référencement naturel sont en place dès la mise en ligne : site rapide et adapté au mobile, titre et description pour chaque page, données structurées pour Google et plan du site. Les titres et descriptions se modifient depuis votre espace. Votre position dépend ensuite de votre activité, de la concurrence et de vos avis clients : un site bien construit vous donne de bonnes bases."
        }
      },
      {
        "path": "faq",
        "key": "question",
        "item": {
          "question": "Faut-il un logiciel de réservation en plus du site ?",
          "answer": "Non. La réservation en ligne, l’acompte et les devis sont intégrés à votre site et se gèrent depuis le même panneau d’administration : vous n’avez pas d’outil supplémentaire à assembler."
        }
      },
      {
        "path": "faq",
        "key": "question",
        "item": {
          "question": "Serai-je propriétaire de mon site ?",
          "answer": "Le site est mis en ligne sur votre propre nom de domaine, et les données de vos clients vous appartiennent. Les droits d’exploitation sur les éléments créés pour vous vous sont transférés une fois le projet entièrement réglé, comme le prévoient les conditions générales."
        }
      }
    ]
  },
};
