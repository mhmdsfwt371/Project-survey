/* ============================================================================
   FILE    : src/03-survey/03-survey-records-06-survey-form.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : The survey form: basic fields first and details on demand, prefix generation, automatic photo checks, and the draft that survives iOS closing the page.
   DEFINES : svExtra, ipPreset, ipsOf, formPts, photoBox, photoCard, photoQuality, photoQualityFlags, photoQualityWarn, photoHamming, photoDupOf, shrink … (+5 more)
   GLOBALS : SV_MORE, IP_OCT2, IP_OCT3, PHOTO_Q_IX, PQ, SVD
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ نموذجُ المسح: الأساسيُّ أوّلًا والتفصيليُّ عند الطلب ═══
   كان النموذجُ يعرض سبعةً وعشرين حقلًا دفعةً واحدةً على شاشة هاتفٍ في
   الشمس — فيتوه المشرفُ ويملأ ما لا يلزم ويترك ما يلزم. والحقولُ كلُّها
   تنفع، لكن ليست كلُّها لازمةً لكلِّ نقطة: المكتبُ يحتاج القياساتِ
   والصلاحيةَ والكهرباءَ ونقطةَ التركيب ليقرّر؛ وما بقي — الكمياتُ
   والتقديرُ وتفاصيلُ الوصول — يُقدَّره المهندسُ من الحل ولا يُطلَب من
   الميدان إلا حين يعرفه.
     فصار الأساسيُّ ظاهرًا دائمًا، والتفصيليُّ خلف زرٍّ واحد، ولا حقلَ
   حُذف ولا قيمةٌ ضاعت: ما مُلئ يُحفَظ كما كان. */
