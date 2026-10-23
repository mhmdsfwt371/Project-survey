/* ============================================================================
   FILE    : src/03-survey/03-survey-records-03-assign-solutions.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : Assignment from list or map, request codes, and the proposed device solution for a point before an installation request.
   DEFINES : selHas, selToggle, selClear, selIds, selAll, asnOf, asnOfTech, asnLoad, kindLabel, reqNext, solutionOf, solutionSave, solutionAppr, asnPickHtml … (+6 more)
   GLOBALS : ASN_OPEN, SEL, ASN_BASE, ASN_MODE, ASN_PICK, ASN_KIND_DEST, REQ_PREFIX, REQSEQ, ASN_TEAM
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الإسناد — من القائمة أو الخريطة ═══
   يُحدَّد ما يُراد ثم يُسند لفنيٍّ، فيراه في خريطته وحده.
   والمُسنَدُ لا يُسنَد مرةً ثانيةً — فلا يُشتّت فنيّان على نقطةٍ واحدة. */

var ASN_OPEN = false, ASN_TO = '', ASN_KIND = 'visit', ASN_WHEN = '';
var SEL = Object.create(null), SEL_N = 0;

function selHas(id){ return !!SEL[id]; }
function selToggle(id){
  if (SEL[id]){ delete SEL[id]; SEL_N--; }
  else { SEL[id] = 1; SEL_N++; }
}
function selClear(){ SEL = Object.create(null); SEL_N = 0; }
function selIds(){ return Object.keys(SEL); }


/* من أُسند إليه هذا الموقع — إن أُسند */
function asnOf(id){
  /* (V26.1) كانت تمرّ على المهامِّ كلِّها لكلِّ نقطة — ألفٌ وثمانمئةُ نقطةٍ × ستُّمئةِ مهمة = مليونُ مقارنةٍ في رسمة
     مركز التصدير وحدَه (٢٧٠ م.ث). صارت من فهرس المهامِّ نفسِه الذي يُبنى مرةً في الرسمة ويُبطَل في statBump. */
  return taskIndex()['*|' + id] || null;
}

/* ما لدى فنيٍّ في هذه الطبقة — يُفتح عليه اللوحُ فيُزاد أو يُنقَص */
function asnOfTech(who, kind){
  var out = [];
  Object.keys(STATE.tasks).forEach(function(k){
    var x = STATE.tasks[k];
    if (x.to === who && x.kind === kind && x.status !== 'معتمد') out.push(x.site);
  });
  return out;
}


var ASN_BASE = [];
var ASN_MODE = 'tech';   /* لفنيٍّ واحدٍ أو لفريقٍ يُوزَّع على أعضائه */
var ASN_PICK = false;    /* لوحُ اختيار نوع الإسناد على الخريطة */

/* لكلِّ نوعٍ وجهتُه الطبيعية: الزيارةُ لفنيٍّ يمشي وحده،
   والتركيبُ والفكُّ لفريقٍ لأنهما عملُ أيدٍ لا يدٍ واحدة. */
var ASN_KIND_DEST = { visit:'tech', install:'team', dis:'team', maint:'team' };
/* اسمُ نوع المهمة بالعربية وأيقونته — يُشتقّ من LAYERS فلا يُكتب مرتين */
function kindLabel(kind){
  var k = Object.keys(LAYERS).filter(function(n){ return LAYERS[n].kind === kind; })[0];
  return k ? (LAYERS[k].i + ' ' + t(LAYERS[k].n)) : (kind || '\u2014');
}

/* ترقيمُ الطلبات: SR للزيارة، DR للتركيب، PR للفك — رقمٌ بشريٌّ يُذكر في
   التقارير والمكالمات، منفصلٌ عن معرّف المهمة الداخلي (TK-kind-site) الذي
   لا يتغيّر ولا يتكرّر. الأنواعُ الأخرى (تهيئة، تجميع، مستودع…) بلا ترقيم —
   لم يُطلب لها. */
