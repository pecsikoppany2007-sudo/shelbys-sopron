// Minőségkapu, 1. rész: Playwright. Futtatás: npm run kapu   (Lighthouse: npm run lighthouse, mind: npm test)
// Ellenőrzi minden oldalon, minden nyelven, 320–1920 px között:
//  0 konzolhiba / JS-hiba / hibás kérés · nincs vízszintes görgetés · a címek kiférnek · nincs hiányzó fordítás
//  · nincs láthatatlan réteg a linkek fölött · minden képnek van alt-ja és betöltődik · a menülinkek célja létezik
//  · élő nyelvváltás = friss betöltés · nincs külső kérés hozzájárulás nélkül · cím, leírás, megosztási kép, cégadatok (JSON-LD), 1 db h1
//  · képeken width/height, betűkön font-display · az intro lefut és eltűnik · csökkentett mozgásnál minden látszik · érintőn nincs egyedi kurzor
// Figyelmeztet (nem buktat): [kitöltendő] jelölés maradt, noindex van az oldalon.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './szerver.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'oldal.json'), 'utf8'));
const rovid = cfg.rovid || 'oldal';
const LANGS = cfg.nyelvek || ['hu'];
const WIDTHS = (process.env.KAPU_SZELESSEG || '320,375,414,768,1024,1280,1440,1920').split(',').map(Number);
const PAGES = fs.readdirSync(path.join(ROOT, 'site')).filter(f => f.endsWith('.html') && f !== '404.html');
const exe = process.env.CHROME_PATH; // ha a gépen már van Chromium (pl. felhő-konténer), azt használja

const fails = [], warns = [];
const fail = (where, msg) => fails.push(`${where}: ${msg}`);
const warn = (where, msg) => { if (!warns.includes(`${where}: ${msg}`)) warns.push(`${where}: ${msg}`); };

const { srv, url } = await serve();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

