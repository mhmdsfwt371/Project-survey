/* ============================================================================
   FILE    : src/03zz-late/02-catalog--02-catalog-forms-05-management-performance.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/02-catalog/02-catalog-forms-05-management-performance.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : pmoSees, pmoFetch, pmoEdBtn, pmoEdLabel, pmoEdCancel, pmoEdId, pmoEdFill, pmoVal, lessonsBody, stakeBody, pmiBody
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function pmoSees(){ return may('settings') || effRole(ROLE) === 'exec'; }

function pmoFetch(force){
  if (!pmoSees()) return;
  if (!force && (PV.PMO.v || Date.now() - PV.PMO.at < 600000)) return;
  if (!FB.ready || !FB.db){ PV.PMO.v = PV.PMO.v || STATE.pmo || { lessons:{}, retros:{}, stake:{} }; return; }
  PV.PMO.at = Date.now();
  DB.col('settings').doc('pmo').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    PV.PMO.v = (doc && doc.exists) ? doc.data() : {}; STATE.pmo = PV.PMO.v; if (CUR === 'exec') render(1);
  }).catch(function(e){ PV.PMO.err = String(e && (e.code || e.message) || e).slice(0, 60); });
}

function pmoEdBtn(sec, id){ return btn('\u270E', 'btn-quiet btn-sm', ' data-pmoedit="' + sec + '|' + esc(id) + '" aria-label="' + esc(t('تعديل')) + '"'); }

function pmoEdLabel(sec, addLabel){ return PV.PMO_ED.sec === sec ? t('احفظ التعديل') : t(addLabel); }

function pmoEdCancel(sec){ return PV.PMO_ED.sec === sec ? btn(t('إلغاء التعديل'), 'btn-quiet btn-sm', ' data-pmoedcancel="1"') : ''; }

function pmoEdId(sec, fresh){ return PV.PMO_ED.sec === sec && PV.PMO_ED.id ? PV.PMO_ED.id : fresh; }

function pmoEdFill(){
  var f = PV.PMO_FORM[PV.PMO_ED.sec]; if (!f) return;
  var x = pmoList(PV.PMO_ED.sec).filter(function(r){ return r.id === PV.PMO_ED.id; })[0]; if (!x) return;
  var first = null;
  Object.keys(f).forEach(function(k){ var el = document.getElementById(f[k]); if (!el) return; el.value = x[k] == null ? '' : String(x[k]); if (!first) first = el; });
  if (first){ try { first.scrollIntoView({ block:'center' }); first.focus(); } catch (e){ LS_ERR = e; } }
}

function pmoVal(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim().slice(0, 600) : ''; }

function lessonsBody(){
  pmoFetch();
  var L = pmoList('lessons'), R = pmoList('retros'), ed = may('settings');
  var dom = '<select id="lsD">' + PV.PMO_DOMAINS.map(function(d){ return '<option value="' + esc(d) + '">' + esc(t(d)) + '</option>'; }).join('') + '</select>';
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
  var lv = function(id, cur){ return '<select id="' + id + '">' + PV.PMO_LEVELS.map(function(l){ return '<option value="' + esc(l) + '"' + (cur === l ? ' selected' : '') + '>' + esc(t(l)) + '</option>'; }).join('') + '</select>'; };
  var hl = function(id){ return '<select id="' + id + '"><option value="3">' + esc(t('عالٍ')) + '</option><option value="2" selected>' + esc(t('متوسط')) + '</option><option value="1">' + esc(t('منخفض')) + '</option></select>'; };
  var gap = S.filter(function(x){ return PV.PMO_LEVELS.indexOf(x.cur) < PV.PMO_LEVELS.indexOf(x.want); }).length;
  return stats([['أصحابُ مصلحةٍ مسجّلون', N(S.length)], ['دون المطلوب', N(gap), gap ? 'wrn' : 'ok']])
    + (ed ? card('صاحبُ مصلحةٍ جديد',
        '<div class="grid2"><label>' + esc(t('الجهة أو الشخص')) + '<input id="shN"></label><label>' + esc(t('الدور')) + '<input id="shR"></label></div>'
        + '<div class="grid2"><label>' + esc(t('التأثير')) + hl('shI') + '</label><label>' + esc(t('الاهتمام')) + hl('shT') + '</label></div>'
        + '<div class="grid2"><label>' + esc(t('الانخراط الحالي')) + lv('shC', 'محايد') + '</label><label>' + esc(t('الانخراط المطلوب')) + lv('shD', 'داعم') + '</label></div>'
        + '<div class="grid2"><label>' + esc(t('الخطة')) + '<input id="shS"></label><label>' + esc(t('المسؤول')) + '<input id="shO"></label></div>'
        + '<div class="actions">' + btn(pmoEdLabel('stake', 'أضف'), 'btn-primary btn-sm', ' data-stakeadd="1"') + pmoEdCancel('stake') + '</div>') : '')
    + (S.length ? cardFlush(t('سجل أصحاب المصلحة') + ' \u2014 ' + nm(S.length),
        table(['الجهة', 'الدور', 'تأثير/اهتمام', 'الحالي ← المطلوب', 'الخطة', 'المسؤول', 'آخر مراجعة', ''], S.map(function(x){
          var g = PV.PMO_LEVELS.indexOf(x.cur) < PV.PMO_LEVELS.indexOf(x.want);
          return ['<b>' + esc(x.n || '') + '</b>', esc(x.r || ''), nm(x.inf || 0) + ' / ' + nm(x.int || 0),
                  (ed ? '<select data-stakecur="' + esc(x.id) + '" style="min-height:30px;font-size:12px;width:auto">' + PV.PMO_LEVELS.map(function(l){ return '<option value="' + esc(l) + '"' + (x.cur === l ? ' selected' : '') + '>' + esc(t(l)) + '</option>'; }).join('') + '</select>' : esc(t(x.cur || '')))
                    + ' \u2190 ' + pill(t(x.want || ''), g ? 'wrn' : 'ok'),
                  esc(x.s || ''), esc(x.o || ''), esc(fmtDate(x.at)), ed ? pmoEdBtn('stake', x.id) + btn('\u2715', 'btn-quiet btn-sm', ' data-pmodel="stake|' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') : ''];
        }))) : '')
    + '<p class="hint">' + esc(t('مصفوفةُ الانخراط: غير مدرك · مقاوم · محايد · داعم · قائد. تغييرُ الحالي يؤرّخ المراجعة.')) + '</p>';
}

function pmiBody(){
  pmoFetch(); if (typeof sysReportFetch === 'function') sysReportFetch();
  var R = pmiRows(), c = { ok:0, part:0, gap:0, na:0 }; R.forEach(function(r){ c[r.st]++; });
  var app = R.length - c.na, score = app ? Math.round((c.ok + c.part / 2) / app * 100) : 0;
  var sec = function(fw, title){
    var L = R.filter(function(r){ return r.fw === fw; });
    return cardFlush(t(title), table(['البند', 'الدليل في النظام', 'القياس', 'الحالة'], L.map(function(r){
      var S = PV.PMI_ST[r.st];
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