/* ═══ رموزُ الطلبات بلغة الميدان ═══
   كانت الرموزُ اصطلاحًا داخليًّا: DR للتركيب وPR للفكّ وIR للصرف. والميدانُ
   يقولها بمعانيها الإنجليزية المعروفة — فمن قرأ DR فهم «تسليمًا» لا
   «تركيبًا»، فيُطلَب الشيءُ باسم غيره. صارت الرموزُ تقول ما تعنيه:
     SR  Survey Request        زيارةُ مسح
     IR  Installation Request  تركيبُ نقطة
     MR  Maintenance Request   صيانةٌ في أثناء الموسم
     UR  Unplug Request        فكٌّ بعد الموسم
     DR  Delivery Request      صرفُ أصنافٍ لعهدة شخص
     CR  Configuration Request تهيئةٌ في الورشة
     AR  Assembly Request      تجميعٌ في الورشة
   والأرقامُ القديمةُ تبقى في سجلّاتها كما كُتبت — لا تُبدَّل بأثرٍ رجعيّ؛
   والعدّاداتُ تُنقَل عند الإقلاع فلا يتكرّر رقمٌ بمعنيين. */
var REQ_PREFIX = { visit:'SR', install:'IR', dis:'UR', prep:'CR', asm:'AR', maint:'MR', issue:'DR' };
var REQSEQ = { SR:0, IR:0, UR:0, CR:0, AR:0, MR:0, DR:0 };
function reqNext(kind){
  var p = REQ_PREFIX[kind];
  if (!p) return '';
  REQSEQ[p] = (REQSEQ[p] || 0) + 1;
  CORE.set('cfg', 'reqSeq', REQSEQ);
  var n = String(REQSEQ[p]);
  while (n.length < 4) n = '0' + n;
  return p + '-' + n;
}

/* ═══ حلُّ التركيب: الأجهزةُ المقترحة لنقطةٍ قبل طلب تركيبها ═══
   يُقترَح بعد اعتماد زيارتها (SR)، ويعتمده المهندسُ وحده — ولا يُتاح طلبُ
   تركيبٍ (DR) لنقطةٍ إلا بعد اعتماد حلِّها. الفكُّ لا يحتاج هذه البوابةَ:
   ما رُكِّب معروفٌ من STATE.inss[site].parts نفسها فور اختيار النقطة. */
function solutionOf(site){
  var r = STATE.inss[site];
  return (r && r.solution) || null;
}


function asnPickHtml(){
  return '<div class="pop" id="asnPick" style="width:min(420px,92vw)">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">' + esc(t('ما الذي تُسنده؟')) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">' + esc(t('اختر النوعَ فتُفتَح طبقتُه ويُضبَط من يستلمه.')) + '</p></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-apick="0" aria-label="'
    +     esc(t('إغلاق')) + '">✕</button>'
    + '</div>'
    + '<div class="pop-body">'
    + '<div class="list" style="margin:14px 0 0;border:1px solid var(--line);border-radius:var(--radius-sm)">'
    /* الصيانةُ ليست طبقةً على الخريطة (تشترك مع التركيب في نقاطه) — فكانت
       تغيب عن المنتقي، فلا يُسنَد MR إلا من «توزيع الفرق». صارت خيارًا
       خامسًا يفتح طبقةَ التركيب ويضبط النوعَ صيانةً. */
    + Object.keys(LAYERS).concat(['maint']).map(function(k){
        var isM = k === 'maint';
        var L = isM ? { n:WO_KINDS.maint.n, i:WO_KINDS.maint.i, c:LIFE.maint.c, kind:'maint' } : LAYERS[k];
        var ready = isM ? (typeof asnReadyList === 'function' ? asnReadyList('maint').length : 0)
                        : layerStats(k).ready;
        var dest = ASN_KIND_DEST[L.kind] || 'tech';
        return '<button type="button" class="list-item" style="width:100%;text-align:inherit;'
          + 'background:none;border:0;border-bottom:1px solid var(--line-2);cursor:pointer"'
          + ' data-akind="' + esc(k) + '">'
          + '<div class="li-main"><div class="li-t" style="color:' + L.c + '">'
          +   L.i + ' ' + esc(t(L.n)) + ' <span class="num">' + esc(REQ_PREFIX[L.kind] || '') + '</span></div>'
          + '<div class="li-s">' + esc(t(dest === 'team' ? 'يُسنَد لفريقٍ يُوزَّع عليه'
                                                        : 'يُسنَد لفنيٍّ واحد'))
          +   ' · ' + nm(ready) + ' ' + esc(t('جاهز')) + '</div></div>'
          + '<div class="li-end">' + (ready ? pill('متاح','ok') : pill('لا نقاط','off')) + '</div>'
          + '</button>';
      }).join('')
    + '</div>'
    + '<p class="hint">' + esc(t('لا تظهر في كلِّ طبقةٍ إلا نقاطُها: التركيبُ ما مُسح، والفكُّ ما سُلِّم، والصيانةُ ما رُكِّب.')) + '</p>'
    + '</div></div>';
}


