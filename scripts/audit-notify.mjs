/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الإشعارات — node scripts/audit-notify.mjs
   ───────────────────────────────────────────────────────────────────────────
   كان الإشعارُ يُخزَّن على جهاز من فعل الفعلَ وحده: الفنيُّ لا يعرف أنه أُسند
   إليه، والمهندسُ لا يعرف أن زيارةً تمّت — إلا بالبحث. صار ما وُجِّه إلى غيري
   يُكتَب في «notifs» باسمه، ويُنصِت كلُّ جهازٍ إلى ما باسمه فيصله حيًّا.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html', 'utf8');
const rules = readFileSync('firestore.rules', 'utf8');
async function device(name, role){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
  await new Promise(r => setTimeout(r, 900));
  const real = { liveSmall:w.liveSmall };
  w.FB.signIn = () => Promise.resolve({ ok:true, role, name }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
  { const uE = d.getElementById('lgU'), pE = d.getElementById('lgP'); if (uE) uE.value = 'x'; if (pE) pE.value = 'TestPass1234'; }
  const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await new Promise(r => setTimeout(r, 400));
  w.ROLE = role; w.STATE.meta.role = role; w.STATE.meta.name = name; w.STATE.meta.uid = 'u-' + role; w.STATE.queue = [];
  w.__real = real;
  return { w, d };
}
let bad = 0; const T = (c, n, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? ' — ' + x : '')); };
/* ١ · المهندسُ يُسند: إشعارٌ للفنيِّ يُكتَب في القاعدة، وإشعارٌ لنفسه لا */
const A = await device('مهندس', 'engineer');
A.w.notifPush('إسناد', 'IR-1 · S1', { to:'فني', site:'S1', lv:'مهم' });
A.w.notifPush('ملاحظة', 'لنفسي', { to:'مهندس', lv:'عادي' });
const q = A.w.STATE.queue.filter(x => x.kind === 'notifs');
T(q.length === 1 && q[0].v.to === 'فني' && q[0].v.by === 'مهندس', 'الموجَّهُ إلى غيري يُكتَب في «notifs» باسمي — ولا يُكتَب ما لنفسي', q.length + ' — ' + JSON.stringify(q[0] && q[0].v).slice(0, 80));
T(A.w.FB.colOf('notifs') === 'notifs', 'والنوعُ له مجموعتُه لا «متفرقات»');
/* ٢ · جهازُ الفنيِّ يُنصِت إلى ما باسمه ويُخزّنه مرةً */
const B = await device('فني', 'tech');
const log = [];
B.w.FB.ready = true; B.w.FB.db = { collection(col){ const qq = { col, wheres:[], where(f, op, v){ this.wheres.push([f, op, v]); return this; }, limit(){ return this; },
  onSnapshot(fn){ log.push({ col, wheres:this.wheres.slice(), fn }); return () => {}; }, doc(){ return { onSnapshot(){ return () => {}; }, get:() => Promise.resolve({ exists:false }) }; } }; return qq; } };
/* liveSmall الحقيقية — كانت صوريةً في الإقلاع */
B.w.__real.liveSmall();
const ln = log.find(x => x.col === 'notifs');
T(!!ln && ln.wheres.some(x => x[0] === 'to' && x[1] === '==' && x[2] === 'فني') && ln.wheres.some(x => x[0] === '_at' && x[1] === '>'), 'الفنيُّ يُنصِت إلى ما باسمه — آخرَ أيام لا الكلّ', ln && JSON.stringify(ln.wheres));
if (ln){
  const v = { id:'n1', kind:'إسناد', text:'IR-1 · S1', to:'فني', by:'مهندس', lv:'مهم', at:1, _at:1 };
  ln.fn({ metadata:{ fromCache:false }, docChanges:() => [{ type:'added', doc:{ id:'n1', data:() => v } }] });
  ln.fn({ metadata:{ fromCache:false }, docChanges:() => [{ type:'modified', doc:{ id:'n1', data:() => v } }] });
  const S = B.w.STATE.notifs || [];
  T(S.filter(x => x.id === 'n1').length === 1 && S[0].read === false, 'ويصل الإشعارُ مرةً واحدةً غيرَ مقروء', String(S.length));
  ln.fn({ metadata:{ fromCache:false }, docChanges:() => [{ type:'added', doc:{ id:'n2', data:() => ({ id:'n2', to:'فني', by:'فني', text:'x' }) } }] });
  T(!(B.w.STATE.notifs || []).some(x => x.id === 'n2'), 'وما كتبتُه أنا لا يعود إليّ');
}
/* ٣ · القاعدةُ: تُكتَب باسمك وتُقرأ ما وُجِّه إليك */
T(/match \/notifs\/\{id\}/.test(rules) && /resource\.data\.to == uDoc\(\)\.name/.test(rules) && /request\.resource\.data\.by == uDoc\(\)\.name/.test(rules) && /allow update, delete: if false/.test(rules),
  'القاعدة: تُكتَب باسم الكاتب، وتُقرأ لمن وُجِّهت إليه، ولا تُمحى');
T(/"collectionGroup": "notifs"/.test(readFileSync('firestore.indexes.json', 'utf8')), 'والفهرسُ المركّب (to, _at) مُعلَن');
console.log(bad ? '\nجردُ الإشعارات فشل ✗ (' + bad + ')' : '\nالإشعارُ يصل صاحبَه لا من كتبه ✅');
process.exit(bad ? 1 : 0);
