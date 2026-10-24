/* ============================================================================
   FILE    : src/04-office/04-tasks-office-14-pull-scope-listen-map.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Pull scope per role, differential pulls, per-device read caps, change-pulse listening, and the Leaflet map with two layers and camp polygons.
   DEFINES : لا دوالَّ — بياناتٌ وجملٌ فقط
   GLOBALS : ALL_WORK, READ_CAP_WARN, PULSE_UNSUB, BRIDGE_UNSUB, LIVE, MAP_ME, MAP, MAP_READY, POLY_Z, POLY … (+3 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* ═══ سحبٌ فارقيٌّ لمجموعةٍ صغيرة ═══
   المجموعاتُ التي لا تدخل نطاقَ pullDelta (سجلُّ الصور وسجلُّ الصيانة) كانت
   تُسحَب كاملةً في كلِّ إقلاع. صارت تُسحَب كما يُسحَب غيرُها: ما كُتب بعد
   آخر سحبةٍ فقط، وبسقفٍ يقطع؛ وأوّلُ مرةٍ على الجهاز تُسحَب الأحدثُ وحدَها.
   ويُحصى ما قُرئ في عدّاد القراءات — فما يكلّف يُرى. */
/* ═══ سقفُ القراءات لكلِّ جهاز (V17.26) ═══
   جهازٌ واحدٌ في حلقةٍ خاطئة يستهلك حصةَ المشروع كلَّها وحدَه، ولا يُعرَف
   إلا آخرَ الشهر. فيُحصى ما يقرؤه الجهازُ في اليوم: إن تجاوز ثلاثةَ آلافٍ
   قيل لصاحبه، وإن تجاوز ستةَ آلافٍ تباطأ السحبُ الدوريُّ إلى الربع ونُبِّه
   المكتبُ بحدث — والإنصاتُ والنبضةُ يبقيان فلا يتعطّل العمل. */

   

/* ── حدودُ الاستهلاك — تُعرَض للمهندس ── */

