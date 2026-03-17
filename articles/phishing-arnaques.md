# Phishing : reconnaître et éviter les pièges

Le phishing (hameçonnage) est l'une des cyberattaques les plus répandues et les plus efficaces. En 2024, plus de **3,4 milliards** d'emails de phishing sont envoyés chaque jour. Apprendre à les reconnaître peut vous éviter de perdre vos données, votre argent ou l'accès à vos comptes.

## Qu'est-ce que le phishing ?

Le phishing est une technique d'**ingénierie sociale** qui consiste à se faire passer pour une entité de confiance (banque, service gouvernemental, entreprise connue) pour vous pousser à :

- Divulguer vos identifiants et mots de passe
- Entrer vos coordonnées bancaires
- Télécharger un malware
- Effectuer un virement frauduleux

> Le phishing exploite la **psychologie humaine**, pas les failles techniques. C'est pourquoi il est si efficace — même les experts peuvent se faire piéger.

## Les types de phishing

### 1. Email Phishing (le plus courant)

Un email imitant une entreprise légitime vous demande d'agir rapidement.

**Exemple typique :**
```
De : securite@credit-agricoI.com  ← Notez le "I" majuscule au lieu de "l"
Objet : ⚠️ Votre compte a été suspendu - Action requise

Cher client,

Nous avons détecté une activité suspecte sur votre compte.
Pour éviter la suspension définitive, veuillez confirmer
vos informations dans les 24 heures :

→ [Cliquez ici pour sécuriser votre compte]

Cordialement,
Service Sécurité Crédit Agricole
```

**Red flags ici :**
- Domaine avec faute (`agricoI` avec un I)
- Urgence artificielle (24h)
- Lien générique sans domaine visible
- Menace de conséquences graves

### 2. Spear Phishing

Version **ciblée** du phishing. L'attaquant a fait des recherches sur vous (LinkedIn, réseaux sociaux) et personnalise son message pour le rendre plus crédible.

```
De : pierre.martin@votre-entreprise.com  ← Usurpation d'identité d'un collègue
Objet : Facture urgente à valider

Bonjour [Votre prénom],

Suite à notre réunion de lundi, pouvez-vous valider
cette facture fournisseur avant ce soir ?

[Facture_2024.pdf.exe]  ← Extension double piégée

Merci,
Pierre Martin
Directeur Financier
```

### 3. Smishing (SMS Phishing)

Phishing par SMS, souvent imitant La Poste, les impôts ou les services de livraison.

```
LA POSTE : Votre colis n°FR847291 est en attente.
Frais de douane : 1,99€
→ http://laposte-livraison.xyz/payer
```

### 4. Vishing (Voice Phishing)

Arnaque par téléphone. L'attaquant se fait passer pour un technicien Microsoft, un conseiller bancaire ou les impôts.

**Script typique :**
> "Bonjour, je vous appelle de Microsoft. Nous avons détecté que votre ordinateur est infecté. Je vais vous guider pour le réparer, j'ai besoin d'accéder à votre ordinateur à distance..."

### 5. Quishing (QR Code Phishing)

De plus en plus répandu. Un faux QR code (sur une affiche, dans un email, sur un parking) redirige vers un site malveillant.

## Comment reconnaître un phishing

### Vérifier l'expéditeur

```
Email légitime  : contact@paypal.com
Email phishing  : contact@paypal.secure-login.com
Email phishing  : paypal-securite@gmail.com
Email phishing  : noreply@paypαl.com  ← α (alpha grec) au lieu de a
```

**Règle :** le domaine réel est ce qui est **juste avant le .com/.fr** — tout ce qui précède est un sous-domaine contrôlé par l'attaquant.

### Analyser les liens

Avant de cliquer, **survolez le lien** avec votre souris pour voir l'URL réelle.

```
Texte affiché  : www.amazon.fr/votre-compte
URL réelle     : http://amazon-fr.connexion-secure.ru/login
                                              ^^
                              Domaine réel = connexion-secure.ru
```

### Les signaux d'alarme universels

| Signal | Explication |
|--------|-------------|
| Urgence extrême | "Agissez dans les 2 heures" |
| Menace | "Compte suspendu / Arrestation imminente" |
| Offre trop belle | "Vous avez gagné 500€" |
| Demande inhabituelle | "Payez en cartes cadeaux" |
| Fautes d'orthographe | Traduction approximative |
| Pièce jointe inattendue | Surtout .exe, .zip, .doc avec macros |
| Demande d'identifiants | Les vrais services ne demandent jamais votre mot de passe par email |

## Techniques avancées des attaquants

### Typosquatting

Enregistrement de domaines proches de l'original :
- `arnazon.com` au lieu de `amazon.com`
- `g00gle.com` au lieu de `google.com`
- `paypa1.com` au lieu de `paypal.com`

### Sites HTTPS frauduleux

```
⚠️ HTTPS ne signifie pas "site sûr" !
HTTPS signifie seulement que la connexion est chiffrée.
Un site de phishing peut très bien avoir un certificat HTTPS valide.
```

### Clone Phishing

L'attaquant copie un email légitime que vous avez déjà reçu et remplace les liens par des liens malveillants.

## Se protéger efficacement

### 1. Authentification à deux facteurs (2FA)

Même si vos identifiants sont volés, le 2FA empêche la connexion sans le second facteur.

```
Sans 2FA : identifiant + mot de passe = accès
Avec 2FA : identifiant + mot de passe + code SMS/TOTP = accès
```

Activez le 2FA sur : email, banque, réseaux sociaux, cloud.

### 2. Gestionnaire de mots de passe

Un gestionnaire (Bitwarden, KeePass) remplit automatiquement vos identifiants **uniquement sur le vrai domaine**. Sur un site de phishing, il ne proposera rien — c'est un signal d'alarme automatique.

### 3. Vérification indépendante

Si vous recevez un email urgent de votre banque, **n'utilisez pas le lien de l'email**. Ouvrez un nouvel onglet et tapez l'URL de votre banque manuellement.

### 4. Signaler les tentatives

```
France : https://www.signal-spam.fr
Europe : https://www.phishing-initiative.eu
Google : Clic droit sur l'email → Signaler le phishing
```

## Que faire si vous avez cliqué ?

```
1. NE SAISISSEZ PAS d'informations si la page est ouverte
         ↓
2. FERMEZ immédiatement l'onglet
         ↓
3. Si vous avez saisi des identifiants :
   → Changez votre mot de passe immédiatement
   → Activez le 2FA
   → Vérifiez les connexions récentes sur votre compte
         ↓
4. Si vous avez saisi des données bancaires :
   → Appelez votre banque immédiatement
   → Faites opposition sur votre carte
         ↓
5. Si vous avez téléchargé un fichier :
   → Ne l'ouvrez pas
   → Lancez un scan antivirus complet
```

## Conclusion

Le phishing mise sur la **précipitation et la peur**. Prenez toujours le temps de vérifier avant d'agir. Demandez-vous : "Est-ce que j'attendais cet email ? Est-ce que ce lien mène bien où il dit ?" Ces quelques secondes de réflexion peuvent vous éviter bien des ennuis.

---
*Prochain article : [Cryptographie : chiffrer ses données](../articles/cryptographie-bases)*
