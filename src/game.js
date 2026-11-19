const canvas = document.querySelector("#world");
const ctx = canvas.getContext("2d");
const mini = document.querySelector("#minimap");
const mctx = mini.getContext("2d");
const $ = (id) => document.getElementById(id);

const WORLD = { w: 2600, h: 1900 };
const TILE = 260;
const keys = new Set();
const state = {
  active:false, paused:false, last:0, time:16.7, money:12500, rep:0,
  camera:{x:0,y:0}, toastTimer:0, sound:true, mission:0, missionStep:0,
  player:{x:430,y:520,a:0,v:0,health:100},
  traffic:[], people:[], buildings:[], parks:[], particles:[],
  roadLines:[], citySeed:19
};
const missions = [
  {title:"A NEW BEGINNING",copy:"Find the Crownline contact at Meridian Plaza.",x:520,y:520,reward:0,done:false},
  {title:"THE FIRST CONNECTION",copy:"Drive to the Meridian Plaza entrance.",x:1310,y:520,reward:2500,done:false},
  {title:"A BUSINESS OF YOUR OWN",copy:"Deliver the sealed portfolio to the harbour office.",x:2050,y:1430,reward:5000,done:false},
  {title:"THE CITY OPENS UP",copy:"Explore the city. Your next opportunity is waiting.",x:900,y:1500,reward:3500,done:false}
];
const districts = [
  {name:"MERIDIAN QUARTER",x:0,y:0,w:1100,h:900},
  {name:"THE GOLD COAST",x:1100,y:0,w:1500,h:850},
  {name:"OLD MARKET",x:0,y:900,w:1000,h:1000},
  {name:"HARBOUR DISTRICT",x:1000,y:850,w:1600,h:1050}
];
const palette = ["#26353a","#344348","#3b4142","#49514b","#5a5145","#3e4c50","#5a5b55","#35464b"];
const rand = (n) => { let x=Math.sin(n*127.1+state.citySeed*311.7)*43758.5453; return x-Math.floor(x); };

function buildCity(){
  // Broad arterial roads form the city grid; each block is populated with original procedural buildings.
  for(let x=150;x<WORLD.w;x+=TILE){
    state.roadLines.push({x:x-34,y:0,w:68,h:WORLD.h});
  }
  for(let y=145;y<WORLD.h;y+=TILE){
    state.roadLines.push({x:0,y:y-34,w:WORLD.w,h:68});
  }
  for(let gy=0;gy<7;gy++) for(let gx=0;gx<10;gx++){
    const bx=gx*TILE+184, by=gy*TILE+179;
    if(bx>WORLD.w-80||by>WORLD.h-80) continue;
    const seed=gy*13+gx*7;
    if((gx===7&&gy>=3)||(gx===8&&gy>=3)){
      state.parks.push({x:bx,y:by,w:160,h:150,kind:"park"}); continue;
    }
    if(gx===9&&gy>=4){state.parks.push({x:bx,y:by,w:170,h:150,kind:"water"});continue;}
    const count=2+Math.floor(rand(seed)*3);
    for(let i=0;i<count;i++){
      const w=38+rand(seed+i+3)*38, h=38+rand(seed+i+8)*38;
      const x=bx+8+rand(seed+i+13)*105, y=by+8+rand(seed+i+21)*105;
      const height=1+Math.floor(rand(seed+i+30)*5);
      state.buildings.push({x,y,w,h,height,color:palette[Math.floor(rand(seed+i+44)*palette.length)],roof:rand(seed+i+55)>.72,seed:seed+i});
    }
  }
  // Signature landmarks.
  state.buildings.push({x:1180,y:300,w:190,h:145,height:12,color:"#777568",landmark:"MERIDIAN PLAZA",roof:true,seed:99});
  state.buildings.push({x:1880,y:1170,w:205,h:155,height:9,color:"#6c706c",landmark:"CROWNLINE HARBOUR",roof:true,seed:101});
  state.parks.push({x:420,y:1110,w:260,h:190,kind:"park"});
  state.parks.push({x:1580,y:140,w:220,h:155,kind:"park"});
  // Traffic travels along horizontal and vertical avenues.
  for(let i=0;i<28;i++){
    const horizontal=i%2===0;
    state.traffic.push({x:horizontal?rand(i+3)*WORLD.w:150+Math.floor(rand(i+9)*9)*TILE,
      y:horizontal?145+Math.floor(rand(i+7)*7)*TILE:rand(i+5)*WORLD.h,
      a:horizontal?(i%4===0?0:Math.PI):(i%4===1?Math.PI/2:-Math.PI/2),
      speed:35+rand(i+21)*42,color:["#b9b4a5","#657b80","#a26d50","#8d948b","#d0bd91"][i%5],
      size:10+rand(i+11)*5,phase:rand(i+33)*2});
  }
  for(let i=0;i<70;i++) state.people.push({x:rand(i+77)*WORLD.w,y:rand(i+88)*WORLD.h,a:rand(i+99)*Math.PI*2,speed:5+rand(i+111)*9,phase:rand(i+121)*5});
}
buildCity();

