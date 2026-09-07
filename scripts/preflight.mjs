/* ═══════════════════════════════════════════════════════════════════════════
   الفحصُ القبليّ — يُشغَّل: node scripts/preflight.mjs
   ───────────────────────────────────────────────────────────────────────────
   الأخضرُ على الجهاز لا يعني الأخضرَ على السحابة. وقد فشلت أربعُ دفعاتٍ
   متتاليةٍ ونحن نظنّها سليمة، لأن مجلَّد العمل يحمل حزمًا وملفاتٍ من جلساتٍ
   سابقة لا يحملها المستنسَخُ النظيف — و`TextEncoder` غاب هناك ولم يغب هنا.

   وبين الدفع واكتشاف الفشل بريدٌ يصل صاحبَ المشروع قبل أن يصل إلينا.

   فهذا يبني بيئةَ السحابة قبل الدفع: يأخذ الملفاتِ المتعقَّبةَ وحدها — لا ما
   في المجلَّد — إلى مكانٍ فارغ، ويثبّت من الصفر، ثم يشغّل **خطواتِ سير العمل
   نفسَها مقروءةً من ملفه** لا مكتوبةً هنا. فإن أُضيفت خطوةٌ إلى السحابة جرت
   هنا بلا تعديل، ولا يفترقان أبدًا.
   ═════════════════════════════════════════════════════════════════════════ */
