# RGPD et conformité sécurité : obligations et mise en œuvre

Le RGPD (Règlement Général sur la Protection des Données) est entré en vigueur en mai 2018. Au-delà des amendes, il impose une vraie culture de la sécurité des données personnelles. Ce guide traduit les obligations légales en actions techniques concrètes.

## Les principes fondamentaux du RGPD

```
6 principes clés (Article 5) :

1. LICÉITÉ, LOYAUTÉ, TRANSPARENCE
   → Base légale pour chaque traitement
   → Informer les personnes clairement

2. LIMITATION DES FINALITÉS
   → Collecter uniquement pour un but précis et déclaré
   → Pas de réutilisation pour d'autres fins

3. MINIMISATION DES DONNÉES
   → Ne collecter QUE ce qui est nécessaire
   → Pas de collecte "au cas où"

4. EXACTITUDE
   → Données à jour, possibilité de correction

5. LIMITATION DE LA CONSERVATION
   → Durées de conservation définies et respectées
   → Suppression après la durée

6. INTÉGRITÉ ET CONFIDENTIALITÉ
   → Sécurité technique et organisationnelle appropriée
```

## Privacy by Design et Privacy by Default

```python
# Privacy by Design : intégrer la vie privée dès la conception

# ❌ Mauvaise approche
class UserProfile:
    def __init__(self, user_data):
        # Stocker TOUT sans réfléchir
        self.name = user_data['name']
        self.email = user_data['email']
        self.phone = user_data['phone']
        self.address = user_data['address']
        self.birth_date = user_data['birth_date']
        self.ip_history = user_data.get('ip_history', [])
        self.browsing_history = user_data.get('browsing', [])
        self.location_history = user_data.get('locations', [])
        # On stocke tout "au cas où"

# ✅ Bonne approche - Privacy by Design
class UserProfile:
    def __init__(self, user_data, purpose="newsletter"):
        # Ne collecter que ce qui est NÉCESSAIRE pour la finalité
        if purpose == "newsletter":
            # Pour une newsletter : seulement email + préférence langue
            self.email = user_data['email']
            self.language = user_data.get('language', 'fr')
            # Pas besoin de nom, adresse, téléphone !

        elif purpose == "delivery":
            # Pour une livraison : nom + adresse uniquement
            self.name = user_data['name']
            self.delivery_address = user_data['address']
            # Pas besoin de date de naissance, historique nav !

        # Pas de collecte des IP, tracking, comportement sans base légale explicite
```

## Les bases légales du RGPD

```python
bases_legales = {
    "consentement": {
        "art": "Art. 6(1)(a)",
        "description": "Consentement libre, spécifique, éclairé et univoque",
        "exemple": "Newsletter : case à cocher non pré-cochée",
        "retrait": "Aussi facile que de donner le consentement"
    },
    "contrat": {
        "art": "Art. 6(1)(b)",
        "description": "Nécessaire à l'exécution d'un contrat",
        "exemple": "Adresse pour livraison d'une commande",
        "attention": "Pas de traitement supplémentaire 'lié'"
    },
    "obligation_legale": {
        "art": "Art. 6(1)(c)",
        "description": "Obligation légale du responsable",
        "exemple": "Facturation (conservation 10 ans), déclaration fiscale"
    },
    "interet_legitime": {
        "art": "Art. 6(1)(f)",
        "description": "Intérêt légitime sous conditions",
        "exemple": "Logs de sécurité, prévention de fraude",
        "condition": "Doit être mis en balance avec les droits des personnes"
    }
}
```

## Mise en œuvre technique

### Chiffrement et pseudonymisation

