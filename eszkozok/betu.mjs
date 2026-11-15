// Betű-letöltő: Google-/nyílt betűt tesz SAJÁT tárhelyre (GDPR: a látogató nem kapcsolódik a Google-höz), magyar ékezetekkel.
//   npm run betu -- "Fraunces" 300,400,700            normál vastagságok
//   npm run betu -- "Fraunces" 400 --dolt             dőlt is
//   npm run betu -- "Instrument Serif" 400 --csak-dolt
// A Fontsource npm-csomagjából dolgozik (npm pack, tehát npm-elérés kell, Google nem). Csak latin + latin-ext (benne az ő, ű),
// woff2, font-display: swap. Kimenet: site/fonts/*.woff2, a licenc, és site/css/betuk.css (hozzáfűzi, a régi bejegyzést cseréli).
// A végén kiírja a <link rel="preload"> sort a legfontosabb (első) vastagsághoz: azt tedd a <head>-be.
// Figyelj: ellenőrizd a betűmintán az ő/ű-t (font-choice-lessons), és tartsd 100 KB alatt (a kapu figyelmeztet).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const name = args.find(a => !a.startsWith('--') && !/^[\d,]+$/.test(a));
const weights = (args.find(a => /^[\d,]+$/.test(a)) || '400').split(',');
const styles = args.includes('--csak-dolt') ? ['italic'] : args.includes('--dolt') ? ['normal', 'italic'] : ['normal'];
if (!name) { console.error('használat: npm run betu -- "Betű neve" 400,700 [--dolt | --csak-dolt]'); process.exit(1); }
const slug = name.toLowerCase().replace(/\s+/g, '-');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'betu-'));
try { execFileSync('npm', ['pack', `@fontsource/${slug}`, '--silent'], { cwd: tmp, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { console.error(`Nincs ilyen Fontsource csomag: @fontsource/${slug} (nézd meg: fontsource.org)`); process.exit(1); }
const tgz = fs.readdirSync(tmp).find(f => f.endsWith('.tgz'));
execFileSync('tar', ['xzf', tgz], { cwd: tmp });
const pkg = path.join(tmp, 'package');
const ver = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'), 'utf8')).version;

const outFonts = path.join(ROOT, 'site', 'fonts'); fs.mkdirSync(outFonts, { recursive: true });
let css = `/* ${name} (Fontsource ${ver}), latin + latin-ext, saját tárhely */\n`, kb = 0, first = null;
for (const st of styles) for (const w of weights) {
  const src = path.join(pkg, `${w}${st === 'italic' ? '-italic' : ''}.css`);
  if (!fs.existsSync(src)) { console.error(`  ! nincs ${w} ${st === 'italic' ? 'dőlt' : 'normál'} vastagság`); continue; }
  const blocks = fs.readFileSync(src, 'utf8').split('/* ').filter(b => /-(latin|latin-ext)-\d+-(normal|italic) \*\//.test(b));
  for (const b of blocks) {
    const file = b.match(/url\(\.\/files\/([^)]+\.woff2)\)/)[1];
    fs.copyFileSync(path.join(pkg, 'files', file), path.join(outFonts, file));
    kb += fs.statSync(path.join(outFonts, file)).size / 1024;
    if (!first && /-latin-\d/.test(file)) first = file;
    css += '/* ' + b.replace(/url\(\.\/files\/([^)]+\.woff2)\) format\('woff2'\), url\([^)]+\) format\('woff'\)/, "url(../fonts/$1) format('woff2')").trim() + '\n\n';
  }
}
const lic = ['LICENSE', 'LICENSE.md', 'OFL.txt'].map(f => path.join(pkg, f)).find(f => fs.existsSync(f));
if (lic) fs.copyFileSync(lic, path.join(outFonts, `${slug}-LICENSE.txt`));

const cssPath = path.join(ROOT, 'site', 'css', 'betuk.css');
let all = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '/* Saját tárhelyen lévő betűk. Az eszkozok/betu.mjs írja; a <head>-ben a style.css ELŐTT töltsd be. */\n\n';
all = all.replace(new RegExp(`/\\* ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(Fontsource[\\s\\S]*?(?=/\\* \\S[^\\n]*\\(Fontsource|$)`), '');
fs.writeFileSync(cssPath, all.trimEnd() + '\n\n' + css);
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`kész: ${name} ${weights.join(',')} ${styles.join('+')}, ${Math.round(kb)} KB woff2 → site/fonts/, site/css/betuk.css`);
if (kb > 100) console.log(`  ! ${Math.round(kb)} KB: kevesebb vastagság vagy változó betű kellene (100 KB alatt jó)`);
if (first) console.log(`  a <head>-be:  <link rel="preload" href="fonts/${first}" as="font" type="font/woff2" crossorigin>`);
console.log('  css:  font-family: \'' + name + '\', <hasonló rendszerbetű>;   és a <head>-be: <link rel="stylesheet" href="css/betuk.css">');
