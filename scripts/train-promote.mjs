/* ═══════════════════════════════════════════════════════════════════════════
   الترقيةُ إلى الأصل — node scripts/train-promote.mjs <sha>
   ───────────────────────────────────────────────────────────────────────────
   يرقّي الالتزامَ الذي فُحص بعينه إلى main تقدُّمًا سريعًا. وإن كان الأصلُ قد
   تقدّم بالتزامٍ لا يمسُّ إلا ملفَّي أعداد النسخ (backups/latest) دُمج فوقه —
   الشجرةُ المفحوصةُ هي هي، والأعدادُ ليست شيفرة. وإن تقدّم بغير ذلك لا يُرقَّى
   ويُقال السبب — بلا تشغيلٍ أحمر. يعمل داخل سير السحابة بحساب الدفع.
   ═════════════════════════════════════════════════════════════════════════ */
import { execFileSync } from 'child_process';
const sha = process.argv[2];
const git = (...a) => execFileSync('git', a, { encoding:'utf8' }).trim();
const say = s => console.log(s);
export function promoteDecision(isAncestor, changedOnMain){
  if (isAncestor) return { ok:true, how:'ff' };
  if (changedOnMain.length && changedOnMain.every(f => f.startsWith('backups/latest/'))) return { ok:true, how:'merge-backups' };
  return { ok:false, how:'blocked', why:'الأصلُ تقدّم بغير أعداد النسخ: ' + changedOnMain.slice(0, 5).join(' · ') };
}
if (process.argv[1] && process.argv[1].endsWith('train-promote.mjs') && !process.env.TRAIN_DRY){
  if (!sha){ console.log('::error::لا التزامَ للترقية'); process.exit(1); }
  git('fetch', 'origin', 'main');
  let ancestor = true; try { execFileSync('git', ['merge-base', '--is-ancestor', 'origin/main', sha], { stdio:'ignore' }); } catch { ancestor = false; }
  const changed = ancestor ? [] : git('diff', '--name-only', sha + '...origin/main').split('\n').filter(Boolean);
  const d = promoteDecision(ancestor, changed);
  if (!d.ok){ say('::notice title=لا ترقية::' + d.why + ' — رتّب الدفعةَ فوق الأصل وادفع إلى staging ثانية'); process.exit(0); }
  git('config', 'user.name', 'nusuk-train'); git('config', 'user.email', 'bot@nusuk');
  git('checkout', '-q', sha);
  if (d.how === 'merge-backups'){
    git('merge', '--no-edit', '-m', 'train: دمجُ أعداد النسخ فوق الالتزام المفحوص', 'origin/main');
    say('✓ دُمجت أعدادُ النسخ فوق ' + sha.slice(0, 7) + ' — الشيفرةُ المفحوصةُ كما هي');
  }
  git('push', 'origin', 'HEAD:main');
  say('✓ رُقِّي ' + sha.slice(0, 7) + ' إلى الأصل (' + d.how + ') — النشرُ يبدأ');
}
