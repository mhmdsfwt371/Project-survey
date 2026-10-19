/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-11-from-tasks-office-12-draw-paths-areas.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-12-draw-paths-areas.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : routeCancel, routeLive, pinCancel
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
function routeCancel(){ ROUTE.on = false; ROUTE.pts = []; ROUTE.gen = null; ROUTE.moved = 0; drawFlag(); if (typeof mapPaint === 'function') mapPaint(); render(1); }

/* الكتابةُ في حقول اللوح لا تُعيد بناءَه: كان كلُّ رقمٍ يُعيد رسمَ اللوح والخريطة
   معًا — ثقيلٌ، وعلى الهاتف قد تُغلَق لوحةُ المفاتيح بعد أوّل رقم. فيُحدَّث العددُ
   والخريطةُ في مكانهما، ويُعاد اللوحُ عند الخروج من الحقل (V17.58). */
function routeLive(){
  var el = document.getElementById('rtN');
  if (el) el.textContent = nm(routeCount());
  if (typeof mapPaintDebounced === 'function') mapPaintDebounced();
}

/* ═══ لكلِّ وضعٍ مخرجٌ ظاهر (V17.53) ═══
   «نقطة هنا» يُسلِّح الضغطةَ التالية، وأزرارُ الخريطة العائمةُ تختفي أثناءه
   (V17.48) كي لا تحجب موضعَ الضغط — فلم يبقَ زرٌّ يُلغيه، ومن بدأه بالخطأ
   لا يجد منه مخرجًا إلا أن يضع نقطةً لا يريدها. فصار له شريطٌ ظاهرٌ يقول ما
   ينتظره ومعه «إلغاء»، ومفتاحُ الهروب يُلغيه، وضغطةُ الزرِّ نفسِه تُطفئه. */
function pinCancel(){
  if (!PIN_ON) return;
  PIN_ON = false; drawFlag();
  toast(t('أُلغي وضعُ النقطة'));
  render(1);
}
