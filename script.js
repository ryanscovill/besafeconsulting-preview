// Booking form: no server, so build a pre-filled email instead.
const form = document.getElementById("contact-form");
const errorBox = document.getElementById("form-error");
const BOOKING_EMAIL = "info@besafeconsulting.ca";

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const required = [...form.querySelectorAll("[required]")];
  required.forEach((el) => el.removeAttribute("aria-invalid"));
  const missing = required.filter((el) => !el.value.trim() || !el.checkValidity());

  if (missing.length) {
    missing.forEach((el) => el.setAttribute("aria-invalid", "true"));
    const names = missing.map((el) => el.name);
    const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
    errorBox.textContent = `Add your ${list} so Dean can reply.`;
    errorBox.hidden = false;
    missing[0].focus();
    return;
  }
  errorBox.hidden = true;

  const data = new FormData(form);
  const subject = `Course booking request: ${data.get("course")}`;
  const lines = [`Name: ${data.get("name")}`, `Email: ${data.get("email")}`];
  if (data.get("organization")) lines.push(`Organization: ${data.get("organization")}`);
  lines.push(`Course: ${data.get("course")}`);
  if (data.get("size")) lines.push(`Number of people: ${data.get("size")}`);
  if (data.get("message")) lines.push("", data.get("message"));
  const body = lines.join("\n");

  window.location.href = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

document.getElementById("year").textContent = new Date().getFullYear();

// Hero water surface: a low-resolution ripple simulation. The pointer
// disturbs the surface, and light catching the slopes is drawn as soft
// highlights. Skipped entirely for people who prefer reduced motion.
(() => {
  const canvas = document.querySelector(".ripples");
  const hero = document.querySelector(".hero");
  if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const CELL = 4;          // CSS pixels per simulation cell
  const DAMPING = 0.975;   // how quickly ripples fade
  const ctx = canvas.getContext("2d");
  let w, h, current, previous, image, running = false, visible = true;

  function resize() {
    w = Math.max(2, Math.ceil(hero.clientWidth / CELL));
    h = Math.max(2, Math.ceil(hero.clientHeight / CELL));
    canvas.width = w;
    canvas.height = h;
    current = new Float32Array(w * h);
    previous = new Float32Array(w * h);
    image = ctx.createImageData(w, h);
  }

  function drop(x, y, strength, radius = 2) {
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = cx + dx, py = cy + dy;
        if (px < 1 || py < 1 || px >= w - 1 || py >= h - 1) continue;
        if (dx * dx + dy * dy <= radius * radius) previous[py * w + px] += strength;
      }
    }
  }

  function step() {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        current[i] = ((previous[i - 1] + previous[i + 1] + previous[i - w] + previous[i + w]) / 2 - current[i]) * DAMPING;
      }
    }
    [current, previous] = [previous, current];
  }

  function render() {
    const data = image.data;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const slope = (previous[i - 1] - previous[i + 1]) + (previous[i - w] - previous[i + w]);
        const o = i * 4;
        if (slope > 0) {
          data[o] = 190; data[o + 1] = 230; data[o + 2] = 255;
          data[o + 3] = Math.min(70, slope * 0.9);
        } else {
          data[o] = 2; data[o + 1] = 18; data[o + 2] = 28;
          data[o + 3] = Math.min(60, -slope * 0.7);
        }
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  let lastDrop = 0;
  function frame(time) {
    if (!visible) { running = false; return; }
    // an occasional gentle drop keeps the surface alive without a pointer
    if (time - lastDrop > 1400) {
      drop(Math.random() * hero.clientWidth, Math.random() * hero.clientHeight, 90, 3);
      lastDrop = time;
    }
    step();
    render();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  let last = null;
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // trail of small drops, spaced so fast movement doesn't flood the surface
    if (!last || Math.hypot(x - last.x, y - last.y) > CELL * 2) {
      drop(x, y, 160);
      last = { x, y };
    }
  });
  hero.addEventListener("pointerdown", (event) => {
    const rect = hero.getBoundingClientRect();
    drop(event.clientX - rect.left, event.clientY - rect.top, 500, 4);
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
  }).observe(hero);

  new ResizeObserver(resize).observe(hero);
  resize();
  start();
})();
