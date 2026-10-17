/* =====================================================================
   Ahmed Elabgari — "On air" broadcast portfolio
   ===================================================================== */
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const COL = { pos: '#5BE3B5', neu: '#6F8DB8', neg: '#FF6B7A', alert: '#FF3B4E', paper: '#F2F4F7', amber: '#FFB547' };

/* ---------- mood system: each section sets the page mood ---------- */
const Mood = (() => {
  const LABEL = { calm: 'Calm', signal: 'Signal', crisis: 'Crisis', response: 'Response', recovery: 'Recovery', resolved: 'Resolved' };
  let current = 'calm', locked = false;
  const set = m => {
    if (m === current) return;
    current = m; document.body.dataset.mood = m;
    const el = document.getElementById('railMood'); if (el) el.textContent = LABEL[m] || m;
  };
  const io = new IntersectionObserver(es => {
    if (locked) return;
    es.forEach(e => { if (e.isIntersecting) set(e.target.dataset.mood); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('[data-mood]:not(body)').forEach(s => io.observe(s));
  return { set, lock: v => { locked = v; }, get: () => current };
})();

/* ---------- HERO: every dot is a mention ---------- */
(() => {
  const cv = document.getElementById('field');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, pts = [], r = 2, start = 0;
  const mouse = { x: -9999, y: -9999 };
  const pick = () => { const v = Math.random(); return v < .42 ? 'pos' : v < .86 ? 'neu' : 'neg'; };

  function targets() {
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const o = off.getContext('2d');
    const two = W < 820;
    const lines = two ? ['AHMED', 'ELABGARI'] : ['AHMED ELABGARI'];
    let size = two ? W * .22 : W * .11;
    size = Math.min(size, H * (two ? .17 : .26));
    const font = () => o.font = `900 ${size}px "Archivo", "IBM Plex Sans", sans-serif`;
    font();
    const widest = Math.max(...lines.map(l => o.measureText(l).width)), maxW = W * (two ? .9 : .86);
    if (widest > maxW) { size *= maxW / widest; font(); }
    o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#fff';
    const cy = H * (two ? .38 : .44);
    lines.forEach((l, i) => o.fillText(l, W / 2, cy + (i - (lines.length - 1) / 2) * size * .95));
    const step = Math.max(5, Math.round(size / 20));
    r = step * .36;
    const d = o.getImageData(0, 0, W, H).data, out = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 140) out.push([x, y]);
    return out;
  }
  const mk = (x, y, tx, ty, s) => ({ x, y, vx: 0, vy: 0, tx, ty, s: s || pick(), heat: 0, delay: Math.random() * 900, life: -1 });
  function build() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = targets().map(([x, y]) => mk(Math.random() * W, Math.random() * H, x, y));
    const extra = Math.min(1100, Math.round(W * H / 2200));
    for (let i = 0; i < extra; i++) pts.push(mk(Math.random() * W, Math.random() * H, null, null));
    if (REDUCE) pts.forEach(p => { if (p.tx !== null) { p.x = p.tx; p.y = p.ty; } });
    start = performance.now();
  }
  // click: post a burst of new mentions
  cv.addEventListener('pointerdown', e => {
    const b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6;
      const p = mk(x, y, null, null); p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.life = 260; pts.push(p);
    }
  });
  function frame(now) {
    const el = now - start, disp = REDUCE ? 0 : clamp(scrollY / (H * .85));
    ctx.clearRect(0, 0, W, H);
    const R = Math.min(140, W * .14), R2 = R * R;
    const buckets = { pos: [], neu: [], neg: [], name: [], hot: [] };
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < R2) { const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 2.2; p.vx += dx / d * f; p.vy += dy / d * f; p.heat = 1; }
      if (p.tx !== null && el > 300 + p.delay && disp < .98) {
        const pull = .014 * (1 - disp);
        p.vx += (p.tx - p.x) * pull; p.vy += (p.ty - p.y) * pull;
        if (disp > .02) { p.vx += (Math.random() - .5) * disp * 2.4; p.vy += (Math.random() - .2) * disp * 1.8; }
        p.vx *= .85; p.vy *= .85;
      } else {
        const a = Math.sin(p.x * .004 + now * .0003) * Math.cos(p.y * .005 - now * .0002) * Math.PI * 2;
        p.vx += Math.cos(a) * .04; p.vy += Math.sin(a) * .04; p.vx *= .965; p.vy *= .965;
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10; if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
      }
      p.x += p.vx; p.y += p.vy; p.heat *= .975;
      if (p.life > 0 && --p.life === 0) { pts.splice(i, 1); continue; }
      if (p.heat > .12) buckets.hot.push(p);
      else if (p.tx !== null && disp < .5) buckets.name.push(p);
      else buckets[p.s].push(p);
    }
    const draw = (arr, col, rad, alpha = 1) => {
      ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.beginPath();
      arr.forEach(p => { ctx.moveTo(p.x + rad, p.y); ctx.arc(p.x, p.y, rad, 0, 6.283); }); ctx.fill();
    };
    draw(buckets.neu, COL.neu, r * .8, .55); draw(buckets.pos, COL.pos, r * .8, .6); draw(buckets.neg, COL.neg, r * .8, .6);
    // name dots: tinted by their own sentiment, mostly paper white
    draw(buckets.name.filter(p => p.s !== 'neg'), COL.paper, r, 1);
    draw(buckets.name.filter(p => p.s === 'neg'), '#D7DEE9', r, 1);
    draw(buckets.hot, COL.alert, r * 1.05, 1);
    ctx.globalAlpha = 1;
    if (running) raf = requestAnimationFrame(frame);
  }
  let raf, running = false;
  const play = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  cv.addEventListener('pointermove', e => { const b = cv.getBoundingClientRect(); mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top; });
  cv.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
  new IntersectionObserver(([e]) => e.isIntersecting ? play() : stop()).observe(cv);
  (document.fonts ? document.fonts.load('900 80px "Archivo"') : Promise.resolve()).catch(() => {}).then(() => { build(); play(); });
})();

