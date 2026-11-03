(() => {
  'use strict';

  const root = document.documentElement;
  const tb = document.getElementById('themeToggle');
  const tc = document.querySelector('meta[name="theme-color"]');
  const yr = document.getElementById('currentYear');
  const hd = document.querySelector('.site-header');
  const nl = [...document.querySelectorAll('.main-nav a')];
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Tema (claro por defecto; solo cambia si la persona lo elige) ---------- */
  const setTheme = t => {
    const d = t === 'dark';
    root.dataset.theme = d ? 'dark' : 'light';
    tb.setAttribute('aria-pressed', String(d));
    tb.setAttribute('aria-label', d ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    tc.content = d ? '#080f1c' : '#ffffff';
  };

  let tt;
  const fade = () => {
    if (rm.matches) return;
    root.classList.add('is-theming');
    clearTimeout(tt);
    tt = setTimeout(() => root.classList.remove('is-theming'), 450);
  };

  try {
    setTheme(localStorage.getItem('fibra-theme') === 'dark' ? 'dark' : 'light');
  } catch {
    setTheme('light');
  }

  tb.addEventListener('click', () => {
    const nx = root.dataset.theme === 'dark' ? 'light' : 'dark';
    fade();
    setTheme(nx);
    try { localStorage.setItem('fibra-theme', nx); } catch { }
  });

  window.addEventListener('storage', e => {
    if (e.key === 'fibra-theme') {
      fade();
      setTheme(e.newValue === 'dark' ? 'dark' : 'light');
    }
  });

  yr.textContent = String(new Date().getFullYear());

  /* ---------- Sombra del header al hacer scroll ---------- */
  if (hd) {
    let busy = false;
    const upd = () => {
      busy = false;
      hd.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', () => {
      if (busy) return;
      busy = true;
      requestAnimationFrame(upd);
    }, { passive: true });
    upd();
  }

  /* ---------- Enlace activo del menú ---------- */
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver(es => {
      const vis = es.filter(e => e.isIntersecting);
      if (!vis.length) return;
      const id = vis[vis.length - 1].target.id;
      nl.forEach(l => {
        const cur = l.hash === `#${id}`;
        l.classList.toggle('is-current', cur);
        if (cur) l.setAttribute('aria-current', 'location');
        else l.removeAttribute('aria-current');
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

    nl.forEach(l => {
      const s = document.querySelector(l.hash);
      if (s) so.observe(s);
    });
  }

  /* ---------- Aparición suave al hacer scroll ----------
     Solo se oculta lo que todavía está fuera de pantalla; sin JS o con
     movimiento reducido, todo el contenido se ve desde el inicio. */
  if ('IntersectionObserver' in window && !rm.matches) {
    const sel = '.section-heading, .plan-card, .coverage-copy, .coverage-card, .faq-intro, .faq-item, .contact-panel, .site-footer__main';
    const vh = window.innerHeight;

    const ro = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const dl = parseFloat(el.style.getPropertyValue('--d')) || 0;
        ro.unobserve(el);
        el.classList.add('is-in');
        setTimeout(() => {
          el.classList.remove('rv', 'is-in');
          el.style.removeProperty('--d');
        }, 1000 + dl);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll(sel).forEach(el => {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      const i = [...el.parentElement.children].indexOf(el);
      el.style.setProperty('--d', `${Math.min(i, 4) * 80}ms`);
      el.classList.add('rv');
      ro.observe(el);
    });
  }

  /* ---------- Brillo que sigue al cursor en las tarjetas de paquetes ---------- */
  const gr = document.querySelector('.plans-grid');
  if (gr && !rm.matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    gr.addEventListener('pointermove', e => {
      const c = e.target.closest('.plan-card');
      if (!c) return;
      const b = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - b.left}px`);
      c.style.setProperty('--my', `${e.clientY - b.top}px`);
    });
  }
})();