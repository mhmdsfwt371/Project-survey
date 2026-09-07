/* ═══════════════════════════════════════════════════════════════════════════
   جردُ مصفوفة الصلاحيات — node scripts/audit-perms.mjs
   ───────────────────────────────────────────────────────────────────────────
   المصفوفةُ وثيقةٌ تكتبها الشاشةُ وتقرؤها القاعدةُ مع كلِّ طلب. الخطرُ أن يفترقا:
   مجموعةٌ تمرّ بالمصفوفة في القاعدة ولا تظهر في الشاشة، أو افتراضيٌّ في الشاشة
   يخالف افتراضيَّ القاعدة فيُعرَض ✓ وتُردُّ الكتابة. فهذا يقرأ الملفين حرفًا
   بحرف: كلُّ نداء pm(col, op, dflt) في القاعدة له خليةٌ في PM_COLS بالافتراضيِّ
   نفسِه، وكلُّ خليةٍ في الشاشة لها نداءٌ في القاعدة. ثم يفتح الشاشةَ مهندسًا
   ويقلب خليةً ويحفظ ويقرأ ما خرج إلى الطابور: وثيقةٌ واحدةٌ settings/perms
   بالشكل الذي تقرؤه القاعدة — وnull لإعادة الافتراضي.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html', 'utf8');
const js = /<script>([\s\S]*)<\/script>/.exec(html)[1];
const rulesRaw = readFileSync('firestore.rules', 'utf8');
const rules = rulesRaw.replace(/\/\/[^\n]*/g, '');
let bad = 0; const T = (c, n, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? ' — ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ═══ ١ · القاعدة: نداءاتُ pm ═══ */
const calls = [];
for (const m of rules.matchAll(/pm\('(\w+)', '(\w)', /g)){
  let i = m.index + m[0].length, depth = 0, buf = '';
  for (; i < rules.length; i++){
    const ch = rules[i];
    if (ch === '(') depth++;
    if (ch === ')'){ if (depth === 0) break; depth--; }
    buf += ch;
  }
  calls.push({ col:m[1], op:m[2], dflt:buf.trim() });
}
T(calls.length >= 90, 'القاعدةُ تمرّ بالمصفوفة', calls.length + ' نداءً');
const DMAP = { 'ok()':'ok', 'canW()':'canW', 'mgr()':'mgr', 'ok() && myRank() >= 90':'r90', 'mgr() || viewer()':'mgrOrViewer' };
const unk = calls.filter(c => !DMAP[c.dflt]);
T(!unk.length, 'وكلُّ افتراضيٍّ في القاعدة من الخمسة المعروفة', unk.map(c => c.col + ':' + c.dflt).join(' · '));
T(/function pm\(col, op, dflt\)/.test(rules) && /isBoss\(\) \|\| \(ok\(\) &&/.test(rules) && /\.get\(op, null\) == null \? dflt/.test(rules),
  'pm: صاحبُ المشروع فوقها، والفعّالُ وحده، وnull = الافتراضي');
T(/match \/settings\/perms\s*\{ allow read: if ok\(\); allow write: if ok\(\) && myRank\(\) >= 90; \}/.test(rules), 'المصفوفةُ يكتبها المهندسُ فما فوق ويقرؤها كلُّ فعّال');
const evBlock = (rules.match(/match \/events\/\{id\}[\s\S]{0,900}?\n\s*\}/) || [''])[0];
T(/allow delete: if false/.test(evBlock), 'وسجلُّ الأحداث لا يُحذَف مهما قالت');
T(/!viewer\(\) && pm\('phones', 'r', canW\(\)\)/.test(rules), 'والهواتفُ لا تراها الوزارةُ مهما قالت');
T(!/allow read, write: if true/.test(rules), 'ولا قاعدةَ مفتوحة');

/* ═══ ٢ · الشاشة: PM_COLS مرآةُ القاعدة ═══ */
const pcSrc = (/var PM_COLS = \[([\s\S]*?)\n\];/.exec(js) || [''])[1];
const cols = [...pcSrc.matchAll(/\['(\w+)','([^']+)',\s*\{([^}]*)\}\]/g)].map(m => ({
  col:m[1], label:m[2], ops:Object.fromEntries([...m[3].matchAll(/(\w):'(\w+)'/g)].map(x => [x[1], x[2]])) }));