function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize",resize);resize();

function roundRect(c,x,y,w,h,r,fill,stroke){
  c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}
}
function drawWorld(){
  const W=innerWidth,H=innerHeight,p=state.player,cam=state.camera;
  ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(-cam.x,-cam.y);
  ctx.fillStyle="#1d2928";ctx.fillRect(0,0,WORLD.w,WORLD.h);
  // Ground texture and subtle block variation.
  for(let y=0;y<WORLD.h;y+=80)for(let x=0;x<WORLD.w;x+=80){
    const r=rand(x*.01+y*.02);
    ctx.fillStyle=r>.7?"rgba(176,160,119,.035)":"rgba(0,0,0,.025)";ctx.fillRect(x,y,80,80);
  }
  // Coastal water edge.
  ctx.fillStyle="#183b43";ctx.beginPath();ctx.moveTo(2320,0);ctx.lineTo(2600,0);ctx.lineTo(2600,1900);ctx.lineTo(2280,1900);ctx.lineTo(2350,1500);ctx.lineTo(2290,1100);ctx.lineTo(2370,700);ctx.closePath();ctx.fill();
  // Roads.
  for(const r of state.roadLines){ctx.fillStyle="#343b3d";ctx.fillRect(r.x,r.y,r.w,r.h);ctx.fillStyle="rgba(255,255,255,.035)";ctx.fillRect(r.x+3,r.y,2,r.h);ctx.fillRect(r.x,r.y+3,r.w,2);}
  // Road markings.
  ctx.strokeStyle="rgba(224,204,151,.42)";ctx.lineWidth=2;ctx.setLineDash([18,20]);
  for(let x=150;x<WORLD.w;x+=TILE){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD.h);ctx.stroke()}
  for(let y=145;y<WORLD.h;y+=TILE){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD.w,y);ctx.stroke()}
  ctx.setLineDash([]);
  // Parks and waterfront promenade.
  for(const z of state.parks){
    ctx.fillStyle=z.kind==="water"?"#24535a":"#304d3e";roundRect(ctx,z.x,z.y,z.w,z.h,12,ctx.fillStyle);
    if(z.kind==="park"){for(let i=0;i<18;i++){const tx=z.x+12+rand(i+z.x)* (z.w-24),ty=z.y+12+rand(i+z.y)* (z.h-24);ctx.fillStyle="#54704e";ctx.beginPath();ctx.arc(tx,ty,5+rand(i+4)*5,0,Math.PI*2);ctx.fill();ctx.fillStyle="#263d34";ctx.beginPath();ctx.arc(tx+2,ty+3,3,0,Math.PI*2);ctx.fill()}}
  }
  // Buildings with shadows, roofs, windows and occasional rooftop equipment.
  for(const b of state.buildings){
    ctx.fillStyle="rgba(0,0,0,.32)";roundRect(ctx,b.x+8,b.y+10,b.w,b.h,4,ctx.fillStyle);
    ctx.fillStyle=b.color;roundRect(ctx,b.x,b.y,b.w,b.h,3,ctx.fillStyle);
    ctx.fillStyle="rgba(255,255,255,.10)";ctx.fillRect(b.x+4,b.y+4,b.w-8,3);
    const cols=Math.max(2,Math.floor(b.w/13)),rows=Math.max(2,Math.floor(b.h/14));
    for(let yy=0;yy<rows;yy++)for(let xx=0;xx<cols;xx++){
      ctx.fillStyle=(rand(b.seed+xx*7+yy*13)>.45)?"rgba(221,198,143,.38)":"rgba(12,25,29,.34)";
      ctx.fillRect(b.x+7+xx*(b.w-14)/cols,b.y+9+yy*(b.h-15)/rows,3,4);
    }
    if(b.roof){ctx.fillStyle="#78817a";ctx.fillRect(b.x+b.w*.2,b.y+b.h*.2,b.w*.6,5);ctx.fillStyle="#242e30";ctx.fillRect(b.x+b.w*.58,b.y+b.h*.55,12,9)}
    if(b.landmark){ctx.fillStyle="#f0d39b";ctx.font="bold 11px sans-serif";ctx.fillText(b.landmark,b.x,b.y-12)}
  }
  // Landmark signage.
  ctx.fillStyle="#d8ad62";ctx.font="bold 15px sans-serif";ctx.fillText("MERIDIAN QUARTER",390,90);
  ctx.fillStyle="rgba(240,211,155,.75)";ctx.font="10px sans-serif";ctx.fillText("THE CITY NEVER STANDS STILL",390,107);
  // Traffic.
  for(const t of state.traffic){ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.a);ctx.fillStyle="rgba(0,0,0,.3)";roundRect(ctx,-t.size/2+2,-5,t.size+4,12,3,ctx.fillStyle);ctx.fillStyle=t.color;roundRect(ctx,-t.size/2,-7,t.size,12,3,ctx.fillStyle);ctx.fillStyle="#d9d5c4";ctx.fillRect(t.size/2-3,-5,2,3);ctx.fillStyle="#a64c3c";ctx.fillRect(-t.size/2,-5,2,3);ctx.restore()}
  // Pedestrians.
  for(const n of state.people){ctx.fillStyle="#d0b58b";ctx.beginPath();ctx.arc(n.x,n.y,2.4,0,Math.PI*2);ctx.fill();ctx.fillStyle="#303b42";ctx.fillRect(n.x-1.5,n.y+2,3,4)}
  // Active objective beacon.
  const m=missions[state.mission];if(m){const pulse=8+Math.sin(performance.now()*.004)*3;ctx.strokeStyle="#e3bd75";ctx.lineWidth=2;ctx.beginPath();ctx.arc(m.x,m.y,pulse,0,Math.PI*2);ctx.stroke();ctx.fillStyle="rgba(227,189,117,.15)";ctx.beginPath();ctx.arc(m.x,m.y,25,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f2d49b";ctx.font="bold 10px sans-serif";ctx.fillText("OBJECTIVE",m.x+16,m.y-18)}
  // Player vehicle.
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);
  ctx.fillStyle="rgba(0,0,0,.38)";roundRect(ctx,-15,-8,34,20,5,ctx.fillStyle);
  ctx.fillStyle="#b88b4b";roundRect(ctx,-17,-10,34,20,5,ctx.fillStyle);
  ctx.fillStyle="#25373b";roundRect(ctx,-8,-8,15,16,3,ctx.fillStyle);
  ctx.fillStyle="#e9d4a4";ctx.fillRect(13,-7,3,4);ctx.fillRect(13,3,3,4);
  ctx.fillStyle="#b44e3c";ctx.fillRect(-17,-7,2,4);ctx.fillRect(-17,3,2,4);
  ctx.restore();
  ctx.restore();
}
function update(dt){
  if(!state.active||state.paused)return;
  const p=state.player;
  const forward=keys.has("w")||keys.has("arrowup"),back=keys.has("s")||keys.has("arrowdown"),left=keys.has("a")||keys.has("arrowleft"),right=keys.has("d")||keys.has("arrowright");
  if(forward)p.v+=115*dt;if(back)p.v-=90*dt;
  p.v*=Math.pow(keys.has(" ")?.88:.975,dt*60);p.v=Math.max(-95,Math.min(190,p.v));
  const steer=(left?-1:0)+(right?1:0);
  p.a+=steer*(1.9*Math.min(1,Math.abs(p.v)/45))*dt*(p.v>=0?1:-1);
  const nx=p.x+Math.cos(p.a)*p.v*dt,ny=p.y+Math.sin(p.a)*p.v*dt;
  const hit=state.buildings.some(b=>nx>b.x-17&&nx<b.x+b.w+17&&ny>b.y-14&&ny<b.y+b.h+14);
  if(!hit){p.x=Math.max(20,Math.min(WORLD.w-25,nx));p.y=Math.max(20,Math.min(WORLD.h-25,ny))}else{p.v*=-.22;showToast("Watch the buildings — find another route.");}
  for(const t of state.traffic){t.x+=Math.cos(t.a)*t.speed*dt;t.y+=Math.sin(t.a)*t.speed*dt;if(t.x<0)t.x=WORLD.w;if(t.x>WORLD.w)t.x=0;if(t.y<0)t.y=WORLD.h;if(t.y>WORLD.h)t.y=0;}
  for(const n of state.people){n.phase+=dt;n.x+=Math.cos(n.a+Math.sin(n.phase)*.3)*n.speed*dt;n.y+=Math.sin(n.a+Math.sin(n.phase)*.3)*n.speed*dt;if(n.x<0||n.x>WORLD.w||n.y<0||n.y>WORLD.h)n.a+=Math.PI;}
  state.time=(state.time+dt*.035)%24;
  const targetX=p.x-innerWidth*.5,targetY=p.y-innerHeight*.5;
  state.camera.x+=(Math.max(0,Math.min(WORLD.w-innerWidth,targetX))-state.camera.x)*Math.min(1,dt*5);
  state.camera.y+=(Math.max(0,Math.min(WORLD.h-innerHeight,targetY))-state.camera.y)*Math.min(1,dt*5);
  const m=missions[state.mission];if(m&&Math.hypot(p.x-m.x,p.y-m.y)<58){completeMission()}
  updateHUD();
}
function updateHUD(){
  const p=state.player,m=missions[state.mission],d=districts.find(x=>p.x>=x.x&&p.x<x.x+x.w&&p.y>=x.y&&p.y<x.y+x.h);
  $("money").textContent="₦ "+state.money.toLocaleString("en-NG");
  $("rep").textContent="LEVEL "+String(1+Math.floor(state.rep/100)).padStart(2,"0");
  $("rep-fill").style.width=(state.rep%100)+"%";
  $("mission-title").textContent=m?m.title:"FREE ROAM";
  $("mission-copy").textContent=m?m.copy:"Explore the city and discover your next opportunity.";
  $("district").textContent=d?d.name:"OUTSKIRTS";
  $("speed").textContent=String(Math.round(Math.abs(p.v)*.72)).padStart(3,"0");
  const hours=Math.floor(state.time),mins=Math.floor((state.time-hours)*60);
  $("clock").textContent=String(hours).padStart(2,"0")+":"+String(mins).padStart(2,"0")+" · "+(hours>18||hours<6?"NIGHT":"CLEAR");
}
function completeMission(){
  const m=missions[state.mission];if(!m)return;
  if(m.reward){state.money+=m.reward;state.rep+=35;showToast("OBJECTIVE COMPLETE  +₦ "+m.reward.toLocaleString("en-NG"))}
  else showToast("CONTACT LOCATED. YOUR STORY STARTS NOW.");
  state.mission++;updateHUD();
  if(state.mission>=missions.length){showToast("THE CITY IS OPEN. EXPLORE, DRIVE AND BUILD YOUR LEGACY.");saveGame()}
  else {saveGame()}
}
function showToast(text){
  const el=$("toast");el.textContent=text;el.classList.add("show");clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.remove("show"),2900);
}
function saveGame(){localStorage.setItem("crownline-save",JSON.stringify({money:state.money,rep:state.rep,mission:state.mission,x:state.player.x,y:state.player.y,a:state.player.a}))}
function loadGame(){try{const s=JSON.parse(localStorage.getItem("crownline-save"));if(s){state.money=s.money??12500;state.rep=s.rep??0;state.mission=Math.min(s.mission??0,missions.length);state.player.x=s.x??430;state.player.y=s.y??520;state.player.a=s.a??-Math.PI/2;return true}}catch{}return false}
function drawMinimap(){
  const w=mini.width,h=mini.height,scale=w/WORLD.w;mctx.clearRect(0,0,w,h);mctx.fillStyle="#172623";mctx.fillRect(0,0,w,h);
  mctx.fillStyle="#3b4646";for(const r of state.roadLines)mctx.fillRect(r.x*scale,r.y*scale,Math.max(1,r.w*scale),Math.max(1,r.h*scale));
  mctx.fillStyle="#3e5a46";for(const z of state.parks)if(z.kind==="park")mctx.fillRect(z.x*scale,z.y*scale,z.w*scale,z.h*scale);
  mctx.fillStyle="#24535a";mctx.fillRect(2350*scale,0,250*scale,h);
  const m=missions[state.mission];if(m){mctx.fillStyle="#e5bd72";mctx.beginPath();mctx.arc(m.x*scale,m.y*scale,4,0,Math.PI*2);mctx.fill()}
  mctx.fillStyle="#fff";mctx.beginPath();mctx.arc(state.player.x*scale,state.player.y*scale,4,0,Math.PI*2);mctx.fill();
  mctx.strokeStyle="#fff";mctx.lineWidth=1.5;mctx.beginPath();mctx.moveTo(state.player.x*scale,state.player.y*scale);mctx.lineTo((state.player.x+Math.cos(state.player.a)*18)*scale,(state.player.y+Math.sin(state.player.a)*18)*scale);mctx.stroke();
}
function frame(t){
  const dt=Math.min(.04,(t-state.last)/1000||0);state.last=t;
  if(state.active&&!state.paused){update(dt);drawWorld();drawMinimap()}
  else if(!state.active){state.camera.x=0;state.camera.y=0;drawWorld()}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function startGame(){
  if(!loadGame())showToast("WELCOME TO THE CITY. FIND YOUR FIRST CONTACT.");
  state.active=true;state.paused=false;$("intro").hidden=true;$("hud").hidden=false;$("pause-screen").hidden=true;updateHUD();canvas.focus?.();
}
$("start-button").addEventListener("click",startGame);
$("resume-button").addEventListener("click",()=>{state.paused=false;$("pause-screen").hidden=true});
$("sound-toggle").addEventListener("click",()=>{state.sound=!state.sound;$("sound-toggle").style.opacity=state.sound?"1":".45";showToast(state.sound?"SOUND ENABLED":"SOUND MUTED")});
addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();
  keys.add(k);
  if(k==="escape"&&state.active){state.paused=!state.paused;$("pause-screen").hidden=!state.paused}
  if(k==="e"&&state.active&&!state.paused){const m=missions[state.mission];if(m&&Math.hypot(state.player.x-m.x,state.player.y-m.y)<110)completeMission();else showToast("Nothing to interact with nearby. Follow the gold marker.")}
  if(k==="m"&&state.active)showToast("CITY MAP · Explore the districts and follow your objective.");
});
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
addEventListener("blur",()=>keys.clear());
$("year").textContent=new Date().getFullYear();
