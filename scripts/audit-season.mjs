/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تغذية الموسم — node scripts/audit-season.mjs
   ───────────────────────────────────────────────────────────────────────────
   السيرُ يكتب في ثوابت النظام التي تُبنى عليها الوتيرةُ والمواعيدُ والحساسات،
   والقاعدةُ الوحيدة: يملأ الفارغَ ولا يمسُّ المضبوط. فإن كتب فوق رقمٍ ضبطه
   المهندسُ بيده أفسد قرارًا بلا أثر، وإن قرأ تاريخًا نصًّا لا رقمًا سكتت
   المواعيدُ. يُختبَر هنا على قاعدةٍ وهميةٍ معلومةِ الجواب.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';

let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); }
  else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };

const season = JSON.parse(readFileSync('docs/season.json', 'utf8'));
const S = season.settings;
T(!!S && S.tgtSurvey && S.dueSurvey && S.warranty && S.avgRooms, 'ملفُ الموسم يحمل التارجتَ والموعدَ والضمانَ ومتوسطَ الغرف');
T(Object.keys(S).every(k => S[k].source), 'ولكلِّ قيمةٍ مصدرُها');
T(/^\d{4}-\d{2}-\d{2}$/.test(S.dueSurvey.value) && !isNaN(Date.parse(S.dueSurvey.value)), 'والموعدُ تاريخٌ صالح');
T(S.avgRooms.value['منى'] === 12 && Object.keys(S.avgRooms.value).length === 1, 'ومتوسطُ الغرف لمنى وحدَها: ١٢');
T(Array.isArray(season.not_confirmed) && season.not_confirmed.indexOf('ph') > -1 && season.not_confirmed.indexOf('budCap') > -1,
  'وما لم يُؤكَّد مسمًّى لا مخمَّن: سعرُ النقطة وسقفُ الميزانية');
const html = readFileSync('index.html', 'utf8');
T(/avgRooms:\{\}/.test(html), 'والتطبيقُ يعرف avgRooms في ثوابته — وإلا أُهملت عند السحب');
T(Object.keys(S).every(k => new RegExp('\\b' + k + ':').test(html.slice(html.indexOf('var CFG = {'), html.indexOf('var CFG = {') + 3000))),
  'وكلُّ مفتاحٍ في الملف موجودٌ في CFG — ما ليس فيها لا يصل التطبيقَ أبدًا');

const run = db => {
  const f = '/tmp/season-audit-db.json'; writeFileSync(f, JSON.stringify(db));
  const out = execFileSync('node', ['scripts/season-seed.mjs'], { encoding:'utf8', env:{ ...process.env, SEED_DB:f, FIREBASE_SERVICE_ACCOUNT:'' } });
  const after = JSON.parse(readFileSync(f, 'utf8')); try { unlinkSync(f); } catch {}
  return { out, after };
};
console.log('\n══ قاعدةٌ فارغة ══');
{
  const { out, after } = run({});
  T(after.tgtSurvey === 13 && after.warranty === 12 && after.avgRooms && after.avgRooms['منى'] === 12, 'الفارغُ يُملأ: التارجتُ والضمانُ والمتوسط');
  T(typeof after.dueSurvey === 'number' && new Date(after.dueSurvey).toISOString().slice(0, 10) === '2026-12-30' || new Date(after.dueSurvey).toISOString().slice(0, 10) === '2026-12-31',
    'والموعدُ يُخزَّن رقمًا بتوقيت مكة');
  T(after._by === 'season-seed' && /يُملأ \(4\)/.test(out), 'ويُختَم باسم السير');
}
console.log('\n══ قاعدةٌ ضُبطت بيد ══');
{
  const { out, after } = run({ tgtSurvey:20, dueSurvey:1700000000000, warranty:24, avgRooms:{ 'منى':15, 'عرفات':9 }, ph:250,
                               __trials:{ rows:[{ id:'TR-001' }, { id:'TR-002' }, { id:'TR-003' }, { id:'TR-004' }], inCost:false } });
  T(after.tgtSurvey === 20 && after.warranty === 24 && after.dueSurvey === 1700000000000, 'المضبوطُ بيدٍ لا يُمَسّ');
  T(after.avgRooms['منى'] === 15 && after.avgRooms['عرفات'] === 9, 'ولا مفتاحُ الخريطة المضبوط');
  T(after.ph === 250 && /لا شيءَ يُكتَب/.test(out), 'وما ليس في الملف لا يُقرَب — ولا كتابةَ حين لا فراغ');
}
console.log('\n══ التجاربُ تُضاف بمعرّفها ولا تتكرّر ══');
{
  const { out, after } = run({});
  const rows = after.__trials && after.__trials.rows || [];
  T(rows.length === 4 && rows.every(r => r.gw && r.sn && r.snN === 4 && r.date), 'الأربعُ تُضاف بعُدّتها وتاريخٍ لا فراغ');
  const { after: again } = run(after);
  T((again.__trials.rows || []).length === 4 && /تجاربُ تُضاف \(0\)/.test(''+run(again).out), 'وتشغيلٌ ثانٍ لا يكرّرها');
  const { after: kept } = run({ __trials:{ rows:[{ id:'TR-002', n:'مُعدَّلةٌ بيد', gw:'X' }], inCost:true } });
  const r2 = kept.__trials.rows.filter(r => r.id === 'TR-002')[0];
  T(r2.n === 'مُعدَّلةٌ بيد' && kept.__trials.rows.length === 4 && kept.__trials.inCost === true, 'والمعدَّلُ بيدٍ لا يُمَسُّ ومفتاحُ التكاليف يبقى');
}
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ تغذية الموسم نظيف \u2705');
