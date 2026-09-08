/* ═══ الدورةُ السريعة ═══
      node scripts/quick.mjs            — يقرأ ما تغيّر من git ويشغّل ما يعنيه
      node scripts/quick.mjs --all      — كلَّ الجرود بالتوازي (بديلُ الحارس الكامل)
      node scripts/quick.mjs a b c      — جرودًا بعينها

   الحارسُ الكاملُ يشغّل ثمانيةً وسبعين جردًا بالتتابع في تسع دقائق — وأكثرُها
   لا علاقةَ له بالتغيير الذي بين يديك: تعديلٌ في جدول المتابعة لا يمسُّ
   جردَ الفكِّ ولا جردَ الأسطول. وتسعُ دقائقَ لكلِّ تعديلٍ صغيرٍ تُبطئ المشروعَ
   كلَّه، فيميل المرءُ إلى تخطّي الفحص — وذاك أسوأُ من بطئه.

   فهذا يقرأ ما تغيّر في `index.html` (بالمقارنة مع origin/main)، ويستنتج
   الجرودَ التي تمسُّه من خريطةٍ صريحةٍ أدناه، ويشغّلها **بالتوازي** بعدد
   أنوية المعالج. والحارسُ الكاملُ يبقى شبكةَ الأمان: يعمل في السحابة على
   كلِّ دفعةٍ (docs-check) فلا يمرُّ خطأٌ إلى الإنتاج ولو فات هنا.

   وهو لا يغني عن الحارس قبل الدفعات الكبيرة — يغني عن انتظاره في الصغيرة. */

import { execSync, spawn } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { cpus } from 'os';

const ARG = process.argv.slice(2);
const ALL = ARG.includes('--all');
const PICK = ARG.filter(a => !a.startsWith('--'));

/* ── خريطةُ الأثر: نمطٌ في الشيفرة ← الجرودُ التي تحرسه ───────────────────
   كلُّ سطرٍ: [تعبيرٌ يُبحَث عنه في سطور الفرق، أسماءُ جرودٍ بلا اللاحقة]      */
const MAP = [
  [/wbs|WBS_/,                        ['data', 'tabs', 'writes', 'exports']],
  [/notif|بطاقةٌ عائمة|bell/i,        ['notify', 'data', 'writes']],
  [/pullScope|pullDelta|pullStatic|_staticAt|PULL_ASK|SYNC_|syncCd/,
                                      ['capacity', 'cascade', 'sync', 'scale']],
  [/liveSmall|watch\(|onSnapshot/,    ['cascade', 'capacity', 'sync']],
  [/CORE\.(set|rm|dirty|flush)|TOMB|epoch/i, ['tomb', 'wipe', 'sync', 'poison']],
  [/ROLES|ROLE_RANK|nav:|can:|seesPage|may\(/, ['roles', 'crole', 'tabs', 'hier', 'perms']],
  [/PAGE\.|TABS|PTAB|NAV\b/,          ['tabs', 'roles', 'buttons', 'i18n']],
  [/data-[a-z]+=/i,                   ['buttons', 'writes']],
  [/SHEETS|xlsExport|EXP_SECS|expAllowed/, ['exports', 'xls']],
  [/siteStats|siteKeyStats|lifeOf|LIFE|svDone|svLabel/, ['calc', 'zero', 'invariants']],
  [/mile|MILES|BASE|baseline|evm/i,   ['calc', 'plan', 'zero']],
  [/provision|pwFlow|ghRunNow|ghToken/, ['accounts', 'dupe', 'e2e-accounts', 'invite']],
  [/photo|PHOTO_/i,                   ['photos', 'writes']],
  [/'ar'|'en'|'ur'|D\.en|D\.ur/,      ['i18n', 'lang', 'lang2']],
  [/firestore\.rules/,                ['db-rules', 'rules-test', 'perms']],
];
/* جرودٌ تعمل دائمًا: رخيصةٌ وتكشف الكسرَ العامّ */
const ALWAYS = ['data', 'craft', 'stability'];

const have = new Set(readdirSync('scripts')
  .filter(f => f.startsWith('audit-') && f.endsWith('.mjs'))
  .map(f => f.slice(6, -4)));

function changed(){
  try {
    execSync('git fetch -q origin main', { stdio:'ignore' });
    return execSync('git diff origin/main -- index.html firestore.rules scripts/', { encoding:'utf8' });
  } catch { return execSync('git diff HEAD -- index.html', { encoding:'utf8' }); }
}

let pick;
if (PICK.length) pick = PICK;
else if (ALL) pick = [...have];
else {
  const diff = changed().split('\n').filter(l => /^[+-][^+-]/.test(l)).join('\n');
  if (!diff.trim()){ console.log('لا تغييرَ على index.html — لا شيءَ يُفحَص'); process.exit(0); }
  const set = new Set(ALWAYS);
  MAP.forEach(([re, names]) => { if (re.test(diff)) names.forEach(n => set.add(n)); });
  pick = [...set];
  console.log(`أسطرُ التغيير: ${diff.split('\n').length} · الجرودُ المعنيّة: ${pick.length}`);
}
pick = pick.filter(n => have.has(n));
if (!pick.length){ console.log('لا جردَ مطابقًا'); process.exit(0); }

/* ── تشغيلٌ متوازٍ بعدد الأنوية ─────────────────────────────────────────── */
/* المساراتُ: نواتان لا تكفيان لجردٍ ثقيلٍ يُبطئ الخفافَ خلفه — أربعةٌ تعمل
   جيدًا حتى على نواتين لأن أكثرَ الزمن انتظارُ DOM لا حسابًا */
const LANES = Math.max(4, Math.min(8, cpus().length * 2));
const t0 = Date.now();
let bad = 0, done = 0;
const queue = pick.slice();

function run(name){
  return new Promise(res => {
    const s = Date.now();
    const p = spawn('node', [`scripts/audit-${name}.mjs`], { stdio:['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => out += d);
    const kill = setTimeout(() => p.kill('SIGKILL'), 240000);
    p.on('close', code => {
      clearTimeout(kill);
      done++;
      const secs = Math.round((Date.now() - s) / 1000);
      if (code === 0) console.log(`  ✓ ${name.padEnd(16)} ${secs}ث   (${done}/${pick.length})`);
      else {
        bad++;
        const lines = out.split('\n').filter(l => l.includes('✗')).slice(0, 4);
        console.log(`  ✗ ${name.padEnd(16)} ${secs}ث\n${lines.map(l => '      ' + l.trim()).join('\n')}`);
      }
      res();
    });
  });
}

async function lane(){ while (queue.length) await run(queue.shift()); }

console.log(`\nالدورةُ السريعة — ${pick.length} جردًا على ${LANES} مسارات\n`);
await Promise.all(Array.from({ length:LANES }, lane));
const secs = Math.round((Date.now() - t0) / 1000);
console.log(bad
  ? `\n✗ ${bad} من ${pick.length} فشل — ${secs}ث. أصلِحه، أو شغّل الحارسَ الكاملَ للتفصيل.`
  : `\n✅ ${pick.length} جردًا مرَّت في ${secs}ث — والحارسُ الكاملُ يعمل في السحابة على الدفعة.`);
process.exit(bad ? 1 : 0);
