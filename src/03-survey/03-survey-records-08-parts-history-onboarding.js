/* ============================================================================
   FILE    : src/03-survey/03-survey-records-08-parts-history-onboarding.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : Parts picker, three items missing from the worker, the point's full history, and the first-run tour.
   DEFINES : posWatch, distKm, distTxt, siteLog, siteLogHtml, tourPages, tourMaybe, tourSpot, tourHtml
   GLOBALS : SOL_LINES, MYPOS, PROBE, SITE_LOG_MORE, LOG_KIND, TOUR
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ مُنتقي القطع — قائمةٌ واحدةٌ مبحوثةٌ وأنماطٌ جاهزة ═══
   كان اقتراحُ الحلِّ شبكةَ كلِّ أصناف الكتالوج بحقولِ كمّياتٍ فارغة — يبحث
   المهندسُ بعينه بين ثلاثين صنفًا عن أربعةٍ يريدها. صار قائمةً واحدةً تُبحَث
   بالكتابة، يُضاف منها الصنفُ بكمّيته سطرًا سطرًا. والأسطرُ التي تتكرّر من
   نقطةٍ لأخرى — قارئٌ وهوائيٌّ ولوحٌ شمسيٌّ وبطاريةٌ للمخيم القياسي — تُحفَظ
   نمطًا باسمٍ يُطبَّق بضغطة. والأنماطُ إعدادٌ يُرفَع ويُقرأ كسائر الإعدادات. */
var SOL_LINES = {}, SOL_Q = '', PAT_NAME = '';


/* ── التدقيق الهندسي — الاعتماد يحوّل الحالة ── */


/* ═══ ثلاثةٌ نقصت عن العامل ═══
   المسافةُ من موقعك، وأداةُ فحص الأجهزة، وإشعارُ واتساب. */

/* ── المسافة: الأقربُ أولًا في قائمة المواقع ── */
var MYPOS = null, POS_WATCH = 0;

function posWatch(){
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  try{
    POS_WATCH = navigator.geolocation.watchPosition(function(p){
      MYPOS = { lat:p.coords.latitude, lng:p.coords.longitude, at:Date.now() };
      if (CUR === 'sites') render(1);
    }, function(e){
      /* الرفضُ أو التعذُّرُ صامتًا يجعل الزرَّ يبدو معطوبًا وهو يعمل */
      softErr('تحديد الموقع', e,
        (e && e.code === 1) ? 'مُنع تحديدُ الموقع — اسمح به من إعدادات المتصفّح'
                            : 'تعذّر تحديدُ الموقع — جرّب في مكانٍ مكشوف');
    }, { enableHighAccuracy:false, maximumAge:60000, timeout:15000 });
  }catch(e){}
}

/* هافرساين مبسّط — نصفُ قطر الأرض بالكيلومترات */
function distKm(a, b){
  if (!a || !b) return null;
  var R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  var s = Math.sin(dLat/2) * Math.sin(dLat/2)
        + Math.cos(a.lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180)
        * Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
}

function distTxt(x){
  var k = distKm(MYPOS, x);
  if (k == null) return '';
  return k < 1 ? (nm(Math.round(k * 1000)) + ' م') : (nm(Math.round(k * 10) / 10) + ' كم');
}

/* ── أداة الفحص: تُشغَّل من جهاز المكتب على شبكة الميدان ── */
var PROBE = { on:false, done:0, up:0, down:0, log:[], t:0 };


/* ═══ سجلُّ النقطة — كلُّ ما جرى لها من أوّل يوم (V17.20) ═══
   السؤالُ المتكرّر: من زار هذه النقطة؟ ومن رفع صورَها؟ ومن اعتمدها ومتى؟
   والجوابُ كان متفرّقًا: الزيارةُ في وثيقتها، والتركيبُ في وثيقته، والصورُ
   في مجموعتها، والاعتماداتُ ختومٌ داخل الزيارة، والأحداثُ نصٌّ حرّ. فيُجمَع
   هنا من مصادره كلِّها في خطٍّ زمنيٍّ واحد: ماذا جرى · بيد من · متى · وما
   يُثبته (صورةٌ أو ملفٌّ أو ختم). */
