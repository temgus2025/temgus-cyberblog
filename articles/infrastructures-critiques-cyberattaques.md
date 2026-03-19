# Infrastructures critiques sous attaque : eau, énergie, hôpitaux

Les infrastructures critiques — réseaux électriques, systèmes de distribution d'eau, hôpitaux, transports — sont devenues des cibles prioritaires des cyberattaquants étatiques et criminels. Les conséquences d'une attaque réussie peuvent être catastrophiques pour des populations entières.

## Pourquoi les infrastructures critiques sont ciblées

### Valeur stratégique
Pour les États, compromettre l'infrastructure critique d'un adversaire offre un levier de pression considérable en cas de conflit. La cyber-guerre précède et accompagne désormais les conflits conventionnels.

### Valeur financière
Pour les groupes criminels, les infrastructures critiques paient souvent les rançons — une interruption de service peut coûter des millions par heure.

### Vulnérabilité des systèmes OT
Les systèmes de contrôle industriels (SCADA, ICS) ont été conçus pour la disponibilité et la longévité, pas pour la sécurité. Beaucoup tournent sur des OS obsolètes, sans correctifs, avec des protocoles non chiffrés.

## Incidents marquants récents

### Attaque contre Colonial Pipeline (2021)
Le groupe DarkSide a chiffré les systèmes IT de Colonial Pipeline, l'un des plus grands opérateurs d'oléoducs américains. La compagnie a arrêté préventivement les opérations OT, provoquant des pénuries de carburant sur toute la côte Est américaine. Rançon payée : 4,4 millions de dollars.

**Vecteur initial** : compte VPN sans MFA avec credentials compromis.

### Attaque contre l'eau de Oldsmar, Floride (2021)
Un attaquant a pris le contrôle du système de traitement d'eau d'Oldsmar et tenté d'augmenter la concentration de soude caustique à 111 fois le niveau normal. Un opérateur vigilant a détecté la manipulation en temps réel.

**Vecteur** : TeamViewer accessible publiquement avec des credentials partagés.

### Attaques contre les hôpitaux européens
En France, les hôpitaux de Corbeil-Essonnes (2022), Versailles (2022) et Cannes (2024) ont été victimes de ransomwares. Ces attaques ont forcé des déprogrammations d'opérations, des transferts de patients et des retours aux procédures papier.

### Volt Typhoon et les infrastructures américaines
Le groupe APT chinois Volt Typhoon a infiltré des infrastructures critiques américaines (eau, énergie, transport) sans déclencher d'actions destructives — une stratégie de pré-positionnement pour un conflit futur.

## Les spécificités des systèmes OT

### Protocoles industriels non sécurisés

```
Modbus TCP  : pas d'authentification, pas de chiffrement
DNP3        : authentification optionnelle et faible
OPC-UA      : plus récent, meilleure sécurité
BACnet      : bâtiments, peu sécurisé
Profinet    : automatisme industriel
```

### Convergence IT/OT — Le problème

Historiquement, les réseaux OT (Operational Technology) étaient **air-gappés** — physiquement isolés d'Internet. La modernisation et la télémaintenance ont créé des connexions entre les réseaux IT et OT, exposant les systèmes industriels.

```
❌ Architecture convergée non sécurisée
Internet → IT → OT → SCADA → Processus physique

✅ Architecture correcte
Internet → DMZ → IT
                  ↓ (accès contrôlé, unidirectionnel si possible)
                  OT → SCADA → Processus physique
```

### Contraintes spécifiques
- **Disponibilité avant tout** : on ne peut pas redémarrer une centrale nucléaire pour patcher
- **Systèmes legacy** : Windows XP toujours présent dans certaines installations
- **Temps réel** : les correctifs peuvent perturber les opérations
- **Longévité** : équipements conçus pour 20-30 ans

## Cadre réglementaire français

### Les Opérateurs d'Importance Vitale (OIV)
La France a désigné environ 250 OIV dans 12 secteurs (énergie, eau, santé, transport...). Ces organisations doivent respecter des règles de sécurité définies par l'ANSSI et sont soumises à des audits réguliers.

### NIS2 et les infrastructures critiques
La directive NIS2 renforce les obligations des opérateurs d'infrastructures critiques, notamment sur la gestion des incidents, la sécurité de la chaîne d'approvisionnement et les tests de résilience.

## Bonnes pratiques pour sécuriser les infrastructures critiques

### Segmentation réseau stricte
```
Niveau 4 : Réseau d'entreprise (IT)
    ↓ Firewall + DMZ
Niveau 3 : Supervision et gestion des opérations
    ↓ Firewall + Data Diode (sens unique)
Niveau 2 : Contrôle des processus (DCS, SCADA)
    ↓ Firewall
Niveau 1 : Contrôle local (automates, capteurs)
Niveau 0 : Processus physique
```

### Inventaire des actifs OT
Vous ne pouvez pas protéger ce que vous ne connaissez pas. Un inventaire exhaustif de tous les équipements OT, avec versions firmware et connexions, est la première étape.

### Surveillance du réseau OT
```bash
# Outils spécialisés OT
# Claroty, Nozomi Networks, Dragos — solutions commerciales
# Zeek + plugins OT pour les protocoles industriels (Modbus, DNP3)

# Détecter les anomalies :
# - Nouveaux équipements sur le réseau
# - Communications inhabituelles entre équipements
# - Modifications de configuration des automates
```

### Gestion des accès distants
Les accès de maintenance à distance sont un vecteur majeur. Chaque accès doit être :
- Authentifié (MFA obligatoire)
- Enregistré et audité
- Limité dans le temps (just-in-time access)
- Supervisé en temps réel

## Plan de continuité et résilience

Une infrastructure critique doit fonctionner même en cas de cyberattaque :
- **Mode dégradé manuel** documenté et exercé régulièrement
- **Isolation d'urgence** : procédure pour déconnecter l'OT de l'IT en quelques minutes
- **Sauvegardes hors ligne** des configurations d'automates
- **Exercices de crise** réguliers (ex : ENTRAÎNEMENT CYBERSÉCURITÉ secteur santé)

## Conclusion

La sécurité des infrastructures critiques est un enjeu de sécurité nationale. Les attaques contre ces systèmes peuvent avoir des conséquences directes sur des vies humaines. L'approche doit combiner segmentation réseau rigoureuse, surveillance comportementale des réseaux OT et plans de continuité robustes. La menace est réelle — Volt Typhoon nous rappelle que des attaquants sont peut-être déjà dans ces réseaux, silencieusement.
