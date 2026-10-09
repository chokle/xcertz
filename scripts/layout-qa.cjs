const {chromium} = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch({headless:true, executablePath:process.env.XCERTZ_BROWSER_EXECUTABLE || undefined, args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const server=http.createServer((req,res)=>{
  const file=path.join(process.cwd(),'dist',req.url==='/'?'index.html':req.url.split('?')[0]);
  if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');
  res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const testUrl=`http://127.0.0.1:${server.address().port}`;
 const results=[];
 for (const width of [1440,375,390]) {
  const page=await browser.newPage({viewport:{width,height:width===1440?1000:844}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(testUrl, {waitUntil:'load'});
  await page.getByRole('heading',{name:'Tickets you can prove.'}).count();
  await page.screenshot({path:`docs/assets/layout-${width}.png`,fullPage:true});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.getByRole('button',{name:'Connect issuer'}).click();
  await page.getByRole('status').filter({hasText:'Phantom wallet was not detected'}).waitFor();
  results.push({width,overflow,errors,missingWalletFeedback:true});
  if(overflow||errors.length) throw Error(JSON.stringify(results));
  await page.close();
 }
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
 fs.writeFileSync('docs/layout-qa.json',JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
