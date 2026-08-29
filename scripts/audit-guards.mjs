/* ═══════════════════════════════════════════════════════════════════════════
   حارسُ الحُرّاس — يُشغَّل: node scripts/audit-guards.mjs
   ───────────────────────────────────────────────────────────────────────────
   تسعةُ جرودٍ تحرس التطبيق، ولا أحدَ يحرسها. وقد سقطت مرارًا بأنواعٍ ثلاثة:

     العقيم   — يعدُّ صفرًا ويمرّ. «كلُّ الأقسام (0) لها تبويب».
     الكاذب   — يبحث عن اسمٍ هُجر، فيفشل والتطبيقُ سليم، ويدفع قارئَه إلى
                إعادة العطل الذي هُرب منه.
     الغائب   — موجودٌ في المستودع ولا يجري في السحابة، فيحرس ما لا يُدفَع.

   وثلاثتُها لا تُكتشَف بقراءة الجرد: الجردُ الأخضرُ يبدو سليمًا سواءٌ أكان
   يفحص أم لا يفحص. والفرقُ الوحيدُ بينهما أن أحدَهما **يمسك العطل**.

   فهذا يزرع عطلًا متعمَّدًا في نسخةٍ من التطبيق، ويشغّل الجردَ الذي يجب أن
   يمسكه، ويشترط أن يفشل. فإن مرّ العطلُ فالشبكةُ مثقوبةٌ عند هذا الموضع
   بالذات — ويُقال أيُّ موضع.

   ويفحص قبل ذلك أمرين لا يحتاجان زرعًا: أن كلَّ جردٍ في المستودع يجري في
   السحابة، وأن كلَّ خاصيةٍ يستمع لها معالجٌ مسجَّلةٌ عند حارس الأزرار الميتة —
   فالخاصيةُ غيرُ المسجَّلة زرٌّ يُنقَر فلا يقع شيء، وقد وقع ذلك مرتين.
   ═════════════════════════════════════════════════════════════════════════ */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, rmSync, readdirSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

let pass = 0; const fails = [];
const check = (c, n) => { if (c) pass++; else fails.push(n); };

const src = readFileSync('index.html', 'utf8');
const wf  = readFileSync('.github/workflows/docs-check.yml', 'utf8');

/* ══ ١ · لا جردَ يحرس ما لا يُدفَع ═══════════════════════════════════════ */
{
  const onDisk = readdirSync('scripts')
    .filter(f => /^(audit-.*|qa|parity)\.mjs$/.test(f) && f !== 'audit-guards.mjs');
  const inCi = onDisk.filter(f => wf.includes('scripts/' + f));
  const orphan = onDisk.filter(f => !wf.includes('scripts/' + f));
  check(onDisk.length > 5, `الجرودُ موجودةٌ لتُفحَص (${onDisk.length})`);
  check(orphan.length === 0, 'كلُّ جردٍ يجري في السحابة'
    + (orphan.length ? ' — لا يجري: ' + orphan.join(' · ') : ''));
  check(inCi.length === onDisk.length, `الجرودُ في سير العمل (${inCi.length}/${onDisk.length})`);

  /* والفحصُ القبليُّ يقرأ الخطواتِ من الملف لا يكتبها — وإلا تباعدا */
  const pf = existsSync('scripts/preflight.mjs') ? readFileSync('scripts/preflight.mjs','utf8') : '';
  check(/docs-check\.yml/.test(pf), 'الفحصُ القبليُّ يقرأ خطواتِه من سير العمل نفسِه');
}

/* ══ ٢ · كلُّ خاصيةٍ يُستمَع لها مسجَّلةٌ عند حارس الأزرار الميتة ═══════════ */
{
  const listened = [...new Set([...src.matchAll(/closest\('\[(data-[\w-]+)\]'\)/g)].map(m => m[1]))];
  /* في الملف متغيّرٌ آخرُ اسمُه `acts` يعدُّ الأعمال — فتُطلَب المصفوفةُ لا الاسم */
  const i = src.indexOf('var acts = [');
  const acts = i > 0 ? src.slice(i, src.indexOf('];', i)) : '';
  /* حارسُ الأزرار الميتة يعترض `.btn` و`.chip` وحدهما. فالخاصيةُ تحتاج تسجيلًا
     إن كانت تُصدَر على زرٍّ منهما — ويُعرَف ذلك من الهيكل نفسِه لا من قائمةٍ
     مكتوبةٍ بيد: قائمةُ اليدِ تنسى، والهيكلُ لا ينسى. */
  const onButton = a => {
    const re = new RegExp(`(btn\\([^)]*${a}|class="(?:btn|chip)[^"]*"[^>]{0,120}${a}|${a}[^>]{0,120}class="(?:btn|chip))`);
    return re.test(src);
  };
  const unreg = listened.filter(a => onButton(a) && !acts.includes("'" + a + "'"));
  check(listened.length > 90, `الخصائصُ المفوَّضة (${listened.length})`);
  check(!!acts, 'قائمةُ الخصائص المسجَّلة موجودة');
  check(unreg.length === 0, 'كلُّ خاصيةٍ مفوَّضةٍ مسجَّلةٌ عند حارس الأزرار الميتة'
    + (unreg.length ? ` (${unreg.length}): ` + unreg.join(' · ') : ''));
}

