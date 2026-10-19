/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-05-alerts-dashboard.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Alert rules configured from Settings, card popups from the ministry page, and the readable dashboard.
   DEFINES : ageDays, alRuleDays, alRuleList, alAll, alCard, svListSites, svListRows, mfuWtRow, svListCount, svObKey, svListRows0, svListHead, svListTitle, svListPop … (+26 more)
   GLOBALS : AL_RULES, SV_PHO, SV_SHOW, SV_VIEW, SV_ZF, SV_ZONE_COLORS, SV_ST, SV_WHY, SV_WHY_ORDER, SV_STACK … (+2 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

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
  pilot: { title:'التجارب والديمو — النقاط وحالتها', head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'التجربة', 'التركيب', 'التجهيزة', 'الاتصال', 'آخر إشارة', 'قارئ البطاقات', 'التحقق', 'موقعه في نظام البطاقات', 'آخر قراءة للقارئ', 'الإشغال'],   /* (V37.80) */
           rows:function(){ return pilotRowsList(); } },
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
  var rowsAll = svListRows(SV_POP), head = svListHead(SV_POP), dcz = svDashCols(head);
  var zonesAll = []; if (dcz.zone > -1){ var zm = {}; rowsAll.forEach(function(r){ zm[String(r[dcz.zone] || '')] = 1; }); zonesAll = Object.keys(zm).filter(Boolean); }
  var rows = svPopFilter(rowsAll, head);   /* (V37.45 المشعر · V37.58 والمربعُ المضغوط) — المرشّحُ نفسُه في الإكسل */
  var shown = rows.slice(0, SV_SHOW);   /* (V37.27 المرحلةُ ٢) دفعاتٌ من ٨٠ — كانت ٣٠٠ صفٍّ دفعةً واحدة */
  var dc0 = svDashCols(head), canDash = dc0.zone > -1 || dc0.type > -1 || dc0.comp > -1;   /* (V37.41) طلبُ المالك: كلُّ نوافذ متابعة الوزارة لوحة */
  var asDash = canDash && SV_VIEW !== 'list';
  var PCN = {}, PP = STATE.photos || {}; Object.keys(PP).forEach(function(k){ var x = PP[k]; if (x && !x.del && x.site) PCN[x.site] = (PCN[x.site] || 0) + 1; });   /* (V37.14) فهرسٌ مرةً للنافذة */
  return '<div class="svpop-veil" data-svpopclose="1" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000"></div>'
    + '<div class="svpop" role="dialog" aria-modal="true" data-keepscroll="svpop:' + esc(SV_POP) + '" style="position:fixed;z-index:2001;inset:6vh 4vw auto 4vw;max-height:86vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.35)">'   /* (V30.6) ألوانُ التطبيق لا بياضٌ ثابت */
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0">' + (SV_SUB ? svSubTitle(rows) : esc(svListTitle(SV_POP)) + ' \u2014 ' + nm(rows.length)) + (SV_ZF && !SV_SUB ? ' <small class="hint" style="margin:0">' + [SV_ZF ? esc(t(SV_ZF)) : '', SV_SUB ? esc(t(svSubLabel())) : ''].filter(Boolean).join(' \u00b7 ') + ' \u00b7 ' + nm(rowsAll.length) + ' ' + esc(t('في الكل')) + '</small>' : '') + '</h3>'
    + '<div class="actions" style="margin:0">' + btn('\u2B07 ' + t('تصدير إكسل — التفاصيل'), 'btn-primary btn-sm', ' data-svpopxls="' + esc(SV_POP) + '"')
      + (canDash ? btn(asDash ? '\u2630 ' + t('القائمة') : '\u{1F4CA} ' + t('اللوحة'), 'btn-quiet btn-sm', ' data-svview="' + (asDash ? 'list' : 'dash') + '"') : '')
      + (canDash && asDash ? btn('\u{1F5A8} ' + t('طباعة اللوحة'), 'btn-quiet btn-sm', ' data-svprint="1"') : '')   /* (V37.45) */
      + btn('\u2715 ' + t('إغلاق'), 'btn-quiet btn-sm', ' data-svpopclose="1"') + '</div></div>'
    + (SV_STACK.length ? '<div class="actions" style="margin:8px 0 0">' + btn('\u2192 ' + t('رجوع'), 'btn-secondary', ' data-svback="1" title="' + esc(t('للشاشة السابقة')) + '"') + '</div>' : '')   /* (V37.59) رجوعٌ حقيقيٌّ للشاشة السابقة */
    + (zonesAll.length > 1 ? '<div class="chips" style="margin:8px 0 0">' + [['', 'كل المشاعر']].concat(zonesAll.map(function(z){ return [z, z]; })).map(function(z){ return '<button type="button" class="chip' + (SV_ZF === z[0] ? ' on' : '') + '" data-svzf="' + esc(z[0]) + '">' + esc(t(z[1])) + '</button>'; }).join('') + '</div>' : '')
    + (SV_POP === 'nophoto' ? '<p class="hint" style="margin:6px 0">' + esc(t('وجِّه الشبابَ لهذه النقاط لإضافة الصور من «تعديل المسح» — «التُقطت ولم تُرفع» تعني أن الصور على جهاز صاحب الزيارة: يفتح التطبيقَ على الشبكة.')) + '</p>' : '')
    /* (V37.6) طلبُ المالك: «عاوز هنا الصور — أقدر أفتح صور المخيم ده في كل التحديات وأسباب عدم المسح». عمودُ «الصور» في النافذة وحدَها (لا في الإكسل) */
    + (asDash && rows.length ? svDashHtml(SV_POP, rows, head) : '')
    + (!asDash && rows.length ? table(head.map(function(h){ return h; }).concat([t('الصور')]), shown.map(function(r){ var sx = siteFind(r[0]), pn = PCN[r[0]] || ((STATE.recs[r[0]] || {}).photos || []).length;   /* (V37.7 → V37.14: من الفهرس) */
        return [ sx ? siteIdHtml(sx) : '<span class="num">' + esc(r[0]) + '</span>' ].concat(r.slice(1).map(function(c){ return esc(c || '\u2014'); }))
          .concat([pn ? '<button type="button" class="btn btn-secondary btn-sm" data-svphotos="' + esc(r[0]) + '">\u{1F4F7} ' + nm(pn) + '</button>' : '<span class="hint" style="margin:0">' + esc(t('لا صور')) + '</span>']); }))
                   + (rows.length > shown.length ? '<div class="actions" style="justify-content:center;margin:10px 0">' + btn('\u2193 ' + t('عرض المزيد') + ' (' + nm(Math.min(80, rows.length - shown.length)) + ' ' + t('من') + ' ' + nm(rows.length - shown.length) + ')', 'btn-secondary btn-sm', ' data-svmore="1"') + '</div><p class="hint" style="text-align:center">' + esc(t('والكلُّ في ملف الإكسل')) + '</p>' : '')   /* (V37.27) */
                   : (asDash ? '' : '<p class="hint">' + esc(t('لا نقاط')) + '</p>'))   /* (V37.58) كانت تظهر تحت اللوحة */
    + '</div>'
    + (SV_PHO ? svPhoPanel(SV_PHO) : '');
}
var SV_PHO = '';   /* (V37.6) النقطةُ المفتوحةُ صورُها فوق القائمة */
var SV_SHOW = 80;   /* (V37.27) صفوفُ القائمة المعروضة — تزيد بزرّ «عرض المزيد» */
/* ═══ (V37.16) طلبُ المالك: «البوب أب اللي بتتفتح من صفحة الوزارة لكلِّ كارت (الزيارة والمسح والتركيب والتسليم والفك) — مش عاوزها
   ليست، عاوزها داشبورد توضّح البيانات، ولما أحتاج تفاصيل أعمل إكسل». اللوحةُ تُبنى من صفوف القائمة نفسِها فلا يختلف رقم. ═══ */
