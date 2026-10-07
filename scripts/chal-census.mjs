/* قراءةٌ فقط — تعدادُ التحديات وأسباب عدم المسح كما كُتبت في الميدان، تمهيدًا لتوحيدها في قائمةٍ قصيرة */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const norm = s => String(s || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة\b/g, 'ه').replace(/\s+/g, ' ').trim().toLowerCase();
const recs = await db.collection('recs').get();
const access = {}, chal = {}, other = {}, accNote = {}, fieldsSeen = {}; let visited = 0, reached = 0, quick = 0, quickNoAcc = 0, needRev = 0;
recs.forEach(d => { const r = d.data() || {}; if (r.deleted) return; visited++;
  Object.keys(r).forEach(k => fieldsSeen[k] = (fieldsSeen[k] || 0) + 1);
  const a = r.access || (r.quick ? '(زيارة سريعة بلا حالة)' : '(بلا حالة)'); access[a] = (access[a] || 0) + 1;
  if (r.quick) quick++; if (r.access === 'تم الوصول' || r.quick) reached++;
  (Array.isArray(r.chals) ? r.chals : []).forEach(c => { c = String(c || '').trim(); if (!c) return; chal[c] = (chal[c] || 0) + 1; });
  const isOther = (r.chals || []).some(c => /^أخرى/.test(String(c || '')));
  const txt = String(r.chal_note || r.chalNote || '').trim();
  if (isOther || txt){ const k = norm(txt || r.note || ''); if (k) other[k] = (other[k] || 0) + 1; }
  if (r.access && r.access !== 'تم الوصول'){ const n = norm(r.acc_note || r.accNote || r.access_note || r.why || r.note || ''); accNote[r.access + ' | ' + (n || '(بلا تفصيل)')] = (accNote[r.access + ' | ' + (n || '(بلا تفصيل)')] || 0) + 1; }
});
const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
writeFileSync('/tmp/exp/chal-census.json', JSON.stringify({ visited, reached, quick, access:top(access, 20), chals:top(chal, 60), distinctChals:Object.keys(chal).length,
  otherTexts:top(other, 150), distinctOther:Object.keys(other).length, accessNotes:top(accNote, 80), fields:top(fieldsSeen, 60) }));
console.log('ok', visited, Object.keys(chal).length, Object.keys(other).length);
