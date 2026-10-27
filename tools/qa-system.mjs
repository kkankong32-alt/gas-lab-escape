import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>window.__lab?.ready);
await page.screenshot({path:'qa/01-title.png'});await page.locator('#start').click();await page.waitForTimeout(800);
await page.screenshot({path:'qa/02-lobby.png'});
const checks=[];
async function pos(){return page.evaluate(()=>window.__lab.state.position);}
async function moveAxis(axis,target){
 let p=await pos(),old=p[axis];
 const directions={KeyW:[-Math.sin(p.yaw),-Math.cos(p.yaw)],KeyS:[Math.sin(p.yaw),Math.cos(p.yaw)],KeyD:[Math.cos(p.yaw),-Math.sin(p.yaw)],KeyA:[-Math.cos(p.yaw),Math.sin(p.yaw)]};
 const code=Object.keys(directions).sort((a,b)=>directions[b][axis==='x'?0:1]*Math.sign(target-old)-directions[a][axis==='x'?0:1]*Math.sign(target-old))[0];
 await page.keyboard.down(code);let timeout=Date.now()+16000;
 while(Date.now()<timeout){
  await page.waitForTimeout(60);p=await pos();if(Math.abs(p[axis]-target)<.14||(target-old)*(target-p[axis])<0)break;
 }
 await page.keyboard.up(code);assert.ok(Math.abs(p[axis]-target)<.3,`Reach ${axis}=${target}, actual=${p[axis]}`);
}
async function go(x,z){await moveAxis('z',z);await moveAxis('x',x);}
try{
 // Start faces the first laboratory; movement is real keyboard input, relative to saved yaw.
 await moveAxis('x',-3);await go(-9,-4);await page.keyboard.press('KeyE');await page.waitForFunction(()=>!window.__lab.transitioning);assert.equal(await page.evaluate(()=>window.__lab.mode),'focus');checks.push('WASD left north corridor / room 1');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__lab.transitioning);
 await moveAxis('x',-3);await moveAxis('z',-2);await moveAxis('x',3);await go(9,-4);await page.keyboard.press('KeyE');await page.waitForFunction(()=>!window.__lab.transitioning);checks.push('WASD cross lobby / room 2');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__lab.transitioning);
 await moveAxis('x',3);await go(-9,4.5);await page.keyboard.press('KeyE');await page.waitForFunction(()=>!window.__lab.transitioning);checks.push('WASD south corridor / room 3');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__lab.transitioning);
 await moveAxis('x',9);await page.keyboard.press('KeyE');await page.waitForFunction(()=>!window.__lab.transitioning);checks.push('WASD room 4');
 await page.locator('#hint').click();assert.ok(await page.locator('#modal').isVisible());await page.locator('#close-modal').click();checks.push('Hint opens / closes');
 await page.keyboard.press('KeyV');assert.ok(await page.locator('#particle-note').isVisible());await page.keyboard.press('KeyV');
 await page.locator('#tools').click();await page.locator('#tool-reset').click();checks.push('Reset and schematic toggle');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!window.__lab.transitioning);
 await moveAxis('x',0);await moveAxis('z',-2.7);await page.keyboard.press('KeyE');await page.waitForFunction(()=>!window.__lab.transitioning);assert.equal(await page.evaluate(()=>window.__lab.mode),'walk');checks.push('WASD final console, remains locked before experiments');
 const collision=await page.evaluate(()=>{const w=window.__lab.world;return {wall:!w.valid(4,0),table:!w.valid(0,-4.45),outer:!w.valid(14,4),door:!w.valid(0,-7),hall:w.valid(5,4)};});
 assert.ok(Object.values(collision).every(Boolean));checks.push('Walls, workbenches, exterior, closed door collide; corridor open');
 await page.setViewportSize({width:1280,height:720});await page.screenshot({path:'qa/09-1280x720.png'});
 await page.keyboard.press('KeyJ');assert.ok(await page.locator('#modal').isVisible());await page.locator('#close-modal').click();
 await page.reload();await page.waitForFunction(()=>window.__lab?.ready);assert.ok(await page.locator('#continue').isEnabled());await page.locator('#continue').click();
 assert.ok((await pos()).z<0);checks.push('Autosave and resume restore position');
 await page.evaluate(()=>window.__lab.world.quality('low'));
 const perf=await page.evaluate(async()=>{const ts=[];let p=performance.now();for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const n=performance.now();ts.push(n-p);p=n;}ts.sort((a,b)=>a-b);return {medianFrameMs:ts[60],p95FrameMs:ts[114],...window.__lab.snapshot(),webgl:window.__lab.world.renderer.getContext().getParameter(7937)};});
 await page.screenshot({path:'qa/10-low-quality.png'});checks.push('Low quality renders');
 await fs.writeFile('qa/system.json',JSON.stringify({checks,errors,collision,perf},null,2));console.log(JSON.stringify({checks,errors,perf},null,2));
}catch(e){await page.screenshot({path:'qa/system-failure.png'});await fs.writeFile('qa/system.json',JSON.stringify({checks,errors,failure:String(e)},null,2));console.error(e);process.exitCode=1;}
await browser.close();
