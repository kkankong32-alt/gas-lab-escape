import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__lab?.ready);
await page.locator('#start').click();
// Isolated cinematic test: full gameplay route is tested separately by playthrough.mjs.
await page.evaluate(()=>{
 const s=window.__lab.state;s.solved.fill(true);
 for(const id of [0,1,2,3])window.__lab.dispatch({type:'port',id});
 window.__lab.dispatch({type:'finalValve',value:1});window.__lab.dispatch({type:'heater'});
 for(let i=0;i<1500&&s.final.open<.1;i++)window.__lab.advance(.025);
});
await page.waitForFunction(()=>window.__lab.state.final.open>.35&&window.__lab.state.final.open<.9);
const rod=await page.evaluate(()=>{
 const w=window.__lab.world,o=w.actuator.getObjectByName('actuatorRod');
 o.geometry.computeBoundingBox();const box=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
 return {bottom:box.min.y,barrelTop:1.01+.45*1.15};
});
assert.ok(rod.bottom<rod.barrelTop,'Extended actuator rod remains inside its barrel');
await page.screenshot({path:'qa/07-door-opening.png'});
await page.waitForFunction(()=>window.__lab.state.final.escaped,{timeout:20000});assert.ok(await page.locator('#ending').isVisible());
await fs.writeFile('qa/cinematic.json',JSON.stringify({passed:true,note:'Preconditions set in dev mode. Opening animation then ran in real time.',rod,final:await page.evaluate(()=>window.__lab.state.final)},null,2));
console.log('Real-time door opening animation passed');await browser.close();
