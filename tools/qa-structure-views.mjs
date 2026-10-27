import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const phase=process.argv[2]||'before';await fs.mkdir(`qa/structure-${phase}`,{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),p=await b.newPage({viewport:{width:1920,height:1080}});p.setDefaultTimeout(60000);await p.goto('http://127.0.0.1:5173');await p.locator('#start:not([disabled])').waitFor();await p.evaluate(s=>localStorage.setItem('gas-escape-v1',s),await fs.readFile('qa/mechanics-final-checkpoint.json','utf8'));await p.reload();await p.locator('#continue:not([disabled])').waitFor();await p.locator('#continue').click();
for(let i=0;i<5;i++){
 await p.evaluate(i=>window.__lab.focus(i),i);await p.waitForTimeout(4800);
 if(i===2)await p.locator('#pressure-all').click();
 if(i===3){await p.evaluate(()=>{window.__lab.dispatch({type:'cartridge',gas:'N2'});window.__lab.dispatch({type:'dock',gas:'N2'});});}
 await p.waitForTimeout(1500);
 await p.addStyleTag({content:'#hud,#focus-head,#focus-panel,#equipment-rail,#final-console,#target-marker,#readings,#zoom,#start-picture,.hud-bottom{visibility:hidden!important}#world{left:0!important;top:0!important;width:100vw!important;height:100vh!important}'});
 for(const [view,offset] of [['front',[0,2.65,3.7]],['side',[3.3,2.6,.65]],['top',[.1,5.6,.25]]]){
  await p.evaluate(({i,offset})=>{const w=window.__lab.world,c=w.stations[i].position;w.reviewing=true;w.resize();w.camera.position.set(c.x+offset[0],offset[1],c.z+offset[2]);w.camera.lookAt(c.x,1.4,c.z);}, {i,offset});await p.waitForTimeout(350);await p.screenshot({path:`qa/structure-${phase}/lab-${i+1}-${view}.png`});
 }
 await p.evaluate(()=>document.querySelectorAll('style').forEach(e=>{if(e.textContent.includes('#hud,#focus-head'))e.remove()}));
}
await b.close();console.log('Five stations, front/side/top captured:',phase);
