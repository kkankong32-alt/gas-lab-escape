import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
const page=await browser.newPage(),results=[];
await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__lab?.ready);await page.locator('#start').click();
// Geometry/layout fixtures only: end-to-end puzzle success is verified separately.
await page.evaluate(()=>window.__lab.state.solved.fill(true));
for(const [width,height] of [[1280,720],[1600,900],[1920,1080]]){
 await page.setViewportSize({width,height});
 for(let i=0;i<5;i++){
  await page.evaluate(i=>window.__lab.focus(i),i);await page.waitForFunction(()=>!window.__lab.transitioning);await page.waitForTimeout(300);
  const result=await page.evaluate(i=>{
   const ids=['focus-head','focus-panel','circuits','hint','tools','back','interact','toast','particle-note'];
   const rects=ids.map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return {id,x:r.x,y:r.y,right:r.right,bottom:r.bottom,visible:r.width>0};}).filter(r=>r.visible);
   const out=rects.filter(r=>r.x<0||r.y<0||r.right>innerWidth||r.bottom>innerHeight);
   const obscured=window.__lab.world.hits.filter(h=>h.station===i&&!h.id.startsWith('station-')).flatMap(h=>{const p=window.__lab.hit(h.id);const cover=rects.filter(r=>p.x>r.x&&p.x<r.right&&p.y>r.y&&p.y<r.bottom);return cover.length?[{hit:h.id,by:cover.map(x=>x.id)}]:[];});
   const canvas=document.querySelector('canvas').getBoundingClientRect();
   const visuals=window.__lab.world.visualBounds(i);
   const clipped=visuals.filter(v=>v.left<canvas.left-1||v.right>canvas.right+1||v.top<canvas.top-1||v.bottom>canvas.bottom+1);
   const covered=visuals.flatMap(v=>rects.filter(r=>Math.min(v.right,r.right)>Math.max(v.left,r.x)&&Math.min(v.bottom,r.bottom)>Math.max(v.top,r.y)).map(r=>({object:v.id,ui:r.id})));
   const textClipped=ids.filter(id=>{const e=document.getElementById(id);return e.offsetWidth>0&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1);});
   return {out,obscured,clipped,covered,textClipped,visuals,viewport:{top:canvas.top,bottom:canvas.bottom}};
  },i);
  results.push({width,height,station:i,...result});await page.screenshot({path:`qa/refined-room-${i+1}-${width}.png`});
 }
}
await fs.writeFile('qa/layout.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({visuals,...r})=>r),null,2));await browser.close();
assert.ok(results.every(r=>r.out.length===0&&r.obscured.length===0&&r.clipped.length===0&&r.covered.length===0&&r.textClipped.length===0),'Full equipment, room title and screen bounds must be visible and free of UI, with no clipped text');
