# Subnet — site de présentation

Site de **Subnet**, qui présente une offre de création de **sites sur mesure « full stack »** pour les restaurateurs, tatoueurs, instituts de beauté, TPE et PME : réservation en ligne, paiement d'acompte, devis, gestion des horaires et panneau d'administration, dans un design premium et minimaliste.

Le site de Subnet est un site de présentation de cette offre. Il dispose lui-même :

- d'un design épuré inspiré des codes Apple (hiérarchie visuelle forte, typographie soignée, espaces respirants) ;
- de formulaires de **demande de devis** et de **contact** (page contact et accueil), dont les envois arrivent dans la rubrique « Demandes » de l'admin ;
- d'un **espace d'administration** pour modifier tous les contenus, les horaires et consulter les demandes, sans développeur.

Les fonctionnalités de réservation, d'acompte et de devis vendues aux clients sont illustrées par des maquettes « Concept » (sites, parcours mobile et panneau d'administration de marques fictives).

## Contenu du site

| Page | Adresse | Contenu |
| --- | --- | --- |
| Accueil | `/` | Accroche, vitrine animée par secteur, positionnement, parcours client (créneau, acompte, confirmation), secteurs, fonctionnalités, panneau d'administration, « pourquoi nous », réalisations |
| L'offre | `/offre` | Fonctionnalités incluses, modules illustrés par des captures (réservation, acompte, devis, horaires, administration), comparatif avec les plateformes de réservation, design, bénéfices |
| Secteurs | `/secteurs` et `/secteurs/restaurateurs`, `/tatoueurs`, `/instituts`, `/tpe-pme` | Une page par métier : ce que le site gère, fonctionnalités mises en avant, parcours client en trois écrans mobiles, ton |
| Réalisations | `/realisations` | Galerie filtrable par secteur (version ordinateur et capture mobile), avec visionneuse |
| Blog | `/blog`, `/blog/categorie/…`, `/blog/<article>`, `/blog/rss.xml` | Articles de conseils : sommaire, FAQ, articles liés, données structurées. Les brouillons sont rédigés par un agent via l'API ([docs/blog-api.md](docs/blog-api.md)) et publiés depuis l'admin |
| FAQ | `/faq` | Questions fréquentes |
| Contact | `/contact` | Formulaire « demande de devis » ou « simple question » (fonctionnalités souhaitées, protection anti-spam), coordonnées, horaires, réseaux. Un formulaire rapide figure aussi en bas de l'accueil |
| Pages légales | `/mentions-legales`, `/confidentialite`, `/cookies`, `/conditions-generales` | Modèles remplis automatiquement avec vos informations |

