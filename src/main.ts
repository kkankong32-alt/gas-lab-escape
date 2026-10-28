import {entryPrompt,finalShot,type Shot} from './presentation';
import {pinsClear} from './lock-geometry';
import {patchHTML} from './stable-ui';
import {experience,trackExperience,sealPackage,canObserve,gasStage,type Experience} from './experience';
import {exploration,record,allObserved} from './exploration';
import './novice.css';
import {art,diagram,panel,poster,questions} from './panels';
import {finalGuard,finalStage,finalPressure} from './finale';
import './style.css';
import './premium.css';
import './reboot.css';
import './panels.css';
import './gameplay.css';
import './cinema.css';
import * as THREE from 'three';
import {World,centers,names,type Hit} from './world';
import {act,fresh,step,resetStation,airGrams,gasOxygen,balloonEquilibrium,P0,type State,type Action,type Gas,clamp} from './science';
import {load,save as saveState} from './storage';
import {Review,freshLearning,restoreLearning,destination,canEnter,concepts,labLabel,type Learning} from './learning';
import {PumpStroke,route,type Point} from './input';
import {Sound} from './audio';
import {guidance as baseGuidance,objectives,interaction} from './guidance';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const ui=$('ui'),canvas=$<HTMLCanvasElement>('world');
ui.innerHTML=`
<section id="menu" class="menu">
 <div class="brand-top"><span class="logo"></span><span class="eyebrow">기체 제어 연구소 · 제04구역</span></div>
 <div class="eyebrow accent">관찰하고, 움직이고, 탈출하라</div>
 <h1>풀어서<br>잠금 해제</h1><p class="subtitle">기체 연구소 탈출</p>
 <p class="tagline">보이지 않는 기체가, 유일한 열쇠.<br>첫 번째 임무: 공기의 무게를 확인하세요.</p>
 <div class="creator-credit" aria-label="제작자 안내">기획·제작: <strong>쓰로인훈쌤 김종훈</strong><small>딸깍 바이브 교실 · 초등 수업을 위한 무료 교육 콘텐츠</small></div>
 <div class="menu-actions" id="menu-actions"><button id="start" class="primary" disabled>시작하기 <span>↗</span></button><button id="continue" disabled>이어하기 <span>→</span></button><button id="controls">조작 방법 <span>＋</span></button><button id="settings">설정 <span>＋</span></button></div>
 <div class="start-help"><b>처음이라도 괜찮아요</b><span>↑ ↓ ← → 이동 · 마우스로 둘러보기</span><span>가까이 가서 E · 실험 중에는 클릭 / 드래그</span><span>시작하면 마우스가 게임 안에 머물러요. Esc로 나올 수 있어요.</span></div><div class="loading" id="loading"><span id="load-text">연구소 연결 중</span><div class="loading-bar"><i id="load-bar"></i></div></div>
 <div class="menu-footer"><span><i class="status-dot"></i>초등 과학 · 여러 가지 기체</span><span id="build-version">2026.10.28-r4-fc5.1 · 제작자·이용 통계 반영</span></div>
</section>
<section id="hud" class="hud hidden">
 <div class="hud-top"><div class="hud-brand" id="hud-brand">풀어서 잠금 해제<small>기체 연구소 · 안전 회로 복구</small></div><div class="circuits" id="circuits"></div></div>
 <div id="mission" class="mission"><span class="eyebrow">현재 목표</span><h2>실험실의 안전 회로를 복구하세요</h2><p>빛과 표지를 따라 실험대에 접근하세요.<br>장치가 어떻게 움직일지 예상해 보세요.</p></div>
 <div id="target-marker" class="hidden"><i></i><button id="target-action"></button><span id="gesture-demo" aria-hidden="true">☝</span></div><aside id="start-picture" class="hidden"></aside><aside id="final-console" class="hidden"></aside><div id="equipment-rail" class="hidden"></div><div id="focus-head" class="focus-head hidden"></div><div id="focus-panel" class="focus-panel hidden"></div>
 <section id="review" class="review hidden" aria-label="이번 실험에서 발견한 비밀"></section><button id="review-open" class="primary review-open hidden">발견한 비밀 확인하기</button><button id="heat-observe" class="ghost heat-observe hidden">고무막 관찰</button><div id="journey" class="journey hidden"><p id="success-summary" class="hidden"></p><button id="navigate" class="primary">다음 목적지 안내</button><button id="manual" class="ghost hidden">직접 이동하기</button><button id="skip-route" class="ghost hidden">빠르게 이동</button></div><button id="enter-touch" class="primary enter-touch hidden">실험 시작</button><div id="stick" class="stick hidden"><span></span></div><button id="rotate-tip" class="rotate-tip hidden">가로로 돌리면 기구가 더 크게 보여요 · 닫기 ×</button><button id="zoom" class="zoom ghost hidden">기구 확대</button><button id="readings" class="readings ghost hidden">측정값</button><div id="compare-labels" class="hidden"><span>공급 전</span><span>공급 후</span></div><div id="crosshair" class="crosshair"></div><div id="interact" class="interact hidden"></div>
 <button id="look-start" class="look-start hidden">화면을 클릭해 둘러보기 시작 <small>마우스로 시점 이동 · Esc로 풀기</small></button><div id="carry" class="carry hidden"></div><div id="particle-note" class="particle-note hidden">기체 입자는 실제 모습이 아닌 설명용 모식도입니다</div>
 <div class="hud-bottom"><div id="keys" class="keys"></div><div class="toolbar"><button id="hint">H · 힌트</button><button id="tools">M · 도구</button><button id="back" class="hidden">실험 화면 닫기</button><button id="pause">Esc · 쉬기</button></div></div>
</section><div id="toast" class="toast hidden"></div><div id="modal" class="modal-backdrop hidden"></div><div id="ending" class="ending hidden"></div><div id="cinematic" class="cinematic hidden"><p>기체가 움직이고, 잠금이 풀립니다.</p></div>`;
let state:State=fresh(),mode:'menu'|'walk'|'focus'|'cinematic'|'end'='menu',focus:number|null=null,paused=false,ready=false,carry:string|null=null;
let learning:Learning=freshLearning(),review:Review|null=null,reviewPending=0,heatObserve=false,autoHeat=false;
let discoveries=exploration(state,true),followAlong=false,lastActionAt=performance.now(),hintLevel=0,lastFollowTarget='';
let lesson=experience(state);
function guidance(s:State,i:number,c:string|null){const base=baseGuidance(s,i,c,discoveries.observed);if(i!==3||allObserved(discoveries))return base;const stage=gasStage(s,lesson,discoveries.observed),g=s.gases.docked;const titles={choose:'어떤 기체를 실험해 볼까요?',connect:'선택한 기체를 쓸 장치를 누르세요',supply:g==='N2'?'질소 넣기를 눌러 봉지를 채워 보세요':'공급 버튼을 눌러 변화를 관찰하세요',observe:g==='N2'?'봉지가 부풀고 공기가 빠져나가는 모습을 보세요':'장치의 변화가 끝날 때까지 관찰하세요',seal:'이제 봉지를 직접 밀봉해 보세요',wait:'커진 불꽃을 잠시 더 관찰하세요',compare:g==='He'?'같은 크기의 공기 풍선과 비교해 보세요':'전후 비교를 눌러 달라진 모습을 보세요',confirm:'무엇이 달라졌나요? 관찰 완료를 눌러 주세요'};return {...base,key:stage,title:titles[stage],target:stage==='connect'?`dock-${g}`:undefined};}
function nextLab(s:State){return destination(s,learning);}
function save(s:State){return saveState(Object.assign(s,{learning,exploration:discoveries,experience:lesson}));}
let yaw=0,pitch=0,held=new Set<string>(),hover:Hit|null=null,drag:{hit:Hit;x:number;y:number;start:number;fired:boolean;id:number;pump?:PumpStroke}|null=null;
let transition:{p:THREE.Vector3;q:THREE.Quaternion;t:number;fromP:THREE.Vector3;fromQ:THREE.Quaternion}|null=null,modalAt=0;
let inspectLock=false;let pressureAuto=true;let introTimer=0;const introductions=new Set<number>();let pressureView:'push'|'vacuum'|'all'='push';
let guideKey='',lastGuideTarget:string|undefined,toastStage:string|null=null;
const touchDevice=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
document.body.classList.toggle('touch',touchDevice);
let rotationTipDismissed=false,gasWide=false;
let experienced=false,shot:Shot='heat',lastShot='',passageTime=0,passageStart=new THREE.Vector3();
let autoRoute:Point[]|null=null,routeTarget:number|null=null,arrived:number|null=null,fastRoute=false;
let stickId:number|null=null;
let stick={x:0,y:0},lookPointer:{id:number;x:number;y:number}|null=null,zoomed=false;
let pointer:{x:number;y:number}|null=null;
let returnView:{p:THREE.Vector3;q:THREE.Quaternion}|null=null,toastTimer=0,ignoreUnlock=false,lastSave=0,lastUI=0;
const sound=new Sound();
const world=new World(canvas);
function toast(text:string){if(!text)return;toastStage=focus!==null?guidance(state,focus,carry).key:null;$('toast').textContent=text;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('toast').classList.add('hidden'),5500);}
function dispatch(a:Action){if(a.type==='cartridge')world.gasCompare=false;lastActionAt=performance.now();const blocked=finalGuard(state,a);if(blocked){toast(blocked);sound.play('pump');return;}const before=state.solved.join();const previousBaseline=state.mass.baseline;const message=act(state,a);if(a.type==='dock'&&state.gases.target===state.gases.docked)toast('연결됐어요. 큰 공급 버튼을 눌러 변화를 관찰하세요.');else if(message)toast(message);else if(a.type==='bottle'&&a.at==='scale'&&previousBaseline!==null&&!state.solved[0])toast('무게가 아직 충분히 늘지 않았어요. 병을 주입 받침으로 옮겨 공기를 더 넣어 보세요.');else if(a.type==='pumpMass'&&state.mass.at==='pump')toast(guidance(state,0,carry).key==='pump'?`공기 주입 ${state.mass.strokes}회`:'공기 주입 완료');sound.play(a.type==='pumpMass'||a.type==='vacuum'?'pump':'click');if(before!==state.solved.join())success();save(state);updateUI();}
function success(){reviewPending=0;sound.play('success');toast(focus!==null&&state.solved[focus]?[ '공기를 더 넣으니 무게가 늘었어요. 공기에도 무게가 있습니다.','따뜻하게 하면 팽창하고, 차갑게 하면 수축해요.','누르면 작아지고, 바깥 압력을 낮추면 커져요.','네 기체의 서로 다른 성질로 안전 회로가 복구되었습니다.'][focus]:'안전 회로가 복구되었습니다.');save(state);}
function modal(title:string,body:string,buttons:{id:string;label:string;fn:()=>void}[]=[]){
 modalAt=performance.now();
 paused=true;held.clear();cancelInput();ignoreUnlock=true;if(document.pointerLockElement)document.exitPointerLock();
 $('modal').innerHTML=`<div class="modal"><span class="eyebrow">기체 제어 연구소</span><h2>${title}</h2>${body}<div class="actions">${buttons.map((b,i)=>`<button id="${b.id}" class="${i===0?'primary':'ghost'}">${b.label}</button>`).join('')}<button id="close-modal" class="ghost">닫기</button></div></div>`;
 $('modal').classList.remove('hidden');$('close-modal').onclick=closeModal;buttons.forEach(b=>$(b.id).onclick=b.fn);
}
function closeModal(){$('modal').classList.add('hidden');paused=false;if(mode==='walk')lock();}
function lock(){if(touchDevice||autoRoute)return;ignoreUnlock=false;canvas.requestPointerLock()?.catch(()=>toast('시점 이동을 시작하려면 화면을 한 번 클릭하세요.'));}
function goCamera(p:THREE.Vector3,look:THREE.Vector3){
 const c=world.camera.clone();c.position.copy(p);c.lookAt(look);
 transition={p,q:c.quaternion.clone(),t:0,fromP:world.camera.position.clone(),fromQ:world.camera.quaternion.clone()};
}
function enter(i:number){
 if(!ready||mode!=='walk')return;experienced=true;
 if(!canEnter(state,learning,i)){toast(`${labLabel(i)}는 아직 잠겨 있어요. 먼저 ${labLabel(nextLab(state))}의 실험과 비밀 확인을 마치세요.`);return;}
 autoRoute=null;arrived=null;zoomed=false;heatObserve=false;gasWide=false;lastShot='';focus=i;mode='focus';carry=null;drag=null;hover=null;pointer=null;setExperimentView(true);held.clear();guideKey='';ignoreUnlock=true;document.exitPointerLock();
 returnView={p:world.camera.position.clone(),q:world.camera.quaternion.clone()};
 if(i===2){pressureView=state.press.syringe?'vacuum':'push';pressureAuto=true;}
 if(i===2&&discoveries.capHeld&&!state.press.sealed)carry='cap';followAlong=false;lastFollowTarget='';lastActionAt=performance.now();focusCamera();
 if(!introductions.has(i)){introductions.add(i);$('start-picture').innerHTML=panel(i,'start')+'<button id=begin-now class=primary>바로 실험하기</button>';$('begin-now').onclick=()=>{clearTimeout(introTimer);$('start-picture').classList.add('hidden');updateUI();};$('start-picture').classList.remove('hidden');clearTimeout(introTimer);introTimer=window.setTimeout(()=>{ $('start-picture').classList.add('hidden');updateUI();},4000);}
 updateUI();$('toast').classList.add('hidden');showHover();
}
function exitFocus(_relock=false){
 if(mode!=='focus')return;$('start-picture').classList.add('hidden');
 if(review)closeReview();heatObserve=false;cancelInput();held.clear();paused=false;ignoreUnlock=true;if(document.pointerLockElement)document.exitPointerLock();$('modal').classList.add('hidden');world.gasCompare=false;save(state);
 const leaving=focus!,completed=guidance(state,leaving,carry).key==='complete';
 if(completed&&returnView&&leaving<4){yaw=centers[leaving][0]<0?-Math.PI/2:Math.PI/2;pitch=0;returnView.q.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));state.position.yaw=yaw;state.position.pitch=pitch;}
 $('toast').classList.add('hidden');carry=null;drag=null;focus=null;mode='walk';hover=null;pointer=null;setExperimentView(false);
 if(returnView)transition={p:returnView.p,q:returnView.q,t:0,fromP:world.camera.position.clone(),fromQ:world.camera.quaternion.clone()};
 updateUI();
}
function begin(resume:boolean){
 autoRoute=null;arrived=null;experienced=false;passageTime=0;lastShot='';world.compareMechanism=false;cancelInput();setExperimentView(false);sound.unlock();state=resume?(load()||fresh()):fresh();learning=resume?restoreLearning(state):freshLearning();discoveries=exploration(state,!resume);lesson=experience(state);review=null;reviewPending=0;world.reviewing=false;document.body.classList.remove('reviewing');$('review').classList.add('hidden');mode='walk';focus=null;paused=false;carry=null;transition=null;
 if(!resume){introductions.clear();world.intro=0;state.position={x:-2.5,z:-4,yaw:Math.PI/2,pitch:0};}
 held.clear();drag=null;hover=null;guideKey='';$('modal').classList.add('hidden');
 if(state.final.escaped){end();return;}
 $('menu').classList.add('hidden');$('hud').classList.remove('hidden');$('ending').classList.add('hidden');
 world.camera.position.set(state.position.x,1.65,state.position.z);yaw=state.position.yaw;pitch=state.position.pitch;
 world.camera.rotation.set(pitch,yaw,0,'YXZ');lock();sound.play('alarm');updateUI();
 toast(resume?'저장한 단계부터 이어갑니다. 위쪽의 다음 행동을 확인하세요.':'01 입구로 가거나 ‘다음 목적지 안내’를 눌러 보세요.');
}
function pause(){if(mode==='menu'||mode==='end')return;save(state);modal('잠시 쉬어 가세요','<p>진행 상황을 이 브라우저에 저장했습니다.</p>',[{id:'resume',label:'계속하기',fn:closeModal},{id:'to-menu',label:'타이틀로',fn:()=>{$('modal').classList.add('hidden');paused=false;mode='menu';focus=null;setExperimentView(false);$('hud').classList.add('hidden');$('menu').classList.remove('hidden');$('continue').removeAttribute('disabled');goCamera(new THREE.Vector3(-6.8,2.05,-2.8),new THREE.Vector3(-9,1.4,-5.3));}}]);}
function setExperimentView(active:boolean){if(!active)document.body.classList.remove('finale-running','gas-lab','intro-show');cancelInput();document.body.classList.toggle('experiment',active);document.body.classList.toggle('final-station',active&&focus===4);document.body.classList.toggle('gas-lab',active&&focus===3);world.camera.fov=active?50:57;world.resize();}
function updateUI(){
 document.body.classList.toggle('intro-show',mode==='focus'&&!$('start-picture').classList.contains('hidden'));
 const f=mode==='focus',next=nextLab(state),count=learning.done.filter(Boolean).length;
 $('circuits').innerHTML=`<strong>실험 ${count} / 4</strong><small>${count===4?'중앙 장치 사용 가능':'중앙 장치 잠김'}</small>`;
 $('hud-brand').classList.add('hidden');$('mission').classList.toggle('hidden',f);
 for(const id of ['focus-head','focus-panel','back'])$(id).classList.toggle('hidden',!f);
 $('crosshair').classList.toggle('hidden',f);$('pause').classList.toggle('hidden',f);

 $('keys').innerHTML=f||touchDevice?'':'<b>↑ ↓ ← →</b> 또는 WASD 이동　·　마우스 둘러보기　·　<b>E</b> 실험하기';
 $('carry').classList.toggle('hidden',!carry);$('carry').textContent=carry==='bottle'?'페트병을 들고 있어요':carry==='jar'?'집기병을 들고 있어요':'';
 $('mission').innerHTML=`<span class="eyebrow accent">${next===4?'마지막 도전':'다음 실험'}</span><h2>${next<4&&state.solved[next]&&!learning.done[next]?labLabel(next)+'에서 발견한 비밀을 확인하세요':objectives[next]}</h2><p>${next===4?'중앙 장치 가까이에서 E를 누르세요.':'바닥의 빛을 따라 '+(next+1)+'번 입구로 가세요. 가까이에서 E를 누르세요.'}</p>`;
 updateJourney();
 world.access=state.solved.map((v,i)=>learning.done[i]?'complete':v?'review':i===next?'active':'locked');world.carry=carry;world.guideLab=mode==='walk'?next:null;
 updateInstrumentUI();
 if(f&&focus!==null){
  const g=guidance(state,focus,carry),detailed=true;
  $('focus-head').innerHTML=`<span class="eyebrow accent">${focus===4?'최종 제어장치':`제${focus+1}실험실`} · ${g.key==='complete'?'관찰 완료':`${g.phase} / ${g.total}`}${g.key==='pump'?` · ${state.mass.strokes}회 주입`:g.key==='vacuum'?` · ${state.press.strokes}회 펌프`:''}</span><h2>${g.key==='complete'&&focus<4&&!learning.done[focus]?'실험 성공 · 발견한 비밀을 확인하세요':friendly(g.title)}</h2><p class=experiment-purpose>${['공기 넣기 전과 후, 같은 병의 무게를 비교해요.','따뜻할 때와 차가울 때, 고무막 모양을 비교해요.','같은 공기를 누를 때와 바깥 공기를 뺄 때를 비교해요.','기체를 골라 연결하고, 장치의 변화를 관찰해요.','앞에서 배운 성질로 공기가 문을 밀게 만들어요.'][focus]}</p>`;
  if(guideKey!==`${focus}:${g.key}`){if(toastStage!==g.key)$('toast').classList.add('hidden');guideKey=`${focus}:${g.key}`;}
  lastGuideTarget=detailed?g.target:undefined;world.guideTarget=lastGuideTarget;if(followAlong&&lastFollowTarget!==(g.target??'')){lastFollowTarget=g.target??'';hover=null;zoomed=!!g.target;focusCamera();}
  const m=state.mass,h=state.heat,p=state.press,gs=state.gases;
  const read=[
   `<span>같은 병의 무게</span><strong>${m.at==='scale'&&!carry?(35+airGrams(m.n)).toFixed(2)+' <small>g</small>':m.baseline!==null?m.baseline.toFixed(2)+' <small>g · 처음</small>':'— <small>g</small>'}</strong><p>${m.baseline===null?'아직 측정하지 않았어요':`처음 ${m.baseline.toFixed(2)} g`}${m.after===null?'':` → 나중 ${m.after.toFixed(2)} g`}</p>${m.after!==null&&m.baseline!==null?`<b class="accent">${m.after-m.baseline>=0?'+':''}${(m.after-m.baseline).toFixed(2)} g 변화</b>`:''}`,
   `<span>${h.at==='hot'?'가열 중':h.at==='cold'?'냉각 중':'집기병 속 공기'}</span><strong>${(h.t-273.15).toFixed(1)} <small>°C</small></strong><p>${h.at==='hot'?'위로 볼록해지는 고무막을 보세요':h.at==='cold'?'금색 윤곽은 따뜻할 때의 모습이에요':'병의 크기는 그대로예요'}</p>`,
   `<span>${p.syringe?'주사기 측정 완료 ✓':'주사기의 압력'}</span><strong>${(P0*60/p.v/1000).toFixed(1)} <small>kPa</small></strong><p>${p.syringe?`풍선 바깥 ${(balloonEquilibrium(p.nOutside).p/1000).toFixed(1)} kPa`:`목표 190~205 kPa · 부피 ${p.v.toFixed(0)} mL`}</p>`,
   `<span>기체의 성질</span><strong>${Object.values(gs.done).filter(Boolean).length} <small>/ 4 확인</small></strong><p>${(['He','CO2','N2','O2'] as Gas[]).map(x=>`${x} ${gs.done[x]?'✓':'○'}`).join('　')}</p>`,
   `<span>${state.final.heater?'가열 중':'피스톤 이동'}</span><strong>${Math.round(state.final.stroke*100)} <small>%</small></strong><p>온도 ${(state.final.t-273.15).toFixed(1)} °C · 밸브 ${Math.round(state.final.valve*100)}%</p>`
  ];
  $('focus-panel').innerHTML=read[focus];
 }else {world.guideTarget=undefined;lastGuideTarget=undefined;}
 $('particle-note').classList.toggle('hidden',!world.showParticles||!f||!$('toast').classList.contains('hidden'));
 $('review-open').classList.toggle('hidden',!f||focus===null||focus===4||!state.solved[focus]||learning.done[focus]||!!review||(focus===3&&!allObserved(discoveries)));$('review-open').textContent=focus!==null&&learning.done[focus]?'비밀 다시 살펴보기':'발견한 비밀 확인하기';
 $('heat-observe').classList.toggle('hidden',focus!==1||!!review||paused);$('heat-observe').textContent=heatObserve?'실험대 전체 보기':'고무막 관찰';
 if(review){updateReview();return;}
 if(f){if(pointer&&!drag)hover=pick(pointer.x,pointer.y);showHover();}
}
function clickHit(hit:Hit){
 const id=hit.id;
 if(id==='bottle'||id==='jar'){carry=carry===id?null:id;sound.play('click');updateUI();showHover();return;}
 if(id.startsWith('mass-')&&id!=='mass-pump'){
  if(carry!=='bottle'){toast(guidance(state,0,carry).title);return;}
  dispatch({type:'bottle',at:id==='mass-scale'?'scale':id==='mass-dock'?'pump':'rack'});carry=null;
 }
 if(id.startsWith('heat-')){
  if(carry!=='jar'){toast(guidance(state,1,carry).title);return;}
  const old=state.heat.at;dispatch({type:'jar',at:id==='heat-hot'?'hot':id==='heat-cold'?'cold':'wipe'});
  if(old!==state.heat.at||id==='heat-wipe'||id==='heat-wipe-cloth')carry=null;if(!carry&&(id==='heat-hot'||id==='heat-cold')){heatObserve=true;autoHeat=true;transition=null;}
 }
 if(id==='seal'){if(state.press.sealed){toast('마개가 잘 끼워져 있어요. 피스톤을 움직여 보세요.');return;}carry='cap';discoveries.capHeld=true;sound.play('click');save(state);}
 if(id==='syringe-tip'){if(carry!=='cap'){toast('주황색 마개를 먼저 집으세요.');return;}dispatch({type:'seal'});carry=null;discoveries.capHeld=false;sound.play('success');save(state);}
 if(id==='vent')dispatch({type:'vent'});
 if(id.startsWith('cart-')){dispatch({type:'cartridge',gas:id.slice(5) as Gas});gasWide=false;focusCamera();}
 if(id.startsWith('dock-')){dispatch({type:'dock',gas:id.slice(5) as Gas});gasWide=false;focusCamera();}
 if(id.startsWith('port-'))dispatch({type:'port',id:Number(id.slice(5))});
 if(id==='heater'||id==='heater-jar')dispatch({type:'heater'});
 updateUI();showHover();
}
function updateInstrumentUI(){
 let railHTML='',consoleHTML='';const oldCanvasHeight=canvas.clientHeight;const active=mode==='focus'&&!review&&!paused,wasRail=!$('equipment-rail').classList.contains('hidden');
 $('final-console').classList.toggle('hidden',!active||focus!==4);$('equipment-rail').classList.toggle('hidden',!active||!(focus===3||focus===2||focus===1&&!heatObserve));$('equipment-rail').classList.toggle('heat-rail',focus===1||focus===2);
 if(active&&focus===1&&!heatObserve)railHTML=[['heat-hot','따뜻한 물','따뜻하게 해서 관찰'],['heat-wipe','수건 받침','병의 겉면 닦기'],['heat-cold','차가운 물','차갑게 해서 비교']].map(([id,name,role])=>`<button data-object="${id}"><b>${name}</b><small>${carry==='jar'?'여기에 병 놓기':role}</small></button>`).join('');
 if(active&&focus===2)railHTML=`<button id=pressure-push><b>① 주사기</b><small>60 → ${state.press.v.toFixed(0)} mL · 같은 공기</small></button><button id=pressure-vacuum ${!state.press.syringe?'disabled':''}><b>② 진공 용기</b><small>${state.press.syringe?`풍선 ${(balloonEquilibrium(state.press.nOutside).v*1e6).toFixed(0)} mL`:'주사기 관찰 후 열려요'}</small></button><button id=pressure-all><b>두 장치 보기</b><small>서로 다른 압력 변화</small></button>`;
 
 if(active&&focus===3){const labels=['헬륨','이산화 탄소','질소','산소'],uses=['풍선 띄우기','불 끄기','식품 보존','타는 것 돕기'];railHTML='<div class=gas-tabs>'+(['He','CO2','N2','O2'] as Gas[]).map((gas,i)=>`<button data-object="cart-${gas}" data-selected="${state.gases.docked===gas}" aria-pressed="${state.gases.docked===gas}">${labels[i]} <small>${discoveries.observed[gas]?'✓':''}</small></button>`).join('')+'</div>';const selected=state.gases.docked;if(selected){const i=['He','CO2','N2','O2'].indexOf(selected);railHTML+=`<div class=gas-selected><span class="gas-art gas-art-${i}" style="background-image:url('${art('gases')}')"></span><div><b>${labels[i]}</b><span>${uses[i]}</span></div><button data-object="dock-${selected}" class=gas-use>${state.gases.target===selected?'연결됨 ✓':uses[i]+' 장치 연결'}</button></div>`;}}
 if(active&&focus===3){const g=state.gases,stage=gasStage(state,lesson,discoveries.observed),selected=g.docked;const meanings={He:'같은 크기라면 헬륨 풍선이 공기 풍선보다 가벼워 떠올라요.',CO2:'이산화 탄소로 공기와의 접촉을 줄이면 불이 꺼져요.',N2:'산소와의 접촉을 줄여 오랫동안 보존하는 데 도움을 줘요.',O2:'산소는 연료가 아니라, 다른 물질이 타는 것을 도와요.'};
 const ready=selected&&g.done[selected]&&!discoveries.observed[selected],waiting=stage==='wait';
 railHTML+=(`<div class="gas-feedback"><button id="gas-supply" class="primary ${ready||selected&&discoveries.observed[selected]?'hidden':''}" ${!selected||g.target!==selected||selected==='He'&&g.amount.He>=1?'disabled':''}>${selected==='He'&&g.amount.He>=1?'풍선이 떠오르는 중':g.valve>0?'공급 중 · 관찰하세요':selected==='N2'?'질소 넣기':'기체 공급하기'}</button>${stage==='seal'?'<button id="pack-seal" class="primary">봉지 밀봉하기</button>':''}${selected==='N2'&&lesson.sealed?'<button id=pack-meaning class=ghost>왜 질소로 포장할까?</button>':''}${ready&&stage!=='seal'?`<button id="gas-compare" class="${stage==='compare'?'primary':'ghost'}">${world.gasCompare?'현재 모습만 보기':selected==='He'?'공기 풍선과 비교':'전후 비교'}</button><button id="gas-observed" class="primary" ${!selected||!canObserve(state,lesson,selected)?'disabled':''}>${waiting?'불꽃 관찰 중…':'관찰 완료'}</button>`:''}<span>${selected&&g.target===selected?(stage==='seal'?'포장 준비 완료 · 밀봉 버튼을 눌러요':stage==='confirm'||discoveries.observed[selected]?meanings[selected]:selected==='N2'?`포장 속 산소 ${(gasOxygen(state,'N2')*100).toFixed(1)}% · ${lesson.sealed?'밀봉 완료':g.valve>0?'공기가 밖으로 밀려나요':g.amount.N2>0?'공급 완료':'공급 전 · 일반 공기'}`:'공급 전후의 움직임을 비교해 보세요'):'기체 카드를 고른 뒤 알맞은 장치를 눌러 보세요.'}</span></div>`);

 }
 if(active&&focus===4){const stage=finalStage(state),f=state.final;const pair=stage===1?[0,1]:[2,3],portNames=['공기 저장통 출구','가열 입구','가열 출구','피스톤 입구'];
 consoleHTML=`<div class="console-caption">탈출 장치 설계도 <span>${Math.min(stage<3?stage:stage<5?3:4,4)} / 4</span></div><div class="role-chain"><div class="${stage===1?'current':'done'}"><b>01 공기 저장통</b><span>공기를 보내는 출발점</span></div><i>↓</i><div class="${stage===2||stage===4?'current':''}"><b>02 가열기</b><span>공기를 따뜻하게 해 힘을 높여요</span></div><i>↓</i><div class="${stage===5?'current':''}"><b>03 피스톤 → 금속 막대</b><span>압력으로 막대를 들어 올려요</span></div><i>↓</i><div class="${stage===5?'current':''}"><b>04 문 잠금핀</b><span>핀을 빼면 문이 열려요</span></div></div><div class="console-action">${stage===0?'<p>기존 연결을 점검하세요. 잘못 연결한 두 단자를 다시 누르면 분리됩니다.</p>':stage<3?`<p>${stage===1?'첫 번째 관':'두 번째 관'} · 출구 → 입구</p><div class=port-actions>${pair.map(n=>`<button data-object="port-${n}" class="${f.selected===n?'selected':''}"><small>${f.selected===n?'선택됨 ✓':n===pair[0]?'먼저 선택':'여기에 연결'}</small>${portNames[n]}</button>`).join('')}</div>`:stage===3?'<p>연결 완료 ✓ · 공기가 지나갈 문을 열어요.</p><button id="final-open-valve" class="primary">공급 밸브 열기 ↻</button>':stage===4?'<p>공기 공급 중 · 온도를 높여 힘을 더해요.</p><button id="final-heat" class="primary">가열 시작</button>':'<p>피스톤 → 막대 → 잠금핀을 따라 보세요.</p>'}</div><div class="pressure-readout ${stage<3?'hidden':''}"><span>피스톤을 미는 압력</span><strong>${finalPressure(state).toFixed(0)} <small>kPa</small></strong><meter min="100" max="140" value="${finalPressure(state)}"></meter><small>약 135 kPa · 42 °C 이상에서 잠금 해제</small><div>${(f.t-273.15).toFixed(0)} °C <span>피스톤 ${Math.round(f.stroke*100)}%</span></div></div>`;

 }
 const running=active&&focus===4&&(state.final.heater||state.final.t>294.15)&&state.final.valve>0;
 document.body.classList.toggle('finale-running',running);document.body.classList.toggle('lock-inspection',active&&focus===4&&inspectLock);
 if(running){const f=state.final;consoleHTML=`<div class=final-activity><div><b>${shot==='heat'?'공기를 데우며 변화를 찾아보세요':shot==='piston'?'① 공기의 힘으로 피스톤이 올라가요':shot==='bridge'?'② 연결된 프레임이 함께 올라가요':'③ 프레임이 양쪽 잠금핀을 빼요'}</b><small>${(f.t-273.15).toFixed(0)} °C · ${finalPressure(state).toFixed(0)} kPa · ${f.heater?'가열 중':'가열을 멈췄어요'}</small></div><button id=heat-toggle>${f.heater?'가열 끄기':'다시 가열'}</button><button id=mechanism-compare aria-pressed=${world.compareMechanism}>${world.compareMechanism?'처음 위치 ✓':'처음 위치 비교'}</button><button id=inspect-heat>가열기 보기</button></div>`;}

 if(active&&focus===4)consoleHTML+=`${inspectLock?`<p id=lock-status>은색: 문틀 고정 가이드 · 검정: 문에 붙은 구멍 · 금색 핀: ${pinsClear(state.final.stroke)?'빠짐 ✓':'걸림'}</p>`:''}<button id=lock-inspect class=ghost>${inspectLock?'전체 작동 보기':'잠금핀·구멍 가까이 보기'}</button>`;
 patchHTML($('equipment-rail'),railHTML);patchHTML($('final-console'),consoleHTML);
 if(active&&focus===3)document.body.style.setProperty('--gas-controls',`${$('equipment-rail').offsetHeight+76}px`);
 if(active&&focus===3){const selected=state.gases.docked;
 $('gas-supply').onclick=()=>{const g=state.gases;if(!g.docked||g.target!==g.docked){toast('기체 카드와 같은 쓰임의 장치를 먼저 연결해 주세요.');return;}dispatch({type:'gasValve',value:1});gasWide=false;zoomed=false;focusCamera();};
 const seal=document.getElementById('pack-seal');if(seal)seal.onclick=()=>{if(sealPackage(state,lesson)){sound.play('success');save(state);updateUI();}};
 const why=document.getElementById('pack-meaning');if(why)why.onclick=packageMeaning;
 const compare=document.getElementById('gas-compare');if(compare)compare.onclick=()=>{world.gasCompare=!world.gasCompare;if(selected)lesson.compared[selected]=true;gasWide=false;zoomed=false;focusCamera();save(state);updateUI();};
 const observed=document.getElementById('gas-observed');if(observed)observed.onclick=()=>{if(selected&&canObserve(state,lesson,selected)){discoveries.observed[selected]=true;world.gasCompare=false;dispatch({type:'gasValve',value:0});save(state);updateUI();}};
 }
 if(active&&focus===4){$('lock-inspect').onclick=()=>{inspectLock=!inspectLock;mechanismCamera();updateUI();};const valve=$('final-open-valve'),heat=$('final-heat');if(valve)valve.onclick=()=>dispatch({type:'finalValve',value:1});if(heat)heat.onclick=()=>dispatch({type:'heater'});const toggle=$('heat-toggle'),compare=$('mechanism-compare'),inspect=$('inspect-heat');if(toggle)toggle.onclick=()=>dispatch({type:'heater'});if(compare)compare.onclick=()=>{world.compareMechanism=!world.compareMechanism;updateUI();};if(inspect)inspect.onclick=()=>mechanismCamera('heat');}
 if(oldCanvasHeight!==canvas.clientHeight||wasRail!==!$('equipment-rail').classList.contains('hidden')){world.resize();if(mode==='focus'&&!heatObserve)focusCamera();}
 for(const view of ['push','vacuum','all'] as const){const b=$('pressure-'+view);if(b)b.onclick=()=>{pressureAuto=false;pressureView=view;zoomed=false;focusCamera();};}
 for(const b of Array.from(document.querySelectorAll<HTMLElement>('[data-object]')))b.onclick=()=>{const hit=world.hits.find(h=>h.id===b.dataset.object);if(hit)clickHit(hit);};
}
function friendly(text:string){return touchDevice?text.replaceAll('클릭','터치'):text;}
function pick(x:number,y:number){return (touchDevice&&focus!==null?world.pickTouch(x,y,focus):null)??world.pick(x,y,focus);}
function cancelInput(){const ids=[drag?.id,lookPointer?.id];drag=null;lookPointer=null;for(const id of ids)if(id!==undefined&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);if(stickId!==null&&$('stick').hasPointerCapture(stickId))$('stick').releasePointerCapture(stickId);stickId=null;stick={x:0,y:0};world.pumpHeld=[false,false];$('stick').querySelector('span')!.setAttribute('style','');}
canvas.addEventListener('pointerdown',e=>{
 if(review||paused||transition||mode==='menu'||mode==='cinematic'||mode==='end')return;
 sound.unlock();pointer={x:e.clientX,y:e.clientY};
 if(mode==='walk'){
  if(autoRoute)stopRoute();
  if(e.pointerType!=='mouse'){if(lookPointer)return;lookPointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);return;}
  if(!document.pointerLockElement){lock();return;}if(hover)enter(hover.station);return;
 }
 if(drag)return;
 const hit=pick(e.clientX,e.clientY);if(!hit){toast(friendly(carry?'들고 있는 병을 놓을 받침이나 수조를 클릭하세요.':'기구를 선택하면 조작 방법이 보여요.'));return;}
 hover=hit;showHover();$('toast').classList.add('hidden');
 if(hit.drag==='final-valve'){const message=finalGuard(state,{type:'finalValve',value:1});if(message){toast(message);return;}}
 if(hit.drag){
  const pump=hit.drag==='mass-pump'||hit.drag==='vacuum';
  drag={hit,x:e.clientX,y:e.clientY,id:e.pointerId,start:hit.drag==='piston'?state.press.v:hit.drag==='gas-valve'?state.gases.valve:hit.drag==='final-valve'?state.final.valve:0,fired:false,pump:pump?new PumpStroke(e.clientY,Math.min(64,Math.max(40,canvas.clientHeight*.15))):undefined};
  if(pump)world.pumpHeld[hit.drag==='mass-pump'?0:1]=true;
  canvas.setPointerCapture(e.pointerId);
 }else clickHit(hit);
});
canvas.addEventListener('pointermove',e=>{
 if(review||paused)return;
 if(mode==='walk'){
  if(lookPointer?.id===e.pointerId){yaw-=(e.clientX-lookPointer.x)*.005;pitch=clamp(pitch-(e.clientY-lookPointer.y)*.005,-1.1,1.1);lookPointer.x=e.clientX;lookPointer.y=e.clientY;}
  else if(document.pointerLockElement&&!autoRoute){yaw-=e.movementX*.002;pitch=clamp(pitch-e.movementY*.002,-1.1,1.1);}return;
 }
 if(mode!=='focus'||transition)return;
 pointer={x:e.clientX,y:e.clientY};
 if(drag){
  if(e.pointerId!==drag.id)return;
  const d=drag,dy=e.clientY-d.y,dx=e.clientX-d.x;
  if(d.hit.drag==='piston')act(state,{type:'piston',v:d.start-dy*(innerHeight<500?.4:.24)});
  if(d.hit.drag==='gas-valve')act(state,{type:'gasValve',value:d.start+dx/Math.min(160,innerWidth*.3)});
  if(d.hit.drag==='final-valve')act(state,{type:'finalValve',value:d.start+dx/Math.min(160,innerWidth*.3)});
  if(d.pump){const stroke=d.pump.move(e.clientY);world.pumpMotion[d.hit.drag==='mass-pump'?0:1]=d.pump.position;
   if(stroke){d.fired=true;if(carry)toast('병을 받침에 내려놓은 뒤 움직여 주세요.');else dispatch({type:d.hit.drag==='mass-pump'?'pumpMass':'vacuum'});}
  }
  updateUI();return;
 }
 hover=pick(e.clientX,e.clientY);if(hover)$('toast').classList.add('hidden');showHover();
});
canvas.addEventListener('pointerup',e=>{
 if(lookPointer?.id===e.pointerId){lookPointer=null;return;}
 if(!drag||drag.id!==e.pointerId)return;
 const d=drag;drag=null;world.pumpHeld=[false,false];
 if((d.hit.drag==='gas-valve'||d.hit.drag==='final-valve')&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<8)dispatch({type:d.hit.drag==='gas-valve'?'gasValve':'finalValve',value:d.start>.5?0:1});
 if(d.hit.drag==='bottle'||d.hit.drag==='jar'){
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>8){carry=d.hit.drag;const target=pick(e.clientX,e.clientY);if(target)clickHit(target);}else clickHit(d.hit);
 }
 if(d.pump&&!d.fired)toast('손잡이를 잡고 끝까지 아래로, 다시 위로 움직여 보세요.');
 if(d.hit.drag==='piston'&&!state.press.sealed)toast('주황색 마개를 먼저 닫으세요.');
 hover=pick(e.clientX,e.clientY);save(state);updateUI();
});
for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,(e)=>{const p=e as PointerEvent;if(drag?.id===p.pointerId){drag=null;world.pumpHeld=[false,false];save(state);}if(lookPointer?.id===p.pointerId)lookPointer=null;});
$('stick').addEventListener('pointerdown',e=>{if(stickId!==null||paused)return;stopRoute();stickId=e.pointerId;$('stick').setPointerCapture(e.pointerId);moveStick(e);});
function moveStick(e:PointerEvent){if(e.pointerId!==stickId)return;const r=$('stick').getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/40,y=(e.clientY-r.top-r.height/2)/40,n=Math.max(1,Math.hypot(x,y));stick={x:x/n,y:y/n};$('stick').querySelector('span')!.setAttribute('style',`transform:translate(${stick.x*32}px,${stick.y*32}px)`);}
$('stick').addEventListener('pointermove',moveStick);
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('stick').addEventListener(type,e=>{if((e as PointerEvent).pointerId===stickId){stickId=null;stick={x:0,y:0};$('stick').querySelector('span')!.setAttribute('style','');}});
function mechanismCamera(view:Shot=finalShot(state.final)){
 if(inspectLock&&view!=='door'){goCamera(new THREE.Vector3(-.85,2.12,-5.68),new THREE.Vector3(-1.45,1.86,-6.57));return;}
 if(view==='door'){goCamera(new THREE.Vector3(0,2.0,-2.7),new THREE.Vector3(0,1.75,-7.1));return;}
 const aspect=canvas.clientWidth/canvas.clientHeight;
 const data:Record<Shot,[number[],number[],number]>={heat:[[0,1.48,-4.45],[.5,.26,1],1.15],piston:[[1.08,1.83,-4.53],[.55,.35,1],.64],bridge:[[.75,2.01,-5.55],[.7,.52,1],1.2],pins:[[0,2.0,-6.49],[-.38,.7,1],1.65],door:[[0,1.6,-6.9],[0,.03,1],2.5],passage:[[0,1.6,-12],[0,0,1],2.5]};
 const [point,offset,radius]=data[view],target=new THREE.Vector3(...point as [number,number,number]);
 const d=Math.max(radius*1.5,radius/Math.max(.3,aspect)/Math.tan(25*Math.PI/180));
 goCamera(target.clone().add(new THREE.Vector3(...offset as [number,number,number]).multiplyScalar(d)),target);
}
function focusCamera(){if(focus===null)return;if(focus===4&&inspectLock){mechanismCamera();return;}if(focus===4&&(state.final.heater||state.final.t>294.15)&&state.final.valve>0){mechanismCamera();return;}const [x,z]=centers[focus],aspect=canvas.clientWidth/canvas.clientHeight;
 const distance=Math.max(focus===3?2.45:2.25,2.65/Math.max(.3,aspect)/Math.tan(25*Math.PI/180));
 let target=new THREE.Vector3(x,focus===4?1.5:1.62,z),pos=new THREE.Vector3(x,1.62+distance*.24,z+distance);
 if(focus===3&&state.gases.target===state.gases.docked&&state.gases.target&&!gasWide){const idx=['He','CO2','N2','O2'].indexOf(state.gases.target),d=Math.max(idx===2?1.5:idx===0?1.45:1.35,(world.gasCompare?.8:.65)/aspect/Math.tan(25*Math.PI/180));target.set(x-1.65+idx*1.1+(idx===2?.10:0),idx===2?1.45:idx===0?1.55:1.4,z+(idx===2?.10:-.25));pos=target.clone().add(new THREE.Vector3(0,d*(idx===1||idx===3?.63:.3),d));}
 if(focus===4){const d=Math.max(2.6,1.65/aspect/Math.tan(25*Math.PI/180));target.set(x,1.65,z+.1);pos=target.clone().add(new THREE.Vector3(0,d*.24,d));}
 if(review&&focus!==1){const d=focus===0?Math.max(1.25,.65/aspect/Math.tan(25*Math.PI/180)):Math.max(2.5,1.85/aspect/Math.tan(25*Math.PI/180));target.set(x+(focus===0?-.75:0),focus===0?1.43:1.45,z+.05);pos=target.clone().add(new THREE.Vector3(0,d*.22,d));}
 if(focus===2&&pressureView!=='all'){const d=Math.max(pressureView==='push'?1.6:2, (pressureView==='push'?.55:.95)/aspect/Math.tan(25*Math.PI/180));target.set(x+(pressureView==='push'?-.95:.75),1.5,z+.12);pos=target.clone().add(new THREE.Vector3(0,d*.22,d));}
 if(zoomed){const hit=world.hits.find(h=>h.id===(hover?.id??guidance(state,focus!,carry).target)&&h.station===focus);if(hit){const box=new THREE.Box3().setFromObject(hit.object),size=box.getSize(new THREE.Vector3());box.getCenter(target);const d=Math.max(size.y*.8,size.x*.8/aspect)/Math.tan(25*Math.PI/180)+size.z*.5+.25;pos=target.clone().add(new THREE.Vector3(0,d*.15,d));}}
 goCamera(pos,target);
}
function stopRoute(){autoRoute=null;fastRoute=false;updateJourney();}
function navigate(){
 if(review)return;if(mode==='focus'&&focus!==null&&state.solved[focus]&&!learning.done[focus]){openReview();return;}if(mode==='focus')exitFocus(false);if(mode!=='walk')return;
 const start=transition?.p??world.camera.position;routeTarget=nextLab(state);const [x,z]=centers[routeTarget];
 const end={x:routeTarget===4?0:Math.sign(x)*6.75,z:routeTarget===4?-2.7:routeTarget<2?-4:4.5};autoRoute=route({x:start.x,z:start.z},end,(a,b)=>world.valid(a,b));
 if(!autoRoute.length){autoRoute=null;toast('통로가 보이는 쪽으로 조금 이동한 뒤 다시 안내를 눌러 주세요.');return;}
 arrived=null;held.clear();cancelInput();ignoreUnlock=true;if(document.pointerLockElement)document.exitPointerLock();updateUI();
}
function updateJourney(){
 const complete=focus!==null&&focus<4&&learning.done[focus]&&guidance(state,focus,carry).key==='complete';
 $('journey').classList.toggle('hidden',paused||!!review||!(mode==='walk'||complete));
 $('journey').classList.toggle('success',complete);$('success-summary').classList.toggle('hidden',!complete);if(complete){$('success-summary').textContent=`${['공기 공급의 비밀','가열 장치의 비밀','피스톤의 비밀','기체 선택의 비밀'][Math.min(focus??0,3)]} 확인 ✓ · 다음 ${labLabel(nextLab(state))}`;$('toast').classList.add('hidden');}$('navigate').textContent=autoRoute?'이동 중 · 직접 조작으로 전환':complete?(nextLab(state)===4?'중앙 장치로 이동':'다음 실험실로 이동'):'다음 목적지 안내';
 $('manual').classList.toggle('hidden',!complete);$('skip-route').classList.toggle('hidden',!autoRoute);$('skip-route').textContent=fastRoute?'이동 중…':'이동 연출 건너뛰기';
 const near=mode==='walk'&&!autoRoute&&!transition?centers.findIndex(([x,z])=>Math.hypot(world.camera.position.x-x,world.camera.position.z-z)<2.8):-1;
 const prompt=entryPrompt({walk:mode==='walk',paused,routing:!!autoRoute,transition:!!transition,near,locked:!!document.pointerLockElement,touch:touchDevice,experienced});
 if(prompt==='enter')$('toast').classList.add('hidden');$('look-start').classList.toggle('hidden',prompt!=='look');$('enter-touch').classList.toggle('hidden',prompt!=='enter');$<HTMLButtonElement>('enter-touch').disabled=near>=0&&!canEnter(state,learning,near);$('enter-touch').textContent=near>=0&&!canEnter(state,learning,near)?`잠김 · 먼저 ${labLabel(nextLab(state))}`:near===4?'중앙 장치 시작':`제${near+1}실험실 · 실험 시작`;$('enter-touch').onclick=()=>enter(near);
 $('stick').classList.toggle('hidden',!touchDevice||mode!=='walk'||paused||!!autoRoute);
 $('rotate-tip').classList.toggle('hidden',rotationTipDismissed||zoomed||mode!=='focus'||innerWidth>=700||innerWidth>innerHeight||paused);
 $('zoom').classList.toggle('hidden',mode!=='focus'||!touchDevice||paused);$('readings').classList.toggle('hidden',mode!=='focus'||innerWidth>700||paused);
 if(mode==='walk'&&!autoRoute){const goal=nextLab(state),[gx,gz]=centers[goal],p=world.camera.position,walkPath=route({x:p.x,z:p.z},{x:goal===4?0:Math.sign(gx)*6.75,z:goal===4?-2.7:goal<2?-4:4.5},(x,z)=>world.valid(x,z)),way=walkPath.find(w=>Math.hypot(w.x-p.x,w.z-p.z)>.4)??{x:gx,z:gz},angle=Math.atan2(-(way.x-p.x),-(way.z-p.z))-yaw;const turn=Math.atan2(Math.sin(angle),Math.cos(angle));$('navigate').textContent=`${Math.abs(turn)<.5?'↑':turn>0?'←':'→'} ${labLabel(nextLab(state))} 안내`;}
}
$('navigate').onclick=()=>autoRoute?stopRoute():navigate();$('manual').onclick=()=>exitFocus();$('skip-route').onclick=()=>{fastRoute=true;};
$('rotate-tip').onclick=()=>{rotationTipDismissed=true;updateUI();};
$('zoom').onclick=()=>{if(focus===3){gasWide=!gasWide;focusCamera();return;}zoomed=!zoomed;$('zoom').textContent=zoomed?'전체 보기':'기구 확대';cancelInput();focusCamera();updateUI();};
$('readings').onclick=()=>modal('현재 측정값',$('focus-panel').innerHTML);
function showHover(){
 const complete=focus!==null&&guidance(state,focus,carry).key==='complete';const visible=!!hover&&$('toast').classList.contains('hidden')&&!review&&!transition&&!paused&&!complete&&(mode==='focus'||mode==='walk');
 world.setHover(visible?hover:null);
 $('interact').classList.toggle('hidden',!visible);
 if(mode==='walk'&&!$('enter-touch').classList.contains('hidden'))$('interact').classList.add('hidden');
 if(visible&&hover)$('interact').textContent=mode==='walk'?(!canEnter(state,learning,hover.station)?`잠김 · 먼저 ${labLabel(nextLab(state))}`:`E 실험하기 · ${hover.label}`):friendly(interaction(state,focus!,carry,hover.id));
 canvas.style.cursor=mode==='focus'?(drag?'grabbing':hover?hover.drag?'grab':'pointer':'default'):'default';
}
document.addEventListener('pointerlockchange',()=>{
 if(document.pointerLockElement){experienced=true;ignoreUnlock=false;updateUI();return;}
 held.clear();
 if(mode==='walk'&&!ignoreUnlock&&!paused)pause();
 ignoreUnlock=false;
});
document.addEventListener('keydown',e=>{
 if(!paused&&(mode==='walk'||mode==='focus')&&['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(!$('modal').classList.contains('hidden')){if(performance.now()-modalAt>250)closeModal();}else if(mode==='focus')exitFocus();else if(mode==='walk')pause();return;}
 if(review){if(e.code==='KeyH')reviewHint();return;}if(paused||mode==='menu'||mode==='end')return;
 if(e.repeat&&['KeyE','KeyH','KeyJ','KeyV','KeyM','KeyG'].includes(e.code))return;
 if(autoRoute&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))stopRoute();held.add(e.code);
 if(e.code==='KeyE'&&mode==='walk'&&!transition){
  if(hover)enter(hover.station);else {
   const near=centers.findIndex(([x,z])=>Math.hypot(world.camera.position.x-x,world.camera.position.z-z)<2.8);
   if(near>=0)enter(near);
  }
 }
 if(e.code==='KeyG'){if(autoRoute)stopRoute();else navigate();}if(e.code==='KeyH')showHint();if(e.code==='KeyJ')journal();if(e.code==='KeyV')toggleParticles();if(e.code==='KeyM')showTools();
});
document.addEventListener('keyup',e=>held.delete(e.code));
window.addEventListener('blur',()=>{held.clear();cancelInput();if(mode==='walk'||mode==='focus')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();cancelInput();if(mode!=='menu')save(state);}});
function showHint(){if(review){reviewHint();return;}hintLevel=0;discoveries.hintClicks++;renderHint();}
function renderHint(){const i=focus??nextLab(state),g=guidance(state,i,carry);state.hints[i]=Math.min(2,Math.max(state.hints[i],hintLevel));save(state);updateUI();
 const observations=['같은 병에 공기만 더하면 무게는 어떻게 될까요?','고무막의 가운데가 어느 쪽으로 움직일까요?','입구가 열려 있으면 누른 공기는 어디로 갈까요?','기체를 쓰면 풍선·불꽃·포장에 어떤 변화가 생길까요?','공기가 어디에서 출발해 무엇을 밀어야 문이 열릴까요?'];
 modal(['① 관찰 힌트','② 조작 힌트','③ 해결 도움'][hintLevel],`<p>${hintLevel===0?observations[i]:g.title}</p>${hintLevel>0?panel(i,'hint',g.detail):'<p>현상을 먼저 예상해 보세요. 조작 위치가 어렵다면 다음 도움을 누르세요.</p>'}${hintLevel===2?'<p>따라 하기를 시작하면 지금 누를 곳과 손동작을 보여 줘요. 조작은 직접 해 보세요.</p>':''}`,[...(hintLevel<2?[{id:'hint-next',label:hintLevel===0?'조작 위치 보기':'순서와 손동작 보기',fn:()=>{hintLevel++;discoveries.hintClicks++;renderHint();}}]:[]),{id:'hint-follow',label:'화면에서 따라 하기',fn:()=>{followAlong=true;closeModal();if(focus!==null){state.hints[focus]=2;focusCamera();updateUI();}}}]);
}
function targetAction(){if(focus===null)return;const g=guidance(state,focus,carry),hit=world.hits.find(h=>h.id===g.target&&h.station===focus);if(!hit)return;if(hit.drag==='piston'){dispatch({type:'piston',v:state.press.v-5});return;}if(hit.drag==='gas-valve'||hit.drag==='final-valve'){dispatch({type:hit.drag==='gas-valve'?'gasValve':'finalValve',value:1});return;}if(hit.drag?.includes('pump')||hit.drag==='vacuum')return;clickHit(hit);}
$('target-action').onclick=targetAction;
let lastMarkerLayout=0;
function updateTargetMarker(){const marker=$('target-marker');const active=mode==='focus'&&!paused&&!review&&!transition&&$('start-picture').classList.contains('hidden');const g=focus!==null?guidance(state,focus,carry):null;const target=active&&g?.target?world.hits.find(h=>h.id===g.target&&h.station===focus):null;
 marker.classList.toggle('hidden',!target);$('hint').classList.toggle('help-pulse',active&&performance.now()-lastActionAt>20000);if(!target)return;
 const p=world.project(target.object),r=canvas.getBoundingClientRect();marker.style.left=`${clamp(p.x,r.left+65,r.right-65)}px`;marker.style.top=`${clamp(p.y,r.top+55,r.bottom-50)-(innerWidth<=700?25:29)}px`;marker.dataset.target=target.id;
 const isPump=target.drag==='mass-pump'||target.drag==='vacuum';marker.classList.toggle('drag-target',isPump);marker.classList.toggle('demonstrating',followAlong||focus===0||focus===2);$('target-action').textContent=target.id==='seal'?'마개 집기':target.id==='syringe-tip'?'여기에 마개 끼우기':target.id==='piston'?'손잡이 아래로 끌기 · 누르기':isPump?'손잡이 위아래로 끌기':target.id.startsWith('port-')?['① 공기통 출구','② 가열기 입구','③ 가열기 출구','④ 피스톤 입구'][Number(target.id.slice(5))]:interaction(state,focus!,carry,target.id);
 if(performance.now()-lastMarkerLayout>250){lastMarkerLayout=performance.now();const button=$('target-action'),mr=marker.getBoundingClientRect(),br=button.getBoundingClientRect(),w=br.width,h=br.height;
 const occupied=world.visualBounds(focus!).map(b=>({left:b.left-5,right:b.right+5,top:b.top-5,bottom:b.bottom+5}));
 for(const el of Array.from(document.querySelectorAll<HTMLElement>('#hud button'))){if(el===button||!el.offsetWidth)continue;const b=el.getBoundingClientRect();occupied.push({left:b.left-4,right:b.right+4,top:b.top-4,bottom:b.bottom+4});}
 occupied.push({left:p.x-35,right:p.x+35,top:p.y-35,bottom:p.y+35});
 const candidates=[{x:p.x-w/2,y:p.y+42},{x:p.x+38,y:p.y-h/2},{x:p.x-w-38,y:p.y-h/2},{x:p.x-w/2,y:p.y-h-38}];
 for(const b of occupied)candidates.push({x:p.x-w/2,y:b.bottom+6},{x:p.x-w/2,y:b.top-h-6},{x:b.right+6,y:p.y-h/2},{x:b.left-w-6,y:p.y-h/2});
 const valid=candidates.map(c=>({x:clamp(c.x,r.left+8,r.right-w-8),y:clamp(c.y,r.top+8,r.bottom-h-8)})).filter(c=>!occupied.some(b=>c.x<b.right&&c.x+w>b.left&&c.y<b.bottom&&c.y+h>b.top));
 valid.sort((a,b)=>Math.hypot(a.x+w/2-p.x,a.y+h/2-p.y)-Math.hypot(b.x+w/2-p.x,b.y+h/2-p.y));const pos=valid[0]??{x:p.x-w/2,y:r.top+8};button.style.left=`${pos.x-mr.left}px`;button.style.top=`${pos.y-mr.top}px`;
 }
}
function toggleParticles(){world.showParticles=!world.showParticles;if(mode==='walk'&&world.showParticles)toast('실험을 열면 기체 입자 모식도를 볼 수 있어요.');updateUI();}
function resetCurrent(){if(focus!==null){discoveries.retries[focus]++;if(focus===3){discoveries.observed={He:false,CO2:false,N2:false,O2:false};lesson.sealed=false;lesson.sealedOxygen=null;lesson.compared={He:false,CO2:false,N2:false,O2:false};lesson.readyAt={He:null,CO2:null,N2:null,O2:null};world.gasCompare=false;}if(focus===2)discoveries.capHeld=false;resetStation(state,focus);carry=null;hover=null;save(state);closeModal();updateUI();toast('실험 장치를 처음으로 되돌렸어요. 얻은 회로와 기록은 유지돼요.');}}
function showTools(){
 modal('탐구 도구','<p>진행 상황은 자동 저장돼요.</p>',[
 {id:'tool-particles',label:world.showParticles?'V · 투시 끄기':'V · 기체 투시',fn:()=>{toggleParticles();closeModal();}},
 {id:'tool-journal',label:'J · 탐구 기록',fn:journal},
 ...(focus!==null&&focus<4&&state.solved[focus]?[{id:'tool-review',label:'발견한 비밀 다시 보기',fn:()=>{closeModal();openReview();}}]:[]),
 {id:'tool-route',label:'다음 목적지 안내',fn:()=>{closeModal();navigate();}},
 {id:'tool-settings',label:'그래픽·소리 설정',fn:()=>$('settings').click()},
 {id:'tool-controls',label:'조작 방법',fn:()=>$('controls').click()},
 ...(focus!==null?[{id:'tool-reset',label:'현재 실험 다시 하기',fn:resetCurrent}]:[])
 ]);
}
function journal(){
 const records=state.records.length?state.records.map(r=>`<p><strong>${r.kind}</strong><br>${r.before.toFixed(2)} → ${r.after.toFixed(2)} ${r.unit}</p>`).join(''):'<p>아직 완료한 측정이 없어요. 실험을 해결하면 실제 관찰 결과가 여기에 남습니다.</p>';
 modal('내 탐구 기록',learning.done.map((done,i)=>`<p><strong>${done?'✓':'○'} ${labLabel(i)}</strong><br>${done?concepts[i]:'개념 정리를 마치면 비밀이 기록돼요.'}</p>`).join('')+records+'<p>수치는 가상 실험 모형의 계산값입니다. 현실의 측정값과는 다를 수 있어요.</p>');
}
function packageMeaning(){
 modal('질소 포장의 두 가지 도움',`<figure class="nitrogen-lesson"><img src="${art('nitrogen-principles')}" alt="질소 주입으로 기존 공기를 배출하고 밀봉하는 과정. 산소 감소는 산화를 늦추는 데 도움을 주며 기체 완충층은 파손을 줄인다. 습기 차단에는 포장재와 밀봉이 중요하다."></figure><div class="oxygen-comparison"><span>일반 공기 <b>산소 21%</b><i style="--oxygen:21%"></i></span><span>이 봉지의 측정값 <b>산소 ${(gasOxygen(state,'N2')*100).toFixed(1)}%</b><i style="--oxygen:${gasOxygen(state,'N2')*100}%"></i></span></div><small>입자는 원리를 설명하는 모식도예요. 보존 기간을 측정한 실험은 아니에요.</small>`,[{id:'package-understood',label:'봉지에서 다시 확인하기',fn:closeModal}]);
}
function enlargeDiscovery(key:string,title:string){
 const d=document.createElement('dialog');d.className='discovery-viewer';d.setAttribute('aria-label',title);d.innerHTML=`<header><h2>${title}</h2><button autofocus aria-label="큰 그림 닫기">닫기 ✕</button></header><div class=discovery-scroll><img src="${art(key)}" alt="${title} 전체 그림"></div><p>작은 화면에서는 그림을 좌우로 밀어서 볼 수 있어요.</p>`;document.body.append(d);d.querySelector('button')!.onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close();});d.addEventListener('close',()=>d.remove());d.showModal();
}
function celebrate(){
 mode='end';focus=null;cancelInput();setExperimentView(false);save(state);sound.play('escape');
 $('hud').classList.add('hidden');$('cinematic').classList.add('hidden');$('ending').classList.remove('hidden');
 $('ending').innerHTML=`<section class="escape-reward"><div class="reward-emblem" aria-hidden="true">✦</div><p class="reward-kicker">기체 연구소 · 모든 미션 완료</p><h1>탈출 성공!</h1><p>공기의 힘으로 잠금을 풀고<br>새로운 길을 열었어요.</p><div class="reward-chain">공기 가열 → 피스톤 상승 → 연결 프레임 상승<br>→ 양쪽 잠금핀 해제 → 자동문 열림</div><button id="discoveries-next" class="primary">내가 밝혀낸 비밀 보기</button></section>`;
 $('discoveries-next').onclick=()=>{
 $('ending').innerHTML=`<section class="escape-reward discoveries"><p class="reward-kicker">네 번의 관찰, 하나의 탈출</p><h1>내가 밝혀낸 기체의 비밀</h1><div class="discovery-grid">${[['mass','01 공기의 무게','공기는 눈에 안 보여도 무게가 있어요.'],['temperature','02 온도와 기체','따뜻해진 공기는 부피가 커지거나 압력이 높아질 수 있어요.'],['pressure','03 압력과 부피','누르면 작아지고, 바깥 압력이 낮아지면 커져요.'],['gases','04 여러 가지 기체','기체마다 성질이 달라 쓰임도 달라요.']].map(([img,title,text])=>`<article><button class=discovery-enlarge data-art="${img}" data-title="${title}" aria-label="${title} 그림 크게 보기"><img src="${art(img)}" alt="${title}"><span>그림 크게 보기 ⤢</span></button><b>${title}</b><p>${text}</p></article>`).join('')}</div><p>이제 나의 발견과 측정값을 포스터로 남겨요.</p><button id="poster-next" class="primary">내 탐구 포스터 보기</button></section>`;
 document.querySelectorAll<HTMLButtonElement>('.discovery-enlarge').forEach(b=>b.onclick=()=>enlargeDiscovery(b.dataset.art!,b.dataset.title!));$('poster-next').onclick=end;
 };
}
function end(){
 mode='end';focus=null;setExperimentView(false);ignoreUnlock=true;if(document.pointerLockElement)document.exitPointerLock();
 $('menu').classList.add('hidden');$('hud').classList.add('hidden');$('cinematic').classList.add('hidden');$('ending').classList.remove('hidden');
 $('ending').innerHTML=poster(state)+`<div class=report-actions><button id=print-record class=primary>한 장 포스터 인쇄 / PDF 저장</button><button id=download-record class=ghost>측정 기록 저장</button><button id=replay class=ghost>처음부터 다시</button></div>`;
 $('print-record').onclick=()=>window.print();
 $('replay').onclick=()=>begin(false);$('download-record').onclick=()=>{
  const text=['내가 해결한 기체의 비밀',...state.records.map(r=>`${r.kind}: ${r.before.toFixed(3)} → ${r.after.toFixed(3)} ${r.unit}`),`플레이 시간: ${state.elapsed.toFixed(0)}초`].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));a.download='내_기체_탐구_기록.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 };save(state);
}
if(touchDevice){document.querySelector('.start-help')!.innerHTML='<b>손으로 움직이며 탐험해요</b><span>왼쪽 스틱으로 이동 · 오른쪽 화면을 끌어 둘러보기</span><span>기구는 터치로 선택 · 손잡이는 직접 끌기</span><span>길이 어렵다면 다음 목적지 안내를 눌러 보세요.</span>';$('hint').textContent='힌트';$('tools').textContent='도구';$('back').textContent='돌아가기';$('pause').textContent='쉬기';}

