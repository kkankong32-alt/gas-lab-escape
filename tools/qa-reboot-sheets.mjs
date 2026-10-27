import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),p=await b.newPage({viewport:{width:1600,height:580}});const data=async n=>'data:image/png;base64,'+(await fs.readFile('qa/'+n)).toString('base64');const font='data:font/woff2;base64,'+(await fs.readFile('src/assets/PretendardVariable.woff2')).toString('base64');
const css=`@font-face{font-family:p;src:url(${font})}*{box-sizing:border-box}body{margin:0;padding:24px;background:#091b25;color:#e6f6f0;font-family:p}h1{font-size:30px;margin:0 0 8px}p{font-size:18px;color:#b5cdd2;margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}article{background:#15313d;border:1px solid #43616c;border-radius:10px;overflow:hidden}h2{font-size:20px;margin:12px 16px}img{display:block;width:100%;height:300px;object-fit:contain;background:#07141d}`;
async function sheet(name,title,note,items,extra=''){await p.setContent(`<style>${css}${extra}</style><h1>${title}</h1><p>${note}</p><div class=grid>${(await Promise.all(items.map(async([n,t])=>`<article><h2>${t}</h2><img src="${await data(n)}"></article>`))).join('')}</div>`);await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:'qa/'+name+'.png',fullPage:true});}
await sheet('reboot-before-after','UI 리부트 · 수정 전 / 수정 후','왼쪽: 이전 버전 / 오른쪽: 이번 수정본. 게임에서 캡처한 화면입니다.',[
['before-reboot/premium-title.png','이전 · 타이틀'],['reboot-title-1600.png','현재 · 타이틀'],
['before-reboot/device-layout-1600-900-0.png','이전 · 제목과 첫 실험'],['device-layout-1600-900-0.png','현재 · 제목과 첫 실험'],
['before-reboot/device-layout-1600-900-4.png','이전 · 모니터와 기구'],['reboot-console-4.png','현재 · 압력계와 기구'],
['before-reboot/review-layout-1600-0.png','이전 · 개념 정리'],['review-layout-1600-0.png','현재 · 직접 비교'],
['before-reboot/device-layout-1600-900-4.png','이전 · 최종 활동'],['reboot-console-0.png','현재 · 단계별 최종 활동']],'.grid{grid-template-columns:repeat(2,1fr)}img{height:390px}');
await sheet('reboot-final-flow','중앙 탈출 장치 · 여섯 단계','완료된 실험 상태에서 실제 버튼으로 연결 · 관찰 대기 시간만 가속',[
['reboot-console-0.png','01 · 저장통에서 시작'],['reboot-console-1.png','02 · 가열 입구 연결'],['reboot-console-2.png','03 · 피스톤 입구 연결'],['reboot-console-3.png','04 · 밸브와 가열'],['reboot-console-4.png','05 · 압력으로 피스톤 이동'],['reboot-console-door.png','06 · 탈출 문 잠금 해제']]);
await sheet('reboot-route','제1실험실 → 제2실험실','실제 전체 플레이 중 캡처한 성공 · 개념 정리 · 이동 장면',[
['ux-09-mass-success.png','01 · 공기 무게 확인 성공'],['pc-walk-review-0.png','02 · 전후 무게 비교'],['ux-10-next-goal.png','03 · 다음 목표와 경로'],['device-phone-arrival-1.png','04 · 터치 이동 도착'],['ux-11-next-lab.png','05 · 방향키 이동 도착'],['device-tablet-arrival-1.png','06 · 태블릿 도착']]);
await sheet('reboot-devices','화면 크기별 기구와 UI','실제 휴대전화 하드웨어 검증이 아닌 Chrome 화면·터치 에뮬레이션입니다.',[
['device-layout-390-844-4.png','390×844 · 최종 장치'],['device-layout-844-390-3.png','844×390 · 기체 선택'],['device-layout-1024-768-4.png','1024×768 · 최종 장치'],['device-layout-1280-720-0.png','1280×720 · 첫 실험'],['device-layout-1600-900-1.png','1600×900 · 온도 실험'],['device-layout-1920-1080-4.png','1920×1080 · 최종 장치']]);
await sheet('membrane-comparison','고무막 · 같은 구도에서 세 상태 비교','둘레 고정 / 흰 점선: 처음 높이 / 둥근 금색선: 따뜻할 때의 윤곽',[
['membrane-initial.png','처음 · 20 °C'],['membrane-hot.png','따뜻한 물 · 55 °C'],['membrane-cold.png','차가운 물 · 5 °C']], 'article{position:relative;height:440px}article img{position:absolute;width:1200px;height:675px;max-width:none;left:-190px;top:-80px;object-fit:fill}h2{position:relative;z-index:2;background:#15313d;margin:0;padding:14px}');
await b.close();
