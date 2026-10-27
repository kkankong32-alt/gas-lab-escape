import * as T from 'three';
const metal=new T.MeshStandardMaterial({color:0x9aafb8,metalness:.88,roughness:.24});
const brass=new T.MeshStandardMaterial({color:0xb69052,metalness:.8,roughness:.3});
export class PressureGauge extends T.Group {
 needle=new T.Group();
 constructor(public max=250,public radius=.12){super();this.name='pressure-gauge';
  const shell=new T.Mesh(new T.CylinderGeometry(radius,radius*.92,.07,64),metal);shell.rotation.x=Math.PI/2;this.add(shell);
  const bezel=new T.Mesh(new T.TorusGeometry(radius*.93,radius*.07,16,80),metal);bezel.position.z=.042;this.add(bezel);
  const c=document.createElement('canvas');c.width=c.height=768;const ctx=c.getContext('2d')!;ctx.fillStyle='#f5f1df';ctx.fillRect(0,0,768,768);ctx.translate(384,384);ctx.fillStyle='#203843';
  for(let i=0;i<=50;i++){const a=(-225+i*5.4)*Math.PI/180;ctx.strokeStyle='#203843';ctx.lineWidth=i%10===0?8:3;ctx.beginPath();ctx.moveTo(Math.cos(a)*(i%10===0?232:260),Math.sin(a)*(i%10===0?232:260));ctx.lineTo(Math.cos(a)*292,Math.sin(a)*292);ctx.stroke();if(i%10===0){ctx.font='bold 47px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(max*i/50),Math.cos(a)*192,Math.sin(a)*192);}}
  ctx.fillStyle='#3b5460';ctx.font='bold 41px Arial';ctx.textAlign='center';ctx.fillText('kPa',0,135);ctx.font='24px Arial';ctx.fillText('ABSOLUTE',0,172);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const face=new T.Mesh(new T.CircleGeometry(radius*.86,80),new T.MeshBasicMaterial({map:tex}));face.position.z=.039;this.add(face);
  const needle=new T.Mesh(new T.ConeGeometry(radius*.045,radius*.68,12),new T.MeshStandardMaterial({color:0xcc583a,metalness:.4,roughness:.35}));needle.rotation.z=-Math.PI/2;needle.position.x=radius*.28;this.needle.add(needle);this.needle.position.z=.047;this.add(this.needle);
  const cap=new T.Mesh(new T.SphereGeometry(radius*.09,20,12),metal);cap.scale.z=.3;cap.position.z=.05;this.add(cap);
  const stem=new T.Mesh(new T.CylinderGeometry(.024,.024,.13,24),brass);stem.position.y=-radius-.045;this.add(stem);for(let i=0;i<3;i++){const nut=new T.Mesh(new T.CylinderGeometry(.035,.035,.018,6),brass);nut.position.y=-radius-.025-i*.032;this.add(nut);}
  this.setValue(101.3);
 }
 setValue(kpa:number){this.needle.rotation.z=(225-Math.max(0,Math.min(1,kpa/this.max))*270)*Math.PI/180;this.userData.kPa=kpa;}
}
export function rigidTube(a:T.Vector3,b:T.Vector3,r=.025,material:T.Material=metal){const d=b.clone().sub(a),m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),24),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
