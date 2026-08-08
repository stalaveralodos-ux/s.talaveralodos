/* ============================================================
   main.js — toda la interactividad del sitio en un solo archivo
   Cargado al final de <body> con: <script src="assets/main.js"></script>
   ============================================================ */

/* ---------- Modo claro/oscuro ---------- */
(function themeInit() {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }
})();

/* ---------- Barra de progreso + scroll reveal + nav activo ---------- */
(function scrollEffects() {
  const bar = document.getElementById('progressBar');
  if (bar) {
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = scrolled + '%';
    });
  }

  // Etiqueta automáticamente las secciones de contenido con .reveal,
  // sin tener que tocar el HTML de cada sección individual
  document.querySelectorAll('main .section, main .contact').forEach(el => {
    el.classList.add('reveal');
  });

  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach(el => revealObserver.observe(el));
  }

  // ---------- Nav activo según sección visible ----------
  const navLinks = Array.from(document.querySelectorAll('.topnav a[href^="#"]'));
  const navMap = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
  const sections = Array.from(document.querySelectorAll('main [id]'))
    .filter(el => el.tagName !== 'A');

  if (sections.length && navLinks.length) {
    let lastActive = null;

    function setActive(id) {
      // Si la sección visible no tiene link propio en el topbar
      // (ej. "Visiting Periods"), mantiene resaltado el link anterior
      // más cercano (ej. "Experience"), como un capítulo en curso
      let target = null;
      const idx = sections.findIndex(s => s.id === id);
      for (let i = idx; i >= 0; i--) {
        if (navMap.has(sections[i].id)) {
          target = navMap.get(sections[i].id);
          break;
        }
      }
      if (target === lastActive) return;
      navLinks.forEach(a => a.classList.remove('active'));
      if (target) target.classList.add('active');
      lastActive = target;
    }

    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, {
      rootMargin: '-45% 0px -50% 0px',
      threshold: 0
    });

    sections.forEach(s => spyObserver.observe(s));
  }
})();

/* ---------- Timeline (Experience / Visiting Periods / Education) ---------- */
(function timeline() {
  const lists = document.querySelectorAll('.exp-list');
  if (!lists.length) return;

  lists.forEach(list => {
    const fill = document.createElement('div');
    fill.className = 'exp-list-fill';
    list.insertBefore(fill, list.firstChild);
  });

  function updateFill(list) {
    const fill = list.querySelector('.exp-list-fill');
    const litItems = list.querySelectorAll('.exp-item.in-view');
    if (!fill || !litItems.length) return;
    const lastLit = litItems[litItems.length - 1];
    const listRect = list.getBoundingClientRect();
    const itemRect = lastLit.getBoundingClientRect();
    const offset = (itemRect.top - listRect.top) + (itemRect.height / 2);
    fill.style.height = offset + 'px';
  }

  const items = document.querySelectorAll('.exp-item');
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        updateFill(entry.target.closest('.exp-list'));
      }
    });
  }, { rootMargin: '-10% 0px -55% 0px', threshold: 0 });

  items.forEach(item => timelineObserver.observe(item));
})();
/* ---------- Barras de idiomas ---------- */
(function languageBars() {
  const bars = document.querySelectorAll('.lang-bar');
  if (!bars.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target.querySelector('.lang-fill');
        const level = entry.target.getAttribute('data-level');
        if (fill && level) fill.style.width = level + '%';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  bars.forEach(b => obs.observe(b));
})();

/* ---------- Mapa de fellowships ---------- */
(function fellowshipMap() {
  const items = document.querySelectorAll('#visiting .exp-item');
  const dots = document.querySelectorAll('.fellowship-dot');
  if (!items.length || !dots.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = Array.from(items).indexOf(entry.target);
        const dot = document.querySelector(`.fellowship-dot[data-index="${idx}"]`);
        if (dot) dot.classList.add('lit');
      }
    });
  }, { rootMargin: '-10% 0px -55% 0px', threshold: 0 });
  items.forEach(item => obs.observe(item));
})();

