// Scene library for calm launch films. Reads window.FILM (film.config.js), builds the DOM,
// lays scenes out on one timeline, exposes window.seek(t), window.DURATION, window.CUES, window.READY.
(() => {
const { clamp, lerp, seg, E, $, $$, css, revealWords, block, typeText, splitWords } = Engine;
const NS = 'http://www.w3.org/2000/svg';
const FILM = window.FILM;
const brand = FILM.brand || {};
const OVERLAP = FILM.overlap ?? 0.6;   // seconds two neighbouring scenes share
const TIN = 0.25;                      // when a scene's content starts entering (local time)
const OUT = 0.9;                       // how long before a scene's end its content starts leaving

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const h = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
const IC = {
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z"/><path d="M8.8 12l2.2 2.2 4.3-4.4"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M3.5 12.5h17"/>',
  building: '<path d="M4 20V6l8-3v17M12 9h7v11M7 8h2M7 12h2M7 16h2M15 13h1.5M15 16.5h1.5M2.5 20h19"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/>',
  users: '<circle cx="9" cy="9" r="3.4"/><path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2M15.5 5.8a3.2 3.2 0 010 6.3M17.5 14.6c2 .6 3.2 2.3 3.5 4.9"/>',
  userok: '<circle cx="10" cy="8.5" r="3.6"/><path d="M3.5 20c.7-3.5 3.3-5.6 6.5-5.6 1.5 0 2.9.4 4 1.2M15 18l2 2 4-4.2"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
  chart: '<path d="M4 20h16M7 16.5V11M11.5 16.5V7M16 16.5v-3.5"/>',
  doc: '<path d="M7 3h7l5 5v11.5A1.5 1.5 0 0117.5 21h-10.5A1.5 1.5 0 015.5 19.5v-15A1.5 1.5 0 017 3z"/><path d="M14 3v5h5M9 13h6M9 16.5h4"/>',
  pen: '<path d="M15.5 4.5l4 4L9 19l-5 1 1-5L15.5 4.5z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  passport: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><circle cx="12" cy="10.5" r="3.2"/><path d="M9 17h6"/>',
  screen: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5L4 12z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6l1-8z"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 1.5h-15L6 16.5zM10 20.5a2 2 0 004 0"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  cloud: '<path d="M7 18.5a4.5 4.5 0 01-.6-9 6 6 0 0111.4 1.6A3.8 3.8 0 0117.5 18.5H7z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  rocket: '<path d="M12 3c3.5 1.8 5.5 5.3 5 9.5l-2.5 2.5h-5L7 12.5C6.5 8.3 8.5 4.8 12 3z"/><circle cx="12" cy="9" r="1.6"/><path d="M9.5 15l-2 4 3.5-1.5M14.5 15l2 4-3.5-1.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z"/>',
  star: '<path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.2 6L12 16.9l-5.5 2.9 1.2-6-4.5-4.2 6.1-.8z"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.2-4.2"/>',
  chat: '<path d="M4.5 18.5l1.2-3.6A7.5 7.5 0 1112 19.5a7.6 7.6 0 01-3.7-.9L4.5 18.5z"/>',
};
const icon = (n, s) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width:${s ? s + 'px' : '100%'};height:${s ? s + 'px' : '100%'}">${IC[n] || IC.sparkle}</svg>`;
const icBubble = (n, size = 44, cls = '') => `<span class="ic ${cls}" style="width:${size}px;height:${size}px">${icon(n)}</span>`;
const okChip = (text, ic = 'check', alt = false) => `<span class="ok${alt ? ' alt' : ''}">${icon(ic, 16)}${esc(text)}</span>`;
// a two-tone headline: dark first line, gradient second line
const headline = (cls, a, b, style = '') => `<div class="${cls}" style="${style}">${esc(a)}${b ? ` <br><span class="g">${esc(b)}</span>` : ''}</div>`;

// ---------- brand mark / logo ----------
const L = brand.logo || { text: brand.name || 'Brand' };
function markSVG(fill, extra = '') {
  if (L.mark) return `<svg viewBox="${L.markViewBox || L.viewBox}" style="overflow:visible;${extra}">${L.mark.map(d => `<path fill="${fill}" d="${d}"/>`).join('')}</svg>`;
  const letter = esc((L.text || brand.name || 'B')[0]);
  return `<svg viewBox="0 0 100 100" style="overflow:visible;${extra}"><text x="50" y="72" text-anchor="middle" font-family="var(--head)" font-weight="700" font-size="68" fill="${fill}">${letter}</text></svg>`;
}
// returns {node, parts[], word}
function logo(width) {
  if (L.mark) {
    const [vx, vy, vw, vh] = L.viewBox.split(/\s+/).map(Number);
    const gid = 'lg' + Math.random().toString(36).slice(2, 7);
    const g = L.markGradient || ['#6d4aff', '#ff8a4c'];
    const svg = h(`<svg viewBox="${L.viewBox}" style="width:${width}px;height:${width * vh / vw}px;overflow:visible">
      <defs><linearGradient id="${gid}" x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient></defs>
      <g class="parts">${L.mark.map(d => `<path fill="url(#${gid})" d="${d}"/>`).join('')}</g>
      <g class="word" fill="${L.wordColor || 'var(--ink)'}">${(L.word || []).map(d => `<path d="${d}"/>`).join('')}</g></svg>`);
    return { node: svg, parts: $$('.parts path', svg), word: svg.querySelector('.word'), height: width * vh / vw };
  }
  const fs = width / Math.max(4, (L.text || '').length * 0.62 + 1.6);
  const node = h(`<div style="display:flex;align-items:center;gap:${fs * 0.32}px;width:${width}px;justify-content:center">
    <div class="lpart" style="width:${fs * 1.15}px;height:${fs * 1.15}px;border-radius:${fs * 0.34}px;background:var(--mark-grad);display:grid;place-items:center;color:#fff">${markSVG('#fff', `width:${fs * 0.8}px;height:${fs * 0.8}px`)}</div>
    <div class="lword" style="font-family:var(--head);font-weight:600;font-size:${fs}px;letter-spacing:-.03em;color:var(--ink)">${esc(L.text)}</div></div>`);
  return { node, parts: $$('.lpart', node), word: node.querySelector('.lword'), height: fs * 1.15 };
}
function animLogo(lg, lt, t0) {
  lg.parts.forEach((p, i) => {
    const a = t0 + i * 0.11, pp = E.out5(seg(lt, a, a + 1.3));
    p.style.transform = `translate(${((1 - pp) * -80).toFixed(2)}px,0)`; p.style.opacity = pp;
  });
  const wp = E.out4(seg(lt, t0 + 0.6, t0 + 1.9));
  lg.word.style.opacity = wp; lg.word.style.transform = `translate(${((1 - wp) * -26).toFixed(2)}px,0)`;
  lg.word.style.filter = wp < 0.99 ? `blur(${((1 - wp) * 6).toFixed(2)}px)` : 'none';
}

// ---------- shared motion ----------
function leftText(nodes, lt, tin, tout) {
  if (nodes.e) block(nodes.e, lt, tin, tout, { dur: 0.9, rise: 16, outRise: 14 });
  revealWords(nodes.h, lt, tin + 0.15, tout);
  if (nodes.s) block(nodes.s, lt, tin + 0.75, tout, { dur: 1.1, rise: 16, outRise: 14 });
}
// a device/card rises in like a slow scroll and leaves upward
function deviceIn(el, lt, tin, tout, opt = {}) {
  const p = E.out5(seg(lt, tin, tin + (opt.dur ?? 1.4)));
  const q = E.inOut4(seg(lt, tout, tout + 0.9));
  css(el, { o: clamp(p * 1.6) * (1 - q), y: (1 - p) * (opt.rise ?? 160) - q * 160 - (lt - tin) * 4,
    s: lerp(opt.s0 ?? 0.96, 1, p) * lerp(1, 0.97, q), blur: q * 6 });
}
const pop = (el, lt, a) => block(el, lt, a, null, { dur: 0.6, rise: 8, s0: 0.9 });

// ---------- card kinds (right-hand side of a feature scene) ----------
const CARDS = {};

CARDS.form = (c, root) => {
  const fields = [];
  const secs = (c.sections || []).map((s, si) => `
    <div class="sect"${si ? ' style="margin-top:30px"' : ''}>${esc(s.title)}</div>${s.sub ? `<div class="sectsub">${esc(s.sub)}</div>` : ''}
    <div class="fieldrow">${(s.fields || []).map(f => { const id = fields.length; fields.push({ ...f, si }); return `
      <div class="field" data-f="${id}" style="flex:${f.flex || 1}"><span class="lab">${esc(f.label)}</span><span class="val"></span>${f.type ? '<span class="caret"></span>' : ''}${f.select ? '<span class="chev"></span>' : ''}<div class="ring"></div></div>`; }).join('')}</div>
    ${s.note ? `<div style="height:46px;padding-top:12px"><span class="note" data-s="${si}">${okChip(s.note)}</span></div>` : ''}`).join('');
  const card = h(`<div class="card" style="left:960px;top:150px;width:820px">
    <div class="chrome"><i></i><i></i><i></i><div class="url">${icon('lock', 14)}${esc(c.url || brand.url || '')}</div></div>
    <div style="padding:38px 46px 46px"><div class="cardhead" style="margin-bottom:34px">${icBubble(c.icon || 'briefcase', 58, 'brand')}<div class="cardtitle" style="font-size:30px">${esc(c.title)}</div></div>${secs}</div></div>`);
  root.appendChild(card);
  // schedule: typed fields take time per character, the rest fill in one beat
  let t = TIN + 1.4; const plan = [], cues = [], notes = {};
  fields.forEach((f, i) => {
    const d = f.type ? String(f.value).length / 15 + 0.35 : 0.62;
    plan.push({ f, a: t, d });
    if (f.type) for (let k = 0; k < String(f.value).length; k++) cues.push({ type: 'type', t: t + 0.2 + k / 15, pan: 0.3 });
    else cues.push({ type: 'tick', t: t + 0.15, pan: 0.3 });
    t += d + 0.1;
    const last = fields.findLastIndex(x => x.si === f.si) === i;
    if (last && c.sections[f.si].note) { notes[f.si] = t; cues.push({ type: 'chime', t, root: 79 }); t += 0.5; }
  });
  return {
    need: t + 1.6, cues, nodes: [card],
    update(lt, tin, tout) {
      deviceIn(card, lt, tin + 0.2, tout + 0.1);
      plan.forEach(({ f, a, d }, i) => {
        const fe = card.querySelector(`[data-f="${i}"]`), val = fe.querySelector('.val');
        fe.querySelector('.ring').style.opacity = E.out3(seg(lt, a, a + 0.25)) * (1 - E.out3(seg(lt, a + d, a + d + 0.35)));
        if (f.type) {
          const n = typeText(val, String(f.value), lt, a + 0.2, 15);
          const caret = fe.querySelector('.caret');
          caret.style.opacity = (lt > a && lt < a + d + 1.2) ? (n < String(f.value).length ? 1 : Math.floor(lt * 2.2) % 2) : 0;
        } else {
          if (val.textContent !== String(f.value)) val.textContent = f.value;
          css(val, { o: E.out3(seg(lt, a + 0.1, a + 0.5)), x: (1 - E.out4(seg(lt, a + 0.1, a + 0.6))) * 10 });
        }
      });
      $$('.note', card).forEach(n => pop(n, lt, notes[n.dataset.s]));
    },
  };
};

CARDS.rows = (c, root) => {
  const rows = c.rows || [];
  const card = h(`<div class="card" style="left:1000px;top:${c.secondary ? 140 : 300}px;width:620px;padding:38px 40px 26px">
    <div class="cardhead">${icBubble(c.icon || 'user', 52)}<div><div class="cardtitle" style="font-size:24px">${esc(c.title)}</div><div class="cardsub">${esc(c.sub || '')}</div></div>
    ${c.badge ? `<span class="badge" style="margin-left:auto">${okChip(c.badge)}</span>` : ''}</div>
    <div style="margin-top:30px">${rows.map((r, i) => `<div class="kv"${i === rows.length - 1 ? ' style="border-bottom:none"' : ''}><div class="k">${esc(r[0])}</div><div class="v">
      <div class="abs sk" style="left:0;top:9px;height:12px;width:${200 + i * 30}px;border-radius:6px;background:linear-gradient(90deg,#efe9f7,#f8f4fc,#efe9f7);background-size:300px 12px"></div>
      <div class="abs mv" style="left:0;top:1px;font-size:18px;font-weight:500;letter-spacing:.01em;white-space:nowrap">${esc(r[1])}</div></div></div>`).join('')}</div></div>`);
  root.appendChild(card);
  let sec = null;
  if (c.secondary) {
    const s = c.secondary;
    sec = h(`<div class="card" style="left:1270px;top:610px;width:520px;height:330px;padding:34px 38px">
      <div class="cardhead">${icBubble(s.icon || 'passport', 52)}<div><div class="cardtitle" style="font-size:23px">${esc(s.title)}</div><div class="cardsub">${esc(s.sub || '')}</div></div></div>
      <div class="abs" style="left:38px;top:120px;width:444px;height:120px;border-radius:16px;background:#f7f4fb;overflow:hidden">
        <div class="abs" style="left:22px;top:20px;width:66px;height:80px;border-radius:10px;background:#e9e1f6"></div>
        <div class="abs" style="left:108px;top:28px;width:220px;height:12px;border-radius:6px;background:#e4dcef"></div>
        <div class="abs" style="left:108px;top:54px;width:160px;height:12px;border-radius:6px;background:#ece6f5"></div>
        <div class="abs" style="left:108px;top:80px;width:260px;height:10px;border-radius:5px;background:#ece6f5"></div>
        <div class="abs scan" style="left:0;top:0;width:100%;height:3px;background:linear-gradient(90deg,transparent,var(--hl),transparent);box-shadow:0 0 18px 4px color-mix(in srgb,var(--hl) 35%,transparent)"></div></div>
      <div class="abs ssok" style="left:38px;top:262px">${okChip(s.ok || 'Verified')}</div></div>`);
    root.appendChild(sec);
  }
  const a0 = TIN + 1.4, rowsEnd = a0 + rows.length * 0.28 + 0.4;
  const cues = rows.map((r, i) => ({ type: 'tick', t: a0 + i * 0.28, pan: 0.35 }));
  if (c.badge) cues.push({ type: 'pop', t: rowsEnd, f: 900 });
  const scan0 = rowsEnd + 0.6;
  if (sec) cues.push({ type: 'chime', t: scan0 + 1.8, root: 76 });
  return {
    need: (sec ? scan0 + 1.8 : rowsEnd) + 2.0, cues, nodes: [card, sec].filter(Boolean),
    update(lt, tin, tout) {
      deviceIn(card, lt, tin + 0.2, tout + 0.05);
      $$('.kv', card).forEach((kv, i) => {
        const a = a0 + i * 0.28, p = E.out3(seg(lt, a, a + 0.45));
        const sk = kv.querySelector('.sk'); css(sk, { o: 1 - p }); sk.style.backgroundPosition = `${(lt * 300) % 300}px 0`;
        css(kv.querySelector('.mv'), { o: p, x: (1 - p) * 10 });
      });
      const b = card.querySelector('.badge'); if (b) pop(b, lt, rowsEnd);
      if (sec) {
        deviceIn(sec, lt, tin + 2.4, tout + 0.15, { rise: 120 });
        const sc = seg(lt, scan0, scan0 + 1.7);
        css(sec.querySelector('.scan'), { y: 120 * (0.5 - 0.5 * Math.cos(sc * Math.PI * 2)), o: sc > 0 && sc < 1 ? 1 : 0 });
        pop(sec.querySelector('.ssok'), lt, scan0 + 1.8);
      }
    },
  };
};

CARDS.progress = (c, root) => {
  const items = c.items || [];
  const n = c.notification;
  const card = h(`<div class="card" style="left:1000px;top:${n ? 320 : 250}px;width:740px">
    <div class="cardhead" style="padding:30px 30px 18px;border-bottom:1px solid var(--line)">${icBubble(c.icon || 'sparkle', 50, 'brand')}
      <div><div class="cardtitle" style="font-size:24px">${esc(c.title)}</div><div class="cardsub psub">${esc(c.pending || 'Working…')}</div></div></div>
    ${items.map(d => `<div class="docrow"><div class="docic">${icon(d[2] || c.itemIcon || 'doc')}</div><div><div class="dname">${esc(d[0])}</div><div class="dmeta">${esc(d[1] || '')}</div>
      <div class="bar"><b></b></div></div><div class="state">${icon('check', 18)}</div></div>`).join('')}</div>`);
  root.appendChild(card);
  let note = null;
  if (n) {
    note = h(`<div class="card" style="left:1040px;top:150px;width:660px;border-radius:26px;padding:26px 28px;display:flex;gap:20px">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--mark-grad);display:grid;place-items:center;flex:none">${markSVG('#fff', 'width:36px;height:36px')}</div>
      <div style="flex:1"><div style="display:flex"><div style="font-size:19px;font-weight:600">${esc(n.from)}</div><div style="margin-left:auto;font-size:15px;color:var(--ink3)">${esc(n.time || 'now')}</div></div>
      <div style="font-size:16.5px;color:var(--ink2);line-height:1.45;margin-top:4px">${esc(n.text)}</div></div></div>`);
    root.appendChild(note);
  }
  const a0 = TIN + 1.4, step = 0.55;
  const doneAt = a0 + (items.length - 1) * step + 1.3;
  const cues = items.map((d, i) => ({ type: 'pop', t: a0 + i * step + 0.95, f: 880 + i * 60, pan: 0.35 }));
  if (n) cues.push({ type: 'chime', t: doneAt + 0.3, root: 81 });
  return {
    need: doneAt + (n ? 3.2 : 2.2), cues, nodes: [card, note].filter(Boolean),
    update(lt, tin, tout) {
      deviceIn(card, lt, tin + 0.2, tout + 0.1);
      $$('.docrow', card).forEach((r, i) => {
        const a = a0 + i * step;
        r.querySelector('.bar b').style.width = (E.inOut3(seg(lt, a, a + 0.9)) * 100).toFixed(2) + '%';
        css(r.querySelector('.state'), { o: E.out4(seg(lt, a + 0.9, a + 1.3)), s: lerp(0.5, 1, E.out5(seg(lt, a + 0.9, a + 1.4))) });
        css(r, { o: 0.35 + 0.65 * E.out3(seg(lt, a - 0.3, a + 0.2)) });
      });
      const sub = lt >= doneAt ? (c.done || 'Done') : (c.pending || 'Working…');
      const ps = card.querySelector('.psub'); if (ps.textContent !== sub) ps.textContent = sub;
      if (note) {
        const np = E.out5(seg(lt, doneAt + 0.3, doneAt + 1.3)), nq = E.inOut4(seg(lt, tout + 0.1, tout + 0.9));
        css(note, { o: clamp(np * 1.5) * (1 - nq), y: (1 - np) * -60 - nq * 140, s: lerp(0.94, 1, np) });
      }
    },
  };
};

CARDS.sign = (c, root) => {
  const chips = c.chips || [{ text: 'Signed' }];
  const card = h(`<div class="card" style="left:1020px;top:130px;width:660px;height:820px;padding:50px 56px">
    ${c.kicker ? `<div style="font-size:14px;font-weight:600;color:var(--ink3);letter-spacing:.08em;text-transform:uppercase">${esc(c.kicker)}</div>` : ''}
    <div class="cardtitle" style="font-size:30px;margin-top:10px">${esc(c.title)}</div>
    <div style="margin-top:34px">${[520, 548, 500, 540, 360, 0, 530, 548, 470, 300].map(w => w ? `<div class="ln" style="height:11px;width:${w}px;border-radius:6px;background:#f0ebf6;margin-bottom:16px"></div>` : '<div style="height:20px"></div>').join('')}</div>
    <div class="abs" style="left:56px;top:520px;width:548px;height:180px;border-radius:18px;border:1.5px dashed #e0d6ee;background:#fcfaff">
      <div class="abs" style="left:20px;top:14px;font-size:14px;font-weight:500;color:var(--hl)">${esc(c.fieldLabel || 'Signature')}</div>
      <svg class="abs" viewBox="0 0 548 180" style="left:0;top:0;width:548px;height:180px"><path class="sig" fill="none" stroke="#2b1f46" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"
        d="M70 120 C 85 70, 105 52, 112 70 C 120 92, 92 132, 96 136 C 104 140, 126 84, 140 86 C 152 88, 136 128, 150 126 C 164 124, 176 92, 188 96 C 198 100, 186 126, 200 124 C 216 122, 222 86, 236 74 C 246 66, 250 90, 240 112 C 232 130, 256 120, 270 104 C 282 92, 294 98, 288 112 C 284 124, 302 122, 318 108 C 336 92, 350 96, 346 110 C 342 122, 368 118, 392 104 C 412 92, 440 90, 470 96"/></svg>
      <div class="abs" style="left:40px;right:40px;bottom:36px;height:1.5px;background:#e8e1f2"></div></div>
    <div class="abs" style="left:56px;top:730px;display:flex;gap:12px;align-items:center">${chips.map((ch, i) => `<span class="sc">${okChip(ch.text, ch.icon || (i ? 'send' : 'check'), i > 0)}</span>`).join('')}</div></div>`);
  root.appendChild(card);
  const s0 = TIN + 2.1, s1 = s0 + 2.0;
  const cues = chips.map((ch, i) => ({ type: i ? 'chime' : 'pop', t: s1 + 0.2 + i * 0.9, f: 800, root: 84 }));
  return {
    need: s1 + 0.2 + chips.length * 0.9 + 1.4, cues, nodes: [card],
    update(lt, tin, tout) {
      deviceIn(card, lt, tin + 0.2, tout + 0.1);
      $$('.ln', card).forEach((l, i) => css(l, { o: E.out3(seg(lt, tin + 0.8 + i * 0.05, tin + 1.4 + i * 0.05)) }));
      const sp = card.querySelector('.sig'); const Lp = sp.getTotalLength();
      sp.style.strokeDasharray = Lp; sp.style.strokeDashoffset = Lp * (1 - E.inOut3(seg(lt, s0, s1)));
      $$('.sc', card).forEach((el, i) => block(el, lt, s1 + 0.2 + i * 0.9, null, { dur: 0.7, rise: 8, s0: 0.9 }));
    },
  };
};

CARDS.chat = (c, root) => {
  const msgs = c.messages || [];
  const ph = h(`<div class="phone" style="left:1170px;top:110px">
    <div class="abs" style="left:0;right:0;top:0;height:150px;background:#fff;border-bottom:1px solid var(--line)">
      <div class="abs" style="left:50%;top:22px;width:120px;height:32px;margin-left:-60px;border-radius:16px;background:#17131f"></div>
      <div class="abs" style="left:34px;top:76px;display:flex;align-items:center;gap:14px">
        <div style="width:50px;height:50px;border-radius:50%;background:var(--mark-grad);display:grid;place-items:center">${markSVG('#fff', 'width:28px;height:28px')}</div>
        <div><div style="font-size:20px;font-weight:600">${esc(c.name || brand.name)}</div><div style="font-size:14px;color:var(--ok);display:flex;align-items:center;gap:6px"><i style="width:8px;height:8px;border-radius:50%;background:#22c27a;display:block"></i>${esc(c.status || 'Online now')}</div></div></div></div>
    ${msgs.map((m, i) => `<div class="bubble ${m.from === 'me' ? 'me' : 'them'}" data-m="${i}"><span class="tx">${esc(m.text)}</span></div>
      ${m.from === 'me' ? '' : `<div class="bubble them dots" data-d="${i}" style="padding:20px 22px;display:flex;gap:7px">${'<i class="td" style="width:9px;height:9px;border-radius:50%;background:#b9b2c6;display:block"></i>'.repeat(3)}</div>`}`).join('')}
    ${c.choices ? `<div class="abs choices" style="left:30px;display:flex;gap:10px">${c.choices.map((ch, i) => `<span class="chip${i ? '' : ' on'}">${i ? '' : icon(c.choiceIcon || 'sparkle', 18)}${esc(ch)}</span>`).join('')}</div>` : ''}
    <div class="abs" style="left:24px;right:24px;bottom:30px;height:70px;border-radius:35px;background:#fff;border:1.5px solid var(--line);display:flex;align-items:center;padding:0 26px;font-size:18px;color:var(--ink3)">${esc(c.placeholder || 'Message…')}</div></div>`);
  root.appendChild(ph);
  let toast = null;
  if (c.toast) {
    toast = h(`<div class="card" style="left:1000px;top:250px;width:400px;border-radius:24px;padding:24px 26px;display:flex;align-items:center;gap:16px">
      ${icBubble(c.toast.icon || 'sparkle', 56)}<div><div style="font-size:20px;font-weight:600">${esc(c.toast.title)}</div><div style="font-size:15px;color:var(--ok)">${esc(c.toast.sub || '')}</div></div></div>`);
    root.appendChild(toast);
  }
  // timeline: "me" messages type in, "them" messages get typing dots first
  let t = TIN + 1.1; const plan = [], cues = [];
  msgs.forEach((m, i) => {
    if (m.from === 'me') {
      const d = m.text.length / 34;
      plan.push({ i, a: t, me: true });
      for (let k = 0; k < m.text.length; k += 2) cues.push({ type: 'type', t: t + k / 34, pan: 0.35 });
      t += d + 0.4;
    } else {
      plan.push({ i, dots: t, a: t + 1.3 });
      cues.push({ type: 'pop', t: t + 1.3, f: 950, pan: 0.3 });
      t += 1.3 + 0.6;
    }
  });
  const chAt = t, tap = t + 0.8, toastAt = t + 1.2;
  if (c.choices) cues.push({ type: 'tick', t: tap + 0.1, pan: 0.3 });
  if (toast) cues.push({ type: 'chime', t: toastAt, root: 79 });
  let laid = false;
  return {
    need: (toast ? toastAt + 1.0 : chAt + 0.6) + 1.6, cues, nodes: [ph, toast].filter(Boolean),
    layout() {  // stack bubbles so the conversation ends just above the input bar
      const bs = msgs.map((m, i) => ph.querySelector(`[data-m="${i}"]`));
      const hs = bs.map(b => b.offsetHeight);
      const chH = c.choices ? 62 : 0;
      let y = Math.max(190, 800 - hs.reduce((a, b) => a + b + 18, 0) - chH);
      bs.forEach((b, i) => { b.style.top = y + 'px'; const d = ph.querySelector(`[data-d="${i}"]`); if (d) d.style.top = y + 'px'; y += hs[i] + 18; });
      const chs = ph.querySelector('.choices'); if (chs) chs.style.top = (y + 4) + 'px';
      laid = true;
    },
    update(lt, tin, tout) {
      deviceIn(ph, lt, tin + 0.2, tout + 0.1);
      plan.forEach(p => {
        const b = ph.querySelector(`[data-m="${p.i}"]`);
        if (p.me) { block(b, lt, p.a, null, { dur: 0.6, rise: 14, s0: 0.96 }); typeText(b.querySelector('.tx'), msgs[p.i].text, lt, p.a, 34); }
        else {
          const d = ph.querySelector(`[data-d="${p.i}"]`);
          css(d, { o: E.out3(seg(lt, p.dots, p.dots + 0.3)) * (1 - E.out3(seg(lt, p.a - 0.2, p.a))), y: (1 - E.out3(seg(lt, p.dots, p.dots + 0.4))) * 10 });
          $$('.td', d).forEach((x, k) => css(x, { y: -4 * Math.max(0, Math.sin(lt * 7 - k * 0.8)) }));
          block(b, lt, p.a, null, { dur: 0.7, rise: 12, s0: 0.97 });
        }
      });
      const chs = ph.querySelector('.choices');
      if (chs) { block(chs, lt, chAt, null, { dur: 0.7, rise: 12 }); css(chs.firstElementChild, { s: 1 - 0.06 * Math.sin(Math.PI * seg(lt, tap, tap + 0.3)) }); }
      if (toast) {
        const sp = E.out5(seg(lt, toastAt, toastAt + 1.0)), sq = E.inOut4(seg(lt, tout, tout + 0.8));
        css(toast, { o: clamp(sp * 1.5) * (1 - sq), y: (1 - sp) * 50 - sq * 100, s: lerp(0.9, 1, sp), blur: sq * 6 });
      }
    },
  };
};

// escape hatch: any HTML. Elements with class "dev" get the standard rise-in; c.update(lt, api) does the rest.
CARDS.html = (c, root) => {
  const wrap = h(`<div class="abs" style="inset:0">${c.html}</div>`); root.appendChild(wrap);
  return { need: c.need || 6, cues: c.cues || [], nodes: [wrap],
    update(lt, tin, tout) { $$('.dev', wrap).forEach((d, i) => deviceIn(d, lt, tin + 0.2 + i * 0.4, tout + 0.1)); c.update && c.update(lt, { tin, tout, wrap, Engine, seg, E, css, block }); } };
};

// ---------- scene types ----------
const SCENES = {};

SCENES.intro = (s, root) => {
  const lg = logo(s.logoWidth || 810);
  const grp = h(`<div class="abs" style="left:0;top:0;width:1920px;height:1080px"></div>`);
  const lw = h(`<div class="abs" style="left:0;width:1920px;top:${460 - lg.height}px;display:flex;justify-content:center"></div>`); lw.appendChild(lg.node);
  const tag = h(`<div class="abs h2" style="left:0;width:1920px;top:540px;text-align:center;font-size:60px">${esc(s.tagline || '')}${s.accent ? ` <span class="g">${esc(s.accent)}</span>` : ''}</div>`);
  const chip = s.chip ? h(`<div class="abs" style="left:0;width:1920px;top:680px;display:flex;justify-content:center"><div class="pill" style="font-size:21px;padding:12px 24px 12px 14px;gap:12px">${icBubble(s.chip.icon || 'shield', 36)}${esc(s.chip.text)}</div></div>`) : null;
  [lw, tag, chip].filter(Boolean).forEach(n => grp.appendChild(n)); root.appendChild(grp);
  return { dur: s.dur || 5.6, cues: [{ type: 'whoosh', t: 0.6, d: 1.4 }, { type: 'chime', t: 1.2, root: 72 }, ...(chip ? [{ type: 'pop', t: 2.85, f: 700 }] : [])],
    update(lt, dur) {
      animLogo(lg, lt, 0.35);
      revealWords(tag, lt, 2.0, null, { stagger: 0.09 });
      if (chip) block(chip, lt, 3.0, null, { rise: 14 });
      const q = E.inOut4(seg(lt, dur - 1.0, dur));
      css(grp, { o: 1 - q, y: -q * 60, s: 1 + q * 0.04, blur: q * 8 });
    } };
};

SCENES.hub = (s, root) => {
  const items = s.items || [];
  const title = h(`<div class="abs" style="left:0;width:1920px;top:110px;text-align:center">${headline('h2', s.title, s.accent)}</div>`);
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'abs'); svg.setAttribute('viewBox', '0 0 1920 1080');
  svg.style.cssText = 'left:0;top:0;width:1920px;height:1080px;overflow:visible';
  svg.innerHTML = '<defs><linearGradient id="hubln" x1="0" x2="1"><stop offset="0" stop-color="#d9c8f5"/><stop offset="1" stop-color="#f6b3cf"/></linearGradient></defs>';
  const CX = 960, CY = 620, R = 100;
  const hub = h(`<div class="abs" style="left:${CX - R}px;top:${CY - R}px;width:${R * 2}px;height:${R * 2}px">
    <div class="abs halo1" style="inset:-40px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--hl) 16%,transparent),transparent 70%)"></div>
    <div class="abs halo2" style="inset:-8px;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--hl) 25%,transparent)"></div>
    <div class="abs" style="inset:0;border-radius:50%;background:var(--mark-grad);box-shadow:0 20px 50px -12px color-mix(in srgb,var(--hl) 50%,transparent);display:grid;place-items:center">${markSVG('#fff', 'width:110px;height:80px')}</div>
    <div class="abs" style="top:226px;left:-60px;width:320px;text-align:center;font-family:var(--head);font-size:30px;font-weight:600;letter-spacing:-.02em">${esc(s.hubLabel || brand.name || '')}</div></div>`);
  const k = Math.ceil(items.length / 2);
  const pills = items.map((it, i) => {
    const left = i < k, j = left ? i : i - k, n = left ? k : items.length - k;
    const y = CY + (j - (n - 1) / 2) * 180;
    const mid = Math.abs(j - (n - 1) / 2) < 0.6 && n % 2 === 1;
    const p = h(`<div class="pill abs" style="top:${y - 38}px">${icBubble(it.icon || 'sparkle')}${esc(it.label)}</div>`);
    p._side = left; p._y = y; p._edge = left ? (mid ? 630 : 700) : (mid ? 1290 : 1220);
    return p;
  });
  root.appendChild(title); root.appendChild(svg); pills.forEach(p => root.appendChild(p)); root.appendChild(hub);
  const lines = [];
  return {
    dur: s.dur || Math.max(7.6, 4.2 + items.length * 0.16 + 2.6),
    cues: [{ type: 'whoosh', t: 0.3, d: 1.2 }, ...items.map((_, i) => ({ type: 'pop', t: TIN + 1.0 + i * 0.16, f: 820 + i * 40, pan: i < k ? -0.4 : 0.4 }))],
    layout() {
      pills.forEach((p, i) => {
        const w = p.offsetWidth;
        p.style.left = (p._side ? p._edge - w : p._edge) + 'px';
        const sx = p._side ? p._edge + 14 : p._edge - 14, sy = p._y, ex = p._side ? CX - R - 6 : CX + R + 6, ey = CY, mx = (sx + ex) / 2;
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'url(#hubln)'); path.setAttribute('stroke-width', '2');
        const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', '5'); dot.setAttribute('fill', 'var(--hl)');
        const ep = document.createElementNS(NS, 'circle'); ep.setAttribute('r', '5'); ep.setAttribute('cx', sx); ep.setAttribute('cy', sy); ep.setAttribute('fill', '#fff'); ep.setAttribute('stroke', '#e3d7f5'); ep.setAttribute('stroke-width', '2');
        svg.appendChild(path); svg.appendChild(dot); svg.appendChild(ep);
        lines.push({ path, dot, ep, L: path.getTotalLength() });
      });
    },
    update(lt, dur) {
      const t0 = TIN + 0.05, out = dur - OUT;
      revealWords(title.firstElementChild, lt, t0, out);
      const hp = E.out5(seg(lt, t0 + 0.4, t0 + 1.8)), hq = E.inOut4(seg(lt, out, out + 0.8));
      css(hub, { o: hp * (1 - hq), s: lerp(0.7, 1, hp) * (1 - hq * 0.1), y: (1 - hp) * 30, blur: hq * 6 });
      const pulse = (Math.max(0, lt - t0) % 2.6) / 2.6;
      css(hub.querySelector('.halo2'), { s: 1 + pulse * 0.45, o: (1 - pulse) * 0.9 });
      css(hub.querySelector('.halo1'), { s: 1 + 0.06 * Math.sin(lt * 1.4), o: 1 });
      pills.forEach((p, i) => {
        const a = t0 + 1.0 + i * 0.16;
        const pin = block(p, lt, a, out + i * 0.03, { dur: 1.1, rise: 0, x: (p._side ? 1 : -1) * (1 - E.out4(seg(lt, a, a + 1.1))) * -40, outBlur: 6 });
        const ln = lines[i]; if (!ln) return;
        ln.path.style.strokeDasharray = ln.L; ln.path.style.strokeDashoffset = ln.L * (1 - E.inOut3(seg(lt, a + 0.5, a + 1.7))); ln.path.style.opacity = 1 - hq;
        ln.ep.style.opacity = pin;
        if (lt > a + 1.7) { const ph = ((lt - a - 1.7 + i * 0.37) % 2.2) / 2.2; const pt = ln.path.getPointAtLength(ln.L * E.inOut3(ph));
          ln.dot.setAttribute('cx', pt.x); ln.dot.setAttribute('cy', pt.y); ln.dot.style.opacity = Math.sin(Math.PI * ph) * (1 - hq) * 0.9; }
        else ln.dot.style.opacity = 0;
      });
    },
  };
};

