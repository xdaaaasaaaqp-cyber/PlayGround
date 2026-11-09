import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const root = document.querySelector('#game-root');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bcfc9);
scene.fog = new THREE.Fog(0x9bcfc9, 75, 170);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, .1, 260);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
root.appendChild(renderer.domElement);

const mat = (color, roughness = 1) => new THREE.MeshStandardMaterial({ color, roughness });
const mats = {
  grass: mat(0x9ebd79), road: mat(0x424e50), sidewalk: mat(0xc9c4a9), white: mat(0xe9e3ca),
  player: mat(0xf0a34d), skin: mat(0xe6b889), dark: mat(0x263336), window: mat(0x87c9c5),
  windowLit: mat(0xf3cb72), tree: mat(0x648f55), trunk: mat(0x816248), line: mat(0xf4de91),
  red: mat(0xc96755), blue: mat(0x6199a7), pink: mat(0xc786a5), yellow: mat(0xd5b956)
};
const hemi = new THREE.HemisphereLight(0xe6ffff, 0x7d7450, 2.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d2, 3.2); sun.position.set(-38, 65, 36); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -85; sun.shadow.camera.right = 85; sun.shadow.camera.top = 85; sun.shadow.camera.bottom = -85; sun.shadow.bias = -.00025; scene.add(sun);
const ambient = new THREE.AmbientLight(0xe3f6ea, .28); scene.add(ambient);
const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(1, 8, 6);
const world = new THREE.Group(); scene.add(world);
const staticMesh = (geometry, material, x, y, z, sx=1, sy=1, sz=1, target=world) => {
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); mesh.castShadow = true; mesh.receiveShadow = true; target.add(mesh); return mesh;
};

// Soft green city island, grid streets and a little street furniture.
staticMesh(cubeGeo, mats.grass, 0, -.62, 0, 150, 1, 150);
for (let i=-3;i<=3;i++) {
  const p = i*22;
  staticMesh(cubeGeo, mats.road, p, -.25, 0, 7.5, .15, 142);
  staticMesh(cubeGeo, mats.road, 0, -.25, p, 142, .15, 7.5);
  for (let n=-5;n<=5;n++) {
    const q=n*12;
    staticMesh(cubeGeo,mats.line,p,-.16,q, .18,.025,3.8);
    staticMesh(cubeGeo,mats.line,q,-.16,p, 3.8,.025,.18);
  }
}
// Sidewalk curbs alongside streets.
for(let i=-3;i<=3;i++){
  const p=i*22;
  for(const s of [-1,1]){
    staticMesh(cubeGeo,mats.sidewalk,p+s*4.4,-.08,0,.7,.25,142);
    staticMesh(cubeGeo,mats.sidewalk,0,-.08,p+s*4.4,142,.25,.7);
  }
}

