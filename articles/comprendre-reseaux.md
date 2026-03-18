# Comprendre les réseaux : comment les ordinateurs communiquent

Internet est partout, mais comment fonctionne-t-il vraiment ? Dans cet article, nous allons décortiquer les mécanismes fondamentaux qui permettent à des milliards d'appareils de communiquer entre eux.

## Le modèle OSI : les 7 couches réseau

Le modèle OSI (Open Systems Interconnection) est une référence conceptuelle qui décompose les communications réseau en **7 couches distinctes** :

| Couche | Nom | Rôle |
|--------|-----|------|
| 7 | Application | Interface avec l'utilisateur (HTTP, FTP) |
| 6 | Présentation | Chiffrement, encodage |
| 5 | Session | Gestion des sessions |
| 4 | Transport | TCP/UDP, ports |
| 3 | Réseau | Adressage IP, routage |
| 2 | Liaison | MAC, switches |
| 1 | Physique | Câbles, ondes radio |

> En pratique, on utilise surtout le modèle TCP/IP qui simplifie ces 7 couches en 4.

## TCP/IP : le protocole fondamental

### TCP vs UDP

**TCP (Transmission Control Protocol)** garantit la livraison des données :
- Établit une connexion (handshake à 3 voies)
- Vérifie que chaque paquet est reçu
- Réordonne les paquets dans le bon ordre
- Utilisé pour : HTTP, email, transferts de fichiers

**UDP (User Datagram Protocol)** privilégie la vitesse :
- Pas de vérification de livraison
- Plus rapide, moins fiable
- Utilisé pour : streaming, jeux vidéo, DNS

### Le handshake TCP en 3 étapes

```
Client          Serveur
  |                |
  |--- SYN ------->|   "Je veux me connecter"
  |<-- SYN-ACK ----|   "OK, je suis prêt"
  |--- ACK ------->|   "Parfait, on commence"
  |                |
  [Connexion établie]
```

## Les adresses IP

Chaque appareil sur un réseau possède une **adresse IP** unique, comme une adresse postale numérique.

### IPv4

```
192.168.1.100
```

Format : 4 nombres de 0 à 255 séparés par des points. Cela donne environ **4,3 milliards** d'adresses possibles — insuffisant pour l'Internet moderne.

### IPv6

```
2001:0db8:85a3:0000:0000:8a2e:0370:7334
```

Format hexadécimal sur 128 bits. Permet **340 undécillions** d'adresses. La transition IPv4 → IPv6 est en cours.

### Adresses privées vs publiques

Les adresses **privées** (non routables sur Internet) :
- `192.168.x.x` — réseaux domestiques
- `10.x.x.x` — réseaux d'entreprise
- `172.16.x.x` à `172.31.x.x`

Votre box internet fait la traduction entre votre IP privée et l'IP publique via le **NAT (Network Address Translation)**.

## Le DNS : l'annuaire d'Internet

Personne ne retient des adresses IP. Le DNS (Domain Name System) traduit les noms de domaine en adresses IP.

```bash
# Comment fonctionne une requête DNS
vous tapez → google.com
    ↓
DNS résolveur → cache local ?
    ↓ non
DNS résolveur → serveur racine (.)
    ↓
Serveur racine → serveur TLD (.com)
    ↓
Serveur TLD → serveur autoritaire google.com
    ↓
Réponse → 142.250.185.78
```

### Commandes utiles

```bash
# Résoudre un nom de domaine (Windows/Linux/Mac)
nslookup google.com

# Tracer la route des paquets
tracert google.com      # Windows
traceroute google.com   # Linux/Mac

# Voir ses interfaces réseau
ipconfig                # Windows
ifconfig / ip addr      # Linux/Mac
```

## Les ports réseau

Un port est comme une **porte numérotée** sur votre ordinateur. Chaque service écoute sur un port spécifique.

| Port | Service | Protocole |
|------|---------|-----------|
| 80 | HTTP | TCP |
| 443 | HTTPS | TCP |
| 22 | SSH | TCP |
| 21 | FTP | TCP |
| 53 | DNS | UDP/TCP |
| 3306 | MySQL | TCP |

> **Ports 0-1023** : ports système réservés  
> **Ports 1024-49151** : ports enregistrés  
> **Ports 49152-65535** : ports dynamiques

## Conclusion

Comprendre les réseaux vous permet de mieux sécuriser vos systèmes et de diagnostiquer les problèmes. Dans les prochains articles, nous verrons comment les attaquants exploitent ces protocoles et comment s'en protéger.