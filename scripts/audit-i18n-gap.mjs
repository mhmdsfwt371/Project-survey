/* ═══ حارسُ الترجمة قبل الإصدار — node scripts/audit-i18n-gap.mjs (V43.16) ═══
   القاعدةُ نفسُها التي يطبّقها check-version على الأصل: كلُّ نصٍّ عربيٍّ داخل t('…') له ترجمةٌ إنجليزية، والقاموسان
   (الإنجليزي والأردي) متطابقا المفاتيح، والفجوةُ لا تتجاوز السقف في docs/i18n-baseline.json.
   كانت تُفحَص على الأصل وحدَه — بعد أن يكون الإصدارُ قد نزل إلى الأجهزة — فوصل «ضمن» (V43.12) غيرَ مترجَمٍ ولم يُعرَف
   إلا من بريدٍ أحمرَ بعد قطار V43.15. صارت خطوةً في الطبقة السريعة: لا يمرّ إصدارٌ بنصٍّ بلا ترجمة. */
import { readFileSync } from 'fs';
import { appHtml } from './lib/src.mjs';
import { dictSrc } from './lib/dict-src.mjs';
const src = await appHtml(), srcD = dictSrc(src);
const AR = /[\u0600-\u06FF]/, KEYS = /'((?:[^'\\]|\\.)*)'\s*:\s*'/g;
const dict = name => {
  const i = srcD.indexOf('var ' + name + ' = {'); if (i < 0) return [new Set(), new Set()];
  const seg = srcD.slice(i), mu = /\n\s*ur\s*:\s*\{/.exec(seg); if (!mu) return [new Set(), new Set()];
  const end = /\n\}\n\};/.exec(seg.slice(mu.index)), grab = x => new Set([...x.matchAll(KEYS)].map(m => m[1]));
  return [grab(seg.slice(0, mu.index)), grab(seg.slice(mu.index, mu.index + (end ? end.index : seg.length)))];
};
const [e1, u1] = dict('D'), [e2, u2] = dict('D2');
const EN = new Set([...e1, ...e2]), UR = new Set([...u1, ...u2]);
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n); if (!c) bad++; };
const lits = [...new Set([...src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g)].map(m => m[1]).filter(x => AR.test(x)))];
const miss = lits.filter(k => !EN.has(k));
let base = 0; try { base = JSON.parse(readFileSync('docs/i18n-baseline.json', 'utf8')).missing; } catch {}
T(EN.size > 1000 && lits.length > 1000, 'القاموسُ والنداءاتُ مقروءة (' + EN.size + ' مفتاحًا · ' + lits.length + ' نصًّا)');
T(miss.length <= base, 'كلُّ نصٍّ عربيٍّ في t() له ترجمة — الفجوةُ ' + miss.length + ' والسقفُ ' + base + (miss.length > base ? ' — ترجم: ' + miss.slice(0, 6).join(' · ') : ''));
const onlyEn = [...EN].filter(k => !UR.has(k)), onlyUr = [...UR].filter(k => !EN.has(k));
T(!onlyEn.length && !onlyUr.length, 'القاموسان متطابقان — ' + onlyEn.length + ' في الإنجليزي وحده · ' + onlyUr.length + ' في الأردي وحده' + (onlyEn.length ? ' — ' + onlyEn.slice(0, 3).join(' · ') : ''));
console.log(bad ? '✗ حارسُ الترجمة سقط (' + bad + ')' : '✓ حارسُ الترجمة نظيف');
process.exit(bad ? 1 : 0);
