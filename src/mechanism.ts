import {LOCK,lockClearance} from './lock-geometry';
import * as T from 'three';import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';import {rigidTube} from './gauges';
export class DoorLinkage extends T.Group {
 moving=new T.Group();forceDirections=new T.Group();pins:T.Mesh[]=[];receivers:T.Group[]=[];stroke=0;clearance=0;statusRings:T.Mesh<T.TorusGeometry,T.MeshStandardMaterial>[]=[];
 constructor(){super();this.name='piston-door-linkage';const steel=new T.MeshStandardMaterial({color:0xb6c5cd,metalness:.9,roughness:.25}),dark=new T.MeshStandardMaterial({color:0x233d49,metalness:.7,roughness:.32}),gold=new T.MeshStandardMaterial({color:0xe3b869,metalness:.75,roughness:.3});
 const box=(parent:T.Object3D,size:number[],pos:number[],mat:T.Material)=>{const m=new T.Mesh(new RoundedBoxGeometry(...size as [number,number,number],3,.012),mat);m.position.set(...pos as [number,number,number]);parent.add(m);return m;};
 // Continuous load path: piston head -> rigid push bridge -> rear yoke -> two pins.
 this.moving.position.set(1.08,LOCK.headY,-.08);this.add(this.moving);
 const shoe=box(this.moving,[.2,.08,.22],[0,.04,0],gold);shoe.name='piston-contact-shoe';box(this.moving,[.09,.09,2.13],[0,.04,-1.02],steel);const crossbar=box(this.moving,[2.90,.1,.12],[-1.08,.04,-2.04],steel);crossbar.name='pin-crossbar';
 // Vertical piston lifts a single braced fork: no implied horizontal-to-vertical conversion.
 // Both load branches physically join the piston shoe and the pin crosshead.
 const loadMetal=new T.MeshStandardMaterial({color:0x53c4ae,metalness:.75,roughness:.27});
 for(const end of [-2.53,.37]){
  const brace=rigidTube(new T.Vector3(0,.04,-.04),new T.Vector3(end,.04,-2.04),.035);brace.material=loadMetal;this.moving.add(brace);
  const collar=box(this.moving,[.22,.14,.22],[end,.06,-2.04],gold);collar.name='pin-load-collar';
 }
 this.moving.add(this.forceDirections);
 for(const [x,z] of [[0,.17],[-2.53,-1.85],[.37,-1.85]])this.forceDirections.add(new T.ArrowHelper(new T.Vector3(0,1,0),new T.Vector3(x,.08,z),.28,0x97ffe0,.09,.065));
 for(const x of [-1.45,1.45]){const pin=new T.Mesh(new T.CylinderGeometry(.035,.035,LOCK.pinLength,32),gold);pin.name='locking-pin';pin.position.set(x-1.08,-LOCK.pinLength/2,LOCK.z+.08);this.moving.add(pin);this.pins.push(pin);const nut=new T.Mesh(new T.CylinderGeometry(.07,.07,.06,6),steel);nut.position.set(x-1.08,.155,-2.04);this.moving.add(nut);
  const receiver=new T.Group();receiver.name='door-mounted-lock-eye';receiver.position.set(x,(LOCK.receiverTop+LOCK.receiverBottom)/2,LOCK.z);this.add(receiver);this.receivers.push(receiver);
  const profile=[[.052,-.06],[.10,-.06],[.10,.06],[.052,.06],[.052,-.06]].map(([r,y])=>new T.Vector2(r,y));receiver.add(new T.Mesh(new T.LatheGeometry(profile,64),dark));const status=new T.Mesh(new T.TorusGeometry(.07,.009,12,40),new T.MeshStandardMaterial({color:0xd49b54,emissive:0x75451c,emissiveIntensity:.6}));status.rotation.x=Math.PI/2;status.position.y=.05;receiver.add(status);this.statusRings.push(status);box(receiver,[.22,.3,.045],[0,0,-.215],steel);box(receiver,[.16,.04,.235],[0,-.06,-.11],steel);
  for(const dx of [-.075,.075])for(const dy of [-.1,.1]){const screw=new T.Mesh(new T.CylinderGeometry(.018,.018,.018,6),gold);screw.rotation.x=Math.PI/2;screw.position.set(dx,dy,-.185);receiver.add(screw);}
 }
 // Fixed lower guide is mechanically attached to the door FRAME, not the moving leaf.
 for(const side of [-1,1]){
  const x=side*LOCK.x,guide=new T.Group();guide.name='fixed-frame-guide';guide.position.set(x,1.55,LOCK.z);this.add(guide);
  const profile=[[.052,-.04],[.105,-.04],[.105,.04],[.052,.04],[.052,-.04]].map(([r,y])=>new T.Vector2(r,y));
  guide.add(new T.Mesh(new T.LatheGeometry(profile,48),steel));
  box(this,[.64,.075,.10],[side*1.86,1.55,LOCK.z],dark);
  box(this,[.15,.24,.19],[side*2.16,1.55,LOCK.z-.065],steel);
 }
 // Guides constrain the bridge to vertical translation; posts carry it to the floor.
 // Annular rear bearings slide along fixed rods; front uses the existing cylinder frame.
 for(const dx of [-.15,.15]){
  const x=1.08+dx;this.add(rigidTube(new T.Vector3(x,1.05,-2.12),new T.Vector3(x,2.50,-2.12),.018,steel));
  const sleeve=new T.Mesh(new T.LatheGeometry([[.020,-.08],[.039,-.08],[.039,.08],[.020,.08],[.020,-.08]].map(([r,y])=>new T.Vector2(r,y)),32),gold);sleeve.position.set(dx,.04,-2.04);sleeve.name='rear-sliding-bearing';this.moving.add(sleeve);
  box(this,[.14,.08,.18],[x,1.05,-2.12],steel);
 }
 box(this.moving,[.38,.04,.08],[0,.04,-2.04],steel);box(this,[.38,.06,.12],[1.08,2.50,-2.12],steel);
 // Door-front mount frame, visible even in isolated apparatus view.
 for(const x of [-2.16,2.16])box(this,[.11,3.1,.13],[x,1.55,-2.25],dark);box(this,[4.43,.12,.13],[0,3.04,-2.25],dark);
 // A fixed support beneath the rear guide prevents a floating mechanism.
 for(const dx of [-.15,.15])box(this,[.065,1.03,.09],[1.08+dx,.515,-2.12],dark);
 this.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
 }
 update(stroke:number,open:number){this.stroke=stroke;this.forceDirections.visible=stroke>.025&&open===0;this.moving.position.y=LOCK.headY+stroke*LOCK.travel;this.clearance=lockClearance(stroke);this.statusRings.forEach(r=>{r.material.color.setHex(this.clearance>0?0x83f6bd:0xd49b54);r.material.emissive.setHex(this.clearance>0?0x279b6a:0x75451c);});this.receivers.forEach((r,i)=>r.position.x=(i?1:-1)*(1.45+open*2.2));}
}