import { execSync } from 'child_process';
import { readFileSync, mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const WF = '.github/workflows/docs-check.yml';

/* خطواتُ سير العمل من ملفه: الاسمُ والبيئةُ والأمر، بالترتيب.
   والبيئةُ تُقرأ كما يُقرأ الأمر: خطوةٌ تُشغَّل بمتغيّرٍ في السحابة وبلا متغيّرٍ
   هنا ليست الخطوةَ نفسَها — وهذا هو الانحرافُ الذي بُني الفحصُ لمنعه. */
function steps(){
  const y = readFileSync(WF, 'utf8').split('\n');
  const out = [];
  let name = null, env = null;
  for (let i = 0; i < y.length; i++){
    const nm = /^\s*-\s*name:\s*(.+?)\s*$/.exec(y[i]);
    if (nm){ name = nm[1]; env = null; continue; }
    if (/^\s*env:\s*$/.test(y[i]) && name){
      env = {};
      const ind = (y[i].match(/^\s*/) || [''])[0].length;
      for (let j = i + 1; j < y.length; j++){
        if (!y[j].trim()) continue;
        const k = (y[j].match(/^\s*/) || [''])[0].length;
        if (k <= ind) break;
        const kv = /^\s*([A-Za-z_][\w]*)\s*:\s*'?"?([^'"\n]*)'?"?\s*$/.exec(y[j]);
        if (kv) env[kv[1]] = kv[2];
        i = j;
      }
      continue;
    }
    /* «run: |» يُفحَص أوّلًا: كان التعبيرُ العامُّ يلتقطه فيصير الأمرُ «|»
       وحدَه — فيسقط الفحصُ القبليُّ بخطأِ صياغةٍ لا علاقةَ له بالسير. */
    if (/^\s*run:\s*\|-?\s*$/.test(y[i]) && name){
      /* أمرٌ متعدّدُ الأسطر — يُجمَع حتى أول سطرٍ أقلَّ إزاحة */
      const ind = (y[i].match(/^\s*/) || [''])[0].length;
      const buf = [];
      for (let j = i + 1; j < y.length; j++){
        if (!y[j].trim()){ buf.push(''); continue; }
        const k = (y[j].match(/^\s*/) || [''])[0].length;
        if (k <= ind) break;
        buf.push(y[j].slice(ind + 2));
      }
      out.push({ name, cmd: buf.join('\n'), env });
      name = null; env = null;
      continue;
    }
    const rn = /^\s*run:\s*(.+?)\s*$/.exec(y[i]);
    if (rn && name){ out.push({ name, cmd: rn[1], env }); name = null; env = null; }
  }
  return out;
}

const dir = mkdtempSync(join(tmpdir(), 'preflight-'));
let failed = null;

try {
  /* الملفاتُ المتعقَّبةُ والجديدةُ غيرُ المتجاهَلة — أي ما سيُدفَع بالضبط.
     والمحذوفُ يبقى في فهرس git حتى يُسجَّل حذفُه، فيُستبعَد ما لا وجودَ له —
     وإلا اشتكى الأرشيفُ في سطرٍ يمرُّ في الضجيج ونقص من البيئة ملفٌّ صامتًا. */
  const raw = execSync('git ls-files -c -o --exclude-standard -z', { maxBuffer: 1 << 28 })
    .toString('utf8').split('\0').filter(Boolean);
  const files = raw.filter(f => existsSync(f));
  const gone = raw.length - files.length;
  if (!files.length) throw new Error('لا ملفاتٍ لنسخها');
  console.log(`ملفاتٌ ستُدفَع: ${files.length}` + (gone ? ` · محذوفةٌ لم تُسجَّل بعد: ${gone}` : ''));

  /* الأنبوبُ يخفي فشلَ أوّله — فيُشترَط سقوطُه كلِّه */
  execSync(`set -o pipefail; tar --null -T - -cf - | tar -xf - -C ${dir}`,
    { input: files.join('\0') + '\0', maxBuffer: 1 << 28, shell: '/bin/bash' });

  const st = steps();
  console.log(`بيئةٌ نظيفة: ${dir}`);
  console.log(`خطواتٌ من ${WF}: ${st.length}\n`);
  if (!st.length) throw new Error('لم تُقرأ خطواتٌ من سير العمل — تغيّرت صيغتُه؟');

  /* ═══ بالتوازي لا تباعًا ═══
     ثلاثةٌ وسبعون جردًا تباعًا تتجاوز أيَّ مهلةٍ معقولة. تُشغَّل الجرودُ
     (وكلُّ خطوةٍ لا ترتّب على سابقتها) في أربعة مساراتٍ متوازية؛ وما يجب أن
     يسبق غيرَه — التثبيتُ والتحقّقُ من الصياغة — يبقى أوّلًا وتباعًا. */
  const { spawn } = await import('node:child_process');
  const runOne = (s) => new Promise(res => {
    const t0 = Date.now();
    const ch = spawn('/bin/bash', ['-c', s.cmd], { cwd: dir, env: Object.assign({}, process.env, s.env || {}) });
    let out = '';
    ch.stdout.on('data', d => { out += d; }); ch.stderr.on('data', d => { out += d; });
    const kill = setTimeout(() => { try { ch.kill('SIGKILL'); } catch {} }, 900000);
    ch.on('close', code => { clearTimeout(kill); res({ s, code, out, sec: Math.round((Date.now() - t0) / 1000) }); });
  });
  const serial = st.filter(s => !/scripts\/(audit|qa|parity)/.test(s.cmd));
  const par    = st.filter(s =>  /scripts\/(audit|qa|parity)/.test(s.cmd));
  const report = (r) => {
    console.log('  ' + r.s.name.padEnd(46).slice(0, 46) + ' … ' + (r.code === 0 ? '✓  ' + r.sec + 'ث' : '✗'));
    if (r.code !== 0){
      const lines = r.out.split('\n').filter(l => /✗|Error|error|فشل/.test(l)).slice(0, 6);
      console.error('\n  الأمر: ' + r.s.cmd.split('\n')[0]);
      lines.forEach(l => console.error('  ' + l.trim().slice(0, 150)));
    }
  };
  for (const s of serial){
    const r = await runOne(s); report(r);
    if (r.code !== 0){ failed = s.name; break; }
  }
  if (!failed){
    const LANES = 5, queue = par.slice(), results = [];
    await Promise.all(Array.from({ length: LANES }, async () => {
      while (queue.length){ const s = queue.shift(); const r = await runOne(s); results.push(r); report(r); }
    }));
    const bad = results.find(r => r.code !== 0);
    if (bad) failed = bad.s.name;
  }
} catch (e){
  console.error('تعذّر تجهيزُ البيئة: ' + e.message);
  failed = failed || 'التجهيز';
} finally {
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}

if (failed){
  console.error('\n✗ ستفشل السحابةُ عند: ' + failed + ' — أصلحه قبل الدفع');
  process.exit(1);
}
console.log('\nما سيُدفَع يمرُّ كما تمرُّ السحابة ✅');
