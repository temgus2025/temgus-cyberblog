# Sécuriser sa maison connectée : le guide complet

Caméras, télévisions, box domotique, enceintes connectées — nos maisons sont devenues de véritables réseaux informatiques. Pourtant, la sécurité y est souvent négligée. Voici comment transformer votre domicile en forteresse numérique.

## L'état des lieux inquiétant

Des millions d'objets connectés (IoT) sont accessibles directement depuis Internet avec des identifiants par défaut. Des moteurs de recherche comme Shodan indexent des caméras, routeurs et imprimantes accessibles publiquement.

**Risques concrets :**
- Espionnage via caméras mal sécurisées
- Utilisation de votre connexion pour des attaques DDoS (botnet Mirai)
- Accès à votre réseau domestique depuis un appareil IoT compromis
- Vol de données personnelles

## Sécuriser votre box/routeur

### Changer les identifiants par défaut
```
❌ admin / admin
❌ admin / password  
❌ admin / 1234

✅ Utilisateur unique + mot de passe 20 caractères aléatoires
```

### Mettre à jour le firmware
Vérifiez régulièrement les mises à jour de votre routeur. Les fabricants publient des correctifs pour les vulnérabilités critiques.

### Désactiver les fonctionnalités inutiles
```
☐ UPnP (Universal Plug and Play) → DÉSACTIVER
☐ WPS (Wi-Fi Protected Setup) → DÉSACTIVER (vulnérable)
☐ Administration à distance → DÉSACTIVER sauf besoin
☐ Telnet → DÉSACTIVER (remplacé par SSH)
```

### Configuration DNS sécurisée
```
DNS primaire   : 9.9.9.9 (Quad9 - filtrage malwares)
DNS secondaire : 149.112.112.112

Ou : 1.1.1.2 / 1.0.0.2 (Cloudflare avec filtrage malwares)
```

## Sécuriser le Wi-Fi

### Protocole de chiffrement
```
❌ WEP (cassable en minutes)
❌ WPA (trop ancien)
⚠️ WPA2 (acceptable mais WPA3 préférable)
✅ WPA3 (standard actuel recommandé)
```

### Mot de passe Wi-Fi
```bash
# Générer un mot de passe Wi-Fi fort
python3 -c "import secrets; print(secrets.token_urlsafe(16))"
# Exemple : K9mX2pLqR7nW4vYj

# Minimum recommandé : 15 caractères, mixte lettres/chiffres
```

### Masquer le SSID ?
Masquer le SSID (nom du réseau) n'est pas une vraie sécurité — tout outil de scan le révèle en quelques secondes. Cela rend surtout la connexion plus pénible. Inutile.

### Réseau invités séparé
Créez un réseau Wi-Fi séparé pour vos invités ET vos objets connectés IoT.

```
Réseau principal : famille / téléphones / ordinateurs
Réseau IoT       : télévision, enceinte, caméras, aspirateur robot
Réseau invités   : visiteurs (accès Internet uniquement)
```

**Pourquoi séparer l'IoT ?** Si votre téléviseur est compromis, il ne peut pas accéder à vos ordinateurs sur le réseau principal.

## Sécuriser les objets connectés

### Règle d'or : inventoriez vos appareils
```bash
# Scanner votre réseau pour lister tous les appareils
nmap -sn 192.168.1.0/24

# Ou utiliser l'interface de votre routeur
# (liste des appareils connectés)
```

### Pour chaque appareil IoT
```
✓ Changer le mot de passe par défaut
✓ Mettre à jour le firmware
✓ Désactiver les fonctionnalités non utilisées
✓ Vérifier si des données sont envoyées au fabricant
✓ Isoler sur le réseau IoT
```

### Caméras de surveillance
```
✓ Mot de passe fort et unique
✓ Chiffrement activé
✓ Accès à distance via VPN uniquement (pas de port forwarding !)
✓ Marques reconnues (Axis, Hanwha, pas les marques inconnues < 20€)
✓ Firmware à jour
✗ Ne jamais exposer directement sur Internet
```

## Sécuriser les comptes en ligne

### Mots de passe uniques partout
Utilisez un gestionnaire de mots de passe (Bitwarden, gratuit) pour générer et stocker des mots de passe uniques pour chaque service.

### Activer le MFA sur les comptes importants
```
Priorité absolue :
□ Email principal (Gmail, Outlook)
□ Compte Apple ID / Google
□ Banque en ligne
□ Réseaux sociaux
□ Amazon, PayPal
□ Opérateur téléphonique
```

### Vérifier si vos données ont fuité
- **haveibeenpwned.com** : vérifiez si votre email est dans des fuites
- **Firefox Monitor** : alertes automatiques
- Activez les alertes de connexion suspecte sur vos comptes importants

## Protection contre le phishing

### Signaux d'alerte
```
✗ Email urgent demandant une action immédiate
✗ Lien vers une URL qui ne correspond pas au domaine officiel
✗ Demande d'informations sensibles (mot de passe, code SMS)
✗ Pièce jointe inattendue
✗ Expéditeur inconnu ou légèrement différent du vrai (amaz0n.com)
```

### Vérifier un lien avant de cliquer
```bash
# Copier l'URL (sans cliquer) et vérifier sur :
# - VirusTotal.com
# - URLvoid.com
# - Google Safe Browsing
```

### Extensions navigateur recommandées
- **uBlock Origin** : bloqueur de publicités et de trackers
- **Privacy Badger** : bloqueur de trackers
- **HTTPS Everywhere** : force HTTPS
- **Bitwarden** : gestionnaire de mots de passe intégré

## Sauvegardes domestiques

### Règle 3-2-1
```
3 copies de vos données importantes
2 supports différents (disque dur + NAS)
1 copie hors site (cloud chiffré ou chez un proche)
```

### Solutions recommandées
```bash
# Sauvegarde automatique Linux avec rsync
rsync -avz --delete ~/Documents/ /media/backup/Documents/

# Chiffrement avant envoi cloud
# Cryptomator (gratuit) : chiffre les fichiers avant Dropbox/Google Drive

# NAS domestique
# Synology DS223 (~350€) : solution complète et simple
```

## Que faire en cas d'incident

### Comportement suspect sur le réseau
1. Identifier l'appareil concerné (logs routeur)
2. L'isoler du réseau (déconnecter le câble ou exclure du Wi-Fi)
3. Changer les mots de passe Wi-Fi
4. Faire une réinitialisation d'usine de l'appareil suspect
5. Remettre à jour le firmware avant de reconnecter

### Compte piraté
1. Changer immédiatement le mot de passe depuis un autre appareil
2. Activer le MFA si pas déjà fait
3. Vérifier les sessions actives et les déconnecter
4. Vérifier si des données ont été modifiées (emails envoyés, achats...)
5. Signaler à la plateforme concernée

## Conclusion

Sécuriser sa maison connectée ne demande pas d'être expert en cybersécurité. Les mesures de base — mots de passe forts, MFA, réseaux séparés, mises à jour — couvrent 90% des risques. L'essentiel est d'y consacrer quelques heures une fois, puis de maintenir ces bonnes pratiques au quotidien.
