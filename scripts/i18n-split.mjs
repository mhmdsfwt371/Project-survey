/* ═══════════════════════════════════════════════════════════════════════════
   فصلُ القواميس — node scripts/i18n-split.mjs
   ───────────────────────────────────────────────────────────────────────────
   يقصُّ قاموسَي الإنجليزية والأردو (D وD2 ودمجَهما) من index.html إلى ملفٍ واحدٍ
   i18n/dict-<بصمة>.js يُحمَّل عند اختيار لغةٍ غيرِ العربية فقط، ويُخبَّأ بلا نهاية
   لأن اسمَه يتغيّر بتغيّر محتواه. العربيةُ (لغةُ الميدان) لا تنزّله أبدًا.
   يُعاد تشغيلُه بأمان: إن كان الفصلُ قائمًا يجدّد الملفَ والاسمَ فقط.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
let s = readFileSync('index.html', 'utf8');
const startD = s.indexOf('var D = {');
if (startD < 0) throw new Error('لا قاموسَ في index.html');
/* القاموسان غيرُ متجاورين: D ثم كودٌ ثم D2 ودالةُ الدمج — يُقصّان كتلتين */
const braceEnd = (from) => { let depth = 0; for (let q = s.indexOf('{', from); q < s.length; q++){ const c = s[q]; if (c === '{') depth++; else if (c === '}'){ depth--; if (!depth) return s.indexOf(';', q) + 1; } } return -1; };
const endD = braceEnd(startD);
const startD2 = s.indexOf('var D2 = {');
const mergeEnd = s.indexOf('})();', s.indexOf("Object.keys(D2[L]).forEach", startD2)) + 5;
if (startD2 < 0 || mergeEnd < startD2) throw new Error('لم يُعثَر على القاموس الثاني أو دالة الدمج');
let block = s.slice(startD, endD) + '\n' + s.slice(startD2, mergeEnd);
const isShell = /var D = \{ en:\{\}, ur:\{\} \}/.test(s.slice(startD, endD));
let dictSrc;
if (isShell) throw new Error('القواميسُ مفصولةٌ أصلًا — عدِّل i18n/dict-*.js ثم شغّل: node scripts/i18n-rehash.mjs');
{
  dictSrc = '/* قاموسا الإنجليزية والأردو — يُحمَّل عند اختيار لغةٍ غيرِ العربية (V21.6) */\n' + block + '\nif (typeof i18nReady === "function") i18nReady();\n';
}
const hash = createHash('sha256').update(dictSrc).digest('hex').slice(0, 10);
if (!existsSync('i18n')) mkdirSync('i18n');
readdirSync('i18n').filter(f => /^dict-[0-9a-f]{10}\.js$/.test(f) && f !== 'dict-' + hash + '.js').forEach(f => unlinkSync('i18n/' + f));
writeFileSync('i18n/dict-' + hash + '.js', dictSrc);
const shell = `var D = { en:{}, ur:{} }, D2 = { en:{}, ur:{} };   /* القواميسُ في i18n/dict-<بصمة>.js — تُحمَّل عند اختيار لغةٍ غيرِ العربية (V21.6) */
var I18N_FILE = 'i18n/dict-${hash}.js', I18N_STATE = 0;   /* ٠ لم يُطلَب · ١ يُحمَّل · ٢ جاهز · ٣ تعذّر */
function i18nLoad(){
  if (I18N_STATE || typeof document === 'undefined') return;
  if (typeof window !== 'undefined' && window.__NSK_DICT_SRC){ try { I18N_STATE = 1; (0, eval)(window.__NSK_DICT_SRC); if (I18N_STATE !== 2) i18nReady(); return; } catch (e){ LS_ERR = e; } }   /* بيئةُ الفحص تحقنه */
  I18N_STATE = 1;
  var sc = document.createElement('script'); sc.src = I18N_FILE; sc.async = true;
  sc.onload = function(){ if (I18N_STATE !== 2) i18nReady(); };
  sc.onerror = function(){ I18N_STATE = 3; try { toast(t('تعذّر تحميلُ الترجمة — تحقّق من الشبكة')); } catch (e){} };
  document.head.appendChild(sc);
}
function i18nReady(){ I18N_STATE = 2; try { if (typeof render === 'function') render(1); } catch (e){ LS_ERR = e; } }`;
s = s.slice(0, startD) + shell + s.slice(endD, startD2) + 'var D2 = { en:{}, ur:{} };   /* في ملف القاموس */' + s.slice(mergeEnd);
/* الترجمةُ تطلب القاموسَ حين تُحتاج */
s = s.replace(`function t(s){
  if (LANG === 'ar') return s;
  var d = D[LANG] || {};`, `function t(s){
  if (LANG === 'ar') return s;
  if (I18N_STATE !== 2) i18nLoad();   /* (V21.6) القاموسُ ملفٌّ مستقلٌّ يُطلَب أوّلَ حاجة — والعربيةُ تُعرَض حتى يصل */
  var d = D[LANG] || {};`);
if (!/I18N_STATE !== 2\) i18nLoad\(\)/.test(s)) throw new Error('لم تُعدَّل دالةُ الترجمة');
writeFileSync('index.html', s);
console.log('✓ i18n/dict-' + hash + '.js — ' + Math.round(dictSrc.length / 1024) + ' KB · index.html ' + Math.round(s.length / 1024) + ' KB');
