
/* ═══════════════════════════════════════════════════════════════════════════════
   التعديلُ الموحّد (V36.2) — طلبُ المالك: «لازم تعديل وحذف وإضافة لكل التفاصيل في النظام»
   ───────────────────────────────────────────────────────────────────────────────
   كثيرٌ من سجلّات الإعدادات كان فيها «أضف» و«احذف» ولا «عدّل» — فيُحذَف العنصرُ ويُكتَب من جديد ويضيع تاريخُه.
   هنا سجلٌّ واحدٌ يصف كلَّ قائمة: من أين تُقرأ، وبمَ يُعرَف العنصر (معرّفٌ أو موضعٌ في القائمة)، وحقولُه، ودالّةُ حفظها، ومن
   يملك التعديل. وبعد كلِّ رسمٍ يُلحَق زرُّ «✎ تعديل» بجوار كلِّ زرِّ حذفٍ مسجَّلٍ هنا (gedInject) — فلا تُمسّ شاشاتُها،
   ونافذةٌ واحدةٌ تعدّل أيَّ عنصر (gedHtml/gedSave). قائمةٌ جديدةٌ تُضاف بسطرٍ هنا، وجردُ الإضافة والتعديل والحذف يمشيها كلَّها.
   ═══════════════════════════════════════════════════════════════════════════════ */
var GED = null;   /* العنصرُ المفتوحُ للتعديل: { k:نوعُ القائمة, id:مفتاحُه } */
var GED_REG = {
  rk:  { t:'خطر',           del:'rkdel',  list:function(){ return risksList(); },  key:'id',  save:function(){ riskSave(); }, may:'settings',
         f:[['t','وصف الخطر'], ['cat','الفئة'], ['p','الاحتمال (١–٥)','n'], ['i','الأثر (١–٥)','n'], ['resp','الاستجابة'], ['plan','الخطة'], ['own','المالك'], ['st','الحالة']] },
  ls:  { t:'درس مستفاد',     del:'lsdel',  list:function(){ return lessList(); },   key:'#',   save:function(){ lessSave(); }, may:'settings',
         f:[['p','المرحلة'], ['w','ما وقع'], ['a','ما نفعله بعده']] },
  es:  { t:'قاعدة تصعيد',    del:'esdel',  list:function(){ return escList(); },    key:'#',   save:function(){ escSave(); }, may:'settings',
         f:[['w','الحالة'], ['days','بعد كم يوم','n'], ['who','المسؤول'], ['to','يُصعَّد إلى'], ['act','الإجراء']] },
  rc:  { t:'نشاط في المصفوفة', del:'rcdel', list:function(){ return raciList(); },   key:'#',   save:function(){ raciSave(); }, may:'settings',
         f:[['a','النشاط'], ['R','المنفّذ'], ['A','المحاسَب'], ['C','المستشار'], ['I','المُبلَّغ']] },
  jb:  { t:'وظيفة',          del:'jbdel',  list:function(){ return jobsList(); },   key:'id',  save:function(){ jobSave(); }, may:'users',
         f:[['n','اسم الوظيفة'], ['d','الوصف']] },
  vk:  { t:'نوع سيارة',      del:'vkdel',  list:function(){ return vehKinds(); },   key:'id',  save:function(){ vehKindSave(); }, may:'settings',
         f:[['n','اسم النوع'], ['d','الوصف'], ['cap','السعة','n']] },
  ty:  { t:'نوع نقطة',       del:'tydel',  list:function(){ return typesList(); },  key:'@',   save:function(){ typesSave(); }, may:'settings',
         f:[['l','الاسم المعروض'], ['i','الرمز'], ['c','اللون']] },
  vh:  { t:'سيارة',          del:'vhdel',  list:function(){ return STATE.vehicles || {}; }, key:'@', save:function(id, x){ vehSave(x); }, may:'fleet',
         f:[['plate','رقم اللوحة'], ['model','الموديل'], ['year','سنة الصنع'], ['lic','رقم الرخصة'], ['licExp','انتهاء الرخصة'], ['insExp','انتهاء التأمين'], ['own','الملكية'], ['cost','التكلفة الشهرية','n'], ['note','ملاحظة']] },
  sh:  { t:'شحنة',           del:'shdel',  list:function(){ return STATE.ships || {}; },    key:'@', save:function(id, x){ shipSave(x); }, may:'inventory',
         f:[['ref','رقم الشحنة'], ['item','الصنف'], ['qty','الكمية','n'], ['sup','المورّد'], ['sent','تاريخ الإرسال'], ['eta','الوصول المتوقع']] },
  bn:  { t:'نقاط زيادة',     del:'bndel',  list:function(){ return STATE.bonus || {}; },    key:'@', save:function(id, x){ CORE.set('bonus', id, x); statBump(); }, may:'approve',
         f:[['tech','الفني'], ['pts','النقاط','n'], ['note','السبب']] },
  it:  { t:'صنف',            del:'itdel',  list:function(){ return itemsList(); },  key:'code', save:function(id, x){ itemSave(); cfgSet('itPts', id, +x.pts || 0); cfgSet('itPrice', id, +x.price || 0); }, may:'settings',
         f:[['name','اسم الصنف'], ['pts','النقاط','n'], ['price','السعر','n']] }
};
/* القائمةُ النصيةُ البسيطة (الموردون والفئات): العنصرُ نصٌّ واحد */
GED_REG.sup = { t:'مورّد', del:'suprm', list:function(){ return supList(); }, key:'=', save:function(){ CORE.set('cfg', 'sups', supList().slice()); }, may:'money', f:[['=','الاسم']] };
GED_REG.cat = { t:'فئة مشتريات', del:'catrm', list:function(){ return catList(); }, key:'=', save:function(){ CORE.set('cfg', 'cats', catList().slice()); }, may:'money', f:[['=','الاسم']] };

