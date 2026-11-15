# Képgyártó: a forras/kepek/ mappa fotóiból webre optimalizált képek, több méretben, AVIF + WebP + JPEG.
#   python3 eszkozok/kepek.py            (minden kép, ami még nincs kész vagy változott)
#   python3 eszkozok/kepek.py --mind     (minden kép újra)
# Kimenet: site/img/<név>-<szélesség>.avif|webp|jpg, és site/img/kepek.html: kész <picture> kódok másolásra,
# width/height-tal (nincs ugrálás betöltéskor), srcset-tel (a telefon kis képet tölt), lazy betöltéssel.
# A nyitóképnél (hero) a lazy helyett fetchpriority="high" kell: azt kézzel cseréld. Kicsinyít, sosem nagyít.
# Pillow kell hozzá (pip install pillow); ha az AVIF nem támogatott, csak WebP + JPEG készül.
import html as H
import pathlib
import re
import sys

from PIL import Image, ImageOps, features

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'forras' / 'kepek'
OUT = ROOT / 'site' / 'img'
WIDTHS = (640, 1280, 1920)
AVIF = features.check('avif')
ALL = '--mind' in sys.argv


def slug(s):
    s = s.lower()
    for a, b in zip('áéíóöőúüű', 'aeiooouuu'):
        s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


SRC.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
snips, n = [], 0
for f in sorted(SRC.iterdir()):
    if f.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'):
        continue
    name = slug(f.stem)
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    ws = [w for w in WIDTHS if w < im.width] + [min(im.width, WIDTHS[-1])]
    ws = sorted(set(ws))
    last = OUT / f'{name}-{ws[-1]}.jpg'
    if ALL or not last.exists() or last.stat().st_mtime < f.stat().st_mtime:
        for w in ws:
            r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if w != im.width else im
            r.save(OUT / f'{name}-{w}.jpg', quality=80, optimize=True, progressive=True)
            r.save(OUT / f'{name}-{w}.webp', quality=78, method=6)
            if AVIF:
                r.save(OUT / f'{name}-{w}.avif', quality=55)
        n += 1
    h = round(im.height * ws[-1] / im.width)
    srcset = lambda ext: ', '.join(f'img/{name}-{w}.{ext} {w}w' for w in ws)
    sizes = '(max-width: 760px) 100vw, 60vw'
    snips.append(f'<!-- {H.escape(f.name)} -->\n<picture>\n'
                 + (f'  <source type="image/avif" srcset="{srcset("avif")}" sizes="{sizes}">\n' if AVIF else '')
                 + f'  <source type="image/webp" srcset="{srcset("webp")}" sizes="{sizes}">\n'
                 + f'  <img src="img/{name}-{ws[min(1, len(ws) - 1)]}.jpg" srcset="{srcset("jpg")}" sizes="{sizes}" width="{ws[-1]}" height="{h}" alt="ÍRD LE, MI VAN A KÉPEN" loading="lazy" decoding="async">\n</picture>')

(OUT / 'kepek.html').write_text('<!-- A kepek.py írja. Másold be a kódot, írd át az alt-ot és a sizes-t a valódi elrendezésre. -->\n' + '\n\n'.join(snips) + '\n')
big = [p.name for p in OUT.glob('*.jpg') if p.stat().st_size > 400_000]
print(f'kész: {n} kép újra legyártva, {len(snips)} összesen' + ('' if AVIF else ' (AVIF nélkül: ez a Pillow nem tud AVIF-et)'))
if big:
    print('  ! 400 KB fölötti JPEG:', ', '.join(big))