Le site s'adapte aux ordinateurs, tablettes et mobiles. Il est pensé pour l'accessibilité (navigation au clavier, contrastes, textes alternatifs) et passe sans erreur les contrôles automatiques WCAG 2 AA. Il inclut le référencement : titre, description et H1 modifiables pour chaque page, plan du site (`/sitemap.xml`) daté page par page, `robots.txt`, données structurées (entreprise, services, questions fréquentes, fil d'Ariane) et image de partage.

## Démarrage rapide

Il faut **Node.js 20.12 ou plus récent** (la version 22 LTS est conseillée).

```bash
npm install
cp .env.example .env      # puis renseignez ADMIN_PASSWORD
npm start
```

- Site : <http://localhost:3000>
- Administration : <http://localhost:3000/admin>

Autres commandes :

```bash
npm run dev           # rechargement automatique pendant le développement
npm test              # tests automatisés
npm run set-password  # définir ou réinitialiser le mot de passe de l'admin
```

Aucune base de données n'est nécessaire : les contenus, messages et images sont enregistrés dans le dossier `data/` (configurable avec `DATA_DIR`). Au premier démarrage, ce dossier est créé avec les contenus par défaut.

## L'espace d'administration

Rendez-vous sur `/admin`. Le mot de passe est celui de `ADMIN_PASSWORD`. Si la variable est vide, un mot de passe temporaire s'affiche dans la console au premier démarrage : changez-le ensuite dans **Compte et sauvegarde**.

| Rubrique | Ce que vous modifiez |
| --- | --- |
| Général | Nom du site, nom complet pour les partages, logo, description, image de partage, bandeau d'information (fermeture exceptionnelle, nouveauté…), bloc « Parlons de votre projet » |
| Accueil | Tous les textes, boutons et icônes de la page d'accueil, dont les étapes du parcours client |
| L'offre | Fonctionnalités incluses, modules et leurs illustrations (format téléphone ou ordinateur), contenus gérables, comparatif, principes de design, bénéfices |
| Secteurs | Textes, listes, fonctionnalités mises en avant, parcours client (étapes et captures), visuels et leur description, « site ou plateforme », gestion, déroulé, questions fréquentes et paragraphe local de chaque métier, ordre des quatre pages |
| Page Grenoble | Textes de la page « Création de site internet à Grenoble », questions fréquentes locales et lien depuis l'accueil et le pied de page |
| Réalisations | Projets de la galerie : ajout, image principale et capture mobile, secteur, lien, ordre, affichage ou masquage |
| FAQ | Questions et réponses |
| Coordonnées | Email, téléphone, adresse, zone d'intervention, informations pour Google (ville, code postal, région, zones desservies, fondateur), horaires, réseaux sociaux, textes de la page contact et fonctionnalités proposées dans le formulaire de devis |
| Pages légales | Informations légales et contenu des quatre pages réglementaires |
| Articles | Articles du blog : brouillons de l'agent (badge « API »), éditeur Markdown avec aperçu, compteurs SEO, aperçu Google, FAQ, programmation. Publication bloquée tant qu'il reste des marqueurs [À COMPLÉTER] |
| Demandes | Demandes de devis et questions envoyées depuis la page contact et l'accueil : statut (nouvelle, en cours, traitée), note interne, recherche, filtres et export CSV |
| Prospection | Entreprises de la région sans site à contacter sur WhatsApp : recherche par ville, rayon et activités, analyse, score de réponse estimé, message et relance prêts à envoyer, suivi des statuts, export CSV |
| Compte et sauvegarde | Mot de passe, sauvegarde et restauration des contenus |

Chaque page a aussi sa rubrique **Référencement** : titre et description affichés par Google, et titre principal (H1), avec un compteur de caractères.

Bon à savoir :

- **Les modifications sont en ligne dès l'enregistrement.** Le raccourci `Ctrl` + `S` (ou `⌘` + `S`) enregistre la page.
- **Les images sont optimisées automatiquement** : redimensionnées (2400 px maximum) et converties en WebP dans le navigateur avant l'envoi.
- **Le tableau de bord indique ce qui reste à compléter** avant la mise en ligne : email, informations légales, adresse du site, etc.
- **Les pages légales se remplissent seules.** Dans leur texte, les balises entre doubles accolades sont remplacées par les informations saisies dans la section « Informations légales » : `{{entreprise}}`, `{{forme_juridique}}`, `{{siret}}`, `{{rcs}}`, `{{tva}}`, `{{capital}}`, `{{adresse}}`, `{{directeur_publication}}`, `{{hebergeur}}`, `{{hebergeur_adresse}}`, `{{hebergeur_contact}}`, `{{email}}`, `{{telephone}}`, `{{nom_site}}` et `{{url}}`. Une information obligatoire manquante apparaît surlignée « à compléter ». Une information facultative manquante (capital, TVA, immatriculation, téléphone…) fait disparaître sa ligne.
- **Demandes** : chaque envoi des formulaires (page contact et accueil) est enregistré dans la rubrique « Demandes » de l'admin, avec un compteur des demandes non lues. Vous y suivez chaque demande (nouvelle, en cours, traitée), ajoutez une note interne, filtrez, recherchez et exportez la liste en CSV. Pour recevoir aussi un email à chaque demande, configurez les variables `SMTP_*`. Les demandes sont supprimées automatiquement au bout de trois ans, comme l'indique la politique de confidentialité.

- **Prospection** : la rubrique part d'une liste de 50 entreprises de Grenoble et de Lyon recherchées en ligne une par une (ouvertes, sans site, téléphone confirmé ; les quelques fiches sans aucune trace en ligne sont signalées « non retrouvée en ligne » et à confirmer avant envoi), puis **Nouvelle recherche** en ajoute d'autres : les commerces viennent d'OpenStreetMap (sans clé ni compte), filtrés sur l'absence de site et le numéro mobile, dédoublonnés, notés (score de réponse estimé, avec ses raisons) et accompagnés d'un message WhatsApp et d'une relance. Le bouton **Ouvrir dans WhatsApp** ouvre la conversation avec le message prérempli et passe la fiche en « Message envoyé ». Deux options facultatives et payantes à l'usage : `GOOGLE_PLACES_API_KEY` ajoute la note, le nombre d'avis et des extraits d'avis Google ; `ANTHROPIC_API_KEY` fait rédiger par Claude un message propre à chaque entreprise (sinon, des messages modèles adaptés à l'activité). Prospection entre professionnels : envoyez les messages un par un, et respectez les refus (statut « Ne plus contacter »).

