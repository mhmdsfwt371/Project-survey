/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-27-from-approvals-reports-11-import-roles-perms.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-11-import-roles-perms.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : PAGE_CAP
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* «موقع جديد» في قائمة كلِّ دورٍ ميدانيٍّ يملك التسجيل (V16.80): كان الزرُّ
   يُعرَض على الخريطة لمن يملك «edit»، والصفحةُ ليست في قائمته — فيُردُّ إلى
   أوّلِ شريحةٍ مرئيةٍ من «النماذج» وهي «المسح»، فيجد المشرفُ نموذجَ مسحٍ مكان
   نموذج الموقع الجديد. الزرُّ يُعرَض والصفحةُ تُرى — أو لا يُعرَض. */
var PAGE_CAP = {
  /* «الملخّص المالي» شاشةُ العميل لا شاشةُ الشركة: المستخلصُ المعتمَدُ وحده
     يراه، وهو مصرَّحٌ له في nav — فلا يُقيَّد بقدرة المال الداخلية. */
  ipc:'money', buys:'money', trials:'money', budget:'money', exec:'money',
  /* البلاغات: يراها من يبلّغ ومن يُصلح — لا قدرةَ خاصةً لها */
  invb:'inventory', invmv:'inventory', stock:'inventory',
  wos:'workshop', wday:'workshop',
  /* شاشةُ الحسابات كانت مقيَّدةً بقدرة الإنشاء وحدَها — فمن يقرأ ولا يُنشئ
     (الوزارةُ) لا يراها. صار القيدُ في القائمة (nav) والصفوفُ في canSeeUser،
     والأزرارُ في قدراتها — فتُقرأ بلا أن تُكتَب. */
  perms:'perms', assignRole:'users', roles:'users',
  svForm:'edit', insForm:'edit', newsite:'propose',
  qa:'approve', appr:'approve', esc:'approve', svappr:'approve',
  visits:'settings', prep:'settings', asm:'settings', install:'settings',
  disp:'settings', items:'settings', buycat:'settings', sup:'settings', consts:'settings',
  exp:'exportAll', retain:'delete', sync:'settings'
};
