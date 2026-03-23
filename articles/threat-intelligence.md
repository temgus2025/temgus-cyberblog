# Threat Intelligence : anticiper les cyberattaques

La Threat Intelligence (renseignement sur les menaces) consiste à collecter, analyser et partager des informations sur les cybermenaces pour anticiper les attaques avant qu'elles ne se produisent. C'est le passage d'une sécurité réactive à une sécurité prédictive.

## Qu'est-ce que la Threat Intelligence ?

```
Sécurité réactive :
Attaque → Détection → Réponse
(on subit et on réagit)

Sécurité avec Threat Intelligence :
Renseignement → Anticipation → Prévention
(on sait ce qui arrive avant que ça arrive)

Analogie militaire :
Un général sans renseignement combat à l'aveugle
Un général avec renseignement connaît l'ennemi, ses outils, ses tactiques
```

## Les 4 niveaux de Threat Intelligence

```
1. STRATÉGIQUE
Audience : Direction, RSSI, Board
Format : Rapports, présentations
Contenu : Tendances macro, risques business
Exemple : "Les attaques ransomware contre le secteur santé
           ont augmenté de 130% en 2023"

2. OPÉRATIONNEL
Audience : Équipes sécurité, SOC managers
Format : Rapports techniques
Contenu : Campagnes en cours, TTPs des acteurs
Exemple : "APT28 cible les organisations OTAN avec des
           phishing leurres sur Ukraine depuis 3 mois"

3. TACTIQUE
Audience : Analystes SOC, Threat Hunters
Format : TTPs MITRE ATT&CK, Sigma rules
Contenu : Techniques, tactiques, procédures
Exemple : "Ce groupe utilise PowerShell EncodedCommand
           puis Cobalt Strike via DNS C2"

4. TECHNIQUE
Audience : Équipes techniques, SIEM
Format : IOCs (IP, domaines, hashes)
Contenu : Indicateurs de compromission
Exemple : "IP 185.220.101.5, hash abc123, domaine evil.com"
```

## Les IOCs — Indicateurs de Compromission

```python
# Types d'IOCs et leur durée de vie

iocs = {
    "Hashes (MD5/SHA256)": {
        "exemple": "d41d8cd98f00b204e9800998ecf8427e",
        "durée_de_vie": "Permanente",
        "qualité": "Élevée mais facile à contourner (modifier 1 bit)",
        "usage": "Identifier un fichier malveillant exact"
    },
    "IPs": {
        "exemple": "185.220.101.5",
        "durée_de_vie": "Heures à jours",
        "qualité": "Faible (les attaquants changent d'IP facilement)",
        "usage": "Bloquer temporairement, enrichir le contexte"
    },
    "Domaines": {
        "exemple": "update-windows-security.com",
        "durée_de_vie": "Jours à semaines",
        "qualité": "Moyenne (domaines jetables)",
        "usage": "Bloquer DNS, détecter C2"
    },
    "URLs": {
        "exemple": "http://evil.com/payload.ps1",
        "durée_de_vie": "Heures",
        "qualité": "Faible mais précise",
        "usage": "Bloquer proxy web"
    },
    "TTPs MITRE ATT&CK": {
        "exemple": "T1059.001 PowerShell",
        "durée_de_vie": "Mois à années",
        "qualité": "Très élevée (les attaquants changent rarement de TTP)",
        "usage": "Détections durables, threat hunting"
    }
}

# Pyramide de la douleur (David Bianco) :
# Plus l'IOC est haut dans la pyramide, plus il est difficile
# pour l'attaquant de le changer

#     TTPs          ← Très difficile à changer
#    --------
#    Outils         ← Difficile
#   ----------
#   Infrastructure  ← Moyen
#  ------------
#  Réseau/Host     ← Facile
# --------------
# Hashes atomiques ← Trivial
```

## Sources de Threat Intelligence

### Sources ouvertes (OSINT)

```bash
# Feeds d'IOCs gratuits
→ AlienVault OTX (otx.alienvault.com) : millions d'IOCs
→ Abuse.ch (abuse.ch) : MalwareBazaar, URLhaus, ThreatFox
→ VirusTotal (virustotal.com) : enrichissement IOCs
→ MISP (misp-project.org) : plateforme de partage
→ OpenPhish (openphish.com) : URLs de phishing
→ PhishTank (phishtank.org) : phishing URLs

# Rapports APT gratuits
→ MITRE ATT&CK Groups (attack.mitre.org/groups)
→ Mandiant APT Reports (mandiant.com/resources)
→ CrowdStrike Intelligence (crowdstrike.com/blog)
→ Recorded Future (recordedfuture.com/research)
→ ANSSI rapports (cert.ssi.gouv.fr/actualite)

# Monitoring de vulnérabilités
→ NVD (nvd.nist.gov) : CVE officiels
→ Exploit-DB (exploit-db.com) : exploits publics
→ CISA KEV (Known Exploited Vulnerabilities)
```

