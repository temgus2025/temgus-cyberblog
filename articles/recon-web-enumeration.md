# Reconnaissance web : énumération et cartographie des cibles

La reconnaissance est la phase la plus importante d'un pentest web. Une énumération complète révèle des surfaces d'attaque invisibles au premier regard : répertoires cachés, sous-domaines oubliés, technologies exposées, fichiers sensibles.

## Méthodologie de reconnaissance

```
Passive Recon (sans contact avec la cible)
    ↓
Active Recon (contact direct avec la cible)
    ↓
Cartographie complète
    ↓
Identification des vecteurs d'attaque
```

## Reconnaissance passive

### WHOIS et DNS
```bash
# Informations WHOIS
whois example.com

# Résolution DNS
dig example.com
dig example.com MX      # Serveurs mail
dig example.com NS      # Serveurs DNS
dig example.com TXT     # Enregistrements TXT (SPF, DMARC...)
dig example.com ANY     # Tous les enregistrements

# Transfert de zone (si mal configuré)
dig axfr @ns1.example.com example.com

# dnsx - résolution en masse
dnsx -l subdomains.txt -a -aaaa -cname -mx -ns
```

### Sous-domaines passifs
```bash
# Amass (passive)
amass enum -passive -d example.com

# Subfinder
subfinder -d example.com

# theHarvester
theHarvester -d example.com -b google,bing,linkedin

# Certificate Transparency Logs
# crt.sh - chercher: %.example.com
curl "https://crt.sh/?q=%.example.com&output=json" | 
  jq '.[].name_value' | sort -u
```

### Google Dorks
```
site:example.com                  # Toutes les pages indexées
site:example.com filetype:pdf     # Fichiers PDF
site:example.com inurl:admin      # Pages admin
site:example.com ext:php          # Scripts PHP
"example.com" "password"          # Mentions de mots de passe
inurl:example.com/wp-admin        # WordPress admin
```

### Shodan
```bash
# Chercher des services exposés
shodan search "hostname:example.com"
shodan search "org:Example Company"
shodan search "ssl.cert.subject.cn:example.com"

# Via API
shodan host 192.168.1.1
```

## Reconnaissance active

### Scan avec Nmap
```bash
# Scan web complet
nmap -sV -p 80,443,8080,8443,8888 --script http-title,http-headers example.com

# Détection WAF
nmap --script http-waf-detect example.com
nmap --script http-waf-fingerprint example.com
```

### Technologies utilisées
```bash
# WhatWeb
whatweb example.com
whatweb -a 3 example.com  # Niveau agressif

# Wappalyzer (extension navigateur ou CLI)
# Détecte: CMS, frameworks, serveurs web, analytics...

# BuiltWith (online)
# builtwith.com/example.com
```

### Énumération de répertoires et fichiers

```bash
# Gobuster
gobuster dir -u https://example.com \
  -w /usr/share/seclists/Discovery/Web-Content/common.txt \
  -x php,html,txt,bak \
  -t 50

# Feroxbuster (récursif automatiquement)
feroxbuster -u https://example.com \
  -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt \
  -x php,html,txt \
  --depth 3

# ffuf
ffuf -u https://example.com/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/common.txt \
  -fc 404 \
  -mc all

# Fichiers sensibles courants à chercher
ffuf -u https://example.com/FUZZ \
  -w /usr/share/seclists/Discovery/Web-Content/sensitive-files.txt
```

### Fichiers sensibles à chercher
```
/.git/config          # Repository Git exposé
/.env                 # Variables d'environnement
/backup.zip           # Sauvegardes
/robots.txt           # Chemins cachés
/sitemap.xml          # Structure du site
/phpinfo.php          # Infos PHP
/wp-config.php        # Config WordPress
/.htaccess            # Config Apache
/web.config           # Config IIS
/config.php           # Configurations diverses
```

### Énumération de sous-domaines active
```bash
# DNSx avec bruteforce
dnsx -d example.com -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# Amass actif
amass enum -active -d example.com

# Gobuster DNS
gobuster dns -d example.com \
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt \
  -t 50
```

## Analyser les résultats

### Identifier les CMS vulnérables

```bash
# WordPress
wpscan --url https://example.com \
  --enumerate u,p,t,vp,vt \
  --api-token YOUR_TOKEN

# Joomla
joomscan -u https://example.com

# Drupal
droopescan scan drupal -u https://example.com
```

### Analyser les headers HTTP
```bash
curl -I https://example.com

# Headers de sécurité à vérifier :
# Strict-Transport-Security (HSTS)
# Content-Security-Policy (CSP)
# X-Frame-Options
# X-Content-Type-Options
# Referrer-Policy

# SecurityHeaders.com : outil en ligne pour analyser les headers
```

### Analyser les certificats SSL/TLS
```bash
# SSLyze
sslyze example.com

# testssl.sh
./testssl.sh https://example.com

# SSLLabs (en ligne)
# ssllabs.com/ssltest/
```

## Outils de reconnaissance globale

### Eyewitness — Screenshots automatiques
```bash
# Prendre des screenshots de toutes les URLs
eyewitness --web -f urls.txt --timeout 10 -d output/

# Très utile pour identifier rapidement les applications intéressantes
```

### Aquatone
```bash
cat subdomains.txt | aquatone -ports xlarge -out aquatone_output/
```

## Organisation des résultats

Documentez tout dans un fichier structuré :

```
# Reconnaissance - example.com

## Sous-domaines découverts
- www.example.com (Apache 2.4, WordPress 6.x)
- admin.example.com (Nginx, Panel d'administration)
- api.example.com (API REST, Node.js)
- dev.example.com (Exposé, mêmes credentials que prod ?)

## Fichiers intéressants
- /backup.zip (accès non authentifié !)
- /.git/ (repository exposé)

## Technologies
- CMS: WordPress 6.1 (vulnérable CVE-XXXX)
- Serveur: Apache 2.4.51
- PHP: 7.4 (EOL)
- Framework: Laravel 8

## Vecteurs potentiels
1. WordPress 6.1 - CVE à vérifier
2. .git exposé - extraire le code source
3. admin.example.com - tester credentials par défaut
```

## Conclusion

Une bonne reconnaissance peut faire la différence entre un pentest mediocre et une mission complète. Ne passez jamais directement à l'exploitation sans avoir cartographié exhaustivement la surface d'attaque. Les trouvailles les plus critiques (fichiers .env, .git exposés, sous-domaines oubliés) se révèlent souvent lors de cette phase.
