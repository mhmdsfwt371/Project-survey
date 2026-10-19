/* ═══ نافذة النقطة — كل ما تحمله النقطة من إجراءات ═══
   الخريطة الحقيقية Leaflet: هذه النافذة هي ما يفتح عند النقر على أي نقطة. */

var BOOT_AT = Date.now();          /* لحظةُ فتحِ التطبيق — لتقدير ما يكلّف */
var POP_OPEN = false, POP_JUST = 0, POP_EV = null;
/* ═══ النقرةُ تُعرَف بعينها لا بوقتها ═══
   نقرةُ النقطة تفتح النافذةَ، ثم يصل الحدثُ نفسُه إلى معالج المستند الذي
   يُغلق كلَّ لوحٍ نُقر خارجه — فكانت النافذةُ تُفتَح وتُغلَق في اللحظة
   نفسها. وحُلَّ بمهلةٍ: «إن مضى أقلُّ من ثلاثِ مئةِ جزءٍ فاتركها». والمهلةُ
   تكفي حتى يبطئ الرسم: مخيماتٌ بمضلّعاتها عند التقريب، أو قائمةٌ طويلةٌ
   يُعاد بناؤها — فيتجاوز الرسمُ المهلةَ، ويصل الحدثُ بعدها، فتُغلَق النافذةُ
   قبل أن تُرى. ولا يقع ذلك إلا على الأجهزة البطيئة وفي أثقل الحالات، فيبدو
   العطلُ متقطّعًا لا يُصدَّق.
     فصارت النقرةُ تُعلَّم بعينها: يُحفَظ الحدثُ الأصليُّ نفسُه، ويقارنه
   معالجُ المستند بهويته — فلا يهمُّ كم استغرق الرسمُ، الحدثُ الذي فتحها لا
   يُغلقها أبدًا. والمهلةُ تبقى احتياطًا لمن لا حدثَ أصليَّ له. */
function popOpenAt(id, ev){
  POP_EV = (ev && (ev.originalEvent || ev.detail && ev.detail.originalEvent)) || ev || null;
  POP_JUST = Date.now();
  POP_SITE = id; POP_OPEN = true; render();
}

/* نافذةُ النقطة في p27 — بأفعالها الحقيقية */

/* ═══ مركز التصدير — قسمًا قسمًا كالقديم ═══ */

EXP.secs = [
  ['summary','الملخّص التنفيذي — أرقامُ المشروع في ورقة',1],
  ['over','نظرة عامة',1], ['minappr','اعتماد الوزارة لإعداد التركيب',1], ['wbs','متابعة الخطة التفصيلية',1], ['wtask','متابعة المهام الأسبوعية',1], ['wtaskAll','المهام — ورقة العمل',1], ['wtmeet','محضر الاجتماع',1], ['wtsince','ما تغيّر منذ الاجتماع الماضي',1], ['pace','الوتيرة والهدف',1],
  ['chalm','التحديات — أين وما هي وما المطلوب',1], ['chalpts','نقاط التحديات — كلُّ نقطةٍ بتحدّيها ووصفه وموقعها ومعالجته (بفلتر الصفحة إن وُضع)',1], ['inst','التركيب والجدولة',1],
  ['daily','معدل التركيب اليومي — آخر ١٤ يوم',1], ['reg','حسب المشعر ونوع النقطة',1],
  ['co','حسب شركة الخدمة — الأقل إنجازًا أولًا',1],
  ['setup','المواعيد المستهدفة وأزمنة التركيب',1],
  ['pipe','سلامة خط الإنتاج — مسح ← جدولة ← تركيب',1],
  ['assign','توزيع فرق التركيب',1], ['conote','إشعار الشركات بمواعيد التركيب',1],
  ['stock','عُهدة الأجهزة — القارئات مع الفرق والمخزن',1],
  ['survey','المسح الميداني',1], ['chal','التحديات الميدانية — إفادة المشرفين',1],
  ['stuck','المتعذّر — ما لم يصل إليه الميدان',1],
  ['idle','الراكد — زيارةٌ تمّت ولم يُركَّب موقعُها',1],
  ['qa','التدقيق الهندسي — اعتماد التركيبات والسيريالات',1],
  ['sys','سلامة البيانات — المشرف العام',1], ['ev','سجل الأحداث',1],
  ['invb','المخزون والعُهدة',1], ['invmv','دفتر حركة المخزون',1],
  ['wos','الورشة — طلبات التهيئة والتجميع والتركيب',1],
  ['wday','نقاط اليوم — لكل منفِّذ عبر المراحل',1],
  ['buys','المشتريات — ما اشتُري من السوق المحلي',1],
  ['score','أداء الفنيين — نقاطهم ومستحقّهم',1],
  ['stages','أداء المراحل — فريق كل مرحلة',1],
  ['recs','المسح الميداني — كل زيارة وحالتها',1],
  ['hb','صحة الأجهزة — إنذار مبكر',1], ['dis','الفك بعد الموسم',1],
  ['vers','نسخة التطبيق على الأجهزة',1],
  /* خمسُ أوراقٍ كانت تُبنى ولا يصلها منفذ: تُولَّد في كل تصديرٍ ثم تُرمى.
     ورقةٌ لا تُطلَب شيفرةٌ ميتة، والأصلُ أن تُوصَل لا أن تُحذَف. */
  ['work','وجه العمل — التوزيع والنسب',1],
  ['items','القطع والأسعار — الكتالوج كاملًا',1],
  ['crews','الطواقم ومعدلاتها اليومية',1],
  ['reps','مركز التقارير — ما يُرسَل ولمن ومتى',1],
  ['daily','الاتجاه اليومي — تسعون يومًا',1],
  ['ev','سجل الأحداث — كما هو مصفّى',1],
  ['users','المستخدمون وأدوارهم',1],
  ['notif','الإشعارات وقنواتها',1],
  ['appr','الاعتمادات — المقترح والقرار',1],
  ['ips','عناوين الشبكة',1],
  ['fleet','السيارات — الأسطول والإسناد',1],
  ['fleetCost','تكلفة الأسطول',1],
  ['fleetLog','سجل عهدة السيارات',1],
  ['ships','الشحنات والتوريد',1],
  ['roles','الأدوار والصلاحيات',1]
];

