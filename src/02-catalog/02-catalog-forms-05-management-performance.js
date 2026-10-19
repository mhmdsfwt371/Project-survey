/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-05-management-performance.js
   DOMAIN  : Catalogue & point — definitions, classification, permissions, survey edit
   PURPOSE : Management records, methodology matching and the single performance page with five levels.
   DEFINES : pmoSees, pmoFetch, pmoList, pmoEdBtn, pmoEdLabel, pmoEdCancel, pmoEdId, pmoEdFill, pmoPut, pmoVal, lessonsBody, stakeBody, pmiRows, pmiBody … (+1 more)
   GLOBALS : PMO, PMO_LEVELS, PMO_DOMAINS, PMO_ED, PMO_FORM, PMI_ST
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ سجلاتُ الإدارة (V19.3) ═══
   الدروسُ المستفادة، والمراجعاتُ الدورية، وأصحابُ المصلحة — في وثيقةٍ واحدة
   settings/pmo (قاعدتُها: المكتبُ والإدارةُ العليا قراءةً، والمكتبُ كتابةً). كلُّ
   مدخلٍ بمعرِّفه وتاريخه وكاتبه، والحذفُ شاهدٌ لا محو. تُقرأ عند فتح شريحتها. */
var PMO = { at:0, v:null, err:'' };
var PMO_LEVELS = ['غير مدرك', 'مقاوم', 'محايد', 'داعم', 'قائد'];
var PMO_DOMAINS = ['الحوكمة', 'النطاق', 'الجدول', 'المالية', 'أصحاب المصلحة', 'الموارد', 'المخاطر'];
function pmoSees(){ return may('settings') || effRole(ROLE) === 'exec'; }
function pmoFetch(force){
  if (!pmoSees()) return;
  if (!force && (PMO.v || Date.now() - PMO.at < 600000)) return;
  if (!FB.ready || !FB.db){ PMO.v = PMO.v || STATE.pmo || { lessons:{}, retros:{}, stake:{} }; return; }
  PMO.at = Date.now();
  DB.col('settings').doc('pmo').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    PMO.v = (doc && doc.exists) ? doc.data() : {}; STATE.pmo = PMO.v; if (CUR === 'exec') render(1);
  }).catch(function(e){ PMO.err = String(e && (e.code || e.message) || e).slice(0, 60); });
}
function pmoList(sec){
  var o = ((PMO.v || STATE.pmo || {})[sec]) || {};
  return Object.keys(o).map(function(k){ return Object.assign({ id:k }, o[k]); }).filter(function(x){ return x && !x.gone; }).sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
/* (V28.2) قرارُ المالك: «كلُّ سجلٍّ من أصغره لأكبره: إضافة وتعديل ومسح». سجلاتُ الإدارة (الدروس، المراجعات الدورية،
   أصحابُ المصلحة) كانت إضافةً وحذفًا فقط — صار لكلِّ صفٍّ «✎» يملأ نموذجَ الإضافة بقيمه، و«احفظ التعديل» يكتب على السجلِّ نفسِه. */
var PMO_ED = { sec:'', id:'' };
var PMO_FORM = { lessons:{ t:'lsT', d:'lsD', w:'lsW', c:'lsC', a:'lsA', o:'lsO' }, retros:{ p:'rtP', g:'rtG', i:'rtI', a:'rtA' }, stake:{ n:'shN', r:'shR', inf:'shI', int:'shT', cur:'shC', want:'shD', s:'shS', o:'shO' } };
function pmoEdBtn(sec, id){ return btn('\u270E', 'btn-quiet btn-sm', ' data-pmoedit="' + sec + '|' + esc(id) + '" aria-label="' + esc(t('تعديل')) + '"'); }
function pmoEdLabel(sec, addLabel){ return PMO_ED.sec === sec ? t('احفظ التعديل') : t(addLabel); }
function pmoEdCancel(sec){ return PMO_ED.sec === sec ? btn(t('إلغاء التعديل'), 'btn-quiet btn-sm', ' data-pmoedcancel="1"') : ''; }
function pmoEdId(sec, fresh){ return PMO_ED.sec === sec && PMO_ED.id ? PMO_ED.id : fresh; }
function pmoEdFill(){
  var f = PMO_FORM[PMO_ED.sec]; if (!f) return;
  var x = pmoList(PMO_ED.sec).filter(function(r){ return r.id === PMO_ED.id; })[0]; if (!x) return;
  var first = null;
  Object.keys(f).forEach(function(k){ var el = document.getElementById(f[k]); if (!el) return; el.value = x[k] == null ? '' : String(x[k]); if (!first) first = el; });
  if (first){ try { first.scrollIntoView({ block:'center' }); first.focus(); } catch (e){ LS_ERR = e; } }
}
function pmoPut(sec, id, entry){
  if (!may('settings')){ toast(t('سجلاتُ الإدارة للمهندس فمن فوقه')); return false; }
  PMO.v = PMO.v || STATE.pmo || {}; PMO.v[sec] = PMO.v[sec] || {}; PMO.v[sec][id] = entry; STATE.pmo = PMO.v;
  var w = {}; w[sec] = {}; w[sec][id] = entry;
  CORE.set('cfg', 'pmo', w);
  logEvent((entry.gone ? 'حذفٌ من ' : 'سجلُّ الإدارة — ') + sec + ' · ' + id, '');
  return true;
}
function pmoVal(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim().slice(0, 600) : ''; }
function lessonsBody(){
  pmoFetch();
  var L = pmoList('lessons'), R = pmoList('retros'), ed = may('settings');
  var dom = '<select id="lsD">' + PMO_DOMAINS.map(function(d){ return '<option value="' + esc(d) + '">' + esc(t(d)) + '</option>'; }).join('') + '</select>';
  return stats([['دروسٌ مسجّلة', N(L.length)], ['مراجعاتٌ دورية', N(R.length)], ['آخرُ مراجعة', R[0] ? fmtDate(R[0].at) : '\u2014', R[0] && Date.now() - R[0].at < 14 * 864e5 ? 'ok' : 'wrn']])
    + (ed ? card('درسٌ مستفادٌ جديد',
        '<div class="grid2"><label>' + esc(t('العنوان')) + '<input id="lsT"></label><label>' + esc(t('المجال')) + dom + '</label></div>'
        + '<label>' + esc(t('ما الذي حدث')) + '<textarea id="lsW" rows="2"></textarea></label>'
        + '<label>' + esc(t('السبب')) + '<textarea id="lsC" rows="2"></textarea></label>'
        + '<div class="grid2"><label>' + esc(t('الإجراء')) + '<input id="lsA"></label><label>' + esc(t('المسؤول')) + '<input id="lsO"></label></div>'
        + '<div class="actions">' + btn(pmoEdLabel('lessons', 'سجّل الدرس'), 'btn-primary btn-sm', ' data-lessonadd="1"') + pmoEdCancel('lessons') + '</div>') : '')
    + (L.length ? cardFlush(t('الدروس المستفادة') + ' \u2014 ' + nm(L.length),
        table(['التاريخ', 'العنوان', 'المجال', 'السبب', 'الإجراء', 'المسؤول', ''], L.map(function(x){
          return [esc(fmtDate(x.at)), '<b>' + esc(x.t || '') + '</b>' + (x.w ? '<div class="hint" style="margin:2px 0 0">' + esc(x.w) + '</div>' : ''), esc(t(x.d || '')), esc(x.c || ''), esc(x.a || ''), esc(x.o || ''),
                  ed ? pmoEdBtn('lessons', x.id) + btn('\u2715', 'btn-quiet btn-sm', ' data-pmodel="lessons|' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') : ''];
        }))) : '')
    + (ed ? card('مراجعةٌ دورية',
        '<label>' + esc(t('الفترة')) + '<input id="rtP" placeholder="' + esc(t('مثال: أسبوع ٢١–٢٧ سبتمبر')) + '"></label>'
        + '<label>' + esc(t('ما نجح')) + '<textarea id="rtG" rows="2"></textarea></label>'
        + '<label>' + esc(t('ما يُحسَّن')) + '<textarea id="rtI" rows="2"></textarea></label>'
        + '<label>' + esc(t('الإجراءات ومن يملكها')) + '<textarea id="rtA" rows="2"></textarea></label>'
        + '<div class="actions">' + btn(pmoEdLabel('retros', 'سجّل المراجعة'), 'btn-primary btn-sm', ' data-retroadd="1"') + pmoEdCancel('retros') + '</div>') : '')
    + (R.length ? cardFlush(t('المراجعات الدورية') + ' \u2014 ' + nm(R.length),
        table(['التاريخ', 'الفترة', 'ما نجح', 'ما يُحسَّن', 'الإجراءات', ''], R.map(function(x){
          return [esc(fmtDate(x.at)), esc(x.p || ''), esc(x.g || ''), esc(x.i || ''), esc(x.a || ''), ed ? pmoEdBtn('retros', x.id) + btn('\u2715', 'btn-quiet btn-sm', ' data-pmodel="retros|' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') : ''];
        }))) : '')
    + '<p class="hint">' + esc(t('المراجعةُ كلَّ أسبوعين على الأقل — تقيسها «مطابقة المنهجية». والدرسُ يُكتَب حين يقع لا في آخر الموسم.')) + '</p>'
    + lessLegacyBody()   /* (V27.1) */;
}
function stakeBody(){
  pmoFetch();
  var S = pmoList('stake'), ed = may('settings');
  var lv = function(id, cur){ return '<select id="' + id + '">' + PMO_LEVELS.map(function(l){ return '<option value="' + esc(l) + '"' + (cur === l ? ' selected' : '') + '>' + esc(t(l)) + '</option>'; }).join('') + '</select>'; };
  var hl = function(id){ return '<select id="' + id + '"><option value="3">' + esc(t('عالٍ')) + '</option><option value="2" selected>' + esc(t('متوسط')) + '</option><option value="1">' + esc(t('منخفض')) + '</option></select>'; };
  var gap = S.filter(function(x){ return PMO_LEVELS.indexOf(x.cur) < PMO_LEVELS.indexOf(x.want); }).length;
  return stats([['أصحابُ مصلحةٍ مسجّلون', N(S.length)], ['دون المطلوب', N(gap), gap ? 'wrn' : 'ok']])
    + (ed ? card('صاحبُ مصلحةٍ جديد',
        '<div class="grid2"><label>' + esc(t('الجهة أو الشخص')) + '<input id="shN"></label><label>' + esc(t('الدور')) + '<input id="shR"></label></div>'
        + '<div class="grid2"><label>' + esc(t('التأثير')) + hl('shI') + '</label><label>' + esc(t('الاهتمام')) + hl('shT') + '</label></div>'
        + '<div class="grid2"><label>' + esc(t('الانخراط الحالي')) + lv('shC', 'محايد') + '</label><label>' + esc(t('الانخراط المطلوب')) + lv('shD', 'داعم') + '</label></div>'
        + '<div class="grid2"><label>' + esc(t('الخطة')) + '<input id="shS"></label><label>' + esc(t('المسؤول')) + '<input id="shO"></label></div>'
        + '<div class="actions">' + btn(pmoEdLabel('stake', 'أضف'), 'btn-primary btn-sm', ' data-stakeadd="1"') + pmoEdCancel('stake') + '</div>') : '')
    + (S.length ? cardFlush(t('سجل أصحاب المصلحة') + ' \u2014 ' + nm(S.length),
        table(['الجهة', 'الدور', 'تأثير/اهتمام', 'الحالي ← المطلوب', 'الخطة', 'المسؤول', 'آخر مراجعة', ''], S.map(function(x){
          var g = PMO_LEVELS.indexOf(x.cur) < PMO_LEVELS.indexOf(x.want);
          return ['<b>' + esc(x.n || '') + '</b>', esc(x.r || ''), nm(x.inf || 0) + ' / ' + nm(x.int || 0),
                  (ed ? '<select data-stakecur="' + esc(x.id) + '" style="min-height:30px;font-size:12px;width:auto">' + PMO_LEVELS.map(function(l){ return '<option value="' + esc(l) + '"' + (x.cur === l ? ' selected' : '') + '>' + esc(t(l)) + '</option>'; }).join('') + '</select>' : esc(t(x.cur || '')))
                    + ' \u2190 ' + pill(t(x.want || ''), g ? 'wrn' : 'ok'),
                  esc(x.s || ''), esc(x.o || ''), esc(fmtDate(x.at)), ed ? pmoEdBtn('stake', x.id) + btn('\u2715', 'btn-quiet btn-sm', ' data-pmodel="stake|' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') : ''];
        }))) : '')
    + '<p class="hint">' + esc(t('مصفوفةُ الانخراط: غير مدرك · مقاوم · محايد · داعم · قائد. تغييرُ الحالي يؤرّخ المراجعة.')) + '</p>';
}
/* ═══ مطابقةُ المنهجية (V19.3) ═══
   كلُّ بندٍ من دليل المعرفة (الإصدار الثامن: ستةُ مبادئ وسبعةُ مجالات) والمنهجِ الرشيق
   (أربعةُ مجالات) ومنهجِ إدارة مشاريع الذكاء الاصطناعي (ستُّ مراحل): دليلُه في النظام،
   وحالتُه من البيانات نفسِها لا من وجود الشاشة — مطبَّقٌ فعلًا، أو جزئيّ، أو ناقص، أو لا
   ينطبق. تُحسَب عند الفتح؛ ولا كتابة. */
function pmiRows(){
  var now = Date.now(), D30 = 30 * 864e5, D14 = 14 * 864e5, out = [];
  var ok = function(v){ return v ? 'ok' : 'part'; };
  var recs = Object.keys(STATE.recs || {}).map(function(k){ return STATE.recs[k]; }).filter(Boolean);
  var apr = recs.filter(function(r){ return r.reviewAt || r.review === 'approved'; }).length;
  var byPct = recs.length ? Math.round(recs.filter(function(r){ return r._by || r.by; }).length / recs.length * 100) : 0;
  var RR = (typeof readyRows === 'function') ? readyRows() : [];
  var rd = function(title){ var r = RR.filter(function(x){ return x.t === title; })[0]; return r ? !!r.ok : null; };
  var diss = Object.keys(STATE.diss || {}).map(function(k){ return STATE.diss[k]; }).filter(function(x){ return x && x.status === 'تم الفك'; });
  var good = diss.filter(function(x){ return x.cond === 'سليم'; }).length;
  var nw14 = Object.keys(STATE.newsites || {}).filter(function(k){ var x = STATE.newsites[k]; return x && now - (x.at || 0) < D14; }).length;
  var bugs = Object.keys(STATE.bugs || {}).length, chal = recs.filter(function(r){ return (r.chals || []).some(function(c){ return c && c !== 'لا توجد تحديات'; }); }).length;
  var chg = Object.keys(STATE.changes || {}).length, ncr = Object.keys(STATE.ncr || {}).length;
  var risks = (typeof risksList === 'function') ? risksList() : [], rsk30 = risks.filter(function(r){ return r.at && now - r.at < D30; }).length;
  var st = pmoList('stake'), st30 = st.filter(function(x){ return now - (x.at || 0) < D30; }).length;
  var ls = pmoList('lessons'), ls30 = ls.filter(function(x){ return now - (x.at || 0) < D30; }).length;
  var rt = pmoList('retros'), rt14 = rt.filter(function(x){ return now - (x.at || 0) < D14; }).length;
  var dq = (typeof dqDupPos === 'function' ? dqDupPos().length : 0) + (typeof dqNoCo === 'function' ? dqNoCo().length : 0) + (typeof dqNoSign === 'function' ? dqNoSign().length : 0) + (typeof dqFar === 'function' ? dqFar().length : 0);
  var pf = Object.keys(STATE.presence || {}).some(function(u){ var p = STATE.presence[u]; return p && p.pf; });
  var sr = (typeof SYSREP === 'object' && SYSREP.v && SYSREP.v.pulse && SYSREP.v.pulse.at) ? SYSREP.v.pulse.at : 0;
  var tasks = Object.keys(STATE.tasks || {}).length, crews = (STATE.crews || []).length;
  var add = function(fw, code, title, ev, stt, note, go){ out.push({ fw:fw, code:code, title:title, ev:ev, st:stt, note:note || '', go:go || '' }); };
  /* دليلُ المعرفة — المبادئ */
  add('pmbok', 'P1', 'النظرة الشاملة', 'رقمٌ واحدٌ لكلِّ نقطةٍ في كلِّ الشاشات من دورة حياةٍ واحدة', 'ok', nm((STATE.sites || []).length) + ' ' + t('نقطة'), 'over');
  add('pmbok', 'P2', 'التركيز على القيمة', 'النقاطُ من العمل المعتمَد وحدَه، والقيمةُ بسعر النقطة', cfgGet('ph') > 0 && apr ? 'ok' : 'part', nm(apr) + ' ' + t('زيارةً معتمدة') + (cfgGet('ph') > 0 ? '' : ' \u00b7 ' + t('بلا سعر نقطة')), 'perf');
  add('pmbok', 'P3', 'دمج الجودة', 'اعتمادٌ تقنيٌّ قبل الوزارة، وتدقيقٌ قبل الإقفال، وسجلُّ عدم المطابقة', ok(apr > 0), nm(apr) + ' ' + t('معتمدة') + ' \u00b7 ' + nm(ncr) + ' ' + t('عدم مطابقة'), 'svappr');
  add('pmbok', 'P4', 'القيادة المسؤولة', 'كلُّ تعديلٍ مسجَّلٌ باسم من كتبه، والقراراتُ بتاريخها وصاحبها', byPct >= 90 ? 'ok' : 'part', nm(byPct) + '\u066A ' + t('من السجلات مختومة'), 'ev');
  add('pmbok', 'P5', 'دمج الاستدامة', 'إعادةُ استخدام معدّات الفك (السليمُ يعود للمخزن)', diss.length ? (good / diss.length >= 0.7 ? 'ok' : 'part') : 'na', diss.length ? t('إعادة الاستخدام') + ' ' + nm(Math.round(good / diss.length * 100)) + '\u066A' : t('يبدأ القياسُ مع الفك'), 'dis');
  add('pmbok', 'P6', 'بناء فرقٍ ممكّنة', 'الميدانُ يضيف النقاطَ ويبلّغ ويرى أداءه', ok(nw14 + bugs + chal > 0), nm(nw14) + ' ' + t('نقطة جديدة') + ' \u00b7 ' + nm(chal) + ' ' + t('إفادة تحدٍّ'), 'chalm');
  /* دليلُ المعرفة — مجالاتُ الأداء */
  add('pmbok', 'D1', 'الحوكمة', 'مسارُ الاعتماد والأدوارُ وسجلُّ القرارات', ok(apr > 0), nm(apr) + ' ' + t('قرار اعتماد'), 'appr');
  add('pmbok', 'D2', 'النطاق', 'سجلُّ النقاط وطلباتُ التغيير', chg ? 'ok' : 'part', nm(chg) + ' ' + t('طلب تغيير'), 'chg');
  var sch = [rd('موعدا المسح والتركيب'), rd('مواعيدُ المعالم')];
  add('pmbok', 'D3', 'الجدول', 'المواعيدُ والمعالمُ وتوقّعُ الاكتمال لكلِّ مشعر', sch.every(function(v){ return v !== false; }) ? 'ok' : 'part', sch.every(function(v){ return v !== false; }) ? t('المواعيد مضبوطة') : t('موعدٌ أو معلمٌ ناقص'), 'miles');
  var fin = [['سقفُ الميزانية', rd('سقفُ الميزانية')], ['خطُّ الأساس مجمَّد', rd('خطُّ الأساس مجمَّد')], ['سعرُ النقطة', rd('سعرُ النقطة')]];
  var finMiss = fin.filter(function(x){ return x[1] === false; }).map(function(x){ return t(x[0]); });
  add('pmbok', 'D4', 'المالية', 'الميزانيةُ والقيمةُ المكتسبة على خطِّ أساسٍ مجمَّد', finMiss.length ? (finMiss.length === fin.length ? 'gap' : 'part') : 'ok', finMiss.length ? t('ينقص') + ': ' + finMiss.join(' \u00b7 ') : t('مؤشّرا الكلفة والجدول متاحان'), 'evm');
  add('pmbok', 'D5', 'أصحاب المصلحة', 'سجلُّ أصحاب المصلحة بالانخراط الحاليِّ والمطلوب', st.length >= 3 && st30 ? 'ok' : (st.length ? 'part' : 'gap'), nm(st.length) + ' ' + t('مسجّل') + ' \u00b7 ' + nm(st30) + ' ' + t('روجع في ٣٠ يومًا'), 'stake');
  add('pmbok', 'D6', 'الموارد', 'الفرقُ والمهامُّ والعُهدةُ والسيارات', ok(crews > 0 && tasks > 0), nm(crews) + ' ' + t('فريق') + ' \u00b7 ' + nm(tasks) + ' ' + t('مهمة'), 'assign');
  add('pmbok', 'D7', 'المخاطر', 'سجلُّ المخاطر بالاحتمال والأثر والاستجابة والمالك', rsk30 ? 'ok' : 'part', nm(risks.length) + ' ' + t('خطر') + ' \u00b7 ' + nm(rsk30) + ' ' + t('روجع في ٣٠ يومًا'), 'risks');
  /* المنهجُ الرشيق */
  add('acp', 'A1', 'العقلية', 'حلقاتُ تغذيةٍ قصيرة: قطارُ إصدارٍ مرتين أسبوعيًّا وبلاغاتُ الميدان بخطِّها الزمني', 'ok', t('قطار الأحد والأربعاء'), 'bugs');
  add('acp', 'A2', 'القيادة', 'مشاركةُ المعرفة: دروسٌ مستفادةٌ مسجّلة', ls30 ? 'ok' : (ls.length ? 'part' : 'gap'), nm(ls.length) + ' ' + t('درس') + ' \u00b7 ' + nm(ls30) + ' ' + t('في ٣٠ يومًا'), 'lessons');
  add('acp', 'A3', 'المنتج', 'قائمةُ العمل مرئيةٌ ومرتّبة: طلباتُ الزيارة والإسنادُ على الخريطة', ok(tasks > 0), nm(tasks) + ' ' + t('مهمة'), 'reqreg');
  add('acp', 'A4', 'التسليم', 'مقاييسُ التدفّق (اليوميات والزمنُ بين المراحل) ومراجعاتٌ دورية', rt14 ? 'ok' : (rt.length ? 'part' : 'gap'), nm(rt14) + ' ' + t('مراجعة في ١٤ يومًا'), 'lessons');
  /* منهجُ إدارة مشاريع الذكاء الاصطناعي */
  add('ai', 'C1', 'فهم العمل', 'بوصلةُ القيمة والقراراتُ موثّقةٌ في المستودع', 'ok', t('موثّق'), '');
  add('ai', 'C2', 'فهم البيانات', 'مشكلاتُ البيانات معروفةٌ بعددها ونوعها', 'ok', nm(dq) + ' ' + t('مشكلة بيانات'), 'dq');
  add('ai', 'C3', 'تجهيز البيانات', 'لا مشكلةَ بياناتٍ مفتوحة', dq ? 'part' : 'ok', dq ? nm(dq) + ' ' + t('مفتوحة') : t('نظيفة'), 'dq');
  add('ai', 'C4', 'بناء النموذج', 'لا نموذجَ تعلّمٍ آليٍّ في النظام — التوقّعُ إحصائيٌّ خطّيٌّ بالقصد', 'na', t('لا ينطبق'), '');
  add('ai', 'C5', 'التقييم', 'قياسُ الأداء الحقيقيِّ من الأجهزة والاختباراتُ الآلية', ok(pf), pf ? t('قياسات الأجهزة تصل') : t('لا قياسات بعد'), 'usage');
  add('ai', 'C6', 'التشغيل والمراقبة', 'الصندوقُ الأسود وملخّصُ الصباح والمراقبةُ اليومية', sr && now - sr < 2 * 864e5 ? 'ok' : 'part', sr ? t('آخر ملخّص') + ' ' + fmtDate(sr) : t('لم يصل ملخّص'), 'sys');
  return out;
}
var PMI_ST = { ok:['مطبّق', 'ok'], part:['جزئي', 'wrn'], gap:['ناقص', 'bad'], na:['لا ينطبق', ''] };
function pmiBody(){
  pmoFetch(); if (typeof sysReportFetch === 'function') sysReportFetch();
  var R = pmiRows(), c = { ok:0, part:0, gap:0, na:0 }; R.forEach(function(r){ c[r.st]++; });
  var app = R.length - c.na, score = app ? Math.round((c.ok + c.part / 2) / app * 100) : 0;
  var sec = function(fw, title){
    var L = R.filter(function(r){ return r.fw === fw; });
    return cardFlush(t(title), table(['البند', 'الدليل في النظام', 'القياس', 'الحالة'], L.map(function(r){
      var S = PMI_ST[r.st];
      return ['<b>' + esc(r.code) + ' ' + esc(t(r.title)) + '</b>', esc(t(r.ev)) + (r.go ? ' ' + btn('\u2197', 'btn-quiet btn-sm', ' data-goto="' + esc(r.go) + '" aria-label="' + esc(t('افتح')) + '"') : ''), esc(r.note), pill(t(S[0]), S[1])];
    })));
  };
  return stats([['نسبةُ المطابقة', nm(score) + '\u066A', score >= 80 ? 'ok' : score >= 60 ? 'wrn' : 'bad'], ['مطبّق', N(c.ok), 'ok'], ['جزئي', N(c.part), c.part ? 'wrn' : ''], ['ناقص', N(c.gap), c.gap ? 'bad' : ''], ['لا ينطبق', N(c.na)]])
    + '<div class="actions">' + btn('\u2B07 ' + t('إكسل — مصفوفة المطابقة'), 'btn-secondary btn-sm', ' data-xls="pmi"') + '</div>'
    + sec('pmbok', 'دليل المعرفة (الإصدار الثامن) — المبادئ الستة ومجالات الأداء السبعة')
    + sec('acp', 'المنهج الرشيق — المجالات الأربعة')
    + sec('ai', 'منهج إدارة مشاريع الذكاء الاصطناعي — المراحل الست')
    + '<p class="hint">' + esc(t('الحالةُ من البيانات لا من وجود الشاشة: «مطبّق» له دليلٌ حديث، و«جزئي» مبنيٌّ وينقصه استعمالٌ أو ضبط، و«ناقص» لا دليلَ له. النسبةُ = المطبّقُ ونصفُ الجزئيِّ ÷ ما ينطبق.')) + '</p>';
}
/* ── حسب المرحلة: فريق كل مرحلةٍ على حدة، بتارجتها المستقل ── */
function perfStageTable(){
  var R = STAGE_ROLES[STAGE_TAB] || STAGE_ROLES.ins;
  var L = stageList(STAGE_TAB);
  var tgt = stageTarget(STAGE_TAB);
  var sum = L.reduce(function(a,e){ return a + e.total; }, 0);
  var acts = L.reduce(function(a,e){ return a + e.acts; }, 0);

  return '<div class="chips">' + Object.keys(STAGE_ROLES).map(function(k){
      var S = STAGE_ROLES[k], n = stageList(k).length;
      return '<button type="button" class="chip' + (STAGE_TAB===k?' on':'') + '" data-stab="' + k + '">'
        + S.i + ' ' + esc(t(S.n)) + (n ? ' <span class="num">' + nm(n) + '</span>' : '') + '</button>';
    }).join('') + '</div>'

    + stats([['أفراد المرحلة', N(L.length), 'acc'],
             ['أعمالهم', N(acts)],
             ['نقاطهم', N(Math.round(sum))],
             ['تارجت المرحلة', tgt ? N(tgt) : '—', tgt ? '' : 'wrn']])

    + card(R.i + ' ' + t(R.n),
        '<p class="hint" style="margin:0 0 11px">' + esc(t(R.d)) + '</p>'
        + (tgt ? meter('إنجاز المرحلة من تارجتها', sum, tgt) : '')
        + (L.length ? '' : '<p class="hint" style="margin:0">'
            + esc(t('لا أحد في هذه المرحلة بعد — تُضبط مرحلةُ كلِّ فنيٍّ في إسناد الأدوار.')) + '</p>'))

    + (L.length
      ? cardFlush(t('الفريق') + ' — ' + nm(L.length),
          table(['#','الفني','زيارة','تركيب','فك','تهيئة','تجميع','أعمال','عادي','إضافي','النقاط','المستحَق'],
            L.map(function(e, i){
              return [nm(i+1), '<strong>' + esc(dispName(e.name)) + '</strong>',
                      N(e.survey), N(e.install), N(e.dis), N(e.prep), N(e.asm),
                      N(e.acts), N(e.regular),
                      e.over ? '<span class="pill warn">' + nm(e.over) + '</span>' : '٠',
                      '<b>' + nm(e.total) + '</b>',
                      cfgGet('ph') ? N(e.money) : '—'];
            }),
            ['','<b>' + t('الإجمالي') + '</b>',
             N(L.reduce(function(a,e){return a+e.survey;},0)),
             N(L.reduce(function(a,e){return a+e.install;},0)),
             N(L.reduce(function(a,e){return a+e.dis;},0)),
             N(L.reduce(function(a,e){return a+e.prep;},0)),
             N(L.reduce(function(a,e){return a+e.asm;},0)),
             N(acts),
             N(Math.round(L.reduce(function(a,e){return a+e.regular;},0))),
             N(Math.round(L.reduce(function(a,e){return a+e.over;},0)*10)/10),
             '<b>' + nm(Math.round(sum)) + '</b>',
             cfgGet('ph') ? N(Math.round(L.reduce(function(a,e){return a+e.money;},0))) : '—']),
          '<div class="actions">'
          + btn('⬇ إكسل — هذه المرحلة','btn-secondary btn-sm',' data-xls="stage"')
          + btn('⬇ إكسل — كل المراحل','btn-secondary btn-sm',' data-xls="stages"')
          + '</div>')
      : '');
}

/* ═══ الأداء: صفحةٌ واحدة بخمسة مستويات — لا أربع شاشاتٍ متفرقة ═══
   كانت «تقرير الأداء» و«أداء المراحل» و«إنتاجية الفريق» و«مقابل التارجت»
   أربع شاشاتٍ تقرأ scores() نفسَها بصيغٍ متفاوتة الاكتمال — وإنتاجية
   الفريق تحديدًا مسودةٌ لم تكتمل: عمودُها «الفريق» يعرض أفرادًا، ولا فكَّ
   فيها ولا نسبة تارجت. صارت خمس عدساتٍ على نفس الرقم في صفحةٍ واحدة. */
PAGE.perf = { m:'الفرق', t:'الفرق والأداء',
  l:'من يعمل وبمن وبأيِّ معدَّل — الأداءُ والفرقُ والطواقم.',
  body:function(){
    var head = tabHead('perf'), cur = tabCur('perf');
    if (cur === 'crewman') return head + (may('phones') ? briefingHtml() : '') + (function(){
    var L = crewsList();
    if (!L.length){
      return card('لا فرقَ بعد',
        '<p class="hint" style="margin:0">' + esc(t('أنشئ أوّل فريقٍ لتبدأ.')) + '</p>')
        + (may('users') ? crewNewCard() : '');
    }
    if (!L.some(function(c){ return c.id === CREW_CUR; })) CREW_CUR = L[0].id;
    var crew = crewOf(CREW_CUR);
    var techs = crewTechs(crew);
    var subs  = crewTeams(crew);
    if (!subs.some(function(x){ return x.id === CTEAM_CUR; })) CTEAM_CUR = subs[0] ? subs[0].id : '';
    var tm = subs.filter(function(x){ return x.id === CTEAM_CUR; })[0] || null;
    var S = crewStat(crew);
    var byName = {};
    scores().list.forEach(function(e){ byName[e.name] = e; });
    var orphan = unassignedTechs();

    var html = '<div class="chips">' + L.map(function(c){
        var K = c.kind === '*' ? null : WO_KINDS[c.kind];
        var mem = techsList().filter(function(x){ return x.crew === c.n; }).length;
        return '<button type="button" class="chip' + (CREW_CUR===c.id?' on':'') + '" data-crewcur="' + esc(c.id) + '">'
          + (K ? K.i + ' ' : '\u{1F393} ') + esc(t(c.n)) + ' <span class="num">' + nm(mem) + '</span></button>';
      }).join('') + '</div>'

      + stats([['موظفو الفريق', N(techs.length), 'acc'],
               ['فرق فرعية', N(subs.length)],
               ['نقاط الشهر', N(S.month)],
               ['تارجت الشهر', S.tgtM ? N(S.tgtM) : '—']])
      + (S.tgtM ? meter('الإنجاز من تارجت الشهر', S.month, S.tgtM) : '')

      + card('بيانات الفريق',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('الاسم')) + '</label>'
          +   (may('users')
                ? '<input value="' + esc(crew.n) + '" data-crn="' + esc(crew.n) + '" dir="auto">'
                : '<strong>' + esc(crew.n) + '</strong>') + '</div>'
          + '<div class="field"><label>' + esc(t('نوع العمل')) + '</label>'
          +   (may('users')
                ? '<select data-crk="' + esc(crew.n) + '">'
                  + Object.keys(WO_KINDS).map(function(k){
                      return '<option value="' + esc(k) + '"' + (crew.kind === k ? ' selected' : '')
                        + '>' + esc(t(WO_KINDS[k].n)) + '</option>';
                    }).join('')
                  + '<option value="*"' + (crew.kind === '*' ? ' selected' : '') + '>'
                  + esc(t('إدارة')) + '</option></select>'
                : esc(t((WO_KINDS[crew.kind] || {}).n || crew.kind))) + '</div>'
          + '<div class="field"><label>' + esc(t('الوصف')) + '</label>'
          +   (may('users')
                ? '<input value="' + esc(crew.d || '') + '" data-crd="' + esc(crew.n) + '" dir="auto">'
                : esc(crew.d || '')) + '</div>'
          + '</div>',
          may('users')
            ? ((techs.length || subs.length)
                ? '<span class="hint" style="margin:0">' + esc(t('فيه موظفون أو فرق فرعية — لا يُحذَف')) + '</span>'
                : btn('حذف الفريق','btn-quiet btn-sm',' data-crdel="' + esc(crew.n) + '"'))
            : '')

      + cardFlush(t('موظفو') + ' ' + esc(crew.n) + ' — ' + nm(techs.length),
          techs.length
            ? table(['الموظف','الوظيفة','الجوال','المشرف','نقاط الشهر',''],
                techs.map(function(x){
                  var e = byName[x.n];
                  return ['<input value="' + esc(x.n) + '" data-tkn="' + esc(x.n) + '" dir="auto">',
                          '<select data-tkjob="' + esc(x.n) + '">'
                            + '<option value="">— ' + esc(t('بلا وظيفة')) + ' —</option>'
                            + jobsList().map(function(j){
                                return '<option value="' + esc(j.id) + '"' + (x.job === j.id ? ' selected' : '')
                                  + '>' + esc(t(j.n)) + '</option>';
                              }).join('') + '</select>',
                          may('phones')
                            ? '<input value="' + esc(x.ph || '') + '" data-tkph="' + esc(x.n) + '" dir="ltr" placeholder="05…">'
                            : '<span class="hint" style="margin:0">' + esc(t('محجوب')) + '</span>',
                          '<select data-tksup="' + esc(x.n) + '">'
                            + mgrOptions(roleOfUser((STATE.users || {})[x.u]) || 'tech', x.sup || '', x.u) + '</select>',
                          N(e ? Math.round(e.total) : 0),
                          btn('حذف','btn-quiet btn-sm',' data-tkdel="' + esc(x.n) + '"')];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا موظفين في هذا الفريق بعد.')) + '</p>',
          btn('حسابات الفنيين','btn-secondary btn-sm',' data-p="users"'))

      + (may('users')
        ? card('إضافة موظف',
            '<div class="grid cols-2">'
            + '<div class="field"><label>' + esc(t('الاسم')) + ' <span class="req">*</span></label>'
            +   '<input id="depN" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('الجوال')) + '</label>'
            +   '<input id="depPh" dir="ltr" placeholder="05…"></div>'
            + '<div class="field"><label>' + esc(t('المشرف')) + '</label>'
            +   '<select id="depSup">' + mgrOptions('tech', '', '') + '</select></div>'
            + '</div>',
            btn('➕ إضافة موظف','btn-primary btn-sm',' data-depadd="' + esc(crew.id) + '"'))
        : '')

      + '<div class="chips">' + subs.map(function(x){
          return '<button type="button" class="chip' + (CTEAM_CUR===x.id?' on':'') + '" data-depteam="' + x.id + '">'
            + esc(dispName(x.n)) + ' <span class="num">' + nm(x.members.length) + '</span></button>';
        }).join('')
        + (may('users') ? btn('➕ فريق فرعي','btn-secondary btn-sm',' data-depteamnew="' + esc(crew.id) + '"') : '')
        + '</div>';

    if (!tm){
      html += card('لا فرقَ فرعية بعد',
        '<p class="hint" style="margin:0">'
        + esc(t('فرقُ الأنصبةِ تقسم نقاط موظفي هذا الفريق بنسبةٍ لكلِّ عضو — أنشئ أوّلها.'))
        + '</p>');
    } else {
      var tot = teamShare(tm), pts = teamPoints(tm);
      var ph = cfgGet('ph');
      var ok100 = tot === 100;

      html += stats([['أعضاء الفريق الفرعي', N(tm.members.length), 'acc'],
                     ['نقاط الفريق', N(pts)],
                     ['مجموع النسب', nm(tot) + '٪', ok100 ? 'ok' : 'bad'],
                     ['قيمة الفريق', ph ? N(Math.round(pts * ph)) + ' ' + t('ريال') : '—']])

        + (ok100 ? '' : alertBox('error','مجموعُ النسب ' + nm(tot) + '٪ — لا بدّ أن يكون مئةً بالضبط، وإلا ضاع نصيبٌ أو تكرّر.'))

        + card('اسم الفريق الفرعي',
            '<div class="field" style="max-width:340px;margin:0"><label>' + esc(t('الاسم')) + '</label>'
            + '<input data-tname="1" value="' + esc(tm.n) + '" dir="auto"></div>')

        + cardFlush('أعضاء ' + esc(tm.n),
            table(['العضو','الدور','النسبة ٪','نصيبه','مستحقّه',''],
              tm.members.map(function(m, i){
                var R = TEAM_ROLE[m.role] || TEAM_ROLE.tech;
                var sh = cfgN(m.share);
                var mine = tot ? (pts * sh / tot) : 0;
                return ['<strong>' + esc(m.name) + '</strong>',
                        '<select data-mrole="' + i + '">' + Object.keys(TEAM_ROLE).map(function(k){
                          return '<option value="' + k + '"' + (m.role===k?' selected':'') + '>'
                            + TEAM_ROLE[k].i + ' ' + esc(t(TEAM_ROLE[k].n)) + '</option>';
                        }).join('') + '</select>',
                        '<input type="number" min="0" max="100" step="1" value="' + sh
                          + '" data-share="' + i + '" style="max-width:88px">',
                        N(Math.round(mine * 10) / 10),
                        ph ? N(Math.round(mine * ph)) : '—',
                        btn('أخرِج','btn-quiet btn-sm',' data-depmemrm="' + i + '"')];
              }),
              ['<b>' + t('الإجمالي') + '</b>','',
               '<b class="' + (ok100 ? '' : 'req') + '">' + nm(tot) + '٪</b>',
               '<b>' + nm(pts) + '</b>',
               ph ? '<b>' + nm(Math.round(pts * ph)) + '</b>' : '—', '']),
            '<div class="actions">'
            + btn('وزّع بالتساوي','btn-secondary btn-sm',' data-depeven="1"')
            + btn('وزّع بالأدوار','btn-secondary btn-sm',' data-depbydef="1"')
            + (may('users') && !tm.members.length
                ? btn('حذف الفريق الفرعي','btn-quiet btn-sm',' data-depteamdel="' + esc(tm.id) + '"') : '')
            + '</div>')

        + card('إضافة عضو للفريق الفرعي',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('الموظف')) + '</label>'
            + '<select id="depMemName">' + techs.filter(function(x){
                return !tm.members.some(function(m){ return m.name === x.n; });
              }).map(function(x){ return '<option>' + esc(x.n) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field"><label>' + esc(t('الدور')) + '</label>'
            + '<select id="depMemRole">' + Object.keys(TEAM_ROLE).map(function(k){
                return '<option value="' + k + '">' + TEAM_ROLE[k].i + ' ' + esc(t(TEAM_ROLE[k].n)) + '</option>';
              }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('النسبة')) + ' ' + t('٪') + '</label>'
            + '<input type="number" id="depMemShare" min="0" max="100" value="20"></div>'
            + '</div>', btn('➕ إضافة','btn-primary btn-sm',' data-depmemadd="1"'));
    }

    if (may('users')) html += crewNewCard();

    if (orphan.length) html += alertBox('warn',
      esc(t('فيه')) + ' ' + nm(orphan.length) + ' ' + esc(t('موظفًا بلا فريقٍ صالح')) + ' \u00b7 '
      + orphan.map(function(x){ return esc(x.n); }).join(' \u00b7 ')
      + ' \u2014 ' + esc(t('اختر فريقًا له من قائمة «الموظف» أو أعِد إسنادَه من هنا.')));

    return html
      + '<p class="hint">' + esc(t('الفريقُ الذي فيه موظفون أو فرقٌ فرعيةٌ لا يُحذَف — انقلهم أولًا. وتغييرُ اسم الفريق ينقل من كان فيه معه.')) + '</p>';
  })();
    if (cur === 'crewplan') return head + (function(){
    var C = K();
    var rows = CREW_SPEC.map(function(s){ return { s:s, r:crewNeed(s, PLAN_MONTHS) }; });
    var ins = rows.filter(function(x){ return x.s.kind === 'install'; });
    var srv = rows.filter(function(x){ return x.s.kind === 'visit'; });
    var sum = function(L, f){ return L.reduce(function(a,x){ return a + f(x); }, 0); };

    return '<div class="chips">' + [3,4,5,6].map(function(m){
        return '<button type="button" class="chip' + (PLAN_MONTHS===m?' on':'') + '" data-months="' + m + '">'
          + nm(m) + ' ' + esc(t('أشهر')) + '</button>';
      }).join('') + '</div>'

      + stats([['فرق التركيب', N(sum(ins,function(x){return x.r.crews;})), 'acc'],
               ['أفرادها', N(sum(ins,function(x){return x.r.people;}))],
               ['معدّات', N(sum(ins,function(x){return x.r.gear;})), 'wrn'],
               ['أيام العمل', N((C.days||26) * PLAN_MONTHS)]])

      + cardFlush('طواقم التركيب',
          table(['الفريق','الطاقم','المعدل/يوم','النقاط','أيام-فريق','فرق لازمة','أفراد','معدّات'],
            ins.map(function(x){
              return ['<strong>' + esc(t(x.s.n)) + '</strong>',
                      nm(x.r.sup) + ' ' + esc(t('مشرف')) + ' + ' + nm(x.r.tech) + ' ' + esc(t('فني')),
                      N(x.r.rate), N(x.r.units), N(x.r.crewDays),
                      '<span class="pill acc">' + nm(x.r.crews) + '</span>',
                      N(x.r.people), x.r.gear ? N(x.r.gear) : '—'];
            }),
            ['الإجمالي','','', N(sum(ins,function(x){return x.r.units;})),
             N(sum(ins,function(x){return x.r.crewDays;})),
             N(sum(ins,function(x){return x.r.crews;})),
             N(sum(ins,function(x){return x.r.people;})),
             N(sum(ins,function(x){return x.r.gear;}))]))

      + cardFlush('طواقم المسح',
          table(['الفريق','الطاقم','المعدل/يوم','النقاط','أيام-فريق','فرق لازمة','أفراد'],
            srv.map(function(x){
              return ['<strong>' + esc(t(x.s.n)) + '</strong>',
                      nm(x.r.sup) + ' ' + esc(t('مشرف')) + ' + ' + nm(x.r.tech) + ' ' + esc(t('فني')),
                      N(x.r.rate), N(x.r.units), N(x.r.crewDays),
                      '<span class="pill acc">' + nm(x.r.crews) + '</span>', N(x.r.people)];
            }),
            ['الإجمالي','','', N(sum(srv,function(x){return x.r.units;})),
             N(sum(srv,function(x){return x.r.crewDays;})),
             N(sum(srv,function(x){return x.r.crews;})),
             N(sum(srv,function(x){return x.r.people;}))]))

      + card('ضبط المعدلات',
          table(['النوع','مشرف','فنيون','معدّات','المعدل/يوم'],
            CREW_SPEC.map(function(s){
              return [esc(t(s.n)),
                      cfgInput('crewSup', s.k), cfgInput('crewTech', s.k),
                      cfgInput('crewGear', s.k), cfgInput('crewRate', s.k, { dec:1 })];
            })),
          btn('حفظ المعدلات','btn-primary btn-sm',' data-cfgok="1"'))

      + card('تارجت التركيب يُحسب على القطع',
          '<p class="hint" style="margin:0 0 12px">' + esc(t('عدد النقاط لا يقيس الجهد: مخيمٌ فيه خمس عشرة قطعة ليس كمخيمٍ فيه ثلاث. فالتارجت يُقاس على قطع النقطة — وتُحدَّد قطع كل نقطةٍ بعد اعتماد مسحها.')) + '</p>'
          + flow(['مسح الموقع','اعتماد المسح','تُحدَّد قطع النقطة','تدخل الجدولة','تُركَّب وتُحتسب قطعًا'], 0)
          + '<div class="alert warn" style="margin:12px 0 0"><span>'
          + esc(t('القطع لكل نقطة تُحدَّد بعد اعتماد المسح — فالتارجت بالقطع يبقى تقديريًّا حتى يكتمل المسح.'))
          + '</span></div>');
  })();
    return head + (function(){
    var views = [['rank','الترتيب العام'], ['stage','حسب المرحلة'],
                 ['job','حسب الوظيفة'], ['crew','حسب الفريق'], ['project','المشروع كله']];
    var names = techNames();

    var html = '<div class="chips">' + views.map(function(v){
        return '<button type="button" class="chip' + (PERF_VIEW===v[0]?' on':'') + '" data-perfview="' + v[0] + '">'
          + esc(t(v[1])) + '</button>';
      }).join('') + '</div>';

    if (PERF_VIEW === 'stage'){
      html += perfStageTable();
    } else if (PERF_VIEW === 'job'){
      var byJob = rollupBy(function(e, tx){ return tx ? tx.job : ''; },
                            function(id){ var j = jobOf(id); return j ? j.n : 'بلا وظيفة'; });
      html += card('حسب الوظيفة', rollupTable(byJob, 'الوظيفة'));
    } else if (PERF_VIEW === 'crew'){
      var byCrew = rollupBy(function(e, tx){ return tx ? tx.crew : ''; });
      html += card('حسب الفريق', rollupTable(byCrew, 'الفريق'));
    } else if (PERF_VIEW === 'project'){
      var project = rollupBy(function(){ return 'المشروع'; });
      html += card('المشروع كله', rollupTable(project, 'المشروع'));
    } else {
      html += perfRankTable();
    }

    html += '<p class="hint">' + esc(t('لا رقمَ هنا مكتوبٌ بيد: كلُّه محسوبٌ من أوزان الإعدادات وما سجّله كلُّ فنيٍّ فعلًا، ونقاطُ الزيادة تُضاف بقرار المهندس أو مدير المشروع فقط.')) + '</p>';

    if (maySupEng()) html += bonusFormHtml(names, 'perf');
    html += bonusLogHtml(names);

    return html;
  })();
  }};


