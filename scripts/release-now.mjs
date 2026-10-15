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
const t0 = new Date(Date.now() - 60000).toISOString();
const c1 = await api('/actions/workflows/docs-check.yml/dispatches', { method:'POST', body:JSON.stringify({ ref:'staging' }) });
if (c1 !== 204) die('تعذّر تشغيلُ القائمة الكاملة (' + c1 + ')');
const run = await until('بدء القائمة الكاملة', async () => {
  const j = await api('/actions/workflows/docs-check.yml/runs?branch=staging&event=workflow_dispatch&per_page=5');
  return (j.workflow_runs || []).find(r => r.head_sha === sha && r.created_at >= t0) || null;
}, 5);
const done = await until('اكتمال الشرائح', async () => { const r = await api('/actions/runs/' + run.id); return r.status === 'completed' ? r : null; }, 40);
const jobs = (await api('/actions/runs/' + run.id + '/jobs?per_page=30')).jobs || [];
const shards = jobs.filter(j => /^shards/.test(j.name)), badJ = shards.filter(j => j.conclusion !== 'success');
if (shards.length < 4 || badJ.length || done.conclusion !== 'success') die('القائمةُ الكاملةُ لم تخضرّ: ' + (badJ.map(j => j.name).join(' · ') || done.conclusion) + ' — لا ترقية');
say('   ✓ الشرائحُ الأربعُ خضراء');

say('٤ · القطار…');
const c2 = await api('/actions/workflows/train.yml/dispatches', { method:'POST', body:JSON.stringify({ ref:'main' }) });
if (c2 !== 204) die('تعذّر تشغيلُ القطار (' + c2 + ')');
await until('ترقية الأصل', async () => (await api('/branches/main')).commit.sha === sha, 10);
say('   ✓ الأصلُ صار ' + sha.slice(0, 8));

say('٥ · النشرُ وفحصُ ما بعد النشر…');
const ok = await until('النشر والفحص', async () => {
  const j = await api('/actions/runs?branch=main&per_page=40');
  const mine = (j.workflow_runs || []).filter(r => r.head_sha === sha);
  const pick = n => mine.filter(r => r.name === n && r.conclusion !== 'skipped')[0];
  const pg = pick('pages build and deployment'), sm = pick('Post-deploy smoke');
  if (pg && pg.status === 'completed' && sm && sm.status === 'completed') return { pg:pg.conclusion, sm:sm.conclusion };
  return null;
}, 20);
if (ok.pg !== 'success' || ok.sm !== 'success') die('النشر ' + ok.pg + ' · فحصُ ما بعد النشر ' + ok.sm);
say('✓ على الإنتاج: ' + sha.slice(0, 8) + ' — النشرُ وفحصُ ما بعد النشر أخضران');
