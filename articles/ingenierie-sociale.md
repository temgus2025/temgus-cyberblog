# Ingénierie sociale : manipuler l'humain pour contourner la sécurité

L'ingénierie sociale est l'art de **manipuler les personnes** pour qu'elles divulguent des informations confidentielles ou effectuent des actions compromettantes. C'est souvent le vecteur d'attaque le plus efficace car il contourne toutes les défenses techniques.

> "Il est plus facile de tromper un humain que de cracker un système bien sécurisé." — Kevin Mitnick, ancien hacker le plus recherché des USA

## Pourquoi l'humain est le maillon faible

Les systèmes informatiques peuvent être patchés. Les humains, eux, ont des **biais cognitifs** permanents que les attaquants exploitent :

| Biais | Exploitation |
|-------|-------------|
| **Autorité** | Se faire passer pour un supérieur, l'IT, la police |
| **Urgence** | "Votre compte sera supprimé dans 2 heures" |
| **Réciprocité** | Rendre service d'abord pour demander quelque chose ensuite |
| **Sympathie** | Établir une relation de confiance avant d'attaquer |
| **Peur** | "Vous avez un virus, appelez immédiatement le 0800..." |
| **Curiosité** | "Vous avez gagné un prix, cliquez ici" |

## Les techniques d'ingénierie sociale

### 1. Pretexting

L'attaquant crée un **scénario fictif crédible** pour obtenir des informations.

```
Scénario classique - "L'audit informatique" :

Attaquant (par téléphone) :
"Bonjour, je suis Thomas de la DSI centrale.
 Nous faisons un audit de sécurité suite à l'incident
 de la semaine dernière. J'ai besoin de vérifier
 votre compte. Pouvez-vous me confirmer votre
 identifiant et je vais réinitialiser votre accès ?"

Victime :
"Bien sûr, c'est j.martin@entreprise.com,
 mot de passe c'est Martin2024..."
```

**Éléments qui rendent le pretexting efficace :**
- Connaissance préalable (prénom, service, incidents récents)
- Vocabulaire technique crédible
- Ton professionnel et assuré
- Référence à des événements réels

### 2. Baiting (Appâtage)

Laisser un objet piégé pour attiser la curiosité.

```
Technique de la clé USB :

1. L'attaquant laisse des clés USB dans le parking
   ou la salle de pause de l'entreprise cible
         ↓
2. Étiquette alléchante : "Salaires 2024"
   ou "Photos soirée de Noël"
         ↓
3. Un employé curieux la branche sur son PC
         ↓
4. Exécution automatique du malware
         ↓
5. L'attaquant a accès au réseau interne
```

> Une étude de l'Université d'Illinois a montré que **48% des clés USB** trouvées dans un parking étaient branchées par les personnes qui les trouvaient.

### 3. Quid Pro Quo

Offrir quelque chose en échange d'informations.

```
"Support technique gratuit" :

Attaquant appelle aléatoirement des employés :
"Bonjour, je suis du support IT. Nous avons détecté
 des problèmes sur votre poste. Je peux vous aider
 à les résoudre, j'ai juste besoin d'accéder à
 votre ordinateur à distance..."

L'employé reçoit une "aide" → donne l'accès
→ Le "technicien" installe un RAT (Remote Access Trojan)
```

### 4. Tailgating / Piggybacking

Accès physique non autorisé en suivant quelqu'un.

```
Attaquant avec les bras chargés de cartons :
"Excusez-moi, pouvez-vous me tenir la porte ?
 J'ai les mains prises..."

Employé accommodant : tient la porte
→ L'attaquant entre dans les locaux sécurisés
```

### 5. Vishing (Voice Phishing)

```
Arnaque au faux support Microsoft :

"Bonjour, nous avons détecté que votre ordinateur
 Windows envoie des erreurs à nos serveurs. Votre
 ordinateur est infecté. Je suis technicien Microsoft
 et je vais vous aider gratuitement..."

→ Installation de TeamViewer ou AnyDesk
→ Accès total à l'ordinateur
→ Vol de données bancaires et installation de malware
→ Parfois demande de paiement en cartes cadeaux
```

