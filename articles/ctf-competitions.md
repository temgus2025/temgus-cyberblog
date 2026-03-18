# CTF : les compétitions de hacking éthique

Les CTF (Capture The Flag) sont des compétitions de cybersécurité où les participants résolvent des challenges techniques pour trouver un "flag" (drapeau), une chaîne de texte prouvant qu'ils ont résolu le problème. C'est la meilleure façon d'apprendre la cybersécurité de façon pratique et ludique.

## Qu'est-ce qu'un CTF ?

```
Format typique :
→ Équipe de 1-4 personnes
→ Durée : 24h à 72h
→ Challenges dans différentes catégories
→ Chaque challenge a un flag : CTF{th1s_is_the_flag}
→ Soumettre le flag = points
→ L'équipe avec le plus de points gagne

Types de CTF :
Jeopardy    : Challenges indépendants par catégorie (le plus courant)
Attack/Defense : Les équipes attaquent ET défendent des services
King of the Hill : Prendre et tenir le contrôle d'un serveur
```

## Les catégories de challenges

### 1. Web

```
Objectif : exploiter des vulnérabilités dans des applications web

Techniques courantes :
→ SQL Injection
→ XSS (Cross-Site Scripting)
→ SSRF (Server-Side Request Forgery)
→ XXE (XML External Entities)
→ IDOR (Insecure Direct Object Reference)
→ Authentication bypass
→ JWT manipulation
→ GraphQL injection

Exemple de challenge web :
"Un site de login vous attend. Trouvez le flag."
→ Tester : admin' OR '1'='1' -- en username
→ Ou analyser le JWT : changer le rôle "user" → "admin"
→ Ou tester : /admin/../../../etc/passwd (path traversal)
```

```bash
# Outils web CTF
burpsuite     # Proxy d'interception HTTP (essentiel)
sqlmap        # Automatiser les SQLi
ffuf          # Fuzzer (découvrir des endpoints cachés)
wfuzz         # Fuzzer alternatif
nikto         # Scanner de vulnérabilités web

# Commandes utiles
ffuf -w wordlist.txt -u http://target.com/FUZZ
curl -v -X POST http://target.com/login -d "user=admin'--&pass=x"
jwt_tool token.jwt -T  # Analyser et modifier les JWT
```

### 2. Pwn (Exploitation binaire)

```
Objectif : exploiter des binaires pour obtenir un shell ou lire un fichier

Techniques :
→ Buffer Overflow (Stack BOF, Heap BOF)
→ Format String vulnerability
→ Return-Oriented Programming (ROP)
→ Ret2libc, Ret2plt
→ Heap exploitation (Use-after-free, double-free)

Exemple de challenge pwn :
"Ce binaire tourne sur le serveur nc ctf.example.com 9001"
→ Télécharger le binaire
→ Analyser avec Ghidra/IDA
→ Trouver la vulnérabilité
→ Écrire l'exploit
```

```python
# Pwntools - Bibliothèque Python pour l'exploitation
from pwn import *

# Connexion au serveur CTF
p = remote('ctf.example.com', 9001)
# Ou en local :
# p = process('./vuln_binary')

# Analyser le binaire
elf = ELF('./vuln_binary')
rop = ROP(elf)

# Construire l'exploit
offset = 72
rop.call('system', [next(elf.search(b'/bin/sh'))])
payload = flat({offset: rop.chain()})

p.sendline(payload)
p.interactive()  # Shell interactif !
```

### 3. Reverse Engineering

```
Objectif : comprendre ce que fait un binaire sans code source

Techniques :
→ Désassemblage (assembly x86/x64)
→ Décompilation (reconstruire le C depuis le binaire)
→ Analyse dynamique (suivre l'exécution pas à pas)
→ Cracking de protections (licences, passwords)
→ Analyse de malwares
→ Désobfuscation

Exemple :
"Ce binaire affiche 'Wrong password'. Trouvez le bon."
→ Ouvrir dans Ghidra
→ Trouver la fonction de vérification
→ Comprendre l'algorithme
→ Extraire/calculer le bon mot de passe
```

```bash
# Outils reverse engineering
ghidra          # NSA's reverse engineering tool (gratuit)
ida-free        # Standard industrie (version gratuite limitée)
radare2         # Multi-plateforme, CLI
binary ninja    # Moderne, très lisible
gdb + pwndbg   # Debugging dynamique

# Analyse statique rapide
strings binaire | grep -i "flag\|password\|key"
ltrace ./binaire    # Tracer les appels de librairies
strace ./binaire    # Tracer les appels système
objdump -d binaire  # Désassembler

# Décompiler avec Ghidra (raccourci clavier)
# F → décompiler la fonction courante
# Ctrl+E → éditer le code C décompilé
# Clic droit → rename variable
```

### 4. Cryptographie

```
Objectif : casser ou contourner des systèmes cryptographiques

Techniques :
→ Chiffrement César, Vigenère, substitution
→ RSA (factorisation, small exponent, padding oracle)
→ AES (ECB penguin, padding oracle, bit flipping)
→ Hash collisions
→ Mauvaise génération de nombres aléatoires
→ Timing attacks

Exemple :
"Message chiffré : KHOOR ZRUOG. Trouvez le texte clair."
→ Décalage de 3 → HELLO WORLD (César)

Exemple avancé :
"RSA : n=77, e=3, c=34. Déchiffrez."
→ Factoriser n : 77 = 7 × 11
→ phi(n) = (7-1)(11-1) = 60
→ d = e^-1 mod phi(n) = 3^-1 mod 60 = 20
→ m = c^d mod n = 34^20 mod 77 = ?
```