var SV_MORE = false;
function svExtra(s){
  var isCamp = s.type === 'مخيم';
  /* كلُّ ما يعبره الحاجُّ مشيًا تحت إطارٍ مكشوف: ممرٌّ وجسرٌ ومحطةُ قطارٍ
     وبوابةُ مسجد — تُسأل عن العرض والارتفاع، لا عن عدد الخيام. */
  var isWide = s.type === 'ممر' || s.type === 'جسر' || s.type === 'محطة' || s.type === 'بوابة';
  var isJam  = s.type === 'جسر';
  var isCam  = s.type === 'كاميرا';
  var reuse  = /إعادة تركيب/.test(s.work || '');
  var ip     = ipsOf(s.net || FORM.prefix || '');

  var h = '';

  /* ما في السجل يُقرأ ولا يُعاد إدخاله — والتصويبُ بطلبٍ يعتمده المهندس */
  h += card('بيانات مسجّلة — راجعها',
      '<div class="pop-rows" style="margin:0">'
      + '<div><span class="k">' + esc(t('المربع')) + '</span><span class="num">' + esc(s.sq || '—') + '</span></div>'
      + '<div><span class="k">' + esc(t('الشاخص')) + '</span><span class="num">' + esc(s.sign || '—') + '</span></div>'
      + '<div><span class="k">' + esc(t('شركة تقديم الخدمة')) + '</span><span>' + esc(s.co || '—') + '</span></div>'
      + '<div><span class="k">' + esc(t('تصنيف الحجاج')) + '</span><span>' + esc(s.inout || '—') + '</span></div>'
      + (ip !== '—' ? '<div><span class="k">' + esc(t('العناوين المشتقّة')) + '</span><span class="num">' + esc(ip) + '</span></div>' : '')
      + (function(){
          /* ما سجّله الموسمُ الماضي — يُقرأ ولا يُعاد إدخاله */
          if (!S47) { s47Load(); return ''; }
          var v = s47Of(s.id); if (!v) return '';
          var rows = [['nat','الجنسية'], ['host','الجهة المستضيفة'],
                      ['dom','الجهة المصرِّحة'], ['cap','السعة المسجّلة ١٤٤٧'],
                      ['pct','نسبة إنجاز ١٤٤٧'], ['dj','عدد أجهزة ١٤٤٧'],
                      ['sub','نقطة الاتصال'], ['tst','حالة الاختبار'],
                      ['obst','عائقٌ مسجَّل'], ['iss','ملاحظةٌ مسجَّلة'],
                      ['team','الفريق المسجَّل'], ['pri','حالة ١٤٤٧'],
                      ['todo','بقي مفتوحًا من الموسم']];
          return rows.filter(function(x){ return v[x[0]]; }).map(function(x){
            return '<div><span class="k">' + esc(t(x[1])) + '</span><span>' + esc(v[x[0]]) + '</span></div>';
          }).join('');
        })()
      + '</div>'
      + '<p class="hint">' + esc(t('من ملفات المشروع — للقراءة فقط؛ واطلب تصحيحًا إن وجدت في الموقع غيرَها.')) + '</p>');

  h += card('القياسات والصلاحية',
      '<div class="grid cols-2">'
      + svNum('len_m','الطول المتاح (متر)','طول المساحة الصالحة للتركيب')
      + svNum('wid_m','العرض المتاح (متر)','الإطار القياسي يحتاج أربعة أمتار')
      + svNum('hgt_m','الارتفاع المتاح (متر)','الإطار القياسي بارتفاع أربعة أمتار')
      + svSel('fit','هل الموقع مناسب للتركيب؟', SV_FIT)
      + '</div>');

  if (isCamp) h += card('بيانات المخيم',
      '<div class="grid cols-2">'
      + svNum('tents','عدد الغرف أو الخيام','لكلِّ غرفةٍ حساسُ حرارةٍ ورطوبة — وإن لم تُعَدّ الغرفُ يُحسَب متوسطُ ١٢ غرفةً في منى')
      + svNum('gates','عدد بوابات المخيم')
      + '</div>');

  if (isWide) h += card(isJam ? 'مسار الجمرات' : 'المسار',
      '<div class="grid cols-2">'
      + svNum('corr_w','عرض المسار للاتجاه الواحد (متر)','الطقمُ الكامل يغطي حوالي ١٥ مترًا')
      + svSel('kits','عدد الأطقم الكاملة المطلوبة', SV_KITS)
      + (isJam ? svTxt('jam_pos','الدور والجهة','مثال: الدور الثاني — يمين') : '')
      + '</div>');

  if (reuse) h += card('أصول موسم ١٤٤٧',
      '<div class="grid cols-2">'
      + svSel('old_base','هل القاعدة أو التثبيت القديم موجود؟', SV_BASE)
      + svSel('old_cable','هل مسار الكابل القديم سليم؟', SV_CABLE)
      /* العنوانُ القائمُ يُقرأ من الراوتر لا يُخترَع من المكتب */
      + svTxt('old_net','العنوان القائم (بادئة الشبكة)','اقرأه من ملصق الراوتر أو شاشته — مثل 10.10.40.7')
      + '</div>');

  if (isCam) h += card('الكاميرا القائمة',
      '<div class="grid cols-2">'
      + svSel('cam_ok','هل الكاميرا تعمل؟', SV_CAM)
      + svSel('router_sp','هل يوجد مكان لتركيب راوتر؟', SV_ROUT)
      + '</div>');

  h += card('الكهرباء',
      '<div class="grid cols-2">'
      + svSel('power_src','أقرب مصدر كهرباء', SV_PWR)
      + svNum('pdist','المسافة إلى المصدر (متر)')
      + svSel('p24','التغذية متاحة ٢٤ ساعة؟', SV_P24)
      + (reuse ? svSel('power_yn','هل يوجد مصدر كهرباء؟', ['','يوجد','لا يوجد'],
                       'تفاصيلُ الكهرباء محفوظةٌ من ١٤٤٧ — أكّد وجودَ المصدر فقط') : '')
      + (reuse ? svTxt('power_note','ماذا تغيّر؟','اتركه فارغًا إن كان الوضع كما هو') : '')
      + '</div>');

  /* ── ما دون هذا تفصيلٌ يُفتَح عند الحاجة ── */
  h += '<div class="actions" style="margin:2px 0 12px">'
     + btn((SV_MORE ? '\u25B2 ' : '\u25BC ') + t(SV_MORE ? 'أخفِ التفاصيل' : 'تفاصيل إضافية — الكميات والتقدير'),
           'btn-quiet btn-sm', ' data-svmore="' + (SV_MORE ? '0' : '1') + '"')
     + '</div>';
  if (!SV_MORE){
    h += '<p class="hint" style="margin:0 0 12px">'
       + esc(t('ما سبق يكفي لاعتماد الزيارة — والتفاصيلُ هنا اختيارية.')) + '</p>';
    return h;
  }

  h += card('الكميات المطلوبة',
      '<div class="grid cols-2">'
      + svNum('n_ant','عدد الهوائيات')
      + svNum('n_rdr','عدد القارئات')
      + svNum('n_cam','عدد الكاميرات')
      + (isCamp ? svNum('n_sens','عدد الحساسات البيئية','حساسٌ لكل غرفةٍ عادةً') : '')
      + '</div>');

  h += card('نقطة التركيب',
      svSel('metal','هياكل معدنية مؤثرة قرب النقطة؟', SV_METAL,
            'الحديدُ المجاور يشوّش قراءة القارئ ويغيّر مكان التثبيت'));

  h += card('تحديات التركيب — التفصيل',
      /* (V38.20) الوصفُ انتقل تحت التحديات في أعلى النموذج — هنا الأعمالُ المدنيةُ والمعداتُ وحدَها */
      '<div class="grid cols-2">'
      + svSel('civil','هل يحتاج أعمال مدنية؟', SV_CIVIL,
              'الأعمالُ المدنية لها موعدُ إغلاقٍ مبكر — هذا الحقلُ يحدّد المسار الحرج')
      + svSel('equip','المعدات اللازمة للوصول', SV_EQUIP)
      + '</div>');

  h += card('التقدير',
      '<div class="grid cols-2">'
      + svNum('hours','تقدير ساعات التركيب','منه يُبنى الجدول الزمني')
      + svNum('crew_n','عدد أفراد الطاقم')
      + '</div>');

  return h;
}

