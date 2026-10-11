import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,createQuestion,sanitizeSettings,migrateGameSettings,groupPreset,practiceProblem,profileKey,answerMatches} from '../dist/rules.mjs';
let seed=139;const r=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const config=group=>({...DEFAULTS,...groupPreset(group),group});
test('new grade 5 default covers all four basics with only small multiplication and division',()=>{
 assert.equal(DEFAULTS.group,5);const seen=new Set();
 for(let i=0;i<2000;i++){const q=createQuestion(DEFAULTS,r);seen.add(q.topic);if(q.topic==='tables'){assert(q.a>=1&&q.a<=5);assert(q.b>=1&&q.b<=5);}else if(q.topic==='divide'){assert(q.b>=1&&q.b<=5);assert(q.answer>=1&&q.answer<=5);assert(q.a<=25);}else{assert(q.a<100&&q.b<100&&q.answer<100);assert(q.answer>=0);}}
 assert.deepEqual([...seen].sort(),['divide','minus','plus','tables']);
});
test('each group starts with all its suitable topics enabled and every topic produces an answer',()=>{
 const expected={3:['plus','minus'],4:['plus','minus','tables'],5:['plus','minus','tables','divide'],6:['plus','minus','tables','divide','fraction'],7:['plus','minus','tables','divide','fraction','decimal','percent'],8:['plus','minus','tables','divide','fraction','decimal','percent']};
 for(let group=3;group<=8;group++){assert.deepEqual(groupPreset(group).topics,expected[group]);const seen=new Set();for(let i=0;i<1500;i++){const q=createQuestion(config(group),r);seen.add(q.topic);assert(Number.isFinite(q.answer));assert(q.answer>=0);assert(answerMatches(String(q.answer).replace('.',','),q.answer));}assert.deepEqual([...seen].sort(),[...expected[group]].sort());}
});
test('every selection subset generates only selected topics, including divisions without multiplication',()=>{
 const p=config(8),topics=p.topics;
 for(let mask=1;mask<1<<topics.length;mask++){const selected=topics.filter((_,i)=>mask&(1<<i));for(let i=0;i<100;i++)assert(selected.includes(createQuestion({...p,topics:selected},r).topic));}
});
test('chosen and custom arithmetic limits constrain both operands and the result',()=>{
 for(const range of [2,10,20,37,50,100,350,1000,10000])for(const topic of ['plus','minus'])for(let i=0;i<300;i++){const q=createQuestion({...DEFAULTS,range,topics:[topic]},r);assert.equal(q.topic,topic);for(const value of [q.a,q.b,q.answer])assert(value>=0&&value<range);}
});
test('only selected tables and factor ceilings are used for multiplication and inverse division',()=>{
 for(const tables of [[3],[2,5],[7,9,10]])for(const factorMax of [1,3,5,10])for(const topic of ['tables','divide'])for(let i=0;i<300;i++){const q=createQuestion({...DEFAULTS,tables,factorMax,topics:[topic]},r);assert(tables.includes(q.b));const factor=topic==='tables'?q.a:q.answer;assert(factor>=1&&factor<=factorMax);assert(Number.isInteger(factor));}
});
test('empty choices remain empty after sanitation and block generating questions',()=>{
 for(const changes of [{topics:[]},{tables:[]},{topics:['divide'],tables:[]}]){const s=sanitizeSettings({...DEFAULTS,...changes});assert(practiceProblem(s));assert.throws(()=>createQuestion(s),RangeError);}
 const plusOnly=sanitizeSettings({...DEFAULTS,topics:['plus'],tables:[]});assert.equal(practiceProblem(plusOnly),'');assert.equal(createQuestion(plusOnly,r).kind,'+');
});
test('migration enables the new group mix once, preserves pace/timer, and later retains disabled subjects',()=>{
 const migrated=migrateGameSettings({mode:'starter',group:5,pace:'calm',mathSeconds:60},2);assert.deepEqual(migrated.topics,DEFAULTS.topics);assert.equal(migrated.mode,'practice');assert.equal(migrated.pace,'calm');assert.equal(migrated.mathSeconds,60);
 const chosen={...migrated,topics:['plus'],range:37,tables:[3],factorMax:3};assert.deepEqual(migrateGameSettings(chosen,3),chosen);
 const malformed=sanitizeSettings({group:3,topics:['percent','plus','plus'],tables:[2,2,0,99,'4'],factorMax:Infinity,range:'20'});assert.deepEqual(malformed.topics,['plus']);assert.deepEqual(malformed.tables,[2]);assert.equal(malformed.range,20);assert.equal(malformed.factorMax,5);assert.equal(migrateGameSettings(null,3).group,5);
});
test('review and highscore keys include effective topics and limits, without depending on selection order',()=>{
 const key=profileKey(DEFAULTS);for(const changes of [{topics:['plus']},{range:20},{tables:[3]},{factorMax:3},{group:6},{pace:'calm'},{mathSeconds:0}])assert.notEqual(profileKey({...DEFAULTS,...changes}),key);
 assert.equal(profileKey({...DEFAULTS,topics:[...DEFAULTS.topics].reverse(),tables:[...DEFAULTS.tables].reverse()}),key);
 assert.equal(profileKey({...DEFAULTS,topics:['plus'],tables:[1],factorMax:3}),profileKey({...DEFAULTS,topics:['plus'],tables:[8],factorMax:10}));
 assert.equal(profileKey({...DEFAULTS,topics:['tables'],range:20}),profileKey({...DEFAULTS,topics:['tables'],range:100}));
});
