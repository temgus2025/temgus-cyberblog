# HTTPS et certificats SSL/TLS : tout comprendre

HTTPS protège des milliards de communications chaque jour. Mais comment fonctionne-t-il vraiment ? Qu'est-ce qu'un certificat SSL ? Comment le configurer correctement ? Ce guide démystifie TLS de bout en bout.

## HTTP vs HTTPS

```
HTTP (non chiffré) :
Navigateur → [Texte en clair] → Serveur
→ N'importe qui sur le réseau peut lire vos données
→ Un attaquant sur le WiFi voit tout : login, mot de passe, données

HTTPS (chiffré) :
Navigateur → [Données chiffrées AES-256] → Serveur
→ Même intercepté, le trafic est illisible
→ L'identité du serveur est vérifiée (certificat)
```

## Comment TLS fonctionne

### Le TLS Handshake

```
Client (navigateur)              Serveur

1. ClientHello →
   (versions TLS supportées, cipher suites, random)

                        ← 2. ServerHello
                           (version choisie, cipher suite)

                        ← 3. Certificate
                           (certificat SSL du serveur)

                        ← 4. ServerHelloDone

5. ClientKeyExchange →
   (Pre-master secret chiffré avec la clé publique du serveur)

6. ChangeCipherSpec →  ← 6. ChangeCipherSpec
   (on passe au chiffrement)

7. Finished →          ← 7. Finished

=== CONNEXION CHIFFRÉE ÉTABLIE ===

8. Application Data ↔ Application Data
   (tout est chiffré avec AES-256)
```

### TLS 1.3 — Le standard moderne

```bash
# TLS 1.2 vs TLS 1.3
# TLS 1.2 : 2 aller-retours avant la connexion chiffrée
# TLS 1.3 : 1 seul aller-retour (0-RTT possible pour les reconnexions)

# Vérifier la version TLS utilisée
curl -vI https://exemple.com 2>&1 | grep "TLS\|SSL"
# TLSv1.3 (OUT), TLS handshake...

# Avec OpenSSL
echo | openssl s_client -connect exemple.com:443 2>/dev/null | grep "Protocol"
# Protocol : TLSv1.3

# Tester la configuration TLS
# https://www.ssllabs.com/ssltest/ (Qualys SSL Labs)
# Score A+ = configuration optimale
```

## Les certificats SSL/TLS

### Anatomie d'un certificat

```bash
# Voir le certificat d'un site
openssl s_client -connect google.com:443 -showcerts 2>/dev/null | \
  openssl x509 -noout -text

# Informations importantes :
# Subject: CN=*.google.com (pour qui le certificat est émis)
# Issuer: C=US, O=Google Trust Services LLC (qui a signé)
# Validity:
#   Not Before: Oct  2 08:27:05 2023 GMT
#   Not After : Dec 25 08:27:04 2023 GMT
# Subject Alternative Name: *.google.com, google.com
# Public Key Algorithm: id-ecPublicKey (ECDSA P-256)
```

### Types de certificats

```
DV (Domain Validation) - Validation de domaine :
→ Vérifie uniquement que vous contrôlez le domaine
→ Délivré en minutes (Let's Encrypt)
→ Cadenas vert standard
→ Gratuit avec Let's Encrypt
→ Suffisant pour la plupart des sites

OV (Organization Validation) - Validation d'organisation :
→ Vérifie l'identité de l'organisation
→ Affiché dans les détails du certificat
→ Délai : 1-3 jours
→ ~100-300€/an
→ Recommandé pour les sites d'entreprise

EV (Extended Validation) - Validation étendue :
→ Vérification approfondie de l'organisation
→ Ancien "barre verte" (supprimé en 2019 dans les navigateurs)
→ Délai : 1-2 semaines
→ ~300-1000€/an
→ Utilisé par les banques, grandes entreprises
```

### Let's Encrypt — Certificats gratuits

