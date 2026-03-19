/* ============================================================
   Temgus.CyberBlog — generate.js
   Génère une page HTML statique par article dans /pages/
   Utilisation : node generate.js
   ============================================================ */

const fs   = require('fs');
const path = require('path');

const BASE_URL    = 'https://temgus2025.github.io/temgus-cyberblog';
const DATA_FILE   = path.join(__dirname, 'data', 'articles.json');
const OUTPUT_DIR  = path.join(__dirname, 'pages');

// Créer le dossier /pages s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
  console.log('📁 Dossier /pages créé');
}

// Charger les articles
const articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

let count = 0;

articles.forEach(article => {
  const pageUrl    = `${BASE_URL}/pages/${article.id}.html`;
  const articleUrl = `${BASE_URL}/article.html#${article.id}`;
  const ogImage    = `${BASE_URL}/assets/og-image.png`;
  const title      = `${article.titre} — Temgus.CyberBlog`;
  const desc       = article.resume;
  const tags       = article.tags.join(', ');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- ===== SEO ===== -->
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="keywords" content="${tags}, cybersécurité, sécurité informatique">
<meta name="author" content="Temgus">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${pageUrl}">

<!-- ===== OPEN GRAPH (Facebook, LinkedIn) ===== -->
<meta property="og:type" content="article">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Temgus.CyberBlog">
<meta property="article:author" content="Temgus">
<meta property="article:published_time" content="${article.date}">
<meta property="article:tag" content="${tags}">

<!-- ===== TWITTER CARD ===== -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@temgus">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${ogImage}">

<!-- ===== SCHEMA.ORG ===== -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${article.titre}",
  "description": "${desc}",
  "datePublished": "${article.date}",
  "author": {"@type": "Person", "name": "Temgus", "url": "${BASE_URL}/a-propos.html"},
  "publisher": {"@type": "Person", "name": "Temgus"},
  "url": "${pageUrl}",
  "inLanguage": "fr",
  "keywords": "${tags}",
  "timeRequired": "PT${article.lecture}M"
}
</script>

</head>
<body style="background:#060d1a;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:20px;text-align:center;padding:40px">
  <div style="font-size:48px">${article.icone}</div>
  <h1 style="color:#00d4ff;font-size:22px;max-width:600px">${article.titre}</h1>
  <p style="color:#8892a4;max-width:500px">${desc}</p>
  <a href="${articleUrl}" style="background:#00d4ff;color:#060d1a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">
    Lire l'article →
  </a>
</body>
</html>`;

  const filePath = path.join(OUTPUT_DIR, `${article.id}.html`);
  fs.writeFileSync(filePath, html, 'utf-8');
  count++;
  console.log(`✅ ${article.id}.html`);
});

console.log(`\n🎉 ${count} pages générées dans /pages/`);
console.log(`\n📌 Pour partager sur Facebook, utilisez les URLs :`);
console.log(`   ${BASE_URL}/pages/intro-cybersecurite.html`);
console.log(`   ${BASE_URL}/pages/comprendre-reseaux.html`);
console.log(`   etc.\n`);
