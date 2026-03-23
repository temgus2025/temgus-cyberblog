# Carrière en cybersécurité : guide complet pour se lancer

La cybersécurité est l'un des secteurs les plus porteurs du numérique avec **3,5 millions de postes non pourvus** dans le monde en 2024. Que vous soyez étudiant, en reconversion ou professionnel IT souhaitant se spécialiser, ce guide vous donne une feuille de route claire.

## Le marché de l'emploi en cybersécurité

```
Chiffres clés 2024 :
→ 3,5 millions de postes non pourvus mondialement
→ Salaire médian France : 48 000€/an (junior)
→ Salaire médian France : 70 000€/an (confirmé 5 ans)
→ Salaire médian France : 90 000€+/an (expert 10 ans)
→ Taux de chômage du secteur : quasi nul

Secteurs qui recrutent le plus :
→ ESN/SSII (Capgemini, Thales, Sopra)
→ Banque/Finance (BNP, Société Générale)
→ Défense (Thalès, Airbus, MBDA)
→ Cabinets de conseil (Wavestone, Deloitte)
→ Éditeurs de sécurité (Orange Cyberdefense, Sekoia)
→ Startups cybersécurité
```

## Les métiers de la cybersécurité

```python
metiers_cyber = {

    # OFFENSIF
    "Pentester / Ethical Hacker": {
        "missions": "Tests d'intrusion, audits de sécurité",
        "salaire_junior": "38-45K€",
        "salaire_senior": "60-85K€",
        "certifications": ["OSCP", "CEH", "GPEN"],
        "compétences": ["Kali Linux", "Burp Suite", "Metasploit"]
    },
    "Red Team Operator": {
        "missions": "Simulation d'APT, exercices Red Team",
        "salaire_junior": "45-55K€",
        "salaire_senior": "70-100K€",
        "certifications": ["CRTO", "CRTE", "OSED"],
        "compétences": ["Cobalt Strike", "C2 development", "AD attacks"]
    },
    "Bug Bounty Hunter": {
        "missions": "Recherche de vulnérabilités en indépendant",
        "revenus": "Variable (0 à 500K€/an pour les meilleurs)",
        "certifications": ["Aucune obligatoire"],
        "compétences": ["Web hacking", "API testing", "Recon"]
    },

    # DÉFENSIF
    "Analyste SOC": {
        "missions": "Surveillance, triage d'alertes, investigation",
        "salaire_junior": "32-40K€",
        "salaire_senior": "50-65K€",
        "certifications": ["BTL1", "Security+", "CySA+"],
        "compétences": ["SIEM", "EDR", "Threat intel"]
    },
    "Incident Responder / DFIR": {
        "missions": "Réponse aux incidents, forensics",
        "salaire_junior": "42-50K€",
        "salaire_senior": "65-90K€",
        "certifications": ["GCIH", "GCFE", "GCFA"],
        "compétences": ["Volatility", "Autopsy", "Malware analysis"]
    },
    "RSSI (Responsable Sécurité SI)": {
        "missions": "Stratégie sécurité, gouvernance, conformité",
        "salaire": "80-150K€",
        "certifications": ["CISSP", "CISM"],
        "compétences": ["Management", "Risque", "RGPD", "ISO 27001"]
    },

    # TECHNIQUE/TRANSVERSE
    "DevSecOps Engineer": {
        "missions": "Intégrer sécurité dans CI/CD",
        "salaire_junior": "45-55K€",
        "salaire_senior": "70-95K€",
        "certifications": ["AWS Security", "CKS (Kubernetes)"],
        "compétences": ["Docker", "Kubernetes", "SAST/DAST", "IaC"]
    },
    "Threat Intelligence Analyst": {
        "missions": "Renseignement sur les menaces, profiling APT",
        "salaire_junior": "40-50K€",
        "salaire_senior": "60-80K€",
        "certifications": ["GCTI", "CPTIA"],
        "compétences": ["MISP", "MITRE ATT&CK", "OSINT"]
    }
}
```

