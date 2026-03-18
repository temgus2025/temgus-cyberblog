# Linux pour la sécurité : commandes essentielles

Linux est le système d'exploitation de référence en cybersécurité. Que vous soyez défenseur (Blue Team) ou testeur (Red Team), maîtriser les commandes Linux est indispensable. Ce guide couvre les commandes les plus utiles pour la sécurité.

## Navigation et exploration du système

```bash
# Informations sur le système
uname -a                    # Kernel, architecture, hostname
cat /etc/os-release         # Distribution Linux
hostname -I                 # Adresses IP de la machine
uptime                      # Temps de fonctionnement et charge

# Utilisateurs connectés et activité
who                         # Utilisateurs connectés
w                           # Utilisateurs + ce qu'ils font
last                        # Historique des connexions
lastb                       # Tentatives de connexion échouées
id                          # Votre UID, GID et groupes
sudo -l                     # Ce que vous pouvez faire avec sudo
```

## Gestion des permissions

```bash
# Comprendre les permissions Linux
ls -la /etc/passwd
# -rw-r--r-- 1 root root 2847 jan 1 10:00 /etc/passwd
#  ↑↑↑↑↑↑↑↑↑
#  └─ rwx : propriétaire (root) = lecture+écriture
#      └─ r-- : groupe = lecture seulement
#          └─ r-- : autres = lecture seulement

# Modifier les permissions
chmod 700 script.sh         # Propriétaire seul peut tout faire
chmod 644 fichier.txt       # Propriétaire écrit, tous lisent
chmod +x script.sh          # Rendre exécutable
chown user:group fichier    # Changer propriétaire

# Trouver les fichiers SUID (dangereux si mal configurés)
find / -perm -4000 -type f 2>/dev/null
# Les binaires SUID s'exécutent avec les droits du propriétaire (souvent root)
# Un SUID mal configuré = escalade de privilèges potentielle

# Trouver les fichiers world-writable (tout le monde peut écrire)
find / -perm -0002 -type f 2>/dev/null
find / -perm -0002 -type d 2>/dev/null
```

## Surveillance des processus et connexions

```bash
# Processus en cours
ps aux                      # Tous les processus
ps aux | grep nginx         # Filtrer par nom
top                         # Processus en temps réel
htop                        # Version améliorée de top

# Connexions réseau actives
netstat -tuln               # Ports ouverts en écoute
netstat -antp               # Toutes les connexions avec PID
ss -tuln                    # Alternative moderne à netstat
ss -s                       # Statistiques réseau

# Identifier quel processus utilise un port
lsof -i :80                 # Qui écoute sur le port 80
lsof -i :443
fuser 80/tcp                # Alternative

# Connexions suspectes
netstat -antp | grep ESTABLISHED | grep -v "127.0.0.1"
# Montre toutes les connexions externes établies
```

## Analyse des logs

```bash
# Logs système principaux
tail -f /var/log/syslog          # Logs système en temps réel
tail -f /var/log/auth.log        # Authentifications (Debian/Ubuntu)
tail -f /var/log/secure          # Authentifications (CentOS/RHEL)
tail -f /var/log/apache2/access.log  # Logs Apache
tail -f /var/log/nginx/access.log    # Logs Nginx

# Rechercher dans les logs
grep "Failed password" /var/log/auth.log
grep "FAILED LOGIN" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn
# Affiche les IPs avec le plus de tentatives échouées

# Détecter les tentatives de brute force SSH
grep "Invalid user" /var/log/auth.log | awk '{print $8}' | sort | uniq -c | sort -rn | head -10

# Surveiller les logs en temps réel avec filtre
tail -f /var/log/auth.log | grep --line-buffered "Failed\|Invalid\|error"

# Journald (systemd)
journalctl -u ssh --since "1 hour ago"
journalctl -p err --since today
journalctl -f                    # Suivi en temps réel
```

## Sécurisation SSH

```bash
# Configuration SSH sécurisée /etc/ssh/sshd_config
Port 2222                        # Changer le port par défaut
PermitRootLogin no               # Interdire connexion root
PasswordAuthentication no        # Forcer les clés SSH uniquement
PubkeyAuthentication yes
MaxAuthTries 3                   # Max 3 tentatives
ClientAliveInterval 300          # Timeout d'inactivité
AllowUsers alice bob             # Whitelist d'utilisateurs
X11Forwarding no
AllowTcpForwarding no

# Générer une paire de clés SSH
ssh-keygen -t ed25519 -C "votre@email.com"
# Crée ~/.ssh/id_ed25519 (privée) et ~/.ssh/id_ed25519.pub (publique)

# Copier la clé publique sur le serveur
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@serveur

# Connexion avec clé
ssh -i ~/.ssh/id_ed25519 user@serveur

# Redémarrer SSH après modification
sudo systemctl restart sshd
sudo systemctl status sshd
```

## Gestion du pare-feu avec iptables/UFW

