#!/bin/sh
# Met en ligne la dernière version du code : récupère les nouveautés de la
# branche suivie (main), met à jour les images de base (correctifs de
# sécurité de Node.js et de Caddy), reconstruit et redémarre ce qui a changé.
# Usage : ./scripts/deploy.sh
set -eu
cd "$(dirname "$0")/.."

git pull --ff-only
docker compose pull --quiet caddy
docker compose build --pull site
docker compose up -d --remove-orphans
docker image prune -f > /dev/null
docker compose ps
