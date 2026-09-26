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
  /* (V18.9) التارجتُ يحكمه القرارُ الصريح (٣٥٠٠) لا الملءُ (١٣) */
  T(after.tgtSurvey === 3500 && after.warranty === 12 && after.avgRooms && after.avgRooms['منى'] === 12, 'الفارغُ يُملأ: الضمانُ والمتوسط — والتارجتُ بالقرار');
  T(typeof after.dueSurvey === 'number' && new Date(after.dueSurvey).toISOString().slice(0, 10) === '2026-12-30' || new Date(after.dueSurvey).toISOString().slice(0, 10) === '2026-12-31',
    'والموعدُ يُخزَّن رقمًا بتوقيت مكة');
  T(after._by === 'season-seed' && /يُملأ \(4\)/.test(out), 'ويُختَم باسم السير');
}
console.log('\n══ قاعدةٌ ضُبطت بيد ══');
{
  const { out, after } = run({ tgtSurvey:20, dueSurvey:1700000000000, warranty:24, avgRooms:{ 'منى':15, 'عرفات':9 }, ph:250,
                               __trials:{ rows:[{ id:'TR-001' }, { id:'TR-002' }, { id:'TR-003' }, { id:'TR-004' }], inCost:false } });
  T(after.warranty === 24 && after.dueSurvey === 1700000000000, 'المضبوطُ بيدٍ لا يُمَسّ (الضمانُ والموعد)');
  T(after.tgtSurvey === 3500 && after.otRate === 1 && after.w && after.w['منى|مخيمات'] === 2 && after.w['عرفات|مخيمات'] === 3 && after.decisions && after.decisions['2026-09-25-weights-target-no-ot'], 'والقرارُ الصريحُ يغلب المضبوطَ بيد: التارجتُ والأوزانُ والإضافي، ويُختَم');
  T(after.avgRooms['منى'] === 15 && after.avgRooms['عرفات'] === 9, 'ولا مفتاحُ الخريطة المضبوط');
  T(after.ph === 1 && /قراراتٌ تُطبَّق \(\d+\)/.test(out), 'وسعرُ النقطة بالقرار (١ حافزًا)');
  /* قرارٌ طُبِّق من قبل لا يُعاد: ما ضُبط بعده بيدٍ يبقى */
  const { out: o3, after: a3 } = run({ tgtSurvey:20, ph:250, warranty:24, dueSurvey:1700000000000, avgRooms:{ 'منى':15 }, w:{ 'منى|مخيمات':7 }, decisions:{ '2026-09-25-weights-target-no-ot': 1758700000000, '2026-09-25-ministry-cameras': 1758700000000, '2026-09-25-ministry-cameras-merge-by-label': 1758700000000, '2026-09-26-nawariya-zone': 1758700000000 },
                                       __trials:{ rows:[{ id:'TR-001' }, { id:'TR-002' }, { id:'TR-003' }, { id:'TR-004' }], inCost:false } });
  T(a3.tgtSurvey === 20 && a3.ph === 250 && a3.w['منى|مخيمات'] === 7 && /طُبِّقت من قبل \(4\)/.test(o3) && /لا شيءَ يُكتَب/.test(o3), 'وقرارٌ طُبِّق من قبل لا يُعاد — وما ضُبط بعده بيدٍ يبقى، ولا كتابةَ حين لا فراغ');
}
console.log('\n══ قرارُ الأنواع: تسميةٌ ودمجٌ مرةً واحدة (V19.1) ══');
{
  const db0 = { __types:{ 'كاميرا':{ l:'كاميرات فالوزارة', i:'x', c:'#000' }, 'كاميرات LPR':{ l:'كاميرات LPR', i:'y', c:'#111' } },
                __newsites:{ N1:{ type:'كاميرات LPR', zone:'عرفات' }, N2:{ type:'مخيم' } }, __sitesCol:{ S1:{ type:'كاميرات LPR' } },
                __mxExtra:{ 0:'الترددية|كاميرات LPR', 1:'عرفات|كاميرات LPR', _by:'x' },
                decisions:{ '2026-09-25-weights-target-no-ot': 1 } };
  const { out, after } = run(db0);
  T(after.__types['كاميرا'].l === 'كاميرات الوزارة' && after.__types['LPR'].l === 'كاميرات الوزارة — LPR' && after.__types['كاميرات LPR'].gone === true, 'التسميةُ صُحِّحت والمدموجُ شاهدُ حذف');
  T(after.__newsites.N1.type === 'LPR' && after.__newsites.N2.type === 'مخيم' && after.__sitesCol.S1.type === 'LPR', 'ونقاطُ المدموج صارت LPR — وغيرُها لم يُمَسّ');
  T(after.__mxExtra[0] === 'الترددية|LPR' && after.__mxExtra[1] === 'عرفات|LPR' && after.__mxExtra._by === 'x', 'والتركيباتُ المعلَنةُ أُعيد مفتاحُها');
  T(after.w['منى|كاميرات الوزارة'] === 1 && after.decisions['2026-09-25-ministry-cameras'], 'والأوزانُ بالتسمية الجديدة، والقرارُ مختوم');
  const { out: o2, after: a2 } = run(after);
  T(/طُبِّقت من قبل \(4\)/.test(o2) && a2.__newsites.N1.type === 'LPR', 'وتشغيلٌ ثانٍ لا يعيده');
}
console.log('\n══ الدمجُ بالتسمية: المفتاحُ الداخليُّ غيرُ الاسم الظاهر (V19.2) ══');
{
  const db1 = { __types:{ 'LPR-2':{ l:'كاميرات LPR ', i:'y', c:'#111' }, 'مخيم':{ l:'مخيمات' } },
                __newsites:{ N7:{ type:'LPR-2' }, N8:{ type:'مخيم' } }, __sitesCol:{},
                decisions:{ '2026-09-25-weights-target-no-ot':1, '2026-09-25-ministry-cameras':1 } };
  const { out, after } = run(db1);
  T(/إحصاءُ الأنواع \(2\)/.test(out) && /«LPR-2» ← «كاميرات LPR/.test(out) && /نقاطٌ في sites\/newsites: 1/.test(out), 'الإحصاءُ يُطبَع: المفتاحُ وتسميتُه وعددُ نقاطه');
  T(after.__newsites.N7.type === 'LPR' && after.__newsites.N8.type === 'مخيم' && after.__types['LPR-2'].gone === true && after.decisions['2026-09-25-ministry-cameras-merge-by-label'], 'والمفتاحُ الذي تسميتُه «كاميرات LPR» يُدمَج في LPR ويُختَم');
}
console.log('\n══ مشعرُ النوارية: إعلانٌ ونقلٌ بالمستطيل (V20.1) ══');
{
  const db2 = { __newsites:{ N9:{ zone:'منى', name:'منى - مربع - شاخص', type:'LPR', lat:21.57659, lng:39.75675 }, N10:{ zone:'منى', name:'منى - مربع 10', type:'مخيم', lat:21.41, lng:39.88 } },
                __sitesCol:{}, __mxExtra:{ 0:'الترددية|كاميرات LPR' },
                decisions:{ '2026-09-25-weights-target-no-ot':1, '2026-09-25-ministry-cameras':1, '2026-09-25-ministry-cameras-merge-by-label':1 } };
  const { out, after } = run(db2);
  T(after.__newsites.N9.zone === 'النوارية' && after.__newsites.N9.name === 'النوارية - مربع - شاخص' && after.__newsites.N10.zone === 'منى', 'النقطةُ في مستطيل النوارية نُقلت وتبدّل اسمُها — وما في منى بقي');
  T(Object.values(after.__mxExtra).includes('النوارية|كاميرات الوزارة — LPR') && Object.values(after.__mxExtra).includes('الترددية|كاميرات LPR') && after.w['النوارية|كاميرات الوزارة — LPR'] === 1, 'والمشعرُ مُعلَنٌ بنوعيه مع ما كان، ووزنُه ١');
  T(/نقاطٌ نُقلت: N9/.test(out), 'والتعليقُ يسمّي ما نُقل');
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
console.log('\n══ التوأمُ يُدمَج الواضحُ وحدَه ══');
{
  const TW = JSON.parse(readFileSync('docs/twins.json', 'utf8'));
  T(TW.pairs.length === 14 && TW.pairs.every(p => p.length === 2 && p[0] !== p[1]), 'أربعةَ عشرَ زوجًا في الملف');
  const [p1, p2, p3, p4] = TW.pairs;
  const db0 = { __trials:{ rows:[{ id:'TR-001' },{ id:'TR-002' },{ id:'TR-003' },{ id:'TR-004' }] }, tgtSurvey:1, dueSurvey:1, warranty:1, avgRooms:{ 'منى':1 },
    __recs:{ [p1[0]]:{ access:'تم الوصول', review:'pending' }, [p2[1]]:{ access:'تم الوصول', review:'approved' }, [p3[0]]:{ access:'تم الوصول' }, [p3[1]]:{ access:'تم الوصول' }, [p4[0]]:{ access:'لم يُصل' } },
    __sites:{} };
  const { out, after } = run(db0);
  const s = after.__sites || {};
  T(s[p1[1]] && s[p1[1]].dupOf === p1[0] && s[p1[1]].hidden === true, 'الزوجُ الأولُ: المُسِحُ أصلٌ والآخرُ يُدمَج فيه');
  T(s[p2[0]] && s[p2[0]].dupOf === p2[1], 'والثاني بالعكس — الأصلُ ما مُسح لا ترتيبُ الكتابة');
  T(!s[p3[0]] && !s[p3[1]] && /كلاهما مُسح/.test(out), 'وما مُسح فيه كلاهما يُترَك قرارًا بشريًّا');
  T(!s[p4[0]] && !s[p4[1]] && /لم يُمسَح أحدُهما/.test(out), 'وما لم يُوصَل إليه ليس مسحًا — يُترَك');
  T(Object.keys(s).length === 2 && /توائمُ تُدمَج \(2\)/.test(out), 'فيُدمَج الواضحُ وحدَه: ٢ من ١٤');
  const { after: again, out: out2 } = run(after);
  T(Object.keys(again.__sites || {}).length === 2 && /دُمج من قبل/.test(out2), 'وتشغيلٌ ثانٍ لا يمسُّ ما دُمج');
  const manual = { ...db0, __sites:{ [p1[0]]:{ hidden:true, dupOf:p1[1], dupBy:'مهندس' } } };
  const { after: kept } = run(manual);
  T(kept.__sites[p1[0]].dupBy === 'مهندس' && !kept.__sites[p1[1]], 'وما دمجه المهندسُ بيده — ولو بالعكس — لا يُلمَس');
}
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ تغذية الموسم نظيف \u2705');
