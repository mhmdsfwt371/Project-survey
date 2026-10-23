/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-02-inventory-workshop.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : Inventory, purchases and catalogue from movements, workshop requests (CR/AR/IR), request log and the single item key.
   DEFINES : seedOnce, itemsList, itemName, regList, regStatus, regSet, regDel, workReqList, workReqAdd, workReqComplete, workReqEdit, workReqCancel, itemSave, itemRename … (+11 more)
   GLOBALS : REG_KIND, MOVE_KINDS
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* ═══ طلباتُ الورشة: تهيئةٌ (CR) وتجميعٌ (AR) ═══
   كانت «طلبات المستودع» جدولَ تارجتاتٍ محسوبةً لا طلباتٍ فعلية — زرُّها
   معطَّلٌ بتصريحٍ صريح منذ V14.85. صار لكلِّ طلبٍ رقمٌ ومنفِّذٌ وتاريخٌ:
   يُطلب صنفٌ بكمية، وحين يُنفَّذ يُسجَّل في دفتر الحركة بنوعه الصحيح
   (تهيئة/تجميع) — فتُحسب نقاطُ scores() أخيرًا، لا تبقى صفرًا أبدًا. */

function regSet(id, patch){
  if (!may('approve')){ toast(t('تعديلُ الإسناد للمهندس وحده')); return; }
  var x = STATE.tasks[id];
  if (!x){ toast(t('لا إسنادَ بهذا المعرّف')); return; }
  if (x.status === 'معتمد'){ toast(t('إسنادٌ منجَزٌ لا يُعدَّل')); return; }
  var wasTo = x.to || '', wasWhen = x.when || '';
  Object.keys(patch).forEach(function(k){ x[k] = patch[k]; });
  CORE.set('tasks', id, x);
  logEvent('تعديل إسناد — ' + (x.no || id) + ' \u00b7 ' + wasTo + ' ' + wasWhen
           + ' \u2192 ' + (x.to || '') + ' ' + (x.when || ''));
  if (patch.to && patch.to !== wasTo)
    notifPush('إسناد', (x.no || '') + ' \u00b7 ' + x.site, { to:patch.to, site:x.site, lv:'عادي' });
  statBump();
}
function regDel(id){
  if (!may('approve')){ toast(t('حذفُ الإسناد للمهندس وحده')); return; }
  var x = STATE.tasks[id];
  if (!x) return;
  if (x.status === 'معتمد'){ toast(t('إسنادٌ منجَزٌ لا يُحذَف — نقاطُ صاحبه بُنيت عليه')); return; }
  if (x.kind === 'visit' && svDone(STATE.recs[x.site])){
    toast(t('زِيرت النقطةُ فعلًا — اعتمد الزيارةَ أو ردّها بدل الحذف')); return;
  }
  delete STATE.tasks[id]; if (typeof TK_IX !== 'undefined') TK_IX = null;
  CORE.rm('tasks', id);
  logEvent('حذف إسناد — ' + (x.no || id) + ' \u00b7 ' + x.site);
  toast(t('حُذف الإسناد'));
  statBump(); render(1);
}
function workReqList(){
  return Object.keys(STATE.workReqs || {}).map(function(k){ return STATE.workReqs[k]; })
    .sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
}
/* ═══ طلبُ صرفِ أصناف (IR) ═══
   كان صرفُ القطع من المستودع سطرًا يُكتَب في دفتر الحركة مباشرةً: لا رقمَ
   له ولا مُسنَدَ إليه ولا حالةَ تُتابَع — فمن طلب قطعًا لفنيٍّ لم يجد أين
   يسجّل الطلبَ حتى يُنفَّذ، ومن سُئل «أين طلبُ الصرف؟» لم يجد. صار نوعًا
   ثالثًا في طلبات الورشة بترقيمه (IR) ومُسنَدٍ إليه — فنيٍّ أو مشرف —
   وحين يُنفَّذ يُسجَّل «صرف» في دفتر الحركة باسم المُسنَد إليه، فتدخل القطعُ
   عُهدتَه لا عهدةَ من ضغط الزر. */