### Intégration dans un SIEM

```python
# Script Python : collecter et ingérer des IOCs dans un SIEM

import requests
import json
from datetime import datetime

def collecter_iocs_abuse():
    """Collecter les IOCs depuis Abuse.ch ThreatFox"""
    url = "https://threatfox-api.abuse.ch/api/v1/"
    payload = {
        "query": "get_iocs",
        "days": 1  # IOCs des dernières 24h
    }
    response = requests.post(url, json=payload)
    data = response.json()

    iocs = []
    for ioc in data.get('data', []):
        iocs.append({
            'type': ioc['ioc_type'],
            'value': ioc['ioc'],
            'malware': ioc['malware'],
            'confidence': ioc['confidence_level'],
            'tags': ioc['tags'],
            'first_seen': ioc['first_seen']
        })
    return iocs

def ingerer_dans_siem(iocs, siem_url, api_key):
    """Envoyer les IOCs vers le SIEM (ex: Elastic/OpenSearch)"""
    headers = {'Authorization': f'ApiKey {api_key}', 'Content-Type': 'application/json'}
    for ioc in iocs:
        ioc['@timestamp'] = datetime.utcnow().isoformat()
        ioc['source'] = 'ThreatFox'
        requests.post(f"{siem_url}/threat-intel/_doc", json=ioc, headers=headers)
    print(f"{len(iocs)} IOCs ingérés")

# Automatiser avec un cron job toutes les heures
iocs = collecter_iocs_abuse()
ingerer_dans_siem(iocs, "http://elasticsearch:9200", "YOUR_API_KEY")
```

## MISP — Plateforme de partage de TI

```bash
# MISP (Malware Information Sharing Platform)
# Standard open source pour partager la Threat Intelligence

# Installation avec Docker
git clone https://github.com/MISP/misp-docker
cd misp-docker
docker-compose up -d

# Fonctionnalités clés :
# → Créer et partager des "Events" (incidents, campagnes)
# → Corrélation automatique entre IOCs
# → Export vers STIX/TAXII (standards interop)
# → Connexion avec d'autres MISP (partage communautaire)
# → Intégration SIEM, firewall, proxy

# Importer des IOCs depuis une source externe
from pymisp import PyMISP

misp = PyMISP('https://misp.votre-org.com', 'VOTRE_API_KEY')

event = misp.new_event(
    distribution=1,
    threat_level_id=2,
    analysis=1,
    info="Campagne phishing - Secteur financier - Mars 2025"
)

# Ajouter des IOCs
misp.add_named_attribute(event, 'ip-dst', '185.220.101.5', comment='C2 server')
misp.add_named_attribute(event, 'domain', 'fake-bank-login.com', comment='Phishing domain')
misp.add_named_attribute(event, 'md5', 'abc123...', comment='Payload dropper')
```

## Profiling d'acteurs malveillants

```python
# Créer une fiche de profil d'un groupe APT

profil_lockbit = {
    "nom": "LockBit",
    "aussi_connu_sous": ["LockBit 3.0", "LockBit Black"],
    "type": "Ransomware-as-a-Service (RaaS)",
    "origine": "Russie (supposée)",
    "actif_depuis": "2019",
    "secteurs_ciblés": ["Santé", "Finance", "Industrie", "Gouvernement"],
    "pays_ciblés": ["USA", "Europe", "Australie"],
    "vecteurs_initiaux": [
        "RDP exposé + brute force",
        "Phishing ciblé",
        "Exploitation de vulnérabilités (Citrix, Fortinet)"
    ],
    "outils_utilisés": [
        "Cobalt Strike",
        "AnyDesk (légal mais détourné)",
        "Mimikatz",
        "Rclone (exfiltration)"
    ],
    "ttps_mitre": [
        "T1486 - Data Encrypted for Impact",
        "T1490 - Inhibit System Recovery",
        "T1562.001 - Disable Security Tools"
    ],
    "iocs_domaines": ["lockbit3ouvrszfk.onion"],
    "statut": "Partiellement démantelé (Operation Cronos, Feb 2024)"
}
```

## Conclusion

La Threat Intelligence transforme la cybersécurité d'une discipline réactive en une approche stratégique. En comprenant qui vous cible, avec quels outils et quelles techniques, vous pouvez adapter vos défenses avant l'attaque. Commencez par les sources gratuites (AlienVault OTX, MITRE ATT&CK), déployez MISP pour centraliser votre TI, et intégrez progressivement dans votre SIEM.

---
*Catégorie : Pentest*
