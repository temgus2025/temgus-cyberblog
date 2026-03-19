# DNS sécurisé : bloquer les menaces à la source

Le DNS est souvent négligé en sécurité, pourtant c'est un vecteur d'attaque majeur et un point de contrôle stratégique. Sécuriser le DNS permet de bloquer malwares, phishing et exfiltration de données avant même qu'une connexion soit établie.

## Pourquoi sécuriser le DNS ?

### Le DNS comme vecteur d'attaque
- **DNS spoofing/poisoning** : rediriger vers de faux serveurs
- **DNS tunneling** : exfiltrer des données via des requêtes DNS
- **DGA** (Domain Generation Algorithm) : malwares qui génèrent des domaines aléatoires pour leurs C2
- **Fast flux** : changer rapidement les IPs pour éviter le blocage

### Le DNS comme point de contrôle
Bloquer un domaine malveillant au niveau DNS empêche toute communication, même si le malware est déjà sur un poste. C'est la solution la plus économe en ressources.

## DNS over HTTPS (DoH) et DNS over TLS (DoT)

Le DNS traditionnel est en clair — n'importe qui sur le réseau peut voir vos requêtes DNS.

### DNS over TLS (DoT)
Chiffre les requêtes DNS avec TLS sur le port 853.

```bash
# Configurer DoT sur Linux avec systemd-resolved
# /etc/systemd/resolved.conf

[Resolve]
DNS=1.1.1.1#cloudflare-dns.com 9.9.9.9#dns.quad9.net
DNSOverTLS=yes
DNSSEC=yes

# Appliquer
sudo systemctl restart systemd-resolved
```

### DNS over HTTPS (DoH)
Chiffre les requêtes DNS dans du HTTPS (port 443), impossible à distinguer du trafic web normal.

```bash
# Configurer DoH avec dnscrypt-proxy
sudo apt install dnscrypt-proxy

# /etc/dnscrypt-proxy/dnscrypt-proxy.toml
server_names = ['cloudflare', 'quad9-dnscrypt-ip4-filter-pri']
listen_addresses = ['127.0.0.1:53']

# Serveurs DoH/DoT de référence
# Cloudflare : 1.1.1.1
# Quad9 : 9.9.9.9 (filtrage malwares)
# NextDNS : personnalisable
```

## Pi-hole — Filtrage DNS réseau

Pi-hole est un serveur DNS local qui bloque les domaines malveillants et publicitaires pour tout le réseau.

### Installation
```bash
# Sur un Raspberry Pi ou serveur Linux
curl -sSL https://install.pi-hole.net | bash

# Configuration réseau
# Pointer le DNS de votre routeur vers l'IP du Pi-hole
# Tous les appareils du réseau bénéficient du filtrage
```

### Configuration de Pi-hole
```bash
# Ajouter des listes de blocage
# Interface web : Settings → Blocklists

# Listes recommandées :
# https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
# https://malware-filter.gitlab.io/malware-filter/phishing-filter-hosts.txt
# https://urlhaus.abuse.ch/downloads/hostfile/

# Whitelist si nécessaire
pihole -w domaine-legitime.com

# Statistiques
pihole -c   # Console
pihole -t   # Tail des logs en temps réel
```

### Intégrer la threat intelligence
```bash
# Bloquer automatiquement les nouveaux IoCs
# Script de mise à jour des listes depuis MISP/OpenCTI

#!/bin/bash
# Récupérer les domaines malveillants du jour
curl -s "https://urlhaus.abuse.ch/downloads/hostfile/" > /tmp/malware_domains.txt

# Ajouter à Pi-hole
pihole -b $(cat /tmp/malware_domains.txt | grep -v "#" | awk '{print $2}')
```

## NextDNS — DNS filtrant dans le cloud

Pour les organisations sans infrastructure propre, NextDNS offre un DNS filtrant managé.

### Fonctionnalités
- Blocage de malwares, phishing, trackers
- Personnalisation des politiques par profil
- Logs détaillés de toutes les requêtes
- DoH/DoT inclus
- Gratuit jusqu'à 300 000 requêtes/mois

```bash
# Configurer NextDNS sur Linux
curl -sS https://nextdns.io/install | sh
sudo nextdns install -profile VOTRE_PROFIL_ID -report-client-info
```

## DNSSEC — Intégrité du DNS

DNSSEC signe cryptographiquement les réponses DNS pour garantir leur authenticité.

```bash
# Vérifier si un domaine supporte DNSSEC
dig +dnssec example.com

# Configurer DNSSEC sur un resolver
# /etc/unbound/unbound.conf
server:
    auto-trust-anchor-file: "/var/lib/unbound/root.key"
    val-log-level: 2
```

## Détection du DNS tunneling

Le DNS tunneling exfiltre des données en encodant dans les requêtes DNS.

```bash
# Signes de DNS tunneling
# - Requêtes DNS très longues (> 50 caractères)
# - Nombreuses requêtes DNS TXT
# - Sous-domaines encodés en Base64

# Détection avec Zeek/Bro
# /usr/share/zeek/policy/protocols/dns/detect-external-names.zeek

# Règle Suricata
alert dns any any -> any 53 (
    msg:"Possible DNS tunneling - long query";
    dns.query; content:"."; 
    pcre:"/^[A-Za-z0-9+\/]{40,}\./";
    sid:9000001;
)

# Sinkholing avec Pi-hole
# Rediriger les domaines C2 connus vers une IP contrôlée
```

## Architecture DNS d'entreprise sécurisée

```
Postes clients
    │
[Pi-hole / DNS interne] ← filtrage, caching, logs
    │
[Resolver récursif sécurisé]
    │ DoT/DoH
[DNS publics sécurisés]
(Quad9, Cloudflare)
    │
[Root DNS]
```

### Avantages de cette architecture
- Filtrage malwares/phishing au niveau réseau
- Logs centralisés de toutes les requêtes DNS
- Chiffrement vers les serveurs publics
- DNSSEC pour l'intégrité

## Réponse aux incidents DNS

```bash
# Vérifier si un domaine est malveillant
# VirusTotal API
curl "https://www.virustotal.com/api/v3/domains/suspicious-domain.com" \
  -H "x-apikey: VOTRE_CLE"

# Threatfox (abuse.ch)
curl -X POST https://threatfox-api.abuse.ch/api/v1/ \
  -d '{"query": "search_ioc", "search_term": "suspicious-domain.com"}'

# Bloquer d'urgence sur Pi-hole
pihole -b suspicious-domain.com

# Dans Windows, forcer la résolution locale
# C:\Windows\System32\drivers\etc\hosts
0.0.0.0 suspicious-domain.com
```

## Conclusion

Le DNS est un pilier de la sécurité réseau souvent sous-estimé. Un Pi-hole sur le réseau interne, combiné à NextDNS pour les appareils nomades, offre une protection efficace contre les malwares et le phishing pour un coût quasi nul. C'est l'un des meilleurs retours sur investissement en cybersécurité.
