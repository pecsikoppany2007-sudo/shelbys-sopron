// A közzétett Google-táblázat (CSV) tartalmát beírja a site/data/menu.json-ba, hogy a beégetett étlap is friss legyen.
// Használat: npm run menu-tablazatbol   (az URL az oldal.json "tablazat_csv" mezőjéből jön)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'oldal.json'), 'utf8'));
if (!cfg.tablazat_csv) { console.error('az oldal.json "tablazat_csv" mezője üres'); process.exit(1); }
const txt = await (await fetch(cfg.tablazat_csv)).text();
// ugyanazt a feldolgozót használjuk, mint az oldal (js/kit/90-etlap.js)
const sb = { window: { KIT: { $: () => null } } };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'site/js/kit/90-etlap.js'), 'utf8'), sb);
const data = sb.window.KIT.menuFromCsv(txt);
fs.writeFileSync(path.join(ROOT, 'site/data/menu.json'), JSON.stringify(data, null, 2) + '\n');
console.log('menu.json frissítve:', data.kategoriak.length, 'kategória,', data.kategoriak.reduce((n, c) => n + c.tetelek.length, 0), 'tétel');
