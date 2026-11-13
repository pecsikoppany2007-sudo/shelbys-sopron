# kivágott palackok exportja: világító (lit) és lekapcsolt (sotet) változat, alfával, 2 méretben, plusz a fény színe
import numpy as np, cv2, json
from PIL import Image, ImageEnhance
K = '/home/user/shelbys/forras/kivagott/'; OUT = '/home/user/shelbys/site/img/'
B = [('F266', 'ginmare'), ('F267', 'botanist'), ('F268', 'bobbys'), ('F269', 'michler'), ('F270', 'tanqueray'), ('F271', 'opihr'), ('F272', 'whitley')]
info = {}
for src, n in B:
    im = Image.open(K + src + '.png').convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3:] / 255
    # finom zajszűrés és enyhe kontraszt a világító változaton
    den = cv2.fastNlMeansDenoisingColored(rgb[..., ::-1].astype(np.uint8), None, 3, 5, 7, 21)[..., ::-1].astype(np.float32)
    lit = np.clip((den - 128) * 1.06 + 128 + 4, 0, 255)
    # fény színe: a legvilágosabb pixelek átlaga
    lum = lit.mean(2); m = (al[..., 0] > .5) & (lum > np.percentile(lum[al[..., 0] > .5], 80))
    col = lit[m].mean(0); col = col / col.max() * 255
    # lekapcsolt: sötét, kevés színnel, a fényes részek alig
    g = lit.mean(2, keepdims=True)
    dark = np.clip((lit * .35 + g * .65) * .13 + 6, 0, 255)
    h0 = im.height
    for h in (520, 900):
        w = round(im.width * h / h0)
        for tag, arr in (('lit', lit), ('sotet', dark)):
            o = np.dstack([arr, al * 255]).astype(np.uint8)
            Image.fromarray(o, 'RGBA').resize((w, h), Image.LANCZOS).save(f'{OUT}p-{n}-{tag}-{h}.webp', quality=82, method=5)
    info[n] = {'ar': round(im.width / h0, 4), 'col': '#%02x%02x%02x' % tuple(int(c) for c in col)}
print(json.dumps(info))
