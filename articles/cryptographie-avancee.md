# Cryptographie avancée : PKI, certificats et protocoles modernes

Au-delà du chiffrement symétrique et asymétrique, la cryptographie moderne repose sur des infrastructures complexes. Ce guide explore la PKI, les certificats X.509, TLS moderne et les algorithmes post-quantiques.

## PKI — Infrastructure à Clés Publiques

```
PKI (Public Key Infrastructure) = système de gestion des certificats

Composants :
→ CA (Certificate Authority) : émet et signe les certificats
→ RA (Registration Authority) : vérifie l'identité avant émission
→ CRL (Certificate Revocation List) : liste des certificats révoqués
→ OCSP (Online Certificate Status Protocol) : vérification en temps réel

Hiérarchie de confiance :
Root CA (autosigné, hors ligne)
    ↓
Intermediate CA (en ligne)
    ↓
End-Entity Certificate (votre domaine)

Pourquoi cette hiérarchie ?
→ Root CA toujours hors ligne = si compromise, on révoque l'intermédiaire
→ Intermediate CA peut être révoquée sans toucher la Root
→ Defense in depth pour la confiance
```

### Créer sa propre PKI avec OpenSSL

```bash
# 1. Créer la Root CA
mkdir -p /ca/root/{certs,crl,newcerts,private}
chmod 700 /ca/root/private
touch /ca/root/index.txt
echo 1000 > /ca/root/serial

# Générer la clé privée Root CA (4096 bits, chiffrée)
openssl genrsa -aes256 -out /ca/root/private/ca.key.pem 4096
chmod 400 /ca/root/private/ca.key.pem

# Créer le certificat Root CA (autosigné, valide 20 ans)
openssl req -config openssl.cnf \
    -key /ca/root/private/ca.key.pem \
    -new -x509 -days 7300 -sha256 \
    -extensions v3_ca \
    -out /ca/root/certs/ca.cert.pem

# 2. Créer l'Intermediate CA
openssl genrsa -aes256 -out /ca/intermediate/private/intermediate.key.pem 4096

openssl req -config openssl.cnf \
    -new -sha256 \
    -key /ca/intermediate/private/intermediate.key.pem \
    -out /ca/intermediate/csr/intermediate.csr.pem

# Signer l'Intermediate avec la Root CA
openssl ca -config openssl.cnf -extensions v3_intermediate_ca \
    -days 3650 -notext -md sha256 \
    -in /ca/intermediate/csr/intermediate.csr.pem \
    -out /ca/intermediate/certs/intermediate.cert.pem

# 3. Émettre un certificat serveur
openssl genrsa -out /ca/intermediate/private/server.key.pem 2048

openssl req -config openssl.cnf \
    -key /ca/intermediate/private/server.key.pem \
    -new -sha256 \
    -out /ca/intermediate/csr/server.csr.pem

openssl ca -config openssl.cnf -extensions server_cert \
    -days 365 -notext -md sha256 \
    -in /ca/intermediate/csr/server.csr.pem \
    -out /ca/intermediate/certs/server.cert.pem
```

## Certificats X.509 en détail

```python
# Analyser un certificat avec Python
from cryptography import x509
from cryptography.hazmat.backends import default_backend
import ssl, socket

def analyser_certificat(hostname, port=443):
    # Récupérer le certificat du serveur
    context = ssl.create_default_context()
    with socket.create_connection((hostname, port)) as sock:
        with context.wrap_socket(sock, server_hostname=hostname) as ssock:
            cert_der = ssock.getpeercert(binary_form=True)

    cert = x509.load_der_x509_certificate(cert_der, default_backend())

    analyse = {
        "sujet": cert.subject.rfc4514_string(),
        "émetteur": cert.issuer.rfc4514_string(),
        "valide_du": cert.not_valid_before_utc,
        "valide_au": cert.not_valid_after_utc,
        "numéro_série": hex(cert.serial_number),
        "algorithme_signature": cert.signature_algorithm_oid._name,
        "clé_publique_type": cert.public_key().__class__.__name__,
    }

    # Extensions importantes
    try:
        san = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)
        analyse["SANs"] = [str(name) for name in san.value]
    except: pass

    try:
        ku = cert.extensions.get_extension_for_class(x509.KeyUsage)
        analyse["key_usage"] = {
            "digital_signature": ku.value.digital_signature,
            "key_encipherment": ku.value.key_encipherment,
        }
    except: pass

    return analyse

print(analyser_certificat("google.com"))
```

## Certificate Transparency (CT)

```bash
# Certificate Transparency = logs publics de tous les certificats émis
# Permet de détecter les certificats frauduleux

# Rechercher tous les certificats d'un domaine
curl "https://crt.sh/?q=%.target.com&output=json" | python3 -m json.tool

# Utilisation en reconnaissance :
# Trouver des sous-domaines via les certificats émis !
curl -s "https://crt.sh/?q=%.microsoft.com&output=json" | \
    python3 -c "import sys,json; data=json.load(sys.stdin); [print(c['name_value']) for c in data]" | \
    sort -u | head -50
```

## Cryptographie post-quantique

```
Le problème quantique :
→ Les ordinateurs quantiques peuvent factoriser RSA en temps polynomial (algorithme de Shor)
→ RSA-2048 : actuellement impossible à casser → Cassable par QC suffisamment puissant
→ Timeline : ordinateurs quantiques "cryptographiquement pertinents" dans 10-15 ans ?

NIST Post-Quantum Standards (2024) :
→ CRYSTALS-Kyber (ML-KEM) : chiffrement/échange de clés
→ CRYSTALS-Dilithium (ML-DSA) : signatures numériques
→ SPHINCS+ (SLH-DSA) : signatures basées sur les hash functions

Sécurité "harvest now, decrypt later" :
Les adversaires collectent MAINTENANT des communications chiffrées
pour les déchiffrer PLUS TARD quand les QC seront disponibles
→ Migration vers la crypto post-quantique urgente pour données à longue durée
```

```python
# Utiliser liboqs (Open Quantum Safe)
from oqs import KeyEncapsulation

# Kyber512 - Échange de clés post-quantique
with KeyEncapsulation('Kyber512') as kem:
    public_key = kem.generate_keypair()

    # Encapsulation (côté client)
    ciphertext, shared_secret_enc = kem.encap_secret(public_key)

    # Decapsulation (côté serveur)
    shared_secret_dec = kem.decap_secret(ciphertext)

    assert shared_secret_enc == shared_secret_dec
    print(f"Clé partagée établie : {shared_secret_enc.hex()[:32]}...")
```

## Conclusion

La cryptographie moderne est bien plus que RSA et AES. La PKI structure la confiance sur Internet, les certificats X.509 authentifient l'identité, et la cryptographie post-quantique se prépare pour l'ère des ordinateurs quantiques. Pour un professionnel sécurité, comprendre ces mécanismes est indispensable pour auditer et configurer correctement les systèmes de l'entreprise.

---
*Catégorie : Cryptographie*