/* külső szerverek, amikhez hozzájárulás nélkül is szabad kapcsolódni (a jogi oldal leírja) */
const ALLOW = new Set((cfg.kulso_engedett || []).concat(cfg.funkciok?.google_tablazat_menu ? ['docs.google.com', 'doc-0s-0s-sheets.googleusercontent.com'] : []));
const allowed = h => ALLOW.has(h) || (cfg.funkciok?.google_tablazat_menu && /\.googleusercontent\.com$/.test(h));
function watch(page, where) {
  page.on('request', r => {
    const u = r.url(); if (u.startsWith(url) || u.startsWith('data:') || u.startsWith('blob:')) return;
    const h = new URL(u).hostname;
    if (!allowed(h)) fail(where, 'külső kérés hozzájárulás nélkül (GDPR): ' + h + ' – töltsd le helyre, vagy csak kattintásra töltsd be');
  });
  page.on('console', m => { if (m.type() === 'error') fail(where, 'konzolhiba: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => fail(where, 'JS-hiba: ' + String(e.message).slice(0, 200)));
  page.on('requestfailed', r => { if (r.url().startsWith(url) && !/aborted/i.test(r.failure()?.errorText || '')) fail(where, 'kérés elbukott: ' + r.url().replace(url, '')); });
  page.on('response', r => { if (r.url().startsWith(url) && r.status() >= 400) fail(where, `HTTP ${r.status()}: ${r.url().replace(url, '')}`); });
}

async function ctx(opts = {}, { lang, skipIntro = true } = {}) {
  const c = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  await c.addInitScript(([k, l, s]) => {
    try { if (l) localStorage.setItem(k + '-lang', l); if (s) sessionStorage.setItem(k + '-intro', '1'); } catch (e) {}
  }, [rovid, lang, skipIntro]);
  return c;
}

/* egy oldal, egy nyelv, egy szélesség */
async function checkLayout(file, lang, w) {
  const where = `${file} ${lang} ${w}px`;
  const c = await ctx({ viewport: { width: w, height: w < 800 ? 780 : 900 }, ...(w < 800 ? { hasTouch: true, isMobile: true } : {}) }, { lang });
  const page = await c.newPage(); watch(page, where);
  await page.goto(`${url}/${file}`, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  // telefonon a túl széles elem kitágítja a layout viewportot (innerWidth nő, az oldal kicsinyít), ezért a kért szélességhez mérünk
  const r = await page.evaluate((W) => {
    const out = {};
    const de = document.documentElement;
    out.overflow = Math.max(de.scrollWidth, innerWidth) - W;
    out.wide = out.overflow > 0 ? [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return b.width > W + 1 && b.right > W + 1 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 3).map(e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '')) : [];
    out.lang = de.lang;
    out.emptyI18n = [...document.querySelectorAll('[data-i18n]')].filter(e => !e.closest('[hidden]') && !e.textContent.trim()).map(e => e.getAttribute('data-i18n')).slice(0, 5);
    out.cut = [...document.querySelectorAll('h1, h2, h3, .ln__i')].filter(e => e.offsetParent && !e.closest('[hidden]')).filter(e => {
      const ws = e.querySelectorAll('.w'); if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible') return true;
      const b = e.getBoundingClientRect(); return b.right > innerWidth + 1 || [...ws].some(x => x.getBoundingClientRect().right > innerWidth + 1);
    }).map(e => e.textContent.trim().slice(0, 30)).slice(0, 3);
    out.noAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).map(i => i.getAttribute('src')).slice(0, 5);
    out.broken = [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map(i => i.getAttribute('src')).slice(0, 5);
    out.anchors = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1 && h !== '#top' && !document.getElementById(h.slice(1)));
    out.todo = (document.body.innerText.match(/kitöltendő/g) || []).length;
    out.noindex = !!document.querySelector('meta[name="robots"][content*="noindex"]');
    return out;
  }, w);
  if (r.overflow > 0) fail(where, `vízszintes görgetés ${r.overflow}px (${r.wide.join(', ')})`);
  if (r.lang !== lang) fail(where, `html lang = ${r.lang}, várt: ${lang}`);
  if (r.emptyI18n.length) fail(where, 'hiányzó fordítás: ' + r.emptyI18n.join(', '));
  if (r.cut.length) fail(where, 'cím nem fér ki: ' + r.cut.join(' | '));
  if (r.noAlt.length) fail(where, 'kép alt nélkül: ' + r.noAlt.join(', '));
  if (r.broken.length) fail(where, 'nem töltődő kép: ' + r.broken.join(', '));
  if (r.anchors.length) fail(where, 'link cél nélkül: ' + r.anchors.join(', '));
  if (r.todo) warn(file, `[kitöltendő] maradt (${r.todo}×)`);
  if (r.noindex) warn(file, 'noindex (demó, élesítéskor: eszkozok/elesites.py)');
  /* láthatatlan réteg: az első 3 látható tartalmi link közepén tényleg a link van? */
  if (w === 1280 || w === 375 || w === 320) {
    const links = await page.$$('main a[href], footer a[href]');
    let n = 0;
    for (const a of links) {
      if (n >= 3) break;
      if (!(await a.isVisible())) continue;
      await a.scrollIntoViewIfNeeded(); await page.waitForTimeout(250);
      const ok = await a.evaluate(el => { const b = el.getBoundingClientRect(); const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !hit || el === hit || el.contains(hit) || hit.contains(el); });
      if (!ok) fail(where, 'egy réteg eltakarja a linket: ' + (await a.getAttribute('href')));
      n++;
    }
  }
  await c.close();
}

/* élő nyelvváltás = friss betöltés */
async function checkLiveSwitch(file) {
  if (LANGS.length < 2) return;
  for (const l of LANGS.slice(1)) {
    const where = `${file} nyelvváltás ${LANGS[0]}→${l}`;
    const c1 = await ctx({}, { lang: LANGS[0] }); const p1 = await c1.newPage(); watch(p1, where);
    await p1.goto(`${url}/${file}`, { waitUntil: 'load' }); await p1.waitForTimeout(500);
    const btn = p1.locator(`[data-lang="${l}"], [data-l="${l}"]`).first();
    if (!(await btn.count())) { await c1.close(); continue; }
    try { await btn.click({ timeout: 3000 }); } catch (e) { fail(where, 'a nyelvgomb nem kattintható (valami eltakarja)'); await c1.close(); continue; }
    await p1.waitForTimeout(600);
    const live = await p1.evaluate(() => document.body.innerText.replace(/\d{1,2}:\d{2}/g, '').replace(/\s+/g, ' ').trim());
    const c2 = await ctx({}, { lang: l }); const p2 = await c2.newPage(); watch(p2, where);
    await p2.goto(`${url}/${file}`, { waitUntil: 'load' }); await p2.waitForTimeout(500);
    const fresh = await p2.evaluate(() => document.body.innerText.replace(/\d{1,2}:\d{2}/g, '').replace(/\s+/g, ' ').trim());
    if (live !== fresh) {
      let i = 0; while (i < live.length && live[i] === fresh[i]) i++;
      fail(where, `más, mint friss betöltésnél: „…${live.slice(Math.max(0, i - 20), i + 40)}” ≠ „…${fresh.slice(Math.max(0, i - 20), i + 40)}”`);
    }
    await c1.close(); await c2.close();
  }
}

/* intro: lefut, eltűnik, utána minden kattintható; egérrel és érintővel */
async function checkIntro() {
  for (const [name, opts] of [['gép', {}], ['telefon', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }]]) {
    const where = `index.html intro ${name}`;
    const c = await ctx(opts, { lang: LANGS[0], skipIntro: false }); const p = await c.newPage(); watch(p, where);
    await p.goto(`${url}/index.html`, { waitUntil: 'load' });
    const had = await p.evaluate(() => document.documentElement.classList.contains('intro-on'));
    if (!had) { warn('index.html', 'nincs intro (vagy ki van kapcsolva)'); await c.close(); return; }
    try { await p.waitForFunction(() => !document.getElementById('intro') && !document.documentElement.classList.contains('intro-on'), null, { timeout: 15000 }); }
    catch (e) { fail(where, 'az intro 15 mp alatt sem tűnt el'); }
    const vis = await p.evaluate(() => { const h = document.querySelector('h1'); return h ? h.getBoundingClientRect().height > 0 && getComputedStyle(h).visibility !== 'hidden' : true; });
    if (!vis) fail(where, 'az intro után nem látszik a cím');
    /* kihagyás: második betöltés ugyanabban a munkamenetben nem játssza le */
    await p.reload({ waitUntil: 'load' });
    if (await p.evaluate(() => document.documentElement.classList.contains('intro-on'))) fail(where, 'újratöltéskor megint lejátszódik (munkamenetenként egyszer kell)');
    await c.close();
  }
}

/* csökkentett mozgás: nincs intro, a címek a helyükön */
async function checkReduced(file) {
  const where = `${file} csökkentett mozgás`;
  const c = await ctx({ reducedMotion: 'reduce' }, { lang: LANGS[0], skipIntro: false }); const p = await c.newPage(); watch(p, where);
  await p.goto(`${url}/${file}`, { waitUntil: 'load' }); await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({
    intro: document.documentElement.classList.contains('intro-on') && !!document.getElementById('intro') && getComputedStyle(document.getElementById('intro')).display !== 'none',
    hidden: [...document.querySelectorAll('.ln__i')].filter(e => getComputedStyle(e).transform !== 'none').length
  }));
  if (r.intro) fail(where, 'az intro csökkentett mozgásnál is fut');
  if (r.hidden) fail(where, `${r.hidden} címsor nincs a helyén`);
  await c.close();
}

