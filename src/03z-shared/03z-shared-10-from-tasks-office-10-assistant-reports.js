/* ============================================================================
   FILE    : src/03z-shared/03z-shared-10-from-tasks-office-10-assistant-reports.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-10-assistant-reports.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : aqRepStop, aqRepParse, aqRepData, aqRepGroup, aqRepRow, aqRepPrep, aqRepCard
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ (V38.17) تقاريرُ بالكلام — «إكسل/PDF للنقاط اللي …» ═══
   طلبُ المالك: «أكتب الشرط بالكلام فيطلع ملف إكسل للنقاط اللي فيها كذا وكذا، ولو PDF بلوجو أفاقي يبقى حلو» —
   فيصير المساعدُ أداةَ تحليلٍ من بيانات الجهاز نفسِه بلا رجوعٍ للقاعدة ولا نموذجٍ خارجيّ. يعرض ما فهمه شرطًا شرطًا
   قبل الملف، وما لم يفهمه يقوله صراحةً بدل أن يخمّن فيُخرج تقريرًا خاطئًا يُظَنّ صحيحًا. «و» تجمع الشروط، والقيمُ
   المتعدّدةُ للحقل نفسِه (منى أو عرفات) تُقبَل أيًّا منها. */
function aqRepStop(){
  return ['اكسل', 'excel', 'xlsx', 'pdf', 'بي', 'دي', 'اف', 'ملف', 'تقرير', 'قائمه', 'قايمه', 'ليست', 'list', 'طلع', 'طلعلي', 'هات', 'هاتلي', 'اعرض', 'عاوز', 'عايز',
    'محتاج', 'ممكن', 'لو', 'سمحت', 'النقاط', 'النقط', 'نقاط', 'المواقع', 'مواقع', 'اللي', 'الي', 'اللى', 'في', 'فى', 'من', 'على', 'علي', 'مع', 'كل', 'كلها', 'ده',
    'دي', 'دول', 'بتاعه', 'بتاعت', 'فيها', 'ليها', 'لها', 'عليها', 'التي', 'الذي', 'الخاصه', 'الخاص', 'او', 'أو', 'ولا', 'بس', 'اللي', 'لسه', 'كمان', 'برضه', 'يعني', 'وكمان', 'بيها', 'عند', 'اللي', 'لستة', 'لسته', 'ليست'];
}

