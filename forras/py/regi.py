"""Régies, gyertyafényes kidolgozás a fotókra (Shelby's v6).
Nem rontja a felbontást: kicsit felemelt, meleg feketék, lágyabb csúcsfények meleg ragyogással (halation),
visszafogott szépia-tónus, enyhén fakó színek, sötétedő szélek. A szemcsét CSS adja, mert a beégetett zaj nagyon megnöveli a fájlt.
Használat: python regi.py be.webp ki.webp [enyhe]   (enyhe = palack-kivágások: szélsötétítés nélkül, alfát megtartja)
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

def regi(im, enyhe=False):
    alpha = im.getchannel('A') if im.mode == 'RGBA' else None
    rgb = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    h, w, _ = rgb.shape
    L = rgb @ np.array([.299, .587, .114], np.float32)
    # 1) fakóbb színek, meleg szépia felé húzva
    sat = .74 if not enyhe else .85
    gray = L[..., None]
    x = gray + (rgb - gray) * sat
    sep = np.stack([L * 1.08 + .02, L * .94 + .01, L * .74], -1)
    x = x * (1 - (.28 if not enyhe else .14)) + sep * (.28 if not enyhe else .14)
    # 2) melegebb, gyertyafényes fehéregyensúly, kicsit sötétebb középtónusok, lágyan levágott csúcsfények, felemelt barnás feketék
    x = np.clip(x * np.array([1.07, .97, .80], np.float32), 0, None)
    x = np.power(np.clip(x, 0, None), 1.14)
    k = .72
    x = np.where(x > k, k + (1 - k) * (1 - np.exp(-(x - k) / (1 - k) * 1.6)) / (1 - np.exp(-1.6)), x)
    x = x * x * (3 - 2 * x) * .35 + x * .65
    toe = np.array([.05, .036, .024], np.float32)
    x = toe + np.clip(x, 0, 1) * (1 - toe - .05)
    # 3) halation: a fényes részek körül meleg ragyogás
    if not enyhe:
        hi = np.clip((L - .62) / .38, 0, 1)
        hiI = Image.fromarray((hi * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(w, h) * .012))
        hb = np.asarray(hiI).astype(np.float32)[..., None] / 255.0
        x = x + hb * np.array([.16, .085, .03], np.float32)
    # 4) nagyon enyhe lágyítás (régi objektív), a részletek megmaradnak
    xi = Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8))
    soft = np.asarray(xi.filter(ImageFilter.GaussianBlur(.7))).astype(np.float32) / 255.0
    x = np.clip(x, 0, 1) * .72 + soft * .28
    # 5) sötétedő szélek, mintha gyertya világítaná a közepét
    if not enyhe:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 * .85 + ((yy - h * .46) / (h / 2)) ** 2)
        v = 1 - .34 * np.clip((r - .45) / .95, 0, 1) ** 1.6
        x = x * v[..., None]
    out = Image.fromarray((np.clip(x, 0, 1) * 255 + .5).astype(np.uint8))
    if alpha is not None:
        out.putalpha(alpha)
    return out

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    enyhe = len(sys.argv) > 3
    im = Image.open(src)
    regi(im, enyhe).save(dst, 'WEBP', quality=84, method=6)
