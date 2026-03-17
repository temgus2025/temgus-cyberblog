# Introduction à la cybersécurité : les bases essentielles

La cybersécurité est devenue un enjeu majeur dans notre société connectée. Que vous soyez un particulier ou un professionnel, comprendre les bases vous permet de mieux protéger vos données et vos systèmes.

## Qu'est-ce que la cybersécurité ?

La cybersécurité désigne l'ensemble des pratiques, technologies et processus conçus pour **protéger les systèmes informatiques**, les réseaux et les données contre les attaques, les dommages ou les accès non autorisés.

On distingue généralement trois piliers fondamentaux, souvent appelés la **triade CIA** :

- **Confidentialité** : seules les personnes autorisées peuvent accéder aux données
- **Intégrité** : les données ne peuvent pas être modifiées sans autorisation
- **Disponibilité** : les systèmes et données sont accessibles quand on en a besoin

## Les principales menaces

### 1. Les malwares
Les logiciels malveillants (virus, trojans, ransomwares) sont conçus pour infiltrer ou endommager un système à l'insu de l'utilisateur.

### 2. Le phishing
Des emails ou sites frauduleux imitent des entités légitimes pour vous soutirer des informations sensibles comme vos mots de passe ou coordonnées bancaires.

### 3. Les attaques par force brute
Des programmes automatisés testent des milliers de combinaisons pour deviner vos mots de passe.

### 4. Les failles zero-day
Des vulnérabilités inconnues dans des logiciels, exploitées avant que les développeurs puissent publier un correctif.

## Bonnes pratiques essentielles

```bash
# Exemple : vérifier la force d'un mot de passe avec Python
import re

def verifier_mot_de_passe(mdp):
    if len(mdp) < 12:
        return "Trop court"
    if not re.search(r'[A-Z]', mdp):
        return "Manque une majuscule"
    if not re.search(r'[0-9]', mdp):
        return "Manque un chiffre"
    if not re.search(r'[!@#$%^&*]', mdp):
        return "Manque un caractère spécial"
    return "Mot de passe fort ✓"
```

Voici les règles d'or à appliquer dès maintenant :

1. **Utilisez un gestionnaire de mots de passe** (Bitwarden, KeePass)
2. **Activez l'authentification à deux facteurs** (2FA) partout où c'est possible
3. **Mettez à jour régulièrement** vos systèmes et applications
4. **Sauvegardez vos données** selon la règle 3-2-1
5. **Méfiez-vous des liens suspects** dans les emails et SMS

## Conclusion

La cybersécurité n'est pas réservée aux experts. En adoptant quelques réflexes simples, vous réduisez considérablement les risques. Dans les prochains articles, nous plongerons plus profondément dans chaque domaine.

---
*Prochain article : [Comprendre les réseaux](../articles/comprendre-reseaux)*
