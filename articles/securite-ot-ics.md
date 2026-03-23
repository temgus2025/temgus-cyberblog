# Sécurité des environnements OT/ICS : protéger les infrastructures critiques

Les systèmes OT (Operational Technology) et ICS (Industrial Control Systems) contrôlent les centrales électriques, les usines, les réseaux d'eau et les pipelines. Une cyberattaque sur ces systèmes peut avoir des conséquences physiques catastrophiques — pannes électriques, contamination de l'eau, explosions industrielles.

## OT vs IT — Des mondes différents

```
Informatique classique (IT) :
Priorité : Confidentialité > Intégrité > Disponibilité
Cycle de vie : 3-5 ans (mise à jour facile)
Tolérance aux pannes : Redémarrage acceptable
Objectif : Traiter l'information

Technologie opérationnelle (OT) :
Priorité : Disponibilité > Intégrité > Confidentialité
Cycle de vie : 20-30 ans (impossible à patcher facilement)
Tolérance aux pannes : ZÉRO — une panne = conséquences physiques
Objectif : Contrôler des processus physiques

Exemple concret :
Un patch Windows sur un serveur IT → Redémarrage 5 min → OK
Un patch sur un automate industriel → Arrêt de production → Millions de pertes
```

## Architecture des systèmes industriels

```
Modèle Purdue (référence ICS) :

Niveau 4-5 : Réseau entreprise (IT)
├── ERP, emails, Internet
│
Niveau 3 : Operations Zone (DEMILITARIZED ZONE)
├── Historian (collecte données)
├── Remote Access
│
Niveau 2 : Supervisory Control
├── SCADA (Supervisory Control and Data Acquisition)
├── HMI (Human Machine Interface)
│
Niveau 1 : Local Control
├── PLC (Programmable Logic Controller)
├── RTU (Remote Terminal Unit)
│
Niveau 0 : Process
└── Capteurs, actionneurs, vannes, pompes, moteurs

Principe : Isolation stricte entre niveaux
La réalité : Ces niveaux sont de plus en plus interconnectés
→ IT/OT Convergence = augmentation massive des risques
```

## Protocoles industriels vulnérables

```python
# Protocoles conçus SANS sécurité (années 70-80)

protocoles_industriels = {
    "Modbus": {
        "description": "Protocole de communication série",
        "port": 502,
        "vulnerabilités": [
            "Aucune authentification",
            "Aucun chiffrement",
            "Commandes acceptées de n'importe qui sur le réseau"
        ],
        "impact": "Lire/écrire directement sur les registres d'un automate"
    },
    "DNP3": {
        "description": "Protocole SCADA (réseaux électriques, eau)",
        "vulnerabilités": [
            "Authentification optionnelle souvent désactivée",
            "Replay attacks possibles"
        ]
    },
    "EtherNet/IP": {
        "description": "Ethernet industriel",
        "port": 44818,
        "vulnerabilités": [
            "Peut exposer des automates sur Internet",
            "Commandes CIP non authentifiées"
        ]
    },
    "OPC-UA": {
        "description": "Standard moderne (2008)",
        "statut": "Meilleure sécurité mais pas parfait",
        "vulnerabilités": ["Mauvaises configurations TLS fréquentes"]
    }
}
```

```bash
# Scanner des équipements industriels exposés sur Internet avec Shodan
# shodan.io — moteur de recherche pour l'IoT/ICS

# Recherches Shodan pour systèmes ICS :
# port:502 → Modbus exposé sur Internet (des milliers !)
# port:102 → Siemens S7
# "SCADA" country:FR
# "Wonderware" OR "Ignition" OR "WinCC"

# Ces systèmes NE devraient JAMAIS être sur Internet
# Pourtant des milliers le sont

# Tester la communication Modbus (avec autorisation)
pip install pymodbus

from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('192.168.1.100', port=502)
client.connect()

# Lire les coils (sorties numériques)
result = client.read_coils(0, 10)
print(f"Coils: {result.bits}")

# Lire les registres holding
result = client.read_holding_registers(0, 10)
print(f"Registres: {result.registers}")

# DANGER : Écrire sur un registre = modifier un processus physique
# client.write_register(0, 1337)  # Ne JAMAIS faire sans autorisation !
```

## Attaques réelles sur les ICS

### Stuxnet (2010) — L'attaque qui a tout changé

```
Cible : Centrifugeuses d'enrichissement d'uranium iraniennes (Natanz)
Auteurs : NSA + Unité 8200 israélienne (jamais officiellement confirmé)
Sophistication : ★★★★★ (jamais vu avant)

Mécanisme :
1. Propagation via clés USB (air gap bypass)
2. Exploitation de 4 zero-days Windows simultanément
3. Ciblage TRÈS spécifique : seulement les automates Siemens S7-315
4. Modification discrète de la vitesse des centrifugeuses
5. Affichage de données normales aux opérateurs (rootkit ICS)
6. Les centrifugeuses s'autodétruisaient progressivement

Impact :
→ 1 000 centrifugeuses détruites
→ Programme nucléaire iranien retardé de 2 ans
→ Changement de paradigme : cyberattaque = effet physique réel
```

### Ukraine Power Grid (2015 et 2016)

