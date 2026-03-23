# Biométrie et authentification moderne : FIDO2, Passkeys et MFA avancé

L'ère des mots de passe touche à sa fin. FIDO2, passkeys, biométrie avancée — les nouvelles méthodes d'authentification offrent une sécurité bien supérieure tout en améliorant l'expérience utilisateur. Ce guide explore ces technologies et leurs implications sécurité.

## Le problème des mots de passe

```
Statistiques 2024 :
→ 81% des brèches impliquent des mots de passe volés ou faibles
→ L'utilisateur moyen gère 100+ mots de passe
→ 65% réutilisent le même mot de passe sur plusieurs sites
→ 51 millions de credentials nouveaux volés chaque jour

Limites fondamentales des mots de passe :
→ Phishable : vous pouvez être trompé pour le révéler
→ Réutilisés : une brèche = tous les comptes compromis
→ Devinables : 10 000 mots de passe couvrent 98% des choix
→ Stockés côté serveur : une BDD compromise = tous les passwords
→ Oubliés : friction utilisateur → mauvaises pratiques
```

## FIDO2 / WebAuthn — L'avenir de l'authentification

### Principe cryptographique

```
FIDO2 = Fast IDentity Online 2

Fonctionnement :
1. INSCRIPTION :
   → Appareil génère une paire de clés (privée + publique)
   → Clé privée : stockée LOCALEMENT sur l'appareil (jamais transmise)
   → Clé publique : envoyée et stockée sur le serveur

2. CONNEXION :
   → Serveur envoie un "challenge" aléatoire
   → Appareil signe le challenge avec la clé privée
   → Serveur vérifie la signature avec la clé publique
   → Accès accordé

Pourquoi c'est révolutionnaire :
→ La clé privée ne quitte JAMAIS l'appareil
→ Chaque site a une paire de clés unique (pas de réutilisation)
→ Le serveur ne stocke JAMAIS de secret → BDD compromise = aucun impact
→ Phishing impossible : la clé est liée au domaine exact
```

### Implémentation WebAuthn

```javascript
// WebAuthn - Implémentation côté client

// INSCRIPTION
async function registerFIDO2(username) {
    // 1. Obtenir les options du serveur
    const options = await fetch('/api/webauthn/register/begin', {
        method: 'POST',
        body: JSON.stringify({ username })
    }).then(r => r.json());

    // 2. Créer les credentials sur l'appareil
    // → Déclenche le scan biométrique / PIN
    const credential = await navigator.credentials.create({
        publicKey: {
            challenge: base64ToBuffer(options.challenge),
            rp: { name: "Mon Blog", id: "monblog.com" },
            user: {
                id: stringToBuffer(options.userId),
                name: username,
                displayName: username
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 },   // ES256 (ECDSA P-256)
                { type: "public-key", alg: -257 }  // RS256 (RSA)
            ],
            authenticatorSelection: {
                residentKey: "required",           // Stocker sur l'appareil
                userVerification: "required"       // Biométrie/PIN obligatoire
            },
            timeout: 60000,
            attestation: "direct"
        }
    });

    // 3. Envoyer la clé publique au serveur
    await fetch('/api/webauthn/register/complete', {
        method: 'POST',
        body: JSON.stringify(credentialToJSON(credential))
    });

    console.log('Enregistrement FIDO2 réussi !');
}

// CONNEXION
async function loginFIDO2(username) {
    const options = await fetch('/api/webauthn/login/begin', {
        method: 'POST',
        body: JSON.stringify({ username })
    }).then(r => r.json());

    const assertion = await navigator.credentials.get({
        publicKey: {
            challenge: base64ToBuffer(options.challenge),
            rpId: "monblog.com",
            allowCredentials: options.allowCredentials,
            userVerification: "required",
            timeout: 60000
        }
    });

    // Le navigateur a signé le challenge avec la clé privée
    const result = await fetch('/api/webauthn/login/complete', {
        method: 'POST',
        body: JSON.stringify(assertionToJSON(assertion))
    }).then(r => r.json());

    if (result.success) {
        console.log('Connexion FIDO2 réussie - Résistant au phishing !');
    }
}
```

## Passkeys — FIDO2 pour le grand public

```
Passkeys = FIDO2 + synchronisation cloud + UX simplifiée

Différence avec FIDO2 "hardware" :
→ FIDO2 classique : clé liée à UN appareil physique (YubiKey)
→ Passkeys : clé synchronisée via cloud (iCloud Keychain, Google Password Manager)

Avantages des Passkeys :
→ Résistants au phishing (liés au domaine)
→ Pas de mot de passe à mémoriser
→ Synchronisés entre appareils (iPhone + Mac + iPad)
→ Récupération si perte d'appareil (via cloud account)
→ UX : juste un scan biométrique

Support 2024 :
→ Apple : Face ID / Touch ID
→ Google : empreinte digitale Android
→ Windows : Windows Hello (visage, empreinte, PIN)
→ Sites : Google, GitHub, Apple, Microsoft, PayPal, eBay...

Démo :
1. Aller sur un site qui supporte les passkeys (ex: github.com)
2. Settings → Password and authentication → Passkeys
3. "Add a passkey"
4. Scan biométrique → créé !
5. Prochaine connexion : scan biométrique → connecté, sans mot de passe
```

## Biométrie — Sécurité et risques

### Types de biométrie

