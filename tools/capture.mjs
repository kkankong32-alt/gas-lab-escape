import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('qa',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:5173/');
await page.waitForFunction(()=>window.__lab?.ready,{timeout:60000});
await page.screenshot({path:'qa/01-title.png'});
await page.locator('#start').click();await page.waitForTimeout(1200);
await page.screenshot({path:'qa/02-lobby.png'});
for(let i=0;i<5;i++){
 await page.evaluate(i=>window.__lab.focus(i),i);await page.waitForTimeout(1200);
 await page.screenshot({path:`qa/0${i+3}-station.png`});
}
console.log(JSON.stringify({errors,stats:await page.evaluate(()=>window.__lab.snapshot())},null,2));
await fs.writeFile('qa/initial-browser.json',JSON.stringify({errors,stats:await page.evaluate(()=>window.__lab.snapshot())},null,2));
await browser.close();
