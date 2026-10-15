/* ═══ (V37.97) جردُ الأداء — كم يستغرق رسمُ كلِّ شاشة ═══
   (V37.98) يُقاس بناءُ الشاشة (الجافاسكربت) وحجمُها لا تحليلُ المحاكي للصفحة: المحاكي يحلّل الخاناتِ
   أبطأَ من المتصفح بأضعاف، فكان «إشعارُ الشركات» يبدو نصفَ ثانيةٍ وبناؤه ٢٧ مللي. الزمنُ الحقيقيُّ
   على كلِّ جوالٍ يُقاس في التطبيق نفسِه (صحة النظام ← الاستهلاك والأداء — V17.98)، وهذا الجردُ
   يحرس من التراجع وحدَه.
   التطبيقُ يعيد رسمَ الشاشة كلَّها مع كلِّ تغيير، والسجلُّ ١٨٠٧ نقاط. لا قياسَ كان يقول متى
   تثقل شاشة. يُرسَم كلُّ بندٍ في القائمة ثلاثَ مرّات ويُؤخَذ الوسيط، ويُقارَن بخطِّ أساسٍ في
   docs/perf-baseline.json: لا شاشةَ تتجاوز ضعفَ زمنها المسجَّل (+٥٠ مللي)، ولا شاشةَ جديدةَ فوق
   ثانيةٍ في المحاكي. الجوالُ الضعيفُ أبطأُ بأربعة إلى ستة أضعاف — فالأرقامُ للمقارنة لا للمطلق.
   PERF_WRITE=1 يكتب خطَّ الأساس من القياس الحاضر. */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync('index.html', 'utf8');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };

/* معايرة: عملٌ ثابتٌ يُقاس قبل الرسم — فالآلةُ الأبطأ (السحابة) تُعطى ميزانيةً أكبر بالنسبة نفسِها */
const calib = () => { const a = performance.now(); let s = ''; const o = {}; for (let i = 0; i < 120000; i++){ s += i.toString(36); o['k' + (i % 997)] = s.length; } JSON.stringify(o); return performance.now() - a; };
let CAL = Math.min(calib(), calib(), calib());   /* الأدنى لا الوسيط: الضجيجُ يزيد الزمنَ ولا ينقصه */
const t0 = Date.now();
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://example.test/', virtualConsole:new VirtualConsole() });
const w = dom.window; w.fetch = () => Promise.reject(new Error('offline'));
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 800));
const d = w.document;
/* الدخولُ كما في جرد الأزرار: هويةٌ تُثبَت فيُفتَح الهيكلُ بقائمته */
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'جرد الأداء' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0);
{ const uE = d.getElementById('lgU'), pE = d.getElementById('lgP'); if (uE) uE.value = 'perf.test'; if (pE) pE.value = 'TestPass1234'; }
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 400));
const boot = Date.now() - t0;
const ids = [...new Set([...d.querySelectorAll('#nav [data-p]')].map(a => a.getAttribute('data-p'))
  .flatMap(id => (w.TABS && w.TABS[id]) ? w.TABS[id].map(x => x[0]) : [id]))].filter(id => id !== 'map');
const ms = {}, kb = {};
for (const id of ids){
  const runs = [];
  const tb = Object.keys(w.TABS || {}).find(k => (w.TABS[k] || []).some(x => x[0] === id));
  if (tb){ w.PTAB = w.PTAB || {}; w.PTAB[tb] = id; w.CUR = tb; } else w.CUR = id;
  const P = (w.PAGE && w.PAGE[w.CUR]) || (w.FIELD_PAGES && w.FIELD_PAGES[w.CUR]);
  if (!P || typeof P.body !== 'function') continue;
  let out = '';
  for (let k = 0; k < 3; k++){
    const a = performance.now();
    try { w.DB.open(); out = String(P.body() || ''); } catch (e){ out = ''; } finally { try { w.DB.memoReset(); } catch (e2){} }
    runs.push(performance.now() - a);
  }
  runs.sort((x, y) => x - y); ms[id] = Math.round(runs[1]); kb[id] = Math.round(out.length / 1024);
}
const top = Object.keys(ms).sort((a, b) => ms[b] - ms[a]);
console.log('\nالإقلاعُ في المحاكي: ' + boot + ' مللي · الشاشاتُ: ' + ids.length);
console.log('الأثقلُ بناءً (مللي): ' + top.slice(0, 8).map(id => id + ' ' + ms[id]).join(' · '));
const big = Object.keys(kb).sort((a, b) => kb[b] - kb[a]);
console.log('الأكبرُ حجمًا (ك.ب): ' + big.slice(0, 6).map(id => id + ' ' + kb[id]).join(' · '));

const BASE = 'docs/perf-baseline.json';
if (process.env.PERF_WRITE === '1' || !existsSync(BASE)){
  writeFileSync(BASE, JSON.stringify({ note:'زمنُ رسم كلِّ شاشةٍ في المحاكي (وسيطُ ثلاث) — يُحدَّث بـ PERF_WRITE=1 حين يُقصَد التغيير', at:new Date().toISOString().slice(0, 10), cal:Math.round(CAL), ms, kb }, null, 1) + '\n');
  console.log('كُتب خطُّ الأساس: ' + BASE);
}
CAL = Math.min(CAL, calib(), calib());   /* ويُعاد القياسُ بعد الرسم — فحِملٌ عابرٌ في أوّله لا يُضخِّم الميزانية */
const BJ = JSON.parse(readFileSync(BASE, 'utf8')), B = BJ.ms || {};
const k = Math.max(1, CAL / (BJ.cal || CAL));   /* آلةٌ أبطأ من آلة خطِّ الأساس تُعطى بقدرها — ولا تُضيَّق على الأسرع */
console.log('المعايرة: ' + Math.round(CAL) + ' مللي (خطُّ الأساس ' + (BJ.cal || '—') + ') · المعامل ' + k.toFixed(2));
const over = top.filter(id => B[id] != null ? ms[id] > (B[id] * 2 + 20) * k : ms[id] > 500 * k);
const KB = BJ.kb || {}, fat = big.filter(id => KB[id] != null ? kb[id] > KB[id] * 1.5 + 20 : kb[id] > 400);
T(!fat.length, 'لا شاشةَ تضخّم حجمُها فوق مرةٍ ونصفٍ من المسجَّل' + (fat.length ? ' — ' + fat.map(id => id + ' ' + kb[id] + '/' + (KB[id] == null ? 'جديدة' : KB[id])).join(' · ') : ''));
T(!over.length, 'لا شاشةَ تجاوزت ضعفَ زمنها المسجَّل' + (over.length ? ' — ' + over.map(id => id + ' ' + ms[id] + '/' + (B[id] == null ? 'جديدة' : B[id])).join(' · ') : ''));
T(ms[top[0]] < 1000 * k, 'وأثقلُ بناءٍ دون ثانيةٍ في المحاكي: ' + top[0] + ' ' + ms[top[0]]);
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
console.log(fails.length ? 'جردُ الأداء فشل ✗' : 'جردُ الأداء نظيف ✅');
process.exit(fails.length ? 1 : 0);
