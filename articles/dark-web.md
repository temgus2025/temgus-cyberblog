# Dark Web : mythes et réalités

Le Dark Web fait l'objet de nombreuses idées reçues — tantôt présenté comme un repaire exclusif de criminels, tantôt comme un outil de liberté indispensable. La réalité est plus nuancée. Ce guide démystifie le Dark Web, explique son fonctionnement technique et aborde ses usages légitimes et illicites.

## Les trois couches d'Internet

```
SURFACE WEB (~4% du web)
━━━━━━━━━━━━━━━━━━━━━━━━
Indexé par Google, Bing, etc.
Sites web classiques, réseaux sociaux, actualités
→ Visible par tous, indexé, accessible sans configuration spéciale

DEEP WEB (~90% du web)
━━━━━━━━━━━━━━━━━━━━━━━━
Non indexé par les moteurs de recherche
Emails, intranets d'entreprise, bases de données, espaces cloud privés
→ Accessible avec un compte ou une URL directe

DARK WEB (~6% du web)
━━━━━━━━━━━━━━━━━━━━━━━━
Nécessite un logiciel spécial (Tor, I2P)
Adresses .onion non résolvables sur Internet classique
→ Anonymat technique by design
```

> **Confusion fréquente :** Deep Web ≠ Dark Web. Votre boîte email Gmail est sur le Deep Web. Le Dark Web nécessite Tor ou I2P pour y accéder.

## Comment fonctionne Tor

Tor (The Onion Router) chiffre votre trafic en **plusieurs couches** (comme un oignon) et le fait transiter par 3 relais bénévoles.

```
VOTRE PC
    │
    │ Chiffrement couche 1+2+3
    ↓
[Relais d'entrée / Guard]
    │ Déchiffre couche 1 → sait d'où vous venez
    │ Ne sait pas où vous allez
    ↓
[Relais du milieu]
    │ Déchiffre couche 2 → sait d'où vient le trafic
    │ Ne sait ni qui vous êtes ni où vous allez
    ↓
[Relais de sortie / Exit Node]
    │ Déchiffre couche 3 → sait où vous allez
    │ Ne sait pas qui vous êtes
    ↓
DESTINATION
(voit l'IP du nœud de sortie, pas la vôtre)
```

### Services .onion

Les sites .onion n'ont pas besoin de nœud de sortie — le serveur est aussi anonyme que le visiteur.

```
# Exemples de sites .onion légitimes
ProtonMail : protonirockerxow.onion
DuckDuckGo : 3g2upl4pq6kufc4m.onion
BBC News   : bbcnewsd73hkzno2.onion
The New York Times : nytimesn7cgmftshazwhfgzm2...onion
Facebook   : facebookwkhpilnemxj7ascrwwlo6...onion
```

## Les usages légitimes du Dark Web

### Journalisme et protection des sources

```
Des journalistes du monde entier utilisent le Dark Web pour :
→ Recevoir des documents sensibles de lanceurs d'alerte
→ Communiquer avec des sources dans des pays autoritaires
→ Protéger leur identité dans des enquêtes dangereuses

SecureDrop (The Guardian, Washington Post, Le Monde) :
→ Plateforme .onion pour soumettre des documents à des journalistes
→ Complètement chiffré et anonyme
```

### Accès à l'information dans les pays censurés

```
Pays qui bloquent l'accès à Internet :
→ Chine (Great Firewall)
→ Iran, Russie, Belarus, Corée du Nord

Pour les citoyens de ces pays, Tor permet :
→ Accéder aux réseaux sociaux bloqués
→ Lire des médias indépendants
→ Communiquer librement

C'est pourquoi 80% du financement de Tor Project
vient du gouvernement américain (State Department) —
c'est un outil de liberté d'expression.
```

### Cybersécurité et threat intelligence

```
Les professionnels de la sécurité surveillent le Dark Web pour :
→ Détecter les fuites de données de leur entreprise
→ Identifier les outils malveillants émergents
→ Surveiller les mentions de leur organisation
→ Analyser les nouvelles techniques d'attaque

Services de surveillance Dark Web :
→ SpyCloud, Digital Shadows, Recorded Future
→ Kela, Cybersixgill, Intel 471
```

## Les réalités illicites du Dark Web

### Marchés noirs (darknet markets)

