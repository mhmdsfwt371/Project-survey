/* ═══════════════════════════════════════════════════════════════════════════
   ما سُدَّ كان مفتوحًا — node scripts/rules-before-test.mjs (على المحاكي)
   ───────────────────────────────────────────────────────────────────────────
   الاختبارُ يُثبت أنه يكشف: الحالاتُ التي تُرَدُّ الآن تُقبَل على القواعد قبل
   V17.93. في عمليةٍ مستقلّة: بيئةُ اختبارٍ واحدةٌ لكلِّ عملية — بيئتان في عمليةٍ
   واحدةٍ تُسقِط الاتصالَ («Firestore has already been started»).
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
const envB = await initializeTestEnvironment({
  projectId: 'demo-before',
  firestore: { rules: readFileSync('scripts/fixtures/rules-before-V17.93.rules', 'utf8'),
               host: process.env.FIRESTORE_EMULATOR_HOST ? process.env.FIRESTORE_EMULATOR_HOST.split(':')[0] : '127.0.0.1',
               port: process.env.FIRESTORE_EMULATOR_HOST ? +process.env.FIRESTORE_EMULATOR_HOST.split(':')[1] : 8080 }
});
let bad = 0, n = 0;
const ok = async (name, p) => { n++; try { await assertSucceeds(p); console.log('  ✓ ' + name); } catch (e){ bad++; console.log('  ✗ ' + name + ' — ' + String(e.message).slice(0, 120)); console.log('::error title=' + name + '::' + String(e.message).slice(0, 160)); } };
await envB.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/b_sup'), { name:'مشرف', role:'supervisor', active:true });
  await setDoc(doc(db, 'users/b_tec'), { name:'فني', role:'tech', active:true });
  await setDoc(doc(db, 'ghcfg/gh'), { token:'x' });
  await setDoc(doc(db, 'settings/pulse'), { at:1 });
  await setDoc(doc(db, 'pending/b.inv'), { name:'مدعوّ', user:'b.inv', role:'supervisor' });
});
const asB = (uid, email) => envB.authenticatedContext(uid, { email: email || (uid + '@nusuk.test') }).firestore();
console.log('══ ما سُدَّ كان مفتوحًا — الحالاتُ نفسُها على القواعد السابقة ══');
await ok('كان مفتوحًا: غريبٌ يُنشئ نفسَه فنيًّا فعّالًا',          setDoc(doc(asB('b_str'), 'users/b_str'), { name:'غريب', role:'tech', active:true, user:'b_str' }));
await ok('كان مفتوحًا: دعوةٌ تُقرأ بلا هويةٍ بمعرِّفها',           getDoc(doc(envB.unauthenticatedContext().firestore(), 'pending/b.inv')));
await ok('كان مفتوحًا: المشرفُ يقرأ مفتاحَ السيور',              getDoc(doc(asB('b_sup'), 'ghcfg/gh')));
await ok('كان مفتوحًا: الفنيُّ يحذف وثيقةَ النبضة',              deleteDoc(doc(asB('b_tec'), 'settings/pulse')));
await ok('كان مفتوحًا: تفعيلُ دعوةٍ بلا رمزٍ ولا بريد',          setDoc(doc(asB('b_any', 'other@nusuk.local'), 'users/b_any'), { name:'دخيل', user:'b.inv', role:'supervisor', active:true }));
await envB.cleanup();
console.log('\nنجح ' + (n - bad) + ' · فشل ' + bad);
process.exit(bad ? 1 : 0);
