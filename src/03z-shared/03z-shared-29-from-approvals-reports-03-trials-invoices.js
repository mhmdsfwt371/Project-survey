/* ============================================================================
   FILE    : src/03z-shared/03z-shared-29-from-approvals-reports-03-trials-invoices.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-03-trials-invoices.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : trialKitHtml, trialsDoc, trialRows, trialInCost, trialMay, trialSave, trialItems, itemsSum, trialTotal, trialsItemsSpend, trialsTotal, trialZones … (+12 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ التجربةُ عُدّةٌ في موضعٍ تنتهي بقرار (V17.73) ═══
   كان الدفترُ يعرف من التجربة اسمَها وساعاتِها ومصروفَها — ولا يعرف ما جُرِّب
   ولا أين ولا بمَ انتهت. فصار لكلِّ تجربةٍ عُدّتُها (بوابةٌ وحساساتٌ بأعدادها)
   وموضعُها ونتيجتُها وتقريرُها على الدرايف وصورُها — تُرفَع بالخطِّ نفسِه الذي
   ترفع به صورُ النقاط (الهاتفُ يكتب والخادمُ ينقل) تحت معرّفٍ للتجربة. */
PV.TRIAL_OUT = { 'جارية':'', 'ناجحة':'ok', 'تحتاج إعادة':'warn', 'لم تنجح':'bad' };

function trialKitHtml(r, me){
  var kit = [];
  if (r.zone || r.type) kit.push(esc([r.zone, r.type].filter(Boolean).map(function(v){ return t(v); }).join(' \u00b7 ')));   /* (V37.76) */
  if (r.gw) kit.push(esc(r.gw) + (r.gwN ? ' \u00d7 ' + nm(r.gwN) : ''));
  if (r.sn) kit.push(esc(r.sn) + (r.snN ? ' \u00d7 ' + nm(r.snN) : ''));
  var ph = photosOf('TRIAL-' + r.id), q = (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q : []).filter(function(p){ return p.site === 'TRIAL-' + r.id; });
  var out = r.out || 'جارية';
  return '<div class="wt-row" style="margin:6px 0 0;gap:6px;flex-wrap:wrap">'
    + pill(t(out), PV.TRIAL_OUT[out] || '')
    + (kit.length ? '<span class="hint" style="margin:0">' + kit.join(' \u00b7 ') + '</span>' : '')
    + (r.site && siteFind(r.site) ? btn('\u{1F4CD} ' + (siteFind(r.site).name || r.site) + ' \u2190', 'btn-quiet btn-sm', ' data-site="' + esc(r.site) + '" title="' + esc(t('نقطة التجربة')) + '"') : (r.where ? '<span class="hint" style="margin:0">\u{1F4CD} ' + esc(r.where) + '</span>' : ''))   /* (V37.44) */
    + (r.report ? '<a class="btn btn-quiet btn-sm" href="' + esc(r.report) + '" target="_blank" rel="noopener">\u{1F4C4} ' + esc(t('التقرير')) + '</a>' : '')
    + (ph.length || q.length ? '<span class="hint" style="margin:0">\u{1F4F7} ' + nm(ph.length + q.length) + '</span>' : '')
    + (me ? '<label class="btn btn-quiet btn-sm" style="cursor:pointer">\u{1F4F7} ' + esc(t('أضِف صورة'))
              + '<input type="file" accept="image/*" data-trph="' + esc(r.id) + '" style="display:none"></label>' : '')
    + '</div>';
}

function trialsDoc(){
  var d = STATE.trials;
  if (!d || !Array.isArray(d.rows)) d = STATE.trials = { rows:[], inCost:false, at:0, by:'' };
  return d;
}

function trialRows(){ return trialsDoc().rows; }

function trialInCost(){ return !!trialsDoc().inCost; }

function trialMay(){ return may('money'); }

function trialSave(){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return false; }
  var d = trialsDoc(); d.at = Date.now(); d.by = STATE.meta.name || '';
  CORE.set('cfg', 'trials', { rows:d.rows, inCost:!!d.inCost, at:d.at, by:d.by });
  CORE.saveSoon(); return true;
}

/* ═══ أصنافُ التجربة (V17.7) ═══
   بعضُ ما يُشترى للتجربة لا يمرُّ بدفتر المشتريات: قطعةٌ من السوق بفاتورةٍ
   صغيرة، أو سلكٌ وبطاريةٌ من المخزن. فصار لكلِّ تجربةٍ دفترُ أصنافٍ صغير:
   الصنفُ وكميتُه وسعرُ وحدته، فيُحسَب إجماليُّ السطر وإجماليُّ التجربة
   وإجماليُّ التجارب كلِّها — ويُطبَع مع التقرير. والمشترياتُ المربوطةُ تبقى
   كما هي: مصروفُ التجربة هو الاثنان معًا، ومفتاحُ «ضمن التكاليف» يحكمهما. */
function trialItems(r){ return Array.isArray(r && r.items) ? r.items : []; }

function itemsSum(r){
  return trialItems(r).reduce(function(a, x){ return a + (+x.q || 0) * (+x.p || 0); }, 0);
}

function trialTotal(r){ return itemsSum(r) + trialSpend(r.id); }

function trialsItemsSpend(){ return trialRows().reduce(function(a, r){ return a + itemsSum(r); }, 0); }

function trialsTotal(){ return trialsItemsSpend() + trialsSpend(); }

