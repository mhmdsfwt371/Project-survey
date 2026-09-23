/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الحسابات المعادية (ساكن) — node scripts/audit-hostile.mjs
   ───────────────────────────────────────────────────────────────────────────
   المحاكي يشغّل الطقمَ في السحابة؛ وهنا يُتحقَّق بلا محاكٍ أن كلَّ مجموعةٍ
   في القواعد لها توقّعاتٌ لكلِّ شخصية — فمجموعةٌ تُضاف بلا توقّعٍ تُسقِط
   الحارسَ محلّيًّا قبل أن تصل السحابة — وأن الطقمَ موصولٌ باختبار المحاكي.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'fs';
import { HOSTILE, rulesTargets } from './hostile-expect.mjs';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };
const rules = readFileSync('firestore.rules', 'utf8');
const targets = rulesTargets(rules);
T(targets.length >= 45, 'أهدافٌ من القواعد نفسِها: ' + targets.length);
const missing = targets.filter(t => !HOSTILE[t.key]);
T(!missing.length, 'لكلِّ مجموعةٍ في القواعد توقّعاتٌ معادية' + (missing.length ? ' — بلا توقّع: ' + missing.map(t => t.key).join(' · ') : ''));
const stale = Object.keys(HOSTILE).filter(k => !targets.some(t => t.key === k));
T(!stale.length, 'ولا توقّعَ لمجموعةٍ لم تعد في القواعد' + (stale.length ? ' — زائد: ' + stale.join(' · ') : ''));
const shape = targets.every(t => { const e = HOSTILE[t.key]; if (!e) return true; const n = t.single ? 3 : 5;
  return ['str', 'ina', 'tec'].every(p => typeof e[p] === 'string' && e[p].length === n && /^[AD-]+$/.test(e[p])); });
T(shape, 'وكلُّ توقّعٍ بطوله: خمسٌ للمجموعة وثلاثٌ للوثيقة المفردة، بالحروف A/D/-');
const outsiders = targets.filter(t => { const e = HOSTILE[t.key]; return e && (/A/.test(e.str.slice(1)) || /A/.test(e.ina.slice(1)) || (e.str[0] === 'A' && t.key !== 'pending')); });
T(!outsiders.length, 'والغريبُ وغيرُ الفعّال لا يُقبَل لهما شيءٌ إلا قراءةَ الدعوة بمعرِّفها' + (outsiders.length ? ' — ' + outsiders.map(t => t.key).join(' · ') : ''));
const rt = readFileSync('scripts/rules-test.mjs', 'utf8');
T(/from '\.\/hostile-expect\.mjs'/.test(rt) && /rulesTargets\(/.test(rt), 'والطقمُ موصولٌ باختبار المحاكي');
T(existsSync('scripts/fixtures/rules-before-V17.93.rules') && /rules-before-V17\.93\.rules/.test(readFileSync('scripts/rules-before-test.mjs', 'utf8')) && /rules-before-test\.mjs/.test(readFileSync('.github/workflows/real-tests.yml', 'utf8')), 'والإثباتُ على القواعد السابقة موصول في عمليةٍ مستقلّة: ما سُدَّ كان مفتوحًا');
T(/match \/settings\/pulse\s*\{ allow read: if ok\(\); allow create, update: if ok\(\) && !viewer\(\); allow delete: if mgr\(\); \}/.test(rules), 'ووثيقةُ النبضة لا يحذفها إلا المكتب');
/* نداءُ ctx.firestore() مرتين في كتلةٍ واحدةٍ يُسقط المحاكي — يُمسَك هنا قبل السحابة */
for (const f of ['scripts/rules-test.mjs', 'scripts/rules-before-test.mjs']){
  const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');   /* التعليقاتُ لا تُعَدّ */
  let blocks = 0, dbl = 0;
  for (const m of src.matchAll(/withSecurityRulesDisabled\(async \((\w+)\) => \{/g)){
    let i = m.index + m[0].length, depth = 1;
    while (i < src.length && depth){ if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
    const body = src.slice(m.index + m[0].length, i); blocks++;
    if ((body.match(new RegExp(m[1] + '\\.firestore\\(\\)', 'g')) || []).length > 1) dbl++;
  }
  T(blocks > 0 && !dbl, f + ': لا نداءَ ثانيًا لـctx.firestore() داخل كتلةٍ واحدة (' + blocks + ' كتلة)' + (dbl ? ' — مكرّر في ' + dbl : ''));
}
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ الحسابات المعادية نظيف \u2705');
