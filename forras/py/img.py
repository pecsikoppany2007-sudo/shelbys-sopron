# Shelby's: közös házi színkezelés + webp változatok. python3 img.py [név...]
import sys, os, numpy as np, cv2
from PIL import Image
SRC='/home/user/shelbys/forras/hi'; OUT='/home/user/shelbys/site/img'
# név: (forrás, kivágás x0,y0,x1,y1 arányban, szélességek, extra fény)
L = {
 'bar':       ('h004',(0.10,0.04,1.0,0.96),(900,1600,2400),1.00),
 'pince':     ('h026',(0,0,1,1),(800,1600),1.0),
 'fulke':     ('h046',(0,0,1,1),(800,1600),1.0),
 'lepcso':    ('h041',(0,0.05,1,1),(700,1300),1.0),
 'gyertya':   ('h093',(0,0,1,0.92),(700,1300),1.0),
 'amuerte':   ('h082',(0,0.08,1,0.95),(700,1300),1.0),
 'pult':      ('h080',(0,0,1,1),(800,1600),1.0),
 'kalitka':   ('h000',(0,0,1,1),(700,1300),1.0),
 'kalitka2':  ('h073',(0,0,1,1),(800,1600),1.0),
 'kalitka3':  ('h033',(0,0,1,1),(800,1600),1.0),
 'levendula': ('h056',(0.04,0,0.96,1),(700,1300),1.0),
 'sour':      ('h038',(0,0,1,1),(700,1300),1.0),
 'pink':      ('h048',(0,0,1,1),(700,1300),1.0),
 'rozmaring': ('h089',(0,0,1,1),(700,1300),1.0),
 'buborek':   ('h112',(0,0,1,1),(700,1300),1.0),
 'koktel':    ('h075',(0,0,1,1),(700,1300),1.0),
 'narancs':   ('h106',(0,0.1,1,0.9),(700,1300),1.0),
 'bogyo':     ('h052',(0,0,1,1),(700,1300),1.0),
 'kristaly':  ('h016',(0.1,0,0.9,1),(800,1600),1.0),
 'gt':        ('h001',(0,0,1,1),(700,1300),1.0),
 'monkey':    ('h090',(0,0.05,1,0.9),(600,1100),1.0),
 'opihr':     ('h098',(0,0,1,1),(600,1100),1.0),
 'ginmare':   ('h032',(0,0,1,1),(600,1100),1.0),
 'tal':       ('h078',(0,0,1,1),(700,1300),1.0),
 'ajto':      ('h017',(0,0,1,1),(700,1300),1.0),
 'itallap':   ('h072',(0,0,1,1),(600,1100),1.0),
 'tabla':     ('h003',(0,0,1,0.8),(600,1100),1.0),
 'alagut':    ('h065',(0,0.06,1,0.94),(700,1300),1.0),
 'pohar':     ('h108',(0,0,1,1),(700,1300),1.0),
}
def grade(a, lift):
    a=a.astype(np.float32)/255
    # félig grey-world + közös meleg tónus
    m=a.reshape(-1,3).mean(0); g=m.mean()/np.maximum(m,1e-3); g=1+(g-1)*0.35
    a=a*g*np.array([1.05,1.0,0.88],np.float32)*lift
    # filmes váll + enyhe S
    a=1-np.exp(-a*1.9); a/= (1-np.exp(-1.9))
    a=a+0.10*(a-0.5)*(1-np.abs(2*a-1))*2
    a=np.clip(a,0,1)
    # kissé visszafogott telítettség
    l=a.mean(2,keepdims=True); a=l+(a-l)*0.94
    # vignetta
    h,w=a.shape[:2]; y,x=np.ogrid[-1:1:h*1j,-1:1:w*1j]; v=1-0.26*np.clip((x*x+y*y)/2,0,1)**1.3
    a=a*v[...,None]
    return (np.clip(a,0,1)*255+0.5).astype(np.uint8)
names=(sys.argv[1:] or list(L)) if __name__=="__main__" else []
for n in names:
    s,c,ws,lift=L[n]
    im=Image.open(f'{SRC}/{s}.jpg').convert('RGB'); W,H=im.size
    im=im.crop((int(c[0]*W),int(c[1]*H),int(c[2]*W),int(c[3]*H)))
    a=np.asarray(im)
    a=cv2.fastNlMeansDenoisingColored(a[...,::-1],None,3,5,7,21)[...,::-1]
    a=grade(a,lift); im=Image.fromarray(a)
    for w in ws:
        w2=min(w,im.width); r=im.resize((w2,round(im.height*w2/im.width)),Image.LANCZOS)
        if w2<im.width*0.9: r=Image.fromarray(cv2.addWeighted(np.asarray(r),1.25,cv2.GaussianBlur(np.asarray(r),(0,0),1.0),-0.25,0))
        r.save(f'{OUT}/{n}-{w}.webp',quality=80 if w<2000 else 76,method=5)
    print(n, im.size)
