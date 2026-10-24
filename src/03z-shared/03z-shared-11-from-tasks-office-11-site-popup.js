/* ============================================================================
   FILE    : src/03z-shared/03z-shared-11-from-tasks-office-11-site-popup.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-11-site-popup.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : siteTitle, siteSub, netRows, popPhotosHtml, popHtml, popNextHtml, popMarksHtml
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ نافذة النقطة — كما في العامل، وكلُّ زرٍّ يفعل ═══
   وسمُ الحالة لا يُتاح إلا لنقطةٍ أُسندت، والتحريكُ يكتب موقعًا معدَّلًا،
   والتفاصيلُ تفتح شاشتها، والاتجاهاتُ تفتح خرائط جوجل. */

var MOVE_ID = '', MOVE_AT = null;

function siteTitle(x){ return (x && x.type === 'مخيم' && x.sign) ? t('شاخص') + ' ' + x.sign : ((x && x.name) || ''); }

function siteSub(x){ return (x && x.type === 'مخيم' && x.sign) ? [t(x.zone || ''), x.sq ? t('مربع') + ' ' + x.sq : ''].filter(Boolean).join(' \u00b7 ') : ''; }

/* عناوينُ الأجهزة من بادئة شبكة النقطة (١٤٤٧): ‎.1 راوتر و‎.2 قارئ و‎.3 كاميرا */
function netRows(x, kvf){
  var n = String((x && x.net) || '').trim().replace(/\/\d+$/, '').replace(/\.0$/, '');
  if (!/^\d+\.\d+\.\d+$/.test(n)) return '';
  var L = function(v){ return '<div dir="ltr" class="cx-l">' + v + '</div>'; };
  return kvf('عناوين الأجهزة', '<div class="cx-box">' + L(esc(t('راوتر')) + ' ' + esc(n) + '.1') + L(esc(t('قارئ')) + ' ' + esc(n) + '.2') + L(esc(t('كاميرا')) + ' ' + esc(n) + '.3')
    + '<div class="hint" style="margin:2px 0 0;font-size:11px" dir="ltr">' + esc(n) + '.0/24</div></div>');
}

/* (V37.72) طلبُ المالك «عاوز الوزارة تقدر تشوف الصور — شيء مهم جدًّا»: كانت صورُ الزيارة في صفحة التفاصيل والنموذج وحدَهما، وصفحةُ التفاصيل محجوبةٌ عن الوزارة
   فكان زرُّ «التفاصيل» يعود بها إلى الخريطة. الآن تُعرض في نافذة النقطة نفسِها لكلِّ الأدوار: تُجلَب من القاعدة عند الفتح، وتُفتح كلُّ صورةٍ بحجمها بنقرة. */
function popPhotosHtml(id){
  if (typeof photosOf !== 'function') return '';
  var L = photosOf(id).filter(function(x){ return x[1] && !x[1].del; });
  /* (V38.73) the owner: «صور الزيارة مش بتظهر في شاشة المسح». The point's photos were fetched only when NONE were on this
     phone — Mina 0449 had its installation photos here, so its visit photos were never fetched and the survey map showed
     nothing. Each kind now asks for itself: a record that lists photos the phone does not have fetches the point's photos
     and says what it knows meanwhile. */
  /* (V38.58) the installation's photos are their own row (they were counted among the visit's), and a photo the server has
     not yet moved to Drive (no data, no drive id) is shown as waiting instead of silently dropped */
  var group = function(list, label){
    if (!list.length) return '';
    var pend = list.filter(function(x){ return !(x[1].data || x[1].driveId); }).length;
    var th = list.slice(0, 6).map(function(x){ var p = x[1], src = phSrc(x[0], p, 400);   /* (V38.62) the raw copy while it travels */
      return src ? '<img src="' + esc(src) + '" alt="" loading="lazy" data-phview="' + esc(x[0]) + '" title="' + esc(t('اضغط لعرضها كاملة')) + '" style="width:72px;height:72px;object-fit:cover;border-radius:8px;cursor:zoom-in;flex:0 0 auto">'
                 : '<span class="hint" title="' + esc(t('وصلت وتُنقَل إلى الدرايف')) + '" style="width:72px;height:72px;display:flex;align-items:center;justify-content:center;border:1px dashed var(--line);border-radius:8px;margin:0;flex:0 0 auto">\u23F3</span>'; }).join('');
    return '<div style="margin:8px 0 0"><div class="hint" style="margin:0 0 4px">\u{1F4F7} ' + esc(t(label)) + ' \u00b7 ' + nm(list.length) + (pend ? ' \u00b7 \u23F3 ' + nm(pend) + ' ' + esc(t('تُنقَل إلى الدرايف')) : '') + (list.length > 6 ? ' \u2014 ' + esc(t('أوّلُ ستٍّ — والباقي في «التفاصيل»')) : '') + '</div><div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">' + th + '</div></div>';
  };
  /* (V38.70) a voided installation's photos are not this point's installation photos (Arafat 0001: Mina 0449's photo) */
  var vd = ((STATE.inss || {})[id] || {}).voided, vAt = vd ? (+vd.at || 0) : 0;
  var isIns = function(x){ return /^ins/.test(String(x[1].kind || '')) && !(vAt && (+x[1].at || 0) <= vAt); };
  if (vAt) L = L.filter(function(x){ return !(/^ins/.test(String(x[1].kind || '')) && (+x[1].at || 0) <= vAt); });
  /* (V38.61) owner's rule: the survey map shows the visit's photos, the installation map the installation's, «brief» both */
  var svL = L.filter(function(x){ return !isIns(x); }), insL = L.filter(isIns), insR = (STATE.inss || {})[id];
  var listed = function(r){ return r ? ((Array.isArray(r.photos) ? r.photos.length : 0) || +r.phN || 0) : 0; };
  var missing = function(r){
    if (!listed(r)) return '';
    if (typeof photosFetchSite === 'function') photosFetchSite(id);
    var line = typeof photosMissingLine === 'function' ? photosMissingLine(id, r) : '';
    return line ? '<div class="hint" style="margin:8px 0 0">' + esc(line) + (typeof PH_FETCH === 'object' && PH_FETCH[id] === 'err' ? ' ' + btn('\u21BB ' + t('أعد الجلب'), 'btn-quiet btn-sm', ' data-phrefetch="' + esc(id) + '"') : '') + '</div>' : '';
  };
  var sv = svL.length ? group(svL, 'صور الزيارة') : (FIELD_MODE !== 'install' ? missing(STATE.recs[id]) : '');
  var ins = insL.length ? group(insL, 'صور التركيب') : (FIELD_MODE !== 'survey' && insR && insR.status && !insR.voided ? missing(insR) : '');
  return FIELD_MODE === 'install' ? ins : (FIELD_MODE === 'survey' ? sv : sv + ins);
}

