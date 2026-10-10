
/* (V33.0) علامةُ «لم يُعالَج هنا — تابِع» لأجزاء معالجَي النقرات: دالّةٌ فارغةٌ هويتُها فريدة (لا متغيرَ عامًّا جديدًا) */
function CLICK_NEXT(){}
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
  var cur = tabCur(pid), vis = tabsOf(pid);
  var chips = vis.length < 2 ? '' :        /* شريحةٌ واحدةٌ لا تحتاج رأسًا */
    '<div class="chips" role="tablist">' + vis.map(function(tb){
      return '<button type="button" class="chip' + (cur === tb[0] ? ' on' : '') + '" role="tab"'
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
function pageTick(id){
  if (!id) return;
  var u = pageUse(); u.n[id] = (u.n[id] || 0) + 1;
  if (Object.keys(u.n).length > 60) return;   /* سقفٌ: لا يتضخّم المفتاحُ بمعرِّفاتٍ غريبة */
  try { lsSet('nsk14.pg', JSON.stringify(u)); } catch (e){ /* تخزينٌ ممنوعٌ في التصفّح الخاص — يُعَدُّ في الذاكرة فقط */ PG_USE.noStore = 1; }
}
function seesRaw(id){
  var n = R().nav;
  var cap = PAGE_CAP[id];
  if (cap && !may(cap)) return false;
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
  perms:'يضبط صلاحيات القاعدة'
};

/* ═══ دليلُ الدور — يُولَّد من صلاحياته لا يُكتَب بيد ═══
   كان دليلٌ واحدٌ يشمل الأدوارَ كلَّها، فيقرأ الفنيُّ عن شاشاتٍ لا يملكها
   والسائقُ عن اعتماداتٍ لا يراها — والصفحةُ نفسُها كانت تعترف: «لم يُبنَ
   بعد دليلٌ منفصلٌ لكلِّ دور».

   والدليلُ المكتوبُ بيدٍ يشيخ: تُضاف شاشةٌ أو تُنقَل قدرةٌ فيبقى الدليلُ
   على حاله يصف نظامًا لم يعد قائمًا. فهذا يُشتقّ من ROLES نفسِها لحظةَ
   فتحه — من غيّر صلاحيةً غيّر الدليلَ معها، ولا سبيلَ لأن يفترقا. */
var GUIDE = { g:'', role:'' };   /* (V32.3) الأدلةُ تملك حالتَها (كانت GUIDE.g/GUIDE.role) */
function roleGuide(k){
  var x = ROLES[k];
  if (!x) return '';
  var caps = Object.keys(x.can || {}).filter(function(c){ return x.can[c]; });
  /* شاشاتُه: ما يبلغه فعلًا بقواعد seesPage نفسِها لا بقائمةٍ تُحفَظ */
  /* الشرائحُ تُعدُّ كلُّ واحدةٍ شاشةً — فالسائقُ يقرأ «سيارتي» لا «السيارات» */
  var ids = (x.nav === '*') ? pageIds() : x.nav.filter(pageMeta);
  var byGroup = {};
  ids.forEach(function(id){
    var p = pageMeta(id);
    if (!p) return;
    var cap = PAGE_CAP[id];
    if (cap && !x.can[cap]) return;
    (byGroup[p.m] = byGroup[p.m] || []).push(p);
  });
  var groups = Object.keys(byGroup);
  var nScreens = groups.reduce(function(a, g){ return a + byGroup[g].length; }, 0);

  /* دوراتُ العمل التي يملكها: SOPS تذكر صاحبَها بالاسم */
  var sops = SOPS.filter(function(sp){ return (sp.own || '').indexOf(x.n) > -1; });

  return stats([['شاشاتُه', N(nScreens), 'acc'],
                ['مجموعاتٌ في قائمته', N(groups.length)],
                ['قدراتُه', N(caps.length), caps.length ? '' : 'wrn']])

    + card(t(x.n),
        '<p class="lede" style="margin:0 0 12px">' + esc(t(x.d || '')) + '</p>'
        + (caps.length
          ? '<div class="chips">' + caps.map(function(c){
              return '<span class="chip on">' + esc(t(CAP_SAY[c] || c)) + '</span>'; }).join('') + '</div>'
          : alertBox('info','عرضٌ فقط — لا يكتب في النظام شيئًا.')))

    /* مئةٌ وخمسُ شاشاتٍ في قائمةٍ واحدةٍ لا تُقرأ — ولا تُقاس على شاشة هاتف.
       فالمجموعاتُ مطويّةٌ بأعدادها، وتُفتَح واحدةً واحدة. */
    + groups.map(function(g){
        var open = GUIDE.g === g;
        return card('',
          '<button type="button" class="btn btn-quiet" data-guideg="' + esc(open ? '' : g) + '" style="width:100%;justify-content:space-between;font-weight:700">'
          + '<span>' + (open ? '\u25BE ' : '\u25B8 ') + esc(t(g)) + '</span><span class="num">' + nm(byGroup[g].length) + '</span></button>'
          + (open
            ? table(['الشاشة','ما يفعله فيها'],
                byGroup[g].map(function(p){
                  return [(p.sub ? esc(t(p.sub)) + ' \u2190 ' : '') + esc(t(p.t)), esc(t(p.l || ''))]; }))
            : ''));
      }).join('')

    + (sops.length
      ? cardFlush('دوراتُ عمله — ' + nm(sops.length),
          table(['الدورة','ما يبدؤها','خطواتها'],
            sops.map(function(sp){
              return [sp.i + ' ' + esc(t(sp.n)), esc(t(sp.trig || '')), N(sp.steps.length)];
            })))
      : '');
}

/* GUIDE.role مُعلَنٌ مع GUIDE أعلاه (V32.3) */

;

/* الاعتمادات — للمهندس وحده */
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
          + '<p class="hint">' + esc(t('التثبيت يُبقي التطبيق عاملًا بلا شبكة، والإفراغُ يُجبره على تحميلٍ نظيفٍ عند أول اتصال.')) + '</p>')
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


/* ═══ الإعدادات — تفاصيل القديم كاملةً بالتصميم الجديد ═══
   نفس النصوص والحقول والجداول والقواعد، مبنيةً ببطاقات التصميم الجديد. */

/* ═══ أنواعُ النقاط: تُضاف وتُعدَّل وتُحذَف ═══════════════════════════════
   صفوفُ «نقاط الزيارات» و«نقاط الفك» تركيباتٌ من مشعرٍ ونوع، تُشتقُّ من
   `CAT_DEF`. فالإضافةُ هنا إضافةُ نوعٍ لا صفّ: يُضاف «مبنى خدمات» فيظهر في
   المشاعر الثلاثة، ويُضبَط وزنُه قبل أن تأتي أولُ نقطةٍ منه.

   والنوعُ الذي عليه مواقعُ لا يُحذَف: مواقعُه تحمل اسمَه، وحذفُه يجعلها
   بلا تصنيفٍ فتسقط من كلِّ تجميعٍ ولا يُعرَف أين ذهبت. */

/* ═══ سجلُّ الأنواع يُطبَّع مرةً لكلِّ نسخةٍ منه (V17.60) ═══
   كان يُزرَع من الكتالوج مرةً ثم لا يُعاد إليه — فالسجلُّ السحابيُّ الذي سبق
   نوعًا مدمَجًا جديدًا لا يعرفه أبدًا: لا يظهر الجيت واي ولا الحساس في قائمة
   المسار ولا في شاشة الأنواع. وكانت وثيقتُه تحمل ختمَي الكتابة (_by و_at)
   فيُقرآن نوعين، والحذفُ لا يثبت لأن الكتابةَ دمجٌ يُبقي المحذوف، والشكلُ
   يسقط عند الحفظ. فصار يُطبَّع حين تتبدّل نسختُه: يُنزَع الختم، ويُقرأ شاهدُ
   الحذف {gone:true} فلا يُعاد المحذوف، ويُضاف المدمَجُ الغائب، ويُستبدَل الاسمُ
   الافتراضيُّ القديمُ بجديده ما لم يغيّره أحد، ويُزامَن منه الكتالوج — فيرى
   نموذجُ الموقع الجديد ما أُضيف في جهازٍ آخر. */
var TYPES_NORM = null;
/* تسمياتٌ قديمةٌ في سجلِّ الأنواع تُردُّ إلى التسمية الحالية عند كلِّ تحميل — منها
   خطأٌ إملائيٌّ («فالوزارة») وتسمياتُ ما قبل توحيد عائلة كاميرات الوزارة (V19.1) */
var TYPES_OLD_L = { 'LPR':['قراءة اللوحات', 'كاميرات قراءة اللوحات', 'كاميرات LPR', 'كاميرات الوزارة — LPR'], 'كاميرا':['كاميرات الوزارة الذكيّة', 'كاميرات فالوزارة', 'كاميرات الوزارة'] };   /* (V28.5) والتسميتان السابقتان تُردّان للجديدتين */
/* ومفاتيحُ الأوزان المكتوبةُ بالتسمية القديمة تُقرأ للتسمية الجديدة حتى يُنقَل قرارُها */
var W_ALIAS = { 'كاميرات المتابعة':['كاميرات الوزارة', 'كاميرات فالوزارة', 'كاميرات الوزارة الذكيّة'], 'مراكز التفويج':['كاميرات الوزارة — LPR', 'كاميرات قراءة اللوحات', 'كاميرات LPR'] };   /* (V28.5) أوزانُ التسمية السابقة تُقرأ للجديدة */
function typeCopy(v){
  var o = { l:v.l, i:v.i, c:v.c };
  if (v.s) o.s = v.s;
  return o;
}
function typesNormalize(T){
  var gone = {};
  Object.keys(T).forEach(function(k){
    var v = T[k];
    if (k.charAt(0) === '_' || !v || typeof v !== 'object'){ delete T[k]; return; }
    if (v.gone){ gone[k] = 1; delete T[k]; return; }
    var b = CAT_DEF_BASE[k];
    if (b && TYPES_OLD_L[k] && TYPES_OLD_L[k].indexOf(v.l) > -1) v.l = b.l;
    if (b && !v.s && b.s) v.s = b.s;
    /* (V20.1) مدخلٌ في السجلِّ بتسميةٍ وحدَها (قرارُ تسمية) كان يُفقِد النوعَ رمزَه ولونَه:
       «undefined» في نافذة النقطة ودائرةٌ بلا لون — يُكمَل من الأصل أو بافتراضٍ محايد */
    if (!v.i) v.i = (b && b.i) || '\u25CF';
    if (!v.c) v.c = (b && b.c) || '#8A94A6';
    if (!v.l) v.l = (b && b.l) || k;
  });
  Object.keys(CAT_DEF_BASE).forEach(function(k){
    if (!T[k] && !gone[k]) T[k] = typeCopy(CAT_DEF_BASE[k]);
  });
  STATE.typesGone = gone;
  TYPES_NORM = T;
  Object.keys(T).forEach(function(k){ CAT_DEF[k] = typeCopy(T[k]); });
  Object.keys(gone).forEach(function(k){ if (CAT_DEF[k] && !typeUsed(k)) delete CAT_DEF[k]; });
}
function typesList(){
  if (!STATE.types || typeof STATE.types !== 'object') STATE.types = {};
  if (TYPES_NORM !== STATE.types) typesNormalize(STATE.types);
  return STATE.types;
}
function typesSave(){
  var T = typesList();
  Object.keys(T).forEach(function(k){ CAT_DEF[k] = typeCopy(T[k]); });
  Object.keys(CAT_DEF).forEach(function(k){ if (!T[k]) delete CAT_DEF[k]; });
  /* الكتابةُ دمجٌ في القاعدة: ما حُذف يُكتَب شاهدًا وإلا بقي فيها وعاد مع أوّل سحب */
  var W = {};
  Object.keys(T).forEach(function(k){ W[k] = T[k]; });
  Object.keys(STATE.typesGone || {}).forEach(function(k){ if (!T[k]) W[k] = { gone:true }; });
  CORE.set('cfg', 'types', W);
  SITE_IX = null; SITE_TOK = null;
  statBump();
}
function typeUsed(k){
  return (STATE.sites || []).filter(function(x){ return x.type === k; }).length;
}
function typeSet(k, patch){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var T = typesList();
  if (!T[k]) return;
  Object.keys(patch).forEach(function(p){ T[k][p] = patch[p]; });
  typesSave();
}
function typeAdd(){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var k = g('tyK'), l = g('tyL');
  if (!k){ toast(t('اكتب اسم النوع')); return; }
  if (typesList()[k]){ toast(t('النوعُ موجودٌ بالفعل')); return; }
  typesList()[k] = { l:l || k, i:g('tyI') || '\u25CF', c:g('tyC') || '#8A939D', s:g('tyS') || 'circle' };
  if (STATE.typesGone) delete STATE.typesGone[k];   /* نوعٌ حُذف ثم أُعيد: يُرفَع شاهدُه */
  typesSave();
  logEvent('نوع نقطة جديد — ' + k);
  toast(t('أُضيف النوع'));
  render(1);
}
function typeDel(k){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var u = typeUsed(k);
  if (u){ toast(t('عليه') + ' ' + nm(u) + ' ' + t('موقعًا — لا يُحذَف')); return; }
  var T = typesList();
  if (!T[k]) return;
  delete T[k];
  (STATE.typesGone = STATE.typesGone || {})[k] = 1;   /* شاهدُ حذفٍ يُكتَب مع الحفظ */
  typesSave();
  logEvent('حذف نوع نقطة — ' + k);
  toast(t('حُذف النوع'));
  render(1);
}

/* ═══ نقلُ النقاط إلى تصنيف (V23.0) ═══
   «خليني أعرف أضيف تصنيف وأمسح وأعمل assign للنقاط في التصنيف ده»: الإضافةُ والحذفُ كانا في
   «التخطيط ← نقاط المراحل» وحدَها، ولا سبيلَ لنقل نقطةٍ من تصنيفٍ إلى آخر إلا بقرارٍ في المستودع،
   والتصنيفُ الذي عليه نقاطٌ لا يُحذَف أبدًا. صار: النقاطُ المحدَّدةُ على الخريطة تُنقَل إلى أيِّ تصنيفٍ
   من لوح الإسناد نفسِه، والتصنيفُ المستعمَلُ يُحذَف بعد نقل نقاطه إلى غيره — والبطاقةُ في «المواقع».
   النقلُ تجاوزٌ في وثيقة النقطة (sites/{id}) كتعديل البيانات: يُزامَن ويُسجَّل، والزياراتُ لا تُمَسّ. */
function siteSetType(id, to){
  var x = siteFind(id); if (!x || x.type === to) return false;
  x.type = to; siteOvSet(id, { type:to });
  return true;
}
function selSetType(to){
  if (!may('settings')){ toast(t('التصنيفاتُ للمهندس وحده')); return 0; }
  if (!to || !typesList()[to]){ toast(t('اختر التصنيف')); return 0; }
  var n = 0;
  selIds().forEach(function(id){ if (siteSetType(id, to)) n++; });
  if (n){ logEvent('نقلُ ' + n + ' نقطةٍ إلى التصنيف «' + to + '»'); selClear(); SITE_IX = null; SITE_TOK = null; statBump(); }
  toast(nm(n) + ' ' + t('نقطة نُقلت إلى التصنيف') + ' «' + t((typesList()[to] || {}).l || to) + '»');
  return n;
}
/* (V23.1) «عاوز أعدّل الحاجات المرفوعة — مسميات وخلافه»: نقاطُ الميدان تصل بأسماءٍ عامة («عرفات - مربع
   - شاخص»، «كاميرا - منى - N001»). النقطةُ الواحدةُ تُعدَّل من «تعديل البيانات»، والمحدَّدُ دفعةً باسمٍ
   ورقمٍ متتابع — بالتجاوز نفسِه، فيبقى بعد الإقلاع للنقاط المسجَّلة والمرفوعة معًا. */
function selRename(pfx, from){
  if (!maySiteEdit()){ toast(t('تعديلُ بيانات النقطة للمهندس فما فوق')); return 0; }
  pfx = String(pfx || '').trim(); from = Math.max(1, Math.round(cfgN(from) || 1));
  if (!pfx){ toast(t('اكتب بدايةَ الاسم')); return 0; }
  var ids = selIds().slice().sort(), n = 0, who = STATE.meta.name || '';
  ids.forEach(function(id, i){ var x = siteFind(id); if (!x) return; var nmv = pfx + ' ' + nm(from + i);
    if (x.name === nmv) return; x.name = nmv; siteOvSet(id, { name:nmv, edBy:who, edAt:Date.now() }); n++; });
  if (n){ logEvent('تسميةُ ' + n + ' نقطةٍ دفعةً — «' + pfx + '» من ' + from); selClear(); SITE_IX = null; SITE_TOK = null; statBump(); }
  toast(nm(n) + ' ' + t('نقطة سُمّيت'));
  return n;
}
function typeMoveDel(k, to){
  if (!may('settings')){ toast(t('التصنيفاتُ للمهندس وحده')); return 0; }
  if (!to || to === k || !typesList()[to]){ toast(t('اختر تصنيفًا تنتقل إليه نقاطُه')); return 0; }
  var n = 0;
  (STATE.sites || []).slice().forEach(function(x){ if (x.type === k && siteSetType(x.id, to)) n++; });
  logEvent('نقلُ نقاط التصنيف «' + k + '» (' + n + ') إلى «' + to + '» ثم حذفُه');
  SITE_IX = null; SITE_TOK = null; statBump();
  typeDel(k);
  return n;
}
/* بطاقةُ إدارة الأنواع — تُعرَض في شاشتَي الزيارات والفك */
function typesCard(){
  /* نموذجُ الإضافة بطاقةٌ مستقلّةٌ لا وسيطٌ في رأس الجدول: كان يُمرَّر في
     خانة `right` من `cardFlush` — وهي مكانُ زرٍّ واحدٍ لا مكانُ ثلاثةِ
     حقول، فتتراصُّ رأسيًّا ويتبعثر الرأسُ ويطول. والقالبُ الصحيحُ نفسُه في
     «نقاط التهيئة»: حقولٌ في صفٍّ والزرُّ في رأس بطاقتها. */
  var T = typesList(), keys = Object.keys(T);
  return cardFlush(t('أنواع النقاط') + ' — ' + nm(keys.length),
      table(['النوع','الاسم المعروض','الرمز','اللون','الشكل على الخريطة','مواقع',''],
        keys.map(function(k){
          var u = typeUsed(k);
          /* اللونُ والشكلُ يُعدَّلان لكلِّ نوعٍ قائم (V17.60) — لا عند إضافته وحدَها؛
             والممرُّ والكاميرا معيّنٌ بعلامةٍ ثابتةٍ لها هدفُ لمسٍ خاصّ */
          var fixed = TYPE_SHAPE_DEF[k], sh = typeShape(k);
          /* وسمُ الحقل للقارئ الصوتيِّ باسم النوع المترجَم — كان يُشتقُّ من الخلية
             الأولى فيُقرأ «مخيمCamp» مفتاحًا عربيًّا ملتصقًا بترجمته */
          var al = function(col){ return ' aria-label="' + esc(t(col) + ' \u2014 ' + typeShort(k)) + '"'; };
          /* المفتاحُ الداخليُّ يُعرَض بالعربية لمن يقرؤها، وبغيرها تُعرَض ترجمتُه والمفتاحُ في التلميح (V23.0) */
          return [(LANG === 'ar' ? '<strong>' + esc(k) + '</strong>' : '<strong>' + esc(t(k)) + '</strong>'),
                  '<input value="' + esc(T[k].l) + '" data-tyl="' + esc(k) + '" dir="auto"' + al('الاسم المعروض') + '>',
                  '<input value="' + esc(T[k].i || '') + '" data-tyi="' + esc(k) + '" style="max-width:70px" dir="ltr"' + al('الرمز') + '>',
                  '<input type="color" value="' + esc(T[k].c || '#8A939D') + '" data-tyc="' + esc(k) + '" style="width:48px;min-height:34px;padding:2px"' + al('اللون') + '>',
                  fixed
                    ? shapeSvg(mapShapeOf(k), T[k].c) + ' <span class="hint" style="margin:0">' + esc(t('شكلٌ ثابت')) + '</span>'
                    : shapeSvg(sh, T[k].c) + ' <select data-tys="' + esc(k) + '" style="max-width:110px"' + al('الشكل على الخريطة') + '>'
                      + SHAPES.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (sh === o[0] ? ' selected' : '') + '>' + esc(t(o[1])) + '</option>'; }).join('')
                      + '</select>',
                  u ? pill(nm(u), 'acc') : N(0),
                  (may('settings')
                    ? (u ? '<select id="tyMv_' + esc(k) + '" aria-label="' + esc(t('انقل نقاطه إلى')) + '" style="max-width:150px"><option value="">' + esc(t('انقل نقاطه إلى…')) + '</option>'
                           + keys.filter(function(o){ return o !== k; }).map(function(o){ return '<option value="' + esc(o) + '">' + esc(t(T[o].l || o)) + '</option>'; }).join('') + '</select> '
                           + btn('انقل واحذف','btn-quiet btn-sm',' data-tymove="' + esc(k) + '"')
                         : btn('حذف','btn-quiet btn-sm',' data-tydel="' + esc(k) + '"'))
                    : '')];
        })))
    + (may('settings')
      ? card('إضافة نوع',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('النوع')) + ' <span class="req">*</span></label>'
          +   '<input id="tyK" dir="auto" placeholder="مبنى خدمات"></div>'
          + '<div class="field"><label>' + esc(t('الاسم المعروض')) + '</label>'
          +   '<input id="tyL" dir="auto" placeholder="مباني الخدمات"></div>'
          + '<div class="field"><label>' + esc(t('الرمز')) + '</label>'
          +   '<input id="tyI" dir="ltr" placeholder="\u25CF"></div>'
          + '<div class="field"><label>' + esc(t('اللون')) + '</label>'
          +   '<input id="tyC" type="color" value="#8A939D"></div>'
          + '<div class="field"><label>' + esc(t('الشكل على الخريطة')) + '</label><select id="tyS">'
          +   SHAPES.map(function(sh){ return '<option value="' + esc(sh[0]) + '">' + esc(t(sh[1])) + '</option>'; }).join('')
          + '</select></div>'
          + '</div>',
          btn('➕ إضافة نوع','btn-primary btn-sm',' data-tyadd="1"'))
      : '')
    + '<p class="hint">' + esc(t('إضافةُ نوعٍ تُنشئ صفوفَه في المشاعر الثلاثة، فيُضبَط وزنُه قبل أن تأتي أولُ نقطةٍ منه. والنوعُ الذي عليه مواقعُ لا يُحذَف — مواقعُه تحمل اسمَه.')) + '</p>';
}

/* مصفوفةُ الأوزان: كانت عشرَ تركيباتٍ مكتوبةً بيدٍ بأعدادٍ محفورة. وهي
   مطابقةٌ اليومَ — ثم يُسجَّل موقعٌ في تركيبةٍ ليست فيها فلا يجد وزنًا فيُحتسب
   صفرًا، ولا يقول أحدٌ شيئًا. فصارت تُشتقّ من البيانات، وتُدرَج معها كلُّ
   تركيبةٍ ممكنةٍ ولو خلت اليومَ — ليُضبَط وزنُها قبل أن يأتي أولُ موقعٍ فيها
   لا بعده. */
var MX_ZONES = ['منى','عرفات','مزدلفة'];

function mxExtra(){
  if (!Array.isArray(CFG.mxExtra)) CFG.mxExtra = [];
  return CFG.mxExtra;
}
/* تُعلَن تركيبةُ مشعرٍ ونوعٍ قبل أن يقع فيها موقع: من أراد أن يهيّئ وزنَ
   «كاميرات الوزارة» في عرفات قبل تسجيل أوّل موقعٍ منها لم يجد صفًّا يكتب
   فيه — فالصفُّ كان يُشتَقُّ من المواقع وحدَها. وتُحذَف الإعلانُ إن جاء
   موقعٌ حقيقيٌّ فحلَّ محلَّه، أو بيدٍ ما دام لا موقعَ عليه. */
function mxDeclare(zone, label){
  if (!may('settings')){ toast(t('المشاعرُ للمهندس وحده')); return; }
  zone = String(zone || '').trim();
  if (!zone || !label){ toast(t('اختر مشعرًا ونوعًا')); return; }
  var key = zone + '|' + label;
  var E = mxExtra();
  if (E.indexOf(key) > -1){ toast(t('هذه التركيبةُ مسجَّلةٌ من قبل')); return; }
  var real = mxRows().some(function(r){ return r[0] === zone && r[1] === label; });
  if (real){ toast(t('هذه التركيبةُ موجودةٌ بمواقعَ فعلًا')); return; }
  E.push(key);
  CORE.set('cfg', 'mxExtra', E);
  statBump();
  logEvent('إعلان تركيبة وزن — ' + zone + ' / ' + label);
  toast(t('أُعلنت التركيبة — اضبط وزنَها أدناه'));
  render(1);
}
function mxUndeclare(zone, label){
  if (!may('settings')){ toast(t('المشاعرُ للمهندس وحده')); return; }
  var n = mxRowInfo(zone, label);
  if (n){ toast(t('عليها مواقعُ بالفعل — لا تُحذَف')); return; }
  var E = mxExtra(), key = zone + '|' + label, i = E.indexOf(key);
  if (i < 0) return;
  E.splice(i, 1);
  CORE.set('cfg', 'mxExtra', E);
  statBump();
  logEvent('إلغاء تركيبة وزن — ' + zone + ' / ' + label);
  toast(t('أُلغيت التركيبة'));
  render(1);
}

function mxRows(){
  var S = siteStats(), out = [], seen = {};
  Object.keys(S.byKey).forEach(function(k){
    var p = k.split('|'), lbl = (CAT_DEF[p[1]] || {}).l || p[1];
    var key = p[0] + '|' + lbl;
    if (seen[key]) return;
    seen[key] = 1;
    out.push([p[0], lbl, S.byKey[k]]);
  });
  /* التركيباتُ المعلَنةُ تُدرَج بعددٍ صفرٍ إن لم تكن قد ظهرت بمواقعَ فعلًا —
     فلا تُكرَّر التركيبةُ إن جاء موقعُها الأول. */
  mxExtra().forEach(function(key){
    if (seen[key]) return;
    var p = key.split('|');
    seen[key] = 1;
    out.push([p[0], p.slice(1).join('|'), 0]);
  });
  /* لا تُدرَج تركيبةٌ لا وجودَ لها: كان يُدرَج جداءُ كلِّ مشعرٍ في كلِّ نوعٍ
     فتظهر جمراتٌ في عرفات ومسجدُ نمرة في منى — والنوعُ الذي لا يقع في مشعرٍ
     لا يقع فيه أبدًا. والصفُّ الفارغُ يُقرأ بيانةً ناقصةً لا استحالةً. */
  /* المشعرُ أولًا ثم العدد: كان الترتيبُ بالعدد وحدَه فتفرّقت صفوفُ المشعر
     الواحد بين غيره، وقارئُ الجدول يقرأ مشعرًا لا صفًّا. */
  return out.sort(function(a, b){
    return arCmp(a[0], b[0]) || b[2] - a[2];
  });
}

/* ما نقاطُه صفرٌ ليس في المرحلة — فإضافتُه أن تكتب له نقاطًا */
function cfgAddStage(path, pg){
  var get = path === 'itPrep' ? itPrep : itAsm;
  var off = itemsList().filter(function(i){ return !get(i.code); });
  if (!off.length) return '';
  return card(t(pg === 'prep' ? 'أضِف جهازًا للتهيئة' : 'أضِف مكوّنًا للتجميع') + ' — ' + nm(off.length),
    '<p class="hint" style="margin:0 0 11px">' + esc(t('اكتب نقاطًا لأيِّ صنفٍ أدناه فيدخل المرحلة، واتركه صفرًا فيبقى خارجها.')) + '</p>'
    + table(['الصنف','المنطقة','النقاط'],
        off.map(function(i){
          return [esc(i.name), esc(t(i.z==='cor'?'ممر':'مخيم')), cfgInput(path, i.code, { dec:1 })];
        })));
}

function tgtBlock(kCamp, kCor){
  var camp = cfgGet(kCamp), cor = cfgGet(kCor);
  return card('التارجت',
    '<div class="grid cols-2">'
    + '<div class="field"><label>' + esc(t('تارجت المخيمات — الشهري')) + '</label>'
    +   cfgInput(kCamp) + '</div>'
    + '<div class="field"><label>' + esc(t('الأسبوعي')) + '</label>'
    +   cfgDerived(cfgWk(camp)) + '</div>'
    + '<div class="field"><label>' + esc(t('تارجت الممرات — الشهري')) + '</label>'
    +   cfgInput(kCor) + '</div>'
    + '<div class="field"><label>' + esc(t('الأسبوعي')) + '</label>'
    +   cfgDerived(cfgWk(cor)) + '</div>'
    + '</div>'
    + '<div class="alert info" style="margin:4px 0 0"><span>'
    +   esc(t('الإجمالي الشهري')) + ' <b>' + nm(camp+cor) + '</b> · '
    +   esc(t('الأسبوعي')) + ' <b>' + nm(cfgWk(camp+cor)) + '</b></span></div>'
    + '<p class="hint">' + esc(t('الإجمالي والأسبوعي يُشتقّان ولا يُكتبان — والشهري وحده ما تكتبه.')) + '</p>');
}

/* ═══ المستخدمون: من القاعدة لا من بيانات العرض ═══
   كانت القائمةُ أربعةَ صفوفٍ ثابتةً وأزرارُها بلا خاصية، فيبتلعها حارسُ
   الأزرار الميتة ويقول نصَّها. فصارت تقرأ `STATE.users` وتكتب فيها. */
var USR = { q:'', edit:'', role:'', log:'' };   /* (V32.3) شاشةُ المستخدمين تملك حالتَها (كانت USR.q/USR.edit/USR.role/USR.log) */

/* من يظهر لي: من رتبتُه دوني — ونفسي. ومن يُدير الأدوارَ يرى الجميعَ
   لأنه هو من يرفعهم ويخفضهم. */
/* ═══ من يرى مَن ═══
   كان مَن يملك «إدارة الحسابات» (المهندسُ ومديرُ المشروع) يرى الجميعَ ومنهم
   من هو فوقه — فيرى المهندسُ حسابَ مدير المشروع والإدارةِ العليا، ويرى
   المشرفُ حسابَ المهندس. والقاعدةُ التي أرادها صاحبُ المشروع: **لا يُرى إلا
   من هو في رتبتك أو دونها**، فمن فوقك ليس من شأنك. والإدارةُ العليا وصاحبُ
   المشروع فوق الجميع فيريان الكلَّ. والمطّلعُ الوزاريُّ ليس من الفريق: لا
   يظهر لأحدٍ من الميدان، ولا يرى هو إلا نظراءَه من الوزارة. */
function canSeeUser(u){
  if (!u) return false;
  var meR = effRole(ROLE), uR = roleOfUser(u);
  if (u.name && u.name === STATE.meta.name) return true;      /* نفسي دائمًا */
  if (meR === 'viewer') return uR === 'viewer';               /* الوزارةُ نظراءَها وحدَهم */
  /* حساباتُ الوزارة: يراها نظراؤها، ومن يُنشئها ويوزّع كلماتِها ويكون
     مديرَها في الشجرة — المهندسُ فما فوق (V18.1؛ كانت لمدير المشروع فما فوق
     منذ V17.6، فكان المهندسُ يُقترَح مديرًا لحسابٍ لا يراه). وتبقى محجوبةً عن
     المشرف فما دون. */
  if (uR === 'viewer') return rankOf(meR) >= rankOf('engineer');
  if (meR === 'exec' || isBossHere()) return true;            /* من فوق الجميع يرى الجميع */
  return rankOf(meR) >= rankOf(uR);                           /* رتبتي فما دونها */
}
/* ═══ سجلُّ المستخدم — متى دخل وماذا فعل (V17.30) ═══
   السؤالُ في كلِّ مراجعة: هذا الحسابُ، متى كان آخرُ ظهورٍ له؟ وماذا فعل؟
   والجوابُ كان متفرّقًا: الحضورُ في مجموعته، والأحداثُ في سجلِّها، وعملُه
   في الزيارات والتركيبات والصور. فيُجمَع هنا لكلِّ حساب — من الميدان إلى
   الوزارة — في صفحةٍ واحدة: آخرُ ظهورٍ وجهازُه ونسختُه، وعددُ ما عمل بكلِّ
   نوع، وخطٌّ زمنيٌّ بما فعله. ولا يُنشَأ لذلك شيءٌ جديد: كلُّه مقروءٌ ممّا
   هو مسجَّلٌ أصلًا. */
function userPresence(name){
  var P = STATE.presence || {}, best = null;
  Object.keys(P).forEach(function(k){
    var p = P[k] || {};
    if ((p.name || '') !== name) return;
    if (!best || (+p.at || 0) > (+best.at || 0)) best = p;
  });
  return best;
}
function userLog(name, cap){
  var out = [], push = function(at, what, kind, site){
    if (!at) return; out.push({ at:+at || 0, what:what, kind:kind || '', site:site || '' });
  };
  Object.keys(STATE.recs || {}).forEach(function(id){
    var r = STATE.recs[id] || {};
    if (r.by === name) push(r.at, 'زيارة ميدانية', 'visit', id);
    if (r.apprBy === name) push(r.apprAt || r.at, 'اعتماد تقني', 'ok', id);
    if (r.minBy === name) push(r.minAt, 'قرارُ الوزارة', 'ok', id);
    if (r.revisitBy === name) push(r.revisitAt, 'ردٌّ لزيارةٍ أخرى', 'back', id);
    if (r.briefBy === name) push(r.briefAt, 'تفاصيل مختصرة', 'note', id);
  });
  Object.keys(STATE.inss || {}).forEach(function(id){ var x = STATE.inss[id] || {}; if (x.by === name) push(x.at, 'تركيب', 'ins', id); });
  Object.keys(STATE.diss || {}).forEach(function(id){ var x = STATE.diss[id] || {}; if (x.by === name) push(x.at, 'فكّ', 'dis', id); });
  Object.keys(STATE.photos || {}).forEach(function(k){ var p = STATE.photos[k] || {}; if (p.by === name) push(p.at, 'رفعُ صورة', 'photo', p.site || ''); });
  Object.keys(STATE.tasks || {}).forEach(function(k){
    var x = STATE.tasks[k] || {};
    if (x.by === name) push(x.at, 'إسنادُ مهمة', 'task', x.site || '');
    if (x.to === name && x.status === 'مُنجز') push(x.doneAt || x.at, 'إنجازُ مهمة', 'task', x.site || '');
  });
  /* المكتبُ كالميدان: من يشتري ومن يحرّك المخزنَ ومن يقدّم مستخلصًا ومن
     يتابع شحنةً — سجلُّه كان يبدو فارغًا لأن مصادرَه لم تُقرَأ (V17.30). */
  Object.keys(STATE.buys || {}).forEach(function(k){
    var b = STATE.buys[k] || {};
    if (b.by === name) push(b.at, t('شراء') + (b.item ? ' — ' + b.item : '') + (b.amt ? ' \u00b7 ' + nm(+b.amt) + ' ' + t('ريال') : ''), 'buy', b.site || '');
    if (b.apprBy === name) push(b.apprAt || b.at, 'اعتمادُ شراء' + (b.item ? ' — ' + b.item : ''), 'ok', b.site || '');
  });
  Object.keys(STATE.moves || {}).forEach(function(k){
    var m = STATE.moves[k] || {};
    if (m.by === name) push(m.at, 'حركةُ مخزون' + (m.item ? ' — ' + m.item : '') + (m.qty ? ' \u00b7 ' + nm(+m.qty) : ''), 'inv', m.site || '');
  });
  Object.keys(STATE.ipc || {}).forEach(function(k){
    var x = STATE.ipc[k] || {};
    if (x.by === name) push(x.at, 'مستخلص' + (x.no ? ' — ' + x.no : ''), 'ipc', '');
    if (x.apprBy === name) push(x.apprAt || x.at, 'اعتمادُ مستخلص' + (x.no ? ' — ' + x.no : ''), 'ok', '');
  });
  Object.keys(STATE.ships || {}).forEach(function(k){
    var sh = STATE.ships[k] || {};
    if (sh.by === name) push(sh.at, 'شحنة' + (sh.ref ? ' — ' + sh.ref : '') + (sh.st ? ' \u00b7 ' + t(sh.st) : ''), 'ship', '');
  });
  Object.keys(STATE.maints || {}).forEach(function(k){
    var mm = STATE.maints[k] || {};
    if (mm.by === name) push(mm.at, 'صيانة' + (mm.fault ? ' — ' + String(mm.fault).slice(0, 40) : ''), 'fix', k);
  });
  evAll().forEach(function(e){ if (evActor(e).name === name) push(e.ts, e.what, 'ev', e.site || ''); });
  out.sort(function(a, b){ return b.at - a.at; });
  var seen = {}, uniq = [];
  out.forEach(function(x){ var k = x.at + '|' + x.what; if (!seen[k]){ seen[k] = 1; uniq.push(x); } });
  return cap ? uniq.slice(0, cap) : uniq;
}
function userStats(name){
  var L = userLog(name), c = {};
  L.forEach(function(x){ c[x.kind] = (c[x.kind] || 0) + 1; });
  return { n:L.length, last:L.length ? L[0].at : 0, byKind:c };
}
/* USR.log مُعلَنٌ مع USR أعلاه (V32.3) */
function userLogHtml(uid){
  var u = (STATE.users || {})[uid] || {}, name = u.name || '';
  var p = userPresence(name), st = userStats(name), L = userLog(name, 200);
  var KIND = { visit:'\u{1F4CD}', ins:'\u{1F527}', dis:'\u{1F9E9}', photo:'\u{1F4F7}', ok:'\u2705',
               back:'\u21A9', note:'\u{1F5E8}', task:'\u{1F4CB}', ev:'\u2022',
               buy:'\u{1F6D2}', inv:'\u{1F4E6}', ipc:'\u{1F9FE}', ship:'\u{1F69B}', fix:'\u{1F6E0}' };
  return '<div class="wt-back" data-ulclose="0"></div>'
    + '<div class="pop wt-sheet" id="ulSheet" role="dialog" aria-label="' + esc(t('سجلُّ المستخدم')) + '">'
    + '<div class="pop-head"><div style="min-width:0">'
    +   '<div class="pid hint" style="margin:0">' + esc(t(roleName(u.role) || u.role || '')) + '</div>'
    +   '<h3 style="margin-top:3px">' + esc(name || u.user || '') + '</h3></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm pop-x" data-ulclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">'
    +   stats([['آخر ظهور', p ? esc(stepAgo(p.at)) : esc(t('لم يظهر بعد')), p && (Date.now() - (+p.at || 0) < 3600000) ? 'ok' : ''],
              ['الأفعال المسجَّلة', N(st.n)],
              ['آخر فعل', st.last ? esc(stepAgo(st.last)) : '—']])
    +   (p ? '<p class="hint" style="margin:0 0 8px">' + esc(t('الجهاز')) + ': ' + esc(p.dev || p.uid || '—')
            + (p.ver ? ' \u00b7 ' + esc(p.ver) : '') + (p.role ? ' \u00b7 ' + esc(t(roleName(p.role) || p.role)) : '')
            + (p.reads ? ' \u00b7 ' + esc(t('قراءات')) + ' ' + nm(p.reads) : '') + '</p>' : '')
    +   (st.n
        ? '<div class="chips" style="margin:0 0 8px">'
          + Object.keys(st.byKind).map(function(k){
              return '<span class="chip">' + (KIND[k] || '\u2022') + ' <span class="num">' + nm(st.byKind[k]) + '</span></span>'; }).join('')
          + '</div>'
          + '<div class="wt-log">' + L.map(function(x){
              return '<div class="wt-le"><span class="hint num" style="margin:0">' + esc(fmtDT(x.at)) + '</span> '
                + (KIND[x.kind] || '\u2022') + ' ' + esc(t(x.what))
                + (x.site ? ' <a href="#" data-ulsite="' + esc(x.site) + '">' + esc(x.site) + '</a>' : '') + '</div>';
            }).join('') + '</div>'
          + ''
        : '<p class="hint" style="margin:0">' + esc(t('لا أفعالَ مسجَّلةً لهذا الحساب بعد — أو لم يُجلَب سجلُّ الأحداث.')) + '</p>')
    +   '<p class="hint" style="margin:8px 0 0">' + esc(t('مقروءٌ ممّا هو مسجَّلٌ أصلًا: الحضورُ والزياراتُ والتركيباتُ والصورُ والمهامُّ وسجلُّ الأحداث.')) + '</p>'
    + '</div></div>';
}
function usersList(){
  var U = STATE.users || {}, out = [];
  Object.keys(U).forEach(function(uid){
    var u = U[uid] || {};
    if (!canSeeUser(u)) return;
    if (USR.role && u.role !== USR.role) return;
    var hay = (u.name || '') + ' ' + (u.user || '') + ' ' + (u.role || '');
    if (USR.q && hay.indexOf(USR.q) < 0) return;
    out.push([uid, u]);
  });
  return out.sort(function(a, b){ return arCmp(a[1].name || '', b[1].name || ''); });
}

/* ═══ حذفُ الحساب ═══
   كان التعطيلُ وحدَه — فتبقى الحساباتُ المكرَّرةُ والخاطئةُ في القائمة إلى
   الأبد. صار الحذفُ للمهندس ومدير المشروع فما فوق: يُمحى من القاعدة فورًا
   ويختفي من كلِّ جهاز، ويُكتَب للخادم طلبُ حذفِ حسابِ الدخول فلا يدخل
   صاحبُه بعدها. ولا يحذف أحدٌ نفسَه، ولا من هو أعلى منه رتبة. */
function usrDel(uid){
  if (rankOf(ROLE) < rankOf('engineer')){ toast(t('حذفُ الحسابات للمهندس ومدير المشروع')); return false; }
  var u = (STATE.users || {})[uid];
  if (!u){ toast(t('لا حسابَ بهذا المعرِّف')); return false; }
  if (uid === myUid()){ toast(t('لا تحذف حسابَك')); return false; }
  if (rankOf(roleOfUser(u)) > rankOf(ROLE)){ toast(t('لا تحذف من هو أعلى منك رتبة')); return false; }
  var nm2 = u.name || u.user || uid;
  if (typeof confirm === 'function' && !confirm(t('حذفُ الحساب') + ' ' + nm2 + '\n' + t('يُمحى من القاعدة ولا يدخل صاحبُه بعدها. لا رجوع.'))){
    toast(t('أُلغي الحذف')); return false;
  }
  delete STATE.users[uid];
  CORE.rm('users', uid);
  /* حسابُ الدخول يُحذَف من الخادم — المتصفّحُ لا يملك ذلك */
  if (u.user || /^[A-Za-z0-9]{20,}$/.test(uid)){
    var key = 'del-' + uid;
    STATE.provision = STATE.provision || {};
    STATE.provision[key] = { action:'delete', uid:uid, user:u.user || '', name:nm2, status:'pending', at:Date.now(), by:STATE.meta.name || '' };
    CORE.set('provision', key, STATE.provision[key]);
    provKick(true);
  }
  if (u.user && (STATE.pending || {})[u.user]){ delete STATE.pending[u.user]; CORE.rm('pending', u.user); }
  /* طلبُ إنشائه يُمحى معه: كان يبقى «تمّ» في القائمة بعد حذف صاحبه — ثمانيةُ
     أسطرٍ لحساباتٍ لم تعد موجودة، ومنها ما يحمل كلمةَ مرورٍ. المطابقةُ باسم
     المستخدم بلا حساسيةٍ لحالة الحروف (M.shaaraqi = m.shaaraqi). */
  var uname = String(u.user || '').toLowerCase();
  Object.keys(STATE.provision || {}).forEach(function(k){
    var pr = STATE.provision[k] || {};
    if (pr.action === 'delete') return;
    if (uname && (k.toLowerCase() === uname || String(pr.user || '').toLowerCase() === uname)){
      delete STATE.provision[k]; CORE.rm('provision', k);
    }
  });
  logEvent('حذف حساب — ' + nm2 + ' (' + (u.user || uid) + ')');
  toast(t('حُذف') + ' ' + nm2);
  statBump(); render(1);
  return true;
}
/* معرِّفُ حسابِ دخولٍ حقيقيّ — لا اسمُ مستخدمٍ ولا مفتاحٌ مؤقت */
function uidLike(k){ return /^[A-Za-z0-9]{20,}$/.test(String(k || '')); }
/* ═══ الحسابُ المكرَّر ═══
   كان تعديلُ الصفِّ المؤقت (باسم المستخدم ريثما يُنشئه الخادم) يكتب وثيقةً
   في القاعدة باسم المستخدم — فيصير للشخص وثيقتان: users/k.bandar بالدور
   المعدَّل، وusers/{uid} التي كتبها الخادم. فيظهر مرتين في كلِّ جهاز.
   صار تعديلُ المؤقت يذهب إلى طلبِ الإنشاء نفسِه فيطبّقه الخادمُ عند الإنشاء،
   والقديمُ المكرَّرُ يُدمَج بضغطة: تبقى وثيقةُ المعرِّف وتُمحى الباقية. */
function usrSet(uid, patch){
  if (!may('users')){ toast(t('إدارةُ المستخدمين للمهندس وحده')); return; }
  var U = STATE.users || (STATE.users = {});
  var u = Object.assign({}, U[uid] || {}, patch);
  U[uid] = u;
  if (u.provisioning && !uidLike(uid)){
    var pr = (STATE.provision || {})[uid];
    if (pr && pr.status === 'pending'){
      var pv = Object.assign({}, pr, patch, { roleExplicit:true });
      STATE.provision[uid] = pv; CORE.set('provision', uid, pv);
      provKick(true);
      logEvent('تعديل طلب حساب — ' + (u.name || uid) + ' · ' + Object.keys(patch).join('،'));
      toast(t('حُفظ في طلب الإنشاء — يطبّقه الخادمُ عند الإنشاء'));
    } else toast(t('الحسابُ يُنشَأ — عدّله بعد أن يُنشئه الخادم'));
    render(1); return;
  }
  CORE.set('users', uid, u);
  logEvent('تعديل مستخدم — ' + (u.name || uid) + ' · ' + Object.keys(patch).join('،'));
  toast(t('حُفظ'));
  render(1);
}

/* حساباتٌ بالاسم نفسِه: تُجمَع بلا حساسيةٍ لحالة الحروف */
function usrDupes(){
  var U = STATE.users || {}, by = {};
  Object.keys(U).forEach(function(k){
    var un = String((U[k] || {}).user || '').toLowerCase(); if (!un) return;
    (by[un] = by[un] || []).push(k);
  });
  var out = {};
  Object.keys(by).forEach(function(un){ if (by[un].length > 1) out[un] = by[un]; });
  return out;
}
function usrMerge(un){
  if (!may('users')){ toast(t('إدارةُ المستخدمين للمهندس وحده')); return false; }
  var keys = usrDupes()[String(un || '').toLowerCase()] || [];
  if (keys.length < 2){ toast(t('لا مكرَّرَ لهذا الاسم')); return false; }
  var U = STATE.users;
  /* يبقى حسابُ الدخول: المعرِّفُ الحقيقيُّ أوّلًا، وإلا الأحدث */
  var keep = keys.filter(uidLike).sort(function(a, b){ return (U[b].at || 0) - (U[a].at || 0); })[0]
          || keys.sort(function(a, b){ return (U[b].at || 0) - (U[a].at || 0); })[0];
  var merged = Object.assign({}, U[keep]);
  keys.forEach(function(k){
    if (k === keep) return;
    ['job','sup','dept','ph','email','crew','jobLog'].forEach(function(f){ if (merged[f] == null && U[k][f] != null) merged[f] = U[k][f]; });
  });
  delete merged.provisioning;
  U[keep] = merged; CORE.set('users', keep, merged);
  keys.forEach(function(k){ if (k !== keep){ delete U[k]; CORE.rm('users', k); } });
  logEvent('دمج حساب مكرَّر — ' + (merged.name || un) + ' · ' + t('بقي') + ' ' + keep + ' · ' + t('مُحي') + ' ' + nm(keys.length - 1));
  toast(t('دُمج') + ' — ' + t('بقي حسابُ الدخول ومُحي المكرَّر'));
  statBump(); render(1);
  return true;
}
/* كلمةُ مرورٍ جديدة: عشرةُ أحرفٍ بلا ما يلتبس (0/O، 1/l) */
function genPass(){
  var A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789', o = '';
  for (var i = 0; i < 10; i++) o += A[Math.floor(Math.random() * A.length)];
  return o;
}
/* ═══ إعادةُ إصدار كلمة المرور ═══
   من نسي كلمتَه لا يُغيّرها المتصفّحُ لغيره — الخادمُ وحده يملك حسابَ الدخول.
   فيُكتَب طلبٌ باسم المستخدم نفسِه وكلمةٍ جديدة، والخادمُ يضبطها ويُعلِّم
   الحسابَ «تُبدَّل أوّلَ دخول»، وتظهر الكلمةُ هنا وفي ورقة الدخول. */
/* ═══ كلمةُ المرور الجديدة — ضغطةٌ واحدةٌ إلى النهاية ═══
   كانت أربعَ خطواتٍ في ثلاث شاشات: «كلمة جديدة» تكتب طلبًا في طابور الجهاز،
   ثم «ادفع الآن»، ثم «شغّل الخادم»، ثم ورقةُ الدخول — وأيُّ حلقةٍ تقف (طابورٌ
   لا يُرفَع على شبكةٍ بطيئة، خادمٌ لم يُشغَّل) تركت الفنيَّ بلا كلمة. صارت
   ضغطةً: الطلبُ يُكتَب في القاعدة مباشرةً بانتظار جوابها (فيُرى الرفضُ بسببه
   لا يُبتلَع)، ثم يُشغَّل الخادمُ من التطبيق، ثم يُراقَب الطلبُ حتى «تمّ» —
   وتظهر الكلمةُ كبيرةً بزرِّ نسخٍ وزرِّ واتساب. */
/* ═══ الطلبُ يُنفَّذ بمجرّد كتابته ═══
   كان كلُّ طلبٍ يحتاج ضغطةً ثانيةً على «شغّل الخادم الآن» — والمكتبُ ينسى،
   فيبقى الحسابُ «يُنشَأ» حتى تجيءَ الجدولة. وليست الضغطةُ إذنًا يُطلَب: من
   كتب الطلبَ قصد تنفيذَه. فصارت كلُّ كتابةٍ في «provision» تُتبِع نفسَها
   بتشغيلٍ للخادم — بمهلةِ ثانيتين تجمع الطلباتِ المتتابعة (استيرادُ ثلاثين
   حسابًا = تشغيلٌ واحد)، وبفاصلٍ لا يقلُّ عن عشرين ثانيةً بين تشغيلَين فلا
   تُستهلَك حصةُ السيور. ومن لا مفتاحَ عنده يبقى له الزرُّ. */
var PROV_KICK = 0, PROV_LAST = 0, PROV_QUIET = false;
function provKick(quiet){
  if (!may('provision') || !FB.ready) return;
  /* بلا مفتاح تشغيلٍ على هذا الجهاز (مفتاحُ السيور للإدارة وحدها — V17.93): الطلبُ
     مكتوبٌ في القاعدة والخادمُ المجدولُ يتولّاه خلال دقائق — يُقال ذلك لا يُسكَت */
  if (!ghToken()){ if (!quiet) toast(t('كُتب الطلب — يُنشئ الخادمُ الحسابَ خلال دقائق')); return; }
  if (quiet) PROV_QUIET = true;
  clearTimeout(PROV_KICK);
  PROV_KICK = setTimeout(function(){
    var gap = Date.now() - PROV_LAST;
    if (gap < 20000){ PROV_KICK = setTimeout(function(){ provKick(PROV_QUIET); }, 20000 - gap); return; }
    PROV_LAST = Date.now();
    var q = PROV_QUIET; PROV_QUIET = false;
    ghRunNow(true).then(function(ok){
      if (!ok) return;
      if (!q) toast(t('أُرسل إلى الخادم — يُنفَّذ خلال دقيقة'));
      if (PW_FLOW && PW_FLOW.st !== 'done') pwFlowSet('wait');
      if (PW_FLOW && typeof pwFlowWatch === 'function') pwFlowWatch();
    });
  }, 2000);
}
var PW_FLOW = null, PW_POLL = 0;
function pwFlowStart(u, pass){
  PW_FLOW = { user:u.user, name:u.name || u.user, pass:pass, st:'writing', at:Date.now(), why:'' };
  clearInterval(PW_POLL); PW_POLL = 0;
  render(1);
}
function pwFlowSet(st, why){ if (!PW_FLOW) return; PW_FLOW.st = st; PW_FLOW.why = why || ''; render(1); }
function pwFlowWatch(){
  clearInterval(PW_POLL);
  var tries = 0;
  PW_POLL = setInterval(function(){
    if (!PW_FLOW || !FB.ready || !FB.db){ clearInterval(PW_POLL); PW_POLL = 0; return; }
    tries++;
    DB.col('provision').doc(PW_FLOW.user).get().then(function(d){
      FB.readCount = (FB.readCount || 0) + d.size;
      var v = d && d.exists ? (d.data() || {}) : {};
      if (v.status === 'done'){ clearInterval(PW_POLL); PW_POLL = 0; STATE.provision[PW_FLOW.user] = v; pwFlowSet('done'); logEvent('كلمةٌ جديدةٌ ضُبطت — ' + PW_FLOW.user); }
      else if (v.status === 'error'){ clearInterval(PW_POLL); PW_POLL = 0; pwFlowSet('error', v.why || ''); }
      else if (tries > 36){ clearInterval(PW_POLL); PW_POLL = 0; pwFlowSet('slow'); }
    }).catch(function(e){ LS_ERR = e; });
  }, 5000);
}
function pwFlowHtml(){
  if (!PW_FLOW) return '';
  var f = PW_FLOW, big = '<div style="font:700 26px/1.4 ui-monospace,monospace;letter-spacing:.06em;direction:ltr;text-align:center;padding:10px;border:1px dashed rgba(255,255,255,.25);border-radius:10px;user-select:all">' + esc(f.pass) + '</div>';
  var wa = 'https://wa.me/?text=' + encodeURIComponent(t('اسم المستخدم') + ': ' + f.user + '\n' + t('كلمة المرور') + ': ' + f.pass + '\n' + t('تُبدّلها أوّلَ دخول') + '\n' + location.origin + location.pathname);
  var body = '<p class="hint" style="margin:0 0 8px">' + esc(dispName(f.name)) + ' \u00b7 <span dir="ltr">' + esc(f.user) + '</span></p>' + big
    + '<div class="actions" style="margin-top:10px">'
    + btn('\u{1F4CB} ' + t('انسخ'),'btn-secondary btn-sm',' data-pwcopy="1"')
    + '<a class="btn btn-primary btn-sm" href="' + esc(wa) + '" target="_blank" rel="noopener">\u{1F4AC} ' + esc(t('أرسل عبر واتساب')) + '</a>'
    + btn(t('إغلاق'),'btn-quiet btn-sm',' data-pwclose="1"')
    + '</div>';
  var st = { writing:['warn','يُكتَب الطلبُ في القاعدة…'], run:['warn','يُشغَّل الخادم… الكلمةُ تُضبَط خلال دقيقة'], wait:['warn','الخادمُ يعمل — انتظر، تظهر «تمّ» هنا'],
             done:['ok','تمّ — الكلمةُ صالحةٌ الآن. أرسلها لصاحبها؛ يبدّلها أوّلَ دخول'], error:['bad','رُفض: ' + (f.why || '')], slow:['bad','تأخّر الخادمُ أكثرَ من ثلاث دقائق — اضغط «شغّل الخادم الآن» في طلبات الإنشاء وعُد'],
             nokey:['bad','كُتب الطلب — لا مفتاحَ لتشغيل الخادم من التطبيق: اضغط «شغّل الخادم الآن» في طلبات الإنشاء'] }[f.st] || ['warn', f.st];
  return card('\u{1F511} ' + t('كلمةُ مرورٍ جديدة'), alertBox(st[0], st[1]) + body);
}
/* ═══ تبديلُ اسم الدخول ═══
   حقلُ «اسم المستخدم» في الشاشة كان يُعرَض ولا يُحفَظ: الاسمُ هويةٌ في
   المصادقة لا حقلٌ في الوثيقة، فتعديلُه بيدٍ يغيّر ما يُقرَأ ولا يغيّر ما
   يُدخَل به — يبقى القديمُ عاملًا ويظنُّ المكتبُ أنه بدّله. صار طلبًا للخادم
   كطلب الكلمة: يبدّل بريدَ المصادقة وحقلَ الوثيقة معًا، والمعرِّفُ لا يتغيّر
   فيبقى كلُّ ما كتبه صاحبُه منسوبًا إليه. */
function usrRename(uid, to){
  if (!canProvision()){ toast(t('إدارةُ الحسابات للمهندس وحده')); return false; }
  var u = (STATE.users || {})[uid]; if (!u || !u.user){ toast(t('لا حسابَ لتبديله')); return false; }
  to = String(to || '').trim().toLowerCase();
  if (!/^[A-Za-z0-9._-]{3,}$/.test(to)){ toast(t('اسمُ الدخول: حروفٌ لاتينيةٌ وأرقامٌ ونقطةٌ — ثلاثةٌ فأكثر')); return false; }
  if (to === String(u.user).toLowerCase()){ toast(t('الاسمُ نفسُه')); return false; }
  var taken = Object.keys(STATE.users || {}).some(function(k){ return k !== uid && String((STATE.users[k] || {}).user || '').toLowerCase() === to; });
  if (taken){ toast(t('الاسمُ مستعملٌ لحسابٍ آخر')); return false; }
  /* الفحصُ المستعمَلُ يسبق فحصَ الصيغة في القراءة لا في التنفيذ — والترتيبُ
     هنا: صيغةٌ ثم تكرارٌ ثم تطابق. أُعيد ترتيبُه ليقول السببَ الصحيح. */
  var req = { user:u.user, newUser:to, action:'rename', uid:uid, name:u.name || '', role:u.role || 'tech',
              roleExplicit:false, status:'pending', at:Date.now(), by:STATE.meta.name || '' };
  STATE.provision = STATE.provision || {}; STATE.provision[u.user] = req;
  logEvent('طلبُ تبديلِ اسم الدخول — ' + u.user + ' \u2190 ' + to);
  pwFlowStart({ user:u.user + ' \u2190 ' + to, name:u.name || '' }, '');
  if (!FB.ready || !FB.db){ CORE.set('provision', u.user, req); pwFlowSet('nokey'); return true; }
  var doc = Object.assign({}, req, { _at:Date.now(), _by:STATE.meta.uid || '' });
  DB.col('provision').doc(u.user).set(FB.clean ? FB.clean(doc) : doc, { merge:true }).then(function(){
    if (!ghToken()){ pwFlowSet('nokey'); return; }
    pwFlowSet('run'); provKick(true);
  }).catch(function(e){ pwFlowSet('error', String(e && (e.code || e.message) || '').slice(0, 80)); });
  return true;
}
function usrPwReset(uid){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return false; }
  var u = (STATE.users || {})[uid];
  if (!u || !u.user){ toast(t('لا اسمَ مستخدمٍ لهذا الحساب')); return false; }
  if (!canMakeRole(roleOfUser(u) || u.role || 'tech')){ toast(t('لا تُعيد كلمةَ من هو أعلى منك رتبة')); return false; }
  var pass = genPass();
  var req = { user:u.user, name:u.name || u.user, role:u.role || 'tech', roleExplicit:false, pass:pass, reissue:true,
              status:'pending', at:Date.now(), by:STATE.meta.name || '' };
  STATE.provision = STATE.provision || {};
  STATE.provision[u.user] = req;
  logEvent('إعادة إصدار كلمة مرور — ' + (u.name || u.user) + ' (' + u.user + ')');
  pwFlowStart(u, pass);
  if (!FB.ready || !FB.db){ CORE.set('provision', u.user, req); pwFlowSet('nokey', ''); statBump(); return pass; }
  /* مباشرةً إلى القاعدة — لا طابورَ يقف على شبكةٍ بطيئة، والرفضُ يُرى بسببه */
  var doc = Object.assign({}, req, { _at:Date.now(), _by:STATE.meta.uid || '' });
  DB.col('provision').doc(u.user).set(FB.clean ? FB.clean(doc) : doc, { merge:true }).then(function(){
    if (!ghToken()){ pwFlowSet('nokey'); return; }
    pwFlowSet('run'); provKick(true);
  }).catch(function(e){ pwFlowSet('error', String(e && (e.code || e.message) || '').slice(0, 80)); });
  statBump();
  return pass;
}
function usersCard(){
  var L = usersList(), U = STATE.users || {};
  var DUP = usrDupes();
  var roleOpts = function(cur){
    return Object.keys(ROLES).map(function(k){
      return '<option value="' + esc(k) + '"' + (cur===k?' selected':'') + '>'
        + esc(t(ROLES[k].n)) + '</option>'; }).join('');
  };
  return cardFlush(t('المستخدمون') + ' — ' + nm(L.length) + (USR.q ? ' / ' + nm(Object.keys(U).length) : ''),
      L.length
        ? table(['الاسم','الدور','الحالة','أُنشئ في','إجراءات'],
            L.map(function(x){
              var uid = x[0], u = x[1], on = u.active !== false;
              if (USR.edit === uid){
                var jbOpts = '<option value="">— ' + esc(t('بلا وظيفة')) + ' —</option>'
                  + jobsList().map(function(j){ return '<option value="' + esc(j.id) + '"'
                      + (u.job === j.id ? ' selected' : '') + '>' + esc(t(j.n)) + '</option>'; }).join('');
                var supOpts = mgrOptions(roleOfUser(u) || u.role, u.sup || '', uid);
                return ['<input data-usrn="' + esc(uid) + '" value="' + esc(u.name || '') + '" dir="auto" style="min-width:150px">'
                        + '<div class="usrEd" style="margin-top:6px">'
                        + '<label class="mini">' + esc(t('اسم الدخول')) + '</label>'
                        + '<input data-usru="' + esc(uid) + '" value="' + esc(u.user || '') + '" dir="ltr" style="min-width:130px">'
                        + btn('\u{1F504} ' + t('بدّل اسم الدخول'),'btn-quiet btn-sm',' data-usrren="' + esc(uid) + '"')
                        + '<span class="hint" style="margin:0;display:block">' + esc(t('اسمُ الدخول هويةٌ في المصادقة — يُبدَّل من الخادم بزرِّه، لا بحفظ الصف.')) + '</span></div>',
                        '<div class="usrEd">'
                        + '<label class="mini">' + esc(t('الدور')) + '</label><select data-usrr="' + esc(uid) + '">' + roleOpts(u.role) + '</select>'
                        + '<label class="mini">' + esc(t('الوظيفة')) + '</label><select data-usrj="' + esc(uid) + '">' + jbOpts + '</select>'
                        + '<label class="mini">' + esc(t('القسم')) + '</label><select data-usrd="' + esc(uid) + '">' + deptOptions(u.dept || '') + '</select>'
                        + '<label class="mini">' + esc(t('مديره')) + '</label><select data-usrs="' + esc(uid) + '">' + supOpts + '</select>'
                        /* الجوالُ: كان حقلًا في البيانات (ph) يقرؤه إشعارُ واتساب ولا شاشةَ تكتبه (V16.97) */
                        + '<label class="mini">' + esc(t('الجوال')) + '</label><input data-usrph="' + esc(uid) + '" value="' + esc(u.ph || '') + '" dir="ltr" inputmode="tel" placeholder="05…" style="min-width:130px">'
                        + '</div>',
                        (on ? pill('نشط', 'ok') : (u.self ? pill(t('ينتظر التفعيل'), 'wrn') : pill('معطل', 'off'))),
                        '<span class="num">' + esc(u.at > 1e11 ? dayKey(u.at) : String(u.at || '').slice(0,10)) + '</span>',
                        btn('احفظ','btn-primary btn-sm',' data-usrsave="' + esc(uid) + '"')
                        + btn('إلغاء','btn-quiet btn-sm',' data-usredit=""')
                        + btn('🗑 ' + t('حذف الحساب'),'btn-danger btn-sm',' data-usrdel="' + esc(uid) + '"')];
              }
              var dupK = String(u.user || '').toLowerCase(), isDup = !!DUP[dupK];
              return ['<strong>' + esc(u.name || uid) + '</strong><br><span class="hint" dir="ltr" style="margin:0">'
                        + esc(u.user || '') + '</span>'
                        + (isDup ? '<br>' + pill('مكرَّر','off') + (may('users') ? ' ' + btn('\u{1F9F9} ' + t('دمج'),'btn-quiet btn-sm',' data-usrmerge="' + esc(dupK) + '"') : '') : '')
                        + (u.provisioning ? '<br>' + pill('يُنشَأ','wrn')
                            + (may('users') && !((STATE.provision || {})[u.user || uid] || {}).status
                                ? ' ' + pill('بلا طلبٍ في القاعدة','off') + ' ' + btn('\u{1F501} ' + t('أعد الطلب'),'btn-quiet btn-sm',' data-usrreq="' + esc(uid) + '"')
                                : '')
                            + (may('users') ? ' ' + btn('\u26A1 ' + t('أنشئه من هذا الجهاز الآن'),'btn-primary btn-sm',' data-provlocal="' + esc(u.user || uid) + '"') : '')   /* (V30.7) لا ينتظر الخادم — للمهندس فما فوق: القاعدةُ تسمح لهم بكتابة وثيقة المستخدم */
                            : ''),
                      esc(t((ROLES[u.role] || {}).n || u.role || '—'))
                        + ((u.job && jobOf(u.job)) || u.dept || u.sup
                            ? '<br><span class="hint" style="margin:0">'
                              + (u.job && jobOf(u.job) ? '💼 ' + esc(jobOf(u.job).n) : '')
                              + (u.dept ? ' \u00b7 ' + esc(deptName(u.dept)) : '')
                              + (u.sup ? ' \u00b7 \u2B06 ' + esc(t('مديره')) + ' ' + esc(u.sup) : '')
                              + '</span>' : '')
                        + '<br><span class="hint num" style="margin:0">\u{1F4F1} ' + (u.ph ? esc(u.ph) : '<span style="color:#E05252">' + esc(t('بلا جوال')) + '</span>') + '</span>',
                      (on ? pill('نشط', 'ok') : (u.self ? pill(t('ينتظر التفعيل'), 'wrn') : pill('معطل', 'off'))),
                      '<span class="num">' + esc(u.at > 1e11 ? dayKey(u.at) : String(u.at || '').slice(0,10)) + '</span>',
                      /* الوزارةُ تقرأ الجدولَ ولا تُعدّل: التعديلُ والتعطيلُ لمن يُنشئ */
                      btn('\u{1F5D2} ' + t('السجل'),'btn-quiet btn-sm',' data-usrlog="' + esc(uid) + '"')
                      + (canProvision() ? btn(t('تعديل'),'btn-quiet btn-sm',' data-usredit="' + esc(uid) + '"') : '')
                      + (uidLike(uid) && u.user && canProvision() && uid !== myUid()
                            ? btn('\u{1F511} ' + t('كلمة جديدة'),'btn-quiet btn-sm',' data-usrpw="' + esc(uid) + '" title="' + esc(t('يكتب طلبًا فيضبط الخادمُ كلمةً جديدةً — لمن نسي كلمتَه')) + '"') : '')
                      + (rankOf(ROLE) >= rankOf('engineer') && uid !== myUid()
                            ? btn('\u{1F5D1} ' + t('حذف'),'btn-quiet btn-sm',' data-usrdel="' + esc(uid) + '" style="color:var(--danger, #e5484d)"') : '')
                        + (canProvision() ? btn(on ? t('تعطيل') : t('تفعيل'),'btn-quiet btn-sm',' data-usract="' + esc(uid) + '"') : '')];
            }))
        : '<p class="hint" style="padding:16px">'
          + esc(t(Object.keys(U).length ? 'لا مستخدمَ يطابق البحث.'
                                        : 'لا حساباتٍ بعد. هذا الجدولُ هو مكانُ كلِّ حسابٍ في النظام: منه يُعدَّل الاسمُ والوظيفةُ والقسمُ والمدير، ومنه يُعطَّل الحسابُ أو يُحذَف. أنشئ أوّلَ حسابٍ من النموذج أعلاه.')) + '</p>',
      '<form class="inline-form" onsubmit="return false">'
      + '<input type="search" id="usrQ" data-usrq="1" value="' + esc(USR.q) + '" placeholder="'
      +   esc(t('بحث')) + '" dir="auto">'
      + btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="users"')
      + (may('users')
          ? btn('🧹 ' + t('امسح قوائم الفنيين الموروثة'),'btn-quiet btn-sm',' data-tkpurge="1"'
              + ' title="' + esc(t('يحذف قائمة settings/techs القديمة من السحابة ويُفرغ من الفرق كلَّ اسمٍ لا حسابَ له — الحساباتُ لا تُمَسّ')) + '"')
          : '')
      + '</form>');
}

/* إنشاءُ حسابٍ: كانت الشاشةُ واجهةً بلا وظيفة — حقولٌ بلا معرّفاتٍ وزرٌّ
   بلا خاصية. فمن ملأها وضغط لم يقع شيءٌ ولا قيل لماذا. */
/* المعلَّقُ يُنشَأ بضغطةٍ حين تعود الشبكة — بكلمةِ مرورٍ جديدةٍ تُكتَب الآن،
   فالقديمةُ لم تُحفَظ ولا تُحفَظ. */
function pendHasAccount(user){
  var un = String(user || '').toLowerCase(), U = STATE.users || {};
  return Object.keys(U).some(function(k){ return uidLike(k) && String((U[k] || {}).user || '').toLowerCase() === un; });
}
function pendDel(user){
  if (!may('users')){ toast(t('إدارةُ الحسابات للمهندس وحده')); return false; }
  if (STATE.pending) delete STATE.pending[user];
  CORE.rm('pending', user);
  var U = STATE.users || {};
  if (U[user] && U[user].pending) delete U[user];
  logEvent('حذفُ حسابٍ معلَّق — ' + user);
  toast(user + ' \u00b7 ' + t('حُذف'));
  statBump(); render(1);
  return true;
}
function pendList(){
  var P = STATE.pending || {}, V = STATE.provision || {};
  /* من له طلبُ خادمٍ لا يُعرَض معلَّقًا — الطريقُ الجديدُ يغني عن القديم.
     ومن صار حسابًا قائمًا (بالخادم أو المباشر) لا يبقى «معلَّقًا» في جهازٍ نسيه */
  return Object.keys(P).filter(function(k){ return !V[k] && !pendHasAccount(k); }).map(function(k){ return Object.assign({ user:k }, P[k]); })
    .sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
function pendRetry(user, pass){
  if (!may('users')){ toast(t('إدارةُ الحسابات للمهندس وحده')); return; }
  var v = (STATE.pending || {})[user];
  if (!v){ toast(t('لا حسابَ معلَّقٌ بهذا الاسم')); return; }
  if (!pass || String(pass).length < 10){ toast(t('اكتب كلمةَ مرورٍ عشرةَ أحرفٍ فأكثر')); return; }
  toast(t('يُنشَأ الحساب…'));
  FB.createUser(user, pass, { name:v.name, role:v.role, doc:Object.assign({}, v, { pending:undefined }) })
    .then(function(res){
      if (res && res.ok && res.uid){
        var nv = Object.assign({}, v); delete nv.pending;
        STATE.users[res.uid] = nv;
        delete STATE.users[user];
        delete STATE.pending[user];
        CORE.rm('pending', user);
        logEvent('تفعيل حساب معلَّق — ' + user);
        toast(user + ' \u00b7 ' + t('يدخل بكلمته الآن'));
        statBump(); render(1);
        return;
      }
      softErr('تفعيل حساب معلَّق', new Error(res && res.err || 'unknown'),
        'لم يُفعَّل — راجع الشبكةَ أو اسمَ المستخدم');
    });
}
function pendCard(){
  var L = pendList();
  if (!L.length) return '';
  return cardFlush('\u23F3 ' + t('حساباتٌ معلَّقة') + ' \u2014 ' + nm(L.length),
      table(['المستخدم','الاسم','الدور','كلمةُ مرورٍ جديدة',''],
        L.map(function(x){
          return ['<span class="num" dir="ltr">' + esc(x.user) + '</span>',
                  esc(x.name || ''), esc(t((ROLES[x.role] || {}).n || x.role)),
                  '<input type="password" id="pnd_' + esc(x.user) + '" placeholder="' + esc(t('عشرةُ أحرفٍ فأكثر')) + '" dir="ltr">',
                  btn('\u26A1 ' + t('فعّله'),'btn-primary btn-sm',' data-pndgo="' + esc(x.user) + '"')
                  + (may('users') ? btn('\u{1F5D1} ' + t('احذف'),'btn-quiet btn-sm',' data-pnddel="' + esc(x.user) + '"') : '')];
        }))
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('سُجِّلت ولم تُنشَأ في المصادقة — لا يدخل صاحبُها ولا تُرى في جهازٍ آخر إلا هنا. فعّلها بكلمةِ مرورٍ جديدة؛ القديمةُ لم تُحفَظ.')) + '</p>');
}
/* ═══ من يُنشئ من ═══
   كان الإنشاءُ للمهندس وحده، فيقف الفريقُ كلُّه على مكتبٍ واحد. صار كلٌّ
   يُنشئ في مستواه أو دونه: المشرفُ يُنشئ مشرفًا أو فنيًّا ولا يُنشئ مهندسًا،
   والمهندسُ يُنشئ مهندسًا فما دون، والمديرُ الجميع. ومن فوقُ يرى كلَّ ما
   أُنشئ تحته. والقاعدةُ تحرس الرتبةَ لا الشاشةُ وحدَها. */
function canProvision(){ return rankOf(ROLE) >= rankOf('supervisor'); }
/* مديرُ المشروع يُدير الأدوارَ كلَّها فيُنشئ حتى من فوقه (حسابَ الإدارة
   العليا) — وهو الاستثناءُ الوحيد؛ المهندسُ ومن دونه في مستواهم فما دون. */
function canMakeRole(r){ return canProvision() && (may('roles') || rankOf(r) <= rankOf(ROLE)); }
function rolesICanMake(){ return Object.keys(ROLES).filter(canMakeRole); }
/* ═══ (V30.7) إنشاءُ الحساب من هذا الجهاز الآن — لا ينتظر الخادم ═══
   بلاغُ المالك «مش عارف أضيف يوزر»: الطلبُ يُكتَب للخادم، والخادمُ سيرٌ في GitHub — فإن تعطّلت مشغّلاتُه
   (كما وقع: «لم يلتقطه مشغّل») أو رُفض مفتاحُ تشغيله بقي الحسابُ «يُنشَأ» ساعات. صار من يملك الإنشاءَ يُنشئه
   من جهازه فورًا بتطبيقٍ ثانٍ لا يمسّ جلسته (FB.createUser)، ثم يُعلَّم الطلبُ «تمّ» وتُمحى كلمتُه من القاعدة
   فلا يكرّره الخادمُ إن عاد. */
function provLocal(u){
  if (!may('users')){ toast(t('الإنشاءُ من الجهاز للمهندس فما فوق — الطلبُ محفوظٌ وينفّذه الخادم')); return; }
  var req = Object.assign({}, (STATE.provision || {})[u] || {});
  var tmp = (STATE.users || {})[u] || {};
  var pass = String(req.pass || '');
  if (pass.length < 10){
    pass = String(window.prompt(t('كلمةُ مرورٍ للحساب (عشرةُ أحرفٍ فأكثر):'), '') || '');
    if (pass.length < 10){ toast(t('كلمةُ المرور عشرةُ أحرفٍ فأكثر')); return; }
  }
  var name = req.name || tmp.name || u, role = req.role || tmp.role || 'tech';
  if (!canMakeRole(role)){ toast(t('لا تُنشئ دورًا أعلى من دورك')); return; }
  toast(t('يُنشَأ الحسابُ من هذا الجهاز…'));
  return FB.createUser(u, pass, { name:name, role:role }).then(function(res){
    if (!res || !res.ok || !res.uid){
      var why = String(res && res.err || '');
      toast(/email-already-in-use/.test(why) ? t('الاسمُ موجودٌ في الدخول بالفعل — الحسابُ أُنشئ من قبل أو من الخادم') : (t('تعذّر الإنشاءُ من الجهاز') + ' \u2014 ' + why.slice(0, 60)));
      return false;
    }
    var docv = { name:name, user:u, role:role, active:true, at:Date.now(), by:STATE.meta.name || '', made:'device' };
    ['job','sup','dept','email'].forEach(function(f){ if (req[f] || tmp[f]) docv[f] = req[f] || tmp[f]; });
    if (docv.job) docv.jobLog = [{ job:docv.job, at:Date.now(), by:STATE.meta.name || '' }];
    STATE.users = STATE.users || {}; STATE.users[res.uid] = docv; delete STATE.users[u];
    CORE.set('users', res.uid, docv);
    var done = Object.assign({}, req, { status:'done', uid:res.uid, doneAt:Date.now(), doneBy:'device', pass:'' });
    STATE.provision = STATE.provision || {}; STATE.provision[u] = done; CORE.set('provision', u, done);
    logEvent('إنشاءُ حسابٍ من الجهاز — ' + name + ' (' + u + ')');
    toast(u + ' \u00b7 ' + t('أُنشئ الآن — يدخل بكلمته'));
    statBump(); render(1); return true;
  });
}
function usrAdd(){
  if (!canProvision()){ toast(t('إنشاءُ الحسابات من المشرف فصاعدًا')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var u = g('uU'), n = g('uN'), p = g('uP'), r = g('uR') || 'tech';
  var jb = g('uJ'), sup = g('uS'), dp = g('uD');
  /* الوظيفةُ تُغني عن اختيار الدور: دورُ الحساب دورُ وظيفته إن اختيرت */
  if (jb && jobOf(jb)) r = jobOf(jb).role || r;
  if (!canMakeRole(r)){ toast(t('لا تُنشئ دورًا أعلى من دورك') + ' — ' + t((ROLES[r] || {}).n || r)); return; }
  if (!u){ toast(t('اكتب اسم المستخدم')); return; }
  if (!n){ toast(t('اكتب الاسم الكامل')); return; }
  if (p.length < 10){ toast(t('كلمةُ المرور عشرةُ أحرفٍ فأكثر')); return; }
  if ((STATE.users || {})[u] || usersList().some(function(p){ return p[1] && p[1].user === u; })){
    toast(t('اسمُ المستخدم موجودٌ بالفعل')); return;
  }
  /* يُسجَّل الحسابُ في مجموعته ويُرفَع — ولا يُنشَأ في Auth من المتصفّح:
     إنشاءُ حسابٍ هناك يُبدّل الجلسةَ الحاليةَ إلى الجديد، فيخرج المهندسُ من
     حسابه وهو يُنشئ حسابًا لغيره. */
  var made = { n:n, u:u, p:p, role:r, roleAr:(ROLES[r] ? ROLES[r].n : r),
               by:STATE.meta.name || '', at:Date.now() };
  CORE.set('accounts', u, made);
  STATE.users = STATE.users || {};
  /* الوثيقةُ باسم uid لا باسم المستخدم: القاعدةُ تقرأ users/{uid}، ووثيقةٌ
     باسم «m.safwat» لا يجدها أحد — فيُقرأ الدورُ من العدم ويُرفَض كلُّ شيء.
     وactive:true يُكتَب صراحةً. تُكتَب محليًّا باسم المستخدم ريثما يُعرَف uid،
     ثم تُنقَل إليه. */
  var docv = { name:n, user:u, role:r, active:true, at:Date.now() };
  if (jb){ docv.job = jb; docv.jobLog = [{ job:jb, at:Date.now(), by:STATE.meta.name || '' }]; }
  if (sup) docv.sup = sup;
  if (dp)  docv.dept = dp;
  /* ═══ الطلبُ إلى الخادم ═══
     المتصفّحُ لا يُنشئ حسابَ دخولٍ لغير صاحبه بثبات — يحتاج تطبيقًا ثانيًا
     يتعثّر بالشبكة والمتصفّح واسمٍ موجود، فبقيت حساباتٌ معلَّقةً في أجهزة.
     صار المكتبُ يكتب الطلبَ كاملًا — الاسمُ والمستخدمُ والكلمةُ والدورُ
     والوظيفةُ والقسمُ والبريد — والخادمُ يُنشئ حسابَ الدخول بمفتاح المشروع
     كلَّ عشر دقائق، ويُعلِّم الطلبَ «تمّ» فيراه المكتبُ ويُصدِر ورقةَ
     الدخول. ولا يُنشئ المتصفّحُ شيئًا بعد اليوم. */
  var em = (document.getElementById('uE') || {}).value || '';
  var req = { user:u, name:n, pass:p, role:r, status:'pending', at:Date.now(),
              by:STATE.meta.name || '' };
  if (jb)  req.job  = jb;
  if (sup) req.sup  = sup;
  if (dp)  req.dept = dp;
  if (em)  req.email = String(em).trim();
  STATE.provision = STATE.provision || {};
  STATE.provision[u] = req;
  CORE.set('provision', u, req);
  provKick();
  /* يظهر في القائمة فورًا معلَّمًا «يُنشَأ» — لا ينتظر المكتبُ ليتأكّد */
  /* الصفُّ المؤقتُ يحمل ما طُلب كلَّه — فيُرى القسمُ والمديرُ من لحظة الطلب */
  STATE.users[u] = { name:n, user:u, role:r, active:true, at:Date.now(), provisioning:true };
  if (jb)  STATE.users[u].job  = jb;
  if (sup) STATE.users[u].sup  = sup;
  if (dp)  STATE.users[u].dept = dp;
  if (em)  STATE.users[u].email = String(em).trim();
  USR.q = '';
  logEvent('طلب حساب — ' + n + ' (' + u + ') · ' + t(made.roleAr));
  toast(u + ' \u00b7 ' + t('طُلب من الخادم — يُنشَأ خلال دقائق'));
  ['uU','uN','uP','uE'].forEach(function(id){
    var e = document.getElementById(id); if (e) e.value = '';
  });
  statBump();
  render(1);
}


/* ═══ صفُّ الوزن يُدار كاملًا: المشعرُ والنوعُ والوزنُ والحذف ══════════════
   كان الصفُّ يعرض المشعرَ والنوعَ نصًّا ويُعدَّل وزنُه وحدَه. فمن أراد أن
   يصحّح اسمَ مشعرٍ أو ينقل نوعًا لم يجد أين — والإضافةُ موجودةٌ والتصحيحُ لا.

   وإعادةُ تسمية المشعر ليست تسميةَ صفٍّ: هي تسميةُ كلِّ موقعٍ فيه. فتُكتَب
   المواقعُ كلُّها ويُقال كم كُتب — ولا تقع بلا علم. */

function zoneList(){
  var out = [];
  (STATE.sites || []).forEach(function(x){ if (x.zone && out.indexOf(x.zone) < 0) out.push(x.zone); });
  return out.sort(arCmp);
}
/* ═══ المشاعرُ من مصدرٍ واحد (V17.72) ═══
   كانت قوائمُ المشعر مكتوبةً بيد في ثلاثة مواضع — نموذجُ الموقع الجديد
   (ثلاثة مشاعر) ولوحُ الرسم والاستيرادُ (خمسة) — فمن أعلن مشعرًا جديدًا في
   مصفوفة الأوزان لم يجده حين يضيف نقطة. فصارت القائمةُ تُشتقُّ من الأساسية
   ومما أُعلن ومما في المواقع، ورمزُ المعرِّف من دالةٍ واحدة. */
function zoneOptions(){
  var out = MX_ZONES.slice();
  var add = function(z){ z = String(z || '').trim(); if (z && out.indexOf(z) < 0) out.push(z); };
  ['مكة', 'المدينة', 'مواقع التفويج'].forEach(add);   /* (V29.7) مراكزُ التفويج تُختار دائمًا */
  zoneList().forEach(add);
  /* المعلَنُ في مصفوفة الأوزان يُخزَّن «مشعر|نوع» */
  (Array.isArray(CFG.mxExtra) ? CFG.mxExtra : []).forEach(function(x){ add(String(x || '').split('|')[0]); });
  return out;
}
var ZONE_CODE = { 'منى':'MIN', 'عرفات':'ARF', 'مزدلفة':'MUZ', 'مكة':'MAK', 'المدينة':'MAD', 'مواقع التفويج':'TFW', 'النوارية':'NWR' };
function zoneCode(zone){
  if (ZONE_CODE[zone]) return ZONE_CODE[zone];
  var en = (D.en && D.en[zone]) || '';
  var a = String(en).replace(/[^A-Za-z]/g, '').toUpperCase();
  return a ? a.slice(0, 3) : 'NEW';
}
function zoneRename(oldName, newName){
  if (!may('settings')){ toast(t('المشاعرُ للمهندس وحده')); return; }
  newName = String(newName || '').trim();
  if (!newName || newName === oldName) return;
  if (zoneList().indexOf(newName) > -1){ toast(t('المشعرُ موجودٌ بالفعل')); return; }
  var n = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.zone !== oldName) return;
    x.zone = newName; n++;
    CORE.set('sites', x.id, { zone:newName });
  });
  /* الأوزانُ المخزَّنةُ بمفتاحٍ فيه اسمُ المشعر تُنقَل معه */
  ['w','dw'].forEach(function(p){
    var o = CFG[p] || {};
    Object.keys(o).forEach(function(k){
      if (k.indexOf(oldName + '|') !== 0) return;
      var nk = newName + k.slice(oldName.length);
      o[nk] = o[k]; delete o[k];
      CORE.set('cfg', p, o);
    });
  });
  SITE_IX = null; SITE_TOK = null;
  statBump();
  logEvent('إعادة تسمية مشعر — ' + oldName + ' → ' + newName + ' · ' + n + ' موقعًا');
  toast(nm(n) + ' ' + t('موقعًا نُقل إلى') + ' ' + newName);
  render(1);
}
/* نقلُ نوعِ صفٍّ: كلُّ مواقع هذا المشعر من هذا النوع تصير نوعًا آخر */
function mxTypeMove(zone, label, newType){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var T = typesList(), oldType = '';
  Object.keys(T).forEach(function(k){ if (T[k].l === label) oldType = k; });
  if (!oldType || oldType === newType) return;
  var n = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.zone !== zone || x.type !== oldType) return;
    x.type = newType; n++;
    CORE.set('sites', x.id, { type:newType });
  });
  SITE_IX = null; SITE_TOK = null;
  statBump();
  logEvent('نقل نوع — ' + zone + '/' + label + ' → ' + (T[newType] || {}).l + ' · ' + n);
  toast(nm(n) + ' ' + t('موقعًا نُقل إلى') + ' ' + ((T[newType] || {}).l || newType));
  render(1);
}
/* حذفُ صفٍّ = حذفُ مواقعه. لا يقع إلا بلا مواقع — والصفُّ لا يكون بلا مواقع
   أصلًا لأنه مشتقٌّ منها. فيُقال ذلك بدل زرٍّ لا يعمل. */
function mxDeclareGo(){
  if (!may('settings')){ toast(t('المشاعرُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var zSel = g('mxdZ'), zone = zSel === '__new' ? g('mxdZn') : zSel;
  var tk = g('mxdT'), T = typesList();
  if (!zone){ toast(t('اكتب اسم المشعر')); return; }
  if (!T[tk]){ toast(t('اختر نوعًا')); return; }
  mxDeclare(zone, T[tk].l);
}

function mxRowInfo(zone, label){
  var T = typesList(), tk = '';
  Object.keys(T).forEach(function(k){ if (T[k].l === label) tk = k; });
  return (STATE.sites || []).filter(function(x){
    return x.zone === zone && x.type === tk;
  }).length;
}

/* الصفُّ الكامل — يُستعمَل في «نقاط الزيارات» و«نقاط الفك» */
/* يشطر صفوفَ جدولٍ نصفين متجاورين حين يطول: أقلُّ من عشرةٍ يبقى واحدًا،
   فالقسمةُ لما لا يستحقُّ تُشتّت لا تُريح. */
function halves(title, head, rows, right){
  if (rows.length < 10) return cardFlush(title, table(head, rows), right);
  var m = Math.ceil(rows.length / 2);
  return cardFlush(title,
    '<div class="halves">'
    + '<div>' + table(head, rows.slice(0, m)) + '</div>'
    + '<div>' + table(head, rows.slice(m)) + '</div>'
    + '</div>', right);
}

function mxTable(path, label){
  /* عمودٌ لكلِّ مشعر: كان جدولًا واحدًا ضيّقًا يترك نصفَ الشاشة فارغًا ويطول
     نزولًا — فيُمرَّر كثيرًا ليُقرأ قليل. والمشاعرُ تُقارَن بنظرةٍ واحدة كما
     يُقارَن الممرُّ بالمخيم في شاشة التركيب. */
  var T = typesList(), byZone = {};
  mxRows().forEach(function(r){ (byZone[r[0]] = byZone[r[0]] || []).push(r); });
  var typeOpts = function(cur){
    return Object.keys(T).map(function(k){
      return '<option value="' + esc(k) + '"' + (T[k].l === cur ? ' selected' : '') + '>'
        + esc(t(T[k].l)) + '</option>';
    }).join('');
  };
  var Z = zoneList();
  return '<div class="grid cols-2" style="align-items:start">'
    + Object.keys(byZone).map(function(z){
        var L = byZone[z];
        return cardFlush(t(z) + ' — ' + nm(L.length) + ' ' + t('صنفًا'),
          table(['النوع', label, ''],
            L.map(function(r){
              var n = mxRowInfo(r[0], r[1]);
              /* الحذفُ يُلغي التركيبةَ من هذه البطاقة — لا النوعَ من
                 النظام كلِّه. كان يستدعي `typeDel` بالاسم المعروض، وهو خطأٌ
                 نجا بالمصادفة لأن المفتاح لا يطابق، لا لأنه صحيح. */
              return [may('settings')
                        ? '<select data-mxt="' + esc(r[0] + '|' + r[1]) + '">' + typeOpts(r[1]) + '</select>'
                        : esc(t(r[1])),
                      cfgInput(path, r[0] + '|' + r[1], { dec:1 }),
                      n ? '' : (may('settings')
                            ? btn('حذف','btn-quiet btn-sm',' data-mxdel="' + esc(r[0] + '|' + r[1]) + '"') : '')];
            })),
          may('settings')
            ? '<input value="' + esc(z) + '" data-mxz="' + esc(z) + '" dir="auto" '
              + 'style="max-width:150px" aria-label="' + esc(t('اسم المشعر')) + '">'
            : '');
      }).join('')
    + '</div>'
    /* إعلانُ تركيبةٍ جديدة: مشعرٌ فنوعٌ لم يقع فيه موقعٌ بعد — ليُضبَط
       وزنُه قبل وصول أول نقطةٍ منه، كإضافة كاميرات الوزارة في مشعرٍ لم
       تُسجَّل فيه بعد. */
    + (may('settings')
      ? card('إضافة تركيبة إلى مشعر',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('المشعر')) + '</label>'
          +   '<select id="mxdZ">'
          +   Z.map(function(z){ return '<option value="' + esc(z) + '">' + esc(z) + '</option>'; }).join('')
          +   '<option value="__new">' + esc(t('مشعرٌ جديد…')) + '</option>'
          +   '</select></div>'
          + '<div class="field" id="mxdZnWrap" style="display:none">'
          +   '<label>' + esc(t('اسم المشعر الجديد')) + '</label><input id="mxdZn" dir="auto"></div>'
          + '<div class="field"><label>' + esc(t('النوع')) + '</label>'
          +   '<select id="mxdT">' + typeOpts('') + '</select></div>'
          + '</div>',
          btn('➕ ' + t('إضافة'),'btn-primary btn-sm',' data-mxdadd="1"'))
      : '')
    + '<p class="hint">'
    + esc(t('الوزنُ لكلِّ نقطةٍ من هذه التركيبة — لا لعددها. والعددُ يتغيّر: ما يُمسَح يزيد، وما يُهيَّأ يتبع المسحَ، وما يُركَّب يتبع المسحَ، وما يُفَكُّ يتبع التركيب. وتعديلُ اسم المشعر في رأس عموده يُعيد تسميتَه في كلِّ مواقعه، وتبديلُ النوع ينقلها إليه. والتركيبةُ التي لا مواقعَ عليها تُضاف وتُحذَف بحرّية — فهي إعلانٌ لا سجلّ.'))
    + '</p>';
}

PAGE.pts = { m:'التخطيط', t:'نقاط المراحل',
  l:'وزنُ كلِّ مرحلةٍ ونقاطُها — زيارةٌ وتهيئةٌ وتجميعٌ وتركيبٌ وفك.',
  body:function(){
    var head = tabHead('pts'), cur = tabCur('pts');
    if (cur === 'prep') return head + (function(){ return prepAsm('prep'); })();
    if (cur === 'asm') return head + (function(){ return prepAsm('asm'); })();
    if (cur === 'install') return head + (function(){
    /* الممرُّ قصادَ المخيم: عمودان تُقارَن بهما القائمتان بنظرةٍ واحدة */
    return '<div class="grid cols-2" style="align-items:start">'
      + [['cor','الممر'],['camp','المخيم']].map(function(g){
          var L = itemsList().filter(function(x){ return x.z === g[0]; });
          return '<div>' + cardFlush(t(g[1]) + ' — ' + nm(L.length) + ' ' + t('قطعة'),
            L.length
              ? table(may('settings') ? ['القطعة','النقاط',''] : ['القطعة','النقاط'],
                  L.map(function(it){
                    var row = ['<input value="' + esc(it.name) + '" data-itname="' + esc(it.code) + '" dir="auto">',
                               cfgInput('itPts', it.code, { dec:1 })];
                    if (may('settings'))
                      row.push(btn('حذف','btn-quiet btn-sm',' data-itdel="' + esc(it.code) + '"'));
                    return row;
                  }))
              : '<p class="hint" style="text-align:center;margin:0;padding:16px">'
                + esc(t('لا قطع في هذه المنطقة.')) + '</p>') + '</div>';
        }).join('')
      + '</div>'
      + (may('settings')
        ? card('أضِف صنفًا جديدًا',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('المنطقة')) + '</label>'
            +   '<select id="itZ"><option value="camp">' + esc(t('مخيم')) + '</option>'
            +   '<option value="cor">' + esc(t('ممر')) + '</option></select></div>'
            + '<div class="field"><label>' + esc(t('اسم القطعة')) + ' <span class="req">*</span></label>'
            +   '<input id="itN" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('نقاط تركيبها')) + '</label>'
            +   '<input id="itS" type="number" step="0.5" min="0" value="1"></div>'
            + '</div>',
            btn('➕ إضافة صنف','btn-primary btn-sm',' data-stgadd="itPts"'))
        : '')
      /* كان الوزنُ لنوعين: مخيمٌ وممر. والأنواعُ سبعةٌ — فمحطةُ القطارِ
         وبوابةُ المسجدِ ودورُ الجمرات تأخذ وزنَ الممر بلا أن يختارَه أحد.
         صار لكلِّ نوعٍ وزنُه كما في نقاط الزيارة. */
      + cardFlush('نقاط النقطة الكاملة — لكلِّ نوع',
          table(['النوع','نقاط التركيب'],
            Object.keys(CAT_DEF).map(function(ty){
              return [typeLabel(ty), cfgInput('insType', ty, { dec:1, step:'0.1' })];
            }))
          + '<p class="hint" style="padding:0 16px 14px">'
          + esc(t('نقاطُ تركيب النقطة الكاملة — يُقاس بها إنجاز الفني، وتُجمَع من نقاط قطعها. وما تُرك صفرًا يرجع للوزن العام أدناه.')) + '</p>',
          btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + card('الوزن العام — لما لم يُضبط نوعُه',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('نقاط تركيب المخيم')) + '</label>'
          +   cfgInput('insCamp', undefined, { dec:1, step:'0.1' }) + '</div>'
          + '<div class="field"><label>' + esc(t('نقاط تركيب الممر')) + '</label>'
          +   cfgInput('insCor', undefined, { dec:1, step:'0.1' }) + '</div>'
          + '</div>'
          + '<p class="hint">' + esc(t('يُستعمَل حين لا يُضبَط وزنُ النوع أعلاه — فلا ينكسر ما ضُبط قبل هذا الإصدار.')) + '</p>',
          btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + tgtBlock('tgtInsCamp', 'tgtInsCor');
  })();
    if (cur === 'disp') return head + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الفكّ'),'btn-secondary btn-sm',' data-xls="dismantles"') + '</div>' + (function(){
    /* عمودُ «النقاط» كان يعرض وزنَ الزيارة المكتوبَ في الإعدادات — وليس هو
       ما يُفَكّ. الفكُّ يقع على ما رُكِّب فعلًا في الأرض، فيُجمَع تراكميًّا على
       مدار الموسم: كلُّ تركيبٍ معتمَدٍ يضيف قطعَه إلى مشعره ونوعه. فيقرأ
       المخطِّطُ ما ينتظره في كلِّ مكانٍ لا ما قدّره قبل أن يبدأ الموسم. */
    var built = {};
    Object.keys(STATE.inss || {}).forEach(function(id){
      var r = STATE.inss[id];
      if (!r || r.status !== 'مُركّب' || !r.approved) return;
      var x = siteFind(id); if (!x) return;
      var k = x.zone + '|' + catLabel(x), n = 0;
      Object.keys(r.parts || {}).forEach(function(p){ n += (+r.parts[p] || 0); });
      built[k] = (built[k] || 0) + n;
    });
    var anyBuilt = Object.keys(built).length > 0;
    return typesCard() + mxTable('dw', t('وزن الفك'))
      + cardFlush('قِطَعٌ رُكّبت',
        table(['المشعر','النوع','قِطَعٌ رُكّبت'],
          mxRows().map(function(r){
            var k = r[0] + '|' + r[1];
            return [esc(t(r[0])), esc(t(r[1])),
                    built[k] ? '<span class="num">' + N(built[k]) + '</span>' : '—'];
          })),
        '<p class="hint" style="margin:0">'
        + esc(t(anyBuilt
            ? 'عمودُ القطع يتراكم من التركيب المعتمَد على مدار الموسم — ولا يُكتَب بيد.'
            : 'عمودُ القطع يبقى فارغًا حتى يُعتمَد أولُ تركيب — ثم يتراكم من الأرض.'))
        + '</p>')
      + card('التارجت والمعاملان',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('تارجت الفك الشهري')) + '</label>'
          +   cfgInput('tgtDis') + '</div>'
          + '<div class="field"><label>' + esc(t('معامل السليم')) + '</label>'
          +   cfgInput('disOk', undefined, { dec:1, step:'0.05' }) + '</div>'
          + '<div class="field"><label>' + esc(t('معامل التالف')) + '</label>'
          +   cfgInput('disBad', undefined, { dec:1, step:'0.05' }) + '</div>'
          + '</div>', btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + '<p class="hint">' + esc(t('المعاملان يضربان وزن الفك بحسب حالة الجهاز المفكوك — فيتساوى الجهدُ ويختلف الناتج.')) + '</p>';
  })();
    return head + (function(){
    return typesCard() + mxTable('w', t('وزن الزيارة'))
      + card('التارجت',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('تارجت المسح الشهري')) + '</label>'
          +   cfgInput('tgtSurvey') + '</div>'
          + '<div class="field"><label>' + esc(t('تارجت المسح الأسبوعي')) + '</label>'
          +   cfgDerived(cfgWk(cfgGet('tgtSurvey'))) + '</div>'
          + '</div>')
      + '<p class="hint">' + esc(t('لا قيمةَ افتراضية: كل وزنٍ يبدأ صفرًا وتضبطه أنت — وما تكتبه هنا يسري فورًا على المسح والفنيين والتقارير.')) + '</p>';
  })();
  }};

function prepAsm(pg){
  var get = pg === 'prep' ? itPrep : itAsm;
  var path = pg === 'prep' ? 'itPrep' : 'itAsm';
  var on = itemsList().filter(function(i){ return get(i.code) > 0; });
  var tot = on.reduce(function(a,i){ return a + get(i.code); }, 0);
  var h = '<p class="lede" style="margin:0 0 16px">' + esc(t(pg === 'prep'
      ? 'التهيئة عملُ الورشة قبل النزول: ضبط الجهاز وعنوانه ونظامه وفحصه. وهي للأجهزة ذات الإعداد وحدها — الكاميرات والقارئات والراوترات والحساسات والجيت واي.'
      : 'التجميع تركيب ما يدخل البوكس وتوصيله قبل النزول. وهو للمكوّنات التي تُجمَّع داخله وحدها.'))
    + '</p>';
  if (!on.length){
    h += card('', '<p class="hint" style="text-align:center;margin:0">'
      + esc(t(pg==='prep'?'لا أجهزة في التهيئة بعد.':'لا مكوّنات في التجميع بعد.')) + '</p>');
  } else {
    h += stats([[pg==='prep'?'أجهزة في التهيئة':'مكوّنات في التجميع', N(on.length), 'acc'],
                ['إجمالي النقاط', N(tot)]])
      + cardFlush((pg==='prep'?'أجهزة التهيئة':'مكوّنات التجميع') + ' — ' + nm(on.length),
          table(['الجهاز','المنطقة','النقاط',''],
            on.map(function(i){
              return ['<input value="' + esc(i.name) + '" data-itname="' + esc(i.code) + '" dir="auto">',
                      esc(t(i.z==='cor'?'ممر':'مخيم')),
                      cfgInput(path, i.code, { dec:1 }),
                      (may('settings')
                        ? btn('أخرِج من المرحلة','btn-quiet btn-sm',
                              ' data-stgout="' + esc(path + '|' + i.code) + '"')
                          + btn('احذف الصنف','btn-quiet btn-sm',' data-itdel="' + esc(i.code) + '"')
                        : '')];
            })));
  }
  h += (may('settings')
      ? card((pg === 'prep' ? 'أضِف صنفًا جديدًا للتهيئة' : 'أضِف صنفًا جديدًا للتجميع'),
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('المنطقة')) + '</label>'
          +   '<select id="itZ"><option value="camp">' + esc(t('مخيم')) + '</option>'
          +   '<option value="cor">' + esc(t('ممر')) + '</option></select></div>'
          + '<div class="field"><label>' + esc(t('اسم القطعة')) + ' <span class="req">*</span></label>'
          +   '<input id="itN" dir="auto"></div>'
          + '<div class="field"><label>' + esc(t('نقاط هذه المرحلة')) + '</label>'
          +   '<input id="itS" type="number" step="0.5" min="0" value="1"></div>'
          + '</div>',
          btn('➕ إضافة صنف','btn-primary btn-sm',' data-stgadd="' + path + '"'))
      : '')
     + cfgAddStage(path, pg)
     + tgtBlock(pg === 'prep' ? 'tgtPrepCamp' : 'tgtAsmCamp',
                pg === 'prep' ? 'tgtPrepCor'  : 'tgtAsmCor');
  if (pg === 'prep')
    h += '<p class="hint">' + esc(t('الهوائي والبطارية والكابل قطعٌ سلبيةٌ لا تُهيَّأ، فلا تظهر هنا أصلًا.')) + '</p>';
  return h;
}




PAGE.items = { m:'الإعدادات', t:'الكتالوج والقوائم',
  l:'ما نشتريه وممّن — والثوابتُ وأسماءُ العرض وأنواعُ السيارات.',
  body:function(){
    var head = tabHead('items'), cur = tabCur('items');
    if (cur === 'consts') return head + ghCard() + hoSetupCard() + costGuardCard() + fontsCard() + gmapsCard() + (function(){
    return card('الثوابت',
        '<div class="grid cols-3">'
        + '<div class="field"><label>' + esc(t('أيام العمل في الشهر')) + '</label>'
        +   cfgInput('days') + '</div>'
        + '<div class="field"><label>' + esc(t('ساعات العمل في اليوم')) + '</label>'
        +   cfgInput('hours') + '</div>'
        + '<div class="field"><label>' + esc(t('أيام العمل في الأسبوع')) + '</label>'
        +   cfgInput('daysWeek', undefined, { max:7 }) + '</div>'
        + '</div>'
        + '<div class="alert info" style="margin:4px 0 0"><span>'
        +   esc(t('ساعات الشهر القياسية')) + ': <b>' + nm(cfgGet('days')*cfgGet('hours')) + '</b> ' + esc(t('ساعة')) + '</span></div>',
        btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + catsCard()   /* (V37.4) طلبُ المالك: المسمّياتُ وجهاتُ الحل */
      + card('القوائم — تُعدَّل من هنا لا من الشيفرة',   /* (V30.3) فكرةُ المالك #٤ */
          '<p class="hint" style="margin-top:0">' + esc(t('كلُّ سطرٍ بندٌ. اتركِ المربعَ فارغًا لتعود القائمةُ الأصلية. ما سُجّل من قبلُ بنصٍّ قديمٍ يبقى مقروءًا.')) + '</p>'
          + '<div class="grid cols-2">'
          + [['chalsCamp', 'تحديات المخيمات', CH_CAMP], ['chalsPath', 'تحديات الممرات وسائر النقاط', CH_PATH], ['reasonsCamp', 'أسباب إضافة مخيم غير مسجّل', NS_REASONS], ['reasonsPt', 'أسباب إضافة نقطة غير مسجّلة', NS_REASONS_PT]].map(function(L){
              var cur = (CFG.lists && Array.isArray(CFG.lists[L[0]]) && CFG.lists[L[0]].length) ? CFG.lists[L[0]] : [];
              return '<div class="field"><label>' + esc(t(L[1])) + ' <span class="hint">(' + esc(t('الأصلية')) + ' ' + nm(L[2].length) + ')</span></label><textarea data-lists="' + L[0] + '" rows="6" dir="auto" placeholder="' + esc(L[2].map(function(x){ return t(x); }).join('\n')) + '">' + esc(cur.join('\n')) + '</textarea></div>'; }).join('')
          + '</div>',
          btn('حفظ القوائم','btn-primary btn-sm',' data-listsok="1"'))
      + card('قواعد التنبيه (بالأيام)',   /* (V30.1) فكرةُ المالك #٢ — صفرٌ يعطّل القاعدة */
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('معوّق مفتوح أكثر من')) + '</label>' + cfgInput('alObsDays') + '</div>'
          + '<div class="field"><label>' + esc(t('تصريح دخول معلّق أكثر من')) + '</label>' + cfgInput('alPermitDays') + '</div>'
          + '<div class="field"><label>' + esc(t('أُعيدت للزيارة ولم تُزَر أكثر من')) + '</label>' + cfgInput('alRevisitDays') + '</div>'
          + '<div class="field"><label>' + esc(t('ممسوحة بلا صور أكثر من')) + '</label>' + cfgInput('alNoPhotoDays') + '</div>'
          + '<div class="field"><label>' + esc(t('مُسندة ولم تُزَر أكثر من')) + '</label>' + cfgInput('alAssignDays') + '</div>'
          + '<div class="field"><label>' + esc(t('تعذّر الوصول بلا محاولة أكثر من')) + '</label>' + cfgInput('alStaleDays') + '</div>'
          + '</div><p class="hint">' + esc(t('تظهر التنبيهاتُ في متابعة الوزارة ← الملخص وفي الملخّص التنفيذي، وكلُّ تنبيهٍ يفتح قائمتَه ويُصدَّر. صفرٌ يعطّل القاعدة.')) + '</p>',
          btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + card('سعر النقطة والإضافي',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('سعر النقطة')) + ' (' + t('ريال') + ')</label>'
          +   cfgInput('ph', undefined, { dec:1, step:'0.01' }) + '</div>'
          + '<div class="field"><label>' + esc(t('معامل الإضافي')) + '</label>'
          +   cfgInput('otRate', undefined, { dec:1, step:'0.05' }) + '</div>'
          + '</div>'
          + '<p class="hint">' + esc(t('تارجتُ المرحلة مقسومًا على أيام الشهر هو سقفُ اليوم — وما زاد عنه يُحتسب إضافيًّا بهذا المعامل. صفرٌ يعني بلا احتساب إضافي.')) + '</p>')
      + card('وزن المراحل في النقطة',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('التهيئة')) + ' ' + t('٪') + '</label>'
          +   cfgInput('stgCfg', undefined, { max:100 }) + '</div>'
          + '<div class="field"><label>' + esc(t('التجميع')) + ' ' + t('٪') + '</label>'
          +   cfgInput('stgVal', undefined, { max:100 }) + '</div>'
          + '<div class="field"><label>' + esc(t('التركيب')) + ' ' + t('٪') + '</label>'
          +   cfgInput('stgIns', undefined, { max:100 }) + '</div>'
          + '</div>'
          + '<div class="alert '
          + ((cfgGet('stgCfg') + cfgGet('stgVal') + cfgGet('stgIns')) === 100 ? 'success' : 'warn')
          + '" style="margin:4px 0 0"><span>' + esc(t('المجموع')) + ': <b>'
          + nm(cfgGet('stgCfg') + cfgGet('stgVal') + cfgGet('stgIns')) + '٪</b></span></div>'
          + '<p class="hint">' + esc(t('النقطة الواحدة تُقسَّم على مراحلها الثلاث — فمن هيّأ يأخذ نصيبه ومن جمّع نصيبه ومن ركّب نصيبه. والمجموع مئةٌ دائمًا.')) + '</p>',
          btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + '<p class="hint">' + esc(t('هذه الثوابت يُشتقّ منها التارجت الأسبوعي من الشهري، وتقديرُ الأزمنة في التخطيط.')) + '</p>';
  })();
    if (cur === 'names') return head + (function(){
    var seen = {};
    function add(x){ if (x && /[\u0600-\u06FF]/.test(x)) seen[x] = 1; }
    techsList().forEach(function(x){ add(x.n); add(x.sup); });
    crewsList().forEach(function(x){ add(x.n); });
    (STATE.sites || []).forEach(function(x){ add(x.co); });
    add(STATE.meta.name);
    var L = Object.keys(seen).sort();
    var fix = CFG.nameEn || {};
    var done = L.filter(function(k){ return fix[k]; }).length;

    return stats([['أسماءٌ في النظام', N(L.length), 'acc'],
                  ['صُحّحت يدويًّا', N(done), done ? 'ok' : ''],
                  ['تُنقحَر آليًّا', N(L.length - done)]])

      + card('كيف تعمل',
          '<p class="hint" style="margin:0">'
          + esc(t('الاسمُ لا يُترجَم بل يُنقحَر: «محمد صفوت» تُكتَب Mohamed Safwat كما في جواز السفر. والنقحرةُ حسابٌ محليٌّ يجري في اللحظة — فمن يُضاف غدًا يُقرأ بالإنجليزية فورَ إضافته بلا تدخّل. والأرديةُ تُكتَب بالحرف العربيِّ نفسِه فيبقى الاسمُ كما هو.'))
          + '</p>')

      + (L.length
        ? cardFlush('الأسماء — ' + nm(L.length),
            table(['الاسم كما كُتب','كما يُقرأ بالإنجليزية','تصحيحُك'],
              capList(L, 300).map(function(k){
                return ['<strong>' + esc(k) + '</strong>',
                        '<span class="hint" style="margin:0">' + esc(dispName(k)) + '</span>',
                        may('settings')
                          ? '<input value="' + esc(fix[k] || '') + '" data-nmen="' + esc(k)
                            + '" dir="ltr" placeholder="' + esc(dispName(k)) + '">'
                          : esc(fix[k] || '—')];
              })))
        : card('', alertBox('info','لا أسماءَ عربيةً في النظام بعد.')))

      + '<p class="hint">ما يُكتَب هنا لا يمسُّ الاسمَ المخزَّن — يغيّر قراءتَه بالإنجليزية وحدها، فلا تنكسر السجلاتُ ولا التقارير.</p>';
  })();
    if (cur === 'vehkind') return head + (function(){
    var K = vehKinds(), V = vehList();
    var byKind = {}, costKind = {};
    V.forEach(function(v){
      byKind[v.kind] = (byKind[v.kind] || 0) + 1;
      costKind[v.kind] = (costKind[v.kind] || 0) + (+v.cost || 0);
    });
    return '<p class="lede" style="margin:0 0 16px">' + esc(t('النوعُ يُضاف هنا، والعددُ يُشتقُّ مما أُضيف من كلِّ نوعٍ في «السيارات» — لا يُكتَب بيدٍ فيتجمّد. والسعةُ عددُ من تحملهم، وبها تُحسَب حاجةُ الفرق.')) + '</p>'

      + stats([['أنواع', N(K.length)],
               ['في الأسطول', N(V.length)],
               ['تكلفةٌ شهرية', N(V.reduce(function(a, v){ return a + (+v.cost || 0); }, 0))]])

      + cardFlush(t('الأنواع') + ' — ' + nm(K.length),
          table(['النوع','ما يُستعمَل له','السعة','العدد','تكلفةٌ شهرية',''],
            K.map(function(k){
              var n2 = byKind[k.id] || 0;
              return ['<input value="' + esc(k.n) + '" data-vkn="' + esc(k.id) + '" dir="auto">',
                      '<input value="' + esc(k.d || '') + '" data-vkd="' + esc(k.id) + '" dir="auto">',
                      '<input type="number" min="1" value="' + esc(String(k.cap || 2))
                        + '" data-vkc="' + esc(k.id) + '" style="max-width:78px">',
                      n2 ? pill(nm(n2), 'acc') : N(0),
                      N(costKind[k.id] || 0),
                      (may('settings')
                        ? (n2 ? '<span class="hint" style="margin:0">' + esc(t('مستعمل')) + '</span>'
                              : btn('حذف','btn-quiet btn-sm',' data-vkdel="' + esc(k.id) + '"'))
                        : '')];
            })))

      + (may('settings')
        ? card('إضافة نوع',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('اسم النوع')) + ' <span class="req">*</span></label>'
            +   '<input id="vkN" dir="auto" placeholder="ونش"></div>'
            + '<div class="field"><label>' + esc(t('ما يُستعمَل له')) + '</label>'
            +   '<input id="vkD" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('السعة')) + '</label>'
            +   '<input id="vkC" type="number" min="1" value="2"></div>'
            + '</div>',
            btn('➕ إضافة نوع','btn-primary btn-sm',' data-vkadd="1"'))
        : '')

      + '<p class="hint">' + esc(t('النوعُ الذي عليه سياراتٌ لا يُحذَف — انقلها إلى نوعٍ آخر أولًا. والتكلفةُ الشهريةُ تُجمَع من سيارات النوع فتُعرَف كلفةُ كلِّ صنفٍ على المشروع.')) + '</p>';
  })();
    if (cur === 'buycat') return head + (function(){
    var L = catList(), B = buysList();
    return '<p class="lede" style="margin:0 0 16px">' + esc(t('هذه التبويبات هي ما تُصنَّف به كل عملية شراء، وعليها يقوم تجميع المصروف. والفئة المستعملة في عملياتٍ قائمة لا تُحذف حتى لا يفقد تقريرها تصنيفه.')) + '</p>'
      + halves(t('الفئات') + ' — ' + nm(L.length),
          ['الفئة','عمليات','المصروف',''],
          L.map(function(c){
              var used = B.filter(function(b){ return b.cat === c; });
              var sum = used.reduce(function(a,b){ return a + (+b.amt || 0); }, 0);
              return [esc(c), N(used.length), N(sum),
                      used.length ? '<span class="hint" style="margin:0">' + esc(t('مستعملة')) + '</span>'
                                  : btn('احذف','btn-quiet btn-sm',' data-catrm="' + esc(c) + '"')];
            }),
          may('money')
            ? '<form class="inline-form" onsubmit="return false">'
              + '<input id="catNew" dir="auto" placeholder="' + esc(t('فئة جديدة')) + '">'
              + btn('إضافة فئة','btn-primary btn-sm',' data-catadd="1"') + '</form>'
            : '');
  })();
    if (cur === 'sup') return head + (function(){
    var L = supList(), B = buysList();
    return '<p class="lede" style="margin:0 0 16px">' + esc(t('قائمةٌ موحّدةٌ لمن نشتري منهم — كالشركات تمامًا. الاسم الحر كان يصنع مورّدَين من مورّدٍ واحد باختلاف حرف، فتفرّق تقريرُه. والمورّد المستعمل في عملياتٍ قائمة لا يُحذف.')) + '</p>'
      + cardFlush(t('المورّدون') + ' — ' + nm(L.length),
          table(['المورّد','عمليات','المصروف',''],
            L.map(function(c){
              var used = B.filter(function(b){ return b.sup === c; });
              var sum = used.reduce(function(a,b){ return a + (+b.amt || 0); }, 0);
              return [esc(c), N(used.length), N(sum),
                      used.length ? '<span class="hint" style="margin:0">' + esc(t('مستعمل')) + '</span>'
                                  : btn('احذف','btn-quiet btn-sm',' data-suprm="' + esc(c) + '"')];
            })),
          may('money')
            ? '<form class="inline-form" onsubmit="return false">'
              + '<input id="supNew" dir="auto" placeholder="' + esc(t('مورّد جديد')) + '">'
              + btn('إضافة مورّد','btn-primary btn-sm',' data-supadd="1"') + '</form>'
            : '');
  })();
    return head + (function(){
    /* الكتالوجُ يُحرَّر هنا: الاسمُ والمنطقةُ والنقاطُ والسعر، ويُضاف صنفٌ
       ويُحذَف. وكان النموذجُ مرسومًا وأزرارُه بلا خاصيةٍ فيبتلعها حارسُ
       الأزرار الميتة — يُكتَب الاسمُ ويُضغَط «حفظ» ولا يقع شيء.
       والممرُّ قصادَ المخيم لا تحته: عمودان تُقارَن بهما القائمتان. */
    var used = function(code){
      var n = 0;
      Object.keys(STATE.inss || {}).forEach(function(id){
        var r = STATE.inss[id];
        if (r && r.parts && r.parts[code]) n++;
      });
      return n;
    };
    var col = function(z, label){
      var L = itemsList().filter(function(x){
        return x.z === z && (!IT_Q || x.name.indexOf(IT_Q) > -1);
      });
      return cardFlush(t(label) + ' — ' + nm(L.length) + ' ' + t('قطعة'),
        L.length
          ? table(['القطعة','نقاط التركيب','السعر',''],
              L.map(function(it){
                var u = used(it.code);
                return ['<input value="' + esc(it.name) + '" data-itname="' + esc(it.code) + '" dir="auto">',
                        cfgInput('itPts', it.code, { dec:1 }),
                        cfgInput('itPrice', it.code),
                        (u ? '<span class="hint" style="margin:0">' + esc(t('مستعملة في')) + ' ' + nm(u) + '</span>'
                           : btn('حذف','btn-quiet btn-sm',' data-itdel="' + esc(it.code) + '"'))
                        + btn(z === 'cor' ? '→ مخيم' : '→ ممر', 'btn-quiet btn-sm',
                              ' data-itzone="' + esc(it.code) + '"')];
              }))
          : '<p class="hint" style="text-align:center;margin:0;padding:16px">'
            + esc(t('لا قطع في هذه المنطقة.')) + '</p>');
    };

    return '<p class="lede" style="margin:0 0 16px">' + esc(t('كلُّ حقلٍ هنا قابلٌ للتعديل: الاسمُ والمنطقةُ ونقاطُ التركيب والسعر — ويُحفَظ فورَ كتابته. ونقاطُ التهيئة والتجميع تُضبط كلٌّ في صفحتها. والصنفُ المستعملُ في تركيبٍ قائمٍ لا يُحذَف.')) + '</p>'
      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="itQ" data-itq="1" value="' + esc(IT_Q) + '" placeholder="'
      +     esc(t('ابحث باسم القطعة')) + '" dir="auto">'
      + '</form>'
      + '<div class="grid cols-2" style="align-items:start">'
      +   '<div>' + col('cor', 'الممر') + '</div>'
      +   '<div>' + col('camp', 'المخيم') + '</div>'
      + '</div>'
      + card('إضافة صنف',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('المنطقة')) + '</label>'
          +   '<select id="itZ"><option value="camp">' + esc(t('مخيم')) + '</option>'
          +   '<option value="cor">' + esc(t('ممر')) + '</option></select></div>'
          + '<div class="field"><label>' + esc(t('اسم القطعة')) + ' <span class="req">*</span></label>'
          +   '<input id="itN" dir="auto" placeholder="' + esc(t('مفتاح شبكة ٨ منافذ')) + '"></div>'
          + '<div class="field"><label>' + esc(t('نقاط تركيبها')) + '</label>'
          +   '<input id="itP" type="number" step="0.5" min="0" value="1"></div>'
          + '<div class="field"><label>' + esc(t('سعرها')) + '</label>'
          +   '<input id="itR" type="number" min="0" value="0"></div>'
          + '</div>',
          btn('➕ إضافة صنف','btn-primary btn-sm',' data-itadd="1"'))
      + '<p class="hint">' + esc(t('نقلُ الصنف بين الممر والمخيم ينقل معه احتسابَه في تقسيم النقاط. والحذفُ ممنوعٌ على ما رُكِّب — وإلا فقدت سجلاتُ التركيب أسماءَ قطعها.')) + '</p>';
  })();
  }};




/* ═══ أسماءُ العرض — تصحيحُ ما تُخطئ فيه النقحرة ═══
   النقحرةُ حسابٌ حرفيٌّ لا يعرف النطق، والعربيةُ لا تكتب الحركات — فـ«فريق»
   تصير Fryq. والصوابُ يُكتَب هنا مرةً فيثبت لكلِّ من يقرأ بالإنجليزية،
   ولا يُمَسُّ الاسمُ المخزَّنُ في القاعدة. */



/* ═══ القائمة والشل ═══ */

var NAV = [
  { id:'map',  icon:'\u25C8', label:'الخريطة', solo:true, field:true },
  /* «الطلبات والمسح» كانت وحدةً وحدَها: طلباتٌ ودورةُ نقطةٍ واعتمادٌ — وكلُّها
     عملُ الميدان ومتابعتُه، فتُقرأ من مكانٍ واحد */
  { g:'الميدان', icon:'\u25F1', items:[
      ['sites','المواقع'],['mywork','شغلي'],['survey','متابعة العمل الميداني'],['req','الطلبات والتوزيع'],
      ['sel','الطبقات والمحدَّد'],['tfwdraw','رسم المسارات من وإلى الجمرات'],['fleet','السيارات'],
      ['forms','النماذج الميدانية'],['recs','السجلات'],['tools','الأدوات']] },
  { g:'المتابعة', icon:'\u25A6', items:[
      ['mfu','متابعة الوزارة'],['over','نظرة عامة'],['wtask','متابعة المهام الأسبوعية'],['exec','التقارير التنفيذية'],['co','الشركات'],['dis','الفك والمراحل']] },
  { g:'التخطيط', icon:'\u25F7', items:[
      ['trials','التجارب'],['pts','نقاط المراحل'],['wbs','متابعة الخطة التفصيلية'],['org','التنظيم والسلامة'],
      ['plan','التخطيط والمخاطر']] },
  { g:'الورشة والمخزون', icon:'\u25A3', items:[
      ['inv','المخزون']] },
  { g:'القسم المالي', icon:'\u25B0', items:[
      ['ipc','الشؤون المالية']] },
  { g:'الفرق', icon:'\u25D4', items:[
      ['perf','الفرق والأداء']] },
  { g:'الإعدادات', icon:'\u2699', items:[
      ['users','المستخدمون والأدوار'],['items','الكتالوج والقوائم']] },
  { g:'النظام', icon:'\u25A1', items:[
      ['exp','التصدير والاستيراد'],['ev','السجلات والإشعارات'],['sys','صحة النظام']] },
  { g:'المساعدة', icon:'\u003F', items:[
      ['guide','الأدلة'],['acct','حسابي']] }
];

/* أيقوناتُ الوحدات (V24.0): خطوطٌ بلون النص، هي نفسُها في القائمة المفتوحة وفي شريط الأيقونات
   حين تُطوى — فيُتعلَّم موضعُ كلِّ وحدةٍ مرةً. وما لا أيقونةَ له يبقى برمزه القديم. */
var NAV_ICO = {
  map:'<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4.5L15 7 9 4z"/><path d="M9 4v13.5M15 7v13.5"/>',
  'الميدان':'<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  'المتابعة':'<path d="M4 20h16"/><path d="M7 16v-4M12 16V7M17 16v-7"/>',
  'التخطيط':'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  'الورشة والمخزون':'<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>',
  'القسم المالي':'<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
  'الفرق':'<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.3"/><path d="M16.3 14.6c2.3.3 3.8 1.9 4.2 4.4"/>',
  'الإعدادات':'<path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1"/><circle cx="15" cy="6.5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17.5" r="2"/>',
  'النظام':'<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/><path d="M6.5 10.5H9l1.5-2.5 2 5 1.5-2.5h3.5"/>',
  'المساعدة':'<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.6"/><path d="M12 16.6v.1"/>'
};
function navIco(s){
  var p = NAV_ICO[s.id || s.g];
  return p ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">' + p + '</svg>' : s.icon;
}

var CUR = 'map';
var OPEN = {};

var NAV_Q = '';

function arNorm(x){
  return String(x || '')
    .replace(/[\u064B-\u0652\u0640]/g, '')      /* تشكيلٌ وتطويل */
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/^ال/, '').replace(/\s+/g, ' ')
    .toLowerCase().trim();
}

/* حروفُ الاستعلام بالترتيب وإن تخلّلها غيرُها — «تقرير» تجد «التقارير» */
function subseq(hay, needle){
  var i = 0;
  for (var j = 0; j < hay.length && i < needle.length; j++)
    if (hay[j] === needle[i]) i++;
  return i === needle.length;
}

function navMatch(label, key){
  if (!NAV_Q) return true;
  var q = arNorm(NAV_Q);
  if (!q) return true;
  var a = arNorm(label), b = arNorm(t(label)), k = String(key).toLowerCase();
  return a.indexOf(q) > -1 || b.indexOf(q) > -1 || k.indexOf(q) > -1
      || subseq(a, q) || subseq(b, q) || subseq(k, q);
}

/* البحثُ في القائمة يصل الشرائح (V19.0): «يوميات» تجد «التقارير التنفيذية ← يوميات
   المشروع» ولو لم يكن اسمُ الصفحة الأمِّ فيها — بالعنوان أو بالوصف، بالعربية أو
   بلغة الواجهة، وتُفتَح الشريحةُ مباشرة. مطابقةٌ بالاحتواء لا بالتتابع: الشرائحُ
   كثيرةٌ والتتابعُ يطابق كلَّ شيءٍ بحرفين. */
function navTabHits(pid){
  if (!NAV_Q || !TABS[pid]) return [];
  var q = arNorm(NAV_Q); if (!q || q.length < 2) return [];
  return tabsOf(pid).filter(function(tb){
    if (tb[0] === pid) return false;
    var hay = [tb[1], t(tb[1]), tb[3] || '', tb[3] ? t(tb[3]) : ''].map(arNorm).join(' ');
    return hay.indexOf(q) > -1;
  });
}
function navTabLinks(pid){
  return navTabHits(pid).map(function(tb){
    return '<a href="#" class="sub nav-tab" data-p="' + esc(pid) + '" data-navtab="' + esc(tb[0]) + '">\u21B3 ' + esc(t(tb[1])) + '</a>';
  }).join('');
}
function navHtml(){
  var box = '<div class="nav-q" style="padding:0 2px 8px">'
    + '<input id="navQ" type="search" value="' + esc(NAV_Q) + '" placeholder="'
    + esc(t('ابحث في القائمة')) + '" '
    + 'style="background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14);'
    + 'color:var(--sidebar-ink);min-height:38px;font-size:13px" aria-label="'
    + esc(t('ابحث في القائمة')) + '"></div>';
  return box + NAV.map(function(s){
    if (s.solo){
      if (!seesPage(s.id)) return '';
      if (!navMatch(s.label, s.id) && !navTabHits(s.id).length) return '';
      return '<a href="#" class="'+(CUR===s.id?'active':'')+'" data-p="'+s.id+'" aria-label="'+esc(t(s.label))+'">'
        + '<span class="item-icon" aria-hidden="true">'+navIco(s)+'</span><span class="nav-t">'+esc(t(s.label))+'</span></a>' + navTabLinks(s.id);
    }
    var items = s.items.filter(function(i){ return seesPage(i[0]) && (navMatch(i[1], i[0]) || navTabHits(i[0]).length); });
    if (!items.length) return '';
    var open = NAV_Q ? true : (items.some(function(i){ return i[0] === CUR; }) || OPEN[s.g]);
    var hc = items.some(function(i){ return i[0] === CUR; });   /* (V24.0) وحدةُ الصفحة الحالية تُضاء في شريط الأيقونات */
    return '<div class="nav-section'+(hc?' has-cur':'')+'" data-open="'+(open?'true':'false')+'" data-g="'+esc(s.g)+'">'
      + '<button type="button" class="group-toggle" data-gt aria-expanded="'+(open?'true':'false')+'" aria-label="'+esc(t(s.g))+'">'
      + '<span class="group-label"><span class="item-icon" aria-hidden="true">'+navIco(s)+'</span><span class="nav-t">'+esc(t(s.g))+'</span></span>'
      + '<span class="chevron" aria-hidden="true"></span></button><div class="group-panel"><div class="gp-head" aria-hidden="true">'+esc(t(s.g))+'</div>'
      + items.map(function(i){
          var bdg = ''; if (i[0] === 'mfu'){ try { var un = mfuUnseen(); if (un) bdg = ' <span class="tb-badge" style="position:static;display:inline-block">' + nm(un) + '</span>'; } catch (e){ LS_ERR = e; } }   /* (V20.7) */
          return '<a href="#" class="sub'+(CUR===i[0]?' active':'')+'" data-p="'+i[0]+'">'+esc(t(i[1])) + bdg + '</a>' + navTabLinks(i[0]);
        }).join('')
      + '</div></div>';
  }).join('');
}

var FIELD_PAGES = {
  /* الخريطةُ حاويةٌ ثابتةٌ تُظهَر وتُخفى — واجهتُها في #mapUI لا في المحتوى */
  map:   { m:'الميدان', t:'الخريطة', full:true, body:function(){ return ''; } },
  sites: { m:'الميدان', t:'المواقع', l:'الأقرب أولًا — وبحث بالشاخص.', body:function(){ return fieldList() + hiddenSitesCard() + (may('settings') ? (TYPES_OPEN ? typesCard() + '<div class="actions">' + btn('\u25B2 ' + t('إخفاء التصنيفات'), 'btn-quiet btn-sm', ' data-typesopen="0"') + '</div>' : card('\u{1F3F7} ' + t('التصنيفات'), '<p class="hint" style="margin:0">' + esc(t('أضف تصنيفًا أو احذفه، وانقل نقاطه إلى غيره. ولنقل نقاطٍ بعينها: حدّدها على الخريطة ثم «أو انقل المحدَّد إلى تصنيف» في لوح الإسناد.')) + '</p>', btn(t('افتح'), 'btn-secondary btn-sm', ' data-typesopen="1"'))) : ''); } },   /* التصنيفاتُ هنا أيضًا — مطويّةً (V23.0) */
  recs:  { m:'الميدان', t:'السجلات', l:'ما جرى في الميدان بالترتيب.', body:fieldRecords },
  tools: { m:'الميدان', t:'الأدوات', l:'التصديرات والمزامنة.', body:fieldTools }
};

/* سجلُّ التنقّل: يُدفَع إليه ما غادرناه لا ما دخلناه — فالرجوعُ عودةٌ إلى
   السابق. ويُقتصَر على عشرين خطوةً فلا ينمو بلا حدٍّ في يومِ عملٍ طويل.
   ولم يكن في التطبيق سجلٌّ أصلًا: من دخل تفاصيلَ نقطةٍ من الخريطة لم يجد
   طريقًا يعود به إلا القائمةَ الجانبية، فيفتحها ويبحث عن اسم ما جاء منه. */
var NAV_HIST = [];
function navPush(from){
  if (!from) return;
  if (NAV_HIST[NAV_HIST.length - 1] === from) return;
  NAV_HIST.push(from);
  if (NAV_HIST.length > 20) NAV_HIST.shift();
}
function navBack(){
  CUR = NAV_HIST.length ? NAV_HIST.pop() : 'over';
  render();
}

/* ═══ الموضعُ لا يضيع مع كلِّ ضغطة ═══
   كلُّ زرٍّ يُعيد الرسمَ، وإعادةُ الرسم كانت تقذف القارئَ إلى رأس الصفحة:
   من نزل في مئةٍ وعشرين نقطةً وضغط مربّعَ اختيارٍ عاد إلى أوّلها، ومن فتح
   لوحًا وضغط فيه زرًّا وجد اللوحَ من أعلاه. وهذا يجعل كلَّ عملٍ متعدّدَ
   الخطوات عذابًا — ولا يُكتشَف في اختبارٍ لأن الشاشةَ «تعمل».
     صار الموضعُ يُلتقَط قبل الرسم — للنافذة ولكلِّ لوحٍ أو قائمةٍ مفتوحة —
   ويُعاد بعده. والصعودُ إلى الرأس يبقى حيث يجب: عند تبديل الشاشة وحدَه. */
var SCROLL_KEEP = null;
/* (V26.1) كانت الرسمةُ تقرأ scrollTop لكلِّ صندوقٍ قابلٍ للتمرير قبل أن تُبدِّل المحتوى — والقراءةُ تُجبر المتصفّحَ على
   تخطيط الصفحة كلِّها (٣٠–٨٠ م.ث) ثم يُرمى التخطيطُ مع المحتوى. صارت المواضعُ تُسجَّل لحظةَ التمرير (حدثٌ خفيف)
   وتُقرأ من السجل عند الرسم بلا تخطيط. */
var SCROLL_SEEN = [], SCROLL_WIN = 0, SCROLL_TOPS = (typeof WeakMap === 'function') ? new WeakMap() : null, SCROLL_SELS = ['#content .pop-body', '#mapUI .pop-body', '#content .sheet-body', '#content [style*="overflow:auto"]', '#mapUI [style*="overflow:auto"]'];
if (typeof document === 'object'){
  document.addEventListener('scroll', function(e){
    var el = e.target;
    if (!el || el === document || el === window){ SCROLL_WIN = window.pageYOffset || document.documentElement.scrollTop || 0; return; }
    if (typeof el.scrollTop !== 'number') return;
    var top = el.scrollTop;   /* القراءةُ هنا رخيصة: التخطيطُ نظيفٌ أثناء التمرير — وفي الرسم تُقرأ من السجل بلا تخطيط */
    if (SCROLL_TOPS) SCROLL_TOPS.set(el, top); else el.__nskTop = top;
    if (SCROLL_SEEN.indexOf(el) < 0){ if (SCROLL_SEEN.length > 40) SCROLL_SEEN.shift(); SCROLL_SEEN.push(el); }
  }, { capture:true, passive:true });
}
function scrollGrab(){
  /* (V26.2) لا قراءةَ تخطيطٍ هنا البتّة: أيُّ قراءةٍ لـscrollTop أو pageYOffset قبل تبديل المحتوى تُجبر تخطيطَ الصفحة كلِّها
     (قيس ١٦٦ م.ث في صفحة الشركات) ثم يُرمى. المواضعُ من سجل حدث التمرير وحدَه. */
  var boxes = [];
  SCROLL_SEEN = SCROLL_SEEN.filter(function(el){ return el.isConnected; });
  SCROLL_SEEN.forEach(function(el){
    var top = SCROLL_TOPS ? SCROLL_TOPS.get(el) : el.__nskTop; if (!top) return;
    for (var q = 0; q < SCROLL_SELS.length; q++){
      var L = document.querySelectorAll(SCROLL_SELS[q]), i = Array.prototype.indexOf.call(L, el);
      if (i > -1){ boxes.push([SCROLL_SELS[q], i, top]); return; }
    }
  });
  var keys = {};   /* (V37.8) النوافذُ بمفتاحها: يُعاد موضعُها ولو تغيّر ترتيبُ ما قبلها */
  SCROLL_SEEN.forEach(function(el){ var k = el.getAttribute && el.getAttribute('data-keepscroll'); if (!k) return; var tp = SCROLL_TOPS ? SCROLL_TOPS.get(el) : el.__nskTop; if (tp) keys[k] = tp; });
  SCROLL_KEEP = { win:SCROLL_WIN, boxes:boxes, keys:keys };
}
function scrollBack(sameScreen){
  var K = SCROLL_KEEP; SCROLL_KEEP = null;
  if (!sameScreen || !K){ window.scrollTo(0, 0); return; }
  K.boxes.forEach(function(b){
    var L = document.querySelectorAll(b[0]);
    if (L[b[1]]) L[b[1]].scrollTop = b[2];
  });
  Object.keys(K.keys || {}).forEach(function(k){ var e = document.querySelector('[data-keepscroll="' + k.replace(/"/g, '') + '"]'); if (e) e.scrollTop = K.keys[k]; });
  if (K.win) window.scrollTo(0, K.win);
}
/* ═══ الأداءُ يُقاس لا يُحكى (V17.34) ═══
   زمنُ كلِّ رسمٍ وكلِّ سحبٍ يُقاس على الجهاز ويُرفَع مع نبضة الحضور —
   فيُرى من المكتب أيُّ جهازٍ بطيءٌ وأيُّ سحبٍ طويل، قبل أن يُشكى. */
var PERF = { r:[], p:[] }, COLD_N = 0;
function perfNote(kind, ms){ var L = PERF[kind]; if (!L) return; L.push(Math.round(ms)); if (L.length > 30) L.shift(); }
function perfAvg(kind){ var L = PERF[kind] || []; return L.length ? Math.round(L.reduce(function(a, b){ return a + b; }, 0) / L.length) : 0; }
/* ═══ مؤشّراتُ الأداء الأصليةُ في المتصفّح (V17.98) ═══
   ما يشعر به الفنيُّ لا ما نحكيه: أوّلُ رسمٍ للخريطة بعد الفتح، وأكبرُ رسمٍ
   (LCP)، واستجابةُ اللمس (INP تقريبًا من أحداث الإدخال)، والاهتزازُ (CLS)، وعددُ
   المهامّ الطويلة، وزمنُ الرسم لكلِّ صفحة. كلُّه بواجهة PerformanceObserver
   الأصلية — إن غابت فالقيمةُ null بلا خطأ — ويُلخَّص لليوم (عددٌ وp75 وأقصى)
   ويركب نبضةَ الحضور نفسَها. لا أسماءَ ولا نصوص: أرقامٌ ومعرِّفاتُ صفحات. */
var VIT = { day:'', open:null, lcp:[], inp:[], cls:0, lt:0, pages:{}, sup:{} };
function vitDay(){
  var day = dayKey();
  if (VIT.day !== day){ VIT.day = day; VIT.lcp = []; VIT.inp = []; VIT.cls = 0; VIT.lt = 0; VIT.pages = {}; }
  return VIT;
}
function vitPush(list, v){ if (typeof v !== 'number' || !isFinite(v)) return; list.push(Math.round(v)); if (list.length > 300) list.shift(); }
function vitPage(id, ms){ var V = vitDay(); if (!id) return; var L = V.pages[id] = V.pages[id] || []; vitPush(L, ms); }
function vitObserve(type, opts, fn){
  if (typeof PerformanceObserver !== 'function') return false;
  try {
    var sup = PerformanceObserver.supportedEntryTypes;
    if (sup && sup.indexOf(type) < 0) return false;
    var po = new PerformanceObserver(function(l){ try { fn(l.getEntries()); } catch (e){ VIT.err = 1; } });
    po.observe(Object.assign({ type:type, buffered:true }, opts || {}));
    return true;
  } catch (e){ return false; }
}
function perfVitalsInit(){
  vitDay();
  VIT.sup.lcp = vitObserve('largest-contentful-paint', {}, function(es){ es.forEach(function(e){ vitPush(VIT.lcp, e.startTime); }); });
  VIT.sup.inp = vitObserve('event', { durationThreshold:16 }, function(es){ es.forEach(function(e){ if (e.interactionId) vitPush(VIT.inp, e.duration); }); });
  VIT.sup.cls = vitObserve('layout-shift', {}, function(es){ es.forEach(function(e){ if (!e.hadRecentInput && typeof e.value === 'number') VIT.cls += e.value; }); });
  VIT.sup.lt  = vitObserve('longtask', {}, function(es){ VIT.lt += es.length; });
}
/* أوّلُ رسمٍ للخريطة بعد الفتح — علامةٌ خاصةٌ بالتطبيق */
function vitMapReady(){
  if (VIT.open !== null) return;
  var t = (typeof performance === 'object' && performance.now) ? performance.now() : (Date.now() - BOOT_AT);
  VIT.open = Math.round(t);
  try { if (typeof performance === 'object' && performance.mark) performance.mark('nsk-map-ready'); } catch (e){ VIT.err = 1; }
}
function p75(list){ if (!list || !list.length) return null; var a = list.slice().sort(function(x, y){ return x - y; }); return a[Math.min(a.length - 1, Math.max(0, Math.ceil(a.length * 0.75) - 1))]; }
function vitSum(list){ return list && list.length ? { n:list.length, p75:p75(list), max:Math.max.apply(null, list) } : null; }
function perfSummary(){
  var V = vitDay(), pages = {};
  Object.keys(V.pages).forEach(function(k){ pages[k] = vitSum(V.pages[k]); });
  return { day:V.day, open:V.open, lcp:VIT.sup.lcp ? vitSum(V.lcp) : null, inp:VIT.sup.inp ? vitSum(V.inp) : null,
           cls:VIT.sup.cls ? Math.round(V.cls * 1000) / 1000 : null, lt:VIT.sup.lt ? V.lt : null, pages:pages };
}
/* ═══ البؤرةُ تبقى في الحقل عبر إعادة الرسم (V17.38) ═══
   حقولُ الترشيح تُعيد الرسمَ عند كلِّ حرف، وإعادةُ الرسم تبني الحقلَ من جديدٍ
   فتضيع البؤرةُ وموضعُ المؤشِّر — فيكتب المستخدمُ حرفًا ثم يضغط الحقلَ ليكتب
   الثاني. فتُلتقَط هويةُ الحقل النشط وموضعُ مؤشِّره قبل الرسم، ويُعادان بعده
   إلى الحقل نفسِه — بلا استثناءٍ لشاشة، فما يصحُّ لسجلِّ الأحداث يصحُّ لغيره. */
function focusGrab(){
  var el = document.activeElement;
  if (!el || !el.tagName) return null;
  var tag = el.tagName.toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') return null;
  var sel = '';
  if (el.id) sel = '#' + el.id;
  else {
    for (var i = 0; i < el.attributes.length; i++){
      var a = el.attributes[i];
      if (a.name.indexOf('data-') === 0){ sel = '[' + a.name + '="' + a.value.replace(/"/g, '\\"') + '"]'; break; }
    }
  }
  if (!sel) return null;
  var pos = null;
  try { pos = el.selectionStart; } catch (e){ pos = null; }
  return { sel:sel, pos:pos };
}
function focusBack(g){
  if (!g) return;
  var el;
  try { el = document.querySelector(g.sel); } catch (e){ return; }
  if (!el || el === document.activeElement) return;
  try {
    el.focus({ preventScroll:true });
    if (g.pos != null && el.setSelectionRange) el.setSelectionRange(g.pos, g.pos);
  } catch (e){ LS_ERR = e; }
}
/* ═══ القوائمُ الطويلة مئةً أوّلًا ثم «اعرض المزيد» (V26.2) — قرارُ المالك ═══
   صفحةٌ تبني ثلاثَمئة صفٍّ (أربعةُ آلافِ عنصر) تأخذ ربعَ ثانيةٍ على المكتب وثانيةً على الهاتف مع كلِّ ضغطة — وهو أقربُ
   شيءٍ إلى «التعليق». صارت كلُّ قائمةٍ تبني مئةً، وزرٌّ واحدٌ أسفلَ الصفحة يزيد مئتين كلَّ ضغطة؛ والبحثُ في الصفحة
   يفتح الكلَّ كما كان (حتى خمسة آلاف). المفتاحُ صفحةٌ وشريحة، فلا يحمل عدُّ صفحةٍ إلى أخرى. */
var MORE_SHOWN = {}, MORE_FIRST = 100, MORE_STEP = 200, MORE_CUT = 0;
function moreKey(){ return CUR + ':' + ((typeof PTAB === 'object' && PTAB && PTAB[CUR]) || ''); }
function capList(L, base){
  if (PG_Q) return L.slice(0, 5000);
  var n = Math.min(base || MORE_FIRST, MORE_FIRST) + (MORE_SHOWN[moreKey()] || 0);
  if (L.length > n){ MORE_CUT += L.length - n; return L.slice(0, n); }
  return L;
}
function moreHtml(){
  if (!MORE_CUT) return '';
  return '<div style="padding:10px 16px 18px;text-align:center">' + btn('\u2B07 ' + t('اعرض المزيد') + ' (' + nm(Math.min(MORE_STEP, MORE_CUT)) + ' ' + t('من') + ' ' + nm(MORE_CUT) + ')', 'btn-secondary btn-sm', ' data-morek="1"') + '</div>';
}
function render(force){   /* (V31.8) ذاكرةُ الرسمة: تُفتَح هنا وتُغلَق بعد الرسم مهما كان المخرج */
  DB.open();
  try { return render0(force); } finally { DB.memoReset(); }
}
function render0(force){
  try { assistSync(); setTimeout(assistSync, 0); } catch (eA){ LS_ERR = eA; }
  try { phStaleSync(); } catch (eS){ LS_ERR = eS; }   /* (V37.8) تنبيهُ الصور المعلّقة أكثرَ من ساعة */   /* (V36.1) فورًا، ومرةً بعد الرسمة لما تغيّر فيها */
  try { setTimeout(gedInject, 0); } catch (eG){ LS_ERR = eG; }   /* (V36.2) «✎ تعديل» بجوار كلِّ حذفٍ مسجَّل */
  try { setTimeout(gdelInject, 0); } catch (eD){ LS_ERR = eD; }   /* (V36.5) «🗑 حذف» بجوار خطوة السجلّات التي كانت بلا حذف */
  try { if (typeof KK_MAP !== 'undefined' && KK_MAP && !document.getElementById('kkSat')){ KK_MAP.remove(); KK_MAP = null; } } catch (eK){ LS_ERR = eK; }   /* (V34.2) */
  if (typeof SVD === 'object' && !SVD.checked && document.getElementById('nav')){ SVD.checked = true; setTimeout(svDraftRestore, 1500); }   /* (V25.9) مسودةُ مسحٍ انقطع — بعد الإقلاع لا في أثنائه */
  var wasCur = RENDER_CUR, wasTab = TABS[CUR] ? tabCur(CUR) : '';
  /* فهرسُ المهامِّ عمرُه رسمةٌ واحدة (V17.47): بناؤه جزءان من الألف، وإبقاؤه
     أطولَ يجعل صحّتَه رهينةَ تذكُّرِ كلِّ كاتبٍ أن يُبطِله — وذلك عهدٌ يُنسى.
     فيُبنى مرةً في الرسمة ويُستهلَك آلافَ المرات فيها، ويموت معها. */
  TK_IX = null; FUP_MEMO = {}; CO_BK = null; MORE_CUT = 0;
  try { wakeSync(); } catch (e){ LS_ERR = e; }   /* قفلُ الشاشة يتبع الصفحةَ المرسومة (V17.99) */
  var FOCUS_G = focusGrab();
  var T_R0 = (typeof performance === 'object' && performance.now) ? performance.now() : Date.now();
  setTimeout(function(){
    focusBack(FOCUS_G);
    var T_R1 = ((typeof performance === 'object' && performance.now) ? performance.now() : Date.now()) - T_R0;
    perfNote('r', T_R1);
    try { vitPage(CUR, T_R1); } catch (e){ VIT.err = 1; }   /* زمنُ الرسم لكلِّ صفحة (V17.98) */
  }, 0);
  lsSet('nsk14.page', JSON.stringify({ cur:CUR, tab:TABS[CUR] ? PTAB[CUR] : '' }));
  scrollGrab();
  /* نافذةُ الكلمة على الجسد لا على المحتوى: مسارُ الخريطة يعود قبل رسم
     المحتوى، وشاشةُ الفنيِّ الأولى هي الخريطة — فلو رُسمت في المحتوى لم
     يرها من أُريد أن يراها. */
  var pwOld = document.getElementById('pwWrap');
  if (pwOld) pwOld.parentNode.removeChild(pwOld);
  if (PW){
    var pwEl = document.createElement('div'); pwEl.id = 'pwWrap';
    pwEl.innerHTML = pwHtml();
    document.body.appendChild(pwEl);
  }
  /* لوحُ تعديل المسح (V22.3) — فوق كلِّ شيءٍ ما دام مفتوحًا */
  var sqOld = document.getElementById('svqSheet'); if (sqOld) sqOld.parentNode.removeChild(sqOld);
  if (SVQ.id){ var sqW = document.createElement('div'); sqW.innerHTML = svqSheet(); if (sqW.firstChild) document.body.appendChild(sqW.firstChild); }
  /* لافتةُ الحفظ المحلي (V17.93) — حين يوجد خطرٌ حقيقيٌّ فقط (V19.6) */
  idbBannerUpdate();
  /* لافتةُ الحساب الذي ينتظر التفعيل (V17.93) */
  var ab = document.getElementById('inactBanner'), inact = typeof meInactive === 'function' && meInactive();
  if (inact){
    if (!ab){ ab = document.createElement('div'); ab.id = 'inactBanner'; ab.setAttribute('role', 'status'); document.body.insertBefore(ab, document.body.firstChild); }
    ab.innerHTML = '\u23F3 ' + esc(t('حسابك ينتظر تفعيلَ المكتب — عملُك يبقى على هذا الجهاز ويُرفَع بعد التفعيل.'));
  } else if (ab){ ab.parentNode.removeChild(ab); }
  /* حثُّ التثبيت على آيفون (V19.6) */
  var inOld = document.getElementById('iosNudge'); if (inOld) inOld.parentNode.removeChild(inOld);
  if (iosNudgeDue()){ var inEl = document.createElement('div'); inEl.id = 'iosNudge'; inEl.innerHTML = iosNudgeHtml(); document.body.appendChild(inEl); }
  /* لوحُ المسح بالكاميرا (V17.99) */
  var scOld = document.getElementById('scanWrap'); if (scOld) scOld.parentNode.removeChild(scOld);
  if (SCAN.on){ var scEl = document.createElement('div'); scEl.id = 'scanWrap'; scEl.innerHTML = scanSheet(); document.body.appendChild(scEl); }
  if (CUR === 'forms' && typeof tabCur === 'function' && tabCur('forms') === 'insForm') scanCheck();
  /* «ما الجديد» على الجسد كذلك — تحت نافذة الكلمة إن اجتمعتا (V17.87) */
  var wnOld = document.getElementById('wnWrap');
  if (wnOld) wnOld.parentNode.removeChild(wnOld);
  if (WN && !PW){
    var wnEl = document.createElement('div'); wnEl.id = 'wnWrap';
    wnEl.innerHTML = wnHtml();
    document.body.appendChild(wnEl);
  }
  var key = (typeof renderKey === 'function') ? renderKey() : String(Math.random());
  if (!force && key === RENDER_KEY && document.getElementById('content')
      && document.getElementById('content').children.length) return;
  RENDER_KEY = key; RENDER_N++;

  /* معرِّفُ شريحةٍ قديمٌ — من رابطٍ أو قائمةٍ أو زرٍّ — يصل إلى أمِّه على شريحته.
     والوصولُ بمعرِّف الأمِّ نفسِه (وهو معرِّفُ شريحتها الأولى) يفتح تلك الشريحة
     — فمن قصد «المستخدمين» لا يجد نفسَه في «الوظائف» لأنها آخرُ ما فُتح.
     أمّا إعادةُ الرسم في المكان (CUR لم يتغيّر) فتُبقي الشريحةَ المفتوحة. */
  if (PARENT[CUR] && PARENT[CUR] !== CUR){ PTAB[PARENT[CUR]] = CUR; CUR = PARENT[CUR]; }
  else if (TABS[CUR] && PARENT[CUR] === CUR && CUR !== RENDER_CUR) PTAB[CUR] = CUR;
  if (!seesPage(CUR)){
    var n = R().nav;
    CUR = (n === '*') ? 'map' : n[0];
    if (PARENT[CUR] && PARENT[CUR] !== CUR){ PTAB[PARENT[CUR]] = CUR; CUR = PARENT[CUR]; }
  }
  RENDER_CUR = CUR;
  var p = FIELD_PAGES[CUR] || PAGE[CUR];
  if (!p) p = PAGE.over;
  /* الوصفُ تحت العنوان وصفُ الشريحة المفتوحة لا وصفُ الأمِّ وحدها */
  var pl = p.l;
  if (TABS[CUR]){
    var tbc = tabCur(CUR), tbm = TABS[CUR].filter(function(x){ return x[0] === tbc; })[0];
    if (tbm && tbm[3]) pl = tbm[3];
  }

  document.getElementById('nav').innerHTML = navHtml();
  var bk = document.getElementById('backBtn');
  if (bk) bk.hidden = !NAV_HIST.length;
  document.getElementById('crumb').textContent = t(p.t);
  document.getElementById('brandName').innerHTML =
      esc(t('قارئات أفاقي')) + '<div class="brand-sub">' + esc(t('حج ١٤٤٨هـ')) + '</div>';
  var wr = document.getElementById('whoRole');
  if (wr) wr.textContent = t(R().n) + ' — ' + t(R().d);
  var outEl = document.getElementById('outBtn');
  outEl.textContent = t('تسجيل الخروج');
  var pwB = document.getElementById('pwBtn');
  if (pwB) pwB.textContent = '\u{1F511} ' + t('تغيير كلمة المرور');

  /* كان يُكتَب هنا وقتٌ ثابتٌ «٠٢:٥١» عند كلِّ رسم — فوق «آخر مزامنة»
     الحيّة التي تكتبها الشارة — فيقرأ الرأسُ وقتًا مخترعًا حتى تعود الشارةُ
     بعد نصف دقيقة. الشارةُ وحدَها تكتب هذا السطر. */
  syncBadge();

  var c  = document.getElementById('content');
  var mw = document.getElementById('mapWrap');
  var mu = document.getElementById('mapUI');

  /* الخريطةُ ثلاثيةً: عند العودة إلى الخريطة يستعيد المحرّكُ حجمَه ونقاطَه */
  if (CUR === 'map' && MAP_3D && M3){ setTimeout(function(){ try { M3.resize(); m3Paint(); } catch (e){ LS_ERR = e; } }, 60); }
  /* لوحةُ المهمة: تُرسَم في مضيفها الثابت خارج المحتوى — أسفلَ الشاشة على الهاتف ووسطَها على المكتب */
  if (typeof wtHostSync === 'function') wtHostSync();
  if (typeof chalPopSync === 'function') chalPopSync();   /* (V26.9) */
  /* الترشيحُ يُعاد بعد الرسم — وإلا عاد ما أُخفي عند أوّل تحديثٍ حيّ */
  if (typeof pgFind === 'function' && PG_Q && !pgBindOf()) setTimeout(function(){ pgFind(); }, 0);
  /* لوحُ البلاغ على الجسد كلوح المهمة — يُفتَح فوق أيِّ شاشة */
  { var bh = document.getElementById('bugHost');
    if (!bh){ bh = document.createElement('div'); bh.id = 'bugHost'; document.body.appendChild(bh); }
    bh.innerHTML = BUG_OPEN ? bugSheet() : ''; }
  /* ملفُّ البند: لوحٌ على الجسد كغيره */
  { var uh = document.getElementById('ulHost');
    if (!uh){ uh = document.createElement('div'); uh.id = 'ulHost'; document.body.appendChild(uh); }
    uh.innerHTML = USR.log ? userLogHtml(USR.log) : ''; }
  { var dh = document.getElementById('dosHost');
    if (!dh){ dh = document.createElement('div'); dh.id = 'dosHost'; document.body.appendChild(dh); }
    dh.innerHTML = (WBS_DOS && CUR === 'wbs') ? wbsDosSheet() : ''; }
  /* جولةُ البداية: لوحٌ على الجسد وإضاءةُ بندِ الشاشة في القائمة */
  { var th = document.getElementById('tourHost');
    if (!th){ th = document.createElement('div'); th.id = 'tourHost'; document.body.appendChild(th); }
    th.innerHTML = TOUR.open ? tourHtml() : '';
    if (typeof tourSpot === 'function') tourSpot(); }
  if (CUR === 'map'){
    /* لا يُمَسُّ #mapBox — تُرسَم واجهتُه في طبقةٍ فوقه وحدها */
    if (mw) mw.hidden = false;
    c.hidden = true;
    c.innerHTML = '';
    if (mu){
      /* الطبقاتُ العلويةُ تُلحَق هنا أيضًا: مسارُ الخريطة يرجع قبل السطر
         الذي يُلحقها في المحتوى، فكان زرُّ المساعد يُضغَط على الخريطة
         فتُفتَح حالتُه ولا يظهر شيء — تُبنى الطبقةُ ولا تجد أين تُلصَق. */
      mu.innerHTML = mapUIHtml()
        + (HELP_OPEN ? helpHtml() : '')
        + '' + gedHtml()   /* (V36.1) المساعدُ في حاويته الثابتة — assistSync؛ (V36.2) ونافذةُ التعديل الموحّد */
        + (QUEUE_OPEN ? queueHtml() : '');
      /* وقتَ التحديد أو النقل: الشاشةُ للعمل — تُخفى الأسطورةُ والعدّاد */
      var busy = MAP_SELECT || MOVE_ID;
      mu.classList.toggle('map-busy', !!busy);
    }
    mapDraw();
    if (MAP) mapPaint();
    if (mu) labelCells(mu);
    scrollBack(wasCur === CUR);
    return;
  }

  if (mw) mw.hidden = true;
  c.hidden = false;
  /* الصفحاتُ ذاتُ الجداول العريضة تُطلَق من حدِّ العرض (V17.16) — وغيرُها
     يبقى في عرضٍ مقروء. ويُكتَب الصنفُ هنا لأن السطرَ يُعيد بناءَ الأصناف
     كلَّها، فما كُتب قبله يُمحى. */
  var WIDE = ['wbs','over','survey','inv','perf','ipc','recs','users','plan'];
  c.className = 'content' + (p.full ? ' flush' : '') + (WIDE.indexOf(CUR) > -1 ? ' wide' : '');
  /* بحثُ الصفحة يخصُّ صفحتَه: يُمسَح عند الانتقال (V17.23) */
  /* بحثُ الشاشة يُمسَح عند مغادرتها — لا يُترَك مُرشِّحًا يعود إليه صاحبُه
     فيظنّ البياناتِ ناقصة (V17.24) */
  if (wasCur !== CUR && !PG_KEEP){
    PG_Q = '';
    if (PG_LAST_BIND){ try { PG_LAST_BIND(''); } catch (er){ LS_ERR = er; } PG_LAST_BIND = null; }
    var pb = PG_BIND[CUR]; if (pb) pb('');
  }
  PG_KEEP = false;   /* الانتقالُ الموجَّهُ إلى نقطةٍ يحتفظ ببحثه مرةً واحدة (V17.33) */
  /* التصدير مكانه المتابعة: الوزارة تُصدّر تقاريرها وإن لم تملك التصدير الكامل */
  var head = p.full ? '' : pageHead(p.m, p.t, pl,
    (p.m === 'المتابعة' || may('exportAll'))
      ? btn('تصدير','btn-secondary',' data-exp="1"')
        /* السهمُ الصغير: إكسلُ هذه الصفحة كلِّها — كلُّ جداولها بكلِّ صفوفها لا ما يُعرَض */
        + btn('\u2B07','btn-secondary',' data-xlspage="1" title="' + esc(t('إكسل هذه الصفحة كاملةً — كل الجداول بكل الصفوف')) + '" aria-label="' + esc(t('إكسل هذه الصفحة كاملةً — كل الجداول بكل الصفوف')) + '"')
      : '');
  c.innerHTML = (p.full ? p.body() : (head + p.body()))
    + moreHtml()   /* (V26.2) */
    + (HELP_OPEN ? helpHtml() : '')
    + '' + gedHtml()   /* (V36.1) المساعدُ في حاويته الثابتة — assistSync؛ (V36.2) ونافذةُ التعديل الموحّد */
    + (QUEUE_OPEN ? queueHtml() : '');

  labelCells(c);
  if (EXP_OPEN) c.insertAdjacentHTML('beforeend', expHtml());
  /* الشاشةُ نفسُها والشريحةُ نفسُها: يبقى الموضع. غيرُهما: يُصعَد للرأس. */
  scrollBack(wasCur === CUR && wasTab === (TABS[CUR] ? tabCur(CUR) : ''));
}

function enterApp(user, pass){
  /* ═══ لا دخولَ بلا هويةٍ مُثبَتة ═══
     كان الهيكلُ يظهر أوّلًا ثم يُحاوَل الدخول — «لأن التطبيقَ يعمل بلا
     شبكةٍ بحكم تصميمه». وكان الدورُ الافتراضيُّ مهندسًا. فمن فتح الرابطَ
     وضغط «دخول» بحقلين فارغين دخل مهندسًا كاملَ الصلاحية بلا اسمٍ ولا كلمة
     — وهذا ما وقع حين أُرسل الرابطُ لغيرِ أهله. صار الهيكلُ لا يظهر إلا بعد
     أن تُثبِت المصادقةُ الهويةَ؛ وبلا شبكةٍ لا يُفتَح إلا لمن دخل من قبل
     على هذا الجهاز فحفظت المصادقةُ جلستَه — وهي تُثبِتها بلا شبكة. */
  user = String(user || '').trim(); pass = String(pass || '');
  if (!user || !pass){ toast(t('اكتب اسمَ المستخدم وكلمةَ المرور')); return; }
  var goBtn = document.getElementById('lgGo');
  if (goBtn) goBtn.disabled = true;
  FB.signIn(user, pass).catch(function(e){
    return { ok:false, err:String(e && e.code || e) };
  }).then(function(r){
    r = r || { ok:false, err:'unknown' };
    if (r.ok) SESS_PW = pass;
    if (!r.ok){
      if (r.err === 'offline'){
        /* بلا شبكة: تُقبَل جلسةٌ حفظتها المصادقةُ على هذا الجهاز لهذا الاسم وحده */
        var cu = FB.auth && FB.auth.currentUser;
        var same = cu && String(cu.email || '').toLowerCase().indexOf(user.toLowerCase()) === 0;
        if (!same){ toast(t('بلا شبكة — الدخولُ الأوّلُ يحتاج شبكة')); if (goBtn) goBtn.disabled = false; return; }
        toast(t('بلا شبكة — دخلتَ بجلستك المحفوظة ويُرفَع ما تسجّله حين تعود'));
      } else {
        toast(t('تعذّر الدخول — تأكّد من الاسم وكلمة المرور'));
        if (goBtn) goBtn.disabled = false;
        return;
      }
    } else {
      ROLE = ROLES[r.role] ? r.role : 'tech';
    }
    enterShell();
    var first = FB.legacyDone() ? Promise.resolve(0) : FB.pullLegacy();
    setTimeout(function(){ liveWatch(); liveSmall(); pulseWatch(); presenceBeat(true); }, 1200);
    first.then(function(n){
      if (n) toast(nm(n) + ' ' + t('سجلًّا من النسخة السابقة'));
      return pullDelta();
    }).then(function(){ statBump(); render(1); liveWatch(); })
      .catch(function(e){
        softErr('بدء الجلسة', e, 'دخلتَ — وتعذّر جلبُ البيانات، جرّب المزامنة');
        render(1);
      });
  });
}

function enterShell(){
  var lg = document.getElementById('login');
  if (lg){
    var cv = document.getElementById('loginCv');
    if (cv && cv.__stop) cv.__stop();
    lg.remove();
  }
  document.getElementById('app').style.display = '';
  lsSet('nsk14.session', '1');
  /* الصفحةُ التي كان عليها قبل إعادة التحميل — لا أوّلُ صفحة */
  var sp = null; try { sp = JSON.parse(lsGet('nsk14.page') || 'null'); } catch (e){ LS_ERR = e; }
  if (BOOT_GUARD.crashes){   /* (V21.9) الإقلاعُ السابقُ مات فجأة: لا نعود إلى حيث مات */
    var bp = BOOT_GUARD.prev || {};
    sp = null;
    if (BOOT_GUARD.crashes >= 2 && seesPage('mywork')) CUR = 'mywork';
    var bmsg = 'توقّفٌ مفاجئٌ في الإقلاع السابق — المرحلة: ' + (bp.stage || '؟') + ' · الصفحة: ' + (bp.page || '؟') + ' · المرّات: ' + BOOT_GUARD.crashes + ' · ' + appVer();
    try { logEventQuiet(bmsg); } catch (e){ LS_ERR = e; }   /* صحةُ النظام على الجهاز */
    try { setTimeout(function(){ try { logEvent(bmsg, ''); } catch (e2){ LS_ERR = e2; } }, 3000); } catch (e){ LS_ERR = e; }   /* وسجلُّ الأحداث في المكتب — بعد استقرار الدخول */
    setTimeout(function(){ try { toast(t('فُتح التطبيقُ بوضعٍ خفيفٍ بعد توقّفٍ مفاجئ — كلُّ شيءٍ محفوظ')); } catch (e){ LS_ERR = e; } }, 1200);
  }
  if (sp && sp.cur && sp.cur !== 'site' && ((typeof FIELD_PAGES === 'object' && FIELD_PAGES[sp.cur]) || PAGE[sp.cur]) && seesPage(sp.cur)){
    CUR = sp.cur;
    if (sp.tab && TABS[sp.cur]) PTAB[sp.cur] = sp.tab;
  }
  bootStage('shell');
  render();
  bootStage('render:' + CUR);   /* (V34.2) والصفحةُ في المرحلة نفسِها */
  syncBadge();
  /* أوّلُ دخولٍ لهذا الحساب: تُفتَح الجولةُ بنفسها — ومن رآها لا تُعاد */
  try { tourMaybe(); if (TOUR.open) render(1); } catch (e){ LS_ERR = e; }
  /* أوّلُ فتحٍ بعد تحديث: سطورُ ما تغيّر مرةً واحدة — ولا تزاحم الجولةَ (V17.87) */
  try { if (!TOUR.open && whatsNewMaybe()) render(1); } catch (e){ LS_ERR = e; }
  try { storagePersistMaybe(); } catch (e){ LS_ERR = e; }
  try { perfVitalsInit(); } catch (e){ LS_ERR = e; }
  try { SUN_ON = lsGet('nsk14.sun') === '1'; sunApply(); } catch (e){ LS_ERR = e; }
}
/* الصفحةُ تُطوى (إغلاقٌ أو انتقالٌ أو إسقاطٌ من النظام) أو تذهب إلى الخلفية: محاولةُ
   رفعٍ لما ينتظر (V19.5) — كتاباتٌ كانت ستُرفَع على أيِّ حال */
function syncOnHide(){
  try { if (STATE.meta.online && FB.ready && CORE.pending() > 0){ CORE.flush(); return true; } } catch (e){ LS_ERR = e; }
  return false;
}
window.addEventListener('pagehide', syncOnHide);
/* الإغلاقُ وعملٌ لم يُحفَظ: يُسأل (V17.93) — المتصفّحُ يعرض نصَّه هو */
window.addEventListener('beforeunload', function(e){
  if (IDB_BAD && idbUnsynced()){ e.preventDefault(); e.returnValue = ''; return ''; }
});
/* ═══ التخزينُ الدائم (V17.93) ═══
   المتصفّحُ قد يمحو مخزنَ الموقع حين يضيق — ومعه عملُ يومٍ لم يُرفَع. يُطلَب
   التخزينُ الدائمُ مرةً واحدةً بعد الدخول إن كانت الواجهةُ موجودةً ولم يُمنَح،
   وتُسجَّل النتيجةُ فتُرى في صحة النظام وتُحمَل في نبضة الحضور. */
var PERSIST = { st:'', at:0 };
function storagePersistMaybe(){
  var ns = (typeof navigator === 'object') && navigator.storage;
  if (!ns || typeof ns.persist !== 'function' || typeof ns.persisted !== 'function'){ PERSIST.st = 'na'; return Promise.resolve('na'); }
  return ns.persisted().then(function(ok){
    if (ok){ PERSIST.st = 'yes'; PERSIST.at = Date.now(); return 'yes'; }
    var asked = lsGet('nsk14.persistAsk') || '';
    if (asked){ PERSIST.st = 'no'; return 'no'; }          /* سُئل من قبل — لا يُكرَّر */
    lsSet('nsk14.persistAsk', String(Date.now()));
    return ns.persist().then(function(g){ PERSIST.st = g ? 'yes' : 'no'; PERSIST.at = Date.now(); return PERSIST.st; });
  }).catch(function(){ PERSIST.st = 'no'; return 'no'; });
}

/* قائمةُ الخصائص المربوطة، مشتقّةً من نصِّ المعالجات لا مكتوبةً بيد.
   وإن تعذّر الاشتقاق — بتصغيرٍ أو محرّكٍ لا يُرجع النص — لم يُتَّهم زرٌّ
   بريءٌ بالموت: تُعَدُّ كلُّها مربوطةً، ويمسك حارسُ الحُرّاس العطلَ عند الفحص. */
var ACTS_CACHE = null;
function actList(){
  if (ACTS_CACHE) return ACTS_CACHE;
  /* ═══ الخصائصُ تُشتقُّ من المستمع كلِّه لا من دالةٍ واحدة ═══
     كانت تُقرأ من `onDocClick` وحدَها. ولمّا طالت فصُلت أجزاؤها إلى
     `clickTables` و`clickA` صارت خصائصُ ما فُصل **غيرَ مسجّلة**: يضغط
     المستخدمُ «راجع» أو شريحةَ «متعذّرٌ يحتاج قرارًا» أو زرَّ اعتماد الوزارة
     فيبتلعها الحارسُ نفسُه ولا يقع شيء — وهو الحارسُ الذي كُتب ليمنع هذا
     بالضبط. تُقرأ الثلاثُ معًا. */
  var src = '';
  try {
    src = String(onDocClick)
        + (typeof clickTables === 'function' ? String(clickTables) : '')
        + (typeof clickA === 'function' ? String(clickA) : '');
    /* (V33.0) المعالجان صارا أجزاءً: نصُّ الأجزاء يُقرأ كذلك — وإلا ظنَّ الحارسُ كلَّ زرٍّ غيرَ مربوطٍ وابتلعه */
    for (var pi = 1; pi <= 30; pi++){
      if (typeof window['onDocClickPart' + pi] === 'function') src += String(window['onDocClickPart' + pi]);
      if (typeof window['clickAPart' + pi] === 'function') src += String(window['clickAPart' + pi]);
    }
  } catch (e){ LS_ERR = e; }
  var found = src.match(/data-[\w-]+/g) || [];
  ACTS_CACHE = found.length >= 20 ? found.filter(function(v, i){ return found.indexOf(v) === i; })
                                  : null;
  return ACTS_CACHE;
}

/* المستمعُ دالةٌ مسمّاةٌ لا مجهولة: منها تُشتقُّ قائمةُ الخصائص المربوطة،
   فلا تُكتَب بيدٍ ولا تُنسى. */
/* ═══ نقراتُ الجداول والنوافذ ═══
   `onDocClick` تجاوزت ستّين ألفَ حرفٍ — دالةٌ بهذا الطول لا تُقرأ ولا تُصان،
   والحارسُ يمسك ذلك. فصُلت نقراتُ الجداول الحديثة (نافذةُ الشركات، جدولُ
   المتابعة، المهامُّ الأسبوعية، المعالم) إلى دالةٍ ترجع `true` إن التقطت
   الحدثَ فيتوقّف الباقي. */
function clickTables(e){
  /* نافذةُ مخيّمات الشركة: تُفتَح برقمٍ، وتُغلَق بالإكس أو بالضغط خارجَها */
  var cop = e.target.closest('[data-copop]');
  if (cop){ CO_POP = { co:cop.getAttribute('data-copop'), kind:cop.getAttribute('data-cok') || 'all' }; render(1); return true; }
  if (e.target.closest('[data-copopx]')){ CO_POP = null; render(1); return true; }
  if (e.target.closest('[data-copopxls]')){ coPopXls(); return true; }
  var cogo = e.target.closest('[data-comap]');
  if (cogo){ var gid = cogo.getAttribute('data-comap'); CO_POP = null;
             POP_SITE = gid; POP_OPEN = true; CUR = 'map'; render();
             setTimeout(function(){ mapFly(gid); }, 500); return true; }
  var cst = e.target.closest('[data-copopsite]');
  if (cst){ DETAIL_ID = cst.getAttribute('data-copopsite'); CO_POP = null; goPage('site'); render(1); return true; }
  if (CO_POP && e.target.id === 'coPopWrap'){ CO_POP = null; render(1); return true; }
  if (e.target.closest('[data-bell]')){ bellToggle(); return true; }
  if (e.target.closest('[data-bellclose]')){ bellToggle(false); /* ثم يكمل إلى data-p */ }
  if (BELL_OPEN && !e.target.closest('#bellPop') && !e.target.closest('[data-bell]')) bellToggle(false);
  if (e.target.closest('[data-nreadall]')){ notifStore().forEach(function(n){ n.read = true; }); CORE.saveSoon(); syncBadge(); bellToggle(false); if (CUR === 'notif') render(1); return true; }
  if (e.target.closest('[data-npopx]')){ e.preventDefault(); var px = e.target.closest('.notif-pop'); if (px) px.remove(); return true; }   /* (V20.8) إغلاقٌ بلا انتقال */
  if (e.target.closest('[data-nmute]')){ e.preventDefault(); lsSet('nsk14.nmute', String(Date.now() + 3600000)); var pw = document.getElementById('notifPop'); if (pw) pw.innerHTML = ''; toast(t('كُتمت الإشعاراتُ ساعةً على هذا الجهاز')); return true; }
  if (e.target.closest('[data-nset]')){
    var ns = e.target.closest('[data-nset]').getAttribute('data-nset');
    if (ns === 'npop' || ns === 'nsys'){ var k0 = 'nsk14.' + ns; lsSet(k0, lsGet(k0) === '0' ? '1' : '0'); }
    else if (ns === 'tomorrow'){ var tm = new Date(); tm.setDate(tm.getDate() + 1); tm.setHours(7, 0, 0, 0); lsSet('nsk14.nmute', String(tm.getTime())); }
    else if (ns === 'unmute') lsSet('nsk14.nmute', '0');
    if (ns !== 'npop' || lsGet('nsk14.npop') === '0'){ var pw2 = document.getElementById('notifPop'); if (pw2) pw2.innerHTML = ''; }
    render(1); return true;
  }
  var npo = e.target.closest('[data-npop]');
  if (npo){ bellToggle(false); notifPopGo(npo.getAttribute('data-npop')); return true; }
  if (e.target.closest('[data-kmix]')){ KMI = null; render(1); return true; }
  if (e.target.closest('[data-kmigo]')){ kmiApply(); return true; }
  var kma = e.target.closest('[data-kmiall]');
  if (kma && KMI){
    var mode = kma.getAttribute('data-kmiall');
    KMI.rows.forEach(function(r){ r.take = (mode === 'new') ? (r.st === 'new') : false; });
    render(1); return true;
  }
  var gg = e.target.closest('[data-guideg]');
  if (gg){ GUIDE.g = gg.getAttribute('data-guideg') || ''; render(1); return true; }
  var lg = e.target.closest('[data-legend]');
  if (lg){ LEGEND_ON = lg.getAttribute('data-legend') === '1'; lsSet('nsk14.legend', LEGEND_ON ? '1' : '0'); render(1); if (CUR === 'map' && MAP) mapPaint(); return true; }
  if (e.target.closest('[data-syncall]')){ syncAllNow(); return true; }
  if (e.target.closest('[data-phfull]')){ STATE.meta.phFull = 0; photosBackfill(true); toast(t('جارٍ فحصُ صور الدرايف…')); render(1); return true; }   /* (V37.8) */
  if (e.target.closest('[data-phstalex]')){ phStaleSync.snooze = Date.now() + 30 * 60000; var ps0 = document.getElementById('phStale'); if (ps0) ps0.remove(); return true; }   /* (V37.13) */
  if (e.target.closest('[data-phflushnow]')){ if (!STATE.meta.online){ toast(t('افتح الشبكة أولًا')); return true; } photoFlush(); toast(t('جارٍ رفعُ الصور — اترك التطبيق مفتوحًا')); return true; }
  var phrf = e.target.closest('[data-phrefetch]');   /* (V37.7) أعد جلبَ صور النقطة */
  if (phrf){ var pid0 = phrf.getAttribute('data-phrefetch'); delete PH_FETCH[pid0]; photosFetchSite(pid0); render(1); return true; }
  var svph = e.target.closest('[data-svphotos]');   /* (V37.6) صورُ النقطة من صفّ القائمة */
  if (svph){ SV_PHO = svph.getAttribute('data-svphotos'); var hostP = (svph.closest('.svpop') || {}).parentNode || document.getElementById('content');   /* (V37.8) بلا إعادة رسم */
    if (hostP){ var tmpP = document.createElement('div'); tmpP.innerHTML = svPhoPanel(SV_PHO); while (tmpP.firstChild) hostP.appendChild(tmpP.firstChild); } else render(1); return true; }
  if (e.target.closest('[data-svphoclose]')){ SV_PHO = ''; ['svPhoVeil', 'svPhoBox'].forEach(function(i0){ var el0 = document.getElementById(i0); if (el0) el0.remove(); }); return true; }
  var phv = e.target.closest('[data-phview]');
  if (phv && phv.getAttribute('data-phview')){ photoView(phv.getAttribute('data-phview')); return true; }
  var phd = e.target.closest('[data-phdl]');
  if (phd){ photoDownload(phd.getAttribute('data-phdl')); return true; }
  if (e.target.closest('[data-phclose]')){ var pv = document.getElementById('phView'); if (pv) pv.remove(); return true; }
  var mle = e.target.closest('[data-mledit]');
  if (mle){ MILE_EDIT = mle.getAttribute('data-mledit'); MILE_NEW = false; render(1); return true; }
  if (e.target.closest('[data-mlcancel]')){ MILE_EDIT = ''; render(1); return true; }
  var mls = e.target.closest('[data-mlsave]');
  if (mls){
    var mid = mls.getAttribute('data-mlsave'), tr = mls.closest('tr'), g = function(k){ var el = tr && tr.querySelector('[data-mle="' + k + '"]'); return el ? el.value : ''; };
    var w = +g('w'), pr = g('prog');
    if (mileUpsert(mid, { n:g('n').trim(), w:isNaN(w) ? undefined : w, dep:g('dep').trim(), prog:(pr === '' ? undefined : +pr) })){ toast(t('حُفظ المعلَم')); MILE_EDIT = ''; render(1); }
    return true;
  }
  var mld = e.target.closest('[data-mldel]');
  if (mld){ mileRemove(mld.getAttribute('data-mldel')); return true; }
  if (e.target.closest('[data-mlnew]')){ MILE_NEW = true; MILE_EDIT = ''; render(1); return true; }
  if (e.target.closest('[data-mlncancel]')){ MILE_NEW = false; render(1); return true; }
  if (e.target.closest('[data-mlnsave]')){
    var v = function(id){ var el = document.getElementById(id); return el ? el.value : ''; };
    if (mileAdd(v('mlnN'), v('mlnW'), v('mlnD'), v('mlnDep').trim())) MILE_NEW = false;
    return true;
  }
  return false;
}
/* ═══ نقراتٌ منقولةٌ من onDocClick لتبقى تحت الحدّ — ترجع true إن التقطت الحدث ═══ */
function clickA(e){
  /* (V33.0) كان ٦٦٥ سطرًا؛ صار أجزاءً بالترتيب نفسِه — يُرجَع ما أرجعه الجزءُ الذي عالج النقرة */
  var r;
  if ((r = clickAPart1(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart2(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart3(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart4(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart5(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart6(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart7(e)) !== CLICK_NEXT) return r;
}
/* clickA — الجزء 1 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: assist، p، navtab، gt، g، open، nav، mode، pop، bst، bfsave، pq، help، exp، apick، asn، co، cofilt، comode، mfilt */
function clickAPart1(e){
  var asb = e.target.closest('[data-assist]');
  if (asb){
    if (asb.hasAttribute('data-p')){ ASSIST_OPEN = false; }
    else { ASSIST_OPEN = asb.getAttribute('data-assist') === '1'; render(1); return true; }
  }
  var a = e.target.closest('[data-p]');
  if (a){
    e.preventDefault();
    navPush(CUR);
    /* شريحةٌ من البحث (V19.0): معرِّفُ الشريحة نفسُه — والرسمُ يوصله إلى أمِّه على شريحته */
    goPage(a.getAttribute('data-navtab') || a.getAttribute('data-p'));
    NAV_Q = '';
    document.body.classList.remove('nav-open');
    render();
    return true;
  }
  var g = e.target.closest('[data-gt]');
  if (g){
    var sec = g.closest('.nav-section');
    var key = sec.getAttribute('data-g');
    var open = sec.getAttribute('data-open') !== 'false';
    OPEN[key] = !open;
    sec.setAttribute('data-open', open ? 'false' : 'true');
    g.setAttribute('aria-expanded', open ? 'false' : 'true');
    return true;
  }
  if (e.target.closest('[data-nav]')){
    /* (V23.9) «زرار أضغط عليه يعمل collapse للموديولز»: على الشاشة الكبيرة يُطوى الشريطُ الجانبيُّ ويتّسع المحتوى،
       ويُحفَظ الاختيار؛ وعلى الهاتف يبقى الدرجَ المنزلق كما كان */
    if (typeof window.matchMedia === 'function' && window.matchMedia('(min-width:901px)').matches){
      var off = !document.body.classList.contains('side-off');
      document.body.classList.toggle('side-off', off);
      lsSet('nsk14.sideoff', off ? '1' : '');
      if (off && NAV_Q){ NAV_Q = ''; render(1); }   /* (V24.0) الشريطُ بلا بحث — فلا يبقى مرشَّحًا بكلمةٍ لا تُرى */
      var bg = e.target.closest('[data-nav]'); bg.setAttribute('aria-expanded', off ? 'false' : 'true');
      setTimeout(function(){ try { if (typeof MAP !== 'undefined' && MAP && MAP.invalidateSize) MAP.invalidateSize(); if (typeof M3 !== 'undefined' && M3 && M3.resize) M3.resize(); } catch (e2){ LS_ERR = e2; } }, 260);
    } else document.body.classList.toggle('nav-open');
    return true;
  }
  var m = e.target.closest('[data-mode]');
  if (m){
    /* (V28.5) ملاحظةُ «تحديثات المنصة»: «التفاصيل المختصرة» حين تُفعَّل لا تُغلق — صارت الضغطةُ الثانيةُ عليها تُعيد الطبقةَ السابقة */
    var nmode = m.getAttribute('data-mode');
    if (nmode === 'brief' && FIELD_MODE === 'brief') nmode = (typeof FIELD_PREV === 'string' && FIELD_PREV && FIELD_PREV !== 'brief') ? FIELD_PREV : 'survey';
    else if (nmode === 'brief') FIELD_PREV = FIELD_MODE;
    FIELD_MODE = nmode;
    selClear();
    if (CUR !== 'map' && CUR !== 'layers') CUR = 'map';
    render(1);
    if (MAP) mapPaint();
    return true;
  }

  var pk = e.target.closest('[data-pop]');
  if (pk){ POP_OPEN = pk.getAttribute('data-pop') === '1'; render(); return true; }
  var bst = e.target.closest('[data-bst]');
  if (bst){
    var pr = bst.getAttribute('data-bst').split('|');
    var bi = document.getElementById('bfTxt');
    POP_JUST = Date.now(); briefSet(pr[0], pr[1], bi ? bi.value : null); return true;
  }
  var bfs = e.target.closest('[data-bfsave]');
  if (bfs){
    var bi2 = document.getElementById('bfTxt');
    POP_JUST = Date.now(); briefSet(bfs.getAttribute('data-bfsave'), '', bi2 ? bi2.value : ''); return true;
  }

  /* ═══ كلُّ لوحٍ يُغلَق بنقرةٍ خارجه ═══
     كانت نافذةُ النقطة وحدَها تُغلَق بالنقر خارجها، وسائرُ اللوحات — منتقي
     التصفية والمساعدُ والطابورُ والمساعدةُ والتصديرُ ولوحُ الإسناد ومنتقي
     الشركات — لا تُغلَق إلا بعلامة X. وعلامةُ X في زاويةِ لوحٍ على هاتفٍ
     بيدٍ واحدةٍ إجبارٌ على تصويبٍ لا يلزم: اليدُ تنقر حيث تشاء والمنطقُ
     يفهم. فوُحِّد السلوك: لكلِّ لوحٍ رايتُه ومعرِّفُه وزرُّ فتحه، والنقرةُ
     خارجَ الثلاثة تُغلقه. وأوّلُ ما يُغلَق ما فُتح آخرًا — فلا يُغلَق
     الأسفلُ ويبقى الأعلى. */
  var SHEETS = [
    { on:function(){ return POP_OPEN; },       off:function(){ POP_OPEN = false; },       sel:'#pkPop',           btn:'[data-pop]' },
    { on:function(){ return ASSIST_OPEN; },    off:function(){ ASSIST_OPEN = false; },    sel:'#assistPop',       btn:'[data-assist]' },
    { on:function(){ return QUEUE_OPEN; },     off:function(){ QUEUE_OPEN = false; },     sel:'#queuePop',        btn:'[data-pq]' },
    { on:function(){ return HELP_OPEN; },      off:function(){ HELP_OPEN = false; },      sel:'#helpPop',         btn:'[data-help]' },
    { on:function(){ return EXP_OPEN; },       off:function(){ EXP_OPEN = false; },       sel:'#expPop',          btn:'[data-exp]' },
    { on:function(){ return ASN_PICK; },       off:function(){ ASN_PICK = false; },       sel:'#asnPick',         btn:'[data-apick]' },
    { on:function(){ return ASN_OPEN; },       off:function(){ ASN_OPEN = false; },       sel:'#asnPop',          btn:'[data-asn]' },
    { on:function(){ return CO_OPEN; },        off:function(){ CO_OPEN = false; },        sel:'#coFilt',          btn:'[data-co],[data-cofilt],[data-comode]' },
    { on:function(){ return MAP_FILT_OPEN; },  off:function(){ MAP_FILT_OPEN = false; },  sel:'.map-sheet',       btn:'[data-mfilt]' }
  ];
  /* الحدثُ الذي فتح النافذةَ لا يُغلقها — بهويته، مهما استغرق الرسمُ */
  var justOpened = (POP_EV && POP_EV === e) || (Date.now() - POP_JUST <= 300);
  if (POP_EV && POP_EV !== e) POP_EV = null;
  if (!justOpened){
    for (var si = 0; si < SHEETS.length; si++){
      var sh = SHEETS[si];
      if (!sh.on()) continue;
      if (e.target.closest(sh.sel)) break;          /* النقرُ داخله شأنُه */
      if (sh.btn && e.target.closest(sh.btn)) break; /* وزرُّه يتولّاه بنفسه */
      sh.off(); render(); return true;
    }
  }
  return CLICK_NEXT;
}
/* clickA — الجزء 2 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: print، sel، boxcopy، briefcopy، svlist، svpopclose، svpopxls، expscope، expselgo، mfuexp، chaltask، wpwk، wpdo، wpact، wpcancel، wpedit، wpsave، wpdel، wpnext، wptask */
function clickAPart2(e){
    if (CUR === 'map' && e.target.closest('.mapcanvas')){ POP_OPEN = true; render(); return true; }

  if (e.target.closest('[data-print]')){ try{ window.print(); }catch (err){ LS_ERR = err; } return true; }

  var b = e.target.closest('.btn, .chip');
  if (b && !b.closest('#nav') && !b.hasAttribute('href')){
    /* كانت هذه قائمةً مكتوبةً بيدٍ من مئةٍ وعشر خصائص، وكلُّ زرٍّ جديدٍ يحتاج
       إضافةً إليها. ومن نسي — ونُسيت مرتين: منتقي الشركات وحالةُ الوصول —
       صار زرُّه يُنقَر فيبتلعه هذا الحارسُ نفسُه ولا يقع شيء.
       فصارت تُشتقُّ من نصِّ المستمع: من ربط معالجًا فقد سجّل خاصيتَه. */
    var acts = actList();
    var wired = !acts || acts.some(function(a){ return b.hasAttribute(a); });
    if (!wired){
      if (b.classList.contains('chip') && !b.closest('.map-top')){
        b.classList.toggle('on');   /* الشرائح اختيارٌ فعلي لا رسالة */
        return true;
      }
      toast(b.textContent.trim());
      return true;
    }
  }

  var sc = e.target.closest('[data-sel]');
  if (sc){
    var sid = sc.getAttribute('data-sel');
    if (!asnOf(sid)) selToggle(sid);
    render(1);
    return true;
  }
  if (e.target.closest('[data-boxcopy]')){ boxCopy(); return true; }
  if (e.target.closest('[data-briefcopy]')){ try { navigator.clipboard.writeText(mfuBriefText()); toast(t('نُسخ الملخّص')); } catch (er){ toast(t('تعذّر النسخ')); } return true; }   /* (V29.9) */
  var svl = e.target.closest('[data-svlist]');   /* (V29.6) */
  if (svl){ SV_POP = svl.getAttribute('data-svlist'); SV_PHO = ''; SV_VIEW = 'dash';   /* (V37.14) طلبُ المالك «الويندو بطيئة»: تُدرَج النافذةُ وحدَها بلا رسم الصفحة */
    var hostL = svl.closest('#content') || document.getElementById('content');
    if (hostL){ svPopRemove(); var tmpL = document.createElement('div'); tmpL.innerHTML = (svListPop() + supPopHtml()); while (tmpL.firstChild) hostL.appendChild(tmpL.firstChild); } else render(1);
    return true; }
  if (e.target.closest('[data-svpopclose]')){ SV_PHO = ''; SV_POP = ''; svPopRemove(); return true; }   /* (V37.14) بلا رسم */
  var phd = e.target.closest('[data-phdel]');   /* (V37.17) حذفُ صورةٍ مرفوعة: تختفي من التطبيق والتقارير ويبقى ملفُّها على الدرايف */
  if (phd){ var pid1 = phd.getAttribute('data-phdel'), pp = (STATE.photos || {})[pid1];
    if (pp && window.confirm(t('حذف هذه الصورة؟ تختفي من التطبيق والتقارير عند الجميع، ويبقى ملفُّها على الدرايف.'))){
      var dv = { by:STATE.meta.name || '', at:Date.now(), why:t('رُفعت خطأً') }; pp.del = dv; CORE.set('photos', pid1, { del:dv }); logEvent('حذفُ صورة — ' + (pp.site || '') + ' \u00b7 ' + (pp.kind || ''), pp.site || ''); statBump(); toast(t('حُذفت الصورة'));
      var bx1 = document.getElementById('svPhoBox'); if (bx1 && SV_PHO){ var host1 = bx1.parentNode; ['svPhoVeil', 'svPhoBox'].forEach(function(i0){ var e0 = document.getElementById(i0); if (e0) e0.remove(); }); var tm1 = document.createElement('div'); tm1.innerHTML = svPhoPanel(SV_PHO); while (tm1.firstChild) host1.appendChild(tm1.firstChild); } else render(1); }
    return true; }
  var phc = e.target.closest('[data-phclear]');   /* (V37.16) طلبُ المالك: حذفُ صورةٍ التُقطت خطأً قبل الحفظ */
  if (phc){ var pk = phc.getAttribute('data-phclear'); if (FORM && FORM.photos && FORM.photos[pk]){ delete FORM.photos[pk]; if (typeof SVD === 'object') SVD.dirty = true; if (typeof svDraftSave === 'function') svDraftSave(); toast(t('حُذفت الصورة — اختر غيرها')); render(1); } return true; }
  var svv = e.target.closest('[data-svview]');   /* (V37.16) اللوحة أو القائمة — في مكانها */
  if (svv){ SV_VIEW = svv.getAttribute('data-svview') === 'list' ? 'list' : 'dash'; var hostV = svv.closest('#content') || document.getElementById('content');
    if (hostV){ svPopRemove(); var tmpV = document.createElement('div'); tmpV.innerHTML = svListPop(); while (tmpV.firstChild) hostV.appendChild(tmpV.firstChild); } else render(1); return true; }
  var svx = e.target.closest('[data-svpopxls]'); if (svx){ svListXlsx(svx.getAttribute('data-svpopxls')); return true; }
  var exs = e.target.closest('[data-expscope]');   /* (V29.0) */
  if (exs){ EXP.scope.m = exs.getAttribute('data-expscope'); render(1); return true; }
  if (e.target.closest('[data-expselgo]')){ goPage('map'); MAP_SELECT = true; render(1); toast(t('اضغط النقاطَ لتحديدها ثم ارجع إلى التصدير')); return true; }
  if (e.target.closest('[data-mfuexp]')){ var ids0 = expScopeIds(); if (ids0 && !ids0.length){ toast(t('النطاقُ بلا نقاط — اختر مشعرًا أو حدِّد نقاطًا')); return true; }
    var fx = e.target.closest('[data-mfuexp]').getAttribute('data-mfuexp'); if (fx === 'xlsx') mfuXlsx(); else if (fx === 'pdf') mfuPdf(); else if (fx === 'pptx') mfuPptx(); else mfuDocx(); return true; }
  if (e.target.closest('[data-chaltask]')){
    var ck = e.target.closest('[data-chaltask]').getAttribute('data-chaltask'), cc = mfuAllChal().filter(function(x){ return x.key === ck; })[0];
    if (!cc) return true;
    var due = (cc.due && /^\d{4}-\d{2}-\d{2}$/.test(cc.due)) ? cc.due : dayKey(Date.now() + 7 * 864e5);   /* (V26.6) آخرُ تاريخٍ للمعالجة إن حُدِّد */
    if (wtAdd({ n:'معالجة: ' + t(cc.t), who:cc.owner || '', track:'التحديات', due:due, chal:ck, d:cc.desc || '', upd:cc.m || '' })){
      var tid = STATE.wtask.lastId;
      if (cc.src === 'field'){ var cf2 = Object.assign({}, (mfuData().fch || {})[cc.t] || {}); cf2.task = tid; cf2.at = Date.now(); cf2.hist = mfuHist(cf2, 'task', '#' + tid); mfuPut('fch', cc.t, cf2); }
      else if (cc.src === 'manual'){ var mc2 = mfuList('chal').filter(function(x){ return x.id === cc.id; })[0]; if (mc2){ var mn2 = Object.assign({}, mc2); delete mn2.id; mn2.task = tid; mn2.hist = mfuHist(mc2, 'task', '#' + tid); mfuPut('chal', cc.id, mn2); } }
      toast(t('أُنشئت مهمةُ المعالجة في المهام الأسبوعية')); render(1);
    }
    return true;
  }
  if (e.target.closest('[data-wpwk]')){ WPLAN_WK = e.target.closest('[data-wpwk]').getAttribute('data-wpwk'); WPLAN_EDIT = ''; WPLAN_ACT = null; WPLAN_PREFILL = null; render(1); return true; }
  if (e.target.closest('[data-wpdo]')){ var dp = e.target.closest('[data-wpdo]').getAttribute('data-wpdo').split('|'); WPLAN_ACT = { id:dp[0], kind:dp[1] }; render(1); setTimeout(function(){ var ta = document.getElementById('wpAct'); if (ta){ try { ta.focus(); } catch (e2){ LS_ERR = e2; } } }, 30); return true; }
  if (e.target.closest('[data-wpact]')){
    var ap = e.target.closest('[data-wpact]').getAttribute('data-wpact').split('|');
    if (ap[1] === 'cancel'){ WPLAN_ACT = null; render(1); return true; }
    var ax = pmoList('wplan').filter(function(x){ return x.id === ap[0]; })[0]; if (!ax || !wplanMay()) return true;
    var txt = pmoVal('wpAct'); if (!txt){ toast(t(ap[1] === 'result' ? 'اكتب النتيجة الفعلية' : ap[1] === 'upd' ? 'اكتب التحديث' : 'اكتب سبب الإغلاق')); return true; }
    var an = Object.assign({}, ax); delete an.id; an.at = Date.now();
    if (ap[1] === 'result'){ an.result = txt; an.st = 'تم'; an.hist = mfuHist(ax, 'result', txt); }
    else if (ap[1] === 'upd'){ an.st = 'بانتظار تجارب'; an.hist = mfuHist(ax, 'upd', txt); }
    else { an.closeWhy = txt; an.st = 'مغلق'; an.hist = mfuHist(ax, 'close', txt); var mk = document.getElementById('wpActNew'); if (mk && mk.checked){ WPLAN_PREFILL = { t:'', pri:ax.pri || 'متوسطة', n:t('بدلًا من') + ': ' + (ax.t || ''), steps:'', needs:ax.needs || '', goal:ax.goal || '' }; WPLAN_WK = mfuWeekKey(); } }
    WPLAN_ACT = null;
    if (pmoPut('wplan', ap[0], an)){ toast(t(ap[1] === 'result' ? 'تمّت بنتيجتها' : ap[1] === 'upd' ? 'سُجّل التحديث — بانتظار تجارب أخرى' : 'أُغلقت')); render(1); if (WPLAN_PREFILL) setTimeout(function(){ var el = document.getElementById('wpT'); if (el && el.scrollIntoView) el.scrollIntoView({ block:'center' }); }, 30); }
    return true;
  }
  if (e.target.closest('[data-wpcancel]')){ WPLAN_EDIT = ''; WPLAN_PREFILL = null; render(1); return true; }
  if (e.target.closest('[data-wpedit]')){ WPLAN_EDIT = e.target.closest('[data-wpedit]').getAttribute('data-wpedit'); render(1); setTimeout(function(){ var el = document.getElementById('wpT'); if (el && el.scrollIntoView) el.scrollIntoView({ block:'center' }); }, 30); return true; }
  if (e.target.closest('[data-wpsave]')){
    if (!wplanMay()) return true;
    var wt0 = pmoVal('wpT'); if (!wt0){ toast(t('اكتب عنوان النقطة')); return true; }
    var wid = e.target.closest('[data-wpsave]').getAttribute('data-wpsave') || ('P' + Date.now().toString(36));
    var prev = pmoList('wplan').filter(function(x){ return x.id === wid; })[0] || {};
    var item = Object.assign({}, prev, { wk:prev.wk || wplanWeek(), t:wt0, pri:pmoVal('wpP') || 'متوسطة', n:pmoVal('wpN'), steps:pmoVal('wpS'), needs:pmoVal('wpR'), goal:pmoVal('wpG'), st:prev.st || 'مخطط', at:prev.at || Date.now(), by:STATE.meta.name || '', hist:mfuHist(prev, prev.id ? 'edit' : 'new', wt0.slice(0, 60)) });
    delete item.id; if (wplanLines(item.steps).length !== wplanLines(prev.steps).length) item.sdone = [];
    if (pmoPut('wplan', wid, item)){ WPLAN_EDIT = ''; WPLAN_PREFILL = null; toast(t(prev.id ? 'حُفظ التعديل' : 'أُضيفت إلى الخطة')); render(1); }
    return true;
  }
  if (e.target.closest('[data-wpdel]')){ var did = e.target.closest('[data-wpdel]').getAttribute('data-wpdel'); if (pmoPut('wplan', did, { gone:true, at:Date.now() })){ toast(t('حُذف')); render(1); } return true; }
  if (e.target.closest('[data-wpnext]')){
    var nid = e.target.closest('[data-wpnext]').getAttribute('data-wpnext'), nx0 = pmoList('wplan').filter(function(x){ return x.id === nid; })[0];
    if (nx0){ var ni = Object.assign({}, nx0); delete ni.id; ni.wk = wplanNextWeek(nx0.wk); ni.st = 'مخطط'; ni.hist = mfuHist(nx0, 'next', ni.wk); if (pmoPut('wplan', nid, ni)){ toast(t('رُحّلت إلى') + ' ' + ni.wk); render(1); } }
    return true;
  }
  if (e.target.closest('[data-wptask]')){
    var pid = e.target.closest('[data-wptask]').getAttribute('data-wptask'), px = pmoList('wplan').filter(function(x){ return x.id === pid; })[0];
    if (!px) return true;
    if (wtAdd({ n:px.t, track:'خطة الأسبوع', due:dayKey(Date.now() + 7 * 864e5), plan:'P:' + pid, upd:px.goal || '' })){
      var pn = Object.assign({}, px); delete pn.id; pn.task = STATE.wtask.lastId; pn.st = pn.st === 'مخطط' ? 'جارٍ' : pn.st; pn.hist = mfuHist(px, 'task', '#' + pn.task);
      pmoPut('wplan', pid, pn); toast(t('أُنشئت المهمةُ الأسبوعية')); render(1);
    }
    return true;
  }
  return CLICK_NEXT;
}
/* clickA — الجزء 3 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: reqtask، svq، svqx، svqk، svqdelask، svqdelx، svqdel، svqqx، svqcancel، svqch، svqsave، sqall، mfupadd، mfuprm، mfupren، mfuprn، mfuprst، chupd، chupdtxt، chupdx، chupdgo، chalpop، chalpopx، mfz، mft، mfuedit، mfucosall، wdyser، wdypg، wdyreset، mfuchal، mfureq، mfudel، iosnudge، idbretry، simapply، simot، geojson */
function clickAPart3(e){
    if (e.target.closest('[data-reqtask]')){
    var rq = mfuList('req').filter(function(x){ return x.id === e.target.closest('[data-reqtask]').getAttribute('data-reqtask'); })[0];
    if (!rq) return true;
    if (wtAdd({ n:'طلب الوزارة: ' + String(rq.t || '').slice(0, 80), track:'طلبات الوزارة', due:dayKey(Date.now() + 7 * 864e5), req:'R:' + rq.id, upd:rq.s || '' })){
      var tid2 = STATE.wtask.lastId, rn = Object.assign({}, rq); delete rn.id; rn.task = tid2; rn.st = rn.st === 'جديد' ? 'قيد التنفيذ' : rn.st; rn.at = Date.now(); rn.hist = mfuHist(rq, 'task', '#' + tid2);
      mfuPut('req', rq.id, rn); toast(t('أُنشئت مهمةُ التنفيذ في المهام الأسبوعية')); render(1);
    }
    return true;
  }
  if (e.target && e.target.id === 'svqSheet'){ SVQ = { id:'', key:'', tmp:null }; render(1); return true; }   /* لمسُ الخلفية يغلق (V22.7) */
  if (e.target.closest('[data-svq]')){ SVQ = { id:e.target.closest('[data-svq]').getAttribute('data-svq'), key:'', tmp:null }; POP_OPEN = false;
    try { if (window.history && history.pushState) history.pushState({ svq:1 }, ''); } catch (e3){ LS_ERR = e3; }   /* زرُّ الرجوع في الجهاز يغلق اللوح لا التطبيق */
    render(1); return true; }   /* (V22.3) */
  if (e.target.closest('[data-svqx]')){ SVQ = { id:'', key:'', tmp:null }; render(1); return true; }
  if (e.target.closest('[data-svqk]')){ SVQ.key = e.target.closest('[data-svqk]').getAttribute('data-svqk'); SVQ.tmp = null; render(1); setTimeout(function(){ var el = document.getElementById('svqIn'); if (el){ try { el.focus(); } catch (e2){ LS_ERR = e2; } } }, 30); return true; }
  if (e.target.closest('[data-svqdelask]')){ SVQ.delAsk = e.target.closest('[data-svqdelask]').getAttribute('data-svqdelask'); render(1); return true; }   /* (V22.8) */
  if (e.target.closest('[data-svqdelx]')){ SVQ.delAsk = ''; render(1); return true; }
  if (e.target.closest('[data-svqdel]')){ if (svqPhotoDel(e.target.closest('[data-svqdel]').getAttribute('data-svqdel'))) render(1); return true; }
  if (e.target.closest('[data-svqqx]')){ var qi = +e.target.closest('[data-svqqx]').getAttribute('data-svqqx'), qx = PHOTO_Q[qi];
    if (qx && qx.site === SVQ.id){ PHOTO_Q.splice(qi, 1); CORE.saveSoon(); var rq2 = STATE.recs[SVQ.id]; if (rq2){ var n2 = Object.assign({}, rq2); n2.phN = svqPhotoCount(SVQ.id); CORE.set('recs', SVQ.id, n2); } logEvent('إلغاءُ صورةٍ من طابور الجهاز — ' + SVQ.id, SVQ.id); toast(t('أُلغيت الصورة')); render(1); }
    return true; }
  if (e.target.closest('[data-svqcancel]')){ SVQ.key = ''; SVQ.tmp = null; render(1); return true; }
  if (e.target.closest('[data-svqch]')){ var ch = e.target.closest('[data-svqch]').getAttribute('data-svqch'); rq = STATE.recs[SVQ.id] || {}; var cur0 = SVQ.tmp || (rq.chals || []).slice();
    if (cur0.indexOf(ch) > -1) cur0 = cur0.filter(function(x){ return x !== ch; }); else { if (ch === 'لا توجد تحديات') cur0 = []; else cur0 = cur0.filter(function(x){ return x !== 'لا توجد تحديات'; }); cur0.push(ch); }
    SVQ.tmp = cur0; render(1); return true; }
  if (e.target.closest('[data-svqsave]')){ var sk = SVQ.key, sv0 = sk === 'chals' ? (SVQ.tmp || (STATE.recs[SVQ.id] || {}).chals || []) : ((document.getElementById('svqIn') || {}).value); if (svqSave(SVQ.id, sk, sv0)){ render(1); if (typeof MAP !== 'undefined' && MAP) mapPaint(); } return true; }
  if (e.target.closest('[data-sqall]')){ FILT.zone = FILT.type = FILT.work = FILT.life = FILT.route = FILT.floor = ''; if (typeof CO_SEL !== 'undefined' && CO_SEL.length) CO_SEL.length = 0; LIST_SHOWN = LIST_PAGE; render(1); if (CUR === 'map' && MAP) mapPaint(); return true; }   /* (V22.1) البحثُ في الكل: تُرفَع التصفيةُ وتبقى الكلمة */
  if (e.target.closest('[data-mfupadd]')){ var npi = document.getElementById('mfuNewParty'), npv = npi ? String(npi.value || '').trim().slice(0, 40) : ''; if (!npv){ toast(t('اكتب اسمَ الجهة')); return true; } if (mfuParties().indexOf(npv) > -1){ toast(t('الجهةُ موجودة')); return true; } if (mfuPut('party', npv, { t:npv, at:Date.now() }) !== false){ logEvent('إضافةُ جهةٍ معالجة — ' + npv); toast(t('أُضيفت الجهة')); } render(1); return true; }   /* (V26.6) */
  var mpr = e.target.closest('[data-mfuprm]');
  if (mpr){ var rpn = mpr.getAttribute('data-mfuprm'), PL = mfuParties(); if (PL.length <= 1){ toast(t('لا بدّ من جهةٍ واحدةٍ على الأقل')); return true; }
    var fb = PL.filter(function(k){ return k !== rpn; })[0], ownM = mfuData().own || {};
    Object.keys(ownM).forEach(function(c){ if (ownM[c] === rpn) mfuPut('own', c, (MFU.ownDef[c] && MFU.ownDef[c] !== rpn && PL.indexOf(MFU.ownDef[c]) > -1) ? MFU.ownDef[c] : fb); });
    mfuPut('party', rpn, Object.assign({}, mfuPartyRaw(rpn) || {}, { gone:true, at:Date.now() })); logEvent('حذفُ جهةٍ معالجة — ' + mfuPartyLabel(rpn)); render(1); return true; }   /* (V26.8) الأصليةُ تُحذَف أيضًا — لا آخرُ جهة */
  var mpe = e.target.closest('[data-mfupren]');
  if (mpe){ MFU.prn = mpe.getAttribute('data-mfupren'); render(1); var pi = document.querySelector('[data-mfuprn]'); if (pi){ pi.focus(); pi.select(); } return true; }
  if (e.target.closest('[data-mfuprst]')){ MFU.parties.forEach(function(k){ var r = mfuPartyRaw(k); if (r && (r.gone || r.t)) mfuPut('party', k, { at:Date.now() }); }); logEvent('استرجاعُ جهات المعالجة الأصلية'); toast(t('عادت الجهاتُ الأصلية')); render(1); return true; }
  var cu = e.target.closest('[data-chupd]');   /* (V27.0) تحديثٌ على التحدي */
  if (cu){ CHUP_OPEN = cu.getAttribute('data-chupd'); render(1); var ta = document.querySelector('[data-chupdtxt]'); if (ta) ta.focus(); return true; }
  if (e.target.closest('[data-chupdx]')){ CHUP_OPEN = ''; render(1); return true; }
  var cg = e.target.closest('[data-chupdgo]');
  if (cg){ var ck2 = cg.getAttribute('data-chupdgo'), ta2 = document.querySelector('[data-chupdtxt="' + ck2.replace(/"/g, '\\"') + '"]'), nt2 = ta2 ? ta2.value : '';
    if (!String(nt2 || '').trim()){ toast(t('اكتب ما حدث')); return true; }
    if (chalUpd(ck2, nt2, (CUR === 'mfu') ? 'office' : 'field')){ CHUP_OPEN = ''; toast(t('سُجّل التحديث')); render(1); } return true; }
  var cpo = e.target.closest('[data-chalpop]');   /* (V26.9) نافذةُ نقاط التحدي */
  if (cpo){ CHAL_POP = cpo.getAttribute('data-chalpop') || ''; chalPopSync(); return true; }
  if (e.target.closest('[data-chalpopx]')){ CHAL_POP = ''; chalPopSync(); return true; }
  var mfz = e.target.closest('[data-mfz]'), mft = e.target.closest('[data-mft]');   /* (V26.5) */
  if (mfz){ MFU.flt.z = mfz.getAttribute('data-mfz') || ''; MFU.flt.t = ''; render(1); return true; }
  if (mft){ MFU.flt.t = mft.getAttribute('data-mft') || ''; render(1); return true; }
  if (e.target.closest('[data-mfuedit]')){ MFU.edit = e.target.closest('[data-mfuedit]').getAttribute('data-mfuedit') || ''; render(1); return true; }
  if (e.target.closest('[data-mfucosall]')){ MFU.cosAll = !MFU.cosAll; render(1); return true; }
  /* (V24.0) ملخص العمل اليومي: كلُّ عملٍ يُخفى ويُظهَر بضغطةٍ على اسمه، والصفحات، ورفعُ المرشّحات */
  if (e.target.closest('[data-wdyser]')){ var wdyK = e.target.closest('[data-wdyser]').getAttribute('data-wdyser'); WDY.off[wdyK] = !WDY.off[wdyK]; render(1); return true; }
  if (e.target.closest('[data-wdypg]')){ var wdyPg = e.target.closest('[data-wdypg]').getAttribute('data-wdypg'); WDY.pg = wdyPg === 'p' ? WDY.pg - 1 : wdyPg === 'n' ? WDY.pg + 1 : (+wdyPg || 1); render(1); return true; }
  if (e.target.closest('[data-wdyreset]')){ WDY.mon = ''; WDY.day = ''; WDY.h1 = 0; WDY.h2 = 24; WDY.pg = 1; render(1); return true; }
  if (e.target.closest('[data-mfuchal]')){
    var mt = pmoVal('mcT'); if (!mt){ toast(t('اكتب التحدي')); return true; }
    if (mfuPut('chal', 'C' + Date.now().toString(36), { t:mt, m:pmoVal('mcM'), o:pmoVal('mcO'), r:pmoVal('mcR'), st:'مفتوح', at:Date.now(), by:STATE.meta.name || '', hist:mfuHist(null, 'new', '') })){ logEvent('تحدٍّ جديد — ' + mt.slice(0, 40), ''); toast(t('سُجّل التحدي — تجده أعلى القائمة')); render(1); }
    return true;
  }
  if (e.target.closest('[data-mfureq]')){
    var rt = pmoVal('mrT'); if (!rt){ toast(t('اكتب الطلب')); return true; }
    if (mfuPut('req', 'Q' + Date.now().toString(36), { t:rt, u:pmoVal('mrU'), s:pmoVal('mrS'), st:'جديد', at:Date.now(), by:STATE.meta.name || '', hist:mfuHist(null, 'new', '') })){ logEvent('طلبُ الوزارة — ' + rt.slice(0, 40), ''); toast(t('سُجّل الطلب — تجده أعلى القائمة')); render(1); }
    return true;
  }
  if (e.target.closest('[data-mfudel]')){
    var md = e.target.closest('[data-mfudel]').getAttribute('data-mfudel').split('|');
    if (mfuPut(md[0], md[1], { gone:true, at:Date.now() })){ toast(t('حُذف')); render(1); }
    return true;
  }
  if (e.target.closest('[data-iosnudge]')){
    var inv = e.target.closest('[data-iosnudge]').getAttribute('data-iosnudge');
    if (inv === 'install' && INSTALL_EVT){
      var ev = INSTALL_EVT; INSTALL_EVT = null; lsSet('nsk14.iosNudge', String(Date.now() + 864e5));
      try { ev.prompt(); if (ev.userChoice && ev.userChoice.then) ev.userChoice.then(function(r){ if (r && r.outcome === 'accepted') lsSet('nsk14.iosNudge', String(Date.now() + 30 * 864e5)); }); } catch (e2){ LS_ERR = e2; }
      render(1); return true;
    }
    lsSet('nsk14.iosNudge', String(Date.now() + (inv === 'done' ? 30 : 1) * 864e5)); render(1); return true;
  }
  if (e.target.closest('[data-idbretry]')){ toast(t('يُعاد فتحُ المخزن…')); idbRetryNow().then(function(){ toast(t(IDB_BAD ? 'ما زال لا يعمل — العملُ يُرفَع تلقائيًّا، فلا تغلق التطبيق' : 'عاد الحفظُ المحلي')); }); return true; }
  if (e.target.closest('[data-simapply]')){
    if (!may('settings')) { toast(t('الضبطُ للمدير')); return true; }
    var M = simState(), zs = zonesLive(), n0 = 0;
    Object.keys(M.w).forEach(function(k){ zs.forEach(function(z){ cfgSet('w', z + '|' + k, +M.w[k] || 0); n0++; }); });
    if (+M.target > 0) cfgSet('tgtSurvey', null, +M.target);
    logEvent('اعتُمدت الأوزانُ من المحاكي — ' + Object.keys(M.w).map(function(k){ return k + ' ' + M.w[k]; }).join(' · ') + ' · التارجت ' + nm(+M.target));
    toast(t('اعتُمدت الأوزانُ والتارجت — يُعاد حسابُ المستحقّ')); render(1); return true;
  }
  if (e.target.closest('[data-simot]')){
    if (!may('settings')) { toast(t('الضبطُ للمدير')); return true; }
    cfgSet('otRate', null, 1); logEvent('أُلغي معاملُ الإضافي — يُحتسب كلُّ شيءٍ بالسعر نفسه'); toast(t('أُلغي الإضافي — المعامل ١')); render(1); return true;
  }
  if (e.target.closest('[data-geojson]')){ geoJsonExport(); return true; }
  return CLICK_NEXT;
}
/* clickA — الجزء 4 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: lessonadd، retroadd، stakeadd، pmoedit، pmoedcancel، pmodel، basemapdl، basemaprm، scan، scanx، sun، budalert، pilot، kkview، pmz، site، wtmeet، wbsxl، minopen، minst، minok، minnote، minback، minre، stkopen، stkf، stkopenback، stknote، stkback، stkok، stkreopen */
function clickAPart4(e){
  var sid, pid, px;   /* تُكتب هنا قبل أن تُقرأ */
    if (e.target.closest('[data-lessonadd]')){
    var lt = pmoVal('lsT'); if (!lt){ toast(t('اكتب عنوان الدرس')); return true; }
    var lid = pmoEdId('lessons', 'L' + Date.now().toString(36)), led = PMO_ED.sec === 'lessons'; PMO_ED = { sec:'', id:'' };
    if (pmoPut('lessons', lid, { t:lt, d:pmoVal('lsD'), w:pmoVal('lsW'), c:pmoVal('lsC'), a:pmoVal('lsA'), o:pmoVal('lsO'), at:Date.now(), by:STATE.meta.name || '' })){ toast(t(led ? 'حُفظ التعديل' : 'سُجّل الدرس')); render(1); }
    return true;
  }
  if (e.target.closest('[data-retroadd]')){
    var rp = pmoVal('rtP'); if (!rp){ toast(t('اكتب الفترة')); return true; }
    var rid = pmoEdId('retros', 'R' + Date.now().toString(36)), red = PMO_ED.sec === 'retros'; PMO_ED = { sec:'', id:'' };
    if (pmoPut('retros', rid, { p:rp, g:pmoVal('rtG'), i:pmoVal('rtI'), a:pmoVal('rtA'), at:Date.now(), by:STATE.meta.name || '' })){ toast(t(red ? 'حُفظ التعديل' : 'سُجّلت المراجعة')); render(1); }
    return true;
  }
  if (e.target.closest('[data-stakeadd]')){
    var sn = pmoVal('shN'); if (!sn){ toast(t('اكتب الجهة أو الشخص')); return true; }
    var sid0 = pmoEdId('stake', 'S' + Date.now().toString(36)), sed = PMO_ED.sec === 'stake'; PMO_ED = { sec:'', id:'' };
    if (pmoPut('stake', sid0, { n:sn, r:pmoVal('shR'), inf:+pmoVal('shI') || 2, int:+pmoVal('shT') || 2, cur:pmoVal('shC'), want:pmoVal('shD'), s:pmoVal('shS'), o:pmoVal('shO'), at:Date.now(), by:STATE.meta.name || '' })){ toast(t(sed ? 'حُفظ التعديل' : 'أُضيف')); render(1); }
    return true;
  }
  var pme = e.target.closest('[data-pmoedit]');
  if (pme){ var pe = pme.getAttribute('data-pmoedit').split('|'); PMO_ED = { sec:pe[0], id:pe[1] }; render(1); pmoEdFill(); toast(t('عدّل ثم اضغط «احفظ التعديل»')); return true; }   /* (V28.2) */
  if (e.target.closest('[data-pmoedcancel]')){ PMO_ED = { sec:'', id:'' }; render(1); return true; }
  if (e.target.closest('[data-pmodel]')){
    var pd = e.target.closest('[data-pmodel]').getAttribute('data-pmodel').split('|');
    if (pmoPut(pd[0], pd[1], { gone:true, at:Date.now() })){ toast(t('حُذف')); render(1); }
    return true;
  }
  if (e.target.closest('[data-basemapdl]')){ basemapDownload(); return true; }
  if (e.target.closest('[data-basemaprm]')){ basemapRemove(); return true; }
  if (e.target.closest('[data-scan]')){ scanOpen(e.target.closest('[data-scan]').getAttribute('data-scan')); return true; }
  if (e.target.closest('[data-scanx]')){ scanClose(); return true; }
  /* (V21.8) :not(html) — وضعُ الشمس يضع data-sun على <html> نفسِه، فكانت أيُّ لمسةٍ لم يلتقطها
     معالجٌ قبله (على الخريطة مثلًا) تجد «[data-sun]» في أعلى الشجرة فتطفئه وحدَها */
  if (e.target.closest('[data-sun]:not(html)')){ sunSet(!SUN_ON); themeIcon(); toast(t(SUN_ON ? 'وضعُ الشمس: يعمل' : 'وضعُ الشمس: أُطفئ')); return true; }
  if (e.target.closest('[data-budalert]')){
    if (!may('users')) return true;
    cfgSet('budgetAlert', null, +e.target.closest('[data-budalert]').getAttribute('data-budalert') ? 1 : 0); render(1); return true;   /* cfgSet تدفع إلى settings/points بنفسها */
  }
  if (e.target.closest('[data-pilot]')){
    pid = e.target.closest('[data-pilot]').getAttribute('data-pilot'), px = siteFind(pid);
    if (!px || !may('users')) return true;
    siteOvSet(pid, { pilot: !px.pilot }); px.pilot = !px.pilot; logEvent((px.pilot ? 'صارت نقطةَ تجربة — ' : 'عادت نقطةً عادية — ') + pid); render(1); return true;
  }
  var kkv = e.target.closest('[data-kkview]');
  if (kkv){ KK_VIEW = kkv.getAttribute('data-kkview') === 'pts' ? 'pts' : 'sat'; render(1); return true; }
  var pmz = e.target.closest('[data-pmz]');
  if (pmz){ var k = pmz.getAttribute('data-pmz'); if (k === 'in') pmZoomAt(1.6); else if (k === 'out') pmZoomAt(1 / 1.6); else pmReset(); return true; }
  var li = e.target.closest('[data-site]');
  if (li && li.tagName === 'circle' && Date.now() - PM_CLICK_SKIP < 400) return true;   /* سحبٌ لا ضغطة */
  if (li && !SEL_MODE){ DETAIL_ID = li.getAttribute('data-site'); CUR = 'site'; render(); return true; }
  if (li && SEL_MODE){ lid = li.getAttribute('data-site');
                       if (!asnOf(lid)) selToggle(lid); render(1); return true; }

  /* محضرُ الاجتماع: ما بقي وما استُجدّ وما اكتمل — لا لوحةَ زياراتٍ ولا خطةً
     تفصيليةً ولا ملخّصًا تنفيذيًّا. من أرادها فلها أزرارُها (V17.18). */
  if (e.target.closest('[data-wtmeet]')){ toast(t('يُجهَّز محضرُ الاجتماع…')); expPdf(['wtmeet'].filter(expAllowed)); return true; }
  if (e.target.closest('[data-wbsxl]')){ wbsExcel(); return true; }
  /* اعتمادُ الوزارة */
  var mno = e.target.closest('[data-minopen]');
  if (mno){ MIN_OPEN = mno.getAttribute('data-minopen') || ''; render(1); return true; }
  var mns = e.target.closest('[data-minst]');
  if (mns){ MIN_ST = mns.getAttribute('data-minst') || 'pending'; MIN_OPEN = ''; render(1); return true; }
  var mok = e.target.closest('[data-minok]');
  if (mok){ var mid = mok.getAttribute('data-minok'), mEl = document.querySelector('[data-minnote="' + mid + '"]');
    if (minApprove(mid, mEl ? mEl.value : '')){ toast(t('اعتمدت الوزارةُ إعدادَ التركيب')); MIN_OPEN = ''; render(1); } return true; }
  var mbk = e.target.closest('[data-minback]');
  if (mbk){ var mid2 = mbk.getAttribute('data-minback'), mEl2 = document.querySelector('[data-minnote="' + mid2 + '"]');
    if (minReturn(mid2, mEl2 ? mEl2.value : '')){ toast(t('أُعيدت للمهندس بملاحظتكم')); MIN_OPEN = ''; render(1); } return true; }
  var mre = e.target.closest('[data-minre]');
  if (mre){ var mid3 = mre.getAttribute('data-minre'), mEl3 = document.querySelector('[data-minnote="' + mid3 + '"]');
    if (minResubmit(mid3, mEl3 ? mEl3.value : '')){ toast(t('رُفعت للوزارة ثانيةً')); MIN_OPEN = ''; render(1); } return true; }
  /* المتعذّر: فتحُ لوحة المراجعة، والقرار */
  var sko = e.target.closest('[data-stkopen]');
  if (sko){ STK_OPEN = sko.getAttribute('data-stkopen') || ''; render(1); return true; }
  var skf = e.target.closest('[data-stkf]');
  if (skf){ STK_F = skf.getAttribute('data-stkf') || ''; render(1); return true; }
  var skob = e.target.closest('[data-stkopenback]');
  if (skob){
    var oid = skob.getAttribute('data-stkopenback'), oEl = document.querySelector('[data-stknote="' + oid + '"]');
    if (svRevisit(oid, oEl ? oEl.value : '')){ toast(t('رُدّت — سيصل المشرفَ إشعارٌ بسببك')); STK_OPEN = ''; render(1); }
    return true;
  }
  var skb = e.target.closest('[data-stkback]');
  if (skb){
    sid = skb.getAttribute('data-stkback'); var nEl = document.querySelector('[data-stknote="' + sid + '"]');
    if (svRevisit(sid, nEl ? nEl.value : '')){ toast(t('رُدّت — سيصل المشرفَ إشعارٌ بسببك')); STK_OPEN = ''; render(1); }
    return true;
  }
  var skk = e.target.closest('[data-stkok]');
  if (skk){
    var sid2 = skk.getAttribute('data-stkok'), nEl2 = document.querySelector('[data-stknote="' + sid2 + '"]');
    if (stuckAccept(sid2, nEl2 ? nEl2.value : '')){ toast(t('قُبل التعذّرُ وسُجِّلت الحُجّة')); render(1); }
    return true;
  }
  var skr = e.target.closest('[data-stkreopen]');
  return CLICK_NEXT;
}
/* clickA — الجزء 5 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: stkreopen، wttab، wttrack، wtf، wtopen، wtclose، wtstat، wtnoteadd، wtsave2، wte2، wttools، wbsdos، dosclose، dossave، dositem، dosdel، dosfile، dosfdel، tour، tourclose، tourstop، tourprev، tournext، tourgo، phbulk، bugopen، bugclose، bugkind، bugsend، brief، briefall، trnew، trcost، trh، tritem، tridel، trdel، dqnoco، dqsplit، usrlog، … */
function clickAPart5(e){
  var a = e.target.closest('[data-p]');   /* بحثٌ صرف — يُعاد حسابُه */
  var skr = e.target.closest('[data-stkreopen]');   /* بحثٌ صرف — يُعاد حسابُه */
  var pr, sh, ni;   /* تُكتب هنا قبل أن تُقرأ */
    if (skr){ stuckReopen(skr.getAttribute('data-stkreopen')); toast(t('أُعيد فتحُه')); render(1); return true; }
  var wtb = e.target.closest('[data-wttab]');
  if (wtb){ WT_TAB = wtb.getAttribute('data-wttab'); render(1); return true; }
  var wtk = e.target.closest('[data-wttrack]');
  if (wtk){ WT_TRACK = wtk.getAttribute('data-wttrack'); render(1); return true; }
  var wtf = e.target.closest('[data-wtf]');
  if (wtf){ WT_F = wtf.getAttribute('data-wtf') || ''; render(1); return true; }
  var wto = e.target.closest('[data-wtopen]');
  if (wto){ WT_OPEN = wto.getAttribute('data-wtopen'); WT_NEW = false; render(1); return true; }
  if (e.target.closest('[data-wtclose]')){ WT_OPEN = ''; render(1); return true; }
  var wst = e.target.closest('[data-wtstat]');
  if (wst){ pr = wst.getAttribute('data-wtstat').split('|'); wtStatus(pr[0], pr[1]); return true; }
  var wna = e.target.closest('[data-wtnoteadd]');
  if (wna){ ni = document.getElementById('wtNote'); wtNote(wna.getAttribute('data-wtnoteadd'), ni ? ni.value : ''); return true; }
  var ws2 = e.target.closest('[data-wtsave2]');
  if (ws2){
    sh = ws2.closest('.wt-sheet'); var g3 = function(k){ var el = sh && sh.querySelector('[data-wte2="' + k + '"]'); return el ? el.value.trim() : ''; };
    if (!g3('n')){ toast(t('اسمُ المهمة مطلوب')); return true; }
    wtSet(ws2.getAttribute('data-wtsave2'), { n:g3('n'), who:g3('who'), due:g3('due'), track:g3('track'), d:g3('d'), wbs:g3('wbs') });
    toast(t('حُفظت المهمة')); return true;
  }
  if (e.target.closest('[data-wttools]')){ WT_TOOLS = !WT_TOOLS; render(1); return true; }
  var wdo = e.target.closest('[data-wbsdos]');
  if (wdo){ WBS_DOS = wdo.getAttribute('data-wbsdos'); render(1); return true; }
  if (e.target.closest('[data-dosclose]')){ WBS_DOS = ''; render(1); return true; }
  var dsv = e.target.closest('[data-dossave]');
  if (dsv){ dosSave(dsv.getAttribute('data-dossave')); return true; }
  var dit = e.target.closest('[data-dositem]');
  if (dit){ dosItemAdd(dit.getAttribute('data-dositem')); return true; }
  var ddl = e.target.closest('[data-dosdel]');
  if (ddl){ var p4 = ddl.getAttribute('data-dosdel').split('|'); dosItemDel(p4[0], +p4[1] || 0); return true; }
  var dfa = e.target.closest('[data-dosfile]');
  if (dfa){ dosFileAdd(dfa.getAttribute('data-dosfile')); return true; }
  var dfd = e.target.closest('[data-dosfdel]');
  if (dfd){ var p5 = dfd.getAttribute('data-dosfdel').split('|'); dosFileDel(p5[0], +p5[1] || 0); return true; }
  if (e.target.closest('[data-tour]')){ tourStart(); return true; }
  if (e.target.closest('[data-tourclose]')){ tourEnd(false); return true; }
  if (e.target.closest('[data-tourstop]')){ tourEnd(true); toast(t('لن تُعرَض ثانيةً — زرُّ 🎓 يفتحها متى شئت')); return true; }
  if (e.target.closest('[data-tourprev]')){ TOUR.i = Math.max(0, TOUR.i - 1); render(1); return true; }
  if (e.target.closest('[data-tournext]')){
    var TP = tourPages();
    if (TOUR.i >= TP.length - 1){ tourEnd(true); toast(t('تمّت الجولة — زرُّ 🎓 يفتحها متى شئت')); }
    else { TOUR.i++; render(1); }
    return true;
  }
  var tg = e.target.closest('[data-tourgo]');
  if (tg){ goPage(tg.getAttribute('data-tourgo')); render(1); return true; }
  if (e.target.closest('[data-phbulk]')){ phonesBulk(); return true; }
  if (e.target.closest('[data-bugopen]')){ BUG_OPEN = true; render(1); return true; }
  if (e.target.closest('[data-bugclose]')){ BUG_OPEN = false; render(1); return true; }
  var bk = e.target.closest('[data-bugkind]');
  if (bk){ BUG_KIND = bk.getAttribute('data-bugkind'); render(1); return true; }
  if (e.target.closest('[data-bugsend]')){ bugSend(); return true; }
  var brf = e.target.closest('[data-brief]');
  if (brf){ briefingSend(brf.getAttribute('data-brief')); return true; }
  if (e.target.closest('[data-briefall]')){ briefingCopyAll(); return true; }
  if (e.target.closest('[data-trnew]')){ trialAdd(); return true; }
  if (e.target.closest('[data-trcost]')){ trialToggleCost(); return true; }
  var trh = e.target.closest('[data-trh]');
  if (trh){ var pr2 = trh.getAttribute('data-trh').split('|'); trialHoursAdd(pr2[0], +pr2[1] || 0); return true; }
  var tri = e.target.closest('[data-tritem]');
  if (tri){ trialItemAdd(tri.getAttribute('data-tritem')); return true; }
  var trx = e.target.closest('[data-tridel]');
  if (trx){ var pr3 = trx.getAttribute('data-tridel').split('|'); trialItemDel(pr3[0], +pr3[1] || 0); return true; }
  var trd = e.target.closest('[data-trdel]');
  if (trd){ trialRemove(trd.getAttribute('data-trdel')); return true; }
  if (e.target.closest('[data-dqnoco]')){ dqMarkNoCo(); return true; }
  if (e.target.closest('[data-dqsplit]')){ dqSplitCo(); return true; }
  var ulg = e.target.closest('[data-usrlog]');
  if (ulg){ USR.log = ulg.getAttribute('data-usrlog'); if (evAll().length < 50) evFetch(false); render(1); return true; }
  if (e.target.closest('[data-ulclose]')){ USR.log = ''; render(1); return true; }
  var uls = e.target.closest('[data-ulsite]');
  if (uls){ USR.log = ''; DETAIL_ID = uls.getAttribute('data-ulsite'); goPage('site'); render(1); return true; }
  if (e.target.closest('[data-nspin]')){ goPage('map'); pinStart(); return true; }
  var vas = e.target.closest('[data-visitasn]');
  if (vas){ visitAsnOpen(vas.getAttribute('data-visitasn')); return true; }
  if (e.target.closest('[data-pincancel]')){ pinCancel(); return true; }
  if (e.target.closest('[data-pin]')){ pinStart(); return true; }
  if (e.target.closest('[data-tfd]')){ if (TFD.on) tfdCancel(); else tfdStart(); return true; }   /* (V28.0) */
  if (e.target.closest('[data-tfdsave]')){ tfdSave(); return true; }
  if (e.target.closest('[data-tfdundo]')){ tfdUndo(); return true; }
  if (e.target.closest('[data-tfdfree]')){ TFD.free = !TFD.free; toast(t(TFD.free ? 'رسمٌ حرّ: النقطةُ حيث تضغط وتُوصَل بخطٍّ مستقيم' : 'عاد الالتصاقُ بالشوارع')); render(1); return true; }   /* (V28.1) */
  if (e.target.closest('[data-tfdcancel]')){ tfdCancel(); return true; }
  var tfdg = e.target.closest('[data-tfdgo]'); if (tfdg){ a = tfdg.getAttribute('data-tfdgo').split('|'); goPage('map'); tfdStart(+a[0], a[1]); return true; }
  var tfdc = e.target.closest('[data-tfdclear]'); if (tfdc){ var c2 = tfdc.getAttribute('data-tfdclear').split('|'); tfdClear(+c2[0], c2[1]); return true; }
  if (e.target.closest('[data-route]')){ if (ROUTE.on && ROUTE.mode === 'line') routeCancel(); else routeStart('line'); return true; }
  if (e.target.closest('[data-area]')){ if (ROUTE.on && ROUTE.mode === 'area') routeCancel(); else routeStart('area'); return true; }
  if (e.target.closest('[data-rtsave]')){ routeSave(); return true; }
  if (e.target.closest('[data-rtundo]')){ routeUndo(); return true; }
  if (e.target.closest('[data-rtregen]')){ routeRegen(); return true; }
  if (e.target.closest('[data-rtmin]')){ RT_MIN = !RT_MIN; render(1); return true; }
  if (e.target.closest('[data-rtcancel]')){ RT_MIN = false; routeCancel(); return true; }
  var slg = e.target.closest('[data-sitelog]');
  if (slg){ toast(t('يُجلَب سجلُّ النقطة…')); siteLogFetch(slg.getAttribute('data-sitelog')); return true; }
  var bgf = e.target.closest('[data-bugf]');
  return CLICK_NEXT;
}
/* clickA — الجزء 6 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: bugf، bugdone، bugok، bugdec، bugno، wtxl، wtmeetstart، wtmeetprev، wtmeetnext، wtmeetgo، wtmeetend، wtmeetexit، wtgo، wtwbs، wtdone، wtdel، wtnew، wtncancel، wtnsave، wtreset، wbstog، wbsedit، wbscancel، wbssave، wbse، wbsdel، wbsreset، wbsf، fl، fr، fz، tfw، tfwcamp، tfwcampx، tfwd، poil، bedstart، bedsave، bedcancel، beddel، … */
function clickAPart6(e){
  var pk = e.target.closest('[data-pop]');   /* بحثٌ صرف — يُعاد حسابُه */
  var bst = e.target.closest('[data-bst]');   /* بحثٌ صرف — يُعاد حسابُه */
  var bgf = e.target.closest('[data-bugf]');   /* بحثٌ صرف — يُعاد حسابُه */
  var wid;   /* تُكتب هنا قبل أن تُقرأ */
    if (bgf){ BUG_F = bgf.getAttribute('data-bugf'); render(1); return true; }
  var bdn = e.target.closest('[data-bugdone]');
  if (bdn){ bugClose(bdn.getAttribute('data-bugdone')); return true; }
  var bok = e.target.closest('[data-bugok]');
  if (bok){ bugDecide(bok.getAttribute('data-bugok'), true, ''); return true; }
  var bdc = e.target.closest('[data-bugdec]');
  if (bdc){ BUG_DEC = bdc.getAttribute('data-bugdec'); render(1); return true; }
  var bno = e.target.closest('[data-bugno]');
  if (bno){
    var w = document.getElementById('bgWhy');
    bugDecide(bno.getAttribute('data-bugno'), false, w ? w.value : '');
    return true;
  }
  if (e.target.closest('[data-wtxl]')){ toast(t('يُجهَّز الملف…')); wtWorkbook(); return true; }
  if (e.target.closest('[data-wtmeetstart]')){ wtMeetStart(); return true; }
  if (e.target.closest('[data-wtmeetprev]')){ WT_MI = Math.max(0, WT_MI - 1); WT_MEND = 0; render(1); return true; }
  if (e.target.closest('[data-wtmeetnext]')){ WT_MI = Math.min(wtMeetList().length - 1, WT_MI + 1); WT_MEND = 0; render(1); return true; }
  var wmg = e.target.closest('[data-wtmeetgo]');
  if (wmg){ WT_MI = +wmg.getAttribute('data-wtmeetgo') || 0; WT_MEND = 0; render(1); return true; }
  if (e.target.closest('[data-wtmeetend]')){ if (WT_MEND) wtMeetEnd(); else { WT_MEND = 1; render(1); } return true; }
  if (e.target.closest('[data-wtmeetexit]')){ WT_MEET = false; WT_MEND = 0; WT_MI = 0; toast(t('خرجتَ من الاجتماع — ما حُدِّث محفوظ')); render(1); return true; }
  var wgo = e.target.closest('[data-wtgo]');
  if (wgo){ WT_WBS = wgo.getAttribute('data-wtgo') || ''; WT_F = ''; WT_Q = ''; WT_TAB = 'list'; WT_OPEN = ''; goPage('wtask'); render(1); return true; }
  var wwb = e.target.closest('[data-wtwbs]');
  if (wwb){ WT_WBS = wwb.getAttribute('data-wtwbs') || ''; render(1); return true; }
  if (e.target.closest('[data-wtdone]')){ WT_DONE_OPEN = !WT_DONE_OPEN; render(1); return true; }
  var wtd = e.target.closest('[data-wtdel]');
  if (wtd){ wtRemove(wtd.getAttribute('data-wtdel')); return true; }
  if (e.target.closest('[data-wtnew]')){ WT_NEW = true; WT_OPEN = ''; toast(t('املأ المهمة الجديدة ثم احفظ')); render(1); return true; }
  if (e.target.closest('[data-wtncancel]')){ WT_NEW = false; render(1); return true; }
  if (e.target.closest('[data-wtnsave]')){
    var v = function(id){ var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    wtAdd({ n:v('wtN'), track:v('wtTr'), who:v('wtWho'), due:v('wtDue'), d:v('wtD'), wbs:v('wtWbs') });
    return true;
  }
  if (e.target.closest('[data-wtreset]')){ if (WT_RESET) wtClear(); else { WT_RESET = 1; render(1); } return true; }
  var wtg = e.target.closest('[data-wbstog]');
  if (wtg){ wid = wtg.getAttribute('data-wbstog'); WBS_OPEN[wid] = !WBS_OPEN[wid]; render(1); return true; }
  var wed = e.target.closest('[data-wbsedit]');
  if (wed){ WBS_EDIT = wed.getAttribute('data-wbsedit'); render(1); return true; }
  if (e.target.closest('[data-wbscancel]')){ WBS_EDIT = ''; render(1); return true; }
  var wsv = e.target.closest('[data-wbssave]');
  if (wsv){
    var wid2 = wsv.getAttribute('data-wbssave'), tr2 = wsv.closest('tr');
    var g2 = function(k){ var el = tr2 && tr2.querySelector('[data-wbse="' + k + '"]'); return el ? el.value.trim() : ''; };
    wbsEditSave(wid2, { n:g2('n'), s:g2('s'), e:g2('e'), type:g2('type') || 'مهمة', resp:g2('resp'), party:g2('party') });
    return true;
  }
  var wdl = e.target.closest('[data-wbsdel]');
  if (wdl){ wbsRemove(wdl.getAttribute('data-wbsdel')); return true; }
  if (e.target.closest('[data-wbsreset]')){ if (WBS_RESET) wbsClear(); else { WBS_RESET = 1; render(1); } return true; }
  var wf = e.target.closest('[data-wbsf]');
  if (wf){ WBS_F = wf.getAttribute('data-wbsf') || ''; render(1); return true; }
  var flf = e.target.closest('[data-fl]');
  if (flf){ FILT.life = flf.getAttribute('data-fl') || ''; LIST_SHOWN = LIST_PAGE; render(1); if (typeof mapPaint === 'function' && CUR === 'map') mapPaint(); return true; }
  var fr = e.target.closest('[data-fr]');
  if (fr){ var rv = fr.getAttribute('data-fr');
           FILT.route = (FILT.route === rv) ? '' : rv; LIST_SHOWN = LIST_PAGE; render(1);
           if (CUR === 'map' && MAP) mapPaint(); return true; }
  var fz = e.target.closest('[data-fz]');
  if (fz){ FILT.zone = fz.getAttribute('data-fz'); LIST_SHOWN = LIST_PAGE; render(1);
           if (CUR === 'map' && MAP){ mapPaint(); mapFitFiltered(); } return true; }   /* (V29.8) */
  var tfb = e.target.closest('[data-tfw]');   /* (V23.2) */
  if (tfb){ TFW.camp = null; var tv = tfb.getAttribute('data-tfw'); TFW.f = tv === 'show' ? ((FILT.floor !== '' && FILT.floor != null) ? +FILT.floor : TFW_ALL) : +tv; if (TFW.f >= 0) tfwLoad(); tfwPaint(); render(1); return true; }   /* (V26.5) الإظهارُ على الدور المختار في صف الأدوار */
  var tfc = e.target.closest('[data-tfwcamp]');   /* (V24.5) مسارُ المخيم المختار */
  if (tfc){ tfwCampRoute(tfc.getAttribute('data-tfwcamp')); return true; }
  if (e.target.closest('[data-tfwcampx]')){ TFW.camp = null; tfwLines(); render(1); return true; }
  var tfd = e.target.closest('[data-tfwd]');   /* (V24.3) اتجاهُ المسار: الذهابُ والعودةُ أو كلٌّ وحدَه */
  if (tfd){ TFW.d = tfd.getAttribute('data-tfwd'); tfwLines(); render(1); return true; }
  var pol = e.target.closest('[data-poil]');   /* (V25.2) طبقتا الخريطة — خريطةٌ فقط */
  if (pol){ pk = pol.getAttribute('data-poil'); POIL.on[pk] = !POIL.on[pk]; poiLoad(); poiPaint(); render(1); return true; }
  bst = e.target.closest('[data-bedstart]');   /* (V25.9) تعديلُ حدود المخيم */
  if (bst){ if (MAP) MAP.closePopup(); bedStart(bst.getAttribute('data-bedstart')); return true; }
  if (e.target.closest('[data-bedsave]')){ bedSave(); return true; }
  if (e.target.closest('[data-bedcancel]')){ BED = null; bedPaint(); render(1); return true; }
  if (e.target.closest('[data-beddel]')){ bedDel(); return true; }
  if (e.target.closest('[data-bedundo]')){ if (BED && BED.hist && BED.hist.length){ BED.pts = BED.hist.pop(); BED.sel = -1; bedPaint(); render(1); } return true; }   /* (V37.17) */
  if (e.target.closest('[data-beddone]')){ if (BED && BED.pts.length >= 3){ BED.draw = false; BED.sel = -1; bedPaint(); render(1); toast(t('عدّل الزوايا إن لزم ثم احفظ')); } return true; }
  if (e.target.closest('[data-bedredraw]')){ if (BED){ bedSnap(); BED.pts = []; BED.sel = -1; BED.draw = true; bedPaint(); render(1); toast(t('اضغط على الخريطة عند كلِّ زاويةٍ بالترتيب، ثم «تمّ الرسم»')); } return true; }
  if (e.target.closest('[data-bedreset]')){ bedReset(); return true; }
  var ied = e.target.closest('[data-iotedit]');   /* (V25.8) تعديلُ حساسات مخيم */
  if (ied){ if (MAP) MAP.closePopup(); iotEditStart(ied.getAttribute('data-iotedit')); return true; }
  if (e.target.closest('[data-iotadd]')){ if (IOT.edit){ IOT.edit.add = !IOT.edit.add; IOT.edit.sel = null; iotPaint(); render(1); } return true; }
  if (e.target.closest('[data-iotdel]')){ iotDel(); return true; }
  if (e.target.closest('[data-iotsave]')){ iotSave(); return true; }
  if (e.target.closest('[data-iotcancel]')){ IOT.edit = null; iotPaint(); render(1); return true; }
  if (e.target.closest('[data-iot]')){   /* (V25.7) طبقةُ تخطيط الحساسات */
    IOT.on = !IOT.on; iotLoad(); iotPaint(); render(1);
    if (IOT.on && MAP && MAP.getZoom() < IOT.Z) toast(t('قرّب أكثر لتظهر الحساسات'));
    return true; }
  var ffl = e.target.closest('[data-ffl]');
  if (ffl){ var fv = ffl.getAttribute('data-ffl'); FILT.floor = (fv === '' || String(FILT.floor) === fv) ? '' : fv; LIST_SHOWN = LIST_PAGE;
    if (typeof TFW === 'object' && TFW.f >= 0){ TFW.camp = null; TFW.f = (FILT.floor === '' ? TFW_ALL : +FILT.floor); tfwPaint(); }   /* (V26.5) الدورُ الواحدُ يحكم المسارَ والنقاط */
    render(1);
           if (CUR === 'map' && MAP) mapPaint(); return true; }   /* (V22.2) */
  var ft = e.target.closest('[data-ft]');
  if (ft){ v = ft.getAttribute('data-ft');
           FILT.type = (FILT.type === v) ? '' : v; LIST_SHOWN = LIST_PAGE; render(1);
           if (CUR === 'map' && MAP){ mapPaint(); mapFitFiltered(); } return true; }
  return CLICK_NEXT;
}
/* clickA — الجزء 7 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: fw، ovz، wnx، kiosk، dupkeep، dupundo، kkz، svd، svdxls، fly، form، edit، sitesave، sitecancel، sitedel، sitedelgo، sitehide، sitehidego، siterestore، more، morek، sq، fsq، evfetch، evrange، evolder، evclr، wradd، wrdone، wrdonecancel، wrdonego، wrcancel، survst، grole */
function clickAPart7(e){
  var pr, sk;   /* تُكتب هنا قبل أن تُقرأ */
     /* (V29.8) */
  var fw = e.target.closest('[data-fw]');
  if (fw){ FILT.work = fw.getAttribute('data-fw'); LIST_SHOWN = LIST_PAGE; render(1);
           if (CUR === 'map' && MAP) mapPaint(); return true; }
  var ovz = e.target.closest('[data-ovz]');
  if (ovz){ var zk = ovz.getAttribute('data-ovz'); OVER_ZONE = (OVER_ZONE === zk ? '' : zk); render(1); return true; }
  if (e.target.closest('[data-wnx]')){ wnClose(); return true; }
  if (e.target.closest('[data-kiosk]')){ kioskToggle(); return true; }
  var dk = e.target.closest('[data-dupkeep]');
  if (dk){ pr = dk.getAttribute('data-dupkeep').split('|'); if (dupMerge(pr[0], pr[1])) render(1); return true; }
  var du = e.target.closest('[data-dupundo]');
  if (du){ if (dupUndo(du.getAttribute('data-dupundo'))) render(1); return true; }
  var kkz = e.target.closest('[data-kkz]');
  if (kkz){ KK_ZONE = kkz.getAttribute('data-kkz'); render(1); return true; }

  var svd = e.target.closest('[data-svd]');
  if (svd){ sk = svd.getAttribute('data-svd'); SVD_PICK = (SVD_PICK === sk ? '' : sk); render(1); return true; }
  if (e.target.closest('[data-svdxls]')){ svdXls(); return true; }
  var fl = e.target.closest('[data-fly]');
  if (fl){ POP_SITE = fl.getAttribute('data-fly'); POP_OPEN = true; CUR = 'map'; render();
           setTimeout(function(){ mapFly(POP_SITE); }, 500); return true; }
  var fm = e.target.closest('[data-form]');
  if (fm && !/^(INPUT|SELECT|TEXTAREA|OPTION|LABEL)$/.test(fm.tagName)){
    formGo(fm.getAttribute('data-form')); CUR = 'svForm'; render(1); return true; }
  if (e.target.closest('[data-edit]')){
    if (maySiteEditBasic()){ SITE_ED = 1; render(1);   /* (V28.6) المشرفُ أيضًا */ var fk = e.target.closest('[data-edit]').getAttribute('data-edit') || 'name', fid = { name:'seName', sq:'seSq', sign:'seSign', zone:'seZone', type:'seType', work:'seWork', region:'seRegion', lat:'seLat', floor:'seFloor' }[fk] || 'seName'; var ne = document.getElementById(fid) || document.getElementById('seName'); if (ne){ ne.focus(); if (ne.scrollIntoView) ne.scrollIntoView({ block:'center' }); } }   /* (V27.4) يفتح النموذجَ على الحقل المطلوب */
    else toast(t('التعديل يمرّ باعتماد المهندس'));
    return true; }
  var sts = e.target.closest('[data-sitesave]');
  if (sts){ if (siteEditSave(sts.getAttribute('data-sitesave'))) render(1); return true; }
  if (e.target.closest('[data-sitecancel]')){ SITE_ED = 0; SITE_HIDE = ''; SITE_DEL = ''; render(1); return true; }
  var std = e.target.closest('[data-sitedel]');   /* (V25.5) حذفُ المضافة نهائيًّا — بتأكيدٍ واحد */
  if (std){ SITE_DEL = std.getAttribute('data-sitedel'); render(1); return true; }
  var stdg = e.target.closest('[data-sitedelgo]');
  if (stdg){ if (siteDeleteFinal(stdg.getAttribute('data-sitedelgo'))){ DETAIL_ID = ''; CUR = 'sites'; } render(1); return true; }   /* (V37.13) */
  var mvd = e.target.closest('[data-mvdel]');   /* (V36.6) حركةُ مخزنٍ خاطئةٌ خلال يومها */
  if (mvd){ if (window.confirm(t('حذف') + ' ' + t('حركة مخزون') + '؟')) gdelRun('mv', mvd.getAttribute('data-mvdel')); render(1); return true; }
  var gdl = e.target.closest('[data-gdel]');   /* (V36.5) الحذفُ الموحّد */
  if (gdl){ var dp = gdl.getAttribute('data-gdel').split('|'), dR = GDEL_REG[dp[0]];
    if (dR && window.confirm(t('حذف') + ' ' + t(dR.t) + '؟')) gdelRun(dp[0], dp.slice(1).join('|'));
    render(1); return true; }
  var ged = e.target.closest('[data-ged]');   /* (V36.2) التعديلُ الموحّد */
  if (ged){ var gp = ged.getAttribute('data-ged').split('|'); GED = { k:gp[0], id:gp.slice(1).join('|') }; render(1); return true; }
  if (e.target.closest('[data-gedsave]')){ if (gedSave()) render(1); return true; }
  if (e.target.closest('[data-gedx]')){ GED = null; render(1); return true; }
  if (e.target.closest('[data-siterestoretoday]')){   /* (V36.8) استعادةُ ما حُذف اليوم دفعة */
    var today0 = dayKey(Date.now()), todo = (STATE.hiddenSites || []).filter(function(x){ return dayKey(x.hidAt || 0) === today0; }).map(function(x){ return x.id; });
    if (todo.length && window.confirm(t('استعادة') + ' ' + nm(todo.length) + ' ' + t('نقطة حُذفت اليوم؟'))){ var nr = 0; todo.forEach(function(id){ if (siteRestore(id)) nr++; }); logEvent('استعادة دفعة — ' + nr + ' نقطة حُذفت اليوم'); toast(nm(nr) + ' ' + t('استُعيدت')); }
    render(1); return true; }
  var pdl = e.target.closest('[data-popdel]');   /* (V37.9 ق-٠١٦) الحذفُ النهائيُّ بتأكيدٍ واحد */
  if (pdl){ var did = pdl.getAttribute('data-popdel'), dx = siteFind(did);
    if (window.confirm(t('حذف نهائي') + ' — ' + (dx ? siteKey(dx) : did) + '\n' + t('تُرفَع من كلِّ مكانٍ وعند الجميع، ولا تُستعاد. متأكد؟'))){ siteDeleteFinal(did); render(1); }
    return true; }
  var phd = e.target.closest('[data-pophide]');   /* (V36.1) الحذفُ من نافذة النقطة */
  if (phd){ var pid = phd.getAttribute('data-pophide'), px = siteFind(pid), had = !!(STATE.recs[pid] || STATE.inss[pid]);
    var msg = t('حذف النقطة') + ' ' + (px ? siteKey(px) : pid) + '؟\n' + (had ? t('لها زيارةٌ أو تركيب — تختفي من كلِّ الأرقام وتبقى سجلّاتُها.') + '\n' : '') + t('تُستعاد من «نقاطٌ مخفية» أسفل قائمة المواقع.');
    if (window.confirm(msg) && siteHide(pid)){ POP_OPEN = false; POP_SITE = ''; }
    render(1); return true; }
  var sth = e.target.closest('[data-sitehide]');
  if (sth){ SITE_HIDE = sth.getAttribute('data-sitehide'); render(1); return true; }
  var sthg = e.target.closest('[data-sitehidego]');
  if (sthg){ if (siteHide(sthg.getAttribute('data-sitehidego'))){ DETAIL_ID = ''; CUR = 'sites'; } render(1); return true; }
  var str = e.target.closest('[data-siterestore]');
  if (str){ siteRestore(str.getAttribute('data-siterestore')); render(1); return true; }

  if (e.target.closest('[data-more]')){ LIST_SHOWN += LIST_PAGE; render(); return true; }
  if (e.target.closest('[data-morek]')){ MORE_SHOWN[moreKey()] = (MORE_SHOWN[moreKey()] || 0) + MORE_STEP; render(1); return true; }   /* (V26.2) رسمٌ فوريٌّ فيظهر الأثرُ مع الضغطة */
  if (e.target.closest('[data-sq]')){
    var q = document.getElementById('siteQ');
    if (q && !q.value.trim() && !SITE_Q){ toast(t('اكتب ما تبحث عنه: المعرّف أو الشاخص أو المربع')); try { q.focus(); } catch (e2){ LS_ERR = e2; } return true; }   /* (V22.2) */
    SITE_Q = q ? q.value : '';
    LIST_SHOWN = LIST_PAGE;
    render();
    var nq = document.getElementById('siteQ');
    if (nq){ nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); }
    return true;
  }

  /* ── النماذج ── */
  if (e.target.closest('[data-fsq]')){
    q = document.getElementById('fSiteQ');
    var hit = q ? siteSearch(q.value, 1)[0] : null;
    if (hit){ formGo(hit.id); render(); toast(hit.id); }
    else toast(t('لا نتائج'));
    return true;
  }
  if (e.target.closest('[data-evfetch]')){ toast(t('يُجلَب السجل…')); evFetch(true); return true; }
  if (e.target.closest('[data-evrange]')){ toast(t('يُجلَب السجل…')); evFetch(true, 'range'); return true; }
  if (e.target.closest('[data-evolder]')){ toast(t('يُجلَب السجل…')); evFetch(true, 'older'); return true; }
  if (e.target.closest('[data-evclr]')){
    /* الضغطُ على مسحٍ بلا تصفيةٍ لا يغيّر شيئًا — فيُقال ذلك بدل الصمت */
    if (!EVF.kind && !EVF.by && !EVF.from && !EVF.to && !EVF.q && !EVF.cat){
      toast(t('لا تصفيةَ لتُمسَح')); return true;
    }
    EVF = { kind:'', by:'', from:'', to:'', q:'', cat:'' }; render(1); return true; }
  if (e.target.closest('[data-wradd]')){
    workReqAdd((document.getElementById('wrKind') || {}).value || 'prep',
      (document.getElementById('wrItem') || {}).value || '',
      (document.getElementById('wrQty') || {}).value || 0,
      (document.getElementById('wrTo') || {}).value || '');
    return true;
  }
  var wrd = e.target.closest('[data-wrdone]');
  if (wrd){ WR_DONE = wrd.getAttribute('data-wrdone'); render(1); return true; }
  if (e.target.closest('[data-wrdonecancel]')){ WR_DONE = ''; render(1); return true; }
  var wrg = e.target.closest('[data-wrdonego]');
  if (wrg){
    workReqComplete(wrg.getAttribute('data-wrdonego'), (document.getElementById('wrDoneQty') || {}).value);
    return true;
  }
  var wrc = e.target.closest('[data-wrcancel]');
  if (wrc){ workReqCancel(wrc.getAttribute('data-wrcancel')); return true; }
  var sst = e.target.closest('[data-survst]');
  if (sst){ SURV_ST = sst.getAttribute('data-survst'); render(1); return true; }
  var grl = e.target.closest('[data-grole]');
  if (grl){ GUIDE.role = grl.getAttribute('data-grole'); render(1); return true; }
  return false;
}

function onDocClick(e){
  /* (V37.14) جهةُ الدعم المطلوب أوّلًا — معالجٌ سابقٌ عند المهندس كان يبتلع الضغطَ قبل وصوله */
  var supq = e.target.closest('[data-supq]');   /* (V37.14) جهةُ الدعم المطلوب — قبل القائمة */
  if (supq){ if (e.preventDefault) e.preventDefault(); supRemove(); SUP_POP = supq.getAttribute('data-supq'); var hostS = supq.closest('#content') || document.getElementById('content') || document.body; var tmpS = document.createElement('div'); tmpS.innerHTML = supPanel(supq.getAttribute('data-supq')); while (tmpS.firstChild) hostS.appendChild(tmpS.firstChild); return; }
  if (e.target.closest('[data-supclose]')){ SUP_POP = ''; supRemove(); return; }
  /* (V33.0) كان ٩٨٤ سطرًا؛ صار أجزاءً بالترتيب نفسِه — الجزءُ الذي يعالج النقرةَ يُنهيها */
  if (onDocClickPart1(e) !== CLICK_NEXT) return;
  if (onDocClickPart2(e) !== CLICK_NEXT) return;
  if (onDocClickPart3(e) !== CLICK_NEXT) return;
  if (onDocClickPart4(e) !== CLICK_NEXT) return;
  if (onDocClickPart5(e) !== CLICK_NEXT) return;
  if (onDocClickPart6(e) !== CLICK_NEXT) return;
  if (onDocClickPart7(e) !== CLICK_NEXT) return;
  if (onDocClickPart8(e) !== CLICK_NEXT) return;
  if (onDocClickPart9(e) !== CLICK_NEXT) return;
}
/* onDocClick — الجزء 1 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: pq، pwa، listsok، lists، cfgok، crsave، asnrole، usradd، swnow، swlater، back، ipadd، ipclr، coadd، codel، ptab، goto، gotosite، svast، svappr، svrevisit، svrevisitcancel، svrevisitgo، xlspage */
function onDocClickPart1(e){
  if (clickTables(e)) return;
  var pqb = e.target.closest('[data-pq]');
  if (pqb && pqb.getAttribute('data-pq') === '0'){ QUEUE_OPEN = false; render(1); return; }
  if (pqb){
    /* كان يُلخَّص في رسالةٍ عابرة: «٣ مسح · ٢ تركيب» ثم تختفي. ومن أراد أن
       يعرف أيَّ نقطةٍ بالضبط لم تُرفَع، ومن سجّلها، ومتى — لم يجد. فصار
       نافذةً تُقرأ وتُغلَق بإرادة صاحبها. */
    QUEUE_OPEN = true; render(1); return;
  }

  if (e.target.closest('[data-pwa]')){
    if (INSTALL_EVT){
      INSTALL_EVT.prompt();
      INSTALL_EVT.userChoice.then(function(r){
        if (r && r.outcome === 'accepted') logEvent('تثبيت التطبيق');
        INSTALL_EVT = null;
        var b = document.getElementById('pwaBtn');
        if (b) b.hidden = true;
      }).catch(function(){});
    } else {
      /* لا يعرض المتصفّحُ النافذةَ إلا مرةً — ومن رفضها أو فتح على iOS
         يحتاج الطريقَ اليدويّ، فيُقال بدل زرٍّ لا يفعل شيئًا. */
      toast(t('من قائمة المتصفّح: «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»'));
    }
    return;
  }
  if (e.target.closest('[data-vcok]')){ if (catsSave()) render(1); return; }   /* (V37.4 → V37.13: أسماءٌ فريدة) */
  var cad = e.target.closest('[data-vcadd]');
  if (cad){ var kd = cad.getAttribute('data-vcadd'), tb = document.getElementById('catBody-' + kd); if (!CAT_NEW[kd] || !tb) return;   /* صفٌّ يُضاف في مكانه — بلا إعادة رسمٍ تمسح ما كُتب */
    var nk = 'u' + Date.now().toString(36); CAT_NEW[kd].push(nk); tb.insertAdjacentHTML('beforeend', catRow(kd, { k:nk, n:'', who:'', photo:false })); var ni = tb.querySelector('[data-vcn="' + kd + '|' + nk + '"]'); if (ni) ni.focus(); return; }
  if (e.target.closest('[data-vcedit]')){ SUP_POP = ''; supRemove(); svPopRemove(); goPage('consts'); render(1); setTimeout(function(){ var cc = document.getElementById('catsCard'); if (cc && cc.scrollIntoView) cc.scrollIntoView({ block:'start' }); }, 60); return; }
  if (e.target.closest('[data-listsok]')){   /* (V30.3) */
    if (!may('settings')){ toast(t('القوائمُ للمهندس فما فوق')); return; }
    var LS = {}; document.querySelectorAll('[data-lists]').forEach(function(ta){ LS[ta.getAttribute('data-lists')] = String(ta.value || '').split('\n').map(function(x){ return x.trim(); }).filter(Boolean); });
    CFG.lists = LS; cfgPushSoon('lists'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1;
    logEvent('تعديل القوائم من الإعدادات — ' + Object.keys(LS).map(function(k){ return k + ':' + LS[k].length; }).join(' · '));
    toast(t('حُفظت القوائم — تصل كلَّ الأجهزة مع المزامنة')); render(1); return;
  }
  if (e.target.closest('[data-cfgok]')){
    /* حقولُ الإعداد هنا تحفظ حيةً عند التغيير — الزرُّ لا يحفظ شيئًا لم
       يُحفَظ. وكان بلا خاصيةٍ فيُخشى ألّا يكون التغييرُ وقع؛ فيؤكِّد. */
    toast(t('محفوظٌ بالفعل — كلُّ حقلٍ هنا يُسجَّل فورَ تغييرِه'));
    return;
  }
  if (e.target.closest('[data-crsave]')){ crSaveTimes(); return; }
  if (e.target.closest('[data-asnrole]')){ asnRoleSet(); return; }
  if (e.target.closest('[data-usradd]')){ usrAdd(); return; }
  if (e.target.closest('[data-swnow]')){ swNow(); return; }
  if (e.target.closest('[data-swlater]')){ swLater(); return; }
  if (e.target.closest('[data-back]')){ e.preventDefault(); navBack(); return; }
  if (clickA(e)) return;
  if (e.target.closest('[data-ipadd]')){
    var idEl = document.getElementById('ipAddId'), netEl = document.getElementById('ipAddNet');
    var id0 = (idEl && idEl.value || '').trim().toUpperCase(), net0 = (netEl && netEl.value || '').trim().replace(/\.+$/, '');
    if (!siteFind(id0)){ toast(t('معرّفٌ غيرُ موجود')); return; }
    if (!/^\d{1,3}(\.\d{1,3}){2}$/.test(net0)){ toast(t('البادئةُ ثلاثةُ أرقامٍ بنقاط — مثل 10.20.30')); return; }
    ipSet(id0, 'net', net0);
    var x0 = siteFind(id0);
    if (!x0.ipRtr) ipSet(id0, 'ipRtr', '.1');
    if (!x0.ipRdr) ipSet(id0, 'ipRdr', '.2');
    if (!x0.ipCam) ipSet(id0, 'ipCam', '.3');
    logEvent('إضافة عنوان — ' + id0 + ' · ' + net0);
    toast(t('أُضيف العنوان')); render(1); return;
  }
  var ipc = e.target.closest('[data-ipclr]');
  if (ipc){ ipClear(ipc.getAttribute('data-ipclr')); return; }
  if (e.target.closest('[data-coadd]')){
    var cn = document.getElementById('coAddName');
    if (coAddDirect(cn ? cn.value : '')) render(1);
    return;
  }
  var cdl = e.target.closest('[data-codel]');
  if (cdl){ coRemove(cdl.getAttribute('data-codel')); return; }
  var ptb = e.target.closest('[data-ptab]');
  if (ptb){ var pt = ptb.getAttribute('data-ptab').split(':'); PTAB[pt[0]] = pt[1]; render(1); return; }
  var gto = e.target.closest('[data-goto]');
  if (gto){
    POP_OPEN = false;
    /* ═══ يُفتَح على النقطة لا على الشاشة (V17.21) ═══
       زرُّ الاعتماد في نافذة النقطة كان ينقل إلى شاشة الاعتماد بقائمتها
       كاملةً — مئاتٌ متشابهة — فيعتمد المهندسُ أوّلَ ما يقع تحت يده وهو غيرُ
       الذي فتحه. صار ينقل ومعه معرِّفُ النقطة فيُرشَّح عليها وحدَها،
       ويُختار القسمُ الذي هي فيه، فلا يُعتمَد إلا المقصود. */
    var gsite = gto.getAttribute('data-gotosite') || '';
    var dest = gto.getAttribute('data-goto');
    goPage(dest);
    if (gsite){
      /* يُضبَط بعد goPage: الرسمُ يمسح بحثَ الصفحة عند تبديلها (V17.24)،
         فلو ضُبط قبلَه مُسح — وهذا ما جعل الزرَّ يفتح الشاشةَ بلا نقطة (V17.33) */
      var rr = STATE.recs[gsite];
      PG_Q = gsite; PG_KEEP = true;
      if (dest === 'svappr'){ SVA_Q = gsite; SVA_ST = svReview(rr) === 'revisit' ? 'revisit' : 'pending'; }
      if (dest === 'minappr'){ MIN_Q = gsite; }
      toast(t('فُتحت على') + ' ' + gsite);
    }
    render();
    return;
  }
  var sva = e.target.closest('[data-svast]');
  if (sva){ SVA_ST = sva.getAttribute('data-svast'); SVA_REV = ''; SVA_SOL = ''; render(1); return; }
  var svap = e.target.closest('[data-svappr]');
  if (svap){ var idA = svap.getAttribute('data-svappr');
    if (svApprove(idA)){ toast(idA + ' \u00b7 ' + t('اعتُمدت الزيارة — اقترح حلَّها الآن'));
      SVA_ST = 'approved'; SVA_SOL = idA; SOL_LINES = {}; SOL_Q = ''; }
    render(1); return; }
  var svrv = e.target.closest('[data-svrevisit]');
  if (svrv){ SVA_REV = svrv.getAttribute('data-svrevisit'); render(1);
    var ne = document.getElementById('svaNote'); if (ne) ne.focus(); return; }
  if (e.target.closest('[data-svrevisitcancel]')){ SVA_REV = ''; render(1); return; }
  var svrg = e.target.closest('[data-svrevisitgo]');
  if (svrg){ var idR = svrg.getAttribute('data-svrevisitgo');
    if (svRevisit(idR, (document.getElementById('svaNote') || {}).value)){
      toast(idR + ' \u00b7 ' + t('رُدَّت — عادت إلى مهام المشرف')); SVA_REV = ''; }
    render(1); return; }
  if (e.target.closest('[data-xlspage]')){ toast(t('يُجهَّز إكسلُ الصفحة كاملةً…')); xlsPage(); return; }
  return CLICK_NEXT;
}
/* onDocClick — الجزء 2 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: boardrole، ngo، site، golayer، nsite، nid، provsync، provcancel، provcancelgo، usrreq، svph، svsol، svsolcancel، svsolgo، ipfill، svmore، pwcopy، pwclose، pnddel، pndgo، bulkchk، bulkgo، ghrun، evsite، provlocal، ghsave، ghclear، waasn، waasnx، watask، routego، attin، attout، pwgo، pwx، pwopen، provwipe، seedgo، dissave، mntsave، … */
function onDocClickPart2(e){
    var brl = e.target.closest('[data-boardrole]');
  if (brl){ BOARD_ROLE = brl.getAttribute('data-boardrole') || ''; render(1); return; }
  var nrow = e.target.closest('.notif-rows tbody tr');
  if (nrow && !e.target.closest('button,a,input,select')){
    var act = nrow.querySelector('[data-ngo],[data-site]');
    if (act){ act.click(); return; }
  }
  var gl = e.target.closest('[data-golayer]');
  if (gl){ FIELD_MODE = gl.getAttribute('data-golayer') || 'install'; goPage('map'); render(1); if (typeof mapPaint === 'function') mapPaint(); return; }
  var ngo = e.target.closest('[data-ngo]');
  if (ngo){
    var tabN = ngo.getAttribute('data-ngo'), siteN = ngo.getAttribute('data-nsite') || '', nidN = ngo.getAttribute('data-nid');
    if (nidN){ var nn = notifStore().filter(function(x){ return x.id === nidN; })[0]; if (nn) nn.read = true; }
    if (tabN === 'svappr'){ SVA_ST = 'pending'; SVA_Q = siteN; SVA_SOL = ''; SVA_REV = ''; SVA_PH = siteN; }
    /* الشريحةُ تُطلَب باسمها: goPage بالأمّ يعيد الشريحةَ إلى أولاها */
    goPage(tabN); render(1); return;
  }
  if (e.target.closest('[data-provsync]')){ provSync(); return; }
  if (e.target.closest('[data-provcancel]')){ PROV_CANCEL = 1; render(1); return; }
  if (e.target.closest('[data-provcancelgo]')){ provCancelAll(); return; }
  var usq = e.target.closest('[data-usrreq]');
  if (usq){ if (provReask(usq.getAttribute('data-usrreq'))) render(1); return; }
  var svph = e.target.closest('[data-svph]');
  if (svph){ var sid = svph.getAttribute('data-svph'); SVA_PH = (SVA_PH === sid) ? '' : sid; render(1); return; }
  var svso = e.target.closest('[data-svsol]');
  if (svso){ SVA_SOL = svso.getAttribute('data-svsol'); SOL_LINES = {}; SOL_Q = ''; render(1); return; }
  if (e.target.closest('[data-svsolcancel]')){ SVA_SOL = ''; render(1); return; }
  var svsg = e.target.closest('[data-svsolgo]');
  if (svsg){ var idS = svsg.getAttribute('data-svsolgo');
    /* من بطاقة الانتظار: تُعتمَد الزيارةُ أوّلًا ثم يُحفَظ الحلّ — خطوةٌ واحدةٌ للمهندس */
    var rS = STATE.recs[idS];
    if (rS && svReview(rS) !== 'approved' && !svApprove(idS)){ render(1); return; }
    if (solGo(idS)){ if (may('users')) solutionAppr(idS, 1); SVA_SOL = ''; toast(idS + ' \u00b7 ' + t('اعتُمدت ودخلت طبقةَ التركيب')); }
    render(1); return; }
  var ipf = e.target.closest('[data-ipfill]');
  if (ipf){
    var ty = ipf.getAttribute('data-ipfill');
    ipFillMissing('', ty === '1' ? '' : ty);
    return;
  }
  var svm = e.target.closest('[data-svmore]');
  if (svm){ SV_MORE = svm.getAttribute('data-svmore') === '1'; render(1); return; }
  /* الشريحةُ المفتوحةُ سلفًا لا تتغيّر بالضغط عليها — فيُقال ما هو معروضٌ
     الآن بدل صمتٍ يظنُّه الناقرُ عطلًا. */
  if (e.target.closest('[data-pwcopy]')){ if (PW_FLOW){ try { navigator.clipboard.writeText(PW_FLOW.pass); toast(t('نُسخت')); } catch (er){ toast(PW_FLOW.pass); } } return; }
  if (e.target.closest('[data-pwclose]')){ PW_FLOW = null; clearInterval(PW_POLL); PW_POLL = 0; render(1); return; }
  var pndd = e.target.closest('[data-pnddel]');
  if (pndd){ pendDel(pndd.getAttribute('data-pnddel')); return; }
  var pnd = e.target.closest('[data-pndgo]');
  if (pnd){
    var pu = pnd.getAttribute('data-pndgo');
    var pe = document.getElementById('pnd_' + pu);
    pendRetry(pu, pe ? pe.value : '');
    return;
  }
  if (e.target.closest('[data-bulkchk]')){
    var bt = document.getElementById('bulkT');
    BULK_TXT = bt ? String(bt.value || '').trim() : '';
    if (!BULK_TXT){ toast(t('الصق قائمةَ الفريق أوّلًا')); return; }
    var pr = bulkParse(BULK_TXT), okn = pr.filter(function(r){ return !r.why; }).length;
    toast(nm(okn) + ' ' + t('سيُكتَب') + ' \u00b7 ' + nm(pr.length - okn) + ' ' + t('يُترَك'));
    render(1); return;
  }
  if (e.target.closest('[data-bulkgo]')){
    var bt2 = document.getElementById('bulkT');
    if (bt2) BULK_TXT = bt2.value;
    bulkApply(); return;
  }
  if (e.target.closest('[data-ghrun]')){ ghRunNow(); return; }
  var evs = e.target.closest('[data-evsite]'); if (evs){ evSiteHistory(evs.getAttribute('data-evsite')); return; }   /* (V30.8) */
  var pvl = e.target.closest('[data-provlocal]'); if (pvl){ provLocal(pvl.getAttribute('data-provlocal')); return; }   /* (V30.7) */
  if (e.target.closest('[data-ghsave]')){ var gt = document.getElementById('ghTok'); ghSetToken(gt ? gt.value : ''); render(1); return; }
  if (e.target.closest('[data-ghclear]')){ ghSetToken(''); render(1); return; }
  if (e.target.closest('[data-waasn]')){ if (WA_LAST) waAsn(WA_LAST.to, WA_LAST.kind, WA_LAST.ids, WA_LAST.when); return; }
  if (e.target.closest('[data-waasnx]')){ WA_LAST = null; render(1); return; }
  var wat = e.target.closest('[data-watask]');
  if (wat){
    var tk2 = STATE.tasks[wat.getAttribute('data-watask')];
    if (tk2) waAsn(tk2.to, tk2.kind, [tk2.site], tk2.when || '');
    return;
  }
  if (e.target.closest('[data-routego]')){ toast(t('يُلتقَط موقعُك…')); routeLocate(); return; }
  if (e.target.closest('[data-attin]')){ attMark('in'); return; }
  if (e.target.closest('[data-attout]')){ attMark('out'); return; }
  if (e.target.closest('[data-pwgo]')){ pwSave(); return; }
  if (e.target.closest('[data-pwx]')){ if (!(PW && PW.forced)){ PW = null; render(1); } return; }
  if (e.target.closest('[data-pwopen]')){ pwOpen(false); return; }
  if (e.target.closest('[data-provwipe]')){ provWipe(); return; }
  if (e.target.closest('[data-seedgo]')){ seedApply(); return; }
  if (e.target.closest('[data-dissave]')){ disSave(); return; }
  if (e.target.closest('[data-mntsave]')){ maintSave(); return; }
  if (e.target.closest('[data-mydocfix]')){ myDocFix(); return; }
  if (e.target.closest('[data-pushnow]')){
    if (!STATE.queue.length){ toast(t('الطابورُ فارغ')); return; }
    var was = STATE.queue.length;
    toast(t('يُدفَع الطابور…'));
    CORE._busy = false;
    var go = function(){
      return CORE.flush().then(function(sent){
        if (STATE.queue.length && sent){ CORE._busy = false; return go(); }
        toast(t('رُفع') + ' ' + nm(was - STATE.queue.length) + ' \u00b7 ' + t('بقي') + ' ' + nm(STATE.queue.length)
              + (STATE.queue.length ? ' — ' + t('السببُ في «ما سقط بلا صوت»') : ''));
        render(1);
      });
    };
    if (!FB.ready || !FB.db){
      if (!STATE.meta.online){ toast(t('لا شبكة')); return; }
      FB.init().then(function(ok){ if (ok) go(); else toast(t('لا شبكة')); });
      return;
    }
    go(); return;
  }
  return CLICK_NEXT;
}
/* onDocClick — الجزء 3 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: provclear، usrpw، usrmerge، roleadd، roledel، pmrole، pmk، pmsave، pmreset، pmrefresh، presfetch، pzall، pzretry، pzdrop */
function onDocClickPart3(e){
    if (e.target.closest('[data-provclear]')){ provClear(); return; }
  var upw = e.target.closest('[data-usrpw]');
  if (upw){
    var uu9 = (STATE.users || {})[upw.getAttribute('data-usrpw')] || {};
    if (typeof confirm === 'function' && !confirm(t('كلمةٌ جديدة لـ') + ' ' + (uu9.name || uu9.user || '') + '\n' + t('القديمةُ تبطل فورَ تنفيذ الخادم.'))){ toast(t('أُلغي')); return; }
    usrPwReset(upw.getAttribute('data-usrpw')); return;
  }
  var umg = e.target.closest('[data-usrmerge]');
  if (umg){
    if (typeof confirm === 'function' && !confirm(t('دمجُ الحساب المكرَّر') + ' ' + umg.getAttribute('data-usrmerge') + '\n' + t('يبقى حسابُ الدخول ويُمحى الباقي. لا رجوع.'))){ toast(t('أُلغي')); return; }
    usrMerge(umg.getAttribute('data-usrmerge')); return;
  }
  if (e.target.closest('[data-roleadd]')){
    roleAdd((document.getElementById('nrName') || {}).value, (document.getElementById('nrBase') || {}).value, (document.getElementById('nrRank') || {}).value);
    return;
  }
  var rdl = e.target.closest('[data-roledel]');
  if (rdl){
    var rk9 = rdl.getAttribute('data-roledel');
    if (typeof confirm === 'function' && !confirm(t('حذفُ الدور') + ' ' + ((ROLES[rk9] || {}).n || rk9) + '\n' + t('لا رجوع.'))){ toast(t('أُلغي الحذف')); return; }
    roleDel(rk9); return;
  }
  var pmr = e.target.closest('[data-pmrole]');
  if (pmr){ PM_ROLE = pmr.getAttribute('data-pmrole'); render(1); return; }
  var pmk = e.target.closest('[data-pmk]');
  if (pmk){ var kk = pmk.getAttribute('data-pmk').split('|'); pmToggle(kk[0], kk[1], PM_ROLE); return; }
  if (e.target.closest('[data-pmsave]')){ pmSave(); return; }
  if (e.target.closest('[data-pmreset]')){ pmResetRole(PM_ROLE); return; }
  if (e.target.closest('[data-pmrefresh]')){ pmRefresh(true).then(function(){ PM_DRAFT = null; toast(t('قُرئت من القاعدة')); render(1); }); return; }
  if (e.target.closest('[data-presfetch]')){
    presenceFetch(true).then(function(n){ toast(t('حُدِّثت القائمة') + ' — ' + nm(n)); render(1); });
    return;
  }
  var pza = e.target.closest('[data-pzall]');
  if (pza){
    var PZa = STATE.poison || [], mode = pza.getAttribute('data-pzall');
    if (!PZa.length){ toast(t('لا معزولَ')); return; }
    if (mode === 'drop'){
      /* الإسقاطُ الجماعيُّ يُطلَب مرتين في خمس ثوانٍ — لا حوارٌ يُضغَط بلا قراءة */
      if (!PZ_ARM || Date.now() - PZ_ARM > 5000){
        PZ_ARM = Date.now(); toast(t('اضغط مرةً أخرى خلال خمس ثوانٍ لتأكيد الإسقاط')); return;
      }
      PZ_ARM = 0;
      logEvent('أُسقطت المعزولةُ كلُّها — ' + nm(PZa.length));
      STATE.poison = []; CORE.saveLocal(); render(1); return;
    }
    STATE.poison = [];
    PZa.forEach(function(pz2){ CORE.dirty(pz2.kind, pz2.id, pz2.v); });
    SOFT_SAID = {};
    logEvent('أُعيدت المعزولةُ كلُّها إلى الطابور — ' + nm(PZa.length));
    toast(t('أُعيد إلى الطابور') + ' — ' + nm(PZa.length));
    render(1); return;
  }
  var pzr = e.target.closest('[data-pzretry]');
  if (pzr){
    var pz = (STATE.poison || [])[+pzr.getAttribute('data-pzretry')];
    if (pz){ STATE.poison.splice(+pzr.getAttribute('data-pzretry'), 1); CORE.dirty(pz.kind, pz.id, pz.v); toast(t('أُعيد إلى الطابور')); render(1); }
    return;
  }
  var pzd = e.target.closest('[data-pzdrop]');
  return CLICK_NEXT;
}
/* onDocClick — الجزء 4 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: pzdrop، bkref، copick، coren، asnq، hsedel، rkdel، regk، regs، regedit، regsave، regto، regwhen، regdel، wredit، wresave، wreitem، rkadd، hogo، hodoc، pkadd، pkrm، patapply، patsave، patdel، svreopen، svreopencancel، svreopengo، evcat، usredit، usrdel، usract، usrren، usru، usrsave، usrn، usrr، usrj، usrs، usrd، … */
function onDocClickPart4(e){
  var pzd = e.target.closest('[data-pzdrop]');   /* بحثٌ صرف — يُعاد حسابُه */
    if (pzd){
    var pd = (STATE.poison || [])[+pzd.getAttribute('data-pzdrop')];
    if (pd){ STATE.poison.splice(+pzd.getAttribute('data-pzdrop'), 1); logEvent('أُسقطت وثيقةٌ معزولة — ' + pd.kind + '/' + pd.id); CORE.saveLocal(); render(1); }
    return;
  }
  if (e.target.closest('[data-bkref]')){ bkFetch(true); toast(t('تُقرأ الحالة…')); return; }
  var cpk = e.target.closest('[data-copick]');
  if (cpk){
    var ix = cpk.getAttribute('data-copick').split(':');
    var rawK = (CO_CMP_KEYS || [])[+ix[0]];
    var grp = rawK && (CO_CMP || {})[rawK];
    if (grp) coPick(rawK, grp.parts[+ix[1]]);
    return;
  }
  if (e.target.closest('[data-coren]')){
    coRename((document.getElementById('coRenFrom') || {}).value, (document.getElementById('coRenTo') || {}).value);
    render(1); return;
  }
  var aq = e.target.closest('[data-asnq]');
  if (aq){ asnQuick(aq.getAttribute('data-asnq')); return; }
  var hsd = e.target.closest('[data-hsedel]');
  if (hsd){ hseDel(+hsd.getAttribute('data-hsedel')); return; }
  var rkd = e.target.closest('[data-rkdel]');
  if (rkd){ riskDel(rkd.getAttribute('data-rkdel')); return; }
  var rgk = e.target.closest('[data-regk]');
  if (rgk){
    var kv = rgk.getAttribute('data-regk');
    if (kv === REG_KIND){ toast(t(kv ? (WO_KINDS[kv] ? WO_KINDS[kv].n : kv) : 'كل الأنواع') + ' \u00b7 ' + t('معروضٌ الآن')); return; }
    REG_KIND = kv; REG_EDIT = ''; render(1); return;
  }
  var rgs = e.target.closest('[data-regs]');
  if (rgs){
    var sv2 = rgs.getAttribute('data-regs');
    if (sv2 === REG_ST){ toast(t(sv2 || 'كل الحالات') + ' \u00b7 ' + t('معروضٌ الآن')); return; }
    REG_ST = sv2; REG_EDIT = ''; render(1); return;
  }
  var rge = e.target.closest('[data-regedit]');
  if (rge){ REG_EDIT = rge.getAttribute('data-regedit'); render(1); return; }
  var rgv = e.target.closest('[data-regsave]');
  if (rgv){
    var rid = rgv.getAttribute('data-regsave');
    var tEl = document.querySelector('[data-regto="' + rid + '"]');
    var wEl = document.querySelector('[data-regwhen="' + rid + '"]');
    var pat = {};
    if (tEl) pat.to = tEl.value, pat.assignedTo = tEl.value;
    if (wEl) pat.when = wEl.value || '';
    regSet(rid, pat);
    REG_EDIT = ''; render(1); return;
  }
  var rgd = e.target.closest('[data-regdel]');
  if (rgd){ regDel(rgd.getAttribute('data-regdel')); return; }
  var wre = e.target.closest('[data-wredit]');
  if (wre){ WR_EDIT = wre.getAttribute('data-wredit'); render(1); return; }
  var wrs = e.target.closest('[data-wresave]');
  if (wrs){
    var wid = wrs.getAttribute('data-wresave');
    var qEl = document.getElementById('wrEQ_' + wid);
    var iEl = document.querySelector('[data-wreitem="' + wid + '"]');
    workReqEdit(wid, iEl ? iEl.value : '', qEl ? qEl.value : 0);
    WR_EDIT = ''; render(1); return;
  }
  if (e.target.closest('[data-rkadd]')){ riskAdd(); return; }
  if (e.target.closest('[data-hogo]')){
    var hs = (document.getElementById('hoSite') || {}).value;
    var ht = (document.getElementById('hoTo') || {}).value;
    var hn = (document.getElementById('hoNote') || {}).value;
    if (handSave(hs, ht, hn)){ HO_DOC = hs; toast(hs + ' \u00b7 ' + t('حُرِّر المحضر')); }
    render(1); return;
  }
  var hd = e.target.closest('[data-hodoc]');
  if (hd){
    var isSite = hd.getAttribute('data-hodoc') === 'site';
    var pick = (document.getElementById(isSite ? 'hoDocSite' : 'hoDocCo') || {}).value || '';
    /* القائمةُ الفارغةُ تجعل الزرَّ بلا أثر — فيُقال لماذا بدل الصمت */
    if (!pick){
      toast(t(isSite ? 'لا نقطةَ مُركّبةً معتمدةً بعد — لا محضرَ يُعرَض'
                     : 'لا شركةَ لها نقاطٌ مُركّبةٌ معتمدةٌ بعد'));
      return;
    }
    if (isSite){ HO_DOC = pick; HO_CO = ''; } else { HO_CO = pick; HO_DOC = ''; }
    render(1); return;
  }
  if (e.target.closest('[data-pkadd]')){ pkAdd(); return; }
  var pkrm = e.target.closest('[data-pkrm]');
  if (pkrm){ delete SOL_LINES[pkrm.getAttribute('data-pkrm')]; render(1); return; }
  if (e.target.closest('[data-patapply]')){ patApply((document.getElementById('patSel') || {}).value); return; }
  if (e.target.closest('[data-patsave]')){ if (patSave((document.getElementById('patName') || {}).value)) render(1); return; }
  var pdl = e.target.closest('[data-patdel]');
  if (pdl){ patDel(pdl.getAttribute('data-patdel')); return; }
  var svr = e.target.closest('[data-svreopen]');
  if (svr){ SURV_REOPEN = svr.getAttribute('data-svreopen'); render(1); return; }
  if (e.target.closest('[data-svreopencancel]')){ SURV_REOPEN = ''; render(1); return; }
  var svg = e.target.closest('[data-svreopengo]');
  if (svg){
    svReopen(svg.getAttribute('data-svreopengo'),
             (document.getElementById('reopenReason') || {}).value,
             (document.getElementById('reopenNote') || {}).value);
    return;
  }
  var evc = e.target.closest('[data-evcat]');
  if (evc){ EVF.cat = evc.getAttribute('data-evcat'); render(1); return; }
  var ue = e.target.closest('[data-usredit]');
  if (ue){ USR.edit = ue.getAttribute('data-usredit'); render(1); return; }
  var ud = e.target.closest('[data-usrdel]');
  if (ud){ usrDel(ud.getAttribute('data-usrdel')); return; }
  var ua = e.target.closest('[data-usract]');
  if (ua){ var id1 = ua.getAttribute('data-usract');
    usrSet(id1, { active: ((STATE.users||{})[id1]||{}).active === false }); return; }
  var urn = e.target.closest('[data-usrren]');
  if (urn){
    rid = urn.getAttribute('data-usrren');
    var uEl = document.querySelector('[data-usru="' + rid + '"]');
    if (usrRename(rid, uEl ? uEl.value : '')){ USR.edit = ''; render(1); }
    return;
  }
  var us = e.target.closest('[data-usrsave]');
  if (us){
    var id2 = us.getAttribute('data-usrsave');
    var nEl = document.querySelector('[data-usrn="' + id2 + '"]');
    var rEl = document.querySelector('[data-usrr="' + id2 + '"]');
    var patch = {};
    if (nEl) patch.name = String(nEl.value || '').trim();
    if (rEl) patch.role = rEl.value;
    var jEl = document.querySelector('[data-usrj="' + id2 + '"]');
    var sEl = document.querySelector('[data-usrs="' + id2 + '"]');
    if (jEl){
      patch.job = jEl.value;
      var uOld = (STATE.users || {})[id2] || {};
      if (patch.job !== (uOld.job || ''))
        patch.jobLog = (uOld.jobLog || []).concat([{ job:patch.job, at:Date.now(), by:STATE.meta.name || '' }]);
      /* الوظيفةُ تجرُّ دورَها ما لم يُغيَّر الدورُ بيدٍ في اللحظة نفسِها */
      if (patch.job && jobOf(patch.job) && (!rEl || rEl.value === uOld.role))
        patch.role = jobOf(patch.job).role || patch.role;
    }
    if (sEl) patch.sup = sEl.value;
    var dEl = document.querySelector('[data-usrd="' + id2 + '"]');
    if (dEl) patch.dept = dEl.value;
    var phEl = document.querySelector('[data-usrph="' + id2 + '"]');
    if (phEl) patch.ph = String(phEl.value || '').replace(/[^\d+]/g, '');
    if (!patch.name){ toast(t('الاسم مطلوب')); return; }
    USR.edit = ''; usrSet(id2, patch); return;
  }
  if (e.target.closest('[data-tkpurge]')){
    if (!may('users')){ toast(t('إدارةُ المستخدمين للمهندس وحده')); return; }
    /* الوثيقةُ الموروثةُ تُحذَف من السحابة، وأسماءُ الفرق التي لا حسابَ لها
       تُفرَغ — فلا يبقى مكانٌ ثانٍ يعيش فيه اسم. الحساباتُ لا تُمَسّ. */
    CORE.dirty('cfg', 'techs', null);
    STATE.techs = [];
    var cleaned = 0;
    crewsList().forEach(function(c){
      var keep = (c.members || []).filter(function(nm2){ return !!techUid(nm2); });
      cleaned += (c.members || []).length - keep.length;
      c.members = keep;
    });
    crewSave();
    logEvent('تنظيف قوائم الفنيين الموروثة — أُفرغ ' + nm(cleaned) + ' اسمًا بلا حساب');
    toast(t('مُسحت القوائمُ الموروثة') + (cleaned ? ' \u00b7 ' + nm(cleaned) + ' ' + t('اسمًا أُفرغ من الفرق') : ''));
    render(1); return;
  }
  ud = e.target.closest('[data-usrdel]');
  if (ud){
    var idD = ud.getAttribute('data-usrdel');
    if (!may('users')){ toast(t('إدارةُ المستخدمين للمهندس وحده')); return; }
    if (idD === (STATE.meta.uid || '')){ toast(t('لا تحذف حسابَك وأنت فيه')); return; }
    var uD = (STATE.users || {})[idD] || {};
    /* من له عملٌ مسجَّلٌ لا يُحذَف — سجلاتُه تحمل اسمَه */
    var wk = scores().list.filter(function(x){ return x.name === uD.name; })[0];
    var acts = wk ? (wk.survey + wk.install + wk.dis + wk.prep + wk.asm) : 0;
    if (acts){ toast(t('له') + ' ' + nm(acts) + ' ' + t('عملًا مسجَّلًا — عطِّله بدل حذفه')); return; }
    /* ومن عليه مهامُّ مفتوحةٌ أو طلبُ صرفٍ لم يُنفَّذ لا يُحذَف — وإلا صارت
       مهامُّه يتيمةً تُعرَض على «لا أحد» ويُنتظَر تنفيذُها إلى الأبد */
    var openT = Object.keys(STATE.tasks || {}).filter(function(k){
      var x = STATE.tasks[k]; return x && x.to === uD.name && x.status !== 'معتمد'; }).length;
    var openW = workReqList().filter(function(r){ return r.to === uD.name && r.status !== 'تم'; }).length;
    if (openT || openW){
      toast(t('عليه') + ' ' + nm(openT + openW) + ' ' + t('مهمةً مفتوحةً — أعد إسنادَها من «سجل الإسنادات» ثم احذف'));
      return;
    }
    delete STATE.users[idD];
    CORE.dirty('users', idD, null);
    logEvent('حذف حساب — ' + (uD.name || idD));
    toast(t('حُذف الحساب'));
    USR.edit = ''; render(1); return;
  }
  if (e.target.closest('[data-out]')){ signOut(); return; }
  if (e.target.closest('[data-serrclr]')){
    SOFT_ERRS = []; SOFT_SAID = {}; toast(t('مُسح سجلُّ الأعطال')); render(1); return;
  }
  if (e.target.closest('[data-verchk]')){ verCheck(); return; }
  var depa = e.target.closest('[data-depadd]');
  if (depa){ depTechAdd(depa.getAttribute('data-depadd')); return; }
  var bna = e.target.closest('[data-bnadd]');
  if (bna){
    var pfx = bna.getAttribute('data-bnadd');
    bonusAdd((document.getElementById(pfx + 'BnTech') || {}).value,
             (document.getElementById(pfx + 'BnPts') || {}).value,
             (document.getElementById(pfx + 'BnNote') || {}).value);
    return;
  }
  var bnd = e.target.closest('[data-bndel]');
  if (bnd){ bonusDel(bnd.getAttribute('data-bndel')); return; }
  var crc = e.target.closest('[data-crewcur]');
  if (crc){
    var cid = crc.getAttribute('data-crewcur');
    if (cid === CREW_CUR){ toast(t('هذا الفريقُ معروضٌ الآن')); return; }
    CREW_CUR = cid; CTEAM_CUR = ''; render(1); return;
  }
  var dtn = e.target.closest('[data-depteamnew]');
  if (dtn){ depTeamNew(dtn.getAttribute('data-depteamnew')); return; }
  var dtd = e.target.closest('[data-depteamdel]');
  if (dtd){ depTeamDel(dtd.getAttribute('data-depteamdel')); return; }
  var dtc = e.target.closest('[data-depteam]');
  if (dtc){
    var did = dtc.getAttribute('data-depteam');
    if (did === CTEAM_CUR){ toast(t('هذا الفريقُ معروضٌ الآن')); return; }
    CTEAM_CUR = did; render(1); return;
  }
  if (e.target.closest('[data-depmemadd]')){ depTeamAdd(); return; }
  var dmr = e.target.closest('[data-depmemrm]');
  if (dmr){ depTeamRm(+dmr.getAttribute('data-depmemrm')); return; }
  if (e.target.closest('[data-depeven]')){ depTeamEven(); return; }
  if (e.target.closest('[data-depbydef]')){ depTeamByRole(); return; }
  var cpt = e.target.closest('[data-capt]');
  if (cpt){
    /* تبديلُ الصلاحيات لمن يملك `roles` وحدَه — والمهندسُ لا يملكها،
       فمن يضبط الصلاحياتِ لا يوسّع صلاحيةَ نفسِه. */
    if (!may('roles')){ toast(t('تبديلُ الصلاحيات لمدير المشروع وحده')); return; }
    var p2 = cpt.getAttribute('data-capt').split('|');
    var R2 = ROLES[p2[0]]; if (!R2) return;
    R2.can = R2.can || {};
    if (R2.can[p2[1]]) delete R2.can[p2[1]]; else R2.can[p2[1]] = 1;
    CFG.roleCaps = (function(){
      var o2 = {}; Object.keys(ROLES).forEach(function(k){ o2[k] = ROLES[k].can || {}; }); return o2;
    })();
    CORE.set('cfg', 'roleCaps', CFG.roleCaps);
    /* القدرةُ التي لها خانةٌ في القاعدة تُكتَب فيها في اللحظة نفسِها — فلا شاشةٌ تعِد وقاعدةٌ تردّ */
    var pk2 = PM_CAP[p2[1]];
    if (pk2 && !pmLocked(pk2[0], pk2[1], p2[0])) pmSetDirect(pk2[0], pk2[1], p2[0], !!R2.can[p2[1]]);
    logEvent('صلاحية — ' + R2.n + ' · ' + p2[1] + ': ' + (R2.can[p2[1]] ? 'مُنحت' : 'سُحبت') + (pk2 ? ' · ' + t('وفي القاعدة') : ''));
    toast(t(R2.can[p2[1]] ? 'مُنحت' : 'سُحبت'));
    render(1); return;
  }
  if (e.target.closest('[data-esadd]')){ escAdd(); return; }
  var esd = e.target.closest('[data-esdel]');
  if (esd){ escDel(+esd.getAttribute('data-esdel')); return; }
  if (e.target.closest('[data-rcadd]')){ raciAdd(); return; }
  var rcd = e.target.closest('[data-rcdel]');
  if (rcd){ raciDel(+rcd.getAttribute('data-rcdel')); return; }
  if (e.target.closest('[data-lsadd]')){ lessAdd(); return; }
  if (e.target.closest('[data-lsshow]')){ LESS_SHOW = !LESS_SHOW; render(1); return; }   /* (V27.1) */
  var lsd = e.target.closest('[data-lsdel]');
  if (lsd){ lessDel(+lsd.getAttribute('data-lsdel')); return; }
  if (e.target.closest('[data-vhadd]')){ vehAdd(); return; }
  if (e.target.closest('[data-vaadd]')){ vehAsnAdd(); return; }
  if (e.target.closest('[data-vkadd]')){
    if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
    var g2 = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
    var vn = g2('vkN');
    if (!vn){ toast(t('اكتب اسم النوع')); return; }
    if (vehKinds().some(function(k){ return k.n === vn; })){ toast(t('النوعُ موجودٌ بالفعل')); return; }
    vehKinds().push({ id:'vk' + Date.now().toString(36), n:vn, d:g2('vkD'), cap:+g2('vkC') || 2 });
    vehKindSave(); logEvent('نوع سيارة جديد — ' + vn);
    toast(t('أُضيف النوع')); render(1); return;
  }
  var vhd = e.target.closest('[data-vhdel]');
  if (vhd){ vehDel(vhd.getAttribute('data-vhdel')); return; }
  var vae = e.target.closest('[data-vaend]');
  if (vae){ vehAsnEnd(vae.getAttribute('data-vaend')); return; }
  var vkd = e.target.closest('[data-vkdel]');
  if (vkd){
    if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
    var kid = vkd.getAttribute('data-vkdel');
    if (vehList().some(function(v){ return v.kind === kid; })){ toast(t('مستعملٌ — لا يُحذَف')); return; }
    var KL = vehKinds(), ki = -1;
    KL.forEach(function(k, n2){ if (k.id === kid) ki = n2; });
    if (ki > -1){ var kn = KL[ki].n; KL.splice(ki, 1); vehKindSave();
      logEvent('حذف نوع سيارة — ' + kn); toast(t('حُذف النوع')); render(1); }
    return;
  }
  if (e.target.closest('[data-shadd]')){ shipAdd(); return; }
  var shd = e.target.closest('[data-shdel]');
  if (shd){ shipDel(shd.getAttribute('data-shdel')); return; }
  if (e.target.closest('[data-fup]')){ fupExport(); return; }
  if (e.target.closest('[data-vkadd]')){ vehKindAdd(); return; }
  vkd = e.target.closest('[data-vkdel]');
  if (vkd){ vehKindDel(vkd.getAttribute('data-vkdel')); return; }
  if (e.target.closest('[data-tyadd]')){ typeAdd(); return; }
  if (e.target.closest('[data-typesopen]')){ TYPES_OPEN = e.target.closest('[data-typesopen]').getAttribute('data-typesopen') === '1'; render(1); return; }
  if (e.target.closest('[data-selname]')){ if (selRename((document.getElementById('selNamePfx') || {}).value, (document.getElementById('selNameFrom') || {}).value)){ ASN_OPEN = false; if (typeof mapPaint === 'function' && MAP) mapPaint(); } render(1); return; }   /* (V23.1) */
  if (e.target.closest('[data-seltype]')){ var stv = (document.getElementById('selType') || {}).value; if (selSetType(stv)){ ASN_OPEN = false; if (typeof mapPaint === 'function' && MAP) mapPaint(); } render(1); return; }   /* (V23.0) */
  var tym = e.target.closest('[data-tymove]');   /* (V23.0) */
  if (tym){ var tk0 = tym.getAttribute('data-tymove'), tsel = document.getElementById('tyMv_' + tk0); typeMoveDel(tk0, tsel ? tsel.value : ''); render(1); return; }
  var tyd = e.target.closest('[data-tydel]');
  if (tyd){ typeDel(tyd.getAttribute('data-tydel')); return; }
  var mxd = e.target.closest('[data-mxdel]');
  if (mxd){
    var mxp = mxd.getAttribute('data-mxdel').split('|');
    mxUndeclare(mxp[0], mxp.slice(1).join('|'));
    return;
  }
  if (e.target.closest('[data-mxdadd]')){ mxDeclareGo(); return; }
  if (e.target.closest('[data-jbadd]')){ jobAdd(); return; }
  var jbd = e.target.closest('[data-jbdel]');
  if (jbd){ jobDel(jbd.getAttribute('data-jbdel')); return; }
  if (e.target.closest('[data-craddgo]')){ crewAdd(); return; }
  if (e.target.closest('[data-wipego]')){ wipeGo(); return; }
  var tkd = e.target.closest('[data-tkdel]');
  if (tkd){ techDel(tkd.getAttribute('data-tkdel')); return; }
  var crd = e.target.closest('[data-crdel]');
  if (crd){ crewDel(crd.getAttribute('data-crdel')); return; }
  var sgo = e.target.closest('[data-stgout]');
  if (sgo){ var p3 = sgo.getAttribute('data-stgout').split('|'); stageOut(p3[0], p3[1]); return; }
  var sga = e.target.closest('[data-stgadd]');
  if (sga){ stageAdd(sga.getAttribute('data-stgadd')); return; }
  if (e.target.closest('[data-itadd]')){ itemAdd(); return; }
  var idl = e.target.closest('[data-itdel]');
  if (idl){ itemDel(idl.getAttribute('data-itdel')); return; }
  var izn = e.target.closest('[data-itzone]');
  if (izn){ itemZone(izn.getAttribute('data-itzone')); return; }
  if (e.target.closest('[data-mvadd]')){ moveAdd(); return; }
  if (e.target.closest('[data-byadd]')){ buyAdd(); return; }
  var bye = e.target.closest('[data-byedit]'); if (bye){ buyEdit(bye.getAttribute('data-byedit')); return; }   /* (V29.5) */
  var mdl = e.target.closest('[data-mntdel]'); if (mdl){ var mp2 = mdl.getAttribute('data-mntdel').split('|'); maintDel(mp2[0], mp2[1]); return; }
  var byd = e.target.closest('[data-bydel]'); if (byd){ buyDel(byd.getAttribute('data-bydel')); return; }
  if (e.target.closest('[data-byedcancel]')){ BUY_ED = ''; render(1); toast(t('أُلغي التعديل')); return; }
  if (e.target.closest('[data-supadd]')){ listAdd('sup'); return; }
  if (e.target.closest('[data-catadd]')){ listAdd('cat'); return; }
  var srm2 = e.target.closest('[data-suprm]');
  if (srm2){ listRm('sup', srm2.getAttribute('data-suprm')); return; }
  var crm = e.target.closest('[data-catrm]');
  if (crm){ listRm('cat', crm.getAttribute('data-catrm')); return; }
  if (e.target.closest('[data-nask]')){ notifAsk(); return; }
  if (e.target.closest('[data-ntest]')){
    notifSystem({ kind:'تجربة', text:'وصل إشعارُ النظام — القناةُ تعمل.', id:'test', site:'' });
    toast(t('أُرسل إشعارُ تجربة')); return;
  }
  var nrd = e.target.closest('[data-nread]');
  if (nrd){
    var k = nrd.getAttribute('data-nread');
    notifStore().forEach(function(n){ if (k === '*' || n.id === k) n.read = true; });
    CORE.saveSoon(); syncBadge(); render(1); return;
  }
  var nwa = e.target.closest('[data-nwa]'), nml = e.target.closest('[data-nmail]');
  if (nwa || nml){ logEvent('إرسال إشعار — ' + ((nwa||nml).getAttribute(nwa?'data-nwa':'data-nmail'))
      + ' · ' + (nwa ? 'واتساب' : 'بريد')); return; }
  var cal = e.target.closest('[data-coall]');
  if (cal){
    var on2 = cal.getAttribute('data-coall') === '1';
    CO_LIST.filter(function(c){ return coHit(c, CO_Q); })
      .forEach(function(c){
        var k = CO_SEL.indexOf(c);
        if (on2 && k < 0) CO_SEL.push(c);
        if (!on2 && k > -1) CO_SEL.splice(k, 1);
      });
    statBump(); render(1);
    toast(t(on2 ? 'حُدِّد الكل' : 'أُزيل التحديد'));
    return;
  }
  var cmo = e.target.closest('[data-comode]');
  if (cmo){
    CO_MODE = cmo.getAttribute('data-comode') === '1';
    statBump(); render(1);
    toast(t(CO_MODE ? 'الخريطةُ بألوان الشركات' : 'عاد لونُ الطبقة'));
    return;
  }
  var srm = e.target.closest('[data-selrm]');
  if (srm){ selToggle(srm.getAttribute('data-selrm')); render(1); return; }
  var pv = e.target.closest('[data-pview]');
  if (pv){ photoSeen(pv.getAttribute('data-pview')); return; }   /* الرابطُ يفتح، ونحن نسجّل */
  pd = e.target.closest('[data-pdel]');
  if (pd){
    var pid = pd.getAttribute('data-pdel');
    var why = (typeof prompt === 'function') ? prompt(t('سببُ الحذف')) : '';
    if (why === null) return;                    /* أُلغي */
    photoDelete(pid, why);
    return;
  }
  return CLICK_NEXT;
}
/* onDocClick — الجزء 5 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: pretry، acc، chal، fst */
function onDocClickPart5(e){
    if (e.target.closest('[data-pretry]')){
    while (PHOTO_FAIL.length) PHOTO_Q.push(PHOTO_FAIL.shift());
    toast(t('أُعيدت إلى الطابور'));
    photoFlush(); render(1); return;
  }
  var wy = e.target.closest('[data-why]');   /* (V37.1) سببُ عدم المسح — يحدّد حالةَ الوصول القديمة للتوافق */
  if (wy){ FORM.why = wy.getAttribute('data-why'); FORM.access = WHY_ACCESS[FORM.why] || 'منع دخول'; render(1); return; }
  var ac = e.target.closest('[data-acc]');
  if (ac){ FORM.access = ac.getAttribute('data-acc'); render(1); return; }
  var ch = e.target.closest('[data-chal]');
  if (ch){
    var v = ch.getAttribute('data-chal'), i = FORM.chals.indexOf(v);
    if (i > -1) FORM.chals.splice(i, 1); else FORM.chals.push(v);
    ch.classList.toggle('on');
    return;
  }
  var fs = e.target.closest('[data-fst]');
  return CLICK_NEXT;
}
/* onDocClick — الجزء 6 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: fst، svsave، svnext، inssave، insdraft، fix */
function onDocClickPart6(e){
  var fs = e.target.closest('[data-fst]');   /* بحثٌ صرف — يُعاد حسابُه */
    if (fs){ FORM.status = fs.getAttribute('data-fst'); render(1); return; }
  if (e.target.closest('[data-svsave]')){ svSave(0); return; }
  if (e.target.closest('[data-svnext]')){ svSave(1); return; }
  if (e.target.closest('[data-inssave]')){ insSave(0); return; }
  if (e.target.closest('[data-insdraft]')){ insSave(1); return; }
  var fxb = e.target.closest('[data-fix]');
  return CLICK_NEXT;
}
/* onDocClick — الجزء 7 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: fix، fixsend، apok، apno، appr، rej، solappr، solrej، solgo، pwa، swclear، probe، wa، wacopy، fhpos، fhcopy، fhwa، fhprep، pull، svcopy، nschal، mailsend، mailco، wasend، wapick، xls، expgo، k، kmz */
function onDocClickPart7(e){
  var fxb = e.target.closest('[data-fix]');   /* بحثٌ صرف — يُعاد حسابُه */
  var pr, ix, k, why;   /* تُكتب هنا قبل أن تُقرأ */
    if (fxb){ fixOpen(fxb.getAttribute('data-fix') === '0' ? '' : fxb.getAttribute('data-fix')); return; }
  var fxs = e.target.closest('[data-fixsend]');
  if (fxs){ fixSend(fxs.getAttribute('data-fixsend')); return; }
  var apk = e.target.closest('[data-apok]'), apn = e.target.closest('[data-apno]');
  if (apk || apn){
    var p = (apk || apn).getAttribute(apk ? 'data-apok' : 'data-apno').split('|');
    why = apn && typeof prompt === 'function' ? prompt(t('سببُ الردّ')) : '';
    if (apn && why === null) return;
    apprDecide(p[0], p.slice(1).join('|'), !!apk, why);
    return;
  }
  var ap = e.target.closest('[data-appr]');
  if (ap){ apprIns(ap.getAttribute('data-appr'), 1); return; }
  var rj = e.target.closest('[data-rej]');
  if (rj){ apprIns(rj.getAttribute('data-rej'), 0); return; }
  var sap = e.target.closest('[data-solappr]');
  if (sap){ solutionAppr(sap.getAttribute('data-solappr'), 1); return; }
  var srj = e.target.closest('[data-solrej]');
  if (srj){ solutionAppr(srj.getAttribute('data-solrej'), 0); return; }
  if (e.target.closest('[data-solgo]')){ solGo(); return; }
  if (e.target.closest('[data-pwa]')){ pwaInstall(); return; }
  if (e.target.closest('[data-swclear]')){ swClear(); return; }

  if (e.target.closest('[data-probe]')){ probeRun(); return; }
  var wa = e.target.closest('[data-wa]');
  if (wa){ waSend(wa.getAttribute('data-wa'), 0); return; }
  var wc = e.target.closest('[data-wacopy]');
  if (wc){ waSend(wc.getAttribute('data-wacopy'), 1); return; }
  if (e.target.closest('[data-fhpos]')){   /* (V29.4) */
    try { navigator.geolocation.getCurrentPosition(function(p){ MYPOS = { lat:p.coords.latitude, lng:p.coords.longitude, acc:p.coords.accuracy, at:Date.now() }; render(1); }, function(){ toast(t('تعذّر تحديدُ الموقع — فعِّل الموقع للتطبيق')); }, { enableHighAccuracy:true, timeout:15000, maximumAge:30000 }); } catch (er){ toast(t('تعذّر تحديدُ الموقع')); }
    return; }
  if (e.target.closest('[data-fhcopy]')){ var tx1 = fhTodayText(fhToday()); try { navigator.clipboard.writeText(tx1); toast(t('نُسخ الملخّص')); } catch (er){ toast(t('تعذّر النسخ')); } return; }
  if (e.target.closest('[data-fhwa]')){ try { window.open('https://wa.me/?text=' + encodeURIComponent(fhTodayText(fhToday())), '_blank', 'noopener'); toast(t('فُتح واتساب بالملخّص — اختر المشرف')); } catch (er){ toast(t('تعذّر الفتح')); } return; }
  if (e.target.closest('[data-fhprep]')){ FH_PREP = Date.now();
    if (typeof basemapDownload === 'function' && typeof BASEMAP === 'object' && BASEMAP && !BASEMAP.have && !BASEMAP.loading) basemapDownload().then(function(){ render(1); });
    var pb = document.querySelector('[data-pull]'); if (pb && pb.click) pb.click();
    toast(t('يُجهَّز اليوم: خريطةُ الجهاز وآخرُ البيانات — أبقِ التطبيقَ مفتوحًا على الشبكة دقيقة')); render(1); return; }
  var svc = e.target.closest('[data-svcopy]'); if (svc){ svCopyFrom(svc.getAttribute('data-svcopy')); render(1); return; }
  var nsc = e.target.closest('[data-nschal]');   /* (V29.7) تحدياتُ الموقع الجديد */
  if (nsc){ var cv = nsc.getAttribute('data-nschal'), L = (NEWSITE.chals || []).slice(); ix = L.indexOf(cv);
    if (ix > -1) L.splice(ix, 1); else if (cv === 'لا توجد تحديات') L = [cv]; else { L = L.filter(function(x){ return x !== 'لا توجد تحديات'; }); L.push(cv); }
    NEWSITE.chals = L; render(1); return; }
  var msd = e.target.closest('[data-mailsend]');   /* (V29.0) */
  if (msd){ var mp = msd.getAttribute('data-mailsend').split('|'); mailGo(mp[1], mp[0], ''); return; }
  if (e.target.closest('[data-mailco]')){ mailGo((document.getElementById('waCo') || {}).value || WA_CO, (document.getElementById('waKind') || {}).value || WA_KIND, (document.getElementById('waWhen') || {}).value || ''); return; }
  var wsd = e.target.closest('[data-wasend]');
  if (wsd){
    pr = wsd.getAttribute('data-wasend').split('|');
    waGo(pr[1], pr[0], '', 0);
    return;
  }
  var wp = e.target.closest('[data-wapick]');
  if (wp){
    var sel = document.getElementById('waCo');
    if (sel) sel.value = wp.getAttribute('data-wapick');
    var ph = document.getElementById('waPh');
    if (ph) ph.focus();
    return;
  }

  var xl = e.target.closest('[data-xls]');
  if (xl){
    k = xl.getAttribute('data-xls');
    toast('يُجهَّز الملف…');
    xlsExport(k === '*' ? null : [k]);
    return;
  }
  if (e.target.closest('[data-expgo]')){
    var picked = Array.prototype.filter.call(document.querySelectorAll('.expCk'), function(c){
      return c.checked && !c.disabled;
    }).map(function(c){ return c.getAttribute('data-k'); }).filter(expAllowed);   /* الشاشةُ تُرشِّح والمعالجُ يحرس */
    if (!picked.length){ toast(t('اختر قسمًا واحدًا على الأقل')); return; }
    var fmt = (document.getElementById('expFmt') || {}).value || 'xlsx';
    EXP_OPEN = false; render();
    toast(t('يُجهَّز الملف…'));
    /* كان الاختيارُ يُقرأ ولا يُستعمَل: من اختار PDF نزل له إكسل — أو لم ينزل شيء */
    if (fmt === 'xlsx' || fmt === 'both') xlsExport(picked);
    if (fmt === 'pdf' || fmt === 'both') expPdf(picked);
    return;
  }
  var kz = e.target.closest('[data-kmz]');
  if (kz){ kmzExport(kz.getAttribute('data-kmz')); return; }
  return CLICK_NEXT;
}
/* onDocClick — الجزء 8 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: tpl، impgo، impx، usrrolef، months، crew، role، kmz، repside، repgo، reppack، sop، hseadd، ncradd، ncrok، ipcadd، ipcok، ipcpay، baseset، chgadd، chgok، chgno، stab، perfview، lasn، dsch، ddone، navx، move، movex، smark، fmark، psel، insform، asn، drvsave، drvtest، help، locate، newsite، … */
function onDocClickPart8(e){
  var pid;   /* تُكتب هنا قبل أن تُقرأ */
    var tp = e.target.closest('[data-tpl]');
  if (tp){ impTemplate(tp.getAttribute('data-tpl')); return; }
  if (e.target.closest('[data-impgo]')){
    var n = impApply();
    render();
    toast(nm(n) + ' ' + t('صفًّا حُفظ'));
    return;
  }
  if (e.target.closest('[data-impx]')){ IMP_PREVIEW = null; render(); return; }

  var urf = e.target.closest('[data-usrrolef]');
  if (urf){ USR.role = urf.getAttribute('data-usrrolef'); render(1); return; }

  var mo = e.target.closest('[data-months]');
  if (mo){ PLAN_MONTHS = +mo.getAttribute('data-months'); render(); return; }

  var cw = e.target.closest('[data-crew]');
  if (cw){ CREW_VIEW = cw.getAttribute('data-crew'); render(); return; }

  /* الحجبُ في العرض وحده يسقط بأداة المطوّر — فالمعالجُ يسأل أيضًا */
  var rl0 = e.target.closest('[data-role]');
  if (rl0 && !may('users')){ toast(t('تبديلُ الأدوار للمهندس وحده')); return; }
  if (e.target.closest('[data-kmz]') && !may('exportAll')){
    toast(t('التصديرُ الشامل للمهندس وحده')); return; }
  var rl = e.target.closest('[data-role]');
  if (rl){ ROLE = rl.getAttribute('data-role'); OPEN = {}; render(); return; }

  /* ── الإسناد ── */
  var rs = e.target.closest('[data-repside]');
  if (rs){ EXP.repSide = rs.getAttribute('data-repside'); render(1); return; }
  var rg = e.target.closest('[data-repgo]');
  if (rg){ repGen(rg.getAttribute('data-repgo')); return; }
  var rp = e.target.closest('[data-reppack]');
  if (rp){ repPack(rp.getAttribute('data-reppack')); return; }
  var sp = e.target.closest('[data-sop]');
  if (sp){ SOP_CUR = sp.getAttribute('data-sop'); render(1); return; }

  if (e.target.closest('[data-hseadd]')){ hseAdd(); return; }
  if (e.target.closest('[data-ncradd]')){ ncrAdd(); return; }
  var nok = e.target.closest('[data-ncrok]');
  if (nok){ ncrClose(+nok.getAttribute('data-ncrok')); return; }
  if (e.target.closest('[data-ipcadd]')){ ipcAdd(); return; }
  var iok = e.target.closest('[data-ipcok]');
  if (iok){ ipcStep(+iok.getAttribute('data-ipcok'), 'معتمد'); return; }
  var ipy = e.target.closest('[data-ipcpay]');
  if (ipy){ ipcStep(+ipy.getAttribute('data-ipcpay'), 'مصروف'); return; }

  if (e.target.closest('[data-baseset]')){
    baseSet(); toast(t('جُمّد خط الأساس')); render(1); return;
  }
  if (e.target.closest('[data-chgadd]')){ chgAdd(); return; }
  var cok = e.target.closest('[data-chgok]');
  if (cok){ chgDecide(+cok.getAttribute('data-chgok'), 1); return; }
  var cno = e.target.closest('[data-chgno]');
  if (cno){ chgDecide(+cno.getAttribute('data-chgno'), 0); return; }

  var stb = e.target.closest('[data-stab]');
  if (stb){ STAGE_TAB = stb.getAttribute('data-stab'); render(1); return; }
  var pfv = e.target.closest('[data-perfview]');
  if (pfv){ PERF_VIEW = pfv.getAttribute('data-perfview'); render(1); return; }

  var la = e.target.closest('[data-lasn]');
  if (la){ FIELD_MODE = la.getAttribute('data-lasn'); selClear(); ASN_OPEN = true;
           CUR = 'req'; render(1); return; }
  var ds = e.target.closest('[data-dsch]');
  if (ds){ disSchedule(ds.getAttribute('data-dsch')); return; }
  var dd = e.target.closest('[data-ddone]');
  if (dd){ var dp = dd.getAttribute('data-ddone').split('|'); disComplete(dp[0], dp[1]); return; }

  if (e.target.closest('[data-navx]')){ document.body.classList.remove('nav-open'); return; }

  var mv = e.target.closest('[data-move]');
  if (mv){ moveStart(mv.getAttribute('data-move')); return; }
  if (e.target.closest('[data-movex]')){ MOVE_ID=''; render(1); return; }
  var sm2 = e.target.closest('[data-smark]');
  if (sm2){ markSurvey(sm2.getAttribute('data-smark')); return; }
  var fm2 = e.target.closest('[data-fmark]');
  if (fm2){ var pp=fm2.getAttribute('data-fmark').split('|'); markInstall(pp[0],pp[1]); return; }
  var ps = e.target.closest('[data-psel]');
  if (ps){ pid=ps.getAttribute('data-psel');
           if (!asnOf(pid)) selToggle(pid); else toast(t('هذه النقطة مُسندة بالفعل'));
           render(1); if (MAP) mapPaint(); return; }
  var inf = e.target.closest('[data-insform]');
  if (inf){ formGo(inf.getAttribute('data-insform')); CUR='insForm'; POP_OPEN=false; render(1); return; }

  var an = e.target.closest('[data-asn]');
  if (an){
    ASN_OPEN = an.getAttribute('data-asn') === '1';
    /* لوحُ الإسناد يُرسَم في «طلبات الزيارة». وكان الشرطُ `CUR !== 'req'`
       يكفي يومَ كانت «توزيع الفرق» صفحةً مستقلّة: يُنقَل فاتحُه إليها فيرى
       اللوح. ولمّا صارتا شريحتين في صفحةٍ واحدة صار CUR هو 'req' في
       الحالين — فمن ضغط «أسند لفني» من شريحة التوزيع بقي حيث لا لوحَ
       يُرى، والزرُّ يعمل بلا أثر. الانتقالُ بـgoPage يفتح شريحةَ الطلبات. */
    if (ASN_OPEN && CUR !== 'map') goPage('req');
    render(1); return;
  }
  if (e.target.closest('[data-drvsave]')){ drvSave(); return; }
  if (e.target.closest('[data-drvtest]')){ drvTest(); return; }

  var hp = e.target.closest('[data-help]');
  if (hp){ HELP_OPEN = hp.getAttribute('data-help') === '1'; render(1); return; }
  if (e.target.closest('[data-locate]')){ mapLocate(); return; }
  if (e.target.closest('[data-newsite]')){ CUR = 'newsite'; render(1); return; }
  if (e.target.closest('[data-nsloc]')){ nsCapture(); return; }
  var nco = e.target.closest('[data-nsco]');
  if (nco){ NS_CO_OPEN = nco.getAttribute('data-nsco') === '1'; NS_CO_Q = ''; render(1); return; }
  var ncp = e.target.closest('[data-nscopick]');
  if (ncp){ NEWSITE.co = ncp.getAttribute('data-nscopick'); NEWSITE.coReq = '';
            NS_CO_OPEN = false; render(1); return; }
  return CLICK_NEXT;
}
/* onDocClick — الجزء 9 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: nscoreq، pull، nssave، apick، akind، asnmode، asngo، asnload، asnmap، selmap، selmode، selall، selnone، asnq، sitesall، myonly، mymap، tkok، tkrm، sat، gmsave، gmclear، m3، mfilt، mclear، co، cogo، c، exp، expall */
function onDocClickPart9(e){
  var aq = e.target.closest('[data-asnq]');   /* بحثٌ صرف — يُعاد حسابُه */
  var apk = e.target.closest('[data-apok]');   /* بحثٌ صرف — يُعاد حسابُه */
  var L;   /* تُكتب هنا قبل أن تُقرأ */
    if (e.target.closest('[data-nscoreq]')){ nsCoRequest(); return; }
  if (e.target.closest('[data-pull]')){
    /* لا تُعاد بناءُ الشاشة إن كنّا على الخريطة: `render` يُنشئ الخريطةَ من
       أولها فتعود إلى موضعها الأول — ومن كان يقرأ مربعًا بعينه يفقده. */
    SYNC.pullAsk = true; SYNC.pullLast = 0; SYNC.left = SYNC.cycle; FB._staticAt = 0;
    toast(t('تُزامَن الآن…'));
    var smb = document.getElementById('syncM'); if (smb) smb.classList.add('busy');
    CORE.flush();
    pullDelta().then(function(n){
      var smb2 = document.getElementById('syncM'); if (smb2) smb2.classList.remove('busy');
      toast(n ? (nm(n) + ' ' + t('سجلًّا وصل')) : t('كلُّ شيءٍ مُزامَن'));
      statBump();
      if (CUR === 'map'){
        syncBadge();
        if (typeof mapPaint === 'function') mapPaint();
      } else render(1);
    });
    return;
  }
  if (e.target.closest('[data-nssave]')){ nsSave(); return; }

  apk = e.target.closest('[data-apick]');
  if (apk){ ASN_PICK = apk.getAttribute('data-apick') === '1'; ASN_OPEN = false; render(1); return; }
  var akd = e.target.closest('[data-akind]');
  if (akd){ asnPickKind(akd.getAttribute('data-akind')); return; }

  var amd = e.target.closest('[data-asnmode]');
  if (amd){ ASN_MODE = amd.getAttribute('data-asnmode'); render(1); return; }
  if (e.target.closest('[data-asngo]')){ asnCommit(); return; }
  if (e.target.closest('[data-asnload]')){ asnLoad(curTech()); return; }
  if (e.target.closest('[data-asnmap]')){
    MAP_SELECT = true; ASN_OPEN = false; CUR = 'map'; render(1); return;
  }
  var sm = e.target.closest('[data-selmap]');
  if (sm){ MAP_SELECT = sm.getAttribute('data-selmap') === '1';
           if (!MAP_SELECT) selClear();
           render(1); if (MAP) mapPaint(); return; }
  var smo = e.target.closest('[data-selmode]');
  if (smo){ SEL_MODE = smo.getAttribute('data-selmode') === '1';
            if (!SEL_MODE) selClear(); render(1); return; }
  if (e.target.closest('[data-selall]')){
    L = SITE_Q ? siteSearch(SITE_Q, 400).filter(filtPass) : filtered().slice(0, PG_Q ? 5000 : 200);
    selAll(L); render(1); return;
  }
  if (e.target.closest('[data-selnone]')){ selClear(); render(1); if (MAP) mapPaint(); return; }
  if (e.target.closest('[data-asnq]')){
    aq = document.getElementById('asnQ');
    SITE_Q = aq ? aq.value : ''; render(1);
    var nq = document.getElementById('asnQ');
    if (nq){ nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); }
    return;
  }
  var sal = e.target.closest('[data-sitesall]');
  if (sal){ SITES_ALL = sal.getAttribute('data-sitesall') === '1'; render(1); return; }
  var my = e.target.closest('[data-myonly]');
  if (my){ MY_ONLY = my.getAttribute('data-myonly') === '1'; render(1); if (MAP) mapPaint(); return; }
  if (e.target.closest('[data-mymap]')){ MY_ONLY = true; CUR = 'map'; render(1); return; }
  var tko = e.target.closest('[data-tkok]');
  if (tko){ var tk = STATE.tasks[tko.getAttribute('data-tkok')];
            if (tk){ tk.status = 'معتمد'; CORE.set('tasks', tk.id, tk);
                     logEvent('اعتماد مهمة — ' + tk.site); statBump(); toast(t('اعتُمد')); }
            render(1); return; }
  var tkr = e.target.closest('[data-tkrm]');
  if (tkr){ var tkx = STATE.tasks[tkr.getAttribute('data-tkrm')];   /* (V36.4) الجدولةُ تُحذَف؛ المنجَزُ لنقطةٍ رُكّبت لا */
            if (tkx && /تم|معتمد|منجز/.test(String(tkx.status || '')) && siteLocked(tkx.site)){ toast(t('مهمةٌ منجزةٌ لنقطةٍ') + ' ' + t(siteLocked(tkx.site)) + ' — ' + t('لا تُحذَف')); return; }
            CORE.rm('tasks', tkr.getAttribute('data-tkrm')); statBump();
            toast(t('أُلغيت')); render(1); return; }

  var sa = e.target.closest('[data-sat]');
  if (sa){ mapSat(!MAP_SAT); render(1); if (MAP) mapPaint(); m3Restyle(); return; }
  if (e.target.closest('[data-gmsave]') || e.target.closest('[data-gmclear]')){   /* (V27.6) مفتاحُ خرائط جوجل */
    if (!may('settings')){ toast(t('الإعداداتُ للمهندس فما فوق')); return; }
    var gi = document.getElementById('gmKey'), gv = e.target.closest('[data-gmclear]') ? '' : String((gi && gi.value) || '').trim().slice(0, 80);
    CFG.gmaps = { key:gv }; CORE.set('cfg', 'gmaps', { key:gv }); GMAP.fail = false; GMAP.api = null;
    logEvent(gv ? 'مفتاحُ خرائط جوجل — ضُبط' : 'مفتاحُ خرائط جوجل — أُزيل', ''); toast(t(gv ? 'حُفظ المفتاح — تُعرَض خرائطُ جوجل على الأجهزة كلِّها' : 'أُزيل المفتاح'));
    if (MAP) basemapSwap(); render(1); return; }
  if (e.target.closest('[data-m3]')){ m3Toggle(); return; }
  var mf = e.target.closest('[data-mfilt]');
  if (mf){ MAP_FILT_OPEN = mf.getAttribute('data-mfilt') === '1'; render(1); return; }
  if (e.target.closest('[data-mclear]')){
    /* كلُّ المرشِّحات تُمسَح — كان يسقط منها «الحالة» فتبقى الخريطةُ مرشَّحةً
       بعد «مسح التصفية»، ومعها الآن «المسار» (V17.51) */
    FILT = { zone:'', type:'', work:'', life:'', route:'' }; MAP_FILT_OPEN = false;
    render(1); if (MAP) mapPaint(); return;
  }

  var co = e.target.closest('[data-co]');
  if (co){
    CO_OPEN = co.getAttribute('data-co') === '1';
    /* من فتح الاختيارَ أراد أن يرى الألوانَ — فتُشعَل الطبقةُ معه */
    if (CO_OPEN) CO_MODE = true;
    statBump(); render(); return;
  }
  var cg = e.target.closest('[data-cogo]');
  if (cg){
    if (cg.getAttribute('data-cogo') === '1'){
      CO_SEL = Array.prototype.filter.call(document.querySelectorAll('.coRow'), function(r){
        return r.querySelector('.coCk').checked;
      }).map(function(r){ return r.getAttribute('data-c'); });
    } else { CO_SEL = []; }
    CO_OPEN = false; render(); return;
  }
  var ex = e.target.closest('[data-exp]');
  if (ex){ EXP_OPEN = ex.getAttribute('data-exp') === '1'; render(); return; }
  var ea = e.target.closest('[data-expall]');
  if (ea){
    var on = ea.getAttribute('data-expall') === '1';
    Array.prototype.forEach.call(document.querySelectorAll('.expCk'), function(c){ c.checked = on; });
    return;
  }
  return CLICK_NEXT;
}

document.addEventListener('click', onDocClick);

/* الحقلُ في خليةٍ وسمُه عنوانُ عموده وصفُّه — يُنسَب إليهما فيقرؤه القارئُ الصوتي */
function labelCells(root){
  var tbs = root.querySelectorAll('.data-table');
  for (var i = 0; i < tbs.length; i++){
    var heads = tbs[i].querySelectorAll('thead th');
    var rows  = tbs[i].querySelectorAll('tbody tr');
    for (var r = 0; r < rows.length; r++){
      var cells = rows[r].children;
      var first = (cells[0] && cells[0].textContent.trim().split('\n')[0]) || '';
      for (var cI = 0; cI < cells.length; cI++){
        var col = (heads[cI] && heads[cI].textContent.trim()) || '';
        var fs = cells[cI].querySelectorAll('input,select,textarea');
        for (var f = 0; f < fs.length; f++){
          if (fs[f].getAttribute('aria-label')) continue;
          fs[f].setAttribute('aria-label',
            (col ? col + (first ? ' — ' + first.slice(0, 40) : '') : first) || t('حقل'));
        }
      }
    }
  }
}

function toast(label){
  var old = document.getElementById('nskToast');
  if (old) old.remove();
  var el = document.createElement('div');
  el.id = 'nskToast';
  el.setAttribute('role','status');
  /* لا ذيلَ بعد اليوم: «في المعاينة: لا فعل حقيقي» كانت تُذيَّل بها كلُّ
     رسالةٍ — أُزيلت في V14.26 وعادت، فحُرست بفحصٍ يمنع رجوعَها. */
  el.textContent = label;
  el.style.cssText = 'position:fixed;inset-block-end:20px;inset-inline:0;margin-inline:auto;'
    + 'width:max-content;max-width:88vw;background:var(--sidebar);color:var(--sidebar-ink);'
    + 'padding:11px 18px;border-radius:99px;font-size:13px;z-index:200;'
    + 'box-shadow:0 8px 28px rgba(0,0,0,.45);text-align:center';
  document.body.appendChild(el);
  setTimeout(function(){ if (el.parentNode) el.remove(); }, 2200);
}

/* ═══ عجلةُ الفأرة لا تكتب أرقامًا (V17.17) ═══
   حقلُ الرقم في المتصفّح يتغيّر بالعجلة إن كان تحت المؤشِّر ومركَّزًا —
   فيمرّر المستخدمُ الصفحةَ فتُكتَب قيمةٌ لم يقصدها في نسبةِ إنجازٍ أو سعرٍ
   أو زمن. تُفقَد البؤرةُ عند العجلة فلا تُكتَب إلا بيدٍ قاصدة. */
document.addEventListener('wheel', function(e){
  var el = e.target;
  if (el && el.tagName === 'INPUT' && el.type === 'number' && el === document.activeElement) el.blur();
}, { passive:true });

document.addEventListener('change', function(e){
  if (e.target && e.target.closest && e.target.closest('[data-vcn],[data-vcw],[data-vcp],[data-vco]')) catDraftCatch(e);   /* (V37.4) */
  var t0 = e.target;
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-fontup')){ fontUp(t0.getAttribute('data-fontup'), t0.files && t0.files[0]); return; }   /* (V28.9) */
  if (t0 && t0.hasAttribute && (t0.hasAttribute('data-expsg') || t0.hasAttribute('data-expst'))){ EXP.scope[t0.hasAttribute('data-expsg') ? 'g' : 't'] = t0.value; render(1); return; }   /* (V29.0) */
  var wdyF = t0 && t0.id ? ({ 'wdyMon':'mon', 'wdyDay':'day', 'wdyH1':'h1', 'wdyH2':'h2' })[t0.id] : '';   /* (V24.0) مرشّحاتُ ملخص العمل اليومي */
  if (wdyF){ WDY[wdyF] = (wdyF === 'h1' || wdyF === 'h2') ? +t0.value : t0.value; if (wdyF === 'mon') WDY.day = ''; WDY.pg = 1; render(1); return; }
  if (t0 && t0.id === 'asnTo'){ ASN_TO = t0.value; render(1); return; }
  /* لونُ النوع وشكلُه: يُحفَظان عند الاختيار لا مع كلِّ حركةٍ في المنتقي (V17.60) */
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-tyc')){ typeSet(t0.getAttribute('data-tyc'), { c:t0.value }); render(1); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-tys')){ typeSet(t0.getAttribute('data-tys'), { s:t0.value }); render(1); return; }
  /* المسافةُ تُكتَب بلا إعادة بناء، وعند الخروج من الحقل يُحدَّث اللوحُ كلُّه (V17.58) */
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-rt') && String(t0.tagName).toUpperCase() === 'INPUT'){ render(1); return; }
  /* جدولُ المتابعة: إنجازُ بندٍ يُكتب ويُرفَع فورًا؛ وملفُّ الاستيراد */
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-kmifile')){ if (t0.files && t0.files[0]) kmiImport(t0.files[0]); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-kmiz')){ KMI_ZONE = t0.value; return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-kmit')){ KMI_TYPE = t0.value; return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-kmiw')){ KMI_WORK = t0.value.trim(); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-kmick') && KMI){
    var ix = +t0.getAttribute('data-kmick');
    if (KMI.rows[ix]) KMI.rows[ix].take = !!t0.checked;
    return;
  }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-mintype')){
    /* cfgSet(المسار، المفتاح، القيمة): المفتاحُ هو النوع — فيُرفَع ما تغيّر وحدَه بدمج */
    cfgSet('minType', t0.getAttribute('data-mintype'), +t0.value || 0); toast(t('حُفظ')); render(1); return;
  }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-wbspct')){ wbsSetPct(t0.getAttribute('data-wbspct'), t0.value); render(1); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-wtst')){ wtSet(t0.getAttribute('data-wtst'), { st:t0.value }); toast(t(t0.value)); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-wtfile')){ if (t0.files && t0.files[0]) wtImport(t0.files[0]); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-wbsfile')){ if (t0.files && t0.files[0]) wbsImport(t0.files[0]); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-tname')){
    var tmn = teamOf(CTEAM_CUR);
    if (tmn){ tmn.n = t0.value || tmn.n; CORE.dirty('teams', tmn.id, tmn); render(1); }
    return;
  }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-ns')){
    var nsk = t0.getAttribute('data-ns');
    NEWSITE[nsk] = t0.value;
    /* (V29.7) تغييرُ المشعر أو النوع أو المركز يعيد رسمَ النموذج — كانت حقولُ المخيم تبقى ظاهرةً بعد اختيار نوعٍ آخر */
    if (nsk === 'type'){ NEWSITE.chals = []; if (t0.value === 'LPR' && !/التفويج|النوار/.test(NEWSITE.zone)) NEWSITE.zone = 'مواقع التفويج'; }
    if (nsk === 'zone' || nsk === 'type' || nsk === 'center') render(1);
    return;
  }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-share')){
    var tm = teamOf(CTEAM_CUR), m = tm.members[+t0.getAttribute('data-share')];
    if (m){ m.share = cfgN(t0.value); CORE.dirty('teams', tm.id, tm); render(1); }
    return;
  }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-mrole')){
    var tm2 = teamOf(CTEAM_CUR), m2 = tm2.members[+t0.getAttribute('data-mrole')];
    if (m2){ m2.role = t0.value; CORE.dirty('teams', tm2.id, tm2); render(1); }
    return;
  }
  var el = e.target;
  if (el && el.hasAttribute){
    if (el.hasAttribute('data-nsphoto')){
      var nf = el.files && el.files[0];
      if (!nf) return;
      toast(t('تُضغط الصورة…'));
      shrink(nf, 1280, 0.72).then(function(p){
        if (!p){ toast(t('تعذّرت قراءة الصورة')); return; }
        NEWSITE.photos[el.getAttribute('data-nsphoto')] = p;
        render(1);
      });
      return;
    }
    /* صورةُ التجربة تصعد فورًا بالخطِّ نفسِه تحت معرّف التجربة (V17.73) */
    if (el.hasAttribute('data-trph')){
      var tf = el.files && el.files[0], tid = el.getAttribute('data-trph');
      if (!tf) return;
      toast(t('تُضغط الصورة…'));
      shrink(tf, 1280, 0.72).then(function(p3){
        if (!p3){ toast(t('تعذّرت قراءة الصورة')); return; }
        photoQueue('TRIAL-' + tid, 'trial', p3.d);
        logEvent('صورةُ تجربة — ' + tid, 'TRIAL-' + tid);
        toast(t('صعدت الصورةُ إلى طابور الرفع')); render(1);
      });
      return;
    }
    /* صورةُ الفكِّ والصيانة — مخزنُ كلِّ نموذجٍ على حدة */
    if (el.hasAttribute('data-disph') || el.hasAttribute('data-mntph')){
      var isD = el.hasAttribute('data-disph');
      var kk = el.getAttribute(isD ? 'data-disph' : 'data-mntph');
      var nf2 = el.files && el.files[0];
      if (!nf2) return;
      toast(t('تُضغط الصورة…'));
      shrink(nf2, 1280, 0.72).then(function(p2){
        if (!p2){ toast(t('تعذّرت قراءة الصورة')); return; }
        (isD ? DISF : MNTF).photos[kk] = p2;
        render(1);
      });
      return;
    }
    if (el.hasAttribute('data-pkqty')){   /* (V23.1) كميةُ سطرٍ في منتقي الأجهزة — صفرٌ يرفع السطر */
      var pc = el.getAttribute('data-pkqty'), pv = Math.max(0, Math.round(cfgN(el.value) || 0));
      if (pv > 0) SOL_LINES[pc] = pv; else delete SOL_LINES[pc];
      render(1); return;
    }
    if (el.hasAttribute('data-svqadd')){   /* (V22.8) صورةٌ أو أكثر بنوعها */
      var fl = el.files ? Array.prototype.slice.call(el.files) : [], ak = (document.getElementById('svqPhKind') || {}).value || 'extra', aid = SVQ.id;
      if (!fl.length || !aid) return;
      toast(t('تُضغط الصور…'));
      fl.reduce(function(pr, f){ return pr.then(function(){ return shrink(f, 1280, 0.72).then(function(p){ if (p) svqPhoto(aid, ak, p); }); }); }, Promise.resolve()).then(function(){ render(1); });
      return;
    }
    if (el.hasAttribute('data-svqph')){   /* (V22.7) صورةٌ من لوح تعديل المسح */
      var qf = el.files && el.files[0], qk = el.getAttribute('data-svqph'), qid = SVQ.id;
      if (!qf || !qid) return;
      toast(t('تُضغط الصورة…'));
      shrink(qf, 1280, 0.72).then(function(p){
        if (!p){ toast(t('تعذّرت قراءة الصورة')); return; }
        if (svqPhoto(qid, qk, p)) render(1);
      });
      return;
    }
    if (el.hasAttribute('data-photo')){
      var file = el.files && el.files[0];
      if (!file) return;
      toast(t('تُضغط الصورة…'));
      shrink(file, 1280, 0.72).then(function(p){
        if (!p){ toast(t('تعذّرت قراءة الصورة')); return; }
        FORM.photos[el.getAttribute('data-photo')] = p;
        SVD.dirty = true; svDraftSave();   /* (V25.9) */
        render();
      });
      return;
    }
    if (el.hasAttribute('data-form')){ FORM[el.getAttribute('data-form')] = el.value; SVD.dirty = true; svDraftSoon(); return; }
    if (el.hasAttribute('data-part')){ FORM.parts[el.getAttribute('data-part')] = el.value; render(); return; }
    if (el.hasAttribute('data-simw')){ simState().w[el.getAttribute('data-simw')] = +el.value || 0; simSave(); render(1); return; }
    if (el.hasAttribute('data-simt')){ simState()[el.getAttribute('data-simt')] = +el.value || 0; simSave(); render(1); return; }
    if (el.hasAttribute('data-fch') || el.hasAttribute('data-mchalf')){
      var fa = (el.getAttribute('data-fch') || el.getAttribute('data-mchalf')).split('|'), fv = String(el.value || '').slice(0, 600);
      if (el.hasAttribute('data-fch')){ var cf = Object.assign({}, (mfuData().fch || {})[fa[0]] || {}); cf[fa[1]] = fv; cf.at = Date.now(); cf.by = STATE.meta.name || ''; cf.hist = mfuHist(cf, fa[1], fv); mfuPut('fch', fa[0], cf); }
      else { var mc = mfuList('chal').filter(function(x){ return x.id === fa[0]; })[0]; if (mc){ var mn = Object.assign({}, mc); delete mn.id; mn[fa[1] === 'owner' ? 'o' : fa[1]] = fv; mn.at = Date.now(); mn.hist = mfuHist(mc, fa[1], fv); mfuPut('chal', fa[0], mn); } }
      if (el.tagName === 'SELECT') render(1); return;
    }
    if (el.hasAttribute('data-tfdf')){ TFD.f = +el.value || 0; if (typeof TFW === 'object'){ TFW.f = TFD.f; tfwPaint(); } render(1); return; }   /* (V28.0) */
    if (el.hasAttribute('data-tfdd')){ TFD.d = el.value === 'back' ? 'back' : 'go'; if (typeof mapPaint === 'function') mapPaint(); render(1); return; }
    if (el.hasAttribute('data-mfuprn')){ var pk = el.getAttribute('data-mfuprn'); pv = String(el.value || '').trim().slice(0, 40); MFU.prn = ''; if (pv && pv !== mfuPartyLabel(pk)){ mfuPut('party', pk, Object.assign({}, mfuPartyRaw(pk) || {}, { t:pv, at:Date.now() })); logEvent('تعديلُ اسم جهةٍ معالجة — ' + pk + ' → ' + pv); } render(1); return; }   /* (V26.8) */
    if (el.hasAttribute('data-mfuown') || el.hasAttribute('data-mfuchalst') || el.hasAttribute('data-mfureqst') || el.hasAttribute('data-mfurequ')){
      if (el.hasAttribute('data-mfuown')){ var oc = el.getAttribute('data-mfuown'); if (mfuParties().indexOf(el.value) > -1) mfuPut('own', oc, el.value); render(1); return; }
      var sec = el.hasAttribute('data-mfuchalst') ? 'chal' : 'req', fid = el.getAttribute(el.hasAttribute('data-mfuchalst') ? 'data-mfuchalst' : (el.hasAttribute('data-mfureqst') ? 'data-mfureqst' : 'data-mfurequ'));
      var cur0 = mfuList(sec).filter(function(x){ return x.id === fid; })[0]; if (!cur0) return;
      var nx = Object.assign({}, cur0); delete nx.id; nx.at = Date.now();
      if (el.hasAttribute('data-mfurequ')) nx.u = String(el.value || '').slice(0, 600); else nx.st = el.value;
      nx.hist = mfuHist(cur0, el.hasAttribute('data-mfurequ') ? 'u' : 'st', el.hasAttribute('data-mfurequ') ? nx.u : nx.st);
      mfuPut(sec, fid, nx); if (!el.hasAttribute('data-mfurequ')) render(1); return;
    }
    if (el.hasAttribute('data-wpst') || el.hasAttribute('data-wpstep')){
      var wpid = (el.getAttribute('data-wpst') || el.getAttribute('data-wpstep')).split('|')[0], wx = pmoList('wplan').filter(function(x){ return x.id === wpid; })[0]; if (!wx) return;
      var wn = Object.assign({}, wx); delete wn.id;
      if (el.hasAttribute('data-wpst')){ wn.st = el.value; wn.hist = mfuHist(wx, 'st', wn.st); }
      else { var si = +el.getAttribute('data-wpstep').split('|')[1]; wn.sdone = (wx.sdone || []).slice(); wn.sdone[si] = !!el.checked; var ln = wplanLines(wx.steps); if (ln.length && wn.sdone.filter(Boolean).length === ln.length && !wplanFinal(wx)){ WPLAN_ACT = { id:wpid, kind:'result' }; toast(t('اكتملت الخطوات — سجّل النتيجة الفعلية')); } }   /* (V21.3) لا تمامَ بلا نتيجة */
      pmoPut('wplan', wpid, wn); render(1); return;
    }
    if (el.hasAttribute('data-stakecur')){
      var sid = el.getAttribute('data-stakecur'), sx = pmoList('stake').filter(function(x){ return x.id === sid; })[0];
      if (sx && PMO_LEVELS.indexOf(el.value) > -1){ var sy = Object.assign({}, sx); delete sy.id; sy.cur = el.value; sy.at = Date.now(); pmoPut('stake', sid, sy); render(1); }
      return;
    }
    if (el.hasAttribute('data-camkind')){
      var cid = el.getAttribute('data-camkind'), cx = siteFind(cid);
      if (cx && may('settings') && CAM_KINDS.indexOf(el.value) > -1){ siteOvSet(cid, { cam:el.value }); cx.cam = el.value; logEvent('نوعُ الكاميرا — ' + cid + ' ← ' + el.value); statBump(); render(1); }
      return;
    }
    if (el.hasAttribute('data-serial')){
      FORM.serials[el.getAttribute('data-serial')] = el.value;
      var oth = (typeof serialOwner === 'function') ? serialOwner(el.value, FORM.site) : '';
      if (oth && !el.__saidDup){ el.__saidDup = 1; toast(t('هذا الرقمُ مسجَّلٌ على نقطةٍ أخرى') + ': ' + oth); }
      return;
    }
  }
  var f = e.target;
  if (!f || !f.hasAttribute || !f.hasAttribute('data-imp')) return;
  file = f.files && f.files[0];
  if (!file) return;
  toast('يُقرَأ الملف…');
  impRead(f.getAttribute('data-imp'), file).then(function(p){
    if (!p){ toast('تعذّرت قراءة الملف'); return; }
    render();
  });
});

document.addEventListener('input', function(e){
  if (e.target && e.target.closest && e.target.closest('[data-vcn],[data-vcw],[data-vcp],[data-vco]')) catDraftCatch(e);   /* (V37.4) مسوّدةُ محرّر التصنيفات */
  /* بحثُ الصفحة: يُصفّي المعروضَ في اللحظة — لا إعادةَ رسمٍ فلا تضيع البؤرة */
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-rt')){
    ROUTE[e.target.getAttribute('data-rt')] = e.target.value;
    /* حقلُ الكتابة لا يُعيد بناءَ اللوح (V17.58) — العددُ والخريطةُ في مكانهما؛
       والقائمةُ تُعيده لأن ما بعدها يتبدّل بها (المخيمُ حقولُه غيرُ حقول المسار) */
    if (String(e.target.tagName).toUpperCase() === 'INPUT'){ routeLive(); return; }
    render(1); return;
  }
  if (e.target && e.target.id === 'pgQ'){
    PG_Q = e.target.value;
    var bind = pgBindOf();
    if (bind){
      PG_LAST_BIND = bind;
      /* بحثُ الشاشة نفسِه: يُرشِّح البياناتِ كلَّها لا المعروضَ منها */
      bind(PG_Q.trim());
      clearTimeout(PG_T);
      PG_T = setTimeout(function(){ render(1); }, 220);   /* البؤرةُ تعود بآليةِ الرسم العامّة */
    } else pgFind(PG_Q);
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-minq')){ MIN_Q = e.target.value.trim(); clearTimeout(MIN_T); MIN_T = setTimeout(function(){ render(1); var el = document.querySelector('[data-minq]'); if (el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 250); return; }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-wtq')){ WT_Q = e.target.value.trim(); clearTimeout(WT_T); WT_T = setTimeout(function(){ render(1); var el = document.querySelector('[data-wtq]'); if (el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 250); return; }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-wbsq')){ WBS_Q = e.target.value.trim(); clearTimeout(WBS_T); WBS_T = setTimeout(function(){ var el = document.querySelector('[data-wbsq]'); render(1); var el2 = document.querySelector('[data-wbsq]'); if (el2){ el2.focus(); el2.setSelectionRange(el2.value.length, el2.value.length); } }, 250); return; }
  if (e.target && e.target.id === 'assistQ'){
    ASSIST_Q = e.target.value;
    /* (V36.1) بلاغُ المالك «البحث في المساعد بيسكرول لوحده»: كانت النافذةُ كلُّها تُستبدَل مع كلِّ حرفٍ ويُعاد تركيزُ حقلٍ جديد — فيعيد
       الآيفون حسابَ لوحة المفاتيح ويقفز بالشاشة. صارت النتائجُ وحدَها تُستبدَل (بعد ١٥٠ م.ث من آخر حرف) والحقلُ نفسُه باقٍ بتركيزه. */
    clearTimeout(assistResHtml.t);
    assistResHtml.t = setTimeout(function(){ var rs = document.getElementById('assistRes'); if (rs) rs.innerHTML = assistResHtml(); }, 150);
    return;
  }
  if (e.target && e.target.id === 'navQ'){
    NAV_Q = e.target.value;
    var nv = document.getElementById('nav');
    if (nv){
      nv.innerHTML = navHtml();
      var q = document.getElementById('navQ');
      if (q){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
    }
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-tkph')){
    techSet(e.target.getAttribute('data-tkph'), 'ph', e.target.value); return; }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-tkcrew')){
    techSet(e.target.getAttribute('data-tkcrew'), 'crew', e.target.value); render(1); return; }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-tksup')){
    techSet(e.target.getAttribute('data-tksup'), 'sup', e.target.value); render(1); return; }
  if (e.target && e.target.hasAttribute){
    var el2 = e.target;
    if (el2.hasAttribute('data-esw')){   escSet(+el2.getAttribute('data-esw'),   { w:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-esd')){   escSet(+el2.getAttribute('data-esd'),   { days:+el2.value || 1 }); return; }
    if (el2.hasAttribute('data-eswho')){ escSet(+el2.getAttribute('data-eswho'), { who:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-esto')){  escSet(+el2.getAttribute('data-esto'),  { to:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-esact')){ escSet(+el2.getAttribute('data-esact'), { act:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rca')){   raciSet(+el2.getAttribute('data-rca'),  { a:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rcr')){   raciSet(+el2.getAttribute('data-rcr'),  { R:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rcac')){  raciSet(+el2.getAttribute('data-rcac'), { A:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rcc')){   raciSet(+el2.getAttribute('data-rcc'),  { C:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rci')){   raciSet(+el2.getAttribute('data-rci'),  { I:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-lsw')){ lessSet(+el2.getAttribute('data-lsw'), { w:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-lsa')){ lessSet(+el2.getAttribute('data-lsa'), { a:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-vhp')){ vehSet(el2.getAttribute('data-vhp'), { plate:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-vhm')){ vehSet(el2.getAttribute('data-vhm'), { model:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-vhe')){ vehSet(el2.getAttribute('data-vhe'), { licExp:el2.value }); return; }
    if (el2.hasAttribute('data-vhk')){ vehSet(el2.getAttribute('data-vhk'), { kind:el2.value }); render(1); return; }
    if (el2.hasAttribute('data-vkn') || el2.hasAttribute('data-vkd') || el2.hasAttribute('data-vkc')){
      var vk = el2.getAttribute('data-vkn') || el2.getAttribute('data-vkd') || el2.getAttribute('data-vkc');
      var kk = vehKinds().filter(function(k){ return k.id === vk; })[0];
      if (kk){
        if (el2.hasAttribute('data-vkn')) kk.n = el2.value.trim();
        else if (el2.hasAttribute('data-vkd')) kk.d = el2.value.trim();
        else kk.cap = +el2.value || 1;
        vehKindSave();
      }
      return;
    }
    if (el2.hasAttribute('data-vhq')){
      VEH_Q = el2.value.trim(); render(1);
      var vq = document.getElementById('vhQ');
      if (vq){ vq.focus(); vq.setSelectionRange(vq.value.length, vq.value.length); }
      return;
    }
    var SH = { 'data-shi':'item', 'data-shqy':'qty', 'data-shs':'sup',
               'data-shst':'st', 'data-shsn':'sent', 'data-sheta':'eta', 'data-shgot':'got' };
    var shk = Object.keys(SH).filter(function(a){ return el2.hasAttribute(a); })[0];
    if (shk){
      var p3 = {}; p3[SH[shk]] = SH[shk] === 'qty' ? (+el2.value || 0) : el2.value;
      shipSet(el2.getAttribute(shk), p3);
      if (shk === 'data-shst' || shk === 'data-shgot') render(1);
      return;
    }
    if (el2.hasAttribute('data-shq')){
      SHIP_Q = el2.value.trim(); render(1);
      var sq = document.getElementById('shQ');
      if (sq){ sq.focus(); sq.setSelectionRange(sq.value.length, sq.value.length); }
      return;
    }
    if (el2.hasAttribute('data-ipn')){ ipSet(el2.getAttribute('data-ipn'), 'net',   el2.value); return; }
    if (el2.hasAttribute('data-ipr')){ ipSet(el2.getAttribute('data-ipr'), 'ipRtr', el2.value); return; }
    if (el2.hasAttribute('data-ipd')){ ipSet(el2.getAttribute('data-ipd'), 'ipRdr', el2.value); return; }
    if (el2.hasAttribute('data-ipc')){ ipSet(el2.getAttribute('data-ipc'), 'ipCam', el2.value); return; }
    if (el2.hasAttribute('data-ipq')){
      IP_Q = el2.value.trim(); render(1);
      var iq = document.getElementById('ipQ');
      if (iq){ iq.focus(); iq.setSelectionRange(iq.value.length, iq.value.length); }
      return;
    }
    if (el2.hasAttribute('data-crn')){ crewSet(el2.getAttribute('data-crn'), { n:el2.value.trim() }); render(1); return; }
    if (el2.hasAttribute('data-crk')){ crewSet(el2.getAttribute('data-crk'), { kind:el2.value }); return; }
    if (el2.hasAttribute('data-crd')){ crewSet(el2.getAttribute('data-crd'), { d:el2.value.trim() }); return; }
    if (el2.id === 'mxdZ'){
      var zw = document.getElementById('mxdZnWrap');
      if (zw) zw.style.display = el2.value === '__new' ? '' : 'none';
      return;
    }
    if (el2.hasAttribute('data-mxz')){
      zoneRename(el2.getAttribute('data-mxz'), el2.value); return;
    }
    if (el2.hasAttribute('data-mxt')){
      var p4 = el2.getAttribute('data-mxt').split('|');
      mxTypeMove(p4[0], p4[1], el2.value); return;
    }
    if (el2.hasAttribute('data-vkn')){ vehKindSet(el2.getAttribute('data-vkn'), { n:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-vkd')){ vehKindSet(el2.getAttribute('data-vkd'), { d:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-vkc')){ vehKindSet(el2.getAttribute('data-vkc'), { cap:+el2.value || 1 }); return; }
    if (el2.hasAttribute('data-tyl')){ typeSet(el2.getAttribute('data-tyl'), { l:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-tyi')){ typeSet(el2.getAttribute('data-tyi'), { i:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-jbn')){ jobSet(el2.getAttribute('data-jbn'), { n:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-jbd')){ jobSet(el2.getAttribute('data-jbd'), { d:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-jbr')){ jobSet(el2.getAttribute('data-jbr'), { role:el2.value }); render(1); return; }
    if (el2.hasAttribute('data-tkjob')){ jobAssign(el2.getAttribute('data-tkjob'), el2.value); render(1); return; }
    if (el2.hasAttribute('data-tkn')){  techSet(el2.getAttribute('data-tkn'),  { n:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-tkph')){ techSet(el2.getAttribute('data-tkph'), { ph:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-tkcr')){ techSet(el2.getAttribute('data-tkcr'), { crew:el2.value }); render(1); return; }
    if (el2.hasAttribute('data-cotel')){ coTelSet(el2.getAttribute('data-cotel'), el2.value); render(1); return; }
    if (el2.hasAttribute('data-coliaison')){ coLiaisonSet(el2.getAttribute('data-coliaison'), el2.value); return; }   /* (V28.5) بلا إعادة رسم — لا يضيع المؤشر */
    if (el2.hasAttribute('data-coemail')){ coEmailSet(el2.getAttribute('data-coemail'), el2.value); return; }   /* (V29.0) */
    if (el2.hasAttribute('data-waco')){ WA_CO = el2.value; render(1); return; }
    if (el2.hasAttribute('data-hop')){ hoSetParty(el2.getAttribute('data-hop'), el2.value); return; }
    if (el2.hasAttribute('data-hosn')){ hoSetSigner(+el2.getAttribute('data-hosn'), 'n', el2.value); return; }
    if (el2.hasAttribute('data-hosr')){ hoSetSigner(+el2.getAttribute('data-hosr'), 'role', el2.value); return; }
    if (el2.hasAttribute('data-hoso')){ hoSetSigner(+el2.getAttribute('data-hoso'), 'org', el2.value); return; }
    if (el2.hasAttribute('data-dissite')){ DISF.site = el2.value; DISF.items = {}; render(1); return; }
    if (el2.hasAttribute('data-discond')){ DISF.items[el2.getAttribute('data-discond')] = el2.value; return; }
    if (el2.hasAttribute('data-disnote')){ DISF.note = el2.value; return; }
    if (el2.hasAttribute('data-mntsite')){ MNTF.site = el2.value; render(1); return; }
    if (el2.hasAttribute('data-mntfault')){ MNTF.fault = el2.value; return; }
    if (el2.hasAttribute('data-mntact')){ MNTF.act = el2.value; return; }
    if (el2.hasAttribute('data-mntnote')){ MNTF.note = el2.value; return; }
    if (el2.hasAttribute('data-mntpart')){ MNTF.parts[el2.getAttribute('data-mntpart')] = cfgN(el2.value); return; }
    if (el2.hasAttribute('data-hsel')){ hseSet(+el2.getAttribute('data-hsel'), { lost:cfgN(el2.value) }); render(1); return; }
    if (el2.hasAttribute('data-hsew')){ hseSet(+el2.getAttribute('data-hsew'), { why:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rkp')){ riskSet(el2.getAttribute('data-rkp'), { p:Math.min(5, Math.max(1, cfgN(el2.value) || 1)) }); render(1); return; }
    if (el2.hasAttribute('data-rki')){ riskSet(el2.getAttribute('data-rki'), { i:Math.min(5, Math.max(1, cfgN(el2.value) || 1)) }); render(1); return; }
    if (el2.hasAttribute('data-rko')){ riskSet(el2.getAttribute('data-rko'), { own:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rkst')){ riskSet(el2.getAttribute('data-rkst'), { st:el2.value }); render(1); return; }
    if (el2.hasAttribute('data-tksup')){ techSet(el2.getAttribute('data-tksup'), { sup:el2.value.trim() }); return; }
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-vlgq')){
    VLOG_Q = e.target.value.trim();
    render(1);
    vq = document.getElementById('vlQ');
    if (vq){ vq.focus(); vq.setSelectionRange(vq.value.length, vq.value.length); }
    return;
  }
  if (e.target && e.target.id === 'patName'){ PAT_NAME = e.target.value; return; }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-itname')){
    itemRename(e.target.getAttribute('data-itname'), e.target.value);
    return;
  }
  /* بحثُ القوائم الطويلة: كلٌّ يحفظ نصَّه ويُعيد التركيزَ إلى مكانه بعد
     الرسم — وإلا خرج المؤشّرُ من الحقل عند كلِّ حرف. */
  var Q_MAP = { 'data-tkq':'TK_Q', 'data-itq':'IT_Q', 'data-jbq':'JB_Q', 'data-pkq':'SOL_Q', 'data-svaq':'SVA_Q', 'data-regq':'REG_Q' };
  var qk = Object.keys(Q_MAP).filter(function(a){
    return e.target.hasAttribute && e.target.hasAttribute(a); })[0];
  if (qk){
    var id3 = e.target.id, v3 = e.target.value.trim();
    if (Q_MAP[qk] === 'TK_Q') TK_Q = v3;
    else if (Q_MAP[qk] === 'IT_Q') IT_Q = v3;
    else if (Q_MAP[qk] === 'SOL_Q') SOL_Q = v3;
    else if (Q_MAP[qk] === 'SVA_Q') SVA_Q = v3;
    else if (Q_MAP[qk] === 'REG_Q') REG_Q = v3;
    else JB_Q = v3;
    render(1);
    var el3 = document.getElementById(id3);
    if (el3){ el3.focus(); el3.setSelectionRange(el3.value.length, el3.value.length); }
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-coq')){
    CO_Q = e.target.value.trim();
    render(1);
    var cq = document.getElementById('coQ');
    if (cq){ cq.focus(); cq.setSelectionRange(cq.value.length, cq.value.length); }
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-evf')){
    EVF[e.target.getAttribute('data-evf')] = e.target.value; render(1); return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-nmen')){
    var k = e.target.getAttribute('data-nmen'), v = e.target.value.trim();
    CFG.nameEn = CFG.nameEn || {};
    if (v) CFG.nameEn[k] = v; else delete CFG.nameEn[k];
    CORE.set('cfg', 'nameEn', CFG.nameEn);
    return;
  }
  if (e.target && e.target.id === 'survQ'){
    SURV_Q = e.target.value; render(1);
    sq = document.getElementById('survQ');
    if (sq){ sq.focus(); sq.setSelectionRange(sq.value.length, sq.value.length); }
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-usrq')){
    USR.q = e.target.value; render(1);
    var uq = document.getElementById('usrQ');
    if (uq){ uq.focus(); uq.setSelectionRange(uq.value.length, uq.value.length); }
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-nsq')){
    NS_CO_Q = e.target.value;
    render(1);
    var q2 = document.getElementById('nsCoQ');   /* (V36.1) كان إعلانُه في كتلة المساعد التي لم تعد تحتاجه */
    if (q2){ q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }
    return;
  }
  var el = e.target;
  if (!el || !el.hasAttribute || !el.hasAttribute('data-cfg')) return;
  cfgSet(el.getAttribute('data-cfg'), el.getAttribute('data-cfgk'), el.value);
});

document.addEventListener('change', function(e){
  var el = e.target;
  /* «من كانت معه سيارةٌ في يومٍ بعينه»: الحقلان كانا يُرسَمان بقيمتهما
     ويُقرآن في الجدول — ولا شيءَ يكتبهما. فيكتب المرءُ تاريخًا فلا يتغيّر
     شيءٌ ويظنُّ أن لا إسنادَ في ذلك اليوم. أمسكه جردُ الأزرار. */
  if (el && el.hasAttribute && el.hasAttribute('data-vlgd')){
    VLOG_D = el.value || ''; render(1); return;
  }
  if (el && el.hasAttribute && el.hasAttribute('data-mld')){
    mileDateSet(el.getAttribute('data-mld'), el.value || ''); render(); return;
  }
  if (el && el.hasAttribute && el.hasAttribute('data-cfgdate')){
    var dv = el.value ? Date.parse(el.value) : 0;
    cfgSet(el.getAttribute('data-cfgdate'), null, isFinite(dv) ? dv : 0);
    render(); return;
  }
  if (!el || !el.hasAttribute || !el.hasAttribute('data-cfg')) return;
  cfgSet(el.getAttribute('data-cfg'), el.getAttribute('data-cfgk'), el.value);
  var path = el.getAttribute('data-cfg'), key = el.getAttribute('data-cfgk');
  render();                                   /* ينتشر الأثر في كل ما بُني فوقه */
  var back = document.querySelector('[data-cfg="' + path + '"]'
    + (key ? '[data-cfgk="' + CSS.escape(key) + '"]' : ':not([data-cfgk])'));
  if (back){ back.focus(); try{ back.select(); }catch(err){} }
});

/* مزامنةٌ دوريةٌ فارقية — كلُّ دقيقتين، ولا تعمل والتطبيق مخفيّ */
/* الرفعُ كلَّ دقيقتين — رخيصٌ ولا يُقرأ فيه شيء. والسحبُ أندرُ لأنه هو الذي
   يُحاسَب: المكتبُ كلَّ خمسِ دقائق، والميدانُ كلَّ ربعِ ساعةٍ ولا يسحب إلا
   ما كتبه هو. */
/* كانت هنا دورةٌ ثانيةٌ كلَّ دقيقتين توازي عدّادَ الرأس — صارت الدورةُ واحدةً:
   العدّادُ (syncCycle) يدفع كلَّ دقيقةٍ ويسحب حين يحين موعدُ النطاق */

/* الهروبُ يغلق ما هو مفتوح، الأحدثَ فالأقدم */
document.addEventListener('keydown', function(e){
  /* Ctrl+F يفتح بحثَ الصفحة — وهو أنفعُ هنا من بحث المتصفّح (V17.23) */
  if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')){
    var q = document.getElementById('pgQ');
    if (q){ e.preventDefault(); q.focus(); q.select(); return; }
  }
  if (e.key !== 'Escape') return;
  /* أوضاعُ الرسم أوّلًا: هي التي تحجز الضغطةَ التالية (V17.53) */
  if (typeof PIN_ON !== 'undefined' && PIN_ON){ pinCancel(); return; }
  if (typeof ROUTE === 'object' && ROUTE.on){ routeCancel(); return; }
  if (QUEUE_OPEN){ QUEUE_OPEN = false; render(1); return; }
  if (ASSIST_OPEN){ ASSIST_OPEN = false; render(1); return; }
  if (HELP_OPEN){ HELP_OPEN = false; render(1); return; }
  if (POP_OPEN){ POP_OPEN = false; render(1); return; }
  if (ASN_OPEN){ ASN_OPEN = false; render(1); return; }
  if (MAP_FILT_OPEN){ MAP_FILT_OPEN = false; render(1); return; }
  if (CO_OPEN){ CO_OPEN = false; render(1); return; }
  if (EXP_OPEN){ EXP_OPEN = false; render(1); return; }
  if (document.body.classList.contains('nav-open')){ document.body.classList.remove('nav-open'); return; }
});

/* سحبةٌ أفقيةٌ على القائمة تغلقها — كما تُغلَق الأدراج */
(function(){
  var x0 = 0, y0 = 0, on = false;
  var sb = document.querySelector('.sidebar');
  if (!sb) return;
  sb.addEventListener('touchstart', function(e){
    if (!document.body.classList.contains('nav-open')) return;
    var t = e.touches[0];
    x0 = t.clientX; y0 = t.clientY; on = true;
  }, { passive:true });
  sb.addEventListener('touchend', function(e){
    if (!on) return;
    on = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    var rtl = document.documentElement.dir === 'rtl';
    /* في العربية القائمةُ يمينًا فتُغلَق بسحبٍ يمينًا، وفي الإنجليزية العكس */
    if ((rtl && dx > 0) || (!rtl && dx < 0)) document.body.classList.remove('nav-open');
  }, { passive:true });
})();

/* ═══ استقرارُ القياس على iOS ═══
   سفاري يرسم الصفحةَ ثم يتقلّص شريطُه فيتغيّر ارتفاعُ النافذة بعد أول رسمة.
   فتُحسَب الخريطةُ بارتفاعٍ ليس ارتفاعَها، وتظهر الشرائحُ مقصوصةً — ثم يخرج
   المستخدمُ ويعود فتُعاد الرسمةُ صحيحةً. والخروجُ والعودةُ ليسا حلًّا.

   `visualViewport` هو ما يتغيّر فعلًا في iOS لا `window` — فيُستمَع إليه.
   ويُعاد القياسُ عند العودة من الخلفية (`pageshow`) وعند دوران الجهاز،
   وبعد أول رسمةٍ بلحظاتٍ ليستقرَّ الشريط. */
/* ═══ (V36.1) بلاغُ المالك: «البحث في المساعد بيسكرول لفوق وتحت لوحده» ═══
   كانت نافذةُ المساعد جزءًا من كلِّ رسمة — فأيُّ رسمٍ في الخلفية (وصولُ بيانات، مزامنة، تنزيل) يستبدلها وفيها الحقلُ الذي يكتب فيه
   المستخدم: تضيع البؤرة، ويعيد الآيفون حسابَ لوحة المفاتيح فتقفز الشاشة. صارت في حاويةٍ ثابتةٍ خارج الرسم: تُبنى مرةً عند الفتح،
   وتُزال عند الإغلاق، ولا يمسّها رسمٌ آخر؛ والكتابةُ تستبدل النتائجَ وحدَها. */
/* (V37.8) اقتراحُ المالك: على جهاز الفنيّ — صورٌ معلّقةٌ أكثرَ من ساعة تُقال بشريطٍ ثابتٍ أعلى الشاشة في كلِّ صفحة (والخريطةُ معها)،
   بزرِّ «ارفع الآن». الصورُ التي ضاعت (١١٢ في عرفات) كانت على جهازين ولم تُرفع — والشريطُ يقولها قبل أن تضيع. */
/* (V37.14) نوافذُ القوائم وصورُها تُزال من مكانها — بلا رسم الصفحة */
function supRemove(){ ['supVeil', 'supBox'].forEach(function(i0){ var el0 = document.getElementById(i0); if (el0) el0.remove(); }); }
function svPopRemove(){ ['.svpop-veil', '.svpop', '#svPhoVeil', '#svPhoBox'].forEach(function(q){ document.querySelectorAll(q).forEach(function(el){ el.remove(); }); }); }
function phStaleSync(){
  var old = document.getElementById('phStale'), mins = phQueueAge(), n = (typeof PHOTO_Q === 'object' && PHOTO_Q) ? PHOTO_Q.length : 0;
  if (!n || mins < 60 || Date.now() < (phStaleSync.snooze || 0)){ if (old) old.remove(); return; }
  var html = '\u26A0 ' + esc(t('عندك')) + ' <b>' + nm(n) + '</b> ' + esc(t('صورة لم تُرفع منذ')) + ' ' + nm(Math.floor(mins / 60)) + ' ' + esc(t('ساعة')) + ' — '
    + esc(STATE.meta.online ? t('اترك التطبيق مفتوحًا على الشبكة حتى تُرفع') : t('افتح الشبكة الآن — الصورُ على جهازك وحده'))
    + ' <button type="button" class="btn btn-primary btn-sm" data-phflushnow="1">\u2B06 ' + esc(t('ارفع الآن')) + '</button>'
    + ' <button type="button" class="btn btn-quiet btn-sm" data-phstalex="1" aria-label="' + esc(t('إغلاق')) + '" style="color:#fff">\u2715</button>';   /* (V37.13) يُؤجَّل نصفَ ساعة */
  if (!old){ old = document.createElement('div'); old.id = 'phStale'; old.setAttribute('role', 'alert'); old.style.cssText = 'position:fixed;inset-inline:8px;top:calc(env(safe-area-inset-top,0px) + 6px);z-index:1900;background:#B8860B;color:#fff;border-radius:12px;padding:8px 12px;font-size:13.5px;box-shadow:0 6px 20px rgba(0,0,0,.35)'; document.body.appendChild(old); }
  if (old.innerHTML !== html) old.innerHTML = html;
}
function assistSync(){
  var host = document.getElementById('assistHost');
  if (!host){ if (!ASSIST_OPEN) return; host = document.createElement('div'); host.id = 'assistHost'; document.body.appendChild(host); }
  if (!ASSIST_OPEN){ if (host.innerHTML) host.innerHTML = ''; return; }
  if (!document.getElementById('assistPop')) host.innerHTML = assistHtml();
}
function reflow(){
  try {
    document.documentElement.style.setProperty('--vh',
      ((window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01) + 'px');
    /* (V36.1) ارتفاعُ لوحة المفاتيح على الآيفون: الورقةُ السفلية (المساعد، النوافذ) تجلس فوقها لا تحتها */
    var vv = window.visualViewport, kb = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
    document.documentElement.style.setProperty('--kb', (kb > 60 ? kb : 0) + 'px');
  } catch (e){}
  if (CUR === 'map'){
    if (typeof mapDraw === 'function') mapDraw();
    if (typeof MAP !== 'undefined' && MAP){
      try { MAP.invalidateSize(); } catch (e){}
    }
  }
}
var REFLOW_T = null;
function reflowSoon(){ clearTimeout(REFLOW_T); REFLOW_T = setTimeout(reflow, 80); }

window.addEventListener('resize', reflowSoon, { passive:true });
window.addEventListener('orientationchange', function(){ setTimeout(reflow, 250); }, { passive:true });
window.addEventListener('pageshow', reflowSoon, { passive:true });
if (window.visualViewport){
  window.visualViewport.addEventListener('resize', reflowSoon, { passive:true });
  window.visualViewport.addEventListener('scroll', reflowSoon, { passive:true });
}
/* الرسمةُ الأولى: يستقرُّ شريطُ المتصفّح بعد جزءٍ من الثانية */
[120, 400, 900].forEach(function(ms){ setTimeout(reflow, ms); });

/* `--vh` يُضبَط قبل أول رسمة: القياسُ في `reflow` يقع بعد الرسم، فالاحتياطُ
   يحتاج قيمةً موجودةً من اللحظة الأولى. */
(function(){
  try {
    document.documentElement.style.setProperty('--vh',
      ((window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01) + 'px');
  } catch (e){}
})();

(function boot(){
  var th = 'light', lg = 'ar';
  try{ th = localStorage.getItem('nsk14.theme') || 'light'; lg = localStorage.getItem('nsk14.lang') || 'ar'; }catch(e){}
  setTheme(th);
  LANG = I18N[lg] ? lg : 'ar';
  document.documentElement.lang = LANG;
  try { shellLang(); } catch(e){}
  document.documentElement.dir  = I18N[LANG].dir;
  document.body.setAttribute('data-lang', LANG);

  document.getElementById('langSel').value  = LANG;
  document.getElementById('langSel').onchange = function(){ setLang(this.value); };
  langSync();
  /* الشريطُ العلويّ: قائمةُ لغاتٍ تُبنى من `I18N` فلا تُكتَب اللغاتُ مرتين
     ولا تُنسى واحدةٌ إن أُضيفت رابعة. */
  function langPaint(){
    var mn = document.getElementById('langMenu');
    if (!mn) return;
    mn.innerHTML = Object.keys(I18N).map(function(k){
      return '<button type="button" data-setlang="' + k + '" role="option"'
        + ' aria-selected="' + (LANG === k ? 'true' : 'false') + '">'
        + '<span>' + esc(I18N[k].name) + '</span>'
        + '<span class="lg-code">' + esc(k.toUpperCase()) + '</span></button>';
    }).join('');
  }
  function langMenu(open){
    var mn = document.getElementById('langMenu'), bt = document.getElementById('langTop');
    if (!mn || !bt) return;
    if (open){ langPaint(); langSync(); }
    mn.hidden = !open;
    bt.setAttribute('aria-expanded', open ? 'true' : 'false');
    /* (V21.8) «ع لا تعمل من فوق»: القائمةُ كانت تُفتَح فعلًا، لكنّ الرأسَ على الهاتف
       (overflow-x:hidden يجعل الرأسيَّ auto) يقصّ كلَّ ما ينزل تحته — فلا يُرى منها شيء.
       صارت تُنقَل إلى الجسد وتُثبَّت تحت الحرف بإحداثيّاته، فوق الخريطة وكلِّ شيء. */
    if (open){
      try {
        if (mn.parentNode !== document.body) document.body.appendChild(mn);
        var r = bt.getBoundingClientRect(), vw = window.innerWidth || document.documentElement.clientWidth || 360;
        mn.style.position = 'fixed'; mn.style.insetInlineEnd = 'auto'; mn.style.right = 'auto';
        mn.style.top = Math.round(r.bottom + 6) + 'px';
        var mw = mn.offsetWidth || 172;
        mn.style.left = Math.round(Math.max(8, Math.min(r.right - mw, vw - mw - 8))) + 'px';
      } catch (e){ LS_ERR = e; }
    }
  }
  document.addEventListener('click', function(e){
    try { boxAction(e); } catch (e0){ BOX_ERR = e0; }   /* الصندوقُ الأسود: معرِّفُ الفعل (V17.98) */
    var op = e.target.closest('[data-langmenu]');
    if (op){ langMenu(document.getElementById('langMenu').hidden); return; }
    var pick = e.target.closest('[data-setlang]');
    if (pick){ setLang(pick.getAttribute('data-setlang')); langMenu(false); return; }
    if (!e.target.closest('.lang-pick')) langMenu(false);
  });
  var tt = document.getElementById('themeTop');
  if (tt) tt.onclick = function(){
    /* (V21.8) زرٌّ واحدٌ بدل زرّين متجاورين: داكن ← فاتح ← الشمس ← داكن */
    var cur = document.documentElement.getAttribute('data-theme');
    if (SUN_ON){ sunSet(false); setTheme('dark'); toast(t('المظهر: داكن')); }
    else if (cur !== 'light'){ setTheme('light'); toast(t('المظهر: فاتح')); }
    else { sunSet(true); toast(t('المظهر: وضع الشمس — للشاشة تحت الشمس')); }
    themeIcon();
    render(1);
  };
  themeIcon();

  document.getElementById('themeBtn').onclick = function(){
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  };
  loadSites();
  manifestInject();
  i18nThen(loginPaint);   /* (V22.0) بلغةٍ غيرِ العربية تُرسَم شاشةُ الدخول بعد وصول قاموسها */
  bootAuto();
  watchNet();
  pwaWatch();
  swInstall();
  posWatch();
  CORE.loadLocal().then(function(){
    if (!document.getElementById('login')) render();   /* إن كان دخل بالفعل */
    syncBadge();
  }).catch(function(e){
    /* تعذُّرُ قراءة المحليِّ يعني بدءًا من فراغٍ ومعه ما لم يُرفَع بعد */
    softErr('قراءة البيانات المحلية', e, 'تعذّرت قراءةُ البيانات المحفوظة على الجهاز');
  });
})();

(function(){var s=document.createElement('style');s.textContent=LOGIN_CSS;document.head.appendChild(s);})();