/* ---------- story rail: broadcast clock + sentiment trace ---------- */
(() => {
  const clock = document.getElementById('railClock'), svg = document.getElementById('railTrace');
  if (!clock || !svg) return;
  const path = svg.querySelector('.rail-path'), dot = svg.querySelector('.rail-dot');
  const SENT = { calm: .55, signal: .25, crisis: -.8, response: -.1, recovery: .6, resolved: .8 };
  let pts = [];
  function layout() {
    const max = document.documentElement.scrollHeight;
    pts = [];
    document.querySelectorAll('main > section, .hero').forEach(s => {
      const top = s.offsetTop / max, h = s.offsetHeight / max;
      if (s.id === 'crisis') {
        [[0, .25], [.15, -.3], [.35, -.9], [.6, -.6], [.8, .2], [1, .55]].forEach(([f, v]) => pts.push([top + h * f, v]));
      } else pts.push([top + h * .5, SENT[s.dataset.mood] ?? .4]);
    });
    pts.sort((a, b) => a[0] - b[0]);
    const x = v => 20 + v * 16;
    path.setAttribute('d', pts.map(([y, v], i) => `${i ? 'L' : 'M'}${x(v).toFixed(1)} ${(y * 400).toFixed(1)}`).join(' '));
  }
  function at(f) {
    for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) {
      const [y0, v0] = pts[i - 1], [y1, v1] = pts[i]; return v0 + (v1 - v0) * clamp((f - y0) / ((y1 - y0) || 1));
    }
    return pts.length ? pts[pts.length - 1][1] : 0;
  }
  function update() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const f = max > 0 ? scrollY / max : 0;
    const mins = 6 * 60 + Math.round(f * 8 * 60);
    clock.textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
    const yf = (scrollY + innerHeight / 2) / document.documentElement.scrollHeight;
    dot.setAttribute('cy', (yf * 400).toFixed(1)); dot.setAttribute('cx', (20 + at(yf) * 16).toFixed(1));
  }
  addEventListener('load', () => { layout(); update(); });
  addEventListener('resize', () => { layout(); update(); });
  addEventListener('scroll', update, { passive: true });
  layout(); update();
})();