> Les textes des pages légales sont des modèles fournis à titre indicatif. Faites-les relire et adapter à votre situation avant la mise en ligne.

## Configuration

Toutes les variables sont décrites dans `.env.example`.

| Variable | Rôle | Par défaut |
| --- | --- | --- |
| `PORT` | Port d'écoute | `3000` |
| `NODE_ENV` | `production` en ligne (active le cache) | `development` |
| `ADMIN_PASSWORD` | Mot de passe de l'administration | mot de passe temporaire généré |
| `SESSION_SECRET` | Clé de signature des sessions | générée et conservée dans `data/` |
| `DATA_DIR` | Dossier des contenus, messages et images | `./data` |
| `BASE_URL` | Adresse publique du site (plan du site, liens de partage) | adresse saisie dans l'admin, sinon celle de la requête |
| `TRUST_PROXY` | Proxys de confiance (Nginx, hébergeur…) | réseaux locaux et privés |
| `BLOG_API_KEY` | Clé de l'API de brouillons du blog (`openssl rand -base64 32`) | API désactivée |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Serveur d'envoi des notifications | désactivé |
| `MAIL_FROM`, `MAIL_TO` | Expéditeur et destinataire des notifications | `SMTP_USER` et email de contact |
| `GOOGLE_PLACES_API_KEY` | Prospection : notes et avis Google des entreprises trouvées (API Places, facturée par Google) | désactivé |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `PROSPECT_AI` | Prospection : rédaction des messages par Claude (facturée par Anthropic), modèle utilisé, et `PROSPECT_AI=false` pour s'en passer même avec une clé | désactivé, `claude-opus-5-5`, `true` |

## Mise en ligne

Le guide pas à pas [docs/guide-mise-en-ligne.pdf](docs/guide-mise-en-ligne.pdf) détaille toute la mise en ligne : nom de domaine, VPS, sécurisation, DNS, HTTPS, mises à jour automatiques et sauvegardes.

Le site est une application Node.js qui a besoin d'un **dossier de données persistant** : c'est là que vivent vos contenus et vos images. Pensez à le sauvegarder.

### Sur un VPS, en une commande (recommandé)

Sur un serveur Ubuntu Server LTS ou Debian neuf, connecté avec l'utilisateur fourni par l'hébergeur :

```bash
curl -fsSLO https://raw.githubusercontent.com/Raphioooo/Subnet/main/scripts/install.sh
sudo bash install.sh mondomaine.fr
```

Le script met le système à jour, crée l'utilisateur `subnet` (connexion par clé SSH uniquement, root refusé), active le pare-feu et les correctifs automatiques, installe Docker, récupère le site dans `~subnet/site`, le démarre en HTTPS et programme une sauvegarde chaque nuit. Il affiche à la fin le mot de passe temporaire de l'administration et peut être relancé sans risque.

### Avec Docker, manuellement

```bash
cp .env.example .env   # renseignez DOMAIN (ex. mondomaine.fr) et BASE_URL
docker compose up -d --build
```

