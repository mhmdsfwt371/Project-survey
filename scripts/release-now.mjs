/* ═══ (V38.11) النشرُ الفوريُّ بالترتيب الصحيح — GH_TOKEN=… node scripts/release-now.mjs [--dry] ═══
   ق-٠٢٠: لا ترقيةَ يدويةَ بلا القائمة الكاملة. والترتيبُ يُخطأ باليد مرّتين: الترقيةُ فورَ اخضرار بوابة
   الدفع تتخطّى القائمةَ الكاملة (V38.5 → V38.8)، وتشغيلُ القائمة الكاملة قبل أن تنتهي بوابةُ الدفع
   يلغيها (تشاركان مجموعةَ التزامن) فلا تُكتَب حالةُ nusuk/gate (V38.10). هذه الأداةُ تمشي الخطواتِ بالترتيب:
     ١ الالتزامُ المحليُّ هو رأسُ staging المدفوع
     ٢ انتظارُ بوابة الدفع (nusuk/gate) حتى «open»
     ٣ تشغيلُ القائمة الكاملة على staging (الشرائحُ الأربع) وانتظارُ اخضرارها
     ٤ تشغيلُ القطار، ثم التحقّقُ أن الأصلَ صار هذا الالتزام
     ٥ انتظارُ النشر وفحصِ ما بعد النشر على الأصل
   --dry يقرأ الحالةَ ويطبع الخطةَ بلا تشغيلِ شيء. التوكنُ من البيئة وحدَها — لا يُكتَب في ملف. */
import { execFileSync } from 'child_process';

