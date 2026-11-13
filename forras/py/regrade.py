# v4 egységes, visszafogott színkezelés a már kész webp-kre (a régi narancsos-vörös tónus és a ráhúzott meleg kivétele).
# python regrade.py név [név...]  -> a legnagyobb változatból újraírja az összes méretet.
import sys, glob, re, numpy as np, cv2
from PIL import Image
D = '/home/user/shelbys/site/img/'
def fix(a):
    f = a.astype(np.float32) / 255
    # félig grey-world: a narancs öntet kivétele, de a meleg fény megmarad
    m = f.reshape(-1, 3).mean(0); g = m.mean() / np.maximum(m, 1e-3); f *= (1 + (g - 1) * .18)
    # narancs/vörös telítettség vissza (a pult vöröse megmarad, csak nem izzik)
    hsv = cv2.cvtColor(np.clip(f, 0, 1), cv2.COLOR_RGB2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    warm = ((h < 45) | (h > 340)).astype(np.float32)
    s *= 1 - .1 * warm; s *= .92
    hsv = np.stack([h, s, v], -1); f = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    # mélyebb, tisztább feketék, puha váll
    f = np.clip((f - .025) / .975, 0, 1)
    f = f ** 1.08  # kicsit sötétebb középtónus: esti, lámpafényes hatás
    f = f + .05 * np.sin(np.pi * f) * (f - .5) * -1  # enyhe S-görbe
    f = np.where(f > .78, .78 + (f - .78) * .7, f)  # a kiégett csúcsfények puhán visszahúzva
    return (np.clip(f, 0, 1) * 255 + .5).astype(np.uint8)
for n in sys.argv[1:]:
    fs = {int(re.search(r'-(\d+)\.webp$', p).group(1)): p for p in glob.glob(D + n + '-*.webp') if re.fullmatch(re.escape(D + n) + r'-\d+\.webp', p)}
    big = max(fs); im = np.asarray(Image.open(fs[big]).convert('RGB'))
    out = Image.fromarray(fix(im))
    for w, p in fs.items():
        r = out if w == big else out.resize((w, round(out.height * w / out.width)), Image.LANCZOS)
        r.save(p, quality=82 if w < 2000 else 78, method=5)
    print(n, sorted(fs))