function observeCamera(){const p=world.jar.getWorldPosition(new THREE.Vector3());world.camera.position.copy(p).add(new THREE.Vector3(.24,.54,.64));world.camera.lookAt(p.clone().add(new THREE.Vector3(0,.40,0)));}
$('heat-observe').onclick=()=>{autoHeat=false;heatObserve=!heatObserve;zoomed=false;cancelInput();if(!heatObserve)focusCamera();else transition=null;updateUI();};
$('review-open').onclick=()=>openReview();
function openReview(){if(focus===3&&!allObserved(discoveries)){toast('각 기체의 변화를 보고 관찰 완료를 눌러 주세요.');return;}$('start-picture').classList.add('hidden');if(focus===null||focus>3||!state.solved[focus])return;reviewPending=0;review=new Review(state,focus,learning.seen[focus]);heatObserve=false;zoomed=false;carry=null;cancelInput();held.clear();ignoreUnlock=true;if(document.pointerLockElement)document.exitPointerLock();world.reviewing=true;document.body.classList.add('reviewing');$('review').classList.remove('hidden');$('toast').classList.add('hidden');world.resize();renderReview();focusCamera();updateUI();save(state);}
function closeReview(){if(!review)return;learning.seen[review.index]=[...review.seen];review=null;world.reviewing=false;document.body.classList.remove('reviewing');$('review').classList.add('hidden');world.resize();focusCamera();save(state);updateUI();}
function finishReview(){if(!review?.ready)return;const i=review.index;learning.done[i]=true;learning.seen[i]=[...review.seen];closeReview();world.unlockPulse=1;sound.play('success');$('journey').classList.remove('unlock');void $('journey').offsetWidth;$('journey').classList.add('unlock');save(state);updateUI();}
function reviewHint(){if(!review)return;discoveries.hintClicks++;save(state);review.feedback=['넣기 전과 후를 각각 저울에 올린 뒤, 더 무거워진 상태를 눌러 확인하세요.','따뜻한 물과 차가운 물을 선택하고 고무막이 변할 때까지 잠깐 관찰하세요.','주사기를 밀어 보고, 풍선 바깥의 공기도 빼 보세요. 두 부피를 비교하세요.','기체를 먼저 선택한 뒤 쓰임 장치를 고르세요. 산소는 타는 것을 돕고, 이산화 탄소는 불을 꺼요.'][review.index];updateReview();}
function renderReview(){if(!review)return;const i=review.index;
 const buttons=i===0?`<div class="compare-choices"><button data-mass="before"><span class="bottle-icon">◯</span><b>공기를 넣기 전</b><small>${state.mass.baseline?.toFixed(2)} g · 저울에 올리기</small></button><button data-mass="after"><span class="bottle-icon filled">◉</span><b>공기를 넣은 후</b><small>${state.mass.after?.toFixed(2)} g · 저울에 올리기</small></button></div><p class="review-question">같은 병에서 달라진 것은 공기의 양이에요.</p><div class="review-row"><button data-heavy="after">두 무게의 차이 확인</button></div>`:
 i===1?`<div class="review-row"><button data-temp="293.15">처음 상태</button><button data-temp="${Math.max(state.heat.max,315.15)}">따뜻한 물</button><button data-temp="${Math.min(state.heat.min,283.15)}">차가운 물</button></div><label class="slider-label">온도를 천천히 바꿔 보세요<input id="review-temperature" type="range" min="278.15" max="328.15" step=".5" value="293.15"></label><p class="review-condition">단단한 유리병은 그대로예요. 입구에 고정된 유연한 고무막이 움직입니다.<br>곧은 점선 = 처음 위치<br>둥근 금색선 = 따뜻할 때 모습</p>`:
 i===2?`<div class="pressure-controls"><label>① 밀폐 주사기<input id="review-push" type="range" min="30" max="60" value="60" step="1"></label><button id="review-push-tap">피스톤 밀어 보기</button><label>② 풍선 바깥 압력<input id="review-vacuum" type="range" min=".4" max="1" value="1" step=".02"></label><button id="review-vacuum-tap">바깥 공기 빼 보기</button></div><p class="review-condition">공기의 양·온도는 같게 비교해요. 움직이는 피스톤과 유연한 풍선에서 부피가 달라집니다.</p>`:
 `<div class="gas-pairing"><div>${(['O2','CO2','N2','He'] as Gas[]).map((g,j)=>`<button data-gas="${g}">${['산소','이산화 탄소','질소','헬륨'][j]} <small></small></button>`).join('')}</div><div>${(['He','N2','O2','CO2'] as Gas[]).map((g,j)=>`<button data-use="${g}">${['풍선 띄우기','식품 포장','타는 것을 돕기','불 끄기'][j]}</button>`).join('')}</div></div>`;
 $('review').innerHTML=`<div class="review-title"><span class="eyebrow">발견 0${i+1} · ${labLabel(i)}</span><h2>이번 실험에서<br>발견한 비밀</h2><p>${['같은 병, 공기만 달라졌어요.','같은 구도에서 고무막을 비교해요.','두 장치에서 반대 변화를 찾아요.','기체와 쓰임을 직접 연결해요.'][i]}</p></div><div class="review-picture">${diagram(i,i===2?'push':'all')}</div><div class="review-value" id="review-value"></div><div class="review-controls">${buttons}</div><p id="review-feedback" role="status" aria-live="polite"></p><p id="review-concept" class="hidden"></p><div class="review-actions"><button id="review-finish" class="primary" disabled>확인하고 잠금 해제</button><button id="review-hint" class="ghost">도움</button><button id="review-later" class="ghost">실험으로</button></div>`;
 for(const b of Array.from(document.querySelectorAll<HTMLElement>('[data-mass]')))b.onclick=()=>{review!.mass(b.dataset.mass as 'before'|'after');sound.play('click');updateReview();};
 for(const b of Array.from(document.querySelectorAll<HTMLElement>('[data-heavy]')))b.onclick=()=>{review!.heavier(b.dataset.heavy!);updateReview();};
 for(const b of Array.from(document.querySelectorAll<HTMLElement>('[data-temp]')))b.onclick=()=>{review!.temperature(Number(b.dataset.temp));$<HTMLInputElement>('review-temperature').value=b.dataset.temp!;updateReview();};
 if(i===1)$('review-temperature').oninput=()=>review!.temperature(Number($<HTMLInputElement>('review-temperature').value));
 if(i===2){$('review-push').oninput=()=>review!.pressure('push',Number($<HTMLInputElement>('review-push').value));$('review-vacuum').oninput=()=>review!.pressure('vacuum',Number($<HTMLInputElement>('review-vacuum').value));$('review-push-tap').onclick=()=>{review!.pressure('push',30);$<HTMLInputElement>('review-push').value='30';};$('review-vacuum-tap').onclick=()=>{review!.pressure('vacuum',.4);$<HTMLInputElement>('review-vacuum').value='.4';};}
 for(const b of Array.from(document.querySelectorAll<HTMLElement>('[data-gas]')))b.onclick=()=>{review!.selected=b.dataset.gas as Gas;review!.feedback='쓸 장치를 선택하세요.';updateReview();};
 for(const b of Array.from(document.querySelectorAll<HTMLElement>('[data-use]')))b.onclick=()=>{const ok=review!.connect(b.dataset.use as Gas);sound.play(ok?'click':'pump');updateReview();};
 $('review').scrollTop=0;$('review-finish').onclick=finishReview;$('review-hint').onclick=reviewHint;$('review-later').onclick=closeReview;updateReview();
}
function updateReview(){if(!review)return;if(review.index===2){const next=review.chosen==='vacuum'?'vacuum':'push';if(pressureView!==next){pressureView=next;focusCamera();}const picture=document.querySelector('.review-picture');if(picture)picture.innerHTML=diagram(2,next);}$('review-value').textContent=review.value;$('review-feedback').textContent=review.feedback||'직접 조작하며 실험 전후를 비교해 보세요.';$('review-concept').classList.toggle('hidden',!review.ready);$('review-concept').textContent='✓ '+concepts[review.index];$<HTMLButtonElement>('review-finish').disabled=!review.ready;
 for(const b of Array.from(document.querySelectorAll<HTMLElement>('[data-mass],[data-temp],[data-gas],[data-use]'))){const key=b.dataset.mass??b.dataset.gas??b.dataset.use;const done=!!key&&review.seen.has(key);b.classList.toggle('observed',done);b.setAttribute('aria-pressed',String(b.dataset.gas===review.selected||b.dataset.mass===review.chosen));if(b.dataset.use)b.textContent=(({'He':'풍선 띄우기','N2':'식품 포장','O2':'타는 것을 돕기','CO2':'불 끄기'} as Record<string,string>)[b.dataset.use]??'')+(done?' ✓':'');}
 learning.seen[review.index]=[...review.seen];save(state);
}
$('start').onclick=()=>{if(load())modal('새 탐구를 시작할까요?','<p>현재 브라우저의 이어하기 기록을 새 탐구로 바꿉니다.</p>',[{id:'new-confirm',label:'새로 시작',fn:()=>{$('modal').classList.add('hidden');begin(false);}}]);else begin(false);};
$('continue').onclick=()=>begin(true);
$('controls').onclick=()=>modal('직접 움직여 발견하세요','<p><strong>방향키 ↑ ↓ ← → 또는 W A S D</strong>로 이동하고 마우스로 둘러봅니다.<br><strong>E 또는 클릭</strong>으로 가까운 실험대를 살펴봅니다.</p><p>병은 클릭해 집고, 놓을 받침을 클릭하세요. 드래그해 옮길 수도 있어요.<br>터치 화면에서는 왼쪽 스틱으로 이동하고 오른쪽 빈 곳을 끌어 둘러보세요.<br>펌프는 한 번 잡고 위아래로, 피스톤은 위아래로 드래그합니다.<br>제4실험실은 큰 공급 버튼을 누르면 밸브가 자동으로 열립니다. 밸브 직접 조작은 선택 사항입니다.<br>연결관은 첫 단자를 누른 뒤 다른 단자를 눌러 잇습니다.</p><p><strong>Esc</strong> 돌아가기 / 일시정지　<strong>H</strong> 3단계 힌트<br><strong>G</strong> 다음 목적지 안내　<strong>J</strong> 탐구 기록　진행 상황은 자동 저장됩니다.</p><p>가상 실험입니다. 뜨거운 물·압축 기체·연소 실험은 실제로 따라 하지 마세요.</p>');
$('settings').onclick=()=>{modal('설정','<div class="row"><label for="quality">그래픽 품질</label><select id="quality"><option value="high">고품질</option><option value="normal" selected>일반</option><option value="low">저사양</option></select></div><div class="row"><label for="audio">장치 효과음</label><input id="audio" type="checkbox" checked></div><p>시점 이동 중 불편하면 마우스를 천천히 움직이세요. 화면 흔들림은 사용하지 않습니다.</p>');$<HTMLSelectElement>('quality').value=localStorage.getItem('gas-quality')||'normal';$('quality').onchange=()=>{const val=$<HTMLSelectElement>('quality').value;world.quality(val);localStorage.setItem('gas-quality',val);};$<HTMLInputElement>('audio').checked=sound.enabled;$('audio').onchange=()=>sound.enabled=$<HTMLInputElement>('audio').checked;};
$('navigate').title='다음 목적지 자동 이동 · PC 단축키 G';
$('look-start').onclick=lock;
$('hint').onclick=showHint;$('tools').onclick=showTools;$('pause').onclick=pause;$('back').onclick=()=>exitFocus();
window.addEventListener('resize',()=>{cancelInput();world.resize();if(mode==='focus'){zoomed=false;focusCamera();}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelInput();if(mode!=='menu')save(state);modal('화면을 다시 준비하고 있어요','<p>진행 상황을 저장했어요. 화면이 돌아오지 않으면 새로고침해 이어할 수 있어요.</p>',[{id:'reload-game',label:'새로고침',fn:()=>location.reload()}]);});
canvas.addEventListener('webglcontextrestored',()=>location.reload());
window.addEventListener('beforeunload',()=>{if(mode!=='menu')save(state);});
let prev=performance.now(),lastIdle=0;
function frame(now:number){
 requestAnimationFrame(frame);if(document.hidden){prev=now;return;}if(ready&&!transition&&(paused||mode==='end'||mode==='menu')&&now-lastIdle<100){prev=now;return;}lastIdle=now;const dt=Math.min(.05,(now-prev)/1000);prev=now;
 if(ready&&!paused&&mode!=='menu'&&mode!=='end'&&!review){
  if(reviewPending>0){reviewPending-=dt;if(reviewPending<=0&&mode==='focus'&&focus!==null&&!learning.done[focus])openReview();}
  const before=state.solved.join();if(!review){step(state,dt);record(state,discoveries);trackExperience(state,lesson);if(state.gases.docked&&state.gases.done[state.gases.docked])state.gases.valve=0;}if(before!==state.solved.join())success();
  if(mode==='walk'&&!transition){
   world.camera.rotation.set(pitch,yaw,0,'YXZ');
   const forward=-stick.y+Number(held.has('KeyW')||held.has('ArrowUp'))-Number(held.has('KeyS')||held.has('ArrowDown')),side=stick.x+Number(held.has('KeyD')||held.has('ArrowRight'))-Number(held.has('KeyA')||held.has('ArrowLeft'));
   const norm=Math.hypot(forward,side)||1,speed=2.5*dt/norm;
   const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;
   const p=world.camera.position;if(autoRoute){const to=autoRoute[0],distance=Math.hypot(to.x-p.x,to.z-p.z),move=Math.min(distance,(fastRoute?14:2.8)*dt),nx=p.x+(to.x-p.x)/Math.max(distance,.001)*move,nz=p.z+(to.z-p.z)/Math.max(distance,.001)*move;
    if(world.valid(nx,nz)){p.x=nx;p.z=nz;}else{stopRoute();toast('이동을 멈췄어요. 직접 이동하거나 다시 안내를 눌러 주세요.');}
    const targetYaw=Math.atan2(-(to.x-p.x),-(to.z-p.z));yaw+=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw))*Math.min(1,dt*5);pitch*=Math.max(0,1-dt*5);
    if(distance<=move+.000001&&autoRoute){autoRoute.shift();if(!autoRoute.length){autoRoute=null;arrived=routeTarget;fastRoute=false;const [cx,cz]=centers[arrived!];yaw=Math.atan2(-(cx-p.x),-(cz-p.z));goCamera(p.clone(),new THREE.Vector3(cx,1.65,cz));$('toast').classList.add('hidden');}}
   }else {if(world.valid(p.x+dx,p.z))p.x+=dx;if(world.valid(p.x,p.z+dz))p.z+=dz;}
   state.position={x:p.x,z:p.z,yaw,pitch};
   hover=world.pick(innerWidth/2,innerHeight/2,null);showHover();
  }
  if(mode==='focus'&&focus===4&&(state.final.heater||state.final.t>294.15)&&state.final.valve>0){shot=finalShot(state.final);if(shot!==lastShot){lastShot=shot;zoomed=false;updateUI();mechanismCamera(shot);}}
  if(state.final.open>0&&mode!=='cinematic'){
   mode='cinematic';focus=null;setExperimentView(false);ignoreUnlock=true;document.exitPointerLock();$('hud').classList.add('hidden');$('cinematic').classList.remove('hidden');
   $('toast').classList.add('hidden');world.setHover(null);world.compareMechanism=false;
   mechanismCamera('door');$('cinematic').querySelector('p')!.textContent='공기의 힘으로 잠금 해제! 전동문이 열려요.';sound.play('door');
  }
  if(state.final.escaped&&mode==='cinematic'){
   if(passageTime===0)passageStart.copy(world.camera.position);passageTime+=dt;transition=null;const t=clamp(passageTime/8,0,1),e=t*t*(3-2*t);
   world.camera.position.lerpVectors(passageStart,new THREE.Vector3(.55,1.7,-17),e);world.camera.lookAt(-.5,1.8,-23);
   $('cinematic').querySelector('p')!.textContent=passageTime<2?'공기의 힘으로 열린 길!':'직접 만든 탈출구를 지나가요.';
   if(passageTime>=8)celebrate();
  }
  if(now-lastSave>3000){save(state);lastSave=now;}
  if(now-lastUI>250){updateUI();lastUI=now;}
 }
 if(transition){
  transition.t+=dt;const t=clamp(transition.t/.45,0,1),e=t*t*(3-2*t);
  world.camera.position.lerpVectors(transition.fromP,transition.p,e);world.camera.quaternion.slerpQuaternions(transition.fromQ,transition.q,e);
  if(t===1)transition=null;
 }
 if(review&&!paused){review.tick(dt);if(now-lastUI>120){updateReview();lastUI=now;}learning.seen[review.index]=[...review.seen];}
 if(focus===2&&!review&&!drag&&pressureAuto&&state.press.syringe&&pressureView==='push'){pressureAuto=false;pressureView='vacuum';focusCamera();}
 const compareLabels=$('compare-labels');compareLabels.classList.toggle('hidden',focus!==3||!world.gasCompare||!!review||paused);if(focus===3&&world.gasCompare&&state.gases.target){const r=canvas.getBoundingClientRect(),idx=['He','CO2','N2','O2'].indexOf(state.gases.target),before=world.project(world.gasGhosts[idx]),after=world.project(idx===0?world.helium:idx===2?world.snackBag:world.flames[idx===1?0:1]);compareLabels.style.cssText=`left:0;top:${r.top+12}px;width:100%`;const labels=idx===0?['공기 풍선','헬륨 풍선']:idx===2?['포장 전','밀봉 후']:['공급 전','공급 후'];compareLabels.innerHTML=labels.map((t,i)=>`<span style="left:${clamp(i?after.x:before.x,r.left+55,r.right-55)}px">${t}</span>`).join('');}
 world.packSealed=lesson.sealed;world.pressureView=pressureView;world.detailView=focus===1&&(heatObserve||review?.index===1);if(ready)world.update(review?.preview??state,paused?0:dt,mode==='cinematic'?4:focus);
 if(autoHeat&&heatObserve&&!review&&state.heat.hot&&state.heat.at==='hot'&&state.heat.t>324){heatObserve=false;autoHeat=false;focusCamera();}
 if((heatObserve||review?.index===1)&&!transition&&focus===1)observeCamera();
 updateTargetMarker();world.render();
}
requestAnimationFrame(frame);
document.fonts.load('600 20px Pretendard').then(()=>world.load(text=>{$('load-text').textContent=text;$('load-bar').style.width=`${Math.min(93,15+world.assets.size*4)}%`;})).then(()=>{
 ready=true;world.quality(localStorage.getItem('gas-quality')||(touchDevice?'low':'normal'));$('loading').classList.add('hidden');$('start').removeAttribute('disabled');if(load())$('continue').removeAttribute('disabled');
}).catch(err=>{$('load-text').textContent='장비를 불러오지 못했습니다. 새로고침해 주세요.';$('load-text').classList.add('error');console.error(err);});
// Dev-only instrumentation. Vite removes this branch from production.
if(import.meta.env.DEV){
 Object.assign(window,{__lab:{
  get review(){return review;},get learning(){return learning;},get ready(){return ready;},get state(){return state;},get mode(){return mode;},get transitioning(){return !!transition;},world,
  start:()=>begin(false),focus:(i:number)=>{if(mode==='focus'){mode='walk';focus=null;}enter(i);},
  hit:(id:string)=>{const h=world.hits.find(h=>h.id===id);return h?world.project(h.object):null;},
  dispatch,advance:(seconds:number)=>{for(let t=0;t<seconds;t+=.025){step(state,.025);trackExperience(state,lesson)};world.update(state,.05,focus);updateUI();},
  walkTo:(x:number,z:number)=>{if(!world.valid(x,z))throw Error('Collision');world.camera.position.set(x,1.65,z);state.position.x=x;state.position.z=z;},
  snapshot:()=>({drawCalls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles,renderMs:world.drawMs})
 }});
}

if('serviceWorker' in navigator&&location.protocol!=='file:'&&!import.meta.env.DEV)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>toast('오프라인 준비를 완료하지 못했어요. 인터넷 연결 상태에서는 계속할 수 있어요.')));

