import {chromium} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
const context=await browser.newContext({viewport:{width:1280,height:720},offline:true});
const page=await context.newPage(),errors=[],remote=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
await page.goto(pathToFileURL(path.resolve(process.argv[2]||'게임_시작.html')).href);
await page.locator('#start:not([disabled])').waitFor({timeout:60000});
await page.screenshot({path:'qa/11-offline-title.png'});
assert.equal(await page.evaluate(()=>typeof window.__lab),'undefined','No production debug API');
const illustrationSizes=await page.evaluate(async()=>Promise.all(['mass','temperature','pressure','gases','blueprint','poster','snack'].map(name=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve({name,w:i.naturalWidth,h:i.naturalHeight});i.onerror=()=>reject(Error(name));i.src=window.__assetMap[`assets/illustrations/${name}.png`];}))));assert.ok(illustrationSizes.every(i=>i.w>=1024&&i.h>=1024),'All seven generated illustrations embedded and decoded offline');

await page.locator('#start').click();await page.waitForTimeout(1000);
assert.ok(await page.locator('#hud').isVisible());await page.screenshot({path:'qa/12-offline-lobby.png'});
// Production-only interaction: use rendered hover labels, never a game debug API.
const layout=JSON.parse(await fs.readFile('qa/device-layout.json','utf8')).find(r=>r.width===1280&&r.station===0);
const object=name=>layout.visuals.find(v=>v.id===name);
const expand=(b,up=0)=>({...b,top:b.top-up});
async function findTarget(text,b){
 const midX=(b.left+b.right)/2,midY=(b.top+b.bottom)/2;
 const points=[[midX,midY]];
 for(let y=Math.max(100,b.top);y<=Math.min(580,b.bottom);y+=16)for(let x=b.left;x<=b.right;x+=16)points.push([x,y]);
 for(const [x,y]of points){if(y<100||y>580)continue;await page.mouse.move(x,y);await page.waitForTimeout(40);if(await page.locator('#interact').isVisible()&&(await page.locator('#interact').innerText()).replaceAll('터치','클릭').includes(text))return {x,y};}
 throw Error('Production hover target missing: '+text);
}
async function use(text,b){const p=await findTarget(text,b);await page.mouse.click(p.x,p.y);await page.waitForTimeout(650);}
await page.keyboard.down('ArrowUp');await page.waitForTimeout(2600);await page.keyboard.up('ArrowUp');await page.keyboard.press('KeyE');await page.locator('#focus-head').waitFor({state:'visible'});await page.waitForTimeout(900);await page.locator('#start-picture').waitFor({state:'hidden',timeout:10000});
await page.screenshot({path:'qa/candidate-first-lab.png'});await use('클릭하여 집기',{left:300,right:950,top:150,bottom:580});
await use('클릭하여 놓기 · 전자저울',object('balance'));
assert.match(await page.locator('#focus-panel').innerText(),/35\.60/);
await use('클릭하여 집기',expand(object('balance'),180));
const dock=layout.hits['mass-dock'];const dockRegion={left:dock.x-35,right:dock.x+35,top:dock.y-25,bottom:dock.y+25};
await use('클릭하여 놓기 · 주입 받침',dockRegion);
const pump=await findTarget('위아래로 드래그',object('pump'));
for(let i=0;i<8;i++){await page.mouse.move(pump.x,pump.y);await page.mouse.down();await page.mouse.move(pump.x,pump.y+70,{steps:10});await page.mouse.up();await page.waitForTimeout(220);}
await use('클릭하여 집기',expand(dockRegion,190));await use('클릭하여 놓기 · 전자저울',object('balance'));
assert.match(await page.locator('#focus-head').innerText(),/실험 성공/);assert.match(await page.locator('#focus-panel').innerText(),/35\.84/);
await page.waitForTimeout(1200);if(!await page.locator('#review').isVisible())await page.locator('#review-open').click();await page.locator('[data-mass=before]').click();await page.locator('[data-mass=after]').click();await page.locator('[data-heavy=after]').click();await page.locator('#review-finish').click();await page.screenshot({path:'qa/13-offline-mass-success.png'});await page.keyboard.press('Escape');await page.waitForTimeout(900);assert.match(await page.locator('#mission').innerText(),/제2실험실/);await page.screenshot({path:'qa/14-offline-next-goal.png'});

await page.reload();await page.locator('#start:not([disabled])').waitFor({timeout:60000});
assert.ok(await page.locator('#continue').isEnabled());await page.locator('#continue').click();assert.ok(await page.locator('#hud').isVisible());
assert.deepEqual(remote,[]);assert.deepEqual(errors,[]);
await fs.writeFile('qa/offline.json',JSON.stringify({passed:true,offline:true,testedFile:process.argv[2]||'게임_시작.html',remoteRequests:remote,errors,debugAPI:false,checks:['file URL load','start','arrow-key walk to lab 1','production hover-guided clicks and pump drags','35.60 to 35.84 g mass success','next-lab objective','saved continuation after reload']},null,2));
console.log('Offline file URL game passed, 0 remote requests, 0 JS errors, production debug API absent.');
await browser.close();