const buildings=[];
const facadeMats=[mat(0xc98262),mat(0xe0bd78),mat(0x829e91),mat(0xb27968),mat(0xaaa18b),mat(0x78939a),mat(0xd2a77e),mat(0x9a8b76)];
const roofMats=[mat(0x52666a),mat(0x756054),mat(0x857f66),mat(0x59645f)];
const windows=[mats.window,mats.windowLit,mat(0xa6d7ce)];
let seed=219; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
function makeBuilding(x,z){
  const group=new THREE.Group();world.add(group);const width=7+Math.floor(rand()*5),depth=7+Math.floor(rand()*5), floors=3+Math.floor(rand()*5), fh=2.05, baseY=0;
  group.position.set(x,baseY,z);const facade=facadeMats[Math.floor(rand()*facadeMats.length)],roof=roofMats[Math.floor(rand()*roofMats.length)];const chunks=[];
  // Floor-by-floor wall slabs make the skyline genuinely blocky and give the admin powers something to knock down.
  for(let f=0;f<floors;f++){
    const floorGroup=new THREE.Group();group.add(floorGroup);floorGroup.position.y=f*fh;
    const h=fh-.12; staticMesh(cubeGeo,facade,0,h/2,0,width,h,depth,floorGroup);
    // inset, contrasting window strips on each face
    for(let wx=-Math.floor(width/2)+1;wx<width/2;wx+=1.55){
      for(const side of [-1,1]) staticMesh(cubeGeo,windows[rand()<.18?1:0],wx,h*.61,side*(depth/2+.025),.72,.92,.07,floorGroup);
    }
    for(let wz=-Math.floor(depth/2)+1;wz<depth/2;wz+=1.55){
      for(const side of [-1,1]) staticMesh(cubeGeo,windows[rand()<.17?1:0],side*(width/2+.025),h*.61,wz,.07,.92,.72,floorGroup);
    }
    if(f===0){staticMesh(cubeGeo,mats.dark,0,.54,depth/2+.035,1.35,1.05,.08,floorGroup);staticMesh(cubeGeo,mats.windowLit,0,.88,depth/2+.09,.76,.35,.035,floorGroup);}
    chunks.push(floorGroup);
  }
  staticMesh(cubeGeo,roof,0,floors*fh+.06,0,width+.36,.26,depth+.36,group);
  staticMesh(cubeGeo,facade,width*.2,floors*fh+.42,-depth*.18,1.4,.48,1.1,group);
  // Rooftop air-conditioning boxes
  for(let k=0;k<2;k++)staticMesh(cubeGeo,mats.white,-width*.22+k*1.25,floors*fh+.43,depth*.18,.8,.55,.72,group);
  buildings.push({group,chunks,x,z,width,depth,alive:floors,initial:floors});
}
for(let gx=-2;gx<=2;gx++)for(let gz=-2;gz<=2;gz++) makeBuilding(gx*22+11,gz*22+11);
// Buildings sit behind narrow roads, centered on each street intersection—small city blocks with clear lanes.

function makeTree(x,z,scale=1){
  const g=new THREE.Group();world.add(g);g.position.set(x,0,z);
  staticMesh(cubeGeo,mats.trunk,0,.9*scale,0,.62*scale,1.8*scale,.62*scale,g);
  const crown=mat([0x6f9c5d,0x83a96b,0x5f8954][Math.floor(rand()*3)]);
  staticMesh(cubeGeo,crown,0,2.1*scale,0,2.1*scale,1.9*scale,2.1*scale,g);
  staticMesh(cubeGeo,crown,.4*scale,2.85*scale,.25*scale,1.3*scale,.9*scale,1.4*scale,g);
}
for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){
  if(rand()<.68){const x=i*22+(rand()-.5)*8,z=j*22+(rand()-.5)*8;if(Math.abs(x)>8||Math.abs(z)>8)makeTree(x,z,.8+rand()*.45);}
}
// Tiny road vehicles give the city scale and movement.
const cars=[];
for(let i=0;i<6;i++){
 const g=new THREE.Group();world.add(g);const color=[mats.red,mats.blue,mats.yellow,mats.white][i%4];
 staticMesh(cubeGeo,color,0,.65,0,2.5,.85,1.3,g);staticMesh(cubeGeo,mat(0x344c51),-.12,1.15,0,1.25,.48,1.05,g);
 staticMesh(cubeGeo,mats.windowLit,.98,.69,0,.08,.28,.8,g);staticMesh(cubeGeo,mats.windowLit,-.98,.69,0,.08,.28,.8,g);
 g.position.set(-62+i*21,.02,(i%2? -11:11));g.rotation.y=i%2?Math.PI:0;cars.push({g,speed:5+i%3*1.2});
}

