# VPN d'entreprise et accès distant sécurisé : guide complet

Avec la généralisation du télétravail, l'accès distant sécurisé est devenu critique. VPN traditionnels, Zero Trust Network Access, solutions modernes — voici comment sécuriser les accès distants de votre organisation.

## Les enjeux de l'accès distant

L'accès distant expose votre infrastructure à Internet. Les risques incluent :
- **Vol de credentials** : attaques par force brute sur les portails VPN
- **Exploitation de vulnérabilités** : CVE dans les solutions VPN (Pulse Secure, Fortinet, Citrix...)
- **Attaques Man-in-the-Middle** : interception du trafic non chiffré
- **Accès non autorisé** : credentials compromis sans MFA

**Statistique** : plus de 50% des intrusions en entreprise commencent par une compromission des accès distants.

## Les types de VPN

### VPN SSL/TLS (clientless)
Accès via navigateur web, sans client à installer. Idéal pour les partenaires externes.

- **Avantages** : pas de déploiement client, compatible tous OS
- **Inconvénients** : fonctionnalités limitées, moins performant

### VPN IPsec (site-à-site)
Connecte deux réseaux distants de façon permanente. Utilisé pour connecter des agences.

```
[Siège - 192.168.1.0/24] ←IPsec tunnel→ [Agence - 192.168.2.0/24]
```

### VPN SSL/TLS avec client (OpenVPN, WireGuard)
Solution la plus courante pour les collaborateurs nomades.

## OpenVPN — La référence open source

### Installation serveur
```bash
# Installation rapide avec le script officiel
curl -O https://raw.githubusercontent.com/angristan/openvpn-install/master/openvpn-install.sh
chmod +x openvpn-install.sh
sudo ./openvpn-install.sh
```

### Configuration sécurisée
```
# /etc/openvpn/server.conf

# Chiffrement fort
cipher AES-256-GCM
auth SHA512
tls-version-min 1.2

# Certificats
ca ca.crt
cert server.crt
key server.key
dh none  # ECDH
tls-auth ta.key 0

# Sécurité
user nobody
group nogroup
persist-key
persist-tun

# Réseau
server 10.8.0.0 255.255.255.0
push "redirect-gateway def1"
push "dhcp-option DNS 1.1.1.1"

# Logs
log-append /var/log/openvpn.log
verb 3
```

### Gestion des certificats
```bash
# Générer un CA et des certificats avec easy-rsa
apt install easy-rsa
make-cadir /etc/openvpn/easy-rsa
cd /etc/openvpn/easy-rsa

./easyrsa init-pki
./easyrsa build-ca
./easyrsa gen-req server nopass
./easyrsa sign-req server server

# Certificat client
./easyrsa gen-req utilisateur1 nopass
./easyrsa sign-req client utilisateur1

# Révoquer un certificat (départ employé)
./easyrsa revoke utilisateur1
./easyrsa gen-crl
```

## WireGuard — La solution moderne

WireGuard est plus rapide, plus simple et plus moderne qu'OpenVPN.

```bash
# Installation
sudo apt install wireguard

# Générer les clés
wg genkey | tee privatekey | wg pubkey > publickey

# Configuration serveur /etc/wireguard/wg0.conf
[Interface]
PrivateKey = [CLÉ PRIVÉE SERVEUR]
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = [CLÉ PUBLIQUE CLIENT]
AllowedIPs = 10.0.0.2/32

# Configuration client
[Interface]
PrivateKey = [CLÉ PRIVÉE CLIENT]
Address = 10.0.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = [CLÉ PUBLIQUE SERVEUR]
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25

# Démarrer
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0
```

## Zero Trust Network Access (ZTNA)

Le ZTNA est l'évolution du VPN traditionnel. Plutôt que d'accorder l'accès à tout le réseau, il accorde l'accès uniquement aux applications spécifiques dont l'utilisateur a besoin.

### Principes ZTNA
1. **Vérifier l'identité** : authentification forte (MFA obligatoire)
2. **Vérifier l'appareil** : état de santé du poste (MDM, antivirus, patchs)
3. **Accès minimal** : uniquement les applications nécessaires
4. **Contrôle continu** : réévaluation permanente du contexte

### Solutions ZTNA
- **Cloudflare Zero Trust** (gratuit jusqu'à 50 utilisateurs)
- **Tailscale** (basé WireGuard, très simple)
- **Palo Alto Prisma Access**
- **Zscaler Private Access**
- **Microsoft Entra Private Access**

### Tailscale — ZTNA simple et efficace
```bash
# Installation
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Partager l'accès à un serveur interne
# Sans ouvrir de ports sur le firewall !
```

## Bonnes pratiques

### MFA obligatoire
Aucun accès VPN sans authentification multifacteur. Les credentials seuls ne suffisent plus.

### Politique d'accès conditionnel
```
SI utilisateur = Alice
ET appareil = conforme (MDM, antivirus à jour)
ET heure = heures de bureau
ET pays = France
ALORS accès autorisé
SINON accès refusé + alerte
```

### Split tunneling vs Full tunneling
- **Full tunnel** : tout le trafic passe par le VPN → meilleure sécurité, plus lent
- **Split tunnel** : seul le trafic interne passe par le VPN → plus rapide, moins sécurisé

Pour les entreprises : préférer le **full tunnel** pour les postes sensibles.

### Monitoring des connexions VPN
```bash
# Logs OpenVPN
tail -f /var/log/openvpn.log

# Alertes à surveiller :
# - Connexions depuis des pays inhabituels
# - Connexions à des heures anormales
# - Volume de données anormal
# - Multiples tentatives d'authentification échouées
```

### Révocation des accès
Processus critique lors du départ d'un employé :
1. Révoquer immédiatement le certificat VPN
2. Désactiver le compte AD
3. Changer les mots de passe des comptes partagés
4. Révoquer les tokens MFA

## Conclusion

Le VPN reste la solution la plus répandue pour l'accès distant, mais le ZTNA représente l'avenir. Pour les PME, WireGuard offre le meilleur rapport simplicité/performance. Pour les grandes organisations, les solutions ZTNA comme Cloudflare Zero Trust ou Zscaler offrent une granularité et une sécurité supérieures. Dans tous les cas, le MFA est non négociable.
