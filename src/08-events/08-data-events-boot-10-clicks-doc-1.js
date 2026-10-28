/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-10-clicks-doc-1.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Document-level click handlers part 1 (onDocClick and parts 1–3): settings, constants, survey edit, pending file, E-GATE verification.
   DEFINES : onDocClick, onDocClickPart1, onDocClickPart2, onDocClickPart3
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
function onDocClick(e){
  /* (V37.14) جهةُ الدعم المطلوب أوّلًا — معالجٌ سابقٌ عند المهندس كان يبتلع الضغطَ قبل وصوله */
  var supq = e.target.closest('[data-supq]');   /* (V37.14) جهةُ الدعم المطلوب — قبل القائمة */
  if (supq){ if (e.preventDefault) e.preventDefault(); supRemove(); PV.SUP_POP = supq.getAttribute('data-supq'); var hostS = supq.closest('#content') || document.getElementById('content') || document.body; var tmpS = document.createElement('div'); tmpS.innerHTML = supPanel(supq.getAttribute('data-supq')); while (tmpS.firstChild) hostS.appendChild(tmpS.firstChild); return; }
  if (e.target.closest('[data-supclose]')){ PV.SUP_POP = ''; supRemove(); return; }
  /* (V33.0) كان ٩٨٤ سطرًا؛ صار أجزاءً بالترتيب نفسِه — الجزءُ الذي يعالج النقرةَ يُنهيها */
  if (onDocClickPart1(e) !== CLICK_NEXT) return;
  if (onDocClickPart2(e) !== CLICK_NEXT) return;
  if (onDocClickPart3(e) !== CLICK_NEXT) return;
  if (onDocClickPart4(e) !== CLICK_NEXT) return;
  if (onDocClickPart4b(e) !== CLICK_NEXT) return;   /* (V38.97) part 4 cut in two */
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
  if (e.target.closest('[data-vcok]')){ if (catsSave()) render(1); return; }
  var kad = e.target.closest('[data-knownadd]');   /* (V37.74) سؤالٌ → كرتٌ جاهزُ الكلمات، والمؤشّرُ في الحل */ if (kad){ knEdAdd(kad.getAttribute('data-knownadd')); render(1); setTimeout(function(){ var a0 = document.getElementById('kn-a-0'); if (a0){ a0.focus(); a0.scrollIntoView({ block:'center' }); } }, 60); toast(t('اكتب الحل في الكرت الجديد ثم احفظ')); return; }
  if (e.target.closest('[data-aqref]')){ assistQFetch(true); toast(t('جارٍ التحديث…')); return; }
  if (e.target.closest('[data-knownsave]')){ if (knEdSave()) render(1); return; }   /* (V37.27 → V37.74 كروت) */
  if (e.target.closest('[data-askeng], [data-askengto]')){ askEngClick(e); return; }   /* (V39.4 → V39.7) the conversation with the engineer */   /* (V37.4 → V37.13: أسماءٌ فريدة) */
  var cad = e.target.closest('[data-vcadd]');
  if (cad){ var kd = cad.getAttribute('data-vcadd'), tb = document.getElementById('catBody-' + kd); if (!PV.CAT_NEW[kd] || !tb) return;   /* صفٌّ يُضاف في مكانه — بلا إعادة رسمٍ تمسح ما كُتب */
    var nk = 'u' + Date.now().toString(36); PV.CAT_NEW[kd].push(nk); tb.insertAdjacentHTML('beforeend', catRow(kd, { k:nk, n:'', who:'', photo:false })); var ni = tb.querySelector('[data-vcn="' + kd + '|' + nk + '"]'); if (ni) ni.focus(); return; }
  if (e.target.closest('[data-vcedit]')){ PV.SUP_POP = ''; supRemove(); svPopRemove(); goPage('consts'); render(1); setTimeout(function(){ var cc = document.getElementById('catsCard'); if (cc && cc.scrollIntoView) cc.scrollIntoView({ block:'start' }); }, 60); return; }
  if (e.target.closest('[data-listsok]')){   /* (V30.3) */
    if (!may('settings')){ toast(t('القوائمُ للمهندس فما فوق')); return; }
    var LS = {}; document.querySelectorAll('[data-lists]').forEach(function(ta){ LS[ta.getAttribute('data-lists')] = String(ta.value || '').split('\n').map(function(x){ return x.trim(); }).filter(Boolean); });
    CFG.lists = LS; cfgPushSoon('lists'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1;
    logEvent('تعديل القوائم من الإعدادات — ' + Object.keys(LS).map(function(k){ return k + ':' + LS[k].length; }).join(' · '));
    toast(t('حُفظت القوائم — تصل كلَّ الأجهزة مع المزامنة')); render(1); return;
  }
  /* (V38.30) ملفُّ انتظار: تصديرٌ من الجهاز، واستيرادٌ عند المكتب، ومحوُ المتجاهَل */
  if (e.target.closest('[data-qexport]')){
    var qx = CORE.queueExport(), qn = 'nsk-pending-' + (STATE.meta.name || 'device').replace(/[^\w\u0600-\u06FF-]+/g, '_') + '-' + dayKey(Date.now()) + '.json';
    var qb = new Blob([JSON.stringify(qx)], { type:'application/json' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files:[new File([qb], qn, { type:'application/json' })] })){
      navigator.share({ files:[new File([qb], qn, { type:'application/json' })], title:qn }).catch(function(e2){ LS_ERR = e2; });
    } else { var qa = document.createElement('a'); qa.href = URL.createObjectURL(qb); qa.download = qn; document.body.appendChild(qa); qa.click(); qa.remove(); }
    logEvent('صُدِّر ملفُّ انتظار — ' + qx.items.length + ' ينتظر · ' + qx.stale.length + ' متجاهَل'); toast(t('ملفُّ الانتظار جاهز — ابعثه للمكتب')); return;
  }
  if (e.target.closest('[data-qstaleclear]')){ if (!confirm(t('يُمحى ما تُجوهل من هذا الجهاز نهائيًّا. متابعة؟'))) return; var sn = (STATE.stale || []).length; STATE.stale = []; try { lsSet('nsk14.stale', '[]'); } catch (e3){ LS_ERR = e3; } logEvent('مُحي ' + sn + ' مما تُجوهل من الطابور'); render(1); return; }
  /* (V38.31) بواباتُ محطات القطار: فتحُ تحقيقٍ وحفظُه وإضافةُ بوابةٍ لم تكن في الجرد */
  var ego = e.target.closest('[data-egopen]'); if (ego){ egCard.open = ego.getAttribute('data-egopen') || ''; render(1); return; }
  var egs = e.target.closest('[data-egsave]'); if (egs){ if (egSave(egs.getAttribute('data-egsave'))) render(1); return; }   /* (V38.34) the gate is a point of its own */
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
      if (dest === 'minappr'){ PV.MIN_Q = gsite; }
      toast(t('فُتحت على') + ' ' + gsite);
    }
    render();
    return;
  }
  var sva = e.target.closest('[data-svast]');
  if (sva){ SVA_ST = sva.getAttribute('data-svast'); PV.SVA_REV = ''; SVA_SOL = ''; render(1); return; }
  /* (V38.93) tick visits and approve them at once */
  var ssel = e.target.closest('[data-svasel]');
  if (ssel){ var idT = ssel.getAttribute('data-svasel'); var selM = svaSel(); if (selM[idT]) delete selM[idT]; else selM[idT] = 1; ssel.checked = !!selM[idT]; svaSelPaint(); return; }
  var sall = e.target.closest('[data-svaselall]');
  if (sall){ var rowsT = svaFilter(svaLists().pending); if (sall.getAttribute('data-svaselall') === 'shown') rowsT = rowsT.slice(0, 60);
    var selA = svaSel(); rowsT.forEach(function(x){ selA[x.id] = 1; }); toast(t('حُدِّدت') + ' ' + nm(rowsT.length) + ' ' + t('زيارة')); render(1); return; }
  if (e.target.closest('[data-svaselnone]')){ svaSel.m = {}; toast(t('أُلغي التحديد')); render(1); return; }
  if (e.target.closest('[data-svaselgo]')){ svaSelGo(); return; }
  if (e.target.closest('[data-svaundo]')){ svUndoLast(); render(1); return; }
  var svap = e.target.closest('[data-svappr]');
  if (svap){ var idA = svap.getAttribute('data-svappr');
    if (svApprove(idA)){ toast(idA + ' \u00b7 ' + t('اعتُمدت الزيارة — اقترح حلَّها الآن'));
      SVA_ST = 'approved'; SVA_SOL = idA; SOL_LINES = {}; SOL_Q = ''; }
    render(1); return; }
  var svrv = e.target.closest('[data-svrevisit]');
  if (svrv){ PV.SVA_REV = svrv.getAttribute('data-svrevisit'); render(1);
    var ne = document.getElementById('svaNote'); if (ne) ne.focus(); return; }
  if (e.target.closest('[data-svrevisitcancel]')){ PV.SVA_REV = ''; render(1); return; }
  var svrg = e.target.closest('[data-svrevisitgo]');
  if (svrg){ var idR = svrg.getAttribute('data-svrevisitgo');
    if (svRevisit(idR, (document.getElementById('svaNote') || {}).value)){
      toast(idR + ' \u00b7 ' + t('رُدَّت — عادت إلى مهام المشرف')); PV.SVA_REV = ''; }
    render(1); return; }
  if (e.target.closest('[data-xlspage]')){ toast(t('يُجهَّز إكسلُ الصفحة كاملةً…')); xlsPage(); return; }
  return CLICK_NEXT;
}
/* onDocClick — الجزء 2 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: boardrole، ngo، site، golayer، nsite، nid، provsync، provcancel، provcancelgo، usrreq، svph، svsol، svsolcancel، svsolgo، ipfill، svmore، pwcopy، pwclose، pnddel، pndgo، bulkchk، bulkgo، ghrun، evsite، provlocal، ghsave، ghclear، waasn، waasnx، watask، routego، attin، attout، pwgo، pwx، pwopen، provwipe، seedgo، dissave، mntsave، … */
function onDocClickPart2(e){
    var brl = e.target.closest('[data-boardrole]');
  if (brl){ PV.BOARD_ROLE = brl.getAttribute('data-boardrole') || ''; render(1); return; }
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
    if (tabN === 'svappr'){ SVA_ST = 'pending'; SVA_Q = siteN; SVA_SOL = ''; PV.SVA_REV = ''; PV.SVA_PH = siteN; }
    /* الشريحةُ تُطلَب باسمها: goPage بالأمّ يعيد الشريحةَ إلى أولاها */
    goPage(tabN); render(1); return;
  }
  if (e.target.closest('[data-provsync]')){ provSync(); return; }
  if (e.target.closest('[data-provcancel]')){ PV.PROV_CANCEL = 1; render(1); return; }
  if (e.target.closest('[data-provcancelgo]')){ provCancelAll(); return; }
  var usq = e.target.closest('[data-usrreq]');
  if (usq){ if (provReask(usq.getAttribute('data-usrreq'))) render(1); return; }
  var svph = e.target.closest('[data-svph]');
  if (svph){ var sid = svph.getAttribute('data-svph'); PV.SVA_PH = (PV.SVA_PH === sid) ? '' : sid; render(1); return; }
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
  if (e.target.closest('[data-pwcopy]')){ if (PV.PW_FLOW){ try { navigator.clipboard.writeText(PV.PW_FLOW.pass); toast(t('نُسخت')); } catch (er){ toast(PV.PW_FLOW.pass); } } return; }
  if (e.target.closest('[data-pwclose]')){ PV.PW_FLOW = null; clearInterval(PV.PW_POLL); PV.PW_POLL = 0; render(1); return; }
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
    /* (V39.52) «ادفع الآن» is the user's say-so: what waits for its back-off is tried now (it was skipped, so the button
       answered «رُفع ٠ · بقي ١٨» with nothing tried) */
    STATE.queue.forEach(function(it){ if (it.next) it.next = 0; });
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
  if (pmr){ PV.PM_ROLE = pmr.getAttribute('data-pmrole'); render(1); return; }
  var pmk = e.target.closest('[data-pmk]');
  if (pmk){ var kk = pmk.getAttribute('data-pmk').split('|'); pmToggle(kk[0], kk[1], PV.PM_ROLE); return; }
  if (e.target.closest('[data-pmsave]')){ pmSave(); return; }
  if (e.target.closest('[data-pmreset]')){ pmResetRole(PV.PM_ROLE); return; }
  if (e.target.closest('[data-pmrefresh]')){ pmRefresh(true).then(function(){ PV.PM_DRAFT = null; toast(t('قُرئت من القاعدة')); render(1); }); return; }
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
  return CLICK_NEXT;
}
/* onDocClick — الجزء 4 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: pzdrop، bkref، copick، coren، asnq، hsedel، rkdel، regk، regs، regedit، regsave، regto، regwhen، regdel، wredit، wresave، wreitem، rkadd، hogo، hodoc، pkadd، pkrm، patapply، patsave، patdel، svreopen، svreopencancel، svreopengo، evcat، usredit، usrdel، usract، usrren، usru، usrsave، usrn، usrr، usrj، usrs، usrd، … */
