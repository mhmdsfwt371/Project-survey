/* (V29.7) قرارُ المالك: نقاطُ كاميرات LPR لمواقع التفويج الثلاثة «زيّ النورية» — دخولٌ، ومساراتُ فحص، وخروج — مقترحٌ مبدئيٌّ يُعدَّل على الخريطة.
   الزايدي: مركزُ الترحيب والاستقبال على طريق مكة–جدة السريع (٨ مسارات بحسب المنشور عنه)؛ والهجرة: موقعا المالك (الجموم قرب مكة، والأدلاء قرب المدينة). */
import admin from 'firebase-admin';
import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const now = Date.now();
const off = (c, de, dn) => [+(c[0] + dn / 110574).toFixed(7), +(c[1] + de / (111320 * Math.cos(c[0] * Math.PI / 180))).toFixed(7)];
const plan = (c, bearing, nIn, nLanes, nOut, gap) => { const b = bearing * Math.PI / 180, u = [Math.sin(b), Math.cos(b)], v = [-Math.cos(b), Math.sin(b)], P = [];
  for (let i = 0; i < nIn; i++){ const s = (i - (nIn - 1) / 2) * 15; P.push(['دخول ' + (nIn > 1 ? (i + 1) : ''), off(c, -gap * u[0] + s * v[0], -gap * u[1] + s * v[1])]); }
  for (let i = 0; i < nLanes; i++){ const s = (i - (nLanes - 1) / 2) * 10; P.push(['مسار ' + (i + 1), off(c, s * v[0], s * v[1])]); }
  for (let i = 0; i < nOut; i++){ const s = (i - (nOut - 1) / 2) * 15; P.push(['خروج ' + (nOut > 1 ? (i + 1) : ''), off(c, gap * u[0] + s * v[0], gap * u[1] + s * v[1])]); }
  return P; };
const SITES = [
  { pre:'NSK-ZYD-LPR-N', tt:'الزايدي', label:'الزايدي', region:'مركز الزايدي — طريق مكة جدة السريع', pts:plan([21.412247, 39.744221], 70, 2, 8, 2, 130) },
  { pre:'NSK-HJM-LPR-N', tt:'محطات طريق الهجرة', label:'طريق الهجرة (الجموم)', region:'مركز تفويج الحجاج — طريق الهجرة، الجموم', pts:plan([21.678187, 39.565172], 180, 1, 4, 1, 100) },
  { pre:'NSK-HJD-LPR-N', tt:'محطات طريق الهجرة', label:'طريق الهجرة (المدينة)', region:'شركة الأدلاء — مركز استقبال الحجاج، المدينة المنورة', pts:plan([24.340387, 39.554609], 180, 1, 4, 1, 100) }
];
const out = [];
for (const S of SITES){
  let i = 0;
  for (const [nm, ll] of S.pts){
    i++; const id = S.pre + String(i).padStart(3, '0');
    const ex = await db.collection('newsites').doc(id).get(); if (ex.exists){ out.push({ id, skip:'موجود' }); continue; }
    const name = 'كاميرا LPR — ' + S.label + ' — ' + nm.trim();
    const doc = { id, name, zone:'مواقع التفويج', type:'LPR', work:'موقع جديد', lat:ll[0], lng:ll[1], sq:'', sign:'', co:'', coReq:'', tents:0,
      tg:'مراكز التفويج', tt:S.tt, region:S.region, fstat:'لم يبدأ', inout:'', gate:/دخول/.test(nm) ? 'مدخل' : (/خروج/.test(nm) ? 'مخرج' : ''),
      reason:'نقطة جديدة لم تكن في السجل', why:'مقترحٌ مبدئيٌّ لموضع كاميرا LPR من دراسة الموقع — يُعدَّل على الخريطة', chals:[],
      isNew:true, approved:true, approvedBy:'mohamed safwat', origin:'office', by:'mohamed safwat', at:now, _at:now, _by:'tafweej-V29.7', proposed:true };
    await db.collection('newsites').doc(id).set(doc);
    out.push({ id, name, lat:ll[0], lng:ll[1] });
  }
}
const eid = 'tf' + now.toString(36);
await db.collection('events').doc(eid).set({ id:eid, ts:now, at:'', day:new Date(now + 3 * 3600e3).toISOString().slice(0, 10), what:'إضافة نقاط كاميرات LPR مقترحة لمواقع التفويج — الزايدي ١٢ · طريق الهجرة (الجموم) ٦ · طريق الهجرة (المدينة) ٦ · قرار المالك', by:'mohamed safwat', site:'', dev:'tafweej-V29.7', _at:now });
writeFileSync('/tmp/exp/add-tafweej-lpr.json', JSON.stringify({ at:new Date().toISOString(), added:out.filter(o => !o.skip).length, rows:out }));
console.log('added', out.filter(o => !o.skip).length);
