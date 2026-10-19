/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-10-field-companies.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Field map-first home, composite-name parsing, companies board and company camps classified.
   DEFINES : coDash, coBucketsAll, coBuckets, coPopRows, coPopHtml, coPopXls, coDashCard, coSplit, siteCos, coCompounds, coPick, coFill, coColor, coFiltHtml … (+3 more)
   GLOBALS : FIELD_MODE, EXP_OPEN, POP_SITE, CO_OPEN, CO_MODE, CO_Q, MAP_SAT, MAP_FILT_OPEN, CO_SEL, CO_BK … (+7 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الميدان — الخريطة أولًا ═══ */

var FIELD_MODE = 'survey', FIELD_PREV = 'survey';
var EXP_OPEN = false;
var POP_SITE = '';
var CO_OPEN = false;
/* يبقى التلوينُ بعد إغلاق اللوح حتى يُطفأ صراحةً */
var CO_MODE = false;
var CO_Q = '', TK_Q = '', IT_Q = '', JB_Q = '';
var MAP_SAT = true;   /* (V25.1) القمرُ الصناعيُّ هو الأساس بقرار المالك — والشوارعُ بالزرّ نفسِه */
var MAP_FILT_OPEN = false;
var CO_SEL = [];
/* القائمةُ الموحّدة — تُبنى من بيانات المشروع نفسها لا تُكتَب بيد.
   كانت عشرةَ أسماءٍ مخترعةٍ بينما الشاشةُ تقول «مئةٌ واثنتان وستون شركة»،
   والميدانُ يختار من قائمةٍ لا تشبه ما في السجل. */

/* ═══ الاسمُ المركَّبُ يُفَكّ ═══
   إحدى وثلاثون قيمةً في القائمة تحمل أكثرَ من شركةٍ في نصٍّ واحدٍ مفصولةٍ
   بفاصلة — مخيّمٌ تخدمه عدةُ شركات، أُدخل اسمُها كما جاء في الملف. فتظهر
   في المنتقي سطرًا واحدًا طويلًا لا يُقرأ، ولا تُختار شركةٌ منها بمفردها،
   ولا تُحسَب لها نقاطُها.
     والفكُّ بالفاصلة وحدَها لا بكلِّ «شركة»: «شركة شخص واحد» و«شركة ذات
   مسؤولية محدودة» صيغتان قانونيتان تلحقان الاسمَ ولا تصنعان شركةً ثانيةً —
   ومن فكَّ عندهما صنع من الواحدة اثنتين. فما لا يبدأ بكلمةِ كيانٍ يُضَمُّ
   إلى ما قبله، وكذلك الصيغُ القانونية. */

/* ═══ لوحةُ الشركات ═══
   القائمةُ وحدَها لا تُجيب: كم شركةً عندنا؟ وكم منها يخدم أكثرَ من مخيّم؟
   وكم في القائمة ولا مخيّمَ له؟ وكم بقي من الأسماء المركَّبة؟ فتُقرأ الأرقامُ
   أوّلًا ثم تُفتَح القائمة. والعدُّ بعد فكِّ المركَّبات — فيُحسَب المخيّمُ
   المشتركُ لكلِّ شركةٍ تخدمه لا لسطرٍ يحمل أسماءها ملتصقة. */
function coDash(){
  var byCo = {}, multi = 0, totalSites = 0;
  (STATE.sites || []).forEach(function(x){
    if (!x.co) return;
    totalSites++;
    coSplit(x.co).forEach(function(one){
      (byCo[one] = byCo[one] || { n:0, zones:{} }).n++;
      if (x.zone) byCo[one].zones[x.zone] = 1;
    });
  });
  var served = Object.keys(byCo);
  served.forEach(function(c){ if (byCo[c].n > 1) multi++; });
  var idle = CO_LIST.filter(function(c){ return !byCo[c]; }).length;
  var top = served.slice().sort(function(a, b){ return byCo[b].n - byCo[a].n; }).slice(0, 8);
  return { byCo:byCo, served:served.length, multi:multi, idle:idle,
           cmp:Object.keys(coCompounds()).length, top:top, sites:totalSites };
}
/* ═══ مخيّماتُ الشركة مصنَّفةً ═══
   من حلقةٍ واحدةٍ بالتعريف نفسِه المستعمَل في «نظرة عامة»: تمَّ المسحُ = وصل
   وسجّل ولم يُردّ؛ المتعذّرُ = وصل ولم يستطع؛ تمَّ التركيبُ = حالةُ التركيب. */
var CO_BK = null;   /* (V26.2) كانت تُحسَب لكلِّ شركةٍ بحلقةٍ على المواقع كلِّها (٤٢ شركة × ١٬٨٠٠ موقع في الرسمة) — صارت حلقةً واحدةً تُصفَّر مع الرسمة */
function coBucketsAll(){
  if (CO_BK) return CO_BK;
  var M = {};
  (STATE.sites || []).forEach(function(x){
    var co = x.co; if (!co) return;
    var out = M[co] || (M[co] = { all:[], sv:[], stuck:[], ins:[] });
    out.all.push(x);
    var r = STATE.recs[x.id];
    if (svVisited(r)) out.sv.push(x);   /* (V32.6) */
    else if (r && r.review !== 'revisit') out.stuck.push(x);
    var i2 = STATE.inss[x.id];
    if ((i2 && i2.status === 'مُركّب') || x.fstat === 'مُركّب') out.ins.push(x);
  });
  CO_BK = M; return M;
}
function coBuckets(co){ return coBucketsAll()[co] || { all:[], sv:[], stuck:[], ins:[] }; }
var CO_POP = null;   /* { co, kind } */
var CO_POP_LBL = { all:'كلُّ المخيّمات', sv:'تمت الزيارة', stuck:'تحتاج زيارة أخرى', ins:'تمّ التركيب' };
function coPopRows(co, kind){
  var B = coBuckets(co), L = B[kind] || [];
  return L.map(function(x){
    var r = STATE.recs[x.id] || {}, i2 = STATE.inss[x.id] || {};
    var chal = (r.chals || []).filter(function(c){ return c !== 'لا توجد تحديات'; });
    return { x:x, r:r,
      why: kind === 'stuck' ? (r.reason || r.note || '—')
         : (chal.length ? chal.join(' \u00b7 ') : (r.note || '—')),
      who: r.by || '—', when: r.at ? dayKey(r.at) : '—',
      st: i2.status || x.fstat || (r.id ? svLabel(r) : 'لم يُزر') };
  });
}
function coPopHtml(){
  if (!CO_POP) return '';
  var co = CO_POP.co, kind = CO_POP.kind, L = coPopRows(co, kind);
  var rows = L.map(function(o){
    var x = o.x;
    return ['<strong>' + esc(siteKey(x) !== x.id ? siteKey(x) : (x.name || x.id)) + '</strong><br><span class="num hint">' + esc(x.id) + '</span>',
            esc(x.sign || '—'),
            esc(t(x.zone || '—')) + (x.sq ? ' \u00b7 ' + esc(x.sq) : ''),
            esc(o.why.slice(0, 90)),
            esc(o.who) + '<br><span class="num hint">' + esc(o.when) + '</span>',
            pill(o.st, o.st === 'مُركّب' ? 'ok' : (o.st === 'متعذّر' ? 'bad' : 'wrn')),
            /* `data-cogo` محجوزةٌ منذ V14 لزرَّي «عرض» و«مسح التحديد» في مرشِّح
               الشركات على الخريطة — فمعالجُ النافذة الجديد كان يخطف ضغطتَهما
               ويفتح شاشةَ الاعتماد. اسمٌ خاصٌّ بها: `data-comap`. */
            (x.lat && x.lng ? btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-comap="' + esc(x.id) + '"') : '')
            + btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-copopsite="' + esc(x.id) + '"')];
  });
  return '<div id="coPopWrap" class="co-pop-wrap">'
    + '<div class="co-pop" role="dialog" aria-modal="true">'
    + '<div class="co-pop-head">'
    +   '<div><strong>' + esc(coName(co)) + '</strong>'
    +   '<div class="hint" style="margin:2px 0 0">' + esc(t(CO_POP_LBL[kind] || '')) + ' \u00b7 ' + nm(L.length) + ' ' + esc(t('مخيّم')) + '</div></div>'
    +   '<div class="actions" style="margin:0">'
    +     btn('\u2B07 ' + t('إكسل'),'btn-secondary btn-sm',' data-copopxls="1"')
    +     btn('\u2715','btn-quiet btn-sm',' data-copopx="1" aria-label="' + esc(t('إغلاق')) + '"')
    +   '</div></div>'
    + '<div class="co-pop-body">'
    + (rows.length ? table(['المخيّم','الشاخص','الموقع', kind === 'stuck' ? 'سببُ التعذّر' : 'التحديات والملاحظات','مَن ومتى','الحالة',''], rows)
                   : '<p class="hint" style="padding:18px;text-align:center;margin:0">' + esc(t('لا مخيّماتٍ في هذه الخانة.')) + '</p>')
    + '</div></div></div>';
}
function coPopXls(){
  if (!CO_POP) return;
  var L = coPopRows(CO_POP.co, CO_POP.kind);
  var out = [['المخيّم','المعرّف','الشاخص','المشعر','المربع','التحديات/السبب','مَن','متى','الحالة','خط العرض','خط الطول']];
  L.forEach(function(o){ var x = o.x;
    out.push([x.name || '', x.id, x.sign || '', x.zone || '', x.sq || '', o.why, o.who, o.when, o.st, x.lat || '', x.lng || '']); });
  xlsSheets([[t(CO_POP_LBL[CO_POP.kind] || 'مخيّمات'), out]], 'أفاقي — ' + coName(CO_POP.co));
}
function coDashCard(){
  var D = coDash();
  return stats([['شركاتٌ في القائمة', N(CO_LIST.length), 'acc'],
                ['لها مخيّمات', N(D.served), D.served ? 'ok' : 'wrn'],
                ['على أكثرَ من مخيّم', N(D.multi), D.multi ? 'acc' : ''],
                ['في القائمة بلا مخيّم', N(D.idle), D.idle ? 'wrn' : 'ok'],
                ['أسماءٌ مركَّبةٌ لم تُوحَّد', N(D.cmp), D.cmp ? 'bad' : 'ok'],
                ['مواقعُ لها شركة', N(D.sites)]])
    + (D.top.length
      ? cardFlush('\u{1F3E2} ' + t('الأكثرُ مخيّمات'),
          table(['الشركة','مخيّماتها','مشاعرها'],
            D.top.map(function(c){
              var lb = coName(c);
              return [esc(lb.length > 44 ? lb.slice(0, 43) + '\u2026' : lb),
                      '<b class="num">' + nm(D.byCo[c].n) + '</b>',
                      esc(Object.keys(D.byCo[c].zones).map(function(z){ return t(z); }).join(' \u00b7 '))];
            })))
      : '');
}
var CO_CMP = null, CO_CMP_KEYS = [];
var CO_HEAD = /^(شرك[ةه]|مؤسس[ةه]|مكتب|مجموع[ةه]|مصنع|جمعي[ةه])\s/;
var CO_FORM = /^شرك[ةه]\s+(شخص\s+واحد|ذات\s+مسؤولي[ةه]\s+محدود[ةه]|مساهم[ةه]|تضامن|توصي[ةه]\s+بسيط[ةه])\s*$/;
function coSplit(v){
  var raw = String(v || '').replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();
  if (!raw) return [];
  var parts = raw.split(/\s*[،,؛;|]\s*/).map(function(x){ return x.trim(); }).filter(Boolean);
  var out = [];
  parts.forEach(function(x){
    /* صيغةٌ قانونيةٌ أو جزءٌ لا يبدأ بكيان: يعود إلى ما قبله */
    if (out.length && (CO_FORM.test(x) || !CO_HEAD.test(x))) out[out.length - 1] += '، ' + x;
    else out.push(x);
  });
  return out.length ? out : [raw];
}
/* شركاتُ نقطةٍ بعينها — واحدةٌ في الغالب، وقد تكون عدةً في المخيم المشترك */
function siteCos(x){ return coSplit(x && x.co); }
function coCompounds(){
  var m = {};
  (STATE.sites || []).forEach(function(x){
    if (!x.co) return;
    var pr = coSplit(x.co);
    if (pr.length < 2) return;
    if (!m[x.co]) m[x.co] = { parts:pr, n:0, ids:[] };
    m[x.co].n++;
    if (m[x.co].ids.length < 12) m[x.co].ids.push(x.id);
  });
  return m;
}
/* تُسنَد نقاطُ قيمةٍ مركَّبةٍ إلى واحدةٍ من أجزائها */
function coPick(raw, part){
  if (!may('settings')){ toast(t('توحيدُ الأسماء للمهندس وحده')); return 0; }
  var n = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.co !== raw) return;
    x.co = part; n++;
    CORE.set('sites', x.id, { co:part });
  });
  if (n){
    coFill(); statBump();
    logEvent('توحيد اسم مركَّب — ' + nm(n) + ' نقطة \u2190 ' + part);
    toast(nm(n) + ' ' + t('نقطةً صارت لـ') + ' ' + part);
    render(1);
  }
  return n;
}
var CO_LIST = [];
function coFill(){
  var seen = {}; CO_LIST.length = 0;
  /* والأسماءُ التي تحملها السجلاتُ نفسها: أحدَ عشرَ اسمًا في المواقع لم تكن
     في القائمتين، فكان الميدانُ يُمنَع من إعادة اختيار شركةٍ قائمةٍ في سجلّه. */
  var onRows = (SITES_RAW.g || []).concat(SITES_RAW.p || []).map(function(r){ return r[9]; });
  /* والشركاتُ المعتمدةُ من الطلبات — كانت تُضاف للقائمة لحظةَ الاعتماد ثم
     تُنسى عند إعادة التحميل، فتعود الشركةُ «غيرَ موجودة» بعد يوم. */
  var approved = Object.keys(STATE.coreqs || {}).filter(function(k){
    return STATE.coreqs[k] && STATE.coreqs[k].status === 'معتمد'; })
    .map(function(k){ return STATE.coreqs[k].name || k; });
  [].concat(SITES_RAW.co || [], SITES_RAW.dm || [], onRows, approved).forEach(function(c){
    /* القائمةُ أسماءٌ مفردة: القيمةُ المركَّبةُ تدخل مفكوكةً — ويبقى الأصلُ
       على النقطة حتى يُوحَّد من شاشة الشركات. */
    coSplit(c).forEach(function(one){
      if (one && !seen[one]){ seen[one] = 1; CO_LIST.push(one); }
    });
  });
  CO_LIST.sort(arCmp);
  return CO_LIST.length;
}
coFill();   /* بعد التعريف لا قبله — البياناتُ أعلى في الملف والقائمةُ هنا */

