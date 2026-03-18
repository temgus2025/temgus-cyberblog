# Bluetooth et NFC : sécurité des communications sans fil courte portée

Bluetooth et NFC sont omniprésents dans nos appareils quotidiens — écouteurs, claviers, paiements sans contact, badges d'accès. Ces technologies pratiques présentent des vecteurs d'attaque spécifiques souvent sous-estimés.

## Bluetooth — Fonctionnement et versions

```
Versions Bluetooth et leur sécurité :

Bluetooth Classic (BR/EDR) :
→ Débit élevé, portée 10-100m
→ Audio, transfert de fichiers
→ Appairage via PIN (4-6 chiffres) → attaque par brute force

Bluetooth Low Energy (BLE) :
→ Faible consommation, IoT, wearables
→ Appairage simplifié → vulnérabilités
→ Utilisé par : FitBit, Apple Watch, serrures connectées, balises

Bluetooth 5.x :
→ Portée x4, débit x2
→ Améliorations sécurité mais nouvelles fonctionnalités = nouvelle surface

Modes d'appairage :
Just Works (JW)     : Aucune authentification → MITM possible
PIN Legacy          : PIN court → brute force
Passkey Entry       : Code 6 chiffres → brute force possible
Numeric Comparison  : Confirmer que le code est identique
Out-of-Band (OOB)   : Via NFC ou QR code → plus sécurisé
```

## Attaques Bluetooth

### BlueSnarfing et BlueJacking

```bash
# BlueJacking : envoi de messages non sollicités
# BlueSnarfing : accès non autorisé aux données

# Outils Bluetooth sous Linux
hcitool scan       # Découvrir les appareils Bluetooth visibles
hcitool inq        # Enquête Bluetooth
sdptool browse XX:XX:XX:XX:XX:XX  # Services disponibles

# Bluetoothctl - Interface moderne
bluetoothctl
[bluetooth]# scan on
[bluetooth]# devices
[bluetooth]# info XX:XX:XX:XX:XX:XX

# Ubertooth - Sniffer Bluetooth dédié
ubertooth-btle -f  # Suivre les connexions BLE
ubertooth-rx        # Capturer le trafic Bluetooth classic
```

### BIAS Attack (Bluetooth Impersonation Attack)

```python
# BIAS (2020) : vulnérabilité dans l'authentification Bluetooth Secure Simple Pairing
# Affecte TOUS les appareils Bluetooth (milliards d'appareils)

# Principe :
# 1. L'attaquant se trouve à portée de deux appareils appairés (A et B)
# 2. L'attaquant se fait passer pour A auprès de B
# 3. BIAS permet de passer l'authentification sans la clé longue terme (LTK)
# 4. L'attaquant peut envoyer des commandes à B comme s'il était A

# Impact :
# → Contrôler des appareils médicaux
# → Accéder à des ordinateurs via claviers BT
# → Écouter des conversations via oreillettes BT

# Correction : patch des firmwares (appliqué en 2020 par la plupart des fabricants)
# Action requise : mettre à jour firmware de tous vos appareils BT
```

### BLESA (BLE Spoofing Attack)

```python
# BLESA affecte le BLE Reconnection process
# Quand deux appareils BLE se reconnectent, l'authentification est optionnelle

# Attaque :
# 1. Simuler un périphérique BLE connu (ex: capteur de glycémie)
# 2. Envoyer de fausses données lors de la reconnexion
# 3. Les appareils vulnérables acceptent sans authentification

# Appareils affectés :
# iOS avant 13.4, Android, Linux BlueZ
# Particulièrement dangereux pour les appareils médicaux IoT !
```

### BlueBorne

```bash
# BlueBorne (2017) : 8 vulnérabilités zero-click sur Bluetooth
# Pas besoin d'appairage, pas d'interaction utilisateur
# Propagation de type worm possible

# Testé sur : Windows, Linux, Android, iOS (avant iOS 10)
# Impact : RCE, MITM, propagation automatique

# Test de vulnérabilité BlueBorne
# https://github.com/ArmisSecurity/blueborne
python poc_android_stack_overflow.py -t XX:XX:XX:XX:XX:XX

# Protection :
# → Désactiver Bluetooth quand non utilisé
# → Mettre à jour le firmware/OS
# → Android : patch septembre 2017
# → iOS : patch 10
```

## NFC — Near Field Communication

### Fonctionnement

```
NFC fonctionne à 13,56 MHz, portée max ~20cm
Standards :
→ ISO 14443 (cartes de paiement sans contact)
→ ISO 15693 (badges d'accès longue portée jusqu'à 1m)
→ NDEF (NFC Data Exchange Format) pour l'échange de données

Modes :
→ Lecteur/Graveur : lire des tags NFC
→ Emulation de carte : smartphone simule une carte bancaire (Apple Pay)
→ Peer-to-peer : échange entre deux appareils NFC
```

### Attaques NFC

