# Hardening Linux : durcissement complet d'un serveur

Un serveur Linux fraîchement installé est loin d'être sécurisé par défaut. Le hardening consiste à réduire sa surface d'attaque en configurant correctement les services, les permissions et les politiques de sécurité. Ce guide suit les recommandations du CIS Benchmark Linux.

## Étape 1 : Mises à jour et packages

```bash
# Ubuntu/Debian
apt update && apt upgrade -y
apt autoremove -y

# CentOS/RHEL
yum update -y

# Activer les mises à jour automatiques de sécurité (Ubuntu)
apt install unattended-upgrades -y
dpkg-reconfigure --priority=low unattended-upgrades

# Configurer /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "admin@exemple.com";
```

## Étape 2 : Sécuriser SSH

```bash
# /etc/ssh/sshd_config — Configuration sécurisée

# Changer le port par défaut (obscurité, mais réduit le bruit)
Port 2222

# Désactiver l'authentification par mot de passe
PasswordAuthentication no
PubkeyAuthentication yes

# Désactiver la connexion root directe
PermitRootLogin no

# Limiter les utilisateurs autorisés
AllowUsers deployer admin

# Désactiver les protocoles obsolètes
Protocol 2

# Timeout de session inactive (10 minutes)
ClientAliveInterval 600
ClientAliveCountMax 0

# Désactiver le forwarding X11 si non nécessaire
X11Forwarding no

# Bannière de connexion
Banner /etc/ssh/banner.txt

# Chiffrement fort uniquement
Ciphers aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512,hmac-sha2-256
KexAlgorithms curve25519-sha256,diffie-hellman-group14-sha256

# Appliquer
systemctl restart sshd

# Générer une clé SSH forte (côté client)
ssh-keygen -t ed25519 -C "admin@serveur" -f ~/.ssh/id_ed25519
# Copier la clé publique sur le serveur
ssh-copy-id -i ~/.ssh/id_ed25519.pub -p 2222 user@serveur
```

## Étape 3 : Pare-feu avec UFW

```bash
# UFW (Uncomplicated Firewall) — Simple et efficace

# Politique par défaut : tout bloquer en entrée
ufw default deny incoming
ufw default allow outgoing

# Autoriser SSH (sur le nouveau port)
ufw allow 2222/tcp

# Autoriser HTTP/HTTPS si serveur web
ufw allow 80/tcp
ufw allow 443/tcp

# Limiter les tentatives SSH (anti brute-force)
ufw limit 2222/tcp

# Activer
ufw enable
ufw status verbose

# Voir les règles numérotées (pour les supprimer)
ufw status numbered

# Bloquer une IP suspecte
ufw deny from 185.220.101.5 to any
```

## Étape 4 : Fail2ban — Protection brute-force

```bash
# Installation
apt install fail2ban -y

# /etc/fail2ban/jail.local
[DEFAULT]
bantime  = 3600      # Bannir 1 heure
findtime  = 600      # Fenêtre de 10 minutes
maxretry = 5         # 5 tentatives max
banaction = ufw      # Utiliser UFW pour bannir

[sshd]
enabled = true
port    = 2222
filter  = sshd
logpath = /var/log/auth.log
maxretry = 3         # Plus strict pour SSH

[nginx-http-auth]
enabled = true
port    = http,https
logpath = /var/log/nginx/error.log

# Démarrer
systemctl enable fail2ban
systemctl start fail2ban

# Vérifier les IPs bannies
fail2ban-client status sshd

# Débannir une IP (si besoin)
fail2ban-client set sshd unbanip 192.168.1.100
```

## Étape 5 : Permissions et comptes

