# Attaques supply chain : compromettre par les fournisseurs

Les attaques supply chain (chaîne d'approvisionnement) ciblent **les dépendances et fournisseurs** d'une organisation plutôt que la cible directement. SolarWinds, XZ Utils, npm packages malveillants — ces attaques sont parmi les plus sophistiquées et les plus dévastatrices.

## Pourquoi les supply chain attacks sont si efficaces

```
Attaque directe :
Attaquant → [Cible bien défendue] ← Difficile

Attaque supply chain :
Attaquant → [Fournisseur/Dépendance moins défendu]
                    ↓ (distribution légitime)
              [Cible bien défendue] ← Contournée !

La cible fait confiance au fournisseur :
→ Le code malveillant est signé par le fournisseur
→ Les mises à jour automatiques déploient le malware
→ Détection très difficile
→ Impact : toutes les organisations qui utilisent ce fournisseur
```

## Cas réels marquants

### SolarWinds (2020) — La mère de toutes les supply chain attacks

```
Chronologie :
Oct 2019 : Accès initial chez SolarWinds
Mar 2020 : Backdoor "SUNBURST" injectée dans Orion (logiciel IT)
Mar-Dec 2020 : Distribution via mise à jour légitime signée
              18 000 organisations téléchargent la mise à jour
              Dont : US Treasury, DoD, DHS, FireEye, Microsoft...
Dec 2020 : Découverte par FireEye (après avoir détecté leur propre infection)

Technique :
→ Le code malveillant dormait 2 semaines après installation
→ Puis contactait un C2 via des requêtes DNS légitimes
→ Communiquait via HTTPS en imitant le trafic Orion normal
→ S'activait seulement dans les environnements d'entreprise (pas les sandbox)

Attribution : APT29 (Cozy Bear) - SVR russe
Coût estimé : 100 milliards de dollars
```

### XZ Utils (2024) — L'attaque quasi-parfaite

```
Une des attaques les plus sophistiquées jamais documentées :

2021 : "Jia Tan" (pseudonyme) commence à contribuer au projet XZ Utils
       (outil de compression présent dans presque toutes les distributions Linux)
2022-2023 : Contributions légitimes de qualité, gagne la confiance
2024 (Fév) : Backdoor injectée dans XZ Utils 5.6.0
             Ciblait spécifiquement sshd via une technique très sophistiquée

Découverte accidentelle :
→ Andres Freund (ingénieur Microsoft) remarque que SSH est 500ms plus lent
→ Analyse approfondie → découvre la backdoor dans les fichiers de test

Impact potentiel si non découverte :
→ Backdoor dans sshd sur des millions de serveurs Linux
→ Authentification SSH contournable par l'attaquant

Leçon : Les mainteneurs open source sous-staffés sont des cibles privilégiées
```

### Dependency Confusion (2021)

```python
# Technique découverte par Alex Birsan

# Scénario :
# Une entreprise utilise un package interne privé : "monentreprise-utils"
# Ce package n'existe PAS sur PyPI / npm public

# Attaque :
# L'attaquant publie "monentreprise-utils" sur PyPI
# AVEC UNE VERSION PLUS HAUTE que l'interne (99.0.0 vs 1.0.0)

# pip et npm préfèrent les versions publiques PLUS HAUTES
pip install monentreprise-utils
# Télécharge la version malveillante 99.0.0 du public
# Au lieu de la version interne légitime 1.0.0 !

# Birsan a réussi à faire exécuter du code sur des machines de :
# Apple, Microsoft, PayPal, Shopify, Netflix, Uber, Yelp, Tesla
# → 130 000$ de bug bounties légitimes

# Protection :
# → Utiliser un registre privé avec proxy
# → Épingler les versions exactes avec hashes
# → Namespacing (@monentreprise/utils)
```

### Typosquatting de packages npm

```bash
# Des packages avec des noms proches des packages populaires
# publiés avec du code malveillant

# Exemples réels :
# crossenv (a lieu de cross-env)   → 713 000 downloads avant suppression
# event-stream (empoisonné) → Vol de bitcoins Copay wallet
# colors/faker (saboté par l'auteur) → Boucle infinie intentionnelle

# La liste des packages malveillants détectés en 2023 :
malicious_packages = [
    "node-fetch-nativeify",  # Typosquat de node-fetch
    "lodash4",               # Typosquat de lodash
    "moment-updater",        # Faux outil lodash
    "npmconf2",              # Typosquat npmconf
]

# Détection :
# npm audit
# Socket.dev : surveillance des packages npm en temps réel
# Snyk : analyse les dépendances
```

## Sécuriser sa supply chain

### Software Bill of Materials (SBOM)

```python
# Un SBOM est un inventaire de tous les composants d'un logiciel
# Obligatoire aux USA pour les logiciels vendus au gouvernement (Executive Order 2021)

# Générer un SBOM avec syft
# syft packages dir:. -o spdx-json > sbom.json
# syft packages image:mon-app:latest -o cyclonedx-json > sbom.json

# Format SPDX (exemple simplifié)
sbom_exemple = {
    "spdxVersion": "SPDX-2.3",
    "name": "mon-application",
    "packages": [
        {
            "name": "Django",
            "version": "4.2.7",
            "licenseConcluded": "BSD-3-Clause",
            "downloadLocation": "https://pypi.org/project/Django/4.2.7/",
            "filesAnalyzed": True,
            "checksum": {"algorithm": "SHA256", "checksumValue": "abc123..."}
        },
        {
            "name": "cryptography",
            "version": "41.0.5",
            "licenseConcluded": "Apache-2.0",
            # Présence de CVE-2023-49083 si version < 41.0.6 !
        }
    ]
}

# Vérifier le SBOM contre les CVE connus
# grype sbom:sbom.json
```

### Sécurisation des dépendances

```yaml
# pip - Épingler les versions avec hashes (pip-compile)
# requirements.txt généré par pip-compile :
Django==4.2.7 \
    --hash=sha256:1498db1d6836ab1fb44de5e9c8a09c20ad8cce14e7d7c47fb0e62f3cbe29a3e7 \
    --hash=sha256:7e6addb2e5aba2c90aa8fcc25b5df26aa4a6da00ad0f7741cf78e68d2523ad93

# npm - package-lock.json avec intégrité SHA512
# "django": {
#   "version": "4.2.7",
#   "integrity": "sha512-abc123...",  ← Hash de l'archive
#   "resolved": "https://registry.npmjs.org/..."
# }

# Vérification automatique des hashes à chaque install
pip install -r requirements.txt  # Vérifie les hashes automatiquement
npm ci  # Utilise package-lock.json, vérifie les intégrités
```

```bash
# Sigstore/cosign - Signature cryptographique des artefacts
# Signer une image Docker
cosign sign --key cosign.key mon-registry/mon-app:latest

# Vérifier la signature
cosign verify --key cosign.pub mon-registry/mon-app:latest

# GitHub Actions avec provenance (SLSA niveau 3)
# Les artefacts de build incluent une attestation signée
# Prouvant qu'ils ont été construits par ce workflow exact
```

### Processus de vérification des mises à jour

```python
class DependencySecurityProcess:

    def before_adding_dependency(self, package_name, version):
        """Vérifications avant d'ajouter une nouvelle dépendance"""
        checks = {
            "age": self.check_package_age(package_name),
            # Moins de 6 mois ? Méfiance !

            "downloads": self.check_download_count(package_name),
            # Moins de 1000 downloads/semaine ? Inhabituel

            "maintainers": self.check_maintainer_count(package_name),
            # 1 seul mainteneur = risque

            "typosquat": self.check_typosquat_risk(package_name),
            # Ressemble à un package populaire ?

            "cve": self.check_known_vulnerabilities(package_name, version),

            "license": self.check_license_compatibility(package_name),

            "source_available": self.check_source_code_available(package_name),
            # Pas de code source = red flag
        }
        return all(checks.values()), checks

    def before_updating_dependency(self, package, old_version, new_version):
        """Vérifications avant une mise à jour"""
        return {
            "changelog_reviewed": self.review_changelog(package, old_version, new_version),
            "no_new_permissions": self.check_new_permissions(package, new_version),
            "no_new_dependencies": self.check_dependency_changes(package, new_version),
            "tests_pass": self.run_tests_with_new_version(package, new_version),
            "no_suspicious_commits": self.check_recent_commits(package, new_version)
        }
```

## Checklist supply chain security

```
Code source :
✅ SBOM généré et maintenu
✅ Dépendances épinglées avec hashes
✅ Scan automatique des vulnérabilités (Snyk, Dependabot)
✅ Review des mises à jour avant déploiement
✅ Pas de packages avec 1 seul mainteneur pour les éléments critiques

Build pipeline :
✅ Environnement de build reproductible
✅ Signature des artefacts (cosign, Sigstore)
✅ SLSA compliance (Supply-chain Levels for Software Artifacts)
✅ Pas de téléchargement d'internet pendant le build
✅ Séparation des environnements dev/staging/prod

Fournisseurs :
✅ Évaluation sécurité des fournisseurs critiques
✅ Contrats avec clauses de sécurité
✅ MFA obligatoire pour les accès fournisseurs
✅ Principe du moindre privilège pour les comptes fournisseurs
✅ Monitoring des accès fournisseurs
```

## Conclusion

Les attaques supply chain exploitent la **confiance implicite** que nous accordons à nos fournisseurs et dépendances. La défense passe par la **méfiance systématique** : SBOM, hashes vérifiés, signatures cryptographiques, revue des mises à jour et évaluation des fournisseurs. SolarWinds et XZ Utils ont montré que même les entreprises les plus prudentes peuvent être victimes — la vigilance est permanente.

---
*Article suivant : [Bluetooth et NFC : sécurité des communications sans fil courte portée](../articles/bluetooth-nfc-securite)*
