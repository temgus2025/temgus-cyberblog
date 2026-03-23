# Réponse aux incidents : gérer une cyberattaque en temps réel

Quand une cyberattaque se produit, chaque minute compte. Un plan de réponse aux incidents (IRP) bien préparé peut faire la différence entre une perturbation mineure et une catastrophe organisationnelle. Ce guide couvre le processus complet de gestion d'incident.

## Le cycle de réponse aux incidents (NIST)

```
6 phases du NIST SP 800-61 :

1. PRÉPARATION
   → Plan d'IRP documenté et testé
   → Équipe CSIRT (Computer Security Incident Response Team)
   → Outils préparés (forensics, communication)
   → Exercices réguliers (tabletop, simulations)

2. DÉTECTION ET ANALYSE
   → Identifier et confirmer l'incident
   → Classifier la sévérité
   → Documenter les preuves initiales

3. CONFINEMENT
   → Court terme : stopper la propagation immédiate
   → Long terme : stratégie de confinement sans perturber le business

4. ÉRADICATION
   → Supprimer la cause racine
   → Nettoyer tous les systèmes compromis

5. RECOVERY
   → Restaurer les systèmes et opérations
   → Vérifier que tout fonctionne normalement

6. POST-INCIDENT
   → Rapport d'incident complet
   → Leçons apprises
   → Amélioration des défenses
```

## Playbooks par type d'incident

### Ransomware

```markdown
## Playbook : Attaque Ransomware

### DÉTECTION (0-15 min)
Indicateurs :
□ Alertes EDR sur chiffrement massif de fichiers
□ Extensions de fichiers changées (.locked, .encrypted)
□ Note de rançon (README.txt, !!! READ ME !!!)
□ Shadow copies supprimées (Event ID 4688 vssadmin)
□ Désactivation d'antivirus (Event ID 7045)

### CONFINEMENT IMMÉDIAT (15-30 min)
□ Isoler les machines affectées du réseau (PHYSIQUEMENT)
□ NE PAS éteindre (préserver les preuves en RAM)
□ Activer le war room (RSSI, IT, Direction, Juridique, Communication)
□ Contacter l'assurance cyber IMMÉDIATEMENT
□ Identifier le patient zéro (première machine touchée)

### ÉVALUATION (30-60 min)
□ Périmètre : combien de machines affectées ?
□ Sauvegardes : intactes ? Testées récemment ? Isolées ?
□ Exfiltration : y a-t-il eu vol de données ?
□ Identification du groupe ransomware (note de rançon, extension)
   → ransomwhe.re, ID Ransomware pour identifier

### DÉCISION CRITIQUE
Si sauvegardes OK → NE PAS PAYER, restaurer
Si sauvegardes KO ET données critiques exfiltrées → Consulter juriste
Groupes sanctionnés OFAC (LockBit, Evil Corp...) → Paiement ILLÉGAL

### NOTIFICATION LÉGALE
□ ANSSI : cert.ssi.gouv.fr (obligatoire si OIV/OSE)
□ CNIL : dans 72h si données personnelles (RGPD)
□ Police nationale / Gendarmerie (plainte)
□ Assurance cyber

### ÉRADICATION
□ Identifier et supprimer tous les points de persistance
□ Réinitialiser TOUS les comptes et credentials
□ Patcher la vulnérabilité exploitée
□ Réinstaller les systèmes compromis (ne pas faire confiance à un nettoyage)

### RESTAURATION
□ Restaurer depuis sauvegardes propres UNIQUEMENT
□ Vérifier l'intégrité avant restauration (hashes)
□ Monitoring renforcé pendant 6 mois minimum
```

## Outils de réponse aux incidents

```bash
# Collecte forensique rapide avec Velociraptor
velociraptor artifact collect Windows.KapeFiles.Targets \
    --args "Device=C:" \
    --output /tmp/forensics/

# Collecte mémoire avec DumpIt
DumpIt.exe /output C:\memory.dmp

# Analyse des connexions réseau actives
netstat -anob > connexions.txt  # Windows
ss -antp > connexions.txt       # Linux

# Timeline des fichiers modifiés récemment
find / -mtime -7 -type f 2>/dev/null | grep -v /proc > recent_files.txt

# Processus suspects
ps aux --sort=-%cpu | head -20
Get-Process | Sort-Object CPU -Descending | Select-Object -First 20

# Persistence Windows
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
schtasks /query /fo LIST /v | findstr /i "task\|run\|status"
```

## Communication de crise

```
Principes de communication :

Interne (priorité) :
→ Direction informée EN PREMIER
→ Canal sécurisé (pas les emails compromis !)
→ Fréquence : toutes les heures en phase aiguë

Externe (contrôlée) :
→ Un seul porte-parole désigné
→ Ne jamais confirmer l'ampleur avant d'avoir les faits
→ "Nous avons détecté un incident de sécurité et avons activé
   nos procédures de réponse. Nous informerons dès que possible."

À éviter absolument :
→ Minimiser l'incident publiquement
→ Mentir sur l'impact
→ Communiquer des détails techniques qui aident l'attaquant
```

## Rapport post-incident

```markdown
# Rapport d'incident de sécurité

## Résumé exécutif
- Type d'incident : Ransomware LockBit 3.0
- Date de détection : 15 mars 2025, 08h23
- Date de résolution : 18 mars 2025, 17h00
- Systèmes affectés : 23 serveurs, 150 postes de travail
- Données exfiltrées : 2TB (données clients non sensibles)
- Temps d'arrêt : 72 heures

## Chronologie
[Timeline détaillée heure par heure]

## Cause racine
Credentials Citrix VPN volés via phishing + absence de MFA

## Impact
- Opérations : 72h d'interruption partielle
- Financier : 450 000€ (restauration + perte activité)
- Réputation : 3 articles de presse, aucun client perdu

## Leçons apprises
1. MFA n'était pas activé sur le VPN → Activé immédiatement
2. Sauvegardes non testées depuis 6 mois → Procédure mensuelle
3. Segmentation insuffisante → Plan de micro-segmentation lancé

## Actions correctives
[Plan d'action avec responsables et deadlines]
```

## Conclusion

Une réponse aux incidents efficace se prépare AVANT l'incident. Les organisations qui s'en sortent le mieux sont celles qui ont un plan documenté, une équipe formée et des sauvegardes testées. Comme pour la sécurité incendie : vous espérez ne jamais en avoir besoin, mais vous êtes content de l'avoir répété quand l'alerte sonne.

---
*Catégorie : Pentest*