SCENES.feature = (s, root) => {
  const txt = h(`<div class="abs left" style="top:${s.textTop || 340}px">
    ${s.eyebrow ? `<div class="eyebrow">${esc(s.eyebrow)}</div>` : ''}
    ${headline('h1', s.title, s.accent, `margin-top:18px;${s.titleSize ? `font-size:${s.titleSize}px;` : ''}`)}
    ${s.body ? `<div class="sub" style="margin-top:30px;width:${s.bodyWidth || 820}px">${(Array.isArray(s.body) ? s.body : [s.body]).map(esc).join('<br>')}</div>` : ''}</div>`);
  root.appendChild(txt);
  const nodes = { e: txt.querySelector('.eyebrow'), h: txt.querySelector('.h1'), s: txt.querySelector('.sub') };
  const card = s.card ? CARDS[s.card.kind](s.card, root) : null;
  return {
    dur: s.dur || Math.max(7.6, (card ? card.need : 5) + OUT + 0.4),
    cues: [{ type: 'whoosh', t: 0.35, d: 1.2 }, ...(card ? card.cues : [])],
    layout() {
      card && card.layout && card.layout();
      // keep the text column clear of whatever card sits beside it
      const lefts = card ? card.nodes.map(n => n.getBoundingClientRect().left).filter(x => x > 400) : [];
      const maxRight = (lefts.length ? Math.min(...lefts) : 1800) - 50;
      if (nodes.s) nodes.s.style.width = Math.min(s.bodyWidth || 820, maxRight - 150) + 'px';
      fitHeadline(nodes.h, s, maxRight);
    },
    update(lt, dur) { const tout = dur - OUT; leftText(nodes, lt, TIN, tout); card && card.update(lt, TIN, tout); },
  };
};

