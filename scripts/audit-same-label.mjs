/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الاسم الواحد — node scripts/audit-same-label.mjs (V39.0)
   ───────────────────────────────────────────────────────────────────────────
   طلبُ المالك: «اتأكّد إن أرقام التحديات في كلِّ الصفحات واحدة، وأرقام المسح واحدة، وهكذا». البذرةُ نفسُها
   التي يبني عليها جردُ الأرقام (أدناه منسوخةٌ منه)، ثم تُفتح كلُّ شاشةٍ وكلُّ شريحةٍ بأدوار المكتب والإدارة
   العليا والوزارة، ويُقرأ كلُّ رقمٍ في بطاقةٍ باسمه: الاسمُ الواحدُ رقمٌ واحدٌ في كلِّ شاشة.
   ───────────────────────────────────────────────────────────────────────────
   (the seed below is copied from:) جردُ الأرقام — node scripts/audit-numbers.mjs
   ───────────────────────────────────────────────────────────────────────────
   شكا المالكُ أن أرقامَ التقارير تخرج غلطًا. هذا الجردُ يزرع بياناتٍ بحجم الموسم بحقيقةٍ معلومة، ثم يقارن
   كلَّ رقمٍ يعرضه النظامُ — المعوقاتُ وجهاتُها، والشركاتُ، والمهامُّ، والأيامُ بيوم مكة، وأوراقُ التصدير —
   بالرقم المحسوب مباشرةً من البيانات بحلقةٍ مستقلة. أيُّ فرقٍ يسقط هنا قبل أن تراه الوزارة.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';
import { appHtml } from './lib/src.mjs';   /* (V38.39) the whole app in production order — index.html is now the core only */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
class TD { decode(u){ return Buffer.from(Array.from(u)).toString('utf8'); } }
const dom = new JSDOM((await appHtml()), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole(), beforeParse(win){ win.TextEncoder = TextEncoder; win.TextDecoder = TD; } });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {}; w.CORE.set = () => {};

/* ── بذرةٌ بحقيقةٍ معلومة ── */
const S = w.STATE.sites, now = Date.now(), DAY = 864e5;
const CH = ['لا يوجد سطح تثبيت', 'المدخل غير واضح — لم يُستدل عليه', 'العارضة الحديدية ناقصة أو غير مكتملة', 'المدخل مشترك مع مخيم آخر', 'أخرى'];
const names = ['عمار حسين', 'خالد بندر', 'فني ١', 'فني ٢', 'مشرف أ'];
const truth = { recs:0, done:0, approved:0, revisit:0, notReached:0, ins:0, obst:0, obstNR:0, catInst:0, co:{}, coAll:0, openTasks:0, byTo:{}, today:0, yesterday:0, twoChal:0 };
const mkDay = ms => new Date(ms + 10800000).toISOString().slice(0, 10);   /* يومُ مكة — مستقلٌّ عن التطبيق */
S.forEach((x, k) => {
  const installed = k % 10 < 6 && k % 12 !== 0;
  if (k % 10 < 9){
    const chals = k % 3 === 0 ? [] : (k % 7 === 0 ? [CH[k % CH.length], CH[(k + 1) % CH.length]] : [CH[k % CH.length]]);
    const access = k % 15 === 0 ? 'منع دخول' : 'تم الوصول';
    const review = k % 4 === 0 ? 'approved' : (k % 11 === 0 ? 'revisit' : 'pending');
    const at = k % 5 === 0 ? now - 2 * 3600000 : (k % 5 === 1 ? now - DAY : now - (2 + (k % 20)) * DAY);
    w.STATE.recs[x.id] = { id:x.id, by:names[k % 5], at, mount:'عارضة', power:'متوفر', chals, note:'', photos:['site'], access, review };
    truth.recs++;
    if (access === 'تم الوصول' && review !== 'revisit') truth.done++;
    if (review === 'approved' && access === 'تم الوصول') truth.approved++;
    if (review === 'revisit') truth.revisit++;
    if (mkDay(at) === mkDay(now)) truth.today++; else if (mkDay(at) === mkDay(now - DAY)) truth.yesterday++;
    if (!installed){
      /* (V38.76) the single definition (owner-approved): a returned visit stays «تحتاج زيارة أخرى» — as the hall screen and the
         obstacles tab counted it — so the follow-up's impediments count it too */
      /* (V38.78) corridors and Jamarat: their challenge is «موقع النقطة» alone — the chosen chips seeded here do not count */
      const chE = (x.type === 'ممر' || x.type === 'جسر') ? [] : chals;
      const cats = chE.slice(); if (access !== 'تم الوصول') cats.push('تعذّر الوصول'); else if (review === 'revisit' && !chE.length) cats.push('تحتاج زيارة أخرى');
      if (cats.length){ truth.obst++; truth.catInst += cats.length; if (chE.length >= 2) truth.twoChal++; }
      if (access !== 'تم الوصول') truth.notReached++;
    }
  }
  if (k % 10 < 6){ w.STATE.inss[x.id] = { id:x.id, status:installed ? 'مُركّب' : 'مسودّة', by:names[k % 5], at:now - (k % 30) * DAY, parts:{}, serials:{}, photos:[] }; if (installed) truth.ins++; }
  if (k % 3 === 0){ const st = k % 5 === 0 ? 'معتمد' : 'مسند', to = names[k % 5]; w.STATE.tasks['tk-' + k] = { id:'tk-' + k, site:x.id, kind:k % 2 ? 'install' : 'survey', to, status:st, at:now - (k % 20) * DAY }; if (st !== 'معتمد'){ truth.openTasks++; truth.byTo[to] = (truth.byTo[to] || 0) + 1; } }
  if (x.co){ truth.co[x.co] = (truth.co[x.co] || 0) + 1; truth.coAll++; }
});
w.SITE_IX = null; w.SITE_TOK = null; w.TK_IX = null; w.statBump(); w.render(1); await wait(50);
/* (V39.1) the follow-up tabs' «full details» folds draw only once opened — the audit reads them opened */
['التفاصيل الكاملة', 'التفاصيل الكاملة وجهات المعالجة', 'تفاصيل ساعة بساعة والشهور'].forEach(k => { (w.mtDetails.open = w.mtDetails.open || {})[k] = 1; });
console.log('بذرة:', JSON.stringify({ recs:truth.recs, obst:truth.obst, ins:truth.ins, openTasks:truth.openTasks }));

