# Évasion d'antivirus et EDR : techniques et contre-mesures

Comprendre comment les attaquants contournent les solutions de sécurité est essentiel pour améliorer ses défenses. Cet article explore les techniques d'évasion d'antivirus et d'EDR d'un point de vue éducatif et défensif.

## Comment fonctionnent les antivirus modernes

```
Méthodes de détection :

1. Signatures (détection basée sur les patterns) :
→ Base de données de patterns malveillants connus
→ Rapide mais inefficace contre les nouveaux malwares
→ Bypass trivial : modifier quelques bytes

2. Heuristiques :
→ Analyse comportementale statique
→ "Ce code ressemble à un shellcode"
→ Bypass : obfuscation, encodage

3. Sandbox dynamique :
→ Exécuter le programme dans un environnement isolé
→ Observer le comportement réel
→ Bypass : détecter la sandbox, délai d'exécution

4. Machine Learning :
→ Modèles entraînés sur des millions de samples
→ Difficile à bypasser mais pas impossible
→ Bypass : adversarial examples, style de code légitime

EDR (Endpoint Detection & Response) :
→ Surveillance continue des processus, réseau, registre
→ Corrélation d'événements (kill chain)
→ Réponse automatique (isolation, kill process)
→ Plus difficile à bypasser que l'AV classique
```

## Techniques d'évasion statique

### Obfuscation et encodage

```python
# Encoder un payload pour éviter la détection par signatures

import base64
import random

def xor_encode(data: bytes, key: int = None) -> tuple:
    """XOR encoding simple"""
    if key is None:
        key = random.randint(1, 255)
    encoded = bytes(b ^ key for b in data)
    return encoded, key

def encode_base64(data: bytes) -> str:
    """Encodage Base64"""
    return base64.b64encode(data).decode()

# Exemple : encoder une chaîne suspecte
payload = b"cmd.exe /c whoami"

# XOR avec clé aléatoire
encoded, key = xor_encode(payload)
print(f"XOR encodé (clé {key}): {encoded.hex()}")

# Décodage au runtime
decoded = bytes(b ^ key for b in encoded)
print(f"Décodé: {decoded.decode()}")

# Chaîner plusieurs encodages
double_encoded = encode_base64(encoded)
print(f"Double encodé: {double_encoded}")

# Les AV modernes détectent souvent ces patterns simples
# Les techniques avancées incluent : chiffrement AES, compression, polymorphisme
```

### Techniques de détection sandbox

```python
# Les malwares modernes vérifient s'ils tournent dans une sandbox
# Pour éviter d'être analysés

import os
import time
import ctypes

def check_sandbox_indicators():
    """Détecter les indicateurs de sandbox/VM - ÉDUCATIF UNIQUEMENT"""
    indicators = []

    # 1. Vérifier les processus d'analyse
    suspicious_processes = [
        'wireshark', 'procmon', 'x64dbg', 'ollydbg',
        'ida', 'ghidra', 'processhacker', 'tcpview'
    ]
    # [vérification des processus]

    # 2. Vérifier le nombre de processus (sandbox = peu de processus)
    # Un vrai système a généralement 50+ processus
    # Une sandbox en a souvent moins de 30

    # 3. Délai d'exécution (sleep bombing)
    start = time.time()
    time.sleep(30)  # Les sandbox ont un timeout de 30-60s
    elapsed = time.time() - start
    if elapsed < 25:  # Si le sleep a été accéléré = sandbox !
        indicators.append("Sleep acceleration detected")

    # 4. Vérifier les ressources système
    # RAM < 2GB = souvent une sandbox
    # CPU < 2 cores = souvent une sandbox

    return indicators

# Contre-mesures pour les défenseurs :
# → Configurer les sandbox avec des ressources réalistes
# → Simuler une activité utilisateur (mouvements souris, frappes clavier)
# → Augmenter le timeout des sandbox
# → Utiliser des snapshots de VMs "vivantes" avec historique réel
```

## Techniques d'évasion en mémoire (Fileless)