```python
biometrie = {
    "empreinte_digitale": {
        "FAR": "1/50000",  # False Accept Rate (quelqu'un d'autre accepté)
        "FRR": "1/100",    # False Reject Rate (vous rejeté)
        "spoofable": True,  # Réplicable avec latex/gélatine
        "révocable": False, # On ne peut pas changer ses empreintes
        "usage": "Smartphones, laptops, contrôle d'accès"
    },
    "reconnaissance_faciale": {
        "FAR": "1/1000000",  # Face ID Apple
        "FRR": "1/20",
        "spoofable": "Difficile (nécessite modèle 3D)",
        "révocable": False,
        "usage": "Smartphones, surveillance, contrôle d'accès"
    },
    "iris": {
        "FAR": "1/10000000",
        "FRR": "Faible",
        "spoofable": "Très difficile",
        "révocable": False,
        "usage": "Aéroports, accès très sensibles"
    },
    "voix": {
        "FAR": "Variable selon qualité audio",
        "spoofable": True,  # Deepfake audio !
        "révocable": False,
        "usage": "Banking par téléphone, assistants vocaux"
    }
}

# Le problème fondamental de la biométrie :
# Si votre mot de passe est compromis → vous en changez
# Si vos empreintes sont compromises → impossible d'en changer !

# C'est pourquoi la biométrie est utilisée comme facteur LOCAL
# (vérifier que C'EST VOUS qui utilisez votre appareil)
# mais jamais transmise au serveur
```

### Attaques sur la biométrie

```
Presentation Attacks (spoofing) :

Empreinte digitale :
→ Photo haute résolution + moulage latex : bypass possible
→ Protection : détection de vivacité (liveness detection)
  → Capteurs capacitifs vs photo
  → Détection du pouls, de la température

Reconnaissance faciale 2D :
→ Photo du visage : bypass possible sur les moins bons capteurs
→ Protection : Face ID 3D (projection de points infrarouges)
  → Masque en silicone haute qualité : très difficile

Deepfake audio pour la voix :
→ 3 secondes d'audio suffisent pour cloner une voix
→ Cas réel : arnaques CFO via voix deepfake
→ Protection : mots de code aléatoires, détection deepfake

Attaque de base de données :
→ Vol de la base de données des templates biométriques
→ Problème : irréversible (on ne peut pas rechanger ses empreintes)
→ Protection : stocker uniquement des dérivés mathématiques (fuzzy hashing)
```

## MFA avancé — Hiérarchie de sécurité

```python
# Du moins sécurisé au plus sécurisé

mfa_hierarchy = {
    "Niveau 1 - À éviter": {
        "méthode": "SMS OTP",
        "vulnérabilités": [
            "SIM Swapping : pirater votre numéro de téléphone",
            "SS7 attacks : intercepter les SMS",
            "Social engineering de l'opérateur"
        ],
        "recommandation": "Mieux que rien mais éviter pour les comptes critiques"
    },

    "Niveau 2 - Acceptable": {
        "méthode": "TOTP (Google Authenticator, Aegis)",
        "vulnérabilités": [
            "Phishable : une fausse page peut collecter le code en temps réel",
            "Si le téléphone est compromis = TOTP compromis",
            "Pas de protection contre les attaques AiTM"
        ],
        "recommandation": "Bon pour la plupart des usages"
    },

    "Niveau 3 - Recommandé": {
        "méthode": "Passkeys / FIDO2 (biométrie ou hardware key)",
        "vulnérabilités": [
            "Perte de l'appareil (mitigé par recovery codes)",
            "Passkeys cloud : si compte Apple/Google compromis"
        ],
        "recommandation": "Standard recommandé pour 2024+"
    },

    "Niveau 4 - Maximum": {
        "méthode": "YubiKey hardware token (FIDO2 physique)",
        "vulnérabilités": [
            "Perte physique de la clé",
            "Coût (50-100€)"
        ],
        "recommandation": "Comptes critiques : admin, finance, direction"
    }
}
```

## Implémentation MFA robuste

```python
# Django - Implémentation TOTP + WebAuthn

import pyotp
from django.contrib.auth.decorators import login_required

class MFAManager:

    def setup_totp(self, user):
        """Configurer TOTP pour un utilisateur"""
        secret = pyotp.random_base32()
        user.totp_secret = secret  # Stocker chiffré en BDD
        user.save()

        # Générer le QR code pour Google Authenticator
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name="MonBlog"
        )
        return provisioning_uri  # Afficher en QR code

    def verify_totp(self, user, token):
        """Vérifier un code TOTP"""
        if not user.totp_secret:
            return False

        totp = pyotp.TOTP(user.totp_secret)

        # Vérifier avec fenêtre de ±30 secondes
        if not totp.verify(token, valid_window=1):
            return False

        # Anti-replay : vérifier que ce code n'a pas été utilisé
        if token in user.used_totp_tokens:
            return False

        user.used_totp_tokens.append(token)
        user.save()
        return True

    def require_step_up_auth(self, user, action):
        """Demander une ré-authentification pour les actions sensibles"""
        sensitive_actions = ['transfer_money', 'change_password', 'export_data']
        if action in sensitive_actions:
            # Forcer une nouvelle vérification MFA même si déjà connecté
            return not user.recent_mfa_verification()
        return False
```

## Conclusion

L'authentification moderne converge vers le **sans-mot-de-passe** : passkeys résistants au phishing, biométrie locale pour la commodité, et hardware keys pour les comptes ultra-sensibles. La combinaison FIDO2 + biométrie représente le sweet spot : sécurité maximale avec expérience utilisateur optimale. Migrez vos systèmes critiques vers WebAuthn dès aujourd'hui — les mots de passe sont condamnés.

---
*Catégorie : Bonnes pratiques*