SCENES.pricing = (s, root) => {
  const plans = s.plans || [];
  const title = h(`<div class="abs" style="left:0;width:1920px;top:110px;text-align:center">${headline('h2', s.title, s.accent)}</div>`);
  const W = 420, G = 40, x0 = (1920 - (plans.length * W + (plans.length - 1) * G)) / 2;
  const cards = plans.map((p, i) => h(`<div class="price" style="left:${x0 + i * (W + G)}px;top:430px">
    ${p.tag ? `<div class="tag"${p.tagTone === 'warm' ? ' style="background:#fff1e6;color:#e5731b"' : ''}>${esc(p.tag)}</div>` : ''}
    <div class="pn">${esc(p.name)}</div><div class="pv">${esc(p.prefix || '')}<b>${esc(p.value)}</b>${p.suffix ? `<span style="font-size:20px;margin-left:4px">${esc(p.suffix)}</span>` : ''}</div>
    <ul>${(p.bullets || []).map(b => `<li>${icon('check', 18)}${esc(b)}</li>`).join('')}</ul></div>`));
  const foot = s.footnote ? h(`<div class="abs sub" style="left:0;width:1920px;top:840px;text-align:center;font-size:21px;color:var(--ink3)">${esc(s.footnote)}</div>`) : null;
  [title, ...cards, foot].filter(Boolean).forEach(n => root.appendChild(n));
  const hi = s.highlight ?? Math.floor(plans.length / 2);
  return { dur: s.dur || 6.8,
    cues: [{ type: 'whoosh', t: 0.35, d: 1.2 }, ...cards.map((_, i) => ({ type: 'pop', t: TIN + 0.9 + i * 0.22, f: 760 + i * 80, pan: (i - (cards.length - 1) / 2) * 0.4 }))],
    update(lt, dur) {
      const out = dur - OUT;
      revealWords(title.firstElementChild, lt, TIN, out);
      cards.forEach((c, i) => {
        const a = TIN + 0.9 + i * 0.22, p = E.out5(seg(lt, a, a + 1.4)), q = E.inOut4(seg(lt, out + i * 0.05, out + 0.8 + i * 0.05));
        css(c, { o: clamp(p * 1.5) * (1 - q), y: (1 - p) * 120 + (i === hi ? -24 : 0) * p - q * 60 + Math.sin(lt * 0.8 + i) * 3, s: lerp(0.95, 1, p), blur: q * 6 });
      });
      if (foot) block(foot, lt, TIN + 2.2, out);
    } };
};

