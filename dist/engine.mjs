import {speedAt,obstacleGap,generatePattern,rescueAllowed} from './rules.mjs';
export class RunEngine{
 constructor(settings,rng=Math.random){this.settings={...settings};this.rng=rng;this.events=[];this.id=0;this.mode='countdown';this.countdown=3;this.elapsed=0;this.distance=0;this.stars=0;this.solved=0;this.independent=0;this.wrong=0;this.timedOut=0;this.usedRescues=0;this.lastRescue=null;this.lane=0;this.x=0;this.jump=0;this.jumpTime=0;this.duckTime=0;this.shield=1.5;this.boostTime=0;this.obstacles=[];this.coins=[];this.nextSpawn=4;this.nextGate=25;this.gateShown=false;this.mathKind=null;this.questionAssisted=false;this.result=null;this.events.push({type:'countdown',value:3});}
 drain(){return this.events.splice(0);}
 action(a){if(this.mode!=='run')return;if(a==='left')this.lane=Math.max(-1,this.lane-1);if(a==='right')this.lane=Math.min(1,this.lane+1);if(a==='jump'&&this.jumpTime===0){this.jumpTime=1.08;this.duckTime=0;this.events.push({type:'jump'});}if(a==='duck'&&this.jumpTime===0){this.duckTime=1.3;this.events.push({type:'duck'});}}
 clear(){this.obstacles=[];this.coins=[];this.events.push({type:'clear'});}
 step(dt){dt=Math.min(Math.max(dt,0),.06);
 if(this.mode==='countdown'){const before=Math.ceil(this.countdown);this.countdown-=dt;if(Math.ceil(this.countdown)!==before&&this.countdown>0)this.events.push({type:'countdown',value:Math.ceil(this.countdown)});if(this.countdown<=0){this.mode='run';this.events.push({type:'started'});}return;}
 if(this.mode!=='run'&&this.mode!=='boost')return;
 this.elapsed+=dt;this.shield=Math.max(0,this.shield-dt);
 this.x+=(this.lane*2.8-this.x)*Math.min(1,dt*15);
 if(this.jumpTime>0){this.jumpTime=Math.max(0,this.jumpTime-dt);this.jump=Math.sin((1-this.jumpTime/1.08)*Math.PI)*1.9;if(!this.jumpTime)this.jump=0;}
 this.duckTime=Math.max(0,this.duckTime-dt);
 const boosted=this.mode==='boost',speed=speedAt(this.elapsed,this.settings.pace)*(boosted?3:1),delta=speed*dt;this.distance+=delta;this.events.push({type:'move',delta});
 if(boosted){this.boostTime-=dt;if(this.boostTime<=0){this.mode='run';this.shield=1.7;this.nextSpawn=this.elapsed+2;this.events.push({type:'boostEnd'});}return;}
 if(this.elapsed>=this.nextGate){this.openMath('boost');return;}
 if(!this.gateShown&&this.nextGate-this.elapsed<4.8){this.gateShown=true;this.clear();this.events.push({type:'gate',z:-speed*4.8});}
 if(this.elapsed>=this.nextSpawn&&this.nextGate-this.elapsed>11){this.nextSpawn=this.elapsed+obstacleGap(this.elapsed,this.settings.pace);const pattern=generatePattern(this.elapsed,this.settings.pace,this.rng);for(const item of pattern){const o={...item,id:++this.id,z:-65,length:item.type==='dragon'?5.9:1.4};this.obstacles.push(o);this.events.push({...o,type:'obstacle',kind:item.type});}const open=[-1,0,1].filter(l=>!pattern.some(o=>o.lane===l));const coinLane=open[Math.floor(this.rng()*open.length)];for(let i=0;i<5;i++){const c={id:++this.id,lane:coinLane,z:-65-i*2};this.coins.push(c);this.events.push({type:'coin',...c});}}
 for(const o of this.obstacles){o.z+=delta;if(Math.abs(o.z)<o.length/2+.3&&Math.abs(this.x-o.lane*2.8)<.92&&this.shield<=0){const safe=o.type==='cloud'?this.jump>.9:o.type==='arch'?this.duckTime>0:false;if(!safe){this.crash();return;}}}
 this.obstacles=this.obstacles.filter(o=>o.z<15);
 for(const c of this.coins){c.z+=delta;if(!c.collected&&Math.abs(c.z)<.9&&Math.abs(this.x-c.lane*2.8)<.9&&this.jump<1.5){c.collected=true;this.stars++;this.events.push({type:'collected',id:c.id});}}
 this.coins=this.coins.filter(c=>!c.collected&&c.z<15);
 }
 openMath(kind){this.clear();this.mode='math';this.mathKind=kind;this.questionAssisted=false;this.jump=0;this.jumpTime=0;this.duckTime=0;this.events.push({type:'math',kind});}
 answer(correct){if(this.mode!=='math')return;
 if(!correct){this.wrong++;this.questionAssisted=true;if(this.mathKind==='rescue')this.finish('answer');return;}
 this.solved++;if(!this.questionAssisted)this.independent++;
 const reward=this.questionAssisted?2:5;this.stars+=reward;
 if(this.mathKind==='rescue'){this.usedRescues++;this.lastRescue=this.elapsed;this.lane=0;this.x=0;this.shield=1;this.nextSpawn=this.elapsed+.2;this.nextGate=this.elapsed+34;this.gateShown=false;this.countdown=3;this.mode='countdown';this.events.push({type:'rescued',reward});this.events.push({type:'countdown',value:3});}
 else{this.mode='boost';this.boostTime=this.questionAssisted?2.5:4;this.jump=0;this.nextGate=this.elapsed+35+this.rng()*8;this.gateShown=false;this.events.push({type:'boost',reward});}
 }
 timeOut(){if(this.mode!=='math')return;this.mode='math-timeout';this.timedOut++;this.events.push({type:'mathTimeout',kind:this.mathKind});}
 completeTimeout(){if(this.mode!=='math-timeout')return;if(this.mathKind==='rescue')this.finish('timeout');else{this.mode='math';this.skip();}}
 skip(){if(this.mode!=='math')return;if(this.mathKind==='rescue'){this.finish('stop');return;}this.mode='run';this.shield=2;this.nextSpawn=this.elapsed+2;this.nextGate=this.elapsed+32;this.gateShown=false;this.events.push({type:'skipped'});}
 crash(){if(rescueAllowed(this.usedRescues,this.lastRescue===null?null:this.elapsed-this.lastRescue))this.openMath('rescue');else this.finish(this.lastRescue!==null&&this.elapsed-this.lastRescue<5?'quick':'rescues');}
 pause(){if(this.mode==='run'||this.mode==='boost'||this.mode==='countdown'){this.previousMode=this.mode;this.mode='paused';this.events.push({type:'paused'});}}
 resume(){if(this.mode==='paused'){if(this.previousMode==='countdown'){this.mode='countdown';this.events.push({type:'countdown',value:Math.ceil(this.countdown)});}else this.mode=this.previousMode;}}
 finish(reason='stop'){if(this.mode==='end')return;this.mode='end';this.result={distance:Math.floor(this.distance),stars:this.stars,solved:this.solved,independent:this.independent,wrong:this.wrong,timedOut:this.timedOut,reason};this.events.push({type:'end',result:this.result});}
}