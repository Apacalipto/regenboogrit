import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {RunEngine} from '../dist/engine.mjs';import * as rules from '../dist/rules.mjs';import * as timers from '../dist/timer.mjs';import * as i18n from '../dist/i18n.mjs';import * as questions from '../dist/questions.mjs';
const source=readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8').replace(/^import .*;$/gm,'');
const markup=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
function ui(saved=new Map(),chooseDefaultLanguage=true){
 const nodes=new Map(),events={},timeouts=new Map();let tid=0,now=0,document;
 class Element{
  constructor(id=''){this.id=id;this.hidden=false;this.disabled=false;this.dataset={};this.style={};this.children=[];this.textContent='';this.attributes={};this.parentElement=null;this.className='';const classes=new Set();this.classList={add:(...c)=>c.forEach(x=>classes.add(x)),remove:(...c)=>c.forEach(x=>classes.delete(x)),toggle:(c,on)=>on?classes.add(c):classes.delete(c),contains:c=>classes.has(c)};}
  setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,fn){this['on'+k]=fn;}focus(){document.activeElement=this;}click(){if(!this.disabled)this.onclick?.();}append(...c){for(const el of c){if(typeof el==='object')el.parentElement=this;this.children.push(el);}}replaceChildren(...c){this.children=[];this.append(...c);}closest(selector){for(let e=this;e;e=e.parentElement)if(selector==='[hidden]'&&e.hidden)return e;return null;}
  querySelector(){return new Element();}querySelectorAll(){return this.children.filter(x=>x instanceof Element);}
 }
 for(const match of markup.matchAll(/\bid="([^"]+)"/g))nodes.set(match[1],new Element(match[1]));
 const digits=Array.from('1234567890,').map(d=>{const b=new Element();b.dataset.digit=d;return b;});nodes.get('math-numpad').append(...digits);nodes.get('math-modal').append(nodes.get('math-numpad'),nodes.get('answer-button'),nodes.get('math-skip'));
 const modals=['language-modal','math-modal','end-modal','help-modal','collection-modal','pause-modal'].map(id=>nodes.get(id));modals.forEach(e=>e.hidden=true);
 document={documentElement:{lang:'en'},hidden:false,activeElement:new Element(),body:new Element(),getElementById:id=>nodes.get(id)||null,createElement:()=>new Element(),createTextNode:text=>({textContent:text}),querySelector:()=>new Element(),querySelectorAll:s=>s==='.modal'?modals:s==='[data-digit]'?digits:[],addEventListener:(k,f)=>events[k]=f};
 class World{constructor(){this.coins=[];this.scene={remove(){}};this.worldName='Cloud Castle';}setCoat(){}reset(){this.coins=[];}addObstacle(){return {};}addCoin(){const c={group:{}};this.coins.push(c);return c;}addPlatform(){}addGate(){}clearAhead(){this.coins=[];}move(){}update(){}}
 class MagicAudio{unlock(){}play(){}}
 const context=vm.createContext({...rules,...timers,...i18n,...questions,RunEngine,World,MagicAudio,document,window:{scrollTo(){}},performance:{now:()=>now},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},requestAnimationFrame:()=>0,addEventListener:(k,f)=>events[k]=f,setTimeout:(fn,ms)=>{timeouts.set(++tid,{fn,ms});return tid;},clearTimeout:id=>timeouts.delete(id),console});
 vm.runInContext(source,context);
 if(chooseDefaultLanguage)vm.runInContext("if(!data.languageChosen)chooseLanguage('nl');",context);
 const exec=code=>vm.runInContext(code,context);
 const question=()=>exec("question");
 const enter=n=>{for(const d of String(n))exec('inputDigit('+JSON.stringify(d)+')');exec('submitAnswer()');};
 const startQuestion=()=>exec("startRun();engine.mode='run';engine.openMath('boost');processEvents();");
 return {exec,nodes,question,enter,startQuestion,saved,events,advanceTime:ms=>{now+=ms;},runFeedback:()=>{const entry=[...timeouts.values()].find(x=>x.ms===850);assert(entry);entry.fn();}};
}
test('actual UI offers one retry, then shows the solution until Continue and never starts a boost',()=>{
 const u=ui();u.startQuestion();const q=u.question();u.enter(q.answer+1);assert.equal(u.exec('engine.mode'),'math');assert.equal(u.nodes.get('answer-display').textContent,'?');assert.equal(u.nodes.get('math-numpad').hidden,false);
 u.enter(q.answer+2);assert.equal(u.exec('engine.mode'),'math-wrong');assert.equal(u.nodes.get('answer-display').textContent,rules.format(q.answer));assert.equal(u.nodes.get('math-numpad').hidden,true);assert.equal(u.nodes.get('answer-button').hidden,true);assert.equal(u.nodes.get('math-skip').disabled,false);
 assert(u.nodes.get('math-feedback').textContent.includes('zonder boost'));u.advanceTime(90000);u.exec('checkQuestionClock()');assert.equal(u.exec('engine.mode'),'math-wrong');
 u.events.keydown({key:'Enter',preventDefault(){}});assert.equal(u.exec('engine.mode'),'run');assert.equal(u.exec('engine.stars'),0);assert.equal(u.exec('engine.height'),0);
 u.exec("engine.openMath('boost');processEvents();");assert.equal(u.nodes.get('math-numpad').hidden,false);assert.equal(u.nodes.get('answer-button').hidden,false);assert.equal(u.nodes.get('math-skip').className,'text-button');assert.equal(u.exec('engine.questionMistakes'),0);
});
test('actual UI grants the smaller boost when the second submitted answer is correct',()=>{
 const u=ui();u.startQuestion();const q=u.question();u.enter(q.answer+1);u.enter(q.answer);u.runFeedback();assert.equal(u.exec('engine.mode'),'boost');assert.equal(u.exec('engine.stars'),2);assert.equal(u.exec('engine.independent'),0);assert.equal(u.exec('engine.solved'),1);
});
test('end screen shows the saved highscore after a lower run and after reloading storage',()=>{
 const u=ui();u.exec("startRun();engine.distance=1542.8;engine.finish('stop');processEvents();");assert.equal(u.nodes.get('end-best-distance').textContent,'1.542');assert.equal(u.nodes.get('end-distance').textContent,'1.542');assert.equal(u.nodes.get('end-modal').hidden,false);
 u.exec("startRun();engine.distance=700;engine.finish('answer');processEvents();");assert.equal(u.nodes.get('end-best-distance').textContent,'1.542');assert.equal(u.nodes.get('end-distance').textContent,'700');
 const reload=ui(u.saved);reload.exec("startRun();engine.distance=12;engine.finish('quick');processEvents();");assert.equal(reload.nodes.get('end-best-distance').textContent,'1.542');assert(reload.nodes.get('end-best').textContent.includes('op dit apparaat'));
});

