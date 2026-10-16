#!/usr/bin/env bash
# Installe le site Subnet sur un serveur Ubuntu ou Debian neuf, en une commande :
#
#   curl -fsSLO https://raw.githubusercontent.com/Raphioooo/Subnet/main/scripts/install.sh
#   sudo bash install.sh mondomaine.fr
#
# Le script met le système à jour, crée l'utilisateur « subnet » (connexion par
# clé SSH uniquement), active le pare-feu et les correctifs automatiques,
# installe Docker, récupère le site, le démarre en HTTPS et programme une
# sauvegarde chaque nuit. Il peut être relancé sans risque, par exemple pour
# changer de domaine ou réparer une installation.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Raphioooo/Subnet.git}"
APP_USER="${APP_USER:-subnet}"

step() { printf '\n\033[1;34m▸ %s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
warn() { printf '  \033[1;33m! %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Lancez ce script avec sudo : sudo bash install.sh mondomaine.fr"

# Domaine : on accepte aussi « https://www.mondomaine.fr/ » et on le nettoie.
DOMAIN="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')"
DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%%/*}"; DOMAIN="${DOMAIN#www.}"
if [ "$DOMAIN" != localhost ] && ! [[ "$DOMAIN" =~ ^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$ ]]; then
  fail "Indiquez votre nom de domaine, sans https:// ni www : sudo bash install.sh mondomaine.fr"
fi

# shellcheck source=/dev/null
. /etc/os-release
case "${ID:-}" in
  ubuntu | debian) DISTRO="$ID" ;;
  *) fail "Système non pris en charge : utilisez Ubuntu Server LTS ou Debian." ;;
esac

exec > >(tee -a /var/log/subnet-install.log) 2>&1
printf '\n===== Installation du %s : %s =====\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$DOMAIN" >> /var/log/subnet-install.log

# Clés SSH de la personne qui lance le script : elles seront celles de
# l'utilisateur « subnet ». Sans clé, on s'arrête avant de toucher à SSH.
INVOKER="${SUDO_USER:-root}"
INVOKER_HOME="$(getent passwd "$INVOKER" | cut -d: -f6)"
KEY_RE='(sk-)?(ssh-(ed25519|rsa|dss)|ecdsa-sha2-nistp(256|384|521))(@openssh\.com)? [A-Za-z0-9+/=]+( .*)?$'
KEYS="$(grep -ohE "$KEY_RE" "$INVOKER_HOME/.ssh/authorized_keys" 2>/dev/null || true)"
if [ -z "$KEYS" ] && id "$APP_USER" >/dev/null 2>&1; then
  KEYS="$(grep -ohE "$KEY_RE" "$(getent passwd "$APP_USER" | cut -d: -f6)/.ssh/authorized_keys" 2>/dev/null || true)"
fi
[ -n "$KEYS" ] || fail "Aucune clé SSH trouvée pour $INVOKER. Ajoutez d'abord votre clé SSH au serveur (guide, étape 5), puis relancez le script."

step "Mise à jour du système"
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
APT=(apt-get -y -q -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold)
apt-get update -q
"${APT[@]}" full-upgrade
"${APT[@]}" install ca-certificates curl git sudo ufw cron unattended-upgrades openssh-server
timedatectl set-timezone Europe/Paris 2>/dev/null || ln -sf /usr/share/zoneinfo/Europe/Paris /etc/localtime
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
info "Système à jour ; les correctifs de sécurité s'installeront chaque nuit."

step "Utilisateur $APP_USER"
id "$APP_USER" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$APP_USER"
usermod -aG sudo "$APP_USER"
printf '%s ALL=(ALL) NOPASSWD:ALL\n' "$APP_USER" > /etc/sudoers.d/90-subnet
chmod 440 /etc/sudoers.d/90-subnet
if command -v visudo > /dev/null 2>&1 && ! visudo -c -f /etc/sudoers.d/90-subnet > /dev/null; then
  rm -f /etc/sudoers.d/90-subnet
  fail "Règle sudo invalide."
fi
APP_HOME="$(getent passwd "$APP_USER" | cut -d: -f6)"
install -d -m 700 -o "$APP_USER" -g "$APP_USER" "$APP_HOME/.ssh"
AUTH="$APP_HOME/.ssh/authorized_keys"
touch "$AUTH"
while IFS= read -r key; do
  grep -qxF "$key" "$AUTH" || printf '%s\n' "$key" >> "$AUTH"
done <<< "$KEYS"
chown "$APP_USER:$APP_USER" "$AUTH"
chmod 600 "$AUTH"
info "Connexion par clé SSH : ssh $APP_USER@<adresse du serveur>"

step "Sécurisation de SSH"
cat > /etc/ssh/sshd_config.d/00-subnet.conf <<'EOF'
# Installé par Subnet : connexion par clé uniquement, jamais avec root.
# Le préfixe 00- fait passer ces réglages avant ceux de l'hébergeur.
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
EOF
if ! sshd -t; then
  rm -f /etc/ssh/sshd_config.d/00-subnet.conf
  fail "La configuration SSH est invalide : elle n'a pas été modifiée."
fi
systemctl reload ssh 2>/dev/null || systemctl restart ssh 2>/dev/null || systemctl restart sshd
if [ "$(sshd -T | awk '$1 == "passwordauthentication" { print $2 }')" = no ]; then
  info "Mots de passe et compte root refusés pour les nouvelles connexions."
else
  warn "Les réglages SSH ne semblent pas appliqués : vérifiez /etc/ssh/sshd_config."
fi

step "Pare-feu"
SSH_PORT="$(sshd -T | awk '$1 == "port" && !seen { print $2; seen = 1 }')"
ufw allow "${SSH_PORT:-22}/tcp" comment 'SSH' > /dev/null
ufw allow 80/tcp comment 'HTTP' > /dev/null
ufw allow 443 comment 'HTTPS' > /dev/null
ufw --force enable > /dev/null
info "Ports ouverts : ${SSH_PORT:-22} (SSH), 80 et 443 (site)."

step "Docker"
if ! command -v docker > /dev/null 2>&1 || ! docker compose version > /dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/$DISTRO/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/$DISTRO
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
  apt-get update -q
  "${APT[@]}" install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker > /dev/null 2>&1
usermod -aG docker "$APP_USER"
info "$(docker compose version)"

step "Récupération du site"
SITE_DIR="$APP_HOME/site"
as_app() { runuser -u "$APP_USER" -- "$@"; }
if [ -d "$SITE_DIR/.git" ]; then
  as_app git -C "$SITE_DIR" pull --ff-only
else
  as_app git clone --quiet "$REPO_URL" "$SITE_DIR"
fi
ENV_FILE="$SITE_DIR/.env"
[ -f "$ENV_FILE" ] || as_app cp "$SITE_DIR/.env.example" "$ENV_FILE"
set_env() {
  if grep -q "^$1=" "$ENV_FILE"; then sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; else printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE"; fi
}
set_env DOMAIN "$DOMAIN"
set_env BASE_URL "https://$DOMAIN"
chown "$APP_USER:$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"
info "Code dans $SITE_DIR, configuration dans $ENV_FILE."

step "Démarrage du site"
as_app sh -c "cd '$SITE_DIR' && docker compose up -d --build --remove-orphans"
for _ in $(seq 1 60); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' subnet-site-1 2>/dev/null || true)" = healthy ] && break
  sleep 2
done
[ "$(docker inspect -f '{{.State.Health.Status}}' subnet-site-1 2>/dev/null || true)" = healthy ] \
  || fail "Le site ne démarre pas. Journal : cd $SITE_DIR && docker compose logs site"
info "Le site et Caddy tournent ; ils redémarrent seuls avec le serveur."

step "Sauvegarde automatique"
CRON_LINE='30 3 * * * $HOME/site/scripts/backup.sh >> $HOME/sauvegardes.log 2>&1'
{ crontab -u "$APP_USER" -l 2>/dev/null | grep -v 'scripts/backup.sh' || true; echo "$CRON_LINE"; } | crontab -u "$APP_USER" -
systemctl enable --now cron > /dev/null 2>&1 || true
info "Chaque nuit à 3 h 30, dans $SITE_DIR/backups (14 sauvegardes conservées)."

step "Certificat HTTPS"
PUBLIC_IP="$(curl -fsS4 --max-time 5 https://api.ipify.org 2>/dev/null || true)"
[ -n "$PUBLIC_IP" ] || PUBLIC_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{ for (i = 1; i < NF; i++) if ($i == "src") print $(i + 1) }' || true)"
DNS_IP="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk 'NR == 1 { print $1 }' || true)"
HTTPS_OK=
if [ "$DOMAIN" = localhost ]; then
  info "Domaine local : certificat de test."
elif [ -n "$PUBLIC_IP" ] && [ "$DNS_IP" = "$PUBLIC_IP" ]; then
  for _ in $(seq 1 45); do
    if as_app sh -c "cd '$SITE_DIR' && docker compose logs caddy" 2>/dev/null \
      | grep 'certificate obtained successfully' | grep "\"identifier\":\"$DOMAIN\"" > /dev/null; then
      HTTPS_OK=1
      break
    fi
    sleep 2
  done
  if [ -n "$HTTPS_OK" ]; then info "Certificat obtenu : https://$DOMAIN est actif."
  else warn "Certificat pas encore obtenu : Caddy réessaie seul. Journal : docker compose logs caddy"; fi
else
  warn "Le DNS de $DOMAIN ne pointe pas encore vers ce serveur (${PUBLIC_IP:-adresse inconnue})."
  warn "Rien à faire : le certificat HTTPS sera obtenu automatiquement dès qu'il sera à jour."
fi

SITE_LOGS="$(as_app sh -c "cd '$SITE_DIR' && docker compose logs --no-color site" 2>/dev/null || true)"
PASSWORD_BOX="$(printf '%s\n' "$SITE_LOGS" | sed -n 's/^[^|]*| //p' | grep -E '^[┌│└]' || true)"

printf '\n\033[1;32m✓ Installation terminée\033[0m\n\n'
info "Site             https://$DOMAIN"
info "Administration   https://$DOMAIN/admin"
if [ -n "$PASSWORD_BOX" ]; then
  printf '\n%s\n' "$PASSWORD_BOX" | sed 's/^/  /'
elif printf '%s\n' "$SITE_LOGS" | grep 'mot de passe temporaire est toujours actif' > /dev/null; then
  info "Mot de passe     le mot de passe temporaire affiché à la première installation"
  info "                 (perdu ? cd ~/site && docker compose exec site npm run set-password)"
else
  info "Mot de passe     celui que vous avez choisi dans l'administration"
fi
printf '\n'
info "Connectez-vous désormais au serveur avec : ssh $APP_USER@${PUBLIC_IP:-<adresse du serveur>}"
info "(la connexion avec root et par mot de passe est désactivée)"
if [ -f /var/run/reboot-required ]; then
  info "Un redémarrage termine les mises à jour : sudo reboot (le site repart tout seul)."
fi
info "Journal de l'installation : /var/log/subnet-install.log"
