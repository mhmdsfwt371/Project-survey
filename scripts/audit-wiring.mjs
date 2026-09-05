/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التمامِ البنيوي — node scripts/audit-wiring.mjs
   ───────────────────────────────────────────────────────────────────────────
   ما يُبنى حديثًا يعمل في الشاشة ويسقط في البنية: نوعٌ يُكتَب في الطابور بلا
   مجموعةٍ فيذهب إلى «متفرقات»، وحقلٌ لا يُهيَّأ في الحالة فيُقرأ من العدم،
   وسجلٌّ لا يُحفَظ محليًّا فيضيع مع إعادة التحميل، ولا يُسحَب من السحابة
   فتراه شاشةٌ ولا تراه أخرى، ولا قاعدةَ له فيُرفَض رفعُه صامتًا. أمسك هذا
   الجردُ يومَ كُتب ستَّ فجواتٍ في نموذجَي الفكِّ والصيانة وسجلِّ «آخر ما تمّ»
   — كلُّها تعمل في الشاشة ولا تصل القاعدة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const src = readFileSync('index.html','utf8');
const js = /<script>([\s\S]*)<\/script>/.exec(src)[1];
let bad=0; const say=(ok,n,x)=>{ if(!ok) bad++; console.log((ok?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
/* ═══ فحصٌ ساكن ═══ */
const dupF={}; for (const m of js.matchAll(/^function (\w+)\s*\(/gm)) dupF[m[1]]=(dupF[m[1]]||0)+1;
say(!Object.keys(dupF).filter(k=>dupF[k]>1).length,'لا دالةَ مكرَّرة', Object.keys(dupF).filter(k=>dupF[k]>1).join(','));
const dupV={}; for (const m of js.matchAll(/^var (\w+)\s*=/gm)) dupV[m[1]]=(dupV[m[1]]||0)+1;
say(!Object.keys(dupV).filter(k=>dupV[k]>1).length,'لا متغيرَ عليًّا مكرَّرًا', Object.keys(dupV).filter(k=>dupV[k]>1).join(','));
/* أنواعُ الطابور الجديدة لها مجموعة؟ */
const kinds=[...new Set([...js.matchAll(/CORE\.(?:set|dirty|rm)\('(\w+)'/g)].map(m=>m[1]))];
const colMap=(/colOf: function\(kind\)\{[\s\S]*?\}\[kind\]/.exec(js)||[''])[0];
const miss=kinds.filter(k=>!new RegExp('\\b'+k+'\\s*:').test(colMap));
say(!miss.length,'كلُّ نوعِ طابورٍ له مجموعةٌ في colOf', miss.join(' · '));
const col2=(/var col = \{[\s\S]*?\}\[it\.kind\]/.exec(js)||[''])[0];
const miss2=kinds.filter(k=>!new RegExp('\\b'+k+'\\s*:').test(col2));
say(!miss2.length,'وفي خريطة الدفعة', miss2.join(' · '));
/* حقولُ STATE الجديدة مهيّأة؟ */
const stInit=(/var STATE = \{[\s\S]*?\n\};/.exec(js)||[''])[0];
say(['steps','diss','maints'].every(k=>new RegExp('\\b'+k+'\\s*:').test(stInit)),
    'steps/diss/maints مهيَّأةٌ في STATE',
    ['steps','diss','maints'].filter(k=>!new RegExp('\\b'+k+'\\s*:').test(stInit)).join(' · ') || 'الثلاثة');
/* تُحفَظ محليًّا وتُستعاد؟ */
const sl=(/saveLocal: function\(\)\{[\s\S]*?\n  \},/.exec(js)||[''])[0];
const ll=(/loadLocal: function\(\)\{[\s\S]*?\n  \},/.exec(js)||[''])[0];
say(/steps/.test(sl)&&/steps/.test(ll),'وسجلُّ الخطوات يُحفَظ ويُستعاد', (/steps/.test(sl)?'':'حفظ ')+(/steps/.test(ll)?'':'استعادة'));
say(/diss/.test(sl)&&/maints/.test(sl),'وسجلّا الفكِّ والصيانة كذلك', (/diss/.test(sl)?'':'diss ')+(/maints/.test(sl)?'':'maints'));
/* تُسحَب من السحابة؟ */
say(/collection\('diss'\)|collection\('dismantles'\)/.test(js),'الفكُّ يُسحَب من السحابة');
say(/collection\('maints'\)/.test(js),'والصيانةُ كذلك');
/* القاعدةُ تسمح؟ */
const R=readFileSync('firestore.rules','utf8');
['dismantles','maints','steps'].forEach(c=>say(new RegExp('match /'+c+'/').test(R),'قاعدةٌ لـ'+c));
console.log(bad?'\nجردُ التمام البنيوي فشل ✗ ('+bad+')':'\nما يُرى في الشاشة يصل القاعدةَ ويعود منها ✅');
process.exit(bad?1:0);
