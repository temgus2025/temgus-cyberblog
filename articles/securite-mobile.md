# Sécurité mobile : Android et iOS

Nos smartphones contiennent nos emails, photos, coordonnées bancaires, localisation et bien plus. Pourtant, la sécurité mobile est souvent négligée. Ce guide couvre les menaces spécifiques aux plateformes mobiles et les meilleures pratiques de protection.

## Android vs iOS : architectures de sécurité

### iOS — Écosystème fermé

```
Avantages sécurité iOS :
✅ App Store contrôlé (revue manuelle d'Apple)
✅ Mises à jour simultanées sur tous les appareils
✅ Secure Enclave (puce dédiée aux secrets)
✅ Sandbox strict entre les apps
✅ Pas de sideloading par défaut
✅ Chiffrement complet activé par défaut

Limites :
→ Dépendance totale à Apple
→ Moins de contrôle utilisateur
→ Sideloading possible depuis iOS 17 (Europe - DMA)
```

### Android — Écosystème ouvert

```
Avantages sécurité Android :
✅ Android Security Bulletins mensuels
✅ Google Play Protect (scan d'applications)
✅ StrongBox (équivalent Secure Enclave sur Android 9+)
✅ Verified Boot
✅ Plus de contrôle utilisateur

Défis :
→ Fragmentation : des millions d'appareils sans mises à jour
→ APKs depuis sources tierces (sideloading facile)
→ Délai des mises à jour selon les fabricants
```

## Les menaces mobiles courantes

### 1. Applications malveillantes

```
Types d'apps malveillantes :
→ Faux antivirus (demandent des permissions excessives)
→ Clones d'apps légitimes (WhatsApp, banking apps)
→ Adwares (publicités agressives + collecte de données)
→ Stalkerware (surveillance à l'insu de la victime)
→ Apps dropper (sembent légitimes puis téléchargent un malware)
```

**Exemple de permissions suspectes :**
```
Application : "Lampe de poche"
Permissions demandées :
❌ Accès aux contacts
❌ Accès à la localisation
❌ Accès aux SMS
❌ Accès au microphone
❌ Accès à la caméra

Une lampe de poche n'a besoin d'AUCUNE de ces permissions !
```

### 2. Phishing mobile

```
Vecteurs spécifiques au mobile :
→ SMS phishing (smishing) : "Votre colis est bloqué"
→ WhatsApp : messages de "contacts" compromis
→ Notifications push frauduleuses
→ QR codes malveillants
→ Faux WiFi avec portail captif frauduleux
```

### 3. Spyware et stalkerware

```bash
# Signes d'infection par spyware :
→ Batterie qui se décharge anormalement vite
→ Téléphone chaud sans utilisation
→ Consommation data inhabituelle
→ Apps inconnues dans la liste
→ Le téléphone s'allume seul

# Vérifier les apps suspectes Android
adb shell pm list packages -f
# Comparer avec la liste des apps installées via l'interface
```

### 4. Attaques via réseau

```
Man-in-the-Middle sur WiFi public :
1. Attaquant crée un faux point d'accès "CafeWifi"
2. Votre téléphone s'y connecte automatiquement
3. Attaquant intercepte le trafic non chiffré
4. Vol de cookies, credentials, données

Protection : VPN toujours actif sur les réseaux publics
```

### 5. Exploits zero-day

**Pegasus** (NSO Group) — l'exemple le plus célèbre :
```
Pegasus est un spyware capable de :
→ Lire tous les messages (WhatsApp, Signal, iMessage)
→ Activer micro et caméra à distance
→ Récupérer tous les fichiers
→ Suivre la localisation en temps réel
→ S'installer via "zero-click" (sans interaction utilisateur)

Cibles : journalistes, activistes, chefs d'état
Prix : millions de dollars par licence
```

## Sécuriser votre smartphone

### Configuration de base

```
iOS :
✅ iOS à jour (Réglages → Général → MàJ logiciel)
✅ Face ID / Touch ID activé
✅ Code à 6 chiffres minimum (ou alphanumérique)
✅ "Effacer données" après 10 tentatives
✅ Chiffrement iCloud avec Advanced Data Protection
✅ Localiser mon iPhone activé
✅ Accès restrictions sur l'écran verrouillé

Android :
✅ Android à jour + patches sécurité récents
✅ Empreinte / reconnaissance faciale
✅ Chiffrement activé (Settings → Security)
✅ Google Play Protect activé
✅ Sources inconnues désactivées
✅ Find My Device activé
✅ Verrouillage SIM (code PIN SIM)
```

### Gestion des permissions

