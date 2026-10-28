/* ============================================================================
   FILE    : src/03zz-late/08-events--08-data-events-boot-02-approvals-governance.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/08-events/08-data-events-boot-02-approvals-governance.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : buyPend, fixOpen, fixSend, coAddDirect, coRemove, apprDecide, escAdd, escDel, escDue, raciAdd, raciDel, chainRows
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function buyPend(){
  return buysList().filter(function(b){ return b.st !== 'معتمد'; });
}

function fixOpen(id){ PV.FIX_OPEN = PV.FIX_OPEN === id ? '' : id; render(1); }

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
  PV.FIX_OPEN = '';
  toast(t('أُرسل الطلب — يعتمده المهندس'));
  render(1);
}

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
