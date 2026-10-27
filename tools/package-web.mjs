import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const files=[];
async function visit(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await visit(p);else if(e.name!=='sw.js')files.push('./'+p.slice(5));}}
await visit('dist');
const version=crypto.createHash('sha256');for(const f of files)version.update(await fs.readFile('dist/'+f.slice(2)));
const cache='gas-lab-'+version.digest('hex').slice(0,16);
await fs.writeFile('dist/sw.js',`const CACHE=${JSON.stringify(cache)},FILES=${JSON.stringify(files)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('gas-lab-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(e.request,{ignoreSearch:true,ignoreVary:true});if(cached)return cached;if(e.request.mode==='navigate')return (await c.match('./index.html'))||fetch(e.request);return fetch(e.request);}));});`);
console.log('PWA precache:',files.length,'local files; version',cache);
