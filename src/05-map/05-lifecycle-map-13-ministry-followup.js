/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-13-ministry-followup.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Ministry follow-up page: dynamic follow-up, season brief header, 'whose turn' groups, two modes, and the no-challenge camps card.
   DEFINES : mfuPartyRaw, mfuPartyLabel, mfuParties, mfuFetch, mfuData, mfuList, mfuPut, mfuOwnDefOf, mfuOwnerOf, mfuObstacles, svStats, svStats0, jmrConfirm, mfuInstalled … (+35 more)
   GLOBALS : MFU, SUP_EXTRA, SUP_POP, CC_GROUPS, SV_POP, SV_LISTS
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ متابعةُ الوزارة (V20.0) ═══
   العرضُ الأسبوعيُّ الذي كان يُعدُّ يدويًّا للاجتماعات صار صفحةً حيّةً بعناوينه نفسِها:
   حالةُ المهام، والتركيبات، والشركات، والمعوقات وجهاتُها، والتحدياتُ وآلياتُ معالجتها،
   وطلباتُ الوزارة، والمنحنى اليومي، وشاشةُ القاعة. سجلّا التحديات والطلبات وتصنيفُ
   الجهات ولقطاتُ الأسابيع في settings/mfu (يقرؤها كلُّ نشطٍ ويكتبها المكتب). */
var MFU = { at:0, v:null, cosAll:false, edit:'' };   /* (V32.0) وحدةُ المتابعة تملك حالتَها: cosAll/edit/parties/prn/ownDef/flt/f/src/sections */   /* الصفُّ المفتوحُ للتعديل (V21.5) */
MFU.parties = ['شركة الخدمة', 'كدانة', 'أفاقي'];
/* (V26.6) جهاتٌ أخرى يضيفها المكتب من صفحة التحديات والمعوقات (سؤالُ المالك: «لو في حد تاني أضيفه منين؟») — تُحفَظ في
   settings/mfu قسم party فتصل الأجهزةَ كلَّها، وتظهر في قوائم الجهات والبطاقات والتصدير. الثلاثُ الأصليةُ لا تُحذَف. */
/* (V26.8) قرارُ المالك: الجهاتُ كلُّها — الأصليةُ والمضافة — تُعدَّل أسماؤها وتُحذَف. المفتاحُ ثابتٌ (اسمُ الأصلية أو اسمُ
   المضافة عند إنشائها) وهو ما يُحفَظ في «own» والمعوقات، والاسمُ المعروضُ من سجل party {t} ويتغيّر؛ و{gone} يخفي
   الجهةَ (الأصليةَ أيضًا). لا تُحذَف آخرُ جهة، و«↺ الأصلية» يُعيد الثلاثَ كما كانت. */
function mfuPartyRaw(k){ return (mfuData().party || {})[k] || null; }
function mfuPartyLabel(k){ var r = mfuPartyRaw(k); return (r && r.t) ? String(r.t) : String(k); }
function mfuParties(){
  var out = MFU.parties.filter(function(k){ var r = mfuPartyRaw(k); return !(r && r.gone); });
  mfuList('party').forEach(function(x){ if (MFU.parties.indexOf(x.id) < 0 && out.indexOf(x.id) < 0) out.push(x.id); });
  return out;
}
MFU.prn = '';   /* الجهةُ المفتوحةُ لتعديل اسمها */
MFU.ownDef = { 'العارضة الحديدية ناقصة أو غير مكتملة':'كدانة', 'لا يوجد سطح تثبيت':'كدانة', 'المدخل غير واضح — لم يُستدل عليه':'أفاقي', 'تحتاج زيارة أخرى':'أفاقي' };

