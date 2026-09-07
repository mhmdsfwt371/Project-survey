/* ═══════════════════════════════════════════════════════════════════════════
   اختبارُ قواعد القاعدة على محاكي Firestore — يُشغَّل هكذا:
     npx firebase emulators:exec --only firestore --project demo-nusuk "node scripts/rules-test.mjs"
   ───────────────────────────────────────────────────────────────────────────
   جردُ القواعد (audit-rules) يقرأ نصَّ القواعد ويتحقّق أن الحمايةَ مكتوبة.
   وهذا يشغّل القواعدَ نفسَها على محاكي Firestore الرسمي ويطرق كلَّ بابٍ
   بكلِّ دور: الفنيُّ يكتب زيارتَه ولا يعتمدها، والمهندسُ يعتمد، والمطّلعُ
   لا يكتب، والمعطَّلُ لا يقرأ، ولا أحدَ يحذف حسابًا. فإن فتحت قاعدةٌ بابًا
   لا يجب أن يُفتَح قالها المحاكي لا الميدان.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-nusuk',
  firestore: { rules: readFileSync('firestore.rules', 'utf8'),
               host: process.env.FIRESTORE_EMULATOR_HOST ? process.env.FIRESTORE_EMULATOR_HOST.split(':')[0] : '127.0.0.1',
               port: process.env.FIRESTORE_EMULATOR_HOST ? +process.env.FIRESTORE_EMULATOR_HOST.split(':')[1] : 8080 }
});
let bad = 0, n = 0;
/* ═══ الساقطُ يُعلَن تنبيهًا لا سطرًا في سجلٍّ لا يُقرأ ═══
   كانت الوظيفةُ تسقط فتقول «exit code 1» وحدَها: التنبيهاتُ لا تحمل اسمَ
   الفحص، وسجلُّ الوظيفة يُنزَّل من مخزنٍ لا يُبلَغ من كلِّ مكان. فصار كلُّ
   فحصٍ ساقطٍ يُكتَب بصيغة `::error::` — فيظهر في التنبيهات باسمه وسببه،
   ويُقرأ من واجهة GitHub نفسِها بلا تنزيل. */
const fail = (name, why) => {
  bad++;
  console.log('  ✗ ' + name + ' — ' + why);
  console.log('::error title=' + name.replace(/[\r\n]/g, ' ') + '::' + String(why).replace(/[\r\n]/g, ' ').slice(0, 200));
};
const ok   = async (name, p) => { n++; try { await assertSucceeds(p); console.log('  ✓ ' + name); } catch (e){ fail(name, 'كان يجب أن يُقبَل — ' + String(e.message).slice(0, 120)); } };
const deny = async (name, p) => { n++; try { await assertFails(p);    console.log('  ✓ ' + name); } catch (e){ fail(name, 'كان يجب أن يُرفَض ولم يُرفَض'); } };

/* الحساباتُ التي تقرؤها القواعد من users/{uid} */
await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  await setDoc(doc(db, 'users/eng'),  { name:'مهندس',  role:'engineer',   active:true });
  await setDoc(doc(db, 'users/sup'),  { name:'مشرف',   role:'supervisor', active:true });
  await setDoc(doc(db, 'users/tec'),  { name:'فني',    role:'tech',       active:true });
  await setDoc(doc(db, 'users/vwr'),  { name:'وزارة',  role:'viewer',     active:true });
  await setDoc(doc(db, 'users/off'),  { name:'معطّل',  role:'tech',       active:false });
  await setDoc(doc(db, 'recs/S1'),    { id:'S1', access:'تم الوصول', review:'pending', by:'فني' });
  await setDoc(doc(db, 'inss/S1'),    { id:'S1', status:'مُركّب', approved:false, parts:{} });
  await setDoc(doc(db, 'settings/points'), { tgtSurvey: 10 });
});
/* الحسابُ الحقيقيُّ يدخل ببريدٍ — فيُعطى بريدٌ هنا كما في الإنتاج، وإلا اختلف
   ما يُختبَر عمّا يُنشَر */
const as = (uid) => env.authenticatedContext(uid, { email: uid + '@nusuk.test' }).firestore();
const anon = env.unauthenticatedContext().firestore();
const rec = { id:'S2', access:'تم الوصول', by:'فني', at:1 };

