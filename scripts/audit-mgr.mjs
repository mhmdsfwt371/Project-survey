/* ═══════════════════════════════════════════════════════════════════════════
   جردُ سلسلة الإدارة والأقسام — node scripts/audit-mgr.mjs
   ───────────────────────────────────────────────────────────────────────────
   «مديره» ليس نصًّا حرًّا: حسابٌ من النظام مرتبتُه أعلى. فالفنيُّ مديرُه
   مشرفُه، والمشرفُ مديرُه المهندس، والمهندسُ مديرُه مديرُ المشروع — ولا
   يُقترَح أحدٌ مديرًا لنفسه، ولا من مرتبتُه أدنى. والمرتبةُ تُقرأ من الدور،
   والدورُ يُشتقُّ من الوظيفة إن أُسندت. والقسمُ من أقسام الشركة العشرة —
   القائمةُ نفسُها التي تعرضها خريطةُ التغطية، لا قائمةٌ ثانيةٌ تُكتَب.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const dom = new JSDOM(readFileSync('index.html','utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
if (!w.scrollTo) w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 800));
/* الدخولُ في الجرد كما يدخل مهندسٌ حقيقيٌّ: كان يُضغَط «دخول» بحقلين فارغين
   فيُفتَح الهيكلُ — وذلك الثغرةُ التي سُدَّت (V15.94)، فصار الجردُ يُثبِت هويةً. */
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0);
{ const uE = d.getElementById('lgU'), pE = d.getElementById('lgP'); if (uE) uE.value = 'eng.test'; if (pE) pE.value = 'TestPass1234'; }
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad = 0; const T = (c, n) => { console.log((c?'  ✓ ':'  ✗ ')+n); if(!c) bad++; };
w.ROLE='engineer'; w.STATE.meta.role='engineer';
w.STATE.users = {
  'pm':  { name:'مدير المشروع أ', user:'pm',  role:'admin',      at:Date.now() },
  'en':  { name:'مهندس أ',        user:'en',  role:'engineer',   at:Date.now() },
  'sv':  { name:'مشرف أ',         user:'sv',  role:'supervisor', at:Date.now() },
  'tc':  { name:'فني أ',          user:'tc',  role:'tech',       at:Date.now() }
};
const nm = r => w.mgrCandidates(r,'').map(x=>x.n);
T(JSON.stringify(nm('tech'))==='["مدير المشروع أ","مهندس أ","مشرف أ"]', 'مدير الفني: مشرف فما فوق — '+nm('tech'));
T(JSON.stringify(nm('supervisor'))==='["مدير المشروع أ","مهندس أ"]', 'مدير المشرف: مهندس فما فوق — '+nm('supervisor'));
/* V16.10: سلسلةُ الإدارة أعمقُ من سلّم الأدوار (شكري ← لاشين ← المهندسون) —
   فالمساوي يصلح مديرًا من رتبة المهندس فصاعدًا، والميدانُ يبقى سلّمًا. */
T(JSON.stringify(nm('engineer'))==='["مدير المشروع أ","مهندس أ"]', 'مدير المهندس: مديرُ المشروع أو مهندسٌ مثلُه — '+nm('engineer'));
w.STATE.users['vw'] = { name:'وزارة أ', user:'vw', role:'viewer', at:Date.now() };
T(JSON.stringify(nm('viewer'))==='["مدير المشروع أ","مهندس أ"]', 'مدير الوزارة: من المهندس فصاعدًا لا المشرف — '+nm('viewer'));
w.STATE.users['en2'] = { name:'مهندس ب', user:'en2', role:'engineer', sup:'مهندس أ', at:Date.now() };
T(w.mgrCandidates('engineer','en').every(x=>x.n!=='مهندس ب'), 'من تحتَه لا يُقترَح مديرًا له — لا دورة');
T(JSON.stringify(w.underNames('مهندس أ'))==='["مهندس ب"]' , 'underNames: الشجرةُ من تحت المهندس — '+JSON.stringify(w.underNames('مهندس أ')));
delete w.STATE.users['vw']; delete w.STATE.users['en2'];
T(nm('admin').length===0, 'مدير المشروع بلا مدير فوقه');
T(w.mgrCandidates('tech','sv').indexOf && w.mgrCandidates('tech','sv').every(x=>x.uid!=='sv'), 'لا يُقترَح الشخصُ مديرًا لنفسه');
/* الوظيفةُ تجرُّ الدورَ فترتفع المرتبة */
w.STATE.users.tc.job = (w.jobsList().filter(j=>j.role==='supervisor')[0]||{}).id;
T(w.roleOfUser(w.STATE.users.tc)==='supervisor', 'الدورُ يُشتقُّ من الوظيفة لا من حقل الدور');
delete w.STATE.users.tc.job;
/* الأقسام */
T(w.ORG.co.units.length===10 && w.deptName('ops').indexOf('العمليات')>-1, 'أقسامُ الشركة عشرةٌ وتُسمّى — '+w.deptName('fin'));
/* الشاشة */
w.goPage('users'); w.render(1);
const h=d.getElementById('content');
T(h.querySelector('#uD') && h.querySelector('#uS'), 'حقلا القسم والمدير في نموذج الإنشاء');
T((h.querySelector('#uS').textContent||'').indexOf('مشرف أ')>-1, 'قائمةُ المدير مملوءةٌ بالمرشَّحين');
T((h.textContent||'').indexOf('بلا مدير')>-1, 'خيارُ «بلا مدير» موجود');
/* الحفظ */
d.getElementById('uU').value='t.new'; d.getElementById('uN').value='فني جديد';
d.getElementById('uP').value='Passw0rd123'; d.getElementById('uD').value='ops'; d.getElementById('uS').value='مشرف أ';
h.querySelector('[data-usradd]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const nu=w.STATE.users['t.new'];
T(!!nu && nu.dept==='ops' && nu.sup==='مشرف أ', 'الحسابُ وُلد بقسمه ومديره');
/* الشرح */
w.goPage('jobs'); w.render(1);
const jh=d.getElementById('content').textContent;
T(jh.indexOf('الفرق بين الوظيفة والدور والقسم')>-1 && jh.indexOf('المدير')>-1, 'جدولُ الفروق يُعرَض في «الوظائف»');
console.log(bad?'\nجردُ سلسلة الإدارة فشل ✗ ('+bad+')':'\nجردُ سلسلة الإدارة والأقسام نظيف ✅');
process.exit(bad?1:0);
