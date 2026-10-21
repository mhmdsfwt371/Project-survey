/* ============================================================================
   FILE    : src/03z-shared/03z-shared-28-from-approvals-reports-02-inventory-workshop.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/07-reports/07-approvals-reports-02-inventory-workshop.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : seedOnce, itemsList, itemName, REG_KIND, REG_ST, REG_Q, REG_EDIT, regList, regStatus, itemSave, movesList, itemKey, itemCode, stockBalance … (+1 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ المخزنُ والمشترياتُ والكتالوج: من الحركة لا من البذرة ═══════════════
   كانت الأربعُ شاشاتٍ تعرض بذرةً مكتوبةً يومَ بُني الشكل: أربعةَ أصنافٍ
   وأربعَ حركاتٍ وعمليتَي شراء. تبدو عاملةً ولا تقبل إدخالًا — فلا يُسجَّل
   توريدٌ ولا صرفٌ ولا شراء، ويظلُّ الرصيدُ عددًا مكتوبًا لا ميزانًا.

   والرصيدُ لا يُكتَب: يُشتقُّ من الحركات. فمن أراد تصحيحَه سجّل حركةً
   تصحيحية — ولا يُعدَّل رقمٌ في مكانه فيضيع سببُه. */

function seedOnce(key, seed){
  if (!Array.isArray(STATE[key]) || !STATE[key].length) STATE[key] = (seed || []).slice();
  return STATE[key];
}

/* ── الكتالوج: قائمةُ القطع الأمّ، والقيمُ في الإعدادات ── */
function itemsList(){
  if (!Array.isArray(STATE.items) || !STATE.items.length){
    STATE.items = (DATA.items || []).map(function(r){
      return { z:r[0], code:r[1], name:r[2], pts:r[3], price:r[4], prep:r[5], asm:r[6] };
    });
  }
  return STATE.items;
}

function itemName(code){
  var x = itemsList().filter(function(i){ return i.code === code; })[0];
  return (x && x.name) || code;
}

/* ═══ سجلُّ الطلبات والإسنادات ═══
   كلُّ إسنادٍ مهمةٌ لها رقمٌ ونوعٌ ومُسنَدٌ إليه وموعدٌ وحالة — زيارةٌ (SR)
   وتركيبٌ (DR) وفكٌّ (PR) وصيانةٌ (MR). وكانت تُنشأ من الخريطة وتُقرأ في
   «مهامي»، ولا مكانَ واحدٌ يُتابَع فيه النوعُ كلُّه: من أراد أن يرى كلَّ
   طلبات الفكِّ ويغيّر مُسنَدَ واحدٍ منها أو موعدَه أو يحذفه لم يجد أين.
     فصار سجلٌّ واحد: يُرشَّح بالنوع والحالة ويُبحَث، ويُعدَّل فيه المُسنَدُ
   إليه والموعد، ويُحذَف الطلبُ ما لم يُنجَز — والمنجَزُ لا يُحذَف لأن نقاطَ
   صاحبه بُنيت عليه، والمزورةُ تُعتمَد أو تُردّ لا تُمحى. */
var REG_KIND = '', REG_ST = '', REG_Q = '', REG_EDIT = '';

function regList(){
  var out = [];
  Object.keys(STATE.tasks || {}).forEach(function(k){
    var x = STATE.tasks[k];
    if (x && x.site) out.push(x);
  });
  return out.sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}

function regStatus(x){
  if (x.status === 'معتمد') return { t:'منجَز', c:'ok' };
  var rv = svReview(STATE.recs[x.site]);
  if (x.kind === 'visit'){
    if (rv === 'revisit') return { t:'مردودة', c:'off' };
    if (rv === 'pending') return { t:'تنتظر الاعتماد', c:'acc' };
  }
  if (x.kind === 'install' && insDone(x.site)) return { t:'رُكِّبت', c:'ok' };
  if (x.kind === 'dis' && disDone(x.site))     return { t:'فُكَّت', c:'ok' };
  if (x.when && x.when < dayKey(Date.now()))   return { t:'متأخّرة', c:'off' };
  return { t:'مطلوبة', c:'warn' };
}

/* ── الكتالوج: يُحرَّر ويُزاد ويُنقَص ─────────────────────────────────────
   كان مرسومًا بلا خاصيةٍ على أزراره، فيُكتَب ويُضغَط ولا يقع شيء. */
