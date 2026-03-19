# Nmap : maîtriser le scanner réseau incontournable

Nmap (Network Mapper) est le scanner réseau le plus utilisé au monde. Créé en 1997 par Gordon Lyon (Fyodor), il est l'outil de référence pour la reconnaissance réseau, la découverte de services et l'audit de sécurité. Ce guide couvre tout ce dont vous avez besoin.

## Pourquoi Nmap ?

- **Gratuit et open source** : disponible sur toutes les plateformes
- **Puissant** : découverte d'hôtes, scan de ports, détection de services, OS fingerprinting
- **Scriptable** : le Nmap Scripting Engine (NSE) offre des centaines de scripts
- **Standard** : tout pentesteur doit le maîtriser

## Installation

```bash
# Linux (Debian/Ubuntu)
sudo apt install nmap

# macOS
brew install nmap

# Windows
# Télécharger l'installeur sur nmap.org
```

## Les bases

### Syntaxe générale
```bash
nmap [options] [cible]
```

La **cible** peut être :
- Une IP : `192.168.1.1`
- Un range : `192.168.1.1-254`
- Un réseau CIDR : `192.168.1.0/24`
- Un nom de domaine : `example.com`
- Un fichier : `-iL liste.txt`

### Scans de base

```bash
# Scan simple (1000 ports les plus courants)
nmap 192.168.1.1

# Scan de tous les ports (1-65535)
nmap -p- 192.168.1.1

# Scan de ports spécifiques
nmap -p 22,80,443,8080 192.168.1.1

# Scan d'un réseau entier
nmap 192.168.1.0/24
```

## Types de scans

### SYN Scan (stealth) — recommandé
```bash
sudo nmap -sS 192.168.1.1
```
Le plus courant. Envoie un paquet SYN, attend SYN-ACK (port ouvert) ou RST (fermé). Ne complète pas le handshake TCP → plus discret, plus rapide.

### TCP Connect Scan
```bash
nmap -sT 192.168.1.1
```
Complète le handshake TCP. Utilisé quand vous n'avez pas les droits root. Plus lent et plus visible.

### UDP Scan
```bash
sudo nmap -sU 192.168.1.1
```
Scanne les ports UDP (DNS:53, SNMP:161, DHCP:67...). Lent mais essentiel — beaucoup de services UDP sont négligés.

### Scan ping (découverte d'hôtes)
```bash
nmap -sn 192.168.1.0/24
```
Découverte d'hôtes actifs sans scan de ports. Rapide pour cartographier un réseau.

## Détection de services et de versions

```bash
# Détection des versions de services
nmap -sV 192.168.1.1

# Détection agressive (OS + versions + scripts + traceroute)
nmap -A 192.168.1.1

# Exemple de sortie
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu
80/tcp open  http    Apache httpd 2.4.41
443/tcp open ssl/http nginx 1.18.0
```

## Détection du système d'exploitation

```bash
sudo nmap -O 192.168.1.1

# Sortie exemple
OS details: Linux 4.15 - 5.6
```

## Le Nmap Scripting Engine (NSE)

NSE permet d'exécuter des scripts Lua pour des tâches avancées. Plus de 600 scripts disponibles.

### Catégories de scripts
- **auth** : tests d'authentification
- **vuln** : détection de vulnérabilités
- **exploit** : exploitation (utiliser avec précaution)
- **brute** : attaques par force brute
- **discovery** : énumération

### Exemples d'utilisation

```bash
# Scripts par défaut
nmap -sC 192.168.1.1

# Script spécifique
nmap --script http-title 192.168.1.1

# Détecter les vulnérabilités SMB (EternalBlue)
nmap --script smb-vuln-ms17-010 192.168.1.1

# Scan de vulnérabilités complet
nmap --script vuln 192.168.1.1

# Énumération HTTP
nmap --script http-enum 192.168.1.1

# Brute force SSH
nmap --script ssh-brute 192.168.1.1

# Détection Heartbleed
nmap --script ssl-heartbleed -p 443 192.168.1.1
```

## Optimisation des performances

```bash
# Timing templates (T0=le plus lent, T5=le plus rapide)
nmap -T4 192.168.1.1    # Recommandé pour pentest
nmap -T5 192.168.1.1    # Très agressif, peut saturer le réseau

# Parallélisme
nmap --min-parallelism 100 192.168.1.0/24

# Scan rapide (top 100 ports)
nmap -F 192.168.1.1
```

## Gestion des sorties

```bash
# Sortie normale dans un fichier
nmap -oN resultat.txt 192.168.1.1

# Sortie XML (pour import dans d'autres outils)
nmap -oX resultat.xml 192.168.1.1

# Sortie grepable
nmap -oG resultat.gnmap 192.168.1.1

# Toutes les sorties simultanément
nmap -oA resultat 192.168.1.1
# Crée: resultat.nmap, resultat.xml, resultat.gnmap
```

## Évasion et discrétion

```bash
# Fragmenter les paquets (contourner certains firewalls)
nmap -f 192.168.1.1

# Spoofing d'adresse source (leurres)
nmap -D RND:10 192.168.1.1

# Ralentir le scan pour éviter la détection
nmap -T1 --scan-delay 5s 192.168.1.1

# Spécifier le port source
nmap --source-port 53 192.168.1.1
```

## Commandes complètes pour le pentest

```bash
# Reconnaissance initiale rapide
nmap -sn 192.168.1.0/24 -oG hosts.txt

# Scan complet d'une cible
sudo nmap -sS -sV -sC -O -p- -T4 192.168.1.1 -oA scan_complet

# Scan web ciblé
nmap -sV -p 80,443,8080,8443 --script http-title,http-headers 192.168.1.1

# Recherche de vulnérabilités SMB
sudo nmap -p 445 --script smb-vuln* 192.168.1.0/24
```

## Cadre légal

⚠️ **Important** : scanner un réseau sans autorisation est **illégal** dans la plupart des pays, y compris en France (article 323-1 du Code pénal). N'utilisez Nmap que sur :
- Votre propre réseau/infrastructure
- Des cibles pour lesquelles vous avez une autorisation écrite
- Des labs dédiés (HackTheBox, TryHackMe, VulnHub)

## Conclusion

Nmap est l'outil de reconnaissance réseau par excellence. Maîtriser ses options de base et ses scripts NSE vous donnera une vue complète de n'importe quelle infrastructure. Combinez-le avec d'autres outils comme Masscan (pour la vitesse) ou Metasploit (pour l'exploitation) pour un workflow de pentest efficace.
