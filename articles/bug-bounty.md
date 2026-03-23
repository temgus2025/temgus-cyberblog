# Bug Bounty : comment gagner de l'argent en hackant légalement

Le bug bounty est un programme par lequel des entreprises rémunèrent des chercheurs en sécurité pour trouver et signaler des vulnérabilités dans leurs systèmes. C'est l'une des façons les plus accessibles de monétiser ses compétences en cybersécurité tout en contribuant à un Internet plus sûr.

## Qu'est-ce que le bug bounty ?

```
Principe :
Entreprise publie un programme → Chercheurs trouvent des bugs
→ Signalement responsable → Entreprise corrige → Chercheur payé

Avantages pour l'entreprise :
→ Des milliers de chercheurs testent en permanence
→ Pay-per-bug (seulement si vulnérabilité confirmée)
→ Moins cher qu'une équipe sécurité interne complète
→ Amélioration continue de la sécurité

Avantages pour le chercheur :
→ Revenus supplémentaires (ou carrière complète)
→ Pratique légale et éthique
→ Reconnaissance publique (Hall of Fame)
→ Apprentissage constant
→ Pas de barrière à l'entrée
```

## Les plateformes principales

```
HackerOne (hackerone.com) :
→ La plus grande plateforme
→ Clients : Twitter, GitHub, Uber, DoD américain
→ Plus de 3 000 programmes actifs
→ Paiements : 100$ à 1 000 000$+

Bugcrowd (bugcrowd.com) :
→ Deuxième plus grande plateforme
→ Clients : Tesla, Mastercard, Atlassian
→ Bonne réputation pour les débutants

YesWeHack (yeswehack.com) :
→ Plateforme française/européenne
→ Clients : OVH, BNP Paribas, Thalès
→ Conforme RGPD, focus européen
→ Excellent pour les chercheurs francophones

Intigriti (intigriti.com) :
→ Européen (Belgique)
→ Clients : TUI, Coca-Cola, BMW

Synack :
→ Invitation seulement (plus sélectif)
→ Meilleures rémunérations
→ Clients gouvernementaux

Open Bug Bounty (openbugbounty.org) :
→ Sites sans programme officiel
→ Pas de rémunération garantie
→ Bon pour pratiquer et construire un profil
```

## Combien peut-on gagner ?

```python
remuneration_typique = {
    "P1 - Critique": {
        "exemples": ["RCE", "SQLi critique", "Auth bypass total"],
        "fourchette": "5 000$ - 100 000$+",
        "record": "2 000 000$ (Apple, 2021)"
    },
    "P2 - Élevé": {
        "exemples": ["XSS stocké", "SSRF interne", "IDOR critique"],
        "fourchette": "1 000$ - 10 000$"
    },
    "P3 - Moyen": {
        "exemples": ["XSS réfléchi", "CSRF", "Fuite d'informations"],
        "fourchette": "100$ - 1 000$"
    },
    "P4 - Faible": {
        "exemples": ["Missing headers", "Rate limiting absent"],
        "fourchette": "50$ - 200$"
    }
}

# Chercheurs professionnels :
# Top 10% sur HackerOne → 100 000$+/an
# Top 1% → 500 000$+/an

# Chercheurs débutants :
# Premiers bugs → 100$ - 500$
# Après 6 mois → 500$ - 2 000$/mois possible
```

## Méthodologie de reconnaissance

```bash
# 1. Cartographier le périmètre
cat scope.txt  # Lire attentivement ce qui est autorisé !

# Sous-domaines
subfinder -d target.com -o subdomains.txt
amass enum -passive -d target.com >> subdomains.txt
assetfinder target.com >> subdomains.txt

# Vérifier quels sous-domaines sont actifs
cat subdomains.txt | httpx -silent -o active_subs.txt

# 2. Fingerprinting technologique
whatweb https://target.com
wappalyzer  # Extension navigateur

# 3. Découverte de chemins et endpoints
ffuf -w /usr/share/wordlists/dirb/common.txt -u https://target.com/FUZZ
gobuster dir -u https://target.com -w wordlist.txt -x php,js,json

# 4. JavaScript mining (endpoints cachés dans le JS)
gau target.com | grep "\.js$" | tee js_files.txt
cat js_files.txt | xargs -I{} curl -s {} | grep -oE '"(/[^"]+)"' | sort -u

# 5. Parameters discovery
paramspider -d target.com
arjun -u https://target.com/api/endpoint
```