function mfuData(){ return MFU.v || STATE.mfu || {}; }
function mfuList(sec){
  var o = mfuData()[sec] || {};
  return Object.keys(o).map(function(k){ return Object.assign({ id:k }, o[k]); }).filter(function(x){ return x && !x.gone; }).sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
function mfuPut(sec, id, entry){
  if (!may('settings')){ toast(t('سجلاتُ المتابعة للمهندس فمن فوقه')); return false; }
  MFU.v = MFU.v || STATE.mfu || {}; MFU.v[sec] = MFU.v[sec] || {}; MFU.v[sec][id] = entry; STATE.mfu = MFU.v;
  var w = {}; w[sec] = {}; w[sec][id] = entry; CORE.set('cfg', 'mfu', w);
  return true;
}
/* (V37.3) الفئاتُ الثماني وأسبابُ عدم المسح تأخذ جهةَ صيغتها القديمة افتراضًا — فلا تسقط كلُّها إلى «شركة الخدمة» */
function mfuOwnDefOf(cat){
  if (MFU.ownDef[cat]) return MFU.ownDef[cat];
  var cc = ccList().filter(function(o){ return t(o.n) === cat || o.n === cat; })[0];
  if (cc){ var old = Object.keys(CHAL_FROM).filter(function(o){ return CHAL_FROM[o] === cc.k && MFU.ownDef[o]; })[0]; if (old) return MFU.ownDef[old]; if (cc.k === 'mount') return MFU.ownDef['لا يوجد سطح تثبيت']; }
  return '';
}
function mfuOwnerOf(cat){ var k = (mfuData().own || {})[cat] || mfuOwnDefOf(cat) || 'شركة الخدمة', P = mfuParties(); return P.indexOf(k) > -1 ? k : (P[0] || k); }   /* (V26.8) الجهةُ المحذوفةُ تسقط إلى أوّل جهةٍ قائمة */
/* العائقُ: نقطةٌ لم تُركَّب وفي مسحها تحدٍّ حقيقيّ، أو لم يُوصَل إليها */
function mfuObstacles(){
  /* (V33.7) بلاغُ المالك «صفحةُ متابعة الوزارة بطيئةٌ جدًّا»: كانت تُحسَب في الرسمة الواحدة ثلاثَ مرات (المؤشرات والشركات والقائمة) */
  if (DB.memo && DB.memo.obst) return DB.memo.obst;
  var out = [];
  (STATE.sites || []).forEach(function(x){
    /* (V38.76) the single definition: svObstacle — a challenge (chosen, written, location), a visit that did not reach or was
       returned for another survey («تحتاج زيارة أخرى», V33.0); installed points leave */
    var r = STATE.recs[x.id]; if (!r || !svObstacle(r)) return;
    var cats = chalCatNames(r);   /* (V37.3) الفئاتُ الثماني أو النصُّ الأصليُّ الواضح */
    if (svStuck(r)){ var w0 = visitWhy(r); cats.push(t('لم يُمسح') + ': ' + (w0 ? t(whyOf(w0).n) : t('بلا سبب مسجّل — يصنّفه المهندس'))); }
    else if (!svDone(r) && !cats.length) cats.push(t('تحتاج زيارة أخرى'));
    if (cats.length) out.push({ x:x, cats:cats });
  });
  if (DB.memo) DB.memo.obst = out;
  return out;
}
/* (V29.1) قرارُ المالك: «إحنا حاليًا في المسح الميداني — صفحةٌ مخصوصةٌ للمسح في الباوربوينت: نظرةٌ عامةٌ بالأرقام والنسب،
   وبعدها التفاصيل: المشعر، النوع، اتعمل كام، لسه كام، وفيه كام تحدٍّ في النوع الفلاني للمشعر الفلاني». بتصنيف المالك (taxOf). */
function svStats(){
  var mk = STAT_VER + '|' + (typeof CFG_VER === 'number' ? CFG_VER : 0) + '|' + (STATE.sites || []).length;   /* (V37.23 المرحلة ١) مرةً لكلِّ إصدار */
  if (svStats.c && svStats.c.k === mk) return svStats.c.v;
  var v = svStats0(); svStats.c = { k:mk, v:v }; return v;
}
function svStats0(){
  var by = {}, zs = {}, O = { tot:0, sv:0, reach:0, unreach:0, chal:0 };
  (STATE.sites || []).forEach(function(x){
    var c = taxOf(x), r = STATE.recs[x.id], done = svVisited(r), un = !!(r && r.access && r.access !== 'تم الوصول');   /* (V32.6) */
    var ch = (r && svDone(r)) ? chalCats(r).filter(function(k){ return k !== 'review' && ccOf(k); }).map(function(k){ return ccOf(k).n; }) : [];   /* (V37.3) الفئاتُ الثماني */
    var k = c.g + '|' + c.t, o = by[k] = by[k] || { g:c.g, t:c.t, n:0, sv:0, chal:0, un:0, cats:{} }, z = zs[c.g] = zs[c.g] || { g:c.g, n:0, sv:0, chal:0, un:0 };
    o.n++; z.n++; O.tot++;
    if (done){ o.sv++; z.sv++; O.sv++; }
    if (un){ o.un++; z.un++; O.unreach++; } else if (done) O.reach++;
    if (ch.length){ o.chal++; z.chal++; O.chal++; ch.forEach(function(k2){ o.cats[k2] = (o.cats[k2] || 0) + 1; }); }
  });
  var ord = function(a, b){ var ia = TAX_G.indexOf(a.g), ib = TAX_G.indexOf(b.g); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || b.n - a.n; };
  var pc = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  return { O:O, pct:pc(O.sv, O.tot),
    zones:Object.keys(zs).map(function(k){ return zs[k]; }).sort(ord).map(function(z){ return [z.g, z.n, z.sv, z.n - z.sv, pc(z.sv, z.n) + '٪', z.chal, z.un]; }),
    detail:Object.keys(by).map(function(k){ return by[k]; }).sort(ord).map(function(o){ var top = Object.keys(o.cats).sort(function(a, b){ return o.cats[b] - o.cats[a]; })[0] || '';
      return [o.g, o.t, o.n, o.sv, o.n - o.sv, pc(o.sv, o.n) + '٪', o.chal, top ? chalShow(top) + ' (' + o.cats[top] + ')' : '\u2014']; }) };   /* (V34.0) بمصطلح المالك — يصل الجداولَ والتقارير */
}
/* (V29.2) ملاحظةُ «تحديثات المنصة» #٣: «تأكيدُ نقاط الجمرات حسب المسح الميداني». النقطةُ مؤكَّدةٌ إذا وصلها المسحُ (تم الوصول)،
   وتُعرَض بالأدوار: كم نقطة، وكم أُكِّد، وكم تعذّر، وكم لم يُزر بعد، وكم فيه تحديات. */
function jmrConfirm(){
  var F = {}, tot = { n:0, ok:0, un:0, no:0, ch:0 };
  (STATE.sites || []).forEach(function(x){
    if (!isJmr(x)) return;
    var f = siteFloor(x), k = f == null ? 'بلا دور' : floorName(f), o = F[k] = F[k] || { k:k, i:f == null ? 9 : f, n:0, ok:0, un:0, no:0, ch:0 };
    var r = STATE.recs[x.id], done = svVisited(r), un = !!(r && r.access && r.access !== 'تم الوصول');   /* (V32.6) */
    o.n++; tot.n++;
    if (un){ o.un++; tot.un++; } else if (done){ o.ok++; tot.ok++; } else { o.no++; tot.no++; }
    if (done && chalKeys(r.chals || []).some(function(c){ return c && c !== 'لا توجد تحديات'; })){ o.ch++; tot.ch++; }
  });
  var pc = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  var rows = Object.keys(F).map(function(k){ return F[k]; }).sort(function(a, b){ return a.i - b.i; }).map(function(o){ return [o.k, o.n, o.ok, o.un, o.no, o.ch, pc(o.ok, o.n) + '٪']; });
  if (rows.length) rows.push([t('الإجمالي'), tot.n, tot.ok, tot.un, tot.no, tot.ch, pc(tot.ok, tot.n) + '٪']);
  return { rows:rows, tot:tot };
}


function mfuWeekKey(t){ var d = new Date(t || Date.now()); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); var y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return d.getUTCFullYear() + '-W' + ('0' + Math.ceil(((d - y) / 864e5 + 1) / 7)).slice(-2); }


