/* ============================================================================
   FILE    : src/01-core/01-core-registry-02-data-display-search.js
   DOMAIN  : Core — language, engine, sync, registry
   PURPOSE : Project constants, display helpers (HTML escaping, pills, cards, tables), isolation of Latin tokens inside Arabic text, and the per-page search box.
   DEFINES : bdiNeed, bdi, bdiText, fsi, fsiText, esc, N, stat, stats, meter, card, cardRaw, cardFlush, cellT … (+9 more)
   GLOBALS : DATA, PAGE, BDI_TOK, PG_Q, PG_BIND, PG_LAST_BIND, PG_T
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ البيانات — أرقام المشروع الحقيقية ═══ */

/* المراجعُ الثابتةُ وحدَها: الأصنافُ وفئاتُ المشتريات والمورّدون.
   وما كان عرضًا — مواقعُ وأحداثٌ ومستخدمون وحركاتٌ وأرصدة — حُذف:
   العرضُ الذي يبقى بعد التسليم يُقرأ حقيقةً. */
var DATA = {
  items:[
    ['cor','cam_pe','كاميرا ممر 8266',16,2400, 4,0],
    ['cor','rtr','راوتر صناعي',10,1150, 5,3],
    ['cor','rdr8','قارئ ٨ منافذ',33,7200, 8,5],
    ['cor','ant12','هوائي القارئ SRRA12',8,520, 0,0],
    ['cor','sol','لوح سولار ٤٠٠و',26,900, 0,3],
    ['cor','bat','بطارية ٢٠٠أ',16,1600, 0,3],
    ['cor','mppt','منظومة طاقة شمسية',13,700, 4,2],
    ['cor','mcb','قاطع كهربائي',5,90, 0,1],
    ['cor','boxb','بوكس بطارية ٨٠×٦٠×٣٠',20,950, 0,4],
    ['cor','c20','كابل القارئ ٢٠م',13,260, 0,0],
    ['cor','c15c','كابل ١٥م 7D-FB',10,190, 0,0],
    ['cor','c10c','كابل ١٠م 5D-FB',8,140, 0,0],
    ['cor','c5c','كابل القارئ ٥م',5,80, 0,0],
    ['cor','boxm','بوكس رئيسي ٦٠×٤٠×٢٠',26,680, 0,5],
    ['cor','sock','فيش كهرباء',2,45, 0,1],
    ['camp','cam','كاميرا مخيم 8361',8,2400, 4,0],
    ['camp','rtr2','راوتر صناعي',5,1150, 5,3],
    ['camp','rdr4c','قارئ ٤ منافذ',11,5100, 6,4],
    ['camp','ant9c','هوائي القارئ SRRA9',3,420, 0,0],
    ['camp','ths','حساس حرارة ورطوبة',4,180, 3,0],
    ['camp','c15','كابل ١٥م 7D-FB',5,190, 0,0],
    ['camp','c10','كابل ١٠م 5D-FB',4,140, 0,0],
    ['camp','c5','كابل القارئ ٥م',2,80, 0,0],
    ['camp','box','بوكس رئيسي ٦٠×٤٠×٢٠',13,680, 0,5],
    ['camp','led','شاشة ليد ٣ نقاط',2,150, 0,2],
    ['camp','korg','ليد أخضر',2,120, 0,1],
    ['camp','korr','ليد أحمر',2,120, 0,1],
    ['camp','rly','ريلاي ١٢ف',2,60, 0,1],
    ['camp','gwc','جيت واي',6,1900, 5,3],
    ['camp','sockc','فيش كهرباء',2,45, 0,1]
  ],
  buyCats:['كابلات وتوصيلات','أدوات ومعدات','مواد تثبيت','كهرباء','نقل ومواصلات','مستهلكات','عمالة وخدمات','أخرى'],
  suppliers:['محل النور','مؤسسة الحرم','شركة الأمانة']
};;

/* سجلُّ الشاشات — يُعرَّف مرةً هنا ويُضاف إليه في كل ملفٍ بعده */
var PAGE = {};

