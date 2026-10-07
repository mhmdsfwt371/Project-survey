/* اختبارٌ حقيقيٌّ من البداية للنهاية بأمر المالك: «جرّب تعمل يوزر تيست — هيكمل ولا فيه إيرور؟ ولو تعديل باسورد أو صلاحيات».
   يمرّ بالمسار نفسه الذي يمرّ به طلبُ المكتب (وثيقةُ provision ثم سكربتُ الحسابات من الأصل)، ويدخل بالحساب فعلًا عبر واجهة الدخول،
   ثم يغيّر كلمته ودوره ويتحقق، ثم يحذفه بالمسار نفسه. لا يمسّ حسابًا غيرَه. */
import admin from 'firebase-admin'; import { execSync } from 'child_process'; import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore(), auth = admin.auth();
mkdirSync('/tmp/exp', { recursive: true });
const KEY = 'AIzaSyAo6s6Btxb7Nl1Eam_UBDNQUfUteNBRhMw', user = 'claude.test' + Date.now().toString(36).slice(-5), email = user + '@nusuk.local';
const P1 = 'Ts' + Math.random().toString(36).slice(2, 10) + '#9A', P2 = 'Tn' + Math.random().toString(36).slice(2, 10) + '#7B';
const R = []; const step = (n, ok, d) => { R.push({ step:n, ok:!!ok, detail:String(d || '').slice(0, 200) }); console.log((ok ? '✓ ' : '✗ ') + n + ' ' + (d || '')); };
const signIn = async (pass) => { const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + KEY, { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ email, password:pass, returnSecureToken:true }) }); const j = await r.json(); return { ok:!!j.idToken, err:(j.error && j.error.message) || '', tok:j.idToken, uid:j.localId }; };
const readOwn = async (tok, uid) => { const r = await fetch('https://firestore.googleapis.com/v1/projects/' + sa.project_id + '/databases/(default)/documents/users/' + uid, { headers:{ authorization:'Bearer ' + tok } }); const j = await r.json(); return j && j.fields ? j.fields : { error:(j.error && j.error.message) || r.status }; };
const prov = () => { try { execSync('node /tmp/provision.mjs', { stdio:'pipe', env:process.env, timeout:120000 }); return ''; } catch (e){ return String(e.stdout || e.message).slice(-300); } };
let uid = '';
try {
  /* ١ · الإنشاء كما يطلبه المكتب */
  await db.collection('provision').doc(user).set({ user, name:'اختبار Claude', role:'tech', pass:P1, status:'pending', by:'claude-e2e', at:Date.now(), _at:Date.now() });
  let e = prov(); let pd = (await db.collection('provision').doc(user).get()).data() || {};
  step('١ طلبُ الإنشاء عولج', pd.status === 'done', (pd.status || '') + ' ' + (pd.why || '') + (e ? ' | ' + e : ''));
  const u = await auth.getUserByEmail(email).catch(() => null); uid = u ? u.uid : ''; step('١ حسابُ الدخول أُنشئ', !!u, uid);
  const ud = uid ? ((await db.collection('users').doc(uid).get()).data() || {}) : {}; step('١ وثيقةُ المستخدم بدوره', ud.role === 'tech', 'role=' + ud.role + ' active=' + ud.active);
  let s = await signIn(P1); step('١ الدخولُ بكلمته', s.ok, s.err);
  if (s.ok){ const own = await readOwn(s.tok, s.uid); step('١ يقرأ وثيقتَه بعد الدخول', !own.error, own.error || ('role=' + ((own.role || {}).stringValue))); }
  /* ٢ · تغييرُ كلمة المرور (إعادةُ إصدارٍ كما يفعلها المدير) */
  await db.collection('provision').doc(user).set({ pass:P2, status:'pending', at:Date.now(), _at:Date.now(), why:'' }, { merge:true });
  e = prov(); pd = (await db.collection('provision').doc(user).get()).data() || {};
  step('٢ طلبُ تغيير الكلمة عولج', pd.status === 'done', (pd.status || '') + ' ' + (pd.why || '') + (e ? ' | ' + e : ''));
  s = await signIn(P2); step('٢ الدخولُ بالكلمة الجديدة', s.ok, s.err);
  const old = await signIn(P1); step('٢ والقديمةُ لا تعمل', !old.ok, old.err);
  /* ٣ · تغييرُ الصلاحية (المديرُ يكتب الدورَ في وثيقة المستخدم) */
  if (uid){ await db.collection('users').doc(uid).set({ role:'supervisor', roleAt:Date.now(), roleBy:'claude-e2e' }, { merge:true });
    const s3 = await signIn(P2); const own3 = s3.ok ? await readOwn(s3.tok, s3.uid) : { error:'no sign-in' };
    step('٣ الدورُ الجديدُ يُقرأ بعد الدخول', !own3.error && ((own3.role || {}).stringValue === 'supervisor'), own3.error || ('role=' + ((own3.role || {}).stringValue))); }
} catch (err){ step('خطأٌ غيرُ متوقَّع', false, err.message); }
/* ٤ · التنظيف بالمسار نفسه: طلبُ حذف */
try {
  if (uid){ await db.collection('provision').doc(user + '-del').set({ action:'delete', uid, user, status:'pending', by:'claude-e2e', at:Date.now(), _at:Date.now() });
    const e = prov(); const gone = !(await auth.getUser(uid).catch(() => null)); step('٤ طلبُ الحذف حذف الحسابَ', gone, e);
    const s4 = await signIn(P2); step('٤ ولا يدخل بعد الحذف', !s4.ok, s4.err);
    await db.collection('provision').doc(user).delete().catch(() => {}); await db.collection('provision').doc(user + '-del').delete().catch(() => {}); }
} catch (err){ step('تنظيف', false, err.message); }
writeFileSync('/tmp/exp/users-e2e.json', JSON.stringify({ at:new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 16), user, steps:R }));
