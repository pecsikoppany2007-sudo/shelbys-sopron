// node pshot.js prefix  -> a palacksor és az átjáró néhány görgetési ponton (asztali, fakegpu)
const {chromium}=require('playwright');
(async()=>{const pre=process.argv[2];const mob=process.argv[3]==='m';const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const c=await b.newContext(mob?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
await c.addInitScript({path:__dirname+'/fakegpu.js'});
await c.addInitScript(()=>{try{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang','hu')}catch(e){}});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8765/');await p.waitForTimeout(2000);
const info=await p.evaluate(()=>{const g=s=>{const e=document.querySelector(s);return [e.getBoundingClientRect().top+scrollY,e.offsetHeight]};return {t:g('#tunnel'),b:g('#pult')}});
const go=async y=>{await p.evaluate(y=>scrollTo(0,y),y);};
const shots=mob?[['tun',info.t[0],9000],['pal',info.b[0]+100,5500]]:[['tun1',info.t[0]+info.t[1]*.25,2500],['tun2',info.t[0]+info.t[1]*.55,2500],['tun3',info.t[0]+info.t[1]-900,3000],['pal1',info.b[0]+info.b[1]*.3,1500],['pal2',info.b[0]+info.b[1]-900,1500]];
for(const [n,y,w] of shots){await go(y);await p.waitForTimeout(w);await p.screenshot({path:`${pre}-${n}.jpg`,type:'jpeg',quality:70,timeout:120000});}
console.log('errs',errs.slice(0,5));await b.close()})();
