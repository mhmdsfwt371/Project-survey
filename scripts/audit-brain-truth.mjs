/* ═══════════════════════════════════════════════════════════════════════════
   The brain's numbers are the pages' numbers — node scripts/audit-brain-truth.mjs   (V47.8)
   ───────────────────────────────────────────────────────────────────────────
   The owner's report (17 Nov 2026, three screenshots): «كم نقطة تحت كبرى» was answered with the progress of all
   2,028 points — the location words were dropped without a word — «(100%)» stood beside «لم تزر ٢», and the
   «حدّدها» button selected two train gates that are under no bridge. Under it: the brain counted with rules of its
   own (reached by the access field alone, installed without the registry's mark, a challenge by any label,
   yesterday by the records' last edit) where every page has one definition.
   Held here on a known-answer register: a location is a scope (each option, each way of asking, with an area, as a
   follow-up), the progress card equals the survey screen and the summary, the challenges card equals the obstacles
   tab, yesterday equals the «أمس · الآن · غدًا» page, the Ministry reads counts without the office's split, and a
   share never reads 100% before the last point nor 0% after the first.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';
import { appHtml } from './lib/src.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const dom = new JSDOM(await appHtml(), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);

/* ── a known-answer register ─────────────────────────────────────────────── */
const S = w.STATE.sites, now = Date.now(), TOTAL = S.length;
const N_REC = 300, N_STUCK = 8, N_REV = 6, N_APPR = 120, N_INS = 30, N_QA = 12;
const LA = S.filter(x => w.locApplies(x));
/* the records go to the location-applicable points first, so the location options sit on visited points */
const order = LA.concat(S.filter(x => !w.locApplies(x)));
for (let i = 0; i < N_REC; i++){
  const x = order[i], r = { id:x.id, at:now - i * 36e5, by:'أحمد', access:'تم الوصول', chals:['لا توجد تحديات'], review:i < N_APPR ? 'approved' : 'pending' };
  if (i >= N_REC - N_STUCK){ r.access = 'لم يُصل'; r.reason = 'مغلق'; r.review = ''; }
  else if (i >= N_REC - N_STUCK - N_REV) r.review = 'revisit';
  w.STATE.recs[x.id] = r;
}
for (let i = 0; i < N_INS; i++) w.STATE.inss[order[i].id] = { id:order[i].id, status:'مُركّب', at:now, by:'فني', approved:i < N_QA };
/* one point installed by the registry's own mark — the summary counts it, the old card did not */
const FX = order[N_REC + 5]; FX.fstat = 'مُركّب';
/* «موقع النقطة»: each option on known points — by area, so «في منى» has its own answer */
const OPTS = [['تحت كوبري', 'bridge'], ['مدخل نفق', 'tin'], ['مخرج نفق', 'tout'], ['لوحة استرشادية', 'sign'], ['بدون إطار معدني للتثبيت', 'nomount'], ['على مظلة', 'canopy']];
const reached = order.slice(N_INS, N_REC - N_STUCK - N_REV);   /* visited, reached, not installed */
const SEED = {}; let k = 0;
OPTS.forEach(([lbl, key], oi) => { const n = 3 + oi; SEED[key] = []; for (let j = 0; j < n; j++){ const x = reached[k++]; w.STATE.recs[x.id].loc = [lbl]; SEED[key].push(x.id); } });
/* one point with two options counts once in «نفق أو كوبري» */
const both = reached[k++]; w.STATE.recs[both.id].loc = ['تحت كوبري', 'مخرج نفق']; SEED.bridge.push(both.id); SEED.tout.push(both.id);
if (typeof w.statBump === 'function') w.statBump();
const zoneOf = id => w.taxOf(w.siteFind(id)).g;

