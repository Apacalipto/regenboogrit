import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULTS,speedAt,profileKey,migrateGameSettings,createQuestion,groupPreset,COATS,TOPICS} from '../dist/rules.mjs';
import {t,applyLanguage,formatNumber} from '../dist/i18n.mjs';
import {localizeQuestion} from '../dist/questions.mjs';
import dutch from '../dist/locales/nl.mjs';
import {MATH_TIMERS,timerLabel} from '../dist/timer.mjs';
import {RunEngine} from '../dist/engine.mjs';
import {makeHeightSection} from '../dist/course.mjs';

test('Normal defaults to 120% and Hard to 150% of the unchanged Easy curve at every point',()=>{
 assert.equal(DEFAULTS.pace,'normal');
 for(let second=0;second<=900;second++){const easy=speedAt(second,'easy');assert.equal(easy,speedAt(second,'adventure'));assert.equal(speedAt(second,'normal'),easy*1.2);assert.equal(speedAt(second,'hard'),easy*1.5);}
 assert.equal(speedAt(0,'easy'),12);assert.equal(speedAt(600,'easy'),34);assert.equal(speedAt(600,'normal'),40.8);assert.equal(speedAt(600,'hard'),51);
});
test('migration preserves practice, timer and progress identities while Normal becomes the new default',()=>{
 const old={...DEFAULTS,pace:'adventure',topics:['tables'],tables:[3],factorMax:3,mathSeconds:60};
 const current=migrateGameSettings(old,3);assert.equal(current.pace,'normal');assert.deepEqual(current.topics,['tables']);assert.deepEqual(current.tables,[3]);assert.equal(current.factorMax,3);assert.equal(current.mathSeconds,60);
 assert.equal(profileKey(old),profileKey({...current,pace:'easy'}));
 assert.equal(new Set(['easy','normal','hard'].map(pace=>profileKey({...current,pace}))).size,3);
 assert.equal(profileKey({...current,language:'nl'}),profileKey({...current,language:'en'}));
 for(const pace of ['easy','normal','hard'])assert.equal(migrateGameSettings({...current,pace},4).pace,pace);
});
test('the engine travels at the chosen speed multiplier, including late-game running',()=>{
 for(const elapsed of [0,60,600]){const distances=[];for(const pace of ['easy','normal','hard']){const e=new RunEngine({...DEFAULTS,pace});e.mode='run';e.elapsed=elapsed;e.nextSpawn=e.nextHeight=e.nextGate=Infinity;for(let i=0;i<120;i++)e.step(1/120);distances.push(e.distance);assert(Math.abs(e.speed-speedAt(e.elapsed,pace))<1e-8);}assert(Math.abs(distances[1]/distances[0]-1.2)<1e-10);assert(Math.abs(distances[2]/distances[0]-1.5)<1e-10);}
});
test('generated raised routes still allow a smooth safe exit at every new speed',()=>{
 for(const pace of ['easy','normal','hard'])for(const elapsed of [0,60,600]){const e=new RunEngine({...DEFAULTS,pace});e.mode='run';e.elapsed=elapsed;e.nextSpawn=e.nextHeight=e.nextGate=Infinity;e.shield=0;e.platforms=makeHeightSection(speedAt(elapsed,pace),1,0);let climbed=false;for(let i=0;i<12*30;i++){e.step(1/30);assert.equal(e.mode,'run');climbed||=e.height>2.5;}assert(climbed);assert.equal(e.height,0);assert(e.grounded);}
});
test('English and Dutch questions have identical maths, localized hints and decimal separators',()=>{
 for(let group=3;group<=8;group++)for(const topic of groupPreset(group).topics){let seed=39;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);for(let i=0;i<60;i++){const q=createQuestion({...DEFAULTS,...groupPreset(group),group,topics:[topic],language:'en'},random),translated=localizeQuestion(q,'nl');assert.equal(q.answer,translated.answer);assert.equal(q.key,translated.key);assert(q.hint&&!q.hint.includes('undefined'));assert(translated.hint&&!translated.hint.includes('undefined'));if(['fraction','percent'].includes(topic)){assert(q.prompt.includes(' of '));assert(translated.prompt.includes(' van '));}if(topic==='decimal'&&(!Number.isInteger(q.a)||!Number.isInteger(q.b))){assert(q.prompt.includes('.'));assert(translated.prompt.includes(','));}}}
 assert.equal(formatNumber(2.5,'en'),'2.5');assert.equal(formatNumber(2.5,'nl'),'2,5');assert.equal(timerLabel(30,'en'),'30 seconds');assert.equal(timerLabel(0,'en'),'Unlimited');
});
test('old review questions translate on demand without losing their mathematical identity',()=>{
 for(const q of [{kind:'fraction',key:'fraction-12-4',answer:3},{kind:'fraction',key:'fraction3-20',answer:15},{kind:'fraction',key:'fraction-3-4-20',answer:15},{kind:'percent',key:'percent-25-80',answer:20},{kind:'×',key:'3×5',a:3,b:5,answer:15}]){const en=localizeQuestion({...q,prompt:'oude tekst',hint:'oude hulp'},'en');assert.equal(en.key,q.key);assert.equal(en.answer,q.answer);assert(!en.prompt.includes('oude'));assert(!en.hint.includes('oude'));}
});
test('every static UI message and accessible label has a complete Dutch translation',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const decode=value=>value.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<');
 const keys=[...html.matchAll(/data-i18n(?:-aria|-content)?="([^"]+)"/g)].map(m=>decode(m[1]));
 for(const key of [...keys,...COATS.map(c=>c.name),...Object.values(TOPICS),...MATH_TIMERS.map(c=>c.label),...[3,4,5,6,7,8].map(g=>groupPreset(g).help)])assert(Object.hasOwn(dutch,key),'missing translation: '+key);
 for(const [key,translated] of Object.entries(dutch)){assert.equal(typeof translated,'string');assert.deepEqual([...key.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),[...translated.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort(),key);}
});
test('language application translates text, screen-reader labels and metadata in both directions',()=>{
 const text={dataset:{i18n:'What shall we practise?'}},aria={dataset:{i18nAria:'Your answer'},setAttribute(k,v){this[k]=v;}},meta={dataset:{i18nContent:'Rainbow Ride · Your magical maths adventure'},setAttribute(k,v){this[k]=v;}};
 const document={documentElement:{},querySelectorAll:selector=>selector==='[data-i18n]'?[text]:selector==='[data-i18n-aria]'?[aria]:[meta]};
 applyLanguage(document,'nl');assert.equal(text.textContent,'Wat gaan we oefenen?');assert.equal(aria['aria-label'],'Jouw antwoord');assert.equal(document.documentElement.lang,'nl');
 applyLanguage(document,'en');assert.equal(text.textContent,'What shall we practise?');assert.equal(aria['aria-label'],'Your answer');assert.equal(meta.content,'Rainbow Ride · Your magical maths adventure');assert.equal(document.documentElement.lang,'en');
 assert.equal(t('ANOTHER CHANCE · {used} OF 3',{used:2},'en'),'ANOTHER CHANCE · 2 OF 3');
});
