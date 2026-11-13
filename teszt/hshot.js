// node hshot.js prefix [m] -> a nyitókép a fények felkapcsolása után (fakegpu)
const {chromium}=require('playwright');
(async()=>{const pre=process.argv[2];const mob=process.argv[3]==='m';const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const c=await b.newContext(mob?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}});
await c.addInitScript({path:__dirname+'/fakegpu.js'});
await c.addInitScript(()=>{try{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang','hu')}catch(e){}});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);await p.screenshot({path:pre+'-a.jpg',quality:80});
await p.waitForTimeout(5500);await p.screenshot({path:pre+'-b.jpg',quality:80});
console.log('errs',errs,await p.evaluate(()=>document.querySelector('#top').className));await b.close();})();
