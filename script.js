/* =========================================================
   HERO: "signal from noise"
   Thousands of glyphs (Latin, Arabic, digits, @ and #) drift
   like raw media chatter, then lock into Ahmed's name.
   The cursor scatters them back into noise.
   ========================================================= */
(() => {
  const cv = document.getElementById('signal');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLYPHS = '01#@%&+*=<>/ابتجحدرسصطعفقكلمنهوي'.split('');
  const C = { noise: 'rgba(91,140,196,.42)', signal: '#EAF0F7', hot: '#F59FAE', mint: '#6FE3C1' };
  let W, H, dpr, pts = [], glyph = 8, start = performance.now();
  const mouse = { x: -9999, y: -9999 };

  function targets() {
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const o = off.getContext('2d');
    const twoLines = W < 820;
    const lines = twoLines ? ['AHMED', 'ELABGARI'] : ['AHMED ELABGARI'];
    let size = twoLines ? W * 0.2 : W * 0.105;
    size = Math.min(size, H * (twoLines ? 0.17 : 0.24));
    const setFont = () => o.font = `800 ${size}px "Bricolage Grotesque", "IBM Plex Sans", sans-serif`;
    setFont();
    const widest = Math.max(...lines.map(l => o.measureText(l).width));
    const maxW = W * (twoLines ? 0.88 : 0.86);
    if (widest > maxW) { size *= maxW / widest; setFont(); }
    o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#fff';
    const cy = H * (twoLines ? 0.34 : 0.42);
    lines.forEach((l, i) => o.fillText(l, W / 2, cy + (i - (lines.length - 1) / 2) * size * 0.98));
    const step = Math.max(4, Math.round(size / 24));
    glyph = step * 1.55;
    const data = o.getImageData(0, 0, W, H).data, out = [];
    for (let y = 0; y < H; y += step)
      for (let x = 0; x < W; x += step)
        if (data[(y * W + x) * 4 + 3] > 140) out.push([x, y]);
    return out;
  }

  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = targets();
    const extra = Math.min(1400, Math.round(W * H / 1800));
    pts = [];
    const mk = (tx, ty) => ({
      x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, tx, ty,
      ch: GLYPHS[(Math.random() * GLYPHS.length) | 0], heat: 0, delay: Math.random() * 900
    });
    t.forEach(([x, y]) => pts.push(mk(x, y)));
    for (let i = 0; i < extra; i++) pts.push(mk(null, null));
    if (reduce) pts.forEach(p => { if (p.tx !== null) { p.x = p.tx; p.y = p.ty; } });
    start = performance.now();
  }

  function frame(now) {
    const el = now - start;
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const R = Math.min(150, W * 0.14), R2 = R * R;
    const noise = [], sig = [], hot = [];
    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < R2) {
        const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 2.6;
        p.vx += dx / d * f; p.vy += dy / d * f; p.heat = 1;
      }
      if (p.tx !== null && el > 400 + p.delay) {
        p.vx += (p.tx - p.x) * 0.012; p.vy += (p.ty - p.y) * 0.012;
        p.vx *= 0.86; p.vy *= 0.86;
      } else {
        const a = Math.sin(p.x * 0.004 + now * 0.0003) * Math.cos(p.y * 0.005 - now * 0.0002) * Math.PI * 2;
        p.vx += Math.cos(a) * 0.05; p.vy += Math.sin(a) * 0.05;
        p.vx *= 0.96; p.vy *= 0.96;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      }
      p.x += p.vx; p.y += p.vy;
      p.heat *= 0.965;
      if (Math.random() < 0.002) p.ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      (p.heat > 0.15 ? hot : p.tx !== null ? sig : noise).push(p);
    }
    ctx.font = `500 ${glyph * 0.8}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = C.noise; noise.forEach(p => ctx.fillText(p.ch, p.x, p.y));
    ctx.font = `600 ${glyph}px "IBM Plex Mono", monospace`;
    ctx.fillStyle = C.signal; sig.forEach(p => ctx.fillText(p.ch, p.x, p.y));
    ctx.fillStyle = C.hot; hot.forEach(p => ctx.fillText(p.ch, p.x, p.y));
    if (running) raf = requestAnimationFrame(frame);
  }

  let raf, running = false;
  const play = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  cv.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
  new IntersectionObserver(([e]) => e.isIntersecting ? play() : stop()).observe(cv);

  (document.fonts ? document.fonts.load('800 80px "Bricolage Grotesque"') : Promise.resolve())
    .catch(() => {}).then(() => { build(); play(); });
})();

/* =========================================================
   PROJECT TABS
   ========================================================= */
document.querySelectorAll('.case').forEach(cs => {
  cs.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      cs.querySelectorAll('.tab').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
      cs.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
    });
  });
});

/* =========================================================
   SLIDE DECK VIEWER (report)
   ========================================================= */
(() => {
  const deck = document.getElementById('deck');
  if (!deck) return;
  const slides = [...deck.querySelectorAll('.deck-track img')];
  const thumbs = deck.querySelector('.deck-thumbs');
  const count = deck.querySelector('.deck-count');
  const prev = deck.querySelector('.prev'), next = deck.querySelector('.next');
  let i = 0;

  slides.forEach((s, n) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Go to slide ' + (n + 1));
    b.innerHTML = `<img src="${s.getAttribute('src')}" alt="" loading="lazy">`;
    b.onclick = () => go(n);
    thumbs.appendChild(b);
  });

  function go(n) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    [...thumbs.children].forEach((t, k) => t.classList.toggle('active', k === i));
    count.textContent = `${i + 1} / ${slides.length}`;
    prev.disabled = i === 0; next.disabled = i === slides.length - 1;
  }
  prev.onclick = () => go(i - 1);
  next.onclick = () => go(i + 1);
  deck.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') go(i + 1);
    if (e.key === 'ArrowLeft') go(i - 1);
  });
  // swipe on phones
  let x0 = null;
  const track = deck.querySelector('.deck-track');
  track.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  document.getElementById('deckFull').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else deck.requestFullscreen?.();
    deck.focus();
  };
  go(0);
})();

/* =========================================================
   TABLEAU: load the live dashboard only when asked
   ========================================================= */
(() => {
  const btn = document.getElementById('loadViz');
  if (!btn) return;
  btn.onclick = () => {
    const box = document.getElementById('tableau');
    const f = document.createElement('iframe');
    f.src = 'https://public.tableau.com/views/CaseStudy_17630080940830/AhmedElabgari?:embed=y&:showVizHome=no&:display_count=n&:toolbar=bottom&:origin=viz_share_link';
    f.title = 'Interactive Tableau dashboard by Ahmed Elabgari';
    f.allowFullscreen = true;
    box.querySelector('img').replaceWith(f);
    btn.remove();
    box.classList.add('loaded');
  };
})();

/* =========================================================
   LIGHTBOX for chart galleries
   ========================================================= */
(() => {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
  let list = [], i = 0;
  function show(n) {
    i = (n + list.length) % list.length;
    const f = list[i];
    img.src = f.querySelector('img').src;
    img.alt = f.querySelector('img').alt;
    cap.textContent = f.querySelector('figcaption')?.textContent || '';
  }
  document.querySelectorAll('.gallery').forEach(g => {
    const figs = [...g.querySelectorAll('figure')];
    figs.forEach((f, n) => f.addEventListener('click', () => {
      list = figs; show(n); lb.hidden = false; document.body.style.overflow = 'hidden';
    }));
  });
  const close = () => { lb.hidden = true; document.body.style.overflow = ''; };
  lb.querySelector('.lb-close').onclick = close;
  lb.querySelector('.lb-prev').onclick = e => { e.stopPropagation(); show(i - 1); };
  lb.querySelector('.lb-next').onclick = e => { e.stopPropagation(); show(i + 1); };
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
})();

/* =========================================================
   CERTIFICATE: card tilts toward the cursor
   ========================================================= */
(() => {
  const card = document.getElementById('certCard');
  if (!card || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--ry', ((px - .5) * 14).toFixed(2) + 'deg');
    card.style.setProperty('--rx', ((.5 - py) * 10).toFixed(2) + 'deg');
    card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
    card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
  });
  card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
})();
