/**
 * animations.js — Empresa Constructora
 * Animaciones de scroll (IntersectionObserver), efectos visuales
 * y micro-interacciones. Sin dependencias externas.
 */

'use strict';

const AnimationsModule = (() => {

  // ── IntersectionObserver para reveals ────────────────────────
  let revealObserver = null;

  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: mostrar todo sin animación
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
        .forEach(el => el.classList.add('visible'));
      return;
    }

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach(el => revealObserver.observe(el));
  }

  // Observar cards nuevas (llamado desde portfolio.js)
  function observeNewCards(cards) {
    if (!revealObserver) {
      cards.forEach(c => c.classList.add('visible'));
      return;
    }
    cards.forEach(c => {
      c.classList.remove('visible');
      revealObserver.observe(c);
    });
  }

  // ── Navegación: cambio de fondo al hacer scroll ──────────────
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    let ticking = false;

    function updateNav() {
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNav);
        ticking = true;
      }
    }, { passive: true });

    // Estado inicial
    updateNav();
  }

  // ── Hero: efecto Ken Burns en background ────────────────────
  function initHeroKenBurns() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    setTimeout(() => hero.classList.add('loaded'), 100);
  }

  // ── Contador animado para las estadísticas del hero ──────────
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => counterObserver.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOutCubic(progress) * target);
      el.textContent = value + suffix;

      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // ── Efecto parallax suave en hero ───────────────────────────
  function initParallax() {
    const heroBg = document.querySelector('.hero__bg-image');
    if (!heroBg) return;

    // Solo en desktop (evitar lag en mobile)
    const mq = window.matchMedia('(min-width: 1024px)');
    if (!mq.matches) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          heroBg.style.transform = `scale(1) translateY(${y * 0.25}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ── Hover magnético en botones principales ──────────────────
  function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn--primary');

    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const strength = 0.25;
        btn.style.transform = `translate(${x * strength}px, ${y * strength - 2}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // ── Smooth scroll para links de ancla ───────────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        e.preventDefault();

        // Cerrar menú mobile si está abierto
        const menu = document.querySelector('.nav__menu');
        const hamburger = document.querySelector('.nav__hamburger');
        if (menu?.classList.contains('open')) {
          menu.classList.remove('open');
          hamburger?.classList.remove('active');
          document.body.style.overflow = '';
        }

        const navHeight = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--nav-height'),
          10
        ) || 72;

        // Esperar un frame para que el layout esté estabilizado
        // (evita scroll corto cuando el portfolio aún no terminó de cargar)
        requestAnimationFrame(() => {
          const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        });
      });
    });
  }

  // ── Active nav link en scroll ────────────────────────────────
  function initActiveNavLinks() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const navHeight = 80;

    function updateActiveLink() {
      let current = '';

      sections.forEach(section => {
        const top = section.offsetTop - navHeight - 40;
        if (window.scrollY >= top) {
          current = section.id;
        }
      });

      navLinks.forEach(link => {
        const href = link.getAttribute('href').slice(1);
        link.classList.toggle('nav__link--active', href === current);
      });
    }

    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();
  }

  // ── Efecto de línea en cards de servicios ──────────────────
  function initServiceCards() {
    const cards = document.querySelectorAll('.servicio-card');

    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transition = `background var(--duration-base) var(--ease-out)`;
      });
    });
  }

  // ── Cursor personalizado (solo desktop) ────────────────────
  // Comentado por defecto — descomentar si se desea
  /*
  function initCustomCursor() {
    if (window.matchMedia('(hover: none)').matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
  }
  */

  // ── Inicialización ────────────────────────────────────────────
  function init() {
    initNavScroll();
    initHeroKenBurns();
    initReveal();
    initCounters();
    initParallax();
    initSmoothScroll();
    initActiveNavLinks();
    initServiceCards();

    // Magnetic buttons: solo en dispositivos con hover preciso
    if (!window.matchMedia('(hover: none)').matches) {
      initMagneticButtons();
    }
  }

  return {
    init,
    observeNewCards,
  };

})();

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  AnimationsModule.init();
});

window.AnimationsModule = AnimationsModule;
