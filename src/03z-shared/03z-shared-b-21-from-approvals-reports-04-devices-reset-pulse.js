/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-21-from-approvals-reports-04-devices-reset-pulse.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-04-devices-reset-pulse.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : costGuardCard
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ حارسُ التكلفة (V17.96) ═══
   الحصةُ المجانيةُ تكفي الموسمَ — لكنَّ حلقةً خاطئةً على جهازٍ واحدٍ تستهلكها في
   يوم، ولا يُعلَم إلا بالفاتورة. تنبيهُ الميزانية في Google Cloud يُضبَط يدًا
   مرةً واحدة (الخطواتُ في docs/cost-guard.md) ويؤشّره المديرُ هنا فيختفي من
   الجاهزية. */
function costGuardCard(){
  var on = !!cfgGet('budgetAlert');
  return card('حارسُ التكلفة', '<div class="wt-row" style="gap:12px;flex-wrap:wrap;align-items:center">'
    + '<span>' + esc(t('تنبيهُ ميزانية Google Cloud')) + ': ' + (on ? pill(t('مضبوط'), 'ok') : pill(t('غيرُ مضبوط'), 'wrn')) + '</span>'
    + btn(on ? t('أُلغي الضبط') : '\u2713 ' + t('ضبطتُه — أشِّر'), on ? 'btn-quiet btn-sm' : 'btn-primary btn-sm', ' data-budalert="' + (on ? 0 : 1) + '"')
    + '<a class="btn btn-quiet btn-sm" href="docs/cost-guard.md" target="_blank" rel="noopener">' + esc(t('خطواتُ الضبط')) + '</a></div>'
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('الحصةُ المجانية ٥٠ ألف قراءةٍ و٢٠ ألف كتابةٍ في اليوم — والتنبيهُ يبلّغك قبل أن تصل الفاتورة. قراءاتُ اليوم في صحة النظام ← الاستهلاك.')) + '</p>');
}
