import {t,applyLanguage,localeFor,decimalSeparator} from './i18n.mjs';
import {localizeQuestion} from './questions.mjs';
import {World} from './world.mjs';
import {RunEngine} from './engine.mjs';
import {QuestionClock,MATH_TIMERS,timerLabel} from './timer.mjs';
import {MagicAudio} from './audio.mjs';
import {DEFAULTS,COATS,TOPICS,groupPreset,validRange,practiceProblem,practiceSummary,migrateGameSettings,createQuestion,answerMatches,format,profileKey,profileLabel} from './rules.mjs';
const $=id=>document.getElementById(id),all=s=>[...document.querySelectorAll(s)];
const STORAGE='regenboogrit-v1';let data={settings:{...DEFAULTS},bank:0,bests:{},facts:{},unlocked:['pearl'],review:[],tutorial:false,totalCorrect:0};try{const raw=JSON.parse(localStorage.getItem(STORAGE)||'null');if(raw&&typeof raw==='object')data={...data,...raw};}catch{}
data.settings=migrateGameSettings(data.settings,data.settingsRevision||0);data.settingsRevision=4;data.bests=data.bests&&typeof data.bests==='object'?data.bests:{};data.facts=data.facts&&typeof data.facts==='object'?data.facts:{};data.review=Array.isArray(data.review)?data.review:[];data.unlocked=Array.isArray(data.unlocked)?data.unlocked:['pearl'];data.bank=Number.isFinite(data.bank)?Math.max(0,data.bank):0;
let settings=data.settings,world,engine=null,mode='menu',activeModal=null,oldFocus=null,pendingStart=false,question=null,answer='',answerBusy=false,history=[],lastFrame=performance.now(),uiTime=0,tipTimer=0,toastTimer=0,saveFailed=false,hiddenPaused=false,runFacts=[],questionClock=null;
const tr=(message,values)=>t(message,values,settings.language),number=value=>value.toLocaleString(localeFor(settings.language)),answerText=value=>format(value,settings.language);
const audio=new MagicAudio();audio.enabled=settings.sound;
function save(){try{data.settings=settings;localStorage.setItem(STORAGE,JSON.stringify(data));}catch{if(!saveFailed){saveFailed=true;toast(tr("This browser cannot save your progress."));}}}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000);}
function tip(title,sub='',duration=4000){$('game-tip').replaceChildren(document.createTextNode(title));if(sub){const s=document.createElement('small');s.textContent=sub;$('game-tip').append(s);}$('game-tip').classList.add('visible');clearTimeout(tipTimer);tipTimer=setTimeout(()=>$('game-tip').classList.remove('visible'),duration);}
function showModal(id){if(!activeModal)oldFocus=document.activeElement;all('.modal').forEach(m=>m.hidden=true);activeModal=id;$(id).hidden=false;$('modal-backdrop').hidden=false;$('menu').inert=true;$('site-header').inert=true;$('hud').inert=true;requestAnimationFrame(()=>{const el=$(id).querySelector('button:not(:disabled):not([hidden])');el?.focus({preventScroll:true});});}
function hideModal(){all('.modal').forEach(m=>m.hidden=true);$('modal-backdrop').hidden=true;activeModal=null;$('menu').inert=false;$('site-header').inert=false;$('hud').inert=false;oldFocus?.focus?.({preventScroll:true});}
function selected(selector,key,value){all(selector).forEach(b=>{const on=b.dataset[key]===value;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});}
function choice(root,text,on,action,key,label=text){
 const b=document.createElement('button');b.type='button';b.textContent=text;b.className=on?'selected':'';b.dataset.choice=String(key);b.setAttribute('aria-label',label);b.setAttribute('aria-pressed',String(on));
 b.onclick=()=>{action();save();renderSettings();const replacement=[...$(root).children].find(el=>el.dataset.choice===String(key));replacement?.focus({preventScroll:true});};$(root).append(b);
}
function renderSettings(){
 renderPaceOptions();
 for(const id of ['group-chips','topic-chips','range-chips','table-chips','factor-chips'])$(id).replaceChildren();
 const preset=groupPreset(settings.group);
 for(let n=3;n<=8;n++)choice('group-chips',tr('Group {group}',{group:n}),settings.group===n,()=>{const p=groupPreset(n);settings={...settings,mode:'practice',group:n,topics:p.topics,range:p.range,tables:p.tables,factorMax:p.factorMax};},n);
 $('group-help').textContent=tr(preset.help);
 for(const topic of preset.topics)choice('topic-chips',tr(TOPICS[topic]),settings.topics.includes(topic),()=>{settings.topics=settings.topics.includes(topic)?settings.topics.filter(t=>t!==topic):[...settings.topics,topic];},topic);
 const numbers=settings.topics.some(t=>t==='plus'||t==='minus'),tables=settings.topics.some(t=>t==='tables'||t==='divide');
 $('number-settings').hidden=!numbers;$('table-settings').hidden=!tables;$('practice-settings').hidden=!numbers&&!tables;
 for(const n of [10,20,50,100,1000,10000])choice('range-chips',number(n),settings.range===n,()=>settings.range=n,n,tr('Numbers and answers below {limit}',{limit:number(n)}));
 $('custom-range').value=String(settings.range);$('custom-range').setAttribute('aria-invalid','false');$('range-error').hidden=true;
 for(let n=1;n<=10;n++)choice('table-chips',String(n),settings.tables.includes(n),()=>{settings.tables=settings.tables.includes(n)?settings.tables.filter(v=>v!==n):[...settings.tables,n].sort((a,b)=>a-b);},n,tr('Table of {table}',{table:n}));
 for(const n of [3,5,10])choice('factor-chips',tr('× 1 to {max}',{max:n}),settings.factorMax===n,()=>settings.factorMax=n,n);
 const table=settings.tables[settings.tables.length-1]||3;
 $('table-help').textContent=tr('For example {factor} × {table} = {answer}.',{factor:settings.factorMax,table,answer:settings.factorMax*table})+(settings.topics.includes('divide')?' '+tr('Division uses the same tables in reverse: {answer} ÷ {table} = {factor}.',{factor:settings.factorMax,table,answer:settings.factorMax*table}):'');
 $('practice-summary').textContent=practiceSummary(settings);
 const problem=practiceProblem(settings);$('practice-error').textContent=problem;$('practice-error').hidden=!problem;$('play-button').disabled=!!problem;
 renderTimerOptions();$('bank-count').textContent=data.bank;renderSound();
}
$('reset-practice').onclick=()=>{const p=groupPreset(settings.group);settings={...settings,topics:p.topics,range:p.range,tables:p.tables,factorMax:p.factorMax};save();renderSettings();};
$('custom-range').oninput=()=>{
 const value=Number($('custom-range').value),valid=validRange(value);
 $('custom-range').setAttribute('aria-invalid',String(!valid));$('range-error').hidden=valid;$('range-error').textContent=valid?'':tr("Choose a whole number from 2 to 10,000.");
 if(valid){settings.range=value;save();$('practice-summary').textContent=practiceSummary(settings);for(const b of $('range-chips').children){const on=Number(b.dataset.choice)===value;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));}}
 $('play-button').disabled=!valid||!!practiceProblem(settings);
};
function refreshLanguage(){
 applyLanguage(document,settings.language);$('language-button').textContent=settings.language.toUpperCase();$('decimal-button').textContent=decimalSeparator(settings.language);renderSettings();
}
function openLanguagePicker(){$('language-close').hidden=!data.languageChosen;showModal('language-modal');}
function chooseLanguage(language){if(!['nl','en'].includes(language))return;settings.language=language;data.languageChosen=true;save();refreshLanguage();hideModal();}
$('language-button').onclick=openLanguagePicker;
$('language-nl').onclick=()=>chooseLanguage('nl');$('language-en').onclick=()=>chooseLanguage('en');
$('language-close').onclick=()=>{if(data.languageChosen)hideModal();};
function renderPaceOptions(){
 $('pace-options').replaceChildren();
 for(const [pace,label,description] of [['easy','Easy','Original speed'],['normal','Normal','20% faster · default'],['hard','Hard','50% faster']]){
  const b=document.createElement('button'),name=document.createElement('b'),detail=document.createElement('small');
  b.type='button';b.dataset.pace=pace;b.className=settings.pace===pace?'selected':'';b.setAttribute('aria-pressed',String(settings.pace===pace));name.textContent=tr(label);detail.textContent=tr(description);b.append(name,detail);
  b.onclick=()=>{settings.pace=pace;save();renderPaceOptions();[...$('pace-options').children].find(el=>el.dataset.pace===pace)?.focus({preventScroll:true});};$('pace-options').append(b);
 }
}
function renderTimerOptions(){
 const root=$('timer-options');root.replaceChildren();
 for(const choice of MATH_TIMERS){const b=document.createElement('button'),label=document.createElement('b'),time=document.createElement('small');b.type='button';b.className=choice.seconds===settings.mathSeconds?'selected':'';b.setAttribute('aria-pressed',String(choice.seconds===settings.mathSeconds));b.setAttribute('aria-label',tr(choice.label)+' · '+timerLabel(choice.seconds,settings.language));label.textContent=tr(choice.label);time.textContent=timerLabel(choice.seconds,settings.language);b.append(label,time);b.onclick=()=>{settings.mathSeconds=choice.seconds;save();renderTimerOptions();};root.append(b);}
 $('timer-help').textContent=settings.mathSeconds?tr('{seconds} seconds per question. Out of time? Keep riding without a boost. A rescue question ends the ride.',{seconds:settings.mathSeconds}):tr('Take all the time you need. The race waits during each question.');
}
function renderSound(){$('sound-button').setAttribute('aria-pressed',String(settings.sound));$('sound-button').setAttribute('aria-label',settings.sound?tr("Turn sound off"):tr("Turn sound on"));}