const REPO = process.env.GH_REPO || 'mhmdsfwt371/Project-survey';
const TOKEN = process.env.GH_TOKEN || '';
const DRY = process.argv.includes('--dry');
const say = s => console.log(s);
const die = s => { console.log('✗ ' + s); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (!TOKEN) die('GH_TOKEN غيرُ مضبوط — صدّره من بيئتك (لا يُكتَب في ملف)');

const api = async (path, opt = {}) => {
  const r = await fetch('https://api.github.com/repos/' + REPO + path, {
    ...opt, headers:{ Authorization:'Bearer ' + TOKEN, Accept:'application/vnd.github+json', ...(opt.headers || {}) } });
  if (opt.method === 'POST') return r.status;
  if (!r.ok) throw new Error(path + ' ' + r.status);
  return r.json();
};
const until = async (what, fn, mins) => {
  const end = Date.now() + mins * 60000;
  for (;;){
    const v = await fn(); if (v) return v;
    if (Date.now() > end) die('انتهت المهلة (' + mins + ' دقيقة) وأنا أنتظر: ' + what);
    await sleep(20000);
  }
};

const git = (...a) => execFileSync('git', a, { encoding:'utf8' }).trim();
const sha = git('rev-parse', 'HEAD');
const st = (await api('/branches/staging')).commit.sha;
say('الالتزام: ' + sha.slice(0, 8) + ' · رأسُ staging: ' + st.slice(0, 8));
if (st !== sha) die('الالتزامُ المحليُّ ليس رأسَ staging — ادفع إلى staging أولًا (git push origin HEAD:staging)');
const main0 = (await api('/branches/main')).commit.sha;
if (main0 === sha){ say('✓ الأصلُ على هذا الالتزام أصلًا — لا شيءَ يُرقَّى'); process.exit(0); }

say('٢ · بوابةُ الدفع (nusuk/gate)…');
const gateNow = async () => { const s = await api('/commits/' + sha + '/statuses'); const g = s.find(x => x.context === 'nusuk/gate'); return g ? g.state : ''; };
if (DRY){ say('   الآن: ' + ((await gateNow()) || 'لم تُكتَب بعد')); say('٣ · ستُشغَّل القائمةُ الكاملةُ على staging · ٤ القطار · ٥ النشر — (--dry: لا شيءَ شُغِّل)'); process.exit(0); }
const g = await until('بوابة الدفع', async () => { const v = await gateNow(); return v && v !== 'pending' ? v : ''; }, 25);
if (g !== 'success') die('بوابةُ الدفع ' + g + ' — اقرأ تعليقاتِ الالتزام لسبب السقوط');
say('   ✓ مفتوحة');

say('٣ · القائمةُ الكاملةُ على staging (الشرائحُ الأربع)…');
/* (V38.42) resumable: if this commit already has a full-list run (from an earlier attempt that died mid-way, or a
   run still going), reuse it instead of dispatching a second one — the tool can be started again at any point */
const prior = ((await api('/actions/workflows/docs-check.yml/runs?branch=staging&event=workflow_dispatch&per_page=10')).workflow_runs || [])
  .filter(r => r.head_sha === sha && (r.status !== 'completed' || r.conclusion === 'success'))[0];
let run = prior;
/* (V38.82) the gate now starts the full list itself on the server — wait for that run before starting one here,
   so this tool only watches (and stays the fallback if the server's link did not fire) */
if (!run){
  const findRun = async () => ((await api('/actions/workflows/docs-check.yml/runs?branch=staging&event=workflow_dispatch&per_page=10')).workflow_runs || [])
    .filter(r => r.head_sha === sha && (r.status !== 'completed' || r.conclusion === 'success'))[0] || null;
  for (let i = 0; i < 9 && !run; i++){ await sleep(20000); run = await findRun(); }
  if (run) say('   ↻ القائمةُ الكاملةُ انطلقت من البوابة على الخادم — تُتابَع لا تُعاد');
}
if (prior) say('   ↻ قائمةٌ كاملةٌ موجودةٌ لهذا الالتزام (' + prior.status + ') — تُستكمَل لا تُعاد');
else if (!run) {
  const t0 = new Date(Date.now() - 60000).toISOString();
  const c1 = await api('/actions/workflows/docs-check.yml/dispatches', { method:'POST', body:JSON.stringify({ ref:'staging' }) });
  if (c1 !== 204) die('تعذّر تشغيلُ القائمة الكاملة (' + c1 + ')');
  run = await until('بدء القائمة الكاملة', async () => {
    const j = await api('/actions/workflows/docs-check.yml/runs?branch=staging&event=workflow_dispatch&per_page=5');
    return (j.workflow_runs || []).find(r => r.head_sha === sha && r.created_at >= t0) || null;
  }, 5);
}
const done = await until('اكتمال الشرائح', async () => { const r = await api('/actions/runs/' + run.id); return r.status === 'completed' ? r : null; }, 40);
const jobs = (await api('/actions/runs/' + run.id + '/jobs?per_page=30')).jobs || [];
const shards = jobs.filter(j => /^shards/.test(j.name)), badJ = shards.filter(j => j.conclusion !== 'success');
if (shards.length < 4 || badJ.length || done.conclusion !== 'success') die('القائمةُ الكاملةُ لم تخضرّ: ' + (badJ.map(j => j.name).join(' · ') || done.conclusion) + ' — لا ترقية');
/* (V38.18) الشريحةُ الساقطةُ لا تُسقِط مهمّتَها — تكتب «FAIL» وتبقى خضراء، وتعليقُها على الالتزام قد لا يُكتَب في
   التشغيل اليدويّ. فمرّ V38.17 بجردٍ ساقطٍ في الشريحة ٢ (العلامةُ البيضاء). الحكمُ من تعليقات المهمّة نفسِها
   (annotations): «فحصٌ ساقط» أو «الشريحة N سقطت» = لا ترقية */
const red = [];
for (const j of shards){
  const an = await api('/check-runs/' + j.id + '/annotations');
  (an || []).forEach(a => { if (a.annotation_level === 'failure' || /الشريحة\s*\d+\s*سقطت/.test(a.message || '')) red.push(j.name + ': ' + String(a.message || '').split('\n')[0].slice(0, 160)); });
}
if (red.length) die('القائمةُ الكاملةُ فيها ما سقط — لا ترقية:\n   ' + red.slice(0, 6).join('\n   '));
say('   ✓ الشرائحُ الأربعُ خضراء');

say('٤ · القطار…');
/* (V38.42) resumable: skip the train when the commit is already on main */
const mainHas = async () => { const h = (await api('/branches/main')).commit.sha; if (h === sha) return true;
  const c = await api('/compare/' + sha + '...' + h); return !!(c && (c.status === 'ahead' || c.status === 'identical')); };
let onMain = await mainHas();
/* (V38.82) the chain job promotes on the server right after the shards — give it its minutes before a train of ours */
for (let i = 0; i < 15 && !onMain; i++){ await sleep(20000); onMain = await mainHas(); }
if (onMain) say('   ↻ الأصلُ يحتوي الالتزام — رقّاه الخادم، لا قطارَ ثانيًا');
else {
  const c2 = await api('/actions/workflows/train.yml/dispatches', { method:'POST', body:JSON.stringify({ ref:'main' }) });
  if (c2 !== 204) die('تعذّر تشغيلُ القطار (' + c2 + ')');
}
/* (V38.18) القطارُ يدمج فوق التزام النسخة الاحتياطية اليوميّ فيصنع التزامَ دمج — فالسؤال: هل الأصلُ «يحتوي» الالتزام؟ لا «يساويه» */
let mainSha = '';
await until('ترقية الأصل', async () => {
  const h = (await api('/branches/main')).commit.sha; if (h === sha){ mainSha = h; return true; }
  const c = await api('/compare/' + sha + '...' + h);
  if (c && (c.status === 'ahead' || c.status === 'identical')){ mainSha = h; return true; }
  return false;
}, 15);
say('   ✓ الأصلُ يحتوي ' + sha.slice(0, 8) + (mainSha !== sha ? ' (دمجٌ ' + mainSha.slice(0, 8) + ')' : ''));

say('٥ · النشرُ وفحصُ ما بعد النشر…');
const ok = await until('النشر والفحص', async () => {
  const j = await api('/actions/runs?branch=main&per_page=40');
  const mine = (j.workflow_runs || []).filter(r => r.head_sha === mainSha);
  const pick = n => mine.filter(r => r.name === n && r.conclusion !== 'skipped')[0];
  const pg = pick('pages build and deployment'), sm = pick('Post-deploy smoke');
  if (pg && pg.status === 'completed' && sm && sm.status === 'completed') return { pg:pg.conclusion, sm:sm.conclusion };
  return null;
}, 20);
if (ok.pg !== 'success' || ok.sm !== 'success') die('النشر ' + ok.pg + ' · فحصُ ما بعد النشر ' + ok.sm);
say('✓ على الإنتاج: ' + sha.slice(0, 8) + ' — النشرُ وفحصُ ما بعد النشر أخضران (الجردُ الكاملُ على الأصل يكمل وحدَه)');
