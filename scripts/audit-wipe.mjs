/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التصفير ونسخ الأجهزة — node scripts/audit-wipe.mjs
   ───────────────────────────────────────────────────────────────────────────
   «صفّر الآن» كتب أحدَ عشرَ أمرَ حذفٍ رُفضت كلُّها وعُزلت: ستةٌ باسم نوعٍ لا
   يعرفه الطابور (`events` والطابورُ يعرف `evlog`) فذهبت إلى «متفرقات»
   المقفولة، وخمسٌ للقطات اليومية والقاعدةُ تمنع حذفَها — فلا شيءَ صُفِّر على
   السحابة، وعادت السجلاتُ مع أوّل سحب، وامتلأت شاشةُ المزامنة برفضٍ نُسب
   إلى الحساب. وشريحةُ «نسخ الأجهزة» كانت جدولًا محفورًا من عهد V14 يقول
   إن صاحبَ المشروع على V14.0 وهو على أحدث نسخة، والرأسُ يكتب «آخر مزامنة
   ٠٢:٥١» ثابتةً عند كلِّ رسم.
   فهذا يمسك: بندَ تصفيرٍ بلا مجموعةٍ أو بلا حذفٍ في القاعدة، ورقمَ نسخةٍ
   حرفيًّا غيرَ الحالية، ووقتًا حرفيًّا في الرأس، وجدولَ أجهزةٍ لا يُبنى من
   القاعدة — ثم يصفّر فعلًا في متصفّحٍ صوريٍّ ويعدّ ما خرج إلى الطابور.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const html = readFileSync('index.html', 'utf8');
