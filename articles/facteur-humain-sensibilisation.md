# Le facteur humain en cybersécurité : former et sensibiliser

Les technologies de sécurité les plus avancées peuvent être contournées par un seul clic sur un lien malveillant. Le facteur humain reste la principale cause de brèches de sécurité. Ce guide explore comment construire une culture de cybersécurité efficace dans une organisation.

## Le facteur humain en chiffres

```
Statistiques 2024 :
→ 74% des brèches de données impliquent l'élément humain (Verizon DBIR)
→ 91% des cyberattaques commencent par un email de phishing
→ Un employé non formé clique sur 1 phishing sur 3
→ Après formation, ce taux tombe à 1 sur 20
→ ROI de la formation : 37$ économisés pour chaque dollar investi

Pourquoi l'humain est vulnérable :
→ Surcharge cognitive (trop de décisions à prendre)
→ Confiance par défaut (nous voulons aider)
→ Urgence (attaquants créent une pression temporelle)
→ Autorité (difficile de refuser un "supérieur")
→ Curiosité (difficile de résister à cliquer)
→ Fatigue (en fin de journée, vigilance réduite)
```

## Les 6 principes de Cialdini exploités

```python
# Robert Cialdini a identifié 6 principes d'influence
# Les attaquants les exploitent systématiquement

principes_exploitation = {

    "1. Réciprocité": {
        "principe": "Nous voulons rendre ce qu'on nous donne",
        "exploitation": "L'attaquant offre quelque chose (aide, info) puis demande en retour",
        "exemple": "Je vous ai envoyé le document demandé, pouvez-vous me donner vos accès ?",
        "défense": "Identifier la demande qui suit le 'cadeau'"
    },

    "2. Engagement/Cohérence": {
        "principe": "Nous voulons rester cohérents avec nos engagements",
        "exploitation": "Petit engagement initial, puis demandes croissantes",
        "exemple": "D'abord : Confirmez-vous être bien employé ? Ensuite : Donnez votre identifiant",
        "défense": "Chaque demande évaluée indépendamment"
    },

    "3. Preuve sociale": {
        "principe": "Nous faisons ce que font les autres",
        "exploitation": "Votre collègue X a déjà approuvé, il ne manque que vous",
        "exemple": "Tous vos collègues ont déjà cliqué sur ce lien de mise à jour",
        "défense": "Vérifier directement avec la personne citée"
    },

    "4. Autorité": {
        "principe": "Nous obéissons aux figures d'autorité",
        "exploitation": "Se faire passer pour PDG, IT, police, banque",
        "exemple": "Fraude au président : email du PDG demandant virement urgent",
        "défense": "Protocoles de vérification pour toute demande sensible"
    },

    "5. Sympathie": {
        "principe": "Nous aidons ceux que nous aimons bien",
        "exploitation": "Créer un rapport amical avant d'exploiter",
        "exemple": "Pig butchering : relation de confiance sur des mois avant l'arnaque",
        "défense": "Méfiance proportionnelle à la demande, même d'amis"
    },

    "6. Rareté/Urgence": {
        "principe": "Ce qui est rare ou urgent est plus désirable",
        "exploitation": "Créer une fausse urgence pour court-circuiter la réflexion",
        "exemple": "Votre compte sera fermé dans 24h si vous ne confirmez pas maintenant",
        "défense": "L'urgence est un signal d'alarme, pas une raison d'agir vite"
    }
}
```

## Programme de sensibilisation efficace

### Les erreurs à éviter

```
❌ Formation annuelle de 2 heures = insuffisant et oublié en 2 semaines
❌ Présentations PowerPoint sans interactivité
❌ Punir les employés qui se font piéger (crée la honte, pas l'apprentissage)
❌ Formation générique non adaptée au contexte de l'entreprise
❌ Focus uniquement sur le technique (ignorer la psychologie)
❌ Faux sentiment de sécurité après formation (ça ne suffit pas)

✅ Programme continu : petites doses régulières toute l'année
✅ Simulations de phishing avec feedback immédiat
✅ Adaptation par métier (comptable ≠ développeur ≠ RH)
✅ Résultats mesurés et améliorés (taux de clic, signalements)
✅ Culture positive : récompenser la vigilance, pas punir l'erreur
✅ Cas réels d'entreprises similaires (rend concret)
```

### Simulation de phishing

```python
# Construire un programme de simulation phishing

class PhishingSimulationProgram:

    def __init__(self):
        self.scenarios = {
            "débutant": [
                "Email Nigeria prince",
                "Alerte sécurité générique",
                "Prix/concours gagné"
            ],
            "intermédiaire": [
                "Fausse facture fournisseur connu",
                "Demande RH urgente",
                "Mise à jour mot de passe IT"
            ],
            "avancé": [
                "Spear phishing basé sur LinkedIn",
                "Deepfake audio PDG",
                "Compromission de partenaire réel"
            ]
        }

    def run_campaign(self, employees, difficulty="intermédiaire"):
        results = {
            "envoyés": len(employees),
            "cliqués": 0,
            "credentials_saisis": 0,
            "signalés": 0,
            "ignorés": 0
        }

        for employee in employees:
            # Envoyer simulation
            result = self.send_simulation(employee, difficulty)

            if result == "clicked_and_credentials":
                results["credentials_saisis"] += 1
                # Feedback immédiat et bienveillant
                self.send_learning_module(employee, "urgent")

            elif result == "clicked":
                results["cliqués"] += 1
                self.send_learning_module(employee, "standard")

            elif result == "reported":
                results["signalés"] += 1
                self.reward_vigilance(employee)  # Féliciter !

        return results

    def reward_vigilance(self, employee):
        """Récompenser les employés vigilants"""
        # Email de félicitations
        # Points dans un programme de gamification
        # Mention lors des réunions d'équipe
        pass

# Plateformes de simulation phishing :
# → KnowBe4 (leader mondial)
# → Proofpoint Security Awareness
# → Gophish (open source)
# → Cofense
```

