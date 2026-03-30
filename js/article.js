/* ============================================================
   Temgus.CyberBlog — article.js
   - Lit l'ID dans l'URL (#id)
   - Charge les métadonnées depuis articles.json
   - Charge le fichier .md et le convertit en HTML avec marked.js
   - Génère la table des matières automatiquement
   - Coloration syntaxique avec highlight.js
   - Barre de progression de lecture
   ============================================================ */

// ─── Point d'entrée ───────────────────────────────────────
async function chargerArticle() {
  // Restaurer l'article après retour OAuth Giscus
  const savedHash = sessionStorage.getItem('giscus_hash');
  if (savedHash && !window.location.hash) {
    window.location.hash = savedHash;
    sessionStorage.removeItem('giscus_hash');
    return;
  }

  const id = window.location.hash.replace('#', '');
  if (!id) return afficherErreur();

  try {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('article-main').classList.add('hidden');

    const articles = await fetchJSON('data/articles.json');
    const article = articles.find(a => a.id === id);
    if (!article) return afficherErreur();

    const markdown = await fetchTexte(article.fichier);

    afficherHero(article);
    afficherContenu(markdown);
    afficherSidebarInfo(article);
    afficherNavigation(articles, article);
    genererTDM();

    document.title = `${article.titre} — Temgus.CyberBlog`;
    updateSEO(article);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('article-main').classList.remove('hidden');

    // Afficher les commentaires Giscus
    const giscus = document.getElementById('giscus-container');
    if (giscus) giscus.classList.remove('hidden');

    window.scrollTo(0, 0);

  } catch (err) {
    console.error('Erreur chargement article :', err);
    afficherErreur();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  initNavbar();
  initProgressBar();
  chargerArticle();

  // Sauvegarder le hash avant redirection OAuth Giscus
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && (
      link.href.includes('giscus.app') ||
      link.href.includes('github.com/login') ||
      link.href.includes('github.com/apps/giscus')
    )) {
      sessionStorage.setItem('giscus_hash', window.location.hash);
    }
  });

  // Recharger l'article quand le hash change (navigation suivant/précédent)
  window.addEventListener('hashchange', () => {
    chargerArticle();
  });
});

// ─── Hero de l'article ────────────────────────────────────
function afficherHero(article) {
  // Badge catégorie + niveau + date
  document.getElementById('article-meta-top').innerHTML = `
    <span class="article-cat-badge">${article.categorie}</span>
    <span class="${niveauClass(article.niveau)}" style="font-size:13px">${article.niveau}</span>
  `;

  document.getElementById('article-titre').textContent = article.titre;

  document.getElementById('article-meta-bar').innerHTML = `
    <span>${article.icone}</span>
    <span class="meta-sep">·</span>
    <span>🕐 ${article.lecture} min de lecture</span>
    <span class="meta-sep">·</span>
    <span>📅 ${formatDate(article.date)}</span>
    <span class="meta-sep">·</span>
    <span>✍️ Temgus</span>
  `;
}

// ─── Rendu Markdown ───────────────────────────────────────
function afficherContenu(markdown) {
  // Configurer marked
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Convertir Markdown → HTML
  const html = marked.parse(markdown);
  const container = document.getElementById('article-content');
  container.innerHTML = html;

  // Appliquer highlight.js sur tous les blocs <code>
  container.querySelectorAll('pre code').forEach(bloc => {
    hljs.highlightElement(bloc);

    // Ajouter le label de langage sur le <pre> parent
    const lang = bloc.className.replace('language-', '').replace('hljs', '').trim();
    if (lang) bloc.parentElement.setAttribute('data-lang', lang);
  });

  // Rendre les IDs des titres pour les ancres (table des matières)
  container.querySelectorAll('h1, h2, h3, h4').forEach(h => {
    const id = slugify(h.textContent);
    h.id = id;
  });
}

// ─── Sidebar informations ─────────────────────────────────
function afficherSidebarInfo(article) {
  const tagsHTML = article.tags
    .map(t => `<span class="tag-pill">${t}</span>`)
    .join('');

  document.getElementById('info-card').innerHTML = `
    <div class="info-row">
      <span class="info-label">Catégorie</span>
      <span class="info-value" style="color:var(--cyan)">${article.categorie}</span>
    </div>
    <div class="info-divider"></div>
    <div class="info-row">
      <span class="info-label">Niveau</span>
      <span class="info-value ${niveauClass(article.niveau)}">${article.niveau}</span>
    </div>
    <div class="info-divider"></div>
    <div class="info-row">
      <span class="info-label">Temps de lecture</span>
      <span class="info-value">🕐 ${article.lecture} min</span>
    </div>
    <div class="info-divider"></div>
    <div class="info-row">
      <span class="info-label">Publié le</span>
      <span class="info-value">${formatDate(article.date)}</span>
    </div>
    <div class="info-divider"></div>
    <div class="info-row">
      <span class="info-label">Tags</span>
      <div class="tags-list">${tagsHTML}</div>
    </div>
    <div class="info-divider"></div>
    <a href="index.html" class="btn-outline" style="text-align:center;font-size:13px;padding:9px 16px;justify-content:center">
      ← Tous les articles
    </a>
  `;
}

