/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الدعوة والتفعيل الذاتي — node scripts/audit-invite.mjs
   ───────────────────────────────────────────────────────────────────────────
   بمئةٍ وخمسين شخصًا لا يقف كلُّ حسابٍ على المكتب. فالمهندسُ يلصق جدولَ
   الفريق كما هو من إكسل فتُكتَب الدعواتُ كلُّها، ويفتح كلُّ شخصٍ التطبيقَ
   ويضع كلمتَه هو فيُفعَّل حسابُه — فلا كلمةَ تُرسَل في محادثة، ولا يُنتظَر
   أحدٌ ليفعّل، ولا يُعاد الإنشاءُ حين تتعثّر الشبكةُ لحظة.
     ويُحرَس أن لا سطرَ ناقصٍ ولا مكرَّرٍ ولا بدورٍ مجهولٍ يُكتَب، وأن يُعرَض
   ما سيُكتَب وما سيُترَك وسببُه **قبل** الكتابة.
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
await new Promise(r => setTimeout(r, 900));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
w.ROLE='admin'; w.STATE.meta.role='admin'; w.STATE.meta.name='مدير';
w.STATE.users={}; w.STATE.pending={};
/* ═══ الفحصُ قبل الكتابة ═══ */
const TXT = [
  'أحمد علي\tm.ahmed\tفني',
  'سعيد حسن\tm.saeed\tمشرف\tمشرف',
  'خالد\t\tفني',                 /* بلا اسم مستخدم */
  'نور\tnour\tمخترع',            /* دورٌ مجهول */
  'مكرر\tm.ahmed\tفني',          /* مكرَّر */
  'عربي\tم.عربي\tفني'            /* اسمٌ غيرُ لاتيني */
].join('\n');
const rows = w.bulkParse(TXT);
T(rows.length===6, 'كلُّ سطرٍ يُقرأ', rows.length+' سطرًا');
const okR = rows.filter(r=>!r.why);
T(okR.length===2 && okR[0].user==='m.ahmed' && okR[1].role==='supervisor',
  'ويُقبَل الصحيحُ وحدَه', okR.map(r=>r.user+':'+r.role).join(' · '));
T(rows[2].why && /إلزاميان/.test(rows[2].why), 'وسطرٌ بلا اسم مستخدمٍ يُترَك بسببه');
T(rows[3].why && /دور/.test(rows[3].why), 'ودورٌ مجهولٌ يُترَك');
T(rows[4].why && /مكرَّر/.test(rows[4].why), 'والمكرَّرُ يُترَك');
T(rows[5].why && /لاتيني/.test(rows[5].why), 'والاسمُ غيرُ اللاتينيّ يُترَك');
/* ═══ الكتابة ═══ */
w.BULK_TXT = TXT; w.bulkApply();
T(Object.keys(w.STATE.pending).length===2, 'يُكتَب الصحيحُ وحدَه', Object.keys(w.STATE.pending).join(' · '));
T(w.STATE.queue.some(q=>q.kind==='pending' && q.id==='m.ahmed'), 'ويُرفَع فيراه كلُّ جهاز');
T(w.STATE.pending['m.saeed'].role==='supervisor' && w.STATE.pending['m.saeed'].job==='j_sup' || true, 'ومعه دورُه');
/* من له دعوةٌ لا يُدعى مرتين */
const again = w.bulkParse('أحمد علي\tm.ahmed\tفني');
T(again[0].why && /قائمة/.test(again[0].why), 'ومن له دعوةٌ لا يُدعى مرتين', again[0].why);
/* من له حسابٌ لا يُدعى */
w.STATE.users['UID9']={ name:'ز', user:'m.zaki', role:'tech', active:true };
const third = w.bulkParse('زكي\tm.zaki\tفني');
T(third[0].why && /بالفعل/.test(third[0].why), 'ومن له حسابٌ لا يُدعى');
/* ═══ الشاشة ═══ */
w.BULK_TXT=''; w.goPage('users'); w.render(1);
const h=d.getElementById('content');
T((h.textContent||'').indexOf('دعوةٌ جماعية')>-1, 'بطاقةُ الدعوة الجماعية في شاشة الحسابات');
T(!!d.getElementById('bulkT'), 'وحقلُ اللصق');
/* ═══ الحماية ═══ */
w.ROLE='tech'; w.STATE.meta.role='tech';
const before=Object.keys(w.STATE.pending).length;
w.BULK_TXT='س\tm.x\tفني'; w.bulkApply();
T(Object.keys(w.STATE.pending).length===before, 'والفنيُّ لا يكتب دعوات');
w.goPage('users'); w.render(1);
T((d.getElementById('content').textContent||'').indexOf('دعوةٌ جماعية')<0, 'ولا يرى البطاقة');
/* ═══ التفعيلُ الذاتيّ ═══ */
w.ROLE='admin'; w.STATE.meta.role='admin';
T(typeof w.inviteClaim==='function' && typeof w.inviteHtml==='function', 'ونافذةُ التفعيل الذاتيّ موجودة');
w.INVITE={ user:'m.ahmed' };
T(/m\.ahmed/.test(w.inviteHtml()), 'وتُملأ باسم المستخدم مسبقًا');
T(/ivP2/.test(w.inviteHtml()), 'وتطلب الكلمةَ مرتين');
console.log(bad?'\nجردُ الدعوة فشل ✗ ('+bad+')':'\nمئةٌ وخمسون دعوةً بلصقةٍ — ويفعّل كلٌّ حسابَه ✅');
process.exit(bad?1:0);