/* ---------- story: teleprompter words light as you scroll ---------- */
(() => {
  const p = document.querySelector('[data-split]'), sec = document.getElementById('story');
  if (!p) return;
  const TONE = { 'attention.': 'neu', 'mood': 'pos', 'clear': 'pos', 'briefing': 'pos', 'crisis': 'neg', 'breaks.': 'neg' };
  p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="w ${TONE[w] || ''}">${w}</span>`).join(' ');
  const spans = [...p.querySelectorAll('.w')];
  const upd = () => {
    const r = sec.getBoundingClientRect(), prog = clamp(-r.top / (r.height - innerHeight) * 1.1);
    const n = Math.round(prog * spans.length);
    spans.forEach((s, i) => s.classList.toggle('lit', REDUCE || i < n));
  };
  addEventListener('scroll', upd, { passive: true }); upd();
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
  const label = document.getElementById('sentiLabel'), score = document.getElementById('sentiScore'),
        out = document.getElementById('sentiTokens'), desk = document.querySelector('.desk'),
        mouth = document.querySelector('.mf-mouth'), mark = document.getElementById('scaleMark');
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
    label.textContent = { pos: 'Positive', neg: 'Negative', neu: 'Mixed' }[kind];
    score.textContent = 'score ' + (sc >= 0 ? '+' : '') + sc.toFixed(2);
    desk.style.setProperty('--face', `var(--${kind})`);
    const e = 84 - sc * 6, c = 84 + sc * 18;
    mouth.setAttribute('d', `M36 ${e.toFixed(1)} Q60 ${c.toFixed(1)} 84 ${e.toFixed(1)}`);
    mark.style.left = ((sc + 1) / 2 * 100).toFixed(1) + '%';
    out.innerHTML = html || '<span class="dim">Type something to see which words drive the score.</span>';
  }
  input.addEventListener('input', run);
  document.querySelectorAll('[data-ex]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.ex; run(); input.focus(); }));
  run();
})();


/* ---------- crisis: scroll-driven scenario ---------- */
(() => {
  const sec = document.getElementById('crisis');
  if (!sec) return;
  const $ = id => document.getElementById(id);
  const line = $('crLine'), area = $('crArea'), dot = $('crDot'), clip = $('crClipRect');
  const mentions = $('crMentions'), negEl = $('crNeg'), clockEl = $('crClock');
  const steps = [...document.querySelectorAll('#crSteps li')], posts = [...document.querySelectorAll('.post')];
  const breaking = $('breaking'), brText = $('breakingText');
  const right = document.querySelector('.cr-right');
  const W = 600, H = 320, N = 160;
  // the scenario curve: calm, spike, plateau, recovery
  const vol = t => 40 + 1100 * Math.exp(-Math.pow((t - .42) / .13, 2)) + 260 * Math.exp(-Math.pow((t - .6) / .1, 2));
  const neg = t => 15 + 58 * Math.exp(-Math.pow((t - .45) / .17, 2)) - 6 * clamp((t - .75) * 4);
  const MAXV = 1250;
  const X = t => t * W, Y = v => H - 20 - v / MAXV * (H - 50);
  let d = '';
  for (let i = 0; i <= N; i++) { const t = i / N; d += `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Y(vol(t)).toFixed(1)}`; }
  line.setAttribute('d', d); area.setAttribute('d', d + ` L${W} ${H} L0 ${H} Z`);
  const STEP_AT = [.2, .3, .4, .5, .6, .78];
  const fmtTime = t => { const m = 9 * 60 + Math.round(t * 150); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

  // tooltip on hover
  const tip = document.createElement('div'); tip.className = 'cr-tip'; right.appendChild(tip);
  right.addEventListener('pointermove', e => {
    const b = right.getBoundingClientRect(), t = clamp((e.clientX - b.left) / b.width);
    tip.style.left = (e.clientX - b.left) + 'px'; tip.style.top = (Y(vol(t)) / H * b.height) + 'px';
    tip.textContent = `${fmtTime(t)}  ${Math.round(vol(t))}/h  ${Math.round(neg(t))}% neg`;
  });

  function render(p) {
    const t = clamp(p);
    clip.setAttribute('width', (t * W).toFixed(1));
    dot.setAttribute('cx', X(t)); dot.setAttribute('cy', Y(vol(t)));
    mentions.textContent = Math.round(vol(t)).toLocaleString();
    negEl.textContent = Math.round(neg(t)) + '%';
    clockEl.textContent = fmtTime(t);
    steps.forEach((s, i) => { s.className = t >= STEP_AT[i] ? (t >= (STEP_AT[i + 1] ?? 1.1) ? 'done' : 'on') : ''; });
    if (t >= .92) steps.forEach(s => s.className = 'done');
    posts.forEach(el => {
      const at = +el.dataset.at, isNeg = el.classList.contains('neg');
      el.classList.toggle('show', t >= at && (!isNeg || t < .68));
    });
    // page mood follows the scenario
    const inView = sec.getBoundingClientRect().top < innerHeight * .5 && sec.getBoundingClientRect().bottom > innerHeight * .5;
    if (inView) {
      Mood.lock(true);
      const mood = t < .18 ? 'signal' : t < .66 ? 'crisis' : t < .9 ? 'response' : 'recovery';
      Mood.set(mood);
      document.body.style.setProperty('--crisis', clamp((neg(t) - 20) / 40).toFixed(2));
      breaking.classList.toggle('resolved', t >= .9);
      breaking.classList.toggle('show', t >= .9 && t < 1);
      brText.textContent = t < .5 ? 'Negative mentions surge across platforms. Escalation underway.'
        : t < .9 ? 'Briefing delivered to leadership. Stakeholder updates going out.'
        : 'Resolved: sentiment back to normal.';
    } else { Mood.lock(false); breaking.classList.remove('show'); }
  }
  let playing = false;
  const onScroll = () => {
    if (playing) return;
    const r = sec.getBoundingClientRect();
    render(-r.top / (r.height - innerHeight));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // "Play it live": run the whole scenario on a timer
  const btn = document.createElement('button'); btn.className = 'cr-play'; btn.type = 'button'; btn.textContent = 'Play it live';
  right.appendChild(btn);
  btn.addEventListener('click', () => {
    if (playing) return;
    playing = true; btn.textContent = 'Playing…';
    const t0 = performance.now(), dur = REDUCE ? 3000 : 12000;
    (function step(now) {
      const p = (now - t0) / dur; render(p);
      if (p < 1) requestAnimationFrame(step); else { playing = false; btn.textContent = 'Play it again'; setTimeout(onScroll, 1500); }
    })(t0);
  });
})();

/* ---------- coverage wall: sideways track + tune-in screens ---------- */
(() => {
  const sec = document.getElementById('coverage'), track = sec && sec.querySelector('.wall-track');
  if (!track) return;
  // a small line chart on every monitor
  sec.querySelectorAll('.mon-viz path').forEach((p, k) => {
    let d = '', y = 40;
    for (let i = 0; i <= 40; i++) {
      y = clamp(y + (Math.random() - .5) * 18 + (k === 1 && i === 22 ? -30 : 0), 8, 72);
      d += `${i ? 'L' : 'M'}${(i * 7.5).toFixed(1)} ${y.toFixed(1)}`;
    }
    p.setAttribute('d', d);
  });
  const mq = matchMedia('(min-width: 901px)');
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('seen')), { threshold: .6 });
  sec.querySelectorAll('.mon').forEach(m => io.observe(m));
  function size() {
    if (!mq.matches || REDUCE) { sec.style.height = ''; track.style.transform = ''; return; }
    sec.style.height = (track.scrollWidth - innerWidth + innerHeight * 1.2) + 'px';
  }
  function upd() {
    if (!mq.matches || REDUCE) return;
    const r = sec.getBoundingClientRect(), p = clamp(-r.top / (r.height - innerHeight));
    track.style.transform = `translateX(${-(track.scrollWidth - innerWidth) * p}px)`;
  }
  addEventListener('resize', () => { size(); upd(); }); addEventListener('load', () => { size(); upd(); });
  addEventListener('scroll', upd, { passive: true });
  size(); upd();
})();

/* ---------- reactions: how did this make you feel? ---------- */
(() => {
  const reply = document.getElementById('reactReply');
  const TEXT = {
    pos: 'Glad it landed well. Let’s talk about what we can build together.',
    neu: 'Fair enough. Give me fifteen minutes on a call to change your mind.',
    neg: 'Noted, and every crisis is a chance to recover. Tell me what to improve.'
  };
  document.querySelectorAll('[data-react]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.react;
    document.querySelectorAll('[data-react]').forEach(x => x.classList.toggle('picked', x === b));
    reply.textContent = TEXT[k];
    if (REDUCE) return;
    const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const col = { pos: COL.pos, neu: COL.neu, neg: COL.neg }[k];
    for (let i = 0; i < 36; i++) {
      const s = document.createElement('span'); s.className = 'burst'; s.style.background = col;
      s.style.left = cx + 'px'; s.style.top = cy + 'px'; document.body.appendChild(s);
      const a = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 140;
      s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * dist - 4}px, ${Math.sin(a) * dist + 40}px) scale(.3)`, opacity: 0 }],
        { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
    }
  }));
})();

/* ---------- custom cursor ---------- */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const c = document.querySelector('.cursor'), label = c.querySelector('.cursor-label');
  document.body.classList.add('has-cursor');
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; c.classList.add('on'); });
  document.addEventListener('pointerleave', () => c.classList.remove('on'));
  const LABELS = [['#field', 'post'], ['.cert-card, .gallery figure', 'view'], ['.deck-track', 'swipe'], ['.mon', 'tune in'], ['a', 'open'], ['button', 'click']];
  addEventListener('pointerover', e => {
    if (e.target.closest('input, textarea')) { c.classList.remove('on'); return; }
    c.classList.add('on');
    const hit = LABELS.find(([sel]) => e.target.closest(sel));
    c.classList.toggle('big', !!hit && hit[0] !== '#field');
    label.textContent = hit ? hit[1] : '';
  });
  (function loop() { cx += (x - cx) * .22; cy += (y - cy) * .22; c.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); })();
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

