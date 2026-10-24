/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-01-data-sources-role-guide.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Where data comes from and where it is read, page usage, and the role guide generated from permissions.
   DEFINES : provHtml, tabHead, pageMeta, pageIds, goPage, pageUse, pageHist, pghLast, pageTick, seesRaw, seesPage
   GLOBALS : PROV, PG_USE, CAP_SAY, GUIDE
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */


/* ═══ البيانات: من أين تأتي وأين تُقرأ ═══
   الشاشةُ التي تعرض أرقامًا بلا نسبٍ تُتَّهم — «الـ٢٠٨ دي جاية منين؟».
   فصار تحت عنوان كلِّ شاشةٍ سطرُ نسبٍ: من أين تأتي بياناتُها (أيُّ شاشةٍ
   تكتبها)، وأين تُقرأ (أيُّ شاشةٍ تسمعها). يُملأ للشاشات التي بياناتُها
   تعبر الصفحات — لا لما يشرح نفسَه. */
var PROV = {
  names:   ['تُولَّد آليًّا من أسماء الحسابات والشركات — لا تُخزَّن؛ يُخزَّن تصحيحُك اليدويُّ وحدَه',
            'كلُّ شاشةٍ وتقريرٍ يعرض اسمًا بالواجهة الإنجليزية'],
  jobs:    ['الوظائفُ تُعرَّف هنا، والأشخاصُ من «الحسابات»',
            'رؤيةُ الشاشات (الدور من الوظيفة) ودورةُ كلِّ شخص وأدلةُ الأدوار'],
  users:   ['تُنشأ الحساباتُ هنا — بالاسم والوظيفة والمشرف؛ لا مكانَ ثانيًا يُضاف فيه اسم',
            'قوائمُ الإسناد والفرقُ والأداءُ و«مهامي» — كلُّ من يظهر اسمُه في النظام'],
  assignRole:['الحسابات — دورُ كلِّ حساب', 'كلُّ شاشةٍ تُفتَح أو تُحجَب'],
  crewman: ['أعضاءُ الفريق أسماءٌ من «الحسابات» — لا يُخلَق شخصٌ من هنا',
            'إسنادُ التركيب والفكِّ للفرق، وتقاريرُ أداء الفريق'],
  mywork:  ['المهامُّ التي تُسنَد إليك من الخريطة ومن «الطلبات والتوزيع»، وحالةُ كلِّ زيارةٍ من قرار المهندس في «اعتماد الزيارات»',
            'الخريطة (لون نقاطك) و«أمس · الآن · غدًا»'],
  svappr:  ['ما حفظه المشرفون في نموذج المسح — بصوره وقياساته وتحريك النقطة',
            'حلُّ التركيب (لا حلَّ إلا لمعتمَدة) ونقاطُ المشرف و«أمس · الآن · غدًا»'],
  solution:['زياراتٌ اعتمدتَها في «اعتماد الزيارات» + كتالوجُ القطع من «الكتالوج والقوائم»',
            'طبقةُ التركيب على الخريطة وطلباتُ التركيب (DR) وإجماليُّ المشتريات المتوقَّع'],
  invb:    ['الشحناتُ والتوريد يزيدان، ونموذجُ التركيب يستهلك — كلُّه عبر دفتر الحركة',
            'اختيارُ القطع في الحل، وعُهدةُ كلِّ منفِّذ، والملخّصُ المالي'],
  invmv:   ['كلُّ حركةٍ: استلامُ شحنةٍ، صرفٌ، استهلاكُ تركيبٍ من النموذج، إرجاعُ فكّ',
            'الأرصدةُ والعُهدةُ — لا يُخصَم شيءٌ مرتين'],
  perf:    ['سجلاتُ المسح والتركيب والفكِّ والورشة المعتمدةُ — لا يُحتسَب غيرُ المعتمَد',
            'ترتيبُ «شغلي ← أدائي» والمستحقّاتُ والتقاريرُ التنفيذية'],
  now:     ['سجلاتُ اليوم والمهامُّ المفتوحةُ ومواعيدُ الغد — لحظيًّا لا أرقامًا تُكتَب',
            'شاشةُ الوزارة والاجتماعُ الصباحي'],
  pace:    ['المواعيدُ من «التخطيط ← المواعيد والأزمنة» والإنجازُ من اللقطات اليومية',
            'قرارُ «هنلحق؟» وتوزيعُ الفرق'],
  fleetLog:['إسناداتُ السيارات — الجاري والمنتهي بتواريخه',
            'المخالفاتُ والمساءلة: من كانت معه اللوحةُ في ذلك اليوم']
};
function provHtml(id){
  var pv = PROV[id];
  if (!pv) return '';
  return '<p class="hint" style="margin:-6px 0 14px">'
    + '\u{1F4E5} ' + esc(t('تأتي من')) + ': ' + esc(t(pv[0]))
    + '<br>\u{1F4E4} ' + esc(t('تُقرأ في')) + ': ' + esc(t(pv[1])) + '</p>';
}
function tabHead(pid){
  var cur = tabCur(pid), all = tabsOf(pid), vis = all.filter(function(tb){ return tb[5] !== 'hidden'; });
  var chips = vis.length < 2 ? '' :        /* شريحةٌ واحدةٌ لا تحتاج رأسًا */
    '<div class="chips" role="tablist">' + all.map(function(tb){
      return '<button type="button" class="chip' + (cur === tb[0] ? ' on' : '') + '" role="tab"' + (tb[5] === 'hidden' ? ' hidden' : '')   /* (V37.49) المخفيُّ في الشجرة لا في الشريط — للروابط والجرود */
        + ' aria-selected="' + (cur === tb[0] ? 'true' : 'false') + '"'
        + ' data-ptab="' + pid + ':' + tb[0] + '">' + tb[2] + ' ' + esc(t(tb[1])) + '</button>';
    }).join('') + '</div>';
  /* سطرُ النسب: تحت شرائح الأم، لشريحتها المفتوحة */
  return chips + provHtml(cur);
}
/* بياناتُ صفحةٍ أو شريحةٍ بمعرِّفها — للمساعد والأدلة والمساعدة */
function pageMeta(id){
  var p = (typeof FIELD_PAGES === 'object' && FIELD_PAGES[id]) || PAGE[id];
  if (p) return { id:id, m:p.m || '', t:p.t || '', l:p.l || '', sub:'' };
  var par = PARENT[id];
  if (!par || !PAGE[par]) return null;
  var tb = TABS[par].filter(function(x){ return x[0] === id; })[0];
  return { id:id, m:PAGE[par].m || '', t:tb[1], l:tb[3] || '', sub:PAGE[par].t };
}
/* كلُّ ما يُفتَح: الصفحاتُ، وشرائحُ المدموجة كلُّ واحدةٍ باسمها */
function pageIds(){
  var out = [];
  Object.keys(PAGE).forEach(function(id){
    if (TABS[id]) TABS[id].forEach(function(tb){ out.push(tb[0]); });
    else out.push(id);
  });
  if (typeof FIELD_PAGES === 'object') Object.keys(FIELD_PAGES).forEach(function(id){ out.push(id); });
  return out;
}
/* الانتقالُ الصريحُ إلى صفحة: الأمُّ التي هي شريحتُها الأولى تُفتَح عليها —
   فمن نقر «المستخدمين والأدوار» في القائمة يجد الحساباتِ لا آخرَ شريحةٍ فُتحت */
