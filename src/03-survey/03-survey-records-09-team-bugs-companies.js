/* ============================================================================
   FILE    : src/03-survey/03-survey-records-09-team-bugs-companies.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : Team numbers in one pass, bug report and bug screen, accepted-only work rule, daily WhatsApp briefing, company phone book and company rename.
   DEFINES : phonesCard, bugCtx, bugList, bugSheet, pageTitle, dayStart, briefingRows, briefingHtml, coTel, coTelOf, coEmailSet, coLiaison … (+2 more)
   GLOBALS : PH_MISS, BUG_OPEN, BUG_KINDS, BUG_ST_C, BUG_DEC, CO_STALL, WA_KINDS
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */


var PH_MISS = [];
function phonesCard(){
  var U = STATE.users || {}, all = [], no = [];
  Object.keys(U).forEach(function(k){
    var u = U[k]; if (!u || u.active === false || !u.name) return;
    all.push(u); if (!u.ph) no.push(u.name);
  });
  if (!all.length) return '';
  return card(t('أرقام الفريق') + ' — ' + nm(all.length - no.length) + ' / ' + nm(all.length),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('ألصق سطرًا لكلِّ شخص: الاسمُ ثم الرقم — بأيِّ فاصل. يُطابَق بالاسم كما هو في الحسابات.')) + '</p>'
    + (no.length
        ? '<div class="alert warn" style="margin:0 0 8px"><span><b>' + nm(no.length) + '</b> ' + esc(t('بلا جوال')) + ': '
          + esc(no.slice(0, 8).join(' · ')) + (no.length > 8 ? ' …' : '') + '</span></div>'
        : '<div class="alert ok" style="margin:0 0 8px"><span>' + esc(t('كلُّ الفريق له رقم — «بلاغ اليوم» جاهز')) + '</span></div>')
    + '<textarea id="phBulk" rows="4" dir="auto" placeholder="' + esc('أحمد سعيد 0551234567\nخالد بندر, 0559876543') + '"></textarea>'
    + (PH_MISS.length
        ? '<p class="hint" style="margin:6px 0 0;color:#E05252">' + esc(t('لم يُعرَف')) + ': ' + esc(PH_MISS.slice(0, 6).join(' · ')) + '</p>'
        : ''),
    btn('\u{1F4F1} ' + t('احفظ الأرقام'),'btn-primary btn-sm',' data-phbulk="1"'));
}

/* ═══ بلاغُ عطلٍ أو طلبٍ جديد (V16.98) ═══
   العطلُ كان يُبلَّغ بمكالمةٍ أو رسالةٍ: «الشاشةُ الفلانيةُ لا تفتح» — بلا
   نسخةٍ ولا دورٍ ولا جهازٍ ولا الشاشةِ التي كان فيها، فيُسأل عنها كلِّها ثم
   يُبحَث. صار البلاغُ من داخل النظام: يكتب المبلِّغُ ما رآه، ويُرفَق تلقائيًّا
   ما لا يعرف أن يقوله — النسخةُ والدورُ والشاشةُ واللغةُ والجهازُ وحالُ
   الشبكة وآخرُ خطأٍ وقع في جلسته. ويُرفَع إلى القاعدة، ومنها يفتحه الخادمُ
   بلاغًا في مستودع المشروع بنفسه — فيصل إلى من يُصلح بلا أن يبعثه أحد. */
var BUG_OPEN = false, BUG_KIND = 'عطل';
var BUG_KINDS = ['عطل', 'طلب جديد', 'اقتراح'];
function bugCtx(){
  var nav = (typeof navigator === 'object' ? navigator : {});
  return {
    /* النسخةُ من الشارة نفسِها — مصدرٌ واحدٌ لا ثابتٌ يُنسى تحديثُه */
    v: appVer(),   /* (V39.5) the pill reads in the user's language — the build's version is kept in data-v */
    page: CUR, tab: (TABS[CUR] ? PTAB[CUR] : '') || '',
    role: effRole(ROLE), lang: LANG, online: !!nav.onLine,
    ua: String(nav.userAgent || '').slice(0, 180),
    scr: (typeof screen === 'object' ? (screen.width + 'x' + screen.height) : ''),
    err: LS_ERR ? String(LS_ERR.message || LS_ERR).slice(0, PG_Q ? 5000 : 200) : ''
  };
}

/* ═══ شاشةُ البلاغات (V16.99) ═══
   البلاغُ يُدار حيث يُصلَح — في المستودع؛ لكنّ من أرسله يسأل: وصل؟ وفُتح؟
   وأُغلق؟ فصارت له شاشةٌ تقرأ المجموعةَ نفسَها: بلاغُه بحالته ورقمِه في
   المستودع ورابطِه. من يُصلح يرى الكلَّ، وغيرُه يرى بلاغاتِه وحدَها. */