/* ═══ (V33.8) موجزُ الموسم — رأسُ صفحة الوزارة بطلب المالك: «ديزاين مميّز للوزارة» ═══
   أوّلُ ما يُرى: التاريخُ الهجريُّ والميلادي، وكم بقي لأقرب معلَم، وما جرى اليوم؛ ثم الحلقاتُ الأربعُ نفسُها التي في القاعة (المسح
   والتركيب والتسليم والفك — أخضرُ المنجز وأحمرُ المتبقي، وتفتح قوائمَها)؛ ثم مسارُ العمل الميداني: زياراتُ آخر أربعةَ عشرَ يومًا عمودًا عمودًا
   بوتيرة الأسبوع وتوقّعِ اكتمال أكبر مشعر؛ ثم أبرزُ ثلاثة تحديات. كلُّه من الأرقام نفسِها (لا رقمَ يُخترَع) ويُحسَب مرةً في الرسمة. */
   


/* (V37.14) صفُّ البطاقة: الاسمُ والعدد يفتحان القائمة، و«جهة الدعم المطلوب» تفتح نافذتَها (في القاعة نصٌّ بلا ضغط) */
var SUP_EXTRA = {
  tech:   { n:'تحتاج زيارة أخرى — أعادها المهندس', sup:[{ p:'أفاقي', s:'زيارةٌ تقنية' }] },
  none:   { n:'بلا سبب مسجّل — يصنّفه المهندس', sup:[{ p:'أفاقي', s:'يختار المهندسُ السببَ من القائمة' }] },
  review: { n:'يراجع المهندسُ تصنيفَه', sup:[{ p:'أفاقي', s:'يختار المهندسُ الفئةَ من القائمة' }] }
};

