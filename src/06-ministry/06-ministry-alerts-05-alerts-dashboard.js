/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-05-alerts-dashboard.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Alert rules configured from Settings, card popups from the ministry page, and the readable dashboard.
   DEFINES : mfuWtRow, svZoneColor, svMiniMap, svPopRefresh, svListXlsx, mfuFilterRowAll, mfuSurv, mfuSurv0, mfuCos, mfuFilterRow, mfuObs
   GLOBALS : AL_RULES, SV_PHO, SV_SHOW, SV_VIEW, SV_ZF, SV_ZONE_COLORS, SV_ST, SV_WHY, SV_WHY_ORDER, SV_STACK … (+2 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

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

   
      /* (V37.27) صفوفُ القائمة المعروضة — تزيد بزرّ «عرض المزيد» */

   /* تصفيةُ المشعر داخل النافذة */
PV.SV_ZONE_COLORS = { 'منى':'#2E86DE', 'عرفات':'#27AE60', 'المزدلفة':'#8E44AD', 'مزدلفة':'#8E44AD', 'كاميرات المتابعة':'#E67E22', 'مراكز التفويج':'#C0392B', 'الجمرات':'#D4AC0D' };
function svZoneColor(z){ return PV.SV_ZONE_COLORS[z] || '#E74C3C'; }

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

function svPopRefresh(){   /* (V37.60) نسخةٌ واحدةٌ لإعادة رسم النافذة في مكانها (المشعر، المربع، الرجوع) */
  SV_SHOW = 80; var host = document.getElementById('content'); if (!host){ render(1); return; }
  svPopRemove(); var tmp = document.createElement('div'); tmp.innerHTML = svListPop() + supPopHtml(); while (tmp.firstChild) host.appendChild(tmp.firstChild);
  var pp = document.querySelector('.svpop'); if (pp) pp.scrollTop = 0;
}
      

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

   /* (V27.2) تصنيفُ المالك */
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
