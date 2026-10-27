import {completeReview} from './review-helper.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],checks=[],arrows=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__lab?.ready);
const shot=async name=>{
 const problems=await page.evaluate(()=>{
  if(window.__lab.mode!=='focus'||window.__lab.transitioning)return [];
  const ids=['focus-head','focus-panel','circuits','interact','toast','hint','tools','back'];
  return ids.filter(id=>{const e=document.getElementById(id);return e.offsetWidth>0&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1);});
 });assert.deepEqual(problems,[],`No clipped text at ${name}`);
 return page.screenshot({path:`qa/ux-${name}.png`});
};
const pos=()=>page.evaluate(()=>({...window.__lab.state.position}));
async function click(id){const p=await page.evaluate(id=>window.__lab.hit(id),id);await page.mouse.click(p.x,p.y);await page.waitForTimeout(600);}
async function pump(){const p=await page.evaluate(()=>window.__lab.hit('mass-pump'));await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x,p.y+72,{steps:10});await page.mouse.up();await page.waitForTimeout(200);}
async function guide(text){await page.waitForFunction(text=>document.querySelector('#focus-head').textContent.includes(text),text);}
async function moveAxis(axis,target){
 let p=await pos(),old=p[axis];if(Math.abs(old-target)<.12)return;
 const directions={ArrowUp:[-Math.sin(p.yaw),-Math.cos(p.yaw)],ArrowDown:[Math.sin(p.yaw),Math.cos(p.yaw)],ArrowRight:[Math.cos(p.yaw),-Math.sin(p.yaw)],ArrowLeft:[-Math.cos(p.yaw),Math.sin(p.yaw)]};
 const code=Object.keys(directions).sort((a,b)=>directions[b][axis==='x'?0:1]*Math.sign(target-old)-directions[a][axis==='x'?0:1]*Math.sign(target-old))[0];
 await page.keyboard.down(code);const limit=Date.now()+16000;
 while(Date.now()<limit){await page.waitForTimeout(55);p=await pos();if(Math.abs(p[axis]-target)<.12||(target-old)*(target-p[axis])<0)break;}
 await page.keyboard.up(code);assert.ok(Math.abs(p[axis]-target)<.3);
}
async function layout(){return page.evaluate(()=>{
 const ids=['mission','focus-head','focus-panel','circuits','keys','hint','tools','back','pause'];
 return ids.flatMap(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return r.width&&r.height?[{id,x:r.x,y:r.y,w:r.width,h:r.height,font:getComputedStyle(e).fontSize,within:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}]:[];});
});}
try{
 await shot('01-title');await page.locator('#start').click();await page.waitForTimeout(900);
 assert.ok(await page.evaluate(()=>document.pointerLockElement===document.querySelector('canvas')),'Pointer locks on start');checks.push('Start pointer lock');
 await shot('02-first-goal');
 for(const [key,axis,sign,reverse] of [['ArrowUp','x',-1,'ArrowDown'],['ArrowDown','x',1,'ArrowUp'],['ArrowLeft','z',1,'ArrowRight'],['ArrowRight','z',-1,'ArrowLeft']]){
  const a=await pos();await page.keyboard.down(key);await page.waitForTimeout(180);await page.keyboard.up(key);const b=await pos();
  assert.ok((b[axis]-a[axis])*sign>.12,`${key} moved`);arrows.push({key,from:a,to:b,delta:b[axis]-a[axis]});
  await page.keyboard.down(reverse);await page.waitForTimeout(180);await page.keyboard.up(reverse);
 }
 assert.equal(await page.evaluate(()=>scrollX+scrollY),0);checks.push('Four arrow keys move in expected directions; no page scrolling');

 // Mouse look is tested after the novice route so that this walk keeps its initial heading.
 await page.keyboard.down('ArrowUp');
 await page.waitForFunction(()=>window.__lab.state.position.x < -8.5,{},{timeout:12000});await page.keyboard.up('ArrowUp');
 await page.keyboard.press('KeyE');await page.waitForFunction(()=>window.__lab.mode==='focus'&&!window.__lab.transitioning);
 assert.equal(await page.evaluate(()=>document.pointerLockElement),null);checks.push('Walk from spawn through lab 1 entrance with ArrowUp, E enters, pointer unlocks');
 await guide('페트병을 클릭해');await shot('03-pick-up');
 await click('mass-scale');assert.match(await page.locator('#toast').innerText(),/페트병.*집/);checks.push('Invalid placement explains pickup');
 await click('bottle');await guide('저울 위에');await shot('04-place-on-scale');
 await click('mass-scale');await guide('무게를 잰');await shot('05-first-measurement');
 const first=await page.evaluate(()=>window.__lab.state.mass.baseline);assert.ok(first>35);
 // Save and continue at an intermediate step; the guide is derived from saved science state.
 await page.reload();await page.waitForFunction(()=>window.__lab?.ready);await page.locator('#continue').click();await page.keyboard.press('KeyE');await page.waitForFunction(()=>window.__lab.mode==='focus'&&!window.__lab.transitioning);await guide('무게를 잰');checks.push('Partial mass save resumes correct guide');
 await click('bottle');await guide('공기 주입 장치');
 await click('mass-dock');await guide('손잡이를 위아래로');
 const dockPoint=await page.evaluate(()=>{const lab=window.__lab,p=lab.hit('mass-dock');for(const dx of [24,-24,36,-36,48,-48,0])for(const dy of [0,12,-12,24,-24])if(lab.world.pick(p.x+dx,p.y+dy,0)?.id==='mass-dock')return {x:p.x+dx,y:p.y+dy};throw Error('Visible dock target not found');});await page.mouse.move(dockPoint.x,dockPoint.y);await page.waitForTimeout(300);
 assert.match(await page.locator('#interact').innerText(),/연결되어/);assert.doesNotMatch(await page.locator('#interact').innerText(),/집기|먼저/);
 await page.mouse.click(dockPoint.x,dockPoint.y);await page.waitForTimeout(300);assert.doesNotMatch(await page.locator('#toast').innerText(),/병.*집/);checks.push('Occupied pump dock gives no contradictory pickup instruction, including wrong clicks');
 await shot('06-pump');
 const cameraBefore=await page.evaluate(()=>({p:window.__lab.world.camera.position.toArray(),q:window.__lab.world.camera.quaternion.toArray()}));
 for(let i=0;i<8;i++)await pump();
 assert.deepEqual(await page.evaluate(()=>({p:window.__lab.world.camera.position.toArray(),q:window.__lab.world.camera.quaternion.toArray()})),cameraBefore);checks.push('Pump drags keep focus camera fixed; no mouse-look conflict');await guide('공기를 넣은');assert.doesNotMatch(await page.locator('#toast').innerText(),/다시.*끌|손잡이를 놓고/);await shot('07-air-added');
 await click('bottle');await guide('다시 저울');await shot('08-reweigh');await click('mass-scale');await guide('실험 성공');await shot('09-mass-success');
 assert.ok(await page.evaluate(()=>window.__lab.state.solved[0]));assert.equal(await page.locator('#interact').isVisible(),false);checks.push('Mass six phases completed through physical clicks/drags');
 await completeReview(page,0,false,'ux');
 const layouts={};
 for(const [width,height] of [[1280,720],[1600,900],[1920,1080]]){await page.setViewportSize({width,height});await page.waitForTimeout(300);layouts[`${width}x${height}`]=await layout();assert.ok(layouts[`${width}x${height}`].every(x=>x.within));await shot(`layout-${width}`);}
 await page.setViewportSize({width:1280,height:720});await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__lab.transitioning);
 assert.equal(await page.evaluate(()=>window.__lab.mode),'walk');assert.ok(await page.evaluate(()=>!!document.pointerLockElement));
 assert.match(await page.locator('#mission').innerText(),/제2실험실/);await shot('10-next-goal');
 for(const [x,z]of [[-3,-4],[-3,-2],[3,-2],[3,-4],[8.8,-4]]){await moveAxis('x',x);await moveAxis('z',z);}
 await page.keyboard.press('KeyE');await page.waitForFunction(()=>window.__lab.mode==='focus'&&!window.__lab.transitioning);assert.match(await page.locator('#focus-head').innerText(),/제2실험실/);await shot('11-next-lab');
 await page.locator('#hint').click();await page.locator('#hint-next').click();assert.match(await page.locator('#modal').innerText(),/집기병을 클릭해 집으세요/);await page.locator('#close-modal').click();
 await page.locator('#tools').click();assert.ok(await page.locator('#tool-journal').isVisible());assert.ok(await page.locator('#tool-reset').isVisible());await page.locator('#close-modal').click();
 checks.push('After success: next goal, real arrow-key walk to lab 2, E entry, current-step hint and tools');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__lab.transitioning);
 const yawBefore=(await pos()).yaw;await page.mouse.move(700,360);await page.waitForTimeout(200);const yawAfter=(await pos()).yaw;assert.notEqual(yawBefore,yawAfter);checks.push('Escape returns to walking and relocks; real mouse changes view');
 await page.keyboard.press('Escape');await page.waitForTimeout(350);assert.ok(await page.locator('#modal').isVisible());await page.locator('#resume').click();assert.ok(await page.evaluate(()=>!!document.pointerLockElement));checks.push('Pause / resume pointer lock');
 await page.evaluate(()=>window.__lab.walkTo(0,-2.7));await page.keyboard.press('KeyE');assert.equal(await page.evaluate(()=>window.__lab.mode),'walk');assert.match(await page.locator('#toast').innerText(),/잠겨/);checks.push('Final console blocks premature entry');
 assert.deepEqual(errors,[]);await fs.writeFile('qa/ux.json',JSON.stringify({checks,arrows,layouts,errors},null,2));console.log(JSON.stringify({checks,arrows,errors},null,2));
}catch(e){await page.screenshot({path:'qa/ux-failure.png'});await fs.writeFile('qa/ux.json',JSON.stringify({checks,arrows,errors,failure:String(e)},null,2));console.error(e);process.exitCode=1;}
await browser.close();


