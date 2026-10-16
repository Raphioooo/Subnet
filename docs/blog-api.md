# API de brouillons du blog

L'agent de rédaction envoie ses articles **en brouillon** par cette API. Aucun endpoint ne peut publier : la publication se fait dans l'admin (`/admin/articles`), après relecture et une fois tous les marqueurs `[À COMPLÉTER : …]` remplis.

## Configuration

1. Générez une clé : `openssl rand -base64 32`
2. Ajoutez-la au fichier `.env` du serveur : `BLOG_API_KEY=la-cle-generee`
3. Redémarrez le site (`./scripts/deploy.sh` avec Docker).

Sans `BLOG_API_KEY`, l'API répond `503` (désactivée). Gardez la clé dans un gestionnaire de mots de passe et transmettez-la à la tâche programmée comme un secret.

## Règles communes

- URL : `https://subnet-online.com/api/admin/posts`
- Authentification : en-tête `Authorization: Bearer <BLOG_API_KEY>` (comparaison à temps constant).
- Limite : 20 requêtes par heure. Au-delà : `429` avec `Retry-After`.
- Corps JSON de 200 Ko maximum (`413` sinon).
- Chaque appel est journalisé dans `data/blog-api.log` (date, IP, méthode, route, statut ; jamais la clé).
- Erreurs : `{ "ok": false, "errors": [{ "field": "metaDescription", "message": "…" }] }`.

## Champs d'un article

| Champ | Règle |
| --- | --- |
| `title` | obligatoire, 90 caractères max (H1) |
| `slug` | facultatif, généré depuis le titre ; kebab-case sans accents, 70 max ; suffixe `-2`, `-3`… en cas de collision |
| `metaTitle` | 60 max ; vide = `title` + « \| Subnet » (qui doit alors tenir en 60) |
| `metaDescription` | obligatoire, entre 120 et 158 caractères |
| `excerpt` | obligatoire, 300 max |
| `content` | obligatoire, Markdown uniquement (`##`, `###`, listes, `**gras**`, `*italique*`, `[liens](https://…)`, tableaux `\| a \| b \|`) ; HTML et liens `javascript:` refusés |
| `coverImage`, `coverAlt` | facultatifs ; `coverAlt` obligatoire si `coverImage` est renseigné |
| `category` | `restaurants`, `tatoueurs`, `instituts`, `tpe-pme`, `guides` ou `grenoble` |
| `tags` | liste de 6 chaînes max |
| `faq` | liste de 0 à 6 `{ "question", "answer" }` |
| `targetKeyword` | requête visée (interne) |
| `topicId` | identifiant du sujet du calendrier (`docs/blog/topics.json`) ; un seul article par sujet |

Tout autre champ est refusé (`422`). `status` est ignoré : il est toujours forcé à `draft`.

## POST /api/admin/posts : créer un brouillon

```bash
curl -sS https://subnet-online.com/api/admin/posts \
  -H "Authorization: Bearer $BLOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "topicId": "T07",
    "title": "Portfolio de tatoueur : comment présenter vos réalisations par style",
    "metaTitle": "Portfolio tatoueur : présenter ses réalisations | Subnet",
    "metaDescription": "Comment organiser un portfolio de tatoueur efficace : tri par style, photos, textes, demande de projet. Conseils concrets pour attirer les bons clients.",
    "excerpt": "Tri par style, photos, textes et formulaire de projet : la méthode pour un portfolio qui attire les bons clients.",
    "category": "tatoueurs",
    "tags": ["portfolio", "tatouage", "site internet"],
    "targetKeyword": "portfolio tatoueur",
    "content": "Introduction…\n\n## Pourquoi classer vos réalisations par style ?\n\n…\n\n[À COMPLÉTER : exemple réel d’un tatoueur accompagné]",
    "faq": [{ "question": "Combien de photos mettre ?", "answer": "…" }],
    "coverAlt": null
  }'
```

Réponse `201` :

```json
{
  "id": "6f1c…",
  "slug": "portfolio-de-tatoueur-comment-presenter-vos-realisations-par-style",
  "previewUrl": "https://subnet-online.com/blog/portfolio-de-tatoueur-…?preview",
  "adminUrl": "https://subnet-online.com/admin/articles/6f1c…",
  "markers": 1
}
```

Un e-mail est envoyé à l'adresse de notification (`MAIL_TO`, sinon l'email de contact saisi dans l'admin) avec le titre, le nombre de marqueurs et le lien d'édition, si les variables `SMTP_*` sont configurées.

## GET /api/admin/posts : liste légère

```bash
curl -sS "https://subnet-online.com/api/admin/posts?fields=slug,title,targetKeyword,topicId,status" \
  -H "Authorization: Bearer $BLOG_API_KEY"
```

Renvoie `{ "ok": true, "posts": [{ "id", "slug", "title", "targetKeyword", "topicId", "status" }] }`. Champs disponibles : `id`, `slug`, `title`, `targetKeyword`, `topicId`, `status`, `category`, `source`, `createdAt`, `updatedAt`, `publishedAt`, `scheduledAt`.

## PATCH /api/admin/posts/:id : modifier un brouillon

```bash
curl -sS -X PATCH https://subnet-online.com/api/admin/posts/6f1c… \
  -H "Authorization: Bearer $BLOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "metaDescription": "Nouvelle description de 120 à 158 caractères…" }'
```

Seuls les champs envoyés changent ; l'article complet doit toujours respecter les règles. Refusé avec `409` si l'article n'est plus un brouillon (programmé ou publié).
