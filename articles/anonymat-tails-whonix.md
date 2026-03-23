# Anonymat avancé : Tails OS et Whonix

Pour ceux qui ont besoin d'un anonymat renforcé — journalistes, militants, lanceurs d'alerte — un simple VPN ne suffit pas. Tails OS et Whonix sont deux systèmes d'exploitation conçus spécifiquement pour maximiser l'anonymat et la vie privée numérique.

## Pourquoi les solutions classiques ne suffisent pas

```
VPN seul :
→ Le fournisseur VPN connaît votre IP réelle
→ Les fuites DNS/WebRTC peuvent révéler votre IP
→ Votre OS conserve des traces (logs, caches, métadonnées)
→ Niveau d'anonymat : faible à moyen

Tor seul :
→ Votre FAI voit que vous utilisez Tor
→ Votre OS garde des traces sur le disque
→ Niveau d'anonymat : moyen

Tails OS :
→ Aucune trace sur le disque (RAM uniquement)
→ Tout le trafic passe par Tor
→ Isolation complète de votre OS principal
→ Niveau d'anonymat : élevé

Whonix :
→ Architecture VM isolée (Gateway + Workstation)
→ Impossible pour un malware de connaître votre vraie IP
→ Niveau d'anonymat : très élevé
```

## Tails OS — L'OS amnésique

### Présentation

```
Tails = The Amnesic Incognito Live System

Principe :
→ Démarre depuis une clé USB
→ Tourne entièrement en RAM
→ À l'extinction : AUCUNE trace sur la machine hôte
→ Tout le trafic réseau passe par Tor automatiquement
→ Basé sur Debian Linux

Utilisé par :
→ Edward Snowden (révélations NSA)
→ Journalistes d'investigation (Le Monde, NYT)
→ Militants des droits de l'homme
→ Avocats avec clients sensibles
```

### Installation et utilisation

```bash
# 1. Télécharger Tails (tails.boum.org)
# Vérifier la signature cryptographique !
gpg --keyserver keyserver.ubuntu.com --recv-keys A490D0F4D311A4153E2BB7CADBB802B258ACD84F
gpg --verify tails-amd64-6.x.img.sig tails-amd64-6.x.img

# 2. Flasher sur une clé USB (min 8GB)
# Linux :
dd if=tails-amd64-6.x.img of=/dev/sdX bs=16M conv=fsync status=progress
# Windows : utiliser Rufus ou Balena Etcher

# 3. Démarrer depuis la clé USB
# Dans le BIOS : Boot from USB
# Choisir "Tails" dans le menu

# 4. Stockage persistant (optionnel)
# Applications → Tails → Configure persistent volume
# Chiffré avec une passphrase forte
# Persiste entre les sessions : documents, clés GPG, bookmarks

# Vérifier que Tor fonctionne
# Dans Tails : Applications → Tor Browser → check.torproject.org
```

### Applications incluses dans Tails

```
Communications sécurisées :
→ Tor Browser (navigation anonyme)
→ Thunderbird + Enigmail (email chiffré PGP)
→ OnionShare (partage de fichiers via Tor)
→ Signal (si configuré)
→ Pidgin + OTR (chat chiffré)

Chiffrement :
→ VeraCrypt (volumes chiffrés)
→ GnuPG (chiffrement PGP)
→ KeePassXC (gestionnaire de mots de passe)

Bureautique :
→ LibreOffice (sans macros)
→ Metadata Cleaner (supprimer métadonnées des fichiers)
→ MAT2 (Metadata Anonymisation Toolkit)
```

## Whonix — Architecture double VM

### Principe de la séparation Gateway/Workstation

```
Architecture Whonix :

┌─────────────────────────────────────────────┐
│  Machine hôte (votre OS normal)             │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Whonix-Gateway │  │Whonix-Workstation│  │
│  │                 │  │                  │  │
│  │  Réseau Tor     │←→│  Votre travail   │  │
│  │  uniquement     │  │  applications    │  │
│  │                 │  │                  │  │
│  │  Si compromise: │  │  Ne connaît PAS  │  │
│  │  attaquant dans │  │  votre vraie IP  │  │
│  │  la Gateway     │  │  (impossible     │  │
│  │                 │  │  techniquement)  │  │
│  └─────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────┘

Avantage clé :
Même si la Workstation est compromise par un malware,
il est TECHNIQUEMENT IMPOSSIBLE pour l'attaquant de
connaître votre vraie IP — il ne voit que des IPs Tor
```

