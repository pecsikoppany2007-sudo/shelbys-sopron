// gyors képek: node shots.js out-prefix  (asztali + telefon), nyitás nélkül
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const pre=process.argv[2]||'/tmp/s';
for(const [n,vp,mob] of [['d',{width:1440,height:900},false],['m',{width:390,height:844},true]]){
 const c=await b.newContext({viewport:vp,isMobile:mob,hasTouch:mob,deviceScaleFactor:1});
 await c.addInitScript(()=>{try{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang','hu')}catch(e){}});
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('http://localhost:8765/');await p.waitForTimeout(2500);
 await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0)});
 await p.waitForTimeout(1500);
 await p.screenshot({path:`${pre}-${n}.jpg`,fullPage:true,type:'jpeg',quality:55});
 console.log(n,'errors:',errs.slice(0,5),'sw',await p.evaluate(()=>document.documentElement.scrollWidth));
 await c.close();}
await b.close()})();
