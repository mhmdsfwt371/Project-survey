/* (V28.7) قرارُ المالك: «مخيمات خالد المفروض اتزارت بس فيها تحديات» — نتيجةُ الزيارة «تم الوصول» والتحدياتُ كما سجّلها */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const now = Date.now(), out = [];
for (const id of ['NSK-ARF-CMP-0711', 'NSK-ARF-CMP-0712', 'NSK-ARF-CMP-0713']){
  const ref = db.collection('recs').doc(id), d = await ref.get(); if (!d.exists){ out.push({ id, skip:'لا زيارة' }); continue; }
  const v = d.data(); const was = v.access;
  if (v.access !== 'تم الوصول'){
    await ref.update({ access: 'تم الوصول', accessWas: was, accessFixBy: 'قرار المالك — V28.7', deleted: false, _at: now });
    await db.collection('events').doc('fx' + now.toString(36) + id.slice(-2)).set({ id: 'fx' + now.toString(36) + id.slice(-2), ts: now, at: '', day: new Date(now + 3 * 3600e3).toISOString().slice(0, 10), what: 'تصحيح نتيجة الزيارة — «' + was + '» ← «تم الوصول» (بتحدياتها) — ' + id + ' · قرار المالك', by: 'mohamed safwat', site: id, dev: 'fix-V28.7', _at: now });
  }
  out.push({ id, was, now: 'تم الوصول', chals: (v.chals || []).length, by: v.by });
}
writeFileSync('/tmp/exp/fix-khaled.json', JSON.stringify({ at: new Date().toISOString(), rows: out }));
console.log('fixed', out.filter(r => r.was && r.was !== 'تم الوصول').length);
