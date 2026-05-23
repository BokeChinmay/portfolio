(() => {
  'use strict';

  // ── Custom Cursor ─────────────────────────────────────────────
  function initCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot  = document.createElement('div');
    const ring = document.createElement('div');
    dot.className  = 'game-cursor';
    ring.className = 'game-cursor-ring';
    document.body.append(dot, ring);

    let mx = -100, my = -100, rx = -100, ry = -100;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    // Ring follows with lag
    (function animRing() {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      dot.style.left  = mx + 'px';
      dot.style.top   = my + 'px';
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(animRing);
    })();

    const hoverEls = 'a, button, .btn-link, .pill, .project, .card, .scroll-container img, .navbar-brand, .dropdown-item';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverEls)) {
        dot.classList.add('hover');
        ring.classList.add('hover');
      }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverEls)) {
        dot.classList.remove('hover');
        ring.classList.remove('hover');
      }
    });
    document.addEventListener('mousedown', () => {
      dot.style.transform = 'translate(-50%,-50%) scale(0.6)';
    });
    document.addEventListener('mouseup', () => {
      dot.style.transform = '';
    });
  }

  // ── Scroll Reveal ─────────────────────────────────────────────
  function initScrollReveal() {
    const sel = '.card, .project, .hero-card, .profile, .player-hud, .hero-stats, .footer-card';
    const targets = document.querySelectorAll(sel);

    targets.forEach((el, i) => {
      const delay = (i % 4) * 80;
      el.style.cssText += `opacity:0;transform:translateY(22px);transition:opacity 0.6s cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 0.6s cubic-bezier(0.23,1,0.32,1) ${delay}ms, border-color 0.3s, box-shadow 0.3s;`;
    });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    targets.forEach(el => obs.observe(el));
  }

  // ── Card Tilt ─────────────────────────────────────────────────
  function initCardTilt() {
    const cards = document.querySelectorAll('.project, .card');
    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
        const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
        card.style.transform = `perspective(900px) rotateY(${dx * 3}deg) rotateX(${-dy * 2}deg) translateZ(4px)`;
        card.style.transition = 'transform 0.08s';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1), border-color 0.3s, box-shadow 0.3s';
      });
    });
  }

  // ── Achievements ──────────────────────────────────────────────
  const ACHIEVEMENTS = [
    { id: 'load',       icon: '⚔️',  title: 'WORLD UNLOCKED',     desc: 'Portfolio initialized. Welcome, traveler.' },
    { id: 'project',    icon: '🔍',  title: 'ITEM INSPECTED',      desc: 'You examined a project closely.' },
    { id: 'link_hover', icon: '🎮',  title: 'INTERACTIVE ELEMENT', desc: 'A hidden door has been revealed.' },
    { id: 'footer',     icon: '🗺️',  title: 'END OF MAP',          desc: 'You explored every section.' },
  ];
  const unlocked = new Set();

  function showAchievement(id) {
    if (unlocked.has(id)) return;
    unlocked.add(id);
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return;

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="ach-inner">
        <div class="ach-icon">${def.icon}</div>
        <div>
          <div class="ach-label">Achievement Unlocked</div>
          <div class="ach-title">${def.title}</div>
          <div class="ach-desc">${def.desc}</div>
        </div>
      </div>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 3600);
  }

  function initAchievements() {
    setTimeout(() => showAchievement('load'), 1400);

    document.querySelectorAll('.project').forEach(p =>
      p.addEventListener('mouseenter', () => showAchievement('project'), { once: true }));

    document.querySelectorAll('.btn-link, .pill').forEach(l =>
      l.addEventListener('mouseenter', () => showAchievement('link_hover'), { once: true }));

    const footer = document.querySelector('.site-footer');
    if (footer) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) showAchievement('footer'); });
      }, { threshold: 0.5 });
      obs.observe(footer);
    }
  }

  // ── Animated Stat Bars & XP ───────────────────────────────────
  function initBars() {
    const bars = document.querySelectorAll('.stat-fill, .xp-fill');
    bars.forEach(el => { el._pct = el.dataset.pct; el.style.width = '0%'; });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          setTimeout(() => { el.style.width = (el._pct || '70') + '%'; }, 150);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    bars.forEach(el => obs.observe(el));
  }

  // ── Title Glitch / Scramble ───────────────────────────────────
  function initGlitch() {
    const el = document.querySelector('.hero-title');
    if (!el) return;
    const original = el.textContent.trim();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';

    function scramble(duration) {
      el.classList.add('glitch-active');
      const start = performance.now();
      (function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const rev = Math.floor(p * original.length);
        el.textContent = original.split('').map((c, i) => {
          if (i < rev || c === ' ') return c;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        if (p < 1) requestAnimationFrame(step);
        else { el.textContent = original; el.classList.remove('glitch-active'); }
      })(start);
    }
    setTimeout(() => scramble(900), 400);
  }

  // ── Section counters (subtle // 01 prefix) ───────────────────
  function initChapters() {
    document.querySelectorAll('.section-title').forEach((el, i) => {
      const num = document.createElement('span');
      num.style.cssText = `font-family:'Courier New',monospace;font-size:0.52em;letter-spacing:0.12em;color:rgba(201,164,62,0.5);margin-right:6px;font-weight:400;`;
      num.textContent = String(i + 1).padStart(2, '0');
      el.insertBefore(num, el.firstChild);
    });
  }

  // ── Page header entrance ──────────────────────────────────────
  function initPageHeader() {
    const h1 = document.querySelector('.page-header h1');
    const lede = document.querySelector('.page-header .lede');
    if (h1) {
      h1.style.cssText += 'opacity:0;transform:translateX(-14px);transition:opacity 0.55s cubic-bezier(0.23,1,0.32,1), transform 0.55s cubic-bezier(0.23,1,0.32,1);';
      setTimeout(() => { h1.style.opacity = '1'; h1.style.transform = 'translateX(0)'; }, 100);
    }
    if (lede) {
      lede.style.cssText += 'opacity:0;transform:translateX(-10px);transition:opacity 0.55s cubic-bezier(0.23,1,0.32,1) 0.1s, transform 0.55s cubic-bezier(0.23,1,0.32,1) 0.1s;';
      setTimeout(() => { lede.style.opacity = '1'; lede.style.transform = 'translateX(0)'; }, 120);
    }
  }

  // ── Init ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initScrollReveal();
    initCardTilt();
    initAchievements();
    initBars();
    initGlitch();
    initChapters();
    initPageHeader();
  });

})();
