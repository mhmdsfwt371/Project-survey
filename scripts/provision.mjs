/* ═══════════════════════════════════════════════════════════════════════════
   إنشاءُ الحسابات من الخادم — node scripts/provision.mjs
   ───────────────────────────────────────────────────────────────────────────
   المتصفّحُ لا يُنشئ حسابَ دخولٍ لغير صاحبه بثبات: يحتاج تطبيقًا ثانيًا
   يتعثّر بالشبكة والمتصفّح واسمٍ موجود — فبقيت حساباتٌ معلَّقةً في أجهزةٍ.
   أما الخادمُ فيملك مفتاحَ المشروع ويُنشئ ما شاء: يقرأ طلباتِ الإنشاء التي
   كتبها المكتبُ في «provision»، فيُنشئ حسابَ الدخول في المصادقة بالكلمة
   التي اختارها المكتب، ويكتب وثيقةَ المستخدم بدوره ووظيفته وقسمه، ويُعلِّم
   الطلبَ «تمّ» — أو «خطأ» بسببه إن تعذّر. ثم يمسح الكلمةَ من الطلب بعد
   أن تُصدَّر ورقةُ الدخول، فلا تبقى في القاعدة.
   ═════════════════════════════════════════════════════════════════════════ */
import admin from 'firebase-admin';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
if (!raw){ console.log('::error::FIREBASE_SERVICE_ACCOUNT غير مضبوط'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore(), auth = admin.auth();
const DOMAIN = process.env.NUSUK_DOMAIN || 'nusuk.local';
function genPass(){
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; let out = '';
  for (let i = 0; i < 10; i++) out += A[Math.floor(Math.random() * A.length)];
  return out;
}

/* ═══ مسارٌ مباشرٌ من صفحة التشغيل ═══
   حين لا يصل طلبُ التطبيق — طابورٌ معلَّقٌ أو جهازٌ لا يُزامِن — يُلصَق الفريقُ
   في حقل «Run workflow» نفسِه فيُنشَأ فورًا بلا وسيط: سطرٌ لكلِّ شخص:
   الاسم,اسم المستخدم,الدور,كلمة المرور,الوظيفة,الفريق — والدورُ بالعربيّ
   أو بالمفتاح. ويُكتَب لكلٍّ طلبٌ في «provision» بحالة «تمّ» فيراه التطبيق. */
const ROLE_AR = { 'الإدارة العليا':'exec','إدارة عليا':'exec','مدير المشروع':'admin','مدير':'admin','مهندس':'engineer',
  'مشرف':'supervisor','فني':'tech','وزارة':'viewer','مطلع':'viewer','مطّلع':'viewer','فريق التهيئة':'cprep',
  'فريق التجميع':'casm','فريق التركيب':'cins','مشتريات':'buyer','مستودع':'store','محاسب':'acct','مساعد فني':'helper','سائق':'driver' };
const KNOWN = new Set(['exec','admin','engineer','supervisor','tech','viewer','cprep','casm','cins','buyer','store','acct','helper','driver']);
/* الأدوارُ المخصَّصةُ من التطبيق (settings/roles) تُقبَل بمفتاحها أو باسمها — كالأساسية */
try {
  const rd = await db.collection('settings').doc('roles').get();
  const R9 = (rd.exists && (rd.data() || {}).r) || {};
  Object.keys(R9).forEach(k => { KNOWN.add(k); if (R9[k] && R9[k].n) ROLE_AR[R9[k].n] = k; });
  if (Object.keys(R9).length) console.log(`أدوارٌ مخصَّصة: ${Object.keys(R9).length}`);
} catch (e) { console.log('::warning::تعذّرت قراءةُ الأدوار المخصَّصة — ' + String(e.message || e).slice(0, 80)); }
const direct = [];
String(process.env.TEAM || '').split(/\r?\n/).forEach((line, i) => {
  const c = line.split(/\t|,|;|\|/).map(x => x.trim());
  if (!c[0] && !c[1]) return;
  const roleRaw = (c[2] || 'فني').trim();
  const role = KNOWN.has(roleRaw) ? roleRaw : (ROLE_AR[roleRaw] || '');
  direct.push({ id:'direct-' + (i + 1), data:{ name:c[0] || c[1], user:(c[1] || '').replace(/\s+/g, ''), role: role || 'tech', roleExplicit: !!(c[2] && role),
    pass:c[3] || '', job:c[4] || '', crew:c[5] || '', by:'workflow_dispatch', status:'pending' }, direct:true, badRole:!role && roleRaw });
});
const snap = await db.collection('provision').where('status', '==', 'pending').limit(300).get();
const docs = snap.docs.map(d => ({ id:d.id, data:d.data(), ref:d.ref }))
  .concat(direct.map(x => ({ id:x.data.user || x.id, data:x.data, ref:db.collection('provision').doc(x.data.user || x.id), direct:true, badRole:x.badRole })));
if (!docs.length){ console.log('لا طلباتِ إنشاءٍ منتظرة — لا في القاعدة ولا في حقل التشغيل'); process.exit(0); }
console.log(`طلبات: ${snap.size} من القاعدة · ${direct.length} من حقل التشغيل`);

let done = 0, failed = 0;
for (const d of docs){
  const p = d.data, user = String(p.user || d.id).trim();
  /* ═══ طلبُ حذف ═══ حسابُ الدخول لا يحذفه المتصفّح — يُحذَف هنا فلا يدخل صاحبُه بعدها */
  if (p.action === 'delete'){
    try {
      if (p.uid) await auth.deleteUser(p.uid).catch(e => { if (e.code !== 'auth/user-not-found') throw e; });
      await db.collection('users').doc(p.uid).delete().catch(() => {});
      await d.ref.set({ status:'done', doneAt:Date.now(), why:'' }, { merge:true });
      done++; console.log(`  ✓ حُذف ${p.name || p.user || p.uid}`);
      console.log(`::notice title=${p.user || p.uid}::حُذف حسابُ الدخول`);
    } catch (e){
      failed++; const why = String(e && (e.message || e.code) || e).slice(0, 160);
      await d.ref.set({ status:'error', why, triedAt:Date.now() }, { merge:true });
      console.log(`::warning title=${p.user || p.uid}::تعذّر الحذف — ${why}`);
    }
    continue;
  }
  if (d.badRole) console.log(`::warning title=${user}::دورٌ غيرُ معروفٍ «${d.badRole}» — أُنشئ فنيًّا`);
  const email = /@/.test(user) ? user : `${user}@${DOMAIN}`;
  const pass  = String(p.pass || '');
  try {
    if (!user || !/^[A-Za-z0-9._@-]{3,}$/.test(user)) throw new Error('اسمُ مستخدمٍ غيرُ صالح');
    if (pass.length < 10){
      if (d.direct && !pass){ pass = genPass(); p.pass = pass; }
      else throw new Error('كلمةُ المرور أقلُّ من عشرة أحرف');
    }
    let u, existed = false;
    try {
      u = await auth.getUserByEmail(email); existed = true;
      /* موجودٌ من قبل: تُضبَط كلمتُه على ما طلبه المكتب — إعادةُ إصدار */
      await auth.updateUser(u.uid, { password: pass, displayName: p.name || user, disabled: false });
    } catch (e){
      if (e.code !== 'auth/user-not-found') throw e;
      u = await auth.createUser({ email, password: pass, displayName: p.name || user, emailVerified: false });
    }
    /* حسابٌ قائمٌ يُعاد إصدارُ كلمته: لا يُنزَل دورُه ولا يُبدَّل اسمُه إلا إن
       طُلب صراحةً — كان المسارُ المباشرُ يكتب «فنيًّا» افتراضيًّا فوق مديرٍ
       أعاد كلمتَه فيفقد صلاحياتِه ويُحبَس خارج شاشاته. */
    const existing = existed ? ((await db.collection('users').doc(u.uid).get()).data() || {}) : {};
    const doc = {
      name: p.name || existing.name || user, user,
      role: (p.roleExplicit === false && existing.role) ? existing.role : (p.role || existing.role || 'tech'),
      active: true, at: existing.at || Date.now(), by: p.by || existing.by || 'server', mustChange: true
    };
    if (p.job)   doc.job   = p.job;
    if (p.sup)   doc.sup   = p.sup;
    if (p.dept)  doc.dept  = p.dept;
    if (p.crew)  doc.crew  = p.crew;
    if (p.email) doc.email = p.email;
    if (p.ph)    doc.ph    = p.ph;
    await db.collection('users').doc(u.uid).set(doc, { merge: true });
    /* الطلبُ يُعلَّم «تمّ» ويحمل المعرِّفَ — وتبقى الكلمةُ حتى تُصدَّر الورقة */
    await d.ref.set(Object.assign(d.direct ? p : {}, { status: 'done', uid: u.uid, doneAt: Date.now(), why: '' }), { merge: true });
    /* الدعوةُ القديمةُ إن وُجدت تُمحى: لم تعد تُحتاج */
    await db.collection('pending').doc(user).delete().catch(() => {});
    done++;
    console.log(`  ✓ ${user} → ${u.uid}`);
    /* تنبيهٌ يُقرأ من واجهة GitHub البرمجية: مَن أُنشئ فعلًا لا في السجل وحده */
    console.log(`::notice title=${user}::أُنشئ — ${p.role || 'tech'} — ${u.uid}` + (d.direct ? ` — كلمةُ الدخول: ${pass}` : ''));
  } catch (e){
    failed++;
    const why = String(e && (e.message || e.code) || e).slice(0, 160);
    await d.ref.set({ status: 'error', why, triedAt: Date.now() }, { merge: true });
    console.log(`  ✗ ${user} — ${why}`);
    console.log(`::warning title=${user}::${why}`);
  }
}
console.log(`\nتمّ ${done} · تعذّر ${failed}`);
process.exit(0);
