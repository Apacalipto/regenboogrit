import {speedAt,obstacleGap,generatePattern,rescueAllowed} from './rules.mjs';
import {LANE_WIDTH,GRAVITY,JUMP_VELOCITY,FLIGHT_HEIGHT,surfaceAt,makeHeightSection,flightHeightAt,routeHeightAtLocal,BOOST_LANDING_SECONDS,LANDING_CLEAR_SECONDS,flightSpeedMultiplierAt,flightPoseAt,flightDistanceAt} from './course.mjs';
export class RunEngine{
 constructor(settings,rng=Math.random){
  this.settings={...settings};this.rng=rng;this.events=[];this.id=0;
  this.mode='countdown';this.countdown=3;this.elapsed=0;this.distance=0;
  this.stars=0;this.solved=0;this.independent=0;this.wrong=0;this.timedOut=0;
  this.usedRescues=0;this.lastRescue=null;this.lane=0;this.x=0;
  this.height=0;this.jump=0;this.vy=0;this.grounded=true;this.jumpTime=0;this.duckTime=0;
  this.shield=1.5;this.boostTime=0;this.boostDuration=0;this.landingStarted=false;this.landingClearUntil=0;this.speed=speedAt(0,settings.pace);
  this.obstacles=[];this.coins=[];this.platforms=[];this.nextSpawn=4;this.obstacleWaves=0;
  this.nextHeight=2;this.heightSections=0;this.heightZoneUntil=0;
  this.nextGate=25;this.gateShown=false;this.mathKind=null;this.questionAssisted=false;this.questionMistakes=0;this.result=null;
  this.events.push({type:'countdown',value:3});
 }
 drain(){return this.events.splice(0);}
 action(a){
  if(this.mode!=='run')return;
  if(a==='left')this.lane=Math.max(-1,this.lane-1);
  if(a==='right')this.lane=Math.min(1,this.lane+1);
  if(a==='jump'&&this.grounded){this.vy=JUMP_VELOCITY;this.grounded=false;this.jumpTime=2*JUMP_VELOCITY/GRAVITY;this.duckTime=0;this.events.push({type:'jump'});}
  if(a==='duck'&&this.grounded){this.duckTime=1.3;this.events.push({type:'duck'});}
 }
 resetHeight(){this.height=0;this.jump=0;this.vy=0;this.grounded=true;this.jumpTime=0;this.duckTime=0;}
 clear(keepSurface=false){this.obstacles=[];this.coins=[];if(!keepSurface)this.platforms=[];this.events.push({type:'clear',keepSurface});}
 spawnObstacle(kind,lane,z,baseY=0,flightOnly=false){
  const o={id:++this.id,type:kind,lane,z,length:kind==='dragon'?5.9:1.4,baseY,flightOnly};
  this.obstacles.push(o);this.events.push({...o,type:'obstacle',kind});
  if(kind==='arch'&&!flightOnly)for(const offset of [4,2,0,-2,-4])this.spawnCoin(lane,z+offset,baseY+.6,true);
  return o;
 }
 spawnCoin(lane,z,y=.95,requiresDuck=false){const c={id:++this.id,lane,z,y,requiresDuck};this.coins.push(c);this.events.push({...c,type:'coin'});return c;}
 spawnHeightSection(speed){
  const lane=this.heightSections===0?0:Math.floor(this.rng()*3)-1;
  const routes=makeHeightSection(speed,this.heightSections,lane);
  for(const spec of routes){
   const p={...spec,id:++this.id};this.platforms.push(p);this.events.push({...p,type:'platform'});
   for(let local=p.length/2-2;local>-p.length/2+2;local-=3.5){if(this.heightSections>=2&&this.heightSections%2===0&&spec===routes[0]&&Math.abs(local)<5)continue;const y=routeHeightAtLocal(p,local)+.95;this.spawnCoin(lane,p.z+local,y);}
  }
  if(this.heightSections>=2){const p=routes[0];this.spawnObstacle(this.heightSections%2?'cloud':'arch',lane,p.z,p.height);}
  const last=routes.at(-1);this.heightZoneUntil=this.elapsed+(-last.z+last.length/2)/speed+1;
  this.nextSpawn=this.heightZoneUntil;this.nextHeight=this.elapsed+27;
  this.events.push({type:'heightRoute',first:this.heightSections===0,lane});this.heightSections++;
 }
 spawnBoostCourse(){
  // Stop spawning before descent; even the back of a dragon clears the landing lane.
  const powered=this.boostDuration-BOOST_LANDING_SECONDS;
  for(let arrival=1.05,row=0;arrival<=powered-.5;arrival+=.6,row++){
   const z=-flightDistanceAt(arrival,this.boostDuration,t=>speedAt(this.elapsed+t,this.settings.pace));
   for(const lane of [-1,0,1])this.spawnObstacle((row+lane+3)%3===0?'arch':(row+lane+3)%3===1?'dragon':'cloud',lane,z,0,true);
   this.spawnCoin(this.lane,z,FLIGHT_HEIGHT+.95);
  }
 }
 get flightPose(){return this.mode==='boost'||this.mode==='paused'&&this.previousMode==='boost'?flightPoseAt(this.boostDuration-this.boostTime,this.boostDuration):0;}
 moveObjects(delta){
  for(const group of [this.obstacles,this.coins,this.platforms])for(const o of group)o.z+=delta;
  this.obstacles=this.obstacles.filter(o=>o.z<20);
  this.coins=this.coins.filter(o=>!o.collected&&o.z<20);
  this.platforms=this.platforms.filter(o=>o.z-o.length/2<20);
 }
 collectCoins(){
  for(const c of this.coins){if(!c.collected&&(!c.requiresDuck||this.duckTime>0&&this.grounded)&&Math.abs(c.z)<1.1&&Math.abs(this.x-c.lane*LANE_WIDTH)<.95&&Math.abs(this.height+.95-(c.y??.95))<1.2){c.collected=true;this.stars++;this.events.push({type:'collected',id:c.id});}}
  this.coins=this.coins.filter(c=>!c.collected);
 }
 updateHeight(dt){
  const floor=surfaceAt(this.platforms,this.x);
  if(this.grounded){
   if(floor>this.height+.65){if(this.shield<=0){this.crash();return false;}this.height=floor;}
   else if(floor<this.height-.65){this.grounded=false;this.vy=0;}
   else this.height=floor;
  }
  if(!this.grounded){
   const before=this.height,next=before+this.vy*dt-.5*GRAVITY*dt*dt;this.vy-=GRAVITY*dt;
   if(floor>before+.4&&next<floor&&this.shield<=0){this.crash();return false;}
   if(this.vy<=0&&next<=floor&&before>=floor-.4){this.height=floor;this.vy=0;this.grounded=true;this.jumpTime=0;}
   else this.height=Math.max(0,next);
  }
  this.jump=this.height;this.jumpTime=Math.max(0,this.jumpTime-dt);return true;
 }
 step(dt){
  // Stable physics and swept movement, including low-frame-rate mobile devices.
  let remaining=Math.min(Math.max(dt,0),.06);
  while(remaining>1e-8){const slice=Math.min(remaining,1/120);this.tick(slice);remaining-=slice;}
 }
 tick(dt){
  if(this.mode==='countdown'){
   const before=Math.ceil(this.countdown);this.countdown-=dt;
   if(Math.ceil(this.countdown)!==before&&this.countdown>0)this.events.push({type:'countdown',value:Math.ceil(this.countdown)});
   if(this.countdown<=0){this.mode='run';this.events.push({type:'started'});}return;
  }
  if(this.mode!=='run'&&this.mode!=='boost')return;
  const beforeElapsed=this.elapsed;this.elapsed+=dt;this.shield=Math.max(0,this.shield-dt);
  this.x+=(this.lane*LANE_WIDTH-this.x)*Math.min(1,dt*15);
  this.duckTime=Math.max(0,this.duckTime-dt);
  const boosted=this.mode==='boost',flightTime=this.boostDuration-this.boostTime;
  const beforeSpeed=speedAt(beforeElapsed,this.settings.pace)*(boosted?flightSpeedMultiplierAt(flightTime,this.boostDuration):1);
  const speed=speedAt(this.elapsed,this.settings.pace)*(boosted?flightSpeedMultiplierAt(flightTime+dt,this.boostDuration):1),delta=(beforeSpeed+speed)*.5*dt;this.speed=speed;
  this.distance+=delta;this.events.push({type:'move',delta});this.moveObjects(delta);
  if(boosted){
   this.boostTime=Math.max(0,this.boostTime-dt);
   this.height=flightHeightAt(this.boostDuration-this.boostTime,this.boostDuration);this.jump=this.height;
   this.collectCoins();
   if(!this.landingStarted&&this.boostTime<=BOOST_LANDING_SECONDS){this.landingStarted=true;this.events.push({type:'landing'});}
   if(this.boostTime<=1e-8){
    this.mode='run';this.resetHeight();this.landingClearUntil=this.elapsed+LANDING_CLEAR_SECONDS;this.shield=LANDING_CLEAR_SECONDS;
    this.nextSpawn=this.landingClearUntil;this.nextHeight=this.landingClearUntil+1;this.events.push({type:'boostEnd'});
   }return;
  }
  if(this.elapsed>=this.nextGate){this.openMath('boost');return;}
  if(!this.gateShown&&this.nextGate-this.elapsed<4.8){
   this.gateShown=true;this.clear(true);this.events.push({type:'gate',z:-speed*4.8});
  }
  if(this.elapsed>=this.landingClearUntil&&this.elapsed>=this.nextHeight&&this.nextGate-this.elapsed>17&&this.platforms.length===0)this.spawnHeightSection(speed);
  if(this.elapsed>=this.landingClearUntil&&this.elapsed>=this.nextSpawn&&this.elapsed>this.heightZoneUntil&&this.nextGate-this.elapsed>11){
   this.nextSpawn=this.elapsed+obstacleGap(this.elapsed,this.settings.pace);
   const pattern=generatePattern(this.elapsed,this.settings.pace,this.rng);
   // A regular duck route, with the alternative lane still free.
   if(this.obstacleWaves++%3===0)pattern[0].type='arch';
   for(const item of pattern)this.spawnObstacle(item.type,item.lane,-65);
   const open=[-1,0,1].filter(l=>!pattern.some(o=>o.lane===l)),lane=open[Math.floor(this.rng()*open.length)];
   if(!pattern.some(o=>o.type==='arch'))for(let i=0;i<5;i++)this.spawnCoin(lane,-65-i*2);
  }
  if(!this.updateHeight(dt))return;
  for(const o of this.obstacles){
   if(o.type==='arch'&&!o.flightOnly&&!o.cueShown&&o.z<0&&o.z>-speed*1.5&&Math.abs(this.x-o.lane*LANE_WIDTH)<.95){o.cueShown=true;this.events.push({type:'duckTrail'});}
   if(Math.abs(o.z)>=o.length/2+.3||Math.abs(this.x-o.lane*LANE_WIDTH)>=.92||this.shield>0)continue;
   const base=o.baseY||0,relative=this.height-base,top=o.type==='arch'?3.5:o.type==='dragon'?2.25:1.15;
   if(this.height>base+top+.1||this.height+2.6<base)continue;
   const safe=o.type==='cloud'?relative>.9:o.type==='arch'?this.duckTime>0&&relative<.35:false;
   if(!safe){this.crash();return;}
  }
  this.collectCoins();
 }
 openMath(kind){this.clear();this.resetHeight();this.mode='math';this.mathKind=kind;this.questionAssisted=false;this.questionMistakes=0;this.events.push({type:'math',kind});}
 answer(correct){
  if(this.mode!=='math')return;
  if(!correct){this.wrong++;this.questionMistakes++;this.questionAssisted=true;if(this.mathKind==='rescue')this.finish('answer');else if(this.questionMistakes>=2){this.mode='math-wrong';this.events.push({type:'wrongAnswer'});}else this.events.push({type:'answerRetry'});return;}
  this.solved++;if(!this.questionAssisted)this.independent++;
  const reward=this.questionAssisted?2:5;this.stars+=reward;
  if(this.mathKind==='rescue'){
   this.usedRescues++;this.lastRescue=this.elapsed;this.lane=0;this.x=0;this.resetHeight();this.shield=1;
   this.nextSpawn=this.elapsed+.2;this.heightZoneUntil=0;this.nextHeight=this.elapsed+8;this.nextGate=this.elapsed+34;this.gateShown=false;
   this.countdown=3;this.mode='countdown';this.events.push({type:'rescued',reward});this.events.push({type:'countdown',value:3});
  }else{
   this.mode='boost';this.boostDuration=(this.questionAssisted?2.5:4)+BOOST_LANDING_SECONDS;this.boostTime=this.boostDuration;this.landingStarted=false;this.resetHeight();
   this.nextGate=this.elapsed+35+this.rng()*8;this.gateShown=false;this.spawnBoostCourse();this.events.push({type:'boost',reward});
  }
 }
 completeWrong(){if(this.mode!=='math-wrong')return;this.mode='math';this.skip();}
 timeOut(){if(this.mode!=='math')return;this.mode='math-timeout';this.timedOut++;this.events.push({type:'mathTimeout',kind:this.mathKind});}
 completeTimeout(){if(this.mode!=='math-timeout')return;if(this.mathKind==='rescue')this.finish('timeout');else{this.mode='math';this.skip();}}
 skip(){
  if(this.mode!=='math')return;if(this.mathKind==='rescue'){this.finish('stop');return;}
  this.mode='run';this.shield=2;this.nextSpawn=this.elapsed+2;this.nextHeight=this.elapsed+3;this.heightZoneUntil=0;this.nextGate=this.elapsed+32;this.gateShown=false;this.events.push({type:'skipped'});
 }
 crash(){if(rescueAllowed(this.usedRescues,this.lastRescue===null?null:this.elapsed-this.lastRescue))this.openMath('rescue');else this.finish(this.lastRescue!==null&&this.elapsed-this.lastRescue<5?'quick':'rescues');}
 pause(){if(['run','boost','countdown'].includes(this.mode)){this.previousMode=this.mode;this.mode='paused';this.events.push({type:'paused'});}}
 resume(){if(this.mode==='paused'){this.mode=this.previousMode;if(this.mode==='countdown')this.events.push({type:'countdown',value:Math.ceil(this.countdown)});}}
 finish(reason='stop'){if(this.mode==='end')return;this.mode='end';this.result={distance:Math.floor(this.distance),stars:this.stars,solved:this.solved,independent:this.independent,wrong:this.wrong,timedOut:this.timedOut,reason};this.events.push({type:'end',result:this.result});}
}
