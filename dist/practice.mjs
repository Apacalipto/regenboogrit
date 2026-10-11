export const TOPICS=Object.freeze({plus:'Plus',minus:'Min',tables:'Tafels',divide:'Delen',fraction:'Breuken',decimal:'Kommagetallen',percent:'Procenten'});
const BASIC=['plus','minus','tables','divide'];
const PRESETS={
 3:{topics:['plus','minus'],range:20,tables:[1,2,3,4,5],factorMax:5,help:'Kleine plus- en minsommen. Fijn om vertrouwen op te bouwen.'},
 4:{topics:['plus','minus','tables'],range:100,tables:[1,2,5,10],factorMax:5,help:'Plus en min, samen met de eerste tafels. Jij kiest hoe ver.'},
 5:{topics:BASIC,range:100,tables:[1,2,3,4,5],factorMax:5,help:'Begin groep 5: standaard kleine tafels tot 5 × 5. Jij kiest hoe ver.'},
 6:{topics:[...BASIC,'fraction'],range:1000,tables:[1,2,3,4,5,6,7,8,9,10],factorMax:10,help:'Verder met grotere getallen, alle tafels en eenvoudige breuken.'},
 7:{topics:[...BASIC,'fraction','decimal','percent'],range:1000,tables:[1,2,3,4,5,6,7,8,9,10],factorMax:10,help:'Een brede oefenmix, met kommagetallen en eenvoudige procenten.'},
 8:{topics:[...BASIC,'fraction','decimal','percent'],range:10000,tables:[1,2,3,4,5,6,7,8,9,10],factorMax:10,help:'Grotere sommen, breuken, kommagetallen en procenten. Pas gerust aan.'}
};
export function groupPreset(group=5){const p=PRESETS[group]||PRESETS[5];return {...p,topics:[...p.topics],tables:[...p.tables]};}
export const validRange=n=>Number.isInteger(n)&&n>=2&&n<=10000;
export function practiceProblem(s){if(!s.topics.length)return 'Kies minstens één soort som om te oefenen.';if(s.topics.some(t=>t==='tables'||t==='divide')&&!s.tables.length)return 'Kies minstens één tafel, of zet Tafels en Delen uit.';if(s.topics.some(t=>t==='plus'||t==='minus')&&!validRange(s.range))return 'Kies een heel getal van 2 tot en met 10.000.';return '';}
export function practiceKey(s){const topics=[...s.topics].sort().join('.');const number=s.topics.some(t=>t==='plus'||t==='minus')?'-under'+s.range:'';const tables=s.topics.some(t=>t==='tables'||t==='divide')?'-tables'+[...s.tables].sort((a,b)=>a-b).join('.')+'-factor'+s.factorMax:'';return 'practice-g'+s.group+'-'+topics+number+tables;}
export function practiceSummary(s){const parts=[];if(s.topics.includes('plus')||s.topics.includes('minus'))parts.push((s.topics.includes('plus')&&s.topics.includes('minus')?'Plus en min':s.topics.includes('plus')?'Plus':'Min')+' onder '+s.range.toLocaleString('nl-NL'));if(s.topics.includes('tables')||s.topics.includes('divide'))parts.push((s.topics.includes('tables')?'Tafel':'Delen met tafel')+(s.tables.length===1?' ':'s ')+s.tables.join(', ')+' · × 1–'+s.factorMax+(s.topics.includes('divide')&&s.topics.includes('tables')?' · ook omgekeerd delen':''));for(const t of ['fraction','decimal','percent'])if(s.topics.includes(t))parts.push(TOPICS[t]);return parts.join(' / ');}

const pick=(a,r)=>a[Math.floor(r()*a.length)],int=(a,b,r)=>a+Math.floor(r()*(b-a+1));
const fmt=n=>String(n).replace('.',',');
function sum(a,b,op,topic){const answer=Math.round((op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:a/b)*100)/100;const hint=op==='×'?a+' groepjes van '+b+'. Tel de groepjes bij elkaar.':op==='+'?'Begin bij '+fmt(a)+' en tel er '+fmt(b)+' bij.':op==='−'?'Begin bij '+a+' en haal er '+b+' af.':'Hoe vaak past '+b+' in '+a+'?';return {prompt:fmt(a)+' '+op+' '+fmt(b),answer,hint,key:a+op+b,kind:op,topic,a,b};}
export function createPracticeQuestion(s,r=Math.random){
 const problem=practiceProblem(s);if(problem)throw new RangeError(problem);
 const topic=pick(s.topics,r);
 if(topic==='plus'||topic==='minus'){const a=int(0,s.range-1,r);return topic==='minus'?sum(a,int(0,a,r),'−',topic):sum(a,int(0,s.range-1-a,r),'+',topic);}
 if(topic==='tables'||topic==='divide'){const a=int(1,s.factorMax,r),b=pick(s.tables,r);return topic==='tables'?sum(a,b,'×',topic):sum(a*b,b,'÷',topic);}
 if(topic==='decimal'){const max=s.group===8?1000:100,a=int(1,max-1,r),b=int(1,max-a,r);return sum(a/10,b/10,'+',topic);}
 if(topic==='fraction'){const denominator=pick([2,4],r),numerator=s.group>=7&&denominator===4&&r()<.5?3:1;const amount=denominator*int(2,s.group>=7?20:12,r);return {prompt:(numerator===3?'¾':denominator===2?'½':'¼')+' van '+amount,answer:amount/denominator*numerator,hint:'Deel '+amount+' door '+denominator+'. Neem '+numerator+' van die delen.',key:'fraction-'+numerator+'-'+denominator+'-'+amount,kind:'fraction',topic};}
 const percent=pick(s.group>=8?[10,20,25,50,75]:[10,25,50],r),amount=pick(s.group>=8?[40,80,120,160,200]:[20,40,60,80,100,200],r);
 return {prompt:percent+'% van '+amount,answer:amount*percent/100,hint:'10% is '+amount/10+'. 25% is '+amount/4+'. Gebruik een handig tussenstapje.',key:'percent-'+percent+'-'+amount,kind:'percent',topic};
}
