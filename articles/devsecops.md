# DevSecOps : intégrer la sécurité dans le cycle de développement

Le DevSecOps représente l'évolution naturelle du DevOps : intégrer la sécurité à **chaque étape** du cycle de développement logiciel plutôt que de la traiter comme un audit de fin de projet. L'objectif : "shift left" — détecter les problèmes de sécurité le plus tôt possible.

## Pourquoi DevSecOps ?

```
Coût de correction d'une vulnérabilité selon sa détection :

Phase de conception     → 1x   (le moins cher)
Phase de développement  → 6x
Phase de test           → 15x
Phase de production     → 100x (le plus cher)

Source : IBM System Sciences Institute

Conclusion : détecter tôt = économiser massivement
```

## Le pipeline DevSecOps

```
CODE → BUILD → TEST → DEPLOY → OPERATE
 ↓       ↓       ↓       ↓        ↓
SAST    SCA    DAST   IAST    Runtime
         +               +    Security
       Secrets         Pentest
       Scan
```

### SAST — Static Application Security Testing

Analyse le **code source** sans l'exécuter.

```yaml
# .github/workflows/sast.yml
name: SAST Security Scan

on: [push, pull_request]

jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten
            p/python
            p/javascript

      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: semgrep.sarif
```

```python
# Exemples de ce que SAST détecte automatiquement

# ❌ Injection SQL (Semgrep détecte)
def get_user(username):
    query = f"SELECT * FROM users WHERE name = '{username}'"  # FLAGGED
    return db.execute(query)

# ❌ Secret hardcodé (détecté par TruffleHog, GitLeaks)
API_KEY = "sk-prod-abc123def456"  # FLAGGED

# ❌ Path traversal
def read_file(filename):
    with open(f"/data/{filename}") as f:  # FLAGGED - pas de validation
        return f.read()

# ❌ Algorithme cryptographique faible
import md5  # FLAGGED - MD5 est cassé
hash = md5.new(password).hexdigest()
```

### SCA — Software Composition Analysis

Analyse les **dépendances tierces** pour détecter les vulnérabilités connues (CVE).

```bash
# npm audit (Node.js)
npm audit
npm audit fix
npm audit --json > audit-results.json

# Snyk (multi-langage)
snyk test
snyk monitor
snyk test --severity-threshold=high

# Safety (Python)
pip install safety
safety check
safety check -r requirements.txt

# OWASP Dependency-Check
dependency-check.sh --project "MonApp" --scan /path/to/project

# Trivy (conteneurs + code)
trivy fs .
trivy image mon-image:latest
```

```yaml
# GitHub Dependabot - Mises à jour automatiques des dépendances
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"

  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "daily"  # Plus fréquent pour les dépendances critiques
```

### Secrets Scanning

```bash
# TruffleHog - Détecter les secrets dans Git history
trufflehog git https://github.com/votre-org/votre-repo

# GitLeaks - Pre-commit hook
gitleaks git --source . --verbose
gitleaks protect --staged  # Avant chaque commit

# Configuration .gitleaks.toml
[[rules]]
id = "generic-api-key"
description = "Generic API Key"
regex = '''(?i)(api[_-]?key|apikey|api[_-]?secret)['":\s=]+([a-z0-9_\-]{20,})'''
entropy = 3.5

# GitHub Secret Scanning (automatique sur repos publics)
# Détecte automatiquement : AWS keys, GitHub tokens, Stripe keys, etc.
# Alerte immédiate + révocation automatique dans certains cas
```

### DAST — Dynamic Application Security Testing

Teste l'application **en cours d'exécution**.

```yaml
# OWASP ZAP dans CI/CD
# .github/workflows/dast.yml
name: DAST with OWASP ZAP

on:
  push:
    branches: [main]

jobs:
  zap_scan:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://staging.votre-app.com'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'

      - name: Upload ZAP Report
        uses: actions/upload-artifact@v3
        with:
          name: ZAP Report
          path: report_html.html
```

## Infrastructure as Code Security

```python
# Checkov - Scanner les fichiers Terraform, CloudFormation, K8s
# pip install checkov
checkov -d ./terraform/
checkov -f k8s-deployment.yaml

# Exemple de vulnérabilités détectées par Checkov

# ❌ Bucket S3 public
resource "aws_s3_bucket" "data" {
  bucket = "mon-bucket"
  acl    = "public-read"  # FLAGGED : CKV_AWS_20
}

# ❌ Security group trop permissif
resource "aws_security_group" "web" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # FLAGGED : SSH ouvert sur Internet
  }
}

# ✅ Version corrigée
resource "aws_security_group" "web" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]  # Seulement réseau interne
  }
}
```

## Pipeline DevSecOps complet

```yaml
# .github/workflows/devsecops.yml
name: DevSecOps Pipeline

on:
  push:
    branches: ['*']
  pull_request:
    branches: [main]

jobs:
  # Étape 1 : Qualité et sécurité du code
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Pour GitLeaks (analyse l'historique complet)

      - name: Secret Scanning (GitLeaks)
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: SAST (Semgrep)
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/owasp-top-ten

  # Étape 2 : Dépendances
  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Dependency Scan (Snyk)
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # Étape 3 : Build et scan image
  build:
    needs: [sast, sca]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t mon-app:${{ github.sha }} .

      - name: Scan image (Trivy)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'mon-app:${{ github.sha }}'
          format: 'sarif'
          exit-code: '1'
          severity: 'CRITICAL,HIGH'

      - name: Push image
        if: github.ref == 'refs/heads/main'
        run: docker push mon-app:${{ github.sha }}

  # Étape 4 : Deploy et DAST (sur staging uniquement)
  dast:
    needs: [build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to staging
        run: # Deploy script

      - name: DAST Scan (OWASP ZAP)
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'https://staging.mon-app.com'

  # Étape 5 : Deploy en production si tout passe
  deploy_prod:
    needs: [dast]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: # Deploy prod script
```

## Métriques DevSecOps

```python
# KPIs importants à suivre

metrics = {
    # Détection
    "MTTD": "Mean Time To Detect (heure)",
    # → Combien de temps pour détecter une vuln ?

    "vulnerabilities_per_build": "Nombre de vulns détectées par build",
    # → Tendance à la baisse = progrès

    "false_positive_rate": "Taux de faux positifs (%)",
    # → Trop élevé = les devs ignorent les alertes

    # Remédiation
    "MTTR": "Mean Time To Remediate (jours)",
    # → Par sévérité : critique < 1 jour, high < 7 jours

    "patch_compliance": "% de vulns critiques corrigées dans les délais",

    # Couverture
    "sast_coverage": "% du code analysé par SAST",
    "dependency_coverage": "% des dépendances scannées",

    # Coût
    "security_debt": "Nombre de vulns non corrigées × leur âge",
}
```

## Conclusion

DevSecOps transforme la sécurité d'un obstacle de fin de projet en **compagnon du développement**. L'automatisation est la clé : SAST dans l'IDE, SCA sur chaque commit, secrets scanning dans Git, DAST sur le staging. Quand les développeurs ont des feedbacks de sécurité en secondes plutôt qu'en semaines, ils corrigent naturellement les problèmes avant qu'ils n'arrivent en production.