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
/* (V38.76) and every follow-up list window (the Ministry's and the office's), with realistic records — a moved position kept in
   «موقع النقطة» showed «[object Object]» inside a window the page tour never opened. Each row's point must open the map. */
const LW = JSON.parse(w.eval(`(function(){
  STATE.sites.forEach(function(x, i){ if (i % 7) return; STATE.recs[x.id] = STATE.recs[x.id] || { id:x.id, access:'تم الوصول', review:i % 2 ? 'approved' : 'pending', by:'فني', at:Date.now() - i * 1000, loc:i % 3 ? ['تحت كوبري'] : [{ lat:21.4, lng:39.9 }, 'مدخل نفق'], chals:i % 5 ? [] : ['لا يوجد سطح تثبيت'], chal_note:i % 4 ? '' : 'تحت الكوبري', photos:['site'] }; });
  statBump();
  var bad = /\\bundefined\\b|\\bNaN\\b|\\[object Object\\]|\\bInfinity\\b|\\bnull\\b/, found = [], thrown = [], noFly = [], n = 0;
  ['admin', 'viewer'].forEach(function(role){
    ROLE = role; STATE.meta.role = role; CUR = 'mfu'; try { render(1); } catch (e0){}
    if (typeof obsLocLists === 'function') obsLocLists();
    Object.keys(MFU.lists || {}).concat(Object.keys(typeof SV_LISTS === 'object' ? SV_LISTS : {})).filter(function(k, i, a){ return a.indexOf(k) === i; }).forEach(function(k){
      try { SV_POP = k; SV_VIEW = 'list'; SV_ZF = ''; SV_SUB = ''; render(1); n++;
        var pop = document.querySelector('.svpop'); if (!pop) return; var tx = pop.textContent, m = bad.exec(tx);
        if (m) found.push(role + ' · ' + k + ' → «' + tx.slice(Math.max(0, m.index - 30), m.index + 18).replace(/\\s+/g, ' ') + '»');
        var r0 = pop.querySelector('tbody tr'); if (r0 && !r0.querySelector('[data-fly]') && /NSK-/.test(r0.textContent)) noFly.push(role + ' · ' + k);
      } catch (e){ thrown.push(role + ' · ' + k + ' → ' + e.message); }
    });
    SV_POP = '';
  });
  return JSON.stringify({ n:n, found:found, thrown:thrown, noFly:noFly });
})()`));
/* (V38.76) one number everywhere: visited, installed and «with obstacles» computed by every screen that shows them (the
   dashboard stages, the survey stats, the Ministry follow-up, the hall screen, the obstacles tab, the daily roll-up) must agree
   — the owner's standing rule: a report with a wrong figure is a top-priority defect */
const NUM = JSON.parse(w.eval(`(function(){
  var inst = STATE.sites.filter(function(x){ var r = STATE.recs[x.id]; return r && Array.isArray(r.chals) && r.chals.length; }).slice(0, 3);
  inst.forEach(function(x){ STATE.inss[x.id] = { id:x.id, status:'مركب', by:'منفِّذ', at:Date.now(), parts:{ rdr4c:1 } }; });
  statBump(); ROLE = 'admin'; STATE.meta.role = 'admin';
  var st = stageCounts0(), sv = svStats0(), kp = mfuKpis(), k = kioskObsTally().T, ro = rollupToday();
  var mt = 0; mtSites().forEach(function(x){ if (mtGrpOf(x.id)) mt++; });
  var obs0 = 0, cln0 = 0; STATE.sites.forEach(function(x){ var r = STATE.recs[x.id]; if (svObstacle(r)) obs0++; if (svClean(r)) cln0++; });
  /* two metrics with two names: «بعوائق / بدون عوائق» (the single definition V33.0 — hall screen, summary lists) and
     «معوّقات» (the follow-up's impediments: excludes installed points, reads clearly written challenges) */
  return JSON.stringify({ visited:[st.vis, sv.O.sv, kp.sv, ro.surveyed, k.ok + k.ob], installed:[st.ins, kp.ins, ro.installed],
    withObs:[k.ob, obs0], clean:[k.ok, cln0], impediments:[mfuObstacles().length, kp.obs, mt], inst:inst.length });
})()`));
let fails = 0;
const T = (c, msg) => { if (c) console.log('  \u2713 ' + msg); else { fails++; console.log('  \u2717 ' + msg); console.log('::error title=فحصٌ ساقط::' + msg.replace(/[\r\n]+/g, ' ').slice(0, 300)); } };
console.log('\n══ جولةُ الزائر — Firebase قائم، كلُّ دورٍ وكلُّ شاشةٍ وشريحة (' + R.n + ') ══');
T(R.n > 300, 'الجولةُ مرّت على ' + R.n + ' شاشةً وشريحةً بكلِّ الأدوار');
T(!R.thrown.length, 'لا شاشةَ ترمي خطأً' + (R.thrown.length ? ' — ' + R.thrown.slice(0, 5).join(' | ') : ''));
T(!R.found.length, 'ولا «undefined / NaN / null» على الشاشة' + (R.found.length ? ' — ' + R.found.slice(0, 5).join(' | ') : ''));
console.log('\n══ رقمٌ واحدٌ في كلِّ الشاشات ══');
const same = (a) => a.every(v => v === a[0]);
T(same(NUM.visited), 'تمت الزيارة: اللوحة · إحصاء المسح · متابعة الوزارة · الحصيلة اليومية · شاشة القاعة = ' + NUM.visited.join(' · '));
T(same(NUM.installed) && NUM.installed[0] >= NUM.inst, 'تم التركيب: اللوحة · متابعة الوزارة · الحصيلة اليومية = ' + NUM.installed.join(' · '));
/* (V38.76) one definition: the hall screen, the summary lists, the follow-up and its obstacles tab count the same points */
T(same(NUM.withObs.concat(NUM.impediments)) && same(NUM.clean), 'بعوائق: شاشة القاعة · قائمة الملخّص · متابعة الوزارة · مؤشراتها · شريحة العوائق = ' + NUM.withObs.concat(NUM.impediments).join(' · ') + ' — وبدون عوائق ' + NUM.clean.join(' · '));
console.log('\n══ نوافذُ القوائم — الإدارة والوزارة (' + LW.n + ') ══');
T(LW.n > 50, 'فُتحت ' + LW.n + ' نافذةَ قائمةٍ بدوري الإدارة والوزارة');
T(!LW.thrown.length, 'لا نافذةَ ترمي خطأً' + (LW.thrown.length ? ' — ' + LW.thrown.slice(0, 4).join(' | ') : ''));
T(!LW.found.length, 'ولا «[object Object] / undefined / NaN» في أيِّ نافذة' + (LW.found.length ? ' — ' + LW.found.slice(0, 4).join(' | ') : ''));
T(!LW.noFly.length, 'ونقطةُ كلِّ صفٍّ رابطٌ يفتحها على الخريطة' + (LW.noFly.length ? ' — ' + LW.noFly.slice(0, 4).join(' | ') : ''));
if (fails){ console.log('جولةُ الزائر فشلت \u2717 (' + fails + ')'); process.exit(1); }
console.log('جولةُ الزائر نظيفة — كلُّ الأدوار، وFirebase قائم \u2705'); process.exit(0);