/* ── نموذج المسح ── */

/* ── نموذج التركيب ── */

/* ═══ توليدُ البادئات الناقصة ═══
   كانت البادئةُ تُكتَب نقطةً نقطةً أو تُستورَد من ملف — فبقيت المخيماتُ
   معنونةً والممراتُ بلا عنوان، ولا أحدَ يعرف كم بقي. صار زرٌّ واحدٌ يملأ
   الناقصَ بمخطَّطٍ ثابت: لكلِّ مشعرٍ ثمانيةٌ، ولكلِّ نوعٍ داخله شريحةٌ من
   الثالثة، والرقمُ الأخيرُ تسلسلٌ داخل النوع. وما له بادئةٌ لا يُمَسّ. */
var IP_OCT2 = { 'منى':10, 'عرفات':20, 'مزدلفة':30, 'الجمرات':40, 'مكة':50 };
var IP_OCT3 = { 'مخيم':0, 'ممر':40, 'جسر':80, 'كاميرا':120, 'محطة':160, 'بوابة':200, 'مبنى':230 };
/* نقطةٌ رُكِّبت في موسمٍ ماضٍ: عنوانُها قائمٌ في جهازها فعلًا — لا يُخترَع
   له بديلٌ يخالفه، بل يُقرأ من الميدان عند الزيارة ويُكتَب في النموذج. */
function ipPreset(x){
  return /إعادة تركيب|ترقية|تفعيل/.test(String(x.work || ''))
      || (typeof insDone === 'function' && insDone(x.id));
}

