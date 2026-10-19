/* ═══ مصدر القيم الواحد ═══
   لا قيمةَ افتراضيةً ولا رماديةً: كلُّ وزنٍ ونقطةٍ وتارجتٍ يبدأ صفرًا
   ويُضبط بيد المهندس. وما يُكتب هنا يقرؤه كلُّ ما بُني فوقه في اللحظة نفسها. */

var CFG_PULLED = false;   /* (V37.61) وصلت إعداداتُ السحابة في هذه الجلسة — شرطُ أيِّ بذرٍ يكتب إليها */
var CFG = {
  /* أوزان الزيارة والفك — مفتاحها «المشعر|النوع» */
  w:  {},
  dw: {},

  /* التارجتات */
  tgtSurvey:0, tgtInsCamp:0, tgtInsCor:0,
  tgtPrepCamp:0, tgtPrepCor:0, tgtAsmCamp:0, tgtAsmCor:0, tgtDis:0,

  /* نقاط النقطة الكاملة ومعاملا الفك — والوزنُ لكلِّ نوعٍ على حدة */
  insCamp:0, insCor:0, disOk:0, disBad:0,
  insType:{},
  nameEn:{},   /* تصحيحُ نقحرةِ اسمٍ بعينه — يُكتَب مرةً ويثبت */

  /* ثوابت النظام */
  ph:0, otRate:0, warranty:0, days:0, hours:0, daysWeek:0,
  /* حارسُ التكلفة (V17.96): ١ = تنبيهُ ميزانية Google Cloud مضبوطٌ (يؤشّره المدير بعد ضبطه — docs/cost-guard.md) */
  budgetAlert:0,
  /* (V30.1) قواعدُ التنبيه بالأيام — تُضبَط من ثوابت النظام لا من الشيفرة (فكرةُ المالك #٢). صفرٌ = القاعدةُ معطَّلة */
  alObsDays:14, alPermitDays:7, alRevisitDays:3, alNoPhotoDays:2, alAssignDays:3, alStaleDays:21,
  /* (V30.3) القوائمُ تُعدَّل من الإعدادات لا من الشيفرة (فكرةُ المالك #٤): كلُّ مفتاحٍ مصفوفةُ نصوص، والفارغةُ تعني القائمةَ الأصلية */
  lists:{},
  /* متوسطُ غرف المخيم لكلِّ مشعرٍ — يُقرأ حين لا يُعَدُّ (V17.71): «منى» ١٢ ما لم يُضبَط */
  avgRooms:{},
  stgCfg:0, stgVal:0, stgIns:0,

  /* المواعيدُ المستهدفة (مللي ثانية) وزمنُ تركيب النقطة بالدقائق */
  dueSurvey:0, dueInstall:0, minCamp:0, minCor:0,
  /* زمنُ تركيبِ كلِّ نوعٍ بالدقائق (V17.14): كانت الكاميراتُ والمحطاتُ
     والبواباتُ والجسورُ تُحسَب بزمن الممرِّ لأن الجدولَ لم يعرف إلا نوعين */
  minType:{},

  /* المال */
  budCap:0, budApp:0, reservePct:0,

  /* الكتالوج — مفتاحها معرّف الصنف */
  itPts:{}, itPrice:{}, itPrep:{}, itAsm:{},

  /* الطواقم — مفتاحها معرّف الطاقم */
  crewSup:{}, crewTech:{}, crewGear:{}, crewRate:{}
};

/* قراءةٌ آمنة: الصفر قيمةٌ صحيحةٌ لا غيابٌ يُستبدل */
function cfgN(v){ var n = parseFloat(v); return isFinite(n) ? n : 0; }
function cfgKey(k){ return (k === undefined || k === null || k === '') ? null : String(k); }
/* ═══ مفتاحُ الوزن بالاسم العربيِّ الخام (V19.0) ═══
   الأوزانُ تُخزَّن بمفتاح «مشعر|تصنيف»، والتصنيفُ كان يُقرأ بلغة الواجهة (catLabel
   → t): فجهازٌ بالإنجليزية يسأل عن «منى|Camps» فلا يجد وزنًا فيحسب النقاطَ صفرًا
   والمستحقَّ صفرًا، ومديرٌ بالإنجليزية يكتب وزنًا بمفتاحٍ إنجليزيٍّ لا يراه غيرُه.
   صار المفتاحُ يُردُّ إلى الاسم العربيِّ الخام عند كلِّ قراءةٍ وكتابةٍ للأوزان —
   فالرقمُ واحدٌ على كلِّ جهازٍ بأيِّ لغة. */
