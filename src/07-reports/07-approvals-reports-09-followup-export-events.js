/* ═══ تصديرُ ملف المتابعة بقالبه ═══════════════════════════════════════════
   الملفُّ يحسب نفسَه بنفسه: الحالةُ والموقفُ الزمنيُّ والمتبقي والزمنُ المنقضي
   كلُّها معادلاتٌ في القالب. والوحيدُ المكتوبُ بيدٍ هو **نسبةُ الإنجاز** في
   الصفوف الطرفية — فلا يُكتَب غيرُها، ويعيد إكسل حسابَ الباقي عند الفتح.

   ولا يُعاد بناءُ الملف: يُفكُّ القالبُ ويُستبدَل رقمٌ داخلَ خليةٍ قائمة،
   ثم يُعاد كما هو. فالتنسيقُ الشرطيُّ والتعليقاتُ والألوانُ والمعادلاتُ تبقى
   بايتًا ببايت — وإعادةُ البناء تُضيّعها ولو بدت الأرقامُ صحيحة. */

/* الصفُّ الطرفيُّ: نطاقٌ × مرحلة. الأرقامُ من قراءة القالب نفسِه. */
var FUP_ROWS = [
  /* [صفّ, مشعر, نوع, مرحلة] */
  [73,'منى','مخيم','sv'],   [74,'منى','مخيم','asn'], [75,'منى','مخيم','ins'],
  [76,'منى','مخيم','ip'],   [77,'منى','مخيم','ok'],
  [79,'عرفات','مخيم','sv'], [80,'عرفات','مخيم','asn'],[81,'عرفات','مخيم','ins'],
  [82,'عرفات','مخيم','ip'], [83,'عرفات','مخيم','ok'],
  [85,'منى','ممر','sv'],    [86,'منى','ممر','asn'],   [87,'منى','ممر','ins'],
  [88,'منى','ممر','ip'],    [89,'منى','ممر','ok'],
  [91,'عرفات','ممر','sv'],  [92,'عرفات','ممر','asn'], [93,'عرفات','ممر','ins'],
  [94,'عرفات','ممر','ip'],  [95,'عرفات','ممر','ok'],
  [97,'منى','جسر','sv'],    [98,'منى','جسر','asn'],   [99,'منى','جسر','ins'],
  [100,'منى','جسر','ip'],   [101,'منى','جسر','ok'],
  [103,'منى','محطة','sv'],  [104,'منى','محطة','asn'], [105,'منى','محطة','ins'],
  [106,'منى','محطة','ip'],  [107,'منى','محطة','ok'],
  [109,'عرفات','محطة','sv'],[110,'عرفات','محطة','asn'],[111,'عرفات','محطة','ins'],
  [112,'عرفات','محطة','ip'],[113,'عرفات','محطة','ok'],
  [115,'عرفات','بوابة','sv'],[116,'عرفات','بوابة','asn'],[117,'عرفات','بوابة','ins'],
  [118,'عرفات','بوابة','ip'],[119,'عرفات','بوابة','ok'],
  [127,'منى','كاميرا','sv','تفعيل كاميرا قائمة'],[128,'منى','كاميرا','asn','تفعيل كاميرا قائمة'],[129,'منى','كاميرا','ins','تفعيل كاميرا قائمة'],
  [130,'منى','كاميرا','ip','تفعيل كاميرا قائمة'],[131,'منى','كاميرا','ok','تفعيل كاميرا قائمة'],
  /* كاميراتٌ جديدةٌ: تُفرَّق بوجه العمل لا بالنوع — «ترقية كاميرا» */
  [133,'منى','كاميرا','sv','ترقية كاميرا'],  [134,'منى','كاميرا','asn','ترقية كاميرا'],
  [135,'منى','كاميرا','ins','ترقية كاميرا'], [136,'منى','كاميرا','ip','ترقية كاميرا'],
  [137,'منى','كاميرا','ok','ترقية كاميرا'],
  /* الفكُّ: مشعرٌ كامل */
  [158,'منى','*','dis'], [159,'عرفات','*','dis'],
  /* ما يقيسه النظامُ خارجَ نطاقات الميدان */
  [44,'*','*','ipAll'],    /* الترقيمُ وتسجيلُ عناوين الأجهزة الثلاثة */
  [45,'*','*','custody'],  /* التخزينُ وتجهيزُ العُهدة لفرق التركيب */
  [160,'*','*','disJudge'],/* الجردُ وحكمُ سليمٍ أو تالفٍ لكل جهاز */
  [161,'*','*','custBack'],/* إرجاعُ العُهدة والتخزينُ وتقريرُ النسب */
  [151,'*','*','health'],  /* مراقبةُ صحة الأجهزة على مدار الساعة */
  [154,'*','*','esc']      /* التصعيدُ عند التذبذب المتكرر */
];

