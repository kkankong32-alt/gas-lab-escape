import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__lab?.ready);
await page.locator('#start').click();await page.evaluate(()=>window.__lab.focus(2));await page.waitForFunction(()=>!window.__lab.transitioning);
await page.evaluate(()=>{for(let i=0;i<12;i++)window.__lab.dispatch({type:'vacuum'});window.__lab.dispatch({type:'seal'});window.__lab.dispatch({type:'piston',v:30});window.__lab.advance(2);});
await page.waitForTimeout(300);
const geometry=await page.evaluate(()=>{
 const w=window.__lab.world,p=w.vacuumPlate;p.geometry.computeBoundingBox();
 const bb=p.geometry.boundingBox.clone().applyMatrix4(p.matrixWorld);
 const center=w.balloon.getWorldPosition(w.camera.position.clone());
 return {plateBottom:bb.min.y,balloonTop:center.y+.135*w.balloon.scale.y};
});
console.log('Contact:',geometry);
assert.ok(Math.abs(geometry.plateBottom-geometry.balloonTop)<.001,'Inflated balloon physically meets plate within 1 mm');
await page.screenshot({path:'qa/09-1280x720.png'});
const performanceResults={};
for(const quality of ['low','normal']){
 await page.evaluate(q=>window.__lab.world.quality(q),quality);
 performanceResults[quality]=await page.evaluate(async()=>{
  const times=[];let prev=performance.now();for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);let n=performance.now();times.push(n-prev);prev=n;}
  times.sort((a,b)=>a-b);const w=window.__lab.world,gl=w.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
  return {medianFrameMs:times[60],p95FrameMs:times[114],...window.__lab.snapshot(),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'};
 });
 if(quality==='low')await page.screenshot({path:'qa/10-low-quality.png'});
}
await fs.writeFile('qa/geometry-performance.json',JSON.stringify({passed:true,geometry,performance:performanceResults},null,2));
await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(200);await page.screenshot({path:'qa/05-pressure-solved.png'});
console.log(JSON.stringify({geometry,performance:performanceResults},null,2));await browser.close();
