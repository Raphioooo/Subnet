#!/bin/sh
# Héberge un autre site sur ce serveur, derrière Caddy qui gère son HTTPS.
# Le site tourne dans son propre conteneur, branché sur le réseau « web »
# (voir le README, « Héberger d'autres sites sur le même serveur »).
#
# Usage : ./scripts/add-site.sh domaine.fr service:port [--prive] [--sans-www]
#   --prive     identifiant et mot de passe demandés à l'entrée du site
#   --sans-www  pas de redirection depuis www.domaine.fr
# Relancer la commande remplace la configuration du domaine (et le mot de passe).
set -eu
cd "$(dirname "$0")/.."

warn() { printf '  ! %s\n' "$*"; }
fail() { printf '✗ %s\n' "$*" >&2; exit 1; }
usage() {
  echo "Usage : $0 domaine.fr service:port [--prive] [--sans-www]" >&2
  echo "Exemple : $0 assistant.fr assistant:3000 --prive" >&2
  if ls sites/*.caddy > /dev/null 2>&1; then
    echo "Sites déjà hébergés :" >&2
    for f in sites/*.caddy; do f=${f#sites/}; echo "  ${f%.caddy}" >&2; done
  fi
  exit 1
}

domain='' target='' private='' www=1
for arg in "$@"; do
  case "$arg" in
    --prive) private=1 ;;
    --sans-www) www='' ;;
    -*) usage ;;
    *)
      if [ -z "$domain" ]; then domain=$arg
      elif [ -z "$target" ]; then target=$arg
      else usage
      fi ;;
  esac
done
[ -n "$domain" ] && [ -n "$target" ] || usage

# Domaine : on accepte aussi « https://www.domaine.fr/ » et on le nettoie.
domain=$(printf '%s' "$domain" | tr '[:upper:]' '[:lower:]')
domain=${domain#http://}; domain=${domain#https://}; domain=${domain%%/*}; domain=${domain#www.}
printf '%s\n' "$domain" | grep -Eq '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$' \
  || fail "Nom de domaine invalide : $domain"
[ "$domain" != "$(sed -n 's/^DOMAIN=//p' .env 2> /dev/null | tail -n 1)" ] \
  || fail "$domain est déjà le domaine du site Subnet."
# Sous-domaine (assistant.mondomaine.fr) : pas de www.
case "$domain" in *.*.*) www='' ;; esac

printf '%s\n' "$target" | grep -Eq '^[a-z0-9][a-z0-9_.-]*:[0-9]{1,5}$' \
  || fail "Indiquez le service du site et le port sur lequel il écoute, par exemple assistant:3000"
service=${target%:*}
port=${target##*:}
case "$service" in
  site | caddy | subnet-site) fail "Le nom « $service » est déjà pris sur ce serveur : donnez un nom unique au service du site." ;;
esac

docker compose exec -T caddy true 2> /dev/null || fail "Caddy ne tourne pas : lancez d'abord docker compose up -d"

if [ -n "$private" ]; then
  user=${SITE_USER:-admin}
  printf '%s\n' "$user" | grep -Eq '^[A-Za-z0-9._@-]{1,64}$' || fail "Identifiant invalide : $user"
  password=${SITE_PASSWORD:-$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 24)}
  # Le mot de passe passe par l'entrée standard : il n'apparaît pas dans la liste des processus.
  hash=$(printf '%s\n' "$password" | docker compose exec -T caddy caddy hash-password) \
    || fail "Le mot de passe n'a pas pu être chiffré."
fi

mkdir -p sites
file="sites/$domain.caddy"
{
  printf '# Ajouté par scripts/add-site.sh le %s.\n' "$(date '+%d/%m/%Y')"
  printf '%s {\n' "$domain"
  [ -z "$private" ] || printf '\tbasic_auth {\n\t\t%s %s\n\t}\n' "$user" "$hash"
  printf '\treverse_proxy %s\n}\n' "$target"
  [ -z "$www" ] || printf '\nwww.%s, http://www.%s {\n\tredir https://%s{uri} permanent\n}\n' "$domain" "$domain" "$domain"
} > "$file.tmp"

# Caddy n'applique la nouvelle configuration que si elle est valide ; sinon on
# remet l'ancien fichier pour qu'un redémarrage ne reparte pas sur une erreur.
[ ! -f "$file" ] || cp "$file" "$file.prev"
mv "$file.tmp" "$file"
if ! out=$(docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1); then
  if [ -f "$file.prev" ]; then mv "$file.prev" "$file"; else rm -f "$file"; fi
  printf '%s\n' "$out" | tail -n 5 >&2
  fail "Caddy a refusé cette configuration : rien n'a été modifié."
fi
rm -f "$file.prev"

if [ -n "$www" ]; then
  echo "✓ https://$domain est servi par ce serveur (www.$domain y est redirigé)."
else
  echo "✓ https://$domain est servi par ce serveur."
fi
if [ -n "$private" ]; then
  if [ -n "${SITE_PASSWORD:-}" ]; then
    echo "  Accès protégé : identifiant « $user », mot de passe choisi dans SITE_PASSWORD."
  else
    echo "  Accès protégé : identifiant « $user », mot de passe « $password »."
    echo "  Notez-le maintenant, il n'est affiché qu'une fois (relancez la commande pour en changer)."
  fi
fi

if ! docker compose exec -T caddy nc -z -w 3 "$service" "$port" > /dev/null 2>&1; then
  warn "Caddy ne joint pas encore $target : vérifiez que le conteneur « $service » tourne et qu'il rejoint le réseau web."
fi
public_ip=$(curl -fsS4 --max-time 5 https://api.ipify.org 2> /dev/null || true)
dns_ip=$(getent ahostsv4 "$domain" 2> /dev/null | awk 'NR == 1 { print $1 }' || true)
if [ -z "$dns_ip" ]; then
  server=$public_ip
  [ -n "$server" ] || server="l'adresse IPv4 de ce serveur"
  warn "$domain ne pointe encore vers aucun serveur : créez un enregistrement A vers $server."
elif [ -n "$public_ip" ] && [ "$dns_ip" != "$public_ip" ]; then
  warn "$domain pointe vers $dns_ip au lieu de $public_ip (chez Cloudflare : nuage gris, « DNS uniquement »)."
fi
echo "  Caddy obtient le certificat HTTPS seul, dès que le DNS pointe vers ce serveur."
