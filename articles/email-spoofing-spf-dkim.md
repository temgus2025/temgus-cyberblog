# Email spoofing et SPF/DKIM/DMARC : sécuriser votre messagerie

L'usurpation d'email (spoofing) permet à un attaquant d'envoyer des emails en se faisant passer pour votre domaine. C'est le vecteur principal du phishing et de la fraude au président. SPF, DKIM et DMARC sont les trois boucliers qui protègent votre réputation email.

## Comment fonctionne l'email spoofing

```
Le protocole SMTP ne vérifie pas l'identité de l'expéditeur !

# Envoyer un email en se faisant passer pour CEO@votre-entreprise.com
telnet smtp.gmail.com 25
EHLO fake-server.com
MAIL FROM: <ceo@votre-entreprise.com>    ← N'IMPORTE QUI peut mettre ça
RCPT TO: <comptable@votre-entreprise.com>
DATA
Subject: Virement urgent
From: CEO <ceo@votre-entreprise.com>
To: comptable@votre-entreprise.com

Bonjour,
Veuillez effectuer un virement de 50 000€ vers IBAN FR76...
C'est urgent et confidentiel.

PDG
.
QUIT
```

## SPF — Sender Policy Framework

SPF liste les serveurs **autorisés à envoyer des emails** pour votre domaine.

```bash
# Enregistrement SPF dans le DNS (enregistrement TXT)
# Pour exemple.com, les emails peuvent venir de :

exemple.com. IN TXT "v=spf1 include:_spf.google.com include:sendgrid.net ip4:203.0.113.0/24 -all"

# Décomposition :
# v=spf1              → Version SPF 1
# include:_spf.google.com → Google Workspace autorisé
# include:sendgrid.net → SendGrid autorisé
# ip4:203.0.113.0/24  → Plage d'IPs autorisée
# -all                → Tout le reste → REJET (hard fail)
#                       ~all → soft fail (marqué comme spam)
#                       +all → tout autorisé (À ÉVITER !)

# Vérifier votre SPF
dig +short TXT exemple.com | grep spf
nslookup -type=TXT exemple.com

# Tester la configuration SPF
curl "https://www.mxpolice.com/api/dns/spf?domain=exemple.com"
```

```python
# Résultats possibles d'une vérification SPF :
spf_results = {
    "pass":    "IP autorisée → email légitime",
    "fail":    "IP non autorisée → -all → rejeter",
    "softfail":"IP non autorisée → ~all → marquer comme suspect",
    "neutral": "Pas de politique définie",
    "none":    "Pas d'enregistrement SPF",
    "permerror":"Erreur de configuration SPF",
    "temperror":"Erreur temporaire DNS"
}
```

## DKIM — DomainKeys Identified Mail

DKIM appose une **signature cryptographique** sur chaque email, prouvant qu'il n'a pas été modifié en transit.

```bash
# Fonctionnement DKIM :
# 1. Le serveur mail signe l'email avec une clé privée (RSA/ED25519)
# 2. La clé publique est publiée dans le DNS
# 3. Le serveur destinataire vérifie la signature

# Générer une paire de clés DKIM
openssl genrsa -out dkim_private.pem 2048
openssl rsa -in dkim_private.pem -pubout -out dkim_public.pem

# Publier la clé publique dans le DNS
# _domainkey.exemple.com TXT
selector._domainkey.exemple.com. IN TXT "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."

# Vérifier la configuration DKIM
dig +short TXT selector._domainkey.exemple.com

# L'en-tête DKIM ajouté à chaque email :
# DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=exemple.com;
#   s=selector; h=from:to:subject:date:message-id;
#   bh=hash_du_corps; b=signature_base64
```

## DMARC — Domain-based Message Authentication

DMARC combine SPF et DKIM et **définit une politique** : que faire des emails qui échouent ?

```bash
# Enregistrement DMARC
_dmarc.exemple.com. IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc@exemple.com; ruf=mailto:dmarc-forensic@exemple.com; pct=100; adkim=s; aspf=s"

# Décomposition :
# v=DMARC1    → Version DMARC
# p=reject    → Politique : rejeter les emails non conformes
#   (p=none   → Surveiller seulement, rien bloquer)
#   (p=quarantine → Mettre en spam)
#   (p=reject → Rejeter complètement)
# rua=        → Rapports agrégés (statistiques quotidiennes)
# ruf=        → Rapports forensiques (emails qui ont échoué)
# pct=100     → Appliquer à 100% des emails
# adkim=s     → Alignement DKIM strict
# aspf=s      → Alignement SPF strict
```