## Vulnérabilités les plus courantes en bug bounty

### IDOR — Insecure Direct Object Reference

```http
# Scénario : accéder aux données d'un autre utilisateur
GET /api/user/profile?id=1234 HTTP/1.1
Authorization: Bearer votre_token

# Essayer d'accéder à l'utilisateur 1235
GET /api/user/profile?id=1235 HTTP/1.1
Authorization: Bearer votre_token

# Si vous recevez les données de l'autre utilisateur → IDOR !

# Autres patterns IDOR :
/api/invoices/INV-00123   → INV-00124
/api/orders/order_abc123  → order_abc124
/files/document_user1.pdf → document_user2.pdf
```

### SSRF — Server-Side Request Forgery

```http
# Le serveur fait une requête vers une URL que vous contrôlez
POST /api/webhook HTTP/1.1
Content-Type: application/json

{"url": "http://internal-service:8080/admin"}

# Accéder aux métadonnées AWS (si hébergé sur AWS)
{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}

# Bypass de filtres SSRF :
http://127.0.0.1           → localhost
http://0.0.0.0             → localhost
http://[::1]               → IPv6 localhost
http://127.1                → format court
http://2130706433           → décimal
```

### Subdomain Takeover

```bash
# Un sous-domaine pointe vers un service externe non configuré

# Vérifier les CNAME
dig blog.target.com CNAME
# blog.target.com → target.github.io

# Vérifier si le service est configuré
curl -I https://target.github.io
# 404 → Sous-domaine disponible à prendre !

# Vérifier avec can-i-take-over-xyz
# https://github.com/EdOverflow/can-i-take-over-xyz
# Liste de 100+ services vulnérables au takeover

# Créer le repo GitHub → Prendre le contrôle du sous-domaine
# Bounty typique : 500$ - 2 000$
```

## Écrire un bon rapport

```markdown
# Template de rapport de vulnérabilité

## Titre
IDOR permettant l'accès aux données de n'importe quel utilisateur via /api/user/profile

## Sévérité
Élevée (CVSS 8.1)

## Description
Une vulnérabilité IDOR a été identifiée dans l'endpoint /api/user/profile
permettant à un utilisateur authentifié d'accéder aux données de tout
autre utilisateur en modifiant le paramètre `id`.

## Étapes de reproduction
1. Se connecter avec le compte test1@example.com
2. Intercepter la requête GET /api/user/profile?id=YOUR_ID avec Burp Suite
3. Modifier le paramètre id par celui d'un autre utilisateur
4. Observer que les données de l'autre utilisateur sont retournées

## Preuve (screenshots/vidéo)
[Screenshot montrant les données de l'autre utilisateur]

## Impact
Un attaquant peut accéder aux données personnelles (nom, email, adresse,
historique de commandes) de tous les utilisateurs de la plateforme.
Cela représente une violation du RGPD avec des sanctions potentielles.

## Recommandation
Vérifier côté serveur que l'utilisateur authentifié est bien le propriétaire
de la ressource demandée avant de retourner les données.

## Références
- OWASP API Security Top 10: API1 - Broken Object Level Authorization
```

## Conseils pour débuter

```
✅ Commencer par les programmes avec large scope
✅ Lire TOUTES les règles du programme avant de tester
✅ Documenter chaque test (screenshots, requêtes Burp)
✅ Apprendre de chaque rapport rejeté
✅ Rejoindre des communautés (Discord HackerOne, Reddit r/bugbounty)
✅ Suivre des chercheurs expérimentés sur Twitter

❌ Ne jamais tester hors scope
❌ Ne jamais divulguer publiquement avant fix
❌ Ne jamais tester de façon destructive
❌ Ne jamais accéder aux données réelles des utilisateurs

Ressources :
→ PortSwigger Web Security Academy (gratuit)
→ HackTheBox Bug Bounty Hunter path
→ Nahamsec sur YouTube
→ InsiderPhD sur YouTube
→ Bug Bounty Hunter's Methodology (Jason Haddix)
```

## Conclusion

Le bug bounty est accessible à tous — pas de diplôme requis, juste de la curiosité, de la méthode et de la persévérance. Commencez par PortSwigger Academy pour maîtriser les vulnérabilités web, puis attaquez les programmes débutant-friendly sur YesWeHack ou HackerOne. Votre premier bug payé sera une immense satisfaction — et le début d'une nouvelle aventure.

---
*Catégorie : Pentest*