```python
import hashlib
import secrets
from cryptography.fernet import Fernet

class DataProtection:

    def pseudonymise(self, identifier, salt=None):
        """
        Pseudonymisation : remplace l'identifiant par un pseudonyme
        Le lien peut être rétabli avec la table de correspondance
        """
        if not salt:
            salt = secrets.token_hex(16)
        pseudonym = hashlib.sha256(f"{identifier}{salt}".encode()).hexdigest()
        # Stocker le lien identifier → pseudonym dans une table séparée et sécurisée
        return pseudonym, salt

    def anonymise(self, data):
        """
        Anonymisation irréversible : plus aucun lien possible
        Les données anonymisées ne sont plus soumises au RGPD
        """
        # K-anonymity : regrouper les données pour qu'elles
        # s'appliquent à au moins k individus
        # Exemple : âge exact → tranche d'âge
        result = {}
        if 'age' in data:
            result['age_range'] = f"{(data['age'] // 10) * 10}-{(data['age'] // 10) * 10 + 9}"
        if 'zip_code' in data:
            result['region'] = data['zip_code'][:2]  # Département seulement
        return result

    def encrypt_personal_data(self, data, key=None):
        """Chiffrement des données personnelles au repos"""
        if not key:
            key = Fernet.generate_key()
        f = Fernet(key)
        encrypted = f.encrypt(data.encode())
        return encrypted, key
```

### Gestion du consentement

```javascript
// Gestionnaire de consentement RGPD-compliant

class ConsentManager {
    constructor() {
        this.consents = {};
        this.consentLog = []; // Audit trail obligatoire
    }

    requestConsent(purpose, description) {
        // Le consentement doit être :
        // ✅ Libre (pas de service conditionné au consentement marketing)
        // ✅ Spécifique (un consentement par finalité)
        // ✅ Éclairé (description claire)
        // ✅ Univoque (action positive, pas de case pré-cochée)

        return {
            purpose,
            description,
            timestamp: new Date().toISOString(),
            checkboxPreChecked: false, // JAMAIS pré-coché
            bundled: false // JAMAIS groupé avec d'autres consentements
        };
    }

    recordConsent(userId, purpose, given, proofOfConsent) {
        // Enregistrement pour preuve (Article 7 RGPD)
        this.consentLog.push({
            userId,
            purpose,
            given,
            timestamp: new Date().toISOString(),
            ipAddress: proofOfConsent.ip, // Pour preuve
            userAgent: proofOfConsent.userAgent,
            consentText: proofOfConsent.text // Texte exact présenté
        });
        this.consents[`${userId}_${purpose}`] = given;
    }

    withdrawConsent(userId, purpose) {
        // Le retrait doit être aussi simple que le don
        this.recordConsent(userId, purpose, false, { action: 'withdrawal' });
        // Déclencher la suppression des données traitées sur cette base
        this.deleteDataForPurpose(userId, purpose);
    }
}
```

### Droits des personnes

```python
class GDPRRightsHandler:

    def handle_access_request(self, user_id):
        """
        Droit d'accès (Art. 15) :
        Répondre dans 1 mois, données lisibles, format portable
        """
        user_data = {
            'personal_data': self.get_all_user_data(user_id),
            'processing_purposes': self.get_purposes(user_id),
            'data_recipients': self.get_recipients(user_id),
            'retention_period': self.get_retention_info(),
            'rights_info': "Vous pouvez demander rectification, suppression ou portabilité"
        }
        return user_data

    def handle_erasure_request(self, user_id):
        """
        Droit à l'effacement (Art. 17) - "Droit à l'oubli"
        Conditions : plus nécessaire, retrait consentement, opposition...
        Exceptions : obligation légale, intérêt public
        """
        # Vérifier si des exceptions s'appliquent
        if self.has_legal_retention_obligation(user_id):
            return {"status": "partial", "reason": "Obligation légale de conservation"}

        # Supprimer de toutes les bases de données
        self.delete_from_main_db(user_id)
        self.delete_from_analytics(user_id)
        self.delete_from_backups_on_schedule(user_id)  # Backups : prochaine rotation
        self.notify_third_parties(user_id)  # Informer les destinataires

        # Documenter la suppression
        self.log_erasure(user_id, datetime.now())

        return {"status": "success", "completion_date": "Dans les 30 jours pour les backups"}

    def handle_portability_request(self, user_id):
        """
        Droit à la portabilité (Art. 20) :
        Format structuré, couramment utilisé, machine-readable (JSON/CSV)
        """
        data = self.get_all_user_data(user_id)
        return {
            'format': 'JSON',
            'data': data,
            'export_date': datetime.now().isoformat()
        }
```

