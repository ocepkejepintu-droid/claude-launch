(() => {
// Tiny deterministic motion engine. Everything is a pure function of t (seconds).
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  out3: p => 1 - Math.pow(1 - p, 3),
  out4: p => 1 - Math.pow(1 - p, 4),
  out5: p => 1 - Math.pow(1 - p, 5),
  inOut3: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  inOut4: p => (p < 0.5 ? 8 * p ** 4 : 1 - Math.pow(-2 * p + 2, 4) / 2),
  inOut5: p => (p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2),
  in3: p => p * p * p,
  // soft critically-damped-ish settle with a hair of overshoot
  settle: p => 1 - Math.exp(-6.5 * p) * Math.cos(2.2 * p) * (1 - p) - (1 - p) * 0 ,
};
const $ = id => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function css(el, o) {
  if (!el) return;
  const s = el.style;
  if ('o' in o) s.opacity = o.o.toFixed(4);
  let tf = '';
  if ('x' in o || 'y' in o) tf += `translate3d(${(o.x || 0).toFixed(2)}px,${(o.y || 0).toFixed(2)}px,0) `;
  if ('s' in o) tf += `scale(${o.s.toFixed(5)}) `;
  if ('r' in o) tf += `rotate(${o.r.toFixed(3)}deg) `;
  if (tf) s.transform = tf;
  if ('blur' in o) s.filter = o.blur > 0.05 ? `blur(${o.blur.toFixed(2)}px)` : 'none';
  if ('vis' in o) s.visibility = o.vis ? 'visible' : 'hidden';
}

// Word-by-word rise reveal used by every headline. Splits text once.
function splitWords(el) {
  if (el.dataset.split) return $$('.w', el);
  const walk = node => {
    Array.from(node.childNodes).forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span'); w.className = 'w'; w.textContent = part; frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
    });
  };
  walk(el); el.dataset.split = 1;
  return $$('.w', el);
}

// in at tIn, out at tOut. stagger per word. Calm: long durations, small travel, blur-in.
function revealWords(el, t, tIn, tOut, opt = {}) {
  const words = splitWords(el);
  const st = opt.stagger ?? 0.075, dur = opt.dur ?? 0.95, rise = opt.rise ?? 26, blur = opt.blur ?? 10;
  const outDur = opt.outDur ?? 0.6;
  words.forEach((w, i) => {
    const p = E.out4(seg(t, tIn + i * st, tIn + i * st + dur));
    const q = tOut == null ? 0 : E.in3(seg(t, tOut + i * 0.025, tOut + i * 0.025 + outDur));
    css(w, { o: p * (1 - q), y: (1 - p) * rise - q * 14, blur: (1 - p) * blur + q * 8 });
  });
}

// Fade + rise for a whole block
function block(el, t, tIn, tOut, opt = {}) {
  const dur = opt.dur ?? 1.0, rise = opt.rise ?? 30, outDur = opt.outDur ?? 0.6;
  const p = E.out4(seg(t, tIn, tIn + dur));
  const q = tOut == null ? 0 : E.in3(seg(t, tOut, tOut + outDur));
  const s0 = opt.s0 ?? 1;
  css(el, { o: p * (1 - q), y: (1 - p) * rise - q * (opt.outRise ?? 20) + (opt.y || 0), x: opt.x || 0,
    s: lerp(s0, 1, p) * (opt.s || 1), blur: (1 - p) * (opt.blur ?? 0) + q * (opt.outBlur ?? 6) });
  return p * (1 - q);
}

// Typewriter: reveals n characters of a string (keeps layout stable using a ghost span)
function typeText(el, full, t, t0, cps = 26) {
  const n = Math.floor(clamp((t - t0) * cps, 0, full.length));
  if (el.dataset.n !== String(n)) { el.textContent = full.slice(0, n); el.dataset.n = n; }
  return n;
}

window.Engine = { clamp, lerp, seg, E, $, $$, css, splitWords, revealWords, block, typeText };
})();