function siteLog(id){
  var out = [], push = function(at, what, who, kind, extra){
    if (!at && !who) return;
    out.push({ at:+at || 0, what:what, who:who || '', kind:kind || '', extra:extra || null });
  };
  var r = (STATE.recs || {})[id], ins = (STATE.inss || {})[id], ds = (STATE.diss || {})[id];
  if (r){
    push(r.at, 'الزيارة الميدانية' + (r.access && r.access !== 'تم الوصول' ? ' — ' + t('تعذّر الوصول') : ''), r.by, 'visit');
    if (r.revisitAt) push(r.revisitAt, 'رُدّت لزيارةٍ أخرى' + (r.revisitNote ? ' — ' + r.revisitNote : ''), r.revisitBy, 'back');
    if (r.apprAt || r.review === 'approved') push(r.apprAt || r.at, 'الاعتماد التقني', r.apprBy || r.by, 'ok');
    if (r.minAt) push(r.minAt, minState(r) === 'returned' ? ('أعادتها الوزارة' + (r.minNote ? ' — ' + r.minNote : '')) : 'اعتماد الوزارة', r.minBy, minState(r) === 'returned' ? 'back' : 'ok');
    if (r.briefAt) push(r.briefAt, 'خلاصة الزيارة' + (r.bst ? ' — ' + t(r.bst) : '') + (r.brief ? ': ' + r.brief : ''), r.briefBy, 'note');   /* (V39.27) */
  }
  if (ins) push(ins.at, 'التركيب' + (ins.status ? ' — ' + t(ins.status) : '') + (ins.note ? ': ' + ins.note : ''), ins.by, 'ins');
  if (ds)  push(ds.at, 'الفكّ' + (ds.note ? ' — ' + ds.note : ''), ds.by, 'dis');
  if (ins && ins.briefAt) push(ins.briefAt, 'خلاصة التركيب' + (ins.bst ? ' — ' + t(ins.bst) : '') + (ins.brief ? ': ' + ins.brief : ''), ins.briefBy, 'note');
  if (ds && ds.briefAt) push(ds.briefAt, 'خلاصة الفك' + (ds.bst ? ' — ' + t(ds.bst) : '') + (ds.brief ? ': ' + ds.brief : ''), ds.briefBy, 'note');
  /* صورٌ أُخذت ولم تصل: الزيارةُ تقول كم أخذ الفنيُّ، والسجلُّ يقول كم وصل */
  if (r && r.phN){
    var got = (typeof photosOf === 'function' ? photosOf(id) : []).filter(function(p){ return !(p[1] || {}).del; }).length;
    if (got < r.phN) push(r.at + 1, t('أُخذت') + ' ' + nm(r.phN) + ' ' + t('صور') + ' — ' + t('وصل') + ' ' + nm(got) + ' — ' + t('والباقي في طابور جهاز الفنيّ أو تعذّر رفعُه'), 'back');
  }
  /* الصورُ: من رفعها ومتى — ولكلِّ صورةٍ إثباتُها */
  (typeof photosOf === 'function' ? photosOf(id) : []).forEach(function(p){
    var ph = p[1] || {};
    push(ph.at, 'صورة' + (ph.kind ? ' — ' + t(ph.kind) : '') + (ph.del ? ' (' + t('محذوفة') + ')' : ''), ph.by, 'photo', p[0]);
  });
  /* المهامُّ المسنَدةُ على النقطة */
  Object.keys(STATE.tasks || {}).forEach(function(k){
    var x = STATE.tasks[k];
    if (x && x.site === id) push(x.at, 'إسناد ' + t(kindLabel(x.kind) || '') + (x.to ? ' — ' + x.to : ''), x.by, 'task');
  });
  /* الأحداثُ: ما حمل نقطتَه، وما ذكرها في نصِّه (للقديم قبل الوسم) */
  var EV = (STATE.evlog && Object.keys(STATE.evlog).length) ? Object.keys(STATE.evlog).map(function(k){ return STATE.evlog[k]; })
          : (STATE.events || []);
  EV.forEach(function(e){
    if (!e) return;
    if (e.site === id || (e.what && String(e.what).indexOf(id) > -1)) push(e.ts, e.what, e.by, 'ev');
  });
  (SITE_LOG_MORE[id] || []).forEach(function(e){ push(e.ts, e.what, e.by, 'ev'); });
  out.sort(function(a, b){ return b.at - a.at; });
  /* لا يتكرّر السطرُ نفسُه من مصدرين */
  var seen = {}, uniq = [];
  out.forEach(function(x){
    var k = x.at + '|' + x.what + '|' + x.who;
    if (!seen[k]){ seen[k] = 1; uniq.push(x); }
  });
  return uniq;
}
/* أحداثٌ تُجلَب من القاعدة عند الطلب — بسقفٍ، ولا تُقرأ إلا لمن فتح السجل */
var SITE_LOG_MORE = {}, SITE_LOG_BUSY = '';

