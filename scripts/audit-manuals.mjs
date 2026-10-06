/* ═══ جردُ المساعد والأدلة (V33.2) — طلبُ المالك: «المساعدُ والدليلُ محدَّثان بكلِّ حاجة» ═══
   لا تُنشَر نسخةٌ إلا و: دليلُ المستخدم وكلُّ دليلِ دورٍ بنسختها وفيهما كلُّ مصطلحات المسرد وسطورُ «ما الجديد» لها؛
   والمساعدُ يجيب عن كلِّ مصطلحٍ ومرادفه بتعريفه؛ ولا يقول دليلُ المستخدم ولا المساعدُ «متعذّر» حالةً للعرض. */
import { readFileSync, readdirSync } from 'fs'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); require('./lib/jsdom-dict.cjs');
const JSZip = require('jszip'); const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = []; const T = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); } };
const html = readFileSync('index.html', 'utf8'), VER = (/نسخة (V\d+\.\d+)/.exec(html) || [])[1];
const arr = name => { const i = html.indexOf('var ' + name + ' = ['); let d = 0, j = html.indexOf('[', i), k = j; for (; k < html.length; k++){ if (html[k] === '[') d++; else if (html[k] === ']'){ d--; if (!d) break; } } return Function('"use strict"; return (' + html.slice(j, k + 1) + ');')(); };
const G = arr('GLOSSARY'), NOTE = arr('RELEASE_NOTES').find(n => n.notes && n.notes.length);
const docxText = async f => (await (await JSZip.loadAsync(readFileSync(f))).file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
console.log('══ ١ · دليلُ المستخدم ══');
const um = await docxText('docs/nusuk-user-manual.docx');
T(um.includes(VER), 'بنسخة التطبيق ' + VER);
T(G.every(g => um.includes(g.t) && um.includes(g.d.slice(0, 40))), 'وفيه كلُّ مصطلحات المسرد (' + G.length + ') بتعريفاتها');
T(NOTE && NOTE.notes.every(x => um.includes(x.slice(0, 50))), 'وسطورُ «ما الجديد» لآخر نسخةٍ لها سطور (' + (NOTE && NOTE.v) + ')');
const md = readFileSync('docs/user-manual.md', 'utf8');
T(!/(^|[^ء-ي])متعذّر[^ةً]/.test(md.replace(/«[^»]*متعذّر[^»]*»|\([^)]*متعذّر[^)]*\)|السببَ الحقيقيَّ \(متعذّر/g, '')), 'ولا يقول «متعذّر» حالةً للعرض — إلا اسمَ الخيار في نموذج الزيارة');
console.log('\n══ ٢ · أدلةُ الأدوار ══');
const files = readdirSync('docs/manuals').filter(f => f.endsWith('.docx'));
let okV = 0, okG = 0, okN = 0;
for (const f of files){ const x = await docxText('docs/manuals/' + f); if (x.includes(VER)) okV++; if (G.every(g => x.includes(g.t))) okG++; if (NOTE && x.includes(NOTE.notes[0].slice(0, 50))) okN++; }
T(okV === files.length && okG === files.length && okN === files.length, 'كلُّ دليلِ دورٍ (' + files.length + ') بالنسخة وفيه المسردُ وما الجديد — ' + okV + '/' + okG + '/' + okN);
console.log('\n══ ٣ · المساعد ══');
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window; w.HTMLCanvasElement.prototype.getContext = () => null; await new Promise(r => setTimeout(r, 700));
const miss = []; G.forEach(g => [g.t].concat(g.k || []).forEach(q => { if (!w.glossaryHits(q).some(h => h.t === g.t)) miss.push(q); }));
T(!miss.length, 'كلُّ مصطلحٍ ومرادفاته يُجاب بتعريفه' + (miss.length ? ' — لا يجيب: ' + miss.join('، ') : ''));
w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer'; w.ASSIST_Q = 'متعذر'; const h1 = w.assistHtml();
T(h1.indexOf('تحتاج زيارة أخرى تقنيًا') > -1, 'سؤالُ «متعذر» يُجاب بالمصطلح الحالي «تحتاج زيارة أخرى تقنيًا»');
w.ASSIST_Q = 'شاشة القاعة'; const h2 = w.assistHtml();
T(h2.indexOf('بعوائق وبدونها') > -1 && h2.indexOf('data-p="kiosk"') > -1, 'وسؤالُ «شاشة القاعة» يُجاب بخطواتها ويدلّ على شريحتها');
const steps = Object.values(w.HELP_STEPS).flat().join('\n');
T(!/شريحة «تمت الزيارة» فوق — تتفرّز/.test(steps) && /شريحة «تم الوصول»/.test(steps), 'وخطواتُه بأسماء الأزرار الحالية («تم الوصول» لا «تمت الزيارة» للشريحة)');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ console.log('جردُ المساعد والأدلة فشل ✗'); process.exit(1); }
console.log('جردُ المساعد والأدلة ✓'); process.exit(0);
