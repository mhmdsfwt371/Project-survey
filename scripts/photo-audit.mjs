/* قراءةٌ فقط — «هل الصورُ موجودةٌ على الدرايف؟»: ما التقطه الميدانُ (في الزيارة) مقابل ما وصل القاعدةَ بمعرّف درايف، لكلِّ نقطةٍ وفنيّ */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const T = ts => ts ? new Date(+ts + 3 * 3600e3).toISOString().slice(0, 16).replace('T', ' ') : '';
const ph = await db.collection('photos').get(); const bySite = {}; let docs = 0, withDrive = 0, deleted = 0, errors = 0;
ph.forEach(d => { const x = d.data() || {}; docs++; if (x.del){ deleted++; return; } if (x.driveId) withDrive++; if (x.status === 'error') errors++;
  const s = x.site || String(d.id).replace(/-\d+$/, ''); (bySite[s] = bySite[s] || { up:0, drive:0, kinds:[] }); bySite[s].up++; if (x.driveId) bySite[s].drive++; bySite[s].kinds.push(x.kind || ''); });
const recs = await db.collection('recs').get(); let expected = 0, recsWith = 0; const missing = [], partial = [], byTech = {};
recs.forEach(d => { const r = d.data() || {}; if (r.deleted) return; const n = Math.max(+r.phN || 0, Array.isArray(r.photos) ? r.photos.length : 0); if (!n) return;
  recsWith++; expected += n; const got = (bySite[d.id] || {}).drive || 0; const who = r.by || '—';
  if (!got){ missing.push({ id:d.id, by:who, at:T(r.at), n }); (byTech[who] = byTech[who] || { miss:0, pts:0, part:0 }); byTech[who].miss += n; byTech[who].pts++; }
  else if (got < n){ partial.push({ id:d.id, by:who, got, n }); (byTech[who] = byTech[who] || { miss:0, pts:0, part:0 }); byTech[who].part++; byTech[who].miss += n - got; } });
const one = (bySite['NSK-MIN-CMP-0486'] || null), r0486 = (await db.collection('recs').doc('NSK-MIN-CMP-0486').get()).data() || {};
writeFileSync('/tmp/exp/photo-audit.json', JSON.stringify({ at:T(Date.now()), docs, withDrive, deleted, errors, recsWith, expected,
  sitesWithPhotos:Object.keys(bySite).length, missingPts:missing.length, partialPts:partial.length, byTech,
  sample0486:{ docs:one, rec:{ by:r0486.by, at:T(r0486.at), phN:r0486.phN, photos:r0486.photos } },
  missing:missing.sort((a, b) => a.at < b.at ? 1 : -1).slice(0, 120), partial:partial.slice(0, 60) }));
console.log('ok docs', docs, 'expected', expected, 'missing pts', missing.length);