function techNames(){
  /* TECHS صارت فارغةً منذ توحيد مصدر الأشخاص (V15.35) — القراءةُ منها
     تُرجع لا شيء. تُقرأ القائمةُ المشتقّةُ من الحسابات.
       وهي قائمةُ **من يُسنَد إليه**: الميدانيّون وحدهم. كانت تقرأ الحساباتِ
     كلَّها ثم تُضيف من الأدوار المشتقّة — فيظهر المحاسبُ والمستودعُ ومديرُ
     المشروع في منتقي الإسناد، ويُسنَد إليهم مسحٌ لن يذهبوا إليه. */
  var out = techsList().map(function(x){ return x.n; });
  /* والدورُ المشتقُّ من الوظيفة لا يُعتَدُّ به هنا: `assignRows` تُرجِع
     «فنيًّا» لكلِّ من لا وظيفةَ له — فيعود المحاسبُ ومديرُ المشروع من الباب
     الخلفيّ. العبرةُ بدور الحساب نفسِه. */
  var roleOf = {};
  Object.keys(STATE.users || {}).forEach(function(k){
    var u = STATE.users[k]; if (u && u.name) roleOf[u.name] = u.role;
  });
  assignRows().forEach(function(u){
    var r = roleOf[u[0]] || u[2];
    if (isFieldRole(r) && out.indexOf(u[0]) < 0) out.push(u[0]);
  });
  return out;
}

/* ── لوح الإسناد: قائمةٌ بتحديدٍ متعدد ── */
/* السلسلةُ تُعرَض في اللوح: من حدّد نقطةً واحدةً يرى طريقَه كاملًا قبل أن
   يضغط — لا بعد أن يُرفَض. */