function itemSave(){
  STATE.items = itemsList().slice();
  CORE.set('cfg', 'items', STATE.items);
}

function movesList(){
  return (STATE.moves || []).slice().filter(Boolean)
    .sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
}

/* ═══ (V37.99) مفتاحُ الصنف واحدٌ في المخزن ═══
   كان التوريدُ والصرفُ اليدويُّ والفكُّ تُسجِّل الصنفَ باسمه («كاميرا مخيم 8361»)، والتركيبُ يُسجِّله
   برمزه («cam») — فيقع الصنفُ الواحدُ في صفّين: العهدةُ في صفِّ الاسم لا تنقص أبدًا بالتركيب، وصفُّ
   الرمز عهدتُه سالبة. صار كلُّ صنفٍ يُقرأ برمزه حين يُعرَف (رمزًا كان أو اسمًا)، ويُعرَض باسمه. لا ترحيلَ
   للبيانات: الحركاتُ القديمةُ تُدمَج عند القراءة. */
function itemKey(v){
  /* المخزنُ ماديّ: الصنفُ باسمه. الرمزُ يتعدّد للاسم الواحد (راوترُ المخيم وراوترُ الممر جهازٌ واحد بوزنين) */
  var s0 = String(v == null ? '' : v).trim(); if (!s0) return '\u2014';
  var L = itemsList(), i;
  for (i = 0; i < L.length; i++) if (L[i].code === s0) return L[i].name || s0;
  return s0;
}

/* ولحساب النقاط يُطلَب الرمز: رمزًا كان أو اسمًا (أوّلُ رمزٍ بهذا الاسم) */
function itemCode(v){
  var s0 = String(v == null ? '' : v).trim(), L = itemsList(), i;
  for (i = 0; i < L.length; i++) if (L[i].code === s0) return s0;
  for (i = 0; i < L.length; i++) if (L[i].name === s0) return L[i].code;
  return s0;
}

function stockBalance(){
  var bal = {};
  function row(item){
    var k = itemKey(item);
    if (!bal[k]) bal[k] = { item:k, key:k, store:0, custody:0, used:0, scrap:0 };
    return bal[k];
  }
  movesList().forEach(function(m){
    var r = row(m.item || '\u2014'), q = +m.qty || 0;
    if (m.kind === 'توريد')      r.store   += q;
    else if (m.kind === 'صرف'){  r.store   -= q; r.custody += q; }
    else if (m.kind === 'استهلاك'){ r.custody -= q; r.used += q; }
    else if (m.kind === 'تصحيح استهلاك'){ r.used -= q; r.custody += q; }   /* (V38.62) an installation lowered: back to the installer */
    /* (V37.99) ما يعود بالفكِّ يخرج من «رُكّب في الميدان» لا من عهدة الفني — كان يُخصَم من العهدة فتصير سالبةً
       ويبقى «رُكّب» منفوخًا بعد الموسم. يُعرَف بعلامته، والقديمُ بملاحظته «فك …» */
    else if (m.kind === 'إرجاع'){ if (m.dis || /^فك /.test(m.note || '')){ r.used -= q; } else { r.custody -= q; } r.store += q; }
    else if (m.kind === 'شطب'){   if (m.dis || /^فك /.test(m.note || '')){ r.used -= q; } else { r.custody -= q; } r.scrap += q; }
  });
  return Object.keys(bal).map(function(k){ return bal[k]; })
    .sort(function(a,b){ return (b.store + b.custody) - (a.store + a.custody); });
}

/* المنصرفُ يُحسَب مرةً في مكانٍ واحد: خمسةُ مواضعَ كانت تجمعه، ولو اختلف
   شرطُ واحدٍ منها عن الآخر تفرّقت الأرقامُ في تقريرٍ واحد. */
function buysSpent(){
  /* مصروفُ التجارب يدخل أو لا يدخل بحسب مفتاحِ الدفتر — والدفترُ يبقى كما هو.
     ومنذ V17.7 يشمل المصروفُ أصنافَ التجارب كما يشمل مشترياتِها المربوطة. */
  var inC = trialInCost();
  var base = buysList().reduce(function(a,b){
    if (b.st !== 'معتمد') return a;
    if (b.trial && !inC) return a;
    return a + (+b.amt || 0); }, 0);
  return base + (inC ? trialsItemsSpend() : 0);
}