```bash
# UFW (Uncomplicated Firewall) - Plus simple
sudo ufw enable
sudo ufw default deny incoming   # Bloquer tout par défaut
sudo ufw default allow outgoing  # Autoriser les sorties
sudo ufw allow 22/tcp            # SSH
sudo ufw allow 80/tcp            # HTTP
sudo ufw allow 443/tcp           # HTTPS
sudo ufw allow from 192.168.1.0/24 to any port 3306  # MySQL depuis LAN seulement
sudo ufw status verbose

# iptables - Plus puissant
# Voir les règles actuelles
sudo iptables -L -n -v --line-numbers

# Politique par défaut : tout bloquer
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Autoriser loopback et connexions établies
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Sauvegarder les règles
sudo iptables-save > /etc/iptables/rules.v4
```

## Audit de sécurité système

```bash
# Lynis - Audit de sécurité complet
sudo apt install lynis
sudo lynis audit system
# Génère un rapport avec score et recommandations

# Rkhunter - Détection de rootkits
sudo apt install rkhunter
sudo rkhunter --update
sudo rkhunter --check
# Vérifie les binaires système et cherche des rootkits

# Chkrootkit
sudo apt install chkrootkit
sudo chkrootkit

# Vérifier l'intégrité des fichiers système
sudo debsums -c              # Debian/Ubuntu
sudo rpm -Va                 # CentOS/RHEL

# Trouver les fichiers modifiés récemment
find /etc -mtime -7 -type f 2>/dev/null   # Modifiés dans les 7 derniers jours
find /bin /sbin /usr/bin -newer /bin/ls   # Binaires modifiés après ls
```

## Gestion des services

```bash
# Voir tous les services actifs
systemctl list-units --type=service --state=running

# Désactiver les services inutiles
sudo systemctl disable bluetooth
sudo systemctl disable cups          # Imprimantes (si non nécessaire)
sudo systemctl disable avahi-daemon  # Découverte réseau

# Ports ouverts vs services actifs
ss -tuln | grep LISTEN
# Comparez avec les services attendus

# Trouver les programmes qui démarrent automatiquement
ls /etc/init.d/
ls /etc/cron.d/
crontab -l                   # Cron de l'utilisateur courant
sudo crontab -l              # Cron de root
```

## Recherche de fichiers sensibles

```bash
# Fichiers contenant des mots de passe
grep -r "password" /etc/ 2>/dev/null
grep -r "passwd" /var/www/ 2>/dev/null
find / -name "*.env" 2>/dev/null
find / -name "config.php" 2>/dev/null
find / -name ".htpasswd" 2>/dev/null

# Historique des commandes
cat ~/.bash_history
cat ~/.zsh_history
# Chercher des mots de passe saisis en ligne de commande
grep -i "pass\|secret\|key\|token" ~/.bash_history

# Fichiers de configuration importants
cat /etc/passwd              # Utilisateurs système
cat /etc/shadow              # Hashes mots de passe (root seulement)
cat /etc/sudoers             # Configuration sudo
ls -la /home/*/              # Contenu des home directories
```

## Commandes réseau essentielles

```bash
# Diagnostic réseau
ping -c 4 8.8.8.8            # Test connectivité
traceroute google.com        # Tracer la route
nslookup google.com          # Résolution DNS
dig google.com A             # Requête DNS détaillée
dig -x 8.8.8.8               # DNS inverse

# Capture de paquets
sudo tcpdump -i eth0 -n      # Capturer tout le trafic
sudo tcpdump -i eth0 port 80 # Seulement le trafic HTTP
sudo tcpdump -i eth0 -w capture.pcap  # Sauvegarder dans un fichier

# Scan réseau (sur votre propre réseau)
nmap -sn 192.168.1.0/24      # Découvrir les hôtes
nmap -sV 192.168.1.1         # Services sur un hôte
nmap -sC -sV -O 192.168.1.1  # Scan complet

# Transfert de fichiers
scp fichier.txt user@serveur:/tmp/
rsync -avz /local/ user@serveur:/remote/
wget https://example.com/fichier.zip
curl -O https://example.com/fichier.zip
```

## Alias utiles pour la sécurité

```bash
# Ajoutez ces alias dans ~/.bashrc ou ~/.zshrc

# Surveillance
alias ports='netstat -tuln'
alias connexions='netstat -antp | grep ESTABLISHED'
alias logs='tail -f /var/log/syslog'
alias authlog='tail -f /var/log/auth.log'

# Sécurité
alias perms='ls -la'
alias suid='find / -perm -4000 -type f 2>/dev/null'
alias world-writable='find / -perm -0002 -type f 2>/dev/null'

# Réseau
alias myip='curl -s ifconfig.me'
alias localip='ip addr show | grep "inet " | grep -v 127.0.0.1'
alias scanlocal='nmap -sn 192.168.1.0/24'
```

## Conclusion

Maîtriser ces commandes Linux vous donne une **visibilité complète** sur votre système. En cybersécurité, la connaissance du système sur lequel vous travaillez est fondamentale — que vous défendiez vos propres serveurs ou que vous testiez ceux d'un client. Pratiquez sur une machine virtuelle pour intégrer ces commandes naturellement.

---
*Article suivant : [OSINT : trouver des informations en source ouverte](../articles/osint)*