```python
# Les malwares fileless ne s'écrivent pas sur le disque
# → Moins de traces forensiques
# → Les AV basés sur les fichiers ne détectent rien

# Technique : Process Injection
# Injecter du code dans un processus légitime (explorer.exe, svchost.exe)

# Étapes conceptuelles (ÉDUCATIF) :
injection_steps = [
    "1. OpenProcess(target_pid) - Obtenir un handle sur le processus cible",
    "2. VirtualAllocEx(handle, size) - Allouer de la mémoire dans le processus",
    "3. WriteProcessMemory(handle, address, payload) - Écrire le shellcode",
    "4. CreateRemoteThread(handle, address) - Exécuter le shellcode"
]

# EDR moderne détecte ces patterns via :
# → Hooks API Windows (NTDLL hooks)
# → ETW (Event Tracing for Windows)
# → Kernel callbacks (PsSetCreateProcessNotifyRoutine)
```

## AMSI — Antimalware Scan Interface

```powershell
# AMSI (Windows 10+) intercepte tout le contenu PowerShell
# avant son exécution et le soumet à l'AV

# Comment AMSI fonctionne :
# PowerShell → AmsiScanBuffer() → AV Engine → Résultat
# Si malveillant → Exception "Script not executable"

# Test AMSI (ce string déclenche AMSI délibérément) :
# 'AmsiScanBuffer' dans un script PS déclenche une alerte

# Techniques de bypass AMSI connues (déjà patchées pour la plupart) :
# → Patching en mémoire de amsi.dll
# → Reflection .NET pour contourner les hooks
# → Obfuscation des patterns détectés

# Contre-mesures défensives :
# → Activer PowerShell Constrained Language Mode
# → Journalisation ScriptBlock complète
# → Surveillance des événements AMSI dans le SIEM
# → Mettre à jour régulièrement les signatures AV
```

## Stratégies de détection et défense

```python
# Pour les défenseurs : détecter les techniques d'évasion

detection_strategies = {
    "Obfuscation PowerShell": {
        "règle_sigma": """
            title: Suspicious PowerShell Obfuscation
            detection:
                selection:
                    EventID: 4104
                    ScriptBlockText|contains:
                        - 'FromBase64String'
                        - 'EncodedCommand'
                        - 'Invoke-Expression'
                        - 'IEX'
                condition: selection
        """,
        "action": "Alerter + analyser le script complet"
    },
    "Process Injection": {
        "règle_sysmon": """
            EventID: 8 (CreateRemoteThread)
            SourceImage ne contient pas le process cible habituel
        """,
        "action": "Isoler le processus, analyser la mémoire"
    },
    "Sandbox Evasion via Sleep": {
        "détection": "Analyser les binaires avec long sleep() statiquement",
        "action": "Patch le sleep() dans la sandbox"
    },
    "Fileless Malware": {
        "détection": [
            "Surveiller PowerShell/WMI/mshta pour du code encodé",
            "ETW pour les allocations mémoire suspectes",
            "Volatility pour analyser la mémoire des processus"
        ]
    }
}
```

## Outils de test (Red Team)

```bash
# Outils légitimes pour tester ses propres défenses

# ThreatCheck - Identifier ce qu'un AV détecte dans un binaire
ThreatCheck.exe -f payload.exe -e AMSI
# Indique exactement quel byte/string déclenche la détection

# DefenderCheck - Similaire pour Windows Defender
DefenderCheck.exe payload.exe

# Invoke-Obfuscation - Obfusquer des scripts PowerShell
# Pour tester si votre SIEM détecte les scripts obfusqués

# Cobalt Strike Malleable C2 Profiles
# Personnaliser le trafic réseau pour ressembler à du trafic légitime
# → Test de vos règles réseau et SIEM

# AtomicRedTeam - Tests ATT&CK automatisés
Invoke-AtomicTest T1562.001 -TestNumbers 1
# Tester si votre EDR détecte la désactivation d'antivirus
```

## Conclusion

L'évasion d'AV/EDR est un jeu du chat et de la souris entre attaquants et défenseurs. Pour les équipes défensives, la clé est de **ne pas dépendre uniquement des signatures** — combinez EDR comportemental, journalisation PowerShell complète, AMSI, surveillance réseau et threat hunting proactif. Plus vos couches de défense sont diversifiées, plus il est difficile pour un attaquant de toutes les contourner simultanément.

---
*Catégorie : Pentest*