function goPage(id){
  if (typeof SVQ !== 'undefined' && SVQ.id) SVQ = { id:'', key:'', tmp:null };   /* التنقّلُ يغلق لوحَ تعديل المسح (V22.7) */
  if (TABS[id] && PARENT[id] === id) PTAB[id] = id;
  if (id !== 'map' && typeof POP_OPEN !== 'undefined' && POP_OPEN) POP_OPEN = false;   /* (V26.9) نافذةُ نقطة الخريطة لا تبقى «مفتوحةً» في صفحةٍ أخرى — كانت تبتلع أوّلَ نقرةٍ بعد العودة من الخريطة */
  CUR = id;
  try { pageTick(id); } catch (e){ if (typeof softErr === 'function') softErr('pageTick', e, ''); }
  try { boxNote('pg', id); } catch (e){ BOX_ERR = e; }
}
/* ═══ استعمالُ الصفحات (V17.95) ═══
   كم فُتحت كلُّ صفحةٍ اليومَ على هذا الجهاز — يُعَدُّ محليًّا ويركب نبضةَ
   الحضور نفسَها (لا كتابةَ جديدة)، ويجمعه النبضُ الصباحيُّ عبر الأجهزة. */
var PG_USE = null;
function pageUse(){
  var day = dayKey();
  if (!PG_USE || PG_USE.day !== day){
    var raw = null; try { raw = JSON.parse(lsGet('nsk14.pg') || 'null'); } catch (e){ LS_ERR = e; }
    PG_USE = (raw && raw.day === day && raw.n) ? raw : { day:day, n:{} };
  }
  return PG_USE;
}
/* (V38.84) and a per-day history (Makkah days, the last 14 kept) that the beat carries as pgh_<device>: the morning pulse
   alone kept only the day each device happened to report last, so the usage log lost most opens — the server job now
   adds every device's last seven days up (scripts/usage-cost.mjs) */
