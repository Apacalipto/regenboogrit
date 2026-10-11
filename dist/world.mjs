import * as THREE from './vendor/three.module.js';
import {routeProfile} from './course.mjs';
const MAT=new Map();
function material(color,extra={}){const key=color+JSON.stringify(extra);if(!MAT.has(key))MAT.set(key,new THREE.MeshStandardMaterial({color,roughness:.72,...extra}));return MAT.get(key);}
const sphere=new THREE.SphereGeometry(1,16,12),box=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,16),cone=new THREE.ConeGeometry(1,1,20);
function mesh(geo,color,pos=[0,0,0],scale=[1,1,1],parent,extra={}){const m=new THREE.Mesh(geo,material(color,extra));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;if(parent)parent.add(m);return m;}
function ball(parent,color,x,y,z,sx,sy=sx,sz=sx){return mesh(sphere,color,[x,y,z],[sx,sy,sz],parent);}
function block(parent,color,x,y,z,sx,sy,sz){return mesh(box,color,[x,y,z],[sx,sy,sz],parent);}
function tube(parent,color,x,y,z,r,h){return mesh(cylinder,color,[x,y,z],[r,h,r],parent);}
function batch(group){group.updateMatrixWorld(true);const by=new Map(),inv=group.matrixWorld.clone().invert();group.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){const k=o.geometry.uuid+o.material.uuid;if(!by.has(k))by.set(k,{geo:o.geometry,mat:o.material,matrices:[]});by.get(k).matrices.push(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));}});group.clear();for(const entry of by.values()){const im=new THREE.InstancedMesh(entry.geo,entry.mat,entry.matrices.length);entry.matrices.forEach((m,i)=>im.setMatrixAt(i,m));im.castShadow=true;im.receiveShadow=true;group.add(im);}return group;}
function cloud(size=1,color='#fff8f7'){const g=new THREE.Group();[[0,0,0,1.4,.5,.9],[-.95,.08,.04,.9,.56,.75],[.85,.14,.06,.94,.66,.8],[-.3,.35,-.08,.87,.7,.8],[.4,.4,-.1,.8,.68,.73]].forEach(p=>ball(g,color,...p));g.scale.setScalar(size);return batch(g);}
function starGeometry(){const s=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.45:1;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?s.lineTo(x,y):s.moveTo(x,y);}s.closePath();return new THREE.ExtrudeGeometry(s,{depth:.17,bevelEnabled:true,bevelSize:.07,bevelThickness:.07,bevelSegments:1,steps:1});}
const starGeo=starGeometry();
function star(parent,x,y,z,size=.3,color='#ffd580'){return mesh(starGeo,color,[x,y,z],[size,size,size],parent,{metalness:.23,roughness:.38});}
function archShape(w,h){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h-w/2);s.absarc(0,h-w/2,w/2,0,Math.PI,false);s.lineTo(-w/2,0);return new THREE.ShapeGeometry(s);}
function castle(){const g=new THREE.Group();g.add(cloud(3.5,'#fff5f4'));block(g,'#ffeedc',0,1.55,0,3.8,3.15,2.2);
 for(const x of [-2,2]){tube(g,'#fff1e2',x,2.15,0,.7,4.2);tube(g,'#ead0d3',x,3.9,0,.76,.21);mesh(cone,'#d790b3',[x,4.93,0],[1.02,1.8,1.02],g);ball(g,'#e6bb64',x,5.9,0,.12);tube(g,'#ddb86a',x,6.22,0,.035,.6);const flag=block(g,'#e2b0ca',x+.3,6.36,0,.57,.31,.035);flag.rotation.z=.06;
 for(const y of [1.5,3])mesh(archShape(.35,.68),'#b3c3d2',[x,y, .7],[1,1,1],g);}
 block(g,'#f0dcd4',0,3.17,0,4,.23,2.35);for(let x=-1.7;x<=1.7;x+=.65)block(g,'#fff0e0',x,3.45,1,.38,.52,.42);
 tube(g,'#f9e6d7',0,3.98,-.45,.85,2.8);mesh(cone,'#b8a4d0',[0,5.9,-.45],[1.25,1.8,1.25],g);ball(g,'#f6d58f',0,6.9,-.45,.15);star(g,0,7.3,-.45,.3);
 mesh(archShape(1.24,2.1),'#bf90ad',[0,-.05,1.12],[1,1,1],g);mesh(archShape(.95,1.9),'#e7b8c5',[0,0,1.14],[1,1,1],g);tube(g,'#e5c37f',0,.7,1.2,.05,.11).rotation.x=Math.PI/2;
 mesh(archShape(.58,.95),'#acbacc',[0,3.55,.4],[1,1,1],g);block(g,'#f1dcbf',0,3.5,.47,.75,.14,.22);for(const x of [-1.05,1.05]){mesh(archShape(.42,.72),'#b9c5cf',[x,1.9,1.13],[1,1,1],g);block(g,'#ecd0c5',x,1.85,1.23,.56,.1,.28);}
 return batch(g);}
