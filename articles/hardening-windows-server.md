# Hardening Windows Server : durcissement complet

Un Windows Server fraîchement installé est loin d'être sécurisé par défaut. Le hardening (durcissement) consiste à réduire la surface d'attaque en désactivant les services inutiles, en configurant les politiques de sécurité et en appliquant les meilleures pratiques. Ce guide suit le CIS Benchmark Windows Server.

## Pourquoi durcir Windows Server ?

```
Un Windows Server par défaut expose :
→ SMBv1 activé (EternalBlue !)
→ NTLM activé (Pass-the-Hash)
→ Télémétrie Microsoft activée
→ Services inutiles en cours d'exécution
→ Comptes locaux avec mots de passe faibles
→ PowerShell sans journalisation
→ Pas de pare-feu configuré
→ RDP exposé sur tous les ports
```

## Étape 1 : Mises à jour et patches

```powershell
# Vérifier les mises à jour manquantes
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 10

# Installer toutes les mises à jour
Install-Module PSWindowsUpdate
Get-WindowsUpdate -AcceptAll -AutoReboot

# Configurer Windows Update automatique
$WUSettings = (New-Object -ComObject "Microsoft.Update.AutoUpdate").Settings
$WUSettings.NotificationLevel = 4  # Auto download and install
$WUSettings.Save()

# Vérifier les mises à jour critiques manquantes avec MBSA ou WSUS
```

## Étape 2 : Comptes et authentification

```powershell
# Renommer le compte Administrateur par défaut
Rename-LocalUser -Name "Administrateur" -NewName "Admin_$(Get-Random -Maximum 9999)"

# Désactiver le compte Invité
Disable-LocalUser -Name "Invité"

# Politique de mots de passe forte
# Via Group Policy Management ou localement :
net accounts /minpwlen:14       # Minimum 14 caractères
net accounts /maxpwage:90       # Expiration 90 jours
net accounts /minpwage:1        # Minimum 1 jour entre changements
net accounts /uniquepw:24       # Mémoriser 24 mots de passe
net accounts /lockoutthreshold:5 # Verrouillage après 5 tentatives
net accounts /lockoutduration:30  # Durée verrouillage 30 min

# Configurer via Security Policy (plus complet)
secedit /export /cfg security_policy.cfg
# Modifier security_policy.cfg puis :
secedit /configure /db secedit.sdb /cfg security_policy.cfg

# Vérifier les comptes locaux actifs
Get-LocalUser | Where-Object {$_.Enabled -eq $true} | Select-Object Name, LastLogon, PasswordLastSet
```

## Étape 3 : Désactiver les protocoles obsolètes

```powershell
# Désactiver SMBv1 (EternalBlue)
Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force
Set-SmbClientConfiguration -EnableSMB1Protocol $false -Force

# Désactiver Telnet (si présent)
Disable-WindowsOptionalFeature -Online -FeatureName TelnetClient

# Désactiver LLMNR (Link-Local Multicast Name Resolution) - utilisé pour Responder
# Via GPO : Computer Configuration → Admin Templates → Network → DNS Client
# "Turn off multicast name resolution" → Enabled
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient" `
  -Name "EnableMulticast" -Value 0 -Type DWord

# Désactiver NetBIOS sur toutes les interfaces
$adapters = Get-WmiObject Win32_NetworkAdapterConfiguration
foreach ($adapter in $adapters) {
    $adapter.SetTCPIPNetBIOS(2)  # 2 = Disable NetBIOS
}

# Désactiver WPAD (Web Proxy Auto Discovery) - risque de poisoning
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings\Wpad" `
  -Name "WpadOverride" -Value 1

# Désactiver NTLM version 1
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" `
  -Name "LmCompatibilityLevel" -Value 5
# 5 = Refuser authentification LM et NTLMv1
```

## Étape 4 : Services et fonctionnalités

```powershell
# Désactiver les services inutiles
$services_to_disable = @(
    "Fax",           # Service de fax
    "XboxGipSvc",    # Gaming Xbox
    "XblAuthManager",
    "WMPNetworkSvc", # Windows Media Player réseau
    "RemoteRegistry", # Registre distant (risque)
    "SSDPSRV",       # UPnP (risque découverte réseau)
    "upnphost"       # UPnP host
)

