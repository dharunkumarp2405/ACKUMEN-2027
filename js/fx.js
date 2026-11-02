// ACKUMEN 2027 - lightning strikes + registration countdown

// ---------- Lightning ----------
(function () {
  const canvas = document.getElementById('lightning');
  const flash = document.querySelector('.bg-flash');
  if (!canvas) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Strike timing: first bolt shortly after load, then every 6-12 seconds.
  const MIN_GAP = 6000, MAX_GAP = 12000;

  function bolt(x1, y1, x2, y2, spread, out) {
    // midpoint displacement
    if (Math.hypot(x2 - x1, y2 - y1) < 14) { out.push([x1, y1, x2, y2]); return; }
    const mx = (x1 + x2) / 2 + (Math.random() - .5) * spread;
    const my = (y1 + y2) / 2 + (Math.random() - .5) * spread * .4;
    bolt(x1, y1, mx, my, spread / 2, out);
    bolt(mx, my, x2, y2, spread / 2, out);
  }

  function buildStrike() {
    const x1 = W * (.1 + Math.random() * .8);
    const x2 = x1 + (Math.random() - .5) * W * .3;
    const y2 = H * (.45 + Math.random() * .5);          // lands somewhere on the page
    const main = [];
    bolt(x1, -10, x2, y2, H * .35, main);
    const branches = [];
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const s = main[Math.floor(main.length * (.15 + Math.random() * .6))];
      const dir = Math.random() < .5 ? -1 : 1;
      const len = H * (.12 + Math.random() * .22);
      const seg = [];
      bolt(s[0], s[1], s[0] + dir * len * (.5 + Math.random()), s[1] + len, len * .6, seg);
      branches.push(seg);
    }
    return { main, branches, hit: [x2, y2] };
  }

  function draw(strike, alpha) {
    ctx.clearRect(0, 0, W, H);
    if (alpha <= 0) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pass = (segs, width, color, blur, a) => {
      ctx.globalAlpha = alpha * a;
      ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.lineWidth = width;
      ctx.beginPath();
      segs.forEach(s => { ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); });
      ctx.stroke();
    };
    const all = strike.main;
    pass(all, 9, '#ff2a2a', 30, .55);   // red glow, matching the theme
    pass(all, 4, '#ffd98a', 14, .9);    // gold body
    pass(all, 1.6, '#ffffff', 6, 1);    // hot core
    strike.branches.forEach(b => { pass(b, 5, '#ff2a2a', 18, .45); pass(b, 1.2, '#fff1cf', 6, .9); });
    // impact glow
    const g = ctx.createRadialGradient(strike.hit[0], strike.hit[1], 0, strike.hit[0], strike.hit[1], 160);
    g.addColorStop(0, 'rgba(255,230,170,' + (.5 * alpha) + ')');
    g.addColorStop(1, 'rgba(255,40,40,0)');
    ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.fillStyle = g;
    ctx.fillRect(strike.hit[0] - 160, strike.hit[1] - 160, 320, 320);
  }

  function strike() {
    const s = buildStrike();
    // flicker: on / off / on / fade, like a real stroke
    const frames = [1, .15, .9, .35, .75, .5, .3, .15, 0];
    let i = 0;
    (function step() {
      const a = frames[i];
      draw(s, a);
      if (flash) flash.style.opacity = String(a * .35);
      i++;
      if (i < frames.length) setTimeout(step, 55 + Math.random() * 35);
      else { ctx.clearRect(0, 0, W, H); if (flash) flash.style.opacity = '0'; }
    })();
  }

  function schedule(first) {
    const wait = first ? 2500 : MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
    setTimeout(() => {
      if (!document.hidden) {
        strike();
        if (Math.random() < .3) setTimeout(strike, 350 + Math.random() * 250); // occasional double strike
      }
      schedule(false);
    }, wait);
  }
  schedule(true);
})();

// ---------- Registration countdown ----------
(function () {
  const boxes = document.querySelectorAll('.countdown[data-deadline]');
  if (!boxes.length) return;
  const pad = n => String(n).padStart(2, '0');

  // Prefer the server clock so a wrong device clock cannot reopen/close registration visually.
  const serverNow = Number(document.body.dataset.serverNow || 0);
  const offset = serverNow ? serverNow - Date.now() : 0;

  function closeUi() {
    document.querySelectorAll('[data-reg-link]').forEach(a => {
      a.classList.add('is-closed');
      a.removeAttribute('href');
      a.setAttribute('aria-disabled', 'true');
      a.textContent = 'REGISTRATION CLOSED';
    });
    document.querySelectorAll('form.registration-form button[type=submit]').forEach(b => {
      b.disabled = true; b.textContent = 'REGISTRATION CLOSED';
    });
  }

  function tick() {
    const now = Date.now() + offset;
    boxes.forEach(box => {
      const left = Number(box.dataset.deadline) - now;
      if (left <= 0) {
        box.classList.add('ended');
        box.innerHTML = '<p class="cd-closed">REGISTRATION IS NOW CLOSED</p>';
        const w = box.closest('.countdown-wrap');
        if (w) w.querySelectorAll('.cd-label,.cd-note').forEach(el => el.style.display = 'none');
        return;
      }
      const s = Math.floor(left / 1000);
      const v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
      Object.keys(v).forEach(k => {
        const el = box.querySelector('[data-u="' + k + '"]');
        if (el) el.textContent = k === 'd' ? String(v[k]) : pad(v[k]);
      });
      box.classList.toggle('urgent', left < 86400000);
    });
    if (boxes[0].classList.contains('ended')) { closeUi(); return; }
    setTimeout(tick, 1000);
  }
  tick();
})();
