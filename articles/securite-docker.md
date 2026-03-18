# Sécurité des conteneurs Docker

Docker a révolutionné le déploiement d'applications. Mais des conteneurs mal configurés peuvent exposer vos systèmes à de sérieux risques. Ce guide couvre les meilleures pratiques pour sécuriser vos environnements Docker.

## Les risques spécifiques à Docker

```
Sans précautions, Docker peut exposer :
→ L'hôte entier si le conteneur est compromis
→ Des secrets dans les images (mots de passe, clés API)
→ Des données sensibles via les volumes
→ L'API Docker daemon (accès root sur l'hôte !)
→ Le réseau interne via des conteneurs interconnectés
```

## Sécuriser les images Docker

### 1. Utiliser des images officielles et minimales

```dockerfile
# ❌ À éviter
FROM ubuntu:latest           # Image lourde, beaucoup de surface d'attaque
FROM ubuntu                  # "latest" peut changer et casser la reproductibilité

# ✅ Recommandé
FROM python:3.11-slim        # Version slim = moins de paquets = moins de vulnérabilités
FROM node:20-alpine          # Alpine Linux = image ultra-légère (~5MB)
FROM scratch                 # Image vide pour les binaires statiques (Go, Rust)

# Toujours épingler la version exacte
FROM python:3.11.4-slim-bookworm  # Version exacte reproductible
```

### 2. Ne jamais stocker de secrets dans les images

```dockerfile
# ❌ DANGEREUX - Le secret est dans les layers de l'image
FROM python:3.11-slim
ENV DATABASE_PASSWORD="MonMotDePasse123"
RUN pip install -r requirements.txt

# ❌ DANGEREUX - Même si supprimé ensuite, il reste dans un layer intermédiaire
RUN echo "secret_key=abc123" > /app/config.ini && \
    # ... faire quelque chose ... && \
    rm /app/config.ini   # Le secret reste dans le layer précédent !

# ✅ CORRECT - Injecter les secrets au runtime
# docker run -e DATABASE_PASSWORD="secret" mon_image
# ou avec Docker secrets / Kubernetes secrets
```

### 3. Utiliser un utilisateur non-root

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Créer un utilisateur non-root
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser

# Changer la propriété des fichiers
RUN chown -R appuser:appgroup /app

# Basculer vers l'utilisateur non-root
USER appuser

# Si le conteneur est compromis, l'attaquant n'a pas les droits root
EXPOSE 8000
CMD ["python", "app.py"]
```

### 4. Dockerfile multi-stage pour réduire la surface d'attaque

```dockerfile
# Stage 1 : Build (avec tous les outils de compilation)
FROM node:20 AS builder
WORKDIR /build
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 : Production (image minimale sans les outils de build)
FROM node:20-alpine AS production
WORKDIR /app

# Copier seulement le nécessaire depuis le stage de build
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules

# L'image finale ne contient pas : npm, les sources, les tests, etc.
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## Sécuriser le runtime Docker

### Limiter les ressources et capacités

```bash
# Limiter CPU et mémoire
docker run \
  --memory="512m" \
  --cpus="0.5" \
  --memory-swap="512m" \    # Désactiver le swap
  mon_image

# Supprimer toutes les capabilities Linux inutiles
docker run \
  --cap-drop=ALL \           # Supprimer TOUTES les capabilities
  --cap-add=NET_BIND_SERVICE \ # Réajouter seulement ce qui est nécessaire
  mon_image

# Système de fichiers en lecture seule
docker run \
  --read-only \
  --tmpfs /tmp \             # /tmp en mémoire (si nécessaire)
  mon_image

# Empêcher l'élévation de privilèges
docker run \
  --security-opt no-new-privileges \
  mon_image

# Exemple complet sécurisé
docker run \
  --name webapp \
  --user 1000:1000 \
  --memory="256m" \
  --cpus="0.25" \
  --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  --read-only \
  --tmpfs /tmp:noexec,nosuid,size=50m \
  --security-opt no-new-privileges \
  --network webapp-net \
  -p 127.0.0.1:8080:8080 \  # Exposer seulement sur localhost
  mon_image
```