/* الزاوية الذهبية توزّع الأطياف فلا يتجاور لونان متشابهان مهما كثرت الشركات */
function coColor(name){
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  var idx = CO_LIST.indexOf(name);
  var seed = idx > -1 ? idx : h;
  return 'hsl(' + Math.round((seed * 137.508) % 360) + ',62%,58%)';
}

function coFiltHtml(){
  /* الرأسُ والذيلُ ثابتان والقائمةُ وحدَها تُمرَّر: كان اللوحُ كلُّه يُمرَّر،
     فيغيب زرُّ الإغلاق ويغيب «عرض» عمن نزل في مئةٍ واثنتين وستين شركةً — فيبحث
     عنهما بالتمرير صعودًا ونزولًا في كلِّ مرة. */
  var shown = CO_LIST.filter(function(c){ return coHit(c, CO_Q); });
  var allOn = shown.length > 0 && shown.every(function(c){ return CO_SEL.indexOf(c) > -1; });
  return '<div class="pop copop" id="coFilt">'
    + '<div class="pop-head">'
    +   '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">'
    +     '<h3 style="color:var(--ink);margin:0">' + esc(t('اختر الشركات')) + '</h3>'
    +     '<button type="button" class="btn btn-quiet btn-sm" data-co="0" aria-label="'
    +       esc(t('إغلاق')) + '">✕</button>'
    +   '</div>'
    +   '<input type="search" id="coQ" data-coq="1" value="' + esc(CO_Q) + '" placeholder="'
    +     esc(t('ابحث باسم الشركة')) + '" spellcheck="false" style="margin:11px 0 0">'
    + '</div>'

    + '<div class="pop-body" id="coL">'
    +   (shown.length
        ? shown.map(function(c){
            var on = CO_SEL.indexOf(c) > -1;
            return '<label class="coRow" data-c="' + esc(c) + '">'
              + '<input type="checkbox" class="coCk"' + (on ? ' checked' : '') + '>'
              + '<i style="background:' + coColor(c) + '"></i>'
              + '<span>' + esc(c) + '</span></label>';
          }).join('')
        : '<p class="hint" style="text-align:center;padding:20px 0;margin:0">'
          + esc(t('لا شركةَ بهذا الاسم.')) + '</p>')
    + '</div>'

    + '<div class="pop-foot">'
    +   '<div class="actions" style="margin:0">'
    +     btn(allOn ? 'أزِل تحديد الكل' : 'حدّد الكل', 'btn-secondary btn-sm',
              ' data-coall="' + (allOn ? '0' : '1') + '"')
    +     btn('عرض', 'btn-primary btn-sm', ' data-cogo="1"')
    +     btn('مسح التحديد', 'btn-quiet btn-sm', ' data-cogo="0"')
    +   '</div>'
    +   '<p class="hint" style="font-size:11.5px;margin:9px 0 0">'
    +     nm(shown.length) + ' ' + esc(t('من')) + ' ' + nm(CO_LIST.length) + ' '
    +     esc(t('شركة')) + (CO_SEL.length ? ' · ' + nm(CO_SEL.length) + ' ' + esc(t('محدَّدة')) : '')
    +     ' — ' + esc(t('لكل واحدة لونٌ ثابت فلا يتجاور لونان متشابهان.'))
    +   '</p>'
    + '</div></div>';
}