SCENES.statement = (s, root) => {
  const lines = s.lines || [];
  const wrap = h(`<div class="abs" style="left:0;width:1920px;top:${540 - lines.length * 63 - (s.footer ? 60 : 0)}px;text-align:center">
    ${lines.map((l, i) => `<div class="h1${i === lines.length - 1 ? ' g' : ''}" style="font-size:108px;line-height:1.16">${esc(l)}</div>`).join('')}</div>`);
  root.appendChild(wrap);
  let foot = null;
  if (s.footer) {
    foot = h(`<div class="abs" style="left:0;width:1920px;top:${540 + lines.length * 63 - 40}px;display:flex;justify-content:center;align-items:center;gap:22px">
      ${s.footer.stars ? `<div style="display:flex;gap:4px">${Array.from({ length: s.footer.stars }, () => `<svg class="star" viewBox="0 0 24 24" style="width:34px;height:34px"><path fill="#FFB938" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3-4.7-4.4 6.4-.8z"/></svg>`).join('')}</div>` : ''}
      <div class="ft" style="font-size:26px;font-weight:500;color:var(--ink2);letter-spacing:-.01em">${esc(s.footer.text || '')}</div></div>`);
    root.appendChild(foot);
  }
  const step = 0.9;
  return { dur: s.dur || Math.max(5.4, TIN + lines.length * step + 2.6),
    cues: [{ type: 'whoosh', t: 0.25, d: 1.2 }, ...lines.map((_, i) => ({ type: 'pop', t: TIN + i * step, f: 700 + i * 90 }))],
    update(lt, dur) {
      const out = dur - 0.8; const ls = $$('.h1', wrap);
      ls.forEach((el, i) => {
        const a = TIN + i * step;
        revealWords(el, lt, a, out, { stagger: 0.08, rise: 30, blur: 12 });
        const dim = i < ls.length - 1 ? E.inOut3(seg(lt, a + 0.9, a + 1.6)) : 0;   // earlier lines settle to grey
        el.style.color = `rgb(${lerp(23, 190, dim)},${lerp(19, 184, dim)},${lerp(31, 202, dim)})`;
      });
      if (foot) {
        const a0 = TIN + (ls.length - 1) * step + 1.0;
        $$('.star', foot).forEach((st, i) => { const p = E.out5(seg(lt, a0 + i * 0.08, a0 + i * 0.08 + 0.7)); css(st, { o: p * (1 - seg(lt, out, out + 0.5)), s: lerp(0.4, 1, p), r: (1 - p) * -40 }); });
        block(foot.querySelector('.ft'), lt, a0 + 0.3, out, { rise: 10 });
      }
    } };
};

