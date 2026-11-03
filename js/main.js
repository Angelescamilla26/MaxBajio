(() => {
  'use strict';

  /* =========================================================
     CONFIGURACIÓN: edita solo este bloque
     ========================================================= */
  const cfg = {
    wa: '',     // WhatsApp de ventas con lada de país, solo dígitos. Ej.: '521234567890'
    mail: '',   // Correo de ventas (se usa si no hay WhatsApp). Ej.: 'ventas@dominio.com'
    zonas: []   // Colonias con cobertura confirmada. Ej.: ['Centro', 'San Juan', 'Las Palmas']
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const h = (t, c, x) => {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  const root = document.documentElement;
  const tb = $('#themeToggle');
  const tc = $('meta[name="theme-color"]');
  const yr = $('#currentYear');
  const hd = $('.site-header');
  const nl = $$('.main-nav a');
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

  /* ---------- Header: sombra y barra de progreso de lectura ---------- */
  if (hd) {
    let busy = false;
    const upd = () => {
      busy = false;
      const y = window.scrollY;
      const m = root.scrollHeight - window.innerHeight;
      hd.classList.toggle('is-scrolled', y > 8);
      hd.style.setProperty('--pg', m > 0 ? Math.min(y / m, 1).toFixed(4) : '0');
    };
    window.addEventListener('scroll', () => {
      if (busy) return;
      busy = true;
      requestAnimationFrame(upd);
    }, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
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
      const s = $(l.hash);
      if (s) so.observe(s);
    });
  }

  /* ---------- Envío de mensajes (WhatsApp, correo o copiar) ---------- */
  const copy = async t => {
    try { await navigator.clipboard.writeText(t); return true; } catch { return false; }
  };

  const send = async msg => {
    if (cfg.wa) {
      window.open(`https://wa.me/${cfg.wa.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      return 'Abrimos WhatsApp con tu mensaje listo para enviar.';
    }
    if (cfg.mail) {
      location.href = `mailto:${cfg.mail}?subject=${encodeURIComponent('Consulta de internet por fibra óptica')}&body=${encodeURIComponent(msg)}`;
      return 'Abrimos tu correo con el mensaje listo para enviar.';
    }
    return (await copy(msg))
      ? 'Copiamos tu mensaje. Pégalo en nuestro chat de ventas.'
      : `Copia este mensaje y envíalo a nuestro chat de ventas: ${msg}`;
  };

  const ldC = $('#ldC');
  const ldP = $('#ldP');
  const nt = $('#ldNote');
  if (nt && (cfg.wa || cfg.mail)) nt.hidden = true;

  const setPk = id => {
    const c = $(`.plan-card[data-plan="${id}"]`);
    if (c && ldP) ldP.value = $('h3', c).textContent.trim();
  };

  /* Al pulsar "Me interesa" o el botón del asistente, el paquete llega elegido al formulario */
  document.addEventListener('click', e => {
    const b = e.target.closest('.plan-card .button, #asGo');
    if (!b) return;
    const c = b.closest('.plan-card');
    setPk(c ? c.dataset.plan : b.dataset.plan);
  });

  /* ---------- Asistente de paquete ---------- */
  const af = $('#asForm');
  if (af) {
    const dv = $('#asDev');
    const dvo = $('#asDevO');
    const pl = $('#asPlan');
    const ds = $('#asDesc');
    const mbo = $('#asMb');
    const fl = $('#asFill');
    const t1 = $('#asT1');
    const t2 = $('#asT2');
    const go = $('#asGo');
    const sr = $('#asSr');
    const tk = $$('.gauge__ticks span');
    const ids = ['basico', 'hogar', 'plus'];
    let cur = '';
    let st;

    const fmt = s => {
      if (s < 90) return `${Math.round(s)} s`;
      if (s < 5400) return `${Math.round(s / 60)} min`;
      let hh = Math.floor(s / 3600);
      let mm = Math.round((s % 3600) / 60);
      if (mm === 60) { hh += 1; mm = 0; }
      return mm ? `${hh} h ${mm} min` : `${hh} h`;
    };

    const calc = () => {
      const d = +dv.value;
      const ex = $$('input[name="u"]:checked', af).reduce((a, i) => a + (+i.value), 0);
      const mbps = Math.ceil((10 + d * 3 + ex) / 10) * 10;
      const k = mbps <= 50 ? 0 : mbps <= 100 ? 1 : 2;
      const id = ids[k];
      const card = $(`.plan-card[data-plan="${id}"]`);
      const name = card ? $('h3', card).textContent.trim() : id;

      dvo.textContent = d;
      dv.style.setProperty('--v', `${((d - dv.min) / (dv.max - dv.min)) * 100}%`);
      mbo.textContent = `≈ ${mbps} Mbps`;
      fl.style.setProperty('--g', `${Math.min(mbps, 150) / 150 * 100}%`);
      tk.forEach((s, i) => s.classList.toggle('on', i === k));
      t1.textContent = fmt(4 * 8000 / mbps);
      t2.textContent = fmt(50 * 8000 / mbps);
      go.textContent = `Quiero el paquete ${name}`;
      go.dataset.plan = id;

      if (id !== cur) {
        pl.textContent = name;
        ds.textContent = card ? $('.plan-card__description', card).textContent : '';
        [pl, ds].forEach(el => {
          el.classList.remove('is-swap');
          void el.offsetWidth;
          el.classList.add('is-swap');
        });
        cur = id;
      }

      $$('.plan-card').forEach(c => {
        const on = c.dataset.plan === id;
        c.classList.toggle('is-rec', on);
        const tg = $('.plan-card__tag', c);
        if (tg) tg.hidden = !on;
      });

      clearTimeout(st);
      st = setTimeout(() => {
        sr.textContent = `Te sugerimos el paquete ${name}. Velocidad estimada: ${mbps} megabits por segundo.`;
      }, 700);
    };

    af.addEventListener('input', calc);
    af.addEventListener('submit', e => e.preventDefault());
    calc();
  }

  /* ---------- Verificador de cobertura ---------- */
  const ck = $('#chkForm');
  if (ck) {
    const inp = $('#chkIn');
    const out = $('#chkOut');
    const dl = $('#zonas');
    const zc = $('#zChips');
    const zn = $('#zNote');
    const zs = cfg.zonas.map(z => String(z).trim()).filter(Boolean);

    if (zs.length) {
      zs.forEach(z => {
        const o = document.createElement('option');
        o.value = z;
        dl.append(o);
        const li = h('li');
        const b = h('button', '', z);
        b.type = 'button';
        b.addEventListener('click', () => {
          inp.value = z;
          if (ck.requestSubmit) ck.requestSubmit();
          else ck.dispatchEvent(new Event('submit', { cancelable: true }));
        });
        li.append(b);
        zc.append(li);
      });
      zc.hidden = false;
      zn.hidden = true;
    }

    const say = (k, t, d) => {
      const p = h('p', 'check__msg');
      const dot = h('span', `dot dot--${k}`);
      dot.setAttribute('aria-hidden', 'true');
      p.append(dot, h('span', '', t));
      out.append(p);
      if (d) out.append(h('p', 'check__det', d));
    };

    const wab = (txt, m) => {
      const b = h('button', 'button button--primary button--small', txt);
      const fb = h('p', 'check__fb');
      b.type = 'button';
      b.addEventListener('click', async () => { fb.textContent = await send(m); });
      out.append(b, fb);
    };

    inp.addEventListener('input', () => inp.removeAttribute('aria-invalid'));

    ck.addEventListener('submit', e => {
      e.preventDefault();
      const v = inp.value.trim();
      out.hidden = false;
      out.replaceChildren();

      if (v.length < 2) {
        inp.setAttribute('aria-invalid', 'true');
        say('err', 'Escribe el nombre de tu colonia.', 'Así podemos revisar si llegamos a tu zona.');
        inp.focus();
        return;
      }

      inp.removeAttribute('aria-invalid');
      if (ldC && !ldC.value.trim()) ldC.value = v;

      const n = norm(v);
      const hit = zs.find(z => {
        const k = norm(z);
        return k === n || (n.length > 2 && (k.includes(n) || n.includes(k)));
      });
      const m = `Hola, quiero confirmar si hay cobertura de Max Bajío en mi colonia: ${v}.`;

      if (hit) {
        say('ok', `¡Tenemos cobertura en ${hit}!`, 'Elige tu paquete y déjanos tus datos para contratar.');
        const a = h('a', 'button button--primary button--small', 'Contratar ahora');
        a.href = '#contacto';
        a.addEventListener('click', () => { if (ldC) ldC.value = hit; });
        out.append(a);
      } else if (zs.length) {
        say('wait', `Aún no vemos “${v}” en nuestra lista.`, 'Escríbenos y lo revisamos contigo.');
        wab('Confirmar por WhatsApp', m);
      } else {
        say('wait', `Revisaremos “${v}”.`, 'Un asesor confirmará si hay cobertura en tu colonia.');
        wab('Confirmar por WhatsApp', m);
      }
    });
  }

  /* ---------- Formulario de contacto ---------- */
  const ld = $('#ldForm');
  if (ld) {
    const ldN = $('#ldN');
    const ms = $('#ldMsg');

    ldN.addEventListener('input', () => ldN.removeAttribute('aria-invalid'));

    ld.addEventListener('submit', async e => {
      e.preventDefault();
      const nm = ldN.value.trim();

      if (nm.length < 2) {
        ldN.setAttribute('aria-invalid', 'true');
        ms.className = 'lead__msg is-err';
        ms.textContent = 'Escribe tu nombre para continuar.';
        ldN.focus();
        return;
      }

      const col = ldC.value.trim();
      const ls = ['Hola, me interesa contratar internet por fibra óptica con Max Bajío.', `Nombre: ${nm}`];
      if (col) ls.push(`Colonia: ${col}`);
      ls.push(`Paquete: ${ldP.value || 'Aún no lo sé'}`);

      ms.className = 'lead__msg is-ok';
      ms.textContent = await send(ls.join('\n'));
    });
  }

  /* ---------- Aparición suave al hacer scroll ----------
     Solo se oculta lo que todavía está fuera de pantalla; sin JS o con
     movimiento reducido, todo el contenido se ve desde el inicio. */
  if ('IntersectionObserver' in window && !rm.matches) {
    const sel = '.section-heading, .assist, .plan-card, .band__logo, .steps li, .coverage-copy, .check, .coverage-card, .faq-intro, .faq-item, .contact-panel, .site-footer__main';
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

    $$(sel).forEach(el => {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      const i = [...el.parentElement.children].indexOf(el);
      el.style.setProperty('--d', `${Math.min(i, 4) * 80}ms`);
      el.classList.add('rv');
      ro.observe(el);
    });
  }

  /* ---------- Brillo que sigue al cursor en las tarjetas de paquetes ---------- */
  const gr = $('.plans-grid');
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