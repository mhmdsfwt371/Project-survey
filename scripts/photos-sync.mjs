/* ═══════════════════════════════════════════════════════════════════════════
   نقلُ الصور من القاعدة إلى الدرايف — node scripts/photos-sync.mjs
   ───────────────────────────────────────────────────────────────────────────
   الهاتفُ يكتب الصورةَ مضغوطةً في وثيقتها بالقاعدة (بلا إعدادٍ ولا دخولٍ
   إلى جوجل)، والخادمُ يمرُّ: يرفعها إلى درايف المشروع في مجلدٍ باسم نقطتها
   «photos/<معرِّف النقطة> — <اسمها>/» — لكلِّ نقطةٍ مجلدٌ وفيه صورُها كلُّها
   باسمها ورقمها — ويكتب في الوثيقة رابطَها ومعرِّفَها، ويمحو الصورةَ منها
   فلا تبقى في القاعدة إلا ما لم يُنقَل بعد.
     والمجلدُ يحمل اسمَ النقطة كما تقرؤه في بطاقتها لا معرِّفَها وحدَه
   (V16.79): معرِّفٌ كـ«NSK-MIN-RDR-0018» لا يقول لمن يفتح الدرايفَ أيَّ ممرٍّ
   هو، واسمُه «ممر Path-SH62-21» يقوله. والمخيمُ يُعرَف بشاخصه فيُقدَّم على
   ما سواه: «NSK-MIN-CMP-0207 — شاخص 12/48 · مربع 5-3». والأسماءُ تُقرأ من
   سجل النقاط المضمَّن في التطبيق نفسِه — مصدرٌ واحدٌ لا نسخةٌ ثانيةٌ تفترق.
     كان المجلدُ باليوم «photos/<اليوم>» فتتفرّق صورُ النقطة الواحدة على
   أيامٍ ولا يُعرَف ما لها إلا بالبحث. فصار بالنقطة (V16.78)، وما رُفع من
   قبلُ على الأيام يُنقَل إلى مجلد نقطته دفعةً كلَّ دورة حتى لا يبقى شيء، ثم
   تُمحى مجلداتُ الأيام الفارغة.
   ═════════════════════════════════════════════════════════════════════════ */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { Readable } from 'stream';
import { driveClient, rootFolder, explain, q as qEsc } from './drive-auth.mjs';

/* ═══ أسماءُ النقاط — من سجل التطبيق نفسِه ═══
   لا تُنسَخ الأسماءُ إلى ملفٍّ ثانٍ يفترق عن الأول: تُقرأ من `SITES_RAW` في
   index.html كما يقرؤها التطبيق. وإن تعذّرت القراءةُ بقيت المجلداتُ بمعرِّفاتها
   ولم يتوقّف النقل — الصورةُ أهمُّ من اسم مجلدها. */
const SITE_LABEL = new Map();
try {
  const html = readFileSync('index.html', 'utf8');
  const at = html.indexOf('{', html.indexOf('var SITES_RAW = '));
  /* نهايةُ الكائن تُحسَب بعدِّ الأقواس لا بنمطٍ نصّيّ: السجلُّ يُغلَق بـ«};»
     في آخر سطرٍ طويلٍ واحد، فالبحثُ عن «\\n};» يلتقط قوسًا لاحقًا ويأتي
     بنصٍّ ليس بجيسون — وهذا ما وقع عند أوّل كتابةٍ لهذا الجرد. */
  let depth = 0, str = false, esc = false, end = -1;
  for (let i = at; i < html.length; i++){
    const c = html[i];
    if (str){ if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') str = false; continue; }
    if (c === '"') str = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0){ end = i + 1; break; }
  }
  const RAW = JSON.parse(html.slice(at, end));
  const ZONES = RAW.z || [], TYPES = RAW.t || [];
  /* اسمُ النقطة يبدأ بمشعرها («منى - ممر …») والمعرِّفُ يحمل المشعرَ أصلًا،
     فيُحذَف المكرَّرُ ويبقى المميِّز — فلا يُقتطَع المميِّزُ في شبكة الدرايف. */
  const tail = (name) => {
    let s = String(name || '').trim();
    for (const z of ZONES) if (s.startsWith(z + ' - ')) { s = s.slice(z.length + 3); break; }
    return s.trim();
  };
  const clean = (s) => String(s || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 110);
  const put = (r, camp) => {
    const id = r[0], type = TYPES[r[3]] || '', sq = r[7] || '', sign = r[8] || '';
    let lab = tail(r[1]);
    /* المخيمُ يُعرَف بشاخصه — فيُقدَّم ليُقرأ من خارج المجلد قبل أن يُقتطَع */
    if (camp && String(sign).trim()) lab = 'شاخص ' + sign + (String(sq).trim() ? ' · مربع ' + sq : '');
    lab = clean(lab);
    SITE_LABEL.set(id, lab ? id + ' — ' + lab : id);
  };
  (RAW.g || []).forEach(r => put(r, true));
  (RAW.p || []).forEach(r => put(r, false));
  console.log(`أسماءُ النقاط: ${SITE_LABEL.size} — المجلداتُ تحمل الاسمَ لا المعرِّفَ وحدَه`);
} catch (e){ console.log('تعذّرت قراءةُ أسماء النقاط — تبقى المجلداتُ بمعرِّفاتها: ' + (e && e.message)); }
const labelOf = (id) => SITE_LABEL.get(String(id || '').trim()) || String(id || '').trim() || 'بلا-نقطة';

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

