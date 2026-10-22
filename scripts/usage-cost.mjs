#!/usr/bin/env node
/* ═══ (V38.80) تكلفةُ قاعدة البيانات يومًا بيوم — من عدّادات جوجل نفسِها ═══
   Google bills on its own counters, not on what the phones count: the server jobs (backup, photo bridge, ministry
   snapshots) read the database too, and a phone only counts what the app counts. Until now nothing kept the daily
   numbers — the morning pulse wrote a 6:30 snapshot of "today so far" and overwrote it the next day — so the owner
   could not tell what any period cost him.

   This job asks Cloud Monitoring (with the project's own Firebase service account) for the real reads, writes and
   deletes per hour since the database was created, folds them into Google billing days (America/Los_Angeles —
   the free quota resets at midnight Pacific), adds the stored size per day, merges each device's own per-day log
   carried on its presence beat (rdh_<device>, keeping the highest count seen for a day), and writes ONE document,
   settings/cost, that the «تكلفة قاعدة البيانات» card filters by any period. It runs every three hours; the whole
   history is re-read each time, so a missed run loses nothing. */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const SA = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!SA){ console.log('::warning::FIREBASE_SERVICE_ACCOUNT غيرُ موجود — لا سحب'); process.exit(0); }
let admin; try { admin = require('firebase-admin'); } catch { console.log('::warning::firebase-admin غيرُ مثبَّت — لا سحب'); process.exit(0); }
const sa = JSON.parse(SA);
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const P = sa.project_id;
const START = '2026-07-30T00:00:00Z';                       /* the database was created on 30-31 July 2026 */
/* eur3 (Europe multi-region) — Firestore Standard: reads $0.06, writes $0.18, deletes $0.02 per 100,000 beyond the
   daily free quota; storage $0.18 per GiB-month beyond 1 GiB; internet transfer $0.12/GiB beyond 10 GiB a month */
const PRICE = { loc: 'eur3', r: 0.06, w: 0.18, d: 0.02, s: 0.18, fx: 3.75, fr: 50000, fw: 20000, fd: 20000, fs: 1, tx: 0.12, ftx: 10 };
const pac = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' });

const tok = (await admin.credential.cert(sa).getAccessToken()).access_token;
const H = { Authorization: 'Bearer ' + tok };
async function get(url){
  try { const r = await fetch(url, { headers: H }); const t = await r.text(); let b; try { b = JSON.parse(t); } catch { b = t.slice(0, 300); } return { st: r.status, b }; }
  catch (e){ return { st: 0, b: String(e.message) }; }
}
const em = b => (b && b.error) ? (b.error.status + ': ' + String(b.error.message).slice(0, 160)) : String(b).slice(0, 160);

async function series(type, aligner, period){
  const by = {}; let tk = '', pages = 0;
  do {
    const q = new URLSearchParams({ filter: `metric.type = "${type}"`, 'interval.startTime': START, 'interval.endTime': new Date().toISOString(),
      'aggregation.alignmentPeriod': period, 'aggregation.perSeriesAligner': aligner, 'aggregation.crossSeriesReducer': 'REDUCE_SUM', pageSize: '100000' });
    if (tk) q.set('pageToken', tk);
    const x = await get(`https://monitoring.googleapis.com/v3/projects/${P}/timeSeries?` + q);
    if (x.st !== 200) return { err: x.st + ' ' + em(x.b), by };
    (x.b.timeSeries || []).forEach(ts => (ts.points || []).forEach(p => {
      const end = new Date(new Date(p.interval.endTime).getTime() - 1000), k = pac.format(end);
      const v = +(p.value.int64Value ?? p.value.doubleValue ?? 0);
      by[k] = aligner === 'ALIGN_SUM' ? (by[k] || 0) + v : Math.max(by[k] || 0, v);
    }));
    tk = x.b.nextPageToken || ''; pages++;
  } while (tk && pages < 20);
  return { err: '', by };
}

