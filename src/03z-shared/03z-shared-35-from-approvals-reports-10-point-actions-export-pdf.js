/* ============================================================================
   FILE    : src/03z-shared/03z-shared-35-from-approvals-reports-10-point-actions-export-pdf.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-10-point-actions-export-pdf.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : popOpenAt, expAllowed
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ نافذة النقطة — كل ما تحمله النقطة من إجراءات ═══
   الخريطة الحقيقية Leaflet: هذه النافذة هي ما يفتح عند النقر على أي نقطة. */

PV.BOOT_AT = Date.now();

/* لحظةُ فتحِ التطبيق — لتقدير ما يكلّف */
var POP_OPEN = false, POP_JUST = 0, POP_EV = null;

/* ═══ النقرةُ تُعرَف بعينها لا بوقتها ═══
   نقرةُ النقطة تفتح النافذةَ، ثم يصل الحدثُ نفسُه إلى معالج المستند الذي
   يُغلق كلَّ لوحٍ نُقر خارجه — فكانت النافذةُ تُفتَح وتُغلَق في اللحظة
   نفسها. وحُلَّ بمهلةٍ: «إن مضى أقلُّ من ثلاثِ مئةِ جزءٍ فاتركها». والمهلةُ
   تكفي حتى يبطئ الرسم: مخيماتٌ بمضلّعاتها عند التقريب، أو قائمةٌ طويلةٌ
   يُعاد بناؤها — فيتجاوز الرسمُ المهلةَ، ويصل الحدثُ بعدها، فتُغلَق النافذةُ
   قبل أن تُرى. ولا يقع ذلك إلا على الأجهزة البطيئة وفي أثقل الحالات، فيبدو
   العطلُ متقطّعًا لا يُصدَّق.
     فصارت النقرةُ تُعلَّم بعينها: يُحفَظ الحدثُ الأصليُّ نفسُه، ويقارنه
   معالجُ المستند بهويته — فلا يهمُّ كم استغرق الرسمُ، الحدثُ الذي فتحها لا
   يُغلقها أبدًا. والمهلةُ تبقى احتياطًا لمن لا حدثَ أصليَّ له. */
function popOpenAt(id, ev){
  POP_EV = (ev && (ev.originalEvent || ev.detail && ev.detail.originalEvent)) || ev || null;
  POP_JUST = Date.now();
  POP_SITE = id; POP_OPEN = true; render();
}

function expAllowed(k){ var p = EXP.page[k] || k; return typeof seesPage === 'function' ? seesPage(p) : true; }


