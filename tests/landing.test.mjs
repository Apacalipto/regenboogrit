import test from 'node:test';import assert from 'node:assert/strict';
import {RunEngine} from '../dist/engine.mjs';
import {DEFAULTS,speedAt,obstacleGap} from '../dist/rules.mjs';
import {BOOST_LANDING_SECONDS,LANDING_CLEAR_SECONDS,flightHeightAt,flightSpeedMultiplierAt,makeHeightSection,routeProfile,routeHeightAtLocal} from '../dist/course.mjs';
function run(pace='adventure',elapsed=0){const e=new RunEngine({...DEFAULTS,pace},()=>.5);e.mode='run';e.elapsed=elapsed;e.nextGate=Infinity;e.nextSpawn=Infinity;e.nextHeight=Infinity;e.shield=0;return e;}
test('adventure builds meaningful speed in the first minute, then keeps increasing to ten minutes',()=>{
 const start=speedAt(0,'adventure');assert.equal(start,12);assert(speedAt(30,'adventure')>=start*1.4);assert(speedAt(60,'adventure')>=start*1.7);assert(speedAt(120,'adventure')>=start*2);
 let previous=start;for(let s=1;s<=600;s++){const v=speedAt(s,'adventure');assert(v>previous);assert(v-previous<.25);previous=v;}assert.equal(previous,34);assert.equal(speedAt(1000,'adventure'),34);assert(obstacleGap(60,'adventure')<2.4);assert.equal(speedAt(0,'calm'),9);assert.equal(speedAt(600,'calm'),14);
});
test('flight height and forward speed ease to zero vertical velocity and normal speed at touchdown',()=>{
 for(const duration of [2.5,4].map(t=>t+BOOST_LANDING_SECONDS)){
  const dt=.001,end=flightHeightAt(duration,duration),before=flightHeightAt(duration-dt,duration);
  assert.equal(end,0);assert(Math.abs((end-before)/dt)<.001);
  assert.equal(flightSpeedMultiplierAt(duration,duration),1);assert(Math.abs(flightSpeedMultiplierAt(duration-dt,duration)-1)<.0001);
  let previous=6;for(let t=duration-BOOST_LANDING_SECONDS;t<duration;t+=.01){const y=flightHeightAt(t,duration);assert(y<=previous+1e-8);assert(previous-y<.08);previous=y;}
 }
});
test('boost descent and three-second landing runway are clear in every lane at every difficulty and frame rate',()=>{
 for(const pace of ['easy','normal','hard'])for(const elapsed of [0,25,60,120,600])for(const assisted of [false,true])for(const fps of [20,30,60,120]){
  const e=run(pace,elapsed);e.openMath('boost');e.questionAssisted=assisted;e.answer(true);let descentFrames=0,landings=0,previousSpeed=e.speed;
  while(e.mode==='boost'){
   e.step(1/fps);for(const event of e.drain())if(event.type==='landing')landings++;
   if(e.landingStarted){descentFrames++;for(const o of e.obstacles)assert(o.z-o.length/2>3,'full obstacle must already be behind us before descent');}
   if(e.boostTime<.03)assert(Math.abs(e.speed-previousSpeed)<.1,'no sudden speed change at touchdown');previousSpeed=e.speed;
  }
  assert.equal(landings,1);assert(descentFrames>0);assert.equal(e.mode,'run');assert(e.height<.001);assert(e.grounded);
  assert(Math.abs(e.speed-speedAt(e.elapsed,pace))<.001);assert.equal(e.platforms.length,0);
  const landed=e.elapsed;
  while(e.elapsed-landed<LANDING_CLEAR_SECONDS-1/fps){
   e.action('right');e.step(1/fps);assert.equal(e.mode,'run');assert.equal(e.platforms.length,0);
   assert(e.obstacles.every(o=>o.z-o.length/2>3));assert.equal(e.usedRescues,0);
  }
 }
});
test('low frame rates keep boost obstacle passage, flight distance and landing identical',()=>{
 const results=[];for(const fps of [20,30,60,120]){const e=run('adventure',120);e.openMath('boost');e.answer(true);for(let i=0;i<6*fps;i++)e.step(1/fps);results.push(e);}
 for(const e of results){assert.equal(e.mode,'run');assert(Math.abs(e.distance-results[0].distance)<.04);assert(e.height===0);assert(Math.abs(e.elapsed-results[0].elapsed)<.0001);}
});
test('pausing during descent freezes position, protection and flight pose',()=>{
 const e=run();e.openMath('boost');e.answer(true);for(let i=0;i<270;i++)e.step(1/60);assert(e.landingStarted);e.pause();
 const snapshot=[e.elapsed,e.distance,e.height,e.boostTime,e.flightPose];for(let i=0;i<120;i++)e.step(1/60);assert.deepEqual([e.elapsed,e.distance,e.height,e.boostTime,e.flightPose],snapshot);
 e.resume();for(let i=0;i<180;i++)e.step(1/60);assert.equal(e.mode,'run');assert.equal(e.height,0);
});
test('a new math gate never teleports an airborne unicorn or removes its supporting roof',()=>{
 const e=run();e.nextGate=4.81;e.height=2.6;e.platforms=[{lane:0,z:0,length:40,height:2.6,rampIn:0,rampOut:0}];e.step(.02);
 assert(e.gateShown);assert(e.height>2.5);assert.equal(e.platforms.length,1);assert(e.drain().some(x=>x.type==='clear'&&x.keepSurface));
 const j=run();j.nextGate=4.81;j.height=1.8;j.grounded=false;j.vy=-2;j.step(.02);assert(j.height>1.7);assert.equal(j.mode,'run');
});
test('generated roof gaps have a forgiving catch ramp and safe exit even without a perfect jump',()=>{
 for(const elapsed of [0,60,600])for(const fps of [20,60]){
  const e=run('adventure',elapsed);e.platforms=makeHeightSection(speedAt(elapsed,'adventure'),1,0);let climbed=false;
  for(let i=0;i<12*fps;i++){e.step(1/fps);assert.equal(e.mode,'run');if(e.height>2.5)climbed=true;}
  assert(climbed);assert.equal(e.height,0);assert(e.grounded);assert.equal(e.usedRescues,0);
 }
});
test('the visible rounded ramp and physical surface match throughout each segment',()=>{
 for(const p of makeHeightSection(20,1,0)){const points=routeProfile(p);
  for(let i=0;i<points.length-1;i++){const [za,ya]=points[i],[zb,yb]=points[i+1];if(za===zb)continue;for(const fraction of [0,.25,.5,.75,1]){const z=za+(zb-za)*fraction;assert(Math.abs(routeHeightAtLocal(p,z)-(ya+(yb-ya)*fraction))<1e-8);}}
 }
});