/* ── reading a card as it is drawn ───────────────────────────────────────── */
const ar = s => String(s).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[٬,]/g, '');
const rowsOf = h => { const o = {}; (h.match(/<div class="kk-zl" style="margin:3px 0"><span>[^<]*<\/span><b class="num">[\s\S]*?<\/b><\/div>/g) || []).forEach(m => {
  const r = /<span>([^<]*)<\/span><b class="num">([\s\S]*?)<\/b>/.exec(m); const v = r[2].replace(/<[^>]+>/g, ''); o[r[1]] = v; }); return o; };
const num = v => { const m = /\d+/.exec(ar(v || '')); return m ? +m[0] : NaN; };
const sumAll = v => (ar(v || '').match(/\d+/g) || []).reduce((a, b) => a + +b, 0);
const title = h => ((/<h4[^>]*>([^<]*)<\/h4>/.exec(h) || [])[1] || '');
const ask = q => { w.PV.AQ_R = null; return w.aqAnswer(q) || ''; };
const fresh = q => { w.PV.AQ_CTX = null; return ask(q); };

console.log('\n══ ١ · سؤالُ اللقطة: «كم نقطة تحت كبرى» ══');
{
  const h = fresh('كم نقطة تحت كبرى'), R = rowsOf(h), want = SEED.bridge.length;
  T(w.PV.AQ_R && w.PV.AQ_R.win === 'progress', 'يجيبه التقدّم — لكن بنطاق الموقع');
  T(/تحت كوبري/.test(title(h)), 'والعنوانُ يقول النطاق: «' + title(h) + '»');
  T(num(R['النقاط']) === want, 'والعددُ عددُ النقاط تحت الكوبري (' + R['النقاط'] + ' = ' + want + ') — لا ' + TOTAL);
  const ids = (w.PV.AQ_POOL || []).map(x => x.id).sort();
  T(ids.join() === SEED.bridge.slice().sort().join(), 'ونقاطُ أزرار «اعرض/حدّد» هي نقاطُه نفسُها (' + ids.length + ')');
  const byZ = {}; SEED.bridge.forEach(id => { const z = zoneOf(id); byZ[z] = (byZ[z] || 0) + 1; });
  T(Object.keys(byZ).every(z => sumAll(R[z]) === byZ[z]), 'وتفصيلُه بالمنطقة كلوحة «حسب الموقع»: ' + JSON.stringify(byZ));
  T(h.indexOf('data-aqgo="page|mobs"') > -1, 'ومعه الطريقُ إلى لوحة «حسب الموقع»');
}

console.log('\n══ ٢ · كلُّ خيارٍ من «موقع النقطة» بكلِّ صيغةِ عدّ ══');
{
  /* the dashboard's own count — a point is tagged by its location choice and, off the corridors, by the «no mounting surface»
     challenge too (obsLocTags); every seeded point is among them */
  const page = key => w.mtSites().filter(x => { const g = w.obsLocTags(x); return g && g[key]; }).map(x => x.id);
  const forms = ['كم نقطة X', 'كام نقطة X', 'عدد النقاط X', 'X كام نقطة'], bad = [];
  OPTS.forEach(([lbl, key]) => { const P = page(key); if (!SEED[key].every(id => P.indexOf(id) > -1)) bad.push(lbl + ': نقطةٌ مزروعةٌ خارج اللوحة');
    forms.forEach(f => { const q = f.replace('X', lbl), R = rowsOf(fresh(q)); if (num(R['النقاط']) !== P.length) bad.push(q + ' → ' + (R['النقاط'] || '∅') + ' ≠ ' + P.length); }); });
  T(!bad.length, OPTS.length + ' خيارات × ' + forms.length + ' صيغ = عددُ لوحة «حسب الموقع»' + (bad.length ? ' — ' + bad.slice(0, 4).join(' | ') : ''));
  const tun = new Set(SEED.tin.concat(SEED.tout)).size, R2 = rowsOf(fresh('كم نقطة في نفق'));
  T(num(R2['النقاط']) === tun, '«نفق» وحدَه = المدخلُ والمخرجُ معًا، والنقطةُ مرةً واحدة (' + R2['النقاط'] + ' = ' + tun + ')');
  const R3 = rowsOf(fresh('كم نقطة تحت كوبري او نفق')), any = new Set(SEED.bridge.concat(SEED.tin, SEED.tout)).size;
  T(num(R3['النقاط']) === any, '«كوبري أو نفق»: النقطةُ ذاتُ الخيارين مرةً واحدة (' + R3['النقاط'] + ' = ' + any + ')');
}