/* érintő: nincs egyedi kurzor, nincs Lenis */
async function checkTouch(file) {
  const where = `${file} érintő`;
  const c = await ctx({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, { lang: LANGS[0] }); const p = await c.newPage(); watch(p, where);
  await p.goto(`${url}/${file}`, { waitUntil: 'load' }); await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ cur: !!document.querySelector('.kurzor'), lenis: !!(window.KIT && window.KIT.lenis) }));
  if (r.cur) fail(where, 'érintőn is van egyedi kurzor');
  if (r.lenis) fail(where, 'érintőn is fut a Lenis (natív görgetés kell)');
  await c.close();
}

/* fej: cím, leírás, megosztási kép, Google-nek szóló cégadatok, egy h1, képméretek, betűk */
async function checkHead(file) {
  const where = `${file} fej`;
  const c = await ctx({}, { lang: LANGS[0] }); const p = await c.newPage(); watch(p, where);
  let bytes = 0;
  p.on('response', async r => { try { if (r.url().startsWith(url)) bytes += (await r.body()).length; } catch (e) {} });
  await p.goto(`${url}/${file}`, { waitUntil: 'load' }); await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    const m = n => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.getAttribute('content') || '';
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent); } catch (e) { return 'HIBÁS'; } });
    const fonts = [];
    for (const sh of document.styleSheets) { try { for (const ru of sh.cssRules) if (ru instanceof CSSFontFaceRule && !ru.style.getPropertyValue('font-display')) fonts.push(ru.style.getPropertyValue('font-family')); } catch (e) {} }
    return {
      title: document.title, desc: m('description'), ogimg: m('og:image'), viewport: m('viewport'), lang: document.documentElement.getAttribute('lang'),
      h1: [...document.querySelectorAll('h1')].filter(h => !h.closest('[hidden]')).length, ld, fonts,
      noSize: [...document.querySelectorAll('img')].filter(i => !(i.getAttribute('width') && i.getAttribute('height'))).map(i => i.getAttribute('src')).slice(0, 5),
      big: performance.getEntriesByType('resource').filter(e => e.initiatorType === 'img' && e.encodedBodySize > 450000).map(e => e.name.split('/').pop() + ' ' + Math.round(e.encodedBodySize / 1024) + ' KB'),
      noindex: !!document.querySelector('meta[name="robots"][content*="noindex"]'),
      /* oldal-költségvetés (darkroom szabályai): JS < 300 KB, CSS < 100 KB, betűk < 100 KB, az első képernyő képei < 500 KB */
      budget: performance.getEntriesByType('resource').concat(performance.getEntriesByType('navigation')).reduce((a, e) => {
        const n = e.name.split('?')[0], b = e.encodedBodySize || e.transferSize || 0;
        const k = /\.m?js$/.test(n) ? 'js' : /\.css$/.test(n) ? 'css' : /\.(woff2?|ttf|otf)$/.test(n) ? 'font' : null;
        if (k) a[k] += b; return a;
      }, { js: 0, css: 0, font: 0 }),
      foldImg: [...document.querySelectorAll('img')].filter(i => { const b = i.getBoundingClientRect(); return b.width && b.top < innerHeight && b.bottom > 0; })
        .reduce((a, i) => { const e = performance.getEntriesByName(i.currentSrc || i.src)[0]; return a + (e ? e.encodedBodySize || e.transferSize || 0 : 0); }, 0),
      /* az első képernyőn lévő kép nem lehet lusta (késik tőle a legnagyobb tartalom, LCP) */
      lazyFold: [...document.querySelectorAll('img[loading="lazy"]')].filter(i => { const b = i.getBoundingClientRect(); return b.width && b.top < innerHeight && b.bottom > 0; }).map(i => i.getAttribute('src'))
    };
  });
  const KB = n => Math.round(n / 1024);
  if (r.budget.js > 300 * 1024) fail(where, `JS ${KB(r.budget.js)} KB (300 KB alatt kell)`);
  if (r.budget.css > 100 * 1024) fail(where, `CSS ${KB(r.budget.css)} KB (100 KB alatt kell)`);
  if (r.budget.font > 100 * 1024) warn(file, `betűk ${KB(r.budget.font)} KB (100 KB alatt jó: subset, woff2, kevesebb vastagság)`);
  if (r.foldImg > 500 * 1024) warn(file, `az első képernyő képei ${KB(r.foldImg)} KB (500 KB alatt jó)`);
  if (r.lazyFold.length) fail(where, 'az első képernyőn lusta (loading=lazy) kép van, késlelteti a nyitóképet: ' + r.lazyFold.join(', '));
  if (!r.title || r.title.length < 10 || r.title.length > 70) fail(where, `a lap címe ${r.title.length} karakter (10–70 legyen)`);
  if (!r.viewport) fail(where, 'nincs viewport meta');
  if (!r.lang) fail(where, 'nincs html lang');
  if (r.h1 !== 1) fail(where, `${r.h1} db h1 van (pontosan 1 kell)`);
  if (r.fonts.length) fail(where, 'betű font-display nélkül (láthatatlan szöveg betöltéskor): ' + [...new Set(r.fonts)].join(', '));
  if (r.noSize.length) fail(where, 'kép width/height nélkül (ugrál betöltéskor): ' + r.noSize.join(', '));
  if (r.big.length) warn(file, 'nagy kép (450 KB fölött): ' + r.big.join(', '));
  if (bytes > 3_000_000) warn(file, `az oldal első betöltése ${Math.round(bytes / 1e5) / 10} MB (3 MB alatt jó)`);
  if (file === 'index.html' || !r.noindex) {
    if (r.desc.length < 50 || r.desc.length > 165) fail(where, `a leírás (meta description) ${r.desc.length} karakter (50–160 legyen)`);
    if (!r.ogimg) fail(where, 'nincs megosztási kép (og:image)');
    else {
      const local = path.join(ROOT, 'site', new URL(r.ogimg, url).pathname);
      if (!fs.existsSync(local)) fail(where, 'a megosztási kép fájlja nincs meg: ' + new URL(r.ogimg, url).pathname);
    }
  }
  if (file === 'index.html') {
    const biz = r.ld.find(x => x && x.name);
    if (r.ld.includes('HIBÁS')) fail(where, 'hibás JSON-LD (Google-nek szóló cégadatok)');
    else if (!biz) fail(where, 'nincsenek Google-nek szóló cégadatok (JSON-LD): futtasd a beallit.py-t');
    else {
      if (!biz.address) fail(where, 'a cégadatokból hiányzik a cím');
      if (!biz.openingHoursSpecification) warn(file, 'a cégadatokból hiányzik a nyitvatartás');
      if (!biz.sameAs) warn(file, 'a cégadatokból hiányoznak a közösségi profilok (oldal.json "profilok")');
    }
    const ph = ['img/megosztas.jpg', 'apple-touch-icon.png'].filter(f => fs.existsSync(path.join(ROOT, 'site', f)) && fs.statSync(path.join(ROOT, 'site', f)).size < 40000);
    if (ph.length) warn(file, 'helykitöltő kép lehet még (kicsi fájl): ' + ph.join(', '));
  }
  await c.close();
}

