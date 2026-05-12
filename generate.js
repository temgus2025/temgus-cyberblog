/* ============================================================
   Temgus.CyberBlog — generate.js (v2 — SEO complet)
   Génère une page HTML statique COMPLÈTE par article dans /pages/
   Le contenu Markdown est intégré directement dans le HTML
   → Google peut indexer chaque article individuellement
   Utilisation : node generate.js
   ============================================================ */

const fs   = require('fs');
const path = require('path');

const BASE_URL     = 'https://temgus2025.github.io/temgus-cyberblog';
const DATA_FILE    = path.join(__dirname, 'data', 'articles.json');
const ARTICLES_DIR = path.join(__dirname, 'articles');
const OUTPUT_DIR   = path.join(__dirname, 'pages');

// ── Convertisseur Markdown → HTML (sans dépendance externe) ──────────────────
function markdownToHtml(md) {
  if (!md) return '';
  let html = md;

  // Blocs de code ```lang\n...\n```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();
    const cls = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${cls}>${escaped}</code></pre>`;
  });

  // Code inline `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Titres
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm,  '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm,   '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm,    '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm,     '<h1>$1</h1>');

  // Gras + italique
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g,         '<em>$1</em>');

  // Listes non ordonnées
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  // Corriger les <ul> imbriqués consécutifs
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Listes ordonnées
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Liens
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Paragraphes (lignes non-HTML)
  const lines = html.split('\n');
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { result.push(''); continue; }
    const isBlock = /^<(h[1-6]|ul|ol|li|pre|blockquote|div|p)/.test(trimmed);
    result.push(isBlock ? trimmed : `<p>${trimmed}</p>`);
  }
  html = result.join('\n');

  // Nettoyer <p> autour des balises block
  html = html.replace(/<p>(<(?:h[1-6]|ul|ol|li|pre)[^>]*>)/g, '$1');
  html = html.replace(/(<\/(?:h[1-6]|ul|ol|li|pre)>)<\/p>/g, '$1');

  return html;
}

// ── Générer la table des matières depuis le Markdown ─────────────────────────
function generateToc(md) {
  const headings = [];
  const lines = md.split('\n');
  for (const line of lines) {
    const m2 = line.match(/^## (.+)$/);
    const m3 = line.match(/^### (.+)$/);
    if (m2) {
      const text = m2[1].trim();
      const id   = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ level: 2, text, id });
    } else if (m3) {
      const text = m3[1].trim();
      const id   = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ level: 3, text, id });
    }
  }
  if (!headings.length) return '';
  const items = headings.map(h => {
    const indent = h.level === 3 ? ' style="padding-left:16px;font-size:13px"' : '';
    return `<li${indent}><a href="#${h.id}">${h.text}</a></li>`;
  }).join('\n');
  return `<ul class="toc-list">${items}</ul>`;
}

