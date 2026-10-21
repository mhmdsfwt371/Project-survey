/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-12-clicks-doc-3.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Document-level click handlers part 3 (parts 8–9).
   DEFINES : onDocClickPart8, onDocClickPart9
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
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

/* (V38.39) core + chunks: a click whose handler lives in app-office.js before it arrived throws ReferenceError;
   the click is remembered and replayed on the same element the moment the chunk lands — the user sees a toast, not an error */
function nskClick(e){
  try { return onDocClick(e); }
  catch (err){
    if (!nskChunkState().ready && err && err.name === 'ReferenceError'){
      nskChunkState().replay = e.target && e.target.closest ? e.target.closest('button, a, [data-page], [data-tab], [data-site], [data-go]') || e.target : e.target;
      toast('\u23F3 ' + t('يُحمَّل باقي التطبيق — ستُفتَح وحدَها'));
      return;
    }
    /* (V38.58) a press that throws is no longer silent on the device: it is said and recorded with the black box */
    try { softErr('ضغطة', err, 'حدث خطأٌ في هذه الضغطة — سُجِّل في «المزامنة والتعارض»'); } catch (e2){ LS_ERR = e2; }
    throw err;
  }
}
document.addEventListener('click', nskClick);

/* الحقلُ في خليةٍ وسمُه عنوانُ عموده وصفُّه — يُنسَب إليهما فيقرؤه القارئُ الصوتي */
