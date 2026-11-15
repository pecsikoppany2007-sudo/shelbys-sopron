// Kis statikus szerver a site/ mappához (a tesztekhez). Nem kell hozzá semmi más. Ismeretlen út = 404.html, 404-es kóddal.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };

export function serve(port = 0) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    let f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    let code = 200;
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      if (fs.existsSync(f + '.html')) f += '.html';
      else if (fs.existsSync(path.join(f, 'index.html'))) f = path.join(f, 'index.html');
      else { f = path.join(ROOT, '404.html'); code = 404; }
    }
    const type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
    // szöveges fájlok tömörítve, ahogy a Netlify is küldi (különben a mérés a valóságnál rosszabb)
    const zip = /text|javascript|json|svg|xml|manifest/.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache', ...(zip ? { 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' } : {}) });
    const st = fs.createReadStream(f);
    if (zip) st.pipe(zlib.createGzip({ level: 6 })).pipe(res); else st.pipe(res);
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r({ srv, url: `http://127.0.0.1:${srv.address().port}` })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await serve(+process.env.PORT || 8080);
  console.log('szerver:', url);
}