function fairy(){const g=new THREE.Group();ball(g,'#ffe5d4',0,0,0,.14);mesh(cone,'#c9a3df',[0,-.25,0],[.18,.36,.16],g);ball(g,'#e7bf79',0,.12,0,.16,.11,.15);for(const side of [-1,1]){const w=ball(g,'#c0e7e5',side*.22,-.1,.06,.24,.35,.07);w.rotation.z=side*-.6;}star(g,.34,-.16,0,.09);return batch(g);}
export function makeUnicorn(color='#fff7ef'){const g=new THREE.Group();const body=ball(g,color,0,1.15,.1,.57,.62,.91);ball(g,color,0,1.65,-.48,.38,.67,.42).rotation.x=-.25;
 ball(g,color,0,2.12,-.81,.45,.48,.57);ball(g,color,0,1.96,-1.24,.34,.28,.31);
 ball(g,'#f4d3dc',0,1.92,-1.49,.28,.14,.065);
 for(const side of [-1,1]){ball(g,'#ecbdcb',side*.37,2.06,-1.03,.045,.105,.13);ball(g,'#554963',side*.404,2.25,-1.01,.045,.083,.083);ball(g,'#fffefa',side*.435,2.28,-1.04,.019,.028,.02);
 const ear=ball(g,color,side*.27,2.59,-.51,.135,.36,.155);ear.rotation.z=side*-.3;const inner=ball(g,'#edb6ce',side*.285,2.64,-.635,.07,.22,.036);inner.rotation.z=side*-.3;
 for(let k=0;k<2;k++){const lash=block(g,'#554963',side*.443,2.31+k*.02,-.96+k*.04,.016,.1,.016);lash.rotation.z=side*.7;}}
 const horn=mesh(cone,'#f3d185',[0,2.75,-1.02],[.14,.8,.14],g,{metalness:.27});horn.rotation.x=-.22;
 for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.11-i*.025,.012,5,18),material('#d4ab58'));ring.rotation.x=Math.PI/2-.2;ring.position.set(0,2.48+i*.18,-.96-i*.036);g.add(ring);}
 const hair=['#e6a6c4','#c5afe4','#b5d9e2','#ebc4d9'];for(let i=0;i<7;i++){const m=ball(g,hair[i%4],.035,2.49-i*.19,-.43+i*.10,.25,.22,.27);m.rotation.z=.25;}ball(g,'#e1add0',-.1,2.49,-.88,.33,.16,.27).rotation.z=.2;
 for(let i=0;i<6;i++){const t=ball(g,hair[i%4],.09+i*.035,1.54-i*.16,1+i*.12,.22,.24,.25);t.rotation.x=-.4;}
 const legs=[];for(const x of [-.34,.34])for(const z of [-.49,.67]){const p=new THREE.Group();p.position.set(x,.86,z);g.add(p);tube(p,color,0,-.27,0,.135,.62);ball(p,color,0,-.5,0,.14,.14,.15);ball(p,'#c6a8d7',0,-.67,-.035,.165,.14,.21);legs.push(p);}
 ball(g,'#dab4d0',0,1.69,.2,.45,.065,.43);ball(g,'#e9c1d7',0,1.76,.15,.3,.06,.3);star(g,.573,1.27,.14,.14,'#e3b869').rotation.y=Math.PI/2;
 const wings=new THREE.Group();for(const side of [-1,1])for(let i=0;i<4;i++){const f=ball(wings,i%2?'#efdfef':'#fff2e3',side*(.65+i*.16),1.6+i*.12,.05+i*.18,.23,.12,.57);f.rotation.z=side*.35;f.rotation.y=side*-.3;}g.add(wings);wings.visible=false;
 g.userData={legs,body,wings,color};return g;}
