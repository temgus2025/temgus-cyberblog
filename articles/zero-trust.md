# Zero Trust Architecture : ne jamais faire confiance, toujours vérifier

Le modèle de sécurité périmétrique traditionnel ("tout ce qui est dans le réseau est sûr") est obsolète. Le **Zero Trust** repose sur un principe radical : **ne jamais faire confiance, toujours vérifier**, quel que soit l'utilisateur, l'appareil ou la localisation.

## Pourquoi le modèle périmétrique est mort

```
Modèle traditionnel (Château Fort) :
[Internet] ──Firewall──→ [Réseau interne TOUT CONFIANCE]

Problèmes :
❌ Un attaquant qui entre (phishing, VPN compromis) a accès à tout
❌ Les menaces internes (employé malveillant) ne sont pas détectées
❌ Le télétravail a dissous le périmètre
❌ Le cloud a dissous le périmètre
❌ Les appareils personnels (BYOD) ont dissous le périmètre

Statistique : 80% des brèches impliquent des credentials volés.
Un attaquant avec des credentials légitimes passe le firewall sans problème.
```

## Les 5 piliers du Zero Trust

```
1. IDENTITÉ (Identity)
   "Vérifier que l'utilisateur est bien qui il prétend être"
   → MFA fort (FIDO2/Passkeys)
   → Behavioral analytics (l'utilisateur se comporte-t-il normalement ?)
   → Zero Standing Privilege (droits accordés juste-à-temps)

2. APPAREILS (Devices)
   "Vérifier que l'appareil est sain et conforme"
   → MDM (Mobile Device Management)
   → Vérification de conformité (OS à jour, antivirus actif, chiffrement)
   → Certificate-based authentication

3. RÉSEAU (Network)
   "Micro-segmentation, accès minimal"
   → Pas de confiance implicite sur le réseau interne
   → Chiffrement de tout le trafic interne
   → Software-Defined Perimeter (SDP)

4. APPLICATIONS (Applications)
   "Accès uniquement aux applications nécessaires"
   → Application-level authentication
   → API gateway avec authz granulaire
   → Pas d'exposition directe des applications

5. DONNÉES (Data)
   "Protéger les données où qu'elles soient"
   → Classification des données
   → DLP (Data Loss Prevention)
   → Chiffrement at-rest et in-transit
```

## Implémentation Zero Trust

### Microsoft Entra ID (Azure AD) + Conditional Access

```json
// Politique d'accès conditionnel
{
  "displayName": "Require MFA for All Users",
  "state": "enabled",
  "conditions": {
    "users": {
      "includeUsers": ["All"]
    },
    "applications": {
      "includeApplications": ["All"]
    },
    "locations": {
      "includeLocations": ["All"]
    }
  },
  "grantControls": {
    "operator": "AND",
    "builtInControls": [
      "mfa",
      "compliantDevice"  // Appareil conforme MDM obligatoire
    ]
  },
  "sessionControls": {
    "signInFrequency": {
      "value": 1,
      "type": "hours"  // Re-authentification toutes les heures
    }
  }
}
```

### BeyondCorp (modèle Google)

```python
# Google a implémenté Zero Trust en 2011 après Operation Aurora
# (cyberattaque chinoise sur leur infrastructure)

# Principes BeyondCorp appliqués :
principles = {
    "1_network_trust": "La confiance ne vient pas du réseau mais de l'identité+appareil",
    "2_access_decision": "Décision d'accès basée sur : qui + quel appareil + contexte",
    "3_per_request": "Vérification à CHAQUE requête (pas juste à la connexion)",
    "4_encrypted": "Tout le trafic chiffré même réseau interne"
}

# Flow d'accès BeyondCorp :
# 1. Utilisateur demande accès à une app
# 2. Access Proxy vérifie l'identité (SSO + MFA)
# 3. Device Trust Service vérifie l'appareil (conforme ? MDM ? cert ?)
# 4. Policy Engine évalue le contexte (heure, lieu, behavior)
# 5. Accès accordé ou refusé avec scope minimal
```

### Micro-segmentation réseau

```yaml
# Politique de micro-segmentation avec Kubernetes NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-controller
    ports:
    - port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: api-backend  # Frontend parle SEULEMENT à l'API
    ports:
    - port: 3000
  # Tout le reste est bloqué implicitement
```

### Just-In-Time Access (JIT)

```python
# Les droits d'admin ne sont accordés que quand nécessaire
# Et pour une durée limitée

class JITAccessManager:
    def request_access(self, user_id, resource, justification, duration_hours):
        """Demande d'accès temporaire avec justification"""
        request = {
            "user": user_id,
            "resource": resource,
            "justification": justification,
            "duration": duration_hours,
            "expires_at": datetime.now() + timedelta(hours=duration_hours),
            "status": "pending_approval"
        }

        # Notification au manager pour approbation
        self.notify_approver(request)
        return request

    def approve_access(self, request_id, approver_id):
        """Accorder l'accès temporairement"""
        request = self.get_request(request_id)

        # Logger pour audit
        audit_log.info(f"JIT Access granted: {request['user']} → {request['resource']} "
                      f"for {request['duration']}h by {approver_id}")

        # Créer les permissions temporaires
        self.grant_temporary_permissions(
            user=request['user'],
            resource=request['resource'],
            expires_at=request['expires_at']
        )

    def revoke_expired_access(self):
        """Révocation automatique des accès expirés"""
        expired = self.get_expired_requests()
        for request in expired:
            self.revoke_permissions(request['user'], request['resource'])
            audit_log.info(f"JIT Access auto-revoked: {request['user']}")
```

## Maturité Zero Trust

```
Niveau 0 - Traditionnel :
→ Périmètre firewall, réseau plat interne
→ VPN pour le remote

Niveau 1 - Initial :
→ MFA activé pour les admins
→ Quelques politiques d'accès conditionnel

Niveau 2 - Avancé :
→ MFA pour tous + conditional access
→ MDM pour tous les appareils
→ Micro-segmentation basique

Niveau 3 - Optimal :
→ Accès Just-In-Time pour les admins
→ Micro-segmentation complète
→ Behavioral analytics
→ Zero Standing Privilege
→ Continuous validation
```

## Conclusion

Zero Trust n'est pas un produit qu'on achète — c'est une **philosophie et une architecture** qu'on implémente progressivement. Commencez par les bases : MFA fort pour tous, gestion des appareils (MDM), et politiques d'accès conditionnel. Chaque étape réduit significativement votre surface d'attaque, même sans atteindre la maturité maximale.