SCENES.outro = (s, root) => {
  const hasTag = s.lead || s.script;
  const tag = hasTag ? h(`<div class="abs" style="left:0;width:1920px;top:380px;text-align:center">
    ${s.lead ? `<div class="h2 lead" style="font-size:64px">${esc(s.lead)}</div>` : ''}
    ${s.script ? `<div style="font-family:var(--script);font-size:120px;line-height:1.35;margin-top:-6px"><span class="w scr" style="color:transparent;-webkit-background-clip:text;background-clip:text;background-image:${brand.scriptGradient || 'var(--grad)'};padding:0 20px">${esc(s.script)}</span></div>` : ''}</div>`) : null;
  const lg = logo(s.logoWidth || 600);
  const lw = h(`<div class="abs" style="left:0;width:1920px;top:${520 - lg.height}px;display:flex;justify-content:center"></div>`); lw.appendChild(lg.node);
  const cta = h(`<div class="abs" style="left:0;width:1920px;top:600px;display:flex;justify-content:center;gap:22px;align-items:center">
    ${s.cta ? `<div class="btn">${esc(s.cta)}${icon('arrow', 24)}</div>` : ''}
    ${s.url ? `<div class="pill" style="padding:20px 34px 20px 22px;font-size:28px">${icon('globe', 28)}${esc(s.url)}</div>` : ''}</div>`);
  const sub = s.sub ? h(`<div class="abs" style="left:0;width:1920px;top:740px;text-align:center;font-size:21px;color:var(--ink3)">${esc(s.sub)}</div>`) : null;
  [tag, lw, cta, sub].filter(Boolean).forEach(n => root.appendChild(n));
  const lt0 = hasTag ? TIN + 4.7 : TIN + 0.3;
  return { dur: s.dur || (hasTag ? 9.8 : 6.0),
    cues: [{ type: 'whoosh', t: 0.4, d: 1.4 }, ...(hasTag ? [{ type: 'chime', t: TIN + 1.0, root: 77 }, { type: 'whoosh', t: lt0 - 0.1, d: 1.2 }] : []), { type: 'chime', t: lt0 + 0.2, root: 72 }],
    update(lt, dur) {
      if (tag) {
        const lead = tag.querySelector('.lead'); if (lead) revealWords(lead, lt, TIN, TIN + 4.0);
        const scr = tag.querySelector('.scr');
        if (scr) { const bp = E.out4(seg(lt, TIN + 0.9, TIN + 2.2)), bq = E.in3(seg(lt, TIN + 4.05, TIN + 4.65));
          css(scr, { o: bp * (1 - bq), y: (1 - bp) * 30 - bq * 14, s: lerp(0.94, 1, bp), blur: (1 - bp) * 12 + bq * 8 }); }
      }
      animLogo(lg, lt, lt0);
      block(cta, lt, lt0 + 1.1, null, { dur: 1.2, rise: 24 });
      if (sub) block(sub, lt, lt0 + 1.7, null, { dur: 1.2, rise: 12 });
      root.style.opacity = 1 - E.inOut3(seg(lt, dur - 1.2, dur));   // last scene: fade to the background
    } };
};

