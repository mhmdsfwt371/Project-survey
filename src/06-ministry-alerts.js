
/* ═══ (V30.1) التنبيهاتُ بقواعدَ تُضبَط من الإعدادات ═══
   كلُّ قاعدةٍ: مفتاحُ الأيام في CFG، وشرطٌ على النقطة وسجلِّها، ونصٌّ يُقرأ. ما تجاوز أيامَ القاعدة يُعَدّ تنبيهًا ويُفتَح قائمةً ويُصدَّر. */
var AL_RULES = [
  ['al_obs',     'alObsDays',     'معوّق مفتوح منذ أكثر من',  function(x, r, d){ return !!(r && svDone(r) && svHasChal(r)) && !(STATE.inss[x.id] && STATE.inss[x.id].status === 'مُركّب') && ageDays(r.at) > d; }],
  ['al_permit',  'alPermitDays',  'تصريح دخول معلّق منذ أكثر من', function(x, r, d){ return !!(r && r.access === 'يحتاج تصريح') && ageDays(r.at) > d; }],
  ['al_revisit', 'alRevisitDays', 'أُعيدت للزيارة ولم تُزَر منذ أكثر من', function(x, r, d){ return !!(r && r.review === 'revisit') && ageDays(r.revAt || r.at) > d; }],
  ['al_nophoto', 'alNoPhotoDays', 'ممسوحة بلا صور منذ أكثر من', function(x, r, d){ return !!(r && svDone(r)) && !recIsQuick(r) && !!svPhotoState(x, r) && ageDays(r.at) > d; }],   /* (V33.5) لا الزيارةُ بقرار المهندس */
  ['al_assign',  'alAssignDays',  'مُسندة ولم تُزَر منذ أكثر من', function(x, r, d){ if (r) return false; var tk = taskKindOf(x.id, 'visit'); return !!(tk && tk.at && tk.status !== 'منجز' && ageDays(tk.at) > d); }],
  ['al_stale',   'alStaleDays',   'تحتاج زيارة أخرى ولم تُعَد منذ أكثر من', function(x, r, d){ return !!(r && r.access && r.access !== 'تم الوصول') && ageDays(r.at) > d; }]
];
function ageDays(ts){ return ts ? Math.floor((Date.now() - (+ts || 0)) / 864e5) : 0; }
function alRuleDays(k){ var d = +cfgGet(k) || 0; return d > 0 ? d : 0; }
function alRuleList(rule){
  var d = alRuleDays(rule[1]); if (!d) return [];
  return svListSites().filter(function(x){ try { return rule[3](x, STATE.recs[x.id], d); } catch (e){ return false; } });
}
function alAll(){   /* (V33.7) مرةً في الرسمة — الملخّصُ التنفيذيُّ وبطاقةُ التنبيهات كانا يمرّان على القواعد كلٌّ وحدَه */
  var mk = AL_RULES.map(function(r){ return alRuleDays(r[1]); }).join(','); if (DB.memo && DB.memo.al && DB.memo.al.k === mk) return DB.memo.al.v;
  var v = AL_RULES.map(function(rule){ var d = alRuleDays(rule[1]); return { k:rule[0], cfg:rule[1], label:t(rule[2]) + ' ' + nm(d) + ' ' + t('يوم'), days:d, sites:d ? alRuleList(rule) : [], off:!d }; });
  if (DB.memo) DB.memo.al = { k:mk, v:v }; return v; }
function alCard(){
  /* (V33.0) قرارُ المالك: لا «تصريح» في عرض الوزارة — قاعدةُ التصريح المعلّق تبقى للمكتب ولا تظهر هنا */
  var A = alAll().filter(function(a){ return !(CUR === 'mfu' && a.k === 'al_permit'); }), tot = A.reduce(function(a, b){ return a + b.sites.length; }, 0);
  return card('\u{1F6A8} ' + t('تنبيهات القواعد') + ' \u2014 ' + nm(tot),   /* (V30.6) */
    (may('settings') ? '<p class="hint" style="margin:0 0 6px">' + esc(t('تُضبَط أيامُها من ثوابت النظام')) + '</p>' : '') + '<div class="mfu-kpis">' + A.map(function(a){ return '<div class="mfu-kpi"' + (a.off ? '' : ' data-svlist="' + a.k + '" role="button" tabindex="0" style="cursor:pointer" title="' + esc(t('اضغط للقائمة والتصدير')) + '"') + '><div class="mfu-kpi-l">' + esc(a.label) + (a.off ? '' : ' \u203A') + '</div><div class="mfu-kpi-v"' + (a.sites.length ? ' style="color:#C0392B"' : '') + '>' + (a.off ? '<span class="hint">' + esc(t('معطَّلة')) + '</span>' : nm(a.sites.length)) + '</div></div>'; }).join('') + '</div>');
}
function svListSites(){   /* (V29.9) على صفحة الوزارة تتبع القوائمُ فلترَ المشعر والنوع */
  var all = STATE.sites || []; if (CUR !== 'mfu' || !(MFU.flt.z || MFU.flt.t)) return all;
  return all.filter(function(x){ var tx = taxOf(x); return (!MFU.flt.z || tx.g === MFU.flt.z) && (!MFU.flt.t || tx.t === MFU.flt.t); });
}
function svListRows(key){   /* (V31.6) القائمةُ تُحسَب مرةً في المهمة الواحدة — بطاقاتُ الملخّص وحدَها كانت تمرّ على النقاط عشرَ مرات */
  var mk = key + '|' + CUR + '|' + (MFU.flt.z || '') + '|' + (MFU.flt.t || '') + (/^al_/.test(key) ? '|' + AL_RULES.map(function(r){ return alRuleDays(r[1]); }).join(',') : ''), LM = DB.memo ? DB.memo.lists : null;   /* أيامُ القواعد في المفتاح: تغييرُها في المهمة نفسِها لا يُرجِع قائمةً قديمة */
  if (LM && LM[mk]) return LM[mk].slice();
  var res = svListRows0(key); if (LM) LM[mk] = res;
  return res.slice();
}
/* (V32.5) طلبُ المالك: «كلُّ كارت يفتح قائمتَه وأقدر أصدّرها» — قوائمُ ليست نقاطًا تُسجَّل هنا بعنوانها ورأسها وصفوفها */
MFU.lists = {
  cos:   { title:'شركات الخدمة', head:['الشركة', 'المخيمات', 'تمت الزيارة', 'نسبة الزيارة', 'مُركّب', 'معوّقات', 'فيها تحديات'],
           rows:function(){ return mfuCompanies().map(function(c){ return [c.co, c.n, c.sv, c.svp + '٪', c.ins, c.obs, c.chal]; }); } },
  chalo: { title:'تحدياتٌ مفتوحة', head:['التحدي', 'آلية المعالجة', 'من سيحلّه', 'الحالة'],
           rows:function(){ return mfuAllChal().filter(function(c){ return !mfuChalClosed(c); }).map(function(c){ return [String(c.t || ''), String(c.m || ''), String(c.owner || ''), String(c.st || '')]; }); } },
  req:   { title:'طلباتٌ قيد المتابعة', head:['الطلب', 'الحالة', 'الإفادة'],
           rows:function(){ return mfuList('req').filter(function(x){ return mfuReqView(x).st !== 'منجز'; }).map(function(x){ var v = mfuReqView(x); return [String(x.t || ''), String(v.st || ''), String(v.u || '')]; }); } },
  wdone: { title:'أُنجز هذا الأسبوع', head:['المهمة', 'المسؤول', 'الحالة', 'الاستحقاق'], rows:function(){ return mfuWeekBlocks().done.map(mfuWtRow); } },
  wnext: { title:'مستحقٌّ خلال ٧ أيام', head:['المهمة', 'المسؤول', 'الحالة', 'الاستحقاق'], rows:function(){ return mfuWeekBlocks().next.map(mfuWtRow); } },
  wlate: { title:'متأخرة', head:['المهمة', 'المسؤول', 'الحالة', 'الاستحقاق'], rows:function(){ return mfuWeekBlocks().late.map(mfuWtRow); } },
  wwait: { title:'متوقفة أو بانتظار قرار', head:['المهمة', 'المسؤول', 'الحالة', 'الاستحقاق'], rows:function(){ return mfuWeekBlocks().wait.map(mfuWtRow); } }
};
function mfuWtRow(r){ return [String(r.n || ''), String(dispName(r.who || '')), String(r.st || ''), String(r.due || '')]; }
/* (V33.7) العددُ بلا بناء الصفوف: بطاقاتُ الملخّص كانت تبني ثلاثَ قوائمَ كاملةٍ (تواريخُ وترجمةٌ لكلِّ نقطة) لتعدّها فقط */
function svListCount(key){
  if (!SV_LISTS[key]) return svListRows(key).length;
  var LM = DB.memo ? DB.memo.lists : null, mk = '#' + key + '|' + CUR + '|' + (MFU.flt.z || '') + '|' + (MFU.flt.t || '');
  if (LM && LM[mk] != null) return LM[mk];
  var f = SV_LISTS[key][1], n = 0; svListSites().forEach(function(x){ if (f(x, STATE.recs[x.id])) n++; });
  if (LM) LM[mk] = n; return n;
}
/* (V33.3) بطاقاتُ القاعة: قائمةُ نوعٍ بعينه بدون عوائق أو بعوائق — المفتاحُ obok|<النوع> أو obbad|<النوع> */
function svObKey(key){ var m = /^(obok|obbad)\|(.+)$/.exec(String(key || '')); return m ? { bad:m[1] === 'obbad', ty:m[2] } : null; }
function svListRows0(key){
  if (MFU.lists[key]) return MFU.lists[key].rows();
  var OK = svObKey(key);
  if (OK) return svListRows0(OK.bad ? 'chal' : 'clean').filter(function(row){ var x = siteFind(row[0]); return x && taxOf(x).t === OK.ty; });
  var L = SV_LISTS[key] || svDynList(key);   /* (V37.4) */
  if (!L && /^al_/.test(key)){ var rule = AL_RULES.filter(function(r){ return r[0] === key; })[0]; if (!rule) return [];   /* (V30.1) قوائمُ قواعد التنبيه */
    var ids = {}; alRuleList(rule).forEach(function(x){ ids[x.id] = 1; }); L = [t(rule[2]) + ' ' + nm(alRuleDays(rule[1])) + ' ' + t('يوم'), function(x){ return !!ids[x.id]; }]; }
  if (!L) return [];
  return svListSites().filter(function(x){ return L[1](x, STATE.recs[x.id]); }).map(function(x){
    var r = STATE.recs[x.id], c = taxOf(x);
    return [x.id, String(x.name || ''), t(c.g), t(c.t), String(x.co || ''), r && r.at ? dayKey(+r.at) : '', r ? (r.by || '') : '',
            key === 'badphoto' ? photosOf(x.id).filter(function(e){ return photoQualityFlags(e[1].q).length; }).map(function(e){ return (e[1].kind || '') + ': ' + photoQualityFlags(e[1].q).map(function(f){ return t(f); }).join('/'); }).join('، ') :
            (key === 'campins' || key === 'corins') ? (mfuInstalled(x) ? t('مُركّب') : t((STATE.inss[x.id] || {}).status || 'لم يبدأ')) :
            key === 'obs' ? (mfuObsMap()[x.id] || []).join('، ') :
            key === 'nophoto' ? t(svPhotoState(x, r)) : svStateText(r)];   /* (V37.3) الحالةُ وسببُها أو الفئاتُ الواضحة */
  });
}
function svListHead(key){ if (MFU.lists[key]) return MFU.lists[key].head; return ['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'آخر زيارة', 'بواسطة', key === 'nophoto' || key === 'al_nophoto' || key === 'badphoto' ? 'الصور' : (key === 'campins' || key === 'corins') ? 'التركيب' : key === 'obs' ? 'المعوّقات' : 'الحالة — سبب عدم المسح أو التحديات']; }
function svListTitle(key){ if (MFU.lists[key]) return t(MFU.lists[key].title); var OK = svObKey(key); if (OK) return t((TAX_DEF[OK.ty] || { l:OK.ty }).l) + ' \u2014 ' + t(OK.bad ? 'بعوائق' : 'بدون عوائق'); if (SV_LISTS[key]) return t(SV_LISTS[key][0]); var DL = svDynList(key); if (DL) return t(DL[0]); var rule = AL_RULES.filter(function(r){ return r[0] === key; })[0]; return rule ? t(rule[2]) + ' ' + nm(alRuleDays(rule[1])) + ' ' + t('يوم') : key; }   /* (V30.1) */
function svListPop(){
  if (!SV_POP || !(SV_LISTS[SV_POP] || svDynList(SV_POP) || MFU.lists[SV_POP] || svObKey(SV_POP) || /^al_/.test(SV_POP))) return '';
  var rows = svListRows(SV_POP), head = svListHead(SV_POP), shown = rows.slice(0, 300);
  var asDash = !!SV_DASH_KEYS[SV_POP] && SV_VIEW !== 'list';   /* (V37.16) */
  var PCN = {}, PP = STATE.photos || {}; Object.keys(PP).forEach(function(k){ var x = PP[k]; if (x && !x.del && x.site) PCN[x.site] = (PCN[x.site] || 0) + 1; });   /* (V37.14) فهرسٌ مرةً للنافذة */
  return '<div class="svpop-veil" data-svpopclose="1" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000"></div>'
    + '<div class="svpop" role="dialog" aria-modal="true" data-keepscroll="svpop:' + esc(SV_POP) + '" style="position:fixed;z-index:2001;inset:6vh 4vw auto 4vw;max-height:86vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.35)">'   /* (V30.6) ألوانُ التطبيق لا بياضٌ ثابت */
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0">' + esc(svListTitle(SV_POP)) + ' \u2014 ' + nm(rows.length) + '</h3>'
    + '<div class="actions" style="margin:0">' + btn('\u2B07 ' + t('تصدير إكسل — التفاصيل'), 'btn-primary btn-sm', ' data-svpopxls="' + esc(SV_POP) + '"')
      + (SV_DASH_KEYS[SV_POP] ? btn(asDash ? '\u2630 ' + t('القائمة') : '\u{1F4CA} ' + t('اللوحة'), 'btn-quiet btn-sm', ' data-svview="' + (asDash ? 'list' : 'dash') + '"') : '')
      + btn('\u2715 ' + t('إغلاق'), 'btn-quiet btn-sm', ' data-svpopclose="1"') + '</div></div>'
    + (SV_POP === 'nophoto' ? '<p class="hint" style="margin:6px 0">' + esc(t('وجِّه الشبابَ لهذه النقاط لإضافة الصور من «تعديل المسح» — «التُقطت ولم تُرفع» تعني أن الصور على جهاز صاحب الزيارة: يفتح التطبيقَ على الشبكة.')) + '</p>' : '')
    /* (V37.6) طلبُ المالك: «عاوز هنا الصور — أقدر أفتح صور المخيم ده في كل التحديات وأسباب عدم المسح». عمودُ «الصور» في النافذة وحدَها (لا في الإكسل) */
    + (asDash && rows.length ? svDashHtml(SV_POP, rows) : '')
    + (!asDash && rows.length ? table(head.map(function(h){ return h; }).concat([t('الصور')]), shown.map(function(r){ var sx = siteFind(r[0]), pn = PCN[r[0]] || ((STATE.recs[r[0]] || {}).photos || []).length;   /* (V37.7 → V37.14: من الفهرس) */
        return [ sx ? siteIdHtml(sx) : '<span class="num">' + esc(r[0]) + '</span>' ].concat(r.slice(1).map(function(c){ return esc(c || '\u2014'); }))
          .concat([pn ? '<button type="button" class="btn btn-secondary btn-sm" data-svphotos="' + esc(r[0]) + '">\u{1F4F7} ' + nm(pn) + '</button>' : '<span class="hint" style="margin:0">' + esc(t('لا صور')) + '</span>']); }))
                   + (rows.length > shown.length ? '<p class="hint">' + esc(t('يُعرض أوّلُ ٣٠٠ — والكلُّ في ملف الإكسل')) + '</p>' : '')
                   : '<p class="hint">' + esc(t('لا نقاط')) + '</p>')
    + '</div>'
    + (SV_PHO ? svPhoPanel(SV_PHO) : '');
}
var SV_PHO = '';   /* (V37.6) النقطةُ المفتوحةُ صورُها فوق القائمة */
/* ═══ (V37.16) طلبُ المالك: «البوب أب اللي بتتفتح من صفحة الوزارة لكلِّ كارت (الزيارة والمسح والتركيب والتسليم والفك) — مش عاوزها
   ليست، عاوزها داشبورد توضّح البيانات، ولما أحتاج تفاصيل أعمل إكسل». اللوحةُ تُبنى من صفوف القائمة نفسِها فلا يختلف رقم. ═══ */
var SV_DASH_KEYS = { sv:1, rem:1, srv:1, srvr:1, insd:1, insr:1, hand:1, handr:1, disd:1, disr:1 };
var SV_VIEW = 'dash';
function svDashHtml(key, rows){
  var N = (STATE.sites || []).length || 1, n = rows.length, now = Date.now(), dk = function(ms){ return dayKey(ms); };
  var cnt = function(ix, cap, split, empty){ var m = {}; rows.forEach(function(r){ var raw = String(r[ix] || '').trim(); (split && raw ? raw.split(/،\s*/) : [raw]).forEach(function(v0){ var v = String(v0 || '').trim() || (empty || '\u2014'); m[v] = (m[v] || 0) + 1; }); });
    var L = Object.keys(m).map(function(k){ return [k, m[k]]; }).sort(function(a, b){ return b[1] - a[1]; });
    if (cap && L.length > cap){ var rest = L.slice(cap).reduce(function(a, x){ return a + x[1]; }, 0); L = L.slice(0, cap).concat([[t('أخرى'), rest]]); } return L; };
  var bars = function(title, L, tot){ if (!L.length) return ''; var mx = Math.max.apply(null, L.map(function(x){ return x[1]; }));
    return '<div class="card" style="margin:0"><div class="pid">' + esc(t(title)) + '</div>' + L.map(function(x){ var w = Math.max(2, Math.round(x[1] / mx * 100));
      return '<div class="fn-row" style="display:grid;grid-template-columns:minmax(90px,38%) 1fr auto;gap:8px;align-items:center;margin:5px 0"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(t(x[0])) + '">' + esc(t(x[0])) + '</span>'
        + '<span style="background:var(--line);border-radius:6px;height:10px;position:relative;overflow:hidden"><i style="position:absolute;inset-block:0;inset-inline-start:0;width:' + w + '%;background:var(--acc,#2E86DE);border-radius:6px"></i></span>'
        + '<b class="num">' + nm(x[1]) + (tot ? ' <small class="hint" style="margin:0">' + nm(Math.round(x[1] / tot * 100)) + '\u066A</small>' : '') + '</b></div>'; }).join('') + '</div>'; };
  /* آخرُ ١٤ يومًا بتاريخ العمود السادس (آخر زيارة) */
  var days = [], byDay = {}; for (var i = 13; i >= 0; i--){ var k = dk(now - i * 864e5); days.push(k); byDay[k] = 0; }
  rows.forEach(function(r){ var d = String(r[5] || '').slice(0, 10); if (byDay[d] != null) byDay[d]++; });
  var mxd = Math.max.apply(null, days.map(function(k){ return byDay[k]; }).concat([1])), wk = days.slice(7).reduce(function(a, k){ return a + byDay[k]; }, 0), today = byDay[days[13]] || 0;
  var trend = days.some(function(k){ return byDay[k]; }) ? '<div class="card" style="margin:0"><div class="pid">' + esc(t('آخر ١٤ يومًا')) + '</div><div style="display:flex;align-items:flex-end;gap:4px;height:90px">'
    + days.map(function(k){ var h = Math.round(byDay[k] / mxd * 80); return '<div title="' + esc(k) + ' \u00b7 ' + nm(byDay[k]) + '" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end"><small class="num" style="font-size:10px">' + (byDay[k] ? nm(byDay[k]) : '') + '</small><i style="display:block;width:100%;height:' + Math.max(byDay[k] ? 3 : 1, h) + 'px;background:var(--acc,#2E86DE);border-radius:3px 3px 0 0;opacity:' + (byDay[k] ? 1 : .25) + '"></i></div>'; }).join('')
    + '</div></div>' : '';
  var tile = function(v, l){ return '<div class="card" style="margin:0;text-align:center"><div class="num" style="font-size:26px;font-weight:700">' + v + '</div><div class="hint" style="margin:0">' + esc(t(l)) + '</div></div>'; };
  var tiles = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:10px 0">' + tile(nm(n), 'العدد') + tile(nm(Math.round(n / N * 100)) + '\u066A', 'من كلِّ النقاط')
    + (trend ? tile(nm(wk), 'آخر ٧ أيام') + tile(nm(today), 'اليوم') : '') + '</div>';
  var st = cnt(7, 8, true).filter(function(x){ return x[0] !== '\u2014'; });   /* كلُّ فئةٍ وحدَها لا تراكيبُها */
  return tiles + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px">'
    + bars('حسب المشعر', cnt(2), n) + bars('حسب النوع', cnt(3, 8), n) + trend + bars('حسب الشركة', cnt(4, 8, false, t('بلا شركة — غير المخيمات')), n)
    + (/^(sv|srv|insd|hand|disd)$/.test(key) ? bars('حسب المنفّذ', cnt(6, 8), n) : '') + (st.length > 1 ? bars('الحالة والتحديات', st, n) : '') + '</div>';
}
function svPhoPanel(id){ var px = siteFind(id);
        return '<div id="svPhoVeil" data-svphoclose="1" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2002"></div>'
          + '<div id="svPhoBox" class="svpop" role="dialog" aria-modal="true" data-keepscroll="svpho" style="position:fixed;z-index:2003;inset:4vh 3vw auto 3vw;max-height:92vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.45)">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">\u{1F4F7} ' + (px ? siteIdHtml(px) + ' <span class="hint" style="margin:0">' + esc(px.name || '') + '</span>' : esc(id)) + '</h3>'
          + btn('\u2715 ' + t('رجوع للقائمة'), 'btn-quiet btn-sm', ' data-svphoclose="1"') + '</div>'
          + (px && STATE.recs[px.id] ? '<p class="hint" style="margin:6px 0 0">' + esc(svStateText(STATE.recs[px.id])) + '</p>' : '')
          + (photosOf(id).length ? '' : '<p class="hint">' + esc(photosMissingLine(id, STATE.recs[id])) + '</p>') + photoGalleryHtml(id) + '</div>'; }
function svListXlsx(key){
  var L = SV_LISTS[key] || svDynList(key) || (MFU.lists[key] ? [MFU.lists[key].title] : null) || (svObKey(key) || /^al_/.test(key) ? [svListTitle(key)] : null); if (!L) return false;   /* (V37.4) والديناميكية */
  toast(t('يُجهَّز ملفُّ إكسل…'));
  return xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة')); return false; }
    var body = svListRows(key), pts = body.length && siteFind(body[0][0]);   /* (V35.0) قوائمُ النقاط: عمودٌ أوّلُ بالمعرّف الأوّل */
    var rows = [(pts ? [t('رقم الشاخص / الاسم')] : []).concat(svListHead(key).map(function(h){ return t(h); }))].concat(body.map(function(r){ var sx = pts && siteFind(r[0]); return pts ? [sx ? siteKey(sx) : r[0]].concat(r) : r; })), iss = [];
    rows.forEach(function(r, i){ r.forEach(function(c){ var b = expBadText(c); if (b) iss.push(t('الصفّ') + ' ' + (i + 1) + ': ' + b); }); });   /* فحصُ الملف قبل نزوله */
    if (!expGate('إكسل', iss)) return false;
    var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = rows[0].map(function(_, i){ var wd = 10; rows.forEach(function(r){ wd = Math.max(wd, Math.min(50, String(r[i] == null ? '' : r[i]).length + 2)); }); return { wch:wd }; });
    wb.Workbook = { Views:[{ RTL:true }] }; XLSX.utils.book_append_sheet(wb, ws, t(L[0]).replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 30));
    XLSX.writeFile(wb, t(L[0]).replace(/[\\\/:*?"<>|]/g, ' ') + ' — ' + dayKey() + '.xlsx');
    logEvent('تصدير قائمة — ' + L[0] + ' · ' + (rows.length - 1), ''); toast(t('نزل الملف')); return true;
  });
}
function mfuFilterRowAll(){   /* (V29.9) فلترُ المشعر والنوع على كلِّ المواقع (لا المعوقات وحدَها) */
  var Z = {}, T = {}, all = STATE.sites || [];
  all.forEach(function(x){ var tx = taxOf(x), z = tx.g || '—'; Z[z] = (Z[z] || 0) + 1; if (!MFU.flt.z || z === MFU.flt.z){ var ty = tx.t || '—'; T[ty] = (T[ty] || 0) + 1; } });
  var chip = function(attr, v, on, label, n){ return '<button type="button" class="cat' + (on ? ' on' : '') + '" ' + attr + '="' + esc(v) + '">' + esc(label) + (n != null ? ' <span class="n">' + nm(n) + '</span>' : '') + '</button>'; };
  return '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">' + esc(t('المشعر')) + '</span>' + chip('data-mfz', '', !MFU.flt.z, t('الكل'), all.length)
    + Object.keys(Z).sort(function(a, b){ return Z[b] - Z[a]; }).map(function(z){ return chip('data-mfz', z, MFU.flt.z === z, t(z), Z[z]); }).join('') + '</div>'
    + '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">' + esc(t('النوع')) + '</span>' + chip('data-mft', '', !MFU.flt.t, t('الكل'), null)
    + Object.keys(T).sort(function(a, b){ return T[b] - T[a]; }).map(function(ty){ return chip('data-mft', ty, MFU.flt.t === ty, t(ty), T[ty]); }).join('') + '</div>';
}
function mfuSurv(){
  var all = STATE.sites;   /* (V29.9) الصفحةُ كلُّها تتبع الفلتر: الأرقامُ والجداولُ والقوائمُ والجمرات */
  if (MFU.flt.z || MFU.flt.t) STATE.sites = all.filter(function(x){ var tx = taxOf(x); return (!MFU.flt.z || tx.g === MFU.flt.z) && (!MFU.flt.t || tx.t === MFU.flt.t); });
  try { return mfuFilterRowAll() + mfuSurv0(); } finally { STATE.sites = all; }
}
function mfuSurv0(){
  var SV = svStats(), o = SV.O, JM = jmrConfirm(), jt = JM.tot;
  var kpi = function(l, v, col, key){ return '<div class="mfu-kpi"' + (key ? ' data-svlist="' + key + '" role="button" tabindex="0" style="cursor:pointer" title="' + esc(t('اضغط للقائمة والتصدير')) + '"' : '') + '><div class="mfu-kpi-l">' + esc(t(l)) + (key ? ' \u203A' : '') + '</div><div class="mfu-kpi-v"' + (col ? ' style="color:' + col + '"' : '') + '>' + v + '</div></div>'; };
  var tb = function(head, rows){ return table(head, rows.map(function(r){ return r.map(function(c){ return esc(String(c == null ? '' : c)); }); })); };   /* جدولُ التطبيق نفسُه */
  var nCampOk = svListRows('campok').length, nNoPh = svListRows('nophoto').length;   /* (V29.6) */
  return '<div class="mfu-kpis">' + kpi('نسبة المسح', nm(SV.pct) + '\u066A') + kpi('تمت الزيارة', nm(o.sv), '#27AE60', 'sv') + kpi('المتبقي', nm(o.tot - o.sv), '#B7950B', 'rem') + kpi('فيها تحديات', nm(o.chal), '#C0392B', 'chal') + kpi('تحتاج زيارة أخرى', nm(o.unreach), '#C0392B', 'unreach') + '</div>'
    + '<div class="mfu-kpis">' + kpi('مخيمات بلا تحديات', nm(nCampOk), '#1E8449', 'campok') + kpi('زيارات بلا صور', nm(nNoPh), nNoPh ? '#C0392B' : '#1E8449', 'nophoto') + (function(){ var nb = svListRows('badphoto').length; return kpi('صور تحتاج إعادة', nm(nb), nb ? '#C0392B' : '#1E8449', 'badphoto'); })() + '</div>'   /* (V30.6) */
    + '<p class="hint" style="margin:0 0 8px">' + esc(t('اضغط أيَّ بطاقةٍ عليها «›» لقائمة نقاطها بالمشعر والنوع وتصديرها إكسل.')) + '</p>'
    + (svListPop() + supPopHtml())
    + card(t('حسب المشعر'), tb(['المشعر', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'تحديات · تعذّر'], SV.zones.map(function(r){ return [t(r[0]), r[1], r[2], r[3], r[4], r[5] + ' \u00b7 ' + r[6]]; })))   /* ستةُ أعمدةٍ تُقرأ على الجوال */
    + card(t('المشعر والنوع'), tb(['المشعر · النوع', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'التحديات وأبرزها'], SV.detail.map(function(r){ return [t(r[0]) + ' \u00b7 ' + t(r[1]), r[2], r[3], r[4], r[5], r[6] ? r[6] + ' \u00b7 ' + r[7] : '0']; })))   /* ستةُ أعمدة */
    + card(t('منشأة الجمرات — تأكيد النقاط بالمسح') + ' \u2014 ' + nm(jt.ok) + ' / ' + nm(jt.n), '<p class="hint" style="margin:0 0 8px">' + esc(t('النقطةُ مؤكَّدةٌ إذا تمت زيارتُها. ما لم يُزر يحتاج زيارة، وبعضُ ما زير تحتاج زيارةً أخرى تقنيًا.')) + '</p>' + tb(['الدور', 'النقاط', 'مؤكَّدة (بتحديات)', 'لم تُزر', 'تحتاج زيارة أخرى', 'نسبة التأكيد'], JM.rows.map(function(r){ return [t(r[0]), r[1], r[2] + ' (' + r[5] + ')', r[4], r[3], r[6]]; })));   /* ستةُ أعمدة */
}
function mfuCos(){
  var C = mfuCompanies(), n = 0, ins = 0, obs = 0, sv = 0, ch = 0; C.forEach(function(c){ n += c.n; ins += c.ins; obs += c.obs; sv += c.sv; ch += c.chal; });
  var surv = !ins;   /* (V29.1) قرارُ المالك: «لسه ما بدأناش التواصل معاهم أو التركيب — فتصنيفُهم مش واقعي». في المسح: نسبةُ المسح والتحديات لا مستوى التركيب */
  var tp = n ? Math.round((surv ? sv : ins) / n * 100) : 0;
  var kpi = function(l, v, col){ return '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t(l)) + '</div><div class="mfu-kpi-v"' + (col ? ' style="color:' + col + '"' : '') + '>' + v + '</div></div>'; };
  return '<div class="mfu-kpis">'
    + (surv
      ? kpi('نسبة مسح المخيمات', nm(tp) + '\u066A') + kpi('تم مسحها', nm(sv), '#27AE60') + kpi('المتبقي للمسح', nm(n - sv), '#B7950B') + kpi('فيها تحديات', nm(ch), '#C0392B') + kpi('المخيمات', nm(n))
      : kpi('نسبة الإنجاز الكلية', nm(tp) + '\u066A') + kpi('التركيب', nm(ins), '#27AE60') + kpi('عوائق', nm(obs), '#C0392B') + kpi('المتبقي', nm(n - ins - obs), '#B7950B') + kpi('المخيمات', nm(n)))
    + '</div>'
    + (surv ? alertBox('info', t('المرحلة الحالية: المسح الميداني — التواصلُ مع الشركات والتركيبُ لم يبدآ بعد، فلا تصنيفَ لها بالتركيب. تُرتَّب بالأقلِّ مسحًا.')) : '')
    + '<p class="hint">' + esc(t(surv ? 'نسبةُ كلِّ شركة = مخيماتُها التي تمت زيارتُها ÷ مخيماتُها' : 'دليل نسبة الإنجاز: ممتاز ٧٥٪ فأكثر · متوسط ٤٠–٧٤٪ · ضعيف أقل من ٤٠٪')) + ' \u00b7 ' + esc(t(MFU.cosAll ? 'كلُّ الشركات' : 'الأضعفُ أوّلًا')) + ' '
    + btn(MFU.cosAll ? t('الأضعفُ فقط') : t('اعرض الكل') + ' (' + nm(C.length) + ')', 'btn-quiet btn-sm', ' data-mfucosall="1"') + '</p>'
    + '<div class="mfu-cos">' + (MFU.cosAll ? C : C.slice().sort(function(a, b){ return (surv ? a.svp - b.svp : a.pct - b.pct) || b.n - a.n; }).slice(0, 12)).map(function(c){
        var p = surv ? c.svp : c.pct, L = surv ? [p >= 75 ? 'مسحٌ متقدّم' : p > 0 ? 'مسحٌ جارٍ' : 'لم يبدأ المسح', p >= 75 ? 'ok' : p > 0 ? 'wrn' : 'off'] : mfuLevel(c.pct);
        return '<div class="mfu-co mfu-' + L[1] + '"><div class="mfu-co-h"><b>' + esc(c.co) + '</b>' + pill(t(L[0]), L[1]) + '</div>'
          + (coLiaisonOf(c.co) ? '<div class="hint" style="margin:2px 0 4px">' + esc(t('ضابط الاتصال')) + ': <b>' + esc(coLiaisonOf(c.co)) + '</b></div>' : '')
          + mfuBar(p) + '<div class="mfu-co-n">'
          + (surv
            ? '<span>' + esc(t('المخيمات')) + ' <b>' + nm(c.n) + '</b></span><span>' + esc(t('تم مسحها')) + ' <b>' + nm(c.sv) + '</b></span><span>' + esc(t('المتبقي')) + ' <b>' + nm(c.n - c.sv) + '</b></span><span>' + esc(t('تحديات')) + ' <b>' + nm(c.chal) + '</b></span>'
            : '<span>' + esc(t('المستهدف')) + ' <b>' + nm(c.n) + '</b></span><span>' + esc(t('المنجز')) + ' <b>' + nm(c.ins) + '</b></span><span>' + esc(t('المتبقي')) + ' <b>' + nm(c.rem) + '</b></span><span>' + esc(t('متعثر')) + ' <b>' + nm(c.obs) + '</b></span>')
          + '</div></div>';
      }).join('') + '</div>';
}
/* (V26.5) فلترُ المشعر والنوع على التحديات والمعوقات — قرارُ المالك: «منى – مخيمات – العائق – العدد – المعالجة – المسؤول».
   الصفحتان («بيان المعوقات» و«التحديات وآليات المعالجة») كانتا من مصدرٍ واحد فدُمجتا في صفحةٍ واحدة. */
MFU.flt = { z:'', t:'' };
/* (V27.3) بلاغُ المالك: التصديرُ من صفحة التحديات والمعوقات لم يكن يتبع الفلتر — التحديثُ الأسبوعيُّ (إكسل/وورد/بوربوينت/PDF)
   كان يقرأ المعوقاتِ كلَّها. صار يقرأ المرشَّحَ حين يُوضَع فلتر، ويكتب الفلترَ في سطر التاريخ واسم الملف والبطاقة؛ وبلا فلتر: الكلّ. */
function mfuFltLabel(){ return [MFU.flt.z || '', MFU.flt.t || ''].filter(Boolean).join(' \u00b7 '); }
function mfuObstaclesF(){ var O = mfuObstacles(); if (!MFU.flt.z && !MFU.flt.t) return O; return O.filter(function(o){ var tx = taxOf(o.x); return (!MFU.flt.z || tx.g === MFU.flt.z) && (!MFU.flt.t || tx.t === MFU.flt.t); }); }   /* (V27.2) تصنيفُ المالك */
function mfuFilterRow(){
  var O = mfuObstacles(), Z = {}, T = {};
  if (!O.length) return '';   /* لا معوقاتٍ فلا فلتر */
  O.forEach(function(o){ var tx = taxOf(o.x), z = tx.g || '—'; Z[z] = (Z[z] || 0) + 1; if (!MFU.flt.z || z === MFU.flt.z){ var ty = tx.t || '—'; T[ty] = (T[ty] || 0) + 1; } });
  var chip = function(attr, v, on, label, n){ return '<button type="button" class="cat' + (on ? ' on' : '') + '" ' + attr + '="' + esc(v) + '">' + esc(label) + (n != null ? ' <span class="n">' + nm(n) + '</span>' : '') + '</button>'; };
  return '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">' + esc(t('المشعر')) + '</span>' + chip('data-mfz', '', !MFU.flt.z, t('الكل'), O.length)
    + Object.keys(Z).sort(function(a, b){ return Z[b] - Z[a]; }).map(function(z){ return chip('data-mfz', z, MFU.flt.z === z, t(z), Z[z]); }).join('') + '</div>'
    + '<div class="catrow"><span class="hint" style="margin:0 4px;align-self:center">' + esc(t('النوع')) + '</span>' + chip('data-mft', '', !MFU.flt.t, t('الكل'), null)
    + Object.keys(T).sort(function(a, b){ return T[b] - T[a]; }).map(function(ty){ return chip('data-mft', ty, MFU.flt.t === ty, t(ty), T[ty]); }).join('') + '</div>';
}
function mfuObs(){
  var O = mfuObstaclesF(), byParty = {}, byCat = {}, ed = may('settings');
  mfuParties().forEach(function(p){ byParty[p] = 0; });
  /* (V26.1) كانت النقطةُ ذاتُ عائقين من جهتين تُعَدّ عند الجهتين فيزيد مجموعُ الجهات على الإجمالي (٨٤٩ مقابل ٧٣٩) — صارت كلُّ نقطةٍ عند جهةٍ واحدة: جهةُ عائقها الأوّل، فيساوي المجموعُ الإجمالي */
  O.forEach(function(o){ o.cats.forEach(function(c){ byCat[c] = (byCat[c] || 0) + 1; }); var p0 = mfuOwnerOf(o.cats[0]); byParty[p0] = (byParty[p0] || 0) + 1; });
  var cats = Object.keys(byCat).sort(function(a, b){ return byCat[b] - byCat[a]; });
  var ages = O.map(function(o){ var r = STATE.recs[o.x.id]; return r && r.at ? Math.max(0, Math.round((Date.now() - r.at) / 864e5)) : null; }).filter(function(v){ return v != null; });   /* (V29.9) عمرُ المعوق منذ آخر زيارة */
  var ageMax = ages.length ? Math.max.apply(null, ages) : 0, ageAvg = ages.length ? Math.round(ages.reduce(function(a, b){ return a + b; }, 0) / ages.length) : 0, ageOld = ages.filter(function(v){ return v > 14; }).length;
  return mfuFilterRow() + ('<div class="mfu-kpis"><div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('إجمالي المعوقات')) + '</div><div class="mfu-kpi-v" style="color:#C0392B">' + nm(O.length) + '</div><div class="hint" style="margin:2px 0 0">' + esc(t('نقطةٌ لم تُركَّب وفيها عائق')) + '</div></div>'
    + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('عمر المعوق')) + '</div><div class="mfu-kpi-v">' + nm(ageAvg) + ' <span style="font-size:14px">' + esc(t('يوم')) + '</span></div><div class="hint" style="margin:2px 0 0">' + esc(t('المتوسط منذ تسجيله')) + ' \u00b7 ' + esc(t('الأقدم')) + ' ' + nm(ageMax) + ' \u00b7 ' + esc(t('أكثر من أسبوعين')) + ' ' + nm(ageOld) + '</div></div>'
    + mfuParties().map(function(p){ return '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('تُعالَج من خلال')) + ' ' + esc(t(mfuPartyLabel(p))) + '</div><div class="mfu-kpi-v">' + nm(byParty[p] || 0) + '</div><div class="hint" style="margin:2px 0 0">' + esc(t('نقطةٌ بجهة عائقها الأوّل')) + '</div></div>'; }).join('') + '</div>'
    + cardFlush(t('فئات المعوقات والجهة المعالجة'), table(['الفئة', 'العدد', 'الجهة المعالجة'], cats.map(function(c){
        var own = mfuOwnerOf(c);
        return ['<b>' + esc(chalShow(c)) + '</b>', N(byCat[c]), ed ? '<select data-mfuown="' + esc(c) + '" style="min-height:30px;font-size:12px;width:auto">' + mfuParties().map(function(p){ return '<option value="' + esc(p) + '"' + (own === p ? ' selected' : '') + '>' + esc(t(mfuPartyLabel(p))) + '</option>'; }).join('') + '</select>' : esc(t(own))];
      })))
    + '<p class="hint">' + esc(t('الجهةُ المعالجةُ لكلِّ فئةٍ يضبطها المكتبُ من هذا الجدول — والافتراضيُّ: العارضةُ وسطحُ التثبيت لكدانة، والاستدلالُ والوصولُ لأفاقي، والباقي لشركة الخدمة.')) + '</p>'
    + (ed ? '<div class="wt-row" style="gap:8px;align-items:center;margin:8px 0 0;flex-wrap:wrap"><span class="hint">' + esc(t('جهات المعالجة')) + '</span>'
      + mfuParties().map(function(k){ var lb = mfuPartyLabel(k); return MFU.prn === k
          ? '<span class="pill"><input data-mfuprn="' + esc(k) + '" value="' + esc(lb) + '" style="max-width:160px;min-height:26px" aria-label="' + esc(t('اسم الجهة')) + '"></span>'
          : '<span class="pill">' + esc(t(lb)) + ' <button type="button" class="btn btn-quiet btn-sm" data-mfupren="' + esc(k) + '" aria-label="' + esc(t('تعديل')) + '" style="padding:0 6px;min-height:22px">\u270E</button>' + (mfuParties().length > 1 ? '<button type="button" class="btn btn-quiet btn-sm" data-mfuprm="' + esc(k) + '" aria-label="' + esc(t('حذف')) + '" style="padding:0 6px;min-height:22px">\u2715</button>' : '') + '</span>'; }).join('')
      + '<input id="mfuNewParty" placeholder="' + esc(t('جهةٌ أخرى')) + '" style="max-width:180px">' + btn('+ ' + t('أضف جهة'), 'btn-quiet btn-sm', ' data-mfupadd="1"')
      + (MFU.parties.some(function(k){ var r = mfuPartyRaw(k); return r && (r.gone || r.t); }) ? btn('\u21BA ' + t('الأصلية'), 'btn-quiet btn-sm', ' data-mfuprst="1"') : '')
      + '</div>' : ''))
    + mfuChal();   /* (V26.5) سجلُّ التحديات بآلياته في الصفحة نفسِها */
}
/* ═══ التحدياتُ بمصادرها الثلاثة (V20.5) ═══
   «التحدياتُ تبان إنها جاية من المسح الميداني ونعدّلها: على مين، ومين هيحلّها،
   وآليةُ المعالجة — والمهامُّ الأسبوعيةُ مربوطة: التحدي فيها يبان ولما يتحلّ يبان».
   ١) من المسح الميداني: كلُّ فئة تحدٍّ بعدد نقاطها غيرِ المركَّبة ومشاعرها، وتُضبَط جهتُها
      (own) ومن يحلّها وآليتُها وحالتُها (fch) — وتصير «تم الحل» وحدَها حين لا تبقى نقطة.
   ٢) من المهام الأسبوعية: المتوقّفةُ تحدٍّ قائم، وما توقّف ثم استؤنف في أربعة عشر يومًا
      «تم الحل» بتاريخه.
   ٣) المسجَّلُ يدويًّا. ولكلِّ تحدٍّ مهمةُ معالجةٍ أسبوعيةٌ تُنشأ بضغطة، واكتمالُها حلُّه. */
function mfuTaskState(id){ var r = id ? wtRow(id) : null; return r ? { id:r.id, st:r.st, done:r.st === 'مكتمل' } : null; }
function mfuAllChal(){
  var out = [], F = mfuData().fch || {}, now = Date.now();
  var O = mfuObstaclesF(), by = {};   /* (V26.5) بفلتر الصفحة إن وُضع */
  O.forEach(function(o){ o.cats.forEach(function(c){ var b = by[c] = by[c] || { n:0, z:{} }; b.n++; b.z[o.x.zone] = (b.z[o.x.zone] || 0) + 1; }); });
  Object.keys(F).forEach(function(c){ if (!by[c] && F[c] && !F[c].gone) by[c] = { n:0, z:{} }; });
  Object.keys(by).sort(function(a, b){ return by[b].n - by[a].n; }).forEach(function(c){
    var f = F[c] || {}, tk = mfuTaskState(f.task), n = by[c].n;
    var st = n === 0 ? 'تم الحل' : (tk && tk.done ? 'تم الحل' : (f.st || 'مفتوح'));
    out.push({ key:'F:' + c, src:'field', t:c, n:n, z:by[c].z, party:mfuOwnerOf(c), owner:f.owner || '', m:f.m || '', desc:f.desc || '', due:f.due || '', st:st, task:f.task || '', tk:tk });   /* (V26.6) desc وdue */
  });
  wtRows().forEach(function(r){
    var log = Array.isArray(r.log) ? r.log : [], stopAt = 0, backAt = 0;
    for (var i = log.length - 1; i >= 0; i--){ var e = log[i]; if (!e || !e.st) continue; if (e.st === 'متوقف') stopAt = e.at || 0; else if (stopAt && (e.at || 0) > stopAt) backAt = e.at || 0; }
    var why = (log.filter(function(e){ return e && e.note; })[0] || {}).note || r.upd || '';
    if (r.st === 'متوقف') out.push({ key:'T:' + r.id, src:'task', t:r.n, why:why, party:'', owner:r.who || '', m:'', st:'مفتوح', task:r.id, tk:mfuTaskState(r.id) });
    else if (stopAt && backAt && now - backAt < 14 * 864e5) out.push({ key:'T:' + r.id, src:'task', t:r.n, why:why, party:'', owner:r.who || '', m:'', st:'تم الحل', at:backAt, task:r.id, tk:mfuTaskState(r.id) });
  });
  mfuList('chal').forEach(function(x){
    var tk = mfuTaskState(x.task);
    out.push({ key:'M:' + x.id, id:x.id, src:'manual', t:x.t || '', r:x.r || '', party:x.party || '', owner:x.o || '', m:x.m || '', desc:x.desc || '', due:x.due || '', st:tk && tk.done && x.st !== 'مغلق' ? 'تم الحل' : (x.st || 'مفتوح'), task:x.task || '', tk:tk });
  });
  return out;
}
/* ═══ كلُّ شيءٍ مربوطٌ ويُسمَع في التقرير (V20.6) ═══
   «مش التحديات بس — أيُّ تحديثٍ أو طلبٍ أو متابعةٍ لمهمة كلُّه مربوطٌ ببعضه ويُسمَع
   في التقرير؛ لأن كلَّ ده تخطيطُ المشروع الحالي». فصار:
   • للطلب مهمةُ تنفيذٍ أسبوعيةٌ تُنشأ بضغطة؛ آخرُ ملاحظةٍ في المهمة إفادةُ الطلب إن كانت
     أحدث، واكتمالُها إنجازُه، وتوقّفُها تحدٍّ قائم.
   • لكلِّ تحدٍّ وطلبٍ سجلٌّ قصير (hist) بما تغيّر ومن غيّره ومتى — لا آخرُ قيمةٍ فقط.
   • «آخر التحديثات» سجلٌّ واحدٌ يجمع سجلَّات المهام والتحديات والطلبات — في الملخّص
     وفي التقرير بكلِّ صيغه. */
function mfuHist(x, f, v){ return [{ at:Date.now(), by:STATE.meta.name || '', f:f, v:String(v == null ? '' : v).slice(0, 200) }].concat(Array.isArray(x && x.hist) ? x.hist : []).slice(0, 12); }
function mfuTaskNote(id){ var r = id ? wtRow(id) : null; if (!r) return null; var e = (Array.isArray(r.log) ? r.log : []).filter(function(x){ return x && x.note && x.note !== 'أُنشئت'; })[0]; return e ? { at:e.at || 0, note:e.note, by:e.by || '', id:r.id } : null; }
function mfuReqView(x){
  var tk = mfuTaskState(x.task), tn = mfuTaskNote(x.task);
  var uAt = (Array.isArray(x.hist) ? (x.hist.filter(function(h){ return h.f === 'u' || h.f === 'new'; })[0] || {}).at : 0) || x.at || 0;
  var fromTask = tn && tn.at > uAt;
  return { u:fromTask ? tn.note : (x.u || ''), uSrc:fromTask ? tn.id : 0, st:tk && tk.done ? 'منجز' : (x.st || 'جديد'), tk:tk, blocked:!!(tk && tk.st === 'متوقف') };
}
MFU.f = { 'new':'أُنشئ', owner:'من سيحلّه', m:'آلية المعالجة', st:'الحالة', party:'على مين', u:'إفادة', task:'رُبط بمهمة', o:'المسؤول' };
function mfuTimeline(days, lim){
  var since = Date.now() - (days || 7) * 864e5, out = [];
  wtRows().forEach(function(r){
    var ctx = r.chal ? ' \u2190 ' + t('تحدٍّ') : r.req ? ' \u2190 ' + t('طلب الوزارة') : '';
    (Array.isArray(r.log) ? r.log : []).forEach(function(e){ if (!e || (e.at || 0) < since) return;
      out.push({ at:e.at, by:e.by || '', k:'مهمة', ref:'#' + r.id + ' ' + r.n + ctx, txt:e.st ? t('الحالة') + ': ' + t(e.st) : e.f ? wtFieldTxt(e) : (e.note === 'أُنشئت' ? t('أُنشئت') : e.note) }); });
  });
  var fch = mfuData().fch || {};
  Object.keys(fch).forEach(function(c){ (fch[c].hist || []).forEach(function(h){ if ((h.at || 0) < since) return; out.push({ at:h.at, by:h.by || '', k:'تحدّي مسح', ref:c, txt:t(MFU.f[h.f] || h.f) + (h.v ? ': ' + h.v : '') }); }); });
  mfuList('chal').forEach(function(x){ (x.hist || []).forEach(function(h){ if ((h.at || 0) < since) return; out.push({ at:h.at, by:h.by || '', k:'تحدٍّ', ref:x.t || '', txt:t(MFU.f[h.f] || h.f) + (h.v ? ': ' + h.v : '') }); }); });
  mfuList('req').forEach(function(x){ (x.hist || []).forEach(function(h){ if ((h.at || 0) < since) return; out.push({ at:h.at, by:h.by || '', k:'طلب الوزارة', ref:x.t || '', txt:t(MFU.f[h.f] || h.f) + (h.v ? ': ' + h.v : '') }); }); });
  return out.sort(function(a, b){ return b.at - a.at; }).slice(0, lim || 40);
}
/* ═══ المهامُّ الأسبوعيةُ تُسمَع في متابعة الوزارة (V20.7) ═══
   بعد دراسة أفعال المهام: الإضافةُ والحالةُ والملاحظةُ كانت تُسمَع، أمّا تأجيلُ الموعد
   وتغييرُ المسؤول والحذفُ فكانت صامتة، ولم تكن الوزارةُ ترى ما يراه عرضُها الأسبوعيُّ
   لكلِّ مسار: «أبرز الأعمال المنجزة» و«أبرز المهام القادمة» و«الاعتمادات المطلوبة». صار:
   التعديلُ يُسجَّل بقيمتيه، والحذفُ يُكتَب على ما رُبطت به المهمةُ ويفكّ الربط، والكتلُ
   الأربعُ تُقرأ من المهام، واجتماعُ الأسبوع مرجعُ «ما تغيّر منذ آخر اجتماع». */
function mfuTaskGone(r){
  if (!r || (!r.chal && !r.req)) return;
  var k = String(r.chal || r.req), tag = '#' + r.id + ' ' + t('حُذفت');
  if (/^F:/.test(k)){ var c = k.slice(2), f = Object.assign({}, (mfuData().fch || {})[c] || {}); if (String(f.task) === String(r.id)){ f.task = ''; f.hist = mfuHist(f, 'task', tag); f.at = Date.now(); mfuPut('fch', c, f); } }
  else if (/^M:/.test(k) || /^R:/.test(k)){ var sec = /^M:/.test(k) ? 'chal' : 'req', id = k.slice(2), x = mfuList(sec).filter(function(y){ return y.id === id; })[0];
    if (x && String(x.task) === String(r.id)){ var nx = Object.assign({}, x); delete nx.id; nx.task = ''; nx.hist = mfuHist(x, 'task', tag); nx.at = Date.now(); mfuPut(sec, id, nx); } }
}
function mfuDoneAt(r){ var at = r.doneAt || 0; if (!at && Array.isArray(r.log)) r.log.forEach(function(e){ if (!at && e.st === 'مكتمل') at = e.at; }); return at; }
function mfuWeekBlocks(){
  var now = Date.now(), W = wtRows();
  var done = W.filter(function(r){ return r.st === 'مكتمل' && now - mfuDoneAt(r) < 7 * 864e5; }).sort(function(a, b){ return mfuDoneAt(b) - mfuDoneAt(a); });
  var doneLast = W.filter(function(r){ var a = r.st === 'مكتمل' ? mfuDoneAt(r) : 0; return a && now - a >= 7 * 864e5 && now - a < 14 * 864e5; }).length;
  var next = W.filter(function(r){ if (r.st === 'مكتمل') return false; var d = wtDue(r); return (d != null && d >= 0 && d <= 7) || (d == null && r.st === 'جاري العمل'); }).sort(function(a, b){ return String(a.due || '9').localeCompare(String(b.due || '9')); });
  var late = W.filter(function(r){ return wtLate(r); }).sort(function(a, b){ return wtDue(a) - wtDue(b); });
  var wait = W.filter(function(r){ return r.st === 'قيد الانتظار' || r.st === 'متوقف'; });
  var support = mfuList('req').filter(function(x){ return x.s && mfuReqView(x).st !== 'منجز'; });
  var W0 = STATE.wtask || {}, meet = W0.meetAt ? { at:W0.meetAt, by:W0.meetBy || '', n:wtSince().items.length } : null;
  return { done:done, doneLast:doneLast, next:next, late:late, wait:wait, support:support, stop:W.filter(function(r){ return r.st === 'متوقف'; }).length, meet:meet };
}
function mfuBlocksCard(){
  var B = mfuWeekBlocks();
  var li = function(txt, sub, c){ return '<li style="margin:0 0 6px"><b style="color:' + (c || 'inherit') + '">' + esc(txt) + '</b>' + (sub ? '<div class="hint" style="margin:1px 0 0">' + esc(sub) + '</div>' : '') + '</li>'; };
  var col = function(title, color, items){ return '<div class="mfu-blk"><div class="mfu-blk-h" style="background:' + color + '">' + esc(t(title)) + ' \u00b7 ' + nm(items.length) + '</div><ul>' + (items.length ? items.join('') : '<li class="hint">\u2014</li>') + '</ul></div>'; };
  var dl = B.done.length - B.doneLast;
  return '<div class="mfu-kpis">'
    + '<div class="mfu-kpi" data-svlist="wdone" role="button" tabindex="0" style="cursor:pointer"><div class="mfu-kpi-l">' + esc(t('أُنجز هذا الأسبوع')) + ' \u203A</div><div class="mfu-kpi-v" style="color:#27AE60">' + nm(B.done.length) + '</div><div style="font-size:12px;font-weight:700;color:' + (dl >= 0 ? '#27AE60' : '#C0392B') + '">' + (dl > 0 ? '\u25B2 +' : dl < 0 ? '\u25BC ' : '') + nm(dl) + ' ' + esc(t('عن الأسبوع الماضي')) + '</div></div>'
    + '<div class="mfu-kpi" data-svlist="wnext" role="button" tabindex="0" style="cursor:pointer"><div class="mfu-kpi-l">' + esc(t('مستحقٌّ خلال ٧ أيام')) + ' \u203A</div><div class="mfu-kpi-v">' + nm(B.next.length) + '</div></div>'
    + '<div class="mfu-kpi" data-svlist="wlate" role="button" tabindex="0" style="cursor:pointer"><div class="mfu-kpi-l">' + esc(t('متأخرة')) + ' \u203A</div><div class="mfu-kpi-v" style="color:#C0392B">' + nm(B.late.length) + '</div></div>'
    + '<div class="mfu-kpi" data-svlist="wwait" role="button" tabindex="0" style="cursor:pointer"><div class="mfu-kpi-l">' + esc(t('متوقفة أو بانتظار قرار')) + ' \u203A</div><div class="mfu-kpi-v" style="color:#E2B33C">' + nm(B.wait.length) + '</div></div>'
    + (B.meet ? '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('آخر اجتماع')) + '</div><div class="mfu-kpi-v" style="font-size:18px">' + esc(fmtDate(B.meet.at)) + '</div><div class="hint" style="margin:2px 0 0">' + esc(dispName(B.meet.by)) + ' \u00b7 ' + nm(B.meet.n) + ' ' + esc(t('تغييرًا منذه')) + '</div></div>' : '')
    + '</div><div class="mfu-blks">'
    + col('أبرز الأعمال المنجزة', '#27AE60', B.done.slice(0, 8).map(function(r){ return li(r.n, (r.who ? r.who + ' \u00b7 ' : '') + fmtDate(mfuDoneAt(r))); }))
    + col('أبرز المهام القادمة', '#C8943E', B.next.slice(0, 8).map(function(r){ return li(r.n, (r.who || t('بلا مسؤول')) + (r.due ? ' \u00b7 ' + r.due : '')); }))
    + col('الاعتمادات والدعم المطلوب', '#1C3674', B.wait.slice(0, 5).map(function(r){ return li(r.n, t(r.st) + (r.who ? ' \u00b7 ' + r.who : '')); }).concat(B.support.slice(0, 4).map(function(x){ return li(x.s, t('طلب الوزارة') + ': ' + String(x.t || '').slice(0, 60)); })))
    + col('المهام المتأخرة', '#C0392B', B.late.slice(0, 8).map(function(r){ return li(r.n, (r.who || t('بلا مسؤول')) + ' \u00b7 ' + t('تأخّر') + ' ' + nm(-wtDue(r)) + ' ' + t('يوم'), '#C0392B'); }))
    + '</div>';
}
/* الجديدُ منذ آخر زيارةٍ لمتابعة الوزارة — على هذا الجهاز */
function mfuUnseen(){ var seen = +lsGet('nsk14.mfuSeen') || 0; return mfuTimeline(14, 200).filter(function(e){ return e.at > seen; }).length; }
/* ═══ نضجُ المتابعة (V20.9) ═══
   ما تسأله الوزارةُ بعد الأرقام: منذ متى هذا مفتوح؟ ومن عليه أكثرُ الأحمال؟ وأين كنّا
   الأسبوعَ الماضيَ والذي قبله؟ وماذا ينتظر قرارَنا نحن؟ — أعمارُ المفتوح بإنذارٍ بعد أربعة
   عشر يومًا، وحملُ كلِّ مسؤول، ومسارُ الأسابيع من اللقطات، وما ينتظر الوزارةَ نفسَها. */
function mfuAgeDays(at){ return at ? Math.floor((Date.now() - at) / 864e5) : 0; }
function mfuAgePill(at, closed){ if (closed || !at) return ''; var dd = mfuAgeDays(at); return dd >= 14 ? pill(t('مفتوحٌ منذ') + ' ' + nm(dd) + ' ' + t('يوم'), 'bad') : dd >= 7 ? pill(nm(dd) + ' ' + t('يوم'), 'wrn') : ''; }
function mfuOpenedAt(x){ var h = Array.isArray(x.hist) ? x.hist.filter(function(e){ return e.f === 'new'; })[0] : null; return (h && h.at) || x.at || 0; }
function mfuOwnersLoad(){
  var by = {};
  var add = function(n, k){ n = String(n || '').trim(); if (!n) return; var o = by[n] = by[n] || { chal:0, task:0, late:0 }; o[k]++; };
  mfuAllChal().forEach(function(c){ if (!mfuChalClosed(c) && c.owner) add(c.owner, 'chal'); });
  wtRows().forEach(function(r){ if (r.st === 'مكتمل') return; add(r.who, 'task'); if (wtLate(r)) add(r.who, 'late'); });
  return Object.keys(by).map(function(n){ var o = by[n]; o.n = n; o.all = o.chal + o.task; return o; }).sort(function(a, b){ return b.late - a.late || b.all - a.all; });
}
function mfuOwnersCard(){
  var L = mfuOwnersLoad().slice(0, 8); if (!L.length) return '';
  return cardFlush(t('الحملُ على المسؤولين'), table(['المسؤول', 'تحدياتٌ مفتوحة', 'مهامٌّ مفتوحة', 'متأخرة'], L.map(function(o){ return ['<b>' + esc(dispName(o.n)) + '</b>', N(o.chal), N(o.task), o.late ? '<b class="num" style="color:#C0392B">' + nm(o.late) + '</b>' : N(0)]; })));
}
function mfuWeeksCard(){
  var snap = mfuData().snap || {}, keys = Object.keys(snap).sort().slice(-8); if (keys.length < 2) return '';
  return cardFlush(t('مسارُ الأسابيع'), table(['الأسبوع', 'تمت الزيارة', 'تركيب المخيمات', 'تركيب الممرات', 'المعوقات'], keys.map(function(k, i){
    var v = snap[k], p = i ? snap[keys[i - 1]] : null, dv = function(f){ return p && p[f] != null ? ' <span class="hint" style="margin:0">(' + (v[f] - p[f] >= 0 ? '+' : '') + nm(v[f] - p[f]) + ')</span>' : ''; };
    return ['<span class="num">' + esc(k) + '</span>', N(v.sv || 0) + dv('sv'), N(v.campIns || 0) + dv('campIns'), N(v.corIns || 0) + dv('corIns'), N(v.obs || 0) + dv('obs')];
  })));
}
function mfuMinWait(){ var n = 0; (STATE.sites || []).forEach(function(x){ if (lifeOf(x) === 'minwait') n++; }); return n; }
function mfuTimelineCard(){
  var W0 = STATE.wtask || {}, sinceMeet = W0.meetAt && Date.now() - W0.meetAt < 14 * 864e5;
  var L = mfuTimeline(sinceMeet ? Math.max(1, (Date.now() - W0.meetAt) / 864e5) : 7, 12), seen = +lsGet('nsk14.mfuSeen') || 0;
  if (CUR === 'mfu' && tabCur('mfu') === 'mfu') setTimeout(function(){ lsSet('nsk14.mfuSeen', String(Date.now())); }, 1500);   /* رآها */
  return cardFlush((sinceMeet ? t('ما تغيّر منذ آخر اجتماع') + ' (' + fmtDate(W0.meetAt) + ')' : t('آخر التحديثات — هذا الأسبوع')) + ' \u2014 ' + nm(L.length), L.length ? table(['متى', 'النوع', 'البند', 'التحديث', 'بواسطة'], L.map(function(e){
    return ['<span class="num">' + esc(fmtDate(e.at)) + '</span>' + (e.at > seen ? ' ' + pill(t('جديد'), 'ok') : ''), pill(t(e.k), e.k === 'مهمة' ? '' : e.k === 'طلب الوزارة' ? 'ok' : 'wrn'), esc(String(e.ref).slice(0, 60)), esc(String(e.txt).slice(0, 90)), esc(dispName(e.by))];
  })) : '<p class="hint" style="margin:10px 14px">' + esc(t('لا تحديثاتٍ في سبعة أيام.')) + '</p>');
}
MFU.src = { field:['من المسح الميداني', '#1C3674'], task:['من المهام الأسبوعية', '#86432B'], manual:['مسجّلٌ يدويًّا', '#7F8C8D'] };
function mfuChalClosed(c){ return c.st === 'تم الحل' || c.st === 'مغلق'; }
function mfuChal(){
  var A = mfuAllChal(), ed = may('settings'), ST = ['مفتوح', 'قيد المعالجة', 'مغلق'];
  /* تحدّي المسح يُحفَظ أوّلَ ما يُرى — فيبقى في القائمة «تم الحل» بعد أن تُركَّب نقاطُه
     لا يختفي كأنه لم يكن (على القاعدة الحقيقية، دفعةً واحدة) */
  if (ed && FB.ready && FB.db){ var F0 = mfuData().fch || {}, nw = {}; A.forEach(function(c){ if (c.src === 'field' && !F0[c.t]) nw[c.t] = { seen:Date.now() }; });
    if (Object.keys(nw).length){ MFU.v = MFU.v || {}; MFU.v.fch = Object.assign(MFU.v.fch || {}, nw); STATE.mfu = MFU.v; CORE.set('cfg', 'mfu', { fch:nw }); } }
  var openN = A.filter(function(c){ return !mfuChalClosed(c); }).length;
  var sel = function(attr, cur, opts){ return '<select ' + attr + ' style="min-height:30px;font-size:12px;width:auto">' + opts.map(function(v){ return '<option value="' + esc(v) + '"' + (cur === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join('') + '</select>'; };
  var rows = A.map(function(c){
    var S0 = MFU.src[c.src], done = mfuChalClosed(c);
    var what = '<b>' + esc(t(c.t)) + '</b>'
      + (c.src === 'field' ? '<div class="hint" style="margin:2px 0 0">' + nm(c.n) + ' ' + esc(t('نقطة')) + (Object.keys(c.z).length ? ' \u00b7 ' + Object.keys(c.z).map(function(z){ return esc(t(z)) + ' ' + nm(c.z[z]); }).join(' \u00b7 ') : '') + '</div>' : '')
      + (c.src === 'task' && c.why ? '<div class="hint" style="margin:2px 0 0">' + esc(String(c.why).slice(0, 120)) + '</div>' : '');
    var fk = c.src === 'field' ? c.t : '', edr = ed && MFU.edit === c.key;   /* الحقولُ للصفِّ المفتوح وحدَه (V21.5) — أربعون صفًّا بحقولها كانت تُثقل الهاتف */
    var party = c.src === 'field' ? (edr ? '<select data-mfuown="' + esc(fk) + '" style="min-height:30px;font-size:12px;width:auto">' + mfuParties().map(function(p){ return '<option value="' + esc(p) + '"' + (c.party === p ? ' selected' : '') + '>' + esc(t(mfuPartyLabel(p))) + '</option>'; }).join('') + '</select>' : esc(t(c.party)))
      : c.src === 'manual' ? (edr ? sel('data-mchalf="' + esc(c.id) + '|party"', c.party || 'شركة الخدمة', mfuParties()) : esc(t(c.party || '—'))) : '\u2014';
    var owner = (c.src !== 'task' && edr) ? '<input data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|owner" value="' + esc(c.owner) + '" style="min-width:110px">' : esc(c.owner || '\u2014');
    var mit = (c.src !== 'task' && edr) ? '<textarea data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|m" rows="2" style="min-width:170px">' + esc(c.m) + '</textarea>' : esc(c.m || '\u2014');
    /* (V26.6) وصفُ المعالجة وآخرُ تاريخٍ لها — يُحمَلان إلى مهمة المعالجة الأسبوعية */
    var dsc = (c.src !== 'task' && edr) ? '<textarea data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|desc" rows="2" style="min-width:170px">' + esc(c.desc || '') + '</textarea>' : esc(c.desc || '\u2014');
    var due = (c.src !== 'task' && edr) ? '<input type="date" data-' + (c.src === 'field' ? 'fch="' + esc(fk) : 'mchalf="' + esc(c.id)) + '|due" value="' + esc(c.due || '') + '" style="min-width:140px">' : (c.due ? '<span class="num' + (!done && c.due < dayKey() ? ' bad' : '') + '">' + esc(c.due) + '</span>' : '\u2014');
    if (c.src === 'field' && c.n){
      var PTS = mfuObstaclesF().filter(function(o){ return o.cats.indexOf(c.t) > -1; });
      what += '<details class="mfu-pts"><summary class="hint" style="cursor:pointer">' + esc(t('النقاط')) + ' (' + nm(PTS.length) + ')</summary><div class="hint" style="margin:4px 0 0;max-height:260px;overflow:auto">'
        + PTS.map(function(o){ var x = o.x, r = STATE.recs[x.id] || {}, nt = String(r.chal_note || r.note || '').trim(); return '<div style="padding:2px 0;border-bottom:1px solid var(--line)"><b>' + esc(x.name || x.id) + '</b>' + (x.sign ? ' \u00b7 ' + esc(t('شاخص')) + ' ' + esc(x.sign) : '') + ' <span class="num">' + esc(x.id) + '</span> \u00b7 ' + esc(t(x.zone || '')) + ' \u00b7 ' + esc(typeLabel(x.type || '')) + (r.access && r.access !== 'تم الوصول' ? ' \u00b7 ' + esc(t(r.access)) : '') + (nt ? '<div>' + esc(nt.slice(0, 160)) + '</div>' : '') + '</div>'; }).join('') + '</div></details>';
    }
    var age = c.src === 'manual' ? mfuAgePill(mfuOpenedAt(mfuList('chal').filter(function(x){ return x.id === c.id; })[0] || {}), done) : c.src === 'field' ? mfuAgePill(((mfuData().fch || {})[c.t] || {}).seen || ((mfuData().fch || {})[c.t] || {}).at, done) : '';
    var st = (age ? age + ' ' : '') + (done ? pill(t('تم الحل') + (c.at ? ' \u00b7 ' + fmtDate(c.at) : ''), 'ok')
      : (c.src === 'task' ? pill(t('متوقفة'), 'bad') : (edr ? (c.src === 'field' ? sel('data-fch="' + esc(fk) + '|st"', c.st, ST) : sel('data-mfuchalst="' + esc(c.id) + '"', c.st, ST)) : pill(t(c.st), 'wrn'))));
    var task = c.tk ? pill('#' + c.tk.id + ' \u00b7 ' + t(c.tk.st), c.tk.done ? 'ok' : (c.tk.st === 'متوقف' ? 'bad' : 'wrn'))
      : (c.src !== 'task' && !done && wtMay() ? btn('\uFF0B ' + t('مهمة معالجة'), 'btn-quiet btn-sm', ' data-chaltask="' + esc(c.key) + '"') : '\u2014');
    var upd = chalUpdBox(c.src === 'field' ? c.t : (c.src === 'manual' ? 'M:' + c.id : c.key));   /* (V27.0) */
    return ['<span class="pill" style="background:' + S0[1] + '22;color:' + S0[1] + ';border:1px solid ' + S0[1] + '55">' + esc(t(S0[0])) + '</span>', what, party, owner, mit, dsc, due, st, task, upd,
            (ed && c.src !== 'task' ? (edr ? btn('\u2713 ' + t('تم'), 'btn-secondary btn-sm', ' data-mfuedit=""') : btn('\u270E', 'btn-quiet btn-sm', ' data-mfuedit="' + esc(c.key) + '" aria-label="' + esc(t('تعديل')) + '"')) : '')
            + ((c.src === 'manual' && ed) ? btn('\u2715', 'btn-quiet btn-sm', ' data-mfudel="chal|' + esc(c.id) + '" aria-label="' + esc(t('حذف')) + '"') : '')];
  });
  var form = (ed ? card('تحدٍّ جديد', '<div class="grid2"><label>' + esc(t('التحدي')) + '<textarea id="mcT" rows="2"></textarea></label><label>' + esc(t('آلية المعالجة')) + '<textarea id="mcM" rows="2"></textarea></label></div>'
        + '<div class="grid2"><label>' + esc(t('المسؤول')) + '<input id="mcO"></label><label>' + esc(t('المسار')) + '<select id="mcR">' + ['التركيبات', 'التوريدات', 'المسح', 'المواءمة مع الشركات'].map(function(v){ return '<option value="' + esc(v) + '">' + esc(t(v)) + '</option>'; }).join('') + '</select></label></div>'
        + '<div class="actions">' + btn(t('سجّل التحدي'), 'btn-primary btn-sm', ' data-mfuchal="1"') + '</div>') : '');
  return '<div class="mfu-kpis"><div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('تحدياتٌ مفتوحة')) + '</div><div class="mfu-kpi-v" style="color:#C0392B">' + nm(openN) + '</div></div>'
    + ['field', 'task', 'manual'].map(function(k){ return '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t(MFU.src[k][0])) + '</div><div class="mfu-kpi-v">' + nm(A.filter(function(c){ return c.src === k && !mfuChalClosed(c); }).length) + '</div></div>'; }).join('')
    + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('تم الحل')) + '</div><div class="mfu-kpi-v" style="color:#27AE60">' + nm(A.length - openN) + '</div></div></div>'
    + '<div class="actions" style="margin:6px 0">' + btn('\u2B07 ' + t('تصدير نقاط التحديات') + ((MFU.flt.z || MFU.flt.t) ? ' (' + t('بالفلتر') + ')' : ''), 'btn-secondary btn-sm', ' data-xls="chalpts"') + ' <span class="hint">' + esc(t('كلُّ نقطةٍ بتحدّيها ووصفه وموقعها ومشعرها ومعالجته — بالفلتر الحالي إن وُضع')) + '</span></div>'   /* (V26.6) */
    + (A.length ? cardFlush(t('التحديات وآليات المعالجة') + ' \u2014 ' + nm(A.length), table(['المصدر', 'التحدي', 'على مين', 'من سيحلّه', 'آلية المعالجة', 'وصف المعالجة', 'آخر تاريخ', 'الحالة', 'مهمة المعالجة', 'الميدان ↔ المكتب', ''], rows)) : '<p class="hint">' + esc(t('لا تحدياتٍ مسجّلةٌ بعد.')) + '</p>')
    + '<p class="hint">' + esc(t('تحدياتُ المسح الميداني تُقرأ من النقاط غير المركَّبة وتصير «تم الحل» حين لا تبقى نقطة؛ والمهمةُ الأسبوعيةُ المتوقّفةُ تحدٍّ قائم؛ واكتمالُ مهمة المعالجة حلُّ تحدّيها.')) + '</p>'
    + (form ? '<details class="mfu-add"' + (A.length ? '' : ' open') + '><summary>\uFF0B ' + esc(t('تحدٍّ جديد')) + '</summary>' + form + '</details>' : '');
}
function mfuReq(){
  var L = mfuList('req'), ed = may('settings'), ST = ['جديد', 'قيد التنفيذ', 'منجز'];
  var form = (ed ? card('طلبٌ جديد', '<label>' + esc(t('الطلب')) + '<textarea id="mrT" rows="2"></textarea></label><div class="grid2"><label>' + esc(t('الإفادة / آخر تحديث')) + '<textarea id="mrU" rows="2"></textarea></label><label>' + esc(t('المقترح / الدعم المطلوب')) + '<textarea id="mrS" rows="2"></textarea></label></div>'
        + '<div class="actions">' + btn(t('سجّل الطلب'), 'btn-primary btn-sm', ' data-mfureq="1"') + '</div>') : '');
  return (L.length ? cardFlush(t('طلبات الوزارة') + ' \u2014 ' + nm(L.length), table(['#', 'الطلب', 'الإفادة / آخر تحديث', 'المقترح / الدعم المطلوب', 'الحالة', 'مهمة التنفيذ', ''], L.map(function(x, i){
        var V = mfuReqView(x);
        var edr = ed && MFU.edit === 'R:' + x.id;
        var up = V.uSrc ? '<div>' + esc(V.u) + '</div><div class="hint" style="margin:2px 0 0">' + esc(t('من المهمة')) + ' #' + nm(V.uSrc) + '</div>'
          : (edr ? '<textarea data-mfurequ="' + esc(x.id) + '" rows="2" style="min-width:160px">' + esc(x.u || '') + '</textarea>' : esc(x.u || '\u2014'));
        var stc = V.tk && V.tk.done ? pill(t('منجز'), 'ok') : (edr ? '<select data-mfureqst="' + esc(x.id) + '" style="min-height:30px;font-size:12px;width:auto">' + ST.map(function(v){ return '<option value="' + esc(v) + '"' + (x.st === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join('') + '</select>' : pill(t(V.st), V.st === 'منجز' ? 'ok' : 'wrn'));
        var tk = V.tk ? pill('#' + V.tk.id + ' \u00b7 ' + t(V.tk.st), V.tk.done ? 'ok' : (V.blocked ? 'bad' : 'wrn')) : (V.st !== 'منجز' && wtMay() ? btn('\uFF0B ' + t('مهمة تنفيذ'), 'btn-quiet btn-sm', ' data-reqtask="' + esc(x.id) + '"') : '\u2014');
        return [N(i + 1), '<b>' + esc(x.t || '') + '</b>' + (V.st !== 'منجز' ? '<div style="margin:3px 0 0">' + mfuAgePill(mfuOpenedAt(x), false) + '</div>' : ''), up, esc(x.s || ''), stc + (V.blocked ? ' ' + pill(t('متوقفة'), 'bad') : ''), tk,
                (ed ? (edr ? btn('\u2713 ' + t('تم'), 'btn-secondary btn-sm', ' data-mfuedit=""') : btn('\u270E', 'btn-quiet btn-sm', ' data-mfuedit="R:' + esc(x.id) + '" aria-label="' + esc(t('تعديل')) + '"')) : '')
                + (ed ? btn('\u2715', 'btn-quiet btn-sm', ' data-mfudel="req|' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"') : '')];
      }))) : '<p class="hint">' + esc(t('لا طلباتٍ مسجّلةٌ بعد.')) + '</p>')
    + (form ? '<details class="mfu-add"' + (L.length ? '' : ' open') + '><summary>\uFF0B ' + esc(t('طلبٌ جديد')) + '</summary>' + form + '</details>' : '');
}
/* ═══ ملخصُ العمل اليومي (V24.0) ═══
   كان «ملخصَ التركيبات اليومي»: منحنيَين لآخر ثلاثين يومًا وجدولَ أربعة عشر يومًا — والعملُ مسحٌ
   وتركيبٌ وفكٌّ ومعه المتعذّر. صار الأربعةَ كلَّها، وكلَّ يومٍ منذ أوّل عملٍ مسجَّل، والجدولُ صفحاتٌ
   لا تزيد على خمسة عشر سطرًا، ولكلِّ رقمٍ نسبتُه؛ وكلُّ عملٍ يُخفى ويُظهَر بضغطةٍ على اسمه،
   والمرشّحاتُ بالشهر واليوم وساعات العمل بتوقيت مكة — واليومُ الواحدُ يُعرَض ساعةً بساعة.
   الأرقامُ من diaryRows نفسِها (تعريفٌ واحد): المرشِّحُ يُمرَّر إليها ولا يُعَدُّ شيءٌ بتعريفٍ ثانٍ.
   والنسبةُ: المسحُ والتركيبُ من إجمالي النقاط (مقامُ «نسبة المسح» في الملخص)، والفكُّ من النقاط
   المركّبة، والمتعذّرُ من زيارات يومه. واليومُ يومُ غرينتش كسائر النظام — أي يومُ عملٍ يبدأ الثالثةَ
   فجرًا بمكة، فلا تنقسم ورديّةُ الليل على يومين. */
var WDY = { off:{}, pg:1, mon:'', day:'', h1:0, h2:24 };
var WDY_SER = [['sv', 'تمت الزيارة', 'var(--min-gold)'], ['ins', 'التركيب', 'var(--min-green)'], ['dis', 'الفك', 'var(--min-teal)'], ['stuck', 'المتعذر', 'var(--min-red)']];
function wdyHour(ms){ return (new Date(+ms).getUTCHours() + 3) % 24; }   /* ساعةُ مكة: +٣ بلا توقيتٍ صيفي */
function wdyHourLbl(h){ var s = (h < 10 ? '0' : '') + h + ':00'; return LANG === 'en' ? s : s.replace(/\d/g, function(c){ return nm(+c); }); }
function wdyKeep(){
  var a = +WDY.h1 || 0, b = WDY.h2 == null ? 24 : +WDY.h2;
  if (a <= 0 && b >= 24) return null;
  return function(ms){ var h = wdyHour(ms); return a < b ? (h >= a && h < b) : (h >= a || h < b); };   /* (٢٠ ← ٤) نافذةٌ تعبر منتصفَ الليل */
}
function wdyPct(n, base){
  if (!n || !(base > 0)) return '';
  var v = n / base * 100; v = v < 10 ? Math.max(0.1, Math.round(v * 10) / 10) : Math.round(v);
  return nm(v) + '\u066A';
}
function wdyDayLbl(day, o){ return fmtDate(Date.parse(day + 'T12:00:00Z'), o || { weekday:'long', day:'numeric', month:'long', timeZone:'UTC' }); }
function wdyBase(){ var S = STATE.sites || [], n = 0; S.forEach(function(x){ if (mfuInstalled(x)) n++; }); return { sv:S.length, ins:S.length, dis:n }; }
function wdyCellPct(r, k, B){ return k === 'stuck' ? wdyPct(r.stuck, r.sv) : wdyPct(r[k], B[k]); }
function wdyNice(v){ if (v <= 5) return 5; var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
function wdyHourRow(a, i, keep){
  var b = a + 36e5, day = dayKey(a);
  var x = diaryRows(function(ms){ return ms >= a && ms < b && (!keep || keep(ms)); }).filter(function(q){ return q.day === day; })[0] || {};
  return { key:String(i), lbl:wdyHourLbl((i + 3) % 24), sv:x.sv || 0, ins:x.ins || 0, dis:x.dis || 0, stuck:x.stuck || 0 };
}
function wdyChart(rows, vis, hourly, B){
  var n = rows.length; if (!n) return '';
  if (!vis.length) return '<p class="hint">' + esc(t('اختر عملا واحدا على الأقل لعرض الرسم.')) + '</p>';
  /* إحداثياتٌ من ألفٍ في ألف: الرسمُ يتمدّد بعرض البطاقة وارتفاعٍ ثابت، والخطوطُ بسُمكٍ ثابت (non-scaling-stroke)،
     والأرقامُ والتواريخُ والنقاطُ طبقاتٌ فوقه بمقاسٍ ثابت — فتُقرأ على الهاتف كما على الشاشة الكبيرة */
  var mx = 0, g = '', yl = '', dots = '', xl = '';
  rows.forEach(function(r){ vis.forEach(function(s){ if (r[s[0]] > mx) mx = r[s[0]]; }); });
  mx = wdyNice(mx);
  var X = function(i){ return n > 1 ? 20 + i * 960 / (n - 1) : 500; }, Y = function(v){ return 70 + 920 * (1 - v / mx); };
  var pc = function(v){ return (v / 10).toFixed(2) + '%'; };
  [0, 0.5, 1].forEach(function(f){ var y = Y(mx * f);
    g += '<line class="wd-grid" x1="0" x2="1000" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"></line>';
    yl += '<span class="wd-yl" style="top:' + pc(y) + '">' + nm(Math.round(mx * f)) + '</span>'; });
  var step = Math.max(1, Math.ceil(n / (hourly ? 12 : 8)));
  var li = 0;   /* على الهاتف يُكتفى بتاريخٍ بعد تاريخ فلا تتزاحم */
  rows.forEach(function(r, i){ if (i % step) return; var x = X(i) / 10, cl = (x < 6 ? 's' : x > 94 ? 'e' : '') + (li++ % 2 ? ' alt' : '');
    xl += '<span' + (cl.trim() ? ' class="' + cl.trim() + '"' : '') + ' style="left:' + x.toFixed(2) + '%">' + esc(hourly ? r.lbl : wdyDayLbl(r.key, { day:'numeric', month:'short', timeZone:'UTC' })) + '</span>'; });
  g += vis.map(function(s){ var k = s[0];
    if (n <= 62) rows.forEach(function(r, i){ if (r[k]) dots += '<i class="wd-dot" style="--c:' + s[2] + ';left:' + pc(X(i)) + ';top:' + pc(Y(r[k])) + '"></i>'; });
    return '<g class="wd-s" style="--c:' + s[2] + '"><polyline points="' + rows.map(function(r, i){ return X(i).toFixed(1) + ',' + Y(r[k]).toFixed(1); }).join(' ') + '"></polyline></g>'; }).join('');
  /* المرورُ على أيِّ يومٍ يُظهر أرقامَه ونسبَها: طبقةُ أعمدةٍ فوق الرسم، بلا شيفرةٍ تُشغَّل */
  var cw = n > 1 ? 960 / (n - 1) : 960;
  var hov = rows.map(function(r, i){
    var a = Math.max(0, X(i) - cw / 2), b = Math.min(1000, X(i) + cw / 2);
    var tip = '<b>' + esc(hourly ? wdyDayLbl(WDY.day, { day:'numeric', month:'long', timeZone:'UTC' }) + ' \u00B7 ' + r.lbl : wdyDayLbl(r.key)) + '</b>'
      + vis.map(function(s){ var p = wdyCellPct(r, s[0], B); return '<span style="--c:' + s[2] + '"><i></i>' + esc(t(s[1])) + ' <b>' + nm(r[s[0]]) + '</b>' + (p ? ' <em>' + p + '</em>' : '') + '</span>'; }).join('');
    return '<div class="wd-c ' + (X(i) > 500 ? 'wd-r' : 'wd-l') + '" style="left:' + pc(a) + ';width:' + pc(b - a) + '"><div class="wd-tip">' + tip + '</div></div>';
  }).join('');
  return '<div class="wd-chart" role="img" aria-label="' + esc(t('ملخص العمل اليومي')) + '"><div class="wd-plot"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + g + '</svg>'
    + yl + dots + '<div class="wd-hov" aria-hidden="true">' + hov + '</div></div><div class="wd-xax" aria-hidden="true">' + xl + '</div></div>';
}
function mfuDaily(){
  var keep = wdyKeep(), all = diaryRows(keep);
  if (!all.length && !keep) return '<p class="hint">' + esc(t('لا أعمالَ مسجّلةٌ بعد.')) + '</p>';
  var B = wdyBase(), months = [];
  all.forEach(function(r){ var m = r.day.slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
  months.reverse();
  if (WDY.mon && months.indexOf(WDY.mon) < 0) WDY.mon = '';
  var inMon = WDY.mon ? all.filter(function(r){ return r.day.slice(0, 7) === WDY.mon; }) : all;
  if (WDY.day && !inMon.some(function(r){ return r.day === WDY.day; })) WDY.day = '';
  var hourly = !!WDY.day, rows = [];
  if (hourly){ var d0 = Date.parse(WDY.day + 'T00:00:00Z'); for (var i = 0; i < 24; i++) rows.push(wdyHourRow(d0 + i * 36e5, i, keep)); }
  else rows = inMon.map(function(r){ return { key:r.day, lbl:r.day, sv:r.sv, ins:r.ins, dis:r.dis, stuck:r.stuck || 0 }; });
  var vis = WDY_SER.filter(function(s){ return !WDY.off[s[0]]; }), tot = { sv:0, ins:0, dis:0, stuck:0 };
  rows.forEach(function(r){ tot.sv += r.sv; tot.ins += r.ins; tot.dis += r.dis; tot.stuck += r.stuck; });
  var act = function(r){ return r.sv + r.ins + r.dis + r.stuck > 0; };
  var work = rows.filter(function(r){ return r.sv + r.ins + r.dis > 0; }), prim = vis[0] || WDY_SER[0];
  var best = work.slice().sort(function(a, b){ return b[prim[0]] - a[prim[0]]; })[0];
  var monLbl = function(m){ return fmtDate(Date.parse(m + '-15T12:00:00Z'), { month:'long', year:'numeric', timeZone:'UTC' }); };
  var opt = function(v, lb, on){ return '<option value="' + esc(v) + '"' + (on ? ' selected' : '') + '>' + esc(lb) + '</option>'; };
  var hs = []; for (var h = 0; h <= 24; h++) hs.push(h);
  var flt = '<div class="wd-flt">'
    + '<label>' + esc(t('الشهر')) + '<select id="wdyMon">' + opt('', t('كل الشهور'), !WDY.mon) + months.map(function(m){ return opt(m, monLbl(m), WDY.mon === m); }).join('') + '</select></label>'
    + '<label>' + esc(t('اليوم')) + '<select id="wdyDay">' + opt('', t('كل الأيام'), !WDY.day) + inMon.slice().reverse().map(function(r){ return opt(r.day, wdyDayLbl(r.day, { weekday:'short', day:'numeric', month:'short', timeZone:'UTC' }), WDY.day === r.day); }).join('') + '</select></label>'
    + '<label>' + esc(t('من الساعة')) + '<select id="wdyH1">' + hs.slice(0, 24).map(function(x){ return opt(String(x), wdyHourLbl(x), (+WDY.h1 || 0) === x); }).join('') + '</select></label>'
    + '<label>' + esc(t('إلى الساعة')) + '<select id="wdyH2">' + hs.slice(1).map(function(x){ return opt(String(x), wdyHourLbl(x), (WDY.h2 == null ? 24 : +WDY.h2) === x); }).join('') + '</select></label>'
    + '<span class="hint">' + esc(t('بتوقيت مكة')) + '</span>'
    + (WDY.mon || WDY.day || keep ? btn('إعادة الضبط', 'btn-quiet btn-sm', ' data-wdyreset="1"') : '') + '</div>';
  var lg = '<div class="wd-lgs">' + WDY_SER.map(function(s){ var on = !WDY.off[s[0]];
      return '<button type="button" class="wd-lg' + (on ? '' : ' off') + '" data-wdyser="' + s[0] + '" aria-pressed="' + on + '" title="' + esc(t('اضغط للإخفاء أو الإظهار')) + '" style="--c:' + s[2] + '"><i></i>' + esc(t(s[1])) + ' <b>' + nm(tot[s[0]]) + '</b></button>'; }).join('') + '</div>';
  var st = '<div class="wd-stats"><span>' + esc(t(hourly ? 'ساعات العمل' : 'أيام العمل')) + ' <b>' + nm(work.length) + '</b></span>'
    + (best ? '<span>' + esc(t(hourly ? 'أعلى ساعة' : 'أعلى يوم')) + ' <b>' + esc(hourly ? best.lbl : wdyDayLbl(best.key, { day:'numeric', month:'long', timeZone:'UTC' })) + '</b>: ' + esc(t(prim[1])) + ' <b>' + nm(best[prim[0]]) + '</b></span>'
      + '<span>' + esc(t('المتوسط')) + ': ' + esc(t(prim[1])) + ' <b>' + nm(Math.round(tot[prim[0]] / work.length)) + '</b></span>' : '') + '</div>';
  var list = hourly ? rows.filter(act) : rows.slice().reverse(), PG = 15, P = Math.max(1, Math.ceil(list.length / PG));
  WDY.pg = Math.min(Math.max(1, +WDY.pg || 1), P);
  var part = EXP.xlsAll ? list : list.slice((WDY.pg - 1) * PG, WDY.pg * PG);   /* إكسلُ الصفحة يأخذ الأيامَ كلَّها لا صفحتَها */
  var cell = function(r, k){ var p = wdyCellPct(r, k, B); return N(r[k]) + (p ? ' <small class="wd-p">' + p + '</small>' : ''); };
  var tb = list.length ? table([hourly ? 'الساعة' : 'اليوم'].concat(vis.map(function(s){ return s[1]; })),
      part.map(function(r){ return { raw:'<tr' + (act(r) ? '' : ' class="wd-z"') + '><td>' + esc(hourly ? r.lbl : wdyDayLbl(r.key, { weekday:'long', day:'numeric', month:'long', year:'numeric', timeZone:'UTC' })) + '</td>'
        + vis.map(function(s){ return '<td>' + cell(r, s[0]) + '</td>'; }).join('') + '</tr>' }; }),
      ['الإجمالي'].concat(vis.map(function(s){ return cell(tot, s[0]); })))
    : '<p class="hint">' + esc(t('لا عمل في هذا النطاق.')) + '</p>';
  var pg = '';
  if (P > 1){ var nums = []; for (var q = 1; q <= P; q++) nums.push(q);
    pg = '<div class="wd-pager"><button type="button" class="btn btn-quiet btn-sm" data-wdypg="p"' + (WDY.pg <= 1 ? ' disabled' : '') + '>' + esc(t('السابق')) + '</button>'
      + nums.map(function(q2){ return '<button type="button" class="btn btn-sm ' + (q2 === WDY.pg ? 'btn-primary' : 'btn-quiet') + '" data-wdypg="' + q2 + '"' + (q2 === WDY.pg ? ' aria-current="page"' : '') + '>' + nm(q2) + '</button>'; }).join('')
      + '<button type="button" class="btn btn-quiet btn-sm" data-wdypg="n"' + (WDY.pg >= P ? ' disabled' : '') + '>' + esc(t('التالي')) + '</button>'
      + '<span class="hint">' + nm((WDY.pg - 1) * PG + 1) + '\u2013' + nm(Math.min(list.length, WDY.pg * PG)) + ' ' + esc(t('من')) + ' ' + nm(list.length) + '</span></div>'; }
  var rng = hourly ? wdyDayLbl(WDY.day) + ' \u2014 ' + t('ساعة بساعة')
    : WDY.mon ? monLbl(WDY.mon)
    : rows.length ? t('من') + ' ' + wdyDayLbl(rows[0].key, { day:'numeric', month:'long', timeZone:'UTC' }) + ' ' + t('إلى') + ' ' + wdyDayLbl(rows[rows.length - 1].key, { day:'numeric', month:'long', timeZone:'UTC' }) : t('كل الأيام');
  if (keep) rng += ' \u00B7 ' + t('من الساعة') + ' ' + wdyHourLbl(+WDY.h1 || 0) + ' ' + t('إلى الساعة') + ' ' + wdyHourLbl(WDY.h2 == null ? 24 : +WDY.h2);
  var note = '<p class="hint" style="margin:10px 0 0">' + esc(t('النسبة من إجمالي النقاط للزيارة والتركيب، ومن النقاط المركبة للفك، ومن زيارات اليوم لما تحتاج زيارة أخرى.')) + ' ' + esc(t('إجمالي النقاط')) + ': ' + nm(B.sv) + '</p>';
  return cardFlush(t('ملخص العمل اليومي') + ' \u2014 ' + rng, flt + lg + st + wdyChart(rows, vis, hourly, B) + tb + pg + note);
}
/* ═══ تصديرُ التحديث الأسبوعي (V20.2) ═══
   صفحةُ متابعة الوزارة تُصدَّر كما كان العرضُ الأسبوعيُّ يُرسَل: وورد وإكسل وPDF —
   من الجهاز نفسِه بلا خادمٍ ولا انتظار (الإكسلُ يحمّل محرّكَه أوّلَ مرةٍ ثم يُخبَّأ).
   مصدرٌ واحدٌ للأرقام (mfuReport) فلا تختلف صيغةٌ عن صيغة، والنصُّ عربيٌّ من اليمين
   بألوان العرض: أخضرُ غامق 163E35 وذهبيٌّ C8943E وبيجٌ FAF6F3، وخطُّ Alexandria. */
function hijriToday(){ var lang = (typeof LANG === 'string' && LANG) || 'ar', c = hijriToday.c, k = lang + '|' + Math.floor(Date.now() / 60000); if (c && c.k === k) return c.v;   /* (V33.7) منسّقُ التقويم مكلف — مرةً في الدقيقة؛ (V33.8) بلغة الواجهة */
  var v = ''; try { v = new Intl.DateTimeFormat((lang === 'ar' ? 'ar-SA' : lang === 'ur' ? 'ur-PK' : 'en-GB') + '-u-ca-islamic-umalqura', { day:'numeric', month:'long', year:'numeric' }).format(new Date()); } catch (e){ v = ''; } hijriToday.c = { k:k, v:v }; return v; }
/* ═══ (V29.0) ملاحظةُ «تحديثات المنصة» #٥: «اختيارُ النقاط المراد تحميلُها في الملف — لا الملفُّ الشاملُ فقط» ═══
   نطاقُ التصدير: الكلّ (الافتراضيّ)، أو مشعرٌ ونوعٌ من تصنيف المالك، أو النقاطُ المحدَّدةُ على الخريطة («☑ تحديد»).
   يُبنى التقريرُ نفسُه على نقاط النطاق وحدَها (المؤشراتُ والتركيباتُ والشركاتُ والمعوقات)، ويُكتب النطاقُ في الغلاف واسمِ الملف. */
EXP.scope = { m:'all', g:'', t:'' };
function expScopeIds(){
  if (EXP.scope.m === 'sel') return selIds();
  if (EXP.scope.m === 'tax' && (EXP.scope.g || EXP.scope.t)) return (STATE.sites || []).filter(function(x){ var c = taxOf(x); return (!EXP.scope.g || c.g === EXP.scope.g) && (!EXP.scope.t || c.t === EXP.scope.t); }).map(function(x){ return x.id; });
  return null;
}
function expScopeLabel(){
  if (EXP.scope.m === 'sel') return t('نقاطٌ محدَّدة') + ' (' + nm(SEL_N) + ')';
  if (EXP.scope.m === 'tax' && (EXP.scope.g || EXP.scope.t)) return [EXP.scope.g, EXP.scope.t].filter(Boolean).map(function(v){ return t(v); }).join(' \u00b7 ');
  return '';
}
function mfuReport(){
  var ids = expScopeIds(); if (!ids) return mfuReport0();
  var keep = {}; ids.forEach(function(id){ keep[id] = 1; });
  var all = STATE.sites; STATE.sites = (all || []).filter(function(x){ return keep[x.id]; });
  try { var R = mfuReport0(), sl = expScopeLabel(); R.scope = sl; R.greg += ' \u2014 ' + t('النطاق') + ': ' + sl;
    (R.kpis || []).forEach(function(k){ k[3] = null; });   /* الفرقُ عن الأسبوع الماضي محسوبٌ للكلّ — لا يُقارَن به نطاقٌ جزئيّ */
    return R; }
  finally { STATE.sites = all; }
}
function mfuReport0(){
  var K = mfuKpis(), P = mfuPrev(), pc = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  var dlt = function(cur, key){ return P && P[key] != null ? cur - P[key] : null; };
  var Z = {};
  (STATE.sites || []).forEach(function(x){ var k = x.zone + '|' + x.type; var o = Z[k] = Z[k] || { z:x.zone, ty:x.type, n:0, i:0 }; o.n++; if (mfuInstalled(x)) o.i++; });
  var flt = mfuFltLabel(), O = mfuObstaclesF(), byCat = {}, byParty = {}; mfuParties().forEach(function(p){ byParty[p] = 0; });   /* (V27.3) بفلتر الصفحة إن وُضع */
  O.forEach(function(o){ var seen = {}; o.cats.forEach(function(c){ byCat[c] = (byCat[c] || 0) + 1; var p = mfuOwnerOf(c); if (!seen[p]){ seen[p] = 1; byParty[p]++; } }); });
  return {
    greg:dayKey() + (flt ? ' \u2014 ' + t('بفلتر') + ': ' + flt : ''), hijri:hijriToday(), ver:appVer(), flt:flt,
    kpis:[['نسبة المسح', pc(K.sv, K.tot) + '٪', K.sv + ' من ' + K.tot, dlt(K.sv, 'sv')],
          ['تركيب المخيمات', pc(K.campIns, K.camp) + '٪', K.campIns + ' من ' + K.camp, dlt(K.campIns, 'campIns')],
          ['تركيب الممرات', pc(K.corIns, K.cor) + '٪', K.corIns + ' من ' + K.cor, dlt(K.corIns, 'corIns')],
          ['المعوقات القائمة', String(flt ? O.length : K.obs), flt || '', flt ? null : dlt(K.obs, 'obs')],
          K.ins ? ['شركات الخدمة (ممتاز · متوسط · ضعيف)', K.ex + ' · ' + K.md + ' · ' + K.wk, '', null] : ['شركات الخدمة', String(mfuCompanies().length), 'مرحلة المسح — لم يبدأ التواصل والتركيب', null],   /* (V29.1) */
          ['بانتظار قرار الوزارة', String(mfuMinWait()), 'نقطةً معتمدةً تقنيًّا', null],
          ['تحدياتٌ مفتوحة', String(K.chal), '', null], ['طلباتٌ قيد المتابعة', String(K.req), '', null]],
    tasks:(wtRows().length ? mfuWeekRows().map(function(x){ var r = x.r;
            var link = r.chal ? (r.st === 'مكتمل' ? '✓ تحدٍّ حُلّ: ' : '⚠ تحدٍّ: ') + String(r.chal).replace(/^[FMT]:/, '') : r.req ? (r.st === 'مكتمل' ? '✓ طلبٌ نُفّذ' : '📨 طلب الوزارة') : '';
            return [r.n, r.track || '', r.who || '', x.late && r.st !== 'مكتمل' ? r.st + ' (متأخرة)' : r.st, r.due || '', String(x.upd).slice(0, 120), link]; })
          : mileList().map(function(m){ var p = Math.round(mileDone(m) * 100), d = mileDateOf(m); return [m.n, 'المعالم', '', p >= 100 ? 'مكتمل' : mileLate(m) ? 'متأخر' : p > 0 ? 'جارٍ' : 'لم يبدأ', d ? dayKey(d) : '', p + '٪', '']; })),
    inst:Object.keys(Z).map(function(k){ return Z[k]; }).sort(function(a, b){ return a.z < b.z ? -1 : a.z > b.z ? 1 : b.n - a.n; })
          .map(function(o){ return [o.z, (CAT_DEF[o.ty] || {}).l || o.ty, o.n, o.i, (o.n ? Math.round(o.i / o.n * 100) : 0) + '٪']; }),
    cos:(function(){ var C = mfuCompanies(), ph = C.some(function(c){ return c.ins > 0; });   /* (V29.1) المرحلة: لا تركيبَ بعد ⇒ لا تصنيفَ بالتركيب */
      return C.map(function(c){ return [c.co, coLiaisonOf(c.co) || '\u2014', c.n, c.sv, c.n - c.sv, c.chal, c.svp + '٪', c.ins, ph && c.ins ? t('التركيب') + ': ' + mfuLevel(c.pct)[0] + ' (' + c.pct + '٪)' : t('مرحلة المسح — لم يبدأ التواصل والتركيب')]; }); })(),
    phase:mfuCompanies().some(function(c){ return c.ins > 0; }) ? 'install' : 'survey',
    sv:svStats(), svz:svStats().zones, svd:svStats().detail, jmr:jmrConfirm().rows,   /* (V29.2) */
    brief:mfuBriefText().split('\n').map(function(l){ return [l]; }),   /* (V29.9) */
    obsTotal:O.length, parties:mfuParties().map(function(p){ return [mfuPartyLabel(p), byParty[p] || 0]; }),
    cats:Object.keys(byCat).sort(function(a, b){ return byCat[b] - byCat[a]; }).map(function(c){ return [c, byCat[c], mfuOwnerOf(c)]; }),
    chal:mfuAllChal().map(function(c){ return [MFU.src[c.src][0], c.t + (c.src === 'field' ? ' (' + c.n + ' نقطة)' : ''), c.party || '—', c.owner || '—', c.m || '—', c.st + (c.tk ? ' · مهمة #' + c.tk.id + ' ' + c.tk.st : '')]; }),
    req:mfuList('req').map(function(x, i){ var V = mfuReqView(x); return [i + 1, x.t || '', V.u + (V.uSrc ? ' (من المهمة #' + V.uSrc + ')' : ''), x.s || '', V.st + (V.blocked ? ' — متوقفة' : ''), V.tk ? '#' + V.tk.id + ' ' + V.tk.st : '—']; }),
    blocks:(function(){ var B = mfuWeekBlocks(), rows = [];
      B.done.slice(0, 10).forEach(function(r){ rows.push(['أبرز الأعمال المنجزة', r.n, (r.who ? r.who + ' · ' : '') + dayKey(mfuDoneAt(r))]); });
      B.next.slice(0, 10).forEach(function(r){ rows.push(['أبرز المهام القادمة', r.n, (r.who || 'بلا مسؤول') + (r.due ? ' · ' + r.due : '')]); });
      B.wait.slice(0, 6).forEach(function(r){ rows.push(['الاعتمادات والدعم المطلوب', r.n, r.st + (r.who ? ' · ' + r.who : '')]); });
      B.support.slice(0, 6).forEach(function(x){ rows.push(['الاعتمادات والدعم المطلوب', x.s, 'طلب الوزارة: ' + String(x.t || '').slice(0, 60)]); });
      B.late.slice(0, 10).forEach(function(r){ rows.push(['المهام المتأخرة', r.n, (r.who || 'بلا مسؤول') + ' · تأخّر ' + (-wtDue(r)) + ' يوم']); });
      return rows; })(),
    blk:(function(){ var B = mfuWeekBlocks(); return { done:B.done.length, doneLast:B.doneLast, next:B.next.length, late:B.late.length, wait:B.wait.length, meet:B.meet }; })(),
    weeks:(function(){ var snap = mfuData().snap || {}; return Object.keys(snap).sort().slice(-8).map(function(k){ var v = snap[k]; return [k, v.sv || 0, v.campIns || 0, v.corIns || 0, v.obs || 0]; }); })(),
    owners:mfuOwnersLoad().slice(0, 10).map(function(o){ return [o.n, o.chal, o.task, o.late]; }),
    updTitle:(function(){ var W0 = STATE.wtask || {}; return W0.meetAt && Date.now() - W0.meetAt < 14 * 864e5 ? 'ما تغيّر منذ آخر اجتماع (' + dayKey(W0.meetAt) + ')' : 'آخر التحديثات — هذا الأسبوع'; })(),
    upd:mfuTimeline((function(){ var W0 = STATE.wtask || {}; return W0.meetAt && Date.now() - W0.meetAt < 14 * 864e5 ? Math.max(1, (Date.now() - W0.meetAt) / 864e5) : 7; })(), 30).map(function(e){ return [dayKey(e.at), e.k, String(e.ref).slice(0, 80), String(e.txt).slice(0, 140), e.by]; }),
    daily:diaryRows().slice(-14).reverse().map(function(r){ return [r.day, r.sv, r.ins, r.dis, r.stuck || 0]; })   /* (V24.0) العملُ كلُّه بترتيب الصفحة */
  };
}
MFU.sections = [
  ['brief', 'الملخص التنفيذي', ['النص']],   /* (V29.9) يُكتَب من الأرقام */
  ['kpis', 'الملخص', ['المؤشر', 'القيمة', 'التفصيل', 'عن الأسبوع الماضي']],
  ['svz', 'المسح الميداني — حسب المشعر', ['المشعر', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'تحتاج زيارة أخرى']],   /* (V29.1) */
  ['svd', 'المسح الميداني — المشعر والنوع', ['المشعر', 'النوع', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'أبرز تحدٍّ']],
  ['jmr', 'منشأة الجمرات — تأكيد النقاط بالمسح', ['الدور', 'النقاط', 'مؤكَّدة بالمسح', 'تحتاج زيارة أخرى', 'لم تُزر', 'فيها تحديات', 'نسبة التأكيد']],   /* (V29.2) */
  ['tasks', 'حالة أبرز المهام', ['المهمة', 'المسار', 'المسؤول', 'الحالة', 'الاستحقاق', 'التحديث', 'مرتبطة بـ']],
  ['blocks', 'المسار | القارئات — المنجز والقادم والمطلوب', ['الكتلة', 'البند', 'التفصيل']],
  ['inst', 'حالة التركيبات', ['المشعر', 'النوع', 'المستهدف', 'رُكّب', 'النسبة']],
  ['cos', 'شركات الخدمة — المسح والتركيب', ['الشركة', 'ضابط الاتصال', 'مخيماتها', 'تم مسحها', 'متبقٍّ للمسح', 'فيها تحديات', 'نسبة المسح', 'رُكّب', 'الحالة']],   /* (V29.1) */
  ['parties', 'بيان المعوقات — الجهة المعالجة', ['الجهة', 'عدد المعوقات']],
  ['cats', 'فئات المعوقات', ['الفئة', 'العدد', 'الجهة المعالجة']],
  ['chal', 'التحديات وآليات المعالجة', ['المصدر', 'التحدي', 'على مين', 'من سيحلّه', 'آلية المعالجة', 'الحالة']],
  ['req', 'طلبات الوزارة', ['#', 'الطلب', 'الإفادة / آخر تحديث', 'المقترح / الدعم المطلوب', 'الحالة', 'مهمة التنفيذ']],
  ['upd', 'آخر التحديثات — هذا الأسبوع', ['متى', 'النوع', 'البند', 'التحديث', 'بواسطة']],
  ['owners', 'الحمل على المسؤولين', ['المسؤول', 'تحديات مفتوحة', 'مهام مفتوحة', 'متأخرة']],
  ['weeks', 'مسار الأسابيع', ['الأسبوع', 'تمت الزيارة', 'تركيب المخيمات', 'تركيب الممرات', 'المعوقات']],
  ['daily', 'ملخص العمل اليومي — آخر ١٤ يومًا', ['اليوم', 'تمت الزيارة', 'التركيب', 'الفك', 'تحتاج زيارة أخرى']]];
function mfuSecTitle(R, sc){ return sc[0] === 'upd' && R.updTitle ? R.updTitle : sc[1]; }
function mfuRowsOf(R, key){
  if (key === 'kpis') return R.kpis.map(function(k){ return [k[0], k[1], k[2], k[3] == null ? '' : (k[3] > 0 ? '▲ +' : k[3] < 0 ? '▼ ' : '') + k[3]]; });
  return R[key] || [];
}
function mfuFileName(ext){ var f = [(typeof mfuFltLabel === 'function') ? mfuFltLabel() : '', (typeof expScopeLabel === 'function') ? expScopeLabel() : ''].filter(Boolean).join(' \u00b7 ');   /* (V29.0) والنطاقُ في اسم الملف */ return 'التحديث-الأسبوعي-قارئات-نسك-' + dayKey() + (f ? '-' + f.replace(/[\\/:*?"<>|\u00b7]+/g, '-').replace(/\s+/g, '-') : '') + '.' + ext; }   /* (V27.3) الفلترُ في اسم الملف */
/* ── إكسل: ورقةٌ لكلِّ عنوان ── */
function mfuXlsx(){
  toast(t('يُجهَّز ملفُّ إكسل…'));
  return xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة')); return false; }
    var R = mfuReport(), wb = XLSX.utils.book_new();
    if (!expGate('إكسل', mfuReportCheck(R))) return false;   /* (V28.9) */
    MFU.sections.forEach(function(sc){
      var rows = [sc[2]].concat(mfuRowsOf(R, sc[0]));
      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = sc[2].map(function(_, i){ var wd = 10; rows.forEach(function(r){ wd = Math.max(wd, Math.min(50, String(r[i] == null ? '' : r[i]).length + 2)); }); return { wch:wd }; });
      if (!wb.Workbook) wb.Workbook = { Views:[{ RTL:true }] };
      XLSX.utils.book_append_sheet(wb, ws, sc[1].replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 30));
    });
    XLSX.writeFile(wb, mfuFileName('xlsx'));
    logEvent('تصديرُ التحديث الأسبوعي — إكسل', ''); toast(t('صُدّر ملفُّ إكسل'));
    return true;
  }).catch(function(e){ softErr('xlsx', e, ''); toast(t('تعذّر التصدير')); return false; });
}
/* ── PDF: صفحةُ طباعةٍ بألوان العرض، والمتصفّحُ يحفظها PDF ── */
/* (V28.8) القالبُ الموحَّدُ للوزارة في الـPDF أيضًا: غلافٌ بلون القالب وشعارِ الوزارة، وعناوينُ ذهبيةٌ يمينًا، وجداولُ بالأخضر
   الداكن، وتذييلُ haj.gov.sa، وختامُ «شكرًا» — والخطُّ «Abar Mid» المعتمد ثم «Readex Pro» بديلًا حيث لا يوجد. */
var MOH_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXwAAAB1CAMAAAB6QaqEAAAAwFBMVEXVol/Wol/Wol/Wol7/AAD///9/f39+fi29fT67pmcCFBG9vT60a2ftsTr/fwXo0WbUf1UA/wAAAP9/Pz9//3///6oAVQBVqlX/AP//qqr9wHEAAAAACAvYpGDttGrWol7Xo2DXo2DjrGUABwoABwoABwoABwrWol4ABwr//3/YpGD//wAABwqqqlX8qVX/f38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXjT7hAAAAMHRSTlMcX8+PAQECAwQHDAQEBAIEBgEBBAIDAwMBA/8A+vv+rLOT/o8u0U73rwLQAXADAwL+PVKRAAAll0lEQVR42u1dB7OjupIWYHxsnzPhvrBJxuRg4v//d9vdCkggbOyZ2t3aN1TdOz6mDdKnVie1Wiz+172ShPGJ//LVdYPHDuEbv2S3f+XL48Ovgz/w4Ba8NYoMxj9OiA80QxgfEskiO0iSZL6XxMn2U+hTnMwUDhJx1yBRL01mknj+YDO0fv2aJFly/vEtvA8dXAeFPYuizOOjngj61lPw+Z/rxet4kjifhg7+/8XjrM581sEfhzvr6Nb9PO0YAOZ5XsLkx8RvE499cD7C6B35icGND/6TmSRtmwTeT/gI4wtTDUmAGEk8/RQfSOB7Fs4kIZIEBkmcIslZkZzkU1JFkraSZJwOhyOSnHk3IYkXaJLWT5BkuB9Q5p7hTd3xQF0iku8sxcYgSTh0wK5EQrwprjd4fsQfDYwxGoETtB4YP6ojZH36Cm8RWqenj2dRFmUB/MBLsiyqs9sta70PQD/kXhtFAZsm1t6iLCGS6KZIGL+HRySpYxaOPAaSVpLUdQY0EZB005GzpI4SFv7gKZBESJLiUyIgqVMELiSSlsEk9JDEA5oAXukjSYSjPsJT0ihqPUESEYmHJLUiOX0ckAQgOIkupUQyd4kYintAEtxDDeThHc6HHvg+tBg47ISiw8vgqVnCvwHYLEjauq7FgO94EvwS8IKeAr5R5Cd+dAMkPjvv1ta3G+PfOINRED2FZ7ZZm8RA4vHjAEi0GWitn4IkgybBjSHO/BhIAAlgEQAtAn3048hiILnRozwW3Oo4BvhgnE8AFrwz5ucjC6AXiC6SwMOBJAMY+ReMv1/f/BFENJHU0BhgDOh2gu0F+E/3GNsbMZDBoktAgkMAXYpbImFdgCSZMnG6t3QksFeGaEf4D/FpnCHn+4A28KJ57yn+jAFj4lS+pfBjxAvHA/UHMKPXxtDSkPlZm8JLo+QAbOUNRHIDUPyMMR9GqvsAuecHHgCDHAywAKMBa0KPEyBpcaQ+gfXhKUACALEa2RU6guMc3DyWAMk0Al/XsecRCccHQ/NiHGcPhi+Ff7sT8hmQtMjkPMYeTzCS8Ae7xR9elA6H4QCAA4lPJF6GEOCoAknUnrwW3owMfwCu9V5VuCDS2hY5FeCuEXKc7jXBDZM6EcjD3xn+rw3Emx6BH9AApREbOpCmJAdZAjx+w4E4IrBE4tGkHljAqcFA0npRTCobJTKKc4+0PjQCRgwecwZB4/k+Sj/gtW5UJCn8BNkZ3+RlGYzqgGpr6u6hB3DAJII5TCQkX2GcvTQj7XM8jp0H3zNgBB8nvCdJ2ptHKP8d+Pkf0A3GzwkAAGoCSO7UpfYWiC4BCT+ApARR9rqpOeHvUO4AbwP8NU7ASCAetJlC3gdlhXqG7bF2TmyM6w406z+ne6ehjuFmgmJHdC9JIna4n0EJgHhlRyLxJ9aBimSyewkw8dShEsXRIByBI86hJkE2BpLwzHBMJdR1BM+EcR8+OCESeVFw5OcRvh2Q5JyQPhtYzA9fRAKKAcf9i92H04QkwDs0W1kyCDhhxAIcdzZ+G+5HIsFxD/jPMWai09CllH1/Wep3x06IH5CIxPzyUh8yYHiSZ8dwh6k5AOk/QSaAePCF1qv9NIAhNcQDSmeOjBOTYmRZDaaIn9HEjlohQTKa+wEPfA+FKky7OEASEGdJJCQI6UFga0+YxX4GZhFoggyATDPUiSAeUFZFLbws5fcvVOQxkqBWhfeHyHZE4kdH5idjh1IrSgJkv5ZIGDActLcVEs9PpCL3gUR0KTO6xF/F/mgwM8AfGfCjHIpItavrNO2y8zvkQB910QBTGjRrLRUjqlc0YGA2jABejE7hjyGFNwJJTSSAehKDHgNxMB3jDKiBRCo9EJAgV4CbQb0CCYpbocgDmFBEErU4g1PUnXEC2htHcvIyIGlBWhFJ5oMgusVAAlYEkqAiBxL/VjNqODy5RtvIF+rVx2adoCcw/5FkQhLZJSCpoUugvdEaG7pX7Uy0Z70gjZMUZjYZK/YFzAW3kzgVgmfs9jhZaMz5LfJjAB4D8sRIJiEAIwxLHEYiAQ8DbasMRYawGsmwRKtxDENQaH7AToIEvvvJ0tYkGUAZAEnKRlSL9Q0VurAaiQR9hQHsU3AEEkQNsRcTC+63wvYEhd+RfYpcPTBfkyRoNSFJK9wDaC+4Lfx+j2WXyBCmp8guvcj2HzRjAJIMUQG2T+IF9n7QEmJ4RS12+P4QfOluSOvrowP7GET0cNT+kueB1P+6KxJQjGSsczLY0OuKE5Kp49B1oUkSiFcjSZIIf2nUbxIkMSMRfQANJkmmz7DrhBaktqD2Jv6BkfcFCTpvnejUx+GM7QVLMyQS8ABjQXJULwq7IzoO4ACILsXSMePn6UUna+JgTpFZWcv/ZbPIl3Jf367pNhoNf8ILv+GCmZRkUsTXdbRxydu1IAJL9JE9xZLFFcv/jMDXQ5LESWP8/YhEfblBYj5KxcwekCS7SWL53QshZRDMaEtm4jLMmxX8pHglFfj0D1yJPyHlvUF7MKVrMPLw8lshYZwXyKK6JbqErJYHA8zSf90rAJG8dw3kO/eEASNdU89LWyf24MVbdEGAkco/Mv/XrsMcVwOWRit6Q+zATQqldk/dCHbfvoaPj2Hz3vCA2v3DwfmwYXXD+NN+5nZrXmq68Z6XfKw7Q+s6rrNsS+IYskdG1gb2x9r5LVf4FxdB6m1la9g8oBTI3Z3+X4B/+V9+f8fBs88Me/KRtSlvok9/fw/8vCzzjVtFU1Yr6qui7strv/6J+2HwZWU/qpn/7MuyUZ/Lsux3I5UbP9ymqV7KUfiMbxrUR6JH3axFyPkB7z8Av7/CVTpvVY47+fXazL9cd725XhfoFzmSFjxv7EGy3qP/Kl0P3brgZdcnJAWQFPvB/wrjTLi1GQaQgjTxndDDrSD2I7mqgou7H91z8FcNAbCAm50dLpuqvK7HqnRgBjeaQjxuCX5TImkFw2YNYm4DZAxuuRuq/hH4YgblL4EvIlpo3cceGxhLkw25U0dtAJaOWvGqs3jblwDwewnYApq+vBQ9cJBjrleEmmM2zJiVFhdWeLuoiuVcQdKKBsCAprIYQAO0xrOvpDwqnFNTfbt8bSGmEMil/WKHlskBep8SA9L2idihICLhX+M6w7AJfn6l7sKsvlbruesEv4fWF41jGjsYVqBWwFiuH4NfwfMv5vQqLLpyblS15NRKTKV8PaVECyr9cdGFkn5wfUXiDzzNNPSrgNpa4Wa0rM9x7TXzp3DDpGXYJ+h8TkDnNvZ91TflhrhcqU9Thto4VTm+YC2/6CsEvrkuRsTEqV/jKawfZJeyovZfV8w/c01DZFZLqwaa94rAP3KGUekzrZFllkHjDq0h/LjYTSsum6zPruZVWuy93RhSuP26v9WaYSVwRb62dZqcIC1IjJlfWlq8X+OpbhnXko1LxUlicJbM35RF+QLjn7iHy2f8fEwziXy9IXgyFflEO7M74bpowL82wC8Fyxf0r8kM5cPWXdfqyuDSlarIrw47EfmvBNLGNAvtGdUbs7G0Z2YuWT6/uuROo2yjXoC/mhlN+YLjME1xigvCmCYifCzwoBJXcAe/VVMD7cxvyPyMdxsyv5ccny+6cM0f2cjXonGAnzsYVg1W5bQHr/T/avnafJ5izQpPrfbFL/Ffl7lTGmT5ugPNC5xPWXcTLfNJmZKiOnVdiUdKgcYoi8dhGvDHhy1rB5i+Eo6TLSnyR2Y0AF9tMdt6IGm0tiztvrHsm9IU/KbRurY1JYKXvHIKRmPaOabuS+CjvSOsTTI3PXZON2LKqGpPXiutfA8kzvDYySqcSnWzdWq0XvGynCK2cDymBAGVm1q2NJl5ISqKfS5U4aDL+5ewP+KqpkzLATvSw/XtjbUUSuPw5Niggzu97uFuujTV1W2lbXpZL4VmhH1r6hYXMzt+V2yq/99zodCRAQPMWXTGd4yQDq45AnUy7Y/t9JphL1s97bd6VW0Z+i9dlW27GPL8YTygKtfmzm8Fv+MiLxDXxBNp8tRZvVrFiiI1Qh4NxguxHUNUl9cNziyLbdiKNcO+eoFRWlgYFnuYeRVHc/vm71+YDlNjlliI2EusYzu+U8cq7Enoszars4CfH4FvSMTeYK3GxWbAffnlgZitnF7WL1yN8aBygadhE1QrpPPrQ3Pt5Wvgsch4w70Qyo0KsqWp42fazGS05O5v2ZkC/HxupcmvuYPN+ofsZPgyv23S5wb4y7hoMbuuaxOgv75qzzyVOpnYRJBJ0ZIwb4F9fQtwl4BAPwDac5s9XEAX3kq/Nn7XzAS9bwq+C/zfNulNDZOvwb+KFvXENZUZRdDqPy9/RzsmzgT2TGlWj3trY/PmcWXnZLRvIbl523lTEnzqgx2CWhn61TNAH3pZ74NfbDHzHDkQL7ZMAW2kltfyt0gdD3j4NJHwiUijMmd8xyNRT84uO4zwR7qdlsiUcQftbmxBvWh081SGPvSy3jd+Cu5wdzXnl1WlZJPlK2uD63r9HehPuJNiFBuwhD5lvmR8oXRbuXIbCStTeFgjuLce//cH4Iu4ZnGpVlHNRShq6SHBZbkvjdvLWrs4l6IotuTXpbg8AL9cenvY5kI2vLSsVAl+4ViPuxRvWQNHECApLmdRlrkUOrgtA6dC4EmnFrfkpvSVz47bylaZmoUITS1DJHZY02xu0TelDoQ22rnPLS+rMQCyRFDVqJ+WTZPnfV/R1fd53pTlmrvXksTm/bw0YLYiq4UOrJXLoFBZvcH8nWD8rD3zUQod2m0g/lWmDzt8k8IJdW34BHy5WrsU08WGtdiX1+Ul8He5uBKR5mKFwx5eC6Vacpe7a8eV+3kktElggF9a8ez+urVItHM9C0D9QVMgol2UgWDzIxf2f+aP44Ryv868hznKyskSvLiMnLitRTd4jS0WNJOa99dReOdV2NMv5y531xWNqCxIGzkJlmu1hXrP6+iPtFsDdSofpbbFWAOB3/KJSbEvjSKUQKcd4AtEl3axM1Wj34asmsdPgT9j3ZsGyqOrFAoFpFBTLpZJXLFjs+WNibP2EBZSp3SP8p7rjCIGIT1JiY/7/0jE1Jl/HtSXMf8igix+khbFTHbI1ytN24xf9hofyXymTJbsiMA015k7m6fQ5wUvmo3FtcYBvrn+WZkclKtxsxcMsKey1c1b4Le0JdDPhNCZJPhR+wPYXHwE1r+PPH4R/OXyU74R9zJRKWaxsgZfBEDFKllvTnmJBlo9phIQusMSbGVfmcy81R764cXMAtBWf2GFSXM1Sd8Ie55p6yrtkFJ+1Bn39UnET/PXA0qoveA3rplYVS5bvskbo8O9KVXsFCcZjgB8dfpVJcyjvJ9D7bNgUmsqDsFGv6mqZi0q0EyYWaG/Wjq/midrbqoCaFL+Dusj+OA6dTLIlvlfuC9Ug38cpPxHWX/k8e1RUG0GH038yrkWuuI0U20WhWJSYWMYKVYa/OsjETtD3/RPNLoxEnTls9ddzE83pu8MfmWy/pZI2+nmAqAD/yblPO3BZr7YhgXg3w/CFPUPISrnm7dL4ZaoKasXmmNzpzLvSovBlmTV5lNKO6Z0LZ+rZfkLETsoNOQG68/gX0xXI3/CD4+9LBZ5hxHsfbLj/R9hJ8Enu+fOKfoA8n/kIYom9mTjCzMCKNULzanW0FOmz0I3btrvCJlkwrywliyF9wn+s6HNtwzSav4317rmqpWRmW/VrBv+utAPTzFuJRaAUyoarbFo8FHSY1UAimTe42cbX5jJsf0LvNAsJPUiCi11Y7UNvnQ9hR5utmINVZ+X5Sbj63hTPn9QfTDAR0lWcgfrvwo+sP6I4eXRn3ldFr4gj6r7C/cFS/BPz6uOiGZeVMPc4C+NzmL2citrQFaGSZE3TQ5G6SpHOb/OmWTFY3Fnm554qddqUX7RT78aRo47KgRTCoMa+dtrDgQ+ZsB20unV4Kvgz85djoxw6B0rWbql1FnLP2/cU9dM0eiXePa2HWsl8RWPZpyhlJtlYM1YP8iXMWjroc64cv4G+J1YWPEJ7ZOosFab4HuRBr/bA74OX1YLEAw7EORDQaI4n5HPVbabps23weeLOWKuRxbbVp8BfbESTyr0V5RWVqEC3wiXVK4XVO8udU60lEjqdAH+kaSQv3OXI4KvMFvsKCgeuqMorAtthkvdaK4GN0sdUdjYV+5lGO4MgIoRXqax57N1by6zqxG1TKjc5ay/Gdw/oz3vC5H+wcSabisAx6XerOUffCf4smH9wu3on0Gv4sVLLbgOiC2d03yZVpy7PJ4iLy3o8aHV4qE5GEWlZbKXs+udP16Ea95e5JXu611+JscqFWYl/vk0oGaAjyH0vFkI8OKRmde4yRpLIlQLdEu+uSgip5C5hlnNyF/zYkMl5WuLfZ5DxdyCymXYNO8vtt2xiJ70oEbp1cYa/Ch6Fkqewa9c8FWz51kVdjiszAuXybngLWsl5tJYtx2+XKOe3dvhOhN6vtg/ZIJfGbyg/VqrM8tpVf5KStvHPVbuq4imRVkr8P4HCn32XNdK8MtZhTaLXpX9EuBynZMq5PIy/GzmDIjpYQK9VnSbKyvFg0hftcTeFEA6h613OBnUpPdTS060nE7mZNeJ2E4tKlzgYlewk/E5w30LCy/oItdWqiWHbRkHjiXRvlpAVD2Uv24xtxzR5e4qyRWNpaUKLbmMzjQuB+9X0rqYTIaywwt4HfzdNQsZTOViFSVY8Er17urD3NHKAKx86kkZ8eXHF7pwhdXsyjWopWvMfgX7A5fFLRZOFg6Ht38EKcmxN4LmIqpoLzC/D36xhMQMudgpWFVjKpbqxR3nclmgcsYwXJS/ls540IFOy85/cfosZYBklcIVfixWseWd0U8r/tNsW/cF6tu+egOX3BWskSNvYX/J3TvoXr2UZOlkSLnWwub4AviVw+hr3NaIJYjy3WxvdbS0Yo37UjieptlIZnazTOOg/H1pnMrOjx/XstsAv1jbD7k7iNmY3vqO9ueOzht5ONfr9bonlbx5usjjepFW4b0ris1/O/jJG+cg2OD3200zsy8v8LHqLw+zZnWCTr+wDht7NvW7hjDf8aLc6QNUjsWb37lr4iTT09o3zkFgtjx+0NEiN9i37Iv+YRxY8Vi52vLfW6g935CJEelHQU/1oso1II3ru+fivjtOw3g6nz/H8X7snoQ5ZfbCE8+KHvlpP5IZWDe7p+QzuantRsf+WGum7cvaq+a8zw2JY79IJ0T0Dlvq2VTr7qeFADmy4biNvbTzH8Xww+G8eOR0HkLaBF1YLd6Vx1U8TAHX0Dt4rHzHxNPTp+mdxpTN9q7XV+V1H9uHhCAWXJUXEwZ9eDpuRJeZ3Bq3Vb80HEXQZ/XIbmIyt0gxxs4curlQyMou1H13Jry9s1erV6GyxcYrvZxm7lTS/roxIBr6PRMNj79odW1MgFUVsp1cpZef2PmHYaRHBvRIXZKzleeaUBGL8sX8xTli2DRbEfh+Q2C9jP2lVGxeOmWLxcw61jYPiB6jHZWqJhaIYsvieAKxNo5/iBLA62NQOr1HwlHQqyPkvViWPqpr9bzb7RbVOKTmgvLe3FEZNgOl21ycvLipOd4An2YZrhob43zpncycr+Jx86LAriJheBINnYkTU8FqhRdWq4uoSvMpXJmaKqR8dEDf6VM+FO5ZTaU3UfYwZsYsd5tgJa5iLBfF5xW/B/18A/xeTs3eMcgm9NaK43IevpyPP8IYIMsaW5tF7fFFWXYBfp35n4vTsQY6uoS25srC15k4U2I0F1P4655Hv5rwxrLTw36+YWRXi3cZg1y55J2irHLH6s9TI7ObpvF0kicKMS9o59JGouoCt7wpHVhbZEhNnThcwtgf3abyCJtuGj/H+xR2ovZC3jT9S1YIpl/0JvQNbjPBKy+eCKzXPZzKTO4ElOWbLET7ZvF+TLuQdP17m4DGMaQZgAek6PpGBP/9aEb25eZDM4qPEkdtyRWTphbId8PJOL3sT1HTh/OAzEQqljbDj6VK9Rrt9y6RIt3wsvA8JV3uPYqkuuD3caEw/oD/VAcT/qlZ3QtLlYYLqTNvAgK2R/JaQ58K5Nc1d/6AvyN2P07i5BBD9HOB9Elvg9NxzbsorBaZ0B/dh6f8AX/XNYmT2WZMgfk/D3hYY3xTnF9T5s6JqwoAGvr7VrCZ5brqT0/lPipcvStyuYYn6tL1Qov1qFXxBmhAdRX4M7xEoVCl7nr9VNLF89PEpf66SN3Y6xaYapa+vcxFSCp8kmH06Kzv3PqtbLx8VTV/23P7dXn+gibuRqOqo2D+vyY60yBTZTBC+PuLql0omlSc7Lgd1dSWt1iqopWmysjB1vbhHJlqzExNM2VWZSzNufG5mRhRLfO7FU2jW9AbDlNjG6e9Hf/vjVzwwqz2ICpeFYuUjPzqeN1LlteB9Ohcyzr4wLxkPItOno7SYWjNizIZ7KGt0sPDfbjat+oV+LmR0F4RmrT6JLb4VJjIjJyPHhZxfgNWdN+LvqnqDaWxP7DsyR3D2HElfpOrXSWljUZvLfmtwIdnX4wtAJWxK0yAX8rFBnJZsClGdvRldiI1+OWrPgdZkK1Cn0QP4H3Aeqd4bBSMxTk1pwbWC+BPwFebPGzwRbxtBj9fLkmV/ybxVVuQK5UVqDOF9WqjqBVTWf7tivNLTL0tHoBfmEmXa/D1hJLgy8eUklo98H3wqcLgLPpFuVI86RWMfDR8ONMjgxInfLawyJQUUBubJPhlI3ewGeDbcS31p8rOFl2hfRZaApTm5mcH+BcTDYTLqP2zAp8ebS4Br8DP1apEPmeISzJspfxGPfhSvrOkJW34WtV9ASWLsGN5fSVyauELPE9mAPAF60K3Lc4vSjkKCtfK9tIN8HsJpdxaVMzDNEtVmhh4c655of4q5HowglKZBRkX4GMDrmZxqQX4udqJ1Dg4H2lkVX94sHjve+uJh5M8rIxQDr4B6FiV4SiOOtZsf9qRJA7ga4At8AWaBviyLk+1Br/pSeaX8s/STN8zYnGVVrhWoV2tFEuhsqst8AspC/veDT7Id1JNeS7BlztiehWO7pe74t9czJ1E+TRRUAoPQoZv7vwYyHACsf2u1XQAn1aXsCs2+JRaZoKPpt5sPRjgW6u1hb35zAl+7wJfPLA3BJUNfi9fUmmLagF+VYmi2IUC3xhpwfRicv4y+GjMnwOjZu8ZsD6rMEOmDhTcBz42Fhe2F+CjvVCY4MvYYb7mfLO2kVEVrbDK31RrmV8YMFNR5XKuJrgAv5dmrd5ftOZ8rEapFQdxvsrJLcReLlXzvVm17tXrzlU5L1HDVJWXEmpgb+oaowYLrl+ATyYKfSgdG69smW9o48pQzKW5VeqJwl2u6CzAF48qr6VhSZnzqyH/o+qJkZTMv8gGzMz+i9bObHV+ot6V8RuPDr1X5b/C3TkkCD52DBFbgs9VarfZyn4Nfm7BXFnb4iSUohjUI1MTORuvfGn9a/Bp0+hcDElXhBN2GYJfYUmLSoNf6NlFiz9VVV0tm7n8pQQeNOq1v1VnWuS8cNArgd+rMnEL8Avp9Qgnq6m4UUJqAb652b40l7xwj3ORq5ow5Sb4ymItZkmBEBZKioliqgb4VHZBPDtXE1C01wBfjIz9pt8E/uzO1nq9Za+mNcGXxeCs8ILpk0s7RO7LL5x2fmNsuzdcsdJUxw84f9642Yi/6EVGeQq10G/u+zFLKBD4QiOZ4NMYNrOVQA99L7xgerrkulLxQHOtyuPHD3F7n+RhZTmLDkSIdrIV6uQCCtZcyIYTC4WlWqQr1Nq5ykErl4rQWG4tc8ctvVcTX9kbJlJJCrIRjp0+zIBSUuCvSh/CVTTi2RfRDCqlX6rJW8hzbHr4dz7UC4dI79V7l/PnwPw3DPbocwuYcULELnNnK6S8kcX31oKckWR82fOSJw+6WO3Z06Lfe7gcrs4GTOz2ZPxTnx/BRIEXvO3t25X1J57/Mt93zL/dfDoNYuAsns/HEkvoA49vWcS6HZKHfXzQIZqDOknT+KhO11R/4cGc65M/h9W/H8sDOtWP7FvWEwbrweo31uGe8svFSaHzs91dwH/NXxiv+vg4vAE+5YRntONwIHNTHXuOZuYnugD+rb6l+PEP5//ui2o5tqBbcdGqzWrz4CasK3jsWIsZ4/z5yP45Cfp18FPcY/4JEl66tVnrqcVELLpG2ST7wP9zBvqL1ydl6qB29eaDClgqM9M8/i1ktFFlh7PF6ET1hK44mT+LL2L9b6w/2DSbJPGSJN5FMj+P6F8kmWnmr9Rb7faK/u6si7MI6zBhV3ryfBo8IEUeo4LOLseSJPv2Jv6R+TuvUGWaHaYO0Y09mYCZoq8b3rn6O6DDtNhBCbTpwZkpnufFYhcj8+I2odyq8NR1uEuAjubqMG03Ean/SOKLbOlz13V3QQKfgCQVlhbzUt+PPUo/N0hCIvHkU4BEJL2fj10nX9RNNknSxkRymhYkXsBpXw3zEl+QjEOHlh1jZ348Ekkq3BwioS4NI3SJaLAt6noplqBmyaCywmsh5Sl/6jDqpXM8QUIzPt4Lt96DBy5mKaOUuFtNqem0BAad8VpckhknMGujWyKOeNUkX0ByJxK4M4JpK+r5e2l0w2MDbzc6fn0KyQWkiZneyEBjLK0lSQ3v7YaJSFosDu3dyEf/ZJ6PCkySYPIF/AgtDIYkVNUDc5gyagydvznisERI8kURRujSHTglwzchCXVpovZ6o9oSdRheQJ+xk3KcBuLyWoaTh4OK8YtYA96Ipzkjk7EHnI814HG63GIGzfZjH5EGroVu1rcbFWVukaStI0S0zdrEx098uqNWR63FDhYJjEQcA8IYZmJAkt0C8CcQYhi2Fug8lt5qQXIEHNvMh7fzUzcm8MrMb/EGHkgSx9Cd9My/WHKD3/kjn8IAB6XG3NUASfykzZB5vg0xkkSjKLoCJJhgn0CXojZuqUs/eIAkmRL03f6Ns0cWEH98pzH7JllfWfby+pJWP9wCo4ekTnfAXscsDDcGVCTrB+AWQKsxBReX5zFCHQF3gUSaOg6Ap14MKjzEwpLg2wHJDXrsZ4z52KYJWL8NgO0jOs5CHMXbYo+TDMbLh7n5BV2vYy8ga7irE0mCJdBvHkvQcMY6oBFILFGcO6bTjmAkUbdB6wLf60IwNfApxMEcbD48kgcHG9oLbwtgGA4kFfzA84nEy7wzbsuhJY+o/YldEuIY00DYvpJQJ5pwmc+QnYe/KTMH55x53ucXF4XdI72igrgAywUbG6Sh6QxFNfQjvHuBEGwMcMN6qPx85jBoLPboyC2a7rEkScDDrgMqYAiz8ZxqEsYSGjH4DnDzfaAFUXzgIW5DQv8j5SwUg0rHL4Awg0fQMXadJ0mwCHEAYotIgBWgdVhcq+v+84C6BdMHfJycMP2ORILnN+BYhfwAwhBnLsba2RgCyUF2KRVdovZ2pxDbt8/UPKgdh+z+Y7zrdEAMKBy/m3QjhdlqmU54P30OTIihDX+CBpOxMa4xHY4NA8hOOt2sJgQApM9ODkccsY7/nR0nRQJ83p05wM46MRwJMPEIwzF9P7AASaDNNTAnIPBdkrQeklwY2ACj5x1IpEVsOMC400HtLLhFQRTcgQRoBhqNhAZ1gnE/Eo44YlGMn34MXxOSnBNRPhpZg5gMhiPAcccujUdqb0o59GyIpaiAaRezbo+TpUr2omGjEkcohg9iZ7KM0OCmYvukOfXZHhsmLQwQ6IYTqEPGWnEO1C3y09QXJ3JFyUg2A05sZJxYHFcEjBcQCbyhbsV53yCEYe4H4HxTbe0It8DEYgYib/MQMx1TxuigC5hDB5BabRzEhAkn3gboa5RV4B9iHtKEitxPkCRKJno/vqlGQeRngEhw71CR13EaSNNbkrSok2IQSm0suxQHqfT/s/QkSKK9tVnmmjqBTNUnVWumhQuDiNLFA1+KHrAKPR3wnLbt/BDjEQnqIpo5pNFIMfqZDxwPzAg/JxI0ogBF0KyRj//DPoKBCnoShc0UZwmeFSU8ECKBVh6AIZIElColLwY3eGDKvwmSzAfdmaHurGOpyPnRy5L6v1roFyOS1idzgDSwJBk8UN23mn3Q1AGjBhU+qVeyGITuQnMA9yZj5BFIsEutMCqwS2hq7QusHcIuVtmwmrFFF/17aETcMG/QU1MDDLpaJZVviR1ljoIx13r3AWYObX35xB2Mt7amXYuoQL8mPPW+xf1cwtxjYO4FyrDE0QGT8HD3Wj9gohgEQHoHVSdtKeBPhB4kvdcCPw54wCmKxhFIWjJfpEk4TWgStgkILzIaWyTBDElB0uJJ5AMYn0mdoKABPgOSb7h7Nst8aQije0AkMFDjz/hGB5h/wy5l7Uxy3mtpnuWxcJES9sKrDai45mRqBpLV59Q6vQyP73CrFia8DVRKYMjiFAA70FNmaAI40Xbd89QdjrhBibwumE+BJvElCaiLQyeG804kyezoSJcqHIEkJJLjgUjEGcn4IukvHU6yMRwMEVyVSMS6xKcXtMq/Y6Ei6XDLMoNB6ESQUJBgRt+xo6RiZNtRkIj2Bq3fAgkMIJt2O1l/HXGMFfyYkfYBnBbyVtcY5GovOlgJx7+Rv1Vr7MHdnf5vhxe6PVbH/9CL1rEFtDhwU24t12ppqcRzgJ+y/wDHUftbmDweSf9gK7Amw1X6kxGzis1rSWLEymySxCCWQbd4/fhYB8rWJIkiTPQXifni2PHAJLFJ3F3SfybJ7lJ0HRmYKLAoERNsFCF9jXIXpDejmyypfPZIvt1og8T0J6T8SyHlI4XB0pSCVqNe0AoMYPG0IHTmR5HRBgJRkk+PQ8r/mlfySki50zal2ND5FxhlgdeZsjDknl6f6XQ4f7tcDP9v/rSsO42a+REAAAAASUVORK5CYII=';
function mfuPrintHtml(R, F){
  var e = function(v){ return esc(v == null ? '' : String(v)); };
  var tbl = function(head, rows){ return '<table><thead><tr>' + head.map(function(h){ return '<th>' + e(h) + '</th>'; }).join('') + '</tr></thead><tbody>'
    + (rows.length ? rows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + e(c) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + head.length + '">—</td></tr>') + '</tbody></table>'; };
  var FF = '"Abar Mid","Readex Pro","Segoe UI",Tahoma,Arial,sans-serif';   /* (V31.4) كان اسمُه F فيطمس معاملَ الخطوط المرفوعة — فلا يُضمَّن خطُّ «أبار» في الـPDF أبدًا */
  return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>' + e(mfuFileName('pdf')) + '</title>'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;600;700&display=swap">'
    + '<style>' + fontsFace(F) + '@page{size:A4 landscape;margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}'
    + 'body{font-family:' + FF + ';color:#163E35;background:#FBF7F4;margin:0}'
    + '.pg{position:relative;width:297mm;min-height:210mm;padding:14mm 16mm 18mm;page-break-after:always;background:#FBF7F4}'
    + '.cover{background:#F6EDE3;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}'
    + '.cover .logo{position:absolute;top:12mm;right:16mm;height:22mm}'
    + '.cover h1{font-size:40pt;margin:0 0 4mm;color:#000;font-weight:700}.cover h2{font-size:20pt;color:#D7A562;margin:0 0 3mm;font-weight:400}.cover p{color:#D7A562;font-size:12pt;margin:1mm 0}'
    + 'h3{color:#D7A562;font-size:22pt;margin:0 0 6mm;text-align:right;font-weight:700}'
    + 'table{width:100%;border-collapse:collapse;font-size:10.5pt;background:#fff}th{background:#163E35;color:#fff;padding:2.2mm;text-align:right;font-weight:600}td{border-bottom:1px solid #E6DED4;padding:1.8mm 2.2mm}tr:nth-child(even) td{background:#FAF6F3}'
    + '.ft{position:absolute;bottom:8mm;left:16mm;right:16mm;display:flex;justify-content:space-between;color:#D7A562;font-size:8.5pt}'
    + '.end{background:#000;display:flex;align-items:center;justify-content:center}.end h1{color:#D7A562;font-size:54pt;margin:0}.end .logo{position:absolute;top:12mm;right:16mm;height:22mm;filter:brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(5deg)}'
    + '</style></head><body>'
    + '<div class="pg cover"><img class="logo" src="' + MOH_LOGO + '" alt=""><h1>التقدم في الأعمال — بطاقة نسك</h1><h2>مركز معلومات الحج والعمرة</h2><p>' + e(R.hijri) + ' · ' + e(R.greg) + '</p>'
    + '<div class="ft"><span>' + e(R.greg) + '</span><span>haj.gov.sa</span></div></div>'
    + MFU.sections.map(function(sc, i){ return '<div class="pg"><h3>' + e(mfuSecTitle(R, sc)) + '</h3>' + tbl(sc[2], mfuRowsOf(R, sc[0]))
        + '<div class="ft"><span>' + e(R.greg) + ' \u00b7 ' + (i + 2) + '</span><span>haj.gov.sa \u00b7 صدر من نظام قارئات أفاقي ' + e(R.ver) + '</span></div></div>'; }).join('')
    + '<div class="pg end"><img class="logo" src="' + MOH_LOGO + '" alt=""><h1>شكرًا</h1></div>'
    + '</body></html>';
}
function mfuPdf(){
  var R0 = mfuReport(); if (!expGate('PDF', mfuReportCheck(R0))) return false;   /* (V28.9) */
  var win = null;
  try { win = window.open('', '_blank'); } catch (e){ win = null; }   /* تُفتح النافذةُ في الضغطة نفسِها — ثم يُكتب فيها بعد تحميل الخط */
  var go = function(F){
    var html = mfuPrintHtml(R0, F);
    var doPrint = function(w){ var p = function(){ try { w.focus(); w.print(); } catch (e){ LS_ERR = e; } };
      try { if (w.document && w.document.fonts && w.document.fonts.ready) w.document.fonts.ready.then(function(){ setTimeout(p, 150); }); else setTimeout(p, 350); } catch (e){ setTimeout(p, 350); } };
    if (win && win.document){ win.document.open(); win.document.write(html); win.document.close(); doPrint(win); }
    else {
      var fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0;inset-inline-start:-9999px'; document.body.appendChild(fr);
      fr.srcdoc = html; fr.onload = function(){ doPrint(fr.contentWindow); setTimeout(function(){ fr.remove(); }, 60000); };
    }
    return html.length;
  };
  logEvent('تصديرُ التحديث الأسبوعي — PDF', ''); toast(t('اختر «حفظ كـ PDF» في نافذة الطباعة'));
  if (CFG.fonts && CFG.fonts.r) return go(CFG.fonts);
  fontsLoad().then(go);
  return true;
}
function zipMany(files){
  var enc = new TextEncoder(), parts = [], central = [], off = 0;
  var u32 = function(v){ return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }, u16 = function(v){ return [v & 255, (v >>> 8) & 255]; };
  files.forEach(function(f){
    var nb = enc.encode(f.name), bytes = typeof f.data === 'string' ? enc.encode(f.data) : f.data, cr = crc32(bytes);
    var lf = [].concat([80,75,3,4], u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(cr), u32(bytes.length), u32(bytes.length), u16(nb.length), u16(0));
    parts.push(new Uint8Array(lf), nb, bytes);
    central.push({ nb:nb, cr:cr, len:bytes.length, off:off });
    off += lf.length + nb.length + bytes.length;
  });
  var cdStart = off, cd = [];
  central.forEach(function(c){ var h = [].concat([80,75,1,2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(c.cr), u32(c.len), u32(c.len), u16(c.nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.off)); cd.push(new Uint8Array(h), c.nb); off += h.length + c.nb.length; });
  var end = new Uint8Array([].concat([80,75,5,6], u16(0), u16(0), u16(central.length), u16(central.length), u32(off - cdStart), u32(cdStart), u16(0)));
  var all = parts.concat(cd, [end]), n = 0; all.forEach(function(p){ n += p.length; });
  var out = new Uint8Array(n), p0 = 0; all.forEach(function(p){ out.set(p, p0); p0 += p.length; });
  return out;
}
function mfuDocxXml(R){
  var x = function(v){ return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var run = function(txt, o){ o = o || {}; return '<w:r><w:rPr><w:rFonts w:ascii="Alexandria" w:hAnsi="Alexandria" w:cs="Alexandria"/>' + (o.b ? '<w:b/><w:bCs/>' : '') + (o.c ? '<w:color w:val="' + o.c + '"/>' : '') + '<w:sz w:val="' + (o.sz || 20) + '"/><w:szCs w:val="' + (o.sz || 20) + '"/><w:rtl/></w:rPr><w:t xml:space="preserve">' + x(txt) + '</w:t></w:r>'; };
  var para = function(txt, o){ o = o || {}; return '<w:p><w:pPr><w:bidi/><w:spacing w:after="' + (o.after == null ? 120 : o.after) + '"/><w:jc w:val="' + (o.jc || 'right') + '"/></w:pPr>' + run(txt, o) + '</w:p>'; };
  var cell = function(txt, head, w){ return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (head ? '<w:shd w:val="clear" w:color="auto" w:fill="163E35"/>' : '') + '</w:tcPr><w:p><w:pPr><w:bidi/><w:spacing w:after="0"/><w:jc w:val="right"/></w:pPr>' + run(txt, head ? { b:1, c:'FFFFFF', sz:18 } : { sz:18 }) + '</w:p></w:tc>'; };
  var table = function(head, rows){
    var W = 14400, w = Math.floor(W / head.length);
    var b = '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="D6A561"/><w:bottom w:val="single" w:sz="4" w:color="D6A561"/><w:insideH w:val="single" w:sz="2" w:color="E0E0E0"/></w:tblBorders>';
    return '<w:tbl><w:tblPr><w:bidiVisual/><w:tblW w:w="' + W + '" w:type="dxa"/>' + b + '</w:tblPr><w:tblGrid>' + head.map(function(){ return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>'
      + '<w:tr><w:trPr><w:tblHeader/></w:trPr>' + head.map(function(h){ return cell(h, true, w); }).join('') + '</w:tr>'
      + (rows.length ? rows : [head.map(function(){ return '—'; })]).map(function(r){ return '<w:tr>' + r.map(function(c){ return cell(c, false, w); }).join('') + '</w:tr>'; }).join('') + '</w:tbl>';
  };
  var body = para('التحديث الدوري — مسار القارئات', { b:1, sz:48, c:'163E35', jc:'center', after:80 })
    + para('مشروع بطاقة نسك', { sz:30, c:'C8943E', jc:'center', after:60 })
    + para(R.hijri + ' — ' + R.greg, { sz:22, c:'86432B', jc:'center', after:360 })
    + MFU.sections.map(function(sc){ return para(mfuSecTitle(R, sc), { b:1, sz:30, c:'C8943E', after:80 }) + table(sc[2], mfuRowsOf(R, sc[0])) + para('', { after:200 }); }).join('')
    + para('صدر من نظام قارئات أفاقي — ' + R.ver + ' — ' + R.greg, { sz:16, c:'7F8C8D' });
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body
    + '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/><w:bidi/></w:sectPr></w:body></w:document>';
}
function mfuDocx(){
  try { return mfuDocx0(); } catch (e){ softErr('docx', e, ''); toast(t('تعذّر التصدير')); return false; }
}
/* ═══ (V28.9) فحصُ الملف قبل نزوله ═══
   قرارُ المالك: «الأرقامُ والحروفُ اللي جوّه تبقى كلُّها صحيحة — لازم يكون فيه فحصٌ للملف قبل ما ينزل». نزل عرضٌ فيه
   «NaN» وأعمدةٌ مزاحة (بعد إضافة عمود ضابط الاتصال) ولم يمنعه شيء. صار كلُّ تصديرٍ (باوربوينت ووورد وإكسل وPDF) يُفحَص
   قبل التنزيل: بياناتُ التقرير نفسُها (لا نصَّ مكسورًا: NaN أو undefined أو [object…] أو نائبٌ باقٍ أو حرفٌ تالف، وعددُ
   خانات كلِّ صفٍّ = عددُ أعمدته، والنسبُ بين صفرٍ ومئة)، ثم الملفُّ المبنيُّ (شرائحُ سليمةُ البناء وكلُّ عنصرٍ داخل الشريحة).
   وأيُّ خطأٍ يوقف التنزيلَ ويُعرَض فوق أزرار التصدير ويُسجَّل في الأحداث. */
EXP.chk = null;
function expDigits(v){ return String(v == null ? '' : v).replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 1632); }).replace(/[\u06F0-\u06F9]/g, function(d){ return String(d.charCodeAt(0) - 1776); }); }
function expBadText(v){ var x = String(v == null ? '' : v); var m = x.match(/\bNaN\b|\bundefined\b|\[object [A-Za-z]+\]|\bInfinity\b|\{\{[A-Z]+\}\}|\uFFFD/); return m ? m[0] : ''; }
function mfuReportCheck(R){
  var iss = [];
  (R.kpis || []).forEach(function(k){ var b = expBadText(k[1]) || expBadText(k[2]); if (b) iss.push(t('المؤشر') + ' «' + k[0] + '»: ' + b); });
  MFU.sections.forEach(function(sc){
    var head = sc[2], rows = mfuRowsOf(R, sc[0]) || [];
    rows.forEach(function(r, i){
      if (!Array.isArray(r)){ iss.push(sc[1] + ' — ' + t('صفٌّ غيرُ صالح')); return; }
      if (r.length !== head.length) iss.push(sc[1] + ' — ' + t('الصفّ') + ' ' + (i + 1) + ': ' + r.length + ' ' + t('خانة والأعمدةُ') + ' ' + head.length);
      r.forEach(function(c, j){
        var b = expBadText(c); if (b) iss.push(sc[1] + ' — «' + (head[j] || '?') + '» ' + t('في الصفّ') + ' ' + (i + 1) + ': ' + b);
        var cs = expDigits(c); if (/^\s*-?[\d.]+\s*[\u066A%]\s*$/.test(cs)){ var n = parseFloat(cs); if (isFinite(n) && (n < 0 || n > 100)) iss.push(sc[1] + ' — «' + (head[j] || '?') + '» ' + t('نسبةٌ خارج المدى') + ': ' + c); }
      });
    });
  });
  /* اتّساقُ الأرقام: في كلِّ شركةٍ المستهدفُ = المنجزُ + المتبقي + المتعثر، والنسبةُ = المنجزُ ÷ المستهدف */
  (R.cos || []).forEach(function(r, i){ var n = +expDigits(r[2]), a = +expDigits(r[3]), b = +expDigits(r[4]), p = parseFloat(expDigits(r[6]));   /* (V29.1) مخيماتُها = تم مسحها + المتبقي، والنسبة = الممسوح ÷ المخيمات */
    if ([n, a, b].every(isFinite) && n !== a + b) iss.push(t('شركات الخدمة') + ' — ' + r[0] + ': ' + t('المخيمات لا تساوي الممسوح والمتبقي'));
    if (isFinite(n) && n > 0 && isFinite(p) && Math.abs(p - Math.round(a / n * 100)) > 1) iss.push(t('شركات الخدمة') + ' — ' + r[0] + ': ' + t('نسبة المسح لا تطابق الممسوح'));
  });
  (R.svd || []).forEach(function(r){ var n = +r[2], a = +r[3], b = +r[4]; if ([n, a, b].every(isFinite) && n !== a + b) iss.push(t('المسح الميداني') + ' — ' + r[0] + ' · ' + r[1] + ': ' + t('الإجمالي لا يساوي الممسوح والمتبقي')); });
  (R.jmr || []).forEach(function(r){ var n = +r[1], a = +r[2], b = +r[3], c = +r[4]; if ([n, a, b, c].every(isFinite) && n !== a + b + c) iss.push(t('منشأة الجمرات') + ' — ' + r[0] + ': ' + t('النقاط لا تساوي المؤكَّدة وما تحتاج زيارةً أخرى وغيرَ المزورة')); });   /* (V29.2) */
  if (R.sv && R.svz){ var zt = 0; R.svz.forEach(function(r){ zt += +r[1] || 0; }); if (zt !== R.sv.O.tot) iss.push(t('المسح الميداني') + ': ' + t('مجموع المشاعر لا يساوي الإجمالي')); }
  return iss;
}
function pptxCheck(out){
  var iss = [], dec = new TextDecoder(), W = 12192000 + 25000, H = 6858000 + 25000, P = (typeof DOMParser === 'function') ? new DOMParser() : null;
  out.forEach(function(e){
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(e.name)) return;
    var x = e.text != null ? e.text : dec.decode(e.raw), sn = e.name.replace(/^.*slide(\d+)\.xml$/, '$1');
    if (P && P.parseFromString(x, 'application/xml').getElementsByTagName('parsererror').length) iss.push(t('الشريحة') + ' ' + sn + ': ' + t('بناءٌ غيرُ سليم'));
    (x.match(/<a:t>[^<]*<\/a:t>/g) || []).forEach(function(tt){ var b = expBadText(tt.slice(5, -6)); if (b) iss.push(t('الشريحة') + ' ' + sn + ': «' + tt.slice(5, -6).slice(0, 40) + '»'); });
    x.replace(/<a:off x="(\d+)" y="(\d+)"\/><a:ext cx="(\d+)" cy="(\d+)"/g, function(m, a, b, c, d){ if (+a + +c > W || +b + +d > H) iss.push(t('الشريحة') + ' ' + sn + ': ' + t('عنصرٌ خارج حدود الشريحة')); return m; });
  });
  return iss;
}
function expGate(kind, iss){
  EXP.chk = { kind:kind, at:Date.now(), n:iss.length, issues:iss.slice(0, 25) };
  if (!iss.length) return true;
  logEvent('تصديرٌ أوقفه فحصُ الملف — ' + kind + ' · ' + iss.length + ' خطأ', '');
  toast(t('أُوقف التصدير: في الملف') + ' ' + nm(iss.length) + ' ' + t('خطأ — التفاصيلُ فوق أزرار التصدير'));
  try { render(1); } catch (e){ LS_ERR = e; }
  return false;
}
function mfuDocx0(){
  var R = mfuReport();
  if (!expGate('وورد', mfuReportCheck(R))) return false;   /* (V28.9) */
  var files = [
    { name:'[Content_Types].xml', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
    { name:'_rels/.rels', data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
    { name:'word/document.xml', data:mfuDocxXml(R) }];
  var ok = dl(new Blob([zipMany(files)], { type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), mfuFileName('docx'));
  if (ok){ logEvent('تصديرُ التحديث الأسبوعي — وورد', ''); toast(t('صُدّر ملفُّ وورد')); }
  return ok;
}
/* ═══ باوربوينت من قالب العرض الأصلي (V20.4) ═══
   templates/weekly-readers.pptx: شرائحُ مسار القارئات من «التحديث الدوري لمشروع بطاقة
   نسك» مقصوصةً (٣٫٩ ميجا): الغلاف بتاريخين نائبين، والفاصل، وثماني شرائحِ محتوى بعنوان
   العرض وشعاره وعنصرٍ نائبٍ للجسم، والشكر — بقوالبه وخلفياته وخطوطه المضمَّنة (Alexandria
   وAbar Mid). الشرائحُ مخزَّنةٌ بلا ضغطٍ في القالب فتُقرأ بلا فكّ، وسائرُ الأجزاء تُنسَخ
   بضغطها كما هي — فالناتجُ بحجم القالب ويُبنى في لحظة. يُحمَّل القالبُ مرةً ويُخبَّأ. */
EXP.pptxTpl = null;
function pptxTemplate(){
  if (EXP.pptxTpl) return Promise.resolve(EXP.pptxTpl);
  return fetch('templates/ministry-unified.pptx').then(   /* (V28.8) القالبُ الموحَّدُ للوزارة */function(r){ if (!r.ok) throw new Error('tpl ' + r.status); return r.arrayBuffer(); })
    .then(function(b){ EXP.pptxTpl = new Uint8Array(b); return EXP.pptxTpl; });
}
function ooxRead(u8){
  /* قراءةُ الأعداد بايتًا بايتًا بلا DataView — يعمل في كلِّ متصفّحٍ وفي بيئة الفحص */
  var g16 = function(o){ return u8[o] | (u8[o + 1] << 8); }, g32 = function(o){ return (u8[o] | (u8[o + 1] << 8) | (u8[o + 2] << 16) | (u8[o + 3] << 24)) >>> 0; };
  var e = u8.length - 22;
  while (e >= 0 && g32(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('zip');
  var n = g16(e + 10), p = g32(e + 16), out = [], dec = new TextDecoder();
  for (var i = 0; i < n; i++){
    var method = g16(p + 10), crc = g32(p + 16), cs = g32(p + 20), us = g32(p + 24), nl = g16(p + 28), xl = g16(p + 30), cl = g16(p + 32), lo = g32(p + 42);
    var name = dec.decode(u8.subarray(p + 46, p + 46 + nl)), ds = lo + 30 + g16(lo + 26) + g16(lo + 28);
    out.push({ name:name, method:method, crc:crc, csize:cs, usize:us, raw:u8.subarray(ds, ds + cs) });
    p += 46 + nl + xl + cl;
  }
  return out;
}
/* يكتب ZIP من مدخلاتٍ خام (بضغطها الأصليّ) أو نصوصٍ جديدة (مخزّنة) */
function ooxWrite(entries){
  var enc = new TextEncoder(), parts = [], cen = [], off = 0;
  var u32 = function(v){ return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }, u16 = function(v){ return [v & 255, (v >>> 8) & 255]; };
  entries.forEach(function(f){
    var nb = enc.encode(f.name), raw, method, crc, cs, us;
    if (f.text != null){ raw = enc.encode(f.text); method = 0; crc = crc32(raw); cs = us = raw.length; }
    else { raw = f.raw; method = f.method; crc = f.crc; cs = f.csize; us = f.usize; }
    var lh = [].concat([80,75,3,4], u16(20), u16(0x0800), u16(method), u16(0), u16(0), u32(crc), u32(cs), u32(us), u16(nb.length), u16(0));
    parts.push(new Uint8Array(lh), nb, raw); cen.push({ nb:nb, method:method, crc:crc, cs:cs, us:us, off:off }); off += lh.length + nb.length + raw.length;
  });
  var cd0 = off;
  cen.forEach(function(c){ var h = [].concat([80,75,1,2], u16(20), u16(20), u16(0x0800), u16(c.method), u16(0), u16(0), u32(c.crc), u32(c.cs), u32(c.us), u16(c.nb.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.off)); parts.push(new Uint8Array(h), c.nb); off += h.length + c.nb.length; });
  parts.push(new Uint8Array([].concat([80,75,5,6], u16(0), u16(0), u16(cen.length), u16(cen.length), u32(off - cd0), u32(cd0), u16(0))));
  var size = 0; parts.forEach(function(q){ size += q.length; });
  var out = new Uint8Array(size), at = 0; parts.forEach(function(q){ out.set(q, at); at += q.length; });
  return out;
}
/* ── رسمٌ بلغة العرض (EMU؛ الشريحة ١٨٬٢٨٨٬٠٠٠ × ١٠٬٢٨٧٬٠٠٠) ── */
var PX_ID = 1000;
function pxE(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function pxRun(txt, o){ o = o || {}; return '<a:r><a:rPr lang="ar-SA" sz="' + (o.sz || 1600) + '"' + (o.b ? ' b="1"' : '') + ' dirty="0"><a:solidFill><a:srgbClr val="' + (o.c || '163E35') + '"/></a:solidFill><a:latin typeface="Abar Mid"/><a:ea typeface="Abar Mid"/><a:cs typeface="Abar Mid"/></a:rPr><a:t>' + pxE(txt) + '</a:t></a:r>'; }
function pxP(txt, o){ o = o || {}; return '<a:p><a:pPr algn="' + (o.al || 'r') + '" rtl="1"/>' + pxRun(txt, o) + '</a:p>'; }
function pxBox(x, y, w, h, paras, o){
  o = o || {}; var id = ++PX_ID;
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="Box ' + id + '"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="' + Math.round(x) + '" y="' + Math.round(y) + '"/><a:ext cx="' + Math.round(w) + '" cy="' + Math.round(h) + '"/></a:xfrm><a:prstGeom prst="' + (o.geom || 'roundRect') + '"><a:avLst/></a:prstGeom>'
    + (o.fill ? '<a:solidFill><a:srgbClr val="' + o.fill + '"/></a:solidFill>' : '<a:noFill/>')
    + (o.line ? '<a:ln w="' + (o.lw || 12700) + '"><a:solidFill><a:srgbClr val="' + o.line + '"/></a:solidFill></a:ln>' : '<a:ln><a:noFill/></a:ln>')
    + '</p:spPr><p:txBody><a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" anchor="' + (o.anchor || 'ctr') + '" rtlCol="1"><a:normAutofit/></a:bodyPr><a:lstStyle/>' + (paras || '<a:p><a:endParaRPr lang="ar-SA"/></a:p>') + '</p:txBody></p:sp>';
}
function pxTable(x, y, w, head, rows, o){
  o = o || {}; var id = ++PX_ID, wt = o.cols || head.map(function(){ return 1; }), sw = wt.reduce(function(a, b){ return a + b; }, 0), rh = o.rh || 520000;
  var cw = wt.map(function(k){ return Math.floor(w * k / sw); });
  var cell = function(v, hd, i){ var t0 = v && typeof v === 'object' ? v.t : v, c = hd ? 'FFFFFF' : (v && v.c) || '163E35', bg = hd ? (o.hf || '163E35') : (v && v.bg) || (i % 2 ? 'FAF6F3' : 'FFFFFF');
    return '<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>' + pxP(t0, { sz:hd ? (o.hsz || 1500) : (o.sz || 1400), b:hd || (v && v.b), c:c }) + '</a:txBody><a:tcPr marL="91440" marR="91440" marT="45720" marB="45720" anchor="ctr"><a:lnB w="6350"><a:solidFill><a:srgbClr val="E0E0E0"/></a:solidFill></a:lnB><a:solidFill><a:srgbClr val="' + bg + '"/></a:solidFill></a:tcPr></a:tc>'; };
  var body = (rows.length ? rows : [head.map(function(){ return '—'; })]).map(function(r, i){ return '<a:tr h="' + rh + '">' + r.map(function(v){ return cell(v, false, i); }).join('') + '</a:tr>'; }).join('');
  return '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="' + id + '" name="Table ' + id + '"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>'
    + '<p:xfrm><a:off x="' + Math.round(x) + '" y="' + Math.round(y) + '"/><a:ext cx="' + Math.round(w) + '" cy="' + (rh * ((rows.length || 1) + 1)) + '"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr rtl="1" firstRow="1" bandRow="1"/><a:tblGrid>'
    + cw.map(function(c){ return '<a:gridCol w="' + c + '"/>'; }).join('') + '</a:tblGrid><a:tr h="' + rh + '">' + head.map(function(h){ return cell(h, true, 0); }).join('') + '</a:tr>' + body + '</a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
}
var PX = { X0:1100000, W:16100000, Y0:1850000 };
/* (V28.8) ملاحظةُ «تحديثات المنصة»: خطوطُ العرض غيرُ المعتمدة — والقالبُ الموحَّدُ للوزارة لكلِّ التقارير. المولِّدُ يرسم على
   مقاس القالب القديم (٢٠×١١٫٢٥ بوصة) والموحَّدُ ١٣٫٣٣×٧٫٥ — النسبةُ نفسُها، فيُصغَّر كلُّ موضعٍ ومقاسٍ وحجمِ خطٍّ بالثلثين
   فتبقى الشريحةُ كما صُمِّمت، والخطُّ «Abar Mid» كما في القالب. */
var PX_K = 12192000 / 18288000;
function pxScale(xml, k){
  var sc = function(v){ return Math.round(+v * k); };
  return String(xml)
    .replace(/<a:(off|chOff) x="(\d+)" y="(\d+)"/g, function(m, tg, x, y){ return '<a:' + tg + ' x="' + sc(x) + '" y="' + sc(y) + '"'; })
    .replace(/<a:(ext|chExt) cx="(\d+)" cy="(\d+)"/g, function(m, tg, x, y){ return '<a:' + tg + ' cx="' + sc(x) + '" cy="' + sc(y) + '"'; })
    .replace(/<a:gridCol w="(\d+)"/g, function(m, w){ return '<a:gridCol w="' + sc(w) + '"'; })
    .replace(/<a:tr h="(\d+)"/g, function(m, h){ return '<a:tr h="' + sc(h) + '"'; })
    .replace(/ sz="(\d+)"/g, function(m, z){ return ' sz="' + Math.max(800, Math.round(+z * k / 50) * 50) + '"'; })
    .replace(/ (marL|marR|marT|marB)="(\d+)"/g, function(m, a, v){ return ' ' + a + '="' + sc(v) + '"'; });
}
function pxLvl(p){ p = parseInt(p, 10) || 0; return p >= 75 ? { c:'1E8449', bg:'E8F6EE' } : p >= 40 ? { c:'8A6D0B', bg:'FDF3D9' } : { c:'A93226', bg:'FBE7E4' }; }
function pxCards(items, y, h){
  var n = items.length, gap = 220000, w = (PX.W - gap * (n - 1)) / n;
  return items.map(function(it, i){ var x = PX.X0 + PX.W - (i + 1) * w - i * gap;   /* من اليمين */
    return pxBox(x, y, w, h, pxP(it[0], { sz:1500, b:1, c:'C8943E' }) + pxP(it[1], { sz:it[4] || 3600, b:1, c:it[3] || '163E35' }) + (it[2] ? pxP(it[2], { sz:1200, c:'7F8C8D' }) : ''), { fill:'FAF6F3', line:'D6A561' }); }).join('');
}
function mfuSlides(R){
  var dl = function(k){ return k == null ? '' : (k > 0 ? '▲ +' + k : k < 0 ? '▼ ' + k : '=') + ' عن الأسبوع الماضي'; };
  var K = R.kpis, S = [];
  S.push(['ملخص مسار القارئات', pxCards(K.slice(0, 4).map(function(k){ return [k[0], k[1], [k[2], dl(k[3])].filter(Boolean).join(' · ')]; }), PX.Y0, 2600000)
    + pxCards(K.slice(4).map(function(k){ return [k[0], k[1], '']; }), PX.Y0 + 3000000, 2200000)
    + (R.upd.length ? pxTable(PX.X0, PX.Y0 + 5450000, PX.W, ['متى', 'النوع', 'البند', R.updTitle && /اجتماع/.test(R.updTitle) ? 'ما تغيّر منذ آخر اجتماع' : 'آخر التحديثات هذا الأسبوع', 'بواسطة'], R.upd.slice(0, 5).map(function(u){ return [u[0], u[1], u[2], u[3], u[4]]; }), { cols:[1, 1.1, 3, 4.2, 1.3], rh:340000, sz:1000, hsz:1100 })
       : pxBox(PX.X0, PX.Y0 + 5500000, PX.W, 700000, pxP('صدر من نظام قارئات أفاقي — ' + R.ver + ' — ' + R.greg, { sz:1300, c:'7F8C8D' }), { geom:'rect' }))]);
  /* (V29.1) المسحُ الميدانيُّ: نظرةٌ عامةٌ ثم المشعرُ والنوع */
  var SV = R.sv || svStats(), so = SV.O, pcv = function(v){ var n = parseInt(v, 10) || 0; return { t:String(v), c:pxLvl(n).c, bg:pxLvl(n).bg, b:1 }; };
  S.push(['المسح الميداني — نظرة عامة', pxCards([['نسبة المسح', SV.pct + '٪', so.sv + ' من ' + so.tot, '1E8449'], ['تمت الزيارة', String(so.sv), 'نقطة', '163E35'], ['المتبقي', String(so.tot - so.sv), 'نقطة لم تُمسح بعد', '8A6D0B'], ['فيها تحديات', String(so.chal), 'من الممسوحة', 'A93226'], ['تحتاج زيارة أخرى', String(so.unreach), 'تحتاج زيارةً أخرى', 'A93226']], PX.Y0, 1900000)
    + pxTable(PX.X0, PX.Y0 + 2350000, PX.W, ['المشعر', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'تحتاج زيارة أخرى'], SV.zones.map(function(r){ return [{ t:r[0], b:1 }, r[1], r[2], r[3], pcv(r[4]), r[5] ? { t:String(r[5]), c:'A93226', b:1 } : '0', r[6] ? { t:String(r[6]), c:'A93226' } : '0']; }), { cols:[2.2, 1, 1, 1, 1, 1.2, 1.2], rh:600000, sz:1500, hsz:1500 })]);
  S.push(['المسح الميداني — المشعر والنوع', pxTable(PX.X0, PX.Y0, PX.W, ['المشعر', 'النوع', 'الإجمالي', 'تمت الزيارة', 'المتبقي', 'النسبة', 'فيها تحديات', 'أبرز تحدٍّ'], SV.detail.slice(0, 16).map(function(r){ return [{ t:r[0], b:1 }, r[1], r[2], r[3], r[4], pcv(r[5]), r[6] ? { t:String(r[6]), c:'A93226', b:1 } : '0', r[7]]; }), { cols:[1.3, 1.6, 0.9, 0.9, 0.9, 0.9, 1, 3.3], rh:470000, sz:1150, hsz:1200 })]);
  var JM = jmrConfirm(), jt = JM.tot;   /* (V29.2) */
  S.push(['منشأة الجمرات — تأكيد النقاط بالمسح', pxCards([['نسبة التأكيد', (jt.n ? Math.round(jt.ok / jt.n * 100) : 0) + '٪', jt.ok + ' من ' + jt.n, '1E8449'], ['مؤكَّدة بالمسح', String(jt.ok), 'وصلها المسح', '163E35'], ['لم تُزر', String(jt.no), 'تحتاج زيارة', '8A6D0B'], ['تحتاج زيارة أخرى', String(jt.un), 'تحتاج زيارة أخرى', 'A93226'], ['فيها تحديات', String(jt.ch), 'من المؤكَّدة', 'A93226']], PX.Y0, 1900000)
    + (JM.rows.length ? pxTable(PX.X0, PX.Y0 + 2350000, PX.W, ['الدور', 'النقاط', 'مؤكَّدة بالمسح', 'تحتاج زيارة أخرى', 'لم تُزر', 'فيها تحديات', 'نسبة التأكيد'], JM.rows.map(function(r, i){ var last = i === JM.rows.length - 1; return [{ t:r[0], b:1 }, r[1], { t:String(r[2]), c:'1E8449', b:1 }, r[3] ? { t:String(r[3]), c:'A93226', b:1 } : '0', r[4] ? { t:String(r[4]), c:'8A6D0B', b:1 } : '0', r[5] ? { t:String(r[5]), c:'A93226' } : '0', last ? { t:r[6], b:1 } : pcv(r[6])]; }), { cols:[1.8, 1, 1.3, 1.2, 1, 1.2, 1.2], rh:560000, sz:1400, hsz:1400 })
       : pxBox(PX.X0, PX.Y0 + 2400000, PX.W, 700000, pxP('لا نقاطَ لمنشأة الجمرات في النطاق', { sz:1400, c:'7F8C8D' }), { geom:'rect' }))]);
  var stc = function(v){ return v === 'مكتمل' ? { t:v, c:'1E8449', b:1 } : v === 'متأخر' ? { t:v, c:'A93226', b:1 } : v === 'جارٍ' ? { t:v, c:'8A6D0B', b:1 } : v; };
  var stc2 = function(v){ v = String(v || ''); return /مكتمل/.test(v) ? { t:v, c:'1E8449', b:1 } : /متوقف|متأخر/.test(v) ? { t:v, c:'A93226', b:1 } : /جاري|جارٍ/.test(v) ? { t:v, c:'8A6D0B', b:1 } : v; };
  S.push(['حالة أبرز مهام مسار القارئات', pxTable(PX.X0, PX.Y0, PX.W, ['المهمة', 'المسار', 'المسؤول', 'الحالة', 'الاستحقاق', 'التحديث', 'مرتبطة بـ'], R.tasks.slice(0, 11).map(function(r){ return [r[0], r[1] || '—', r[2] || '—', stc2(r[3]), r[4] || '—', r[5] || '—', r[6] ? (/^✓/.test(r[6]) ? { t:r[6], c:'1E8449', b:1 } : { t:r[6], c:'A93226' }) : '—']; }), { cols:[3, 1.2, 1.3, 1.3, 1.2, 2.6, 1.8], sz:1100, rh:560000 })]);
  var B4 = R.blocks, col4 = function(k, color, i){ var L = B4.filter(function(r){ return r[0] === k; }).slice(0, 7), gap = 180000, w = (PX.W - 3 * gap) / 4, x = PX.X0 + PX.W - (i + 1) * w - i * gap, y = PX.Y0 + 1750000;
      return pxBox(x, y, w, 520000, pxP(k + ' · ' + B4.filter(function(r){ return r[0] === k; }).length, { sz:1500, b:1, c:'FFFFFF', al:'ctr' }), { fill:color })
        + pxBox(x, y + 560000, w, 5300000, L.length ? L.map(function(r){ return pxP('• ' + r[1], { sz:1200, b:1, c:'163E35' }) + pxP(r[2], { sz:1000, c:'7F8C8D' }); }).join('') : pxP('—', { sz:1200, c:'7F8C8D', al:'ctr' }), { fill:'FAF6F3', line:'D6A561', anchor:'t' }); };
  var bk = R.blk || {}, dlt = (bk.done || 0) - (bk.doneLast || 0);
  S.push(['المســـار | القارئات', pxCards([['أُنجز هذا الأسبوع', String(bk.done || 0), (dlt > 0 ? '▲ +' : dlt < 0 ? '▼ ' : '') + dlt + ' عن الأسبوع الماضي', '1E8449'], ['مستحقٌّ خلال ٧ أيام', String(bk.next || 0), ''], ['متأخرة', String(bk.late || 0), '', 'A93226'], ['متوقفة أو بانتظار قرار', String(bk.wait || 0), '', '8A6D0B']].concat(bk.meet ? [['آخر اجتماع', dayKey(bk.meet.at), bk.meet.n + ' تغييرًا منذه', '163E35', 2200]] : []), PX.Y0, 1500000)
    + col4('أبرز الأعمال المنجزة', '27AE60', 0) + col4('أبرز المهام القادمة', 'C8943E', 1) + col4('الاعتمادات والدعم المطلوب', '1C3674', 2) + col4('المهام المتأخرة', 'C0392B', 3)]);
  S.push(['حالة التركيبات', pxTable(PX.X0, PX.Y0, PX.W, ['المشعر', 'النوع', 'المستهدف', 'رُكّب', 'النسبة'], R.inst.slice(0, 12).map(function(r){ var L = pxLvl(r[4]); return [r[0], r[1], r[2], r[3], { t:r[4], c:L.c, bg:L.bg, b:1 }]; }), { cols:[1.4, 2.6, 1.2, 1.2, 1.2] })]);
  /* (V29.1) الشركاتُ بحسب المرحلة: في المسح نسبةُ المسح وما تبقّى والتحديات — لا تصنيفَ بالتركيب قبل بدئه */
  var cn = 0, csv = 0, cch = 0, cins = 0; R.cos.forEach(function(c){ cn += +c[2] || 0; csv += +c[3] || 0; cch += +c[5] || 0; cins += +c[7] || 0; });
  var weak = R.cos.slice().sort(function(a, b){ return (parseInt(a[6], 10) || 0) - (parseInt(b[6], 10) || 0) || (+b[2] || 0) - (+a[2] || 0); }).slice(0, 10);
  S.push(['شركات الخدمة — المسح والتركيب', pxCards([['نسبة مسح المخيمات', (cn ? Math.round(csv / cn * 100) : 0) + '٪', csv + ' من ' + cn, '1E8449'], ['المتبقي للمسح', String(cn - csv), 'مخيم', '8A6D0B'], ['فيها تحديات', String(cch), 'مخيم ممسوح', 'A93226'], ['التركيب', String(cins), cins ? 'مخيم' : 'لم يبدأ بعد', '163E35'], ['الشركات', String(R.cos.length), R.phase === 'survey' ? 'مرحلة المسح — لم يبدأ التواصل' : '']], PX.Y0, 1500000)
    + pxBox(PX.X0, PX.Y0 + 1580000, PX.W, 420000, pxP(R.phase === 'survey' ? 'المرحلة الحالية: المسح الميداني — التواصلُ مع الشركات والتركيبُ لم يبدآ بعد، فلا تصنيفَ لها بالتركيب. الأقلُّ مسحًا أوّلًا، والكلُّ في ملف الإكسل' : 'دليل نسبة الإنجاز: ممتاز ٧٥٪ فأكثر · متوسط ٤٠–٧٤٪ · ضعيف أقل من ٤٠٪ — الأضعفُ أوّلًا، والكلُّ في ملف الإكسل', { sz:1200, c:'7F8C8D' }), { geom:'rect' })
    + pxTable(PX.X0, PX.Y0 + 2050000, PX.W, ['الشركة', 'ضابط الاتصال', 'مخيماتها', 'تم مسحها', 'متبقٍّ للمسح', 'فيها تحديات', 'نسبة المسح', 'الحالة'], weak.map(function(r){ var L = pxLvl(r[6]); return [r[0], r[1], r[2], r[3], r[4], r[5] ? { t:String(r[5]), c:'A93226', b:1 } : '0', { t:r[6], c:L.c, bg:L.bg, b:1 }, { t:r[8], c:'7F8C8D' }]; }), { cols:[3, 1.6, 0.9, 0.9, 1, 1, 1, 2.6], rh:470000, sz:1200 })]);
  S.push(['بيان المعوقات وتصنيفها', pxCards([['إجمالي المعوقات', String(R.obsTotal), 'نقطةٌ لم تُركَّب وفيها عائق', 'A93226']].concat(R.parties.map(function(p){ return ['تُعالَج من خلال ' + p[0], String(p[1]), '']; })), PX.Y0, 1900000)
    + pxTable(PX.X0, PX.Y0 + 2300000, PX.W, ['الفئة', 'العدد', 'الجهة المعالجة'], R.cats.slice(0, 9), { cols:[4, 1, 2] })]);
  S.push(['التحديات / آليات المعالجة', R.chal.length ? pxTable(PX.X0, PX.Y0, PX.W, ['المصدر', 'التحدي', 'على مين', 'من سيحلّه', 'آلية المعالجة', 'الحالة'], R.chal.slice(0, 9).map(function(r){ return [r[0], r[1], r[2], r[3], r[4], /تم الحل|مغلق/.test(r[5]) ? { t:r[5], c:'1E8449', b:1 } : { t:r[5], c:'A93226', b:1 }]; }), { cols:[1.4, 3, 1.3, 1.4, 3, 1.6], hf:'86432B', rh:640000, sz:1200 })
    : pxBox(PX.X0, PX.Y0 + 2000000, PX.W, 1400000, pxP('لا تحدياتٍ مسجّلةٌ هذا الأسبوع', { sz:2400, b:1, c:'86432B', al:'ctr' }), { fill:'FAF6F3', line:'D6A561' })]);
  S.push(['تحديث حالة طلبات الوزارة', R.req.length ? pxTable(PX.X0, PX.Y0, PX.W, ['#', 'الوصف', 'الإفادة / آخر تحديث', 'المقترح / الدعم المطلوب', 'الحالة'], R.req.slice(0, 8).map(function(r){ return [String(r[0]), r[1], r[2] || '—', r[3] || '—', /منجز/.test(r[4]) ? { t:r[4], c:'1E8449', b:1 } : r[4]]; }), { cols:[0.5, 3, 3, 2.4, 1.1], rh:700000, sz:1300 })
    : pxBox(PX.X0, PX.Y0 + 2000000, PX.W, 1400000, pxP('لا طلباتٍ مسجّلةٌ هذا الأسبوع', { sz:2400, b:1, c:'163E35', al:'ctr' }), { fill:'FAF6F3', line:'D6A561' })]);
  var D = R.daily.slice().reverse(), mx = Math.max.apply(null, D.map(function(d){ return Math.max(d[1], d[2]); }).concat([1]));
  var cw = PX.W / Math.max(1, D.length), base = PX.Y0 + 6600000, hmax = 5400000, bars = '';
  D.forEach(function(d, i){ var x = PX.X0 + PX.W - (i + 1) * cw, bw = cw * 0.34, hi = d[2] / mx * hmax, hs = d[1] / mx * hmax;   /* (V24.0) الصفُّ: اليوم، المسح، التركيب، الفك، المتعذر */
    bars += pxBox(x + cw * 0.12, base - hi, bw, Math.max(1, hi), '', { geom:'rect', fill:'27AE60' }) + pxBox(x + cw * 0.12 + bw, base - hs, bw, Math.max(1, hs), '', { geom:'rect', fill:'D6A561' })
      + pxBox(x, base - Math.max(hi, hs) - 420000, cw, 400000, pxP(String(d[2]), { sz:1200, b:1, c:'1E8449', al:'ctr' }), { geom:'rect' })
      + pxBox(x, base + 60000, cw, 400000, pxP(String(d[0]).slice(5), { sz:1100, c:'7F8C8D', al:'ctr' }), { geom:'rect' }); });
  S.push(['ملخص العمل اليومي — آخر ١٤ يومًا', bars + pxBox(PX.X0, base + 560000, PX.W, 420000, pxP('■ التركيب (أخضر) · ■ المسح (ذهبي) — الرقمُ فوق العمود عددُ التركيبات', { sz:1200, c:'7F8C8D' }), { geom:'rect' })]);
  return S;
}
function mfuPptx(){
  toast(t('يُجهَّز العرضُ من قالب الوزارة…'));
  return pptxTemplate().then(function(tpl){
    var R = mfuReport(), E = ooxRead(tpl), dec = new TextDecoder(), slides = mfuSlides(R), chk = mfuReportCheck(R);   /* (V28.9) */
    var order = ['2','3','4','5','6','7','8','9','10','11','12','13'].map(function(k){ return 'ppt/slides/slide' + k + '.xml'; });   /* (V29.2) اثنتا عشرة شريحة بتأكيد الجمرات */   /* (V28.8، و٢٩٫١ إحدى عشرة شريحة بالمسح) شرائحُ المحتوى في القالب الموحَّد */
    var out = E.map(function(e){
      if (e.method !== 0 || !/^ppt\/slides\/slide\d+\.xml$/.test(e.name)) return e;
      var x = dec.decode(e.raw);
      if (e.name === 'ppt/slides/slide1.xml') return { name:e.name, text:x.replace('{{H}}', pxE(R.hijri)).replace('{{G}}', pxE(R.greg)) };
      var k = order.indexOf(e.name); if (k < 0) return e;
      PX_ID = 1000;
      var sl = slides[k];
      x = x.replace('{{T}}', pxE(sl[0])).replace(/<p:sp><p:nvSpPr><p:cNvPr id="990" name="BODY"\/>[\s\S]*?<\/p:sp>/, function(){ return pxScale(sl[1], PX_K); });
      return { name:e.name, text:x };
    });
    if (!expGate('باوربوينت', chk.concat(pptxCheck(out)))) return false;   /* (V28.9) فحصُ الملف قبل نزوله */
    var ok = dl(new Blob([ooxWrite(out)], { type:'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), mfuFileName('pptx'));
    if (ok){ logEvent('تصديرُ التحديث الأسبوعي — باوربوينت', ''); toast(t('صُدّر العرض')); }
    return ok;
  }).catch(function(e){ softErr('pptx', e, ''); toast(t('تعذّر تحميلُ قالب العرض — تحقّق من الشبكة')); return false; });
}
function expScopeRow(){
  var ids = expScopeIds(), n = ids ? ids.length : (STATE.sites || []).length;
  var opt = function(list, cur, blank){ return '<option value="">' + esc(t(blank)) + '</option>' + list.map(function(v){ return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(t(v)) + '</option>'; }).join(''); };
  var chip = function(m, l){ return '<button type="button" class="chip' + (EXP.scope.m === m ? ' on' : '') + '" data-expscope="' + m + '">' + esc(l) + '</button>'; };
  return '<div class="chips" style="margin:8px 0 0;align-items:center"><span class="hint" style="margin:0">' + esc(t('نطاقُ الملف')) + ':</span>'
    + chip('all', t('كلُّ النقاط')) + chip('tax', t('مشعرٌ ونوع')) + chip('sel', t('المحدَّدُ على الخريطة') + ' (' + nm(SEL_N) + ')')
    + (EXP.scope.m === 'tax' ? '<select data-expsg="1" style="max-width:170px">' + opt(TAX_G, EXP.scope.g, 'كلُّ المشاعر') + '</select><select data-expst="1" style="max-width:170px">' + opt(TAX_T, EXP.scope.t, 'كلُّ الأنواع') + '</select>' : '')
    + (EXP.scope.m === 'sel' && !SEL_N ? btn('\u2611 ' + t('حدِّد من الخريطة'), 'btn-quiet btn-sm', ' data-expselgo="1"') : '')
    + '<span class="pill ' + (n ? 'acc' : 'wrn') + '">' + nm(n) + ' ' + esc(t('نقطة في الملف')) + '</span></div>';
}
function mfuExportBar(){
  return '<div class="card" style="margin:0 0 12px"><div class="actions" style="align-items:center">'
    + '<b style="color:#C8943E">\u2B07 ' + esc(t('تصدير التحديث الأسبوعي')) + '</b>'
    + btn('PowerPoint', 'btn-primary btn-sm', ' data-mfuexp="pptx"') + btn('Word', 'btn-secondary btn-sm', ' data-mfuexp="docx"') + btn('Excel', 'btn-secondary btn-sm', ' data-mfuexp="xlsx"') + btn('PDF', 'btn-secondary btn-sm', ' data-mfuexp="pdf"')
    + (mfuFltLabel() ? '<span class="pill wrn">' + esc(t('بفلتر')) + ': ' + esc(mfuFltLabel()) + ' \u2014 ' + esc(t('أزل الفلتر لتصدير الكلّ')) + '</span>' : '')   /* (V27.3) */
    + '<span class="hint" style="margin:0">' + esc(t('من الجهاز نفسِه — لحظي، بالأرقام الحالية')) + '</span></div>'
    + expScopeRow()   /* (V29.0) */
    + (EXP.chk && EXP.chk.n ? '<div class="alert warn" style="margin:8px 0 0"><b>' + esc(t('أوقف الفحصُ آخرَ تصدير')) + ' (' + esc(EXP.chk.kind) + ') — ' + nm(EXP.chk.n) + ' ' + esc(t('خطأ')) + '</b><ul style="margin:4px 0 0;padding-inline-start:18px">' + EXP.chk.issues.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>'
       : (EXP.chk ? '<span class="pill ok" style="margin:8px 0 0">\u2713 ' + esc(t('آخرُ ملفٍّ اجتاز الفحص')) + ' (' + esc(EXP.chk.kind) + ')</span>' : ''))   /* (V28.9) */
    + '</div>';
}
PAGE.mfu = { m:'المتابعة', t:'متابعة الوزارة',
  l:'العرضُ الأسبوعيُّ للوزارة حيًّا — بعناوينه نفسِها: المهامُّ والتركيباتُ والشركاتُ والمعوقاتُ والتحدياتُ والطلبات.',
  body:function(){
    mfuFetch();
    if (!EXP.pptxTpl && !MFU.tplAsk && FB.ready){ MFU.tplAsk = 1; setTimeout(function(){ try { if (!(navigator.connection && navigator.connection.saveData)) pptxTemplate().catch(function(){ MFU.tplAsk = 0; }); } catch (e){ LS_ERR = e; } }, 4000); }
    var head = tabHead('mfu'), cur = tabCur('mfu');
    if (!(STATE.sites || []).length) return head + alertBox('warn', 'لا مواقع محمّلة.');
    setTimeout(ringsGrow, 30);   /* (V34.3) */
    if (cur === 'kiosk'){ setTimeout(kioskAnimate, 30); setTimeout(function(){ try { kkSatInit(); } catch (e){ softErr('kkSat', e, ''); } }, 40); return head + kioskBody(); }
    head += mfuExportBar();   /* التصديرُ على كلِّ عنوان (V20.2) */
    if (cur === 'mweek') return head + '<details class="mfu-add" open><summary>' + esc(t('حالة أبرز المهام')) + '</summary>' + mfuTasks() + '</details>' + PAGE.wtask.body();   /* (V27.1) شريحتان من مصدرٍ واحد صارتا واحدة */   /* المهامُّ الأسبوعيةُ كما هي — تُحدَّث من هنا (V20.5) */
    if (cur === 'msurv') return head + mfuSurv();   /* (V29.2) */
    if (cur === 'minst') return head + mfuInst();
    if (cur === 'mcos') return head + mfuCos();
    if (cur === 'mobs') return head + mfuObs();
    if (cur === 'mchal') return head + mfuChal();
    if (cur === 'mreq') return head + mfuReq();
    if (cur === 'mdaily') return head + mfuDaily();
    return head + mfuSummary();
  }};
/* (V27.1) كان «المعدل اليومي» شريحةً وحدَه — صار قسمًا مطويًّا في «أمس · الآن · غدًا» */
function overDailyBody(){ return '<details class="mfu-add"><summary>' + esc(t('المعدل اليومي')) + '</summary>' + (function(){
    /* كانت خمسةَ تواريخَ مكتوبةً بيدٍ وأصفارًا: تُعرَض على الوزارة فتبدو
       لوحةَ متابعةٍ وهي لا تقرأ شيئًا. الآن تُقرأ اللقطاتُ المحفوظة، فإن لم
       تُحفَظ بعدُ حُسب اليومُ من السجلات وقيل ذلك صراحةً. */
    var H = (typeof statsHistory === 'function') ? statsHistory(14) : [];
    if (!H.length){
      var S = siteStats(), day = dayKey(Date.now());
      var sv = 0, ins = 0;
      Object.keys(STATE.recs).forEach(function(k){
        if (dayKey(STATE.recs[k].at || STATE.recs[k]._at) === day && svVisited(STATE.recs[k])) sv++; });
      Object.keys(STATE.inss).forEach(function(k){
        var r = STATE.inss[k];
        if (dayKey(r.at || r._at) === day && r.status === 'مُركّب') ins++; });
      return alertBox('info','لا لقطاتٍ محفوظةً بعد — هذا يومُك أنت محسوبًا من سجلاتك.')
        + card('اليوم', table(['التاريخ','مسح','تركيب','الإجمالي'],
            [['<span class="num">' + esc(day) + '</span>', N(sv), N(ins), N(sv + ins)]]));
    }
    var tot = [0,0,0];
    var rows = H.slice().reverse().map(function(r){
      var sv = r.daySurvey || 0, ins = r.dayInstall || 0, dis = r.dayDismantle || 0;
      tot[0] += sv; tot[1] += ins; tot[2] += dis;
      return ['<span class="num">' + esc(r.day) + '</span>', N(sv), N(ins), N(dis),
              N(sv + ins + dis), N(r.dayBlocked || 0)];
    });
    return card('آخر ' + nm(rows.length) + ' يومًا',
        table(['التاريخ','مسح','تركيب','فك','الإجمالي','تعذّر'], rows,
              ['الإجمالي', N(tot[0]), N(tot[1]), N(tot[2]), N(tot[0]+tot[1]+tot[2]), '']))
      + '<p class="hint">' + esc(t('اللقطةُ تُكتَب من جهاز المكتب مرةً كلَّ ربع ساعة — فما لم يُزامَن بعدُ لا يظهر هنا.')) + '</p>';
  })() + '</details>'; }
PAGE.over = { m:'المتابعة', t:'نظرة عامة',
  l:'تقدّمُ المشروع من كلِّ زاوية — الصورةُ والتوزيعُ والوتيرةُ والمعدلُ اليوميُّ والتركيب.',
  body:function(){
    var head = tabHead('over'), cur = tabCur('over');
    if (cur === 'svdash') return head + svdashBody();
    if (cur === 'now') return head + overDailyBody() + (function(){   /* (V27.1) المعدلُ اليومي صار قسمًا هنا */
    /* الوزارةُ تسأل ثلاثةَ أسئلةٍ لا تجيبها لوحةٌ واحدة: ماذا انتهى؟ ماذا يجري
       الآن ومن يفعله وأين؟ وماذا سيحدث غدًا؟ فصارت شاشةً واحدةً بثلاثة
       أعمدةٍ تُقرأ من السجلات والمهام لحظيًّا — لا من أرقامٍ تُكتَب. */
    var S = siteStats(), DAY = 86400000, now = Date.now();
    var today = dayKey(now), yday = dayKey(now - DAY), tmr = dayKey(now + DAY);
    var Y = dayDone(yday), T0 = dayDone(today);
    /* المهامُّ المفتوحة: بمشرفها، وما تمّ منها اليوم، وما جُدول لغد */
    var bySup = {}, open = 0, tmrN = 0, bySupTmr = {}, byZoneTmr = {}, lateN = 0;
    Object.keys(STATE.tasks).forEach(function(k){
      var x = STATE.tasks[k];
      if (!x || x.status === 'معتمد') return;
      open++;
      var who = x.to || '\u2014', st = siteFind(x.site), r = STATE.recs[x.site];
      var g = bySup[who] = bySup[who] || { n:0, doneToday:0, wait:0, rev:0 };
      g.n++;
      var rv = svReview(r);
      if (rv === 'revisit') g.rev++;
      else if (svVisited(r)){ if (dayKey(r.at || r._at) === today) g.doneToday++; }   /* (V32.6) */
      else g.wait++;
      if (x.when === tmr){ tmrN++; bySupTmr[who] = (bySupTmr[who] || 0) + 1; if (st) byZoneTmr[st.zone] = (byZoneTmr[st.zone] || 0) + 1; }
      if (x.when && x.when < today && !svVisited(r)) lateN++;
    });
    /* أين نحن اليوم: زياراتُ اليوم بالمشعر */
    var zoneToday = {};
    Object.keys(STATE.recs).forEach(function(k){
      var r = STATE.recs[k]; if (dayKey(r.at || r._at) !== today || !svVisited(r)) return;
      var st = siteFind(k); if (st) zoneToday[st.zone] = (zoneToday[st.zone] || 0) + 1;
    });
    var sups = Object.keys(bySup).sort(function(a, b){ return bySup[b].n - bySup[a].n; });
    var col = function(title, inner){ return '<div>' + card(title, inner) + '</div>'; };
    return (rankOf(ROLE) >= rankOf('supervisor')
              ? '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الحضور'),'btn-secondary btn-sm',' data-xls="attendance"') + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('التركيبات'),'btn-secondary btn-sm',' data-xls="installs"') + '</div>' : '')
      + attTeamCard()
      + (may('approve') ? inboxCard() : '')
      + stepsCard(10)
      + '<div class="grid cols-3" style="align-items:start">'
      + col('\u2705 ' + t('ما انتهى'),
          stats([['أمس — مسح', N(Y.sv), Y.sv ? 'ok' : ''], ['أمس — تركيب', N(Y.ins), Y.ins ? 'ok' : ''],
                 ['أمس — فك', N(Y.dis)]])
          + table(['حتى الآن','العدد','من'], [
              [esc(t('زيارات معتمدة')), N(S.approved), N(S.total)],
              [esc(t('زيارات تمّت')), N(S.surveyed), N(S.total)],
              [esc(t('مُركّب')), N(S.installed), N(S.total)]])
          + meter('نسبة المسح', S.surveyed, S.total) + meter('نسبة التركيب', S.installed, S.total))
      + col('\u26A1 ' + t('الآن — اليوم'),
          stats([['اليوم — مسح', N(T0.sv), T0.sv ? 'acc' : ''], ['اليوم — تركيب', N(T0.ins), T0.ins ? 'acc' : ''],
                 ['تنتظر الاعتماد', N(S.pending), S.pending ? 'wrn' : ''],
                 ['متأخّرة عن موعدها', N(lateN), lateN ? 'bad' : '']])
          + (sups.length
            ? table(['المشرف','مُسند','تمّ اليوم','بانتظار','مردود'], sups.slice(0, 12).map(function(sp){
                var g = bySup[sp];
                return [esc(dispName(sp)), N(g.n), N(g.doneToday), N(g.wait), g.rev ? '<b>' + nm(g.rev) + '</b>' : N(0)];
              }))
            : '<p class="hint" style="margin:0">' + esc(t('لا مهامَّ مفتوحةً الآن — لم يُسنَد شيءٌ بعد.')) + '</p>')
          + (Object.keys(zoneToday).length
            ? '<p class="hint" style="margin:8px 0 0"><b>' + esc(t('أين نحن اليوم')) + ':</b> '
              + Object.keys(zoneToday).map(function(z){ return esc(t(z)) + ' <span class="num">' + nm(zoneToday[z]) + '</span>'; }).join(' \u00b7 ') + '</p>'
            : ''))
      + col('\u{1F4C5} ' + t('غدًا — المجدول'),
          stats([['نقاطٌ مجدولةٌ لغد', N(tmrN), tmrN ? 'acc' : ''], ['مشرفون', N(Object.keys(bySupTmr).length)]])
          + (tmrN
            ? table(['المشرف','نقاط'], Object.keys(bySupTmr).map(function(sp){ return [esc(dispName(sp)), N(bySupTmr[sp])]; }))
              + '<p class="hint" style="margin:8px 0 0"><b>' + esc(t('بالمشعر')) + ':</b> '
              + Object.keys(byZoneTmr).map(function(z){ return esc(t(z)) + ' <span class="num">' + nm(byZoneTmr[z]) + '</span>'; }).join(' \u00b7 ') + '</p>'
            : '<p class="hint" style="margin:0">' + esc(t('لا شيءَ مجدولٌ لغد بعد — تُجدوَل النقاطُ بموعدها من الخريطة أو «توزيع الفرق».')) + '</p>'))
      + '</div>'
      + '<div class="actions" style="margin-top:12px">'
      + btn('\u{1F5FA} ' + t('على الخريطة'),'btn-secondary btn-sm',' data-p="map"')
      + (may('approve') ? btn('\u2705 ' + t('اعتماد الزيارات'),'btn-primary btn-sm',' data-p="svappr"') : '')
      + btn('\u2753 ' + t('كيف تسير الدورة؟'),'btn-quiet btn-sm',' data-p="wf"')
      + '</div>'
      + '<p class="hint">' + esc(t('الخريطةُ تلوّن الدورةَ كلَّها: لم يُزر · مُسند · مجدولٌ غدًا · تحتاج زيارةً أخرى · تمت وتنتظر الاعتماد · معتمدة.')) + '</p>';
  })();
    if (cur === 'reg') return head + (function(){
    /* كان جدولًا محفورًا صحيحًا يومَ كُتب. ويبقى صحيحًا حتى يُسجَّل موقعٌ
       جديدٌ واحد — ثم يكذب ولا يقول. يُحسَب من السجلات. */
    var S = siteStats(), rows = [];
    Object.keys(S.byKey).forEach(function(k){
      var p = k.split('|');
      rows.push([p[0], (CAT_DEF[p[1]] || {}).l || p[1], S.byKey[k]]);
    });
    rows.sort(function(a, b){ return b[2] - a[2]; });
    return card('التوزيع', table(['المشعر','النوع','العدد','النسبة'],
      rows.map(function(r){
        return [esc(t(r[0])), esc(t(r[1])), N(r[2]),
                nm(Math.round(r[2] / (S.total || 1) * 100)) + '٪'];
      }), ['الإجمالي','', N(S.total), '١٠٠٪']));
  })();
    if (cur === 'pace') return head + (function(){
    /* كانت تنبيهًا دائمًا «لم تُضبط المواعيد» وأصفارًا مكتوبةً بيد، لأن صفحةَ
       المواعيد لم تكن تحفظ شيئًا. صارت تقرأ الموعدين من CFG وتجيب سؤالَ
       «هنلحق؟» بالأرقام: المتبقّي، والمطلوبُ يوميًّا لبلوغ الموعد، ومعدّلُ
       آخر سبعة أيامٍ كما سُجّل، والانتهاءُ المتوقّعُ على هذا المعدل. */
    var S = siteStats(), DAY = 86400000, now = Date.now();
    var dueS = cfgGet('dueSurvey'), dueI = cfgGet('dueInstall');
    var doneOn = dayDone;
    var y = doneOn(dayKey(now - DAY)), w = { sv:0, ins:0 };
    for (var d = 1; d <= 7; d++){ var o = doneOn(dayKey(now - d * DAY)); w.sv += o.sv; w.ins += o.ins; }
    function daysTo(due){ return due ? Math.ceil((due - now) / DAY) : 0; }
    function stage(name, left, due, avg7, yday){
      var days = daysTo(due), avg = avg7 / 7;
      var need = !due ? 0 : (days > 0 ? Math.ceil(left / days) : left);
      var finish = avg > 0 && left > 0 ? now + Math.ceil(left / avg) * DAY : (left > 0 ? 0 : now);
      var late = due && finish && finish > due;
      var verdict = !left ? ['اكتملت', 'ok']
        : !due ? ['لا موعدَ مضبوطًا', 'wrn']
        : !avg ? ['لا إنجازَ في آخر سبعة أيام — لا يُحسَب موعدٌ متوقّع', 'bad']
        : late ? ['على هذا المعدل تتأخّر عن موعدها', 'bad'] : ['على هذا المعدل تلحق موعدَها', 'ok'];
      return card(name,
          stats([['المتبقّي', N(left), left ? '' : 'ok'],
                 ['الموعد', due ? '<span class="num">' + esc(dayKey(due)) + '</span>' : '—', due ? '' : 'wrn'],
                 ['أيامٌ للموعد', due ? N(Math.max(0, days)) : '—', due && days <= 0 && left ? 'bad' : ''],
                 ['المطلوب يوميًّا', due ? N(need) : '—'],
                 ['معدل آخر ٧ أيام', nm(Math.round(avg * 10) / 10)],
                 ['المنجز أمس', N(yday)],
                 ['الانتهاء المتوقع', finish ? '<span class="num">' + esc(dayKey(finish)) + '</span>' : '—', late ? 'bad' : (finish ? 'ok' : '')]])
        + alertBox(verdict[1] === 'ok' ? 'success' : (verdict[1] === 'bad' ? 'error' : 'warn'), verdict[0]));
    }
    return (!dueS || !dueI
      ? alertBox('warn', 'موعدٌ أو أكثرُ لم يُضبط بعد — يُكتب في «التخطيط ← المواعيد والأزمنة» فتُحسَب الوتيرةُ عليه.')
      : '')
      + stage('المسح', S.total - S.surveyed, dueS, w.sv, y.sv)
      + stage('التركيب', S.total - S.installed, dueI, w.ins, y.ins)
      + '<p class="hint">' + esc(t('المعدلُ من اللقطات اليومية المحفوظة، وما لم تُحفَظ لقطتُه يُحسَب من السجلات التي على هذا الجهاز.')) + '</p>';
  })();
    if (cur === 'inst') return head + (function(){
    var tot = { notStarted:0, blocked:0, scheduled:0, installed:0 };
    var byType = Object.create(null);

    STATE.sites.forEach(function(x){
      var ty = x.type || 'أخرى';
      if (!byType[ty]) byType[ty] = { notStarted:0, blocked:0, scheduled:0, installed:0, total:0 };
      byType[ty].total++;
      var r = STATE.recs[x.id];
      var ins = STATE.inss[x.id];
      if (ins && ins.status === 'مُركّب' && ins.approved){
        tot.installed++; byType[ty].installed++; return;
      }
      if (!svDone(r)){
        if (r){ tot.blocked++; byType[ty].blocked++; }
        else { tot.notStarted++; byType[ty].notStarted++; }
        return;
      }
      /* مُسحت بنجاح ولم تُركَّب بعد — سواءٌ جُدولت لفريقٍ أو لم تُجدوَل بعد،
         فكلتاهما «جاهزةٌ أو مجدولة» من منظور المتابعة الإدارية. */
      tot.scheduled++; byType[ty].scheduled++;
    });

    return stats([['لم يُزَر', N(tot.notStarted)],
                  ['متعذّر', N(tot.blocked), tot.blocked ? 'bad' : 'ok'],
                  ['مُسح — جاهزٌ أو مجدول', N(tot.scheduled), 'wrn'],
                  ['مُركّب معتمد', N(tot.installed), 'ok']])

      + card('حسب نوع النقطة — كم خلص فعليًّا',
          table(['النوع','لم يُزَر','متعذّر','جاهز/مجدول','مُركّب','الإجمالي'],
            Object.keys(byType).map(function(ty){
              var b = byType[ty];
              return [typeLabel(ty), N(b.notStarted), N(b.blocked), N(b.scheduled),
                      '<b>' + nm(b.installed) + '</b>', N(b.total)];
            }),
            ['<b>' + t('الإجمالي') + '</b>', N(tot.notStarted), N(tot.blocked), N(tot.scheduled),
             '<b>' + nm(tot.installed) + '</b>', N(STATE.sites.length)]))

      + card('دورة التركيب', flow(['لم يبدأ','مسح','جدولة','مُركّب'], 0)
        + '<p class="hint">' + esc(t('النقطة لا تدخل الجدولة إلا بعد مسحها بنجاح، ولا تُحسَب مُركّبةً إلا بعد اعتماد قطعها في «التدقيق الهندسي».')) + '</p>');
  })();
    /* «نظرة عامة» شاشةُ الوزارة الأولى — يبدأ فيها آخرُ ما تمّ */
    return head + stepsCard(8) + (function(){
    var K = siteKeyStats();
    if (OVER_ZONE && !K.zones[OVER_ZONE]) OVER_ZONE = '';
    var S = OVER_ZONE ? K.zones[OVER_ZONE] : K.total, zl = OVER_ZONE ? t(OVER_ZONE) : t('كلُّ المشاعر');
    var pc = S.n ? Math.round(S.sv / S.n * 100) : 0;
    /* «لم يُزر» = بلا سجلٍّ أصلًا؛ والمتعذّرُ له عدُّه — كما في صفحة المتابعة والخريطة */
    return card(t('المسحُ بالمشعر') + ' \u2014 ' + zl,
          '<p class="hint" style="margin-top:0">' + esc(t('اختر مشعرًا لتقرأ أرقامَه وحدَه — وبلا اختيارٍ الأرقامُ للكلِّ نسبًا من الكلّ.')) + '</p>'
          + overZoneCards(K))
      + stats([['إجمالي المواقع', N(S.n)], ['تمت الزيارة', N(S.sv), 'acc'], ['متبقٍّ', N(S.n - S.sv), S.n - S.sv ? 'wrn' : 'ok'],
               ['مُركّب', N(S.ins), 'ok'], ['لم يُزر', N(S.noRec)], ['متعذّر', N(S.stuck), S.stuck ? 'wrn' : '']])
      + card(t('تقدّم المشروع') + ' \u2014 ' + zl, meter('تقدّم المسح من إجمالي المواقع', S.sv, S.n)
                            + meter('نسبة التركيب من إجمالي المشروع', S.ins, S.n)
                            + '<p class="hint">' + esc(t('أُنجز')) + ' <b class="num">' + nm(pc) + '٪</b> \u00b7 ' + esc(t('وبقي')) + ' <b class="num">' + nm(100 - pc) + '٪</b>'
                            +   ' (' + nm(S.n - S.sv) + ' ' + esc(t('نقطة')) + ')</p>')
      + cardFlush('المشاعرُ كلُّها — كم أُنجز وكم بقي',
          /* ستةُ أعمدةٍ لتقرأ على الهاتف: النسبةُ في خلية المسح */
          table(['المشعر','المواقع','تمت الزيارة','متبقٍّ','مُركّب','متعذّر'],
            Object.keys(K.zones).sort(function(a, b){ return K.zones[b].n - K.zones[a].n; }).map(function(z){
              var o = K.zones[z];
              return ['<button class="btn btn-quiet btn-sm" data-ovz="' + esc(z) + '">' + esc(t(z)) + '</button>',
                      N(o.n), N(o.sv) + ' <span class="hint" style="margin:0">' + nm(o.n ? Math.round(o.sv / o.n * 100) : 0) + '٪</span>', N(o.n - o.sv), N(o.ins), N(o.stuck)];
            }),
            ['الإجمالي', N(K.total.n), N(K.total.sv) + ' <span class="hint" style="margin:0">' + nm(K.total.n ? Math.round(K.total.sv / K.total.n * 100) : 0) + '٪</span>', N(K.total.n - K.total.sv), N(K.total.ins), N(K.total.stuck)]))
      + cardFlush(t('التوزيع حسب المشعر والنوع') + (OVER_ZONE ? ' \u2014 ' + zl : ''),
          table(['المشعر','النوع','العدد','تمت الزيارة','مُركّب'],
            K.keys.filter(function(k){ return !OVER_ZONE || k.split('|')[0] === OVER_ZONE; }).map(function(k){
              var p = k.split('|'), n = K.by[k], v = K.sv[k] || 0;
              return [esc(t(p[0])), esc(t(p[1])), N(n), N(v) + ' <span class="hint" style="margin:0">' + nm(n ? Math.round(v / n * 100) : 0) + '٪</span>', N(K.ins[k] || 0)];
            }),
            ['الإجمالي','', N(S.n), N(S.sv) + ' <span class="hint" style="margin:0">' + nm(pc) + '٪</span>', N(S.ins)]))
      /* كانت بعد فاصلةٍ منقوطةٍ في غير موضعها — تُحسَب ولا تُعاد، فلم تظهر قطّ */
      + card('المخرجات الورقية',
          '<div class="actions">'
          + btn('⬇ '+t('الملخص التنفيذي — إكسل'),'btn-primary btn-sm',' data-xls="over"')
          + btn('🖨 '+t('طباعة'),'btn-secondary btn-sm',' data-print="1"')
          + '</div>');
  })();
  }};







PAGE.survey = { m:'الميدان', t:'متابعة العمل الميداني',
  l:'دورةُ النقطة كلُّها — مسحُها واعتمادُها وحلُّها وتدقيقُ تركيبها، وما أفاد به الميدان وما تعثّر.',
  body:function(){
    var head = tabHead('survey'), cur = tabCur('survey');
    if (cur === 'qa') return head + (function(){
    var wait = Object.keys(STATE.inss).filter(function(k){
      return STATE.inss[k].status === 'مُركّب' && !STATE.inss[k].approved;
    });
    var done = Object.keys(STATE.inss).filter(function(k){ return STATE.inss[k].approved; });
    return stats([['بانتظار التدقيق', N(wait.length), wait.length?'wrn':''],
                  ['معتمد', N(done.length), 'ok'],
                  ['مسودّات', N(Object.keys(STATE.inss).filter(function(k){
                      return STATE.inss[k].status === 'مسودّة'; }).length)],
                  ['نقاط معتمدة', N(done.reduce(function(a,k){ return a + (STATE.inss[k].pts||0); }, 0))]])
      + (wait.length
        ? cardFlush(t('بانتظار قرارك') + ' — ' + nm(wait.length),
            table(['النقطة','المنفِّذ','القطع','النقاط','الوقت',''],
              wait.slice(0, 30).map(function(k){
                var r = STATE.inss[k], s = siteFind(k);
                return ['<strong>' + esc(k) + '</strong><br><span class="hint" style="margin:0">'
                          + esc((s && s.name) || '') + '</span>',
                        esc(r.by), N(Object.keys(r.parts || {}).length), N(r.pts || 0),
                        '<span class="num">' + fmtTime(r.at, { hour:'2-digit', minute:'2-digit' }) + '</span>',
                        '<div class="actions">'
                        + btn('اعتمد','btn-primary btn-sm',' data-appr="' + esc(k) + '"')
                        + btn('ردّ','btn-danger btn-sm',' data-rej="' + esc(k) + '"') + '</div>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا تركيبات بانتظار التدقيق.')) + '</p>'))
      + card('قاعدة الاعتماد',
          flow(['تركيب مُبلَّغ','مراجعة الصور','مطابقة السيريال','معتمد'], 0)
          + '<p class="hint">' + esc(t('الردُّ يُعيد النقطة لمنفّذها بحالة «مُعاد» مع سبب — ولا تُحتسب نقاطُها حتى تُعتمد.')) + '</p>');
  })();
    if (cur === 'ncr') return head + (function(){
    var open = NCRS.filter(function(x){ return x.st !== 'مغلق' && x.st !== 'ملغى'; });
    return stats([['بلاغات', N(NCRS.length)],
                  ['مفتوحة', N(open.length), open.length ? 'wrn' : 'ok'],
                  ['مغلقة', N(NCRS.length - open.length), 'ok'],
                  ['متوسط الإغلاق', NCRS.length ? N(3) + ' ' + t('يوم') : '—']])

      /* الوزارةُ تقرأ البلاغاتِ ولا تفتحها — فتحُها وإغلاقُها من يملك التعديل */
      + (may('edit') ? card('بلاغ جديد',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
          + '<input id="ncrSite" placeholder="NSK-…" dir="ltr"></div>'
          + '<div class="field"><label>' + esc(t('الفئة')) + '</label>'
          + '<select id="ncrCat">'
          + ['تركيبٌ مخالفٌ للمواصفة','قطعةٌ غيرُ معتمدة','توصيلٌ كهربائيٌّ خاطئ',
             'ارتفاعٌ غيرُ مطابق','توثيقٌ ناقص','سيريالٌ غيرُ مطابق']
              .map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الخطورة')) + '</label>'
          + '<select id="ncrSev">'
          + ['جوهري','متوسط','طفيف'].map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '</div>'
          + '<div class="field"><label>' + esc(t('الوصف')) + '</label>'
          + '<textarea id="ncrWhy" rows="2"></textarea></div>',
          btn('افتح بلاغًا','btn-primary',' data-ncradd="1"')) : '')

      + (NCRS.length
        ? cardFlush('البلاغات',
            table(['#','النقطة','الفئة','الخطورة','الوصف','الحالة',''],
              NCRS.map(function(x, i){
                return ['<span class="num">NCR-' + nm(i+1) + '</span>',
                        '<span class="num">' + esc(x.site || '—') + '</span>',
                        esc(x.cat),
                        pill(x.sev, x.sev==='جوهري'?'off':(x.sev==='متوسط'?'warn':'')),
                        '<span class="hint" style="margin:0">' + esc(x.why.slice(0,40)) + '</span>',
                        pill(x.st, x.st==='مغلق'?'ok':'warn'),
                        x.st !== 'مغلق' && may('approve')
                          ? btn('أغلِق','btn-quiet btn-sm',' data-ncrok="' + i + '"') : ''];
              })),
            btn('⬇ إكسل — عدم المطابقة','btn-secondary btn-sm',' data-xls="ncr"'))
        : card('', alertBox('success','لا بلاغاتِ عدمِ مطابقةٍ مفتوحة.')))

      + card('دورة البلاغ',
          flow(['رُصد','أُبلغ','إجراءٌ تصحيحي','تُحقّق','أُغلق'], 0)
          + '<p class="hint">' + esc(t('لا تُقفَل نقطةٌ عليها بلاغٌ جوهريٌّ مفتوح — والتحقّقُ بمن لم يرتكب.')) + '</p>');
  })();
    if (cur === 'solution') return head + (function(){
    var all = Object.keys(STATE.inss).map(function(k){ return STATE.inss[k]; })
      .filter(function(r){ return r && r.solution; });
    var wait = all.filter(function(r){ return r.solution.status === 'مقترح'; });
    var done = all.filter(function(r){ return r.solution.status === 'معتمد'; });
    /* لا يُقترَح حلٌّ إلا لزيارةٍ اعتمدها المهندس — فالبياناتُ التي يُبنى
       عليها الحلُّ راجعها أحدٌ قبل أن يُشترى على أساسها */
    var surveyed = STATE.sites.filter(function(s){
      return svApproved(STATE.recs[s.id]) && !solutionOf(s.id);
    });
    var unreviewed = STATE.sites.filter(function(s){
      return svReview(STATE.recs[s.id]) === 'pending' && !solutionOf(s.id);
    }).length;

    return stats([['بانتظار الاعتماد', N(wait.length), wait.length ? 'wrn' : ''],
                  ['معتمد', N(done.length), 'ok'],
                  ['زيارةٌ معتمدةٌ بلا حلٍّ بعد', N(surveyed.length)],
                  ['زيارةٌ تنتظر اعتمادَها أولًا', N(unreviewed), unreviewed ? 'wrn' : '']])

      + (function(){
          /* الإجمالي المعتمد لموسم ١٤٤٨: كم نقطةً من كل نوعٍ خلصت حلَّها،
             وكم قطعةً من كلِّ صنفٍ ستُركَّب فعليًّا — لا تقديرَ ولا بذرة،
             مجموعُ ما اعتمده المهندس فعلًا على كل نقطة. */
          var byType = {}, itemTotals = {};
          done.forEach(function(r){
            var s = siteFind(r.id), ty = (s && s.type) || 'أخرى';
            byType[ty] = (byType[ty] || 0) + 1;
            Object.keys(r.solution.items).forEach(function(code){
              itemTotals[code] = (itemTotals[code] || 0) + cfgN(r.solution.items[code]);
            });
          });
          var types = Object.keys(byType), codes = Object.keys(itemTotals);
          if (!done.length) return '';
          return card('الإجمالي المعتمد — موسم ١٤٤٨',
              stats(types.map(function(ty){ return [typeLabel(ty), N(byType[ty]), 'acc']; }))
              + (codes.length
                ? table(['الصنف','الكمية الإجمالية المعتمدة'],
                    codes.sort(function(a,b){ return itemTotals[b] - itemTotals[a]; }).map(function(code){
                      return [esc(itemName(code)), N(Math.round(itemTotals[code]))];
                    }))
                : ''));
        })()

      + (wait.length
        ? cardFlush(t('بانتظار قرارك') + ' — ' + nm(wait.length),
            table(['النقطة','الأجهزة المقترحة','المقترِح','الوقت',''],
              wait.slice(0, 30).map(function(r){
                var s = siteFind(r.id);
                return [siteIdHtml(siteOf(r)) + '<br><span class="hint" style="margin:0">'
                          + esc(((s && s.name) || '').slice(0,28)) + '</span>',
                        Object.keys(r.solution.items).map(function(c){
                          return esc(itemName(c)) + ' \u00d7' + nm(r.solution.items[c]);
                        }).join('، '),
                        esc(r.solution.by),
                        '<span class="num">' + fmtTime(r.solution.at, { hour:'2-digit', minute:'2-digit' }) + '</span>',
                        '<div class="actions">'
                        + btn('اعتمد','btn-primary btn-sm',' data-solappr="' + esc(r.id) + '"')
                        + btn('ردّ','btn-danger btn-sm',' data-solrej="' + esc(r.id) + '"') + '</div>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا حلولَ بانتظار الاعتماد.')) + '</p>'))

      + (may('edit')
        ? card('اقتراح حلٍّ لنقطة',
            surveyed.length
              ? '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
                + '<select id="solSite">' + surveyed.map(function(s){
                    return '<option value="' + esc(s.id) + '">' + esc(siteKey(s)) + (siteKey(s) !== s.id ? ' (' + esc(s.id) + ')' : '')
                      + ' — ' + esc((s.name || '').slice(0,30)) + '</option>';
                  }).join('') + '</select></div>'
                + itemPickerHtml()
              : '<p class="hint" style="margin:0">' + esc(t('لا زيارةَ معتمدةً بلا حلٍّ الآن — اعتمد زيارةً أولًا من «اعتماد الزيارات» ثم اقترح حلَّها.')) + '</p>',
            surveyed.length ? btn('➕ اقترح الحل','btn-primary btn-sm',' data-solgo="1"') : '')
        : '')

      + '<p class="hint">' + esc(t('لا يُتاح طلبُ تركيبٍ (DR) لنقطةٍ إلا بعد اعتماد حلِّها هنا — والفكُّ (PR) لا يحتاج هذه البوابة، فما رُكِّب معروفٌ من سجله فور اختيار النقطة.')) + '</p>';
  })();
    if (cur === 'survey') return head + (function(){
    var all = surveyList();
    var S = siteStats();
    var day = dayKey();
    var weekAgo = Date.now() - 7 * 86400000;
    var todayN = all.filter(function(x){ return dayKey(x.rec.at || 0) === day; }).length;
    var weekN  = all.filter(function(x){ return (x.rec.at || 0) >= weekAgo; }).length;
    var blocked = all.filter(function(x){ return svStuck(x.rec); });
    var revisit = all.filter(function(x){ return svReached(x.rec) && x.rec.review === 'revisit'; });

    var rows = all;
    /* شريحةُ الحالة: من أراد «الزياراتِ التي تمّت» وحدها ليصدّرها أو
       يراجعها كان يقرأ الجدولَ كلَّه بعينه — فصارت تُفرَز بضغطة. */
    if (SURV_ST === 'done')  rows = rows.filter(function(x){ return x.done; });
    if (SURV_ST === 'block') rows = rows.filter(function(x){ return svStuck(x.rec); });
    if (SURV_ST === 'revisit') rows = rows.filter(function(x){ return svReached(x.rec) && x.rec.review === 'revisit'; });
    if (SURV_Q) rows = rows.filter(function(x){
      var hay = x.id + ' ' + (x.site.name || '') + ' ' + (x.rec.by || '');
      return hay.indexOf(SURV_Q) > -1;
    });

    var views = [['','الكل', all.length],
                 ['done','تم الوصول', all.length - blocked.length - revisit.length],   /* (V32.6/V32.7) «تمت الزيارة» الكلُّ بأيِّ نتيجة — و«تم الوصول» تقسيمٌ داخله بمصطلح نموذج الزيارة */
                 ['revisit','تحتاج زيارة أخرى', revisit.length],
                 ['block','متعذّر', blocked.length]];
    var html = '<div class="chips">' + views.map(function(v){
        return '<button type="button" class="chip' + (SURV_ST===v[0]?' on':'')
          + '" data-survst="' + v[0] + '">' + esc(t(v[1]))
          + ' <span class="num">' + nm(v[2]) + '</span></button>';
      }).join('') + '</div>'
      + stats([['تمت الزيارة', N(S.surveyed), 'acc'],   /* (V32.6) بأيِّ نتيجة */
                       ['لم يُزر', N(siteKeyStats().total.noRec)],
                       ['اليوم', N(todayN)], ['هذا الأسبوع', N(weekN)],
                       ['متعذّر', N(blocked.length), blocked.length ? 'wrn' : 'ok'],
                      ['تحتاج زيارة أخرى', N(revisit.length), revisit.length ? 'wrn' : '']])

      + card('بحث في السجلّ',
          '<input type="search" id="survQ" value="' + esc(SURV_Q)
          + '" placeholder="' + esc(t('ابحث بالنقطة أو الاسم أو الفني')) + '" dir="auto">',
          btn('⬇ إكسل — المسح','btn-secondary btn-sm',' data-xls="recs"'));

    if (SURV_REOPEN){
      var rx = all.filter(function(x){ return x.id === SURV_REOPEN; })[0];
      html += card('سبب تعذُّر ' + esc(SURV_REOPEN) + (rx ? ' — ' + esc((rx.site.name||'').slice(0,30)) : ''),
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('السبب')) + '</label>'
          + '<select id="reopenReason">' + SV_ACCESS.filter(function(a){ return a !== 'تم الوصول'; }).map(function(a){
              return '<option value="' + esc(a) + '">' + esc(t(a)) + '</option>'; }).join('') + '</select></div>'
          + '<div class="field"><label>' + esc(t('تفصيلٌ إضافي')) + '</label>'
          + '<input id="reopenNote" dir="auto"></div>'
          + '</div>',
          btn('تأكيد — أعِدها متعذّرة','btn-danger btn-sm',' data-svreopengo="' + esc(SURV_REOPEN) + '"')
          + btn('تراجع','btn-quiet btn-sm',' data-svreopencancel="1"'));
    }

    html += (rows.length
      ? cardFlush(t('السجلّ') + ' — ' + nm(rows.length) + ' ' + t('من') + ' ' + nm(all.length),
          table(['النقطة','الحالة','الفني','التاريخ','ملاحظة',''],
            capList(rows, 300).map(function(x){
              return [siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">'
                        + esc((x.site.name || '').slice(0, 28)) + '</span>',
                      x.done ? pill('تمت الزيارة','ok') : pill(x.rec.access || 'متعذّر','wrn'),
                      esc(dispName(x.rec.by) || '—'),
                      '<span class="num">' + esc(fmtDate(x.rec.at || 0)) + '</span>',
                      esc(x.rec.note || x.rec.reopenNote || '—'),
                      /* الوزارةُ تتابع ولا تُعيد التصنيف — والزرُّ لمن يكتب */
                      x.done && may('edit')
                        ? btn('أعِد تصنيفها كمتعذّرة','btn-quiet btn-sm',' data-svreopen="' + esc(x.id) + '"')
                        : '—'];
            })))
        + (rows.length > 300
            ? '' : '')
      : card('لا عمليات بعد',
          '<p class="hint" style="text-align:center;margin:0">'
          + esc(t('تظهر هنا فور أول مسحٍ ميداني.')) + '</p>'));

    html += '<p class="hint">' + esc(t('«أعِد تصنيفها كمتعذّرة» تُبقي بيانات الزيارة السابقة كما هي — لا حذف ولا فقدان سجلّ — لكنها تُخرجها من عِداد المُنجَز حتى تُزار ثانيةً.')) + '</p>';
    return html;
  })();
    if (cur === 'minappr') return head + (function(){
    /* ═══ اعتمادُ الوزارة لإعداد التركيب ═══
       الوزارةُ ترى ما اعتُمد تقنيًّا بصوره وبياناته (الموضعُ والتثبيتُ والكهرباءُ
       والمقاسات) وتعتمد أو تُعيد بملاحظة. والمهندسُ يرى ما أُعيد ليعالجه ويرفعه
       ثانيةً. لا يُسنَد تركيبٌ لنقطةٍ لم تمرَّ من هنا. */
    var all = surveyList().filter(function(x){ return x.rec && svReview(x.rec) === 'approved'; });
    var lists = { pending:[], returned:[], approved:[] };
    all.forEach(function(x){ var ms = minState(x.rec); if (lists[ms]) lists[ms].push(x); });
    var rows = (lists[MIN_ST] || []).slice();
    if (MIN_Q) rows = rows.filter(function(x){ return (x.id + ' ' + (x.site.name || '') + ' ' + (x.rec.by || '') + ' ' + (x.site.co || '')).indexOf(MIN_Q) > -1; });
    rows.sort(function(a, b){ return (b.rec.reviewAt || 0) - (a.rec.reviewAt || 0); });
    var views = [['pending','بانتظار اعتماد الوزارة',lists.pending.length],['returned','أعادتها الوزارة',lists.returned.length],['approved','اعتمدتها الوزارة',lists.approved.length]];
    var canMin = may('minapprove'), canEng = may('approve');
    var out = [];
    capList(rows, 150).forEach(function(x){
      var r = x.rec, isOpen = MIN_OPEN === x.id, ms = minState(r);
      out.push([siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">' + esc((x.site.name || '').slice(0, 28)) + '</span>',
                esc(t(x.site.zone || '—')) + (x.site.sq ? ' \u00b7 ' + esc(x.site.sq) : '') + '<br><span class="hint" style="margin:0">' + esc(x.site.co || '—') + '</span>',
                esc(dispName(r.by) || '—') + '<br><span class="hint num" style="margin:0">' + esc(r.at ? dayKey(r.at) : '') + '</span>',
                esc(dispName(r.reviewBy) || '—') + '<br><span class="hint num" style="margin:0">' + esc(r.reviewAt ? dayKey(r.reviewAt) : '') + '</span>',
                ms === 'approved' ? pill('اعتمدت الوزارة','ok') : (ms === 'returned' ? pill('أعادتها الوزارة','bad') : pill('بانتظار الوزارة','warn')),
                btn(isOpen ? '\u25BE ' + t('إغلاق') : '\u25B8 ' + t('راجع'), isOpen ? 'btn-quiet btn-sm' : 'btn-secondary btn-sm', ' data-minopen="' + esc(isOpen ? '' : x.id) + '"')]);
      if (isOpen){
        var meta = [['نوع التركيب', r.mount || '—'], ['مصدر الكهرباء', r.power || '—'], ['ارتفاع التركيب (م)', r.hgt != null ? String(r.hgt) : '—'],
                    ['العرض المتاح (م)', r.wid_m != null ? String(r.wid_m) : '—'], ['الارتفاع المتاح (م)', r.hgt_m != null ? String(r.hgt_m) : '—'],
                    ['طول الكابل (م)', r.cable != null ? String(r.cable) : '—'], ['تحديات التركيب', (r.chals || []).join(' \u00b7 ') || '—'],
                    ['هل الموقع مناسب', r.fit || '—'], ['الملاحظات', r.note || '—'], ['الشاخص', x.site.sign || '—']];
        if (r.minNote) meta.push([ms === 'returned' ? 'ملاحظة الوزارة' : 'ملاحظة الاعتماد', r.minNote + ' \u2014 ' + dispName(r.minBy || '') + ' \u00b7 ' + (r.minAt ? dayKey(r.minAt) : '')]);
        if (r.minResubmitNote) meta.push(['معالجة المهندس', r.minResubmitNote + ' \u2014 ' + dispName(r.minResubmitBy || '')]);
        var actions = '';
        if (canMin && ms !== 'approved')
          actions = '<div class="field" style="margin-top:10px"><label>' + esc(t('ملاحظة الوزارة')) + '</label><input data-minnote="' + esc(x.id) + '" dir="auto" placeholder="' + esc(t('اختياريةٌ عند الاعتماد — مطلوبةٌ عند الإعادة')) + '"></div>'
            + '<div class="actions" style="margin:8px 0 0">'
            + btn('\u{1F3DB} ' + t('اعتماد إعداد التركيب'),'btn-primary btn-sm',' data-minok="' + esc(x.id) + '"')
            + btn('\u21A9 ' + t('إعادة للمهندس'),'btn-secondary btn-sm',' data-minback="' + esc(x.id) + '"')
            + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(x.id) + '"') + '</div>';
        else if (canEng && ms === 'returned')
          actions = '<div class="field" style="margin-top:10px"><label>' + esc(t('ما عُولج')) + '</label><input data-minnote="' + esc(x.id) + '" dir="auto"></div>'
            + '<div class="actions" style="margin:8px 0 0">'
            + btn('\u2B06 ' + t('أعد الرفع للوزارة'),'btn-primary btn-sm',' data-minre="' + esc(x.id) + '"')
            + btn('\u{1F501} ' + t('يعود المشرف لزيارة أخرى'),'btn-secondary btn-sm',' data-stkback="' + esc(x.id) + '"')
            + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(x.id) + '"') + '</div>';
        else actions = '<div class="actions" style="margin:8px 0 0">' + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(x.id) + '"') + btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-site="' + esc(x.id) + '"') + '</div>';   /* اعتمادُ الوزارة */
        out.push({ raw:'<tr><td colspan="6" style="background:rgba(255,255,255,.03);padding:12px 14px"><div class="grid cols-2">'
          + '<div>' + table(['البند','القيمة'], meta.map(function(m){ return [esc(t(m[0])), '<span dir="auto">' + esc(m[1]) + '</span>']; })) + '</div>'
          + '<div><div class="hint" style="margin:0 0 6px">' + esc(t('صورُ الزيارة')) + ' \u00b7 ' + nm(photoCount(x.id)) + '</div>' + photoGalleryHtml(x.id) + '</div>'
          + '</div>' + actions + '</td></tr>' });
      }
    });
    return stats([['بانتظار اعتماد الوزارة', N(lists.pending.length), lists.pending.length ? 'wrn' : 'ok'],
                  ['أعادتها الوزارة', N(lists.returned.length), lists.returned.length ? 'bad' : 'ok'],
                  ['اعتمدتها الوزارة', N(lists.approved.length), 'ok']])
      + '<div class="chips">' + views.map(function(v){ return '<button type="button" class="chip' + (MIN_ST === v[0] ? ' on' : '') + '" data-minst="' + v[0] + '">' + esc(t(v[1])) + ' <span class="num">' + nm(v[2]) + '</span></button>'; }).join('') + '</div>'
      + card('', '<input type="search" data-minq value="' + esc(MIN_Q) + '" placeholder="' + esc(t('ابحث بالنقطة أو المشرف أو الشركة')) + '" dir="auto">')
      + (out.length
          ? cardFlush(t(views.filter(function(v){ return v[0] === MIN_ST; })[0][1]) + ' \u2014 ' + nm(rows.length),
              table(['النقطة','المشعر / الشركة','المشرف','الاعتماد التقني','الحالة',''], out),
              btn('\u2B07 ' + t('إكسل'),'btn-secondary btn-sm',' data-xls="minappr"'))
          : alertBox('success', 'لا نقاطَ في هذه الخانة.'))
      + '<p class="hint">' + esc(t('الدورة: زيارةُ المشرف ← الاعتمادُ التقنيُّ (المهندس) ← اعتمادُ الوزارة لإعداد التركيب ← اقتراحُ الحل واعتمادُه ← إسنادُ التركيب. لا يُسنَد تركيبٌ لنقطةٍ لم تعتمدها الوزارة.')) + '</p>';
  })();
    if (cur === 'svappr') return head + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الزيارات'),'btn-secondary btn-sm',' data-xls="visits"') + '</div>' + (function(){
    var S = siteStats();
    var all = surveyList().filter(function(x){ return x.rec && (x.rec.review || x.done); });
    var lists = { pending:[], approved:[], revisit:[] };
    all.forEach(function(x){ var rv = svReview(x.rec); if (lists[rv]) lists[rv].push(x); });
    var rows = lists[SVA_ST] || [];
    if (SVA_Q) rows = rows.filter(function(x){
      return (x.id + ' ' + (x.site.name || '') + ' ' + (x.rec.by || '')).indexOf(SVA_Q) > -1; });

    var views = [['pending','بانتظار اعتمادك', lists.pending.length],
                 ['approved','معتمدة', lists.approved.length],
                 ['revisit','تحتاج زيارة أخرى', lists.revisit.length]];
    var html = '<div class="chips">' + views.map(function(v){
        return '<button type="button" class="chip' + (SVA_ST === v[0] ? ' on' : '')
          + '" data-svast="' + v[0] + '">' + esc(t(v[1])) + ' <span class="num">' + nm(v[2]) + '</span></button>';
      }).join('') + '</div>'
      + stats([['بانتظار اعتمادك', N(S.pending), S.pending ? 'wrn' : ''],
               ['معتمدة', N(S.approved), 'ok'],
               ['تحتاج زيارة أخرى', N(S.revisit), S.revisit ? 'bad' : ''],
               ['لم يُزر', N(siteKeyStats().total.noRec)]])
      + card('بحث', '<input type="search" id="svaQ" data-svaq value="' + esc(SVA_Q) + '" placeholder="'
          + esc(t('ابحث بالنقطة أو الاسم أو المشرف')) + '" dir="auto">');

    if (!rows.length){
      return html + card('', '<p class="hint" style="text-align:center;margin:0">'
        + esc(t(SVA_ST === 'pending' ? 'لا زياراتٍ تنتظر اعتمادك — كلُّ ما زاره المشرفون رُوجع.'
              : (SVA_ST === 'approved' ? 'لا زياراتٍ معتمدةً بعد.' : 'لا زياراتٍ مردودةً — كلُّ ما رُوجع اعتُمد.'))) + '</p>');
    }
    html += rows.slice(0, 60).map(function(x){
      var r = x.rec, rv = svReview(r);
      var facts = svFacts(r);
      var so = solutionOf(x.id);
      var head0 = siteIdHtml(siteOf(x)) + ' \u2014 ' + esc((x.site.name || '').slice(0, 40))
        + ' <span class="hint" style="margin:0;display:inline">\u00b7 ' + esc(dispName(r.by) || '\u2014')
        + ' \u00b7 <span class="num">' + esc(fmtDate(r.at || 0)) + '</span>'
        + (r.round > 1 ? ' \u00b7 ' + esc(t('الجولة')) + ' <span class="num">' + nm(r.round) + '</span>' : '') + '</span>';
      var nPh = photoCount(x.id);
      var body = (r.prevNote ? alertBox('info', t('سببُ الردِّ السابق') + ': ' + r.prevNote) : '')
        + table(['البند','ما أفاد به المشرف'], facts.map(function(f){ return [esc(t(f[0])), esc(f[1])]; }))
        + '<div class="actions" style="margin:6px 0 0">' + btn('\u{1F4F7} ' + t('الصور') + ' (' + nm(nPh) + ')', (SVA_PH === x.id ? 'btn-primary' : 'btn-secondary') + ' btn-sm', ' data-svph="' + esc(x.id) + '"') + '</div>'
        + (SVA_PH === x.id ? photoGalleryHtml(x.id) : '')
        + (rv === 'revisit' && r.revisitNote
            ? alertBox('warn', t('رُدَّت') + ' \u2014 ' + r.revisitNote + ' \u00b7 ' + esc(dispName(r.revisitBy) || '')) : '')
        + (rv === 'approved'
            ? alertBox('success', t('اعتمدها') + ' ' + esc(dispName(r.reviewBy) || '\u2014') + ' \u00b7 <span class="num">'
                + esc(fmtDate(r.reviewAt || 0)) + '</span>'
                + (so ? ' \u00b7 ' + t('الحل') + ': ' + t(so.status) : ' \u00b7 ' + t('بلا حلٍّ بعد'))) : '');
      var actions = '';
      if (rv === 'pending' && may('approve')){
        /* الاعتمادُ واختيارُ الأجهزة خطوةٌ واحدة: كان يعتمد ثم يبحث عن النقطة في
           «معتمدة» ليقترح حلَّها — فصار الاختيارُ هنا، والحفظُ يعتمد ويحفظ الحلَّ
           معًا، فتدخل النقطةُ طبقةَ التركيب برتقاليةً جاهزةً للإسناد. */
        if (SVA_SOL === x.id && may('edit')){
          actions = card('اعتماد الزيارة واختيار الأجهزة', itemPickerHtml()
            + '<p class="hint" style="margin:8px 0 0">' + esc(t('الحفظُ يعتمد الزيارةَ ويحفظ الأسطرَ حلًّا معتمدًا — فتدخل طبقةَ التركيب جاهزةً للإسناد.')) + '</p>'
            + btn('\u2705 ' + t('اعتمد واحفظ الأجهزة'),'btn-primary btn-sm',' data-svsolgo="' + esc(x.id) + '"')
            + btn(t('تراجع'),'btn-quiet btn-sm',' data-svsolcancel="1"'));
          return cardRaw(head0, body + actions);
        }
        actions = '<div class="actions">'
          + (may('edit') ? btn('\u2705 ' + t('اعتمد واختر الأجهزة'),'btn-primary btn-sm',' data-svsol="' + esc(x.id) + '"') : '')
          + btn('\u2705 ' + t('اعتمد الزيارة'),(may('edit') ? 'btn-secondary' : 'btn-primary') + ' btn-sm',' data-svappr="' + esc(x.id) + '"')
          + btn('\u21a9 ' + t('تحتاج زيارة أخرى'),'btn-danger btn-sm',' data-svrevisit="' + esc(x.id) + '"')
          + btn('\u{1F5FA} ' + t('على الخريطة'),'btn-quiet btn-sm',' data-site="' + esc(x.id) + '"') + '</div>';
        if (SVA_REV === x.id){
          actions += '<div class="field" style="margin-top:10px"><label>' + esc(t('ما ينقص الزيارة — يقرؤه المشرفُ في مهامّه')) + '</label>'
            + '<input id="svaNote" dir="auto" placeholder="' + esc(t('مثلًا: الصورة لا تُظهر نقطةَ التثبيت، وقياسُ الطول ناقص')) + '"></div>'
            + '<div class="actions">' + btn(t('تأكيد الردّ'),'btn-danger btn-sm',' data-svrevisitgo="' + esc(x.id) + '"')
            + btn(t('تراجع'),'btn-quiet btn-sm',' data-svrevisitcancel="1"') + '</div>';
        }
      } else if (rv === 'pending' && rankOf(ROLE) >= rankOf('supervisor')){   /* (V28.6) المشرفُ يردّ الزيارةَ للتصحيح بسببٍ مكتوب — والاعتمادُ يبقى للمهندس */
        actions = SVA_REV === x.id
          ? card(t('ردُّ الزيارة'), '<div class="field"><label>' + esc(t('ما الذي ينقص — يصل الفنيَّ في مهامّه')) + '</label><input id="svaNote" dir="auto"></div>'
              + '<div class="actions">' + btn(t('تأكيد الردّ'),'btn-danger btn-sm',' data-svrevisitgo="' + esc(x.id) + '"') + btn(t('تراجع'),'btn-quiet btn-sm',' data-svrevisitcancel="1"') + '</div>')
          : '<div class="actions">' + btn('\u21a9 ' + t('تحتاج زيارة أخرى'),'btn-danger btn-sm',' data-svrevisit="' + esc(x.id) + '"') + '<span class="hint" style="margin:0">' + esc(t('الاعتمادُ للمهندس')) + '</span></div>';
      }
      if (rv === 'approved' && !so && may('edit')){
        if (SVA_SOL === x.id){
          actions = card('الأجهزة المقترحة لهذه النقطة', itemPickerHtml()
              + '<p class="hint" style="margin:8px 0 0">' + esc(t('تُحفَظ الأسطرُ حلًّا للنقطة وتُعتمَد فورًا — فتدخل طبقةَ التركيب.')) + '</p>',
              btn('\u{1F4BE} ' + t('احفظ الحلَّ واعتمده'),'btn-primary btn-sm',' data-svsolgo="' + esc(x.id) + '"')
              + btn(t('لاحقًا'),'btn-quiet btn-sm',' data-svsolcancel="1"'));
        } else {
          actions = '<div class="actions">' + btn('\u{1F527} ' + t('اقترح حلَّها الآن'),'btn-secondary btn-sm',' data-svsol="' + esc(x.id) + '"') + '</div>';
        }
      }
      if (rv === 'revisit' && may('approve')){
        actions = '<div class="actions">' + btn('\u2705 ' + t('اعتمدها رغم ذلك'),'btn-quiet btn-sm',' data-svappr="' + esc(x.id) + '"') + '</div>';
      }
      return cardRaw(head0, body + actions);
    }).join('')
    + (rows.length > 60 ? '<p class="hint">' + esc(t('يُعرَض ستون — ضيّق البحث لترى الباقي.')) + '</p>' : '')
    + '<p class="hint">' + esc(t('الردُّ لا يمحو بيانات الزيارة — يبقيها للمقارنة ويعيد النقطةَ إلى مهام المشرف بسببه. والاعتمادُ يُغلق مهمةَ الزيارة فتُحتسب نقاطُها.')) + '</p>';
    return html;
  })();
    if (cur === 'ready') return head + (function(){
      /* الحلقةُ بين الاعتماد والتركيب: ما اعتُمد يظهر هنا برتقاليًّا حتى يُسنَد */
      var L = asnReadyList('install');
      return stats([['جاهزة للتركيب — بانتظار الإسناد', N(L.length), L.length ? 'wrn' : 'ok']])
        + (L.length && may('approve')
            ? '<div class="actions" style="margin:0 0 10px">' + btn('\u26A1 ' + t('أسند الجاهزَ للتركيب الآن') + ' (' + nm(L.length) + ')','btn-primary btn-sm',' data-asnq="install"')
              + btn('\u{1F5FA} ' + t('على الخريطة'),'btn-secondary btn-sm',' data-golayer="install"') + '</div>' : '')
        + (L.length
            ? cardFlush(t('جاهز للتركيب') + ' \u2014 ' + nm(L.length),
                table(['النقطة','الاسم','الحل','اعتُمد','إجراء'], capList(L, 200).map(function(x){
                  var so = solutionOf(x.id) || {}, r = STATE.recs[x.id] || {};
                  return [siteIdHtml(siteOf(x)), esc((x.name || '').slice(0, 30)),
                          '<span class="num">' + nm(Object.keys(so.items || so.lines || {}).length) + '</span> ' + esc(t('سطر')),
                          '<span class="num">' + esc(r.reviewAt ? fmtDate(r.reviewAt) : '—') + '</span>',
                          btn('\u{1F5FA} ' + t('على الخريطة'),'btn-quiet btn-sm',' data-site="' + esc(x.id) + '"')];
                })))
            : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا نقاطَ جاهزةً — ما يُعتمَد مع حلِّه يظهر هنا.')) + '</p>'));
    })();
    if (cur === 'chal') return head + (function(){
    var L = chalSitesQ(), open = L.filter(function(x){ return !x.closed; });

    return stats([['إفاداتٌ مسجَّلة', N(L.length), 'acc'],
                  ['بانتظار حل', N(open.length), open.length ? 'wrn' : 'ok'],
                  ['أُغلقت بالتركيب', N(L.length - open.length), 'ok']])

      + (L.length
        ? cardFlush(t('الإفادات') + ' — ' + nm(L.length),
            table(['النقطة','التحديات','الملاحظة','المُفيد','الحالة'],
              capList(L, 200).map(function(x){
                return [siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">'
                          + esc(((x.site && x.site.name) || '').slice(0, 28)) + '</span>',
                        x.chals.map(function(c){ return pill(c, 'warn'); }).join(' '),
                        esc(x.note || '—'), esc(dispName(x.by) || '—'),
                        x.closed ? pill('أُغلقت بالتركيب', 'ok') : pill('بانتظار حل', 'wrn')];
              })))
        : card('لا إفاداتٍ بعد',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('تظهر هنا فور تسجيل تحدٍّ أثناء المسح الميداني — «حالة الموقع» في نموذج المسح.'))
            + '</p>'))

      + '<p class="hint">' + esc(t('التحديات تُسجَّل أثناء المسح («المسح الميداني»)، وتُغلَق تلقائيًّا حين تُعتمَد تركيبتُها — لا يدويًّا.')) + '</p>';
  })();
    /* ═══ المتعذّرُ والراكدُ شريحتان لا واحدة (بلاغ #٢ · V17.40) ═══
   جُمعا في شاشةٍ لأنهما «ما توقّف»، وهما أمران مختلفان: المتعذّرُ زيارةٌ لم
   تقع ويُقرَّر فيها (يُقبَل العذرُ أو يُعاد الإسناد)، والراكدُ زيارةٌ وقعت
   ولم يُركَّب موقعُها فيُسأل عن التركيب. ومن يعمل على أحدهما لا يعنيه الآخر،
   وخلطُهما يجعل العدَّ مضلِّلًا والقرارَ بطيئًا. فصار لكلٍّ شريحتُه بكلِّ
   تفاصيله وشرائحِه وبحثِه وتصديره — كما طلب البلاغُ من الميدان. */
if (cur === 'stuck' || cur === 'idle') return head + (function(){
    var ONLY = cur;                       /* 'stuck' متعذّر · 'idle' راكد */
    var L = stuckList().filter(function(x){ return ONLY === 'stuck' ? x.blocked : !x.blocked; });
    var blocked = L.filter(function(x){ return x.blocked; });
    var stuck7  = L.filter(function(x){ return !x.blocked && x.days >= 7 && x.days < 14; });
    var stuck14 = L.filter(function(x){ return !x.blocked && x.days >= 14; });
    var oldest = L.length ? L[0] : null;

    var open = blocked.filter(function(x){ return !x.accepted; }), accepted = blocked.filter(function(x){ return x.accepted; });
    /* شرائحُ كلِّ شاشةٍ من جنسها: المتعذّرُ بقراره، والراكدُ بعمره */
    var chips = ONLY === 'stuck'
      ? [['','الكل',L.length],['open','يحتاج قرارًا',open.length],['ok','عذرٌ مقبول',accepted.length]]
      : [['','الكل',L.length],['w7','راكدٌ أسبوعًا فأكثر',stuck7.length + stuck14.length],['w14','راكدٌ أسبوعين فأكثر',stuck14.length]];
    var show = L.filter(function(x){
      if (ONLY === 'stuck'){
        if (STK_F === 'open') return !x.accepted;
        if (STK_F === 'ok') return x.accepted;
        return true;
      }
      if (STK_F === 'w7') return x.days >= 7;
      if (STK_F === 'w14') return x.days >= 14;
      return true;
    });
    var rows = [];
    capList(show, 200).forEach(function(x){
      var r = x.rec, isOpen = STK_OPEN === x.id;
      rows.push([siteIdHtml(siteOf(x)) + '<br><span class="hint" style="margin:0">' + esc((x.site.name || '').slice(0, 28)) + '</span>',
                 x.blocked ? (x.accepted ? pill('متعذّر — مقبول', 'ok') : pill(r.access || 'متعذّر', 'bad')) : pill('راكد بانتظار التركيب', 'wrn'),
                 '<span dir="auto">' + esc((x.blocked ? (r.reason || r.note || '—') : t(idleStep(x.id).why)).slice(0, 60)) + '</span>',
                 nm(x.days) + ' ' + t('يوم'),
                 esc(dispName(r.by) || '—') + (photoCount(x.id) ? ' <span class="hint" style="margin:0">\u{1F4F7}' + nm(photoCount(x.id)) + '</span>' : ''),
                 btn(isOpen ? '\u25BE ' + t('إغلاق') : '\u25B8 ' + t('راجع'), isOpen ? 'btn-quiet btn-sm' : 'btn-secondary btn-sm', ' data-stkopen="' + esc(isOpen ? '' : x.id) + '"')]);
      if (isOpen) rows.push({ raw: stuckPanel(x) });
    });
    return stats([['متعذّر يحتاج قرارًا', N(open.length), open.length ? 'bad' : 'ok'],
                  ['متعذّر مقبول', N(accepted.length), 'ok'],
                  ['راكد ٧–١٤ يومًا', N(stuck7.length), stuck7.length ? 'wrn' : 'ok'],
                  ['راكد أكثر من أسبوعين', N(stuck14.length), stuck14.length ? 'bad' : 'ok'],
                  ['أقدم عنصر', oldest ? (nm(oldest.days) + ' ' + t('يوم')) : '—']])
      + '<div class="chips">' + chips.map(function(c){ return '<button type="button" class="chip' + (STK_F === c[0] ? ' on' : '') + '" data-stkf="' + c[0] + '">' + esc(t(c[1])) + ' <span class="num">' + nm(c[2]) + '</span></button>'; }).join('') + '</div>'
      + (show.length
        ? cardFlush(t('القائمة') + ' — ' + nm(show.length),
            table(['النقطة','الحالة','السبب / الملاحظة','منذ','المشرف / الفني',''], rows))
        : alertBox('success','لا عناصرَ في هذه الخانة الآن.'))
      + '<p class="hint">' + esc(t('المتعذّر: وصل المشرفُ ولم يستطع المسح — يُراجَع بصوره وسببه ويُقرَّر فيه: يعود لزيارةٍ أخرى، أو يُقبَل التعذّرُ بحُجّةٍ مكتوبة. والراكد: زيارةٌ تمّت ولم تُركَّب نقطتُه بعد.')) + '</p>';
  })();
    return head + (function(){
    /* (V26.9) قرارُ المالك: للميدان أيضًا صفحةٌ واحدة «التحديات والمعوقات» بأرقام متابعة الوزارة نفسِها (mfuObstaclesF) وفلترها،
       واضغط التحدي تنفتح نافذةٌ بنقاطه: المخيمُ بشاخصه أو الممرُّ باسمه، ومشعرُه ونوعُه، ووصفُ العائق، وزرُّ الخريطة. */
    var O = mfuObstaclesF(), byCat = {}, ed = rankOf(ROLE) >= rankOf('engineer');
    O.forEach(function(o){ o.cats.forEach(function(c){ byCat[c] = (byCat[c] || 0) + 1; }); });
    var cats = Object.keys(byCat).sort(function(a, b){ return byCat[b] - byCat[a]; });
    var nr = O.filter(function(o){ return o.cats.indexOf('تعذّر الوصول') > -1; }).length;
    return mfuFilterRow()
      + stats([['نقاطٌ فيها معوقات', N(O.length), O.length ? 'wrn' : 'ok'],
               ['أنواع التحديات', N(cats.length)],
               ['متعذّر الوصول', N(nr), nr ? 'wrn' : 'ok']])
      + (cats.length
        ? cardFlush(t('التحديات') + ' \u2014 ' + esc(t('اضغط التحدي ترى نقاطه')),
            table(['التحدي', 'كم نقطة', 'الجهة', ''],
              cats.map(function(c){ return ['<button type="button" class="btn btn-quiet btn-sm" data-chalpop="' + esc(c) + '" style="white-space:normal;text-align:start">' + esc(t(c)) + '</button>' + chalAssignBox(c) + chalUpdBox(c), N(byCat[c]), esc(t(mfuPartyLabel(mfuOwnerOf(c)))), btn('\u25B8 ' + t('النقاط'), 'btn-secondary btn-sm', ' data-chalpop="' + esc(c) + '"')]; }))   /* (V27.0) التكليفُ والتحديثات */
            + '<div style="padding:8px 12px">' + btn(t('كل النقاط') + ' (' + nm(O.length) + ')', 'btn-quiet btn-sm', ' data-chalpop="*"') + '</div>')
        : alertBox('success', 'لا معوقاتٍ في هذا الفلتر.'))
      + (ed ? chalOtherCard() : '')
      + '<p class="hint">' + esc(t('المعوقات تُقرأ من المسح الميداني للنقاط غير المركَّبة وتُغلَق تلقائيًّا عند التركيب — والأرقامُ هنا هي نفسُها في متابعة الوزارة.')) + '</p>';
  })();
  }};

/* ═══ نقاطُ التركيب التجريبيِّ — الزمنُ بين مراحلها (V17.95) ═══
   قبل موجة التركيب تُركَّب نقاطٌ قليلةٌ أوّلًا لتُقاس: كم بين الإسناد والتركيب،
   وبين التركيب والتدقيق، وبين التدقيق والتسليم، ثم الفكّ. يَسِمُ المديرُ النقطةَ
   «تجريبية» من نافذتها (تجاوزٌ في وثيقة الموقع كغيره)، والبطاقةُ تُقرأ من
   الوثائق والخطوات نفسِها — لا حقلَ جديدًا ولا حسابًا ثانيًا لدورة الحياة. */
function pilotRows(){
  var idx = taskIndex();
  return (STATE.sites || []).filter(function(x){ return x.pilot; }).map(function(x){
    var id = x.id, r = STATE.recs[id], ins = STATE.inss[id], dis = STATE.diss && STATE.diss[id], hd = (typeof handOf === 'function') ? handOf(id) : null;
    var tk = idx[id + '|install'];
    var st = [
      ['تمت الزيارة', svVisited(r) ? +r.at : 0],   /* (V32.6) */
      ['أُسند التركيب', tk ? +(tk.at || tk._at || 0) : 0],
      ['رُكّبت',      ins && ins.status === 'مُركّب' ? +ins.at : 0],
      ['دُقّقت',      ins && ins.approved ? +(ins.qaAt || ins._at || ins.at) : 0],
      ['سُلّمت',      hd ? +(hd.at || 0) : 0],
      ['فُكّت',       dis && dis.status === 'تم الفك' ? +dis.at : 0]
    ];
    return { x:x, life:lifeOf(x), st:st };
  });
}
function pilotCard(){
  var R = pilotRows(); if (!R.length) return '';
  var span = function(a, b){ if (!a || !b || b < a) return '—'; var h = (b - a) / 36e5; return h < 48 ? nm(Math.round(h)) + ' ' + t('س') : nm(Math.round(h / 24)) + ' ' + t('يوم'); };
  return card('التركيبُ التجريبي — الزمنُ بين المراحل',
    '<p class="hint" style="margin-top:0">' + esc(t('نقاطٌ جُعلت «نقاطَ تجربة» من نافذتها. الأرقامُ من وثائق المسح والتركيب والتسليم والفكّ نفسِها.')) + '</p>'
    + '<div style="overflow:auto"><table class="tbl"><thead><tr><th>' + esc(t('النقطة')) + '</th><th>' + esc(t('الحالة')) + '</th>'
    + R[0].st.map(function(p){ return '<th>' + esc(t(p[0])) + '</th>'; }).join('') + '<th>' + esc(t('إسناد←تركيب')) + '</th><th>' + esc(t('تركيب←تدقيق')) + '</th><th>' + esc(t('تدقيق←تسليم')) + '</th></tr></thead><tbody>'
    + R.map(function(o){ var s2 = o.st;
        return '<tr><td>' + siteIdHtml(o.x) + '</td><td>' + pill(t((LIFE[o.life] || LIFE.todo).n), '') + '</td>'
          + s2.map(function(p){ return '<td class="num">' + (p[1] ? esc(fmtDT(p[1])) : '—') + '</td>'; }).join('')
          + '<td class="num">' + span(s2[1][1], s2[2][1]) + '</td><td class="num">' + span(s2[2][1], s2[3][1]) + '</td><td class="num">' + span(s2[3][1], s2[4][1]) + '</td></tr>'; }).join('')
    + '</tbody></table></div>');
}
PAGE.dis = { m:'المتابعة', t:'الفك والمراحل',
  l:'ما بعد الموسم: فكُّ ما رُكِّب، وسلسلةُ المراحل التي مرّت بها كلُّ نقطة.',
  body:function(){
    var head = tabHead('dis'), cur = tabCur('dis');
    if (cur === 'chain') return head + pilotCard() + (function(){
    var R = chainRows();
    return '<p class="lede" style="margin:0 0 16px">'
      + esc(t('الأعدادُ ليست نهائيةً بطبعها: المواقعُ لم تُمسَح بعدُ فما يُفَكُّ يزيد، وحاجةُ التهيئة لا تُعرَف إلا بعد المسح، وما يُركَّب يتبع المسحَ، وما يُفَكُّ يتبع التركيب. فأساسُ كلِّ مرحلةٍ هنا هو منجَزُ ما قبلها — يكبر بكبره ويقف بوقوفه.'))
      + '</p>'

      + cardFlush('السلسلة',
          table(['المرحلة','أساسُها','عددُ الأساس','منجَز','المتبقّي','النسبة'],
            R.map(function(x){
              var left = Math.max(0, (x.baseN || 0) - x.done);
              var pc = x.baseN ? Math.round(x.done * 100 / x.baseN) : 0;
              return ['<strong>' + esc(t(x.n)) + '</strong>',
                      esc(t(x.base)),
                      x.baseN ? N(x.baseN) : '<span class="hint" style="margin:0">'
                        + esc(t('بانتظار ما قبله')) + '</span>',
                      N(x.done),
                      x.baseN ? N(left) : '—',
                      x.baseN ? pct(x.done, x.baseN) : '—'];
            })))

      + R.map(function(x){
          return card(x.n, '<p class="hint" style="margin:0">' + esc(t(x.d)) + '</p>');
        }).join('')

      + '<p class="hint">' + esc(t('لا يُقدَّر عددُ مرحلةٍ قبل أن يقع أساسُها. ومن أراد تقديرًا مبكّرًا فليقرأه من المواقع المسجَّلة — ويعلم أنه سقفٌ لا التزام.')) + '</p>';
  })();
    return head + (function(){
    var L = Object.keys(STATE.diss || {}).map(function(id){ return STATE.diss[id]; });
    var eligible = Object.keys(STATE.inss).filter(function(id){
      var r = STATE.inss[id];
      return r.status === 'مُركّب' && r.approved && !(STATE.diss && STATE.diss[id]);
    }).length;
    var sched = L.filter(function(x){ return x.status === 'مجدول'; }).length;
    var done  = L.filter(function(x){ return x.status === 'تم الفك'; }).length;
    var returned = STATE.moves.filter(function(m){
      return m.kind === 'إرجاع سليم' || m.kind === 'إرجاع تالف';
    }).length;

    return stats([['مُركّب قابل للفك', N(eligible)],
                  ['فك مجدول', N(sched), sched ? 'wrn' : ''],
                  ['تم الفك', N(done), 'ok'],
                  ['عُهدة مرتجعة', N(returned)]])
      + card('دورة الفك', flow(['مُركّب','فك مجدول','تم الفك','أُرجعت العُهدة'], done ? 3 : (sched ? 1 : 0))
        + '<p class="hint">' + esc(t('عند «تم الفك» تُفتح نافذة إرجاع العُهدة مبنيةً على قطع النقطة المعتمدة: السليم يعود متاحًا والتالف يُعزل.')) + '</p>')
      + (L.length
        ? cardFlush(t('سجلّ الفك') + ' — ' + nm(L.length),
            table(['النقطة','الحالة','الحالة الفنية','بواسطة','التاريخ'],
              L.sort(function(a,b){ return (b.at||0)-(a.at||0); }).slice(0,200).map(function(x){
                return [siteIdHtml(siteOf(x)),
                        pill(x.status, x.status === 'تم الفك' ? 'ok' : 'wrn'),
                        x.cond ? pill(x.cond, x.cond === 'تالف' ? 'bad' : 'ok') : '—',
                        esc(dispName(x.by) || '—'),
                        '<span class="num">' + esc(fmtDate(x.at||0)) + '</span>'];
              })))
        : '');
  })();
  }};

/* ── التخطيط ────────────────────────────────────── */


/* ── الطلبات والمسح ──────────────────────────────── */
var SURV_Q = '', SURV_REOPEN = '', SURV_ST = '';

/* إعادةُ تصنيف زيارةٍ تمّت كمتعذّرة: لا حذفَ للسجل ولا لصورِه — يبقى
   أثرًا، ويخرج من عِداد المُنجَز بتغيير access وحده حتى يُزار ثانيةً.
   قبولُ الوصولِ لا يعني الصحةَ الأبدية: موقعٌ قد يتغيّر بعد أن يُسجَّل. */
function svReopen(id, reason, note){
  if (!may('edit')){ toast(t('إعادةُ تصنيف الزيارة تحتاج صلاحية تعديل')); return; }
  var r = STATE.recs[id];
  if (!r){ toast(t('لا سجلَّ مسحٍ لهذه النقطة')); return; }
  if (!reason){ toast(t('اختر سبب التعذّر')); return; }
  var ins = STATE.inss && STATE.inss[id];
  if (ins && ins.status === 'مُركّب' && ins.approved){
    toast(t('النقطةُ مُركّبةٌ ومعتمدةٌ بالفعل — لا تُعاد إلى المسح')); return;
  }
  r.access = reason;
  r.reopenNote = String(note || '').trim();
  r.reopenBy = STATE.meta.name || '';
  r.reopenAt = Date.now();
  CORE.set('recs', id, r);
  logEvent('إعادة تصنيف زيارة كمتعذّرة — ' + id + ' \u00b7 ' + reason
           + (r.reopenNote ? (' \u00b7 ' + r.reopenNote) : ''));
  toast(id + ' \u00b7 ' + t('أُعيدت للقائمة — تحتاج زيارةً ثانية'));
  SURV_REOPEN = '';
  statBump();
  render(1);
}

function surveyList(){
  return Object.keys(STATE.recs).map(function(id){
    var r = STATE.recs[id], x = siteFind(id);
    if (!x) return null;
    return { id:id, site:x, rec:r, done:svDone(r) };
  }).filter(Boolean).sort(function(a,b){ return (b.rec.at || 0) - (a.rec.at || 0); });
}




/* ═══ دورةُ العمل — الخريطةُ التي تشرح النظامَ لنفسه ═══
   سؤالُ كلِّ مستخدمٍ جديد: «أعمل إيه، وبعدين أروح فين؟». والجوابُ كان
   مبعثرًا في تلميحات الصفحات. فجُمع في شاشةٍ واحدة: كلُّ دورةٍ خطواتُها
   بالترتيب — من يفعلها، وأين (بزرٍّ يقفز إلى الشاشة نفسِها)، وما الذي يحدث
   بعدها. والأزرارُ لا تظهر إلا لمن يرى شاشتَها — فالفنيُّ لا يُدعى إلى شاشة
   اعتماد لا يملكها. */
function wfStep(n, who, what, page){
  var jump = '';
  if (page && seesPage(PARENT[page] || page)){
    var pm = pageMeta(page);
    jump = '<div style="margin-top:6px">' + btn('\u{1F4CD} ' + esc(t(pm ? pm.t : page)),
      'btn-secondary btn-sm', ' data-p="' + esc(page) + '"') + '</div>';
  }
  return '<div class="list-item" style="align-items:flex-start"><div class="li-main">'
    + '<div class="li-t"><span class="num">' + nm(n) + '.</span> ' + esc(t(what)) + '</div>'
    + '<div class="li-s">' + esc(t(who)) + '</div>' + jump
    + '</div></div>';
}

/* رسمُ الدورة: صناديقُ الحالات بألوانها من LIFE نفسِها — فما يراه على
   الخريطة يجده هنا بالحرف. SVG لا صورة: يكبر ويصغر ويُترجَم ويُطبَع. */
function wfDiagram(){
  var rows = [
    { t:'دورة الزيارة', k:['todo','assigned','visited','ready'], why:'الرَّدُّ يعيدها إلى «تحتاج زيارةً أخرى» ثم تعود مسارَها.' },
    { t:'دورة التركيب', k:['ready','sched','installed'], why:'لا جدولةَ قبل اعتماد الحل، ولا نقاطَ قبل اعتماد التدقيق.' },
    { t:'بعد التركيب',  k:['installed','maint','dis'], why:'الصيانةُ في أثناء الموسم، والفكُّ بعده — كلاهما يُسنَد كما يُسنَد التركيب.' }
  ];
  /* النصُّ العربيُّ لا يُقَصُّ ولا يفيض: يُلَفُّ سطرين ويتّسع الصندوقُ لهما.
     كان `slice(22)` يقطع الكلمةَ نصفَها، والوصفُ يمتدُّ خارجَ إطاره فيركب
     على جاره — تُقرأ الصورةُ فتظنُّ الرسمَ معطوبًا. */
  var wrap = function(txt, per, lines){
    var w = String(txt || '').split(/\s+/), out2 = [], cur = '';
    for (var i = 0; i < w.length; i++){
      var nx = cur ? cur + ' ' + w[i] : w[i];
      if (nx.length > per && cur){ out2.push(cur); cur = w[i]; if (out2.length === lines - 1) break; }
      else cur = nx;
    }
    if (cur && out2.length < lines) out2.push(cur);
    var rest = w.slice(out2.join(' ').split(/\s+/).length).join(' ');
    if (rest && out2.length === lines) out2[lines - 1] = (out2[lines - 1] + ' …');
    return out2;
  };
  var W = 900, bw = 196, bh = 82, gap = 22, out = '';
  var y = 8;
  rows.forEach(function(r){
    out += '<text x="' + (W - 6) + '" y="' + (y + 14) + '" text-anchor="end" '
        +  'font-size="15" font-weight="700" fill="var(--ink)">' + esc(t(r.t)) + '</text>';
    y += 26;
    var n = r.k.length;
    var total = n * bw + (n - 1) * gap;
    var x0 = W - Math.round((W - total) / 2) - bw;   /* من اليمين لليسار */
    r.k.forEach(function(key, i){
      var L = LIFE[key] || LIFE.todo;
      var x = x0 - i * (bw + gap);
      var nm2 = wrap(t(L.n), 20, 2), ds = wrap(t(L.d), 26, 3);
      out += '<rect x="' + x + '" y="' + y + '" rx="10" width="' + bw + '" height="' + bh + '" '
          +  'fill="' + L.c + '" fill-opacity="0.18" stroke="' + L.c + '" stroke-width="2"/>'
          +  '<circle cx="' + (x + bw - 13) + '" cy="' + (y + 15) + '" r="5.5" fill="' + L.c + '"/>'
          +  nm2.map(function(ln, j){
               return '<text x="' + (x + bw - (j ? 12 : 25)) + '" y="' + (y + 19 + j * 15) + '" text-anchor="end" '
                 + 'font-size="12.5" font-weight="700" fill="var(--ink)">' + esc(ln) + '</text>';
             }).join('')
          +  ds.map(function(ln, j){
               return '<text x="' + (x + bw - 12) + '" y="' + (y + 22 + nm2.length * 15 + j * 13) + '" text-anchor="end" '
                 + 'font-size="10.5" fill="var(--ink-soft)">' + esc(ln) + '</text>';
             }).join('');
      if (i < n - 1){
        var ax = x - gap + 4, ay = y + bh / 2;
        out += '<line x1="' + (ax + gap - 8) + '" y1="' + ay + '" x2="' + (ax + 4) + '" y2="' + ay + '" '
            +  'stroke="var(--ink-soft)" stroke-width="2"/>'
            +  '<polygon points="' + ax + ',' + ay + ' ' + (ax + 8) + ',' + (ay - 5) + ' ' + (ax + 8) + ',' + (ay + 5) + '" '
            +  'fill="var(--ink-soft)"/>';
      }
    });
    y += bh + 10;
    out += '<text x="' + (W - 6) + '" y="' + (y + 10) + '" text-anchor="end" font-size="11" '
        +  'fill="var(--ink-soft)">' + esc(t(r.why)) + '</text>';
    y += 30;
  });
  return card('\u{1F5FA} ' + t('رسمُ الدورة — بألوان الخريطة نفسِها'),
      '<div style="overflow-x:auto"><svg viewBox="0 0 ' + W + ' ' + y + '" width="100%" '
      + 'style="min-width:820px;height:auto" role="img" aria-label="' + esc(t('رسم دورة حياة النقطة')) + '">'
      + out + '</svg></div>'
      + '<div class="chips" style="margin:10px 0 0">' + LIFE_ORDER.map(function(k){
          return '<span class="chip"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;'
            + 'background:' + LIFE[k].c + ';margin-inline-end:6px"></i>' + esc(t(LIFE[k].n)) + '</span>';
        }).join('') + '</div>'
      + '<p class="hint" style="margin:10px 0 0">'
      + esc(t('اللونُ نفسُه على الخريطة: تفتح الخريطةَ فتعرف موضعَ كلِّ نقطةٍ من الدورة بنظرة.')) + '</p>');
}
function wfBody(){
  var visit = [
    ['المهندس','يُنشئ طلبَ زيارةٍ (SR) أو يُسنِد نقاطًا من الخريطة لمشرفٍ بموعد','req'],
    ['المشرف','يفتح «شغلي ← مهامي» فيجد نقاطَه — وعلى الخريطة نقاطُه بلونٍ لا يشبه نقاطَ غيره','mywork'],
    ['المشرف','يزور النقطةَ ويملأ نموذجَ المسح بصورتَيه وقياساته — أو يسجّل تعذُّرَ الوصول بسببه','svForm'],
    ['النظام','تُحفَظ الزيارةُ «بانتظار الاعتماد» — وتظهر فورًا في اعتماد الزيارات ببياناتها الجديدة','svappr'],
    ['المهندس','يعتمد الزيارةَ فتُغلَق مهمتُها وتُحتسب نقاطُها — أو يردُّها «تحتاج زيارةً أخرى» بسببٍ مكتوب','svappr'],
    ['المشرف','إن رُدَّت وجدها في مهامّه بسبب الردّ — يزورها ثانيةً وتُحفَظ جولةً ثانيةً تنتظر الاعتماد','mywork']
  ];
  var install = [
    ['المهندس','بعد اعتماد الزيارة يقترح حلَّها: الأصنافُ وكمّياتُها من الكتالوج — يدويًّا أو بنمطٍ جاهز','solution'],
    ['المهندس','يعتمد الحلَّ — فتدخل النقطةُ طبقةَ التركيب ولا يُقبَل طلبُ تركيبٍ (DR) قبل ذلك','solution'],
    ['المهندس','يُسنِد التركيبَ لفريقٍ من الخريطة أو «توزيع الفرق» — التركيبُ عملُ أيدٍ لا يدٍ واحدة','req'],
    ['الفريق','يركّب ويملأ نموذجَ التركيب: صورتا قبلُ وبعدُ، والسيريالاتُ، والقطعُ المستهلكة','insForm'],
    ['النظام','تُخصَم القطعُ من المخزون في دفتر الحركة — فلا يُخصَم شيءٌ مرتين ولا يضيع','invmv'],
    ['المهندس','يدقّق التركيبَ في «التدقيق الهندسي» فيعتمده — أو يفتح عدمَ مطابقةٍ إن وجد خللًا','qa'],
    ['النظام','بالاعتماد تصير النقطةُ «مُركّب» وتُحتسب نقاطُ الفريق — وتظهر خضراءَ على الخريطة','map']
  ];
  var after = [
    ['المهندس','ما رُكِّب يُخدَم في أثناء الموسم: يُسنَد نوعُ «صيانة» (MR) لفريقٍ بموعد — فتصير النقطةُ صفراء','req'],
    ['الفريق','ينفّذ الصيانةَ ويوثّقها، وتُغلَق مهمتُها باعتماد المهندس فتعود النقطةُ خضراء','mywork'],
    ['المهندس','بعد الموسم يُسنَد نوعُ «فك» (PR) — فتصير النقطةُ حمراءَ حتى تُرجَع عُهدتُها','req'],
    ['الفريق','يفكّ ويُرجع القطعَ بحالتها في «الفك والعُهدة» — فتُغلَق دورةُ النقطة','disp2']
  ];
  var follow = [
    ['الجميع','«أمس · الآن · غدًا»: ما انتهى، وما يجري الآن ومن يفعله وأين، وما جُدول لغد','now'],
    ['الجميع','الخريطةُ تلوّن الدورةَ كلَّها — لم يُزر · مُسند · مجدولٌ غدًا · مردود · ينتظر · معتمد','map'],
    ['المكتب','«الوتيرة والهدف» تجيب «هنلحق؟» بالأرقام: المطلوبُ يوميًّا والانتهاءُ المتوقَّع','pace'],
    ['المكتب','التقاريرُ التنفيذية: اللوحةُ ومركزُ التقارير والملخّصُ المالي — للتصدير والاجتماعات','exec']
  ];
  function cyc(title, icon, steps, note){
    var i = 0;
    return card(icon + ' ' + t(title),
        '<div class="list">' + steps.map(function(st){ i++; return wfStep(i, st[0], st[1], st[2]); }).join('') + '</div>'
        + (note ? '<p class="hint" style="margin:10px 0 0">' + esc(t(note)) + '</p>' : ''));
  }
  return wfDiagram()
    + cyc('دورة الزيارة — حتى تُعتمَد', '\u{1F50D}', visit,
        'لا تُحتسب زيارةٌ في المنجَز وهي مردودة — والاعتمادُ وحدَه يفتح بابَ الحل.')
    + cyc('دورة التركيب — حتى يكتمل', '\u{1F527}', install,
        'البواباتُ بالترتيب: لا حلَّ قبل اعتماد الزيارة، ولا طلبَ تركيبٍ قبل اعتماد الحل، ولا نقاطَ قبل اعتماد التدقيق.')
    + cyc('بعد التركيب — الصيانة ثم الفك', '\u{1F6E1}', after,
        'الصيانةُ والفكُّ يُسنَدان بالمحرّك نفسِه: تُحدَّد النقاطُ من الخريطة، ويُختار النوع، ويُوضَع الموعد.')
    + cyc('المتابعة — من أين تُراقب', '\u{1F4CA}', follow, '');
}

/* ═══ قراراتُك اليوم — صندوقُ المهندس ═══
   ما ينتظر قرارَ المهندس كان موزَّعًا على ثماني شاشات: زياراتٌ تنتظر
   الاعتماد هنا، وحلولٌ مقترحةٌ هناك، وتركيباتٌ تنتظر التدقيق، وبلاغاتٌ،
   وتغييراتٌ، ونقاطٌ جاهزةٌ للتسليم — يفتحها بالتناوب ويسأل «هل بقي شيء؟».
   فجُمع ما ينتظره في بطاقةٍ واحدةٍ بأرقامه وزرِّ قفزٍ لكلٍّ: صفرٌ في الكلِّ
   يعني أن الطاولةَ نظيفة. */

/* ═══ جاهزيةُ الموسم ═══
   النظامُ كاملٌ والإعداداتُ صفر. أوزانُ الزيارة صفرٌ فلا نقطةَ تُحتسَب لأحد،
   والتارجتاتُ صفرٌ فلا وتيرةَ تُقاس، والمواعيدُ صفرٌ فلا تأخّرَ يُعرَف،
   والميزانيةُ صفرٌ فالقيمةُ المكتسبةُ تقسم على صفر. وكلٌّ منها يعطّل حسابًا
   بعينه في صمت: الشاشةُ تعمل وتعرض صفرًا، فيُظنُّ أن العملَ لم يبدأ.
     فصارت بطاقةٌ تقول ما ينقص قبل أن يبدأ الموسم، بترتيب الأثر: ما يُعطّل
   الحسابَ أوّلًا، ثم ما يُعطّل التقرير، ثم ما يُعطّل المحضر. ولكلِّ سطرٍ
   زرٌّ يذهب إلى موضع ضبطه — لا يُقال «اضبطه» ويُترَك البحثُ للناظر. */

/* ═══ بدءُ الموسم بقيمٍ مقترحة ═══
   المبدأُ في هذا النظام أن لا قيمةَ افتراضيةً صامتة: كلُّ وزنٍ وتارجتٍ
   يبدأ صفرًا ويُضبط بيد المهندس — لئلّا يُبنى تقريرٌ على رقمٍ لم يقصده أحد.
   لكنَّ الصفرَ لا يُعطي بدايةً: من يفتح النظامَ أوّلَ مرةٍ يجد أربعةَ عشرَ
   حقلًا خاليًا ولا يدري بأيِّها يبدأ ولا ما المعقول فيه.
     فصار زرٌّ واحدٌ يكتب **مقترحًا** مبنيًّا على البيانات نفسِها — عددُ
   النقاط الفعليُّ وأنواعُها ومواعيدُ الموسم — ويُسجَّل في السجل باسم من
   ضغطه، ويبقى كلُّ رقمٍ قابلًا للتغيير في شاشته. المقترحُ ليس افتراضًا:
   الأولُ فعلٌ صريحٌ يُرى ويُراجَع، والثاني قرارٌ يُتَّخَذ عن صاحبه. */
function seedPlan(){
  var byType = {}, n = 0;
  (STATE.sites || []).forEach(function(x){
    n++;
    var k = x.zone + '|' + catLabel(x);
    byType[k] = (byType[k] || 0) + 1;
  });
  /* وزنُ الزيارة بالجهد لا بالعدد: الممرُّ أبعدُ من المخيّم، والجمراتُ أشقّ */
  var W = { 'مخيمات':1, 'ممرات':2, 'منطقة الجمرات':3, 'منشأة الجمرات':3, 'محطات القطار':2,
            'مسجد نمرة':2, 'كاميرات الوزارة':1.5 };
  var wRows = Object.keys(byType).map(function(k){
    var cat = k.split('|')[1];
    return { k:k, n:byType[k], w:W[cat] || 1.5 };
  }).sort(function(a, b){ return b.n - a.n; });
  var day = 86400000, today = dayKey(Date.now());
  var dueS = Date.now() + 45 * day, dueI = Date.now() + 100 * day;
  var left = n - (siteStats().surveyed || 0);
  var wd = Math.max(1, Math.round(45 * 26 / 30));   /* أيامُ عملٍ في خمسةٍ وأربعين يومًا */
  return {
    n:n, wRows:wRows, dueS:dueS, dueI:dueI,
    tgtSurvey:Math.max(1, Math.ceil(left / wd)),
    vals:{ insCamp:5, insCor:8, disOk:2, disBad:1, days:26, warranty:12,
           minCamp:1, minCor:1, reservePct:10 }
  };
}
function seedApply(){
  if (!may('settings')){ toast(t('بدءُ الموسم للمهندس وحده')); return; }
  var P = seedPlan(), n = 0;
  P.wRows.forEach(function(r){ if (!cfgGet('w', r.k)){ cfgSet('w', r.k, r.w); n++; } });
  Object.keys(P.vals).forEach(function(k){
    if (!cfgGet(k)){ cfgSet(k, null, P.vals[k]); n++; }
  });
  if (!cfgGet('tgtSurvey')){ cfgSet('tgtSurvey', null, P.tgtSurvey); n++; }
  if (!cfgGet('dueSurvey')){ cfgSet('dueSurvey', null, P.dueS); n++; }
  if (!cfgGet('dueInstall')){ cfgSet('dueInstall', null, P.dueI); n++; }
  logEvent('بدء الموسم — كُتب مقترحٌ في ' + nm(n) + ' حقلًا');
  toast(nm(n) + ' ' + t('حقلًا كُتب بمقترحه — راجعه في شاشته'));
  statBump(); render(1);
  return n;
}
function seedCard(){
  var P = seedPlan();
  var empty = P.wRows.filter(function(r){ return !cfgGet('w', r.k); }).length
            + Object.keys(P.vals).filter(function(k){ return !cfgGet(k); }).length
            + (cfgGet('tgtSurvey') ? 0 : 1) + (cfgGet('dueSurvey') ? 0 : 1) + (cfgGet('dueInstall') ? 0 : 1);
  if (!empty) return '';
  return card('\u{1F331} ' + t('ابدأ الموسم بمقترح'),
      '<p class="hint" style="margin:0 0 8px">'
      + esc(t('أربعةَ عشرَ حقلًا تبدأ صفرًا — لا افتراضًا صامتًا بل قرارًا ينتظر صاحبَه. وهذا مقترحٌ مبنيٌّ على بياناتك: عددُ نقاطك وأنواعُها وأيامُ الموسم.'))
      + '</p>'
      + table(['ما يُكتَب','المقترح','على ماذا بُني'], [
          [esc(t('أوزانُ الزيارة')), nm(P.wRows.length) + ' ' + esc(t('صنفًا')),
           esc(t('الجهدُ لا العدد: الممرُّ ضعفُ المخيّم، والجمراتُ ثلاثةُ أضعافه'))],
          [esc(t('تارجتُ المسح اليوميّ')), '<b class="num">' + nm(P.tgtSurvey) + '</b>',
           esc(t('ما بقي من نقاطٍ على أيام العمل حتى موعد المسح'))],
          [esc(t('موعد انتهاء المسح')), '<span class="num">' + esc(dayKey(P.dueS)) + '</span>',
           esc(t('خمسةٌ وأربعون يومًا من اليوم — غيّره إن كان الموسمُ أقرب'))],
          [esc(t('موعد انتهاء التركيب')), '<span class="num">' + esc(dayKey(P.dueI)) + '</span>',
           esc(t('مئةُ يومٍ من اليوم'))],
          [esc(t('نقاطُ التركيب')), '<span class="num">' + nm(5) + ' / ' + nm(8) + '</span>',
           esc(t('مخيمٌ خمسٌ وممرٌّ ثمانٍ — الممرُّ أشقُّ تركيبًا'))],
          [esc(t('شهورُ الضمان')), '<span class="num">' + nm(12) + '</span>', esc(t('سنةٌ من تاريخ المحضر'))],
          [esc(t('نسبةُ الاحتياطي')), '<span class="num">' + nm(10) + '٪</span>', esc(t('المعتادُ في مشاريع التركيب'))],
          [esc(t('سقفُ الميزانية')), pill('يبقى لك', 'wrn'), esc(t('رقمٌ تعاقديٌّ لا يُقترَح — اكتبه في «الميزانية»'))]
        ])
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('لا يُكتَب إلا الحقلُ الفارغ — وما ضبطتَه بيدك لا يُمَسّ. وكلُّ رقمٍ يبقى قابلًا للتغيير في شاشته.')) + '</p>',
      btn('\u{1F331} ' + t('اكتب المقترح'),'btn-primary btn-sm',' data-seedgo="1"'));
}
function readyRows(){
  var wKeys = Object.keys(CFG.w || {}).length;
  var signed = hoSigners().some(function(g){ return g.n; });
  var cmp = Object.keys(coCompounds()).length;
  var bk = (BK_STATE.meta && BK_STATE.meta.ok) === true;
  return [
    { ok:wKeys > 0,                 t:'أوزانُ الزيارة',        why:t('بلا وزنٍ لا تُحتسَب نقطةٌ لأحدٍ — والأداءُ كلُّه صفر'), p:'pts' },
    { ok:!!cfgGet('insCamp') || !!cfgGet('insCor'), t:'نقاطُ التركيب', why:t('بلا نقاطٍ للتركيب لا يُقاس عملُ فرق التركيب'), p:'pts' },
    { ok:!!cfgGet('tgtSurvey'),     t:'تارجتُ المسح اليوميّ',  why:t('بلا تارجتٍ لا تُقاس الوتيرةُ ولا يُعرَف «هل نلحق؟»'), p:'setup' },
    { ok:!!cfgGet('dueSurvey') && !!cfgGet('dueInstall'), t:'موعدا المسح والتركيب', why:t('بلا موعدٍ لا يُعرَف متأخّرٌ من مُنجِز'), p:'setup' },
    /* سعرُ النقطة يدخل خطَّ الأساس نفسَه: BAC = مجموعُ النقاط × السعر.
       فبلا سعرٍ يُجمَّد خطُّ أساسٍ ميزانيتُه صفر، وتعود القيمةُ المكتسبةُ
       أصفارًا مهما أُنجز — وهو أخطرُ من غياب السقف لأنه يُسكِت المؤشِّراتِ
       كلَّها لا شاشةَ الميزانية وحدَها. */
    { ok:!!cfgGet('ph'),            t:'سعرُ النقطة',           why:t('بلا سعرٍ للنقطة تكون القيمةُ المكتسبة صفرًا مهما أُنجز — ولا يُجمَّد خطُّ أساسٍ له ميزانية'), p:'consts' },
    { ok:!!cfgGet('budCap'),        t:'سقفُ الميزانية',        why:t('بلا سقفٍ لا انحرافَ كلفةٍ ولا احتياطيَّ يُقاس'), p:'budget' },
    { ok:!!BASE,                    t:'خطُّ الأساس مجمَّد',     why:t('بلا خطِّ أساسٍ لا يُقارَن الواقعُ بشيء'), p:'miles' },
    { ok:mileList().some(function(m){ return mileDateOf(m); }), t:'مواعيدُ المعالم', why:t('بلا مواعيدَ لا يُعرَف معلَمٌ تأخّر'), p:'miles' },
    { ok:signed,                    t:'أسماءُ المعتمِدين',     why:t('محضرٌ بأسماءٍ فارغةٍ يُرَدُّ من الوزارة'), p:'consts' },
    /* الرقمُ يُركَّب مع نصٍّ مترجَم — لا يُصنَع سطرٌ عربيٌّ ثابتٌ بالجمع */
    { ok:cmp === 0,                 t:'توحيدُ الأسماء المركَّبة', why:nm(cmp) + ' ' + t('قيمةً تحمل عدةَ شركاتٍ — لا تُحسَب نقاطُها'), p:'co' },
    { ok:!!cfgGet('warranty'),      t:'شهورُ الضمان',          why:t('المحضرُ يذكر نهايةَ الضمان — وبلا مدةٍ لا نهاية'), p:'consts' },
    { ok:bk,                        t:'النسخةُ الاحتياطية',    why:t('السيرُ ينجح ولا يحفظ حتى تُضبَط أسرارُه'), p:'hb' },
    /* حارسُ التكلفة (V17.96): بلا تنبيهٍ للميزانية لا يُعلَم بفاتورةٍ إلا حين تصل */
    { ok:!!cfgGet('budgetAlert'),   t:'تنبيهُ الميزانية مضبوط', why:t('بلا تنبيهٍ في Google Cloud لا يُعلَم بتجاوز الحصة المجانية إلا في الفاتورة — يُضبَط مرةً ويُؤشَّر هنا'), p:'consts' }
  ];
}
function readyCard(){
  bkFetch(false);
  var R = readyRows(), miss = R.filter(function(r){ return !r.ok; });
  if (!miss.length) return card('\u2705 ' + t('جاهزيةُ الموسم'),
    '<p class="hint" style="text-align:center;margin:0">'
    + esc(t('كلُّ ما يُعطِّل الحسابَ مضبوط — النظامُ يقيس ويقارن ويُصدِر المحاضر.')) + '</p>');
  return cardFlush('\u26A0 ' + t('جاهزيةُ الموسم') + ' \u2014 ' + nm(miss.length) + ' ' + t('ينقص'),
      table(['ما ينقص','لماذا يهمّ',''],
        miss.map(function(r){
          return ['<strong>' + esc(t(r.t)) + '</strong>',
                  '<span class="hint" style="margin:0">' + esc(r.why) + '</span>',
                  seesPage(PARENT[r.p] || r.p)
                    ? btn('\u2190 ' + t('اضبطه'),'btn-quiet btn-sm',' data-p="' + esc(r.p) + '"') : '\u2014'];
        }))
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('كلُّ سطرٍ هنا يُعطِّل حسابًا في صمت: الشاشةُ تعمل وتعرض صفرًا فيُظنُّ أن العملَ لم يبدأ. ويختفي السطرُ فورَ ضبطه.'))
      + '</p>');
}

/* ═══ الدعوةُ يفعّلها صاحبُها ═══
   الحسابُ يُسجَّل في «المدعوّون» باسمه ودوره — بلا كلمةِ مرور. ويفتح صاحبُه
   التطبيقَ ويضع كلمتَه هو، فيُنشَأ حسابُ دخوله وتُكتَب وثيقتُه بالدور الذي
   دُعي به، ثم تُمحى الدعوة. والقاعدةُ تحرس ذلك: لا يكتب أحدٌ لنفسه دورًا
   غيرَ الذي في دعوته، ولا يفعّل دعوةَ غيره. */

/* ═══ الدعوةُ الجماعية ═══
   بمئةٍ وخمسين شخصًا لا يُنشأ حسابٌ حسابًا: يُلصَق جدولُ الفريق كما هو من
   إكسل — اسمٌ واسمُ مستخدمٍ ودورٌ (والوظيفةُ والفريقُ إن وُجدا) — فتُكتَب
   الدعواتُ كلُّها في نداءٍ واحد، ويفعّل كلٌّ حسابَه بنفسه.
     ولا يُكتَب سطرٌ ناقصٌ ولا مكرَّرٌ ولا بدورٍ لا تعرفه القاعدة: يُعرَض ما
   سيُكتَب وما سيُترَك وسببُه قبل الكتابة — فلا يُفاجَأ أحدٌ بنصف فريقٍ ناقص. */
var BULK_TXT = '';
/* كلمةٌ عشوائيةٌ من عشرة أحرفٍ بلا حروفٍ تلتبس في الطباعة (0/O · 1/l/I) */
function passGen(){
  var A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789', out = '';
  var buf = new Uint32Array(10);
  (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(buf)
    : buf.forEach(function(_, i){ buf[i] = Math.floor(Math.random() * 1e9); });
  for (var i = 0; i < 10; i++) out += A[buf[i] % A.length];
  return out;
}
/* الدورُ يُفهَم كما يُكتَب لا كما يُخزَّن: «مطّلع» و«وزارة» و«viewer» دورٌ
   واحد، و«مهندس المشروع» مهندسٌ، والتشكيلُ والهمزةُ والتاءُ المربوطةُ لا
   تفرّق. كان المطابقُ حرفيًّا فتُترَك سطورٌ بسبب شدّةٍ أو مرادف. */
function normAr(x){
  return String(x || '').replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim().toLowerCase();
}
var ROLE_ALIAS = {
  viewer:['مطلع','وزاره','مراقب','مراقب وزاري','ministry','observer'],
  exec:['اداره عليا','الاداره العليا','تنفيذي','executive','senior'],
  admin:['مدير','مدير المشروع','pm','project manager'],
  engineer:['مهندس','مهندس المشروع','engineer'],
  supervisor:['مشرف','supervisor'], tech:['فني','فني تركيب','technician'],
  cprep:['تهيئه','فريق التهيئه','مسؤول تهيئه'], casm:['تجميع','فريق التجميع','مسؤول تجميع'],
  cins:['فريق التركيب','تركيب'], buyer:['مشتريات','purchasing'], store:['مستودع','مخزن','store'],
  acct:['محاسب','محاسبه','accountant'], helper:['مساعد','مساعد فني'], driver:['سائق','driver']
};
function roleGuess(x){
  var q = normAr(x);
  if (!q) return '';
  if (ROLES[x]) return x;
  var hit = '';
  Object.keys(ROLES).forEach(function(k){
    if (hit) return;
    if (normAr(ROLES[k].n) === q) hit = k;
  });
  if (hit) return hit;
  Object.keys(ROLE_ALIAS).forEach(function(k){
    if (hit) return;
    if (ROLE_ALIAS[k].some(function(a){ return normAr(a) === q; })) hit = k;
  });
  return hit;
}
function jobGuess(x){
  var q = normAr(x);
  if (!q) return '';
  var L = jobsList(), hit = '';
  L.forEach(function(j){ if (!hit && (j.id === x || normAr(j.n) === q)) hit = j.id; });
  if (!hit) L.forEach(function(j){ if (!hit && normAr(j.n).indexOf(q) > -1) hit = j.id; });
  return hit;
}
function bulkParse(txt){
  var seen = {}, out = [];
  String(txt || '').split(/\r?\n/).forEach(function(line, i){
    var raw = line.trim();
    if (!raw) return;
    var c = raw.split(/\t|,|;|\|/).map(function(x){ return x.trim(); }).filter(function(x, k){ return k < 5; });
    /* الأعمدةُ: الاسم · المستخدم · الدور · الوظيفة · الفريق · كلمةُ المرور · البريد
       — والكلمةُ إن لم تُلصَق تُولَّد هنا فتُطبَع في ورقة الدخول */
    var c7 = raw.split(/\t|,|;|\|/).map(function(x){ return x.trim(); });
    var name = c[0] || '', user = (c[1] || '').replace(/\s+/g, ''), rl = c[2] || '', jb = c[3] || '', cr = c[4] || '';
    var pw = c7[5] || '', em = c7[6] || '';
    var row = { n:i + 1, name:name, user:user, role:roleGuess(rl), job:jobGuess(jb), crew:cr,
                pass:pw || passGen(), email:em };
    if (!name || !user) row.why = 'الاسمُ واسمُ المستخدم إلزاميان';
    else if (!/^[A-Za-z0-9._-]{3,}$/.test(user)) row.why = 'اسمُ المستخدم حروفٌ لاتينيةٌ وأرقامٌ ونقطة';
    else if (!row.role) row.why = 'دورٌ غيرُ معروف: ' + (rl || '—');
    else if (!canMakeRole(row.role)) row.why = 'أعلى من دورك — لا يُنشئه إلا من فوقك';
    else if (seen[user]) row.why = 'مكرَّرٌ في اللصق';
    else if (pw && pw.length < 10) row.why = 'كلمةُ المرور أقلُّ من عشرة أحرف';
    else if ((STATE.provision || {})[user] && (STATE.provision[user].status === 'pending')) row.why = 'له طلبٌ قائم';
    /* من له حسابٌ لا يُرفَض: طلبُه إعادةُ إصدارٍ — الخادمُ يضبط كلمتَه
       الجديدةَ فيدخل من نسي. ويُعلَّم كذلك ليُعرَف في الفحص. */
    else if (Object.keys(STATE.users || {}).some(function(k){
      var uu = STATE.users[k] || {}; return uu.user === user && !uu.provisioning; }))
      row.reissue = true;
    if (!row.why) seen[user] = 1;
    out.push(row);
  });
  return out;
}
function bulkApply(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var rows = bulkParse(BULK_TXT).filter(function(r){ return !r.why; });
  if (!rows.length){ toast(t('لا سطرَ صالحٌ للكتابة')); return; }
  STATE.provision = STATE.provision || {};
  rows.forEach(function(r){
    var v = { name:r.name, user:r.user, role:r.role, pass:r.pass, status:'pending',
              at:Date.now(), by:STATE.meta.name || '' };
    if (r.job)   v.job   = r.job;
    if (r.crew)  v.crew  = r.crew;
    if (r.email) v.email = r.email;
    if (r.reissue) v.reissue = true;
    STATE.provision[r.user] = v;
    /* الحسابُ القائمُ لا يُكرَّر صفًّا «يُنشَأ» — الطلبُ يضبط كلمتَه فقط */
    if (!r.reissue)
      STATE.users[r.user] = { name:r.name, user:r.user, role:r.role, active:true, at:Date.now(), provisioning:true };
    CORE.set('provision', r.user, v);
  });
  provKick();
  logEvent('طلبُ حساباتٍ جماعيّ — ' + nm(rows.length) + ' حسابًا');
  toast(nm(rows.length) + ' ' + t('طلبًا كُتب — يُنشئها الخادمُ خلال دقائق، ثم صدِّر ورقةَ الدخول'));
  BULK_TXT = ''; statBump(); render(1);
}
function bulkCard(){
  if (!canProvision()) return '';
  var rows = BULK_TXT ? bulkParse(BULK_TXT) : [];
  var okN = rows.filter(function(r){ return !r.why; }).length;
  return card('\u{1F465} ' + t('دعوةٌ جماعية — الصق قائمةَ الفريق'),
      '<p class="hint" style="margin:0 0 8px">'
      + esc(t('سطرٌ لكلِّ شخص: الاسم · اسم المستخدم · الدور · الوظيفة · الفريق — مفصولةً بجدولةٍ أو فاصلة. انسخها من إكسل كما هي.'))
      + '</p>'
      + '<div class="field"><textarea id="bulkT" rows="6" dir="auto" '
      /* المثالُ يُركَّب من كلماتٍ مترجَمةٍ لا سطرًا واحدًا فيه جدولات:
         سطرٌ بالجدولات لا يُترجَم ويظهر عربيًّا في واجهةٍ إنجليزية. */
      +   'placeholder="' + esc([t('أحمد علي'), 'm.ahmed', t('فني'), t('فني تركيب'), t('فريق') + ' ١'].join('\t')) + '">'
      +   esc(BULK_TXT) + '</textarea></div>'
      + (rows.length
        ? table(['#','الاسم','المستخدم','الدور','الحال'],
            rows.slice(0, 60).map(function(r){
              return [N(r.n), esc(r.name || '—'),
                      '<span class="num" dir="ltr">' + esc(r.user || '—') + '</span>',
                      esc(r.role ? t((ROLES[r.role] || {}).n || r.role) : '—'),
                      r.why ? pill(r.why, 'off') : (r.reissue ? pill('إعادةُ إصدار كلمة','wrn') : pill('يُكتَب','ok'))];
            }))
        : '')
      + (rows.length
        ? '<p class="hint" style="margin:8px 0 0">' + nm(okN) + ' ' + esc(t('سيُكتَب')) + ' \u00b7 '
          + nm(rows.length - okN) + ' ' + esc(t('يُترَك — لكلٍّ سببُه أعلاه')) + '</p>'
        : ''),
      btn('\u{1F441} ' + t('افحص'),'btn-secondary btn-sm',' data-bulkchk="1"')
      + (okN ? btn('\u2709 ' + t('اكتب') + ' ' + nm(okN) + ' ' + t('دعوة'),'btn-primary btn-sm',' data-bulkgo="1"') : ''));
}

/* ═══ طلباتُ الإنشاء وورقةُ الدخول ═══
   المكتبُ يرى حالَ كلِّ طلب — يُنشَأ · تمّ · خطأ بسببه — ويُصدِر ورقةَ
   الدخول إكسل: الاسمُ والمستخدمُ والكلمةُ والدور، ورقةٌ لكلِّ فريق يوزّعها
   مشرفُه. ثم يمسح الكلماتِ من الطلبات بضغطة — فلا تبقى في القاعدة. */

/* ═══ شغّل الخادمَ الآن ═══
   جدولةُ GitHub «كلَّ عشر دقائق» ليست عشرًا: على مستودعٍ هادئٍ تتأخّر إلى
   ساعةٍ ونصف كما وقع — فيبقى الطلبُ «يُنشَأ — خلال دقائق» ساعةً. الطريقُ
   المضمونُ نداءُ التشغيل نفسِه، وهو يحتاج مفتاحًا بصلاحية تشغيل السيور
   وحدَها (Actions: write على هذا المستودع لا غير) — يضعه مديرُ المشروع
   مرةً في الإعدادات، ويبقى في وثيقةٍ لا يقرؤها إلا هو. وبلا مفتاحٍ يبقى
   رابطُ صفحة التشغيل اليدويّ. */
var GH_REPO = 'mhmdsfwt371/Project-survey';
function ghToken(){ return String((CFG.gh || {}).tok || ''); }
function ghSetToken(v){
  if (!may('roles')){ toast(t('مفتاحُ التشغيل لمدير المشروع وحده')); return; }
  var tk = String(v || '').trim();
  CFG.gh = Object.assign({}, CFG.gh || {}, { tok:tk, at:Date.now() });
  /* وثيقةٌ مستقلةٌ لا تُخلَط بالإعدادات العامّة التي يقرؤها الجميع */
  CORE.set('ghcfg', 'gh', { tok:tk, at:Date.now() });
  toast(tk ? t('حُفظ مفتاحُ التشغيل') : t('مُسح المفتاح'));
}
function ghRunNow(quiet){
  if (!may('provision')){ if (!quiet) toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return Promise.resolve(false); }
  var tk = ghToken();
  if (!tk){
    /* لا مفتاحَ على هذا الجهاز: لا يُرسَل أحدٌ إلى GitHub — يُقال له ما ينقص ومن يملكه */
    if (!quiet) toast(t('لا مفتاحَ تشغيلٍ على هذا الجهاز — يحفظه مديرُ المشروع في ثوابت النظام، ثم يعمل الزرُّ من هنا لكلِّ من يُنشئ الحسابات'));
    return Promise.resolve(false);
  }
  toast(t('يُطلَب تشغيلُ الخادم…'));
  return fetch('https://api.github.com/repos/' + GH_REPO + '/actions/workflows/provision.yml/dispatches', {
    method:'POST',
    headers:{ 'Authorization':'Bearer ' + tk, 'Accept':'application/vnd.github+json', 'Content-Type':'application/json' },
    body:JSON.stringify({ ref:'main' })
  }).then(function(r){
    if (r.status === 204){
      GH_RAN = Date.now();
      logEvent('تشغيلُ خادم الحسابات يدويًّا');
      toast(t('انطلق الخادم — الحساباتُ خلال دقيقة، وتصلك «تمّ» هنا فورًا'));
      render(1); return true;
    }
    if (r.status === 401 || r.status === 403){   /* (V30.7) المفتاحُ منتهٍ: الطلبُ محفوظٌ ويُنفَّذ مع أقرب دورةٍ — ويُقال ذلك بوضوح، ويُعلَّم المفتاحُ ليراه المدير */
      CFG.gh = Object.assign({}, CFG.gh || {}, { bad:Date.now(), badCode:r.status });
      toast(t('الخادمُ لم يُشغَّل (مفتاحُ التشغيل منتهٍ). اضغط «أنشئه من هذا الجهاز الآن» بجوار الحساب في القائمة'));
      logEvent('مفتاحُ تشغيل الحسابات رُفض — ' + r.status);
      render(1); return false;
    }
    toast(t('رفض GitHub التشغيل') + ' \u2014 ' + r.status);
    return false;
  }).catch(function(e){ toast(t('تعذّر الاتصال بـ GitHub') + ' \u2014 ' + String(e && e.message || '').slice(0, 40)); return false; });
}
var GH_RAN = 0;
function ghCard(){
  if (!may('roles')) return '';
  var has = !!ghToken();
  return card('\u{1F511} ' + t('مفتاحُ تشغيل الخادم'),
      '<p class="hint" style="margin:0 0 8px">'
      + esc(t('جدولةُ GitHub تتأخّر إلى ساعةٍ على المستودعات الهادئة. بمفتاحٍ صلاحيتُه تشغيلُ السيور وحدَها يُشغَّل الخادمُ فورًا من زرِّ «شغّل الآن» في طلبات الإنشاء.'))
      + '</p>'
      + '<div class="field"><label>' + esc(t('المفتاح')) + (has ? ' ' + pill('محفوظ','ok') : '') + '</label>'
      +   '<input id="ghTok" type="password" dir="ltr" autocomplete="off" placeholder="github_pat_…"></div>'
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('GitHub ← Settings ← Developer settings ← Fine-grained tokens ← Generate: هذا المستودع فقط · Actions: Read and write · لا شيءَ آخر. يحفظه مديرُ المشروع ويعمل الزرُّ به لكلِّ من يُنشئ الحسابات.'))
      + '</p>',
      btn('\u{1F4BE} ' + t('احفظ'),'btn-primary btn-sm',' data-ghsave="1"')
      + (has ? btn('\u{1F5D1} ' + t('امسح'),'btn-quiet btn-sm',' data-ghclear="1"') : ''));
}
/* المفتاحُ محفوظٌ في `key`: كان الحقلُ `user` في الوثيقة يكتب فوق المفتاح —
   فطلبُ حذفِ حسابٍ بلا اسمِ مستخدمٍ (`user:''`) صار بمفتاحٍ فارغ، وأمرُ
   حذفِه دخل الطابورَ بمعرِّفٍ فارغٍ ينفجر عند بناء المرجع فيُسقِط الدفعةَ
   كلَّها كلَّ دقيقةٍ بلا صوت — سبعُ وثائقَ بانتظار الرفع نصفَ ساعة. */
function provList(){
  var P = STATE.provision || {};
  return Object.keys(P).map(function(k){ return Object.assign({ user:k }, P[k] || {}, { key:k, user:(P[k] || {}).user || k }); })
    .sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
function provWipe(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var n = 0;
  provList().forEach(function(r){
    if (r.status === 'done' && r.pass){
      var v = Object.assign({}, STATE.provision[r.key], { pass:'' });
      STATE.provision[r.key] = v; CORE.set('provision', r.key, v); n++;
    }
  });
  logEvent('مسحُ كلمات المرور من الطلبات — ' + nm(n));
  toast(nm(n) + ' ' + t('كلمةً مُسحت — الورقةُ المصدَّرةُ هي النسخةُ الوحيدة'));
  render(1);
}
/* المنتهيةُ (تمّ/خطأ) تُمسَح بضغطة — تاريخُ الإنشاء في سجل الأحداث لا هنا */
function provClear(){
  if (!may('users')){ toast(t('مسحُ الطلبات للمهندس فما فوق')); return; }
  var n = 0;
  provList().forEach(function(r){
    /* المنتهيةُ وحدَها — وطلبُ حذفِ الدخول يبقى حتى ينفّذه الخادم (status: done) */
    if (r.status === 'done' || r.status === 'error'){
      delete STATE.provision[r.key]; CORE.rm('provision', r.key); n++;
    }
  });
  logEvent('مسحُ طلبات الإنشاء المنتهية — ' + nm(n));
  toast(nm(n) + ' ' + t('طلبًا مُسح'));
  render(1);
}
/* ═══ الطلباتُ حين تكذب الشاشة ═══
   ظهر على هاتف المدير طلبان «يُنشَأ» لحسابين قائمين منذ الصباح، ولا طلبَ
   للحساب الذي يريده فعلًا — والخادمُ يقول: لا طلبَ منتظرًا. الجهازُ يحمل
   نسخةً محليةً من الطلبات قد تفترق عن القاعدة (كُتبت ولم تُرفَع، أو رُفعت
   وعُدِّلت هناك ولم يصل التعديل). فصار للمكتب ثلاثةُ أزرارٍ تقول الحقيقة:
   يجلب الطلباتِ من القاعدة كما هي، ويلغي المعلّقَ كلَّه، ويرى طابورَ الجهاز
   ويدفعه. ومن الصفِّ المؤقت في الحسابات يُعاد الطلبُ بكلمةٍ جديدة. */
var PROV_CANCEL = 0;
var BOARD_ROLE = '';   /* مرشِّحُ الدور في لوحة الفريق */
function provQueued(){
  return (STATE.queue || []).filter(function(q){ return q && q.kind === 'provision'; }).length
       + (STATE.poison || []).filter(function(q){ return q && q.kind === 'provision'; }).length;
}
function provSync(){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return Promise.resolve(false); }
  if (!FB.ready || !FB.db){ toast(t('يحتاج شبكة')); return Promise.resolve(false); }
  toast(t('يُجلَب من القاعدة…'));
  return DB.col('provision').limit(500).get().then(function(sn){
    FB.readCount = (FB.readCount || 0) + sn.size;
    var cloud = {}; sn.forEach(function(d){ cloud[d.id] = d.data(); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    var local = STATE.provision || {}, dropped = 0;
    Object.keys(local).forEach(function(k){ if (!cloud[k]) dropped++; });
    STATE.provision = cloud;
    /* والحساباتُ كما في القاعدة: صفٌّ لحسابٍ حُذف بقي في الجهاز يزول، ودورٌ تغيّر يصل */
    return DB.col('users').limit(500).get().then(function(us){
      FB.readCount = (FB.readCount || 0) + us.size;
      var U = STATE.users || {}, keepTemp = {};
      Object.keys(U).forEach(function(k){ if (U[k] && U[k].provisioning && !uidLike(k)) keepTemp[k] = U[k]; });
      var fresh = {}; us.forEach(function(d){ fresh[d.id] = d.data(); });
      FB.readCount = (FB.readCount || 0) + us.size;
      STATE.users = Object.assign(fresh, keepTemp);
      return { sn:sn, cloud:cloud, dropped:dropped };
    });
  }).then(function(r){
    var sn = r.sn, cloud = r.cloud, dropped = r.dropped;
    /* صفٌّ مؤقتٌ في الحسابات بلا طلبٍ منتظرٍ في القاعدة: ميتٌ — يُزال */
    var U = STATE.users || {}, gone = 0;
    Object.keys(U).forEach(function(k){
      var u = U[k]; if (!u || !u.provisioning || uidLike(k)) return;
      var pr = cloud[k] || cloud[u.user || ''];
      if (!pr || pr.status !== 'pending'){ delete U[k]; gone++; }
    });
    CORE.saveSoon(); statBump(); render(1);
    toast(nm(sn.size) + ' ' + t('طلبًا من القاعدة') + ' \u00b7 ' + nm(dropped) + ' ' + t('محليًّا لم يكن هناك') + ' \u00b7 ' + nm(gone) + ' ' + t('صفًّا مؤقتًا أُزيل'));
    logEvent('جلبُ الطلبات من القاعدة — ' + nm(sn.size) + ' · أُسقط ' + nm(dropped) + ' · أُزيل ' + nm(gone));
    return true;
  }).catch(function(e){ softErr('جلب الطلبات', e, 'تعذّر الجلبُ من القاعدة'); return false; });
}
function provCancelAll(){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return; }
  var n = 0, U = STATE.users || {};
  provList().forEach(function(r){
    if (r.status !== 'pending') return;
    delete STATE.provision[r.key]; CORE.rm('provision', r.key); n++;
    var un = String(r.user || r.key || '');
    if (un && U[un] && U[un].provisioning) delete U[un];
  });
  /* وما في الطابور من طلباتٍ لم تُرفَع يُسقَط معها — وإلا رُفعت بعد الإلغاء */
  if (STATE.queue) STATE.queue = STATE.queue.filter(function(q){ return !(q && q.kind === 'provision' && q.v && q.v.status === 'pending'); });
  PROV_CANCEL = 0; CORE.saveSoon(); statBump();
  logEvent('إلغاءُ الطلبات المعلّقة — ' + nm(n));
  toast(nm(n) + ' ' + t('طلبًا أُلغي'));
  render(1);
}
/* من الصفِّ المؤقت: يُعاد الطلبُ بكلمةٍ جديدةٍ — لمن ضاع طلبُه بين الجهاز والقاعدة */
function provReask(uid){
  if (!may('users')){ toast(t('للمهندس فما فوق')); return false; }
  var u = (STATE.users || {})[uid]; if (!u || !u.user){ toast(t('لا صفَّ مؤقتًا')); return false; }
  var pass = genPass();
  var req = { user:u.user, name:u.name || u.user, pass:pass, role:u.role || 'tech', roleExplicit:true, status:'pending', at:Date.now(), by:STATE.meta.name || '' };
  ['job','sup','dept','email','crew'].forEach(function(k){ if (u[k]) req[k] = u[k]; });
  STATE.provision = STATE.provision || {};
  STATE.provision[u.user] = req;
  logEvent('إعادةُ طلب إنشاء — ' + (u.name || u.user) + ' (' + u.user + ')');
  /* مباشرةً إلى القاعدة ثم الخادم — كما في «كلمة جديدة»؛ وكان يمرُّ بالطابور
     فيقف على شبكةٍ بطيئة ولا يعلم أحدٌ أين وقف */
  pwFlowStart(u, pass);
  if (!FB.ready || !FB.db){ CORE.set('provision', u.user, req); pwFlowSet('nokey', ''); return true; }
  var doc = Object.assign({}, req, { _at:Date.now(), _by:STATE.meta.uid || '' });
  DB.col('provision').doc(u.user).set(FB.clean ? FB.clean(doc) : doc, { merge:true }).then(function(){
    if (!ghToken()){ pwFlowSet('nokey'); return; }
    pwFlowSet('run'); provKick(true);
  }).catch(function(e){ pwFlowSet('error', String(e && (e.code || e.message) || '').slice(0, 80)); });
  return true;
}
function provUserGone(r){
  var un = String(r.user || '').toLowerCase();
  if (!un || r.action === 'delete') return false;
  return !Object.keys(STATE.users || {}).some(function(k){
    var u = STATE.users[k] || {};
    return String(u.user || '').toLowerCase() === un || k.toLowerCase() === un;
  });
}
function provCard(){
  if (!canProvision()) return '';
  var L = provList().filter(function(r){ return r.action !== 'delete'; });
  if (!L.length) return '';
  var pend = L.filter(function(r){ return r.status === 'pending'; }).length;
  var done = L.filter(function(r){ return r.status === 'done'; }).length;
  var err  = L.filter(function(r){ return r.status === 'error'; }).length;
  var withPw = L.filter(function(r){ return r.status === 'done' && r.pass; }).length;
  return cardFlush('\u{1F5A5} ' + t('طلباتُ الإنشاء') + ' \u2014 ' + nm(L.length),
      stats([['يُنشَأ', N(pend), pend ? 'wrn' : ''], ['تمّ', N(done), 'ok'], ['خطأ', N(err), err ? 'bad' : '']])
      + table(['المستخدم','الاسم','الدور','الحال'],
          capList(L, 200).map(function(r){
            return ['<span class="num" dir="ltr">' + esc(r.user) + '</span>', esc(r.name || ''),
                    esc(t((ROLES[r.role] || {}).n || r.role)),
                    (r.status === 'done' ? pill('تمّ','ok')
                  : r.status === 'error' ? pill(r.why || 'خطأ','off')
                  : pill('يُنشَأ — خلال دقائق','wrn'))
                    + (provUserGone(r) ? ' ' + pill('حسابُه حُذف','off') : '')];
          }))
      + (function(){
          var q = provQueued();
          return q ? alertBox('warn', nm(q) + ' ' + t('طلبًا في طابور هذا الجهاز لم يصل القاعدةَ بعد — اضغط «ادفع الآن»')) : '';
        })()
      + '<div class="actions" style="margin-top:10px">'
      +   (pend ? btn('\u26A1 ' + t('شغّل الخادمَ الآن'),'btn-primary btn-sm',' data-ghrun="1"') : '')
      +   (provQueued() ? btn('\u2B06 ' + t('ادفع الآن'),'btn-secondary btn-sm',' data-pull="1"') : '')
      +   (may('users') ? btn('\u{1F504} ' + t('أعد الجلب من القاعدة'),'btn-quiet btn-sm',' data-provsync="1"') : '')
      +   (pend && may('users') ? (PROV_CANCEL ? btn('\u{1F5D1} ' + t('تأكيد إلغاء المعلّق') + ' (' + nm(pend) + ')','btn-danger btn-sm',' data-provcancelgo="1"')
                                             : btn('\u{1F5D1} ' + t('ألغِ المعلّق'),'btn-quiet btn-sm',' data-provcancel="1"')) : '')
      +   ((done || err) && may('users') ? btn('\u{1F9F9} ' + t('امسح المنتهية') + ' (' + nm(done + err) + ')','btn-quiet btn-sm',' data-provclear="1"') : '')
      +   (withPw ? btn('\u2B07 ' + t('إكسل — ورقةُ الدخول') + ' (' + nm(withPw) + ')','btn-primary btn-sm',' data-xls="provsheet"') : '')
      +   (withPw ? btn('\u{1F9F9} ' + t('امسح كلمات المرور بعد التوزيع'),'btn-quiet btn-sm',' data-provwipe="1"') : '')
      + '</div>'
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t(pend ? 'اضغط «شغّل الخادمَ الآن» فتُنشَأ خلال دقيقة — الجدولةُ وحدَها قد تتأخّر ساعة. ثم صدِّر الورقةَ ووزِّعها، وامسح الكلمات.'
                   : 'صدِّر الورقةَ ووزِّعها على المشرفين، ثم امسح الكلمات — الورقةُ تصير النسخةَ الوحيدة، وكلٌّ يبدّل كلمتَه أوّلَ دخول.'))
      + '</p>');
}

/* ═══ كلمةُ المرور: تُبدَّل أوّلَ دخولٍ ومتى شاء صاحبُها ═══
   ورقةُ الدخول تُطبَع وتُوزَّع، والخادمُ يكتب على الحساب أن كلمتَه مؤقتة —
   ولم يكن في التطبيق مكانٌ لتبديلها: فتبقى الكلمةُ المطبوعةُ على الورق هي
   الكلمةَ طولَ الموسم، ووعدُ «يبدّلها أوّلَ دخول» بلا تنفيذ. صارت نافذةٌ
   تُفرَض عند الدخول إن كانت الكلمةُ مؤقتة (لا تُغلَق حتى تُبدَّل)، وتُفتَح
   من القائمة متى شاء صاحبُها. والقديمةُ تُطلَب لتُثبَت الهوية — إلا في
   الدخول الأوّل فالمصادقةُ أثبتتها للتوّ. */
var PW = null;   /* { forced:true } عند الدخول الأوّل — أو {} من القائمة */
/* كلمةُ هذه الجلسة كما كُتبت في نموذج الدخول — في الذاكرة فقط: بها تُثبَت
   الهويةُ صامتةً إن طلبت المصادقةُ دخولًا حديثًا عند تبديل المؤقتة، فلا يُقال
   «ادخل من جديد» لمن دخل للتوّ. والجلسةُ المستعادةُ بلا كلمةٍ تسأل عنها. */
var SESS_PW = '';
/* ═══ ما الجديد — رسالةٌ واحدةٌ عند أوّل فتحٍ بعد التحديث (V17.87) ═══
   التحديثُ يصل الهاتفَ صامتًا فلا يعرف الميدانُ ما تبدّل. صار لكلِّ نسخةٍ
   سطورٌ بلسان المستخدم لا بلسان الشيفرة، تُعرَض مرةً واحدةً عند أوّل فتحٍ
   بعد التحديث — لآخر نسخةٍ وحدَها — ثم لا تُعاد. وأوّلُ تثبيتٍ لا يُزعَج بها.
   الجردُ يمنع نشرَ نسخةٍ بلا سطورها. */
var RELEASE_NOTES = [
  /* سطورُ «ما الجديد» تُكتَب بعربيةٍ فصيحةٍ مبسَّطةٍ بلا تشكيلٍ ولا عامّيةٍ ولا
     مصطلحاتٍ داخلية — يفهمها ممثّلُ الوزارة من أوّل قراءة كما يفهمها الفني (V17.89) */
  { v:'V37.16', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'كروت الزيارة والمسح والتركيب والتسليم والفك في متابعة الوزارة بقت بتفتح «لوحة» بدل القائمة: العدد ونسبته، وآخر ٧ أيام والنهارده، وتوزيعها حسب المشعر والنوع والشركة والمنفّذ، والتحديات، وآخر ١٤ يوم. والتفاصيل من «تصدير إكسل — التفاصيل»، وفيه زرار «القائمة» لو احتجت صور نقطة بعينها.',
      'صور نموذج المسح: تقدر تختار صورة من المعرض في الموبايل مش من الكاميرا بس، وفيه زرار «🗑 احذف الصورة» تحت أي صورة اتاخدت غلط قبل الحفظ.' ] },
  { v:'V37.15', d:'٨ أكتوبر ٢٠٢٦', notes:[
      '«تحتاج زيارة أخرى تقنيًا» بقت «تحتاج زيارة أخرى»: دي النقط اللي اتزارت وما اتمسحتش (الطريق مقفول، أو مفيش تصريح، أو اتمنعنا، أو الموقع مش مطابق).',
      'حالة جديدة على الخريطة «تحتاج زيارة تقنية»: النقط اللي تحت كوبري أو جوه نفق أو في بدايته (من اختيار الفني أو ملاحظته)، والممرات اللي مفيهاش سطح تثبيت. المخيمات مش داخلة فيها. واللي المهندس رجّعها بقت «أعادها المهندس — زيارة أخرى».' ] },
  { v:'V37.14', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'القوائم بتفتح وتقفل في لحظة: بقت بتتفتح لوحدها من غير ما الصفحة كلها تتعاد (كانت بتاخد ثانية لثانيتين في الفتح ومثلهم في القفل).',
      '«جهة الحل» بقت «جهة الدعم المطلوب»: لما تدوس عليها بتطلع نافذة صغيرة فيها كل جهة ونوع الدعم المطلوب منها لوحدها. والمهندس يقدر يحط أكتر من جهة لنفس التحدي، كل واحدة بنوع دعم مختلف، من «✎ تعديل المسميات وجهات الدعم» (سطر لكل جهة: الجهة: نوع الدعم).' ] },
  { v:'V37.13', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'مراجعة شاملة بعين فريق التطوير والجودة: رجع زرار «إضافة فئة» في المشتريات يشتغل (كان محرّر المسميات بيبلعه)، ونموذج «تعديل البيانات» بقى بالحذف النهائي نفسه، وعدّاد استهلاك القراءات بقى مظبوط (كان بيعدّ مرتين)، والشريط الأصفر للصور فيه ✕ يأجّله نص ساعة، والأرقام بقت أسرع.' ] },
  { v:'V37.12', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'الحذف النهائي اتنشر: أي مهندس فأعلى يحذف أي نقطة ما اتركّبتش بزرار «🗑 حذف نهائي» وتأكيد واحد، فتتشال من كل مكان وعند الكل في ثواني ومن غير استرجاع. والسحابة نفسها بتمنع أي حد يرجّعها.' ] },
  { v:'V37.11', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي: قاعدة الحذف النهائي في السحابة بقت أخف وأوضح.' ] },
  { v:'V37.10', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي لاختبارات الحذف النهائي.' ] },
  { v:'V37.9', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'الحذف بقى نهائي: أي مهندس فأعلى يقدر يحذف أي نقطة ما اتركّبتش (اتزارت أو لأ) بزرار «🗑 حذف نهائي» وتأكيد واحد. النقطة بتتشال من كل مكان وعند كل الناس في ثواني، وما بتظهرش في «نقاط مخفية»، ومفيش استرجاع من التطبيق. والنقطة المركّبة عليها قفل وما بتتحذفش.' ] },
  { v:'V37.8', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'فتح الصور بقى أسلس: لما تفتح صور نقطة من أي قائمة وتقفلها، بترجع لنفس المكان اللي كنت فيه بالظبط. والصورة لما تكبّرها بتظهر فوق كل حاجة.',
      'أي نافذة بتتمرّر: الراس بزرار ✕ ثابت فوق مهما نزلت.',
      'للمهندس: كارت «صور ليست على الدرايف» في ملخص الوزارة (مش ظاهر للوزارة): عددها حسب كل فني، والصور المعلّقة على موبايل كل واحد ومن إمتى، وكل رقم بيفتح القائمة. وعلى موبايل الفني: شريط أصفر فوق الشاشة لو فيه صور ما اترفعتش من أكتر من ساعة، وفيه زرار «ارفع الآن».' ] },
  { v:'V37.7', d:'٨ أكتوبر ٢٠٢٦', notes:[
      '«الصور لم تصل هذا الجهاز بعد»: الصور كانت على الدرايف فعلًا، لكن الجهاز بيحمل في أول تشغيل أحدث ١٬٥٠٠ صورة بس من ٣٬٧٢٠. دلوقتي لما تفتح أي نقطة، صورها بتتجاب من القاعدة على طول وتظهر. ولو مش موجودة في القاعدة، بيقولك بالظبط: «لم تُرفع من جهاز فلان بعد».' ] },
  { v:'V37.6', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'في كل قائمة بتفتح من الكروت (أسباب عدم المسح، والتحديات، والمعوّقات، وغيرها) فيه عمود «الصور»: زرار «📷 والعدد» بيفتح صور النقطة فوق القائمة، ومكتوب معاها حالتها وسبب عدم مسحها، و«رجوع للقائمة» بيرجّعك لنفس المكان.' ] },
  { v:'V37.5', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي لمحرّر المسميات والجهات: اللي بتكتبه بيتحفظ مسودة لحظة كتابته، فما يضيعش لو الشاشة اتحدّثت قبل ما تدوس «حفظ التصنيفات».' ] },
  { v:'V37.4', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'تقدر تعدّل مسميات أسباب عدم المسح وتحديات التركيب، وجهة الحل لكل واحد، وصورة الإثبات، وتشيل أي بند من قائمة الميدان أو تضيف بند جديد. الزرار «✎ تعديل المسميات والجهات» موجود جنب عنوان الكارتين في ملخص الوزارة (للمهندس وما فوق)، أو من الإعدادات.',
      'التعديل بيوصل كل الأجهزة مع المزامنة، والسجلات القديمة بتتقري بالاسم الجديد على طول. ولو مسحت الاسم بيرجع للأصلي.' ] },
  { v:'V37.3', d:'٨ أكتوبر ٢٠٢٦', notes:[
      '«ملاحظات فنية متنوعة» اتشالت من كل القوائم والتقارير: مكانها اسم التحدي الواضح من التمانية، واللي ما يتصنّفش بيظهر بالنص اللي كتبه الميدان نفسه (زي «التصوير ممنوع يحتاج تواصل رسمي»).',
      'عمود القوائم بقى اسمه «الحالة — سبب عدم المسح أو التحديات»: اللي اتزار وما اتمسحش مكتوب «لم يُمسح: السبب» (زي «الطريق أو البوابة مغلقة»)، واللي ما اتزارش «لم تُزر بعد». ونفس الكلام في المعوّقات والإكسل.' ] },
  { v:'V37.2', d:'٨ أكتوبر ٢٠٢٦', notes:[
      'بطاقة «نسبة المسح» في ملخص الوزارة بقت بتحسب المسح الفعلي (كانت بتعرض الزيارات تحت اسم المسح)، والزيارات مكتوبة جنبها. واتضافت بطاقة «زيارة بلا مسح» وبتفتح أسبابها.' ] },
  { v:'V37.1', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'المراحل بقت ٥ (الزيارة، والمسح، والتركيب، والتسليم، والفك) في ملخص الوزارة وشاشة القاعة، ومعاها «قمع المراحل»، وكارت «زيارة بلا مسح» بأسبابه الخمسة وجهة الحل، وكارت «تحديات التركيب» التمانية بجهاتها. والقديم اتوحّد لوحده.',
      'نموذج المسح: «تم الوصول» أو سبب من ٥ من القائمة (من غير كتابة)، والتحديات ٨ من غير «أخرى»، والملاحظة اختيارية. «مقفولة» و«اتمنعنا» محتاجين صورة إثبات. والنقطة اللي تتزار ٣ مرات أو تعدّي ١٠ أيام من غير مسح بتتصعّد بالأحمر.' ] },
  { v:'V37.0', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'المراحل بقت ٥: الزيارة، والمسح، والتركيب، والتسليم، والفك. في ملخص الوزارة وشاشة القاعة: ٥ حلقات، و«قمع المراحل» بالنسبة بين كل مرحلة واللي بعدها، وكارت «زيارة بلا مسح» بأسبابه الخمسة وجهة الحل لكل سبب، وكارت «تحديات التركيب» التمانية بجهة الحل. وكل رقم بيفتح قائمته.',
      'التحديات اللي كانت مكتوبة بأكتر من صيغة (١٨ صيغة و٨٤ نص حر) اتوحّدت لوحدها في ٨ تحديات، وأسباب عدم المسح في ٥. القليل اللي ما يتصنّفش بيظهر للمهندس بس يراجعه.' ] },
  { v:'V36.11', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'إصلاح لقاعدة الحماية الجديدة في السحابة: كان فيها اسم متغيّر غلط بيرفض أي حذف حتى المسموح. اتصلحت، ومحاكي القواعد الرسمي بيجرّبها.' ] },
  { v:'V36.10', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'حذف نقطة ليها زيارة أو تركيب بقى لصاحب المشروع بس (بريده)، في التطبيق وفي السحابة نفسها، لأن حساب تاني بدور «مدير» فضل يحذف نقاط التفويج بعد ما رجعناها. واترجعت تالت مرة.' ] },
  { v:'V36.9', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'حماية في السحابة نفسها: حذف نقطة ليها زيارة أو تركيب بقى ممنوع على غير مدير المشروع حتى من الأجهزة اللي لسه على نسخ قديمة (زي اللي حذف نقطتين تاني بعد الاستعادة).' ] },
  { v:'V36.8', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'استعادة: الـ٢٦ نقطة تفويج (الزايدي، وطريق الهجرة، ومواقع التفويج، والمدينة) اللي اتحذفت بالغلط النهارده الصبح رجعت كلها، وزياراتها وصورها ما اتلمستش أصلًا.',
      'حماية: حذف أي نقطة ليها زيارة أو تركيب بقى لمدير المشروع بس، والمهندس بيحذف اللي ما اتزارتش. و«نقاط مخفية» بقت بتقول مين حذف وإمتى، وفيها زرار «استعِد كل اللي اتحذف النهارده».' ] },
  { v:'V36.7', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'إصلاح ضروري: النقطة اللي المهندس بيحذفها كانت بترجع تاني أو بتفضل ظاهرة عند غيره. السبب كان حاجتين: النقط المضافة كانت بترجع للقائمة مع كل سحب بيانات، والحذف ما كانش بيوصل للأجهزة التانية إلا كل ربع ساعة أو أكتر. دلوقتي الحذف (والاسترجاع والتعديل) بيوصل كل الأجهزة في ثواني، والمحذوفة ما بترجعش.' ] },
  { v:'V36.6', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'حركة المخزن اللي اتسجّلت غلط بتتحذف في نفس يومها (والرصيد بيتصلّح لوحده)، ماعدا «الاستهلاك» لأنه جزء من التركيب. واللي فات عليها يوم بتتصلّح بحركة عكسية (إرجاع أو شطب) زي المحاسبة. واسم الفريق الفرعي بقى بيتعدّل.' ] },
  { v:'V36.5', d:'٧ أكتوبر ٢٠٢٦', notes:[
      '«🗑 حذف» بقى موجود في السجلات اللي كان فيها إضافة واعتماد من غير حذف: بلاغ عدم المطابقة وهو مفتوح، والمستخلص قبل ما يتعتمد، وطلب التغيير قبل القرار، وإسناد السيارة. المالي والجودة بيتلغوا (يفضلوا أثر بحالة «ملغى» ويخرجوا من الحسابات)، وما يتحذفوش بعد الاعتماد أو الإغلاق.',
      '«✎ تعديل» اتضاف كمان لـ: التجارب، وحوادث السلامة، وأعضاء الفرق، والفنيين (الجوال والمشرف والقسم — الاسم لأ عشان سجلاتهم بتحمله)، والأدوار. بكده بقوا ١٨ قائمة فيها تعديل موحّد.' ] },
  { v:'V36.4', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'قرار المالك: أي نقطة اتركّبت — أو بعد التركيب اتسلّمت أو اتفكّت أو اتعملها صيانة — ما بتتحذفش بأي طريقة، وبيظهر عليها قفل بدل زرار الحذف. اللي قبل التركيب (الزيارة والجدولة والإسناد) بيتحذف عادي.' ] },
  { v:'V36.3', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'زرار «🗑 حذف النقطة» بقى في نافذة كل نقطة، حتى النقط المضافة (زي كاميرات طريق الهجرة الجديدة) — كانت متستثنية. والحذف منه بيترجع من «نقاط مخفية»، والحذف النهائي للنقطة المضافة لسه موجود في «تعديل البيانات».' ] },
  { v:'V36.2', d:'٧ أكتوبر ٢٠٢٦', notes:[
      '«✎ تعديل» بقى موجود جنب «حذف» في ١٣ قائمة كان فيها إضافة وحذف بس: سجل المخاطر، والدروس المستفادة، وقواعد التصعيد، ومصفوفة المسؤوليات، والوظائف، وأنواع السيارات، وأنواع النقاط، والسيارات، والشحنات، ونقاط الزيادة، وأصناف الكتالوج، والموردين، وفئات المشتريات. وكل تعديل بيتسجّل باسم اللي عمله.' ] },
  { v:'V36.1', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'حذف نقطة: المهندس بقى يقدر يحذف أي نقطة حتى لو اتزارت أو اتركّبت — من نافذة النقطة على الخريطة على طول (🗑 حذف النقطة) بتأكيد واحد. النقطة بتختفي من كل الأرقام، وزياراتها ما بتتمسحش، وتترجع كاملة من «نقاط مخفية» تحت قائمة المواقع.',
      'المساعد ما بقاش بيقفز لفوق وتحت وانت بتكتب: كان أي تحديث في الخلفية بيعيد رسم نافذته كلها وفيها خانة البحث. دلوقتي النافذة ثابتة والنتائج بس اللي بتتغيّر، وبتقعد فوق الكيبورد مش تحته. ولو سألته «حذف نقطة» بيقولّك فين.' ] },
  { v:'V36.0', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'داخلي للفريق (من غير أي تغيير في الشاشات): كل تعريفات حالة النقطة — تمت الزيارة، وبعوائق وبدون، والتركيب والتسليم والفك، ورقم الشاخص — اتجمعت في ملف واحد، عشان أي تعديل في تعريف يحصل في مكان واحد وما يتكررش خطأ زي محطات القطار.' ] },
  { v:'V35.2', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'رقم الشاخص (واسم ممرات ١٤٤٧) بقى أول حاجة في باقي الشاشات كمان: النقاط المخفية، وتفاصيل النقطة، وتعديل المسح، والقوائم المنسدلة، و«الأقرب»، والإسناد، وقوائم الحقل، وتنبيه التوأم، وملخص العمل اليومي، وجدول التجريبي.' ] },
  { v:'V35.1', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'المخيم اللي فيه أكتر من شركة بقى بيظهر برقم الشاخص في كل سطوره (سطر لكل شركة)، واسم الشركة تحته، ومعرّف النظام تحتهم. والبحث بالشاخص بيرجّع كل الشركات اللي في المخيم.' ] },
  { v:'V35.0', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'المخيمات بقت بتتعرف برقم الشاخص (رقم المخيم/رقم الشارع، زي 25/56) — أول حاجة في أي نافذة أو جدول أو قائمة أو ملف إكسل، والمعرّف NSK بقى تحته تاني. والبحث شغال بالاتنين.',
      'الممرات اللي اتركّبت في ١٤٤٧ بقت بتتعرف باسمها المعروف من الموسم اللي فات (زي Path-Shaded-3R)، والممرات الجديدة بمعرّفها المقترح NSK لحد ما تتسمّى. وباقي النقاط زي ما هي.' ] },
  { v:'V34.4', d:'٧ أكتوبر ٢٠٢٦', notes:[
      'التشكيل اتشال من كل النصوص اللي بتظهر في السيستم بالعربي — الكلام بقى واضح من السياق.',
      'حلقة المسح ما بقتش بتقلب أحمر وأخضر: كل ما الصفحة تتحدّث كانت الحلقة بتبدأ حمرا لحظة وترجع خضرا. دلوقتي بتفضل ثابتة على نسبتها، والحركة بتحصل لما الرقم يتغيّر بس. والمتبقي (زي الـ١٢ نقطة) بقى باين أحمر في الحلقة حتى لو نسبته صغيرة.' ] },
  { v:'V34.3', d:'٧ أكتوبر ٢٠٢٦', notes:[
      '«اليوم» في موجز الموسم بقى فيه الأربعة: مسح وتركيب وتسليم وفك — بعدد اليوم نفسه.',
      'الحلقات الأربع (في الملخص وفي القاعة) بتبدأ حمرا كاملة، والأخضر بيزحف لحد نسبة اللي اتعمل. والفك بقى زي التلاتة: من كل النقاط، أحمر كامل لحد ما يبدأ. والحركة بتحصل لما الرقم يتغيّر بس، مش كل دقيقة في القاعة.' ] },
  { v:'V34.2', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'إصلاح عاجل تاني للآيفون: صندوق الجهاز الأسود في آيفون المدير سجّل ٦ مرات التطبيق اتقفل بعد ما يفتح على «الخريطة» أو «متابعة الوزارة» بلحظات — وهي اللحظة اللي بيبدأ فيها تنزيل خريطة المشاعر للعمل بلا شبكة (لحد ٣٠ ميجا) جنب صور القمر الصناعي، فذاكرة الصفحة على الآيفون بتخلص. التنزيل التلقائي ده اتقفل على الآيفون (زرار «نزّل» في «حسابي» موجود لمن يحتاجها)، وصور الخريطة بقت تاخد ذاكرة أقل، وخريطة القمر الصغيرة بتتشال لما تسيب صفحتها.' ] },
  { v:'V34.1', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'إصلاح عاجل للآيفون: رسالة «A problem repeatedly occurred» كانت بسبب حركة شاشة الدخول في ٣٣٫٩ — كانت بترسم ١٬٩٠٠ نقطة ٢٠ مرة في الثانية بكثافة شاشة الآيفون وفي نفس الوقت اللي التطبيق بيحمّل فيه بياناته، فالمتصفح كان بيقتل الصفحة. بقت الصورة تترسم مرة واحدة وفوقها وهج بيتحرك بكارت الشاشة (من غير ما يشغّل المعالج خالص)، وبعد أي فتحة اتقفلت فجأة الشاشة بتبقى ثابتة.' ] },
  { v:'V34.0', d:'٦ أكتوبر ٢٠٢٦', notes:[
      '«نبض الميدان» اتغيّر لـ«مسار العمل الميداني — آخر ١٤ يومًا» (الزيارات يومًا بيوم).',
      'أسماء التحديات اللي بتشوفها الوزارة: «المدخل غير واضح — لم يُستدل عليه» بقت «تحتاج زيارة تقنية»، و«أخرى» بقت «ملاحظات فنية متنوعة» — في موجز الموسم وشاشة القاعة والقوائم وجداول المسح والتقارير. والفريق في الميدان بيختار نفس الاختيارات زي ما هي.' ] },
  { v:'V33.9', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'شاشة الدخول رجعت تتحرك زي الأول: الخلفية بتضيء وتكتمل وترجع تاني طول ما الشاشة ظاهرة (وأثناء «يُستأنَف الدخول»)، وبتقف لوحدها بعد الدخول عشان ما تاكلش المعالج. والقاعدة اللي كانت بتثبّت الصورة على «الجهاز الضعيف» كانت بتطفّيها على الآيفون — اتشالت.' ] },
  { v:'V33.8', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'صفحة الوزارة بقت تفتح بـ«موجز الموسم»: شريط بهوية الوزارة فيه التاريخ الهجري والميلادي وما اتعمل النهارده وأقرب معلَم، وتحته الحلقات الأربع (المسح والتركيب والتسليم والفك) بتتضغط زي القاعة، و«نبض الميدان» (زيارات آخر ١٤ يوم ومقارنة بالأسبوع اللي فات وتوقع اكتمال أكبر مشعر)، و«أبرز التحديات».',
      'مراجعة التعليق والتحطّم: فتح كل الصفحات والشرائح الـ٢٩ ببيانات كاملة على جوال مبطّأ من غير أي خطأ ولا تحطّم، وأطول مهمة حاجبة أقل من ثانية على الجهاز المبطّأ (ربع ثانية على جوال عادي). وتقارير «توقف مفاجئ» في الميدان كلها من نسخ قديمة، وصفر منذ ٣٣٫٠.' ] },
  { v:'V33.7', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'صفحة متابعة الوزارة بقت تفتح أسرع بحوالي ٤ أضعاف: كانت بتحسب المعوقات والشركات والمؤشرات وقواعد التنبيه أكتر من مرة في نفس الفتحة، وبتبني قوائم كاملة عشان تعدّها بس.',
      'التصدير على الآيفون (وورد وباوربوينت وإكسل وPDF) ما بقاش بيطلّعك من التطبيق: الملف بيتسلّم بقائمة المشاركة (حفظ في الملفات، البريد، واتساب) وانت فاضل في مكانك. ولو الملف اتبنى متأخر يظهر زرار «احفظ الملف أو شاركه».' ] },
  { v:'V33.6', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تصحيح أرقام (مراجعة بعد غلطة القطار): في «تفاصيل المسح» بطاقة «بلا تحدٍّ — تُسنَد كما هي» كانت بتعدّ نقاط اتزارت ومحتاجة زيارة تانية، يعني كانت بتقول للمكتب يسندها للتركيب وهي مش جاهزة. بقت بنفس تعريف «بدون عوائق»، والنقاط دي راحت لبطاقة «فيها تحدٍّ أو تحتاج زيارة أخرى» وسببها مكتوب جنبها.' ] },
  { v:'V33.5', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'شاشة القاعة: فوق بقى ٤ حلقات بس — المسح، والتركيب، والتسليم، والفك. الأخضر اللي اتعمل والأحمر اللي فاضل. اضغط الحلقة تفتح قائمة اللي اتعمل، واضغط «متبقٍّ» تحتها تفتح قائمة اللي فاضل، وكلهم بتصدير إكسل.',
      'اتشال من القاعة: «تحتاج زيارة أخرى» و«اعتماد الوزارة» و«مخيمات بلا عائق» (اللي محتاجة زيارة تانية جوه «بعوائق» في البطاقات تحت).',
      'تصحيح أرقام: الزيارة بقرار المهندس (زي محطات القطار) ما بقتش تتحسب في تنبيه «ممسوحة بلا صور» — لأنها أصلًا من غير نموذج ولا صور.' ] },
  { v:'V33.4', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تصحيح: محطات القطار كانت بتظهر كلها «بعوائق» في شاشة القاعة، لأن زياراتها مسجّلة «بقرار المهندس» من غير نموذج. الزيارة دي بقت تتحسب «بدون عوائق» طالما مفيش فيها تحدي ولا محتاجة زيارة تانية — ونفس الكلام في «مخيمات بلا عائق» وبطاقتَي الملخص.' ] },
  { v:'V33.3', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'شاشة القاعة: «النقاط بعوائق وبدونها» بقت بطاقات فوق تحت الحلقات على طول — الإجمالي الأول وبعده بطاقة لكل نوع من المخيمات للزايدي. واضغط أي رقم (الأخضر أو الأحمر) تفتح قائمة نقاطه بالتفاصيل وتصدير إكسل.' ] },
  { v:'V33.2', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'المساعد 🧭 بقى يشرح المصطلحات: لو سألت عن «متعذر» أو «شاشة القاعة» أو «بعوائق» أو «الحفظ المحلي» يرد بالتعريف الأول وبعدين الصفحة وخطواتها. وفيه خطوات جديدة لملخص الوزارة وشاشة القاعة.',
      'دليل المستخدم اتكتب من جديد على الشاشات الحالية، وبيتولّد مع كل نسخة ومعاه المصطلحات و«ما الجديد». وأدلة الأدوار الـ١٤ كمان فيها المصطلحات وآخر التحديثات.' ] },
  { v:'V33.1', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'خطة القاعدة بالاستهلاك (قرار المالك): الجهاز اللي بيقرا أكتر من ١٥ ألف وثيقة في اليوم ما بقاش سحبه بيتبطّأ — كان بيستنى ضعف الوقت بين السحبات. العدّ والتنبيه زي ما هم.' ] },
  { v:'V33.0', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'الأمن: كلمات مرور الحسابات الجديدة ما بقتش تظهر في أي سجل تشغيل، وبتتمسح تلقائيًا من القاعدة بعد ٧٢ ساعة من الإنشاء (الحساب بيجبر صاحبه يغيّرها في أول دخول).',
      'الآيفون: لما مخزن المتصفح بيتقطع بعد الرجوع من الخلفية، التطبيق بيعيد فتحه فورًا — وده كان سبب أغلب الأخطاء المسجّلة والسحبات الكاملة المتكررة. وأعطال المتصفح بقت تتسجّل باسمها بدل «خطأ برمجي».',
      'أسرع: شاشة الدخول بتجهز أسرع (٥٫٥ → ٣٫٥ ثانية على جوال متوسط) لأن الخلفية بتتحرك مرة واحدة وتقف، وترتيب القوائم العربية بقى أسرع ١٠٠ مرة.',
      'في عرض الوزارة مفيش «متعذّر» ولا «تصريح»: اللي اتزار وما اتوصلّوش بيظهر «تمت الزيارة» وتحديه «تحتاج زيارة أخرى». وبطاقة «ما ينتظر الوزارة» اتشالت من الملخص.',
      'شاشة القاعة: قسم جديد «النقاط بعوائق وبدونها» — الإجمالي الأول (أخضر بدون عوائق، أحمر بعوائق) وتحته كل نوع من المخيمات للزايدي. وبطاقتا الملخص «نقاط بلا عوائق» و«نقاط بعوائق» بنفس الأرقام.',
      'للفريق المستلم: صفحة «ابدأ من هنا»، وأدلة تشغيل لكل السيور ومقابلها على سيرفراتكم، وأداة رفع النسخة بأمر واحد، ومعالجات النقرات مقسّمة لأجزاء مفهومة، و٤ اختبارات وحدة جديدة.' ] },
  { v:'V32.9', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'شاشة الدخول أسرع وأخف على الجوال: الخلفية المتحركة كانت بترسم كل النقاط في كل لحظة من غير ما تقف (حوالي ثانية ونص معالجة على جوال متوسط قبل ما الشاشة تجهز وأثناء الكتابة). بقت تتحرك مرة واحدة وتقف على الصورة الكاملة، وتبدأ بعد ما النموذج يظهر، وعلى الجوالات الضعيفة بتظهر ثابتة.' ] },
  { v:'V32.8', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'مفهوم «تمت الزيارة» بقى على كل الصفحات بطلب المالك: جدول الشركات، وبطاقات المشاعر، والملفات المصدّرة، والملخص اليومي ومنحنياته، ومسار الأسابيع، وملخص الوزارة المكتوب، وخطوات النقطة في نافذتها («تمت الزيارة — تنتظر الاعتماد التقني»)، وتنبيه التوأم، وعدّ زيارات الفني في يومه، والمتأخر من المهام.',
      'والكلام اللي بيخص اللي لسه محتاج زيارة بقى واضح: «الأقرب إليّ — تحتاج زيارة» و«المتاح: ما يحتاج زيارة ولم يُسند بعد».' ] },
  { v:'V32.7', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'المصطلح بقى واحد وواضح في كل مكان بطلب المالك: الرقم اسمه «تمت الزيارة» (بدل «تم المسح» و«مُسح» و«زيرت») في الملخص، وشاشة المسح، وشاشة القاعة، ومتابعة الوزارة، والجداول، وملفات إكسل والباوربوينت والبي دي إف. وتقسيمه جوه شاشة المسح بمصطلح نموذج الزيارة نفسه: «تم الوصول»، و«متعذّر»، و«تحتاج زيارة أخرى».' ] },
  { v:'V32.6', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'قرار المالك: «زيرت» بقت تعني أي نقطة اتعملها زيارة ميدانية بأي نتيجة (وصلنا، أو متعذر، أو محتاجة تصريح، أو محتاجة زيارة تانية). يعني كاميرات المتابعة ٨٨ من ٨٨ مش ٧٨. والمتبقي بقى اللي ما اتزارش خالص بس.',
      'الرقم ده واحد في كل الشاشات: الملخص، وشاشة القاعة، والخريطة، ومتابعة الوزارة، وسلسلة المراحل، والخطة، والملف اليومي للوزارة، والتقارير. وفي شاشة المسح التقسيم ظاهر جوه «زيرت»: وُصل إليها، ومتعذر، ومحتاجة زيارة تانية. والجاهزية للتركيب والاعتماد زي ما هي.' ] },
  { v:'V32.5', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'ملخص متابعة الوزارة اتعاد ترتيبه بطلب المالك: البطاقات أولا من «نسبة المسح»، وكل بطاقة بتتضغط فتفتح قائمتها بتفاصيلها وتصدير إكسل (النقاط، والمخيمات والممرات وحالة تركيبها، والمعوقات، والشركات، والتحديات المفتوحة، والطلبات، ومهام الأسبوع).',
      'بطاقتين جداد لكل الأنواع: «نقاط بلا عوائق ولا تحديات» و«نقاط ذات تحديات». وبطاقة «بانتظار قرار الوزارة» اتشالت. والملخص التنفيذي وما ينتظر الوزارة والتنبيهات والمعالم والخطة نزلوا تحت الصفحة.' ] },
  { v:'V32.4', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'مراجعة جودة شاملة على كل مراحل الخطة: ألوان النقاط المسندة «لبكرة» بقت تتحدث لوحدها بعد نص الليل حتى لو مفيش بيانات جديدة (كانت هتفضل بلون «بكرة» لحد أي تحديث).',
      'وجرد ختم الهوية على كل كتابة كان بيسقط في الجرد الكامل بس من بعد بوابة البيانات — اتصلح ودخل الطبقة السريعة، وجرد زمني كان بيسقط تحت الحمل بقى ثابت.' ] },
  { v:'V32.3', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: شاشة المستخدمين وجولة البداية والأدلة بقت ماسكة حالتها في كائنات خاصة بيها (المتغيرات العامة ٦٠٥ ← ٥٩٨).' ] },
  { v:'V32.2', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'إصلاح مهم: تحريك النقطة على الخريطة ما كانش بيتحفظ — كان بيظهر على الجهاز اللي حرّك بس، ويرجع مكانه بعد فتح التطبيق تاني وعلى أي جهاز تاني. بقى بيتحفظ لكل الأجهزة، والنقاط اللي اتحركت قبل كده (١١١ نقطة) هتظهر في أماكنها الجديدة على كل الأجهزة.',
      'وكمان تعديل الإحداثيات من «تعديل البيانات» للنقاط الجديدة (زي كاميرات الزايدي) كان بيترجع للإحداثية الأصلية مع كل مزامنة — اتصلح.',
      'والتحريك بقى ما بيعملش «زيارة» للنقطة: قبل كده تحريك نقطة ما اتزارتش كان بيحسبها ممسوحة.' ] },
  { v:'V32.1', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: وحدة المزامنة بقت ماسكة حالتها في كائن واحد (المتغيرات العامة ٦٠٩ ← ٦٠٥)، واتسجّل أول قرار في «سجل القرارات» للفريق اللي هيستلم: ليه الحفظ المحلي فضل زي ما هو في الموسم ده.' ] },
  { v:'V32.0', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: وحدة متابعة الوزارة والتقارير والتصدير بقت ماسكة حالتها في كائنين بدل ١٦ متغير متفرقين في الكود (المتغيرات العامة ٦٢٤ ← ٦٠٩).' ] },
  { v:'V31.9', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'بطارية أقل وجوال أهدى على الخريطة: كل دقيقة كان التطبيق بيعيد رسم الخريطة كاملة ويعيد حساب كل الأرقام حتى لو مفيش أي جديد اتسحب (حوالي نص ثانية معالجة كل دقيقة على الجوال). بقى يعمل كده بس لما يوصل جديد أو تتسحب الثوابت.' ] },
  { v:'V31.8', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'الخريطة أسرع في أول فتح على الجوال: أول ٤٠٠ نقطة بتظهر فورا والباقي بيكمل في اللحظات اللي بعدها، بدل ما الشاشة تتجمد لحد ما ١٨٠٠ نقطة تترسم مرة واحدة (أول رسمة نزلت من ١٫٣ ثانية لـ٠٫٧ على جوال متوسط).',
      'ومراجعة الجودة لقت ثغرة في تحسين ٣١٫٦ واتسدّت: ذاكرة الحساب بقت تعيش جوه رسم الصفحة بس.',
      'وأول دخول لمستخدم جديد أسرع: جولة البداية كانت بتعيد تمرير القائمة مع كل رسمة (ثانية ونص على الجوال) — بقت مرة واحدة وبعد ما الشاشة تظهر.' ] },
  { v:'V31.7', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'مراجعة جودة على شغل الليلة (بلا تغيير في الاستخدام): الجرد الكامل الليلي كان مش هيشتغل أبدا بسبب شرط فرع غلط — اتصلح، وبقى لو سقط حاجة بالليل يوصل بريد بيها. واتفحص الكود كله آليا لأي متغير محلي بيطمس دالة من دوال التطبيق أو مكتبة الخرائط (زي خطأ خط البي دي إف) — مفيش ولا حالة فعلية.' ] },
  { v:'V31.6', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'أسرع من غير أي تغيير في الاستخدام: حالة كل نقطة وقوائم المتابعة بقت بتتحسب مرة واحدة في كل رسمة بدل مرات كتير. رسم الخريطة نزل من ١٤٤ لـ٣٧ جزء من الألف من الثانية، وملخص الوزارة من ٥٣ لـ٣٥ (على كمبيوتر — على الجوال الفرق أكبر).' ] },
  { v:'V31.5', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: كل اتصال بقاعدة البيانات بقى بيعدي من بوابة واحدة في الكود، عشان أي نقل للمنظومة على سيرفرات تانية يتعمل في مكان واحد. واتشالت متغيرات قديمة مش مستعملة.' ] },
  { v:'V31.4', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'إصلاح: بي دي إف تقرير الوزارة ما كانش بيضمّن خط «أبار» المرفوع أبدًا (متغير داخلي كان بيمسح بيانات الخط قبل استعمالها) — بقى بيضمّنه أول ما الخط يترفع.',
      'تحسين داخلي بلا تغيير في الاستخدام: تنظيف الكود — تحذيرات الفاحص من ٣٨ إلى صفر (إعادة إعلانات مكررة وكود ميت بعد الإرجاع).' ] },
  { v:'V31.3', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: جرد «صحة الكود» في البوابة بيمنع أي تحديث يزوّد المتغيرات العامة أو الدوال الطويلة أو تحذيرات النحو أو حجم ملفات المصدر عن آخر خط أساس، ووثيقة «تعريف المنجز» لكل تحديث.' ] },
  { v:'V31.2', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: بوابة النشر بقت طبقتين — سريعة على كل دفعة (دقائق بدل ربع ساعة) تفحص البناء والنحو واختبارات الوحدة الجديدة والجرود الحاسمة ولجنة الفحص والمتصفح الحقيقي والمحاكي، والجرد الكامل (١٤٨ خطوة) بيشتغل كل ليلة وعند الطلب.' ] },
  { v:'V31.1', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'تحسين داخلي بلا تغيير في الاستخدام: فاحص نحو في بوابة النشر، والكود كله بالوضع الصارم (ما بيسمحش بمتغيرات ضمنية ولا أخطاء صامتة).',
      'وبالمناسبة اتصلحت ٣ أخطاء كامنة كشفها الفاحص: خطأ عند عزل وثيقة متعثرة عن الرفع، وخطأ عند اعتماد طلب تصويب، وعداد الصور الفاشلة ما كانش بيوصل في إشارات الأجهزة.' ] },
  { v:'V31.0', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'بنية الكود: الملف الواحد بقى عشرة ملفات مصدر بتتجمع في ملف النشر بالظبط زي ما كان (مفيش أي تغيير في التطبيق نفسه ولا في طريقة تحميله). ده أول خطوة عشان الصيانة تبقى أسهل وأأمن.' ] },
  { v:'V30.9', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'أول فتح أسرع: الخريطة كانت بتترسم ٢٣ مرة في أول ثانيتين (كل رسم صفحة بيرسمها مرتين، والحركة والتكبير وتصحيح القياس كل واحد بيرسمها) — بقى اللي بييجي خلال ٨٠ ملي ثانية يتجمع في رسمة واحدة، ورسم الصفحة من غير ما تتغير النقاط أو الفلاتر بقى رسمة خفيفة.' ] },
  { v:'V30.8', d:'٦ أكتوبر ٢٠٢٦', notes:[
      'سجل التدقيق: البحث بقى يدور في نص الحدث ورقم النقطة واسم اللي عمله، ومن غير ما يفرق في الهمزة والتاء المربوطة والتشكيل وحالة الحروف.',
      'زر «سجل النقطة» في نافذة أي نقطة (لمن يرى السجل): بيفتح السجل مصفّى على النقطة ويجيب تاريخها كله من القاعدة، مش بس آخر ٥٠٠ حدث.' ] },
  { v:'V30.7', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'إنشاء الحسابات: لما يرفض مفتاح التشغيل (منتهي أو بلا صلاحية) الرسالة بقت تقول الحقيقة — الطلب محفوظ وهيتنفذ مع دورة الخادم، والمفتاح محتاج تجديد من ثوابت النظام — ولافتة للمدير في صفحة الحسابات.',
      'والحسابات المطلوبة بقت تتنفذ كمان مع كل نشر، لأن الترقية للأصل وجدولة الخادم ما كانوش بيشغلوها فكانت بتتأخر ساعات.',
      'وزر «أنشئه من هذا الجهاز الآن» بجوار أي حساب «يُنشَأ» (للمهندس والمدير): بينشئ الحساب فورا من غير ما يستنى الخادم، ويعلم الطلب «تم» ويمسح كلمته من القاعدة.' ] },
  { v:'V30.6', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'فحص الصور تلقائيا على الجهاز لحظة الالتقاط: لو الصورة مظلمة أو محترقة أو مهزوزة يطلع تنبيه «أعد الالتقاط لو أمكن» من غير منع، ولو بتكرر صورة سابقة لنفس النقطة يطلع تنبيه. وفي متابعة الوزارة ← المسح الميداني بطاقة «صور تحتاج إعادة» بقائمتها وتصديرها.',
      'إصلاحان من لقطة المالك: عناوين بطاقات الملخص التنفيذي وتنبيهات القواعد والخطة كانت بتظهر فيها وسوم نصا، ونافذة القوائم كانت بيضا على الوضع الداكن فالنص اختفى — بقت بألوان التطبيق.' ] },
  { v:'V30.5', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'شاشة القاعة بقت حية: قسم «مباشر» فيه آخر ٨ حاجات حصلت في الميدان (مين زار إيه ومن إمتى)، ووقت آخر تحديث للبيانات، والتنبيهات اللي عليها قواعد. وفي وضع العرض الكامل البيانات بتتسحب كل دقيقتين بدل كل عشرة.' ] },
  { v:'V30.4', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'ملف بيانات يومي للوزارة بيتولد لوحده كل يوم ٥:٣٠ الصبح على الدرايف في مجلد «البيانات اليومية»: إكسل بكل أوراق التقرير (١٧ ورقة)، وملف أرقام (جيسون) لأي نظام عندهم، وملف مواقع جغرافي (جيوجيسون) لخرائطهم، والملخص التنفيذي. كله من دوال التطبيق نفسها وبفحص الملف قبل ما يخرج.' ] },
  { v:'V30.3', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'القوائم بقت تتعدل من ثوابت النظام بدل الكود: تحديات المخيمات، وتحديات الممرات وباقي النقاط، وأسباب إضافة مخيم أو نقطة غير مسجلة. كل سطر بند، والفاضي يرجع القائمة الأصلية، وبتوصل كل الأجهزة مع المزامنة.' ] },
  { v:'V30.2', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'الخطة مقابل الفعلي: الخطة التفصيلية (الإصدار ٢٫١، ١٨٥ بند) بقت في «متابعة الخطة التفصيلية»، والإنجاز المخطط بيتحسب من التواريخ، والفعلي لبنود المسح والتركيب بيتقاس من النظام لوحده (علامة ⚙)، والانحراف قدام كل بند.',
      'بطاقة «الخطة مقابل الفعلي» في ملخص الوزارة: المخطط والفعلي والانحراف للمشروع كله وأكتر البنود تأخرا، وبتدخل الملخص التنفيذي. واستيراد الإكسل بقى يقرا الإصدار ٢ بأسماء الأعمدة.' ] },
  { v:'V30.1', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'تنبيهات بقواعد تتظبط من ثوابت النظام (بالأيام): معوق مفتوح أكثر من ١٤ يوم، تصريح دخول معلق أكثر من ٧، أعيدت للزيارة وما اتزارتش أكثر من ٣، ممسوحة بلا صور أكثر من ٢، مسندة وما اتزارتش أكثر من ٣، تعذر الوصول بلا محاولة أكثر من ٢١. الصفر يعطل القاعدة.',
      'بطاقة «تنبيهات القواعد» في متابعة الوزارة ← الملخص: كل تنبيه بعدده، ويفتح قائمته بالمشعر والنوع ويتصدر إكسل، ويدخل الملخص التنفيذي.' ] },
  { v:'V30.0', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'التحديث الأسبوعي بقى يتبعت لوحده كل يوم أحد ٧:٣٠ الصبح قبل اجتماع الوزارة: باوربوينت بالقالب الموحد وبي دي إف من التطبيق نفسه، على البريد ومجلد «التقارير الأسبوعية» في الدرايف، والملخص التنفيذي في نص الرسالة. ويتفحص الملف قبل ما يخرج.',
      'شاشة القاعة ونظرة عامة والقمر الصناعي بقوا بتصنيف المالك: منى، عرفات، المزدلفة، مراكز التفويج (فيها النورية والزايدي والهجرة)، وكاميرات المتابعة — بدل المشاعر الخام. و«المتابعة» اسمها بقى «كاميرات المتابعة» في الخريطة ومتابعة الوزارة.',
      'بطاقة «مخيمات بلا عائق» بالأخضر في شاشة القاعة وفي ملخص الوزارة (تفتح قائمتها وتتصدر).' ] },
  { v:'V29.9', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'متابعة الوزارة ← الملخص: ملخص تنفيذي بيتكتب من الأرقام لوحده كل مرة (ينسخ بضغطة وبيدخل أول الوورد والإكسل والبي دي إف).',
      'بطاقة «ما ينتظر الوزارة»: تصاريح الدخول، ومنع الدخول، والمواقع غير الموجودة ميدانيا، والمخيمات بلا تخصيص، واعتماد الإعداد — كل بطاقة تفتح قائمتها وتتصدر إكسل.',
      'المعالم القادمة بمواعيدها وكام يوم فاضل، وعنوان «المسح الميداني» بقى يتبع فلتر المشعر والنوع، وصفحة المعوقات بتعرض عمر المعوق (المتوسط والأقدم واللي عدى أسبوعين).' ] },
  { v:'V29.8', d:'٥ أكتوبر ٢٠٢٦', notes:[
      'الخريطة بتقرّب لوحدها لنقاط المشعر أو النوع اللي بتختاره من الفلاتر لو مفيش منها حاجة ظاهرة — زي مراكز التفويج البعيدة عن المشاعر (النورية والزايدي والجموم والمدينة).',
      'مراكز التفويج: ٢٤ كاميرا قراءة لوحات للزايدي وطريق الهجرة (الجموم والمدينة) بمواضع مسودة من صور القمر الصناعي — يؤكدها المالك من المنصة.' ] },
  { v:'V29.7', d:'٤ أكتوبر ٢٠٢٦', notes:[
      'نموذج «موقع جديد»: رقم المربع والشاخص والشركة للمخيمات فقط وبعلامة الإلزام، وباقي النقاط باسمها ومشعرها ونوعها. والسبب والتحديات وأول صورتين إلزامية للكل. والحقول بتتغير على طول لما تختار النوع.',
      'مراكز التفويج: بقى فيه اختيار «المركز» (النورية، طريق الهجرة، الزايدي) والمشعر بيتظبط لوحده.',
      'نقطتا التفويج المؤقتتان (الزايدي وطريق الهجرة) اتخفوا ثم رجعوا ظاهرين بقرار المالك: لا إخفاء، والحذف من النظام بيده.' ] },
  { v:'V29.6', d:'٤ أكتوبر ٢٠٢٦', notes:[
      'متابعة الوزارة ← المسح الميداني: كل بطاقة عليها «›» تُضغط فتفتح نافذة بقائمة نقاطها (النقطة، الاسم، المشعر، النوع، الشركة، آخر زيارة، بواسطة) وزر «تصدير إكسل».',
      'بطاقتان جديدتان: «مخيمات بلا تحديات»، و«زيارات بلا صور» بسبب غياب الصور (لم تُلتقط، أو التُقطت ولم تُرفع من الجهاز) — لتوجيه الشباب لإضافة الصور.',
      'الصور في الدرايف: راجعت الـ٣٣٦٠ صورة المرفوعة — كلها موجودة ومشاركة وفي مجلد نقطتها. صورتان عالقتان بخطأ من جوجل بقت بتتعاد تلقائيا، وصور النقطة المدموجة بتتنقل لمجلد النقطة الصحيحة.' ] },
  { v:'V29.5', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'المشتريات (قرار المالك: الحذف للمهندس والمدير): زر تعديل يملأ النموذج ويحفظ على نفس العملية، وزر حذف بتأكيد — والعملية المعتمدة لا تُحذف إلا بسبب مكتوب يدخل سجل الأحداث.',
      'سجل الصيانة: حذف القيد للمهندس والمدير بتأكيد، ويبقى أثره في سجل الأحداث. والسيارات والشحنات والكتالوج والوظائف كان لها التعديل والحذف من قبل.' ] },
  { v:'V29.4', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'مساعد الميدان في «شغلي ← مهامي» للفني والمشرف: الأقرب إليّ (أقرب خمس نقاط لم تُمسح من موقعك، مع الخريطة والاتجاهات)، وملخص يومي جاهز للنسخ أو الواتساب، وتجهيز اليوم بلا نت (خريطة الجهاز والمزامنة وما ينتظر الرفع).',
      'وفي نموذج المسح زر «انسخ من آخر زيارتي»: التثبيت والكهرباء والمقاسات من آخر زيارة سجلتها لنفس النوع، والصور والتحديات تؤخذ من الموقع.' ] },
  { v:'V29.3', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'حماية في قاعدة البيانات: علامة الحذف على زيارة مسح أو تركيب لا يكتبها إلا من يملك صلاحية الحذف — فالأجهزة اللي لسه على نسخ قديمة (فيها زر يمحو المسح بضغطة) ما تقدرش تخفي زيارة، أيا كانت نسختها.' ] },
  { v:'V29.2', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'تأكيد نقاط منشأة الجمرات بالمسح الميداني (ملاحظة «تحديثات المنصة»): بالأدوار — كم نقطة، وكم أُكد بالمسح، وكم تعذر، وكم لم يُزر، وكم فيه تحديات — في شريحة جديدة بالعرض وقسم في الوورد والإكسل والبي دي إف.',
      'عنوان «المسح الميداني» في متابعة الوزارة: النظرة العامة وحسب المشعر والمشعر والنوع وتأكيد الجمرات حيًّا على الشاشة.',
      'مواعيد التحديث: التحديثات العادية تصل الأجهزة مرة في اليوم الساعة ٤ الفجر، والطارئ وحده فورًا.' ] },
  { v:'V29.1', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'المسح الميداني في التقرير: شريحتان جديدتان في الباوربوينت — نظرة عامة بالأرقام والنسب (نسبة المسح، تم، المتبقي، فيها تحديات، تعذر الوصول) وجدول حسب المشعر، ثم تفاصيل المشعر والنوع: اتعمل كام، لسه كام، كام فيها تحديات، وأبرز تحدٍّ. وفي الوورد والإكسل والبي دي إف قسمان بنفس الأرقام.',
      'حالة الشركات بقت حسب المرحلة: في المسح الميداني تظهر نسبة مسح مخيمات كل شركة والمتبقي والتحديات، و«مرحلة المسح — لم يبدأ التواصل والتركيب» بدل تصنيف ممتاز ومتوسط وضعيف اللي كان محسوبا على التركيب.' ] },
  { v:'V29.0', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'اختيار النقاط في التصدير: فوق أزرار التصدير «نطاق الملف» — كل النقاط، أو مشعر ونوع، أو المحدد على الخريطة — والملف يُبنى على نقاط النطاق وحدها ويُكتب النطاق في الغلاف واسم الملف.',
      'بريد الشركات: عمود «بريدها» في إشعار الشركات (يحفظه المهندس في دفتر الجوالات المحجوب)، وزر «بريد رسمي» يفتح بريد الجهاز برسالة رسمية جاهزة (تركيب أو تسليم أو فك) فيها الأرقام وضابط الاتصال.' ] },
  { v:'V28.9', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'فحص الملف قبل نزوله (قرار المالك): كل تصدير (باوربوينت ووورد وإكسل وبي دي إف) يفحص الأرقام والحروف قبل التنزيل — لا «NaN» ولا خانات ناقصة ولا نسب خارج المدى، والمستهدف = المنجز + المتبقي + المتعثر، والشرائح سليمة البناء وداخل حدودها. أي خطأ يوقف التنزيل ويظهر فوق أزرار التصدير.',
      'خط الوزارة «Abar Mid» في التقارير: الباوربوينت مضمن فيه الخط من قالب الوزارة نفسه، والبي دي إف يضمنه بعد ما يرفع المدير ملفي العادي والعريض مرة من «ثوابت النظام ← خطوط التقارير».' ] },
  { v:'V28.8', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'القالب الموحد لوزارة الحج والعمرة في كل تقارير الباوربوينت والبي دي إف: غلاف بشعار الوزارة وألوانها، وشرائح محتوى بعناوين ذهبية، وختام «شكرا»، وبخط الوزارة المعتمد «Abar Mid» بدل الخط القديم (ملاحظة «تحديثات المنصة»).',
      'وشريحة شركات الخدمة في العرض بأعمدتها الجديدة (ضابط الاتصال والمنجز والمتبقي والمتعثر) وأرقامها صحيحة.' ] },
  { v:'V28.7', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'قرار المالك: اسمها «زيارة». المشرف والفني يسجلون الزيارة من «نموذج المسح» بصورها (ملزم)، والمهندس وحده يقدر يضغط «تمت الزيارة» من نافذة النقطة متجاوزا النموذج.',
      'رسم مبدئي لحدود ٧٥ مخيما في عرفات كانت مرسومة بعيدا عن علامتها: نقل كل حد لمكان مخيمه وقص ما يتداخل مع جيرانه، فصارت المخيمات جنب بعض من غير مسافات بعيدة. وأربعة مخيمات علامتها داخل حدود جيرانها تبقى علامة لحد المراجعة في الميدان.',
      'ومخيمات خالد (٠٧١١ و٠٧١٢) نتيجتها صارت «تم الوصول» بتحدياتها.' ] },
  { v:'V28.6', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'صلاحيات المشرف أوسع (قرار المالك): يسجل زيارة سريعة أو نموذج مسح على أي نقطة من غير إسناد مسبق، ويعدل بيانات النقطة الأساسية (الاسم والمربع والشاخص ووجه العمل والشركة والإحداثيات)، ويرد زيارة فريقه للتصحيح بسبب مكتوب. والاعتماد والتصنيف (المشعر والنوع) يبقيان للمهندس.',
      'بلاغ المشرف «المخيم على الخريطة إذا قربت يختفي»: حدود ٧٩ مخيما كانت مرسومة بعيدا عن علامتها، فصارت العلامة تظهر في كل تكبير لحد ما تتعدل الحدود. ودمجت النقاط الثلاث التي أضافها المشرف في عرفات اليوم في مخيمات السجل نفسها (٠٧١١ و٠٧١٢ و٠٧١٣) بزيارته وصوره.' ] },
  { v:'V28.5', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'من ملاحظات «تحديثات المنصة»: «كاميرات الوزارة» صارت «كاميرات المتابعة» تحت مشعر «المتابعة»، وكاميرات منشأة الجمرات نوعها «منشأة الجمرات» لا «كاميرات المتابعة»، و«كاميرات الوزارة — LPR» صارت «مراكز التفويج». والأوزان والتعديلات المحفوظة بالأسماء القديمة تقرأ بالجديدة.',
      '«التفاصيل المختصرة» تغلق بضغطة ثانية عليها وترجع الطبقة اللي كانت قبلها.',
      'الشركات: عمود «ضابط الاتصال» يحفظه المهندس فيراه الكل (والوزارة في متابعتها)، وأعمدة المنجز والمتبقي والمتعثر في إشعار الشركات وفي تقرير متابعة الوزارة.' ] },
  { v:'V28.4', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'قرار المالك: لا حذف لأي زيارة أو تركيب الآن. زر الزيارة في نافذة النقطة يسجل زيارة سريعة فقط، والتصحيح من «تعديل المسح». واستعيدت آخر ثلاث نقاط كانت مخفية، فلم يبق أي سجل مخفي.',
      'وإصلاح: اعتماد الوزارة للمسح كان سيرفض بعد التحديث السابق بسبب حقل إضافي، فصار يُكتب بحقوله وحدها.' ] },
  { v:'V28.3', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'إصلاح عاجل: مسوح كانت تختفي رغم تسجيلها. الحذف يترك علامة على السجل، والمسح التالي كان يُكتب فوقها فتبقى العلامة فيمحوه كل جهاز. صار كل حفظ يمحو العلامة، واستُعيدت المسوح التي اختفت بهذا السبب.',
      'وزر «تمت الزيارة» في نافذة النقطة كان يحذف المسح كله بضغطة لو للنقطة زيارة. صار: المسح الكامل لا يحذف من هنا أبدا، والزيارة السريعة وحدها تلغى وبتأكيد، والزر يقول ما يفعل. وكذلك حالة التركيب بقطع وسيريالات لا تحذف بضغطة.' ] },
  { v:'V28.2', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'سجلات الإدارة: الدروس المستفادة والمراجعات الدورية وأصحاب المصلحة صار لكل صف فيها زر تعديل يملأ النموذج بقيمه، و«احفظ التعديل» يكتب على السجل نفسه، و«إلغاء التعديل» يرجع النموذج فاضيا.' ] },
  { v:'V28.1', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'رسم المسارات: النقطة تلتصق بأقرب نقطة على الشارع نفسه (لا بطرفه البعيد)، بمسافة تتبع التكبير، ونقطتان على شارع واحد توصلان مباشرة. وشبكة الشوارع صارت منى ومزدلفة وعرفات.',
      'زر «رسم حر» للساحات وما لا شارع فيه: النقطة حيث تضغط وتوصل بخط مستقيم (بنفسجية). وتنبيه لو الطريق على الشوارع أطول كثيرا من المستقيم. وزر التكبير ما عاد يظهر من خلف أزرار الخريطة.' ] },
  { v:'V28.0', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'صفحة جديدة في الميدان للمهندس فما فوق: «رسم المسارات من وإلى الجمرات». اختر الدور والاتجاه ثم اضغط على الخريطة نقطة بعد نقطة؛ كل نقطة تلتصق بأقرب شارع وتوصل بما قبلها على شوارع منى وممراتها وحدها، لا فوق خيمة ولا بيت. «احفظ المسار» يعرضه على الأجهزة كلها بدل المولد، ويحذف من الصفحة نفسها.',
      'الدور الأرضي: الخط على الشوارع وحدها (كل رأس التصق بأقرب شارع ووصل على الشبكة)، ومتصل بمداخل الدور ومخارجه عبر الساحة.',
      'رسالة «ما الجديد» بعد التحديث صارت للمهندس فما فوق فقط، لا للوزارة ولا للميدان.' ] },
  { v:'V27.9', d:'٣ أكتوبر ٢٠٢٦', notes:[
      'الدور الأرضي: خط الذهاب صار خط مخطط الوزارة نفسه (الأصفر، ومعه ما لاصقه من الأحمر مبدئيا بقرار المالك) مطابقا على شوارع منى، بدل الطريق المحسوب لكل مخيم. والعودة ما بقي من الأحمر.',
      'إسناد المخيمات للأدوار أعيد من صفحات الملف بنسبة تداخل مساحة المخيم مع لون الدور: الأرضي ٧٩، الأول ٢٣١، الثاني ١٢، الثالث ٢٠٨، الرابع ١٠٠ (٦٣٠ مخيما بدل ٤١٠). وكلمتا «مخيما» و«نقطة» جانب الأرقام.' ] },
  { v:'V27.8', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'مسار التفويج: لما تختار الدور تظهر مخيماته مظللة بحدودها بلون الدور على الخريطة (ومع كل الأدوار كل مخيم بلون دوره)، وعددها في بطاقة الدور.',
      'الأسماء فوق القمر الصناعي بمستويين: الإقليم (مكة وجدة والطائف: المدن والقرى والمطارات والجبال والطرق الرئيسية بأرقامها كدروع) للتكبير البعيد، والمشاعر بكل شوارعها عند الاقتراب. ملف الإقليم ينزل مع التحديث القادم.' ] },
  { v:'V27.7', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'قرار المالك: الخريطة المفتوحة (بلا مفاتيح ولا فلوس). وصل ملف الأسماء الكامل للمشاعر: ٩٦٨ طريقا باسمه و٦٨ مكانا ومعلما (أحياء وجبال ومساجد ومستشفيات ومحطات) بالعربية، فصارت أسماء الشوارع والأماكن تظهر فوق القمر الصناعي بكثافة خريطة الشوارع بحسب التكبير.' ] },
  { v:'V27.6', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'خرائط جوجل داخل التطبيق: المدير يضع مفتاح منصة خرائط جوجل في «ثوابت النظام» فتعرض خرائط جوجل (شوارع، أو قمر هجين بأسمائه) تحت النقاط والحدود والمسارات على كل الأجهزة على اتصال، وبلا شبكة خريطة الجهاز كما هي، ولو فشل المفتاح تعود الخريطة المفتوحة تلقائيا.',
      'والخريطة المفتوحة: أسماء الشوارع والأماكن فوق القمر الصناعي صارت ترسم من ملف أسماء كامل للمشاعر (كل طريق له اسم، والأحياء والجبال والمعالم) بحسب التكبير وبميل الشارع — ينزل الملف مع التحديث القادم.' ] },
  { v:'V27.5', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'الخريطة الهجينة: أسماء الشوارع والأماكن بالعربية فوق القمر الصناعي (من خريطة الجهاز)، وتختفي مع خريطة الشوارع التي لها أسماؤها.',
      'مسار التفويج: صف «الاتجاه» بعد اختيار الدور: الذهاب والعودة معا، أو الذهاب فقط، أو العودة فقط. والعودة متقطعة دائما لأن الجوهرة وسوق العرب يحملان الاتجاهين معا.' ] },
  { v:'V27.4', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'في «تفاصيل الموقع» صار لكل صف في بطاقة بيانات الموقع زر «تعديل»: المشعر والتصنيف والمنطقة والإحداثيات والدور، لا الاسم ووجه العمل فقط، ويفتح النموذج على الحقل نفسه. وأضيف حقل «المنطقة» للنموذج.' ] },
  { v:'V27.3', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'التحديث الأسبوعي (إكسل ووورد وبوربوينت وPDF) من صفحة التحديات والمعوقات صار يتبع الفلتر: لو فلترت منى ← مخيمات يطلع المعوقات دي بس، والفلتر مكتوب في سطر التاريخ وفي اسم الملف وفي الشريط، ولو ما فيش فلتر يطلع الكل.' ] },
  { v:'V27.2', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'تصنيف جديد على الخريطة والتصفية وصفحة التحديات والتصدير: المشعر خمسة (منى، عرفات، المزدلفة، محطات التفويج، كاميرات الرصد) والنوع تسعة (مخيمات، ممرات، محطات قطار، كاميرات رصد، منشأة الجمرات، مسجد نمرة، النورية، محطات طريق الهجرة، الزايدي). محطات التفويج تضم النورية وطريق الهجرة والزايدي، وكاميرات الرصد تضم كاميرات منى ومنشأة الجمرات، وكاميرات عرفات تحت عرفات.',
      'وكل نقطة يعدل مشعرها ونوعها يدويا من «تعديل البيانات» فتنتقل فورا على كل الأجهزة، والأصل محفوظ.' ] },
  { v:'V27.1', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'صار المشعر يعدل من «تعديل بيانات النقطة» مع الاسم والتصنيف والشاخص والمربع والشركة والإحداثيات والدور والبوابة، فكل شيء في النقطة يعدل: بياناتها هنا، ومكانها بالتحريك على الخريطة، وحدود المخيم بسحب زواياه.',
      'أربع صفحات كانت تعطي النتيجة نفسها لنفس الجهة صارت واحدة: «حالة أبرز المهام» قسم في «المهام الأسبوعية» بمتابعة الوزارة، و«المعدل اليومي» قسم في «أمس · الآن · غدا»، و«مركز التقارير» شريحة في «التصدير والتقارير»، و«سجل الدروس السريع» قسم في «الدروس والمراجعات». لا بيانات ضاعت.' ] },
  { v:'V27.0', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'الميدان والمكتب على التحدي نفسه: المكتب والوزارة يكلفون (الجهة والآلية ووصف المعالجة وآخر تاريخ ومهمة المعالجة) فيظهر التكليف للميدان تحت كل تحد في صفحته، والميدان يكتب «تحديث» بما حدث (جربنا كذا، كلمنا كدانة، حلت ٣ مخيمات) فيراه المكتب والوزارة فورا باسمه وتاريخه، والمكتب يرد بتعليمات في القناة نفسها. والأرقام تنقص وحدها عند التركيب.' ] },
  { v:'V26.9', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'للميدان: «إفادات الميدان» و«متابعة التحديات» صارتا صفحة واحدة «التحديات والمعوقات» في متابعة العمل الميداني، بفلتر المشعر والنوع وبأرقام متابعة الوزارة نفسها.',
      'اضغط أي تحد تنفتح نافذة بنقاطه: اسم المخيم وشاخصه أو اسم الممر، ومشعره ونوعه، ووصف العائق، وزر «على الخريطة» لكل نقطة، و«كل النقاط» معا.',
      'والعودة من الخريطة إلى أي صفحة ما عادت تبتلع أول ضغطة.' ] },
  { v:'V26.8', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'جهات المعالجة كلها صارت تعدل وتحذف من صفحة التحديات والمعوقات، الأصلية والمضافة: زر تعديل بجانب كل جهة لتغيير اسمها، وزر حذف، ولا تحذف آخر جهة، و«الأصلية» يعيد الثلاث كما كانت. الفئات المسندة لجهة محذوفة تنتقل تلقائيا.' ] },
  { v:'V26.7', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'المساعد داخل التطبيق صار يعرف صفحة «التحديات والمعوقات» بكلماتها: إضافة جهة معالجة، جهة أخرى، وصف المعالجة، آخر تاريخ، مهمة معالجة، تصدير نقاط التحديات، فلتر المشعر — بخطوات مكتوبة.' ] },
  { v:'V26.6', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'صار للمكتب إضافة جهة معالجة أخرى غير شركة الخدمة وكدانة وأفاقي من صفحة التحديات والمعوقات (حقل «جهة أخرى» تحت جدول الفئات)، فتظهر في قوائم الجهات والبطاقات والتصدير على كل الأجهزة، وتحذف من المكان نفسه.' ,
      'في «التحديات والمعوقات» صار لكل تحد وصف للمعالجة وآخر تاريخ لها، وزر «مهمة معالجة» ينشئ المهمة الأسبوعية بهما في مسار التحديات.',
      'وتحت كل تحد قائمة نقاطه بالفلتر الحالي: اسم المخيم وشاخصه أو اسم الممر، ومشعره ونوعه، ووصف العائق، وحالة الوصول.',
      'وزر «تصدير نقاط التحديات»: إكسل فيه كل نقطة بتحديها ووصفه وموقعها ومشعرها ومسؤوله ومعالجته وآخر تاريخ، بالفلتر إن وضع وإلا كلها.' ] },
  { v:'V26.5', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'صارت «التحديات والمعوقات» صفحة واحدة في متابعة الوزارة بدل صفحتين من مصدر واحد، وفيها فلتر المشعر ثم النوع: منى ← مخيمات ← العائق وعدد نقاطه والجهة المسؤولة وآلية المعالجة والحالة.',
      'في تصفية الخريطة صف واحد للأدوار يحكم مسار التفويج ونقاط الجمرات معا، وزر «مسار التفويج» إظهار أو إخفاء فقط.',
      'محطات قطار منى بتسمية «سار» الرسمية: منى ١ أول منى، منى ٢ وسطه، منى ٣ الجمرات.' ] },
  { v:'V26.4', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'صارت أسماء محطات قطار المشاعر في منى بتسمية الوزارة: محطة الجمرات «منى ١»، والمحطة الشرقية «منى ٣»، ومسار الدور الرابع من منى ٣ إلى منى ١.' ] },
  { v:'V26.3', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'صار في الحارس جرد للأرقام: مع كل إصدار تقارن أرقام المعوقات وجهاتها والمسح والشركات والمهام والأيام وأوراق التصدير بالمحسوب مباشرة من البيانات، فأي فرق يوقف النشر قبل أن تراه الوزارة. وقيست سرعة كل زر في كل صفحة ببيانات بحجم الموسم: ٢٤٥ زرا بمتوسط ٦ أجزاء من الثانية.' ] },
  { v:'V26.2', d:'٢ أكتوبر ٢٠٢٦', notes:[
      'القوائم الطويلة صارت تعرض مئة صف أولا وزر «اعرض المزيد» أسفل الصفحة يزيد مئتين كل ضغطة، والبحث في الصفحة يفتح الكل كما كان. صفحة المسح صارت ترسم في ربع وقتها.',
      'صفحة الشركات صارت ترسم في نصف وقتها، وكل الصفحات أخف: ما عاد يحسب تخطيط الصفحة كلها قبل كل رسمة لقراءة مواضع التمرير، وتنسيق الأرقام يحفظ بدل أن يعاد آلاف المرات.',
      'يوم مكة أيضا في فحص النبضات والنبض الصباحي وتقارير الفحص الليلية.' ] },
  { v:'V26.1', d:'١ أكتوبر ٢٠٢٦', notes:[
      'صار يوم التقارير يوم مكة لا يوم غرينتش: الزيارة المسجلة بعد منتصف الليل كانت تحسب على اليوم السابق في ملخص العمل اليومي وإنجاز اليوم وسجل الأحداث والتصدير، فاختلفت الأرقام عما رآه الميدان.',
      'بطاقات «تعالج من خلال» في متابعة الوزارة صارت تعد كل نقطة مرة واحدة عند جهة عائقها الأول، فيساوي مجموعها إجمالي المعوقات.',
      'الدور الرابع في التفويج: مخيماته كلها تتحرك إلى محطة واحدة هي الأبعد عن الجمرات، ومنها القطار إلى محطة الجمرات، كما في ملف الوزارة.',
      'صارت صفحات المنصة أخف: مركز التصدير يرسم في خمس وقته السابق، وكل الصفحات ما عادت تحسب إسناد كل نقطة بالمرور على كل المهام، ولا تقرأ مواضع التمرير بتكلفة تخطيط كامل قبل كل رسمة.' ] },
  { v:'V26.0', d:'١ أكتوبر ٢٠٢٦', notes:[
      'صحح مسار تفويج الدور الرابع كما في ملف الوزارة: حجاجه يمشون إلى أقرب محطة قطار في منى، ويركبون قطار المشاعر إلى محطة الجمرات، ويمشون منها إلى مداخل الدور. وخط القطار يظهر أزرق متقطعا على الخريطة.' ] },
  { v:'V25.9', d:'١ أكتوبر ٢٠٢٦', notes:[
      'صار المسح لا يضيع إن أغلق الآيفون الصفحة أثناء التصوير: النموذج بصوره يحفظ على الجهاز مع كل صورة وكل حقل، ويعود كما كان تلقائيا عند فتح التطبيق. والصور صارت تقرأ بذاكرة أقل بكثير.',
      'صار للمهندس فمن فوقه تعديل حدود المخيم من نافذته «عدّل الحدود»: تسحب أي زاوية لتنقلها، وتضغط النقطة الصغيرة بين زاويتين لتضيف زاوية، وتحذف الزاوية المحددة، ثم تحفظ. ومعها «رجوع للحدود الأصلية» يعيد حدود السجل. والتعديل يصل كل الأجهزة ويسجل في سجل الأحداث.' ] },
  { v:'V25.8', d:'١ أكتوبر ٢٠٢٦', notes:[
      'صار للمهندس فمن فوقه وللمشرف تعديل حساسات المخيم من الميدان: من نافذة المخيم «عدّل الحساسات»، ثم نقل حساس أو الجيت واي، وإضافة حساس وحذفه، وحفظ يصل كل الأجهزة ويسجل في سجل الأحداث. وإن بعد حساس عن الجيت واي أكثر من ١٥٠ مترا ظهر تنبيه بمكان أفضل.' ] },
  { v:'V25.7', d:'٣٠ سبتمبر ٢٠٢٦', notes:[
      'أضيفت في التصفية طبقة «تخطيط حساسات منى»: اثنا عشر حساس حرارة ورطوبة لكل مخيم في منى، وجيت واي واحد يغطيها، تظهر عند التقريب. طبقة مبدئية تعدل من الميدان، وليست نقاطا ولا تدخل في العدادات.' ] },
  { v:'V25.6', d:'٣٠ سبتمبر ٢٠٢٦', notes:[
      'أعيد رسم مسارات التفويج على شوارع منى الفعلية: من كل مخيم في ملف الوزارة إلى مداخل دوره، ومن مخارجه إلى المخيم، بلا لفات، مع تفضيل الشوارع التي يمر بها المخطط.',
      'ظهرت مع المسارات نقاط «احتمال مخيم» حيث انتهت خطوط المخطط بلا مخيم مسجل، للتحقق الميداني، وهي ليست نقاطا ولا تدخل في العدادات.' ] },
  { v:'V25.5', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'صار للمهندس فمن فوقه حذف النقاط المضافة من الميدان أو المكتب أو أدوات الرسم حذفا نهائيا، أيا كانت حالتها، بتأكيد واحد يعرض ما ارتبط بها، ويسجل في سجل الأحداث. ونقاط السجل الأصلي تخفى ولا تحذف.' ] },
  { v:'V25.4', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'نقاط منشأة الجمرات: صار اسم كل نقطة يحمل «مدخل» أو «مخرج» مع الدور، ويظهران في نافذة النقطة، ويمكن اختيارهما عند تعديل بيانات النقاط الميدانية.' ] },
  { v:'V25.3', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'صار تحريك الخريطة أخف: مع كل سحبة يرسم ما يدخل الإطار أو يخرج منه فقط، ولا تعاد قراءة النقاط الظاهرة.' ] },
  { v:'V25.2', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'الخريطة المحفوظة على الجهاز تشمل الآن مكة والمدينة المنورة وطريق الهجرة، وتظهر تلقائيا عند انقطاع الشبكة، وتستبدل الأجهزة نسختها السابقة من تلقاء نفسها.',
      'أضيفت في التصفية طبقتان للعرض على الخريطة فقط: مباني الوزارة، وأماكن التفويج.' ] },
  { v:'V25.1', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'أصبحت صور القمر الصناعي هي الخلفية الأساسية للخريطة، ويمكن الانتقال إلى خريطة الشوارع بالزر نفسه. وعند انقطاع الشبكة تظهر الخريطة المحفوظة على الجهاز كما كانت.' ] },
  { v:'V25.0', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'عادت حركة الخريطة إلى سرعتها المعهودة: مع وجود الشبكة تعرض كما كانت من قبل، وعند انقطاعها تظهر الخريطة المحفوظة على الجهاز تلقائيا.' ] },
  { v:'V24.9', d:'٢٩ سبتمبر ٢٠٢٦', notes:[
      'خريطة مكة كاملة بشوارعها ومبانيها وأسمائها صارت جزءا من التطبيق: تنزل مرة واحدة تلقائيا عند فتح الخريطة على اتصال جيد، ثم تفتح فورا ومن غير شبكة، في المشاعر والحرم والعزيزية والنوارية والزايدي.',
      'تبقى الخريطة المحفوظة على الجهاز بعد كل تحديث للتطبيق، فلا يعاد تنزيلها ولا تختفي عند انقطاع الشبكة.' ] },
  { v:'V24.8', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'لكل نوع من النقاط شكل يميزه على الخريطة: الممر مربع، وكاميرات الوزارة مثلث، وكاميرات قراءة اللوحات مثلث مقلوب، والبوابة معين، ومحطة القطار سداسي، ومنشأة الجمرات خماسي، والمبنى علامة زائد، والجيت واي نجمة، والحساس قطرة.',
      'خطوط الذهاب تنتهي عند مداخل الدور نفسه في منشأة الجمرات، وخطوط العودة تبدأ من مخارجه، وكذلك مسار كل مخيم.' ] },
  { v:'V24.7', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'مراجعة لغة الواجهة: لا أخطاء همزات ولا إملاء في نحو ألفين وخمسمئة نص، وتحويل ثلاث عبارات عامية في مساعد البحث إلى عربية فصحى مبسطة.' ] },
  { v:'V24.6', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'مسارات الأدوار الأرضي والأول والثاني أعيد بناؤها من ملف خطة الوزارة الأصلي بدقته الكاملة، فصارت متصلة من المخيمات إلى منشأة الجمرات، ومطابقة لخطوط الملف في معظمها.' ] },
  { v:'V24.5', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'في نافذة أي مخيم زر «اعرض مسار المخيم»: يرسم مسار ذهابه إلى منشأة الجمرات ومسار عودته من مخرج دوره على الشوارع الفعلية، ويبين دوره والمسافة ووقت المشي لكل منهما.' ] },
  { v:'V24.4', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'مسارا الدورين الثالث والرابع صارا متصلين بالكامل من المخيمات إلى منشأة الجمرات ذهابا وعودة، مأخوذين من ملف خطة الوزارة الأصلي بدقته الكاملة ومرسومين على الشوارع الفعلية.' ] },
  { v:'V24.3', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'مسارات التفويج صارت مرسومة على الشوارع الفعلية نفسها بأسمائها، متصلة وطبيعية الشكل؛ وما كان ناقصا في مخطط الوزارة أكمل بأقرب طريق على الشوارع نفسها، ولا يمر مسار داخل مخيم.',
      'في تصفية الخريطة صار لمسار التفويج «كل الأدوار» معا بلون لكل دور، أو كل دور وحده؛ ومعها اختيار الذهاب والعودة معا أو كل منهما وحده.' ] },
  { v:'V24.2', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'خطوط مسار التفويج صارت خطوطا دقيقة مرسومة على منتصف الممر الفعلي بين المخيمات، لا صورة منسوخة من المخطط: حادة في كل تقريب، ولا تعبر فوق أي مخيم، وتحمل في لحظة.',
      'صورة كل دور صارت تبين مخيماته فقط، والخط الأصفر للذهاب والأحمر للعودة فوقها وتحت نقاطنا، فتبقى النقاط ظاهرة وتفتح بالضغط.' ] },
  { v:'V24.1', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'الخريطة صارت أسرع بكثير: العلامات لا تعاد من الصفر مع كل تحريك أو تقريب، بل تبقى ويعدل ما تغير منها فقط.',
      'الممرات والكاميرات صارت معينات صغيرة على لوح النقاط نفسه بحجم بقية النقاط، فلا تغطي المخيمات.',
      'مخططات مسار التفويج كانت مائلة نحو ثلاث درجات عن الخريطة فعبرت خطوطها فوق المخيمات: صححت الأدوار الخمسة فصارت الخطوط في الممرات بين المخيمات، وصارت متصلة لا نقاطا.',
      'مخارج الجمرات الخمسة عشر نقلت بالتصحيح نفسه (بين ١١٠ و١٣٥ مترا) فعادت على بداية خط العودة في كل دور.' ] },
  { v:'V24.0', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'القائمة الجانبية حين تطوى تبقى شريطا من الأيقونات: تمر بالفأرة على أي أيقونة فيظهر اسمها، وعلى أيقونة الوحدة تظهر صفحاتها فتنتقل إليها بضغطة. وزر ☰ يعيد القائمة كاملة.',
      'في متابعة الوزارة صار «ملخص التركيبات اليومي» «ملخص العمل اليومي»: المسح والتركيب والفك والمتعذر لكل يوم منذ أول يوم عمل، ولكل رقم نسبته، والجدول صفحات لا تزيد الصفحة فيها على خمسة عشر سطرا.',
      'الضغط على اسم أي عمل تحت الرسم يخفي منحناه وعموده، وضغطة ثانية تعيده. ومرشحات بالشهر واليوم وساعات العمل بتوقيت مكة، واختيار يوم واحد يعرضه ساعة بساعة.' ] },
  { v:'V23.9', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'زر ☰ في أعلى الشاشة يطوي القائمة الجانبية (الموديولات) على الكمبيوتر فيتسع المحتوى والخريطة، وضغطة ثانية تعيدها — والاختيار محفوظ. وعلى الهاتف يبقى كما هو: يفتح القائمة وتُغلق.',
      'لمسات على المظهر العام: انتقالات ناعمة للأزرار والبطاقات، وإطار تركيز واضح لمن يستعمل لوحة المفاتيح، وأشرطة تمرير رفيعة بلون النظام — وتتوقف الحركة لمن طلب تقليلها في جهازه.' ] },
  { v:'V23.8', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'المخيم يُعرف برقم شاخصه: عنوان نافذته وسطره في قائمة المواقع «شاخص ٥٤/٥٣٣»، وتحته المشعر والمربع.',
      'عناوين أجهزة النقطة في نافذتها: الراوتر والقارئ والكاميرا من بادئة شبكة موسم ١٤٤٧ (‎.1 و‎.2 و‎.3) — لكل مخيم مسجّلة شبكته (٥٤٦ مخيمًا).',
      'مداخل الجمرات تبقى في أماكن تركيبها الفعلية — جُمعت مداخل كل دور في نقطة واحدة ليكون التركيب متجاورًا.' ] },
  { v:'V23.7', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      '«منطقة الجمرات» صارت «منشأة الجمرات» في التصنيف وأسماء النقاط والكاميرات، ووزنها في النقاط كما هو.',
      'مشعر جديد «مواقع التفويج» لمواقع تفويج الحجاج (الحافلات): يظهر في «+ موقع غير مسجّل» بكاميرات الوزارة وقارئات اللوحات، فتُضاف نقاطه يدويًا الآن، ويوضع مقترح الكاميرات عليه حين يصل موقعه.' ] },
  { v:'V23.6', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'نافذة كاميرا الوزارة: «عناوين الكاميرات» كانت تترك مربعًا فارغًا — أسطر الطراز ورابط البث كانت تفيض خارج العمود الضيق. صارت كل كاميرا كتلة بعرض النافذة: الرقم والنوع، ثم العنوان والـVLAN، ثم الطراز والمواصفة، ثم رابط البث — كلها تلتف.',
      'الأعمدة الثلاثة التي ليس لها إحداثيات في تقرير الوزارة (POLE 21 و23 و24): أضف نقطتها يدويًا من «+ موقع غير مسجّل» (المهندس بلا مسح ولا صورة)، ثم سمِّها باسم العمود من «تعديل البيانات» — فتظهر كاميراتها وعناوينها في نافذتها.' ] },
  { v:'V23.5', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'مخارج الدور الثاني في الجمرات نُقلت إلى بداية خط العودة الأحمر عند الطرف الجنوبي للمنشأة — كانت داخل مبنى المنشأة. مخارج الأرضي والرابع رُوجعت على المخطط فوُجدت على بداية الخط.' ] },
  { v:'V23.4', d:'٢٨ سبتمبر ٢٠٢٦', notes:[
      'عناوين كاميرات الوزارة في التطبيق مباشرة (بلا رفع ملف): نافذة كل نقطة فيها المستقبِل وعنوانه، والقطاع وهوائيه، وحالة الوصلة، وكل كاميرا برقمها وطرازها ومواصفتها (الدقة والزوم) وعنوانها والـVLAN ورابط البث، وزر «افتح في خرائط جوجل». ٨٥ كاميرا على ٧٩ نقطة.',
      'ملف KMZ من التطبيق («التصدير ← KMZ») صار يحمل جدول الكاميرات نفسه في وصف كل نقطة — لكل من يتابع.' ] },
  { v:'V23.3', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'كاميرات الوزارة في منشأة الجمرات كما في الإكسل: كل كاميرا نقطة مستقلة برقمها (CAM 32 إلى 51) ودورها ونوعها (ثابتة/متحركة) — عشرون نقطة: خمس عشرة داخل المنشأة بأدوارها، واثنتان في الخلفي بالدور الثالث، وثلاثة أعمدة مجاورة. كانت خمس نقاط مجمّعة بالدور فلم تُرَ كاميرا كاميرا.',
      'تقرير الوزارة المرفوع يطابق كاميرات الجمرات برقم الكاميرا، فتظهر عناوين كل كاميرا في نقطتها.' ] },
  { v:'V23.2', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'طبقة «مسار التفويج» على الخريطة (تصفية ← مسار التفويج): لكل دور من أدوار الجمرات مخيماته ومسار الذهاب (أصفر) والعودة (أحمر) من الخطة التشغيلية ١٤٤٧، وبطاقة فيها طول المسار وعرضه وفرق المنسوب وملاحظة الوزارة ومقترحها وعدد نقاطنا على المسار. ونافذة كل مخيم تقول إلى أي دور يُفوَّج.',
      'مخارج الجمرات الخمسة عشر نُقلت إلى بداية خط العودة في كل دور — ثلاث نقاط (يسار ووسط ويمين) على عرض المسار — بدل أماكنها التقريبية حول المداخل.' ] },
  { v:'V23.1', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'الاعتماد التقني: كمية كل جهاز في «اعتمد واختر الأجهزة» صارت حقلًا يُعدَّل في مكانه (مثلًا ١٢ أنتنة ← ١٠) بدل الحذف والإضافة من جديد، والصفر يرفع السطر.',
      'تسمية النقاط المرفوعة: حدّد النقاط على الخريطة ← لوح الإسناد ← «أو سمِّ المحدَّد» ← بداية الاسم ورقم البداية ← سمِّ (مثلًا «كاميرا وزارة LPR — عرفات —» ١ إلى ١٠). والنقطة الواحدة من «تعديل البيانات»، وتعديلها يبقى بعد إعادة الفتح.' ] },
  { v:'V23.0', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'التصنيفات بيدك: من «المواقع» (أسفل الصفحة) تضيف تصنيفًا باسمه ورمزه ولونه وشكله، وتحذفه — والتصنيف الذي عليه نقاط تنقل نقاطه إلى تصنيف آخر ثم يُحذف («انقل واحذف»).',
      'نقل النقاط إلى تصنيف: حدّد النقاط على الخريطة ← لوح الإسناد ← «أو انقل المحدَّد إلى تصنيف» ← انقل. الزيارات والتركيبات لا تتأثر، والنقل مسجّل.',
      'النوارية كما في المخطط: نُقلت نقاطها إلى أماكنها (دخول وخروج رئيسيان، وتسع مقابل ست) مع بقاء زيارات اليوم عليها كما هي.' ] },
  { v:'V22.9', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'كاميرات النوارية في أماكنها كما في مخطط الوزارة: كاميرا الدخول الرئيسي، وكاميرا الخروج الرئيسي، وتسع كاميرات على مداخل المسارات (مسار ١–٩) تقابلها ست على مخارجها (خروج ١–٦). المواقع تقريبية بمقياس المخطط وتُضبط بـ«تحريك» في أول زيارة.',
      'تعديلات موقع النقطة واسمها وإخفاؤها من المكتب تصل إلى الأجهزة التي حمّلت النقطة من قبل (كانت تبقى حيث كانت).' ] },
  { v:'V22.8', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'صور الزيارة من لوح «تعديل المسح»: تظهر بمصغّراتها، وكل صورة تُحذف بزر 🗑 وتأكيد (المهندس أي صورة، ورافعها صورته ما لم تُعتمد الزيارة)، وتُضاف صورة أو أكثر دفعة واحدة باختيار نوعها أو «صورة إضافية». ولاستبدال صورة: احذف القديمة وأضف الجديدة.',
      'ما لم يُرفع بعد من صور جهازك يظهر «في الطابور» ويمكن إلغاؤه قبل الرفع.' ] },
  { v:'V22.7', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'تعديل المسح: الصور صارت تُعدَّل من اللوح نفسه — كل صورة تُستبدَل أو تُضاف وحدها (📷)، وتُرفَع مع المزامنة، والباقي كما هو.',
      'لوح التعديل لم يعد يحبسك: كان شريط التطبيق العلوي يغطي زر الإغلاق على الهاتف. صار اللوح فوق كل شيء، وفيه «إغلاق» أعلاه وأسفله، ويُغلَق بلمس الخلفية وبزر الرجوع في الجهاز وبالانتقال لأي صفحة.' ] },
  { v:'V22.6', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'عربية أوضح في شاشات الفني (نموذج المسح ومهامي): «البيانات المسجّلة تُراجَع فقط — اكتب ما لا نعرفه عن الموقع» بدل «المعلوم يُراجَع…»، و«نقاطك لا تُحسب إلا بعد اعتماد المهندس… ومعها سبب الإعادة» — وسبع غيرها.' ] },
  { v:'V22.5', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'عناوين كاميرات الوزارة: من «الأدوات ← الاستيراد» ارفع ملف الوزارة كما هو؛ يُطابَق بالنقاط عمودًا عمودًا (وأدوار الجمرات)، ويُعرَض قبل الحفظ ما طابق وما لم يطابق ولماذا، ثم تظهر في نافذة كل نقطة عناوين كاميراتها والمستقبِل وهوائي القطاع — لمن دخل التطبيق فقط. كلمة المرور لا تُحفَظ.',
      'النقاط التي على الإحداثية نفسها صارت تُرى وتُلمَس كلها (كانت العليا تغطّي السفلى — ١٦ من ١٧ في النوارية).' ] },
  { v:'V22.4', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'عربية أوضح في سبع عبارات أخرى بمعناها في مكانها: «تجميع الصفوف» بدل «الطيّ»، و«تبويب التجارب» بدل «شريحة التجارب»، و«الأزرار فوق» بدل «الشرائح فوق»، و«مسجَّل باسم من كتبه» بدل «مختومٌ بكاتبه» — وغيرها.' ] },
  { v:'V22.3', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'تعديل المسح بلا إعادته: اضغط النقطة المزارة ← «✎ تعديل المسح» ← اختر الحقل (مثل عرض البوابة) ← عدّله ← يُحفَظ فورًا وحده؛ الصور وبقية المسح كما هي، والتعديل مسجّل باسمك في الزيارة وفي السجل.',
      'المسح المعتمد: إذا عدّله غير المهندس عاد لانتظار الاعتماد (ويُنبَّه المكتب)، والمهندس يعدّل ويبقى معتمدًا.' ] },
  { v:'V22.2', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'منشأة الجمرات بأدوارها: كل نقطة تعرف دورها (الأرضي حتى الرابع)، وفي التصفية صفّ «الأدوار» يعرض دورًا واحدًا على الخريطة والقوائم — بدل نقاط فوق بعضها كأنها موقع واحد. وأُضيفت كاميرات الوزارة في المنشأة (عشرون كاميرا في تسع نقاط: خمسة أدوار وأعمدة مجاورة).',
      'نافذة كاميرا الوزارة تقول عدد كاميراتها ونوعها (ثابتة/متحرّكة) وحالة ربطها وقطاعها من تقرير الوزارة ٢٠٢٦. النقاط القائمة طابقت التقرير موقعًا موقعًا فبقيت بمعرّفاتها وزياراتها.',
      'كاميرات النوارية (قارئات اللوحات) بأسمائها الرسمية: الدخول، خروج ١–٦، الخروج، مسار ١–٩ — والمواقع تقريبية تُضبط في أول زيارة. وأُخفيت نقطة مكررة لم تُزر.',
      'عربية أوضح: «وسمها تجريبية» صارت «اجعلها نقطة تجربة»، وأخواتها بمعناها في سياقها.' ] },
  { v:'V22.1', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'البحث في المواقع: لو التصفية الحالية (نوع أو مشعر أو حالة) أخفت ما تبحث عنه، تقول الرسالة «لا نتائج ضمن التصفية الحالية — وخارجها كذا» ومعها «ابحث في الكل» — بدل «لا نتائج» التي توحي أن النقطة غير موجودة.' ] },
  { v:'V22.0', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'أخف بالثلث: قاموسا الإنجليزية والأردو في ملف مستقل يُحمَّل لغير العربية فقط ومرة واحدة — الملف الرئيسي أصغر، فالتحديث أسرع وذروة الذاكرة وقته أقل. العربية لا تنزّله أبدًا.',
      'شاشة الدخول بالإنجليزية أو الأردو تظهر بلغتها، وتغيير اللغة منها يعيدها بلغتها الجديدة ويُبقي اسم المستخدم.' ] },
  { v:'V21.9', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'التحديث التلقائي أخف على الآيفون: قبل إعادة التحميل تُطفأ الخريطة والصفحة والإنصات الحي — الانتقال للنسخة الجديدة كان يحمّلها فوق القديمة بكل ما فيها فيتجاوز سفاري حدّ الذاكرة.',
      'حارس الإقلاع: لو توقّف التطبيق فجأة، الفتح التالي يكون خفيفًا (بلا الرجوع لآخر صفحة، وبعد توقّفين على «مهامي») ويُسجَّل أين توقّف — فلا تحتاج مسح بيانات الموقع.' ] },
  { v:'V21.8', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'زر اللغة «ع» في الأعلى يعمل على الهاتف: قائمة اللغات كانت تُفتح لكن الشريط العلوي يقصّها فلا يظهر منها شيء — صارت تظهر فوق كل شيء.',
      'زر المظهر صار واحدًا بثلاث حالات بدل زرّين متجاورين: داكن ← فاتح ← وضع الشمس (للشاشة تحت الشمس)، وأيقونته تقول الحالة. وأُصلح أن أي لمسة على الخريطة كانت تطفئ وضع الشمس وحدها.' ] },
  { v:'V21.7', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'رجوع احترازي: القواميس عادت داخل الملف الرئيسي كما كانت في V21.5 — بعد بلاغ توقّف متكرّر للتطبيق على آيفون عقب تجربة تغيير اللغة. ما يتغيّر عليك شيء، والتسريع يعود بعد التحقق على آيفون حقيقي.' ] },
  { v:'V21.5', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'أخف على الهاتف: في التحديات والطلبات صار الصف نصًا وحقول التعديل تظهر لصف واحد عند ضغط ✎ — بدل عشرات الحقول المرسومة معًا. والتصدير لا يوقف الصفحة لو تعذّر.' ] },
  { v:'V21.4', d:'٢٧ سبتمبر ٢٠٢٦', notes:[] },   /* نسخةُ مراجعة: الأسبوعُ ٥٣ في الترحيل، والاحتياطيُّ يُحدَّث فورَ الرفع */
  { v:'V21.3', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'خطة الأسبوع: كل نقطة تنتهي بواحدة من ثلاث — «أتممتها» بنتيجة فعلية مكتوبة، أو «تحديث» يسجّل ما حدث وتنتظر تجارب أخرى، أو «إغلاق» بسببه مع نقطة جديدة بدلها. وما بقي من أسبوع سابق بلا نتيجة ولا إغلاق يظهر بالأحمر أول الأسبوع الحالي. اكتمال الخطوات يطلب النتيجة ولا يُتمّ وحده.',
      'الخطة يراها المهندسون ومن فوقهم (المدير والإدارة العليا)، ويكتبها المهندس والمدير.' ] },
  { v:'V21.2', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'للمهندس: «خطة الأسبوع» في التخطيط — نقاط بأولويتها وتفاصيلها وخطواتها (قائمة تحقق تُتم النقطة عند اكتمالها) ومتطلباتها ونتيجتها المرجوة، بأسبوعها؛ النقطة تصير مهمة أسبوعية بضغطة، وما لم يُنجز يُرحّل للأسبوع القادم، وإكسل للخطة. يراها ويكتبها المهندس وحده.' ] },
  { v:'V21.1', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'صفحة الإشعارات: بطاقة «الإشعارات على هذا الجهاز» (إيقاف النوافذ المنبثقة، إيقاف إشعارات الجهاز، كتم حتى الغد) صارت فيها مباشرة — كما في «حسابي».' ] },
  { v:'V21.0', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'حماية الزيارة من الضياع: ما تحفظه ولم يُرفع بعد يُكتب أيضًا في احتياطي لا يسقط مع مخزن المتصفح (بلا صور)، ويعود وحده عند فتح التطبيق لو سقط المخزن أو أُعيد التحميل — ويُمحى حين يُرفع كل شيء.',
      'نموذج المسح: لو نقص شيء لا تختفي الرسالة — صندوق أحمر ثابت أعلى النموذج يقول «لم تُحفظ الزيارة — أكمِل: …» حتى تكمله.' ] },
  { v:'V20.9', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'متابعة الوزارة: التحدي أو الطلب المفتوح أكثر من أسبوعين يُعلَّم بعمره بالأحمر، و«الحمل على المسؤولين» يقول من عليه كم تحديًا ومهمة ومتأخرًا، و«مسار الأسابيع» يعرض لقطات الأسابيع بفروقها، و«بانتظار قرار الوزارة» في المؤشرات — وكلها في التقرير.' ] },
  { v:'V20.8', d:'٢٧ سبتمبر ٢٠٢٦', notes:[
      'الإشعارات العائمة عليها ✕ تغلقها بلا انتقال، و«كتم ساعة» من البطاقة نفسها — وما يصل دفعة واحدة (بعد مزامنة) صار بطاقة واحدة تقول العدد بدل كومة تغطي الشاشة.',
      'في «حسابي» بطاقة «الإشعارات على هذا الجهاز»: إيقاف النوافذ المنبثقة، وإيقاف إشعارات الجهاز، وكتم حتى الغد — والجرس يعدّ كل شيء دائمًا. ومعها طريق الإيقاف من إعدادات الآيفون والأندرويد.' ] },
  { v:'V20.7', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'المهام الأسبوعية تُسمَع في متابعة الوزارة: تأجيل الموعد وتغيير المسؤول صارا يُسجَّلان ويظهران في آخر التحديثات ومحضر الاجتماع، وحذف مهمة مربوطة يُكتب على طلبها أو تحدّيها.',
      'الملخص فيه كتل العرض الأسبوعي الأربع من المهام: أبرز الأعمال المنجزة، أبرز المهام القادمة، الاعتمادات والدعم المطلوب، المهام المتأخرة — مع «أُنجز هذا الأسبوع» مقارنةً بالماضي، وآخر اجتماع و«ما تغيّر منذه».',
      'التقرير بصيغه الأربع فيه الكتل نفسها، والباوربوينت فيه شريحة «المسار | القارئات» بتصميم العرض — وشارة على «متابعة الوزارة» في القائمة بعدد الجديد منذ آخر زيارة.' ] },
  { v:'V20.6', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'كل شيء مربوط: لكل طلب من الوزارة زر «＋ مهمة تنفيذ» يُنشئ مهمة أسبوعية مربوطة به — آخر ملاحظة فيها تصير إفادة الطلب، واكتمالها ينجزه، وتوقفها يظهره متوقفًا وتحديًا قائمًا.',
      'كل تعديل على تحدٍّ أو طلب يُسجَّل بمن غيّره ومتى، و«آخر التحديثات — هذا الأسبوع» سجل واحد يجمع المهام والتحديات والطلبات: في الملخص وفي التقرير بكل صيغه (PowerPoint وWord وExcel وPDF)، ومعه عمود «مرتبطة بـ» في المهام.' ] },
  { v:'V20.5', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'التحديات وآليات المعالجة صارت بمصادرها الثلاثة: من المسح الميداني (كل فئة بعدد نقاطها ومشاعرها)، ومن المهام الأسبوعية (المتوقفة)، والمسجلة يدويًا — ولكل تحدٍّ: على مين، ومن سيحله، وآلية المعالجة، والحالة، وزر «＋ مهمة معالجة» يُنشئ مهمة أسبوعية مربوطة به.',
      'التحدي يظهر «تم الحل» وحده: حين تُركّب نقاطه كلها، أو تكتمل مهمة معالجته، أو تُستأنف المهمة المتوقفة.',
      'المهام الأسبوعية صارت تبويبًا داخل متابعة الوزارة، و«حالة أبرز المهام» تُقرأ منها بأعمدة العرض (المسار والمسؤول والحالة والاستحقاق والتحديث) — والتصدير كذلك.' ] },
  { v:'V20.4', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'متابعة الوزارة: زر PowerPoint في شريط التصدير — العرض الأسبوعي من قالب الوزارة الأصلي نفسه (الغلاف بتاريخ اليوم، والفاصل، وثماني شرائح بعناوين العرض وجداوله، والشكر) بخلفياته وشعاراته وخطوطه المضمّنة، يُبنى على جهازك في لحظة.' ] },
  { v:'V20.3', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'التحديات وطلبات الوزارة: القائمة تظهر أولًا في تبويبها، ونموذج الإضافة تحتها خلف زر «＋ تحدٍّ جديد» أو «＋ طلبٌ جديد» — وما تضيفه يظهر أعلى القائمة فورًا.' ] },
  { v:'V20.2', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'متابعة الوزارة: شريط «تصدير التحديث الأسبوعي» أعلى كل عنوان — Word وExcel وPDF بعناوين العرض التسعة وألوانه، يُبنى على جهازك لحظيًا بالأرقام الحالية.' ] },
  { v:'V20.1', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'مشعر جديد «النوارية» لكاميرات مركز النوارية (كاميرات الوزارة وLPR): النقطة التي سُجّلت تحت منى وهي في النوارية نُقلت إليه، ويظهر في كل الشاشات.',
      'إصلاح: كانت نافذة نقطة الكاميرا تعرض «undefined» مكان رمز النوع — عاد الرمز واللون.' ] },
  { v:'V20.0', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'موديول جديد «متابعة الوزارة» في المتابعة، بعناوين العرض الأسبوعي نفسها: الملخص مع المقارنة بالأسبوع الماضي، وحالة أبرز المهام، وحالة التركيبات، وتركيب المخيمات لشركات الخدمة (ممتاز/متوسط/ضعيف)، وبيان المعوقات وتصنيفها بالجهة المعالجة، والتحديات وآليات المعالجة، وطلبات الوزارة، وملخص التركيبات اليومي — وشاشة القاعة انتقلت إليه.' ] },
  { v:'V19.8', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'على أندرويد كالآيفون: تظهر بعد الدخول خطوات التثبيت مرقمة (كروم وسامسونج، والخروج من متصفح واتساب) ولو لم يعرض المتصفح زر التثبيت — ومعها «ثبّت الآن» بضغطة حين يسمح المتصفح.' ] },
  { v:'V19.7', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'على أندرويد: يظهر بعد الدخول «ثبّت الآن» بضغطة واحدة حين يسمح المتصفح بالتثبيت — كما على الآيفون بالخطوات.' ] },
  { v:'V19.6', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'على الآيفون: تظهر بعد الدخول خطوات تثبيت التطبيق على الشاشة الرئيسية (مرة، ثم كل يوم حتى تضغط «تم») — المثبَّت يحفظ عملك أثبت ويفتح أسرع.',
      'اللافتة الحمراء لم تعد تظهر بلا سبب: تظهر فقط حين يكون الجهاز بلا شبكة أو فيه عمل لم يُرفع بعد، وتختفي حين يُرفع — والرفع يُعاد تلقائيًا كل عشر ثوانٍ ما دام الحفظ المحلي معطلًا.' ] },
  { v:'V19.5', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'المزامنة التلقائية أسرع: ما يُحفظ أثناء رفع جارٍ يُرفع فور انتهائه بدل انتظار الدقيقة التالية، وما ينتظر يُرفع فورًا عند الخروج من التطبيق أو إغلاقه.',
      'اللافتة الحمراء «الحفظ المحلي لا يعمل» تقول الآن سببها وما تفعله، وفيها «أعد المحاولة» — وعند انقطاع اتصال المتصفح بمخزنه بعد الرجوع من الخلفية (عيب معروف في آيفون) يُعاد فتحه تلقائيًا بدل أن يبقى معطلًا حتى إعادة التحميل.' ] },
  { v:'V19.4', d:'٢٦ سبتمبر ٢٠٢٦', notes:[
      'على الهاتف: زر مزامنة 🔄 في أعلى الشاشة بجوار رقم النسخة، عليه عدد ما ينتظر الرفع ويدور أثناء المزامنة — وفي اللافتة الحمراء «الحفظ المحلي لا يعمل» زر «زامن الآن» مباشرة.' ] },
  { v:'V19.3', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'في التقارير التنفيذية ثلاث شاشات جديدة: «مطابقة المنهجية» تقيس ٢٣ بندًا من دليل المعرفة (الإصدار الثامن) والمنهج الرشيق ومنهج إدارة مشاريع الذكاء الاصطناعي من بيانات النظام نفسها — بنسبة مطابقة وإكسل للمصفوفة.',
      '«الدروس والمراجعات» لتسجيل الدروس المستفادة والمراجعات الدورية، و«أصحاب المصلحة» بسجل الانخراط الحالي والمطلوب — للمكتب والإدارة العليا.' ] },
  { v:'V19.2', d:'٢٥ سبتمبر ٢٠٢٦', notes:[] },   /* نسخةُ بنية: إحصاءُ الأنواع والدمجُ بالتسمية في السير */
  { v:'V19.1', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'كاميرات الوزارة أصبحت عائلة واحدة: «كاميرات الوزارة» (ثابتة Bullet أو متحركة PTZ — يظهر نوع كل كاميرا في نافذتها ويصححه المهندس) و«كاميرات الوزارة — LPR» لقراءة اللوحات. صُحح الاسم الخاطئ «كاميرات فالوزارة»، ودُمج النوع المكرر «كاميرات LPR» في LPR.' ] },
  { v:'V19.0', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'إصلاح مهم: النقاط والمستحق كانت تُحسب صفرًا على أي جهاز بواجهة إنجليزية أو أردية لأن مفتاح الوزن كان يُقرأ بلغة الواجهة — صارت واحدة على كل جهاز بأي لغة.',
      'البحث في القائمة الجانبية يصل الآن إلى الشرائح داخل الصفحات (مثلًا «يوميات» يفتح يوميات المشروع مباشرة)، وزر Enter يفتح أول نتيجة، و«/» على الحاسوب يفتح البحث.',
      'في تقرير الأداء بطاقة «كيف يُحسب المستحق»: المعادلة بالقيم الحالية، وأوزان كل نوع، ومثال محسوب، وأين يُضبط كل رقم.',
      'في صحة النظام ← الاستهلاك: قائمة بالصفحات التي لم يفتحها أحد في ثلاثين يومًا لتقرر ما يُدمج أو يُخفى.' ] },
  { v:'V18.9', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'ضُبطت أوزان النقاط والتارجت الشهري (٣٬٥٠٠) وأُلغي احتساب الإضافي بقرار صاحب المشروع — يُعاد حساب النقاط والمستحق على الأعمال المسجلة كلها بالقيم الجديدة.' ] },
  { v:'V18.8', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'في تقرير الأداء «محاكي الأوزان والتارجت»: جرّب وزن كل نوع والتارجت الشهري وشوف أثرهما على ما سُجّل فعلًا (نقاط كل عضو وإسقاط الشهر وهل يعدّي التارجت) قبل الضبط — وزر لاعتمادها، وزر لإلغاء الإضافي.',
      'يوميات المشروع: أعمدة جديدة — المشاعر لكل يوم، والمتعذّر، وساعات عمل الفرد (من أول سجل إلى آخره).' ] },
  { v:'V18.7', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'شاشة جديدة «يوميات المشروع» في التقارير التنفيذية: كل يوم من أول يوم عمل إلى اليوم — الزيارات والتركيب والفك والمواقع الجديدة والاعتمادات ومن عمل — مع التراكمي، وإكسل لها.' ] },
  { v:'V18.6', d:'٢٥ سبتمبر ٢٠٢٦', notes:[
      'في تقرير الأداء جدول جديد «المسح بنوع الموقع لكل عضو»: كم مخيمًا وكم ممرًا مسح كل عضو فعلًا (بالعدد والنقاط)، وأيام عمله، ونقاط المسح في اليوم — وأعمدته في إكسل التقرير.' ] },
  { v:'V18.5', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'خريطة القمر الصناعي في شاشة الوزارة على الهاتف: الصفحة تُمرَّر بإصبع واحد فوق الخريطة، وزر «اضغط لتحريك الخريطة» يفعّل التحريك — والتقريب بإصبعين يعمل دائمًا.' ] },
  { v:'V18.4', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'شاشة الوزارة: نقاط المشعر تظهر الآن على صورة القمر الصناعي افتراضيًا (تكبير وتحريك وضغط على النقطة لفتحها)، وخريطة النقاط المجردة تبقى خيارًا بزر «نقاط».',
      'كلمة «نبض» استُبدلت في الشاشات بما يناسب موضعها: «شغل الميدان» في شاشة الوزارة، و«ملخص الصباح» للتقرير اليومي، و«إشارة» لاتصال الأجهزة، و«المزامنة الحية» لوصول التغييرات.' ] },
  { v:'V18.3', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'في «تصحيح البيانات» بطاقة جديدة «نقاط بعيدة عن مشعرها» تحصر النقاط ذات الإحداثيات الخاطئة وتفتحها للتصحيح.' ] },
  { v:'V18.2', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'خريطة التقدم بالنقاط في شاشة الوزارة: تكبير وتصغير بالأزرار أو بإصبعين أو بعجلة الفأرة، وسحب للتحريك، فتتباعد النقاط المتلاصقة — والنقطة ذات الإحداثيات البعيدة عن مشعرها لم تعد تصغّر الخريطة إلى زاوية، وتُذكر بمعرّفها لتصحيحها.' ] },
  { v:'V18.1', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'حسابات الوزارة أصبحت تظهر للمهندس في شاشة المستخدمين (كانت لمدير المشروع فقط)، وتبقى مخفية عن المشرف فمن دونه.' ] },
  { v:'V18.0', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'في «حسابي» بطاقة لتنزيل خريطة المشاعر على الجهاز مرة واحدة بموافقتك (تظهر حين تُبنى خريطة الموسم) فتعمل الخريطة بلا شبكة — مع وضع الشمس ونسخ التشخيص في المكان نفسه.',
      'في الأدوات زر GeoJSON يصدّر المواقع بحالتها بصيغة قياسية يفتحها أي نظام خرائط.',
      'المشعر الذي يُعلن في «نقاط المراحل» يظهر من يومه في الطلبات والتوزيع وشاشة الوزارة والملخص والقوائم بأرقام صفر، حتى تأتي أول نقطة فيه.' ] },
  { v:'V17.99', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'وضع الشمس: زر 🔆 في أعلى الشاشة (وفي الأدوات) يرفع التباين ويكبّر الخط والأزرار وعلامات الخريطة للعمل تحت الشمس — لهذا الجهاز وحده، ويبقى بعد إعادة الفتح.',
      'الشاشة تبقى مضاءة أثناء نماذج المسح والتركيب والصيانة، وتُطلق عند الإغلاق أو بعد عشر دقائق بلا لمس.',
      'في نموذج التركيب، إن كان الهاتف يدعم قراءة الرموز، يظهر زر كاميرا بجوار الرقم التسلسلي يقرأ ملصق الجهاز ويملأ الحقل — والكتابة اليدوية باقية، ويُنبَّه إن كان الرقم مسجلًا على نقطة أخرى.' ] },
  { v:'V17.98', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'في الأدوات زر «نسخ التشخيص»: ينسخ آخر مئة حدث على الجهاز (بلا أسماء ولا نصوص) لإرساله للمهندس عند غياب الشبكة، ويُرفق تلقائيًا بكل بلاغ.',
      'أرقام النقاط والرموز اللاتينية داخل الجمل العربية أصبحت تُعرض بترتيب صحيح في الشاشات ورسائل واتساب.',
      'صحة النظام ← الاستهلاك: بطاقة أداء الميدان — أبطأ الأجهزة والصفحات ومؤشرات السرعة.' ] },
  { v:'V17.97', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'التحديثات أصبحت تصل الهواتف مرتين في الأسبوع (فجر الأحد والأربعاء) بدل أن تصل مع كل دفعة، إلا الإصلاحات العاجلة فتصل فورًا.',
      'رسالة «ما الجديد» تعرض سطور كل النسخ التي وصلت منذ آخر مرة، لا آخر نسخة فقط.' ] },
  { v:'V17.96', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'في ثوابت النظام بطاقة «حارس التكلفة»: بعد ضبط تنبيه الميزانية في Google Cloud يؤشّر المدير عليها فيختفي البند من جاهزية الموسم — والخطوات في دليل مرفق.' ] },
  { v:'V17.95', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'التطبيق أصبح يفتح فورًا من نسخة الجهاز المحفوظة دون انتظار تنزيل الصفحة، والتحديثات تصل كما كانت عند صدور نسخة جديدة.',
      'التحدي «لا يوجد سطح تثبيت» أصبح يُعدّ مرة واحدة في كل الشاشات مهما اختلفت صيغته بين المخيم والممر، وأُضيفت للمهندس بطاقة بأكثر ما كُتب تحت «أخرى».',
      'في صحة النظام ← الاستهلاك: بطاقة تعرض أكثر الصفحات استعمالًا خلال ثلاثين يومًا وقراءات اليوم مقارنةً بالحصة المجانية.',
      'يمكن للمدير وسم نقاط «التركيب التجريبي» من نافذة النقطة، وتظهر أزمنة مراحلها في الفك والمراحل ← السلسلة.' ] },
  { v:'V17.94', d:'٢٤ سبتمبر ٢٠٢٦', notes:[
      'البلاغات ونبض الصباح وتقرير النظام أصبحت تُتابع داخل التطبيق فقط (صحة النظام)، ولم تعد تُنشر في المستودع العام.',
      'النسخة الاحتياطية اليومية أصبحت تُحفظ مشفّرة على الدرايف فقط، ولا يُحفظ في المستودع إلا أعدادها.',
      'أرقام الصفحة المشتركة للوزارة أصبحت مشفّرة ولا تُقرأ إلا برمز اليوم.' ] },
  { v:'V17.93', d:'٢٣ سبتمبر ٢٠٢٦', notes:[
      'إذا تعذّر الحفظ على ذاكرة الجهاز يظهر شريط أحمر يطلب المزامنة وعدم إغلاق التطبيق، ويحاول النظام إصلاح الحفظ تلقائيًا ثم ينقل ما حُفظ مؤقتًا دون فقد.',
      'يطلب التطبيق من المتصفح الاحتفاظ ببيانات الجهاز بشكل دائم، وتظهر النتيجة في صحة النظام.',
      'الحساب الذي يسجّل نفسه بنفسه يبقى بانتظار تفعيل المكتب، ويستمر عمله محفوظًا على الجهاز ثم يُرفع بعد التفعيل.',
      'خريطة التقدم في شاشة الوزارة أصبحت بالنقاط: كل نقطة في موقعها الحقيقي بلون حالتها، والضغط عليها يفتحها.' ] },
  { v:'V17.92', d:'٢١ سبتمبر ٢٠٢٦', notes:[] },   /* دستورُ الوكلاء — لا تغييرَ يراه المستخدم */
  { v:'V17.91', d:'٢١ سبتمبر ٢٠٢٦', notes:[] },   /* بنيةٌ داخلية — لا تغييرَ يراه المستخدم */
  { v:'V17.90', d:'٢١ سبتمبر ٢٠٢٦', notes:[
      'وضع القاعة: عند اختيار «عرض كامل» في شاشة الوزارة تنتقل الشاشة بين أقسامها تلقائيًا كل خمس عشرة ثانية، وتتوقف عند أول لمسة — مناسب لشاشة غرفة العمليات.',
      'التقرير الأسبوعي أصبح له غلاف بهوية الوزارة يحمل ملخص الأسبوع ورمز QR يفتح الصفحة المشتركة من الهاتف.' ] },
  { v:'V17.89', d:'٢١ سبتمبر ٢٠٢٦', notes:[
      'شاشة الوزارة أصبحت بألوان الوزارة (الأخضر والذهبي) ويظهر عليها اسم الوزارة واسم المشروع. الشكل نفسه في الصفحة المشتركة وفي التقرير الأسبوعي.',
      'فوق الأرقام جملة تلخص الأسبوع: عدد النقاط التي تم مسحها وأين، والموعد المتوقع لاكتمال المسح في أكبر مشعر، وعدد النقاط التي تنتظر قرار الوزارة.',
      'الأرقام الكبيرة تتحرك من الصفر إلى قيمتها عند فتح الشاشة.' ] },
  { v:'V17.88', d:'٢١ سبتمبر ٢٠٢٦', notes:[
      'في منى يوجد 14 مخيمًا مسجلًا مرتين في الكشف بالإحداثيات نفسها. تم دمج كل زوج تلقائيًا عندما يكون أحدهما قد مُسح والآخر لم يُمسح، مع اعتماد المخيم الذي تم مسحه.',
      'الحالات التي لم يمكن حسمها تلقائيًا تظهر في شاشة «تصحيح البيانات» ليقررها المهندس.',
      'بذلك انخفض عدد المخيمات التي «لم تُزر» في منى انخفاضًا حقيقيًا، دون أي تعديل يدوي على الأرقام.' ] },
  { v:'V17.87', d:'٢٠ سبتمبر ٢٠٢٦', notes:[
      'تظهر هذه الرسالة مرة واحدة بعد كل تحديث، وتشرح ما تغير، ثم لا تظهر مرة أخرى.',
      'المخيم المسجل مرتين في الموقع نفسه أصبح له حل من شاشة «تصحيح البيانات»: يُختار الأصل ويُغلق الآخر فيخرج من العدّ، ويمكن التراجع في أي وقت.',
      'عند فتح نقطة لم تُزر بعد، يظهر تنبيه إذا كانت هناك نقطة أخرى في الموقع نفسه، مع بيان ما إذا كانت قد مُسحت.',
      'النقاط التي لم تُزر أصبحت واضحة على صورة القمر الصناعي بإطار برتقالي.' ] },
  { v:'V17.86', d:'٢٠ سبتمبر ٢٠٢٦', notes:[
      'المخيم المسجل مرتين في الموقع نفسه أصبح له حل من شاشة «تصحيح البيانات»: يُختار الأصل ويُغلق الآخر.',
      'عند فتح نقطة لم تُزر بعد، يظهر تنبيه إذا كانت هناك نقطة أخرى في الموقع نفسه.',
      'النقاط التي لم تُزر أصبحت واضحة على صورة القمر الصناعي بإطار برتقالي.' ] },
  { v:'V17.85', d:'٢٠ سبتمبر ٢٠٢٦', notes:[
      'شاشة الوزارة أصبحت متاحة خارج التطبيق: تقرير PDF يُرسل بالبريد كل سبت، وصفحة إلكترونية يفتحها ممثل الوزارة برمز دخول يتغير يوميًا.',
      'من المتابعة ← نظرة عامة ← «شاشة الوزارة»: نسب الإنجاز في حلقات، وكل مشعر بشريطه وموعد اكتماله المتوقع، وخريطة المربعات بالألوان، وزر «عرض كامل» لشاشة القاعة.' ] },
  { v:'V17.83', d:'٢٠ سبتمبر ٢٠٢٦', notes:[
      'تحت كل مشعر يظهر «يكتمل نحو …»: الموعد المتوقع لانتهاء المسح محسوبًا من سرعة الإنجاز في آخر أسبوعين؛ أخضر إذا كان قبل الموعد المحدد، وأحمر إذا كان بعده.',
      'خريطة المربعات: كل مربع بلون يعبر عن نسبة ما مُسح فيه، والضغط عليه يفتح مواقعه.' ] },
  { v:'V17.82', d:'٢٠ سبتمبر ٢٠٢٦', notes:[
      'شاشة جديدة باسم «شاشة الوزارة» في المتابعة ← نظرة عامة: عرض كبير مناسب للاجتماعات يتحدث تلقائيًا كل دقيقة.' ] }
];
var WN = null;
/* verNum القائمةُ (رقمُ النسخة عددًا) هي المستعمَلة — لا تعريفَ ثانيًا */
/* مع القطار (V17.97) تصل الهاتفَ نسخٌ عدّةٌ دفعةً واحدة: تُعرَض سطورُ كلِّ نسخةٍ
   بين ما رآه الجهازُ وما وصله — الأحدثُ أوّلًا — لا آخرُها وحدَها. ونسخةُ
   بنيةٍ بلا سطورٍ لا تُزعج أحدًا (V17.91). */
function releaseNotesSince(seen, cur){
  var a = verNum(seen), b = verNum(cur);
  return RELEASE_NOTES.filter(function(r){ var k = verNum(r.v); return k > a && k <= b && r.notes && r.notes.length; })
    .sort(function(x, y){ return verNum(y.v) - verNum(x.v); });
}
function whatsNewMaybe(){
  var cur = appVer(); if (!cur) return false;
  /* (V28.0) قرارُ المالك: رسالةُ «ما الجديد» للمهندس فما فوق — الوزارةُ والميدانُ لا تُزاحَم بها */
  if (typeof ROLE === 'undefined' || typeof rankOf !== 'function' || rankOf(ROLE) < rankOf('engineer')){ lsSet('nsk14.seenVer', cur); return false; }
  var seen = lsGet('nsk14.seenVer') || '';
  if (!seen){ lsSet('nsk14.seenVer', cur); return false; }     /* أوّلُ تثبيت: لا رسالة */
  if (seen === cur) return false;
  var list = releaseNotesSince(seen, cur);
  /* لا سطورَ أحدثَ مما رآه: يُسجَّل بلا رسالة */
  if (!list.length){ lsSet('nsk14.seenVer', cur); return false; }
  WN = { v:cur, r:list[0], list:list, seen:seen };
  return true;
}
function wnClose(){ if (WN) lsSet('nsk14.seenVer', WN.v); WN = null; render(1); }
function wnHtml(){
  if (!WN) return '';
  return '<div class="pop-wrap" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:94">'
    + '<div class="pop" style="width:min(520px,94vw)">'
    + '<div class="pop-head"><div><h3>\u2728 ' + esc(t('ما الجديد في هذا التحديث')) + ' \u2014 ' + esc(WN.v) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">' + esc(WN.r.d) + ' \u00b7 ' + esc(t('تظهر مرةً واحدةً بعد التحديث')) + '</p></div>'
    +   btn('\u2715','btn-quiet btn-sm',' data-wnx="0" aria-label="' + esc(t('إغلاق')) + '"') + '</div>'
    + '<div class="pop-body">'
    +   (WN.list || [WN.r]).map(function(r, i){
          return (i > 0 || (WN.list || []).length > 1 ? '<div class="hint" style="margin:' + (i ? '10px' : '0') + ' 0 4px;font-weight:700">' + esc(r.v) + ' \u00b7 ' + esc(r.d) + '</div>' : '')
            + '<ul style="margin:0;padding:0 18px 0 0;line-height:1.8">' + r.notes.map(function(x){ return '<li dir="auto">' + esc(x) + '</li>'; }).join('') + '</ul>';
        }).join('')
    +   '<div class="actions" style="margin:12px 0 0">' + btn('\u2713 ' + t('فهمت'),'btn-primary',' data-wnx="1"') + '</div></div></div></div>';
}
function pwOpen(forced){ PW = { forced:!!forced }; render(1); }
function pwNeeded(){
  var me = (STATE.users || {})[myUid()];
  return !!(me && me.mustChange);
}
function pwHtml(){
  if (!PW) return '';
  var f = PW.forced;
  return '<div class="pop-wrap" style="position:fixed;inset:0;display:flex;align-items:center;'
    + 'justify-content:center;background:rgba(0,0,0,.6);z-index:95">'
    + '<div class="pop" style="width:min(440px,94vw)">'
    + '<div class="pop-head"><div><h3>' + esc(t(f ? 'بدّل كلمتَك المؤقتة' : 'تغيير كلمة المرور')) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">' + esc(t(f
        ? 'الكلمةُ التي على الورقة مؤقتةٌ يعرفها من طبعها — اختر كلمتَك أنت ولا تُغلَق هذه النافذةُ حتى تفعل.'
        : 'عشرةُ أحرفٍ فأكثر — ولا يعرفها أحدٌ سواك.')) + '</p></div>'
    +   (f ? '' : btn('\u2715','btn-quiet btn-sm',' data-pwx="0" aria-label="' + esc(t('إغلاق')) + '"')) + '</div>'
    + '<div class="pop-body">'
    +   ((f && !PW.needOld) ? '' : '<div class="field"><label>' + esc(t(f ? 'الكلمةُ المؤقتة (التي على الورقة)' : 'الكلمةُ الحالية')) + '</label>'
                 + '<input id="pw0" type="password" dir="ltr" autocomplete="current-password"></div>')
    +   '<div class="field"><label>' + esc(t('الكلمةُ الجديدة')) + '</label>'
    +     '<input id="pw1" type="password" dir="ltr" autocomplete="new-password" placeholder="' + esc(t('عشرةُ أحرفٍ فأكثر')) + '"></div>'
    +   '<div class="field"><label>' + esc(t('أعِدْها')) + '</label>'
    +     '<input id="pw2" type="password" dir="ltr" autocomplete="new-password"></div>'
    + '</div>'
    + '<div class="pop-foot">' + btn('\u{1F511} ' + t('بدّل الكلمة'),'btn-primary',' data-pwgo="1"') + '</div>'
    + '</div></div>';
}
function pwSave(){
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '') : ''; };
  var p0 = g('pw0'), p1 = g('pw1'), p2 = g('pw2');
  if (p1.length < 10){ toast(t('كلمةُ المرور عشرةُ أحرفٍ فأكثر')); return; }
  if (p1 !== p2){ toast(t('الكلمتان غير متطابقتين')); return; }
  if (!STATE.meta.online){ toast(t('تبديلُ الكلمة يحتاج شبكة')); return; }
  var u = FB.auth && FB.auth.currentUser;
  if (!u){ toast(t('سجّل الدخول أولًا')); return; }
  toast(t('تُبدَّل الكلمة…'));
  var go = function(){
    return u.updatePassword(p1).then(function(){
      var me = (STATE.users || {})[myUid()], now = Date.now();
      /* الحقلان وحدهما يُرفَعان — لا الوثيقةُ كلُّها: كان يُكتَب فوق النسخة
         المحليةِ كائنٌ من حقلين فيضيع الاسمُ والدورُ حتى السحبةِ التالية، والقاعدةُ
         تقبل من صاحب الحساب هذين الحقلين فقط */
      if (me){ me.mustChange = false; me.pwAt = now; }
      CORE.dirty('users', myUid(), { mustChange:false, pwAt:now });
      SESS_PW = p1;
      logEvent('تبديل كلمة المرور — ' + (STATE.meta.name || ''));
      toast(t('بُدِّلت كلمتُك — لا يعرفها أحدٌ سواك'));
      PW = null; render(1);
    });
  };
  var reauth = function(pw){
    var cred = window.firebase.auth.EmailAuthProvider.credential(u.email, pw);
    return u.reauthenticateWithCredential(cred);
  };
  var chain;
  if (PW && PW.forced){
    /* الدخولُ الأوّلُ حديثٌ فتُبدَّل مباشرة. وإن كانت الجلسةُ مستعادةً وطلبت
       المصادقةُ دخولًا حديثًا: تُثبَت بكلمة الجلسة إن عُرفت، وإلا بالمؤقتة المكتوبة،
       وإلا سُئل عنها في النافذة نفسِها — لا «ادخل من جديد» */
    var old9 = p0 || SESS_PW;
    chain = (old9 && PW.needOld ? reauth(old9).then(go) : go()).catch(function(e){
      if (!/requires-recent-login/.test(String(e && e.code || ''))) throw e;
      if (old9) return reauth(old9).then(go);
      PW.needOld = true; render(1);
      throw { code:'need-old' };
    });
  } else {
    /* الهويةُ تُثبَت بالكلمة الحالية قبل التبديل — كما تفعل كلُّ الأنظمة */
    chain = reauth(p0).then(go);
  }
  chain.catch(function(e){
    var m = String(e && e.code || '');
    toast(/wrong-password|invalid-credential/.test(m) ? t('الكلمةُ الحالية غيرُ صحيحة')
        : /weak-password/.test(m) ? t('كلمةُ المرور ضعيفة')
        : /need-old/.test(m) ? t('اكتب كلمتَك المؤقتة أوّلًا لإثبات الهوية — ثم بدّل')
        : /requires-recent-login/.test(m) ? t('ادخل من جديد ثم بدّل الكلمة')
        : t('تعذّر التبديل') + ' — ' + m.slice(0, 40));
  });
}

/* ═══ الحضور: بدأتُ يومي · أنهيتُ يومي ═══
   النظامُ يعرف ما أُنجز ولا يعرف من كان موجودًا. بمئةٍ وخمسين شخصًا في ستة
   مشاعرَ أوّلُ سؤالِ المدير صباحًا: من بدأ؟ ومن لم يبدأ؟ ومن أنهى ومتى؟
     يضغط الفنيُّ بنفسه — لا يسجّل له أحد — ويُلتقَط موقعُه: داخلَ المشاعر
   أم خارجها. ولا يُرفَض الخارجُ: يُسجَّل ويُعلَّم «خارج النطاق» فيراه المشرفُ
   ويسأل — فالرفضُ في الميدان بجهازٍ يخطئ موقعَه عذاب. وثيقةٌ لكلِّ شخصٍ في
   كلِّ يوم، يكتبها صاحبُها وحدَه ويقرؤها من فوقه. */
var ATT_IN  = { s:21.2, n:21.6, w:39.7, e:40.2 };   /* نطاقُ المشاعر */
function attKey(uid, day){ return uid + '_' + day; }
function attToday(){ return (STATE.att || {})[attKey(myUid(), dayKey(Date.now()))] || null; }
function attInZone(lat, lng){
  return lat > ATT_IN.s && lat < ATT_IN.n && lng > ATT_IN.w && lng < ATT_IN.e;
}
function attLocate(){
  return new Promise(function(res){
    if (!navigator.geolocation){ res(null); return; }
    var done = false, stop = setTimeout(function(){ if (!done){ done = true; res(null); } }, 12000);
    navigator.geolocation.getCurrentPosition(function(p){
      if (done) return; done = true; clearTimeout(stop);
      res({ lat:+p.coords.latitude.toFixed(6), lng:+p.coords.longitude.toFixed(6), acc:Math.round(p.coords.accuracy || 0) });
    }, function(){ if (!done){ done = true; clearTimeout(stop); res(null); } },
    { enableHighAccuracy:true, timeout:11000, maximumAge:60000 });
  });
}
function attMark(kind){
  if (!myUid()){ toast(t('سجّل الدخول أولًا')); return; }
  if (!isFieldRole(ROLE)){ toast(t('الحضورُ للميدان')); return; }
  var day = dayKey(Date.now()), k = attKey(myUid(), day);
  STATE.att = STATE.att || {};
  var r = STATE.att[k] || { id:k, uid:myUid(), name:STATE.meta.name || '', day:day, role:ROLE };
  if (kind === 'in'  && r.in){  toast(t('بدأتَ يومَك بالفعل') + ' \u00b7 ' + hm(r.in.at)); return; }
  if (kind === 'out' && !r.in){ toast(t('لم تبدأ يومَك بعد')); return; }
  if (kind === 'out' && r.out){ toast(t('أنهيتَ يومَك بالفعل') + ' \u00b7 ' + hm(r.out.at)); return; }
  toast(t('يُلتقَط موقعُك…'));
  return attLocate().then(function(loc){
    var stamp = { at:Date.now(), lat:loc ? loc.lat : null, lng:loc ? loc.lng : null,
                  acc:loc ? loc.acc : null, ok:loc ? attInZone(loc.lat, loc.lng) : null };
    r[kind] = stamp;
    if (kind === 'out' && r.in) r.hours = Math.round((stamp.at - r.in.at) / 360000) / 10;
    STATE.att[k] = r;
    CORE.set('att', k, r);
    logEvent((kind === 'in' ? 'بدأ يومَه' : 'أنهى يومَه') + ' — ' + (STATE.meta.name || '')
      + (loc ? (stamp.ok ? ' · داخل المشاعر' : ' · خارج النطاق') : ' · بلا موقع'));
    toast((kind === 'in' ? t('بدأ يومُك') : t('أُنهي يومُك') + ' \u00b7 ' + nm(r.hours || 0) + ' ' + t('ساعة'))
      + (loc ? (stamp.ok ? '' : ' \u00b7 ' + t('خارج نطاق المشاعر — يراها مشرفُك')) : ' \u00b7 ' + t('بلا موقع')));
    statBump(); render(1);
  });
}
function hm(ms){ var d = new Date(ms); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
/* بطاقةُ الفنيّ: زرٌّ واحدٌ يقول ما بعده */
function attMyCard(){
  if (!isFieldRole(ROLE)) return '';
  var r = attToday();
  var st = !r || !r.in ? 'none' : (r.out ? 'done' : 'in');
  return card('\u{1F552} ' + t('يومي'),
      (st === 'none' ? '<p class="hint" style="margin:0 0 8px">' + esc(t('لم تبدأ بعد — اضغط حين تصل موقعَ العمل.')) + '</p>'
       : st === 'in' ? '<p style="margin:0 0 8px">' + esc(t('بدأتَ')) + ' <b class="num">' + esc(hm(r.in.at)) + '</b>'
           + (r.in.ok === false ? ' ' + pill('خارج النطاق','wrn') : '') + '</p>'
       : '<p style="margin:0 0 8px">' + esc(t('بدأتَ')) + ' <b class="num">' + esc(hm(r.in.at)) + '</b> \u00b7 '
           + esc(t('أنهيتَ')) + ' <b class="num">' + esc(hm(r.out.at)) + '</b> \u00b7 ' + nm(r.hours || 0) + ' ' + esc(t('ساعة')) + '</p>'),
      st === 'none' ? btn('\u25B6 ' + t('بدأتُ يومي'),'btn-primary btn-sm',' data-attin="1"')
      : st === 'in' ? btn('\u25A0 ' + t('أنهيتُ يومي'),'btn-secondary btn-sm',' data-attout="1"')
      : '');
}
/* بطاقةُ المشرف: من بدأ ومن لم يبدأ — اليوم */
function attTeamCard(){
  if (rankOf(ROLE) < rankOf('supervisor')) return '';
  var day = dayKey(Date.now()), A = STATE.att || {};
  var people = techsList().filter(function(x){ return x.n !== STATE.meta.name; });
  var rows = [], inN = 0, outN = 0, offN = 0, farN = 0;
  people.forEach(function(x){
    var r = A[attKey(x.u, day)];
    if (!r || !r.in){ offN++; rows.push([esc(x.n), pill('لم يبدأ','off'), '\u2014', '\u2014']); return; }
    if (r.in.ok === false) farN++;
    if (r.out){ outN++; rows.push([esc(x.n), pill('أنهى','ok'), '<span class="num">' + esc(hm(r.in.at)) + '</span>', '<span class="num">' + esc(hm(r.out.at)) + ' \u00b7 ' + nm(r.hours || 0) + t('س') + '</span>']); }
    else { inN++; rows.push([esc(x.n) + (r.in.ok === false ? ' ' + pill('خارج النطاق','wrn') : ''), pill('يعمل','acc'), '<span class="num">' + esc(hm(r.in.at)) + '</span>', '\u2014']); }
  });
  rows.sort(function(a, b){ return (a[1].indexOf('لم يبدأ') > -1 ? 1 : 0) - (b[1].indexOf('لم يبدأ') > -1 ? 1 : 0); });
  return cardFlush('\u{1F552} ' + t('الحضورُ اليوم') + ' \u2014 ' + nm(people.length),
      stats([['يعمل', N(inN), 'acc'], ['أنهى', N(outN), 'ok'], ['لم يبدأ', N(offN), offN ? 'wrn' : ''], ['خارج النطاق', N(farN), farN ? 'bad' : '']])
      + (rows.length ? table(['الشخص','الحال','بدأ','أنهى'], capList(rows, 200)) : '')
      + '<p class="hint" style="margin:8px 0 0">' + esc(t('يضغط كلٌّ بنفسه عند الوصول والمغادرة — والموقعُ يُلتقَط. «خارج النطاق» تُسجَّل ولا تُرفَض: اسأل صاحبَها.')) + '</p>');
}

/* ═══ طريقُ اليوم ═══
   كانت المهامُّ قائمةً بترتيب الإسناد — والفنيُّ في منى يمشي بينها كما
   جاءت: من الطرف إلى الطرف ثم يعود. فالفرقُ بين خمس نقاطٍ بترتيب القرب
   وخمسٍ عشوائيةٍ ساعةُ مشيٍ في الحرّ. صار «طريقُ اليوم»: يُلتقَط موقعُه،
   وتُرتَّب مهامُّه المفتوحةُ من الأقرب — ثم كلُّ تاليةٍ أقربُ إلى سابقتها
   (الجارُ الأقرب: يكفي لخمسٍ إلى خمس عشرة نقطةً ولا يحتاج أكثر) — وبجوار
   كلِّ نقطةٍ مسافتُها وزرُّ «اتجاهات» يفتح خرائطَ الجهاز نفسِه: أبل على
   الآيفون، جوجل على غيره. */
var ROUTE_POS = null;
function routeLocate(){
  return attLocate().then(function(loc){ ROUTE_POS = loc; render(1); return loc; });
}
function routeTasks(){
  var me = STATE.meta.name || '', out = [];
  Object.keys(STATE.tasks || {}).forEach(function(k){
    var x = STATE.tasks[k];
    if (x.to !== me || x.status === 'معتمد') return;
    var st = siteFind(x.site);
    if (!st || !st.lat || !st.lng) return;
    out.push({ task:x, site:st });
  });
  return out;
}
function routeOrder(items, from){
  var left = items.slice(), order = [], cur = from;
  while (left.length){
    var bi = 0, bd = Infinity;
    for (var i = 0; i < left.length; i++){
      var d = cur ? distKm(cur, left[i].site) : 0;
      if (d < bd){ bd = d; bi = i; }
    }
    var pick = left.splice(bi, 1)[0];
    pick.d = cur ? bd : null;
    order.push(pick);
    cur = { lat:pick.site.lat, lng:pick.site.lng };
  }
  return order;
}
function kmTxt(k){ return k < 1 ? (nm(Math.round(k * 1000)) + ' ' + t('م')) : (nm(Math.round(k * 10) / 10) + ' ' + t('كم')); }
function mapsUrl(lat, lng, label){
  var ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  return ios
    ? 'https://maps.apple.com/?daddr=' + lat + ',' + lng + '&q=' + encodeURIComponent(label || '')
    : 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '&travelmode=walking';
}
/* ═══ (V29.4) مساعدُ الميدان — اقتراحاتُ تسهيل العمل الميداني التي وافق عليها المالك («يلا بينا») ═══
   ١) الأقربُ إليّ: أقربُ النقاط التي لم تُمسح بعد من موقعي — للمشرف وللفني بلا انتظار إسناد.
   ٢) ملخّصُ اليوم الجاهز: ما سجّلتُه اليوم بنصٍّ يُنسَخ أو يُرسَل للمشرف بضغطة.
   ٣) تجهيزُ اليوم بلا نت: خريطةُ الجهاز وآخرُ البيانات وما ينتظر الرفع — في قائمةٍ واحدةٍ قبل الخروج.
   ٤) «انسخ من آخر زيارتي» في نموذج المسح (المسحُ الأسرع): الحقولُ الثابتةُ من آخر زيارةٍ لنفس النوع، والصورُ والتحدياتُ من الموقع. */
var FH_PREP = 0;
function fhNearest(n){
  var P = (typeof MYPOS === 'object' && MYPOS) || (typeof ROUTE_POS === 'object' && ROUTE_POS) || null; if (!P) return null;
  var out = [];
  (STATE.sites || []).forEach(function(x){ if (!+x.lat || !+x.lng) return; var r = STATE.recs[x.id]; if (r && svDone(r)) return; out.push({ x:x, d:distKm(P, x) }); });
  out.sort(function(a, b){ return a.d - b.d; });
  return out.slice(0, n || 5);
}
function fhToday(){
  var me = STATE.meta.name || '', day = dayKey(), O = { n:0, reach:0, un:0, ch:0, ids:[] };
  Object.keys(STATE.recs || {}).forEach(function(id){
    var r = STATE.recs[id]; if (!r || r.by !== me || dayKey(+r.at || 0) !== day) return;
    O.n++; O.ids.push(id);
    if (r.access && r.access !== 'تم الوصول') O.un++; else O.reach++;
    if (chalKeys(r.chals || []).some(function(k){ return k && k !== 'لا توجد تحديات'; })) O.ch++;
  });
  O.photos = (typeof PHOTO_Q === 'object' && PHOTO_Q) ? PHOTO_Q.length : 0;
  O.queue = (typeof CORE === 'object' && CORE.pending) ? (+CORE.pending() || 0) : 0;
  return O;
}
function fhTodayText(O){
  var L = [t('ملخص يوم') + ' ' + dayKey() + ' \u2014 ' + (STATE.meta.name || ''),
           t('زرتُ') + ' ' + O.n + ' ' + t('نقطة') + ': ' + t('وصلتُ') + ' ' + O.reach + '، ' + t('تعذّر') + ' ' + O.un + '، ' + t('فيها تحديات') + ' ' + O.ch + '.'];
  if (O.ids.length) L.push(t('النقاط') + ': ' + O.ids.slice(0, 20).join('، ') + (O.ids.length > 20 ? ' …' : ''));
  L.push(O.queue || O.photos ? t('بانتظار الرفع') + ': ' + O.queue + ' ' + t('تسجيل') + '، ' + O.photos + ' ' + t('صورة') : t('كلُّ عملي مرفوع'));
  return L.join('\n');
}
function fieldHelperCard(){
  if (!isFieldRole(ROLE)) return '';
  var near = fhNearest(5), O = fhToday(), bm = (typeof BASEMAP === 'object' && BASEMAP) || {};
  var ok = function(b, yes, no){ return '<span class="pill ' + (b ? 'ok' : 'wrn') + '">' + (b ? '\u2713 ' : '') + esc(b ? yes : no) + '</span>'; };   /* النصُّ مترجَمٌ عند الطلب */
  return card('\u{1F9F0} ' + t('مساعد الميدان'),
      '<h4 style="margin:0 0 6px">\u{1F4CD} ' + esc(t('الأقرب إليّ — تحتاج زيارة')) + '</h4>'
    + (near ? (near.length ? table(['النقطة', 'المسافة', ''], near.map(function(o){ return [siteIdHtml(o.x) + '<span class="hint" style="margin:0">' + esc(String(o.x.name || '').slice(0, 30)) + '</span>', '<span class="num">' + esc(kmTxt(o.d)) + '</span>',
          btn('\u25C8 ' + t('على الخريطة'), 'btn-quiet btn-sm', ' data-fly="' + esc(o.x.id) + '"') + ' <a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="' + esc(mapsUrl(o.x.lat, o.x.lng, o.x.id)) + '">\u2197 ' + esc(t('اتجاهات')) + '</a>']; }))
            : '<p class="hint" style="margin:0">' + esc(t('لا نقاطَ تحتاج زيارة')) + '</p>')
         : '<p class="hint" style="margin:0 0 6px">' + esc(t('حدِّد موقعك لتظهر أقربُ النقاط إليك')) + '</p>' + btn('\u{1F4CD} ' + t('حدِّد موقعي'), 'btn-primary btn-sm', ' data-fhpos="1"'))
    + '<h4 style="margin:12px 0 6px">\u{1F4CB} ' + esc(t('ملخّص يومي الجاهز')) + '</h4>'
    + '<pre style="white-space:pre-wrap;margin:0 0 6px;font:inherit;background:var(--surface-2);color:var(--ink);padding:8px;border-radius:8px">' + esc(fhTodayText(O)) + '</pre>'   /* (V30.6) */
    + '<div class="actions" style="margin:0">' + btn(t('نسخ'), 'btn-secondary btn-sm', ' data-fhcopy="1"') + btn('\u{1F4AC} ' + t('واتساب'), 'btn-secondary btn-sm', ' data-fhwa="1"') + '</div>'
    + '<h4 style="margin:12px 0 6px">\u{1F4F4} ' + esc(t('تجهيز اليوم بلا نت')) + '</h4>'
    + '<div class="chips" style="margin:0 0 6px">' + ok(!!bm.have, t('خريطة الجهاز محمّلة'), t(bm.loading ? 'خريطة الجهاز تُنزَّل…' : 'خريطة الجهاز لم تُنزَّل')) + ' '
    + ok(!O.queue, t('لا تسجيلات معلّقة'), nm(O.queue) + ' ' + t('تسجيل بانتظار الرفع')) + ' ' + ok(!O.photos, t('لا صور معلّقة'), nm(O.photos) + ' ' + t('صورة بانتظار الرفع')) + ' '
    + ok(!!near, t('موقعي معروف'), t('موقعي غير محدَّد')) + '</div>'
    + '<div class="actions" style="margin:0">' + btn('\u{1F4E5} ' + t('جهّز يومي'), 'btn-primary btn-sm', ' data-fhprep="1"') + btn('\u{1F504} ' + t('زامن الآن'), 'btn-secondary btn-sm', ' data-pull="1"') + '</div>'
    + (FH_PREP ? '<p class="hint" style="margin:6px 0 0">' + esc(t('بدأ التجهيز')) + ' \u00b7 ' + esc(agoTxt(FH_PREP)) + '</p>' : ''));
}
function routeCard(){
  if (!isFieldRole(ROLE)) return '';
  var items = routeTasks();
  if (!items.length) return '';
  var order = routeOrder(items, ROUTE_POS);
  var total = order.reduce(function(a, o){ return a + (o.d || 0); }, 0);
  return cardFlush('\u{1F9ED} ' + t('طريقُ اليوم') + ' \u2014 ' + nm(order.length),
      (ROUTE_POS
        ? '<p class="hint" style="margin:0 0 8px">' + esc(t('من موقعك — الأقربُ أوّلًا، ثم كلُّ تاليةٍ أقربُ إلى سابقتها')) + ' \u00b7 '
          + esc(t('المجموع')) + ' ' + esc(kmTxt(total)) + '</p>'
        : '<p class="hint" style="margin:0 0 8px">' + esc(t('بترتيب الإسناد — اضغط «من موقعي» ليُرتَّب من الأقرب')) + '</p>')
      + table(['#','النقطة','النوع','المسافة',''],
          order.map(function(o, i){
            var st = o.site, x = o.task;
            return [N(i + 1),
                    '<strong>' + esc(st.id) + '</strong><br><span class="hint" style="margin:0">' + esc((st.name || '').slice(0, 26)) + '</span>',
                    pill(kindLabel(x.kind), 'acc'),
                    o.d != null ? '<span class="num">' + esc(kmTxt(o.d)) + '</span>' : '\u2014',
                    '<a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="' + esc(mapsUrl(st.lat, st.lng, st.id)) + '">\u{1F4CD} ' + esc(t('اتجاهات')) + '</a>'];
          })),
      btn('\u{1F4CD} ' + t('من موقعي'),'btn-primary btn-sm',' data-routego="1"'));
}

/* ═══ واتساب للفنيِّ عند الإسناد ═══
   الإشعارُ داخلَ التطبيق لا يراه من لم يفتحه — فإسنادُ التاسعة يُرى في
   الحادية عشرة. والمتصفّحُ لا يُرسِل واتساب وحده: يفتح المحادثةَ والرسالةَ
   جاهزةً ويبقى الإرسالُ ضغطةً. فبعد كلِّ إسنادٍ زرٌّ واحد: يفتح واتساب
   الفنيِّ برسالةٍ فيها النقاطُ ونوعُ العمل والموعدُ ورابطُ التطبيق —
   وتُسجَّل في «آخر ما تمّ» أنه أُبلغ. وفي سجل الإسنادات زرٌّ لكلِّ إسنادٍ
   مفتوحٍ لمن لم يُبلَغ بعد. */
var WA_LAST = null;   /* آخرُ إسناد: { to, kind, ids, when } */
function techPhone(name){
  var U = STATE.users || {};
  for (var k in U) if (U[k] && U[k].name === name && U[k].ph) return String(U[k].ph);
  var x = techsList(1).filter(function(y){ return y.n === name; })[0];
  return x && x.ph ? String(x.ph) : '';
}
function waAsnText(to, kind, ids, when){
  var L = ids.map(function(id){
    var st = siteFind(id) || {};
    return '\u2022 ' + id + (st.name ? ' \u2014 ' + String(st.name).slice(0, 30) : '') + (st.zone ? ' (' + st.zone + ')' : '');
  });
  return t('السلام عليكم') + ' ' + to + '\n'
    + t('أُسند إليك') + ' ' + nm(ids.length) + ' ' + t('نقطة') + ' \u2014 ' + t(kindLabel(kind))
    + (when ? ' \u00b7 ' + t('الموعد') + ' ' + when : '') + ':\n'
    + L.slice(0, 20).join('\n') + (L.length > 20 ? '\n\u2026 ' + t('والباقي في التطبيق') : '') + '\n\n'
    + t('افتح «مهامي» في التطبيق واضغط «من موقعي» لترتيب الطريق') + ':\n'
    + 'https://mhmdsfwt371.github.io/Project-survey/\n'
    + '\u2014 ' + (STATE.meta.name || '');
}
function waAsn(to, kind, ids, when){
  if (!to || !ids || !ids.length){ toast(t('لا إسنادَ يُبلَّغ')); return false; }
  var ph = techPhone(to);
  if (!ph){ toast(t('لا جوالَ محفوظٌ لهذا الشخص — أضفه في الحسابات أوّلًا')); return false; }
  var txt = waAsnText(to, kind, ids, when);
  try { window.open(waLink(ph, txt), '_blank', 'noopener'); }
  catch (e){ toast(t('تعذّر الفتح')); return false; }
  ids.forEach(function(id){
    var tk = taskKindOf(id, kind);
    if (tk){ tk.waAt = Date.now(); CORE.set('tasks', tk.id, tk); }
  });
  logEvent('إبلاغ واتساب — ' + to + ' \u00b7 ' + nm(ids.length) + ' ' + t(kindLabel(kind)));
  toast(t('فُتح واتساب') + ' ' + to + ' \u2014 ' + t('اضغط إرسال'));
  statBump();
  return true;
}
/* بطاقةٌ بعد الإسناد: أبلغه الآن */
function waAsnCard(){
  if (!WA_LAST || !WA_LAST.ids.length) return '';
  var w2 = WA_LAST, ph = techPhone(w2.to);
  return card('\u{1F4F1} ' + t('أبلغ') + ' ' + esc(w2.to),
      '<p class="hint" style="margin:0 0 8px">' + nm(w2.ids.length) + ' ' + esc(t('نقطة')) + ' \u2014 ' + esc(t(kindLabel(w2.kind)))
      + (ph ? '' : ' \u00b7 ' + pill('لا جوالَ محفوظ','off')) + '</p>',
      btn('\u{1F4F1} ' + t('واتساب'),'btn-primary btn-sm',' data-waasn="1"')
      + btn('\u2715','btn-quiet btn-sm',' data-waasnx="0"'));
}
function inboxItems(){
  var out = [], S = siteStats();
  var solWait = 0, qaWait = 0, ncrOpen = 0, chgWait = 0, handReadyN = 0, lateN = 0, tkWait = 0;
  Object.keys(STATE.inss).forEach(function(k){
    var r = STATE.inss[k];
    if (r && r.solution && r.solution.status === 'مقترح') solWait++;
    if (r && r.status === 'مُركّب' && !r.approved) qaWait++;
  });
  STATE.sites.forEach(function(x){ if (typeof handReady === 'function' && handReady(x)) handReadyN++; });
  if (typeof NCRS !== 'undefined') ncrOpen = NCRS.filter(function(x){ return x.st !== 'مغلق' && x.st !== 'ملغى'; }).length;
  if (typeof CHANGES !== 'undefined') chgWait = CHANGES.filter(function(x){ return x.st === 'مقدَّم'; }).length;
  var today = dayKey(Date.now());
  Object.keys(STATE.tasks).forEach(function(k){
    var x = STATE.tasks[k]; if (!x || x.status === 'معتمد') return;
    if (x.when && x.when < today && !svVisited(STATE.recs[x.site])) lateN++;   /* (V32.6) زيارةٌ تمّت بأيِّ نتيجة ليست متأخرة */
    if (x.kind === 'visit' && svReview(STATE.recs[x.site]) === 'pending') tkWait++;
  });
  out.push(['زياراتٌ تنتظر اعتمادك', S.pending, 'svappr', S.pending ? 'wrn' : 'ok']);
  out.push(['حلولٌ مقترحةٌ تنتظر اعتمادك', solWait, 'solution', solWait ? 'wrn' : 'ok']);
  out.push(['تركيباتٌ تنتظر التدقيق', qaWait, 'qa', qaWait ? 'wrn' : 'ok']);
  out.push(['نقاطٌ جاهزةٌ للتسليم', handReadyN, 'hand', handReadyN ? 'acc' : 'ok']);
  out.push(['بلاغاتُ عدمِ مطابقةٍ مفتوحة', ncrOpen, 'ncr', ncrOpen ? 'bad' : 'ok']);
  out.push(['طلباتُ تغييرٍ معلّقة', chgWait, 'chg', chgWait ? 'wrn' : 'ok']);
  out.push(['مهامُّ تجاوزت موعدَها', lateN, 'req', lateN ? 'bad' : 'ok']);
  out.push(['زياراتٌ مردودةٌ لم تُعَد', S.revisit, 'mywork', S.revisit ? 'wrn' : 'ok']);
  return out;
}
function inboxCard(){
  var L = inboxItems(), total = L.reduce(function(a, x){ return a + x[1]; }, 0);
  return card('\u{1F3AF} ' + t('قراراتُك اليوم') + ' — ' + nm(total),
      '<div class="list">' + L.map(function(x){
        return '<div class="list-item"><div class="li-main"><div class="li-t">' + esc(t(x[0])) + '</div></div>'
          + '<div class="li-end"><b class="num" style="margin-inline-end:8px">' + nm(x[1]) + '</b>'
          + (x[1] && seesPage(PARENT[x[2]] || x[2]) ? btn('\u{1F4CD}','btn-quiet btn-sm',' data-p="' + esc(x[2]) + '"') : '')
          + '</div></div>';
      }).join('') + '</div>'
      + '<p class="hint" style="margin:8px 0 0">' + esc(t(total ? 'كلُّ رقمٍ هنا قرارٌ ينتظرك — ويختفي حين تتّخذه.' : 'الطاولةُ نظيفة — لا قرارَ ينتظرك الآن.')) + '</p>');
}