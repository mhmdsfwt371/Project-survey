/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-09-clicks-a-3.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Delegated click handlers, group A part 3.
   DEFINES : clickAPart6, clickAPart7
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
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
  var fsh = e.target.closest('[data-fsech]');   /* (V37.54) فتحُ القسم في مكانه — بلا إعادة رسم */
  if (fsh){ var sec = fsh.closest('.fsec'), body = sec && sec.querySelector('.fsec-b'); if (sec && body){ var openNow = sec.classList.toggle('open'); body.hidden = !openNow; fsh.setAttribute('aria-expanded', openNow ? 'true' : 'false'); fsecSet(fsh.getAttribute('data-fsech'), openNow); } return true; }
  var fcl = e.target.closest('[data-fclr]');
  if (fcl){ var fk = fcl.getAttribute('data-fclr'); if (fk === 'all'){ FILT.zone = ''; FILT.type = ''; FILT.route = ''; FILT.floor = ''; FILT.work = ''; FILT.life = ''; FILT.exec = ''; FILT.ccg = ''; } else FILT[fk] = ''; LIST_SHOWN = LIST_PAGE; render(1); if (typeof mapPaint === 'function' && CUR === 'map') mapPaint(); return true; }
  var fxf = e.target.closest('[data-fx]'); if (fxf){ FILT.exec = fxf.getAttribute('data-fx') || ''; LIST_SHOWN = LIST_PAGE; render(1); if (typeof mapPaint === 'function' && CUR === 'map') mapPaint(); return true; }   /* (V37.52) */
  var fgf = e.target.closest('[data-fg]'); if (fgf){ FILT.ccg = fgf.getAttribute('data-fg') || ''; LIST_SHOWN = LIST_PAGE; render(1); if (typeof mapPaint === 'function' && CUR === 'map') mapPaint(); return true; }
  var tdn = e.target.closest('[data-techdone]'); if (tdn){ if (techDoneSet(tdn.getAttribute('data-techdone'), true)){ logEvent('تمت الزيارةُ التقنية — ' + tdn.getAttribute('data-techdone')); toast(t('صارت زيارةً تمّت — تنتظر الاعتماد')); render(1); if (typeof mapPaint === 'function' && MAP) mapPaint(); } return true; }
  var tdu = e.target.closest('[data-techundo]'); if (tdu){ if (techDoneSet(tdu.getAttribute('data-techundo'), false)){ logEvent('أُعيدت «تحتاج زيارة تقنية» — ' + tdu.getAttribute('data-techundo')); render(1); if (typeof mapPaint === 'function' && MAP) mapPaint(); } return true; }
  if (e.target.closest('[data-seltech]')){ var nT = selTechDone(); toast(nm(nT) + ' ' + t('نقطة صارت «زيارة تمّت — تنتظر الاعتماد»')); render(1); if (typeof mapPaint === 'function' && MAP) mapPaint(); return true; }
  if (e.target.closest('[data-selexec]')){ var sx = (document.getElementById('selExec') || {}).value || ''; var nX = selExecSet(sx); toast(nm(nX) + ' ' + t('نقطة صُنّفت في التقرير التنفيذي')); render(1); if (typeof mapPaint === 'function' && MAP) mapPaint(); return true; }
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
  if (e.target.closest('[data-iotadd]')){ if (IOT.edit){ IOT.edit.add = !IOT.edit.add; IOT.edit.addGw = false; IOT.edit.sel = null; iotPaint(); render(1); } return true; }
  if (e.target.closest('[data-iotaddgw]')){ if (IOT.edit){ IOT.edit.addGw = !IOT.edit.addGw; IOT.edit.add = false; IOT.edit.sel = null; iotPaint(); render(1); } return true; }   /* (V37.70) */
  if (e.target.closest('[data-iotmeta]')){ iotMetaSet(); return true; }
  var idv = e.target.closest('[data-iotdev]'); if (idv){ var pv = (idv.getAttribute('data-iotdev') || '').split('|'); if (MAP) MAP.closePopup(); iotEditStart(pv[0], { k:pv[1] === 's' ? 's' : 'g', i:+pv[2] || 0 }); return true; }
  var igen = e.target.closest('[data-iotgen]'); if (igen){ iotGen(igen.getAttribute('data-iotgen')); return true; }
  var ird = e.target.closest('[data-iotredist]'); if (ird){ iotRedistribute(ird.getAttribute('data-iotredist')); return true; }
  if (e.target.closest('[data-iotx]')){ iotXlsx(); return true; }
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
  if (e.target.closest('[data-time]')){ var TS = timeState(); TS.on = !TS.on; if (!TS.on && TS.timer){ clearInterval(TS.timer); TS.timer = null; } render(); if (typeof mapPaint === 'function') mapPaint(); if (MAP_3D && typeof m3Paint === 'function') m3Paint(); return true; }   /* (V39.17) */
  var tst = e.target.closest('[data-timestep]'); if (tst){ timeStep(+tst.getAttribute('data-timestep')); return true; }
  if (e.target.closest('[data-timeplay]')){ timePlayToggle(); return true; }
  if (e.target.closest('[data-heat]')){ heatPaint.on = !heatPaint.on; heatPaint(); heatPaint3d(); render(); return true; }   /* (V39.16) */
  if (e.target.closest('[data-cov]')){ covPaint.on = !covPaint.on; covPaint(); covPaint3d(); render(); return true; }   /* (V39.14) */
  if (e.target.closest('[data-phpin]') && typeof phPinPaint === 'function'){ phPinPaint.on = phPinPaint.on === false; if (phPinPaint.on) phPinPaint(); else phPinClear(); render(); return true; }   /* (V39.19) */
  if (e.target.closest('[data-tent]') && typeof tentPaint === 'function'){ tentPaint.on = tentPaint.on === false; if (typeof m3Paint === 'function') m3Paint(); render(); return true; }   /* (V39.18) */
  if (e.target.closest('[data-twin]') && typeof dtwPaint === 'function'){ dtwPaint.on = dtwPaint.on === false; dtwPaint(); render(); return true; }   /* (V39.13) */
  var mqb = e.target.closest('[data-mapq]');   /* (V39.4) the map search box opens and closes */
  if (mqb){ var mqs = mapUIHtml.s || (mapUIHtml.s = { open:false, q:'' }); mqs.open = mqb.getAttribute('data-mapq') === '1'; render();
    if (mqs.open) setTimeout(function(){ var mi = document.getElementById('mapQ'); if (mi) mi.focus(); }, 0); return true; }
  var fl = e.target.closest('[data-fly]');
  if (fl){ if (mapUIHtml.s) mapUIHtml.s.open = false; POP_SITE = fl.getAttribute('data-fly'); POP_OPEN = true; if (typeof SV_POP !== 'undefined'){ SV_POP = ''; SV_PHO = ''; } CUR = 'map'; render();   /* (V38.75) the list window closes — it would cover the map */
           if (typeof MAP === 'undefined' || !MAP) toast('\u23F3 ' + t('تُفتَح الخريطةُ على النقطة…'));   /* (V38.21) يرى أن الضغطة وصلت */
           mapFlySoon(POP_SITE); return true; }   /* (V38.20) ينتظر الخريطة */
  var fm = e.target.closest('[data-form]');
  if (fm && !/^(INPUT|SELECT|TEXTAREA|OPTION|LABEL)$/.test(fm.tagName)){
    formGo(fm.getAttribute('data-form')); CUR = 'svForm'; render(1); return true; }
  if (e.target.closest('[data-edit]')){
    if (maySiteEditBasic()){ SITE_ED = 1; render(1);   /* (V28.6) المشرفُ أيضًا */ var fk = e.target.closest('[data-edit]').getAttribute('data-edit') || 'name', fid = { name:'seName', sq:'seSq', sign:'seSign', zone:'seZone', type:'seType', work:'seWork', region:'seRegion', lat:'seLat', floor:'seFloor', co:'seCo', inout:'seInout', net:'seNet', ipRtr:'seIpRtr', ipRdr:'seIpRdr', ipCam:'seIpCam' }[fk] || (/^s47/.test(fk) ? 'seS47' + fk.slice(3) : 'seName');   /* (V37.89) */ var ne = document.getElementById(fid) || document.getElementById('seName'); if (ne && ne.closest && ne.closest('details')) ne.closest('details').open = true; if (ne){ ne.focus(); if (ne.scrollIntoView) ne.scrollIntoView({ block:'center' }); } }   /* (V27.4) يفتح النموذجَ على الحقل المطلوب */
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

