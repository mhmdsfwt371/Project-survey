/* ═══════════════════════════════════════════════════════════════════════════
   جردُ دستور الوكلاء — node scripts/audit-agents.mjs
   ───────────────────────────────────────────────────────────────────────────
   كودكس يقرأ AGENTS.md، وكلود كود يقرأ CLAUDE.md. فإن شاخ الدستورُ — سمّى
   سكربتًا حُذف، أو أمرًا تغيّر، أو علامةً لم تعد في السير — عمل الوكيلُ بقاعدةٍ
   ميتة. يُفحَص هنا أن الدستورَ يطابق المستودعَ الحيّ.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'fs';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };

T(existsSync('AGENTS.md') && existsSync('CLAUDE.md') && existsSync('docs/SETUP-AGENTS.md'), 'الملفّاتُ الثلاثة قائمة: AGENTS.md · CLAUDE.md · docs/SETUP-AGENTS.md');
const A = readFileSync('AGENTS.md', 'utf8'), C = readFileSync('CLAUDE.md', 'utf8'), S = readFileSync('docs/SETUP-AGENTS.md', 'utf8');
const wf = readFileSync('.github/workflows/docs-check.yml', 'utf8'), html = readFileSync('index.html', 'utf8');
T(/^@AGENTS\.md$/m.test(C), 'CLAUDE.md يستورد AGENTS.md — دستورٌ واحدٌ للوكيلين');

/* كلُّ سكربتٍ يسمّيه الدستورُ موجود */
const scripts = [...new Set([...A.matchAll(/scripts\/([\w-]+\.mjs)/g), ...C.matchAll(/scripts\/([\w-]+\.mjs)/g)].map(m => m[1]))];
const missing = scripts.filter(f => !existsSync('scripts/' + f));
T(scripts.length >= 4 && !missing.length, 'كلُّ سكربتٍ مسمًّى موجود: ' + scripts.join(' · ') + (missing.length ? ' — مفقود: ' + missing.join(' · ') : ''));
const audits = [...new Set([...A.matchAll(/`(audit-[\w-]+)`/g)].map(m => m[1]))];
T(audits.every(a => existsSync('scripts/' + a + '.mjs')), 'وكلُّ جردٍ مسمًّى موجود: ' + audits.join(' · '));

/* الأوامرُ والعلاماتُ تطابق السيرَ الحيّ */
const inst = (wf.split('# ─── نهايةُ قائمة الحارس ───')[0].match(/npm i [^\n]*/) || [''])[0].match(/[a-z@][\w./-]*@\^?[\d.]+/g) || [];
T(inst.length && inst.every(p => A.includes(p) && S.includes(p)), 'أمرُ البيئة في الدستور ودليل التشغيل هو أمرُ السحابة حرفًا: ' + inst.join(' '));
T(A.includes('# ─── نهايةُ قائمة الحارس ───') && wf.includes('# ─── نهايةُ قائمة الحارس ───'), 'وعلامةُ نهاية القائمة هي هي في الدستور والسير');
T(/HEAD:staging/.test(A) && /branches: \[main, staging\]/.test(wf), 'والدفعُ إلى staging كما يشغّله السير');

/* الدوالُّ في الخريطة حيّةٌ في التطبيق */
const fns = [...new Set([...A.matchAll(/`(\w+)\(\)`/g)].map(m => m[1]))];
const dead = fns.filter(f => !new RegExp('function ' + f + '\\(').test(html));
T(fns.length >= 12 && !dead.length, 'كلُّ دالّةٍ في الخريطة معرَّفةٌ في التطبيق: ' + fns.length + (dead.length ? ' — ميتة: ' + dead.join(' · ') : ''));
const vars = ['CAT_DEF', 'SHAPES', 'LIFE', 'SVD_CARDS', 'NAV', 'TABS', 'CFG', 'RELEASE_NOTES'].filter(v => A.includes('`' + v + '`'));
T(vars.every(v => new RegExp('var ' + v + '\\b').test(html)), 'والمتغيّراتُ المسمّاةُ قائمة: ' + vars.join(' · '));
T(/'اسمٌ مركَّب':'Compound names',/.test(html) && /'اسمٌ مركَّب':'مرکب نام',/.test(html) && A.includes("'اسمٌ مركَّب':'Compound names',"), 'ومرساتا القاموس اللتان يسمّيهما الدستورُ موجودتان');
T(/class="ver-tag"/.test(html) && A.includes('class="ver-tag"'), 'وموضعُ ختم النسخة هو وسمُ الرأس');

/* الإضافةُ كما نُشرت */
T(S.includes('/plugin marketplace add openai/codex-plugin-cc') && S.includes('/plugin install codex@openai-codex') && S.includes('/codex:setup'), 'ودليلُ التشغيل يحمل أوامرَ الإضافة كما نشرتها أوبن إيه آي');
T(/--enable-review-gate/.test(C) && /لا تفعّل/.test(C), 'والتحذيرُ من بوابة المراجعة المستنزِفة مكتوب');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ دستور الوكلاء نظيف \u2705');
