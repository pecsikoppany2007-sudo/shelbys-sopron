# v3.1 kezdőkép: az első verzió pultfotója (g004). python3 hero3.py [forrás]
# A forrás alapból a Google-fotó; ha megvan a MuAPI-val feljavított változat, azt kell átadni.
import sys, numpy as np, cv2
from PIL import Image
sys.path.insert(0, '/home/user/shelbys/forras/py')
from img import grade
SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/user/shelbys/forras/google/g004.jpg'
OUT = '/home/user/shelbys/site/img/'
def look(a):
    # saját fény a pultfotóhoz: a vörös pult telített marad, a jobb oldali világos boltív és a hűtő kékje visszahúzva,
    # mély, meleg feketék, filmes váll
    f = a.astype(np.float32) / 255
    h, w = f.shape[:2]
    hsv = cv2.cvtColor(a, cv2.COLOR_RGB2HSV).astype(np.float32)
    sat = hsv[..., 1] / 255; val = hsv[..., 2] / 255
    yy, xx = np.mgrid[0:h, 0:w]; xx = xx / w; yy = yy / h
    # világos, kevéssé telített foltok (boltív, papírok) jobbra: lefelé húzva
    bright = np.clip((val - .55) / .35, 0, 1) * np.clip((.45 - sat) / .35, 0, 1)
    bright = cv2.GaussianBlur(bright, (0, 0), 6)
    f *= (1 - .55 * bright)[..., None]
    # kék (hűtő, Pepsi) elsötétítve és telítetlenítve
    hue = hsv[..., 0] * 2
    blue = ((hue > 180) & (hue < 260)).astype(np.float32) * sat
    blue = cv2.GaussianBlur(blue, (0, 0), 8)
    l = f.mean(2, keepdims=True); f = f * (1 - .5 * blue[..., None]) + (l - f) * (.6 * blue[..., None])
    # meleg tónus, mély feketék
    f = f * np.array([1.04, .98, .9], np.float32)
    f = np.clip(f - .02, 0, 1) / .98
    f = 1 - np.exp(-f * 1.7); f /= (1 - np.exp(-1.7))
    # vörös telítettség megtartva, a többi kicsit vissza
    l = f.mean(2, keepdims=True); red = np.clip((f[..., 0] - f[..., 1:].max(2)) * 3, 0, 1)[..., None]
    f = l + (f - l) * (.9 + .25 * red)
    v = 1 - .3 * np.clip(((xx - .5) ** 2 * 2 + (yy - .5) ** 2 * 2.4), 0, 1) ** 1.2
    f *= v[..., None]
    return (np.clip(f, 0, 1) * 255 + .5).astype(np.uint8)
im = Image.open(SRC).convert('RGB'); W, H = im.size
a = np.asarray(im)
if W < 3000:  # a telefonos fotó zaja; a feljavított változatot nem szűrjük
    a = cv2.fastNlMeansDenoisingColored(a[..., ::-1], None, 4, 6, 7, 21)[..., ::-1]
a = look(a); full = Image.fromarray(a)
def save(img, n, ws):
    for w in ws:
        w2 = min(w, img.width); r = img.resize((w2, round(img.height * w2 / img.width)), Image.LANCZOS)
        if w2 < img.width * .9: r = Image.fromarray(cv2.addWeighted(np.asarray(r), 1.2, cv2.GaussianBlur(np.asarray(r), (0, 0), 1.0), -.2, 0))
        r.save(f'{OUT}{n}-{w}.webp', quality=82, method=5)
    print(n, img.size)
# asztali: x .08–1, y .03–.97 (a shader maszkjai ehhez a kivágáshoz igazodnak)
d = full.crop((int(.08 * W), int(.03 * H), W, int(.97 * H)))
save(d, 'hero3', (900, 1600, 2400) if W >= 3000 else (900, 1600, 1840))
# telefon: x .30–.78 ugyanebből a magasságból (a shaderben uCr = .239, .522)
m = full.crop((int(.30 * W), int(.03 * H), int(.78 * W), int(.97 * H)))
save(m, 'hero3m', (800, 1200) if W >= 3000 else (800, 960))
