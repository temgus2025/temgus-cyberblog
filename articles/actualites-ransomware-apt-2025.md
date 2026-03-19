# Ransomwares et groupes APT : bilan des menaces 2024-2025

L'année 2024 a été marquée par des attaques d'une sophistication et d'un impact sans précédent. Démantèlements d'infrastructures criminelles, rançons records, attaques contre les infrastructures critiques — voici le bilan des menaces majeures.

## Les événements marquants de 2024

### L'opération Cronos contre LockBit
En février 2024, une opération internationale coordonnée par Europol et le FBI a démantelé l'infrastructure de **LockBit**, le groupe de ransomware-as-a-service le plus actif au monde. Les autorités ont saisi 34 serveurs, arrêté 5 membres, récupéré plus de 1 000 clés de déchiffrement et gelé 200 comptes cryptomonnaie.

Malgré ce coup dur, LockBit a annoncé reprendre ses activités quelques semaines plus tard — illustrant la résilience des groupes criminels organisés.

### L'attaque contre Change Healthcare
En février 2024, le groupe **ALPHV/BlackCat** a frappé Change Healthcare, un acteur majeur du traitement de paiements médicaux aux États-Unis. Résultat : des milliers de pharmacies et hôpitaux incapables de traiter les paiements pendant des semaines, une rançon de 22 millions de dollars payée, et plus de 100 millions d'Américains dont les données ont été exposées.

### MGM Resorts et Scattered Spider
Le groupe **Scattered Spider**, composé majoritairement de jeunes anglophones, a causé plus de 100 millions de dollars de pertes chez MGM Resorts. Leur technique signature : le **vishing** ciblant les équipes helpdesk pour réinitialiser les accès MFA.

## Les tendances 2024-2025

### Escalade des rançons
- Rançon moyenne en 2024 : **2,73 millions de dollars** (source : Sophos)
- Record absolu : **75 millions de dollars** payés à Dark Angels

### Double et triple extorsion
Les groupes ne se contentent plus de chiffrer les données. Ils :
1. **Chiffrent** les systèmes
2. **Exfiltrent** les données et menacent de les publier
3. Contactent **directement les clients** de la victime pour augmenter la pression
4. Lancent des **attaques DDoS** simultanées

### Ciblage des backups
Les attaquants s'attaquent en priorité aux sauvegardes avant de chiffrer les données de production, rendant la récupération sans paiement de rançon quasi impossible.

### Living Off the Land (LotL)
Les groupes APT utilisent de plus en plus les outils légitimes déjà présents sur les systèmes (PowerShell, WMI, PsExec) pour se déplacer sans déclencher les antivirus.

## Les groupes APT étatiques actifs

### APT29 / Cozy Bear (Russie)
Lié au SVR (renseignement extérieur russe). Actif contre les gouvernements occidentaux et les chaînes d'approvisionnement logicielles. Responsable de la compromission de SolarWinds en 2020, toujours actif en 2024-2025.

**Techniques caractéristiques :** spear-phishing ciblé, compromission de la supply chain, utilisation de zero-days.

### Volt Typhoon (Chine)
Groupe APT lié à l'armée chinoise révélé en 2023. Cible les **infrastructures critiques** américaines (énergie, eau, transport) dans une logique de pré-positionnement.

**Particularité :** utilise exclusivement des techniques LotL pour rester indétectable.

### Lazarus Group (Corée du Nord)
Spécialisé dans le vol de cryptomonnaies pour financer le régime. En 2024, responsable du vol de plusieurs centaines de millions de dollars en actifs numériques.

## Comment se protéger

### Pour les entreprises
- **Segmentation réseau** : limiter la propagation latérale
- **Sauvegardes 3-2-1 hors ligne** : 3 copies, 2 supports différents, 1 hors site ET hors ligne
- **EDR** : détecter les comportements suspects
- **Plan de réponse aux incidents** testé et à jour
- **Formation anti-phishing** régulière

### Pour les individus
- **MFA** sur tous les comptes critiques
- **Sauvegardes régulières** hors ligne
- **Mises à jour** rapides des systèmes
- **Méfiance** envers les appels téléphoniques demandant des accès

## Ressources pour suivre l'actualité cyber

- **CERT-FR** (cert.ssi.gouv.fr) : alertes officielles françaises
- **CISA** (cisa.gov) : agence américaine de cybersécurité
- **Bleeping Computer** : actualités ransomware détaillées
- **The Record** : journalisme cyber de qualité

## Conclusion

Le paysage des menaces en 2024-2025 montre une professionnalisation croissante des groupes criminels et une sophistication des attaques étatiques. La défense doit être proactive, avec une veille constante et des plans de résilience testés régulièrement.