function createPerson(x,z,color,isPlayer=false,name=''){
 const g=new THREE.Group();world.add(g);g.position.set(x,0,z);
 const shirt=isPlayer?mats.player:mat(color),skin=mats.skin,pants=isPlayer?mats.dark:mat(0x39464d);
 const body=staticMesh(cubeGeo,shirt,0,1.23,0,.72,.92,.45,g);body.castShadow=true;
 const head=staticMesh(cubeGeo,skin,0,1.95,0,.52,.52,.5,g);
 staticMesh(cubeGeo,mat(0x3e3028),0,2.22,0,.56,.14,.53,g);
 const leg1=new THREE.Group(),leg2=new THREE.Group();leg1.position.set(-.2,.83,0);leg2.position.set(.2,.83,0);g.add(leg1,leg2);
 staticMesh(cubeGeo,pants,0,-.31,0,.28,.68,.32,leg1);staticMesh(cubeGeo,pants,0,-.31,0,.28,.68,.32,leg2);
 for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.48,1.52,0);g.add(arm);staticMesh(cubeGeo,shirt,0,-.3,0,.25,.68,.3,arm);g.userData[side<0?'armL':'armR']=arm;}
 g.userData.legs=[leg1,leg2];g.userData.isPlayer=isPlayer;g.userData.name=name;g.userData.walk=Math.random()*6;g.userData.dir=new THREE.Vector3(Math.random()-.5,0,Math.random()-.5).normalize();g.userData.timer=1+Math.random()*3;g.userData.flee=0;
 return g;
}
const player=createPerson(0,15,0,true,'YOU');
const npcNames=['MILO','JUNE','OTTO','PIP','NOVA','ELI','BEA','MAX'];const npcColors=[0x76bd8a,0xe58a70,0x7da8d5,0xd78db1,0xd2bc69,0x99a5c9,0xc17b4b,0x64b9b6];
const citizens=[];
for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const p=createPerson(Math.cos(a)*(10+rand()*11),Math.sin(a)*(10+rand()*11),npcColors[i],false,npcNames[i]);citizens.push(p);}

