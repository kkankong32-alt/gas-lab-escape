import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),p=await b.newPage(),results=[];
await p.goto('http://127.0.0.1:5173');await p.waitForFunction(()=>window.__lab?.ready);await p.locator('#start').click();
// Unlock earlier stations only as a layout fixture; all gas selections use UI clicks.
await p.evaluate(()=>{for(let i=0;i<4;i++){window.__lab.state.solved[i]=true;window.__lab.learning.done[i]=true;}});
for(const [width,height] of [[1920,1080],[1280,720],[390,844],[844,390]]){
 await p.setViewportSize({width,height});
 for(let lab=0;lab<5;lab++){
 await p.evaluate(i=>window.__lab.focus(i),lab);await p.waitForTimeout(1200);if(await p.locator('#begin-now').isVisible())await p.locator('#begin-now').click();
 if(lab===3){await p.locator('#tools').click();await p.locator('#tool-reset').click();await p.locator('[data-object=cart-CO2]').click();}
 else await p.evaluate(()=>{const t=document.querySelector('#toast');t.textContent='조작을 확인해 주세요. 선택한 기구를 알맞은 연결구에 놓아 주세요.';t.classList.remove('hidden');});
 await p.waitForTimeout(120);
 const check=await p.evaluate(()=>{const t=document.querySelector('#toast'),r=t.getBoundingClientRect();return {visible:!t.classList.contains('hidden'),x:r.x,y:r.y,width:r.width,height:r.height,hits:[...document.querySelectorAll('#equipment-rail button,#final-console button,.toolbar button')].filter(e=>{const a=e.getBoundingClientRect();return a.width&&a.height&&a.left<r.right&&a.right>r.left&&a.top<r.bottom&&a.bottom>r.top;}).map(e=>e.id||e.textContent)};});
 assert.ok(check.width<=561&&check.x>=0&&check.y>=0,JSON.stringify({width,lab,check}));assert.deepEqual(check.hits,[],JSON.stringify({width,lab,check}));results.push({width,height,lab,...check});
 if(lab===3){await p.screenshot({path:`qa/overlap-gas-${width}.png`});await p.locator('[data-object=dock-CO2]').click();await p.locator('#gas-supply').click();await p.waitForTimeout(300);}
 await p.locator('#back').click();await p.waitForTimeout(300);
 }
}
await fs.writeFile('qa/overlap.json',JSON.stringify(results,null,2));await b.close();console.log('20 lab/viewport notice layouts passed');

