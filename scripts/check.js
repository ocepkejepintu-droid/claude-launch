// Stills + layout check. Renders a contact sheet (default: the settled moment of every scene)
// and prints the timeline plus layout warnings: text running into cards, text off-frame,
// headlines wrapping past two lines.
//   node check.js <build-dir> <sheet.png> [t1 t2 ...]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

(async () => {
  const [buildDir, out, ...ts] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.resolve(buildDir, 'film.html'));
  await p.evaluate(() => window.READY);
  if (errs.length) { console.log('PAGE ERRORS:\n ' + errs.join('\n ')); process.exit(1); }
  const tl = await p.evaluate(() => window.TIMELINE);
  const dur = await p.evaluate(() => window.DURATION);
  console.log(`duration ${dur}s`);
  tl.forEach(s => console.log(`  #${s.i} ${s.type.padEnd(9)} ${s.start.toFixed(2)} → ${s.end.toFixed(2)}`));
  // default sample: 1.6 s before each scene starts leaving (everything has arrived)
  const times = ts.length ? ts.map(Number) : tl.map(s => +(s.end - 1.6).toFixed(2));
  const tmp = path.join(path.dirname(path.resolve(out)), '.stills'); fs.mkdirSync(tmp, { recursive: true });
  const files = []; const warnings = [];
  for (const t of times) {
    await p.evaluate(t => window.seek(t), t);
    const w = await p.evaluate(() => {
      const res = [];
      const vis = el => { const s = getComputedStyle(el); return s.visibility !== 'hidden' && +s.opacity > 0.05; };
      const scenes = [...document.querySelectorAll('.scene')].filter(s => s.style.visibility === 'visible');
      scenes.forEach(sc => {
        const texts = [...sc.querySelectorAll('.left .w, .left .sub, .left .eyebrow')].filter(vis).map(e => e.getBoundingClientRect());
        const boxes = [...sc.querySelectorAll('.card, .phone, .price')].filter(vis).map(e => e.getBoundingClientRect());
        texts.forEach(r => boxes.forEach(c => {
          if (r.right > c.left + 4 && r.left < c.right && r.bottom > c.top && r.top < c.bottom) res.push(`${sc.dataset.type}: text overlaps a card (text right edge ${Math.round(r.right)} > card left ${Math.round(c.left)})`);
        }));
        [...sc.querySelectorAll('.w, .card, .phone, .price, .pill')].filter(vis).forEach(e => {
          const r = e.getBoundingClientRect();
          if (r.right > 1900 || r.left < 20 || r.bottom > 1075) res.push(`${sc.dataset.type}: element near/off frame edge (${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)})`);
        });
        sc.querySelectorAll('.h1, .h2').forEach(hd => {
          const lines = new Set([...hd.querySelectorAll('.w')].map(w => w.offsetTop)).size;
          if (lines > 2 && !hd.closest('[data-type="statement"]')) res.push(`${sc.dataset.type}: headline wraps to ${lines} lines: "${hd.textContent.trim().slice(0, 60)}"`);
        });
        sc.querySelectorAll('.sub').forEach(s => {
          const words = [...s.querySelectorAll('.w')];
          if (!words.length) { const range = document.createRange(); range.selectNodeContents(s); const rects = [...range.getClientRects()];
            const last = rects[rects.length - 1]; if (rects.length > 1 && last && last.width < 120) res.push(`${sc.dataset.type}: body text ends with a short orphan line ("…${s.textContent.trim().split(/\s+/).slice(-1)[0]}") — add a manual line break`); }
        });
      });
      return [...new Set(res)];
    });
    w.forEach(x => warnings.push(`t=${t}: ${x}`));
    const f = path.join(tmp, `t_${t.toFixed(2)}.png`); await p.screenshot({ path: f }); files.push(f);
  }
  await b.close();
  const cols = Math.min(3, files.length);
  const fc = files.map((f, i) => `[${i}]scale=640:360,drawtext=text='${times[i]}s':x=12:y=10:fontsize=22:fontcolor=0xd0021b[v${i}]`).join(';');
  const layout = files.map((f, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
  const filter = files.length > 1 ? `${fc};${files.map((f, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black` : fc.replace('[v0]', '');
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', filter, out]);
  console.log(warnings.length ? `\n${warnings.length} layout warning(s):\n  ` + warnings.join('\n  ') : '\nlayout: no warnings');
  console.log('sheet:', out);
})();
