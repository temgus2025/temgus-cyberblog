# Threat Hunting : la chasse proactive aux menaces

Le Threat Hunting (chasse aux menaces) est l'approche proactive de la cybersécurité. Plutôt que d'attendre qu'une alerte se déclenche, les threat hunters **partent à la recherche active** des attaquants qui se cachent déjà dans votre réseau.

## Qu'est-ce que le Threat Hunting ?

```
Sécurité RÉACTIVE (classique) :
Attaque → Alerte → Réponse
Problème : le délai moyen de détection est de 197 jours !

Sécurité PROACTIVE (Threat Hunting) :
Hypothèse → Recherche active → Découverte → Réponse
Avantage : on cherche AVANT que l'attaquant ait causé des dégâts
```

> En 2023, le temps moyen entre l'intrusion initiale et la détection était de **197 jours** selon IBM. Le Threat Hunting vise à réduire ce délai à des heures ou des jours.

## Le cycle du Threat Hunting

```
1. HYPOTHÈSE
   "Peut-être qu'un attaquant utilise le DNS pour exfiltrer des données"
          ↓
2. COLLECTE DE DONNÉES
   Logs réseau, EDR, SIEM, DNS queries
          ↓
3. INVESTIGATION
   Analyser les données à la recherche de patterns anormaux
          ↓
4. DÉCOUVERTE
   Trouver (ou infirmer) l'activité malveillante
          ↓
5. AMÉLIORATION
   Créer des détections automatiques pour la prochaine fois
```

## Les sources de données essentielles

### Logs à collecter

```bash
# Sur Windows - Sources prioritaires
→ Windows Event Logs (Security, System, Application, PowerShell)
→ Sysmon (journalisation avancée des processus, réseau, registre)
→ EDR logs (CrowdStrike, SentinelOne, Defender for Endpoint)

# Sur Linux
→ /var/log/auth.log, /var/log/syslog
→ Auditd logs (/var/log/audit/audit.log)
→ Process accounting

# Réseau
→ DNS queries (toutes les requêtes DNS)
→ NetFlow / IPFIX (métadonnées des flux)
→ Proxy logs (trafic web)
→ Firewall logs
```

### Sysmon — L'outil indispensable

```xml
<!-- Installation et configuration de Sysmon -->
<!-- Télécharger : https://docs.microsoft.com/sysinternals/sysmon -->

<!-- Configuration recommandée (sysmonconfig.xml) -->
<Sysmon schemaversion="4.70">
  <EventFiltering>
    <!-- Event 1 : Création de processus -->
    <ProcessCreate onmatch="include">
      <CommandLine condition="contains">powershell</CommandLine>
      <CommandLine condition="contains">cmd.exe</CommandLine>
      <CommandLine condition="contains">wscript</CommandLine>
    </ProcessCreate>

    <!-- Event 3 : Connexions réseau -->
    <NetworkConnect onmatch="include">
      <DestinationPort condition="is">4444</DestinationPort>
      <DestinationPort condition="is">1337</DestinationPort>
    </NetworkConnect>

    <!-- Event 11 : Création de fichiers -->
    <FileCreate onmatch="include">
      <TargetFilename condition="end with">.exe</TargetFilename>
      <TargetFilename condition="contains">Temp</TargetFilename>
    </FileCreate>
  </EventFiltering>
</Sysmon>
```

```powershell
# Installer Sysmon avec la config
.\Sysmon64.exe -accepteula -i sysmonconfig.xml

# Vérifier les événements Sysmon
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -MaxEvents 50
```

## Techniques et hypothèses de hunting

### Hunting 1 : Exfiltration DNS

```python
# Hypothèse : un malware utilise DNS pour exfiltrer des données
# (données encodées dans les sous-domaines)

# Exemple de requête suspecte :
# dGhpcyBpcyBzZW5zaXRpdmUgZGF0YQ==.evil.com
# (données en base64 dans le sous-domaine)

# Détection avec Python - analyser les logs DNS
import re
from collections import Counter

def analyser_dns_suspects(fichier_logs):
    with open(fichier_logs) as f:
        lignes = f.readlines()

    domaines_suspects = []
    for ligne in lignes:
        # Chercher des sous-domaines anormalement longs
        match = re.search(r'(\S+)\.example\.com', ligne)
        if match:
            sous_domaine = match.group(1)
            if len(sous_domaine) > 30:  # Sous-domaine suspect si > 30 chars
                domaines_suspects.append(sous_domaine)

    return Counter(domaines_suspects).most_common(20)

# Requête KQL (Kusto Query Language) pour Microsoft Sentinel
"""
DnsEvents
| where Name has_any ("base64", "encoded")
    or strlen(extract(@"([^.]+)\.", 1, Name)) > 30
| summarize count() by Name, ClientIP
| where count_ > 10
| order by count_ desc
"""
```

### Hunting 2 : Living off the Land (LOLBins)

Les attaquants utilisent des **binaires Windows légitimes** pour éviter la détection.