function workReqAdd(kind, item, qty, to){
  if (!may('edit')){ toast(t('طلبُ الورشة يحتاج صلاحية تعديل')); return; }
  var q = cfgN(qty);
  if (!item){ toast(t('اختر صنفًا')); return; }
  if (!q){ toast(t('اكتب كميةً غير صفر')); return; }
  if (kind === 'issue' && !to){ toast(t('اختر من يُصرَف له')); return; }
  var id = 'wr' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  var rec = { id:id, no:reqNext(kind, 'workReqs', id), kind:kind, item:item, qty:q, qtyDone:0,
              to:to || '', status:'مطلوب', by:STATE.meta.name || '', at:Date.now() };
  STATE.workReqs = STATE.workReqs || {};
  STATE.workReqs[id] = rec;
  CORE.set('workReqs', id, rec);
  logEvent({ prep:'طلب تهيئة — ', asm:'طلب تجميع — ', issue:'طلب صرف — ' }[kind] + rec.no + ' \u00b7 '
           + itemName(item) + ' \u00d7' + nm(q) + (to ? ' \u2190 ' + to : ''));
  if (to) notifPush('طلب صرف', rec.no + ' \u00b7 ' + itemName(item) + ' \u00d7' + nm(q), { to:to, lv:'عادي' });
  toast(rec.no + ' \u00b7 ' + t('أُنشئ الطلب'));
  statBump();
  render(1);
}
function workReqComplete(id, qtyDone){
  if (!may('edit')){ toast(t('تنفيذُ طلب الورشة يحتاج صلاحية تعديل')); return; }
  var r = STATE.workReqs && STATE.workReqs[id];
  if (!r){ toast(t('لا طلبَ بهذا المعرّف')); return; }
  var q = cfgN(qtyDone);
  if (!q){ toast(t('اكتب الكمية المُنفَّذة')); return; }
  var remain = r.qty - cfgN(r.qtyDone);
  if (q > remain){ toast(t('المتبقّي من الطلب') + ': ' + nm(remain)); return; }
  r.qtyDone = cfgN(r.qtyDone) + q;
  r.status = r.qtyDone >= r.qty ? 'تم' : 'قيد التنفيذ';
  r.doneBy = STATE.meta.name || '';
  r.doneAt = Date.now();
  CORE.set('workReqs', id, r);
  /* الصرفُ يُقيَّد باسم المُسنَد إليه — القطعُ تدخل عهدتَه هو */
  var mvKind = { prep:'تهيئة', asm:'تجميع', issue:'صرف' }[r.kind] || 'تهيئة';
  var mv = { id:uid36(), at:Date.now(), kind:mvKind, item:r.item, qty:q,
             by: r.kind === 'issue' ? (r.to || r.doneBy) : r.doneBy, req:r.no };
  STATE.moves = STATE.moves || [];
  STATE.moves.push(mv);
  CORE.dirty('moves', mv.id, mv);
  logEvent({ prep:'تنفيذ تهيئة — ', asm:'تنفيذ تجميع — ', issue:'تنفيذ صرف — ' }[r.kind] + r.no
           + ' \u00b7 ' + nm(q) + (r.kind === 'issue' && r.to ? ' \u2190 ' + r.to : ''));
  toast(r.no + ' \u00b7 ' + (r.status === 'تم' ? t('اكتمل الطلب') : t('تحديثٌ مُسجَّل')));
  statBump();
  render(1);
}
/* ═══ تعديلُ طلب الورشة ═══
   كان الطلبُ يُنشَأ ويُنفَّذ ويُلغى — ولا يُعدَّل. فمن كتب عشرةً وأراد اثنتي
   عشرةَ ألغى وأنشأ من جديدٍ برقمٍ جديد، فيبقى الرقمُ الأولُ في السجل بلا
   شيءٍ ويُسأل عنه. صار الصنفُ والكميةُ يُعدَّلان ما لم يُنفَّذ منه شيء —
   وبعد التنفيذ لا تُنقَص الكميةُ عمّا نُفِّذ فعلًا. */