### Installation

```bash
# 1. Installer VirtualBox
apt install virtualbox -y

# 2. Télécharger Whonix (whonix.org)
# Deux fichiers OVA :
# Whonix-Gateway-17.x.ova
# Whonix-Workstation-17.x.ova

# 3. Vérifier les signatures
gpg --verify Whonix-Gateway-17.x.ova.asc Whonix-Gateway-17.x.ova

# 4. Importer dans VirtualBox
VBoxManage import Whonix-Gateway-17.x.ova
VBoxManage import Whonix-Workstation-17.x.ova

# 5. Démarrer la Gateway EN PREMIER
# Puis démarrer la Workstation

# 6. Vérifier l'anonymat dans la Workstation
curl https://check.torproject.org/api/ip
# Doit retourner une IP Tor, jamais votre vraie IP
```

## Comparaison Tails vs Whonix

```
                    TAILS           WHONIX
Portabilité         ✅ Clé USB      ❌ VM fixe
Amnésie             ✅ Total        ❌ Traces sur hôte
Anonymat réseau     ✅ Tor          ✅ Tor
Isolation malware   ⚠️ Partielle   ✅ VM séparée
Facilité d'usage    ✅ Simple       ⚠️ Complexe
Persistance         ⚠️ Optionnelle ✅ Incluse
Live analysis       ❌             ✅ Snapshots VM

Recommandation par cas d'usage :
→ Journaliste nomade : TAILS (portabilité)
→ Chercheur en sécurité : WHONIX (isolation)
→ Lanceur d'alerte : TAILS + Whonix (combinaison)
→ Usage quotidien anonyme : WHONIX
```

## Bonnes pratiques d'anonymat avancé

```
Comportement opérationnel (OPSEC) :

1. Séparation stricte des identités
→ Ne JAMAIS mélanger l'identité anonyme et réelle
→ Pas de connexion à vos vrais comptes depuis Tails/Whonix
→ Pas de patterns d'écriture reconnaissables

2. Métadonnées des fichiers
→ Les photos contiennent des coordonnées GPS !
→ Les documents Word contiennent auteur, date de création
→ Utiliser MAT2 pour nettoyer TOUS les fichiers

3. Timing attacks
→ Vos horaires d'activité sont une signature
→ Un attaquant qui analyse les logs Tor peut corréler
→ Solution : utiliser à des heures variables

4. Sécurité physique
→ Tails depuis un matériel acheté en cash
→ Dans un lieu public avec Wi-Fi (pas votre connexion)
→ Caméras de surveillance dans les cafés (captuche)

5. Communications
→ Signal ou Session pour la messagerie
→ ProtonMail ou Tutanota pour l'email
→ SecureDrop pour contacter les médias (journalistes)
```

## Cas d'usage SecureDrop

```
SecureDrop (securedrop.org) :
→ Système de soumission sécurisée pour journalistes
→ Utilisé par : The Guardian, Le Monde, Washington Post
→ Sources anonymes peuvent soumettre des documents

Comment utiliser SecureDrop comme source :
1. Démarrer Tails sur une machine publique (bibliothèque)
2. Ouvrir Tor Browser
3. Accéder à l'adresse .onion du journal cible
   (ex: guardian.securedrop.tor.onion)
4. Soumettre les documents via l'interface sécurisée
5. Recevoir un code de source (noter sur papier)
6. Revenir plus tard pour la communication

Niveau d'anonymat : maximum
Utilisé par : Edward Snowden, Panama Papers sources
```

## Conclusion

Tails OS et Whonix représentent le niveau le plus élevé d'anonymat pratiquement accessible. Tails pour la mobilité et l'amnésie, Whonix pour l'isolation sur machine fixe. La technique seule ne suffit pas — l'OPSEC comportementale est tout aussi importante que l'outil. Comme le dit le proverbe sécurité : "Les outils ne font pas la sécurité, les comportements si."

---
*Catégorie : VPN & Anonymat*
