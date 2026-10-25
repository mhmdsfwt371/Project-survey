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
const lines = []; let notes = 0;
/* (V39.41) the result as annotations too — readable from the run's page and its API without downloading the log */
const say = s => { lines.push(s); console.log(s); if (notes < 10 && /^(✓|✗|⚠|✅|❌|\| [^-])/.test(s) && !/^\| الفحص/.test(s)){ notes++; console.log('::notice title=rules-live::' + s.replace(/\n/g, ' ')); } };
process.on('unhandledRejection', e => { console.log('::error title=rules-live::' + String(e && e.message || e).slice(0, 300)); process.exit(1); });
process.on('uncaughtException', e => { console.log('::error title=rules-live::' + String(e && e.message || e).slice(0, 300)); process.exit(1); });
if (!SA){ console.log('::notice::بلا مفتاحِ خدمة — لا اختبارَ حيًّا'); process.exit(0); }
const admin = (await import('firebase-admin')).default;
const sa = JSON.parse(SA); admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore(), auth = admin.auth(), PROJECT = sa.project_id;
const KEY = (/apiKey:\s*"([^"]+)"/.exec(readFileSync('src/01-core/01-core-registry-04-engine-storage.js', 'utf8')) || [])[1];
const norm = s => String(s).replace(/\s+/g, ' ').trim();
say('# اختبارُ القواعد الحيّ — ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' (UTC)');
let ok = true, warn = 0;
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
/* (V39.44) سجلّا اختبارٍ مخصّصان (recs/__rulecheck__ وinss/__rulecheck__) — محذوفان دائمًا (deleted:true) فلا يظهران في أي شاشة.
   التشخيص أثبت أن الحقول كلها سليمة (لا NaN) والوزارة تقرأ — والقاعدة التي تقرأ السجلَّ المخزَّن (الخلاصة وحدها) هي وحدها
   ما يخالف؛ فتُختبَر بكتابةٍ حقيقيةٍ على سجلّ الاختبار بشرط «موجود» بدل الشرط المستحيل: إن سُمح كُتب حقلُ الخلاصة على سجلّ
   الاختبار وحده، وإن مُنع فالمنعُ حقيقيٌّ يلقاه مندوبُ الوزارة في التطبيق. */
const RC_DOC = { site:'__rulecheck__', test:true, deleted:true, review:'pending', bst:'', brief:'', _at:Date.now() };
await db.collection('recs').doc('__rulecheck__').set(RC_DOC, { merge:true });
await db.collection('inss').doc('__rulecheck__').set(Object.assign({}, RC_DOC, { status:'مُركّب' }), { merge:true });
async function realProbe(role, path, fields){
  const qs = Object.keys(fields).map(k => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&') + '&currentDocument.exists=true';
  const r = await fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/' + path + '?' + qs, { method:'PATCH',
    headers:{ 'content-type':'application/json', authorization:'Bearer ' + tok[role] }, body:JSON.stringify({ fields:Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, val(v)])) }) });
  const j = await r.json().catch(() => ({})), st = (j.error && j.error.status) || (r.ok ? 'OK' : String(r.status));
  return st === 'PERMISSION_DENIED' ? 'منع' : st === 'OK' ? 'سماح' : st;
}
/* ضابط */
const ctl = recPending ? await writeProbe('', 'recs/' + recPending, { note:'x' }) : 'بلا هدف';
say((ctl === 'منع' ? '✓' : '✗') + ' الضابط: محاولةٌ بلا حسابٍ ← ' + ctl);
if (ctl !== 'منع'){ say('⚠ الطريقةُ لا تميّز السماحَ من المنع هنا — لا نتيجة'); ok = false; }
else {
  const CASES = [
    ['تعديلُ زيارةٍ تنتظر الاعتماد', r => writeProbe(r, 'recs/' + recPending, { note:'فحص' }), { engineer:'سماح', supervisor:'سماح', tech:'سماح', viewer:'منع', exec:'منع' }, recPending],
    ['خلاصةُ الزيارة — كتابةٌ حقيقيةٌ على سجلّ الاختبار', r => realProbe(r, 'recs/__rulecheck__', { bst:'ملاحظة' }), { viewer:'سماح', exec:'منع' }, 'x'],
    ['خلاصةُ التركيب — كتابةٌ حقيقيةٌ على سجلّ الاختبار', r => realProbe(r, 'inss/__rulecheck__', { bst:'ملاحظة' }), { viewer:'سماح', exec:'منع' }, 'x'],
    ['نقلُ موقعٍ (تجاوز السجل)', r => writeProbe(r, 'sites/' + siteAny, { movedBy:'فحص' }), { engineer:'سماح', supervisor:'سماح', tech:'سماح', viewer:'منع', exec:'منع' }, siteAny],
    ['قراءةُ المشتريات', r => readProbe(r, 'purchases'), { engineer:'سماح', supervisor:'منع', tech:'منع', viewer:'منع', exec:'منع' }, 'x']
  ];
  say('\n| الفحص | ' + ROLES.join(' | ') + ' |'); say('|---|' + ROLES.map(() => '---').join('|') + '|');
  for (const [name, fn, exp, target] of CASES){
    if (!target){ say('| ' + name + ' | ' + ROLES.map(() => 'بلا هدف').join(' | ') + ' |'); continue; }
    const cells = [];
    for (const r of ROLES){
      if (!(r in exp)){ cells.push('—'); continue; }
      const got = await fn(r), good = got === exp[r];
      /* (V39.42) only a security regression fails the run (something allowed that must be refused, or a real write);
         a refusal where the app expects permission is a functional gap: a warning with its role, never silent */
      const sec = !good && exp[r] === 'منع';
      if (sec) ok = false; else if (!good){ warn++; console.log('::warning title=rules-live::' + name + ' — ' + r + ': ' + got + ' (المتوقَّع ' + exp[r] + ')'); }
      cells.push((good ? '✓ ' : sec ? '✗ ' : '⚠ ') + got + (good ? '' : ' (المتوقَّع ' + exp[r] + ')'));
    }
    say('| ' + name + ' | ' + cells.join(' | ') + ' |');
  }
}
/* ٥) (V39.43) تشخيصُ ما يُرفَض للوزارة — لا يغيّر الحكم. الفرضية: رقمٌ غيرُ منتهٍ (NaN) محفوظٌ في السجل يجعل
   «diff» يعدّه متغيّرًا في كل كتابة (NaN لا يساوي نفسَه)، فتسقط قاعدةُ «الخلاصة وحدها» على السجلات الحقيقية لا على المحاكي */
