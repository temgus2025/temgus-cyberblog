/* ============================================================
   Temgus.CyberBlog — app.js
   Charge les articles depuis data/articles.json et génère
   dynamiquement toutes les cartes HTML.
   ============================================================ */

// ─── État global ───────────────────────────────────────────
let ARTICLES = [];          // Tous les articles chargés
let FILTRE_CAT = 'tous';    // Catégorie active
let RECHERCHE = '';         // Terme de recherche

// ─── Couleurs de fond par catégorie ───────────────────────
const BG_CAT = {
  'Sécurité réseau': 'bg-securite',
  'Réseaux':         'bg-reseaux',
  'Malwares':        'bg-malware',
  'Bonnes pratiques':'bg-pratiques',
  'Cryptographie':   'bg-crypto',
  'Pentest':         'bg-pentest',
  'VPN & Anonymat':  'bg-vpn',
};

const getBg = (cat) => BG_CAT[cat] || 'bg-default';

// ─── Niveau → classe CSS ──────────────────────────────────
const niveauClass = (n) => ({
  'Débutant':     'niveau-debutant',
  'Intermédiaire':'niveau-intermediaire',
  'Avancé':       'niveau-avance',
}[n] || '');

// ─── Point d'entrée ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initCanvas();
  initNavbar();
  await chargerArticles();
  initRecherche();
});

// ─── Chargement des articles ──────────────────────────────
async function chargerArticles() {
  try {
    const res = await fetch('data/articles.json');
    if (!res.ok) throw new Error('Erreur de chargement');
    ARTICLES = await res.json();

    // Trier par date décroissante
    ARTICLES.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderStats();
    renderFiltres();
    renderFeatured();
    renderArticles();
  } catch (err) {
    console.error('Impossible de charger articles.json :', err);
    document.getElementById('articles-grid').innerHTML =
      '<p style="color:var(--muted);padding:20px">Erreur de chargement des articles.</p>';
  }
}

// ─── Stats hero ───────────────────────────────────────────
function renderStats() {
  const cats = [...new Set(ARTICLES.map(a => a.categorie))];
  document.getElementById('hero-stats').innerHTML = `
    <div class="stat-item">
      <div class="stat-num">${ARTICLES.length}</div>
      <div class="stat-label">Articles</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">${cats.length}</div>
      <div class="stat-label">Catégories</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">100%</div>
      <div class="stat-label">Gratuit</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">FR</div>
      <div class="stat-label">En français</div>
    </div>
  `;
}

// ─── Filtres catégories ───────────────────────────────────
function renderFiltres() {
  const cats = [...new Set(ARTICLES.map(a => a.categorie))];
  const container = document.getElementById('topics-filter');

  // Vider le container sauf le bouton "Tous" déjà présent dans le HTML
  container.innerHTML = '';

  // Recréer le bouton "Tous"
  const btnTous = document.createElement('button');
  btnTous.className = 'topic-pill active';
  btnTous.dataset.cat = 'tous';
  btnTous.innerHTML = `<span class="dot"></span> Tous`;
  btnTous.addEventListener('click', () => setFiltre('tous'));
  container.appendChild(btnTous);

  // Créer un bouton par catégorie
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'topic-pill';
    btn.dataset.cat = cat;
    btn.innerHTML = `<span class="dot"></span> ${cat}`;
    btn.addEventListener('click', () => setFiltre(cat));
    container.appendChild(btn);
  });
}

function setFiltre(cat) {
  FILTRE_CAT = cat;
  document.querySelectorAll('.topic-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === cat);
  });
  renderArticles();
}

// ─── Articles filtrés ─────────────────────────────────────
function getArticlesFiltres() {
  return ARTICLES.filter(a => {
    const matchCat = FILTRE_CAT === 'tous' || a.categorie === FILTRE_CAT;
    const matchSearch = RECHERCHE === '' ||
      a.titre.toLowerCase().includes(RECHERCHE) ||
      a.resume.toLowerCase().includes(RECHERCHE) ||
      a.tags.some(t => t.toLowerCase().includes(RECHERCHE));
    return matchCat && matchSearch;
  });
}

// ─── Articles à la une ────────────────────────────────────
function renderFeatured() {
  const featured = ARTICLES.filter(a => a.featured);
  if (!featured.length) {
    document.getElementById('featured-section').style.display = 'none';
    return;
  }

  const [main, ...rest] = featured;
  const grid = document.getElementById('featured-grid');

  let html = `
    <a href="article.html#${main.id}" class="featured-card">
      <div class="card-img">
        <span class="card-badge">À la une</span>
        <span class="card-icon-lg">${main.icone}</span>
      </div>
      <div class="card-body">
        <div class="card-cat">// ${main.categorie}</div>
        <div class="card-title-lg">${main.titre}</div>
        <div class="card-excerpt">${main.resume}</div>
        <div class="card-meta">
          <span>🕐 ${main.lecture} min</span>
          <span>·</span>
          <span>${formatDate(main.date)}</span>
          <span>·</span>
          <span class="${niveauClass(main.niveau)}">${main.niveau}</span>
        </div>
      </div>
    </a>
  `;

  if (rest.length) {
    html += `<div style="display:flex;flex-direction:column;gap:16px">`;
    rest.forEach(a => {
      html += `
        <a href="article.html#${a.id}" class="featured-card" style="flex:1">
          <div class="card-img sm">
            <span class="card-badge green">Populaire</span>
            <span class="card-icon-md">${a.icone}</span>
          </div>
          <div class="card-body sm">
            <div class="card-cat">// ${a.categorie}</div>
            <div class="card-title-md">${a.titre}</div>
            <div class="card-meta">
              <span>🕐 ${a.lecture} min</span>
              <span>·</span>
              <span class="${niveauClass(a.niveau)}">${a.niveau}</span>
            </div>
          </div>
        </a>
      `;
    });
    html += `</div>`;
  }

  grid.innerHTML = html;
}

// ─── Grille d'articles ────────────────────────────────────
function renderArticles() {
  const articles = getArticlesFiltres();
  const grid = document.getElementById('articles-grid');
  const noResults = document.getElementById('no-results');
  const counter = document.getElementById('articles-count');
  const title = document.getElementById('articles-title');

  // Mise à jour titre et compteur
  title.textContent = RECHERCHE ? `Résultats de recherche` : `Articles récents`;
  counter.textContent = `${articles.length} article${articles.length > 1 ? 's' : ''}`;

  if (!articles.length) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    document.getElementById('search-term').textContent = RECHERCHE;
    return;
  }

  noResults.classList.add('hidden');

  grid.innerHTML = articles.map(a => `
    <a href="article.html#${a.id}" class="article-card">
      <div class="article-img ${getBg(a.categorie)}">
        <span class="article-icon">${a.icone}</span>
      </div>
      <div class="article-body">
        <div class="article-tag">${a.categorie.toUpperCase()}</div>
        <div class="article-title">${a.titre}</div>
        <div class="article-excerpt">${a.resume}</div>
        <div class="article-footer">
          <span>🕐 ${a.lecture} min</span>
          <span class="${niveauClass(a.niveau)}">${a.niveau}</span>
        </div>
      </div>
    </a>
  `).join('');
}

// ─── Recherche ────────────────────────────────────────────
function initRecherche() {
  const input = document.getElementById('search-input');
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      RECHERCHE = input.value.trim().toLowerCase();
      renderArticles();
      // Scroll vers les articles si on tape
      if (RECHERCHE) {
        document.getElementById('articles').scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  });
}

// ─── Navbar scroll ────────────────────────────────────────
function initNavbar() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ─── Canvas binaire ───────────────────────────────────────
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
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
