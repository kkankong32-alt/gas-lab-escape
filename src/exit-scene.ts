import * as T from 'three';
type Place=(name:string,pos:T.Vector3,dimensions?:T.Vector3,rotation?:number,parent?:T.Object3D)=>T.Group;
export function exitAtrium(root:T.Group,model:Place){
 root.name='escape-arrival-atrium';
 const put=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,rot=0)=>model(name,new T.Vector3(x,y,z),new T.Vector3(w,h,d),rot,root);
 // Finished CC0 Quaternius kit modules, shared with the laboratory. No primitive corridor shell.
 for(let z=-8;z>=-24;z-=2)for(const x of [-4,-2,0,2,4])put(x===0?'Platform_CenterPlate':'Platform_Metal',x,-.055,z,2,.11,2);
 for(const side of [-1,1])for(const z of [-9,-13,-17,-21]){
  put('WallAstra_Straight_Window',side*5,2,z,.3,4,4);
  put('TopCables_Straight',side*4.8,3.8,z,.35,.4,4);
  put('Prop_Light_Wide',side*4.5,3.45,z,1.3,.14,.45);
  // Shared overhead lighting; side fixtures do not each add a per-pixel light.
 }
 for(const z of [-9,-15,-21]){
  put('Door_Frame_SquareTall',0,2.2,z,9.8,4.4,.55);
  put('Prop_Light_Wide',0,4.1,z,2.4,.12,.65);
  const light=new T.PointLight(0xf2e4c2,20,9,2);light.position.set(0,3.8,z);root.add(light);
 }
 for(const side of [-1,1]){
  put('Prop_Computer',side*3.7,.9,-15,1.15,1.8,1.0,side>0?-Math.PI/2:Math.PI/2);
  put('Prop_Crate3',side*3.8,.45,-19,.95,.9,.95);
  put('Prop_Barrel_Large',side*4.05,.65,-20.3,.7,1.3,.7);
  put('Prop_Vent_Wide',side*3.2,3.85,-17,2,.15,1.2);
 }
 // Beyond the bay is another open portal and receding deck, not a flat end wall.
 for(const z of [-26,-28,-30])for(const x of [-1,1])put('Platform_Metal',x,-.055,z,2,.11,2);
 put('Door_Frame_SquareTall',0,2,-25,4.4,4,.5);
 const welcome=new T.SpotLight(0xffdfad,28,19,Math.PI/5,.75,1.6);welcome.position.set(-3,5,-20);welcome.target.position.set(0,.5,-13);root.add(welcome,welcome.target);
 root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
}