/* ---------- Gráfico de publicaciones por año ---------- */
(function pubChart() {
  const container = document.getElementById('pubChart');
  if (!container) return;

  const years = Array.from(document.querySelectorAll('#publications .pub-year'))
    .map(el => el.textContent.trim())
    .filter(y => /^\d{4}$/.test(y));
  if (!years.length) return;

  const counts = {};
  years.forEach(y => { counts[y] = (counts[y] || 0) + 1; });
  const sortedYears = Object.keys(counts).sort();
  const max = Math.max(...Object.values(counts));

  container.innerHTML = sortedYears.map(y => `
    <div class="pub-chart-col">
      <div class="pub-chart-bar-wrap">
        <div class="pub-chart-bar" style="--h: ${(counts[y] / max * 100)}%"></div>
      </div>
      <div class="pub-chart-year">${y}</div>
    </div>
  `).join('');

  const bars = container.querySelectorAll('.pub-chart-bar');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('grown');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => obs.observe(b));
})();

/* ---------- Buscador de publicaciones ---------- */
(function pubSearch() {
  const searchInput = document.getElementById('pubSearch');
  const countEl = document.getElementById('pubSearchCount');
  if (!searchInput) return;

  const items = Array.from(document.querySelectorAll('.pub-item'));

  function filterPubs() {
    const q = searchInput.value.trim().toLowerCase();
    let visible = 0;
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      const match = text.includes(q);
      item.classList.toggle('hidden', !match);
      if (match) visible++;
      if (match && q) {
        const parentDetails = item.closest('details.pub-accordion');
        if (parentDetails) parentDetails.open = true;
      }
    });
    countEl.textContent = q ? `${visible} of ${items.length}` : '';
  }

  searchInput.addEventListener('input', filterPubs);
})();

/* ---------- Botón copiar cita BibTeX ---------- */
(function citeCopy() {
  document.querySelectorAll('.cite-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-bibtex');
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.textContent;
        btn.textContent = 'Copied ✓';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1800);
      } catch (err) {
        console.error('No se pudo copiar', err);
      }
    });
  });
})();

/* ---------- Command palette (Cmd+K) ---------- */
(function commandPalette() {
  const overlay = document.getElementById('cmdkOverlay');
  const input = document.getElementById('cmdkInput');
  const list = document.getElementById('cmdkList');
  if (!overlay || !input || !list) return;

  const routes = [
    { label: 'About', hint: 'section', href: '#about' },
    { label: 'Experience', hint: 'section', href: '#experience' },
    { label: 'Visiting Periods', hint: 'section', href: '#visiting' },
    { label: 'Education', hint: 'section', href: '#education' },
    { label: 'List of Publications', hint: 'section', href: '#publications' },
    { label: 'Research Funding & Grant Preparation', hint: 'section', href: '#research-funding' },
    { label: 'Research Methods & Digital Competencies', hint: 'section', href: '#research-methods' },
    { label: 'Institutional & Leadership Roles', hint: 'section', href: '#leadership' },
    { label: 'Membership in Professional Networks', hint: 'section', href: '#networks' },
    { label: 'Selected Conferences & Seminars', hint: 'section', href: '#conferences' },
    { label: 'Selected Courses & Training', hint: 'section', href: '#courses' },
    { label: 'Contact', hint: 'section', href: '#contact' },
    { label: 'Linktree', hint: 'link', href: 'https://linktr.ee/s.talaveralodos' },
  ];

  let activeIndex = 0;
  let filtered = routes;

  function render() {
    list.innerHTML = filtered.map((r, i) => `
      <li data-href="${r.href}" class="${i === activeIndex ? 'active' : ''}">
        <span>${r.label}</span>
        <span class="cmdk-hint">${r.hint}</span>
      </li>
    `).join('');
  }

  function openPalette() {
    overlay.classList.add('open');
    input.value = '';
    filtered = routes;
    activeIndex = 0;
    render();
    setTimeout(() => input.focus(), 10);
  }

  function closePalette() {
    overlay.classList.remove('open');
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlay.classList.contains('open') ? closePalette() : openPalette();
    }
    if (e.key === 'Escape') closePalette();

    if (overlay.classList.contains('open')) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
        render();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        render();
      }
      if (e.key === 'Enter' && filtered[activeIndex]) {
        window.location.href = filtered[activeIndex].href;
        closePalette();
      }
    }
  });

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    filtered = routes.filter(r => r.label.toLowerCase().includes(q));
    activeIndex = 0;
    render();
  });

  list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li) {
      window.location.href = li.dataset.href;
      closePalette();
    }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePalette();
  });

  const tip = document.getElementById('cmdkTip');
  if (tip) tip.addEventListener('click', openPalette);
})();
