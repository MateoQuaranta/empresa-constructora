/**
 * chat-contacto.js — Empresa Constructora
 * Chat de calificación de leads. Va haciendo preguntas, valida,
 * y al terminar genera un botón de WhatsApp con todos los datos
 * pre-cargados en el mensaje para acelerar la atención.
 */

'use strict';

const ChatContactoModule = (() => {

  // ── Configuración ────────────────────────────────────────────
  const CONFIG = {
    whatsappNumber: '5491166873282',      // ⚠️ Editar acá para cambiar el número destino
    typingDelay:    [700, 1100],         // Rango aleatorio del "escribiendo..." (ms)
    botName:        'Asistente Empresa Constructora',
  };

  // ── Estado ───────────────────────────────────────────────────
  let currentStep = 0;
  let answers     = {};
  let elements    = {};
  let isAnimating = false;

  // ── Definición del flujo de preguntas ───────────────────────
  //
  // Cada paso puede tener:
  //   id:         clave donde se guarda la respuesta
  //   type:       'text' | 'email' | 'tel' | 'textarea' | 'quick-replies'
  //   bot:        string | array de strings | función(answers) => string|array
  //   placeholder: texto del input (cuando aplica)
  //   options:    array de { value, label } para quick-replies
  //   validate:   función(value) => true | "mensaje de error"
  //   skippable:  boolean — si permite saltearse
  //
  const STEPS = [
    {
      id: 'nombre',
      type: 'text',
      bot: [
        '¡Hola! 👋 Bienvenido/a a Empresa Constructora.',
        'Soy el asistente virtual. En menos de un minuto vamos a tener todo lo necesario para que un especialista te contacte por WhatsApp.',
        'Para empezar, ¿cuál es tu nombre?',
      ],
      placeholder: 'Tu nombre y apellido',
      validate: (v) => v.trim().length >= 2 || 'Por favor ingresá tu nombre.',
    },

    {
      id: 'tipo_obra',
      type: 'quick-replies',
      bot: (a) => `Un gusto, ${firstName(a.nombre)} 🤝`
                + `\n¿Qué tipo de proyecto tenés en mente?`,
      options: [
        { value: 'Obra hospitalaria',           label: '🏥 Hospitalaria' },
        { value: 'Obra comercial / industrial', label: '🏢 Comercial / industrial' },
        { value: 'Obra residencial',            label: '🏠 Residencial' },
        { value: 'Diseño y proyectos de arquitectura', label: '📐 Diseño y proyectos' },
        { value: 'Diseño de interiores',        label: '🛋️ Interiores' },
        { value: 'Cálculos de ingeniería civil', label: '🔧 Ingeniería civil' },
        { value: 'Otro',                        label: '✨ Otro' },
      ],
    },

    {
      id: 'ubicacion',
      type: 'text',
      bot: '¿Dónde se ubica la obra? (ciudad, barrio o zona)',
      placeholder: 'Ej: CABA - Palermo / San Isidro / Pilar',
      validate: (v) => v.trim().length >= 3 || 'Indicanos al menos la zona.',
    },

    {
      id: 'superficie',
      type: 'quick-replies',
      bot: '¿Cuál es la superficie aproximada del proyecto?',
      options: [
        { value: 'Menos de 100 m²',  label: 'Menos de 100 m²' },
        { value: '100 – 300 m²',     label: '100 – 300 m²' },
        { value: '300 – 1.000 m²',   label: '300 – 1.000 m²' },
        { value: 'Más de 1.000 m²',  label: 'Más de 1.000 m²' },
        { value: 'A definir',        label: 'No estoy seguro/a' },
      ],
    },

    {
      id: 'etapa',
      type: 'quick-replies',
      bot: '¿En qué etapa se encuentra el proyecto?',
      options: [
        { value: 'Tengo planos listos',         label: '📋 Tengo planos listos' },
        { value: 'Tengo idea, falta el diseño', label: '💡 Tengo idea, falta diseño' },
        { value: 'Necesito asesoramiento integral', label: '🤝 Asesoramiento integral' },
        { value: 'Sólo quiero una cotización',  label: '💰 Sólo cotización' },
      ],
    },

    {
      id: 'plazo',
      type: 'quick-replies',
      bot: '¿Para cuándo querrías empezar?',
      options: [
        { value: 'Inmediato (este mes)', label: '⚡ Inmediato' },
        { value: '1 a 3 meses',          label: '📅 1 – 3 meses' },
        { value: '3 a 6 meses',          label: '📆 3 – 6 meses' },
        { value: 'Más de 6 meses',       label: '🗓️ Más de 6 meses' },
        { value: 'Sin definir',          label: '🤔 Aún no defino' },
      ],
    },

    {
      id: 'email',
      type: 'email',
      bot: '¡Perfecto! ¿me pasás tu email?',
      placeholder: 'tu@email.com',
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
                       || 'Ingresá un email válido (ej: nombre@dominio.com).',
    },

    {
      id: 'detalles',
      type: 'textarea',
      bot: '¿Querés agregar algún detalle más sobre el proyecto? (opcional)',
      placeholder: 'Materiales, plazo deseado, presupuesto, etc.',
      skippable: true,
    },
  ];

  // ── Utilidades ───────────────────────────────────────────────
  function firstName(full) {
    if (!full) return '';
    return full.trim().split(/\s+/)[0];
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' };
    return str.replace(/[&<>"']/g, m => map[m]);
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function randomDelay() {
    const [min, max] = CONFIG.typingDelay;
    return min + Math.random() * (max - min);
  }

  function scrollToBottom() {
    const el = elements.messages;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }

  function updateProgress() {
    if (!elements.progressBar) return;
    const pct = Math.min((currentStep / STEPS.length) * 100, 100);
    elements.progressBar.style.width = pct + '%';
  }

  // ── Renderizado de mensajes ─────────────────────────────────
  function appendBotMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg--bot';
    msg.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
    elements.messages.appendChild(msg);
    scrollToBottom();
  }

  function appendUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg--user';
    msg.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
    elements.messages.appendChild(msg);
    scrollToBottom();
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'chat-msg chat-msg--bot chat-msg--typing';
    typing.id = '__typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    elements.messages.appendChild(typing);
    scrollToBottom();
    return typing;
  }

  function hideTyping() {
    const t = document.getElementById('__typing');
    if (t) t.remove();
  }

  // ── Renderizado de inputs ───────────────────────────────────
  function clearInputArea() {
    elements.inputArea.innerHTML = '';
  }

  function renderQuickReplies(step) {
    clearInputArea();

    const wrap = document.createElement('div');
    wrap.className = 'chat-quick-replies';

    step.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-quick-reply';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        if (isAnimating) return;
        handleAnswer(step, opt.value, opt.label);
      });
      wrap.appendChild(btn);
    });

    elements.inputArea.appendChild(wrap);
  }

  function renderTextInput(step) {
    clearInputArea();

    const row = document.createElement('div');
    row.className = 'chat-input-row';

    const isTextarea = step.type === 'textarea';
    const input = document.createElement(isTextarea ? 'textarea' : 'input');
    input.className = 'chat-input';
    input.placeholder = step.placeholder || '';
    input.autocomplete = step.id === 'email' ? 'email'
                      : step.id === 'nombre' ? 'name'
                      : 'off';

    if (!isTextarea) {
      input.type = step.type === 'email' ? 'email'
                 : step.type === 'tel'   ? 'tel'
                 : 'text';
    } else {
      input.rows = 2;
    }

    const sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.className = 'chat-input-send';
    sendBtn.setAttribute('aria-label', 'Enviar');
    sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';

    row.appendChild(input);
    row.appendChild(sendBtn);
    elements.inputArea.appendChild(row);

    // Mensaje de error (oculto inicialmente)
    const errorEl = document.createElement('div');
    errorEl.className = 'chat-input-error';
    errorEl.style.display = 'none';
    elements.inputArea.appendChild(errorEl);

    // Botón "saltear" si la pregunta es opcional
    if (step.skippable) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'chat-input-skip';
      skip.textContent = 'Saltar este paso →';
      skip.addEventListener('click', () => {
        if (isAnimating) return;
        handleAnswer(step, '', '(sin detalles adicionales)');
      });
      elements.inputArea.appendChild(skip);
    }

    // Eventos
    function submit() {
      if (isAnimating) return;
      const value = input.value.trim();

      if (!value && step.skippable) {
        handleAnswer(step, '', '(sin detalles adicionales)');
        return;
      }

      if (step.validate) {
        const result = step.validate(value);
        if (result !== true) {
          input.classList.add('chat-input--error');
          errorEl.textContent = result;
          errorEl.style.display = 'block';
          input.focus();
          return;
        }
      } else if (!value) {
        input.classList.add('chat-input--error');
        errorEl.textContent = 'Por favor escribí una respuesta.';
        errorEl.style.display = 'block';
        return;
      }

      handleAnswer(step, value, value);
    }

    sendBtn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      // Enter envía, Shift+Enter hace salto de línea (solo textarea)
      if (e.key === 'Enter' && (!isTextarea || !e.shiftKey)) {
        e.preventDefault();
        submit();
      }
    });
    input.addEventListener('input', () => {
      input.classList.remove('chat-input--error');
      errorEl.style.display = 'none';
    });
  }

  // ── Flujo principal ──────────────────────────────────────────
  async function showStep(step) {
    isAnimating = true;
    clearInputArea();

    // Resolver el texto del bot (puede ser string, array, o función)
    let messages = typeof step.bot === 'function' ? step.bot(answers) : step.bot;
    if (!Array.isArray(messages)) messages = [messages];

    // Mostrar cada mensaje del bot con typing indicator
    for (let i = 0; i < messages.length; i++) {
      showTyping();
      await delay(randomDelay());
      hideTyping();
      appendBotMessage(messages[i]);
      if (i < messages.length - 1) await delay(300);
    }

    // Mostrar el input correspondiente
    if (step.type === 'quick-replies') {
      renderQuickReplies(step);
    } else {
      renderTextInput(step);
    }

    isAnimating = false;
  }

  function handleAnswer(step, value, displayText) {
    if (isAnimating) return;

    answers[step.id] = value;

    // Mostrar la respuesta del usuario en el chat
    appendUserMessage(displayText || value || '(sin respuesta)');

    // Mostrar botón de reiniciar a partir del paso 2
    if (currentStep >= 1 && elements.restartBtn) {
      elements.restartBtn.classList.add('visible');
    }

    currentStep++;
    updateProgress();

    if (currentStep < STEPS.length) {
      showStep(STEPS[currentStep]);
    } else {
      finish();
    }
  }

  // ── Cierre: resumen + botón de WhatsApp ──────────────────────
  async function finish() {
    isAnimating = true;
    clearInputArea();

    // Mensaje final del bot
    showTyping();
    await delay(randomDelay());
    hideTyping();
    appendBotMessage('¡Listo! 🎉 Tengo todo lo que necesitamos.');
    await delay(400);

    showTyping();
    await delay(randomDelay());
    hideTyping();
    appendBotMessage(`Revisá el resumen y, si está todo bien, te llevo a WhatsApp con la consulta pre-cargada. Un especialista te va a responder a la brevedad.`);

    await delay(300);

    // Renderizar resumen
    renderSummary();

    // Renderizar botón de WhatsApp
    renderWhatsAppCTA();

    isAnimating = false;
  }

  function renderSummary() {
    const summary = document.createElement('div');
    summary.className = 'chat-summary';

    const items = [
      { icon: 'fa-user',          label: 'Nombre',     value: answers.nombre },
      { icon: 'fa-building',      label: 'Tipo de obra', value: answers.tipo_obra },
      { icon: 'fa-location-dot', label: 'Ubicación',  value: answers.ubicacion },
      { icon: 'fa-ruler-combined', label: 'Superficie', value: answers.superficie },
      { icon: 'fa-list-check',   label: 'Etapa',      value: answers.etapa },
      { icon: 'fa-clock',         label: 'Plazo',      value: answers.plazo },
      { icon: 'fa-envelope',     label: 'Email',      value: answers.email },
    ];

    if (answers.detalles && answers.detalles.trim()) {
      items.push({ icon: 'fa-comment-dots', label: 'Detalles', value: answers.detalles });
    }

    summary.innerHTML = `
      <p class="chat-summary__title">📋 Resumen de tu consulta</p>
      <div class="chat-summary__list">
        ${items.map(item => `
          <div class="chat-summary__item">
            <i class="fa-solid ${item.icon}"></i>
            <div>
              <span class="chat-summary__label">${escapeHtml(item.label)}</span>
              <span class="chat-summary__value">${escapeHtml(item.value || '—')}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    elements.messages.appendChild(summary);
    scrollToBottom();
  }

  function renderWhatsAppCTA() {
    const cta = document.createElement('div');
    cta.className = 'chat-cta-whatsapp';

    const whatsappURL = buildWhatsAppURL();

    cta.innerHTML = `
      <a href="${whatsappURL}" target="_blank" rel="noopener" class="chat-cta-whatsapp__btn">
        <i class="fa-brands fa-whatsapp"></i>
        <span>Continuar por WhatsApp</span>
      </a>
      <p class="chat-cta-whatsapp__hint">
        Se abrirá WhatsApp con tu consulta lista para enviar.<br>
        Sólo tenés que tocar enviar.
      </p>
    `;

    elements.messages.appendChild(cta);
    scrollToBottom();
  }

  function buildWhatsAppURL() {
    // Mensaje formateado para WhatsApp (usa *negrita* nativa de WhatsApp)
    const lines = [
      `¡Hola Empresa Constructora! 👋 Vi su web y quiero consultar sobre un proyecto.`,
      ``,
      `*📋 Datos de mi consulta:*`,
      ``,
      `👤 *Nombre:* ${answers.nombre}`,
      `🏗️ *Tipo de obra:* ${answers.tipo_obra}`,
      `📍 *Ubicación:* ${answers.ubicacion}`,
      `📐 *Superficie:* ${answers.superficie}`,
      `📊 *Etapa:* ${answers.etapa}`,
      `⏱️ *Plazo:* ${answers.plazo}`,
      `✉️ *Email:* ${answers.email}`,
    ];

    if (answers.detalles && answers.detalles.trim()) {
      lines.push(``, `💬 *Detalles adicionales:*`, answers.detalles.trim());
    }

    lines.push(``, `¡Gracias! Quedo atento/a a su respuesta.`);

    const message = lines.join('\n');
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  // ── Reinicio ────────────────────────────────────────────────
  function restart() {
    if (!confirm('¿Querés empezar el chat de nuevo? Se perderán las respuestas.')) {
      return;
    }
    currentStep = 0;
    answers = {};
    elements.messages.innerHTML = '';
    elements.restartBtn?.classList.remove('visible');
    updateProgress();
    showStep(STEPS[0]);
  }

  // ── Inicialización ──────────────────────────────────────────
  function init() {
    const container = document.getElementById('chat-contacto');
    if (!container) return;

    elements = {
      container,
      messages:    container.querySelector('.chat-contacto__messages'),
      inputArea:   container.querySelector('.chat-contacto__input-area'),
      progressBar: container.querySelector('.chat-contacto__progress-bar'),
      restartBtn:  container.querySelector('.chat-contacto__restart'),
    };

    if (!elements.messages || !elements.inputArea) {
      console.warn('[ChatContacto] DOM incompleto, abortando init.');
      return;
    }

    elements.restartBtn?.addEventListener('click', restart);

    // Primer paso
    showStep(STEPS[0]);
  }

  return { init };

})();

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  ChatContactoModule.init();
});

window.ChatContactoModule = ChatContactoModule;
