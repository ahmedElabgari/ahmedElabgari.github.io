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
