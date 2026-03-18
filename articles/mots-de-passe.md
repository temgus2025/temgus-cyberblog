# Mots de passe : créer et gérer des mots de passe forts

Les mots de passe sont la première ligne de défense de vos comptes en ligne. Pourtant, "123456" reste le mot de passe le plus utilisé au monde en 2024. Ce guide vous explique comment créer des mots de passe inviolables et les gérer sans vous en souvenir.

## Pourquoi vos mots de passe actuels sont probablement faibles

### Les attaques contre les mots de passe

**Attaque par dictionnaire :**
```
L'attaquant teste des millions de mots courants et variantes :
password, Password, P@ssword, p4ssword, password123...
```

**Attaque par force brute :**
```
Temps pour cracker un mot de passe avec un GPU moderne (RTX 4090) :

6 caractères (minuscules)      : instantané
8 caractères (minuscules)      : 22 secondes
8 caractères (mixte + chiffres): 1 heure
10 caractères (mixte + symboles): 5 ans
12 caractères (mixte + symboles): 34 000 ans
20 caractères aléatoires       : pratiquement impossible
```

**Credential Stuffing :**
```
1. Base de données hackée (ex: LinkedIn 2021 - 700M comptes)
         ↓
2. Les identifiants sont vendus sur le dark web
         ↓
3. Attaquant teste ces identifiants sur d'autres services
         ↓
4. Si vous réutilisez le même mot de passe → Tous vos comptes compromis
```

## Les règles d'or des mots de passe

### Règle 1 : Longueur avant tout

```
❌ Court et complexe  : "P@5$w0rd"     (8 chars - crackable en 1h)
✅ Long et simple     : "cheval-correcte-batterie-agrafe" (30 chars - des milliers d'années)
✅ Long et complexe   : "xK9#mP2$nR5@vL8!" (16 chars - très solide)
```

### Règle 2 : Un mot de passe unique par service

```
❌ Mauvaise pratique :
   Gmail       → "MonMotDePasse123"
   Facebook    → "MonMotDePasse123"  ← Si Gmail est compromis, Facebook l'est aussi
   Amazon      → "MonMotDePasse123"

✅ Bonne pratique :
   Gmail       → "xK9#mP2$nR5@vL8!"
   Facebook    → "7$tY4@nQ8#wZ2&pM"
   Amazon      → "3@hR6$kV1#mX9@bN"
```

### Règle 3 : Jamais d'informations personnelles

```
❌ À éviter absolument :
   - Votre prénom/nom
   - Date de naissance
   - Nom de votre animal
   - Ville natale
   - Équipe de foot favorite

Ces informations sont trouvables sur vos réseaux sociaux !
```

## Les méthodes pour créer de bons mots de passe

### Méthode 1 : Phrase de passe (Passphrase)

Choisissez 4-6 mots aléatoires séparés par des tirets :

```
"cheval-correcte-batterie-agrafe-violet-soleil"

✅ 46 caractères
✅ Facile à retenir
✅ Quasi-impossible à cracker
✅ Résistant aux attaques par dictionnaire
```

### Méthode 2 : Génération aléatoire

```bash
# Générer un mot de passe aléatoire en ligne de commande

# Linux/Mac
openssl rand -base64 16
# Résultat : K7mP9xQ2nR5vL8wT

# Python
python3 -c "import secrets, string; print(''.join(secrets.choice(string.ascii_letters + string.digits + '!@#$%^&*') for _ in range(20)))"

# PowerShell (Windows)
-join ((65..90) + (97..122) + (48..57) + (33..47) | Get-Random -Count 20 | ForEach-Object {[char]$_})
```

### Méthode 3 : Acronyme d'une phrase

```
Phrase : "Mon chat s'appelle Moustache et il a 5 ans !"
Acronyme : "Mcs'aMeia5a!"

✅ 12 caractères avec majuscules, minuscules, chiffres et symboles
✅ Facile à retenir si vous connaissez la phrase
```

## Les gestionnaires de mots de passe

La solution ultime : **un seul mot de passe maître** pour accéder à tous vos autres mots de passe, générés et stockés automatiquement.

### Comparatif des meilleurs gestionnaires

