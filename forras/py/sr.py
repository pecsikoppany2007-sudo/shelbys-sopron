# Helyi AI-felskálázás (Real-ESRGAN x4plus, spandrel, CPU), ha a MuAPI nem érhető el.
# python sr.py forrás kimenet [bemeneti hosszú oldal]
# A forrást előbb lekicsinyítjük arra a méretre, ahol még éles (a telefonos zaj és a puha élek eltűnnek),
# aztán 4x felskálázzuk, és 15% Lanczos-réteggel keverjük, hogy a textúra ne legyen festett hatású.
import sys, numpy as np, torch, cv2
from PIL import Image
from spandrel import ModelLoader
src, out = sys.argv[1], sys.argv[2]
L = int(sys.argv[3]) if len(sys.argv) > 3 else 1100
torch.set_num_threads(4)
m = ModelLoader().load_from_file('/home/user/w/RealESRGAN_x4plus.pth').model.eval()
im = Image.open(src).convert('RGB')
s = min(1, L / max(im.size))
small = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
a = np.asarray(small).astype(np.float32) / 255
H, W = a.shape[:2]; T, P = 256, 16
o = np.zeros((H * 4, W * 4, 3), np.float32)
with torch.no_grad():
    for y in range(0, H, T):
        for x in range(0, W, T):
            y0, x0 = max(y - P, 0), max(x - P, 0); y1, x1 = min(y + T + P, H), min(x + T + P, W)
            t = torch.from_numpy(a[y0:y1, x0:x1].transpose(2, 0, 1)).unsqueeze(0)
            r = m(t).clamp(0, 1)[0].numpy().transpose(1, 2, 0)
            ty, tx = (y - y0) * 4, (x - x0) * 4; h2, w2 = min(T, H - y) * 4, min(T, W - x) * 4
            o[y * 4:y * 4 + h2, x * 4:x * 4 + w2] = r[ty:ty + h2, tx:tx + w2]
lz = np.asarray(im.resize((W * 4, H * 4), Image.LANCZOS)).astype(np.float32) / 255
o = .85 * o + .15 * lz
Image.fromarray((o * 255 + .5).astype(np.uint8)).save(out, quality=95)
print(out, W * 4, H * 4)
