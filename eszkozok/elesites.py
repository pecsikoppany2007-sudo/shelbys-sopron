# Élesítés a saját domainre (a Katlan elesites.py-ból általánosítva). Akkor futtasd, amikor a domain már a Netlifyra mutat:
#   python3 eszkozok/elesites.py pelda.hu            (megáll, ha az oldal.json üzemeltetői adata hiányos)
#   python3 eszkozok/elesites.py pelda.hu --jogi-kesobb   (élesít, de a jogi.html noindex marad, amíg nincs meg minden adat)
# Ezt csinálja: oldal.json domain, canonical + og:url minden oldalon, noindex le, _headers X-Robots-Tag le,
# robots.txt + sitemap.xml, jogi.html újragenerálása. Végén kiírja, hol maradt még noindex vagy [kitöltendő].
import datetime
import json
import pathlib
import re
import subprocess
import sys

LATER = '--jogi-kesobb' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
if len(args) != 1 or '.' not in args[0]:
    sys.exit('használat: python3 eszkozok/elesites.py <domain> [--jogi-kesobb]')
DOMAIN = args[0].lower().removeprefix('https://').removeprefix('http://').strip('/')
SITE_URL = 'https://' + DOMAIN
ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
sys.path.insert(0, str(ROOT / 'eszkozok'))
import jogi  # noqa: E402

missing = jogi.missing()
if missing and not LATER:
    sys.exit('előbb töltsd ki az oldal.json "uzemelteto" részét: ' + ', '.join(missing))

cp = ROOT / 'oldal.json'
cfg = json.loads(cp.read_text())
cfg['domain'] = DOMAIN
cp.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + '\n')

pages = [p for p in SITE.glob('*.html') if p.name not in ('404.html', 'jogi.html')]
for p in pages:
    s = p.read_text()
    url = SITE_URL + '/' + ('' if p.name == 'index.html' else p.name)
    s = re.sub(r'<meta name="robots" content="noindex[^"]*">\n?', '', s)
    s = re.sub(r'<link rel="canonical"[^>]*>\n?', '', s)
    s = re.sub(r'<meta property="og:url"[^>]*>\n?', '', s)
    s = s.replace('</title>\n', f'</title>\n<link rel="canonical" href="{url}">\n<meta property="og:url" content="{url}">\n', 1)
    p.write_text(s)

subprocess.run([sys.executable, str(ROOT / 'eszkozok' / 'beallit.py')], check=True)  # megosztási kép, cégadatok az új domainnel
subprocess.run([sys.executable, str(ROOT / 'eszkozok' / 'jogi.py')] + ([] if missing else ['--indexelt']), check=True)

h = SITE / '_headers'
hs = re.sub(r'^\s*X-Robots-Tag: noindex, nofollow\n', '', h.read_text(), flags=re.M)
h.write_text(hs)

(SITE / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: {SITE_URL}/sitemap.xml\n')
day = datetime.date.today().isoformat()
names = [''] + sorted(p.name for p in pages if p.name != 'index.html') + ([] if missing else ['jogi.html'])
urls = ''.join(f'  <url><loc>{SITE_URL}/{n}</loc><lastmod>{day}</lastmod></url>\n' for n in names)
(SITE / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')

left = [str(p.relative_to(SITE)) for p in SITE.rglob('*.html') if 'noindex' in p.read_text() and p.name != '404.html' and 'admin' not in p.parts]
todo = [str(p.relative_to(SITE)) for p in SITE.rglob('*.html') if 'kitöltendő' in p.read_text()]
print('élesítve:', SITE_URL, '| még noindex:', left or 'semmi', '| kitöltendő:', todo or 'semmi')
print('Netlify: a domaint a Netlify felületén kell hozzáadni (Domain management), a DNS-t a domain szolgáltatójánál.')
