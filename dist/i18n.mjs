import dutch from './locales/nl.mjs';
export const LANGUAGES=Object.freeze(['nl','en']);
export const localeFor=language=>language==='en'?'en-GB':'nl-NL';
export const decimalSeparator=language=>language==='en'?'.':',';
export const formatNumber=(number,language='nl')=>String(number).replace('.',decimalSeparator(language));
export function t(message,values={},language='nl'){
 const template=language==='en'?message:(dutch[message]??message);
 return template.replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??'{'+key+'}'));
}
export function applyLanguage(document,language){
 document.documentElement.lang=language;
 for(const element of document.querySelectorAll('[data-i18n]'))element.textContent=t(element.dataset.i18n,{},language);
 for(const element of document.querySelectorAll('[data-i18n-aria]'))element.setAttribute('aria-label',t(element.dataset.i18nAria,{},language));
 for(const element of document.querySelectorAll('[data-i18n-content]'))element.setAttribute('content',t(element.dataset.i18nContent,{},language));
}
