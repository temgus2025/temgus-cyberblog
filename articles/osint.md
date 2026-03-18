# OSINT : trouver des informations en source ouverte

L'OSINT (Open Source Intelligence) consiste à collecter et analyser des informations **publiquement disponibles** pour en tirer du renseignement. C'est une compétence fondamentale en cybersécurité, utilisée aussi bien par les attaquants (phase de reconnaissance) que par les défenseurs (threat intelligence).

## Qu'est-ce que l'OSINT ?

L'OSINT utilise uniquement des sources **légalement accessibles** :
- Sites web et réseaux sociaux
- Registres publics (WHOIS, cadastre)
- Bases de données gouvernementales
- Moteurs de recherche
- Archives et caches

> L'OSINT est légal tant que vous accédez uniquement à des informations publiques. L'utiliser pour harceler, menacer ou accéder à des systèmes est illégal.

## Les sources OSINT principales

### Moteurs de recherche avancés

```bash
# Google Dorks - Recherches avancées Google

# Trouver des fichiers spécifiques
site:exemple.com filetype:pdf
site:exemple.com filetype:xlsx "confidentiel"

# Trouver des pages d'administration
site:exemple.com inurl:admin
site:exemple.com inurl:login intitle:"admin"

# Trouver des informations exposées
site:exemple.com "mot de passe" OR "password"
site:exemple.com ext:env OR ext:sql OR ext:config

# Caméras exposées sur Internet
intitle:"webcam" inurl:view/view.shtml
intitle:"IP Camera" inurl:/view/index.shtml

# Appareils industriels exposés (SCADA)
"SIMATIC" inurl:Portal/Portal.mwsl

# Shodan (moteur de recherche des objets connectés)
# https://www.shodan.io
# Rechercher des appareils vulnérables, ports ouverts, etc.
```

### WHOIS et DNS

```bash
# Informations sur un domaine
whois exemple.com
# Révèle : propriétaire, registrar, dates de création/expiration

# Résolution DNS complète
dig exemple.com ANY
dig exemple.com MX          # Serveurs mail
dig exemple.com NS          # Serveurs de noms
dig exemple.com TXT         # Enregistrements texte (SPF, DKIM)
dig -x 93.184.216.34        # DNS inverse

# Trouver les sous-domaines
# Via certificats SSL (crt.sh)
curl "https://crt.sh/?q=%.exemple.com&output=json" | python3 -m json.tool

# Sublist3r
python3 sublist3r.py -d exemple.com

# Amass (le plus complet)
amass enum -d exemple.com
```

### Réseaux sociaux et OSINT personnel

```bash
# Outils OSINT pour personnes
# Sherlock - Trouver un username sur 300+ plateformes
python3 sherlock.py username_cible

# theHarvester - Collecter emails et sous-domaines
theHarvester -d exemple.com -l 500 -b google,linkedin,twitter

# Maltego - Cartographie visuelle des relations
# https://www.maltego.com (version communautaire gratuite)
```

### Recherche d'images (OSINT visuel)

```
Outils de recherche d'image inversée :
→ Google Images (images.google.com) → Importer une image
→ TinEye (tineye.com) → Trouver l'origine d'une image
→ Yandex Images → Souvent plus efficace que Google
→ PimEyes → Reconnaissance faciale (controversé)

Métadonnées EXIF des photos :
→ ExifTool révèle : coordonnées GPS, appareil photo, date, auteur
```

```bash
# Extraire les métadonnées EXIF d'une image
exiftool photo.jpg
# Peut révéler : GPS coordinates, device model, date, author

# Exemple de sortie :
# GPS Latitude  : 48 deg 51' 30.12" N
# GPS Longitude : 2 deg 17' 40.44" E
# Make          : Apple
# Model         : iPhone 13 Pro
# Date/Time     : 2024:03:15 14:32:11
```

## Cadre méthodologique OSINT

### Le cycle du renseignement

