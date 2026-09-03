/* ═══ مولِّدُ أدلة الأدوار — دليلٌ لكلِّ دورٍ من صلاحياته ═══
   الدليلُ المُنزَّلُ كان ملفًّا واحدًا للجميع، فتقرأ الوزارةُ عن اعتماداتٍ
   لا تملكها والسائقُ عن ميزانيةٍ لا يراها. وهذا يُخرج ثلاثةَ عشرَ ملفًّا
   — واحدًا لكلِّ دور — من المصدر نفسِه الذي يقرؤه دليلُ الشاشة: ROLES
   وPAGE وSOPS في index.html. فلا سبيلَ لأن يصف الدليلُ صلاحيةً غيرَ
   القائمة، ومن غيّر صلاحيةً ثم شغّل المولِّدَ غيّر الدليلَ معها.

   يُشغَّل:  node scripts/role-manuals.mjs
   يُخرج:   docs/manuals/nusuk-manual-<role>.docx */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow,
        TableCell, WidthType, AlignmentType, BorderStyle, ShadingType,
        PageBreak, LevelFormat } = require('docx');

const src = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const VER = (/>نسخة (V[\d.]+)<\/button>/.exec(src) || [])[1] || 'V?';

/* ── قراءةُ الثوابت من المصدر لا من نسخةٍ تُحفَظ ── */
function block(name){
  const i = src.indexOf('var ' + name + ' = ');
  if (i < 0) throw new Error(name + ' غير موجود');
  let depth = 0, j = src.indexOf('{', i), k = j;
  for (; k < src.length; k++){
    if (src[k] === '{') depth++;
    else if (src[k] === '}'){ depth--; if (!depth) break; }
  }
  return src.slice(j, k + 1);
}
function evalObj(s){ return Function('"use strict"; return (' + s + ')')(); }

const ROLES   = evalObj(block('ROLES'));
const PAGE_CAP = evalObj(block('PAGE_CAP'));
const SOPS    = evalObj((/var SOPS = (\[[\s\S]*?\n\]);/.exec(src) || [])[1] || '[]');

/* الصفحاتُ من مصدرَيها */
const PAGES = {};
for (const m of src.matchAll(/PAGE\.(\w+) = \{ m:'([^']*)', t:'([^']*)',(?:\s*\n?\s*)l:'((?:[^'\\]|\\.)*)'/g))
  PAGES[m[1]] = { m: m[2], t: m[3], l: m[4].replace(/\\'/g, "'") };
for (const m of src.matchAll(/^  (\w+):\s*\{ m:'([^']*)', t:'([^']*)', l:'((?:[^'\\]|\\.)*)'/gm))
  if (!PAGES[m[1]]) PAGES[m[1]] = { m: m[2], t: m[3], l: m[4].replace(/\\'/g, "'") };

const CAP_SAY = evalObj(block('CAP_SAY'));
/* V15.29: شرائحُ الصفحات المدموجة — كلُّ شريحةٍ تُذكَر في الدليل باسمها القديم
   ووصفِها الأصلي («السيارات ← الإسناد»)، فالسائقُ يقرأ «سيارتي» لا «السيارات».
   والأمُّ التي ليست شريحةً (نقاط المراحل، المخزون، التنظيم) لا تُذكَر وحدَها. */
const TABS = evalObj(block('TABS'));
const TAB_PARENT = {};
Object.keys(TABS).forEach(pid => TABS[pid].forEach(tb => { TAB_PARENT[tb[0]] = pid; }));
Object.keys(TABS).forEach(pid => {
  const par = PAGES[pid]; if (!par) return;
  TABS[pid].forEach(tb => {
    PAGES[tb[0]] = { m: par.m, t: par.t + ' ← ' + tb[1], l: tb[3] || '' };
  });
});
/* كلُّ ما يُفتَح لمن يرى كلَّ شيء: الشرائحُ بدل أمهاتها */
const ALL_IDS = Object.keys(PAGES).filter(id => !TABS[id] || TAB_PARENT[id] === id);

/* ── التنسيق ── */
const FONT = 'Arial';
const RTL = { bidirectional: true };
const rtl = (text, opts = {}) => new Paragraph({
  ...RTL, alignment: AlignmentType.START, spacing: { after: 120 },
  children: [new TextRun({ text, font: FONT, size: opts.size || 22, bold: !!opts.bold,
                           color: opts.color, rightToLeft: true })],
  ...(opts.heading ? { heading: opts.heading } : {}),
});
const h1 = t => rtl(t, { heading: HeadingLevel.HEADING_1, bold: true, size: 32 });
const h2 = t => rtl(t, { heading: HeadingLevel.HEADING_2, bold: true, size: 26 });
const cell = (text, w, head) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: head ? { type: ShadingType.CLEAR, fill: 'E8F1FA', color: 'auto' } : undefined,
  children: [new Paragraph({ ...RTL, alignment: AlignmentType.START,
    children: [new TextRun({ text: String(text || ''), font: FONT, size: 20, bold: !!head, rightToLeft: true })] })],
});
function table(head, rows, widths){
  const W = widths || head.map(() => Math.floor(9000 / head.length));
  return new Table({
    ...RTL, width: { size: W.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: W,
    rows: [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, W[i], true)) }),
           ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, W[i])) }))],
  });
}