/* ═══ مساعدات العرض ═══ */
/* ═══ عزلُ الرموز اللاتينية داخل النصِّ العربي (V17.98) ═══
   معرِّفٌ مثل NSK-MIN-RDR-0018 أو رقمٌ تسلسليٌّ أو شاخصٌ مثل 12B/B04 داخل جملةٍ
   عربيةٍ قد يُعاد ترتيبُه بصريًّا. في HTML يُعزَل بـ<bdi>، وفي النصِّ الصريح (واتساب
   والتقارير) بعلامتَي FSI…PDI. للعرض فقط: القيمُ المخزونةُ والتصديرُ (CSV/JSON/إكسل)
   تبقى نظيفةً من العلامات. */
var BDI_TOK = /[A-Za-z0-9][A-Za-z0-9._:\/-]*[A-Za-z0-9]|[A-Za-z0-9]/g;
function bdiNeed(m){ return /[A-Za-z]/.test(m) || /[\/:.-]/.test(m); }
function bdi(s){ return '<bdi>' + esc(s) + '</bdi>'; }
function bdiText(s){
  /* التهريبُ بعد التقطيع: esc تحوّل الشَّرطةَ المائلة إلى مرجعٍ فيتقطّع الشاخص */
  s = String(s == null ? '' : s); var out = '', last = 0;
  s.replace(BDI_TOK, function(m, off){ out += esc(s.slice(last, off)) + (bdiNeed(m) ? '<bdi>' + esc(m) + '</bdi>' : esc(m)); last = off + m.length; return m; });
  return out + esc(s.slice(last));
}


