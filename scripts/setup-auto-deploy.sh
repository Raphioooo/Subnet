#!/bin/sh
# Prépare la mise en ligne automatique depuis GitHub Actions : crée une clé SSH
# qui ne peut lancer que scripts/deploy.sh, puis affiche les quatre secrets à
# saisir dans GitHub (Settings > Secrets and variables > Actions).
# La clé privée n'est pas conservée sur le serveur.
# Usage, connecté avec l'utilisateur du site : ~/site/scripts/setup-auto-deploy.sh
set -eu
cd "$(dirname "$0")/.."
site_dir="$(pwd)"

domain="$(sed -n 's/^DOMAIN=//p' .env 2>/dev/null | tail -n 1)"
[ -n "$domain" ] || { echo "DOMAIN est vide dans $site_dir/.env : lancez d'abord install.sh." >&2; exit 1; }
host_key="$(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
ssh-keygen -q -t ed25519 -N "" -C "github-actions" -f "$tmp/key"

# Une seule clé GitHub Actions à la fois : l'ancienne est remplacée.
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
touch "$HOME/.ssh/authorized_keys"
grep -v ' github-actions$' "$HOME/.ssh/authorized_keys" > "$tmp/authorized_keys" || true
printf 'command="%s/scripts/deploy.sh",restrict %s\n' "$site_dir" "$(cat "$tmp/key.pub")" >> "$tmp/authorized_keys"
cat "$tmp/authorized_keys" > "$HOME/.ssh/authorized_keys"
chmod 600 "$HOME/.ssh/authorized_keys"

cat <<EOF

Dans GitHub, ouvrez le dépôt puis Settings > Secrets and variables > Actions,
et créez ces quatre secrets avec le bouton « New repository secret » :

━━ DEPLOY_HOST ━━
$domain

━━ DEPLOY_USER ━━
$(id -un)

━━ DEPLOY_SSH_KEY ━━ (tout le bloc, lignes BEGIN et END comprises)
$(cat "$tmp/key")

━━ DEPLOY_KNOWN_HOSTS ━━
$domain $host_key

Ensuite : onglet Actions > « Tests et mise en ligne » > Run workflow.
Le site sera désormais mis à jour à chaque fusion dans la branche main.
EOF
