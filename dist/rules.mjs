import {normalizeMathSeconds} from './timer.mjs';
export const DEFAULTS=Object.freeze({mode:'starter',tables:[1,2,3,4,5],factorMax:5,range:20,operation:'mix',group:5,pace:'adventure',mathSeconds:30,sound:true,coat:'pearl'});
export const COATS=[{id:'pearl',name:'Parel',color:'#fff7ef',cost:0},{id:'rose',name:'Roos',color:'#f7bbd5',cost:40},{id:'lilac',name:'Lila',color:'#d3b6f2',cost:100},{id:'mint',name:'Munt',color:'#bce7d6',cost:180}];
export function sanitizeSettings(s={}){return {...DEFAULTS,...s,mathSeconds:s.mathSeconds===undefined?DEFAULTS.mathSeconds:normalizeMathSeconds(s.mathSeconds),mode:['starter','tables','arithmetic','group'].includes(s.mode)?s.mode:DEFAULTS.mode,tables:Array.isArray(s.tables)&&s.tables.some(n=>Number.isInteger(n)&&n>=1&&n<=10)?[...new Set(s.tables.filter(n=>Number.isInteger(n)&&n>=1&&n<=10))]:[...DEFAULTS.tables],factorMax:s.factorMax===10?10:5,range:[20,50,100].includes(s.range)?s.range:20,operation:['plus','minus','mix'].includes(s.operation)?s.operation:'mix',group:[3,4,5,6,7,8].includes(s.group)?s.group:5,pace:s.pace==='calm'?'calm':'adventure',coat:COATS.some(c=>c.id===s.coat)?s.coat:'pearl',sound:s.sound!==false};}
export function migrateGameSettings(s={},revision=0){return sanitizeSettings(revision<2?{...s,pace:'adventure',mathSeconds:30}:s);}
const pick=(a,r)=>a[Math.floor(r()*a.length)];
const int=(a,b,r)=>a+Math.floor(r()*(b-a+1));
export const format=n=>String(n).replace('.',',');
export function profileKey(s){const mode=s.mode==='tables'?'tables-'+[...s.tables].sort((a,b)=>a-b).join('.')+'-'+s.factorMax:s.mode==='arithmetic'?'arithmetic-'+s.operation+'-'+s.range:s.mode==='group'?'group-'+s.group:'starter';return mode+'-'+s.pace+(normalizeMathSeconds(s.mathSeconds)?'-timer-'+s.mathSeconds:'');}
export function profileLabel(s){if(s.mode==='starter')return 'Kleine tafels · 1 t/m 5';if(s.mode==='tables')return 'Tafel'+(s.tables.length>1?'s':'')+' '+s.tables.join(', ')+' · × 1–'+s.factorMax;if(s.mode==='arithmetic')return (s.operation==='plus'?'Plus':s.operation==='minus'?'Min':'Plus & min')+' onder '+s.range;return 'Groep '+s.group+' · gemengd';}
function make(a,b,op,extra={}){const answer=op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:a/b;const hint=op==='×'?a+' groepjes van '+b+'. Tel de groepjes bij elkaar.':op==='+'?'Begin bij '+format(a)+' en tel er '+format(b)+' bij.':op==='−'?'Begin bij '+a+' en haal er '+b+' af.':'Hoe vaak past '+b+' in '+a+'?';return {prompt:format(a)+' '+op+' '+format(b),answer:Math.round(answer*100)/100,hint,key:a+op+b,kind:op,a,b,...extra};}
function arithmetic(range,operation,r){const a=int(0,range-1,r);const minus=operation==='minus'||(operation==='mix'&&r()<.5);return minus?make(a,int(0,a,r),'−'):make(a,int(0,range-1-a,r),'+');}
function table(tables,max,r){return make(int(1,max,r),pick(tables,r),'×');}
export function createQuestion(s,r=Math.random){
 if(s.mode==='starter')return table([1,2,3,4,5],5,r);
 if(s.mode==='tables')return table(s.tables,s.factorMax,r);
 if(s.mode==='arithmetic')return arithmetic(s.range,s.operation,r);
 const g=s.group, roll=r();
 if(g===3)return arithmetic(20,'mix',r);
 if(g===4)return roll<.7?arithmetic(100,'mix',r):table([1,2,5,10],5,r);
 if(g===5){if(roll<.55)return table([1,2,3,4,5],5,r);if(roll<.9)return arithmetic(100,'mix',r);const a=int(1,5,r),b=pick([2,3,4,5],r);return make(a*b,b,'÷');}
 if(g===6){if(roll<.4)return table([2,3,4,5,6,7,8,9,10],10,r);if(roll<.7)return make(int(1,9,r)*100,int(1,9,r)*10,'+');if(roll<.85){const a=int(2,10,r),b=int(2,10,r);return make(a*b,b,'÷');}const b=pick([2,4],r),a=b*int(2,12,r);return {prompt:(b===2?'½':'¼')+' van '+a,answer:a/b,hint:'Verdeel '+a+' in '+b+' gelijke groepjes.',key:'fraction-'+a+'-'+b,kind:'fraction'};}
 if(g===7){if(roll<.4)return make(int(1,40,r)/10,int(1,40,r)/10,'+');if(roll<.7){const p=pick([10,25,50],r),a=pick([20,40,60,80,100,200],r);return {prompt:p+'% van '+a,answer:a*p/100,hint:p===50?'50% is de helft van '+a+'.':p===25?'25% is een kwart van '+a+'.':'Voor 10% deel je '+a+' door 10.',key:'percent-'+p+'-'+a,kind:'percent'};}return table([6,7,8,9,10],10,r);}
 if(roll<.45){const p=pick([10,20,25,50,75],r),a=pick([40,80,120,160,200],r);return {prompt:p+'% van '+a,answer:p*a/100,hint:'10% is '+a/10+'. 25% is '+a/4+'. Gebruik een handig tussenstapje.',key:'percent-'+p+'-'+a,kind:'percent'};}
 if(roll<.75){const a=int(2,20,r)*4;return {prompt:'¾ van '+a,answer:a/4*3,hint:'Deel '+a+' eerst door 4. Neem daarna 3 van die delen.',key:'fraction3-'+a,kind:'fraction'};}
 return make(int(1,100,r)/10,int(1,100,r)/10,'+');
}
export function answerMatches(value,answer){if(typeof value!=='string'||!/^\d+(?:[.,]\d+)?$/.test(value.trim()))return false;return Math.abs(Number(value.replace(',','.'))-answer)<1e-8;}
export function speedAt(seconds,pace){return pace==='calm'?9+Math.min(seconds/600,1)*5:12+Math.min(seconds/600,1)*14.4;}
export function obstacleGap(seconds,pace){return pace==='calm'?3.7-Math.min(seconds/600,1)*.8:3.15-Math.min(seconds/600,1)*1.25;}
export function rescueAllowed(used,timeSinceRescue){return used<3&&(timeSinceRescue===null||timeSinceRescue>=5);}
export function generatePattern(seconds,pace,r=Math.random){const lane=int(-1,1,r),type=pick(seconds<40?['cloud','arch']:['cloud','arch','dragon'],r);const result=[{lane,type}];if(seconds>110&&r()<(pace==='calm'?.25:.55)){const other=pick([-1,0,1].filter(n=>n!==lane),r);result.push({lane:other,type:'dragon'});}return result;}