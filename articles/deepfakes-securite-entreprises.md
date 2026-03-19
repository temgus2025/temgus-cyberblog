# Deepfakes : la menace invisible pour la sécurité des entreprises

Les deepfakes ne sont plus une curiosité technologique réservée aux laboratoires de recherche. Aujourd'hui accessibles avec un simple ordinateur, ils représentent une menace concrète pour les entreprises, les particuliers et les démocraties.

## Qu'est-ce qu'un deepfake ?

Un deepfake est un contenu synthétique — vidéo, audio ou image — généré par intelligence artificielle pour imiter une personne réelle de façon convaincante. Le terme vient de "deep learning" et "fake".

Les technologies utilisées incluent :
- **GANs** (Generative Adversarial Networks) : deux réseaux neuronaux s'affrontent, l'un générant du contenu, l'autre le critiquant, jusqu'à produire un résultat réaliste
- **Diffusion models** : la technologie derrière Stable Diffusion, DALL-E
- **Voice cloning** : ElevenLabs, Tortoise TTS permettent de cloner une voix avec quelques minutes d'audio

## Les menaces concrètes

### Fraude au président (BEC)
La **Business Email Compromise** évolue vers la "Business Voice Compromise". En 2019, un dirigeant d'une entreprise britannique a transféré 220 000 € après avoir reçu un appel d'un "PDG" dont la voix avait été clonée par IA.

Ces attaques se déroulent ainsi :
1. L'attaquant collecte des enregistrements audio publics (conférences, interviews)
2. Il clone la voix en quelques minutes
3. Il appelle un employé avec accès aux finances
4. L'employé, convaincu de parler à son dirigeant, effectue le virement

### Désinformation et manipulation
Les deepfakes vidéo de personnalités politiques peuvent déclencher des crises diplomatiques ou influencer des élections. En 2022, une fausse vidéo du président ukrainien Zelensky appelant à la capitulation a circulé en ligne.

### Harcèlement et chantage
Les deepfakes pornographiques non consentis touchent principalement les femmes et peuvent servir de levier de chantage ou de harcèlement.

### Contournement de l'authentification biométrique
Des chercheurs ont démontré qu'il est possible de tromper certains systèmes de reconnaissance faciale avec des deepfakes, remettant en cause la fiabilité de la biométrie seule comme facteur d'authentification.

## Comment détecter un deepfake ?

### Indices visuels
- **Clignement des yeux** anormal ou absent
- **Contours du visage** flous ou qui bougent légèrement
- **Éclairage incohérent** entre le visage et l'environnement
- **Artefacts** au niveau des cheveux, oreilles, dents
- **Mouvements de la bouche** légèrement désynchronisés

### Indices audio
- **Respiration** artificielle ou absente
- **Prosodie** légèrement robotique
- **Bruits de fond** incohérents
- **Micro-pauses** inhabituelles

### Outils de détection
- **Microsoft Video Authenticator** : analyse les pixels et détecte les manipulations
- **Deepware Scanner** : outil en ligne gratuit
- **FakeCatcher** d'Intel : détecte les pulsations sanguines dans les vidéos (les deepfakes n'en ont pas)
- **Hive Moderation** : API de détection pour les entreprises

```python
# Exemple d'utilisation d'une API de détection
import requests

def detecter_deepfake(chemin_video):
    with open(chemin_video, 'rb') as f:
        response = requests.post(
            'https://api.deepware.ai/scan',
            files={'video': f},
            headers={'Authorization': 'Bearer YOUR_API_KEY'}
        )
    resultat = response.json()
    return resultat['fake_probability']
```

## Protection pour les entreprises

### Protocoles de vérification
- Établir un **mot de passe de sécurité** verbal pour les demandes urgentes par téléphone
- Imposer une **double validation** (email + appel) pour tout virement supérieur à un seuil défini
- Former les équipes financières à rappeler sur un numéro connu et vérifié

### Authentification renforcée
- Ne jamais utiliser la biométrie seule pour les accès critiques
- Combiner reconnaissance faciale + PIN + token physique (FIDO2)

### Sensibilisation des équipes
- Former les employés à identifier les deepfakes
- Simuler des attaques deepfake pour tester la vigilance
- Créer une procédure claire de signalement

## Le cadre légal

En France, créer un deepfake non consenti est punissable :
- **Usurpation d'identité** : article 226-4-1 du Code pénal (1 an, 15 000 €)
- **Atteinte à la vie privée** : article 226-1 (1 an, 45 000 €)
- **Diffamation** si le contenu nuit à la réputation

## Conclusion

Les deepfakes représentent une évolution majeure des menaces d'ingénierie sociale. La meilleure défense reste la combinaison de sensibilisation humaine, de protocoles de vérification rigoureux et d'outils de détection automatisés. Dans un monde où "voir" ne signifie plus "croire", la vérification devient une compétence essentielle.
