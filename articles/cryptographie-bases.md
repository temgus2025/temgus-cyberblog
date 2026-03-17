# Cryptographie : chiffrer ses données efficacement

La cryptographie est la science du secret. Elle protège vos communications, vos mots de passe, vos transactions bancaires et vos données stockées. Comprendre ses bases vous permet de faire des choix éclairés pour sécuriser vos informations.

## Qu'est-ce que la cryptographie ?

La cryptographie transforme des données **lisibles** (texte en clair) en données **illisibles** (texte chiffré) à l'aide d'un algorithme et d'une clé. Seul quelqu'un possédant la bonne clé peut déchiffrer le message.

```
Texte clair  : "Mot de passe : Admin123"
     +
Algorithme   : AES-256
     +
Clé secrète  : x7K#mP9$qL2@nR5v
     ↓
Texte chiffré: 8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c
```

## Les deux grandes familles de chiffrement

### Chiffrement symétrique

La **même clé** sert à chiffrer ET à déchiffrer. C'est rapide et efficace pour de grandes quantités de données.

```
Expéditeur                    Destinataire
    |                              |
    |--- [CLÉ SECRÈTE PARTAGÉE] ---|
    |                              |
Chiffre avec la clé          Déchiffre avec la clé
```

**Algorithmes principaux :**

| Algorithme | Taille clé | Usage |
|------------|-----------|-------|
| AES-128 | 128 bits | Standard actuel |
| AES-256 | 256 bits | Haute sécurité |
| ChaCha20 | 256 bits | Mobile/embarqué |
| 3DES | 168 bits | Obsolète (éviter) |

**Problème :** comment partager la clé secrète de façon sécurisée ?

```python
# Exemple de chiffrement AES en Python
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64

# Générer une clé aléatoire
cle = get_random_bytes(32)  # 256 bits

# Chiffrer
cipher = AES.new(cle, AES.MODE_GCM)
texte_chiffre, tag = cipher.encrypt_and_digest(b"Message secret")

print(f"Chiffré : {base64.b64encode(texte_chiffre).decode()}")
```

### Chiffrement asymétrique

Utilise **deux clés mathématiquement liées** :
- **Clé publique** : partagée librement, sert à chiffrer
- **Clé privée** : gardée secrète, sert à déchiffrer

```
        Clé publique de Bob
              ↓
Alice chiffre le message ──→ Message chiffré ──→ Bob déchiffre
                                                  avec sa clé privée
```

**Analogie :** la clé publique est comme un cadenas ouvert que vous distribuez. N'importe qui peut fermer le cadenas (chiffrer), mais seul vous avez la clé pour l'ouvrir (déchiffrer).

**Algorithmes principaux :**

| Algorithme | Usage | Recommandation |
|------------|-------|----------------|
| RSA-2048 | Chiffrement, signatures | Acceptable |
| RSA-4096 | Chiffrement haute sécurité | Recommandé |
| ECDSA | Signatures numériques | Excellent |
| Ed25519 | SSH, signatures | Meilleur choix actuel |

```bash
# Générer une paire de clés RSA avec OpenSSL
openssl genrsa -out cle_privee.pem 4096
openssl rsa -in cle_privee.pem -pubout -out cle_publique.pem

# Chiffrer un fichier avec la clé publique
openssl rsautl -encrypt -pubin -inkey cle_publique.pem \
  -in message.txt -out message_chiffre.bin

# Déchiffrer avec la clé privée
openssl rsautl -decrypt -inkey cle_privee.pem \
  -in message_chiffre.bin -out message_dechiffre.txt
```

### La combinaison : chiffrement hybride

En pratique, on combine les deux :
1. On génère une clé symétrique aléatoire (rapide pour chiffrer les données)
2. On chiffre cette clé avec la clé publique du destinataire (asymétrique)

C'est exactement ce que fait **TLS/HTTPS** !

## Les fonctions de hachage

Une fonction de hachage transforme n'importe quelle donnée en une **empreinte de taille fixe**. Ce n'est pas du chiffrement car c'est **irréversible** — on ne peut pas retrouver la donnée originale.

```
"Bonjour"        → SHA-256 → 7f83b1657ff1fc53b92dc18148a1d65...
"Bonjour."       → SHA-256 → ef0c748df4da50a8d6b284f7ca943...
"bonjour"        → SHA-256 → 9b74c9897bac770ffc029102a200c5...
```

