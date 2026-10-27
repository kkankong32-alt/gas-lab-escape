import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act,step,resetStation} from '../src/science.ts';
import {guidance,nextLab,interaction} from '../src/guidance.ts';

test('mass guide follows saved physical progress, including wrong placements and repeated weighing',()=>{
 const s=fresh();
 assert.equal(guidance(s,0,null).target,'bottle');
 assert.equal(guidance(s,0,'bottle').target,'mass-scale');
 act(s,{type:'bottle',at:'pump'});
 assert.equal(guidance(s,0,null).key,'pickup','Premature pump placement still asks for baseline');
 act(s,{type:'bottle',at:'scale'});
 act(s,{type:'bottle',at:'scale'});
 assert.equal(guidance(s,0,null).key,'lift','Repeated equal weights do not imply completion');
 const restored=JSON.parse(JSON.stringify(s));
 assert.equal(guidance(restored,0,'bottle').target,'mass-dock');
 act(restored,{type:'bottle',at:'pump'});
 assert.equal(guidance(restored,0,null).key,'pump');
 assert.equal(guidance(restored,0,'bottle').key,'redock');
 for(let i=0;i<8;i++)act(restored,{type:'pumpMass'});
 assert.equal(guidance(restored,0,null).key,'return');
 assert.equal(guidance(restored,0,'bottle').key,'compare');
 act(restored,{type:'bottle',at:'scale'});
 assert.equal(guidance(restored,0,null).key,'complete');
 resetStation(restored,0);
 assert.equal(restored.solved[0],true,'Earned circuit persists');
 assert.equal(guidance(restored,0,null).key,'pickup','Reset apparatus can be explored again');
});
test('heat guide requires observation and drying before cooling',()=>{
 const s=fresh();
 act(s,{type:'jar',at:'hot'});
 assert.equal(guidance(s,1,null).key,'warming');
 assert.equal(guidance(s,1,'jar').target,'heat-hot');
 for(let i=0;i<500;i++)step(s,.05);
 assert.equal(guidance(s,1,null).key,'wipe');
 act(s,{type:'jar',at:'cold'});
 assert.equal(s.heat.at,'hot','Engine rejects skipping towel');
 act(s,{type:'jar',at:'wipe'});
 assert.equal(guidance(s,1,null).key,'cold');
 act(s,{type:'jar',at:'cold'});
 assert.equal(guidance(s,1,null).key,'cooling');
 assert.equal(guidance(s,1,'jar').target,'heat-cold');
});
test('pressure, gas mismatch, and final wiring guidance respond without granting success',()=>{
 const s=fresh();
 assert.equal(guidance(s,2,null).target,'seal');
 act(s,{type:'seal'});
 assert.equal(guidance(s,2,null).target,'piston');
 act(s,{type:'cartridge',gas:'N2'});act(s,{type:'dock',gas:'O2'});
 assert.equal(guidance(s,3,null).target,'dock-N2');
 assert.equal(guidance(s,4,null).key,'locked');
 s.solved.fill(true);
 act(s,{type:'port',id:0});act(s,{type:'port',id:3});
 assert.equal(guidance(s,4,null).key,'wrong-link');
 assert.equal(nextLab(s),4);
 assert.equal(s.final.escaped,false);
});
test('guidance is read-only for every laboratory and inventory state',()=>{
 const s=fresh(),before=JSON.stringify(s);
 for(let i=0;i<5;i++)for(const carry of [null,'bottle','jar'])guidance(s,i,carry);
 assert.equal(JSON.stringify(s),before);
});

test('pump phase never asks to pick up a connected bottle; final stroke stops repetition',()=>{
 const s=fresh();act(s,{type:'bottle',at:'scale'});act(s,{type:'bottle',at:'pump'});
 for(const id of ['bottle','mass-dock','mass-scale','mass-rack'])assert.doesNotMatch(interaction(s,0,null,id),/집기|놓기|먼저/);
 assert.match(interaction(s,0,null,'mass-pump'),/위아래로 드래그/);
 for(let j=0;j<8;j++)act(s,{type:'pumpMass'});
 assert.equal(guidance(s,0,null).key,'return');
 assert.equal(interaction(s,0,null,'mass-pump'),'공기 주입 완료');
 assert.match(interaction(s,0,null,'bottle'),/클릭하여 집기/);
 act(s,{type:'bottle',at:'scale'});
 for(const id of ['bottle','mass-dock','mass-scale','mass-rack','mass-pump'])assert.doesNotMatch(interaction(s,0,null,id),/클릭|드래그|먼저/);
});
test('completed substeps remain descriptive when later experiments are in progress',()=>{
 const s=fresh();act(s,{type:'seal'});s.press.syringe=true;
 assert.equal(interaction(s,2,null,'seal'),'주사기 마개 · 닫힘');
 assert.equal(interaction(s,2,null,'piston'),'주사기 · 측정 완료');
 s.gases.done.He=true;s.gases.docked='He';s.gases.target='He';s.gases.valve=1;
 assert.match(interaction(s,3,null,'cart-He'),/관찰 완료/);
 assert.match(interaction(s,3,null,'dock-He'),/관찰 완료/);
 s.heat.hot=true;assert.doesNotMatch(interaction(s,1,'jar','heat-hot'),/클릭하여 놓기/);s.heat.wiped=true;assert.doesNotMatch(interaction(s,1,'jar','heat-wipe'),/클릭하여 놓기/);
 s.solved.fill(true);s.final.heater=true;
 assert.equal(interaction(s,4,null,'heater'),'온도 장치 · 가열 중');
});
