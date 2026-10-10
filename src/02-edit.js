
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
/* (V36.6) الدفعةُ الثالثة — ما يُعدَّل بحماية: لا يُغيَّر فيه ما تتعلّق به سجلّاتٌ أخرى (اسمُ الفني تحمله سجلّاتُه فلا يُعدَّل هنا) */
GED_REG.tr = { t:'تجربة', del:'trdel', list:function(){ return trialRows(); }, key:'id', save:function(){ trialSave(); }, may:'settings',
  f:[['n','اسم التجربة'], ['date','التاريخ'], ['hours','الساعات','n'], ['rep','رابط التقرير']] };
GED_REG.hse = { t:'حادث سلامة', del:'hsedel', list:function(){ return HSE.incidents; }, key:'#', may:'approve',
  save:function(id, x){ CORE.dirty('hse', 'INC-' + (HSE.incidents.length - (+id)), x); if (typeof hseRecount === 'function') hseRecount(); },
  f:[['why','الوصف والإجراء'], ['kind','النوع'], ['site','النقطة'], ['lost','أيام ضائعة','n']] };
GED_REG.depmem = { t:'عضو فريق', del:'depmemrm', list:function(){ var tm = teamOf(CTEAM_CUR); return tm ? tm.members : []; }, key:'#', may:'users',
  save:function(){ var tm = teamOf(CTEAM_CUR); if (tm) CORE.dirty('teams', tm.id, tm); },
  f:[['role','الدور في الفريق'], ['share','الحصة ٪','n']] };
GED_REG.tk = { t:'فني', del:'tkdel', list:function(){ return techsList(true); }, key:'n', may:'users', req:false,
  save:function(id, x){ var u = STATE.users && STATE.users[x.u]; if (!u) return; u.ph = x.ph; u.sup = x.sup; u.dept = x.dept; CORE.set('users', x.u, u); },
  f:[['ph','الجوال'], ['sup','المشرف'], ['dept','القسم']] };
GED_REG.depteam = { t:'فريق فرعي', del:'depteamdel', list:function(){ return TEAMS; }, key:'id', may:'users',
  save:function(id, x){ CORE.dirty('teams', id, x); }, f:[['n','اسم الفريق الفرعي']] };
GED_REG.role = { t:'دور', del:'roledel', list:function(){ return (CFG.roles && CFG.roles.r) || {}; }, key:'@', may:'roles',
  save:function(){ CFG.roles.v = (CFG.roles.v || 0) + 1; CFG.roles.at = Date.now(); CORE.set('cfg', 'roles', CFG.roles); },
  f:[['n','اسم الدور']] };
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
  if (R.req !== false && !vals[0] && vals[0] !== 0){ toast(t('الحقلُ الأوّلُ مطلوب')); return false; }
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

/* ═══ الحذفُ الموحّد (V36.5) — بقيةُ «تعديل وحذف وإضافة لكل التفاصيل» ═══
   سجلّاتٌ كان فيها «أضف» وخطواتُ اعتمادٍ ولا «حذف»: بلاغُ عدم المطابقة المفتوح، والمستخلصُ المقدَّم قبل اعتماده، وطلبُ التغيير قبل قراره،
   وإسنادُ السيارة القائم. يظهر «🗑 حذف» بجوار زرِّ خطوتها التالية — أي ما دام في الحالة التي يُسمح فيها بالحذف وحدَها: فلا يُحذَف
   بلاغٌ أُغلق ولا مستخلصٌ اعتُمد أو صُرف ولا طلبٌ قُرّر. والسجلّاتُ الماليةُ والجودية تُلغى (تبقى أثرًا بحالة «ملغى» وتخرج من
   الحسابات) لا تُمحى؛ والإسنادُ يُمحى. */
