# Autres sites hébergés sur ce serveur

Caddy charge chaque fichier `*.caddy` de ce dossier : un par domaine, créé par
`scripts/add-site.sh` et retiré par `scripts/remove-site.sh`. Ces fichiers sont
ignorés par git, donc les mises à jour du site Subnet n'y touchent jamais.
