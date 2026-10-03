/* الأجهزةُ على نسخٍ قديمة: من هي، ومتى ظهرت، وهل كتبت حذفًا (شاهدًا) لزيارة في ٣٠ يومًا — قراءةٌ فقط */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const vnum = v => { const m = /V(\d+)\.(\d+)/.exec(String(v || '')); return m ? +m[1] * 1000 + +m[2] : 0; };
const P = (await db.collection('presence').get()).docs.map(d => ({ id: d.id, v: d.data() || {} }));
const now = Date.now(), CUR = vnum('V28.3');
const old = P.filter(p => vnum(p.v.ver) && vnum(p.v.ver) < CUR).map(p => ({ dev: p.id.slice(0, 10), user: p.v.name || p.v.user || p.v.by || '', role: p.v.role || '', ver: p.v.ver, lastSeenH: Math.round((now - (+p.v.at || 0)) / 36e5), q: +p.v.q || 0, pz: +p.v.pz || 0 }))
  .sort((a, b) => a.lastSeenH - b.lastSeenH);
/* شواهدُ الزيارات في ٣٠ يومًا ومن كتبها */
const since = now - 30 * 864e5;
const ev = (await db.collection('events').where('ts', '>=', since).get()).docs.map(d => d.data() || {}).filter(e => /^(إلغاءُ الزيارة السريعة|إلغاء المسح|تراجع عن الزيارة|حذف زيارة)/.test(String(e.what || '')) || /markSurvey|تمت الزيارة — إلغاء/.test(String(e.what || '')));
const vers = {}; P.forEach(p => { const k = p.v.ver || '?'; vers[k] = (vers[k] || 0) + 1; });
writeFileSync('/tmp/exp/old-devices.json', JSON.stringify({ at: new Date().toISOString(), devices: P.length, byVersion: vers, old, cancelEvents30d: ev.length, cancelSamples: ev.slice(0, 10).map(e => ({ day: e.day, by: e.by, what: String(e.what).slice(0, 80) })) }));
console.log('devices', P.length, '| old', old.length);