T(cols.length >= 30, 'الشاشةُ تعرض المجموعات', cols.length + ' مجموعة');
const miss = [], wrong = [];
calls.forEach(c => {
  const spec = cols.find(x => x.col === c.col);
  if (!spec || !spec.ops[c.op]) miss.push(c.col + '.' + c.op);
  else if (spec.ops[c.op] !== DMAP[c.dflt]) wrong.push(c.col + '.' + c.op + ': شاشة ' + spec.ops[c.op] + ' ≠ قاعدة ' + DMAP[c.dflt]);
});
T(!miss.length, 'كلُّ نداءٍ في القاعدة له خليةٌ في الشاشة', miss.join(' · '));
T(!wrong.length, 'وبالافتراضيِّ نفسِه', wrong.join(' · '));
const extra = [];
cols.forEach(x => Object.keys(x.ops).forEach(op => { if (!calls.find(c => c.col === x.col && c.op === op)) extra.push(x.col + '.' + op); }));
T(!extra.length, 'ولا خليةَ في الشاشة بلا نداءٍ في القاعدة', extra.join(' · '));
/* المجموعاتُ الثابتةُ خارج المصفوفة — بقرار */
const fixed = ['provision', 'pending', 'att', 'presence', 'ghcfg', 'misc'];
T(fixed.every(f => new RegExp('match /' + f + '/').test(rules) && !new RegExp("pm\\('" + f + "'").test(rules)), 'الستُّ الثابتةُ خارج المصفوفة', fixed.join(','));
T(/PM_CAP = \{ edit:\['recs','w'\]/.test(js) && /var pmk = PM_CAP\[k\]/.test(js), 'may تقرأ المصفوفة للقدرات المقابلة');
T(/\['perms','صلاحيات القاعدة'/.test(js) && /perms:'perms'/.test(js), 'التبويبُ مسجَّلٌ بقدرته');

/* ═══ ٣ · تشغيل ═══ */
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس الجرد' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
w.STATE.meta.uid = 'u-eng';
d.getElementById('lgU').value = 'eng.a'; d.getElementById('lgP').value = 'rightpass12';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(2200);
T(w.ROLE === 'engineer' && w.may('perms'), 'المهندسُ يملك ضبطَ المصفوفة');
/* افتراضياتُ الشاشة = افتراضياتُ القاعدة لعيّناتٍ معروفة */
T(w.pmGet('purchases', 'r', 'buyer') === false && w.pmGet('purchases', 'r', 'engineer') === true, 'الافتراضي: المشترياتُ للإدارة');
T(w.pmGet('recs', 'w', 'tech') === true && w.pmGet('recs', 'a', 'tech') === false && w.pmGet('recs', 'a', 'admin') === true, 'الفنيُّ يكتب ولا يعتمد');
T(w.pmGet('phones', 'r', 'viewer') === false && w.pmLocked('phones', 'r', 'viewer'), 'هواتفُ الوزارة مقفولة');
T(w.pmGet('bonus', 'w', 'supervisor') === false && w.pmGet('bonus', 'w', 'exec') === true, 'نقاطُ الزيادة من رتبة ٩٠');
/* الشاشة */
d.querySelector('.nav a[data-p="users"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
w.PTAB.users = 'perms'; w.render(1);
let c = d.getElementById('content');
T(/صلاحيات القاعدة/.test(c.textContent) && c.querySelectorAll('[data-pmrole]').length === Object.keys(w.ROLES).length, 'التبويبُ يُرسَم بشرائح كلِّ الأدوار');
c.querySelector('[data-pmrole="buyer"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
c = d.getElementById('content');
const cell = c.querySelector('[data-pmk="purchases|r"]');
T(!!cell && /✗/.test(cell.textContent), 'خليةُ المشتريات للمشتريات ✗ افتراضيًّا');
cell.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
c = d.getElementById('content');
T(/✓ \*/.test(c.querySelector('[data-pmk="purchases|r"]').textContent) && w.pmDirty(), 'ضغطةٌ تقلبها إلى ✓ وتُعلَّم معدَّلة');
w.STATE.queue = []; w.CORE.flush = () => Promise.resolve(0);
c.querySelector('[data-pmsave]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
const q = w.STATE.queue.filter(x => x.kind === 'cfg' && x.id === 'perms');
T(q.length === 1 && q[0].v && q[0].v.m && q[0].v.m.purchases.buyer.r === true && q[0].v.v === 1, 'الحفظُ يكتب settings/perms بالشكل الذي تقرؤه القاعدة', JSON.stringify((q[0] || {}).v || {}).slice(0, 120));
T(w.FB.colOf('cfg') === 'settings', 'ونوعُ cfg يذهب إلى settings');
T(!w.pmDirty() && w.CFG.perms.m.purchases.buyer.r === true, 'وبعد الحفظ لا مسودّةَ والقيمةُ ثابتة');
/* may تتبع المصفوفة */
w.ROLE = 'buyer'; T(w.may('money') === true, 'may(money) للمشتريات صارت ✓ من المصفوفة'); w.ROLE = 'engineer';
/* الإعادةُ تكتب null */
w.render(1); c = d.getElementById('content');
c.querySelector('[data-pmrole="buyer"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
c = d.getElementById('content');
c.querySelector('[data-pmk="purchases|r"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
c = d.getElementById('content');
w.STATE.queue = [];
c.querySelector('[data-pmsave]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
const q2 = w.STATE.queue.filter(x => x.kind === 'cfg' && x.id === 'perms');
T(q2.length === 1 && q2[0].v.m.purchases.buyer.r === null && q2[0].v.v === 2, 'وإعادتُها تكتب null (= افتراضيُّ القاعدة) وترفع النسخة');
w.ROLE = 'buyer'; T(w.may('money') === !!w.ROLES.buyer.can.money, 'فتعود may(money) إلى افتراضيِّ الدور في التطبيق'); w.ROLE = 'engineer';
/* الثابتُ لا يُقلَب */
w.render(1); c = d.getElementById('content');
c.querySelector('[data-pmrole="viewer"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
c = d.getElementById('content');
T(!c.querySelector('[data-pmk="phones|r"]') && /🔒/.test(c.textContent), 'هواتفُ الوزارة تُعرَض مقفولةً بلا زرّ');
/* المشرفُ لا يرى التبويب */
w.ROLE = 'supervisor'; T(!w.seesPage('perms'), 'المشرفُ لا يرى التبويب'); w.ROLE = 'admin'; T(w.seesPage('perms'), 'ومديرُ المشروع يراه'); w.ROLE = 'engineer';
console.log(bad ? '\nجردُ مصفوفة الصلاحيات فشل ✗ (' + bad + ')' : '\nالشاشةُ تكتب ما تقرؤه القاعدة — والافتراضياتُ مرآةٌ ✅');
process.exit(bad ? 1 : 0);
