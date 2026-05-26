(() => {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  //  ACHIEVEMENT DEFINITIONS
  // ═══════════════════════════════════════════════════════════════

  const RARITY = {
    common:    { label: 'Common',    color: '#9aa3b8', glow: 'rgba(154,163,184,0.25)' },
    uncommon:  { label: 'Uncommon',  color: '#4ade80', glow: 'rgba(74,222,128,0.25)'  },
    rare:      { label: 'Rare',      color: '#60a5fa', glow: 'rgba(96,165,250,0.25)'  },
    epic:      { label: 'Epic',      color: '#c084fc', glow: 'rgba(192,132,252,0.25)' },
    legendary: { label: 'Legendary', color: '#c9a43e', glow: 'rgba(201,164,62,0.35)'  },
  };

  const ALL_ACHIEVEMENTS = [
    { id:'first_load',    icon:'⚔️',  rarity:'common',    title:'WORLD UNLOCKED',   desc:'Loaded the portfolio for the very first time.',          hint:'Just... show up.' },
    { id:'page_gamedev',  icon:'🎮',  rarity:'common',    title:'GAME LAUNCHER',    desc:'Visited the Game Development page.',                     hint:'Check the Projects menu.' },
    { id:'page_software', icon:'💻',  rarity:'common',    title:'STACK TRACE',      desc:'Visited the Software Development page.',                 hint:'Not everything is a game.' },
    { id:'page_narrative',icon:'📖',  rarity:'common',    title:'STORY MODE',       desc:'Visited the Narrative Writing page.',                    hint:'Words are a mechanic too.' },
    { id:'first_hover',   icon:'🔍',  rarity:'common',    title:'ITEM INSPECTED',   desc:'Hovered over a project card.',                           hint:'Look closer.' },
    { id:'github_click',  icon:'🐙',  rarity:'uncommon',  title:'SOURCE DIVER',     desc:'Opened a GitHub repository.',                            hint:'The code is out there.' },
    { id:'play_click',    icon:'▶️',  rarity:'uncommon',  title:'PLAYER ONE',       desc:'Launched a playable build.',                             hint:'Some projects are actually playable.' },
    { id:'gallery_open',  icon:'🖼️',  rarity:'uncommon',  title:'GALLERY CURATOR',  desc:'Opened a screenshot in the lightbox.',                   hint:'Some projects have more to show.' },
    { id:'all_pages',     icon:'🗺️',  rarity:'rare',      title:'COMPLETIONIST',    desc:'Visited every section of the portfolio.',                hint:'There are 5 project categories...' },
    { id:'night_owl',     icon:'🦉',  rarity:'rare',      title:'NIGHT OWL',        desc:'Visited between midnight and 5 AM.',                     hint:'Some builds are best in the dark.' },
    { id:'speed_runner',  icon:'⚡',  rarity:'rare',      title:'SPEED RUNNER',     desc:'Visited 3+ pages in under 2 minutes.',                   hint:'No loading screens here.' },
    { id:'return_visit',  icon:'🔄',  rarity:'epic',      title:'LORE KEEPER',      desc:'Returned to the portfolio on a different day.',          hint:'Good things are worth revisiting.' },
    { id:'konami',        icon:'🕹️',  rarity:'epic',      title:'CHEAT ACTIVATED',  desc:'You entered the Konami Code.',                           hint:'↑ ↑ ↓ ↓ ... you know the rest.', secret:true },
    { id:'trophy_hunter', icon:'🏆',  rarity:'legendary', title:'TROPHY HUNTER',    desc:'Unlocked 10 or more achievements. True dedication.',     hint:'Collect them all.' },
  ];

  // ═══════════════════════════════════════════════════════════════
  //  PERSISTENT STATE
  // ═══════════════════════════════════════════════════════════════

  const STORAGE_KEY = 'cg_ach_v1';

  function freshState() {
    return { unlocked:[], pages:[], timestamps:[], firstVisit:Date.now(), lastVisit:null };
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return freshState();
      const s = JSON.parse(raw);
      // Ensure all required fields exist (guard against old/partial saves)
      if (!Array.isArray(s.unlocked))    s.unlocked    = [];
      if (!Array.isArray(s.pages))       s.pages       = [];
      if (!Array.isArray(s.timestamps))  s.timestamps  = [];
      if (!s.firstVisit)                 s.firstVisit  = Date.now();
      return s;
    } catch { return freshState(); }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  const state    = loadState();
  let panelOpen  = false;
  let trophyBtn  = null;   // created in initUI()
  let panel      = null;
  let overlay    = null;

  // ═══════════════════════════════════════════════════════════════
  //  UNLOCK LOGIC  — safe to call at any time, trophyBtn may be null
  // ═══════════════════════════════════════════════════════════════

  function isUnlocked(id) { return state.unlocked.includes(id); }

  function unlock(id) {
    if (isUnlocked(id)) return;
    const def = ALL_ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return;

    state.unlocked.push(id);
    saveState();
    showToast(def);
    if (trophyBtn) updateTrophyBtn();   // safe guard

    // Check trophy hunter (10+)
    if (state.unlocked.filter(u => u !== 'trophy_hunter').length >= 10
        && !isUnlocked('trophy_hunter')) {
      setTimeout(() => unlock('trophy_hunter'), 1800);
    }
    if (panelOpen) patchPanel();
  }

  // ═══════════════════════════════════════════════════════════════
  //  PAGE TRACKING
  // ═══════════════════════════════════════════════════════════════

  const PAGE_MAP = {
    development: 'page_gamedev',
    software:    'page_software',
    narrative:   'page_narrative',
  };
  const ALL_SECTION_PAGES = ['development','production','narrative','software','web'];

  function trackPageVisit() {
    const page = (window.location.pathname.split('/').pop().replace('.html','')) || 'index';

    // Timestamps for speed runner
    state.timestamps.push(Date.now());
    if (state.timestamps.length > 20) state.timestamps = state.timestamps.slice(-20);

    // Record page
    if (!state.pages.includes(page)) state.pages.push(page);

    saveState();

    // Completionist
    if (ALL_SECTION_PAGES.every(p => state.pages.includes(p))) unlock('all_pages');

    // Speed runner: 3+ unique page visits within 2 min
    const cutoff = Date.now() - 2 * 60 * 1000;
    if (state.timestamps.filter(t => t > cutoff).length >= 3) unlock('speed_runner');

    // Night owl
    const h = new Date().getHours();
    if (h >= 0 && h < 5) unlock('night_owl');

    // Return visit
    if (state.lastVisit) {
      if (new Date(state.lastVisit).toDateString() !== new Date().toDateString()) {
        unlock('return_visit');
      }
    }
    state.lastVisit = Date.now();
    saveState();

    // Page-specific — called LAST so trophyBtn will exist by the time we get here
    // (trackPageVisit is now called after initUI)
    if (PAGE_MAP[page]) unlock(PAGE_MAP[page]);
  }

  // ═══════════════════════════════════════════════════════════════
  //  TOAST
  // ═══════════════════════════════════════════════════════════════

  function showToast(def) {
    const r = RARITY[def.rarity];
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="ach-inner" style="border-color:${r.color}40;box-shadow:0 0 32px ${r.glow},0 8px 40px rgba(0,0,0,0.6);">
        <div class="ach-icon">${def.icon}</div>
        <div>
          <div class="ach-label">Achievement Unlocked</div>
          <div class="ach-title">${def.title}</div>
          <div class="ach-desc">${def.desc}</div>
          <div class="ach-rarity" style="color:${r.color}">${r.label}</div>
        </div>
      </div>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 3800);
  }

  // ═══════════════════════════════════════════════════════════════
  //  TROPHY BUTTON
  // ═══════════════════════════════════════════════════════════════

  function updateTrophyBtn() {
    if (!trophyBtn) return;
    const count = state.unlocked.length;
    const total = ALL_ACHIEVEMENTS.length;
    trophyBtn.innerHTML = `
      <span class="trophy-icon">🏆</span>
      <span class="trophy-count">${count}<span class="trophy-total">/${total}</span></span>`;
  }

  // ═══════════════════════════════════════════════════════════════
  //  PANEL
  // ═══════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════
  //  PANEL — build DOM once, patch text/classes on subsequent opens
  // ═══════════════════════════════════════════════════════════════

  let panelBuilt = false;

  // Rarity-keyed CSS classes keep inline styles out of the DOM
  // (inline styles force per-element style recalc; classes are cached)
  const RARITY_CLASS = {
    common: 'r-common', uncommon: 'r-uncommon', rare: 'r-rare',
    epic: 'r-epic', legendary: 'r-legendary',
  };

  function buildPanel() {
    const order = ['common','uncommon','rare','epic','legendary'];

    const sectionsHTML = order.map(r => {
      const achs = ALL_ACHIEVEMENTS.filter(a => a.rarity === r);
      const rc   = RARITY[r];
      const cards = achs.map(a => `
        <div class="ach-card ${RARITY_CLASS[r]}" data-id="${a.id}">
          <div class="ach-card-icon">${a.icon}</div>
          <div class="ach-card-body">
            <div class="ach-card-title">${a.secret ? '???' : a.title}</div>
            <div class="ach-card-desc">${a.hint}</div>
          </div>
          <div class="ach-card-status"><span class="ach-lock">🔒</span></div>
        </div>`).join('');

      return `
        <div class="ach-group">
          <div class="ach-group-header">
            <span class="ach-group-dot ${RARITY_CLASS[r]}"></span>
            <span class="ach-group-label ${RARITY_CLASS[r]}">${rc.label.toUpperCase()}</span>
            <span class="ach-group-count" data-rarity="${r}">0/${achs.length}</span>
          </div>
          ${cards}
        </div>`;
    }).join('');

    panel.innerHTML = `
      <div class="ach-panel-header">
        <div>
          <div class="ach-panel-title">🏆 Achievements</div>
          <div class="ach-panel-sub" id="ach-panel-sub">0 of ${ALL_ACHIEVEMENTS.length} unlocked</div>
        </div>
        <button class="ach-close-btn" id="ach-close-btn" aria-label="Close">✕</button>
      </div>
      <div class="ach-progress-wrap">
        <div class="ach-progress-track">
          <div class="ach-progress-fill" id="ach-progress-fill"></div>
        </div>
        <span class="ach-progress-pct" id="ach-progress-pct">0%</span>
      </div>
      <div class="ach-panel-body">${sectionsHTML}</div>`;

    document.getElementById('ach-close-btn').addEventListener('click', closePanel);
    panelBuilt = true;
  }

  function patchPanel() {
    // Only touch the nodes that may have changed — no full rebuild
    const count = state.unlocked.length;
    const total = ALL_ACHIEVEMENTS.length;
    const pct   = Math.round((count / total) * 100);

    const subEl  = document.getElementById('ach-panel-sub');
    const fillEl = document.getElementById('ach-progress-fill');
    const pctEl  = document.getElementById('ach-progress-pct');
    if (subEl)  subEl.textContent  = `${count} of ${total} unlocked`;
    if (fillEl) fillEl.style.width = pct + '%';
    if (pctEl)  pctEl.textContent  = pct + '%';

    // Patch per-rarity counts
    const order = ['common','uncommon','rare','epic','legendary'];
    order.forEach(r => {
      const achs    = ALL_ACHIEVEMENTS.filter(a => a.rarity === r);
      const rCount  = achs.filter(a => isUnlocked(a.id)).length;
      const countEl = panel.querySelector(`.ach-group-count[data-rarity="${r}"]`);
      if (countEl) countEl.textContent = `${rCount}/${achs.length}`;
    });

    // Patch each achievement card
    ALL_ACHIEVEMENTS.forEach(a => {
      const card = panel.querySelector(`.ach-card[data-id="${a.id}"]`);
      if (!card) return;
      const unlocked = isUnlocked(a.id);
      const wasUnlocked = card.classList.contains('ach-unlocked');
      if (unlocked === wasUnlocked) return; // nothing changed — skip

      card.classList.toggle('ach-unlocked', unlocked);
      card.classList.toggle('ach-locked',   !unlocked);
      card.querySelector('.ach-card-icon').style.filter = unlocked ? '' : 'grayscale(1) opacity(0.3)';
      card.querySelector('.ach-card-title').textContent = unlocked
        ? a.title
        : (a.secret ? '???' : a.title);
      card.querySelector('.ach-card-desc').innerHTML = unlocked
        ? a.desc
        : `<em>${a.hint}</em>`;
      card.querySelector('.ach-card-status').innerHTML = unlocked
        ? `<span class="ach-check">✓</span>`
        : `<span class="ach-lock">🔒</span>`;
    });
  }

  function openPanel() {
    panelOpen = true;
    if (!panelBuilt) buildPanel();
    patchPanel();
    overlay.classList.add('show');
    panel.classList.add('show');
    trophyBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closePanel() {
    panelOpen = false;
    overlay.classList.remove('show');
    panel.classList.remove('show');
    if (trophyBtn) trophyBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ═══════════════════════════════════════════════════════════════
  //  INIT UI  — must run before trackPageVisit
  // ═══════════════════════════════════════════════════════════════

  function initUI() {
    // Trophy button
    trophyBtn = document.createElement('button');
    trophyBtn.id = 'trophy-btn';
    trophyBtn.setAttribute('aria-label', 'View achievements');
    updateTrophyBtn();
    trophyBtn.addEventListener('click', () => panelOpen ? closePanel() : openPanel());
    document.body.appendChild(trophyBtn);

    // Panel overlay
    overlay = document.createElement('div');
    overlay.id = 'ach-overlay';
    overlay.addEventListener('click', closePanel);

    // Panel
    panel = document.createElement('div');
    panel.id = 'ach-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    document.body.append(overlay, panel);
  }

  // ═══════════════════════════════════════════════════════════════
  //  INTERACTION TRIGGERS
  // ═══════════════════════════════════════════════════════════════

  function initTriggers() {
    // Project hover
    document.querySelectorAll('.project').forEach(p =>
      p.addEventListener('mouseenter', () => unlock('first_hover'), { once:true }));

    // GitHub links
    document.querySelectorAll('a[href*="github.com"]').forEach(a =>
      a.addEventListener('click', () => unlock('github_click')));

    // Playable builds
    document.querySelectorAll('a[href*="itch.io"], a[href*="igme-202"]').forEach(a =>
      a.addEventListener('click', () => unlock('play_click')));
    document.querySelectorAll('.btn-link').forEach(a => {
      if (a.querySelector('.fa-gamepad')) a.addEventListener('click', () => unlock('play_click'));
    });

    // Gallery lightbox
    document.querySelectorAll('.myImg, .scroll-container img').forEach(img =>
      img.addEventListener('click', () => unlock('gallery_open')));
  }

  // ═══════════════════════════════════════════════════════════════
  //  KONAMI CODE
  // ═══════════════════════════════════════════════════════════════

  function initKonami() {
    const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let idx = 0;
    document.addEventListener('keydown', e => {
      idx = (e.key === SEQ[idx]) ? idx + 1 : (e.key === SEQ[0] ? 1 : 0);
      if (idx === SEQ.length) { unlock('konami'); idx = 0; }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  CURSOR  — uses transform for GPU positioning, no transition conflict
  // ═══════════════════════════════════════════════════════════════

  function initCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot  = document.createElement('div');
    const ring = document.createElement('div');
    dot.className  = 'game-cursor';
    ring.className = 'game-cursor-ring';
    document.body.append(dot, ring);

    let mx = -200, my = -200;   // start off-screen — no (0,0) flash
    let rx = -200, ry = -200;
    let running = true;
    let scale = 1;

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      dot.classList.add('visible');
      ring.classList.add('visible');
    }, { passive: true });

    // Pause the loop when tab is hidden — saves CPU entirely
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) loop();
    });

    function loop() {
      if (!running) return;

      // Lerp ring toward dot position
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;

      // Direct style.transform — bypasses style recalc, hits compositor only
      dot.style.transform  = `translate(${mx}px,${my}px) translate(-50%,-50%) scale(${scale})`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;

      requestAnimationFrame(loop);
    }
    loop(); // start immediately

    // Hover states
    const hov = 'a,button,.btn-link,.pill,.project,.card,.scroll-container img,.navbar-brand,.dropdown-item,#trophy-btn';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hov)) { dot.classList.add('hover'); ring.classList.add('hover'); }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hov)) { dot.classList.remove('hover'); ring.classList.remove('hover'); }
    });
    document.addEventListener('mousedown', () => { scale = 0.6; });
    document.addEventListener('mouseup',   () => { scale = 1;   });
  }

  // ═══════════════════════════════════════════════════════════════
  //  SCROLL REVEAL
  // ═══════════════════════════════════════════════════════════════

  function initScrollReveal() {
    const sel = '.card,.project,.hero-card,.profile,.player-hud,.hero-stats,.footer-card';
    const els = document.querySelectorAll(sel);
    els.forEach((el, i) => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(20px)';
      const delay = (i % 4) * 70;
      el.style.transition = `opacity 0.55s cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 0.55s cubic-bezier(0.23,1,0.32,1) ${delay}ms`;
    });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity   = '1';
          e.target.style.transform = 'translateY(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });

    els.forEach(el => obs.observe(el));
  }

  // ═══════════════════════════════════════════════════════════════
  //  CARD TILT — throttled with RAF
  // ═══════════════════════════════════════════════════════════════

  function initCardTilt() {
    document.querySelectorAll('.project,.card').forEach(card => {
      let ticking = false;
      let lastE   = null;

      card.addEventListener('mousemove', e => {
        lastE = e;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          if (lastE) {
            const r  = card.getBoundingClientRect();
            const dx = (lastE.clientX - r.left - r.width  / 2) / (r.width  / 2);
            const dy = (lastE.clientY - r.top  - r.height / 2) / (r.height / 2);
            card.style.transition = 'none';
            card.style.transform  = `perspective(900px) rotateY(${dx * 2.5}deg) rotateX(${-dy * 1.5}deg) translateZ(3px)`;
          }
          ticking = false;
        });
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        lastE = null;
        card.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1), border-color 0.3s, box-shadow 0.3s';
        card.style.transform  = '';
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  STAT / XP BARS
  // ═══════════════════════════════════════════════════════════════

  function initBars() {
    const bars = document.querySelectorAll('.stat-fill,.xp-fill');
    bars.forEach(el => { el._targetPct = el.dataset.pct || '70'; el.style.width = '0%'; });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          setTimeout(() => {
            el.style.transition = 'width 1.2s cubic-bezier(0.23,1,0.32,1)';
            el.style.width = el._targetPct + '%';
          }, 120);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    bars.forEach(el => obs.observe(el));
  }

  // ═══════════════════════════════════════════════════════════════
  //  TITLE GLITCH / SCRAMBLE
  // ═══════════════════════════════════════════════════════════════

  function initGlitch() {
    const el = document.querySelector('.hero-title');
    if (!el) return;
    const original = el.textContent.trim();
    const chars    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    function scramble(dur) {
      const start = performance.now();
      (function step(now) {
        const p   = Math.min((now - start) / dur, 1);
        const rev = Math.floor(p * original.length);
        el.textContent = original.split('').map((c, i) => {
          if (i < rev || c === ' ') return c;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = original;
      })(start);
    }
    setTimeout(() => scramble(900), 400);
  }

  // ═══════════════════════════════════════════════════════════════
  //  CHAPTER LABELS
  // ═══════════════════════════════════════════════════════════════

  function initChapters() {
    document.querySelectorAll('.section-title').forEach((el, i) => {
      const num = document.createElement('span');
      num.style.cssText = `font-family:'Courier New',monospace;font-size:0.52em;letter-spacing:0.12em;color:rgba(201,164,62,0.5);margin-right:6px;font-weight:400;`;
      num.textContent   = String(i + 1).padStart(2, '0');
      el.insertBefore(num, el.firstChild);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  PAGE HEADER ENTRANCE
  // ═══════════════════════════════════════════════════════════════

  function initPageHeader() {
    [
      ['.page-header h1',    '0ms'],
      ['.page-header .lede', '90ms'],
    ].forEach(([sel, delay]) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.style.opacity    = '0';
      el.style.transform  = 'translateX(-12px)';
      el.style.transition = `opacity 0.5s ease ${delay}, transform 0.5s ease ${delay}`;
      setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateX(0)'; }, 60);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  INIT — UI first, then page tracking, then everything else
  // ═══════════════════════════════════════════════════════════════

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Build trophy button + panel FIRST so unlock() is safe to call
    initUI();

    // 2. Track this page visit (may call unlock() for page achievements)
    trackPageVisit();

    // 3. First-ever visit unlock
    if (!isUnlocked('first_load')) {
      setTimeout(() => unlock('first_load'), 1200);
    }

    // 4. Interaction triggers + effects
    initTriggers();
    initKonami();
    initCursor();
    initScrollReveal();
    initCardTilt();
    initBars();
    initGlitch();
    initChapters();
    initPageHeader();
  });

})();