const choose=(u,id,key)=>{const button=u.nodes.get(id).children.find(b=>b.dataset.choice===String(key));assert(button,'choice '+id+' '+key+' exists');button.click();};
test('group menu starts at grade 5, resets to each chosen group, and keeps timer and pace separate',()=>{
 const u=ui();assert.equal(u.exec('settings.group'),5);assert.equal(u.nodes.get('topic-chips').children.length,4);assert(u.nodes.get('topic-chips').children.every(b=>b.attributes['aria-pressed']==='true'));
 u.exec("settings.mathSeconds=60;settings.pace='calm'");choose(u,'topic-chips','minus');choose(u,'group-chips',3);assert.equal(u.exec('settings.group'),3);assert.equal(u.exec('settings.range'),20);assert.equal(u.nodes.get('topic-chips').children.length,2);assert(u.nodes.get('topic-chips').children.every(b=>b.attributes['aria-pressed']==='true'));assert.equal(u.exec('settings.mathSeconds'),60);assert.equal(u.exec('settings.pace'),'calm');
 choose(u,'group-chips',4);assert.equal(u.exec('settings.range'),100);assert.equal(u.exec('JSON.stringify(settings.tables)'),'[1,2,5,10]');choose(u,'group-chips',6);assert.equal(u.nodes.get('topic-chips').children.length,5);
});
test('UI honors disabled topics, selected tables and factor ceiling through questions and reload',()=>{
 const u=ui();choose(u,'topic-chips','plus');choose(u,'topic-chips','minus');choose(u,'topic-chips','divide');for(const n of [1,2,4,5])choose(u,'table-chips',n);choose(u,'factor-chips',3);
 for(let i=0;i<100;i++){const q=u.exec('nextQuestion()');assert.equal(q.topic,'tables');assert.equal(q.b,3);assert(q.a<=3);}
 const reload=ui(u.saved);assert.equal(reload.exec('JSON.stringify(settings.topics)'),'["tables"]');assert.equal(reload.exec('JSON.stringify(settings.tables)'),'[3]');assert.equal(reload.exec('settings.factorMax'),3);assert.equal(reload.nodes.get('number-settings').hidden,true);assert.equal(reload.nodes.get('play-button').disabled,false);
 reload.nodes.get('reset-practice').click();assert.equal(reload.exec('settings.topics.length'),4);assert.equal(reload.exec('settings.factorMax'),5);
});
test('all-off and no-table selections disable Start, survive reload, and can be repaired',()=>{
 const u=ui();for(const t of ['plus','minus','tables','divide'])choose(u,'topic-chips',t);assert.equal(u.nodes.get('play-button').disabled,true);assert.equal(u.nodes.get('practice-error').hidden,false);u.nodes.get('play-button').click();assert.equal(u.exec('engine'),null);
 const reload=ui(u.saved);assert.equal(reload.nodes.get('play-button').disabled,true);choose(reload,'topic-chips','tables');for(const n of [1,2,3,4,5])choose(reload,'table-chips',n);assert.equal(reload.nodes.get('play-button').disabled,true);assert.equal(ui(reload.saved).exec('settings.tables.length'),0);choose(reload,'table-chips',3);assert.equal(reload.nodes.get('play-button').disabled,false);
});
test('custom upper bounds update actual questions; invalid input cannot start a run',()=>{
 const u=ui();for(const t of ['minus','tables','divide'])choose(u,'topic-chips',t);const input=u.nodes.get('custom-range');input.value='37';input.oninput();for(let i=0;i<100;i++){const q=u.exec('nextQuestion()');assert.equal(q.kind,'+');assert(q.a<37&&q.b<37&&q.answer<37);}assert.equal(ui(u.saved).exec('settings.range'),37);
 for(const value of ['', '1','-10','3.5','10001']){input.value=value;input.oninput();assert.equal(u.nodes.get('play-button').disabled,true);assert.equal(u.nodes.get('range-error').hidden,false);}input.value='20';input.oninput();assert.equal(u.nodes.get('play-button').disabled,false);assert.equal(u.nodes.get('range-error').hidden,true);
});
test('previously queued mistakes cannot reintroduce a disabled subject or excluded table',()=>{
 const u=ui();u.exec("data.review=[{profile:profileKey(settings),wait:0,question:{key:'blocked',prompt:'5 × 5',topic:'tables',answer:25}}]");choose(u,'topic-chips','tables');choose(u,'topic-chips','divide');choose(u,'topic-chips','minus');for(let i=0;i<30;i++)assert.equal(u.exec('nextQuestion().topic'),'plus');assert.equal(u.exec('data.review.length'),1);
});

