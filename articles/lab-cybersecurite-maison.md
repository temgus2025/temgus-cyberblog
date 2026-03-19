# Monter son lab cybersécurité à la maison : guide complet

Un lab personnel est le meilleur investissement pour progresser en cybersécurité. Il vous permet de pratiquer legalement, d'expérimenter librement et de simuler des environnements d'entreprise réels. Voici comment le construire selon votre budget.

## Pourquoi un lab personnel ?

- **Pratique légale** : vous êtes propriétaire de votre environnement
- **Liberté totale** : testez n'importe quelle technique sans risque
- **Simulation réaliste** : Active Directory, réseau d'entreprise, serveurs vulnérables
- **Différenciateur CV** : un lab documenté impressionne les recruteurs

## Option 1 : Lab 100% virtuel (budget ~0€)

La solution la plus accessible : tout sur votre machine actuelle.

### Logiciels nécessaires
- **VirtualBox** (gratuit) ou **VMware Workstation Player** (gratuit pour usage perso)
- **Kali Linux** : votre machine attaquante
- **Windows 10/11 Evaluation** : cibles Windows (licences d'évaluation gratuites 90 jours)
- **Metasploitable 2/3** : Linux volontairement vulnérable
- **VulnHub** : centaines de VMs vulnérables gratuites

### Configuration minimale recommandée
- **RAM** : 16 Go minimum (8 Go pour l'hôte + 8 Go pour les VMs)
- **Stockage** : 200 Go SSD libre
- **CPU** : 4 cœurs avec virtualisation (VT-x/AMD-V activée dans le BIOS)

### Réseau virtuel
```
[Kali Linux] ──── [Réseau NAT/Host-only] ──── [Metasploitable]
                                          ──── [Windows 10]
                                          ──── [Windows Server]
```

Configurez un réseau "Host-only" pour isoler vos VMs d'Internet.

## Option 2 : Lab avec mini-PC dédié (budget 150-400€)

Un mini-PC dédié évite de ralentir votre machine principale.

### Matériel recommandé
- **Intel NUC** ou **Beelink Mini PC** : 150-300€ (reconditionné possible)
- **RAM** : 32 Go DDR4 (~60€)
- **SSD** : 500 Go NVMe (~50€)
- **Total** : 250-400€

### Logiciel d'hyperviseur
- **Proxmox VE** (gratuit) : excellent hyperviseur open source, interface web
- **VMware ESXi** (gratuit pour usage personnel)

### Avantages
- Toujours disponible, accessible à distance
- N'impacte pas votre machine principale
- Peut tourner 24/7

## Option 3 : Lab physique avec matériel réseau (budget 500-1000€)

Pour simuler un environnement d'entreprise complet avec du vrai matériel réseau.

### Matériel
- **Switch manageable** : Cisco Catalyst 2960 reconditionné (~50€ sur eBay)
- **Routeur/Firewall** : pfSense sur mini-PC ou Cisco reconditionné
- **Serveur** : Dell PowerEdge R620/R630 reconditionné (~200-400€)
- **Câblage RJ45**

### Topologie exemple
```
Internet
    │
[pfSense Firewall]
    │
[Switch manageable]
    ├── VLAN 10 : Machines attaquantes (Kali)
    ├── VLAN 20 : Cibles Windows (AD)
    ├── VLAN 30 : Serveurs Linux vulnérables
    └── VLAN 99 : Management
```

## Construire un environnement Active Directory

L'AD est incontournable en pentest d'entreprise. Voici comment en monter un :

### VMs nécessaires
1. **Windows Server 2019/2022** (Controller de domaine) - licence évaluation 180 jours
2. **Windows 10/11** x2 (postes clients)
3. **Kali Linux** (attaquant)

### Installation basique
```powershell
# Sur Windows Server - Installer AD DS
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools

# Promouvoir en contrôleur de domaine
Install-ADDSForest `
    -DomainName "lab.local" `
    -DomainNetbiosName "LAB" `
    -InstallDns:$true `
    -Force:$true
```

### Rendre le lab volontairement vulnérable
Pour pratiquer les attaques AD réelles :
- Créer des comptes avec des mots de passe faibles
- Configurer des délégations Kerberos non contraintes
- Laisser SMBv1 activé
- Créer des GPO mal configurées

**Ressource** : **GOAD** (Game of Active Directory) — lab AD pré-configuré avec de nombreuses vulnérabilités.

## Machines vulnérables recommandées

### VulnHub (gratuit, offline)
- **Mr. Robot** : niveau intermédiaire, inspiré de la série
- **Kioptrix** : série parfaite pour débuter
- **HackLAB: Vulnix** : Linux avec vulnérabilités classiques

### TryHackMe (abonnement ~10€/mois)
Machines guidées avec hints, parfait pour apprendre.

### HackTheBox (gratuit + premium)
Machines de qualité professionnelle, communauté active.

## Documenter son lab

Un lab bien documenté est un atout pour votre CV :

```markdown
# Mon Lab Cybersécurité

## Infrastructure
- Hyperviseur : Proxmox VE 8.1
- Réseau : 192.168.100.0/24 isolé

## Machines
| Nom | OS | Rôle | IP |
|-----|-----|------|-----|
| kali | Kali 2024 | Attaquant | 192.168.100.10 |
| dc01 | Windows Server 2022 | AD DC | 192.168.100.100 |
| web01 | Ubuntu 22.04 | Serveur web | 192.168.100.20 |

## Write-ups réalisés
- [Machine X] - Exploitation SQLi + PrivEsc via SUID
- [Machine Y] - Pass-the-Hash AD
```

Publiez cette documentation sur GitHub !

## Conclusion

Vous n'avez pas besoin d'un budget énorme pour démarrer. Un laptop avec 16 Go de RAM et VirtualBox suffit pour progresser significativement. L'important est de pratiquer régulièrement et de documenter vos apprentissages. Commencez simple, enrichissez progressivement, et n'oubliez pas : c'est en cassant des choses qu'on apprend à les protéger.
