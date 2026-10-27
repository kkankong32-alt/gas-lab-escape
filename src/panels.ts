import {experience} from './experience';
import {exploration} from './exploration';
import {type State,gasOxygen,balloonEquilibrium} from './science';
const imageURLs=new Map<string,string>();
export function art(name:string){
 const key=`assets/illustrations/${name.includes('.')?name:name+'.png'}`;const cached=imageURLs.get(key);if(cached)return cached;
 const embedded=(window as unknown as {__assetMap?:Record<string,string>}).__assetMap?.[key];
 let url=`./${key}`;
 if(embedded){const raw=atob(embedded.split(',')[1]),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);url=URL.createObjectURL(new Blob([bytes],{type:name.endsWith('.svg')?'image/svg+xml':'image/png'}));}
 imageURLs.set(key,url);return url;
}
export const questions=['공기를 더 넣으면 무게가 달라질까요?','따뜻할 때와 차가울 때, 고무막은 어떻게 될까요?','같은 공기를 누를 때와 바깥 공기를 뺄 때는?','어떤 기체를 어떤 장치에 쓰면 좋을까요?','공기의 힘으로 문을 열려면 어떻게 연결할까요?'];
export function diagram(i:number,part='all'){
 const name=['mass','temperature','pressure','gases','mechanism.svg'][i];
 return `<figure class="science-diagram illustrated ${i===2&&part!=='all'?'pressure-crop '+part:''}"><img src="${art(name)}" alt="${questions[i]}" decoding="async"></figure>`;
}
export function panel(i:number,kind:'start'|'hint'|'review',detail='') {return `<div class="picture-panel ${i===4?'mechanism-panel':''}"><span class="panel-tag">${kind==='start'?'탐구 미리보기':kind==='hint'?'그림으로 보는 도움':'전후 비교로 발견하기'}</span><h3>${questions[i]}</h3>${diagram(i)}${i===4?'<div class="mechanism-legend"><span>① 공기통 · 공기를 보내요</span><span>② 가열기 · 공기를 데워요</span><span>③ 피스톤 · 막대를 밀어요</span><span>④ 잠금핀 · 빠지면 문이 열려요</span></div>':''}<p>${detail||['① 같은 병의 무게 재기 → ② 공기를 넣고 다시 재기','① 따뜻한 물에서 관찰 → ② 닦고 차가운 물에서 비교','① 주사기 속 같은 공기 누르기 → ② 풍선 바깥 공기 빼기','① 기체 고르기 → ② 쓸 장치 연결 → ③ 공급 버튼 누르기','공기를 데우면 압력이 높아져요. 피스톤이 금속 막대와 잠금핀을 들어 올리면 문이 열려요.'][i]}</p></div>`;}
export function poster(s:State){const log=exploration(s),e=experience(s),delta=s.mass.after!==null&&s.mass.baseline!==null?(s.mass.after-s.mass.baseline).toFixed(2):'—';const records=[['공기 무게 변화',`+${delta} g`,`${s.mass.strokes}회 직접 주입`],['온도 관찰',`${(s.heat.min-273.15).toFixed(1)} ~ ${(s.heat.max-273.15).toFixed(1)} °C`,'관찰한 최저 · 최고'],['부피 관찰',`${e.minSyringe.toFixed(0)} / ${log.maxBalloon.toFixed(0)} mL`,'주사기 최소 / 풍선 최대'],['내가 밀봉한 봉지',e.sealedOxygen!==null?`${e.sealedOxygen.toFixed(1)} %`:'이전 기록 없음','밀봉한 순간의 산소 비율'],['도움을 받고 다시 도전',log.tracked?`${log.hintClicks} / ${log.retries.reduce((a,b)=>a+b,0)}회`:'이전 기록 없음','힌트 / 다시 실험'],['나의 탈출 시간',`${Math.floor(s.elapsed/60)}분 ${Math.floor(s.elapsed%60)}초`,'실제 탐구 진행 시간']];return `<article class="research-poster art-poster"><div class="poster-illustration"><img class="poster-art" src="${art('poster')}" alt="네 실험과 공기의 힘으로 문을 여는 원리"><div class="poster-date">${new Date().toLocaleDateString('ko-KR')} · 나만의 과학 탐험</div>${['공기를 더 넣으면 무게가 늘어요','따뜻하면 볼록, 차가우면 오목','누르면 줄고, 바깥 공기를 빼면 커져요','기체마다 알맞은 쓰임이 있어요'].map((t,i)=>`<strong class="poster-value value-${i}">${t}</strong>`).join('')}<div class="poster-note">공기를 데우면 높아진 압력이 피스톤을 밀어요.<br><small>내 손으로 기체의 성질을 밝혀냈어요!</small></div></div><section class="personal-record"><h2>나의 탐구 기록</h2><div>${records.map(([label,value,detail])=>`<section><span>${label}</span><strong>${value}</strong><small>${detail}</small></section>`).join('')}</div><p>직접 조작한 가상 실험 모형의 실제 계산 기록 · 기록하지 않은 값은 추정하지 않았어요.</p></section></article>`;}
