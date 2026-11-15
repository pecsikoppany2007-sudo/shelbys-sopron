# Új oldal beállítása az oldal.json alapján. Futtasd minden oldal.json-változás után:
#   python3 eszkozok/beallit.py
# Ezt csinálja:
#  - site/js/oldal.js (a JS beállítás) és site/js/kit.js (a kit/ modulok egy fájlban)
#  - az oldalak korai szkriptjében a kulcs és a nyelvek
#  - a <!-- fej --> blokk: ikonok, téma szín, megosztási kép (og/twitter), Google-nek szóló cégadatok (JSON-LD:
#    típus, cím, telefon, koordináta, nyitvatartás, ünnepnapok, profilok) – ettől jelenik meg szépen a Google-ben és megosztáskor
#  - site/site.webmanifest, és ha hiányzik: helykitöltő megosztási kép és apple-touch-icon (cseréld valódira!)
#  - a jogi.html újragenerálása
import html as H
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
cfg = json.loads((ROOT / 'oldal.json').read_text())
rovid = re.sub(r'[^a-z0-9-]', '', cfg.get('rovid', 'oldal').lower()) or 'oldal'
langs = cfg.get('nyelvek', ['hu'])
nev = cfg['nev']
base = ('https://' + cfg['domain']) if cfg.get('domain') else cfg.get('netlify', '').rstrip('/')
warn = []

# ---------------------------------------------------------------- JS beállítás + modulok
js = {k: cfg[k] for k in ('nev', 'cim', 'telefon', 'nyelvek', 'nyitvatartas', 'kivetelek', 'intro', 'tablazat_csv') if k in cfg}
js['rovid'] = rovid
if not cfg.get('funkciok', {}).get('google_tablazat_menu'):
    js['tablazat_csv'] = ''
(SITE / 'js' / 'oldal.js').write_text('/* A beallit.py írja az oldal.json-ból, ne kézzel szerkeszd. */\nwindow.OLDAL = ' + json.dumps(js, ensure_ascii=False, indent=1) + ';\n')
mods = sorted((SITE / 'js' / 'kit').glob('*.js'))
(SITE / 'js' / 'kit.js').write_text('/* A beallit.py fűzi össze a js/kit/ modulokból, ne kézzel szerkeszd. */\n' + '\n'.join(m.read_text() for m in mods))