**Microsoft ne vous appellera JAMAIS de façon proactive.**

### 6. Spear Phishing ciblé

```bash
# Phase de reconnaissance sur LinkedIn avant l'attaque

Informations collectées sur la cible :
- Nom : Jean Martin
- Poste : Comptable senior
- Entreprise : ABC Corp
- Manager : Sophie Leblanc (DAF)
- Fournisseur habituel : Cabinet Audit XYZ
- Dernier post LinkedIn : "Clôture des comptes en cours"

Email de spear phishing personnalisé :
De : sophie.leblanc@abc-corp.eu  ← Domaine similaire (typosquat)
Objet : Urgent - Virement fournisseur à valider

"Jean,
Suite à notre réunion de ce matin, peux-tu valider
ce virement urgent pour le Cabinet Audit XYZ ?
Ils ont changé leurs coordonnées bancaires.
RIB en pièce jointe.
Sophie"
```

C'est la **fraude au président** (BEC - Business Email Compromise), qui coûte des milliards chaque année.

## Les indicateurs d'une attaque

### Au téléphone

```
⚠️ Signes d'alerte :
→ Appel non sollicité demandant des infos sensibles
→ Urgence artificielle ("maintenant ou jamais")
→ Demande de garder la conversation confidentielle
→ Résistance quand vous proposez de rappeler officiellement
→ Demande de paiement en cartes cadeaux (Apple, Amazon)
→ Accent étranger sur des numéros prétendument français
```

### Par email

```
⚠️ Signes d'alerte :
→ Expéditeur que vous ne reconnaissez pas
→ Domaine légèrement différent (abc-corp.eu vs abc-corp.fr)
→ Pièce jointe inattendue
→ Demande de changer des coordonnées bancaires par email
→ Lien qui ne correspond pas au texte affiché
→ Demande de confidentialité ("ne pas en parler à votre manager")
```

## Se protéger de l'ingénierie sociale

### Pour les individus

```
1. VÉRIFIER l'identité de façon indépendante
   → Raccrochez et rappelez via le numéro officiel
   → Ne rappelez jamais sur le numéro fourni par l'appelant

2. RALENTIR face à l'urgence
   → L'urgence est une manipulation : prenez le temps de vérifier

3. NE JAMAIS donner d'identifiants par téléphone ou email
   → Aucun service légitime ne vous demandera votre mot de passe

4. SIGNALER les tentatives
   → Informez votre responsable et l'équipe sécurité

5. FAIRE CONFIANCE à votre instinct
   → Si quelque chose semble bizarre, c'est probablement le cas
```

### Pour les entreprises

```bash
# Programme de sensibilisation recommandé :

1. Formation régulière des employés
   → Simulations de phishing
   → Exercices de pretexting contrôlés

2. Procédures claires
   → Process de vérification pour les virements
   → "Call-back procedure" pour toute demande sensible

3. Culture de la sécurité
   → Encourager le signalement sans punition
   → "Si vous avez un doute, vérifiez"

4. Tests de pénétration sociale
   → Engager des experts pour tester les employés
   → Identifier les maillons faibles
```

### La règle des 3 vérifications

Avant d'effectuer une action sensible demandée par quelqu'un :

```
1. L'identité est-elle vérifiable indépendamment ?
2. La demande passe-t-elle par les canaux officiels ?
3. Ai-je informé mon responsable ?

Si NON à l'une de ces questions → REFUSER et SIGNALER
```

## Cas réels célèbres

**Twitter 2020** — Des hackers ont appelé des employés Twitter en se faisant passer pour le support IT interne. Résultat : accès aux comptes de Barack Obama, Elon Musk et Apple pour une arnaque Bitcoin à 120 000$.

**RSA Security 2011** — Un email avec une pièce jointe Excel intitulée "Plan de recrutement 2011" a suffi à compromettre les tokens SecurID de millions d'utilisateurs dans le monde entier.

## Conclusion

L'ingénierie sociale démontre que la technologie seule ne suffit pas à sécuriser une organisation. **La formation et la sensibilisation des humains** sont aussi importantes que les firewalls et les antivirus. La règle d'or : **vérifiez toujours, faites confiance prudemment**.