const db = await get(`https://firestore.googleapis.com/v1/projects/${P}/databases/(default)`);
const loc = db.st === 200 ? db.b.locationId : '';
if (loc && loc !== PRICE.loc) console.log(`::warning::القاعدةُ في ${loc} لا ${PRICE.loc} — راجع الأسعار في scripts/usage-cost.mjs`);

const R = await series('firestore.googleapis.com/document/read_count', 'ALIGN_SUM', '3600s');
if (R.err){ console.log('::warning::تعذّر سحبُ عدّادات جوجل: ' + R.err); process.exit(0); }
const W = await series('firestore.googleapis.com/document/write_count', 'ALIGN_SUM', '3600s');
const D = await series('firestore.googleapis.com/document/delete_count', 'ALIGN_SUM', '3600s');
const S = await series('firestore.googleapis.com/storage/data_and_index_storage_bytes', 'ALIGN_MAX', '86400s');
const g = {};
[...new Set([...Object.keys(R.by), ...Object.keys(W.by), ...Object.keys(D.by)])].sort().forEach(k => {
  g[k] = [Math.round(R.by[k] || 0), Math.round(W.by[k] || 0), Math.round(D.by[k] || 0), Math.round(S.by[k] || 0)];
});

/* each device's own per-day log, from the presence beats — the highest count seen for a day wins */
const fsdb = admin.firestore();
const old = await fsdb.collection('settings').doc('cost').get();
const dev = (old.exists && old.data().dev) || {};
const pres = await fsdb.collection('presence').get();
pres.forEach(doc => {
  const p = doc.data() || {};
  Object.keys(p).filter(k => /^rdh_[A-Za-z0-9]{1,16}$/.test(k)).forEach(k => {
    let m = {}; try { m = JSON.parse(p[k] || '{}') || {}; } catch {}
    const key = doc.id.slice(0, 40) + '_' + k.slice(4);
    const x = dev[key] = dev[key] || { u: doc.id, n: '', ro: '', ua: '', d: {} };
    x.n = p.name || x.n; x.ro = p.role || x.ro;
    if (String(p.dev || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 16) === k.slice(4)) x.ua = String(p.ua || '').slice(0, 80);
    Object.keys(m).forEach(day => { if (/^\d{4}-\d{2}-\d{2}$/.test(day)) x.d[day] = Math.max(+x.d[day] || 0, Math.round(+m[day] || 0)); });
  });
});
/* one document stays far below Firestore's 1 MiB: devices keep 120 days, then 60 if it grows too big */
const trim = days => { const cut = pac.format(new Date(Date.now() - days * 864e5)); Object.values(dev).forEach(x => { Object.keys(x.d || {}).forEach(d => { if (d < cut) delete x.d[d]; }); }); };
trim(120);
if (JSON.stringify(dev).length > 700000) trim(60);
Object.keys(dev).forEach(k => { if (!Object.keys(dev[k].d || {}).length) delete dev[k]; });

await fsdb.collection('settings').doc('cost').set({ at: Date.now(), loc: loc || PRICE.loc, price: PRICE, g, dev }, { merge: false });

/* the run's summary, in the log: total reads and what they cost */
let reads = 0, usd = 0;
Object.keys(g).forEach(k => { const a = g[k]; reads += a[0]; usd += Math.max(0, a[0] - PRICE.fr) / 1e5 * PRICE.r + Math.max(0, a[1] - PRICE.fw) / 1e5 * PRICE.w + Math.max(0, a[2] - PRICE.fd) / 1e5 * PRICE.d; });
console.log(`✓ settings/cost: ${Object.keys(g).length} يومًا · ${reads.toLocaleString('en')} قراءة · $${usd.toFixed(2)} = ${(usd * PRICE.fx).toFixed(1)} ريال · ${Object.keys(dev).length} جهازًا`);
