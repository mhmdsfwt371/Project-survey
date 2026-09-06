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

const snap = await db.collection('provision').where('status', '==', 'pending').limit(300).get();
if (snap.empty){ console.log('لا طلباتِ إنشاءٍ منتظرة'); process.exit(0); }
console.log(`طلبات: ${snap.size}`);

let done = 0, failed = 0;
for (const d of snap.docs){
  const p = d.data(), user = String(p.user || d.id).trim();
  const email = /@/.test(user) ? user : `${user}@${DOMAIN}`;
  const pass  = String(p.pass || '');
  try {
    if (!user || !/^[A-Za-z0-9._@-]{3,}$/.test(user)) throw new Error('اسمُ مستخدمٍ غيرُ صالح');
    if (pass.length < 10) throw new Error('كلمةُ المرور أقلُّ من عشرة أحرف');
    let u;
    try {
      u = await auth.getUserByEmail(email);
      /* موجودٌ من قبل: تُضبَط كلمتُه على ما طلبه المكتب — إعادةُ إصدار */
      await auth.updateUser(u.uid, { password: pass, displayName: p.name || user, disabled: false });
    } catch (e){
      if (e.code !== 'auth/user-not-found') throw e;
      u = await auth.createUser({ email, password: pass, displayName: p.name || user, emailVerified: false });
    }
    const doc = {
      name: p.name || user, user, role: p.role || 'tech', active: true,
      at: Date.now(), by: p.by || 'server', mustChange: true
    };
    if (p.job)   doc.job   = p.job;
    if (p.sup)   doc.sup   = p.sup;
    if (p.dept)  doc.dept  = p.dept;
    if (p.crew)  doc.crew  = p.crew;
    if (p.email) doc.email = p.email;
    if (p.ph)    doc.ph    = p.ph;
    await db.collection('users').doc(u.uid).set(doc, { merge: true });
    /* الطلبُ يُعلَّم «تمّ» ويحمل المعرِّفَ — وتبقى الكلمةُ حتى تُصدَّر الورقة */
    await d.ref.set({ status: 'done', uid: u.uid, doneAt: Date.now(), why: '' }, { merge: true });
    /* الدعوةُ القديمةُ إن وُجدت تُمحى: لم تعد تُحتاج */
    await db.collection('pending').doc(user).delete().catch(() => {});
    done++;
    console.log(`  ✓ ${user} → ${u.uid}`);
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