| Gestionnaire | Type | Prix | Open Source |
|-------------|------|------|-------------|
| **Bitwarden** | Cloud | Gratuit / 10$/an | ✅ Oui |
| **KeePassXC** | Local | Gratuit | ✅ Oui |
| **1Password** | Cloud | 3$/mois | ❌ Non |
| **Dashlane** | Cloud | 4$/mois | ❌ Non |
| ProtonPass | Cloud | Gratuit / 4$/mois | ✅ Oui |

### Bitwarden — La recommandation

```
✅ Gratuit et open source
✅ Chiffrement AES-256 de bout en bout
✅ Synchronisation multi-appareils
✅ Extension navigateur (auto-remplissage)
✅ Application mobile
✅ Générateur de mots de passe intégré
✅ Peut être auto-hébergé
```

**Installation :**
```bash
# Auto-hébergement avec Docker
docker run -d --name bitwarden \
  -e SIGNUPS_ALLOWED=false \
  -v /opt/bitwarden/data:/data \
  -p 80:80 \
  vaultwarden/server:latest
```

### KeePassXC — Pour les puristes

KeePassXC stocke vos mots de passe dans un **fichier chiffré local** — rien dans le cloud.

```
Base de données KeePassXC (.kdbx)
    ├── Chiffrée avec AES-256
    ├── Protégée par mot de passe maître
    └── Optionnellement + fichier clé physique (clé USB)
```

## L'authentification à deux facteurs (2FA)

Un mot de passe fort + 2FA = protection maximale. Même si votre mot de passe est volé, l'attaquant ne peut pas se connecter sans le second facteur.

### Les types de 2FA

```
SMS (⚠️ Faible)
→ Vulnérable au SIM swapping
→ À utiliser si rien d'autre n'est disponible

Application TOTP (✅ Recommandé)
→ Aegis (Android), Raivo (iOS), Authy
→ Code qui change toutes les 30 secondes
→ Fonctionne hors ligne

Clé physique (✅✅ Meilleur)
→ YubiKey, Google Titan
→ Impossible à phisher
→ Idéal pour comptes critiques
```

### Configurer TOTP avec Python

```python
import pyotp
import time

# Générer un secret TOTP
secret = pyotp.random_base32()
print(f"Secret : {secret}")

# Créer un objet TOTP
totp = pyotp.TOTP(secret)

# Générer le code actuel (change toutes les 30 secondes)
print(f"Code actuel : {totp.now()}")

# Vérifier un code saisi
code_saisi = input("Entrez le code : ")
if totp.verify(code_saisi):
    print("Code valide !")
else:
    print("Code invalide ou expiré")
```

## Vérifier si vos comptes ont été compromis

```
Sites à consulter :
→ https://haveibeenpwned.com
   Entrez votre email pour savoir si vos données
   ont été exposées dans des fuites

→ https://monitor.firefox.com
   Surveillance continue de votre email

→ https://dehashed.com
   Recherche avancée (payant)
```

## Plan d'action immédiat

```
Priorité 1 — Cette semaine
✅ Installer Bitwarden (gratuit)
✅ Changer les mots de passe de : email, banque, réseaux sociaux
✅ Activer le 2FA sur ces mêmes comptes

Priorité 2 — Ce mois
✅ Migrer TOUS vos mots de passe dans Bitwarden
✅ Remplacer les mots de passe réutilisés
✅ Vérifier haveibeenpwned.com

Priorité 3 — Continu
✅ Utiliser le générateur Bitwarden pour tout nouveau compte
✅ Ne jamais réutiliser un mot de passe
✅ Renouveler les mots de passe critiques tous les 6 mois
```

## Conclusion

La gestion des mots de passe n'est pas une contrainte — c'est une habitude à prendre une fois. Avec un gestionnaire comme **Bitwarden**, vous n'avez plus qu'UN seul mot de passe à retenir, et tous vos comptes sont protégés par des mots de passe uniques et forts. C'est l'investissement sécurité le plus rentable que vous puissiez faire.

---
*Article suivant : [Ingénierie sociale : manipuler l'humain](../articles/ingenierie-sociale)*
