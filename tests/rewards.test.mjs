import test from 'node:test';import assert from 'node:assert/strict';
import {RunEngine} from '../dist/engine.mjs';import {DEFAULTS,speedAt} from '../dist/rules.mjs';import {BOOST_LANDING_SECONDS} from '../dist/course.mjs';
function run(pace='adventure',elapsed=0){const e=new RunEngine({...DEFAULTS,pace},()=>0);e.mode='run';e.elapsed=elapsed;e.nextGate=Infinity;e.nextSpawn=Infinity;e.nextHeight=Infinity;e.shield=0;return e;}
const advance=(e,seconds,fps=60)=>{for(let i=0;i<Math.round(seconds*fps);i++)e.step(1/fps);};
test('one mistake still offers a second attempt and the smaller boost',()=>{
 const e=run();e.openMath('boost');e.drain();e.answer(false);assert.equal(e.mode,'math');assert.equal(e.questionMistakes,1);assert(e.drain().some(x=>x.type==='answerRetry'));
 e.answer(true);assert.equal(e.mode,'boost');assert.equal(e.boostTime,2.5+BOOST_LANDING_SECONDS);assert.equal(e.stars,2);assert.equal(e.solved,1);assert.equal(e.independent,0);
});
test('two mistakes freeze the solution screen and can only continue on the ground without a reward',()=>{
 const e=run();e.distance=300;e.elapsed=42;e.openMath('boost');e.drain();e.answer(false);e.answer(false);assert.equal(e.mode,'math-wrong');assert.equal(e.wrong,2);
 const events=e.drain();assert.equal(events.filter(x=>x.type==='wrongAnswer').length,1);e.answer(true);e.answer(false);e.timeOut();advance(e,90);
 assert.equal(e.mode,'math-wrong');assert.equal(e.wrong,2);assert.equal(e.elapsed,42);assert.equal(e.distance,300);assert.equal(e.stars,0);assert.equal(e.solved,0);
 e.completeWrong();assert.equal(e.mode,'run');assert.equal(e.height,0);assert(e.grounded);assert.equal(e.boostTime,0);assert(e.shield>0);assert.equal(e.obstacles.length,0);
 assert.equal(e.drain().filter(x=>x.type==='boost').length,0);e.completeWrong();e.step(.05);assert(e.distance>300);
});
test('a new question resets its attempts; rescue still requires one correct answer',()=>{
 const e=run();e.openMath('boost');e.answer(false);e.answer(false);e.completeWrong();e.openMath('boost');assert.equal(e.questionMistakes,0);assert(!e.questionAssisted);e.answer(true);assert.equal(e.stars,5);assert.equal(e.mode,'boost');
 e.openMath('rescue');e.answer(false);assert.equal(e.mode,'end');assert.equal(e.result.reason,'answer');assert.equal(e.usedRescues,0);
});
test('stars really lie underneath an arch and are earned by ducking at every speed and frame rate',()=>{
 for(const pace of ['calm','adventure'])for(const elapsed of [0,60,600])for(const fps of [20,60,120]){
  const e=run(pace,elapsed);e.spawnObstacle('arch',0,-7);assert.equal(e.coins.length,5);
  assert(e.coins.every(c=>c.lane===0&&c.y===.6&&c.requiresDuck));assert(e.coins.some(c=>c.z===-7));
  e.action('duck');advance(e,1.4,fps);assert.equal(e.mode,'run',pace+' '+elapsed+' '+fps);assert.equal(e.stars,5);
 }
});
test('running upright past an arch does not collect duck stars even while shielded',()=>{
 const e=run();e.shield=100;e.spawnObstacle('arch',0,-7);advance(e,1.4);assert.equal(e.stars,0);
});
test('raised arch stars use the deck height; boost scenery never creates duck-only rewards',()=>{
 const e=run();e.height=2.6;e.platforms=[{lane:0,z:0,length:200,height:2.6,rampIn:0,rampOut:0}];e.spawnObstacle('arch',0,-7,2.6);assert(e.coins.every(c=>Math.abs(c.y-3.2)<1e-8));e.action('duck');advance(e,1.4);assert.equal(e.stars,5);assert.equal(e.mode,'run');
 e.openMath('boost');e.answer(true);assert(e.coins.length>0);assert(e.coins.every(c=>!c.requiresDuck));
});
test('every third normal wave includes a rewarding duck route and leaves an alternative lane open',()=>{
 const e=run();let arches=0;
 for(let wave=0;wave<9;wave++){e.obstacles=[];e.coins=[];e.elapsed=15+wave*15;e.nextSpawn=0;e.step(.01);
  const arch=e.obstacles.find(o=>o.type==='arch');if(wave%3===0)assert(arch);
  if(arch){arches++;assert.equal(e.coins.length,5);assert(e.coins.every(c=>c.lane===arch.lane&&c.requiresDuck));}
  assert(new Set(e.obstacles.map(o=>o.lane)).size<3);
 }assert(arches>=3);
});
