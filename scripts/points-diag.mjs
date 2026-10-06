/* (V32.2) قراءةٌ فقط: (١) لماذا ١٬٩٠٤ نقطةً لا ١٬٨٠٧ — تفصيلُ الإضافات، (٢) التحريكاتُ المحفوظةُ زياراتٍ (rec.loc) وما أنشأ منها «زيارةً» بلا مسح،
   (٣) نقاطُ النورية بإحداثياتها الفعلية لحساب الكاميرات الثلاث الناقصة. */
import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const get = async c => (await db.collection(c).get()).docs.map(d => ({ id:d.id, v:d.data() || {} }));
const [ns, sites, recs] = await Promise.all([get('newsites'), get('sites'), get('recs')]);
const html = readFileSync('index.html', 'utf8'); const baked = (html.match(/NSK-[A-Z]{3}-[A-Z]{3}-\d{4}/g) || []); const bakedSet = new Set(baked);
const ov = Object.fromEntries(sites.map(d => [d.id, d.v]));
const nsVis = ns.filter(d => !d.v.hidden && !d.v.deleted && +d.v.lat && +d.v.lng);
const byPre = {}; nsVis.forEach(d => { const k = d.id.split('-').slice(0, 3).join('-'); byPre[k] = (byPre[k] || 0) + 1; });
const byOrigin = {}; nsVis.forEach(d => { const k = (d.v.origin || (d.v._by || '').slice(0, 20) || 'field') + '|' + (d.v.tt || d.v.zone || ''); byOrigin[k] = (byOrigin[k] || 0) + 1; });
const hiddenBaked = Object.entries(ov).filter(([id, v]) => v && v.hidden && bakedSet.has(id)).length;
/* التحريكاتُ في الزيارات */
const SURVEY = /^(access|mount|chals|photos|h1|h2|fit|power|note|n_ant|n_rdr|n_cam|wid_m|equip|metal|civil|crew_n|hours)$/;
const moved = recs.filter(d => d.v.loc && +d.v.loc.lat).map(d => ({ id:d.id, by:d.v.loc.by || d.v.by || '', at:d.v.loc.at || d.v.at || 0, onlyMove:!Object.keys(d.v).some(k => SURVEY.test(k)), ovLL:!!(ov[d.id] && +ov[d.id].lat), lat:+d.v.loc.lat, lng:+d.v.loc.lng }));
/* النورية */
const nuw = ns.filter(d => /^NSK-NEW-LPR-N/.test(d.id)).map(d => { const m = moved.find(x => x.id === d.id), o = ov[d.id]; const lat = o && +o.lat ? +o.lat : (m ? m.lat : +d.v.lat), lng = o && +o.lng ? +o.lng : (m ? m.lng : +d.v.lng); return { id:d.id, name:d.v.name || '', lat, lng, hidden:!!d.v.hidden }; }).sort((a, b) => a.id < b.id ? -1 : 1);
const out = { at:new Date().toISOString(), bakedIds:bakedSet.size, newsitesTotal:ns.length, newsitesVisible:nsVis.length, newsitesNotBaked:nsVis.filter(d => !bakedSet.has(d.id)).length, hiddenBaked, byPre, byOrigin,
  moved:{ total:moved.length, onlyMove:moved.filter(x => x.onlyMove).length, list:moved.slice(0, 80) }, nuw };
writeFileSync('/tmp/exp/points-diag.json', JSON.stringify(out));
console.log(JSON.stringify({ baked:out.bakedIds, nsVis:out.newsitesVisible, notBaked:out.newsitesNotBaked, hiddenBaked, moved:out.moved.total, onlyMove:out.moved.onlyMove, nuw:nuw.length }));