var SUP_POP = '';   


/* ═══ (V37.29) البندُ ٣ — الوزارةُ تقرأ «من عليه الدور» بأربع مجموعات، والفريقُ يبقى بالفئات الثماني تحتها (مقترحُ ملف التصنيف) ═══
   النقطةُ تُعَدّ مرةً في المجموعة وإن كانت لها فئتان منها. «وصول وتصاريح» من أسباب الزيارة بلا مسح لا من التحديات. */
var CC_GROUPS = [
  { g:'make',  n:'تصنيع وتجهيز',            who:'أفاقي — هيكل أو عمود أو طقم إضافي أو معدات', ks:['mount', 'beam', 'wide', 'height'] },
  { g:'study', n:'دراسة وزيارة تقنية',       who:'أفاقي — زيارة تقنية ودراسة الموقع',          ks:['entry', 'multi'] },
  { g:'owner', n:'تنسيق مع الجهة المالكة',   who:'الشركة أو الجهة المالكة',                    ks:['block', 'legacy'] },
  { g:'access', n:'تحتاج زيارة أخرى',         who:'أفاقي — تنسيق الزيارة',                      ks:[] }   /* (V37.31) قاعدةُ المالك الدائمة: لا ما يوحي بتصريحٍ أو تعذّرٍ فيما تراه الوزارة */
];


/* ═══ (V29.6) قرارُ المالك: «كارتٌ بالمخيمات اللي ما فيهاش تحديات، وأيُّ كارتٍ أضغطه يطلعلي قائمة أقدر أعملها تصدير — وكارتٌ
   للنقاط اللي ما فيهاش صور، بالنوع والمشعر، عشان أوجّه الشباب يزوّدوا الصور» ═══ */
