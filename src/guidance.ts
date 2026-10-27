import {finalStage} from './finale.ts';
import {airGrams, type State, type Gas} from './science.ts';

export type Guide = {key:string; title:string; detail:string; target?:string; phase:number; total:number};
const guide=(key:string,title:string,detail:string,target:string|undefined,phase:number,total:number):Guide=>({key,title,detail,target,phase,total});
export const objectives=[
 '제1실험실에서 공기의 무게를 확인하세요',
 '제2실험실에서 따뜻해진 공기를 관찰하세요',
 '제3실험실에서 공기를 눌러 보세요',
 '제4실험실에서 기체의 쓰임을 알아보세요',
 '중앙 장치에 기체가 흐르는 길을 연결하세요'
];
export function nextLab(s:State){const i=s.solved.findIndex(x=>!x);return i<0?4:i;}
/** Guidance reads physical state. It never grants progress or changes a success condition. */
export function guidance(s:State,i:number,carry:string|null,observed?:Partial<Record<Gas,boolean>>):Guide{
 const pending=i===3&&observed&&s.gases.docked&&s.gases.done[s.gases.docked]&&!observed[s.gases.docked];
 if(pending)return guide('confirm-observation','변화를 충분히 보았나요?','관찰 완료를 누르면 다음 기체를 살펴볼 수 있어요.',undefined, Object.values(observed!).filter(Boolean).length+1,4);
 const completed=[s.mass.after!==null&&s.mass.baseline!==null&&s.mass.after-s.mass.baseline>=.2,s.heat.cold,s.press.syringe&&s.press.vacuum,Object.values(s.gases.done).every(Boolean)];
 if(i<4&&s.solved[i]&&completed[i]&&(i!==3||!observed||Object.values(observed).every(Boolean)))return guide('complete',s.solved.every(Boolean)?'실험 성공! 중앙 장치로 가세요':'실험 성공! 다음 실험실로 가세요',[
  `같은 병: ${s.mass.baseline?.toFixed(2)} → ${s.mass.after?.toFixed(2)} g. 공기에도 무게가 있어요.`,
  '따뜻한 공기는 팽창하고, 차가운 공기는 수축해요.',
  '공기를 누르면 부피가 줄고, 바깥 압력이 낮아지면 풍선은 커져요.',
  '기체마다 성질과 쓰임이 달라요. 네 실험을 마치면 중앙 장치를 사용할 수 있어요.'
 ][i],undefined,1,1);
 if(i===0){
  const m=s.mass;
  if(m.baseline===null)return carry==='bottle'
   ?guide('weigh','페트병을 저울 위에 놓으세요','빛나는 저울 받침을 클릭하세요.','mass-scale',2,6)
   :guide('pickup','페트병을 클릭해 집어 보세요','가운데 페트병을 한 번 클릭하세요.','bottle',1,6);
  const enough=35+airGrams(m.n)-m.baseline>=.2;
  if(enough)return carry==='bottle'
   ?guide('compare','병을 다시 저울에 올려 무게를 비교하세요','왼쪽 저울 받침을 클릭하세요.','mass-scale',6,6)
   :guide('return','공기를 넣은 페트병을 집으세요','페트병을 클릭한 뒤 저울로 옮겨 보세요.','bottle',5,6);
  if(m.at!=='pump')return carry==='bottle'
   ?guide('dock','병을 공기 주입 장치로 옮기세요','오른쪽 펌프 옆의 둥근 받침을 클릭하세요.','mass-dock',3,6)
   :guide('lift','무게를 잰 페트병을 다시 집으세요','같은 병에 공기만 더 넣어 비교할 거예요.','bottle',3,6);
  if(carry==='bottle')return guide('redock','페트병을 주입 받침에 내려놓으세요','공기를 넣을 때는 병이 받침에 연결되어 있어야 해요.','mass-dock',3,6);
  return guide('pump','손잡이를 위아래로 움직여 공기를 넣으세요',`손을 떼지 않고 아래 끝까지, 다시 위로 올리세요. ${m.strokes}번 주입했어요.`, 'mass-pump',4,6);
 }
 if(i===1){
  const h=s.heat;
  if(!h.hot){
   if(h.at==='hot'&&carry!=='jar')return guide('warming','고무막이 어떻게 변하는지 관찰하세요','가열 중 · 볼록해지는 고무막의 중심을 보세요.',undefined,2,4);
   return guide('heat','집기병을 따뜻한 물로 옮겨 보세요',carry==='jar'?'왼쪽 따뜻한 수조를 클릭하세요.':'고무막을 씌운 집기병을 클릭해 집으세요.',carry==='jar'?'heat-hot':'jar',1,4);
  }
  if(!h.wiped)return guide('wipe','차갑게 하기 전에 병의 겉면을 닦으세요',carry==='jar'?'가운데 수건 받침을 클릭하세요.':'집기병을 집어 수건 받침으로 옮겨 보세요.',carry==='jar'?'heat-wipe':'jar',3,4);
  if(h.at==='cold'&&carry!=='jar')return guide('cooling','차가워진 고무막의 변화를 관찰하세요','냉각 중 · 따뜻할 때의 모습과 비교해 보세요.',undefined,4,4);
  return guide('cold','차가운 물에서는 어떻게 될까요?',carry==='jar'?'오른쪽 차가운 수조를 클릭하세요.':'집기병을 집어 차가운 물로 옮겨 보세요.',carry==='jar'?'heat-cold':'jar',4,4);
 }
 if(i===2){
  const p=s.press;
  if(!p.syringe){
   if(!p.sealed)return carry==='cap'?guide('attach-cap','반짝이는 주사기 끝에 마개를 끼우세요','주사기 아래의 부착 위치를 클릭하세요.','syringe-tip',1,3):guide('seal','주황색 마개를 클릭해 집으세요','공기가 빠져나가지 않도록 주사기 끝을 막을 거예요.','seal',1,3);
   if(p.hold>0)return guide('hold','그대로 잠깐 기다려 보세요','압력 측정 중 · 190~205 kPa를 유지하세요.',undefined,2,3);
   return guide('compress','같은 공기를 누르면 부피가 어떻게 될까요?','위쪽 손잡이를 아래로 끌어 부피를 30 mL로 줄여 보세요.','piston',2,3);
  }
  return guide('vacuum','이번에는 풍선 바깥의 공기를 빼 보세요','진공 펌프를 한 번 잡고 위아래로 움직여 풍선을 관찰하세요.','vacuum',3,3);
 }
 if(i===3){
  const g=s.gases,gas=(['He','CO2','N2','O2'] as Gas[]).find(x=>observed?!observed[x]:!g.done[x])!;
  const done=Object.values(g.done).filter(Boolean).length;
  if(!g.docked||(observed?observed[g.docked]:g.done[g.docked]))return guide('choose','다음 장치에는 어떤 기체가 필요할까요?','이름표를 읽고 아직 관찰하지 않은 카트리지를 클릭하세요.',`cart-${gas}`,done+1,4);
  if(g.target!==g.docked)return guide('connect','이 기체를 쓸 장치를 찾아 연결하세요','아래 카드의 큰 쓰임 버튼을 눌러 연결해 보세요.',`dock-${g.docked}`,done+1,4);
  if(g.valve<.05)return guide('flow','연결한 기체가 흐르게 해 보세요','큰 기체 공급하기 버튼을 누르세요. 밸브는 자동으로 열립니다.','gas-valve',done+1,4);
  return guide('observe','기체를 넣은 장치의 변화를 관찰하세요','기체 공급 중 · 부력, 불꽃, 산소 표시가 어떻게 달라지나요?',undefined,done+1,4);
 }
 const f=s.final;
 if(!s.solved.every(Boolean))return guide('locked','중앙 장치는 아직 잠겨 있어요','네 실험을 모두 끝내면 사용할 수 있어요.',undefined,0,4);
 const wrong=f.links.find(x=>x!=='0-1'&&x!=='2-3');
 if(wrong)return guide('wrong-link','기체가 흘러갈 길을 다시 살펴보세요','잘못 이은 관의 양쪽 단자를 다시 누르면 분리돼요.',`port-${wrong.split('-')[0]}`,1,3);
 const stage=finalStage(s);
 if(stage===1)return guide('pipes',f.selected===null?'먼저 공기통 출구를 누르세요':'이제 가열기 입구를 누르세요',f.selected===null?'공기의 출발점은 어디일까요? 공기 저장통 출구를 먼저 선택하세요.':'선택한 출구에서 나온 공기가 들어갈 가열 입구를 선택하세요.',f.selected===null?'port-0':'port-1',1,4);
 if(stage===2)return guide('pipes',f.selected===null?'가열기 출구를 누르세요':'이제 피스톤 입구를 누르세요',f.selected===null?'따뜻해진 공기는 문을 미는 장치로 가야 해요.':'공기의 힘으로 움직이는 피스톤 입구를 선택하세요.',f.selected===null?'port-2':'port-3',2,4);
 if(stage===3)return guide('valve','③ 공급 밸브를 열어 공기를 보내세요','손잡이를 오른쪽으로 끌거나 밸브 열기 버튼을 누르세요.','final-valve',3,4);
 if(stage===4)return guide('heater','③ 가열을 켜 압력을 높이세요','공기를 따뜻하게 하면 밀어내는 힘이 어떻게 될까요?','heater',3,4);
 return guide('unlocking','④ 공기의 힘으로 잠금이 풀리는 모습을 보세요','가열 중 · 압력계가 차오르면 피스톤이 잠금 막대를 밀어 올려요.',undefined,4,4);
}

