# Empresa Constructora — Landing

Landing page de una constructora (ficticia) en **HTML, CSS y JavaScript vanilla**, sin frameworks ni librerías de build.

> Pieza de portfolio desarrollada con un enfoque **AI-first**: la IA es parte central del flujo de trabajo (diseño, maquetado e interacción) mientras yo mantengo el control sobre la arquitectura, las decisiones y el resultado final. Stack deliberadamente simple, sin frameworks. El contenido (marca, datos, obras) es **ficticio**, solo a fines de demostración.

🔗 **Demo:** https://empresa-constructora.vercel.app

## Qué tiene

- **Hero con video** en loop de fondo + imagen de respaldo (poster).
- **Portfolio filtrable** por categoría con **lightbox**, renderizado dinámicamente desde un `portfolio.json`.
- **Chat de calificación de leads**: un asistente que hace preguntas paso a paso y al final arma un mensaje pre-cargado de **WhatsApp** con todos los datos. Vive en un **botón flotante** abajo a la derecha que se despliega.
- **Diseño responsive** (mobile-first) con menú hamburguesa.
- **Animaciones on-scroll** (reveal) y microinteracciones.
- **SEO**: meta tags, Open Graph, `sitemap.xml`, `robots.txt` y datos estructurados **Schema.org** (JSON-LD).
- Paleta y tipografía centralizadas con **CSS custom properties**.

## Stack

- **HTML5** semántico
- **CSS3** — variables, Flexbox/Grid, sin preprocesadores
- **JavaScript vanilla** — sin dependencias, módulos en patrón IIFE
- Sitio **100% estático** (deploy en Vercel)

## Estructura

```
.
├── index.html            # Única página (one-page)
├── portfolio.json        # Datos de las obras (se cargan dinámicamente)
├── css/
│   ├── variables.css     # Paleta, tipografía, espaciado
│   ├── reset.css
│   ├── main.css          # Estilos principales
│   ├── chat-contacto.css # Widget de chat / WhatsApp
│   └── responsive.css
├── js/
│   ├── main.js           # Nav mobile, widget flotante, utilidades
│   ├── portfolio.js      # Render + filtros del portfolio
│   ├── chat-contacto.js  # Flujo del chat → WhatsApp
│   ├── lightbox.js
│   └── animations.js
└── assets/               # Imágenes, video, logos
```

## Correr en local

```bash
npm install      # instala "serve" (única devDependency)
npm run dev      # sirve en http://localhost:3000
```

O directamente sin instalar nada:

```bash
npx serve .
```

## Deploy

Sitio estático — se deploya en **Vercel** (la config de redirects, headers y cache está en `vercel.json`). También funciona en cualquier hosting estático (GitHub Pages, Netlify, etc.).