// ── Ajouter des IDs sur les titres dans le HTML ───────────────────────────────
function addHeadingIds(html) {
  return html.replace(/<h([23])>([^<]+)<\/h\1>/g, (_, level, text) => {
    const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
}

// ── Échapper les caractères spéciaux pour JSON/HTML attr ─────────────────────
function escape(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Créer le dossier /pages s'il n'existe pas ────────────────────────────────
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
  console.log('📁 Dossier /pages créé');
}

// ── Charger les articles ──────────────────────────────────────────────────────
const articles = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
let count = 0;
let errors = 0;

// ── Générer chaque page ───────────────────────────────────────────────────────
articles.forEach((article, index) => {
  const pageUrl    = `${BASE_URL}/pages/${article.id}.html`;
  const articleUrl = `${BASE_URL}/article.html#${article.id}`;
  const ogImage    = `${BASE_URL}/assets/og-image.png`;
  const title      = escape(`${article.titre} — Temgus.CyberBlog`);
  const desc       = escape(article.resume);
  const tags       = (article.tags || []).join(', ');

  // Lire le fichier Markdown
  const mdFile = path.join(ARTICLES_DIR, `${article.id}.md`);
  let contentHtml = '';
  let tocHtml     = '';

  if (fs.existsSync(mdFile)) {
    const mdRaw  = fs.readFileSync(mdFile, 'utf-8');
    tocHtml      = generateToc(mdRaw);
    contentHtml  = addHeadingIds(markdownToHtml(mdRaw));
  } else {
    // Pas de fichier Markdown → contenu minimal mais correct (évite Soft 404)
    contentHtml = `<p>${article.resume}</p>`;
    console.warn(`  ⚠️  Markdown manquant : ${article.id}.md`);
  }

  // Articles précédent / suivant
  const prev = index > 0 ? articles[index - 1] : null;
  const next = index < articles.length - 1 ? articles[index + 1] : null;
  const prevLink = prev
    ? `<a href="${BASE_URL}/pages/${prev.id}.html" class="nav-prev">← ${escape(prev.titre)}</a>`
    : '';
  const nextLink = next
    ? `<a href="${BASE_URL}/pages/${next.id}.html" class="nav-next">${escape(next.titre)} →</a>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- ===== GOOGLE ANALYTICS ===== -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CRVR89FWBH"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-CRVR89FWBH');
</script>

<!-- ===== SEO ===== -->
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="keywords" content="${tags}, cybersécurité, sécurité informatique">
<meta name="author" content="Temgus">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${pageUrl}">

<!-- ===== OPEN GRAPH ===== -->
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
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${ogImage}">

<!-- ===== SCHEMA.ORG ===== -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${escape(article.titre)}",
  "description": "${desc}",
  "datePublished": "${article.date}",
  "author": {"@type": "Person", "name": "Derrick Temgoua", "url": "${BASE_URL}/a-propos.html"},
  "publisher": {"@type": "Person", "name": "Derrick Temgoua"},
  "url": "${pageUrl}",
  "inLanguage": "fr",
  "keywords": "${tags}",
  "timeRequired": "PT${article.lecture || 5}M",
  "image": "${ogImage}"
}
</script>

<!-- ===== STYLES ===== -->
<link rel="stylesheet" href="../css/style.css">
<link rel="stylesheet" href="../css/article.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">

<style>
  /* Styles spécifiques aux pages statiques */
  .static-article-layout {
    max-width: 860px;
    margin: 100px auto 60px;
    padding: 0 24px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #c9d1d9;
    line-height: 1.8;
  }
  .static-article-layout h1 {
    color: #00d4ff;
    font-size: 2rem;
    margin-bottom: 12px;
  }
  .static-article-layout h2 {
    color: #00d4ff;
    font-size: 1.4rem;
    margin-top: 40px;
    border-left: 3px solid #00d4ff;
    padding-left: 12px;
  }
  .static-article-layout h3 {
    color: #7ee787;
    font-size: 1.1rem;
    margin-top: 24px;
  }
  .static-article-layout p { margin: 12px 0; }
  .static-article-layout ul, .static-article-layout ol {
    padding-left: 24px;
    margin: 12px 0;
  }
  .static-article-layout li { margin: 6px 0; }
  .static-article-layout pre {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 20px 0;
  }
  .static-article-layout code {
    background: #161b22;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #e6edf3;
  }
  .static-article-layout pre code {
    background: none;
    padding: 0;
  }
  .static-article-layout strong { color: #e6edf3; }
  .static-article-layout a { color: #00d4ff; }

  .article-meta-banner {
    background: #0d1117;
    border: 1px solid #21262d;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 32px;
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }
  .article-meta-banner .icon { font-size: 40px; }
  .meta-info { flex: 1; }
  .meta-category {
    color: #00d4ff;
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .meta-details {
    color: #8892a4;
    font-size: 13px;
    margin-top: 8px;
  }
  .meta-details span { margin-right: 16px; }

  .article-nav-links {
    display: flex;
    justify-content: space-between;
    margin-top: 60px;
    padding-top: 24px;
    border-top: 1px solid #21262d;
    gap: 12px;
    flex-wrap: wrap;
  }
  .article-nav-links a {
    color: #00d4ff;
    text-decoration: none;
    font-size: 14px;
    max-width: 45%;
  }
  .article-nav-links a:hover { text-decoration: underline; }

  .toc-box {
    background: #0d1117;
    border: 1px solid #21262d;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 32px;
  }
  .toc-box h4 {
    color: #00d4ff;
    font-size: 12px;
    letter-spacing: 2px;
    margin: 0 0 12px;
  }
  .toc-list { list-style: none; padding: 0; margin: 0; }
  .toc-list li { margin: 6px 0; }
  .toc-list a { color: #8892a4; font-size: 14px; text-decoration: none; }
  .toc-list a:hover { color: #00d4ff; }

  .btn-read-original {
    display: inline-block;
    margin-top: 32px;
    background: transparent;
    border: 1px solid #00d4ff;
    color: #00d4ff;
    padding: 10px 20px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 14px;
    transition: all 0.2s;
  }
  .btn-read-original:hover {
    background: #00d4ff;
    color: #060d1a;
  }
</style>
</head>
<body style="background:#060d1a">

<canvas id="binary-canvas"></canvas>

<!-- NAVBAR -->
<nav id="navbar">
  <a href="../index.html" class="logo">Temgus.<span>CyberBlog</span></a>
  <ul class="nav-links">
    <li><a href="../index.html">Accueil</a></li>
    <li><a href="../index.html#articles" class="active">Articles</a></li>
    <li><a href="../index.html#categories">Catégories</a></li>
    <li><a href="../a-propos.html">À propos</a></li>
  </ul>
  <a href="../index.html" class="btn-outline" style="font-size:13px;padding:7px 16px">← Retour</a>
</nav>

<!-- ARTICLE COMPLET -->
<main class="static-article-layout">

  <!-- Bannière méta -->
  <div class="article-meta-banner">
    <div class="icon">${article.icone || '🔒'}</div>
    <div class="meta-info">
      <div class="meta-category">${article.categorie || 'Cybersécurité'}</div>
      <div style="color:#e6edf3;font-size:18px;font-weight:600">${article.titre}</div>
      <div class="meta-details">
        <span>📅 ${article.date}</span>
        <span>⏱ ${article.lecture || 5} min de lecture</span>
        <span>🏷 ${article.niveau || 'Débutant'}</span>
      </div>
    </div>
  </div>

  <!-- Table des matières -->
  ${tocHtml ? `<div class="toc-box"><h4>// SOMMAIRE</h4>${tocHtml}</div>` : ''}

  <!-- Contenu de l'article -->
  <article>${contentHtml}</article>

  <!-- Lien vers la version interactive -->
  <a href="${articleUrl}" class="btn-read-original">
    💬 Voir l'article avec commentaires →
  </a>

  <!-- Navigation précédent / suivant -->
  <div class="article-nav-links">
    ${prevLink}
    ${nextLink}
  </div>

</main>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div>
      <div class="footer-logo">Temgus.<span>CyberBlog</span></div>
      <div class="footer-copy">© 2025 Temgus — Tous droits réservés</div>
    </div>
    <div class="footer-links">
      <a href="../mentions-legales.html">Mentions légales</a>
      <a href="../a-propos.html">Contact</a>
      <a href="https://github.com/temgus2025" target="_blank">GitHub</a>
    </div>
  </div>
</footer>

<!-- Coloration syntaxique -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script>
  // Highlight.js
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
  });

  // Animation binaire (depuis style.css / app.js existant)
  const canvas = document.getElementById('binary-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 14);
    const drops = Array(cols).fill(1);
    function drawBinary() {
      ctx.fillStyle = 'rgba(6,13,26,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,212,255,0.15)';
      ctx.font = '12px monospace';
      drops.forEach((y, i) => {
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', i * 14, y * 14);
        if (y * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }
    setInterval(drawBinary, 50);
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  // Navbar scroll
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Smooth scroll pour le sommaire
  document.querySelectorAll('.toc-list a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
</script>

</body>
</html>`;

  const filePath = path.join(OUTPUT_DIR, `${article.id}.html`);
  fs.writeFileSync(filePath, html, 'utf-8');
  count++;
  if (count % 10 === 0) console.log(`  → ${count} pages générées...`);
});

console.log(`\n🎉 ${count} pages générées dans /pages/`);
if (errors > 0) console.warn(`⚠️  ${errors} articles sans fichier Markdown`);
console.log(`\n📌 Exemple d'URL indexable par Google :`);
console.log(`   ${BASE_URL}/pages/intro-cybersecurite.html\n`);
