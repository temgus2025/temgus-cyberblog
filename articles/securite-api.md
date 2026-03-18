# Sécurité des APIs REST : les bonnes pratiques

Les APIs REST sont le cœur des applications modernes. Elles connectent frontend, mobile, microservices et partenaires. Mais une API mal sécurisée est une porte d'entrée directe sur vos données et systèmes.

## Pourquoi les APIs sont des cibles privilégiées

En 2023, **83% du trafic internet** passe par des APIs. Les 10 principales vulnérabilités API (OWASP API Top 10) représentent les vecteurs d'attaque les plus courants.

## OWASP API Top 10

### API1 — Broken Object Level Authorization (BOLA)

La vulnérabilité la plus commune. L'API ne vérifie pas si l'utilisateur a le droit d'accéder à un objet spécifique.

```http
# Requête légitime de l'utilisateur 123
GET /api/users/123/profile
Authorization: Bearer token_user_123

# Attaque BOLA : accès au profil d'un autre utilisateur
GET /api/users/124/profile
Authorization: Bearer token_user_123
# Si l'API retourne les données → BOLA !
```

**Correction :**
```python
# Toujours vérifier que l'objet appartient à l'utilisateur connecté
@app.route('/api/users/<int:user_id>/profile')
def get_profile(user_id):
    current_user = get_current_user()  # Depuis le token JWT

    # Vérification d'autorisation explicite
    if current_user.id != user_id and not current_user.is_admin:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify(User.query.get(user_id).to_dict())
```

### API2 — Broken Authentication

```http
# Token JWT sans expiration
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyX2lkIjoxMjN9.
# Algorithme "none" → pas de signature → facile à falsifier !

# Token avec algorithme faible
eyJhbGciOiJIUzI1NiJ9...
# Clé secrète faible : "secret" ou "password"
```

**Bonnes pratiques :**
```python
import jwt
from datetime import datetime, timedelta

def create_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=1),  # Expiration 1h
        'iat': datetime.utcnow(),
        'jti': str(uuid.uuid4())  # ID unique pour révocation
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    # Utiliser RS256 (asymétrique) pour les systèmes critiques
```

### API3 — Broken Object Property Level Authorization

```http
# Requête normale de mise à jour du profil
PATCH /api/users/123
{"name": "Jean Martin", "email": "jean@example.com"}

# Attaque : ajout de propriétés non attendues (Mass Assignment)
PATCH /api/users/123
{"name": "Jean", "email": "jean@example.com", "role": "admin", "balance": 99999}
# Si l'API accepte "role" et "balance" → Élévation de privilèges !
```

**Correction :**
```python
# Whitelisting des champs autorisés
ALLOWED_UPDATE_FIELDS = {'name', 'email', 'phone'}

def update_user(user_id, data):
    # Ne traiter que les champs autorisés
    filtered_data = {k: v for k, v in data.items() if k in ALLOWED_UPDATE_FIELDS}
    User.query.filter_by(id=user_id).update(filtered_data)
```

### API4 — Unrestricted Resource Consumption

```python
# Sans rate limiting : l'attaquant peut :
# - Envoyer 1 000 000 requêtes/seconde
# - Télécharger des fichiers énormes
# - Déclencher des opérations coûteuses en boucle

# Avec Flask-Limiter
from flask_limiter import Limiter

limiter = Limiter(app, key_func=get_remote_address)

@app.route('/api/send-email')
@limiter.limit("5 per minute")  # Max 5 emails par minute par IP
def send_email():
    pass

@app.route('/api/search')
@limiter.limit("100 per hour")
def search():
    pass
```

### API5 — Broken Function Level Authorization

```http
# Endpoints admin non protégés
GET  /api/users          # Liste publique → OK
POST /api/admin/users    # Création admin → doit être protégé !
DELETE /api/admin/users/123  # Suppression → doit être protégé !

# L'attaquant tente de découvrir les endpoints admin
GET /api/admin
GET /api/v1/admin
GET /api/internal
```

## Sécurisation complète d'une API

### Authentification et autorisation

```python
from functools import wraps
import jwt

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token manquant'}), 401
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.current_user = User.query.get(payload['user_id'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expiré'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token invalide'}), 401
        return f(*args, **kwargs)
    return decorated

def require_role(role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not request.current_user.has_role(role):
                return jsonify({'error': 'Accès refusé'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

@app.route('/api/admin/users')
@require_auth
@require_role('admin')
def list_all_users():
    return jsonify([u.to_dict() for u in User.query.all()])
```

### Headers de sécurité

```python
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Ne jamais exposer la version du serveur
    response.headers.pop('Server', None)
    response.headers.pop('X-Powered-By', None)
    return response
```

### Validation des entrées

```python
from marshmallow import Schema, fields, validate, ValidationError

class UserCreateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=50))
    email = fields.Email(required=True)
    age = fields.Int(validate=validate.Range(min=18, max=120))
    role = fields.Str(validate=validate.OneOf(['user', 'moderator']))
    # Jamais 'admin' accessible depuis l'API publique !

@app.route('/api/users', methods=['POST'])
@require_auth
def create_user():
    try:
        data = UserCreateSchema().load(request.json)
    except ValidationError as e:
        return jsonify({'errors': e.messages}), 400
    # Continuer avec data validée et filtrée
```

### Logging et monitoring

```python
import logging
from datetime import datetime

security_logger = logging.getLogger('security')

@app.before_request
def log_request():
    security_logger.info({
        'timestamp': datetime.utcnow().isoformat(),
        'ip': request.remote_addr,
        'method': request.method,
        'path': request.path,
        'user_agent': request.user_agent.string
    })

# Alertes sur comportements suspects
def check_suspicious_activity(user_id, action):
    recent_failures = get_recent_failures(user_id, minutes=5)
    if recent_failures > 10:
        security_logger.warning(f"Activité suspecte user {user_id}: {recent_failures} échecs")
        block_user_temporarily(user_id)
```

## Checklist de sécurité API

```
Authentification
✅ JWT avec expiration courte (1h max)
✅ Algorithme RS256 ou HS256 (jamais "none")
✅ Refresh tokens avec rotation
✅ Révocation de tokens possible

Autorisation
✅ Vérification objet par objet (anti-BOLA)
✅ Whitelisting des champs modifiables
✅ Endpoints admin séparés et protégés

Données
✅ Validation stricte des entrées
✅ Pas de données sensibles dans les URLs
✅ Pagination limitée (max 100 résultats)
✅ HTTPS uniquement (HSTS activé)

Infrastructure
✅ Rate limiting par endpoint
✅ Logs de sécurité centralisés
✅ Headers de sécurité
✅ Tests de pénétration réguliers
```

## Conclusion

La sécurité d'une API repose sur le principe **"ne jamais faire confiance au client"**. Validez tout, autorisez explicitement, limitez le débit et loguez tout. Les outils comme **OWASP ZAP** ou **Burp Suite** permettent d'auditer automatiquement vos APIs.