# v2 képek Instagram + Facebook forrásból, ugyanazzal a házi színkezeléssel. python3 img2.py [név...]
import sys, glob, numpy as np, cv2
from PIL import Image
sys.path.insert(0,'/home/user/shelbys/forras/py')
I='/home/user/shelbys/forras/insta/'; F='/home/user/shelbys/forras/fbnagy/'; OUT='/home/user/shelbys/site/img'
def g(p): return glob.glob(p)[0]
L = {
 'hero':     (I+'018_*',(0,0,1,1),(900,1600,2400),1.0),
 'herom':    (I+'018_*',(0.30,0,0.86,1),(800,1200),1.0),
 'boltiv':   (I+'016_*',(0,0.06,1,0.94),(900,1600,2400),1.08),
 'lepcso2':  (F+'F016_*',(0,0,1,1),(600,1100),1.0),
 'fulke2':   (I+'109_*',(0,0,1,1),(600,1100),1.0),
 'kandallo': (I+'110_*',(0,0,1,1),(600,1100),1.0),
 'kalitka4': (F+'F262_*',(0.21,0,0.79,1),(600,900),1.0),
 'ginmare2': (I+'112_*',(0,0,1,1),(600,1100),1.0),
 'brock':    (I+'028_*',(0,0.04,1,0.96),(600,1100),1.0),
 'amuerte2': (I+'064_*',(0,0,1,1),(600,1100),1.0),
 'opihr2':   (I+'103_*',(0,0,1,1),(600,1100),1.0),
 'b1': (F+'F266_*',(0,0.04,1,1),(500,900),1.0),
 'b2': (F+'F267_*',(0,0.04,1,1),(500,900),1.0),
 'b3': (F+'F270_*',(0,0.04,1,1),(500,900),1.0),
 'b4': (F+'F271_*',(0,0.04,1,1),(500,900),1.0),
 'b5': (F+'F272_*',(0,0.04,1,1),(500,900),1.0),
 'b6': (F+'F268_*',(0,0.04,1,1),(500,900),1.0),
 'k1': (F+'F229_*',(0,0.08,1,0.98),(500,900),1.0),
 'k2': (F+'F223_*',(0,0.08,1,0.98),(500,900),1.0),
 'k3': (F+'F201_*',(0.22,0,0.78,1),(500,900),1.0),
 'k4': (F+'F163_*',(0,0.04,1,1),(500,900),1.0),
 'k5': (F+'F252_*',(0,0.02,1,0.94),(500,900),1.0),
 'gt2':     (F+'F199_*',(0,0.1,1,0.95),(700,1300),1.0),
 'koktel2': (I+'058_*',(0,0.05,1,1),(700,1300),1.0),
 'veg':     (F+'F264_*',(0,0,1,1),(900,1600,2048),1.0),
}
from img import grade
names=sys.argv[1:] or list(L)
for n in names:
    s,c,ws,lift=L[n]
    im=Image.open(g(s)).convert('RGB'); W,H=im.size
    im=im.crop((int(c[0]*W),int(c[1]*H),int(c[2]*W),int(c[3]*H)))
    a=np.asarray(im)
    a=cv2.fastNlMeansDenoisingColored(a[...,::-1],None,3,5,7,21)[...,::-1]
    a=grade(a,lift); im=Image.fromarray(a)
    for w in ws:
        w2=min(w,round(im.width*1.2)); r=im.resize((w2,round(im.height*w2/im.width)),Image.LANCZOS)
        amt=0.25 if w2<im.width*0.9 else (0.35 if w2>im.width else 0)
        if amt: r=Image.fromarray(cv2.addWeighted(np.asarray(r),1+amt,cv2.GaussianBlur(np.asarray(r),(0,0),1.0),-amt,0))
        r.save(f'{OUT}/{n}-{w}.webp',quality=80 if w<2000 else 76,method=5)
    print(n, im.size)