/* ═══ التصديرُ بعين الدور ═══
   كان الحوارُ يعرض الأقسامَ كلَّها لكلِّ أحد — فترى الوزارةُ «الأدوار والصلاحيات»
   و«عهدة السيارات» و«تكلفة الأسطول» وتختارها وتُصدَّر لها. صار كلُّ قسمٍ
   مربوطًا بشاشته: لا يُعرَض ولا يُصدَّر إلا لمن يرى تلك الشاشة. */
EXP.page = { summary:'over', minappr:'survey', wtsince:'wtask', wtaskAll:'wtask', wtmeet:'wtask', setup:'consts', pipe:'over', conote:'co', stock:'inv', wday:'perf', score:'perf', stages:'perf',
                 hb:'sys', vers:'sys', work:'over', items:'items', crews:'org', reps:'exec', appr:'ev', ips:'sys',
                 fleet:'fleet', fleetCost:'fleet', fleetLog:'fleet', ships:'inv', roles:'roles', invb:'inv', invmv:'inv',
                 wos:'inv', buys:'inv', notif:'ev', users:'users', recs:'survey', chal:'survey', stuck:'survey', qa:'survey',
                 chalm:'survey', chalpts:'mfu', assign:'req', inst:'over', daily:'over', pace:'over', reg:'over', dis:'dis', sys:'sys', ev:'ev', survey:'survey', co:'co', over:'over' };
function expAllowed(k){ var p = EXP.page[k] || k; return typeof seesPage === 'function' ? seesPage(p) : true; }
/* ستةَ عشرَ قسمًا في القائمة بلا ورقةٍ تُبنى — كانت تُعرَض رماديةً مطفأةً
   فيظنُّ الناظرُ أن بياناتِه ناقصة، وهي شيفرةٌ لم تُوصَل. لا تُعرَض. */
function expSecs(){ return EXP.secs.filter(function(x){ return expAllowed(x[0]) && !!SHEETS[x[0]]; }); }
/* ═══ PDF: ورقةٌ تُبنى وتُطبَع ═══
   الطباعةُ إلى PDF هي ما يملكه المتصفّحُ بلا مكتبة — تُبنى صفحةٌ نظيفةٌ
   بالأقسام المختارة في نافذةٍ مستقلّةٍ فيختار المستخدمُ «حفظ كـPDF». */
