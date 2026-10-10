/* Люкс — fogged mirror you wipe with a finger, bathhouse route, ticket calculator */
(() => {
  'use strict';
  const M = window.Motion || { $: (s, r = document) => r.querySelector(s), $$: (s, r = document) => Array.from(r.querySelectorAll(s)), motion: false, fine: false, reduce: true, onScroll: [], toast() {} };
  const { $, $$ } = M;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const doc = document.documentElement;
  const nf = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';

  /* Fogged mirror */
  const cv = $('#fog');
  const hint = $('#mirror-hint');
  if (cv && cv.getContext && M.motion) {
    const ctx = cv.getContext('2d');
    const box = cv.parentElement;
    let W = 0, H = 0, visible = true, raf = 0, last = null, wiped = 0, auto = true;
    const paintFog = () => {
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(226,236,233,.93)');
      g.addColorStop(1, 'rgba(206,222,218,.96)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.05 + Math.random() * 0.1).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, 3 + Math.random() * 14, 0, 6.3);
        ctx.fill();
      }
    };
    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = box.clientWidth; H = box.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintFog();
    };
    const wipe = (x, y, r) => {
      ctx.globalCompositeOperation = 'destination-out';
      const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
    };
    const stroke = (x, y) => {
      const r = Math.max(26, W * 0.085);
      if (last) {
        const dx = x - last.x, dy = y - last.y, n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r * 0.4)));
        for (let i = 1; i <= n; i++) wipe(last.x + dx * i / n, last.y + dy * i / n, r);
      } else wipe(x, y, r);
      last = { x, y };
      wiped++;
      if (hint && wiped > 4) hint.classList.add('is-gone');
    };
    const local = (e) => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    cv.addEventListener('pointerdown', (e) => { auto = false; last = null; const [x, y] = local(e); stroke(x, y); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) { auto = false; const [x, y] = local(e); stroke(x, y); } });
    cv.addEventListener('pointerup', () => { last = null; });
    cv.addEventListener('pointerleave', () => { last = null; });
    // fog creeps back so the glass can be wiped again
    let tick = 0;
    const loop = () => {
      raf = 0;
      if (!visible) return;
      tick++;
      if (tick % 3 === 0) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(214,228,224,.05)';
        ctx.fillRect(0, 0, W, H);
      }
      raf = requestAnimationFrame(loop);
    };
    size();
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(box);
    raf = requestAnimationFrame(loop);
    let lw = innerWidth;
    addEventListener('resize', () => { if (innerWidth !== lw) { lw = innerWidth; size(); } });
    // a first wipe so people see it works
    M.ready(() => setTimeout(() => {
      if (!auto) return;
      const t0 = performance.now();
      const run = (now) => {
        if (!auto) return;
        const p = Math.min(1, (now - t0) / 1500);
        const e = p * p * (3 - 2 * p);
        stroke(W * (0.18 + 0.64 * e), H * (0.62 - 0.36 * e + Math.sin(e * 6.3) * 0.06));
        if (p < 1) requestAnimationFrame(run); else last = null;
      };
      requestAnimationFrame(run);
    }, 700));
  } else if (hint) hint.remove();

  /* Route scene */
  const route = $('#route');
  const stops = $$('#stops li');
  if (route && stops.length && M.motion) {
    const fill = $('#therm-fill'), word = $('#gauge-word'), dots = $$('#route-dots i');
    const words = ['Тепло', 'Жарко', 'Пар', 'Прохладно', 'Тепло', 'Покой'];
    let idx = -1;
    const upd = () => {
      const r = route.getBoundingClientRect();
      const span = route.offsetHeight - innerHeight;
      const p = span > 0 ? clamp(-r.top / span) : 0;
      const inside = r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4;
      const i = Math.min(stops.length - 1, Math.floor(p * stops.length * 0.999));
      doc.classList.toggle('fx-hot', inside && stops[i].dataset.fx === 'hot');
      if (i === idx) return;
      idx = i;
      stops.forEach((s, k) => s.classList.toggle('is-on', k === i));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
      const s = stops[i];
      route.style.setProperty('--rc', s.dataset.c);
      route.classList.toggle('is-cold', s.dataset.fx === 'cold');
      if (fill) fill.style.setProperty('--h', Math.round(+s.dataset.heat * 100) + '%');
      if (word) word.textContent = words[i];
    };
    M.onScroll.push(upd);
    upd();
  }

  /* Ticket calculator */
  const qa = $('#qa'), qk = $('#qk'), sum = $('#sum'), cn = $('#calc-n');
  if (qa && qk && sum) {
    const v = { a: 2, k: 0 };
    let shown = 22000, raf = 0;
    const adults = $('#book-adults'), kids = $('#book-kids');
    const render = () => {
      qa.textContent = v.a; qk.textContent = v.k;
      cn.textContent = v.a + v.k;
      const total = v.a * 11000 + v.k * 7000;
      cancelAnimationFrame(raf);
      const from = shown, t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - k, 3);
        shown = from + (total - from) * e;
        sum.textContent = nf(shown);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      if (M.motion) raf = requestAnimationFrame(step); else { shown = total; sum.textContent = nf(total); }
      if (adults) adults.value = v.a;
      if (kids) kids.value = v.k;
    };
    $$('.qty button').forEach((b) => b.addEventListener('click', () => {
      const t = b.dataset.t;
      v[t] = Math.max(t === 'a' ? 1 : 0, Math.min(40, v[t] + +b.dataset.d));
      render();
    }));
  }

  /* Review cards clear up when they come into view */
  const rvs = $$('.rv');
  if (rvs.length && 'IntersectionObserver' in window && M.motion) {
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-clear'); } else { e.target.classList.remove('is-clear'); } }), { threshold: 0.6 });
    rvs.forEach((r) => io.observe(r));
  }
})();
