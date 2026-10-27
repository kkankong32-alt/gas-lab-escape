import * as T from 'three';
import {ConnectionNetwork,type Port,type Line} from './connection-network';
import {rigidTube} from './gauges';
import type {World} from './world';
import {pressure,T0,type State,type Gas} from './science';
const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const steel=new T.MeshStandardMaterial({color:0xaabec6,metalness:.85,roughness:.26});
const gases:Gas[]=['He','CO2','N2','O2'];
export class ApparatusConnections{
 networks:ConnectionNetwork[];mass!:Line;vacuum!:Line;syringe!:Line;vacuumGauge!:Line;gasLines:Line[][]=[];nozzle=new T.Group();heliumNozzle=new T.Group();heliumRelease=0;withdraw=0;finalLinks:Line[]=[];spring!:T.Mesh<T.TubeGeometry>;springStroke=-1;flowDots:{dot:T.Mesh;line:Line;station:number}[]=[];electrics:Line[]=[];gasPorts:Port[]=[];
 constructor(public w:World){
  this.networks=w.stations.map(g=>new ConnectionNetwork(g));const find=(i:number,id:string)=>w.inspectionObjects.find(o=>o.station===i&&o.id===id)!.object;
  let n=this.networks[0],pump=find(0,'pump');
  // Original pump has a separate vertical socket; this manifold joins it to the barrel.
  pump.add(rigidTube(V(.048,.075,0),V(.105,.075,0),.018));
  this.mass=n.connect('pump-to-bottle',n.port('pump.discharge',pump,[.105,.095,0],[0,1,0],.012,.025),n.port('bottle.check-valve',w.bottle,[0,.289,0],[0,1,0],.009,.02),[[1.15,1.3,.36],[.55,1.8,.36]],true,.014);
  w.massHose.removeFromParent();w.massHose=this.mass.mesh;
  n=this.networks[2];const chamber=find(2,'chamber'),vp=find(2,'pump');vp.add(rigidTube(V(.048,.075,0),V(.105,.075,0),.018));
  const outlet=n.port('vacuum.lid-outlet',chamber,[.12,.48,0],[0,1,0],.015,.03),inlet=n.port('vacuum-pump.suction',vp,[.105,.095,0],[0,1,0],.016,.025);
  this.vacuum=n.connect('chamber-to-vacuum-pump',outlet,inlet,[[.78,1.95,.22],[1.5,1.5,.25]]);w.pressureHose.removeFromParent();w.pressureHose=this.vacuum.mesh;
  // Exhaust is a separate open, filtered port, not the continuation of the suction hose.
  const exhaust=n.port('vacuum-pump.exhaust-to-room',vp,[-.085,.075,0],[-1,0,0],.015,.04);vp.add(rigidTube(V(-.048,.075,0),V(-.085,.075,0),.018));
  const filter=new T.Mesh(new T.CylinderGeometry(.019,.019,.04,24),new T.MeshStandardMaterial({color:0xa38c65,roughness:.9,metalness:.3}));filter.rotation.z=Math.PI/2;filter.position.set(-.102,.075,0);vp.add(filter);exhaust.node.userData.boundary='open-to-atmosphere';w.label('흡입',.115,.14,.065,.16,vp,'#a7ede2',90);w.label('배출',-.115,.14,.065,.16,vp,'#f6cf92',90);
  w.gauges[0].position.set(-.57,1.50,.26);w.gauges[1].position.set(.208,2.13,.33);
  w.pressureFittings.forEach(o=>o.removeFromParent());w.pressureFittings=[];
  this.syringe=n.connect('syringe-pressure-measurement',n.port('syringe.measurement',w.syringe,[.043,.16,0],[1,0,0],.012,.02),n.port('syringe-gauge.stem',w.gauges[0],[0,-.215,0],[0,-1,0],.018,.025),[[-.73,1.194,.26]],false,.018,steel);
  this.vacuumGauge=n.connect('lid-sealed-measurement',n.port('vacuum.sealed-measurement',chamber,[-.12,.455,.06],[0,1,0],.014,.04),n.port('vacuum-gauge.stem',w.gauges[1],[0,-.23,0],[0,-1,0],.018,.025),[[.208,1.82,.096],[.208,1.82,.33]],false,.018,steel);
  w.vacuumFlow.forEach(o=>o.userData.curve=this.vacuum.curve);
  const arrow=new T.ArrowHelper(V(-1,0,0),V(1.12,1.095,.14),.2,0xb4e5dc,.05,.025);arrow.name='pump-exhaust-direction';w.stations[2].add(arrow);exhaust.node.userData.arrow=arrow;
  n=this.networks[3];
  this.heliumNozzle.name='helium-retracting-fill-head';this.heliumNozzle.position.set(-1.65,1.29,-.3);w.stations[3].add(this.heliumNozzle);
  this.heliumNozzle.add(rigidTube(V(0,-.06,0),V(0,0,0),.009,steel));this.heliumNozzle.add(rigidTube(V(0,-.06,0),V(.12,-.06,0),.012,steel));
  // Side carriage keeps the line above, and outside, the payload/metal base.
  w.stations[3].add(rigidTube(V(-1.30,1.05,-.3),V(-1.30,1.23,-.3),.016,steel));
  this.heliumNozzle.add(rigidTube(V(.12,-.06,0),V(.35,-.06,0),.013,steel));
  this.nozzle.name='retractable-nitrogen-nozzle';this.nozzle.position.set(.55,1.58,-.3);w.stations[3].add(this.nozzle);
  this.nozzle.add(rigidTube(V(0,-.13,0),V(0,.035,0),.012,steel));
  const nozzlePort=n.port('nitrogen.nozzle-inlet',this.nozzle,[0,.045,0],[0,1,0],.014,.02);
  // Rear support carries the retracting nozzle and the sealer; no unsupported floating tube.
  const support=w.stations[3];support.add(rigidTube(V(.79,1.04,-.43),V(.79,1.96,-.43),.018,steel));this.nozzle.add(rigidTube(V(0,0,0),V(.24,0,-.13),.009,steel));const sleeve=new T.Mesh(new T.LatheGeometry([[.021,-.045],[.032,-.045],[.032,.045],[.021,.045],[.021,-.045]].map(([r,y])=>new T.Vector2(r,y)),32),steel);sleeve.position.set(.24,0,-.13);this.nozzle.add(sleeve);
  for(let i=0;i<4;i++){
   const x=-1.65+i*1.1,cart=w.cartridges[i],a=n.port(gases[i]+'.regulator',cart,[0,.382,-.038],[0,0,-1],.018,.035);
   const vi=n.port(gases[i]+'.valve-in',w.valves[0],[-.22,.15,0],[-1,0,0],.026,.045),vo=n.port(gases[i]+'.valve-out',w.valves[0],[.22,.15,0],[1,0,0],.026,.045);vi.node.visible=vo.node.visible=false;
   let endpoint:Port;
   if(i===2)endpoint=nozzlePort;
   else if(i===0)endpoint=n.port('helium.fill-nozzle',this.heliumNozzle,[.12,-.06,0],[1,0,0],.012,.025);
   else{const cells=w.inspectionObjects.filter(o=>o.station===3&&o.id==='cell');const cell=cells[i].object;const old=cell.getObjectByName('Inlet fitting')||cell.getObjectByName('Inlet_fitting');if(old)old.visible=false;
    // Horizontal bulkhead enters the glass wall; inner diffuser directs gas under the flame.
    cell.add(rigidTube(V(.16,.14,0),V(.25,.14,0),.018,steel));cell.add(rigidTube(V(.16,.14,0),V(.10,.10,0),.012,steel));
    endpoint=n.port(gases[i]+'.cell-inlet',cell,[.25,.14,0],[1,0,0],.019,.045);}
   const supply=n.connect(gases[i]+'-cylinder-to-valve',a,vi,[[x,1.32,.23],[x+.09,1.145,.08]],true,.013);
   const delivery=n.connect(gases[i]+'-valve-to-device',vo,endpoint,i===2?[[x+.65,1.4,-.08],[x+.37,1.95,-.22]]:i===0?[[x+.64,1.28,-.14],[x+.42,1.32,-.46]]:[[x+.66,1.19,-.12],[x+.43,1.15,-.30]],true,.013);
   supply.mesh.visible=delivery.mesh.visible=false;this.gasLines.push([supply,delivery]);
  }
  n=this.networks[4];const tank=find(4,'supply-tank'),heater=find(4,'heater-vessel'),actuator=w.actuator,valve=w.valves[1];
  valve.rotation.y=Math.PI;
  n.connect('tank-sealed-pressure-measurement',n.port('tank.measurement',tank,[0,.38,.23],[0,0,1],.022,.04),n.port('tank-gauge.stem',w.gauges[2],[0,-.23,0],[0,-1,0],.022,.025),[],false,.018,steel);
  const tankOutlet=n.port('tank.outlet',tank,[0,.865,0],[0,1,0],.025,.04),valveIn=n.port('supply-valve.in',valve,[-.22,.15,0],[-1,0,0],.026,.04),valveOut=n.port('supply-valve.out',valve,[.22,.15,0],[1,0,0],.026,.04);
  n.connect('tank-through-supply-valve',tankOutlet,valveIn,[[-.70,1.99,.08],[-.52,1.30,.5]],false,.018);
  const front:Port[]=[],rear:Port[]=[];
  for(let i=0;i<4;i++){const port=w.hits.find(h=>h.id==='port-'+i)!.object;front.push(n.port('coupler-'+i+'.plug',port,[0,.04,0],[0,1,0],.027,.04));rear.push(n.port('coupler-'+i+'.rear',port,[0,.02,-.065],[0,0,-1],.022,.06));port.add(rigidTube(V(0,.02,0),V(0,.02,-.065),.028,steel));}
  n.connect('valve-to-coupler-0',valveOut,rear[0],[[-1.3,1.15,.43]],false,.018);
  n.connect('coupler-1-to-heater-in',rear[1],n.port('heater.gas-in',heater,[-.21,.13,0],[-1,0,0],.022,.045),[[-.45,1.15,.35],[-.46,1.135,-.08]],false,.018);
  n.connect('heater-out-to-coupler-2',n.port('heater.gas-out',heater,[.21,.13,0],[1,0,0],.022,.045),rear[2],[[.46,1.135,-.08],[.46,1.15,.35]],false,.018);
  n.connect('coupler-3-to-drive',rear[3],n.port('actuator.gas-in',actuator,[0,.30,.177],[0,0,1],.022,.04),[[1.3,1.20,.36],[1.08,1.30,.28]],false,.018);
  const gauge=w.gauges[3];n.connect('drive-sealed-pressure-measurement',n.port('actuator.measurement',actuator,[.177,.24,0],[1,0,0],.02,.035),n.port('drive-gauge.stem',gauge,[0,-.23,0],[0,-1,0],.02,.025),[[1.4,1.245,-.08],[1.4,1.18,.24]],false,.018,steel);
  for(const [a,b] of [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]])this.finalLinks.push(n.connect(`student-${a}-${b}`,front[a],front[b],[[[-1.3,-.32,.32,1.3][a],1.28,.83],[[-1.3,-.32,.32,1.3][b],1.28,.83]],false,.027,steel));
  for(const [i,y] of [.22,.53].entries()){const e=n.port('heater.electric-terminal-'+i,heater,[.30,y,0],[1,0,0],.009,.02,'electric'),c=n.port('heater.controller-'+i,heater,[.23,.11,.18+i*.055],[0,1,0],.009,.025,'electric');this.electrics.push(n.connect('insulated-power-lead-'+i,c,e,[[.34,1.25,.20+i*.055],[.35,1.005+y,.12]],false,.007,new T.MeshStandardMaterial({color:i?0xd79758:0x243c47,roughness:.7})));}
  const springPts=Array.from({length:97},(_,i)=>V(Math.cos(i/96*Math.PI*12)*.10,i/96,Math.sin(i/96*Math.PI*12)*.10));this.spring=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(springPts),96,.002,8,false),steel);this.spring.name='actuator-return-spring';actuator.add(this.spring);
  this.gasPorts=front;
  for(const station of [3,4])for(const line of this.networks[station].lines){if(line.a.medium!=='gas'||line.id.includes('measurement'))continue;const dot=new T.Mesh(new T.SphereGeometry(.018,12,8),new T.MeshBasicMaterial({color:0x96f3e5}));this.networks[station].root.add(dot);this.flowDots.push({dot,line,station});}

 }
 update(s:State,dt:number,focus:number|null){const w=this.w,selected=s.gases.docked===s.gases.target?s.gases.target:null;
  this.mass.mesh.visible=s.mass.at==='pump';this.vacuum.mesh.visible=focus!==2||w.pressureView!=='push';this.syringe.mesh.visible=w.gauges[0].visible;this.vacuumGauge.mesh.visible=w.gauges[1].visible;
  this.networks[2].ports.forEach(p=>{p.node.visible=p.id.startsWith('syringe')?w.gauges[0].visible:w.gauges[1].visible;});
  this.heliumRelease+=(Number(s.gases.amount.He>=1)-this.heliumRelease)*Math.min(1,dt*9);this.heliumNozzle.position.x=-1.65+this.heliumRelease*.20;this.heliumNozzle.visible=selected==='He';
  this.withdraw+=(Number(w.packSealed)-this.withdraw)*Math.min(1,dt*3);this.nozzle.position.y=1.58+this.withdraw*.30;this.nozzle.visible=selected==='N2';
  w.sealMotion=Math.max(0,(this.withdraw-.80)/.20);w.snackSeam.visible=w.sealMotion>.9;if(Array.isArray(w.bagSkin.material))(w.bagSkin.material[2] as T.MeshStandardMaterial).opacity=w.sealMotion>.9?1:0;w.sealer.children.forEach(o=>o.position.z=o.userData.side*(.13-.101*w.sealMotion));
  this.gasLines.forEach((pair,i)=>{const active=selected===gases[i];for(const l of pair){l.mesh.visible=active;for(const p of [l.a,l.b])if(p.id.includes('valve'))p.node.visible=active;}});
  if(selected){const x=-1.65+gases.indexOf(selected)*1.1;w.valves[0].position.set(x+.38,1.015,-.08);w.valves[0].scale.setScalar(.75);}
  for(const n of this.networks)for(const l of n.lines)if(l.dynamic&&l.mesh.visible)n.refresh(l);
  this.finalLinks.forEach(l=>l.mesh.visible=s.final.links.includes(l.id.replace('student-','')));
  if(Math.abs(this.springStroke-s.final.stroke)>.003){this.springStroke=s.final.stroke;const bottom=.235+s.final.stroke*.38,h=.41-s.final.stroke*.38;this.spring.position.y=bottom;this.spring.scale.y=h;}
  w.pipes.children.forEach(o=>o.visible=false);
  const delta=pressure(s.final.nSupply,.001,T0)-pressure(s.final.nDrive,.0005+s.final.stroke*.00012,s.final.t),linked=s.final.links.includes('0-1')&&s.final.links.includes('2-3');
  for(const {dot,line,station} of this.flowDots){dot.visible=line.mesh.visible&&(station===4?linked&&s.final.valve>0&&Math.abs(delta)>50:s.gases.valve>0&&!(selected==='N2'&&w.packSealed));const t=(s.elapsed*.4)%1;dot.position.copy(line.curve.getPoint(station===4&&delta<0?1-t:t));}

 }
 audit(){return this.networks.flatMap((n,station)=>n.audit().map(r=>({station:station+1,...r})));}
}
