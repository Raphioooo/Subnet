#!/bin/sh
# Restaure une sauvegarde créée par backup.sh. Les données actuelles sont
# d'abord sauvegardées, puis remplacées par celles de l'archive.
# Usage : ./scripts/restore.sh backups/subnet-AAAA-MM-JJ-HHMMSS.tar.gz
set -eu

if [ $# -ne 1 ] || [ ! -f "$1" ]; then
  echo "Usage : $0 backups/subnet-AAAA-MM-JJ-HHMMSS.tar.gz" >&2
  exit 1
fi
archive="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
cd "$(dirname "$0")/.."

echo "Sauvegarde de sécurité des données actuelles…"
./scripts/backup.sh
docker compose stop site
docker compose run --rm -T --no-deps --entrypoint sh site \
  -c 'find /data -mindepth 1 -delete && tar -xzf - -C /data' < "$archive"
docker compose start site
echo "Sauvegarde restaurée : $archive"