```
Attaque 2015 (BlackEnergy) :
→ Phishing ciblé sur les opérateurs
→ Accès aux systèmes SCADA des centrales
→ Coupure de courant : 230 000 foyers pendant 6h
→ Effacement des firmware des équipements de terrain

Attaque 2016 (Industroyer/Crashoverride) :
→ Malware conçu spécifiquement pour les protocoles ICS
→ Supporte Modbus, IEC 104, IEC 61850, OPC DA
→ Attaque automatisée sans intervention humaine
→ Coupure de courant à Kiev

Leçon : Les systèmes ICS peuvent être attaqués
sans connaissance profonde des processus physiques
```

### Oldsmar Water Treatment (2021)

```
Incident :
→ Quelqu'un a accédé à distance à l'interface HMI d'une usine de traitement d'eau en Floride
→ A tenté d'augmenter la concentration de NaOH (soude) de 111ppm à 11 100ppm
→ Un opérateur vigilant a remarqué le curseur bouger seul et a annulé

Vecteur d'attaque :
→ TeamViewer installé sur le poste de contrôle
→ Mot de passe partagé entre plusieurs employés
→ Windows 7 non supporté
→ Connexion directe Internet sans VPN

Si non détecté :
→ Empoisonnement de l'eau potable de 15 000 habitants
```

## Défense des environnements OT

### Segmentation réseau

```
Architecture recommandée (NIST SP 800-82) :

Internet
   ↓ [Firewall strict]
Zone IT (DMZ)
   ↓ [Firewall unidirectionnel]
Zone OT Niveau 3 (Historian, Remote Access)
   ↓ [Data Diode = communication physiquement unidirectionnelle]
Zone OT Niveau 2 (SCADA, HMI)
   ↓ [Isolation physique si possible]
Zone OT Niveau 1 (PLC, RTU)
   ↓
Processus physique

Data Diode (Diode de données) :
→ Hardware qui ne peut physiquement transmettre que dans UN sens
→ Les données sortent mais rien ne peut entrer
→ Solution ultime pour les infrastructures critiques
→ Exemples : Waterfall Security, Owl Cyber Defense
```

### Détection d'anomalies ICS

```python
# Les IDS/IPS classiques ne comprennent pas les protocoles ICS
# Solutions spécialisées : Claroty, Dragos, Nozomi Networks, Fortinet FortiOT

# Principe de la détection par baseline comportementale :
# Dans un environnement industriel, les communications sont TRÈS répétitives
# Un automate lit les mêmes registres toutes les 100ms depuis des années
# Toute déviation = anomalie potentielle

class ICSAnomalyDetector:
    def __init__(self):
        self.baseline = {}  # Communications habituelles

    def apprendre_baseline(self, communications, jours=30):
        """Apprendre le comportement normal sur 30 jours"""
        for comm in communications:
            cle = f"{comm['src']}→{comm['dst']}:{comm['fonction']}"
            if cle not in self.baseline:
                self.baseline[cle] = {
                    'count': 0,
                    'registres': set(),
                    'valeurs_min': {},
                    'valeurs_max': {}
                }
            self.baseline[cle]['count'] += 1
            self.baseline[cle]['registres'].add(comm['registre'])

    def detecter_anomalie(self, communication):
        cle = f"{communication['src']}→{communication['dst']}:{communication['fonction']}"

        alertes = []

        # Nouvelle paire source/destination jamais vue
        if cle not in self.baseline:
            alertes.append(f"CRITIQUE: Communication inconnue {cle}")

        # Accès à un registre inhabituel
        elif communication['registre'] not in self.baseline[cle]['registres']:
            alertes.append(f"ALERTE: Accès registre inhabituel {communication['registre']}")

        # Valeur hors plage normale (ex: température, pression)
        elif 'valeur' in communication:
            val = communication['valeur']
            min_val = self.baseline[cle]['valeurs_min'].get(communication['registre'], val)
            max_val = self.baseline[cle]['valeurs_max'].get(communication['registre'], val)
            if val < min_val * 0.8 or val > max_val * 1.2:
                alertes.append(f"ALERTE: Valeur anormale {val} (normal: {min_val}-{max_val})")

        return alertes
```

## Cadres et standards ICS

```
Standards de référence :

IEC 62443 :
→ Standard international pour la cybersécurité industrielle
→ Couvre : politique, procédures, système, composants
→ Niveaux de sécurité SL1 à SL4

NIST SP 800-82 :
→ Guide for ICS Security (USA)
→ Très complet et gratuit
→ Référence mondiale

NERC CIP :
→ Obligatoire pour les opérateurs du réseau électrique en Amérique du Nord
→ CIP-005 : Electronic Security Perimeters
→ CIP-007 : Systems Security Management

En France :
→ ANSSI Guide "Maîtriser la SSI pour les systèmes industriels"
→ Directive NIS2 (obligation pour opérateurs d'importance vitale)
→ LPM (Loi de Programmation Militaire) pour les OIV
```

## Conclusion

La sécurité OT/ICS est un domaine où les enjeux dépassent la simple perte de données — une attaque réussie peut couper l'électricité d'une ville, contaminer l'eau potable ou provoquer une explosion industrielle. La convergence IT/OT impose de traiter ces environnements avec la même rigueur que les systèmes IT, tout en respectant leurs contraintes spécifiques : disponibilité absolue, protocoles legacy et cycle de vie de 20-30 ans.

---
*Catégorie : Sécurité industrielle*
