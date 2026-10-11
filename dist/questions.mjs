import {t,formatNumber} from './i18n.mjs';
// Store language-independent maths so saved review questions follow the current language.
export function localizeQuestion(question,language='nl'){
 const q={...question},tr=(key,values)=>t(key,values,language);
 if(Number.isFinite(q.a)&&Number.isFinite(q.b)){
  const a=formatNumber(q.a,language),b=formatNumber(q.b,language);
  q.prompt=a+' '+q.kind+' '+b;
  const hints={'×':'{a} groups of {b}. Add the groups together.','+':'Start at {a} and add {b}.','−':'Start at {a} and take away {b}.','÷':'How many times does {b} fit into {a}?'};
  q.hint=tr(hints[q.kind],{a,b});return q;
 }
 // Older saved questions encoded fraction/percentage operands only in their stable key.
 if(q.kind==='fraction'){
  if(!q.amount){const parts=q.key.split('-').map(Number);if(q.key.startsWith('fraction3-')){q.numerator=3;q.denominator=4;q.amount=parts[1];}else if(parts.length===3){q.numerator=1;q.amount=parts[1];q.denominator=parts[2];}else{q.numerator=parts[1];q.denominator=parts[2];q.amount=parts[3];}}
  const fraction=q.numerator===3?'¾':q.denominator===2?'½':'¼';
  q.prompt=tr('{fraction} of {amount}',{fraction,amount:q.amount});q.hint=tr('Divide {amount} by {denominator}. Take {numerator} of those parts.',q);return q;
 }
 if(q.kind==='percent'){
  if(!q.amount){const parts=q.key.split('-');q.percent=Number(parts[1]);q.amount=Number(parts[2]);}
  q.prompt=tr('{percent}% of {amount}',q);q.hint=tr('10% is {tenth}. 25% is {quarter}. Use a helpful step in between.',{tenth:formatNumber(q.amount/10,language),quarter:formatNumber(q.amount/4,language)});return q;
 }
 return q;
}
export function mathQuestion(a,b,kind,extra={}){const answer=kind==='+'?a+b:kind==='−'?a-b:kind==='×'?a*b:a/b;return {a,b,kind,answer:Math.round(answer*100)/100,key:a+kind+b,...extra};}
export function fractionQuestion(amount,denominator,numerator=1){return {amount,denominator,numerator,answer:amount/denominator*numerator,key:'fraction-'+numerator+'-'+denominator+'-'+amount,kind:'fraction',topic:'fraction'};}
export function percentQuestion(amount,percent){return {amount,percent,answer:amount*percent/100,key:'percent-'+percent+'-'+amount,kind:'percent',topic:'percent'};}
