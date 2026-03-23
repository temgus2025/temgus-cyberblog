# Sécurité des microservices : protéger une architecture distribuée

Les microservices ont révolutionné le développement logiciel mais ont multiplié la surface d'attaque. Là où une application monolithique avait une seule entrée, une architecture microservices peut en avoir des dizaines. Ce guide couvre les vecteurs d'attaque spécifiques et les meilleures pratiques de sécurité.

## Pourquoi les microservices sont un défi sécurité

```
Architecture monolithique :
[Client] → [Application unique] → [BDD]
→ 1 surface d'attaque
→ 1 périmètre à sécuriser

Architecture microservices :
[Client] → [API Gateway] → [Service Auth]
                        → [Service Utilisateurs] → [BDD Users]
                        → [Service Commandes]   → [BDD Orders]
                        → [Service Paiement]    → [BDD Payment]
                        → [Service Email]
                        → [Message Queue]
                        → [Service Notifications]

→ Dizaines de surfaces d'attaque
→ Communications inter-services à sécuriser
→ Chaque service = cible potentielle
→ Compromission d'un service = pivot possible
```

## Vecteurs d'attaque spécifiques

### Attaque sur l'API Gateway

```python
# L'API Gateway est la porte d'entrée unique — cible prioritaire

# 1. Bypass de l'API Gateway (accès direct aux services internes)
# Si les services internes sont accessibles directement :
curl http://service-paiement:8080/api/process  # Bypass Gateway !

# Protection : isolation réseau stricte
# Les services internes NE DOIVENT PAS être accessibles depuis Internet
# Kubernetes NetworkPolicy :
"""
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-external-access
spec:
  podSelector:
    matchLabels:
      tier: internal
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: api-gateway  # Seulement depuis la gateway
"""

# 2. Rate limiting bypass
# Sans rate limiting : brute force possible sur tous les endpoints
# Configuration Kong API Gateway :
"""
plugins:
  - name: rate-limiting
    config:
      minute: 100          # 100 requêtes/minute par IP
      hour: 1000
      policy: redis        # Stockage distribué
      fault_tolerant: true
"""
```

### JWT et authentification inter-services

```python
import jwt
from datetime import datetime, timedelta

# ❌ Erreur courante : pas d'authentification inter-services
# Service A appelle Service B sans vérification
response = requests.get('http://service-users/api/users/123')
# N'importe quel service compromis peut appeler n'importe quel autre !

# ✅ Authentification service-to-service avec JWT
def creer_service_token(service_name, secret_key):
    payload = {
        'iss': service_name,          # Émetteur
        'aud': 'microservices',       # Audience
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(minutes=5),  # Courte durée
        'scope': ['read:users'],      # Permissions minimales
    }
    return jwt.encode(payload, secret_key, algorithm='RS256')

# Utilisation
token = creer_service_token('service-commandes', PRIVATE_KEY)
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://service-users/api/users/123', headers=headers)

# ✅ Encore mieux : mTLS (mutual TLS)
# Chaque service a un certificat client
# Authentification mutuelle = les deux parties se vérifient
```

### Injection dans les messages queues

```python
# Les message queues (RabbitMQ, Kafka) sont souvent oubliées
# Un attaquant qui accède à la queue peut injecter des messages malveillants

# ❌ Consommateur vulnérable
def process_message(message):
    data = json.loads(message)
    user_id = data['user_id']
    action = data['action']
    os.system(f"process_user {user_id} {action}")  # Injection commande !

# ✅ Consommateur sécurisé
import bleach
from pydantic import BaseModel, validator

class UserMessage(BaseModel):
    user_id: int  # Validation de type
    action: str

    @validator('action')
    def validate_action(cls, v):
        allowed = ['activate', 'deactivate', 'delete']
        if v not in allowed:
            raise ValueError(f'Action non autorisée: {v}')
        return v

    @validator('user_id')
    def validate_user_id(cls, v):
        if v <= 0 or v > 1000000:
            raise ValueError('user_id invalide')
        return v

def process_message_secure(message):
    try:
        data = UserMessage(**json.loads(message))
        # Traitement sécurisé avec données validées
        handle_user_action(data.user_id, data.action)
    except ValueError as e:
        logger.warning(f"Message malformé rejeté: {e}")
```

