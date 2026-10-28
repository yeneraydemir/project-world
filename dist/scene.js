import {CATALOG} from './catalog.js';
import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {phase,DAY,poolPhase} from './data.js';
const materials=new Map();
const mat=(color,opts={})=>{const key=color+JSON.stringify(opts);if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.8,...opts}));return materials.get(key);};
function box(g,w,h,d,x,y,z,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function cyl(g,r1,r2,h,x,y,z,color,n=12){const m=new T.Mesh(new T.CylinderGeometry(r1,r2,h,n),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function tree(parent,x,z,h=4){const g=group(parent,x,0,z);cyl(g,.14,.22,h*.65,0,h*.33,0,'#76634c',7);for(const [dx,dy,dz,r]of [[0,.68,0,.36],[-.17,.57,.1,.25],[.16,.52,-.13,.26]]){const m=new T.Mesh(new T.IcosahedronGeometry(h*r,1),mat('#788958'));m.position.set(h*dx,h*dy,h*dz);m.castShadow=true;g.add(m);}return g;}
function person(parent,x,z,authority='worker',office=false){
 const g=group(parent,x,.12,z),colors=office?(authority==='chief'?['#5f5a4b','#41615c']:authority==='leader'?['#5f5a4b','#567183']:['#5f5a4b','#c4c8b8']):authority==='chief'?['#e8e9de','#5c8ea1']:authority==='leader'?['#5486b0','#8ba864']:['#e8bb45','#df9250'];
 cyl(g,.18,.18,.37,0,1.46,0,'#c8a486');cyl(g,office?.19:.25,office?.19:.25,office?.07:.12,0,1.67,0,colors[0]);box(g,.5,.62,.27,0,1.05,0,colors[1]);box(g,.17,.65,.2,-.15,.42,0,'#3f5355');box(g,.17,.65,.2,.15,.42,0,'#3f5355');box(g,.13,.55,.16,-.35,1.06,0,'#c8a486');box(g,.13,.55,.16,.35,1.06,0,'#c8a486');if(!office)box(g,.54,.07,.28,0,1.1,0,'#e6e1c8');return g;
}
function vehicle(parent,type,color='#d0aa68'){
 const g=group(parent),wheels=[];box(g,6,.5,2.4,0,.78,0,'#364a4d');box(g,1.9,1.75,2.45,2.1,1.78,0,color);box(g,.05,.72,2.05,3.07,2.04,0,'#729b9e');box(g,1.25,.7,.04,2.05,2.02,1.24,'#729b9e');box(g,1.25,.7,.04,2.05,2.02,-1.24,'#729b9e');
 for(const x of [-2,-.8,2.15])for(const z of [-1.26,1.26]){const m=cyl(g,.49,.49,.29,x,.57,z,'#293c3e');m.rotation.x=Math.PI/2;cyl(m,.18,.18,.31,0,0,0,'#b5b8a5');box(m,.1,.32,.76,0,0,0,'#8e9a8c');wheels.push(m);}
 let spin=null;
 if(type==='mixer'){const holder=group(g,-.8,1.9,0);holder.rotation.z=-.16;spin=group(holder);const drum=cyl(spin,.8,1.05,3,0,0,0,'#dedbd0',18);drum.rotation.z=Math.PI/2;box(spin,2.6,.08,.25,0,.88,0,'#b69b5f');for(const x of [-.6,.5]){const band=cyl(spin,.98,.98,.16,x,0,0,'#b39156',18);band.rotation.z=Math.PI/2;}box(g,1.3,.15,.6,-3.3,1,0,'#8c958d');}
 else if(type==='excavator'){box(g,3.6,1.2,2.3,-.8,1.65,0,'#dbb355');box(g,2,.35,.45,-2.3,3.2,0,'#d3a14b').rotation.z=-.65;box(g,2.5,.35,.45,-3.7,2.4,0,'#d3a14b').rotation.z=.8;box(g,.75,.65,.9,-4.5,1.1,0,'#506263');}
 else{box(g,4,type==='semi'?.2:1.5,2.4,-1.2,type==='semi'?1.05:1.7,0,type==='semi'?'#b7c5bb':'#a8b49d');if(type!=='semi')box(g,4.1,.15,2.5,-1.2,2.5,0,'#dce1cf');}
 return {g,wheels,spin,type};
}
function crane(parent,x,z,height){const g=group(parent,x,0,z),yellow='#d0b46c';for(let y=0;y<height;y+=3){box(g,.65,3,.65,0,y+1.5,0,yellow);box(g,.12,3.2,.12,.42,y+1.5,0,'#b19554').rotation.z=.24;box(g,.12,3.2,.12,-.42,y+1.5,0,'#b19554').rotation.z=-.24;}const arm=group(g,0,height,0);box(arm,17,.5,.6,4,0,0,yellow);box(arm,3,.8,1.3,-4,-.1,0,'#707f77');const rope=box(arm,.055,height*.65,.055,10,-height*.325,0,'#6a7470');box(arm,1,.5,1,10,-height*.65,0,'#bca276');return arm;}
function roof(parent,b,y){if(b.roof==='pitched'){const points=[new T.Vector2(-b.d/2-.5,0),new T.Vector2(0,2.6),new T.Vector2(b.d/2+.5,0)];const shape=new T.Shape(points);const geo=new T.ExtrudeGeometry(shape,{depth:b.w+1,bevelEnabled:false});const mesh=new T.Mesh(geo,mat('#6a7771'));mesh.rotation.y=-Math.PI/2;mesh.position.set(b.w/2+.5,y,0);mesh.castShadow=true;parent.add(mesh);}else{box(parent,b.w+.4,.35,b.d+.4,0,y,0,'#b8b8a5');for(let i=0;i<3;i++){const solar=box(parent,1.8,.12,2.8,-b.w*.25+i*2.1,y+.5,0,'#46717b');solar.rotation.x=.18;}}}
export class WorldScene{
 constructor(container,{select,plot,status}){
  this.el=container;this.select=select;this.plot=plot;this.status=status;this.mode='normal';this.time=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.ray=new T.Raycaster();this.ground=new T.Plane(new T.Vector3(0,1,0),0);this.scene=new T.Scene();this.scene.background=new T.Color('#c7d3ca');this.scene.fog=new T.Fog('#c7d3ca',140,290);
  this.camera=new T.OrthographicCamera(-50,50,45,-45,.1,500);this.camera.position.set(78,79,92);
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;container.append(this.renderer.domElement);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,8,0);this.controls.enableDamping=true;this.controls.minZoom=.35;this.controls.maxZoom=4;this.controls.maxPolarAngle=Math.PI*.48;this.controls.update();
  this.scene.add(new T.HemisphereLight('#fff8e5','#839681',2.5));const sun=new T.DirectionalLight('#fff0d3',3);sun.position.set(-45,85,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:200});sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;this.scene.add(sun);
  this.static=group(this.scene);box(this.static,500,.4,500,0,-.65,0,'#b6c6b0');box(this.static,62,1,62,0,-.25,0,'#9da48b');box(this.static,60,.14,60,0,.32,0,'#c1b496');for(let i=0;i<10;i++){tree(this.static,-38-i%3*3,-29+i*7,4+i%3);tree(this.static,38+i%2*4,-28+i*7,4+i%2);}
  this.grid=new T.GridHelper(60,6,'#ab976f','#b4a482');this.grid.position.y=.42;this.scene.add(this.grid);this.grid.visible=false;
  this.root=group(this.scene);this.labelRoot=document.createElement('div');this.labelRoot.className='world-labels';container.append(this.labelRoot);
  this.selectionBox=new T.Mesh(new T.BoxGeometry(1,.08,1),new T.MeshBasicMaterial({color:'#e5c879',transparent:true,opacity:.5,depthWrite:false}));this.selectionBox.visible=false;this.selectionBox.position.y=.49;this.scene.add(this.selectionBox);
  this.renderer.domElement.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY,point:this.point(e)};});this.renderer.domElement.addEventListener('pointermove',e=>{if(this.mode==='plot'&&this.down?.point){const p=this.point(e),a=this.down.point;if(p){this.selectionBox.visible=true;this.selectionBox.position.set((a.x+p.x)/2,.49,(a.z+p.z)/2);this.selectionBox.scale.set(Math.max(5,Math.abs(a.x-p.x)),1,Math.max(5,Math.abs(a.z-p.z)));}}});
  this.renderer.domElement.addEventListener('pointerup',e=>{if(!this.down)return;const dist=Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y);if(this.mode==='plot'&&this.down.point){const b=this.point(e),a=this.down.point;if(b){this.plot({x:Math.round((a.x+b.x)/2),z:Math.round((a.z+b.z)/2),w:dist<8?10:Math.max(5,Math.round(Math.abs(a.x-b.x))),d:dist<8?10:Math.max(5,Math.round(Math.abs(a.z-b.z)))});}}else if(dist<7){this.cast(e);const hit=this.ray.intersectObjects(this.root.children,true).find(h=>{let o=h.object;while(o){if(o.userData.record)return true;o=o.parent;}return false;});let o=hit?.object;while(o&&!o.userData.record)o=o.parent;if(o)this.select(o.userData.record);}this.down=null;});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();this.last=performance.now();this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);
 }
 cast(e){const r=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);}
 point(e){this.cast(e);return this.ray.ray.intersectPlane(this.ground,new T.Vector3());}
 resize(){const w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);const a=w/h;this.camera.left=-44*a;this.camera.right=44*a;this.camera.top=44;this.camera.bottom=-44;this.camera.updateProjectionMatrix();}
 overview(){this.controls.target.set(0,8,0);this.camera.position.set(78,79,92);this.camera.zoom=this.el.clientWidth<500?.66:.92;this.camera.updateProjectionMatrix();this.controls.update();}
 zoom(f){this.camera.zoom=T.MathUtils.clamp(this.camera.zoom*f,.35,4);this.camera.updateProjectionMatrix();}
 rotate(){const v=this.camera.position.clone().sub(this.controls.target);v.applyAxisAngle(new T.Vector3(0,1,0),Math.PI/4);this.camera.position.copy(this.controls.target).add(v);this.controls.update();}
 setPlot(on){this.mode=on?'plot':'normal';this.controls.enabled=!on;this.grid.visible=on;this.selectionBox.visible=false;this.renderer.domElement.style.cursor=on?'crosshair':'';}
 focus(r){if(!r||r.x==null)return;this.controls.target.set(r.x,3,r.z);this.camera.position.set(r.x+42,40,r.z+48);this.camera.zoom=1.35;this.camera.updateProjectionMatrix();}
 rebuild(p,{interior=null,selected=null,route=false}={}){
  this.p=p;this.interior=interior;this.selected=selected;this.highlightTarget=null;this.highlightBox=null;this.labels=[];this.buildings=[];this.cars=[];this.people=[];this.cranes=[];this.pools=[];this.land=[];this.foliage=[];this.labelRoot.replaceChildren();
  this.root.traverse(o=>{if(o.geometry)o.geometry.dispose();});this.scene.remove(this.root);this.root=group(this.scene);
  const record=(g,col,r)=>{g.userData.record={col,id:r.id};if(selected?.id===r.id)this.highlightTarget=g;};
  const label=(name,g,y=2)=>{const el=document.createElement('button');el.className='world-label';el.textContent=name;el.tabIndex=-1;el.onclick=()=>this.select(g.userData.record);this.labelRoot.append(el);this.labels.push({el,g,y});};
  for(const b of p.buildings){const model=CATALOG[b.kind].model;const g=group(this.root,b.x,.4,b.z);record(g,'buildings',b);
   box(g,b.w+.8,.3,b.d+.8,0,.05,0,'#9b927b');const floors=[];
   for(let i=0;i<b.floors;i++){const f=group(g,0,i*3.1,0);box(f,b.w,.27,b.d,0,.35,0,'#d1c8b6');for(const x of [-b.w/2+.35,b.w/2-.35])for(const z of [-b.d/2+.35,b.d/2-.35])box(f,.42,3.1,.42,x,1.7,z,'#c4bca8');
    const wall=group(f);box(wall,b.w,2.8,.17,0,1.85,-b.d/2+.2,b.color);box(wall,.17,2.8,b.d,-b.w/2+.2,1.85,0,b.color);
    for(let x=-b.w/2+1.2;x<b.w/2-.5;x+=2.3){box(wall,1.55,1.65,.12,x,1.9,b.d/2-.07,'#6d9393');box(wall,1.72,.12,.2,x,1.02,b.d/2,'#a69578');}
    for(let z=-b.d/2+1.2;z<b.d/2-.5;z+=2.3)box(wall,.12,1.65,1.55,b.w/2-.07,1.9,z,'#5e8488');
    if(model==='villa'){box(wall,b.w*.38,.14,1.3,b.w*.2,.6,b.d/2+.45,'#bc9c72');box(wall,b.w*.38,.7,.07,b.w*.2,1.03,b.d/2+1.05,'#a6c4bd');}
    floors.push({f,wall});
   }
   const top=group(g,0,b.floors*3.1+.5,0);roof(top,b,0);if(model==='warehouse'){box(g,b.w*.42,3.1,.15,b.w*.18,1.75,b.d/2+.05,'#86978b');for(let i=0;i<3;i++)box(g,b.w*.42,.06,.2,b.w*.18,1+i*.7,b.d/2+.15,'#66786d');}
   if(model==='shop'||model==='mixed'){box(g,b.w*.82,2.25,.14,0,1.6,b.d/2+.1,'#729d9d');box(g,b.w+.3,.22,1.7,0,2.85,b.d/2+.65,'#b49761');box(g,b.w*.65,.4,.12,0,3.23,b.d/2+.2,'#5b7765');for(let x=-b.w/2+.7;x<b.w/2;x+=1.7)box(g,.09,2.4,.2,x,1.6,b.d/2+.23,'#b7b7a0');}if(model==='factory'){for(const x of [-b.w*.25,b.w*.25]){cyl(top,.45,.6,3,x,1.7,-b.d*.25,'#8b9a91');box(top,2,.6,2,x,.5,0,'#9ca999');}}if(model==='office'){for(const floor of floors)box(floor.wall,b.w*.88,1.55,.09,0,1.9,b.d/2+.05,'#628b96');}this.buildings.push({b,g,floors,top});label(b.name,g,b.floors*3.1+2);
   if(p.domain==='construction'&&['building','office','mixed'].includes(model)&&b.floors>4){const arm=crane(this.root,b.x-b.w/2-2.5,b.z-b.d/2+1,b.floors*3.1+6);arm.userData.building=b;this.cranes.push(arm);}
  }
  for(const u of p.spaces||[]){const b=p.buildings.find(b=>b.id===u.buildingId);if(!b)continue;const same=p.spaces.filter(x=>x.buildingId===b.id&&x.floor===u.floor),i=same.indexOf(u),step=Math.min(2,b.w/(same.length+1));const g=group(this.root,b.x-b.w/2+(i+1)*step,.4+(u.floor-1)*3.1+1.65,b.z+b.d/2+.26);box(g,Math.min(1.2,step*.75),.7,.16,0,0,0,selected?.id===u.id?'#e4c778':'#9cbfba');g.visible=p.domain==='business'||phase(b,Date.parse(p.cursor+'T00:00:00Z')).floors>=u.floor;record(g,'spaces',u);if(selected?.id===u.id)label(u.name+' · '+(u.floor===1?'Zemin':(u.floor-1)+'. kat'),g,1);}
  for(const c of p.containers){const g=group(this.root,c.x,.4,c.z);box(g,c.w,2.8,c.d,0,1.4,0,'#d2d5c3');box(g,c.w+.3,.15,c.d+.3,0,2.85,0,'#70887c');box(g,.85,2.1,.05,-c.w*.25,1.15,c.d/2+.02,'#76959a');for(const x of [0,c.w*.3])box(g,.95,.85,.05,x,1.65,c.d/2+.04,'#618b92');record(g,'containers',c);label(c.name,g,3.8);}
  for(const o of p.landscape){if(interior&&o.parentId!==interior)continue;if(o.parentId&&o.parentId!==interior)continue;let g=group(this.root,o.x,.42,o.z),phaseInfo=null;
   if(o.type==='tree'){this.foliage.push(tree(g,0,0,o.h));}
   else if(o.type==='pool'){box(g,o.w+.7,.06,o.d+.7,0,.02,0,'#9d8b70');box(g,o.w,.08,o.d,0,.08,0,'#776f5d');const shell=group(g);box(shell,o.w,.12,o.d,0,.15,0,'#b4b6a3');for(const z of [-o.d/2,o.d/2])box(shell,o.w,.3,.17,0,.28,z,'#c0c5b2');for(const x of [-o.w/2,o.w/2])box(shell,.17,.3,o.d,x,.28,0,'#c0c5b2');const liner=group(g);box(liner,o.w-.3,.06,o.d-.3,0,.22,0,'#8fbaba');for(const x of [-o.w/2-.1,o.w/2+.1])box(liner,.35,.1,o.d+.6,x,.4,0,'#ded7bd');for(const z of [-o.d/2-.1,o.d/2+.1])box(liner,o.w+.6,.1,.35,0,.4,z,'#ded7bd');box(liner,.09,.08,o.d*.65,o.w/2-.3,.3,0,'#467e88');const water=box(g,o.w-.45,.08,o.d-.45,0,.32,0,'#69b6bc');const shine=box(g,o.w*.65,.025,.08,0,.39,0,'#b6dfd2');this.pools.push({water,shine,o,g,shell,liner});}
   else if(o.type==='pergola'){for(const x of [-o.w/2,o.w/2])for(const z of [-o.d/2,o.d/2])box(g,.18,o.h,.18,x,o.h/2,z,'#907652');for(let x=-o.w/2;x<=o.w/2;x+=.65)box(g,.14,.18,o.d+.5,x,o.h,0,'#a98b61');}
   else if(o.type==='fence'||o.type==='hedge'){box(g,o.w,o.h,o.d,0,o.h/2,0,o.type==='hedge'?'#6f8456':'#b4a688');}
   else if(o.type==='light'){cyl(g,.07,.11,o.h,0,o.h/2,0,'#687b73');const bulb=new T.Mesh(new T.SphereGeometry(.22,10,8),mat('#ffe9ac',{emissive:'#e2c787',emissiveIntensity:.6}));bulb.position.y=o.h;g.add(bulb);}
   else if(o.type==='rack'){for(const x of [-o.w/2,o.w/2])for(const z of [-o.d/2,o.d/2])box(g,.08,o.h,.08,x,o.h/2,z,'#657e7c');for(let y=.3;y<o.h;y+=1.1){box(g,o.w,.1,o.d,0,y,0,'#ba9259');for(let x=-o.w/2+.4;x<o.w/2;x+=.8)box(g,.62,.65,o.d*.8,x,y+.38,0,'#c9b487');}}
   else{const colors={lawn:'#8b9f72',path:'#d8ccaf',terrace:'#aa8d64',road:'#79877c',pallet:'#b49260'};box(g,o.w,o.type==='pallet'?.4:o.h,o.d,0,(o.type==='pallet'?.4:o.h)/2,0,colors[o.type]||'#9baf83');if(o.type==='road')for(let z=-o.d/2;z<o.d/2;z+=3)box(g,.1,.02,1,0,o.h+.02,z,'#d9d8bb');}
   record(g,'landscape',o);this.land.push({g,o});if(selected?.id===o.id)label(o.name,g,o.h+1);
  }
  const boundary=p.boundary;const c=boundary.style==='wall'?'#bab39c':boundary.style==='hedge'?'#70865b':'#8c9277';const h=boundary.style==='line'?.05:boundary.height;
  for(const x of [-30,30])box(this.root,.15,h,60,x,h/2+.4,0,c);box(this.root,60,h,.15,0,h/2+.4,-30);for(const sign of [-1,1])box(this.root,(60-boundary.gate)/2,h,.15,sign*(15+boundary.gate/4),h/2+.4,30,c);this.gate=group(this.root,-boundary.gate/2,.4,30);box(this.gate,boundary.gate,.9,.13,boundary.gate/2,.45,0,'#6c8071');
  const road=group(this.root);box(road,76,.05,7,0,.1,36.2,'#7c887d');for(let x=-36;x<=36;x+=4)box(road,1.8,.02,.15,x,.14,36.2,'#d4d4b9');
  p.vehicles.forEach((v,i)=>{const car=vehicle(this.root,v.type,i%2?'#8baca6':'#d2aa69');record(car.g,'vehicles',v);car.v=v;car.index=i;this.cars.push(car);if(selected?.id===v.id)label(v.plate,car.g,4);});
  p.workers.filter(w=>w.status==='active').forEach((w,i)=>{const b=p.buildings.find(b=>b.id===w.buildingId)||p.buildings[0],x=b?b.x+(i%4-1.5)*1.1:-8+i%8*2,z=b?b.z+b.d/2+2+i%2*1.1:5+Math.floor(i/8)*2;const g=person(this.root,x,z,w.authority,p.domain==='business'&&(!b||['office','shop','mixed','villa'].includes(CATALOG[b.kind].model))); record(g,'workers',w);this.people.push({g,w,x,z,i});if(selected?.id===w.id)label(w.name,g,2.5);});
  if(p.domain==='business'){const j=p.jobs.find(j=>j.id===selected?.id)||null;if(j){const b=p.buildings.find(b=>b.id===j.buildingId),target=p.buildings.find(b=>b.id===j.targetId)||b;for(let i=0;i<j.quantity;i++){const loaded=i<j.loaded,car=this.cars.find(c=>c.v.id===j.vehicleId),onTruck=loaded&&car&&j.status!=='delivered'&&j.type!=='production';const dst=j.status==='delivered'?target:b;const x=dst.x-dst.w/2+.5+(i%8)*.65,z=dst.z+dst.d/2+1+Math.floor(i/8)*.55;const stack=onTruck?group(car.g,-2.5+(i%6)*.5,1.18+Math.floor(i/12)*.7,Math.floor(i/6)%2===0?-.55:.55):group(this.root,x,.45,z);box(stack,.52,.15,.44,0,.1,0,'#a58b5d');box(stack,.46,.55,.38,0,.44,0,loaded?'#86a68a':'#c3aa7a');stack.userData.record={col:'jobs',id:j.id};}
   if(route)this.drawRoute(j);
  }}
  if(interior){for(const entry of this.buildings){const inside=entry.b.id===interior;entry.g.visible=inside;entry.top.visible=false;entry.floors.forEach(f=>f.wall.visible=!inside);}}
  if(this.highlightTarget){this.highlightBox=new T.Box3Helper(new T.Box3().setFromObject(this.highlightTarget),'#ead492');this.root.add(this.highlightBox);}this.update(p.cursor);
 }
 drawRoute(j){const points=[new T.Vector3(-22,.7,8),new T.Vector3(-4,.7,-3),new T.Vector3(11,.7,5),new T.Vector3(23,.7,-14)];this.routeCurve=new T.CatmullRomCurve3(points);const line=new T.Line(new T.BufferGeometry().setFromPoints(this.routeCurve.getPoints(100)),new T.LineBasicMaterial({color:'#588c83'}));this.root.add(line);this.routeMarker=vehicle(this.root,'semi','#cfb779');this.routeMarker.g.scale.setScalar(.8);this.routeMarker.g.userData.record={col:'jobs',id:j.id};const point=this.routeCurve.getPoint(j.progress);this.routeMarker.g.position.copy(point);const t=this.routeCurve.getTangent(j.progress);this.routeMarker.g.rotation.y=-Math.atan2(t.z,t.x);}
 update(cursor){if(!this.p)return;const at=Date.parse(cursor+'T00:00:00Z');this.at=at;
  for(const entry of this.buildings){const ph=phase(entry.b,at);entry.floors.forEach(({f,wall},i)=>{const amount=Math.max(0,Math.min(1,((ph.f-.1)/.78)*entry.b.floors-i));f.visible=amount>0;f.scale.y=Math.max(.01,amount);wall.visible=!this.interior&&ph.f>.72;});entry.top.visible=!this.interior&&ph.f>.88;entry.top.scale.y=Math.max(.01,Math.min(1,(ph.f-.88)/.12));const l=this.labels.find(l=>l.g===entry.g);if(l){l.el.textContent=entry.b.name+' · %'+ph.percent;l.y=Math.max(3,ph.f*entry.b.floors*3.1+2);}}
  for(const arm of this.cranes)arm.parent.visible=phase(arm.userData.building,at).f<1;
  for(const pool of this.pools){const ph=poolPhase(pool.o,this.p,at);pool.shell.visible=ph.progress>=.2;pool.shell.scale.y=Math.max(.05,Math.min(1,(ph.progress-.2)/.25));pool.liner.visible=ph.progress>=.45;pool.water.visible=ph.water>0;pool.shine.visible=ph.water>.4;pool.water.scale.x=Math.max(.01,ph.water);pool.water.scale.z=Math.max(.01,ph.water);}
  for(const {g,o}of this.land){const b=this.p.buildings.find(b=>b.id===o.buildingId);if(b&&o.type!=='pool')g.visible=phase(b,at).f>.85;}
 }
 tick(now){const dt=Math.min((now-this.last)/1000,.05);this.last=now;if(!this.reduced)this.time+=dt;const t=this.time;
  for(const car of this.cars){const {v,index:i}=car,angle=t*.038+i*1.6,x=Math.cos(angle)*25,z=Math.sin(angle)*26;car.g.position.set(x,.45,z);car.g.rotation.y=-Math.atan2(26*Math.cos(angle),-25*Math.sin(angle));if(v.status==='maintenance'){car.g.position.set(-23,.45,-22+i*4);car.g.rotation.y=0;}else{for(const wheel of car.wheels)wheel.rotation.y=t*2.1;if(car.spin)car.spin.rotation.x=t*.8;}}
  for(const item of this.people){item.g.position.set(item.x+Math.sin(t*.32+item.i)*.6,.45,item.z+Math.cos(t*.25+item.i)*.4);item.g.rotation.y=Math.sin(t*.2+item.i)*.5;}
  for(const [i,arm]of this.cranes.entries())arm.rotation.y=Math.sin(t*.08+i)*.3;
  for(const pool of this.pools){pool.shine.position.z=Math.sin(t*.6)*pool.o.d*.25;pool.water.position.y=.32+Math.sin(t*.8)*.012;}
  for(const [i,leaves]of this.foliage.entries())leaves.rotation.z=Math.sin(t*.65+i)*.012;
  if(this.gate)this.gate.rotation.y=Math.sin(t*.15)*.35;
  this.controls.update();this.camera.updateMatrixWorld();if(this.highlightTarget&&this.highlightBox){this.highlightTarget.updateWorldMatrix(true,true);this.highlightBox.box.setFromObject(this.highlightTarget);}
  for(const l of this.labels){const v=l.g.getWorldPosition(new T.Vector3());v.y+=l.y;v.project(this.camera);l.el.style.transform='translate('+((v.x*.5+.5)*this.el.clientWidth)+'px,'+((-v.y*.5+.5)*this.el.clientHeight)+'px) translate(-50%,-100%)';l.el.hidden=v.z>1||v.z< -1;}
  this.renderer.render(this.scene,this.camera);this.onTick?.(dt);this.frame=requestAnimationFrame(this.tick);
 }
}
