# Forensics mémoire avancé : Volatility 3 et analyse d'incidents

L'analyse de la mémoire vive est l'une des techniques forensiques les plus puissantes. La RAM contient des informations qui n'existent nulle part ailleurs : processus actifs, clés de chiffrement, mots de passe en clair, connexions réseau, malwares fileless.

## Pourquoi la mémoire est si précieuse

```
La RAM contient ce que le disque ne montre pas :
→ Malwares fileless (jamais écrits sur disque)
→ Clés de chiffrement Bitlocker/VeraCrypt
→ Mots de passe en mémoire (Mimikatz les récupère de là)
→ Connexions réseau établies au moment du dump
→ Historique des commandes PowerShell/bash
→ Artifacts d'injection de code
→ Configuration de malwares décryptée en mémoire
```

## Acquisition de la mémoire

```bash
# Windows - WinPmem (recommandé)
winpmem_mini_x64_rc2.exe memory.dmp

# Windows - DumpIt
DumpIt.exe /output memory.raw

# Linux - LiME (Linux Memory Extractor)
# Compiler le module kernel
git clone https://github.com/504ensicsLabs/LiME
cd LiME/src && make

# Charger et capturer
sudo insmod lime.ko "path=/media/usb/memory.lime format=lime"

# Sur une VM (depuis l'hyperviseur)
# VMware : Suspendre la VM → .vmem file
# VirtualBox : vboxmanage debugvm "VM Name" dumpguestcore --filename memory.elf
```

## Volatility 3 — Référence

```bash
# Informations générales
vol3 -f memory.dmp windows.info
vol3 -f memory.dmp windows.envars --pid 1234  # Variables d'environnement

# Processus
vol3 -f memory.dmp windows.pslist            # Liste simple
vol3 -f memory.dmp windows.pstree           # Arbre père-fils
vol3 -f memory.dmp windows.cmdline          # Arguments des processus
vol3 -f memory.dmp windows.dlllist          # DLLs chargées par process

# Réseau
vol3 -f memory.dmp windows.netscan          # Connexions et sockets
vol3 -f memory.dmp windows.netstat          # État des connexions

# Détection de malwares
vol3 -f memory.dmp windows.malfind          # Code injecté suspect
vol3 -f memory.dmp windows.hollowfind       # Process hollowing
vol3 -f memory.dmp windows.vadinfo --pid 1234  # Memory regions

# Extraction
vol3 -f memory.dmp windows.dumpfiles --virtaddr 0x7ff... # Extraire un fichier
vol3 -f memory.dmp windows.memmap --dump --pid 1234      # Dumper la mémoire d'un process

# Registry
vol3 -f memory.dmp windows.registry.hivelist     # Lister les hives
vol3 -f memory.dmp windows.registry.printkey -K "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

# Credentials
vol3 -f memory.dmp windows.hashdump         # Hashes NTLM
vol3 -f memory.dmp windows.lsadump         # Secrets LSA
```

## Analyse d'un process suspect

```bash
# Workflow d'analyse d'un processus suspect

# 1. Identifier les processus anormaux
vol3 -f memory.dmp windows.pstree
# Red flags :
# → cmd.exe enfant de Word/Excel (macro malveillante)
# → PowerShell avec nom aléatoire
# → Processus sans icône ou description
# → Processus légitime avec PPID inhabituel

# 2. Analyser les arguments
vol3 -f memory.dmp windows.cmdline --pid 1234
# PowerShell avec -EncodedCommand = suspect !

# 3. Vérifier les connexions réseau
vol3 -f memory.dmp windows.netscan | grep 1234
# Connexions vers des IPs inhabituelles = C2 ?

# 4. Analyser la mémoire du processus
vol3 -f memory.dmp windows.malfind --pid 1234
# Sections RWX (Read-Write-Execute) = code injecté

# 5. Extraire le processus pour analyse statique
vol3 -f memory.dmp windows.dumpfiles --pid 1234
# Analyser le dump avec strings, VirusTotal

# 6. Analyser les DLLs
vol3 -f memory.dmp windows.dlllist --pid 1234
# DLLs inconnues ou depuis %TEMP% = suspect
```

## Détecter les techniques d'évasion

```python
# Process Hollowing - Détecter via Volatility

# Process hollowing :
# 1. Créer un processus légitime en mode suspendu
# 2. Vider sa mémoire
# 3. Injecter le malware
# 4. Reprendre l'exécution

# Détection :
# Le chemin sur disque ≠ le code en mémoire

def detecter_process_hollowing(vol_output):
    """Analyser la sortie de windows.hollowfind"""
    suspects = []
    for process in vol_output:
        # Si le hash mémoire ≠ hash disque
        if process['disk_hash'] != process['memory_hash']:
            suspects.append({
                'pid': process['pid'],
                'name': process['name'],
                'note': 'Process hollowing possible'
            })
    return suspects

# DKOM (Direct Kernel Object Manipulation)
# Malware qui se cache en modifiant les structures kernel
# Détection : comparer pslist (liste kernel) vs psscan (scan mémoire)
# vol3 windows.psscan → trouve les processus cachés
```

## Extraire des artefacts cryptographiques

```python
# Trouver des clés de chiffrement dans la mémoire

import re

def chercher_cles_aes(memory_dump_path):
    """Chercher des clés AES-256 dans un dump mémoire"""
    with open(memory_dump_path, 'rb') as f:
        data = f.read()

    # AES key schedule pattern (heuristique simplifiée)
    # Les vraies clés ont des patterns statistiques spécifiques
    potential_keys = []

    # Chercher des patterns qui ressemblent à des clés AES (entropie élevée, 32 bytes)
    for i in range(0, len(data) - 32, 4):
        chunk = data[i:i+32]
        # Calculer l'entropie
        from collections import Counter
        import math
        counts = Counter(chunk)
        entropy = -sum((c/32) * math.log2(c/32) for c in counts.values())
        if entropy > 7.5:  # Entropie élevée = données aléatoires = possible clé
            potential_keys.append((hex(i), chunk.hex()))

    return potential_keys[:10]  # Retourner les 10 premières

# Outils spécialisés :
# bulk_extractor : extraire automatiquement clés, emails, URLs
bulk_extractor -o output/ -x all -e aes memory.dmp
```

## Conclusion

La forensique mémoire révèle ce que les autres techniques ne voient pas. Volatility 3 est l'outil incontournable, mais la vraie compétence est dans l'**interprétation** : savoir distinguer un processus légitime d'un process hollowing, reconnaître les patterns de code injecté, corréler les connexions réseau avec les processus suspects. C'est une compétence qui s'acquiert par la pratique sur des images mémoire réelles ou des challenges CTF.

---
*Catégorie : Pentest*
