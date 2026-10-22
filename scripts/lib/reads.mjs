/* ═══════════════════════════════════════════════════════════════════════════
   عدّادُ قراءات مهامِّ الخادم — import { countReads } from './lib/reads.mjs'
   ───────────────────────────────────────────────────────────────────────────
   (V38.84) الجوالاتُ تعدّ قراءاتِها يومًا بيوم (rdh_…)، وعدّاداتُ جوجل تعدّ
   الكلَّ — وبينهما قرابةُ ٩٨٪ بلا اسم: مهامُّ الخادم. فكلُّ مهمّةٍ تعدّ ما
   تقرؤه هنا: تُلفّ get() للاستعلام والوثيقة وgetAll وget() للتجميع، ويُضاف
   العددُ عند خروج العملية إلى ملفٍّ مؤقّتٍ بيوم فوترة جوجل؛ ثم يرفعه
   reads-flush.mjs مرةً في آخر المهمّة إلى settings/jobreads، فتسمّي بطاقةُ
   «تكلفة قاعدة البيانات» كلَّ مهمّةٍ بقراءاتها. لا يغيّر شيئًا مما تفعله المهمّة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, existsSync } from 'fs';

export const READS_FILE = process.env.NUSUK_READS_FILE || '/tmp/nusuk-reads.json';
const st = { n: 0, job: '', on: false };
let fmt = null;
export function billDay(ts){
  const d = new Date(ts || Date.now());
  try {
    if (!fmt) fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' });
    const s = fmt.format(d); if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  } catch {}
  return new Date(d.getTime() - 7 * 3600000).toISOString().slice(0, 10);
}
/* adds n reads of a job on a day to the counter file — several processes of one job (the photo loop) add up */
export function readsAdd(file, job, day, n){
  let m = {};
  try { if (existsSync(file)) m = JSON.parse(readFileSync(file, 'utf8') || '{}') || {}; } catch { m = {}; }
  m[job] = m[job] || {}; m[job][day] = (m[job][day] || 0) + n;
  writeFileSync(file, JSON.stringify(m));
  return m;
}
export function countReads(admin, job){
  st.job = job;
  if (st.on) return st;
  st.on = true;
  const F = admin && admin.firestore;
  const wrap = (proto, key, count) => {
    if (!proto || typeof proto[key] !== 'function' || proto[key].__nsk) return;
    const orig = proto[key];
    const w = async function(...a){ const r = await orig.apply(this, a); try { st.n += count(r); } catch {} return r; };
    w.__nsk = 1; proto[key] = w;
  };
  try {
    wrap(F && F.Query && F.Query.prototype, 'get', r => Math.max(1, (r && r.size) || 0));   /* a query bills one read even when empty */
    wrap(F && F.DocumentReference && F.DocumentReference.prototype, 'get', () => 1);
    wrap(F && F.Firestore && F.Firestore.prototype, 'getAll', r => (r || []).length);
    wrap(F && F.AggregateQuery && F.AggregateQuery.prototype, 'get', () => 1);
  } catch {}
  process.on('exit', () => { if (st.n) { try { readsAdd(READS_FILE, st.job, billDay(), st.n); } catch {} } });
  return st;
}