/* ═══ (V37.76) أصنافُ التجربة من الكتالوج — مشعرٌ ثم نوعٌ ثم قطعُ النوع ═══
   كان الصنفُ يُكتَب بيدٍ فيتكرّر بأسماءٍ مختلفة ولا يُعرَف سعرُه. صار لكلِّ تجربةٍ مشعرُها
   ونوعُها (مخيمٌ أو ممرٌّ أو محطةٌ…) فتظهر قطعُ ذلك النوع من الكتالوج نفسِه — بسعرها —
   في قائمةٍ منسدلة، ويبقى الصنفُ الحرُّ لما ليس في الكتالوج. */
function trialZones(){
  var o = {}; (STATE.sites || []).forEach(function(x){ if (x && x.zone) o[x.zone] = 1; });
  return Object.keys(o).sort(function(a, b){ return a.localeCompare(b, 'ar'); });
}

function trialTypes(zone){
  var o = {}; (STATE.sites || []).forEach(function(x){ if (x && x.type && (!zone || x.zone === zone)) o[x.type] = 1; });
  return Object.keys(o).sort(function(a, b){ return a.localeCompare(b, 'ar'); });
}

function trialCatItems(type){
  if (!type) return [];
  var z = siteZone({ type:type });
  return itemsList().filter(function(i){ return i && i.z === z && i.name; });
}

function trialOpts(list, cur, ph){
  return '<option value="">' + esc(t(ph)) + '</option>' + list.map(function(v){
    return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join('');
}

function trialPickHtml(r){
  var items = trialCatItems(r.type);
  var h = '<div class="grid cols-2" style="gap:6px;margin:6px 0 0">'
    + '<div class="field" style="margin:0"><label class="mini">' + esc(t('المشعر')) + '</label>'
    +   '<select data-trz="' + esc(r.id) + '">' + trialOpts(trialZones(), r.zone || '', 'اختر') + '</select></div>'
    + '<div class="field" style="margin:0"><label class="mini">' + esc(t('النوع')) + '</label>'
    +   '<select data-trt="' + esc(r.id) + '">' + trialOpts(trialTypes(r.zone || ''), r.type || '', 'اختر') + '</select></div>'
    + '</div>'
    + '<div class="grid cols-3" style="gap:6px;margin:6px 0 0">'
    + '<div class="field" style="margin:0"><label class="mini">' + esc(t('الصنف')) + (items.length ? ' <span class="num">' + nm(items.length) + '</span>' : '') + '</label>'
    + (items.length
        ? '<select id="itC' + esc(r.id) + '" data-tric="' + esc(r.id) + '"><option value="">' + esc(t('اختر قطعةً من النوع')) + '</option>'
          + items.map(function(i){ return '<option value="' + esc(i.code) + '" data-p="' + (+i.price || 0) + '">' + esc(i.name) + '</option>'; }).join('')   /* (V37.82) السعرُ في خانته لا بجوار الاسم */
          + '</select><input id="itN' + esc(r.id) + '" dir="auto" style="margin-top:4px" placeholder="' + esc(t('أو اكتب صنفًا خارج الكتالوج')) + '">'
        : '<input id="itN' + esc(r.id) + '" dir="auto" placeholder="' + esc(t(r.type ? 'لا قطعَ لهذا النوع في الكتالوج — اكتب الصنف' : 'اختر المشعرَ والنوعَ لتظهر قطعُه')) + '">')
    + '</div>'
    + '<div class="field" style="margin:0"><label class="mini">' + esc(t('الكمية')) + '</label><input id="itQ' + esc(r.id) + '" type="number" min="0" step="1" inputmode="numeric" value="1"></div>'
    + '<div class="field" style="margin:0"><label class="mini">' + esc(t('سعر الوحدة')) + '</label><input id="itP' + esc(r.id) + '" type="number" min="0" step="0.01" inputmode="decimal"' + (items.length ? ' placeholder="' + esc(t('يُملأ من الكتالوج عند الاختيار')) + '"' : '') + '></div>'
    + '</div><div class="actions" style="margin:6px 0 0">'
    + btn('\u2795 ' + t('أضِف الصنف'),'btn-secondary btn-sm',' data-tritem="' + esc(r.id) + '"')
    + (items.length ? btn('\u{1F4CB} ' + t('حمّل قطعَ النوع كلَّها'),'btn-quiet btn-sm',' data-trkit="' + esc(r.id) + '"') : '')
    + '</div>';
  return h;
}

/* مشترياتُ تجربةٍ بعينها، وساعاتُها، ومجموعُ الدفتر */
function trialBuys(id){ return buysList().filter(function(b){ return String(b.trial || '') === String(id); }); }

function trialSpend(id){ return trialBuys(id).reduce(function(a, b){ return a + (+b.amt || 0); }, 0); }

function trialsSpend(){ return buysList().reduce(function(a, b){ return a + (b.trial ? (+b.amt || 0) : 0); }, 0); }

function trialsHours(){ return trialRows().reduce(function(a, r){ return a + (+r.hours || 0); }, 0); }

/* ── المشتريات ── */
function buysList(){
  var B = STATE.buys || {};
  return Object.keys(B).map(function(k){ return B[k]; })
    .filter(Boolean).sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
}

function supList(){ return seedOnce('sups', DATA.suppliers); }

function catList(){ return seedOnce('cats', DATA.buyCats); }

function buyMayEdit(){ return may('money') && rankOf(ROLE) >= rankOf('engineer'); }
