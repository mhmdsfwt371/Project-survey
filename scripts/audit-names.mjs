/* ═════════════════════════════════════════════════════════════════════════
   جردُ الأسماء — node scripts/audit-names.mjs
   ─────────────────────────────────────────────────────────────────────────
   (V39.13) التطبيقُ ملفٌّ واحدٌ بمجالٍ عامٍّ واحد: ألفا دالّةٍ تعيش معًا. من عرّف دالّةً باسمٍ
   موجود — عن غير قصد، في ملفٍّ آخر — غلب التعريفُ المتأخّرُ القديمَ بصمت، فيكسر شاشةً لا
   علاقةَ لها بما يبنيه. حدث هذا ونحن نبني توأم الأجهزة: «twinOf» كانت دالّةَ النقاط
   المتطابقة من قبل. فصار الاسمُ المكرَّرُ خطأً يُمسَك قبل البناء لا بعده.
   ويُفحَص معه: كلُّ ملفٍّ يعلن DEFINES فيه الدوالُّ التي يعرّفها فعلًا — فالعنوانُ خريطةُ من يقرأ.
   (V39.25) والوحدةُ الجديدةُ (من V39.13) تعلن PREFIX وكلُّ دوالِّها تبدأ به.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { srcJs } from './lib/src.mjs';

let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };
const files = srcJs();
const byName = {};
for (const f of files){
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) (byName[m[1]] = byName[m[1]] || []).push(f.replace(/^src\//, ''));
}
const dups = Object.entries(byName).filter(([, L]) => L.length > 1);
console.log('══ ١ · لا دالّةَ تُعرَّف مرّتين ══');
console.log('  · ' + Object.keys(byName).length + ' دالّةً في ' + files.length + ' ملفًّا');
T(dups.length === 0, dups.length ? 'أسماءٌ مكرَّرة: ' + dups.slice(0, 5).map(([n, L]) => n + ' (' + L.join(' · ') + ')').join(' | ') : 'كلُّ اسمٍ مرّةً واحدة');

console.log('\n══ ٢ · عنوانُ كلِّ ملفٍّ يذكر ما يعرّفه ══');
let heads = 0, drift = [];
for (const f of files){
  const src = readFileSync(f, 'utf8');
  const m = /DEFINES\s*:\s*([^\n]*)/.exec(src.slice(0, 3000)); if (!m) continue; heads++;
  const listed = m[1].split(/[,\s…]+/).filter(x => /^[A-Za-z_$][\w$]*$/.test(x));
  const defined = [...src.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(x => x[1]);
  const ghost = listed.filter(x => !defined.includes(x) && !/^(\(\+\d+|more)$/.test(x));
  if (ghost.length && !/\(\+\d+ more\)/.test(m[1])) drift.push(f.replace(/^src\//, '') + ': ' + ghost.slice(0, 3).join(', '));
}
T(drift.length === 0, drift.length ? 'عناوينُ تذكر دوالَّ ليست فيها: ' + drift.slice(0, 4).join(' | ') : heads + ' عنوانًا يذكر ما في ملفه (أو يقول «+n more»)');

console.log('\n══ ٣ · الوحدةُ الجديدةُ ببادئةٍ واحدة ══');
/* (V39.25) the rule the V39.13–V39.24 modules proved: one feature, one file, one prefix (dtw…, cov…, te…). A file whose
   header dates it V39.13 or later must declare «PREFIX : <p>» and every function in it must start with p (then an
   uppercase letter or a digit) — so a search finds the whole feature and two features cannot take each other's names. */
const vnum = v => { const m = /V(\d+)\.(\d+)/.exec(v || ''); return m ? +m[1] * 1000 + +m[2] : 0; };
let newer = 0; const noPrefix = [], offPrefix = [];
for (const f of files){
  const src = readFileSync(f, 'utf8'), head = src.slice(0, 3000);
  const pm = /PURPOSE\s*:\s*\((V\d+\.\d+)\)/.exec(head); if (!pm || vnum(pm[1]) < vnum('V39.13')) continue; newer++;
  const pre = /PREFIX\s*:\s*([A-Za-z_$][\w$]*)/.exec(head);
  if (!pre){ noPrefix.push(f.replace(/^src\//, '')); continue; }
  const re = new RegExp('^' + pre[1] + '([A-Z0-9]|$)');
  const off = [...src.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(m => m[1]).filter(n => !re.test(n));
  if (off.length) offPrefix.push(f.replace(/^src\//, '') + ': ' + off.slice(0, 4).join(', '));
}
console.log('  · ' + newer + ' وحدةً من V39.13 فما بعد');
T(!noPrefix.length, noPrefix.length ? 'وحداتٌ بلا PREFIX: ' + noPrefix.join(' · ') : 'كلُّ وحدةٍ جديدةٍ تعلن بادئتَها');
T(!offPrefix.length, offPrefix.length ? 'دوالُّ خارجَ بادئة ملفّها: ' + offPrefix.join(' | ') : 'وكلُّ دالّةٍ فيها تبدأ بها');

console.log(bad ? '\nجردُ الأسماء فشل ✗ (' + bad + ')' : '\nجردُ الأسماء نظيف ✅');
process.exit(bad ? 1 : 0);
