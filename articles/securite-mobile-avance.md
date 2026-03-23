# Sécurité mobile avancée : pentest Android et iOS

Les smartphones contiennent nos données les plus personnelles. Ce guide couvre les techniques avancées de pentest mobile : analyse d'applications Android/iOS, interception de trafic et analyse forensique mobile.

## Architecture de sécurité mobile

```
Android - Modèle de sécurité :
→ Linux kernel + SELinux
→ Application sandbox (chaque app dans son propre UID)
→ Permissions explicites (runtime permissions Android 6+)
→ Verified Boot (chaîne de confiance hardware → kernel → système)
→ Play Protect : scan des apps

iOS - Modèle de sécurité :
→ Secure Enclave (puce dédiée pour les clés et biométrie)
→ App Store review + code signing obligatoire
→ Sandboxing strict (plus restrictif qu'Android)
→ Data Protection : chiffrement par classe selon verrouillage
→ Pas de jailbreak = surface d'attaque très réduite
```

## Pentest Android

### Environnement de test

```bash
# Prérequis
adb --version         # Android Debug Bridge
apktool --version     # Décompiler APK
jadx --version        # Décompiler APK en Java
frida --version       # Framework d'instrumentation dynamique

# Connecter un appareil de test (USB Debugging activé)
adb devices
adb shell

# Ou utiliser un émulateur (Android Studio / Genymotion)
# Genymotion recommandé (plus facile à rooter)
```

### Analyse statique d'une APK

```bash
# 1. Extraire l'APK
adb shell pm list packages | grep target
adb shell pm path com.target.app
# → package:/data/app/com.target.app-1/base.apk
adb pull /data/app/com.target.app-1/base.apk ./target.apk

# 2. Décompiler avec APKTool
apktool d target.apk -o target_decoded
# → AndroidManifest.xml décodé
# → resources/ (layouts, strings)
# → smali/ (code Dalvik)

# 3. Analyser le Manifest
cat target_decoded/AndroidManifest.xml
# Red flags :
# → android:allowBackup="true" (backup non sécurisé)
# → android:debuggable="true" (debug activé en prod)
# → exported="true" sur des activités sensibles
# → permissions excessives

# 4. Décompiler en Java avec JADX
jadx target.apk -d target_java
# Chercher des informations sensibles
grep -r "password\|secret\|api_key\|token" target_java/ -l
grep -r "http://" target_java/ | grep -v "//schemas"  # HTTP non chiffré
grep -r "Log.d\|Log.e" target_java/ | head -20       # Logs de debug
```

### Interception du trafic (MitM)

```bash
# Burp Suite + proxy Android

# 1. Configurer Burp comme proxy
# Burp → Proxy → Options → Add listener sur 8080

# 2. Configurer Android pour utiliser le proxy
# WiFi Settings → Modifier réseau → Proxy manuel → IP:8080

# 3. Installer le certificat Burp
# Android < 7 : installer le CA Burp directement
# Android >= 7 : nécessite root ou VPN-based proxy

# Avec Frida pour bypasser la Certificate Pinning
frida -U -f com.target.app -l ssl_pinning_bypass.js

# Script ssl_pinning_bypass.js (simplifié)
Java.perform(function() {
    var array_list = Java.use("java.util.ArrayList");
    var TrustManager = Java.use('com.android.org.conscrypt.TrustManagerImpl');
    TrustManager.checkTrustedRecursive.implementation = function(a,b,c,d,e,f) {
        console.log('Bypassed SSL Pinning !');
        return array_list.$new();
    };
});
```

### Analyse dynamique avec Frida

```javascript
// Frida - Hooker les méthodes Java en temps réel

Java.perform(function() {

    // Hooker une méthode de login
    var LoginActivity = Java.use('com.target.app.LoginActivity');
    LoginActivity.login.implementation = function(username, password) {
        console.log('[*] Login called!');
        console.log('[*] Username: ' + username);
        console.log('[*] Password: ' + password);

        // Appeler la méthode originale
        return this.login(username, password);
    };

    // Hooker la cryptographie
    var SecretKeySpec = Java.use('javax.crypto.spec.SecretKeySpec');
    SecretKeySpec.$init.overload('[B', 'java.lang.String').implementation = function(key, algo) {
        console.log('[*] Crypto key: ' + bytesToHex(key));
        console.log('[*] Algorithm: ' + algo);
        return this.$init(key, algo);
    };

    // Bypasser la vérification de root
    var RootBeer = Java.use('com.scottyab.rootbeer.RootBeer');
    RootBeer.isRooted.implementation = function() {
        console.log('[*] isRooted called - returning false');
        return false;
    };
});
```

## Pentest iOS

```bash
# Nécessite un iPhone jailbreaké pour le pentest complet

# Outils essentiels
# → Objection (basé sur Frida, multi-plateformes)
# → idb (iOS App Security Assessment Tool)
# → Clutch (décryptage des apps)

# Installer Objection
pip3 install objection

# Lancer une session Objection
objection -g "com.target.app" explore

# Commandes Objection
ios sslpinning disable       # Bypasser SSL pinning
ios jailbreak simulate       # Simuler pas de jailbreak
ios keychain dump            # Extraire le keychain
ios pasteboard monitor       # Surveiller le presse-papier
ios nsurlcredentialstorage dump  # Credentials stockés
ios heap search instances    # Chercher des objets en mémoire
```

## OWASP Mobile Top 10

```
M1 - Utilisation incorrecte des plateformes
→ Mauvaise gestion des intents Android, permissions excessives

M2 - Stockage non sécurisé des données
→ Données sensibles dans SharedPreferences, SQLite non chiffré
→ Logs avec informations sensibles

M3 - Communication non sécurisée
→ HTTP, SSL pinning absent, certificats non validés

M4 - Authentification non sécurisée
→ Tokens stockés non chiffrés, biométrie mal implémentée

M5 - Cryptographie insuffisante
→ Algorithmes obsolètes (MD5, DES), clés hardcodées

M6 - Autorisation non sécurisée
→ IDOR dans l'API, vérifications d'autorisation côté client

M7 - Qualité du code client
→ Décompilation révèle la logique business, reverse engineering facile

M8 - Falsification du code
→ Pas de vérification d'intégrité, facile à modifier/repackager

M9 - Reverse Engineering
→ Pas d'obfuscation, symboles de debug présents

M10 - Fonctionnalités superflues
→ Backdoors de test en production, logs de debug activés
```

## Conclusion

La sécurité mobile est un domaine en évolution constante. Android et iOS ont des modèles de sécurité robustes, mais les applications qui tournent dessus peuvent introduire des vulnérabilités. Le pentest mobile combine analyse statique (manifest, code décompilé), analyse dynamique (Frida, Objection) et test réseau (interception TLS). La maîtrise des outils comme Frida ouvre des possibilités d'analyse très puissantes pour tout chercheur en sécurité.

---
*Catégorie : Pentest*
