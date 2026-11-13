const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await c.addInitScript({path:__dirname+'/fakegpu.js'});
await c.addInitScript(()=>{try{sessionStorage.setItem('sg-intro','1')}catch(e){}});
const p=await c.newPage();await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);
const y=await p.evaluate(()=>document.querySelector('#tunnel').getBoundingClientRect().top+scrollY);
await p.evaluate(y=>scrollTo(0,y),y);
for(const v of [.5,.75,.88,1]){await p.evaluate(v=>{gsap.killTweensOf(window.__tun);window.__tun.p=v;window.__tun.kick&&window.__tun.kick()},v);await p.waitForTimeout(2500);await p.screenshot({path:'/tmp/claude-0/mt-'+Math.round(v*100)+'.jpg'});}
await b.close();})();