$('sound-button').onclick=()=>{settings.sound=!settings.sound;audio.enabled=settings.sound;audio.unlock();if(settings.sound)audio.play('coin');save();renderSound();};
$('play-button').onclick=()=>{if(!data.languageChosen){openLanguagePicker();return;}if($('play-button').disabled||practiceProblem(settings))return;audio.unlock();if(!world)return;if(!data.tutorial){pendingStart=true;showModal('help-modal');}else startRun();};
$('help-button').onclick=()=>{pendingStart=false;showModal('help-modal');};
$('help-done').onclick=()=>{hideModal();if(pendingStart){data.tutorial=true;save();pendingStart=false;startRun();}};
all('.close-modal').forEach(b=>b.onclick=()=>{pendingStart=false;hideModal();});
document.querySelector('.brand').onclick=e=>{e.preventDefault();if(mode==='menu')window.scrollTo({top:0,behavior:'smooth'});};
function startRun(){if(!data.languageChosen){openLanguagePicker();return;}if(practiceProblem(settings))return;questionClock=null;hideModal();window.scrollTo(0,0);engine=new RunEngine(settings);mode='game';runFacts=[];world.reset();world.setCoat(COATS.find(c=>c.id===settings.coat).color);$('menu').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');document.body.classList.remove('boosting');$('game-tip').classList.remove('visible');updateHUD();processEvents();}
function home(){questionClock=null;hideModal();engine=null;mode='menu';$('menu').hidden=false;$('hud').hidden=true;$('countdown').hidden=true;document.body.classList.remove('playing','boosting');world.reset();world.addObstacle('cloud',-1,-12);world.addObstacle('arch',1,-25);renderSettings();}
$('pause-button').onclick=()=>{engine?.pause();processEvents();};
$('resume-button').onclick=()=>{hideModal();engine?.resume();processEvents();};
$('quit-button').onclick=()=>{hideModal();engine?.finish('stop');processEvents();};
$('again-button').onclick=startRun;$('home-button').onclick=home;
function nextQuestion(){const key=profileKey(settings);data.review.forEach(q=>{if(q.profile===key)q.wait--;});const idx=data.review.findIndex(q=>q.profile===key&&q.wait<=0);let q;if(idx>=0){q=localizeQuestion(data.review.splice(idx,1)[0].question,settings.language);}else{for(let i=0;i<10;i++){q=createQuestion(settings);if(!history.slice(-2).includes(q.key))break;}}history.push(q.key);if(history.length>8)history.shift();return q;}
function openQuestion(kind){
 question=nextQuestion();answer='';answerBusy=false;$('math-modal').classList.remove('success','answer-revealed');$('math-numpad').hidden=false;$('answer-button').hidden=false;$('math-skip').className='text-button';$('question').textContent=question.prompt;$('answer-display').textContent='?';
 $('math-feedback').textContent=tr(kind==='rescue'?'One correct answer and you can keep going.':'Which number belongs at the question mark?');$('math-visual').hidden=true;$('math-visual').replaceChildren();
 $('math-eyebrow').textContent=kind==='rescue'?tr('ANOTHER CHANCE · {used} OF 3',{used:engine.usedRescues+1}):tr('A LITTLE MATHS MAGIC');$('math-title').textContent=tr(kind==='rescue'?'Help your unicorn carry on.':'Cast a boost!');
 $('math-subtitle').textContent=settings.mathSeconds?tr('The world is waiting. You have {seconds} seconds for this question.',{seconds:settings.mathSeconds}):tr('The world is waiting. Take your time.');$('math-skip').textContent=tr(kind==='rescue'?'Finish this ride':'Look at this sum together');
 $('answer-button').disabled=false;$('math-skip').disabled=false;showModal('math-modal');document.body.classList.remove('boosting');questionClock=new QuestionClock(settings.mathSeconds,performance.now());if(document.hidden)questionClock.pause(performance.now());renderQuestionClock();
}
function renderQuestionClock(){
 const clock=questionClock,visible=!!clock?.limit;$('math-timer').hidden=!visible;if(!visible)return;
 const seconds=Math.max(0,Math.ceil(clock.remaining));$('math-timer-label').textContent=clock.expired?tr('Time is up'):tr(clock.paused?'Paused · {seconds} seconds':'{seconds} seconds left',{seconds});
 const percent=Math.max(0,clock.remaining/clock.limit*100);$('math-timer-fill').style.width=percent+'%';$('math-timer').querySelector('.timer-track').setAttribute('aria-valuenow',String(Math.ceil(percent)));$('math-timer').classList.toggle('almost-up',clock.remaining<=5&&!clock.expired);
}
function checkQuestionClock(now=performance.now()){if(activeModal!=='math-modal'||!questionClock||answerBusy)return false;const expiredNow=questionClock.update(now);if(expiredNow){engine.timeOut();processEvents();}renderQuestionClock();return expiredNow||questionClock.expired;}
function stopQuestionClock(){questionClock?.stop(questionClock.last);renderQuestionClock();}
function questionTimedOut(kind){answerBusy=true;$('answer-button').disabled=true;$('math-skip').disabled=true;recordQuestion(false,false);$('answer-display').textContent=answerText(question.answer);$('math-feedback').textContent=question.prompt+' = '+answerText(question.answer)+'. '+(kind==='rescue'?tr("Time is up. A new adventure is waiting for you."):tr("Time is up. Keep riding without a boost; we will practise this one again later."));renderQuestionClock();setTimeout(()=>{questionClock=null;hideModal();engine.completeTimeout();processEvents();if(document.hidden){engine.pause();processEvents();}},2400);}
function showWrongAnswer(){stopQuestionClock();answerBusy=true;$('answer-button').disabled=true;$('answer-button').hidden=true;$('math-numpad').hidden=true;$('math-skip').disabled=false;$('math-skip').className='primary-button';$('math-skip').textContent=tr("Keep riding the rainbow →");$('answer-display').textContent=answerText(question.answer);$('math-title').textContent=tr("Let’s keep practising.");$('math-feedback').textContent=question.prompt+' = '+answerText(question.answer)+'. '+tr('Remember this for next time. You will carry on without a boost.');$('math-modal').classList.add('answer-revealed');revealHint();$('math-skip').focus({preventScroll:true});}
function continueAfterWrong(){questionClock=null;hideModal();engine.completeWrong();processEvents();}
function inputDigit(d){
 if(activeModal!=='math-modal'||answerBusy||checkQuestionClock())return;
 const separator=decimalSeparator(settings.language);
 if(d==='back')answer=answer.slice(0,-1);else if(d===','||d==='.'){if(!/[.,]/.test(answer)&&answer.length)answer+=separator;}else if(answer.replace(/[.,]/g,'').length<6)answer=(answer==='0'?d:answer+d);
 $('answer-display').textContent=answer||'?';
}
all('[data-digit]').forEach(b=>b.onclick=()=>inputDigit(b.dataset.digit));
function recordQuestion(correct,independent){const key=question.key;const fact=data.facts[key]||{good:0,help:0,wrong:0,table:question.kind==='×'?question.b:null};if(correct){if(independent){fact.good++;data.totalCorrect++;runFacts.push(question.prompt);}else fact.help++;}else fact.wrong++;data.facts[key]=fact;if(!correct&&!data.review.some(q=>q.profile===profileKey(settings)&&q.question.key===key)){data.review.push({profile:profileKey(settings),question,wait:3});if(data.review.length>40)data.review.shift();}save();}
function revealHint(){const visual=$('math-visual');visual.replaceChildren();if(question.kind==='×'&&question.a<=5&&question.b<=5){for(let i=0;i<question.a;i++){const group=document.createElement('span');group.textContent='✦'.repeat(question.b);visual.append(group);}visual.hidden=false;}}
function submitAnswer(){if(activeModal!=='math-modal'||answerBusy||!answer||checkQuestionClock())return;audio.unlock();const correct=answerMatches(answer,question.answer);const independent=!engine.questionAssisted;recordQuestion(correct,independent);
 if(correct){stopQuestionClock();answerBusy=true;$('answer-button').disabled=true;$('math-skip').disabled=true;$('math-feedback').textContent=tr(independent?'Yes! {sum} = {answer}. You can do this!':'Good practice! {sum} = {answer}.',{sum:question.prompt,answer:answerText(question.answer)});$('math-modal').classList.add('success');audio.play('correct');setTimeout(()=>{hideModal();engine.answer(true);processEvents();},850);}
 else if(engine.mathKind==='rescue'){stopQuestionClock();answerBusy=true;$('answer-button').disabled=true;$('math-skip').disabled=true;$('math-feedback').textContent=question.prompt+' = '+answerText(question.answer)+'. '+tr('We will try again next time!');setTimeout(()=>{hideModal();engine.answer(false);processEvents();},1800);}
 else{engine.answer(false);processEvents();}
}
$('answer-button').onclick=submitAnswer;
$('math-skip').onclick=()=>{if(engine?.mode==='math-wrong'){continueAfterWrong();return;}if(answerBusy||checkQuestionClock())return;if(engine.mathKind==='rescue'){stopQuestionClock();hideModal();engine.skip();processEvents();return;}if(!engine.questionAssisted){engine.questionAssisted=true;recordQuestion(false,false);$('math-feedback').textContent=question.hint;revealHint();$('math-skip').textContent=tr("See the answer and keep riding");return;}stopQuestionClock();answerBusy=true;$('answer-button').disabled=true;$('math-skip').disabled=true;$('answer-display').textContent=answerText(question.answer);$('math-feedback').textContent=question.prompt+' = '+answerText(question.answer)+'. '+tr('We will practise that one again later.');setTimeout(()=>{hideModal();engine.skip();processEvents();},2000);};
function endRun(result){
 questionClock=null;document.body.classList.remove('boosting');$('countdown').hidden=true;$('game-tip').classList.remove('visible');clearTimeout(tipTimer);
 const key=profileKey(settings),previous=data.bests[key]||0,record=result.distance>previous;data.bests[key]=Math.max(previous,result.distance);data.bank+=result.stars;save();
 $('end-distance').textContent=number(result.distance);$('end-stars').textContent=result.stars;$('end-correct').textContent=result.independent;$('end-eyebrow').textContent=tr(record?'A NEW PERSONAL BEST':'WHAT AN ADVENTURE');$('end-title').textContent=tr(result.independent?'You sparkled!':'Lovely riding!');
 const reasons={timeout:'Your rescue time ran out. Your stars are saved; try again whenever you like.',quick:'That was soon after your rescue. This ride is over; your stars are still yours.',rescues:'You have used all three rescues. Time for a new adventure!',answer:'Tricky sums happen. You can always try again.',stop:'Your unicorn is taking a break. Your stars are saved.'};
 $('end-reason').textContent=tr(reasons[result.reason]);$('end-learning').textContent=runFacts.length?tr('Solved on your own: {sums}. A step forward!',{sums:[...new Set(runFacts)].slice(-3).join(' · ')}):tr('Every adventure helps you improve. Have another go whenever you like.');
 $('end-best-distance').textContent=number(data.bests[key]);$('end-best').textContent=profileLabel(settings)+' · '+tr({easy:'Easy',normal:'Normal',hard:'Hard'}[settings.pace])+' · '+timerLabel(settings.mathSeconds,settings.language)+' · '+tr('on this device');showModal('end-modal');audio.play('end');
}
function processEvents(){if(!engine)return;for(const e of engine.drain()){switch(e.type){
 case 'countdown':$('countdown').hidden=false;$('countdown').textContent=e.value;audio.play('countdown');break;
 case 'started':$('countdown').hidden=true;audio.play('start');if(engine.elapsed<1)tip(tr("Your unicorn runs by itself"),tr("Swipe ← → to change lanes. ↑ jump · ↓ duck"),5500);break;
 case 'move':world.move(e.delta);break;
 case 'obstacle':{const o=world.addObstacle(e.kind,e.lane,e.z,e.baseY||0);o.id=e.id;if(engine.elapsed<20&&!e.flightOnly){const messages={cloud:[tr("Cloud ahead!"),tr("Jump over it or choose another lane.")],arch:[tr("A fairy arch!"),tr("Duck under it or go around.")],dragon:[tr("A sleeping dragon"),tr("Choose a clear lane.")]};tip(...messages[e.kind],3300);}break;}
 case 'coin':{const c=world.addCoin(e.lane,e.z,e.y);c.id=e.id;break;}
 case 'platform':world.addPlatform(e);break;
 case 'heightRoute':tip(e.first?tr("Follow the rainbow ramp!"):tr("From cloud to dragon back"),e.first?tr("Ride up and collect stars above the track."):tr("Jump over the gap between the high paths!"),4500);break;
 case 'collected':{const c=world.coins.find(c=>c.id===e.id);if(c){world.scene.remove(c.group);world.coins=world.coins.filter(o=>o!==c);}audio.play('coin');break;}
 case 'clear':world.clearAhead(1000,e.keepSurface);break;
 case 'gate':world.addGate(e.z);tip(tr("A magic maths gate!"),tr("You will have time for a sum in a moment."),3500);break;
 case 'math':$('countdown').hidden=true;openQuestion(e.kind);break;
 case 'mathTimeout':questionTimedOut(e.kind);break;
 case 'answerRetry':$('math-feedback').textContent=tr('Another try! {hint}',{hint:question.hint});revealHint();answer='';$('answer-display').textContent='?';$('math-skip').textContent=tr("See the answer and keep riding");break;
 case 'wrongAnswer':showWrongAnswer();break;
 case 'duckTrail':tip(tr("Stars under the arch!"),tr("Duck ↓ to collect them."),1600);break;
 case 'boost':document.body.classList.add('boosting');audio.play('boost');tip(tr('Rainbow boost!')+' ✦',tr('+{reward} stars · Fly above the dragons and fairy arches!',{reward:e.reward}),3000);break;
 case 'landing':tip(tr("Landing gently…"),tr("A clear stretch of rainbow is waiting for you."),1800);break;
 case 'boostEnd':document.body.classList.remove('boosting');tip(tr("Safely landed!"),tr("You are steering again. On to the next gate!"),2000);break;
 case 'rescued':toast(tr('Here we go again! {count} rescues left.',{count:3-engine.usedRescues}));break;
 case 'skipped':tip(tr("Good practice!"),tr("We will try that sum again later."),2200);break;
 case 'jump':audio.play('jump');break;case 'duck':audio.play('duck');break;
 case 'paused':$('countdown').hidden=true;showModal('pause-modal');break;
 case 'end':endRun(e.result);break;
 }}}
function updateHUD(){if(!engine)return;$('distance').textContent=number(Math.floor(engine.distance));$('run-stars').textContent=engine.stars;$('lives').textContent='♡ '.repeat(3-engine.usedRescues)+'· '.repeat(engine.usedRescues);$('lives').setAttribute('aria-label',tr('{count} rescues left',{count:3-engine.usedRescues}));$('world-name').textContent=tr(world.worldName);$('height-label').hidden=engine.height<.7;$('height-label').textContent=engine.mode==='boost'?tr("✦ Magical flight"):engine.grounded?tr("☁ Above the rainbow"):tr("↑ Jump");const remaining=engine.nextGate-engine.elapsed;$('magic-fill').style.width=(engine.mode==='boost'?100:Math.max(0,Math.min(100,(1-remaining/35)*100)))+'%';$('magic-label').textContent=engine.mode==='boost'?tr("Rainbow boost!"):engine.lastRescue!==null&&engine.elapsed-engine.lastRescue<5?tr("Keep going after your rescue"):tr("Magic maths gate");}
function control(action){if(activeModal)return;engine?.action(action);processEvents();}
all('[data-control]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();control(b.dataset.control);}));
let pointer=null;
$('world').addEventListener('pointerdown',e=>{if(mode==='game'&&!activeModal){pointer={x:e.clientX,y:e.clientY,id:e.pointerId};$('world').setPointerCapture(e.pointerId);}});
$('world').addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.max(Math.abs(dx),Math.abs(dy))<22)return;control(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'duck':'jump');});
$('world').addEventListener('pointercancel',()=>pointer=null);
addEventListener('keydown',e=>{
 if(activeModal&&e.key==='Tab'){const focusable=[...$(activeModal).querySelectorAll('button:not([disabled])')].filter(b=>!b.hidden&&!b.closest('[hidden]'));const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}
 if(activeModal==='math-modal'){if(/^\d$/.test(e.key)){e.preventDefault();inputDigit(e.key);}else if(e.key===','||e.key==='.'){e.preventDefault();inputDigit(',');}else if(e.key==='Backspace'){e.preventDefault();inputDigit('back');}else if(e.key==='Enter'){e.preventDefault();if(engine?.mode==='math-wrong')continueAfterWrong();else submitAnswer();}return;}
 if(e.key==='Escape'){if(activeModal==='pause-modal'){$('resume-button').click();}else if(activeModal&&mode==='menu'&&(activeModal!=='language-modal'||data.languageChosen)){pendingStart=false;hideModal();}else if(!activeModal&&engine){engine.pause();processEvents();}return;}
 if(activeModal)return;
 const action={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'jump',' ':'jump',w:'jump',ArrowDown:'duck',s:'duck'}[e.key];if(action&&mode==='game'){e.preventDefault();if(!e.repeat)control(action);}
});
document.addEventListener('visibilitychange',()=>{const now=performance.now();if(document.hidden&&engine){if(activeModal==='math-modal'&&questionClock&&!answerBusy){if(questionClock.pause(now)){engine.timeOut();processEvents();}renderQuestionClock();}if(['run','boost','countdown'].includes(engine.mode)){engine.pause();processEvents();}hiddenPaused=true;}else{lastFrame=now;if(hiddenPaused&&engine&&['run','boost','countdown'].includes(engine.mode)){engine.pause();processEvents();}questionClock?.resume(now);hiddenPaused=false;renderQuestionClock();}});
function collection(){renderCollection();showModal('collection-modal');}
$('collection-button').onclick=collection;
function renderCollection(){
 $('collection-stars').textContent=data.bank;const root=$('coat-options');root.replaceChildren();
 for(const coat of COATS){
  const unlocked=data.unlocked.includes(coat.id),name=tr(coat.name),b=document.createElement('button');b.className='coat-option'+(settings.coat===coat.id?' selected':'');b.setAttribute('aria-label',tr(unlocked?'Choose {name}':'Unlock {name} for {cost} stars',{name,cost:coat.cost}));
  b.innerHTML='<span class="coat-swatch"></span><b></b><small></small>';b.querySelector('.coat-swatch').style.background=coat.color;b.querySelector('b').textContent=name;b.querySelector('small').textContent=settings.coat===coat.id?tr('Your unicorn'):unlocked?tr('Choose'):tr('{count} stars',{count:coat.cost});
  b.onclick=()=>{if(!unlocked){if(data.bank<coat.cost){toast(tr('{count} more stars for {name}.',{count:coat.cost-data.bank,name}));return;}data.bank-=coat.cost;data.unlocked.push(coat.id);}settings.coat=coat.id;world.setCoat(coat.color);save();renderCollection();$('bank-count').textContent=data.bank;audio.play('correct');};root.append(b);
 }
 $('progress-summary').textContent=data.totalCorrect?tr('{count} sums solved on your own. Each star below means 5 correct answers in that table.',{count:data.totalCorrect}):tr('Every sum is a step forward.');$('table-progress').replaceChildren();
 for(let n=1;n<=10;n++){const good=Object.values(data.facts).filter(f=>f.table===n).reduce((a,f)=>a+(f.good||0),0),s=document.createElement('span');s.textContent=n+' × '+(good>=5?'★'.repeat(Math.min(3,Math.floor(good/5))):'☆');s.className=good>=5?'progress-done':'';s.title=tr('{count} correct answers in table {table}',{count:good,table:n});$('table-progress').append(s);}
}
function frame(now){const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;if(!hiddenPaused){checkQuestionClock(now);if(engine){engine.step(dt);processEvents();}const state=engine?{mode:engine.mode,elapsed:engine.elapsed,x:engine.x,jump:engine.jump,height:engine.height,grounded:engine.grounded,speed:engine.speed,flightPose:engine.flightPose,flying:engine.mode==='boost'||engine.mode==='paused'&&engine.previousMode==='boost',duck:engine.duckTime>0,shield:engine.shield,lean:engine.lane*2.8-engine.x}:{mode:'menu'};world.update(dt,state);uiTime+=dt;if(uiTime>.12){updateHUD();uiTime=0;}}requestAnimationFrame(frame);}
function fatal(error){$('loading').hidden=true;$('error-panel').hidden=false;$('error-message').textContent=tr("Your browser could not open the 3D world. Try a recent version of Safari, Chrome or Edge with WebGL enabled.");console.error(error);}
try{refreshLanguage();save();world=new World($('world'));world.setCoat(COATS.find(c=>c.id===settings.coat).color);world.addObstacle('cloud',-1,-12);world.addObstacle('arch',1,-25);$('loading').hidden=true;if(!data.languageChosen)openLanguagePicker();requestAnimationFrame(frame);}catch(error){fatal(error);}
