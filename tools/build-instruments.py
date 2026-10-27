"""Original precision apparatus. Coordinates are metres in Blender Z-up.
Profiles, rounded machined housings, seals, ribs, fasteners and graduations.
Run Blender --background --python tools/build-instruments.py.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parents[1]/'public/assets/instruments'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,rough=.3,trans=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1);m.use_nodes=True
 m.node_tree.nodes.clear();p=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled');out=m.node_tree.nodes.new('ShaderNodeOutputMaterial');m.node_tree.links.new(p.outputs['BSDF'],out.inputs['Surface']);p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 p.inputs['Transmission Weight'].default_value=trans
 if trans:p.inputs['IOR'].default_value=1.46
 return m
steel=mat('Brushed surgical steel',(.39,.48,.52),.85,.24)
dark=mat('Graphite anodised aluminium',(.035,.055,.065),.72,.31)
white=mat('Porcelain laboratory enamel',(.72,.79,.8),.22,.3)
rubber=mat('Black silicone seals',(.012,.02,.026),0,.64)
glass=mat('Borosilicate glass',(.83,.96,.97),0,.09,.88)
pet=mat('Transparent PET',(.83,.94,.97),0,.13,.8)
teal=mat('Teal safety polymer',(.02,.42,.43),.18,.31)
orange=mat('Amber safety polymer',(.92,.32,.045),.15,.32)
membrane=mat('Elastic silicone membrane',(.33,.51,.58),0,.48)
def apply(o,name,m):
 o.name=name;o.data.materials.append(m)
 return o
def bevel(o,w=.008,n=3):
 mod=o.modifiers.new('Manufactured edge radii','BEVEL');mod.width=w;mod.segments=n
 mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def box(name,loc,size,m=steel,b=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);apply(o,name,m);bevel(o,b);return o
def lathe(name,profile,m=steel,n=72,loc=(0,0,0)):
 vs=[];fs=[]
 for z,r in profile:
  for i in range(n):
   a=i*2*math.pi/n;vs.append((loc[0]+r*math.cos(a),loc[1]+r*math.sin(a),loc[2]+z))
 for j in range(len(profile)-1):
  for i in range(n):
   a=j*n+i;b=j*n+(i+1)%n;fs.append((a,b,b+n,a+n))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],fs);mesh.update()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);apply(o,name,m)
 for p in mesh.polygons:p.use_smooth=True
 return o
def cyl(name,loc,r,h,m=steel):
 o=lathe(name,[(-h/2,0),(-h/2,r*.94),(-h/2+.003,r),(h/2-.003,r),(h/2,r*.94),(h/2,0)],m,48)
 o.location=loc
 return o
def ring(name,z,r,t=.005,m=steel,xy=(0,0)):
 return lathe(name,[(z-t,r-t),(z-t,r),(z+t,r),(z+t,r-t),(z-t,r-t)],m,64,(xy[0],xy[1],0))
def text(name,body,loc,size=.025,m=dark,rot=(math.pi/2,0,0)):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.size=size;c.extrude=.0001;c.align_x='CENTER'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;o.data.materials.append(m);return o
def screws(x,y,z):
 for a in [-1,1]:
  for b in [-1,1]:
   o=cyl('Captive hex fastener',(a*x,b*y,z),.009,.004,steel)
   box('Screw driver slot',(a*x,b*y,z+.003),(.011,.002,.002),dark,.0004)
def save(name):
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',export_apply=True,export_yup=True)
 bpy.ops.object.delete(use_global=False)
def base(w=.6,d=.44,h=.07):
 box('Machined plinth',(0,0,h/2),(w,d,h),dark,.018)
 box('Satin upper panel',(0,0,h+.004),(w-.025,d-.025,.012),steel,.008)
 screws(w/2-.035,d/2-.035,h+.013)
 for x in [-w/2+.04,w/2-.04]:
  for y in [-d/2+.04,d/2-.04]:cyl('Vibration isolator',(x,y,.006),.023,.016,rubber)
def gauge(x,y,z):
 # Face lies in XY, readable from an elevated view.
 cyl('Gauge bezel',(x,y,z),.095,.025,steel)
 cyl('Gauge dial',(x,y,z+.014),.084,.002,white)
 for i in range(25):
  a=math.radians(-135+i*270/24);o=box('Gauge tick',(x+math.sin(a)*.07,y+math.cos(a)*.07,z+.016),(.002,.009 if i%4 else .016,.001),dark,.0001);o.rotation_euler.z=-a
 text('Gauge unit','kPa',(x,y-.025,z+.018),.016,dark,(0,0,0))

# PET bottle with five real rib profiles, shoulder and molded neck.
profile=[(0,0),(.004,.042),(.01,.05),(.025,.051)]
for z in [.035,.065,.095,.125,.155]:
 profile += [(z,.048),(z+.005,.051),(z+.013,.051),(z+.018,.048)]
profile += [(.18,.047),(.193,.043),(.21,.033),(.225,.017),(.245,.017),(.247,.014),(.225,.014),(.208,.03),(.19,.04),(.17,.044),(.02,.044),(.012,0)]
lathe('PET bottle 500 mL',profile,pet,96)
for z in [.229,.235,.241]:ring('Moulded neck thread',z,.018,.002,white)
cyl('Sealed air injection cap',(0,0,.257),.025,.025,teal)
for i in range(32):
 a=i*math.tau/32;box('Cap grip knurl',(.024*math.cos(a),.024*math.sin(a),.257),(.002,.002,.018),teal,.0005)
cyl('Check valve inlet',(0,0,.279),.009,.02,steel)
text('Volume marking','500 mL',(0,-.051,.127),.015)
text('Bottle serial','P-01',(0,-.05,.103),.012)
save('bottle')

base(.5,.4,.075)
cyl('Load cell',(0,0,.104),.035,.05,steel)
cyl('Weighing pan',(0,0,.14),.155,.018,steel)
box('Display surround',(0,-.151,.091),(.24,.07,.025),rubber,.007)
text('Balance resolution','0.01 g  /  MAX 500 g',(0,.13,.088),.014,white,(0,0,0))
save('balance')

base(.32,.24,.04)
lathe('Pump barrel',[(.05,.048),(.06,.053),(.23,.053),(.25,.043),(.255,.025)],dark)
for z in [.067,.235]:ring('Pump compression fitting',z,.055,.006,steel)
cyl('pumpRod',(0,0,.335),.012,.17,steel)
box('pumpHandle',(0,0,.43),(.22,.045,.04),rubber,.018)
cyl('Hose socket',(.105,0,.075),.018,.04,steel)
save('pump')

lathe('Rigid 500 mL gas jar',[(0,0),(.006,.069),(.015,.075),(.19,.075),(.204,.072),(.21,.069),(.208,.064),(.018,.068),(.01,0)],glass,96)
ring('Rolled glass rim',.208,.074,.005,glass)
ring('Membrane retaining band',.204,.078,.005,orange)
lathe('membrane',[(0,0),(0,.018),(0,.038),(0,.055),(0,.07)],membrane,96,loc=(0,0,.214))
text('Jar volume','500 mL',(0,-.076,.11),.016)
save('jar')

base(.44,.42,.035)
lathe('Bath double wall',[(.044,0),(.045,.19),(.055,.2),(.18,.2),(.188,.195),(.188,.181),(.06,.181),(.058,0)],steel,96)
ring('Bath rim',.184,.2,.006,white)
for x in [-.22,.22]:box('Insulated bath handle',(x,0,.12),(.06,.15,.035),rubber,.012)
save('bath')

# Syringe axis exported Y: interact with vertical piston, 90 mL graduation capacity / 60 initial.
base(.38,.32,.04)
cyl('Syringe closed nozzle',(0,0,.095),.012,.09,white)
lathe('Syringe transparent barrel',[(.13,.033),(.14,.043),(.62,.043),(.63,.048),(.64,.048),(.64,.038),(.145,.036),(.13,.025)],glass,96)
box('Finger flange',(0,0,.635),(.18,.07,.015),white,.02)
for i in range(31):
 z=.16+i*.0145
 box('Graduation',(0,-.0435,z),(.025 if i%5==0 else .013,.0015,.0015),dark,.0001)
 if i%5==0:text('Graduation value',str(i*3),(.026,-.044,z-.003),.011)
cyl('pistonSeal',(0,0,.45),.035,.018,rubber)
cyl('pistonRod',(0,0,.615),.012,.32,white)
box('pistonHandle',(0,0,.785),(.15,.075,.02),teal,.015)
cyl('syringeCap',(0,0,.058),.023,.032,orange)
save('syringe')

base(.54,.48,.045)
lathe('Vacuum chamber wall',[(.06,0),(.065,.205),(.075,.212),(.4,.212),(.415,.205),(.415,.195),(.08,.195),(.073,0)],glass,96)
cyl('Vacuum lid',(0,0,.426),.22,.025,dark)
ring('Lid seal',.414,.21,.007,rubber)
cyl('Vacuum port',(.12,0,.455),.022,.05,steel)
box('Vacuum carry handle',(0,0,.49),(.16,.03,.025),steel)
box('balloonPlate',(0,0,.36),(.25,.16,.012),steel)
for x in [-.15,.15]:cyl('Plate guide',(x,0,.27),.007,.27,steel)
save('chamber')

lathe('Cylinder shell',[(0,0),(.008,.06),(.025,.075),(.29,.075),(.32,.069),(.345,.045),(.355,.023)],white,96)
cyl('Cylinder regulator',(0,0,.382),.028,.055,steel)
ring('Protective base shoe',.018,.078,.009,dark)
box('Cartridge valve',(0,0,.417),(.085,.025,.016),teal,.008)
save('cartridge')

base(.27,.26,.045)
cyl('Valve shaft',(0,0,.105),.018,.12,steel)
ring('valveWheel',.18,.1,.011,orange)
for a in [0,math.pi/3,2*math.pi/3]:
 o=box('valveSpoke',(0,0,.18),(.18,.014,.014),orange,.006);o.rotation_euler.z=a
cyl('Valve hub',(0,0,.18),.025,.022,steel)
save('valve')

base(.65,.5,.065)
for x in [-.23,.23]:cyl('Precision guide',(x,0,.36),.014,.55,steel)
lathe('Pneumatic actuator',[(.08,.1),(.1,.12),(.43,.12),(.45,.1)],steel,72)
for z in [.12,.4]:ring('Actuator band',z,.125,.01,dark)
cyl('actuatorRod',(0,0,.44),.035,.42,steel)
box('actuatorHead',(0,0,.66),(.5,.12,.035),teal,.008)
gauge(0,-.17,.09)
save('actuator')

# Precision lever linked to the membrane; pivot, small probe and sliding bolt.
base(.28,.18,.03)
for x in [-.065,.065]:box('Pivot bearing',(x,0,.2435),(.025,.055,.407),dark,.007)
shaft=cyl('Lever pivot',(0,0,.427),.022,.19,steel);shaft.rotation_euler.y=math.pi/2
box('leverArm',(0,0,.437),(.66,.025,.025),steel,.006)
cyl('Probe',(-.3,0,.402),.008,.065,white)
box('latchBolt',(.32,0,.467),(.1,.045,.045),orange,.009)
save('lever')

# Sealed observation cell, with fasteners and vacuum fittings.
base(.5,.43,.04)
lathe('Observation glass',[(.06,.195),(.07,.2),(.35,.2),(.36,.195),(.36,.185),(.07,.185),(.06,.195)],glass,80)
ring('Chamber lower flange',.073,.214,.014,dark)
ring('Chamber upper flange',.35,.214,.014,steel)
for i in range(8):
 a=math.tau*i/8;cyl('Rim fastener',(.207*math.cos(a),.207*math.sin(a),.366),.008,.008,steel)
cyl('Inlet fitting',(.21,0,.14),.018,.055,steel)
cyl('Filtered exhaust',(-.21,0,.31),.021,.07,dark)
save('cell')

# Thin foil bag, curved faces and crimped seams rather than a primitive solid.
vs=[];fs=[];nx=24;nz=24
for side in [-1,1]:
 for j in range(nz+1):
  t=j/nz
  for i in range(nx+1):
   u=i/nx;x=(u-.5)*.24;z=.02+t*.27
   bulge=.046*(math.sin(math.pi*u)*math.sin(math.pi*t))**.65
   y=side*(.004+bulge+.0015*math.sin(i*math.pi)*math.cos(j*2))
   vs.append((x,y,z))
off=(nx+1)*(nz+1)
for side in range(2):
 for j in range(nz):
  for i in range(nx):
   a=side*off+j*(nx+1)+i;face=(a,a+1,a+nx+2,a+nx+1);fs.append(face if side else tuple(reversed(face)))
mesh=bpy.data.meshes.new('Foil formed pouch');mesh.from_pydata(vs,[],fs);mesh.update()
o=bpy.data.objects.new('Sealed food pouch',mesh);bpy.context.collection.objects.link(o);apply(o,'Sealed food pouch',mat('Satin foil',(.6,.56,.35),.5,.35))
for p in mesh.polygons:p.use_smooth=True
for z in [.025,.285]:
 box('Crimped seam',(0,0,z),(.25,.012,.018),steel,.002)
 for i in range(25):box('Seam crimp',(-.12+i*.01,-.008,z),(.003,.003,.015),dark,.0006)
text('Food packaging','N2',(0,-.054,.14),.045,white)
save('pouch')

# Lock bolt with guide bearings, fasteners, and machined slide.
base(.42,.22,.045)
for x in [-.11,.11]:box('Bolt guide',(x,0,.12),(.07,.13,.13),dark,.012)
bolt=cyl('slidingBolt',(0,0,.14),.04,.48,steel);bolt.rotation_euler.y=math.pi/2
box('boltHandle',(-.19,0,.2),(.045,.045,.13),orange,.007)
save('bolt')

# Display enclosure: actual rear stand, bezel and captive front fasteners.
base(.52,.30,.025)
box('Display upright',(0,.045,.38),(.055,.055,.73),steel,.01)
box('Monitor housing',(0,0,.8),(1.80,.09,.66),dark,.025)
box('Monitor face rim',(0,-.049,.8),(1.55,.008,.60),steel,.012)
for x in [-.85,.85]:
 for z in [.51,1.09]:
  box('Monitor fastener',(x,-.05,z),(.012,.006,.012),steel,.003)
save('monitor')

# Folded cloth with a soft continuous surface and stitched perimeter.
vs=[];fs=[];nx=40;ny=24
for j in range(ny+1):
 for i in range(nx+1):
  x=(i/nx-.5)*.34;y=(j/ny-.5)*.24
  z=.012+.004*math.sin(i*.36)*math.cos(j*.4)+.009*math.exp(-((y+.06)/.025)**2)
  vs.append((x,y,z))
for j in range(ny):
 for i in range(nx):
  a=j*(nx+1)+i;fs.append((a,a+1,a+nx+2,a+nx+1))
me=bpy.data.meshes.new('Woven cloth');me.from_pydata(vs,[],fs);me.update()
o=bpy.data.objects.new('Folded drying towel',me);bpy.context.collection.objects.link(o);apply(o,'Folded drying towel',mat('Woven cotton',(.51,.64,.65),0,.95))
solid=o.modifiers.new('Cloth thickness','SOLIDIFY');solid.thickness=.008
for p in me.polygons:p.use_smooth=True
save('towel')
print('Precision instruments exported:',OUT)

