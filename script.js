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
    const disp = reduce ? 0 : Math.min(1, Math.max(0, scrollY / (H * 0.85)));
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
      if (p.tx !== null && el > 400 + p.delay && disp < 0.98) {
        const pull = 0.012 * (1 - disp);
        p.vx += (p.tx - p.x) * pull; p.vy += (p.ty - p.y) * pull;
        if (disp > 0.02) { p.vx += (Math.random() - .5) * disp * 2.2; p.vy += (Math.random() - .3) * disp * 1.6; }
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
      (p.heat > 0.15 ? hot : (p.tx !== null && disp < 0.5) ? sig : noise).push(p);
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

/* =====================================================================
   v7 — interactive layer
   ===================================================================== */
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HAS_GSAP = !!(window.gsap && window.ScrollTrigger);
if (HAS_GSAP) gsap.registerPlugin(ScrollTrigger);

/* ---------- custom cursor ---------- */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const c = document.querySelector('.cursor'), label = c.querySelector('.cursor-label');
  document.body.classList.add('has-cursor');
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; c.classList.add('on'); });
  document.addEventListener('pointerleave', () => c.classList.remove('on'));
  const LABELS = [['.cert-card, .gallery figure', 'view'], ['.deck-track', 'swipe'], ['a', 'open'], ['button', 'click']];
  addEventListener('pointerover', e => {
    if (e.target.closest('input, textarea')) { c.classList.remove('on'); return; }
    c.classList.add('on');
    const hit = LABELS.find(([sel]) => e.target.closest(sel));
    c.classList.toggle('big', !!hit);
    label.textContent = hit ? hit[1] : '';
  });
  (function loop() {
    cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
    c.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  })();
})();

/* ---------- scroll progress drawn as a signal line ---------- */
(() => {
  const svg = document.querySelector('.progress');
  if (!svg) return;
  let d = 'M0 12';
  for (let i = 1; i <= 200; i++) {
    const x = i * 5, spike = Math.random() < 0.06 ? (Math.random() * 9 + 2) : 0;
    const y = 12 + Math.sin(i * 0.55) * 2.2 + (Math.random() - .5) * 2 - spike * (Math.random() < .5 ? 1 : -1);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  const track = svg.querySelector('.progress-track'), line = svg.querySelector('.progress-line');
  track.setAttribute('d', d); line.setAttribute('d', d);
  const len = line.getTotalLength();
  line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
  const upd = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    line.style.strokeDashoffset = len * (1 - (max > 0 ? scrollY / max : 0));
  };
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
})();

/* ---------- manifesto: words light up as you scroll ---------- */
(() => {
  const p = document.querySelector('[data-split]');
  if (!p) return;
  const HL = ['signal', 'noise,', 'briefing'];
  const words = p.textContent.trim().split(/\s+/);
  p.innerHTML = words.map(w => `<span class="w${HL.includes(w) ? ' hl' : ''}">${w}</span>`).join(' ');
  const spans = [...p.querySelectorAll('.w')];
  const light = prog => { const n = Math.round(prog * spans.length); spans.forEach((s, i) => s.classList.toggle('lit', i < n)); };
  if (REDUCE) { light(1); return; }
  if (HAS_GSAP) {
    ScrollTrigger.create({ trigger: '#manifesto', start: 'top top', end: '+=120%', pin: true, scrub: true, onUpdate: st => light(st.progress * 1.08) });
  } else {
    new IntersectionObserver(([e]) => e.isIntersecting && light(1), { threshold: .4 }).observe(p);
  }
})();

