/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-02-approvals-governance.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Approvals from proposal to decision, ministry financial summary, governance gaps, escalation, responsibility matrix and stage chain.
   DEFINES : fixList, coReqList, buyPend, fixOpen, fixCard, fixSend, coAddDirect, coRemove, apprDecide, escList, escSave, escSet, escAdd, escDel … (+7 more)
   GLOBALS : FIX_OPEN, ESC_RULES
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الاعتمادات: من الاقتراح إلى القرار ═══════════════════════════════════
   كانت الشاشةُ أربعةَ أصفارٍ ثابتةٍ ورسمًا للدورة — «يقترح المشرف ← يراجع
   المهندس ← يُعتمد أو يُردّ» — ودورةٌ مرسومةٌ لا تُنفَّذ أسوأُ من غيابها:
   يقرؤها المشرفُ فيقترح، ولا يجد المهندسُ ما يعتمده.

   والمقترحاتُ ثلاثةُ أنواعٍ لكلٍّ مصدرُه:
     · شركةٌ جديدة   — من الميدان عند تسجيل موقعٍ مقترح
     · تصويبُ بيان   — من نموذج المسح حين يجد الفنيُّ خلافَ المسجَّل
     · مشترًى فوق الحدّ — يُنشئه النظامُ حين يتجاوز المبلغُ حدَّ الاعتماد
       المضبوطَ في «الميزانية والاعتماد» */

function fixList(){
  var F = STATE.fixreqs || {};
  return Object.keys(F).map(function(k){ return F[k]; }).filter(Boolean);
}
function coReqList(){
  var C = STATE.coreqs || {};
  return Object.keys(C).map(function(k){ return C[k]; })
    .filter(function(x){ return x && x.status === 'مطلوب'; });
}
function buyPend(){
  return buysList().filter(function(b){ return b.st !== 'معتمد'; });
}

/* طلبُ تصويبٍ من الميدان — كان زرًّا يقول «طُلب» ولا يكتب شيئًا،
   فيمضي الفنيُّ مطمئنًّا والخطأُ باقٍ في السجل. */
var FIX_OPEN = '';
function fixOpen(id){ FIX_OPEN = FIX_OPEN === id ? '' : id; render(1); }

function fixCard(siteId){
  if (FIX_OPEN !== siteId) return '';
  var FIELDS = [['sq','رقم المربع'], ['sign','رقم الشاخص'], ['co','شركة تقديم الخدمة'],
                ['inout','تصنيف الحجاج'], ['work','وجه العمل'], ['zone','المشعر'],
                ['type','نوع الموقع'], ['name','اسم الموقع']];
  return card('طلب تصويب بيان',
    '<div class="grid cols-2">'
    + '<div class="field"><label>' + esc(t('الحقل')) + '</label><select id="fxField">'
    +   FIELDS.map(function(f){ return '<option value="' + f[0] + '">' + esc(t(f[1])) + '</option>'; }).join('')
    + '</select></div>'
    + '<div class="field"><label>' + esc(t('القيمة الصحيحة')) + '</label>'
    +   '<input id="fxVal" dir="auto"></div>'
    + '</div>'
    + '<div class="field"><label>' + esc(t('لماذا؟')) + '</label>'
    + '<textarea id="fxWhy" rows="2" placeholder="'
    +   esc(t('ما رأيتَه في الموقع — والمهندسُ يقرّر على ما تكتب')) + '"></textarea></div>'
    + '<div class="actions">'
    + btn('أرسل الطلب','btn-primary',' data-fixsend="' + esc(siteId) + '"')
    + btn('إلغاء','btn-quiet',' data-fix="0"')
    + '</div>');
}

