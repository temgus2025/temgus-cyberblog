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

  // Recharger l'article quand le hash change (navigation suivant/précédent)
  // On ignore le premier hashchange qui peut se déclencher au chargement
  let premierChargement = true;
  window.addEventListener('hashchange', () => {
    if (premierChargement) { premierChargement = false; return; }
    chargerArticle();
  });
  setTimeout(() => { premierChargement = false; }, 500);
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

  const card = document.getElementById('info-card');
  card.innerHTML = '';
  card.innerHTML = `
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
    <div class="info-row">
      <span class="info-label">Partager</span>
    </div>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://temgus2025.github.io/temgus-cyberblog/pages/' + article.id + '.html')}"
       target="_blank" rel="noopener noreferrer"
       style="display:flex;align-items:center;justify-content:center;gap:8px;background:#1877f2;color:#fff;border:none;border-radius:8px;padding:10px 16px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;margin-top:4px;transition:background .2s"
       onmouseover="this.style.background='#1464d8'" onmouseout="this.style.background='#1877f2'">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
      Partager sur Facebook
    </a>
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

  // Bouton Facebook visible sur mobile (avant la navigation)
  const shareUrl = encodeURIComponent('https://temgus2025.github.io/temgus-cyberblog/pages/' + actuel.id + '.html');
  const navEl = document.getElementById('article-nav');
  navEl.insertAdjacentHTML('beforebegin', `
    <div class="share-mobile" style="text-align:center;padding:24px 20px 0;display:none">
      <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}"
         target="_blank" rel="noopener noreferrer"
         style="display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#1877f2;color:#fff;border-radius:8px;padding:12px 24px;font-size:14px;font-weight:600;text-decoration:none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
        Partager sur Facebook
      </a>
    </div>
  `);

  // Afficher uniquement sur mobile
  const shareMobile = document.querySelector('.share-mobile');
  if (window.innerWidth < 1024) shareMobile.style.display = 'block';
  window.addEventListener('resize', () => {
    shareMobile.style.display = window.innerWidth < 1024 ? 'block' : 'none';
  });

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