console.log('\n══ ٣ · الموقعُ مع المنطقة، وفي المحادثة ══');
{
  const z0 = zoneOf(SEED.bridge[0]), z0n = SEED.bridge.filter(id => zoneOf(id) === z0).length;
  const R = rowsOf(fresh('كم نقطة تحت كوبري في ' + z0));
  T(num(R['النقاط']) === z0n, '«تحت كوبري في ' + z0 + '» = ' + z0n + ' (' + R['النقاط'] + ')');
  const other = [...new Set(LA.map(x => x.zone))].find(z => z && z !== z0 && /^(منى|عرفات|مزدلفة)$/.test(z)) || '';
  if (other){
    fresh('كم نقطة تحت كوبري'); const h2 = ask('وفي ' + other + '؟'), R2 = rowsOf(h2), want2 = SEED.bridge.filter(id => w.siteFind(id).zone === other).length;
    T(/فهمت/.test(h2) && /تحت كوبري/.test(title(h2)) && num(R2['النقاط']) === want2, '«وفي ' + other + '؟» بعده تحفظ الموقعَ وتبدّل المنطقة: ' + (R2['النقاط'] || '∅') + ' = ' + want2);
  }
  fresh('كم نقطة تحت كبرى'); const h3 = ask('طب مدخل نفق'), R3 = rowsOf(h3);
  T(/مدخل نفق/.test(title(h3)) && !/كوبري/.test(title(h3)) && num(R3['النقاط']) === SEED.tin.length, '«طب مدخل نفق» تضع الموقعَ الجديد محلَّ القديم: ' + title(h3));
  T(w.PV.AQ_R && w.PV.AQ_R.win !== 'ask', 'ولا تُسأل «تقصد ايه؟»');
}

console.log('\n══ ٤ · بطاقةُ التقدّم = شاشةُ المسح = الملخّص ══');
{
  const h = fresh('كام نقطة اتركبت'), R = rowsOf(h);
  const SS = w.siteStats(), SV = w.svStats().O, ch = w.chainRows(), chOk = (ch.filter(r => r.k === 'ok')[0] || {}).done;
  const done = S.filter(x => w.svDone(w.STATE.recs[x.id])).length, appr = S.filter(x => w.svApproved(w.STATE.recs[x.id])).length;
  T(num(R['النقاط']) === TOTAL, 'النقاط = كلُّ المواقع: ' + TOTAL);
  T(num(R['تمت الزيارة']) === SV.sv && SV.sv === SS.surveyed && SV.sv === N_REC, 'تمت الزيارة = تبويبُ المسح = الملخّص: ' + SV.sv);
  T(num(R['تم الوصول']) === done && done === N_REC - N_STUCK - N_REV, 'تم الوصول = «تم الوصول» في شاشة المسح (المردودُ خارجه): ' + done);
  T(num(R['تحتاج زيارة أخرى']) === SV.unreach && SV.unreach === N_STUCK, 'تحتاج زيارة أخرى = بطاقةُ الوزارة: ' + SV.unreach);
  T(num(R['أعادها المهندس']) === N_REV, 'أعادها المهندس وحدَه: ' + N_REV);
  T(num(R['تم الوصول']) + num(R['تحتاج زيارة أخرى']) + num(R['أعادها المهندس']) === num(R['تمت الزيارة']), 'والثلاثةُ تجمع «تمت الزيارة» بلا فرق');
  T(num(R['مسحٌ معتمد']) === appr && appr === N_APPR, 'مسحٌ معتمد = svApproved: ' + appr);
  T(num(R['مُركّبة']) === SS.installed && SS.installed === N_INS + 1, 'مُركّبة = الملخّص — ومنها علامةُ السجلّ نفسِه (fstat): ' + SS.installed);
  T(num(R['تركيبٌ معتمد']) === chOk && chOk === N_QA, 'تركيبٌ معتمد = «الاعتماد» في سلسلة المراحل: ' + chOk);
  const z = w.siteKeyStats().zones, z1 = Object.keys(z).find(g => z[g].sv > 0 && /^(منى|عرفات|مزدلفة)$/.test(g));
  if (z1){ const Rz = rowsOf(fresh('كام نقطة اتزارت في ' + z1)); T(num(Rz['النقاط']) === z[z1].n && num(Rz['تمت الزيارة']) === z[z1].sv, 'وفي ' + z1 + ' = الإحصاءُ المشترك: ' + z[z1].sv + ' من ' + z[z1].n); }
}

