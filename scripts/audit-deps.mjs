/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تطابق البيئة — node scripts/audit-deps.mjs
   ───────────────────────────────────────────────────────────────────────────
   سقط فحصٌ في السحابة بعد أن مرَّ الحارسُ محلّيًّا لأن مكتبةً كانت مثبَّتةً هنا
   ولا تثبّتها السحابة — فاختلفت النتيجةُ باختلاف الجهاز لا الشيفرة. القاعدةُ:
   كلُّ ما يستدعيه جردٌ أو سكربتٌ في قائمة الحارس مكتوبٌ في خطوة التثبيت التي
   تشغّلها السحابة، أو اختياريٌّ صراحةً (داخل try). ما عدا ذلك يسقط هنا قبل أن
   يسقط هناك.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'fs';
import { builtinModules } from 'module';
import { execSync } from 'child_process';
import { localSteps } from './cloud-steps.mjs';

let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };

const wf = readFileSync('.github/workflows/docs-check.yml', 'utf8');
const installs = [...wf.matchAll(/npm i [^\n]*?((?:[a-z@][\w./-]*@\^?[\d.]+\s*)+)/g)].map(m => m[1]);
const CI = new Set(); installs.forEach(l => l.trim().split(/\s+/).forEach(p => { const n = p.replace(/@\^?[\d.]+$/, ''); if (n) CI.add(n); }));
T(CI.size >= 3 && CI.has('jsdom'), 'قائمةُ ما تثبّته السحابةُ للفحص: ' + [...CI].join(' · '));
const shardsInstall = (wf.split('# ─── نهايةُ قائمة الحارس ───')[1] || '').match(/npm i [^\n]*/g) || [];
const canonical = (wf.split('# ─── نهايةُ قائمة الحارس ───')[0]).match(/npm i [^\n]*/g) || [];
const norm = s => (s.match(/[a-z@][\w./-]*@\^?[\d.]+/g) || []).sort().join(' ');
T(shardsInstall.length && canonical.length && norm(shardsInstall[0]) === norm(canonical[0]), 'والشرائحُ تثبّت ما تثبّته القائمةُ المتسلسلةُ حرفًا');

const builtin = new Set(builtinModules.map(m => m.replace(/^node:/, '')));
const seen = new Set(), bad = [];
const scan = (file, depth) => {
  if (seen.has(file) || !existsSync(file) || depth > 3) return; seen.add(file);
  const src = readFileSync(file, 'utf8'); const lines = src.split('\n');
  lines.forEach((ln, i) => {
    const m = /(?:require\(|createRequire\([^)]*\)\()\s*'([^'./][^']*)'\)|import\s+[^'"]*?from\s+'([^'./][^']*)'|import\(\s*'([^'./][^']*)'\)/.exec(ln);
    if (!m) return;
    const pkg = (m[1] || m[2] || m[3]).replace(/^node:/, '').split('/')[0];
    if (builtin.has(pkg) || CI.has(pkg)) return;
    /* اختياريٌّ صراحةً: try على السطر نفسِه أو السطر السابق */
    const optional = /\btry\s*\{/.test(ln) || /\btry\s*\{\s*$/.test(lines[i - 1] || '');
    if (!optional) bad.push(file.replace(/^scripts\//, '') + ':' + (i + 1) + ' → ' + pkg);
  });
  [...src.matchAll(/from\s+'\.\/([\w-]+\.mjs)'/g)].forEach(m => scan('scripts/' + m[1], depth + 1));
};
localSteps().forEach(s => { const m = /node (scripts\/[\w-]+\.mjs)/.exec(s.run); if (m) scan(m[1], 0); });
T(seen.size >= 80, 'فُحص ' + seen.size + ' سكربتًا تشغّله القائمة');
T(!bad.length, 'لا يستدعي جردٌ مكتبةً لا تثبّتها السحابةُ إلا اختياريًّا' + (bad.length ? ' — ' + bad.slice(0, 5).join(' | ') : ''));

/* والجهازُ الذي يشغّل الحارسَ لا يحمل مكتبةً فوق قائمة السحابة: ما زاد هنا
   يُنجح جردًا سيسقط هناك — كما وقع مع مكتبة الرمز */
/* ما يُسمَح به: مكتباتُ السحابة وكلُّ ما تجرُّه معها (إغلاقُ التبعيّات من package.json
   لكلِّ حزمة) — وما عداه في node_modules زائدٌ يُنجح محلّيًّا ما سيسقط هناك */
const readPkg = name => { try { return JSON.parse(readFileSync('node_modules/' + name + '/package.json', 'utf8')); } catch { return null; } };
const allowed = new Set(); const q = [...CI];
while (q.length){ const n = q.pop(); if (allowed.has(n)) continue; allowed.add(n); const pj = readPkg(n); if (!pj) continue;
  [pj.dependencies, pj.optionalDependencies, pj.peerDependencies].forEach(o => Object.keys(o || {}).forEach(d => { if (!allowed.has(d)) q.push(d); })); }
let top = [];
try { const { readdirSync } = await import('fs');
  readdirSync('node_modules').forEach(d => { if (d.startsWith('.')) return; if (d.startsWith('@')) readdirSync('node_modules/' + d).forEach(s => top.push(d + '/' + s)); else top.push(d); }); } catch {}
const extra = top.filter(p => !allowed.has(p));
T(top.length > 0 && !extra.length, 'ولا مكتبةَ في هذا الجهاز فوق قائمة السحابة وما تجرُّه (' + allowed.size + ' مسموحة)' + (extra.length ? ' — زائد: ' + extra.slice(0, 8).join(' · ') + ' (أزلها: npm rm ' + extra.slice(0, 8).join(' ') + ')' : ''));

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ تطابق البيئة نظيف \u2705');