/* ══ ٣ · الزرعُ: عطلٌ متعمَّدٌ يجب أن يُمسَك ══════════════════════════════ */
const MUT = [
  { n:'بندُ قائمةٍ يشير إلى صفحةٍ محذوفة', g:'scripts/check-version.mjs',
    a:"['sites','المواقع']", b:"['sitez','المواقع']" },
  { n:'نصٌّ يمرُّ بـt() بلا مفتاحٍ في القاموس', g:'scripts/check-version.mjs',
    a:"t('تحديات التركيب')", b:"t('تحدياتُ التركيبِ بلا مفتاح')" },
  { n:'عمودُ المخيم يُقرأ بمسطرة النقطة', g:'scripts/audit-data.mjs',
    a:'net:    camp ? (r[10] || \'\') : \'\',', b:'net:    \'\',' },
  { n:'صورةُ الشاخص لم تعد إلزامية', g:'scripts/audit-rules.mjs',
    a:"if (!NEWSITE.photos[0]){ toast(t('صورة الشاخص إلزامية للاعتماد')); return; }", b:'' },
  { n:'إجماليُّ ورقةِ نظرةٍ عامة لا يساوي عمودَه', g:'scripts/audit-exports.mjs',
    a:"out.push(['الإجمالي','', S.total, S.surveyed, S.installed]);",
    b:"out.push(['الإجمالي','', S.total + 7, S.surveyed, S.installed]);" },
  { n:'معادلةُ EAC مقلوبة', g:'scripts/audit-calc.mjs',
    a:'var EAC = CPI ? Math.round(BASE.bac / CPI) : BASE.bac;',
    b:'var EAC = CPI ? Math.round(BASE.bac * CPI) : BASE.bac;' },
  { n:'مبدّلُ الأدوار مكشوفٌ لكلِّ دور', g:'scripts/audit-roles.mjs',
    a:"      + (may('users')\n        ? card('تجربة الأدوار',", b:"      + (true\n        ? card('تجربة الأدوار'," },
  { n:'دالةُ التاريخ تصطدم بكائن المتصفّح', g:'scripts/audit-capacity.mjs',
    a:'function statsHistory(days){', b:'function history(days){' },
  { n:'القائمةُ الموحّدة تُكتَب بيدٍ لا من البيانات', g:'scripts/audit-data.mjs',
    a:'  var onRows = (SITES_RAW.g || []).concat(SITES_RAW.p || []).map(function(r){ return r[9]; });',
    b:'  var onRows = [];' },
  { n:'صفحةٌ تُفتَح فلا ترسم شيئًا', g:'scripts/qa.mjs',
    a:"PAGE.over = {", b:"PAGE.over = { body:function(){ return ''; }, _old:" }
];

const dir = mkdtempSync(join(tmpdir(), 'guards-'));
const survived = [], broken = [];
try {
  execSync(`cp -r scripts ${dir}/ && cp -r docs ${dir}/ && cp -r tools ${dir}/ 2>/dev/null || true`,
           { shell:'/bin/bash' });
  copyFileSync('sw.js', join(dir, 'sw.js'));
  copyFileSync('legacy/v13.99.html', join(dir, 'legacy_tmp')); /* موضعُه أدناه */
  execSync(`mkdir -p ${dir}/legacy && mv ${dir}/legacy_tmp ${dir}/legacy/v13.99.html`, { shell:'/bin/bash' });
  execSync(`ln -sfn ${process.cwd()}/node_modules ${dir}/node_modules 2>/dev/null || true`, { shell:'/bin/bash' });

  for (const m of MUT){
    if (!src.includes(m.a)){ broken.push(m.n + ' — المرساةُ لم تعد موجودة'); continue; }
    if (src.split(m.a).length - 1 !== 1){ broken.push(m.n + ' — المرساةُ غيرُ فريدة'); continue; }
    writeFileSync(join(dir, 'index.html'), src.replace(m.a, m.b));
    let caught = false;
    try { execSync('node ' + m.g, { cwd:dir, stdio:'pipe', timeout:600000 }); }
    catch { caught = true; }
    if (!caught) survived.push(m.n + '  ←  ' + m.g.replace('scripts/',''));
  }
} finally {
  try { rmSync(dir, { recursive:true, force:true }); } catch {}
}

check(broken.length === 0, 'مراسي الزرع كلُّها قائمةٌ وفريدة'
  + (broken.length ? ' — ' + broken.join(' | ') : ''));
check(survived.length === 0, `كلُّ عطلٍ مزروعٍ يُمسَك (${MUT.length - survived.length}/${MUT.length})`
  + (survived.length ? '\n      نجا بلا أن يُمسَك:\n      · ' + survived.join('\n      · ') : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length} · أعطالٌ مزروعة ${MUT.length}`);
if (fails.length){ fails.forEach(f => console.error('  ✗ ' + f)); process.exit(1); }
console.log('حارسُ الحُرّاس نظيف — الشبكةُ تمسك ما بُنيت لتمسكه ✅');