console.log('══ ١ · الدخول والقراءة ══');
await deny('غيرُ المسجَّل لا يقرأ',            getDoc(doc(anon, 'recs/S1')));
await deny('المعطَّلُ لا يقرأ وإن كان مسجَّلًا', getDoc(doc(as('off'), 'recs/S1')));
await ok  ('الفنيُّ النشطُ يقرأ',              getDoc(doc(as('tec'), 'recs/S1')));
await ok  ('المطّلعُ يقرأ',                     getDoc(doc(as('vwr'), 'recs/S1')));

console.log('\n══ ٢ · الزيارةُ: يكتبها الميدانُ ويعتمدها المهندسُ وحدَه ══');
await ok  ('الفنيُّ يكتب زيارتَه بانتظار الاعتماد', setDoc(doc(as('tec'), 'recs/S2'), { ...rec, review:'pending' }));
await deny('الفنيُّ لا يكتب زيارةً معتمدةً بيده',   setDoc(doc(as('tec'), 'recs/S3'), { ...rec, id:'S3', review:'approved' }));
await deny('المشرفُ لا يعتمد زيارتَه بيده',         updateDoc(doc(as('sup'), 'recs/S1'), { review:'approved' }));
await ok  ('المهندسُ يعتمد الزيارة',                updateDoc(doc(as('eng'), 'recs/S1'), { review:'approved' }));
await deny('المطّلعُ لا يكتب شيئًا',                setDoc(doc(as('vwr'), 'recs/S4'), { ...rec, id:'S4' }));
await deny('الفنيُّ لا يحذف',                       deleteDoc(doc(as('tec'), 'recs/S1')));
await ok  ('المهندسُ يحذف',                         deleteDoc(doc(as('eng'), 'recs/S2')));

console.log('\n══ ٣ · التركيبُ: يُقترَح ولا يُعتمَد ذاتيًّا ══');
await ok  ('الفنيُّ يكتب تركيبَه غيرَ معتمد',       setDoc(doc(as('tec'), 'inss/S2'), { id:'S2', status:'مُركّب', approved:false, parts:{} }));
await deny('الفنيُّ لا يعتمد تركيبَه',              updateDoc(doc(as('tec'), 'inss/S1'), { approved:true }));
await deny('المشرفُ لا يعتمد حلَّ التركيب',         updateDoc(doc(as('sup'), 'inss/S1'), { solution:{ status:'معتمد', items:{} } }));
await ok  ('المهندسُ يعتمد التركيب',                updateDoc(doc(as('eng'), 'inss/S1'), { approved:true }));
await deny('بعد الاعتماد لا يعدّل الفنيُّ السجل',   updateDoc(doc(as('tec'), 'inss/S1'), { parts:{ x:1 } }));
await ok  ('المهندسُ يحرّر محضرَ التسليم',          updateDoc(doc(as('eng'), 'inss/S1'), { hand:{ no:'HO-0001', at:1, by:'مهندس', to:'وزارة' } }));

console.log('\n══ ٤ · الإعداداتُ والحسابات ══');
await deny('الفنيُّ لا يكتب الإعدادات',            setDoc(doc(as('tec'), 'settings/points'), { tgtSurvey: 99 }));
await ok  ('المهندسُ يكتب الإعدادات',               setDoc(doc(as('eng'), 'settings/points'), { tgtSurvey: 99 }));
await deny('الفنيُّ لا يرفع دورَه',                 updateDoc(doc(as('tec'), 'users/tec'), { role:'admin' }));
await ok  ('الفنيُّ يقرأ حسابَه',                    getDoc(doc(as('tec'), 'users/tec')));
/* صار يقرؤه (V15.77): الاسمُ والدورُ ليسا سرًّا داخل الشركة، والترتيبُ
   بالرتبة يُصفّى في التطبيق — لأن مقارنةَ الرتب في القاعدة تستدعي وثيقةَ
   القارئ لكلِّ صفٍّ فتتجاوز سقفَ نداءات الوثائق وتُسقِط استعلامَ القائمة
   كلَّه. والسرُّ هو الجوّال وله حراستُه في العرض. */