/* ---------- sentiment analyzer (keyword model, EN + AR) ---------- */
(() => {
  const input = document.getElementById('sentiInput');
  if (!input) return;
  const LEX = {
    good: 1, great: 1.5, love: 1.5, excellent: 2, amazing: 2, fast: 1, quick: 1, thanks: 1.2, thank: 1.2, happy: 1.3,
    resolved: 1, fixed: 1, restored: 1.2, back: .5, helpful: 1.2, best: 1.5, awesome: 1.8, perfect: 1.8, appreciate: 1.3,
    smooth: 1, recommend: 1.2, nice: 1, wonderful: 1.8, pleased: 1.2, satisfied: 1.2, professional: 1, clear: .6,
    bad: -1.2, slow: -1, outage: -1.6, blackout: -1.8, down: -.6, angry: -1.6, terrible: -2, awful: -2, worst: -2,
    delay: -1, delayed: -1, problem: -.8, issue: -.5, issues: -.6, broken: -1.3, fail: -1.3, failed: -1.4, failure: -1.4,
    poor: -1.2, hate: -1.8, disappointed: -1.5, complaint: -1, unacceptable: -2, crisis: -1.2, expensive: -.8, rude: -1.5,
    ignored: -1.4, waiting: -.6, nobody: -.8, never: -.4,
    'شكرا': 1.2, 'شكراً': 1.2, 'ممتاز': 2, 'ممتازة': 2, 'رائع': 1.8, 'رائعة': 1.8, 'سريع': 1, 'سريعة': 1, 'جميل': 1.2,
    'احب': 1.4, 'أحب': 1.4, 'سعيد': 1.3, 'حل': .8, 'الحل': .8, 'عادت': 1, 'رجعت': 1, 'افضل': 1.3, 'أفضل': 1.3,
    'مميز': 1.4, 'جيد': 1, 'جيدة': 1, 'شاكر': 1.2, 'تحسن': 1,
    'انقطاع': -1.6, 'انقطع': -1.6, 'سيء': -1.4, 'سيئ': -1.4, 'سيئة': -1.4, 'بطيء': -1, 'بطء': -1, 'مشكلة': -.9,
    'مشاكل': -1, 'تأخير': -1, 'تأخر': -1, 'غاضب': -1.6, 'أسوأ': -2, 'اسوأ': -2, 'ضعيف': -1.2, 'عطل': -1.2,
    'معطل': -1.2, 'فاشل': -1.6, 'مستمر': -.5, 'زعلان': -1.3, 'غالي': -.8
  };
  const NEG = new Set(['not', 'no', "don't", "didn't", "isn't", "wasn't", "can't", "won't", 'without', 'لا', 'لم', 'ليس', 'ما', 'غير', 'بدون']);
  const BUT = new Set(['but', 'however', 'although', 'لكن', 'ولكن', 'بس']);
  const norm = w => {
    let t = w.toLowerCase().replace(/[ً-ْ]/g, '');
    if (LEX[t] !== undefined) return t;
    if (/^و/.test(t) && LEX[t.slice(1)] !== undefined) return t.slice(1);
    if (/^ال/.test(t) && LEX[t.slice(2)] !== undefined) return t.slice(2);
    if (/^وال/.test(t) && LEX[t.slice(3)] !== undefined) return t.slice(3);
    return t;
  };
  const needle = document.querySelector('.needle'), label = document.getElementById('sentiLabel'),
        score = document.getElementById('sentiScore'), verdict = document.querySelector('.verdict'), out = document.getElementById('sentiTokens');
  const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function run() {
    const parts = input.value.match(/[\p{L}\p{N}'’]+|[^\p{L}\p{N}'’]+/gu) || [];
    let sum = 0, negLeft = 0, boost = 1, html = '';
    for (const part of parts) {
      if (!/[\p{L}\p{N}]/u.test(part)) { html += esc(part); continue; }
      const w = norm(part.replace('’', "'"));
      if (BUT.has(w)) { boost = 1.5; html += esc(part); continue; }
      if (NEG.has(w)) { negLeft = 3; html += `<span class="tx">${esc(part)}</span>`; continue; }
      let v = LEX[w];
      if (v !== undefined) {
        if (negLeft > 0) { v = -v * .8; negLeft = 0; }
        v *= boost; sum += v;
        html += `<span class="${v > 0 ? 'tp' : 'tn'}">${esc(part)}</span>`;
      } else { html += esc(part); }
      if (negLeft > 0) negLeft--;
    }
    const sc = sum / (Math.abs(sum) + 2);
    const kind = sc > .2 ? 'pos' : sc < -.2 ? 'neg' : 'neu';
    label.textContent = { pos: 'Positive', neg: 'Negative', neu: 'Neutral / mixed' }[kind];
    score.textContent = 'score ' + (sc >= 0 ? '+' : '') + sc.toFixed(2);
    verdict.className = 'verdict ' + kind;
    needle.style.transform = `rotate(${sc * 85}deg)`;
    out.innerHTML = html || '<span class="dim">Type something to see which words drive the score.</span>';
  }
  input.addEventListener('input', run);
  document.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.ex; run(); input.focus(); }));
  run();
})();

