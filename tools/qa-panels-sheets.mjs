import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),p=await b.newPage({viewport:{width:1600,height:580}});const data=async n=>'data:image/png;base64,'+(await fs.readFile('qa/'+n)).toString('base64');const font='data:font/woff2;base64,'+(await fs.readFile('src/assets/PretendardVariable.woff2')).toString('base64');
const css=`@font-face{font-family:p;src:url(${font})}*{box-sizing:border-box}body{margin:0;padding:24px;background:#091b25;color:#e6f6f0;font-family:p}h1{font-size:30px;margin:0 0 8px}p{font-size:18px;color:#b5cdd2;margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}article{background:#15313d;border:1px solid #43616c;border-radius:10px;overflow:hidden}h2{font-size:20px;margin:12px 16px}img{display:block;width:100%;height:300px;object-fit:contain;background:#07141d}`;
async function sheet(name,title,note,items,extra=''){await p.setContent(`<style>${css}${extra}</style><h1>${title}</h1><p>${note}</p><div class=grid>${(await Promise.all(items.map(async([n,t])=>`<article><h2>${t}</h2><img src="${await data(n)}"></article>`))).join('')}</div>`);await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:'qa/'+name+'.png',fullPage:true});}
await sheet('panels-overview','그림으로 이해하고 직접 조작하는 탐구','현재 실행본에서 캡처한 시작 · 조작 · 결과 화면',[
['panels-pressure-start.png','제3실험 · 그림으로 시작'],['panels-pressure-hint.png','현재 행동과 그림 힌트'],['review-layout-1600-2.png','두 압력 현상 다시 비교'],['panels-co2-during.png','이산화 탄소 · 서서히 꺼짐'],['panels-nitrogen-after.png','질소 · 산소 감소와 포장 안정'],['panels-pdf-0.png','한 장 탐구 포스터 PDF']]);
await sheet('panels-before-after','설명 · 조작 · 결과 화면 비교','왼쪽 이전 버전 / 오른쪽 현재 버전',[
['before-panels/device-layout-1600-900-2.png','이전 · 압력 실험'],['panels-pressure-push.png','현재 · 주사기를 크게'],
['before-panels/device-layout-1600-900-3.png','이전 · 기체 실험'],['panels-nitrogen-after.png','현재 · 큰 조작과 산소 표시'],
['before-panels/review-layout-1600-2.png','이전 · 개념 정리'],['review-layout-1600-2.png','현재 · 비교 그림과 조작'],
['before-panels/08-ending.png','이전 · 결과'],['panels-ending.png','현재 · 탐구 포스터']],'.grid{grid-template-columns:repeat(2,1fr)}img{height:400px}');
await b.close();
