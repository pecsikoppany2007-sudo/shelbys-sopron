// eldobott képkockák görgetés közben (Chrome trace, PipelineReporter). PERF_HW: WebGL ki, csak a GPU-szonda kap hardveres nevet.
const {chromium,devices}=require('playwright');
const prof=process.argv[2]||'desk';
(async()=>{const args=prof==='desk'?['--disable-webgl','--disable-3d-apis']:[];
const b=await chromium.launch({args});
const opt=prof==='desk'?{viewport:{width:1440,height:900}}:{...devices[prof==='iphone'?'iPhone 13':'Pixel 7']};
const c=await b.newContext(opt);
await c.addInitScript(()=>{try{sessionStorage.setItem('sg-intro','1');localStorage.setItem('sg-lang','hu')}catch(e){}
 const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,o){const r=g.call(this,t,o);if(r||!/webgl/.test(t))return r;if(!this.isConnected)return{getExtension:n=>n==='WEBGL_debug_renderer_info'?{UNMASKED_RENDERER_WEBGL:1}:null,getParameter:()=> 'ANGLE (Apple M2)'};return null}});
const p=await c.newPage();await p.goto('http://localhost:8765/');await p.waitForTimeout(2500);
const cdp=await c.newCDPSession(p);
if(prof!=='desk')await cdp.send('Emulation.setCPUThrottlingRate',{rate:prof==='iphone'?4:6});
await b.startTracing(p,{categories:['benchmark','disabled-by-default-devtools.timeline.frame','cc','viz']});
const H=await p.evaluate(()=>document.documentElement.scrollHeight);
if(prof==='desk'){for(let i=0;i<70;i++){await p.mouse.move(700+Math.sin(i)*200,400);await p.mouse.wheel(0,180);await p.waitForTimeout(110);}}
else{for(let i=0;i<14;i++){await cdp.send('Input.synthesizeScrollGesture',{x:200,y:600,yDistance:-600,speed:1400,gestureSource:'mouse'});}}
const buf=await b.stopTracing();const ev=JSON.parse(buf.toString()).traceEvents;
let tot=0,drop=0;for(const e of ev){if(e.name==='PipelineReporter'&&e.ph==='b'&&e.args&&(e.args.chrome_frame_reporter||e.args.frame_reporter)){const fr=e.args.chrome_frame_reporter||e.args.frame_reporter;tot++;if(fr.state==='STATE_DROPPED')drop++;}}
console.log(prof,'frames',tot,'dropped',drop,(100*drop/Math.max(1,tot)).toFixed(1)+'%','rich',await p.evaluate(()=>document.documentElement.className));
await b.close()})();
