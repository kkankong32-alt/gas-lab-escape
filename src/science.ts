import {pinsClear} from './lock-geometry.ts';
/** SI for thermodynamics; display conversions occur at the boundary. */
export const R = 8.314462618, P0 = 101325, T0 = 293.15, AIR_M = .028965;
export const clamp = (x:number,a:number,b:number) => Math.max(a,Math.min(b,x));
export const moles = (p:number,v:number,t:number) => p*v/(R*t);
export const pressure = (n:number,v:number,t:number) => n*R*t/v;
export const airGrams = (n:number) => n*AIR_M*1000;
export function membraneVolume(t:number) {
  // Rubber adds a small restoring pressure, signed for inward deflection.
  const v0=.0005, k=1.6e8, n=moles(P0,v0,T0), b=P0-k*v0;
  return (-b+Math.sqrt(b*b+4*k*n*R*t))/(2*k);
}
export function balloonEquilibrium(outsideMoles:number) {
  const chamber=.006, v0=.0007, inside=moles(P0+4000,v0,T0);
  let lo=.0003, hi=.0024;
  for(let i=0;i<55;i++){
    const v=(lo+hi)/2, pOut=pressure(outsideMoles,chamber-v,T0);
    const elastic=4000+25000*(v/v0-1)+1.2e5*Math.max(0,v/v0-2)**3;
    if(pressure(inside,v,T0)>pOut+elastic)lo=v;else hi=v;
  }
  const v=(lo+hi)/2;
  return {v,p:pressure(outsideMoles,chamber-v,T0)};
}
export type Gas = 'He'|'CO2'|'N2'|'O2';
export type State = ReturnType<typeof fresh>;
export function fresh(){
 return {version:1,elapsed:0,solved:[false,false,false,false],records:[] as {kind:string,before:number,after:number,unit:string}[],
 mass:{n:moles(P0,.0005,T0),at:'rack',baseline:null as number|null,after:null as number|null,strokes:0},
 heat:{t:T0,at:'rack',hot:false,wiped:false,cold:false,max:T0,min:T0},
 press:{sealed:false,v:60,hold:0,syringe:false,nOutside:moles(P0,.0053,T0),vacuum:false,strokes:0},
 gases:{docked:null as Gas|null,target:null as Gas|null,valve:0,amount:{He:0,CO2:0,N2:0,O2:0},done:{He:false,CO2:false,N2:false,O2:false},lift:0,flame:1,fuel:1},
 final:{links:[] as string[],selected:null as number|null,valve:0,heater:false,t:T0,nSupply:moles(P0*1.65,.001,T0),nDrive:moles(P0,.0005,T0),stroke:0,hold:0,open:0,escaped:false},
 hints:[0,0,0,0,0],position:{x:0,z:5,yaw:0,pitch:0}};
}
export type Action =
 {type:'bottle';at:'rack'|'scale'|'pump'}|{type:'pumpMass'}|
 {type:'jar';at:'rack'|'hot'|'wipe'|'cold'}|
 {type:'seal'}|{type:'piston';v:number}|{type:'vacuum'}|{type:'vent'}|
 {type:'cartridge';gas:Gas}|{type:'dock';gas:Gas}|{type:'gasValve';value:number}|
 {type:'port';id:number}|{type:'finalValve';value:number}|{type:'heater'};
