import {type State,type Action,pressure} from './science.ts';
export function finalStage(s:State){const f=s.final;if(f.links.some(x=>x!=='0-1'&&x!=='2-3'))return 0;if(!f.links.includes('0-1'))return 1;if(!f.links.includes('2-3'))return 2;if(f.valve<.05)return 3;if(!f.heater)return 4;return 5;}
export function finalPressure(s:State){return pressure(s.final.nDrive,.0005+s.final.stroke*.00012,s.final.t)/1000;}
/** Input sequencing only. Thermodynamics and success remain in science.ts. */
export function finalGuard(s:State,a:Action):string|null{
 const stage=finalStage(s);
 if(a.type==='port'&&stage!==0){
  const pair=stage===1?[0,1]:stage===2?[2,3]:[];
  if(!pair.includes(a.id))return stage>2?'두 연결이 완성됐어요. 이제 공급 밸브와 가열 장치를 조작하세요.':'아직 이 연결 차례가 아니에요. 밝게 표시된 두 연결구를 살펴보세요.';
  if(s.final.selected===null&&a.id!==pair[0])return '공기가 나오는 출구를 먼저 선택하고, 다음 장치의 입구에 연결하세요.';
 }
 if((a.type==='finalValve'||a.type==='heater')&&stage<3)return '연결관 두 개를 먼저 완성해야 공기가 장치까지 흐를 수 있어요.';
 if(a.type==='heater'&&stage===3)return '공급 밸브를 먼저 열어 공기가 들어오게 해 주세요.';
 return null;
}