/* ── دليلُ دورٍ واحد ── */
function manualFor(id){
  const x = ROLES[id];
  const caps = Object.keys(x.can || {}).filter(c => x.can[c]);
  /* V15.33: الشريحةُ التي لم تكن صفحةً ليست في قوائم الأدوار — رؤيتُها
     رؤيةُ أمِّها. فتُضاف إلى دليل من يرى أمَّها، وإلا نقص الدليلُ عمّا يراه. */
  let ids = x.nav === '*' ? ALL_IDS : x.nav.filter(i => PAGES[i]);
  if (x.nav !== '*'){
    const extra = [];
    Object.keys(TABS).forEach(pid => {
      if (ids.indexOf(pid) < 0) return;
      TABS[pid].forEach(tb => { if (tb[4] && ids.indexOf(tb[0]) < 0) extra.push(tb[0]); });
    });
    ids = ids.concat(extra);
  }
  const byGroup = {};
  ids.forEach(i => {
    const p = PAGES[i]; if (!p) return;
    const cap = PAGE_CAP[i]; if (cap && !x.can[cap]) return;
    (byGroup[p.m] = byGroup[p.m] || []).push(p);
  });
  const sops = SOPS.filter(sp => (sp.own || '').indexOf(x.n) > -1);
  const n = Object.values(byGroup).reduce((a, g) => a + g.length, 0);

  const kids = [
    rtl('قارئات نُسُك — حج ١٤٤٨هـ', { size: 20, color: '666666' }),
    h1('دليل المستخدم — ' + x.n),
    rtl('النسخة ' + VER + ' · يُولَّد من صلاحيات الدور نفسِها — فلا يصف ما لا تملك.', { size: 20, color: '666666' }),
    rtl(x.d || '', { size: 24 }),
    h2('ما تستطيعه'),
    caps.length
      ? table(['القدرة', 'ما تعنيه'], caps.map(c => [c, CAP_SAY[c] || c]), [3000, 6000])
      : rtl('هذا الدور للعرض فقط — يقرأ ولا يكتب في النظام شيئًا.'),
    rtl(''),
    h2('شاشاتك — ' + n),
    rtl('كلُّ شاشةٍ تبلغها من القائمة الجانبية، وما تفعله فيها:', { size: 20, color: '666666' }),
  ];
  Object.keys(byGroup).forEach(g => {
    kids.push(rtl(g, { bold: true, size: 24 }));
    kids.push(table(['الشاشة', 'ما تفعله فيها'], byGroup[g].map(p => [p.t, p.l || '']), [2600, 6400]));
    kids.push(rtl(''));
  });
  if (sops.length){
    kids.push(h2('دوراتُ عملك — ' + sops.length));
    sops.forEach(sp => {
      kids.push(rtl(sp.n, { bold: true, size: 24 }));
      kids.push(rtl('ما يبدؤها: ' + (sp.trig || ''), { size: 20, color: '666666' }));
      kids.push(table(['#', 'من', 'ما يفعل', 'أين'],
        sp.steps.map((st, i) => [String(i + 1), st[0], st[1], st[2] === '—' ? 'تلقائي' : st[2]]),
        [600, 1600, 4400, 2400]));
      if (sp.rules && sp.rules.length){
        kids.push(rtl('قواعدُ لا تُخرَق:', { bold: true, size: 20 }));
        sp.rules.forEach(r => kids.push(rtl('⚠ ' + r, { size: 20 })));
      }
      kids.push(rtl(''));
    });
  }
  kids.push(rtl('هذا الدليل مُولَّدٌ آليًّا من تعريف الدور في النظام — من غيّر صلاحيةً ثم أعاد التوليدَ غيّر الدليلَ معها.',
                { size: 18, color: '888888' }));
  return kids;
}

/* ── الإخراج ── */
mkdirSync(new URL('../docs/manuals/', import.meta.url), { recursive: true });
const index = [];
for (const id of Object.keys(ROLES)){
  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{ properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
                 children: manualFor(id) }],
  });
  const buf = await Packer.toBuffer(doc);
  const file = `nusuk-manual-${id}.docx`;
  writeFileSync(new URL('../docs/manuals/' + file, import.meta.url), buf);
  index.push({ id, n: ROLES[id].n, file });
  console.log('  ✓ ' + id.padEnd(11) + ROLES[id].n.padEnd(16) + file + '  ' + (buf.length / 1024).toFixed(0) + ' ك.ب');
}
writeFileSync(new URL('../docs/manuals/index.json', import.meta.url),
  JSON.stringify({ version: VER, manuals: index }, null, 2) + '\n');
console.log(`\n${index.length} دليلًا — النسخة ${VER} ✅`);
