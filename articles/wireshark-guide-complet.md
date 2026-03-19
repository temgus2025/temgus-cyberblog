# Wireshark : analyser le trafic réseau comme un expert

Wireshark est l'analyseur de paquets réseau le plus utilisé au monde. Indispensable pour comprendre les protocoles réseau, diagnostiquer des problèmes et analyser des attaques. Ce guide vous emmène de l'installation à l'analyse avancée.

## Qu'est-ce que Wireshark ?

Wireshark est un **sniffer réseau** open source qui capture et analyse le trafic réseau en temps réel. Il décode plus de 3 000 protocoles et affiche les paquets de façon lisible et structurée.

**Cas d'usage :**
- Analyse de protocoles réseau
- Diagnostic de problèmes réseau
- Détection d'attaques (ARP spoofing, scans, exfiltration)
- Analyse forensique de captures réseau
- Apprentissage des protocoles

## Installation

```bash
# Linux (Debian/Ubuntu)
sudo apt install wireshark
sudo usermod -aG wireshark $USER
# Déconnectez-vous et reconnectez-vous

# macOS
brew install --cask wireshark

# Windows
# Télécharger sur wireshark.org
```

## Interface et navigation

### Les trois panneaux principaux

**1. Liste des paquets** (haut)
Affiche tous les paquets capturés avec : numéro, timestamp, source, destination, protocole, longueur, info.

**2. Détail du paquet** (milieu)
Décompose le paquet par couche : Ethernet → IP → TCP → HTTP. Cliquez sur chaque couche pour voir les champs détaillés.

**3. Vue hexadécimale** (bas)
Affiche les données brutes en hexadécimal et ASCII.

## Capturer du trafic

### Démarrer une capture
1. Sélectionnez l'interface réseau (eth0, wlan0, lo...)
2. Cliquez sur l'icône requine bleue ou double-cliquez l'interface
3. Pour arrêter : carré rouge

### Capture en ligne de commande avec tshark
```bash
# Capturer sur eth0
tshark -i eth0

# Capturer et sauvegarder
tshark -i eth0 -w capture.pcap

# Capturer uniquement HTTP
tshark -i eth0 -f "port 80"

# Lire un fichier pcap
tshark -r capture.pcap
```

## Les filtres — La clé de Wireshark

### Filtres de capture (BPF)
Appliqués avant la capture, réduisent les données collectées.

```bash
# Filtrer par protocole
tcp
udp
icmp
arp

# Filtrer par port
port 80
port 443
port 22

# Filtrer par IP
host 192.168.1.1
src host 192.168.1.1
dst host 192.168.1.1

# Combinaisons
tcp and port 80
host 192.168.1.1 and not port 22
```

### Filtres d'affichage
Appliqués après la capture sur les paquets déjà collectés. Plus puissants.

```
# Protocoles
http
dns
ssh
ftp
smtp

# IP source/destination
ip.src == 192.168.1.1
ip.dst == 10.0.0.1
ip.addr == 192.168.1.0/24

# Ports
tcp.port == 80
tcp.dstport == 443

# Drapeaux TCP
tcp.flags.syn == 1
tcp.flags.rst == 1
tcp.flags.syn == 1 and tcp.flags.ack == 0

# Contenu
http.request.method == "POST"
http contains "password"
dns.qry.name contains "malware"

# Combinaisons
ip.src == 192.168.1.1 and tcp.dstport == 80
http.request.method == "POST" and http.host contains "bank"
```

## Analyser des attaques courantes

### Détecter un scan de ports Nmap
```
# SYN scan : beaucoup de SYN sans ACK
tcp.flags.syn == 1 and tcp.flags.ack == 0

# Scan rapide : même source vers de nombreux ports
ip.src == [IP_SUSPECTE]
```

### Détecter un ARP spoofing
```
# Plusieurs réponses ARP pour la même IP
arp.opcode == 2

# Chercher des duplicates d'IP MAC
Statistics → Endpoints → Ethernet (chercher les anomalies)
```

### Analyser du trafic HTTP suspect
```
# Requêtes POST (exfiltration potentielle)
http.request.method == "POST"

# User-agents inhabituels
http.user_agent contains "curl"
http.user_agent contains "python"

# Grandes réponses (exfiltration de données)
http.content_length > 100000
```

### Détecter du DNS tunneling
```
# Requêtes DNS longues et nombreuses
dns and dns.qry.name.len > 50

# Réponses DNS volumineuses
dns.resp.len > 200
```

## Fonctionnalités avancées

### Suivre un flux (Follow Stream)
Clic droit sur un paquet → Follow → TCP/HTTP/TLS Stream. Reconstitue la conversation complète, lisible en clair.

### Statistiques utiles
- **Statistics → Protocol Hierarchy** : répartition du trafic par protocole
- **Statistics → Conversations** : tous les flux entre hôtes
- **Statistics → Endpoints** : tous les hôtes avec volumes
- **Statistics → IO Graph** : graphique du débit dans le temps

### Déchiffrer TLS/HTTPS
Si vous avez la clé privée du serveur ou les secrets de session :

```
Edit → Preferences → Protocols → TLS
→ RSA keys list : ajouter IP, port, protocole, fichier de clé
```

Pour capturer les secrets de session avec Firefox/Chrome :
```bash
# Linux/Mac
export SSLKEYLOGFILE=~/ssl_keys.log
firefox &

# Dans Wireshark : Edit → Preferences → TLS → (Pre)-Master-Secret log
```

## Wireshark pour le CTF et le forensic

### Analyser un fichier pcap de CTF
```
1. Statistics → Protocol Hierarchy (vue d'ensemble)
2. Statistics → Conversations (identifier les flux intéressants)
3. Follow TCP/HTTP Stream sur les flux suspects
4. File → Export Objects → HTTP (extraire les fichiers transférés)
5. Chercher des chaînes : Edit → Find Packet → String
```

### Extraire des fichiers d'une capture
```
File → Export Objects → HTTP/SMB/FTP
```

## Conclusion

Wireshark est un outil fondamental que tout professionnel réseau et sécurité doit maîtriser. Les filtres d'affichage sont la compétence clé — investissez du temps à les apprendre. Pratiquez sur des captures CTF disponibles sur PacketLife.net et Malware-Traffic-Analysis.net pour vous exercer sur du trafic réel.
