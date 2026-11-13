// node dshot.js prefix -> az átjáró végének fázisai (ajtónyitás, belépés), asztali fakegpu
const {chromium}=require('playwright');
(async()=>{const pre=process.argv[2];const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const c=await b.newContext({viewport:{width:1440,height:900}});
await c.addInitScript({path:__dirname+'/fakegpu.js'});
await c.addInitScript(()=>{try{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang','hu')}catch(e){}});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);
const t=await p.evaluate(()=>{const e=document.querySelector('#tunnel');return [e.getBoundingClientRect().top+scrollY,e.offsetHeight-innerHeight]});
for(const f of [.5,.7,.76,.86,1]){await p.evaluate(y=>window.scrollTo(0,y),t[0]+t[1]*f);await p.waitForTimeout(f===.5?6000:3000);await p.screenshot({path:`${pre}-${Math.round(f*100)}.jpg`,quality:75});}
console.log('errs',errs);await b.close();})();