var GDEL_REG = {
  ncr: { t:'بلاغ عدم مطابقة', anchor:'ncrok', may:'approve', run:function(i){ var x = NCRS[+i]; if (!x) return ''; x.st = 'ملغى'; x.cancelBy = STATE.meta.name || ''; x.cancelAt = Date.now(); CORE.dirty('ncr', 'NCR-' + (+i + 1), x); return x.cat || ('NCR-' + (+i + 1)); } },
  ipc: { t:'مستخلص', anchor:'ipcok', may:'money', run:function(i){ var x = IPCS[+i]; if (!x || x.st !== 'مقدَّم') return ''; x.st = 'ملغى'; x.cancelBy = STATE.meta.name || ''; x.cancelAt = Date.now(); CORE.dirty('ipc', 'IPC-' + (+i + 1), x); return x.period || ('IPC-' + (+i + 1)); } },
  chg: { t:'طلب تغيير', anchor:'chgok', may:'approve', run:function(i){ var x = CHANGES[+i]; if (!x || x.st !== 'مقدَّم') return ''; x.st = 'ملغى'; x.cancelBy = STATE.meta.name || ''; x.cancelAt = Date.now(); CORE.dirty('changes', 'CR-' + (+i + 1), x); return x.kind || ('CR-' + (+i + 1)); } },
  /* حركةُ مخزنٍ سُجّلت خطأً: تُحذَف خلال يومٍ من تسجيلها — والرصيدُ يُشتقّ من الحركات فيُصحَّح وحدَه. والاستهلاكُ لا يُحذَف (جزءٌ من التركيب — ق-٠١٤)،
     وما مضى عليه يومٌ يُصحَّح بحركةٍ عكسية (إرجاعٌ أو شطب) كما في المحاسبة. */
  mv:  { t:'حركة مخزون', anchor:'mvdel', direct:true, may:'inventory', run:function(id){ var L = STATE.moves || [], i = -1; L.forEach(function(m, k){ if (m && m.id === id) i = k; });
         if (i < 0) return ''; var m = L[i]; if (m.kind === 'استهلاك' || Date.now() - (+m.at || 0) >= 864e5) return ''; L.splice(i, 1); CORE.set('moves', id, null); return m.kind + ' · ' + m.item + ' × ' + m.qty; } },
  va:  { t:'إسناد سيارة', anchor:'vaend', may:'fleet', run:function(id){ var a = (STATE.vehAsn || {})[id]; if (!a) return ''; delete STATE.vehAsn[id]; CORE.set('vehAsn', id, null); return a.to || a.who || id; } }
};
function gdelInject(){
  Object.keys(GDEL_REG).forEach(function(k){
    var R = GDEL_REG[k]; if (R.direct || !(typeof may === 'function' && (may(R.may) || may('settings')))) return;
    document.querySelectorAll('[data-' + R.anchor + ']').forEach(function(b){
      if (b.nextElementSibling && b.nextElementSibling.hasAttribute('data-gdel')) return;
      var e = document.createElement('button'); e.type = 'button'; e.className = 'btn btn-quiet btn-sm'; e.style.color = '#E05252';
      e.setAttribute('data-gdel', k + '|' + b.getAttribute('data-' + R.anchor)); e.textContent = '\u{1F5D1} ' + t('حذف');
      b.parentNode.insertBefore(e, b.nextSibling);
    });
  });
}
function gdelRun(k, id){
  var R = GDEL_REG[k]; if (!R) return false;
  if (!(typeof may === 'function' && (may(R.may) || may('settings')))){ toast(t('الحذفُ لمن يملك هذه القائمة')); return false; }
  var what = R.run(id); if (!what){ toast(t('لا يُحذَف في حالته الحالية')); return false; }
  logEvent('حذف ' + R.t + ' — ' + what); toast(t('حُذف')); statBump(); return true;
}

/* ═══ (V37.4) محرّرُ تصنيفات الزيارة والمسح — المسمّياتُ وجهاتُ الحل وصورةُ الإثبات والظهورُ في قائمة الميدان ═══
   طلبُ المالك: «أقدر أغيّر وأعدّل كل الحاجات دي — المسميات والجهات اللي تحل». يُحفَظ في CFG.cats ويصل كلَّ الأجهزة مع المزامنة.
   المفتاحُ ثابت؛ فتغييرُ الاسم لا يمسّ سجلًّا، وتعطيلُ البند يُخفيه من قائمة الميدان ويُبقي عدَّ ما سُجّل به. */
