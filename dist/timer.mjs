import {t} from './i18n.mjs';
export const MATH_TIMERS=Object.freeze([{seconds:0,label:'Practice'},{seconds:60,label:'Relaxed'},{seconds:30,label:'Quick'},{seconds:15,label:'Challenge'}]);
export function normalizeMathSeconds(value){return [0,15,30,60].includes(value)?value:0;}
export function timerLabel(value,language='nl'){const seconds=normalizeMathSeconds(value);return seconds?t('{seconds} seconds',{seconds},language):t('Unlimited',{},language);}
export class QuestionClock{
 constructor(seconds,now=0){this.limit=normalizeMathSeconds(seconds);this.remaining=this.limit||null;this.remainingMs=this.limit?this.limit*1000:null;this.deadline=now+this.limit*1000;this.last=now;this.paused=false;this.stopped=false;this.expired=false;}
 update(now){if(this.stopped||this.paused||!this.limit)return false;this.last=Math.max(this.last,now);this.remainingMs=Math.max(0,this.deadline-this.last);this.remaining=this.remainingMs/1000;if(this.remaining<=0){this.expired=true;this.stopped=true;return true;}return false;}
 pause(now){const expiredNow=this.update(now);this.paused=true;return expiredNow;}
 resume(now){this.last=now;this.deadline=now+(this.remainingMs||0);this.paused=false;}
 stop(now){const expiredNow=this.update(now);this.stopped=true;return expiredNow;}
}
