/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-06-long-lists-storage-clicks.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Long lists (100 first then 'show more'), persistent storage request, table and window clicks.
   DEFINES : moreKey, capList, moreHtml, render, renderKeepGrab, renderKeepPut, render0, enterApp, enterShell, syncOnHide, storagePersistMaybe, a11yFieldNames, render0Tail
   GLOBALS : MORE_SHOWN, PERSIST, ACTS_CACHE
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ القوائمُ الطويلة مئةً أوّلًا ثم «اعرض المزيد» (V26.2) — قرارُ المالك ═══
   صفحةٌ تبني ثلاثَمئة صفٍّ (أربعةُ آلافِ عنصر) تأخذ ربعَ ثانيةٍ على المكتب وثانيةً على الهاتف مع كلِّ ضغطة — وهو أقربُ
   شيءٍ إلى «التعليق». صارت كلُّ قائمةٍ تبني مئةً، وزرٌّ واحدٌ أسفلَ الصفحة يزيد مئتين كلَّ ضغطة؛ والبحثُ في الصفحة
   يفتح الكلَّ كما كان (حتى خمسة آلاف). المفتاحُ صفحةٌ وشريحة، فلا يحمل عدُّ صفحةٍ إلى أخرى. */
var MORE_SHOWN = {}, MORE_FIRST = 100, MORE_STEP = 200, MORE_CUT = 0;
function moreKey(){ return CUR + ':' + ((typeof PTAB === 'object' && PTAB && PTAB[CUR]) || ''); }
/* (V37.80) توكنُ نظام البطاقات يُحمَّل عند فتح «المخيمات المركزية» أو قائمة التجارب فقط — لا لكلِّ مستخدمٍ عند الدخول */
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
  /* (V38.74) the owner: «لما أكتب في البحث بيمسح أوتوماتيك». A redraw while typing (a live update, a photo arriving, the
     sync badge) rebuilt the field from the page's state and erased what was being typed and closed the keyboard. The field
     being typed in survives every redraw: same value, focus and caret. */
  var keep = renderKeepGrab();
  try { return render0(force); } finally { DB.memoReset(); renderKeepPut(keep); a11yFieldNames(); }
}
/* (V39.37) the review sweep (13 roles × every page): 119 fields on the engineer's pages, 149 on the buyer's and 127 on the
   accountant's had no name a screen reader could say — selects and inputs placed beside a text, not inside a <label>. After
   every render each unnamed field takes the text beside it (its label, key or hint), or a select its first option. */
