import {chromium} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const p=await b.newPage({viewport:{width:1123,height:794}});
await p.goto(pathToFileURL(path.resolve('사용자테스트/교사용_빠른_관찰_기록지.html')).href);
await p.emulateMedia({media:'print'});
await p.screenshot({path:'qa/candidate-observation-sheet.png',fullPage:true});
await b.close();
