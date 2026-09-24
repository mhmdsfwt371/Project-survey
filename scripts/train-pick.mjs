/* ═══════════════════════════════════════════════════════════════════════════
   اختيارُ ما يركب القطار — node scripts/train-pick.mjs
   ───────────────────────────────────────────────────────────────────────────
   من التزامات فرع التجربة (الأحدثُ أوّلًا) يُختار أوّلُ التزامٍ حالتُه
   nusuk/gate = success. لا يُرقَّى أحمرُ ولا مجهولٌ قطّ. يقرأ الحالاتِ من
   واجهة GitHub حين يعمل في السير، ومن ملفٍّ في الفحص (TRAIN_FIXTURE).
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';
export function pick(commits){
  for (const c of commits){ if (c.state === 'success') return c; }
  return null;
}
if (process.argv[1] && process.argv[1].endsWith('train-pick.mjs')){
  let commits = [];
  if (process.env.TRAIN_FIXTURE){ commits = JSON.parse(readFileSync(process.env.TRAIN_FIXTURE, 'utf8')); }
  else {
    const repo = process.env.GITHUB_REPOSITORY, shas = execFileSync('git', ['log', '--format=%H', '-30', 'origin/staging'], { encoding:'utf8' }).trim().split('\n');
    for (const sha of shas){
      let state = 'unknown';
      try { const j = JSON.parse(execFileSync('gh', ['api', `repos/${repo}/commits/${sha}/status`], { encoding:'utf8' }));
            const g = (j.statuses || []).find(s => s.context === 'nusuk/gate'); state = g ? g.state : 'none'; } catch {}
      commits.push({ sha, state });
    }
  }
  const c = pick(commits);
  if (!c){ console.log('::notice title=القطارُ فارغ::لا التزامَ خضراءَ بوابتُه على فرع التجربة'); process.exit(0); }
  console.log(c.sha);
}
