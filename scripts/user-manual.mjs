/* ═══ مولِّدُ دليل المستخدم (V33.2) — طلبُ المالك: «الدليلُ محدَّثٌ بكلِّ حاجة» ═══
   كان docs/nusuk-user-manual.docx ملفًّا كُتب في أغسطس ولا يتغيّر إلا رقمُ نسخته. صار يُولَّد في كلِّ رفعِ نسخة من ثلاثة مصادر:
   ١) docs/user-manual.md — الفصولُ المكتوبة بالواجهة الحالية (يُحرَّر هذا لا الملف)،
   ٢) GLOSSARY في التطبيق — المصطلحاتُ نفسُها التي يشرحها المساعد،
   ٣) RELEASE_NOTES في التطبيق — «ما الجديد» لآخر النسخ بلغة المستخدم.
   يُشغَّل: node scripts/user-manual.mjs  (وتشغّله scripts/bump.mjs مع كلِّ نسخة) */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const JSZip = require('jszip');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } = require('docx');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const VER = (/>نسخة (V[\d.]+)<\/button>/.exec(html) || [])[1] || (/نسخة (V\d+\.\d+)/.exec(html) || [])[1];
if (!VER) throw new Error('لا رقمَ نسخةٍ في index.html');
const arr = name => { const i = html.indexOf('var ' + name + ' = ['); if (i < 0) throw new Error(name + ' غير موجود');
  let d = 0, j = html.indexOf('[', i), k = j; for (; k < html.length; k++){ if (html[k] === '[') d++; else if (html[k] === ']'){ d--; if (!d) break; } }
  return Function('"use strict"; return (' + html.slice(j, k + 1) + ');')(); };
const GLOSSARY = arr('GLOSSARY'), NOTES = arr('RELEASE_NOTES').filter(n => n.notes && n.notes.length).slice(0, 8);
const FONT = 'Arial';
const P = (text, o = {}) => new Paragraph({ bidirectional:true, alignment:o.center ? AlignmentType.CENTER : AlignmentType.START, spacing:{ after:o.after ?? 120 },
  ...(o.heading ? { heading:o.heading } : {}), children:[new TextRun({ text, font:FONT, size:o.size || 22, bold:!!o.bold, color:o.color, rightToLeft:true })] });
const H1 = t => P(t, { heading:HeadingLevel.HEADING_1, bold:true, size:32, after:160 });
const H2 = t => P(t, { heading:HeadingLevel.HEADING_2, bold:true, size:26 });
const today = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-arab', { day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Riyadh' }).format(new Date());
const md = readFileSync(new URL('../docs/user-manual.md', import.meta.url), 'utf8').split('\n');
const body = [], toc = [];
md.forEach(l => { const s = l.trimEnd(); if (!s.trim()) return;
  if (s.startsWith('# ')){ toc.push(s.slice(2)); body.push(H1(s.slice(2))); }
  else if (s.startsWith('## ')) body.push(H2(s.slice(3)));
  else if (/^- /.test(s)) body.push(P('•  ' + s.slice(2)));
  else if (/^\d+\. /.test(s)) body.push(P(s.replace(/^(\d+)\. /, (m, n) => n.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) + '.  ')));
  else body.push(P(s)); });
const children = [
  P('متابعة المشروع ١٤٤٨هـ', { center:true, bold:true, size:40, after:80 }), P('دليل الاستخدام', { center:true, bold:true, size:32, after:80 }),
  P('النسخة ' + VER + '  ·  ' + today + '  ·  يُولَّد آليًّا من التطبيق نفسِه', { center:true, size:20, color:'666666', after:240 }),
  H1('المحتويات'), ...toc.concat(['المصطلحات', 'ما الجديد في آخر النسخ']).map((x, i) => P((i + 1).toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) + '.  ' + x)),
  new Paragraph({ children:[new PageBreak()] }),
  ...body,
  H1('المصطلحات'), P('المصطلحاتُ نفسُها في كلِّ الشاشات والتقارير، ويشرحها المساعد 🧭 إن سألتَ عنها.', { color:'555555' }),
  ...GLOSSARY.flatMap(g => [P(g.t, { bold:true, after:40 }), P(g.d)]),
  H1('ما الجديد في آخر النسخ'),
  ...NOTES.flatMap(n => [P(n.v + (n.d ? '  ·  ' + n.d : ''), { bold:true, after:40 }), ...n.notes.map(x => P('•  ' + x))]),
  P('— انتهى دليل الاستخدام —', { center:true, color:'888888' })
];
const doc = new Document({ styles:{ default:{ document:{ run:{ font:FONT, size:22 } } } }, sections:[{ properties:{ page:{ margin:{ top:1134, right:1134, bottom:1134, left:1134 } } }, children }] });
/* ثابتٌ بايتًا ببايت لنفس المحتوى (كأدلة الأدوار): تواريخُ الحزمة ثابتة */
const z = await JSZip.loadAsync(await Packer.toBuffer(doc)); const out = new JSZip();
for (const n of Object.keys(z.files).sort()){ const f = z.files[n]; if (f.dir) continue; out.file(n, await f.async('nodebuffer'), { date:new Date('2026-01-01T00:00:00Z') }); }
const buf = await out.generateAsync({ type:'nodebuffer', compression:'DEFLATE', platform:'UNIX' });
writeFileSync(new URL('../docs/nusuk-user-manual.docx', import.meta.url), buf);
console.log('✓ دليل المستخدم ' + VER + ' — ' + body.length + ' فقرةً من الفصول، ' + GLOSSARY.length + ' مصطلحات، ' + NOTES.length + ' نسخ — ' + (buf.length / 1024).toFixed(0) + ' ك.ب');
