/* قراءةٌ فقط — تفريغُ كلِّ ما سجّله الميدانُ لكلِّ نقطة (الزيارات والتحديات والملاحظات والتركيب وعددُ الصور) لملفّ التصنيف الذي طلبه المالك.
   يُكتب ملفًّا في الفرع نفسه (خاصٌّ بالمستودع) لا يمرّ بأيِّ شاشة. */
import admin from 'firebase-admin'; import { writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('exports', { recursive: true });
const all = async (c) => { const o = {}; (await db.collection(c).get()).forEach(d => { o[d.id] = d.data(); }); return o; };
const recs = await all('recs'), inss = await all('inss'), newsites = await all('newsites'), sites = await all('sites');
const ph = {}; (await db.collection('photos').get()).forEach(d => { const x = d.data() || {}; if (x.del) return; const s = x.site || String(d.id).replace(/-\d+$/, ''); ph[s] = (ph[s] || 0) + (x.driveId || x.link ? 1 : 0); });
const strip = (o) => { const r = {}; Object.keys(o || {}).forEach(k => { const v = o[k]; if (k === 'sig' || /^data/.test(k) || (typeof v === 'string' && v.length > 2000)) return; r[k] = v; }); return r; };
const out = { at:Date.now(), recs:{}, inss:{}, newsites:{}, sites:{}, photos:ph };
Object.keys(recs).forEach(k => out.recs[k] = strip(recs[k])); Object.keys(inss).forEach(k => out.inss[k] = { status:inss[k].status || '', at:inss[k].at || 0, deleted:!!inss[k].deleted });
Object.keys(newsites).forEach(k => out.newsites[k] = strip(newsites[k])); Object.keys(sites).forEach(k => out.sites[k] = { hidden:!!sites[k].hidden, deleted:!!sites[k].deleted });
writeFileSync('exports/points-full.json', JSON.stringify(out)); console.log('recs', Object.keys(out.recs).length);