function fixSend(siteId){
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var field = g('fxField'), val = g('fxVal'), why = g('fxWhy');
  if (!val){ toast(t('اكتب القيمة الصحيحة')); return; }
  if (!why){ toast(t('اكتب سببَ التصويب — عليه يقرّر المهندس')); return; }
  var x = siteFind(siteId) || {};
  var id = uid36();
  var r = { id:id, site:siteId, field:field, was:String(x[field] || ''), val:val, why:why,
            by:STATE.meta.name || '', at:Date.now(), status:'مطلوب' };
  if (!STATE.fixreqs) STATE.fixreqs = {};
  STATE.fixreqs[id] = r;
  CORE.set('fixreqs', id, r);
  logEvent('طلب تصويب — ' + siteId + ' · ' + field + ' → ' + val);
  notifPush('تصويب بيان', 'طلبُ تصويبٍ بانتظار اعتمادك — ' + siteId, { site:siteId, lv:'مهم' });
  FIX_OPEN = '';
  toast(t('أُرسل الطلب — يعتمده المهندس'));
  render(1);
}

/* القرار: اعتمادٌ يُنفِّذ الأثر، وردٌّ يُبقيه مكتوبًا بسببه.
   ولا يُحذَف الطلبُ في الحالين — الأثرُ التدقيقيُّ يبقى. */
/* إضافةُ شركةٍ مباشرةً — لمن يملك الاعتماد. تُسجَّل طلبًا معتمدًا في
   اللحظة نفسها فتمرُّ بالمسار الذي تمرُّ به كلُّ شركة، ويبقى أثرُها. */
function coAddDirect(name){
  if (!may('approve')){ toast(t('إضافةُ الشركات للمهندس وحده')); return false; }
  name = String(name || '').trim();
  if (!name){ toast(t('اكتب اسم الشركة أولًا')); return false; }
  if (CO_LIST.indexOf(name) > -1){ toast(t('موجودة في القائمة')); return false; }
  if (!STATE.coreqs) STATE.coreqs = {};
  var who = STATE.meta.name || '', now = Date.now();
  STATE.coreqs[name] = { name:name, by:who, at:now, status:'معتمد', by2:who, at2:now, direct:true };
  CORE.set('coreqs', name, STATE.coreqs[name]);
  CO_LIST.push(name); CO_LIST.sort(arCmp);
  logEvent('إضافة شركة — ' + name);
  toast(t('أُضيفت الشركة')); return true;
}
/* حذفُ شركةٍ أُضيفت يدويًّا — لا شركةٌ عليها مواقع، فأسماؤها في السجل */
function coRemove(name){
  if (!may('approve')){ toast(t('حذفُ الشركات للمهندس وحده')); return; }
  var used = (STATE.sites || []).filter(function(x){ return x.co === name; }).length;
  if (used){ toast(t('عليها مواقعُ — انقلها أولًا') + ' (' + nm(used) + ')'); return; }
  var c = (STATE.coreqs || {})[name];
  if (!c){ toast(t('من السجل الأصلي — لا تُحذف')); return; }
  delete STATE.coreqs[name]; CORE.dirty('coreqs', name, null);
  var i = CO_LIST.indexOf(name); if (i > -1) CO_LIST.splice(i, 1);
  logEvent('حذف شركة — ' + name);
  toast(t('حُذفت')); render(1);
}