var WKEY_CACHE = { lang:'', n:-1, map:null };
function wKeyNorm(k){
  if (LANG === 'ar' || !k) return k;
  var n = Object.keys(CAT_DEF).length;
  if (WKEY_CACHE.lang !== LANG || WKEY_CACHE.n !== n || !WKEY_CACHE.map){
    var m = {}; Object.keys(CAT_DEF).forEach(function(ty){ var d = CAT_DEF[ty]; if (d && d.l){ m[t(d.l)] = d.l; } });
    WKEY_CACHE = { lang:LANG, n:n, map:m };
  }
  var M = WKEY_CACHE.map, i = k.indexOf('|');
  if (i < 0) return M[k] || k;
  var lab = k.slice(i + 1); return k.slice(0, i) + '|' + (M[lab] || lab);
}
function cfgGet(path, key){
  var k = cfgKey(key), o = CFG[path];
  if (k !== null && (path === 'w' || path === 'dw')){
    k = wKeyNorm(k);
    if (o && o[k] == null){   /* وزنٌ مكتوبٌ بتسميةٍ قديمة (V19.1) */
      var bar = k.indexOf('|'), z = bar < 0 ? '' : k.slice(0, bar + 1), lab = bar < 0 ? k : k.slice(bar + 1), al = W_ALIAS[lab] || [];
      for (var ai = 0; ai < al.length; ai++){ if (o[z + al[ai]] != null) return cfgN(o[z + al[ai]]); }
    }
  }
  if (k === null) return cfgN(o);
  return cfgN(o && o[k]);
}
function cfgSet(path, key, val){
  if (typeof CFG_VER === 'number') CFG_VER++;
  var k = cfgKey(key);
  if (k !== null && (path === 'w' || path === 'dw')) k = wKeyNorm(k);   /* يُكتَب بالمفتاح العربيِّ الخام (V19.0) */
  if (k === null) CFG[path] = cfgN(val);
  else { if (!CFG[path] || typeof CFG[path] !== 'object') CFG[path] = {}; CFG[path][k] = cfgN(val); }
  cfgPushSoon(path);
}

/* ═══ الإعداداتُ الرقميةُ تُرفَع — كانت تبقى على جهاز من كتبها ═══
   الأوزانُ والتارجتاتُ ونقاطُ القطع وثوابتُ النظام كلُّها تُقرأ عند الإقلاع من
   settings/points — ولم يكن شيءٌ يكتبها: cfgSet تُعدِّل الذاكرةَ والمخزنَ
   المحليَّ وتقف. فالمهندسُ يضبط وزنَ الزيارة على جهازه، وكلُّ جهازٍ آخرَ —
   وهاتفُه هو — يحسب النقاطَ بأوزانٍ صفر ولا يشكو. (النسخةُ القديمة V14.01
   كانت تكتبها، وسقط ذلك في إعادة البناء.)

   يُرفَع ما تغيّر لا الوثيقةُ كلُّها: كلُّ مسارٍ لُمس في هذه الجلسة يُكتَب
   بقيمته الحالية بدمجٍ (merge)، فلا يمحو جهازٌ قديمُ الذاكرة ما ضبطه غيرُه في
   مسارٍ لم يلمسه. ويُجمَّع بعد سكونٍ قصيرٍ فلا ترتفع كلُّ نقرةٍ وحدَها.
   ولا يُقيَّد إلا لمن يملك الإعدادات — فالقاعدةُ تردُّ غيرَه. */
