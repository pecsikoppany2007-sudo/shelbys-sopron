p = '/home/user/shelbys/site/index.html'; s = open(p).read()
s = s.replace('Vendégek fotói arról, ami a pulton készült. Szezonális italokat és hétvégi különlegességeket is kever a pultos.', 'Vendégek fotói arról, ami a pultról az asztalukra került. Hétvégente külön ajánlat is van, például a Ginito, ami gin és mojito egyben.')
open(p, 'w').write(s)

p = '/home/user/shelbys/site/css/style.css'; s = open(p).read()
s = s.replace("/* ------------------------------------------------ itallap */", """/* ------------------------------------------------ a pultról: vízszintes fotósor (asztali gépen kitűzve, görgetésre halad) */
.hz{position:relative;background:var(--ink);padding:clamp(80px,13vh,140px) 0 clamp(40px,6vh,70px)}
.hz__head{display:grid;grid-template-columns:5fr 6fr;gap:22px 6vw;align-items:end;padding:0 var(--pad);margin-bottom:clamp(30px,5vh,56px)}
.hz__track{display:flex;gap:clamp(14px,2vw,28px);padding:0 var(--pad);overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.hz__track::-webkit-scrollbar{display:none}
.hz__it{margin:0;flex:none;scroll-snap-align:start;--h:min(56vh,440px)}
.hz__ph{height:var(--h);width:calc(var(--h)*var(--ar));overflow:hidden;background:#000}
.hz__ph img{width:100%;height:100%;object-fit:cover}
.hz__it figcaption{display:flex;align-items:center;gap:10px;margin-top:12px;font:400 13.5px/1.3 var(--sans);letter-spacing:.06em;color:var(--dim)}
.hz__it figcaption::before{content:"";width:5px;height:5px;border:1px solid var(--gold);transform:rotate(45deg);flex:none}
.rich .hz{padding:0}
.rich .hz__pin{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;justify-content:center;overflow:hidden;padding-top:var(--hd)}
.rich .hz__track{overflow:visible;scroll-snap-type:none;will-change:transform;width:max-content}
.rich .hz__it{--h:min(54vh,560px)}
.rich .hz__ph img{transform:scale(1.12) translateX(var(--px,0px))}
@media (max-width:900px){.hz__head{grid-template-columns:1fr}}

/* ------------------------------------------------ itallap */""")
open(p, 'w').write(s)

p = '/home/user/shelbys/site/js/main.js'; s = open(p).read()
s = s.replace("  /* pince fotói: asztali gépen belső parallaxis */", """  /* a pultról: kitűzött vízszintes sor */
  function initHz() {
    if (!rich) return;
    var sec = $('#pult'), tr = $('#hzTrack'), ims = $$('.hz__ph img', tr), dist = 0;
    function meas() { dist = Math.max(0, tr.scrollWidth - innerWidth); sec.style.height = (innerHeight + dist) + 'px'; }
    meas();
    ScrollTrigger.create({ trigger: sec, start: 'top top', end: function () { return '+=' + dist; }, scrub: true, invalidateOnRefresh: true, onRefreshInit: meas,
      onUpdate: function (s) { var x = -dist * s.progress; tr.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
        ims.forEach(function (im) { var r = im.parentNode.getBoundingClientRect(); var c = (r.left + r.width / 2) / innerWidth - .5; im.style.setProperty('--px', (c * -40).toFixed(1) + 'px'); }); } });
  }

  /* pince fotói: asztali gépen belső parallaxis */""")
s = s.replace("initTunnel(); initParallax();", "initTunnel(); initHz(); initParallax();")
DE = "hzTitle: 'Von der Bar', hzTxt: 'Fotos von Gästen, was von der Bar an ihren Tisch kam. Am Wochenende gibt es ein eigenes Angebot, etwa den Ginito: Gin und Mojito in einem.', capLev: 'Gin Tonic mit Lavendel', capRoz: 'Gin Tonic mit Rosmarin', capSour: 'Grüne Cocktails mit Basilikum', capPink: 'Pink Gin mit Beeren', capKri: 'Kristallgläser', capKok: 'Cocktails an der Bar', capNar: 'Orangenscheibe, Eis', capKal3: 'Vogelkäfig zwischen zwei Laternen', capBog: 'Erdbeere und Heidelbeere auf Eis', capPoh: 'Zitronenzeste, Kamin',"
EN = "hzTitle: 'From the bar', hzTxt: 'Guests\\u2019 photos of what came from the bar to their table. At weekends there is a separate offer, such as the Ginito, gin and mojito in one.', capLev: 'Lavender gin and tonic', capRoz: 'Gin and tonic with rosemary', capSour: 'Green cocktails with basil', capPink: 'Pink gin with berries', capKri: 'Crystal glasses', capKok: 'Cocktails on the bar', capNar: 'Orange slice, ice', capKal3: 'Birdcage between two lanterns', capBog: 'Strawberry and blueberry on ice', capPoh: 'Lemon peel, fireplace',"
s = s.replace("capPince: 'Der Keller vom Fuß der Treppe',", "capPince: 'Der Keller vom Fuß der Treppe', " + DE)
s = s.replace("capPince: 'The cellar from the foot of the stairs',", "capPince: 'The cellar from the foot of the stairs', " + EN)
open(p, 'w').write(s)
print(s.count('hzTitle'), s.count('initHz'))