var LOG_KIND = { visit:'\u{1F4CD}', ins:'\u{1F527}', dis:'\u{1F9E9}', photo:'\u{1F4F7}', ok:'\u2705',
                 back:'\u21A9', note:'\u{1F5E8}', task:'\u{1F4CB}', ev:'\u2022' };
function siteLogHtml(id){
  var L = siteLog(id);
  return card(t('سجلُّ النقطة') + ' — ' + nm(L.length),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('كلُّ ما جرى لهذه النقطة من أوّل يوم: من زارها ومن رفع صورَها ومن اعتمدها — بالتاريخ.')) + '</p>'
    + (L.length
        ? '<div class="wt-log">' + L.map(function(x){
            return '<div class="wt-le">'
              + '<span class="hint num" style="margin:0">' + esc(x.at ? fmtDT(x.at) : '—') + '</span> '
              + (LOG_KIND[x.kind] || '\u2022') + ' ' + esc(t(x.what))
              + (x.who ? ' <b>' + esc(dispName(x.who)) + '</b>' : '')
              + (x.kind === 'photo' && x.extra ? ' <a href="#" data-phview="' + esc(x.extra) + '">' + esc(t('الصورة')) + '</a>' : '')
              + '</div>';
          }).join('') + '</div>'
        : '<p class="hint" style="margin:0">' + esc(t('لا سجلَّ بعد لهذه النقطة.')) + '</p>'),
    btn('\u{1F5C3} ' + t('اجلب القديم من القاعدة'),'btn-quiet btn-sm',' data-sitelog="' + esc(id) + '"'));
}

/* ═══ جولةُ البداية (V17.0) ═══
   من يفتح النظامَ أوّلَ مرةٍ يرى ستَّ مجموعاتٍ وستًّا وعشرين شاشةً فلا يعرف
   من أين يبدأ، فيسأل جارَه أو يترك. والمساعدُ القائمُ يجيب من سأل — ومن لا
   يعرف ماذا يسأل لا يسأل. فصارت جولةٌ تفتح نفسَها أوّلَ دخولٍ لكلِّ حسابٍ
   جديد: خطوةٌ لكلِّ شاشةٍ **من شاشاته هو** — لا شاشاتِ غيره — بترتيب يومه،
   فيها ما تفعله الشاشةُ بكلمةٍ واحدة، ويُضاء بندُها في القائمة وهو يقرأ،
   وزرٌّ يأخذه إليها. وتُفتَح بعدها متى شاء من زرِّ القبّعة في الشريط. */
var TOUR = { open:false, i:0, skip:null, prime:null };   /* (V32.3) جولةُ البداية تملك حالتَها (كانت TOUR.open/TOUR.i/TOUR.skip/TOUR.prime) */
/* صفحاتٌ تُفتَح من غيرها لا من القائمة — لا تصلح خطوةً في جولة */
TOUR.skip = { site:1, sel:1, svappr:1, minappr:1 };
/* أوّلُ ما يُفتَح في اليوم — إن كان من شاشات صاحب الحساب */
TOUR.prime = ['map', 'mywork', 'wtask', 'over', 'perf', 'ipc', 'users', 'sys'];
function tourPages(){
  var r = effRole(ROLE), nav = (ROLES[r] || {}).nav;
  var vis = (nav === '*') ? Object.keys(PAGE).filter(function(k){ return seesRaw(k); })
                          : (nav || []).filter(function(k){ return PAGE[k] && seesRaw(k); });
  vis = vis.filter(function(k){ return !TOUR.skip[k]; });
  var head = TOUR.prime.filter(function(p){ return vis.indexOf(p) > -1; });
  var rest = vis.filter(function(p){ return head.indexOf(p) < 0; });
  return head.concat(rest).slice(0, 8);
}