function a11yFieldNames(){
  try {
    var root = document.querySelector('main.shell') || document.body;
    var els = root.querySelectorAll('select:not([aria-label]):not([title]), input:not([type=hidden]):not([aria-label]):not([title]):not([placeholder]), textarea:not([aria-label]):not([title]):not([placeholder])');
    for (var i = 0; i < els.length && i < 600; i++){
      var el = els[i];
      if ((el.id && document.querySelector('label[for="' + el.id + '"]')) || el.closest('label')) continue;
      var txt = '', pv = el.previousElementSibling;
      if (pv && !/^(SELECT|INPUT|TEXTAREA|BUTTON)$/.test(pv.tagName)) txt = pv.textContent;
      if (!txt && el.parentElement){ var lb = el.parentElement.querySelector('label, .k, .hint, b, strong'); if (lb && lb !== el && !lb.contains(el)) txt = lb.textContent; }
      if (!txt && el.tagName === 'SELECT' && el.options && el.options[0]) txt = el.options[0].textContent;
      if (!txt && el.name) txt = el.name;
      txt = String(txt || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      if (txt) el.setAttribute('aria-label', txt);
    }
  } catch (e){ LS_ERR = e; }
}
function renderKeepGrab(){
  try {
    var ae = document.activeElement; if (!ae) return null;
    var tg = ae.tagName; if (tg !== 'INPUT' && tg !== 'TEXTAREA') return null;
    if (/^(file|checkbox|radio|button|submit|range|color)$/.test(String(ae.type || ''))) return null;
    var sel = '';
    if (ae.id) sel = /^[A-Za-z][\w-]*$/.test(ae.id) ? '#' + ae.id : '[id="' + String(ae.id).replace(/"/g, '\\"') + '"]';
    else { for (var i = 0; i < ae.attributes.length; i++){ var a = ae.attributes[i]; if (/^data-/.test(a.name)){ sel = tg.toLowerCase() + '[' + a.name + '="' + String(a.value).replace(/"/g, '\\"') + '"]'; break; } } }
    if (!sel && ae.name) sel = tg.toLowerCase() + '[name="' + String(ae.name).replace(/"/g, '\\"') + '"]';
    if (!sel) return null;
    var st = null, en = null; try { st = ae.selectionStart; en = ae.selectionEnd; } catch (e0){ LS_ERR = e0; }
    return { el:ae, sel:sel, v:ae.value, s:st, e:en };
  } catch (e){ LS_ERR = e; return null; }
}
function renderKeepPut(k){
  if (!k) return;
  try {
    if (document.body.contains(k.el) && document.activeElement === k.el) return;   /* not rebuilt — nothing to do */
    var el = document.querySelector(k.sel); if (!el || el === document.activeElement) return;
    if (el.value !== k.v) el.value = k.v;
    try { el.focus({ preventScroll:true }); } catch (e1){ el.focus(); }
    if (k.s !== null && k.s !== undefined){ try { el.setSelectionRange(k.s, k.e); } catch (e2){ LS_ERR = e2; } }
  } catch (e){ LS_ERR = e; }
}
function render0(force){
  if (PH_IDX && Object.keys(STATE.photos || {}).length !== phIdx.len) PH_IDX = null;   /* (V37.26) صورةٌ أُضيفت مباشرةً بين رسمتين تُرى — والكتابةُ والورودُ يُبطلانه أصلًا */
  try { assistSync(); setTimeout(assistSync, 0); } catch (eA){ LS_ERR = eA; }
  try { phStaleSync(); } catch (eS){ LS_ERR = eS; }   /* (V37.8) تنبيهُ الصور المعلّقة أكثرَ من ساعة */
  try { liteSync(); } catch (eL){ LS_ERR = eL; }   /* (V37.18) شريطُ الوضع الخفيف */
  try { qStaleSync(); } catch (eQ){ LS_ERR = eQ; }   /* (V37.29) */
  try { assistBadgeSync(); } catch (eA){ LS_ERR = eA; }   /* (V37.30) */
  try { skinRowSync(); } catch (eS2){ LS_ERR = eS2; }   /* (V37.33) */
  if (CUR === 'trials' || CUR === 'chain'){ try { trialLinkExisting(); } catch (eT){ LS_ERR = eT; } }   /* (V37.44) ربطُ ما عُلِّم من قبل — بلا إنشاء */
  if (!CFG.execOvSeeded && CFG_PULLED){ try { execOvSeed(); } catch (eXS){ LS_ERR = eXS; } }   /* (V37.61) بذرُ قرارات التقرير مرةً — بعد وصول إعدادات السحابة */
  var rsB = document.getElementById('resetBtn'); if (rsB && !rsB.textContent) rsB.textContent = '\u{1F9F9} ' + t('إعادة ضبط التطبيق');   /* (V36.1) فورًا، ومرةً بعد الرسمة لما تغيّر فيها */
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
  /* (V38.61) and the installation's edit sheet */
  var iqOld = document.getElementById('insqSheet'); if (iqOld) iqOld.parentNode.removeChild(iqOld);
  if (typeof insqState === 'function' && insqState().id){ var iqW = document.createElement('div'); iqW.innerHTML = insqSheet(); if (iqW.firstChild) document.body.appendChild(iqW.firstChild); }
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
  /* (V38.39) core + chunks: the office/ministry/reports screens arrive in app-office.js after first paint.
     Until then a request for one of them shows a loading card; the chunk re-renders when it lands (nskChunkReady). */
  if (!p && !nskChunkState().ready){ nskChunkState().waiting = CUR; p = { l:'جارٍ التحميل', body:function(){ return alertBox('info', t('يُحمَّل باقي التطبيق — ثوانٍ على شبكةٍ عادية، وأكثرُ قليلًا في المشاعر؛ تُفتَح الشاشةُ وحدَها حين يصل')); } }; }
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
  return render0Tail(wasCur, p, pl, wasTab);   /* (V39.38) the rest lives in render0Tail — kept under 150 lines (audit-health) */
}
/* (V39.38) the second half of render0, moved out whole to keep each under 150 lines — same statements, same order */
function render0Tail(wasCur, p, pl, wasTab){
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
  try { if (typeof chTopSync === 'function') chTopSync(); } catch (eCT){ LS_ERR = eCT; }   /* (V39.8) the unread count on the top bar */

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
  /* (V38.7) النظرةُ العامة — لوحٌ على الجسد كغيره */
  { var ovh = document.getElementById('ovHost');
    if (!ovh){ ovh = document.createElement('div'); ovh.id = 'ovHost'; document.body.appendChild(ovh); }
    ovh.innerHTML = (EXT && EXT.ovOpen) ? extOvSheet() : ''; }
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
  if (mu && mu.innerHTML) mu.innerHTML = '';   /* (V39.37) the review sweep: the map's layer kept its help and queue windows under other pages — two elements with one id */
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
  c.innerHTML = langFix((p.full ? p.body() : (head + p.body()))
    + moreHtml()   /* (V26.2) */
    + (HELP_OPEN ? helpHtml() : '')
    + '' + gedHtml()   /* (V36.1) المساعدُ في حاويته الثابتة — assistSync؛ (V36.2) ونافذةُ التعديل الموحّد */
    + (QUEUE_OPEN ? queueHtml() : ''));   /* (V39.5) langFix: the English percent sign in English */

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
function storagePersistMaybe(force){
  var ns = (typeof navigator === 'object') && navigator.storage;
  if (!ns || typeof ns.persist !== 'function' || typeof ns.persisted !== 'function'){ PERSIST.st = 'na'; return Promise.resolve('na'); }
  return ns.persisted().then(function(ok){
    if (ok){ PERSIST.st = 'yes'; PERSIST.at = Date.now(); return 'yes'; }
    /* (V39.1) asked again after a week, and at once when the app is installed to the home screen — browsers grant it more
       readily then. It was asked once ever, so 6 of 16 devices (both supervisors' among them) stayed without it. */
    var asked = +(lsGet('nsk14.persistAsk') || 0);
    if (!force && asked && Date.now() - asked < 7 * 864e5){ PERSIST.st = 'no'; return 'no'; }
    lsSet('nsk14.persistAsk', String(Date.now()));
    return ns.persist().then(function(g){ PERSIST.st = g ? 'yes' : 'no'; PERSIST.at = Date.now(); return PERSIST.st; });
  }).catch(function(){ PERSIST.st = 'no'; return 'no'; });
}

/* قائمةُ الخصائص المربوطة، مشتقّةً من نصِّ المعالجات لا مكتوبةً بيد.
   وإن تعذّر الاشتقاق — بتصغيرٍ أو محرّكٍ لا يُرجع النص — لم يُتَّهم زرٌّ
   بريءٌ بالموت: تُعَدُّ كلُّها مربوطةً، ويمسك حارسُ الحُرّاس العطلَ عند الفحص. */
var ACTS_CACHE = null;


/* المستمعُ دالةٌ مسمّاةٌ لا مجهولة: منها تُشتقُّ قائمةُ الخصائص المربوطة،
   فلا تُكتَب بيدٍ ولا تُنسى. */