/* ── every number card on every screen, by its label ── */
const AR = '٠١٢٣٤٥٦٧٨٩';
const num = x => { const s = String(x || '').replace(/[٠-٩]/g, c => AR.indexOf(c)).replace(/[٬,\s]/g, ''); const m = /-?\d+/.exec(s); return m ? +m[0] : null; };
const seen = {};   /* label → { value → [screens] } */
const errs = [];
for (const role of ['admin', 'exec', 'viewer']){
  w.ROLE = role; w.STATE.meta.role = role;
  for (const pid of Object.keys(w.PAGE)){
    if (!w.seesPage(pid)) continue;
    const tabs = (w.TABS[pid] || []).filter(tb => { const f = tb[4] && w.TAB_SEE[tb[4]]; return f ? f(pid) : w.seesRaw(tb[0]); }).map(tb => tb[0]);
    for (const tb of (tabs.length ? tabs : [''])){
      const scr = pid + (tb ? ':' + tb : '');
      try { w.CUR = pid; if (tb) w.PTAB[pid] = tb; w.render(1); } catch (e){ errs.push(scr + ' → ' + e.message); continue; }
      const c = d.getElementById('content') || d.body;
      const take = (k, v) => { if (!k || !v) return; const l = k.textContent.replace(/[›\s]+$/g, '').replace(/\s+/g, ' ').trim(), n = num(v.textContent); if (n === null) return;
        const o = seen[l] = seen[l] || {}; (o[n] = o[n] || []).push(role + '·' + scr); };
      c.querySelectorAll('.stat').forEach(el => take(el.querySelector('.k'), el.querySelector('.v')));
      c.querySelectorAll('.mfu-kpi').forEach(el => take(el.querySelector('.mfu-kpi-l'), el.querySelector('.mfu-kpi-v')));
    }
  }
}
console.log('\n══ ١ · كلُّ شاشةٍ تُرسَم ══');
T(!errs.length, 'كلُّ شاشةٍ وشريحةٍ بالأدوار الثلاثة تُرسَم بلا خطأ' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
console.log('\n══ ٢ · الاسمُ الواحدُ رقمٌ واحد ══');
/* the names the owner reads across screens. Screens whose card is scoped on purpose (one person's work, one request queue, the
   selection layer) keep their own number and are named here, so a new screen with the same name is held to it. */
const SCOPED = /·(mywork|req|sel|forms|ev|exec:diary|plan:chg)(:|$)/;
const MUST = ['تمت الزيارة', 'تحتاج زيارة أخرى', 'أعادها المهندس', 'مُركّب', 'المعوقات القائمة', 'إجمالي المعوقات', 'بانتظار اعتمادك', 'تنتظر الاعتماد'];
for (const l of MUST){
  const o = seen[l]; if (!o){ T(false, '«' + l + '» لا تظهر في أيِّ شاشة — الجردُ يحتاج تحديثًا'); continue; }
  const vals = Object.keys(o).filter(v => o[v].some(s => !SCOPED.test(s)));
  T(vals.length === 1, '«' + l + '» رقمٌ واحدٌ في ' + Object.values(o).flat().filter(s => !SCOPED.test(s)).length + ' بطاقة' + (vals.length > 1 ? ' — ' + vals.map(v => v + ' في ' + o[v].filter(s => !SCOPED.test(s)).slice(0, 3).join('، ')).join(' | ') : ''));
}
/* the same quantity under the owner's names in different screens */
const one = (labels, why) => { const vs = new Set(); labels.forEach(l => Object.keys(seen[l] || {}).forEach(v => { if ((seen[l][v] || []).some(s => !SCOPED.test(s))) vs.add(v); })); T(vs.size === 1, why + ' — ' + [...vs].join(' / ')); };
one(['المعوقات القائمة', 'إجمالي المعوقات'], 'المعوقاتُ في متابعة الوزارة وشريحة المعوقات رقمٌ واحد (وتحدياتُ الميدان هي الشريحةُ نفسُها — جردُ التحدي)');
one(['بانتظار اعتمادك', 'تنتظر الاعتماد', 'زيارةٌ تنتظر اعتمادَها أولًا'], 'وما ينتظر الاعتمادَ في الاعتمادات والملخّص والحلول رقمٌ واحد');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ الاسم الواحد نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
