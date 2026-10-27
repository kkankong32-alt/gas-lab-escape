import {PressureGauge,rigidTube} from './gauges';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const steel=new T.MeshStandardMaterial({color:0x9cafb8,metalness:.85,roughness:.26});
const dark=new T.MeshStandardMaterial({color:0x18313e,metalness:.65,roughness:.36});
const enamel=new T.MeshStandardMaterial({color:0xdce7e6,metalness:.3,roughness:.3});
const copper=new T.MeshStandardMaterial({color:0xbd8061,metalness:.82,roughness:.26});
const mint=new T.MeshStandardMaterial({color:0x75c7bd,metalness:.45,roughness:.25});
function mesh(g:T.BufferGeometry,m:T.Material,p:T.Object3D,x=0,y=0,z=0,name=''){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function lathe(p:T.Object3D,profile:number[][],m:T.Material,x=0,y=0,z=0,name=''){return mesh(new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),64),m,p,x,y,z,name);}
function ring(p:T.Object3D,r:number,t:number,x:number,y:number,z:number,m:T.Material=steel){const o=mesh(new T.TorusGeometry(r,t,12,64),m,p,x,y,z);o.rotation.x=Math.PI/2;return o;}
function base(g:T.Group,w=.64,d=.5){mesh(new RoundedBoxGeometry(w,.07,d,4,.025),dark,g,0,.035);for(const x of [-w*.4,w*.4])for(const z of [-d*.35,d*.35])mesh(new T.CylinderGeometry(.018,.018,.012,6),steel,g,x,.077,z);}
export function instrument(kind:'valve'|'tank'|'heater'|'actuator'|'balance'){
 const g=new T.Group();g.name='crafted-'+kind;
 if(kind==='valve'){
  base(g,.44,.32);lathe(g,[[0,0],[.07,0],[.085,.03],[.085,.13],[.055,.16],[.055,.22],[0,.22]],copper,0,.07);
  lathe(g,[[0,0],[.018,0],[.018,.19],[0,.19]],steel,0,.24);
  const wheel=new T.Group();wheel.name='valveWheel';wheel.position.y=.43;g.add(wheel);ring(wheel,.14,.016,0,0,0,mint);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const spoke=mesh(new RoundedBoxGeometry(.12,.012,.018,2,.006),mint,wheel,Math.cos(a)*.065,0,Math.sin(a)*.065);spoke.rotation.y=-a;}
  mesh(new T.CylinderGeometry(.032,.032,.025,6),steel,wheel);for(const x of [-.13,.13]){const o=lathe(g,[[0,-.065],[.035,-.065],[.035,-.012],[.055,0],[.055,.04],[.045,.05],[.045,.09],[0,.09]],steel,x,.15);o.rotation.z=-Math.sign(x)*Math.PI/2;}
 }else if(kind==='tank'){
  base(g,.54,.48);lathe(g,[[0,0],[.14,0],[.19,.045],[.2,.12],[.2,.51],[.19,.57],[.13,.64],[.055,.66],[.055,.73],[0,.73]],enamel,0,.075);
  for(const y of [.19,.53])ring(g,.202,.018,0,y,0,dark);lathe(g,[[0,0],[.07,0],[.07,.04],[0,.04]],steel,0,.805);ring(g,.035,.008,0,.865,0,mint);
  const gauge=new PressureGauge(250,.12);gauge.position.set(0,.61,.28);gauge.name='tank-pressure';g.add(gauge);
 }else if(kind==='heater'){
  base(g,.62,.54);lathe(g,[[0,0],[.18,0],[.21,.035],[.21,.1],[.17,.12],[.17,.5],[.21,.52],[.21,.56],[0,.56]],steel,0,.08,0,'heater-pressure-vessel');
  lathe(g,[[.174,0],[.174,.36]],new T.MeshPhysicalMaterial({color:0x7faeaf,roughness:.18,metalness:.2,transparent:true,opacity:.65,side:T.DoubleSide}),0,.2,0,'heater-insulating-cover');
  const points=Array.from({length:241},(_,i)=>{const a=i/240*Math.PI*12;return new T.Vector3(Math.cos(a)*.195,.22+i/240*.31,Math.sin(a)*.195);});mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),240,.012,8,false),copper,g,0,0,0,'electric-heating-element');
  for(const y of [.22,.53]){const insulator=mesh(new T.CylinderGeometry(.026,.026,.07,24),enamel,g,.265,y,0,'ceramic-terminal');insulator.rotation.z=Math.PI/2;g.add(rigidTube(new T.Vector3(.195,y,0),new T.Vector3(.30,y,0),.009,copper));}
  // Hidden behind the sealed shell in normal play; section views expose the real internal manifold.
  const inner=new T.Group();inner.name='heater-internal-gas-path';g.add(inner);
  for(const side of [-1,1]){inner.add(rigidTube(new T.Vector3(side*.21,.13,0),new T.Vector3(side*.08,.13,0),.016,steel));inner.add(rigidTube(new T.Vector3(side*.08,.13,0),new T.Vector3(side*.08,.30,0),.016,steel));}
  const volume=mesh(new T.CylinderGeometry(.135,.135,.29,48),new T.MeshPhysicalMaterial({color:0x75cbd7,transparent:true,opacity:.30,roughness:.3,depthWrite:false}),inner,0,.385,0,'heated-gas-volume');volume.userData.explanation='밀폐 공기 공간 · 전열선은 바깥에서 벽을 데움';
  for(const y of [.18,.58])ring(g,.21,.016,0,y,0);const button=mesh(new T.CylinderGeometry(.045,.045,.018,32),mint,g,0,.085,.2);button.name='heatSwitch';
 }else if(kind==='actuator'){
  base(g,.64,.56);lathe(g,[[0,0],[.2,0],[.23,.035],[.23,.08],[.17,.11],[.17,.50],[.22,.53],[.22,.57],[.063,.57],[.063,.53],[.158,.50],[.158,.12],[0,.12]],dark,0,.08);
  lathe(g,[[.177,0],[.177,.35]],steel,0,.2);lathe(g,[[.063,0],[.085,0],[.085,.045],[.063,.045],[.063,0]],steel,0,.65,0,'rod-seal-gland');for(const y of [.17,.60])ring(g,.2,.018,0,y,0);
  for(const x of [-.22,.22])for(const z of [-.17,.17])lathe(g,[[0,0],[.012,0],[.012,.48],[0,.48]],steel,x,.12,z);
  lathe(g,[[0,0],[.06,0],[.06,.58],[0,.58]],steel,0,.22,0,'actuatorRod');mesh(new RoundedBoxGeometry(.4,.07,.32,4,.02),mint,g,0,.8,0,'actuatorHead');mesh(new T.CylinderGeometry(.158,.158,.025,48),dark,g,0,.22,0,'actuatorPiston');
  mesh(new RoundedBoxGeometry(.5,.09,.36,4,.015),enamel,g,0,1.5);for(const x of [-.27,.27])mesh(new RoundedBoxGeometry(.045,1.45,.06,2,.01),dark,g,x,.80,-.14);
 }else{
  base(g,.75,.55);mesh(new RoundedBoxGeometry(.7,.13,.49,5,.04),enamel,g,0,.13);lathe(g,[[0,0],[.22,0],[.25,.02],[.25,.035],[0,.035]],steel,0,.215,-.035);
  const screen=mesh(new RoundedBoxGeometry(.3,.035,.11,3,.012),dark,g,0,.207,.16);screen.rotation.x=.16;for(const x of [-.23,.23])mesh(new T.CylinderGeometry(.018,.018,.012,24),mint,g,x,.206,.16);
 }
 return g;
}