var _cfgT = 0, _cfgTouched = {};
function cfgPushSoon(path){
  _cfgTouched[path] = 1;
  if (typeof may !== 'function' || !may('settings')) return;
  if (_cfgT) return;
  _cfgT = setTimeout(function(){ _cfgT = 0; cfgPush(); }, 1200);
}
function cfgPush(){
  var doc = {};
  Object.keys(_cfgTouched).forEach(function(k){ if (k in CFG) doc[k] = CFG[k]; });
  if (!Object.keys(doc).length) return;
  CORE.dirty('cfg', 'points', doc);
}

/* حقلُ تاريخٍ موصولٌ بالمصدر — يُخزَّن رقمًا (مللي ثانية) لأن CFG رقميّة */
function cfgDate(path){
  var v = cfgGet(path);
  return '<input type="date" value="' + (v ? dayKey(v) : '') + '" data-cfgdate="' + path + '">';
}

/* الأسبوعي يُشتقّ من الشهري بأيام العمل — وصفرٌ في الأيام يعني صفرًا لا قسمةً على صفر */
function cfgWk(monthly){
  var d = cfgGet('days'), w = cfgGet('daysWeek');
  return d ? Math.round(cfgN(monthly) * (w / d)) : 0;
}

/* حقلٌ موصولٌ بالمصدر: يكتب فيه عند التحرير فينتشر أثرُه */
function cfgInput(path, key, opt){
  opt = opt || {};
  var v = cfgGet(path, key);
  return '<input type="number" inputmode="' + (opt.dec ? 'decimal' : 'numeric') + '"'
    + ' step="' + (opt.step || (opt.dec ? '0.5' : '1')) + '" min="0"'
    + (opt.max ? ' max="' + opt.max + '"' : '')
    + ' value="' + v + '"'
    + ' data-cfg="' + path + '"'
    + (cfgKey(key) !== null ? ' data-cfgk="' + esc(key) + '"' : '')
    + (opt.style ? ' style="' + opt.style + '"' : '')
    + '>';
}

/* حقلٌ مشتقٌّ لا يُكتب — الأسبوعي من الشهري */
function cfgDerived(v){
  return '<input type="number" value="' + v + '" readonly tabindex="-1"'
    + ' style="background:var(--surface-2);color:var(--ink-soft)">';
}

/* ما يُشتقّ من المصدر — تقرؤه كل الشاشات فلا رقمان يفترقان */
function T(){
  return {
    survey:   cfgGet('tgtSurvey'),
    insCamp:  cfgGet('tgtInsCamp'),  insCor:  cfgGet('tgtInsCor'),
    prepCamp: cfgGet('tgtPrepCamp'), prepCor: cfgGet('tgtPrepCor'),
    asmCamp:  cfgGet('tgtAsmCamp'),  asmCor:  cfgGet('tgtAsmCor'),
    dis:      cfgGet('tgtDis'),
    ins:      cfgGet('tgtInsCamp')  + cfgGet('tgtInsCor'),
    prep:     cfgGet('tgtPrepCamp') + cfgGet('tgtPrepCor'),
    asm:      cfgGet('tgtAsmCamp')  + cfgGet('tgtAsmCor')
  };
}
function K(){
  return {
    ph:cfgGet('ph'), days:cfgGet('days'), hours:cfgGet('hours'), daysWeek:cfgGet('daysWeek'),
    insCamp:cfgGet('insCamp'), insCor:cfgGet('insCor'),
    disOk:cfgGet('disOk'), disBad:cfgGet('disBad'),
    stgCfg:cfgGet('stgCfg'), stgVal:cfgGet('stgVal'), stgIns:cfgGet('stgIns')
  };
}

/* أرقام الكتالوج من المصدر */
function itPts(id){ return cfgGet('itPts', id); }
function itPrice(id){ return cfgGet('itPrice', id); }
function itPrep(id){ return cfgGet('itPrep', id); }
function itAsm(id){ return cfgGet('itAsm', id); }

/* الطواقم من المصدر */
function crewVal(k, f){ return cfgGet('crew' + f, k); }

/* ما لم يُضبط بعدُ — تنبيهٌ يظهر حيث يهمّ */