function bugList(){
  var B = STATE.bugs || {}, me = STATE.meta.name || '', boss = rankOf(effRole(ROLE)) >= rankOf('engineer');
  return Object.keys(B).map(function(k){ return B[k]; }).filter(function(b){
    return b && (boss || b.by === me);
  }).sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
var BUG_ST_C = { 'جديد':'warn', 'مقبول':'acc', 'مرفوض':'bad', 'مفتوح':'acc', 'قيد التنفيذ':'acc', 'مغلق':'ok' };
/* ═══ لا يُعمَل إلا بما قُبل (V17.43) ═══
   كان البلاغُ يُفتَح في المستودع فورَ إرساله، فيختلط ما يستحقُّ العملَ بما
   لا يستحقُّه، ويبدأ الإصلاحُ قبل أن يقرّر صاحبُ القرار. صار له بابان: يصل
   «جديدًا» فيُعرَض على المدير في شاشةٍ واحدةٍ بكلِّ تاريخه، فإن **قَبِله**
   صار «مقبولًا» وهو وحدَه ما يُعمَل عليه، وإن **ردّه** صار «مرفوضًا» بسببه
   المكتوب — ويُقفَل في المستودع فلا يُشتغَل به. والقرارُ يُختَم باسم صاحبه
   ووقته، ويُرى في سجلِّ البلاغ ولا يُمحى. */
var BUG_DEC = '', BUG_F = '';


/* اللوحُ يُفتَح من أيِّ شاشة — فيُبلَّغ العطلُ حيث وقع لا بعد أن يُنسى */
function bugSheet(){
  if (!BUG_OPEN) return '';
  var c = bugCtx();
  return '<div class="wt-back" data-bugclose="0"></div>'
    + '<div class="pop wt-sheet" id="bugSheet" role="dialog" aria-label="' + esc(t('بلاغ')) + '">'
    + '<div class="pop-head"><div><h3 style="margin:0">\u{1F6E0} ' + esc(t('بلّغ عن عطلٍ أو اطلب جديدًا')) + '</h3></div>'
    + '<button type="button" class="btn btn-quiet btn-sm pop-x" data-bugclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">'
    + '<div class="chips" style="margin:0 0 8px">' + BUG_KINDS.map(function(k){
        return '<button type="button" class="chip' + (BUG_KIND === k ? ' on' : '') + '" data-bugkind="' + esc(k) + '">' + esc(t(k)) + '</button>';
      }).join('') + '</div>'
    + '<div class="field"><label>' + esc(t('ما الذي حدث؟')) + '</label>'
    +   '<textarea id="bgTxt" dir="auto" rows="4" placeholder="' + esc(t('اكتب ما رأيتَه بالضبط: ضغطتُ كذا فحدث كذا.')) + '">' + esc(BUG_FROM_ASSIST || '') + '</textarea></div>'   /* (V37.27) ما كتبه في المساعد */
    + '<div class="field"><label>' + esc(t('ما الذي كنتَ تتوقّعه؟')) + ' <span class="hint">(' + esc(t('اختياري')) + ')</span></label>'
    +   '<input id="bgWant" dir="auto"></div>'
    + '<div class="alert info" style="margin:8px 0 0"><span>' + esc(t('يُرفَق تلقائيًّا')) + ': '
    +   '<span class="num">' + esc(verShow(c.v)) + '</span> \u00b7 ' + esc(t(pageTitle(c.page) || ((FIELD_PAGES[c.page] || {}).t) || '')) + ' \u00b7 '
    +   esc(t((ROLES[c.role] || {}).n || c.role)) + ' \u00b7 ' + esc(c.online ? t('متصل') : t('غير متصل'))
    +   (c.err ? ' \u00b7 ' + esc(t('آخرُ خطأٍ في جلستك')) : '') + '</span></div>'
    + '<div class="actions" style="margin:10px 0 0">'
    +   btn('\u{1F4E4} ' + t('أرسل البلاغ'),'btn-primary btn-sm',' data-bugsend="1"')
    +   btn(t('إلغاء'),'btn-quiet btn-sm',' data-bugclose="0"') + '</div>'
    /* بلاغاتي: «وصل؟ فُتح؟ أُغلق؟» — يقرؤها المبلِّغُ هنا بلا شاشةٍ أخرى */
    + (function(){
        var mine = bugList().slice(0, 6);
        if (!mine.length) return '';
        return '<div class="hint" style="margin:12px 0 4px;font-weight:700">' + esc(t('بلاغاتي')) + '</div>'
          + '<div class="wt-log">' + mine.map(function(b){
              return '<div class="wt-le"><span class="hint num" style="margin:0">' + esc(stepAgo(b.at || 0)) + '</span> '
                + esc(String(b.txt || '').slice(0, 60)) + ' ' + pill(b.status || 'جديد', BUG_ST_C[b.status] || '')
                + (b.gh ? ' <a target="_blank" rel="noopener" href="https://github.com/mhmdsfwt371/Project-survey/issues/' + esc(b.gh) + '">#' + nm(b.gh) + '</a>' : '')
                + '</div>';
            }).join('') + '</div>';
      })()
    + '</div></div>';
}
function pageTitle(id){ var p = (typeof PAGE === 'object' && PAGE[id]) || null; return p ? p.t : ''; }

/* ═══ بلاغُ اليوم عبر واتساب (V16.97) ═══
   المتابعةُ اليوميةُ كانت مكالماتٍ: من معه ماذا اليومَ؟ ومن أنجز؟ ومن لم
   يبدأ؟ والأرقامُ في الهاتف لا في النظام. فصار للفريق كلِّه جدولٌ واحد:
   لكلِّ شخصٍ جوالُه (أو تنبيهٌ أنه بلا جوال)، وما عليه اليومَ من إسناد،
   وما أنجزه اليومَ، وما عليه من مهامِّ الاجتماع — وزرُّ واتساب يفتح رسالةً
   جاهزةً بكلِّ ذلك ورابطِ التطبيق، ضغطةٌ لكلِّ شخص؛ و«نسخُ الكل» يجمع
   الرسائلَ لمجموعة الفريق. لا خادمَ ولا اشتراك: رابطُ واتساب العاديّ. */
function dayStart(){ var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
function briefingRows(){
  var U = STATE.users || {}, t0 = dayStart(), out = [];
  Object.keys(U).forEach(function(k){
    var u = U[k]; if (!u || u.active === false || !u.name) return;
    var r = effRole(u.role);
    if (['tech','supervisor','engineer','helper','cins','driver'].indexOf(r) < 0) return;
    var asn = { survey:[], install:[], dis:[] }, open = 0;
    Object.keys(STATE.tasks || {}).forEach(function(tk){
      var x = STATE.tasks[tk]; if (!x || x.to !== u.name || x.status === 'معتمد') return;
      if (asn[x.kind]) asn[x.kind].push(x.site); open++;
    });
    var done = 0;
    Object.keys(STATE.recs || {}).forEach(function(id){ var rc = STATE.recs[id]; if (rc && rc.by === u.name && (rc.at || 0) >= t0) done++; });
    Object.keys(STATE.inss || {}).forEach(function(id){ var ic = STATE.inss[id]; if (ic && ic.by === u.name && (ic.at || 0) >= t0) done++; });
    var wt = (typeof wtRows === 'function' ? wtRows() : []).filter(function(w){ return w.st !== 'مكتمل' && String(w.who || '').trim() === u.name; }).length;
    out.push({ uid:k, name:u.name, role:r, ph:u.ph || '', asn:asn, open:open, done:done, wt:wt });
  });
  out.sort(function(a, b){ return (b.open - a.open) || (rankOf(b.role) - rankOf(a.role)) || arCmp(a.name, b.name); });
  return out;
}


function briefingHtml(){
  var R = briefingRows(), noPh = R.filter(function(x){ return !x.ph; }).length;
  var idle = R.filter(function(x){ return x.open && !x.done; }).length;
  return card(t('بلاغ اليوم عبر واتساب') + ' — ' + nm(R.length),
      '<p class="hint" style="margin:0 0 8px">' + esc(t('لكلِّ شخصٍ رسالةٌ جاهزةٌ بما عليه اليومَ ورابطِ التطبيق — ضغطةٌ تفتح واتساب على رقمه، وأنت تضغط إرسال.')) + '</p>'
      + stats([['أعضاء', N(R.length)], ['بلا جوال', N(noPh), noPh ? 'bad' : 'ok'],
               ['أُسند إليهم ولم يبدؤوا', N(idle), idle ? 'wrn' : 'ok'],
               ['أنجزوا اليوم', N(R.reduce(function(a, x){ return a + x.done; }, 0)), 'ok']])
      + (R.length
          ? table(['الاسم','الدور','الجوال','عليه اليوم','أنجز اليوم','مهام الاجتماع',''], R.map(function(x){
              return [esc(x.name), esc(t((ROLES[x.role] || {}).n || x.role)),
                x.ph ? '<span class="num" dir="ltr">' + esc(x.ph) + '</span>' : pill('بلا جوال', 'bad'),
                x.open ? '<span class="num">' + nm(x.open) + '</span>' : '<span class="hint">—</span>',
                x.done ? pill(nm(x.done), 'ok') : (x.open ? pill('لم يبدأ', 'warn') : '<span class="hint">—</span>'),
                x.wt ? '<span class="num">' + nm(x.wt) + '</span>' : '<span class="hint">—</span>',
                btn('\u{1F4AC} ' + t('واتساب'), x.ph ? 'btn-primary btn-sm' : 'btn-quiet btn-sm', ' data-brief="' + esc(x.uid) + '"' + (x.ph ? '' : ' disabled'))];
            }))
          : '<p class="hint" style="margin:0">' + esc(t('لا أعضاءَ ميدانيّين في الحسابات بعد.')) + '</p>'),
      btn('\u{1F4CB} ' + t('انسخ رسائل الكل'),'btn-secondary btn-sm',' data-briefall="1"'));
}


/* ═══ دفترُ جوالات الشركات ═══
   كان جوالُ المنسّق حقلًا فارغًا يُكتَب في كلِّ مرة: من أراد إشعارَ شركةٍ
   بحث عن رقمها في هاتفه، فيُخطئ حرفًا أو يُرسل لغير صاحبها. صار الرقمُ
   صفةً للشركة تُحفَظ مرةً وتُرفَع (settings/cotel) وتُسحَب على كلِّ جهاز —
   والقاعدةُ تحمي الوثيقةَ (أرقامُ الناس لا تُقرأ لكلِّ دور).
     ومنها زرُّ واتساب: يُضغَط فيفتح محادثةَ الشركة بنصٍّ جاهزٍ يذكر ما جرى
   — إشعارُ تركيبٍ قادم، أو محضرُ تسليمٍ حُرِّر، أو فكٌّ مجدول. */

function coTel(){
  if (!CFG.cotel || typeof CFG.cotel !== 'object') CFG.cotel = {};
  return CFG.cotel;
}
function coTelOf(co){ return String(coTel()[co] || '').trim(); }
/* (V28.5) ملاحظةُ «تحديثات المنصة»: ضابطُ الاتصال لكلِّ شركة — وثيقةٌ يقرؤها الكلُّ (الوزارةُ تراه في متابعتها)، والجوالُ يبقى في دفتره المحجوب */
var CO_STALL = null;

function coEmailSet(co, v){
  if (!may('approve')){ toast(t('دفترُ الجوالات للمهندس وحده')); return; }
  v = String(v || '').trim().toLowerCase();
  if (v && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v)) return;   /* يُحفَظ حين يكتمل العنوان */
  if (v) coTel()['e|' + co] = v; else delete coTel()['e|' + co];
  CORE.set('cfg', 'cotel', Object.assign({}, coTel()));
  clearTimeout(coEmailSet._t); coEmailSet._t = setTimeout(function(){ logEvent('بريد شركة — ' + co + ' \u00b7 ' + (v || 'حُذف')); }, 2500);
}


function coLiaison(){ if (!CFG.coliaison || typeof CFG.coliaison !== 'object') CFG.coliaison = {}; return CFG.coliaison; }

function coLiaisonSet(co, v){
  if (!may('approve')){ toast(t('دفترُ الشركات للمهندس وحده')); return; }
  v = String(v || '').trim().slice(0, 60);
  if (v) coLiaison()[co] = v; else delete coLiaison()[co];
  CORE.set('cfg', 'coliaison', Object.assign({}, coLiaison()));   /* يُحفَظ مع الكتابة (الطابورُ يجمع) — والأثرُ عند الخروج من الحقل لا مع كلِّ حرف */
  clearTimeout(coLiaisonSet._t); coLiaisonSet._t = setTimeout(function(){ logEvent('ضابطُ اتصال شركة — ' + co + ' \u00b7 ' + (v || 'حُذف')); }, 2500);
}
function coTelSet(co, ph){
  if (!may('approve')){ toast(t('دفترُ الجوالات للمهندس وحده')); return; }
  var v = String(ph || '').replace(/[^\d+]/g, '');
  if (v) coTel()[co] = v; else delete coTel()[co];
  CORE.set('cfg', 'cotel', Object.assign({}, coTel()));
  logEvent('جوال شركة — ' + co + ' \u00b7 ' + (v || 'حُذف'));
}
/* نصُّ الإشعار بحسب ما جرى — لا نصٌّ واحدٌ لكلِّ حال */
var WA_KINDS = {
  plan:  { n:'إشعار تركيب قادم',  i:'\u{1F4C5}' },
  hand:  { n:'إشعار تسليم',       i:'\u{1F91D}' },
  dis:   { n:'إشعار فك',          i:'\u{1F9E9}' }
};


