# Stéganographie : l'art de cacher des données dans les fichiers

La stéganographie est l'art de **dissimuler un message dans un support apparemment anodin** — une image, un fichier audio, une vidéo. Contrairement à la cryptographie qui rend un message illisible, la stéganographie cache son existence même. Utilisée depuis l'antiquité, elle est aujourd'hui employée par les cybercriminels, les espions et les militants des droits de l'homme.

## Stéganographie vs Cryptographie

```
Cryptographie :
Message visible → ILLISIBLE
"Réunion à 15h" → "kR8#mP2nL5"
→ Tout le monde SAIT qu'il y a un message, mais ne peut pas le lire

Stéganographie :
Message → INVISIBLE dans un support anodin
"Réunion à 15h" → [photo d'un chat tout à fait normale]
→ Personne ne sait qu'il y a un message caché

Steganocryptographie (combinaison) :
Message chiffré → caché dans une image
→ Protection maximale
```

## Techniques de stéganographie numérique

### LSB — Least Significant Bit

La technique la plus courante pour les images.

```python
# Principe LSB : modifier le bit le moins significatif de chaque pixel
# Un pixel RGB = 3 octets (Rouge, Vert, Bleu)
# Le LSB = le bit de poids faible = modification imperceptible à l'œil

# Pixel original : Rouge = 11001010 = 202
# Pixel modifié  : Rouge = 11001011 = 203  (différence de 1/255 ≈ 0.4%)
# Imperceptible !

# Chaque pixel peut stocker 3 bits (1 par canal RGB)
# Une image 1920×1080 = 2 073 600 pixels × 3 bits = 777 600 octets ≈ 760 Ko de données cachées !

def encode_lsb(image_path, message, output_path):
    from PIL import Image
    import numpy as np

    img = Image.open(image_path).convert('RGB')
    pixels = np.array(img)

    # Convertir le message en bits
    message_bytes = message.encode('utf-8') + b'\x00\x00\x00'  # Marqueur de fin
    bits = ''.join(format(byte, '08b') for byte in message_bytes)

    flat = pixels.flatten().copy()

    if len(bits) > len(flat):
        raise ValueError("Message trop grand pour cette image")

    # Injecter les bits dans les LSB
    for i, bit in enumerate(bits):
        flat[i] = (flat[i] & 0xFE) | int(bit)  # Remplace le LSB
        # 0xFE = 11111110 → efface le LSB
        # | int(bit) → met le bit du message

    modified = flat.reshape(pixels.shape)
    Image.fromarray(modified.astype(np.uint8)).save(output_path, 'PNG')
    print(f"Message caché dans {output_path}")

def decode_lsb(image_path, message_length):
    from PIL import Image
    import numpy as np

    img = Image.open(image_path).convert('RGB')
    flat = np.array(img).flatten()

    # Extraire les LSB
    bits = ''.join(str(pixel & 1) for pixel in flat)

    # Reconvertir en bytes
    chars = []
    for i in range(0, message_length * 8, 8):
        byte = bits[i:i+8]
        chars.append(chr(int(byte, 2)))

    return ''.join(chars)

# Démonstration
encode_lsb('chat.png', 'Réunion secrète à 15h salle B', 'chat_modifie.png')
message = decode_lsb('chat_modifie.png', 30)
print(f"Message extrait : {message}")
```

### Steghide — Outil classique

```bash
# Installer steghide
sudo apt install steghide

# Cacher un fichier dans une image JPEG
steghide embed -cf photo.jpg -sf secret.txt -p "motdepasse"
# -cf : cover file (l'image)
# -sf : secret file (le fichier à cacher)
# -p  : mot de passe

# Extraire le fichier caché
steghide extract -sf photo.jpg -p "motdepasse"

# Voir les informations sans extraire
steghide info photo.jpg
```

### Stéganalyse avec StegDetect

```bash
# Détecter la présence de stéganographie dans une image
# StegDetect cherche les signatures statistiques

stegdetect -t p photo.jpg
# -t p : teste spécifiquement JSteg, JPHide, Invisible Secrets

# Analyse statistique avec zsteg (PNG et BMP)
gem install zsteg
zsteg image.png
zsteg -a image.png  # Tous les tests

# Analyse avec binwalk
binwalk -e image.png  # Extraire les fichiers embarqués
binwalk --dd='.*' image.png  # Extraire tout
```

## Stéganographie avancée

### Audio stéganographie

```python
# Cacher des données dans un fichier WAV
import wave, struct

def hide_in_audio(audio_file, message, output_file):
    with wave.open(audio_file, 'rb') as audio:
        frames = bytearray(audio.readframes(audio.getnframes()))
        params = audio.getparams()

    message_bits = ''.join(format(ord(c), '08b') for c in message) + '1111111111111110'

    for i, bit in enumerate(message_bits):
        frames[i] = (frames[i] & 0xFE) | int(bit)

    with wave.open(output_file, 'wb') as out:
        out.setparams(params)
        out.writeframes(bytes(frames))

# Stéganographie dans la phase du signal audio (plus résistante)
# OpenStego, DeepSound, SilentEye
```

### Stéganographie réseau

