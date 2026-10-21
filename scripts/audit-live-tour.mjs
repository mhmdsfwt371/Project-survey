/* ============================================================================
   FILE    : scripts/audit-live-tour.mjs
   PURPOSE : (V38.66) The tour a visitor takes, as on a phone: Firebase up (FB.ready = true, the database answering),
             the deferred part loaded, then every page and every tab for every role — nothing may throw and no raw
             «undefined / NaN / null / [object Object] / Infinity» may reach the screen. The other audits run with Firebase
             asleep; the owner's «green point does not respond» (V38.64) lived only with it up.
   ========================================================================== */
import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { appHtml } from './lib/src.mjs';

const vc = new VirtualConsole();
const dom = new JSDOM(await appHtml(), { runScripts:'dangerously', url:'https://x.test/', pretendToBeVisual:true, virtualConsole:vc });
const w = dom.window, d = w.document;
w.fetch = () => Promise.reject(new Error('net')); w.confirm = () => true; w.prompt = () => ''; w.toast = () => {};
await new Promise(r => setTimeout(r, 1800));
const sc = d.createElement('script'); sc.textContent = readFileSync('app-office.js', 'utf8'); d.body.appendChild(sc);
await new Promise(r => setTimeout(r, 400));
const R = JSON.parse(w.eval(`(function(){
  var C = { doc:function(){ return { get:function(){ return Promise.resolve({ exists:false }); }, set:function(){ return Promise.resolve(); }, update:function(){ return Promise.resolve(); } }; }, where:function(){ return C; }, orderBy:function(){ return C; }, limit:function(){ return C; }, get:function(){ return Promise.resolve({ size:0, forEach:function(){}, docs:[] }); }, onSnapshot:function(){ return function(){}; } };
  FB.ready = true; FB.db = { collection:function(){ return C; }, batch:function(){ return { set:function(){}, commit:function(){ return Promise.resolve(); } }; } };
  var bad = /\\bundefined\\b|\\bNaN\\b|\\[object Object\\]|\\bInfinity\\b|\\bnull\\b/, found = [], thrown = [], n = 0;
  Object.keys(ROLES).forEach(function(role){
    ROLE = role; STATE.meta.role = role; STATE.meta.name = 'جولة ' + role;
    Object.keys(PAGE).forEach(function(pid){
      if (!seesPage(pid)) return;
      var tabs = (TABS[pid] || []).filter(function(tb){ var f = tb[4] && TAB_SEE[tb[4]]; return f ? f(pid) : seesRaw(tb[0]); }).map(function(tb){ return tb[0]; });
      (tabs.length ? tabs : ['']).forEach(function(tb){
        n++;
        try { CUR = pid; if (tb) PTAB[pid] = tb; render(1); var el = document.getElementById('content'), tx = el ? el.textContent : '', m = bad.exec(tx);
          if (m) found.push(role + ' · ' + pid + (tb ? ':' + tb : '') + ' → «' + tx.slice(Math.max(0, m.index - 40), m.index + 20).replace(/\\s+/g, ' ') + '»');
        } catch (e){ thrown.push(role + ' · ' + pid + (tb ? ':' + tb : '') + ' → ' + e.message); }
      });
    });
  });
  return JSON.stringify({ n:n, found:found, thrown:thrown });
})()`));
let fails = 0;
const T = (c, msg) => { if (c) console.log('  \u2713 ' + msg); else { fails++; console.log('  \u2717 ' + msg); console.log('::error title=فحصٌ ساقط::' + msg.replace(/[\r\n]+/g, ' ').slice(0, 300)); } };
console.log('\n══ جولةُ الزائر — Firebase قائم، كلُّ دورٍ وكلُّ شاشةٍ وشريحة (' + R.n + ') ══');
T(R.n > 300, 'الجولةُ مرّت على ' + R.n + ' شاشةً وشريحةً بكلِّ الأدوار');
T(!R.thrown.length, 'لا شاشةَ ترمي خطأً' + (R.thrown.length ? ' — ' + R.thrown.slice(0, 5).join(' | ') : ''));
T(!R.found.length, 'ولا «undefined / NaN / null» على الشاشة' + (R.found.length ? ' — ' + R.found.slice(0, 5).join(' | ') : ''));
if (fails){ console.log('جولةُ الزائر فشلت \u2717 (' + fails + ')'); process.exit(1); }
console.log('جولةُ الزائر نظيفة — كلُّ الأدوار، وFirebase قائم \u2705'); process.exit(0);
