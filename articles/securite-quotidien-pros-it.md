# Sécurité au quotidien pour les professionnels IT : les bons réflexes

Les professionnels IT sont des cibles privilégiées des attaquants — leurs accès privilégiés valent de l'or. Voici les bonnes pratiques à adopter au quotidien pour protéger vos systèmes et votre carrière.

## Gérer ses identifiants

### Un gestionnaire de mots de passe obligatoire

Utiliser le même mot de passe partout est une faute professionnelle en 2025. Chaque service doit avoir un mot de passe unique, long et aléatoire.

**Gestionnaires recommandés :**
- **Bitwarden** : open source, gratuit, auto-hébergeable
- **1Password** : excellent pour les équipes
- **KeePassXC** : local, open source, aucun cloud

```bash
# Exemple avec Bitwarden CLI
bw login
bw generate --length 32 --special  # Générer un mot de passe fort
bw get password "Gmail"
```

### Mots de passe pour les comptes techniques
```bash
# Générer des secrets pour les services
openssl rand -base64 32    # Clé API
openssl rand -hex 32       # Token
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Rotation des clés et tokens
- Faire tourner les clés API tous les 90 jours minimum
- Révoquer immédiatement les clés exposées accidentellement
- Ne jamais commettre de secrets dans Git (utiliser des variables d'environnement)

```bash
# Détecter les secrets dans le code
git-secrets --scan
truffleHog git --since-commit HEAD~10 file://. 
gitleaks detect --source .
```

## Authentification multifacteur

### MFA sur TOUS les comptes privilegiés
- Accès SSH : clés + MFA
- VPN : obligatoire
- Cloud (AWS, Azure) : obligatoire pour les comptes admin
- Email professionnel : obligatoire
- Outils de déploiement (GitHub, GitLab, Ansible) : obligatoire

### Applications MFA recommandées
- **Aegis** (Android, open source)
- **Raivo OTP** (iOS)
- **YubiKey** : clé matérielle FIDO2 (le plus sécurisé)

### Éviter les SMS comme second facteur
Les SMS sont vulnérables au SIM swapping. Préférez les applications TOTP ou les clés matérielles.

## Sécuriser ses accès SSH

```bash
# ~/.ssh/config optimisé
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes

Host prod-server
    HostName 192.168.1.100
    User admin
    Port 2222
    IdentityFile ~/.ssh/id_prod

# Générer une clé Ed25519 (plus sécurisée que RSA)
ssh-keygen -t ed25519 -C "votre.email@example.com" -a 100

# Désactiver l'authentification par mot de passe sur les serveurs
# /etc/ssh/sshd_config
PasswordAuthentication no
PermitRootLogin no
MaxAuthTries 3
Protocol 2
```

## Gérer ses accès cloud en sécurité

### AWS
```bash
# Ne jamais utiliser le compte root pour le quotidien
# Créer des utilisateurs IAM avec le principe du moindre privilège

# Configurer plusieurs profils
aws configure --profile dev
aws configure --profile prod

# Utiliser des rôles IAM plutôt que des clés long terme
# aws sts assume-role pour les accès temporaires

# Vérifier les permissions excessives
aws iam generate-credential-report
aws accessanalyzer list-findings
```

### Vérifier régulièrement ses accès
```bash
# Qui a accès à quoi ?
# Linux
cat /etc/sudoers
grep -r "sudo" /etc/sudoers.d/

# Windows
Get-LocalGroupMember -Group "Administrators"
net localgroup administrators
```

## Sécuriser son poste de travail

### Chiffrement du disque
```bash
# Linux - vérifier si LUKS est actif
lsblk -o NAME,FSTYPE,MOUNTPOINT,UUID,LABEL
sudo cryptsetup status /dev/sda

# Windows - BitLocker
manage-bde -status
```

### Verrouillage automatique
```bash
# Linux - verrouiller après 5 minutes
gsettings set org.gnome.desktop.screensaver lock-enabled true
gsettings set org.gnome.desktop.session idle-delay 300

# Windows GPO
# Computer Configuration → Windows Settings → Security Settings
# → Interactive Logon: Machine inactivity limit = 300 secondes
```

### Mises à jour automatiques
```bash
# Ubuntu - mises à jour automatiques de sécurité
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# Vérifier les CVEs affectant vos packages
# https://security-tracker.debian.org/tracker/
```

## Hygiène des scripts et du code

### Ne jamais faire confiance à un script trouvé en ligne
```bash
# ❌ DANGEREUX
curl https://script-inconnu.com/install.sh | bash

# ✅ CORRECT
curl -O https://script-inconnu.com/install.sh
cat install.sh  # Lire avant d'exécuter !
chmod +x install.sh
./install.sh
```

### Valider les hash des téléchargements
```bash
# Vérifier l'intégrité d'un fichier téléchargé
echo "HASH_OFFICIEL  fichier.tar.gz" | sha256sum -c
```

### Variables d'environnement pour les secrets
```bash
# ❌ Ne jamais mettre en dur dans le code
API_KEY = "sk-1234567890abcdef"

# ✅ Utiliser des variables d'environnement
export API_KEY="sk-1234567890abcdef"
API_KEY = os.getenv("API_KEY")

# Fichier .env (jamais commité dans Git)
echo ".env" >> .gitignore
```

## Veille et formation continue

### Suivre l'actualité sécurité
- **CERT-FR** (cert.ssi.gouv.fr) : alertes officielles françaises
- **NVD** (nvd.nist.gov) : base CVE officielle
- **Bleeping Computer** : actualités malwares
- **Krebs on Security** : journalisme de qualité

### Se former régulièrement
- Pratiquer sur TryHackMe/HackTheBox
- Participer aux CTF
- Lire les write-ups des incidents publics (CrowdStrike, Mandiant reports)

## Checklist quotidienne du professionnel IT

```
□ Poste de travail verrouillé quand je m'éloigne
□ VPN actif sur les réseaux non maîtrisés
□ Mises à jour de sécurité appliquées
□ Accès non utilisés révoqués (ex-collègues, projets terminés)
□ Sauvegardes vérifiées
□ Logs consultés pour anomalies
□ Aucun secret dans le code commité aujourd'hui
```

## Conclusion

La sécurité au quotidien n'est pas une contrainte mais une discipline professionnelle. Un professionnel IT qui ne protège pas ses propres accès met en danger toute l'organisation. Ces bonnes pratiques, une fois ancrées, deviennent des réflexes naturels qui font toute la différence lors d'une tentative d'attaque.
