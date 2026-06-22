/**
 * portfolio.js — Empresa Constructora
 * Carga portfolio.json via fetch() y renderiza cards dinámicamente.
 * Maneja filtros por categoría y animaciones de entrada.
 */

'use strict';

const PortfolioModule = (() => {

  // ── Estado ──────────────────────────────────────────────────
  let allItems    = [];
  let categories  = [];
  let activeFilter = 'todos';

  // ── Selectores ──────────────────────────────────────────────
  const SELECTORS = {
    grid:    '#portfolio-grid',
    filters: '#portfolio-filters',
    section: '#portfolio',
  };

  // ── Carga datos ─────────────────────────────────────────────
  async function fetchData() {
    try {
      const response = await fetch('./portfolio.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      allItems   = data.items   || [];
      categories = data.categories || [];
      return true;
    } catch (err) {
      console.error('[Portfolio] Error cargando portfolio.json:', err);
      renderError();
      return false;
    }
  }

  // ── Renderiza filtros ────────────────────────────────────────
  function renderFilters() {
    const container = document.querySelector(SELECTORS.filters);
    if (!container) return;

    container.innerHTML = '';

    categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = `portfolio__filter${cat.id === 'todos' ? ' active' : ''}`;
      btn.dataset.filter = cat.id;
      btn.textContent = cat.label;
      btn.setAttribute('aria-label', `Filtrar por ${cat.label}`);

      btn.addEventListener('click', () => {
        activeFilter = cat.id;
        updateActiveFilter(btn);
        filterItems(cat.id);
      });

      container.appendChild(btn);
    });
  }

  function updateActiveFilter(activeBtn) {
    document.querySelectorAll('.portfolio__filter').forEach(btn => {
      btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
  }

  // ── Renderiza cards ──────────────────────────────────────────
  function renderCards(items) {
    const grid = document.querySelector(SELECTORS.grid);
    if (!grid) return;

    grid.innerHTML = '';

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="portfolio-empty" style="
          grid-column: 1/-1;
          text-align: center;
          padding: 3rem;
          color: var(--color-gris-500);
          font-family: var(--font-ui);
          letter-spacing: 0.08em;
        ">
          No hay obras en esta categoría aún.
        </div>
      `;
      return;
    }

    items.forEach((item, index) => {
      const card = createCard(item);
      grid.appendChild(card);
    });

    // Las cards del portfolio se muestran directamente, sin reveal
    grid.querySelectorAll('.portfolio-card').forEach(c => c.classList.add('visible'));
  }

  function createCard(item) {
    const card = document.createElement('article');
    card.className = 'portfolio-card';
    card.dataset.category = item.categoria;
    card.setAttribute('aria-label', item.titulo);

    const catLabel = getCategoryLabel(item.categoria);

    card.innerHTML = `
      <img
        class="portfolio-card__img"
        src="${escapeHtml(item.imagen)}"
        alt="${escapeHtml(item.alt || item.titulo)}"
        loading="lazy"
        decoding="async"
        onerror="this.src='assets/portfolio/placeholder.jpg'; this.onerror=null;"
      />
      <div class="portfolio-card__overlay">
        <span class="portfolio-card__cat">${escapeHtml(catLabel)}</span>
        <h3 class="portfolio-card__title">${escapeHtml(item.titulo)}</h3>
        <p class="portfolio-card__desc">${escapeHtml(item.descripcion)}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      LightboxModule.open(item);
    });

    return card;
  }

  // ── Filtrado ─────────────────────────────────────────────────
  function filterItems(categoryId) {
    const filtered = categoryId === 'todos'
      ? allItems
      : allItems.filter(item => item.categoria === categoryId);

    animateGridChange(() => renderCards(filtered));
  }

  function animateGridChange(callback) {
    const grid = document.querySelector(SELECTORS.grid);
    if (!grid) { callback(); return; }

    grid.style.opacity = '0';
    grid.style.transform = 'translateY(8px)';
    grid.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

    setTimeout(() => {
      callback();
      grid.style.opacity = '1';
      grid.style.transform = 'translateY(0)';
    }, 200);
  }

  // ── Skeletons de carga ────────────────────────────────────────
  function renderSkeletons(count = 6) {
    const grid = document.querySelector(SELECTORS.grid);
    if (!grid) return;

    grid.innerHTML = Array.from({ length: count }, () => `
      <div class="portfolio-card portfolio-card--skeleton" aria-hidden="true"></div>
    `).join('');
  }

  // ── Error ─────────────────────────────────────────────────────
  function renderError() {
    const grid = document.querySelector(SELECTORS.grid);
    if (!grid) return;

    grid.innerHTML = `
      <div style="
        grid-column: 1/-1;
        text-align: center;
        padding: 3rem;
        color: var(--color-gris-500);
        font-family: var(--font-ui);
      ">
        <p>No se pudo cargar el portfolio. Por favor recargá la página.</p>
      </div>
    `;
  }

  // ── Helpers ──────────────────────────────────────────────────
  function getCategoryLabel(id) {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.label : id;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' };
    return str.replace(/[&<>"']/g, m => map[m]);
  }

  // ── Inicialización ────────────────────────────────────────────
  async function init() {
    renderSkeletons(6);

    const ok = await fetchData();
    if (!ok) return;

    renderFilters();
    renderCards(allItems);
  }

  return { init };

})();

// Auto-init cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  PortfolioModule.init();
});

// Exportar para uso en main.js
window.PortfolioModule = PortfolioModule;
