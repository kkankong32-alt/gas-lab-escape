import {finishGas} from './gas-helper.mjs';
import {completeReview} from './review-helper.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:'qa/supply-video',size:{width:1280,height:720}}});const page=await context.newPage();const evidence=[];const shot=async name=>page.screenshot({path:'qa/supply-'+name+'.png'});
const errors=[],missing=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});
await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__lab?.ready);
await page.locator('#start').click();
async function moveAxis(axis,target){
 let p=await page.evaluate(()=>window.__lab.state.position),old=p[axis];if(Math.abs(old-target)<.12)return;
 const directions={ArrowUp:[-Math.sin(p.yaw),-Math.cos(p.yaw)],ArrowDown:[Math.sin(p.yaw),Math.cos(p.yaw)],ArrowRight:[Math.cos(p.yaw),-Math.sin(p.yaw)],ArrowLeft:[-Math.cos(p.yaw),Math.sin(p.yaw)]};
 const code=Object.keys(directions).sort((a,b)=>directions[b][axis==='x'?0:1]*Math.sign(target-old)-directions[a][axis==='x'?0:1]*Math.sign(target-old))[0];
 await page.keyboard.down(code);const limit=Date.now()+16000;
 while(Date.now()<limit){await page.waitForTimeout(55);p=await page.evaluate(()=>window.__lab.state.position);if(Math.abs(p[axis]-target)<.12||(target-old)*(target-p[axis])<0)break;}
 await page.keyboard.up(code);assert.ok(Math.abs(p[axis]-target)<.3,`Walk to ${axis}=${target}, actual ${p[axis]}`);
}
async function focus(i){
 if(i>0)await completeReview(page,i-1,false,'pc-walk');
 if(await page.evaluate(()=>window.__lab.mode==='focus')){await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__lab.transitioning);}
 const nodes=[[-3,-4],[-3,-2],[3,-2],[3,-4],[-3,4.5],[3,4.5],[-9,-4],[9,-4],[-9,4.5],[9,4.5],[0,-2.7]];
 const edges=[[0,1],[1,2],[2,3],[1,4],[2,5],[4,5],[0,6],[3,7],[4,8],[5,9],[1,10],[2,10]];
 const p=await page.evaluate(()=>window.__lab.state.position);let start=0,d=Infinity;
 nodes.forEach(([x,z],j)=>{const dist=Math.hypot(p.x-x,p.z-z);if(dist<d){d=dist;start=j;}});
 const end=[6,7,8,9,10][i],queue=[[start]],seen=new Set([start]);let path;
 while(queue.length){const route=queue.shift(),last=route.at(-1);if(last===end){path=route;break;}for(const [a,b]of edges){const next=a===last?b:b===last?a:-1;if(next>=0&&!seen.has(next)){seen.add(next);queue.push([...route,next]);}}}
 for(const node of path){await moveAxis('x',nodes[node][0]);await moveAxis('z',nodes[node][1]);}
 await page.keyboard.press('KeyE');await page.waitForFunction(()=>window.__lab.mode==='focus'&&!window.__lab.transitioning);await page.waitForTimeout(400);
}
async function point(id){const p=await page.evaluate(id=>{const l=window.__lab,h=l.world.hits.find(h=>h.id===id),p=l.hit(id);for(const dx of [0,-12,12,-24,24,-36,36])for(const dy of [0,-12,12,-24,24,-36,36])if(l.world.pick(p.x+dx,p.y+dy,h.station)?.id===id)return {x:p.x+dx,y:p.y+dy};throw Error('No exposed hit target '+id);},id);assert.ok(p,`Target ${id}`);return p;}
async function click(id){const p=await point(id);await page.mouse.click(p.x,p.y);await page.waitForTimeout(500);}
async function drag(id,dx,dy){const p=await point(id);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+dx,p.y+dy,{steps:10});await page.mouse.up();await page.waitForTimeout(150);}
async function advance(t){await page.waitForTimeout(t*1000);await page.waitForTimeout(350);await page.waitForFunction(()=>!window.__lab.transitioning);}
async function state(){return page.evaluate(()=>window.__lab.state);}
try{
 await focus(0);await click('bottle');await click('mass-scale');await page.waitForTimeout(650);
 assert.ok((await state()).mass.baseline!==null,'Initial scale measured');
 await click('bottle');await click('mass-dock');await page.waitForTimeout(650);
 for(let i=0;i<8;i++)await drag('mass-pump',0,70);
 await click('bottle');await click('mass-scale');await page.waitForTimeout(700);
 assert.ok((await state()).solved[0],'Mass solved');await page.screenshot({path:'qa/03-mass-solved.png'});
 await focus(1);await click('jar');await click('heat-hot');await advance(25);
 assert.ok((await state()).heat.hot,'Heated');await page.screenshot({path:'qa/04-temperature-hot.png'});
 await click('jar');await click('heat-wipe');await page.waitForTimeout(650);await click('jar');await click('heat-cold');await advance(30);
 assert.ok((await state()).solved[1],'Temperature solved');await page.screenshot({path:'qa/04-temperature-cold.png'});
 await focus(2);await page.locator('#target-action').click();await page.waitForTimeout(350);await page.locator('#target-action').click();await page.waitForTimeout(400);await drag('piston',0,130);await advance(3);
 assert.ok((await state()).press.syringe,'Syringe solved');
 for(let i=0;i<12&&!(await state()).solved[2];i++)await drag('vacuum',0,70);
 await advance(2);assert.ok((await state()).solved[2],'Pressure solved');await page.screenshot({path:'qa/05-pressure-solved.png'});
 await focus(3);await fs.writeFile('qa/supply-safe-checkpoint.json',JSON.stringify(await state()));
 for(const gas of ['He','CO2','N2','O2']){
  await page.locator('[data-object=cart-'+gas+']').click({delay:400});await page.locator('[data-object=dock-'+gas+']').click({delay:400});await page.waitForFunction(()=>!window.__lab.transitioning);
  const before=structuredClone((await state()).gases);await shot(gas+'-before');await page.locator('#gas-supply').click({delay:450});await page.waitForTimeout(300);assert.ok((await state()).gases.valve>0);await page.locator('#gas-supply').click({clickCount:3,delay:80});assert.ok((await state()).gases.valve>0);
  if(gas==='He'){await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__lab.mode==='walk'&&!window.__lab.transitioning);assert.equal(await page.evaluate(()=>!!document.pointerLockElement),false);await shot('closed');await page.keyboard.press('KeyE');await page.waitForFunction(()=>window.__lab.mode==='focus'&&!window.__lab.transitioning);await page.locator('#back').click({delay:450});await page.waitForFunction(()=>window.__lab.mode==='walk'&&!window.__lab.transitioning);await page.keyboard.press('KeyE');await page.waitForFunction(()=>window.__lab.mode==='focus'&&!window.__lab.transitioning);await shot('reentered');}
  await page.waitForTimeout(1500);await shot(gas+'-during');await page.waitForFunction(g=>window.__lab.state.gases.done[g],gas,{timeout:90000});await shot(gas+'-after');evidence.push({gas,before,after:(await state()).gases});await finishGas(page,gas);await shot(gas+'-observed');
 }
 assert.ok((await state()).solved[3],'All gas properties solved');await page.screenshot({path:'qa/06-gases-solved.png'});
 await completeReview(page,3,false,'supply');await page.locator('#navigate').click();await page.locator('#enter-touch').waitFor({timeout:30000});await page.locator('#enter-touch').click();await page.waitForFunction(()=>window.__lab.mode==='focus'&&!window.__lab.transitioning);await page.screenshot({path:'qa/reboot-final-0.png'});for(const i of [0,1,2,3]){await page.waitForFunction(()=>!window.__lab.transitioning);await page.locator('#target-action').click();await page.waitForTimeout(900);if(i===1||i===3)await page.screenshot({path:`qa/reboot-final-${i===1?1:2}.png`});}
 await page.locator('#final-open-valve').click();await page.locator('#final-heat').click();
 await page.screenshot({path:'qa/07-final-connected.png'});await advance(8);await page.screenshot({path:'qa/reboot-final-3.png'});await advance(5);await page.screenshot({path:'qa/reboot-final-4.png'});
 await advance(55);await page.waitForTimeout(8500);
 assert.ok((await state()).final.escaped,'Escaped');await page.screenshot({path:'qa/08-ending.png'});
 assert.ok(await page.locator('#ending').isVisible());
 console.log('Full interaction route passed');
}catch(e){await page.screenshot({path:'qa/failure.png'});console.error(e);process.exitCode=1;}
await fs.writeFile('qa/supply-full.json',JSON.stringify({passed:!process.exitCode,evidence,navigation:'New game, real input and real time, no completion mutations or time acceleration',errors,missing,state:await state(),stats:await page.evaluate(()=>window.__lab.snapshot())},null,2));
console.log(JSON.stringify({navigation:'Real arrow keys and E in all five areas; no camera teleport',errors,missing,state:await state()},null,2));const video=page.video();await context.close();await video.saveAs('qa/제4실험실_조작_검수영상.webm');await browser.close();