function gedPerm(R){ return typeof may === 'function' && (may(R.may) || may('settings')); }
/* العنصرُ وموضعُه من مفتاح زرِّ الحذف: «#» موضعٌ في القائمة، «@» مفتاحُ كائن، «=» النصُّ نفسُه، وغيرُه اسمُ حقلِ المعرّف */
function gedFind(k, id){
  var R = GED_REG[k]; if (!R) return null; var L = R.list(); if (!L) return null;
  if (R.key === '#'){ var i = +id; return L[i] ? { x:L[i], i:i } : null; }
  if (R.key === '@') return L[id] ? { x:L[id], i:id } : null;
  if (R.key === '='){ var j = L.indexOf(id); return j > -1 ? { x:L[j], i:j } : null; }
  for (var n = 0; n < L.length; n++) if (L[n] && String(L[n][R.key]) === String(id)) return { x:L[n], i:n };
  return null;
}
/* بعد كلِّ رسم: «✎ تعديل» بجوار كلِّ زرِّ حذفٍ مسجَّل — لمن يملك التعديل */
function gedInject(){
  Object.keys(GED_REG).forEach(function(k){
    var R = GED_REG[k]; if (!gedPerm(R)) return;
    document.querySelectorAll('[data-' + R.del + ']').forEach(function(b){
      if (b.previousElementSibling && b.previousElementSibling.hasAttribute('data-ged')) return;
      var e = document.createElement('button'); e.type = 'button'; e.className = 'btn btn-quiet btn-sm'; e.setAttribute('data-ged', k + '|' + b.getAttribute('data-' + R.del));
      e.textContent = '\u270E ' + t('تعديل'); e.style.marginInlineEnd = '4px'; b.parentNode.insertBefore(e, b);
    });
  });
}
function gedHtml(){
  if (!GED) return '';
  var R = GED_REG[GED.k], F = gedFind(GED.k, GED.id); if (!R || !F){ GED = null; return ''; }
  var val = function(f){ return f[0] === '=' ? F.x : (F.x[f[0]] == null ? '' : F.x[f[0]]); };
  return '<div class="pop" id="gedPop" style="width:min(460px,94vw)"><div class="pop-head"><div><h3>\u270E ' + esc(t('تعديل')) + ' — ' + esc(t(R.t)) + '</h3></div>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-gedx="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">' + R.f.map(function(f, n){ return '<div class="field"><label class="mini">' + esc(t(f[1])) + '</label><input id="gedF' + n + '" dir="auto"' + (f[2] === 'n' ? ' type="number"' : '') + ' value="' + esc(val(f)) + '"></div>'; }).join('') + '</div>'
    + '<div class="pop-foot actions"><button type="button" class="btn btn-primary btn-sm" data-gedsave="1">\u{1F4BE} ' + esc(t('احفظ')) + '</button>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-gedx="0">' + esc(t('إلغاء')) + '</button></div></div>';
}
function gedSave(){
  if (!GED) return false; var R = GED_REG[GED.k], F = gedFind(GED.k, GED.id);
  if (!R || !F) return false;
  if (!gedPerm(R)){ toast(t('التعديلُ لمن يملك هذه القائمة')); return false; }
  var vals = R.f.map(function(f, n){ var el = document.getElementById('gedF' + n), v = el ? String(el.value || '').trim() : ''; return f[2] === 'n' ? (v === '' ? 0 : +v) : v; });
  if (!vals[0] && vals[0] !== 0){ toast(t('الحقلُ الأوّلُ مطلوب')); return false; }
  var L = R.list(), chg = [];
  if (R.key === '='){ if (vals[0] !== F.x && L.indexOf(vals[0]) > -1){ toast(t('موجودٌ بالفعل')); return false; } L[F.i] = vals[0]; chg.push(R.f[0][1]); }
  else R.f.forEach(function(f, n){ if (String(F.x[f[0]] == null ? '' : F.x[f[0]]) !== String(vals[n])){ F.x[f[0]] = vals[n]; chg.push(f[1]); } });
  if (!chg.length){ GED = null; toast(t('لا تغيير')); return true; }
  if (F.x && typeof F.x === 'object'){ F.x.edAt = Date.now(); F.x.edBy = (STATE.meta && STATE.meta.name) || ''; }
  R.save(GED.id, F.x);
  logEvent('تعديل ' + R.t + ' — ' + GED.id + ' \u00b7 ' + chg.join('، '));
  toast(t('حُفظ التعديل'));
  GED = null; return true;
}
