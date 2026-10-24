/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-20-from-approvals-reports-03-trials-invoices.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-03-trials-invoices.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : trialOf, trialSiteNorm, trialForSite, trialLinkExisting, trialPick, buyPhPrevHtml
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ التجارب: كلُّ ريالٍ وكلُّ ساعة — وقرارُ دخولها التكاليف (V16.96) ═══
   التجربةُ مصروفٌ ووقتٌ قبل أن تصير عملًا: يُشترى لها ويُجرَّب ثم يُقال هذا
   يصلح أو لا يصلح. وكان مصروفُها يذوب في دفتر المشتريات فلا يُعرَف كم كلّفت
   التجاربُ وحدَها، ولا وقتُها يُسجَّل أصلًا. فصار لها دفترٌ: اسمُ التجربة
   وتاريخُها وساعاتُها، ولكلِّ شراءٍ حقلٌ يقول لأيِّ تجربةٍ هو. و**قرارُ
   دخولها في تكاليف المشروع مفتاحٌ واحد**: إن رُفع خرج مصروفُ التجارب من
   المنصرف المعتمد وبقي مسجَّلًا في دفتره — يُرى ولا يُحسَب؛ وإن وُضع دخل.
   فالقرارُ يُبدَّل متى شئت ولا يُعاد تسجيلُ شيء. */

function trialOf(id){ return trialRows().filter(function(x){ return String(x.id) === String(id); })[0] || null; }

/* ═══ (V37.44) قرارُ المالك (الخيارُ أ): «نقطةُ تجربة» على المخيم مربوطةٌ بسطرها في «التجارب» ═══
   عند التعليم: إن وُجد سطرٌ مربوطٌ بالنقطة فهو هو؛ وإلا فسطرٌ يذكر اسمَ المخيم أو معرّفَه في اسمه أو مكانه (ما أُضيف يدويًّا) يُربَط ولا يُكرَّر؛
   وإلا يُنشأ «تجربة — اسم المخيم». عند الإلغاء: السطرُ الفارغ (بلا مصروفٍ ولا ساعاتٍ ولا تقريرٍ ولا أصناف) يُحذَف، وما عليه بياناتٌ يبقى. */
function trialSiteNorm(x){ return (typeof arNorm === 'function' ? arNorm(x) : String(x || '')).replace(/\s+/g, ' ').trim(); }

function trialForSite(id){
  var R = trialRows(), x = siteFind(id); var linked = R.filter(function(r){ return r.site === id; })[0]; if (linked) return { row:linked, how:'linked' };
  if (!x) return null; var nmS = trialSiteNorm(x.name || ''), idS = String(id).toLowerCase();
  var m = R.filter(function(r){ if (r.site) return false; var hay = trialSiteNorm((r.n || '') + ' ' + (r.where || '')); return (nmS && nmS.length >= 3 && hay.indexOf(nmS) > -1) || hay.toLowerCase().indexOf(idS) > -1; })[0];
  return m ? { row:m, how:'matched' } : null;
}

/* المزامنةُ الهادئة للنقاط المعلَّمة من قبل: تُربَط بسطرها اليدويّ إن وُجد، ولا يُنشأ شيءٌ جديد (طلبُ المالك: «ضفته يدويًّا، ما تضيفهوش تاني») */
function trialLinkExisting(){
  if (!trialMay() || trialLinkExisting.done) return; trialLinkExisting.done = true; var ch = 0;
  (STATE.sites || []).forEach(function(x){ if (!x.pilot) return; var f = trialForSite(x.id); if (f && f.how === 'matched'){ f.row.site = x.id; if (!f.row.where) f.row.where = x.name || x.id; ch++; } });
  if (ch){ trialSave(); logEvent('رُبطت ' + ch + ' نقطةَ تجربةٍ بسطورها في «التجارب»'); }
}

function trialPick(id, key, val){
  if (!trialMay()) return;
  var r = trialOf(id); if (!r || (key !== 'zone' && key !== 'type')) return;
  r[key] = String(val || '');
  if (key === 'zone' && r.type && trialTypes(r.zone).indexOf(r.type) < 0) r.type = '';
  if (trialSave()) render(1);
}

/* ═══ (V37.43) صورةُ الفاتورة — تُضغَط بدقّةٍ تُقرأ بها الأرقام، وترتفع في طابور الصور نفسِه (الدرايف عبر الخادم)، والمشترى يحمل مفتاحَها ═══ */
var BUY_PH = null;

function buyPhPrevHtml(){ return BUY_PH ? '\u2713 ' + esc(t('اختيرت صورة الفاتورة')) + ' \u00b7 ' + nm(Math.round((BUY_PH.size || String(BUY_PH.data || '').length * 0.75) / 1024)) + ' ' + esc(t('كيلو')) + ' <button type="button" class="btn btn-quiet btn-sm" data-buyphx="1" style="color:#E05252">\u{1F5D1} ' + esc(t('احذفها')) + '</button>' : esc(t('اختيارية — تُرفع مع حفظ الشراء')); }
