/* ═══════════════════════════════════════════════════════════════════════════
   اختبارُ القواعد الحيّ — node scripts/rules-live.mjs   (على السحابة: .github/workflows/rules-live.yml)
   ───────────────────────────────────────────────────────────────────────────
   (V39.40) بندُ التسليم «اختبارُ كتابةٍ حقيقيٌّ على القواعد». المحاكي يختبر ملفَّ القواعد في كل إصدار؛ وهذا يختبر
   القاعدةَ الحيّة نفسَها بحساباتٍ حقيقيةٍ مؤقّتةٍ لكل دور — بلا أن يكتب حرفًا في بيانات أحد:
   ١) القواعدُ المنشورةُ هي ملفُّ المستودع نفسُه حرفًا (بعد طيّ المسافات).
   ٢) لكل دورٍ حسابٌ مؤقّتٌ ثابتُ المعرّف (rc-<role>) يُفعَّل للفحص ويُعطَّل بعده.
   ٣) كلُّ محاولة كتابةٍ تحمل شرطًا مسبقًا لا يتحقّق أبدًا (وقتُ تحديثٍ من ١٩٧٠): إن سمحت القاعدةُ ردَّ الخادمُ
      «الشرطُ لم يتحقّق» ولم يكتب، وإن منعت ردَّ «ممنوع» — فيُعرَف الحكمُ ولا يتغيّر شيء.
   ٤) ضابطٌ: محاولةٌ بلا حسابٍ يجب أن تُمنع — فإن عادت «مسموحة» فالطريقةُ لا تصلح ويُقال ذلك لا نتيجةٌ كاذبة.
   ═══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { randomUUID } from 'crypto';
const SA = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const OUT = process.env.RULES_OUT || '/tmp/rules-live.md';
const lines = []; const say = s => { lines.push(s); console.log(s); };
if (!SA){ console.log('::notice::بلا مفتاحِ خدمة — لا اختبارَ حيًّا'); process.exit(0); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(SA); admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore(), auth = admin.auth(), PROJECT = sa.project_id;
const KEY = (/apiKey:\s*"([^"]+)"/.exec(readFileSync('src/01-core/01-core-registry-04-engine-storage.js', 'utf8')) || [])[1];
const norm = s => String(s).replace(/\s+/g, ' ').trim();
say('# اختبارُ القواعد الحيّ — ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' (UTC)');
let ok = true;
/* ١) المنشورُ هو المستودع */
try {
  const rs = await admin.securityRules().getFirestoreRuleset();
  const same = norm(rs.source.map(f => f.content).join('\n')) === norm(readFileSync('firestore.rules', 'utf8'));
  say((same ? '✓' : '✗') + ' القواعدُ المنشورةُ ' + (same ? 'هي ملفُّ المستودع نفسُه' : 'تختلف عن ملفّ المستودع — انشر القواعد'));
  if (!same) ok = false;
} catch (e){ say('⚠ تعذّر قراءةُ القواعد المنشورة: ' + String(e.message).slice(0, 120)); }
/* ٢) حساباتٌ مؤقّتة */
const ROLES = ['engineer', 'supervisor', 'tech', 'viewer', 'exec'], pw = 'Rc-' + randomUUID() + '-9a', tok = {};
for (const r of ROLES){
  const uid = 'rc-' + r, email = 'rc-' + r + '@nusuk.local';
  try { await auth.updateUser(uid, { email, password:pw, disabled:false }); } catch { await auth.createUser({ uid, email, password:pw }); }
  await db.collection('users').doc(uid).set({ name:'فحص القواعد الآلي', role:r, active:true, deleted:false, test:true }, { merge:true });
}
await new Promise(res => setTimeout(res, 1500));
for (const r of ROLES){
  const res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + KEY, { method:'POST', headers:{ 'content-type':'application/json' },
    body:JSON.stringify({ email:'rc-' + r + '@nusuk.local', password:pw, returnSecureToken:true }) });
  tok[r] = (await res.json()).idToken || '';
}
/* ٣) أهدافٌ قائمة — لا يُكتَب فيها شيء */
const first = async (col, field, val) => { let q = db.collection(col); if (field) q = q.where(field, '==', val); const s = await q.limit(1).get(); return s.empty ? '' : s.docs[0].id; };
const recPending = await first('recs', 'review', 'pending'), insAny = await first('inss'), siteAny = await first('sites');
const val = v => typeof v === 'number' ? { doubleValue:v } : { stringValue:String(v) };
async function writeProbe(role, path, fields){
  const qs = Object.keys(fields).map(k => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&') + '&currentDocument.updateTime=1970-01-01T00:00:00Z';
  const h = { 'content-type':'application/json' }; if (role) h.authorization = 'Bearer ' + tok[role];
  const r = await fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/' + path + '?' + qs, { method:'PATCH', headers:h,
    body:JSON.stringify({ fields:Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, val(v)])) }) });
  const j = await r.json().catch(() => ({})), st = (j.error && j.error.status) || (r.ok ? 'OK' : String(r.status));
  return st === 'PERMISSION_DENIED' ? 'منع' : (st === 'FAILED_PRECONDITION' || st === 'ABORTED' || st === 'ALREADY_EXISTS') ? 'سماح' : st === 'OK' ? 'كتب!' : st;
}
async function readProbe(role, col){
  const r = await fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents:runQuery', { method:'POST',
    headers:{ 'content-type':'application/json', authorization:'Bearer ' + tok[role] }, body:JSON.stringify({ structuredQuery:{ from:[{ collectionId:col }], limit:1 } }) });
  const j = await r.json().catch(() => ({})); const e = Array.isArray(j) ? j.find(x => x.error) : j.error ? j : null;
  return e ? ((e.error || {}).status === 'PERMISSION_DENIED' ? 'منع' : (e.error || {}).status) : 'سماح';
}
/* ضابط */
const ctl = recPending ? await writeProbe('', 'recs/' + recPending, { note:'x' }) : 'بلا هدف';
say((ctl === 'منع' ? '✓' : '✗') + ' الضابط: محاولةٌ بلا حسابٍ ← ' + ctl);
if (ctl !== 'منع'){ say('⚠ الطريقةُ لا تميّز السماحَ من المنع هنا — لا نتيجة'); ok = false; }
else {
  const CASES = [
    ['تعديلُ زيارةٍ تنتظر الاعتماد', r => writeProbe(r, 'recs/' + recPending, { note:'فحص' }), { engineer:'سماح', supervisor:'سماح', tech:'سماح', viewer:'منع', exec:'منع' }, recPending],
    ['خلاصةُ الزيارة وحدها', r => writeProbe(r, 'recs/' + recPending, { bst:'ملاحظة' }), { engineer:'سماح', supervisor:'سماح', tech:'سماح', viewer:'سماح', exec:'منع' }, recPending],
    ['خلاصةُ التركيب وحدها', r => writeProbe(r, 'inss/' + insAny, { bst:'ملاحظة' }), { engineer:'سماح', supervisor:'سماح', viewer:'سماح', exec:'منع' }, insAny],
    ['نقلُ موقعٍ (تجاوز السجل)', r => writeProbe(r, 'sites/' + siteAny, { movedBy:'فحص' }), { engineer:'سماح', supervisor:'سماح', tech:'سماح', viewer:'منع', exec:'منع' }, siteAny],
    ['قراءةُ المشتريات', r => readProbe(r, 'purchases'), { engineer:'سماح', supervisor:'منع', tech:'منع', viewer:'منع', exec:'منع' }, 'x']
  ];
  say('\n| الفحص | ' + ROLES.join(' | ') + ' |'); say('|---|' + ROLES.map(() => '---').join('|') + '|');
  for (const [name, fn, exp, target] of CASES){
    if (!target){ say('| ' + name + ' | ' + ROLES.map(() => 'بلا هدف').join(' | ') + ' |'); continue; }
    const cells = [];
    for (const r of ROLES){
      if (!(r in exp)){ cells.push('—'); continue; }
      const got = await fn(r); const good = got === exp[r]; if (!good) ok = false;
      cells.push((good ? '✓ ' : '✗ ') + got + (good ? '' : ' (المتوقَّع ' + exp[r] + ')'));
    }
    say('| ' + name + ' | ' + cells.join(' | ') + ' |');
  }
}
/* ٤) تعطيلُ الحسابات المؤقّتة */
for (const r of ROLES){
  try { await auth.updateUser('rc-' + r, { disabled:true }); } catch (e){}
  await db.collection('users').doc('rc-' + r).set({ active:false, deleted:true }, { merge:true });
}
say('\n' + (ok ? '✅ القاعدةُ الحيّةُ تطابق المتوقَّعَ لكل دور — ولم يُكتب شيءٌ في بيانات أحد' : '❌ في القاعدة الحيّة ما لا يطابق المتوقَّع — انظر الجدول'));
writeFileSync(OUT, lines.join('\n') + '\n');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
process.exit(ok ? 0 : 1);
