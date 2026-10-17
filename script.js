/* =========================================================
   HERO: generative "flow field" made with p5.js
   Thousands of particles follow invisible currents (Perlin
   noise) and get pushed away by your mouse.
   Try changing the values below to change the look.
   ========================================================= */

const NUM_PARTICLES = 900;    // more = denser
const NOISE_SCALE   = 0.0025; // smaller = smoother, bigger currents
const MOUSE_RADIUS  = 140;    // how far the mouse pushes particles
const TRAIL_FADE    = 18;     // lower = longer trails (0–255)

let particles = [];

function setup() {
  const hero = document.getElementById('hero');
  const canvas = createCanvas(hero.offsetWidth, hero.offsetHeight);
  canvas.parent('hero-canvas');
  for (let i = 0; i < NUM_PARTICLES; i++) particles.push(new Particle());
  background(10, 12, 20);
}

function draw() {
  noStroke();
  fill(10, 12, 20, TRAIL_FADE);
  rect(0, 0, width, height);
  for (const p of particles) {
    p.update();
    p.show();
  }
}

function windowResized() {
  const hero = document.getElementById('hero');
  resizeCanvas(hero.offsetWidth, hero.offsetHeight);
  background(10, 12, 20);
}

class Particle {
  constructor() { this.reset(); }

  reset() {
    this.pos = createVector(random(width), random(height));
    this.prev = this.pos.copy();
    this.speed = random(0.6, 1.8);
    // 80% teal, 20% amber
    this.col = random() < 0.8 ? color(0, 200, 180, 90) : color(255, 170, 60, 110);
  }

  update() {
    this.prev.set(this.pos);
    const angle = noise(this.pos.x * NOISE_SCALE, this.pos.y * NOISE_SCALE, frameCount * 0.002) * TWO_PI * 2;
    const vel = p5.Vector.fromAngle(angle).mult(this.speed);

    const d = dist(mouseX, mouseY, this.pos.x, this.pos.y);
    if (d < MOUSE_RADIUS) {
      const push = createVector(this.pos.x - mouseX, this.pos.y - mouseY).setMag((MOUSE_RADIUS - d) * 0.03);
      vel.add(push);
    }

    this.pos.add(vel);
    if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) this.reset();
  }

  show() {
    stroke(this.col);
    strokeWeight(1.2);
    line(this.prev.x, this.prev.y, this.pos.x, this.pos.y);
  }
}

/* =========================================================
   SCROLL ANIMATIONS with GSAP
   Anything with class="reveal" fades up as you scroll to it.
   ========================================================= */

if (window.gsap) {
gsap.registerPlugin(ScrollTrigger);

gsap.from('.hero-content > *', {
  y: 30, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.3
});

gsap.utils.toArray('.reveal').forEach(el => {
  gsap.from(el, {
    y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});
}

/* =========================================================
   PROJECT TABS
   ========================================================= */
document.querySelectorAll('.case').forEach(cs => {
  cs.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      cs.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
      cs.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
      window.ScrollTrigger && ScrollTrigger.refresh();
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