## Politique de sécurité humaine

### Clean Desk Policy

```
Clean Desk Policy = bureau propre à la fin de la journée

Obligatoire :
→ Aucun document sensible visible sur le bureau
→ Ordinateur verrouillé (Windows+L) dès qu'on quitte le poste
→ Documents confidentiels dans un tiroir fermé à clé
→ Post-it avec mots de passe INTERDITS
→ Badges laissés visibles (ne pas laisser traîner)
→ Déchiqueter les documents sensibles (pas juste poubelle)

Vérification :
→ Audits surprise mensuels
→ Score par équipe (gamification positive)
→ Résultats partagés → émulation saine entre équipes
```

### Politique de mots de passe pour les humains

```
Recommandations NIST 2024 (enfin réalistes) :

ABANDONNÉES (obsolètes) :
❌ Changer le mot de passe tous les 90 jours (crée des patterns prévisibles)
❌ Exiger majuscules + chiffres + symboles (favorise Pa$$w0rd1)
❌ Interdire la réutilisation sur 12 mots de passe

RECOMMANDÉES :
✅ Longues passphrases : "correct-horse-battery-staple" (meilleur que @Mtu789!)
✅ Gestionnaire de mots de passe obligatoire (Bitwarden Enterprise)
✅ Ne changer que si compromis (détecté par HaveIBeenPwned)
✅ MFA obligatoire sur tous les comptes
✅ Passkeys là où c'est disponible

Exemple de bonne politique :
→ Minimum 16 caractères (passphrase encouragée)
→ Bitwarden fourni par l'entreprise
→ MFA TOTP ou FIDO2 obligatoire pour les accès critiques
→ Pas de rotation forcée sauf si brèche détectée
```

## Métriques de maturité en sensibilisation

```python
# KPIs pour mesurer l'efficacité du programme

metriques = {
    "taux_clic_phishing": {
        "débutant": "> 30%",
        "intermédiaire": "10-30%",
        "avancé": "5-10%",
        "excellent": "< 5%"
    },
    "taux_signalement_phishing": {
        "objectif": "> 50% des phishing simulés signalés",
        "excellent": "> 80%"
    },
    "délai_signalement": {
        "objectif": "< 1 heure après réception",
        "excellent": "< 15 minutes"
    },
    "participation_formation": {
        "objectif": "> 90% en 30 jours",
        "excellent": "> 95%"
    },
    "incidents_liés_humain": {
        "mesure": "Évolution année sur année",
        "objectif": "Réduction de 30% par an"
    }
}

# Tableau de bord mensuel pour la direction :
rapport_mensuel = {
    "simulations_envoyées": 500,
    "taux_clic": "8% (vs 12% le mois dernier) ✅",
    "taux_signalement": "45% (vs 30% le mois dernier) ✅",
    "formations_complétées": "94% ✅",
    "incidents_réels": 2,
    "dont_liés_humain": 1,
    "économies_estimées": "450 000€ (incidents évités)"
}
```

## La culture de cybersécurité

```
Les 5 piliers d'une culture cyber saine :

1. TON DONNÉ PAR LE MANAGEMENT
→ Les dirigeants respectent eux-mêmes les règles
→ La sécurité est un investissement, pas un coût
→ Les incidents sont traités comme des opportunités d'apprentissage

2. RESPONSABILITÉ PARTAGÉE
→ La sécurité n'est pas SEULEMENT le problème de l'IT
→ Chaque employé est un acteur de la sécurité
→ "See something, say something" : encourager les signalements

3. FACILITÉ D'UTILISATION
→ Les outils sécurisés doivent être aussi faciles que les non-sécurisés
→ Si la procédure sécurisée est trop complexe → elle sera contournée
→ UX de la sécurité est aussi importante que la technique

4. APPRENTISSAGE CONTINU
→ Le paysage des menaces évolue → la formation doit évoluer
→ Partager les incidents réels (anonymisés) pour apprendre
→ Bulletin mensuel des nouvelles menaces en langage accessible

5. BIENVEILLANCE
→ Punir les erreurs = culture de la honte = moins de signalements
→ Récompenser la vigilance = culture positive = plus de signalements
→ Un employé qui signale un clic malencontreux est un héros, pas un coupable
```

## Conclusion

La cybersécurité humaine est un investissement continu, pas une case à cocher. Les simulations de phishing régulières, la formation contextuelle et une culture positive du signalement réduisent considérablement le risque humain. Mais la technologie doit aussi faciliter la sécurité : passkeys, gestionnaires de mots de passe et MFA obligatoire réduisent la dépendance au bon comportement humain — et c'est exactement l'objectif.

---
*Catégorie : Bonnes pratiques*