`docker-compose.yml` lance le site derrière [Caddy](https://caddyserver.com), qui obtient et renouvelle seul le certificat HTTPS de `DOMAIN` (le DNS doit déjà pointer vers le serveur) et redirige `www.` vers le domaine principal. Seuls les ports 80 et 443 sont ouverts ; les données sont conservées dans le volume `subnet-data`.

| Commande | Rôle |
| --- | --- |
| `./scripts/deploy.sh` | Récupère la dernière version (`git pull`), reconstruit et redémarre le site |
| `./scripts/setup-auto-deploy.sh` | Crée la clé de mise en ligne automatique et affiche les quatre secrets à saisir dans GitHub |
| `./scripts/backup.sh` | Archive les données (contenus, demandes, images) dans `backups/` et garde les 14 dernières |
| `./scripts/restore.sh <archive>` | Restaure une archive, après une sauvegarde de sécurité de l'état actuel |
| `./scripts/add-site.sh <domaine> <service:port>` | Héberge un autre site sur le même serveur (voir ci-dessous) |
| `./scripts/remove-site.sh <domaine>` | Retire un site ajouté avec `add-site.sh` |
| `docker compose exec site npm run set-password` | Choisit un nouveau mot de passe d'administration (mot de passe oublié) |
| `docker compose logs -f site` | Affiche le journal du site (dont le mot de passe temporaire au premier démarrage) |

Le workflow GitHub Actions `.github/workflows/deploy.yml` lance les tests à chaque push et pull request. Après un push sur `main`, il met le serveur à jour par SSH si les secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` et `DEPLOY_KNOWN_HOSTS` sont renseignés (`./scripts/setup-auto-deploy.sh` les prépare) ; sinon, cette étape est simplement ignorée.

### Héberger d'autres sites sur le même serveur

Caddy reçoit toutes les visites du serveur et les transmet au bon site selon le domaine, avec le HTTPS automatique. Un autre site (une application personnelle, le site d'un client…) s'ajoute sans toucher à Subnet :

1. **DNS** : faites pointer le domaine vers le serveur (enregistrements A `@` et `www` vers l'adresse IPv4 du VPS, en « DNS uniquement » chez Cloudflare).
2. **Le site** tourne dans son propre dossier sur le serveur (par exemple `~/assistant`), avec son propre `docker-compose.yml`. Son service porte un nom unique, ne publie aucun port et rejoint le réseau `web` créé par Subnet :

   ```yaml
   name: assistant
   services:
     assistant:
       build: .
       restart: unless-stopped
       env_file: .env
       networks: [web]
   networks:
     web:
       external: true
   ```

3. **Caddy** : depuis `~/site`, lancez `./scripts/add-site.sh assistant.fr assistant:3000`, avec le port sur lequel l'application écoute dans son conteneur. Ajoutez `--prive` pour demander un identifiant et un mot de passe à l'entrée : ils s'affichent une seule fois, et `SITE_USER` et `SITE_PASSWORD` permettent de les choisir.

`./scripts/remove-site.sh assistant.fr` retire le site. La configuration de chaque domaine est un fichier de `sites/`, ignoré par git : les mises à jour de Subnet n'y touchent pas. Un sous-domaine (`assistant.mondomaine.fr`) n'a pas de redirection `www`, et `--sans-www` la supprime pour un domaine.

À éviter : relancer `install.sh` avec un autre domaine ou copier le dossier `~/site`, ce qui remplacerait le site Subnet ; publier un port avec `ports:`, car Docker contourne le pare-feu et l'application serait exposée sans HTTPS.

### Sur un serveur sans Docker

```bash
git clone <ce dépôt> subnet && cd subnet
npm ci --omit=dev
cp .env.example .env   # NODE_ENV=production, ADMIN_PASSWORD, DATA_DIR=/var/lib/subnet…
npx pm2 start server.js --name subnet   # ou un service systemd
```

Configurez ensuite Nginx en reverse proxy vers `http://127.0.0.1:3000`, avec `proxy_set_header Host $host;` et `proxy_set_header X-Forwarded-Proto $scheme;`, puis un certificat HTTPS (Let's Encrypt / Certbot).

### Sur une plateforme d'hébergement (Render, Railway, Fly.io…)

- Commande de build : `npm ci --omit=dev`
- Commande de démarrage : `npm start`
- Ajoutez un **disque persistant** et faites pointer `DATA_DIR` vers lui. Sans disque persistant, les modifications seraient perdues à chaque redéploiement.
- Définissez `NODE_ENV=production`, `ADMIN_PASSWORD` et `SESSION_SECRET`.
- Si la plateforme place un proxy devant le site, réglez `TRUST_PROXY` (souvent `1`).

### Sur un hébergement mutualisé compatible Node.js (cPanel, o2switch…)

Créez une application Node.js (« Setup Node.js App ») qui pointe sur ce dossier, avec `server.js` comme fichier de démarrage. Installez les dépendances, renseignez les variables d'environnement, puis redémarrez l'application.

Le site doit tourner en **une seule instance** : les données étant des fichiers, ne le dupliquez pas sur plusieurs serveurs.

## Avant la mise en ligne

- [ ] Mot de passe d'administration solide (`ADMIN_PASSWORD`) et `SESSION_SECRET` défini
- [ ] Email, téléphone, adresse et réseaux sociaux renseignés (Coordonnées)
- [ ] Informations légales complétées et pages légales relues
- [ ] Projets « Concept » remplacés par vos réalisations, ou masqués
- [ ] Adresse du site renseignée (Général) ou `BASE_URL` défini
- [ ] HTTPS actif
- [ ] Notifications par email configurées (facultatif)
- [ ] Sauvegarde régulière du dossier de données

## Personnalisation

- **Couleurs, typographie, espacements** : variables en tête de `public/css/site.css` (`--accent` pour la couleur principale).
- **Gabarits des pages** : dossier `views/` (format EJS).
- **Contenus par défaut** : `src/defaults.js`. Ils ne servent qu'au premier démarrage : ensuite, tout se modifie dans l'admin.
- **Ajouter un champ modifiable** : décrivez-le dans `src/schema.js` (le formulaire d'admin et la validation sont générés automatiquement), ajoutez sa valeur par défaut dans `src/defaults.js`, puis affichez-le dans la vue concernée.

## Structure du projet

```
server.js              démarrage du serveur
src/
  app.js               application Express (sécurité, fichiers statiques, routes)
  config.js            lecture des variables d'environnement
  defaults.js          contenus par défaut
  schema.js            description des champs modifiables dans l'admin
  sanitize.js          validation et nettoyage des données saisies
  store.js             stockage JSON (contenus, messages)
  auth.js              mot de passe, sessions, jetons anti-spam
  markdown.js          mise en forme sûre des textes longs
  mailer.js            notifications par email (facultatives)
  helpers.js           fonctions utilisées par les gabarits
  routes/public.js     pages du site et formulaire de contact
  routes/admin.js      espace d'administration
views/                 gabarits (pages, éléments communs, admin)
public/                CSS, JavaScript, police, images
scripts/               installation, mise à jour, sauvegarde, restauration, mot de passe, autres sites
test/                  tests automatisés
docs/                  guide de mise en ligne (PDF)
docs/logo/             logo Subnet en SVG et PNG (bleu ou blanc, fond transparent)
sites/                 configuration Caddy des autres sites hébergés sur le serveur (hors git)
Dockerfile, docker-compose.yml, Caddyfile   mise en ligne avec Docker et HTTPS
.github/workflows/     tests et mise en ligne automatiques
```

## Sécurité

- Mot de passe haché (scrypt) et sessions signées (cookie `HttpOnly`, `SameSite`), avec limitation des tentatives de connexion.
- Protection contre les requêtes d'autres sites (vérification de l'origine) sur toutes les actions de l'admin.
- Politique de sécurité du contenu (CSP) stricte et en-têtes de sécurité.
- Toutes les saisies sont validées côté serveur. Les textes longs sont échappés avant mise en forme, et seuls les liens sûrs sont acceptés.
- Envois d'images contrôlés par leur contenu réel (JPEG, PNG, WebP, AVIF, GIF uniquement).
- Formulaire de contact protégé par un champ piège, un jeton signé horodaté et une limite d'envois.
- Aucun cookie sur le site public : aucun bandeau de consentement n'est nécessaire.

## Crédits

- Police [Inter](https://rsms.me/inter/), licence SIL Open Font (`public/fonts/LICENSE-Inter.txt`)
- Icônes [Lucide](https://lucide.dev) (licence ISC) et [Simple Icons](https://simpleicons.org) (CC0)
- Photos des maquettes « Concept » : [Unsplash](https://unsplash.com) (licence Unsplash). Les marques, personnes, tarifs et réservations de ces maquettes (Maison Olive, Atelier Noir, Lumen Institut, Arbor Menuiserie) sont fictifs.