function pageHist(){
  if (!pageHist.m){ try { pageHist.m = JSON.parse(lsGet('nsk14.pgh') || '{}') || {}; } catch (e){ LS_ERR = e; pageHist.m = {}; } }
  return pageHist.m;
}
function pghLast(n){ var h = pageHist(), o = {}; Object.keys(h).sort().slice(-(n || 7)).forEach(function(k){ o[k] = h[k]; }); return JSON.stringify(o); }
function pageTick(id){
  if (!id) return;
  var h = pageHist(), dk = dayKey(), dm = h[dk] = h[dk] || {};
  if (dm[id] != null || Object.keys(dm).length < 60) dm[id] = (dm[id] || 0) + 1;
  var hk = Object.keys(h).sort(); if (hk.length > 14) hk.slice(0, hk.length - 14).forEach(function(k){ delete h[k]; });
  try { lsSet('nsk14.pgh', JSON.stringify(h)); } catch (e){ LS_ERR = e; }
  var u = pageUse(); u.n[id] = (u.n[id] || 0) + 1;
  if (Object.keys(u.n).length > 60) return;   /* سقفٌ: لا يتضخّم المفتاحُ بمعرِّفاتٍ غريبة */
  try { lsSet('nsk14.pg', JSON.stringify(u)); } catch (e){ /* تخزينٌ ممنوعٌ في التصفّح الخاص — يُعَدُّ في الذاكرة فقط */ PG_USE.noStore = 1; }
}
function seesRaw(id){ var n = R().nav; var cap = PAGE_CAP[id]; if (cap && !may(cap)) return false;
  return n === '*' || n.indexOf(id) > -1;
}
function seesPage(id){
  if (TABS[id]) return tabsOf(id).length > 0;   /* الأمُّ تُرى إن رُئيت شريحةٌ واحدة */
  return seesRaw(id);
}

/* «جدولي» — ما أُسند لي وحدي، بلا أرقام زملائي */

/* دليل الدور — لكل دور دليله وحده */
/* تسمياتُ القدرات — ما تعنيه كلُّ قدرةٍ لمن يقرأ دليلَه */
var CAP_SAY = {
  edit:'يُسجّل ويعدّل', approve:'يعتمد ويردّ', settings:'يضبط الإعدادات',
  money:'يرى المال', inventory:'يحرّك المخزون', workshop:'يعمل في الورشة',
  exportAll:'يصدّر الكل', importAll:'يستورد', delete:'يحذف',
  users:'يدير الحسابات', phones:'يرى الهواتف', roles:'يدير الأدوار', fleet:'يدير الأسطول',
  perms:'يضبط صلاحيات القاعدة',
  propose:'يقترح نقاطًا جديدة', provision:'يفعّل الحسابات الجديدة'   /* (V39.12) were shown as their keys */
};

/* ═══ دليلُ الدور — يُولَّد من صلاحياته لا يُكتَب بيد ═══
   كان دليلٌ واحدٌ يشمل الأدوارَ كلَّها، فيقرأ الفنيُّ عن شاشاتٍ لا يملكها
   والسائقُ عن اعتماداتٍ لا يراها — والصفحةُ نفسُها كانت تعترف: «لم يُبنَ
   بعد دليلٌ منفصلٌ لكلِّ دور».

   والدليلُ المكتوبُ بيدٍ يشيخ: تُضاف شاشةٌ أو تُنقَل قدرةٌ فيبقى الدليلُ
   على حاله يصف نظامًا لم يعد قائمًا. فهذا يُشتقّ من ROLES نفسِها لحظةَ
   فتحه — من غيّر صلاحيةً غيّر الدليلَ معها، ولا سبيلَ لأن يفترقا. */
var GUIDE = { g:'', role:'' };   

/* GUIDE.role مُعلَنٌ مع GUIDE أعلاه (V32.3) */

;

/* الاعتمادات — للمهندس وحده */
