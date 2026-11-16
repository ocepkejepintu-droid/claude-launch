// Export the film's sound cues + timeline (window.CUES / window.TIMELINE) to JSON.
//   node cues.js <build-dir> <cues.json>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [buildDir, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(buildDir, 'film.html')); await p.evaluate(() => window.READY);
  if (errs.length) { console.error('page errors:', errs); process.exit(1); }
  const cues = await p.evaluate(() => window.CUES);
  fs.writeFileSync(out, JSON.stringify(cues, null, 1));
  console.log(`duration ${cues.duration}s, ${cues.events.length} sound cues`);
  await b.close();
})();
