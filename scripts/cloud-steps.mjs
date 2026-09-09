/* ═══ خطواتُ السحابة — مصدرٌ واحدٌ لما تمرُّ به الدفعة ═══
   كان للجرود ثلاثُ قوائم: واحدةٌ في سير السحابة (docs-check.yml)، وواحدةٌ
   مكتوبةٌ بيدٍ داخل الحارس (check-version.mjs)، وخريطةُ أثرٍ في الدورة
   السريعة (quick.mjs). وكلُّ قائمةٍ تُحدَّث وحدَها فتفترق عن أختها: جردٌ
   يُضاف إلى السحابة ولا يُضاف إلى الحارس، فيسقط في السحابة بعد الدفع
   ولا يراه أحدٌ قبله — ثماني دفعاتٍ حمراءُ من إحدى عشرة في ليلةٍ واحدة.

   فمن اليوم القائمةُ واحدة: ما يُشغَّل في السحابة يُقرأ من ملفِّ السير
   نفسِه، بأسمائه وبيئته، ويُشغَّل محليًّا بالحرف. من أضاف خطوةً إلى السير
   أضافها إلى الحارس المحليِّ وإلى بوابة الدفع في اللحظة نفسها. */

import { readFileSync } from 'fs';

export const WORKFLOW = '.github/workflows/docs-check.yml';

/* يقرأ خطوات وظيفة check من ملفِّ السير: الاسمُ والبيئةُ وأمرُ التشغيل.
   قارئٌ بسيطٌ بالمسافات البادئة — يكفي هذا الملفَّ ولا يدّعي فهمَ YAML كلِّه. */
export function cloudSteps(file = WORKFLOW){
  const lines = readFileSync(file, 'utf8').split('\n');
  const steps = [];
  let cur = null, mode = null, runIndent = -1, envIndent = -1;
  const indentOf = l => l.length - l.trimStart().length;

  for (const raw of lines){
    const line = raw.replace(/\s+$/, '');
    const trimmed = line.trim();
    const ind = indentOf(line);

    if (mode === 'run-block'){
      if (line === '' || ind > runIndent){ cur.run.push(line.slice(Math.min(ind, runIndent + 2))); continue; }
      mode = null;
    }
    if (mode === 'env'){
      if (ind > envIndent && /^[A-Za-z_][A-Za-z0-9_]*:/.test(trimmed)){
        const k = trimmed.slice(0, trimmed.indexOf(':')).trim();
        let v = trimmed.slice(trimmed.indexOf(':') + 1).trim();
        v = v.replace(/^['"]|['"]$/g, '');
        cur.env[k] = v; continue;
      }
      mode = null;
    }
    if (trimmed.startsWith('#') || trimmed === '') continue;

    const m = trimmed.match(/^- name:\s*(.+)$/);
    if (m){ cur = { name: m[1].trim(), env: {}, run: [] }; steps.push(cur); continue; }
    if (trimmed.startsWith('- ')){ cur = null; continue; }   /* خطوةُ uses بلا اسم */
    if (!cur) continue;

    if (trimmed === 'env:'){ mode = 'env'; envIndent = ind; continue; }
    const r = trimmed.match(/^run:\s*(.*)$/);
    if (r){
      if (r[1] === '|' || r[1] === '|-' || r[1] === '>'){ mode = 'run-block'; runIndent = ind; }
      else cur.run.push(r[1]);
    }
  }
  return steps
    .filter(s => s.run.length)
    .map(s => ({ name: s.name, env: s.env, run: s.run.join('\n').trim() }));
}

/* ما يُشغَّل محليًّا: كلُّ خطوةٍ إلا تثبيتَ الحزم (يُضمَن قبلها) والحارسَ
   نفسَه (هو الذي يستدعي هذه القائمة — فلا يستدعي نفسَه). */
export function localSteps(file = WORKFLOW){
  return cloudSteps(file).filter(s => !/check-version\.mjs/.test(s.run) && !/\bnpm (i|install)\b/.test(s.run));
}

if (process.argv[1] && /cloud-steps\.mjs$/.test(process.argv[1])){
  const L = cloudSteps();
  console.log(`خطواتُ السحابة: ${L.length}`);
  L.forEach((s, i) => console.log(`${String(i + 1).padStart(2)}. ${s.name}${Object.keys(s.env).length ? '  env=' + JSON.stringify(s.env) : ''}\n    $ ${s.run.split('\n')[0]}${s.run.includes('\n') ? ' …' : ''}`));
}
