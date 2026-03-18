# Cryptomonnaies et sécurité : protéger vos actifs numériques

Le marché des cryptomonnaies a perdu plus de **3 milliards de dollars** en hacks et arnaques en 2023. Bitcoin, Ethereum, DeFi — les actifs numériques attirent autant les investisseurs que les cybercriminels. Ce guide couvre les menaces spécifiques aux cryptos et comment sécuriser vos fonds.

## Les menaces spécifiques aux cryptomonnaies

### Irréversibilité des transactions

```
Banque traditionnelle :
Transaction frauduleuse → Contestation → Remboursement possible

Cryptomonnaies :
Transaction frauduleuse → IRRÉVOCABLE
"Not your keys, not your coins"

Si quelqu'un accède à votre wallet → Vos fonds sont perdus pour toujours
Aucun service client, aucun recours légal efficace
```

### Types d'attaques

```
Vol de clé privée :
→ Malware keylogger vole votre seed phrase
→ Phishing sur un faux exchange
→ Hack d'exchange centralisé (Mt. Gox, FTX, Binance)

Smart Contract exploits :
→ Failles dans le code Ethereum/Solidity
→ Flash loan attacks (manipulation de prix en une transaction)
→ Reentrancy attacks (The DAO hack - 60M$ en 2016)

Arnaques (scams) :
→ Rug pulls (projet qui disparaît avec les fonds)
→ Pump and dump (manipulation de prix)
→ Faux airdrops (vider le wallet en signant un contrat malveillant)
→ Romance scams crypto ("pig butchering")
```

## Comprendre les clés cryptographiques

```python
# Anatomie d'un wallet crypto

# 1. Seed phrase (mnémonique BIP39) - LA CLÉ MAÎTRESSE
seed_phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
# 12 ou 24 mots générés aléatoirement
# TOUTE votre fortune crypto dépend de ces mots
# Quiconque a ces mots a accès à TOUS vos fonds

# 2. Clé privée (dérivée du seed)
cle_privee = "0x4c0883a69102937d6231471b5dbb6e538eba2ef0..."
# 256 bits d'entropie
# Sert à signer les transactions

# 3. Clé publique (dérivée de la clé privée)
# Adresse publique (ce que vous partagez pour recevoir des fonds)
adresse_bitcoin  = "1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf..."
adresse_ethereum = "0x742d35Cc6634C0532925a3b8D4C9fF..."

# La clé privée → clé publique est à sens unique (impossible à inverser)
# C'est l'asymétrie cryptographique en action
```

## Types de wallets et leur sécurité

### Hot Wallets (connectés à Internet)

```
Exchange centralisé (Binance, Coinbase) :
→ Le plus pratique mais le MOINS sécurisé
→ "Not your keys, not your coins"
→ Si l'exchange est hacké → vous perdez tout
→ Réservé aux sommes que vous tradez activement

Wallet logiciel (MetaMask, Phantom) :
→ Vous contrôlez vos clés
→ Vulnérable aux malwares sur votre ordinateur
→ Acceptable pour de petites sommes
→ JAMAIS pour votre épargne principale
```

### Cold Wallets (hors ligne) - Recommandé

```
Hardware Wallet (Ledger, Trezor) :
→ Clés privées générées et stockées HORS LIGNE
→ Les clés ne quittent jamais l'appareil
→ Transaction signée en interne, sans exposer la clé
→ Coût : 50-150€ → INDISPENSABLE si vous détenez des crypto

Paper Wallet :
→ Clé privée imprimée sur papier
→ Gratuit mais fragile (eau, feu, perte)
→ Génération sur ordinateur air-gapped (jamais connecté)
```

## Sécuriser votre hardware wallet

```
✅ Acheter UNIQUEMENT depuis le site officiel ou revendeurs agréés
   → Jamais sur Amazon, eBay ou occasion
   → Les wallets pré-initialisés sont piégés

✅ Vérifier l'intégrité du packaging à la réception
   → Hologrammes anti-falsification intacts
   → Seed phrase VIERGE (jamais préremplie)

✅ Générer le seed phrase VOUS-MÊME lors de l'initialisation
   → Le Ledger/Trezor génère ses propres mots
   → N'utilisez JAMAIS un seed phrase fourni par quelqu'un

✅ Sauvegarder le seed phrase de façon sécurisée
   → Écrire sur papier, jamais sur téléphone/ordinateur
   → Copie dans un coffre-fort ou chez un notaire
   → Plaque en acier inoxydable pour résister au feu (Cryptosteel)

✅ Ne JAMAIS entrer le seed phrase en ligne
   → Aucun site légitime ne vous demandera votre seed phrase
   → C'est TOUJOURS une arnaque
```

