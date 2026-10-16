#!/bin/sh
# Sauvegarde les données du site (contenus, demandes, images envoyées)
# dans le dossier backups/ et conserve les 14 archives les plus récentes.
# Usage : ./scripts/backup.sh
set -eu
cd "$(dirname "$0")/.."

mkdir -p backups
file="backups/subnet-$(date +%Y-%m-%d-%H%M%S).tar.gz"
trap 'rm -f "$file.tmp"' EXIT
docker compose exec -T site tar -czf - -C /data . > "$file.tmp"
mv "$file.tmp" "$file"
ls -1t backups/subnet-*.tar.gz | tail -n +15 | while read -r old; do rm -f -- "$old"; done
echo "Sauvegarde créée : $file ($(du -h "$file" | cut -f1))"