function ipsOf(p){
  p = String(p || '').trim().replace(/\.+$/, '');
  /* البادئةُ ثلاثةُ أعدادٍ (10.20.30) — والمولَّدةُ أربعةٌ لأن لكلِّ نقطةٍ
     شبكتَها الفرعية، فتُقرأ أعدادُها الثلاثةُ الأولى بادئةً وتُعرَض كاملة. */
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(p)) return p + ' \u2014 ' + t('شبكةُ النقطة');
  if (!/^\d{1,3}(\.\d{1,3}){2}$/.test(p)) return '—';
  return p + '.1 · ' + p + '.2 · ' + p + '.3';
}

function formPts(){
  var n = 0;
  Object.keys(FORM.parts).forEach(function(k){ n += cfgN(FORM.parts[k]) * itPts(k); });
  return Math.round(n * 100) / 100;
}

/* حقلُ صورةٍ لأيِّ نموذج: كان الحقلُ يقرأ FORM.photos وحدَه، فنموذجٌ آخر
   لا يستطيع صورةً. الوسمُ يحمل المخزنَ فيعرف المعالجُ أين يضع. */
function photoBox(key, store, tag, label){
  var has = !!store[key];
  return card('الصور',
    '<div class="field"><label>' + esc(t(label)) + ' <span class="req">*</span></label>'
    + '<label class="btn btn-secondary" style="width:100%;justify-content:center">'
    +   (has ? '\u2713 ' + esc(t('التُقطت')) : '\u{1F4F7} ' + esc(t('صوّر أو اختر')))
    +   '<input type="file" accept="image/*" data-' + tag + '="' + esc(key) + '" style="display:none">'
    + '</label>'
    + (has ? '<div class="hint" style="margin:4px 0 0">' + nm(Math.round(store[key].size / 1024))
             + ' ' + esc(t('كيلو')) + '</div>' : '')
    + '</div>');
}
function photoCard(){
  var L = Array.prototype.slice.call(arguments);
  return card('الصور',
    '<div class="grid cols-2">'
    + L.map(function(p){
        var has = !!FORM.photos[p[0]];
        return '<div class="field"><label>' + esc(t(p[1]))
          + (p[2] ? ' <span class="req">*</span>' : '') + '</label>'
          + '<div class="actions" style="margin:0;gap:6px;flex-wrap:nowrap">'   /* (V37.79) الكاميرا أو المعرض/الجهاز — كان زرًّا واحدًا يفتح الكاميرا وحدها على بعض الهواتف */
          + '<label class="btn ' + (has ? 'btn-secondary' : 'btn-primary') + '" style="cursor:pointer;flex:1">'
          + (has ? '✓ ' + esc(t('التُقطت')) : '📷 ' + esc(t('صوّر')))
          + '<input type="file" accept="image/*" capture="environment" data-photo="' + p[0] + '" style="display:none"></label>'
          + '<label class="btn btn-quiet" style="cursor:pointer;flex:1">\u{1F5BC} ' + esc(t('من المعرض أو الجهاز'))
          + '<input type="file" accept="image/*" data-photo="' + p[0] + '" style="display:none"></label></div>'
          + (has ? '<div class="hint" style="margin:4px 0 0">' + nm(Math.round(FORM.photos[p[0]].size/1024))
                 + ' ' + esc(t('كيلو')) + ' <button type="button" class="btn btn-quiet btn-sm" data-phclear="' + p[0] + '" style="color:#E05252">\u{1F5D1} ' + esc(t('احذف الصورة')) + '</button></div>' : '')   /* (V37.16) طلبُ المالك */
          + '</div>';
      }).join('')
    + '</div>'
    + '<p class="hint">' + esc(t('الصورُ تُصغَّر على جهازك قبل الرفع، وتُحفَظ منفصلةً عن بيانات الزيارة.')) + '</p>');
}