/* الأسطورةُ تتبع الطبقة: لكلٍّ حالاتُها، ولكلِّ نوعٍ شكلُه ولونُه */
function legendRows(){
  if (CO_OPEN || CO_MODE){
    /* لا معنى لأسطورة الحالات ولونُ النقطة لشركتها */
    var seen = {}, out = [];
    (typeof filtered === 'function' ? filtered() : STATE.sites).forEach(function(x){
      if (!x.co || seen[x.co]) return;
      seen[x.co] = 1;
      if (out.length < 12) out.push(x.co);
    });
    return '<div style="font-weight:700;margin:0 0 6px">' + esc(t('لون الشركات')) + '</div>'
      + out.map(function(c){
          return '<div><span class="dot" style="background:' + coColor(c) + '"></span>'
            + esc(c.length > 22 ? c.slice(0, 21) + '…' : c) + '</div>';
        }).join('')
      + (Object.keys(seen).length > out.length
          ? '<div class="hint" style="margin:6px 0 0">' + esc(t('و')) + ' '
            + nm(Object.keys(seen).length - out.length) + ' ' + esc(t('شركةً أخرى')) + '</div>'
          : '');
  }
  var L = (typeof LAYER === 'function') ? LAYER() : LAYERS.survey;
  var rows = [];
  /* ═══ الأسطورةُ تعدُّ ═══
     كانت تقول «معتمدة» ولا تقول كم — فيبقى السؤالُ الأوّلُ بلا جواب: «كم
     نقطةً في كلِّ حالة؟». صارت تعدُّ ما هو معروضٌ في الطبقة الحالية بعد
     الترشيح، فالرقمُ يوافق ما تراه العينُ لا ما في القاعدة كلِّها. */
  var CNT = {}, TOT = 0;
  (function(){
    var LST = (typeof layerFiltered === 'function') ? layerFiltered()
            : (typeof filtered === 'function' ? filtered() : STATE.sites);
    LST.forEach(function(x){
      var k;
      if (FIELD_MODE === 'survey') k = lifeOf(x);
      else if (FIELD_MODE === 'brief') k = briefStage(x.id);
      else if (FIELD_MODE === 'install') k = insDone(x.id) ? 'done' : (asnOf(x.id) ? 'asn' : 'wait');
      else k = disDone(x.id) ? 'done' : (asnOf(x.id) ? 'asn' : 'wait');
      CNT[k] = (CNT[k] || 0) + 1; TOT++;
    });
  })();
  if (FIELD_MODE === 'survey'){
    /* الأسطورةُ تُشتقُّ من دورة الحياة نفسِها — فلا تفترق عن الخريطة */
    rows = LIFE_ORDER.map(function(k){ return [LIFE[k].c, LIFE[k].n, k]; });
  } else if (FIELD_MODE === 'brief'){
    rows = BRIEF_STAGE_ORDER.map(function(k){ return [BRIEF_STAGE[k].c, BRIEF_STAGE[k].n, k]; });
  } else if (FIELD_MODE === 'install'){
    rows = [[LIFE.ready.c,'معتمدة — جاهزة للإسناد','wait'], [LIFE.sched.c,'مُسندة للتركيب','asn'], [L.c,'مُركّب','done']];
  } else {
    rows = [['#E8C34B','قابل للفك','wait'], ['#FF8C42','مجدول للفك','asn'], [L.c,'تم الفك','done']];
  }
  out = rows.map(function(r){   /* (V31.4) `out` مُعلَنٌ أعلى الدالة */
    var n = CNT[r[2]] || 0;
    /* الحالةُ الخاليةُ تخفت ولا تختفي — فيُعرَف أنها حالةٌ قائمةٌ لا شيءَ فيها */
    return '<div class="lg-row' + (n ? '' : ' lg-off') + '">'
      + '<i class="lg-dot" style="background:' + r[0] + '"></i>'
      + '<span class="lg-n">' + esc(t(r[1])) + '</span>'
      + '<b class="num lg-c">' + nm(n) + '</b></div>';
  }).join('')
  + '<div class="lg-row lg-tot"><span class="lg-n">' + esc(t('في هذا الترشيح')) + '</span>'
  + '<b class="num lg-c">' + nm(TOT) + '</b></div>';
  /* وفي طبقة التفاصيل: الإطارُ خبرٌ ثانٍ فوق لون المرحلة — يُقال في أسطورتها */
  if (FIELD_MODE === 'brief'){
    var BC = { 'تمام':0, 'تحدٍّ':0, 'ملاحظة':0 }, noB = 0;
    ((typeof layerFiltered === 'function') ? layerFiltered() : []).forEach(function(x){
      var b = briefOf(x.id);
      if (b && BC[b.st] !== undefined) BC[b.st]++; else noB++;
    });
    out += '<div class="lg-sep"></div>'
      + '<div style="font-weight:700;margin:0 0 4px">' + esc(t('إطارُ النقطة — التفاصيل المكتوبة')) + '</div>'
      + BRIEF_ST.map(function(k){
          return '<div class="lg-row' + (BC[k] ? '' : ' lg-off') + '">'
            + '<i class="lg-dot" style="background:transparent;box-shadow:inset 0 0 0 2px ' + BRIEF_C[k] + '"></i>'
            + '<span class="lg-n">' + esc(t(k)) + '</span><b class="num lg-c">' + nm(BC[k]) + '</b></div>';
        }).join('')
      + '<div class="lg-row' + (noB ? '' : ' lg-off') + '"><i class="lg-dot" style="background:transparent;box-shadow:inset 0 0 0 1px var(--line)"></i>'
      + '<span class="lg-n">' + esc(t('بلا تفاصيلَ بعد')) + '</span><b class="num lg-c">' + nm(noB) + '</b></div>';
  }
  /* الأشكالُ — تُذكَر مرةً في آخر الأسطورة، وتُشتقُّ من سجلِّ الأنواع (V17.60):
     كانت ثلاثةَ أسطرٍ مكتوبةٍ بيد، فلا يظهر فيها شكلُ نوعٍ أُضيف ولا شكلٌ غُيِّر. */
  out += '<div class="lg-sep"></div>' + legendShapes();
  return out;
}
/* أسطرُ الأشكال: المخيمُ بحدوده، ثم كلُّ شكلٍ بأنواعه — بالهندسة التي يُرسَم بها */
var SHAPE_ORDER = ['diamond','circle','square','triangle','star','drop'];
/* اسمُ النوع القصير: المفتاحُ العربيُّ نفسُه، وإلا اسمُه المعروض (LPR لا يُقرأ حرفًا) */
function typeShort(k){
  if (/[\u0600-\u06FF]/.test(k)) return t(k);
  var d = typesList()[k] || CAT_DEF[k] || {};
  return t(d.l || k);
}
function legendShapes(){
  var T = typesList(), by = {};
  Object.keys(T).forEach(function(k){
    if (k === 'مخيم') return;
    var sh = mapShapeOf(k);
    (by[sh] = by[sh] || []).push(k);
  });
  var order = Object.keys(by).sort(function(a, b){
    var ia = SHAPE_ORDER.indexOf(a), ib = SHAPE_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return '<div class="lg-row"><i class="lg-sh sh-c"></i>' + esc(t('مخيم')) + '</div>'
    + order.map(function(sh){
        return '<div class="lg-row lg-shp sh-' + esc(sh) + '">' + shapeSvg(sh)
          + '<span>' + by[sh].map(function(k){ return esc(typeShort(k)); }).join(' \u00b7 ') + '</span></div>';
      }).join('');
}

/* واجهةُ الخريطة تُرسَم في #mapUI فوق الحاوية الثابتة —
   والحاويةُ نفسها لا يمسّها إعادةُ الرسم فلا تُدمَّر Leaflet. */