function esc(s){ var x = String(s==null?'':s); if (LANG === 'ar' && noTashkeel()) x = x.replace(TASHKEEL_RE, '');   /* (V34.4) */
  return x
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\//g,'&#47;'); }
function N(v){ return '<span class="num">'+nm(v)+'</span>'; }

/* القيمةُ رقمٌ مُنسَّقٌ غالبًا (وسمٌ جاهز) فتُترَك، لكنها أحيانًا نصٌّ صرفٌ
   («متاح» · «مستوفٍ» · «—») فيُترجَم بنفس قاعدة خلايا الجدول. */
function stat(k,v,cls){
  return '<div class="stat'+(cls?' '+cls:'')+'"><div class="k">'+esc(t(k))+'</div>'
       + '<div class="v">'+cellT(v)+'</div></div>';
}
function stats(list){
  return '<div class="stats">'+list.map(function(s){ return stat(s[0],s[1],s[2]); }).join('')+'</div>';
}
function meter(label,v,max){
  var p = max ? Math.min(100, Math.round(v/max*100)) : 0;
  return '<div class="meter"><div class="meter-l"><span>'+esc(t(label))+'</span>'
       + '<span>'+nm(v)+' / '+nm(max)+' · '+nm(p)+'٪</span></div>'
       + '<div class="track"><i style="width:'+p+'%"></i></div></div>';
}
function card(title, body, right){
  return '<div class="card">'
    + (title ? '<div class="card-head"><h2>'+esc(t(title))+'</h2>'+(right||'')+'</div>' : '')
    + '<div class="card-body">'+body+'</div></div>';
}
/* عنوانٌ مبنيٌّ من أجزاءٍ هُرِّبت كلٌّ منها — لا يُهرَّب ثانيةً فتظهر الوسومُ نصًّا */
function cardRaw(titleHtml, body, right){
  return '<div class="card">'
    + (titleHtml ? '<div class="card-head"><h2>' + titleHtml + '</h2>' + (right || '') + '</div>' : '')
    + '<div class="card-body">' + body + '</div></div>';
}
function cardFlush(title, body, right){
  return '<div class="card">'
    + (title ? '<div class="card-head"><h2>'+esc(t(title))+'</h2>'+(right||'')+'</div>' : '')
    + '<div class="card-body tight">'+body+'</div></div>';
}
/* الخليةُ قد تحمل HTML جاهزًا (زرًّا أو شارةً أو رقمًا مُنسَّقًا) فلا تُمرَّر
   بالمترجم كما هي. لكنّ أكثرَ من أربعمئة خليةٍ نصٌّ عربيٌّ صرفٌ يُكتَب في
   مصفوفة الصف — «النطاق» و«المدّة» و«الميزانية» — فبقيت عربيةً بعد ترجمة
   مفاتيحها، لأن الرأسَ وحدَه كان يمرُّ بالمترجم. فصارت الخليةُ النصيةُ
   الصرفةُ (بلا وسمٍ ولا رقمٍ) تُترجَم، وما فيه وسمٌ يُترك كما بُني. */
function cellT(c){
  if (typeof c !== 'string') return c;
  if (c.indexOf('<') > -1 || c.indexOf('&') > -1) return c;
  return esc(t(c));
}
function table(head, rows, foot, opt){
  return '<div class="table-wrap' + ((opt && opt.sticky) ? ' sticky-1' : '') + '"><table class="data-table rows"><thead><tr>'
    + head.map(function(h){ return '<th>'+esc(t(h))+'</th>'; }).join('')
    + '</tr></thead><tbody>'
    + rows.map(function(r){
        if (r && r.raw) return r.raw;                      /* صفٌّ خامٌ يمتدُّ على الأعمدة — لوحاتُ المراجعة */
        return '<tr>'+r.map(function(c){ return '<td>'+cellT(c)+'</td>'; }).join('')+'</tr>'; }).join('')
    + '</tbody>'
    + (foot ? '<tfoot><tr>'+foot.map(function(c){ return '<td>'+cellT(c)+'</td>'; }).join('')+'</tr></tfoot>' : '')
    + '</table></div>';
}
function pill(txt, kind){ return '<span class="pill'+(kind?' '+kind:'')+'">'+esc(t(txt))+'</span>'; }
function alertBox(kind, txt){ return '<div class="alert '+kind+'"><span>'+esc(t(txt))+'</span></div>'; }
function pct(v,max){
  var p = max ? Math.round(v/max*100) : 0;
  var k = p>=100 ? 'ok' : (p>=70 ? 'warn' : 'off');
  return '<span class="pill '+k+'">'+nm(p)+'٪</span>';
}
function flow(steps, activeIdx){
  return '<div class="flow">' + steps.map(function(s,i){
    var cls = i < activeIdx ? ' done' : (i === activeIdx ? ' on' : '');
    return '<span class="flow-step'+cls+'">'+esc(t(s))+'</span>'
         + (i < steps.length-1 ? '<span class="flow-arr">\u2190</span>' : '');
  }).join('') + '</div>';
}
function btn(label, kind, extra){
  return '<button type="button" class="btn '+(kind||'btn-secondary')+'"'+(extra||'')+'>'+esc(t(label))+'</button>';
}
/* ═══ بحثٌ في كلِّ شاشة (V17.23) ═══
   بعضُ الشاشات لها بحثُها وأكثرُها بلا بحث، فيُلجَأ إلى بحث المتصفّح: يجد
   الكلمةَ ويلوّنها ولا يُخفي ما سواها، ولا يعمل على ما طُوي أو لم يُرسَم.
   فصار لكلِّ صفحةٍ صندوقٌ واحدٌ في رأسها يُصفّي **ما هو معروضٌ أمامك**:
   صفوفَ الجداول وبطاقاتِ القوائم — ويقول كم بقي من كم. ولا يُعيد الرسمَ
   عند كلِّ حرفٍ (فلا تضيع البؤرةُ ولا يُثقَل الجهاز)، بل يُخفي ويُظهر. */
function pageHead(eyebrow, title, lede, right){
  var canExp = (typeof SHEETS === 'object') && !!SHEETS[CUR];
  return '<div class="page-head"><div><span class="eyebrow">'+esc(t(eyebrow))+'</span>'
    + '<h1>'+esc(t(title))+'</h1>'
    + (lede ? '<p class="lede">'+esc(t(lede))+'</p>' : '') + '</div>'
    + '<div class="head-acts">'
    +   '<div class="pg-find"><input id="pgQ" type="search" dir="auto" value="' + esc(PG_Q) + '"'
    +     ' placeholder="' + esc(t('ابحث في هذه الصفحة')) + '" aria-label="' + esc(t('ابحث في هذه الصفحة')) + '">'
    +     '<span class="pg-find-n" id="pgQN"></span></div>'
    +   '<button type="button" class="btn btn-secondary btn-sm" data-help="1" '
    +     'aria-label="'+esc(t('ما هذه الصفحة؟'))+'" title="'+esc(t('ما هذه الصفحة؟'))+'">'+esc(t('؟'))+'</button>'
    +   (right !== undefined ? right
        : (canExp ? btn('تصدير','btn-secondary',' data-xls="'+CUR+'"') : ''))
    + '</div></div>';
}
/* ═══ صندوقٌ واحدٌ يقود بحثَ الصفحة نفسِه (V17.24) ═══
   لبعض الشاشات بحثٌ حقيقيٌّ يُرشِّح **بياناتها كلَّها** (شاشةُ اعتماد
   المهندس مثلًا: بالمعرِّف والشاخص والاسم والمشرف)، ولسبعٍ وخمسين شريحةً
   لا بحثَ لها فتُقرأ بالعين. فصار صندوقُ الرأس واحدًا في المظهر، مزدوجَ
   الأثر: إن كان للشاشة بحثُها قاده — فيُرشَّح كلُّ السجل لا المعروضَ منه —
   وإلا رشَّح ما هو معروضٌ أمامك. فلا شاشةَ بلا بحث، ولا بحثَ ينقص عمّا
   كان. والحدُّ الأقصى للصفوف يرتفع أثناء البحث فلا يختبئ المطلوبُ خلفه. */
var PG_Q = '';
var PG_BIND = {
  survey:  function(v){ SURV_Q = v; }, svappr: function(v){ SVA_Q = v; },
  minappr: function(v){ MIN_Q  = v; }, wbs:    function(v){ WBS_Q = v; },
  wtask:   function(v){ WT_Q   = v; }, users:  function(v){ USR.q = v; },
  co:      function(v){ CO_Q   = v; }, sites:  function(v){ SITE_Q = v; },
  items:   function(v){ IT_Q   = v; }, jobs:   function(v){ JB_Q  = v; },
  reqreg:  function(v){ REG_Q  = v; }, ships:  function(v){ SHIP_Q = v; },
  myveh:   function(v){ VEH_Q  = v; }, fleetLog: function(v){ VLOG_Q = v; },
  ips:     function(v){ IP_Q   = v; }, solution: function(v){ SOL_Q = v; },
  ev:      function(v){ EVF.q  = v; },
  chal:    function(v){ CHAL_Q = v; }, notif: function(v){ NTF_Q = v; }
};
var PG_LAST_BIND = null, PG_KEEP = false;
function pgBindOf(){
  var tab = (typeof TABS === 'object' && TABS[CUR]) ? PTAB[CUR] : '';
  return PG_BIND[tab] || PG_BIND[CUR] || null;
}
var PG_T = 0;
function pgFind(q){
  PG_Q = String(q == null ? PG_Q : q);
  var c = document.getElementById('content'); if (!c) return;
  var key = PG_Q.trim().toLowerCase();
  var rows = c.querySelectorAll('table tbody tr, .wt-le, .lg-row');
  var cards = c.querySelectorAll('#content > .card, .grid > .card, .wt-card');
  var seen = 0, hit = 0;
  var test = function(el){
    seen++;
    var ok = !key || (el.textContent || '').toLowerCase().indexOf(key) > -1;
    el.style.display = ok ? '' : 'none';
    if (ok) hit++;
    return ok;
  };
  for (var i = 0; i < rows.length; i++) test(rows[i]);
  /* البطاقةُ تُخفى إن لم تطابق هي ولا ما فيها من صفوفٍ ظاهرة */
  for (var j = 0; j < cards.length; j++){
    var cd = cards[j];
    if (!key){ cd.style.display = ''; continue; }
    var inner = cd.querySelectorAll('table tbody tr, .wt-le');
    var any = false;
    for (var k = 0; k < inner.length; k++) if (inner[k].style.display !== 'none'){ any = true; break; }
    cd.style.display = (any || (cd.textContent || '').toLowerCase().indexOf(key) > -1) ? '' : 'none';
  }
  var n = document.getElementById('pgQN');
  if (n) n.textContent = key ? (nm(hit) + ' ' + t('من') + ' ' + nm(seen)) : '';
}