function apprDecide(kind, id, ok, why){
  if (!may('approve')){ toast(t('الاعتمادُ للمهندس وحده')); return; }
  var now = Date.now(), who = STATE.meta.name || '';

  if (kind === 'co'){
    var c = (STATE.coreqs || {})[id];
    if (!c) return;
    c.status = ok ? 'معتمد' : 'مرفوض'; c.by2 = who; c.at2 = now; c.why2 = why || '';
    CORE.set('coreqs', id, c);
    if (ok && CO_LIST.indexOf(c.name) < 0){ CO_LIST.push(c.name); CO_LIST.sort(arCmp); }
    logEvent((ok ? 'اعتماد شركة — ' : 'رفض شركة — ') + c.name + (why ? ' · ' + why : ''));
    notifPush(ok ? 'اعتماد' : 'رفض', (ok ? 'اعتُمدت الشركة: ' : 'رُفضت الشركة: ') + c.name,
              { to:c.by || '', lv:'مهم' });
  }

  else if (kind === 'fix'){
    var f = (STATE.fixreqs || {})[id];
    if (!f) return;
    f.status = ok ? 'معتمد' : 'مرفوض'; f.by2 = who; f.at2 = now; f.why2 = why || '';
    CORE.set('fixreqs', id, f);
    if (ok){
      var x = siteFind(f.site);
      /* التصويبُ يُطبَّق على السجل — وإلا فما معنى اعتماده */
      if (x){ x[f.field] = f.val; SITE_IX = null; SITE_TOK = null; statBump(); }
    }
    logEvent((ok ? 'اعتماد تصويب — ' : 'رفض تصويب — ') + f.site + ' · ' + f.field
             + (why ? ' · ' + why : ''), f.site);   /* (V31.1) كان `site` غيرَ معرَّفٍ فيرمي خطأً */
    notifPush(ok ? 'اعتماد' : 'رفض',
              (ok ? 'اعتُمد تصويبُك — ' : 'رُفض تصويبُك — ') + f.site, { to:f.by || '', lv:'مهم' });
  }

  else if (kind === 'buy'){
    var b = (STATE.buys || {})[id];
    if (!b) return;
    b.st = ok ? 'معتمد' : 'مرفوض'; b.by2 = who; b.at2 = now; b.why2 = why || '';
    CORE.set('buys', id, b);
    logEvent((ok ? 'اعتماد مشترى — ' : 'رفض مشترى — ') + b.item + ' · ' + nm(b.amt)
             + (why ? ' · ' + why : ''));
    notifPush(ok ? 'اعتماد' : 'رفض',
              (ok ? 'اعتُمد المشترى: ' : 'رُفض المشترى: ') + b.item + ' · ' + nm(b.amt),
              { to:b.by || '', lv:'مهم' });
  }

  toast(t(ok ? 'اعتُمد' : 'رُدّ'));
  render(1);
}


/* حساب المستخدم */
PAGE.acct = { m:'المساعدة', t:'حسابي', l:'دورك وصلاحياتك ونسختك — وإعداداتُ هذا الجهاز.',
  body:function(){
    var r = R();
    var keys = [['edit','تحرير البيانات'],['approve','الاعتمادات'],['settings','الإعدادات'],
                ['money','المال والمشتريات'],['inventory','المخزون والعُهدة'],['workshop','الورشة'],
                ['exportAll','التصدير الكامل'],['importAll','الاستيراد'],
                ['users','إدارة المستخدمين'],['phones','أرقام الهواتف']];
    return card('دوري',
        '<div class="pop-rows" style="margin:0">'
        + '<div><span class="k">'+esc(t('الاسم'))+'</span><span>'+esc(dispName(STATE.meta.name || ''))+'</span></div>'
        + '<div><span class="k">'+esc(t('الدور'))+'</span>'+pill(r.n,'acc')+'</div>'
        + '<div><span class="k">'+esc(t('الوصف'))+'</span><span>'+esc(t(r.d))+'</span></div>'
        + '<div><span class="k">'+esc(t('النسخة'))+'</span><span class="num">' + esc(appVer()) + '</span></div>'
        + '</div>')
      + card('ما أملكه',
          table(['الصلاحية','لي'],
            keys.map(function(k){
              return [esc(t(k[1])), may(k[0]) ? pill('نعم','ok') : pill('لا','off')];
            })))
      /* تبديلُ الدور إدارةُ صلاحياتٍ لا معاينة: من ملكه ملك كلَّ شيء.
         كان ظاهرًا لكلِّ دورٍ فيجعل المشرفُ نفسَه مهندسًا بضغطة. */
      + (may('users')
        ? card('تجربة الأدوار',
          '<p class="hint" style="margin:0 0 11px">'
          + esc(t('بدّل الدور لترى النظام بعين صاحبه — القائمة والشاشات تتغيّر فورًا.'))+'</p>'
          + '<div class="chips" style="margin:0">'
          + Object.keys(ROLES).map(function(k){
              return '<button type="button" class="chip'+(ROLE===k?' on':'')+'" data-role="'+k+'">'
                + esc(t(ROLES[k].n))+'</button>';
            }).join('') + '</div>')
        : '')
      + iosHelpCard()
      + card('التطبيق على الجهاز',
          '<p class="hint" style="margin:0 0 11px">'
          + esc(t(pwaStandalone()
              ? 'مثبَّتٌ ويعمل ملءَ الشاشة — يفتح بلا شبكةٍ وتصله الإشعارات.'
              : 'ثبّته على الشاشة الرئيسية: يفتح ملءَ الشاشة، ويعمل بلا شبكة، وتصله الإشعارات.'))
          + '</p>'
          + '<div class="actions">'
          /* كان مخفيًّا حتى يقع حدثُ التثبيت — وآيفونُ لا يقع فيه حدثٌ أبدًا،
             فيبقى مخفيًّا على نصف أجهزة الميدان. */
          + '<button type="button" class="btn btn-primary" id="pwaBtn" data-pwa="1">'
          +   '⬇ ' + esc(t('ثبّت التطبيق')) + '</button>'
          + btn('أفرغ الكاش','btn-danger',' data-swclear="1"')

          + '</div>'
          + '<p class="hint">' + esc(t('التثبيت يُبقي التطبيق عاملًا بلا شبكة، والإفراغُ يُجبره على تحميلٍ نظيفٍ عند أول اتصال.')) + '</p>'
          + '<p class="hint" id="libsLine" style="margin:6px 0 0"></p>')   /* (V38.54) vendored libraries on this device */
      + (setTimeout(libsLinePaint, 0), '')
      + '<p class="hint">' + esc(t('إشارات الأجهزة أسرع ما ينمو:')) + ' <b class="num">' + nm((STATE.sites || []).length) + '</b> ' + esc(t('جهازًا × إشارة كل خمس دقائق = نصف مليون سجل يوميًّا لو تُركت بلا سقف.')) + '</p>'
      + deviceCards();
  }};

