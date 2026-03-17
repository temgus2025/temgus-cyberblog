# VPN & anonymat en ligne : guide complet

Un VPN (Virtual Private Network) est devenu un outil incontournable pour protéger sa vie privée en ligne. Mais que fait-il vraiment ? Quelles sont ses limites ? Et quand l'utiliser ? Ce guide répond à toutes ces questions.

## Qu'est-ce qu'un VPN ?

Un VPN crée un **tunnel chiffré** entre votre appareil et un serveur VPN. Tout votre trafic internet passe par ce tunnel, ce qui a deux effets :

1. Votre fournisseur d'accès (FAI) ne voit plus ce que vous faites
2. Les sites que vous visitez voient l'IP du serveur VPN, pas la vôtre

```
SANS VPN :
Vous → [FAI voit tout] → Internet → Site web (voit votre IP)

AVEC VPN :
Vous → [Tunnel chiffré] → Serveur VPN → [Internet] → Site web
           FAI ne voit                              (voit l'IP du VPN)
           que du trafic chiffré
```

## Comment fonctionne un VPN techniquement ?

### Les protocoles VPN

| Protocole | Vitesse | Sécurité | Usage |
|-----------|---------|----------|-------|
| WireGuard | ⚡⚡⚡ Très rapide | 🔒🔒🔒 Excellente | Recommandé |
| OpenVPN | ⚡⚡ Rapide | 🔒🔒🔒 Excellente | Standard |
| IKEv2/IPSec | ⚡⚡⚡ Très rapide | 🔒🔒🔒 Excellente | Mobile |
| L2TP/IPSec | ⚡⚡ Moyen | 🔒🔒 Bonne | Obsolète |
| PPTP | ⚡⚡⚡ Rapide | 🔒 Mauvaise | ⛔ À éviter |

### WireGuard — Le protocole moderne

```bash
# Installation WireGuard sur Linux
sudo apt install wireguard

# Générer les clés
wg genkey | tee cle_privee | wg pubkey > cle_publique

# Configuration client (/etc/wireguard/wg0.conf)
[Interface]
PrivateKey = [votre_cle_privee]
Address = 10.0.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = [cle_publique_serveur]
Endpoint = vpn.exemple.com:51820
AllowedIPs = 0.0.0.0/0  # Tout le trafic passe par le VPN

# Activer la connexion
sudo wg-quick up wg0
```

## Ce qu'un VPN fait vraiment

### ✅ Ce que le VPN protège

- **Votre FAI** ne peut plus voir vos sites visités
- **Les réseaux WiFi publics** ne peuvent plus intercepter vos données
- **Votre adresse IP réelle** est cachée des sites web
- **La géolocalisation** basée sur l'IP est contournée

### ❌ Ce que le VPN ne fait PAS

```
Mythes courants sur les VPN :

❌ "Le VPN me rend complètement anonyme"
→ FAUX : Les cookies, empreinte navigateur et comptes connectés
  vous identifient toujours

❌ "Le VPN me protège des malwares"
→ FAUX : Le VPN ne fait que chiffrer le trafic réseau

❌ "Le VPN cache mon activité à Google/Facebook"
→ FAUX : Si vous êtes connecté à ces services, ils vous voient

❌ "Le VPN gratuit est aussi bien que le payant"
→ FAUX : Les VPN gratuits revendent souvent vos données
```

## Choisir un bon VPN

### Les critères essentiels

**1. Politique de non-journalisation (No-logs)**

Le fournisseur ne conserve aucun log de votre activité. Vérifiez qu'elle a été **auditée indépendamment**.

**2. Juridiction**

Où est basée la société ? Les pays des **"5 Eyes"** (USA, UK, Canada, Australie, Nouvelle-Zélande) ont des lois de surveillance très étendues.

**3. Kill Switch**

Si le VPN se déconnecte, le Kill Switch coupe automatiquement Internet pour éviter que votre vraie IP ne soit exposée.

**4. Protocoles modernes**

Préférez WireGuard ou OpenVPN. Fuyez PPTP.

### Comparatif des VPN réputés

| VPN | Prix/mois | No-logs audité | Juridiction | Kill Switch |
|-----|-----------|----------------|-------------|-------------|
| Mullvad | 5€ | ✅ Oui | Suède | ✅ |
| ProtonVPN | 4-10€ | ✅ Oui | Suisse | ✅ |
| IVPN | 6€ | ✅ Oui | Gibraltar | ✅ |
| ExpressVPN | 8€ | ✅ Oui | Îles Vierges | ✅ |

