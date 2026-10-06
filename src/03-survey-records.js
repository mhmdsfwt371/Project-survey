
/* ═══ ما سجّله الميدانُ يُقرأ بالعين المجرّدة (V16.89) ═══
   الوزارةُ تقيّم النقطةَ من بطاقتها: لا تفتح نموذجَ المسح ولا تملك زرَّه.
   فتُعرَض حقولُ الزيارة كما كُتبت — ما مُلئ منها فقط — وتحتها الصورُ
   والتحدياتُ والملاحظة. ولا زرَّ في الطبقة إلا الاعتماد: تقنيٌّ للمهندس
   واعتمادُ الوزارة لها — فلا يُعرَض على أحدٍ زرٌّ ليس من شأنه في هذه الشاشة. */
var SV_LABELS = {
  access:'الوصول', mount:'نوع التركيب', power:'مصدر الكهرباء', power_src:'مصدر الطاقة',
  power_note:'ملاحظةُ الكهرباء', power_yn:'كهرباءُ الموقع', pdist:'بُعدُ مصدر الكهرباء',
  p24:'تيارٌ ٢٤ ساعة', height:'الارتفاع (م)', cable:'الكابل (م)',
  len_m:'الطول المتاح (م)', wid_m:'العرض المتاح (م)', hgt_m:'الارتفاع المتاح (م)',
  fit:'مناسبٌ للتركيب؟', tents:'عددُ الخيام', gates:'عددُ البوابات', corr_w:'عرضُ الممر',
  kits:'الأطقم', kits_done:'الأطقمُ المنفَّذة', jam_pos:'موضعُ الجمرات',
  old_base:'قاعدةٌ قديمة', old_cable:'كابلٌ قديم', old_net:'شبكةٌ قديمة',
  cam_ok:'الكاميرا سليمة', router_sp:'سرعةُ الراوتر', metal:'العارضةُ الحديدية',
  n_ant:'الهوائيات', n_rdr:'القارئات', n_cam:'الكاميرات', n_sens:'الحساسات',
  civil:'أعمالٌ مدنية', equip:'المعدّات', hours:'ساعاتُ العمل', crew_n:'عددُ الفريق',
  chal_note:'تفصيلُ التحدي', note:'ملاحظةُ الميدان'
};
var SV_ORDER = ['access','mount','power','power_src','power_yn','pdist','p24','power_note',
  'len_m','wid_m','hgt_m','fit','height','cable','tents','gates','corr_w','jam_pos','metal',
  'n_ant','n_rdr','n_cam','n_sens','kits','kits_done','old_base','old_cable','old_net',
  'cam_ok','router_sp','civil','equip','hours','crew_n','chal_note','note'];
/* ═══ النصوصُ المكتوبةُ عن النقطة — أينما كُتبت (V16.93) ═══
   الوزارةُ تسأل «قال إيه؟» لا «كم المقاس؟». والنصوصُ متفرّقةٌ: ملاحظةُ
   الزيارة وتفصيلُ التحدي وملاحظةُ الكهرباء وسببُ الردِّ للزيارة وملاحظةُ
   الوزارة وملاحظةُ التركيب — كلٌّ في مكانه، ولا يجمعها شيء. فتُجمَع هنا
   بمصادرها: من كتبها وفي أيِّ خطوةٍ — فيُقرأ الخبرُ كلُّه في موضعٍ واحد. */
function svTexts(id){
  var r = STATE.recs[id] || {}, ins = STATE.inss[id] || {}, out = [];
  var add = function(src, txt, who, at){
    txt = String(txt == null ? '' : txt).trim();
    if (txt) out.push({ src:src, txt:txt, who:who || '', at:at || 0 });
  };
  add('ملاحظةُ الميدان', r.note, r.by, r.at);
  add('تفصيلُ التحدي', r.chal_note, r.by, r.at);
  add('ملاحظةُ الكهرباء', r.power_note, r.by, r.at);
  add('سببُ إعادة الزيارة', r.revisitNote, r.revisitBy, r.revisitAt);
  add('ملاحظةُ الوزارة', r.minNote, r.minBy, r.minAt);
  add('ملاحظةُ التركيب', ins.note, ins.by, ins.at);
  add('سببُ تعذُّر الوصول', r.access && r.access !== 'تم الوصول' ? r.accessWhy || '' : '', r.by, r.at);
  return out;
}
function svFieldRows(r){
  if (!r) return '';
  var out = '';
  SV_ORDER.forEach(function(k){
    var v = r[k];
    if (v === '' || v === null || v === undefined) return;
    if (typeof v === 'number' && !isFinite(v)) return;
    /* صفٌّ كصفوف البطاقة — وkv دالةٌ محليةٌ في popHtml لا تُرى من هنا */
    out += '<div><span class="k">' + esc(t(SV_LABELS[k] || k)) + '</span><span>' + esc(t(String(v))) + '</span></div>';
  });
  return out;
}
var BRIEF_C  = { 'تمام':'#3AD6A0', 'تحدٍّ':'#E05252', 'ملاحظة':'#E8C34B' };
function briefOf(id){
  var r = STATE.recs[id];
  if (!r) return null;
  var st = String(r.bst || '').trim(), d = String(r.brief || '').trim();
  if (!st && !d) return null;
  return { st:st || 'ملاحظة', d:d, by:r.briefBy || r.by || '', at:r.briefAt || r.at || 0 };
}
/* ═══ لونُ الطبقة = مرحلةُ الاعتماد (V16.90) ═══
   كانت النقاطُ تُلوَّن بحالة السطر المكتوب — وأكثرُها بلا سطرٍ بعد، فصارت
   الشاشةُ رماديةً كلَّها ولا يُرى فيها ما اعتُمد تقنيًّا وينتظر الوزارةَ من
   غيره. والوزارةُ تفتح هذه الطبقةَ لتعرف **أين تقف كلُّ نقطةٍ من الاعتماد**
   لا لتعرف من كتب سطرًا. فصار اللونُ للمرحلة، والسطرُ المكتوبُ يُقرأ في
   إطار النقطة: حافّةٌ حمراءُ لما فيه تحدٍّ وخضراءُ لما هو تمام — فيُقرأ
   الخبران معًا بلا لبس. */
var BRIEF_STAGE = {
  none:    { c:'#6B7A87', n:'لم تُزر بعد' },
  blocked: { c:'#E07B39', n:'تعذّر الوصول' },
  revisit: { c:'#C77DFF', n:'رُدّت لزيارةٍ أخرى' },
  tech:    { c:'#4FA3FF', n:'تنتظر الاعتمادَ التقني' },
  ret:     { c:'#E05252', n:'أعادتها الوزارةُ بملاحظة' },
  min:     { c:'#E8C34B', n:'اعتُمدت تقنيًّا — تنتظر الوزارة' },
  ok:      { c:'#3AD6A0', n:'اعتمدتها الوزارة' }
};
var BRIEF_STAGE_ORDER = ['none','blocked','revisit','tech','ret','min','ok'];
function briefStage(id){
  var r = STATE.recs[id];
  if (!r) return 'none';
  if (svReview(r) === 'revisit') return 'revisit';
  /* نزل إليها ولم يصل: خبرٌ يُرى بلونه لا نقطةٌ غائبة */
  if (r.access && r.access !== 'تم الوصول') return 'blocked';
  if (!svDone(r)) return 'none';
  var rv = svReview(r);
  if (rv !== 'approved') return 'tech';
  var ms = minState(r);
  if (ms === 'returned') return 'ret';
  return ms === 'approved' ? 'ok' : 'min';
}
function briefColor(id){ return (BRIEF_STAGE[briefStage(id)] || BRIEF_STAGE.none).c; }
/* الإطار: خبرُ السطر المكتوب — ولا إطارَ مميّزًا لمن لم يُكتَب له */
function briefRing(id){
  var b = briefOf(id);
  return b ? (BRIEF_C[b.st] || '#E8C34B') : '';
}
function briefMay(){ var r = effRole(ROLE); return rankOf(r) >= 90 || r === 'viewer' || may('edit'); }
function briefSet(id, st, d){
  if (!briefMay()){ toast(t('التفاصيلُ المختصرة للميدان والمهندس والوزارة')); return false; }
  var r = STATE.recs[id];
  if (!r){ toast(t('تُكتَب بعد نزول الميدان إلى النقطة')); return false; }
  if (st) r.bst = st;
  if (d !== null && d !== undefined) r.brief = String(d).trim();
  r.briefBy = STATE.meta.name || ''; r.briefAt = Date.now();
  CORE.set('recs', id, r);
  logEvent('تفاصيل مختصرة — ' + id + (st ? ' · ' + st : ''), id);
  toast(t('حُفظت التفاصيل')); render(1);
  if (MAP) mapPaint();
  return true;
}

/* ── النقاط: كلُّ عملٍ وزنُه من الإعدادات ── */
/* ═══ عرضُ أسماء البيانات بلغة القارئ ═══
   اسمُ شخصٍ أو شركةٍ لا يُترجَم — يُنقحَر. «محمد صفوت» لا يصير شيئًا آخر
   بالإنجليزية، بل يُكتَب بحروفها: Mohamed Safwat — كما في جواز السفر.
   ولا يحتاج شبكةً ولا خدمةً: النقحرةُ حسابٌ محليٌّ يجري في اللحظة، فمن
   يُضاف غدًا يُقرأ بالإنجليزية فورَ إضافته بلا تدخّلٍ من أحد.

   والأرديةُ تُكتَب بالحرف العربيِّ نفسِه — فالاسمُ يُقرأ كما هو ولا يُمَسّ.

   وحين تخطئ النقحرةُ في اسمٍ بعينه — وهي تخطئ، فالعربيةُ لا تكتب الحركات —
   يُكتَب الصوابُ مرةً في «الإعدادات ← أسماءُ العرض» فيثبت لكلِّ من يقرأ. */

/* أسماءٌ شائعةٌ لها كتابةٌ لاتينيةٌ متعارَفةٌ لا تُشتقّ بالحرف */
var NAME_FIX = {
  'محمد':'Mohamed', 'أحمد':'Ahmed', 'احمد':'Ahmed', 'محمود':'Mahmoud',
  'عبدالله':'Abdullah', 'عبد الله':'Abdullah', 'عبدالرحمن':'Abdulrahman',
  'عبد الخالق':'Abdulkhaliq', 'خالد':'Khaled', 'سعد':'Saad', 'فهد':'Fahd',
  'ماجد':'Majed', 'طارق':'Tarek', 'ياسر':'Yasser', 'مصطفى':'Mostafa',
  'إبراهيم':'Ibrahim', 'ابراهيم':'Ibrahim', 'علي':'Ali', 'عمر':'Omar',
  'عمرو':'Amr', 'حسن':'Hassan', 'حسين':'Hussein', 'سليمان':'Suleiman',
  'سمير':'Samir', 'تامر':'Tamer', 'بدر':'Badr', 'أنس':'Anas', 'انس':'Anas',
  'علاء':'Alaa', 'عوض':'Awad', 'سعيد':'Saeed', 'أسامة':'Osama', 'اسامة':'Osama',
  'بلال':'Bilal', 'عدنان':'Adnan', 'رضوان':'Radwan', 'سهيل':'Suhail',
  'حكيم':'Hakim', 'حمود':'Hamoud', 'غريب':'Ghareeb', 'سليم':'Salim',
  'صفوت':'Safwat', 'عزام':'Azzam', 'عرفة':'Arafa', 'إقبال':'Iqbal',
  'اقبال':'Iqbal', 'إكرام':'Ikram', 'اكرام':'Ikram', 'شركة':'Company',
  'مؤسسة':'Est.', 'مكتب':'Office', 'فندق':'Hotel', 'مجموعة':'Group',
  'السعيد':'Al-Saeed', 'الراجحي':'Al-Rajhi', 'الأمانة':'Al-Amanah',
  'أرسلان':'Arslan', 'ارسلان':'Arslan', 'حفيظ':'Hafeez', 'مشير':'Musheer',
  'برويز':'Parvez', 'زيشان':'Zeeshan', 'فيزان':'Faizan', 'شهداب':'Shahdab',
  'شهويز':'Shahwaiz', 'راجابابو':'Rajababu', 'عاقب':'Aqib', 'وحيد':'Waheed',
  'بصرور':'Basrour', 'حسيب':'Haseeb', 'فرمان':'Farman', 'سيد':'Syed',
  'آل':'Al', 'مسؤول':'Officer', 'سلامة':'Safety', 'النور':'Al-Noor',
  'الحرم':'Al-Haram', 'محل':'Store', 'ضيوف':'Guests', 'البيت':'Al-Bayt',
  'الرفادة':'Al-Rifada', 'رفاد':'Rifad', 'الزوار':'Al-Zowar', 'دليل':'Daleel',
  'بشرى':'Bushra', 'الضيافة':'Al-Diyafa', 'مشارق':'Mashareq', 'الماسية':'Al-Masiya',
  'إكرام الضيف':'Ikram Al-Dhaif', 'الخطوط':'Airlines', 'السعودية':'Saudi',
  'رحلات':'Rehlat', 'ومنافع':'Wa-Manafe', 'ابراج':'Abraj', 'مكه':'Makkah'
};

/* جدولُ النقحرة — حرفًا حرفًا، وما لا مقابلَ له يسقط */
var TRANSLIT = {
  'ا':'a','أ':'a','إ':'i','آ':'aa','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h',
  'خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d',
  'ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m',
  'ن':'n','ه':'h','ة':'a','و':'w','ؤ':'w','ي':'y','ى':'a','ئ':'y','ء':'',
  'ٱ':'a','ـ':'', 'َ':'a','ُ':'u','ِ':'i','ّ':'','ْ':'','ً':'an','ٌ':'un','ٍ':'in'
};

function translitWord(w){
  if (NAME_FIX[w]) return NAME_FIX[w];
  var out = '', i = 0;
  /* «ال» التعريفُ تُكتَب Al- كما هو متعارَف */
  if (w.length > 3 && w.slice(0, 2) === 'ال'){ out = 'Al-'; i = 2; }
  for (; i < w.length; i++){
    var c = w[i];
    out += (TRANSLIT[c] !== undefined) ? TRANSLIT[c] : c;
  }
  /* أولُ حرفٍ لاتينيٍّ يُرفَع، وبعد الشرطة كذلك */
  return out.replace(/(^|-)([a-z])/g, function(m, a, b){ return a + b.toUpperCase(); });
}

/* اسمُ العرض: عربيٌّ كما هو، وأرديٌّ كما هو (نفسُ الحرف)، وإنجليزيٌّ
   بالتصحيح المحفوظ إن وُجد وإلا بالنقحرة. */
/* ═══ اسمُ الشركة بلغة الواجهة ═══
   الأسماءُ عربيةٌ في القاعدة — وهي المفتاحُ الذي تُربَط به النقاطُ والمحاضرُ
   ودفترُ الجوالات، فلا تُبدَّل. وإنما يُبدَّل ما يُعرَض: بالعربية كما هو،
   وبالإنجليزية نقحرةً أو تصحيحًا يدويًّا من «أسماء العرض». والأرديةُ تقرأ
   الإنجليزيَّ لا العربيَّ — فالقارئُ بالأردية لا يقرأ العربيةَ بالضرورة،
   وحروفُها اللاتينيةُ أقربُ إليه من حروفٍ لا يعرفها.
     coName للعرض وحدَه — والقيمةُ المخزَّنةُ في السمات والمنتقيات تبقى
   عربيةً، وإلا لم تُطابَق نقطةٌ بشركتها. */
function coName(c){
  if (!c || typeof c !== 'string') return c;
  if (LANG === 'ar') return c;
  if (!/[؀-ۿ]/.test(c)) return c;
  var fix = (CFG.nameEn || {})[c];
  if (fix) return fix;
  return c.split(/\s+/).map(translitWord).join(' ');
}
function dispName(s){
  if (!s || typeof s !== 'string') return s;
  if (LANG === 'ar') return s;
  if (!/[\u0600-\u06FF]/.test(s)) return s;
  var fix = (CFG.nameEn || {})[s];
  if (fix) return fix;
  return s.split(/\s+/).map(translitWord).join(' ');
}

function catLabel(x){
  var d = CAT_DEF[x.type];
  return d ? t(d.l) : t(x.type);   /* التصنيفُ يُقرأ بلغة الواجهة (V17.45) */
}
/* الاسمُ الوصفيُّ بأيقونته لنوعٍ خام: «محطة» تُقرأ «\u{1F686} محطات القطار».
   التقاريرُ كانت تعرض النوعَ الخام فيقرأ الناظرُ «بوابة» ولا يعرف أنها
   مسجد نمرة، و«جسر» ولا يعرف أنها الجمرات. */
function typeLabel(ty){
  var d = CAT_DEF[ty];
  return d ? (d.i + ' ' + t(d.l)) : (ty || '\u2014');
}

function ptsSurvey(x){
  var v = cfgGet('w', x.zone + '|' + catLabel(x));
  if (v) return v;
  /* لا وزنَ مضبوطٌ لهذا الصنف — يُقدَّر بوزن نوعه العام إن وُجد */
  return cfgGet('w', catLabel(x));
}

function ptsInstall(x){
  var ins = STATE.inss[x.id];
  /* إن عُرفت قطعُه حُسبت نقاطُها، وإلا فنقاطُ النقطة الكاملة تقديرًا */
  if (ins && ins.pts) return ins.pts;
  var byParts = 0;
  if (ins && ins.parts) Object.keys(ins.parts).forEach(function(k){
    byParts += cfgN(ins.parts[k]) * itPts(k);
  });
  if (byParts) return byParts;
  /* الحلُّ المعتمدُ يُقدِّر ما سيُركَّب قبل أن يُركَّب: كان يُكتَب في
     `solution.items` بينما ptsInstall تقرأ `parts` التي لا تُملأ إلا عند
     التركيب الفعلي — فنقطةٌ حلُّها معتمدٌ بخمس عشرة قطعةً كانت تساوي
     صفرًا في الجدولة والتقدير، ويُخطَّط الموسمُ على وزنٍ عام. */
  if (ins && ins.solution && ins.solution.status === 'معتمد' && ins.solution.items){
    var bySol = 0;
    Object.keys(ins.solution.items).forEach(function(k){
      bySol += cfgN(ins.solution.items[k]) * itPts(k);
    });
    if (bySol) return bySol;
  }
  /* وزنُ النوع نفسِه إن ضُبط — فمحطةُ القطارِ ليست مخيمًا ولا ممرًّا، وكان
     كلُّ ما ليس مخيمًا يأخذ وزنَ الممر. وإن لم يُضبط رجع للوزن القديم
     (insCamp/insCor) فلا ينكسر ما ضُبط قبل هذا الإصدار. */
  var byType = cfgGet('insType', x.type);
  if (byType) return byType;
  return siteZone(x) === 'cor' ? cfgGet('insCor') : cfgGet('insCamp');
}

function ptsDis(x){
  var base = cfgGet('dw', x.zone + '|' + catLabel(x)) || cfgGet('dw', catLabel(x));
  var r = STATE.diss ? STATE.diss[x.id] : null;
  var f = (r && r.cond === 'تالف') ? cfgGet('disBad') : cfgGet('disOk');
  return base * (f || 1);
}

/* مجموعُ نقاطِ ما حُدِّد — يُعرَف قبل الإسناد */
function selPts(){
  var n = 0, L = LAYER();
  selIds().forEach(function(id){
    var x = siteFind(id);
    if (x) n += L.pts(x);
  });
  return Math.round(n * 100) / 100;
}

/* ── إحصاءُ الطبقة ── */
function layerStats(mode){
  var L = LAYERS[mode || FIELD_MODE] || LAYERS.survey;
  var pool = 0, ready = 0, done = 0, asn = 0, ptsReady = 0, ptsDone = 0;
  for (var i = 0; i < STATE.sites.length; i++){
    var x = STATE.sites[i];
    if (!L.pass(x)) continue;
    pool++;
    var p = L.pts(x);
    if (L.done(x)){ done++; ptsDone += p; }
    else { ready++; ptsReady += p; }
    /* المُسنَدُ في هذه الطبقة: إسنادٌ من نوعها هي — كان أيُّ إسنادٍ مفتوحٍ
       على النقطة يُعَدُّ في كلِّ طبقة، فيُقال «مُسنَد» في الفكِّ عن نقطةٍ
       إسنادُها تركيبٌ لم يُغلَق. */
    if (taskKindOf(x.id, L.kind)) asn++;
  }
  return { pool:pool, ready:ready, done:done, asn:asn,
           ptsReady:Math.round(ptsReady), ptsDone:Math.round(ptsDone),
           ptsAll:Math.round(ptsReady + ptsDone) };
}

/* الخريطةُ تُرشِّح بالطبقة ثم بالتصنيف */
function layerFiltered(){
  var L = LAYER();
  var base = (MY_ONLY || isCrewRole(ROLE)) ? mineFiltered() : filtered();
  return base.filter(function(x){ return L.pass(x); });
}

/* ── شريطُ الطبقة على الخريطة ── */
function layerBar(){
  var L = LAYER(), S = layerStats();
  return '<div class="map-layerbar">'
    + '<span class="lb-t" style="color:' + L.c + '">' + L.i + ' ' + esc(t(L.n)) + '</span>'
    + '<span class="lb-n"><b>' + nm(S.ready) + '</b> ' + esc(t('جاهز')) + '</span>'
    + '<span class="lb-n">' + nm(S.done) + ' ' + esc(t('تمّ')) + '</span>'
    + (S.ptsAll ? '<span class="lb-n">' + nm(S.ptsReady) + ' ' + esc(t('وزن')) + '</span>' : '')
    /* QA: كانت الكلمةُ خارج الرقم فتُركَّب الجملةُ بالجمع وتنكسر بالإنجليزية
       («1,787 outside the view Offered») — صار النصُّ كلُّه يُبنى في موضعٍ واحد */
    + '<span class="lb-c"><span class="num" id="mapCount">\u2014</span></span>'
    + '</div>';
}

/* ── لوحُ الطبقة: يُظهر ما ينقص قبل أن يُجدوَل ── */
PAGE.tfwdraw = { m:'الميدان', t:'رسم المسارات من وإلى الجمرات', l:'ارسم بيدك على الخريطة مسارَ كلِّ دورٍ ذهابًا وعودة — يلتصق بالشوارع ويُعرَض على الأجهزة كلِّها بدل المولَّد.',
  body:function(){
    var D = tfdDrawn(), rows = [], drawnBy = (CFG.tfwdraw && CFG.tfwdraw.by) || '', meta = STATE.meta || {};
    TFW_FL.forEach(function(n, f){ ['go', 'back'].forEach(function(d){ var pls = (D[f] && D[f][d]) || [], m = Math.round(tfdLen(pls));
      rows.push([esc(t(floorName(f))), esc(t(d === 'go' ? 'الذهاب' : 'العودة')), pls.length ? pill(nm(pls.length) + ' ' + t('خط') + ' \u00b7 ' + nm(m) + ' ' + t('م'), 'ok') : pill(t('المولَّد من المخطّط'), 'wrn'),
        (tfdMay() ? btn('\u270F ' + t('ارسم على الخريطة'), 'btn-secondary btn-sm', ' data-tfdgo="' + f + '|' + d + '"') + (pls.length ? ' ' + btn('\u2715 ' + t('احذف المرسوم'), 'btn-quiet btn-sm', ' data-tfdclear="' + f + '|' + d + '"') : '') : '')]); }); });
    return card('\u{1F6B6} ' + t('كيف أرسم؟'), '<ol class="hint" style="margin:0;padding-inline-start:18px"><li>' + esc(t('اختر الدور والاتجاه ثم «ارسم على الخريطة» — تُفتَح الخريطةُ وعليها مخيماتُ الدور.')) + '</li><li>' + esc(t('اضغط نقطةً بعد نقطة من أوّل المسار إلى آخره؛ كلُّ نقطةٍ تلتصق بأقرب شارع وتُوصَل بما قبلها على الشوارع وحدَها — لا فوق خيمةٍ ولا بيت.')) + '</li><li>' + esc(t('«تراجع» يرفع آخرَ نقطة، و«احفظ المسار» يثبّته ويعرضه على الأجهزة كلِّها بدل المولَّد. ارسم أكثرَ من خطٍّ للدور نفسِه إن تفرّع.')) + '</li></ol>')
      + cardFlush(t('المسارات'), table(['الدور', 'الاتجاه', 'المرسوم', ''], rows))
      + '<p class="hint">' + esc(t('المولَّدُ من مخطّط الوزارة يبقى حيث لا رسم؛ وما يُرسَم يحلُّ محلَّه للدور والاتجاه نفسَيهما، ويُحذَف من هنا.')) + '</p>';
  } };
PAGE.sel = { m:'الميدان', t:'الطبقات والمحدَّد',
  l:'طبقةُ العمل الحالية، وما حدّدته منها لعملٍ جماعيٍّ عليه.',
  body:function(){
    var head = tabHead('sel'), cur = tabCur('sel');
    if (cur === 'sel') return head + (function(){
    /* كانت ثلاثةَ صفوفٍ مزروعةٍ لا تُزال مهما ضُغط «أزل»، وأزرارٌ بلا خاصيةٍ
       يبتلعها حارسُ الأزرار الميتة فيقول نصَّها. والتحديدُ الحقيقيُّ في `SEL`. */
    var ids = selIds();
    var L = ids.map(siteFind).filter(Boolean);
    var sv = 0, ins = 0, zones = {};
    L.forEach(function(x){
      if (svVisited(STATE.recs[x.id])) sv++;
      var r = STATE.inss[x.id];
      if (r && r.status === 'مُركّب' && r.approved) ins++;
      zones[x.zone] = 1;
    });
    return stats([['نقاط محدَّدة', N(L.length), L.length ? 'acc' : ''],
                  ['منها مُسح', N(sv)],
                  ['منها مُركّب', N(ins)],
                  ['مشاعر', N(Object.keys(zones).length)]])

      + cardFlush('النقاط',
          L.length
            ? table(['المعرّف','الموقع','المشعر','الحالة',''],
                capList(L, 200).map(function(x){
                  var r = STATE.inss[x.id];
                  var st2 = (r && r.status) || (svVisited(STATE.recs[x.id]) ? 'تمت الزيارة' : 'لم يُزر');
                  return ['<span class="num">' + esc(x.id) + '</span>',
                          esc(x.name), esc(t(x.zone)),
                          pill(t(st2), st2 === 'مُركّب' ? 'ok' : 'warn'),
                          btn('أزل','btn-quiet btn-sm',' data-selrm="' + esc(x.id) + '"')];
                }))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا نقاطَ محدَّدة — حدّدها من الخريطة أو من قائمة المواقع.')) + '</p>')

      + (L.length
        ? card('عملٌ على المحدَّد',
            '<div class="actions">'
            + btn('أسند لفني','btn-primary',' data-asn="1"')
            + btn('جدولة تركيب','btn-secondary',' data-lasn="ins"')
            + btn('طلب زيارة','btn-secondary',' data-lasn="srv"')
            + (may('exportAll') ? btn('⬇ KMZ للمحدَّد','btn-secondary',' data-kmz="sel"') : '')
            + btn('امسح التحديد','btn-danger',' data-selnone="1"')
            + '</div>')
        : '');
  })();
    return head + (function(){
    return '<div class="chips">' + Object.keys(LAYERS).map(function(k){
        var L = LAYERS[k];
        return '<button type="button" class="chip' + (FIELD_MODE===k?' on':'') + '" data-mode="' + k + '">'
          + L.i + ' ' + esc(t(L.n)) + '</button>';
      }).join('') + '</div>'

      + Object.keys(LAYERS).map(function(k){
          var L = LAYERS[k], S = layerStats(k);
          return card(L.i + ' ' + t(L.n),
            '<p class="hint" style="margin:0 0 12px">' + esc(t(L.d)) + '</p>'
            + '<div class="stats" style="margin:0">'
            +   stat('في الطبقة', N(S.pool))
            +   stat('جاهزٌ للجدولة', N(S.ready), S.ready?'acc':'')
            +   stat('تمّ', N(S.done), 'ok')
            +   stat('مُسند', N(S.asn), S.asn?'wrn':'')
            + '</div>'
            + (S.ptsAll
              ? '<div class="alert info" style="margin:12px 0 0"><span>'
                + esc(t('نقاط الوزن')) + ': ' + esc(t('جاهز')) + ' <b>' + nm(S.ptsReady) + '</b> · '
                + esc(t('منجَز')) + ' <b>' + nm(S.ptsDone) + '</b> · '
                + esc(t('الإجمالي')) + ' <b>' + nm(S.ptsAll) + '</b></span></div>'
              : alertBox('warn','لم تُضبط أوزانُ هذه الطبقة بعد — اكتبها في الإعدادات لتُحسب النقاط.'))
            + (S.pool ? '' : '<p class="hint">' + esc(t(L.empty)) + '</p>'),
            '<div class="actions">'
            + btn('◈ ' + t('افتح الطبقة'),'btn-secondary btn-sm',' data-mode="' + k + '"')
            + (S.ready ? btn('➕ ' + t('إسناد'),'btn-primary btn-sm',' data-lasn="' + k + '"') : '')
            + '</div>');
        }).join('')

      + card('ترتيب الدورة',
          flow(['مسح','تركيب','فك'], FIELD_MODE==='dis'?2:(FIELD_MODE==='install'?1:0))
          + '<p class="hint">' + esc(t('لا تُجدوَل مرحلةٌ قبل ما يسبقها: التركيبُ لا يظهر إلا لما مُسح، والفكُّ لا يظهر إلا لما رُكِّب واعتُمد.')) + '</p>');
  })();
  }};

/* ── صفحة الفك ── */
PAGE.forms = { m:'الميدان', t:'النماذج الميدانية',
  l:'كلُّ ما يُدخَل عن نقطة — مسحُها وتركيبُها وفكُّها وتسليمُها وعناوينُها، وتسجيلُ نقطةٍ جديدة.',
  body:function(){
    var head = tabHead('forms'), cur = tabCur('forms');
    if (cur === 'hand') return head + (function(){
    var S = siteStats();
    var ready = [];
    var ncrOpen = (typeof NCRS !== 'undefined')
      ? NCRS.filter(function(x){ return x.st !== 'مغلق' && x.sev === 'جوهري'; }) : [];
    /* «جاهزٌ للتسليم» ما رُكِّب واعتُمد ولم يُسلَّم بعد — لا كلُّ ما رُكِّب */
    var handedL = STATE.sites.filter(function(x){ return handDone(x.id); });
    ready = STATE.sites.filter(handReady);
    var coL = {};
    STATE.sites.forEach(function(x){
      var r = STATE.inss[x.id];
      if (!x.co || !r || r.status !== 'مُركّب' || !r.approved) return;
      var g = coL[x.co] = coL[x.co] || { n:0, done:0 };
      g.n++; if (handDone(x.id)) g.done++;
    });
    var coKeys = Object.keys(coL).sort(function(a, b){ return coL[b].n - coL[a].n; });

    return stats([['جاهزٌ للتسليم', N(ready.length), ready.length ? 'acc' : ''],
                  ['سُلّم', N(handedL.length), handedL.length ? 'ok' : ''],
                  ['بلاغاتٌ تمنع', N(ncrOpen.length), ncrOpen.length ? 'bad' : 'ok'],
                  ['شهور الضمان', N(cfgGet('warranty') || 12)]])

      + (ncrOpen.length
        ? alertBox('error','لا تُسلَّم نقطةٌ عليها بلاغُ عدمِ مطابقةٍ جوهريٌّ مفتوح — '
            + nm(ncrOpen.length) + ' بلاغًا يمنع.')
        : '')

      + card('شروط التسليم',
          table(['الشرط','الحالة'], [
            ['التركيبُ معتمدٌ من المهندس', ready.length ? pill('مستوفٍ','ok') : pill('لم يبدأ','')],
            ['الصورُ موثَّقةٌ قبل وبعد', pill('مستوفٍ','ok')],
            ['السيرياتُ مسجّلةٌ ومطابقة', pill('مستوفٍ','ok')],
            ['لا بلاغَ جوهريًّا مفتوحًا', ncrOpen.length ? pill('غيرُ مستوفٍ','off') : pill('مستوفٍ','ok')],
            ['العناوينُ مشتقّةٌ ومختبرة', pill('يُفحَص بأداة الفحص','warn')]
          ]))

      /* ═══ تسليمُ نقطة ═══ */
      + (may('approve')
        ? card('تسليم نقطة',
            ready.length
              ? '<div class="grid cols-3">'
                + '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
                +   '<select id="hoSite">' + ready.slice(0, 400).map(function(x){
                      return '<option value="' + esc(x.id) + '">' + esc(x.id) + ' \u2014 '
                        + esc((x.name || '').slice(0, 30)) + '</option>'; }).join('') + '</select></div>'
                + '<div class="field"><label>' + esc(t('المستلِم عن العميل')) + ' <span class="req">*</span></label>'
                +   '<input id="hoTo" dir="auto" placeholder="' + esc(t('الاسم والصفة')) + '"></div>'
                + '<div class="field"><label>' + esc(t('ملاحظات')) + '</label>'
                +   '<input id="hoNote" dir="auto"></div>'
                + '</div>'
              : '<p class="hint" style="margin:0">' + esc(t('لا نقطةَ جاهزةً للتسليم — تُعتمَد التركيباتُ أولًا في «التدقيق الهندسي».')) + '</p>',
            ready.length ? btn('\u{1F91D} ' + t('حرّر محضر التسليم'),'btn-primary btn-sm',' data-hogo="1"') : '')
        : '')

      /* ═══ المحاضر: نقطةً نقطة، وشركةً بكلِّ نقاطها ═══ */
      + card('محضر تسليم',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('محضر نقطة')) + '</label>'
          +   '<select id="hoDocSite">'
          +   (handedL.concat(STATE.sites.filter(function(x){
                 var r = STATE.inss[x.id];
                 return r && r.status === 'مُركّب' && r.approved && !handDone(x.id); })))
                .slice(0, 400).map(function(x){
                  return '<option value="' + esc(x.id) + '"' + (HO_DOC === x.id ? ' selected' : '') + '>'
                    + esc(x.id) + (handDone(x.id) ? ' \u2705' : '') + '</option>'; }).join('')
          +   '</select></div>'
          + '<div class="field"><label>' + esc(t('محضر شركة')) + '</label>'
          +   '<select id="hoDocCo">' + coKeys.map(function(c){
                return '<option value="' + esc(c) + '"' + (HO_CO === c ? ' selected' : '') + '>'
                  + esc(c.length > 34 ? c.slice(0, 33) + '\u2026' : c)
                  + ' \u00b7 ' + nm(coL[c].done) + '/' + nm(coL[c].n) + '</option>'; }).join('')
          +   '</select></div>'
          + '</div>',
          btn('\u{1F4C4} ' + t('اعرض محضر النقطة'),'btn-secondary btn-sm',' data-hodoc="site"')
          + btn('\u{1F3E2} ' + t('اعرض محضر الشركة'),'btn-secondary btn-sm',' data-hodoc="co"')
          + (HO_DOC || HO_CO ? btn('\u{1F5A8} ' + t('طباعة'),'btn-quiet btn-sm',' data-print="1"') : ''))

      + (HO_DOC
        ? (function(){
            var sx = siteFind(HO_DOC);
            var co = sx && sx.co;
            return card('', handDocSite(HO_DOC)
              + '<div class="actions" style="margin-top:12px">'
              + btn('\u2B07 ' + t('إكسل — المحضر'),'btn-secondary btn-sm',' data-xls="hodoc"')
              + btn('\u{1F5A8} PDF','btn-secondary btn-sm',' data-print="1"')
              + (co && coTelOf(co)
                  ? btn('\u{1F4AC} ' + t('أبلغ') + ' ' + esc(co.length > 22 ? co.slice(0, 21) + '\u2026' : co),
                        'btn-quiet btn-sm',' data-wasend="hand|' + esc(co) + '"')
                  : '')
              + '</div>');
          })()
        : '')
      /* الزرُّ في جسم البطاقة لا في رأسها: البطاقةُ بلا عنوانٍ تُسقِط الرأسَ
         ومعه ما فيه — فيختفي الزرُّ ولا يشكو أحد. */
      + (HO_CO
        ? card('', handDocCo(HO_CO)
            + '<div class="actions" style="margin-top:12px">'
            + (coTelOf(HO_CO)
                ? btn('\u{1F4AC} ' + t('أبلغ الشركة على واتساب'),'btn-primary btn-sm',' data-wasend="hand|' + esc(HO_CO) + '"')
                : '<span class="hint" style="margin:0">' + esc(t('لا جوالَ لهذه الشركة — احفظه في «الشركات ← إشعار الشركات»')) + '</span>')
            + '</div>')
        : '')

      + (handedL.length
        ? cardFlush(t('ما سُلِّم') + ' — ' + nm(handedL.length),
            table(['النقطة','رقم المحضر','المستلِم','التاريخ','الضمان ينتهي'],
              capList(handedL, 200).map(function(x){
                var h = handOf(x.id);
                var end = new Date(h.at + (h.warranty || 12) * 30 * 86400000);
                return ['<span class="num">' + esc(x.id) + '</span>',
                        '<span class="num">' + esc(h.no) + '</span>',
                        esc(h.to), '<span class="num">' + esc(fmtDate(h.at)) + '</span>',
                        '<span class="num">' + esc(fmtDate(end)) + '</span>'];
              })))
        : '')

      + card('الضمان',
          '<div class="field" style="max-width:280px;margin:0"><label>'
          + esc(t('مدّة الضمان')) + ' (' + esc(t('شهر')) + ')</label>'
          + cfgInput('warranty', undefined, { dec:0 }) + '</div>'
          + '<p class="hint">' + esc(t('تبدأ من تاريخ التسليم الابتدائي — وفيها يُستبدل التالفُ بلا كلفةٍ على العميل.')) + '</p>')

      + '<p class="hint">' + esc(t('الفكُّ إرجاعُ ما سُلِّم: لا تظهر نقطةٌ في طبقة الفك قبل تحرير محضر تسليمها.')) + '</p>';
  })();
    if (cur === 'disp2') return head + (function(){
    var ready = (STATE.sites || []).filter(function(x){
      return insDone(x.id) && (typeof handDone !== 'function' || handDone(x.id)) && !disDone(x.id);
    });
    var done = (STATE.sites || []).filter(function(x){ return disDone(x.id); });
    var sel = DISF.site && siteFind(DISF.site);
    var ins = sel ? (STATE.inss[sel.id] || {}) : null;
    var ed = may('edit');
    return stats([['جاهزٌ للفك', N(ready.length), ready.length ? 'acc' : 'ok'],
                  ['فُكَّ', N(done.length), 'ok'],
                  ['مُسنَدٌ للفك', N((STATE.sites || []).filter(function(x){ return taskKindOf(x.id, 'dis'); }).length), 'wrn']])

      + (ed
        ? card('\u{1F9E9} ' + t('تسجيلُ فكّ') + ' (UR)',
            '<div class="field"><label>' + esc(t('النقطة')) + ' <span class="req">*</span></label>'
            + '<select data-dissite="1"><option value="">— ' + esc(t('اختر نقطةً سُلِّمت ولم تُفَكّ')) + ' —</option>'
            +   capList(ready, 300).map(function(x){
                  return '<option value="' + esc(x.id) + '"' + (DISF.site === x.id ? ' selected' : '') + '>'
                    + esc(x.id + ' \u00b7 ' + (x.name || '').slice(0, 30)) + '</option>'; }).join('')
            + '</select></div>'
            + (sel
              ? '<div class="pop-rows"><div><span class="k">' + esc(t('الشركة')) + '</span><span>' + esc(coName(sel.co) || '\u2014') + '</span></div>'
                + '<div><span class="k">' + esc(t('المشعر')) + '</span><span>' + esc(t(sel.zone)) + '</span></div></div>'
                + cardFlush(t('العُهدةُ المُرجَعة'),
                    table(['الصنف','العدد','حالتُه'],
                      Object.keys(ins.parts || {}).map(function(k){
                        return [esc(itemName(k)), N(ins.parts[k]),
                          '<select data-discond="' + esc(k) + '">' + DIS_COND.map(function(c){
                            return '<option value="' + esc(c) + '"' + ((DISF.items[k] || 'سليم') === c ? ' selected' : '') + '>'
                              + esc(t(c)) + '</option>'; }).join('') + '</select>'];
                      })))
                + '<p class="hint">' + esc(t('ما سلِم يعود مخزونًا وما تلِف يُشطَب — والعهدةُ تُقفَل بالحالة لا بالعدد.')) + '</p>'
                + '<div class="field"><label>' + esc(t('ملاحظة')) + '</label>'
                +   '<input data-disnote="1" value="' + esc(DISF.note) + '" dir="auto"></div>'
                + photoBox('after', DISF.photos, 'disph', 'صورةُ الموضع بعد الفكّ')
              : '<p class="hint">' + esc(t('لا يُفَكُّ إلا ما رُكِّب واعتُمد وسُلِّم بمحضر.')) + '</p>'),
            sel ? btn('\u{1F4E6} ' + t('سجّل الفكَّ وأرجِع العُهدة'),'btn-primary btn-sm',' data-dissave="1"') : '')
        : '')

      + (done.length
        ? cardFlush(t('ما فُكَّ') + ' \u2014 ' + nm(done.length),
            table(['النقطة','التاريخ','بواسطة','القطع'],
              done.slice(0, 60).map(function(x){
                var r = STATE.diss[x.id];
                var bad = Object.keys(r.items || {}).filter(function(k){ return r.items[k].cond !== 'سليم'; }).length;
                return ['<span class="num">' + esc(x.id) + '</span>',
                        '<span class="num">' + esc(fmtDate(r.at)) + '</span>',
                        esc(dispName(r.by)),
                        N(Object.keys(r.items || {}).length) + (bad ? ' \u00b7 ' + pill(nm(bad) + ' ' + t('غير سليم'), 'off') : '')];
              })))
        : '');
  })();

    if (cur === 'maintForm') return head + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الصيانة'),'btn-secondary btn-sm',' data-xls="maints"') + '</div>' + (function(){
    var pool = (STATE.sites || []).filter(function(x){ return insDone(x.id); });
    var asn  = pool.filter(function(x){ return taskKindOf(x.id, 'maint'); });
    var sel = MNTF.site && siteFind(MNTF.site);
    var ed = may('edit');
    var hist = [];
    Object.keys(STATE.maints || {}).forEach(function(id){
      maintList(id).forEach(function(r){ hist.push({ id:id, r:r }); });
    });
    hist.sort(function(a, b){ return b.r.at - a.r.at; });
    return stats([['قابلٌ للصيانة', N(pool.length), 'acc'],
                  ['مُسنَدٌ للصيانة', N(asn.length), asn.length ? 'wrn' : 'ok'],
                  ['زياراتُ صيانةٍ سُجِّلت', N(hist.length), hist.length ? 'ok' : '']])

      + (ed
        ? card('\u{1F6E1} ' + t('تسجيلُ صيانة') + ' (MR)',
            '<div class="field"><label>' + esc(t('النقطة')) + ' <span class="req">*</span></label>'
            + '<select data-mntsite="1"><option value="">— ' + esc(t('اختر نقطةً مُركّبةً معتمدة')) + ' —</option>'
            +   capList((asn.length ? asn : pool), 300).map(function(x){
                  return '<option value="' + esc(x.id) + '"' + (MNTF.site === x.id ? ' selected' : '') + '>'
                    + esc(x.id + ' \u00b7 ' + (x.name || '').slice(0, 30)) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field"><label>' + esc(t('العطل')) + ' <span class="req">*</span></label>'
            +   '<input data-mntfault="1" value="' + esc(MNTF.fault) + '" dir="auto" placeholder="' + esc(t('ما الذي وُجد؟')) + '"></div>'
            + '<div class="field"><label>' + esc(t('ما عُمل')) + ' <span class="req">*</span></label>'
            +   '<input data-mntact="1" value="' + esc(MNTF.act) + '" dir="auto" placeholder="' + esc(t('الإجراءُ المتَّخَذ')) + '"></div>'
            + (sel
              ? cardFlush(t('قطعٌ استُبدلت'),
                  table(['الصنف','العدد'],
                    itemsList().slice(0, 24).map(function(i){
                      return [esc(i.name),
                        '<input type="number" min="0" value="' + esc(String(cfgN(MNTF.parts[i.code]))) + '" data-mntpart="' + esc(i.code) + '" style="width:78px">'];
                    })))
                + '<p class="hint">' + esc(t('ما استُبدل يُخصَم من العُهدة كما يُخصَم في التركيب.')) + '</p>'
                + photoBox('fix', MNTF.photos, 'mntph', 'صورةٌ بعد الإصلاح')
              : '')
            + '<div class="field"><label>' + esc(t('ملاحظة')) + '</label>'
            +   '<input data-mntnote="1" value="' + esc(MNTF.note) + '" dir="auto"></div>',
            btn('\u{1F6E1} ' + t('سجّل الصيانة'),'btn-primary btn-sm',' data-mntsave="1"'))
        : '')

      + (hist.length
        ? cardFlush(t('سجلُّ الصيانة') + ' \u2014 ' + nm(hist.length),
            table(['النقطة','التاريخ','العطل','ما عُمل','بواسطة',''],
              hist.slice(0, 60).map(function(h){
                return ['<span class="num">' + esc(h.id) + '</span>',
                        '<span class="num">' + esc(fmtDate(h.r.at)) + '</span>',
                        esc(h.r.fault.slice(0, 40)), esc(h.r.act.slice(0, 40)), esc(dispName(h.r.by)),
                        buyMayEdit() || rankOf(ROLE) >= rankOf('engineer') ? btn('\u2715','btn-quiet btn-sm',' data-mntdel="' + esc(h.id + '|' + h.r.at) + '" title="' + esc(t('حذف')) + '"') : ''];   /* (V29.5) */
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('لا زيارةَ صيانةٍ بعد — تُسجَّل هنا فتُغلَق مهمةُ MR ويبقى للنقطة تاريخُ خدمة.')) + '</p>'));
  })();

    if (cur === 'ips') return head + (function(){
    var L = ipRows(), all = (STATE.sites || []).filter(function(x){ return x.net; }).length;
    var missBy = {}, heldBy = {}, heldN = 0;
    (STATE.sites || []).forEach(function(x){
      if (x.net) return;
      /* المفتاحُ مركَّبٌ بالجمع فلا يبلغه القاموس — يُخزَّن جزآه ويُترجَم كلٌّ
         على حدة عند العرض */
      var k = x.zone + '\u0000' + x.type;
      if (ipPreset(x)){ heldBy[k] = (heldBy[k] || 0) + 1; heldN++; return; }
      missBy[k] = (missBy[k] || 0) + 1;
    });
    var heldKeys = Object.keys(heldBy).sort(function(a, b){ return heldBy[b] - heldBy[a]; });
    /* ═══ ما له عنوانٌ — بالمشعر والنوع ═══
       سُئل: «المفروض ٧٤٤ نقطةً لها عنوان». والعددُ لا يُناقَش بالذاكرة:
       يُعرَض ما هو كائنٌ مفصَّلًا، فيُقارَن بالمتوقَّع ويُعرَف أين الفرق.
       (نسخةُ ١٣٫٩٩ فُحصت: العمودُ العشرون فيها يحمل ٥٤٦ بادئةً كلُّها
       مخيماتُ منى، ولا بادئةَ فيها لممرٍّ ولا قارئٍ ولا كاميرا.) */
    var haveBy = {};
    (STATE.sites || []).forEach(function(x){
      if (!x.net) return;
      var k = x.zone + '\u0000' + x.type;
      haveBy[k] = (haveBy[k] || 0) + 1;
    });
    var haveKeys = Object.keys(haveBy).sort(function(a, b){ return haveBy[b] - haveBy[a]; });
    var missKeys = Object.keys(missBy).sort(function(a, b){ return missBy[b] - missBy[a]; });
    return stats([['نقاطٌ لها شبكة', N(all), all ? 'ok' : 'wrn'],
                  ['بلا عنوان', N((STATE.sites || []).length - all),
                   (STATE.sites || []).length - all ? 'wrn' : 'ok'],
                  ['عنوانُها في الميدان', N(heldN), heldN ? 'acc' : ''],
                  ['معروض', N(L.length)]])

      + (haveKeys.length
        ? card('\u2705 ' + t('ما له عنوان — بالمشعر والنوع'),
            table(['المشعر والنوع','له عنوان'],
              haveKeys.slice(0, 20).map(function(k){
                var pr = k.split('\u0000');
                return [esc(t(pr[0])) + ' \u00b7 ' + esc(t(pr[1])), N(haveBy[k])];
              }))
            + '<p class="hint" style="margin:8px 0 0">'
            + esc(t('العددُ يُقارَن بالمتوقَّع هنا لا بالذاكرة. وما ورثه النظامُ من النسخة السابقة خمسُمئةٍ وستةٌ وأربعون بادئةً كلُّها مخيماتُ منى — لا بادئةَ فيها لممرٍّ ولا قارئٍ ولا كاميرا؛ وما زاد عنها أُدخل بعدها.')) + '</p>')
        : '')

      /* ما رُكِّب سابقًا عنوانُه قائمٌ في جهازه — لا يُخترَع له بديل */
      /* بادئةٌ واحدةٌ على نقطتين: خطأٌ يمنع الجهازين من العمل معًا ولا يظهر
         إلا حين يسقط أحدُهما. يُكشَف هنا ولا يُصلَح صامتًا — تصحيحُه قرارُ
         مهندسٍ يعرف أيَّ الجهازين يبقى على عنوانه. */
      + (function(){
          var seen = {}, dup = [];
          (STATE.sites || []).forEach(function(x){
            if (!x.net) return;
            if (seen[x.net]) dup.push([x.net, seen[x.net], x.id]);
            else seen[x.net] = x.id;
          });
          if (!dup.length) return '';
          return card('\u26A0 ' + t('بادئةٌ واحدةٌ على أكثرَ من نقطة'),
            '<p class="hint" style="margin:0 0 10px">'
            + esc(t('عنوانان متطابقان على الشبكة يمنعان الجهازين من العمل معًا، ولا يظهر العطلُ إلا حين يسقط أحدُهما. صحّح البادئةَ في الجدول أدناه — لا يُصلِحها النظامُ صامتًا لأن اختيارَ من يبقى على عنوانه قرارُ مهندس.')) + '</p>'
            + table(['البادئة','النقطة الأولى','النقطة الثانية'],
                dup.slice(0, 30).map(function(r){
                  return ['<span class="num">' + esc(r[0]) + '</span>',
                          '<span class="num">' + esc(r[1]) + '</span>',
                          '<span class="num">' + esc(r[2]) + '</span>'];
                }))
            + (dup.length > 30 ? '<p class="hint" style="margin:8px 0 0">' + esc(t('و')) + ' '
                + nm(dup.length - 30) + ' ' + esc(t('أخرى')) + '</p>' : ''));
        })()

      + (heldN
        ? card('\u{1F517} ' + t('مُركّبةٌ سابقًا — عنوانُها يُقرأ من الميدان'),
            '<p class="hint" style="margin:0 0 10px">'
            + esc(t('هذه النقاطُ رُكِّبت في موسمٍ ماضٍ (إعادةُ تركيبٍ أو ترقيةٌ أو تفعيل)، وعناوينُها مكتوبةٌ في أجهزتها فعلًا. لا يُولَّد لها عنوانٌ يخالف الواقع: يقرؤه الفنيُّ من الراوتر ويكتبه في «العنوان القائم» داخل نموذج المسح، فيُحفَظ على النقطة.')) + '</p>'
            + table(['المشعر والنوع','بانتظار قراءة الميدان'],
                heldKeys.slice(0, 20).map(function(k){
                  var pr = k.split('\u0000');
                  return [esc(t(pr[0])) + ' \u00b7 ' + esc(t(pr[1])), N(heldBy[k])];
                })))
        : '')

      /* الناقصُ بالمشعر والنوع: كان يُقال «بلا عنوان ٩٠٠» ولا يُعرف أينها —
         فتُعنوَن المخيماتُ وتُنسى الممرات. */
      + (missKeys.length
        ? card('ما ينقصه عنوان — بالمشعر والنوع',
            table(['المشعر والنوع','بلا عنوان'],
              missKeys.slice(0, 20).map(function(k){
                var pr = k.split('\u0000');
                return [esc(t(pr[0])) + ' \u00b7 ' + esc(t(pr[1])), N(missBy[k])];
              }))
            + '<p class="hint" style="margin:8px 0 0">'
            + esc(t('التوليدُ يملأ الناقصَ وحدَه: لكلِّ مشعرٍ نطاقُه ولكلِّ نوعٍ شريحتُه، وما له بادئةٌ لا يُمَسّ.')) + '</p>',
            may('edit')
              ? btn('\u26A1 ' + t('ولّد البادئات الناقصة'),'btn-primary btn-sm',' data-ipfill="1"')
                + btn('\u26A1 ' + t('الممرات فقط'),'btn-secondary btn-sm',' data-ipfill="ممر"')
              : '')
        : card('', '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('كلُّ نقطةٍ لها بادئةُ شبكة.')) + '</p>'))

      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="ipQ" data-ipq="1" value="' + esc(IP_Q) + '" placeholder="'
      +     esc(t('ابحث بالمعرّف أو الاسم أو البادئة')) + '" dir="auto">'
      + '</form>'

      /* إضافةُ عنوانٍ لنقطةٍ بمعرّفها: كان الطريقُ الوحيدُ الاستيرادَ من ملف —
         ونقطةٌ واحدةٌ لا تستحق ملفًّا. */
      + (may('edit')
          ? card('إضافة عنوان لنقطة',
              '<div class="grid cols-2">'
              + '<div class="field"><label>' + esc(t('معرّف النقطة')) + ' <span class="req">*</span></label>'
              +   '<input id="ipAddId" dir="ltr" placeholder="NSK-MIN-CMP-0001" list="ipSiteList">'
              +   '<datalist id="ipSiteList">' + (STATE.sites || []).slice(0, 400).map(function(x){
                    return '<option value="' + esc(x.id) + '">'; }).join('') + '</datalist></div>'
              + '<div class="field"><label>' + esc(t('البادئة')) + ' <span class="req">*</span></label>'
              +   '<input id="ipAddNet" dir="ltr" placeholder="10.20.30"></div>'
              + '</div>'
              + '<p class="hint">' + esc(t('تُشتقّ العناوينُ الثلاثةُ من البادئة — .1 راوتر و.2 قارئ و.3 كاميرا — وتُعدَّل من الجدول إن اختلفت.')) + '</p>',
              btn('➕ أضِف','btn-primary btn-sm',' data-ipadd="1"'))
          : '')

      + cardFlush(t('العناوين') + ' — ' + nm(L.length),
          L.length
            ? table(['المعرّف','الموقع','البادئة','الراوتر','القارئ','الكاميرا',''],
                capList(L, 200).map(function(x){
                  return ['<span class="num">' + esc(x.id) + '</span>',
                          esc(x.name),
                          '<input value="' + esc(x.net || '') + '" data-ipn="' + esc(x.id) + '" dir="ltr" placeholder="10.20.30">',
                          '<input value="' + esc(x.ipRtr || '') + '" data-ipr="' + esc(x.id) + '" dir="ltr" placeholder=".1">',
                          '<input value="' + esc(x.ipRdr || '') + '" data-ipd="' + esc(x.id) + '" dir="ltr" placeholder=".2">',
                          '<input value="' + esc(x.ipCam || '') + '" data-ipc="' + esc(x.id) + '" dir="ltr" placeholder=".3">',
                          may('edit') ? btn('مسح','btn-quiet btn-sm',' data-ipclr="' + esc(x.id) + '"') : ''];
                }))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا عناوينَ بعد — استوردها من «التصدير والاستيراد» بنوع «عناوين الشبكة».')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="ips"') : '')

      + '<p class="hint">' + esc(t('البادئةُ تُكتَب بلا نقطةٍ أخيرة، والعناوينُ الثلاثةُ تُكتَب بنقطةٍ أولى — فيُقرأ العنوانُ كاملًا بضمّهما.')) + '</p>';
  })();
    if (cur === 'svForm') return head + (function(){
    var s = formSite();
    if (!s) return alertBox('warn','لا مواقع محمّلة.');
    var done = !!STATE.recs[s.id];
    /* زيارةٌ سُجِّلت بإضافة النقطة ولم تُستكمَل بياناتُها ليست «تصويبًا» (V17.57) */
    var fresh = done && STATE.recs[s.id].src === 'newsite' && !STATE.recs[s.id].mount;
    return (fresh ? alertBox('info','سُجِّلت الزيارةُ بإضافة النقطة — أكمل بياناتِ المسح؛ فلا تُعتمَد قبل استكمالها.')
            : (done ? alertBox('success','هذا الموقع مُسِح — ما تكتبه الآن تصويبٌ يُسجَّل باسمك.') : ''))
      + svCopyBar(s)   /* (V29.4) */
      + card('الموقع',
          '<div class="inline-form" style="margin:0 0 12px">'
          + '<input type="search" id="fSiteQ" placeholder="' + esc(t('ابحث بالمعرّف أو الشاخص')) + '" dir="auto">'
          + btn('بحث','btn-secondary btn-sm',' data-fsq="1"') + '</div>'
          + '<div class="pop-rows" style="margin:0">'
          + '<div><span class="k">' + esc(t('المعرّف')) + '</span><span class="num">' + esc(s.id) + '</span></div>'
          + '<div><span class="k">' + esc(t('الاسم')) + '</span><span>' + esc(s.name) + '</span></div>'
          + '<div><span class="k">' + esc(t('المشعر')) + '</span><span>' + esc(t(s.zone)) + ' \u00b7 ' + esc(t(s.type)) + '</span></div>'
          + (s.sign ? '<div><span class="k">' + esc(t('الشاخص')) + '</span><span class="num">' + esc(s.sign) + '</span></div>' : '')
          + (s.work ? '<div><span class="k">' + esc(t('وجه العمل')) + '</span><span>' + esc(t(s.work)) + '</span></div>' : '')
          + (s.co   ? '<div><span class="k">' + esc(t('الشركة')) + '</span><span>' + esc(s.co) + '</span></div>' : '')
          + '</div>'
          + '<p class="hint">' + esc(t('فيها خطأ؟ اطلب تصحيحًا — يعتمده المهندس.')) + '</p>',
          btn('طلب تصويب','btn-quiet btn-sm',' data-fix="' + esc(s.id) + '"'))
      + fixCard(s.id)

      + card('الوصول',
          '<div class="chips" style="margin:0">'
          + SV_ACCESS.map(function(a){
              return '<button type="button" class="chip' + (FORM.access===a?' on':'')
                + '" data-acc="' + esc(a) + '">' + esc(t(a)) + '</button>';
            }).join('') + '</div>'
          + (FORM.access === 'تم الوصول' ? ''
             : '<p class="hint" style="margin:10px 0 0">'
               + esc(t('لم يُوصَل إلى الموقع — يكفي السببُ في الملاحظات، ولا تُطلَب القياساتُ ولا الصور. ولا تُحتسب زيارةً منجزة.'))
               + '</p>'))

      + card('ما يُجمَع في الموقع',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('نوع التركيب')) + ' <span class="req">*</span></label>'
          + '<select data-form="mount">' + ['','عمود','جدار','سور','هيكل قائم'].map(function(o){
              return '<option value="' + esc(o) + '"' + (FORM.mount===o?' selected':'') + '>' + esc(t(o)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('مصدر الكهرباء')) + ' <span class="req">*</span></label>'
          + '<select data-form="power">' + ['','شبكة','مولد','طاقة شمسية','لا يوجد'].map(function(o){
              return '<option value="' + esc(o) + '"' + (FORM.power===o?' selected':'') + '>' + esc(t(o)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('ارتفاع التركيب')) + ' (' + t('م') + ')</label>'
          + '<input type="number" step="0.5" min="0" data-form="height" value="' + esc(FORM.height) + '"></div>'
          + '<div class="field"><label>' + esc(t('طول الكابل المطلوب')) + ' (' + t('م') + ')</label>'
          + '<input type="number" min="0" data-form="cable" value="' + esc(FORM.cable) + '"></div>'
          + '</div>'
          + '<div class="field"><label>' + esc(t('تحديات التركيب')) + ' <span class="req">*</span></label>'
          + '<div class="chips" style="margin:6px 0 0">'
          + chalsOf(s).map(function(c){
              return '<button type="button" class="chip' + (FORM.chals.indexOf(c)>-1?' on':'')
                + '" data-chal="' + esc(c) + '">' + esc(t(c)) + '</button>';
            }).join('') + '</div></div>'
          + '<div class="field"><label>' + esc(t('ملاحظات')) + '</label>'
          + '<textarea rows="3" data-form="note">' + esc(FORM.note) + '</textarea></div>')

      + svExtra(s)

      + photoCard.apply(null, SV_PHOTOS)

      + card('', '<div class="actions">'
          + btn('حفظ المسح','btn-primary',' data-svsave="1"')
          + btn('حفظ ومتابعة للتالي','btn-secondary',' data-svnext="1"')
          + '</div>'
          + '<p class="hint">' + esc(t('يُحفظ على جهازك فورًا ويُرفع حين تعود الشبكة — لا تنتظرها.')) + '</p>');
  })();
    if (cur === 'insForm') return head + (function(){
    var s = formSite();
    if (!s) return alertBox('warn','لا مواقع محمّلة.');
    var zone = siteZone(s);
    var parts = itemsList().filter(function(i){ return i.z === zone && itPts(i.code) > 0; });
    if (!parts.length) parts = itemsList().filter(function(i){ return i.z === zone; }).slice(0, 8);
    var rec = STATE.recs[s.id];

    return (!rec ? alertBox('warn','هذا الموقع لم يُمسح بعد — التركيب قبل المسح يُخلّ بالترتيب.') : '')
      + card('حالة التركيب',
          '<div class="chips" style="margin:0">'
          + ['قيد التركيب','مُركّب','متعذّر'].map(function(c){
              return '<button type="button" class="chip' + (FORM.status===c?' on':'')
                + '" data-fst="' + esc(c) + '">' + esc(t(c)) + '</button>';
            }).join('') + '</div>'
          + '<p class="hint">' + esc(s.id) + ' — ' + esc(s.name) + '</p>')

      + cardFlush(t('القطع المستهلكة') + ' — ' + nm(parts.length),
          table(['القطعة','النقاط','المستهلك','السيريال'],
            parts.map(function(i){
              return [esc(i[2]), N(itPts(i[1])),
                      '<input type="number" min="0" data-part="' + esc(i[1]) + '" value="'
                        + (FORM.parts[i[1]] || 0) + '">',
                      '<input dir="ltr" placeholder="SN-…" data-serial="' + esc(i[1]) + '" value="'
                        + esc(FORM.serials[i[1]] || '') + '"> ' + scanBtn(i[1])];
            })),
          '<span class="hint" style="margin:0">' + esc(t('مجموع النقاط'))
          + ' <b>' + nm(formPts()) + '</b></span>')

      + photoCard(['before','قبل التركيب',1], ['after','بعد التركيب',1],
                  ['plate','لوحة رقم الموقع',0],
                  ['panel','لوحة الأجهزة',0], ['serial','السيريال',0])

      + card('الشبكة',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('بادئة الشبكة')) + '</label>'
          + '<input dir="ltr" data-form="prefix" placeholder="10.20.30" value="' + esc(FORM.prefix) + '"></div>'
          + '<div class="field"><label>' + esc(t('العناوين المشتقّة')) + '</label>'
          + '<input dir="ltr" readonly value="' + esc(ipsOf(FORM.prefix)) + '"'
          + ' style="background:var(--surface-2);color:var(--ink-soft)"></div>'
          + '</div>'
          + '<p class="hint">' + esc(t('‎.1 راوتر · ‎.2 قارئ · ‎.3 كاميرا — تُشتقّ من البادئة ولا تُكتب.')) + '</p>')

      + card('', '<div class="actions">'
          + '<div class="field" style="max-width:220px"><label>' + esc(t('عدد الأطقم المركّبة')) + '</label>'
          + '<input type="number" min="0" data-form="kits_done" value="' + esc(FORM.kits_done || '') + '"></div>'
          + btn('إتمام التركيب','btn-primary',' data-inssave="1"')
          + btn('حفظ مسودّة','btn-secondary',' data-insdraft="1"')
          + '</div>'
          + '<p class="hint">' + esc(t('لا تُحسَب النقطة مُركّبةً حتى يعتمد المهندس قطعها وأرقامها التسلسلية في التدقيق الهندسي.')) + '</p>');
  })();
    if (cur === 'newsite') return head + (function(){
    if (NS_CO_OPEN) return nsCoCard();

    var has  = NEWSITE.lat && NEWSITE.lng;
    var office = nsOffice();
    var near = nsNear();
    var camp = NEWSITE.type === 'مخيم';

    /* اختِير الموضعُ على الخريطة؟ فلا حاجةَ لالتقاط الموضع (V17.44) */
    var head = !MYPOS && !has && !NEWSITE.byMap
      ? alertBox('warn','لم يُلتقَط موضعُك بعد — اضغط «التقط موضعي» قبل تعبئة النموذج.')
      : (near && near.length
          ? alertBox('warn','انتبه — يوجد مواقعُ مسجّلةٌ قريبةٌ منك. أغلبُ حالات «غير موجود» وقوفٌ بجانب مسجَّل، فراجعها قبل الإنشاء.')
            + card('الأقربُ إليك الآن',
                near.map(function(x){
                  return '<button type="button" class="btn btn-quiet" data-site="' + esc(x.s.id) + '" '
                    + 'style="width:100%;justify-content:space-between;margin-bottom:6px">'
                    + '<span>' + esc(x.s.id) + '</span><span class="num">' + nm(Math.round(x.d))
                    + ' ' + esc(t('م')) + '</span></button>';
                }).join(''))
          : alertBox('success','لا موقعَ مسجَّلًا خلال مئةٍ وأربعين مترًا منك — الأرجحُ أنه غيرُ مسجَّلٍ فعلًا.'));

    return head

      + card('الموضع',
          '<div class="pop-rows" style="margin:0">'
          + '<div><span class="k">' + esc(t('الإحداثيات')) + '</span><span class="num">'
          +   (has ? (NEWSITE.lat.toFixed(6) + ', ' + NEWSITE.lng.toFixed(6))
                   : (MYPOS ? (MYPOS.lat.toFixed(6) + ', ' + MYPOS.lng.toFixed(6)) : '—'))
          + '</span></div></div>',
          btn('◎ ' + t('التقط موضعي'),'btn-secondary btn-sm',' data-nsloc="1"')
          + ((may('newsite') || may('settings'))
              ? btn('\u{1F4CC} ' + t('اختر الموضع على الخريطة'),'btn-quiet btn-sm',' data-nspin="1"') : ''))

      + card('هوية الموقع',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('المشعر')) + ' <span class="req">*</span></label>'
          + '<select data-ns="zone">' + zoneOptions().map(function(z){
              /* القيمةُ المفتاحُ العربيُّ والمعروضُ ترجمتُه (V17.72) */
              return '<option value="' + esc(z) + '"' + (NEWSITE.zone===z?' selected':'') + '>' + esc(t(z)) + '</option>'; }).join('')
          + '</select><p class="hint">' + esc(t('اختر المنطقة التي يتبعها الموقع')) + '</p></div>'

          + '<div class="field"><label>' + esc(t('نوع الموقع')) + ' <span class="req">*</span></label>'
          + '<select data-ns="type">' + Object.keys(CAT_DEF).map(function(k){
              return '<option value="' + esc(k) + '"' + (NEWSITE.type===k?' selected':'') + '>'
                + CAT_DEF[k].i + ' ' + esc(t(CAT_DEF[k].l)) + '</option>'; }).join('')
          + '</select></div>'

          /* (V29.7) غيرُ المخيم: اسمُ النقطة إلزاميّ، ومراكزُ التفويج بمركزها */
          + (!camp ? '<div class="field"><label>' + esc(t('اسم النقطة')) + (office ? '' : ' <span class="req">*</span>') + '</label>'
              + '<input data-ns="nm" value="' + esc(NEWSITE.nm) + '" dir="auto" placeholder="' + esc(t('مثال: ممر الملك فهد — البوابة ٣')) + '"></div>' : '')
          + (NEWSITE.type === 'LPR' ? '<div class="field"><label>' + esc(t('المركز')) + ' <span class="req">*</span></label>'
              + '<select data-ns="center"><option value="">— ' + esc(t('اختر')) + ' —</option>' + NS_CENTERS.map(function(c){ return '<option value="' + esc(c[1]) + '"' + (NEWSITE.center === c[1] ? ' selected' : '') + '>' + esc(t(c[0])) + '</option>'; }).join('') + '</select></div>' : '')
          /* المربعُ والشاخصُ من هويّة المخيمات وحدَها — الممرُّ والكاميرا والمحطةُ
             والجمراتُ ونمرةُ والتسكينُ لا مربعَ لها ولا شاخص، فلا يُطلَبان ولا يُعرَضان */
          + (camp
            ? '<div class="field"><label>' + esc(t('رقم المربع')) + ' <span class="req">*</span></label>'
          + '<input data-ns="sq" value="' + esc(NEWSITE.sq) + '" dir="auto">'
          + '<p class="hint">' + esc(t('من الشاخص المثبت في الموقع')) + '</p></div>'
          + '<div class="field"><label>' + esc(t('رقم الشاخص')) + ' <span class="req">*</span></label>'
          + '<input data-ns="sign" value="' + esc(NEWSITE.sign) + '" dir="auto">'
          + '<p class="hint">' + esc(t('الصيغة: اسم الخيمة/رقم الشارع — مثال 57/2 أو 12أ/8')) + '</p></div>'
            : '')
          + '</div>'

          + (camp ? '<div class="field"><label>' + esc(t('شركة تقديم الخدمة'))   /* (V29.7) الشركةُ للمخيمات وحدَها */
          +   ' <span class="req">*</span></label>'
          + btn(NEWSITE.co ? NEWSITE.co
                : (NEWSITE.coReq ? t('بانتظار اعتماد المهندس') + ': ' + NEWSITE.coReq
                                 : '— ' + t('اختر الشركة من القائمة') + ' —'),
                NEWSITE.co ? 'btn-secondary' : 'btn-quiet', ' data-nsco="1" style="width:100%"')
          + '<p class="hint">' + esc(t('إلزامية للمخيمات — من القائمة الموحّدة فقط. اتركها فارغة إن كان السبب «عدم وجود تخصيص».')) + '</p>'
          /* شركةٌ ليست في القائمة؟ تُضاف من شاشتها ثم يعود — بلا خروجٍ من
             القائمة الجانبية والبحثِ عن اسم الشاشة. */
          + (seesPage('co')
            ? '<div class="actions" style="margin:6px 0 0">'
              + btn('\u{1F3E2} ' + t('إدارةُ الشركات'),'btn-quiet btn-sm',
                    ' data-p="co" title="' + esc(t('أضِف شركةً جديدةً ثم عُد — تظهر في القائمة فورًا')) + '"')
              + '</div>'
            : '')
          + '</div>'

          + '<div class="field"><label>' + esc(t('عدد الخيام أو الغرف')) + '</label>'
          + '<input data-ns="tents" type="number" min="0" value="' + esc(NEWSITE.tents) + '"></div>' : '')
          + (camp ? '<p class="hint" style="margin:6px 0 0">' + esc(t('الاسم')) + ': <b>' + esc(NEWSITE.zone + ' - مربع ' + (NEWSITE.sq || '…') + ' - شاخص ' + (NEWSITE.sign || '…')) + '</b></p>' : ''))

      + card('لماذا ليس في السجل؟',
          '<div class="field"><label>' + esc(t('السبب')) + (office ? '' : ' <span class="req">*</span>') + '</label>'
          + '<select data-ns="reason"><option value="">— ' + esc(t('اختر')) + ' —</option>'
          + (camp ? cfgList('reasonsCamp', NS_REASONS) : cfgList('reasonsPt', NS_REASONS_PT)).map(function(r){   /* (V30.3) من الإعدادات */
              return '<option value="' + esc(r) + '"' + (NEWSITE.reason===r?' selected':'') + '>' + esc(t(r)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('شرح مختصر')) + '</label>'
          + '<textarea data-ns="why" rows="2" placeholder="'
          + esc(t('اختياري — اكتبه فقط لو فيه تفصيلةٌ تساعد المكتب')) + '">' + esc(NEWSITE.why) + '</textarea></div>')

      + card(t('التحديات') + (office ? '' : ' *'), '<p class="hint" style="margin-top:0">' + esc(t('اختر ما ينطبق — أو «لا توجد تحديات»')) + '</p><div class="chips">'   /* (V29.7) إلزاميةٌ للكلّ */
          + chalsOf({ type:NEWSITE.type }).map(function(c){ var on = (NEWSITE.chals || []).indexOf(c) > -1; return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-nschal="' + esc(c) + '">' + (on ? '\u2713 ' : '') + esc(t(c)) + '</button>'; }).join('') + '</div>')

      + card('الصور',
          '<p class="hint" style="margin-top:0">' + esc(t(office
              ? 'الصورُ اختياريةٌ للمكتب — تُرفَع إن وُجدت، وتُلتقَط في الزيارة التي تُجدوَل بعد الحفظ.'
              : 'الأوليان إلزاميتان — بهما يطابق المكتبُ الموقع. الباقي اختياريٌّ وكلُّ صورةٍ تساعد.')) + '</p>'
          + '<div class="grid cols-2">'
          + NS_PHOTOS.map(function(lbl, i){
              var p = NEWSITE.photos[i];
              return '<div class="field"><label>' + nm(i+1) + ' · ' + esc(t(lbl))
                + (i < 2 && !office ? ' <span class="req">*</span>' : '') + '</label>'   /* (V29.7) أوّلُ صورتين */
                + '<label class="btn ' + (p ? 'btn-secondary' : 'btn-primary')
                + '" style="cursor:pointer;width:100%">'
                + (p ? '✓ ' + esc(t('التُقطت')) : '📷 ' + esc(t('صوّر أو اختر')))
                + '<input type="file" accept="image/*" capture="environment" data-nsphoto="' + i
                + '" style="display:none"></label>'
                + (p ? '<div class="hint" style="margin:4px 0 0">' + nm(Math.round(p.size/1024))
                     + ' ' + esc(t('كيلو')) + '</div>' : '')
                + '</div>';
            }).join('')
          + '</div>')

      + card('', '<div class="actions">'
          + (office
              ? btn('\u{1F4C5} ' + t('احفظ وجدوِل زيارة'),'btn-primary',' data-nssave="1"')
              : btn('إرسال للاعتماد','btn-primary',' data-nssave="1"'))
          + btn('إلغاء','btn-secondary',' data-p="map"')
          + '</div>'
          + '<p class="hint">' + esc(t(office
              ? 'نقطةُ المكتب لا تُحتسَب زيارة: تُحفَظ «جديدةً بانتظار الاعتماد»، ثم يُفتَح لوحُ الإسناد عليها لتُجدوَل زيارتُها — والميدانُ هو من يمسحها.'
              : 'الإرسالُ يُحتسَب زيارةً بانتظار الاعتماد، والموقعُ «جديدٌ بانتظار الاعتماد» لا يدخل الإحصاءَ حتى يعتمده المهندس. وبعد الإرسال يُفتَح نموذجُ المسح عليه فتُستكمَل بياناتُه — ولا تُعتمَد الزيارةُ قبل استكمالها.')) + '</p>');
  })();
    return head + (function(){
    if (!STATE.diss) STATE.diss = {};
    var S = layerStats('dis');
    var pool = STATE.sites.filter(LAYERS.dis.pass);
    var sched = pool.filter(function(x){ var r = STATE.diss[x.id]; return r && r.status === 'مجدول'; });
    var done = pool.filter(function(x){ return disDone(x.id); });

    return stats([['قابل للفك', N(S.pool), S.pool?'acc':''],
                  ['مجدول', N(sched.length), sched.length?'wrn':''],
                  ['تم الفك', N(done.length), 'ok'],
                  ['نقاط الفك', N(S.ptsAll)]])
      + (pool.length
        ? cardFlush(t('القابل للفك') + ' — ' + nm(pool.length),
            table(['النقطة','المشعر','النوع','نقاط الفك','الحالة',''],
              pool.slice(0, 40).map(function(x){
                var r = STATE.diss[x.id] || {};
                var d = CAT_DEF[x.type] || { l:x.type, i:'' };
                return ['<strong>' + bdi(x.id) + '</strong>',
                        esc(x.zone), d.i + ' ' + esc(t(d.l)),
                        N(ptsDis(x)),
                        pill(r.status || 'قابل للفك', r.status==='تم الفك'?'ok':(r.status?'warn':'')),
                        '<div class="actions">'
                        + (!r.status ? btn('جدوِل','btn-quiet btn-sm',' data-dsch="' + esc(x.id) + '"') : '')
                        + (r.status === 'مجدول'
                          ? btn('سليم','btn-quiet btn-sm',' data-ddone="' + esc(x.id) + '|سليم"')
                            + btn('تالف','btn-quiet btn-sm',' data-ddone="' + esc(x.id) + '|تالف"')
                          : '')
                        + '</div>'];
              })),
            '<div class="actions">'
            + btn('◈ ' + t('طبقة الفك'),'btn-secondary btn-sm',' data-mode="dis"')
            + btn('➕ ' + t('إسناد فك'),'btn-primary btn-sm',' data-lasn="dis"')
            + '</div>')
        : card('', alertBox('info','لا نقاط مركَّبةً بعد — الفكُّ آخرُ الدورة ولا يبدأ قبلها.')))
      + card('معاملا الحالة',
          table(['الحالة','المعامل','الأثر'], [
            ['سليم', N(cfgGet('disOk') || 1),
             '<span class="hint" style="margin:0">' + esc(t('يعود للمخزن قابلًا للاستعمال')) + '</span>'],
            ['تالف', N(cfgGet('disBad') || 1),
             '<span class="hint" style="margin:0">' + esc(t('يُعزَل ويُوثَّق — وفكُّه أثقل')) + '</span>']
          ])
          + '<p class="hint">' + esc(t('المعاملان يُضبطان في الإعدادات ← نقاط الفك، ويضربان وزنَ الفك بحسب حالة الجهاز.')) + '</p>');
  })();
  }};

function disSchedule(id){
  if (!may('edit')){ toast(t('جدولةُ الفك تحتاج صلاحية تعديل')); return; }
  /* لا يُفَكُّ ما لم يُركَّب: كان يُجدوَل أيُّ معرّفٍ يُمرَّر، فتظهر في جدول
     الفكِّ نقاطٌ لم يُوضَع فيها جهازٌ قط، ويُرسَل إليها طاقم. */
  var r0 = STATE.inss[id];
  if (!r0 || r0.status !== 'مُركّب' || !r0.approved){
    toast(t('الفكُّ يتاح بعد اعتماد تركيب النقطة'));
    return;
  }
  if (!STATE.diss) STATE.diss = {};
  STATE.diss[id] = { id:id, status:'مجدول', at:Date.now(), by:STATE.meta.name || '' };
  CORE.set('diss', id, STATE.diss[id]);
  logEvent('جدولة فك — ' + id, id);
  statBump(); toast(t('جُدوِل للفك')); render(1);
}

function disComplete(id, cond){
  if (!may('edit')){ toast(t('إتمامُ الفك يحتاج صلاحية تعديل')); return; }
  var sched = STATE.diss && STATE.diss[id];
  if (!sched || sched.status !== 'مجدول'){
    toast(t('جدوِل الفكَّ أولًا قبل إتمامه')); return;
  }
  var x = siteFind(id);
  STATE.diss[id] = { id:id, status:'تم الفك', cond:cond, at:Date.now(),
                     by:STATE.meta.name || '', pts:x ? ptsDis(x) : 0 };
  CORE.set('diss', id, STATE.diss[id]);
  /* العُهدةُ ترجع: السليمُ للمخزن والتالفُ يُعزَل — بمعرّفٍ فريدٍ لكل
     صنفٍ لا معرّف الموقع نفسِه، وإلا كتب صنفٌ فوق آخر في القاعدة. */
  var ins = STATE.inss[id];
  STATE.moves = STATE.moves || [];
  if (ins && ins.parts) Object.keys(ins.parts).forEach(function(k){
    var mv = { id:uid36(), at:dayKey(),
               kind: cond === 'تالف' ? 'إرجاع تالف' : 'إرجاع سليم',
               item:k, qty:ins.parts[k], by:STATE.meta.name || '—', site:id, cond:cond };
    STATE.moves.push(mv);
    CORE.dirty('moves', mv.id, mv);
  });
  logEvent('فك ' + cond + ' — ' + id, id);
  statBump(); toast(t('تم الفك') + ' · ' + t(cond)); render(1);
}

/* ═══ الإسناد — من القائمة أو الخريطة ═══
   يُحدَّد ما يُراد ثم يُسند لفنيٍّ، فيراه في خريطته وحده.
   والمُسنَدُ لا يُسنَد مرةً ثانيةً — فلا يُشتّت فنيّان على نقطةٍ واحدة. */

var ASN_OPEN = false, ASN_TO = '', ASN_KIND = 'visit', ASN_WHEN = '';
var SEL = Object.create(null), SEL_N = 0;

function selHas(id){ return !!SEL[id]; }
function selToggle(id){
  if (SEL[id]){ delete SEL[id]; SEL_N--; }
  else { SEL[id] = 1; SEL_N++; }
}
function selClear(){ SEL = Object.create(null); SEL_N = 0; }
function selIds(){ return Object.keys(SEL); }
function selAll(list){
  list.forEach(function(x){ if (!SEL[x.id] && !asnOf(x.id)){ SEL[x.id] = 1; SEL_N++; } });
}

/* من أُسند إليه هذا الموقع — إن أُسند */
function asnOf(id){
  /* (V26.1) كانت تمرّ على المهامِّ كلِّها لكلِّ نقطة — ألفٌ وثمانمئةُ نقطةٍ × ستُّمئةِ مهمة = مليونُ مقارنةٍ في رسمة
     مركز التصدير وحدَه (٢٧٠ م.ث). صارت من فهرس المهامِّ نفسِه الذي يُبنى مرةً في الرسمة ويُبطَل في statBump. */
  return taskIndex()['*|' + id] || null;
}

/* ما لدى فنيٍّ في هذه الطبقة — يُفتح عليه اللوحُ فيُزاد أو يُنقَص */
function asnOfTech(who, kind){
  var out = [];
  Object.keys(STATE.tasks).forEach(function(k){
    var x = STATE.tasks[k];
    if (x.to === who && x.kind === kind && x.status !== 'معتمد') out.push(x.site);
  });
  return out;
}

/* تحميلُ ما لديه في التحديد — فالإضافةُ والحذفُ على ما هو قائم */
function asnLoad(who){
  var kind = LAYER().kind;
  selClear();
  asnOfTech(who, kind).forEach(function(id){ SEL[id] = 1; SEL_N++; });
  ASN_BASE = asnOfTech(who, kind);
  render(1);
}

var ASN_BASE = [];
var ASN_MODE = 'tech';   /* لفنيٍّ واحدٍ أو لفريقٍ يُوزَّع على أعضائه */
var ASN_PICK = false;    /* لوحُ اختيار نوع الإسناد على الخريطة */

/* لكلِّ نوعٍ وجهتُه الطبيعية: الزيارةُ لفنيٍّ يمشي وحده،
   والتركيبُ والفكُّ لفريقٍ لأنهما عملُ أيدٍ لا يدٍ واحدة. */
var ASN_KIND_DEST = { visit:'tech', install:'team', dis:'team', maint:'team' };
/* اسمُ نوع المهمة بالعربية وأيقونته — يُشتقّ من LAYERS فلا يُكتب مرتين */
function kindLabel(kind){
  var k = Object.keys(LAYERS).filter(function(n){ return LAYERS[n].kind === kind; })[0];
  return k ? (LAYERS[k].i + ' ' + t(LAYERS[k].n)) : (kind || '\u2014');
}

/* ترقيمُ الطلبات: SR للزيارة، DR للتركيب، PR للفك — رقمٌ بشريٌّ يُذكر في
   التقارير والمكالمات، منفصلٌ عن معرّف المهمة الداخلي (TK-kind-site) الذي
   لا يتغيّر ولا يتكرّر. الأنواعُ الأخرى (تهيئة، تجميع، مستودع…) بلا ترقيم —
   لم يُطلب لها. */
/* ═══ رموزُ الطلبات بلغة الميدان ═══
   كانت الرموزُ اصطلاحًا داخليًّا: DR للتركيب وPR للفكّ وIR للصرف. والميدانُ
   يقولها بمعانيها الإنجليزية المعروفة — فمن قرأ DR فهم «تسليمًا» لا
   «تركيبًا»، فيُطلَب الشيءُ باسم غيره. صارت الرموزُ تقول ما تعنيه:
     SR  Survey Request        زيارةُ مسح
     IR  Installation Request  تركيبُ نقطة
     MR  Maintenance Request   صيانةٌ في أثناء الموسم
     UR  Unplug Request        فكٌّ بعد الموسم
     DR  Delivery Request      صرفُ أصنافٍ لعهدة شخص
     CR  Configuration Request تهيئةٌ في الورشة
     AR  Assembly Request      تجميعٌ في الورشة
   والأرقامُ القديمةُ تبقى في سجلّاتها كما كُتبت — لا تُبدَّل بأثرٍ رجعيّ؛
   والعدّاداتُ تُنقَل عند الإقلاع فلا يتكرّر رقمٌ بمعنيين. */
var REQ_PREFIX = { visit:'SR', install:'IR', dis:'UR', prep:'CR', asm:'AR', maint:'MR', issue:'DR' };
var REQSEQ = { SR:0, IR:0, UR:0, CR:0, AR:0, MR:0, DR:0 };
function reqNext(kind){
  var p = REQ_PREFIX[kind];
  if (!p) return '';
  REQSEQ[p] = (REQSEQ[p] || 0) + 1;
  CORE.set('cfg', 'reqSeq', REQSEQ);
  var n = String(REQSEQ[p]);
  while (n.length < 4) n = '0' + n;
  return p + '-' + n;
}

/* ═══ حلُّ التركيب: الأجهزةُ المقترحة لنقطةٍ قبل طلب تركيبها ═══
   يُقترَح بعد اعتماد زيارتها (SR)، ويعتمده المهندسُ وحده — ولا يُتاح طلبُ
   تركيبٍ (DR) لنقطةٍ إلا بعد اعتماد حلِّها. الفكُّ لا يحتاج هذه البوابةَ:
   ما رُكِّب معروفٌ من STATE.inss[site].parts نفسها فور اختيار النقطة. */
function solutionOf(site){
  var r = STATE.inss[site];
  return (r && r.solution) || null;
}
function solutionSave(site, itemsMap){
  if (!may('edit')){ toast(t('اقتراحُ الحل يحتاج صلاحية تعديل')); return; }
  var s = siteFind(site);
  if (!s){ toast(t('الموقعُ غيرُ موجود')); return; }
  if (!svDone(STATE.recs[site])){ toast(t('امسح النقطةَ أولًا قبل اقتراح حلّها')); return; }
  if (!svApproved(STATE.recs[site])){ toast(t('اعتمد الزيارةَ أولًا في «اعتماد الزيارات» ثم اقترح حلَّها')); return; }
  var old = solutionOf(site);
  if (old && old.status === 'معتمد'){
    toast(t('حلُّ هذه النقطة معتمدٌ بالفعل — راجع المهندس لتعديله')); return;
  }
  var used = {}, n = 0;
  Object.keys(itemsMap || {}).forEach(function(k){
    var q = cfgN(itemsMap[k]);
    if (q > 0){ used[k] = q; n += q; }
  });
  if (!n){ toast(t('اختر جهازًا واحدًا على الأقل')); return; }
  var r = STATE.inss[site] || { id:site };
  r.solution = { items:used, status:'مقترح', by:STATE.meta.name || '', at:Date.now() };
  CORE.set('inss', site, r);
  logEvent('اقتراح حل تركيب — ' + site + ' \u00b7 ' + nm(n) + ' جهاز', site);
  toast(t('اقتُرح الحل — بانتظار اعتماد المهندس'));
  render(1);
}
function solutionAppr(site, ok){
  if (!may('users')){ toast(t('اعتمادُ الحل للمهندس وحده')); return; }
  var r = STATE.inss[site];
  if (!r || !r.solution) return;
  if (ok){
    r.solution.status = 'معتمد';
    r.solution.apprBy = STATE.meta.name || '';
    r.solution.apprAt = Date.now();
    logEvent('اعتماد حل تركيب — ' + site, site);
    notifPush('اعتماد', 'اعتُمد حلُّ التركيب لنقطة ' + site,
              { to:r.solution.by || '', site:site, lv:'مهم' });
  } else {
    r.solution.status = 'مُعاد';
    r.solution.why = 'أُعيد للتصحيح';
    logEvent('ردّ حل تركيب — ' + site, site);
    notifPush('ردّ', 'رُدَّ حلُّ تركيب ' + site + ' — راجعه',
              { to:r.solution.by || '', site:site, lv:'عاجل' });
  }
  CORE.set('inss', site, r);
  toast(ok ? t('اعتُمد الحل') : t('رُدّ للمقترِح'));
  render(1);
}

function asnPickHtml(){
  return '<div class="pop" id="asnPick" style="width:min(420px,92vw)">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">' + esc(t('ما الذي تُسنده؟')) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">' + esc(t('اختر النوعَ فتُفتَح طبقتُه ويُضبَط من يستلمه.')) + '</p></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-apick="0" aria-label="'
    +     esc(t('إغلاق')) + '">✕</button>'
    + '</div>'
    + '<div class="pop-body">'
    + '<div class="list" style="margin:14px 0 0;border:1px solid var(--line);border-radius:var(--radius-sm)">'
    /* الصيانةُ ليست طبقةً على الخريطة (تشترك مع التركيب في نقاطه) — فكانت
       تغيب عن المنتقي، فلا يُسنَد MR إلا من «توزيع الفرق». صارت خيارًا
       خامسًا يفتح طبقةَ التركيب ويضبط النوعَ صيانةً. */
    + Object.keys(LAYERS).concat(['maint']).map(function(k){
        var isM = k === 'maint';
        var L = isM ? { n:WO_KINDS.maint.n, i:WO_KINDS.maint.i, c:LIFE.maint.c, kind:'maint' } : LAYERS[k];
        var ready = isM ? (typeof asnReadyList === 'function' ? asnReadyList('maint').length : 0)
                        : layerStats(k).ready;
        var dest = ASN_KIND_DEST[L.kind] || 'tech';
        return '<button type="button" class="list-item" style="width:100%;text-align:inherit;'
          + 'background:none;border:0;border-bottom:1px solid var(--line-2);cursor:pointer"'
          + ' data-akind="' + esc(k) + '">'
          + '<div class="li-main"><div class="li-t" style="color:' + L.c + '">'
          +   L.i + ' ' + esc(t(L.n)) + ' <span class="num">' + esc(REQ_PREFIX[L.kind] || '') + '</span></div>'
          + '<div class="li-s">' + esc(t(dest === 'team' ? 'يُسنَد لفريقٍ يُوزَّع عليه'
                                                        : 'يُسنَد لفنيٍّ واحد'))
          +   ' · ' + nm(ready) + ' ' + esc(t('جاهز')) + '</div></div>'
          + '<div class="li-end">' + (ready ? pill('متاح','ok') : pill('لا نقاط','off')) + '</div>'
          + '</button>';
      }).join('')
    + '</div>'
    + '<p class="hint">' + esc(t('لا تظهر في كلِّ طبقةٍ إلا نقاطُها: التركيبُ ما مُسح، والفكُّ ما سُلِّم، والصيانةُ ما رُكِّب.')) + '</p>'
    + '</div></div>';
}

/* اختيارُ النوع: تُفتَح طبقتُه، ويُضبَط من يستلمه، ويُبدأ التحديد */
function asnPickKind(k){
  /* الصيانةُ تستعير طبقةَ التركيب لأن نقاطَها نقاطُه المُركَّبة */
  var isM = k === 'maint';
  var L = isM ? { n:WO_KINDS.maint.n, i:WO_KINDS.maint.i, kind:'maint' } : LAYERS[k];
  if (!L) return;
  FIELD_MODE = isM ? 'install' : k;
  ASN_MODE = ASN_KIND_DEST[L.kind] || 'tech';
  ASN_KIND = L.kind;
  selClear();
  ASN_PICK = false;
  MAP_SELECT = true;
  CUR = 'map';
  render(1);
  if (MAP) mapPaint();
  toast(L.i + ' ' + t(L.n) + ' \u00b7 ' + t('اضغط النقاط ثم «أسند»'));
}

function techNames(){
  /* TECHS صارت فارغةً منذ توحيد مصدر الأشخاص (V15.35) — القراءةُ منها
     تُرجع لا شيء. تُقرأ القائمةُ المشتقّةُ من الحسابات.
       وهي قائمةُ **من يُسنَد إليه**: الميدانيّون وحدهم. كانت تقرأ الحساباتِ
     كلَّها ثم تُضيف من الأدوار المشتقّة — فيظهر المحاسبُ والمستودعُ ومديرُ
     المشروع في منتقي الإسناد، ويُسنَد إليهم مسحٌ لن يذهبوا إليه. */
  var out = techsList().map(function(x){ return x.n; });
  /* والدورُ المشتقُّ من الوظيفة لا يُعتَدُّ به هنا: `assignRows` تُرجِع
     «فنيًّا» لكلِّ من لا وظيفةَ له — فيعود المحاسبُ ومديرُ المشروع من الباب
     الخلفيّ. العبرةُ بدور الحساب نفسِه. */
  var roleOf = {};
  Object.keys(STATE.users || {}).forEach(function(k){
    var u = STATE.users[k]; if (u && u.name) roleOf[u.name] = u.role;
  });
  assignRows().forEach(function(u){
    var r = roleOf[u[0]] || u[2];
    if (isFieldRole(r) && out.indexOf(u[0]) < 0) out.push(u[0]);
  });
  return out;
}

/* ── لوح الإسناد: قائمةٌ بتحديدٍ متعدد ── */
/* السلسلةُ تُعرَض في اللوح: من حدّد نقطةً واحدةً يرى طريقَه كاملًا قبل أن
   يضغط — لا بعد أن يُرفَض. */
function asnGateCard(){
  var ids = selIds();
  if (ids.length !== 1) return '';
  var x = siteFind(ids[0]);
  if (!x) return '';
  return gateCard(ASN_KIND, x);
}
function asnSheet(){
  var L = (typeof LAYER === 'function') ? LAYER() : { n:'المسح', pts:function(){ return 0; }, pass:function(){ return true; } };
  var base = (typeof layerFiltered === 'function') ? layerFiltered() : filtered();
  var view = SITE_Q ? siteSearch(SITE_Q, 400).filter(filtPass).filter(L.pass) : base.slice(0, PG_Q ? 5000 : 200);
  /* المحدَّدُ يُرى أوّلًا (V17.57): نقطةٌ أُضيفت الآن لتُجدوَل زيارتُها في آخر
     السجل — فلا تُبحَث في مئتي سطرٍ ولا تختفي خلف مرشِّح */
  if (SEL_N && SEL_N <= 50){
    var seen0 = {}; view.forEach(function(x){ seen0[x.id] = 1; });
    var pin0 = selIds().filter(function(id){ return !seen0[id]; }).map(siteFind).filter(Boolean);
    if (pin0.length) view = pin0.concat(view);
  }
  var techs = techNames();
  ASN_KIND = L.kind || ASN_KIND;
  if (!ASN_TO) ASN_TO = techs[0] || '';
  var have = asnOfTech(ASN_TO, L.kind).length;

  return '<div class="pop" id="asnPop" style="width:min(560px,94vw);max-height:88vh;overflow:auto">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">' + (L.i||'') + ' ' + esc(t('إسناد')) + ' — ' + esc(t(L.n)) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">' + esc(t(L.d || '')) + '</p></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-asn="0" aria-label="'
    +     esc(t('إغلاق')) + '">✕</button>'
    + '</div>'
    + '<div class="pop-body">'

    /* من حدّد نقطةً واحدةً يرى طريقَه كاملًا قبل الضغط لا بعد الرفض */
    + asnGateCard()

    + '<div class="inline-form" style="margin:12px 0 10px">'
    +   '<input type="search" id="asnQ" value="' + esc(SITE_Q) + '" placeholder="'
    +     esc(t('ابحث بالشاخص أو المربع أو المشعر')) + '" dir="auto" style="flex:1">'
    +   btn('بحث','btn-secondary btn-sm',' data-asnq="1"')
    + '</div>'

    + catBar(0)

    + '<div class="actions" style="margin:0 0 10px">'
    +   btn('حدّد المعروض','btn-secondary btn-sm',' data-selall="1"')
    +   btn('امسح التحديد','btn-secondary btn-sm',' data-selnone="1"')
    +   '<span class="pill ' + (SEL_N ? 'acc' : '') + '">' + esc(t('محدَّد'))
    +     ' <b>' + nm(SEL_N) + '</b></span>'
    +   (SEL_N && selPts() ? '<span class="pill acc">' + esc(t('نقاط الوزن'))
    +     ' <b>' + nm(selPts()) + '</b></span>' : '')
    + '</div>'

    + '<div class="list" style="max-height:38vh;overflow:auto;border:1px solid var(--line);'
    +   'border-radius:var(--radius-sm)">'
    + (!view.length && !SITE_Q
      ? '<div style="padding:20px;text-align:center">'
        + '<p class="hint" style="margin:0 0 12px">' + esc(t(L.empty || 'لا نقاطَ في هذه الطبقة.')) + '</p>'
        + (FIELD_MODE === 'install'
          ? btn('◈ ' + t('اذهب لطبقة المسح'),'btn-primary btn-sm',' data-lasn="survey"')
          : (FIELD_MODE === 'dis'
            ? btn('◈ ' + t('اذهب لطبقة التركيب'),'btn-primary btn-sm',' data-lasn="install"') : ''))
        + '</div>'
      : '')
    + (view.length
      ? view.slice(0, 120).map(function(x){
          var d = CAT_DEF[x.type] || { l:x.type, i:'\u25CF', c:'#8A939D' };
          var a = asnOf(x.id);
          return '<label class="list-item" style="cursor:pointer">'
            + '<input type="checkbox" data-sel="' + esc(x.id) + '"' + (selHas(x.id)?' checked':'')
            +   ((a && a.to !== curTech()) ? ' disabled' : '')
            +   ' style="width:20px;min-height:20px;flex:0 0 auto">'
            + '<div class="li-main"><div class="li-t">'
            +   (x.sign ? esc(t('شاخص')) + ' <b>' + esc(x.sign) + '</b>' : esc(x.name.slice(0, 40)))
            +   (x.sq ? ' · ' + esc(t('مربع')) + ' ' + esc(x.sq) : '')
            + '</div><div class="li-s"><span class="num">' + esc(x.id) + '</span></div></div>'
            + '<div class="li-end" style="color:' + d.c + '">' + d.i + ' ' + esc(t(d.l))
            + (L.pts(x) ? '<div class="num" style="margin:2px 0 0">' + nm(L.pts(x)) + ' ' + esc(t('نقطة')) + '</div>' : '')
            +   (L.kind === 'dis' && STATE.inss[x.id] && STATE.inss[x.id].parts
                  ? '<div class="hint" style="margin:2px 0 0;max-width:150px">'
                    + Object.keys(STATE.inss[x.id].parts).map(function(c){
                        return esc(itemName(c)) + ' \u00d7' + nm(STATE.inss[x.id].parts[c]);
                      }).join('، ')
                    + '</div>' : '')
            +   (a ? '<div class="hint" style="margin:2px 0 0">'
                  + (a.to === curTech() ? '<span class="pill acc">' + esc(t('لديه')) + '</span>'
                                        : esc(t('مُسند')) + ' \u00b7 ' + esc(a.to))
                  + '</div>' : '')
            + '</div></label>';
        }).join('')
      : '<p class="hint" style="padding:18px;text-align:center;margin:0">' + esc(t('لا نتائج')) + '</p>')
    + '</div>'
    + (view.length > 120
      ? '<p class="hint">' + esc(t('يُعرض مئةٌ وعشرون — ضيّق بالفئة أو البحث')) + '</p>' : '')

    + '<div class="grid cols-3" style="margin:12px 0 0">'
    + '<div class="chips" style="margin:0 0 10px">'
    +   '<button type="button" class="chip' + (ASN_MODE==='tech'?' on':'') + '" data-asnmode="tech">'
    +     '\u25CF ' + esc(t('لفنيّ')) + '</button>'
    +   '<button type="button" class="chip' + (ASN_MODE==='team'?' on':'') + '" data-asnmode="team">'
    +     '\u25C8 ' + esc(t('لفريق')) + '</button>'
    + '</div>'
    + (ASN_MODE === 'team'
      ? '<div class="grid cols-2" style="margin:0 0 10px">'
        + '<div class="field" style="margin:0"><label>' + esc(t('الفريق')) + '</label>'
        + '<select id="asnTeam">' + TEAMS.map(function(tm){
            return '<option value="' + esc(tm.id) + '"' + (ASN_TEAM===tm.id?' selected':'') + '>'
              + esc(tm.n) + ' — ' + nm(tm.members.length) + ' ' + esc(t('أعضاء')) + '</option>';
          }).join('') + '</select></div>'
        + '<div class="field" style="margin:0"><label>' + esc(t('التوزيع')) + '</label>'
        + '<select id="asnSplit">'
        + '<option value="share">' + esc(t('بالنسب المعرَّفة')) + '</option>'
        + '<option value="even">' + esc(t('بالتساوي')) + '</option>'
        + '</select></div></div>'
        + (function(){
            var tm = teamOf(ASN_TEAM);
            return tm && tm.members.length
              ? '<p class="hint" style="margin:0 0 10px">' + esc(t('سيُوزَّع'))
                + ' <b>' + nm(SEL_N) + '</b> ' + esc(t('نقطة على'))
                + ' <b>' + nm(tm.members.length) + '</b> ' + esc(t('أعضاء'))
                + '</p>'
              : alertBox('warn','لا أعضاءَ في هذا الفريق — أضفهم من «الفرق».');
          })()
      : '')
    + (ASN_MODE === 'tech'
      ? '<div class="field" style="margin:0"><label>' + esc(t('الفني'))
    +     (have ? ' <span class="pill acc">' + esc(t('لديه')) + ' ' + nm(have) + '</span>' : '')
    +     '</label>'
    +   '<select id="asnTo" data-asnto="1">' + techs.map(function(n){
          return '<option' + (ASN_TO===n?' selected':'') + '>' + esc(n) + '</option>'; }).join('')
    +   '</select></div>'
      : '')
    + '<div class="grid cols-2" style="margin:10px 0 0">'
    +   '<div class="field" style="margin:0"><label>' + esc(t('نوع المهمة')) + '</label>'
    +   '<select id="asnKind">' + Object.keys(WO_KINDS).map(function(k){
          return '<option value="' + k + '"' + (ASN_KIND===k?' selected':'') + '>'
            + WO_KINDS[k].i + ' ' + esc(t(WO_KINDS[k].n)) + '</option>'; }).join('')
    +   '</select></div>'
    +   '<div class="field" style="margin:0"><label>' + esc(t('الموعد')) + '</label>'
    +   '<input type="date" id="asnWhen" value="' + esc(ASN_WHEN) + '"></div>'
    + '</div>'

    + (may('settings') && SEL_N ? '<div class="field" style="margin:12px 0 0;padding:10px 0 0;border-top:1px solid var(--line)"><label>\u{1F3F7} ' + esc(t('أو انقل المحدَّد إلى تصنيف')) + '</label>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap"><select id="selType" aria-label="' + esc(t('التصنيف')) + '" style="flex:1 1 180px">' + Object.keys(typesList()).map(function(k){ return '<option value="' + esc(k) + '">' + esc(typeLabel(k)) + '</option>'; }).join('') + '</select>'
        + btn(t('انقل') + ' ' + nm(SEL_N) + ' ' + t('نقطة'), 'btn-secondary btn-sm', ' data-seltype="1"') + '</div></div>' : '')   /* (V23.0) */
    + (maySiteEdit() && SEL_N ? '<div class="field" style="margin:10px 0 0"><label>\u270E ' + esc(t('أو سمِّ المحدَّد: بدايةُ الاسم ثم رقمٌ متتابع')) + '</label>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap"><input id="selNamePfx" dir="auto" placeholder="' + esc(t('مثلًا: كاميرا وزارة LPR — عرفات —')) + '" aria-label="' + esc(t('بدايةُ الاسم')) + '" style="flex:1 1 200px">'
        + '<input id="selNameFrom" type="number" min="1" value="1" inputmode="numeric" aria-label="' + esc(t('يبدأ الترقيم من')) + '" style="width:80px">'
        + btn(t('سمِّ') + ' ' + nm(SEL_N), 'btn-secondary btn-sm', ' data-selname="1"') + '</div></div>' : '')   /* (V23.1) */
    + '<div class="actions" style="margin-top:12px">'
    +   btn(ASN_MODE === 'team'
            ? (t('وزّع') + ' ' + nm(SEL_N) + ' ' + t('نقطة على الفريق'))
            : (have ? (t('حدّث') + ' \u2190 ' + nm(SEL_N) + ' ' + t('نقطة'))
                    : (t('أسند') + ' ' + nm(SEL_N) + ' ' + t('نقطة'))),
            'btn-primary',' data-asngo="1"')
    +   (have ? btn('افتح على ما لديه','btn-secondary',' data-asnload="1"') : '')
    +   btn('حدّد من الخريطة','btn-secondary',' data-asnmap="1"')
    +   btn('إلغاء','btn-secondary',' data-asn="0"')
    + '</div>'
    + '<p class="hint">' + esc(t('المُسنَدُ لا يُحدَّد ثانيةً — فلا يُشتّت فنيّان على نقطةٍ واحدة.')) + '</p>'
    + '</div></div>';
}

function curTech(){
  return (document.getElementById('asnTo') || {}).value || ASN_TO || techNames()[0] || '';
}

/* الحفظُ توفيقٌ لا إنشاءٌ فقط: ما زِيد يُنشَأ وما نُقص يُلغى —
   فيُفتَح اللوحُ على خمسٍ فتُجعَل سبعًا أو ثلاثًا بالتحديد نفسه. */
var ASN_TEAM = 'T1';

/* التوزيعُ على أعضاء الفريق: بالنسب المعرَّفة أو بالتساوي —
   فيأخذ القائدُ نصيبَه والمساعدُ نصيبَه، ولا تُترَك نقطةٌ بلا صاحب. */
function asnTeamCommit(){
  var tm = teamOf((document.getElementById('asnTeam') || {}).value || ASN_TEAM);
  if (!tm || !tm.members.length){ toast(t('لا أعضاءَ في هذا الفريق')); return; }
  var split = (document.getElementById('asnSplit') || {}).value || 'share';
  var kind  = (document.getElementById('asnKind') || {}).value || LAYER().kind;
  var when  = (document.getElementById('asnWhen') || {}).value || '';
  var ids   = selIds().filter(function(id){ var a = asnOf(id); return !a; });
  /* طلبُ التركيب (DR) لا يُتاح لنقطةٍ إلا بعد اعتماد حلِّها — فلا يُرسَل
     فريقٌ بعدَّةٍ لم تُعتمد بعد. */
  /* الفحصُ بالسلسلة لكلِّ نوعٍ — لا للتركيب وحده — والرفضُ يسمّي الخطوة */
  var blockedSol = 0, firstBlock = null;
  var okIds = ids.filter(function(id){
    var g = gateFirst(kind, siteFind(id));
    if (g){ if (!firstBlock) firstBlock = g; return false; }
    return true;
  });
  blockedSol = ids.length - okIds.length;
  ids = okIds;
  if (!ids.length){
    if (firstBlock) gateSay(firstBlock);
    else toast(t('حدّد نقاطًا أولًا'));
    return;
  }

  var tot = teamShare(tm);
  var quota = tm.members.map(function(m){
    return split === 'even'
      ? Math.floor(ids.length / tm.members.length)
      : Math.round(ids.length * cfgN(m.share) / (tot || 1));
  });
  /* ما تبقّى بالكسر يُعطى الأوّلَ فالأوّل فلا تضيع نقطة */
  var given = quota.reduce(function(a,b){ return a + b; }, 0);
  for (var k = 0; given < ids.length; k = (k + 1) % tm.members.length){ quota[k]++; given++; }

  var at = 0, made = 0, log = [];
  tm.members.forEach(function(m, i){
    var mine = ids.slice(at, at + quota[i]);
    at += quota[i];
    if (!mine.length) return;
    mine.forEach(function(id){
      var tid = 'TK-' + kind + '-' + id;
      CORE.set('tasks', tid, {
        id:tid, no:reqNext(kind), site:id, kind:kind, to:m.name, assignedTo:m.name, team:tm.id,
        status:'مطلوب', when:when, by:STATE.meta.name || '', at:Date.now()
      });
      made++;
    });
    log.push(m.name + ' ' + nm(mine.length));
  });

  logEvent('إسناد لفريق ' + tm.n + ' — ' + nm(made) + ' نقطة · ' + log.join(' · '));
  selClear(); ASN_OPEN = false; statBump();
  toast(tm.n + ' \u00b7 ' + nm(made) + ' ' + t('نقطة') + ' \u00b7 ' + log.join(' \u00b7 ')
        + (blockedSol ? ' \u00b7 ' + nm(blockedSol) + ' ' + t('لم تُرسَل — ينقصها ما قبلها') : ''));
  /* ومن رُفض يُقال له أيُّ خطوةٍ ناقصةٌ بعينها لا «لا يجوز» */
  if (blockedSol && firstBlock)
    gateSay(firstBlock);
  render(1);
}


/* ═══ الجاهزُ لكلِّ نوعِ طلب ═══
   كان إنشاءُ الطلب يبدأ من الخريطة دائمًا: تُفتَح، وتُبدَّل الطبقةُ إلى
   النوع المطلوب، وتُحدَّد النقاطُ واحدةً واحدةً أو بـ«حدّد الكل»، ثم يُفتَح
   اللوح. فمن أراد إسنادَ فكِّ ما سُلِّم لم يعرف كم هو ولا أين يبدأ — وسُئل:
   «أين طلبُ التركيب وطلبُ الفكّ؟ أمِن الخريطة فقط؟».
     صار في «توزيع الفرق» صفٌّ لكلِّ نوع: كم نقطةً جاهزةً له الآن، وما
   الشرطُ الذي يجعلها جاهزة، وزرٌّ واحدٌ يحدّدها كلَّها ويفتح لوحَ الإسناد
   على نوعها. والخريطةُ تبقى الطريقَ الآخر لمن أراد اختيارًا بعينه. */
var ASN_READY = {
  visit:   { layer:'survey',  why:'لم تُزر ولم تُسنَد بعد',
             ok:function(x){ return !svDone(STATE.recs[x.id]); } },
  install: { layer:'install', why:'اعتمدت الوزارةُ إعدادَها وحلُّها معتمدٌ ولم تُركَّب',
             ok:function(x){ var so = solutionOf(x.id);
                             return minOk(x.id) && !!so && so.status === 'معتمد' && !insDone(x.id); } },
  maint:   { layer:'install', why:'رُكِّبت واعتُمدت — تُخدَم في أثناء الموسم',
             ok:function(x){ return insDone(x.id); } },
  dis:     { layer:'dis',     why:'سُلِّمت بمحضرٍ ولم تُفَكّ',
             ok:function(x){ return (typeof handDone === 'function') && handDone(x.id) && !disDone(x.id); } }
};
function asnReadyList(kind){
  var R = ASN_READY[kind];
  if (!R) return [];
  /* الحجبُ بالنوع لا بأيِّ إسنادٍ مفتوح: كان `asnOf` يُرجِع أيَّ مهمةٍ
     مفتوحةٍ على النقطة أيًّا كان نوعُها — فنقطةٌ رُكِّبت وسُلِّمت ومهمةُ
     تركيبها لم تُغلَق بعد لا تظهر جاهزةً للصيانة ولا للفكِّ أبدًا، وهو
     الحالُ الغالبُ في الميدان: المهمةُ تُغلَق باعتماد المهندس لا بالتركيب.
     فيُسأل عن مهمةٍ **من هذا النوع** وحدَها. */
  return (STATE.sites || []).filter(function(x){
    return !taskKindOf(x.id, kind) && R.ok(x);
  });
}
/* زرٌّ واحد: يحدّد الجاهزَ ويفتح اللوحَ على نوعه في الخريطة */
var ASN_QCAP = 300;
function asnQuick(kind){
  if (!may('approve')){ toast(t('إنشاءُ الطلب للمهندس وحده')); return; }
  var L = asnReadyList(kind);
  if (!L.length){
    toast(t('لا نقطةَ جاهزةً لهذا النوع') + ' — ' + t(ASN_READY[kind].why));
    return;
  }
  selClear();
  var n = 0;
  L.forEach(function(x){ if (n < ASN_QCAP){ SEL[x.id] = 1; SEL_N++; n++; } });
  ASN_KIND = kind;
  FIELD_MODE = ASN_READY[kind].layer;
  ASN_MODE = (ASN_KIND_DEST[kind] === 'team') ? 'team' : 'tech';
  ASN_OPEN = true;
  goPage('map');
  render(1);
  /* إعادةُ الطلاء تفشل إن لم تُنشَأ الخريطةُ بعدُ — والرسمُ التالي يتولّاها */
  if (typeof mapPaint === 'function'){
    try { mapPaint(); }
    catch (e){ if (typeof softErr === 'function') softErr('طلاء الخريطة', e, ''); }
  }
  toast(nm(n) + ' ' + t('نقطةً جاهزةً حُدِّدت')
        + (L.length > n ? ' \u00b7 ' + nm(L.length - n) + ' ' + t('بقيت — أسندها بعدها') : ''));
}
function asnReadyCard(){
  var rows = Object.keys(ASN_READY).map(function(k){
    var K = WO_KINDS[k] || { i:'', n:k };
    var n = asnReadyList(k).length;
    var open = 0;
    Object.keys(STATE.tasks || {}).forEach(function(t2){
      var x = STATE.tasks[t2];
      if (x && x.kind === k && x.status !== 'معتمد') open++;
    });
    return [K.i + ' <strong>' + esc(t(K.n)) + '</strong><br>'
              + '<span class="hint" style="margin:0">' + esc(t(ASN_READY[k].why)) + '</span>',
            n ? '<b class="num">' + nm(n) + '</b>' : N(0),
            N(open),
            n && may('approve')
              ? btn(t('أسند') + ' \u2190', 'btn-primary btn-sm', ' data-asnq="' + k + '"')
              : '<span class="hint" style="margin:0">' + esc(t(n ? '—' : 'لا جاهزَ الآن')) + '</span>'];
  });
  return cardFlush('\u{1F4E6} ' + t('جاهزٌ للإسناد — لكلِّ نوعِ طلب'),
      table(['النوع والشرط','جاهز','مفتوحٌ الآن',''], rows)
      + '<p class="hint" style="margin:10px 0 0">'
      + esc(t('الزرُّ يحدّد الجاهزَ كلَّه ويفتح لوحَ الإسناد على نوعه — والخريطةُ تبقى الطريقَ الآخر لمن أراد اختيارًا بعينه.')) + '</p>');
}

/* ═══ سلسلةُ الشروط: لماذا لا يُسنَد هذا ═══
   الرفضُ كان جملةً واحدةً: «لا حلَّ معتمدًا» أو «لم تُسلَّم بمحضر». والجملةُ
   صحيحةٌ ولا تكفي: من يسمعها لا يعرف أينَ هو من السلسلة، ولا ما الخطوةُ
   التي تسبقها، ولا كم بقي حتى يصل. فصارت لكلِّ نوعٍ سلسلتُه معروضةً كاملةً:
   ما تمَّ منها بعلامته، وأوّلُ ما ينقص بسببه وزرِّ الذهاب إليه، وما بعده
   رماديًّا — فيُرى الطريقُ كلُّه لا العقبةُ وحدَها.
     والسلسلةُ واحدةٌ في كلِّ موضع: في لوح الإسناد، وفي نافذة النقطة،
   وفي رسالة الرفض — فلا يُقال في موضعٍ ما لا يُقال في آخر. */
function gateChain(kind, x){
  if (!x) return [];
  var id = x.id, r = STATE.recs[id], ins = STATE.inss[id] || {};
  var sv   = { t:'زيارةُ مسحٍ محفوظة',   ok:svDone(r),                    p:'svForm',   why:'لا تُخطَّط نقطةٌ لم تُزَر — القياساتُ والصورُ منها' };
  var svOk = { t:'اعتمادُ الزيارة',      ok:svReview(r) === 'approved',   p:'svappr',   why:'المهندسُ يراجع ما زاره الميدانُ قبل أن يُبنى عليه' };
  var sol  = { t:'حلٌّ معتمدٌ بالقطع',    ok:((ins.solution || {}).status === 'معتمد'), p:'solution', why:'لا يُركَّب شيءٌ قبل أن يُعتمَد ما يُركَّب' };
  var insD = { t:'تركيبٌ مسجَّل',         ok:ins.status === 'مُركّب',       p:'insForm',  why:'ما لم يُسجَّل تركيبُه لا يُدقَّق ولا يُسلَّم' };
  var qa   = { t:'اعتمادُ التركيب',      ok:!!ins.approved,                p:'qa',       why:'التدقيقُ الهندسيُّ يسبق التسليم — والصورُ والسيرياتُ تُراجَع' };
  var hd   = { t:'تسليمٌ بمحضر',          ok:(typeof handDone === 'function') && handDone(id), p:'hand', why:'الفكُّ إرجاعُ ما سُلِّم — فلا يُفَكُّ ما لم يُسلَّم' };
  var C = { visit:[], install:[sv, svOk, sol], maint:[sv, svOk, sol, insD, qa], dis:[sv, svOk, sol, insD, qa, hd] }[kind] || [];
  /* ولا يُسنَد ما هو مُسنَدٌ من نوعه بالفعل */
  var t2 = taskKindOf(id, kind);
  if (t2) C = C.concat([{ t:'ليس مُسنَدًا من قبل', ok:false, p:'reqreg',
                          why:'عليه إسنادٌ مفتوحٌ من هذا النوع — ' + (t2.no || '') + ' لـ' + (dispName(t2.to) || '') }]);
  return C;
}
function gateFirst(kind, x){
  var C = gateChain(kind, x);
  for (var i = 0; i < C.length; i++) if (!C[i].ok) return C[i];
  return null;
}
function gateCard(kind, x){
  var C = gateChain(kind, x);
  if (!C.length) return card('\u2705 ' + t('الطريقُ مفتوح'),
    '<p class="hint" style="margin:0">' + esc(t('لا شرطَ قبل هذا النوع — يُسنَد مباشرةً.')) + '</p>');
  var first = gateFirst(kind, x), hit = false;
  return cardFlush((first ? '\u26D4 ' : '\u2705 ') + t('ما يسبق هذه الخطوة'),
      table(['الخطوة','الحال','لماذا'],
        C.map(function(g){
          var cur = !g.ok && !hit; if (!g.ok) hit = true;
          return ['<strong style="' + (g.ok ? '' : 'opacity:.6') + '">' + esc(t(g.t)) + '</strong>',
                  g.ok ? pill('تمّ','ok')
                       : (cur ? pill('ابدأ هنا','off') : pill('بعده','')),
                  '<span class="hint" style="margin:0">' + esc(t(g.why)) + '</span>'
                    + (cur && seesPage(PARENT[g.p] || g.p)
                        ? ' ' + btn('\u2190 ' + t('اذهب'),'btn-quiet btn-sm',' data-p="' + esc(g.p) + '"') : '')];
        }))
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t(first ? 'أنجِز «ابدأ هنا» أوّلًا — وما بعده يُفتَح تلقائيًّا.'
                    : 'كلُّ ما يسبق هذه الخطوة تمّ — تُسنَد الآن.')) + '</p>');
}
/* رسالةُ الرفض تقول الخطوةَ الناقصةَ وسببَها لا «لا يجوز» — نصٌّ واحدٌ
   يستعمله المسارُ الفرديُّ والجماعيُّ ونافذةُ النقطة، فلا يُقال في موضعٍ
   ما لا يُقال في آخر. */
function gateSay(g){
  if (!g) return false;
  toast(t('قبل هذه الخطوة') + ': ' + t(g.t) + ' \u2014 ' + t(g.why));
  return true;
}
function asnCommit(){
  if (ASN_MODE === 'team'){ asnTeamCommit(); return; }
  var to   = curTech();
  var kind = (document.getElementById('asnKind') || {}).value || ASN_KIND;
  var when = (document.getElementById('asnWhen') || {}).value || '';
  if (!to){ toast(t('اختر فنيًّا')); return; }

  var want = selIds();
  var had  = asnOfTech(to, kind);
  var add = 0, rm = 0, busy = 0, blockedSol = 0, firstBlock = null;
  /* موعدٌ مضى يُقبَل — قد يُسجَّل عملٌ بأثرٍ رجعيّ — لكن يُقال لئلّا يكون خطأَ أصبع */
  if (when && when < dayKey(Date.now())) toast(t('تنبيه: الموعدُ في الماضي') + ' \u00b7 ' + when);

  /* المُضاف */
  want.forEach(function(id){
    if (had.indexOf(id) > -1) return;
    var other = asnOf(id);
    if (other && other.to !== to){ busy++; return; }
    /* الشرطُ يُفحَص بالسلسلة نفسِها لكلِّ نوعٍ — لا للتركيب وحده */
    var gb = gateFirst(kind, siteFind(id));
    if (gb){ blockedSol++; if (!firstBlock) firstBlock = gb; return; }
    var tid = 'TK-' + kind + '-' + id;
    CORE.set('tasks', tid, {
      id:tid, no:reqNext(kind), site:id, kind:kind, to:to, assignedTo:to,
      status:'مطلوب', when:when, by:STATE.meta.name || '', at:Date.now()
    });
    add++;
  });

  /* المسحوب — ما كان لديه وخرج من التحديد */
  had.forEach(function(id){
    if (want.indexOf(id) > -1) return;
    var tk = asnOf(id);
    if (tk && tk.to === to && tk.status === 'مطلوب'){ CORE.rm('tasks', tk.id); rm++; }
  });

  if (!add && !rm){
    if (blockedSol && firstBlock) gateSay(firstBlock);
    else toast(t('لا تغيير'));
    return;
  }
  logEvent('إسناد ' + to + ' · +' + nm(add) + (rm ? ' \u2212' + nm(rm) : '')
           + ' \u00b7 ' + t(WO_KINDS[kind].n));
  selClear();
  ASN_BASE = [];
  ASN_OPEN = false;
  statBump();
  toast(to + ' \u00b7 ' + (add ? '+' + nm(add) + ' ' : '') + (rm ? '\u2212' + nm(rm) + ' ' : '')
        + '= ' + nm(asnOfTech(to, kind).length) + ' ' + t('نقطة')
        + (busy ? ' \u00b7 ' + nm(busy) + ' ' + t('مُسندةٌ لغيره') : '')
        + (blockedSol ? ' \u00b7 ' + nm(blockedSol) + ' ' + t('بلا حلٍّ معتمد') : ''));
  /* آخرُ إسنادٍ يُحفَظ ليُبلَّغ صاحبُه واتساب بضغطة */
  if (add){
    var addedIds = want.filter(function(id){
      var tk = taskKindOf(id, kind); return tk && tk.to === to && had.indexOf(id) < 0;
    });
    if (addedIds.length) WA_LAST = { to:to, kind:kind, ids:addedIds, when:when || '' };
  }
  render(1);
}

/* ── صفحة الطلبات: الأرقام الحقيقية والإجراءات ── */
PAGE.req = { m:'الميدان', t:'الطلبات والتوزيع',
  l:'طلباتُ الزيارة وتوزيعُ الفرق عليها.',
  body:function(){
    var head = tabHead('req'), cur = tabCur('req');
    if (cur === 'reqreg') return head + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الإسنادات'),'btn-secondary btn-sm',' data-xls="asnreg"') + '</div>' + waAsnCard() + (function(){
    var L0 = regList();
    var byKind = {};
    L0.forEach(function(x){ byKind[x.kind] = (byKind[x.kind] || 0) + 1; });
    var kinds = Object.keys(WO_KINDS).filter(function(k){ return byKind[k]; });
    var L = L0.filter(function(x){
      if (REG_KIND && x.kind !== REG_KIND) return false;
      if (REG_ST && regStatus(x).t !== REG_ST) return false;
      if (REG_Q && (x.site + ' ' + (x.no || '') + ' ' + (x.to || '')).indexOf(REG_Q) < 0) return false;
      return true;
    });
    var sts = {};
    L0.forEach(function(x){ var st = regStatus(x).t; sts[st] = (sts[st] || 0) + 1; });
    var ed = may('approve');

    return '<div class="chips">'
      + '<button type="button" class="chip' + (REG_KIND ? '' : ' on') + '" data-regk="">'
      +   esc(t('كل الأنواع')) + ' <span class="num">' + nm(L0.length) + '</span></button>'
      + kinds.map(function(k){
          var K = WO_KINDS[k];
          return '<button type="button" class="chip' + (REG_KIND === k ? ' on' : '') + '" data-regk="' + k + '">'
            + K.i + ' ' + esc(t(K.n)) + ' <span class="num">' + nm(byKind[k]) + '</span></button>';
        }).join('') + '</div>'

      + '<div class="chips">'
      + '<button type="button" class="chip' + (REG_ST ? '' : ' on') + '" data-regs="">' + esc(t('كل الحالات')) + '</button>'
      + Object.keys(sts).map(function(st){
          return '<button type="button" class="chip' + (REG_ST === st ? ' on' : '') + '" data-regs="' + esc(st) + '">'
            + esc(t(st)) + ' <span class="num">' + nm(sts[st]) + '</span></button>';
        }).join('') + '</div>'

      + card('بحث',
          '<input type="search" id="regQ" data-regq="1" value="' + esc(REG_Q) + '" placeholder="'
          + esc(t('ابحث بالنقطة أو رقم الطلب أو المُسنَد إليه')) + '" dir="auto">')

      + (L.length
        ? cardFlush(t('السجل') + ' — ' + nm(L.length) + ' ' + t('من') + ' ' + nm(L0.length),
            table(['الطلب','النقطة','المُسنَد إليه','الموعد','الحالة',''],
              capList(L, 200).map(function(x){
                var st = regStatus(x), K = WO_KINDS[x.kind] || { i:'', n:x.kind };
                var site = siteFind(x.site);
                var on = REG_EDIT === x.id;
                return ['<span class="num">' + esc(x.no || '—') + '</span><br>'
                          + '<span class="hint" style="margin:0">' + K.i + ' ' + esc(t(K.n)) + '</span>',
                        '<span class="num">' + esc(x.site) + '</span><br>'
                          + '<span class="hint" style="margin:0">' + esc(((site && site.name) || '').slice(0, 22)) + '</span>',
                        on
                          ? '<select data-regto="' + esc(x.id) + '">'
                            + techsList().map(function(p2){
                                return '<option value="' + esc(p2.n) + '"' + (p2.n === x.to ? ' selected' : '') + '>'
                                  + esc(p2.n) + '</option>'; }).join('')
                            + crewsList().map(function(c){
                                return '<option value="' + esc(c.n) + '"' + (c.n === x.to ? ' selected' : '') + '>'
                                  + esc(c.n) + '</option>'; }).join('') + '</select>'
                          : esc(dispName(x.to) || '—'),
                        on
                          ? '<input type="date" value="' + esc(x.when || '') + '" data-regwhen="' + esc(x.id) + '" style="width:150px">'
                          : (x.when ? '<span class="num">' + esc(x.when) + '</span>' : '—'),
                        pill(st.t, st.c),
                        !ed ? '—'
                        : on
                          ? '<div class="actions" style="margin:0">'
                            + btn('احفظ','btn-primary btn-sm',' data-regsave="' + esc(x.id) + '"')
                            + btn('إلغاء','btn-quiet btn-sm',' data-regedit=""') + '</div>'
                          : '<div class="actions" style="margin:0">'
                            /* من لم يُبلَغ بعدُ يُبلَّغ واتساب من هنا — والمُبلَّغُ يُعلَّم */
                            + (x.status !== 'معتمد'
                                ? btn(x.waAt ? '\u2713\u{1F4F1}' : '\u{1F4F1}','btn-quiet btn-sm',' data-watask="' + esc(x.id) + '" aria-label="' + esc(t('واتساب')) + '"')
                                : '')
                            + btn('✎','btn-quiet btn-sm',' data-regedit="' + esc(x.id) + '" aria-label="' + esc(t('تعديل')) + '"')
                            + btn('🗺','btn-quiet btn-sm',' data-site="' + esc(x.site) + '" aria-label="' + esc(t('على الخريطة')) + '"')
                            + (st.t === 'منجَز' ? '' : btn('🗑','btn-danger btn-sm',' data-regdel="' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"'))
                            + '</div>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">'
            + esc(t(L0.length ? 'لا إسنادَ يطابق الترشيح.' : 'لا إسناداتٍ بعد — تُنشأ من الخريطة أو «طلبات الزيارة».')) + '</p>'))

      + '<p class="hint">' + esc(t('المنجَزُ لا يُحذَف: نقاطُ صاحبه بُنيت عليه. والزيارةُ التي تمّت تُعتمَد أو تُردُّ في «اعتماد الزيارات» ولا تُمحى.')) + '</p>';
  })();
    if (cur === 'assign') return head + (function(){
    var C = catCounts(), S = siteStats();
    var rows = [], keys = Object.keys(S.byKey);
    keys.sort();
    keys.forEach(function(k){
      var p = k.split('|'), tot = S.byKey[k], sv = 0, asn = 0;
      STATE.sites.forEach(function(x){
        if (x.zone !== p[0] || x.type !== p[1]) return;
        if (svDone(STATE.recs[x.id])) sv++;
        if (asnOf(x.id)) asn++;
      });
      var d = CAT_DEF[p[1]] || { l:p[1], i:'\u25CF' };
      var sub = '';
      if (p[1] === 'كاميرا'){   /* ثابتةٌ ومتحرّكة (V19.1) */
        var ck = {}; STATE.sites.forEach(function(x){ if (x.zone === p[0] && x.type === 'كاميرا'){ var q = camKind(x); ck[q] = (ck[q] || 0) + 1; } });
        sub = '<div class="hint" style="margin:2px 0 0">' + Object.keys(ck).map(function(q){ return esc(camKindLabel(q)) + ' ' + nm(ck[q]); }).join(' \u00b7 ') + '</div>';
      }
      rows.push([esc(p[0]), d.i + ' ' + esc(t(d.l)) + sub, N(tot), N(sv), N(asn),
                 '<b>' + nm(tot - sv - asn) + '</b>']);
    });
    var totAll = S.total, svAll = S.surveyed;
    var asnAll = 0;
    STATE.sites.forEach(function(x){ if (asnOf(x.id)) asnAll++; });

    return stats([['الإجمالي', N(totAll)], ['ممسوح', N(svAll), 'acc'],
                  ['مُسند', N(asnAll), 'wrn'], ['متاح', N(totAll - svAll - asnAll), 'ok']])
      + asnReadyCard()
      + cardFlush('المتاح لكل مشعرٍ ونوع',
          table(['المشعر','النوع','الإجمالي','ممسوح','مُسند','متاح'], rows,
                ['الإجمالي','', N(totAll), N(svAll), N(asnAll), N(totAll - svAll - asnAll)]),
          '<div class="actions">'
          + btn('➕ إنشاء طلب','btn-primary btn-sm',' data-asn="1"')
          + btn('🗺 تحديد من الخريطة','btn-secondary btn-sm',' data-asnmap="1"')
          + '</div>')
      + '<p class="hint">' + esc(t('«المتاح» ما لم يُمسح ولم يُسند بعد. والأوزانُ والتارجت في شاشة الإعدادات.')) + '</p>';
  })();
    return head + (function(){
    var T = STATE.tasks, by = {};
    TK_ST.forEach(function(s){ by[s] = 0; });
    var rows = [];
    Object.keys(T).forEach(function(k){
      var x = T[k];
      by[x.status] = (by[x.status] || 0) + 1;
      rows.push(x);
    });
    rows.sort(function(a,b){ return b.at - a.at; });

    return stats([['مطلوب', N(by['مطلوب']||0)],
                  ['قيد التنفيذ', N(by['قيد التنفيذ']||0), 'wrn'],
                  ['منفّذ', N(by['منفّذ']||0), 'acc'],
                  ['معتمد', N(by['معتمد']||0), 'ok']])
      + card('دورة الطلب',
          flow(TK_ST.slice(0,4), 0)
          + '<p class="hint">' + esc(t('والإعادة ترجعه للمنفِّذ بحالة «مُعاد» مع سبب.')) + '</p>',
          '<div class="actions">'
          + btn('➕ إنشاء طلب','btn-primary btn-sm',' data-asn="1"')
          + btn('🗺 حدّد من الخريطة','btn-secondary btn-sm',' data-asnmap="1"')
          + '</div>')
      + (rows.length
        ? cardFlush(t('الطلبات') + ' — ' + nm(rows.length),
            table(['الرقم','النقطة','النوع','الفني','الموعد','الحالة',''],
              rows.slice(0, 60).map(function(x){
                var s = siteFind(x.site), k = WO_KINDS[x.kind] || { i:'', n:x.kind };
                return ['<span class="num">' + esc(x.no || '—') + '</span>',
                        '<strong>' + esc(x.site) + '</strong><br>'
                        + '<span class="hint" style="margin:0">' + esc((s && s.name || '').slice(0,32)) + '</span>',
                        k.i + ' ' + esc(t(k.n)), esc(x.to),
                        x.when ? '<span class="num">' + esc(x.when) + '</span>' : '—',
                        pill(x.status, x.status==='معتمد'?'ok':(x.status==='مُعاد'?'off':'warn')),
                        '<div class="actions">'
                        + (x.status !== 'معتمد'
                          ? btn('اعتمد','btn-quiet btn-sm',' data-tkok="' + esc(x.id) + '"') : '')
                        + btn('ألغِ','btn-quiet btn-sm',' data-tkrm="' + esc(x.id) + '"')
                        + '</div>'];
              })),
            btn('⬇ إكسل — المهام','btn-secondary btn-sm',' data-xls="tasks"'))
        : card('الطلبات',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('لا طلبات بعد — أنشئ أول طلب بتحديد نقاط من القائمة أو الخريطة.')) + '</p>'))
      + (ASN_OPEN ? asnSheet() : '');
  })();
  }};

/* ── المتاح والمُسند: جدولٌ يُظهر ما بقي ── */

/* ── وضع التحديد على الخريطة ── */
var MAP_SELECT = false;

function mapSelBar(){
  if (!MAP_SELECT) return '';
  return '<div class="map-selbar">'
    + '<span>' + esc(t('اضغط النقاط على الخريطة لتحديدها ثم «أسند لفني»')) + '</span>'
    + '<b class="num">' + nm(SEL_N) + '</b>'
    + '<div class="actions" style="margin-inline-start:auto">'
    + btn('أسند لفني','btn-primary btn-sm',' data-asn="1"')
    + btn('إلغاء','btn-secondary btn-sm',' data-selmap="0"')
    + '</div></div>';
}

/* ── خريطة الفني: ما أُسند إليه وحده ── */
;

/* الفنيُّ يرى ما أُسند إليه وحده على الخريطة */
var MY_ONLY = false;

function mineFiltered(){
  var me = STATE.meta.name || '';
  var ids = Object.create(null);
  Object.keys(STATE.tasks).forEach(function(k){
    var x = STATE.tasks[k];
    if (x.to === me && x.status !== 'معتمد') ids[x.site] = 1;
  });
  return STATE.sites.filter(function(x){ return ids[x.id]; });
}

/* ═══ النماذج الميدانية — تكتب فعلًا في المحرك ═══
   دورةُ المهمة: مطلوب ← قيد التنفيذ ← منفّذ ← معتمد (أو مُعاد بسبب).
   ولا نقاطَ تُحتسب قبل الاعتماد. */

var TK_ST = ['مطلوب','قيد التنفيذ','منفّذ','معتمد','مُعاد'];

var FORM = { site:'', mount:'', power:'', height:'', cable:'', chals:[], note:'',
             photos:{}, parts:{}, serials:{}, prefix:'', status:'', access:'تم الوصول',
             /* ما نقص عن القديم: القياساتُ والكمياتُ والتقدير */
             len_m:'', wid_m:'', hgt_m:'', fit:'', tents:'', gates:'', old_net:'',
             corr_w:'', kits:'', jam_pos:'', old_base:'', old_cable:'',
             cam_ok:'', router_sp:'', power_src:'', pdist:'', p24:'', power_note:'',
             n_ant:'', n_rdr:'', n_cam:'', n_sens:'', metal:'',
             chal_note:'', civil:'', equip:'', hours:'', crew_n:'', power_yn:'', kits_done:'' };
var SV_EXTRA_KEYS = ['len_m','wid_m','hgt_m','fit','tents','gates','corr_w','kits','jam_pos','power_yn','kits_done',
                     'old_base','old_cable','old_net','cam_ok','router_sp','power_src','pdist','p24',
                     'power_note','n_ant','n_rdr','n_cam','n_sens','metal','chal_note',
                     'civil','equip','hours','crew_n'];

/* التحدياتُ من الميدان لا من الخيال، ولكلِّ نوعِ موقعٍ تحدياتُه: العارضةُ
   الحديديةُ شأنُ المخيم، والنفقُ والكوبري شأنُ الممر. وستُّ مفرداتٍ عامةٍ
   تصلح لكلِّ شيءٍ ولا تصف شيئًا — والمكتبُ لا يقرّر بها. */
var CH_CAMP = ['العارضة الحديدية ناقصة أو غير مكتملة',
               'يوجد ديكور أو لافتات على العارضة',
               'تصميم المدخل لا يسمح بالتركيب',
               'المدخل مشترك مع مخيم آخر',
               'المدخل غير واضح — لم يُستدل عليه',
               'مبنى متعدد الأدوار (أبراج)',
               'لا يوجد سطح تثبيت — يحتاج هيكلًا جديدًا',
               'ارتفاع صعب الوصول',
               'لا يوجد مسار كابل',
               'عائق إنشائي',
               'أخرى — اذكرها في وصف التحدي'];
var CH_PATH = ['المسار داخل نفق',
               'المسار تحت كوبري',
               'المسار أعرض من طقم واحد',
               'ازدحام دائم يمنع العمل نهارًا',
               'لا يوجد سطح تثبيت — يحتاج عمودًا أو هيكلًا جديدًا',
               'ارتفاع صعب الوصول',
               'لا يوجد مسار كابل',
               'عائق إنشائي',
               'أخرى — اذكرها في وصف التحدي'];
/* (V30.3) قائمةٌ من الإعدادات إن كُتبت، وإلا الأصلية */
function cfgList(key, def){ var L = CFG.lists && Array.isArray(CFG.lists[key]) ? CFG.lists[key].map(function(x){ return String(x || '').trim(); }).filter(Boolean) : []; return L.length ? L : def; }
function chalsOf(x){
  return ['لا توجد تحديات'].concat((x && x.type === 'مخيم') ? cfgList('chalsCamp', CH_CAMP) : cfgList('chalsPath', CH_PATH));
}
var CHALS = ['لا توجد تحديات'].concat(CH_CAMP);   /* للتوافق مع ما يقرؤها عامًّا */

/* حالةُ الوصول أوّلُ سؤالٍ في الميدان: من مُنع من الدخول لا يُسأل عن المقاسات،
   والموقعُ الذي لم يُوصَل إليه يبقى «لم يبدأ» بلا سببٍ إن لم يُسجَّل المنع. */
var SV_ACCESS = ['تم الوصول','منع دخول','غير موجود','يحتاج تصريح'];

/* أسبابُ التبليغ من الميدان — كانت في القديم ستًّا وسقطت. والاختيارُ من
   قائمةٍ يُفرَز به البلاغُ ويُوجَّه: نقصُ العهدة للمخزن، وسؤالُ السيريال
   للورشة، والقرارُ للمكتب. والنصُّ الحرُّ يصل الجميعَ فلا يحلّه أحد. */
var TELL_WHY = ['تحدٍ يمنع التركيب','أحتاج قرار من المكتب','نقص عهدة أو قطع',
                'سؤال عن السيريال','الموقع مختلف عن السجل','أخرى'];

/* تسعُ صورٍ كما في العامل: أولاها تُطابِق الموقعَ، وبقيتُها يُخطَّط بها. */
var SV_PHOTOS = [
  ['site','لقطة عامة تُظهر رقم الموقع',1],
  ['mount','نقطة التركيب عن قرب',1],
  ['power','مصدر الكهرباء',0],
  ['cable','مسار الكابل',0],
  ['north','الاتجاه شمال',0],
  ['south','الاتجاه جنوب',0],
  ['roof','الارتفاع / السقف',0],
  ['block','العائق إن وُجد',0],
  ['net','لقطة اختبار الشبكة',0]
];

/* الزيارةُ التي مُنع فيها الدخولُ ليست مسحًا: تُسجَّل ليُعرَف السببُ ويُتصرَّف،
   ولا تُحتسب إنجازًا. وإلا صار المنعُ يرفع نسبةَ الإنجاز. */
/* ═══ اعتمادُ الزيارة — الدورةُ الكاملة ═══
   كانت الزيارةُ تُحتسَب منجزةً لحظةَ حفظها، وتدخل من فورها في حلِّ التركيب
   بلا عينٍ تراجعها. والمطلوبُ: المشرفُ يزور ويحفظ ويقول «تمت الزيارة»، ثم
   تظهر النقطةُ ببياناتها الجديدة في «اعتماد الزيارات» فيعتمدها المهندسُ أو
   يردُّها «تحتاج زيارةً أخرى» فتعود إلى الدورة من أولها.
     review: 'pending'  — حُفظت وتنتظر المهندس (الافتراضيُّ لكلِّ سجلٍّ حُفظ)
             'approved' — اعتمدها المهندس؛ عندها يُقترَح حلُّها ويُركَّب
             'revisit'  — رُدَّت؛ لا تُعدُّ منجزةً حتى تُزار ثانيةً
   المنجَزُ (svDone) ما حُفظ بوصولٍ ولم يُرَدّ — فالرَّدُّ يُخرجها من العِداد
   ومن طبقة التركيب معًا. والمعتمَدُ (svApproved) وحدَه يُقترَح له حلّ. */
/* ═══ ثلاثةُ أحوالٍ لا تختلط (V17.77) ═══
   وصلَ فسُجِّلت الزيارة (svDone) · وصلَ فرُدَّت لزيارةٍ أخرى (revisit) · لم يصل
   أصلًا (متعذّر). كانت شاشةٌ تعدُّ المتعذّرَ بلا المردود وأخرى تعدُّهما معًا تحت
   الاسم نفسِه، فتقرأ الوزارةُ رقمين لكلمةٍ واحدة. */
function svReached(r){ return !!r && (!r.access || r.access === 'تم الوصول'); }
function svStuck(r){ return !!r && !svReached(r); }
function svDone(r){ return svReached(r) && r.review !== 'revisit'; }
/* ═══ (V32.6) قرارُ المالك: «زيرت» = زيارةٌ ميدانيةٌ بأيِّ نتيجة ═══
   «رحت للـ٨٨ نقطة زيارةً ميدانية وأخذت الفيدباك» — فأرقامُ تقدّم المسح في كلِّ الشاشات (الملخّص، والقاعة، والخريطة، والوزارة،
   وسلسلةُ المراحل، واللقطةُ اليومية، وقياسُ الخطة، وملفُّ الوزارة اليومي، والتقارير) تعدّ كلَّ نقطةٍ لها زيارة: وُصل، أو تعذّر،
   أو يحتاج تصريحًا، أو رُدَّت لزيارةٍ أخرى. «المتبقي» = ما لم يُزَر أصلًا. أمّا سيرُ العمل (الجاهزيةُ للتركيب، والاعتماد، والحلول،
   ومقترحُ أقرب نقطة، والتحدياتُ والقياسات) فيبقى على svDone — المتعذّرُ يحتاج زيارةً أخرى ولا يُركَّب عليه. (سجلُّ القرارات ق-٠٠٧) */
function svVisited(r){ return !!r && !r.deleted; }
function svApproved(r){ return svDone(r) && r.review === 'approved'; }
function svReview(r){
  if (!r) return '';
  if (r.review === 'revisit') return 'revisit';
  if (r.review === 'approved') return 'approved';
  return svDone(r) ? 'pending' : '';
}
/* مهمةُ الزيارة لهذه النقطة — تُغلَق بالاعتماد فتُحتسب نقاطُها */
function visitTaskOf(site){
  var T = STATE.tasks;
  for (var k in T) if (T[k] && T[k].site === site && T[k].kind === 'visit') return T[k];
  return null;
}
/* ═══ اعتمادان لا اعتمادٌ واحد ═══
   كان اعتمادُ المهندس هو نهايةَ الطريق: تُعتمَد الزيارةُ فتصير النقطةُ جاهزةً
   للتركيب. والواقعُ التعاقديُّ أن الوزارةَ تعتمد إعدادَ التركيب (الموضعَ
   والتثبيتَ والكهرباء) قبل أن يُسنَد تركيبٌ. فصار اعتمادُ المهندس **اعتمادًا
   تقنيًّا** يرفع النقطةَ إلى الوزارة، والوزارةُ تعتمد إعدادَ التركيب أو تُعيده
   بملاحظة — وحينها فقط تصير «جاهزةً للتركيب». في الوثيقة نفسِها: `review`
   للتقني و`minReview` للوزارة، فلا تُفقَد ولا تتعارض. */
function minState(r){
  if (!r || svReview(r) !== 'approved') return '';
  if (r.minReview === 'approved') return 'approved';
  if (r.minReview === 'returned') return 'returned';
  return 'pending';
}
function minOk(id){ return minState(STATE.recs[id]) === 'approved'; }
function minApprove(id, note){
  if (!may('minapprove')){ toast(t('اعتمادُ إعداد التركيب للوزارة')); return false; }
  var r = STATE.recs[id];
  if (minState(r) === '' ){ toast(t('لم تُعتمَد تقنيًّا بعد')); return false; }
  r.minReview = 'approved'; r.minBy = STATE.meta.name || ''; r.minAt = Date.now(); r.minNote = String(note || '').trim();
  CORE.set('recs', id, r);
  logEvent('اعتمادُ الوزارة لإعداد التركيب — ' + id + (r.minNote ? ' \u00b7 ' + r.minNote : ''), id);
  notifPush('اعتمدت الوزارة', id + ' \u2014 ' + t('جاهزةٌ للتركيب'), { site:id, lv:'مهم' });
  statBump(); return true;
}
function minReturn(id, note){
  if (!may('minapprove')){ toast(t('اعتمادُ إعداد التركيب للوزارة')); return false; }
  var r = STATE.recs[id];
  if (minState(r) === ''){ toast(t('لم تُعتمَد تقنيًّا بعد')); return false; }
  note = String(note || '').trim();
  if (!note){ toast(t('اكتب ما تطلبه الوزارةُ تعديلَه')); return false; }
  r.minReview = 'returned'; r.minBy = STATE.meta.name || ''; r.minAt = Date.now(); r.minNote = note;
  CORE.set('recs', id, r);
  logEvent('ردُّ الوزارة لإعداد التركيب — ' + id + ' \u00b7 ' + note, id);
  notifPush('ردّت الوزارة', id + ' \u2014 ' + note, { site:id, lv:'عاجل' });
  statBump(); return true;
}
/* المهندسُ بعد المعالجة يرفعها ثانيةً */
function minResubmit(id, note){
  if (!may('approve')){ toast(t('الرفعُ للوزارة للمهندس وحده')); return false; }
  var r = STATE.recs[id]; if (!r) return false;
  r.minReview = 'pending'; r.minResubmitNote = String(note || '').trim(); r.minResubmitAt = Date.now(); r.minResubmitBy = STATE.meta.name || '';
  CORE.set('recs', id, r);
  logEvent('إعادةُ رفعٍ للوزارة — ' + id + (r.minResubmitNote ? ' \u00b7 ' + r.minResubmitNote : ''), id);
  notifPush('بانتظار اعتماد الوزارة', id + ' \u2014 ' + t('أُعيد رفعُها بعد المعالجة'), { site:id, lv:'مهم' });
  statBump(); return true;
}
function svApprove(id){
  if (!may('approve')){ toast(t('اعتمادُ الزيارة للمهندس وحده')); return false; }
  var r = STATE.recs[id];
  /* ═══ «اعتمدها رغم ذلك» تعني: ارفع الردَّ واعتمد (V17.21) ═══
     كانت الدالةُ تشترط زيارةً منجزة، و«منجزةٌ» تعني ألّا تكون مردودةً لزيارةٍ
     أخرى — فكلُّ صفٍّ تحت «تحتاج زيارة أخرى» يُرفَض اعتمادُه بـ«لا زيارةَ
     منجزةً لهذه النقطة»، وهو بابُ التراجع عن الردِّ نفسِه. صار الاعتمادُ
     يرفع وسمَ الردِّ ويُبقي سببَه في السجل: قرارٌ يُراجَع لا طريقٌ مسدود. */
  if (!r){ toast(t('لا سجلَّ زيارةٍ لهذه النقطة')); return false; }
  if (r.access && r.access !== 'تم الوصول'){ toast(t('لم يصل الميدانُ إلى النقطة — لا تُعتمَد زيارةٌ لم تقع')); return false; }
  /* زيارةٌ سُجِّلت بإضافة نقطةٍ ولم تُستكمَل بياناتُ مسحها لا تُعتمَد (V17.57):
     تصل الوزارةَ فارغةً ويُبنى عليها حلٌّ بلا قياس */
  if (r.src === 'newsite' && !r.mount){ toast(t('بياناتُ المسح لم تُستكمَل بعد — تُستكمَل أو تُرَدّ لزيارةٍ أخرى')); return false; }
  if (r.review === 'revisit'){
    r.revisitCleared = { at:Date.now(), by:STATE.meta.name || '', was:r.revisitNote || '' };
    logEvent('تراجعٌ عن ردِّ الزيارة — ' + id, id);
  }
  r.review = 'approved';
  r.reviewBy = STATE.meta.name || '';
  r.reviewAt = Date.now();
  /* الاعتمادُ التقنيُّ يرفع النقطةَ إلى الوزارة — لا يُنهي الطريق */
  if (r.minReview !== 'approved') r.minReview = 'pending';
  CORE.set('recs', id, r);
  var tk = visitTaskOf(id);
  if (tk && tk.status !== 'معتمد'){ tk.status = 'معتمد'; CORE.set('tasks', tk.id, tk); }
  logEvent('اعتماد تقني — ' + id, id);
  notifPush('اعتماد تقني', 'اعتُمدت زيارةُ ' + id + ' \u2014 ' + t('رُفعت للوزارة'), { to:r.by || '', site:id, lv:'عادي' });
  statBump();
  return true;
}
function svRevisit(id, note){
  if (!may('approve') && rankOf(ROLE) < rankOf('supervisor')){ toast(t('ردُّ الزيارة للمشرف فما فوق'))   /* (V28.6) المشرفُ يردّ زيارةَ فريقه للتصحيح — والاعتمادُ يبقى للمهندس */; return false; }
  var r = STATE.recs[id];
  if (!r){ toast(t('لا سجلَّ مسحٍ لهذه النقطة')); return false; }
  note = String(note || '').trim();
  if (!note){ toast(t('اكتب ما ينقص الزيارةَ — ليعرف المشرفُ ما يعود لأجله')); return false; }
  r.review = 'revisit';
  r.revisitNote = note;
  r.revisitBy = STATE.meta.name || '';
  r.revisitAt = Date.now();
  CORE.set('recs', id, r);
  /* مهمةُ الزيارة تبقى مفتوحةً على صاحبها — تعود إلى «مهامي» بسببها */
  var tk = visitTaskOf(id);
  if (tk && tk.status === 'معتمد'){ tk.status = 'مطلوب'; CORE.set('tasks', tk.id, tk); }
  logEvent('ردّ زيارة — تحتاج زيارةً أخرى — ' + id + ' \u00b7 ' + note, id);
  notifPush('تحتاج زيارة أخرى', id + ' — ' + note, { to:r.by || '', site:id, lv:'مهم' });
  statBump();
  return true;
}

function formSite(){
  return (FORM.site && siteFind(FORM.site)) || STATE.sites[0] || null;
}

/* ═══ ما نقص عن نموذج المسح: القياساتُ والكمياتُ والتقدير ═══
   النموذجُ الجديدُ كان يجمع ستةَ حقول، والقديمُ يجمع سبعةً وعشرين. والمكتبُ لا
   يقرّر بالستة: لا يعرف مقاسَ المساحة ولا كمَّ الأطقم ولا ساعاتِ التركيب.
   والحقولُ تتبع نوعَ الموقع ووجهَ العمل — فلا يُسأل المخيمُ عن عرض المسار. */

var SV_FIT   = ['','مناسب','مناسب بتعديل','غير مناسب'];
var SV_CIVIL = ['','لا','نعم — حفر وقواعد','نعم — تثبيت حديدي فقط'];
var SV_EQUIP = ['','لا يحتاج','سلّم','سقالة','رافعة'];
var SV_PWR   = ['','لوحة قائمة','مقبس قائم','مولّد','طاقة شمسية','لا يوجد'];
var SV_P24   = ['','نعم','لا','غير معروف'];
var SV_METAL = ['','لا يوجد','يوجد قريب','يوجد ملاصق'];
var SV_BASE  = ['','موجود وصالح','موجود ويحتاج إصلاح','غير موجود'];
var SV_CABLE = ['','سليم','جزئي','مفقود'];
var SV_CAM   = ['','تعمل','لا تعمل','غير موجودة'];
var SV_ROUT  = ['','يوجد','ضيق','لا يوجد'];
var SV_KITS  = ['','١','٢','٣'];

/* ═══ الإلزاميُّ يُعلَّم ويُمنَع الحفظُ بدونه ═══
   كانت الحقولُ كلُّها اختياريةً في الشيفرة: يحفظ الفنيُّ زيارةً بلا نوعِ تركيبٍ
   ولا مصدرِ كهرباءَ ولا مقاسات، فيصل المكتبَ سجلٌّ لا يُبنى عليه حلٌّ ويُردُّ
   فتُعاد الزيارة. صار المطلوبُ معلَّمًا بنجمةٍ ومحروسًا عند الحفظ. */
var SV_REQ = ['mount','power','wid_m','hgt_m','fit'];
function reqStar(key){ return SV_REQ.indexOf(key) > -1 ? ' <span class="req">*</span>' : ''; }
function svNum(key, label, hint){
  return '<div class="field"><label>' + esc(t(label)) + reqStar(key) + '</label>'
    + '<input type="number" min="0" step="0.5" data-form="' + key + '" value="'
    + esc(FORM[key] == null ? '' : FORM[key]) + '">'
    + (hint ? '<p class="hint">' + esc(t(hint)) + '</p>' : '') + '</div>';
}
function svSel(key, label, opts, hint){
  return '<div class="field"><label>' + esc(t(label)) + reqStar(key) + '</label>'
    + '<select data-form="' + key + '">' + opts.map(function(o){
        return '<option value="' + esc(o) + '"' + (FORM[key] === o ? ' selected' : '') + '>'
          + (o ? esc(t(o)) : '— ' + esc(t('اختر')) + ' —') + '</option>'; }).join('')
    + '</select>' + (hint ? '<p class="hint">' + esc(t(hint)) + '</p>' : '') + '</div>';
}
function svTxt(key, label, hint){
  return '<div class="field"><label>' + esc(t(label)) + '</label>'
    + '<input data-form="' + key + '" dir="auto" value="' + esc(FORM[key] || '') + '">'
    + (hint ? '<p class="hint">' + esc(t(hint)) + '</p>' : '') + '</div>';
}

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
      '<div class="field"><label>' + esc(t('وصف التحدي بالتفصيل')) + '</label>'
      + '<textarea data-form="chal_note" rows="2" placeholder="'
      + esc(t('ما يحتاجه المكتب ليقرر — مقاسٌ ناقص، جهةٌ تُخاطَب، بديلٌ مقترح')) + '">'
      + esc(FORM.chal_note || '') + '</textarea></div>'
      + '<div class="grid cols-2">'
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
function ipFillMissing(zoneOnly, typeOnly){
  if (!may('edit')){ toast(t('التحريرُ ليس من صلاحيتك')); return; }
  var used = {};
  (STATE.sites || []).forEach(function(x){ if (x.net) used[x.net] = 1; });
  var seq = {}, made = 0, skipped = 0, held = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.net) return;
    if (zoneOnly && x.zone !== zoneOnly) return;
    if (typeOnly && x.type !== typeOnly) return;
    if (ipPreset(x)){ held++; return; }
    var o2 = IP_OCT2[x.zone], o3b = IP_OCT3[x.type];
    if (o2 == null || o3b == null){ skipped++; return; }
    /* الشريحةُ للنوع في مشعره — والتسلسلُ يتقدّم في المشعر كلِّه لا في كلِّ
       نوعٍ على حدة، وإلا تصادمت أنواعٌ تتجاور شرائحُها عند الامتلاء. */
    var key = x.zone + '|' + x.type;
    var i = seq[key] || 0, net = '';
    /* لكلِّ نوعٍ في المشعر أربعون شبكةً (o3b … o3b+39)، وكلُّ شبكةٍ تحمل
       مئتين وخمسين نقطة — يكفي المشروعَ أضعافًا ويبقى المخطَّطُ مقروءًا. */
    while (i < 40 * 250){
      var o3 = o3b + Math.floor(i / 250), o4 = 1 + (i % 250);
      var cand = '10.' + o2 + '.' + o3 + '.' + o4;
      i++;
      if (!used[cand]){ net = cand; break; }
    }
    if (!net){ skipped++; return; }
    seq[key] = i;
    used[net] = 1;
    x.net = net;
    CORE.set('sites', x.id, { net:net, ipRtr:'', ipRdr:'', ipCam:'' });
    made++;
  });
  statBump();
  logEvent('توليد بادئات الشبكة — ' + nm(made) + ' نقطة'
           + (zoneOnly ? ' \u00b7 ' + zoneOnly : '') + (typeOnly ? ' \u00b7 ' + typeOnly : ''));
  toast(made ? (nm(made) + ' ' + t('نقطةً نالت بادئتَها')
                 + (held ? ' \u00b7 ' + nm(held) + ' ' + t('مُركّبةٌ سابقًا تُركت لتُقرأ من الميدان') : '')
                 + (skipped ? ' \u00b7 ' + nm(skipped) + ' ' + t('تُخُطِّيت') : ''))
             : (held ? nm(held) + ' ' + t('نقطةً عنوانُها قائمٌ في الميدان — لا يُخترَع لها بديل')
                     : t('لا نقطةَ بلا بادئةٍ في هذا الترشيح')));
  render(1);
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
    +   '<input type="file" accept="image/*" capture="environment" data-' + tag + '="' + esc(key) + '" style="display:none">'
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
          + '<label class="btn ' + (has ? 'btn-secondary' : 'btn-primary')
          + '" style="cursor:pointer;width:100%">'
          + (has ? '✓ ' + esc(t('التُقطت')) : '📷 ' + esc(t('صوّر أو اختر')))
          + '<input type="file" accept="image/*" data-photo="' + p[0] + '" style="display:none"></label>'
          + (has ? '<div class="hint" style="margin:4px 0 0">' + nm(Math.round(FORM.photos[p[0]].size/1024))
                 + ' ' + esc(t('كيلو')) + '</div>' : '')
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
  } catch (e){ LS_ERR = e; }
}
function svDraftSoon(){ clearTimeout(SVD.t); SVD.t = setTimeout(svDraftSave, 700); }
function svDraftClear(){ try { SVD.dirty = false; clearTimeout(SVD.t); if (typeof idbSet === 'function') idbSet('svDraft', null).catch(function(e){ LS_ERR = e; }); } catch (e){ LS_ERR = e; } }
function svDraftRestore(){
  SVD.checked = true;
  if (typeof idbGet !== 'function') return;
  if (typeof IDB_BAD !== 'undefined' && IDB_BAD === true){ if ((SVD.bad = (SVD.bad || 0) + 1) <= 6) setTimeout(svDraftRestore, 5000); return; }   /* القاعدةُ متعثّرةٌ الآن: لا فتحٌ إضافيٌّ يسبق إعادتها المجدولة — ستُّ محاولاتٍ ثم يُترَك (مؤقّتٌ دائمٌ يُبقي بيئةَ الفحص حيّةً بلا نهاية) */
  idbGet('svDraft').then(function(d){
    if (!d || !d.form || !d.form.site) return;
    if (Date.now() - (+d.at || 0) > 86400000){ svDraftClear(); return; }
    if (d.by && STATE.meta && STATE.meta.name && d.by !== STATE.meta.name) return;
    if (!siteFind(d.form.site)){ if ((SVD.tries = (SVD.tries || 0) + 1) < 30) setTimeout(svDraftRestore, 1000); return; }   /* السجلُّ لم يكتمل بعد: يُعاد بعد ثانية */
    if (FORM.site && SVD.dirty) return;   /* نموذجٌ مفتوحٌ بعملٍ لم يُحفَظ: لا يُكتَب فوقه */
    Object.keys(d.form).forEach(function(k){ FORM[k] = d.form[k]; });
    SVD.dirty = true; CUR = 'svForm'; render(1);
    toast(t('استُعيد المسحُ الذي انقطع — أكمله ثم احفظ'));
  }).catch(function(e){ LS_ERR = e; });
}

/* ── الحفظ — يكتب في المحرك ويدخل الطابور ── */
function svSave(next){
  var s = formSite();
  if (!s) return;
  /* سبقني غيري على النقطة بعد فتح النموذج (V17.79): يُقال ويُطلَب حفظٌ ثانٍ صريح */
  var ahead = svClashAhead(s.id);
  if (ahead && !FORM.overwrite){
    FORM.overwrite = true;
    toast(t('عدّلها') + ' ' + ahead.by + ' ' + t('بعد أن فتحتَ النموذج — اضغط الحفظَ ثانيةً لتكتب فوق تعديله، أو أعد فتح النقطة لتقرأه'));
    return;
  }
  var reached = FORM.access === 'تم الوصول';
  /* عددُ الصور المأخوذة يُختَم على الزيارة نفسِها (V17.33): فإذا وصلت الزيارةُ
     ولم تصل صورُها عرف المكتبُ أنها في طابور جهاز الفنيّ لا أنها لم تُؤخَذ. */
  var phN = Object.keys(FORM.photos || {}).filter(function(k){ return FORM.photos[k] && FORM.photos[k].data; }).length;
  if (!reached && !String(FORM.note || '').trim()){
    toast(t('اكتب سببَ تعذُّر الوصول في الملاحظات'));
    return;
  }
  if (reached && (!FORM.photos.site || !FORM.photos.mount)){
    toast(t('الصورتان مطلوبتان قبل الحفظ'));
    try { var ct2 = document.getElementById('content'), eb2 = document.getElementById('svErr');
      if (ct2){ if (!eb2){ eb2 = document.createElement('div'); eb2.id = 'svErr'; eb2.setAttribute('role', 'alert'); eb2.style.cssText = 'background:#C0392B;color:#fff;border-radius:12px;padding:12px 14px;margin:0 0 10px;font-weight:700;position:sticky;top:0;z-index:5'; ct2.insertBefore(eb2, ct2.firstChild); }
        eb2.textContent = '\u26A0 ' + t('لم تُحفَظ الزيارة — أكمِل') + ': ' + t('الصورتان مطلوبتان قبل الحفظ'); } } catch (e){ LS_ERR = e; }
    return;
  }
  /* ما لا يُبنى عليه حلٌّ لا يُحفَظ: النوعُ والكهرباءُ والمقاسان والصلاحيةُ
     وتحدٍّ واحدٌ على الأقل («لا توجد تحديات» خيارٌ صريحٌ يُختار). */
  if (reached){
    var need = [];
    if (!FORM.mount) need.push('نوع التركيب');
    if (!FORM.power) need.push('مصدر الكهرباء');
    if (!(FORM.chals || []).length) need.push('تحديات التركيب');
    if (!cfgN(FORM.wid_m)) need.push('العرض المتاح (متر)');
    if (!cfgN(FORM.hgt_m)) need.push('الارتفاع المتاح (متر)');
    if (!FORM.fit) need.push('هل الموقع مناسب للتركيب؟');
    if (need.length){
      toast(t('أكمِل المطلوب') + ': ' + need.map(function(x){ return t(x); }).join(' \u00b7 '));
      /* (V21.0) ويبقى مكتوبًا أعلى النموذج حتى يُستكمَل — الرسالةُ العابرةُ لم تكن تُرى تحت الشمس */
      try { var ct = document.getElementById('content'), eb = document.getElementById('svErr');
        if (ct){ if (!eb){ eb = document.createElement('div'); eb.id = 'svErr'; eb.setAttribute('role', 'alert'); eb.style.cssText = 'background:#C0392B;color:#fff;border-radius:12px;padding:12px 14px;margin:0 0 10px;font-weight:700;position:sticky;top:0;z-index:5'; ct.insertBefore(eb, ct.firstChild); }
          eb.textContent = '\u26A0 ' + t('لم تُحفَظ الزيارة — أكمِل') + ': ' + need.map(function(x){ return t(x); }).join(' \u00b7 '); } } catch (e){ LS_ERR = e; }
      var first = document.querySelector('[data-form="' + (FORM.mount ? (FORM.power ? (FORM.wid_m ? (FORM.hgt_m ? 'fit' : 'hgt_m') : 'wid_m') : 'power') : 'mount') + '"]');
      if (first && first.scrollIntoView){ first.scrollIntoView({ block:'center', behavior:'smooth' }); try { first.focus(); } catch (e){ LS_ERR = e; } }
      return;
    }
  }
  var rec = {
    id:s.id, by:STATE.meta.name || '', at:Date.now(),
    mount:FORM.mount, power:FORM.power, height:cfgN(FORM.height), cable:cfgN(FORM.cable),
    chals:FORM.chals.slice(), note:FORM.note, photos:Object.keys(FORM.photos),
    access:FORM.access
  };
  SV_EXTRA_KEYS.forEach(function(k){ if (FORM[k] !== '' && FORM[k] != null) rec[k] = FORM[k]; });
  /* العنوانُ الذي قرأه الفنيُّ من الجهاز يُكتَب على النقطة نفسِها — فتخرج من
     قائمة «بلا عنوان» بعنوانها الحقيقيِّ لا بعنوانٍ مولَّد */
  var netIn = String(FORM.old_net || '').trim().replace(/\.+$/, '');
  if (netIn && /^\d{1,3}(\.\d{1,3}){2,3}$/.test(netIn) && netIn !== s.net){
    s.net = netIn;
    CORE.set('sites', s.id, { net:netIn, ipRtr:s.ipRtr || '', ipRdr:s.ipRdr || '', ipCam:s.ipCam || '' });
    logEvent('عنوانُ شبكةٍ من الميدان — ' + s.id + ' \u00b7 ' + netIn, s.id);
  }
  /* تنتظر المهندسَ — وإن كانت عودةً بعد ردٍّ فهي جولةٌ ثانيةٌ تحمل سببَ الردّ */
  rec.review = 'pending';
  var prevRec = STATE.recs[s.id];
  if (prevRec && prevRec.review === 'revisit'){
    rec.round = (prevRec.round || 1) + 1;
    rec.prevNote = prevRec.revisitNote || '';
  } else if (prevRec && prevRec.round) rec.round = prevRec.round;
  if (prevRec && prevRec.loc) rec.loc = prevRec.loc;   /* التحريكُ لا يضيع بحفظ النموذج */
  if (prevRec && prevRec.src) rec.src = prevRec.src;   /* وأصلُ الزيارة كذلك (V17.57) */
  rec.phN = phN;
      CORE.set('recs', s.id, rec);
  Object.keys(FORM.photos).forEach(function(k){
    /* لا صورةَ خامٌ في القاعدة ولو تعذّر الطابور: تبقى محليًّا حتى يُضبَط درايف */
    if (typeof photoQueue === 'function') photoQueue(s.id, k, FORM.photos[k].data);
  });
  logEvent((reached ? 'مسح موقع — ' : 'تعذّر الوصول — ' + FORM.access + ' · ') + s.id, s.id);
  if (reached) stepDone('visit', s.id, '', formPts());
  /* تعذُّرُ الوصولِ يحتاج قرارًا من المكتب — تصريحٌ أو مخاطبةُ جهةٍ أو شطب */
  if (!reached) notifPush('تعذّر وصول', FORM.access + ' — ' + (FORM.note || ''),
                          { site:s.id, lv:'مهم' });
  toast(reached
    ? (nm(1) + ' ' + t('مسحٌ حُفظ') + ' · ' + t('في الطابور') + ' ' + nm(CORE.pending()))
    : t('سُجّل تعذُّرُ الوصول'));
  svDraftClear();   /* (V25.9) حُفظ المسح: لا مسودة */
  formReset();
  if (next){
    var un = STATE.sites.filter(function(x){ return !STATE.recs[x.id]; })[0];
    if (un) formGo(un.id);
  }
  render();
}

function insSave(draft){
  var s = formSite();
  if (!s) return;
  if (!draft && !FORM.status){ toast(t('حدّد حالة التركيب أولًا')); return; }
  if (!draft && (!FORM.photos.before || !FORM.photos.after)){
    toast(t('صورتا قبل وبعد مطلوبتان'));
    return;
  }
  /* الرقمُ التسلسليُّ يعرّف الجهازَ بعينه: تكرارُه داخل النقطة الواحدة يعني
     أن جهازًا سُجّل مرتين أو أن رقمًا نُسخ خطأً — وكلاهما يُفسد العُهدة. */
  var sn = {}, dup = '';
  Object.keys(FORM.serials || {}).forEach(function(k){
    var v = String(FORM.serials[k] || '').trim();
    if (!v) return;
    if (sn[v]) dup = v; else sn[v] = 1;
  });
  if (dup){ toast(t('رقم تسلسليٌّ مكرّر داخل النقطة') + ': ' + dup); return; }
  var used = {}, n = 0;
  Object.keys(FORM.parts).forEach(function(k){
    var q = cfgN(FORM.parts[k]);
    if (q > 0){ used[k] = q; n += q; }
  });
  if (!draft && !n){ toast(t('سجّل القطع المستهلكة أولًا')); return; }

  CORE.set('inss', s.id, {
    id:s.id, status: draft ? 'مسودّة' : FORM.status,
    by:STATE.meta.name || '', at:Date.now(),
    parts:used, serials:FORM.serials, prefix:FORM.prefix, pts:formPts(),
    approved:false, photos:Object.keys(FORM.photos)
  });
  Object.keys(FORM.photos).forEach(function(k){
    if (typeof photoQueue === 'function') photoQueue(s.id, 'ins_' + k, FORM.photos[k].data);
  });
  /* استهلاكُ القطع يدخل دفتر الحركة — فلا يُخصَم المخزونُ مرتين */
  if (!draft){
    Object.keys(used).forEach(function(k){
      STATE.moves.push({ at:dayKey(), kind:'استهلاك',
                         item:k, qty:used[k], by:STATE.meta.name || '—', site:s.id, cond:'' });
    });
    CORE.dirty('moves', s.id, used);
  }
  logEvent((draft ? 'مسودّة تركيب' : 'تركيب') + ' — ' + s.id + ' · ' + nm(formPts()) + ' نقطة');
  if (!draft) stepDone('install', s.id, nm(n) + ' ' + t('قطعة'), formPts());
  toast(draft ? t('حُفظت مسودّة') : (t('تركيبٌ حُفظ — بانتظار التدقيق')));
  formReset();
  render();
}

/* ═══ نموذجٌ لنقطةٍ واحدة (V17.22) ═══
   النموذجُ كائنٌ واحدٌ يُعاد استعمالُه لكلِّ نقطة، وصورُه فيه. وتبديلُ النقطة
   كان يكتب FORM.site ولا يمسح ما قبلَه — فمن فتح نقطةً وصوّرها ولم يحفظ، ثم
   فتح غيرَها وحفظ، ذهبت صورُ الأولى إلى الثانية. هكذا صعدت صورُ ممرات منى
   إلى مخيمٍ في عرفات. فصار تبديلُ النقطة يمسح ما لم يُحفَظ، ويُقال ذلك. */
function formGo(id, why){
  id = String(id || '');
  if (FORM.site && FORM.site !== id){
    var n = Object.keys(FORM.photos || {}).length;
    if (typeof svDraftClear === 'function') svDraftClear();   /* (V25.9) تبديلُ النقطة يُسقط مسودةَ الأولى */
    formReset();
    if (n) toast(nm(n) + ' ' + t('صورةً لم تُحفَظ — أُلغيت مع تبديل النقطة'));
  }
  FORM.site = id;
  /* لحظةُ الفتح: ما وصل بعدها من غيري على النقطة نفسِها يُسأل عنه قبل الحفظ (V17.79) */
  FORM.openedAt = Date.now(); FORM.overwrite = false;
  if (why === 'new') formReset();
}
/* (V29.4) «انسخ من آخر زيارتي»: الحقولُ الثابتةُ لنفس النوع (التثبيت والكهرباء والمقاسات والملاءمة والمعدّات والتقدير)
   من آخر زيارةٍ سجّلتُها — والوصولُ والتحدياتُ والملاحظاتُ والصورُ والأعدادُ الخاصةُ بالموقع لا تُنسَخ أبدًا. */
var SV_COPY_KEYS = ['mount', 'power', 'height', 'cable', 'len_m', 'wid_m', 'hgt_m', 'fit', 'power_yn', 'power_src', 'pdist', 'p24', 'metal', 'civil', 'equip', 'hours', 'crew_n', 'n_ant', 'n_rdr', 'n_cam', 'n_sens', 'corr_w', 'router_sp'];
function svLastMine(s){
  var me = STATE.meta.name || '', best = null;
  Object.keys(STATE.recs || {}).forEach(function(id){ if (id === s.id) return; var r = STATE.recs[id], x = siteFind(id);
    if (!r || r.by !== me || !x || x.type !== s.type || !r.mount) return; if (!best || (+r.at || 0) > (+best.at || 0)) best = r; });
  return best;
}
function svCopyBar(s){
  var L = svLastMine(s); if (!L) return '';
  return '<div class="actions" style="margin:0 0 10px;align-items:center">' + btn('\u21BA ' + t('انسخ من آخر زيارتي'), 'btn-secondary btn-sm', ' data-svcopy="' + esc(L.id) + '"')
    + '<span class="hint" style="margin:0">' + esc(t('التثبيت والكهرباء والمقاسات من')) + ' ' + esc(L.id) + ' \u00b7 ' + esc(t('الصور والتحديات من الموقع')) + '</span></div>';
}
function svCopyFrom(id){
  var r = STATE.recs[id]; if (!r){ toast(t('لا زيارة')); return; }
  var n = 0; SV_COPY_KEYS.forEach(function(k){ if (r[k] != null && r[k] !== '' && (FORM[k] == null || FORM[k] === '')){ FORM[k] = r[k]; n++; } });
  if (typeof SVD === 'object' && SVD) SVD.dirty = true; try { svDraftSoon(); } catch (e){ LS_ERR = e; }
  toast(n ? t('نُسخ') + ' ' + nm(n) + ' ' + t('حقلًا من') + ' ' + id + ' \u2014 ' + t('راجعها قبل الحفظ') : t('لا حقولَ فارغةً تُنسَخ'));
}
function formReset(){
  FORM.mount = FORM.power = FORM.height = FORM.cable = FORM.note = FORM.prefix = '';
  FORM.chals = []; FORM.photos = {}; FORM.parts = {}; FORM.serials = {};
  FORM.status = ''; FORM.access = 'تم الوصول';
  SV_EXTRA_KEYS.forEach(function(k){ FORM[k] = ''; });
}

/* ═══ التقاطُ أخطاء الإنتاج ═══
   خطأٌ برمجيٌّ على هاتفٍ في الشمس لا يراه أحد: الشاشةُ تتجمّد أو زرٌّ يصمت،
   ويظنُّ الفنيُّ أنه أخطأ. صار كلُّ خطأٍ غيرِ ملتقَطٍ يُسجَّل في سجل الأحداث
   — الذي يُرفَع — برسالته وسطره ونسخته، فيقرؤه المكتبُ في «السجلات» ويعرف
   أيَّ زرٍّ وأيَّ نسخة. ويُرفَع الخطأُ الواحدُ مرةً لا في كلِّ إعادة رسم،
   وبسقفٍ يمنع إغراقَ السجل إن انفجر شيءٌ في حلقة. */
var ERR_SEEN = {};
function errCapture(msg, src, line){
  try { boxNote('err', String(msg || '').slice(0, 60) + '@' + String(src || '').split('/').pop().slice(0, 20) + ':' + (line || 0)); } catch (e0){ BOX_ERR = e0; }
  try {
    var key = String(msg || '').slice(0, 80) + '@' + (line || 0);
    if (ERR_SEEN[key]) return;
    if (Object.keys(ERR_SEEN).length >= 20) return;
    ERR_SEEN[key] = 1;
    var ver = (document.querySelector('[data-p="vers"]') || {}).textContent || '';
    logEvent('خطأ برمجي — ' + String(msg || '').slice(0, 140)
             + ' \u00b7 ' + String(src || '').split('/').pop().slice(0, 40) + ':' + (line || 0)
             + (ver ? ' \u00b7 ' + String(ver).replace(/\s+/g, ' ').trim().slice(0, 20) : ''));
  } catch (e) {}
}
window.addEventListener('error', function(e){ errCapture(e.message, e.filename, e.lineno); });
window.addEventListener('unhandledrejection', function(e){
  var r = e && e.reason;
  errCapture('promise: ' + (r && (r.message || r)), '', 0);
});
/* من تقبل القاعدةُ أحداثَه: كلُّ دورٍ يكتب — لا الوزارةُ ولا الإدارةُ العليا */
function canWriteEvents(){
  var r = effRole(ROLE);
  return ['engineer','admin','supervisor','buyer','store','acct','tech','cprep','casm','cins','helper','driver'].indexOf(r) > -1;
}
/* ═══ الحدثُ يحمل نقطتَه (V17.20) ═══
   كان السجلُّ نصًّا حرًّا: «تمت الزيارة — NSK-MIN-RDR-0018». يُقرأ بالعين
   ولا يُستعلَم به: لا يُقال «أرني كلَّ ما جرى لهذه النقطة» إلا ببحثٍ نصيٍّ
   في الخمسمئة حدثٍ المحمَّلة. فصار لكلِّ حدثٍ حقلُ نقطته حين يخصُّ نقطة —
   فتُسأل القاعدةُ عنها مباشرةً مهما تقادمت. */
/* ═══ الحدثُ يحمل فاعلَه لا مستقبِلَه (V17.26) ═══
   كان «من» في السجل دائمًا صاحبَ الجهاز: يصل جهازَ المديرِ إشعارٌ بزيارةٍ
   سجّلها خالدٌ فيُكتَب «محمد صفوت — زيارة تمّت»، فلا يُعرَف من عمل ماذا وهو
   أصلُ ما يُراجَع. صار الفاعلُ وسيطًا: من كتب الوثيقةَ هو «من»، وصاحبُ
   الجهاز يُذكَر في «سُجِّل على». والوقتُ وقتُ الفعل لا وقتُ وصوله. */
function logEvent(what, site, who, when){
  var now = +when || Date.now();
  var mine = STATE.meta.name || '';
  var e = { id:uid36(), ts:now,
            at:fmtTime(now, { hour:'2-digit', minute:'2-digit' }),
            day:dayKey(now),
            what:what, by:String(who || mine), dev:DEV_ID };
  if (who && who !== mine) e.rec = mine;
  if (site) e.site = String(site);
  STATE.events.unshift(e);
  if (STATE.events.length > 500) STATE.events.length = 500;
  /* الأثرُ التدقيقيُّ يُرفَع: الوزارةُ تسأل من فعل ومتى، والذاكرةُ لا تجيب.
     — لكن القاعدةَ تقبل الحدثَ ممن يعمل لا ممن يطّلع: الوزارةُ والإدارةُ العليا
     تقرآن فقط، وكان حدثُ دخولهما يُدفَع فيُرفَض ويُعزَل ويُظهر لهما «عُزلت عن
     الرفع» في كلِّ جلسة. يبقى في جهازهما ولا يُرفَع. */
  if (typeof canWriteEvents === 'function' && !canWriteEvents()) return;
  if (!STATE.evlog) STATE.evlog = {};
  STATE.evlog[e.id] = e;
  CORE.dirty('evlog', e.id, e);
}


/* ═══ مُنتقي القطع — قائمةٌ واحدةٌ مبحوثةٌ وأنماطٌ جاهزة ═══
   كان اقتراحُ الحلِّ شبكةَ كلِّ أصناف الكتالوج بحقولِ كمّياتٍ فارغة — يبحث
   المهندسُ بعينه بين ثلاثين صنفًا عن أربعةٍ يريدها. صار قائمةً واحدةً تُبحَث
   بالكتابة، يُضاف منها الصنفُ بكمّيته سطرًا سطرًا. والأسطرُ التي تتكرّر من
   نقطةٍ لأخرى — قارئٌ وهوائيٌّ ولوحٌ شمسيٌّ وبطاريةٌ للمخيم القياسي — تُحفَظ
   نمطًا باسمٍ يُطبَّق بضغطة. والأنماطُ إعدادٌ يُرفَع ويُقرأ كسائر الإعدادات. */
var SOL_LINES = {}, SOL_Q = '', PAT_NAME = '';
function patList(){
  if (!Array.isArray(STATE.patterns)) STATE.patterns = [];
  return STATE.patterns;
}
function patSave(name){
  if (!may('settings')){ toast(t('حفظُ الأنماط للمهندس وحده')); return false; }
  name = String(name || '').trim();
  if (!name){ toast(t('اكتب اسمًا للنمط')); return false; }
  if (!Object.keys(SOL_LINES).length){ toast(t('أضِف الأسطرَ أولًا ثم احفظها نمطًا')); return false; }
  var L = patList().filter(function(x){ return x.n !== name; });
  var items = {}; Object.keys(SOL_LINES).forEach(function(c){ items[c] = cfgN(SOL_LINES[c]); });
  L.push({ n:name, items:items, by:STATE.meta.name || '', at:Date.now() });
  STATE.patterns = L;
  CORE.set('cfg', 'patterns', L.slice());
  logEvent('حفظ نمط قطع — ' + name + ' \u00b7 ' + nm(Object.keys(items).length) + ' صنف');
  toast(t('حُفظ النمطُ') + ' \u00b7 ' + name);
  PAT_NAME = '';
  return true;
}
function patDel(name){
  if (!may('settings')){ toast(t('حذفُ الأنماط للمهندس وحده')); return; }
  STATE.patterns = patList().filter(function(x){ return x.n !== name; });
  CORE.set('cfg', 'patterns', STATE.patterns.slice());
  logEvent('حذف نمط قطع — ' + name);
  render(1);
}
function patApply(name){
  var pt = patList().filter(function(x){ return x.n === name; })[0];
  if (!pt){ toast(t('اختر نمطًا')); return; }
  Object.keys(pt.items || {}).forEach(function(c){ if (cfgN(pt.items[c]) > 0) SOL_LINES[c] = cfgN(pt.items[c]); });
  toast(t('طُبِّق النمطُ') + ' \u00b7 ' + pt.n);
  render(1);
}
/* واجهةُ المنتقي — تُعرَض في «حل التركيب» وفي «اعتماد الزيارات» سواءً */
function itemPickerHtml(){
  var all = itemsList();
  var q = (typeof arNorm === 'function') ? arNorm(SOL_Q) : String(SOL_Q || '').trim();
  var hits = all.filter(function(i){
    if (!q) return true;
    var hay = (typeof arNorm === 'function') ? arNorm(i.name + ' ' + i.code) : (i.name + ' ' + i.code);
    return hay.indexOf(q) > -1;
  });
  var pats = patList();
  var lines = Object.keys(SOL_LINES).filter(function(c){ return cfgN(SOL_LINES[c]) > 0; });
  return (pats.length || may('settings')
      ? '<div class="grid cols-3" style="align-items:end">'
        + '<div class="field"><label>' + esc(t('نمطٌ جاهز')) + '</label>'
        +   '<select id="patSel">' + (pats.length ? '' : '<option value="">' + esc(t('لا أنماطَ محفوظةً بعد')) + '</option>')
        +   pats.map(function(pt){
              return '<option value="' + esc(pt.n) + '">' + esc(pt.n) + ' \u00b7 ' + nm(Object.keys(pt.items || {}).length) + ' ' + esc(t('صنف')) + '</option>';
            }).join('') + '</select></div>'
        + '<div class="field"><label>&nbsp;</label>' + btn('\u2699 ' + t('طبّق النمط'),'btn-secondary btn-sm',' data-patapply="1"' + (pats.length ? '' : ' disabled')) + '</div>'
        + (may('settings')
          ? '<div class="field"><label>' + esc(t('احفظ الأسطرَ الحاليةَ نمطًا')) + '</label>'
            + '<div class="actions" style="margin:0"><input id="patName" value="' + esc(PAT_NAME) + '" placeholder="' + esc(t('مثلًا: مخيم قياسي')) + '" dir="auto" style="flex:1">'
            + btn('\u{1F4BE} ' + t('احفظ نمطًا'),'btn-quiet btn-sm',' data-patsave="1"') + '</div></div>'
          : '')
        + '</div>'
        + (pats.length && may('settings')
          ? '<div class="chips" style="margin:0 0 10px">' + pats.map(function(pt){
              return '<span class="chip">' + esc(pt.n) + ' <button type="button" class="btn btn-quiet btn-sm" data-patdel="' + esc(pt.n) + '" aria-label="' + esc(t('حذف')) + '" style="padding:0 6px">\u2715</button></span>';
            }).join('') + '</div>'
          : '')
      : '')
    + '<div class="grid cols-3" style="align-items:end">'
    + '<div class="field"><label>' + esc(t('ابحث في الكتالوج')) + '</label>'
    +   '<input type="search" id="pkQ" data-pkq value="' + esc(SOL_Q) + '" placeholder="' + esc(t('اكتب جزءًا من اسم القطعة')) + '" dir="auto"></div>'
    + '<div class="field"><label>' + esc(t('القطعة')) + ' <span class="num">' + nm(hits.length) + '/' + nm(all.length) + '</span></label>'
    +   '<select id="pkItem">' + (hits.length ? '' : '<option value="">' + esc(t('لا صنفَ يطابق البحث')) + '</option>')
    +   capList(hits, 200).map(function(i){
          return '<option value="' + esc(i.code) + '">' + esc(i.name) + ' \u00b7 ' + esc(t(i.z === 'cor' ? 'ممر' : 'مخيم')) + '</option>';
        }).join('') + '</select></div>'
    + '<div class="field"><label>' + esc(t('الكمية')) + '</label>'
    +   '<div class="actions" style="margin:0"><input type="number" id="pkQty" min="1" value="1" inputmode="numeric" style="width:88px">'
    +   btn('\u2795 ' + t('أضِف'),'btn-secondary btn-sm',' data-pkadd="1"') + '</div></div>'
    + '</div>'
    + (lines.length
      ? table(['الصنف','الكمية',''], lines.map(function(c){
          /* (V23.1) «اخترت ١٢ أنتنة — ما أمسحش وأضيف، أعدّل على طول»: الكميةُ حقلٌ يُعدَّل في مكانه */
          return [esc(itemName(c)), '<input type="number" min="0" inputmode="numeric" value="' + esc(SOL_LINES[c]) + '" data-pkqty="' + esc(c) + '" style="width:88px" aria-label="' + esc(t('الكمية') + ' \u2014 ' + itemName(c)) + '">',
                  btn('\u2715','btn-quiet btn-sm',' data-pkrm="' + esc(c) + '" aria-label="' + esc(t('حذف')) + '"')];
        }))
      : '<p class="hint" style="margin:6px 0 0">' + esc(t('لا أسطرَ بعد — ابحث عن القطعة وأضفها بكمّيتها، أو طبّق نمطًا جاهزًا.')) + '</p>');
}
function pkAdd(){
  var sel = document.getElementById('pkItem'), q = document.getElementById('pkQty');
  var code = sel && sel.value, qty = cfgN(q && q.value);
  if (!code){ toast(t('اختر قطعةً من القائمة')); return; }
  if (!(qty > 0)){ toast(t('اكتب كمّيةً أكبرَ من صفر')); return; }
  SOL_LINES[code] = cfgN(SOL_LINES[code]) + qty;
  render(1);
}

/* ── التدقيق الهندسي — الاعتماد يحوّل الحالة ── */
/* ── حلُّ التركيب: الأجهزةُ المقترحة قبل طلب التركيب ── */

function solGo(site){
  site = site || (document.getElementById('solSite') || {}).value;
  if (!site){ toast(t('لا نقطةَ مختارة')); return false; }
  var itemsMap = {};
  Object.keys(SOL_LINES).forEach(function(c){ if (cfgN(SOL_LINES[c]) > 0) itemsMap[c] = cfgN(SOL_LINES[c]); });
  if (!Object.keys(itemsMap).length){ toast(t('أضِف قطعةً واحدةً على الأقل')); return false; }
  var before = solutionOf(site);
  solutionSave(site, itemsMap);
  var after = solutionOf(site);
  if (after && after !== before){ SOL_LINES = {}; SOL_Q = ''; return true; }
  return !!(after && after.at !== (before && before.at));
}


function apprIns(id, ok){
  if (!may('approve')){ toast(t('اعتمادُ التركيب للمهندس وحده')); return; }
  var r = STATE.inss[id];
  if (!r) return;
  if (ok){
    r.approved = true; r.apprBy = STATE.meta.name || ''; r.apprAt = Date.now();
    var s = siteFind(id);
    if (s) s.fstat = 'مُركّب';
    logEvent('اعتماد تركيب — ' + id + ' · ' + nm(r.pts || 0) + ' نقطة', id);
    notifPush('اعتماد', 'اعتُمد تركيبُك — ' + nm(r.pts || 0) + ' نقطة',
              { to:r.by || '', site:id, lv:'مهم' });
  } else {
    r.status = 'مُعاد'; r.approved = false; r.why = 'أُعيد للتصحيح';
    logEvent('ردّ تركيب — ' + id, id);
    /* الردُّ يوقف العملَ حتى يُصحَّح — فهو عاجلٌ لا يُترَك للسجل */
    notifPush('ردّ', 'رُدَّ تركيبُك للتصحيح — راجع النقطة', { to:r.by || '', site:id, lv:'عاجل' });
  }
  CORE.set('inss', id, r);
  toast(ok ? t('اعتُمد') : t('رُدّ للمنفِّذ'));
  render();
}

/* ═══ ثلاثةٌ نقصت عن العامل ═══
   المسافةُ من موقعك، وأداةُ فحص الأجهزة، وإشعارُ واتساب. */

/* ── المسافة: الأقربُ أولًا في قائمة المواقع ── */
var MYPOS = null, POS_WATCH = 0;

function posWatch(){
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  try{
    POS_WATCH = navigator.geolocation.watchPosition(function(p){
      MYPOS = { lat:p.coords.latitude, lng:p.coords.longitude, at:Date.now() };
      if (CUR === 'sites') render(1);
    }, function(e){
      /* الرفضُ أو التعذُّرُ صامتًا يجعل الزرَّ يبدو معطوبًا وهو يعمل */
      softErr('تحديد الموقع', e,
        (e && e.code === 1) ? 'مُنع تحديدُ الموقع — اسمح به من إعدادات المتصفّح'
                            : 'تعذّر تحديدُ الموقع — جرّب في مكانٍ مكشوف');
    }, { enableHighAccuracy:false, maximumAge:60000, timeout:15000 });
  }catch(e){}
}

/* هافرساين مبسّط — نصفُ قطر الأرض بالكيلومترات */
function distKm(a, b){
  if (!a || !b) return null;
  var R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  var s = Math.sin(dLat/2) * Math.sin(dLat/2)
        + Math.cos(a.lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180)
        * Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
}

function distTxt(x){
  var k = distKm(MYPOS, x);
  if (k == null) return '';
  return k < 1 ? (nm(Math.round(k * 1000)) + ' م') : (nm(Math.round(k * 10) / 10) + ' كم');
}

/* ── أداة الفحص: تُشغَّل من جهاز المكتب على شبكة الميدان ── */
var PROBE = { on:false, done:0, up:0, down:0, log:[], t:0 };

function probeIp(site){
  var ins = STATE.inss[site.id] || {};
  var p = String(ins.prefix || '').trim();
  return p ? (p + '.1') : '';
}

function probeOne(ip){
  /* لا ping في المتصفح — تُطلَب صورةٌ وهميةٌ ويُقاس أيُّهما أسرع: الردُّ أم المهلة */
  return new Promise(function(res){
    if (typeof Image === 'undefined'){ res(false); return; }
    var done = false, img = new Image();
    var t = setTimeout(function(){ if (!done){ done = true; img.src = ''; res(false); } }, 2500);
    img.onload = img.onerror = function(){
      if (done) return;
      done = true; clearTimeout(t);
      /* حتى الخطأ دليلُ حياة: المنفذُ ردّ. الصمتُ وحده موت. */
      res(true);
    };
    try{ img.src = 'http://' + ip + '/favicon.ico?t=' + Date.now(); }
    catch(e){ clearTimeout(t); res(false); }
  });
}

function probeRun(){
  if (PROBE.on) { PROBE.on = false; render(1); return; }
  var targets = STATE.sites
    .map(function(s){ return { s:s, ip:probeIp(s) }; })
    .filter(function(x){ return x.ip; });
  if (!targets.length){ toast(t('لا عناوين مسجّلة — أدخل بادئة الشبكة عند التركيب')); return; }

  PROBE.on = true; PROBE.done = 0; PROBE.up = 0; PROBE.down = 0; PROBE.log = [];
  PROBE.t = Date.now();
  render(1);

  var i = 0;
  function step(){
    if (!PROBE.on || i >= targets.length){
      PROBE.on = false;
      logEvent('فحص الأجهزة — ' + nm(PROBE.up) + ' حيّ · ' + nm(PROBE.down) + ' صامت');
      render(1);
      return;
    }
    var batch = targets.slice(i, i + 6);
    i += 6;
    Promise.all(batch.map(function(x){
      return probeOne(x.ip).then(function(alive){
        PROBE.done++;
        if (alive) PROBE.up++; else PROBE.down++;
        STATE.hb = STATE.hb || {};
        STATE.hb[x.s.id] = { ip:x.ip, alive:alive, at:Date.now() };
        if (PROBE.log.length < 60)
          PROBE.log.unshift({ id:x.s.id, ip:x.ip, alive:alive });
      });
    })).then(function(){
      if (PROBE.done % 24 === 0) render(1);
      setTimeout(step, 60);
    });
  }
  step();
}


/* ═══ سجلُّ النقطة — كلُّ ما جرى لها من أوّل يوم (V17.20) ═══
   السؤالُ المتكرّر: من زار هذه النقطة؟ ومن رفع صورَها؟ ومن اعتمدها ومتى؟
   والجوابُ كان متفرّقًا: الزيارةُ في وثيقتها، والتركيبُ في وثيقته، والصورُ
   في مجموعتها، والاعتماداتُ ختومٌ داخل الزيارة، والأحداثُ نصٌّ حرّ. فيُجمَع
   هنا من مصادره كلِّها في خطٍّ زمنيٍّ واحد: ماذا جرى · بيد من · متى · وما
   يُثبته (صورةٌ أو ملفٌّ أو ختم). */
function siteLog(id){
  var out = [], push = function(at, what, who, kind, extra){
    if (!at && !who) return;
    out.push({ at:+at || 0, what:what, who:who || '', kind:kind || '', extra:extra || null });
  };
  var r = (STATE.recs || {})[id], ins = (STATE.inss || {})[id], ds = (STATE.diss || {})[id];
  if (r){
    push(r.at, 'الزيارة الميدانية' + (r.access && r.access !== 'تم الوصول' ? ' — ' + t('تعذّر الوصول') : ''), r.by, 'visit');
    if (r.revisitAt) push(r.revisitAt, 'رُدّت لزيارةٍ أخرى' + (r.revisitNote ? ' — ' + r.revisitNote : ''), r.revisitBy, 'back');
    if (r.apprAt || r.review === 'approved') push(r.apprAt || r.at, 'الاعتماد التقني', r.apprBy || r.by, 'ok');
    if (r.minAt) push(r.minAt, minState(r) === 'returned' ? ('أعادتها الوزارة' + (r.minNote ? ' — ' + r.minNote : '')) : 'اعتماد الوزارة', r.minBy, minState(r) === 'returned' ? 'back' : 'ok');
    if (r.briefAt) push(r.briefAt, 'تفاصيل مختصرة' + (r.bst ? ' — ' + t(r.bst) : '') + (r.brief ? ': ' + r.brief : ''), r.briefBy, 'note');
  }
  if (ins) push(ins.at, 'التركيب' + (ins.status ? ' — ' + t(ins.status) : '') + (ins.note ? ': ' + ins.note : ''), ins.by, 'ins');
  if (ds)  push(ds.at, 'الفكّ' + (ds.note ? ' — ' + ds.note : ''), ds.by, 'dis');
  /* صورٌ أُخذت ولم تصل: الزيارةُ تقول كم أخذ الفنيُّ، والسجلُّ يقول كم وصل */
  if (r && r.phN){
    var got = (typeof photosOf === 'function' ? photosOf(id) : []).filter(function(p){ return !(p[1] || {}).del; }).length;
    if (got < r.phN) push(r.at + 1, t('أُخذت') + ' ' + nm(r.phN) + ' ' + t('صور') + ' — ' + t('وصل') + ' ' + nm(got) + ' — ' + t('والباقي في طابور جهاز الفنيّ أو تعذّر رفعُه'), 'back');
  }
  /* الصورُ: من رفعها ومتى — ولكلِّ صورةٍ إثباتُها */
  (typeof photosOf === 'function' ? photosOf(id) : []).forEach(function(p){
    var ph = p[1] || {};
    push(ph.at, 'صورة' + (ph.kind ? ' — ' + t(ph.kind) : '') + (ph.del ? ' (' + t('محذوفة') + ')' : ''), ph.by, 'photo', p[0]);
  });
  /* المهامُّ المسنَدةُ على النقطة */
  Object.keys(STATE.tasks || {}).forEach(function(k){
    var x = STATE.tasks[k];
    if (x && x.site === id) push(x.at, 'إسناد ' + t(kindLabel(x.kind) || '') + (x.to ? ' — ' + x.to : ''), x.by, 'task');
  });
  /* الأحداثُ: ما حمل نقطتَه، وما ذكرها في نصِّه (للقديم قبل الوسم) */
  var EV = (STATE.evlog && Object.keys(STATE.evlog).length) ? Object.keys(STATE.evlog).map(function(k){ return STATE.evlog[k]; })
          : (STATE.events || []);
  EV.forEach(function(e){
    if (!e) return;
    if (e.site === id || (e.what && String(e.what).indexOf(id) > -1)) push(e.ts, e.what, e.by, 'ev');
  });
  (SITE_LOG_MORE[id] || []).forEach(function(e){ push(e.ts, e.what, e.by, 'ev'); });
  out.sort(function(a, b){ return b.at - a.at; });
  /* لا يتكرّر السطرُ نفسُه من مصدرين */
  var seen = {}, uniq = [];
  out.forEach(function(x){
    var k = x.at + '|' + x.what + '|' + x.who;
    if (!seen[k]){ seen[k] = 1; uniq.push(x); }
  });
  return uniq;
}
/* أحداثٌ تُجلَب من القاعدة عند الطلب — بسقفٍ، ولا تُقرأ إلا لمن فتح السجل */
var SITE_LOG_MORE = {}, SITE_LOG_BUSY = '';
function siteLogFetch(id){
  if (!FB.ready || !FB.db || SITE_LOG_MORE[id] || SITE_LOG_BUSY === id) return;
  SITE_LOG_BUSY = id;
  DB.col('events').where('site', '==', id).limit(200).get().then(function(sn){
    var L = []; sn.forEach(function(dd){ L.push(dd.data()); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    SITE_LOG_MORE[id] = L; SITE_LOG_BUSY = ''; render(1);
  }).catch(function(e){ SITE_LOG_MORE[id] = []; SITE_LOG_BUSY = ''; softErr('سجل النقطة', e, ''); });
}
var LOG_KIND = { visit:'\u{1F4CD}', ins:'\u{1F527}', dis:'\u{1F9E9}', photo:'\u{1F4F7}', ok:'\u2705',
                 back:'\u21A9', note:'\u{1F5E8}', task:'\u{1F4CB}', ev:'\u2022' };
function siteLogHtml(id){
  var L = siteLog(id);
  return card(t('سجلُّ النقطة') + ' — ' + nm(L.length),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('كلُّ ما جرى لهذه النقطة من أوّل يوم: من زارها ومن رفع صورَها ومن اعتمدها — بالتاريخ.')) + '</p>'
    + (L.length
        ? '<div class="wt-log">' + L.map(function(x){
            return '<div class="wt-le">'
              + '<span class="hint num" style="margin:0">' + esc(x.at ? fmtDT(x.at) : '—') + '</span> '
              + (LOG_KIND[x.kind] || '\u2022') + ' ' + esc(t(x.what))
              + (x.who ? ' <b>' + esc(dispName(x.who)) + '</b>' : '')
              + (x.kind === 'photo' && x.extra ? ' <a href="#" data-phview="' + esc(x.extra) + '">' + esc(t('الصورة')) + '</a>' : '')
              + '</div>';
          }).join('') + '</div>'
        : '<p class="hint" style="margin:0">' + esc(t('لا سجلَّ بعد لهذه النقطة.')) + '</p>'),
    btn('\u{1F5C3} ' + t('اجلب القديم من القاعدة'),'btn-quiet btn-sm',' data-sitelog="' + esc(id) + '"'));
}

/* ═══ جولةُ البداية (V17.0) ═══
   من يفتح النظامَ أوّلَ مرةٍ يرى ستَّ مجموعاتٍ وستًّا وعشرين شاشةً فلا يعرف
   من أين يبدأ، فيسأل جارَه أو يترك. والمساعدُ القائمُ يجيب من سأل — ومن لا
   يعرف ماذا يسأل لا يسأل. فصارت جولةٌ تفتح نفسَها أوّلَ دخولٍ لكلِّ حسابٍ
   جديد: خطوةٌ لكلِّ شاشةٍ **من شاشاته هو** — لا شاشاتِ غيره — بترتيب يومه،
   فيها ما تفعله الشاشةُ بكلمةٍ واحدة، ويُضاء بندُها في القائمة وهو يقرأ،
   وزرٌّ يأخذه إليها. وتُفتَح بعدها متى شاء من زرِّ القبّعة في الشريط. */
var TOUR = { open:false, i:0, skip:null, prime:null };   /* (V32.3) جولةُ البداية تملك حالتَها (كانت TOUR.open/TOUR.i/TOUR.skip/TOUR.prime) */
/* صفحاتٌ تُفتَح من غيرها لا من القائمة — لا تصلح خطوةً في جولة */
TOUR.skip = { site:1, sel:1, svappr:1, minappr:1 };
/* أوّلُ ما يُفتَح في اليوم — إن كان من شاشات صاحب الحساب */
TOUR.prime = ['map', 'mywork', 'wtask', 'over', 'perf', 'ipc', 'users', 'sys'];
function tourPages(){
  var r = effRole(ROLE), nav = (ROLES[r] || {}).nav;
  var vis = (nav === '*') ? Object.keys(PAGE).filter(function(k){ return seesRaw(k); })
                          : (nav || []).filter(function(k){ return PAGE[k] && seesRaw(k); });
  vis = vis.filter(function(k){ return !TOUR.skip[k]; });
  var head = TOUR.prime.filter(function(p){ return vis.indexOf(p) > -1; });
  var rest = vis.filter(function(p){ return head.indexOf(p) < 0; });
  return head.concat(rest).slice(0, 8);
}
function tourStart(){ TOUR.i = 0; TOUR.open = true; render(1); }
function tourEnd(said){
  /* من أغلقها بالزاوية أو بالخلفية فقد رآها — وكانت تُفتَح له مع كلِّ إقلاعٍ
     لأن الختمَ لا يُكتَب إلا بزرِّ «لا تعرضها ثانيةً»، فتصير الجولةُ إزعاجًا
     يوميًّا لا ترحيبًا بأوّل مرة (V17.1). تُختَم بأيِّ إغلاق، ويفتحها 🎓. */
  TOUR.open = false;
  try { lsSet('nsk14.tour', myUid() || '1'); } catch (e){ LS_ERR = e; }
  render(1);
}
function tourMaybe(){
  try { if (lsGet('nsk14.tour') === (myUid() || '1')) return; } catch (e){ return; }
  if (!tourPages().length) return;
  TOUR.i = 0; TOUR.open = true;
}
/* يُضاء بندُ الشاشة في القائمة مع خطوتها — فيُعرَف مكانُها لا اسمُها فقط */
function tourSpot(){
  try {
    /* (V31.8) قياسُ الإقلاع على جوالٍ مُبطّأ: هذه الدالةُ أكلت ١٫٨ ثانية في أول دخول — كانت تمسح وتُمرّر في كلِّ رسمة، والتمريرُ
       (scrollIntoView) يفرض تخطيطَ الصفحة كلِّها. صارت لا تفعل شيئًا إن لم يتغيّر البندُ المضاء وما زال مُضاءً */
    var P0 = TOUR.open ? tourPages() : [], id0 = P0.length ? P0[Math.min(TOUR.i, P0.length - 1)] : '', lit = document.querySelector('.tour-spot');
    if (tourSpot.k === id0 && (id0 ? !!lit : !lit)) return;
    tourSpot.k = id0;
    var old = document.querySelectorAll('.tour-spot');
    for (var i = 0; i < old.length; i++) old[i].classList.remove('tour-spot');
    if (!TOUR.open) return;
    var P = tourPages(); if (!P.length) return;
    var id = P[Math.min(TOUR.i, P.length - 1)];
    var el = document.querySelector('.nav a[data-p="' + id + '"], [data-p="' + id + '"]');
    if (el){
      el.classList.add('tour-spot');
      var sec = el.closest('.nav-section');
      if (sec && sec.getAttribute('data-open') === 'false'){ sec.setAttribute('data-open', 'true'); OPEN[sec.getAttribute('data-g')] = true; }
      if (el.scrollIntoView) setTimeout(function(){ try { if (el.isConnected) el.scrollIntoView({ block:'nearest' }); } catch (e2){ LS_ERR = e2; } }, 900);   /* (V31.8) التمريرُ بعد ظهور الواجهة لا قبلها — يفرض تخطيطَ الصفحة كلِّها */
    }
  } catch (e){ LS_ERR = e; }
}
function tourHtml(){
  if (!TOUR.open) return '';
  var P = tourPages(); if (!P.length){ TOUR.open = false; return ''; }
  if (TOUR.i >= P.length) TOUR.i = P.length - 1;
  var id = P[TOUR.i], pg = PAGE[id] || {}, last = TOUR.i === P.length - 1;
  return '<div class="wt-back" data-tourclose="0"></div>'
    + '<div class="pop wt-sheet" id="tourSheet" role="dialog" aria-label="' + esc(t('جولة البداية')) + '">'
    + '<div class="pop-head"><div style="min-width:0">'
    +   '<div class="pid hint" style="margin:0">\u{1F393} ' + esc(t('جولة البداية')) + ' \u00b7 <span class="num">' + nm(TOUR.i + 1) + ' ' + esc(t('من')) + ' ' + nm(P.length) + '</span></div>'
    +   '<h3 style="margin-top:3px">' + esc(t(pg.t || id)) + '</h3></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm pop-x" data-tourclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">'
    +   '<div class="hint" style="margin:0 0 6px">' + esc(t('مكانها')) + ': <b>' + esc(t(pg.m || '')) + '</b> \u2190 ' + esc(t(pg.t || '')) + '</div>'
    +   '<p style="margin:0 0 10px;font-size:14px;line-height:1.7">' + esc(t(pg.l || t('شاشةٌ من شاشاتك — افتحها لترى ما فيها.'))) + '</p>'
    +   (TOUR.i === 0
        ? '<div class="alert info" style="margin:0 0 10px"><span>' + esc(t('هذه شاشاتُك أنت — لكلِّ دورٍ شاشاتُه. البندُ المضيءُ في القائمة هو مكانُ هذه الشاشة.')) + '</span></div>'
        : '')
    +   (last
        ? '<div class="alert ok" style="margin:0 0 10px"><span>' + esc(t('وبقيّةُ الشاشات في القائمة — والمساعدُ 🧭 يجيبك إن سألتَه بكلماتك، وزرُّ 🛠 يبلّغ عن أيِّ عطل.')) + '</span></div>'
        : '')
    +   '<div class="actions" style="margin:0">'
    +     btn('\u2190 ' + t('افتح هذه الشاشة'),'btn-primary btn-sm',' data-tourgo="' + esc(id) + '"')
    +     btn('\u2039 ' + t('السابق'),'btn-quiet btn-sm',' data-tourprev="1"' + (TOUR.i ? '' : ' disabled'))
    +     btn(last ? '\u2714 ' + t('تمّت الجولة') : t('التالي') + ' \u203A', last ? 'btn-secondary btn-sm' : 'btn-secondary btn-sm', ' data-tournext="1"')
    +   '</div>'
    +   '<p class="hint" style="margin:10px 0 0"><button type="button" class="btn btn-quiet btn-sm" data-tourstop="1">' + esc(t('لا تعرضها ثانيةً')) + '</button></p>'
    + '</div></div>';
}

/* ═══ أرقامُ الفريق دفعةً واحدة (V16.99) ═══
   الرقمُ حقلٌ في الحساب، وإدخالُه واحدًا واحدًا لخمسةَ عشرَ حسابًا يُؤجَّل
   فلا يُعمَل — و«بلاغُ اليوم» بلا أرقامٍ نصفُ شاشة. فصار يُلصَق الجدولُ كما
   هو من الهاتف أو من إكسل: سطرٌ لكلِّ شخصٍ فيه الاسمُ (أو اسمُ الدخول) ثم
   الرقم، بأيِّ فاصل — فيُطابَق بالاسم ويُحفَظ، ويُقال بالحرف من طُوبِق ومن
   لم يُعرَف اسمُه. */
function phoneClean(v){
  var d = String(v || '').replace(/[^\d+]/g, '');
  if (d.indexOf('+966') === 0) d = '0' + d.slice(4);
  else if (d.indexOf('966') === 0 && d.length >= 12) d = '0' + d.slice(3);
  return d;
}
function phonesBulk(){
  if (!may('users')){ toast(t('أرقامُ الفريق لمن يدير الحسابات')); return; }
  var el = document.getElementById('phBulk'); if (!el) return;
  var lines = String(el.value || '').split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
  if (!lines.length){ toast(t('ألصق الأرقامَ أوّلًا')); return; }
  var U = STATE.users || {}, done = 0, miss = [];
  lines.forEach(function(ln){
    var m = ln.match(/^(.*?)[\s,،\t|;:]+([+\d][\d\s-]{6,})$/);
    if (!m){ miss.push(ln.slice(0, 30)); return; }
    var who = m[1].trim(), ph = phoneClean(m[2]);
    if (!ph){ miss.push(ln.slice(0, 30)); return; }
    var uid = Object.keys(U).filter(function(k){
      var u = U[k] || {}; return u.name === who || u.user === who || dispName(u.name || '') === who;
    })[0];
    if (!uid){ miss.push(who.slice(0, 30)); return; }
    U[uid] = Object.assign({}, U[uid], { ph:ph });
    CORE.set('users', uid, U[uid]); done++;
  });
  logEvent('أرقامُ الفريق — حُفظ ' + done + ' رقمًا');
  toast(done ? (t('حُفظ') + ' ' + nm(done) + ' ' + t('رقمًا') + (miss.length ? ' \u00b7 ' + t('لم يُعرَف') + ' ' + nm(miss.length) : ''))
             : t('لم يُطابَق أيُّ اسم — تأكّد أن الأسماء كما في الحسابات'));
  if (miss.length) PH_MISS = miss; else PH_MISS = [];
  el.value = ''; render(1);
}
var PH_MISS = [];
function phonesCard(){
  var U = STATE.users || {}, all = [], no = [];
  Object.keys(U).forEach(function(k){
    var u = U[k]; if (!u || u.active === false || !u.name) return;
    all.push(u); if (!u.ph) no.push(u.name);
  });
  if (!all.length) return '';
  return card(t('أرقام الفريق') + ' — ' + nm(all.length - no.length) + ' / ' + nm(all.length),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('ألصق سطرًا لكلِّ شخص: الاسمُ ثم الرقم — بأيِّ فاصل. يُطابَق بالاسم كما هو في الحسابات.')) + '</p>'
    + (no.length
        ? '<div class="alert warn" style="margin:0 0 8px"><span><b>' + nm(no.length) + '</b> ' + esc(t('بلا جوال')) + ': '
          + esc(no.slice(0, 8).join(' · ')) + (no.length > 8 ? ' …' : '') + '</span></div>'
        : '<div class="alert ok" style="margin:0 0 8px"><span>' + esc(t('كلُّ الفريق له رقم — «بلاغ اليوم» جاهز')) + '</span></div>')
    + '<textarea id="phBulk" rows="4" dir="auto" placeholder="' + esc('أحمد سعيد 0551234567\nخالد بندر, 0559876543') + '"></textarea>'
    + (PH_MISS.length
        ? '<p class="hint" style="margin:6px 0 0;color:#E05252">' + esc(t('لم يُعرَف')) + ': ' + esc(PH_MISS.slice(0, 6).join(' · ')) + '</p>'
        : ''),
    btn('\u{1F4F1} ' + t('احفظ الأرقام'),'btn-primary btn-sm',' data-phbulk="1"'));
}

/* ═══ بلاغُ عطلٍ أو طلبٍ جديد (V16.98) ═══
   العطلُ كان يُبلَّغ بمكالمةٍ أو رسالةٍ: «الشاشةُ الفلانيةُ لا تفتح» — بلا
   نسخةٍ ولا دورٍ ولا جهازٍ ولا الشاشةِ التي كان فيها، فيُسأل عنها كلِّها ثم
   يُبحَث. صار البلاغُ من داخل النظام: يكتب المبلِّغُ ما رآه، ويُرفَق تلقائيًّا
   ما لا يعرف أن يقوله — النسخةُ والدورُ والشاشةُ واللغةُ والجهازُ وحالُ
   الشبكة وآخرُ خطأٍ وقع في جلسته. ويُرفَع إلى القاعدة، ومنها يفتحه الخادمُ
   بلاغًا في مستودع المشروع بنفسه — فيصل إلى من يُصلح بلا أن يبعثه أحد. */
var BUG_OPEN = false, BUG_KIND = 'عطل';
var BUG_KINDS = ['عطل', 'طلب جديد', 'اقتراح'];
function bugCtx(){
  var nav = (typeof navigator === 'object' ? navigator : {});
  return {
    /* النسخةُ من الشارة نفسِها — مصدرٌ واحدٌ لا ثابتٌ يُنسى تحديثُه */
    v: (function(){ var el = document.querySelector('.ver-tag'); return el ? String(el.textContent || '').replace(/[^V\d.]/g, '') : ''; })(),
    page: CUR, tab: (TABS[CUR] ? PTAB[CUR] : '') || '',
    role: effRole(ROLE), lang: LANG, online: !!nav.onLine,
    ua: String(nav.userAgent || '').slice(0, 180),
    scr: (typeof screen === 'object' ? (screen.width + 'x' + screen.height) : ''),
    err: LS_ERR ? String(LS_ERR.message || LS_ERR).slice(0, PG_Q ? 5000 : 200) : ''
  };
}
function bugSend(){
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var txt = g('bgTxt');
  if (txt.length < 10){ toast(t('اكتب ما حدث في سطرٍ على الأقل')); return; }
  var id = uid36();
  var r = { id:id, kind:BUG_KIND, txt:txt, want:g('bgWant'),
            by:STATE.meta.name || '', uid:myUid(), at:Date.now(),
            status:'جديد', ctx:bugCtx(), gh:0,
            box:(function(){ try { return boxText(); } catch (e){ return ''; } })() };   /* الصندوقُ الأسود في الكتابة نفسِها (V17.98) */
  if (!STATE.bugs) STATE.bugs = {};
  STATE.bugs[id] = r;
  CORE.set('bugs', id, r);
  logEvent('بلاغ — ' + BUG_KIND + ': ' + txt.slice(0, 60));
  try { notifPush('بلاغٌ جديد', BUG_KIND + ' — ' + txt.slice(0, 60), { lv:'مهم' }); } catch (e){ LS_ERR = e; }
  BUG_OPEN = false;
  toast(t('وصل البلاغ — يُفتَح في المستودع خلال دقائق'));
  render(1);
}
/* ═══ شاشةُ البلاغات (V16.99) ═══
   البلاغُ يُدار حيث يُصلَح — في المستودع؛ لكنّ من أرسله يسأل: وصل؟ وفُتح؟
   وأُغلق؟ فصارت له شاشةٌ تقرأ المجموعةَ نفسَها: بلاغُه بحالته ورقمِه في
   المستودع ورابطِه. من يُصلح يرى الكلَّ، وغيرُه يرى بلاغاتِه وحدَها. */
function bugList(){
  var B = STATE.bugs || {}, me = STATE.meta.name || '', boss = rankOf(effRole(ROLE)) >= rankOf('engineer');
  return Object.keys(B).map(function(k){ return B[k]; }).filter(function(b){
    return b && (boss || b.by === me);
  }).sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
var BUG_ST_C = { 'جديد':'warn', 'مقبول':'acc', 'مرفوض':'bad', 'مفتوح':'acc', 'قيد التنفيذ':'acc', 'مغلق':'ok' };
/* ═══ لا يُعمَل إلا بما قُبل (V17.43) ═══
   كان البلاغُ يُفتَح في المستودع فورَ إرساله، فيختلط ما يستحقُّ العملَ بما
   لا يستحقُّه، ويبدأ الإصلاحُ قبل أن يقرّر صاحبُ القرار. صار له بابان: يصل
   «جديدًا» فيُعرَض على المدير في شاشةٍ واحدةٍ بكلِّ تاريخه، فإن **قَبِله**
   صار «مقبولًا» وهو وحدَه ما يُعمَل عليه، وإن **ردّه** صار «مرفوضًا» بسببه
   المكتوب — ويُقفَل في المستودع فلا يُشتغَل به. والقرارُ يُختَم باسم صاحبه
   ووقته، ويُرى في سجلِّ البلاغ ولا يُمحى. */
var BUG_DEC = '', BUG_F = '';
function bugMayDecide(){ return rankOf(effRole(ROLE)) >= rankOf('admin') || may('settings'); }
function bugClose(id){
  if (!bugMayDecide()){ toast(t('قرارُ البلاغات للمدير')); return false; }
  var b = (STATE.bugs || {})[id]; if (!b) return false;
  b.status = 'مغلق'; b.closedAt = Date.now(); b.closedBy = STATE.meta.name || ''; b.closeAsk = true;
  b.log = [{ at:b.closedAt, by:b.closedBy, what:'أُنجز وأُغلق' }].concat(Array.isArray(b.log) ? b.log : []).slice(0, 20);
  CORE.set('bugs', id, b);
  logEvent('إغلاقُ بلاغ — ' + String(b.txt || '').slice(0, 50), '', b.closedBy, b.closedAt);
  toast(t('أُغلق البلاغُ — ويُغلَق في المستودع مع دورة الجسر'));
  render(1); return true;
}
function bugDecide(id, ok, why){
  if (!bugMayDecide()){ toast(t('قرارُ البلاغات للمدير')); return false; }
  var b = (STATE.bugs || {})[id];
  if (!b){ toast(t('لا بلاغَ بهذا المعرّف')); return false; }
  why = String(why || '').trim();
  if (!ok && why.length < 3){ toast(t('اكتب سببَ الرفض')); return false; }
  b.status = ok ? 'مقبول' : 'مرفوض';
  b.decBy = STATE.meta.name || ''; b.decAt = Date.now(); b.decWhy = why;
  b.log = [{ at:b.decAt, by:b.decBy, what:(ok ? 'قُبل' : 'رُدّ') + (why ? ' — ' + why : '') }]
    .concat(Array.isArray(b.log) ? b.log : []).slice(0, 20);
  CORE.set('bugs', id, b);
  logEvent('قرارُ بلاغ — ' + (ok ? 'قُبل' : 'رُدّ') + ' · ' + String(b.txt || '').slice(0, 50), '', b.decBy, b.decAt);
  toast(t(ok ? 'قُبل البلاغُ — يدخل قائمةَ العمل' : 'رُدَّ البلاغُ — لا يُعمَل به'));
  BUG_DEC = ''; render(1);
  return true;
}
function bugsPageHtml(){
  var ALL = bugList();
  var cnt = function(st){ return ALL.filter(function(b){ return (b.status || 'جديد') === st; }).length; };
  var nNew = cnt('جديد'), nOk = cnt('مقبول') + cnt('مفتوح') + cnt('قيد التنفيذ'), nNo = cnt('مرفوض'), nDone = cnt('مغلق');
  var L = ALL.filter(function(b){
    var st = b.status || 'جديد';
    if (BUG_F === 'new') return st === 'جديد';
    if (BUG_F === 'ok')  return st === 'مقبول' || st === 'مفتوح' || st === 'قيد التنفيذ';
    if (BUG_F === 'no')  return st === 'مرفوض';
    if (BUG_F === 'done') return st === 'مغلق';
    if (BUG_F === 'عطل' || BUG_F === 'طلب جديد' || BUG_F === 'اقتراح') return (b.kind || '') === BUG_F;
    return true;
  });
  var chip = function(k, txt, n, cls){
    return '<button type="button" class="chip' + (BUG_F === k ? ' on' : '') + (cls ? ' ' + cls : '') + '" data-bugf="' + esc(k) + '">'
      + esc(t(txt)) + ' <span class="num">' + nm(n) + '</span></button>';
  };
  var open = ALL.filter(function(b){ return b.status !== 'مغلق'; }).length;
  return '<p class="lede" style="margin:0 0 16px">' + esc(t('كلُّ ما أُبلغ عنه واقتُرح وطُلب — بتاريخه. ما تقبله يدخل قائمةَ العمل، وما تردُّه يُقفَل بسببه ولا يُعمَل به.')) + '</p>'
    + stats([['الكل', N(ALL.length)], ['بانتظار قرارك', N(nNew), nNew ? 'wrn' : 'ok'],
             ['مقبولٌ — يُعمَل به', N(nOk), 'acc'], ['مردود', N(nNo)], ['مغلق', N(nDone), 'ok']])
    + '<div class="chips">' + chip('', 'الكل', ALL.length) + chip('new', 'بانتظار قرارك', nNew)
    +   chip('ok', 'مقبول', nOk) + chip('no', 'مردود', nNo) + chip('done', 'مغلق', nDone)
    +   chip('عطل', 'عطل', ALL.filter(function(b){ return b.kind === 'عطل'; }).length)
    +   chip('طلب جديد', 'طلب جديد', ALL.filter(function(b){ return b.kind === 'طلب جديد'; }).length)
    +   chip('اقتراح', 'اقتراح', ALL.filter(function(b){ return b.kind === 'اقتراح'; }).length)
    + '</div>'
    + (L.length
        ? L.map(function(b){
            var c = b.ctx || {};
            return card('', '<div class="wt-row" style="justify-content:space-between">'
              + '<div style="min-width:0"><strong>' + esc(b.txt || '') + '</strong>'
              +   '<div class="hint" style="margin:2px 0 0">' + esc(t(b.kind || '')) + ' \u00b7 ' + esc(dispName(b.by || ''))
              +     ' \u00b7 ' + esc(stepAgo(b.at || 0)) + (c.v ? ' \u00b7 ' + esc(c.v) : '')
              +     (c.page ? ' \u00b7 ' + esc(t(pageTitle(c.page) || c.page)) : '') + '</div></div>'
              + '<div class="wt-row" style="margin:0">' + pill(b.status || 'جديد', BUG_ST_C[b.status] || '')
              +   (b.gh ? '<a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="https://github.com/mhmdsfwt371/Project-survey/issues/' + esc(b.gh) + '">#' + nm(b.gh) + '</a>' : '')
              + '</div></div>'
              + (b.want ? '<div class="hint" style="margin:6px 0 0">' + esc(t('المتوقَّع')) + ': ' + esc(b.want) + '</div>' : '')
              /* الصندوقُ الأسود خطًّا زمنيًّا — للمهندس فمن فوقه (V17.98) */
              + (b.box && rankOf(effRole(ROLE)) >= rankOf('engineer')
                  ? '<details style="margin:6px 0 0"><summary class="hint" style="margin:0;cursor:pointer">' + esc(t('الخطُّ الزمنيُّ للجهاز')) + ' \u00b7 ' + nm(String(b.box).split('\n').length) + ' ' + esc(t('سطر')) + '</summary>'
                    + '<pre dir="ltr" style="font-size:12px;line-height:1.6;white-space:pre-wrap;margin:6px 0 0">' + esc(String(b.box).slice(0, BOX_BYTES)) + '</pre></details>'
                  : '')
              /* تاريخُ البلاغ: قرارُه ومن قرّره ومتى، وما جرى بعده */
              + (b.decBy
                  ? '<div class="hint" style="margin:6px 0 0">'
                    + esc(t(b.status === 'مرفوض' ? 'رُدَّ بـ' : 'قَبِله')) + ' ' + esc(dispName(b.decBy))
                    + ' \u00b7 ' + esc(stepAgo(b.decAt || 0))
                    + (b.decWhy ? ' \u00b7 ' + esc(b.decWhy) : '') + '</div>'
                  : '')
              + ((Array.isArray(b.log) && b.log.length)
                  ? '<div class="wt-log" style="margin:6px 0 0">' + b.log.map(function(e){
                      return '<div class="wt-le"><span class="hint num" style="margin:0">' + esc(fmtDT(e.at)) + '</span> '
                        + esc(t(e.what || '')) + (e.by ? ' <b>' + esc(dispName(e.by)) + '</b>' : '') + '</div>';
                    }).join('') + '</div>'
                  : '')
              /* القرار: يُتَّخذ هنا — وما يُقبَل وحدَه يدخل قائمةَ العمل */
              /* ما قُبل ونُفِّذ يُغلقه المديرُ من هنا، والجسرُ يغلقه في المستودع (V17.56) */
              + (bugMayDecide() && (b.status === 'مقبول' || b.status === 'قيد التنفيذ' || b.status === 'مفتوح')
                  ? '<div class="actions" style="margin:8px 0 0">'
                    + btn('\u2714 ' + t('أُنجز — أغلق البلاغ'),'btn-secondary btn-sm',' data-bugdone="' + esc(b.id) + '"')
                    + '</div>'
                  : '')
              + (bugMayDecide() && (b.status || 'جديد') === 'جديد'
                  ? (BUG_DEC === b.id
                      ? '<div class="field" style="margin:8px 0 0"><label>' + esc(t('سببُ الردّ')) + '</label>'
                        + '<input id="bgWhy" dir="auto" placeholder="' + esc(t('يُكتَب لصاحب البلاغ — فيعرف لماذا')) + '"></div>'
                        + '<div class="actions" style="margin:6px 0 0">'
                        + btn('\u2716 ' + t('أكّد الردّ'),'btn-danger btn-sm',' data-bugno="' + esc(b.id) + '"')
                        + btn(t('إلغاء'),'btn-quiet btn-sm',' data-bugdec=""')
                        + '</div>'
                      : '<div class="actions" style="margin:8px 0 0">'
                        + btn('\u2714 ' + t('اقبل — يدخل قائمة العمل'),'btn-primary btn-sm',' data-bugok="' + esc(b.id) + '"')
                        + btn('\u2716 ' + t('ردّ'),'btn-quiet btn-sm',' data-bugdec="' + esc(b.id) + '"')
                        + '</div>')
                  : ''));
          }).join('')
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا بلاغاتٍ بعد — الزرُّ 🛠 في الشريط العلويّ.')) + '</p>'));
}
/* اللوحُ يُفتَح من أيِّ شاشة — فيُبلَّغ العطلُ حيث وقع لا بعد أن يُنسى */
function bugSheet(){
  if (!BUG_OPEN) return '';
  var c = bugCtx();
  return '<div class="wt-back" data-bugclose="0"></div>'
    + '<div class="pop wt-sheet" id="bugSheet" role="dialog" aria-label="' + esc(t('بلاغ')) + '">'
    + '<div class="pop-head"><div><h3 style="margin:0">\u{1F6E0} ' + esc(t('بلّغ عن عطلٍ أو اطلب جديدًا')) + '</h3></div>'
    + '<button type="button" class="btn btn-quiet btn-sm pop-x" data-bugclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">'
    + '<div class="chips" style="margin:0 0 8px">' + BUG_KINDS.map(function(k){
        return '<button type="button" class="chip' + (BUG_KIND === k ? ' on' : '') + '" data-bugkind="' + esc(k) + '">' + esc(t(k)) + '</button>';
      }).join('') + '</div>'
    + '<div class="field"><label>' + esc(t('ما الذي حدث؟')) + '</label>'
    +   '<textarea id="bgTxt" dir="auto" rows="4" placeholder="' + esc(t('اكتب ما رأيتَه بالضبط: ضغطتُ كذا فحدث كذا.')) + '"></textarea></div>'
    + '<div class="field"><label>' + esc(t('ما الذي كنتَ تتوقّعه؟')) + ' <span class="hint">(' + esc(t('اختياري')) + ')</span></label>'
    +   '<input id="bgWant" dir="auto"></div>'
    + '<div class="alert info" style="margin:8px 0 0"><span>' + esc(t('يُرفَق تلقائيًّا')) + ': '
    +   '<span class="num">' + esc(c.v) + '</span> \u00b7 ' + esc(t(pageTitle(c.page) || c.page)) + ' \u00b7 '
    +   esc(t((ROLES[c.role] || {}).n || c.role)) + ' \u00b7 ' + esc(c.online ? t('متصل') : t('غير متصل'))
    +   (c.err ? ' \u00b7 ' + esc(t('آخرُ خطأٍ في جلستك')) : '') + '</span></div>'
    + '<div class="actions" style="margin:10px 0 0">'
    +   btn('\u{1F4E4} ' + t('أرسل البلاغ'),'btn-primary btn-sm',' data-bugsend="1"')
    +   btn(t('إلغاء'),'btn-quiet btn-sm',' data-bugclose="0"') + '</div>'
    /* بلاغاتي: «وصل؟ فُتح؟ أُغلق؟» — يقرؤها المبلِّغُ هنا بلا شاشةٍ أخرى */
    + (function(){
        var mine = bugList().slice(0, 6);
        if (!mine.length) return '';
        return '<div class="hint" style="margin:12px 0 4px;font-weight:700">' + esc(t('بلاغاتي')) + '</div>'
          + '<div class="wt-log">' + mine.map(function(b){
              return '<div class="wt-le"><span class="hint num" style="margin:0">' + esc(stepAgo(b.at || 0)) + '</span> '
                + esc(String(b.txt || '').slice(0, 60)) + ' ' + pill(b.status || 'جديد', BUG_ST_C[b.status] || '')
                + (b.gh ? ' <a target="_blank" rel="noopener" href="https://github.com/mhmdsfwt371/Project-survey/issues/' + esc(b.gh) + '">#' + nm(b.gh) + '</a>' : '')
                + '</div>';
            }).join('') + '</div>';
      })()
    + '</div></div>';
}
function pageTitle(id){ var p = (typeof PAGE === 'object' && PAGE[id]) || null; return p ? p.t : ''; }

/* ═══ بلاغُ اليوم عبر واتساب (V16.97) ═══
   المتابعةُ اليوميةُ كانت مكالماتٍ: من معه ماذا اليومَ؟ ومن أنجز؟ ومن لم
   يبدأ؟ والأرقامُ في الهاتف لا في النظام. فصار للفريق كلِّه جدولٌ واحد:
   لكلِّ شخصٍ جوالُه (أو تنبيهٌ أنه بلا جوال)، وما عليه اليومَ من إسناد،
   وما أنجزه اليومَ، وما عليه من مهامِّ الاجتماع — وزرُّ واتساب يفتح رسالةً
   جاهزةً بكلِّ ذلك ورابطِ التطبيق، ضغطةٌ لكلِّ شخص؛ و«نسخُ الكل» يجمع
   الرسائلَ لمجموعة الفريق. لا خادمَ ولا اشتراك: رابطُ واتساب العاديّ. */
function dayStart(){ var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
function briefingRows(){
  var U = STATE.users || {}, t0 = dayStart(), out = [];
  Object.keys(U).forEach(function(k){
    var u = U[k]; if (!u || u.active === false || !u.name) return;
    var r = effRole(u.role);
    if (['tech','supervisor','engineer','helper','cins','driver'].indexOf(r) < 0) return;
    var asn = { survey:[], install:[], dis:[] }, open = 0;
    Object.keys(STATE.tasks || {}).forEach(function(tk){
      var x = STATE.tasks[tk]; if (!x || x.to !== u.name || x.status === 'معتمد') return;
      if (asn[x.kind]) asn[x.kind].push(x.site); open++;
    });
    var done = 0;
    Object.keys(STATE.recs || {}).forEach(function(id){ var rc = STATE.recs[id]; if (rc && rc.by === u.name && (rc.at || 0) >= t0) done++; });
    Object.keys(STATE.inss || {}).forEach(function(id){ var ic = STATE.inss[id]; if (ic && ic.by === u.name && (ic.at || 0) >= t0) done++; });
    var wt = (typeof wtRows === 'function' ? wtRows() : []).filter(function(w){ return w.st !== 'مكتمل' && String(w.who || '').trim() === u.name; }).length;
    out.push({ uid:k, name:u.name, role:r, ph:u.ph || '', asn:asn, open:open, done:done, wt:wt });
  });
  out.sort(function(a, b){ return (b.open - a.open) || (rankOf(b.role) - rankOf(a.role)) || a.name.localeCompare(b.name, 'ar'); });
  return out;
}
function briefingText(x){
  var L = [];
  L.push(t('السلام عليكم') + ' ' + x.name + ' \u2014 ' + t('بلاغ اليوم') + ' ' + dayKey(Date.now()));
  ['survey','install','dis'].forEach(function(k){
    if (!x.asn[k].length) return;
    L.push('');
    L.push('\u25B6 ' + t(kindLabel(k)) + ' \u2014 ' + nm(x.asn[k].length) + ' ' + t('نقطة') + ':');
    x.asn[k].slice(0, 15).forEach(function(id){ var st = siteFind(id) || {}; L.push('\u2022 ' + fsi(id) + (st.name ? ' \u2014 ' + fsiText(String(st.name).slice(0, 30)) : '')); });
    if (x.asn[k].length > 15) L.push('\u2026 ' + t('والباقي في التطبيق'));
  });
  if (!x.open) L.push(t('لا إسنادَ عليك اليوم — راجع «مهامي» فقد يصلك خلال النهار.'));
  if (x.wt) L.push('', '\u{1F4CB} ' + t('عليك') + ' ' + nm(x.wt) + ' ' + t('من مهام الاجتماع') + ' \u2014 ' + t('حدّث حالتَها من «مهامي»'));
  L.push('', t('افتح «مهامي» في التطبيق واضغط «من موقعي» لترتيب الطريق') + ':', 'https://mhmdsfwt371.github.io/Project-survey/');
  L.push('\u2014 ' + (STATE.meta.name || ''));
  return L.join('\n');
}
function briefingSend(uid){
  var x = briefingRows().filter(function(r){ return r.uid === uid; })[0];
  if (!x) return;
  if (!x.ph){ toast(t('لا جوالَ محفوظٌ لهذا الشخص — أضفه في الحسابات أوّلًا')); return; }
  try { window.open(waLink(x.ph, briefingText(x)), '_blank', 'noopener'); toast(t('فُتح واتساب') + ' \u2014 ' + t('اضغط إرسال')); }
  catch (e){ toast(t('تعذّر فتحُ واتساب')); }
  logEvent('بلاغُ اليوم — ' + x.name);
}
function briefingCopyAll(){
  var txt = briefingRows().map(briefingText).join('\n\n\u2014\u2014\u2014\n\n');
  var done = function(){ toast(t('نُسخت رسائلُ الفريق — ألصقها في مجموعة واتساب')); };
  try { navigator.clipboard.writeText(txt).then(done, function(){ toast(t('تعذّر النسخ')); }); }
  catch (e){ toast(t('تعذّر النسخ')); }
}
function briefingHtml(){
  var R = briefingRows(), noPh = R.filter(function(x){ return !x.ph; }).length;
  var t0 = dayStart();
  var idle = R.filter(function(x){ return x.open && !x.done; }).length;
  return card(t('بلاغ اليوم عبر واتساب') + ' — ' + nm(R.length),
      '<p class="hint" style="margin:0 0 8px">' + esc(t('لكلِّ شخصٍ رسالةٌ جاهزةٌ بما عليه اليومَ ورابطِ التطبيق — ضغطةٌ تفتح واتساب على رقمه، وأنت تضغط إرسال.')) + '</p>'
      + stats([['أعضاء', N(R.length)], ['بلا جوال', N(noPh), noPh ? 'bad' : 'ok'],
               ['أُسند إليهم ولم يبدؤوا', N(idle), idle ? 'wrn' : 'ok'],
               ['أنجزوا اليوم', N(R.reduce(function(a, x){ return a + x.done; }, 0)), 'ok']])
      + (R.length
          ? table(['الاسم','الدور','الجوال','عليه اليوم','أنجز اليوم','مهام الاجتماع',''], R.map(function(x){
              return [esc(x.name), esc(t((ROLES[x.role] || {}).n || x.role)),
                x.ph ? '<span class="num" dir="ltr">' + esc(x.ph) + '</span>' : pill('بلا جوال', 'bad'),
                x.open ? '<span class="num">' + nm(x.open) + '</span>' : '<span class="hint">—</span>',
                x.done ? pill(nm(x.done), 'ok') : (x.open ? pill('لم يبدأ', 'warn') : '<span class="hint">—</span>'),
                x.wt ? '<span class="num">' + nm(x.wt) + '</span>' : '<span class="hint">—</span>',
                btn('\u{1F4AC} ' + t('واتساب'), x.ph ? 'btn-primary btn-sm' : 'btn-quiet btn-sm', ' data-brief="' + esc(x.uid) + '"' + (x.ph ? '' : ' disabled'))];
            }))
          : '<p class="hint" style="margin:0">' + esc(t('لا أعضاءَ ميدانيّين في الحسابات بعد.')) + '</p>'),
      btn('\u{1F4CB} ' + t('انسخ رسائل الكل'),'btn-secondary btn-sm',' data-briefall="1"'));
}

/* ── إشعار واتساب ── */
function waLink(phone, text){
  var p = String(phone || '').replace(/[^\d]/g, '');
  if (p.indexOf('0') === 0) p = '966' + p.slice(1);
  if (p && p.indexOf('966') !== 0 && p.length === 9) p = '966' + p;
  return 'https://wa.me/' + p + '?text=' + encodeURIComponent(text || '');
}


/* ═══ دفترُ جوالات الشركات ═══
   كان جوالُ المنسّق حقلًا فارغًا يُكتَب في كلِّ مرة: من أراد إشعارَ شركةٍ
   بحث عن رقمها في هاتفه، فيُخطئ حرفًا أو يُرسل لغير صاحبها. صار الرقمُ
   صفةً للشركة تُحفَظ مرةً وتُرفَع (settings/cotel) وتُسحَب على كلِّ جهاز —
   والقاعدةُ تحمي الوثيقةَ (أرقامُ الناس لا تُقرأ لكلِّ دور).
     ومنها زرُّ واتساب: يُضغَط فيفتح محادثةَ الشركة بنصٍّ جاهزٍ يذكر ما جرى
   — إشعارُ تركيبٍ قادم، أو محضرُ تسليمٍ حُرِّر، أو فكٌّ مجدول. */
/* ═══ إعادةُ تسمية شركة ═══
   اسمُ الشركة نصٌّ على كلِّ نقطةٍ من نقاطها — فخطأُ حرفٍ في الاستيراد يجعل
   الشركةَ الواحدةَ شركتين في كلِّ تقرير، ولا سبيلَ لتوحيدهما إلا نقطةً نقطة.
   صارت تُعاد تسميتُها مرةً فتتبعها نقاطُها ودفترُ جوالها ومحاضرُها. */
function coRename(oldName, newName){
  if (!may('settings')){ toast(t('إعادةُ التسمية للمهندس وحده')); return 0; }
  oldName = String(oldName || '').trim(); newName = String(newName || '').trim();
  if (!oldName || !newName || oldName === newName){ toast(t('اكتب اسمًا جديدًا مختلفًا')); return 0; }
  var n = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.co !== oldName) return;
    x.co = newName; n++;
    CORE.set('sites', x.id, { co:newName });
  });
  if (!n){ toast(t('لا نقطةَ بهذا الاسم')); return 0; }
  var tel = coTelOf(oldName);
  if (tel){ coTel()[newName] = tel; delete coTel()[oldName]; CORE.set('cfg', 'cotel', Object.assign({}, coTel())); }
  statBump();
  logEvent('إعادة تسمية شركة — ' + oldName + ' \u2192 ' + newName + ' \u00b7 ' + nm(n) + ' نقطة');
  toast(nm(n) + ' ' + t('نقطةً انتقلت إلى الاسم الجديد'));
  return n;
}
function coTel(){
  if (!CFG.cotel || typeof CFG.cotel !== 'object') CFG.cotel = {};
  return CFG.cotel;
}
function coTelOf(co){ return String(coTel()[co] || '').trim(); }
/* (V28.5) ملاحظةُ «تحديثات المنصة»: ضابطُ الاتصال لكلِّ شركة — وثيقةٌ يقرؤها الكلُّ (الوزارةُ تراه في متابعتها)، والجوالُ يبقى في دفتره المحجوب */
var CO_STALL = null;
/* (V29.0) ملاحظةُ «تحديثات المنصة» #٧: بريدُ الشركة في التواصل، وإشعارُها بالبريد بصيغةٍ رسمية. البريدُ يُحفَظ في دفتر الجوالات
   نفسِه (وثيقةٌ محجوبةٌ عن الوزارة والإدارة العليا) بمفتاح «e|الشركة»، والإرسالُ يفتح بريدَ الجهاز بالصيغة الرسمية جاهزةً. */
function coEmailOf(co){ return String(coTel()['e|' + co] || '').trim(); }
function coEmailSet(co, v){
  if (!may('approve')){ toast(t('دفترُ الجوالات للمهندس وحده')); return; }
  v = String(v || '').trim().toLowerCase();
  if (v && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v)) return;   /* يُحفَظ حين يكتمل العنوان */
  if (v) coTel()['e|' + co] = v; else delete coTel()['e|' + co];
  CORE.set('cfg', 'cotel', Object.assign({}, coTel()));
  clearTimeout(coEmailSet._t); coEmailSet._t = setTimeout(function(){ logEvent('بريد شركة — ' + co + ' \u00b7 ' + (v || 'حُذف')); }, 2500);
}
function mailOfficial(kind, co, when){
  var S = coStat(co), lz = coLiaisonOf(co), kn = WA_KINDS[kind] ? WA_KINDS[kind].n : t('إشعار');
  var sub = kn + ' \u2014 ' + co + ' \u2014 ' + t('مشروع قارئات نسك') + ' ١٤٤٨هـ';
  var L = ['السادة / ' + co + '                    المحترمين', '', 'السلام عليكم ورحمة الله وبركاته،', 'تحيةً طيبةً وبعد،', ''];
  if (kind === 'plan'){ L.push('نُفيدكم بأنّ فريقَ شركة أفاقي سيباشر تركيبَ قارئات بطاقة نسك في نقاطكم ضمن مشروع وزارة الحج والعمرة لموسم ١٤٤٨هـ.'); L.push('عددُ النقاط: ' + S.n + (when ? ' — الموعدُ المتوقّع: ' + when : '') + '.'); L.push(''); L.push('نأمل التكرّمَ بتسهيل دخول الفريق إلى المواقع وتوفيرِ مصدر كهرباءٍ عند كلِّ نقطة.'); }
  else if (kind === 'hand'){ L.push('نُفيدكم بإتمام تركيب قارئات بطاقة نسك في نقاطكم وتسليمِها.'); L.push('النقاطُ المركّبةُ المعتمدة: ' + S.ins + ' من ' + S.n + '، والمُسلَّمةُ بمحضر: ' + S.hd + (when ? ' — تاريخُ التسليم: ' + when : '') + '.'); L.push(''); L.push('محاضرُ التسليم مرفقةٌ بأرقام الأجهزة وسيرياتها، ومدّةُ الضمان تبدأ من تاريخها.'); }
  else { L.push('نُفيدكم بأنّ فريقَ شركة أفاقي سيباشر فكَّ الأجهزة من نقاطكم بعد انتهاء الموسم.'); L.push('النقاطُ التي سيُفكّ منها: ' + S.ins + (when ? ' — الموعدُ المتوقّع: ' + when : '') + '.'); L.push(''); L.push('نأمل التكرّمَ بتسهيل دخول الفريق، شاكرين تعاونكم طوال الموسم.'); }
  if (lz) L.push('ونأمل التنسيقَ مع ضابط الاتصال لديكم: ' + lz + '.');
  L.push(''); L.push('وتفضّلوا بقبول فائق الاحترام والتقدير،'); L.push(''); L.push(STATE.meta.name || ''); L.push(t('مشروع قارئات نسك — شركة أفاقي'));
  return { sub:sub, body:L.join('\n') };
}
function mailGo(co, kind, when){
  if (!co){ toast(t('اختر الشركة')); return; }
  var to = coEmailOf(co); if (!to){ toast(t('لا بريدَ محفوظٌ لهذه الشركة — احفظه في الجدول أوّلًا')); return; }
  var M = mailOfficial(kind || 'plan', co, when || '');
  try { window.location.href = 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(M.sub) + '&body=' + encodeURIComponent(M.body); }
  catch (e){ toast(t('تعذّر الفتح')); return; }
  logEvent('إشعار بريد رسمي — ' + (WA_KINDS[kind] ? WA_KINDS[kind].n : kind) + ' \u00b7 ' + co);
}
function coLiaison(){ if (!CFG.coliaison || typeof CFG.coliaison !== 'object') CFG.coliaison = {}; return CFG.coliaison; }
function coLiaisonOf(co){ return String(coLiaison()[co] || '').trim(); }
function coLiaisonSet(co, v){
  if (!may('approve')){ toast(t('دفترُ الشركات للمهندس وحده')); return; }
  v = String(v || '').trim().slice(0, 60);
  if (v) coLiaison()[co] = v; else delete coLiaison()[co];
  CORE.set('cfg', 'coliaison', Object.assign({}, coLiaison()));   /* يُحفَظ مع الكتابة (الطابورُ يجمع) — والأثرُ عند الخروج من الحقل لا مع كلِّ حرف */
  clearTimeout(coLiaisonSet._t); coLiaisonSet._t = setTimeout(function(){ logEvent('ضابطُ اتصال شركة — ' + co + ' \u00b7 ' + (v || 'حُذف')); }, 2500);
}
function coTelSet(co, ph){
  if (!may('approve')){ toast(t('دفترُ الجوالات للمهندس وحده')); return; }
  var v = String(ph || '').replace(/[^\d+]/g, '');
  if (v) coTel()[co] = v; else delete coTel()[co];
  CORE.set('cfg', 'cotel', Object.assign({}, coTel()));
  logEvent('جوال شركة — ' + co + ' \u00b7 ' + (v || 'حُذف'));
}
/* نصُّ الإشعار بحسب ما جرى — لا نصٌّ واحدٌ لكلِّ حال */
var WA_KINDS = {
  plan:  { n:'إشعار تركيب قادم',  i:'\u{1F4C5}' },
  hand:  { n:'إشعار تسليم',       i:'\u{1F91D}' },
  dis:   { n:'إشعار فك',          i:'\u{1F9E9}' }
};
function coStat(co){
  var n = 0, sv = 0, ins = 0, hd = 0;
  STATE.sites.forEach(function(x){
    if (x.co !== co) return;
    n++;
    if (svVisited(STATE.recs[x.id])) sv++;
    var r = STATE.inss[x.id];
    if (r && r.status === 'مُركّب' && r.approved) ins++;
    if (typeof handDone === 'function' && handDone(x.id)) hd++;
  });
  return { n:n, sv:sv, ins:ins, hd:hd };
}
function waText(kind, co, when){
  var S = coStat(co), L = ['السلام عليكم ورحمة الله'];
  L.push('قارئات أفاقي — RFID · موسم ١٤٤٨هـ');
  L.push('');
  L.push('الشركة: ' + fsiText(co));
  if (kind === 'plan'){
    L.push('نُفيدكم بأن فريقَنا سيباشر تركيبَ نقاطكم.');
    L.push('عدد النقاط: ' + S.n);
    if (when) L.push('الموعد المتوقّع: ' + when);
    L.push('');
    L.push('نرجو تسهيلَ دخول الفريق وتوفيرَ مصدر كهرباء في الموقع.');
  } else if (kind === 'hand'){
    L.push('نُفيدكم بإتمام تركيب نقاطكم وتسليمِها.');
    L.push('نقاطٌ مُركّبةٌ معتمدة: ' + S.ins + ' من ' + S.n);
    L.push('سُلِّم منها بمحضر: ' + S.hd);
    if (when) L.push('تاريخ التسليم: ' + when);
    L.push('');
    L.push('محضرُ التسليم مرفقٌ بأرقام الأجهزة وسيرياتها، ومدةُ الضمان تبدأ من تاريخه.');
  } else {
    L.push('نُفيدكم بأن فريقَنا سيباشر فكَّ الأجهزة بعد انتهاء الموسم.');
    L.push('نقاطٌ سيُفَكّ منها: ' + S.ins);
    if (when) L.push('الموعد المتوقّع: ' + when);
    L.push('');
    L.push('نرجو تسهيلَ دخول الفريق. وشكرًا لتعاونكم طوال الموسم.');
  }
  L.push('');
  L.push('وتفضلوا بقبول التحية،');
  L.push(STATE.meta.name || '');
  return L.join('\n');
}
function waGo(co, kind, when, copy){
  if (!co){ toast(t('اختر الشركة')); return; }
  var txt = waText(kind || 'plan', co, when || '');
  if (copy){
    try { if (navigator.clipboard) navigator.clipboard.writeText(txt); toast(t('نُسخ النص')); }
    catch (e){ toast(t('تعذّر النسخ')); }
    return;
  }
  var ph = coTelOf(co);
  if (!ph){ toast(t('لا جوالَ محفوظٌ لهذه الشركة — احفظه في دفتر الجوالات أوّلًا')); return; }
  try { window.open(waLink(ph, txt), '_blank', 'noopener'); }
  catch (e){ toast(t('تعذّر الفتح')); return; }
  logEvent('إشعار واتساب — ' + (WA_KINDS[kind] ? WA_KINDS[kind].n : kind) + ' \u00b7 ' + co);
  notifPush('إشعار شركة', co + ' \u00b7 ' + t(WA_KINDS[kind] ? WA_KINDS[kind].n : ''), { lv:'عادي' });
}

/* ═══ جدولُ المتابعة — هيكلُ تقسيم العمل ═══
   الجدولُ الذي يُتابَع به المشروعُ مع الوزارة كان ملفَّ إكسل يُرسَل ويُعدَّل
   باليد: ١٦٣ بندًا بمعرِّف هيكلٍ وبدايةٍ ونهايةٍ وإنجازٍ ومسؤولٍ وجهة. صار في
   النظام: يُستورَد من الملف نفسِه، ويُعدَّل إنجازُ كلِّ بندٍ من المكتب، وتُحسَب
   حالتُه وموقفُه الزمنيُّ من تاريخ اليوم لا من خليةٍ مكتوبة، ويراه الجميعُ —
   والوزارةُ قراءةً — لحظةً بلحظة. الآباءُ يُجمَّع إنجازُهم من أبنائهم. */
function wbsRows(){ return (STATE.wbs && Array.isArray(STATE.wbs.rows)) ? STATE.wbs.rows : []; }
function wbsKeys(){ return (STATE.wbs && Array.isArray(STATE.wbs.keys)) ? STATE.wbs.keys : []; }
function wbsDepth(id){ return String(id || '').split('.').length; }
function wbsChildren(id){ var p = String(id) + '.'; return wbsRows().filter(function(r){ return String(r.id).indexOf(p) === 0 && wbsDepth(r.id) === wbsDepth(id) + 1; }); }
function wbsPct(r){
  var kids = wbsChildren(r.id);
  if (!kids.length){ var ap = wbsAutoPct(r); return ap != null ? ap : Math.max(0, Math.min(100, +r.pct || 0)); }   /* (V30.2) المقيسُ تلقائيًّا */
  var tot = 0, w = 0;
  kids.forEach(function(k){ var d = Math.max(1, +k.dur || 1); tot += wbsPct(k) * d; w += d; });
  return w ? Math.round(tot / w) : 0;
}
/* ═══ (V30.2) الخطةُ مقابلَ الفعلي (فكرةُ المالك #٣) ═══
   المخطّطُ من التواريخ: نسبةُ ما انقضى من مدة البند حتى اليوم (المعلَمُ صفرٌ قبل موعده ومئةٌ بعده)، والآباءُ بأوزان الأبناء.
   الفعليُّ التلقائي: البنودُ التي يقيسها النظامُ بنفسه (المسحُ بالمشعر، تأكيدُ الجمرات، مواقعُ التفويج، التركيبُ) تُقرأ من
   بياناته لا من يد — وغيرُها بما يُكتَب في الملف. والانحرافُ = الفعلي − المخطّط. */
var WBS_AUTO = [
  [/^مسح.*(النوارية|النورية)/, function(){ return wbsSvPctT('النورية'); }],
  [/^مسح.*(الزايدي)/, function(){ return wbsSvPctT('الزايدي'); }],
  [/^مسح.*(الهجرة)/, function(){ return wbsSvPctT('محطات طريق الهجرة'); }],
  [/^مسح.*(التفويج)/, function(){ return wbsSvPct('مراكز التفويج'); }],
  [/^مسح.*(منى)/, function(){ return wbsSvPct('منى'); }],
  [/^مسح.*(عرفات)/, function(){ return wbsSvPct('عرفات'); }],
  [/^مسح.*(مزدلفة|المزدلفة)/, function(){ return wbsSvPct('المزدلفة'); }],
  [/^(مسح|تأكيد).*(الجمرات)/, function(){ var j = jmrConfirm().tot; return j.n ? Math.round(j.ok / j.n * 100) : 0; }],
  [/^مسح.*(القطار|المحطات)/, function(){ return wbsSvPctT('محطات قطار'); }],
  [/^مسح.*(كاميرات|الكاميرات)/, function(){ return wbsSvPct('كاميرات المتابعة'); }],
  [/^(المسح الميداني الشامل|اكتمال المسح الميداني)/, function(){ return svStats().pct; }],
  [/^تركيب.*(منى)/, function(){ return wbsInsPct('منى'); }],
  [/^تركيب.*(عرفات)/, function(){ return wbsInsPct('عرفات'); }],
  [/^تركيب.*(المزدلفة|مزدلفة)/, function(){ return wbsInsPct('المزدلفة'); }],
  [/^(تركيب النقاط|التركيب الميداني|تركيب المواقع|اكتمال التركيب)/, function(){ var K = siteKeyStats().total; return K.n ? Math.round(K.ins / K.n * 100) : 0; }]
];
function wbsSvPct(g){ var n = 0, d = 0; (STATE.sites || []).forEach(function(x){ if (taxOf(x).g !== g) return; n++; if (svVisited(STATE.recs[x.id])) d++; }); return n ? Math.round(d / n * 100) : 0; }
function wbsSvPctT(ty){ var n = 0, d = 0; (STATE.sites || []).forEach(function(x){ if (taxOf(x).t !== ty) return; n++; if (svVisited(STATE.recs[x.id])) d++; }); return n ? Math.round(d / n * 100) : 0; }
function wbsInsPct(g){ var n = 0, d = 0; (STATE.sites || []).forEach(function(x){ if (taxOf(x).g !== g) return; n++; var st = (STATE.inss[x.id] || {}).status; if (st === 'مُركّب' || x.fstat === 'مُركّب') d++; }); return n ? Math.round(d / n * 100) : 0; }
function wbsAutoPct(r){ if (wbsChildren(r.id).length || r.manual) return null; var nm0 = String(r.n || ''); for (var i = 0; i < WBS_AUTO.length; i++){ if (WBS_AUTO[i][0].test(nm0)){ try { return Math.max(0, Math.min(100, +WBS_AUTO[i][1]() || 0)); } catch (e){ return null; } } } return null; }
function wbsPlanPct(r){
  var kids = wbsChildren(r.id), today = dayKey(Date.now());
  if (kids.length){ var tot = 0, w = 0; kids.forEach(function(k){ var d = Math.max(1, +k.w || +k.dur || 1); tot += wbsPlanPct(k) * d; w += d; }); return w ? Math.round(tot / w) : 0; }
  if (!r.s || !r.e) return 0;
  if (r.type === 'معلم') return r.e <= today ? 100 : 0;
  if (today <= r.s) return 0; if (today >= r.e) return 100;
  var a = new Date(r.s).getTime(), b = new Date(r.e).getTime(), n = new Date(today).getTime(); return b > a ? Math.round((n - a) / (b - a) * 100) : 100;
}
function wbsVar(r){ return wbsPct(r) - wbsPlanPct(r); }
function wbsVarPill(v){ return v <= -10 ? pill(t('متأخر') + ' ' + nm(v) + '٪', 'bad') : (v < 0 ? pill(nm(v) + '٪', 'warn') : pill('+' + nm(v) + '٪', 'ok')); }
function wbsProjectPct(){ var top = wbsRows().filter(function(r){ return wbsDepth(r.id) === 1; }), pw = 0, pa = 0, w = 0; top.forEach(function(r){ var d = Math.max(1, +r.w || +r.dur || 1); pw += wbsPlanPct(r) * d; pa += wbsPct(r) * d; w += d; }); return { plan:w ? Math.round(pw / w) : 0, act:w ? Math.round(pa / w) : 0, rows:top.length }; }
function wbsPlanCard(){
  var R = wbsRows(); if (!R.length) return '';
  var P = wbsProjectPct(), leaves = R.filter(function(r){ return !wbsChildren(r.id).length && r.s && r.e; });
  var late = leaves.map(function(r){ return { r:r, v:wbsVar(r) }; }).filter(function(o){ return o.v <= -10 && wbsPct(o.r) < 100; }).sort(function(a, b){ return a.v - b.v; }).slice(0, 6);
  var auto = leaves.filter(function(r){ return wbsAutoPct(r) != null; }).length;
  return card('\u{1F4C8} ' + t('الخطة مقابل الفعلي'),   /* (V30.6) */
    '<p class="hint" style="margin:0 0 6px">' + esc(t('المخطّط من التواريخ، والفعليُّ من النظام حيث يُقاس')) + '</p><div class="mfu-kpis">' + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('الإنجاز المخطّط')) + '</div><div class="mfu-kpi-v">' + nm(P.plan) + '٪</div></div>'
    + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('الإنجاز الفعلي')) + '</div><div class="mfu-kpi-v" style="color:' + (P.act >= P.plan ? '#27AE60' : '#C0392B') + '">' + nm(P.act) + '٪</div></div>'
    + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('الانحراف')) + '</div><div class="mfu-kpi-v">' + wbsVarPill(P.act - P.plan) + '</div><div class="hint" style="margin:2px 0 0">' + nm(auto) + ' ' + esc(t('بندًا يُقاس تلقائيًّا')) + '</div></div></div>'
    + (late.length ? '<p class="hint" style="margin:8px 0 4px">' + esc(t('أكثرُ البنود تأخّرًا عن مخطّطها')) + '</p>' + table(['البند', 'المخطّط', 'الفعلي', 'الانحراف'], late.map(function(o){ return ['<span class="num hint" style="margin:0">' + esc(o.r.id) + '</span> ' + esc(o.r.n), nm(wbsPlanPct(o.r)) + '٪', nm(wbsPct(o.r)) + '٪', wbsVarPill(o.v)]; })) : '<p class="hint" style="margin:8px 0 0">' + esc(t('لا بندَ متأخرًا عن مخطّطه بأكثر من ١٠٪')) + '</p>'));
}
function wbsStatus(r){ var p = wbsPct(r); return p >= 100 ? 'مكتملة' : (p > 0 ? 'قيد التنفيذ' : 'لم تبدأ'); }
function wbsTiming(r){
  var p = wbsPct(r), today = dayKey(Date.now());
  if (p >= 100) return 'مكتمل';
  if (r.e && r.e < today) return 'متأخر';
  if (r.s && r.s > today) return 'لم يحن موعده';
  /* ═══ بندٌ حلَّ بدؤُه ولم يبدأ (V17.15) ═══
     كان يُقال عنه «ضمن مدته» لأن نهايتَه لم تحن — وهو قد تأخّر عن **بدئه**:
     تاريخُ البدء مضى والإنجازُ صفر. فيُقرأ «لم تبدأ · ضمن مدته» فيُطمأنُّ
     إليه وهو أوّلُ ما يجب أن يُسأل عنه. صار له اسمُه: «تأخّر البدء». */
  if (r.s && r.s < today && p <= 0) return 'تأخّر البدء';
  return 'ضمن مدته';
}
function wbsLeft(r){
  if (!r.e) return null;
  var d = Math.round((new Date(r.e) - new Date(dayKey(Date.now()))) / 86400000);
  return d;
}
/* المرشِّحُ نفسُه للشاشة وللورقة */
function wbsPass(r){
  if (WBS_Q && (r.n + ' ' + r.id + ' ' + (r.resp || '') + ' ' + (r.party || '')).indexOf(WBS_Q) < 0) return false;
  var st = wbsStatus(r), tm = wbsTiming(r);
  if (WBS_F === 'late') return tm === 'متأخر';
  if (WBS_F === 'run') return st === 'قيد التنفيذ';
  if (WBS_F === 'done') return st === 'مكتملة';
  if (WBS_F === 'todo') return st === 'لم تبدأ';
  if (WBS_F === 'ms') return r.type === 'معلم';
  return true;
}
function wbsFiltered(){
  if (!WBS_F && !WBS_Q) return wbsRows();
  var keep = {};
  wbsRows().forEach(function(r){
    if (!wbsPass(r)) return;
    keep[r.id] = 1;                                   /* والآباءُ معه ليُقرأ في سياقه */
    var p = String(r.id).split('.');
    for (var i = 1; i < p.length; i++) keep[p.slice(0, i).join('.')] = 1;
  });
  return wbsRows().filter(function(r){ return keep[r.id]; });
}
/* ═══ تصديرُ الخطة كما تُدار: بصيغِها وطيِّها وألوانها ═══
   يُبنى الملفُّ على شكل ملفِّ المتابعة نفسِه: صفُّ المواعيد الحاكمة بصيغِه
   النسبية (يُغيَّر يومُ عرفة فتتحرّك المواعيدُ كلُّها)، وصيغُ المدةِ والحالةِ
   والموقفِ الزمنيِّ والمتبقّي — فالملفُّ يُحدِّث نفسَه بعد التصدير كما كان
   يفعل قبل أن يدخل النظام. والآباءُ يجمعون أبناءهم بـMIN/MAX/AVERAGE على
   صفوفهم الفعلية، ومستوياتُ الطيِّ من عمق المعرِّف. */
function wbsKeyRow(){
  var K = wbsKeys();
  return K.length ? K : [{ n:'يوم عرفة ١٤٤٨هـ', d:'2027-05-15' }];
}
/* ═══ القيمةُ مع الصيغة ═══
   الملفُّ كان يحمل الصيغَ بلا قيمٍ محسوبة: إكسلُ المكتب يحسبها عند الفتح، أما
   معاينةُ الجوّال وجداولُ جوجل والقارئُ المستعجلُ فيرون المدةَ والحالةَ
   والموقفَ خانةً فارغة. صارت كلُّ صيغةٍ تُكتَب ومعها ناتجُها المحسوبُ هنا
   بالمنطق نفسِه — ويُطلَب من إكسل إعادةُ الحساب عند الفتح فتبقى الصيغُ هي
   الحاكمة. والتواريخُ كانت تنزاح يومًا (منتصفُ ليل مكة = مساءُ الأمس بتوقيت
   غرينتش) فتُكتَب بتوقيت غرينتش صراحةً. */
function xlDate(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
function workDays(s0, e0){
  var a = xlDate(s0), b = xlDate(e0); if (!a || !b || b < a) return 0;
  var n = 0;
  for (var d = new Date(a); d <= b; d.setUTCDate(d.getUTCDate() + 1)){
    var wd = d.getUTCDay();                    /* ٥ الجمعة · ٦ السبت — عطلةٌ كما في الصيغة */
    if (wd !== 5 && wd !== 6) n++;
  }
  return n;
}
function wbsExcel(){
  if (!wbsRows().length){ toast(t('لا جدولَ بعد')); return; }
  toast(t('يُجهَّز الملف…'));
  exlLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var E = window.ExcelJS, wb = new E.Workbook();
    wb.creator = 'قارئات أفاقي'; wb.created = new Date();
    var ws = wb.addWorksheet(t('متابعة مشروع قارئات أفاقي'), { views:[{ rightToLeft:true, state:'frozen', ySplit:5 }] });
    var GREEN = 'FF0E4C3F', SOFT = 'FFE6EFEB';
    var R = wbsRows(), K = wbsKeyRow();
    /* ١ · الترويسةُ والمواعيدُ الحاكمة */
    ws.getCell('A1').value = t('متابعة مشروع قارئات أفاقي') + ' — ' + t('حج ١٤٤٨هـ') + ' \u00b7 ' + (CFG.orgName || 'أفاقي');
    ws.getCell('A1').font = { bold:true, size:14, color:{ argb:GREEN } };
    ws.getCell('A2').value = t('المواعيد الحاكمة'); ws.getCell('A2').font = { bold:true };
    ws.getCell('A3').value = t('التاريخ'); ws.getCell('A4').value = t('المتبقي');
    K.slice(0, 11).forEach(function(k, i){
      var col = 2 + i, L = ws.getColumn(col).letter;
      ws.getCell(2, col).value = k.n;
      ws.getCell(2, col).font = { bold:true, size:10 };
      ws.getCell(3, col).value = xlDate(k.d);
      ws.getCell(3, col).numFmt = 'yyyy-mm-dd';
      var leftK = k.d ? Math.round((xlDate(k.d) - xlDate(dayKey(Date.now()))) / 86400000) : 0;
      ws.getCell(4, col).value = { formula:'IF(' + L + '3<TODAY(),"مضى ","")&TEXT(ABS(' + L + '3-TODAY()),"0")&" يوم"',
                                   result:(leftK < 0 ? 'مضى ' : '') + Math.abs(leftK) + ' يوم' };
      ws.getCell(4, col).font = { size:10, color:{ argb:'FF667788' } };
    });
    /* ٢ · العناوين */
    var HEAD = ['هيكل تقسيم العمل','اسم المهمة','تاريخ البدء','تاريخ الانتهاء','المدة','الإنجاز','الحالة',
                'الموقف الزمني','النوع','المسؤول','الجهة المعنية','المتبقي','ملاحظات المتابعة'];
    HEAD.forEach(function(h, i){
      var c = ws.getCell(5, i + 1);
      c.value = t(h);
      c.font = { bold:true, color:{ argb:'FFFFFFFF' } };
      c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:GREEN } };
      c.alignment = { horizontal:'center', vertical:'middle' };
    });
    /* ٣ · الصفوف — الصيغُ تُبنى على أرقام الصفوف الفعلية */
    var rowOf = {}; R.forEach(function(r, i){ rowOf[r.id] = 6 + i; });
    /* القيمُ المحسوبةُ بالمنطق نفسِه — للآباء من أبنائهم (تُحسَب من الورقة إلى الجذر) */
    var calc = {};
    var eff = function(r){
      if (calc[r.id]) return calc[r.id];
      var kids = wbsChildren(r.id), o;
      if (kids.length){
        var ks = kids.map(eff);
        var ss = ks.map(function(k){ return k.s; }).filter(Boolean).sort(), es = ks.map(function(k){ return k.e; }).filter(Boolean).sort();
        o = { s:ss[0] || '', e:es[es.length - 1] || '', pct:Math.round(ks.reduce(function(a, k){ return a + k.pct; }, 0) / ks.length) };
      } else o = { s:r.s || '', e:r.e || '', pct:Math.max(0, Math.min(100, +r.pct || 0)) };
      o.dur = (r.type === 'معلم') ? 0 : workDays(o.s, o.e);
      o.st = o.pct >= 100 ? 'مكتملة' : (o.pct > 0 ? 'قيد التنفيذ' : 'لم تبدأ');
      var today = dayKey(Date.now());
      o.tm = o.pct >= 100 ? 'مكتمل' : (o.e && today > o.e ? 'يستوجب المتابعة' : (o.s && today < o.s ? 'لم يحن موعده' : 'ضمن مدته'));
      o.left = o.pct >= 100 ? '—' : (o.e ? Math.round((xlDate(o.e) - xlDate(today)) / 86400000) : '');
      calc[r.id] = o; return o;
    };
    R.forEach(function(r, i){
      var n = 6 + i, dep = wbsDepth(r.id), v = eff(r);
      var kids = wbsChildren(r.id).map(function(k){ return rowOf[k.id]; }).filter(Boolean);
      var row = ws.getRow(n);
      row.getCell(1).value = '\u200f' + r.id;
      row.getCell(2).value = r.n;
      if (kids.length){
        row.getCell(3).value = { formula:'MIN(' + kids.map(function(x){ return 'C' + x; }).join(',') + ')', result:xlDate(v.s) };
        row.getCell(4).value = { formula:'MAX(' + kids.map(function(x){ return 'D' + x; }).join(',') + ')', result:xlDate(v.e) };
        row.getCell(6).value = { formula:'ROUND(AVERAGE(' + kids.map(function(x){ return 'F' + x; }).join(',') + '),0)', result:v.pct };
      } else {
        row.getCell(3).value = xlDate(r.s);
        row.getCell(4).value = xlDate(r.e);
        row.getCell(6).value = v.pct;
      }
      row.getCell(3).numFmt = 'yyyy-mm-dd'; row.getCell(4).numFmt = 'yyyy-mm-dd';
      row.getCell(5).value = { formula:'IF($I' + n + '="معلم",0,SUMPRODUCT((WEEKDAY(ROW(INDIRECT(INT($C' + n + ')&":"&INT($D' + n + '))),2)<5)+(WEEKDAY(ROW(INDIRECT(INT($C' + n + ')&":"&INT($D' + n + '))),2)=7)))', result:v.dur };
      row.getCell(7).value = { formula:'IF(F' + n + '>=100,"مكتملة",IF(F' + n + '>0,"قيد التنفيذ","لم تبدأ"))', result:v.st };
      row.getCell(8).value = { formula:'IF(F' + n + '>=100,"مكتمل",IF(TODAY()>INT(D' + n + '),"يستوجب المتابعة",IF(TODAY()<INT(C' + n + '),"لم يحن موعده","ضمن مدته")))', result:v.tm };
      row.getCell(9).value = r.type || 'مهمة';
      row.getCell(10).value = r.resp || '';
      row.getCell(11).value = r.party || '';
      row.getCell(12).value = { formula:'IF(F' + n + '>=100,"—",INT(D' + n + ')-TODAY())', result:v.left };
      row.getCell(13).value = r.note || '';
      row.outlineLevel = Math.max(0, dep - 1);
      if (kids.length){
        for (var ci = 1; ci <= 13; ci++){
          row.getCell(ci).font = { bold:true };
          row.getCell(ci).fill = { type:'pattern', pattern:'solid', fgColor:{ argb:SOFT } };
        }
      }
      for (var cj = 1; cj <= 13; cj++) row.getCell(cj).alignment = { vertical:'middle' };
      row.getCell(2).alignment = { vertical:'middle', wrapText:true, horizontal:'right' };
    });
    var last = 5 + R.length;
    /* ٤ · العرضُ والمرشِّحُ والتنسيقُ الشرطيّ */
    /* `ws.columns` غيرُ مهيَّأةٍ حتى يُطلَب العمودُ — والعرضُ يُضبَط عمودًا عمودًا */
    [16, 79, 13, 13, 12, 10, 13, 16, 12, 26, 22, 12, 50].forEach(function(w2, i){ ws.getColumn(i + 1).width = w2; });
    ws.properties.outlineProperties = { summaryBelow:false, summaryRight:false };
    ws.autoFilter = { from:{ row:5, column:1 }, to:{ row:last, column:13 } };
    var band = function(ref, rules){ ws.addConditionalFormatting({ ref:ref, rules:rules }); };
    /* شريطُ الإنجاز يحتاج حدَّيه صراحةً — بدونهما تسقط الكتابةُ كلُّها */
    band('F6:F' + last, [{ type:'dataBar', priority:1, minLength:0, maxLength:100,
                           color:{ argb:'FF2E75B6' }, cfvo:[{ type:'min' }, { type:'max' }] }]);
    var eq = function(txt, bg, fg){
      return { type:'cellIs', operator:'equal', formulae:['"' + txt + '"'], priority:1,
               style:{ fill:{ type:'pattern', pattern:'solid', bgColor:{ argb:bg } }, font:{ color:{ argb:fg || 'FF14324A' }, bold:true } } };
    };
    band('G6:G' + last, [eq('مكتملة','FFD7F5E6'), eq('قيد التنفيذ','FFFFF3CD')]);
    band('H6:H' + last, [eq('مكتمل','FFD7F5E6'), eq('ضمن مدته','FFE7F0FA'),
                         eq('يستوجب المتابعة','FFFBD5D5','FF8B1E1E'), eq('لم يحن موعده','FFEFF1F3','FF667788')]);
    band('L6:L' + last, [
      { type:'expression', formulae:['AND(ISNUMBER(L6),L6<=30,L6>=0)'], priority:1,
        style:{ fill:{ type:'pattern', pattern:'solid', bgColor:{ argb:'FFFFF3CD' } } } },
      { type:'expression', formulae:['AND(ISNUMBER(L6),L6<0)'], priority:2,
        style:{ fill:{ type:'pattern', pattern:'solid', bgColor:{ argb:'FFFBD5D5' } }, font:{ color:{ argb:'FF8B1E1E' }, bold:true } } }]);
    ws.getCell('A' + (last + 2)).value = t('صُدِّر من قارئات أفاقي') + ' \u00b7 ' + fmtDT()
      + ' \u00b7 ' + dispName(STATE.meta.name || '');
    ws.getCell('A' + (last + 2)).font = { size:9, color:{ argb:'FF889099' } };
    /* إكسلُ يُعيد الحسابَ عند الفتح — فالصيغُ تبقى الحاكمةَ والقيمُ المكتوبةُ للعرض الفوريّ */
    wb.calcProperties = { fullCalcOnLoad:true };
    wb.xlsx.writeBuffer().then(function(buf){
      dl(new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
         'متابعة-الخطة-التفصيلية-' + dayKey() + '.xlsx');
      logEvent('تصديرُ الخطة التفصيلية — ' + R.length + ' بندًا');
      toast(nm(R.length) + ' ' + t('بندًا صُدِّرت بالمعادلات والطيّ'));
    }).catch(function(e){ softErr('تصدير الخطة', e, 'تعذّر بناءُ الملف'); });
  });
}
function wbsSave(){
  if (!may('settings')){ toast(t('جدولُ المتابعة للمهندس فما فوق')); return false; }
  STATE.wbs = STATE.wbs || { rows:[], keys:[] };
  STATE.wbs.at = Date.now(); STATE.wbs.by = STATE.meta.name || '';
  CORE.set('cfg', 'wbs', { rows:STATE.wbs.rows, keys:STATE.wbs.keys, at:STATE.wbs.at, by:STATE.wbs.by });
  CORE.saveSoon(); return true;
}
/* ═══ ملفُّ البند (V17.11) ═══
   الجدولُ يقول متى يبدأ البندُ ومتى ينتهي وكم أُنجز — ولا يقول ما يُشترى له
   ولا مَن يدفع ثمنَه ولا ماذا يُركَّب وأين، ولا ما العائدُ منه. فتُسأل هذه
   أربعَ مرات في كلِّ اجتماعٍ وتُجاب من الذاكرة. فصار لكلِّ بندٍ **ملفٌّ**:
   جهةُ الدفع والتكلفة، وأصنافُ ما يُشترى بكمياتها وأسعارها، وماذا يُركَّب
   وكيف وأين، والعائدُ منه بقيمته، وروابطُ ملفاته (كراسة · عرض · مخطّط).
   يُحفَظ في صفِّ البند نفسِه — لا مجموعةَ جديدة ولا قاعدةَ جديدة. */
var WBS_DOS = '';
function dosOf(r){ return (r && r.dos) || {}; }
function dosItems(r){ var d = dosOf(r); return Array.isArray(d.items) ? d.items : []; }
function dosFiles(r){ var d = dosOf(r); return Array.isArray(d.files) ? d.files : []; }
function dosCost(r){ return dosItems(r).reduce(function(a, x){ return a + (+x.q || 0) * (+x.p || 0); }, 0); }
function wbsRow(id){ return wbsRows().filter(function(x){ return String(x.id) === String(id); })[0] || null; }
function dosSet(id, patch){
  if (!may('settings')){ toast(t('ملفُّ البند للمهندس فما فوق')); return false; }
  var r = wbsRow(id); if (!r) return false;
  r.dos = Object.assign({}, dosOf(r), patch, { at:Date.now(), by:STATE.meta.name || '' });
  if (wbsSave()){ logEvent('ملفُّ بند — ' + id, id); render(1); return true; }
  return false;
}
function dosSave(id){
  var g = function(k){ var el = document.getElementById('ds' + k); return el ? String(el.value || '').trim() : ''; };
  if (dosSet(id, { payer:g('Payer'), buy:g('Buy'), inst:g('Inst'), how:g('How'), where:g('Where'), val:g('Val'), gain:+g('Gain') || 0 }))
    toast(t('حُفظ ملفُّ البند'));
}
function dosItemAdd(id){
  var r = wbsRow(id); if (!r) return;
  var g = function(k){ var el = document.getElementById('di' + k); return el ? String(el.value || '').trim() : ''; };
  var n = g('N'); if (!n){ toast(t('اكتب اسمَ الصنف')); return; }
  var L = dosItems(r).slice(); L.push({ n:n, q:+g('Q') || 1, p:+g('P') || 0 });
  if (dosSet(id, { items:L })) toast(t('أُضيف الصنف'));
}
function dosItemDel(id, i){
  var r = wbsRow(id); if (!r) return;
  var L = dosItems(r).slice(); L.splice(i, 1);
  if (dosSet(id, { items:L })) toast(t('حُذف الصنف'));
}
function dosFileAdd(id){
  var r = wbsRow(id); if (!r) return;
  var g = function(k){ var el = document.getElementById('df' + k); return el ? String(el.value || '').trim() : ''; };
  var u = g('U'); if (!/^https?:\/\//i.test(u)){ toast(t('الرابطُ يبدأ بـhttp')); return; }
  var L = dosFiles(r).slice(); L.push({ n:g('N') || u.slice(0, 40), u:u, at:Date.now(), by:STATE.meta.name || '' });
  if (dosSet(id, { files:L })) toast(t('أُضيف الملف'));
}
function dosFileDel(id, i){
  var r = wbsRow(id); if (!r) return;
  var L = dosFiles(r).slice(); L.splice(i, 1);
  if (dosSet(id, { files:L })) toast(t('حُذف الملف'));
}
/* شارةٌ على الصفِّ تقول إن للبند ملفًّا — فلا يُفتَح كلُّ بندٍ ليُعرَف */
function dosBadge(r){
  var d = dosOf(r), n = dosItems(r).length, fl = dosFiles(r).length, c = dosCost(r);
  var any = d.payer || d.buy || d.inst || d.val || n || fl;
  return '<button type="button" class="btn btn-quiet btn-sm" data-wbsdos="' + esc(r.id) + '" title="' + esc(t('ملفُّ البند')) + '">'
    + (any ? '\u{1F4C1}' : '\u2795') + (c ? ' <span class="num">' + nm(c) + '</span>' : (fl ? ' <span class="num">' + nm(fl) + '</span>' : '')) + '</button>';
}
function wbsDosSheet(){
  if (!WBS_DOS) return '';
  var r = wbsRow(WBS_DOS); if (!r){ WBS_DOS = ''; return ''; }
  var d = dosOf(r), me = may('settings'), its = dosItems(r), fls = dosFiles(r), cost = dosCost(r);
  var fld = function(k, lab, val, ph){
    return '<div class="field"><label>' + esc(t(lab)) + '</label>'
      + (me ? '<input id="ds' + k + '" dir="auto" value="' + esc(val || '') + '" placeholder="' + esc(t(ph || '')) + '">'
            : '<div style="padding:6px 0">' + (val ? esc(val) : '<span class="hint">' + esc(t('—')) + '</span>') + '</div>') + '</div>';
  };
  return '<div class="wt-back" data-dosclose="0"></div>'
    + '<div class="pop wt-sheet" id="dosSheet" role="dialog" aria-label="' + esc(t('ملفُّ البند')) + '">'
    + '<div class="pop-head"><div style="min-width:0">'
    +   '<div class="pid num hint" style="margin:0">' + esc(r.id) + '</div>'
    +   '<h3 style="margin-top:3px">' + esc(r.n) + '</h3></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm pop-x" data-dosclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">'
    /* من يدفع وكم */
    + '<div class="grid cols-2">'
    +   fld('Payer', 'من يدفع', d.payer, 'الوزارة · أفاقي · مناصفةً')
    +   fld('Val', 'العائد من البند', d.val, 'ماذا يكسب المشروعُ به؟')
    + '</div>'
    + (me ? '<div class="field"><label>' + esc(t('قيمةُ العائد التقديرية')) + '</label><input id="dsGain" type="number" min="0" step="1" inputmode="numeric" value="' + esc(d.gain || '') + '"></div>'
          : (d.gain ? '<p class="hint" style="margin:0 0 8px">' + esc(t('قيمةُ العائد التقديرية')) + ': <b class="num">' + nm(d.gain) + '</b></p>' : ''))
    /* ماذا يُشترى — أصنافٌ بأسعارها */
    + '<div class="hint" style="margin:10px 0 4px;font-weight:700">\u{1F6D2} ' + esc(t('ما يُشترى'))
    +   (cost ? ' <span class="num">' + nm(cost) + '</span> ' + esc(t('ريال')) : '') + '</div>'
    + fld('Buy', 'وصفُ المشتريات', d.buy, 'ما الذي يُشترى لهذا البند؟')
    + (its.length
        ? table(['الصنف','الكمية','سعر الوحدة','الإجمالي'].concat(me ? [''] : []),
            its.map(function(x, ix){
              var row = [esc(x.n), N(+x.q || 0), N(+x.p || 0), '<b class="num">' + nm((+x.q || 0) * (+x.p || 0)) + '</b>'];
              if (me) row.push(btn('\u{1F5D1}','btn-quiet btn-sm',' data-dosdel="' + esc(r.id) + '|' + ix + '"'));
              return row;
            }).concat([['<b>' + esc(t('الإجمالي')) + '</b>', '', '', '<b class="num">' + nm(cost) + '</b>'].concat(me ? [''] : [])]))
        : '')
    + (me
        ? '<div class="grid cols-3" style="gap:6px">'
          + '<div class="field" style="margin:0"><label class="mini">' + esc(t('الصنف')) + '</label><input id="diN" dir="auto"></div>'
          + '<div class="field" style="margin:0"><label class="mini">' + esc(t('الكمية')) + '</label><input id="diQ" type="number" min="0" step="1" value="1"></div>'
          + '<div class="field" style="margin:0"><label class="mini">' + esc(t('سعر الوحدة')) + '</label><input id="diP" type="number" min="0" step="0.01"></div>'
          + '</div><div class="actions" style="margin:6px 0 0">' + btn('\u2795 ' + t('أضِف الصنف'),'btn-secondary btn-sm',' data-dositem="' + esc(r.id) + '"') + '</div>'
        : '')
    /* ماذا يُركَّب وكيف وأين */
    + '<div class="hint" style="margin:12px 0 4px;font-weight:700">\u{1F527} ' + esc(t('ما يُركَّب')) + '</div>'
    + fld('Inst', 'ماذا يُركَّب', d.inst, 'القارئُ والهوائيُّ والراوتر…')
    + '<div class="grid cols-2">'
    +   fld('How', 'كيف', d.how, 'على عمودٍ · على العارضة · داخل لوحة')
    +   fld('Where', 'أين', d.where, 'المشعرُ والمربعُ والنقاطُ المشمولة')
    + '</div>'
    /* الملفات */
    + '<div class="hint" style="margin:12px 0 4px;font-weight:700">\u{1F4CE} ' + esc(t('ملفاتُ البند'))
    +   (fls.length ? ' <span class="num">' + nm(fls.length) + '</span>' : '') + '</div>'
    + (fls.length
        ? '<div class="wt-log">' + fls.map(function(x, ix){
            return '<div class="wt-le"><a href="' + esc(x.u) + '" target="_blank" rel="noopener">' + esc(x.n) + '</a>'
              + ' <span class="hint num" style="margin:0">' + esc(stepAgo(x.at || 0)) + '</span>'
              + (me ? ' ' + btn('\u{1F5D1}','btn-quiet btn-sm',' data-dosfdel="' + esc(r.id) + '|' + ix + '"') : '') + '</div>';
          }).join('') + '</div>'
        : '<p class="hint" style="margin:0">' + esc(t('بلا ملفات — أضِف رابطًا من شيربوينت أو درايف.')) + '</p>')
    + (me
        ? '<div class="grid cols-2" style="gap:6px;margin-top:6px">'
          + '<div class="field" style="margin:0"><label class="mini">' + esc(t('اسمُ الملف')) + '</label><input id="dfN" dir="auto"></div>'
          + '<div class="field" style="margin:0"><label class="mini">' + esc(t('الرابط')) + '</label><input id="dfU" dir="ltr" placeholder="https://"></div>'
          + '</div><div class="actions" style="margin:6px 0 0">' + btn('\u{1F4CE} ' + t('أضِف الملف'),'btn-secondary btn-sm',' data-dosfile="' + esc(r.id) + '"') + '</div>'
        : '')
    + (me ? '<div class="actions" style="margin:12px 0 0">' + btn('\u{1F4BE} ' + t('حفظ ملفِّ البند'),'btn-primary btn-sm',' data-dossave="' + esc(r.id) + '"') + '</div>' : '')
    + (d.at ? '<p class="hint" style="margin:8px 0 0">' + esc(t('آخر تحديث')) + ' ' + esc(dispName(d.by || '')) + ' ' + esc(stepAgo(d.at)) + '</p>' : '')
    + '</div></div>';
}

function wbsRemove(id){
  if (!may('settings')){ toast(t('جدولُ المتابعة للمهندس فما فوق')); return; }
  var p = String(id) + '.';
  STATE.wbs.rows = wbsRows().filter(function(x){ return String(x.id) !== String(id) && String(x.id).indexOf(p) !== 0; });
  if (wbsSave()){ logEvent('حذفُ بندٍ من جدول المتابعة — ' + id, id); toast(t('حُذف البند') + ' ' + id); WBS_EDIT = ''; render(1); }
}
function wbsEditSave(id, patch){
  if (!may('settings')){ toast(t('جدولُ المتابعة للمهندس فما فوق')); return; }
  var r = wbsRows().filter(function(x){ return String(x.id) === String(id); })[0]; if (!r) return;
  Object.keys(patch).forEach(function(k){ r[k] = patch[k]; });
  if (wbsSave()){ logEvent('تعديلُ بندٍ — ' + id, id); toast(t('حُفظ البند')); WBS_EDIT = ''; render(1); }
}
function wbsClear(){
  if (!may('settings')){ toast(t('جدولُ المتابعة للمهندس فما فوق')); return; }
  STATE.wbs = { rows:[], keys:[] };
  if (wbsSave()){ logEvent('مسحُ جدول المتابعة'); toast(t('مُسح الجدول — استورد ملفًا جديدًا')); WBS_RESET = 0; render(1); }
}
function wbsSetPct(id, pct){
  var r = wbsRows().filter(function(x){ return String(x.id) === String(id); })[0]; if (!r) return;
  r.pct = Math.max(0, Math.min(100, +pct || 0));
  if (wbsSave()){ logEvent('جدول المتابعة — ' + id + ' \u00b7 ' + r.pct + '٪', id); toast(id + ' \u00b7 ' + nm(r.pct) + '٪'); }
}
/* تاريخٌ من خلية إكسل: Date أو رقمٌ تسلسليٌّ أو نصٌّ */
function wbsDate(v){
  if (!v && v !== 0) return '';
  var iso = '';
  if (v && typeof v.getTime === 'function'){ iso = isNaN(v.getTime()) ? '' : new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  else if (typeof v === 'number'){ var d = new Date(Math.round((v - 25569) * 86400000)); iso = isNaN(d) ? '' : d.toISOString().slice(0, 10); }
  else { var m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(v)); iso = m ? m[1] + '-' + m[2] + '-' + m[3] : ''; }
  return (iso && iso >= '2000-01-01') ? iso : '';
}
function wbsImport(file){
  if (!may('settings')){ toast(t('جدولُ المتابعة للمهندس فما فوق')); return; }
  xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var fr = new FileReader();
    fr.onload = function(){
      try {
        var wb = XLSX.read(new Uint8Array(fr.result), { type:'array', cellDates:true });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var A = XLSX.utils.sheet_to_json(ws, { header:1, raw:true });
        var hdr = -1, keys = [], v2 = -1;
        /* (V30.2) الإصدارُ ٢ من الخطة: ورقةُ «الجدول الزمني الرئيسي» بأعمدةٍ مسمّاة — تُقرأ بأسمائها لا بمواضعها */
        wb.SheetNames.forEach(function(sn){ if (v2 >= 0) return; var W = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header:1, raw:true });
          for (var q = 0; q < W.length; q++){ if (String(W[q][0] || '').replace(/[\u200f\u200e\s]/g, '') === 'رقمالبند'){ A = W; v2 = q; break; } } });
        if (v2 >= 0){
          var H = A[v2].map(function(h){ return String(h || '').replace(/\s+/g, ' ').trim(); }), col = function(n){ return H.indexOf(n); };
          var ci = { id:col('رقم البند'), n:col('اسم البند'), type:col('النوع'), resp:col('المسؤول'), party:col('الجهة المعنية'), s:col('البداية المعتمدة'), e:col('النهاية المعتمدة'), dur:col('المدة بأيام العمل'), w:col('الوزن'), ms:col('طريقة القياس'), pct:col('الإنجاز الفعلي') };
          var rows2 = [];
          for (var r2 = v2 + 1; r2 < A.length; r2++){ var row2 = A[r2]; if (!row2 || !row2[ci.n]) continue; var id2 = String(row2[ci.id] || '').replace(/[\u200f\u200e\s]/g, ''); if (!id2 || !/^\d/.test(id2)) continue;
            rows2.push({ id:id2, n:String(row2[ci.n]).trim(), s:wbsDate(row2[ci.s]), e:wbsDate(row2[ci.e]), dur:+row2[ci.dur] || 0, pct:Math.max(0, Math.min(100, +row2[ci.pct] || 0)), type:String(row2[ci.type] || 'مهمة').trim(), resp:String(row2[ci.resp] || '').trim(), party:String(row2[ci.party] || '').trim(), w:+row2[ci.w] || 0, ms:String(row2[ci.ms] || '').trim() }); }
          if (!rows2.length){ toast(t('لا صفوفَ في الملف')); return; }
          STATE.wbs = { rows:rows2, keys:(STATE.wbs && STATE.wbs.keys) || [] };
          if (wbsSave()){ logEvent('استيرادُ الخطة التفصيلية (الإصدار ٢) — ' + rows2.length + ' بندًا'); toast(nm(rows2.length) + ' ' + t('بندًا استُورد من الإصدار ٢')); render(1); }
          return;
        }
        for (var i = 0; i < A.length; i++){
          var c0 = String(A[i][0] || '').trim();
          if (c0 === 'المواعيد الحاكمة' && A[i + 1]){
            for (var c = 1; c < A[i].length; c++){ var lab = String(A[i][c] || '').trim(), dt = wbsDate(A[i + 1][c]); if (lab && dt && lab !== 'تاريخ اليوم') keys.push({ n:lab, d:dt }); }
          }
          if (c0 === 'هيكل تقسيم العمل'){ hdr = i; break; }
        }
        if (hdr < 0){ toast(t('لم يُعثَر على صفِّ العناوين «هيكل تقسيم العمل»')); return; }
        var rows = [];
        for (var r = hdr + 1; r < A.length; r++){
          var row = A[r]; if (!row || !row[1]) continue;
          var id = String(row[0] || '').replace(/[\u200f\u200e\s]/g, ''); if (!id) continue;
          rows.push({ id:id, n:String(row[1]).trim(), s:wbsDate(row[2]), e:wbsDate(row[3]), dur:+row[4] || 0,
                      pct:Math.max(0, Math.min(100, +row[5] || 0)), type:String(row[8] || 'مهمة').trim(),
                      resp:String(row[9] || '').trim(), party:String(row[10] || '').trim() });
        }
        if (!rows.length){ toast(t('لا صفوفَ في الملف')); return; }
        /* الإنجازُ المكتوبُ في الملف للآباء يُهمَل — يُجمَّع من الأبناء */
        STATE.wbs = { rows:rows, keys:keys };
        if (wbsSave()){ logEvent('استيرادُ جدول المتابعة — ' + rows.length + ' بندًا'); toast(nm(rows.length) + ' ' + t('بندًا استُورد') + ' \u00b7 ' + nm(keys.length) + ' ' + t('موعدًا حاكمًا')); render(1); }
      } catch (e){ softErr('استيراد جدول المتابعة', e, 'تعذّرت قراءةُ الملف'); }
    };
    fr.readAsArrayBuffer(file);
  });
}
var WBS_F = '', WBS_Q = '', WBS_T = 0, WBS_OPEN = {}, WBS_RESET = 0, WBS_EDIT = '';
/* الجذرُ مفتوحٌ أو مطويّ — والافتراضُ الطيُّ ليُقرأ الجدولُ من فوق */
function wbsShown(id){
  var parts = String(id).split('.');
  for (var i = 1; i < parts.length; i++) if (!WBS_OPEN[parts.slice(0, i).join('.')]) return false;
  return true;
}
/* ═══ التجارب صفحةٌ في «التخطيط» (V17.12) ═══
   التجربةُ تسبق العملَ: يُجرَّب ثم يُقرَّر أيصلح أم لا. فموضعُها مع التخطيط
   لا مع الصرف — وإن كان مصروفُها يظهر في الميزانية ويحكمه مفتاحُها هناك.
   فبقيت الأرقامُ واحدةً في الموضعين: ما يُسجَّل هنا يُحسَب هناك. */
PAGE.trials = { m:'التخطيط', t:'التجارب',
  l:'كلُّ ريالٍ وكلُّ ساعةٍ في التجارب — وقرارُ دخولها في تكاليف المشروع.',
  body:function(){
    return (function(){
      var me = trialMay(), R = trialRows(), inC = trialInCost(), d = trialsDoc();
      var spend = trialsTotal(), hrs = trialsHours(), items = trialsItemsSpend(), buysP = trialsSpend();
      return '<p class="lede" style="margin:0 0 16px">' + esc(t('التجربةُ مصروفٌ ووقتٌ قبل أن تصير عملًا. سجِّل هنا ما اشتُري لها وكم استغرقت، ثم قرِّر بمفتاحٍ واحدٍ أيدخل مصروفُها في تكاليف المشروع أم يبقى مسجَّلًا خارجَها.')) + '</p>'
        + stats([['تجارب', N(R.length)], ['ساعات', N(hrs)],
                 ['أصناف', N(items), 'acc'], ['مشتريات مربوطة', N(buysP)],
                 ['إجماليُّ التجارب', N(spend), 'acc'],
                 ['في تكاليف المشروع', inC ? esc(t('نعم')) : esc(t('لا')), inC ? 'ok' : 'wrn']])
        /* المفتاحُ: قرارٌ يُبدَّل متى شئت ولا يُعاد تسجيلُ شيء */
        + card('', '<label class="sw-row' + (me ? '' : ' is-off') + '">'
            + '<input type="checkbox"' + (inC ? ' checked' : '') + (me ? '' : ' disabled') + ' data-trcost="1">'
            + '<span><b>' + esc(t('احسب مصروف التجارب ضمن تكاليف المشروع')) + '</b>'
            + '<span class="hint" style="display:block;margin:2px 0 0">'
            +   esc(t(inC ? 'المصروفُ داخلٌ الآن في المنصرف المعتمد وفي نسبة استهلاك السقف.'
                          : 'المصروفُ خارجٌ الآن — يُرى في هذا الدفتر ولا يُحسَب على السقف.')) + '</span></span></label>')
        + (me ? card('تجربةٌ جديدة',
            '<div class="grid cols-2">'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('اسم التجربة')) + '</label><input id="trN" dir="auto" placeholder="' + esc(t('ما الذي جُرِّب؟')) + '"></div>'
            + '<div class="field"><label>' + esc(t('التاريخ')) + '</label><input id="trD" type="date" value="' + esc(dayKey()) + '"></div>'
            + '<div class="field"><label>' + esc(t('الساعات')) + '</label><input id="trH" type="number" min="0" step="0.5" inputmode="decimal"></div>'
            /* ما جُرِّب وأين وبأيِّ نتيجة (V17.73): التجربةُ عُدّةٌ في موضعٍ تنتهي بقرار */
            + '<div class="field"><label>' + esc(t('البوابة')) + '</label><input id="trGw" dir="auto" list="trGwL" placeholder="TZone · Milesight">'
            +   '<datalist id="trGwL"><option value="TZone"><option value="Milesight"></datalist></div>'
            + '<div class="field"><label>' + esc(t('عدد البوابات')) + '</label><input id="trGwN" type="number" min="0" step="1" inputmode="numeric"></div>'
            + '<div class="field"><label>' + esc(t('الحساس')) + '</label><input id="trSn" dir="auto" list="trSnL" placeholder="TG08 · EM300">'
            +   '<datalist id="trSnL"><option value="TG08"><option value="EM300"></datalist></div>'
            + '<div class="field"><label>' + esc(t('عدد الحساسات')) + '</label><input id="trSnN" type="number" min="0" step="1" inputmode="numeric"></div>'
            + '<div class="field"><label>' + esc(t('الموضع')) + '</label><input id="trWhere" dir="auto" placeholder="' + esc(t('الوزارة · مخيمٌ قياسي · معرّفُ نقطة')) + '"></div>'
            + '<div class="field"><label>' + esc(t('النتيجة')) + '</label><select id="trOut">'
            +   ['جارية','ناجحة','تحتاج إعادة','لم تنجح'].map(function(o){ return '<option value="' + esc(o) + '">' + esc(t(o)) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('رابطُ التقرير على الدرايف')) + '</label><input id="trRep" dir="ltr" inputmode="url" placeholder="https://drive.google.com/…"></div>'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('ملاحظة')) + '</label><input id="trNote" dir="auto" placeholder="' + esc(t('النتيجةُ أو ما تعلّمناه')) + '"></div>'
            + '</div>', btn('\u{1F9EA} ' + t('سجّل التجربة'),'btn-primary btn-sm',' data-trnew="1"')) : '')
        + (R.length
            ? R.map(function(r){
                var bs = trialBuys(r.id), sp = trialSpend(r.id), its = trialItems(r), isum = itemsSum(r), tot = trialTotal(r);
                return card('', '<div class="wt-row" style="justify-content:space-between">'
                  + '<div style="min-width:0"><strong>' + esc(r.n) + '</strong>'
                  +   '<div class="hint" style="margin:2px 0 0">' + esc(r.date || '') + (r.by ? ' \u00b7 ' + esc(dispName(r.by)) : '') + '</div></div>'
                  + '<div class="wt-row" style="margin:0">' + pill(nm(+r.hours || 0) + ' ' + t('ساعة'), 'acc')
                  +   pill(nm(tot) + ' ' + t('ريال'), tot ? (inC ? 'ok' : 'warn') : 'off') + '</div></div>'
                  + trialKitHtml(r, me)
                  + (r.note ? '<div class="hint" style="margin:6px 0 0">' + esc(r.note) + '</div>' : '')
                  /* أصنافُ التجربة: كلُّ صنفٍ بكميته وسعرِ وحدته وإجماليِّ سطره */
                  + '<div class="hint" style="margin:8px 0 4px;font-weight:700">\u{1F9FE} ' + esc(t('أصناف التجربة'))
                  +   (isum ? ' <span class="num">' + nm(isum) + '</span> ' + esc(t('ريال')) : '') + '</div>'
                  + (its.length
                      ? table(['الصنف','الكمية','سعر الوحدة','الإجمالي', me ? '' : null].filter(function(x){ return x !== null; }),
                          its.map(function(x, ix){
                            var row = [esc(x.n), N(+x.q || 0), N(+x.p || 0), '<b class="num">' + nm((+x.q || 0) * (+x.p || 0)) + '</b>'];
                            if (me) row.push(btn('\u{1F5D1}','btn-quiet btn-sm',' data-tridel="' + esc(r.id) + '|' + ix + '"'));
                            return row;
                          }).concat([[ '<b>' + esc(t('إجمالي الأصناف')) + '</b>', '', '', '<b class="num">' + nm(isum) + '</b>' ].concat(me ? [''] : [])]))
                      : '<p class="hint" style="margin:0 0 6px">' + esc(t('بلا أصناف — أضِف ما اشتُري لها أدناه.')) + '</p>')
                  + (me
                      ? '<div class="grid cols-3" style="gap:6px;margin:6px 0 0">'
                        + '<div class="field" style="margin:0"><label class="mini">' + esc(t('الصنف')) + '</label><input id="itN' + esc(r.id) + '" dir="auto"></div>'
                        + '<div class="field" style="margin:0"><label class="mini">' + esc(t('الكمية')) + '</label><input id="itQ' + esc(r.id) + '" type="number" min="0" step="1" inputmode="numeric" value="1"></div>'
                        + '<div class="field" style="margin:0"><label class="mini">' + esc(t('سعر الوحدة')) + '</label><input id="itP' + esc(r.id) + '" type="number" min="0" step="0.01" inputmode="decimal"></div>'
                        + '</div><div class="actions" style="margin:6px 0 0">'
                        + btn('\u2795 ' + t('أضِف الصنف'),'btn-secondary btn-sm',' data-tritem="' + esc(r.id) + '"') + '</div>'
                      : '')
                  + (bs.length
                      ? '<div class="hint" style="margin:10px 0 4px;font-weight:700">' + esc(t('مشترياتُ هذه التجربة'))
                        +   ' <span class="num">' + nm(sp) + '</span> ' + esc(t('ريال')) + '</div>'
                        + table(['الصنف','المورّد','المبلغ','الحال'], bs.map(function(b){
                            return [esc(b.item), esc(b.sup || ''), N(+b.amt || 0), pill(b.st, b.st === 'معتمد' ? 'ok' : 'warn')]; }))
                      : '<p class="hint" style="margin:8px 0 0">' + esc(t('ولا مشترياتٍ مربوطة — تُربَط من دفتر المشتريات باختيار التجربة.')) + '</p>')
                  + '<div class="alert info" style="margin:8px 0 0"><span><b>' + esc(t('إجمالي التجربة')) + ':</b> <b class="num">' + nm(tot) + '</b> ' + esc(t('ريال'))
                  +   (isum && sp ? ' <span class="hint" style="margin:0">(' + esc(t('أصناف')) + ' ' + nm(isum) + ' + ' + esc(t('مشتريات')) + ' ' + nm(sp) + ')' + '</span>' : '') + '</span></div>'
                  + (me ? '<div class="actions" style="margin:8px 0 0">'
                      + btn('+1 ' + t('ساعة'),'btn-quiet btn-sm',' data-trh="' + esc(r.id) + '|1"')
                      + btn('+0.5','btn-quiet btn-sm',' data-trh="' + esc(r.id) + '|0.5"')
                      + btn('\u2212 0.5','btn-quiet btn-sm',' data-trh="' + esc(r.id) + '|-0.5"')
                      + (tot ? '' : btn('\u{1F5D1} ' + t('حذف'),'btn-quiet btn-sm',' data-trdel="' + esc(r.id) + '"'))
                      + '</div>' : ''));
              }).join('')
            : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا تجاربَ بعد.')) + '</p>'))
        + (d.at ? '<p class="hint" style="margin:6px 0 0">' + esc(t('آخر تحديث')) + ' ' + esc(dispName(d.by || '')) + ' ' + esc(stepAgo(d.at)) + '</p>' : '');
    })();
  }};

PAGE.wbs = { m:'التخطيط', t:'متابعة الخطة التفصيلية', l:'بنودُ المشروع كلُّها — من يعمل عليها ومتى تنتهي وأين وقفت؛ تُحدَّث من المكتب ويراها الجميع.',
  body:function(){
    /* الإطارُ يرسم ترويسةَ الصفحة — كانت تُرسَم هنا ثانيةً فتظهر مرتين */
    var head = may('settings')
      ? card('', '<div class="actions" style="margin:0">'
          + '<label class="btn btn-secondary btn-sm" style="cursor:pointer">\u2B06 ' + esc(t('استيراد من إكسل'))
          + '<input type="file" accept=".xlsx,.xls" data-wbsfile="1" style="display:none"></label>'
          + (wbsRows().length ? btn('\u{1F5D1} ' + t(WBS_RESET ? 'تأكيد المسح — يُمحى الجدولُ كلُّه' : 'امسح الجدول وابدأ من جديد'), WBS_RESET ? 'btn-danger btn-sm' : 'btn-quiet btn-sm', ' data-wbsreset="1"') : '')
          + '</div>') : '';
    var R = wbsRows();
    if (!R.length) return head + card('', '<p class="hint" style="text-align:center;margin:0">'
      + esc(t(may('settings') ? 'لا جدولَ بعد — استورد ملفَ «متابعة مشروع قارئات أفاقي» من الزرِّ أعلاه.' : 'لا جدولَ بعد — يستورده المكتب.')) + '</p>');
    var today = dayKey(Date.now());
    var strip = wbsKeys().length ? '<div class="grid cols-3" style="margin-bottom:10px">' + wbsKeys().map(function(k){
      var left = Math.round((new Date(k.d) - new Date(today)) / 86400000);
      return '<div class="card" style="padding:10px 12px"><div class="hint" style="margin:0">' + esc(k.n) + '</div>'
        + '<div class="num" style="font-size:15px;font-weight:700">' + esc(k.d) + '</div>'
        + '<div>' + (left < 0 ? pill(t('مضى') + ' ' + nm(-left) + ' ' + t('يوم'), 'off') : pill(t('بقي') + ' ' + nm(left) + ' ' + t('يوم'), left <= 14 ? 'warn' : 'ok')) + '</div></div>';
    }).join('') + '</div>' : '';
    var leaves = R.filter(function(r){ return !wbsChildren(r.id).length; });
    var c = { done:0, run:0, todo:0, late:0, ms:0 };
    leaves.forEach(function(r){ var st = wbsStatus(r), tm = wbsTiming(r); if (st === 'مكتملة') c.done++; else if (st === 'قيد التنفيذ') c.run++; else c.todo++; if (tm === 'متأخر') c.late++; if (r.type === 'معلم') c.ms++; });
    var chips = [['','الكل',leaves.length],['late','متأخر',c.late],['run','قيد التنفيذ',c.run],['done','مكتمل',c.done],['todo','لم يبدأ',c.todo],['ms','المعالم',c.ms]];
    var pass = wbsPass;
    /* الأبُ يظهر إن ظهر أحدُ أبنائه أو طابق هو نفسُه */
    var show = {}; R.forEach(function(r){ if (pass(r)){ show[r.id] = 1; var parts = String(r.id).split('.'); for (var i = 1; i < parts.length; i++) show[parts.slice(0, i).join('.')] = 1; } });
    /* البحثُ والمرشِّحُ يفتحان الطريقَ إلى ما طابق؛ وبلا بحثٍ يُطوى ما لم يُفتَح */
    var filtering = !!(WBS_Q || WBS_F);
    var rows = R.filter(function(r){ return show[r.id] && (filtering || wbsShown(r.id)); }).map(function(r){
      var dep = wbsDepth(r.id), kids = wbsChildren(r.id).length, p = wbsPct(r), st = wbsStatus(r), tm = wbsTiming(r), left = wbsLeft(r);
      var op = !!WBS_OPEN[r.id];
      var name = '<div style="padding-inline-start:' + ((dep - 1) * 14) + 'px">'
        + (kids ? '<button type="button" class="btn btn-quiet btn-sm" data-wbstog="' + esc(r.id) + '" style="padding:0 6px;margin-inline-end:4px" aria-label="' + esc(t(op ? 'اطوِ' : 'افتح')) + '">' + (op ? '\u25BE' : '\u25B8') + '</button>' : '')
        /* عددُ الفروع كان رقمًا ملتصقًا باسم البند بين نِسَبٍ وأيامٍ أخرى،
           فيُقرأ جزءًا من الاسم («إدارة المشروع والحوكمة ٣»). صار عمودًا
           قائمًا بذاته له عنوانٌ يقول ما هو (V17.10). */
        + (kids ? '<strong>' : '') + esc(r.n) + (kids ? '</strong>' : '')
        + (r.type === 'معلم' ? ' ' + pill('معلم', 'acc') : '')
        + wtWbsBadge(r.id) + '</div>';
      /* ═══ لا حقلَ مفتوحًا خارج وضع التحرير (V17.17) ═══
         كان إنجازُ البنود الورقيةِ حقلَ رقمٍ مفتوحًا في الجدول لمن يملك
         الضبط — يبدو صفًّا «مفتوحًا» بين صفوفٍ مغلقة بلا سبب، وأخطرُ منه أن
         عجلةَ الفأرة تغيّر قيمةَ حقلِ رقمٍ تحتها وهي تمرّر الصفحة، فتُكتَب
         نسبةٌ لم يقصدها أحدٌ وتُرفَع. صار الإنجازُ يُقرأ في الجدول ويُكتَب
         في وضع التحرير كسائر الحقول — بزرِّ ✎ لا بمرورِ مؤشِّر. */
      var pctTxt = '<span class="num">' + nm(p) + '٪</span>';
      var pctCell = (may('settings') && !kids && wbsAutoPct(r) == null)   /* (V30.2) المقيسُ من النظام لا يُكتَب بيد */
        ? '<input type="number" min="0" max="100" value="' + p + '" data-wbspct="' + esc(r.id) + '" style="width:64px">'
        : pctTxt;
      var tmPill = tm === 'مكتمل' ? pill('مكتمل','ok')
        : (tm === 'متأخر' ? pill('متأخر','bad')
        : (tm === 'تأخّر البدء' ? pill('تأخّر البدء','bad')
        : (tm === 'لم يحن موعده' ? pill('لم يحن موعده','off') : pill('ضمن مدته','warn'))));
      if (WBS_EDIT === r.id && may('settings')){
        /* الحالةُ تُشتقُّ من الإنجاز فلا تُكتَب؛ والنوعُ قائمةٌ تُختار — وكان
           حقلُه يقع تحت عمود «الحالة» لأن الرأسَ بلا عمودِ نوعٍ أصلًا (V17.15) */
        var typeSel = '<select data-wbse="type" style="width:100px">'
          + ['مهمة','معلم'].map(function(x){
              return '<option value="' + esc(x) + '"' + ((r.type || 'مهمة') === x ? ' selected' : '') + '>' + esc(t(x)) + '</option>';
            }).join('') + '</select>';
        return ['<span class="num hint" style="margin:0">' + esc(r.id) + '</span>',
                '<input value="' + esc(r.n) + '" data-wbse="n" dir="auto" style="min-width:200px">',
                kids ? '<span class="num">' + nm(kids) + '</span>' : '<span class="hint">—</span>',
                '<input type="date" value="' + esc(r.s || '') + '" data-wbse="s" style="width:140px">',
                '<input type="date" value="' + esc(r.e || '') + '" data-wbse="e" style="width:140px">',
                pctCell, '<span class="num">' + nm(wbsPlanPct(r)) + '٪</span>', wbsVarPill(wbsVar(r)),   /* (V30.2) */
                pill(st, st === 'مكتملة' ? 'ok' : (st === 'قيد التنفيذ' ? 'warn' : '')),
                typeSel, tmPill,
                '<input value="' + esc(r.resp || '') + '" data-wbse="resp" dir="auto" style="width:130px">',
                '<input value="' + esc(r.party || '') + '" data-wbse="party" dir="auto" style="width:130px">', '', dosBadge(r),
                btn('\u{1F4BE}','btn-primary btn-sm',' data-wbssave="' + esc(r.id) + '" aria-label="' + esc(t('حفظ')) + '"')
                + btn('\u2715','btn-quiet btn-sm',' data-wbscancel="1" aria-label="' + esc(t('إلغاء')) + '"')];
      }
      return ['<span class="num hint" style="margin:0">' + esc(r.id) + '</span>', name,
              kids ? '<span class="num">' + nm(kids) + '</span>' : '<span class="hint">—</span>',
              '<span class="num">' + esc(r.s || '—') + '</span>', '<span class="num">' + esc(r.e || '—') + '</span>',
              pctTxt + (wbsAutoPct(r) != null ? ' <span class="hint" title="' + esc(t('يُقاس من النظام تلقائيًّا')) + '">\u2699</span>' : ''), '<span class="num">' + nm(wbsPlanPct(r)) + '٪</span>', wbsVarPill(wbsVar(r)),   /* (V30.2) */
              pill(st, st === 'مكتملة' ? 'ok' : (st === 'قيد التنفيذ' ? 'warn' : '')),
              r.type === 'معلم' ? pill('معلم','acc') : '<span class="hint">' + esc(t(r.type || 'مهمة')) + '</span>',
              tmPill,
              esc(r.resp || '—'), esc(r.party || '—'),
              left == null || p >= 100 ? '—' : '<span class="num">' + (left < 0 ? '-' : '') + nm(Math.abs(left)) + '</span>',
              dosBadge(r),
              may('settings')
                ? btn('\u270E','btn-quiet btn-sm',' data-wbsedit="' + esc(r.id) + '" aria-label="' + esc(t('تعديل')) + '"')
                  + btn('\u{1F5D1}','btn-quiet btn-sm',' data-wbsdel="' + esc(r.id) + '" aria-label="' + esc(t('حذف')) + '"')
                : ''];
    });
    /* بطاقةُ كلِّ بندٍ رئيسيّ: إنجازُه وشريطُه وما تأخّر منه — تُضغَط فتفتح فرعَه */
    var roots = R.filter(function(r){ return wbsDepth(r.id) === 1; });
    var cards = roots.length ? '<div class="grid cols-3" style="margin:0 0 10px">' + roots.map(function(r){
      var p = wbsPct(r), kids = R.filter(function(x){ return String(x.id).indexOf(r.id + '.') === 0 && !wbsChildren(x.id).length; });
      var late = kids.filter(function(x){ return wbsTiming(x) === 'متأخر'; }).length;
      var done = kids.filter(function(x){ return wbsPct(x) >= 100; }).length;
      var col = late ? '#E05252' : (p >= 100 ? '#3AD6A0' : (p > 0 ? '#E8C34B' : '#9FB0AA'));
      return '<button type="button" class="card" data-wbstog="' + esc(r.id) + '" style="text-align:start;cursor:pointer;padding:10px 12px;border-inline-start:4px solid ' + col + (WBS_OPEN[r.id] ? ';outline:1px solid var(--brand)' : '') + '">'
        + '<div class="hint num" style="margin:0">' + esc(r.id) + '</div>'
        + '<div style="font-weight:700;font-size:13.5px;line-height:1.35">' + esc(r.n) + '</div>'
        + '<div style="height:6px;border-radius:99px;background:rgba(255,255,255,.09);margin:6px 0 4px"><div style="height:100%;width:' + p + '%;border-radius:99px;background:' + col + '"></div></div>'
        + '<div class="hint" style="margin:0"><b class="num">' + nm(p) + '٪</b> \u00b7 ' + nm(done) + '/' + nm(kids.length) + ' ' + esc(t('بند'))
        + (late ? ' \u00b7 <span style="color:#E05252">' + nm(late) + ' ' + esc(t('متأخر')) + '</span>' : '') + '</div></button>';
    }).join('') + '</div>' : '';
    return head + strip + cards
      + stats([['البنود', N(leaves.length)], ['مكتمل', N(c.done), 'ok'], ['قيد التنفيذ', N(c.run), 'wrn'], ['لم يبدأ', N(c.todo)], ['متأخر', N(c.late), c.late ? 'bad' : 'ok'], ['المعالم', N(c.ms), 'acc']])
      + '<div class="chips">' + chips.map(function(x){ return '<button type="button" class="chip' + (WBS_F === x[0] ? ' on' : '') + '" data-wbsf="' + x[0] + '">' + esc(t(x[1])) + ' <span class="num">' + nm(x[2]) + '</span></button>'; }).join('') + '</div>'
      + card('', '<input type="search" data-wbsq value="' + esc(WBS_Q) + '" placeholder="' + esc(t('ابحث بالبند أو المسؤول أو الجهة')) + '" dir="auto">')
      + cardRaw(esc(t('جدول المتابعة')) + ' \u2014 ' + nm(rows.length) + (STATE.wbs && STATE.wbs.by ? ' <span class="hint" style="margin:0;font-weight:400">\u00b7 ' + esc(t('آخر تحديث')) + ' ' + esc(dispName(STATE.wbs.by)) + ' ' + esc(stepAgo(STATE.wbs.at || 0)) + '</span>' : ''),
          table(['#','البند','فروع','البدء','الانتهاء','الإنجاز','المخطّط','الانحراف','الحالة','النوع','الموقف الزمني','المسؤول','الجهة','المتبقي','الملف',''], rows, null, { sticky:true }),   /* (V30.2) */
          btn('\u2B07 ' + t('إكسل — بالمعادلات وتجميع الصفوف'),'btn-primary btn-sm',' data-wbsxl="1" title="' + esc(t('ملفٌّ كملفِّ المتابعة: صيغٌ تُحدِّث نفسَها ومستوياتُ طيٍّ وألوانٌ شرطية')) + '"')
          + btn('\u2B07 ' + t('إكسل — قيمًا فقط'),'btn-secondary btn-sm',' data-xls="wbs"'))
      + '<p class="hint">' + esc(t('الإنجازُ يُكتب للبنود الفرعية، ويُجمَّع للآباء بالمدة. والحالةُ والموقفُ الزمنيُّ يُحسَبان من تاريخ اليوم — لا يُكتبان.')) + '</p>';
  }};
/* ═══ متابعةُ المهام الأسبوعية ═══
   شيتُ «المهام» الذي يُدار به الاجتماعُ مرتين في الأسبوع: مهمةٌ ومسارٌ ووصفٌ
   ومسؤولٌ وحالةٌ وتاريخا رصدٍ واستحقاقٍ ومصدرٌ وآخرُ تحديث. كان إكسلًا بدوالٍّ
   تحسب المتأخرَ والمستحقَّ — فصار صفحتين: المهامُّ نفسُها تُضاف وتُعدَّل
   وتُنهى، ولوحةٌ تحسب ما كانت الدوالُّ تحسبه من تاريخ اليوم لا من خليةٍ. */
var WT_F = '', WT_Q = '', WT_NEW = false, WT_T = 0, WT_RESET = 0;
var WT_ST = ['مكتمل','جاري العمل','قيد الانتظار','متوقف'];
/* ═══ V16.81 — المهامُّ بطاقاتٌ تُقرأ كجملة، ولوحةٌ واحدةٌ للتعديل ═══
   كانت جدولًا من عشرة أعمدة يفتح عشرَ خاناتٍ في السطر عند التعديل، ويعدّله
   مديرُ المشروع وحدَه. صارت البطاقةُ تقول «ماذا — من — متى — أين وقفت»
   بلا ضغطة، وتُضغَط فتفتح لوحةً واحدة: الحالةُ شرائحُ تُضغَط، و«ما الجديد؟»
   يُضاف إلى سجلٍّ باسم كاتبه ووقته لا يمحو ما قبله. ومن يعدّل: المهندسُ فما
   فوق، والوزارةُ — لأن الاجتماعَ معها والمهامَّ مهامُّها أيضًا؛ والقاعدةُ
   تفتح لها وثيقةَ المهام وحدَها. وأدواتُ المكتب (استيرادٌ ومسحٌ) تبقى لمدير
   المشروع، فلا يمسح الجدولَ إلا من يملكه. */
var WT_OPEN = '', WT_TOOLS = false, WT_DONE_OPEN = false, WT_WBS = '';
function wtMay(){ var r = effRole(ROLE); return rankOf(r) >= 90 || r === 'viewer'; }
/* ═══ V16.82 — المهمةُ تُربَط ببند الخطة، والبندُ يقول كم مهمةً تحرّكه ═══
   الخطةُ تقول «ماذا ومتى» والمهامُّ تقول «ما اتُّفق عليه هذا الأسبوع لتحريكها»
   — وكانتا شاشتين لا تعرف إحداهما الأخرى، فيُسأل «إيه علاقة دي بدي؟». صار
   للمهمة حقلُ بندٍ اختياريّ، والبندُ في الخطة يحمل شارةَ مهامه المفتوحة
   (وتحمرُّ بما تأخّر) وتُضغَط فتفتح مهامَّه وحدَها. و«شغلي» يعرض مهامَّ
   الاجتماع التي على اسم صاحب الحساب — فلا يفتش عنها في قائمة الجميع. */
function wtLeaves(){ return wbsRows().filter(function(r){ return !wbsChildren(r.id).length; }); }
function wtWbsName(id){ var r = wbsRows().filter(function(x){ return String(x.id) === String(id); })[0]; return r ? r.n : ''; }
/* مهامُّ البند: ما رُبط به أو بأحد فروعه — مفتوحةً، ومتأخرةً */
function wtForWbs(id){
  var p = String(id || ''); if (!p) return { open:[], late:0 };
  var open = wtRows().filter(function(r){ var w = String(r.wbs || ''); return r.st !== 'مكتمل' && (w === p || w.indexOf(p + '.') === 0); });
  return { open:open, late:open.filter(wtLate).length };
}
function wtWbsBadge(id){
  var x = wtForWbs(id); if (!x.open.length) return '';
  return ' <button type="button" class="pill ' + (x.late ? 'bad' : 'acc') + '" data-wtgo="' + esc(id) + '" title="' + esc(t('مهامُّ الاجتماع لهذا البند')) + '" style="cursor:pointer">'
    + '\u{1F4CB} ' + nm(x.open.length) + (x.late ? ' \u00b7 ' + esc(t('متأخر')) + ' ' + nm(x.late) : '') + '</button>';
}
/* مهامّي من الاجتماع: ما كُتب على اسمي — بالاسم كما يُعرَض أو كما سُجّل */
function wtMine(){
  var me = String(STATE.meta.name || '').trim(), dn = String(dispName(me) || '').trim();
  if (!me) return [];
  return wtRows().filter(function(r){ var w = String(r.who || '').trim(); return r.st !== 'مكتمل' && w && (w === me || w === dn); });
}
/* ═══ V16.83 — وضعُ الاجتماع: المهامُّ واحدةً واحدة، والتقريرُ يقول ما تغيّر ═══
   الاجتماعُ كان يُدار بالتمرير في قائمةٍ طويلة، ومن يعرض يقفز بين المهام
   ويفوته ما تأخّر. صار «اجتماعُ الأسبوع» يمشي على المفتوح مهمةً مهمة —
   المتأخرُ أوّلًا — وفي كلِّ مهمةٍ اللوحةُ نفسُها: الحالةُ تُضغَط و«ما الجديد؟»
   يُكتَب على الهواء، وكلُّ من يفتح الشاشةَ يرى التحديثَ في ثوانٍ. و«إنهاءُ
   الاجتماع» يُصدِر التقريرَ ثم يختم وقتَه — فالتقريرُ التالي يقول ما تغيّر
   منذ هذا الختم، من سجل كلِّ مهمة، لا من الذاكرة. */
var WT_MEET = false, WT_MI = 0, WT_MEND = 0;
function wtMeetList(){ var G = wtGroups(wtRows()); return G.late.concat(G.week, G.later, G.none); }
function wtFieldTxt(e){
  if (e.f === 'due') return (e.from && e.to && e.to > e.from ? t('تأجيل الموعد') : t('الموعد')) + ': ' + (e.from || '\u2014') + ' \u2190 ' + (e.to || '\u2014');
  return t(WT_LOGF[e.f] || e.f) + ': ' + (e.from || '\u2014') + ' \u2190 ' + (e.to || '\u2014');
}
function wtSince(){
  var since = (STATE.wtask && STATE.wtask.meetAt) || 0, out = [];
  wtRows().forEach(function(r){
    (Array.isArray(r.log) ? r.log : []).forEach(function(e){
      if ((e.at || 0) <= since) return;
      var what = e.note === 'أُنشئت' ? t('مهمةٌ جديدة') : (e.st ? t('الحالة') + ': ' + t(e.st) : e.f ? wtFieldTxt(e) : String(e.note || ''));
      if (what) out.push({ r:r, e:e, what:what });
    });
  });
  out.sort(function(a, b){ return (b.e.at || 0) - (a.e.at || 0); });
  return { since:since, items:out };
}
function wtMeetStart(){
  if (!wtMay()) return;
  if (!wtMeetList().length){ toast(t('لا مهامَّ مفتوحةً للاجتماع')); return; }
  WT_MEET = true; WT_MI = 0; WT_MEND = 0; WT_OPEN = ''; WT_NEW = false; WT_TAB = 'list';
  logEvent('اجتماعُ الأسبوع — بدأ'); render(1);
}
function wtMeetEnd(){
  if (!WT_MEET) return;
  var n = wtSince().items.length;
  try { expPdf(['wtmeet'].filter(expAllowed)); } catch (e){ LS_ERR = e; }
  STATE.wtask = STATE.wtask || { rows:[] };
  STATE.wtask.meetAt = Date.now(); STATE.wtask.meetBy = STATE.meta.name || '';
  if (wtSave()){ logEvent('اجتماعُ الأسبوع — خُتم: ' + n + ' تغييرًا'); toast(t('خُتم الاجتماع') + ' \u00b7 ' + nm(n) + ' ' + t('تغييرًا')); }
  WT_MEET = false; WT_MI = 0; WT_MEND = 0; render(1);
}
/* لوحةُ المهمة من الداخل — تُستعمل في اللوحة المنزلقة وفي وضع الاجتماع سواء */
function wtPanelInner(r, me){
  var log = Array.isArray(r.log) ? r.log : [];
  var stRow = '<div class="chips" style="margin:0">' + WT_ST.map(function(x){
    var on = r.st === x;
    return me
      ? '<button type="button" class="chip' + (on ? ' on' : '') + '" data-wtstat="' + esc(r.id) + '|' + esc(x) + '">' + esc(t(x)) + '</button>'
      : (on ? pill(x, x === 'مكتمل' ? 'ok' : (x === 'جاري العمل' ? 'warn' : '')) : '');
  }).join('') + '</div>';
  var info = '<div class="pop-rows">'
    + '<div><span class="k">' + esc(t('المسؤول')) + '</span><span>' + wtAv(r.who) + ' ' + esc(r.who || t('بلا مسؤول')) + '</span></div>'
    + '<div><span class="k">' + esc(t('الاستحقاق')) + '</span><span>' + wtWhen(r) + (r.due ? ' <span class="num hint" style="margin:0">' + esc(r.due) + '</span>' : '') + '</span></div>'
    + (r.track ? '<div><span class="k">' + esc(t('المسار')) + '</span><span>' + esc(r.track) + (r.code && r.code !== r.track ? ' <span class="num hint" style="margin:0">' + esc(r.code) + '</span>' : '') + '</span></div>' : '')
    + (r.d ? '<div><span class="k">' + esc(t('الوصف')) + '</span><span>' + esc(r.d) + '</span></div>' : '')
    + (r.wbs ? '<div><span class="k">' + esc(t('بند الخطة')) + '</span><span><span class="num">' + esc(r.wbs) + '</span> ' + esc(wtWbsName(r.wbs)) + '</span></div>' : '')
    + '</div>';
  var note = me
    ? '<div class="field" style="margin-top:10px"><label>' + esc(t('ما الجديد؟')) + '</label>'
      + '<div style="display:flex;gap:6px"><input id="wtNote" dir="auto" placeholder="' + esc(t('سطرٌ واحد يقوله من يفتح المهمة بعدك')) + '" style="flex:1">'
      + btn('\u2795 ' + t('أضِف'),'btn-primary btn-sm',' data-wtnoteadd="' + esc(r.id) + '"') + '</div></div>'
    : '';
  var hist = log.length
    ? '<div class="hint" style="margin:10px 0 4px;font-weight:700">' + esc(t('السجل')) + '</div><div class="wt-log">' + log.slice(0, 8).map(function(e){
        return '<div class="wt-le"><span class="hint num" style="margin:0">' + esc(stepAgo(e.at || 0)) + '</span> <b>' + esc(dispName(e.by || '')) + '</b>'
          + (e.st ? ' ' + pill(e.st, e.st === 'مكتمل' ? 'ok' : (e.st === 'جاري العمل' ? 'warn' : '')) : '')
          + (e.note ? ' <span>' + esc(e.note) + '</span>' : '') + '</div>';
      }).join('') + '</div>'
    : (r.upd ? '<div class="hint" style="margin-top:8px">\u{1F4AC} ' + esc(r.upd) + '</div>' : '');
  return stRow + info + note + hist;
}
function wtMeetHtml(me){
  var L = wtMeetList();
  if (!L.length){ WT_MEET = false; return ''; }
  if (WT_MI >= L.length) WT_MI = L.length - 1;
  var r = L[WT_MI], late = wtLate(r), col = late ? '#E05252' : (WT_STC[r.st] || '#9FB0AA');
  var S = wtSince();
  return card('', '<div class="wt-row" style="justify-content:space-between">'
      + '<div><b>\u{1F5E3} ' + esc(t('اجتماع الأسبوع')) + '</b> <span class="num hint" style="margin:0">' + nm(WT_MI + 1) + ' ' + esc(t('من')) + ' ' + nm(L.length) + '</span>'
      +   ' <span class="hint" style="margin:0">\u00b7 ' + esc(t('منذ الاجتماع الماضي')) + ' <span class="num">' + nm(S.items.length) + '</span> ' + esc(t('تغييرًا')) + '</span></div>'
      + '<div class="actions" style="margin:0">'
      +   btn('\u2039 ' + t('السابق'),'btn-secondary btn-sm',' data-wtmeetprev="1"' + (WT_MI ? '' : ' disabled'))
      +   btn(t('التالي') + ' \u203A','btn-secondary btn-sm',' data-wtmeetnext="1"' + (WT_MI < L.length - 1 ? '' : ' disabled'))
      +   btn(WT_MEND ? '\u2705 ' + t('تأكيد الإنهاء — يُصدَر التقريرُ ويُختم') : '\u23F9 ' + t('إنهاء الاجتماع'), WT_MEND ? 'btn-primary btn-sm' : 'btn-quiet btn-sm', ' data-wtmeetend="1"')
      /* خروجٌ بلا ختم: يبقى كلُّ ما حُدِّث، ولا تقريرَ ولا تاريخَ اجتماع */
      +   btn('\u2715 ' + t('خروج بلا ختم'),'btn-quiet btn-sm',' data-wtmeetexit="1" title="' + esc(t('يبقى كلُّ ما حُدِّث — بلا تقريرٍ ولا ختم')) + '"')
      + '</div></div>')
    + '<div class="card wt-meet" style="border-inline-start:4px solid ' + col + '">'
    +   '<div class="wt-row"><span class="num hint" style="margin:0">#' + esc(r.id) + '</span><strong class="wt-n" style="font-size:16px">' + esc(r.n) + '</strong>' + wtWhen(r) + '</div>'
    +   wtPanelInner(r, me)
    + '</div>'
    + '<div class="chips" style="margin-top:8px">' + L.map(function(x, i){
        return '<button type="button" class="chip' + (i === WT_MI ? ' on' : '') + '" data-wtmeetgo="' + i + '" title="' + esc(x.n) + '" style="' + (wtLate(x) ? 'border-color:#E05252' : '') + '">' + nm(i + 1) + '</button>';
      }).join('') + '</div>';
}
var WT_STC = { 'مكتمل':'#3AD6A0', 'جاري العمل':'#E8C34B', 'قيد الانتظار':'#9FB0AA', 'متوقف':'#E05252' };
function wtCardOf(r){
  var late = wtLate(r), col = late ? '#E05252' : (WT_STC[r.st] || '#9FB0AA');
  var last = Array.isArray(r.log) && r.log[0];
  var lastTxt = last ? (esc(dispName(last.by || '')) + ' \u00b7 ' + esc(stepAgo(last.at || 0)) + (last.st ? ' \u00b7 ' + esc(t(last.st)) : '') + (last.note ? ' \u00b7 ' + esc(String(last.note).slice(0, 80)) : ''))
                     : (r.upd ? esc(String(r.upd).slice(0, 80)) : '');
  return '<button type="button" class="card wt-card' + (WT_OPEN === String(r.id) ? ' on' : '') + '" data-wtopen="' + esc(r.id) + '" style="border-inline-start:4px solid ' + col + '">'
    + '<div class="wt-row"><strong class="wt-n">' + esc(r.n) + '</strong>' + wtWhen(r) + '</div>'
    + '<div class="wt-row hint">' + wtAv(r.who) + '<span>' + esc(r.who || t('بلا مسؤول')) + '</span>'
    +   (r.due ? '<span class="num">\u{1F4C5} ' + esc(r.due) + '</span>' : '')
    +   (r.track ? '<span>\u{1F516} ' + esc(r.track) + '</span>' : '')
    +   (r.wbs ? '<span>\u{1F9ED} <span class="num">' + esc(r.wbs) + '</span> ' + esc(String(wtWbsName(r.wbs)).slice(0, 40)) + '</span>' : '')
    +   pill(r.st, r.st === 'مكتمل' ? 'ok' : (r.st === 'جاري العمل' ? 'warn' : (r.st === 'متوقف' ? 'bad' : ''))) + '</div>'
    + (lastTxt ? '<div class="hint wt-last">\u{1F4AC} ' + lastTxt + '</div>' : '')
    + (r.plan ? '<div class="hint wt-last">\u{1F5C2} ' + esc(t('من خطة الأسبوع')) + '</div>' : '')
    + (r.req ? '<div class="hint wt-last" style="color:' + (r.st === 'مكتمل' ? '#27AE60' : '#1C3674') + '">' + (r.st === 'مكتمل' ? '\u2713 ' + esc(t('نُفِّذ طلبُ الوزارة')) : '\u{1F4E8} ' + esc(t('تنفيذُ طلبٍ للوزارة'))) + '</div>' : '')
    + (r.chal ? '<div class="hint wt-last" style="color:' + (r.st === 'مكتمل' ? '#27AE60' : '#C0392B') + '">' + (r.st === 'مكتمل' ? '\u2713 ' + esc(t('تم حلُّ التحدي')) : '\u26A0 ' + esc(t('معالجةُ تحدٍّ')) ) + ': ' + esc(t(String(r.chal).replace(/^[FMT]:/, '').replace(/^C[0-9a-z]+$/, t('تحدٍّ مسجّل')))) + '</div>' : '')
    + '</button>';
}
/* قائمةُ بنود الخطة للاختيار — الأوراقُ وحدَها، بمعرِّفها واسمها */
function wtWbsSelect(cur, attr){
  var L = wtLeaves(); if (!L.length) return '';
  return '<select ' + attr + '><option value="">' + esc(t('— بلا بند —')) + '</option>' + L.map(function(x){
    return '<option value="' + esc(x.id) + '"' + (String(cur || '') === String(x.id) ? ' selected' : '') + '>' + esc(x.id + ' — ' + String(x.n).slice(0, 60)) + '</option>';
  }).join('') + '</select>';
}
function wtRows(){ return (STATE.wtask && Array.isArray(STATE.wtask.rows)) ? STATE.wtask.rows : []; }
function wtRow(id){ return wtRows().filter(function(x){ return String(x.id) === String(id); })[0] || null; }
/* السجلُّ: أحدثُه أوّلًا، عشرون سطرًا للمهمة تكفي اجتماعاتِ موسم */
function wtLogPush(r, e){
  e.at = Date.now(); e.by = STATE.meta.name || '';
  r.log = [e].concat(Array.isArray(r.log) ? r.log : []).slice(0, 20);
}
function wtStatus(id, st){
  var r = wtRow(id); if (!r || WT_ST.indexOf(st) < 0 || r.st === st) return false;
  wtLogPush(r, { st:st }); r.st = st;
  if (st === 'مكتمل') r.doneAt = Date.now();
  if (wtSave()){ logEvent('مهمةٌ أسبوعية — ' + id + ' \u00b7 ' + st, id); toast(t(st)); render(1); return true; }
  return false;
}
function wtNote(id, note){
  var r = wtRow(id); note = String(note || '').trim();
  if (!r) return false;
  if (!note){ toast(t('اكتب ما الجديد أوّلًا')); return false; }
  wtLogPush(r, { note:note }); r.upd = note;
  if (wtSave()){ logEvent('مهمةٌ أسبوعية — ' + id + ' \u00b7 ملاحظة', id); toast(t('أُضيفت إلى سجل المهمة')); render(1); return true; }
  return false;
}
/* «أُنجز هذا الأسبوع» — من وقت الإنجاز لا من وجود الحالة */
function wtDoneWeek(r){
  if (r.st !== 'مكتمل') return false;
  var at = r.doneAt || 0;
  if (!at && Array.isArray(r.log)) r.log.forEach(function(e){ if (!at && e.st === 'مكتمل') at = e.at; });
  return !!at && (Date.now() - at) < 7 * 86400000;
}
/* الاستحقاقُ بكلماتٍ يقرؤها الجديد: «بعد ٣ أيام» لا «2026-09-14» */
function wtWhen(r){
  var d = wtDue(r);
  if (r.st === 'مكتمل') return pill('مكتمل', 'ok');
  if (!r.due) return pill('بلا تاريخ', 'off');
  if (d < 0) return pill(t('تأخّر') + ' ' + nm(-d) + ' ' + t('يوم'), 'bad');
  if (d === 0) return pill('اليوم', 'warn');
  if (d === 1) return pill('غدًا', 'warn');
  return pill(t('بعد') + ' ' + nm(d) + ' ' + t('يوم'), d <= 7 ? 'warn' : 'ok');
}
/* حرفان من اسم المسؤول في دائرة — يُعرَف صاحبُ المهمة بنظرة */
function wtAv(name){
  var w = String(name || '').trim().split(/\s+/).filter(Boolean);
  var ini = w.length ? w.slice(0, 2).map(function(x){ return x.charAt(0); }).join('') : '?';
  return '<span class="wt-av" title="' + esc(name || t('بلا مسؤول')) + '">' + esc(ini) + '</span>';
}
/* المجموعاتُ بترتيب القراءة: ما تأخّر أوّلًا، ثم الأسبوع، ثم الأبعد */
function wtGroups(L){
  var G = { late:[], week:[], later:[], none:[], done:[] };
  L.forEach(function(r){
    var d = wtDue(r);
    if (r.st === 'مكتمل') G.done.push(r);
    else if (!r.due) G.none.push(r);
    else if (d < 0) G.late.push(r);
    else if (d <= 7) G.week.push(r);
    else G.later.push(r);
  });
  G.done.sort(function(a, b){ return (b.doneAt || 0) - (a.doneAt || 0); });
  return G;
}
/* أسماءُ المسؤولين للاقتراح: ما سُمّي قبلُ في المهام، ومن يُرى من الحسابات */
function wtWhoList(){
  var seen = {}, out = [];
  wtRows().forEach(function(r){ var w = String(r.who || '').trim(); if (w && !seen[w]){ seen[w] = 1; out.push(w); } });
  try { (typeof usersList === 'function' ? usersList() : []).forEach(function(u){ var w = dispName(u.name || ''); if (w && !seen[w]){ seen[w] = 1; out.push(w); } }); } catch (e){ LS_ERR = e; }
  return out;
}
function wtSave(){
  if (!wtMay()){ toast(t('المهامُّ الأسبوعية للمهندس والوزارة فما فوق')); return false; }
  STATE.wtask = STATE.wtask || { rows:[] };
  STATE.wtask.at = Date.now(); STATE.wtask.by = STATE.meta.name || '';
  CORE.set('cfg', 'wtask', { rows:STATE.wtask.rows, at:STATE.wtask.at, by:STATE.wtask.by, meetAt:STATE.wtask.meetAt || 0, meetBy:STATE.wtask.meetBy || '' });
  CORE.saveSoon(); return true;
}
function wtDue(r){
  if (!r.due || r.st === 'مكتمل') return null;
  return Math.round((new Date(r.due) - new Date(dayKey(Date.now()))) / 86400000);
}
function wtLate(r){ var d = wtDue(r); return d != null && d < 0; }
function wtAdd(o){
  if (!wtMay()){ toast(t('المهامُّ الأسبوعية للمهندس والوزارة فما فوق')); return false; }
  if (!o.n){ toast(t('اسمُ المهمة مطلوب')); return false; }
  STATE.wtask = STATE.wtask || { rows:[] };
  var mx = wtRows().reduce(function(a, x){ return Math.max(a, +x.id || 0); }, 0);
  STATE.wtask.rows.push({ id:mx + 1, n:o.n, track:o.track || '', code:o.code || '', d:o.d || '',
                          who:o.who || '', st:o.st || 'قيد الانتظار', seen:o.seen || dayKey(Date.now()),
                          due:o.due || '', src:o.src || '', upd:o.upd || '', wbs:o.wbs || '', chal:o.chal || '', req:o.req || '', plan:o.plan || '',
                          log:[{ at:Date.now(), by:STATE.meta.name || '', note:'أُنشئت' }] });
  STATE.wtask.lastId = mx + 1;   /* (V20.5) رقمُ المهمة الجديدة — لربطها بتحدّيها */
  if (wtSave()){ logEvent('مهمةٌ أسبوعية — إضافة: ' + o.n); toast(t('أُضيفت المهمة')); WT_NEW = false; render(1); }
  return true;
}
var WT_LOGF = { due:'الموعد', who:'المسؤول', track:'المسار', n:'الاسم', wbs:'بند الخطة' };
function wtSet(id, patch){
  var r = wtRows().filter(function(x){ return String(x.id) === String(id); })[0]; if (!r) return;
  /* (V20.7) ما يهمُّ الوزارةَ من التعديل يُسجَّل بقيمتيه — التأجيلُ وتغييرُ المسؤول كانا يقعان بصمت */
  Object.keys(patch).forEach(function(k){ if (WT_LOGF[k] && String(r[k] || '') !== String(patch[k] || '')) wtLogPush(r, { f:k, from:String(r[k] || ''), to:String(patch[k] || '') }); });
  Object.keys(patch).forEach(function(k){ r[k] = patch[k]; });
  if (wtSave()){ logEvent('مهمةٌ أسبوعية — ' + id + ' \u00b7 ' + Object.keys(patch).join(','), id); render(1); }
}
function wtRemove(id){
  if (!wtMay()){ toast(t('المهامُّ الأسبوعية للمهندس والوزارة فما فوق')); return; }
  try { mfuTaskGone(wtRow(id)); } catch (e){ LS_ERR = e; }   /* (V20.7) */
  STATE.wtask.rows = wtRows().filter(function(x){ return String(x.id) !== String(id); });
  if (wtSave()){ logEvent('حذفُ مهمةٍ أسبوعية — ' + id, id); toast(t('حُذفت المهمة')); WT_OPEN = ''; render(1); }
}
function wtClear(){
  if (!may('settings')){ toast(t('المهامُّ الأسبوعية للمهندس فما فوق')); return; }
  STATE.wtask = { rows:[] };
  if (wtSave()){ logEvent('مسحُ المهام الأسبوعية'); toast(t('مُسحت المهام')); WT_RESET = 0; render(1); }
}
function wtImport(file){
  if (!may('settings')){ toast(t('المهامُّ الأسبوعية للمهندس فما فوق')); return; }
  xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var fr = new FileReader();
    fr.onload = function(){
      try {
        var wb = XLSX.read(new Uint8Array(fr.result), { type:'array', cellDates:true }), rows = [], id = 0;
        wb.SheetNames.forEach(function(nm){
          var A = XLSX.utils.sheet_to_json(wb.Sheets[nm], { header:1, raw:true }), hdr = -1;
          for (var i = 0; i < A.length; i++){ if (String(A[i][1] || '').trim() === 'المهمة'){ hdr = i; break; } }
          if (hdr < 0) return;
          for (var r = hdr + 1; r < A.length; r++){
            var row = A[r]; if (!row || !row[1]) continue;
            /* الأعمدةُ الثلاثةُ الأخيرةُ من ورقة المكتب تُحفَظ كما هي (V17.19):
               توقّفُ المهمة واجتماعا الأحد والأربعاء — ولولاها لفُقدت في كلِّ
               دورةِ تصديرٍ ورفع. والمحسوبةُ (ل · م · ن) لا تُقرأ: تُعاد بناءً. */
            rows.push({ id:++id, n:String(row[1]).trim(), track:String(row[2] || '').trim(), code:String(row[3] || '').trim(),
                        d:String(row[4] || '').trim(), who:String(row[5] || '').trim(), st:String(row[6] || 'قيد الانتظار').trim(),
                        seen:wbsDate(row[7]), due:wbsDate(row[8]), src:String(row[9] || '').trim(), upd:String(row[10] || '').trim(),
                        stop:String(row[14] || '').trim(), mSun:String(row[15] || '').trim(), mWed:String(row[16] || '').trim() });
          }
        });
        if (!rows.length){ toast(t('لم يُعثَر على عمود «المهمة» في الملف')); return; }
        STATE.wtask = { rows:rows };
        if (wtSave()){ logEvent('استيرادُ المهام الأسبوعية — ' + rows.length); toast(nm(rows.length) + ' ' + t('مهمةً استُوردت')); render(1); }
      } catch (e){ softErr('استيراد المهام', e, 'تعذّرت قراءةُ الملف'); }
    };
    fr.readAsArrayBuffer(file);
  });
}
function wtRemind(){
  if (!may('settings') || typeof notifPush !== 'function') return;
  var c = wtStats(), today = dayKey(Date.now());
  if (!(c.late + c.d0)) return;
  if (lsGet('nsk14.wtRemind') === today) return;
  lsSet('nsk14.wtRemind', today);
  notifPush('مهام الاجتماع', (c.late ? nm(c.late) + ' ' + t('متأخرة') : '') + (c.late && c.d0 ? ' \u00b7 ' : '') + (c.d0 ? nm(c.d0) + ' ' + t('مستحقة اليوم') : ''),
            { lv: c.late ? 'مهم' : 'عادي', to:STATE.meta.name || '' });
}
/* ═══ المرشِّحُ واحدٌ للشاشة وللورقة ═══
   كانت الورقةُ تُبنى من كلِّ الصفوف مهما رُشِّحت الشاشة: يرى المستخدمُ سبعةَ
   عشرَ ويُصدِّر اثنين وأربعين، فيرسلها إلى الوزارة وفيها ما لم يقصده. صار ما
   يُصدَّر هو ما يُرى — وبلا ترشيحٍ يُصدَّر الكلُّ كما كان. */
function wtFiltered(){
  return wtRows().filter(function(r){
    if (WT_TRACK && String(r.track || '').trim() !== WT_TRACK) return false;   /* بالمسار (V17.52) */
    if (WT_WBS){ var w = String(r.wbs || ''); if (!(w === WT_WBS || w.indexOf(WT_WBS + '.') === 0)) return false; }
    if (WT_Q && (r.n + ' ' + (r.who || '') + ' ' + (r.track || '') + ' ' + (r.upd || '') + ' ' + (r.wbs || '')).indexOf(WT_Q) < 0) return false;
    if (WT_F === 'late') return wtLate(r);
    if (WT_F === 'due'){ var d = wtDue(r); return d != null && d >= 0 && d <= 7; }
    if (WT_F === 'run') return r.st === 'جاري العمل';
    if (WT_F === 'wait') return r.st === 'قيد الانتظار';
    if (WT_F === 'done') return r.st === 'مكتمل';
    return true;
  });
}
/* ═══ الترشيحُ بالمسار وحالُ كلِّ مسار (V17.52) ═══
   المهامُّ سبعٌ وأربعون في ستة مسارات، والسؤالُ في كلِّ اجتماع: مسارُ جاهزية
   المواقع — كم فيه وكم تأخّر؟ فكان الجوابُ بالعين على سبعٍ وأربعين بطاقة.
   صار للمسار شريحتُه بعددِه ومتأخّرِه، وحين يُختار تُحسَب شرائحُ الحالة
   داخله وحدَه — فيُقرأ المسارُ بحاله لا الكلُّ بحالته. */
var WT_TRACK = '';
function wtTracks(){
  var R = wtRows(), m = {};
  R.forEach(function(r){
    var k = String(r.track || '').trim(); if (!k) return;
    if (!m[k]) m[k] = { n:0, late:0, done:0, open:0 };
    m[k].n++;
    if (r.st === 'مكتمل') m[k].done++; else { m[k].open++; if (wtLate(r)) m[k].late++; }
  });
  return m;
}
function wtStats(){
  var R = wtRows().filter(function(r){ return !WT_TRACK || String(r.track || '').trim() === WT_TRACK; });
  var today = dayKey(Date.now()), c = { all:R.length, done:0, run:0, wait:0, stop:0, late:0, d0:0, d1:0, week:0, next:0, month:0, none:0 };
  R.forEach(function(r){
    if (r.st === 'مكتمل'){ c.done++; return; }
    if (r.st === 'جاري العمل') c.run++; else if (r.st === 'متوقف') c.stop++; else c.wait++;
    var d = wtDue(r);
    if (d == null){ c.none++; return; }
    if (d < 0) c.late++; else if (d === 0) c.d0++; else if (d === 1) c.d1++; else if (d <= 7) c.week++; else if (d <= 14) c.next++; else if (d <= 31) c.month++;
  });
  return c;
}
var WT_TAB = 'list';
PAGE.wtask = { m:'المتابعة', t:'متابعة المهام الأسبوعية', l:'مهامُّ الاجتماع — كلُّ مهمةٍ بطاقةٌ تقول ماذا ومن ومتى وأين وقفت؛ اضغطها لتحدّث حالتَها أو تكتب ما الجديد. يعدّلها المهندسُ فما فوق والوزارة.',
  body:function(){
    var c = wtStats(), R = wtRows(), me = wtMay();
    /* ── اللوحة: ما كانت الدوالُّ تحسبه — من تاريخ اليوم ── */
    var dash = stats([['إجمالي المهام', N(c.all)], ['مكتملة', N(c.done), 'ok'],
                      ['قيد التنفيذ والانتظار', N(c.run + c.wait), 'wrn'], ['متأخرة', N(c.late), c.late ? 'bad' : 'ok']])
      + card(t('الاستحقاق القريب'), stats([['مستحق اليوم', N(c.d0), c.d0 ? 'wrn' : ''], ['غدًا', N(c.d1)],
                                            ['باقي الأسبوع', N(c.week)], ['الأسبوع القادم', N(c.next)],
                                            ['هذا الشهر', N(c.month)], ['بلا تاريخ', N(c.none), c.none ? 'wrn' : '']]))
      + (function(){
          var by = {}; R.forEach(function(r){ var k = r.track || '—'; by[k] = by[k] || { n:0, d:0, l:0 }; by[k].n++; if (r.st === 'مكتمل') by[k].d++; if (wtLate(r)) by[k].l++; });
          var ks = Object.keys(by).sort(function(a, b){ return by[b].n - by[a].n; });
          return ks.length ? cardFlush(t('حسب المسار'), table(['المسار','المهام','مكتملة','متأخرة','النسبة'],
            ks.map(function(k){ var x = by[k]; return [esc(k), N(x.n), N(x.d), x.l ? '<b class="num" style="color:#E05252">' + nm(x.l) + '</b>' : N(0),
              '<span class="num">' + nm(Math.round(x.d / x.n * 100)) + '٪</span>']; }))) : '';
        })()
      + (function(){
          var by = {}; R.forEach(function(r){ if (r.st === 'مكتمل') return; var k = r.who || '—'; by[k] = by[k] || { n:0, l:0 }; by[k].n++; if (wtLate(r)) by[k].l++; });
          var ks = Object.keys(by).sort(function(a, b){ return by[b].n - by[a].n; });
          return ks.length ? cardFlush(t('المفتوح على كلِّ جهة'), table(['الجهة','مفتوح','متأخر'],
            ks.map(function(k){ return [esc(k), N(by[k].n), by[k].l ? '<b class="num" style="color:#E05252">' + nm(by[k].l) + '</b>' : N(0)]; }))) : '';
        })()
      /* ما تغيّر منذ الاجتماع الماضي — من سجل كلِّ مهمة، لا من الذاكرة */
      + (function(){
          var S = wtSince(), wt = STATE.wtask || {};
          return card(t('ما تغيّر منذ الاجتماع الماضي') + ' — ' + nm(S.items.length)
              + (wt.meetAt ? ' <span class="hint" style="margin:0;font-weight:400">\u00b7 ' + esc(t('خُتم')) + ' ' + esc(stepAgo(wt.meetAt)) + (wt.meetBy ? ' \u00b7 ' + esc(dispName(wt.meetBy)) : '') + '</span>' : ''),
            S.items.length
              ? '<div class="wt-log">' + S.items.slice(0, 15).map(function(x){
                  return '<div class="wt-le"><b>' + esc(x.r.n) + '</b> \u2014 ' + esc(x.what) + ' <span class="hint num" style="margin:0">\u00b7 ' + esc(dispName(x.e.by || '')) + ' \u00b7 ' + esc(stepAgo(x.e.at || 0)) + '</span></div>';
                }).join('') + (S.items.length > 15 ? '<p class="hint" style="margin:6px 0 0">' + esc(t('والباقي في تقرير الاجتماع')) + '</p>' : '') + '</div>'
              : '<p class="hint" style="margin:0">' + esc(t('لا تغييرَ منذ الاجتماع الماضي')) + '</p>');
        })()
      /* عدّادُ الحياة: كم مهمةً مفتوحةً قال أحدٌ فيها شيئًا خلال أسبوع — وكم بلا مسؤولٍ أو تاريخ */
      + (function(){
          var open = R.filter(function(r){ return r.st !== 'مكتمل'; }), live = 0, noWho = 0, noDue = 0;
          open.forEach(function(r){
            var at = (Array.isArray(r.log) && r.log[0] && r.log[0].at) || 0;
            if (at && Date.now() - at < 7 * 86400000) live++;
            if (!String(r.who || '').trim()) noWho++;
            if (!r.due) noDue++;
          });
          return open.length ? stats([['حُدِّثت خلال أسبوع', '<span class="num">' + nm(live) + ' / ' + nm(open.length) + '</span>', live === open.length ? 'ok' : 'wrn'],
                                       ['بلا مسؤول', N(noWho), noWho ? 'bad' : 'ok'], ['بلا تاريخ', N(noDue), noDue ? 'wrn' : 'ok']]) : '';
        })();
    var tabs = '<div class="chips" style="margin-bottom:8px">'
      + '<button type="button" class="chip' + (WT_TAB === 'list' ? ' on' : '') + '" data-wttab="list">\u{1F4CB} ' + esc(t('المهام')) + ' <span class="num">' + nm(c.all) + '</span></button>'
      + '<button type="button" class="chip' + (WT_TAB === 'dash' ? ' on' : '') + '" data-wttab="dash">\u{1F4CA} ' + esc(t('لوحة المهام')) + '</button></div>';
    if (WT_TAB === 'dash') return tabs + dash;
    if (WT_MEET && me) return tabs + wtMeetHtml(me);

    /* ── الشريط: ثلاثةُ أرقامٍ يقرؤها الجديدُ قبل كلِّ شيء ── */
    var doneWk = R.filter(wtDoneWeek).length;
    var strip = stats([['متأخر', N(c.late), c.late ? 'bad' : 'ok'],
                       ['مستحق هذا الأسبوع', N(c.d0 + c.d1 + c.week), (c.d0 + c.d1 + c.week) ? 'wrn' : ''],
                       ['أُنجز هذا الأسبوع', N(doneWk), 'ok']]);

    /* ── الأفعال: «مهمة جديدة» لمن يعدّل، وأدواتُ المكتب مطويّةٌ لمن يملكها ── */
    var acts = (me || may('settings'))
      ? card('', '<div class="actions" style="margin:0">'
          + (me ? btn('\u2795 ' + t('مهمة جديدة'),'btn-primary btn-sm',' data-wtnew="1"') : '')
          + (me && wtMeetList().length ? btn('\u{1F5E3} ' + t('اجتماع الأسبوع'),'btn-secondary btn-sm',' data-wtmeetstart="1"') : '')
          + (may('settings') ? btn('\u{1F4C4} ' + t('محضر الاجتماع'),'btn-secondary btn-sm',' data-wtmeet="1" title="' + esc(t('ما بقي من الاجتماع الماضي · ما استُجدّ · ما اكتمل')) + '"') : '')
          + '</div>'
          /* ═══ دورةُ الورقة ظاهرةٌ دائمًا (V17.18) ═══
             من عدّل الجدولَ خارج النظام يحتاج الرفعَ في اللحظة، لا أن يفتح
             قائمةً مطويةً اسمُها «أدوات المكتب». صدِّر · عدِّل · ارفع — والرفعُ
             يستبدل الجدولَ كلَّه، والمسحُ بجواره بتأكيد. */
          + (may('settings')
              ? '<div class="actions" style="margin:8px 0 0">'
                + btn('\u2B07 ' + t('إكسل — الملف بمعادلاته'),'btn-secondary btn-sm',' data-wtxl="1" title="' + esc(t('ورقةُ المهام ولوحةُ المؤشِّرات — بالمعادلات كما يعمل عليها المكتب')) + '"')
                + '<label class="btn btn-primary btn-sm" style="cursor:pointer">\u2B06 ' + esc(t('ارفع الملف — يستبدل الجدول'))
                + '<input type="file" accept=".xlsx,.xls" data-wtfile="1" style="display:none"></label>'
                + (R.length ? btn('\u{1F5D1} ' + t(WT_RESET ? 'تأكيد المسح' : 'امسح الكل'), WT_RESET ? 'btn-danger btn-sm' : 'btn-quiet btn-sm', ' data-wtreset="1"') : '')
                + btn((WT_TOOLS ? '\u25BE ' : '\u2026 ') + t('المزيد'),'btn-quiet btn-sm',' data-wttools="1"')
                + '</div>'
                + (WT_TOOLS
                    ? '<div class="actions" style="margin:6px 0 0">'
                      + btn('\u2B07 ' + t('إكسل — ورقة العمل'),'btn-quiet btn-sm',' data-xls="wtaskAll"')
                      + btn('\u2B07 ' + t('إكسل — ما تراه الآن'),'btn-quiet btn-sm',' data-xls="wtask"')
                      + btn('\u{1F4C4} ' + t('ما تغيّر منذ الاجتماع الماضي'),'btn-quiet btn-sm',' data-xls="wtsince"')
                      + '</div>' : '')
              : ''))
      : '';

    var whoList = '<datalist id="wtWhoList">' + wtWhoList().map(function(w){ return '<option value="' + esc(w) + '">'; }).join('') + '</datalist>';
    var newForm = (WT_NEW && me)
      ? card(t('مهمة جديدة'),
          '<p class="hint" style="margin:0 0 8px">' + esc(t('المهمةُ سطرٌ واحد: ماذا — من — متى.')) + '</p>'
          + '<div class="grid cols-2">'
          + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('المهمة')) + '</label><input id="wtN" dir="auto" placeholder="' + esc(t('ماذا يُفعَل؟')) + '"></div>'
          + '<div class="field"><label>' + esc(t('المسؤول')) + '</label><input id="wtWho" dir="auto" list="wtWhoList"></div>'
          + '<div class="field"><label>' + esc(t('تاريخ الاستحقاق')) + '</label><input id="wtDue" type="date"></div>'
          + '<div class="field"><label>' + esc(t('المسار')) + '</label><input id="wtTr" dir="auto"></div>'
          + '<div class="field"><label>' + esc(t('الوصف')) + '</label><input id="wtD" dir="auto"></div>'
          + (wtLeaves().length ? '<div class="field" style="grid-column:1/-1"><label>' + esc(t('بند الخطة')) + '</label>' + wtWbsSelect(WT_WBS, 'id="wtWbs"') + '</div>' : '')
          + '</div><div class="actions">' + btn('\u{1F4BE} ' + t('حفظ'),'btn-primary btn-sm',' data-wtnsave="1"') + btn(t('إلغاء'),'btn-quiet btn-sm',' data-wtncancel="1"') + '</div>')
      : '';

    var chips = [['','الكل',c.all],['late','متأخر',c.late],['due','مستحق قريبًا',c.d0 + c.d1 + c.week],
                 ['run','جاري العمل',c.run],['wait','قيد الانتظار',c.wait],['done','مكتمل',c.done]];
    /* شرائحُ المسارات: عددُ مهامِّه ومتأخّرُه — تُشتقُّ من المهامِّ نفسِها */
    var TRK = wtTracks(), tks = Object.keys(TRK).sort(function(a, b){ return TRK[b].n - TRK[a].n; });
    var trkRow = tks.length
      ? '<div class="chips">'
        + '<button type="button" class="chip' + (WT_TRACK ? '' : ' on') + '" data-wttrack="">'
        +   esc(t('كل المسارات')) + ' <span class="num">' + nm(wtRows().length) + '</span></button>'
        + tks.map(function(k){
            var x = TRK[k];
            return '<button type="button" class="chip' + (WT_TRACK === k ? ' on' : '') + '" data-wttrack="' + esc(k) + '">'
              + esc(k) + ' <span class="num">' + nm(x.n) + '</span>'
              + (x.late ? ' <span class="pill bad" style="margin-inline-start:4px">' + nm(x.late) + '</span>' : '')
              + '</button>';
          }).join('')
        + '</div>'
      : '';
    var filt = trkRow
      + (WT_TRACK
          ? '<p class="hint" style="margin:0 0 6px">' + esc(WT_TRACK) + ' \u00b7 '
            + esc(t('مكتمل')) + ' ' + nm(TRK[WT_TRACK] ? TRK[WT_TRACK].done : 0) + ' \u00b7 '
            + esc(t('مفتوح')) + ' ' + nm(TRK[WT_TRACK] ? TRK[WT_TRACK].open : 0) + ' \u00b7 '
            + esc(t('متأخر')) + ' ' + nm(TRK[WT_TRACK] ? TRK[WT_TRACK].late : 0) + '</p>'
          : '')
      + '<div class="chips">' + chips.map(function(x){ return '<button type="button" class="chip' + (WT_F === x[0] ? ' on' : '') + '" data-wtf="' + x[0] + '">' + esc(t(x[1])) + ' <span class="num">' + nm(x[2]) + '</span></button>'; }).join('') + '</div>'
      + card('', '<input type="search" data-wtq value="' + esc(WT_Q) + '" placeholder="' + esc(t('ابحث بالمهمة أو المسؤول أو المسار')) + '" dir="auto">');

    var cardOf = wtCardOf;
    var wbsBar = WT_WBS
      ? card('', '<div class="wt-row"><span>\u{1F9ED} ' + esc(t('بند الخطة')) + ': <span class="num">' + esc(WT_WBS) + '</span> ' + esc(wtWbsName(WT_WBS)) + '</span>'
          + btn('\u2715 ' + t('كل المهام'),'btn-quiet btn-sm',' data-wtwbs=""') + '</div>')
      : '';
    var L = wtFiltered(), G = wtGroups(L);
    var order = [['late','متأخر','bad'], ['week','هذا الأسبوع','warn'], ['later','لاحقًا',''], ['none','بلا تاريخ','off']];
    var groups = order.map(function(g){
      var items = G[g[0]]; if (!items.length) return '';
      return '<div class="wt-group"><div class="wt-gh">' + pill(g[1], g[2]) + ' <span class="num hint" style="margin:0">' + nm(items.length) + '</span></div>'
        + '<div class="grid cols-2 wt-grid">' + items.map(cardOf).join('') + '</div></div>';
    }).join('')
      + (G.done.length
          ? '<div class="wt-group"><button type="button" class="btn btn-quiet btn-sm" data-wtdone="1">' + (WT_DONE_OPEN ? '\u25BE ' : '\u25B8 ') + esc(t('مكتمل')) + ' <span class="num">' + nm(G.done.length) + '</span></button>'
            + (WT_DONE_OPEN ? '<div class="grid cols-2 wt-grid">' + G.done.map(cardOf).join('') + '</div>' : '') + '</div>'
          : '');
    var empty = !R.length
      ? card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t(me ? 'لا مهامَّ بعد — المهمةُ سطرٌ واحد: ماذا — من — متى. أضف الأولى من «مهمة جديدة».' : 'لا مهامَّ بعد — يضيفها المكتب.')) + '</p>')
      : (!L.length ? card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا مهامَّ تطابق الترشيح')) + '</p>') : '');
    var byLine = (STATE.wtask && STATE.wtask.by)
      ? '<p class="hint" style="margin:6px 0 0">' + esc(t('آخر تحديث')) + ' ' + esc(dispName(STATE.wtask.by)) + ' ' + esc(stepAgo(STATE.wtask.at || 0)) + '</p>' : '';

    return tabs + strip + acts + newForm + whoList + wbsBar + filt + empty + groups + byLine;
  }};