// shrink a feature headline until it stays on its lines and clear of the card beside it
function fitHeadline(el, s, maxRight) {
  if (s.titleSize) return;
  el.style.width = 'auto'; el.style.whiteSpace = 'nowrap';
  el.parentElement.style.width = (maxRight - 150) + 'px';
  const words = splitWords(el);
  let size = 80;
  const right = () => Math.max(...words.map(w => w.getBoundingClientRect().right - (parseFloat(w.style.transform?.split('(')[1]) || 0)));
  while (right() > maxRight && size > 50) { size -= 2; el.style.fontSize = size + 'px'; }
  if (right() > maxRight) console.warn(`headline too long for its column even at ${size}px: "${el.textContent.trim()}"`);
}

// ---------- build ----------
function applyBrand() {
  const r = document.documentElement.style;
  const c = brand.colors || {};
  const map = { accent: '--accent', accentSoft: '--accent-soft', ink: '--ink', bg: '--bg', highlight: '--hl', ok: '--ok', okBg: '--ok-bg' };
  Object.entries(map).forEach(([k, v]) => c[k] && r.setProperty(v, c[k]));
  if (c.gradient) r.setProperty('--grad', `linear-gradient(90deg, ${c.gradient.join(', ')})`);
  if (c.markGradient) r.setProperty('--mark-grad', `linear-gradient(135deg, ${c.markGradient.join(', ')})`);
  const f = brand.fonts || {};
  const faces = (f.faces || []).map(x => `@font-face{font-family:'${x.family}';src:url(${x.src}) format('woff2');font-weight:${x.weight || 400};}`).join('');
  const st = document.createElement('style'); st.textContent = faces; document.head.appendChild(st);
  if (f.head) r.setProperty('--head', `'${f.head}', 'Inter', sans-serif`);
  if (f.ui) r.setProperty('--ui', `'${f.ui}', 'Inter', sans-serif`);
  if (f.script) r.setProperty('--script', `'${f.script}', cursive`);
  const blobs = brand.blobs || ['#ffd7e6', '#ffe6cc', '#e7dcff', '#fff1d6'];
  const pos = [[1100, -200, 900, 700], [-200, 500, 800, 700], [500, 300, 900, 800], [1400, 700, 600, 500]];
  blobs.slice(0, 4).forEach((col, i) => {
    const [x, y, w, hh] = pos[i];
    const b = h(`<div class="blob" style="left:${x}px;top:${y}px;width:${w}px;height:${hh}px;background:radial-gradient(closest-side, ${col} 0%, color-mix(in srgb, ${col} 60%, transparent) 40%, color-mix(in srgb, ${col} 20%, transparent) 70%, transparent 100%)"></div>`);
    $('bg').appendChild(b);
  });
}

