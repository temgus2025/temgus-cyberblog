# Sécurité avancée des conteneurs : escapes et hardening

Les conteneurs Docker ne sont pas des VMs — ils partagent le kernel de l'hôte. Une mauvaise configuration peut permettre à un attaquant de s'échapper du conteneur et de compromettre l'hôte entier. Ce guide couvre les techniques d'évasion et le hardening avancé.

## Container Escape — Sortir du conteneur

### Via les montages dangereux

```bash
# Monter le système de fichiers de l'hôte
docker run -v /:/host -it ubuntu bash
# → Accès TOTAL au système de fichiers de l'hôte !
ls /host/etc/shadow  # Fichier des mots de passe de l'hôte
chroot /host bash    # Shell sur l'hôte !

# Monter le socket Docker (container escape classique)
docker run -v /var/run/docker.sock:/var/run/docker.sock -it ubuntu bash
# Depuis l'intérieur du conteneur :
apt install docker.io -y
docker run -v /:/host -it ubuntu chroot /host bash
# → Root sur l'hôte via le socket Docker !
```

### Via les capabilities dangereuses

```bash
# Conteneur avec CAP_SYS_ADMIN
docker run --cap-add SYS_ADMIN -it ubuntu bash

# Depuis l'intérieur :
mkdir /tmp/cgroup
mount -t cgroup -o rdma cgroup /tmp/cgroup
mkdir /tmp/cgroup/x
echo 1 > /tmp/cgroup/x/notify_on_release

# Lire la mémoire de l'hôte
cat /proc/kallsyms | grep commit_creds  # Adresses kernel

# Conteneur privileged (le pire) :
docker run --privileged -it ubuntu bash
# Accès direct aux devices → escape trivial
fdisk -l          # Voir les disques de l'hôte
mount /dev/sda1 /mnt  # Monter le disque de l'hôte !
```

### Détection des tentatives d'évasion

```yaml
# Règles Falco pour détecter les container escapes

- rule: Container Escape via Privileged Mount
  desc: Détecte un montage de / dans un conteneur
  condition: >
    container and
    evt.type = mount and
    evt.arg.dev contains "/dev/" and
    not proc.name in (docker, containerd)
  output: "Container escape tentative (container=%container.name)"
  priority: CRITICAL

- rule: Docker Socket Access in Container
  desc: Accès au socket Docker depuis un conteneur
  condition: >
    container and
    fd.name = /var/run/docker.sock
  output: "Accès socket Docker (container=%container.name)"
  priority: HIGH
```

## Hardening avancé des conteneurs

### Seccomp — Filtrage des syscalls

```json
// Profil seccomp personnalisé pour une app web
// Seulement les syscalls nécessaires
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "syscalls": [
    {
      "names": [
        "read", "write", "open", "close",
        "stat", "fstat", "lstat", "poll",
        "mmap", "mprotect", "munmap",
        "brk", "rt_sigaction", "ioctl",
        "access", "pipe", "select",
        "sched_yield", "mremap", "socket",
        "connect", "accept", "sendto",
        "recvfrom", "bind", "listen",
        "getsockname", "getpeername",
        "fork", "execve", "exit",
        "wait4", "kill", "getpid",
        "getuid", "getgid", "getcwd"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

```yaml
# Docker Compose avec seccomp
version: '3.8'
services:
  webapp:
    image: mon-app:latest
    security_opt:
      - seccomp:./seccomp-profile.json
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Seulement si port < 1024
    read_only: true
    user: "1000:1000"
    tmpfs:
      - /tmp:size=100m
```

### Image hardening

```dockerfile
# Dockerfile sécurisé

# Partir d'une image minimale
FROM gcr.io/distroless/java17-debian11  # Pas de shell, pas d'outils

# Ou construire from scratch
FROM scratch
COPY --from=builder /app/server /server

# Si on doit utiliser une image standard
FROM ubuntu:22.04

# Ne pas utiliser root
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copier les fichiers avec les bonnes permissions
COPY --chown=appuser:appgroup app/ /app/

# Passer à l'utilisateur non-root
USER appuser

# Exposer seulement le port nécessaire
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/health || exit 1

# Point d'entrée minimal
ENTRYPOINT ["/app/server"]
```

### Scanning d'images avec Trivy

```bash
# Scanner une image pour les vulnérabilités
trivy image mon-app:latest

# Scanner et échouer si vulnérabilités critiques
trivy image --exit-code 1 --severity CRITICAL mon-app:latest

# Scanner dans le CI/CD (GitHub Actions)
# - name: Run Trivy vulnerability scanner
#   uses: aquasecurity/trivy-action@master
#   with:
#     image-ref: 'mon-app:latest'
#     format: 'sarif'
#     exit-code: '1'
#     severity: 'CRITICAL,HIGH'

# Scanner les fichiers de configuration
trivy config ./kubernetes/
trivy config ./terraform/

# Scanner un dépôt Git
trivy repo https://github.com/mon-org/mon-repo
```

## Checklist sécurité conteneurs

```
Images :
✅ Images minimales (distroless, scratch)
✅ Scan régulier (Trivy, Snyk)
✅ Pas de secrets dans les images
✅ Tags versionnés (jamais :latest en prod)
✅ Images signées (cosign)

Runtime :
✅ Utilisateur non-root (USER 1000)
✅ Pas de conteneurs privileged
✅ Capabilities minimales (cap_drop ALL)
✅ no-new-privileges:true
✅ Filesystem en lecture seule (read_only: true)
✅ Profil seccomp restrictif
✅ AppArmor ou SELinux activé

Réseau :
✅ Network policies (Kubernetes)
✅ Pas de montage du socket Docker
✅ Exposition minimale des ports

Monitoring :
✅ Falco pour la détection runtime
✅ Logs centralisés
✅ Alertes sur comportements anormaux
```

## Conclusion

La sécurité des conteneurs nécessite une approche en couches : images minimales et scannées, runtime avec seccomp/AppArmor/capabilities réduits, réseau isolé et monitoring Falco. Un conteneur mal configuré — surtout avec `--privileged` ou le socket Docker monté — est une porte ouverte vers l'hôte entier. La règle d'or : traitez chaque conteneur comme potentiellement hostile et limitez au maximum ce qu'il peut faire.

---
*Catégorie : Sécurité réseau*
