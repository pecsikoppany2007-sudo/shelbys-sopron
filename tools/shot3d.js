const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:+(process.argv[4]||1800),height:+(process.argv[5]||1000)}});
p.on('pageerror',e=>console.log('ERR',e.message));p.on("console",m=>console.log("C",m.type(),m.text().slice(0,200)));
await p.goto(process.argv[2]);await p.waitForFunction('window.done',null,{timeout:120000});await p.screenshot({path:process.argv[3]});console.log(await p.title());await b.close()})();