/** Hover text shares the same stage resolver as the objective. Neutral descriptions
 * identify objects without asking the learner to repeat a finished step. */
export function interaction(s:State,i:number,carry:string|null,id:string):string {
 const g=guidance(s,i,carry);
 const names:Record<string,string>={bottle:'페트병',jar:'집기병','mass-scale':'전자저울','mass-dock':'주입 받침','mass-rack':'병 받침','mass-pump':'공기 주입 펌프','heat-hot':'따뜻한 물','heat-cold':'차가운 물','heat-wipe':'수건 받침','heat-wipe-cloth':'수건',seal:'주사기 마개',piston:'피스톤',vacuum:'진공 펌프',vent:'공기 유입구','gas-valve':'기체 공급 밸브','final-valve':'공급 밸브',heater:'온도 장치','heater-jar':'온도 장치'};
 const name=names[id]??(id.startsWith('cart-')?({He:'헬륨',O2:'산소',CO2:'이산화 탄소',N2:'질소'} as Record<string,string>)[id.slice(5)]+' 카트리지':id.startsWith('dock-')?id.slice(5)+' 연결구':id.startsWith('port-')?['공기 저장통 출구','가열 입구','가열 출구','피스톤 입구'][Number(id.slice(5))]:'장치');
 if(g.key==='complete')return name+' · 관찰 완료';
 if(i===0){
  if(id===g.target)return id==='bottle'?'클릭하여 집기 · 페트병':id==='mass-pump'?'위아래로 드래그 · 펌프 손잡이':'클릭하여 놓기 · '+name;
  if(id==='mass-dock'&&s.mass.at==='pump'&&!carry)return '주입 받침 · 병이 연결되어 있어요';
  if(id==='bottle'&&g.key==='pump')return '페트병 · 주입 장치에 연결됨';
  if(id==='mass-scale'&&s.mass.baseline!==null)return '전자저울 · 처음 무게 기록됨';
  if(id==='mass-pump'&&(g.key==='return'||g.key==='compare'))return '공기 주입 완료';
  return name;
 }
 if(id==='jar')return carry==='jar'?'집기병을 들고 있어요':g.target==='jar'?'클릭하여 집기 · 집기병':'집기병 · 변화 관찰 중';
 if(id.startsWith('heat-')){const target=id==='heat-wipe-cloth'?'heat-wipe':id;return carry==='jar'&&g.target===target?'클릭하여 놓기 · '+name:name+(g.key==='warming'&&id==='heat-hot'?' · 가열 중':g.key==='cooling'&&id==='heat-cold'?' · 냉각 중':s.heat.hot&&id==='heat-hot'?' · 가열 관찰 완료':s.heat.wiped&&target==='heat-wipe'?' · 닦기 완료':'');}
 if(id==='seal')return s.press.sealed?'주사기 마개 · 닫힘':carry==='cap'?'마개를 들고 있어요':'클릭하여 마개 집기';
 if(id==='syringe-tip')return s.press.sealed?'마개가 끼워졌어요':carry==='cap'?'클릭하여 마개 끼우기':'마개를 먼저 집으세요';
 if(id==='piston')return s.press.syringe?'주사기 · 측정 완료':!s.press.sealed?'피스톤 · 먼저 마개를 닫으세요':g.key==='hold'?'피스톤 · 압력 유지 중':'아래로 드래그 · 피스톤';
 if(id==='vacuum')return s.press.vacuum?'풍선 · 관찰 완료':'위아래로 드래그 · 바깥 공기 빼기';
 if(id==='vent')return '공기 유입구 · 클릭하면 공기가 들어와요';
 if(id.startsWith('cart-')){const gas=id.slice(5) as Gas;return s.gases.done[gas]?name+' · 관찰 완료':s.gases.docked===gas?name+' · 선택됨':'클릭하여 집기 · '+name;}
 if(id.startsWith('dock-')&&s.gases.done[id.slice(5) as Gas])return name+' · 관찰 완료';
 if(id.startsWith('dock-'))return s.gases.target===id.slice(5)&&s.gases.docked===s.gases.target?name+' · 연결됨':s.gases.docked?'클릭하여 연결 · '+name:name;
 if(id==='gas-valve')return s.gases.target!==s.gases.docked||!s.gases.docked?'공급 밸브 · 기체를 먼저 연결하세요':s.gases.valve>0?'밸브 열림 · 기체 공급 중':'클릭 / 탭 · 공급 밸브 열기';
 if(id==='final-valve'&&finalStage(s)<3)return '공급 밸브 · 두 연결을 마치면 사용할 수 있어요';
 if(id==='final-valve')return s.final.valve>0?'공급 밸브 · 열림':'클릭 / 탭 · 공급 밸브 열기';
 if(id.startsWith('heater'))return s.final.heater?'온도 장치 · 가열 중':'클릭하여 가열 켜기';
 if(id.startsWith('port-')){const n=id.slice(5),stage=finalStage(s);if(stage===1&&Number(n)>1)return name+' · 다음 연결에서 사용';if(stage===2&&Number(n)<2)return name+' · 연결 완료';return s.final.links.some(x=>x.split('-').includes(n))?name+' · 연결됨':s.final.selected===Number(n)?name+' · 선택됨':'클릭하여 연결 · '+name;}
 return name;
}