var SV_POP = '';
function mfuObsMap(){   /* (V32.5) معرّفُ النقطة ← فئاتُ معوّقاتها — مرةً في الثانية بإصدار الإحصاء نفسِه (لا مرورَ على النقاط لكلِّ صف) */
  var c = mfuObsMap.c; if (c && c.v === STAT_VER && Date.now() - c.at < 1000) return c.m;
  var m = {}; mfuObstacles().forEach(function(e){ m[e.x.id] = e.cats; }); mfuObsMap.c = { v:STAT_VER, at:Date.now(), m:m }; return m;
}
function svPhotoState(x, r){ var n = photosOf(x.id).length; if (n) return ''; return (r && Array.isArray(r.photos) && r.photos.length) ? 'التُقطت ولم تُرفع من الجهاز' : 'لم تُلتقط صور'; }
var SV_LISTS = {
  sv:      ['تمت الزيارة',            function(x, r){ return svVisited(r); }],   /* (V32.6) بأيِّ نتيجة — (V32.7) بمصطلح المالك */
  rem:     ['المتبقي — لم تتم زيارتها', function(x, r){ return !svVisited(r); }],
  clean:   ['نقاط بلا عوائق', function(x, r){ return svClean(r); }],   /* (V32.5) كلُّ الأنواع — (V33.0) بالتعريف الواحد */
  obs:     ['نقاط عليها معوّقات',        function(x, r){ return !!mfuObsMap()[x.id]; }],
  campins: ['المخيمات وحالةُ تركيبها',    function(x, r){ return x.type === 'مخيم'; }],
  corins:  ['الممرات وحالةُ تركيبها',     function(x, r){ return x.type === 'ممر'; }],
  chal:    ['نقاط بعوائق', function(x, r){ return svObstacle(r); }],   /* (V33.0) تمت الزيارة وفيها تحدٍّ أو تحتاج زيارة أخرى */
  unreach: ['تعذّر الوصول',            function(x, r){ return !!(r && r.access && r.access !== 'تم الوصول'); }],
  campok:  ['مخيمات بلا تحديات', function(x, r){ return taxOf(x).t === 'مخيمات' && svClean(r); }],   /* (V33.4) بالتعريف الواحد — والزيارةُ بقرار المهندس بلا تحدٍّ بلا عائق */
  nophoto: ['زيارات بلا صور',          function(x, r){ return !!(r && svDone(r)) && !recIsQuick(r) && !!svPhotoState(x, r); }],   /* (V33.5) الزيارةُ بقرار المهندس بلا نموذجٍ ولا صورٍ أصلًا — ليست «بلا صور» */
  insd:    ['تم التركيب',               function(x, r){ return insDone(x.id); }],   /* (V33.5) حلقاتُ القاعة الأربع */
  insr:    ['المتبقي — لم يُركَّب',      function(x, r){ return !insDone(x.id); }],
  hand:    ['تم التسليم',               function(x, r){ return handDone(x.id); }],
  handr:   ['المتبقي — لم يُسلَّم',      function(x, r){ return !handDone(x.id); }],
  disd:    ['تم الفك',                  function(x, r){ return disDone(x.id); }],
  disr:    ['المتبقي — لم يُفَك',         function(x, r){ return !disDone(x.id); }],   /* (V34.3) من الكلّ كالثلاثة */
  badphoto:['صور تحتاج إعادة',          function(x, r){ return photosOf(x.id).some(function(e){ return photoQualityFlags(e[1].q).length > 0; }); }],   /* (V30.6) photosOf يعيد [مفتاح، وثيقة] */
  /* (V29.9) ما ينتظر الوزارة — بالتفكير من جهتها: ما لا يتحرّك إلا بقرارها أو بملفٍّ منها */
  permit:  ['تحتاج تصريح دخول',          function(x, r){ return !!(r && r.access === 'يحتاج تصريح'); }],
  denied:  ['منع دخول — تنسيق',          function(x, r){ return !!(r && r.access === 'منع دخول'); }],
  missing: ['غير موجودة ميدانيًا — تصحيح السجل', function(x, r){ return !!(r && r.access === 'غير موجود'); }],
  noalloc: ['مخيمات بلا تخصيص',          function(x, r){ return taxOf(x).t === 'مخيمات' && (x.reason === 'عدم وجود تخصيص' || !String(x.co || '').trim()); }],
  minwait: ['بانتظار اعتماد الوزارة',     function(x, r){ return lifeOf(x) === 'minwait'; }],
  /* (V37.0) قرارُ المالك: الزيارةُ غيرُ المسح */
  srv:     ['تم المسح',                    function(x, r){ return svDone(r); }],
  srvr:    ['المتبقي — لم يُمسح',          function(x, r){ return !svDone(r); }],
  gap:     ['زيارة بلا مسح',               function(x, r){ return svNeedsRevisit(r); }],
  why_tech:['تحتاج زيارة أخرى — أعادها المهندس', function(x, r){ return svVisited(r) && svReached(r) && r.review === 'revisit'; }],
  why_none:['زيارة بلا مسح — بلا سبب مسجّل',  function(x, r){ return svStuck(r) && !visitWhy(r); }],
  cc_review:['تحدٍّ يراجع المهندسُ تصنيفَه', function(x, r){ return chalCats(r).indexOf('review') > -1; }],
  esc:     ['متوقفة — ثلاثُ محاولاتٍ أو عشرةُ أيامٍ بلا مسح', function(x, r){ return stuckEsc(r); }],   /* (V37.1) */
  phgap:   ['صور ليست على الدرايف', function(x, r){ return !!STATE.meta.phFull && phGap(r, x.id) > 0; }]   /* (V37.8) */
};
