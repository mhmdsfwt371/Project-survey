/* ═══════════════════════════════════════════════════════════════════════════
   جردُ وثائق التشغيل — node scripts/audit-docs4.mjs
   ───────────────────────────────────────────────────────────────────────────
   وثيقةُ المنتج ووثيقةُ الرجوع كانتا تصفان نسخًا من زمن V13 — فيقرؤها القادمُ
   الجديدُ ويعمل بها. يُفحَص أن رأسَ المنتج على نسخةٍ قريبة، وأن الرجوعَ يصف
   المسارَ الحيَّ (revert ← staging ← ترقية)، وأن المعماريةَ والتسليمَ وحارسَ
   التكلفة موجودةٌ وتسمّي ما هو موجودٌ فعلًا، وأن الأدلةَ لا تُسرّب قيمةَ سرّ.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'fs';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };
const html = readFileSync('index.html', 'utf8');
const ver = (/class="ver-tag"[\s\S]{0,240}?>نسخة\s*(V[\d.]+)</.exec(html) || [])[1];
const vn = v => { const m = /V(\d+)\.(\d+)/.exec(v || ''); return m ? +m[1] * 1000 + +m[2] : 0; };
const rd = f => existsSync(f) ? readFileSync(f, 'utf8') : '';
const prod = rd('docs/product.md'), roll = rd('docs/rollback.md'), arch = rd('docs/architecture.md'), hand = rd('docs/handover.md'), cost = rd('docs/cost-guard.md'), sys = rd('docs/system.md');

const pv = (/آخر تحديث مع `(V[\d.]+)`/.exec(prod) || [])[1];
T(pv && vn(ver) - vn(pv) <= 40, 'وثيقةُ المنتج على نسخةٍ قريبة: ' + pv + ' (التطبيق ' + ver + ')');
T(/## ٧\)/.test(prod) && /مسارُ التحصين/.test(prod) && /V17\.93/.test(prod) && /قطاراتُ الإصدار/.test(prod), 'و§٧ يصف مسارَ التحصين وحالتَه');
T(/git revert/.test(roll) && /HEAD:staging/.test(roll) && /--force/.test(roll) && /sw\.js/.test(roll) && !/v13\.99/.test(roll), 'والرجوعُ يصف المسارَ الحيَّ: عكسٌ ← فرعُ التجربة ← ترقية، وأثرُ الكاش');
T(arch.length > 2000 && /## ٢ · المكوّنات/.test(arch) && /docs-check\.yml/.test(arch) && /sw\.js/.test(arch) && /firestore\.rules/.test(arch), 'والمعماريةُ في صفحةٍ تسمّي المكوّناتِ الحيّة');
T(/nusuk-tech-spec\.docx/.test(sys) && /مُلغاة/.test(sys) && /docs\/architecture\.md/.test(sys), 'والمواصفةُ القديمة موسومةٌ مُلغاةً في system.md');
/* كلُّ ملفٍّ أو سكربتٍ تسمّيه المعماريةُ والتسليمُ موجود */
const named = [...new Set([...(arch + hand).matchAll(/`(scripts\/[\w.-]+\.mjs|docs\/[\w.-]+\.(?:md|json)|\.github\/workflows\/[\w.-]+\.yml|[\w-]+\.yml)`/g)].map(m => m[1]))];
const missing = named.filter(f => !existsSync(f) && !existsSync('.github/workflows/' + f));
T(named.length >= 8 && !missing.length, 'وكلُّ ما تسمّيه المعماريةُ والتسليمُ موجود (' + named.length + ')' + (missing.length ? ' — مفقود: ' + missing.join(' · ') : ''));
T(/BACKUP_KEY/.test(hand) && /openssl enc -d/.test(hand) && /## ٦ · اليومُ الأول/.test(hand) && /Fine-grained/.test(hand), 'والتسليمُ يشرح الاستعادةَ والتدويرَ وقائمةَ اليوم الأول');
/* لا قيمةَ سرٍّ في الأدلة: لا مفتاحَ يشبه توكنًا ولا JSON حسابِ خدمة */
const leak = /(github_pat_|ghp_[A-Za-z0-9]{20,}|"private_key"|BEGIN PRIVATE KEY|AIza[0-9A-Za-z_-]{20,})/.test(hand + cost + arch + prod + roll);
T(!leak, 'ولا قيمةَ سرٍّ في الأدلة — الأسماءُ وحدَها');
T(/Budgets & alerts/.test(cost) && /٥٠٬٠٠٠/.test(cost) && /## ٣ · الفحصُ الأسبوعي/.test(cost), 'وحارسُ التكلفة: خطواتُ التنبيه والحصصُ والفحصُ الأسبوعي');
T(/budgetAlert/.test(html) && /تنبيهُ الميزانية مضبوط/.test(html) && /data-budalert/.test(html) && /docs\/cost-guard\.md/.test(html), 'وبندُ الجاهزية «تنبيهُ الميزانية مضبوط» موصولٌ ببطاقةٍ ودليل');
T(existsSync('docs/pilot-install.md') && existsSync('docs/rules-matrix.md'), 'ووثائقُ الموجات السابقة قائمة');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ وثائق التشغيل نظيف \u2705');
