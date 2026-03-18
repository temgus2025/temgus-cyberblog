# Attaques DDoS : comment ça fonctionne et comment s'en protéger

Les attaques DDoS (Distributed Denial of Service) paralysent des sites web, des entreprises entières et même des infrastructures nationales. En 2024, une attaque DDoS record a atteint **3,8 Tbps**. Comprendre ces attaques est essentiel pour s'en défendre.

## Qu'est-ce qu'une attaque DDoS ?

Une attaque DoS (Denial of Service) consiste à **saturer un serveur** de requêtes jusqu'à ce qu'il ne puisse plus répondre aux utilisateurs légitimes.

Une attaque **DDoS** (Distributed) utilise des **milliers de machines compromises** (un botnet) pour amplifier l'attaque.

```
Attaquant
    |
    |── Commande le botnet
    |
    ├── PC zombie 1 ──┐
    ├── PC zombie 2 ──┤
    ├── PC zombie 3 ──┼──→ SERVEUR CIBLE (saturé)
    ├── Caméra IoT ───┤
    ├── Routeur piraté┤
    └── ... x100 000 ─┘
```

> Le botnet **Mirai** (2016) a compromis des caméras et routeurs mal sécurisés pour lancer des attaques dépassant **1 Tbps**, mettant hors ligne Twitter, Netflix et Amazon simultanément.

## Les types d'attaques DDoS

### 1. Attaques volumétriques

Objectif : **saturer la bande passante** en envoyant un volume massif de données.

**UDP Flood :**
```
Attaquant → Envoie des millions de paquets UDP → Serveur
Le serveur tente de répondre à chaque paquet → Épuisement
```

**Amplification DNS :**
```
Attaquant (IP usurpée = cible)
    ↓
Envoie petite requête DNS (60 bytes)
    ↓
Serveur DNS répond à la CIBLE avec grande réponse (3000 bytes)
    ↓
Facteur d'amplification : x50 !
```

### 2. Attaques protocolaires

Exploitent les **failles des protocoles réseau** pour épuiser les ressources serveur.

**SYN Flood :**
```
Normal (TCP Handshake) :
Client → SYN → Serveur
Client ← SYN-ACK ← Serveur
Client → ACK → Serveur ✓ Connexion établie

SYN Flood :
Attaquant → SYN (IP falsifiée) → Serveur
Serveur ← SYN-ACK → IP fantôme (pas de réponse)
Serveur attend... attend... (ressources bloquées)
× 1 000 000 = Serveur épuisé
```

### 3. Attaques applicatives (Layer 7)

Les plus difficiles à détecter car elles imitent le **trafic légitime**.

**HTTP Flood :**
```bash
# Exemple simplifié de ce que fait une attaque HTTP Flood
# Des milliers de requêtes légitimes en apparence

GET /recherche?q=produit HTTP/1.1
Host: cible.com
# × 500 000 requêtes/seconde depuis des IPs différentes
```

**Slowloris :**
```python
# Slowloris ouvre des milliers de connexions HTTP
# et les maintient ouvertes indéfiniment avec des requêtes incomplètes
# Le serveur garde les connexions ouvertes en attendant la fin...
# Jusqu'à épuisement du nombre maximum de connexions

import socket
sockets = []
for i in range(200):
    s = socket.socket()
    s.connect(("cible.com", 80))
    s.send(b"GET / HTTP/1.1\r\nHost: cible.com\r\n")
    # On n'envoie jamais le \r\n final → connexion suspendue
    sockets.append(s)
```

## Les outils de détection

```bash
# Surveiller les connexions actives sur Linux
netstat -an | grep SYN_RECV | wc -l
# Un nombre élevé indique un SYN Flood en cours

# Voir les IPs qui font le plus de requêtes
netstat -ntu | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20

# Analyser le trafic en temps réel
tcpdump -i eth0 -n 'tcp[tcpflags] & tcp-syn != 0'

# Statistiques réseau en temps réel
iftop -i eth0
```

## Les solutions de protection

### 1. Limitation de débit (Rate Limiting)

```nginx
# Configuration Nginx - Limiter les requêtes
http {
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

    server {
        location / {
            limit_req zone=mylimit burst=20 nodelay;
            # Max 10 requêtes/seconde par IP, burst de 20
        }
    }
}
```

### 2. Protection SYN Flood avec SYN Cookies

```bash
# Activer les SYN cookies sur Linux
echo 1 > /proc/sys/net/ipv4/tcp_syncookies

# Rendre permanent dans /etc/sysctl.conf
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
```

### 3. Blocage avec iptables

```bash
# Limiter les nouvelles connexions TCP par IP
iptables -A INPUT -p tcp --syn -m limit --limit 1/s --limit-burst 3 -j ACCEPT
iptables -A INPUT -p tcp --syn -j DROP

# Bloquer les scans de ports
iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL ALL -j DROP

# Bloquer une IP spécifique
iptables -A INPUT -s 192.168.1.100 -j DROP
```

### 4. CDN et services anti-DDoS

Pour les sites en production, utilisez des services spécialisés :

| Service | Protection | Prix |
|---------|-----------|------|
| Cloudflare | Jusqu'à 100+ Tbps | Gratuit → Pro |
| AWS Shield | Standard inclus | Gratuit / Advanced payant |
| OVH Anti-DDoS | Inclus avec serveurs | Inclus |
| Akamai | Entreprise | Sur devis |

**Cloudflare** est la solution la plus accessible :
```
DNS pointe vers Cloudflare
→ Cloudflare filtre le trafic
→ Seul le trafic légitime atteint votre serveur
→ Votre IP réelle reste cachée
```

### 5. Architecture résiliente

```
              [CDN / Anycast]
                     |
           [Load Balancer]
          /       |        \
    [Serveur 1] [Serveur 2] [Serveur 3]
          \       |        /
           [Base de données]
```

- **Anycast** : le trafic est absorbé par plusieurs data centers mondiaux
- **Load Balancer** : répartit la charge sur plusieurs serveurs
- **Auto-scaling** : ajoute automatiquement des serveurs sous charge

## Plan de réponse à une attaque DDoS

```
1. DÉTECTION
   Alertes monitoring → Identifier le type d'attaque
         ↓
2. ISOLATION
   Bloquer les IPs sources identifiées
   Activer le mode "Under Attack" Cloudflare
         ↓
3. MITIGATION
   Activer le scrubbing center
   Augmenter les ressources (auto-scaling)
         ↓
4. COMMUNICATION
   Informer les utilisateurs et parties prenantes
         ↓
5. POST-MORTEM
   Analyser les logs, améliorer les défenses
```

## Conclusion

Les attaques DDoS sont inévitables pour tout service en ligne à succès. La meilleure protection combine **CDN avec anti-DDoS intégré** (Cloudflare), **rate limiting** au niveau applicatif, et une **architecture distribuée** capable d'absorber les pics. Pour un blog comme le vôtre, Cloudflare gratuit suffit largement.

---
*Article suivant : [Sécurité WiFi : WPA2, WPA3 et attaques](../articles/securite-wifi)*
