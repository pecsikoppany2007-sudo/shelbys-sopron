// Minőségkapu, 2. rész: Lighthouse, mobil profil (lassított CPU + 4G), minden oldalon.
// Határ: teljesítmény, akadálymentesség, bevált gyakorlatok, SEO mind ≥ 90. Noindexes (demó) oldalon a SEO csak figyelmeztet.
// Futtatás: npm run lighthouse. Egy oldal háromszor fut, a középső értéket számoljuk (a mérés szór).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { serve } from './szerver.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN = +(process.env.LH_MIN || 90);
const RUNS = +(process.env.LH_FUTAS || 3);
const PAGES = (process.env.LH_OLDALAK || fs.readdirSync(path.join(ROOT, 'site')).filter(f => f.endsWith('.html') && f !== '404.html').join(',')).split(',');
const CATS = { performance: 'teljesítmény', accessibility: 'akadálymentesség', 'best-practices': 'bevált gyakorlatok', seo: 'SEO' };

const { srv, url } = await serve();
const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH || chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
const fails = [], warns = [], rows = [];
const median = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];

for (const f of PAGES) {
  const scores = {}, notes = new Set();
  let noindex = false;
  for (let i = 0; i < RUNS; i++) {
    const r = await lighthouse(`${url}/${f}`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: Object.keys(CATS) });
    const lhr = r.lhr;
    for (const k of Object.keys(CATS)) (scores[k] = scores[k] || []).push(Math.round((lhr.categories[k]?.score ?? 0) * 100));
    noindex = lhr.audits['is-crawlable']?.score === 0;
    for (const a of Object.values(lhr.audits)) if (a.score !== null && a.score < 0.9 && a.scoreDisplayMode === 'binary' && a.id !== 'is-crawlable') notes.add(a.id);
    if (i === RUNS - 1) {
      const m = lhr.audits;
      rows.push({ oldal: f, lcp: m['largest-contentful-paint']?.displayValue, cls: m['cumulative-layout-shift']?.displayValue, tbt: m['total-blocking-time']?.displayValue });
      fs.mkdirSync(path.join(ROOT, 'teszt', 'eredmeny'), { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'teszt', 'eredmeny', `lighthouse-${f.replace('.html', '')}.json`), r.report);
    }
  }
  const med = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, median(v)]));
  Object.assign(rows[rows.length - 1], med);
  for (const [k, v] of Object.entries(med)) {
    if (v >= MIN) continue;
    if (k === 'seo' && noindex) { warns.push(`${f}: SEO ${v} (a demó noindex miatt; élesítés után újra mérd)`); continue; }
    fails.push(`${f}: ${CATS[k]} ${v} < ${MIN}`);
  }
  if (notes.size) warns.push(`${f}: elbukott ellenőrzések: ${[...notes].join(', ')}`);
}
await chrome.kill(); srv.close();

console.log('Minőségkapu (Lighthouse, mobil):');
for (const r of rows) console.log(`  ${r.oldal}: telj. ${r.performance} · akadálym. ${r.accessibility} · gyak. ${r['best-practices']} · SEO ${r.seo} | LCP ${r.lcp}, CLS ${r.cls}, TBT ${r.tbt}`);
warns.forEach(w => console.log('  ! ' + w));
fs.writeFileSync(path.join(ROOT, 'teszt', 'eredmeny', 'lighthouse.json'), JSON.stringify({ min: MIN, oldalak: rows, hibak: fails, figyelmeztetesek: warns }, null, 2));
if (fails.length) { console.log('BUKOTT:'); fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('ÁTMENT ✓');