/* ── ٦ · تعارض المزامنة ───────────────────────────
   الميدان بلا شبكة، وتحريران على نقطة واحدة يتصادمان. */


/* المحدَّد — بعد التحديد المتعدد من الخريطة */


/* ═══ الملخّصُ المالي للوزارة — إجمالٌ بلا مورّدٍ ولا فاتورة ═══
   المتابعةُ تحتاج الرقمَ لا التفصيل: كم أُنفق ومن أيّ باب، لا من مَن اشتُري. */

/* ═══ الحوكمة — أربع فجوات تُسدّ ═══ */

/* ── ٢ · مسار التصعيد ─────────────────────────────
   الحالة العالقة تظهر في «الراكد» ولا يُخطَر أحد. القاعدة تُصعّد بالعمر. */

var ESC_RULES = [
  ['متعذّر بلا معالجة',      7,  'المشرف',  'المهندس',   'يُعاد فتحه ويُسند لفريق آخر'],
  ['مقترح شركة بانتظار',      3,  'المهندس', 'المهندس',   'يُذكَّر يوميًّا حتى يُبتّ'],
  ['طلب زيارة بلا تنفيذ',    5,  'الفني',   'المشرف',    'يُعاد إسناده'],
  ['نقطة مجدولة لم تُركّب',   10, 'الفريق',  'المهندس',   'تخرج من الجدولة وتعود للطابور'],
  ['تركيب بانتظار التدقيق',  3,  'المهندس', 'المهندس',   'يُعتمد أو يُردّ بسبب'],
  ['مشترى فوق الحد',          2,  'المهندس', 'المهندس',   'يُعتمد أو يُلغى'],
  ['جهاز صامت',              1,  'المهندس', 'المهندس',   'يدخل قائمة الزيارة الميدانية'],
  ['عُهدة لم تُرجَع بعد الفك', 14, 'الفريق',  'المهندس',   'تُحتسب عجزًا على المنفِّذ']
];

