# Burp Suite : le guide complet du pentesteur web

Burp Suite est l'outil de référence pour le pentest web. Développé par PortSwigger, il est utilisé par les professionnels du monde entier pour intercepter, analyser et manipuler le trafic HTTP. Voici comment le maîtriser.

## Qu'est-ce que Burp Suite ?

Burp Suite est un **proxy d'interception** qui se place entre votre navigateur et le serveur web. Il vous permet de voir, modifier et rejouer toutes les requêtes HTTP/HTTPS.

Il existe trois versions :
- **Community** : gratuite, fonctionnalités limitées (pas de scanner automatique)
- **Professional** : ~450€/an, scanner automatique, toutes fonctionnalités
- **Enterprise** : pour les grandes organisations, scan automatisé à grande échelle

## Installation et configuration

### Installation
Téléchargez Burp Suite depuis **portswigger.net/burp**. Il tourne sur Java et est disponible sur Windows, Linux et macOS.

### Configurer le proxy

**1. Dans Burp Suite :**
- Onglet **Proxy** → **Options**
- Vérifiez que le proxy écoute sur `127.0.0.1:8080`

**2. Dans votre navigateur (Firefox recommandé) :**
- Paramètres → Réseau → Paramètres de connexion
- Proxy manuel : `127.0.0.1`, port `8080`
- Cochez "Utiliser ce proxy pour tous les protocoles"

**3. Installer le certificat CA Burp :**
- Naviguez vers `http://burpsuite` dans Firefox
- Téléchargez le certificat CA
- Firefox → Paramètres → Certificats → Importer
- Cochez "Faire confiance pour les sites web"

## Les modules essentiels

### Proxy — Intercepter les requêtes

Le cœur de Burp Suite. Activez l'interception et naviguez sur le site cible. Chaque requête est capturée et vous pouvez la modifier avant de l'envoyer.

```
GET /search?q=test HTTP/1.1
Host: example.com
Cookie: session=abc123

→ Modifier q=test par q=' OR '1'='1 pour tester SQLi
```

**Astuce** : utilisez la fonction **"Send to Repeater"** (Ctrl+R) pour envoyer une requête au Repeater et la rejouer autant de fois que nécessaire.

### Repeater — Rejouer et modifier les requêtes

Le Repeater permet de modifier une requête et l'envoyer manuellement, autant de fois que voulu. Essentiel pour :
- Tester les injections SQL manuellement
- Explorer les paramètres d'une API
- Confirmer une vulnérabilité

### Intruder — Automatiser les attaques

L'Intruder automatise l'envoi de requêtes modifiées. Quatre modes :

**Sniper** : teste une position avec une liste de payloads
```
GET /login?user=§admin§&pass=test
→ Teste: admin, administrator, root, user...
```

**Cluster Bomb** : teste toutes les combinaisons de plusieurs listes
```
GET /login?user=§USER§&pass=§PASS§
→ Teste toutes les combinaisons user/pass
```

⚠️ En version Community, l'Intruder est limité à une requête par seconde. Utilisez **ffuf** ou **hydra** pour contourner cette limitation.

### Scanner — Détecter les vulnérabilités (Pro)

Le scanner automatique de Burp Pro détecte :
- Injections SQL, XSS, XXE
- SSRF, IDOR
- Misconfigurations
- Vulnérabilités d'authentification

Il fonctionne de façon passive (analyse le trafic) et active (envoie des payloads de test).

### Decoder — Encoder/Décoder les données

Encode et décode rapidement :
- Base64 : `dGVzdA==` → `test`
- URL encoding : `%3C%73%63%72%69%70%74%3E` → `<script>`
- HTML entities, Hex, Gzip...

### Comparer (Comparer)

Compare deux requêtes ou réponses pour identifier les différences. Utile pour détecter des comportements différents selon les paramètres.

## Techniques avancées

### Scan passif
Activez le scan passif pour que Burp analyse automatiquement tout le trafic qui passe par le proxy, sans envoyer de requêtes supplémentaires.

### Extensions (BApp Store)
Burp dispose d'un store d'extensions. Les plus utiles :

- **Autorize** : teste automatiquement les problèmes d'autorisation (IDOR)
- **JWT Editor** : manipule les tokens JWT
- **ActiveScan++** : améliore le scanner actif
- **Turbo Intruder** : Intruder ultra-rapide (contourne la limitation Community)
- **Logger++** : logging avancé de toutes les requêtes

### Macro et session handling
Les macros permettent d'automatiser des séquences de requêtes (connexion, navigation) pour maintenir une session valide pendant les scans.

## Workflow de pentest web avec Burp

```
1. Configurer Burp comme proxy
2. Spider/naviguer manuellement le site → construire la sitemap
3. Analyser les résultats du scan passif
4. Identifier les fonctionnalités intéressantes
5. Utiliser Repeater pour tester manuellement
6. Lancer le scan actif sur les zones ciblées (Pro)
7. Exploiter et confirmer les vulnérabilités
8. Documenter avec les captures Burp
```

## Ressources pour progresser

- **PortSwigger Web Security Academy** : gratuit, labs pratiques excellents
- **TryHackMe** : parcours Burp Suite dédié
- **HackTheBox** : machines web avec Burp obligatoire

## Conclusion

Burp Suite est un outil indispensable que tout pentesteur web doit maîtriser. La version Community est suffisante pour débuter et réaliser des tests manuels approfondis. Investissez du temps dans la Web Security Academy de PortSwigger — c'est la meilleure ressource gratuite pour apprendre à utiliser Burp efficacement.