## Service Mesh — Sécurité transparente

```yaml
# Istio Service Mesh — Sécurité automatique entre tous les services

# mTLS automatique entre tous les services
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT  # mTLS obligatoire pour toutes les communications

---
# Autorisation fine : Service A peut appeler Service B uniquement sur /api/users
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: service-users-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app: service-users
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/service-commandes"]
  - to:
    - operation:
        methods: ["GET"]
        paths: ["/api/users/*"]
  # Tout autre accès = refusé
```

## Secrets management dans les microservices

```python
# ❌ Mauvaise pratique : secrets en variables d'environnement
# docker-compose.yml
"""
services:
  service-paiement:
    environment:
      - DB_PASSWORD=SuperSecret123  # Visible dans les logs, ps aux, etc.
      - STRIPE_KEY=sk_live_abc123
"""

# ✅ Bonne pratique : HashiCorp Vault
import hvac

def get_secret(secret_path):
    client = hvac.Client(url='http://vault:8200')
    client.auth.approle.login(
        role_id=os.environ['VAULT_ROLE_ID'],
        secret_id=os.environ['VAULT_SECRET_ID']
    )
    secret = client.secrets.kv.v2.read_secret_version(path=secret_path)
    return secret['data']['data']

# Rotation automatique des secrets
# Audit trail de tous les accès aux secrets
# Révocation immédiate si compromission

# Configuration Vault
"""
path "secret/data/service-paiement/*" {
  capabilities = ["read"]  # Lecture seulement
}
"""

# Utilisation
db_config = get_secret('service-paiement/database')
stripe_config = get_secret('service-paiement/stripe')
```

## Observabilité sécurité

```python
# Centraliser les logs de sécurité de tous les microservices

import structlog
from opentelemetry import trace

logger = structlog.get_logger()
tracer = trace.get_tracer(__name__)

def process_payment(user_id, amount, card_token):
    with tracer.start_as_current_span("process_payment") as span:
        span.set_attribute("user.id", user_id)
        span.set_attribute("payment.amount", amount)
        # Ne JAMAIS logger les données sensibles (card_token, CVV)

        logger.info(
            "payment_initiated",
            user_id=user_id,
            amount=amount,
            service="payment-service",
            trace_id=span.get_span_context().trace_id
        )

        try:
            result = stripe.charge(card_token, amount)
            logger.info("payment_success", user_id=user_id, amount=amount)
            return result
        except stripe.CardError as e:
            logger.warning("payment_failed", user_id=user_id, reason=str(e))
            raise

# Alertes sur comportements anormaux :
# → Service appelant des endpoints inhabituels
# → Volume de requêtes anormal
# → Erreurs d'authentification répétées entre services
```

## Checklist sécurité microservices

```
Architecture :
✅ API Gateway comme unique point d'entrée
✅ Services internes inaccessibles depuis Internet
✅ Network segmentation (Kubernetes NetworkPolicy)
✅ Service mesh avec mTLS (Istio, Linkerd)

Authentification :
✅ JWT ou mTLS pour les communications inter-services
✅ Principe du moindre privilège par service
✅ Rotation régulière des credentials
✅ Service accounts dédiés par service

Secrets :
✅ HashiCorp Vault ou AWS Secrets Manager
✅ Jamais de secrets en variables d'environnement
✅ Jamais de secrets dans le code ou les images Docker
✅ Audit trail des accès aux secrets

Runtime :
✅ Scan des images Docker (Trivy)
✅ Policies de sécurité des pods (non-root, read-only FS)
✅ Rate limiting à l'API Gateway
✅ Centralisation et corrélation des logs de sécurité
```

## Conclusion

La sécurité des microservices nécessite une approche **defense-in-depth** : chaque service doit être sécurisé individuellement (moindre privilège, validation des entrées) ET les communications entre services doivent être authentifiées et chiffrées (mTLS, JWT). Un service mesh comme Istio automatise une grande partie de cette sécurité de façon transparente pour les développeurs.

---
*Catégorie : Architecture & Cloud*