/* ضغطُ الصورة على الجهاز — الرفع الخام يخنق شبكةَ المشاعر */
/* ═══ (V30.6) فحصُ الصور تلقائيًّا (فكرةُ المالك #٧) ═══
   على الجهاز لحظةَ الالتقاط: الإضاءةُ (متوسطُ السطوع)، والحدّةُ (تباينُ لابلاس على ١٢٨ بكسل)، وبصمةٌ ٦٤ بت للتكرار.
   مظلمةٌ أو محترقةٌ أو مهزوزةٌ → تنبيهٌ فوريٌّ «أعد الالتقاط» بلا منع؛ ومكررةٌ لنفس النقطة → تنبيه. وتُحفَظ المقاييسُ في
   وثيقة الصورة فيراها المكتبُ: قائمةُ «صور تحتاج إعادة» في متابعة الوزارة ← المسح الميداني. */
var PHOTO_Q_IX = {};
var PQ = { dark:35, bright:238, blur:18 };
function photoQuality(cx, W, H){
  try {
    var n = 128, c2 = document.createElement('canvas'); c2.width = n; c2.height = n; var g = c2.getContext('2d'); if (!g) return null;
    g.drawImage(cx.canvas, 0, 0, W, H, 0, 0, n, n);
    var d = g.getImageData(0, 0, n, n).data, L = new Float32Array(n * n), sum = 0;
    for (var i = 0, k = 0; i < d.length; i += 4, k++){ var v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; L[k] = v; sum += v; }
    var mean = sum / (n * n), lap = 0, lap2 = 0, cnt = 0;
    for (var y = 1; y < n - 1; y++){ for (var x = 1; x < n - 1; x++){ var p0 = y * n + x, v2 = 4 * L[p0] - L[p0 - 1] - L[p0 + 1] - L[p0 - n] - L[p0 + n]; lap += v2; lap2 += v2 * v2; cnt++; } }
    var sharp = cnt ? Math.sqrt(Math.max(0, lap2 / cnt - (lap / cnt) * (lap / cnt))) : 0;
    /* بصمةُ ٨×٨ بالمتوسط */
    var bits = '', m = 0, cells = []; for (var by = 0; by < 8; by++){ for (var bx = 0; bx < 8; bx++){ var acc = 0; for (var yy = 0; yy < 16; yy++){ for (var xx = 0; xx < 16; xx++){ acc += L[(by * 16 + yy) * n + bx * 16 + xx]; } } acc /= 256; cells.push(acc); m += acc; } }
    m /= 64; for (var ci = 0; ci < 64; ci++) bits += cells[ci] > m ? '1' : '0';
    var hex = ''; for (var hi = 0; hi < 64; hi += 4) hex += parseInt(bits.slice(hi, hi + 4), 2).toString(16);
    c2.width = 0; c2.height = 0;
    return { b:Math.round(mean), s:Math.round(sharp * 10) / 10, h:hex };
  } catch (e){ return null; }
}
function photoQualityFlags(pq){ var f = []; if (!pq) return f; if (pq.b < PQ.dark) f.push('مظلمة'); else if (pq.b > PQ.bright) f.push('محترقة'); if (pq.s < PQ.blur) f.push('مهزوزة'); return f; }
function photoQualityWarn(pq){ var f = photoQualityFlags(pq); if (f.length) toast('\u26A0 ' + t('الصورة') + ' ' + f.map(function(x){ return t(x); }).join(' و') + ' \u2014 ' + t('أعد الالتقاط لو أمكن')); }
function photoHamming(a, b){ if (!a || !b || a.length !== b.length) return 99; var d = 0; for (var i = 0; i < a.length; i++){ var x = parseInt(a[i], 16) ^ parseInt(b[i], 16); while (x){ d += x & 1; x >>= 1; } } return d; }
function photoDupOf(siteId, pq){
  if (!pq || !pq.h) return false;
  var dup = false;
  PHOTO_Q.forEach(function(q){ if (q.site === siteId && q.q && photoHamming(q.q.h, pq.h) <= 3) dup = true; });
  Object.keys(STATE.photos || {}).forEach(function(k){ var v = STATE.photos[k]; if (v && v.site === siteId && v.q && photoHamming(v.q.h, pq.h) <= 3) dup = true; });
  return dup;
}
function shrink(file, max, q){
  /* (V25.9) كانت الصورةُ تُقرأ نصًّا (readAsDataURL) — صورةُ كاميرا الآيفون ٣–٥ م.ب تصير نصًّا ١٠ م.ب في الذاكرة فوق
     فكِّها الكامل (٤٨ م.ب) — واللوحُ والصورةُ يبقيان حتى يجمعهما المتصفّح. وسفاري الآيفون يُنهي الصفحةَ حين تشتدّ
     الذاكرة والكاميرا مفتوحة، فيضيع المسح. صار الملفُّ يُقرأ برابطٍ لا بنص، ويُحرَّر اللوحُ والصورةُ والرابطُ لحظةَ الانتهاء. */
  return new Promise(function(res){
    if (!file || typeof Image === 'undefined'){ res(null); return; }
    var url = null, img = new Image(), cv = null, fr = null;
    var done = function(v){
      try { if (url) URL.revokeObjectURL(url); } catch (e){ LS_ERR = e; }
      try { img.onload = img.onerror = null; img.src = ''; } catch (e){ LS_ERR = e; }
      try { if (cv){ cv.width = 0; cv.height = 0; } } catch (e){ LS_ERR = e; }
      res(v);
    };
    img.onload = function(){
      try {
        var W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
        var r = Math.min(1, (max || 1280) / Math.max(W, H));
        cv = document.createElement('canvas');
        cv.width = Math.round(W * r); cv.height = Math.round(H * r);
        var cx = cv.getContext('2d');
        if (!cx){ done(null); return; }
        cx.drawImage(img, 0, 0, cv.width, cv.height);
        var pq = photoQuality(cx, cv.width, cv.height);   /* (V30.6) فكرةُ المالك #٧: فحصُ الصورة على الجهاز لحظةَ التقاطها */
        var out = { data:cv.toDataURL('image/jpeg', q || 0.72), w:cv.width, h:cv.height, size:Math.round(cv.width * cv.height * 0.12), q:pq };
        if (pq){ PHOTO_Q_IX[out.data.length + ':' + out.data.slice(-64)] = pq; photoQualityWarn(pq); }
        done(out);
      } catch (e){ done(null); }
    };
    img.onerror = function(){ done(null); };
    try { url = (typeof URL !== 'undefined' && URL.createObjectURL) ? URL.createObjectURL(file) : null; } catch (e){ url = null; }
    if (url){ img.src = url; return; }
    /* متصفّحٌ بلا روابط ملفات: المسارُ القديم */
    try { fr = new FileReader(); } catch (e){ res(null); return; }
    fr.onload = function(){ img.src = fr.result; };
    fr.onerror = function(){ res(null); };
    try { fr.readAsDataURL(file); } catch (e){ res(null); }
  });
}

