# Reverse Engineering : analyser un binaire sans code source

Le reverse engineering (rétro-ingénierie) consiste à analyser un programme compilé pour comprendre son fonctionnement sans avoir accès au code source. C'est une compétence fondamentale pour l'analyse de malwares, la recherche de vulnérabilités et les CTF.

## Pourquoi faire du reverse engineering ?

```
Cas d'usage légitimes :
→ Analyse de malwares (comprendre ce que fait un virus)
→ Recherche de vulnérabilités (bug bounty, pentest)
→ CTF (Capture The Flag)
→ Interopérabilité (comprendre un protocole propriétaire)
→ Récupération de code perdu
→ Vérification de sécurité d'un logiciel tiers

Cadre légal :
→ Toujours obtenir une autorisation pour les logiciels commerciaux
→ Exception : analyse de malwares (légal en sécurité défensive)
→ CTF et logiciels open source : aucune restriction
```

## Les niveaux d'analyse

```
Analyse statique (sans exécuter le programme) :
→ Désassemblage : binaire → assembly
→ Décompilation : assembly → pseudo-code C
→ Analyse des strings, imports, exports
→ Sûr car le programme ne s'exécute pas

Analyse dynamique (en exécutant le programme) :
→ Debugging : suivre l'exécution instruction par instruction
→ Tracing : surveiller les appels système
→ Memory analysis : inspecter la mémoire en temps réel
→ Risqué : nécessite un environnement isolé (VM)
```

## Outils essentiels

```bash
# Analyse statique
file malware.exe           # Type de fichier
strings malware.exe        # Chaînes lisibles
objdump -d malware.elf     # Désassemblage Linux
readelf -a malware.elf     # En-têtes ELF

# Ghidra (NSA, gratuit) — Le meilleur décompilateur gratuit
# Télécharger : https://ghidra-sre.org
./ghidraRun

# IDA Free — Standard industrie (version gratuite limitée)
# Binary Ninja — Moderne et très lisible

# Analyse dynamique
gdb malware.elf            # Debugger Linux
x64dbg / OllyDbg           # Debugger Windows
strace ./malware           # Syscalls Linux
ltrace ./malware           # Appels de librairies
```

## Anatomie d'un exécutable

### Format ELF (Linux)

```
Structure d'un fichier ELF :

┌─────────────────┐
│   ELF Header    │ Magic bytes: 7f 45 4c 46 (\x7fELF)
├─────────────────┤ Architecture, point d'entrée
│ Program Headers │ Segments chargés en mémoire
├─────────────────┤
│    .text        │ Code exécutable
├─────────────────┤
│    .data        │ Variables initialisées
├─────────────────┤
│    .rodata      │ Constantes (strings)
├─────────────────┤
│    .bss         │ Variables non initialisées
├─────────────────┤
│ Section Headers │ Métadonnées des sections
└─────────────────┘
```

```bash
# Analyser un ELF avec readelf
readelf -h malware.elf     # Header
readelf -S malware.elf     # Sections
readelf -d malware.elf     # Dépendances dynamiques

# Voir les imports (fonctions utilisées)
objdump -d -j .plt malware.elf | grep "call"

# Extraire les strings intéressantes
strings -n 8 malware.elf | grep -E "(http|/tmp|passwd|exec)"
```

### Format PE (Windows)

```python
# Analyser un PE avec pefile
import pefile

pe = pefile.PE('malware.exe')

# Informations générales
print(f"Machine: {hex(pe.FILE_HEADER.Machine)}")
print(f"Timestamp: {pe.FILE_HEADER.TimeDateStamp}")
print(f"Point d'entrée: {hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint)}")

# Imports (DLLs et fonctions utilisées)
for entry in pe.DIRECTORY_ENTRY_IMPORT:
    print(f"\nDLL: {entry.dll.decode()}")
    for imp in entry.imports:
        print(f"  → {imp.name.decode() if imp.name else 'Ordinal'}")

# Sections
for section in pe.sections:
    print(f"Section: {section.Name.decode().strip()}")
    print(f"  Virtual Size: {section.Misc_VirtualSize}")
    print(f"  Entropy: {section.get_entropy():.2f}")  # > 7 = probablement packé/chiffré

# Exports (fonctions exposées)
if hasattr(pe, 'DIRECTORY_ENTRY_EXPORT'):
    for exp in pe.DIRECTORY_ENTRY_EXPORT.symbols:
        print(f"Export: {exp.name.decode()}")
```

## Workflow d'analyse d'un malware

### Étape 1 : Triage initial

