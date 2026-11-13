// gyors képek egy-egy elemről: node kshot.js out.jpg selector [w] [h] [intro]
const {chromium}=require('playwright');
(async()=>{const [out,sel,w,h,intro]=process.argv.slice(2);const b=await chromium.launch();
const c=await b.newContext({viewport:{width:+(w||1440),height:+(h||900)}});
if(!intro)await c.addInitScript(()=>{try{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang','hu')}catch(e){}});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/');await p.waitForTimeout(intro?+intro:2500);
if(sel!=='-'){await p.evaluate(s=>{const e=document.querySelector(s);scrollTo(0,e.getBoundingClientRect().top+scrollY-60)},sel);await p.waitForTimeout(1800);
 const el=await p.$(sel);await el.screenshot({path:out,type:'jpeg',quality:75});}
else await p.screenshot({path:out,type:'jpeg',quality:75});
console.log('errs',errs);await b.close()})();