console.log('\n══ ٥ · النسبةُ لا تكذب عند الطرفين ══');
{
  const P = w.aqPct, N = v => w.nm(v);
  T(P(2026, 2028) === N(99.9) + '%', '٢٬٠٢٦ من ٢٬٠٢٨ = ' + P(2026, 2028) + ' — لا 100%');
  T(/^</.test(P(1, 2028)), 'وواحدةٌ من ٢٬٠٢٨ = ' + P(1, 2028) + ' — لا 0%');
  T(P(2028, 2028) === N(100) + '%' && P(0, 9) === N(0) + '%' && P(1, 2) === N(50) + '%' && P(3, 0) === '—', 'والمكتملُ ١٠٠ والصفرُ صفر والوسطُ بالتقريب المعتاد');
  /* the card itself: every point visited but one */
  const save = {}; S.forEach(x => { save[x.id] = w.STATE.recs[x.id]; if (!w.STATE.recs[x.id]) w.STATE.recs[x.id] = { id:x.id, at:now, by:'qa', access:'تم الوصول' }; });
  delete w.STATE.recs[S[S.length - 1].id]; if (typeof w.statBump === 'function') w.statBump();
  const R = rowsOf(fresh('كام نقطة اتزارت'));
  T(!/\(100%|١٠٠%/.test(R['تمت الزيارة'] || '') && /٩٩/.test(R['تمت الزيارة'] || ''), 'وفي البطاقة: نقطةٌ واحدةٌ باقية لا تُكتب 100%: «' + R['تمت الزيارة'] + '»');
  S.forEach(x => { if (save[x.id]) w.STATE.recs[x.id] = save[x.id]; else delete w.STATE.recs[x.id]; }); if (typeof w.statBump === 'function') w.statBump();
}

console.log('\n══ ٦ · بطاقةُ التحديات = تبويبُ «التحديات والمعوقات» ══');
{
  const h = fresh('كم نقطة عليها تحدي'), R = rowsOf(h), hero = w.mtObs();
  const pageN = num((/<div[^>]*>([^<]*)<\/div>\s*<div[^>]*>[^<]*نقطة عليها تحدي/.exec(hero) || [])[1]);
  const set = w.aqChalSet(S), pageVis = num((/من\s*([٠-٩0-9٬,]+)\s*اتزارت/.exec(hero.replace(/<[^>]+>/g, ' ')) || [])[1]);
  T(w.PV.AQ_R && w.PV.AQ_R.win === 'chal', 'يجيبه بطاقةُ التحديات');
  T(num(R['نقطة عليها تحدي']) === set.n && set.n > 0, 'نقطة عليها تحدي = تعريفُ التبويب (mtGrpOf): ' + set.n);
  T(isNaN(pageN) || pageN === set.n, 'ورقمُ التبويب المرسوم نفسُه' + (isNaN(pageN) ? ' (يُقرأ من الدالة)' : ': ' + pageN));
  T(sumAll(R['نقطة عليها تحدي']) >= set.vis && (isNaN(pageVis) || pageVis === set.vis), '«من N اتزارت» = زياراتُ التبويب: ' + set.vis);
  const G = (w.PV.MT_GRP || []).filter(g => set.gc[g.k]);
  T(G.every(g => num(R[g.n]) === set.gc[g.k]), '«مين يعالجها؟» بأرقام التبويب: ' + G.map(g => g.n + ' ' + set.gc[g.k]).join(' · '));
  const ids = [...h.matchAll(/data-svlist="([^"]+)"/g)].map(m => m[1]).find(key => w.PV.DSL[key] && /عليها تحدي/.test(w.PV.DSL[key].title || ''));
  T(!!ids && w.PV.DSL[ids].items.length === set.n, 'وقائمةُ «نقطة عليها تحدي» بالعدد نفسِه (' + (ids ? w.PV.DSL[ids].items.length : '∅') + ')');
}

console.log('\n══ ٧ · أمس = صفحةُ «أمس · الآن · غدًا» ══');
{
  const yk = w.dayKey(now - 864e5), had = (w.STATE.stats || {})[yk];
  w.STATE.stats = w.STATE.stats || {}; w.STATE.stats[yk] = { daySurvey:17, dayInstall:4, dayDismantle:2 };
  const R = rowsOf(fresh('ايه اللي اتعمل امبارح')), D = w.dayDone(yk);
  T(num(R['زيارات المسح']) === D.sv && num(R['تركيبات']) === D.ins && num(R['فك']) === D.dis, 'بلقطة اليوم: مسح ' + D.sv + ' · تركيب ' + D.ins + ' · فك ' + D.dis + ' — كما على الصفحة');
  delete w.STATE.stats[yk]; if (had) w.STATE.stats[yk] = had;
  const R2 = rowsOf(fresh('ايه اللي اتعمل امبارح')), D2 = w.dayDone(yk);
  T(num(R2['زيارات المسح']) === D2.sv && num(R2['تركيبات']) === D2.ins, 'وبلا لقطة: من السجلات كما تعدّها الصفحة — ' + D2.sv + ' / ' + D2.ins);
}

console.log('\n══ ٨ · الوزارةُ تقرأ الأعداد بلا تقسيم المكتب ══');
{
  const was = w.ROLE; w.ROLE = 'viewer';
  const h = fresh('كم نقطة تحت كبرى'), R = rowsOf(h);
  T(num(R['النقاط']) === SEED.bridge.length && !('تم الوصول' in R) && !('أعادها المهندس' in R), 'للوزارة: العددُ نفسُه، بلا «تم الوصول» ولا «أعادها المهندس»');
  T(!/data-aqsel=/.test(h), 'ولا زرَّ تحديدٍ للعمل الجماعي');
  w.ROLE = was;
}

console.log('\n══ ٩ · الجذر: لا تعريفَ ثانيًا في بطاقات العقل ══');
{
  const src = ['aqAnswerBase', 'aqActBtns'].map(f => String(w[f])).join('\n') + String(w.aqAns.progress) + String(w.aqAns.chal) + String(w.aqAns.yday);
  T(!/Math\.round\([^)]*\*\s*100\)/.test(src), 'لا نسبةَ بالتقريب الأعمى — aqPct وحدَها');
  T(!/access === 'تم الوصول'/.test(src), 'لا «وصل» بحقل الوصول وحدَه — svReached/svDone/svStuck');
  T(!/i\.status === 'مُركّب'/.test(String(w.aqAns.progress) + String(w.aqActBtns)), 'لا «مُركّب» بسجلّ التركيب وحدَه — aqInst كالملخّص');
  T(String(w.aqRepParse).indexOf('aqLocOf') > -1 && String(w.aqScope).indexOf('aqLocOf') > -1, 'وكلماتُ الموقع قائمةٌ واحدة: التقريرُ بالكلام ونطاقُ كلِّ عدٍّ');
}

console.log(fails.length ? '\nعقلُ النظام وأرقامُ الصفحات: فشل ✗ (' + fails.length + ')' : '\n✓ ' + pass + ' فحصًا — أرقامُ العقل هي أرقامُ الصفحات');
process.exit(fails.length ? 1 : 0);