## Les arnaques crypto les plus courantes

### Faux support Ledger/MetaMask

```
Scénario :
Votre MetaMask bug → Vous cherchez de l'aide sur Google
→ Le premier résultat est une pub Google "Support MetaMask officiel"
→ Le "support" vous demande votre seed phrase "pour vérifier"
→ Vos fonds disparaissent en secondes

Règle absolue :
Aucun support légitime ne vous demandera jamais votre seed phrase.
JAMAIS. SOUS AUCUN PRÉTEXTE.
```

### Approval scams (Smart Contract malveillants)

```javascript
// Vous signez un contrat qui semble inoffensif
// "Mint gratuit de NFT" ou "Claim votre airdrop"

// Le contrat contient en réalité :
{
  "type": "ERC20 Approve",
  "spender": "0xAttaquant...",
  "amount": "115792089237316195423570985008687907853269984665640564039457584007913129639935"
  // = uint256 max = accès ILLIMITÉ à tous vos tokens
}

// L'attaquant peut maintenant vider votre wallet à tout moment

// Protection : vérifier les approbations avec revoke.cash
// Révoquer les approbations suspectes
```

### Pig Butchering (romance scam crypto)

```
Schéma sur 3-6 mois :

1. Contact sur réseau social / app de rencontre
2. Construction d'une relation de confiance
3. Mention "par hasard" de succès en crypto trading
4. Invitation sur une "plateforme exclusive" (fausse)
5. Premiers gains affichés (fictifs)
6. Demande de dépôts croissants
7. Au moment du retrait : "taxe de déblocage" requise
8. Disparition avec tout l'argent

Pertes moyennes : 120 000$ par victime selon le FBI
Total mondial 2023 : 3,96 milliards de dollars
```

## Sécurité des exchanges

```python
# Bonnes pratiques sur un exchange centralisé

# 1. Activer le 2FA avec application TOTP (jamais SMS)
# Aegis (Android) ou Raivo (iOS)

# 2. Whitelist des adresses de retrait
# Seules les adresses pré-approuvées peuvent recevoir des retraits
# Un hacker ne peut pas retirer vers son wallet

# 3. Délai de retrait (anti-hack)
# Configurer un délai de 24-48h pour les nouvelles adresses

# 4. Ne jamais laisser de grosses sommes sur un exchange
# "If it's not your keys, it's not your coins"
# Règle : garder sur exchange uniquement ce que vous tradez activement

# 5. Vérifier les adresses caractère par caractère
# Les malwares remplacent l'adresse dans le presse-papier
# Clipboard hijacking : vous copiez 0xABCD... → malware remplace par 0xEVIL...
```

## OpSec crypto

```
Anonymat financier :

Bitcoin N'EST PAS anonyme :
→ Toutes les transactions sont publiques sur la blockchain
→ Les exchanges ont votre KYC (identité vérifiée)
→ Chainalysis et autres firmes tracent les flux
→ Bitcoin est PSEUDONYME, pas anonyme

Pour plus de confidentialité :
→ Monero (XMR) : transactions privées by design
→ Zcash (ZEC) : transactions shieldées optionnelles
→ Bitcoin CoinJoin : mixer les UTXOs pour briser le traçage

Attention au doxing financier :
→ Ne jamais partager publiquement votre adresse principale
→ Générer une nouvelle adresse pour chaque réception (HD wallet)
→ Ne pas lier votre identité réelle à vos adresses publiques
```

## En cas de hack

```
Si vous êtes hacké :

1. AGIR DANS LES SECONDES qui suivent
   → Les attaquants ont des bots qui vident les wallets automatiquement

2. Transférer les fonds restants vers un wallet sain
   → Utilisez un autre appareil non compromis
   → Votre ordinateur actuel est peut-être encore infecté

3. Révoquer toutes les approbations de smart contracts
   → revoke.cash (Ethereum)
   → Les attaquants peuvent avoir des approbations infinies

4. Changer TOUS les mots de passe et 2FA
   → Sur un appareil propre

5. Analyser comment c'est arrivé
   → Phishing ? Malware ? Clé privée exposée ?
   → Pour ne pas répéter l'erreur

6. Signaler
   → IC3 (FBI) si vous êtes aux USA
   → Police nationale + ANSSI en France
   → Peu de chances de récupérer, mais ça aide les enquêtes
```

## Conclusion

La sécurité crypto repose sur un principe simple : **gardez vos clés privées hors ligne et secrètes**. Un hardware wallet + une seed phrase correctement sauvegardée protègent contre la grande majorité des attaques. N'entrez JAMAIS votre seed phrase en ligne, vérifiez toujours les contrats que vous signez et méfiez-vous de toute opportunité "trop belle pour être vraie".