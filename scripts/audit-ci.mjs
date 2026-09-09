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

/* ٣ · الجرودُ: قائمةٌ واحدة — الحارسُ يقرأ خطواتِ السحابة من ملفِّ السير نفسِه
   (كانت قائمتان تُقارَنان هنا فتفترقان بين مقارنةٍ وأخرى؛ صارت واحدةً بالبناء) */
const cv = readFileSync('scripts/check-version.mjs', 'utf8');
T(/from '\.\/cloud-steps\.mjs'/.test(cv) && /localSteps\(\)/.test(cv), 'الحارسُ يقرأ جرودَه من سير السحابة نفسِه (cloud-steps) لا من قائمةٍ بيد');
const { cloudSteps, localSteps } = await import('./cloud-steps.mjs');
const dc = wf('docs-check.yml');
const inCI = [...new Set([...dc.matchAll(/node (scripts\/[\w-]+\.mjs)/g)].map(m => m[1]))];
const parsed = new Set(cloudSteps().flatMap(s => [...s.run.matchAll(/node (scripts\/[\w-]+\.mjs)/g)].map(m => m[1])));
const unread = inCI.filter(x => !parsed.has(x));
T(unread.length === 0, 'قارئُ السير يلتقط كلَّ خطوةٍ في السحابة (' + inCI.length + ')' + (unread.length ? ' — لم يُقرأ: ' + unread.join(' | ') : ''));
const local = localSteps();
T(local.length >= inCI.length - 1 && !local.some(s => /check-version\.mjs|npm (i|install)\b/.test(s.run)),
  'الخطواتُ المحليةُ هي خطواتُ السحابة إلا التثبيتَ والحارسَ نفسَه (' + local.length + ')');

console.log(bad ? '\nجردُ سيور السحابة فشل ✗ (' + bad + ')' : '\nالسحابةُ لا تسقط لسببٍ خارجيّ — وما سقط يُعاد مرةً ✅');
process.exit(bad ? 1 : 0);
