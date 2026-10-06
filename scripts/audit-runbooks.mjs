/* ═══ جردُ حزمة التسليم (V33.0) ═══
   صفحةُ «ابدأ من هنا» موجودةٌ بأقسامها، وكلُّ سيرٍ في .github/workflows له دليلٌ في docs/runbooks.md، وكلُّ سرٍّ تستعمله السيورُ
   مذكورٌ اسمُه في جرد الأسرار — فسيرٌ أو سرٌّ جديدٌ بلا توثيقٍ ترفضه البوابة، ولا يبقى التسليمُ صحيحًا يومًا واحدًا فقط. */
import { readFileSync, readdirSync, existsSync } from 'fs';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); } };
console.log('══ حزمةُ التسليم ══');
const sh = existsSync('docs/START-HERE.md') ? readFileSync('docs/START-HERE.md', 'utf8') : '';
T(['## المفاهيمُ العشرة', '## خريطةُ المستودع', '## في عشر دقائق: ابنِ وافحص', '## سياسةُ الإصدار', '## قواعدُ لا تُكسر'].every(h => sh.includes(h)), 'صفحةُ «ابدأ من هنا» بأقسامها الخمسة');
const srcFiles = readdirSync('src').filter(f => /^\d\d-/.test(f));
const js = srcFiles.filter(f => f.endsWith('.js')), html = srcFiles.filter(f => f.endsWith('.html'));
T(html.every(f => sh.includes('`' + f + '`')) && sh.includes('`' + js[0].slice(0, 2) + '`') && sh.includes('`' + js[js.length - 1].slice(0, 2) + '`'), 'وخريطتُها تسمّي ملفاتِ المصدر (' + srcFiles.length + ')');
const rb = existsSync('docs/runbooks.md') ? readFileSync('docs/runbooks.md', 'utf8') : '';
const wfs = readdirSync('.github/workflows').filter(f => f.endsWith('.yml'));
const missing = wfs.filter(f => !rb.includes('`' + f + '`'));
T(!missing.length, 'كلُّ سيرٍ (' + wfs.length + ') له دليلُ تشغيل' + (missing.length ? ' — ناقص: ' + missing.join('، ') : ''));
const secrets = new Set(); wfs.forEach(f => (readFileSync('.github/workflows/' + f, 'utf8').match(/secrets\.([A-Z0-9_]+)/g) || []).forEach(m => secrets.add(m.slice(8))));
const sm = [...secrets].filter(s => !rb.includes('`' + s + '`'));
T(!sm.length, 'وكلُّ سرٍّ (' + secrets.size + ') مذكورٌ اسمُه في جرد الأسرار' + (sm.length ? ' — ناقص: ' + sm.join('، ') : ''));
T(/لا قيم|الأسماءُ فقط/.test(rb) && !/[A-Za-z0-9+/]{40,}={0,2}/.test(rb), 'وجردُ الأسرار أسماءٌ بلا قيم');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ console.log('جردُ حزمة التسليم فشل ✗'); process.exit(1); }
console.log('جردُ حزمة التسليم ✓');
