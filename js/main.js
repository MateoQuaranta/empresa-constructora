/**
 * main.js — Empresa Constructora
 * Lógica general: navegación mobile, lazy loading, widget de WhatsApp, utilidades.
 * La lógica del formulario fue reemplazada por chat-contacto.js
 */

'use strict';

const App = (() => {

  // ── Menú mobile ──────────────────────────────────────────────
  function initMobileNav() {
    const hamburger = document.querySelector('.nav__hamburger');
    const menu      = document.querySelector('.nav__menu');
    if (!hamburger || !menu) return;

    hamburger.setAttribute('aria-label', 'Abrir menú');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'nav-menu');
    menu.id = 'nav-menu';

    hamburger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
      if (
        menu.classList.contains('open') &&
        !menu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        menu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Cerrar al presionar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  // ── Lazy loading nativo (fallback para browsers viejos) ──────
  function initLazyImages() {
    if ('loading' in HTMLImageElement.prototype) return; // nativo ya lo maneja

    const images = document.querySelectorAll('img[loading="lazy"]');
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) img.src = img.dataset.src;
          io.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(img => io.observe(img));
  }

  // ── Año en footer ────────────────────────────────────────────
  function updateFooterYear() {
    const el = document.querySelector('#footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ── Skip to main content (accesibilidad) ────────────────────
  function initSkipLink() {
    const skipLink = document.querySelector('.skip-link');
    if (!skipLink) return;

    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const main = document.querySelector('main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus();
        main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true });
      }
    });
  }

  // ── Clipboard: copiar teléfono/email al hacer click ─────────
  function initCopyableContacts() {
    document.querySelectorAll('[data-copyable]').forEach(el => {
      el.style.cursor = 'pointer';
      el.title = 'Clic para copiar';

      el.addEventListener('click', async () => {
        const text = el.dataset.copyable || el.textContent.trim();
        try {
          await navigator.clipboard.writeText(text);
          const original = el.textContent;
          el.textContent = '✓ Copiado';
          setTimeout(() => { el.textContent = original; }, 1500);
        } catch {
          // Silencioso si no hay permisos
        }
      });
    });
  }

  // ── Skeleton servicios ───────────────────────────────────────
  function initServicioSkeletons() {
    const cards = document.querySelectorAll('.servicio-card--skeleton');
    if (!cards.length) return;

    window.addEventListener('load', () => {
      cards.forEach((card, i) => {
        setTimeout(() => {
          card.classList.remove('servicio-card--skeleton');
        }, i * 80);
      });
    });
  }

  // ── Widget flotante de WhatsApp ──────────────────────────────
  function initWaWidget() {
    const launcher = document.querySelector('#wa-launcher');
    const panel    = document.querySelector('#wa-panel');
    const closeBtn = document.querySelector('#wa-close');
    const widget   = document.querySelector('#wa-widget');
    if (!launcher || !panel) return;

    function openPanel() {
      panel.removeAttribute('hidden');
      panel.classList.add('open');
      launcher.setAttribute('aria-expanded', 'true');
    }

    function closePanel() {
      panel.setAttribute('hidden', '');
      panel.classList.remove('open');
      launcher.setAttribute('aria-expanded', 'false');
    }

    function isPanelOpen() {
      return !panel.hasAttribute('hidden');
    }

    launcher.addEventListener('click', () => {
      if (isPanelOpen()) {
        closePanel();
      } else {
        openPanel();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => closePanel());
    }

    // Cerrar al presionar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isPanelOpen()) {
        closePanel();
        launcher.focus();
      }
    });

    // Cerrar al hacer click fuera del widget.
    // Se usa la fase de captura para evaluar el target ANTES de que el chat
    // re-renderice y quite del DOM el botón clickeado (si no, un clic dentro
    // del chat se interpretaría como "afuera" y cerraría el panel).
    document.addEventListener('click', (e) => {
      if (!isPanelOpen()) return;
      if (widget && widget.contains(e.target)) return;
      closePanel();
    }, true);
  }

  // ── Inicialización principal ─────────────────────────────────
  function init() {
    initMobileNav();
    initWaWidget();
    initLazyImages();
    updateFooterYear();
    initSkipLink();
    initCopyableContacts();
    initServicioSkeletons();
  }

  return { init };

})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
