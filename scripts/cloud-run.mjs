/* ═══════════════════════════════════════════════════════════════════════════
   تشغيلُ قائمة الحارس مقسَّمةً — node scripts/cloud-run.mjs <رقم الشريحة> <عدد الشرائح>
   ───────────────────────────────────────────────────────────────────────────
   القائمةُ الواحدةُ في docs-check.yml تبقى المرجعَ حرفًا (الحارسُ المحلّيُّ
   يقرؤها، والجرودُ تفحص وجودَها). وعلى فرع التجربة تُشغَّل الخطواتُ نفسُها على
   أربعة أجهزةٍ متوازيةٍ بدل جهازٍ واحدٍ يمرُّ بها واحدةً واحدة: الشريحةُ i
   تأخذ الخطوةَ i ثم i+n ثم i+2n… فتُغطّى القائمةُ كلُّها مرةً واحدةً بلا
   تكرار. الفشلُ لا يوقف الشريحة — تُكمَل كلُّها ثم يُقال ما سقط.
   ═════════════════════════════════════════════════════════════════════════ */
import { execSync } from 'child_process';
import { appendFileSync } from 'fs';
import { localSteps } from './cloud-steps.mjs';

const i = Math.max(1, +(process.argv[2] || 1)), n = Math.max(1, +(process.argv[3] || 1));
const all = localSteps();
const mine = all.filter((_, k) => (k % n) === (i - 1));
console.log(`الشريحةُ ${i}/${n}: ${mine.length} خطوةً من ${all.length}`);
const fails = [], lines = [];
for (const s of mine){
  const t0 = Date.now();
  try {
    execSync('set -e\n' + s.run, { stdio:'pipe', shell:'/bin/bash', env:{ ...process.env, ...s.env }, maxBuffer: 64 * 1024 * 1024 });
    const line = `✓ ${s.name} (${Math.round((Date.now() - t0) / 1000)}ث)`; console.log(line); lines.push(line);
  } catch (e){
    const out = String((e.stdout || '') + (e.stderr || '')).split('\n').filter(l => /✗|Error|error/.test(l)).slice(0, 4).join(' | ');
    const line = `✗ ${s.name} — ${out || ('شغّل: ' + s.run.split('\n')[0])}`;
    console.log(line); console.log('::error title=فحصٌ ساقط::' + line.slice(0, 600)); lines.push(line); fails.push(s.name);
  }
}
if (process.env.GITHUB_STEP_SUMMARY){ try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### الشريحة ${i}/${n}\n` + lines.join('\n') + '\n'); } catch {} }
console.log(fails.length ? `\n✗ سقط ${fails.length}: ${fails.join(' · ')}` : `\n✓ الشريحةُ ${i}/${n} خضراء`);
process.exit(fails.length ? 1 : 0);