var SV_VIEW = 'dash';
function svDashCols(head){   /* (V37.41) الأعمدةُ بأسمائها لا بمواضعها — فتعمل اللوحةُ على كلِّ قائمةٍ في صفحة الوزارة */
  var H = (head || []).map(function(h){ return String(h || ''); }), f = function(rx){ for (var i = 0; i < H.length; i++) if (rx.test(H[i])) return i; return -1; };
  var st = H.length - 1; if (/^الصور$|^التركيب$/.test(H[st] || '')) st = -1;
  var sn = st > -1 ? H[st] : ''; if (/^الحالة/.test(sn)) sn = 'الحالة والتحديات';   /* عنوانٌ قصيرٌ لا رأسُ العمود الطويل */
  return { zone:f(/المشعر/), type:f(/^النوع/), comp:f(/الشركة/), date:f(/آخر زيارة|التاريخ|تاريخ|آخر/), by:f(/بواسطة|المنفّذ|المنفذ|الفني|الفريق/), state:st, stateName:sn };
}
/* ═══ (V37.45) لوحةُ الوزارة المعتمدة — تجيب عن أسئلة الاجتماع لا تعرض عددًا فقط ═══
   خلاصةٌ مكتوبةٌ تُولَّد من الأرقام، ومقارنةُ الأسبوع بالذي قبله، وعمرُ أقدم بندٍ مفتوح، والنسبةُ من نقاط المشعر نفسه،
   وأين هي على الخريطة، والتراكمُ في ٣٠ يومًا، وتصفيةٌ بالمشعر داخل النافذة، وطباعةٌ، وسطرُ المصدر. كلُّه من الوثائق على الجهاز. */