```bash
# Supprimer ou désactiver les comptes inutiles
cat /etc/passwd | awk -F: '$3 >= 1000 {print $1}'  # Utilisateurs humains

# Vérifier les comptes avec shell
grep -v "nologin\|false" /etc/passwd

# Désactiver un compte sans le supprimer
usermod -L -s /usr/sbin/nologin unused_user

# Vérifier les fichiers SUID/SGID (élévation de privilèges potentielle)
find / -perm -4000 -type f 2>/dev/null  # SUID
find / -perm -2000 -type f 2>/dev/null  # SGID

# Supprimer le SUID sur les binaires non nécessaires
chmod u-s /usr/bin/at
chmod u-s /usr/bin/newgrp

# Sécuriser /etc/passwd et /etc/shadow
chmod 644 /etc/passwd
chmod 600 /etc/shadow
chown root:root /etc/passwd /etc/shadow

# Politique de mots de passe (/etc/login.defs)
PASS_MAX_DAYS   90
PASS_MIN_DAYS   1
PASS_MIN_LEN    14
PASS_WARN_AGE   7

# Complexité des mots de passe (PAM)
apt install libpam-pwquality -y
# /etc/security/pwquality.conf
minlen = 14
dcredit = -1    # Au moins 1 chiffre
ucredit = -1    # Au moins 1 majuscule
lcredit = -1    # Au moins 1 minuscule
ocredit = -1    # Au moins 1 caractère spécial
```

## Étape 6 : Audit et journalisation

```bash
# Auditd — Journalisation avancée des événements système
apt install auditd audispd-plugins -y

# /etc/audit/rules.d/audit.rules
# Surveiller les modifications des fichiers sensibles
-w /etc/passwd -p wa -k passwd_changes
-w /etc/shadow -p wa -k shadow_changes
-w /etc/sudoers -p wa -k sudoers_changes
-w /etc/ssh/sshd_config -p wa -k sshd_config

# Surveiller les connexions SSH
-w /var/log/auth.log -p wa -k auth_log

# Surveiller les exécutions de commandes privilégiées
-a always,exit -F arch=b64 -S execve -F euid=0 -k root_commands

# Surveiller les modifications de crontab
-w /var/spool/cron -p wa -k crontab
-w /etc/cron.d -p wa -k cron_changes

# Appliquer les règles
augenrules --load
systemctl restart auditd

# Chercher des événements suspects
ausearch -k passwd_changes
ausearch -k root_commands | aureport -x --summary
```

## Étape 7 : AppArmor / SELinux

```bash
# AppArmor (Ubuntu/Debian) — Contrôle d'accès mandatory

# Vérifier le statut
aa-status

# Mode enforce sur tous les profils
aa-enforce /etc/apparmor.d/*

# Profil pour nginx
# /etc/apparmor.d/usr.sbin.nginx
/usr/sbin/nginx {
  capability net_bind_service,
  capability setuid,
  capability setgid,

  /etc/nginx/** r,
  /var/log/nginx/** w,
  /var/www/html/** r,
  /run/nginx.pid rw,

  # Refuser tout le reste
  deny /etc/** w,
  deny /root/** rwx,
}

# Tester un profil (mode complain = log sans bloquer)
aa-complain /etc/apparmor.d/usr.sbin.nginx
# Surveiller les logs pendant 24h puis passer en enforce
aa-enforce /etc/apparmor.d/usr.sbin.nginx
```

## Étape 8 : Paramètres kernel (sysctl)

```bash
# /etc/sysctl.d/99-hardening.conf

# Désactiver IPv6 si non utilisé
net.ipv6.conf.all.disable_ipv6 = 1

# Protection contre les IP spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Désactiver le routage IP
net.ipv4.ip_forward = 0

# Protection SYN flood
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048

# Ignorer les broadcasts ICMP (Smurf attack)
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Désactiver ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0

# Protection ASLR (randomisation de l'espace d'adressage)
kernel.randomize_va_space = 2

# Désactiver les core dumps
fs.suid_dumpable = 0

# Appliquer sans redémarrage
sysctl -p /etc/sysctl.d/99-hardening.conf
```

## Vérification avec Lynis

```bash
# Lynis — Outil d'audit de sécurité Linux open source
apt install lynis -y

# Audit complet du système
lynis audit system

# Score de 0 à 100
# < 60 : Configuration dangereuse
# 60-80 : Acceptable
# > 80 : Bonne configuration

# Voir les suggestions
lynis audit system --tests-from-group authentication
lynis audit system --tests-from-group networking

# Rapport complet
cat /var/log/lynis.log | grep "Suggestion"
```

## Conclusion

Le hardening Linux est un processus continu — pas une action ponctuelle. Référencez-vous au **CIS Benchmark Linux** pour une liste exhaustive et priorisée. Auditez régulièrement avec Lynis, surveillez vos logs avec auditd et maintenez vos packages à jour. Un serveur bien durci réduit considérablement la surface d'attaque exploitable.

---
*Catégorie : Sécurité réseau*