await ok  ('الفنيُّ يقرأ حسابَ غيره — لا سرَّ في الاسم والدور',
                                                     getDoc(doc(as('tec'), 'users/eng')));
await deny('ولا يعدّله',                             updateDoc(doc(as('tec'), 'users/eng'), { role:'tech' }));
await ok  ('المهندسُ يعدّل الحسابات',               updateDoc(doc(as('eng'), 'users/tec'), { job:'j_tech' }));
await deny('لا أحدَ يحذف حسابًا — ولا المهندس',     deleteDoc(doc(as('eng'), 'users/tec')));


console.log('\n══ الرئيسُ ببريده — يُعرَف من بريده لا من وثيقة حساب ══');
const boss = env.authenticatedContext('boss-uid', { email: 'mohammed.safwat@afaqy.com' }).firestore();
await ok('الرئيسُ يقرأ بلا وثيقةِ حساب — يُعرَف من بريده', getDoc(doc(boss, 'recs/S1')));
await ok('ويكتب الإعدادات',                                setDoc(doc(boss, 'settings/points'), { tgtSurvey: 1 }));
/* وحسابٌ بلا بريدٍ في رمزه لا يُسقِط التقييمَ كلَّه — يُقرأ بريدُه بقيمةٍ افتراضية */
await ok('حسابٌ بلا بريدٍ في رمزه يقرأ بدوره لا يُرفَض خطأً', getDoc(doc(env.authenticatedContext('tec').firestore(), 'recs/S1')));
console.log('\n══ غيابُ active لا يعني معطَّلًا ══');
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'users/noflag'), { name:'حساب من التطبيق', role:'engineer' });
});
await ok  ('حسابٌ بلا حقل active يقرأ',   getDoc(doc(as('noflag'), 'recs/S1')));
await ok  ('ويكتب سجلًّا',                setDoc(doc(as('noflag'), 'events/E9'), { what:'x', ts:1 }));
await ok  ('ويكتب لقطةَ اليوم',           setDoc(doc(as('noflag'), 'stats/2026-09-05'), { n:1 }));
await deny('والمعطَّلُ صراحةً (false) لا يقرأ', getDoc(doc(as('off'), 'recs/S1')));
console.log('\n══ من لا وثيقةَ له: لا يُرفَض بغموضٍ ويسجّل نفسَه فنيًّا ══');
const nodoc = env.authenticatedContext('newbie', { email:'newbie@nusuk.test' }).firestore();
await deny('بلا وثيقةٍ لا يقرأ السجلات',            getDoc(doc(nodoc, 'recs/S1')));
await deny('ولا يكتب حدثًا',                        setDoc(doc(nodoc, 'events/E8'), { what:'x' }));
await deny('ولا يسجّل نفسَه مهندسًا',                setDoc(doc(nodoc, 'users/newbie'), { name:'ن', role:'engineer', active:true }));
await ok  ('ويسجّل نفسَه فنيًّا فيخرج من الحصار',    setDoc(doc(nodoc, 'users/newbie'), { name:'ن', role:'tech', active:true }));
await ok  ('ثم يكتب عملَه',                          setDoc(doc(nodoc, 'events/E8'), { what:'x', ts:1 }));
await deny('ولا يرفع نفسَه بعد ذلك',                 updateDoc(doc(nodoc, 'users/newbie'), { role:'admin' }));
console.log('\n══ الصيانةُ وسجلُّ ما تمّ ══');
await ok  ('الفنيُّ يكتب سجلَّ صيانة',        setDoc(doc(as('tec'), 'maints/S1'), { id:'S1', list:[{ at:1, fault:'x' }] }));
await ok  ('ويقرؤه',                          getDoc(doc(as('tec'), 'maints/S1')));
await deny('والمطّلعُ لا يكتبه',              setDoc(doc(as('vwr'), 'maints/S2'), { id:'S2', list:[] }));
await ok  ('والفنيُّ يُعلن خطوةً تمّت',        setDoc(doc(as('tec'), 'steps/K1'), { kind:'visit', site:'S1', at:1 }));
await ok  ('والمطّلعُ يقرأ ما تمّ',            getDoc(doc(as('vwr'), 'steps/K1')));
await deny('ولا يُعدَّل ما أُعلن',             updateDoc(doc(as('eng'), 'steps/K1'), { kind:'install' }));
await deny('ولا يُحذَف — الإعلانُ لا يُمحى',   deleteDoc(doc(as('eng'), 'steps/K1')));
console.log('\n══ الإدارةُ العليا: تقرأ ولا تكتب ══');
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'users/exe'), { name:'إدارة عليا', role:'exec', active:true });
});
await ok  ('تقرأ السجلات',           getDoc(doc(as('exe'), 'recs/S1')));
await ok  ('وتقرأ ما تمّ',            getDoc(doc(as('exe'), 'steps/K1')));
await deny('ولا تكتب زيارة',          setDoc(doc(as('exe'), 'recs/S9'), { id:'S9' })); 
await deny('ولا تكتب إسنادًا',        setDoc(doc(as('exe'), 'tasks/T9'), { id:'T9' }));
await deny('ولا تُدير الحسابات',      setDoc(doc(as('exe'), 'users/zz'), { name:'ز', role:'tech' }));
console.log('\n══ كلُّ حسابٍ يرى من دونه رتبةً ══');
await env.withSecurityRulesDisabled(async (ctx) => {
  const f = ctx.firestore();
  await setDoc(doc(f, 'users/t9'),  { name:'فني تسع',  role:'tech',       active:true });
  await setDoc(doc(f, 'users/s9'),  { name:'مشرف تسع', role:'supervisor', active:true });
  await setDoc(doc(f, 'users/e9'),  { name:'مهندس تسع',role:'engineer',   active:true });
});
/* القراءةُ لكلِّ فعّال — والترتيبُ بالرتبة يُصفّى في التطبيق، لأن مقارنةَ
   الرتب في القاعدة تُسقِط استعلامَ القائمة بسقف نداءات الوثائق.
     ولا يُختبَر هنا غيرُ المسجَّل: بابُه مغلقٌ بشرطٍ واحدٍ في رأس القاعدة
   (`request.auth != null`) وقد امتُحن في أوّل الملف. */