### Déploiement progressif DMARC

```bash
# Étape 1 : Monitoring (p=none) - Commencer ici !
# Surveiller sans bloquer - découvrir vos sources d'envoi légitimes
_dmarc.exemple.com. TXT "v=DMARC1; p=none; rua=mailto:dmarc@exemple.com"

# Attendre 2-4 semaines, analyser les rapports
# → Identifier tous les services qui envoient des emails en votre nom

# Étape 2 : Quarantine (p=quarantine) - Après avoir tout identifié
_dmarc.exemple.com. TXT "v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@exemple.com"
# pct=25 → Appliquer à seulement 25% des emails pour tester

# Étape 3 : Enforcement total (p=reject)
_dmarc.exemple.com. TXT "v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@exemple.com"
```

### Analyser les rapports DMARC

```python
# Les rapports DMARC arrivent en XML - exemple de parsing
import xml.etree.ElementTree as ET
import zipfile, io

def parse_dmarc_report(xml_content):
    root = ET.fromstring(xml_content)
    records = []

    for record in root.findall('.//record'):
        row = record.find('row')
        policy_eval = record.find('auth_results')

        records.append({
            'source_ip': row.find('source_ip').text,
            'count': int(row.find('count').text),
            'disposition': row.find('policy_evaluated/disposition').text,
            'dkim': row.find('policy_evaluated/dkim').text,
            'spf': row.find('policy_evaluated/spf').text,
        })

    return records

# Outils d'analyse DMARC
# → DMARC Analyzer (dmarcanalyzer.com)
# → Postmark DMARC (dmarc.postmarkapp.com)
# → Google Postmaster Tools (pour les domaines qui envoient vers Gmail)
```

## ARC — Authenticated Received Chain

```bash
# Problème : les listes de diffusion et forwards cassent SPF/DKIM
# ARC préserve la chaîne d'authentification à travers les redirections

# En-tête ARC ajouté par chaque serveur intermédiaire :
# ARC-Seal: i=1; a=rsa-sha256; d=liste.exemple.com; ...
# ARC-Message-Signature: i=1; ...
# ARC-Authentication-Results: i=1; ...
```

## Email security checklist

```
Configuration DNS :
✅ SPF configuré avec -all (hard fail)
✅ DKIM avec clé 2048 bits minimum
✅ DMARC en p=reject
✅ MTA-STS (force TLS sur le transport)
✅ BIMI (logo de marque dans les emails)

Serveur mail :
✅ TLS 1.2+ pour le transport SMTP
✅ Authentification SMTP obligatoire (pas de relais ouvert)
✅ Rate limiting anti-spam
✅ Listes noires (RBL) vérifiées

Surveillance :
✅ Rapports DMARC analysés hebdomadairement
✅ Alertes sur nouvelles sources inconnues
✅ Monitoring de la réputation IP (Google Postmaster)
```

## Vérifier votre configuration complète

```bash
# MXToolbox - Outil en ligne complet
# https://mxtoolbox.com/SuperTool.aspx

# En ligne de commande
# Vérifier SPF
dig +short TXT exemple.com | grep "v=spf"

# Vérifier DKIM
dig +short TXT default._domainkey.exemple.com

# Vérifier DMARC
dig +short TXT _dmarc.exemple.com

# Tester l'envoi depuis un vrai serveur
# https://www.mail-tester.com
# → Score sur 10 + recommandations
```

## Conclusion

SPF + DKIM + DMARC en p=reject = votre domaine est **quasi-impossible à usurper**. Déployez-les dans l'ordre et avec patience : commencez par p=none pour analyser votre trafic légitime, puis montez progressivement en p=quarantine, puis p=reject. Cette configuration élimine la grande majorité des attaques de phishing utilisant votre domaine.

---
*Article suivant : [Forensics numérique : investigation](../articles/forensics-numerique)*
