/* (V28.3) إصلاحُ المسوح المختفية: وثيقةُ recs عليها شاهدُ حذفٍ قديم {deleted:true} ثم مُسحت النقطةُ بعده فدُمج المسحُ الجديدُ
   تحت الشاهد — فمحتها الأجهزةُ كلُّها. تُستعاد وحدَها التي **آخرُ كتابةٍ فيها مسحٌ** لا حذف: تاريخُها ومنفِّذُها يطابقان آخرَ
   «مسح موقع» في سجلِّ الأحداث. لا يُطبَع في السجلّ إلا أعداد؛ القائمةُ إلى درايف المالك. */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const APPLY = process.env.HEAL_APPLY === '1';
const tombs = (await db.collection('recs').where('deleted', '==', true).get()).docs.map(d => ({ id: d.id, v: d.data() }));
const evs = (await db.collection('events').get()).docs.map(d => d.data() || {});
const byId = {}; evs.forEach(e => { const id = e.site || ''; if (!id) return; (byId[id] = byId[id] || []).push(e); });
const isSurvey = w => /^(مسح موقع|زيارةٌ سريعة|وسم زيارة) — /.test(w);
const isDel = w => /^(إلغاءُ الزيارة السريعة|إلغاء وسم زيارة|حذف|تصفير)/.test(w);
const full = v => ['access', 'mount', 'photos', 'chals', 'power', 'review'].some(k => v[k] != null && v[k] !== '' && !(Array.isArray(v[k]) && !v[k].length));
const out = []; let healed = 0;
for (const t of tombs){
  const E = (byId[t.id] || []).sort((a, b) => (+a.ts || 0) - (+b.ts || 0));
  const lastS = E.filter(e => isSurvey(String(e.what || ''))).pop(), lastD = E.filter(e => isDel(String(e.what || ''))).pop();
  const at = +t.v.at || 0, by = String(t.v.by || '');
  const lastWriteIsSurvey = !!lastS && Math.abs(at - (+lastS.ts || 0)) < 180000 && (!lastS.by || lastS.by === by) && (!lastD || (+lastS.ts || 0) > (+lastD.ts || 0));
  const row = { id: t.id, by, at: at ? new Date(at).toISOString() : null, lastSurvey: lastS ? new Date(+lastS.ts).toISOString() + ' · ' + lastS.by : null, lastDelete: lastD ? new Date(+lastD.ts).toISOString() + ' · ' + lastD.by + ' · ' + String(lastD.what).slice(0, 40) : null, full: full(t.v), heal: lastWriteIsSurvey };
  if (lastWriteIsSurvey && APPLY){
    const patch = { deleted: false, _at: Date.now(), healedAt: Date.now(), healedBy: 'V28.3' };
    if (full(t.v) && t.v.quick) patch.quick = 0;
    await db.collection('recs').doc(t.id).update(patch); healed++; row.healed = true;
  }
  out.push(row);
}
writeFileSync('/tmp/exp/heal-tombs.json', JSON.stringify({ at: new Date().toISOString(), apply: APPLY, tombs: tombs.length, candidates: out.filter(r => r.heal).length, healed, rows: out }));
console.log('tombstoned recs', tombs.length, '| last write is a survey', out.filter(r => r.heal).length, '| healed', healed);