function workReqEdit(id, item, qty){
  if (!may('edit')){ toast(t('تعديلُ طلب الورشة يحتاج صلاحية تعديل')); return; }
  var r = STATE.workReqs && STATE.workReqs[id];
  if (!r){ toast(t('لا طلبَ بهذا المعرّف')); return; }
  if (r.status === 'تم'){ toast(t('طلبٌ اكتمل لا يُعدَّل')); return; }
  var q = cfgN(qty), done = cfgN(r.qtyDone);
  if (!q){ toast(t('اكتب كميةً غير صفر')); return; }
  if (q < done){ toast(t('نُفِّذ منه') + ' ' + nm(done) + ' — ' + t('لا تُنقَص الكميةُ دونه')); return; }
  if (item && item !== r.item && done){ toast(t('نُفِّذ جزءٌ منه — لا يُبدَّل صنفُه')); return; }
  var was = itemName(r.item) + ' \u00d7' + nm(r.qty);
  if (item) r.item = item;
  r.qty = q;
  r.status = done >= q ? 'تم' : (done ? 'قيد التنفيذ' : 'مطلوب');
  r.editBy = STATE.meta.name || '';
  r.editAt = Date.now();
  CORE.set('workReqs', id, r);
  logEvent('تعديل طلب ورشة — ' + r.no + ' \u00b7 ' + was + ' \u2192 ' + itemName(r.item) + ' \u00d7' + nm(r.qty));
  toast(r.no + ' \u00b7 ' + t('عُدِّل الطلب'));
  statBump(); render(1);
}
function workReqCancel(id){
  if (!may('edit')){ toast(t('إلغاءُ طلب الورشة يحتاج صلاحية تعديل')); return; }
  var r = STATE.workReqs && STATE.workReqs[id];
  if (!r) return;
  if (r.qtyDone){ toast(t('طلبٌ نُفِّذ جزءٌ منه لا يُلغى — أكمله أو اتركه')); return; }
  delete STATE.workReqs[id];
  CORE.dirty('workReqs', id, null);
  logEvent('إلغاء طلب ورشة — ' + r.no);
  toast(t('أُلغي الطلب'));
  statBump();
  render(1);
}

function itemZone(code){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var x = itemsList().filter(function(i){ return i.code === code; })[0];
  if (!x) return;
  x.z = x.z === 'cor' ? 'camp' : 'cor';
  itemSave();
  logEvent('نقل صنف — ' + x.name + ' → ' + (x.z === 'cor' ? 'ممر' : 'مخيم'));
  toast(t('نُقل إلى') + ' ' + t(x.z === 'cor' ? 'الممر' : 'المخيم'));
  render(1);
}
function itemDel(code){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var L = itemsList(), i = -1;
  L.forEach(function(x, k){ if (x.code === code) i = k; });
  if (i < 0) return;
  /* المستعملُ في تركيبٍ قائمٍ لا يُحذَف — وإلا فقدت السجلاتُ أسماءَ قطعها */
  var u = 0;
  Object.keys(STATE.inss || {}).forEach(function(id){
    var r = STATE.inss[id];
    if (r && r.parts && r.parts[code]) u++;
  });
  if (u){ toast(t('مستعملٌ في') + ' ' + nm(u) + ' ' + t('تركيبًا — لا يُحذَف')); return; }
  /* وما في طلبِ ورشةٍ مفتوحٍ أو حلٍّ مقترَحٍ أو معتمَدٍ لا يُحذَف — وإلا أشار
     الطلبُ والحلُّ إلى صنفٍ لا يوجد */
  var inReq = workReqList().filter(function(r){ return r.item === code && r.status !== 'تم'; }).length;
  var inSol = 0;
  Object.keys(STATE.inss || {}).forEach(function(id){
    var so = STATE.inss[id] && STATE.inss[id].solution;
    if (so && so.items && so.items[code]) inSol++;
  });
  if (inReq || inSol){
    toast(t('مستعملٌ في') + ' ' + nm(inReq) + ' ' + t('طلبَ ورشةٍ و') + nm(inSol) + ' ' + t('حلًّا — لا يُحذَف'));
    return;
  }
  var nm2 = L[i].name;
  L.splice(i, 1);
  itemSave();
  logEvent('حذف صنف — ' + nm2);
  toast(t('حُذف'));
  render(1);
}
/* إخراجُ صنفٍ من مرحلة: نقاطُه صفرٌ فيخرج — والصنفُ يبقى في الكتالوج،
   فالخروجُ من التهيئة ليس حذفًا من الوجود. */