test('first launch requires language choice, then English persists without resetting practice or progress',()=>{
 const u=ui(new Map(),false);assert.equal(u.exec('activeModal'),'language-modal');assert.equal(u.nodes.get('language-close').hidden,true);u.events.keydown({key:'Escape',preventDefault(){}});assert.equal(u.exec('activeModal'),'language-modal');
 u.exec("data.bank=80;settings.tables=[3];settings.topics=['tables'];settings.range=37;");u.nodes.get('language-en').click();assert.equal(u.exec('activeModal'),null);assert.equal(u.exec('document.documentElement.lang'),'en');assert.equal(u.exec('data.languageChosen'),true);assert.equal(u.nodes.get('language-button').textContent,'EN');assert.equal(u.nodes.get('decimal-button').textContent,'.');assert.equal(u.nodes.get('topic-chips').children[0].textContent,'Addition');assert(u.nodes.get('practice-summary').textContent.startsWith('Table 3'));
 const reload=ui(u.saved,false);assert.equal(reload.exec('activeModal'),null);assert.equal(reload.exec('settings.language'),'en');assert.equal(reload.exec('data.bank'),80);assert.equal(reload.exec('settings.range'),37);assert.equal(reload.exec('JSON.stringify(settings.tables)'),'[3]');
 reload.nodes.get('language-button').click();assert.equal(reload.nodes.get('language-close').hidden,false);reload.nodes.get('language-nl').click();assert.equal(reload.exec('document.documentElement.lang'),'nl');assert.equal(reload.nodes.get('topic-chips').children[0].textContent,'Plus');assert.equal(reload.nodes.get('decimal-button').textContent,',');assert.equal(reload.exec('data.bank'),80);
});
test('English is used throughout hints, retries, wrong answers, rescues, timer and highscore feedback',()=>{
 const u=ui(new Map(),false);u.nodes.get('language-en').click();u.startQuestion();assert.equal(u.nodes.get('math-title').textContent,'Cast a boost!');assert.equal(u.nodes.get('math-timer-label').textContent,'30 seconds left');
 const q=u.question();u.enter(q.answer+1);assert(u.nodes.get('math-feedback').textContent.startsWith('Another try! '));u.enter(q.answer+2);assert(u.nodes.get('math-feedback').textContent.includes('without a boost'));assert.equal(u.nodes.get('math-skip').textContent,'Keep riding the rainbow →');u.nodes.get('math-skip').click();
 u.exec("engine.openMath('rescue');processEvents();");assert.equal(u.nodes.get('math-title').textContent,'Help your unicorn carry on.');assert.equal(u.nodes.get('math-eyebrow').textContent,'ANOTHER CHANCE · 1 OF 3');
 u.exec("engine.distance=1542;engine.finish('stop');processEvents();");assert.equal(u.nodes.get('end-best-distance').textContent,'1,542');assert(u.nodes.get('end-best').textContent.includes('Normal · 30 seconds · on this device'));assert.equal(u.nodes.get('end-reason').textContent,'Your unicorn is taking a break. Your stars are saved.');
});
test('a saved Dutch review question is shown in English after switching language',()=>{
 const u=ui();u.exec("settings.group=6;settings.topics=['fraction'];data.review=[{profile:profileKey(settings),wait:0,question:{kind:'fraction',key:'fraction-12-4',answer:3,prompt:'¼ van 12',hint:'Verdeel 12 in 4 groepjes.'}}]");u.nodes.get('language-en').click();const q=u.exec('nextQuestion()');assert.equal(q.prompt,'¼ of 12');assert(q.hint.startsWith('Divide 12 by 4.'));
});
test('English decimal input uses a point while accepting either keyboard separator',()=>{
 const u=ui();u.nodes.get('language-en').click();u.startQuestion();u.exec("answer='';inputDigit('2');inputDigit(',');inputDigit('5');");assert.equal(u.nodes.get('answer-display').textContent,'2.5');u.exec("inputDigit('.');");assert.equal(u.nodes.get('answer-display').textContent,'2.5');
});
test('speed buttons persist the selected difficulty and start the engine with it',()=>{
 const u=ui();const buttons=u.nodes.get('pace-options').children;assert.equal(buttons.length,3);assert.equal(buttons.find(b=>b.dataset.pace==='normal').attributes['aria-pressed'],'true');buttons.find(b=>b.dataset.pace==='hard').click();const reload=ui(u.saved);assert.equal(reload.exec('settings.pace'),'hard');reload.exec('startRun()');assert.equal(reload.exec('engine.speed'),18);
});
