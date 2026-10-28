/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-14-from-exec-report-01-exec-report.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-exec-report-01-exec-report.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : execOvSeed, execOvSet
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* (V37.61) بعد البذر: السحابةُ وحدَها، فما يمسحه المهندسُ يبقى ممسوحًا */
function execOvSeed(){   /* (V37.61) قراراتُ المالك المكتوبةُ في الكود تُنقل إلى السحابة مرةً واحدة — أوّلُ مهندسٍ يفتح التطبيق */
  if (CFG.execOvSeeded || typeof may !== 'function' || !may('settings') || (typeof PV.CFG_PULLED !== 'undefined' && !PV.CFG_PULLED)) return 0;   /* لا بذرَ قبل وصول إعدادات السحابة — وإلا طغى على قراراتٍ موجودة */
  CFG.execOv = CFG.execOv || {}; var n = 0;
  Object.keys(PV.EXEC_OV).forEach(function(id){ if (!CFG.execOv[id]){ CFG.execOv[id] = { s:PV.EXEC_OV[id], by:'قرار المالك — الملف ٣', at:Date.now() }; n++; } });
  CFG.execOvSeeded = Date.now(); cfgPushSoon('execOv'); cfgPushSoon('execOvSeeded'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1;
  if (n) logEvent('نُقلت ' + n + ' من قرارات التقرير التنفيذي إلى السحابة'); return n;
}

function execOvSet(id, st){
  if (!may('settings')){ toast(t('تصنيفُ التقرير للمهندس وحدَه')); return false; }
  CFG.execOv = CFG.execOv || {}; CFG.execOv[id] = st && EXEC_L[st] ? { s:st, by:(STATE.meta && STATE.meta.name) || '', at:Date.now() } : null;   /* (V37.61) «تلقائي» = null لا حذف — الكتابةُ الدامجةُ في السحابة لا تمحو مفتاحًا محذوفًا محليًّا */
  cfgPushSoon('execOv'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1; statBump(); return true;
}