# ---------------------------------------------------------------- helykitöltő képek (csak ha nincsenek)
def placeholder(path, size, text):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        warn.append(f'{path.name} hiányzik (Pillow nélkül nem tudok helykitöltőt csinálni)')
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    im = Image.new('RGB', size, cfg.get('szin', '#12110f'))
    d = ImageDraw.Draw(im)
    try:
        f = ImageFont.truetype('DejaVuSerif.ttf', size[1] // (4 if size[0] > size[1] * 1.2 else 2))
    except OSError:
        f = ImageFont.load_default()
    d.text((size[0] / 2, size[1] / 2), text, fill='#efe9df', font=f, anchor='mm')
    im.save(path, quality=86)
    warn.append(f'{path.relative_to(SITE)}: HELYKITÖLTŐ, cseréld a hely valódi fotójára / logójára')

og = SITE / cfg.get('megosztas_kep', 'img/megosztas.jpg')
if not og.exists():
    placeholder(og, (1200, 630), nev)
touch = SITE / 'apple-touch-icon.png'
if not touch.exists():
    placeholder(touch, (180, 180), nev[:1])

# ---------------------------------------------------------------- Google-nek szóló cégadatok (schema.org JSON-LD)
DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
def hm(s):
    h, m = map(int, s.split(':'))
    return f'{h % 24:02d}:{m:02d}'

ld = {'@context': 'https://schema.org', '@type': cfg.get('schema_tipus', 'LocalBusiness'), 'name': nev}
if base:
    ld['url'] = base + '/'
    ld['image'] = base + '/' + cfg.get('megosztas_kep', 'img/megosztas.jpg')
m = re.match(r'^\s*(\d{4})\s+([^,]+),\s*(.+?)\s*$', cfg.get('cim', ''))
if m:
    ld['address'] = {'@type': 'PostalAddress', 'streetAddress': m.group(3), 'addressLocality': m.group(2), 'postalCode': m.group(1), 'addressCountry': 'HU'}
else:
    warn.append('a "cim" formája legyen: "9400 Sopron, Fő tér 1." (különben a Google-nek nem tudom szétbontani)')
if cfg.get('telefon'):
    ld['telephone'] = cfg['telefon'].replace(' ', '')
if cfg.get('email_publikus'):
    ld['email'] = cfg['email_publikus']
if cfg.get('koordinata'):
    ld['geo'] = {'@type': 'GeoCoordinates', 'latitude': cfg['koordinata'][0], 'longitude': cfg['koordinata'][1]}
if cfg.get('arkategoria'):
    ld['priceRange'] = cfg['arkategoria']
prof = [u for u in cfg.get('profilok', []) if u and 'PELDA' not in u]
if prof:
    ld['sameAs'] = prof
elif cfg.get('profilok'):
    warn.append('oldal.json "profilok": még a PELDA linkek vannak benne')
spec, groups = [], {}
for d, (o, c) in enumerate(cfg.get('nyitvatartas', [])):
    if o:
        groups.setdefault((hm(o), hm(c)), []).append(DAYS[d])
for (o, c), ds in groups.items():
    spec.append({'@type': 'OpeningHoursSpecification', 'dayOfWeek': ds, 'opens': o, 'closes': c})
for day, (o, c) in sorted((cfg.get('kivetelek') or {}).items()):
    e = {'@type': 'OpeningHoursSpecification', 'validFrom': day, 'validThrough': day}
    e.update({'opens': hm(o), 'closes': hm(c)} if o else {'opens': '00:00', 'closes': '00:00'})
    spec.append(e)
if spec:
    ld['openingHoursSpecification'] = spec
if cfg.get('funkciok', {}).get('telefonos_foglalas'):
    ld['acceptsReservations'] = True
if (SITE / 'data' / 'menu.json').exists() and base:
    ld['hasMenu'] = base + '/#etlap'

LOC = {'hu': 'hu_HU', 'de': 'de_DE', 'en': 'en_GB'}
def esc(s):
    return H.escape(str(s), quote=True)

def head_block(page):
    title = re.search(r'<title>(.*?)</title>', page, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', page)
    t, d = (title.group(1) if title else nev), (desc.group(1) if desc else '')
    img = (base + '/' if base else '') + cfg.get('megosztas_kep', 'img/megosztas.jpg')
    out = [
        f'<meta name="theme-color" content="{esc(cfg.get("szin", "#12110f"))}">',
        '<link rel="icon" href="favicon.svg" type="image/svg+xml">',
        '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
        '<link rel="manifest" href="site.webmanifest">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{esc(nev)}">',
        f'<meta property="og:title" content="{t}">',
        f'<meta property="og:description" content="{d}">',
        f'<meta property="og:image" content="{esc(img)}">',
        '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">',
        f'<meta property="og:locale" content="{LOC.get(langs[0], "hu_HU")}">',
    ] + [f'<meta property="og:locale:alternate" content="{LOC[l]}">' for l in langs[1:] if l in LOC] + [
        '<meta name="twitter:card" content="summary_large_image">',
        '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>',
    ]
    return '\n'.join(out)

for page in SITE.glob('*.html'):
    s = page.read_text()
    intro = 1 if cfg.get('intro', {}).get('be') else 0
    s2 = re.sub(r"var h=document\.documentElement,r='[^']*',L=\[[^\]]*\](,I=\d)?", f"var h=document.documentElement,r='{rovid}',L={json.dumps(langs)},I={intro}", s)
    # útvonaltervezés: <a href="..." data-utvonal> = Google Térkép útvonal a hely nevére és címére (telefonon a Térkép app nyílik)
    from urllib.parse import quote
    route = 'https://www.google.com/maps/dir/?api=1&amp;destination=' + quote(f"{nev}, {cfg.get('cim', '')}")
    s2 = re.sub(r'href="[^"]*"(\s+data-utvonal)', lambda mm: f'href="{route}"' + mm.group(1), s2)
    k = cfg.get('keszito') or {}
    kt = (k.get('szoveg') or ['Weboldal: kettő'])
    credit = f'<a href="{esc(k["url"])}" rel="noopener" data-i18n="ftKeszito">{esc(kt[0])}</a>' if k.get('url') else ''
    s2 = re.sub(r'(<!-- keszito -->).*?(<!-- /keszito -->)', lambda mm: mm.group(1) + credit + mm.group(2), s2, flags=re.S)
    s2 = re.sub(r'(<!-- fej:[^>]*-->\n).*?(<!-- /fej -->)', lambda mm: mm.group(1) + head_block(s2) + '\n' + mm.group(2), s2, flags=re.S)
    if s2 != s:
        page.write_text(s2)

(SITE / 'site.webmanifest').write_text(json.dumps({
    'name': nev, 'short_name': nev[:12], 'start_url': '/', 'display': 'browser',
    'background_color': cfg.get('szin', '#12110f'), 'theme_color': cfg.get('szin', '#12110f'),
    'icons': [{'src': '/apple-touch-icon.png', 'sizes': '180x180', 'type': 'image/png'}, {'src': '/favicon.svg', 'sizes': 'any', 'type': 'image/svg+xml'}],
}, ensure_ascii=False, indent=1) + '\n')

subprocess.run([sys.executable, str(ROOT / 'eszkozok' / 'jogi.py')], check=True)
print('kész:', rovid, '|', ', '.join(langs), '|', len(mods), 'modul')
for w in warn:
    print('  ! ' + w)