```python
# Cacher des données dans des paquets réseau
# Covert channels : communication cachée dans le trafic légitime

# TCP Timestamp Covert Channel
# Le champ timestamp de TCP peut transmettre des données

# ICMP Covert Channel
# Les octets de payload des pings peuvent contenir des messages
import subprocess

def icmp_covert_send(target, message):
    """Envoie un message caché dans des pings"""
    for char in message:
        # Mettre le caractère dans le payload ICMP
        payload = f"{'A' * 16}{char}{'A' * 15}"  # 32 octets avec le char au milieu
        subprocess.run(['ping', '-c', '1', '-p',
                       payload.encode().hex(), target],
                      capture_output=True)

# DNS Covert Channel (utilisé par les malwares pour exfiltrer)
# Les données sont encodées dans les noms de domaine DNS
# "dGhpcyBpcyBhIHRlc3Q=.evil.com" (base64 dans sous-domaine)
```

## Stéganographie dans les documents

```python
# Stéganographie dans les fichiers Office/PDF

# Technique "Zero-Width Characters" (caractères invisibles)
# Encoder un message binaire avec des caractères Unicode invisibles
ZERO_WIDTH_SPACE = '\u200b'      # bit 0
ZERO_WIDTH_NON_JOINER = '\u200c' # bit 1

def encode_in_text(cover_text, secret_message):
    """Cache un message dans du texte avec des caractères invisibles"""
    binary_message = ''.join(format(ord(c), '08b') for c in secret_message)

    hidden_chars = ''.join(
        ZERO_WIDTH_SPACE if bit == '0' else ZERO_WIDTH_NON_JOINER
        for bit in binary_message
    )

    # Insérer au milieu du texte couverture
    mid = len(cover_text) // 2
    return cover_text[:mid] + hidden_chars + cover_text[mid:]

cover = "Cette photo de vacances est magnifique, le soleil était au rendez-vous."
stego_text = encode_in_text(cover, "Opération Soleil: J+3")
# Le texte semble identique mais contient 22 caractères invisibles
```

## Utilisations réelles

### Usages légitimes

```
Watermarking (tatouage numérique) :
→ Protéger les droits d'auteur des images/vidéos
→ Prouver la propriété d'un contenu
→ Tracer les fuites (canary documents)

Communications sécurisées :
→ Journalistes et sources dans des pays autoritaires
→ WhatsApp utilise la stéganographie pour les messages "disappearing"
→ Militants des droits de l'homme

Forensique :
→ Cacher des métadonnées d'attribution
→ Preuves numériques inaltérables
```

### Utilisations malveillantes

```
Malwares stéganographiques :
→ Sunburst (SolarWinds 2020) : commandes C2 cachées dans des images
→ Zloader : charges malveillantes dans des PDFs
→ APT29 (Cozy Bear) : communications C2 via images sur Instagram

Exfiltration de données :
→ Données sensibles cachées dans des images envoyées par email
→ Contourne les DLP (Data Loss Prevention)
→ Exemple : 1000 mots de passe dans une photo de vacances

CTF (Capture The Flag) :
→ Les CTF adorent la stéganographie
→ Flags cachés dans des images, audio, vidéo
```

## Outils stéganographie

```bash
# Pour cacher
steghide    # JPEG, BMP, WAV, AU
OpenStego   # PNG (interface graphique)
SilentEye   # BMP, JPEG, WAV (interface graphique)
snow        # Espaces blancs dans le texte

# Pour détecter / analyser (stéganalyse)
stegdetect  # JPEG (détection statistique)
zsteg       # PNG, BMP
binwalk     # Fichiers embarqués dans les binaires
foremost    # Récupération forensique
exiftool    # Métadonnées (souvent des données cachées là)

# En Python
from stegano import lsb
secret = lsb.hide("cover.png", "Mon message secret")
secret.save("output.png")
message = lsb.reveal("output.png")
```

## Détecter la stéganographie

```python
# Analyse statistique pour détecter le LSB stego
import numpy as np
from PIL import Image

def detect_lsb_stego(image_path):
    img = np.array(Image.open(image_path).convert('RGB'))

    # Extraire les LSBs
    lsbs = img.flatten() & 1

    # Dans une image naturelle, les LSBs suivent une distribution pseudo-aléatoire
    # Dans une image stégo, la distribution est plus uniforme (50/50)
    ones_ratio = np.sum(lsbs) / len(lsbs)

    print(f"Ratio de 1 dans les LSBs : {ones_ratio:.3f}")
    if 0.45 < ones_ratio < 0.55:
        print("⚠️  Distribution suspecte - Possible stéganographie LSB")
    else:
        print("✅ Distribution normale - Probablement pas de stégo LSB")

detect_lsb_stego("image_suspecte.png")
```

## Conclusion

La stéganographie illustre que la sécurité ne se limite pas au visible — les données cachées peuvent être aussi dangereuses que les données chiffrées. Pour les défenseurs, les outils DLP modernes intègrent de plus en plus la détection stéganographique. Pour les curieux et les CTF players, c'est un domaine fascinant qui mêle mathématiques, perception humaine et créativité.