function dragon(){const g=new THREE.Group();ball(g,'#e7a7c0',0,1.0,0,.87,.94,2.1);ball(g,'#f3bad0',0,.9,1.86,.82,.64,.82);ball(g,'#efd1d9',0,.65,2.35,.68,.33,.43);
 for(const s of [-1,1]){ball(g,'#d497b9',s*.75,.32,.94,.27,.25,.65);ball(g,'#d497b9',s*.78,.32,-.9,.28,.25,.5);const eye=block(g,'#8c628a',s*.45,1.27,2.4,.22,.025,.035);eye.rotation.z=s*.1;mesh(cone,'#efd38e',[s*.48,1.84,1.83],[.14,.58,.15],g);const wing=ball(g,'#ca90b8',s*.65,1.5,-.2,.17,.76,1.03);wing.rotation.z=s*-.75;}
 for(let i=0;i<6;i++)mesh(cone,'#efd2a6',[0,1.96-i*.07,.9-i*.6],[.17,.33,.18],g);
 for(let i=0;i<4;i++)ball(g,'#dc9cbd',i*.2, .65-i*.11,-2-i*.36,.43-i*.08,.35-i*.06,.6-i*.1);
 return batch(g);}
function archObstacle(){const g=new THREE.Group();for(const x of [-.95,.95]){tube(g,'#c4afdb',x,1.1,0,.12,2.2);ball(g,'#efc979',x,2.23,0,.16);}block(g,'#cdb2dd',0,2.2,0,2.1,.4,.35);for(const x of [-.5,0,.5]){tube(g,'#d7bf87',x,1.9,0,.018,.3);star(g,x,1.63,0,.21);}const f=fairy();f.position.set(.25,2.9,0);g.add(f);return batch(g);}
function ribbonGeometry(points,left,right,offset=0){
 const positions=[];
 for(let i=0;i<points.length-1;i++){
  const [za,ya]=points[i],[zb,yb]=points[i+1];if(Math.abs(za-zb)<.0001)continue;
  positions.push(left,ya+offset,za,right,ya+offset,za,right,yb+offset,zb,left,ya+offset,za,right,yb+offset,zb,left,yb+offset,zb);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();return g;
}
export function makeRaisedRoute(route){
 const group=new THREE.Group(),points=routeProfile(route),width=2.38;
 // A solid shape underneath the same profile used by the collision system.
 const shape=new THREE.Shape();shape.moveTo(points[0][0],0);for(const[z,y]of points)shape.lineTo(z,y);shape.lineTo(points.at(-1)[0],0);shape.closePath();
 const hull=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false,steps:1});hull.rotateY(-Math.PI/2);hull.translate(width/2,0,0);
 mesh(hull,route.kind==='dragonway'?'#e0a6c4':'#f4e7f0',[0,0,0],[1,1,1],group);
 const colors=['#efabc6','#f2bfad','#f4d999','#c7ddb2','#afd7d9','#b4c4e0','#cdb6dd'];
 colors.forEach((c,i)=>mesh(ribbonGeometry(points,-1.1+i*2.2/7,-1.1+(i+1)*2.2/7,.025),c,[0,0,0],[1,1,1],group));
 for(const side of [-1,1])mesh(ribbonGeometry(points,side<0?-1.2:1.13,side<0?-1.13:1.2,.05),'#fff3cf',[0,0,0],[1,1,1],group);
 const front=route.length/2-route.rampIn,back=-route.length/2+route.rampOut,center=(front+back)/2,span=Math.max(2,front-back);
 if(route.kind==='dragonway'){
  ball(group,'#e1a0bb',0,1,center,.98,.95,span/2);
  ball(group,'#efb9ce',0,1.25,front-.9,.93,.77,1.55);
  ball(group,'#f2d0d8',0,.98,front+.1,.77,.36,.7);
  for(const side of [-1,1]){
   const eye=block(group,'#885b7f',side*.45,1.68,front+1.16,.26,.035,.06);eye.rotation.z=side*.12;
   const wing=ball(group,'#cd8bb0',side*.98,1.15,center,.26,.61,Math.min(3,span/4));wing.rotation.z=side*-.55;
   mesh(cone,'#f1d496',[side*.59,2.2,front-.8],[.15,.6,.15],group);
   for(const z of [front-3,back+3])ball(group,'#db94b5',side*.97,.37,z,.37,.3,.9);
  }
 }else{
  for(let z=back+1;z<front;z+=3){for(const side of [-1,1])ball(group,z%2?'#f7edf5':'#fff4f3',side*.9,.9,z,.69,.83,1.65);}
 }
 if(route.rampIn>0){
  const z=route.length/2-route.rampIn*.45,y=route.height*.45+.06;
  for(const side of [-1,1]){const mark=block(group,'#fff6db',side*.24,y,z,.10,.035,.8);mark.rotation.y=side*-.55;mark.rotation.x=Math.atan(route.height/route.rampIn);}
 }
 // Small stars on the edges make roofs distinguishable from ordinary obstacles.
 for(const side of [-1,1])star(group,side*1.05,route.height+.12,center,.11);
 return batch(group);
}