## Registre des traitements (Article 30)

```python
# Tout responsable de traitement doit tenir un registre

registre_traitements = [
    {
        "nom": "Gestion des comptes utilisateurs",
        "finalite": "Permettre l'accès au service",
        "base_legale": "Contrat",
        "categories_donnees": ["Nom", "Email", "Mot de passe hashé"],
        "categories_personnes": "Utilisateurs du service",
        "destinataires": ["Équipe IT interne"],
        "pays_tiers": None,
        "duree_conservation": "Durée du compte + 3 ans après désactivation",
        "mesures_securite": "Chiffrement AES-256, HTTPS, 2FA disponible"
    },
    {
        "nom": "Analytics et statistiques",
        "finalite": "Améliorer le service",
        "base_legale": "Intérêt légitime",
        "categories_donnees": ["IP anonymisée", "Pages visitées", "Durée session"],
        "categories_personnes": "Visiteurs du site",
        "destinataires": ["Matomo (self-hosted)"],
        "pays_tiers": None,
        "duree_conservation": "13 mois",
        "mesures_securite": "IP anonymisée, pas de cookies tiers, hébergement EU"
    }
]
```

## Notification de violation de données (Article 33/34)

```python
class DataBreachNotification:

    def assess_breach(self, breach_details):
        """
        Évaluer si la violation doit être notifiée :
        - À la CNIL : dans 72h si risque pour les personnes
        - Aux personnes : si risque ÉLEVÉ pour leurs droits et libertés
        """
        risk_score = 0

        # Facteurs de risque
        if breach_details.get('data_encrypted'):
            risk_score -= 2  # Données chiffrées = risque réduit
        if breach_details.get('data_type') == 'health':
            risk_score += 3
        if breach_details.get('data_type') == 'financial':
            risk_score += 3
        if breach_details.get('affected_count') > 1000:
            risk_score += 2
        if breach_details.get('sensitive_categories'):
            risk_score += 3

        return {
            'notify_cnil': risk_score > 0,  # 72h max
            'notify_individuals': risk_score > 3,
            'risk_level': 'high' if risk_score > 3 else 'medium' if risk_score > 0 else 'low'
        }

    def generate_cnil_notification(self, breach):
        """Contenu requis par la CNIL"""
        return {
            'nature_violation': breach['type'],
            'categories_personnes': breach['affected_categories'],
            'nombre_approximatif': breach['affected_count'],
            'categories_donnees': breach['data_types'],
            'consequences_probables': breach['likely_consequences'],
            'mesures_prises': breach['measures_taken'],
            'contact_dpo': self.get_dpo_contact(),
            'date_constatation': breach['discovery_date']
        }
```

## Amendes RGPD

```
Niveaux d'amendes :

Niveau 1 (infractions mineures) :
→ Max : 10 millions € ou 2% du CA mondial
→ Exemples : registre des traitements absent, DPO non désigné

Niveau 2 (infractions graves) :
→ Max : 20 millions € ou 4% du CA mondial
→ Exemples : violation des principes, base légale absente

Amendes notables :
→ Amazon (Luxembourg) : 746M€ (2021) - publicité ciblée sans consentement
→ Instagram (Meta) : 405M€ (2022) - données enfants
→ Facebook (Meta) : 390M€ (2023) - base légale publicité
→ TikTok (Irlande) : 345M€ (2023) - données mineurs
→ Google France : 150M€ (2022) - refus de cookies difficile
→ Total 2023 (UE) : >2 milliards d'euros d'amendes
```

## Conclusion

Le RGPD n'est pas qu'un obstacle légal — c'est une opportunité de construire la confiance avec vos utilisateurs. En pratique : **minimisez la collecte, chiffrez les données sensibles, documentez vos traitements, et préparez vos procédures de réponse aux droits et aux violations**. La CNIL propose des guides pratiques gratuits pour chaque secteur sur cnil.fr.

---
*Article suivant : [Attaques supply chain](../articles/supply-chain-attacks)*