```python
# Outils crypto CTF

# CyberChef (en ligne) - couteau suisse du décodage
# https://gchq.github.io/CyberChef/

# Python pour RSA
from Crypto.PublicKey import RSA
from Crypto.Util.number import *

# Factoriser n avec factordb.com ou yafu
n = 77
# Si n = p * q
p, q = 7, 11
phi = (p-1) * (q-1)
e = 3
d = inverse(e, phi)
c = 34
m = pow(c, d, n)
print(long_to_bytes(m))

# RsaCtfTool - automatise beaucoup d'attaques RSA
python3 RsaCtfTool.py --publickey public.pem --uncipherfile cipher.txt

# Hashcat pour les hashes
hashcat -m 0 hash.txt wordlist.txt  # MD5
hashcat -m 1000 hash.txt wordlist.txt  # NTLM
```

### 5. Forensics

```
Objectif : analyser des fichiers, images disque, captures réseau

Techniques :
→ Analyse de fichiers (strings, binwalk, exiftool)
→ Stéganographie (steghide, zsteg, stegsolve)
→ Analyse de captures réseau (Wireshark)
→ Récupération de fichiers supprimés
→ Analyse de mémoire (Volatility)
→ Timeline forensique

Exemple :
"Cette image PNG contient un message caché."
→ strings image.png | grep CTF
→ zsteg image.png
→ binwalk -e image.png
→ stegsolve image.png (analyser les bits plans)
```

```bash
# Workflow forensics CTF
file challenge.file        # Identifier le type réel
strings challenge.file     # Chercher des strings lisibles
exiftool challenge.file    # Métadonnées
binwalk -e challenge.file  # Extraire les fichiers embarqués
foremost challenge.file    # Récupération de fichiers

# Images
zsteg image.png            # Stéganographie PNG
steghide extract -sf image.jpg -p ""  # Pas de mot de passe
stegsolve                  # Analyser les plans de bits (GUI)

# Réseau (.pcap)
wireshark capture.pcap
tshark -r capture.pcap -Y "http" -T fields -e http.request.uri
strings capture.pcap | grep -i "flag\|CTF"

# Mémoire
volatility -f mem.dmp imageinfo
volatility -f mem.dmp --profile=Win10x64 filescan | grep -i flag
```

### 6. OSINT

```
Objectif : trouver des informations en source ouverte

Exemples :
→ "Où cette photo a-t-elle été prise ?" (géolocalisation)
→ "Trouvez l'email de contact de cette personne"
→ "À quelle date ce tweet a-t-il été posté ?"
→ "Quel est le vrai nom derrière ce pseudonyme ?"

Outils :
→ Google Images reverse search
→ Yandex (meilleur pour les visages)
→ EXIF data (coordonnées GPS dans les photos)
→ Wayback Machine (versions archivées de sites)
→ Sherlock (recherche de pseudonymes)
→ theHarvester (emails, sous-domaines)
```

## Plateformes CTF recommandées

```
Pour débuter :
→ PicoCTF (picoctf.org) : idéal lycéens/étudiants
→ TryHackMe (tryhackme.com) : très guidé, excellent pour débutants
→ OverTheWire (overthewire.org) : challenges Linux progressifs

Niveau intermédiaire :
→ HackTheBox (hackthebox.com) : machines réalistes
→ CTFlearn (ctflearn.com) : challenges variés
→ Root-Me (root-me.org) : français, très complet

Niveau avancé :
→ HackTheBox Pro Labs : Active Directory, enterprise
→0xL4ugh, DaVinciCTF : nouvelles équipes

Calendrier CTF :
→ CTFtime.org : tous les CTF à venir dans le monde
→ Signaler votre équipe et suivre votre progression
```

## Construire son équipe CTF

```python
# Composition idéale d'une équipe CTF de 4 personnes :

equipe = {
    "specialist_web": {
        "force": ["SQLi", "XSS", "SSRF", "Auth bypass"],
        "outils": ["Burp Suite", "sqlmap", "ffuf"]
    },
    "specialist_pwn": {
        "force": ["BOF", "ROP", "Heap exploitation"],
        "outils": ["pwntools", "gdb-pwndbg", "GEF"]
    },
    "specialist_crypto_reverse": {
        "force": ["RSA", "AES", "Ghidra", "IDA"],
        "outils": ["pycryptodome", "CyberChef", "RsaCtfTool"]
    },
    "specialist_forensics_misc": {
        "force": ["Volatility", "Wireshark", "Stéganographie"],
        "outils": ["Autopsy", "zsteg", "binwalk"]
    }
}

# Communication d'équipe :
# → CTFd (plateforme de gestion)
# → Discord (communication en temps réel)
# → Google Docs (partage de notes)
# → GitHub (scripts et exploits partagés)
```

## Conclusion

Les CTF sont la voie royale pour progresser en cybersécurité : on apprend en faisant, dans un cadre légal, avec des défis réalistes. Commencez par **PicoCTF** ou **TryHackMe**, progressez vers **HackTheBox**, et inscrivez-vous sur **CTFtime.org** pour rejoindre des compétitions mondiales. Chaque flag trouvé est une compétence réelle acquise.

---
*Article suivant : [RGPD et conformité sécurité](../articles/rgpd-conformite)*
