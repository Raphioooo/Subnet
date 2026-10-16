#!/bin/sh
# Met en ligne la dernière version du code : récupère les nouveautés de la
# branche suivie (main), reconstruit l'image et redémarre ce qui a changé.
# Usage : ./scripts/deploy.sh
set -eu
cd "$(dirname "$0")/.."

git pull --ff-only
docker compose up -d --build --remove-orphans
docker image prune -f > /dev/null
docker compose ps
