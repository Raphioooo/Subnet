#!/bin/sh
# Met en ligne la dernière version du code : récupère les nouveautés de la
# branche suivie (main), met à jour les images de base (correctifs de
# sécurité de Node.js et de Caddy), reconstruit et redémarre ce qui a changé.
# Usage : ./scripts/deploy.sh
set -eu
cd "$(dirname "$0")/.."

before="$(git rev-parse HEAD)"
git pull --ff-only
# Si ce script vient d'être mis à jour, c'est sa nouvelle version qui continue.
if [ -z "${SUBNET_DEPLOY_RELANCE:-}" ] && ! git diff --quiet "$before" HEAD -- scripts/deploy.sh; then
  SUBNET_DEPLOY_RELANCE=1 exec ./scripts/deploy.sh
fi

docker compose pull --quiet caddy
docker compose build --pull site
docker compose up -d --remove-orphans

# Caddy lit sa configuration au démarrage. Quand le Caddyfile a changé, git l'a
# remplacé par un nouveau fichier que le conteneur ne voit pas : on le recrée.
if ! docker compose exec -T caddy cat /etc/caddy/Caddyfile 2>/dev/null | cmp -s - Caddyfile; then
  docker compose up -d --force-recreate --no-deps caddy
fi

docker image prune -f > /dev/null
docker compose ps
