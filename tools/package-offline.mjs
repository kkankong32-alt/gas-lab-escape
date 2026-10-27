import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const dist=path.join(root,'dist');
let html=await fs.readFile(path.join(dist,'index.html'),'utf8');
const cssPath=html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/)[1];
const jsPath=html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/)[1];
const js=await fs.readFile(path.join(dist,jsPath.replace(/^\//,'')),'utf8');
let css=await fs.readFile(path.join(dist,cssPath.replace(/^\//,'')),'utf8');
for(const match of [...css.matchAll(/url\(([^)]+\.woff2)\)/g)]){const rel=match[1].replaceAll('\"','').replaceAll("'",'');const file=path.resolve(dist,path.dirname(cssPath.replace(/^\//,'')),rel);css=css.replace(match[0],`url(data:font/woff2;base64,${(await fs.readFile(file)).toString('base64')})`);}
const mime={'.svg':'image/svg+xml','.gltf':'model/gltf+json','.glb':'model/gltf-binary','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg','.hdr':'application/octet-stream'};
const assets={};
async function visit(dir){
 for(const e of await fs.readdir(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);if(e.isDirectory())await visit(p);else if(mime[path.extname(p)]){
   const key=path.relative(dist,p).replaceAll('\\','/');assets[key]=`data:${mime[path.extname(p)]};base64,${(await fs.readFile(p)).toString('base64')}`;
  }
 }
}
await visit(path.join(dist,'assets'));
html=html.replace(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/,'');
html=html.replace(/<link rel="stylesheet"[^>]*>/,()=>`<style>${css}</style>`);
const icon=(await fs.readFile(path.join(dist,'favicon.svg'))).toString('base64');
html=html.replace('./favicon.svg',`data:image/svg+xml;base64,${icon}`);
html=html.replace(/<link rel="manifest"[^>]*>/,'');
html=html.replace('</body>',()=>`<script>window.__assetMap=${JSON.stringify(assets)};</script><script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script></body>`);
await fs.writeFile(path.join(root,'게임_시작.html'),html);
await fs.writeFile(path.join(root,'게임_실행.cmd'),'@echo off\r\nstart "" "%~dp0게임_시작.html"\r\n','utf8');
console.log(`Offline game: ${(Buffer.byteLength(html)/1024/1024).toFixed(1)} MB, ${Object.keys(assets).length} embedded assets.`);