foreach ($service in $services_to_disable) {
    if (Get-Service -Name $service -ErrorAction SilentlyContinue) {
        Stop-Service -Name $service -Force -ErrorAction SilentlyContinue
        Set-Service -Name $service -StartupType Disabled
        Write-Host "Désactivé : $service"
    }
}

# Désactiver les fonctionnalités Windows inutiles
$features_to_disable = @(
    "Internet-Explorer-Optional-amd64",
    "WorkFolders-Client",
    "WindowsMediaPlayer",
    "Printing-PrintToPDFServices-Features"
)

foreach ($feature in $features_to_disable) {
    Disable-WindowsOptionalFeature -Online -FeatureName $feature -NoRestart -ErrorAction SilentlyContinue
}
```

## Étape 5 : Pare-feu Windows

```powershell
# Activer le pare-feu sur tous les profils
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True

# Politique par défaut : bloquer les connexions entrantes
Set-NetFirewallProfile -Profile Domain,Public,Private -DefaultInboundAction Block
Set-NetFirewallProfile -Profile Domain,Public,Private -DefaultOutboundAction Allow

# Autoriser seulement ce qui est nécessaire
# RDP seulement depuis le réseau d'administration
New-NetFirewallRule -DisplayName "RDP Admin Only" `
  -Direction Inbound -Protocol TCP -LocalPort 3389 `
  -RemoteAddress "10.0.0.0/8" -Action Allow

# WinRM (PowerShell Remoting) seulement depuis admin
New-NetFirewallRule -DisplayName "WinRM Admin Only" `
  -Direction Inbound -Protocol TCP -LocalPort 5985,5986 `
  -RemoteAddress "10.0.0.0/8" -Action Allow

# Bloquer explicitement les ports dangereux
New-NetFirewallRule -DisplayName "Block Telnet" `
  -Direction Inbound -Protocol TCP -LocalPort 23 -Action Block

New-NetFirewallRule -DisplayName "Block SMBv1 External" `
  -Direction Inbound -Protocol TCP -LocalPort 445 `
  -RemoteAddress Internet -Action Block

# Vérifier les règles actives
Get-NetFirewallRule | Where-Object {$_.Enabled -eq "True" -and $_.Direction -eq "Inbound"} |
  Select-Object DisplayName, Action, Protocol | Format-Table
```

## Étape 6 : Audit et journalisation

```powershell
# Activer l'audit avancé (catégories détaillées)
# Via auditpol.exe

# Logon/Logoff
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
auditpol /set /subcategory:"Logoff" /success:enable
auditpol /set /subcategory:"Account Lockout" /failure:enable

# Credential Validation
auditpol /set /subcategory:"Credential Validation" /success:enable /failure:enable

# Process Creation (voir quels programmes sont lancés)
auditpol /set /subcategory:"Process Creation" /success:enable

# Object Access (fichiers sensibles)
auditpol /set /subcategory:"File System" /success:enable /failure:enable
auditpol /set /subcategory:"Registry" /failure:enable

# Policy Changes
auditpol /set /subcategory:"Audit Policy Change" /success:enable /failure:enable
auditpol /set /subcategory:"Security Group Management" /success:enable

# Configurer la taille et rétention des logs
wevtutil sl Security /ms:1073741824  # 1GB pour le log Security
wevtutil sl System /ms:102400000     # 100MB pour System
wevtutil sl Application /ms:102400000

# Centraliser les logs vers un SIEM
# Windows Event Forwarding (WEF)
winrm quickconfig -q
wecutil cs subscription.xml  # Configuration de la collecte
```

## Étape 7 : PowerShell sécurisé

```powershell
# Configurer l'ExecutionPolicy
Set-ExecutionPolicy AllSigned -Scope LocalMachine
# AllSigned = seulement les scripts signés par une CA de confiance

# Activer la journalisation PowerShell complète
$LogPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell"

# ScriptBlock Logging (log tout le code PowerShell exécuté)
Set-ItemProperty -Path "$LogPath\ScriptBlockLogging" -Name "EnableScriptBlockLogging" -Value 1

# Module Logging (log les modules chargés)
Set-ItemProperty -Path "$LogPath\ModuleLogging" -Name "EnableModuleLogging" -Value 1

# Transcription (log de tout ce qui se passe dans la console)
Set-ItemProperty -Path "$LogPath\Transcription" -Name "EnableTranscripting" -Value 1
Set-ItemProperty -Path "$LogPath\Transcription" -Name "OutputDirectory" -Value "C:\PSLogs"
Set-ItemProperty -Path "$LogPath\Transcription" -Name "EnableInvocationHeader" -Value 1

# Configurer PowerShell Constrained Language Mode (limiter les capacités)
# Via GPO : AppLocker ou WDAC
```