applyBrand();
const cam = $('cam');
const built = FILM.scenes.map((s, i) => {
  if (!SCENES[s.type]) throw new Error(`unknown scene type "${s.type}" (scene ${i})`);
  const root = h(`<section class="scene" data-type="${s.type}"></section>`); cam.appendChild(root);
  const sc = SCENES[s.type](s, root); sc.root = root; return sc;
});
let t = 0;
built.forEach((sc, i) => { sc.start = t; t += sc.dur - (i < built.length - 1 ? OVERLAP : 0); });
const DURATION = t;

function prepGrad() {   // one continuous gradient across each gradient line, even though words are split
  $$('.g').forEach(el => {
    const words = splitWords(el); let x0 = Infinity, x1 = -Infinity;
    words.forEach(w => { x0 = Math.min(x0, w.offsetLeft); x1 = Math.max(x1, w.offsetLeft + w.offsetWidth); });
    words.forEach(w => { w.style.backgroundSize = `${x1 - x0}px 100%`; w.style.backgroundPosition = `${-(w.offsetLeft - x0)}px 0`; });
  });
}

let prepped = false;
function seek(T) {
  if (!prepped) {
    built.forEach(sc => { sc.root.style.visibility = 'visible'; sc.layout && sc.layout(); sc.root.style.visibility = 'hidden'; });
    prepGrad(); prepped = true;
  }
  const blobs = $$('.blob');
  const drift = [[0.07, 0.05, 120, 80, 0], [0.06, 0.08, 140, 60, 1.6], [0.045, 0.06, 160, 90, 1], [0.05, 0.07, 120, 70, 3]];
  blobs.forEach((b, i) => { const [a, c, ax, ay, ph] = drift[i]; css(b, { x: Math.sin(T * a + ph) * ax, y: Math.cos(T * c + ph) * ay }); });
  css($('dots'), { y: -T * 3 });
  css(cam, { s: 1 + 0.006 * Math.sin(T * 0.25) });
  built.forEach(sc => {
    const lt = T - sc.start, on = lt >= 0 && lt <= sc.dur;
    sc.root.style.visibility = on ? 'visible' : 'hidden';
    if (on) sc.update(lt, sc.dur);
  });
}

const cues = [];
built.forEach(sc => (sc.cues || []).forEach(c => cues.push({ ...c, t: +(sc.start + c.t).toFixed(3) })));
cues.sort((a, b) => a.t - b.t);
window.DURATION = +DURATION.toFixed(3);
window.TIMELINE = built.map((sc, i) => ({ i, type: FILM.scenes[i].type, start: +sc.start.toFixed(2), end: +(sc.start + sc.dur).toFixed(2) }));
window.CUES = { duration: window.DURATION, beat_in: built[1] ? built[1].start : 5, outro: built[built.length - 1].start + 5, music: FILM.music || {}, events: cues };
window.seek = seek;
const fams = (brand.fonts?.faces || []).map(x => document.fonts.load(`${x.weight || 400} 40px '${x.family}'`));
window.READY = Promise.all(fams).then(() => document.fonts.ready).then(() => { seek(0); return true; });
})();