function popHtml(){
  /* (V38.69) no fallback to the registry's first point (Arafat 0001): a popup whose point is gone closes — its buttons
     (marks, «نموذج التركيب») would have acted on that camp, the same class as the formSite() incident */
  var s = POP_SITE ? siteFind(POP_SITE) : null;
  if (!s){ POP_OPEN = false; return ''; }
  if (!s) return '';
  var d = CAT_DEF[s.type] || { l:s.type, i:'\u25CF', c:'#8A939D' };
  var rec = STATE.recs[s.id] || null;
  var ins = STATE.inss[s.id] || null;
  var task = asnOf(s.id);
  var moved = !!(rec && rec.loc);
  var sv = !!rec;
  var st = (ins && ins.status) || s.fstat || 'لم يبدأ';

  function kv(k, v){
    if (v === '' || v == null) return '';
    return '<div><span class="k">' + esc(t(k)) + '</span><span>' + v + '</span></div>';
  }

  /* أزرارُ الوسم: في وضع التركيب مجدولٌ وتم، وفي المسح «تمت الزيارة» —
     ولا تظهر إلا لنقطةٍ أُسندت، فلا يُوسَم ما لم يُطلَب. */
  var marks = popMarksHtml(st, s, task);   /* (V39.38) the popup's action marks — moved out whole (audit-health) */

  /* (V39.27) the brief card that was a mode of its own now lives in every mode's popup: popSumHtml + popFieldHtml */

  return '<div class="pop" id="pkPop">'
    + '<div class="pop-head">'
    +   '<div style="min-width:0"><div class="pid" style="color:var(--brand);font-weight:700">'
    +     bdi(siteKey(s)) + (siteKey(s) !== s.id ? ' <span class="hint" style="margin:0;font-weight:400">\u00b7 ' + bdi(s.id) + '</span>' : '') + '</div>'
    +   '<h3 style="margin-top:3px">' + bdiText(s.name) + '</h3>' + (typeof clashPill === 'function' ? clashPill(s.id) : '') + '</div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-pop="0" aria-label="'
    +     esc(t('إغلاق')) + '">✕</button>'
    + '</div>'
    + '<div class="pop-body">'

    + '<div style="color:' + d.c + ';font-weight:800;font-size:12px;margin:6px 0 2px">'
    +   d.i + ' ' + esc(t(d.l)) + ' — ' + esc(t(s.zone))
    /* فرعُ كاميرا الوزارة — ويصحّحه المهندس (V19.1) */
    +   (camKind(s) ? ' \u00b7 ' + esc(camKindLabel(camKind(s))) + (s.type === 'كاميرا' && may('settings')
          ? ' <select data-camkind="' + esc(s.id) + '" aria-label="' + esc(t('نوع الكاميرا')) + '" style="min-height:30px;font-size:12px;width:auto">' + ['Bullet', 'PTZ'].map(function(k){ return '<option value="' + k + '"' + (camKind(s) === k ? ' selected' : '') + '>' + esc(camKindLabel(k)) + '</option>'; }).join('') + '</select>' : '') : '')
    +   '</div>'

    /* (V39.27) the mode's summary first — then what the field recorded, folded, in the mode's own form */
    + popSumHtml(s) + popFieldHtml(s)

    + '<div class="pop-rows">'
    +   kv('الشاخص', s.sign ? '<span class="num">' + esc(s.sign) + '</span>' : '')
    +   kv('المربع', s.sq ? '<span class="num">' + esc(s.sq) + '</span>' : '')
    +   kv('الشركة', esc(s.co))
    +   kv('التصنيف', esc(t(s.inout === 'خارج' ? 'حجاج خارج' : (s.inout === 'داخل' ? 'حجاج داخل' : s.inout))))
    +   kv('وجه العمل', esc(t(s.work)))
    +   kv('المنطقة', esc(s.region))
    +   kv('الدور', siteFloor(s) != null ? esc(t(floorName(siteFloor(s)))) : '')   /* (V22.2) */
    +   (isJmr(s) && siteGate(s) ? kv('البوابة', '<b>' + esc(t(siteGate(s))) + '</b>' + (siteFloor(s) != null ? ' \u2014 ' + esc(t(floorName(siteFloor(s)))) : '')) : '')   /* (V25.4) */
    +   (s.type === 'مخيم' ? (tfwFloorOf(s.id) != null ? kv('مسار التفويج', esc(t('إلى الجمرات')) + ' \u2014 ' + esc(t('الدور') + ' ' + t(TFW_FL[tfwFloorOf(s.id)])) + ' ' + btn('اعرض مسار المخيم', 'btn-quiet btn-sm', ' data-tfwcamp="' + esc(s.id) + '"')) : (tfwLoad(), '')) : '')   /* (V23.2) */
    +   (s.type === 'مخيم' && maySiteEdit() ? kv('حدود المخيم', btn(campFoot(s) ? 'عدّل الحدود' : 'ارسم الحدود', 'btn-quiet btn-sm', ' data-bedstart="' + esc(s.id) + '"') + (campFoot(s) ? btn('\u2702 ' + t('قسّم المخيم'), 'btn-quiet btn-sm', ' data-campsplit="' + esc(s.id) + '"') : ''))   /* (V37.67) */ : '')   /* (V25.9) */
    +   (s.type === 'مخيم' && s.zone === 'منى' && mayIot() ? kv('حساسات المخيم', (function(){ var c = iotOf(s.id); if (!c) return (campFoot(s) ? btn('\u2728 ' + t('ولّد خطة حساسات') + ' (' + nm(IOT_N) + ')', 'btn-quiet btn-sm', ' data-iotgen="' + esc(s.id) + '"') : esc(t('ارسم حدودَ المخيم أوّلًا'))); var o = iotOutside(s.id, c).length; return nm(c.sensors.length) + ' ' + esc(t('حساسًا')) + ' \u00b7 ' + nm(1 + (c.gws || []).length) + ' ' + esc(t('جيت واي')) + ' ' + btn(t('عدّل الحساسات'), 'btn-quiet btn-sm', ' data-iotedit="' + esc(s.id) + '"') + (o ? ' <span style="color:#E05252">\u26A0 ' + nm(o) + ' ' + esc(t('خارج الحدود')) + '</span> ' + btn(t('وزّعها من جديد'), 'btn-quiet btn-sm', ' data-iotredist="' + esc(s.id) + '"') : ''); })()) : '')   /* (V25.8 → V37.70) */
    +   camInfoRows(s, kv) + camxRows(s, kv) + netRows(s, kv) + (function(){ try { return popPhotosHtml(s.id); } catch (e){ LS_ERR = e; return ''; } })()   /* (V37.72) صورُ الزيارة للجميع — (V38.64) ولا تُسقط النافذةَ أبدًا */   /* (V23.8) */
    /* الحالةُ من مصدر اللون نفسِه (V17.35): كانت «تمت الزيارة» تُكتَب لكلِّ
     سجلٍّ ولو كان تعذُّرَ وصول — فيبدو المخيمُ بُنيًّا على الخريطة والنافذةُ
     تقول تمّت. صار النصُّ والدائرةُ من دورة الحياة واحدةً، ويُقال لونُها. */
  +   (function(){
        var lf = (typeof lifeOf === 'function') ? lifeOf(s) : '';
        var L2 = (typeof LIFE === 'object' && LIFE[lf]) || null;
        var sv2 = svDone(rec);
        return kv('حالة المسح', pill(sv2 ? 'تمت الزيارة' : (rec ? 'تعذّر الوصول' : 'لم يُزر'), sv2 ? 'ok' : (rec ? 'off' : 'warn'))
          + (rec && !sv2 && rec.note ? ' <span class="hint" style="margin:0">' + esc(String(rec.note).slice(0, 60)) + '</span>' : ''))
          + (L2 ? kv('لون النقطة', '<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + L2.c + ';vertical-align:middle;margin-inline-end:6px"></span>' + esc(t(L2.n))) : '');
      })()
    +   kv('حالة التركيب', pill(st, st==='مُركّب' ? 'ok' : (st==='متعذّر' ? 'off' : '')))
    +   (task ? kv('مُسند إلى', esc(task.to) + (task.when ? ' · ' + esc(task.when) : '')) : '')
    +   kv('الإحداثيات', '<span class="num">' + s.lat.toFixed(5) + ', ' + s.lng.toFixed(5) + '</span>')
    /* عناوينُ الأجهزة الثلاثة — تُقرأ من النافذة مباشرةً بلا فتح شاشةٍ أخرى.
       البادئةُ من التركيب المعتمد إن وُجد وإلا من سجل الموقع. */
    + (function(){
        var ins = STATE.inss[s.id], pre = (ins && ins.prefix) || s.net || '';
        pre = String(pre).trim().replace(/\.+$/, '');
        if (!/^\d{1,3}(\.\d{1,3}){2}$/.test(pre)) return '';
        var ip = function(n){ return '<span class="num" dir="ltr">' + esc(pre + '.' + n) + '</span>'; };
        return kv('الراوتر', ip(1)) + kv('القارئ', ip(2)) + kv('الكاميرا', ip(3));
      })()
    + '</div>'

    + (moved ? '<div class="hint" style="color:#7FB3FF;margin:6px 0 0">\u{1F4CD} '
        + esc(t('موقع معدَّل ميدانيًّا')) + '</div>' : '')

    + '<div class="pst">' + marks + '</div>'
    + (rankOf(ROLE) >= rankOf('tech') && typeof chThreadHtml === 'function' ? chThreadHtml(s.id, true) : '')   /* (V38.60) the point's chat, last three lines */

    + (ins && Object.keys(ins.parts || {}).length
      ? '<div class="hint" style="margin:8px 0 0">' + esc(t('القطع'))
        + ': <b>' + nm(Object.keys(ins.parts).length) + '</b> · ' + esc(t('النقاط'))
        + ': <b>' + nm(ptsInstall(s)) + '</b>'   /* (V37.77) */
        + (ins.approved ? ' · ' + pill('معتمد','ok') : ' · ' + pill('بانتظار التدقيق','warn'))
        + demoTag(s) + (insRevs(ins).length ? ' · ' + esc(t('تجهيزة')) + ' ' + nm(insRevs(ins).length + 1) : '')   /* (V37.78) */
        + '</div>' : '')

    /* لكلٍّ ما يملك: التحديدُ لمن يُسنِد (المشرفُ فما فوق)، والتحريكُ والنموذجُ
       لمن يكتب — والوزارةُ تتابع: اتجاهاتٌ وتفاصيلُ فقط، فلا يُعرَض عليها زرٌّ
       ترفضه القاعدة */
    + '<div class="pop-btns">'
    +   (rankOf(ROLE) >= rankOf('supervisor')
          ? btn(selHas(s.id) ? '☑ ' + t('محدَّد') : '☐ ' + t('حدّد'),
                selHas(s.id) ? 'btn-primary btn-sm' : 'btn-secondary btn-sm',
                ' data-psel="' + esc(s.id) + '"') : '')
    +   '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" '
    +   'href="https://www.google.com/maps/dir/?api=1&destination=' + s.lat + ',' + s.lng + '">'
    +   '↗ ' + esc(t('اتجاهات')) + '</a>'
    +   (MAP_3D && s.type === 'مخيم' ? btn('\u{1F6AA} ' + t('ادخل المخيم'),'btn-secondary btn-sm',' data-m3enter="' + esc(s.id) + '"') : '')   /* (V39.21) the camera walks in through the gate */
    +   (may('edit') ? btn('⇱ ' + t('تحريك'),'btn-secondary btn-sm',' data-move="' + esc(s.id) + '"') : '')
    +   (typeof mvdItems === 'function' && mvdItems(s.id).length > 1 ? btn('\u2725 ' + t('تحريك الأجهزة'),'btn-secondary btn-sm',' data-mvd="' + esc(s.id) + '"') : '')   /* (V39.31) drag every device of the point */
    +   btn(may('edit') ? '✎ ' + t('تعديل البيانات') : '\u25C8 ' + t('التفاصيل'),'btn-secondary btn-sm',' data-site="' + esc(s.id) + '"')
    +   (seesPage('ev') ? btn('\u{1F4DC} ' + t('سجل النقطة'),'btn-quiet btn-sm',' data-evsite="' + esc(s.id) + '"') : '')   /* (V30.8) */
    /* نموذجُ التركيب لا يُفتَح لنقطةٍ لم تصر جاهزةً — وإلا رُكّبت قبل اعتمادها */
    +   (may('edit')
          ? (FIELD_MODE === 'install'
              /* الجاهزيةُ الحقيقيةُ: اعتمادُ الوزارة وحلٌّ معتمد — لا اللونُ وحدَه */
              ? ((((typeof minOk === 'function' && minOk(s.id)) && (STATE.inss[s.id] || {}).solution && (STATE.inss[s.id] || {}).solution.status === 'معتمد') || insDone(s.id) || taskKindOf(s.id, 'install')
                  ? btn('🔧 ' + t('نموذج التركيب'),'btn-secondary btn-sm',' data-insform="' + esc(s.id) + '"')
                  : '')
                + (typeof insqMay === 'function' && insqMay(s.id) ? btn('\u270E ' + t('تعديل التركيب'),'btn-secondary btn-sm',' data-insq="' + esc(s.id) + '"') : ''))   /* (V38.61) */
              : btn('🔍 ' + t('نموذج المسح'),'btn-secondary btn-sm',' data-form="' + esc(s.id) + '"')
                + (svqMay(s.id) ? btn('\u270E ' + t('تعديل المسح'),'btn-secondary btn-sm',' data-svq="' + esc(s.id) + '"') : '')
                /* (V38.56) an open install task on this site: its form is here even in «survey» map mode */
                + (taskKindOf(s.id, 'install') ? btn('🔧 ' + t('نموذج التركيب'),'btn-primary btn-sm',' data-insform="' + esc(s.id) + '"') : ''))
          : '')

    /* ═══ الخطوةُ التالية — أين تقف النقطةُ ومن صاحبُ الدور ═══
       من رأى نقطةً مسوحةً لا تظهر في التركيب سأل: أهي معطَّلةٌ أم تنتظر؟
       فصار كلُّ حالٍ يقول ما بعده ومن يملكه — ومن يملكه يجد الزرَّ، ومن
       لا يملكه يعرف من ينتظر بدل أن يظنَّ العطل. */
    +   popNextHtml(s, rec, sv)
    + '</div></div>';
}
/* (V39.38) the popup's action marks (install, delete…), moved out of popHtml whole — same statements, same order */
function popMarksHtml(st, s, task){
  var marks = '';
  /* (V38.58) owner's rule: the engineer may say «installed» from here; supervisor and technician record the
     installation in its form with parts, serials and photos */
  if (FIELD_MODE === 'install' && !may('approve')){
    marks = '<span class="hint" style="margin:0;font-size:11.5px">' + esc(t('سجّل التركيبَ من «نموذج التركيب» بقطعه وسيريالاته وصوره')) + '</span>';
  } else if (FIELD_MODE === 'install'){
    marks = [['مجدول','#FF8C42'], ['مُركّب','#3AD6A0'], ['متعذّر','#E05252']].map(function(o){
      var on = st === o[0];
      return '<button type="button" class="go' + (on?' on':'') + '"'
        + ' style="border-color:' + o[1] + ';color:' + (on ? '#0A0B0D' : o[1])
        + (on ? ';background:' + o[1] : '') + '"'
        + ' data-fmark="' + esc(s.id) + '|' + esc(o[0]) + '">' + esc(t(o[0])) + '</button>';
    }).join('');
  } else if (may('approve')){   /* (V28.7) قرارُ المالك: «اسمها زيارة — المشرفُ ملزَمٌ بنموذج المسح، والمهندسُ يقدر يعملها من عنده (تمت الزيارة) ويتجاوز النموذج» */
    /* (V28.3) زرٌّ يقول ما يفعل: يسجّل زيارةً سريعةً حين لا زيارة، ويُلغي السريعةَ وحدَها، ولا يظهر على مسحٍ كامل */
    var rq = STATE.recs[s.id];
    marks = !rq ? '<button type="button" class="go" style="border-color:#4BC9F5;color:#4BC9F5" data-smark="' + esc(s.id) + '">\u2713 ' + esc(t('تمت الزيارة')) + '</button>'
      : recIsQuick(rq) ? '<span class="pill info">' + esc(t('تمت الزيارة — بقرار المهندس')) + '</span>'   /* (V28.4) لا زرَّ إلغاء — الحذفُ موقوف */
      : '';
  } else if (task || rankOf(ROLE) >= rankOf('supervisor')){   /* (V28.7) المشرفُ والفنيُّ: الزيارةُ من نموذج المسح بصوره */
    marks = STATE.recs[s.id] ? '' : '<span class="hint" style="margin:0;font-size:11.5px">' + esc(t('سجّل الزيارةَ من «نموذج المسح» بصورها')) + '</span>';
  } else {
    marks = '<span class="hint" style="margin:0;font-size:11.5px">'
      + esc(t('لم تُجدول زيارة لهذه النقطة بعد')) + '</span>';
  }

  /* (V36.1) «مش لاقي حذف نقطة منين»: الزرُّ كان داخل «تعديل بيانات النقطة» وحدَه — صار في النافذة نفسِها للمهندس فما فوق */
  /* (V36.3) بلاغُ المالك «دي مفيهاش حذف» — نقطةٌ مضافة (NSK-HJM-LPR-N006) كانت مستثناة: صار الزرُّ لكلِّ نقطة، والحذفُ منه قابلٌ للاستعادة
     للمضافة وللأصلية سواء؛ والحذفُ النهائيُّ للمضافة باقٍ في «تعديل البيانات» لمن أراد محوها بسجلّاتها. */
  if (mayDeleteFinal()) marks += siteLocked(s.id) ?   /* (V37.9 ق-٠١٦) الحذفُ النهائيُّ للمهندس فما فوق */   /* (V36.8) المزارةُ لمدير المشروع */ '<span class="pill" title="' + esc(t('ما رُكّب لا يُحذَف')) + '">\u{1F512} ' + esc(t(siteLocked(s.id))) + '</span>'   /* (V36.4) */
    : '<button type="button" class="go" style="border-color:#E05252;color:#E05252" data-popdel="' + esc(s.id) + '">\u{1F5D1} ' + esc(t('حذف نهائي')) + '</button>';
  return marks;
}
/* (V39.38) the point's «next step» block, moved out of popHtml whole — kept under 150 lines (audit-health) */
function popNextHtml(s, rec, sv){
          /* ═══ الاعتمادان في الخطوة التالية ═══
             كانت البطاقةُ تقفز من المسح إلى «جاهزةٌ للتركيب» وتعرض نموذجَ
             التركيب — وقد صار بينهما اعتمادان: تقنيٌّ من المهندس، ثم اعتمادُ
             الوزارة لإعداد التركيب. فمن قرأ البطاقةَ ظنَّ النقطةَ جاهزةً وهي
             تنتظر، وربّما فتح نموذجَ تركيبٍ لنقطةٍ لم تُعتمَد بعد. */
          var ins2 = STATE.inss[s.id] || {}, so = ins2.solution;
          var rec2 = STATE.recs[s.id], rv2 = svReview(rec2), ms2 = minState(rec2);
          var step = '', go = '', who = '';
          if (rec && !svDone(rec)){
            step = 'تعذّر الوصولُ — تُزار ثانيةً'; who = 'المشرفُ المُسنَد إليه';
            if (may('edit')) go = btn('🔍 ' + t('امسحها الآن'),'btn-primary btn-sm',' data-form="' + esc(s.id) + '"');
          } else if (!sv && !taskKindOf(s.id, 'visit')){
            /* لا زيارةَ ولا إسنادَ لها — ما بعدها جدولةُ زيارة (V17.57) */
            step = 'تحتاج جدولةَ زيارة'; who = 'المشرفُ أو المهندس';
            if (rankOf(ROLE) >= rankOf('supervisor') && !isCrewRole(ROLE))
              go = btn('\u{1F4C5} ' + t('جدوِل زيارة'),'btn-primary btn-sm',' data-visitasn="' + esc(s.id) + '"');
            else if (may('edit')) go = btn('🔍 ' + t('امسحها الآن'),'btn-primary btn-sm',' data-form="' + esc(s.id) + '"');
          } else if (!sv){
            step = 'تنتظر الزيارةَ الميدانية'; who = 'الفنيُّ المُسنَد إليه';
            if (may('edit')) go = btn('🔍 ' + t('امسحها الآن'),'btn-primary btn-sm',' data-form="' + esc(s.id) + '"');
          } else if (rv2 === 'revisit'){
            step = 'رُدّت لزيارةٍ أخرى'; who = 'المشرفُ الذي زارها';
            if (may('edit')) go = btn('🔍 ' + t('امسحها الآن'),'btn-primary btn-sm',' data-form="' + esc(s.id) + '"');
          } else if (rv2 !== 'approved'){
            step = 'تمت الزيارة — تنتظر الاعتمادَ التقني'; who = 'المهندس';
            if (may('approve')) go = btn('✅ ' + t('افتح الاعتماد التقني'),'btn-primary btn-sm',' data-goto="svappr" data-gotosite="' + esc(s.id) + '"');
          } else if (ms2 === 'returned'){
            step = 'أعادتها الوزارةُ بملاحظة — تنتظر المعالجة'; who = 'المهندس';
            if (may('approve')) go = btn('🏛 ' + t('افتح اعتماد الوزارة'),'btn-primary btn-sm',' data-goto="minappr" data-gotosite="' + esc(s.id) + '"');
          } else if (ms2 !== 'approved'){
            step = 'اعتُمدت تقنيًّا — تنتظر اعتمادَ الوزارة لإعداد التركيب'; who = 'الوزارة';
            if (may('minapprove')) go = btn('🏛 ' + t('افتح اعتماد الوزارة'),'btn-primary btn-sm',' data-goto="minappr" data-gotosite="' + esc(s.id) + '"');
          } else if (!so){
            step = 'تمت الزيارة — تنتظر تحديدَ ما سيُركَّب'; who = 'المهندس';
            if (may('edit')) go = btn('🧩 ' + t('حدّد القطع'),'btn-primary btn-sm',' data-goto="solution"');
          } else if (so.status !== 'معتمد'){
            step = 'حلُّها مقترحٌ — ينتظر الاعتماد'; who = 'المهندس';
            go = may('users')
              ? btn('✔ ' + t('اذهب للاعتماد'),'btn-primary btn-sm',' data-goto="solution"')
              : '';
          } else if (!insDone(s.id)){
            step = 'اعتمدتها الوزارةُ وحلُّها معتمد — جاهزةٌ للتركيب'; who = 'فريقُ التركيب';
            if (may('edit')) go = btn('🔧 ' + t('نموذج التركيب'),'btn-primary btn-sm',' data-insform="' + esc(s.id) + '"');
          } else {
            step = 'رُكّبت واعتُمدت'; who = '—';
          }
          var tw = (!sv && !rec) ? twinOf(s) : null;
          var twinNote = tw ? '<div class="alert warn" style="margin:10px 0 0"><span>' + esc(t('توأمٌ على الإحداثيات نفسِها')) + ': <b>' + esc(siteKey(tw)) + '</b>' + (siteKey(tw) !== tw.id ? ' (' + esc(tw.id) + ')' : '') + ' '
              + '(' + esc((tw.sq || '') + ' / ' + (tw.sign || '')) + ') \u2014 ' + esc(t(svVisited(STATE.recs[tw.id]) ? 'تمت الزيارة' : 'لم تتم زيارتها'))
              + '. ' + esc(t('إن كانا مخيمًا واحدًا فادمجهما من «تصحيح البيانات» فلا يُعَدُّ مرتين.')) + '</span>'
              + (maySiteEdit() ? '<div class="actions" style="margin:6px 0 0">' + btn('\u{1F9F9} ' + t('تصحيح البيانات'),'btn-quiet btn-sm',' data-goto="dq"') + '</div>' : '') + '</div>' : '';
          return twinNote + '<div class="alert info" style="margin:10px 0 0"><span>'
            + '<strong>' + esc(t('الخطوة التالية')) + ':</strong> ' + esc(t(step))
            + (who !== '—' ? ' \u00b7 <span class="hint" style="margin:0">'
                + esc(t('صاحبُها')) + ': ' + esc(t(who)) + '</span>' : '')
            + '</span></div>'
            + (go ? '<div class="actions" style="margin:8px 0 0">' + go + '</div>' : '')
            /* وسمُ التركيب التجريبي — للمدير: يقاس الزمنُ بين مراحلها في «الفك والمراحل ← السلسلة» (V17.95) */
            + (may('users') ? '<div class="actions" style="margin:8px 0 0">' + btn((s.pilot ? '\u2713 ' : '') + t(s.pilot ? 'نقطةُ تجربة — أعِدها عادية' : 'اجعلها نقطةَ تجربة'), 'btn-quiet btn-sm', ' data-pilot="' + esc(s.id) + '"') + '</div>' : '')
            + (typeof execOvRow === 'function' ? execOvRow(siteFind(s.id) || s) : '');   /* (V37.52) تصنيفُ التقرير التنفيذي وزيارتُها التقنية — بالنقطة الأصلية لا نسخة العرض */
        }


/* (V39.27) the summary of the mode's record: its verdict (تمام · تحدٍّ · ملاحظة) and one line, by whom and when — and,
   for whoever may write it, the three chips and the line, here, without another screen. Shown once the record exists. */
function popSumHtml(s){
  var ph = briefPhase(), r = briefRec(s.id, ph); if (!r) return '';
  if (ph === 'survey' && !svDone(r) && !(r.access && r.access !== 'تم الوصول')) return '';
  var bf = briefOf(s.id, ph), me = briefMay(), col = bf ? (BRIEF_C[bf.st] || 'var(--line)') : 'var(--line)';
  var title = ph === 'install' ? 'خلاصة التركيب' : ph === 'dis' ? 'خلاصة الفك' : 'خلاصة الزيارة';
  return '<div class="card" style="margin:8px 0;padding:10px 12px;border-inline-start:4px solid ' + col + '">'
    + '<div class="hint" style="margin:0 0 4px;font-weight:700">\u{1F4DD} ' + esc(t(title)) + '</div>'
    + (bf
        ? '<div class="wt-row">' + pill(bf.st, bf.st === 'تمام' ? 'ok' : (bf.st === 'تحدٍّ' ? 'bad' : 'warn'))
          + '<span class="hint" style="margin:0">' + esc(dispName(bf.by)) + (bf.at ? ' \u00b7 ' + esc(stepAgo(bf.at)) : '') + '</span></div>'
          + '<div style="margin:6px 0 0;font-size:13.5px;line-height:1.6">' + esc(bf.d || t('بلا تفاصيلَ مكتوبة')) + '</div>'
        : '<p class="hint" style="margin:0">' + esc(t('لم تُكتَب خلاصةٌ بعد')) + '</p>')
    + (me
        ? '<div class="chips" style="margin:8px 0 0">' + BRIEF_ST.map(function(x){
            return '<button type="button" class="chip' + (bf && bf.st === x ? ' on' : '') + '" data-bst="' + esc(s.id) + '|' + esc(x) + '|' + ph + '">' + esc(t(x)) + '</button>';
          }).join('') + '</div>'
          + '<div style="display:flex;gap:6px;margin-top:8px">'
          + '<input id="bfTxt" dir="auto" value="' + esc(bf ? bf.d : '') + '" placeholder="' + esc(t('سطرٌ واحد: ما الذي وقع في هذه النقطة؟')) + '" style="flex:1">'
          + btn('\u{1F4BE} ' + t('حفظ'), 'btn-primary btn-sm', ' data-bfsave="' + esc(s.id) + '|' + ph + '"') + '</div>'
        : '')
    + '</div>';
}
/* (V39.27) what the field recorded for the mode, folded under the summary: the visit's answers, its challenges and photos in
   survey; the installation's parts, serials and photos in installation; the dismantling's state in dismantling — and every
   text written about the point, by its source and writer, in all three. */
function popFieldHtml(s){
  var ph = briefPhase(), r = briefRec(s.id, ph); if (!r) return '';
  var row = function(k, v){ return v ? '<div><span class="k">' + esc(t(k)) + '</span><span>' + v + '</span></div>' : ''; };
  var texts = (function(){
    var TX = svTexts(s.id); if (!TX.length) return '';
    return '<div class="hint" style="margin:10px 0 4px;font-weight:700">\u{1F5E8} ' + esc(t('ما كُتب عن النقطة')) + '</div>'
      + TX.map(function(x){ return '<div class="bf-tx"><div class="hint" style="margin:0">' + esc(t(x.src)) + (x.who ? ' \u00b7 ' + esc(dispName(x.who)) : '') + (x.at ? ' \u00b7 ' + esc(stepAgo(x.at)) : '') + '</div>'
        + '<div style="font-size:13.5px;line-height:1.6">' + esc(x.txt) + '</div></div>'; }).join('');
  })();
  var photos = function(re){
    var L = photosOf(s.id).filter(function(x){ return !x[1].del && re.test(String(x[1].kind || '')); }); if (!L.length) return '';
    return '<div class="hint" style="margin:10px 0 4px;font-weight:700">\u{1F4F7} ' + esc(t('الصور')) + ' <span style="font-weight:400">\u00b7 ' + nm(L.length) + '</span></div>'
      + '<div class="bf-ph">' + L.slice(0, 8).map(function(x){ var src = phSrc(x[0], x[1], 400); return src ? '<img src="' + esc(src) + '" alt="' + esc(t(x[1].kind || '')) + '" data-phview="' + esc(x[0]) + '" loading="lazy">' : ''; }).join('') + '</div>';
  };
  var body;
  if (ph === 'survey'){
    var bR = r;
    body = (true
          ? '<div class="pop-rows">' + svFieldRows(bR) + '</div>'   /* the summary line above already says who and when */
            + ((bR.chals || []).length
                ? /* لا يُعاد نصُّ «تحديات التركيب» هنا: حارسُ الحُرّاس يزرع عطلَه في تلك
                     المرساة بعينها، ويشترط ألّا تتكرّر — وإلا زرع في موضعٍ وفحص آخر */
                  '<div class="hint" style="margin:8px 0 4px;font-weight:700">\u26A0 ' + esc(t('التحديات المرصودة')) + '</div>'
                  + '<div class="chips" style="margin:0">' + bR.chals.map(function(c){ return pill(c, /لا توجد/.test(c) ? 'ok' : 'warn'); }).join('') + '</div>'
                : '')
            /* كلُّ نصٍّ كُتب عن النقطة — بمصدره وكاتبه */
            + (function(){
                var TX = svTexts(s.id); if (!TX.length) return '';
                return '<div class="hint" style="margin:10px 0 4px;font-weight:700">\u{1F5E8} ' + esc(t('ما كُتب عن النقطة')) + '</div>'
                  + TX.map(function(x){
                      return '<div class="bf-tx"><div class="hint" style="margin:0">' + esc(t(x.src))
                        + (x.who ? ' \u00b7 ' + esc(dispName(x.who)) : '') + (x.at ? ' \u00b7 ' + esc(stepAgo(x.at)) : '') + '</div>'
                        + '<div style="font-size:13.5px;line-height:1.6">' + esc(x.txt) + '</div></div>';
                    }).join('');
              })()
            /* والصورُ تُفتَح من هنا — لا من شاشةٍ أخرى */
            + (function(){
                var L = photosOf(s.id).filter(function(x){ return !x[1].del && !/^(ins|dis)/.test(String(x[1].kind || '')); });   /* the visit's own photos — the installation's are in its mode */
                /* (V38.73) the visit's photos are fetched even when the installation's are already here */
                if (bR && ((bR.photos || []).length || +bR.phN) && !L.some(function(x){ return !/^ins/.test(String(x[1].kind || '')); })) photosFetchSite(s.id);
                if (!L.length) return (bR.photos || []).length   /* (V37.7) تُجلَب من القاعدة حين تُفتَح النقطة، ويُقال الصدق */
                  ? '<div class="hint" style="margin:8px 0 0">' + esc(photosMissingLine(s.id, bR))
                    + (PH_FETCH[s.id] === 'err' ? ' ' + btn('\u21BB ' + t('أعد الجلب'), 'btn-quiet btn-sm', ' data-phrefetch="' + esc(s.id) + '"') : '') + '</div>'
                  : '';
                var fold = null; L.forEach(function(x){ if (!fold && x[1].folderId) fold = x[1].folderId; });
                return '<div class="hint" style="margin:10px 0 4px;font-weight:700">\u{1F4F7} ' + esc(t('الصور')) + ' <span style="font-weight:400">\u00b7 ' + nm(L.length) + '</span></div>'
                  + '<div class="bf-ph">' + L.slice(0, 8).map(function(x){
                      var id = x[0], p = x[1];
                      var src = p.data || (p.driveId ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(p.driveId) + '&sz=w400' : '');
                      if (!src) return '';
                      return '<img src="' + esc(src) + '" alt="' + esc(t(p.kind || '')) + '" title="' + esc(t(p.kind || '')) + '"'
                        + ' data-phview="' + esc(id) + '" loading="lazy">';
                    }).join('') + '</div>'
                  + (fold && rankOf(ROLE) >= rankOf('admin')
                      ? '<a class="btn btn-quiet btn-sm" style="margin-top:6px" target="_blank" rel="noopener" href="https://drive.google.com/drive/folders/' + esc(fold) + '">\u{1F4C1} ' + esc(t('مجلد النقطة على الدرايف')) + '</a>'
                      : '');
              })()
          : '');
  } else if (ph === 'install'){
    var parts = Object.keys(r.parts || {}).filter(function(k){ return +r.parts[k] > 0; });
    body = '<div class="pop-rows">'
      + row('الحالة', esc(t(r.status || ''))) + row('ركّبه', esc(dispName(r.by || ''))) + row('بتاريخ', r.at ? esc(fmtDate(r.at)) : '')
      + row('القطع', parts.map(function(k){ return esc(t(itemName(k))) + ' \u00d7 <span class="num">' + nm(+r.parts[k]) + '</span>'; }).join('<br>'))
      + row('السيريالات', Object.keys(r.serials || {}).filter(function(k){ return r.serials[k]; }).map(function(k){ return esc(t(itemName(k))) + ': <span class="num">' + esc(r.serials[k]) + '</span>'; }).join('<br>'))
      + row('ملاحظة', esc(r.note || r.notes || '')) + '</div>'
      + photos(/^ins/) + texts;
  } else {
    body = '<div class="pop-rows">'
      + row('الحالة', esc(t(r.status || ''))) + row('حالة الأجهزة', esc(t(r.cond || ''))) + row('بواسطة', esc(dispName(r.by || ''))) + row('بتاريخ', r.at ? esc(fmtDate(r.at)) : '')
      + row('ملاحظة', esc(r.note || r.notes || '')) + '</div>'
      + photos(/^dis/) + texts;
  }
  return '<details class="card" style="margin:0 0 8px;padding:8px 12px"><summary style="cursor:pointer;font-weight:700">\u{1F4CB} ' + esc(t('ما سجّله الميدان'))
    + (r.by ? ' <span class="hint" style="margin:0;font-weight:400">\u00b7 ' + esc(dispName(r.by)) + (r.at ? ' \u00b7 ' + esc(stepAgo(r.at)) : '') + '</span>' : '') + '</summary>' + body + '</details>';
}
