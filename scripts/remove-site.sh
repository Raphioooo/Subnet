#!/bin/sh
# Retire un site ajouté avec scripts/add-site.sh : Caddy cesse de le servir.
# Usage : ./scripts/remove-site.sh domaine.fr
set -eu
cd "$(dirname "$0")/.."

fail() { printf '✗ %s\n' "$*" >&2; exit 1; }
[ $# -eq 1 ] || { echo "Usage : $0 domaine.fr" >&2; exit 1; }

domain=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
domain=${domain#http://}; domain=${domain#https://}; domain=${domain%%/*}; domain=${domain#www.}
printf '%s\n' "$domain" | grep -Eq '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$' \
  || fail "Nom de domaine invalide : $domain"
file="sites/$domain.caddy"
[ -f "$file" ] || fail "Aucun site n'est configuré pour $domain."

mv "$file" "$file.prev"
if ! out=$(docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1); then
  mv "$file.prev" "$file"
  printf '%s\n' "$out" | tail -n 5 >&2
  fail "Caddy n'a pas pu recharger sa configuration : $domain reste en ligne."
fi
rm -f "$file.prev"
echo "✓ $domain n'est plus servi par ce serveur."
echo "  Son conteneur tourne toujours : arrêtez-le depuis son dossier avec docker compose down."
