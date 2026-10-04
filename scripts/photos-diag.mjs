/* صورٌ مرفوعةٌ لا يُوصَل إليها في الدرايف: حالةُ كلِّ وثيقة صورة، ووجودُ ملفِّها، ومجلدُه، ومشاركتُه — قراءةٌ فقط */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
import { driveClient, rootFolder } from './drive-auth.mjs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const docs = (await db.collection('photos').get()).docs.map(d => ({ id: d.id, v: d.data() || {} }));
const now = Date.now(), st = {}, why = {}, out = { at: new Date().toISOString(), total: docs.length };
docs.forEach(d => { const s = d.v.status || '(none)'; st[s] = (st[s] || 0) + 1; if (s === 'error'){ const w = String(d.v.why || '?').slice(0, 70); why[w] = (why[w] || 0) + 1; } });
out.byStatus = st; out.errorWhy = why;
out.pendingWithData = docs.filter(d => d.v.status !== 'done' && d.v.data).length;
out.pendingOld = docs.filter(d => d.v.status !== 'done' && d.v.data && now - (+d.v.at || +d.v._at || now) > 6 * 36e5).map(d => ({ id: d.id, site: d.v.site, by: d.v.by, ageH: Math.round((now - (+d.v.at || +d.v._at || now)) / 36e5), status: d.v.status })).slice(0, 25);
out.noData = docs.filter(d => d.v.status !== 'done' && !d.v.data).map(d => ({ id: d.id, site: d.v.site, by: d.v.by, status: d.v.status, why: String(d.v.why || '').slice(0, 60) })).slice(0, 25);
const done = docs.filter(d => d.v.status === 'done');
out.doneNoDriveId = done.filter(d => !d.v.driveId).length;
out.doneNotShared = done.filter(d => d.v.shared === false || d.v.shareWhy).length;
out.movedFrom = docs.filter(d => d.v.movedFrom).map(d => ({ id: d.id, site: d.v.site, from: d.v.movedFrom }));
/* الدرايف: وجودُ الملف ومجلدُه */
const DC = driveClient(); const dr = DC.drive; if (DC.err) out.driveErr = DC.err;
const folderName = new Map(), miss = [], trashed = [], wrongFolder = [];
if (dr && dr.files){
  for (const d of done){
    if (!d.v.driveId) continue;
    try {
      const f = await dr.files.get({ fileId: d.v.driveId, fields: 'id,name,parents,trashed', supportsAllDrives: true });
      if (f.data.trashed){ trashed.push({ id: d.id, site: d.v.site }); continue; }
      const par = (f.data.parents || [])[0] || '';
      if (!folderName.has(par)){ try { const pf = await dr.files.get({ fileId: par, fields: 'name', supportsAllDrives: true }); folderName.set(par, pf.data.name || ''); } catch (e){ folderName.set(par, '?'); } }
      const fn = folderName.get(par) || '';
      if (!fn.startsWith(String(d.v.site || '') + ' ') && fn !== String(d.v.site || '')) wrongFolder.push({ id: d.id, site: d.v.site, folder: fn.slice(0, 60) });
    } catch (e){ miss.push({ id: d.id, site: d.v.site, code: (e && e.code) || '' }); }
  }
}
out.driveChecked = done.length; out.missing = miss.length; out.trashed = trashed.length; out.wrongFolder = wrongFolder.length;
out.samples = { missing: miss.slice(0, 15), trashed: trashed.slice(0, 10), wrongFolder: wrongFolder.slice(0, 25) };
writeFileSync('/tmp/exp/photos-diag.json', JSON.stringify(out));
console.log('photos', docs.length, JSON.stringify(st), '| missing', miss.length, '| wrongFolder', wrongFolder.length, '| trashed', trashed.length);