/* ---------- crisis simulator ---------- */
(() => {
  const cv = document.getElementById('mentions');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const btn = document.getElementById('crisisBtn');
  const steps = [...document.querySelectorAll('#escalation li')];
  const negPct = document.getElementById('negPct');
  const mix = { neg: document.querySelector('.mix-neg'), neu: document.querySelector('.mix-neu'), pos: document.querySelector('.mix-pos') };
  const N = 90, data = Array.from({ length: N }, () => 38 + Math.random() * 10);
  let crisisT = -1, W = 0, H = 190, running = false, timer;

  function size() { const dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function envelope(t) { if (t < 0) return 0; if (t < 3) return t / 3; if (t < 6) return 1; if (t < 12) return 1 - (t - 6) / 6; return 0; }
  function setMix(neg) {
    const pos = Math.max(6, 40 - (neg - 18) * .8), neu = 100 - neg - pos;
    mix.neg.style.width = neg + '%'; mix.neu.style.width = neu + '%'; mix.pos.style.width = pos + '%';
    negPct.textContent = Math.round(neg) + '%';
  }
  function tick() {
    const t = crisisT >= 0 ? (performance.now() - crisisT) / 1000 : -1;
    const e = envelope(t);
    data.shift(); data.push(38 + Math.random() * 10 + e * (180 + Math.random() * 40));
    setMix(18 + e * 44 + Math.random() * 2);
    if (t > 12.5) finish();
    draw(e);
  }
  function draw(e) {
    ctx.clearRect(0, 0, W, H);
    const max = 260, step = W / (N - 1);
    const col = e > .15 ? '#F59FAE' : '#6FE3C1';
    ctx.beginPath();
    data.forEach((v, i) => { const x = i * step, y = H - 10 - (v / max) * (H - 24); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00');
    ctx.fillStyle = g; ctx.fill();
    const last = data[N - 1], y = H - 10 - (last / max) * (H - 24);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(W - 3, y, 4, 0, 7); ctx.fill();
    ctx.font = '500 12px "IBM Plex Mono", monospace'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(last) + ' / min', W - 12, Math.max(16, y - 10));
  }
  function setStep(i, cls, text) { steps[i].className = cls; if (text) steps[i].querySelector('span').textContent = text; }
  function finish() {
    crisisT = -1; document.body.classList.remove('crisis');
    btn.disabled = false; btn.textContent = 'Run it again';
    steps.forEach(s => s.classList.replace('on', 'done'));
  }
  btn.addEventListener('click', () => {
    crisisT = performance.now(); document.body.classList.add('crisis');
    btn.disabled = true; btn.textContent = 'Crisis in progress…';
    steps.forEach(s => s.className = '');
    const base = data.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const at = (ms, fn) => setTimeout(fn, REDUCE ? ms / 3 : ms);
    at(1300, () => { const now = data.slice(-3).reduce((a, b) => a + b, 0) / 3; setStep(0, 'on', `Mentions up ${Math.round((now / base - 1) * 100)}% in minutes`); });
    at(2800, () => { setStep(0, 'done'); setStep(1, 'on', `Negative share at ${negPct.textContent}, risk rated high`); });
    at(4300, () => { setStep(1, 'done'); setStep(2, 'on', 'Response team alerted with sample posts'); });
    at(5800, () => {
      setStep(2, 'done');
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setStep(3, 'on', `Briefing sent to leadership at ${t}`);
    });
  });
  const play = () => { if (!running) { running = true; timer = setInterval(tick, 280); } };
  const stop = () => { running = false; clearInterval(timer); };
  size(); draw(0);
  addEventListener('resize', () => { size(); draw(0); });
  new IntersectionObserver(([e]) => e.isIntersecting ? play() : stop()).observe(cv);
})();

/* ---------- expertise: horizontal track pinned to vertical scroll ---------- */
(() => {
  if (!HAS_GSAP || REDUCE) return;
  ScrollTrigger.matchMedia({
    '(min-width: 901px)': () => {
      const track = document.querySelector('.hz-track');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tw = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.hz-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true }
      });
      gsap.utils.toArray('.hz-glyph').forEach(g => gsap.fromTo(g, { y: 60, rotate: 10 }, {
        y: -40, rotate: -8, ease: 'none',
        scrollTrigger: { trigger: '.hz-pin', start: 'top top', end: () => '+=' + dist(), scrub: true, containerAnimation: undefined }
      }));
      return () => tw.kill();
    }
  });
  addEventListener('load', () => ScrollTrigger.refresh());
})();

