import {type State,type Gas,P0,T0,moles,airGrams,membraneVolume,balloonEquilibrium} from './science.ts';
export type Learning={version:1;done:boolean[];seen:string[][];legacy:boolean};
export const freshLearning=():Learning=>({version:1,done:[false,false,false,false],seen:[[],[],[],[]],legacy:false});
export function restoreLearning(s:State):Learning{
 const raw=(s as State&{learning?:Learning}).learning;
 if(!raw||raw.version!==1)return {...freshLearning(),done:s.solved.map(Boolean),legacy:s.solved.some(Boolean)};
 return {version:1,legacy:!!raw.legacy,done:s.solved.map((v,i)=>v&&raw.done?.[i]===true),seen:s.solved.map((v,i)=>v&&Array.isArray(raw.seen?.[i])?raw.seen[i].filter(x=>typeof x==='string'):[])};
}
export function destination(s:State,l:Learning){const i=s.solved.findIndex((v,i)=>!v||!l.done[i]);return i<0?4:i;}
export function canEnter(s:State,l:Learning,i:number){return i>=0&&i<=destination(s,l);}
export const concepts=['눈에 보이지 않는 공기에도 무게가 있습니다.','기체는 온도가 높아지면 부피가 늘어나고, 낮아지면 줄어듭니다.','같은 기체를 누르면 부피가 줄고, 풍선 바깥 압력이 낮아지면 풍선이 커집니다.','기체는 종류마다 성질과 쓰임새가 다릅니다.'];
export const labNames=['기체의 무게','온도와 부피','압력과 부피','여러 가지 기체','중앙 탈출 장치'];
export const labLabel=(i:number)=>i===4?'중앙 탈출 장치':`0${i+1} ${labNames[i]}`;
export function membraneHeight(t:number){return Math.max(-.026,Math.min(.036,(membraneVolume(t)/.0005-1)*.4));}
export class Review {
 preview:State;seen:Set<string>;targetT=T0;selected:Gas|null=null;feedback='';chosen='';
 original:State;index:number;
 constructor(original:State,index:number,seen:string[]=[]){this.original=original;this.index=index;this.preview=structuredClone(original);this.seen=new Set(seen);this.preview.heat.at='rack';this.preview.heat.t=T0;this.preview.mass.at='scale';if(index===0&&original.mass.baseline!==null)this.preview.mass.n=(original.mass.baseline-35)/.028965/1000;if(index===2){this.preview.press.v=60;this.preview.press.sealed=true;this.preview.press.nOutside=moles(P0,.0053,T0);}if(index===3){this.preview.gases.done={He:false,CO2:false,N2:false,O2:false};this.preview.gases.lift=0;this.preview.gases.flame=1;this.preview.gases.fuel=1;}}
 mark(key:string){this.seen.add(key);}
 mass(which:'before'|'after') {this.chosen=which;this.mark(which);const value=which==='before'?this.original.mass.baseline:this.original.mass.after;if(value!==null)this.preview.mass.n=(value-35)/.028965/1000;this.feedback=which==='before'?'같은 병과 마개 · 공기를 더 넣기 전이에요.':'공기만 더 넣었어요. 저울의 변화와 비교해 보세요.';}
 heavier(which:string){if(!this.seen.has('before')||!this.seen.has('after')){this.feedback='두 병을 먼저 저울에 올려 비교해 보세요.';return false;}if(which!=='after'){this.feedback='병과 마개는 같아요. 공기를 넣은 뒤의 저울을 다시 살펴보세요.';return false;}this.mark('compared');this.feedback=`${((this.original.mass.after??0)-(this.original.mass.baseline??0)).toFixed(2)} g 늘었어요. 병과 마개는 같고, 공기만 더 들어갔어요.`;return true;}
 temperature(t:number){this.targetT=t;this.chosen=t>T0+5?'hot':t<T0-5?'cold':'initial';this.feedback=t>T0+5?'따뜻한 공기 → 고무막이 위로 볼록해져요.':t<T0-5?'차가운 공기 → 고무막이 기준선 아래로 줄어들어요.':'점선은 처음 고무막의 위치예요.';}
 pressure(which:'push'|'vacuum',value:number){if(which==='push'){this.preview.press.v=value;this.preview.press.sealed=true;if(value<=35)this.mark('push');}else{this.preview.press.nOutside=moles(P0*value,.0053,T0);if(value<=.5)this.mark('vacuum');}this.chosen=which;this.feedback=which==='push'?'마개를 닫은 주사기 · 같은 공기를 더 작은 공간에 눌렀어요.':'풍선 바깥 공기를 빼면 바깥 압력이 낮아져 풍선이 커져요.';}
 connect(target:Gas){if(!this.selected){this.feedback='기체 카트리지를 먼저 선택하세요.';return false;}if(target!==this.selected){this.feedback=({O2:'산소는 연료가 아니라 다른 물질이 타는 것을 도와요.',CO2:'이산화 탄소는 불을 끄는 장치에 연결해 보세요.',N2:'질소는 산소와의 접촉을 줄여 식품 보존에 쓰여요.',He:'헬륨은 공기보다 가벼워 풍선을 떠오르게 해요.'})[this.selected];return false;}this.mark(target);const g=this.preview.gases;g.docked=target;g.target=target;g.valve=1;g.amount[target]=4;g.done[target]=true;if(target==='He')g.lift=1;this.feedback='연결 완료 · 장치에서 기체의 쓰임을 확인하세요.';return true;}
 tick(dt:number){this.preview.heat.t+=(this.targetT-this.preview.heat.t)*(1-Math.exp(-dt*3));if(this.index===1){this.preview.heat.max=Math.max(this.preview.heat.max,this.preview.heat.t);if(this.preview.heat.t>T0+12)this.mark('hot');if(this.preview.heat.t<T0-7)this.mark('cold');}}
 get ready(){return this.index===0?this.seen.has('compared'):this.index===1?this.seen.has('hot')&&this.seen.has('cold'):this.index===2?this.seen.has('push')&&this.seen.has('vacuum'):['He','CO2','N2','O2'].every(x=>this.seen.has(x));}
 get value(){return this.index===0?`${(35+airGrams(this.preview.mass.n)).toFixed(2)} g`:this.index===1?`${(this.preview.heat.t-273.15).toFixed(1)} °C · ${(membraneVolume(this.preview.heat.t)*1e6).toFixed(1)} mL`:this.index===2?`주사기 ${this.preview.press.v.toFixed(0)} mL · 풍선 ${(balloonEquilibrium(this.preview.press.nOutside).v*1e6).toFixed(0)} mL`:`${['He','CO2','N2','O2'].filter(x=>this.seen.has(x)).length} / 4 연결`}
}