export function act(s:State,a:Action):string{
 switch(a.type){
 case 'bottle':
  s.mass.at=a.at;
  if(a.at==='scale'){
   const weight=35+airGrams(s.mass.n);
   if(s.mass.baseline===null){s.mass.baseline=weight;return '처음 무게를 기록했어요. 같은 병과 마개로 비교해 보세요.';}
   s.mass.after=weight;
   if(weight-s.mass.baseline>=.2&&!s.solved[0]){s.solved[0]=true;s.records.push({kind:'같은 병에 공기를 더 넣었을 때',before:s.mass.baseline,after:weight,unit:'g'});return '공기에도 무게가 있어요. 질량 감지 장치가 복구되었습니다.';}
  }return '';
 case 'pumpMass':
  if(s.mass.at!=='pump')return '병을 공기 주입 받침에 먼저 연결하세요.';
  if(s.mass.baseline===null)return '공기를 넣기 전 무게를 먼저 기록해 보세요.';
  s.mass.n=Math.min(moles(P0*1.4,.0005,T0),s.mass.n+moles(P0,.000025,T0));s.mass.strokes++;return '';
 case 'jar':
  if(a.at==='cold'&&s.heat.hot&&!s.heat.wiped)return '집기병을 수건 받침에 놓아 겉면을 닦아 주세요.';
  s.heat.at=a.at;if(a.at==='wipe')s.heat.wiped=true;return '';
 case 'seal':s.press.sealed=!s.press.sealed;if(!s.press.sealed)s.press.v=60;return '';
 case 'piston':s.press.v=s.press.sealed?clamp(a.v,30,60):60;return s.press.sealed?'':'입구가 열려 있으면 공기가 빠져나가요. 마개를 먼저 닫으세요.';
 case 'vacuum':s.press.nOutside=Math.max(moles(P0*.4,.0053,T0),s.press.nOutside*.91);s.press.strokes++;return '';
 case 'vent':s.press.nOutside=moles(P0,.0053,T0);return '외부 공기가 들어오며 풍선이 원래 크기로 돌아갑니다.';
 case 'cartridge':s.gases.docked=a.gas;s.gases.target=null;s.gases.valve=0;return '카트리지를 집었습니다. 사용할 장치의 연결구를 누르세요.';
 case 'dock':
  if(!s.gases.docked)return '표기가 있는 카트리지를 먼저 집으세요.';
  s.gases.target=a.gas;return s.gases.docked===a.gas?'연결되었습니다. 밸브 손잡이를 드래그해 천천히 여세요.':'연결구 규격이 달라 잠기지 않습니다. 카트리지 표기를 살펴보세요.';
 case 'gasValve':s.gases.valve=clamp(a.value,0,1);return '';
 case 'port': {
  if(!s.solved.every(Boolean))return '네 실험실의 안전 회로를 먼저 복구하세요.';
  const f=s.final;
  if(f.selected===null){f.selected=a.id;return '연결관의 다른 끝을 연결할 단자를 누르세요.';}
  if(f.selected===a.id){f.selected=null;return '';}
  const key=[f.selected,a.id].sort().join('-');f.selected=null;
  if(f.links.includes(key))f.links=f.links.filter(x=>x!==key);else {
   const used=f.links.some(x=>x.split('-').some(n=>key.split('-').includes(n)));
   if(used)return '이미 연결된 단자입니다. 연결된 두 단자를 다시 눌러 관을 분리할 수 있어요.';
   f.links.push(key);
  }return '';
 }
 case 'finalValve':s.final.valve=clamp(a.value,0,1);return '';
 case 'heater':s.final.heater=!s.final.heater;return '';
 }
}
export function gasOxygen(s:State,g:'CO2'|'N2'|'O2'){
 const q=s.gases.amount[g];
 return g==='O2'?1-.79*Math.exp(-q):.21*Math.exp(-q);
}
export function step(s:State,dt:number){
 dt=clamp(dt,0,.05);s.elapsed+=dt;
 const h=s.heat,target=h.at==='hot'?328.15:h.at==='cold'?278.15:T0;
 h.t+=(target-h.t)*(1-Math.exp(-dt/5));h.max=Math.max(h.max,h.t);h.min=Math.min(h.min,h.t);
 if(h.at==='hot'&&h.t>315.15)h.hot=true;
 if(h.hot&&h.wiped&&h.at==='cold'&&h.t<288.15&&!h.cold){
  h.cold=true;s.solved[1]=true;s.records.push({kind:'가열 → 냉각한 집기병 속 공기',before:membraneVolume(h.max)*1e6,after:membraneVolume(h.t)*1e6,unit:'mL (모형 계산)'});
 }
 const p=s.press,pk=P0*60/p.v/1000;
 p.hold=p.sealed&&pk>=190&&pk<=205?p.hold+dt:0;
 if(p.hold>1.5)p.syringe=true;
 const b=balloonEquilibrium(p.nOutside);
 if(b.v>=.00105)p.vacuum=true;
 if(p.syringe&&p.vacuum&&!s.solved[2]){
  s.solved[2]=true;s.records.push({kind:'같은 공기량을 60 → 30 mL로 압축',before:P0/1000,after:pk,unit:'kPa (절대압력)'});
  s.records.push({kind:'진공 용기의 풍선',before:700,after:b.v*1e6,unit:'mL (탄성 모형)'});
 }
 const g=s.gases;
 if(g.docked&&g.target===g.docked&&g.valve>0){
  const key=g.docked;g.amount[key]=Math.min(key==='He'?1:4,g.amount[key]+dt*g.valve*.18);if(key==='He'&&g.amount.He>=1)g.valve=0;
 }
 // Helium lift: density difference, minus envelope and payload, 6 L maximum.
 const heV=.006*clamp(g.amount.He,0,1),net=(1.204-.166)*heV-.005;
 g.lift=clamp(g.lift+net*dt*100,0,1);
 if(g.lift>=.99)g.done.He=true;
 if(gasOxygen(s,'CO2')<.145){g.done.CO2=true;g.flame=0;}
 if(gasOxygen(s,'N2')<.05)g.done.N2=true;
 if(gasOxygen(s,'O2')>.34&&g.fuel>0)g.done.O2=true;
 if(g.target==='O2'&&g.docked==='O2'&&g.valve>0)g.fuel=Math.max(0,g.fuel-dt*.003);
 if(Object.values(g.done).every(Boolean)&&!s.solved[3]){
  s.solved[3]=true;s.records.push({kind:'질소 치환 후 포장 내부 산소',before:21,after:gasOxygen(s,'N2')*100,unit:'%'});
 }
 const f=s.final;
 if(!s.solved.every(Boolean))return;
 f.t+=((f.heater?338.15:T0)-f.t)*(1-Math.exp(-dt/8));
 const connected=f.links.includes('0-1')&&f.links.includes('2-3');
 const vDrive=.0005+f.stroke*.00012;
 const ps=pressure(f.nSupply,.001,T0),pd=pressure(f.nDrive,vDrive,f.t);
 if(connected&&f.valve>0){
  const flow=clamp((ps-pd)*1.4e-8*f.valve*dt,-f.nDrive*.01,f.nSupply*.01);
  f.nSupply-=flow;f.nDrive+=flow;
 }
 // A spring-loaded piston: atmospheric load + increasing spring load.
 const forceTarget=clamp((pd-P0-18000)/18000,0,1);
 f.stroke+=(forceTarget-f.stroke)*(1-Math.exp(-dt*2));
 f.hold=connected&&f.t>315.15&&f.stroke>.88&&pinsClear(f.stroke)?f.hold+dt:0;
 if(f.hold>2||f.open>0)f.open=Math.min(1,f.open+dt/7);
 if(f.open===1)f.escaped=true;
}
export function resetStation(s:State,i:number){
 const n=fresh();
 if(i===0)s.mass=n.mass;
 if(i===1)s.heat=n.heat;
 if(i===2)s.press=n.press;
 if(i===3)s.gases=n.gases;
 if(i===4)s.final=n.final;
 // Preserve earned safety circuits and observations; experiments remain repeatable.
}