/* ---------- interactive terminal ---------- */
(() => {
  const out = document.getElementById('termOut'), form = document.getElementById('termForm'), input = document.getElementById('termInput');
  if (!out) return;
  const LI = 'https://www.linkedin.com/in/ahmed-elabgari-%D8%A3%D8%AD%D9%85%D8%AF-%D8%A7%D9%84%D8%B9%D8%A8%D9%82%D8%B1%D9%8A-8b4448244/';
  const MAIL = 'ahmadalabqari@hotmail.com';
  const VERIFY = 'https://www.coursera.org/account/accomplishments/professional-cert/certificate/URWV5QBFTB5R';
  const hist = []; let hi = 0;
  const print = (html, cls = '') => { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; };
  const CMDS = {
    help: () => print(`Available commands:
  <span class="ok">about</span>        who I am
  <span class="ok">skills</span>       what I work with
  <span class="ok">projects</span>     jump to my projects
  <span class="ok">certificate</span>  my Google Data Analytics certificate
  <span class="ok">email</span>        write me an email
  <span class="ok">linkedin</span>     open my LinkedIn profile
  <span class="ok">ls</span>           list files
  <span class="ok">clear</span>        clear the screen
<span class="dim">There is also one hidden command. Hint: it starts with sudo.</span>`),
    about: () => print(`Ahmed Elabgari  <span lang="ar">أحمد العبقري</span>
Media monitoring &amp; reporting lead
Assistant Manager and Technical Project Manager, 4+ years in media monitoring, crisis reporting and data analytics.
Works in Arabic and English.`),
    whoami: () => CMDS.about(),
    skills: () => print(`Python  R (ggplot2)  SQL  Excel  PowerPoint  Tableau
AI agents  Model Context Protocol (MCP)  API integration
Sentiment analysis  share of voice  KPI reporting  dashboards`),
    projects: () => { print('Scrolling to projects…', 'dim'); document.getElementById('work').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' }); },
    certificate: () => print(`Google Data Analytics Professional Certificate
Issued by Google through Coursera, Nov 7, 2025
<span class="ok">✓ verified</span>  <a href="${VERIFY}" target="_blank" rel="noopener">open verification page</a>`),
    cert: () => CMDS.certificate(),
    email: () => { print(`Opening a new email to <a href="mailto:${MAIL}">${MAIL}</a>`); location.href = 'mailto:' + MAIL; },
    mail: () => CMDS.email(),
    linkedin: () => {
      print(`<span class="ok">200 OK</span>
{
  "name": "Ahmed Elabgari",
  "name_ar": "<span lang="ar">أحمد العبقري</span>",
  "headline": "Media Monitoring &amp; Reporting Lead",
  "profile": "<a href="${LI}" target="_blank" rel="noopener">linkedin.com/in/ahmed-elabgari</a>"
}`);
      window.open(LI, '_blank', 'noopener');
    },
    ls: () => print('about.txt   skills.sql   projects.R   certificate.pdf   contact.sh'),
    clear: () => { out.innerHTML = ''; },
    date: () => print(new Date().toString()),
    hire: () => CMDS['sudo hire ahmed'](),
    'sudo hire ahmed': () => {
      print(`<span class="warn">[sudo] password for recruiter: ********</span>
<span class="ok">Permission granted.</span> Opening an email draft…`);
      setTimeout(() => location.href = `mailto:${MAIL}?subject=${encodeURIComponent("Let's work together")}`, 900);
    },
    'مرحبا': () => print('<span lang="ar">أهلاً وسهلاً! اكتب help لعرض الأوامر.</span>'),
    'السلام عليكم': () => print('<span lang="ar">وعليكم السلام! اكتب help لعرض الأوامر.</span>')
  };
  function exec(raw) {
    const cmd = raw.trim(); if (!cmd) return;
    print(cmd.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])), 'cmd');
    hist.push(cmd); hi = hist.length;
    const key = cmd.toLowerCase().replace(/\s+/g, ' ');
    const fn = CMDS[key] || CMDS[key.split(' ')[0]] && !key.startsWith('sudo') && CMDS[key.split(' ')[0]];
    if (fn) fn();
    else if (key.startsWith('sudo')) print('Nice try. The only sudo command here is: sudo hire ahmed', 'warn');
    else print(`command not found: ${cmd.replace(/[&<>]/g, '')}. Type <span class="ok">help</span>.`, 'dim');
  }
  form.addEventListener('submit', e => { e.preventDefault(); exec(input.value); input.value = ''; });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' && hi > 0) { input.value = hist[--hi]; e.preventDefault(); }
    if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; e.preventDefault(); }
  });
  document.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('click', () => exec(b.dataset.cmd)));
  // boot message, typed once when the terminal scrolls into view
  let booted = false;
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || booted) return; booted = true;
    const lines = ['Connected to ahmed@portfolio', 'Type <span class="ok">help</span> to see what you can do.'];
    lines.forEach((l, i) => setTimeout(() => print(l, i ? '' : 'dim'), REDUCE ? 0 : 350 * (i + 1)));
  }, { threshold: .3 }).observe(out);
})();
