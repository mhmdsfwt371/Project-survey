/* ═══════════════════════════════════════════════════════════════════════════
   نقلُ الصور من القاعدة إلى الدرايف — node scripts/photos-sync.mjs
   ───────────────────────────────────────────────────────────────────────────
   الهاتفُ يكتب الصورةَ مضغوطةً في وثيقتها بالقاعدة (بلا إعدادٍ ولا دخولٍ
   إلى جوجل)، والخادمُ يمرُّ: يرفعها إلى مجلد «photos/<اليوم>» في درايف
   المشروع باسم النقطة ورقمها، ويكتب في الوثيقة رابطَها ومعرِّفَها، ويمحو
   الصورةَ منها — فلا تبقى في القاعدة إلا ما لم يُنقَل بعد.
   ═════════════════════════════════════════════════════════════════════════ */
import admin from 'firebase-admin';
import { google } from 'googleapis';
import { Readable } from 'stream';

const SA = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GDRIVE_SA || '';
const ROOT = (process.env.GDRIVE_FOLDER || '').trim();
if (!SA || !ROOT){ console.log('::warning::FIREBASE_SERVICE_ACCOUNT أو GDRIVE_FOLDER غير مضبوط — لا نقلَ للصور'); process.exit(0); }
const key = JSON.parse(SA);
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();
const auth = new google.auth.GoogleAuth({ credentials: key, scopes: ['https://www.googleapis.com/auth/drive'] });
const drive = google.drive({ version: 'v3', auth });

async function folder(name, parent){
  const q = `name='${name.replace(/'/g, "\\'")}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
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

const snap = await db.collection('photos').where('status', '==', 'pending').limit(150).get();
if (snap.empty){ console.log('لا صورَ منتظرة'); process.exit(0); }
console.log(`صور منتظرة: ${snap.size}`);
const photosRoot = await folder('photos', ROOT);
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
    const why = String(e && (e.message || e.code) || e).slice(0, 140);
    await d.ref.set({ status: 'error', why, triedAt: Date.now() }, { merge: true }).catch(() => {});
    console.log(`  ✗ ${name} — ${why}`);
    console.log(`::warning title=${name}::${why}`);
  }
}
console.log(`\nنُقل ${done} · تعذّر ${failed}`);
process.exit(0);
