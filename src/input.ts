/** One grab can contain many strokes. A stroke rearms only near the upper stop. */
export class PumpStroke {
 position=0; armed=true; last:number; travel:number;
 constructor(y:number,travel=56){this.last=y;this.travel=Math.max(36,travel);}
 move(y:number){const dy=y-this.last;this.last=y;this.position=Math.max(0,Math.min(1,this.position+dy/this.travel));
  if(this.position<=.12)this.armed=true;
  if(this.armed&&this.position>=.94){this.armed=false;return true;}return false;
 }
}
export type Point={x:number;z:number};
/** Grid search uses the same collision predicate as manual movement, including segments. */
export function route(start:Point,end:Point,valid:(x:number,z:number)=>boolean):Point[]{
 const step=.25,key=(x:number,z:number)=>`${x},${z}`,point=(x:number,z:number)=>({x:x*step,z:z*step});
 const clear=(a:Point,b:Point)=>{const n=Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.08);for(let i=0;i<=n;i++){const t=n?i/n:0;if(!valid(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;};
 let sx=Math.round(start.x/step),sz=Math.round(start.z/step);const ex=Math.round(end.x/step),ez=Math.round(end.z/step);
 if(!valid(start.x,start.z)||!valid(end.x,end.z))return [];
 if(!clear(start,point(sx,sz))){const candidates=[];for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const p=point(sx+dx,sz+dz);if(clear(start,p))candidates.push({x:sx+dx,z:sz+dz,d:Math.hypot(p.x-start.x,p.z-start.z)});}candidates.sort((a,b)=>a.d-b.d);if(!candidates.length)return [];sx=candidates[0].x;sz=candidates[0].z;}
 const queue:[[number,number]]|[number,number][]=[[sx,sz]],parents=new Map<string,string|null>([[key(sx,sz),null]]);let found=false;
 for(let index=0;index<queue.length&&index<20000;index++){
  const [x,z]=queue[index];if(x===ex&&z===ez){found=true;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(Math.abs(nx)>50||Math.abs(nz)>28||parents.has(k)||!clear(point(x,z),point(nx,nz)))continue;parents.set(k,key(x,z));queue.push([nx,nz]);}
 }
 if(!found)return [];let k:string|null=key(ex,ez);const raw:Point[]=[end];while(k){const [x,z]=k.split(',').map(Number);raw.push(point(x,z));k=parents.get(k)??null;}raw.reverse();
 const result:Point[]=[];let from=start;for(let i=0;i<raw.length;){let j=i;while(j+1<raw.length&&clear(from,raw[j+1]))j++;result.push(raw[j]);from=raw[j];i=j+1;}return result;
}
