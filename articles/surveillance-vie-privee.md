# Société de surveillance et vie privée numérique

Nous vivons dans une société de surveillance sans précédent. Smartphones, caméras, cookies, métadonnées — chaque aspect de notre vie numérique est tracé, analysé et monétisé. Ce guide explore les mécanismes de surveillance et les outils pour reprendre le contrôle de votre vie privée.

## L'ampleur de la surveillance moderne

### La surveillance commerciale

```
Ce que les GAFAM savent de vous :

Google :
→ Chaque recherche effectuée (depuis 2004 pour beaucoup)
→ Chaque email Gmail (analyse pour ciblage pub)
→ Votre localisation précise 24h/24 (Google Maps, Android)
→ Vos habitudes de navigation (Google Analytics sur 80% des sites)
→ Vos achats (Gmail reçoit vos confirmations de commande)
→ Vos déplacements physiques (Google Timeline)

Facebook/Meta :
→ Vos relations, opinions, émotions
→ Ce que vous tapez sans envoyer (keylogging des champs de saisie)
→ Votre activité sur les sites tiers (pixel Facebook)
→ La reconnaissance faciale de vos photos
→ Votre localisation même sans GPS (WiFi, cell towers)

Amazon :
→ Tout ce que vous achetez et consultez
→ Ce que vous dites chez vous (Alexa écoute en permanence)
→ Vos habitudes de sommeil et santé (si vous avez des appareils connectés)
```

### La surveillance gouvernementale

```
Révélations Snowden (2013) :
PRISM : collecte directe auprès de Google, Facebook, Microsoft, Apple
XKeyscore : surveillance quasi-totale du trafic internet mondial
Bullrun : affaiblissement délibéré des standards cryptographiques

Outils de surveillance légale en France :
→ IMSI catchers (fausses antennes qui interceptent les appels)
→ Réquisitions judiciaires aux opérateurs télécom
→ DGSI/DGSE : surveillance des communications internationales
→ Fichier TES (titres électroniques sécurisés) : 60 millions de Français
```

## Comment vous êtes tracé

### Browser Fingerprinting

```javascript
// Ce que votre navigateur révèle sans cookies

const fingerprint = {
    userAgent: navigator.userAgent,
    // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."

    screen: {
        width: screen.width,      // 1920
        height: screen.height,    // 1080
        colorDepth: screen.colorDepth  // 24
    },

    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // "Europe/Paris"

    languages: navigator.languages,
    // ["fr-FR", "fr", "en-US", "en"]

    plugins: Array.from(navigator.plugins).map(p => p.name),
    // Liste de vos plugins installés

    canvas: getCanvasFingerprint(),
    // Rendu graphique unique à votre GPU + driver + OS

    webgl: getWebGLFingerprint(),
    // Caractéristiques uniques de votre carte graphique
};

// Combiné, ce fingerprint identifie 99.24% des utilisateurs
// de façon unique SANS AUCUN COOKIE
```

### Les métadonnées qui révèlent tout

```
"Nous ne collectons pas le contenu, seulement les métadonnées"
— Déclaration de nombreuses agences de surveillance

Mais les métadonnées révèlent :

Appel de 3 minutes à un médecin spécialiste en oncologie
+ Appel à la mutuelle pour vérifier la couverture chimiothérapie
+ Appel à un proche pour "une conversation importante"
→ Diagnostic probable de cancer sans écouter un seul mot

Appels à un avocat spécialisé droit du travail
+ Messages à des syndicats
+ Réunions fréquentes avec des collègues
→ Préparation d'une action collective contre l'employeur

Les métadonnées révèlent PLUS que le contenu.
```

## Les outils de protection de la vie privée

### Navigateur et recherche

```
Navigateurs recommandés (du plus au moins privé) :
1. Tor Browser       → Anonymat maximum, lent
2. Firefox (durci)   → Bon équilibre vie privée/utilisabilité
3. Brave             → Blocage pub/trackers natif
4. Safari            → Meilleur que Chrome sur Mac
5. Chrome            → Éviter (mouchard Google intégré)

Configuration Firefox pour la vie privée :
→ about:config → privacy.resistFingerprinting = true
→ Installer : uBlock Origin, Privacy Badger, Cookie AutoDelete
→ Désactiver WebRTC (fuite d'IP) : media.peerconnection.enabled = false

Moteurs de recherche privés :
→ DuckDuckGo   : pas de profil, résultats décents
→ Brave Search : index indépendant
→ Startpage    : résultats Google sans le tracking
→ SearXNG      : méta-moteur auto-hébergeable
```

