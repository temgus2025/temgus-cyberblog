# John the Ripper et Hashcat : cracker les mots de passe

Le cracking de mots de passe est une compétence fondamentale en pentest. Que ce soit pour tester la robustesse des mots de passe d'une organisation ou pour progresser en CTF, maîtriser John the Ripper et Hashcat est indispensable.

## Comprendre le cracking de mots de passe

### Comment les mots de passe sont stockés
Les mots de passe ne sont (normalement) jamais stockés en clair. Ils sont **hachés** : transformés par une fonction à sens unique.

```
"motdepasse123" → MD5 → "482c811da5d5b4bc6d497ffa98491e38"
"motdepasse123" → SHA1 → "cbfdac6008f9cab4083784cbd1874f76618d2a97"
"motdepasse123" → bcrypt → "$2b$12$..."
```

### Techniques de cracking
- **Dictionnaire** : tester des mots de passe courants (rockyou.txt...)
- **Force brute** : tester toutes les combinaisons possibles
- **Règles** : transformer les mots du dictionnaire (majuscules, substitutions, chiffres)
- **Rainbow tables** : tables précalculées de hash→password

### Types de hash courants

| Hash | Longueur | Vitesse | Utilisé par |
|------|----------|---------|-------------|
| MD5 | 32 chars | Très rapide | Anciens systèmes |
| SHA1 | 40 chars | Rapide | Git, anciens systèmes |
| SHA256 | 64 chars | Rapide | Modern systems |
| NTLM | 32 chars | Très rapide | Windows |
| bcrypt | 60 chars | Lent (intentionnel) | Linux, apps modernes |
| Argon2 | Variable | Très lent | Recommandé 2025 |

## John the Ripper

### Installation
```bash
# Kali Linux (pré-installé)
john --version

# Ubuntu
sudo apt install john

# Version Jumbo (plus de formats)
git clone https://github.com/openwall/john
cd john/src && ./configure && make
```

### Utilisation de base
```bash
# Cracker un fichier de hash
john hashes.txt

# Spécifier le format
john --format=md5crypt hashes.txt
john --format=bcrypt hashes.txt
john --format=NT hashes.txt      # NTLM Windows

# Attaque par dictionnaire
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt

# Voir les mots de passe crackés
john --show hashes.txt

# Lister les formats supportés
john --list=formats
```

### Règles John
```bash
# Appliquer des règles de mutation
john --wordlist=rockyou.txt --rules hashes.txt

# Règles spécifiques
john --wordlist=rockyou.txt --rules=Jumbo hashes.txt

# Exemple de règle personnalisée (~/.john/john.conf)
[List.Rules:Custom]
# Ajouter des chiffres à la fin
$[0-9]$[0-9]
# Capitaliser la première lettre
c
# Remplacer a par @
sa@
```

### Extraire les hashs

```bash
# Linux /etc/shadow
sudo cat /etc/shadow

# Windows SAM (depuis Metasploit/impacket)
secretsdump.py -sam SAM -system SYSTEM LOCAL

# Convertir pour John
unshadow /etc/passwd /etc/shadow > combined.txt
```

## Hashcat

Hashcat est plus rapide que John grâce à l'accélération GPU. Il supporte plus de 300 types de hash.

### Installation
```bash
# Kali Linux (pré-installé)
hashcat --version

# Windows
# Télécharger depuis hashcat.net
```

### Modes d'attaque

| Mode | Description |
|------|-------------|
| 0 | Dictionnaire seul |
| 1 | Combinaison (deux dictionnaires) |
| 3 | Force brute / masque |
| 6 | Dictionnaire + masque |
| 7 | Masque + dictionnaire |

### Identifier le type de hash
```bash
# hashcat peut identifier automatiquement
hashcat hash.txt

# Ou utiliser hash-identifier
hash-identifier
# Entrez le hash pour l'identifier
```

### Attaques courantes
```bash
# Attaque dictionnaire (mode 0)
# -m = type de hash (-m 0 = MD5, -m 1000 = NTLM, -m 1800 = SHA-512 Unix)
hashcat -m 0 -a 0 hashes.txt rockyou.txt

# NTLM Windows
hashcat -m 1000 -a 0 ntlm_hashes.txt rockyou.txt

# bcrypt
hashcat -m 3200 -a 0 bcrypt_hashes.txt rockyou.txt

# Force brute avec masque (mode 3)
# ?l=minuscule, ?u=majuscule, ?d=chiffre, ?s=symbole, ?a=tout
hashcat -m 0 -a 3 hashes.txt ?l?l?l?l?l?l?l?l    # 8 minuscules
hashcat -m 0 -a 3 hashes.txt ?u?l?l?l?d?d?d?d    # Mot de passe type "Pass1234"

# Avec règles
hashcat -m 0 -a 0 hashes.txt rockyou.txt -r rules/best64.rule

# Combiner dictionnaire + règles (très efficace)
hashcat -m 1000 -a 0 ntlm.txt rockyou.txt -r rules/dive.rule
```

### Règles hashcat populaires
```bash
# Disponibles dans /usr/share/hashcat/rules/
best64.rule       # 64 règles efficaces
rockyou-30000.rule # 30 000 règles
dive.rule         # Très complet mais lent
d3ad0ne.rule      # Polyvalent
```

### Optimisation GPU
```bash
# Voir les GPU disponibles
hashcat -I

# Optimiser les performances
hashcat -m 0 -a 0 hashes.txt rockyou.txt \
  --optimized-kernel-enable \
  --workload-profile 3

# Benchmark
hashcat -b -m 1000    # Benchmark NTLM
```

## Wordlists recommandées

```bash
# rockyou.txt (14 millions de mots de passe réels)
/usr/share/wordlists/rockyou.txt

# SecLists (collection complète)
sudo apt install seclists
ls /usr/share/seclists/Passwords/

# Télécharger des wordlists spécialisées
# CrackStation: crackstation.net/buy-crackstation-wordlist-password-cracking-dictionary.htm
```

## Générer des wordlists ciblées avec CeWL

```bash
# Générer une wordlist depuis un site web
cewl https://example.com -d 2 -m 6 -w wordlist.txt

# Très utile pour cracker les mots de passe d'une organisation
# (ils utilisent souvent des mots de leur domaine)
```

## Cadre légal

⚠️ Le cracking de mots de passe sans autorisation est illégal. Utilisez ces techniques uniquement dans le cadre de :
- Tests d'intrusion autorisés
- Votre propre infrastructure
- Labs et CTF dédiés

## Conclusion

John et Hashcat sont complémentaires : John est plus simple pour débuter et gère bien les fichiers système, Hashcat est incontournable pour la vitesse GPU sur de gros volumes. La maîtrise des règles de mutation est la compétence clé pour cracker des mots de passe réalistes — la plupart suivent des patterns prévisibles que les règles exploitent efficacement.
