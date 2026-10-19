/* ============================================================================
   FILE    : src/04-office/04-tasks-office-10-assistant-reports.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Reports by words ('Excel/PDF for the points that…'): parser, data, grouping, card, export; plus the pending-upload window HTML.
   DEFINES : aqRepStop, aqRepParse, aqRepData, aqRepGroup, aqRepCols, aqRepRow, aqRepPrep, aqRepCard, aqRepExport, aqGoTo, aqExamples, assistHomeHtml, assistResHtml, queueHtml … (+1 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
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
  /* النوع */
  var tys = aqTypes().filter(function(p){ return p[1].test(n); });
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
    var r = STATE.recs[x.id], i = STATE.inss[x.id];
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
function aqRepCols(){ return ['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشاخص', 'المسح', 'التركيب', 'الوزارة', 'نظام البطاقات', 'القارئ', 'الإشارة', 'الإشغال']; }
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
function aqRepExport(fmt){
  var q = ASSIST_Q || '', D = aqRepData(q); if (!D.rows.length){ toast(t('لا نقاطَ تنطبق عليها الشروط')); return; }
  aqRepPrep();
  var cond = D.P.conds.map(function(c){ return t(c.label); }).join(' \u00b7 '), cols = aqRepCols().map(function(c){ return t(c); });
  var body = D.rows.map(aqRepRow), GR = aqRepGroup(D);
  logEvent('تقرير بالكلام — ' + q.slice(0, 80) + ' · ' + D.rows.length + ' نقطة · ' + fmt);
  if (fmt === 'xls'){
    xlsSheets((GR ? [[t('التجميع'), [GR.cols.map(function(c){ return t(c); })].concat(GR.rows).concat([GR.total])]] : []).concat([[t('النقاط'), [cols].concat(body)], [t('الشروط'), [[t('الطلب'), q], [t('ما فُهم'), cond], [t('ما لم يُفهَم'), D.P.unknown.join(' \u00b7 ')], [t('العدد'), D.rows.length], [t('الوقت'), fmtDT()], [t('بواسطة'), dispName(STATE.meta.name || '')]]]]),
      'nusuk-report-' + dayKey(Date.now()) + '.xlsx');
    return;
  }
  var css = 'body{font:11.5px/1.55 system-ui,"Segoe UI",Tahoma;margin:18px;color:#111}h1{font-size:19px;margin:0;color:#1F4E79}'
    + '.meta{color:#556;font-size:11px;margin:4px 0 10px}.box{border:1px solid #dfe6ee;border-radius:10px;padding:8px 12px;margin:0 0 10px;background:#f8fbff}'
    + '.pill{display:inline-block;border:1px solid #9cc3e6;border-radius:99px;padding:1px 9px;margin:2px;font-size:11px;background:#eef6ff}'
    + 'table{width:100%;border-collapse:collapse;font-size:10.5px}th{background:#1F4E79;color:#fff;padding:5px 6px;text-align:start;font-weight:600}'
    + 'td{border-bottom:1px solid #dde3ea;padding:4px 6px}tr:nth-child(even) td{background:#f6f9fc}.big{font-size:22px;font-weight:800;color:#12203a}'
    + '.foot{margin-top:10px;color:#889;font-size:10px}@page{size:A4 landscape;margin:12mm}';
  var html = '<div style="display:flex;align-items:center;gap:12px">' + (LOGO ? '<img src="' + LOGO + '" alt="AFAQY" style="height:36px;width:auto">' : '')
    + '<h1>' + esc(t('قارئات أفاقي — تقرير')) + '</h1></div>'
    + '<div class="meta">' + esc(t('حج ١٤٤٨هـ')) + ' \u00b7 ' + esc(fmtDT()) + ' \u00b7 ' + esc(dispName(STATE.meta.name || '')) + '</div>'
    + '<div class="box"><div><b>' + esc(t('الطلب')) + ':</b> ' + esc(q) + '</div><div style="margin-top:4px"><b>' + esc(t('الشروط')) + ':</b> '
    + D.P.conds.map(function(c){ return '<span class="pill">' + esc(t(c.label)) + '</span>'; }).join('') + '</div>'
    + '<div style="margin-top:4px"><span class="big">' + esc(nm(D.rows.length)) + '</span> ' + esc(t('نقطة')) + '</div></div>'
    + (GR ? '<h3 style="margin:10px 0 6px;color:#1F4E79">' + esc(t('التجميع حسب')) + ' ' + esc(t(GR.label)) + '</h3><table><thead><tr>' + GR.cols.map(function(c){ return '<th>' + esc(t(c)) + '</th>'; }).join('') + '</tr></thead><tbody>'
        + GR.rows.concat([GR.total]).map(function(r, ri){ return '<tr' + (ri === GR.rows.length ? ' style="font-weight:700"' : '') + '>' + r.map(function(c){ return '<td>' + esc(String(c)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'
        + '<h3 style="margin:14px 0 6px;color:#1F4E79">' + esc(t('النقاط')) + '</h3>' : '')
    + '<table><thead><tr>' + cols.map(function(c){ return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>'
    + body.slice(0, 1500).map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + esc(String(c == null ? '' : c)) + '</td>'; }).join('') + '</tr>'; }).join('')
    + '</tbody></table>' + (body.length > 1500 ? '<div class="foot">' + esc(t('عُرض ألفٌ وخمسمئة صفٍّ — والإكسلُ فيه الباقي')) + '</div>' : '')
    + '<div class="foot">' + esc(t('من بيانات الجهاز وقتَ الإصدار — قارئات أفاقي للمسح والتركيب'))   /* (V38.18) العلامةُ البيضاء: «أفاقي» لا الاسمُ السابق (V16.92) */ + '</div>';
  var w2 = window.open('', '_blank');
  if (!w2){ toast(t('امنع حجبَ النوافذ لتصدير PDF')); return; }
  w2.document.write('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>' + esc(t('قارئات أفاقي — تقرير')) + '</title><style>' + css + '</style></head><body>' + html + '</body></html>');
  w2.document.close();
  setTimeout(function(){ try { w2.focus(); w2.print(); } catch (e){ softErr('طباعة PDF', e, 'افتح النافذةَ واطبع منها'); } }, 400);
  toast(t('اختر «حفظ كـPDF» من نافذة الطباعة'));
}
function aqGoTo(spec){
  var p = String(spec || '').split('|');
  ASSIST_OPEN = false;
  if (p[0] === 'site' && p[1]){ DETAIL_ID = p[1]; CUR = 'site'; render(); return; }
  if (p[0] === 'page' && p[1]){ if (p[2]) EXT.stF = p[2]; navPush(CUR); goPage(p[1]); render(); }
}
function aqExamples(){
  if (ROLE === 'viewer') return ['كام نقطة اتركبت في منى؟', 'القرّاء اللي مش بترسل', 'المخيم 38/56'];
  return ['كام نقطة اتركبت في منى؟', 'إكسل للممرات في منى اللي تحت كوبري', 'تقرير المخيمات حسب المشعر', 'إكسل للمخيمات في منى اللي اتركبت ومش بترسل', 'PDF للنقاط اللي ليها بيانات 1447 ومش مربوطة', 'القرّاء اللي مش بترسل', 'المخيم 38/56', 'رصيد الراوتر', 'مين متأخر في المهام؟', 'التحديات في منى', 'أعلى إشغال', 'إيه الناقص علشان نجهز؟'];
}
function assistHomeHtml(){
  var fy = assistForYou(), tp = assistTopPages(), pq = ASSIST_PAGE_Q[CUR] || [];
  var base = (ROLE === 'viewer' ? ASSIST_QUICK.filter(function(q){ return !/ممنوع|لاقيه|القارئ/.test(q); }) : ASSIST_QUICK).filter(function(q){ return pq.indexOf(q) < 0; });
  var chips = function(L){ return '<div class="chips" style="margin:0 0 10px">' + L.map(function(q){ return '<button type="button" class="chip" data-assistq="' + esc(q) + '">' + esc(t(q)) + '</button>'; }).join('') + '</div>'; };
  return (fy.length ? '<div class="card" style="margin:0 0 10px"><div class="pid">' + esc(t('لك الآن')) + '</div>' + fy.map(function(x){ return '<button type="button" class="btn btn-quiet btn-block" style="justify-content:flex-start;text-align:start;margin:4px 0"' + x[2] + '>' + x[0] + ' ' + esc(x[1]) + '</button>'; }).join('') + '</div>' : '')
    + '<div class="pid" style="margin:4px 0">\u{1F4CA} ' + esc(t('اسأل عن البيانات')) + '</div>' + chips(aqExamples())   /* (V38.14) */
    + (pq.length ? '<div class="pid" style="margin:4px 0">' + esc(t('في الصفحة دي')) + '</div>' + chips(pq) : '')
    + '<div class="pid" style="margin:4px 0">' + esc(t('الأكثر تكرارًا')) + '</div>' + chips(base)
    + (tp.length ? '<div class="pid" style="margin:4px 0">' + esc(t('صفحاتك')) + '</div><div class="chips" style="margin:0 0 10px">' + tp.map(function(k){ return '<button type="button" class="chip" data-p="' + esc(k) + '" data-assist="0">' + esc(t(PAGE[k].t || k)) + ' \u2190</button>'; }).join('') + '</div>' : '');
}
function assistResHtml(){
  if (ASSIST_Q && String(ASSIST_Q).trim().length < 3){ var q0 = ASSIST_Q; ASSIST_Q = ''; var h0 = assistResHtml(); ASSIST_Q = q0; return h0; }   /* (V37.40) حرفٌ أو حرفان: الصفحةُ الرئيسيةُ لا نتائجُ عشوائية */
  var dq = ASSIST_Q ? aqAnswer(ASSIST_Q) : '';   /* (V38.14) مساعدُ البيانات أوّلًا */
  var answered = !!(ASSIST_Q && (dq || assistIntent(ASSIST_Q) || knownHits(ASSIST_Q).length));   /* (V37.37) بلاغُ المالك: «الحاجات اللي تحت بتشوّش على اللي بدوّر عليه» */
  var results = ASSIST_Q && !answered ? helpSearch(ASSIST_Q, 12) : [], gl = ASSIST_Q && !answered ? glossaryHits(ASSIST_Q) : [];
  if (ASSIST_Q){ assistLog(ASSIST_Q, !!(answered || results.length || gl.length)); }   /* (V37.30) */
  return assistDiagCard(ASSIST_Q)   /* (V37.23) التشخيصُ أوّلًا */
    + dq
    + (!ASSIST_Q
        ? assistHomeHtml()   /* (V37.40) بما يخصّ صاحبَ الجهاز ودورَه وصفحتَه */
        : (gl.map(function(g){ return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid var(--acc, #1A5FA8)"><div class="pid">' + esc(t('المصطلح')) + '</div><h4 style="margin:2px 0 6px">' + esc(t(g.t)) + '</h4><p style="margin:0">' + esc(t(g.d)) + '</p></div>'; }).join('')
          + (results.length
            ? results.map(function(e){
                var steps = HELP_STEPS[e.id];
                return '<div class="card" style="margin:0 0 10px">'
                  + '<div class="pid">' + esc(t(e.m)) + (e.sub ? ' \u00b7 ' + esc(t(e.sub)) : '') + '</div>'
                  + '<h4 style="margin:2px 0 6px">' + esc(t(e.t)) + '</h4>'
                  + (e.l ? '<p class="hint" style="margin:0 0 8px">' + esc(t(e.l)) + '</p>' : '')
                  + (steps
                      ? '<ol style="margin:0 0 10px;padding-inline-start:20px">'
                        + steps.map(function(s){ return '<li>' + esc(t(s)) + '</li>'; }).join('')
                        + '</ol>'
                      : '')
                  + btn(t(e.t) + ' \u2190','btn-primary btn-sm',' data-p="' + e.id + '" data-assist="0"')
                  + '</div>';
              }).join('')
            : (gl.length || answered ? '' : '<p class="hint" style="text-align:center;padding:20px">'   /* (V37.37) التشخيصُ جوابٌ — لا «معنديش نتيجة» تحته */
              + esc(t('معنديش نتيجة قريبة — جرّب كلمة تانية، أو تصفّح القائمة الجانبية.')) + '</p>'
              /* (V38.16) لا طريقَ مسدودًا: صيغُ أسئلة البيانات التي يفهمها، بضغطة */
              + '<div class="pid" style="margin:4px 0">\u{1F4CA} ' + esc(t('جرّب سؤالًا عن البيانات')) + '</div><div class="chips" style="margin:0 0 10px">'
              + aqExamples().map(function(q){ return '<button type="button" class="chip" data-assistq="' + esc(q) + '">' + esc(t(q)) + '</button>'; }).join('') + '</div>'))));
}
function queueHtml(){
  var Q = (STATE.queue || []).slice().sort(function(a,b){ return (b.at||0) - (a.at||0); });
  var by = {};
  Q.forEach(function(x){ by[x.kind] = (by[x.kind] || 0) + 1; });

  return '<div class="pop" id="queuePop" style="width:min(620px,94vw);max-height:88vh;overflow:auto">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">\u{1F4E4} ' + esc(t('بانتظار الرفع')) + ' — ' + nm(Q.length) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">'
    +     esc(t(STATE.meta.online ? 'الشبكةُ متاحة — تُرفَع تلقائيًّا الآن.'
                                 : 'لا شبكة — تُرفَع كاملةً حين تعود، ولا يسقط منها شيء.')) + '</p></div>'
    +   '<div class="actions" style="margin:0">'
    /* الزرُّ هنا أيضًا: من يرى الطابورَ على الخريطة لا يذهب إلى شاشةٍ أخرى ليدفعه */
    +     (Q.length && STATE.meta.online ? btn('\u2191 ' + t('ادفع الآن'),'btn-primary btn-sm',' data-pushnow="1"') : '')
    /* (V38.30) ملفُّ انتظار: يخرج من الجهاز (لنقل العنوان أو جهازٍ لا يرفع) ويُستورَد من المكتب */
    +     ((Q.length || (STATE.stale || []).length) ? btn('\u{1F4E4} ' + t('صدّر ملف انتظار'),'btn-secondary btn-sm',' data-qexport="1"') : '')
    +     (may('settings') ? '<label class="btn btn-quiet btn-sm" style="cursor:pointer">\u{1F4E5} ' + esc(t('استورد ملف انتظار')) + '<input type="file" accept=".json" data-qimport="1" style="display:none"></label>' : '')
    +     '<button type="button" class="btn btn-quiet btn-sm" data-pq="0" aria-label="'
    +       esc(t('إغلاق')) + '">\u2715</button>'
    +   '</div>'
    + '</div>'
    + '<div class="pop-body">'
    + stats([['بانتظار الرفع', N(Q.length), Q.length ? 'wrn' : 'ok']]
            .concat(Object.keys(by).map(function(k){ return [t(Q_LBL[k] || k), N(by[k])]; })))
    + (Q.length ? '' : alertBox('success','لا شيءَ بانتظار الرفع على هذا الجهاز — كلُّ ما سُجِّل هنا وصل.'))
    /* (V38.30) ما تُجوهل بالمهلة يُرى ويُصدَّر — لا يُمحى صامتًا */
    + ((STATE.stale || []).length ? alertBox('warn', t('تُجوهل') + ' ' + nm((STATE.stale || []).length) + ' ' + t('مما كان ينتظر الرفع لأنه أقدمُ من المهلة') + ' (' + nm(CORE.queueTtlDays()) + ' ' + t('يوم') + ') — ' + t('محفوظٌ على الجهاز: صدّره ليستورده المكتب، أو امحُه')) + '<div class="actions" style="margin:4px 0 8px">' + btn('\u{1F5D1} ' + t('امحُ المتجاهَل'), 'btn-quiet btn-sm', ' data-qstaleclear="1"') + '</div>' : '')
    + (Q.length ? table(['النوع','السجل','بواسطة','سُجّل'],
        capList(Q, 200).map(function(x){
          var v = x.v || {};
          /* «بواسطة» صاحبُ العمل المسجَّل في السجل نفسه لا حاملُ الجهاز:
             الجهازُ الواحد قد يحمل عملَ أكثرَ من فنيٍّ في يومٍ واحد. */
          var who = v.by || v.user || v.doneBy || v.reopenBy || STATE.meta.name || '\u2014';
          return [pill(t(Q_LBL[x.kind] || x.kind), 'acc'),
                  '<strong>' + esc(String(x.id || '\u2014')) + '</strong>',
                  esc(dispName(who)),
                  '<span class="num">' + esc(fmtDT(x.at || 0)) + '</span>'];
        })) : '')
    + (Q.length > 200
        ? ''
        : '')

    /* ── ما وصل حديثًا: متابعةُ عمل الميدان أوّلًا بأول ──
       طابورُ جهازٍ آخر لا يُرى من هنا — ما لم يُرسَل لم يغادر ذلك الجهاز.
       فالمتابعةُ الممكنةُ هي ما وصل فعلًا: مَن سجّل ماذا ومتى، مرتَّبًا
       بالأحدث، من سجل الأحداث المُزامَن. */
    + (function(){
        var E = (STATE.events || []).slice(0, 40);
        if (!E.length) return '';
        return '<h4 style="margin:18px 0 8px">' + esc(t('وصل حديثًا')) + '</h4>'
          + table(['الحدث','بواسطة','الوقت'],
              E.map(function(x){
                return [esc(x.what || ''), esc(x.by || '\u2014'),
                        '<span class="num">' + esc((x.day||'') + ' ' + (x.at||'')) + '</span>'];
              }))
          + '<p class="hint">' + esc(t('من سجل الأحداث المُزامَن — للتفصيل الكامل والتصفية: «سجل الأحداث».')) + '</p>';
      })()

    + '<p class="hint">' + esc(t('لا شيءَ يُحذَف من الطابور إلا بعد أن يصل فعلًا — والأقدمُ يُرفَع أولًا. وما لم يُرسَل من جهازٍ آخر لا يُرى من هنا: لم يغادره بعد.')) + '</p>'
    + '</div></div>';
}

function helpHtml(){
  /* في صفحةٍ مدموجةٍ تُشرَح الشريحةُ المفتوحةُ لا الأمُّ وحدها */
  var hid = TABS[CUR] ? tabCur(CUR) : CUR;
  var p = pageMeta(hid);
  var h = helpOf(hid);
  if (!h || !p) return '';
  return '<div class="pop" id="helpPop" style="width:min(520px,92vw)">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">' + esc(t(p.t)) + '</h3>'
    +   '<div class="pid" style="margin-top:3px">' + esc(t(p.m)) + (p.sub ? ' \u00b7 ' + esc(t(p.sub)) : '') + '</div></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-help="0" aria-label="'
    +     esc(t('إغلاق')) + '">✕</button>'
    + '</div>'
    + '<div class="pop-body">'
    + '<div class="help-rows">'
    +   '<div><span class="hk">' + esc(t('ماذا تفعل')) + '</span><p>' + esc(t(h.w)) + '</p></div>'
    +   '<div><span class="hk">' + esc(t('من أين تقرأ')) + '</span><p>' + esc(t(h.f)) + '</p></div>'
    +   '<div><span class="hk">' + esc(t('علامَ تُبنى')) + '</span><p>' + esc(t(h.o)) + '</p></div>'
    +   '<div><span class="hk">' + esc(t('متى تكتمل')) + '</span><p>' + esc(t(h.d)) + '</p></div>'
    + '</div></div>'
    + '<div class="actions" style="margin-top:13px">'
    +   btn('📘 ' + t('دليل العمليات'),'btn-secondary btn-sm',' data-p="sop"')
    +   btn('🗺 ' + t('خريطة التغطية'),'btn-secondary btn-sm',' data-p="cover"')
    + '</div></div>';
}