```powershell
# LOLBins couramment abusés
# certutil, mshta, regsvr32, rundll32, wmic, bitsadmin

# Chercher l'utilisation suspecte de certutil (souvent utilisé pour télécharger des fichiers)
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" |
    Where-Object {$_.Message -match "certutil" -and $_.Message -match "urlcache"} |
    Select-Object TimeCreated, Message

# Requête Splunk SPL
"""
index=windows EventCode=1
| search Image="*certutil*" CommandLine="*urlcache*"
| table _time, ComputerName, User, CommandLine
"""

# Requête Sigma (format universel)
"""
title: Suspicious Certutil Usage
detection:
    selection:
        EventID: 1
        Image|endswith: '\certutil.exe'
        CommandLine|contains:
            - 'urlcache'
            - 'decode'
            - 'encode'
    condition: selection
"""
```

### Hunting 3 : Connexions vers des IPs suspectes

```python
# Enrichissement des IPs avec VirusTotal
import requests

def check_ip_virustotal(ip, api_key):
    url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip}"
    headers = {"x-apikey": api_key}
    response = requests.get(url, headers=headers)
    data = response.json()

    malicious = data['data']['attributes']['last_analysis_stats']['malicious']
    return {'ip': ip, 'malicious_votes': malicious}

# Automatiser sur un fichier de logs réseau
def hunt_malicious_ips(netflow_file, vt_api_key):
    ips = extraire_ips_externes(netflow_file)
    results = []
    for ip in ips:
        result = check_ip_virustotal(ip, vt_api_key)
        if result['malicious_votes'] > 5:
            results.append(result)
    return sorted(results, key=lambda x: x['malicious_votes'], reverse=True)
```

### Hunting 4 : Comptes dormants réactivés

```powershell
# Chercher des connexions de comptes qui ne s'étaient pas connectés depuis longtemps
# (signe possible de compromission de credentials oubliés)

$cutoff = (Get-Date).AddDays(-180)  # Inactif depuis 6 mois

Get-ADUser -Filter {LastLogonDate -lt $cutoff -and Enabled -eq $true} `
    -Properties LastLogonDate, PasswordLastSet |
    Select-Object Name, SamAccountName, LastLogonDate, PasswordLastSet |
    Sort-Object LastLogonDate

# Croiser avec les événements de connexion récents
Get-WinEvent -FilterHashtable @{
    LogName='Security'
    Id=4624
    StartTime=(Get-Date).AddDays(-7)
} | Where-Object {$_.Properties[5].Value -in $comptes_dormants}
```

## Framework MITRE ATT&CK

Le framework **MITRE ATT&CK** catalogue toutes les techniques d'attaque connues. C'est la bible du threat hunter.

```
Structure ATT&CK :
Tactiques (pourquoi) → Techniques (comment) → Procédures (implémentation)

Exemple :
Tactique    : Persistence (T1547)
Technique   : Boot/Logon Autostart Execution
Sous-tech.  : Registry Run Keys (T1547.001)
Procédure   : Malware X ajoute HKLM\Run\WindowsUpdate = malware.exe
```

```python
# Mapper vos détections au framework ATT&CK
hypotheses_hunting = [
    {
        "id": "HUNT-001",
        "hypothese": "Utilisation de DNS pour C2",
        "mitre_technique": "T1071.004",
        "mitre_nom": "Application Layer Protocol: DNS",
        "sources_donnees": ["DNS logs", "NetFlow"],
        "outils": ["Zeek", "RITA"]
    },
    {
        "id": "HUNT-002",
        "hypothese": "PowerShell encodé pour l'évasion",
        "mitre_technique": "T1059.001",
        "mitre_nom": "Command and Scripting Interpreter: PowerShell",
        "sources_donnees": ["Sysmon Event 1", "PowerShell logs"],
        "outils": ["Splunk", "Sigma"]
    }
]
```

## Outils de Threat Hunting

| Outil | Usage | Type |
|-------|-------|------|
| **Velociraptor** | Collecte forensique distribuée | Open source |
| **RITA** | Analyse de trafic réseau | Open source |
| **Zeek** | Analyse réseau avancée | Open source |
| **ELK Stack** | SIEM open source | Open source |
| **Splunk** | SIEM enterprise | Commercial |
| **Microsoft Sentinel** | SIEM cloud | Commercial |
| **CrowdStrike Falcon** | EDR + hunting | Commercial |

```bash
# Velociraptor - Collecte forensique à distance
# Déployer un serveur Velociraptor
./velociraptor-v0.7.0-linux-amd64 config generate -i
./velociraptor-v0.7.0-linux-amd64 --config server.config.yaml frontend

# Créer un artefact de hunting personnalisé
# Chercher les processus avec des connexions réseau inhabituelles
velociraptor artifact collect Windows.Network.Netstat
velociraptor artifact collect Windows.Persistence.PermanentWMIEvents
```

## Conclusion

Le Threat Hunting transforme la sécurité d'une posture réactive en approche proactive. En combinant **hypothèses basées sur le renseignement**, **données de qualité (Sysmon, EDR)** et **framework MITRE ATT&CK**, vous pouvez découvrir des attaquants qui ont contourné vos défenses automatisées. C'est le niveau supérieur de la cyberdéfense.