await ok  ('المشرفُ يقرأ حساباتِ الشركة',      getDoc(doc(as('sup'), 'users/t9')));
await ok  ('والمهندسُ كذلك',                    getDoc(doc(as('eng'), 'users/s9')));
await ok  ('وكلُّ أحدٍ يرى وثيقتَه',            getDoc(doc(as('tec'), 'users/tec')));
await deny('والفنيُّ لا يكتب حسابَ غيره',       setDoc(doc(as('tec'), 'users/t9'), { name:'x', role:'tech', active:true }));
await deny('ولا يكتب حسابًا معلَّقًا',           setDoc(doc(as('tec'), 'pending/p1'), { name:'س', role:'tech' }));
await ok  ('والمهندسُ يكتب المعلَّقَ ويقرؤه',    setDoc(doc(as('eng'), 'pending/p1'), { name:'س', role:'tech', user:'p1' }));
await ok  ('ويقرؤه',                            getDoc(doc(as('eng'), 'pending/p1')));

console.log('\n══ الدعوةُ يفعّلها صاحبُها ══');
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'pending/inv1'), { name:'مدعوّ', user:'inv1', role:'supervisor' });
});
const iv = env.authenticatedContext('IVUID', { email:'inv1@nusuk.local' }).firestore();
await ok  ('يقرأ دعوتَه قبل أن يُسجَّل',        getDoc(doc(iv, 'pending/inv1')));
await deny('ولا يكتب دورًا غيرَ دوره',          setDoc(doc(iv, 'users/IVUID'), { name:'مدعوّ', user:'inv1', role:'admin', active:true }));
await ok  ('ويكتب وثيقتَه بدور دعوته',          setDoc(doc(iv, 'users/IVUID'), { name:'مدعوّ', user:'inv1', role:'supervisor', active:true }));
await ok  ('ثم يمحو دعوتَه',                     deleteDoc(doc(iv, 'pending/inv1')));
await deny('ولا يمحو دعوةَ غيره',                deleteDoc(doc(iv, 'pending/p1')));
console.log('\n══ كلٌّ يُنشئ في مستواه أو دونه ══');
await ok  ('المشرفُ يطلب فنيًّا',                 setDoc(doc(as('sup'), 'provision/t7'), { user:'t7', name:'ف', role:'tech', pass:'Abcdefghij', by:'مشرف', status:'pending' }));
await ok  ('ومشرفًا مثلَه',                       setDoc(doc(as('sup'), 'provision/s7'), { user:'s7', name:'م', role:'supervisor', pass:'Abcdefghij', by:'مشرف', status:'pending' }));
await deny('ولا يطلب مهندسًا',                    setDoc(doc(as('sup'), 'provision/e7'), { user:'e7', name:'هـ', role:'engineer', pass:'Abcdefghij', by:'مشرف', status:'pending' }));
await deny('ولا ينتحل كاتبًا آخر',                setDoc(doc(as('sup'), 'provision/t8'), { user:'t8', name:'ف', role:'tech', pass:'Abcdefghij', by:'مهندس', status:'pending' }));
await ok  ('ويقرأ ما كتبه',                        getDoc(doc(as('sup'), 'provision/t7')));
await deny('ولا يقرأ ما كتبه غيرُه',              getDoc(doc(as('sup'), 'provision/p1')));
await ok  ('والمهندسُ يقرأ الكلَّ',                getDoc(doc(as('eng'), 'provision/t7')));
await deny('والفنيُّ لا يطلب شيئًا',               setDoc(doc(as('tec'), 'provision/t9'), { user:'t9', name:'ف', role:'tech', pass:'Abcdefghij', by:'فني', status:'pending' }));
await deny('والمهندسُ لا يطلب مديرًا',             setDoc(doc(as('eng'), 'provision/a7'), { user:'a7', name:'م', role:'admin', pass:'Abcdefghij', by:'مهندس', status:'pending' }));
console.log('\n══ الحضور: يكتبه صاحبُه وحدَه ══');
await ok  ('الفنيُّ يسجّل حضورَه',            setDoc(doc(as('tec'), 'att/tec_2026-09-06'), { uid:'tec', day:'2026-09-06', name:'فني', in:{ at:1, ok:true } }));
await deny('ولا يسجّل حضورَ غيره',            setDoc(doc(as('tec'), 'att/sup_2026-09-06'), { uid:'sup', day:'2026-09-06', name:'مشرف', in:{ at:1 } }));
await deny('ولا باسمٍ لا يطابق المعرِّف',      setDoc(doc(as('tec'), 'att/tec_2026-09-07'), { uid:'sup', day:'2026-09-07', in:{ at:1 } }));
await ok  ('والمشرفُ يقرأ حضورَ فنيّه',         getDoc(doc(as('sup'), 'att/tec_2026-09-06')));
await deny('ولا يمحوه',                        deleteDoc(doc(as('sup'), 'att/tec_2026-09-06')));
console.log('\n══ الأثرُ يُكتَب مرةً — وإعادةُ الإرسال لا تُرفَض ══');
await ok  ('الفنيُّ يكتب أثرًا',                 setDoc(doc(as('tec'), 'events/ev1'), { t:'زيارة', by:'فني', at:1, _at:1, _by:'tec' }));
await ok  ('وإعادةُ الإرسال نفسِها تُقبَل',       setDoc(doc(as('tec'), 'events/ev1'), { t:'زيارة', by:'فني', at:1, _at:2, _by:'tec' }));
await deny('ولا يُعدَّل محتواه',                  setDoc(doc(as('tec'), 'events/ev1'), { t:'تركيب', by:'فني', at:1, _at:3, _by:'tec' }));
await deny('ولا يُحذَف',                          deleteDoc(doc(as('eng'), 'events/ev1')));
await env.cleanup();
console.log('\nنجح ' + (n - bad) + ' · فشل ' + bad + (bad ? '\nاختبارُ القواعد على المحاكي فشل ✗' : '\nالقواعدُ على المحاكي تفتح ما يجب وتغلق ما يجب ✅'));
if (bad) console.log('::error title=محاكي القواعد::سقط ' + bad + ' فحصًا من ' + n + ' — الأسماءُ في التنبيهات أعلاه');
process.exit(bad ? 1 : 0);