var CAT_NEW = { why:[], cc:[] };
/* ما يُكتب يُحفَظ مسودّةً لحظةَ كتابته — فأيُّ إعادة رسمٍ (مزامنةٌ في الخلفية أو زرُّ «＋») لا تمسحه قبل «حفظ التصنيفات» */
var CAT_DRAFT = {};
function catDraftCatch(e){ var el = e.target; if (!el || !el.getAttribute) return;
  ['data-vcn', 'data-vcw', 'data-vcp', 'data-vco'].forEach(function(a){ var id = el.getAttribute(a); if (id != null) CAT_DRAFT[a + '|' + id] = el.type === 'checkbox' ? el.checked : el.value; }); }
function catD(a, id, def){ var v = CAT_DRAFT[a + '|' + id]; return v === undefined ? def : v; }
function catRow(kind, o){ var id = kind + '|' + o.k;
    var supTxt = (typeof supOf === 'function' ? supOf(o) : []).map(function(x){ return x.p + (x.s ? ': ' + x.s : ''); }).join('\n');   /* (V37.14) */
    o = { k:o.k, base:o.base, n:catD('data-vcn', id, o.n || ''), who:catD('data-vcw', id, supTxt), photo:catD('data-vcp', id, !!o.photo), off:!catD('data-vco', id, !o.off) };
    return '<tr><td><input data-vcn="' + esc(id) + '" aria-label="' + esc(t('المسمّى')) + '" value="' + esc(o.n || '') + '" dir="auto" placeholder="' + esc(t(o.base || 'المسمّى')) + '" style="width:100%;min-width:180px"></td>'
      + '<td><textarea data-vcw="' + esc(id) + '" aria-label="' + esc(t('جهات الدعم المطلوب')) + '" rows="' + Math.max(2, (o.who || '').split('\n').length) + '" dir="auto" placeholder="' + esc(t('الجهة: نوع الدعم — سطرٌ لكلِّ جهة')) + '" style="width:100%;min-width:220px">' + esc(o.who || '') + '</textarea></td>'   /* (V37.14) */
      + (kind === 'why' ? '<td style="text-align:center"><input type="checkbox" data-vcp="' + esc(id) + '"' + (o.photo ? ' checked' : '') + ' aria-label="' + esc(t('صورة إثبات')) + '"></td>' : '')
      + '<td style="text-align:center"><input type="checkbox" data-vco="' + esc(id) + '"' + (o.off ? '' : ' checked') + ' aria-label="' + esc(t('في قائمة الميدان')) + '"></td></tr>'; }