/* ═══ مسودةُ المسح (V25.9) — المسحُ لا يضيع إن أغلق الآيفونُ الصفحة ═══
   بلاغٌ من الميدان: «كلُّ مسحٍ يخرجني وأنا أمسح ويحذف المسح» — سفاري الآيفون يُنهي الصفحةَ حين تشتدّ الذاكرة
   (والكاميرا مفتوحة تحديدًا) فيعيد تحميلها، والنموذجُ في الذاكرة وحدَها فيضيع. صار النموذجُ كلُّه — بصوره
   المصغّرة — يُحفَظ على الجهاز مع كلِّ صورةٍ وكلِّ حقلٍ ولحظةَ تخرج الصفحةُ إلى الكاميرا، ويُستعاد تلقائيًّا بعد
   الإعادة كما كان، ويُمسَح عند الحفظ أو تبديل النقطة. مسودةُ حسابٍ آخر على الجهاز نفسِه لا تُفتَح، وتسقط بعد يوم. */
var SVD = { checked:false, t:0, dirty:false };   /* dirty: في النموذج ما لم يُحفَظ */
function svDraftSave(){
  try {
    if (typeof FORM !== 'object' || !FORM || !FORM.site || typeof idbSet !== 'function') return;
    idbSet('svDraft', { at:Date.now(), by:(STATE.meta && STATE.meta.name) || '', form:JSON.parse(JSON.stringify(FORM)) }).catch(function(e){ LS_ERR = e; });
    /* (V37.32) البندُ ١ — مرآةٌ في التخزين البسيط بلا صور: حين تتعثّر قاعدةُ الجهاز على آيفون يبقى نصُّ المسح المنقطع ويُستعاد */
    try { var F2 = JSON.parse(JSON.stringify(FORM)); F2.photos = {}; var js = JSON.stringify({ at:Date.now(), by:(STATE.meta && STATE.meta.name) || '', form:F2 }); if (js.length < 200000) lsSet('nsk14.svdraft', js); } catch (eL){ LS_ERR = eL; }
  } catch (e){ LS_ERR = e; }
}
function svDraftSoon(){ clearTimeout(SVD.t); SVD.t = setTimeout(svDraftSave, 700); }
function svDraftClear(){ try { SVD.dirty = false; clearTimeout(SVD.t); lsSet('nsk14.svdraft', ''); if (typeof idbSet === 'function') idbSet('svDraft', null).catch(function(e){ LS_ERR = e; }); } catch (e){ LS_ERR = e; } }
function svDraftRestore(){
  SVD.checked = true;
  if (typeof idbGet !== 'function') return;
  var lsDraft = function(){ try { var raw = lsGet('nsk14.svdraft'); return raw ? JSON.parse(raw) : null; } catch (e0){ return null; } };   /* (V37.32) */
  if (typeof IDB_BAD !== 'undefined' && IDB_BAD === true){ if ((SVD.bad = (SVD.bad || 0) + 1) <= 6){ setTimeout(svDraftRestore, 5000); return; } svDraftApply(lsDraft()); return; }   /* بعد ستِّ محاولاتٍ: المرآةُ البسيطة */   /* القاعدةُ متعثّرةٌ الآن: لا فتحٌ إضافيٌّ يسبق إعادتها المجدولة — ستُّ محاولاتٍ ثم يُترَك (مؤقّتٌ دائمٌ يُبقي بيئةَ الفحص حيّةً بلا نهاية) */
  idbGet('svDraft').then(function(d){
    if (!d || !d.form || !d.form.site) d = lsDraft();   /* (V37.32) القاعدةُ فارغةٌ أو متعثّرة: المرآة */
    svDraftApply(d);
  }).catch(function(e){ LS_ERR = e; svDraftApply(lsDraft()); });
}
function svDraftApply(d){   /* (V37.32) الاستعادةُ نفسُها — من القاعدة أو من المرآة */
  {
    if (!d || !d.form || !d.form.site) return;
    if (Date.now() - (+d.at || 0) > 86400000){ svDraftClear(); return; }
    if (d.by && STATE.meta && STATE.meta.name && d.by !== STATE.meta.name) return;
    if (!siteFind(d.form.site)){ if ((SVD.tries = (SVD.tries || 0) + 1) < 30) setTimeout(function(){ svDraftApply(d); }, 1000); return; }   /* السجلُّ لم يكتمل بعد: يُعاد بعد ثانية */
    if (FORM.site && SVD.dirty) return;   /* نموذجٌ مفتوحٌ بعملٍ لم يُحفَظ: لا يُكتَب فوقه */
    Object.keys(d.form).forEach(function(k){ if (k === 'photos' && d.form.photos && !Object.keys(d.form.photos).length && FORM.photos && Object.keys(FORM.photos).length) return; FORM[k] = d.form[k]; });
    SVD.dirty = true; CUR = 'svForm'; render(1);
    toast(t('استُعيد المسحُ الذي انقطع — أكمله ثم احفظ'));
  }
}