```bash
# Dans une VM isolée (snapshots activés !)

# 1. Identifier le fichier
file suspicious.exe
# suspicious.exe: PE32 executable (GUI) Intel 80386, for MS Windows

# 2. Hash pour recherche sur VirusTotal
md5sum suspicious.exe
sha256sum suspicious.exe
# Chercher le hash sur virustotal.com

# 3. Strings intéressantes
strings suspicious.exe | grep -iE "(http|ftp|cmd|powershell|reg|temp)"

# 4. Entropy des sections
python3 -c "
import pefile
pe = pefile.PE('suspicious.exe')
for s in pe.sections:
    print(f'{s.Name.decode().strip()}: entropy={s.get_entropy():.2f}')
"
# Entropy > 7 = code chiffré ou packé (UPX, custom packer)
```

### Étape 2 : Analyse statique avec Ghidra

```
Dans Ghidra :
1. File → New Project → Import File
2. Analyser le binaire (Auto Analysis)
3. Navigation :
   → Symbol Tree → Functions → chercher "main", "WinMain"
   → Imports → voir les API Windows utilisées

APIs Windows suspectes à surveiller :
→ CreateRemoteThread    → Injection dans un processus
→ VirtualAllocEx        → Allocation mémoire distante
→ WriteProcessMemory    → Écriture dans un processus
→ RegSetValueEx         → Persistance via registre
→ WinExec / ShellExecute → Exécution de commandes
→ WSAConnect / connect  → Connexions réseau
→ CryptEncrypt          → Chiffrement (ransomware ?)
```

### Étape 3 : Analyse dynamique

```bash
# Linux - Tracer les syscalls
strace -f -e trace=network,file ./malware 2>&1 | tee strace.log
# -f : suivre les processus fils
# -e trace=network : seulement les appels réseau et fichiers

# Surveiller les connexions réseau
tcpdump -i lo -w capture.pcap &
./malware
# Analyser capture.pcap avec Wireshark

# Windows - Process Monitor (Sysinternals)
# Filtrer sur le PID du malware :
# → Accès fichiers (persistance dans AppData ?)
# → Clés de registre modifiées (Run keys ?)
# → Connexions réseau (C2 ?)
```

## Anti-analyse et contournements

```python
# Techniques courantes pour détecter les analystes

# 1. Détection de VM
import ctypes, os

def is_running_in_vm():
    # Vérifier les processus typiques de VM
    vm_processes = ['vmtoolsd.exe', 'vboxservice.exe', 'wireshark.exe', 'procmon.exe']
    for proc in os.popen('tasklist').read().lower().split('\n'):
        for vm_proc in vm_processes:
            if vm_proc in proc:
                return True
    return False

# 2. Sleep bombing (ralentir l'analyse)
import time
time.sleep(300)  # Dormir 5 minutes → les sandbox ont un timeout !

# 3. Obfuscation des strings
def deobfuscate(encoded, key=0x42):
    return ''.join(chr(ord(c) ^ key) for c in encoded)

# Contournements pour l'analyste :
# → Patcher le jump de détection VM dans le debugger
# → Modifier le sleep() pour retourner immédiatement
# → Utiliser des breakpoints conditionnels
```

## Crackme — Exercice pratique

```c
// Programme C vulnérable (à reverser)
// Objectif : trouver le bon mot de passe sans lire le code

#include <stdio.h>
#include <string.h>

int check_password(char *input) {
    char secret[] = {0x54, 0x65, 0x6d, 0x67, 0x75, 0x73, 0x00}; // "Temgus"
    return strcmp(input, secret) == 0;
}

int main() {
    char input[32];
    printf("Password: ");
    scanf("%31s", input);
    if (check_password(input)) {
        printf("Access granted!\n");
    } else {
        printf("Wrong password.\n");
    }
    return 0;
}

// Dans Ghidra, vous verriez :
// → La comparaison avec les bytes {54 65 6d 67 75 73}
// → Convertir en ASCII → "Temgus"
// → Mot de passe trouvé !
```

## Ressources pour apprendre

```
Plateformes de pratique :
→ crackmes.one          : challenges de crackme
→ reversing.kr          : challenges progressifs
→ HackTheBox Reversing  : challenges réels
→ CTFtime.org           : compétitions avec épreuves RE

Cours gratuits :
→ OpenSecurityTraining2 : cours RE complets
→ Malware Unicorn       : ateliers gratuits
→ Dr. Josh Stroschein   : YouTube

Certifications :
→ GREM (GIAC Reverse Engineering Malware)
→ CREA (Certified Reverse Engineering Analyst)
```

## Conclusion

Le reverse engineering est l'une des compétences les plus valorisées en cybersécurité offensive et défensive. Commencez par des crackmes simples sur crackmes.one, apprenez les bases de l'assembly x86/x64, maîtrisez Ghidra — et progressivement vous serez capable d'analyser des malwares réels. C'est un domaine qui demande de la patience mais qui est extrêmement gratifiant.

---
*Catégorie : Pentest*
