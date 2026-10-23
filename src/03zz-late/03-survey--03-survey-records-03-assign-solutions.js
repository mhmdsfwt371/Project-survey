/* (V38.90) moved by scripts/split-late.mjs from src/03-survey/03-survey-records-03-assign-solutions.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function selAll(list){
  list.forEach(function(x){ if (!SEL[x.id] && !asnOf(x.id)){ SEL[x.id] = 1; SEL_N++; } });
}

/* تحميلُ ما لديه في التحديد — فالإضافةُ والحذفُ على ما هو قائم */
function asnLoad(who){
  var kind = LAYER().kind;
  selClear();
  asnOfTech(who, kind).forEach(function(id){ SEL[id] = 1; SEL_N++; });
  ASN_BASE = asnOfTech(who, kind);
  render(1);
}

function solutionSave(site, itemsMap){
  if (!may('edit')){ toast(t('اقتراحُ الحل يحتاج صلاحية تعديل')); return; }
  var s = siteFind(site);
  if (!s){ toast(t('الموقعُ غيرُ موجود')); return; }
  if (!svDone(STATE.recs[site])){ toast(t('امسح النقطةَ أولًا قبل اقتراح حلّها')); return; }
  if (!svApproved(STATE.recs[site])){ toast(t('اعتمد الزيارةَ أولًا في «اعتماد الزيارات» ثم اقترح حلَّها')); return; }
  var old = solutionOf(site);
  if (old && old.status === 'معتمد'){
    toast(t('حلُّ هذه النقطة معتمدٌ بالفعل — راجع المهندس لتعديله')); return;
  }
  var used = {}, n = 0;
  Object.keys(itemsMap || {}).forEach(function(k){
    var q = cfgN(itemsMap[k]);
    if (q > 0){ used[k] = q; n += q; }
  });
  if (!n){ toast(t('اختر جهازًا واحدًا على الأقل')); return; }
  var r = STATE.inss[site] || { id:site };
  r.solution = { items:used, status:'مقترح', by:STATE.meta.name || '', at:Date.now() };
  CORE.set('inss', site, r);
  logEvent('اقتراح حل تركيب — ' + site + ' \u00b7 ' + nm(n) + ' جهاز', site);
  toast(t('اقتُرح الحل — بانتظار اعتماد المهندس'));
  render(1);
}

function solutionAppr(site, ok){
  if (!may('users')){ toast(t('اعتمادُ الحل للمهندس وحده')); return; }
  var r = STATE.inss[site];
  if (!r || !r.solution) return;
  if (ok){
    r.solution.status = 'معتمد';
    r.solution.apprBy = STATE.meta.name || '';
    r.solution.apprAt = Date.now();
    logEvent('اعتماد حل تركيب — ' + site, site);
    notifPush('اعتماد', 'اعتُمد حلُّ التركيب لنقطة ' + site,
              { to:r.solution.by || '', site:site, lv:'مهم' });
  } else {
    r.solution.status = 'مُعاد';
    r.solution.why = 'أُعيد للتصحيح';
    logEvent('ردّ حل تركيب — ' + site, site);
    notifPush('ردّ', 'رُدَّ حلُّ تركيب ' + site + ' — راجعه',
              { to:r.solution.by || '', site:site, lv:'عاجل' });
  }
  CORE.set('inss', site, r);
  toast(ok ? t('اعتُمد الحل') : t('رُدّ للمقترِح'));
  render(1);
}

/* اختيارُ النوع: تُفتَح طبقتُه، ويُضبَط من يستلمه، ويُبدأ التحديد */
function asnPickKind(k){
  /* الصيانةُ تستعير طبقةَ التركيب لأن نقاطَها نقاطُه المُركَّبة */
  var isM = k === 'maint';
  var L = isM ? { n:WO_KINDS.maint.n, i:WO_KINDS.maint.i, kind:'maint' } : LAYERS[k];
  if (!L) return;
  FIELD_MODE = isM ? 'install' : k;
  ASN_MODE = ASN_KIND_DEST[L.kind] || 'tech';
  ASN_KIND = L.kind;
  selClear();
  ASN_PICK = false;
  MAP_SELECT = true;
  CUR = 'map';
  render(1);
  if (MAP) mapPaint();
  toast(L.i + ' ' + t(L.n) + ' \u00b7 ' + t('اضغط النقاط ثم «أسند»'));
}