var FUP_MEMO = null;   /* (V26.1) يُصفَّر مع كلِّ رسمة */
function fupPct(zone, type, stage, work){
  var mk = zone + '|' + type + '|' + stage + '|' + (work || '');
  if (FUP_MEMO && mk in FUP_MEMO) return FUP_MEMO[mk];
  var v = fupPctRaw(zone, type, stage, work);
  if (FUP_MEMO) FUP_MEMO[mk] = v;
  return v;
}
function fupPctRaw(zone, type, stage, work){
  /* مقاييسُ لا تخصُّ نطاقًا بعينه — تُقاس على المشروع كلِّه */
  if (stage === 'ipAll'){
    var ins = Object.keys(STATE.inss || {}).filter(function(k){
      return STATE.inss[k] && STATE.inss[k].status === 'مُركّب'; });
    if (!ins.length) return null;
    var withIp = ins.filter(function(k){
      var x = siteFind(k); return x && x.net && x.ipRtr && x.ipRdr; }).length;
    return Math.round(withIp * 100 / ins.length);
  }
  if (stage === 'custody' || stage === 'custBack'){
    var mv = (STATE.moves || []).filter(Boolean);
    if (!mv.length) return null;
    var out = mv.filter(function(m){ return m && m.kind === 'صرف'; }).length;
    if (stage === 'custody') return out ? 100 : 0;
    var back = mv.filter(function(m){ return m && m.kind === 'إرجاع'; }).length;
    return out ? Math.min(100, Math.round(back * 100 / out)) : null;
  }
  if (stage === 'disJudge'){
    var D = Object.keys(STATE.diss || {}).map(function(k){ return STATE.diss[k]; })
      .filter(function(x){ return x && x.status === 'تم الفك'; });
    if (!D.length) return null;
    return Math.round(D.filter(function(x){ return x.cond; }).length * 100 / D.length);
  }
  if (stage === 'health'){
    var ins2 = Object.keys(STATE.inss || {}).filter(function(k){
      return STATE.inss[k] && STATE.inss[k].approved; });
    if (!ins2.length) return null;
    return Math.round(ins2.length * 100 / Math.max(1, (STATE.sites || []).length));
  }
  if (stage === 'esc'){
    var due = (typeof escDue === 'function') ? escDue() : [];
    var open = Object.keys(STATE.fixreqs || {}).length;
    if (!open && !due.length) return null;
    return open ? Math.round((open - due.length) * 100 / open) : 100;
  }
  var L = (STATE.sites || []).filter(function(x){
    return x.zone === zone && (type === '*' || x.type === type)
      && (!work || x.work === work);
  });
  if (!L.length) return null;              /* لا نقاطَ: لا يُكتَب شيء */
  var n = 0;
  L.forEach(function(x){
    var rec = STATE.recs[x.id], ins = STATE.inss[x.id];
    if (stage === 'sv'  && svVisited(rec)) n++;   /* (V32.6) */
    else if (stage === 'asn' && asnOf(x.id)) n++;
    else if (stage === 'ins' && ins && ins.status === 'مُركّب') n++;
    else if (stage === 'ip'  && x.net && x.ipRtr && x.ipRdr) n++;
    else if (stage === 'ok'  && ins && ins.approved) n++;
    else if (stage === 'dis' && (STATE.diss || {})[x.id]
             && STATE.diss[x.id].status === 'تم الفك') n++;
  });
  return Math.round(n * 100 / L.length);
}

