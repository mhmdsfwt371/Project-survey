/* ============================================================================
   FILE    : src/03-survey/03-survey-records-01-labels-colors.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : Human-readable labels for recorded data, texts written about a point, layer colour by approval stage, field names and company names per UI language.
   DEFINES : svTexts, svFieldRows, briefOf, briefStage, briefColor, briefRing, briefMay, briefSet, translitWord, coName, dispName, catLabel, typeLabel, ptsSurvey … (+1 more)
   GLOBALS : SV_LABELS, SV_ORDER, BRIEF_C, BRIEF_STAGE, BRIEF_STAGE_ORDER, NAME_FIX, TRANSLIT
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* ═══ ما سجّله الميدانُ يُقرأ بالعين المجرّدة (V16.89) ═══
   الوزارةُ تقيّم النقطةَ من بطاقتها: لا تفتح نموذجَ المسح ولا تملك زرَّه.
   فتُعرَض حقولُ الزيارة كما كُتبت — ما مُلئ منها فقط — وتحتها الصورُ
   والتحدياتُ والملاحظة. ولا زرَّ في الطبقة إلا الاعتماد: تقنيٌّ للمهندس
   واعتمادُ الوزارة لها — فلا يُعرَض على أحدٍ زرٌّ ليس من شأنه في هذه الشاشة. */
var SV_LABELS = {
  access:'الوصول', mount:'نوع التركيب', loc:'موقع النقطة', power:'مصدر الكهرباء', power_src:'مصدر الطاقة',
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
var SV_ORDER = ['access','mount','loc','power','power_src','power_yn','pdist','p24','power_note',
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

