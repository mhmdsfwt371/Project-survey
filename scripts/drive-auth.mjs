/* ═══════════════════════════════════════════════════════════════════════════
   هويةُ الدرايف — من يرفع، وإلى أين
   ───────────────────────────────────────────────────────────────────────────
   حسابُ الخدمة يصنع الفولدرات ويعجز عن الملفات: جوجل لا تعطي حسابات الخدمة
   حصةَ تخزينٍ خاصةً بها، والملفُ المرفوعُ إلى مجلدٍ شخصيٍّ يبقى مملوكًا لها
   فيُرَدُّ بـ storageQuotaExceeded. الدرايفُ المشترك يحلُّها لأن المالكَ هو
   الدرايفُ نفسُه — لكنه يحتاج Google Workspace بنسخةٍ تدعمه.

   فالمسارُ المعتمد هنا: توكنُ المالك. السيرُ يرفع باسم صاحب الدرايف نفسِه،
   فالملفاتُ مملوكةٌ له وتُحسَب على مساحته هو. والصلاحيةُ المطلوبة drive.file
   وحدَها — «غير حسّاسة» عند جوجل فلا تجرُّ مراجعةً أمنية، وتعني عمليًّا أن
   السيرَ لا يرى من درايفك إلا ما صنعه هو. ولذلك لا معرِّفَ مجلدٍ يُلصَق:
   المجلدُ الجذرُ يُصنَع مرةً ويُعرَف بعدها بالاسم.

   وحسابُ الخدمة يبقى مسارًا احتياطيًّا: يعمل بلا تغييرٍ إن كان GDRIVE_FOLDER
   يشير إلى درايفٍ مشترك.
   ═════════════════════════════════════════════════════════════════════════ */
import { google } from 'googleapis';

export const ROOT_NAME = 'نُسُك — نسخ احتياطية';

/* الملصقُ الذي يُعرض للمستخدم حين تغيب الأسرار — نصٌّ واحدٌ لا يتكرر في مكانين */
export const SETUP_FIX =
  'Settings ← Secrets and variables ← Actions ← GDRIVE_OAUTH: '
  + '{"client_id":"…","client_secret":"…","refresh_token":"…"} '
  + 'من عميل OAuth في مشروع project-survey-60600 بصلاحية drive.file، '
  + 'وحالةُ النشر «In production» وإلا انتهى التوكن بعد سبعة أيام';

/* يُرجِع { drive, mode, err } — err نصٌّ عربيٌّ صالحٌ للعرض، لا استثناء */
export function driveClient() {
  const oauthRaw = (process.env.GDRIVE_OAUTH || '').trim();
  if (oauthRaw) {
    let o;
    try { o = JSON.parse(oauthRaw); }
    catch { return { err: 'GDRIVE_OAUTH ليس JSON صالحًا — يُلصَق محتوى الكائن كاملًا' }; }
    const miss = ['client_id', 'client_secret', 'refresh_token'].filter(k => !o[k]);
    if (miss.length) return { err: 'GDRIVE_OAUTH ينقصه: ' + miss.join(' · ') };
    const c = new google.auth.OAuth2(o.client_id, o.client_secret,
      'https://developers.google.com/oauthplayground');
    c.setCredentials({ refresh_token: o.refresh_token });
    return { drive: google.drive({ version: 'v3', auth: c }), mode: 'oauth' };
  }
  const saRaw = (process.env.GDRIVE_SA || process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!saRaw) return { err: 'GDRIVE_OAUTH غير مضبوط — لم يُرفَع شيءٌ إلى درايف' };
  let sa;
  try { sa = JSON.parse(saRaw); }
  catch { return { err: 'GDRIVE_SA ليس JSON صالحًا' }; }
  const auth = new google.auth.GoogleAuth({
    credentials: sa, scopes: ['https://www.googleapis.com/auth/drive']
  });
  return { drive: google.drive({ version: 'v3', auth }), mode: 'sa' };
}

/* اسمٌ داخل استعلام درايف: الاقتباسُ المفرد وحدَه هو ما يكسره */
export const q = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/* المجلدُ الجذر: تحت الخدمة معرِّفٌ يُلصَق، وتحت التوكن مجلدٌ يُصنَع ويُعرَف
   بالاسم — وdrive.file لا يرى غيرَ ما صنعه السيرُ فلا يلتبس باسمٍ مشابه. */
export async function rootFolder(drive, mode) {
  if (mode === 'sa') {
    const id = (process.env.GDRIVE_FOLDER || '').trim();
    if (!id) throw new Error('GDRIVE_FOLDER غير مضبوط مع حساب الخدمة');
    return id;
  }
  const found = await drive.files.list({
    q: `name='${q(ROOT_NAME)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)', pageSize: 1, spaces: 'drive'
  });
  if (found.data.files && found.data.files[0]) return found.data.files[0].id;
  const made = await drive.files.create({
    requestBody: { name: ROOT_NAME, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id'
  });
  console.log(`  ✓ صُنع المجلدُ الجذر «${ROOT_NAME}» — ${made.data.id}`);
  return made.data.id;
}

/* تفسيرُ عطلِ الرفع بلغةٍ تُقرأ — لا رسالةَ جوجل الخام */
export function explain(e) {
  const raw = String((e && (e.message || e.code)) || e);
  if (/storage quota|storageQuotaExceeded/i.test(raw))
    return 'حسابُ الخدمة بلا حصةِ تخزين — الرفعُ باسم المالك عبر GDRIVE_OAUTH هو الحلّ. ' + SETUP_FIX;
  if (/invalid_grant/i.test(raw))
    return 'التوكنُ انتهى أو أُبطل — الغالبُ أن حالةَ النشر ما زالت «Testing» فينتهي بعد سبعة أيام. '
         + 'انقلها «In production» ثم أعِد توليدَ refresh_token والصقه في GDRIVE_OAUTH';
  if (/invalid_client|unauthorized_client/i.test(raw))
    return 'client_id أو client_secret في GDRIVE_OAUTH لا يطابق عميلَ OAuth في المشروع';
  if (/insufficient|insufficientPermissions|forbidden/i.test(raw))
    return 'الصلاحيةُ ناقصة — يجب أن يحمل التوكنُ نطاق drive.file';
  return raw.slice(0, 160);
}
