/* ═══════════════════════════════════════════════════════════════════════════
   بصمةُ الختم — node scripts/seal.mjs [HEAD]
   ───────────────────────────────────────────────────────────────────────────
   الحارسُ يختم الشجرةَ التي فحصها، والخطّافُ يقارنها بشجرة الالتزام وقت
   الدفع. وكانت البصمةُ للشجرة كلِّها — فإن نزلت النسخةُ الاحتياطيةُ الليليةُ
   على الأصل بين الختم والدفع (وهي ملفّاتٌ لا يقرؤها أيُّ جرد) بطل الختمُ
   وأُعيد الحارسُ اثنتي عشرةَ دقيقةً لأجل ملفٍّ مشفَّرٍ تبدّل. فصارت البصمةُ
   تستثني ما لا تفحصه الجرود: backups/. بلا وسيطٍ: بصمةُ شجرة العمل كما
   ستُلتزَم؛ مع HEAD (أو أيِّ مرجع): بصمةُ ذلك الالتزام — بالاستثناء نفسِه.
   ═════════════════════════════════════════════════════════════════════════ */
import { execSync } from 'child_process';
import { copyFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';

export const SEAL_SKIP = ['backups'];

export function sealHash(ref, cwd){
  const base = cwd || process.cwd();
  const opt = { encoding:'utf8', cwd: base, stdio:['ignore', 'pipe', 'pipe'] };
  const dir = resolve(base, execSync('git rev-parse --git-dir', opt).trim());
  const idx = `/tmp/nsk-seal-${process.pid}-${Math.random().toString(36).slice(2)}`;
  const o = { ...opt, env: { ...process.env, GIT_INDEX_FILE: idx } };
  try {
    if (ref) execSync(`git read-tree ${ref}`, o);
    else { try { copyFileSync(`${dir}/index`, idx); } catch {} execSync('git add -A .', o); }
    for (const p of SEAL_SKIP) execSync(`git rm -r -q --cached --ignore-unmatch -- ${p}`, o);
    return execSync('git write-tree', o).trim();
  } finally { try { unlinkSync(idx); } catch {} }
}

if (process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`){
  console.log(sealHash(process.argv[2] || ''));
}
