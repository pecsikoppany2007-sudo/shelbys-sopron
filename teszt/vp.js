// node vp.js out  -> viewport shots at given scroll fractions/ids (desktop rich)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1440,height:900}});
await c.addInitScript(()=>{try{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang','hu')}catch(e){}});
const p=await c.newPage();await p.goto('http://localhost:8765/');await p.waitForTimeout(2500);
const H=await p.evaluate(()=>document.documentElement.scrollHeight);
const t=await p.evaluate(()=>{const e=document.getElementById('tunnel');return [e.offsetTop,e.offsetHeight]});
const pos=[t[0]+t[1]*0.25,t[0]+t[1]*0.5,t[0]+t[1]*0.75-450,H-900];
let i=0;for(const y of pos){await p.evaluate(y=>{window.scrollTo(0,y)},y);await p.waitForTimeout(1200);await p.screenshot({path:`${process.argv[2]}-${i++}.jpg`,type:'jpeg',quality:60});}
await b.close()})();
