# Architecture réseau sécurisée : concevoir une infrastructure robuste

Une architecture réseau bien conçue est la première ligne de défense contre les cyberattaques. La segmentation, le filtrage et la surveillance du trafic limitent considérablement l'impact d'une compromission. Voici comment concevoir une infrastructure sécurisée.

## Les principes fondamentaux

### Défense en profondeur
Ne jamais compter sur un seul mécanisme de sécurité. Multiplier les couches : firewall périmétrique, segmentation interne, endpoint protection, surveillance.

### Principe du moindre privilège réseau
Chaque segment réseau n'accède qu'aux ressources dont il a strictement besoin. Un serveur web n'a pas besoin d'accéder à la base de données RH.

### Zero Trust
"Ne jamais faire confiance, toujours vérifier." Même à l'intérieur du réseau, chaque connexion doit être authentifiée et autorisée.

## La segmentation réseau

### VLANs — Virtual Local Area Networks

Les VLANs permettent de segmenter logiquement le réseau physique.

```
Réseau physique unique
    ├── VLAN 10 : Postes utilisateurs (192.168.10.0/24)
    ├── VLAN 20 : Serveurs internes (192.168.20.0/24)
    ├── VLAN 30 : DMZ - Serveurs web publics (192.168.30.0/24)
    ├── VLAN 40 : Imprimantes/IoT (192.168.40.0/24)
    ├── VLAN 50 : WiFi invités (192.168.50.0/24)
    └── VLAN 99 : Management réseau (192.168.99.0/24)
```

**Configuration switch Cisco :**
```
! Créer les VLANs
vlan 10
 name Utilisateurs
vlan 20
 name Serveurs
vlan 30
 name DMZ

! Configurer un port en access
interface FastEthernet0/1
 switchport mode access
 switchport access vlan 10

! Configurer un trunk (entre switch et routeur)
interface GigabitEthernet0/1
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,99
```

### La DMZ (Zone DéMilitarisée)

La DMZ héberge les serveurs accessibles depuis Internet, isolés du réseau interne.

```
Internet
    │
[Firewall externe]
    │
[DMZ]
├── Serveur web
├── Serveur mail
└── Reverse proxy
    │
[Firewall interne]
    │
[Réseau interne]
├── Serveurs applicatifs
├── Base de données
└── Active Directory
```

**Règles firewall pour la DMZ :**
```
Internet → DMZ : autoriser 80, 443 vers serveurs web
DMZ → Internet : autoriser réponses (stateful)
DMZ → Interne : interdire par défaut sauf ports spécifiques
Interne → DMZ : autoriser selon besoins
Internet → Interne : interdire tout
```

## Firewalls et filtrage

### pfSense — Firewall open source

pfSense est un excellent firewall open source basé sur FreeBSD.

```
# Règles de filtrage typiques pfSense

# LAN vers WAN - autoriser tout (NAT)
Source: LAN net    Dest: any     Action: Allow

# WAN vers DMZ - HTTP/HTTPS uniquement
Source: any        Dest: DMZ_HTTP_Server   Port: 80,443   Action: Allow

# DMZ vers LAN - interdire
Source: DMZ net    Dest: LAN net   Action: Block

# DMZ vers serveur DB interne - autoriser MySQL
Source: DMZ_AppServer   Dest: LAN_DB_Server   Port: 3306   Action: Allow
```

### Inspection de paquets (DPI)

Le Deep Packet Inspection analyse le contenu des paquets, pas seulement les headers :

- **Détection d'intrusion** : identifier les signatures d'attaque
- **Filtrage applicatif** : contrôler l'usage des applications (Teams, Netflix...)
- **SSL Inspection** : déchiffrer et inspecter le trafic HTTPS (attention au RGPD)

### Next-Generation Firewall (NGFW)

Les NGFW ajoutent aux firewalls classiques :
- Inspection applicative (couche 7)
- Prévention d'intrusion (IPS)
- Filtrage URL et catégories
- Contrôle des identités (intégration AD)
- Threat intelligence en temps réel

**Solutions populaires :** Palo Alto, Fortinet FortiGate, Cisco Firepower, pfSense + Snort

## Systèmes de détection et prévention d'intrusion

### IDS vs IPS
- **IDS** (Intrusion Detection System) : détecte et alerte
- **IPS** (Intrusion Prevention System) : détecte et bloque automatiquement

### Suricata — IDS/IPS open source

```yaml
# Installation
sudo apt install suricata

# Configuration suricata.yaml
af-packet:
  - interface: eth0

# Activer les règles
rule-files:
  - suricata.rules
  - /etc/suricata/rules/*.rules

# Exemple de règle Suricata
alert tcp $EXTERNAL_NET any -> $HOME_NET 22 (
  msg:"SSH Brute Force Attempt";
  flow:to_server;
  threshold:type both, track by_src, count 5, seconds 60;
  classtype:attempted-dos;
  sid:2001219;
)
```

## Monitoring réseau

### NetFlow / IPFIX

Collecte les métadonnées des flux réseau (pas le contenu) :
- Qui communique avec qui
- Volumes de données échangées
- Durée des connexions
- Ports utilisés

```bash
# Collecter les flows avec nfdump
nfcapd -w -l /var/log/netflow -p 9995

# Analyser
nfdump -r /var/log/netflow/nfcapd.202507010000 \
  -s record/bytes \
  -n 20 \
  'bytes > 1000000'
```

### Honeypots réseau

Des leurres qui attirent et détectent les attaquants.

```python
# Honeypot simple avec Python
import socket

def honeypot(port):
    s = socket.socket()
    s.bind(('0.0.0.0', port))
    s.listen(5)
    print(f"Honeypot actif sur port {port}")
    while True:
        conn, addr = s.accept()
        print(f"ALERTE: Connexion depuis {addr[0]} sur port {port}")
        conn.close()

# Écouter sur des ports inhabituels
honeypot(23)   # Telnet
honeypot(3389) # RDP
```

## Architecture pour PME — Exemple pratique

```
Internet
    │
[Modem/Box FAI]
    │
[pfSense Firewall]
    │
[Switch L3 manageable]
    ├── VLAN 10 (192.168.10.0/24) : Postes Windows
    ├── VLAN 20 (192.168.20.0/24) : Serveurs
    │       ├── DC01 (Active Directory)
    │       ├── FS01 (Fichiers)
    │       └── BACKUP01 (Sauvegardes)
    ├── VLAN 30 (192.168.30.0/24) : DMZ
    │       └── WEB01 (Site web)
    ├── VLAN 40 (192.168.40.0/24) : WiFi employés
    ├── VLAN 50 (192.168.50.0/24) : WiFi invités
    └── VLAN 99 (192.168.99.0/24) : Management
```

**Budget indicatif :**
- pfSense sur mini-PC : 200-400€
- Switch manageable : 300-800€
- **Total infrastructure réseau sécurisée PME : ~1 000€**

## Conclusion

Une architecture réseau sécurisée n'est pas réservée aux grandes entreprises. Avec pfSense, un switch manageable et une bonne segmentation, une PME peut atteindre un niveau de sécurité réseau très correct. L'investissement initial est rentabilisé dès le premier incident évité.
