/* ═══════════════════════════════════════════════════════════════════════════
   جردُ سيور السحابة — node scripts/audit-ci.mjs
   ───────────────────────────────────────────────────────────────────────────
   حارسٌ يسقط لسببٍ خارجيٍّ يُعلِّم صاحبَه تجاهلَ الأحمر — وهو أسوأُ من غياب
   الحارس. فكلُّ خطوةِ تثبيتٍ تُعاد ثلاثًا بمهلةٍ تتضاعف، وكلُّ سيرٍ يسقط
   يُعاد مرةً واحدةً تلقائيًّا (`rerun.yml`) ثم لا يُعاد — فالثانيةُ عطلٌ
   حقيقيّ. ويتحقّق هذا الجردُ أن كلَّ سيرٍ مسمًّى في قائمة الإعادة موجودٌ
   باسمه، وأن الإعادةَ مشروطةٌ بالمحاولة الأولى فلا تدور بلا نهاية، وأن كلَّ
   جردٍ مسجَّلٍ في الحارس له خطوةٌ في السحابة والعكس.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync } from 'fs';
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };
const wf = f => readFileSync('.github/workflows/' + f, 'utf8');

/* ١ · كلُّ خطوةِ تثبيتٍ محصَّنة */
const installers = [];
for (const f of readdirSync('.github/workflows')){
  const s = wf(f);
  for (const m of s.matchAll(/^\s*(?:- )?run: *(npm i [^\n]*|npx playwright install[^\n]*)$/gm))
    installers.push(f + ' → ' + m[1].slice(0, 44));
}
T(installers.length === 0, 'لا خطوةَ تثبيتٍ بلا إعادة' + (installers.length ? ' — ' + installers.join(' | ') : ''));
const retries = [...wf('docs-check.yml').matchAll(/for i in 1 2 3/g)].length
              + [...wf('post-deploy.yml').matchAll(/for i in 1 2 3/g)].length
              + [...wf('real-tests.yml').matchAll(/for i in 1 2 3/g)].length;
T(retries >= 5, 'حلقاتُ الإعادة موجودة (' + retries + ')');

/* ٢ · سيرُ الإعادة: يعرف السيورَ بأسمائها ولا يدور */
const rr = wf('rerun.yml');
const wfBlock = /workflows:\n((?:      - .+\n)+)/.exec(rr);
const names = wfBlock ? wfBlock[1].split('\n').map(x => x.replace(/^      - /, '').trim()).filter(Boolean) : [];
const real = readdirSync('.github/workflows')
  .filter(f => f !== 'rerun.yml')
  .map(f => (/^name: *(.+)$/m.exec(wf(f)) || [])[1])
  .filter(Boolean);
const unknown = names.filter(n => !real.includes(n));
T(unknown.length === 0, 'كلُّ سيرٍ في قائمة الإعادة موجودٌ باسمه' + (unknown.length ? ' — ' + unknown.join(' | ') : ''));
T(/run_attempt == 1/.test(rr), 'الإعادةُ مشروطةٌ بالمحاولة الأولى — فلا تدور بلا نهاية');
T(/conclusion == 'failure'/.test(rr), 'ولا تُعاد إلا ما سقط');
T(/actions: write/.test(rr), 'ولها صلاحيةُ الإعادة');
T(/rerun-failed-jobs/.test(rr), 'وتُعيد ما سقط وحدَه لا السيرَ كلَّه');

/* ٣ · الجرودُ: ما في الحارس هو ما في السحابة */
const cv = readFileSync('scripts/check-version.mjs', 'utf8');
const inGuard = [...cv.matchAll(/'(scripts\/audit-[\w-]+\.mjs|scripts\/qa\.mjs|scripts\/parity\.mjs)'/g)].map(m => m[1]);
const dc = wf('docs-check.yml');
const inCI = [...dc.matchAll(/node (scripts\/[\w-]+\.mjs)/g)].map(m => m[1]);
const missCI = inGuard.filter(x => !inCI.includes(x));
T(missCI.length === 0, 'كلُّ جردٍ في الحارس له خطوةٌ في السحابة (' + inGuard.length + ')' + (missCI.length ? ' — ناقص: ' + missCI.join(' | ') : ''));
/* بعضُ الجرود يشغّلها الحارسُ ضمنًا عبر preflight لا بالاسم — تُستثنى بأسمائها */
const VIA_PREFLIGHT = ['scripts/qa.mjs','scripts/parity.mjs','scripts/audit-guards.mjs','scripts/audit-capacity.mjs'];
const missGuard = inCI.filter(x => !inGuard.includes(x) && !VIA_PREFLIGHT.includes(x)
  && !/role-manuals|check-version|preflight/.test(x));
T(missGuard.length === 0, 'ولا خطوةَ في السحابة بلا جردٍ في الحارس' + (missGuard.length ? ' — ' + missGuard.join(' | ') : ''));

console.log(bad ? '\nجردُ سيور السحابة فشل ✗ (' + bad + ')' : '\nالسحابةُ لا تسقط لسببٍ خارجيّ — وما سقط يُعاد مرةً ✅');
process.exit(bad ? 1 : 0);