function tourMaybe(){
  try { if (lsGet('nsk14.tour') === (myUid() || '1')) return; } catch (e){ return; }
  if (!tourPages().length) return;
  TOUR.i = 0; TOUR.open = true;
}
/* يُضاء بندُ الشاشة في القائمة مع خطوتها — فيُعرَف مكانُها لا اسمُها فقط */
function tourSpot(){
  try {
    /* (V31.8) قياسُ الإقلاع على جوالٍ مُبطّأ: هذه الدالةُ أكلت ١٫٨ ثانية في أول دخول — كانت تمسح وتُمرّر في كلِّ رسمة، والتمريرُ
       (scrollIntoView) يفرض تخطيطَ الصفحة كلِّها. صارت لا تفعل شيئًا إن لم يتغيّر البندُ المضاء وما زال مُضاءً */
    var P0 = TOUR.open ? tourPages() : [], id0 = P0.length ? P0[Math.min(TOUR.i, P0.length - 1)] : '', lit = document.querySelector('.tour-spot');
    if (tourSpot.k === id0 && (id0 ? !!lit : !lit)) return;
    tourSpot.k = id0;
    var old = document.querySelectorAll('.tour-spot');
    for (var i = 0; i < old.length; i++) old[i].classList.remove('tour-spot');
    if (!TOUR.open) return;
    var P = tourPages(); if (!P.length) return;
    var id = P[Math.min(TOUR.i, P.length - 1)];
    var el = document.querySelector('.nav a[data-p="' + id + '"], [data-p="' + id + '"]');
    if (el){
      el.classList.add('tour-spot');
      var sec = el.closest('.nav-section');
      if (sec && sec.getAttribute('data-open') === 'false'){ sec.setAttribute('data-open', 'true'); OPEN[sec.getAttribute('data-g')] = true; }
      if (el.scrollIntoView) setTimeout(function(){ try { if (el.isConnected) el.scrollIntoView({ block:'nearest' }); } catch (e2){ LS_ERR = e2; } }, 900);   /* (V31.8) التمريرُ بعد ظهور الواجهة لا قبلها — يفرض تخطيطَ الصفحة كلِّها */
    }
  } catch (e){ LS_ERR = e; }
}
function tourHtml(){
  if (!TOUR.open) return '';
  var P = tourPages(); if (!P.length){ TOUR.open = false; return ''; }
  if (TOUR.i >= P.length) TOUR.i = P.length - 1;
  var id = P[TOUR.i], pg = PAGE[id] || {}, last = TOUR.i === P.length - 1;
  return '<div class="wt-back" data-tourclose="0"></div>'
    + '<div class="pop wt-sheet" id="tourSheet" role="dialog" aria-label="' + esc(t('جولة البداية')) + '">'
    + '<div class="pop-head"><div style="min-width:0">'
    +   '<div class="pid hint" style="margin:0">\u{1F393} ' + esc(t('جولة البداية')) + ' \u00b7 <span class="num">' + nm(TOUR.i + 1) + ' ' + esc(t('من')) + ' ' + nm(P.length) + '</span></div>'
    +   '<h3 style="margin-top:3px">' + esc(t(pg.t || id)) + '</h3></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm pop-x" data-tourclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">'
    +   '<div class="hint" style="margin:0 0 6px">' + esc(t('مكانها')) + ': <b>' + esc(t(pg.m || '')) + '</b> \u2190 ' + esc(t(pg.t || '')) + '</div>'
    +   '<p style="margin:0 0 10px;font-size:14px;line-height:1.7">' + esc(t(pg.l || t('شاشةٌ من شاشاتك — افتحها لترى ما فيها.'))) + '</p>'
    +   (TOUR.i === 0
        ? '<div class="alert info" style="margin:0 0 10px"><span>' + esc(t('هذه شاشاتُك أنت — لكلِّ دورٍ شاشاتُه. البندُ المضيءُ في القائمة هو مكانُ هذه الشاشة.')) + '</span></div>'
        : '')
    +   (last
        ? '<div class="alert ok" style="margin:0 0 10px"><span>' + esc(t('وبقيّةُ الشاشات في القائمة — والمساعدُ 🧭 يجيبك إن سألتَه بكلماتك، وزرُّ 🛠 يبلّغ عن أيِّ عطل.')) + '</span></div>'
        : '')
    +   '<div class="actions" style="margin:0">'
    +     btn('\u2190 ' + t('افتح هذه الشاشة'),'btn-primary btn-sm',' data-tourgo="' + esc(id) + '"')
    +     btn('\u2039 ' + t('السابق'),'btn-quiet btn-sm',' data-tourprev="1"' + (TOUR.i ? '' : ' disabled'))
    +     btn(last ? '\u2714 ' + t('تمّت الجولة') : t('التالي') + ' \u203A', last ? 'btn-secondary btn-sm' : 'btn-secondary btn-sm', ' data-tournext="1"')
    +   '</div>'
    +   '<p class="hint" style="margin:10px 0 0"><button type="button" class="btn btn-quiet btn-sm" data-tourstop="1">' + esc(t('لا تعرضها ثانيةً')) + '</button></p>'
    + '</div></div>';
}