```
Principe du moindre privilège pour les apps :

Android :
Paramètres → Applications → [App] → Permissions
→ N'accorder que les permissions nécessaires
→ Préférer "Seulement pendant l'utilisation" pour localisation
→ Refuser l'accès aux contacts/SMS si non nécessaire

iOS :
Réglages → Confidentialité → [Permission]
→ Voir toutes les apps qui ont accès
→ Révoquer les accès inutiles
→ "Demander chaque fois" pour la localisation des apps peu utilisées
```

### Chiffrement des communications

```
Applications de messagerie par niveau de sécurité :

🔒🔒🔒 Maximum :
→ Signal : chiffrement E2E, messages éphémères, open source
→ Session : pas de numéro de téléphone requis, décentralisé

🔒🔒 Bon :
→ WhatsApp : E2E (protocole Signal) mais métadonnées collectées par Meta
→ iMessage : E2E entre appareils Apple, SMS non chiffré sinon

🔒 Acceptable :
→ Telegram : E2E seulement dans "Secret Chats", pas par défaut !
→ Messages standard : SMS/RCS non chiffrés

❌ À éviter pour données sensibles :
→ Facebook Messenger (sans mode secret)
→ Snapchat (stockage serveur)
```

### Authentification mobile sécurisée

```
2FA sur mobile :

✅ Application TOTP (Aegis sur Android, Raivo sur iOS)
   → Codes valides 30 secondes
   → Fonctionne hors ligne
   → Sauvegardez vos seeds TOTP !

✅ Passkeys (FIDO2)
   → Remplace les mots de passe par la biométrie
   → Résistant au phishing
   → Supporté par iOS 16+ et Android 9+

⚠️ SMS 2FA
   → Vulnérable au SIM swapping
   → Mieux que rien, mais éviter pour les comptes critiques

❌ Pas de 2FA
   → À ne jamais faire pour email, banque, réseaux sociaux
```

## SIM Swapping : une menace sous-estimée

```
Comment ça fonctionne :

1. L'attaquant collecte vos infos (nom, adresse, date naissance)
   via OSINT (réseaux sociaux, fuites de données)
         ↓
2. Appelle votre opérateur en se faisant passer pour vous
   "J'ai perdu mon téléphone, je veux transférer mon numéro"
         ↓
3. Convainc l'opérateur de porter votre numéro sur sa SIM
         ↓
4. Reçoit tous vos SMS, y compris les codes 2FA
         ↓
5. Réinitialise vos mots de passe via "SMS reçu"
         ↓
6. Accès à : email, banque, crypto, réseaux sociaux
```

**Protection :**
```
✅ Mettre un code PIN SIM chez votre opérateur
✅ Activer les alertes de changement de SIM
✅ Utiliser TOTP au lieu de SMS pour le 2FA
✅ Minimiser les informations personnelles en ligne
✅ Utiliser un numéro virtuel pour les inscriptions (Google Voice)
```

## Analyse d'une app Android

```bash
# Analyser une APK suspecte
# Extraire l'APK
adb shell pm path com.exemple.app
adb pull /data/app/com.exemple.app/base.apk

# Décompiler avec apktool
apktool d base.apk -o app_decompiled/

# Analyser le code avec jadx
jadx base.apk

# Vérifier les permissions déclarées
cat app_decompiled/AndroidManifest.xml | grep "uses-permission"

# Analyser avec MobSF (Mobile Security Framework)
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf
# Uploader l'APK sur http://localhost:8000
# Génère un rapport complet : permissions, API calls, secrets hardcodés, etc.
```

## Checklist sécurité mobile

```
Système
✅ OS et apps à jour
✅ Verrouillage biométrique + code fort
✅ Chiffrement activé
✅ Find my device activé

Applications
✅ Seulement depuis stores officiels
✅ Permissions minimales accordées
✅ Apps inutilisées supprimées
✅ Play Protect / App Store review activé

Communications
✅ Signal pour les conversations sensibles
✅ VPN sur les réseaux publics
✅ 2FA TOTP sur tous les comptes importants

Données
✅ Sauvegarde chiffrée activée
✅ Données sensibles pas dans les notes standard
✅ Gestionnaire de mots de passe installé
```

## Conclusion

La sécurité mobile repose sur trois axes : **mises à jour régulières, contrôle des permissions et communications chiffrées**. Signal + Bitwarden + un VPN couvrent la majorité des besoins de sécurité pour un utilisateur standard. Pour une protection maximale, les passkeys représentent l'avenir de l'authentification mobile.

---
*Article suivant : [Dark Web : mythes et réalités](../articles/dark-web)*