function asnGateCard(){
  var ids = selIds();
  if (ids.length !== 1) return '';
  var x = siteFind(ids[0]);
  if (!x) return '';
  return gateCard(ASN_KIND, x);
}
function asnSheet(){
  var L = (typeof LAYER === 'function') ? LAYER() : { n:'المسح', pts:function(){ return 0; }, pass:function(){ return true; } };
  var base = (typeof layerFiltered === 'function') ? layerFiltered() : filtered();
  var view = SITE_Q ? siteSearch(SITE_Q, 400).filter(filtPass).filter(L.pass) : base.slice(0, PG_Q ? 5000 : 200);
  /* المحدَّدُ يُرى أوّلًا (V17.57): نقطةٌ أُضيفت الآن لتُجدوَل زيارتُها في آخر
     السجل — فلا تُبحَث في مئتي سطرٍ ولا تختفي خلف مرشِّح */
  if (SEL_N && SEL_N <= 50){
    var seen0 = {}; view.forEach(function(x){ seen0[x.id] = 1; });
    var pin0 = selIds().filter(function(id){ return !seen0[id]; }).map(siteFind).filter(Boolean);
    if (pin0.length) view = pin0.concat(view);
  }
  var techs = techNames();
  ASN_KIND = L.kind || ASN_KIND;
  if (!ASN_TO) ASN_TO = techs[0] || '';
  var have = asnOfTech(ASN_TO, L.kind).length;

  return '<div class="pop" id="asnPop" style="width:min(560px,94vw);max-height:88vh;overflow:auto">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">' + (L.i||'') + ' ' + esc(t('إسناد')) + ' — ' + esc(t(L.n)) + '</h3>'
    +   '<p class="hint" style="margin:2px 0 0">' + esc(t(L.d || '')) + '</p></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-asn="0" aria-label="'
    +     esc(t('إغلاق')) + '">✕</button>'
    + '</div>'
    + '<div class="pop-body">'

    /* من حدّد نقطةً واحدةً يرى طريقَه كاملًا قبل الضغط لا بعد الرفض */
    + asnGateCard()

    + '<div class="inline-form" style="margin:12px 0 10px">'
    +   '<input type="search" id="asnQ" value="' + esc(SITE_Q) + '" placeholder="'
    +     esc(t('ابحث بالشاخص أو المربع أو المشعر')) + '" dir="auto" style="flex:1">'
    +   btn('بحث','btn-secondary btn-sm',' data-asnq="1"')
    + '</div>'

    + catBar(0)

    + '<div class="actions" style="margin:0 0 10px">'
    +   btn('حدّد المعروض','btn-secondary btn-sm',' data-selall="1"')
    +   btn('امسح التحديد','btn-secondary btn-sm',' data-selnone="1"')
    +   '<span class="pill ' + (SEL_N ? 'acc' : '') + '">' + esc(t('محدَّد'))
    +     ' <b>' + nm(SEL_N) + '</b></span>'
    +   (SEL_N && selPts() ? '<span class="pill acc">' + esc(t('نقاط الوزن'))
    +     ' <b>' + nm(selPts()) + '</b></span>' : '')
    + '</div>'

    + '<div class="list" style="max-height:38vh;overflow:auto;border:1px solid var(--line);'
    +   'border-radius:var(--radius-sm)">'
    + (!view.length && !SITE_Q
      ? '<div style="padding:20px;text-align:center">'
        + '<p class="hint" style="margin:0 0 12px">' + esc(t(L.empty || 'لا نقاطَ في هذه الطبقة.')) + '</p>'
        + (FIELD_MODE === 'install'
          ? btn('◈ ' + t('اذهب لطبقة المسح'),'btn-primary btn-sm',' data-lasn="survey"')
          : (FIELD_MODE === 'dis'
            ? btn('◈ ' + t('اذهب لطبقة التركيب'),'btn-primary btn-sm',' data-lasn="install"') : ''))
        + '</div>'
      : '')
    + (view.length
      ? view.slice(0, 120).map(function(x){
          var d = catDefOf(x);
          var a = asnOf(x.id);
          return '<label class="list-item" style="cursor:pointer">'
            + '<input type="checkbox" data-sel="' + esc(x.id) + '"' + (selHas(x.id)?' checked':'')
            +   ((a && a.to !== curTech()) ? ' disabled' : '')
            +   ' style="width:20px;min-height:20px;flex:0 0 auto">'
            + '<div class="li-main"><div class="li-t">'
            +   (x.sign ? esc(t('شاخص')) + ' <b>' + esc(x.sign) + '</b>' : esc(x.name.slice(0, 40)))
            +   (x.sq ? ' · ' + esc(t('مربع')) + ' ' + esc(x.sq) : '')
            + '</div><div class="li-s">' + siteIdHtml(x) + '</div></div>'
            + '<div class="li-end" style="color:' + d.c + '">' + d.i + ' ' + esc(t(d.l))
            + (L.pts(x) ? '<div class="num" style="margin:2px 0 0">' + nm(L.pts(x)) + ' ' + esc(t('نقطة')) + '</div>' : '')
            +   (L.kind === 'dis' && STATE.inss[x.id] && STATE.inss[x.id].parts
                  ? '<div class="hint" style="margin:2px 0 0;max-width:150px">'
                    + Object.keys(STATE.inss[x.id].parts).map(function(c){
                        return esc(itemName(c)) + ' \u00d7' + nm(STATE.inss[x.id].parts[c]);
                      }).join('، ')
                    + '</div>' : '')
            +   (a ? '<div class="hint" style="margin:2px 0 0">'
                  + (a.to === curTech() ? '<span class="pill acc">' + esc(t('لديه')) + '</span>'
                                        : esc(t('مُسند')) + ' \u00b7 ' + esc(a.to))
                  + '</div>' : '')
            + '</div></label>';
        }).join('')
      : '<p class="hint" style="padding:18px;text-align:center;margin:0">' + esc(t('لا نتائج')) + '</p>')
    + '</div>'
    + (view.length > 120
      ? '<p class="hint">' + esc(t('يُعرض مئةٌ وعشرون — ضيّق بالفئة أو البحث')) + '</p>' : '')

    + '<div class="grid cols-3" style="margin:12px 0 0">'
    + '<div class="chips" style="margin:0 0 10px">'
    +   '<button type="button" class="chip' + (ASN_MODE==='tech'?' on':'') + '" data-asnmode="tech">'
    +     '\u25CF ' + esc(t('لفنيّ')) + '</button>'
    +   '<button type="button" class="chip' + (ASN_MODE==='team'?' on':'') + '" data-asnmode="team">'
    +     '\u25C8 ' + esc(t('لفريق')) + '</button>'
    + '</div>'
    + (ASN_MODE === 'team'
      ? '<div class="grid cols-2" style="margin:0 0 10px">'
        + '<div class="field" style="margin:0"><label>' + esc(t('الفريق')) + '</label>'
        + '<select id="asnTeam">' + TEAMS.map(function(tm){
            return '<option value="' + esc(tm.id) + '"' + (ASN_TEAM===tm.id?' selected':'') + '>'
              + esc(tm.n) + ' — ' + nm(tm.members.length) + ' ' + esc(t('أعضاء')) + '</option>';
          }).join('') + '</select></div>'
        + '<div class="field" style="margin:0"><label>' + esc(t('التوزيع')) + '</label>'
        + '<select id="asnSplit">'
        + '<option value="share">' + esc(t('بالنسب المعرَّفة')) + '</option>'
        + '<option value="even">' + esc(t('بالتساوي')) + '</option>'
        + '</select></div></div>'
        + (function(){
            var tm = teamOf(ASN_TEAM);
            return tm && tm.members.length
              ? '<p class="hint" style="margin:0 0 10px">' + esc(t('سيُوزَّع'))
                + ' <b>' + nm(SEL_N) + '</b> ' + esc(t('نقطة على'))
                + ' <b>' + nm(tm.members.length) + '</b> ' + esc(t('أعضاء'))
                + '</p>'
              : alertBox('warn','لا أعضاءَ في هذا الفريق — أضفهم من «الفرق».');
          })()
      : '')
    + (ASN_MODE === 'tech'
      ? '<div class="field" style="margin:0"><label>' + esc(t('الفني'))
    +     (have ? ' <span class="pill acc">' + esc(t('لديه')) + ' ' + nm(have) + '</span>' : '')
    +     '</label>'
    +   '<select id="asnTo" data-asnto="1">' + techs.map(function(n){
          return '<option' + (ASN_TO===n?' selected':'') + '>' + esc(n) + '</option>'; }).join('')
    +   '</select></div>'
      : '')
    + '<div class="grid cols-2" style="margin:10px 0 0">'
    +   '<div class="field" style="margin:0"><label>' + esc(t('نوع المهمة')) + '</label>'
    +   '<select id="asnKind">' + Object.keys(WO_KINDS).map(function(k){
          return '<option value="' + k + '"' + (ASN_KIND===k?' selected':'') + '>'
            + WO_KINDS[k].i + ' ' + esc(t(WO_KINDS[k].n)) + '</option>'; }).join('')
    +   '</select></div>'
    +   '<div class="field" style="margin:0"><label>' + esc(t('الموعد')) + '</label>'
    +   '<input type="date" id="asnWhen" value="' + esc(ASN_WHEN) + '"></div>'
    + '</div>'

    + (may('settings') && SEL_N && typeof selExecHtml === 'function' ? selExecHtml() : '')   /* (V37.52) الإجراءان الجماعيّان */
            + (may('settings') && SEL_N ? '<div class="field" style="margin:12px 0 0;padding:10px 0 0;border-top:1px solid var(--line)"><label>\u{1F3F7} ' + esc(t('أو انقل المحدَّد إلى تصنيف')) + '</label>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap"><select id="selType" aria-label="' + esc(t('التصنيف')) + '" style="flex:1 1 180px">' + Object.keys(typesList()).map(function(k){ return '<option value="' + esc(k) + '">' + esc(typeLabel(k)) + '</option>'; }).join('') + '</select>'
        + btn(t('انقل') + ' ' + nm(SEL_N) + ' ' + t('نقطة'), 'btn-secondary btn-sm', ' data-seltype="1"') + '</div></div>' : '')   /* (V23.0) */
    + (maySiteEdit() && SEL_N ? '<div class="field" style="margin:10px 0 0"><label>\u270E ' + esc(t('أو سمِّ المحدَّد: بدايةُ الاسم ثم رقمٌ متتابع')) + '</label>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap"><input id="selNamePfx" dir="auto" placeholder="' + esc(t('مثلًا: كاميرا وزارة LPR — عرفات —')) + '" aria-label="' + esc(t('بدايةُ الاسم')) + '" style="flex:1 1 200px">'
        + '<input id="selNameFrom" type="number" min="1" value="1" inputmode="numeric" aria-label="' + esc(t('يبدأ الترقيم من')) + '" style="width:80px">'
        + btn(t('سمِّ') + ' ' + nm(SEL_N), 'btn-secondary btn-sm', ' data-selname="1"') + '</div></div>' : '')   /* (V23.1) */
    + '<div class="actions" style="margin-top:12px">'
    +   btn(ASN_MODE === 'team'
            ? (t('وزّع') + ' ' + nm(SEL_N) + ' ' + t('نقطة على الفريق'))
            : (have ? (t('حدّث') + ' \u2190 ' + nm(SEL_N) + ' ' + t('نقطة'))
                    : (t('أسند') + ' ' + nm(SEL_N) + ' ' + t('نقطة'))),
            'btn-primary',' data-asngo="1"')
    +   (have ? btn('افتح على ما لديه','btn-secondary',' data-asnload="1"') : '')
    +   btn('حدّد من الخريطة','btn-secondary',' data-asnmap="1"')
    +   btn('إلغاء','btn-secondary',' data-asn="0"')
    + '</div>'
    + '<p class="hint">' + esc(t('المُسنَدُ لا يُحدَّد ثانيةً — فلا يُشتّت فنيّان على نقطةٍ واحدة.')) + '</p>'
    + '</div></div>';
}

