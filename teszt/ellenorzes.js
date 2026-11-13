// teljes ellenőrzés: szélességek × nyelvek, menülinkek, takaró elem, 404-ek, alt, reload közepén
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const out=[];const U='http://localhost:8765/';
const bad=new Set();
for(const lang of ['hu','de','en']) for(const w of [320,390,768,1024,1280,1440,1920]){
  const mob=w<1024;const c=await b.newContext({viewport:{width:w,height:mob?800:900},isMobile:mob,hasTouch:mob});
  await c.addInitScript(l=>{try{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang',l)}catch(e){}},lang);
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.add(r.status()+' '+r.url())});
  await p.goto(U);await p.waitForTimeout(1500);
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}});
  await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const W=innerWidth;const sw=document.documentElement.scrollWidth;
    const wide=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>W+1&&getComputedStyle(e).position!=='fixed'&&!e.closest('.tunnel,.hero__media,svg')}).slice(0,3).map(e=>e.tagName+'.'+e.className);
    // címek kilógása a dobozukból
    const cut=[...document.querySelectorAll('.h1,.h2')].filter(h=>h.scrollWidth>h.clientWidth+2).map(h=>h.id);
    const noalt=[...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length;
    const inv=[...document.querySelectorAll('.ln__i,.ph__in img,.gl li')].filter(e=>{const s=getComputedStyle(e);return s.opacity==='0'}).length;
    return {sw,wide,cut,noalt,inv}});
  // menülinkek
  let miss=[];
  if(w>=1024&&lang==='hu'){for(const id of ['pince','ginek','itallap','nyitva']){await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300);
    if(w>1180){await p.click(`.hd__nav a[href="#${id}"]`);}else{await p.click('#burger');await p.waitForTimeout(200);await p.click(`#sheet a[href="#${id}"]`);}
    await p.waitForTimeout(2600);const t=await p.evaluate(id=>document.getElementById(id).getBoundingClientRect().top,id);if(t<-5||t>200)miss.push(id+':'+Math.round(t));
    const cov=await p.evaluate(id=>{const a=document.querySelector('#'+id+' a, #'+id+' button');if(!a)return'';const r=a.getBoundingClientRect();if(r.top<0||r.top>innerHeight)return'';const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return a.contains(e)||e===a?'':'covered by '+e.className},id);if(cov)miss.push(id+' '+cov);}}
  out.push(`${lang} ${w}: sw=${r.sw} ${r.sw>w?'OVERFLOW '+r.wide.join(','):''} cut=${r.cut} noalt=${r.noalt} inv=${r.inv} links=${miss.join(';')||'ok'} errs=${errs.slice(0,2)}`);
  await c.close();}
// csökkentett mozgás
const c=await b.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});const p=await c.newPage();await p.goto(U);await p.waitForTimeout(1200);
out.push('reduced intro shown: '+await p.evaluate(()=>getComputedStyle(document.getElementById('intro')).display));
for(const u of ['jogi.html','404.html']){await p.goto(U+u);}
const r404=await p.goto(U+'nincs-ilyen');out.push('missing page status '+r404.status());
out.push('bad responses: '+[...bad].join(' | '));
console.log(out.join('\n'));await b.close()})();
