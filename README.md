# Temgus.CyberBlog — Structure du projet

## 📁 Arborescence

```
temgus-cyberblog/
│
├── index.html              ← Page d'accueil principale
├── article.html            ← Page de lecture d'un article (Phase 3)
├── a-propos.html           ← Page à propos
│
├── css/
│   └── style.css           ← Feuille de style principale
│
├── js/
│   └── app.js              ← Logique JS (chargement articles, filtres, recherche)
│
├── data/
│   └── articles.json       ← Métadonnées de tous les articles ✏️ ÉDITER ICI
│
├── articles/               ← Contenu des articles en Markdown
│   ├── intro-cybersecurite.md
│   ├── comprendre-reseaux.md
│   └── ...
│
└── README.md
```

## 🚀 Lancer en local

### Option 1 — Extension VSCode (recommandée)
1. Installer l'extension **Live Server** dans VSCode
2. Clic droit sur `index.html` → **Open with Live Server**
3. Le site s'ouvre sur `http://127.0.0.1:5500`

> ⚠️ Ne pas ouvrir `index.html` directement dans le navigateur (file://)
> car `fetch()` est bloqué par les navigateurs sans serveur HTTP.

### Option 2 — Python (si installé)
```bash
cd temgus-cyberblog
python -m http.server 8000
# Ouvrir http://localhost:8000
```

### Option 3 — Node.js
```bash
npx serve .
```

## ✏️ Ajouter un article

1. **Créer le fichier Markdown** dans `articles/` :
   ```
   articles/mon-nouvel-article.md
   ```

2. **Ajouter l'entrée dans `data/articles.json`** :
   ```json
   {
     "id": "mon-nouvel-article",
     "titre": "Titre de l'article",
     "resume": "Courte description...",
     "categorie": "Sécurité réseau",
     "tags": ["tag1", "tag2"],
     "niveau": "Débutant",
     "date": "2025-04-01",
     "lecture": 5,
     "icone": "🔒",
     "featured": false,
     "fichier": "articles/mon-nouvel-article.md"
   }
   ```

3. **C'est tout !** L'article apparaît automatiquement sur le site.

## 🌐 Déployer sur GitHub Pages

1. Créer un repo GitHub : `temgus-cyberblog`
2. Push tous les fichiers :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/VOTRE_USER/temgus-cyberblog.git
   git push -u origin main
   ```
3. Sur GitHub → Settings → Pages → Source: **main / root**
4. Votre site est en ligne sur : `https://VOTRE_USER.github.io/temgus-cyberblog/`

## 📦 Prochaines étapes (Phase 2 & 3)

- [ ] `article.html` — page de lecture avec rendu Markdown (marked.js)
- [ ] Coloration syntaxique du code (highlight.js)
- [ ] Router simple pour la navigation par URL
- [ ] Mode sombre/clair toggle
- [ ] Pagination des articles
