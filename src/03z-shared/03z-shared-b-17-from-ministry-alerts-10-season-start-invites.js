/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-17-from-ministry-alerts-10-season-start-invites.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-ministry-alerts-10-season-start-invites.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : ghToken, ghCard
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ شغّل الخادمَ الآن ═══
   جدولةُ GitHub «كلَّ عشر دقائق» ليست عشرًا: على مستودعٍ هادئٍ تتأخّر إلى
   ساعةٍ ونصف كما وقع — فيبقى الطلبُ «يُنشَأ — خلال دقائق» ساعةً. الطريقُ
   المضمونُ نداءُ التشغيل نفسِه، وهو يحتاج مفتاحًا بصلاحية تشغيل السيور
   وحدَها (Actions: write على هذا المستودع لا غير) — يضعه مديرُ المشروع
   مرةً في الإعدادات، ويبقى في وثيقةٍ لا يقرؤها إلا هو. وبلا مفتاحٍ يبقى
   رابطُ صفحة التشغيل اليدويّ. */
var GH_REPO = 'mhmdsfwt371/Project-survey';

function ghToken(){ return String((CFG.gh || {}).tok || ''); }


var GH_RAN = 0;

function ghCard(){
  if (!may('roles')) return '';
  var has = !!ghToken();
  return card('\u{1F511} ' + t('مفتاحُ تشغيل الخادم'),
      '<p class="hint" style="margin:0 0 8px">'
      + esc(t('جدولةُ GitHub تتأخّر إلى ساعةٍ على المستودعات الهادئة. بمفتاحٍ صلاحيتُه تشغيلُ السيور وحدَها يُشغَّل الخادمُ فورًا من زرِّ «شغّل الآن» في طلبات الإنشاء.'))
      + '</p>'
      + '<div class="field"><label>' + esc(t('المفتاح')) + (has ? ' ' + pill('محفوظ','ok') : '') + '</label>'
      +   '<input id="ghTok" type="password" dir="ltr" autocomplete="off" placeholder="github_pat_…"></div>'
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('GitHub ← Settings ← Developer settings ← Fine-grained tokens ← Generate: هذا المستودع فقط · Actions: Read and write · لا شيءَ آخر. يحفظه مديرُ المشروع ويعمل الزرُّ به لكلِّ من يُنشئ الحسابات.'))
      + '</p>',
      btn('\u{1F4BE} ' + t('احفظ'),'btn-primary btn-sm',' data-ghsave="1"')
      + (has ? btn('\u{1F5D1} ' + t('امسح'),'btn-quiet btn-sm',' data-ghclear="1"') : ''));
}

/* كلمةُ هذه الجلسة كما كُتبت في نموذج الدخول — في الذاكرة فقط: بها تُثبَت
   الهويةُ صامتةً إن طلبت المصادقةُ دخولًا حديثًا عند تبديل المؤقتة، فلا يُقال
   «ادخل من جديد» لمن دخل للتوّ. والجلسةُ المستعادةُ بلا كلمةٍ تسأل عنها. */
var SESS_PW = '';