```
Produits illicites les plus vendus :
→ Drogues (60-70% du volume)
→ Données volées (cartes bancaires, identités, credentials)
→ Malwares et ransomwares as a Service
→ Faux documents
→ Armes (moins courant qu'on ne le croit)

Marchés historiques tombés :
→ Silk Road (2013) - fermé par le FBI
→ AlphaBay (2017) - fermé par Europol + FBI
→ Hansa (2017) - infiltré par la police néerlandaise
→ DarkMarket (2021) - fermé par Europol
```

> Les forces de l'ordre ont démontré qu'aucun marché n'est inattaquable. Les opérateurs sont régulièrement arrêtés.

### Fuites de données

```bash
# Ce qu'on trouve sur les forums du Dark Web :
→ Bases de données hackées (emails + mots de passe)
→ Dumps de cartes bancaires
→ Accès RDP compromis (revendus à des groupes ransomware)
→ Logs de stealers (malwares qui volent les credentials)

# Vérifier si vos données sont exposées
# https://haveibeenpwned.com (surface web)
# https://dehashed.com (agrégateur de fuites)
```

## Comment accéder au Dark Web en sécurité

> **Note légale :** Naviguer sur le Dark Web est légal dans la plupart des pays. Acheter ou vendre des produits illicites ne l'est pas.

### Installation du Tor Browser

```bash
# Télécharger uniquement depuis le site officiel
# https://www.torproject.org/download/

# Vérifier la signature GPG (important !)
gpg --keyserver pool.sks-keyservers.net --recv-keys 0x4E2C6E8793298290
gpg --verify tor-browser-linux64-13.0_en-US.tar.xz.asc

# Lancer Tor Browser
./tor-browser_en-US/Browser/start-tor-browser.desktop
```

### Bonnes pratiques de sécurité sur Tor

```
✅ Utiliser UNIQUEMENT le Tor Browser (pas Firefox/Chrome configuré avec Tor)
✅ Ne jamais maximiser la fenêtre (révèle la résolution d'écran)
✅ Ne jamais se connecter à vos vrais comptes via Tor
✅ Ne jamais télécharger de fichiers (peuvent révéler votre IP)
✅ Désactiver JavaScript sur les sites sensibles (NoScript)
✅ Utiliser Tails OS pour un anonymat maximum

❌ Ne jamais torrent via Tor (révèle votre IP)
❌ Ne jamais installer de plugins dans Tor Browser
❌ Ne pas utiliser votre vraie identité
❌ Ne pas faire confiance aux nœuds de sortie (trafic non chiffré)
```

### Tails OS — L'anonymat ultime

```
Tails (The Amnesic Incognito Live System) est un OS qui :
→ Démarre depuis une clé USB
→ Route TOUT le trafic via Tor
→ Ne laisse AUCUNE trace sur l'ordinateur
→ Perd tout en mémoire à l'extinction

Cas d'usage : journaliste, activiste, lanceur d'alerte
Téléchargement : https://tails.boum.org
```

## Mythes vs Réalités

| Mythe | Réalité |
|-------|---------|
| "Le Dark Web est majoritairement criminel" | 50%+ du trafic Tor va vers des sites légaux |
| "On y trouve des snuff films et du CSAM facilement" | Ces contenus existent mais sont traqués activement par les forces de l'ordre |
| "Tor rend complètement anonyme" | Tor protège contre la surveillance de masse, pas contre une agence déterminée |
| "Le Dark Web est inaccessible" | N'importe qui peut installer Tor Browser en 5 minutes |
| "Toute activité y est illégale" | Naviguer est légal, certaines activités ne le sont pas |

## Les limites de l'anonymat Tor

```
Tor ne vous protège pas contre :
→ Les erreurs humaines (se connecter à votre vrai email via Tor)
→ Les malwares qui révèlent votre IP directement
→ Une corrélation de trafic par un adversaire qui surveille les deux bouts
→ Les failles dans les applications utilisées (navigateur, PDF reader)
→ La métadonnée comportementale (façon d'écrire, horaires)

Cas réels de désanonymisation :
→ Ross Ulbricht (Silk Road) : erreur humaine, email personnel lié au projet
→ Hector Monsegur (LulzSec) : connexion accidentelle sans Tor
```

## Conclusion

Le Dark Web est un **outil neutre** — comme Internet lui-même. Il est utilisé par des criminels, mais aussi par des journalistes, des militants des droits de l'homme et des citoyens sous régimes autoritaires. Tor reste la technologie d'anonymat la plus éprouvée pour protéger la vie privée en ligne. L'important est de comprendre ses capacités réelles et ses limites, sans mythifier ni diaboliser.

---
*Retour à l'accueil : [Temgus.CyberBlog](../index.html)*
