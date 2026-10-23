/* ============================================================================
   FILE    : src/03z-shared/03z-shared-18-from-mfu-tabs-04-followup-tabs.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-mfu-tabs-04-followup-tabs.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : MT_TILE, mtDot, mtGrid, mtOpen, mtXlsx, mtSites, MT_GRP, mtGrpOf, obsLocTags, mtStepSite, MT_COB, mtCoStats, MT_WF, MT_WPOP … (+10 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ (V37.62) تبويباتُ متابعة الوزارة الخمسة بفكرة الملخّص — قرارُ المالك: «الوزارة عاوزة تتابع بأسهل طريقة ممكنة» ═══
   القالبُ الواحد: حلقةٌ كبيرة (كم من كم) ← مربعاتٌ بأيقونةٍ ورقمٍ وكلمة ← كلُّ مربعٍ يفتح لوحتَه وإكسلَه (والمهامُّ تُصفّى في مكانها).
   القواعد: كلُّ نقطةٍ (أو مهمةٍ) في مربعٍ واحدٍ من كلِّ قسم فالأرقامُ تجمع؛ لا عمرَ معوِّقٍ ولا مقارنةً تُدين المشغّل؛ والتفاصيلُ القديمةُ كاملةً في قسمٍ مطويّ. */
var MT_TILE = 'background:var(--surface-2);border-radius:14px;padding:12px;touch-action:manipulation';


/* (V37.64) توحيد: الأسماءُ من تعريف المالك CC_GROUPS نفسِه، والألوانُ بمعنى واحدٍ في الخريطة واللوحات */
var MT_GRP = [ { k:'make', e:'\u{1F3ED}', c:'#F59E0B', w:[0, 2, 4] }, { k:'study', e:'\u{1F50E}', c:'#E67E22', w:[1, 5] }, { k:'owner', e:'\u{1F91D}', c:'#EF4444', w:[3] }, { k:'access', e:'\u{1F501}', c:'#8D6E63', w:[] } ];

/* (V38.76) the single definition: a point scheduled for installation keeps its challenge until it is installed (svStOf says
   «sched» first and dropped it from this tab while the hall screen and the follow-up counted it) */
function mtGrpOf(id){
  if (insDone(id)) return ''; var r = STATE.recs[id]; if (!r || !svVisited(r)) return ''; if (!svDone(r)) return 'access';
  var pw = svPrimWhyAny(r); if (pw < 0) return '';
  for (var i = 0; i < MT_GRP.length; i++) if (MT_GRP[i].w.indexOf(pw) > -1) return MT_GRP[i].k; return 'study';
}

/* (V38.26) كلُّ النقاط عدا المخيمات ومراكز التفويج */
function obsLocTags(x){
  var r = STATE.recs[x.id], out = {};
  if (!r || r.deleted || !svVisited(r) || !locApplies(x)) return null;   /* (V38.26) كلُّ النقاط عدا المخيمات ومراكز التفويج */
  var L = locList(r.loc), pick = 'اختيار الفني', txtSrc = 'وصف التحدي أو الملاحظة';
  var map = { 'تحت كوبري':'bridge', 'مدخل نفق':'tin', 'مخرج نفق':'tout', 'نفق — غير محدد':'tgen', 'لوحة استرشادية':'sign', 'بدون إطار معدني للتثبيت':'nomount', 'على مظلة':'canopy' };
  L.forEach(function(v){ if (map[v]) out[map[v]] = pick; });
  if (locOnly(x)) return out;   /* (V38.78) corridors and Jamarat: the location choice alone — no mount, no category, no words */
  if (r.mount === 'لوحة استرشادية') out.sign = pick;   /* ما حُفظ في V38.23 */
  if (chalCats(r).indexOf('mount') > -1 && !out.nomount) out.nomount = pick;   /* فئةُ «لا يوجد سطح تثبيت» */
  if (L.length) return out;   /* اختارَ الفنيُّ (ولو «لا شيء مما سبق») — لا استنتاجَ من الكلام */
  /* زياراتٌ أقدمُ بلا اختيار: من اختيار التحدي القديم أو كلمات الوصف والملاحظة — لا من اسم الفئة الجامعة «… نفق أو كوبري» */
  var nm0 = {}; ccList().forEach(function(o){ nm0[o.n] = 1; if (o.base) nm0[o.base] = 1; });
  var chals = Array.isArray(r.chals) ? r.chals : [];
  var own = arKey(chals.filter(function(c){ return c && !nm0[c] && c !== 'لا توجد تحديات'; }).join(' ')), txt = arKey([r.note || '', r.chal_note || ''].join(' '));
  var hit = function(rx){ return rx.test(own) ? pick : (rx.test(txt) ? txtSrc : ''); };
  var b = chals.indexOf('المسار تحت كوبري') > -1 ? pick : hit(/تحت\s*(ال)?(كوبري|كبري|جسر)|(^|\s)(ال)?(كوبري|كبري)/); if (b) out.bridge = b;
  var ti = hit(/(مدخل|بدايه|بداية)\s*(ال)?نفق/), to = hit(/(مخرج|نهايه|نهاية)\s*(ال)?نفق/);
  if (ti) out.tin = ti; if (to) out.tout = to;
  if (!ti && !to){ var tg = chals.indexOf('المسار داخل نفق') > -1 ? pick : hit(/نفق|انفاق/); if (tg) out.tgen = tg; }
  var sg = hit(/(لوحه|لوحات|لافته|لافتات)\s*(ال)?(استرشاد|ارشاد)|استرشادي|ارشادي/); if (sg) out.sign = sg;
  var cn = hit(/مظله|مظلات/); if (cn) out.canopy = cn;
  return out;
}


/* ── ٣ · شركات الخدمة ── */
var MT_COB = [ { k:'ready', n:'مخيماتها جاهزة', e:'\u2705', c:'#22C55E' }, { k:'prep', n:'فيها تجهيز', e:'\u{1F6E0}', c:'#F59E0B' }, { k:'coord', n:'محتاجة تنسيق', e:'\u26A0\uFE0F', c:'#EF4444' }, { k:'todo', n:'لسه', e:'\u23F3', c:'#475569' } ];


/* ── ١ · المهام الأسبوعية — تُصفّى في مكانها، والإكسلُ بما تراه ── */
var MT_WF = '', MT_WPOP = false;


/* (V37.63) مربعُ المهام يفتح نافذتَه */
var MT_WST = [ { k:'done', n:'خلصت', e:'\u2705', c:'#22C55E' }, { k:'late', n:'متأخرة', e:'\u23F0', c:'#EF4444' }, { k:'run', n:'شغالين عليها', e:'\u{1F504}', c:'#2E86DE' }, { k:'wait', n:'لسه', e:'\u23F3', c:'#475569' } ];

var MT_WWHO = [ { k:'afaqy', n:'أفاقي', e:'\u{1F3E2}' }, { k:'min', n:'الوزارة', e:'\u{1F3DB}' }, { k:'co', n:'شركة الخدمة', e:'\u26FA' }, { k:'other', n:'أخرى', e:'\u{1F465}' } ];