const photosRoot = await folder('photos', await rootFolder(drive, mode));

/* ═══ مجلداتُ النقاط: تُقرأ كلُّها مرةً في الدورة ═══
   استعلامٌ لكلِّ نقطةٍ يعني ألفًا وأربعمئة استعلامٍ في الدورة الواحدة؛ وقراءةُ
   الأبناء صفحةً صفحةً تكفي. والمفتاحُ هو المعرِّفُ في صدر الاسم — فمجلدٌ اسمُه
   المعرِّفُ وحدَه (ترتيبُ ما قبل V16.79) هو مجلدُ النقطة نفسِه، يُعاد تسميتُه
   لا يُنشَأ غيرُه، فلا ينكسر رابطٌ ولا تتكرّر مجلدات. */
const SITE_DIR = new Map();      /* معرِّفُ النقطة → معرِّفُ مجلدها */
const DIR_NAME = new Map();      /* معرِّفُ النقطة → اسمُ مجلدها الحاليّ */
try {
  let token = null;
  do {
    const r = await drive.files.list({
      q: `'${photosRoot}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'nextPageToken, files(id,name)', pageSize: 1000, pageToken: token || undefined,
      supportsAllDrives: true, includeItemsFromAllDrives: true });
    for (const f of (r.data.files || [])){
      const id = String(f.name).split(' — ')[0].trim();
      if (!SITE_DIR.has(id)){ SITE_DIR.set(id, f.id); DIR_NAME.set(id, f.name); }
    }
    token = r.data.nextPageToken || null;
  } while (token);
  console.log(`مجلداتُ النقاط الموجودة: ${SITE_DIR.size}`);
} catch (e){ console.log('قراءةُ مجلدات النقاط تعذّرت: ' + (e && e.message)); }

async function siteFolder(siteId){
  const key = String(siteId || '').trim() || 'بلا-نقطة';
  const want = labelOf(key);
  if (!SITE_DIR.has(key)){
    const made = await folder(want, photosRoot);
    SITE_DIR.set(key, made); DIR_NAME.set(key, want);
  }
  return SITE_DIR.get(key);
}

/* ═══ تسميةُ ما أُنشئ بمعرِّفه وحدَه ═══
   الملفُّ لا يُمَسّ — الاسمُ وحدَه يتغيّر، فالروابطُ والمعرِّفاتُ في القاعدة
   وفي التطبيق كما هي. ثلاثمئةٌ في الدورة تكفي: ما بقي يُسمّى في التي تليها،
   وحين لا يبقى شيءٌ لا يُطلَب شيء. */
try {
  let renamed = 0;
  for (const [id, dirId] of SITE_DIR){
    if (renamed >= 300) break;
    const want = labelOf(id);
    if (!want || DIR_NAME.get(id) === want) continue;
    try {
      await drive.files.update({ fileId: dirId, requestBody: { name: want }, fields: 'id', supportsAllDrives: true });
      DIR_NAME.set(id, want); renamed++;
    } catch (e){ /* مجلدٌ لا يُرى بهويةٍ أخرى — يُترَك ولا يُعاد بناؤه */ }
  }
  if (renamed) console.log(`::notice title=photos::سُمّي ${renamed} مجلدًا باسم نقطته`);
} catch (e){ console.log('تسميةُ المجلدات تعذّرت: ' + (e && e.message)); }

/* ═══ ما رُفع على مجلدات الأيام يُنقَل إلى مجلد نقطته ═══
   الملفُّ نفسُه يبقى بمعرِّفه ورابطه — يتغيّر أبوه فقط — فلا ينكسر رابطٌ في
   السجل ولا في التطبيق. يُمشى على سجل «done» صفحةً في كلِّ دورة بمؤشّرٍ
   محفوظٍ في settings/photosLayout، فلا تُقرأ القاعدةُ كلُّها في كلِّ عشر
   دقائق؛ وحين تنتهي الصفحاتُ يُختَم الترتيبُ (bySite) فلا يُعاد، وتُمحى
   مجلداتُ الأيام الفارغة. وما لا يُرى (رُفع بهويةٍ أخرى قبل OAuth) يُعلَّم
   فلا يُعاد طلبُه إلى الأبد. */
const LAYOUT = db.collection('settings').doc('photosLayout');
try {
  const lay = (await LAYOUT.get()).data() || {};
  if (!lay.bySite){
    let q = db.collection('photos').where('status', '==', 'done').orderBy(admin.firestore.FieldPath.documentId()).limit(150);
    if (lay.cursor) q = q.startAfter(lay.cursor);
    const page = await q.get();
    let moved = 0, skipped = 0;
    for (const d of page.docs){
      const p = d.data();
      if (!p.driveId || p.inSite) continue;
      try {
        const dest = await siteFolder(p.site || String(d.id).replace(/-\d+$/, ''));
        const cur = await drive.files.get({ fileId: p.driveId, fields: 'parents', supportsAllDrives: true });
        const have = cur.data.parents || [], others = have.filter(x => x !== dest);
        if (others.length || !have.includes(dest))
          await drive.files.update({ fileId: p.driveId, addParents: dest, removeParents: others.join(','), fields: 'id', supportsAllDrives: true });
        await d.ref.set({ inSite: true, folderId: dest }, { merge: true });
        moved++;
      } catch (e){
        skipped++;
        await d.ref.set({ inSite: true, moveWhy: explain(e).slice(0, 120) }, { merge: true }).catch(() => {});
      }
    }
    if (moved || skipped) console.log(`::notice title=photos::رُتِّب ${moved} صورةً في مجلد نقطتها${skipped ? ' · ' + skipped + ' لم تُرَ (هويةٌ أقدم)' : ''}`);
    if (page.empty){
      await LAYOUT.set({ bySite: true, at: Date.now(), cursor: admin.firestore.FieldValue.delete() }, { merge: true });
      /* مجلداتُ الأيام الفارغة تُمحى — الصورُ كلُّها صارت بمجلدات نقاطها */
      const days = await drive.files.list({ q: `'${photosRoot}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                                            fields: 'files(id,name)', pageSize: 200, supportsAllDrives: true, includeItemsFromAllDrives: true });
      let gone = 0;
      for (const f of (days.data.files || [])){
        if (!/^\d{4}-\d{2}-\d{2}$/.test(f.name)) continue;
        const kids = await drive.files.list({ q: `'${f.id}' in parents and trashed=false`, fields: 'files(id)', pageSize: 1, supportsAllDrives: true, includeItemsFromAllDrives: true });
        if ((kids.data.files || []).length) continue;
        await drive.files.delete({ fileId: f.id, supportsAllDrives: true }).catch(() => {});
        gone++;
      }
      console.log(`::notice title=photos::اكتمل ترتيبُ الصور بمجلدات النقاط${gone ? ' — ومُحي ' + gone + ' مجلدَ يومٍ فارغًا' : ''}`);
    } else {
      await LAYOUT.set({ cursor: page.docs[page.docs.length - 1].id, at: Date.now() }, { merge: true });
    }
  }
} catch (e){ console.log('ترتيبُ القديم تعذّر: ' + (e && e.message)); }

const snap = await db.collection('photos').where('status', '==', 'pending').limit(150).get();
if (snap.empty){ console.log('لا صورَ منتظرة'); process.exit(0); }
console.log(`صور منتظرة: ${snap.size}`);
let done = 0, failed = 0;
for (const d of snap.docs){
  const p = d.data(), name = p.name || (d.id + '.jpg');
  try {
    const data = String(p.data || '');
    if (!data){ throw new Error('وثيقةٌ بلا صورة'); }
    const b64 = data.replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(b64, 'base64');
    const dirId = await siteFolder(p.site || String(d.id).replace(/-\d+$/, ''));
    const made = await drive.files.create({
      requestBody: { name, parents: [dirId], description: `${p.site || ''} · ${p.kind || ''} · ${p.by || ''}` },
      media: { mimeType: 'image/jpeg', body: Readable.from(buf) },
      fields: 'id,webViewLink', supportsAllDrives: true
    });
    /* رابطٌ يفتح لكلِّ من عنده الرابط — فتظهر الصورةُ في معرض التطبيق لكلِّ الفريق
       لا لصاحب الدرايف وحدَه؛ وإن تعذّرت المشاركةُ بقي الملفُ مرفوعًا */
    await drive.permissions.create({ fileId: made.data.id, requestBody: { role: 'reader', type: 'anyone' }, supportsAllDrives: true }).catch(() => {});
    await d.ref.set({ status: 'done', driveId: made.data.id, link: made.data.webViewLink, movedAt: Date.now(),
                      inSite: true, folderId: dirId, data: admin.firestore.FieldValue.delete() }, { merge: true });
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