```
1. DÉFINITION
   Quel est l'objectif ? Que cherche-t-on ?
          ↓
2. COLLECTE
   Utilisation des sources appropriées
          ↓
3. TRAITEMENT
   Organisation et vérification des données
          ↓
4. ANALYSE
   Extraction du renseignement utile
          ↓
5. DIFFUSION
   Rapport et recommandations
```

### Cartographie d'une cible (entreprise)

```
Cible : exemple.com
         │
         ├── Infrastructure
         │   ├── IP : nmap, shodan, censys
         │   ├── Domaines : sublist3r, amass, crt.sh
         │   ├── Technologies : wappalyzer, builtwith
         │   └── Ports/services : nmap, masscan
         │
         ├── Personnel
         │   ├── LinkedIn : employees, organigramme
         │   ├── Emails : theHarvester, hunter.io
         │   ├── Réseaux sociaux : twitter, github
         │   └── CV/offres d'emploi : compétences internes
         │
         └── Données exposées
             ├── GitHub : code source, secrets
             ├── Pastebin : dumps, leaks
             ├── Google Dorks : fichiers sensibles
             └── HaveIBeenPwned : comptes compromis
```

## Outils OSINT essentiels

| Outil | Usage | Lien |
|-------|-------|------|
| Maltego | Cartographie visuelle | maltego.com |
| theHarvester | Emails, domaines | GitHub |
| Shodan | Appareils connectés | shodan.io |
| Recon-ng | Framework OSINT | GitHub |
| SpiderFoot | Automatisation OSINT | spiderfoot.net |
| Amass | Énumération DNS | GitHub |
| Sherlock | Username hunting | GitHub |
| ExifTool | Métadonnées fichiers | exiftool.org |

```bash
# Recon-ng - Framework modulaire OSINT
recon-ng
[recon-ng] > marketplace install all
[recon-ng] > workspaces create exemple_com
[recon-ng] > modules load recon/domains-hosts/bing_domain_web
[recon-ng] > options set SOURCE exemple.com
[recon-ng] > run
```

## OSINT défensif : protéger votre empreinte

### Réduire votre exposition

```
✅ Activer la protection WHOIS (proxy d'enregistrement)
✅ Supprimer vos infos des sites de data brokers
✅ Vérifier vos paramètres de confidentialité réseaux sociaux
✅ Désactiver les métadonnées EXIF avant publication de photos
✅ Utiliser des alias email pour les inscriptions
✅ Google vous-même régulièrement (ego-googling)
```

```bash
# Supprimer les métadonnées EXIF avant publication
exiftool -all= photo.jpg           # Supprime toutes les métadonnées
exiftool -GPS*= photo.jpg          # Supprime seulement le GPS

# Vérifier ce que Google sait de vous
# https://myactivity.google.com
# https://aboutme.google.com
```

### Sites de data brokers à surveiller

```
Sites qui collectent et vendent vos informations :
→ Spokeo, Whitepages, BeenVerified, PeopleFinder

Pour se faire supprimer :
→ Visitez chaque site → "Opt-out" ou "Remove my info"
→ Service automatisé : DeleteMe, Privacy Bee (payants)
```

## Cas d'usage légitimes

**Red Team / Pentest :**
Reconnaissance avant un test d'intrusion autorisé pour identifier les vecteurs d'attaque potentiels.

**Threat Intelligence :**
Surveiller les mentions de votre entreprise sur le dark web, identifier les acteurs malveillants.

**Journalisme d'investigation :**
Vérifier des informations, identifier des sources, enquêter sur des personnalités publiques.

**Recrutement :**
Vérifier les informations d'un candidat (dans le cadre légal RGPD).

## Conclusion

L'OSINT est une discipline puissante qui démontre à quel point nos informations personnelles et professionnelles sont exposées en ligne. Maîtriser ces techniques vous permet à la fois de **mieux comprendre les attaquants** et de **protéger votre propre empreinte numérique**.

---
*Article suivant : [Injection SQL : comprendre et se protéger](../articles/injection-sql)*