// Lightweight game state and controls.
const state={score:0, speed:0, jump:0, vy:0, gravity:22, chaosUntil:0, quakeUntil:0, tornadoUntil:0, floatUntil:0, sound:true, lock:false, activeEvent:null};
const keys={};let joy={x:0,y:0};let yaw=0;let last=performance.now();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function updateScore(points){state.score+=points;document.querySelector('#chaos-score').textContent=String(state.score).padStart(3,'0');document.querySelector('#chaos-meter').style.width=`${Math.min(100,5+state.score/4)}%`;document.querySelector('#meter-label').textContent=state.score>80?'CITY LEGEND':state.score>35?'GETTING LOUD':'JUST GETTING STARTED';document.querySelector('#objective-text').textContent=state.score>80?'The mayor is definitely calling':'Make some noise out there';}
function feed(text){const el=document.createElement('div');el.className='feed-toast';el.textContent=text;document.querySelector('#toast-stack').append(el);setTimeout(()=>{el.classList.add('fade');setTimeout(()=>el.remove(),350)},3000);}
function eventBanner(text){const b=document.querySelector('#event-banner');document.querySelector('#event-message').textContent=text;b.classList.add('show');const line=b.querySelector('.event-line');line.style.animation='none';void line.offsetWidth;line.style.animation='eventline 3s linear';clearTimeout(eventBanner.timer);eventBanner.timer=setTimeout(()=>b.classList.remove('show'),3000);}
function openPanel(open=true){document.querySelector('#admin-panel').classList.toggle('open',open);document.querySelector('#admin-panel').setAttribute('aria-hidden',String(!open));}
function shakeCamera(power=1){state.quakeUntil=performance.now()+2400;state.quakePower=power;}
function burstAt(x,z,color=0xffa65e,count=15){
 const group=new THREE.Group();scene.add(group);group.position.set(x,1.2,z);const parts=[];
 for(let i=0;i<count;i++){const cube=new THREE.Mesh(cubeGeo,mat(i%3?color:0xffe49b));cube.scale.setScalar(.18+rand()*.34);cube.position.set((rand()-.5)*.8,rand()*.8,(rand()-.5)*.8);cube.castShadow=true;group.add(cube);parts.push({mesh:cube,v:new THREE.Vector3((rand()-.5)*11,4+rand()*8,(rand()-.5)*11)});}
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.12,6,16),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8}));ring.rotation.x=Math.PI/2;group.add(ring);state.effects.push({group,parts,ring,life:1.25});
}
state.effects=[];
function makeMeteor(){
 const x=player.position.x+(rand()-.5)*24,z=player.position.z+(rand()-.5)*24;
 const meteor=new THREE.Mesh(cubeGeo,mat(0xff703c));meteor.scale.set(1.25,1.25,1.25);meteor.position.set(x,27,z);meteor.castShadow=true;scene.add(meteor);
 const glow=new THREE.PointLight(0xff713b,45,18);meteor.add(glow);state.effects.push({meteor,x,z,life:1.5,fall:true});
}
function damageBuilding(x,z){let closest=null,d=Infinity;for(const b of buildings){const nd=Math.hypot(x-b.x,z-b.z);if(nd<d){d=nd;closest=b;}}
 if(closest&&d<19&&closest.alive>1){const idx=closest.alive-1;const chunk=closest.chunks[idx];closest.alive--;const pos=chunk.getWorldPosition(new THREE.Vector3());chunk.parent.remove(chunk);for(let k=0;k<8;k++)burstAt(pos.x+(rand()-.5)*6,pos.z+(rand()-.5)*6,0xb77b5c,3);}
}
function power(type){openPanel(false);state.activeEvent=type;const label={meteor:'METEOR SHOWER',quake:'EARTHQUAKE',tornado:'BLOCKNADO',party:'GRAVITY OFF'}[type];eventBanner(label+' ACTIVATED');updateScore(type==='meteor'?25:15);
 if(type==='meteor'){for(let i=0;i<5;i++)setTimeout(()=>{makeMeteor();if(i===2)damageBuilding(player.position.x+(rand()-.5)*20,player.position.z+(rand()-.5)*20);},i*330);feed('☄  Meteor shower incoming!');}
 if(type==='quake'){shakeCamera(1);citizens.forEach(c=>{c.userData.flee=4;c.userData.dir.set(rand()-.5,0,rand()-.5).normalize()});feed('▥  The whole city is shaking!');}
 if(type==='tornado'){state.tornadoUntil=performance.now()+6500;citizens.forEach(c=>c.userData.flee=6);feed('◉  Blocknado in the district!');}
 if(type==='party'){state.floatUntil=performance.now()+7500;citizens.forEach(c=>c.userData.flee=4);feed('✳  Gravity is taking a break.');}
}
document.querySelector('#open-admin').addEventListener('click',()=>openPanel());document.querySelector('#close-admin').addEventListener('click',()=>openPanel(false));document.querySelector('#mobile-admin-button').addEventListener('click',()=>openPanel());
document.querySelectorAll('.power-card').forEach(button=>button.addEventListener('click',()=>power(button.dataset.power)));
document.querySelector('#sound-toggle').addEventListener('click',e=>{state.sound=!state.sound;e.currentTarget.innerHTML=state.sound?'♫ <span>SOUND ON</span>':'♫ <span>SOUND OFF</span>';});
document.querySelector('#jump-button').addEventListener('pointerdown',()=>{if(player.position.y<.03)state.vy=9;});
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Space'&&player.position.y<.03)state.vy=9;if(e.code==='KeyE')openPanel();if(e.code==='Escape')openPanel(false);});window.addEventListener('keyup',e=>keys[e.code]=false);
// Third-person orbit: drag on desktop; swipe on touch. Movement remains camera-relative.
let dragging=false,lastX=0;renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0){dragging=true;lastX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);}});renderer.domElement.addEventListener('pointermove',e=>{if(dragging){yaw-=(e.clientX-lastX)*.004;lastX=e.clientX;}});renderer.domElement.addEventListener('pointerup',()=>dragging=false);
const joyEl=document.querySelector('#joystick'),knob=document.querySelector('#joy-knob');let joyPointer=null;
joyEl.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;joyEl.setPointerCapture(e.pointerId);moveJoy(e);});joyEl.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)moveJoy(e);});joyEl.addEventListener('pointerup',e=>{if(e.pointerId===joyPointer){joyPointer=null;joy={x:0,y:0};knob.style.transform='translate(-50%,-50%)';}});joyEl.addEventListener('pointercancel',()=>{joyPointer=null;joy={x:0,y:0};knob.style.transform='translate(-50%,-50%)';});
function moveJoy(e){const r=joyEl.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),lim=31,l=Math.hypot(dx,dy)||1;const x=dx*Math.min(1,lim/l),y=dy*Math.min(1,lim/l);joy={x:x/lim,y:y/lim};knob.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;}
let swipeX=null;renderer.domElement.addEventListener('touchstart',e=>{if(innerWidth<701&&e.touches[0].clientX>innerWidth*.45)swipeX=e.touches[0].clientX;},{passive:true});renderer.domElement.addEventListener('touchmove',e=>{if(swipeX!==null&&e.touches[0].clientX>innerWidth*.45){const x=e.touches[0].clientX;yaw-=(x-swipeX)*.007;swipeX=x;}},{passive:true});renderer.domElement.addEventListener('touchend',()=>swipeX=null);

