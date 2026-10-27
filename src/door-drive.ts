import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// Pneumatic piston releases the lock; an electric belt drive supplies horizontal door work.
export class DoorDrive extends T.Group{
 pulleys:T.Mesh[]=[];clamps:T.Group[]=[];indicator:T.Mesh<T.SphereGeometry,T.MeshStandardMaterial>;
 constructor(){super();this.name='electric-sliding-door-drive';const metal=new T.MeshStandardMaterial({color:0x9cb7c1,metalness:.85,roughness:.3}),dark=new T.MeshStandardMaterial({color:0x223c46,metalness:.65,roughness:.4}),rubber=new T.MeshStandardMaterial({color:0x15252c,roughness:.85});
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,mat:T.Material,parent:T.Object3D=this)=>{const m=new T.Mesh(new RoundedBoxGeometry(w,h,d,3,.01),mat);m.position.set(x,y,z);parent.add(m);return m;};
 box(9,.12,.18,0,3.35,-6.86,dark);box(9,.08,.10,0,3.10,-6.74,metal);
 for(const x of [-4.25,4.25]){const p=new T.Mesh(new T.CylinderGeometry(.09,.09,.055,32),metal);p.rotation.x=Math.PI/2;p.position.set(x,3.27,-6.64);this.add(p);this.pulleys.push(p);const wrap=new T.Mesh(new T.TorusGeometry(.09,.008,6,24,Math.PI),rubber);wrap.position.set(x,3.27,-6.64);wrap.rotation.z=x>0?-Math.PI/2:Math.PI/2;this.add(wrap);const hub=box(.11,.025,.065,x,3.27,-6.60,dark);p.attach(hub);}
 for(const y of [3.18,3.36])box(8.5,.016,.035,0,y,-6.64,rubber);
 box(.38,.3,.28,4.25,3.27,-6.87,dark);
 this.indicator=new T.Mesh(new T.SphereGeometry(.035,12,8),new T.MeshStandardMaterial({color:0xcbaa60,emissive:0x473510}));this.indicator.position.set(4.25,3.27,-6.70);this.add(this.indicator);
 for(let i=0;i<2;i++){const c=new T.Group();c.name='door-belt-clamp';c.position.x=i?1.01:-1.01;this.add(c);this.clamps.push(c);const beltY=i?3.18:3.36;box(.14,.055,.08,0,beltY,-6.64,metal,c);box(.07,beltyHeight(beltY),.08,0,(beltY+3.06)/2,-6.64,metal,c);box(.16,.10,.18,0,3.06,-6.72,metal,c);}
 this.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
 }
 update(open:number){for(let i=0;i<2;i++)this.clamps[i].position.x=(i?1:-1)*(1.01+open*2.2);for(const p of this.pulleys)p.rotation.y=open*2.2/.09;this.indicator.material.emissive.setHex(open>0?0x3dc28e:0x473510);}
}
const beltyHeight=(y:number)=>y-3.06;