```python
# NFC Eavesdropping (interception à distance)
# Théoriquement 20cm, mais avec une antenne amplifiée : jusqu'à 1 mètre

# Relay Attack - L'attaque la plus dangereuse sur les paiements sans contact
# Scénario :
# Victime à la caisse → Lecteur du magasin
#
# Attaque relay :
# Victime → [Antenne émettrice de l'attaquant]
#                    ↓ (transmission en temps réel)
#           [Antenne réceptrice de l'attaquant] → Lecteur du magasin
#
# L'attaquant peut faire un paiement n'importe où dans le monde
# en utilisant la carte de la victime (même dans sa poche !)

# Outils : Proxmark3, ACR122U, libnfc

# Protection :
# → Portemonnaie RFID-blocking (cage de Faraday)
# → Limites de paiement sans contact (50€ en France par défaut)
# → Vérification dynamique avec le montant (Europay/Mastercard/Visa)
```

```bash
# Lire et cloner des tags NFC avec Proxmark3

# Détecter le type de tag
pm3 --> hf search

# Lire un tag MIFARE Classic
pm3 --> hf mf autopwn

# MIFARE Classic - Vulnérabilité Crypto1
# L'algorithme Crypto1 est cassé depuis 2008 (CRYPTO1 BROKEN)
# Attaque Darkside/Nested permet de lire/écrire sans la clé originale

# Cloner une carte MIFARE Classic
pm3 --> hf mf dump          # Lire les 1K/4K blocs
pm3 --> hf mf restore       # Restaurer sur une carte vierge

# Badges d'accès HID iCLASS
pm3 --> hf iclass dump      # Extraire les données
# Ces badges sont utilisés dans des milliers d'entreprises
# Une fois la clé extractée → dupliquer le badge en quelques secondes
```

### Attaques sur les paiements sans contact

```python
# Le "pickpocketing NFC" existe mais est limité par :
# → La portée très courte (< 5cm en pratique)
# → Les limites de transaction sans PIN
# → La cryptographie dynamique (CVV dynamique)

# Vraie menace : vol de numéro de carte (pas de paiement complet)
# Un lecteur NFC peut lire :
# → Numéro de carte (PAN)
# → Date d'expiration
# → Parfois les dernières transactions
# → PAS le CVV (stocké séparément)
# → PAS le PIN (jamais transmis en clair)

import nfc  # libnfc Python binding

def scan_contactless_card(clf):
    """Lire les informations d'une carte sans contact (ÉDUCATIF)"""
    tag = clf.connect(rdwr={'on-connect': lambda tag: False})
    if tag:
        # Lire les données EMV
        response = tag.transceive(b'\x00\xa4\x04\x00\x07\xa0\x00\x00\x00\x03\x10\x10')
        # Décoder le numéro de carte depuis la réponse TLV
        print(f"Type de carte : {tag.type}")

# Protection :
# Portefeuille RFID-blocking = efficace
# Étui métal pour la carte bancaire seule = efficace
# Application mobile avec notifications temps réel = recommandé
```

## Bonnes pratiques de sécurité

### Bluetooth

```
✅ Désactiver Bluetooth quand non utilisé
✅ Appairage seulement dans un lieu privé (pas dans un café)
✅ Refuser les demandes d'appairage inattendues
✅ Mettre à jour le firmware de tous les appareils BT
✅ Utiliser "Non visible" / "Non découvrable" par défaut
✅ Mode "Just Works" : éviter pour les appareils sensibles
✅ Préférer les appareils avec PIN ou confirmation numérique

Pour les entreprises :
✅ Interdire Bluetooth dans les zones sensibles
✅ Inventaire des appareils BT autorisés
✅ Monitoring des connexions BT (XDR/EDR)
```

### NFC et cartes sans contact

```
✅ Portefeuille/porte-carte RFID-blocking (5-15€)
✅ Activer les notifications de paiement en temps réel
✅ Paramétrer un plafond de paiement sans contact
✅ Appareils IoT : changer les clés MIFARE par défaut
✅ Badges d'entreprise : préférer MIFARE DESFire (AES-128) vs MIFARE Classic cassé
✅ Auditer régulièrement les lecteurs de badges (compromission possible)
```

## Outils de sécurité Bluetooth/NFC

```bash
# Bluetooth
bluetoothctl          # Interface système (Linux)
gatttool              # Analyse GATT BLE
btlejuice             # MITM sur BLE
btlejack              # Hijack connexions BLE
Wireshark + btsnoop   # Capturer le trafic BT

# NFC
Proxmark3             # Outil tout-en-un (300-500€)
ACR122U               # Lecteur/graveur USB NFC abordable (30€)
libnfc                # Bibliothèque NFC open source
nfc-tools             # Utilitaires en ligne de commande
NFCtools (Android)    # Application Android pour lire les tags
```

## Conclusion

Bluetooth et NFC sont des technologies pratiques mais pas sans risques. Les vulnérabilités comme BlueBorne et BIAS ont montré que ces protocoles peuvent être exploités de façon transparente. La défense basique est simple : **désactivez Bluetooth quand vous ne l'utilisez pas, utilisez un portefeuille RFID-blocking, et maintenez vos firmwares à jour**. Pour les entreprises, la migration vers MIFARE DESFire pour les badges d'accès est urgente.