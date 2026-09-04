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
const ok   = async (name, p) => { n++; try { await assertSucceeds(p); console.log('  ✓ ' + name); } catch (e){ bad++; console.log('  ✗ ' + name + ' — ' + String(e.message).slice(0, 80)); } };
const deny = async (name, p) => { n++; try { await assertFails(p);    console.log('  ✓ ' + name); } catch (e){ bad++; console.log('  ✗ ' + name + ' — كان يجب أن يُرفَض'); } };

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
await deny('الفنيُّ لا يقرأ حسابَ غيره',             getDoc(doc(as('tec'), 'users/eng')));
await ok  ('المهندسُ يعدّل الحسابات',               updateDoc(doc(as('eng'), 'users/tec'), { job:'j_tech' }));
await deny('لا أحدَ يحذف حسابًا — ولا المهندس',     deleteDoc(doc(as('eng'), 'users/tec')));


console.log('\n══ الرئيسُ ببريده — يُعرَف من بريده لا من وثيقة حساب ══');
const boss = env.authenticatedContext('boss-uid', { email: 'mohammed.safwat@afaqy.com' }).firestore();
await ok('الرئيسُ يقرأ بلا وثيقةِ حساب — يُعرَف من بريده', getDoc(doc(boss, 'recs/S1')));
await ok('ويكتب الإعدادات',                                setDoc(doc(boss, 'settings/points'), { tgtSurvey: 1 }));
/* وحسابٌ بلا بريدٍ في رمزه لا يُسقِط التقييمَ كلَّه — يُقرأ بريدُه بقيمةٍ افتراضية */
await ok('حسابٌ بلا بريدٍ في رمزه يقرأ بدوره لا يُرفَض خطأً', getDoc(doc(env.authenticatedContext('tec').firestore(), 'recs/S1')));
await env.cleanup();
console.log('\nنجح ' + (n - bad) + ' · فشل ' + bad + (bad ? '\nاختبارُ القواعد على المحاكي فشل ✗' : '\nالقواعدُ على المحاكي تفتح ما يجب وتغلق ما يجب ✅'));
process.exit(bad ? 1 : 0);
