// v2 szakaszképek ellenőrzéshez (csak magamnak): hero felkapcsolás, átjáró pohárral, pince, polc, itallap lapozás közben
// node v2shots.js outdir [mobile]
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const out=process.argv[2]||'/tmp/v2';const mob=process.argv[3]==='m';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const c=await b.newContext(mob?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
await c.addInitScript({path:__dirname+'/fakegpu.js'});
await c.addInitScript(()=>{try{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang','hu')}catch(e){}});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const shot=async n=>p.screenshot({path:`${out}/${mob?'m':'d'}-${n}.jpg`,type:'jpeg',quality:70,timeout:120000});
await p.goto('http://localhost:8765/');
if(!process.env.ALL){await p.evaluate(()=>{});}
await p.waitForTimeout(400);await shot('hero0');
await p.waitForTimeout(1400);await shot('hero1');
await p.waitForTimeout(3000);await shot('hero2');
const top=async sel=>p.evaluate(s=>document.querySelector(s).getBoundingClientRect().top+scrollY,sel);
const go=async y=>{await p.evaluate(y=>{if(window.lenis)lenis.scrollTo(y,{immediate:true});scrollTo(0,y)},y);};
const T=await top('#tunnel'),TH=await p.evaluate(()=>document.querySelector('#tunnel').offsetHeight);
if(!mob){for(const f of [.25,.5,.75,.92]){await go(T-900+(TH)*f);await p.waitForTimeout(1500);await shot('tun'+f);}}
else{await go(T);await p.waitForTimeout(9000);await shot('tun');}
await go(await top('#pince'));await p.waitForTimeout(2500);await shot('pince1');
await go(await top('.pince__arches')-150);await p.waitForTimeout(2500);await shot('pince2');
const S=await top('#pult');
for(const f of [300,700,1100]){await go(S+f);await p.waitForTimeout(mob?3000:1500);await shot('polc'+f);}
const M=await top('#itallap');await go(M);await p.waitForTimeout(1800);await shot('menu');
if(!mob){await p.click('#tab1');await p.waitForTimeout(450);await shot('turn');await p.waitForTimeout(1200);await shot('menu1');
 await p.click('#tab0');await p.waitForTimeout(450);await shot('turnb');await p.waitForTimeout(1200);}
else{await p.click('#tab1');await p.waitForTimeout(1500);await shot('menu1');}
console.log('errors',errs.slice(0,6),'sw',await p.evaluate(()=>document.documentElement.scrollWidth));
await b.close()})();
