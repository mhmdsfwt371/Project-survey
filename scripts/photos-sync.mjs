/* ═══════════════════════════════════════════════════════════════════════════
   نقلُ الصور من القاعدة إلى الدرايف — node scripts/photos-sync.mjs
   ───────────────────────────────────────────────────────────────────────────
   الهاتفُ يكتب الصورةَ مضغوطةً في وثيقتها بالقاعدة (بلا إعدادٍ ولا دخولٍ
   إلى جوجل)، والخادمُ يمرُّ: يرفعها إلى مجلد «photos/<اليوم>» في درايف
   المشروع باسم النقطة ورقمها، ويكتب في الوثيقة رابطَها ومعرِّفَها، ويمحو
   الصورةَ منها — فلا تبقى في القاعدة إلا ما لم يُنقَل بعد.
   ═════════════════════════════════════════════════════════════════════════ */
import admin from 'firebase-admin';
import { Readable } from 'stream';
import { driveClient, rootFolder, explain, q as qEsc } from './drive-auth.mjs';

const SA = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GDRIVE_SA || '';
if (!SA){ console.log('::warning::FIREBASE_SERVICE_ACCOUNT غير مضبوط — لا نقلَ للصور'); process.exit(0); }
const key = JSON.parse(SA);
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();
const { drive, mode, err: driveErr } = driveClient();
if (driveErr){ console.log('::warning::' + driveErr + ' — لا نقلَ للصور'); process.exit(0); }

async function folder(name, parent){
  const q = `name='${qEsc(name)}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const f = await drive.files.list({ q, fields: 'files(id)', pageSize: 1, supportsAllDrives: true, includeItemsFromAllDrives: true });
  if (f.data.files && f.data.files[0]) return f.data.files[0].id;
  const made = await drive.files.create({ requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parent] }, fields: 'id', supportsAllDrives: true });
  return made.data.id;
}

/* ═══ ما نُقل من قبلُ بلا مشاركة: يُشارَك برابطٍ مرةً — فيفتح التنزيلُ والمصغَّراتُ للفريق ═══ */
try {
  const old = await db.collection('photos').where('status', '==', 'done').limit(300).get();
  let shared = 0;
  for (const d of old.docs){
    const p = d.data();
    if (!p.driveId || p.shared) continue;
    try {
      await drive.permissions.create({ fileId: p.driveId, requestBody: { role: 'reader', type: 'anyone' }, supportsAllDrives: true });
      await d.ref.set({ shared: true }, { merge: true }); shared++;
    } catch (e){ await d.ref.set({ shared: true, shareWhy: String(e && e.message || e).slice(0, 120) }, { merge: true }).catch(() => {}); }
  }
  if (shared) console.log(`::notice title=photos::شُورك ${shared} ملفًا برابط`);
} catch (e){ console.log('مشاركةُ القديم تعذّرت: ' + (e && e.message)); }

/* ═══ ما عُلِّم «خطأً» بسبب الدرايف يُعاد إلى الطابور ═══
   قبل V16.34 كان تعثّرُ السعة أو الإذن يُعلِّم الصورةَ `error` نهائيًّا — ثم
   ضُبط الدرايفُ وصار الرفعُ يعمل، وبقيت تلك الصورُ «خطأً في النقل» إلى الأبد
   لأن الدورةَ لا تلتقط إلا `pending`. فتُعاد كلُّ صورةٍ سببُ خطئها من الدرايف
   (سعةٌ · إذنٌ · حصةٌ · مجلدٌ) إلى الطابور في كلِّ دورة — والصورُ التي سببُها
   في البيانات نفسِها (لا صورةَ في الوثيقة) تبقى كما هي. */
try {
  const errs = await db.collection('photos').where('status', '==', 'error').limit(200).get();
  let requeued = 0;
  const DRIVE_ERR = /storage quota|shared drives|storageQuotaExceeded|permission|insufficient|403|404|429|503|quota|GDRIVE_OAUTH|درايف|الدرايف|السعة|الإذن/i;
  for (const d of errs.docs){
    const p = d.data();
    if (!DRIVE_ERR.test(String(p.why || ''))) continue;
    await d.ref.set({ status: 'pending', why: '', requeuedAt: Date.now() }, { merge: true }).catch(() => {});
    requeued++;
  }
  if (requeued) console.log(`::notice title=photos::أُعيدت ${requeued} صورةً من «خطأ» إلى الطابور — كان سببُها الدرايفَ لا الصورة`);
} catch (e){ console.log('إعادةُ الطابور: ' + (e && e.message)); }

const snap = await db.collection('photos').where('status', '==', 'pending').limit(150).get();
if (snap.empty){ console.log('لا صورَ منتظرة'); process.exit(0); }
console.log(`صور منتظرة: ${snap.size}`);
const photosRoot = await folder('photos', await rootFolder(drive, mode));
let done = 0, failed = 0;
for (const d of snap.docs){
  const p = d.data(), name = p.name || (d.id + '.jpg');
  try {
    const data = String(p.data || '');
    if (!data){ throw new Error('وثيقةٌ بلا صورة'); }
    const b64 = data.replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(b64, 'base64');
    const day = new Date(p.at || Date.now()).toISOString().slice(0, 10);
    const dayId = await folder(day, photosRoot);
    const made = await drive.files.create({
      requestBody: { name, parents: [dayId], description: `${p.site || ''} · ${p.kind || ''} · ${p.by || ''}` },
      media: { mimeType: 'image/jpeg', body: Readable.from(buf) },
      fields: 'id,webViewLink', supportsAllDrives: true
    });
    /* رابطٌ يفتح لكلِّ من عنده الرابط — فتظهر الصورةُ في معرض التطبيق لكلِّ الفريق
       لا لصاحب الدرايف وحدَه؛ وإن تعذّرت المشاركةُ بقي الملفُ مرفوعًا */
    await drive.permissions.create({ fileId: made.data.id, requestBody: { role: 'reader', type: 'anyone' }, supportsAllDrives: true }).catch(() => {});
    await d.ref.set({ status: 'done', driveId: made.data.id, link: made.data.webViewLink, movedAt: Date.now(),
                      data: admin.firestore.FieldValue.delete() }, { merge: true });
    done++;
    console.log(`  ✓ ${name} (${Math.round(buf.length / 1024)}KB)`);
  } catch (e){
    failed++;
    const why = explain(e).slice(0, 200);
    /* «حسابُ الخدمة بلا حصة تخزين»: عطلُ إعدادٍ لا عطلُ صورة — تبقى منتظرةً
       فتُنقَل وحدَها متى صار المجلدُ درايفًا مشتركًا، ولا تُشطَب صورةٌ سليمة. */
    const quota = /حصةِ تخزين|invalid_grant|invalid_client|drive\.file/.test(why);
    await d.ref.set(quota ? { why, triedAt: Date.now() } : { status: 'error', why, triedAt: Date.now() }, { merge: true }).catch(() => {});
    if (quota){
      console.log('::error title=درايف::' + why + ' — الصورُ محفوظةٌ في القاعدة وتُنقَل تلقائيًّا بعد الضبط.');
      break;
    }
    console.log(`  ✗ ${name} — ${why}`);
    console.log(`::warning title=${name}::${why}`);
  }
}
console.log(`\nنُقل ${done} · تعذّر ${failed}`);
process.exit(0);