## Étape 8 : RDP sécurisé

```powershell
# Si RDP est nécessaire, le sécuriser correctement

# Changer le port par défaut (3389 → port non standard)
Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" `
  -Name "PortNumber" -Value 13389  # Port personnalisé

# Activer NLA (Network Level Authentication)
Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp" `
  -Name "UserAuthentication" -Value 1

# Limiter les tentatives de connexion RDP
# Via GPO : Account Lockout Policy

# Activer la journalisation des sessions RDP
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Terminal Services" `
  -Name "fLogonDisabled" -Value 0

# Désactiver le clipboard et partage de fichiers RDP (si non nécessaire)
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Terminal Services" `
  -Name "fDisableClip" -Value 1
```

## Étape 9 : LAPS (Local Administrator Password Solution)

```powershell
# LAPS gère automatiquement les mots de passe des comptes admins locaux
# Mot de passe unique par machine, stocké dans Active Directory

# Installer LAPS (Windows LAPS intégré dans Windows Server 2022)
# Ancienne version :
# Install-Module LAPS -Scope AllUsers

# Configuration LAPS
Set-AdmPwdComputerSelfPermission -Identity "Computers"
Set-AdmPwdReadPasswordPermission -Identity "Computers" -AllowedPrincipals "Domain Admins"

# Configurer via GPO :
# Computer Config → Admin Templates → LAPS
# Enable : Mot de passe complexe, 14 chars min, expiration 30 jours

# Récupérer le mot de passe admin d'un poste (depuis AD)
Get-AdmPwdPassword -ComputerName "SERVEUR01"
```

## Vérification avec CIS-CAT

```bash
# CIS-CAT Lite - Outil d'audit gratuit contre le CIS Benchmark
# https://www.cisecurity.org/cis-benchmarks/

# Lancer l'audit
.\CISCAT_Lite.bat -xccdf CIS_Microsoft_Windows_Server_2022_Benchmark_v2.0.0-xccdf.xml \
  -profile "Level 1 - Member Server"

# Score > 80% = bonne configuration
# Chaque non-conformité est documentée avec la correction

# Alternative gratuite : Microsoft Security Compliance Toolkit
# https://www.microsoft.com/en-us/download/details.aspx?id=55319
```

## Script de hardening automatisé

```powershell
# hardening.ps1 - Script de durcissement rapide
# À adapter selon votre environnement !

Write-Host "=== Hardening Windows Server ===" -ForegroundColor Cyan

# 1. SMBv1
Write-Host "[1] Désactivation SMBv1..."
Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart
Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force

# 2. LLMNR
Write-Host "[2] Désactivation LLMNR..."
New-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient" `
  -Name "EnableMulticast" -Value 0 -PropertyType DWord -Force

# 3. NTLMv1
Write-Host "[3] Désactivation NTLMv1..."
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" `
  -Name "LmCompatibilityLevel" -Value 5

# 4. Pare-feu
Write-Host "[4] Configuration pare-feu..."
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
Set-NetFirewallProfile -Profile Domain,Public,Private -DefaultInboundAction Block

# 5. Audit
Write-Host "[5] Activation audit..."
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
auditpol /set /subcategory:"Credential Validation" /success:enable /failure:enable
auditpol /set /subcategory:"Process Creation" /success:enable

# 6. PowerShell logging
Write-Host "[6] Journalisation PowerShell..."
$LogPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging"
New-Item -Path $LogPath -Force | Out-Null
Set-ItemProperty -Path $LogPath -Name "EnableScriptBlockLogging" -Value 1

Write-Host "=== Hardening terminé ===" -ForegroundColor Green
Write-Host "Redémarrage recommandé pour appliquer tous les changements."
```

## Conclusion

Le hardening Windows Server est un processus continu, pas une action ponctuelle. Référencez-vous au **CIS Benchmark Windows Server** et au **DISA STIG** pour avoir une liste exhaustive et priorisée. Automatisez avec des scripts PowerShell et vérifiez régulièrement la conformité avec CIS-CAT. Un serveur bien durci réduit de 80% la surface d'attaque exploitable par les attaquants.

---
*Retour à l'accueil : [Temgus.CyberBlog](../index.html)*
