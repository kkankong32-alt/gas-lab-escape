import * as T from 'three';
export function flameMesh(){
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,uniforms:{time:{value:0},heat:{value:1}},vertexShader:`varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 varying vec2 uv0;uniform float time;uniform float heat;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){
 float y=uv0.y;float x=(uv0.x-.5)*2.;
 float curl=sin(time*2.7+y*5.)*.25*y*y+sin(time*5.3-y*7.)*.09*y;
 float n=noise(vec2(x*3.+time*.16,y*4.-time*1.4));
 x-=curl+(n-.5)*.09*y;
 // Rounded lower bulb and a curling narrow tongue; no straight triangle edges.
 float h=.91+.025*sin(time*4.1);float q=clamp(y/h,0.,1.);
 float radius=.70*pow(max(.00001,sin(3.14159*q)),.56)*(1.-.53*q);
 float d=abs(x)/max(.012,radius);
 float body=(1.-smoothstep(.68,1.12,d))*smoothstep(0.,.035,y)*(1.-smoothstep(h-.045,h,y));
 float halo=exp(-x*x/ (.06+radius*radius*1.2)-pow((y-.36)*2.,2.))* .10;
 float core=exp(-pow(x/max(.025,radius*.49),2.)-pow((y-.29)*2.9,2.));
 vec3 col=mix(vec3(1.,.20,.014),vec3(1.,.71,.12),smoothstep(.9,.1,d));
 col=mix(col,vec3(1.,.98,.78),core*.94);
 float blue=exp(-pow(x/.19,2.)-pow((y-.065)/.075,2.));col=mix(col,vec3(.17,.42,1.),blue*.88);
 float dark=exp(-pow(x/.12,2.)-pow((y-.12)/.11,2.));col=mix(col,vec3(.18,.12,.08),dark*.5);
 float alpha=clamp(body*.89+halo,0.,.98);gl_FragColor=vec4(col*(.92+.09*heat),alpha);
 }

 `});const geometry=new T.PlaneGeometry(.15,.23,1,1);geometry.translate(0,.115,0);const m=new T.Mesh(geometry,material);m.renderOrder=14;m.castShadow=false;m.receiveShadow=false;return m;
}
export class Smoke extends T.Group {
 age=10;particles:T.Sprite[]=[];
 constructor(){super();const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d')!,g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#b0c0ccaa');g.addColorStop(.4,'#9aabbc66');g.addColorStop(1,'#9aabbc00');x.fillStyle=g;x.fillRect(0,0,128,128);const map=new T.CanvasTexture(c);for(let i=0;i<7;i++){const p=new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthWrite:false,opacity:0,color:0xb6c4d0}));p.renderOrder=15;this.add(p);this.particles.push(p);}}
 trigger(){this.age=0;}
 update(dt:number){this.age+=dt;this.visible=this.age<4;this.particles.forEach((p,i)=>{const t=this.age-i*.17;p.visible=t>0&&t<2.8;const q=Math.max(0,t);p.position.set(Math.sin(q*2+i)*.025*q,.06+q*.12,0);p.scale.setScalar(.045+q*.075);(p.material as T.SpriteMaterial).opacity=Math.max(0,(1-q/2.8))*.55;});}
}
