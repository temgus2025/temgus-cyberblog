# Firewall et sécurité réseau : protection contre les attaques

Un firewall (pare-feu) est la première ligne de défense de votre réseau. Il filtre le trafic entrant et sortant selon des règles définies. Dans cet article, nous allons comprendre comment il fonctionne et comment bien configurer votre sécurité réseau.

## Qu'est-ce qu'un firewall ?

Un firewall est un système de sécurité qui **contrôle le trafic réseau** entre deux zones de confiance différente — typiquement entre votre réseau local (LAN) et Internet (WAN).

Il analyse chaque paquet de données et décide de l'**autoriser** ou de le **bloquer** selon un ensemble de règles prédéfinies.

> Un firewall bien configuré peut bloquer la majorité des attaques automatisées avant même qu'elles n'atteignent vos systèmes.

## Les types de firewalls

### 1. Firewall à filtrage de paquets (Packet Filtering)

Le type le plus basique. Il examine chaque paquet individuellement selon :
- L'adresse IP source et destination
- Le port source et destination
- Le protocole (TCP, UDP, ICMP)

```
Règle : BLOQUER tout trafic entrant sur le port 23 (Telnet)
Règle : AUTORISER le trafic entrant sur le port 443 (HTTPS)
Règle : AUTORISER le trafic sortant depuis 192.168.1.0/24
```

**Avantage** : rapide et peu gourmand en ressources.
**Inconvénient** : ne comprend pas le contexte des connexions.

### 2. Firewall à inspection d'état (Stateful Inspection)

Plus intelligent, il suit l'**état des connexions** actives. Il sait si un paquet entrant est une réponse légitime à une requête sortante.

```
Client → Serveur : SYN (connexion initiée)
Serveur → Client : SYN-ACK (réponse autorisée car connexion connue)
Client → Serveur : ACK (connexion établie)
```

### 3. Firewall applicatif (WAF)

Fonctionne au niveau de la **couche application** (couche 7 du modèle OSI). Il comprend les protocoles comme HTTP, FTP, DNS et peut détecter des attaques spécifiques comme les injections SQL ou les attaques XSS.

### 4. Next-Generation Firewall (NGFW)

Combine toutes les fonctionnalités précédentes avec :
- Inspection approfondie des paquets (DPI)
- Détection d'intrusion (IDS/IPS)
- Contrôle des applications
- Filtrage par réputation d'IP

## Les zones de sécurité réseau

Une bonne architecture réseau divise l'infrastructure en **zones de confiance** :

```
Internet (non fiable)
      |
   [Firewall]
      |
   DMZ (zone démilitarisée)
   ├── Serveur web
   ├── Serveur mail
   └── Serveur DNS
      |
   [Firewall interne]
      |
   LAN (réseau interne)
   ├── Postes de travail
   ├── Serveurs internes
   └── Imprimantes
```

### La DMZ (Zone Démilitarisée)

La DMZ est une zone intermédiaire entre Internet et votre réseau interne. Les serveurs accessibles depuis Internet (web, mail) sont placés en DMZ. Ainsi, même si un serveur est compromis, l'attaquant ne peut pas accéder directement au réseau interne.

## Règles de firewall : les bonnes pratiques

### Principe du moindre privilège

**Bloquez tout par défaut, n'autorisez que ce qui est nécessaire.**

```bash
# Exemple de règles iptables Linux (ordre important !)

# 1. Politique par défaut : tout bloquer
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# 2. Autoriser les connexions établies
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# 3. Autoriser SSH depuis un IP spécifique uniquement
iptables -A INPUT -p tcp --dport 22 -s 192.168.1.100 -j ACCEPT

# 4. Autoriser HTTP et HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 5. Autoriser le loopback
iptables -A INPUT -i lo -j ACCEPT
```

### Les erreurs courantes à éviter

- **Règle "autoriser tout"** en bas de liste sans jamais bloquer
- **SSH ouvert sur tout Internet** sans restriction d'IP
- **Pas de logs** — vous ne saurez jamais ce qui a été bloqué
- **Règles trop permissives** pour "simplifier" la configuration

## Détection et prévention d'intrusion (IDS/IPS)

Un **IDS (Intrusion Detection System)** surveille le trafic et **alerte** en cas d'activité suspecte.

Un **IPS (Intrusion Prevention System)** va plus loin : il **bloque automatiquement** les attaques détectées.

### Outils populaires

| Outil | Type | Usage |
|-------|------|-------|
| Snort | IDS/IPS | Détection en temps réel |
| Suricata | IDS/IPS | Haute performance |
| pfSense | Firewall | Open source complet |
| fail2ban | IPS | Bloque les brute force |

### Exemple avec fail2ban

```bash
# fail2ban surveille les logs et bloque les IPs malveillantes
# Configuration /etc/fail2ban/jail.conf

[ssh]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3        # 3 tentatives échouées
bantime  = 3600     # Bannissement 1 heure
```

## Les attaques que le firewall ne peut pas bloquer

Un firewall n'est pas une solution miracle. Il ne protège pas contre :

- **Le phishing** — l'utilisateur initie la connexion lui-même
- **Les malwares dans les pièces jointes** — trafic légitime (email)
- **Les attaques internes** — un employé malveillant sur le LAN
- **Les tunnels chiffrés** — HTTPS peut cacher du contenu malveillant

C'est pourquoi un firewall doit toujours faire partie d'une **stratégie de défense en profondeur** combinant antivirus, formation des utilisateurs, et mises à jour régulières.

## Tester votre firewall

```bash
# Scanner les ports ouverts depuis l'extérieur avec nmap
nmap -sV -p 1-65535 VOTRE_IP_PUBLIQUE

# Vérifier les règles actives sur Linux
iptables -L -n -v

# Tester la connectivité sur un port spécifique
nc -zv 192.168.1.1 443
```

## Conclusion

Un firewall bien configuré est indispensable mais insuffisant seul. Retenez ces principes fondamentaux :

1. **Bloquez tout par défaut**, n'autorisez que le nécessaire
2. **Segmentez votre réseau** en zones de confiance
3. **Analysez vos logs** régulièrement
4. **Testez vos règles** périodiquement
5. **Combinez** firewall, IDS/IPS et autres outils de sécurité

---
*Prochain article : [Malwares et virus : comprendre les menaces](../articles/malwares-virus)*
