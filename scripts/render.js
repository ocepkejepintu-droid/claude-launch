// Deterministic frame renderer. Loads <build>/film.html, calls window.seek(t) for every frame,
// and screenshots each one. Frames are pure functions of t, so any range can be re-rendered later.
//   node render.js <build-dir> <out-dir> [--fps 60] [--from 0] [--to END] [--workers 4] [--scale 1] [--jpeg]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const [buildDir, outDir] = args;   // positional arguments come first
const fps = +opt('fps', 60), workers = +opt('workers', 4), scale = +opt('scale', 1), jpeg = !!opt('jpeg', false);

(async () => {
  if (!buildDir || !outDir) { console.error('usage: node render.js <build-dir> <out-dir> [--fps 60] [--from s] [--to s] [--workers 4] [--scale 1] [--jpeg]'); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  const url = 'file://' + path.resolve(buildDir, 'film.html');
  const launch = () => chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
  const probe = await launch();
  const pp = await probe.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; pp.on('pageerror', e => errs.push(e.message));
  await pp.goto(url); await pp.evaluate(() => window.READY);
  if (errs.length) { console.error('page errors:', errs); process.exit(1); }
  const DUR = await pp.evaluate(() => window.DURATION);
  await probe.close();
  const t0 = +opt('from', 0), t1 = Math.min(+opt('to', DUR), DUR);
  const frames = [];
  for (let f = Math.round(t0 * fps); f < Math.round(t1 * fps); f++) frames.push(f);
  let next = 0, done = 0; const started = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const b = await launch();
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
    await p.goto(url); await p.evaluate(() => window.READY);
    while (next < frames.length) {
      const f = frames[next++];
      await p.evaluate(t => window.seek(t), f / fps);
      const file = path.join(outDir, `f_${String(f).padStart(5, '0')}.${jpeg ? 'jpg' : 'png'}`);
      await p.screenshot(jpeg ? { path: file, type: 'jpeg', quality: 90 } : { path: file });
      if (++done % 120 === 0) {
        const r = done / ((Date.now() - started) / 1000);
        console.log(`${done}/${frames.length}  ${r.toFixed(1)} fps  eta ${((frames.length - done) / r).toFixed(0)}s`);
      }
    }
    await b.close();
  }));
  console.log('wrote', frames.length, 'frames');
})();
