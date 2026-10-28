/* ============================================================================
   FILE    : src/03zz-late/03-survey--03-survey-records-04-readiness-conditions.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03-survey/03-survey-records-04-readiness-conditions.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : asnQuick
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function asnQuick(kind){
  if (!may('approve')){ toast(t('إنشاءُ الطلب للمهندس وحده')); return; }
  var L = asnReadyList(kind);
  if (!L.length){
    toast(t('لا نقطةَ جاهزةً لهذا النوع') + ' — ' + t(PV.ASN_READY[kind].why));
    return;
  }
  selClear();
  var n = 0;
  L.forEach(function(x){ if (n < PV.ASN_QCAP){ SEL[x.id] = 1; SEL_N++; n++; } });
  ASN_KIND = kind;
  FIELD_MODE = PV.ASN_READY[kind].layer;
  ASN_MODE = (PV.ASN_KIND_DEST[kind] === 'team') ? 'team' : 'tech';
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
