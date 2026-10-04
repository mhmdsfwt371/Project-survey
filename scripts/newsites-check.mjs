/* المواقع المضافة ميدانيًّا: هل هي حقيقيةٌ على الخريطة؟ مراكزُ التفويج (الزايدي والهجرة والنورية) وكلُّ موقعٍ بإحداثياتٍ خارج نطاق المشاعر — قراءةٌ فقط */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const ns = (await db.collection('newsites').get()).docs.map(d => ({ id: d.id, v: d.data() || {} }));
const ov = {}; (await db.collection('sites').get()).docs.forEach(d => { ov[d.id] = d.data() || {}; });
const rec = {}; (await db.collection('recs').get()).docs.forEach(d => { const v = d.data() || {}; if (v.deleted !== true) rec[d.id] = { at: v.at, by: v.by, access: v.access }; });
const inBox = (la, lo) => la > 21.30 && la < 21.50 && lo > 39.80 && lo < 40.05;
const row = x => ({ id: x.id, name: String(x.v.name || '').slice(0, 70), zone: x.v.zone || '', type: x.v.type || '', lat: +x.v.lat || 0, lng: +x.v.lng || 0, inBox: inBox(+x.v.lat, +x.v.lng), hidden: !!x.v.hidden, deleted: !!x.v.deleted, by: x.v.by || '', at: x.v.at ? new Date(+x.v.at).toISOString().slice(0, 10) : '', tg: (ov[x.id] || {}).tg || x.v.tg || '', tt: (ov[x.id] || {}).tt || x.v.tt || '', visited: !!rec[x.id] });
const tafweej = ns.filter(x => /الزايد|الهجرة|النوري|النوار|التفويج/.test(String(x.v.name || '') + ' ' + String(x.v.zone || ''))).map(row);
const outside = ns.filter(x => !x.v.deleted && !x.v.hidden && !inBox(+x.v.lat, +x.v.lng)).map(row);
const byZT = {}; ns.filter(x => !x.v.deleted && !x.v.hidden).forEach(x => { const k = (x.v.zone || '?') + ' · ' + (x.v.type || '?'); byZT[k] = (byZT[k] || 0) + 1; });
writeFileSync('/tmp/exp/newsites-check.json', JSON.stringify({ at: new Date().toISOString(), total: ns.length, alive: ns.filter(x => !x.v.deleted && !x.v.hidden).length, byZoneType: byZT, tafweej, outside }));
console.log('newsites', ns.length, '| tafweej', tafweej.length, '| outside box', outside.length);
