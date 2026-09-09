/* رفع النسخة اليومية الكاملة إلى Google Drive — فولدر باسم التاريخ لكل يوم.
   يعمل داخل سير GitHub قبل خطوة التشفير، لأن نسخة الدرايف تُرفع خامًا
   إلى درايف المالك الخاص (وليس إلى المستودع العام).
   يتجاوز نفسه بهدوء إن لم تُضبط الأسرار — فلا يُفشل النسخ الاحتياطي. */
import { driveClient, rootFolder, explain, q as qEsc, SETUP_FIX } from './drive-auth.mjs';
import { readFileSync, existsSync, statSync } from 'fs';
import { Readable } from 'stream';

const { drive, mode, err } = driveClient();
/* احتفاظ بمستويين: البيانات خفيفة فتبقى طويلًا، والصور ضخمة فمدتها أقصر.
   صفر في أيٍّ منهما = لا حذف إطلاقًا. */
const KEEP_DATA  = parseInt(process.env.GDRIVE_KEEP_DAYS   || '120', 10);
const KEEP_PHOTO = parseInt(process.env.GDRIVE_PHOTO_DAYS  || '21',  10);

if (err) {
  console.log('drive-upload: ' + err + ' — تخطّي الرفع');
  try { const fs = await import('fs'); fs.mkdirSync('backups/latest', { recursive:true });
        fs.writeFileSync('backups/latest/_drive.json', JSON.stringify({ ok:false, at:new Date().toISOString(),
          why: err, fix: SETUP_FIX }, null, 2)); } catch {}
  process.exit(0);
}

const pad = n => String(n).padStart(2, '0');
const now = new Date();
const day = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;

async function folderFor(name, parent) {
  const q = `name='${qEsc(name)}' and '${parent}' in parents`
          + ` and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const found = await drive.files.list({ q, fields: 'files(id,name)', pageSize: 1,
    supportsAllDrives: true, includeItemsFromAllDrives: true });
  if (found.data.files?.length) return found.data.files[0].id;
  const made = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parent] },
    fields: 'id', supportsAllDrives: true
  });
  return made.data.id;
}

async function put(localPath, name, parent) {
  if (!existsSync(localPath)) { console.log(`  – ${name}: غير موجود، تخطّي`); return; }
  const size = statSync(localPath).size;
  const body = Readable.from(readFileSync(localPath));
  await drive.files.create({
    requestBody: { name, parents: [parent] },
    media: { mimeType: 'application/json', body },
    fields: 'id', supportsAllDrives: true
  });
  console.log(`  ✓ ${name} — ${(size / 1024 / 1024).toFixed(2)} م.ب`);
}

/* تنظيف بمستويين:
   – أقدم من KEEP_PHOTO: يُحذف ملف الصور وحده، وتبقى البيانات كاملة.
   – أقدم من KEEP_DATA : يُحذف الفولدر كله.
   لا يُلمس إلا ما كان اسمه تاريخًا صالحًا. */
async function prune(parent) {
  if (!(KEEP_DATA > 0) && !(KEEP_PHOTO > 0)) return;
  const dayMs = 86400000;
  const cutData  = KEEP_DATA  > 0 ? new Date(Date.now() - KEEP_DATA  * dayMs) : null;
  const cutPhoto = KEEP_PHOTO > 0 ? new Date(Date.now() - KEEP_PHOTO * dayMs) : null;
  const res = await drive.files.list({
    q: `'${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)', pageSize: 400,
    supportsAllDrives: true, includeItemsFromAllDrives: true
  });
  let delFolders = 0, delPhotos = 0;
  for (const f of res.data.files || []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.name)) continue;
    const when = new Date(f.name + 'T00:00:00Z');
    if (cutData && when < cutData) {
      try { await drive.files.delete({ fileId: f.id, supportsAllDrives: true }); delFolders++; } catch {}
      continue;
    }
    if (cutPhoto && when < cutPhoto) {
      try {
        const inner = await drive.files.list({
          q: `'${f.id}' in parents and name='photos.json' and trashed=false`,
          fields: 'files(id)', pageSize: 2,
          supportsAllDrives: true, includeItemsFromAllDrives: true
        });
        for (const ph of inner.data.files || []) {
          await drive.files.delete({ fileId: ph.id, supportsAllDrives: true }); delPhotos++;
        }
      } catch {}
    }
  }
  if (delPhotos)  console.log(`  🧹 حُذفت صور ${delPhotos} يومًا أقدم من ${KEEP_PHOTO} — البيانات باقية`);
  if (delFolders) console.log(`  🧹 حُذف ${delFolders} فولدر أقدم من ${KEEP_DATA} يومًا`);
  if (!delPhotos && !delFolders) console.log('  🧹 لا شيء للحذف');
}

/* حالةُ الرفع تُكتَب في backups/latest/_drive.json — أعدادٌ لا بيانات — فيقرؤها
   التطبيقُ ويعرضها في «صحة النظام»: هل وصلت نسخةُ اليوم إلى درايف المالك؟ */
import { writeFileSync as _wf, statSync as _st, existsSync as _ex } from 'fs';
const driveMeta = (o) => { try { _wf('backups/latest/_drive.json', JSON.stringify(Object.assign({ at:new Date().toISOString() }, o), null, 2)); } catch {} };
try {
  const ROOT = await rootFolder(drive, mode);
  const dayFolder = await folderFor(day, ROOT);
  console.log(`drive-upload: فولدر ${day}`);
  const sz = f => (_ex(f) ? _st(f).size : 0);
  const files = { 'backup-full.json': sz('backups/bundle.json'), 'photos.json': sz('backups/photos.json') };
  await put('backups/bundle.json',      'backup-full.json',  dayFolder);
  await put('backups/photos.json',      'photos.json',       dayFolder);
  await put('backups/latest/_meta.json', '_meta.json',       dayFolder);
  await prune(ROOT);
  driveMeta({ ok:true, day, folder:ROOT, bytes:files, keepDays:KEEP_DATA, photoDays:KEEP_PHOTO });
  console.log('drive-upload: تم ✓');
} catch (e) {
  /* لا نُفشل النسخ الاحتياطي بسبب الدرايف — نُبلّغ ونكمل */
  driveMeta({ ok:false, why:'فشل الرفع — ' + explain(e), fix:SETUP_FIX });
  /* كان تحذيرًا فيمرُّ السيرُ أخضرَ ولا يعلم أحدٌ أن النسخةَ لم تصل الدرايفَ
     منذ أسابيع. صار خطأً يُرى في السير وفي بطاقة صحة النظام. */
  console.log('::error title=درايف::' + explain(e));
}