function stageOut(path, code){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  cfgSet(path, code, 0);
  logEvent('إخراج من المرحلة — ' + itemName(code) + ' · ' + path);
  toast(t('أُخرِج من المرحلة'));
  render(1);
}
/* إضافةُ صنفٍ من شاشة المرحلة: يُنشَأ في الكتالوج ويُعطى نقاطَ مرحلته دفعةً */
function stageAdd(path){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var name = g('itN');
  if (!name){ toast(t('اكتب اسم القطعة')); return; }
  if (itemsList().some(function(i){ return i.name === name; })){ toast(t('موجودٌ بالفعل')); return; }
  var code = 'it' + Date.now().toString(36);
  itemsList().push({ z:g('itZ') || 'camp', code:code, name:name, pts:0, price:0, prep:0, asm:0 });
  itemSave();
  cfgSet(path, code, +g('itS') || 0);
  logEvent('صنف جديد — ' + name + ' · ' + path);
  toast(t('أُضيف الصنف'));
  render(1);
}

function itemAdd(){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var name = g('itN');
  if (!name){ toast(t('اكتب اسم القطعة')); return; }
  if (itemsList().some(function(i){ return i.name === name; })){ toast(t('موجودٌ بالفعل')); return; }
  var code = 'it' + Date.now().toString(36);
  itemsList().push({ z:g('itZ') || 'camp', code:code, name:name,
                     pts:+g('itP') || 0, price:+g('itR') || 0, prep:0, asm:0 });
  itemSave();
  cfgSet('itPts', code, +g('itP') || 0);
  cfgSet('itPrice', code, +g('itR') || 0);
  logEvent('صنف جديد — ' + name);
  toast(t('أُضيف الصنف'));
  render(1);
}

/* ── المخزن: الميزانُ من الحركات ──
   توريدٌ يزيد المخزن. وصرفٌ ينقله إلى عهدة المنفِّذ. واستهلاكٌ يُخرجه من
   العهدة إلى الميدان. وإرجاعٌ يعيده. وشطبٌ يعزله تالفًا. */
var MOVE_KINDS = ['توريد','صرف','استهلاك','إرجاع','شطب'];

function moveAdd(){
  if (!may('inventory')){ toast(t('المخزونُ للمهندس وحده')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var kind = g('mvKind'), item = g('mvItem'), qty = +g('mvQty') || 0;
  if (!kind || MOVE_KINDS.indexOf(kind) < 0){ toast(t('اختر نوع الحركة')); return; }
  if (!item){ toast(t('اختر الصنف')); return; }
  if (qty <= 0){ toast(t('الكميةُ أكبرُ من صفر')); return; }
  /* الصرفُ وما بعده لا يتجاوز المتاح — والرصيدُ السالب عطلٌ لا حالة */
  var b = stockBalance().filter(function(x){ return x.key === itemKey(item); })[0]   /* (V37.99) بالمفتاح الواحد */
       || { store:0, custody:0 };
  if (kind === 'صرف' && qty > b.store){
    toast(t('المتاحُ في المخزن') + ': ' + nm(b.store)); return; }
  if (['استهلاك','إرجاع','شطب'].indexOf(kind) > -1 && qty > b.custody){
    toast(t('المتاحُ في العُهدة') + ': ' + nm(b.custody)); return; }

  var id = uid36();
  var mv = { id:id, kind:kind, item:item, qty:qty,
             by:g('mvBy'), site:g('mvSite'), note:g('mvNote'),
             at:Date.now(), user:STATE.meta.name || '' };
  STATE.moves = STATE.moves || [];
  STATE.moves.push(mv);
  CORE.dirty('moves', id, mv);
  logEvent('حركة مخزون — ' + kind + ' · ' + item + ' × ' + nm(qty));
  toast(t('سُجّلت الحركة'));
  render(1);
}