**Propriétés importantes :**
- Même entrée → toujours même sortie
- Moindre modification → empreinte complètement différente
- Impossible de retrouver l'entrée depuis l'empreinte
- Extrêmement difficile de trouver deux entrées avec la même empreinte

**Algorithmes :**

| Algorithme | Taille | Statut |
|------------|--------|--------|
| MD5 | 128 bits | ⛔ Cassé, ne plus utiliser |
| SHA-1 | 160 bits | ⛔ Cassé, ne plus utiliser |
| SHA-256 | 256 bits | ✅ Standard actuel |
| SHA-3 | Variable | ✅ Excellent |
| bcrypt | Variable | ✅ Idéal pour mots de passe |

### Hachage des mots de passe

Les mots de passe ne doivent **jamais** être stockés en clair. On stocke leur empreinte.

```python
import bcrypt

# Hacher un mot de passe (avec salt automatique)
mot_de_passe = b"MonMotDePasse123"
hash_mdp = bcrypt.hashpw(mot_de_passe, bcrypt.gensalt(rounds=12))

print(f"Hash stocké : {hash_mdp}")
# Hash stocké : $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/...

# Vérifier un mot de passe
if bcrypt.checkpw(mot_de_passe, hash_mdp):
    print("Mot de passe correct !")
```

> **Pourquoi bcrypt et pas SHA-256 ?** bcrypt est intentionnellement lent, ce qui rend les attaques par force brute très coûteuses en temps.

## Les signatures numériques

Une signature numérique prouve **l'authenticité et l'intégrité** d'un document. Elle utilise la clé **privée** pour signer et la clé **publique** pour vérifier.

```
Alice signe :
Document + Clé privée d'Alice → Signature numérique

Bob vérifie :
Document + Signature + Clé publique d'Alice → Valide / Invalide
```

**Utilisations :**
- Certificats SSL/TLS (HTTPS)
- Signatures d'emails (S/MIME, PGP)
- Mises à jour logicielles
- Transactions blockchain

```bash
# Signer un fichier avec GPG
gpg --sign --armor document.pdf

# Vérifier une signature
gpg --verify document.pdf.asc
```

## TLS/HTTPS : la cryptographie en action

Quand vous vous connectez à un site HTTPS, voici ce qui se passe en coulisses :

```
1. Votre navigateur → Serveur : "Bonjour, je supporte TLS 1.3"
2. Serveur → Navigateur : Certificat (clé publique + identité)
3. Navigateur : Vérifie le certificat auprès d'une autorité de confiance
4. Échange de clés : Génération d'une clé de session secrète
5. Communication chiffrée avec AES-256
```

**Vérifier un certificat SSL :**
```bash
# Via la ligne de commande
openssl s_client -connect google.com:443 -showcerts

# Voir les détails du certificat
echo | openssl s_client -connect google.com:443 2>/dev/null | \
  openssl x509 -noout -text
```

## Bonnes pratiques cryptographiques

### Ce qu'il faut faire ✅

- Utiliser **AES-256** pour le chiffrement symétrique
- Utiliser **RSA-4096 ou Ed25519** pour l'asymétrique
- Utiliser **SHA-256 ou SHA-3** pour le hachage
- Utiliser **bcrypt, scrypt ou Argon2** pour les mots de passe
- Toujours utiliser des **clés aléatoires** générées cryptographiquement

### Ce qu'il faut éviter ❌

```python
# ❌ NE JAMAIS faire ça
import hashlib
mot_de_passe_hash = hashlib.md5("MonMotDePasse".encode()).hexdigest()
# MD5 est cassé et instantanément reversible avec des rainbow tables

# ❌ Clé codée en dur dans le code
CLE_SECRETE = "motdepasse123"  # Visible dans le code source !

# ❌ Chiffrement maison
def mon_chiffrement(texte):
    return ''.join(chr(ord(c) + 3) for c in texte)  # César de César !
```

## Conclusion

La cryptographie est partout — dans votre navigateur, votre téléphone, vos applications bancaires. Retenez l'essentiel : **AES-256 pour stocker, RSA/ECC pour échanger, bcrypt pour les mots de passe, SHA-256 pour vérifier l'intégrité**. Et surtout, n'inventez jamais votre propre algorithme de chiffrement — utilisez toujours des implémentations éprouvées.

---
*Prochain article : [Introduction au pentesting éthique](../articles/intro-pentest)*
