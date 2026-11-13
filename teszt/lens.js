// lencse + nyitás képei hamis GPU-val: node lens.js
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const c=await b.newContext({viewport:{width:1440,height:900}});
await c.addInitScript({content:fs.readFileSync(__dirname+'/fakegpu.js','utf8')});
await c.addInitScript(()=>{try{localStorage.setItem('sg-lang','hu')}catch(e){}});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8765/');
for(const [i,t] of [[0,700],[1,1500],[2,2300],[3,3000]]){await p.waitForTimeout(i?t-[0,700,1500,2300][i]:t);await p.screenshot({path:`/tmp/in-${i}.jpg`,type:'jpeg',quality:60});}
await p.waitForTimeout(2500);
await p.mouse.move(900,330);await p.waitForTimeout(300);await p.mouse.move(980,360,{steps:8});await p.waitForTimeout(1500);
await p.screenshot({path:'/tmp/lens.jpg',type:'jpeg',quality:75});
console.log('errs',errs,'gl',await p.evaluate(()=>document.getElementById('top').classList.contains('gl-on')));
await b.close()})();
