/* ============================================================================
   FILE    : src/03z-shared/03z-shared-27-from-approvals-reports-01-approvals-review.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-01-approvals-review.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : SVA_ST, SVA_REV, SVA_SOL, SVA_Q, SVA_PH, HO_DOC, HO_CO, CHAL_Q, NTF_Q, MIN_ST, MIN_Q, MIN_OPEN, MIN_T
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ اعتمادُ الزيارات — المهندسُ يراجع ما زاره المشرفُ قبل أن يُبنى عليه ═══
   الصفحةُ التي تُغلق الدورة: كلُّ زيارةٍ حُفظت تظهر هنا ببياناتها الجديدة —
   أين نُقلت النقطة، وما القياسات، وما التحديات، وكم صورة — فيعتمدها المهندسُ
   أو يردُّها «تحتاج زيارةً أخرى» بسببٍ يقرؤه المشرفُ في مهامّه. وفورَ الاعتماد
   يُقترَح حلُّها من الكتالوج نفسِه — قائمةٌ مبحوثةٌ أو نمطٌ جاهز — فلا يخرج
   المهندسُ إلى شاشةٍ أخرى ليُكمل ما بدأه. */
var SVA_ST = 'pending', SVA_REV = '', SVA_SOL = '', SVA_Q = '', SVA_PH = '';

var HO_DOC = '', HO_CO = '';

/* ═══ بحثُ التحديات والإشعارات بكلِّ حقل (V17.25) ═══
   البحثُ في الصف كلِّه: المعرِّفُ واسمُ النقطة ومشعرُها وشاخصُها ومربعُها
   وشركتُها ونوعُها، ونصُّ كلِّ تحدٍّ، والملاحظةُ، واسمُ المُفيد، والحالةُ.
   وفي الإشعارات: النصُّ والنوعُ والمستوى والوجهةُ والمرسِلُ والنقطةُ واسمُها
   والوقتُ. يُطابَق بلا حساسيةٍ لحالة الحرف، وبكلِّ كلمةٍ على حدة — فتُكتَب
   «منى ٥٠٦» فتُقصَر على ما جمعهما. */
var CHAL_Q = '', NTF_Q = '';

var MIN_ST = 'pending', MIN_Q = '', MIN_OPEN = '', MIN_T = 0;