/* قارئُ ZIP بلا ضغط: القالبُ مخزَّنٌ بـSTORE فلا يحتاج فكَّ ضغطٍ ولا مكتبة */
function zipRead(buf){
  var u = new Uint8Array(buf), dv = new DataView(buf), out = [], i = 0;
  while (i < u.length - 4){
    if (dv.getUint32(i, true) !== 0x04034b50) break;
    var nLen = dv.getUint16(i + 26, true), xLen = dv.getUint16(i + 28, true);
    var cSize = dv.getUint32(i + 18, true), method = dv.getUint16(i + 8, true);
    var nameB = u.subarray(i + 30, i + 30 + nLen);
    var name = new TextDecoder().decode(nameB);
    var dStart = i + 30 + nLen + xLen;
    out.push({ name:name, method:method, data:u.subarray(dStart, dStart + cSize) });
    i = dStart + cSize;
  }
  return out;
}
function zipWrite(files){
  var enc = new TextEncoder(), parts = [], central = [], off = 0;
  function crc32(b){
    var c, t = zipWrite._t;
    if (!t){ t = zipWrite._t = []; for (var n = 0; n < 256; n++){ c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } }
    c = 0 ^ (-1);
    for (var j = 0; j < b.length; j++) c = (c >>> 8) ^ t[(c ^ b[j]) & 0xFF];
    return (c ^ (-1)) >>> 0;
  }
  files.forEach(function(f){
    var nb = enc.encode(f.name), crc = crc32(f.data);
    var h = new Uint8Array(30 + nb.length), hv = new DataView(h.buffer);
    hv.setUint32(0, 0x04034b50, true); hv.setUint16(4, 20, true);
    hv.setUint16(8, 0, true); hv.setUint32(14, crc, true);
    hv.setUint32(18, f.data.length, true); hv.setUint32(22, f.data.length, true);
    hv.setUint16(26, nb.length, true);
    h.set(nb, 30);
    parts.push(h, f.data);
    var c = new Uint8Array(46 + nb.length), cv = new DataView(c.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(10, 0, true); cv.setUint32(16, crc, true);
    cv.setUint32(20, f.data.length, true); cv.setUint32(24, f.data.length, true);
    cv.setUint16(28, nb.length, true); cv.setUint32(42, off, true);
    c.set(nb, 46);
    central.push(c);
    off += h.length + f.data.length;
  });
  var cLen = central.reduce(function(a, c){ return a + c.length; }, 0);
  var e = new Uint8Array(22), ev = new DataView(e.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cLen, true); ev.setUint32(16, off, true);
  return new Blob(parts.concat(central, [e]), { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function fupExport(){
  if (!may('exportAll')){ toast(t('التصديرُ ليس من صلاحيتك')); return; }
  toast(t('يُجهَّز ملف المتابعة…'));
  fetch('docs/followup-template.xlsx').then(function(r){
    if (!r.ok) throw new Error('template ' + r.status);
    return r.arrayBuffer();
  }).then(function(buf){
    var files = zipRead(buf);
    if (!files.length) throw new Error('zip');
    var sheet = files.filter(function(f){ return f.name === 'xl/worksheets/sheet1.xml'; })[0];
    if (!sheet) throw new Error('sheet');
    var xml = new TextDecoder().decode(sheet.data), wrote = 0;

    FUP_ROWS.forEach(function(r){
      var pct = fupPct(r[1], r[2], r[3], r[4]);
      if (pct === null) return;
      var ref = 'F' + r[0];
      /* يُستبدَل الرقمُ داخلَ الخلية القائمة — لا تُنشَأ خليةٌ ولا يُمسُّ نمط */
      var re = new RegExp('(<c r="' + ref + '"[^>]*>)(?:<v>[^<]*</v>)?(</c>)');
      if (!re.test(xml)) return;
      xml = xml.replace(re, '$1<v>' + pct + '</v>$2');
      wrote++;
    });

    sheet.data = new TextEncoder().encode(xml);
    var blob = zipWrite(files);
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'متابعة-أفاقي-' + todayISO() + '.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    logEvent('تصدير ملف المتابعة — ' + wrote + ' صفًّا');
    toast(nm(wrote) + ' ' + t('صفًّا حُدِّث — الباقي يحسبه إكسل عند الفتح'));
  }).catch(function(e){
    softErr('ملف المتابعة', e, 'تعذّر تجهيزُ ملف المتابعة — جرّب مع اتصال');
  });
}





/* ═══ سجلُّ الأحداث ═══
   كان يعرض خمسةَ أسطرٍ ثابتةً من بيانات العرض لا السجلَّ الحقيقي — فالأثرُ
   التدقيقيُّ يُكتَب ولا يُقرأ، ومن سأل «من حذف هذه الصورة؟» لم يجد جوابًا.
   والحدثُ نصٌّ حر، فنوعُه يُشتقُّ من مفتتحه لا يُخزَّن معه. */
var EV_KINDS = [
  ['مسح',    /^مسح موقع|^تعذّر الوصول/],
  ['تركيب',  /^تركيب|^إتمام تركيب|^مسودّة تركيب/],
  ['اعتماد', /^اعتماد|^ردّ |^رُدّ/],
  ['فك',     /فك —|^جدولة فك/],
  ['صور',    /صورة/],
  ['حسابات', /^حساب|^طلب إضافة شركة/],
  ['مواقع',  /^موقع جديد/],
  ['مخزون',  /^عهدة|^صرف|^توريد|^شراء|^مشترى/],
  ['مال',    /^مستخلص|^ميزانية|^خط أساس/],
  ['نظام',   /^استيراد|^تصدير|^إعداد|^مزامنة/]
];
function evKind(what){
  var w = String(what || '');
  for (var i = 0; i < EV_KINDS.length; i++) if (EV_KINDS[i][1].test(w)) return EV_KINDS[i][0];
  return 'أخرى';
}
/* تصنيفُ الحوكمة: عدسةٌ أخرى فوق نفس الأحداث — لا «أيّ قسم» بل «أيّ فعل».
   كانت شاشةً منفصلةً (سجل التدقيق) تكرّر سجل الأحداث بمصفوفتها الخاصة —
   صارت فلاتر جاهزةً هنا فلا يُفتَح سجلٌّ ثانٍ لنفس البيانات. */
/* ═══ التصنيفُ بالفعل لا بكلمةٍ عابرة (V17.31) ═══
   كان «مالي» أوّلَ القائمة ونمطُه يشمل كلمةَ «اعتماد» — وكلُّ إشعارِ زيارةٍ
   ينتهي بـ«بانتظار اعتمادك». فصُنِّفت ثلاثُمئةٍ وإحدى وأربعون زيارةً مالًا،
   وقُرئت الشاشةُ على أن المشروعَ يصرف وهو يمسح. فصار التصنيفُ بالفعل نفسِه:
   أخصُّ الأنماط أولًا (زيارةٌ · تركيبٌ · فكٌّ · صورةٌ · مهمة)، ثم القرارُ
   (اعتمادٌ · ردٌّ ورفض)، ثم المالُ بكلماته وحدَه لا بكلمةٍ يشترك فيها مع
   غيره، ثم التعديلُ والدخول. والمالُ يُطابَق بما لا يقع إلا فيه: مشترياتٌ
   ومبلغٌ وسعرٌ وميزانيةٌ ومستخلصٌ وريال. */
var EV_CATS = [
  /* الردُّ قرارٌ لا زيارة — يُفحَص قبلها فلا تبتلعه كلمةُ «زيارة» فيه */
  ['رفض وحذف',  /رُدّت|رُفض|رفض|أُلغي|حُذف|شُطب|تراجعٌ عن ردّ/],
  ['زيارة',     /^زيارة|زيارة تمّت|مسح ميداني|تعذّر الوصول/],
  ['تركيب',     /^تركيب|رُكّب|تجميع|إعداد تركيب|حلّ تركيب/],
  ['فكّ',       /^فك|فكّ|إرجاعُ عهدة|جدولة فك/],
  ['صور',       /صورة|صور /],
  ['مهام',      /إسناد|مهمة|مهامّ|جدولة/],
  ['مخزون',     /مخزون|عهدة|شحنة|صرف قطع|استلام/],
  ['مالي',      /مشتر|مبلغ|سعر|ميزانية|مستخلص|ريال|فاتورة|حافز/],
  ['اعتماد',    /اعتُمد|اعتمادُ|الاعتماد|مُنحت|صُدِّق/],
  ['تعديل',     /عُدّل|تعديل|تغيير|حُدِّث/],
  ['حسابات',    /حساب|كلمة المرور|صلاحية|دور/],
  ['دخول',      /دخول|خروج|جلسة/]
];
function evCat(what){
  var w = String(what || '');
  for (var i = 0; i < EV_CATS.length; i++) if (EV_CATS[i][1].test(w)) return EV_CATS[i][0];
  return '';
}
function evPillKind(what){
  var w = String(what || '');
  if (/اعتُمد|مُنحت/.test(w)) return 'ok';
  if (/حُذف|رُفض|شُطب|سُحبت/.test(w)) return 'off';
  if (/عُدّل|تعديل|تغيير|حُدِّث/.test(w)) return 'warn';
  return 'off';
}
var EVF = { kind:'', by:'', from:'', to:'', q:'', cat:'' };

/* ═══ الأثرُ يُقرأ من القاعدة لا من الجهاز ═══
   كان `STATE.events` ذاكرةَ هذا الجهاز وحدَه: يفتح مديرُ المشروع السجلَّ فيرى
   حدثًا واحدًا — دخولَه هو — وقد كتب الفريقُ مئاتِ الأحداث. والأثرُ يُرفَع منذ
   V15 إلى «events» وما كان يُقرَأ. فصار المكتبُ يسحبه ويُدمَج بما على الجهاز
   بلا تكرار: ما رُفع وما لم يُرفَع بعدُ في قائمةٍ واحدةٍ مرتّبةٍ بالزمن. */
/* ═══ السجلُّ من القاعدة لا من ذاكرة الجلسة (V17.27) ═══
   الأحداثُ لا تُحفَظ على الجهاز (هي أثرٌ لا بيانات عمل)، والسحبُ الفارقيُّ
   يجلب ما كُتب بعد المؤشِّر وحدَه — فمع كلِّ إعادةِ تحميلٍ تُفرَّغ الشاشةُ
   وتقول «كل الأحداث ١»، والأثرُ كلُّه في القاعدة سليمٌ لا يُرى. فصارت
   الشاشةُ تجلب آخرَ خمسمئةِ حدثٍ مرةً عند فتحها إن كان ما بيدها قليلًا —
   بسقفٍ، ويُحصى في عدّاد القراءات، ولا يُعاد في الجلسة نفسِها. */
var EV_FETCHED = 0, EV_FETCHING = false, EV_MORE = false, EV_PAGE = 500;
/* ═══ الأثرُ كلُّه متاحٌ — على دفعاتٍ لا دفعةً واحدة (V17.28) ═══
   «آخرُ خمسمئة» كانت سقفَ أمانٍ لا حدَّ الأثر: الأثرُ كلُّه في القاعدة، وسحبُه
   جملةً قراءاتٌ بلا داعٍ وذاكرةٌ تُملأ بما لا يُقرأ. فصار على دفعات: خمسُمئةٍ
   عند الفتح، وزرٌّ يُنزِل الأقدمَ خمسَمئةٍ بعد خمسمئة ما دام هناك أقدم؛
   وإن حُدِّد مدًى بالتاريخ في التصفية جُلب **ذلك المدى بعينه** من القاعدة —
   فتُقرأ فترةٌ قديمةٌ بلا المرور بكلِّ ما بعدها. */
function evFetch(force, mode){
  if (!FB.ready || !FB.db || EV_FETCHING) return;
  if (!force && !mode && EV_FETCHED) return;
  EV_FETCHING = true;
  var q = DB.col('events').orderBy('ts', 'desc');
  var ranged = false;
  if (mode === 'site' && /^NSK-/i.test(String(EVF.q || '').trim())){   /* (V30.8) تاريخُ نقطةٍ كاملًا — حقلٌ واحدٌ بلا ترتيبٍ فلا يحتاج فهرسًا مركّبًا */
    ranged = true; q = DB.col('events').where('site', '==', String(EVF.q).trim());
  } else if (mode === 'range' && (EVF.from || EVF.to)){
    ranged = true;
    if (EVF.to)   q = q.where('ts', '<=', Date.parse(EVF.to));
    if (EVF.from) q = q.where('ts', '>=', Date.parse(EVF.from));
  } else if (mode === 'older'){
    var oldest = evAll().reduce(function(m, e){ return (e.ts && e.ts < m) ? e.ts : m; }, Infinity);
    if (isFinite(oldest)) q = q.where('ts', '<', oldest);
  }
  q.limit(EV_PAGE).get().then(function(sn){
    if (!STATE.evlog) STATE.evlog = {};
    sn.forEach(function(dd){ STATE.evlog[dd.id] = dd.data(); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    EV_MORE = !ranged && sn.size >= EV_PAGE;     /* امتلأت الدفعةُ؟ فثمّةَ أقدمُ منها */
    EV_FETCHED = Date.now(); EV_FETCHING = false;
    toast(nm(sn.size) + ' ' + t('حدثًا جُلبت') + (EV_MORE ? ' — ' + t('وثمّةَ أقدم') : ''));
    if (CUR === 'ev') render(1);
  }).catch(function(e){
    EV_FETCHING = false; EV_FETCHED = Date.now();
    softErr('جلب السجل', e, '');
  });
}
/* ═══ الفاعلُ يُقرأ من نصِّ الحدث حين لا يحمله حقلُه (V17.29) ═══
   الأحداثُ المكتوبةُ قبل وسم الفاعل تحمل اسمَ صاحب الجهاز في حقل «من»،
   واسمُ الفاعل الحقيقيِّ **مكتوبٌ في نصِّها**: «إشعار — زيارة تمّت ·
   NSK-MIN-CMP-0149 · عمار حسين احمد عميش — بانتظار اعتمادك». ولا يجوز أن
   يُكتَب على الوثيقة المخزَّنة اسمٌ لم تُكتَب به — تزويرٌ في سجلِّ تدقيق.
   فيُقرأ للعرض فقط: إن ذُكر في النصِّ اسمُ حسابٍ من حسابات النظام غيرِ
   صاحب الجهاز فهو الفاعل، ويُقال إنه مقروءٌ من النصّ لا مختومٌ في الحقل. */
var EV_NAMES = null, EV_NAMES_V = 0;
function evNames(){
  var n = Object.keys(STATE.users || {}).length;
  if (EV_NAMES && EV_NAMES_V === n) return EV_NAMES;
  EV_NAMES_V = n;
  EV_NAMES = Object.keys(STATE.users || {}).map(function(k){ return (STATE.users[k] || {}).name || ''; })
    .filter(function(x){ return x && x.length > 3; })
    .sort(function(a, b){ return b.length - a.length; });   /* الأطولُ أولًا فلا يبتلعه جزءٌ منه */
  return EV_NAMES;
}
function evActor(e){
  var by = String((e && e.by) || ''), txt = String((e && e.what) || '');
  var mine = STATE.meta.name || '';
  if (by && by !== mine) return { name:by, from:'field' };
  var L = evNames();
  for (var i = 0; i < L.length; i++){
    if (L[i] !== mine && txt.indexOf(L[i]) > -1) return { name:L[i], from:'text' };
  }
  return { name:by || '', from:'field' };
}
function evAll(){
  var byId = {}, out = [];
  (STATE.events || []).forEach(function(e){ if (e && e.id && !byId[e.id]){ byId[e.id] = 1; out.push(e); } });
  var C = STATE.evlog || {};
  Object.keys(C).forEach(function(k){
    var e = C[k]; if (!e || byId[e.id || k]) return;
    byId[e.id || k] = 1;
    out.push({ id:e.id || k, ts:e.ts || e._at || 0, at:e.at || '', day:e.day || '',
               what:e.what || '', by:e.by || '', dev:e.dev || '' });
  });
  return out.sort(function(a, b){ return (b.ts || 0) - (a.ts || 0); });
}
/* (V30.8) فكرةُ المالك #٨: البحثُ في سجلّ التدقيق بلا تشكيلٍ ولا حالةِ حروف، وفي النصِّ والنقطةِ والفاعل —
   و«سجلُّ النقطة» من نافذتها يجلب تاريخَها كلَّه من القاعدة لا من المحمَّل وحدَه */
function evNorm(v){ return String(v == null ? '' : v).replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase(); }
function evSiteHistory(id){ goPage('ev'); EVF = { kind:'', by:'', from:'', to:'', q:id, cat:'' }; PG_Q = id; PG_KEEP = true; render(1); evFetch(true, 'site'); }   /* صندوقُ رأس الصفحة يقود EVF.q (PG_BIND) — فيُملأ هو أيضًا */
function evRows(){
  var L = evAll();
  return L.filter(function(e){
    if (EVF.kind && evKind(e.what) !== EVF.kind) return false;
    if (EVF.cat && evCat(e.what) !== EVF.cat) return false;
    if (EVF.by && evActor(e).name !== EVF.by) return false;   /* بالفاعل لا بصاحب الجهاز */
    if (EVF.q){ var nq = evNorm(EVF.q); if ((evNorm(e.what) + ' ' + evNorm(e.site) + ' ' + evNorm(e.by) + ' ' + evNorm(evActor(e).name)).indexOf(nq) < 0) return false; }   /* (V30.8) النصُّ والنقطةُ والفاعل */
    /* التاريخُ والوقتُ معًا: `from` و`to` بصيغة datetime-local */
    if (EVF.from && e.ts < Date.parse(EVF.from)) return false;
    if (EVF.to   && e.ts > Date.parse(EVF.to))   return false;
    return true;
  });
}




