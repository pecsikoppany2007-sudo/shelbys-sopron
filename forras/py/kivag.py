# palackok kivágása a bár Facebook-fotóiról (rembg, isnet), aztán közös színkezelés.  python3 kivag.py
import glob, numpy as np, cv2
from PIL import Image
from rembg import remove, new_session
F = '/home/user/shelbys/forras/fbnagy/'; OUT = '/home/user/shelbys/forras/kivagott/'
import os; os.makedirs(OUT, exist_ok=True)
ss = new_session('isnet-general-use')
for n in ['F266', 'F267', 'F268', 'F269', 'F270', 'F271', 'F272']:
    im = Image.open(glob.glob(F + n + '_*')[0]).convert('RGB')
    cut = remove(im, session=ss, post_process_mask=True)
    a = np.asarray(cut); al = a[..., 3]
    ys, xs = np.where(al > 40)
    # a legnagyobb összefüggő folt: a palack
    num, lab, st, _ = cv2.connectedComponentsWithStats((al > 40).astype(np.uint8))
    k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); m = (lab == k)
    al2 = np.where(m, al, 0).astype(np.uint8)
    x, y, w, h = st[k, :4]
    out = np.dstack([a[..., :3], al2])[max(0, y - 8):y + h + 8, max(0, x - 8):x + w + 8]
    Image.fromarray(out).save(OUT + n + '.png')
    print(n, out.shape)