const diag = t => { console.log('::warning title=rules-live-diag::' + t); lines.push('- ' + t); };
const isPlain = v => v && typeof v === 'object' && !Array.isArray(v) && v.constructor === Object;
const nonFinite = (o, pre = '') => { const out = [];
  for (const [k, v] of Object.entries(o || {})){
    if (typeof v === 'number' && !Number.isFinite(v)) out.push(pre + k);
    else if (Array.isArray(v)) v.forEach((x, i) => { if (typeof x === 'number' && !Number.isFinite(x)) out.push(pre + k + '[' + i + ']'); else if (isPlain(x)) out.push(...nonFinite(x, pre + k + '[' + i + '].')); });
    else if (isPlain(v)) out.push(...nonFinite(v, pre + k + '.'));
  } return out; };
async function getProbe(role, path){
  const r = await fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/' + path, { headers:{ authorization:'Bearer ' + tok[role] } });
  return r.status === 200 ? 'سماح' : r.status === 403 ? 'منع' : String(r.status);
}
try {
  lines.push('\n## تشخيص');
  if (recPending){
    const rd = (await db.collection('recs').doc(recPending).get()).data() || {};
    diag('الزيارةُ المختبَرة: حقولٌ غيرُ منتهية = ' + (nonFinite(rd).join('، ') || 'لا شيء') + ' · قراءةُ الوزارة لها: ' + await getProbe('viewer', 'recs/' + recPending));
  }
  if (insAny){ const idoc = (await db.collection('inss').doc(insAny).get()).data() || {}; diag('التركيبُ المختبَر: حقولٌ غيرُ منتهية = ' + (nonFinite(idoc).join('، ') || 'لا شيء')); }
  diag('الطريقةُ نفسُها على سجلّ الاختبار (شرطٌ مستحيل): خلاصةُ الوزارة ← ' + await writeProbe('viewer', 'recs/__rulecheck__', { bst:'ملاحظة' }) + ' — إن كانت «منع» والكتابةُ الحقيقيةُ «سماح» فالشرطُ المستحيلُ لا يصلح للقواعد التي تقرأ السجلّ المخزَّن');
  for (const col of ['recs', 'inss']){
    const snap = await db.collection(col).get(); let dirty = 0, clean = ''; const keys = {};
    snap.forEach(d => { const nf = nonFinite(d.data()); if (nf.length){ dirty++; nf.forEach(k => { const kk = k.replace(/\[\d+\]/g, '[]'); keys[kk] = (keys[kk] || 0) + 1; }); } else if (!clean) clean = d.id; });
    const top = Object.entries(keys).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, n]) => k + ' ×' + n).join('، ');
    const probe = clean ? await writeProbe('viewer', col + '/' + clean, { bst:'ملاحظة' }) : 'بلا سجلٍّ نظيف';
    diag(col + ': ' + dirty + ' من ' + snap.size + ' فيها رقمٌ غيرُ منتهٍ' + (top ? ' (' + top + ')' : '') + ' · خلاصةُ الوزارة على سجلٍّ نظيف: ' + probe);
  }
} catch (e){ diag('تعذّر التشخيص: ' + String(e.message).slice(0, 150)); }

await db.collection('recs').doc('__rulecheck__').set(RC_DOC, { merge:true }); await db.collection('inss').doc('__rulecheck__').set(Object.assign({}, RC_DOC, { status:'مُركّب' }), { merge:true });
/* ٤) تعطيلُ الحسابات المؤقّتة */
for (const r of ROLES){
  try { await auth.updateUser('rc-' + r, { disabled:true }); } catch (e){}
  await db.collection('users').doc('rc-' + r).set({ active:false, deleted:true }, { merge:true });
}
say('\n' + (!ok ? '❌ في القاعدة الحيّة ثغرة: ما يجب منعُه مسموح، أو القواعدُ غيرُ المنشورة — انظر الجدول' : warn ? '⚠ لا ثغرةَ أمنية، و' + warn + ' كتابةً متوقَّعةً تُرفَض — انظر الجدول' : '✅ القاعدةُ الحيّةُ تطابق المتوقَّعَ لكل دور — ولم يُكتب شيءٌ في بيانات أحد'));
writeFileSync(OUT, lines.join('\n') + '\n');
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
process.exit(ok ? 0 : 1);