```bash
# Certbot - L'outil officiel Let's Encrypt

# Installation sur Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat pour Nginx
sudo certbot --nginx -d exemple.com -d www.exemple.com

# Ou en mode standalone (sans serveur web)
sudo certbot certonly --standalone -d exemple.com

# Renouvellement automatique (certificats valides 90 jours)
sudo certbot renew --dry-run  # Test
# Ajouter au cron ou systemd timer pour renouvellement automatique

# Avec acme.sh (alternative légère)
curl https://get.acme.sh | sh
acme.sh --issue -d exemple.com --webroot /var/www/html
acme.sh --install-cert -d exemple.com \
  --cert-file /etc/ssl/certs/exemple.com.crt \
  --key-file /etc/ssl/private/exemple.com.key \
  --reloadcmd "systemctl reload nginx"
```

## Configuration TLS optimale

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name exemple.com;

    # Certificats
    ssl_certificate     /etc/letsencrypt/live/exemple.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/exemple.com/privkey.pem;

    # Protocoles - Seulement TLS 1.2 et 1.3
    ssl_protocols TLSv1.2 TLSv1.3;

    # Cipher suites sécurisées
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;  # TLS 1.3 gère ça lui-même

    # HSTS - Forcer HTTPS pour 1 an
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Session TLS
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;  # Désactiver pour perfect forward secrecy

    # OCSP Stapling (vérification de révocation rapide)
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;

    # Headers de sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Content-Security-Policy "default-src 'self'";
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name exemple.com www.exemple.com;
    return 301 https://$host$request_uri;
}
```

### Apache

```apache
<VirtualHost *:443>
    SSLEngine on
    SSLCertificateFile      /etc/letsencrypt/live/exemple.com/cert.pem
    SSLCertificateKeyFile   /etc/letsencrypt/live/exemple.com/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/exemple.com/chain.pem

    # Protocoles modernes uniquement
    SSLProtocol             all -SSLv3 -TLSv1 -TLSv1.1
    SSLHonorCipherOrder     off
    SSLSessionTickets       off

    # HSTS
    Header always set Strict-Transport-Security "max-age=63072000"
</VirtualHost>
```

## Vérifier et auditer votre configuration TLS

```bash
# testssl.sh - Audit complet en ligne de commande
./testssl.sh https://exemple.com

# Nmap - Détecter les protocoles TLS
nmap --script ssl-enum-ciphers -p 443 exemple.com

# OpenSSL - Tests manuels
# Tester TLS 1.0 (doit être refusé)
openssl s_client -connect exemple.com:443 -tls1
# Tester TLS 1.3 (doit fonctionner)
openssl s_client -connect exemple.com:443 -tls1_3

# Vérifier l'expiration du certificat
echo | openssl s_client -servername exemple.com -connect exemple.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Script de monitoring d'expiration
#!/bin/bash
DOMAIN="exemple.com"
EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | \
  openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

if [ $DAYS -lt 30 ]; then
    echo "ALERTE: Certificat $DOMAIN expire dans $DAYS jours !"
    # Envoyer une notification
fi
```

## Erreurs TLS courantes

```
NET::ERR_CERT_DATE_INVALID
→ Certificat expiré → Renouveler avec certbot renew

NET::ERR_CERT_AUTHORITY_INVALID
→ Certificat auto-signé ou chaîne incomplète
→ Vérifier ssl_certificate (doit inclure fullchain, pas seulement cert)

SSL_ERROR_RX_RECORD_TOO_LONG
→ HTTP servi sur port HTTPS ou configuration nginx incorrecte

Mixed Content Warning
→ Page HTTPS charge des ressources HTTP
→ Mettre à jour les URLs vers HTTPS
→ Content-Security-Policy: upgrade-insecure-requests

HSTS Preload
→ Pour être sur la liste preload des navigateurs
→ https://hstspreload.org (vérifier puis soumettre)
```

## Conclusion

TLS est la fondation de la sécurité web. Avec Let's Encrypt, **n'importe quel site peut avoir HTTPS gratuitement en quelques minutes**. La configuration optimale selon Mozilla SSL Configuration Generator + un score A+ sur Qualys SSL Labs = vous êtes dans le top 10% des sites les mieux configurés.