# Exercices Purple Team : attaque et défense en collaboration

Le Purple Team représente l'évolution naturelle des exercices de sécurité : Red Team et Blue Team travaillent ensemble en temps réel pour améliorer les capacités de détection et de réponse. C'est l'approche la plus efficace pour renforcer concrètement la posture de sécurité.

## Qu'est-ce qu'un exercice Purple Team ?

```
Purple Team ≠ Red Team + Blue Team séparés

Approche traditionnelle (silotée) :
Red Team attaque pendant 2 semaines → Rapport → Blue Team corrige
Problème : délai long, pas d'apprentissage en temps réel

Purple Team (collaborative) :
Red Team exécute une technique → Blue Team observe en temps réel
"Avez-vous détecté ça ?" → Oui/Non → Ajuster immédiatement

Bénéfices :
→ Règles de détection créées/améliorées immédiatement
→ Blue Team comprend les techniques offensives
→ Red Team comprend les capacités défensives
→ ROI bien meilleur qu'un Red Team classique
→ Transfert de compétences bidirectionnel
```

## Framework MITRE ATT&CK comme référentiel commun

```python
# Organiser les exercices selon ATT&CK

exercice_purple = {
    "technique_id": "T1059.001",
    "technique_nom": "PowerShell",
    "tactique": "Execution",

    "test_red_team": {
        "commande": "powershell.exe -EncodedCommand [base64]",
        "outil": "Atomic Red Team",
        "atomic_id": "T1059.001-1"
    },

    "detection_attendue": {
        "source": "Windows Event Log",
        "event_id": 4104,
        "condition": "ScriptBlockText contains EncodedCommand",
        "alerte_siem": "Suspicious PowerShell Encoded Command"
    },

    "resultat": None,  # DÉTECTÉ ou NON_DÉTECTÉ → créer la règle

    "règle_sigma": """
        title: PowerShell Encoded Command
        detection:
            selection:
                EventID: 4104
                ScriptBlockText|contains: '-EncodedCommand'
            condition: selection
        level: high
    """
}
```

## Atomic Red Team — Tests ATT&CK automatisés

```powershell
# Installer Atomic Red Team
Install-Module -Name invoke-atomicredteam,powershell-yaml -Scope CurrentUser
Import-Module invoke-atomicredteam

# Lister les tests disponibles pour une technique
Invoke-AtomicTest T1059.001 -ShowDetailsBrief

# Exécuter un test spécifique
Invoke-AtomicTest T1059.001 -TestNumbers 1

# Exécuter et nettoyer après
Invoke-AtomicTest T1059.001 -TestNumbers 1 -Cleanup

# Tests populaires pour un exercice Purple Team
$techniques = @(
    "T1059.001",  # PowerShell
    "T1003.001",  # LSASS Dump
    "T1547.001",  # Registry Run Keys
    "T1078",      # Valid Accounts
    "T1486",      # Data Encrypted (ransomware)
    "T1562.001",  # Disable Security Tools
    "T1070.001",  # Clear Windows Event Logs
    "T1055",      # Process Injection
    "T1021.002",  # SMB Lateral Movement
    "T1071.001"   # Web Protocol C2
)

foreach ($tech in $techniques) {
    Write-Host "Test: $tech"
    Invoke-AtomicTest $tech -TestNumbers 1
    Start-Sleep -Seconds 30  # Laisser le temps au SIEM de détecter
}
```

## Structure d'un exercice Purple Team

```markdown
## Planning d'exercice Purple Team (2 jours)

### Jour 1 : Initial Access & Execution

09h00 - Briefing et règles d'engagement
09h30 - T1566.001 Spear Phishing (simulé)
  → Red : Envoyer email phishing test
  → Blue : A-t-il été intercepté ? Quels logs ?
  → Action : Améliorer les règles email gateway

10h30 - T1059.001 PowerShell malveillant
  → Red : Exécuter script PS encodé
  → Blue : Détecté ? Quel délai ?
  → Action : Ajuster seuils SIEM

11h30 - T1003.001 LSASS Dump
  → Red : Mimikatz sekurlsa::logonpasswords
  → Blue : EDR a-t-il bloqué ? Alerte SIEM ?
  → Action : Règle Sysmon EventID 10

14h00 - T1547.001 Registry Persistence
  → Red : Ajouter clé Run dans HKCU
  → Blue : Alerte sur modification registre ?

15h00 - T1055 Process Injection
  → Red : Injecter dans explorer.exe
  → Blue : Sysmon EventID 8 détecté ?

### Jour 2 : Lateral Movement & Impact

09h00 - T1021.002 Pass-the-Hash via SMB
10h00 - T1078 Utilisation compte légitime
11h00 - T1486 Simulation chiffrement ransomware
14h00 - T1070 Effacement des logs
15h00 - Débriefing complet et rapport
```

## Métriques d'un exercice Purple Team

```python
resultats_exercice = {
    "techniques_testées": 20,
    "détectées": 14,
    "taux_détection": "70%",

    "par_catégorie": {
        "Initial Access": {"testées": 3, "détectées": 2, "taux": "67%"},
        "Execution": {"testées": 4, "détectées": 3, "taux": "75%"},
        "Persistence": {"testées": 3, "détectées": 1, "taux": "33%"},  # Faiblesse !
        "Lateral Movement": {"testées": 4, "détectées": 3, "taux": "75%"},
        "Impact": {"testées": 3, "détectées": 2, "taux": "67%"},
        "Defense Evasion": {"testées": 3, "détectées": 1, "taux": "33%"}  # Faiblesse !
    },

    "temps_détection_moyen": "4 minutes 23 secondes",
    "règles_créées": 6,
    "règles_améliorées": 4,
    "faux_positifs_réduits": 12,

    "actions_prioritaires": [
        "Améliorer la détection de la persistence (registry, scheduled tasks)",
        "Renforcer les règles d'évasion (obfuscation PS, LOLBins)",
        "Former l'équipe SOC sur les techniques de pivoting AD"
    ]
}
```

## Conclusion

Les exercices Purple Team sont l'investissement sécurité avec le meilleur ROI. En quelques jours, vous identifiez précisément vos angles morts défensifs et créez des règles de détection adaptées à VOTRE environnement. Commencez petit : 5-10 techniques ATT&CK bien choisies valent mieux que 50 techniques survolées. L'objectif n'est pas de "tout tester" mais d'améliorer concrètement votre capacité de détection.

---
*Catégorie : Pentest*