function aqRepParse(q){
  var n = ' ' + aqNorm(q).replace(/[؟?!,،.:;()«»"']/g, ' ').replace(/\s+/g, ' ') + ' ';
  var used = [], conds = [], add = function(k, label, fn){ conds.push({ k:k, label:label, fn:fn }); };
  var use = function(re){ var m = n.match(new RegExp(re.source, 'g')); if (m){ m.forEach(function(x){ x.trim().split(/\s+/).forEach(function(w){ used.push(w); }); }); return true; } return false; };
  var isRep = /اكسل|excel|xlsx|pdf|بي دي اف|ملف|تقرير|قائمه|قايمه|ليست|\blist\b|طلعلي|هاتلي/.test(n) || /^ *(النقاط|النقط|المواقع|المخيمات|الممرات|الكاميرات|البوابات)\s+(اللي|الي|اللى)/.test(n);
  var fmt = /pdf|بي دي اف/.test(n) ? 'pdf' : (/اكسل|excel|xlsx/.test(n) ? 'xls' : '');
  /* (V38.19) «حسب …» = تحليل: عدٌّ مجمَّعٌ بالبُعد المطلوب مع نسب الزيارة والتركيب والربط والإشارة */
  var GM = [[/حسب\s+(ال)?(مشعر|مشاعر)/, 'zone', 'المشعر'], [/حسب\s+(ال)?(نوع|انواع)/, 'type', 'النوع'], [/حسب\s+(ال)?(شركه|شركات)/, 'co', 'الشركة'],
            [/حسب\s+(ال)?(فني|فنيين|زاير|زائر)/, 'tech', 'الفني'], [/حسب\s+(ال)?(مربع|مربعات)/, 'block', 'المربع'],
            [/حسب\s+(حاله\s+)?(ال)?تركيب/, 'ins', 'حالة التركيب'], [/حسب\s+(حاله\s+)?(ال)?(مسح|زياره)/, 'sv', 'حالة المسح']];
  var group = null; GM.some(function(g){ var m = g[0].exec(n); if (m){ group = { k:g[1], label:g[2] }; m[0].trim().split(/\s+/).forEach(function(w){ used.push(w); }); return true; } return false; });
  if (group){ isRep = true; used.push('حسب', 'تقرير', 'تحليل', 'التركيب', 'تركيب', 'المسح', 'مسح', 'الزيارات', 'زيارات'); }
  /* المكان */
  var zs = {}; (STATE.sites || []).forEach(function(x){ if (x && x.zone) zs[x.zone] = 1; });
  var zones = Object.keys(zs).filter(function(z){ var k = aqNorm(z).replace(/^ال/, ''); return k.length > 2 && n.indexOf(k) > -1 && (used.push(k), used.push('ال' + k), true); });
  if (zones.length) add('zone', zones.join(' أو '), function(x){ return zones.indexOf(x.zone) > -1; });
  var bm = /مربع\s*([0-9a-z]+)/.exec(n);
  if (bm){ used.push('مربع', bm[1]); var bk = bm[1]; add('block', 'مربع ' + bk, function(x){ return new RegExp('مربع\\s*' + bk + '(\\b|\\s|-|$)', 'i').test(aqNorm(x.name || '')); }); }
  /* (V38.53) a station code: «محطة AR1» picks the points whose square is that code (the train station and its gates) */
  var sm = /محط[هة]\s*([a-z]{2}\d)\b/i.exec(n);
  if (sm){ used.push('محطه', sm[1]); var sk = sm[1].toUpperCase(); add('stn', 'محطة ' + sk, function(x){ return String(x.sq || '').toUpperCase() === sk; }); }
  /* النوع */
  /* (V38.43) the owner category (TAX_T: مخيمات · ممرات · محطات قطار · منشأة الجمرات · مسجد نمرة · النورية · …) is a
     condition of its own; its words are then not type words («محطات قطار» must not add the station type) */
  var cats = (typeof TAX_T !== 'undefined' ? TAX_T : []).filter(function(c){ var k = aqNorm(c);
    if (k.split(/\s+/).length === 1 && aqTypes().some(function(p){ return p[1].test(k); })) return false;   /* «مخيمات»/«ممرات» are the type words — not a second condition */
    return k.length > 3 && n.indexOf(k) > -1; });
  if (cats.length){ cats.forEach(function(c){ aqNorm(c).split(/\s+/).forEach(function(w){ used.push(w); used.push('ال' + w); }); }); add('cat', cats.join(' أو '), function(x){ return cats.indexOf(taxOf(x).t) > -1; }); }
  var nT = n; zones.concat(cats).forEach(function(z){ nT = nT.split(aqNorm(z)).join(' '); });
  if (sm) nT = nT.split(sm[0]).join(' ');   /* (V38.53) «محطة AR1» is a station code, not the station type */
  var tys = aqTypes().filter(function(p){ return p[1].test(nT); });
  if (tys.length){ tys.forEach(function(p){ use(new RegExp('[^\\s]*(' + p[1].source + ')[^\\s]*')); }); var tn0 = tys.map(function(p){ return p[0]; }); add('type', tn0.join(' أو '), function(x){ return tn0.indexOf(x.type) > -1; }); }
  var R = function(x){ return STATE.recs[x.id]; }, I = function(x){ return STATE.inss[x.id]; };
  /* (V38.19) النفيُ كلمةٌ مستقلّة: «لم» داخل «المركّبة» (ا-ل-م-ر-ك-ب) كانت تُقرأ «لم ركب» فتنقلب الشرطُ نفيًا */
  var NEG = '\\s(و)?(ما|مش|لم|غير|بدون|من غير|لسه ما|لسه مش)\\s+';   /* و«ومش» */
  /* الوزارة أولًا — «اعتماد» فيها لا يُحسَب على الاعتماد التقني */
  if (/الوزاره|وزاره/.test(n)){
    use(/(بانتظار|منتظره|لسه|اعتمدتها|اعتمدت|معتمده من|ردتها|ردت|مردوده|رفضتها|رفضت)?\s*(اعتماد\s*)?(ال)?وزاره/);
    if (/(بانتظار|منتظره|لسه)/.test(n)){ use(/بانتظار|منتظره|لسه/); add('min', 'بانتظار الوزارة', function(x){ var r = R(x); return !!r && r.minReview === 'pending'; }); }
    else if (/(ردت|مردود|رفض)/.test(n)){ use(/ردتها|ردت|مردوده|مردود|رفضتها|رفضت/); add('min', 'ردّتها الوزارة', function(x){ var r = R(x); return !!r && (r.minReview === 'revisit' || r.minReview === 'rejected'); }); }
    else if (/(اعتمد|معتمد)/.test(n)){ use(/اعتمدتها|اعتمدت|معتمده|معتمد/); add('min', 'اعتمدتها الوزارة', function(x){ var r = R(x); return !!r && r.minReview === 'approved'; }); }
  }
  /* المسح */
  if (new RegExp(NEG + '(اتزار|تزار|اتمسح|تتمسح|زرناها|زيار)').test(n) || /لم تزر|بدون زياره|من غير زياره/.test(n)){
    use(new RegExp(NEG + '[^\\s]*(اتزار|تزار|اتمسح|تتمسح|زرناها|زيار)[^\\s]*')); use(/لم تزر|بدون زياره|من غير زياره/);
    add('sv', 'لم تُزَر', function(x){ return !svVisited(R(x)); });
  } else if (/اتزار|اتمسح|ممسوح|زرناها/.test(n)){ use(/[^\s]*(اتزار|اتمسح|ممسوح|زرناها)[^\s]*/); add('sv', 'زيرت', function(x){ return svVisited(R(x)); }); }
  if (/متعذر|منع دخول|ماوصلناش|ما وصلناش/.test(n)){ use(/[^\s]*متعذر[^\s]*|منع دخول|ماوصلناش|ما وصلناش/); add('svu', 'زيارةٌ متعذّرة', function(x){ var r = R(x); return svVisited(r) && r.access !== 'تم الوصول'; }); }
  if (!/الوزاره|وزاره/.test(n)){
    if (new RegExp(NEG + '(اتعتمد|معتمد)').test(n) || /بانتظار الاعتماد|منتظره اعتماد/.test(n)){ use(new RegExp(NEG + '[^\\s]*(اتعتمد|معتمد)[^\\s]*')); use(/بانتظار الاعتماد|منتظره اعتماد/); add('sva', 'بانتظار الاعتماد التقني', function(x){ var r = R(x); return !!r && svDone(r) && r.review !== 'approved' && r.review !== 'revisit'; }); }
    else if (/(المسح|مسح)\s*معتمد|اعتماد فني|معتمده فني/.test(n)){ use(/(المسح|مسح)\s*معتمد[^\s]*|اعتماد فني|معتمده فني[^\s]*/); add('sva', 'مسحٌ معتمد', function(x){ var r = R(x); return !!r && r.review === 'approved'; }); }
    if (/مردود|مرفوض|اعاده زياره|محتاجه زياره/.test(n)){ use(/[^\s]*مردود[^\s]*|[^\s]*مرفوض[^\s]*|اعاده زياره|محتاجه زياره/); add('svr', 'تحتاج زيارةً أخرى', function(x){ var r = R(x); return !!r && r.review === 'revisit'; }); }
  }
  /* التركيب */
  if (new RegExp(NEG + '(اتركب|مركب|ركب)').test(n)){ use(new RegExp(NEG + '[^\\s]*(اتركب|مركب|ركب)[^\\s]*')); add('ins', 'لم تُركَّب', function(x){ var i = I(x); return !i || i.status !== 'مُركّب'; }); }
  else if (/اتركب|مركب|ركبناها/.test(n)){
    use(/[^\s]*(اتركب|مركب|ركبناها)[^\s]*/);
    if (/تركيب معتمد|التركيب معتمد/.test(n)){ use(/[^\s]*تركيب[^\s]*\s*معتمد[^\s]*/); add('ins', 'تركيبٌ معتمد', function(x){ var i = I(x); return !!i && i.status === 'مُركّب' && !!i.approved; }); }
    else add('ins', 'مُركّبة', function(x){ var i = I(x); return !!i && i.status === 'مُركّب'; });
  }
  /* نظامُ البطاقات */
  var SR = null, sr = function(){ if (!SR){ SR = {}; ((typeof extStatusRows === 'function' && extStatusRows()) || []).forEach(function(r){ SR[r.x.id] = r; }); } return SR; };
  if (/\s(و)?(مش|غير|بدون|من غير)\s+[^\s]*مربوط/.test(n)){ use(/(و)?(مش|غير|بدون|من غير)\s+[^\s]*مربوط[^\s]*/); add('lnk', 'غير مربوطة بنظام البطاقات', function(x){ return !sr()[x.id]; }); }
  else if (/مربوط/.test(n)){ use(/[^\s]*مربوط[^\s]*/); add('lnk', 'مربوطة بنظام البطاقات', function(x){ return !!sr()[x.id]; }); }
  if (/\s(و)?(مش|ما|لا)\s+(بترسل|بتبعت|ترسل|بيبعت)|مقطوع|اوفلاين|offline/.test(n)){ use(/(و)?(مش|ما|لا)\s+(بترسل|بتبعت|ترسل|بيبعت)|[^\s]*مقطوع[^\s]*|اوفلاين|offline/); add('sig', 'لا ترسل', function(x){ var r = sr()[x.id]; return !!r && r.sig === 'off'; }); }
  else if (/بترسل|ترسل|بتبعت|اونلاين|online/.test(n)){ use(/بترسل|ترسل|بتبعت|اونلاين|online/); add('sig', 'ترسل', function(x){ var r = sr()[x.id]; return !!r && r.sig === 'on'; }); }
  if (/(بلا|من غير|مفيش|بدون)\s*قارئ/.test(n)){ use(/(بلا|من غير|مفيش|بدون)\s*قارئ/); add('sig', 'بلا قارئ ظاهر', function(x){ var r = sr()[x.id]; return !!r && r.sig === 'none'; }); }
  var thr = /اشغال[^0-9]*(فوق|اكتر من|اكثر من|اكبر من|اعلي من|تحت|اقل من)\s*(\d{1,3})/.exec(n);
  if (thr){ used.push('اشغال', 'الاشغال', thr[1], thr[2]); thr[1].split(/\s+/).forEach(function(w){ used.push(w); }); var hi = !/تحت|اقل/.test(thr[1]), v0 = +thr[2];
    add('occ', 'الإشغال ' + (hi ? 'فوق ' : 'تحت ') + v0 + '%', function(x){ var r = sr()[x.id]; return !!r && r.ov && r.pct != null && (hi ? r.pct > v0 : r.pct < v0); }); }
  else if (/(بلا|من غير|مفيش|بدون)\s*ارقام/.test(n)){ use(/(بلا|من غير|مفيش|بدون)\s*ارقام/); add('ov', 'بلا أرقام إشغال', function(x){ var r = sr()[x.id]; return !!r && !r.ov; }); }
  else if (/(لها|ليها|فيها)\s*(ارقام|اشغال)/.test(n)){ use(/(لها|ليها|فيها)\s*(ارقام|اشغال)/); add('ov', 'لها أرقام إشغال', function(x){ var r = sr()[x.id]; return !!r && r.ov; }); }
  /* (V38.44) time windows: «اتزارت في آخر 7 ايام» / «اتركبت في آخر 30 يوم» / «زيارتها اقدم من 30 يوم» — on the survey or installation date */
  var tw = /(زيار[^\s]*|اتزار[^\s]*|مسح[^\s]*|تركيب[^\s]*|اتركب[^\s]*)\s*(في\s*)?(اخر|آخر|خلال)\s*(\d{1,3})\s*(يوم|ايام)/.exec(n), to = /(زيار[^\s]*|مسح[^\s]*|تركيب[^\s]*)\s*(اقدم من|من اكتر من|من اكثر من|قبل)\s*(\d{1,3})\s*(يوم|ايام)/.exec(n);
  var twm = tw || to;
  if (twm){
    twm[0].trim().split(/\s+/).forEach(function(w){ used.push(w); });
    var isIns = /تركيب|اتركب/.test(twm[1]), days = +(tw ? tw[4] : to[3]), within = !!tw, lim = Date.now() - days * 86400000;
    add('when', (isIns ? 'التركيب' : 'الزيارة') + ' ' + (within ? 'في آخر ' : 'أقدم من ') + days + ' يوم', function(x){
      var rec = isIns ? I(x) : R(x), at = rec && +(rec.at || rec.briefAt || 0); if (!at) return false; return within ? at >= lim : at < lim; });
  }
  /* موسمُ ١٤٤٧ */
  if (/1447/.test(n)){
    var no47 = /(من غير|بدون|مش|مفيش|ما)\s*(ليها|لها|فيها)?\s*(بيانات)?\s*1447/.test(n); use(/(من غير|بدون|مش|مفيش|ما)?\s*(ليها|لها|فيها)?\s*(بيانات)?\s*1447/);
    add('e47', no47 ? 'بلا بيانات ١٤٤٧' : 'لها بيانات ١٤٤٧', function(x){ return no47 ? !x.ex47 : !!x.ex47; });
  }
  /* (V38.27) «موقع النقطة» — تحت كوبري · مدخل/مخرج نفق · لوحة استرشادية · بدون إطار · على مظلة — من الاختيار الصريح (ومن كلام الزيارات الأقدم) */
  var LM = [[/تحت\s*(ال)?(كوبري|كبري)/, 'bridge', 'تحت كوبري'], [/مدخل\s*(ال)?نفق/, 'tin', 'مدخل نفق'], [/مخرج\s*(ال)?نفق/, 'tout', 'مخرج نفق'],
            [/(لوحه|لوحات)\s*(ال)?(استرشاد|ارشاد)[^\s]*/, 'sign', 'لوحة استرشادية'], [/(بدون|بلا|من غير)\s*(ال)?(اطار|هيكل)[^\s]*(\s*معدني)?/, 'nomount', 'بدون إطار معدني للتثبيت'],
            [/(علي|فوق)\s*(ال)?(مظله|مظلات)/, 'canopy', 'على مظلة']];
  var locHit = LM.filter(function(m){ return m[0].test(n); });
  if (!locHit.length && /(^|\s)(ال)?(نفق|انفاق)(\s|$)/.test(n)) locHit = [[/(ال)?(نفق|انفاق)/, 'tany', 'نفق']];
  if (locHit.length && typeof obsLocTags === 'function'){
    locHit.forEach(function(m){ use(new RegExp('[^\\s]*(' + m[0].source + ')[^\\s]*')); });
    var lk = locHit.map(function(m){ return m[1]; });
    add('loc', locHit.map(function(m){ return m[2]; }).join(' أو '), function(x){ var tg = obsLocTags(x); if (!tg) return false;
      return lk.some(function(k){ return k === 'tany' ? !!(tg.tin || tg.tout || tg.tgen) : !!tg[k]; }); });
  }
  /* التحديات: تحدٍّ بعينه أو أيُّ تحدٍّ */
  var labels = [], seenL = {};
  ['مخيم', 'ممر'].forEach(function(ty){ chalsOf({ type:ty }).forEach(function(c){ if (c && c !== 'لا توجد تحديات' && !seenL[c]){ seenL[c] = 1; labels.push(c); } }); });
  var hitL = locHit.length ? [] : labels.filter(function(c){ var ws = aqNorm(c).split(/[\s—\-]+/).filter(function(w){ return w.length > 3; }); return ws.length && ws.filter(function(w){ return n.indexOf(w) > -1; }).length >= Math.min(2, ws.length); });   /* (V38.27) الموقعُ أوّلًا */
  if (hitL.length){ hitL.forEach(function(c){ aqNorm(c).split(/[\s—\-]+/).forEach(function(w){ used.push(w); }); }); add('chal', hitL.join(' أو '), function(x){ var r = R(x); return !!r && (r.chals || []).some(function(c){ return hitL.indexOf(c) > -1; }); }); }
  else if (!locHit.length && /تحدي|تحديات|معوق|معوقات|عائق|مشكله|مشاكل/.test(n)){ use(/[^\s]*(تحدي|معوق|عائق|مشكله|مشاكل)[^\s]*/); add('chal', 'فيها تحدٍّ', function(x){ var r = R(x); return !!r && (r.chals || []).some(function(c){ return c && c !== 'لا توجد تحديات'; }); }); }
  /* الأشخاص والشركة */
  var pm = /(الفني|فني|المهندس|مهندس)\s+([^\s]{2,})/.exec(n);
  if (pm && aqRepStop().indexOf(pm[2]) < 0){ used.push(pm[1], pm[2]); var pn = pm[2]; add('who', pm[1].replace(/^ال/, '') + ' ' + pn, function(x){ var r = R(x), i = I(x); return [r && r.by, i && i.by].some(function(b){ return b && aqNorm(dispName(b)).indexOf(pn) > -1; }); }); }
  var cm = /(الشركه|شركه)\s+([^\s]{2,})/.exec(n);
  if (cm){ used.push(cm[1], cm[2]); var cn = cm[2]; add('co', 'الشركة ' + cn, function(x){ return aqNorm(x.co || '').indexOf(cn) > -1; }); }
  /* ما لم يُفهَم */
  var stop = aqRepStop(), unknown = n.trim().split(/\s+/).filter(function(w){
    var w2 = w.replace(/^(وال|بال|لل|و|ب|ل)(?=..)/, '');   /* الأطولُ أوّلًا: «للنقاط» ← «نقاط» */
    return w.length > 2 && !/^\d+%?$/.test(w) && stop.indexOf(w) < 0 && stop.indexOf(w2) < 0 && used.indexOf(w) < 0 && used.indexOf(w2) < 0 && used.indexOf('ال' + w2) < 0;
  });
  return { isRep:isRep, fmt:fmt, conds:conds, unknown:unknown, group:group };
}

function aqRepData(q){
  var P = aqRepParse(q), rows = (STATE.sites || []).filter(function(x){
    if (!x) return false;
    var by = {}; P.conds.forEach(function(c){ (by[c.k] = by[c.k] || []).push(c.fn); });
    return Object.keys(by).every(function(k){ return by[k].some(function(f){ return f(x); }); });
  });
  return { P:P, rows:rows };
}

function aqRepGroup(D){
  var g = D.P.group; if (!g) return null;
  aqRepPrep();
  var key = function(x){
    var r = STATE.recs[x.id];
    if (g.k === 'zone') return x.zone || '\u2014';
    if (g.k === 'type') return x.type || '\u2014';
    if (g.k === 'co') return x.co || t('بلا شركة');
    if (g.k === 'tech') return r && r.by ? dispName(r.by) : t('لم تُزَر');
    if (g.k === 'block'){ var m = /مربع\s*([0-9A-Za-z\u0660-\u0669]+)/.exec(x.name || ''); return m ? t('مربع') + ' ' + m[1] : '\u2014'; }
    if (g.k === 'ins') return aqRepRow(x)[6];
    return aqRepRow(x)[5];
  };
  var G = {};
  D.rows.forEach(function(x){
    var k = key(x), o = G[k] = G[k] || { k:k, n:0, sv:0, ins:0, lnk:0, on:0 }, s0 = aqRepRow.sr[x.id], i = STATE.inss[x.id];
    o.n++; if (svVisited(STATE.recs[x.id])) o.sv++; if (i && i.status === 'مُركّب') o.ins++; if (s0) o.lnk++; if (s0 && s0.sig === 'on') o.on++;
  });
  var L = Object.keys(G).map(function(k){ return G[k]; }).sort(function(a, b){ return b.n - a.n; });
  var T0 = L.reduce(function(a, o){ a.n += o.n; a.sv += o.sv; a.ins += o.ins; a.lnk += o.lnk; a.on += o.on; return a; }, { k:t('الإجمالي'), n:0, sv:0, ins:0, lnk:0, on:0 });
  var pc = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  var row = function(o){ return [o.k, o.n, o.sv, pc(o.sv, o.n) + '%', o.ins, pc(o.ins, o.n) + '%', o.lnk, o.on]; };
  return { label:g.label, cols:[g.label, 'النقاط', 'زيرت', 'نسبة الزيارة', 'مُركّبة', 'نسبة التركيب', 'مربوطة', 'ترسل'], rows:L.map(row), total:row(T0) };
}

function aqRepRow(x){
  var r = STATE.recs[x.id], i = STATE.inss[x.id], S = (typeof extStatusRows === 'function' && aqRepRow.sr) || null, s0 = S ? S[x.id] : null;
  var sv = !r ? t('لم تُزَر') : r.access !== 'تم الوصول' ? t('زيارةٌ متعذّرة') : r.review === 'approved' ? t('معتمدة') : r.review === 'revisit' ? t('تحتاج زيارةً أخرى') : t('بانتظار الاعتماد');
  var ins = !i ? t('لم تُركَّب') : i.status === 'مُركّب' ? t('مُركّب') + (i.approved ? ' \u00b7 ' + t('معتمد') : '') : t(i.status || 'مسودّة');
  var mn = !r || !r.minReview ? '' : r.minReview === 'pending' ? t('بانتظار الوزارة') : r.minReview === 'approved' ? t('اعتمدتها الوزارة') : t('ردّتها الوزارة');
  return [x.id, x.name || '', x.zone || '', x.type || '', x.sign || '', sv, ins, mn, s0 ? (s0.code || t('مربوطة')) : '', s0 ? String(s0.ser || '') : '',
          s0 ? (s0.sig === 'on' ? t('ترسل') : s0.sig === 'off' ? t('لا ترسل') : t('بلا قارئ ظاهر')) : '', s0 && s0.ov && s0.pct != null ? s0.pct + '%' : ''];
}

function aqRepPrep(){ aqRepRow.sr = {}; ((typeof extStatusRows === 'function' && extStatusRows()) || []).forEach(function(r){ aqRepRow.sr[r.x.id] = r; }); }

function aqRepCard(q, D){
  var P = D.P;
  aqRepPrep();
  var chips = P.conds.map(function(c){ return '<span class="pill ok" style="margin:2px">' + esc(t(c.label)) + '</span>'; }).join(' ');
  var prev = D.rows.slice(0, 10).map(function(x){ var rw = aqRepRow(x); return '<div class="kk-zl" style="margin:3px 0"><span><bdi>' + esc(x.id) + '</bdi> \u00b7 ' + esc(x.name || '') + '</span><b>' + esc(rw[6]) + '</b></div>'; }).join('');
  var GR = aqRepGroup(D);
  var gtab = GR ? table(GR.cols, GR.rows.slice(0, 15).concat([GR.total]).map(function(r){ return r.map(function(c, ci){ return ci ? '<span class="num">' + esc(String(c)) + '</span>' : esc(String(c)); }); }))
    + (GR.rows.length > 15 ? '<p class="hint" style="margin:4px 0 0">' + esc(t('والباقي في الملف')) + ' (' + nm(GR.rows.length - 15) + ')</p>' : '') : '';
  if (GR) chips += ' <span class="pill" style="margin:2px">' + esc(t('حسب')) + ' ' + esc(t(GR.label)) + '</span>';
  if (!P.conds.length) chips = '<span class="pill" style="margin:2px">' + esc(t('كلُّ النقاط')) + '</span> ' + chips;
  return aqCard(t('تقرير') + ' \u00b7 ' + nm(D.rows.length) + ' ' + t('نقطة'),
    '<div style="margin:0 0 6px">' + esc(t('فهمت:')) + ' ' + chips + '</div>' + gtab
    + (P.unknown.length ? alertBox('warn', t('ما فهمتش') + ': ' + P.unknown.join(' \u00b7 ') + ' \u2014 ' + t('التقرير بالشروط اللي فوق بس')) : '')
    + (GR ? '' : D.rows.length ? prev + (D.rows.length > 10 ? '<p class="hint" style="margin:4px 0 0">' + esc(t('والباقي في الملف')) + ' (' + nm(D.rows.length - 10) + ')</p>' : '')
                     : '<p class="hint" style="margin:0">' + esc(t('لا نقاطَ تنطبق عليها الشروط')) + '</p>')
    + (GR && !D.rows.length ? '<p class="hint" style="margin:0">' + esc(t('لا نقاطَ تنطبق عليها الشروط')) + '</p>' : ''),
    D.rows.length ? '<button type="button" class="btn btn-primary btn-sm" data-aqrep="xls">\u2B07 ' + esc(t('إكسل')) + '</button> <button type="button" class="btn btn-secondary btn-sm" data-aqrep="pdf">\u2B07 PDF</button>' : '');
}
