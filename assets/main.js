/* ---------- 1. Modo claro/oscuro ---------- */
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

/* ---------- 2. Barra de progreso + scroll reveal ---------- */
(function scrollEffects() {
  const bar = document.getElementById('progressBar');
  if (bar) {
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = scrolled + '%';
    });
  }

  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(el => observer.observe(el));
  }
})();

/* ---------- 3. Buscador de publicaciones ---------- */
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
    });
    countEl.textContent = q ? `${visible} de ${items.length}` : '';
  }

  searchInput.addEventListener('input', filterPubs);
})();

/* ---------- 4. Botón copiar cita BibTeX ---------- */
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

/* ---------- 5. Mapa de trayectoria (SVG) ---------- */
(function journeyMap() {
  const nodes = document.querySelectorAll('.journey-node');
  const detailEl = document.getElementById('journeyDetail');
  if (!nodes.length || !detailEl) return;

  nodes.forEach(node => {
    node.addEventListener('mouseenter', () => {
      nodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');
      detailEl.textContent = `${node.dataset.city} — ${node.dataset.detail}`;
    });
  });
})();

/* ---------- 6. Command palette (Cmd+K) ---------- */
(function commandPalette() {
  const overlay = document.getElementById('cmdkOverlay');
  const input = document.getElementById('cmdkInput');
  const list = document.getElementById('cmdkList');
  if (!overlay || !input || !list) return;

  const routes = [
    { label: 'About', hint: 'section', href: '#about' },
    { label: 'Experience', hint: 'section', href: '#experience' },
    { label: 'List of Publications', hint: 'section', href: '#publications' },
    { label: 'Policy Briefs', hint: 'section', href: '#briefs' },
    { label: 'Research Journey', hint: 'section', href: '#journey' },
    { label: 'Contact', hint: 'section', href: '#contact' },
    { label: 'Download CV (PDF)', hint: 'file', href: 'assets/CV_Talavera_Lodos.pdf' },
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

  // Botón visible "⌘K" en la topbar, si existe
  const tip = document.getElementById('cmdkTip');
  if (tip) tip.addEventListener('click', openPalette);
})();
