import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act,step,moles,pressure,airGrams,P0,T0,membraneVolume,balloonEquilibrium,gasOxygen,type State} from '../src/science.ts';
const advance=(s:State,t:number)=>{for(let i=0;i<t*40;i++)step(s,.025);};
test('500 mL air, 1 → 1.4 atm adds approximately 0.24 g and is capped',()=>{
 const s=fresh(),n=s.mass.n;act(s,{type:'pumpMass'});assert.equal(n,s.mass.n);
 act(s,{type:'bottle',at:'scale'});act(s,{type:'bottle',at:'pump'});
 for(let i=0;i<100;i++)act(s,{type:'pumpMass'});
 const d=airGrams(s.mass.n-n);assert.ok(d>.23&&d<.25);
 assert.ok(Math.abs(pressure(s.mass.n,.0005,T0)/P0-1.4)<1e-10);
 act(s,{type:'bottle',at:'scale'});assert.equal(s.solved[0],true);
});
test('heat membrane responds in both directions; hot-only cannot solve',()=>{
 assert.ok(membraneVolume(T0+30)>.0005);assert.ok(membraneVolume(T0-15)<.0005);
 const s=fresh();act(s,{type:'jar',at:'hot'});advance(s,30);assert.equal(s.heat.hot,true);assert.equal(s.solved[1],false);
 act(s,{type:'jar',at:'cold'});assert.equal(s.heat.at,'hot');
 act(s,{type:'jar',at:'wipe'});act(s,{type:'jar',at:'cold'});advance(s,30);assert.equal(s.solved[1],true);
});
test('closed syringe halves volume and doubles absolute pressure; open cannot solve',()=>{
 const s=fresh();act(s,{type:'piston',v:30});assert.equal(s.press.v,60);advance(s,3);assert.equal(s.press.syringe,false);
 act(s,{type:'seal'});act(s,{type:'piston',v:30});advance(s,2);
 assert.equal(P0*60/s.press.v,2*P0);assert.equal(s.press.syringe,true);assert.equal(s.solved[2],false);
});
test('vacuum removes external gas; finite elastic balloon grows and reverses',()=>{
 const s=fresh(),v0=balloonEquilibrium(s.press.nOutside).v;
 for(let i=0;i<20;i++)act(s,{type:'vacuum'});
 const b=balloonEquilibrium(s.press.nOutside);assert.ok(b.v>v0&&b.v<.0024);assert.ok(b.p<P0);
 act(s,{type:'vent'});assert.ok(Math.abs(balloonEquilibrium(s.press.nOutside).v-v0)<1e-10);
});
test('gas dock mismatch has no magical effects; each gas acts independently',()=>{
 const s=fresh();act(s,{type:'cartridge',gas:'O2'});act(s,{type:'dock',gas:'CO2'});act(s,{type:'gasValve',value:1});advance(s,60);
 assert.equal(s.gases.amount.O2,0);assert.equal(s.gases.done.CO2,false);
 for(const gas of ['He','CO2','N2','O2'] as const){
  act(s,{type:'cartridge',gas});act(s,{type:'dock',gas});act(s,{type:'gasValve',value:1});advance(s,50);
 }
 assert.equal(s.solved[3],true);assert.ok(gasOxygen(s,'N2')<.05);assert.ok(s.gases.fuel<1);
});
test('final needs actual path, gas flow and heat, with gas conservation',()=>{
 const s=fresh();s.solved.fill(true);advance(s,30);assert.equal(s.final.escaped,false);
 const total=s.final.nDrive+s.final.nSupply;
 for(const id of [0,3,1,2])act(s,{type:'port',id});
 act(s,{type:'finalValve',value:1});act(s,{type:'heater'});advance(s,30);assert.equal(s.final.escaped,false);
 s.final.links=[];for(const id of [0,1,2,3])act(s,{type:'port',id});
 advance(s,120);
 assert.ok(Math.abs(s.final.nDrive+s.final.nSupply-total)<1e-12);
 assert.equal(s.final.escaped,true);
});
