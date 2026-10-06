/* ═══ الطبقةُ السريعةُ من البوابة — node scripts/fast-run.mjs ═══
   تُشغَّل على كلِّ دفعةٍ إلى التجربة: البناءُ والنحوُ واختباراتُ الوحدة والجرودُ الحاسمةُ القصيرة (الأرقام، والحالة الصفرية،
   والصلاحيات، والترجمة، والبيانات، والصور، والملاءمة، والمتابعة، ولجنةُ الفحص التي تفتح كلَّ شاشة…). الهدفُ أن تصل الدفعةُ
   الأجهزةَ في دقائق، ويبقى الجردُ الكاملُ (١٤٨ خطوة على أربع شرائح) ليلًا وعند الطلب. الفشلُ لا يوقف القائمة: تُكمَل كلُّها ثم يُقال ما سقط. */
import { execSync } from 'child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'fs';
const STEPS = [
  ['البناءُ مطابقٌ للمصدر', 'node scripts/build.mjs --check'],
  ['فاحصُ النحو', 'node scripts/audit-lint.mjs'],
  ['صحةُ الكود — لا تراجع', 'node scripts/audit-health.mjs'],
  ['اختباراتُ الوحدة السريعة', 'node --test scripts/unit-core.mjs'],
  ['ما الجديد والنسخة', 'node scripts/audit-whatsnew.mjs'],
  ['عاملُ الخدمة والنسخة', 'node scripts/audit-sw.mjs'],
  ['تطابقُ البيئة', 'node scripts/audit-deps.mjs'],
  ['سيورُ السحابة', 'node scripts/audit-ci.mjs'],
  ['دستورُ الوكلاء', 'node scripts/audit-agents.mjs'],
  ['اتساقُ الأرقام', 'node scripts/audit-numbers.mjs'],
  ['الحالةُ الصفرية', 'node scripts/audit-zero.mjs'],
  ['الصلاحيات', 'node scripts/audit-perms.mjs'],
  ['الترجمةُ بالرندر', 'node scripts/audit-i18n.mjs'],
  ['سلامةُ البيانات', 'node scripts/audit-data.mjs'],
  ['ختمُ الهوية في كلِّ كتابة', 'node scripts/audit-uid.mjs'],   /* (V32.4) سقط ستَّ نسخٍ في الكامل وحدَه بعد بوابة البيانات — صار حاسمًا */
  ['الصور', 'node scripts/audit-photos.mjs'],
  ['الملاءمةُ للجوال', 'node scripts/audit-fit.mjs'],
  ['المطابقةُ أمام الوزارة', 'node scripts/audit-reconcile.mjs'],
  ['تقريرُ الوزارة', 'node scripts/audit-mfu.mjs'],
  ['القمرُ الصناعيّ', 'node scripts/audit-kksat.mjs'],
  ['لجنةُ الفحص — كلُّ شاشةٍ تُفتح', 'node scripts/qa.mjs']
];
const fails = [], lines = [];
for (const [name, run] of STEPS){
  const t0 = Date.now();
  try { execSync(run, { stdio:'pipe', shell:'/bin/bash', maxBuffer:64 * 1024 * 1024, env:{ ...process.env, NODE_OPTIONS:'--require ./scripts/lib/jsdom-dict.cjs' } }); const l = `✓ ${name} (${Math.round((Date.now() - t0) / 1000)}ث)`; console.log(l); lines.push(l); }
  catch (e){ const out = String((e.stdout || '') + (e.stderr || '')).split('\n').filter(l => /✗|not ok|Error/.test(l)).slice(0, 4).join(' | '); const l = `✗ ${name} — ${out || run}`; console.log(l); console.log('::error title=فحصٌ ساقط::' + l.slice(0, 600)); lines.push(l); fails.push(name); }
}
mkdirSync('gate', { recursive:true }); writeFileSync('gate/fast.txt', (fails.length ? 'FAIL\n' + lines.filter(l => l.startsWith('✗')).join('\n') : 'PASS') + '\n');
if (process.env.GITHUB_STEP_SUMMARY){ try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### الطبقةُ السريعة\n' + lines.join('\n') + '\n'); } catch (e){} }
console.log(fails.length ? `\n✗ سقط ${fails.length}: ${fails.join(' · ')}` : '\n✓ الطبقةُ السريعةُ خضراء');
process.exit(fails.length ? 1 : 0);