// ─── Navigation précédent / suivant ───────────────────────
function afficherNavigation(articles, actuel) {
  const idx = articles.findIndex(a => a.id === actuel.id);
  const prev = articles[idx + 1]; // Plus ancien
  const next = articles[idx - 1]; // Plus récent

  let html = '';

  if (prev) {
    html += `
      <a href="article.html#${prev.id}" class="nav-card prev">
        <span class="nav-direction">← Article précédent</span>
        <span class="nav-title">${prev.icone} ${prev.titre}</span>
      </a>
    `;
  } else {
    html += '<div></div>';
  }

  if (next) {
    html += `
      <a href="article.html#${next.id}" class="nav-card next">
        <span class="nav-direction">Article suivant →</span>
        <span class="nav-title">${next.titre} ${next.icone}</span>
      </a>
    `;
  } else {
    html += '<div></div>';
  }

  // Bouton partage Facebook
  const pageUrl = encodeURIComponent(window.location.href);
  const pageTitle = encodeURIComponent(document.title);
  html += `
    <div class="share-section">
      <div class="share-label">// Partager cet article</div>
      <div class="share-buttons">
        <a href="https://www.facebook.com/sharer/sharer.php?u=${pageUrl}" 
           target="_blank" rel="noopener" class="share-btn share-facebook">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Partager sur Facebook
        </a>
        <a href="https://www.linkedin.com/shareArticle?mini=true&url=${pageUrl}&title=${pageTitle}" 
           target="_blank" rel="noopener" class="share-btn share-linkedin">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Partager sur LinkedIn
        </a>
        <a href="https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}" 
           target="_blank" rel="noopener" class="share-btn share-twitter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.264 5.633 5.9-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Partager sur X
        </a>
      </div>
    </div>
  `;

  document.getElementById('article-nav').innerHTML = html;
}

// ─── Table des matières automatique ──────────────────────
function genererTDM() {
  const titres = document.querySelectorAll('.article-content h2, .article-content h3');
  const nav = document.getElementById('toc-nav');

  if (titres.length < 2) {
    document.getElementById('toc-sidebar').style.display = 'none';
    return;
  }

  titres.forEach(h => {
    const lien = document.createElement('a');
    lien.href = `#${h.id}`;
    lien.className = `toc-link ${h.tagName === 'H3' ? 'h3' : ''}`;
    lien.textContent = h.textContent.replace('// ', '');
    lien.addEventListener('click', e => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth' });
    });
    nav.appendChild(lien);
  });

  // Surligner le titre actif au scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
        const lienActif = nav.querySelector(`a[href="#${entry.target.id}"]`);
        if (lienActif) lienActif.classList.add('active');
      }
    });
  }, { rootMargin: '-80px 0px -70% 0px' });

  titres.forEach(h => observer.observe(h));
}

// ─── Barre de progression de lecture ─────────────────────
function initProgressBar() {
  const bar = document.createElement('div');
  bar.id = 'reading-progress';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
  });
}

// ─── Erreur ───────────────────────────────────────────────
function afficherErreur() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error-screen').classList.remove('hidden');
}

// ─── Navbar scroll ────────────────────────────────────────
function initNavbar() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ─── Canvas binaire (même que app.js) ────────────────────
function initCanvas() {
  const canvas = document.getElementById('binary-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const drops = Array.from({ length: Math.floor(window.innerWidth / 22) }, () => Math.random() * -60);

  function draw() {
    ctx.fillStyle = 'rgba(6,13,26,0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00d4ff';
    ctx.font = '13px monospace';
    drops.forEach((y, i) => {
      ctx.fillText(Math.random() > 0.5 ? '1' : '0', i * 22, y * 22);
      if (y * 22 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.3;
    });
  }
  setInterval(draw, 55);
}

// ─── Utilitaires ──────────────────────────────────────────
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erreur fetch: ${url}`);
  return res.json();
}

async function fetchTexte(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fichier introuvable: ${url}`);
  return res.text();
}

function getParam(nom) {
  return new URLSearchParams(window.location.search).get(nom);
}

function slugify(texte) {
  return texte.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function niveauClass(n) {
  return { 'Débutant': 'niveau-debutant', 'Intermédiaire': 'niveau-intermediaire', 'Avancé': 'niveau-avance' }[n] || '';
}

// ─── Mise à jour SEO dynamique ─────────────────────────────
function updateSEO(article) {
  const base = 'https://temgus2025.github.io/temgus-cyberblog/';
  const url = `${base}article.html#${article.id}`;
  const title = `${article.titre} — Temgus.CyberBlog`;
  const desc = article.resume;

  // Balises meta standard
  setMeta('description', desc);
  setMeta('keywords', article.tags.join(', ') + ', cybersécurité, sécurité informatique');

  // Canonical
  const canonical = document.getElementById('canonical');
  if (canonical) canonical.setAttribute('href', url);

  // Open Graph
  setOG('og-url', url, 'content');
  setOG('og-title', title, 'content');
  setOG('og-desc', desc, 'content');
  setMetaName('og:article:published_time', article.date);

  // Twitter
  setOG('tw-title', title, 'content');
  setOG('tw-desc', desc, 'content');

  // Schema.org Article
  const schema = document.getElementById('schema-article');
  if (schema) {
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.titre,
      "description": article.resume,
      "datePublished": article.date,
      "author": {"@type": "Person", "name": "Temgus", "url": `${base}a-propos.html`},
      "publisher": {"@type": "Person", "name": "Temgus"},
      "url": url,
      "inLanguage": "fr",
      "keywords": article.tags.join(', '),
      "timeRequired": `PT${article.lecture}M`
    });
  }
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaName(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOG(id, value, attr) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('content', value);
}
