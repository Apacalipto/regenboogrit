import {t,formatNumber} from './i18n.mjs';
import {localizeQuestion,mathQuestion,fractionQuestion,percentQuestion} from './questions.mjs';
import {normalizeMathSeconds} from './timer.mjs';
import {groupPreset,validRange,practiceKey,practiceSummary,createPracticeQuestion} from './practice.mjs';
export {TOPICS,groupPreset,validRange,practiceProblem,practiceSummary} from './practice.mjs';
export const DEFAULTS=Object.freeze({mode:'practice',topics:['plus','minus','tables','divide'],tables:[1,2,3,4,5],factorMax:5,range:100,operation:'mix',group:5,pace:'normal',language:'nl',mathSeconds:30,sound:true,coat:'pearl'});
export const COATS=[{id:'pearl',name:'Pearl',color:'#fff7ef',cost:0},{id:'rose',name:'Rose',color:'#f7bbd5',cost:40},{id:'lilac',name:'Lilac',color:'#d3b6f2',cost:100},{id:'mint',name:'Mint',color:'#bce7d6',cost:180}];
export function sanitizeSettings(s={}){
 s=s&&typeof s==='object'&&!Array.isArray(s)?s:{};
 const group=[3,4,5,6,7,8].includes(s.group)?s.group:5,preset=groupPreset(group),mode=['practice','starter','tables','arithmetic','group'].includes(s.mode)?s.mode:'practice';
 const validTables=Array.isArray(s.tables)?[...new Set(s.tables.filter(n=>Number.isInteger(n)&&n>=1&&n<=10))].sort((a,b)=>a-b):preset.tables;
 return {...DEFAULTS,...s,group,mode,
  topics:Array.isArray(s.topics)?preset.topics.filter(t=>s.topics.includes(t)):preset.topics,
  tables:mode==='practice'||validTables.length?validTables:preset.tables,
  factorMax:Number.isInteger(s.factorMax)&&s.factorMax>=1&&s.factorMax<=10?s.factorMax:preset.factorMax,
  range:validRange(s.range)?s.range:preset.range,
  mathSeconds:s.mathSeconds===undefined?DEFAULTS.mathSeconds:normalizeMathSeconds(s.mathSeconds),
  operation:['plus','minus','mix'].includes(s.operation)?s.operation:'mix',pace:['easy','normal','hard'].includes(s.pace)?s.pace:s.pace==='calm'?'easy':'normal',language:s.language==='en'?'en':'nl',coat:COATS.some(c=>c.id===s.coat)?s.coat:'pearl',sound:s.sound!==false};
}
export function migrateGameSettings(s={},revision=0){
 s=s&&typeof s==='object'&&!Array.isArray(s)?s:{};
 let chosen=revision<2?{...s,pace:'adventure',mathSeconds:30}:s;
 if(revision<3||chosen.mode!=='practice'){
  const group=[3,4,5,6,7,8].includes(chosen.group)?chosen.group:5,p=groupPreset(group);
  chosen={...chosen,mode:'practice',group,topics:p.topics,range:chosen.mode==='arithmetic'?chosen.range:p.range,tables:chosen.mode==='tables'?chosen.tables:p.tables,factorMax:chosen.mode==='tables'?chosen.factorMax:p.factorMax};
 }
 if(revision<4)chosen={...chosen,pace:chosen.pace==='calm'?'easy':['easy','normal','hard'].includes(chosen.pace)?chosen.pace:'normal'};
 return sanitizeSettings(chosen);
}
const pick=(a,r)=>a[Math.floor(r()*a.length)];
const int=(a,b,r)=>a+Math.floor(r()*(b-a+1));
export const format=formatNumber;
export function profileKey(s){const mode=s.mode==='practice'?practiceKey(s):s.mode==='tables'?'tables-'+[...s.tables].sort((a,b)=>a-b).join('.')+'-'+s.factorMax:s.mode==='arithmetic'?'arithmetic-'+s.operation+'-'+s.range:s.mode==='group'?'group-'+s.group:'starter';return mode+'-'+(s.pace==='easy'?'adventure':s.pace)+(normalizeMathSeconds(s.mathSeconds)?'-timer-'+s.mathSeconds:'');}
export function profileLabel(s){
 const tr=(key,values)=>t(key,values,s.language);
 if(s.mode==='practice')return tr('Group {group}',{group:s.group})+' · '+practiceSummary(s);
 if(s.mode==='starter')return tr('Small tables · 1 to 5');
 if(s.mode==='tables')return tr(s.tables.length>1?'Tables {tables}':'Table {tables}',{tables:s.tables.join(', ')})+' · × 1–'+s.factorMax;
 if(s.mode==='arithmetic')return tr('{topics} below {limit}',{topics:tr(s.operation==='plus'?'Addition':s.operation==='minus'?'Subtraction':'Addition and subtraction'),limit:s.range});
 return tr('Group {group}',{group:s.group})+' · '+tr('mixed');
}
const make=mathQuestion;
function arithmetic(range,operation,r){const a=int(0,range-1,r);const minus=operation==='minus'||(operation==='mix'&&r()<.5);return minus?make(a,int(0,a,r),'−'):make(a,int(0,range-1-a,r),'+');}
function table(tables,max,r){return make(int(1,max,r),pick(tables,r),'×');}
export function createQuestion(s,r=Math.random){return localizeQuestion(generateQuestion(s,r),s.language);}
function generateQuestion(s,r){
 if(s.mode==='practice')return createPracticeQuestion(s,r);
 if(s.mode==='starter')return table([1,2,3,4,5],5,r);
 if(s.mode==='tables')return table(s.tables,s.factorMax,r);
 if(s.mode==='arithmetic')return arithmetic(s.range,s.operation,r);
 const g=s.group, roll=r();
 if(g===3)return arithmetic(20,'mix',r);
 if(g===4)return roll<.7?arithmetic(100,'mix',r):table([1,2,5,10],5,r);
 if(g===5){if(roll<.55)return table([1,2,3,4,5],5,r);if(roll<.9)return arithmetic(100,'mix',r);const a=int(1,5,r),b=pick([2,3,4,5],r);return make(a*b,b,'÷');}
 if(g===6){if(roll<.4)return table([2,3,4,5,6,7,8,9,10],10,r);if(roll<.7)return make(int(1,9,r)*100,int(1,9,r)*10,'+');if(roll<.85){const a=int(2,10,r),b=int(2,10,r);return make(a*b,b,'÷');}const b=pick([2,4],r),a=b*int(2,12,r);return fractionQuestion(a,b);}
 if(g===7){if(roll<.4)return make(int(1,40,r)/10,int(1,40,r)/10,'+');if(roll<.7){const p=pick([10,25,50],r),a=pick([20,40,60,80,100,200],r);return percentQuestion(a,p);}return table([6,7,8,9,10],10,r);}
 if(roll<.45){const p=pick([10,20,25,50,75],r),a=pick([40,80,120,160,200],r);return percentQuestion(a,p);}
 if(roll<.75){const a=int(2,20,r)*4;return fractionQuestion(a,4,3);}
 return make(int(1,100,r)/10,int(1,100,r)/10,'+');
}
export function answerMatches(value,answer){if(typeof value!=='string'||!/^\d+(?:[.,]\d+)?$/.test(value.trim()))return false;return Math.abs(Number(value.replace(',','.'))-answer)<1e-8;}
export const SPEED_MULTIPLIERS=Object.freeze({easy:1,normal:1.2,hard:1.5});
export function speedAt(seconds,pace='normal'){
 const t=Math.max(0,Math.min(seconds,600));
 // The legacy adventure curve remains unchanged in Easy, including its ten-minute cap.
 if(pace==='calm')return 9+t/600*5;
 const base=12+14*(1-Math.exp(-t/65))/(1-Math.exp(-600/65))+8*t/600;
 return base*(SPEED_MULTIPLIERS[pace]??1);
}
export function obstacleGap(seconds,pace){const t=Math.max(0,Math.min(seconds,600));return pace==='calm'?3.7-t/600*.8:2.8-.8*(1-Math.exp(-t/70))-.4*t/600;}
export function rescueAllowed(used,timeSinceRescue){return used<3&&(timeSinceRescue===null||timeSinceRescue>=5);}
export function generatePattern(seconds,pace,r=Math.random){const lane=int(-1,1,r),type=pick(seconds<40?['cloud','arch']:['cloud','arch','dragon'],r);const result=[{lane,type}];if(seconds>110&&r()<(pace==='calm'?.25:.55)){const other=pick([-1,0,1].filter(n=>n!==lane),r);result.push({lane:other,type:'dragon'});}return result;}