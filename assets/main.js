/* ============================================================
   main.js — toda la interactividad del sitio en un solo archivo
   Cargado al final de <body> con: <script src="assets/main.js"></script>
   ============================================================ */

/* ---------- Modo claro/oscuro ---------- */
(function themeInit() {
  const stored = localStorage.getItem('theme');
  const theme = stored || 'dark';
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

/* ---------- Pares de secciones en columnas paralelas ---------- */
(function pairedColumns() {
  function pair(id1, id2) {
    const a = document.getElementById(id1);
    const b = document.getElementById(id2);
    if (!a || !b || !a.parentNode) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'section-pair-columns';
    a.parentNode.insertBefore(wrapper, a);
    wrapper.appendChild(a);
    wrapper.appendChild(b);
  }

  // Para cuando un lado necesita más de una sección apilada
  function pairGroups(leftIds, rightIds) {
    const leftEls = leftIds.map(id => document.getElementById(id)).filter(Boolean);
    const rightEls = rightIds.map(id => document.getElementById(id)).filter(Boolean);
    if (!leftEls.length || !rightEls.length) return;
    const anchor = leftEls[0];
    if (!anchor.parentNode) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'section-pair-columns';
    anchor.parentNode.insertBefore(wrapper, anchor);

    const leftCol = document.createElement('div');
    leftCol.className = 'column-stack';
    leftEls.forEach(el => leftCol.appendChild(el));
    wrapper.appendChild(leftCol);

    const rightCol = document.createElement('div');
    rightCol.className = 'column-stack';
    rightEls.forEach(el => rightCol.appendChild(el));
    wrapper.appendChild(rightCol);
  }

  pair('experience', 'education');
  pair('conferences', 'courses');
  pair('publications', 'research-funding');
  pairGroups(['research-methods', 'networks'], ['leadership']);
})();

/* ---------- Timeline paralela: Experience + Education, con duración real ---------- */
(function parallelTimeline() {
  const expSection = document.getElementById('experience');
  const eduSection = document.getElementById('education');
  if (!expSection || !eduSection) return;

  const expList = expSection.querySelector('.exp-list');
  const eduList = eduSection.querySelector('.exp-list');
  if (!expList || !eduList) return;

  const MONTHS = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
  const now = new Date();
  const nowVal = now.getFullYear() * 12 + now.getMonth();

  // Convierte cada mitad de un rango de fechas ("Nov 2021", "2021", "present")
  // en un valor mensual continuo (año*12 + mes), para que la posición y la
  // duración de cada barra reflejen meses reales, no solo el año.
  function parseHalf(text, isEnd) {
    const t = text.trim().toLowerCase();
    if (t === 'present' || t === 'actualidad' || t === 'ongoing') return nowVal;
    const monthMatch = t.match(/([a-záéíóú]+)\.?\s+(\d{4})/i);
    if (monthMatch) {
      const abbr = monthMatch[1].slice(0, 3);
      const monthIdx = MONTHS[abbr];
      const year = Number(monthMatch[2]);
      if (monthIdx !== undefined) return year * 12 + monthIdx;
    }
    const yearMatch = t.match(/\d{4}/);
    if (yearMatch) {
      const year = Number(yearMatch[0]);
      // Sin mes explícito: asume enero si es el inicio, diciembre si es el fin.
      return year * 12 + (isEnd ? 11 : 0);
    }
    return null;
  }

  function parseWhen(text) {
    const parts = text.split(/[—–-]/);
    if (parts.length < 2) {
      const single = parseHalf(text, false);
      return single === null ? null : { start: single, end: single };
    }
    const start = parseHalf(parts[0], false);
    const end = parseHalf(parts.slice(1).join('-'), true);
    if (start === null || end === null) return null;
    return { start: Math.min(start, end), end: Math.max(start, end) };
  }

  // Agrupa por rango exacto en meses (start-end), para que dos entradas
  // con el mismo rango se apilen juntas en vez de superponerse en la rejilla.
  function groupByRange(list) {
    const map = new Map();
    // Excluye entradas anidadas dentro de un desplegable (ej. Visiting Periods
    // dentro del PhD), para que no se cuenten como filas propias de la rejilla.
    Array.from(list.querySelectorAll('.exp-item'))
      .filter(item => !item.closest('.visiting-toggle') && !item.closest('.thesis-toggle'))
      .forEach(item => {
      const whenEl = item.querySelector('.exp-when');
      if (!whenEl) return;
      const range = parseWhen(whenEl.textContent);
      if (!range) return;
      const key = range.start + '-' + range.end;
      if (!map.has(key)) map.set(key, { start: range.start, end: range.end, items: [] });
      map.get(key).items.push(item);
    });
    return map;
  }

  const expGroups = groupByRange(expList);
  const eduGroups = groupByRange(eduList);
  if (!expGroups.size && !eduGroups.size) return;

  const allBoundaryVals = [];
  [...expGroups.values(), ...eduGroups.values()].forEach(g => {
    allBoundaryVals.push(g.start, g.end);
  });
  const minVal = Math.min(...allBoundaryVals);
  const maxVal = Math.max(...allBoundaryVals);

  // Escala continua mes a mes (no solo los meses referenciados), para que
  // la longitud de cada barra represente la duración real y dos entradas
  // del mismo año pero de meses distintos no se solapen.
  const monthRows = [];
  for (let v = maxVal; v >= minVal; v--) monthRows.push(v);
  const rowOf = new Map(monthRows.map((v, i) => [v, i + 1]));

  const grid = document.createElement('div');
  grid.className = 'parallel-timeline';

  const minYear = Math.floor(minVal / 12);
  const maxYear = Math.floor(maxVal / 12);
  for (let year = maxYear; year >= minYear; year--) {
    const decVal = Math.min(year * 12 + 11, maxVal);
    const janVal = Math.max(year * 12 + 0, minVal);
    const startRow = rowOf.get(decVal);
    const endRow = rowOf.get(janVal);
    if (startRow === undefined || endRow === undefined) continue;
    const label = document.createElement('div');
    label.className = 'parallel-year';
    label.style.gridRow = startRow + ' / ' + (endRow + 1);
    label.textContent = year;
    grid.appendChild(label);
  }

  function placeGroups(groups, columnClass) {
    groups.forEach(g => {
      // Mes más reciente = fila más pequeña (arriba); mes más antiguo = fila más grande (abajo)
      const startRow = rowOf.get(g.end);
      const endRow = rowOf.get(g.start);
      const wrapper = document.createElement('div');
      wrapper.className = 'parallel-cell ' + columnClass;
      wrapper.style.gridRow = startRow + ' / ' + (endRow + 1);
      g.items.forEach(item => wrapper.appendChild(item));
      grid.appendChild(wrapper);
    });
  }

  placeGroups(Array.from(expGroups.values()), 'parallel-cell-exp');
  placeGroups(Array.from(eduGroups.values()), 'parallel-cell-edu');

  const pairWrapper = expSection.parentElement;
  expList.remove();
  eduList.remove();
  (pairWrapper || expSection).appendChild(grid);
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

  const navLinks = Array.from(document.querySelectorAll('.topnav a[href^="#"]'));
  const navMap = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
  const sections = Array.from(document.querySelectorAll('main [id]'))
    .filter(el => el.tagName !== 'A');

  if (sections.length && navLinks.length) {
    let lastActive = null;

    function setActive(id) {
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
  const lists = document.querySelectorAll('#experience .exp-list, #visiting .exp-list, #education .exp-list');
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

  const items = document.querySelectorAll('#experience .exp-item, #visiting .exp-item, #education .exp-item');
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

/* ---------- Cifras del hero (count-up al cargar) ---------- */
(function heroStats() {
  const nums = document.querySelectorAll('.hero-stat-num');
  if (!nums.length) return;
  nums.forEach(el => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(progress * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
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

/* ---------- Sello ilustrativo (About) ---------- */
(function aboutStamp() {
  const stamp = document.querySelector('.about-stamp');
  if (!stamp) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('stamped');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  obs.observe(stamp);
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

/* ---------- Pull-stats reutilizables ---------- */
(function pullStats() {
  const stats = document.querySelectorAll('.pull-stat');
  if (!stats.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('grown');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  stats.forEach(s => obs.observe(s));
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
    { label: 'Experience', hint: 'section', href: '#experience' },
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