> **Mullvad** accepte les paiements en espèces et crypto — idéal si vous voulez maximiser la confidentialité.

### Les VPN à éviter absolument

- VPN **gratuits** sans modèle économique clair
- VPN basés en **Chine**
- VPN sans **politique no-logs vérifiable**
- Hola VPN (revend votre bande passante)

## Monter son propre serveur VPN

Pour un contrôle total, hébergez votre propre VPN :

```bash
# Installation automatique avec script officiel WireGuard
curl -O https://raw.githubusercontent.com/angristan/wireguard-install/master/wireguard-install.sh
chmod +x wireguard-install.sh
sudo ./wireguard-install.sh

# Le script vous guide pour configurer :
# - Le port d'écoute
# - Les DNS
# - Les clients autorisés
```

**Prérequis :** un VPS (serveur privé virtuel) chez Hetzner, OVH ou DigitalOcean (~3-5€/mois).

**Avantage :** vous êtes le seul à avoir accès aux logs (qui n'existent pas si vous ne les activez pas).

**Inconvénient :** votre IP de serveur vous est associée — moins anonyme qu'un vrai VPN commercial.

## Tor : l'anonymat poussé à l'extrême

Tor est différent d'un VPN. Il fait transiter votre trafic à travers **3 relais chiffrés** gérés par des bénévoles dans le monde entier.

```
Vous → [Relais 1] → [Relais 2] → [Relais 3] → Internet
         Entrée       Milieu       Sortie
       (guard)       (middle)      (exit)

Chaque relais ne connaît que le relais précédent et suivant.
Personne ne connaît à la fois la source ET la destination.
```

### VPN vs Tor

| Critère | VPN | Tor |
|---------|-----|-----|
| Vitesse | ⚡⚡⚡ Rapide | ⚡ Lent |
| Anonymat | Moyen | Élevé |
| Confiance requise | Fournisseur VPN | Réseau distribué |
| Streaming | ✅ | ❌ |
| Usage | Quotidien | Haute sensibilité |

```bash
# Installer Tor Browser
# https://www.torproject.org/download/

# Ou Tor en ligne de commande
sudo apt install tor
sudo systemctl start tor

# Utiliser curl via Tor (port SOCKS 9050)
curl --socks5-hostname localhost:9050 https://check.torproject.org/api/ip
```

## Les techniques de fingerprinting à connaître

Même avec un VPN, vous pouvez être identifié par :

### Browser Fingerprinting

Votre navigateur révèle des dizaines d'informations qui forment une empreinte unique :

```javascript
// Ce que les sites collectent sans cookies
- User-Agent (version navigateur/OS)
- Résolution d'écran
- Polices installées
- Plugins actifs
- Fuseau horaire
- Paramètres de langue
- Canvas fingerprint (rendu graphique unique)
- WebGL fingerprint
```

**Protection :** utilisez Firefox avec uBlock Origin + Privacy Badger, ou le Tor Browser.

### DNS Leaks

Si votre VPN est mal configuré, vos requêtes DNS peuvent partir en dehors du tunnel.

```bash
# Tester les fuites DNS
# https://dnsleaktest.com

# Forcer les DNS via le VPN (Linux)
# Dans /etc/resolv.conf
nameserver 10.0.0.1  # DNS du VPN, pas de votre FAI
```

## Bonnes pratiques d'anonymat en ligne

```
Niveau 1 — Protection basique
✅ VPN commercial réputé
✅ DNS chiffré (DoH/DoT) : 1.1.1.1 ou 9.9.9.9
✅ HTTPS partout (extension HTTPS Everywhere)
✅ Bloqueur de pubs (uBlock Origin)

Niveau 2 — Protection intermédiaire
✅ Firefox avec configuration durcie
✅ Moteur de recherche privé (DuckDuckGo, Brave Search)
✅ Email temporaire pour les inscriptions
✅ Compartimentalisation (comptes séparés)

Niveau 3 — Haute confidentialité
✅ Tor Browser pour la navigation sensible
✅ Système d'exploitation dédié (Tails OS)
✅ Paiements en cash ou crypto
✅ Aucun compte connecté pendant la navigation anonyme
```

## Conclusion

Un VPN est un outil précieux mais pas magique. Il protège votre trafic des regards indiscrets sur le réseau, mais ne vous rend pas invisible. Pour une vraie confidentialité, combinez VPN + navigateur durci + bonnes pratiques. Et si vous avez besoin d'anonymat sérieux, Tor reste la référence.

---
*Articles connexes : [Introduction à la cybersécurité](../articles/intro-cybersecurite) | [Cryptographie](../articles/cryptographie-bases)*
