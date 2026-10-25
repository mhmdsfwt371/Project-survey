/* ============================================================================
   FILE    : src/03-survey/03-survey-records-05-forms-approvals.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : Field forms that write to the engine, the two approvals, missing survey fields, required-field marking and save blocking.
   DEFINES : cfgList, chalsOf, svReview, minState, minOk, formSite, formPickHtml, reqStar, svNum, svSel, svTxt
   GLOBALS : TK_ST, FORM, SV_EXTRA_KEYS, CH_CAMP, CH_PATH, SV_ACCESS, SV_PHOTOS, SV_FIT, SV_CIVIL, SV_EQUIP … (+9 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
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
var SV_EXTRA_KEYS = ['loc','len_m','wid_m','hgt_m','fit','tents','gates','ctype','tbar','corr_w','kits','jam_pos','power_yn','kits_done',
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

/* حالةُ الوصول أوّلُ سؤالٍ في الميدان: من مُنع من الدخول لا يُسأل عن المقاسات،
   والموقعُ الذي لم يُوصَل إليه يبقى «لم يبدأ» بلا سببٍ إن لم يُسجَّل المنع. */
var SV_ACCESS = ['تم الوصول','منع دخول','غير موجود','يحتاج تصريح'];

/* أسبابُ التبليغ من الميدان — كانت في القديم ستًّا وسقطت. والاختيارُ من
   قائمةٍ يُفرَز به البلاغُ ويُوجَّه: نقصُ العهدة للمخزن، وسؤالُ السيريال
   للورشة، والقرارُ للمكتب. والنصُّ الحرُّ يصل الجميعَ فلا يحلّه أحد. */

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


function svReview(r){
  if (!r) return '';
  if (r.review === 'revisit') return 'revisit';
  if (r.review === 'approved') return 'approved';
  return svDone(r) ? 'pending' : '';
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


function formSite(){
  /* (V38.68) no fallback. It returned the registry's first point (NSK-ARF-CMP-0001, Arafat) whenever no point was chosen —
     so a form opened from the menu showed that camp, and every save landed on it: 15 survey visits by two technicians over
     six days and one installation (Mina 0449's, 21 Oct) were found written there. A form without its point now asks for it. */
  return (FORM.site && siteFind(FORM.site)) || null;
}
/* the card a form shows when no point is chosen: the points assigned to me for this kind of work, each opening its form */
function formPickHtml(kind){
  var me = STATE.meta.name || '', T = STATE.tasks || {}, mine = [];
  Object.keys(T).forEach(function(k){ var x = T[k]; if (!x || x.status === 'معتمد' || x.to !== me) return; if (kind === 'install' ? x.kind === 'install' : x.kind !== 'install') mine.push(x); });
  var rows = mine.slice(0, 40).map(function(x){ var s = siteFind(x.site); if (!s) return ''; return btn((kind === 'install' ? '\u{1F527} ' : '\u{1F50D} ') + siteKey(s) + ' \u00b7 ' + s.name, 'chip', kind === 'install' ? ' data-insform="' + esc(s.id) + '"' : ' data-form="' + esc(s.id) + '"'); }).join('');
  return alertBox('warn', t('لم تُختر نقطة — اختر النقطةَ أوّلًا: من الخريطة (اضغطها ثم «نموذج') + ' ' + t(kind === 'install' ? 'التركيب' : 'المسح') + '»)، ' + t('أو من «مهامي»، أو من القائمة تحت. لا يُحفَظ نموذجٌ بلا نقطته.'))
    + (rows ? card(t('نقاطي المسندة'), '<div class="chips">' + rows + '</div>') : '');
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