## Formations et certifications

### Certifications par niveau

```
Débutant :
→ CompTIA Security+    : 300$, examen QCM, reconnu globalement
→ BTL1 (Blue Team Labs): Pratique, très bien pour SOC
→ eJPT (eLearnSecurity): Pentest débutant, accessible

Intermédiaire :
→ OSCP (Offensive Security) : LA certification pentest
→ CEH (EC-Council)          : Très connu mais critiqué (QCM)
→ CySA+ (CompTIA)           : Blue team intermédiaire
→ GCIH (GIAC)               : Incident handling

Avancé :
→ CRTO (Red Team Ops)  : Active Directory, Cobalt Strike
→ OSED (Exploit Dev)   : Développement d'exploits
→ CISSP                : Management sécurité (7-10 ans exp)
→ CISM                 : Management sécurité

Spécialisées :
→ AWS Certified Security Specialty
→ CKS (Certified Kubernetes Security)
→ GREM (Reverse Engineering Malware)
```

### Formations gratuites en ligne

```
Pratique :
→ TryHackMe (tryhackme.com)    : Parfait pour débutants
→ HackTheBox (hackthebox.com)  : Intermédiaire/avancé
→ PortSwigger Academy          : Web hacking complet
→ Blue Team Labs Online        : Défensif
→ Cybrary (cybrary.it)         : Cours vidéo

Théorique :
→ MOOC SecNum (ANSSI)          : Gratuit, certifié, français
→ Coursera IBM Cybersecurity   : Gratuit en audit
→ MIT OpenCourseWare           : Network Security

CTF :
→ CTFtime.org                  : Calendrier des compétitions
→ PicoCTF                      : Parfait pour débutants
→ Root-Me                      : Français, très complet
```

## Feuille de route par profil

```
Profil : Reconversion (aucune base IT)
Durée : 18-24 mois

Mois 1-3 : Fondamentaux
→ Réseaux (TCP/IP, DNS, HTTP)
→ Linux (commandes, permissions, scripts bash)
→ Programmation Python (bases)
→ Ressource : TryHackMe Pre-Security path

Mois 4-6 : Sécurité générale
→ MOOC SecNum de l'ANSSI (gratuit)
→ CompTIA Security+ (optionnel)
→ TryHackMe SOC Level 1

Mois 7-12 : Spécialisation
→ Choisir offensif (OSCP) ou défensif (BTL1)
→ HackTheBox / Blue Team Labs
→ Premiers CTF

Mois 13-18 : Certification + portfolio
→ Passer la certification choisie
→ Construire un portfolio (projets GitHub, writeups CTF)
→ Stage / alternance

Mois 18-24 : Premier emploi
→ Candidatures ciblées
→ LinkedIn optimisé
→ Participer aux événements (Forum InCyber, SSI Hebdo)
```

## Construire son portfolio

```
Ce qui impressionne un recruteur :

1. Blog technique (comme Temgus.CyberBlog !)
→ Writeups de CTF
→ Articles techniques
→ Démos de vulnérabilités

2. GitHub actif
→ Scripts d'automatisation sécurité
→ Tools de pentest maison
→ Configurations de sécurité

3. Certifications
→ OSCP sur le CV = entretien garanti
→ Certification pratique > QCM

4. Participation communautaire
→ Compétitions CTF (CTFtime)
→ Bug bounty (même les petits)
→ Contributions open source
→ Conférences (SSTIC, LeHack, Forum InCyber)

5. Home Lab
→ Créer un lab AD avec vulnerable machines
→ Documenter et partager
```

## Conclusion

La cybersécurité est un domaine où la **pratique prime sur le diplôme**. Un candidat avec OSCP, un blog actif et 50 machines HackTheBox compromises sera souvent préféré à un candidat avec un Master mais sans pratique. Commencez dès aujourd'hui sur TryHackMe ou Root-Me, construisez un portfolio visible et rejoignez la communauté — les opportunités viendront naturellement.

---
*Catégorie : Carrière en cybersécurité*
