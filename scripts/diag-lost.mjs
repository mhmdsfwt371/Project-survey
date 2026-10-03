/* تشخيصُ المسوح المحذوفة بزرِّ «تمت الزيارة» القديم (V28.3) — من سجلِّ الأحداث والنسخ الاحتياطية الليلية المشفّرة في الدرايف.
   لا يُطبَع في سجلِّ التشغيل إلا أعداد (المستودعُ عام)؛ التفاصيلُ إلى درايف المالك وحدَه. لا يكتب في القاعدة شيئًا. */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { driveClient, rootFolder, q as qEsc } from './drive-auth.mjs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true }); mkdirSync('/tmp/bk', { recursive: true });
const FOCUS = 'NSK-ARF-CMP-0001';
const evs = (await db.collection('events').get()).docs.map(d => d.data() || {});
const cancels = evs.filter(e => /^إلغاءُ الزيارة السريعة/.test(String(e.what || ''))).map(e => ({ id: e.site || String(e.what).split('— ').pop(), by: e.by || '', ts: +e.ts || 0, day: e.day || '' })).sort((a, b) => a.ts - b.ts);
const insCancels = evs.filter(e => /^إلغاءُ حالة التركيب/.test(String(e.what || ''))).map(e => ({ id: e.site || String(e.what).split('— ').pop(), by: e.by || '', ts: +e.ts || 0 }));
const focusTimeline = evs.filter(e => e.site === FOCUS || String(e.what || '').indexOf(FOCUS) > -1).map(e => ({ ts: +e.ts || 0, day: e.day, what: e.what, by: e.by })).sort((a, b) => a.ts - b.ts);
const recsNow = {}; for (const id of new Set(cancels.map(c => c.id).concat([FOCUS]))){ const d = await db.collection('recs').doc(id).get(); recsNow[id] = d.exists ? d.data() : null; }
/* النسخُ الليلية: كلُّ ملفٍّ backup-full.enc بتاريخ إنشائه */
const { drive, mode, err } = driveClient(); let backups = [];
if (drive){
  const ROOT = await rootFolder(drive, mode); let pageToken;
  do { const r = await drive.files.list({ q: `name='backup-full.enc' and trashed=false`, fields: 'nextPageToken, files(id, createdTime, parents)', pageSize: 200, pageToken, supportsAllDrives: true, includeItemsFromAllDrives: true, orderBy: 'createdTime' });
    backups = backups.concat(r.data.files || []); pageToken = r.data.nextPageToken; } while (pageToken);
}
backups = backups.map(f => ({ id: f.id, t: Date.parse(f.createdTime) })).sort((a, b) => a.t - b.t);
const cache = {};
async function bundleAt(ts){
  const cands = backups.filter(b => b.t < ts); const b = cands[cands.length - 1]; if (!b) return null;
  if (cache[b.id]) return cache[b.id];
  const res = await drive.files.get({ fileId: b.id, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });
  writeFileSync('/tmp/bk/' + b.id + '.enc', Buffer.from(res.data));
  execFileSync('openssl', ['enc', '-d', '-aes-256-cbc', '-pbkdf2', '-iter', '250000', '-in', '/tmp/bk/' + b.id + '.enc', '-out', '/tmp/bk/' + b.id + '.json', '-pass', 'env:BACKUP_KEY']);
  const j = JSON.parse(readFileSync('/tmp/bk/' + b.id + '.json', 'utf8')); cache[b.id] = { t: b.t, recs: j.recs || {}, inss: j.inss || {} }; return cache[b.id];
}
const quick = r => r && Object.keys(r).every(k => ['id', 'by', 'at', 'quick'].includes(k) || r[k] == null || r[k] === '');
const lost = [];
for (const c of cancels){
  let before = null, bkT = null;
  try { const B = await bundleAt(c.ts); if (B){ before = B.recs[c.id] || null; bkT = B.t; } } catch (e){ before = { _err: String(e.message || e).slice(0, 80) }; }
  const now = recsNow[c.id];
  const wasFull = before && !before._err && !quick(before);
  lost.push({ id: c.id, canceledBy: c.by, canceledAt: new Date(c.ts).toISOString(), backupAt: bkT ? new Date(bkT).toISOString() : null, wasFull: !!wasFull, before, nowExists: !!now, nowQuick: now ? quick(now) : null });
}
const out = { at: new Date().toISOString(), backups: backups.length, cancels: cancels.length, insCancels: insCancels.length, lostFull: lost.filter(l => l.wasFull).length, lostFullStillMissing: lost.filter(l => l.wasFull && (!l.nowExists || l.nowQuick)).length, focus: { id: FOCUS, recNow: recsNow[FOCUS], timeline: focusTimeline }, lost, insCancelsList: insCancels };
writeFileSync('/tmp/exp/diag-lost.json', JSON.stringify(out));
console.log('backups', backups.length, '| cancels', cancels.length, '| full surveys deleted', out.lostFull, '| still missing', out.lostFullStillMissing, '| focus events', focusTimeline.length);