const PALETTES=[{name:'Wolkenkasteel',sky:'#e9dce9',fog:'#ede0ed'},{name:'De Elfjestuin',sky:'#d3e7e3',fog:'#e2eeea'},{name:'Roze Drakenvallei',sky:'#edcedd',fog:'#f0dbe7'},{name:'Het Sterrenpaleis',sky:'#cfcde8',fog:'#dddbef'}];
export class World{
 constructor(container){
 this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;container.appendChild(this.renderer.domElement);
 this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#e9dce9');this.scene.fog=new THREE.Fog('#ede0ed',42,130);this.camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,180);
 this.scene.add(new THREE.HemisphereLight('#fff6e6','#afa5ca',2.5));const sun=new THREE.DirectionalLight('#fff0d9',3.0);sun.position.set(-12,22,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.camera.far=65;sun.shadow.bias=-.001;sun.shadow.normalBias=.04;this.scene.add(sun);this.scene.add(new THREE.AmbientLight('#f0dbe8',.35));
 this.road=new THREE.Group();const colors=['#efabc6','#f2bfad','#f4d999','#c7ddb2','#afd7d9','#b4c4e0','#cdb6dd'];colors.forEach((c,i)=>{const m=block(this.road,c,(i-3)*1.37,-.12,-48,1.37,.24,170);m.castShadow=false;});for(const x of [-4.88,4.88]){block(this.road,'#fff6e2',x,.035,-48,.13,.14,170).castShadow=false;}
 this.scene.add(batch(this.road));
 this.dashes=new THREE.Group();for(let z=-120;z<25;z+=6)for(const x of [-1.4,1.4]){const m=block(this.dashes,'#fff9ed',x,.035,z,.065,.025,1.55);m.castShadow=false;}this.scene.add(batch(this.dashes));
 this.unicorn=makeUnicorn();this.scene.add(this.unicorn);this.unicorn.rotation.y=.18;
 this.scenery=[];for(let i=0;i<20;i++){const c=cloud(1.7+Math.random()*2.5,i%3?'#fff7f5':'#eee8f5');c.position.set((i%2?1:-1)*(8+Math.random()*25),-1.5+Math.random()*7,15-i*8);this.scene.add(c);this.scenery.push({group:c,z:c.position.z,y:c.position.y,phase:Math.random()*7,kind:'cloud'});}
 for(let i=0;i<5;i++){const c=castle();const side=i%2?1:-1;c.position.set(side*(12+i%3*2),-.3,-12-i*30);c.scale.setScalar(.85+i%2*.35);c.rotation.y=side*-.2;this.scene.add(c);this.scenery.push({group:c,z:c.position.z,y:c.position.y,phase:i,kind:'castle'});}
 this.heroCastle=castle();this.heroCastle.position.set(12,-.5,-20);this.heroCastle.scale.setScalar(1.65);this.scene.add(this.heroCastle);
 // A distant decorative rainbow has a cloud at each end.
 const rainbow=new THREE.Group();colors.forEach((c,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(13-i*.42,.28,6,60,Math.PI),material(c));m.position.y=3;rainbow.add(m);});rainbow.position.set(-15,2,-77);rainbow.rotation.y=.13;this.scene.add(batch(rainbow));
 this.sparkles=new THREE.Group();for(let i=0;i<24;i++){const s=star(this.sparkles,(Math.random()-.5)*26,2+Math.random()*9,-Math.random()*70,.06+Math.random()*.1,'#fff3d3');s.userData.phase=Math.random()*7;s.castShadow=false;}this.scene.add(this.sparkles);
 this.obstacles=[];this.coins=[];this.gates=[];this.platforms=[];this.cameraHeight=0;this.templates={cloud:cloud(.72),arch:archObstacle(),dragon:dragon()};
 this.aura=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),new THREE.MeshBasicMaterial({color:'#fbe2aa',transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide}));this.aura.scale.set(1.5,2,1.8);this.aura.visible=false;this.scene.add(this.aura);
 this.trail=new THREE.Group();for(let i=0;i<25;i++){const s=star(this.trail,0,0,0,.1,'#ffe7a7');s.visible=false;s.castShadow=false;}this.scene.add(this.trail);
 this.menu=true;this.lastPalette=-1;this.time=0;this.target=new THREE.Vector3();this.resize=()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);};addEventListener('resize',this.resize);this.setCamera(true,1);
 }
 setCamera(menu,dt=1,height=0){this.cameraHeight+=(height*.68-this.cameraHeight)*Math.min(1,dt*3);const mobile=innerWidth<701;const viewKey=innerWidth+'x'+innerHeight+'-'+menu;if(this.viewKey!==viewKey){this.viewKey=viewKey;this.camera.fov=mobile&&!menu?62:43;if(mobile&&menu)this.camera.setViewOffset(innerWidth,innerHeight,0,innerHeight*.28,innerWidth,innerHeight);else this.camera.clearViewOffset();this.camera.updateProjectionMatrix();}let p,t;if(menu){p=mobile?[8.7,6.2,12.7]:[11.7,7.9,16.5];t=mobile?[0,1.25,-1.2]:[-3.9,1.5,-5];}else{p=mobile?[0,7.8,17]:[0,5.9,12.5];p[1]+=this.cameraHeight;t=[0,.9+this.cameraHeight,-12];}const a=Math.min(1,dt*4);this.camera.position.lerp(new THREE.Vector3(...p),a);this.target.lerp(new THREE.Vector3(...t),a);this.camera.lookAt(this.target);}
 setCoat(color){const old=this.unicorn;this.unicorn=makeUnicorn(color);this.unicorn.position.copy(old.position);this.unicorn.rotation.copy(old.rotation);this.scene.remove(old);this.scene.add(this.unicorn);}
 reset(){this.platforms.forEach(o=>this.scene.remove(o.group));this.platforms=[];this.cameraHeight=0;this.obstacles.forEach(o=>this.scene.remove(o.group));this.coins.forEach(o=>this.scene.remove(o.group));this.gates.forEach(o=>this.scene.remove(o.group));this.obstacles=[];this.coins=[];this.gates=[];for(const s of this.scenery)s.group.position.z=s.z;this.dashes.position.z=0;this.unicorn.position.set(0,0,0);this.unicorn.scale.setScalar(1);this.unicorn.rotation.set(0,0,0);}
 addPlatform(spec){const group=makeRaisedRoute(spec);group.position.set(spec.lane*2.8,0,spec.z);this.scene.add(group);const p={...spec,group};this.platforms.push(p);return p;}
 addObstacle(type,lane,z,baseY=0){const g=this.templates[type].clone(true);g.position.set(lane*2.8,baseY+(type==='cloud'?.38:0),z);this.scene.add(g);const obj={group:g,type,lane,z,length:type==='dragon'?5.9:1.4,hit:false};this.obstacles.push(obj);return obj;}
 addCoin(lane,z,y=.95){const g=star(this.scene,lane*2.8,y,z,.25);const c={group:g,lane,z,y,collected:false};this.coins.push(c);return c;}
 addGate(z=-75){const g=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(4.8,.17,8,48,Math.PI),material('#fff0c6',{emissive:'#d7aeb2',emissiveIntensity:.2}));g.add(ring);for(const x of [-4.8,4.8]){tube(g,'#d4b5df',x,0,0,.18,1.4);star(g,x,.8,0,.27);}for(let i=0;i<7;i++){const a=i*Math.PI/6;star(g,Math.cos(a)*4.8,Math.sin(a)*4.8,0,.2);}g.position.z=z;this.scene.add(batch(g));this.gates.push({group:g,z});}
 clearAhead(distance=30){for(const key of ['obstacles','coins','gates','platforms']){this[key]=this[key].filter(o=>{if(o.z>-distance){this.scene.remove(o.group);return false;}return true;});}}
 move(delta){this.dashes.position.z=(this.dashes.position.z+delta)%6;for(const s of this.scenery){s.group.position.z+=delta*.75;if(s.group.position.z>30)s.group.position.z-=170;}
 for(const key of ['obstacles','coins','gates','platforms']){this[key]=this[key].filter(o=>{o.z+=delta;o.group.position.z=o.z;if(o.z-(o.length||0)/2>20){this.scene.remove(o.group);return false;}return true;});}}
 update(dt,state){
 this.time+=dt;const t=this.time;this.menu=state.mode==='menu';this.setCamera(this.menu,dt,state.height||0);this.heroCastle.visible=this.menu;
 const moving=['run','boost','countdown'].includes(state.mode);
 const x=state.x||0,height=state.height??state.jump??0,duck=state.duck||false,boost=!!state.flying;
 this.unicorn.position.x=this.menu?(innerWidth<701?0:3):x;this.unicorn.scale.x=this.unicorn.scale.z=this.menu&&innerWidth>=701?1.6:1;this.unicorn.position.y=this.menu?Math.sin(t*2)*.045:height+(moving&&!boost&&state.grounded!==false?Math.abs(Math.sin(t*9))*.065:0);
 this.unicorn.rotation.y=THREE.MathUtils.lerp(this.unicorn.rotation.y,this.menu?-.62:(state.lean||0)*-.07,Math.min(1,dt*9));this.unicorn.rotation.z=THREE.MathUtils.lerp(this.unicorn.rotation.z,this.menu?0:(state.lean||0)*-.07,Math.min(1,dt*10));
 this.unicorn.scale.y=THREE.MathUtils.lerp(this.unicorn.scale.y,duck?.48:this.menu&&innerWidth>=701?1.6:1,Math.min(1,dt*18));this.unicorn.userData.legs.forEach((l,i)=>l.rotation.x=boost?(i%2?.8:-.6):moving?Math.sin(t*10+(i%2)*Math.PI)*.42:Math.sin(t*2+i)*.035);
 this.unicorn.userData.wings.visible=boost;this.unicorn.userData.wings.scale.y=boost?1+Math.sin(t*10)*.28:1;this.unicorn.rotation.x=boost?-.10:0;
 this.aura.visible=boost||(state.shield||0)>0;this.aura.position.set(x,1.2+height,0);
 this.trail.children.forEach((s,i)=>{s.visible=boost;s.position.set(x+Math.sin(t*8+i)*.6,height+1.5+Math.sin(i+t*4)*.4,1+(i+t*9)%9);s.rotation.z=t+i;});
 for(const s of this.scenery)s.group.position.y=s.y+Math.sin(t*.55+s.phase)*.16;
 this.sparkles.children.forEach((s,i)=>{s.rotation.z=t*.3+i;s.scale.setScalar(.06+Math.sin(t+i)*.025);});
 this.coins.forEach(c=>{c.group.rotation.y=t*2;c.group.position.y=(c.y??.95)+Math.sin(t*3+c.z)*.10;});
 const pi=this.menu?0:Math.floor((state.elapsed||0)/150)%4;if(pi!==this.lastPalette){this.lastPalette=pi;this.palette=PALETTES[pi];}
 this.scene.background.lerp(new THREE.Color(this.palette.sky),dt);this.scene.fog.color.lerp(new THREE.Color(this.palette.fog),dt);
 this.renderer.render(this.scene,this.camera);
 }
 get worldName(){return this.palette?.name||PALETTES[0].name;}
}
