/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الإنصات الحيّ ومن يرى من — node scripts/audit-live.mjs
   ───────────────────────────────────────────────────────────────────────────
   القاعدةُ خادمٌ مشتركٌ لا صندوقٌ في كلِّ جهاز — لكنَّ التطبيقَ كان يقرؤها
   مرةً واحدةً عند الفتح ثم لا يعود: فمن أنشأ حسابًا في جهازٍ لم يره الآخرون
   حتى يُغلقوا التطبيقَ ويفتحوه، فظُنَّ أن الحفظَ لم يقع وأُنشئ الحسابُ
   مرتين. صار يُنصَت للحسابات والمعلَّقِ منها والفرق إنصاتًا دائمًا.
     ومن يرى من: كلُّ حسابٍ يرى من دونه رتبةً ونفسَه — المشرفُ يرى فنيّيه
   والمهندسُ يرى المشرفين ومن دونهم، ومن يُدير الأدوارَ يرى الجميعَ لأنه من
   يرفعهم ويخفضهم. والقاعدةُ تحرس ما يُقرأ فلا يُرى ما ليس لصاحبه.
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
/* الدخولُ في الجرد كما يدخل مهندسٌ حقيقيٌّ: كان يُضغَط «دخول» بحقلين فارغين
   فيُفتَح الهيكلُ — وذلك الثغرةُ التي سُدَّت (V15.94)، فصار الجردُ يُثبِت هويةً. */
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0);
{ const uE = d.getElementById('lgU'), pE = d.getElementById('lgP'); if (uE) uE.value = 'eng.test'; if (pE) pE.value = 'TestPass1234'; }
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 300));
let bad=0; const T=(c,n,x)=>{ if(!c) bad++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
w.ROLE='admin'; w.STATE.meta.role='admin'; w.STATE.meta.name='مدير'; w.STATE.meta.online=true;
/* قاعدةٌ صوريةٌ تبثّ التغييرات */
const subs={};
w.FB.ready=true;
w.FB.db={ collection:c=>({
  limit:()=>({ onSnapshot:(cb,err)=>{ subs[c]=cb; return ()=>{ delete subs[c]; }; } }),
  onSnapshot:(cb)=>{ subs[c]=cb; return ()=>{ delete subs[c]; }; } }) };
const emit=(col,id,data,type)=>{
  if (!subs[col]) return false;
  subs[col]({ metadata:{fromCache:false},
    docChanges:()=>[{ type:type||'added', doc:{ id, data:()=>data } }] });
  return true;
};
w.liveSmall();
T(Object.keys(subs).length>=3, 'الإنصاتُ يفتح قنواتِه', Object.keys(subs).join(' · '));
/* ١ · حسابٌ يُنشَأ في جهازٍ آخر يظهر هنا */
w.STATE.users={};
emit('users','UID9',{ name:'فني جديد', role:'tech', active:true, at:1 });
T(w.STATE.users.UID9 && w.STATE.users.UID9.name==='فني جديد', 'حسابٌ من جهازٍ آخر يظهر فورًا');
/* ٢ · تغييرُ دورٍ يصل */
emit('users','UID9',{ name:'فني جديد', role:'supervisor', active:true, at:2 },'modified');
T(w.STATE.users.UID9.role==='supervisor', 'وتغييرُ الدور يصل');
/* ٣ · الحذفُ يصل */
emit('users','UID9',null,'removed');
T(!w.STATE.users.UID9, 'والحذفُ كذلك');
/* ٤ · المعلَّقُ يصل ويظهر في القائمة */
emit('pending','m.ahmed',{ name:'أحمد', role:'tech', user:'m.ahmed', at:3 });
T(w.STATE.pending['m.ahmed'] && w.STATE.users['m.ahmed'] && w.STATE.users['m.ahmed'].pending,
  'والحسابُ المعلَّقُ يظهر معلَّمًا');
/* ٥ · الفرقُ تُحدَّث بلا تكرار */
const n0=w.TEAMS.length;
emit('teams','T1',{ n:'فريق ألف', kind:'install' });
emit('teams','T1',{ n:'فريق ألف المعدَّل', kind:'install' },'modified');
T(w.TEAMS.length===n0+1 && w.TEAMS.filter(x=>x.id==='T1')[0].n==='فريق ألف المعدَّل',
  'والفريقُ يُحدَّث في مكانه لا يتكرّر', w.TEAMS.length+' فريقًا');
emit('teams','T1',null,'removed');
T(w.TEAMS.length===n0, 'ويُحذَف');
/* ٦ · الإيقافُ يُغلِق القنوات */
w.liveSmallStop();
T(Object.keys(subs).length===0, 'والإيقافُ يُغلِق كلَّ قناة');
/* ٧ · لا يُنصَت لمن لا يُدير الحسابات */
w.ROLE='tech'; w.STATE.meta.role='tech'; w.liveSmall();
T(!subs['users'] && !subs['pending'] && !!subs['teams'], 'والفنيُّ لا يُنصِت للحسابات — ويُنصِت للفرق', Object.keys(subs).join(' · '));
w.liveSmallStop();
console.log(bad?'✗ فشل '+bad:'✅ ما يُكتَب في جهازٍ يُرى في الباقي');

/* ═══ من يرى من ═══ */
w.STATE.users={
  E:{name:'إدارة',  role:'exec',       active:true, at:1},
  A:{name:'مدير',   role:'admin',      active:true, at:1},
  G:{name:'مهندس',  role:'engineer',   active:true, at:1},
  S:{name:'مشرف',   role:'supervisor', active:true, at:1},
  S2:{name:'مشرف٢', role:'supervisor', active:true, at:1},
  T:{name:'فني',    role:'tech',       active:true, at:1},
  C:{name:'طقم',    role:'cins',       active:true, at:1}
};
w.statBump();
const seen=(role,me)=>{ w.ROLE=role; w.STATE.meta.role=role; w.STATE.meta.name=me;
  return w.usersList().map(x=>x[1].name).sort().join(' · '); };
let bad2=0; const T2=(c,n,x)=>{ if(!c) bad2++; console.log((c?'  ✓ ':'  ✗ ')+n+(x?' — '+x:'')); };
const eng=seen('engineer','مهندس');
T2(/مشرف/.test(eng) && /مشرف٢/.test(eng) && /فني/.test(eng), 'المهندسُ يرى كلَّ المشرفين ومن دونهم', eng);
const sup=seen('supervisor','مشرف');
T2(/فني/.test(sup) && /طقم/.test(sup), 'والمشرفُ يرى الفنيَّ والأطقم', sup);
T2(!/مهندس|مدير|إدارة/.test(sup), 'ولا يرى من فوقه');
/* V16.55: الرؤيةُ «رتبتي فما دونها» — فالمشرفُ يرى نظراءَه ونفسَه */
T2(/مشرف٢/.test(sup) && /مشرف/.test(sup), 'ويرى نظيرَه في الرتبة ونفسَه', sup);
const tec=seen('tech','فني');
T2(tec==='فني', 'والفنيُّ يرى نفسَه وحدَه', tec||'(فارغ)');
const ex=seen('exec','إدارة');
T2(/مدير/.test(ex) && /مهندس/.test(ex) && /فني/.test(ex), 'والإدارةُ العليا ترى الجميع', ex);
console.log((bad+bad2)?'\nجردُ الإنصات والرؤية فشل ✗ ('+(bad+bad2)+')':'\nما يُكتَب في جهازٍ يُرى في الباقي — وكلٌّ يرى من دونه ✅');
process.exit((bad+bad2)?1:0);
