import {fresh,type State} from './science';
const KEY='gas-escape-v1';
export function save(s:State){try{localStorage.setItem(KEY,JSON.stringify(s));return true;}catch{return false;}}
export function load():State|null{
 try{
  const x=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!x||x.version!==1||!Array.isArray(x.solved)||x.solved.length!==4)return null;
  const n=fresh();
  const compatible=(value:unknown,template:unknown):boolean=>{
   if(template===null)return value===null||typeof value==='string'||typeof value==='number'&&Number.isFinite(value);
   if(Array.isArray(template))return Array.isArray(value);
   if(typeof template==='number')return typeof value==='number'&&Number.isFinite(value);
   if(typeof template==='object')return !!value&&typeof value==='object'&&Object.entries(template as object).every(([k,v])=>compatible((value as Record<string,unknown>)[k],v));
   return typeof value===typeof template;
  };
  if(!compatible(x,n)||!x.solved.every((v:unknown)=>typeof v==='boolean')||x.hints.length!==5||!x.hints.every((v:number)=>Number.isInteger(v)&&v>=0&&v<=2))return null;
  if(!x.final.links.every((v:unknown)=>typeof v==='string'&&/^[0-3]-[0-3]$/.test(v)))return null;
  for(const k of ['mass','heat','press','gases','final','position'] as const)if(!x[k]||typeof x[k]!=='object')return null;
  if(!Number.isFinite(x.mass.n)||x.mass.n<0||!Number.isFinite(x.heat.t)||!Number.isFinite(x.position.x))return null;
  return {...n,...x};
 }catch{return null;}
}
