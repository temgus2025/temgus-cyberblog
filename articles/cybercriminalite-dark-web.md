# Cybercriminalité et dark web : comprendre l'écosystème

La cybercriminalité est devenue une industrie mondiale pesant plus de **8 000 milliards de dollars** en 2023. Comprendre comment fonctionne cet écosystème est essentiel pour mieux s'en défendre.

## L'écosystème de la cybercriminalité

```
Organisation de la cybercriminalité moderne :

Niveau 1 — Script Kiddies :
→ Débutants qui utilisent des outils prêts à l'emploi
→ Cibles faciles : sites non patchés, mots de passe faibles

Niveau 2 — Cybercriminels intermédiaires :
→ Acheteurs de Malware-as-a-Service, RaaS
→ Campagnes de phishing ciblées
→ Revendeurs de données volées

Niveau 3 — Groupes criminels organisés :
→ Structure professionnelle (RH, support, R&D)
→ Conti, LockBit, Cl0p, ALPHV
→ Revenus : centaines de millions par an

Niveau 4 — APT (Advanced Persistent Threats) :
→ Groupes sponsorisés par des États
→ APT28 (Russie), APT41 (Chine), Lazarus (Corée du Nord)
→ Espionnage industriel, sabotage d'infrastructure
```

## Le Dark Web — Démystification

```
Internet se divise en 3 couches :

Surface Web (4%) :
→ Google, Facebook, Wikipedia
→ Indexé par les moteurs de recherche

Deep Web (90%) :
→ Bases de données privées, intranets
→ Emails, dossiers médicaux, comptes bancaires
→ Non indexé mais pas illégal

Dark Web (6%) :
→ Accessible seulement via Tor ou I2P
→ Anonymat renforcé
→ Usages légitimes ET illégaux
```

### Comment fonctionne Tor

```
Réseau Tor = The Onion Router

Connexion normale :
Vous → [Texte en clair] → Site web (FAI voit tout)

Avec Tor :
Vous → [Chiffré 3x] → Nœud 1 → Nœud 2 → Nœud 3 → Site web

Chaque nœud ne connaît que son prédécesseur et successeur.
Jamais la source ET la destination simultanément.

Les .onion :
→ Adresses accessibles uniquement via Tor
→ Exemple : facebookwkhpilnemxj7asber7cybxd.onion (vrai Facebook)
→ Serveur hébergé de façon anonyme
```

## Les marchés du dark web

```python
categories_marches = {
    "données_volées": {
        "compte_netflix": "1-5$",
        "carte_bancaire_cvv": "5-20$",
        "dossier_médical": "50-200$",
        "passeport_scanné": "100-500$",
        "logs_stealer_1000_comptes": "10-50$"
    },
    "malwares": {
        "RedLine_Stealer_abonnement": "100-200$/mois",
        "Ransomware_affilié": "20-30% des rançons",
        "Botnet_location": "200-500$/semaine",
        "Zero-day_exploit": "10 000 - 500 000$"
    },
    "services": {
        "DDoS_1h": "20-100$",
        "Phishing_kit_Office365": "50-200$",
        "SIM_swap": "500-2000$"
    }
}
```

### Marchés démantelés

```
Opérations policières majeures :

Silk Road (2013) :
→ Ross Ulbricht arrêté
→ 1 milliard de dollars saisi

AlphaBay (2017) :
→ 200 000 utilisateurs
→ Démantelé par FBI/Europol

Hansa (2017) :
→ Europol a géré secrètement le site pendant 1 mois
→ Collecte de preuves avant fermeture

Genesis Market (2023) :
→ 119 arrestations dans 17 pays

Operation Cronos (2024) :
→ Saisie des infrastructures LockBit
→ 34 serveurs saisis, 200 crypto wallets gelés

Operation Endgame (2024) :
→ Démantèlement de botnets majeurs
→ Plus grande opération anti-botnet de l'histoire
```

## Les stealers — Vol de données automatisé

```python
# Les stealers volent automatiquement depuis les navigateurs :
# mots de passe, cookies, historique, cartes bancaires, wallets crypto

donnees_volees = {
    "navigateurs": ["Chrome", "Firefox", "Edge", "Brave"],
    "types_données": [
        "Mots de passe sauvegardés",
        "Cookies de session (bypass 2FA !)",
        "Données autofill (cartes bancaires)",
        "Historique de navigation"
    ],
    "crypto_wallets": ["MetaMask", "Exodus", "Electrum"],
    "applications": ["Discord tokens", "Telegram sessions", "Steam"]
}

# Exfiltration via Telegram Bot ou panel web
# Logs vendus sur Russian Market, 2easy
# Prix : 1-10$ par victime selon la valeur des données

# Protection :
# → Ne jamais sauvegarder les mots de passe dans le navigateur
# → Utiliser Bitwarden ou KeePassXC
# → Activer les notifications de connexion inhabituelles
# → Vérifier Have I Been Pwned régulièrement (haveibeenpwned.com)
```

## Les groupes APT — Cybercriminalité étatique

```
Lazarus Group (Corée du Nord) :
Motivation : Financement du régime sous sanctions
Attaques notables :
→ Sony Pictures hack (2014)
→ Bangladesh Bank heist (81M$, 2016)
→ WannaCry (2017)
→ Ronin Bridge hack (625M$, 2022)
Spécialité : Vol de cryptomonnaies

APT28 / Fancy Bear (Russie) :
Motivation : Espionnage politique et militaire
Attaques notables :
→ DNC hack (élections US 2016)
→ TV5Monde (2015)
Spécialité : Influence politique, désinformation

APT41 (Chine) :
Motivation : Espionnage industriel + cybercriminalité
Attaques notables :
→ Equifax breach (145M dossiers, 2017)
→ Vol de propriété intellectuelle massif
Spécialité : R&D industrielle, jeux vidéo
```

## Lutte contre la cybercriminalité

```
Organismes de lutte :

Europol EC3 :
→ Coordonne les enquêtes européennes
→ Opérations : Chronos, Endgame, Genesis

FBI Cyber Division :
→ IC3 (Internet Crime Complaint Center)
→ Signalement : ic3.gov

ANSSI (France) :
→ Signalement incidents : cert.ssi.gouv.fr

Signaler en France :
→ cybermalveillance.gouv.fr
→ Plainte à la police/gendarmerie
→ Pharos pour les contenus illicites
```

## Conclusion

La cybercriminalité est une industrie organisée et professionnelle. Comprendre son fonctionnement — stealers, marchés dark web, groupes APT — permet d'anticiper les menaces. Les opérations récentes comme Cronos et Endgame prouvent que même les groupes les plus sophistiqués peuvent être démantelés. La vigilance individuelle et collective reste la meilleure défense.

---
*Catégorie : Cybercriminalité*
