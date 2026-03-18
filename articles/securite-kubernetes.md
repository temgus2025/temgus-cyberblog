# Sécurité Kubernetes : protéger vos clusters

Kubernetes est devenu le standard de l'orchestration de conteneurs. Mais un cluster mal configuré peut exposer toute votre infrastructure. Ce guide couvre les vecteurs d'attaque spécifiques à Kubernetes et les meilleures pratiques de sécurisation.

## Les risques spécifiques à Kubernetes

```
Vecteurs d'attaque courants sur K8s :

1. API Server exposé sur Internet
   → Pas d'authentification ou authentification faible
   → Accès à tout le cluster

2. RBAC trop permissif
   → ServiceAccounts avec droits cluster-admin
   → Pods peuvent modifier le cluster entier

3. Conteneurs privilégiés
   → Accès root sur le nœud hôte
   → Évasion du conteneur possible

4. Secrets en clair dans les manifests
   → Mots de passe dans les variables d'environnement YAML
   → Secrets visibles dans etcd non chiffré

5. Images non scannées
   → Vulnérabilités dans les images de base
   → Images depuis registries non approuvés

6. etcd non sécurisé
   → Base de données du cluster exposée
   → Tous les secrets en clair
```

## Sécuriser l'API Server

```yaml
# kube-apiserver.yaml - Options de sécurité
apiVersion: v1
kind: Pod
metadata:
  name: kube-apiserver
spec:
  containers:
  - command:
    - kube-apiserver
    # Authentification
    - --client-ca-file=/etc/kubernetes/pki/ca.crt
    - --tls-cert-file=/etc/kubernetes/pki/apiserver.crt
    - --tls-private-key-file=/etc/kubernetes/pki/apiserver.key

    # Désactiver l'accès anonyme
    - --anonymous-auth=false

    # Authorization
    - --authorization-mode=Node,RBAC

    # Audit logging
    - --audit-log-path=/var/log/audit.log
    - --audit-log-maxage=30
    - --audit-policy-file=/etc/kubernetes/audit-policy.yaml

    # Chiffrement etcd
    - --encryption-provider-config=/etc/kubernetes/encryption-config.yaml

    # Désactiver les profils insécurisés
    - --insecure-port=0  # Désactiver le port HTTP non chiffré
    - --profiling=false
```

## RBAC — Contrôle d'accès basé sur les rôles

```yaml
# Principe du moindre privilège avec RBAC

# ❌ MAUVAISE pratique : cluster-admin partout
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: bad-practice
subjects:
- kind: ServiceAccount
  name: my-app
  namespace: default
roleRef:
  kind: ClusterRole
  apiGroup: rbac.authorization.k8s.io
  name: cluster-admin  # TROP PERMISSIF !

---
# ✅ BONNE pratique : accès minimal
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: app-role
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]  # Seulement lecture
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
# Pas d'accès aux secrets, pas de modification

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-rolebinding
  namespace: production
subjects:
- kind: ServiceAccount
  name: my-app
  namespace: production
roleRef:
  kind: Role
  apiGroup: rbac.authorization.k8s.io
  name: app-role
```

```bash
# Auditer les permissions RBAC
kubectl auth can-i --list --as=system:serviceaccount:default:my-app
kubectl auth can-i create pods --as=system:serviceaccount:default:my-app

# Outil rakkess - Visualiser les permissions
rakkess --sa default:my-app

# Outil rbac-tool
kubectl rbac-tool lookup system:serviceaccounts
kubectl rbac-tool who-can create pods
```

## Pod Security

```yaml
# SecurityContext - Restrictions au niveau pod
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true       # Pas de root
    runAsUser: 1000          # UID non-root
    runAsGroup: 3000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault   # Profil seccomp par défaut

  containers:
  - name: app
    image: mon-app:1.2.3
    securityContext:
      allowPrivilegeEscalation: false  # Pas d'élévation de privilèges
      readOnlyRootFilesystem: true     # FS en lecture seule
      capabilities:
        drop:
        - ALL                # Supprimer TOUTES les capabilities Linux
        add:
        - NET_BIND_SERVICE   # Réajouter seulement le nécessaire

    resources:
      limits:
        memory: "256Mi"
        cpu: "500m"
      requests:
        memory: "128Mi"
        cpu: "250m"

    # Monter /tmp en mémoire (pour readOnlyRootFilesystem)
    volumeMounts:
    - mountPath: /tmp
      name: tmp-dir

  volumes:
  - name: tmp-dir
    emptyDir: {}

  # Pas d'accès à l'API Kubernetes depuis le pod
  automountServiceAccountToken: false
```

