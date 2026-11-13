// a "pultról" sor két állapota asztali gépen + telefon
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
const c=await b.newContext({viewport:{width:1440,height:900}});
await c.addInitScript(()=>{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang','hu')});
const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('http://localhost:8765/');await p.waitForTimeout(2000);
const t=await p.evaluate(()=>{const s=document.getElementById('pult');return [s.offsetTop,s.offsetHeight]});
for(const [i,f] of [[0,.05],[1,.55]]){await p.evaluate(y=>scrollTo(0,y),t[0]+t[1]*f);await p.waitForTimeout(1500);await p.screenshot({path:'/tmp/hz'+i+'.jpg',quality:60,type:'jpeg'});}
const m=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await m.addInitScript(()=>{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang','hu')});
const q=await m.newPage();await q.goto('http://localhost:8765/');await q.waitForTimeout(1500);
await q.evaluate(()=>document.getElementById('pult').scrollIntoView());await q.waitForTimeout(800);
await q.screenshot({path:'/tmp/hz2.jpg',quality:60,type:'jpeg'});
console.log(t,e,await q.evaluate(()=>document.documentElement.scrollWidth));await b.close()})();