/* fájlméret-őr (darkroom check-assets ötlete): kép 1 MB, videó 8 MB, ikon 40 KB fölött bukik */
function checkAssets() {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  for (const f of walk(path.join(ROOT, 'site'))) {
    const rel = path.relative(path.join(ROOT, 'site'), f), size = fs.statSync(f).size, ext = path.extname(f).toLowerCase();
    if (/(^|\/)(apple-touch-icon|favicon|icon)[^/]*\.(png|ico)$/.test(rel) && size > 40e3) fail('fájlok', `${rel}: ikon ${Math.round(size / 1024)} KB (40 KB alatt kell)`);
    else if (['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(ext) && size > 1e6) fail('fájlok', `${rel}: ${Math.round(size / 1024)} KB kép (1 MB alatt kell, használd az eszkozok/kepek.py-t)`);
    else if (['.mp4', '.webm', '.mov'].includes(ext) && size > 8e6) fail('fájlok', `${rel}: ${Math.round(size / 1e6)} MB videó (8 MB alatt kell)`);
  }
}

/* akadálymentesség (axe-core, WCAG 2.1 AA): súlyos és kritikus hiba bukik, közepes figyelmeztet. Minden nyelven, gépen és telefonon */
const AXE = path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js');
async function checkA11y(file, lang, w) {
  const where = `${file} ${lang} ${w}px akadálymentesség`;
  const c = await ctx({ viewport: { width: w, height: 800 }, ...(w < 800 ? { hasTouch: true, isMobile: true } : {}) }, { lang }); const p = await c.newPage(); watch(p, where);
  await p.goto(`${url}/${file}`, { waitUntil: 'load' }); await p.waitForTimeout(600);
  await p.addScriptTag({ path: AXE });
  const res = await p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, resultTypes: ['violations'] });
    return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, el: v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ') }));
  });
  for (const v of res) {
    const msg = `${v.id} (${v.n}×): ${v.help} → ${v.el}`;
    if (v.impact === 'serious' || v.impact === 'critical') fail(where, msg); else warn(file, 'akadálymentesség: ' + msg);
  }
  await c.close();
}

