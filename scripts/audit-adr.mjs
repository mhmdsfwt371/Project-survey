/* ═══════════════════════════════════════════════════════════════════════════
   جردُ سجلات القرار والمعمارية — node scripts/audit-adr.mjs
   ───────────────────────────────────────────────────────────────────────────
   كلُّ سجلِّ قرارٍ يحمل الأقسامَ الخمسةَ وحالةً وصفوفَ §١٦ التي يربطها، والقراراتُ
   العشرةُ الحاملةُ موجودةٌ ومسمّاةٌ في الفهرس، ومخطّطا Mermaid في المعمارية
   بصيغةٍ يرسمها GitHub (كتلٌ مسوَّرةٌ بـ```mermaid تبدأ بـflowchart).
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, existsSync } from 'fs';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };
const files = readdirSync('docs/adr').filter(f => /^\d{4}-.*\.md$/.test(f) && f !== '0000-template.md').sort();
T(files.length >= 10, 'عشرةُ قراراتٍ حاملةٍ على الأقل: ' + files.length);
const SECS = ['## السياق', '## القرار', '## البدائل', '## العواقب', '## الحالة'];
const sys = readFileSync('docs/system.md', 'utf8');
let badS = [], badSt = [], badRow = [];
for (const f of files){
  const t = readFileSync('docs/adr/' + f, 'utf8');
  if (!SECS.every(s => t.includes(s + '\n'))) badS.push(f);
  if (!/\*\*الحالة\*\* \| (مقترح|معتمَد|مُلغى|مُستبدَل)/.test(t)) badSt.push(f);
  const rows = (/\*\*الصفوف في system\.md §١٦\*\* \| ([^\n|]+)/.exec(t) || [])[1] || '';
  const vs = rows.match(/V\d+\.\d+/g) || [];
  if (!vs.length || !vs.every(v => sys.includes('**' + v + '**') || sys.includes(v))) badRow.push(f + ':' + rows);
}
T(!badS.length, 'وكلٌّ يحمل الأقسامَ الخمسة' + (badS.length ? ' — ناقص: ' + badS.join(' · ') : ''));
T(!badSt.length, 'وحالةً من الأربع' + (badSt.length ? ' — ' + badSt.join(' · ') : ''));
T(!badRow.length, 'وكلُّ صفٍّ مربوطٍ موجودٌ في §١٦' + (badRow.length ? ' — ' + badRow.join(' · ') : ''));
const need = ['single-file', 'local-first', 'tombstones', 'pages-hosting', 'actions-as-server', 'staging-promotion', 'release-trains', 'cache-first', 'encrypted-backups', 'zero-added-cost'];
T(need.every(n => files.some(f => f.includes(n))), 'والقراراتُ العشرةُ الحاملةُ كلُّها مسجَّلة');
const idx = existsSync('docs/adr/README.md') ? readFileSync('docs/adr/README.md', 'utf8') : '';
T(files.every(f => idx.includes(f)), 'والفهرسُ يسمّيها كلَّها');
const arch = readFileSync('docs/architecture.md', 'utf8');
const mer = arch.match(/```mermaid\n(flowchart [LT][RB]\n[\s\S]*?)```/g) || [];
T(mer.length >= 2 && /مخطّطُ السياق/.test(arch) && /مخطّطُ الحاويات/.test(arch), 'ومخطّطا السياق والحاويات بصيغة Mermaid التي يرسمها GitHub: ' + mer.length);
T(mer.every(m => !/[<>]/.test(m.replace(/<br\/>/g, '').replace(/-->|<-->|-\.->|-->\|/g, ''))), 'وبلا وسومٍ خارج <br/> تكسر الرسم');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ سجلات القرار نظيف \u2705');
