/* ═══ جردُ الأسرار والسجلّات العامة (V33.0 — مراجعةُ الأمن) ═══
   المستودعُ عامٌّ وسجلّاتُ تشغيل GitHub مقروءةٌ للجميع: فلا كلمةَ مرورٍ تُطبَع في سجل، ولا مفتاحَ ولا رمزَ في ملف،
   وكلماتُ الحسابات الجديدة تُمحى تلقائيًّا، ومفتاحُ التشغيل لا يطلبه التطبيقُ إلا لمن تسمح له القواعد. */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); } };
console.log('══ الأسرارُ والسجلّاتُ العامة ══');
const walk = (d, out = []) => { for (const f of readdirSync(d)){ if (/^(node_modules|\.git|v14)$/.test(f)) continue; const p = join(d, f), st = statSync(p); if (st.isDirectory()) walk(p, out); else if (/\.(js|mjs|cjs|html|json|yml|yaml|md|py|txt)$/.test(f) && st.size < 8e6) out.push(p); } return out; };
const files = walk('.');
const hits = (re) => files.filter(p => re.test(readFileSync(p, 'utf8')));
T(!hits(/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}/).length, 'لا رمزَ GitHub في أيِّ ملف');
T(!hits(/-----BEGIN (RSA |EC |)PRIVATE KEY-----/).length && !hits(/"private_key"\s*:\s*"-----BEGIN/).length, 'ولا مفتاحَ خاصًّا ولا حسابَ خدمة');
/* الجرودُ تطبع «نجح ${pass}» عدّادًا لا كلمة — تُستثنى؛ وما سواها (سكربتاتُ الخادم والسيور) يُفحَص */
const logPw = files.filter(p => /\.(mjs|js|yml)$/.test(p) && !/scripts\/(audit-[\w-]+|qa)\.mjs$/.test(p) && /(console\.log|::notice|::warning|echo)[^\n]*\$\{\s*(pass|pw|password|p\.pass|d\.pass|x\.pass)\s*\}/.test(readFileSync(p, 'utf8')));
T(!logPw.length, 'ولا كلمةَ مرورٍ تُطبَع في سجلِّ تشغيلٍ عام' + (logPw.length ? ': ' + logPw.join('، ') : ''));
const prov = readFileSync('scripts/provision.mjs', 'utf8');
T(/WIPE_MS = 72 \* 3600e3/.test(prov) && /pass: admin\.firestore\.FieldValue\.delete\(\)/.test(prov), 'وكلماتُ الحسابات المنجزة تُمحى تلقائيًّا بعد ٧٢ ساعة');
const app = readdirSync('src').filter(f => f.endsWith('.js')).map(f => readFileSync('src/' + f, 'utf8')).join('\n');
T(/if \(effRole\(ROLE\) === 'admin' \|\| effRole\(ROLE\) === 'exec'\)\{\s*\n\s*DB\.col\('ghcfg'\)/.test(app), 'ومفتاحُ التشغيل لا يطلبه التطبيقُ إلا مديرُ المشروع والإدارةُ العليا — كما تسمح القواعد');
const rules = readFileSync('firestore.rules', 'utf8');
T(/match \/ghcfg\/\{id\} \{[\s\S]{0,300}allow read: if ok\(\) && \(role\(\) == 'admin' \|\| role\(\) == 'exec'\);/.test(rules), 'والقواعدُ تقصر قراءتَه عليهما');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ console.log('جردُ الأسرار فشل ✗'); process.exit(1); }
console.log('جردُ الأسرار ✓');