/* ═══ التصعيد والمسؤوليات: قوائمُ تُدار لا جداولُ تُقرأ ═══════════════════
   كانت قواعدُ التصعيد جدولًا ثابتًا وزرَّ «حفظ القواعد» بلا خاصية: يُغيَّر
   العددُ ويُضغَط الزرُّ فيُقال «حفظ القواعد» ولا يُحفَظ شيء. والقاعدةُ التي
   لا تُضبَط لا يُصعَّد بها، فيبقى المتعذّرُ متعذّرًا إلى نهاية الموسم. */

function escList(){
  if (!Array.isArray(STATE.escRules) || !STATE.escRules.length){
    STATE.escRules = ESC_RULES.map(function(r){
      return { w:r[0], days:r[1], who:r[2], to:r[3], act:r[4] };
    });
  }
  return STATE.escRules;
}
function escSave(){ CORE.set('cfg', 'escRules', escList().slice()); }
function escSet(i, patch){
  if (!may('settings')) return;
  var r = escList()[i]; if (!r) return;
  Object.keys(patch).forEach(function(k){ r[k] = patch[k]; });
  escSave();
}
function escAdd(){
  if (!may('settings')){ toast(t('قواعدُ التصعيد للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var w2 = g('esW');
  if (!w2){ toast(t('اكتب الحالة')); return; }
  escList().push({ w:w2, days:+g('esD') || 3, who:g('esWho'), to:g('esTo'), act:g('esAct') });
  escSave(); logEvent('قاعدة تصعيد — ' + w2);
  toast(t('أُضيفت القاعدة')); render(1);
}
function escDel(i){
  if (!may('settings')){ toast(t('قواعدُ التصعيد للمهندس وحده')); return; }
  var L = escList(); if (!L[i]) return;
  var w2 = L[i].w; L.splice(i, 1); escSave();
  logEvent('حذف قاعدة تصعيد — ' + w2);
  toast(t('حُذفت')); render(1);
}

/* ما تجاوز مهلتَه فعلًا — من الاعتمادات والمسوح المتعذّرة */
function escDue(){
  var out = [], now = Date.now(), DAY = 86400000;
  var byW = {};
  escList().forEach(function(r){ byW[r.w] = r; });

  (typeof coReqList === 'function' ? coReqList() : []).forEach(function(c){
    var r = byW['مقترح شركة بانتظار']; if (!r) return;
    var d = Math.floor((now - (c.at || now)) / DAY);
    if (d >= r.days) out.push({ w:r.w, what:c.name, days:d, to:r.to, act:r.act });
  });
  Object.keys(STATE.recs || {}).forEach(function(id){
    var rec = STATE.recs[id];
    if (!rec || (typeof svDone === 'function' && svDone(rec))) return;
    var r = byW['متعذّر بلا معالجة']; if (!r) return;
    var d = Math.floor((now - (rec.at || now)) / DAY);
    if (d >= r.days) out.push({ w:r.w, what:id, days:d, to:r.to, act:r.act });
  });
  (typeof buyPend === 'function' ? buyPend() : []).forEach(function(b){
    var r = byW['مشترًى فوق الحد'] || byW['مقترح شركة بانتظار']; if (!r) return;
    var d = Math.floor((now - (b.at || now)) / DAY);
    if (d >= r.days) out.push({ w:'مشترًى بانتظار الاعتماد', what:b.item, days:d, to:r.to, act:r.act });
  });
  return out.sort(function(a, b){ return b.days - a.days; });
}


/* ═══ مصفوفة المسؤوليات ═══ */
function raciList(){
  if (!Array.isArray(STATE.raci) || !STATE.raci.length){
    STATE.raci = RACI_ACTS.map(function(r){ return { a:r[0], R:r[1], A:r[2], C:r[3], I:r[4] }; });
  }
  return STATE.raci;
}
function raciSave(){ CORE.set('cfg', 'raci', raciList().slice()); }
function raciSet(i, patch){
  if (!may('settings')) return;
  var r = raciList()[i]; if (!r) return;
  Object.keys(patch).forEach(function(k){ r[k] = patch[k]; });
  raciSave();
}
function raciAdd(){
  if (!may('settings')){ toast(t('المصفوفةُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var a = g('rcA');
  if (!a){ toast(t('اكتب النشاط')); return; }
  raciList().push({ a:a, R:g('rcR'), A:g('rcAc'), C:g('rcC'), I:g('rcI') });
  raciSave(); logEvent('نشاط في المصفوفة — ' + a);
  toast(t('أُضيف النشاط')); render(1);
}
function raciDel(i){
  if (!may('settings')){ toast(t('المصفوفةُ للمهندس وحده')); return; }
  var L = raciList(); if (!L[i]) return;
  var a = L[i].a; L.splice(i, 1); raciSave();
  logEvent('حذف نشاط من المصفوفة — ' + a);
  toast(t('حُذف')); render(1);
}

/* ── ٣ · سجل التدقيق ──────────────────────────────
   العملية تُسجَّل ولا يُعرف من غيّرها ولا لماذا رُفضت. */

/* ═══ سلسلةُ المراحل: كلُّ عددٍ من الذي قبله ═════════════════════════════════
   العددُ الثابت التزامٌ، والعددُ المشتقُّ تقدير. وهذه الأعدادُ ليست نهائيةً
   بطبعها: المواقعُ لم تُمسَح بعدُ فما يُفكُّ يزيد، وما يُهيَّأ لا يُعرَف إلا
   بعد المسح، وما يُركَّب يتبع المسحَ، وما يُفَكُّ يتبع التركيب.

   فتُعرَض السلسلةُ كما هي: أساسُ كلِّ مرحلةٍ هو منجَزُ ما قبلها، وما لم يقع
   بعدُ يُقال «بانتظار ما قبله» لا يُقدَّر برقم. */

function chainRows(){
  var S = siteStats();
  var ins = Object.keys(STATE.inss || {}).map(function(k){ return STATE.inss[k]; }).filter(Boolean);
  var dis = Object.keys(STATE.diss || {}).map(function(k){ return STATE.diss[k]; }).filter(Boolean);
  var prep = Object.keys(STATE.wos || {}).map(function(k){ return STATE.wos[k]; }).filter(Boolean);
  var okIns = ins.filter(function(x){ return x.approved; }).length;

  return [
    { k:'sites', n:'المواقع المسجَّلة', base:'—', baseN:0,
      done:S.total, d:'الأصلُ الذي تُبنى عليه المراحلُ كلُّها.' },
    { k:'sv', n:'المسح', base:'المواقع المسجَّلة', baseN:S.total,
      done:S.surveyed, d:'كلُّ موقعٍ مسجَّلٍ يُمسَح — والعددُ يزيد بتسجيل مواقعَ جديدة.' },
    { k:'prep', n:'التهيئة', base:'ما مُسح', baseN:S.surveyed,
      done:prep.filter(function(x){ return x.kind === 'prep' && x.done; }).length,
      d:'لا تُعرَف حاجةُ التهيئة إلا بعد المسح — فهو الذي يقول ما في الموقع.' },
    { k:'asm', n:'التجميع', base:'ما هُيِّئ', baseN:prep.filter(function(x){ return x.kind === 'prep' && x.done; }).length,
      done:prep.filter(function(x){ return x.kind === 'asm' && x.done; }).length,
      d:'ما هُيِّئ يُجمَّع قبل النزول.' },
    { k:'ins', n:'التركيب', base:'ما مُسح', baseN:S.surveyed,
      done:S.installed, d:'يُركَّب ما مُسح — لا ما سُجّل.' },
    { k:'ok', n:'الاعتماد', base:'ما رُكّب', baseN:S.installed,
      done:okIns, d:'يُعتمَد ما رُكّب بعد التدقيق.' },
    { k:'dis', n:'الفك', base:'ما اعتُمد', baseN:okIns,
      done:dis.filter(function(x){ return x.status === 'تم الفك'; }).length,
      d:'يُفَكُّ ما رُكّب واعتُمد — والعددُ لا يُعرَف قبل التركيب.' }
  ];
}


/* ── ٤ · عمر البيانات ─────────────────────────────
   سجل إلحاقي بلا سقف ينمو حتى يخنق الموسم. */


