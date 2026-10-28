/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-05-menu-shell-perf.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Menu and shell, scroll position kept across renders, measured performance and browser vitals, focus kept in fields.
   DEFINES : navIco, arNorm, subseq, navMatch, navTabHits, navTabLinks, navHtml, navMain, navScores, navPins, navPinSet, navLiveHint, navMoreHtml, scrollGrab, scrollBack, perfNote, perfAvg … (+11 more)
   GLOBALS : NAV, NAV_ICO, CUR, OPEN, NAV_Q, FIELD_PAGES, NAV_HIST, SCROLL_KEEP, SCROLL_SEEN, PERF … (+1 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ القائمة والشل ═══ */

var NAV = [
  { id:'map',  icon:'\u25C8', label:'الخريطة', solo:true, field:true },
  /* «الطلبات والمسح» كانت وحدةً وحدَها: طلباتٌ ودورةُ نقطةٍ واعتمادٌ — وكلُّها
     عملُ الميدان ومتابعتُه، فتُقرأ من مكانٍ واحد */
  { g:'الميدان', icon:'\u25F1', items:[
      ['sites','المواقع'],['mywork','شغلي'],['chat','المحادثات'],['survey','متابعة العمل الميداني'],['req','الطلبات والتوزيع'],
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
    + esc(t('ابحث في القائمة')) + '"></div>' + navLiveHint();   /* (V39.83) */
  /* (V39.3) owner: «كل دور يشوف الشاشات اللي بيستخدمها فعلًا، والباقي تحت المزيد — ولا شاشة تتشال». Measured on production
     (five weeks of screen opens): eight screens took 80% of the opens and about ninety of 123 were never opened. Each group
     keeps its screens in navHtml.main (opened five times or more, plus help); the others move to one last group, «المزيد»,
     folded and kept in their groups' order — a search of the menu still finds every screen where it always was. */
  var main = navMain(), more = [];   /* (V39.83) the person's own use decides, not one list for everyone */
  return box + NAV.map(function(s){
    if (s.solo){
      if (!seesPage(s.id)) return '';
      if (!navMatch(s.label, s.id) && !navTabHits(s.id).length) return '';
      return '<a href="#" class="'+(CUR===s.id?'active':'')+'" data-p="'+s.id+'" aria-label="'+esc(t(s.label))+'">'
        + '<span class="item-icon" aria-hidden="true">'+navIco(s)+'</span><span class="nav-t">'+esc(t(s.label))+'</span></a>' + navTabLinks(s.id);
    }
    var items = s.items.filter(function(i){ return seesPage(i[0]) && (navMatch(i[1], i[0]) || navTabHits(i[0]).length); });
    if (!NAV_Q && main.length){
      items.forEach(function(i){ if (main.indexOf(i[0]) < 0) more.push(i); });
      items = items.filter(function(i){ return main.indexOf(i[0]) > -1; });
    }
    if (!items.length) return '';
    var open = NAV_Q ? true : (items.some(function(i){ return i[0] === CUR; }) || OPEN[s.g]);
    var hc = items.some(function(i){ return i[0] === CUR; });   /* (V24.0) وحدةُ الصفحة الحالية تُضاء في شريط الأيقونات */
    return '<div class="nav-section'+(hc?' has-cur':'')+'" data-open="'+(open?'true':'false')+'" data-g="'+esc(s.g)+'">'
      + '<button type="button" class="group-toggle" data-gt aria-expanded="'+(open?'true':'false')+'" aria-label="'+esc(t(s.g))+'">'
      + '<span class="group-label"><span class="item-icon" aria-hidden="true">'+navIco(s)+'</span><span class="nav-t">'+esc(t(s.g))+'</span></span>'
      + '<span class="chevron" aria-hidden="true"></span></button><div class="group-panel"><div class="gp-head" aria-hidden="true">'+esc(t(s.g))+'</div>'
      + items.map(function(i){
          var bdg = ''; if (i[0] === 'mfu'){ try { var un = mfuUnseen(); if (un) bdg = ' <span class="tb-badge" style="position:static;display:inline-block">' + nm(un) + '</span>'; } catch (e){ LS_ERR = e; } }   /* (V20.7) */
          if (i[0] === 'chat' && typeof chUnread === 'function'){ try { var cu = chUnread(); if (cu) bdg = ' <span class="tb-badge" style="position:static;display:inline-block">' + nm(cu) + '</span>'; } catch (e4){ LS_ERR = e4; } }   /* (V38.62) unread messages */
          return '<a href="#" class="sub'+(CUR===i[0]?' active':'')+'" data-p="'+i[0]+'">'+esc(t(i[1])) + (navPins()[i[0]] === 'pin' ? ' <span aria-hidden="true" style="opacity:.6">\u{1F4CC}</span>' : '') + bdg + '</a>' + navTabLinks(i[0]);
        }).join('')
      + '</div></div>';
  }).join('') + navMoreHtml(more);
}
navHtml.main = ['map', 'sites', 'mywork', 'chat', 'survey', 'req', 'sel', 'fleet', 'forms',
                'mfu', 'over', 'wtask', 'exec', 'co', 'pts', 'perf', 'users', 'ev', 'guide', 'acct'];
/* (V39.83) owner: «المفروض تبقى بناءً على الاستخدام — اللي مش بستخدمه كتير يبقى في المزيد». The list above becomes the
   default for a person without enough history; after that, this device's own page history (pageHist — 14 Makkah days,
   already kept for the morning pulse) decides: a screen opened navMain.MIN times or more in the last 14 days (the last 7
   count double) stays in its group, the rest fold under «المزيد». A long press pins a screen up or sends it down
   (nsk14.navpin), and nothing is ever removed — the menu search still finds every screen. */
function navPins(){ if (!navPins.m){ try { navPins.m = JSON.parse(lsGet('nsk14.navpin') || '{}') || {}; } catch (e){ LS_ERR = e; navPins.m = {}; } } return navPins.m; }
function navPinSet(id, v){ var m = navPins(); if (v) m[id] = v; else delete m[id]; try { lsSet('nsk14.navpin', JSON.stringify(m)); } catch (e){ LS_ERR = e; } }
function navScores(){
  var h = typeof pageHist === 'function' ? pageHist() : {}, days = Object.keys(h).sort(), recent = days.slice(-7), sc = {}, total = 0;
  days.forEach(function(d){ var w = recent.indexOf(d) > -1 ? 2 : 1; Object.keys(h[d] || {}).forEach(function(id){ var n = +h[d][id] || 0; sc[id] = (sc[id] || 0) + n * w; total += n; }); });
  return { sc:sc, total:total };
}
function navMain(){
  var S = navScores(), pins = navPins(), base = S.total >= navMain.FLOOR ? Object.keys(S.sc).filter(function(id){ return S.sc[id] >= navMain.MIN; }) : (navHtml.main || []).slice();
  Object.keys(pins).forEach(function(id){ var i = base.indexOf(id); if (pins[id] === 'pin' && i < 0) base.push(id); if (pins[id] === 'more' && i > -1) base.splice(i, 1); });
  if (base.indexOf('guide') < 0) base.push('guide');   /* help never folds */
  return base;
}
navMain.MIN = 3; navMain.FLOOR = 30;   /* no new globals (V39.83) */
function navLiveHint(){
  var S = navScores(); if (S.total >= navMain.FLOOR) return '';
  return '<div class="hint" style="margin:4px 12px 6px;font-size:11px;opacity:.8">' + esc(t('القائمةُ تترتّب حسب استعمالك بعد')) + ' ' + nm(navMain.FLOOR - S.total) + ' ' + esc(t('فتحة — واضغط مطوّلًا على أيِّ شاشة لتثبيتها فوق أو تحت')) + '</div>';
}

/* (V39.3) the folded last group: the screens opened less than five times in five weeks — never removed, one tap away */
function navMoreHtml(more){
  if (!more.length) return '';
  var g = 'المزيد', hc = more.some(function(i){ return i[0] === CUR; }), open = hc || OPEN[g];
  return '<div class="nav-section'+(hc?' has-cur':'')+'" data-open="'+(open?'true':'false')+'" data-g="'+esc(g)+'">'
    + '<button type="button" class="group-toggle" data-gt aria-expanded="'+(open?'true':'false')+'" aria-label="'+esc(t(g))+'">'
    + '<span class="group-label"><span class="item-icon" aria-hidden="true">\u22EF</span><span class="nav-t">'+esc(t(g))+'</span></span>'
    + '<span class="chevron" aria-hidden="true"></span></button><div class="group-panel"><div class="gp-head" aria-hidden="true">'+esc(t(g))+'</div>'
    + more.map(function(i){ return '<a href="#" class="sub'+(CUR===i[0]?' active':'')+'" data-p="'+i[0]+'">'+esc(t(i[1]))+'</a>' + navTabLinks(i[0]); }).join('')
    + '</div></div>';
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
function perfNote(kind, ms){ var L = PERF[kind]; if (!L) return; L.push(Math.round(ms)); if (L.length > 30) L.shift(); if (kind === 'r'){ try { liteMeasure(ms); } catch (eLM){ LS_ERR = eLM; } } }   /* (V37.23) القياسُ يغذّي الوضعَ الخفيف */
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
