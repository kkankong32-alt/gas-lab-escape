import * as T from 'three';
const steel=new T.MeshStandardMaterial({color:0xb5c6cd,metalness:.88,roughness:.24});
const seal=new T.MeshStandardMaterial({color:0x14262d,roughness:.76});
const hoseMat=new T.MeshStandardMaterial({color:0x25363d,roughness:.61,metalness:.12});
export type Port={id:string;node:T.Group;medium:'gas'|'electric';radius:number};
export type Line={id:string;a:Port;b:Port;mesh:T.Mesh<T.TubeGeometry>;curve:T.CatmullRomCurve3;via:T.Vector3[];dynamic:boolean;last:string};
const V=(a:number[])=>new T.Vector3(...a as [number,number,number]);
export class ConnectionNetwork{
 ports=new Map<string,Port>();lines:Line[]=[];
 constructor(public root:T.Object3D){}
 port(id:string,owner:T.Object3D,position:number[],normal:number[],radius=.018,depth=.045,medium:'gas'|'electric'='gas'){
  if(this.ports.has(id))throw Error('Duplicate port '+id);
  const node=new T.Group();node.name='port:'+id;node.position.copy(V(position));node.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),V(normal).normalize());owner.add(node);
  // Hollow compression fitting; origin is the actual hose seating face, not the housing centre.
  const profile=[[radius*.72,-depth],[radius*1.3,-depth],[radius*1.3,-depth*.5],[radius*1.12,-depth*.35],[radius*1.12,0],[radius*.72,0],[radius*.72,-depth]].map(([r,y])=>new T.Vector2(r,y));
  const body=new T.Mesh(new T.LatheGeometry(profile,32),steel);node.add(body);
  const nut=new T.Mesh(new T.LatheGeometry([[radius*.72,-depth*.70],[radius*1.65,-depth*.70],[radius*1.65,-depth*.45],[radius*.72,-depth*.45],[radius*.72,-depth*.70]].map(([r,y])=>new T.Vector2(r,y)),6),steel);node.add(nut);
  const ring=new T.Mesh(new T.TorusGeometry(radius*1.14,radius*.10,8,32),seal);ring.rotation.x=Math.PI/2;ring.position.y=-depth*.13;node.add(ring);
  const port:Port={id,node,medium,radius};this.ports.set(id,port);return port;
 }
 point(p:Port){this.root.updateWorldMatrix(true,false);p.node.updateWorldMatrix(true,false);return this.root.worldToLocal(p.node.getWorldPosition(new T.Vector3()));}
 axis(p:Port){const q=p.node.getWorldQuaternion(new T.Quaternion()),r=this.root.getWorldQuaternion(new T.Quaternion()).invert();return new T.Vector3(0,1,0).applyQuaternion(q).applyQuaternion(r).normalize();}
 connect(id:string,a:Port,b:Port,via:number[][]=[],dynamic=false,r=.014,material:T.Material=hoseMat){
  if(a.medium!==b.medium)throw Error('Incompatible connection '+id);
  const mesh=new T.Mesh(new T.TubeGeometry(new T.LineCurve3(new T.Vector3(),new T.Vector3(0,.01,0)),1,r,12,false),material);mesh.name='line:'+id;mesh.castShadow=true;this.root.add(mesh);
  const line:Line={id,a,b,mesh,curve:null!,via:via.map(V),dynamic,last:''};this.lines.push(line);this.refresh(line);return line;
 }
 refresh(l:Line){const a=this.point(l.a),b=this.point(l.b),na=this.axis(l.a),nb=this.axis(l.b),lead=Math.min(.075,a.distanceTo(b)*.30);
  const key=[...a.toArray(),...b.toArray(),...na.toArray(),...nb.toArray()].map(n=>n.toFixed(5)).join(',');if(key===l.last)return;l.last=key;
  const points=[a,a.clone().addScaledVector(na,lead),...l.via,b.clone().addScaledVector(nb,lead),b];l.curve=new T.CatmullRomCurve3(points,false,'centripetal');const radius=l.mesh.geometry.parameters.radius;
  // Reuse GPU buffers while moving. Rebuilding/disposal per frame caused GC and uploads.
  const segments=48,radial=8;
  if(l.mesh.geometry.parameters.tubularSegments!==segments){l.mesh.geometry.dispose();l.mesh.geometry=new T.TubeGeometry(l.curve,segments,radius,radial,false);return;}
  const frames=l.curve.computeFrenetFrames(segments,false),pos=l.mesh.geometry.attributes.position,norm=l.mesh.geometry.attributes.normal;
  for(let i=0;i<=segments;i++){const p=l.curve.getPointAt(i/segments);for(let j=0;j<=radial;j++){const a=j/radial*Math.PI*2,c=-Math.cos(a),s=Math.sin(a),n=frames.normals[i].clone().multiplyScalar(c).addScaledVector(frames.binormals[i],s),k=i*(radial+1)+j;norm.setXYZ(k,n.x,n.y,n.z);pos.setXYZ(k,p.x+radius*n.x,p.y+radius*n.y,p.z+radius*n.z);}}
  pos.needsUpdate=norm.needsUpdate=true;l.mesh.geometry.computeBoundingSphere();
 }
 update(){for(const l of this.lines)if(l.dynamic)this.refresh(l);}
 audit(){return this.lines.map(l=>({id:l.id,from:l.a.id,to:l.b.id,medium:l.a.medium,visible:l.mesh.visible,start:this.point(l.a).toArray(),end:this.point(l.b).toArray(),startGap:l.curve.getPoint(0).distanceTo(this.point(l.a)),endGap:l.curve.getPoint(1).distanceTo(this.point(l.b)),startAlignment:l.curve.getTangent(0).dot(this.axis(l.a)),endAlignment:-l.curve.getTangent(1).dot(this.axis(l.b))}));}
}