/* ═══ صفحةُ الغلاف: البطاقاتُ والأشرطةُ التي تُقرأ قبل الجداول ═══
   الجداولُ وحدَها لا تقول «الشغلُ تمام»: تُقرأ بعد أن يُعرَف الموقف. فالغلافُ
   بطاقاتٌ كبيرةٌ بأرقام المشروع، وأشرطةُ تقدّمٍ للمسح والتركيب، وأعمدةٌ لكلِّ
   مشعرٍ، وحلقةُ حالةٍ لدورة النقطة — كلُّها SVG مرسومٌ في الصفحة لا صورةٌ
   خارجية، فتُطبَع كما تُرى بلا مكتبةٍ ولا اتصال. */
function pdfTile(lab, val, sub, col){
  return '<div class="tile" style="border-top:4px solid ' + col + '">'
    + '<div class="tl">' + esc(t(lab)) + '</div><div class="tv">' + esc(String(val)) + '</div>'
    + (sub ? '<div class="ts">' + esc(sub) + '</div>' : '') + '</div>';
}
function pdfBar(lab, v, max, col){
  var p = max ? Math.min(100, Math.round(v / max * 100)) : 0;
  return '<div class="bar"><div class="bl"><span>' + esc(t(lab)) + '</span><span>' + nm(v) + ' / ' + nm(max) + ' \u00b7 ' + nm(p) + '٪</span></div>'
    + '<div class="btrack"><i style="width:' + p + '%;background:' + col + '"></i></div></div>';
}
/* أعمدةٌ رأسيةٌ بـSVG — لا مكتبةَ ولا صورة */
function pdfCols(rows, col){
  var mx = Math.max(1, Math.max.apply(null, rows.map(function(r){ return r[1]; })));
  var W = 96, H = 150, gap = 26, w = rows.length * (W + gap);
  return '<svg viewBox="0 0 ' + Math.max(360, w) + ' 210" style="width:100%;max-width:640px;height:auto">'
    + rows.map(function(r, i){
        var h = Math.round(r[1] / mx * H), x = i * (W + gap) + 12, y = 20 + (H - h);
        return '<rect x="' + x + '" y="' + y + '" width="' + W + '" height="' + Math.max(2, h) + '" rx="6" fill="' + col + '"></rect>'
          + '<text x="' + (x + W / 2) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="15" fill="#111" font-weight="700">' + nm(r[1]) + '</text>'
          + '<text x="' + (x + W / 2) + '" y="' + (H + 42) + '" text-anchor="middle" font-size="13" fill="#445">' + esc(r[0]) + '</text>';
      }).join('') + '</svg>';
}
/* حلقةٌ مقسَّمةٌ بحصص — دورةُ حياة النقطة بلونها */
function pdfDonut(parts){
  var tot = parts.reduce(function(a, p){ return a + p[1]; }, 0) || 1, R = 62, C = 2 * Math.PI * R, off = 0;
  return '<div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">'
    + '<svg viewBox="0 0 170 170" style="width:170px;height:170px">'
    + '<circle cx="85" cy="85" r="' + R + '" fill="none" stroke="#eef2f6" stroke-width="22"></circle>'
    + parts.map(function(p){
        var len = p[1] / tot * C, el = '<circle cx="85" cy="85" r="' + R + '" fill="none" stroke="' + p[2] + '" stroke-width="22"'
          + ' stroke-dasharray="' + len.toFixed(1) + ' ' + (C - len).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 85 85)"></circle>';
        off += len; return el;
      }).join('')
    + '</svg><div style="font-size:12px">'
    + parts.map(function(p){ return '<div style="margin:3px 0"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:' + p[2] + ';margin-inline-end:7px"></span>'
        + esc(t(p[0])) + ' <b>' + nm(p[1]) + '</b> <span style="color:#778">' + nm(Math.round(p[1] / tot * 100)) + '٪</span></div>'; }).join('')
    + '</div></div>';
}
function pdfCover(){
  var K = siteKeyStats(), S = K.total;
  var zones = {}; STATE.sites.forEach(function(x){ zones[x.zone] = (zones[x.zone] || 0) + (svVisited(STATE.recs[x.id]) ? 1 : 0); });   /* (V32.6) */
  var zrows = Object.keys(zones).map(function(z){ return [z, zones[z]]; }).sort(function(a, b){ return b[1] - a[1]; });
  var life = {}; STATE.sites.forEach(function(x){ var l = lifeOf(x); life[l] = (life[l] || 0) + 1; });
  var parts = LIFE_ORDER.filter(function(k){ return life[k]; }).map(function(k){ return [LIFE[k].n, life[k], LIFE[k].c]; });
  var wt = (typeof wtStats === 'function') ? wtStats() : null;
  var pct = S.n ? Math.round(S.sv / S.n * 100) : 0;
  return '<div class="tiles">'
    + pdfTile('إجمالي المواقع', nm(S.n), '', '#1F4E79')
    + pdfTile('تمت الزيارة', nm(S.sv), nm(pct) + '٪', '#2E75B6')
    + pdfTile('مُركّب', nm(S.ins), '', '#3AD6A0')
    + pdfTile('لم يُزر', nm(S.noRec), '', '#9FB0AA')
    + pdfTile('تحتاج زيارة أخرى', nm(S.stuck), '', '#8D6E63')
    + (wt ? pdfTile('مهامُّ متأخرة', nm(wt.late), nm(wt.all) + ' ' + t('مهمة'), wt.late ? '#E05252' : '#3AD6A0') : '')
    + '</div>'
    + '<div class="box">' + pdfBar('نسبة الزيارة من إجمالي المشروع', S.sv, S.n, '#2E75B6')
    + pdfBar('نسبة التركيب من إجمالي المشروع', S.ins, S.n, '#3AD6A0') + '</div>'
    + (zrows.length ? '<h3>' + esc(t('المسح المنجز حسب المشعر')) + '</h3><div class="box">' + pdfCols(zrows, '#2E75B6') + '</div>' : '')
    + (parts.length ? '<h3>' + esc(t('دورة النقطة — أين هي الآن')) + '</h3><div class="box">' + pdfDonut(parts) + '</div>' : '');
}
function expPdf(keys){
  var css = 'body{font:12px/1.6 system-ui,"Segoe UI",Tahoma;margin:20px;color:#111}'
    + 'h1{font-size:21px;margin:0 0 2px;color:#1F4E79}h2{font-size:14px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid #1F4E79;color:#1F4E79;page-break-after:avoid}'
    + 'h3{font-size:13px;margin:16px 0 6px;color:#334}'
    + 'table{width:100%;border-collapse:collapse;margin:0 0 10px;font-size:11px}'
    + 'th{background:#1F4E79;color:#fff;padding:5px 6px;text-align:start;font-weight:600}'
    + 'td{border-bottom:1px solid #dde3ea;padding:4px 6px}tr:nth-child(even) td{background:#f6f9fc}'
    + '.hint{color:#667;font-size:11px}'
    + '.tiles{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}'
    + '.tile{flex:1 1 150px;min-width:140px;border:1px solid #e3e9f0;border-radius:10px;padding:10px 12px;background:#fbfdff}'
    + '.tl{font-size:11.5px;color:#667}.tv{font-size:26px;font-weight:800;line-height:1.2;color:#12203a}.ts{font-size:11px;color:#667}'
    + '.box{border:1px solid #e3e9f0;border-radius:10px;padding:12px 14px;background:#fff;margin:0 0 10px}'
    + '.bar{margin:0 0 10px}.bl{display:flex;justify-content:space-between;font-size:11.5px;color:#445;margin-bottom:4px}'
    + '.btrack{height:10px;border-radius:99px;background:#eef2f6;overflow:hidden}.btrack i{display:block;height:100%;border-radius:99px}'
    + '@media print{h2{page-break-before:always}.cover{page-break-after:always}}';
  var body = '<div style="display:flex;align-items:center;gap:12px;margin:0 0 6px">'
    +   (LOGO ? '<img src="' + LOGO + '" alt="AFAQY" style="height:34px;width:auto">' : '')
    +   '<h1 style="margin:0">' + esc(t('قارئات أفاقي — تقرير اللوحة')) + '</h1></div>'
    + '<div class="hint">' + esc(t('حج ١٤٤٨هـ')) + ' \u00b7 ' + esc(t('قارئات أفاقي في المشاعر')) + ' \u00b7 '
    + esc(fmtDT()) + ' \u00b7 ' + esc(dispName(STATE.meta.name || '')) + '</div>';
  /* الغلافُ أولًا: البطاقاتُ والرسومُ ثم الجداول */
  try { body += '<div class="cover">' + pdfCover() + '</div>'; } catch (e){ softErr('غلاف التقرير', e, ''); }
  var n = 0;
  keys.forEach(function(k){
    var fn = SHEETS[k]; if (!fn) return;
    var rows; try { rows = fn(); } catch (e){ return; }
    if (!rows || rows.length < 2) return;
    var lab = (EXP.secs.filter(function(x){ return x[0] === k; })[0] || [k, k])[1];
    body += '<h2>' + esc(t(lab)) + '</h2><table><thead><tr>'
      + rows[0].map(function(c){ return '<th>' + esc(String(c == null ? '' : c)) + '</th>'; }).join('')
      + '</tr></thead><tbody>'
      + rows.slice(1, 400).map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + esc(String(c == null ? '' : c)) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</tbody></table>'
      + (rows.length > 400 ? '<div class="hint">' + esc(t('عُرض أربعُمئة صفٍّ — والإكسلُ فيه الباقي')) + '</div>' : '');
    n++;
  });
  if (!n){ toast(t('لا بياناتٍ في الأقسام المختارة')); return; }
  var w2 = window.open('', '_blank');
  if (!w2){ toast(t('امنع حجبَ النوافذ لتصدير PDF')); return; }
  w2.document.write('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">'
    + '<title>' + esc(t('قارئات أفاقي — تقرير اللوحة')) + '</title><style>' + css + '</style></head><body>'
    + body + '</body></html>');
  w2.document.close();
  setTimeout(function(){ try { w2.focus(); w2.print(); } catch (e){ softErr('طباعة PDF', e, 'افتح النافذةَ واطبع منها'); } }, 400);
  logEvent('تصدير PDF — ' + n + ' قسمًا');
  toast(nm(n) + ' ' + t('قسمًا — اختر «حفظ كـPDF» من نافذة الطباعة'));
}
function expHtml(){
  return '<div class="pop" id="expPop" style="width:min(430px,92vw);max-height:82vh;overflow:auto">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">'+esc(t('تصدير تقرير اللوحة'))+'</h3>'
    +   '<p class="hint" style="margin:2px 0 0">'+esc(t('اختر الأقسام التي تريدها في التقرير'))+'</p></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-exp="0" aria-label="'+esc(t('إغلاق'))+'">✕</button>'
    + '</div>'
    + '<div class="pop-body">'
    + '<div class="actions" style="margin:12px 0">'
    +   btn('تحديد الكل','btn-secondary btn-sm',' data-expall="1"')
    +   btn('إلغاء الكل','btn-secondary btn-sm',' data-expall="0"')
    + '</div>'
    + '<div id="expList" style="margin:0 0 14px">'
    +   expSecs().map(function(s){
          return '<label style="display:flex;gap:9px;align-items:flex-start;padding:7px 2px;'
            + 'border-bottom:1px solid var(--line-2);font-size:13.5px;cursor:pointer">'
            + '<input type="checkbox" class="expCk" data-k="'+esc(s[0])+'" checked'
            + ' style="width:18px;min-height:18px;margin-top:2px;flex:0 0 auto">'
            + '<span>'+esc(t(s[1]))+'</span></label>';
        }).join('')
    + '</div>'
    + '<div class="grid cols-2" style="margin-bottom:12px">'
    +   '<div class="field" style="margin:0"><label>'+esc(t('الصيغة'))+'</label>'
    +   '<select id="expFmt"><option value="xlsx">'+esc(t('إكسل — ورقة لكل قسم'))+'</option>'
    +   '<option value="pdf">'+esc(t('PDF — بالرسوم البيانية'))+'</option>'
    +   '<option value="both">'+esc(t('الاثنان معًا'))+'</option></select></div>'
    +   '<div class="field" style="margin:0"><label>'+esc(t('الرسوم البيانية'))+'</label>'
    +   '<select><option value="مضمّنة">'+esc(t('مضمّنة'))+'</option><option value="بدونها">'+esc(t('بدونها'))+'</option></select></div>'
    + '</div>'
    + '<div class="actions">' + btn('تصدير','btn-primary',' data-expgo="1"')
    +   btn('إلغاء','btn-secondary',' data-exp="0"') + '</div></div>'
    + '<p class="hint" style="font-size:11.5px">'
    +   esc(t('الإكسل ورقةٌ لكل قسم بعناوينها كما تظهر على الشاشة · والPDF صفحةٌ لكل قسم برسمها البياني.')) + '<br>'
    +   esc(t('يُصدَّر ما بعد التصفية — وبلا تصفيةٍ يُصدَّر الكلّ.'))
    + '</p></div>';
}

