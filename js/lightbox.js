/**
 * lightbox.js — Empresa Constructora
 * Lightbox para ampliar imágenes del portfolio. Sin dependencias.
 */

'use strict';

const LightboxModule = (() => {

  let overlay   = null;
  let currentItem = null;

  // ── Crear el DOM del lightbox (una sola vez) ─────────────────
  function build() {
    overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Imagen ampliada');

    overlay.innerHTML = `
      <div class="lightbox__backdrop"></div>
      <div class="lightbox__content">
        <button class="lightbox__close" aria-label="Cerrar">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <img class="lightbox__img" src="" alt="" />
        <div class="lightbox__info">
          <span class="lightbox__cat"></span>
          <p class="lightbox__title"></p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Cerrar al hacer click en el backdrop o el botón
    overlay.querySelector('.lightbox__backdrop').addEventListener('click', close);
    overlay.querySelector('.lightbox__close').addEventListener('click', close);

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) close();
    });
  }

  // ── Abrir ────────────────────────────────────────────────────
  function open(item) {
    if (!overlay) build();

    currentItem = item;

    const img   = overlay.querySelector('.lightbox__img');
    const cat   = overlay.querySelector('.lightbox__cat');
    const title = overlay.querySelector('.lightbox__title');

    img.src = item.imagen;
    img.alt = item.alt || item.titulo;
    cat.textContent   = item.categoria;
    title.textContent = item.titulo;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Foco al botón de cerrar para accesibilidad
    overlay.querySelector('.lightbox__close').focus();
  }

  // ── Cerrar ───────────────────────────────────────────────────
  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    currentItem = null;
  }

  return { open, close };

})();

window.LightboxModule = LightboxModule;