function catsCard(){
  if (!(typeof may === 'function' && may('settings'))) return '';
  var row = catRow;
  var tbl = function(kind, L, head){
    var news = CAT_NEW[kind].map(function(k){ return row(kind, { k:k, n:'', who:'', photo:false }); }).join('');
    return '<div class="tablewrap"><table class="tbl"><thead><tr>' + head.map(function(h){ return '<th>' + esc(t(h)) + '</th>'; }).join('') + '</tr></thead><tbody id="catBody-' + kind + '">'
      + L.map(function(o){ return row(kind, o); }).join('') + news + '</tbody></table></div>'
      + '<div class="actions" style="margin:6px 0 14px">' + btn('\uFF0B ' + t(kind === 'why' ? 'سبب جديد' : 'تحدٍّ جديد'), 'btn-quiet btn-sm', ' data-vcadd="' + kind + '"') + '</div>'; };
  return '<div id="catsCard">' + card('تصنيفات الزيارة والمسح — المسميات وجهات الدعم',
    '<p class="hint" style="margin-top:0">' + esc(t('غيّر المسمّى أو جهاتِ الدعم كما تريد أن تراها الوزارةُ والقاعة. في خانة الجهات: سطرٌ لكلِّ جهة بصيغة «الجهة: نوع الدعم». البندُ غيرُ المعلَّم يختفي من قائمة الميدان ويبقى عدُّ ما سُجّل به، والاسمُ الفارغ يعود إلى الأصل.')) + '</p>'
    + '<h4 style="margin:6px 0">' + esc(t('أسباب عدم المسح')) + '</h4>' + tbl('why', whyList(), ['المسمّى', 'جهات الدعم المطلوب — سطرٌ لكلِّ جهة', 'صورة إثبات', 'في قائمة الميدان'])
    + '<h4 style="margin:6px 0">' + esc(t('تحديات التركيب — الفئات')) + '</h4>' + tbl('cc', ccList(), ['المسمّى', 'جهات الدعم المطلوب — سطرٌ لكلِّ جهة', 'في قائمة الميدان']),
    btn('حفظ التصنيفات', 'btn-primary btn-sm', ' data-vcok="1"')) + '</div>';
}
function knownCard(){
  if (!(typeof may === 'function' && may('settings'))) return '';
  return '<div id="knownCard">' + card('المساعد — المشاكل المعروفة وحلولها',
    '<p class="hint" style="margin-top:0">' + esc(t('سطرٌ لكلِّ مشكلة: كلماتٌ تدلّ عليها مفصولةٌ بفاصلة، ثم «|»، ثم الحل. يظهر الحلُّ لأيِّ أحدٍ يكتب في المساعد كلمةً منها.')) + '</p>'
    + '<textarea id="knownTxt" dir="auto" rows="6" style="width:100%" aria-label="' + esc(t('المشاكل المعروفة')) + '" placeholder="' + esc(t('القارئ لا يعمل، القارئ مطفي | تأكد من الكهرباء ثم أعد تشغيله بفصل الكابل دقيقة')) + '">' + esc(CFG.known || KNOWN_DEFAULT) + '</textarea>'   /* (V37.29) القائمةُ الأولى ظاهرةٌ للتعديل */,
    btn('حفظ المشاكل المعروفة', 'btn-primary btn-sm', ' data-knownsave="1"')) + '</div>';
}
function catsSave(){
  if (!(typeof may === 'function' && may('settings'))){ toast(t('التصنيفاتُ للمهندس فما فوق')); return false; }
  var out = { why:[], cc:[] }, val = function(a, id){ var e = document.querySelector('[' + a + '="' + id + '"]'); return e ? (e.type === 'checkbox' ? e.checked : String(e.value || '').trim()) : null; };
  document.querySelectorAll('[data-vcn]').forEach(function(inp){
    var id = inp.getAttribute('data-vcn'), p = id.split('|'), kind = p[0], k = p.slice(1).join('|'), n = String(inp.value || '').trim();
    var isNew = CAT_NEW[kind].indexOf(k) > -1; if (isNew && !n) return;
    var supL = String(val('data-vcw', id) || '').split(/\n+/).map(function(l){ l = l.trim(); if (!l) return null; var m = /^(.+?)\s*(?::|：| — | - )\s*(.+)$/.exec(l); return m ? { p:m[1].trim(), s:m[2].trim() } : { p:l, s:'' }; }).filter(Boolean);   /* (V37.14) سطرٌ لكلِّ جهة */
    var o = { k:k, n:n, sup:supL, who:supL.length === 1 && supL[0].s ? supL[0].p + ' — ' + supL[0].s : supL.map(function(x){ return x.p; }).join('، '), off:val('data-vco', id) === false };
    if (kind === 'why') o.photo = val('data-vcp', id) === true;
    out[kind].push(o);
  });
  CFG.cats = out; CAT_NEW = { why:[], cc:[] }; CAT_DRAFT = {}; catCached.why = catCached.cc = null;
  cfgPushSoon('cats'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1;
  logEvent('تعديل تصنيفات الزيارة والمسح — ' + out.why.length + ' سببًا · ' + out.cc.length + ' تحدّيًا');
  toast(t('حُفظت التصنيفات — تصل كلَّ الأجهزة مع المزامنة')); statBump(); return true;
}
