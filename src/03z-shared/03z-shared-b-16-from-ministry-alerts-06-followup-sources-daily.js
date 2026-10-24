/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-16-from-ministry-alerts-06-followup-sources-daily.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-ministry-alerts-06-followup-sources-daily.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : mfuUnseen
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* الجديدُ منذ آخر زيارةٍ لمتابعة الوزارة — على هذا الجهاز */
function mfuUnseen(){ var seen = +lsGet('nsk14.mfuSeen') || 0; return mfuTimeline(14, 200).filter(function(e){ return e.at > seen; }).length; }

/* ═══ ملخصُ العمل اليومي (V24.0) ═══
   كان «ملخصَ التركيبات اليومي»: منحنيَين لآخر ثلاثين يومًا وجدولَ أربعة عشر يومًا — والعملُ مسحٌ
   وتركيبٌ وفكٌّ ومعه المتعذّر. صار الأربعةَ كلَّها، وكلَّ يومٍ منذ أوّل عملٍ مسجَّل، والجدولُ صفحاتٌ
   لا تزيد على خمسة عشر سطرًا، ولكلِّ رقمٍ نسبتُه؛ وكلُّ عملٍ يُخفى ويُظهَر بضغطةٍ على اسمه،
   والمرشّحاتُ بالشهر واليوم وساعات العمل بتوقيت مكة — واليومُ الواحدُ يُعرَض ساعةً بساعة.
   الأرقامُ من diaryRows نفسِها (تعريفٌ واحد): المرشِّحُ يُمرَّر إليها ولا يُعَدُّ شيءٌ بتعريفٍ ثانٍ.
   والنسبةُ: المسحُ والتركيبُ من إجمالي النقاط (مقامُ «نسبة المسح» في الملخص)، والفكُّ من النقاط
   المركّبة، والمتعذّرُ من زيارات يومه. واليومُ يومُ غرينتش كسائر النظام — أي يومُ عملٍ يبدأ الثالثةَ
   فجرًا بمكة، فلا تنقسم ورديّةُ الليل على يومين. */
var WDY = { off:{}, pg:1, mon:'', day:'', h1:0, h2:24 };