### Email privé

```
Problèmes avec Gmail :
→ Google scanne tous vos emails
→ Publicités ciblées basées sur le contenu
→ Partage avec partenaires publicitaires
→ Accessible aux agences de renseignement américaines (PRISM)

Alternatives respectueuses de la vie privée :

ProtonMail (Suisse) :
→ Chiffrement de bout en bout entre utilisateurs Proton
→ Juridiction suisse (lois strictes sur la vie privée)
→ Open source et audité
→ Gratuit / 4€/mois

Tutanota (Allemagne) :
→ E2E chiffrement complet (boîte, contacts, agenda)
→ Loi allemande RGPD stricte
→ Open source
→ Gratuit / 1€/mois

SimpleLogin / AnonAddy :
→ Création d'alias email à usage unique
→ Protège votre adresse réelle des spammeurs et hackers
```

### Messagerie chiffrée

```
Hiérarchie de sécurité :

Signal ✅✅✅
→ E2E chiffrement (protocole Signal)
→ Messages éphémères
→ Pas de métadonnées stockées
→ Open source, audité indépendamment
→ Recommandé par Snowden, journalistes, avocats

WhatsApp ✅✅ (avec nuances)
→ E2E pour le contenu (protocole Signal)
→ MAIS métadonnées collectées par Meta
→ Graphe social (qui parle à qui) accessible à Meta
→ Backups non chiffrés par défaut sur Google Drive

Telegram ⚠️ (mal compris)
→ PAS de E2E par défaut !
→ Chiffrement serveur-client seulement
→ Telegram peut lire vos messages
→ E2E seulement dans les "Secret Chats"
→ Beaucoup surestimé pour la vie privée

SMS ❌
→ Aucun chiffrement
→ Accessible à votre opérateur télécom
→ Interceptable par IMSI catcher
```

### VPN et protection réseau

```bash
# DNS over HTTPS (DoH) - Chiffrer vos requêtes DNS
# Configurer sur Firefox :
# about:preferences#general → Activer DNS over HTTPS → Cloudflare ou NextDNS

# Pi-hole - Bloquer pubs et trackers au niveau réseau
docker run -d \
    --name pihole \
    -p 53:53/tcp -p 53:53/udp \
    -p 80:80 \
    -e TZ="Europe/Paris" \
    -v "$(pwd)/etc-pihole:/etc/pihole" \
    pihole/pihole:latest

# Bloque les domaines de tracking pour TOUS les appareils du réseau
# Facebook analytics, Google DoubleClick, Amazon tracking...
```

## RGPD : vos droits en Europe

```
Le RGPD vous donne ces droits sur vos données :

✅ Droit d'accès : demandez toutes vos données à une entreprise
   → Google Takeout : téléchargez tout ce que Google a sur vous
   → Facebook : Paramètres → Vos informations Facebook → Télécharger

✅ Droit à l'oubli : demandez la suppression de vos données
   → Google : https://myaccount.google.com/delete-services-or-account
   → Formulaire CNIL pour les refus

✅ Droit d'opposition : refusez le traitement pour le marketing

✅ Droit à la portabilité : récupérez vos données dans un format standard

En cas de violation :
→ Portez plainte à la CNIL (cnil.fr)
→ Amende max : 4% du CA mondial ou 20M€
```

## Le modèle de menace personnel

Tout le monde n'a pas les mêmes besoins de vie privée.

```
Niveau 1 — Citoyen ordinaire
→ Firefox + uBlock Origin
→ DuckDuckGo ou Brave Search
→ ProtonMail pour l'email
→ Signal pour les messages sensibles
→ Gestionnaire de mots de passe (Bitwarden)

Niveau 2 — Journaliste / Activiste
→ Tor Browser pour la navigation sensible
→ Signal + messages éphémères
→ Email chiffré PGP
→ VPN de confiance (Mullvad)
→ Aucun smartphone (ou GrapheneOS)

Niveau 3 — Haute valeur (lanceur d'alerte)
→ Tails OS (aucune trace sur le disque)
→ Communication uniquement via SecureDrop
→ Jamais de smartphone personnel
→ Réunions dans des espaces sans électronique
→ Paiements uniquement en cash
```

## Conclusion

La vie privée n'est pas un luxe — c'est un droit fondamental. Dans une société de surveillance, se protéger demande des efforts mais reste possible. Commencez par les **gains faciles** : Firefox + uBlock Origin + Signal + Bitwarden. Ces quatre outils réduisent considérablement votre exposition. Ensuite, adaptez votre niveau de protection à votre modèle de menace réel.