var SV_ZF = '';   /* تصفيةُ المشعر داخل النافذة */
var SV_ZONE_COLORS = { 'منى':'#2E86DE', 'عرفات':'#27AE60', 'المزدلفة':'#8E44AD', 'مزدلفة':'#8E44AD', 'كاميرات المتابعة':'#E67E22', 'مراكز التفويج':'#C0392B', 'الجمرات':'#D4AC0D' };
function svZoneColor(z){ return SV_ZONE_COLORS[z] || '#E74C3C'; }
function svBaseOf(key){   /* قاعدةُ النسبة: قوائمُ الزيارة والمتبقي من كلِّ النقاط، وما سواها من المزار */
  var all = STATE.sites || []; if (/^(sv|rem)$/.test(key)) return { n:all.length, name:'كلِّ النقاط', zones:svZoneTot(all) };
  var vis = all.filter(function(x){ return svVisited(STATE.recs[x.id]); }); return { n:vis.length, name:'المزار', zones:svZoneTot(vis) };
}
function svZoneTot(L){ var m = {}; L.forEach(function(x){ m[x.zone] = (m[x.zone] || 0) + 1; }); return m; }
function svMiniMap(rows){
  var all = (STATE.sites || []).filter(function(x){ return x.lat && x.lng; }); if (all.length < 10) return '';
  var ids = {}; rows.forEach(function(r){ ids[r[0]] = 1; });
  var la0 = Infinity, la1 = -Infinity, lg0 = Infinity, lg1 = -Infinity;
  all.forEach(function(x){ if (x.lat < la0) la0 = x.lat; if (x.lat > la1) la1 = x.lat; if (x.lng < lg0) lg0 = x.lng; if (x.lng > lg1) lg1 = x.lng; });
  if (la1 - la0 < 1e-6 || lg1 - lg0 < 1e-6) return '';
  var W = 560, H = 300, X = function(x){ return (10 + (x.lng - lg0) / (lg1 - lg0) * (W - 20)).toFixed(1); }, Y = function(x){ return (10 + (la1 - x.lat) / (la1 - la0) * (H - 20)).toFixed(1); };
  /* مسارٌ واحدٌ لكلِّ لونٍ لا دائرةٌ لكلِّ نقطة: ١٬٨٠٧ عنصرٍ كانت تكلّف الرسمَ نصفَ ثانية */
  var bgK = all.length + ':' + la0 + ':' + lg1; if (svMiniMap.bgK !== bgK){ var bgP = ''; all.forEach(function(x){ bgP += 'M' + X(x) + ' ' + Y(x) + 'h.01'; }); svMiniMap.bg = bgP; svMiniMap.bgK = bgK; }
  var fgZ = {}, zs = {}; all.forEach(function(x){ if (ids[x.id]){ zs[x.zone] = 1; fgZ[x.zone] = (fgZ[x.zone] || '') + 'M' + X(x) + ' ' + Y(x) + 'h.01'; } });
  var fg = Object.keys(fgZ).map(function(z){ return '<path d="' + fgZ[z] + '" stroke="' + svZoneColor(z) + '" stroke-width="6" stroke-linecap="round" fill="none" opacity=".9"/>'; }).join('');
  return '<div class="card" style="margin:0"><div class="pid">' + esc(t('أين هي على الخريطة')) + '</div><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;border-radius:10px;background:var(--surface-2);color:var(--ink)"><path d="' + svMiniMap.bg + '" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" opacity=".18"/>' + fg + '</svg>'
    + '<div class="hint" style="margin:6px 0 0;display:flex;gap:10px;flex-wrap:wrap">' + Object.keys(zs).map(function(z){ return '<span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + svZoneColor(z) + '"></i> ' + esc(t(z)) + '</span>'; }).join('') + '<span>\u25CF ' + esc(t('الباهت: باقي النقاط')) + '</span></div></div>';
}
/* (V37.56) svInsight (جملةُ الخلاصة الطويلة) حُذفت بقرار المالك — اللوحةُ تُقرأ بالنظر */
function svDashHtml(key, rows, head){
  var ck = key + '|' + rows.length + '|' + (typeof STAT_VER !== 'undefined' ? STAT_VER : 0) + '|' + (typeof SV_ZF !== 'undefined' ? SV_ZF : '') + '|' + (typeof SV_SUB !== 'undefined' ? SV_SUB : '') + '|' + LANG;   /* (V37.45) تُحفَظ اللوحةُ: الفتحُ الثاني فوريّ */
  if (svDashHtml.ck === ck && svDashHtml.html) return svDashHtml.html;
  var html = svDashHtml0(key, rows, head); svDashHtml.ck = ck; svDashHtml.html = html; return html;
}
/* ═══ (V37.56) لوحةٌ تُقرأ بالنظر — قرارُ المالك: «عاوزها user friendly أوي، أي حد يبص يفهم من غير كلام» ═══
   لونٌ + أيقونةٌ + رقمٌ + كلمةٌ واحدة: حلقةٌ كبيرةٌ بالنسبة، وشريطُ إشارةٍ واحدٌ لحال النقاط (أخضر جاهزة · برتقالي شغلٌ علينا · أحمر يحتاج طرفًا آخر · رمادي لسه)،
   و«ليه مش جاهزة؟» مربعاتٌ بأيقونة، والمشاعرُ حلقاتٌ صغيرةٌ تُضغط، والأسبوعُ جملةٌ عادية، ثم الخريطةُ وزرُّ الإكسل. لا وسيطَ ولا «أقدم بند» ولا أسماءَ فئاتٍ بسطرين. */
var SV_ST = [   /* حالُ النقطة — الألوانُ نفسُها في كلِّ اللوحات */
  { k:'ins', c:'#3AD6A0', e:'\u{1F527}', n:'مُركّبة' },   /* (V37.64) لونُ الخريطة LIFE.installed */
  { k:'sched', c:'#7C5CFF', e:'\u{1F4C5}', n:'مجدولة للتركيب' },   /* (V37.62) */
  { k:'ready', c:'#22C55E', e:'\u2705', n:'جاهزة للتركيب' },
  { k:'prep', c:'#F59E0B', e:'\u{1F6E0}', n:'تحتاج تجهيز' },
  { k:'coord', c:'#EF4444', e:'\u26A0\uFE0F', n:'تحتاج تنسيق' },
  { k:'again', c:'#8D6E63', e:'\u{1F501}', n:'تحتاج زيارة أخرى' },   /* (V37.64) اسمُ الخريطة ولونُها LIFE.stuck */
  { k:'todo', c:'#9FB0AA', e:'\u23F3', n:'لم تُزر' }   /* (V37.64) اسمُ الخريطة ولونُها LIFE.todo */
];
var SV_WHY = [   /* «ليه مش جاهزة؟» — كلمةٌ واحدةٌ وأيقونة */
  { ks:['mount'], e:'\u{1F3D7}', n:'يحتاج هيكل' }, { ks:['entry', 'multi'], e:'\u{1F6AA}', n:'المدخل' }, { ks:['beam', 'wide'], e:'\u{1F4CF}', n:'العارضة' },
  { ks:['block', 'legacy'], e:'\u{1F6A7}', n:'عائق' }, { ks:['height'], e:'\u2B06\uFE0F', n:'ارتفاع' }, { ks:['review'], e:'\u2753', n:'قيد المراجعة' }
];
/* (V37.59) بلاغُ المالك: «الداتا دخلت في بعضها» — النقطةُ ذاتُ التحديين كانت تُعَدّ في مربعين، و«هيكل + عائق» تذهب أحمرَ فيختلف «يحتاج هيكل» بين شاشتين.
   الآن لكلِّ نقطةٍ سببٌ رئيسٌ واحدٌ بالأولوية (عائق ← هيكل ← المدخل ← العارضة ← ارتفاع ← قيد المراجعة)، واللونُ منه: العائقُ أحمر وما سواه برتقالي. */
var SV_WHY_ORDER = [3, 0, 1, 2, 4, 5];
function svPrimWhy(rec){
  if (!rec || !svDone(rec)) return -1; var cc = chalCats(rec); if (!cc.length) return -1;
  for (var q = 0; q < SV_WHY_ORDER.length; q++){ var w = SV_WHY[SV_WHY_ORDER[q]]; if (w.ks.some(function(k){ return cc.indexOf(k) > -1; })) return SV_WHY_ORDER[q]; }
  return 5;
}
function svStOf(id){
  if (typeof insDone === 'function' && insDone(id)) return 'ins';
  if (typeof taskKindOf === 'function' && taskKindOf(id, 'install')) return 'sched';   /* (V37.62) */
  var r = STATE.recs[id]; if (!r || !svVisited(r)) return 'todo'; if (!svDone(r)) return 'again';
  var pw = svPrimWhy(r); if (pw < 0) return 'ready'; return pw === 3 ? 'coord' : 'prep';
}
function svRing(p, size, color, label){
  var deg = Math.max(0, Math.min(100, p)), inner = Math.round(size * 0.76);
  return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:conic-gradient(' + color + ' 0 ' + deg + '%,var(--line) 0);display:flex;align-items:center;justify-content:center;flex:0 0 auto">'
    + '<i style="width:' + inner + 'px;height:' + inner + 'px;border-radius:50%;background:var(--surface,#141B2A);display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:800;font-size:' + Math.round(size / 4.6) + 'px">' + label + '</i></div>';
}
function svPopRefresh(){   /* (V37.60) نسخةٌ واحدةٌ لإعادة رسم النافذة في مكانها (المشعر، المربع، الرجوع) */
  SV_SHOW = 80; var host = document.getElementById('content'); if (!host){ render(1); return; }
  svPopRemove(); var tmp = document.createElement('div'); tmp.innerHTML = svListPop() + supPopHtml(); while (tmp.firstChild) host.appendChild(tmp.firstChild);
  var pp = document.querySelector('.svpop'); if (pp) pp.scrollTop = 0;
}
var SV_STACK = [];   /* (V37.59) الشاشاتُ السابقةُ داخل النافذة — للرجوع */
var SV_SUB = '';   /* (V37.58) المربعُ المضغوطُ داخل النافذة: «st:ready» أو «why:0» */
function svSubPass(id){
  if (!SV_SUB) return true; var p = SV_SUB.split(':');
  if (p[0] === 'st') return svStOf(id) === p[1];
  if (p[0] === 'why') return svStOf(id) !== 'ins' && svPrimWhy(STATE.recs[id]) === +p[1];   /* (V37.59) بالسبب الرئيس — كلُّ نقطةٍ في مربعٍ واحد */
  var x = siteFind(id);   /* (V37.62) مرشّحاتُ التبويبات الخمسة */
  if (p[0] === 'type') return !!x && taxOf(x).t === p[1];
  if (p[0] === 'neww') return mtGrpOf(id) === p[1] && mtNewWeek(id);   /* (V37.65) */
  if (p[0] === 'life') return !!x && lifeOf(x) === p[1];
  if (p[0] === 'co') return !!x && x.co === SV_SUB.slice(3);
  if (p[0] === 'cob'){ if (!x || x.type !== 'مخيم' || !x.co) return false; var cb = mtCoStats().filter(function(o){ return o.co === x.co; })[0]; return !!cb && cb.b === p[1]; }
  if (p[0] === 'grp') return p[1] === 'all' ? /^(prep|coord)$/.test(svStOf(id)) : mtGrpOf(id) === p[1];
  if (p[0] === 'day'){ var dk = p[1], kd = p[2] || ''; return (STATE.steps || []).some(function(st){ return mtStepSite(st) === id && dayKey(+st.at || 0) === dk && (!kd || st.kind === kd); }); }
  return true;
}
function svSubLabel(){ if (!SV_SUB) return ''; var p = SV_SUB.split(':');
  if (p[0] === 'st'){ var o = SV_ST.filter(function(x){ return x.k === p[1]; })[0]; return o ? o.n : ''; }
  if (p[0] === 'neww') return 'تحتاج تنسيق مع الجهة المالكة — جديدة هذا الأسبوع';
  if (p[0] === 'life') return p[1] === 'minwait' ? 'جاهزة لاعتماد الوزارة' : ((LIFE[p[1]] || {}).n || p[1]);
  if (p[0] === 'type') return (TAX_DEF[p[1]] || { l:p[1] }).l; if (p[0] === 'co') return SV_SUB.slice(3);
  if (p[0] === 'cob'){ var b = MT_COB.filter(function(x){ return x.k === p[1]; })[0]; return b ? t('شركات') + ' — ' + t(b.n) : ''; }
  if (p[0] === 'grp'){ if (p[1] === 'all') return t('عليها تحدي'); var g = MT_GRP.filter(function(x){ return x.k === p[1]; })[0]; return g ? g.n : ''; }
  if (p[0] === 'day'){ var dd = new Date(p[1] + 'T12:00:00'), WDN = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']; return t(WDN[dd.getDay()]) + ' ' + nm(dd.getDate()) + '/' + nm(dd.getMonth() + 1) + (p[2] ? ' \u00b7 ' + t(({ visit:'زيارة', ins:'تركيب', dis:'فك' })[p[2]] || p[2]) : ''); }   /* (V37.62) اليومُ باسمه وتاريخه بالعربية */
  var w = SV_WHY[+p[1]]; return w ? w.n : ''; }
/* (V37.63) طلبُ المالك: النافذةُ تقول ما فتحتَه — «مخيمات الشركات الجاهزة — ٦٨ مخيم في ٢٤ شركة» لا «تمت الزيارة — ٦٨» */
var SV_COB_T = { ready:'مخيمات الشركات الجاهزة', prep:'مخيمات الشركات اللي فيها تجهيز', coord:'مخيمات الشركات المحتاجة تنسيق', todo:'مخيمات الشركات اللي لسه' };
function svSubUnit(){ return /^(co|cob):/.test(SV_SUB) ? 'مخيم' : 'نقطة'; }
function svSubTitle(rows){
  var p = SV_SUB.split(':'), n = rows.length, lab = svSubLabel(), extra = '';
  if (p[0] === 'cob'){ lab = SV_COB_T[p[1]] || lab; var nc = mtCoStats().filter(function(o){ return o.b === p[1]; }).length; extra = ' ' + esc(t('في')) + ' ' + nm(nc) + ' ' + esc(t('شركة')); }
  if (p[0] === 'co') lab = t('مخيمات') + ' ' + SV_SUB.slice(3);
  if (p[0] === 'day') lab = t('شغل') + ' ' + lab;
  return esc(t(lab)) + ' \u2014 ' + nm(n) + ' ' + esc(t(svSubUnit())) + extra + (SV_ZF ? ' <small class="hint" style="margin:0">' + esc(t(SV_ZF)) + '</small>' : '');
}
function svPopFilter(rowsAll, head){
  var dcz = svDashCols(head);
  return rowsAll.filter(function(r){ return (!SV_ZF || dcz.zone < 0 || String(r[dcz.zone] || '') === SV_ZF) && svSubPass(r[0]); });
}
function svDashHtml0(key, rows, head){
  var C = svDashCols(head || svListHead(key)), n = rows.length, base = svBaseOf(key), sub = !!SV_SUB;
  var tile = 'background:var(--surface-2);border-radius:14px;padding:12px';
  var stc = {}, wc = {}, multi = 0;
  rows.forEach(function(r){ var k = svStOf(r[0]); stc[k] = (stc[k] || 0) + 1;
    if (k === 'prep' || k === 'coord'){ var rec = STATE.recs[r[0]], pw = svPrimWhy(rec); if (pw > -1 && pw !== 3){ wc[pw] = (wc[pw] || 0) + 1; var cc = chalCats(rec), kinds = SV_WHY.filter(function(w){ return w.ks.some(function(x){ return cc.indexOf(x) > -1; }); }).length; if (kinds > 1) multi++; } } });
  /* ١ · العنوان: في اللوحة الأمّ حلقةٌ بالنسبة، وداخلَ مربعٍ جملةٌ واحدةٌ بلا حلقةٍ ولا نسبة */
  var prog = /^(sv|srv|insd|hand|disd)$/.test(key), pct = Math.round(n / Math.max(1, base.n) * 100);
  var ringC = prog ? (pct >= 90 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444') : 'var(--acc,#2E86DE)';
  var hero = sub
    ? '<div style="' + tile + ';margin:10px 0;display:flex;align-items:center;gap:12px"><span style="font-size:30px">' + ((SV_ST.filter(function(o){ return 'st:' + o.k === SV_SUB; })[0] || {}).e || (SV_WHY[+String(SV_SUB).split(':')[1]] || {}).e || '\u25CF') + '</span><div><div class="num" style="font-size:30px;font-weight:800;line-height:1.1">' + nm(n) + '</div><div style="font-size:15px">' + esc(t(svSubUnit())) + ' \u2014 ' + esc(t(/^cob:/.test(SV_SUB) ? (SV_COB_T[SV_SUB.slice(4)] || svSubLabel()) : /^co:/.test(SV_SUB) ? t('مخيمات') + ' ' + SV_SUB.slice(3) : svSubLabel())) + '</div></div></div>'
    : '<div style="display:flex;align-items:center;gap:16px;' + tile + ';margin:10px 0">' + svRing(pct, 108, ringC, nm(pct) + '\u066A') + '<div><div class="num" style="font-size:34px;font-weight:800;line-height:1.1">' + nm(n) + '</div><div class="hint" style="margin:2px 0 0;font-size:14px">' + esc(t('نقطة')) + ' \u00b7 ' + esc(t('من')) + ' ' + nm(base.n) + '</div></div></div>';
  /* ٢ · حالُها الآن: كلُّ نقطةٍ مرةً واحدة — يختفي إن كانت كلُّها لونًا واحدًا */
  var sts = SV_ST.filter(function(o){ return stc[o.k]; });
  var stSec = sts.length > 1 ? '<div class="hint" style="margin:4px 0 6px;font-size:14px">' + esc(t('حالها الآن')) + '</div>'
    + '<div style="display:flex;height:22px;border-radius:12px;overflow:hidden;margin:4px 0 10px">' + sts.map(function(o){ return '<i title="' + esc(t(o.n)) + '" style="display:block;width:' + (stc[o.k] / n * 100).toFixed(2) + '%;background:' + o.c + '"></i>'; }).join('') + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px">' + sts.map(function(o){
        return '<div role="button" tabindex="0" data-svsub="st:' + o.k + '" title="' + esc(t('اضغط للتفاصيل والإكسل')) + '" style="' + tile + ';display:flex;align-items:center;gap:10px;cursor:pointer"><span style="width:14px;height:14px;border-radius:50%;background:' + o.c + ';flex:0 0 auto"></span><div><div class="num" style="font-size:22px;font-weight:800">' + nm(stc[o.k]) + '</div><div style="font-size:13px">' + o.e + ' ' + esc(t(o.n)) + ' \u203A</div>' + (o.k === 'coord' ? '<div class="hint" style="margin:0;font-size:11px">' + esc(t('عائق في الموقع')) + '</div>' : '') + '</div></div>'; }).join('') + '</div>' : '';
  /* ٣ · «تحتاج تجهيز — ليه؟»: بالسبب الرئيس فمجموعُها = البرتقالي بالضبط */
  var why = Object.keys(wc).map(Number).sort(function(a, b){ return wc[b] - wc[a]; }), prepN = why.reduce(function(a, wi){ return a + wc[wi]; }, 0);
  var whySec = why.length && !(sub && /^why:/.test(SV_SUB)) ? '<div class="hint" style="margin:4px 0 6px;font-size:14px">' + esc(t('تحتاج تجهيز — ليه؟')) + ' <span class="num">(' + nm(prepN) + ')</span></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:6px">'
    + why.map(function(wi){ var w = SV_WHY[wi]; return '<div role="button" tabindex="0" data-svsub="why:' + wi + '" title="' + esc(t('اضغط للتفاصيل والإكسل')) + '" style="' + tile + ';text-align:center;padding:10px 6px;cursor:pointer"><div style="font-size:24px">' + w.e + '</div><div class="num" style="font-size:18px;font-weight:800;margin-top:2px">' + nm(wc[wi]) + '</div><div style="font-size:12px">' + esc(t(w.n)) + ' \u203A</div></div>'; }).join('') + '</div>'
    + (multi ? '<p class="hint" style="margin:0 0 12px;font-size:12px">' + esc(t('كلُّ نقطةٍ محسوبةٌ مرةً بأهمِّ تحدٍّ فيها — و')) + nm(multi) + ' ' + esc(t('منها فيها تحدٍّ آخر كمان')) + '</p>' : '<div style="margin-bottom:12px"></div>') : '';
  /* ٤ · المشاعر: حلقاتٌ في اللوحة الأمّ، وأعدادٌ فقط داخلَ المربع */
  var zc = {}; if (C.zone > -1) rows.forEach(function(r){ var z = String(r[C.zone] || ''); if (z) zc[z] = (zc[z] || 0) + 1; });
  var zks = Object.keys(zc).sort(function(a, b){ return zc[b] - zc[a]; });
  var zoneSec = zks.length > 1 && !SV_ZF ? '<div class="hint" style="margin:4px 0 6px;font-size:14px">' + esc(t('المشاعر')) + '</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin-bottom:12px">'
    + zks.map(function(z){ var of = (base.zones || {})[z] || zc[z], zp = Math.round(zc[z] / Math.max(1, of) * 100);
      return '<div role="button" tabindex="0" data-svzf="' + esc(z) + '" style="' + tile + ';text-align:center;cursor:pointer" title="' + esc(t('اضغط لعرض هذا المشعر وحده')) + '">'
        + (sub ? '<div class="num" style="font-size:20px;font-weight:800">' + nm(zc[z]) + '</div>' : '<div style="display:flex;justify-content:center;margin-bottom:6px">' + svRing(zp, 56, prog ? (zp >= 90 ? '#22C55E' : zp >= 50 ? '#F59E0B' : '#EF4444') : 'var(--acc,#2E86DE)', nm(zp) + '\u066A') + '</div>')
        + '<div style="font-size:13px">' + esc(t(z)) + ' \u203A</div>' + (sub ? '' : '<div class="hint num" style="margin:0;font-size:12px">' + nm(zc[z]) + '</div>') + '</div>'; }).join('') + '</div>' : '';
  return hero + stSec + whySec + zoneSec
    + '<button type="button" class="btn btn-primary" data-svpopxls="1" style="display:block;width:100%;margin-top:12px">\u2B07 ' + esc(t('نزّل التفاصيل (إكسل)')) + '</button>';
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
    var body = svListRows(key); if (key === SV_POP && (SV_ZF || SV_SUB) && document.querySelector('.svpop')) body = svPopFilter(body, svListHead(key));   /* (V37.58) الإكسلُ بما تراه في النافذة — المشعرُ والمربعُ المضغوط */
    var pts = body.length && siteFind(body[0][0]);   /* (V35.0) قوائمُ النقاط: عمودٌ أوّلُ بالمعرّف الأوّل */
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
  return '<div class="mfu-kpis">' + kpi('نسبة الزيارة', nm(SV.pct) + '\u066A') + kpi('تمت الزيارة', nm(o.sv), '#27AE60', 'sv') + kpi('المتبقي', nm(o.tot - o.sv), '#B7950B', 'rem') + kpi('فيها تحديات', nm(o.chal), '#C0392B', 'chal') + kpi('تحتاج زيارة أخرى', nm(o.unreach), '#C0392B', 'unreach') + '</div>'
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