const js = /<script>([\s\S]*)<\/script>/.exec(html)[1];
const rules = readFileSync('firestore.rules', 'utf8');
let bad = 0; const T = (c, n, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (x ? ' — ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ═══ ١ · ساكن: كلُّ بندِ تصفيرٍ له مجموعةٌ في الطابور وحذفٌ في القاعدة ═══ */
const cur = (/نسخة\s*(?:<\/[a-z]+>\s*)?(V\d+\.\d+)/.exec(html) || [])[1];
T(!!cur, 'رقمُ النسخة يُقرأ من الرأس', cur);
const wk = (/var WIPE_KEYS = \[([\s\S]*?)\];/.exec(js) || [])[1] || '';
const keys = [...wk.matchAll(/\['(\w+)','([^']+)',\s*(null|'(\w+)')\]/g)].map(m => ({ st:m[1], label:m[2], kind:m[4] || null }));
T(keys.length >= 14, 'بنودُ التصفير تُقرأ', keys.length + ' بندًا');
const colMap = (/colOf: function\(kind\)\{[\s\S]*?\}\[kind\]/.exec(js) || [''])[0];
const colOf = k => (new RegExp('\\b' + k + "\\s*:\\s*'(\\w+)'").exec(colMap) || [])[1];
const noCol = keys.filter(k => k.kind && !colOf(k.kind));
T(!noCol.length, 'كلُّ بندٍ يُحذَف من السحابة له مجموعةٌ في colOf', noCol.map(k => k.st + '→' + k.kind).join(' · '));
/* قاعدةُ الحذف: تُقرأ كتلةُ المجموعة وتُفحَص أن الحذفَ ليس `false` */
function delRule(col){
  const m = new RegExp('match /' + col + '/\\{\\w+\\}\\s*\\{([\\s\\S]*?)(?=\\n\\s*match /|\\n\\s*\\}\\s*\\n\\s*\\}|$)').exec(rules);
  if (!m) return null;
  const body = m[1].replace(/\/\/[^\n]*/g, '');
  const allows = [...body.matchAll(/allow ([^:]+):\s*if\s*([^;]+);/g)];
  const d = allows.filter(a => /\b(delete|write)\b/.test(a[1])).map(a => a[2].trim());
  return d.length ? d : ['(لا قاعدةَ حذف)'];
}
const noDel = keys.filter(k => k.kind).map(k => [k, delRule(colOf(k.kind))])
  .filter(([k, d]) => !d || d.some(x => /^false$/.test(x)) || d[0] === '(لا قاعدةَ حذف)');
T(!noDel.length, 'وكلُّ مجموعةٍ تُصفَّر تقبل الحذفَ في القاعدة', noDel.map(([k, d]) => colOf(k.kind) + ':' + (d || 'بلا كتلة')).join(' · '));
const localOnly = keys.filter(k => !k.kind).map(k => k.st);
T(localOnly.join(',') === 'events,notifs', 'ما يُفرَغ من الجهاز فقط: الأحداثُ والإشعارات', localOnly.join(','));
const evBlock = (rules.match(/match \/events\/\{id\}[\s\S]{0,700}?\n\s*\}/) || [''])[0];
T(/allow delete: if false/.test(evBlock), 'وسجلُّ الأحداث يبقى إلحاقيًّا لا يُحذَف');
const wg = (/function wipeGo\(\)\{[\s\S]*?\n\}/.exec(js) || [''])[0];
T(/STATE\.evlog = \{\};/.test(wg) && /STATE\.poison = \[\];/.test(wg), 'التصفيرُ يُفرِغ مرآةَ الأحداث والمعزولَ القديم');
T(/CORE\.dirty\(d\[0\], d\[1\], null\)/.test(wg) && /dels\.push\(\[k\[2\], id\]\)/.test(wg), 'وأمرُ الحذف يُقيَّد باسم النوع في الطابور لا في الحالة');

/* ═══ ٢ · ساكن: لا رقمَ نسخةٍ حرفيًّا غيرَ الحالية، ولا وقتَ رأسٍ حرفيًّا ═══ */
const lits = [...js.matchAll(/'(V\d+\.\d+)'/g)].map(m => m[1]).filter(v => v !== cur);
T(!lits.length, 'لا رقمَ نسخةٍ حرفيًّا في الشيفرة غيرَ ' + cur, [...new Set(lits)].join(' · '));
T(!/syncMeta'\)\.innerHTML\s*=\s*[\s\S]{0,120}<span class="num">[٠-٩0-9:]+<\/span>/.test(js), 'الرأسُ لا يكتب وقتَ مزامنةٍ حرفيًّا');
T(/cur === 'vers'[\s\S]{0,1200}presenceRows\(\)/.test(js), 'شريحةُ نسخ الأجهزة تُبنى من وثائق الحضور');
T(/match \/presence\/\{uid\}/.test(rules) && /request\.auth\.uid == uid/.test((rules.match(/match \/presence[^\n]*/) || [''])[0]), 'وقاعدةُ الحضور: كلٌّ يكتب وثيقتَه هو');
T(/presence:'presence'/.test(colMap), 'ونوعُ الحضور له مجموعة');
T(/data-pzall="retry"/.test(js) && /data-pzall="drop"/.test(js) && /x\.v === null \? pill\('حذف'/.test(js), 'المعزولةُ تقول أمرَها ولها إعادةٌ وإسقاطٌ جماعيّان');
T(!/\|\| 'محمد صفوت'/.test(js), 'لا اسمَ يُنسَب إليه سجلٌّ صامتًا');

/* ═══ ٣ · تشغيل: يدخل مهندسًا ويصفّر ويقرأ ما خرج إلى الطابور ═══ */
async function fresh(){
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document;
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {};
  await wait(900);
  w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس الجرد' });
  w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0);
  w.liveWatch = () => {}; w.liveSmall = () => {};
  w.STATE.meta.uid = 'u-audit';
  d.getElementById('lgU').value = 'eng.a'; d.getElementById('lgP').value = 'rightpass12';
  d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(2200);
  return { w, d };
}
const { w, d } = await fresh();
T(w.ROLE === 'engineer', 'دخل مهندسًا', w.ROLE);
/* الحضورُ بعد الدخول */
const pres = (w.STATE.queue || []).filter(q => q.kind === 'presence');
T(pres.length === 1 && pres[0].id === 'u-audit' && pres[0].v && pres[0].v.ver === cur && pres[0].v.role === 'engineer',
  'بعد الدخول: وثيقةُ حضورٍ واحدةٌ بمعرِّفه ونسخةِ الرأس ودوره', JSON.stringify(pres[0] && pres[0].v).slice(0, 120));
T(w.appVer() === cur, 'appVer تقرأ الرأس', w.appVer());

/* التصفير */
w.STATE.recs = { S1:{ id:'S1' } }; w.STATE.inss = { S1:{ id:'S1' } };
w.STATE.stats = { '2026-09-01':{ n:1 }, '2026-09-02':{ n:2 } };
w.STATE.fixreqs = { f1:{ id:'f1' } }; w.STATE.notifs = [{ id:'n1' }];
w.STATE.events = [{ id:'e1', what:'x' }, { id:'e2', what:'y' }]; w.STATE.evlog = { e1:{}, e2:{} };
w.STATE.poison = [{ kind:'stats', id:'old', v:null, err:'Missing or insufficient permissions' }];
w.STATE.queue = [];
w.CUR = 'wipe'; w.render(1);
const okIn = d.getElementById('wipeOk');
T(!!okIn, 'صفحةُ التصفير تُرسَم بحقل التأكيد');
T(/من الجهاز فقط/.test(d.getElementById('content').textContent), 'وتقول إن الأحداثَ والإشعاراتِ من الجهاز فقط');
okIn.value = 'مسح نهائي';
w.CORE.flush = () => Promise.resolve(0);
w.wipeGo();
const Q = w.STATE.queue || [];
const dels = Q.filter(q => q.v === null);
const kinds = [...new Set(dels.map(q => q.kind))];
T(dels.length === 5, 'خمسةُ أوامرِ حذفٍ للسحابة: زيارةٌ وتركيبٌ ولقطتان وتصويب', dels.length + ' — ' + kinds.join(','));
T(!Q.some(q => w.FB.colOf(q.kind) === 'misc'), 'ولا أمرَ يذهب إلى «متفرقات»', Q.filter(q => w.FB.colOf(q.kind) === 'misc').map(q => q.kind).join(','));
T(!Q.some(q => q.kind === 'events' || q.kind === 'notifs'), 'ولا حذفَ للأحداث أو الإشعارات');
T(w.STATE.events.length === 1 && /تصفير النظام/.test(w.STATE.events[0].what), 'سجلُّ الأحداث المحليُّ فيه التصفيرُ وحدَه', w.STATE.events.length + ' — ' + (w.STATE.events[0] || {}).what);
T(Object.keys(w.STATE.evlog).length === 1, 'ومرآتُه في الطابور كذلك', Object.keys(w.STATE.evlog).length);
T(w.STATE.poison.length === 0 && Object.keys(w.STATE.recs).length === 0 && Object.keys(w.STATE.stats).length === 0, 'والمعزولُ القديمُ والسجلاتُ صُفِّرت');

/* المزامنة: المعزولةُ تقول أمرَها وتُعاد جملةً */
w.STATE.poison = [{ kind:'stats', id:'d1', v:null, err:'Missing or insufficient permissions' },
                  { kind:'recs',  id:'r1', v:{ a:1 }, err:'x' }];
w.STATE.queue = [];
w.CUR = 'sync'; w.render(1);
let c = d.getElementById('content');
T(/data-pzall="retry"/.test(c.innerHTML) && /حذف/.test(c.textContent) && /كتابة/.test(c.textContent), 'المعزولةُ بعمود الأمر وزرَّي الإعادة والإسقاط الجماعيَّين');
T(/ليس رفضًا للحساب/.test(c.textContent), 'وحذفٌ ردّته القاعدةُ يُشرَح لا يُنسَب إلى الحساب');
c.querySelector('[data-pzall="retry"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(50);
T(w.STATE.poison.length === 0 && w.STATE.queue.filter(q => q.kind !== 'evlog').length === 2, '«أعد رفع الكل» تُعيد الاثنتين إلى الطابور (والفعلُ يُسجَّل حدثًا)', w.STATE.queue.map(q => q.kind).join(','));
w.STATE.poison = [{ kind:'stats', id:'d2', v:null, err:'x' }, { kind:'stats', id:'d3', v:null, err:'x' }];
w.render(1); c = d.getElementById('content');
c.querySelector('[data-pzall="drop"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
T(w.STATE.poison.length === 2, '«أسقط الكل» بضغطةٍ واحدةٍ لا تُسقِط');
c.querySelector('[data-pzall="drop"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
T(w.STATE.poison.length === 0, 'وبالثانية خلال خمس ثوانٍ تُسقِط');

/* نسخُ الأجهزة من الحضور */
w.STATE.presence = { a:{ name:'فني أ', role:'tech', ver:cur, at:Date.now() - 60000 },
                     b:{ name:'مشرف ب', role:'supervisor', ver:'V15.1', at:Date.now() - 3600000 } };
w.CUR = 'vers'; w.render(1); c = d.getElementById('content');
T(/فني أ/.test(c.textContent) && /مشرف ب/.test(c.textContent) && /V15\.1/.test(c.textContent), 'الجدولُ من وثائق الحضور');
T(/أجهزةٌ على إصدارٍ قديم/.test(c.textContent) && /مشرف ب \(V15\.1\)/.test(c.textContent), 'والإنذارُ يسمّي من علِق على القديم');
w.STATE.presence.b.ver = cur; w.render(1); c = d.getElementById('content');
T(!/أجهزةٌ على إصدارٍ قديم/.test(c.textContent), 'ويختفي حين يتحدّث الجميع');
T(!/محمد صفوت/.test(c.textContent) && !/V14\.0/.test(c.textContent), 'ولا اسمَ ولا نسخةَ محفورين');
const sh = w.SHEETS.vers();
T(sh.length === 3 && sh[0].length === 6, 'وورقةُ إكسل «نسخة التطبيق على الأجهزة» تحمل الصفوف', sh.length);

/* صحةُ الأجهزة: الأربعةُ تُعَدُّ */
w.STATE.hb = { a__reader:{ st:'up' }, b__reader:{ st:'down', since:new Date(Date.now() - 20 * 60000).toISOString() },
               ev1:{ from:'up', to:'down', ts:new Date().toISOString() } };
w.CUR = 'hb'; w.render(1); c = d.getElementById('content');
T(!/لم تصل أي نبضة/.test(c.textContent), 'مع نبضاتٍ لا يُقال «لم تصل نبضة»');
const st = [...c.querySelectorAll('.stats .num')].map(x => x.textContent).slice(-4).join(' ');
T(/[1١] [1١] [1١] [1١]/.test(st), 'متصلٌ وغيرُ متصلٍ وفاصلٌ ومتذبذبٌ تُعَدُّ من النبضات', st);

/* حسابي بنسخة الرأس */
w.CUR = 'acct'; w.render(1); c = d.getElementById('content');
T(c.textContent.indexOf(cur) > -1 && !/V14\.0/.test(c.textContent), 'حسابي يقول نسخةَ الرأس', cur);

console.log(bad ? '\nجردُ التصفير ونسخ الأجهزة فشل ✗ (' + bad + ')' : '\nالتصفيرُ يصل السحابةَ ونسخُ الأجهزة من القاعدة ✅');
process.exit(bad ? 1 : 0);