const t0 = Date.now();
checkAssets();
const safe = async (where, fn) => { try { await fn(); } catch (e) { fail(where, 'a teszt elakadt: ' + String(e.message).split('\n')[0].slice(0, 160)); } };
for (const f of PAGES) for (const l of LANGS) for (const w of WIDTHS) await safe(`${f} ${l} ${w}px`, () => checkLayout(f, l, w));
for (const f of PAGES) await safe(`${f} nyelvváltás`, () => checkLiveSwitch(f));
if (PAGES.includes('index.html')) await safe('intro', checkIntro);
for (const f of PAGES) await safe(`${f} fej`, () => checkHead(f));
for (const f of PAGES) for (const l of LANGS) for (const w of [1280, 375]) await safe(`${f} ${l} akadálymentesség`, () => checkA11y(f, l, w));
for (const f of PAGES) { await safe(`${f} csökkentett mozgás`, () => checkReduced(f)); await safe(`${f} érintő`, () => checkTouch(f)); }
{ // 404
  const c = await ctx(); const p = await c.newPage();
  const r = await p.goto(`${url}/nincs-ilyen-oldal`); if (r.status() !== 404) fail('404', `nem 404-et ad (${r.status()})`);
  await c.close();
}
await browser.close(); srv.close();

const uniq = [...new Set(fails)];
const rep = { ido_mp: Math.round((Date.now() - t0) / 1000), oldalak: PAGES, nyelvek: LANGS, szelessegek: WIDTHS, hibak: uniq, figyelmeztetesek: warns };
fs.mkdirSync(path.join(ROOT, 'teszt', 'eredmeny'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'teszt', 'eredmeny', 'kapu.json'), JSON.stringify(rep, null, 2));
console.log(`Minőségkapu (Playwright): ${PAGES.length} oldal × ${LANGS.length} nyelv × ${WIDTHS.length} szélesség, ${rep.ido_mp} mp`);
warns.forEach(w => console.log('  ! ' + w));
if (uniq.length) { console.log(`BUKOTT, ${uniq.length} hiba:`); uniq.slice(0, 60).forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('ÁTMENT ✓');
