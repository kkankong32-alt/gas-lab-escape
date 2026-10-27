import {DoorDrive} from './door-drive';
import {ApparatusConnections} from './apparatus-connections';
import {exitAtrium} from './exit-scene';
import {PressureGauge,rigidTube} from './gauges';
import {flameMesh,Smoke} from './flame';
import {DoorLinkage} from './mechanism';
import {instrument} from './instruments';
import {route as planRoute} from './input';
import {membraneHeight,labNames} from './learning';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {airGrams,balloonEquilibrium,gasOxygen,membraneVolume,P0,pressure,T0,type State,type Gas} from './science';
export const names=['보이지 않는 무게','뜨거워지는 비밀','압력의 반전','네 가지 기체의 비밀','중앙 기체 제어장치'];
export const colors=[0x63daca,0xf2b76b,0x83b8ff,0xc2b3ed,0x65e0d0];
export const centers=[[-9,-5.3],[9,-5.3],[-9,3],[9,3],[0,-4.45]];
export type Hit={id:string;label:string;object:THREE.Object3D;station:number;drag?:string};
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export class World {
 connections!:ApparatusConnections;doorDrive=new DoorDrive();
 compareMechanism=false;mechanismGhost=new THREE.Group();escapeHall=new THREE.Group();
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(57,innerWidth/innerHeight,.035,65);
 renderer:THREE.WebGLRenderer;loader=new GLTFLoader();assets=new Map<string,THREE.Group>();
 inspectionObjects:{id:string;object:THREE.Object3D;station:number}[]=[];
 stations:THREE.Group[]=[];hits:Hit[]=[];ray=new THREE.Raycaster();pointer=new THREE.Vector2();
 bottle!:THREE.Group;jar!:THREE.Group;syringe!:THREE.Group;balloon!:THREE.Mesh;helium!:THREE.Mesh;
 membrane!:THREE.Mesh;doors:THREE.Group[]=[];displays:{canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;tex:THREE.CanvasTexture}[]=[];
 indicators:THREE.Mesh[]=[];pumpHandles:THREE.Object3D[]=[];pumpRods:THREE.Object3D[]=[];pumpMotion=[0,0];pumpHeld=[false,false];valves:THREE.Group[]=[];actuator!:THREE.Group;
 pressureFittings:THREE.Mesh[]=[];gauges:PressureGauge[]=[];linkage!:DoorLinkage;smoke!:Smoke;co2Burning=true;flameGhosts:THREE.Mesh[]=[];
 flames:THREE.Mesh[]=[];pipes:THREE.Group=new THREE.Group();lastLinks='';particleGroup=new THREE.Group();particles!:THREE.Points;showParticles=false;
 high=true;frame=0;lastMembrane=NaN;lastBag='';screenKeys:string[]=[];signKeys=new WeakMap<HTMLCanvasElement,string>();obstacles:{x:number;z:number;w:number;d:number}[]=[];drawMs=0;
 massHose!:THREE.Mesh;vacuumPlate!:THREE.Object3D;lever!:THREE.Group;cartridges:THREE.Group[]=[];gasHose=new THREE.Group();gasCompare=false;packSealed=false;sealMotion=0;gasConnect=0;valveTurns=[0,0];flameLights:THREE.PointLight[]=[];gasGhosts:THREE.Group[]=[];bagSkin!:THREE.Mesh<THREE.BoxGeometry>;bagBase!:Float32Array;sealer!:THREE.Group;lastGas='';payload!:THREE.Group;heliumThread!:THREE.Mesh;doorBolts:THREE.Group[]=[];
 keyLight=new THREE.DirectionalLight(0xe7f5ff,2.0);hovered:THREE.Object3D|null=null;highlight=new THREE.Box3Helper(new THREE.Box3(),0x9df5de);
 carry:string|null=null;guideLab:number|null=null;guideTarget:string|undefined;
 guideBox=new THREE.Box3Helper(new THREE.Box3(),0xffd989);route=new THREE.Group();lastRoute='';
 access:string[]=['active','locked','locked','locked'];unlockPulse=0;signs:{canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;tex:THREE.CanvasTexture;station:number}[]=[];baselineRing!:THREE.LineLoop;membraneDot!:THREE.Mesh;warmOutline!:THREE.Line;
 halo=new THREE.Sprite();architecture:THREE.Object3D[]=[];
 intro=0;lobbyIndicators:THREE.Mesh[]=[];
 mats={metal:new THREE.MeshStandardMaterial({color:0x647a84,metalness:.8,roughness:.28}),dark:new THREE.MeshStandardMaterial({color:0x122128,metalness:.65,roughness:.4}),teal:new THREE.MeshStandardMaterial({color:0x53e6d2,emissive:0x268c80,emissiveIntensity:.5}),glass:new THREE.MeshPhysicalMaterial({color:0xc0e3e6,metalness:0,roughness:.12,transmission:0,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide})};
 constructor(public canvas:HTMLCanvasElement){
  const embedded=(window as unknown as {__assetMap?:Record<string,string>}).__assetMap;
  if(embedded)THREE.DefaultLoadingManager.setURLModifier(url=>{
   if(url.startsWith('data:')||url.startsWith('blob:'))return url;
   const match=url.replaceAll('\\','/').match(/(?:^|\/)(assets\/.*)$/);
   return match&&embedded[match[1]]?embedded[match[1]]:url;
  });
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  this.renderer.setSize(innerWidth,innerHeight,false);this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.scene.background=new THREE.Color(0x111d24);this.scene.fog=new THREE.Fog(0x111d24,19,48);
  this.scene.add(new THREE.HemisphereLight(0xc1e1ed,0x28343b,1.45));
  this.keyLight.position.set(1,5,1);this.keyLight.castShadow=true;this.keyLight.shadow.mapSize.set(1024,1024);
  Object.assign(this.keyLight.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:15});this.keyLight.shadow.bias=-.0003;this.keyLight.shadow.normalBias=.015;
  this.scene.add(this.keyLight,this.keyLight.target);this.highlight.visible=false;this.scene.add(this.highlight,this.guideBox,this.route);
  const glow=document.createElement('canvas');glow.width=glow.height=128;const gc=glow.getContext('2d')!,gradient=gc.createRadialGradient(64,64,25,64,64,64);gradient.addColorStop(0,'#6fffe000');gradient.addColorStop(.55,'#6fffe070');gradient.addColorStop(1,'#6fffe000');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);this.halo.material=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glow),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});this.scene.add(this.halo);this.guideBox.visible=false;
  this.camera.position.set(-6.8,2.05,-2.8);this.camera.lookAt(-9,1.4,-5.3);
 }
 async load(onProgress:(s:string)=>void){
  const env=['WallAstra_Straight','WallAstra_Straight_Window','WallBand_Straight','Platform_Metal','Platform_CenterPlate','Door_Frame_SquareTall','Door_DarkMetal','Prop_Computer','Prop_Vent_Wide','Prop_Crate3','Prop_Light_Wide','Prop_Cable_3','TopCables_Straight','Prop_Barrel_Large'];
  let n=0;
  await Promise.all(env.map(async name=>{this.assets.set(name,(await this.loader.loadAsync(`./assets/environment/${name}.gltf`)).scene);onProgress(`연구소 조립 중 · ${++n}/${env.length}`);}));
  const hdr=await new RGBELoader().loadAsync('./assets/studio.hdr');hdr.mapping=THREE.EquirectangularReflectionMapping;
  const pm=new THREE.PMREMGenerator(this.renderer);this.scene.environment=pm.fromEquirectangular(hdr).texture;this.scene.environmentIntensity=.6;hdr.dispose();pm.dispose();
  const tl=new THREE.TextureLoader();
  const maps=await Promise.all(['Diffuse','nor_gl','Rough','Metal'].map(x=>tl.loadAsync(`./assets/metal-${x}.jpg`)));
  maps.forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,2);});maps[0].colorSpace=THREE.SRGBColorSpace;
  this.mats.metal.map=maps[0];this.mats.metal.normalMap=maps[1];this.mats.metal.roughnessMap=maps[2];this.mats.metal.metalnessMap=maps[3];
  this.buildArchitecture();this.architecture=this.scene.children.filter(o=>!(o instanceof THREE.Light)&&o!==this.keyLight.target&&o!==this.highlight&&o!==this.guideBox&&o!==this.route&&o!==this.halo);
  // Title and environment are ready before apparatus loads.
  this.render();onProgress('정밀 실험기구를 준비하고 있습니다');
  await Promise.all(['bottle','balance','pump','jar','bath','syringe','chamber','cartridge','valve','actuator','lever','cell','pouch','bolt','monitor','towel'].map(async name=>{
   const root=(await this.loader.loadAsync(`./assets/instruments/${name}.glb`)).scene;
   this.compact(root);this.assets.set(name,root);
  }));
  await Promise.all(['counter_counter','cabinet_cabinet','bottle_glassware_erlenmeyer_flask_medium','bottle_test_tube_rack','machine_microscope','heating_equipment_bunsen_burner'].map(async name=>this.assets.set(name,(await this.loader.loadAsync(`./assets/lab/${name}.glb`)).scene)));
  this.buildStations();this.connections=new ApparatusConnections(this);this.buildParticles();
  const entryLabel=this.label('01  공기의 무게',-6.12,2.35,-4,1.7,this.scene,'#c2fff0',75);entryLabel.rotation.y=Math.PI/2;this.architecture.push(entryLabel);
  this.scene.add(this.escapeHall);this.escapeHall.name='opened-escape-passage';
  exitAtrium(this.escapeHall,this.model.bind(this));
  this.label('탐구 완료 · 연구소 밖 도착 구역',0,3.5,-15,5,this.escapeHall,'#f8e2b2',66);

  this.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=!(o.material instanceof THREE.ShaderMaterial);o.receiveShadow=true;}});
 }
 model(name:string,pos:THREE.Vector3,dimensions?:THREE.Vector3,rotation=0,parent:THREE.Object3D=this.scene){
  const raw=this.assets.get(name)!.clone(true),g=new THREE.Group();g.add(raw);
  if(dimensions){
   const b=new THREE.Box3().setFromObject(raw),size=b.getSize(v()),c=b.getCenter(v());
   raw.position.sub(c);
   g.scale.set(dimensions.x/Math.max(size.x,.001),dimensions.y/Math.max(size.y,.001),dimensions.z/Math.max(size.z,.001));
  }
  g.position.copy(pos);g.rotation.y=rotation;parent.add(g);return g;
 }
 apparatus(name:string,x:number,z:number,parent:THREE.Object3D,scale=1.8){
  const g=this.model(name,v(x,1.01,z),undefined,0,parent);g.scale.setScalar(scale);this.inspectionObjects.push({id:name,object:g,station:this.stations.indexOf(parent as THREE.Group)});
  // Transparent surfaces remain legible and avoid screen-space transmission sorting.
  g.traverse(o=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.MeshStandardMaterial&&/glass|PET/i.test(o.material.name)){
   o.material=this.mats.glass;
  }});
  return g;
 }
 label(text:string,x:number,y:number,z:number,w:number,parent:THREE.Object3D=this.scene,color='#bce8e7',size=40){
  const c=document.createElement('canvas'),ctx=c.getContext('2d')!;
  const font=`600 ${w<1.5?Math.max(size,72):size}px "Pretendard",sans-serif`;
  ctx.font=font;c.width=Math.ceil(Math.max(256,ctx.measureText(text).width+96));c.height=128;
  ctx.fillStyle='#102b38';ctx.beginPath();ctx.roundRect(4,4,c.width-8,120,22);ctx.fill();ctx.strokeStyle='#80b6ba';ctx.lineWidth=4;ctx.stroke();ctx.font=font;ctx.fillStyle='#f3fff9';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,64,c.width-64);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:THREE.FrontSide});
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,w*c.height/c.width),m);p.position.set(x,y,z);parent.add(p);const station=this.stations.indexOf(parent as THREE.Group);if(station>=0)this.inspectionObjects.push({id:'label:'+text,object:p,station});return p;
 }
 light(x:number,z:number,color:number=0xc8e7f0){
  const light=new THREE.PointLight(color,22,10,2);light.position.set(x,2.8,z);this.scene.add(light);
  this.model('Prop_Light_Wide',v(x,2.98,z),v(1.5,.12,.4));
  return light;
 }
 buildArchitecture(){
  const floor=(cx:number,cz:number,w:number,d:number)=>{
   for(let x=cx-w/2+1;x<cx+w/2;x+=2)for(let z=cz-d/2+1;z<cz+d/2;z+=2){
    this.model('Platform_Metal',v(x,0,z),v(2,.001,2));
    const ceiling=this.model('Platform_CenterPlate',v(x,3.0,z),v(2,.001,2));ceiling.rotation.x=Math.PI;
   }
  };
  floor(0,0,8,14);
  for(const x of [-9,9])for(const z of [-4,4]){floor(x,z,6,6);floor(Math.sign(x)*5,z,2,2);}
  const wall=(x:number,z:number,len:number,rot=0,window=false)=>{
   this.model(window?'WallAstra_Straight_Window':'WallBand_Straight',v(x,1.5,z),v(.28,3,len),rot);
   this.model('TopCables_Straight',v(x,2.72,z),v(.25,.55,len),rot);
  };
  for(const x of [-12,12])for(const z of [-4,4])wall(x,z,6,0,true);
  for(const x of [-9,9])for(const z of [-7,-1,1,7])wall(x,z,6,Math.PI/2);
  for(const sign of [-1,1]){
   wall(sign*4,0,6);wall(sign*4,-6,2);wall(sign*4,6,2);
   for(const z of [-4,4]){
    wall(sign*6,z-2,2);wall(sign*6,z+2,2);
    for(const dz of [-1,1])wall(sign*5,z+dz,2,Math.PI/2);
    this.model('Door_Frame_SquareTall',v(sign*5,1.45,z),v(2.5,2.9,.25),Math.PI/2);
   }
  }
  wall(0,7,8,Math.PI/2);
  wall(-3,-7,2,Math.PI/2);wall(3,-7,2,Math.PI/2);
  this.model('Door_Frame_SquareTall',v(0,1.65,-6.9),v(4.5,3.3,.5));
  for(const side of [-1,1]){
   const d=new THREE.Group();d.name='opaque-sliding-door';d.position.set(side*1.01,1.55,-6.88);this.scene.add(d);
   this.model('Door_DarkMetal',v(),v(2.02,3.1,.19),0,d);
   const backing=new THREE.Mesh(new THREE.BoxGeometry(2.035,3.24,.07),this.mats.dark);backing.name='solid-door-core';backing.position.set(0,.02,-.055);d.add(backing);this.doors.push(d);
  }
  this.scene.add(this.doorDrive);
  const finalTitle=this.sign(4,0,2.5,-6.57,2.9);this.inspectionObjects.push({id:'room-title',object:finalTitle,station:4});
  this.label('기체 제어 연구소',0,2.25,6.82,4,this.scene,'#9aaeb8').rotation.y=Math.PI;
  for(const z of [-4,0,4])this.light(0,z);
  for(let i=0;i<4;i++){
   const [x,z]=centers[i];this.light(x,z+1.5,colors[i]);
   const title=this.sign(i,x,2.5,z-1.4,2.8);this.inspectionObjects.push({id:'room-title',object:title,station:i});
   this.model('Prop_Vent_Wide',v(x,2.98,z+.5),v(2,.08,1));
   this.model('Prop_Computer',v(x+(x<0?-2.1:2.1),.8,z+.8),v(.65,1.6,.55));
   this.model('Prop_Crate3',v(x-2.1,.35,z+2.4),v(.7,.7,.7));
   this.model('Prop_Barrel_Large',v(x+2.15,.48,z-.4),v(.5,.96,.5));
   this.obstacles.push({x:x+(x<0?-2.1:2.1),z:z+.8,w:.65,d:.55},{x:x-2.1,z:z+2.4,w:.7,d:.7},{x:x+2.15,z:z-.4,w:.5,d:.5});
   const arrow=this.sign(i,Math.sign(x)*3.72,2.4,z+1.3,1.25);
   arrow.rotation.y=-Math.sign(x)*Math.PI/2;
  }
  // Merge architecture by shared material to keep the modular scene inexpensive.
  const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>(),remove:THREE.Mesh[]=[];
  this.scene.updateMatrixWorld(true);
  this.scene.traverse(o=>{
   if(o instanceof THREE.Mesh&&!Array.isArray(o.material)&&o.material instanceof THREE.MeshStandardMaterial&&!this.doors.some(d=>this.isChild(o,d))&&!this.isChild(o,this.doorDrive)){
    const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);
    const list=buckets.get(o.material)||[];list.push(g);buckets.set(o.material,list);remove.push(o);
   }
  });
  for(const [m,gs]of buckets){
   // Material groups have identical glTF attribute layouts.
   const geom=mergeGeometries(gs);if(geom){const mesh=new THREE.Mesh(geom,m);this.scene.add(mesh);}
  }
  remove.forEach(o=>o.removeFromParent());
 }
 isChild(o:THREE.Object3D,parent:THREE.Object3D):boolean{return o===parent||!!o.parent&&this.isChild(o.parent,parent);}
 compact(root:THREE.Group){
  const preserve=/^(piston|pumpHandle|pumpRod|syringeCap|membrane|leverArm|Filtered[ _]exhaust|Inlet[ _]fitting|Probe|latchBolt|slidingBolt|boltHandle|actuatorRod|actuatorHead|Vacuum[ _]carry[ _]handle|Plate[ _]guide|Food[ _]packaging|balloonPlate|valveWheel|valveSpoke)/;
  const buckets=new Map<string,{material:THREE.Material;meshes:THREE.Mesh[];geometries:THREE.BufferGeometry[]}>();
  root.updateMatrixWorld(true);
  root.traverse(o=>{
   if(!(o instanceof THREE.Mesh)||Array.isArray(o.material)||preserve.test(o.name))return;
   const signature=o.material.uuid+':'+Object.keys(o.geometry.attributes).sort().join(',');
   let b=buckets.get(signature);if(!b){b={material:o.material,meshes:[],geometries:[]};buckets.set(signature,b);}
   b.meshes.push(o);b.geometries.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
  });
  for(const b of buckets.values()){
   if(b.meshes.length<2)continue;
   const merged=mergeGeometries(b.geometries);
   if(merged){b.meshes.forEach(m=>m.removeFromParent());const mesh=new THREE.Mesh(merged,b.material);mesh.name='Merged_static_'+b.material.name;root.add(mesh);}
   b.geometries.forEach(g=>g.dispose());
  }
 }
 target(object:THREE.Object3D,id:string,label:string,station:number,drag?:string){
  object.userData.hit=id;this.hits.push({id,label,object,station,drag});return object;
 }
 zone(x:number,z:number,label:string,id:string,i:number,parent:THREE.Group){
  const height=id==='mass-scale'?1.25:1.02;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.18,.2,64),new THREE.MeshBasicMaterial({color:colors[i],side:THREE.DoubleSide,transparent:true,opacity:.7}));
  ring.rotation.x=-Math.PI/2;ring.position.set(x,height+.002,z);parent.add(ring);
  const plane=new THREE.Mesh(new THREE.CircleGeometry(.23,48),new THREE.MeshBasicMaterial({color:colors[i],side:THREE.DoubleSide,transparent:true,opacity:.065,depthWrite:false}));
  plane.rotation.x=-Math.PI/2;plane.position.set(x,height,z);plane.userData.ring=ring;parent.add(plane);
  this.target(plane,id,label,i);this.label(label,x,height+.06,z+.25,.6,parent,'#cce3e4',35).rotation.x=-Math.PI/3;
 }
 hose(points:THREE.Vector3[],parent:THREE.Object3D,r=.014){
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,r,10,false),this.mats.dark);parent.add(mesh);return mesh;
 }
 screen(i:number,parent:THREE.Group){
  const c=document.createElement('canvas');c.width=768;c.height=300;const ctx=c.getContext('2d')!;
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.45,.567),new THREE.MeshBasicMaterial({map:tex}));
  screen.position.set(0,1.8,-.59);parent.add(screen);this.inspectionObjects.push({id:'instrument-screen',object:screen,station:i});this.displays[i]={canvas:c,ctx,tex};
  this.apparatus('monitor',0,-.65,parent,1).position.y=1;
 }
 buildStations(){
  for(let i=0;i<5;i++){
   const group=new THREE.Group();group.position.set(centers[i][0],0,centers[i][1]);this.scene.add(group);this.stations.push(group);
   const table=this.model('counter_counter',v(0,.5,0),v(i===3?4.5:3.5,1,1.65),0,group);
   table.traverse(o=>{if(o instanceof THREE.Mesh)o.material=this.mats.dark;});
   // Genuine imported counter plus a PBR work surface.
   const top=new THREE.Mesh(new THREE.PlaneGeometry(i===3?4.5:3.5,1.65),this.mats.metal);top.rotation.x=-Math.PI/2;top.position.y=1.005;group.add(top);
   this.obstacles.push({x:centers[i][0],z:centers[i][1],w:i===3?4.5:3.5,d:1.65});
   this.screen(i,group);
   if(i<4){
    const cab=this.model('cabinet_cabinet',v(-2.3,.65,-.1),v(.7,1.3,.8),0,group);
    cab.traverse(o=>{if(o instanceof THREE.Mesh)o.material=this.mats.metal;});


    this.obstacles.push({x:centers[i][0]-2.3,z:centers[i][1]-.1,w:.7,d:.8});
   }
   const indicator=new THREE.Mesh(new THREE.CircleGeometry(.09,32),new THREE.MeshBasicMaterial({color:0xa65b38}));
   indicator.scale.setScalar(.38);indicator.position.set(-.84,1.8,-.59);group.add(indicator);this.indicators.push(indicator);
   // An entire workbench can be approached with E in exploration mode.
   this.target(table,`station-${i}`,names[i],i);
  }
  let g=this.stations[0];
  const balance=instrument('balance');balance.position.set(-.85,1.005,0);g.add(balance);this.inspectionObjects.push({id:'balance',object:balance,station:0});
  this.bottle=this.apparatus('bottle',0,.25,g,2);this.target(this.bottle,'bottle','집기 · 같은 병과 마개',0,'bottle');
  const pump=this.apparatus('pump',.95,0,g,1.4);this.target(pump,'mass-pump','펌프 손잡이 · 아래로 드래그',0,'mass-pump');
  this.pumpHandles[0]=pump.getObjectByName('pumpHandle')!;
  this.pumpRods[0]=pump.getObjectByName('pumpRod')!;
  this.massHose=this.hose([v(1.09,1.11,0),v(.87,1.03,.35),v(.55,1.09,.37),v(.5,1.58,.18)],g);
  this.zone(-.85,0,'전자저울','mass-scale',0,g);this.zone(.5,.18,'주입 받침','mass-dock',0,g);this.zone(0,.32,'병 받침','mass-rack',0,g);
  g=this.stations[1];
  for(const x of [-.9,.9]){
   this.apparatus('bath',x,0,g,1.6);
   const water=new THREE.Mesh(new THREE.CircleGeometry(.285,64),new THREE.MeshPhysicalMaterial({color:x<0?0x769fa5:0x8bc9de,metalness:.3,roughness:.15,transparent:true,opacity:.66,side:THREE.DoubleSide}));
   water.rotation.x=-Math.PI/2;water.position.set(x,1.19,0);g.add(water);this.target(water,x<0?'heat-hot':'heat-cold',x<0?'따뜻한 물 수조':'차가운 물 수조',1);
  }
  this.jar=this.apparatus('jar',0,.25,g,2);this.target(this.jar,'jar','집기 · 집기병',1,'jar');
  this.membrane=this.jar.getObjectByName('membrane') as THREE.Mesh;
  // Replace only the rubber surface; retain the imported jar, rim and retaining band.
  this.membrane.geometry.dispose();
  const positions:number[]=[],indices:number[]=[],rings=24,segments=96,radius=.07;
  for(let r=0;r<=rings;r++)for(let a=0;a<=segments;a++){const theta=a/segments*Math.PI*2;positions.push(Math.cos(theta)*radius*r/rings,0,Math.sin(theta)*radius*r/rings);}
  for(let r=0;r<rings;r++)for(let a=0;a<segments;a++){const p=r*(segments+1)+a;indices.push(p,p+segments+1,p+1,p+1,p+segments+1,p+segments+2);}
  const membraneGeo=new THREE.BufferGeometry();membraneGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));membraneGeo.setAttribute('color',new THREE.Float32BufferAttribute(positions.map(()=>1),3));membraneGeo.setIndex(indices);membraneGeo.computeVertexNormals();this.membrane.geometry=membraneGeo;
  this.membrane.position.set(0,.214,0);this.membrane.rotation.set(0,0,0);this.membrane.scale.set(1,1,1);
  this.membrane.material=new THREE.MeshPhysicalMaterial({color:0x387f78,roughness:.65,metalness:0,clearcoat:.1,envMapIntensity:.15,vertexColors:true,side:THREE.DoubleSide});
  const points=Array.from({length:96},(_,i)=>new THREE.Vector3(Math.cos(i/96*Math.PI*2)*.071,.214,Math.sin(i/96*Math.PI*2)*.071));
  this.baselineRing=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:0xd5eee9,dashSize:.008,gapSize:.005,transparent:true,opacity:.65}));this.baselineRing.raycast=()=>{};this.baselineRing.computeLineDistances();this.jar.add(this.baselineRing);
  const reference=new THREE.Line(new THREE.BufferGeometry().setFromPoints([v(-.065,.215,0),v(.065,.215,0)]),new THREE.LineDashedMaterial({color:0xeaf5ec,dashSize:.005,gapSize:.004,transparent:true,opacity:.7}));reference.computeLineDistances();reference.raycast=()=>{};this.jar.add(reference);
  this.membraneDot=new THREE.Mesh(new THREE.SphereGeometry(.0017,12,8),new THREE.MeshBasicMaterial({color:0xf1fbf4}));this.membraneDot.raycast=()=>{};this.jar.add(this.membraneDot);
  this.warmOutline=new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length:65},(_,i)=>v((i/64*2-1)*.07,.214,0))),new THREE.LineDashedMaterial({color:0xf4d1a0,dashSize:.004,gapSize:.003,transparent:true,opacity:.8}));this.warmOutline.raycast=()=>{};this.jar.add(this.warmOutline);
  this.lever=this.apparatus('lever',-.48,0,g,1.4);this.lever.visible=false;
  this.zone(0,.3,'수건 받침','heat-wipe',1,g);this.label('따뜻한 물',-.9,1.07,.51,.8,g);this.label('차가운 물',.9,1.07,.51,.8,g);
  const towel=this.apparatus('towel',0,.3,g,1.2);this.target(towel,'heat-wipe-cloth','수건 받침 · 겉면 닦기',1);
  g=this.stations[2];
  this.syringe=this.apparatus('syringe',-.95,.12,g,1.15);
  this.target(this.syringe.getObjectByName('pistonHandle')!,'piston','피스톤 · 아래로 드래그',2,'piston');
  this.target(this.syringe.getObjectByName('syringeCap')!,'seal','주황색 마개 · 클릭하여 집기',2);
  const tip=new THREE.Mesh(new THREE.TorusGeometry(.03,.008,12,24),new THREE.MeshStandardMaterial({color:0xffd079,emissive:0xdba244,emissiveIntensity:.5}));tip.rotation.x=Math.PI/2;tip.position.set(0,.06,0);this.syringe.add(tip);this.target(tip,'syringe-tip','주사기 끝 · 마개 끼우기',2);
  const chamber=this.apparatus('chamber',.4,0,g,1.6);this.vacuumPlate=chamber.getObjectByName('balloonPlate')!;
  chamber.traverse(o=>{if(/Vacuum[ _]carry[ _]handle|Plate[ _]guide|balloonPlate/.test(o.name))o.visible=false;});
  const carryCurve=new THREE.CatmullRomCurve3([v(-.08,.44,0),v(-.08,.51,0),v(0,.55,0),v(.08,.51,0),v(.08,.44,0)]);
  chamber.add(new THREE.Mesh(new THREE.TubeGeometry(carryCurve,24,.012,10,false),this.mats.metal));
  this.pressureHose=this.hose([v(.59,1.73,0),v(.75,1.84,-.2),v(1.36,1.23,-.1),v(1.36,1.10,.14)],g);
  this.balloon=new THREE.Mesh(new THREE.SphereGeometry(.135,40,32),new THREE.MeshPhysicalMaterial({color:0xc0acd1,roughness:.33,clearcoat:.4}));
  this.balloon.position.set(.4,1.29,0);g.add(this.balloon);
  const vp=this.apparatus('pump',1.25,.14,g,1.1);this.target(vp,'vacuum','진공 펌프 · 아래로 드래그',2,'vacuum');this.pumpHandles[1]=vp.getObjectByName('pumpHandle')!;
  this.pumpRods[1]=vp.getObjectByName('pumpRod')!;
  this.label('진공 펌프 · 바깥 공기 빼기',1.15,2.08,.1,1.15,g);
  const airPath=new THREE.CatmullRomCurve3([v(.59,1.73,0),v(.75,1.84,-.2),v(1.36,1.23,-.1),v(1.36,1.10,.14),v(1.7,1.3,.14)]);
  for(let i=0;i<6;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.025,12,8),new THREE.MeshBasicMaterial({color:0x8ef9ed}));dot.userData.curve=airPath;dot.userData.offset=i/6;g.add(dot);this.vacuumFlow.push(dot);}
  this.zone(.4,.52,'공기 되넣기','vent',2,g);
  const syringeGauge=new PressureGauge(250,.105);syringeGauge.position.set(-.57,1.39,.26);g.add(syringeGauge);this.gauges.push(syringeGauge);const syringeFitting=rigidTube(v(-.88,1.16,.12),v(-.57,1.16,.26),.018);g.add(syringeFitting);this.pressureFittings.push(syringeFitting);
  const vacuumGauge=new PressureGauge(150,.12);vacuumGauge.position.set(.89,1.45,.3);g.add(vacuumGauge);this.gauges.push(vacuumGauge);const vacuumFitting=rigidTube(v(.68,1.2,.05),v(.89,1.2,.3),.02);g.add(vacuumFitting);this.pressureFittings.push(vacuumFitting);
  this.label('밀폐 주사기',-.95,1.07,.5,.75,g);this.label('진공 용기',.4,1.07,.5,.75,g);
  g=this.stations[3];
  const gases:Gas[]=['He','CO2','N2','O2'];
  for(let i=0;i<4;i++){
   const x=-1.65+i*1.1;
   const c=this.apparatus('cartridge',x,.4,g,.85);this.target(c,`cart-${gases[i]}`,`${['헬륨','이산화 탄소','질소','산소'][i]} 카트리지 집기`,3);this.cartridges.push(c);
   this.label(['헬륨','이산화 탄소','질소','산소'][i],x,1.17,.49,.65,g,'#153e48',80);
   this.zone(x,-.3,['부력 승강기','소화 장치','포장 장치','연소 관찰'][i],`dock-${gases[i]}`,3,g);
   const cell=this.apparatus('cell',x,-.3,g,1);const oldExhaust=cell.getObjectByName('Filtered_exhaust')||cell.getObjectByName('Filtered exhaust');if(oldExhaust)oldExhaust.visible=false;if(i===0||i===2){cell.visible=false;const stand=new THREE.Mesh(new THREE.BoxGeometry(.46,.04,.4),this.mats.metal);stand.position.set(x,1.03,-.3);g.add(stand);}
   if(i===0){
    this.helium=new THREE.Mesh(new THREE.SphereGeometry(.15,32,24),new THREE.MeshPhysicalMaterial({color:0xe6dbc6,roughness:.3,clearcoat:.5}));this.helium.position.set(x,1.3,-.3);g.add(this.helium);
    this.payload=this.apparatus('bolt',x,-.3,g,.22);
    this.heliumThread=this.hose([v(x,1.10,-.3),v(x,1.16,-.3),v(x,1.25,-.3)],g,.002);
   }else if(i===2){
    const pack=new THREE.Group();pack.name='clean-illustrated-snack-package';pack.position.set(x,1.07,-.3);g.add(pack);this.snackBag=pack;
    pack.traverse(o=>{if(/Food[ _]packaging/.test(o.name))o.visible=false;});
    const snackTexture=new THREE.TextureLoader().load('./assets/illustrations/snack.png');snackTexture.colorSpace=THREE.SRGBColorSpace;
    pack.traverse(o=>{if(o instanceof THREE.Mesh)o.visible=false;});
    const skin=new THREE.Mesh<THREE.BoxGeometry,THREE.Material|THREE.Material[]>(new THREE.BoxGeometry(.28,.32,.09,20,24,8),new THREE.MeshStandardMaterial({map:snackTexture,roughness:.48,metalness:.16}));skin.position.y=.16;const foil=skin.material as THREE.MeshStandardMaterial,opening=new THREE.MeshStandardMaterial({color:0xf9c956,transparent:true,opacity:0,side:THREE.DoubleSide});skin.material=[foil,foil,opening,foil,foil,foil];pack.add(skin);this.bagSkin=skin;this.bagBase=new Float32Array(skin.geometry.attributes.position.array);
    this.sealer=new THREE.Group();this.sealer.position.set(x,1.5,-.3);g.add(this.sealer);for(const side of [-1,1]){const jaw=new THREE.Mesh(new THREE.BoxGeometry(.4,.035,.04),this.mats.metal);jaw.position.z=side*.13;jaw.userData.side=side;this.sealer.add(jaw);}for(const dx of [-.23,.23]){const post=new THREE.Mesh(new THREE.BoxGeometry(.025,.42,.04),this.mats.dark);post.position.set(x+dx,1.29,-.43);g.add(post);}

    this.snackSeam=new THREE.Mesh(new THREE.BoxGeometry(.34,.025,.018),new THREE.MeshStandardMaterial({color:0xf9c956,metalness:.5,roughness:.4}));this.snackSeam.position.set(x,1.49,-.3);g.add(this.snackSeam);
for(let j=0;j<5;j++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.018,12,10),new THREE.MeshBasicMaterial({color:0xdb9a71}));dot.position.set(x-.09+j*.045,1.33,-.16);g.add(dot);this.nitrogenDots.push(dot);}
   }else{
    const burner=this.model('heating_equipment_bunsen_burner',v(x,1.135,-.3),v(.10,.13,.1),0,g);
    burner.traverse(o=>{if(o instanceof THREE.Mesh)o.material=this.mats.metal;});
    const wax=new THREE.Mesh(new THREE.CylinderGeometry(.031,.035,.10,24),new THREE.MeshStandardMaterial({color:0xf4deb2,roughness:.8}));wax.position.set(x,1.16,-.3);g.add(wax);const wick=new THREE.Mesh(new THREE.CylinderGeometry(.004,.005,.023,8),new THREE.MeshStandardMaterial({color:0x30261e,emissive:0x7c2607,emissiveIntensity:.3}));wick.position.set(x,1.218,-.3);g.add(wick);
    const flame=flameMesh();flame.position.set(x,1.22,-.3);g.add(flame);this.flames.push(flame);const light=new THREE.PointLight(0xffb24b,.4,1.5,2);light.position.set(x,1.38,-.3);g.add(light);this.flameLights.push(light);
    if(i===1){this.smoke=new Smoke();this.smoke.position.copy(flame.position);g.add(this.smoke);}

   }
  }
  for(let i=0;i<4;i++){const ghost=new THREE.Group();ghost.visible=false;g.add(ghost);this.gasGhosts.push(ghost);const x=-1.65+i*1.1+(i===0?.55:-.55);
   if(i===0){const air=this.helium.clone();air.material=(this.helium.material as THREE.Material).clone();(air.material as THREE.MeshPhysicalMaterial).color.setHex(0x6eacd4);air.position.set(x,1.25,-.3);air.scale.setScalar(1);ghost.add(air);const weight=this.payload.clone(true);weight.position.set(x,1.08,-.3);ghost.add(weight);const thread=this.heliumThread.clone();thread.position.x=.55;ghost.add(thread);}
   else if(i===2){const pack=this.snackBag.clone(true);pack.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry=o.geometry.clone();});pack.position.x=x;pack.scale.set(1.35,1.35,.65);ghost.add(pack);}
   else{const flame=this.flames[i===1?0:1].clone(true);flame.material=(flame.material as THREE.Material).clone();this.flameGhosts.push(flame);flame.position.x=x;flame.scale.set(1.12,1,1);ghost.add(flame);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.031,.035,.10,24),new THREE.MeshStandardMaterial({color:0xf4deb2,roughness:.8}));stem.position.set(x,1.16,-.3);ghost.add(stem);const wick=new THREE.Mesh(new THREE.CylinderGeometry(.004,.005,.023,8),new THREE.MeshStandardMaterial({color:0x30261e}));wick.position.set(x,1.218,-.3);ghost.add(wick);}
  }
  const gv=instrument('valve');gv.scale.setScalar(.95);gv.position.set(0,1.005,.65);g.add(gv);this.target(gv,'gas-valve','공급 밸브 · 클릭 또는 오른쪽으로 드래그',3,'gas-valve');this.valves[0]=gv;
  g.add(this.gasHose);
  g=this.stations[4];
  const tank=instrument('tank');tank.position.set(-1.2,1.005,-.08);g.add(tank);this.inspectionObjects.push({id:'supply-tank',object:tank,station:4});this.gauges.push(tank.getObjectByName('tank-pressure') as PressureGauge);
  this.actuator=instrument('actuator');this.actuator.position.set(1.08,1.005,-.08);g.add(this.actuator);this.inspectionObjects.push({id:'actuator',object:this.actuator,station:4});
  this.linkage=new DoorLinkage();g.add(this.linkage);this.lockLink=this.linkage.moving;
  const driveGauge=new PressureGauge(200,.12);driveGauge.position.set(1.40,1.49,.24);g.add(driveGauge);this.gauges.push(driveGauge);
  const fv=instrument('valve');fv.scale.setScalar(.95);fv.position.set(-.85,1.005,.5);g.add(fv);this.target(fv,'final-valve','공급 밸브 · 클릭 또는 오른쪽으로 드래그',4,'final-valve');this.valves[1]=fv;
  const heater=instrument('heater');heater.position.set(0,1.005,-.08);g.add(heater);this.target(heater,'heater','가열기 · 공기를 따뜻하게',4);this.inspectionObjects.push({id:'heater-vessel',object:heater,station:4});
  for(let i=0;i<4;i++){
   const x=[-1.3,-.32,.32,1.3][i];
   const port=new THREE.Group();port.position.set(x,1.07,.65);
   const rim=new THREE.Mesh(new THREE.TorusGeometry(.065,.017,12,32),this.mats.teal);rim.rotation.x=-Math.PI/2;port.add(rim);
   const socket=new THREE.Mesh(new THREE.CircleGeometry(.065,32),new THREE.MeshStandardMaterial({color:0x264f54,metalness:.7,roughness:.3,side:THREE.DoubleSide}));socket.rotation.x=-Math.PI/2;port.add(socket);
   g.add(port);this.target(port,`port-${i}`,['공기 저장통 출구','가열 장치 입구','가열 장치 출구','피스톤 입구'][i],4);
   for(const rr of [.052,.073]){const collar=new THREE.Mesh(new THREE.TorusGeometry(rr,.006,10,40),this.mats.metal);collar.rotation.x=-Math.PI/2;collar.position.y=.02;port.add(collar);}
   for(let k=0;k<6;k++){const screw=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.01,6),this.mats.metal);screw.position.set(Math.cos(k*Math.PI/3)*.079,.006,Math.sin(k*Math.PI/3)*.079);port.add(screw);}
  }
  g.add(this.pipes);
  for(let i=0;i<4;i++){
   const led=new THREE.Mesh(new THREE.CircleGeometry(.026,24),new THREE.MeshBasicMaterial({color:0xbd804c}));led.position.set(-.54+i*.36,2.095,-.59);g.add(led);this.lobbyIndicators.push(led);
  }

 }
 buildParticles(){
  const positions=new Float32Array(90*3);
  for(let i=0;i<positions.length;i++)positions[i]=(Math.random()-.5)*.15;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  this.particles=new THREE.Points(geo,new THREE.PointsMaterial({color:0xf0fcff,size:.012,transparent:true,opacity:.8,depthTest:false}));
  this.particleGroup.add(this.particles);this.scene.add(this.particleGroup);this.particleGroup.visible=false;
 }
 pick(clientX:number,clientY:number,station:number|null){
  const rect=this.canvas.getBoundingClientRect();
  this.pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);
  this.ray.setFromCamera(this.pointer,this.camera);
  const shown=(o:THREE.Object3D):boolean=>o.visible&&(!o.parent||shown(o.parent));const options=this.hits.filter(h=>shown(h.object)).filter(h=>station===null?h.id.startsWith('station-'):h.station===station&&!h.id.startsWith('station-'));
  const intersections=this.ray.intersectObjects(options.map(x=>x.object),true);
  if(!intersections.length){if(station===2||station===3||station===4){let nearest:Hit|null=null,dist=46;for(const h of options.filter(h=>h.id.startsWith('dock-')||h.id.startsWith('port-')||h.id.includes('valve')||h.id==='seal'||h.id==='syringe-tip')){const p=this.project(h.object),d=Math.hypot(p.x-clientX,p.y-clientY);if(d<dist){dist=d;nearest=h;}}return nearest;}return null;}
  const hit=options.find(h=>this.isChild(intersections[0].object,h.object));
  if(station===null&&intersections[0].distance>3.5)return null;
  return hit||null;
 }
 pickTouch(x:number,y:number,station:number){
  // Nearest projected handle within a 48 CSS pixel target. Direct ray hits win.
  let best:Hit|null=null,distance=25;
  for(const h of this.hits){if(h.station!==station||h.id.startsWith('station-'))continue;const p=this.project(h.object),d=Math.hypot(p.x-x,p.y-y);if(d<distance){distance=d;best=h;}}
  return best;
 }
 valid(x:number,z:number){
  const radius=.23;
  const inLobby=Math.abs(x)<4-radius&&Math.abs(z)<6.65-radius;
  const inRoom=Math.abs(Math.abs(x)-9)<3-radius&&([-4,4].some(c=>Math.abs(z-c)<3-radius));
  const inCorridor=Math.abs(x)<6.3&&Math.abs(x)>3.6&&[-4,4].some(c=>Math.abs(z-c)<1-radius);
  if(!inLobby&&!inRoom&&!inCorridor)return false;
  return !this.obstacles.some(b=>Math.abs(x-b.x)<b.w/2+radius&&Math.abs(z-b.z)<b.d/2+radius);
 }
 vacuumFlow:THREE.Mesh[]=[];pressureHose!:THREE.Mesh;pressureView:'push'|'vacuum'|'all'='all';nitrogenDots:THREE.Mesh[]=[];snackBag!:THREE.Group;snackSeam!:THREE.Mesh;snackBefore=false;lockLink!:THREE.Group;detailView=false;reviewing=false;
 update(s:State,dt:number,focus:number|null){
  if(!this.bottle)return;this.unlockPulse=Math.max(0,this.unlockPulse-dt*.65);this.baselineRing.visible=focus===1;
  const isolated=focus!==null&&(this.camera.aspect<1||this.reviewing||focus===4||focus===2&&this.pressureView!=='all');
  for(const o of this.architecture)o.visible=!isolated;this.doors.forEach(o=>o.visible=!isolated||focus===4);this.doorDrive.visible=!isolated||focus===4;this.doorDrive.update(s.final.open);
  if(isolated)for(const o of this.inspectionObjects)if(o.id==='room-title')o.object.visible=o.station===focus;
  for(const o of this.inspectionObjects)if(o.station===3&&['monitor','instrument-screen','room-title'].includes(o.id))o.object.visible=!(focus===3&&s.gases.target===s.gases.docked&&s.gases.target);
  for(const o of this.inspectionObjects)if(o.station===4&&(['monitor','instrument-screen'].includes(o.id)||o.id==='room-title'&&focus===4))o.object.visible=false;
  this.stations.forEach((g,i)=>g.visible=focus===null||i===focus);for(const o of this.inspectionObjects){if(o.id.startsWith('label:'))o.object.visible=o.id.includes('진공 펌프')&&focus===2&&this.pressureView!=='push';if(o.station===1&&['monitor','instrument-screen'].includes(o.id))o.object.visible=!this.detailView;}
  for(const o of this.inspectionObjects){if(o.station===2){const detailed=focus===2&&this.pressureView!=='all';if(['room-title','monitor','instrument-screen'].includes(o.id))o.object.visible=!detailed;else if(o.id==='syringe')o.object.visible=!detailed||this.pressureView==='push';else if(['chamber','pump'].includes(o.id))o.object.visible=!detailed||this.pressureView==='vacuum';}}this.balloon.visible=focus!==2||this.pressureView!=='push';this.pressureHose.visible=focus!==2||this.pressureView!=='push';
  for(let j=0;j<this.nitrogenDots.length;j++){const m=this.nitrogenDots[j].material as THREE.MeshBasicMaterial;m.color.setHex(gasOxygen(s,'N2')/.21<(j+1)/5?0xa0e3be:0xdb9a71);}
  const shadowCenter=focus===null?[0,-4.5]:centers[focus];this.keyLight.position.set(shadowCenter[0]+1,4.2,shadowCenter[1]+1.5);this.keyLight.target.position.set(shadowCenter[0],0,shadowCenter[1]);
  this.massHose.visible=s.mass.at==='pump';
  const dest=s.mass.at==='scale'?v(-.85,1.23,0):s.mass.at==='pump'?v(.5,1.03,.18):v(0,1.02,.32);
  if(this.carry==='bottle')dest.y+=.27;
  this.bottle.position.lerp(dest,1-Math.exp(-dt*9));
  const jp=s.heat.at==='hot'?v(-.9,1.1,0):s.heat.at==='cold'?v(.9,1.1,0):v(0,1.02,.3);
  if(this.carry==='jar')jp.y+=.25;
  this.jar.position.lerp(jp,1-Math.exp(-dt*8));
  // Signed spherical-cap displacement; volume is physical, display scale is apparatus scale.
  const height=membraneHeight(s.heat.t);if(Math.abs(height-this.lastMembrane)>1e-6||!Number.isFinite(this.lastMembrane)){this.lastMembrane=height;this.membraneDot.position.set(0,.216+height,0);
  const outline=this.warmOutline.geometry.getAttribute('position');const warm=membraneHeight(Math.max(s.heat.max,T0));for(let i=0;i<outline.count;i++){const x=outline.getX(i);outline.setY(i,.215+warm*Math.max(0,1-x*x/(.07*.07)));}outline.needsUpdate=true;this.warmOutline.computeLineDistances();this.warmOutline.visible=s.heat.t<T0-2&&s.heat.max>T0+10;
  const attr=this.membrane.geometry.getAttribute('position');
  for(let i=0;i<attr.count;i++){const x=attr.getX(i),z=attr.getZ(i);attr.setY(i,height*Math.max(0,1-(x*x+z*z)/(.07*.07)));}
  const tint=this.membrane.geometry.getAttribute('color');for(let i=0;i<attr.count;i++){const radial=Math.max(0,1-(attr.getX(i)**2+attr.getZ(i)**2)/(.07*.07));const shade=1+Math.min(0,height)*20*radial;tint.setXYZ(i,shade,shade,shade);}tint.needsUpdate=true;attr.needsUpdate=true;this.membrane.geometry.computeVertexNormals();
  const arm=this.lever.getObjectByName('leverArm')!;arm.rotation.z=-height*7;
  this.lever.getObjectByName('Probe')!.position.y=.402+height*2/1.4;
  this.lever.getObjectByName('latchBolt')!.position.x=.32+(s.heat.hot?.08:0);}
  const dy=(s.press.v-60)/60*.29;
  for(const name of ['pistonSeal','pistonRod','pistonHandle']){
   const o=this.syringe.getObjectByName(name)!;if(o.userData.baseY===undefined)o.userData.baseY=o.position.y;o.position.y=o.userData.baseY+dy;
  }
  const cap=this.syringe.getObjectByName('syringeCap')!;cap.scale.setScalar(1.5);cap.position.lerp(v(s.press.sealed?0:-.14,s.press.sealed?.058:this.carry==='cap'?.16:.058,s.press.sealed?0:.08),1-Math.exp(-dt*12));const tip=this.hits.find(h=>h.id==='syringe-tip')!;tip.object.visible=!s.press.sealed;
  const b=balloonEquilibrium(s.press.nOutside);const bs=Math.cbrt(b.v/.0007);this.balloon.scale.setScalar(bs);
  this.balloon.position.y=1.14+.135*bs;
  this.vacuumFlow.forEach(o=>{o.visible=focus===2&&this.pressureView!=='push'&&(this.pumpHeld[1]||this.pumpMotion[1]>.01);o.position.copy(o.userData.curve.getPoint((performance.now()/1300+o.userData.offset)%1));});
  this.vacuumPlate.position.y=.26+Math.max(0,(1.14+.27*bs-1.4164)/1.6);
  for(let i=0;i<2;i++){
   if(!this.pumpHeld[i])this.pumpMotion[i]=Math.max(0,this.pumpMotion[i]-dt*3);
   const o=this.pumpHandles[i];if(o.userData.baseY===undefined)o.userData.baseY=o.position.y;
   o.position.y=o.userData.baseY-this.pumpMotion[i]*.14;
   const rod=this.pumpRods[i];if(rod.userData.baseY===undefined)rod.userData.baseY=rod.position.y;rod.position.y=rod.userData.baseY-this.pumpMotion[i]*.14;
  }
  const packageProgress=this.snackBefore?0:Math.min(1,s.gases.amount.N2/1.44);const bagKey=packageProgress.toFixed(4)+':'+this.sealMotion.toFixed(4);if(bagKey!==this.lastBag){this.lastBag=bagKey;
  const bagAttr=this.bagSkin.geometry.attributes.position;for(let k=0;k<bagAttr.count;k++){const x=this.bagBase[k*3],y=this.bagBase[k*3+1],z=this.bagBase[k*3+2],belly=Math.sin(Math.PI*(y/.32+.5));bagAttr.setXYZ(k,x*(.88+.12*belly),y,z*(.4+packageProgress*(.6+1.1*belly))*(1-this.sealMotion*.7*Math.max(0,(y-.12)/.04)));}bagAttr.needsUpdate=true;this.bagSkin.geometry.computeVertexNormals();}
  this.snackBag.scale.setScalar(1.35);this.snackSeam.visible=this.sealMotion>.9;
  this.nitrogenDots.forEach((o,i)=>{const t=(s.elapsed*.5+i*.2)%1;o.position.y=1.47+t*.3;o.position.x=.55+(i-2)*.045+t*(i-2)*.06;o.visible=!this.packSealed&&s.gases.target==='N2'&&s.gases.valve>.05;});
  this.gasGhosts.forEach((o,i)=>o.visible=focus===3&&this.gasCompare&&s.gases.target===['He','CO2','N2','O2'][i]);
  const heScale=.35+.65*Math.min(1,s.gases.amount.He),heRise=s.gases.amount.He>=1?s.gases.lift*.45:0;
  this.helium.position.y=1.29+.15*heScale+heRise;this.helium.scale.setScalar(heScale);this.payload.position.y=1.08+heRise;
  this.heliumThread.position.y=.04+heRise;this.heliumThread.scale.y=1;
  const co2Size=Math.max(0,Math.min(1,(gasOxygen(s,'CO2')-.145)/(.21-.145))),oxygenStrength=Math.min(1.8,gasOxygen(s,'O2')/.21);
  this.flames[0].visible=co2Size>.01;this.flames[1].visible=s.gases.fuel>0;
  this.flames[0].scale.set(1.3*Math.sqrt(co2Size),co2Size,1);this.flames[1].scale.set(.9+oxygenStrength*.22,oxygenStrength,1);
  for(const f of [...this.flames,...this.flameGhosts]){f.quaternion.copy(this.camera.quaternion);const m=f.material as THREE.ShaderMaterial;m.uniforms.time.value=s.elapsed;}
  (this.flames[1].material as THREE.ShaderMaterial).uniforms.heat.value=oxygenStrength;
  if(this.co2Burning&&!this.flames[0].visible)this.smoke.trigger();this.co2Burning=this.flames[0].visible;this.smoke.update(dt);
  this.flameLights[0].intensity=co2Size*(.65+.06*Math.sin(s.elapsed*13));this.flameLights[1].intensity=(.35+oxygenStrength*.7)*(1+.04*Math.sin(s.elapsed*11));
  this.gauges[0].setValue(P0*60/s.press.v/1000);this.gauges[1].setValue(b.p/1000);this.gauges[2].setValue(pressure(s.final.nSupply,.001,T0)/1000);this.gauges[3].setValue(pressure(s.final.nDrive,.0005+s.final.stroke*.00012,s.final.t)/1000);
  this.gauges[0].visible=focus!==2||this.pressureView!=='vacuum';this.gauges[1].visible=focus!==2||this.pressureView!=='push';this.pressureFittings.forEach((o,i)=>o.visible=this.gauges[i].visible);
  const gases:Gas[]=['He','CO2','N2','O2'];
  for(let i=0;i<4;i++){
   const connected=s.gases.docked===gases[i];this.cartridges[i].position.lerp(v(-1.65+i*1.1,connected&&s.gases.target!==gases[i]?1.12:1.01,.4),1-Math.exp(-dt*8));
  }
  const gasKey=s.gases.docked===s.gases.target?s.gases.target??'':'';
  for(let i=0;i<2;i++){
   const va=i===0?s.gases.valve:s.final.valve;
   this.valveTurns[i]+=(va-this.valveTurns[i])*(1-Math.exp(-dt*5));this.valves[i].traverse(o=>{if(/valveWheel|valveSpoke/.test(o.name))o.rotation.y=this.valveTurns[i]*Math.PI*1.5;});
  }
  for(const name of ['actuatorRod','actuatorHead','actuatorPiston']){
   const o=this.actuator.getObjectByName(name)!;if(o.userData.baseY===undefined)o.userData.baseY=o.position.y;o.position.y=o.userData.baseY+s.final.stroke*.38;
  }
  if(!this.mechanismGhost.children.length){const ghost=this.linkage.moving.clone(true);ghost.position.y=1.84;const mat=new THREE.MeshBasicMaterial({color:0x62b8e3,transparent:true,opacity:.12,wireframe:false,depthWrite:false});ghost.traverse(o=>{if(o instanceof THREE.Mesh)o.material=mat;});this.mechanismGhost.add(ghost);this.linkage.add(this.mechanismGhost);}
  this.mechanismGhost.visible=this.compareMechanism&&focus===4;
  this.escapeHall.visible=s.final.open>0;
  this.linkage.update(s.final.stroke,s.final.open);
  this.intro=Math.max(0,this.intro-dt/1.4);
  this.doors.forEach((o,i)=>o.position.x=(i===0?-1:1)*(1.01+(s.final.open)*2.2));
  this.lobbyIndicators.forEach(o=>o.visible=false);

  this.indicators.forEach((o,i)=>{o.visible=focus===null;(o.material as THREE.MeshBasicMaterial).color.setHex(i<4?this.access[i]==='complete'?0x8ae0d0:this.access[i]==='locked'?0x40575f:0xb6d8df:this.access.every(a=>a==='complete')?0x8ae0d0:0x40575f);o.scale.setScalar(.38+this.unlockPulse*.12);});
  this.connections.update(s,dt,focus);
  this.particleGroup.visible=this.showParticles&&focus!==null&&focus<3;
  if(this.particleGroup.visible){
   const root=focus===0?this.bottle:focus===1?this.jar:this.balloon;
   root.getWorldPosition(this.particleGroup.position);this.particleGroup.position.y+=focus===2?0:.19;
   const a=this.particles.geometry.getAttribute('position');const speed=(focus===1?s.heat.t/T0:1)*dt*.09;
   for(let i=0;i<a.count;i++)for(let j=0;j<3;j++){const value=a.array[i*3+j]+Math.sin(i*1.7+j*2+s.elapsed)*speed;a.array[i*3+j]=value>.1?-.1:value<-.1?.1:value;}
   a.needsUpdate=true;this.particles.geometry.setDrawRange(0,focus===0?Math.round(60*s.mass.n/(P0*.0005/(8.314462618*T0))):60);
  }
  const target=this.guideTarget?this.hits.find(h=>h.id===this.guideTarget):null;
  this.guideBox.visible=false;this.highlight.visible=false;
  const glowTarget=this.hovered??(focus!==null?target?.object:null);this.halo.visible=!!glowTarget;
  if(glowTarget){const b=new THREE.Box3().setFromObject(glowTarget),size=b.getSize(v());b.getCenter(this.halo.position);const scale=Math.max(size.x,size.y,size.z)*1.5+.08;this.halo.scale.set(scale,scale,1);this.halo.material.opacity=.4+.15*Math.sin(s.elapsed*3);}
  if(this.hovered){this.highlight.box.setFromObject(this.hovered).expandByScalar(.009);}
  for(const hit of this.hits){const ring=hit.object.userData.ring as THREE.Mesh|undefined;if(!ring)continue;const active=focus!==null&&hit.id===this.guideTarget;const material=ring.material as THREE.MeshBasicMaterial;material.color.setHex(active?0xffda85:colors[hit.station]);material.opacity=active?.8+.2*Math.sin(s.elapsed*3):.55;}
  if(target){this.guideBox.box.setFromObject(target.object).expandByScalar(.015);(this.guideBox.material as THREE.LineBasicMaterial).transparent=true;(this.guideBox.material as THREE.LineBasicMaterial).opacity=.55+.2*Math.sin(s.elapsed*3);}
  this.route.visible=this.guideLab!==null;
  if(this.frame++%8===0){this.updateScreens(s);if(this.guideLab!==null)this.updateRoute(this.guideLab);}

 }
 updateScreens(s:State){
  const b=balloonEquilibrium(s.press.nOutside),f=s.final;
  const lines=[
   [`${s.mass.at==='scale'?(35+airGrams(s.mass.n)).toFixed(2):'— —'}  g`,`처음  ${s.mass.baseline?.toFixed(2)??'미측정'} g   /   변화  ${s.mass.after!==null&&s.mass.baseline!==null?'+'+(s.mass.after-s.mass.baseline).toFixed(2):'—'} g`,'같은 병 · 같은 마개 · 공기만 추가'],
   [`${(s.heat.t-273.15).toFixed(1)} °C`,`고무막  ${s.heat.t>T0+2?'볼록하게 부푸는 중':s.heat.t<T0-2?'안쪽으로 줄어드는 중':'처음 상태'}`,`${s.heat.hot?'✓':'○'} 가열 관찰   ${s.heat.wiped?'✓':'○'} 겉면 닦기   ${s.heat.cold?'✓':'○'} 냉각 관찰`],
   [`${(P0*60/s.press.v/1000).toFixed(1)} kPa  /  ${s.press.v.toFixed(0)} mL`,`잠금 범위 190~205 kPa  ${s.press.syringe?'✓':'○'}  ·  마개 ${s.press.sealed?'닫힘':'열림'}`,`풍선 바깥 ${(b.p/1000).toFixed(1)} kPa  ${s.press.vacuum?'✓':'○'}`],
   [`${Object.values(s.gases.done).filter(Boolean).length} / 4  성질 확인`,`포장 산소 ${(gasOxygen(s,'N2')*100).toFixed(1)}%  ·  연소실 산소 ${(gasOxygen(s,'O2')*100).toFixed(1)}%`,`연결 ${s.gases.docked??'없음'}   /   공급 밸브 ${Math.round(s.gases.valve*100)}%`],
   [`${(pressure(f.nDrive,.0005+f.stroke*.00012,f.t)/1000).toFixed(1)} kPa`,`가열 ${(f.t-273.15).toFixed(1)} °C  /  피스톤 ${Math.round(f.stroke*100)}%`,`공기 저장통 → 가열 장치 → 피스톤   ${s.solved.every(Boolean)?'회로 사용 가능':'안전 회로 잠김'}`]
  ];
  this.displays.forEach((d,i)=>{
   const key=JSON.stringify(lines[i])+':'+[s.mass.strokes,s.heat.t.toFixed(1),s.press.v,Object.values(s.gases.done).join(),s.final.stroke.toFixed(3)][i];if(this.screenKeys[i]===key)return;this.screenKeys[i]=key;const c=d.ctx;c.fillStyle='#153543';c.fillRect(0,0,768,300);c.fillStyle='#93c6bf';c.fillRect(0,0,9,300);
   c.fillStyle='#bbd1d5';c.font='600 24px Pretendard';c.fillText(['같은 병의 무게 비교','고무막 관찰','압력 / 밀폐 공기','기체 / 쓰임 확인','문을 미는 압력'][i],32,44);
   const value=[`${s.mass.at==='scale'?(35+airGrams(s.mass.n)).toFixed(2):'—'} g`,`${(s.heat.t-273.15).toFixed(0)} °C`,`${s.press.v.toFixed(0)} mL`,`${Object.values(s.gases.done).filter(Boolean).length} / 4`,`${(pressure(f.nDrive,.0005+f.stroke*.00012,f.t)/1000).toFixed(0)} kPa`][i];
   c.fillStyle='#f0f9f5';c.font='600 78px Pretendard';c.fillText(value,32,146,460);
   const progress=Math.max(0,Math.min(1,[s.mass.strokes/8,(s.heat.t-278.15)/50,(60-s.press.v)/30,Object.values(s.gases.done).filter(Boolean).length/4,f.stroke][i]));
   c.lineWidth=17;c.strokeStyle='#345561';c.beginPath();c.arc(644,139,72,Math.PI*.75,Math.PI*2.25);c.stroke();c.strokeStyle='#b8edda';c.beginPath();c.arc(644,139,72,Math.PI*.75,Math.PI*.75+Math.PI*1.5*progress);c.stroke();
   c.fillStyle='#b8d2d6';c.font='500 24px Pretendard';c.fillText(['공기 주입','온도 변화','압축 정도','확인 완료','피스톤 이동'][i],592,153);
   c.fillStyle='#0d2430';c.fillRect(24,211,720,65);c.fillStyle='#d7e9e8';c.font='500 28px Pretendard';c.fillText(lines[i][1],40,253,686);d.tex.needsUpdate=true;
  });
  for(const d of this.signs){const c=d.ctx,i=d.station,status=i===4?this.access.every(x=>x==='complete')?'active':'locked':this.access[i];if(this.signKeys.get(d.canvas)===status)continue;this.signKeys.set(d.canvas,status);c.fillStyle='#10242d';c.fillRect(0,0,1280,256);c.fillStyle=status==='locked'?'#506973':'#a4dfd0';c.fillRect(0,0,8,256);c.font='600 124px Pretendard';c.fillText(`0${i+1}`,40,170);c.fillStyle='#e8f1ef';c.font='600 61px Pretendard';c.fillText(labNames[i],245,115);c.fillStyle='#a3bec3';c.font='500 36px Pretendard';c.fillText(status==='locked'?'잠김 · 앞선 실험을 먼저 완료하세요':status==='complete'?'✓ 탐구 완료':status==='review'?'발견한 비밀을 확인하세요':'현재 목적지 · 실험 시작',248,187);d.tex.needsUpdate=true;}

 }
 updateRoute(goal:number){
  const p=this.camera.position,[gx]=centers[goal],end={x:goal===4?0:Math.sign(gx)*6.75,z:goal===4?-2.7:goal<2?-4:4.5};
  const key=goal+':'+Math.round(p.x*2)+':'+Math.round(p.z*2);if(key===this.lastRoute)return;this.lastRoute=key;
  const path=planRoute({x:p.x,z:p.z},end,(x,z)=>this.valid(x,z));const points=[{x:p.x,z:p.z},...path];
  for(const o of [...this.route.children]){o.removeFromParent();if(o instanceof THREE.Mesh)o.geometry.dispose();}
  const previous=this.route.userData.material as THREE.Material|undefined;previous?.dispose();const material=new THREE.MeshBasicMaterial({color:0xa5eadb,transparent:true,opacity:.74,depthWrite:false});this.route.userData.material=material;
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z),angle=Math.atan2(b.x-a.x,b.z-a.z);
   const strip=new THREE.Mesh(new THREE.PlaneGeometry(.045,length),material);strip.rotation.set(-Math.PI/2,0,-angle);strip.position.set((a.x+b.x)/2,.022,(a.z+b.z)/2);this.route.add(strip);
   for(let d=.7;d<length;d+=1.2){const shape=new THREE.Shape();shape.moveTo(-.16,-.12);shape.lineTo(0,.12);shape.lineTo(.16,-.12);shape.lineTo(0,-.035);shape.closePath();const arrow=new THREE.Mesh(new THREE.ShapeGeometry(shape),material);arrow.rotation.set(-Math.PI/2,0,-angle);arrow.position.set(a.x+(b.x-a.x)*d/length,.026,a.z+(b.z-a.z)*d/length);this.route.add(arrow);}
  }
  const marker=new THREE.Mesh(new THREE.RingGeometry(.24,.29,48),material);marker.rotation.x=-Math.PI/2;marker.position.set(end.x,.025,end.z);this.route.add(marker);
 }
 sign(station:number,x:number,y:number,z:number,width:number){const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=256;const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width/5),new THREE.MeshBasicMaterial({map:tex}));mesh.position.set(x,y,z);this.scene.add(mesh);this.signs.push({canvas,ctx:canvas.getContext('2d')!,tex,station});return mesh;}
 visualBounds(station:number){
  this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);
  const r=this.canvas.getBoundingClientRect();
  return this.inspectionObjects.filter(o=>o.station===station&&o.object.visible).map(({id,object})=>{
   const b=new THREE.Box3().setFromObject(object),points=[];
   for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=v(x,y,z).project(this.camera);points.push({x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2});}
   return {id,left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))};
  });
 }
 quality(q:string){this.high=q==='high';this.renderer.setPixelRatio(q==='low'?1:Math.min(devicePixelRatio,q==='high'?1.7:1.25));this.renderer.shadowMap.enabled=q!=='low';this.scene.environmentIntensity=q==='low'?.45:.6;}
 resize(){const r=this.canvas.getBoundingClientRect();this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();this.renderer.setSize(r.width,r.height,false);}
 render(){const t=performance.now();this.renderer.render(this.scene,this.camera);this.drawMs=performance.now()-t;}
 setHover(hit:Hit|null){this.hovered=hit?.object??null;this.highlight.visible=false;if(hit){this.highlight.box.setFromObject(hit.object);this.highlight.box.expandByScalar(.009);}}
 project(object:THREE.Object3D){const p=new THREE.Box3().setFromObject(object).getCenter(v()).project(this.camera);const r=this.canvas.getBoundingClientRect();return {x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height};}
}