function animate(now){requestAnimationFrame(animate);const dt=Math.min(.04,(now-last)/1000);last=now;
 const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y;
 const side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;
 const moving=Math.hypot(forward,side)>.08;const speed=8.5;const dir=new THREE.Vector3(side,0,forward).normalize();
 if(moving){const c=Math.cos(yaw),s=Math.sin(yaw);const dx=dir.x*c+dir.z*s,dz=-dir.x*s+dir.z*c;player.position.x+=dx*speed*dt;player.position.z-=dz*speed*dt;player.rotation.y=Math.atan2(dx,-dz);}
 player.position.x=clamp(player.position.x,-68,68);player.position.z=clamp(player.position.z,-68,68);
 if(player.position.y>0||state.vy>0){state.vy-=state.gravity*dt;player.position.y+=state.vy*dt;if(player.position.y<0){player.position.y=0;state.vy=0;}}
 const walking=moving?Math.sin(now*.013)*.58:0;player.userData.legs[0].rotation.x=walking;player.userData.legs[1].rotation.x=-walking;player.userData.armL.rotation.x=-walking*.5;player.userData.armR.rotation.x=walking*.5;
 // Civilians wander, then scatter from the latest admin event.
 let closestNpc=0,closest=Infinity;
 citizens.forEach((c,i)=>{const u=c.userData;u.timer-=dt;if(u.timer<0){u.timer=1+rand()*3;if(u.flee<=0)u.dir.set(rand()-.5,0,rand()-.5).normalize();}
   if(u.flee>0)u.flee-=dt;else if(performance.now()<state.tornadoUntil){u.dir.set(c.position.x-player.position.x,0,c.position.z-player.position.z).normalize();u.flee=.25;}
   if(u.flee>0){const away=new THREE.Vector3(c.position.x-player.position.x,0,c.position.z-player.position.z);if(away.length()<24&&away.lengthSq()>.1)u.dir.copy(away.normalize());}
   const sp=u.flee>0?5.4:1.1;c.position.addScaledVector(u.dir,sp*dt);if(Math.abs(c.position.x)>62||Math.abs(c.position.z)>62)u.dir.multiplyScalar(-1);c.position.x=clamp(c.position.x,-64,64);c.position.z=clamp(c.position.z,-64,64);
   c.rotation.y=Math.atan2(u.dir.x,u.dir.z);u.walk+=dt*(u.flee>0?11:5);u.legs[0].rotation.x=Math.sin(u.walk)*.45;u.legs[1].rotation.x=-Math.sin(u.walk)*.45;
   const d=c.position.distanceTo(player.position);if(d<closest){closest=d;closestNpc=i;}
 });
 if(closest<16){document.querySelector('#toast-name').textContent=citizens[closestNpc].userData.name;document.querySelector('#toast-message').textContent=closest<6?'Please don’t make this weird.':'Just enjoying the sunshine.';}
 cars.forEach(c=>{c.g.position.x+=c.speed*dt;if(c.g.position.x>70)c.g.position.x=-70;});
 if(performance.now()<state.floatUntil){citizens.forEach((c,i)=>{c.position.y=.6+Math.sin(now*.004+i)*.35;});}else citizens.forEach(c=>c.position.y=0);
 if(performance.now()<state.quakeUntil){world.position.x=(rand()-.5)*state.quakePower*.35;world.position.z=(rand()-.5)*state.quakePower*.35;}else{world.position.x=0;world.position.z=0;}
 const followDistance=innerWidth<700?18:22;const followHeight=innerWidth<700?13:14;
 const target=new THREE.Vector3(player.position.x+Math.sin(yaw)*followDistance,player.position.y+followHeight,player.position.z+Math.cos(yaw)*followDistance);
 camera.position.lerp(target,1-Math.pow(.001,dt));camera.lookAt(player.position.x,player.position.y+1.1,player.position.z);
 if(performance.now()<state.quakeUntil){camera.position.x+=(rand()-.5)*.16;camera.position.y+=(rand()-.5)*.13;}
 for(let i=state.effects.length-1;i>=0;i--){const fx=state.effects[i];fx.life-=dt;
   if(fx.fall){fx.meteor.position.y-=22*dt;fx.meteor.rotation.x+=dt*4;fx.meteor.rotation.z+=dt*3;if(fx.meteor.position.y<1.6){burstAt(fx.x,fx.z,0xff7844,22);fx.meteor.parent.remove(fx.meteor);burstAt(fx.x,fx.z,0xffcb69,10);fx.life=0;}}
   else if(fx.simple){fx.group.rotation.y+=dt*5;fx.group.position.y+=dt*2;}
   else if(fx.parts){fx.parts.forEach(p=>{p.v.y-=18*dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.rotation.x+=dt*5;});fx.ring.scale.multiplyScalar(1+dt*2);fx.ring.material.opacity=Math.max(0,fx.life);}
   if(fx.life<=0){if(fx.group)scene.remove(fx.group);if(fx.meteor?.parent)scene.remove(fx.meteor);state.effects.splice(i,1);}
 }
 // Tornado vortex rendered as colorful blocky orbiting debris.
 if(performance.now()<state.tornadoUntil&&Math.random()<.24){const a=now*.004+rand()*6.28,r=2+rand()*4;const b=new THREE.Mesh(cubeGeo,mat([0x91c9c0,0xffc867,0xd58269][Math.floor(rand()*3)]));b.scale.setScalar(.35+rand()*.4);b.position.set(player.position.x+Math.cos(a)*r,rand()*8+1,player.position.z+Math.sin(a)*r);scene.add(b);state.effects.push({group:b,life:.6,parts:[],ring:{},simple:true});}
 state.effects=state.effects.filter(f=>{if(f.simple&&f.life<=0){scene.remove(f.group);return false;}return true;});
 renderer.render(scene,camera);
}

// Centered on the skyline; responsive framing keeps the avatar and nearby streets in view.
function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?59:54;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));}
window.addEventListener('resize',resize);
const cameraInitial=new THREE.Vector3(0,14,22);camera.position.copy(cameraInitial);camera.lookAt(0,0,0);
setTimeout(()=>document.querySelector('#loading-overlay').classList.add('done'),850);
setInterval(()=>{const el=document.querySelector('#citizen-count');el.textContent=String(8+Math.floor(rand()*3)).padStart(2,'0');},5000);
requestAnimationFrame(animate);
