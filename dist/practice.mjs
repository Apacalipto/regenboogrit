import {t,localeFor} from './i18n.mjs';
import {mathQuestion,fractionQuestion,percentQuestion,localizeQuestion} from './questions.mjs';
export const TOPICS=Object.freeze({plus:"Addition",minus:"Subtraction",tables:"Times tables",divide:"Division",fraction:"Fractions",decimal:"Decimals",percent:"Percentages"});
const BASIC=['plus','minus','tables','divide'];
const PRESETS={
 3:{topics:['plus','minus'],range:20,tables:[1,2,3,4,5],factorMax:5,help:"Small addition and subtraction sums. Build your confidence."},
 4:{topics:['plus','minus','tables'],range:100,tables:[1,2,5,10],factorMax:5,help:"Addition, subtraction and your first times tables. You choose how far."},
 5:{topics:BASIC,range:100,tables:[1,2,3,4,5],factorMax:5,help:"Early group 5: small tables up to 5 × 5 by default. You choose how far."},
 6:{topics:[...BASIC,'fraction'],range:1000,tables:[1,2,3,4,5,6,7,8,9,10],factorMax:10,help:"Explore larger numbers, all times tables and simple fractions."},
 7:{topics:[...BASIC,'fraction','decimal','percent'],range:1000,tables:[1,2,3,4,5,6,7,8,9,10],factorMax:10,help:"A varied mix, with decimals and simple percentages."},
 8:{topics:[...BASIC,'fraction','decimal','percent'],range:10000,tables:[1,2,3,4,5,6,7,8,9,10],factorMax:10,help:"Larger sums, fractions, decimals and percentages. Adjust as you like."}
};
export function groupPreset(group=5){const p=PRESETS[group]||PRESETS[5];return {...p,topics:[...p.topics],tables:[...p.tables]};}
export const validRange=n=>Number.isInteger(n)&&n>=2&&n<=10000;
export function practiceProblem(s){if(!s.topics.length)return t('Choose at least one question type to practise.',{},s.language);if(s.topics.some(t=>t==='tables'||t==='divide')&&!s.tables.length)return t('Choose at least one table, or turn off Times tables and Division.',{},s.language);if(s.topics.some(t=>t==='plus'||t==='minus')&&!validRange(s.range))return t('Choose a whole number from 2 to 10,000.',{},s.language);return '';}
export function practiceKey(s){const topics=[...s.topics].sort().join('.');const number=s.topics.some(t=>t==='plus'||t==='minus')?'-under'+s.range:'';const tables=s.topics.some(t=>t==='tables'||t==='divide')?'-tables'+[...s.tables].sort((a,b)=>a-b).join('.')+'-factor'+s.factorMax:'';return 'practice-g'+s.group+'-'+topics+number+tables;}
export function practiceSummary(s){
 const tr=(key,values)=>t(key,values,s.language),parts=[];
 if(s.topics.includes('plus')||s.topics.includes('minus'))parts.push(tr('{topics} below {limit}',{topics:tr(s.topics.includes('plus')&&s.topics.includes('minus')?'Addition and subtraction':s.topics.includes('plus')?'Addition':'Subtraction'),limit:s.range.toLocaleString(localeFor(s.language))}));
 if(s.topics.includes('tables')||s.topics.includes('divide')){
  const label=s.topics.includes('tables')?(s.tables.length===1?'Table {tables}':'Tables {tables}'):(s.tables.length===1?'Division using table {tables}':'Division using tables {tables}');
  parts.push(tr(label,{tables:s.tables.join(', ')})+' · × 1–'+s.factorMax+(s.topics.includes('divide')&&s.topics.includes('tables')?' · '+tr('also inverse division'):''));
 }
 for(const topic of ['fraction','decimal','percent'])if(s.topics.includes(topic))parts.push(tr(TOPICS[topic]));
 return parts.join(' / ');
}

const pick=(a,r)=>a[Math.floor(r()*a.length)],int=(a,b,r)=>a+Math.floor(r()*(b-a+1));
const sum=(a,b,op,topic)=>mathQuestion(a,b,op,{topic});
export function createPracticeQuestion(s,r=Math.random){return localizeQuestion(generatePracticeQuestion(s,r),s.language);}
function generatePracticeQuestion(s,r){
 const problem=practiceProblem(s);if(problem)throw new RangeError(problem);
 const topic=pick(s.topics,r);
 if(topic==='plus'||topic==='minus'){const a=int(0,s.range-1,r);return topic==='minus'?sum(a,int(0,a,r),'−',topic):sum(a,int(0,s.range-1-a,r),'+',topic);}
 if(topic==='tables'||topic==='divide'){const a=int(1,s.factorMax,r),b=pick(s.tables,r);return topic==='tables'?sum(a,b,'×',topic):sum(a*b,b,'÷',topic);}
 if(topic==='decimal'){const max=s.group===8?1000:100,a=int(1,max-1,r),b=int(1,max-a,r);return sum(a/10,b/10,'+',topic);}
 if(topic==='fraction'){const denominator=pick([2,4],r),numerator=s.group>=7&&denominator===4&&r()<.5?3:1;const amount=denominator*int(2,s.group>=7?20:12,r);return fractionQuestion(amount,denominator,numerator);}
 const percent=pick(s.group>=8?[10,20,25,50,75]:[10,25,50],r),amount=pick(s.group>=8?[40,80,120,160,200]:[20,40,60,80,100,200],r);
 return percentQuestion(amount,percent);
}
