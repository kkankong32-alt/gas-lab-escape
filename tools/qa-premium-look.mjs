import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),p=await b.newPage({viewport:{width:1600,height:900}});p.on('pageerror',e=>console.log(e.message));await p.goto('http://127.0.0.1:5173/');await p.waitForFunction(()=>window.__lab?.ready);await p.screenshot({path:'qa/premium-title.png'});await p.locator('#start').click();await p.screenshot({path:'qa/premium-lobby.png'});
await b.close();