## Gestion des secrets

```bash
# ❌ MAUVAIS : secrets en clair dans les variables d'env
env:
- name: DB_PASSWORD
  value: "MonMotDePasse123"  # Visible dans le YAML !

# ❌ MAUVAIS : Secret K8s encodé Base64 (pas chiffré !)
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
data:
  password: TW9uTW90RGVQYXNzZTEyMw==  # Juste du base64 !
```

```yaml
# ✅ BON : Chiffrement etcd
# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: <base64-encoded-32-byte-key>
  - identity: {}

---
# ✅ MIEUX : External Secrets Operator avec HashiCorp Vault
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-secret
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: db-secret
  data:
  - secretKey: password
    remoteRef:
      key: prod/database
      property: password
```

## Network Policies

```yaml
# Par défaut Kubernetes : tout le trafic est autorisé entre pods !
# Network Policies permettent de micro-segmenter

# Politique "deny all" par défaut
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}  # Sélectionne tous les pods
  policyTypes:
  - Ingress
  - Egress
  # Pas de règles = tout bloqué

---
# Autoriser seulement le frontend vers le backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - port: 3000
  # Tout autre trafic vers backend = bloqué
```

## Admission Controllers

```yaml
# OPA Gatekeeper - Politique de sécurité déclarative

# Règle : interdire les images sans tag fixe (no "latest")
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
  targets:
  - target: admission.k8s.gatekeeper.sh
    rego: |
      package k8srequiredlabels
      violation[{"msg": msg}] {
        container := input.review.object.spec.containers[_]
        endswith(container.image, ":latest")
        msg := sprintf("Image %v uses ':latest' tag - use specific version", [container.image])
      }

---
# Règle : CPU/Memory limits obligatoires
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sresourcelimits
spec:
  targets:
  - target: admission.k8s.gatekeeper.sh
    rego: |
      package k8sresourcelimits
      violation[{"msg": msg}] {
        container := input.review.object.spec.containers[_]
        not container.resources.limits
        msg := sprintf("Container %v must have resource limits", [container.name])
      }
```

## Outils d'audit Kubernetes

```bash
# Kube-bench - Vérification CIS Benchmark
docker run --pid=host -v /etc:/etc:ro -v /var:/var:ro \
  -t aquasec/kube-bench:latest

# Falco - Détection d'anomalies runtime
helm install falco falcosecurity/falco \
  --set driver.kind=ebpf

# Règles Falco personnalisées
# /etc/falco/rules.d/custom.yaml
- rule: Shell in Container
  desc: Détecte l'ouverture d'un shell dans un conteneur
  condition: >
    spawned_process and container
    and shell_procs
    and not proc.pname in (java, python)
  output: Shell dans conteneur (user=%user.name cmd=%proc.cmdline)
  priority: WARNING

# Trivy - Scan des images ET de la configuration K8s
trivy k8s --report all cluster
trivy image mon-app:latest

# Kubesec - Score de sécurité d'un manifest
kubesec scan deployment.yaml
```

## Checklist sécurité Kubernetes

```
Cluster
✅ API Server non exposé sur Internet
✅ RBAC activé (--authorization-mode=RBAC)
✅ Accès anonyme désactivé
✅ Audit logging activé
✅ etcd chiffré

Workloads
✅ Pas de conteneurs privilégiés
✅ runAsNonRoot: true
✅ readOnlyRootFilesystem: true
✅ CPU/Memory limits définis
✅ automountServiceAccountToken: false si non nécessaire

Réseau
✅ Network Policies "deny all" par défaut
✅ Règles d'autorisation explicites
✅ Ingress TLS configuré

Secrets
✅ Chiffrement etcd activé
✅ External Secrets (Vault) de préférence
✅ Pas de secrets dans les images

Images
✅ Tags versionnés (jamais :latest en prod)
✅ Scan d'images dans CI/CD (Trivy)
✅ Registre privé approuvé
✅ Images non-root par défaut
```

## Conclusion

Kubernetes est puissant mais complexe à sécuriser. Les principaux risques viennent du **RBAC trop permissif, des conteneurs privilégiés et des secrets mal gérés**. Commencez par appliquer le CIS Kubernetes Benchmark avec kube-bench, activez Falco pour la détection runtime, et implémentez Network Policies pour micro-segmenter vos workloads.