### Sécuriser le Docker daemon

```bash
# ❌ DANGEREUX - Socket Docker exposée sur le réseau
docker run -v /var/run/docker.sock:/var/run/docker.sock mon_image
# Quiconque peut accéder au socket Docker a les droits root sur l'hôte !

# ✅ Activer TLS sur le daemon Docker
# /etc/docker/daemon.json
{
  "tls": true,
  "tlscert": "/etc/docker/server-cert.pem",
  "tlskey": "/etc/docker/server-key.pem",
  "tlscacert": "/etc/docker/ca.pem",
  "hosts": ["tcp://0.0.0.0:2376", "unix:///var/run/docker.sock"],
  "userns-remap": "default",         # User namespace remapping
  "no-new-privileges": true,
  "icc": false,                       # Désactiver la communication inter-conteneurs par défaut
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## Docker Compose sécurisé

```yaml
# docker-compose.yml sécurisé
version: '3.8'

services:
  webapp:
    image: mon_image:1.2.3         # Tag fixe, jamais "latest"
    user: "1000:1000"              # Utilisateur non-root
    read_only: true                # Système de fichiers en lecture seule
    tmpfs:
      - /tmp:noexec,nosuid
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
    mem_limit: 256m
    cpus: 0.25
    environment:
      - NODE_ENV=production
    secrets:
      - db_password              # Utiliser Docker secrets
    networks:
      - frontend
    ports:
      - "127.0.0.1:8080:8080"   # Seulement localhost
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  database:
    image: postgres:15-alpine
    user: "postgres"
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    networks:
      - backend                  # Pas accessible depuis frontend !
    # Pas de ports exposés → accessible seulement depuis le réseau interne

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true               # Réseau interne, pas d'accès Internet

volumes:
  db_data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## Audit et scanning d'images

```bash
# Trivy - Scanner de vulnérabilités (recommandé)
trivy image python:3.11-slim
trivy image mon_image:latest
trivy fs .                      # Scanner le répertoire courant

# Docker Bench Security - Audit de la configuration Docker
docker run --rm --net host --pid host --userns host --cap-add audit_control \
  -v /etc:/etc:ro \
  -v /lib/systemd/system:/lib/systemd/system:ro \
  -v /usr/bin/containerd:/usr/bin/containerd:ro \
  -v /usr/bin/runc:/usr/bin/runc:ro \
  -v /usr/lib/systemd:/usr/lib/systemd:ro \
  -v /var/lib:/var/lib:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  docker/docker-bench-security

# Hadolint - Linter pour Dockerfile
hadolint Dockerfile
docker run --rm -i hadolint/hadolint < Dockerfile

# Dive - Analyser les layers d'une image
dive mon_image:latest
# Montre ce que chaque layer ajoute et identifie les fichiers sensibles
```

## Checklist sécurité Docker

```
Images
✅ Images officielles avec version épinglée
✅ Images slim ou alpine
✅ Build multi-stage
✅ Pas de secrets dans les images
✅ Scan régulier avec Trivy
✅ .dockerignore pour exclure les fichiers sensibles

Runtime
✅ Utilisateur non-root (USER dans Dockerfile)
✅ --cap-drop=ALL avec caps minimales
✅ --read-only si possible
✅ --security-opt no-new-privileges
✅ Limites mémoire et CPU
✅ Ports exposés seulement sur localhost si possible

Réseau
✅ Réseaux séparés (frontend/backend)
✅ Réseaux internes pour les bases de données
✅ Pas d'exposition du socket Docker
✅ TLS sur le daemon si accès réseau

Secrets
✅ Docker Secrets ou variables d'environnement au runtime
✅ HashiCorp Vault pour les environnements enterprise
✅ Jamais de secrets dans les images ou docker-compose.yml en clair
```

## Conclusion

La sécurité Docker repose sur la **défense en profondeur** : images minimales, utilisateurs non-root, capabilities réduites, réseaux segmentés et secrets gérés séparément. Ces pratiques réduisent considérablement la surface d'attaque et limitent l'impact d'un conteneur compromis.