import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const html=await fs.readFile('index.html','utf8'),code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
for(const protocol of ['https:','file:','http:']){
 const scripts=[],context={location:{protocol,hostname:protocol==='http:'?'localhost':'kkankong32-alt.github.io',origin:'https://kkankong32-alt.github.io',pathname:'/gas-lab-escape/'},document:{createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}}};context.window=context;
 vm.runInNewContext(code,context);
 assert.equal(scripts.length,protocol==='https:'?1:0);
 if(protocol==='https:')assert.deepEqual(Array.from(context.dataLayer.slice(1),x=>x[1]),['G-DC7N6KQBG0','G-5YW0T2C109']);
}
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(pathToFileURL(process.cwd()+'/게임_시작.html').href);await p.locator('#start:not([disabled])').waitFor({timeout:60000});
for(const [width,height] of [[1280,720],[390,844],[844,390]]){
 await p.setViewportSize({width,height});await p.waitForTimeout(150);
 assert.match(await p.locator('.creator-credit').innerText(),/쓰로인훈쌤 김종훈/);
 const a=await p.locator('.creator-credit').boundingBox(),s=await p.locator('#start').boundingBox();assert.ok(a.y>=0&&a.y+a.height<=height);assert.ok(a.y+a.height<=s.y);
 await p.screenshot({path:`qa/credits-${width}.png`});
}
assert.equal(await p.evaluate(()=>typeof window.gtag),'undefined');assert.deepEqual(errors,[]);await b.close();console.log('Credits, viewports, offline startup, dual analytics configuration: PASS');