function curTech(){
  return (document.getElementById('asnTo') || {}).value || ASN_TO || techNames()[0] || '';
}

/* الحفظُ توفيقٌ لا إنشاءٌ فقط: ما زِيد يُنشَأ وما نُقص يُلغى —
   فيُفتَح اللوحُ على خمسٍ فتُجعَل سبعًا أو ثلاثًا بالتحديد نفسه. */
var ASN_TEAM = 'T1';

/* التوزيعُ على أعضاء الفريق: بالنسب المعرَّفة أو بالتساوي —
   فيأخذ القائدُ نصيبَه والمساعدُ نصيبَه، ولا تُترَك نقطةٌ بلا صاحب. */
function asnTeamCommit(){
  var tm = teamOf((document.getElementById('asnTeam') || {}).value || ASN_TEAM);
  if (!tm || !tm.members.length){ toast(t('لا أعضاءَ في هذا الفريق')); return; }
  var split = (document.getElementById('asnSplit') || {}).value || 'share';
  var kind  = (document.getElementById('asnKind') || {}).value || LAYER().kind;
  var when  = (document.getElementById('asnWhen') || {}).value || '';
  var ids   = selIds().filter(function(id){ var a = asnOf(id); return !a; });
  /* طلبُ التركيب (DR) لا يُتاح لنقطةٍ إلا بعد اعتماد حلِّها — فلا يُرسَل
     فريقٌ بعدَّةٍ لم تُعتمد بعد. */
  /* الفحصُ بالسلسلة لكلِّ نوعٍ — لا للتركيب وحده — والرفضُ يسمّي الخطوة */
  var blockedSol = 0, firstBlock = null;
  var okIds = ids.filter(function(id){
    var g = gateFirst(kind, siteFind(id));
    if (g){ if (!firstBlock) firstBlock = g; return false; }
    return true;
  });
  blockedSol = ids.length - okIds.length;
  ids = okIds;
  if (!ids.length){
    if (firstBlock) gateSay(firstBlock);
    else toast(t('حدّد نقاطًا أولًا'));
    return;
  }

  var tot = teamShare(tm);
  var quota = tm.members.map(function(m){
    return split === 'even'
      ? Math.floor(ids.length / tm.members.length)
      : Math.round(ids.length * cfgN(m.share) / (tot || 1));
  });
  /* ما تبقّى بالكسر يُعطى الأوّلَ فالأوّل فلا تضيع نقطة */
  var given = quota.reduce(function(a,b){ return a + b; }, 0);
  for (var k = 0; given < ids.length; k = (k + 1) % tm.members.length){ quota[k]++; given++; }

  var at = 0, made = 0, log = [];
  tm.members.forEach(function(m, i){
    var mine = ids.slice(at, at + quota[i]);
    at += quota[i];
    if (!mine.length) return;
    mine.forEach(function(id){
      var tid = 'TK-' + kind + '-' + id;
      CORE.set('tasks', tid, {
        id:tid, no:reqNext(kind), site:id, kind:kind, to:m.name, assignedTo:m.name, team:tm.id,
        status:'مطلوب', when:when, by:STATE.meta.name || '', at:Date.now()
      });
      made++;
    });
    log.push(m.name + ' ' + nm(mine.length));
  });

  logEvent('إسناد لفريق ' + tm.n + ' — ' + nm(made) + ' نقطة · ' + log.join(' · '));
  selClear(); ASN_OPEN = false; statBump();
  toast(tm.n + ' \u00b7 ' + nm(made) + ' ' + t('نقطة') + ' \u00b7 ' + log.join(' \u00b7 ')
        + (blockedSol ? ' \u00b7 ' + nm(blockedSol) + ' ' + t('لم تُرسَل — ينقصها ما قبلها') : ''));
  /* ومن رُفض يُقال له أيُّ خطوةٍ ناقصةٌ بعينها لا «لا يجوز» */
  if (blockedSol && firstBlock)
    gateSay(firstBlock);
  render(1);
}


