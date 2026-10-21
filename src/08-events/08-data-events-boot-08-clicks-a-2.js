/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-08-clicks-a-2.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Delegated click handlers, group A part 2.
   DEFINES : clickAPart3, clickAPart4, clickAPart5
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
function clickAPart3(e){
    if (e.target.closest('[data-reqtask]')){
    var rq = mfuList('req').filter(function(x){ return x.id === e.target.closest('[data-reqtask]').getAttribute('data-reqtask'); })[0];
    if (!rq) return true;
    if (wtAdd({ n:'طلب الوزارة: ' + String(rq.t || '').slice(0, 80), track:'طلبات الوزارة', due:dayKey(Date.now() + 7 * 864e5), req:'R:' + rq.id, upd:rq.s || '' })){
      var tid2 = STATE.wtask.lastId, rn = Object.assign({}, rq); delete rn.id; rn.task = tid2; rn.st = rn.st === 'جديد' ? 'قيد التنفيذ' : rn.st; rn.at = Date.now(); rn.hist = mfuHist(rq, 'task', '#' + tid2);
      mfuPut('req', rq.id, rn); toast(t('أُنشئت مهمةُ التنفيذ في المهام الأسبوعية')); render(1);
    }
    return true;
  }
  if (e.target && e.target.id === 'svqSheet'){ SVQ = { id:'', key:'', tmp:null }; render(1); return true; }   /* لمسُ الخلفية يغلق (V22.7) */
  if (e.target.closest('[data-svq]')){ SVQ = { id:e.target.closest('[data-svq]').getAttribute('data-svq'), key:'', tmp:null }; POP_OPEN = false;
    try { if (window.history && history.pushState) history.pushState({ svq:1 }, ''); } catch (e3){ LS_ERR = e3; }   /* زرُّ الرجوع في الجهاز يغلق اللوح لا التطبيق */
    render(1); return true; }   /* (V22.3) */
  /* (V38.61) the installation's edit sheet */
  var iqo = e.target.closest('[data-insq]');
  if (iqo){ var IQ = insqState(); IQ.id = iqo.getAttribute('data-insq'); IQ.st = ''; IQ.delAsk = ''; POP_OPEN = false; render(1); return true; }
  if (e.target.closest('[data-insqx]')){ insqState().id = ''; insqState().st = ''; render(1); return true; }
  var iqs = e.target.closest('[data-insqst]'); if (iqs){ insqState().st = iqs.getAttribute('data-insqst'); render(1); return true; }
  if (e.target.closest('[data-insqsave]')){ if (insqSave()) render(1); return true; }
  var svm = e.target.closest('[data-svqmove]'); if (svm){ if (svqMove(svm.getAttribute('data-svqmove'))) render(1); return true; }   /* (V38.70) */
  if (e.target.closest('[data-mvsettle]')){ insLedgerSettle(); render(1); return true; }   /* (V38.69) */
  var iqv = e.target.closest('[data-insqvoid]'); if (iqv){ if (insqVoid(iqv.getAttribute('data-insqvoid'))) render(1); return true; }   /* (V38.68) */
  var iqa = e.target.closest('[data-insqdelask]'); if (iqa){ insqState().delAsk = iqa.getAttribute('data-insqdelask'); render(1); return true; }
  if (e.target.closest('[data-insqdelx]')){ insqState().delAsk = ''; render(1); return true; }
  var iqd = e.target.closest('[data-insqdel]'); if (iqd){ if (insqPhotoDel(iqd.getAttribute('data-insqdel'))) render(1); return true; }
  var iqq = e.target.closest('[data-insqqx]');
  if (iqq){ var qi2 = +iqq.getAttribute('data-insqqx'), qx2 = PHOTO_Q[qi2]; if (qx2 && qx2.site === insqState().id){ PHOTO_Q.splice(qi2, 1); CORE.saveSoon(); toast(t('أُلغيت')); } render(1); return true; }
  if (e.target.closest('[data-svqx]')){ SVQ = { id:'', key:'', tmp:null }; render(1); return true; }
  if (e.target.closest('[data-svqk]')){ SVQ.key = e.target.closest('[data-svqk]').getAttribute('data-svqk'); SVQ.tmp = null; render(1); setTimeout(function(){ var el = document.getElementById('svqIn'); if (el){ try { el.focus(); } catch (e2){ LS_ERR = e2; } } }, 30); return true; }
  if (e.target.closest('[data-svqdelask]')){ SVQ.delAsk = e.target.closest('[data-svqdelask]').getAttribute('data-svqdelask'); render(1); return true; }   /* (V22.8) */
  if (e.target.closest('[data-svqdelx]')){ SVQ.delAsk = ''; render(1); return true; }
  if (e.target.closest('[data-svqdel]')){ if (svqPhotoDel(e.target.closest('[data-svqdel]').getAttribute('data-svqdel'))) render(1); return true; }
  if (e.target.closest('[data-svqqx]')){ var qi = +e.target.closest('[data-svqqx]').getAttribute('data-svqqx'), qx = PHOTO_Q[qi];
    if (qx && qx.site === SVQ.id){ PHOTO_Q.splice(qi, 1); CORE.saveSoon(); var rq2 = STATE.recs[SVQ.id]; if (rq2){ var n2 = Object.assign({}, rq2); n2.phN = svqPhotoCount(SVQ.id); CORE.set('recs', SVQ.id, n2); } logEvent('إلغاءُ صورةٍ من طابور الجهاز — ' + SVQ.id, SVQ.id); toast(t('أُلغيت الصورة')); render(1); }
    return true; }
  if (e.target.closest('[data-svqcancel]')){ SVQ.key = ''; SVQ.tmp = null; SVQ.tmpL = null; SVQ.note = null; SVQ.err = ''; render(1); return true; }
  /* (V38.25) «موقع النقطة» شرائح: في النموذج وفي لوح التعديل — «لا شيء مما سبق» يُفرغ الباقي، وغيرُه يرفعه */
  var lcf = e.target.closest('[data-svloc]');
  if (lcf){ var lv = lcf.getAttribute('data-svloc'), L0 = locList(FORM.loc);
    if (L0.indexOf(lv) > -1) L0 = L0.filter(function(z){ return z !== lv; }); else { L0 = lv === 'لا شيء مما سبق' ? [lv] : L0.filter(function(z){ return z !== 'لا شيء مما سبق' && z !== 'نفق — غير محدد'; }).concat([lv]); }
    FORM.loc = L0; try { svDraftSoon(); } catch (e2){ LS_ERR = e2; } render(1); return true; }
  var lcq = e.target.closest('[data-svqloc]');
  if (lcq){ var qv = lcq.getAttribute('data-svqloc'), rqL = STATE.recs[SVQ.id] || {}, L1 = SVQ.tmpL || locList(rqL.loc);
    if (L1.indexOf(qv) > -1) L1 = L1.filter(function(z){ return z !== qv; }); else { L1 = qv === 'لا شيء مما سبق' ? [qv] : L1.filter(function(z){ return z !== 'لا شيء مما سبق' && z !== 'نفق — غير محدد'; }).concat([qv]); }
    SVQ.tmpL = L1; render(1); return true; }
  if (e.target.closest('[data-svqch]')){ var ch = e.target.closest('[data-svqch]').getAttribute('data-svqch'); rq = STATE.recs[SVQ.id] || {}; var nt1 = document.getElementById('svqNote'); if (nt1) SVQ.note = nt1.value; var cur0 = SVQ.tmp || chalsToCats(rq.chals, rq.chal_note || rq.note);   /* (V38.20) الفئاتُ نفسُها كنموذج المسح، والوصفُ المكتوبُ لا يضيع بإعادة الرسم */
    if (cur0.indexOf(ch) > -1) cur0 = cur0.filter(function(x){ return x !== ch; }); else { if (ch === 'لا توجد تحديات') cur0 = []; else cur0 = cur0.filter(function(x){ return x !== 'لا توجد تحديات'; }); cur0.push(ch); }
    SVQ.tmp = cur0; render(1); return true; }
  if (e.target.closest('[data-svqsave]')){ var sk = SVQ.key, rq0 = STATE.recs[SVQ.id] || {}, sv0 = sk === 'chals' ? (SVQ.tmp || chalsToCats(rq0.chals, rq0.chal_note || rq0.note)) : sk === 'loc' ? (SVQ.tmpL || locList(rq0.loc)) : ((document.getElementById('svqIn') || {}).value);
    /* (V38.20) الوصفُ يُحفَظ مع التحديات في الضغطة نفسِها — كان لا يظهر له حقلٌ في التعديل أصلًا */
    var nt0 = document.getElementById('svqNote'), ntv = nt0 ? String(nt0.value || '').trim() : null, ntChanged = sk === 'chals' && ntv !== null && ntv !== String(rq0.chal_note || '').trim();
    if (sk === 'chals' && (sv0 || []).indexOf(chalOther()) > -1 && !(ntv != null ? ntv : String(rq0.chal_note || '').trim())){
      /* (V38.21) رسالةٌ ظاهرةٌ تحت الخانة نفسِها لا تنبيهٌ عابرٌ يفوت على الجوال — والمكتوبُ يبقى */
      SVQ.err = 'اكتب وصف التحدي قبل الحفظ — «أخرى» تحتاج وصفًا'; SVQ.note = ntv; SVQ.tmp = sv0; render(1);
      setTimeout(function(){ var el = document.getElementById('svqNote'); if (el) el.focus(); }, 60); return true; }   /* (V38.20) */
    SVQ.err = '';
    var okc = svqSave(SVQ.id, sk, sv0, ntChanged);
    if (ntChanged){ okc = svqSave(SVQ.id, 'chal_note', ntv, true) || okc; if (okc) toast('\u2713 ' + t(((STATE.recs[SVQ.id] || {}).review === 'pending' && rq0.review === 'approved') ? 'حُفظت التحديات والوصف — وعاد المسحُ لانتظار الاعتماد' : 'حُفظت التحديات والوصف')); }
    if (okc){ render(1); if (typeof MAP !== 'undefined' && MAP) mapPaint(); } return true; }
  if (e.target.closest('[data-sqall]')){ FILT.zone = FILT.type = FILT.work = FILT.life = FILT.route = FILT.floor = ''; if (typeof CO_SEL !== 'undefined' && CO_SEL.length) CO_SEL.length = 0; LIST_SHOWN = LIST_PAGE; render(1); if (CUR === 'map' && MAP) mapPaint(); return true; }   /* (V22.1) البحثُ في الكل: تُرفَع التصفيةُ وتبقى الكلمة */
  if (e.target.closest('[data-mfupadd]')){ var npi = document.getElementById('mfuNewParty'), npv = npi ? String(npi.value || '').trim().slice(0, 40) : ''; if (!npv){ toast(t('اكتب اسمَ الجهة')); return true; } if (mfuParties().indexOf(npv) > -1){ toast(t('الجهةُ موجودة')); return true; } if (mfuPut('party', npv, { t:npv, at:Date.now() }) !== false){ logEvent('إضافةُ جهةٍ معالجة — ' + npv); toast(t('أُضيفت الجهة')); } render(1); return true; }   /* (V26.6) */
  var mpr = e.target.closest('[data-mfuprm]');
  if (mpr){ var rpn = mpr.getAttribute('data-mfuprm'), PL = mfuParties(); if (PL.length <= 1){ toast(t('لا بدّ من جهةٍ واحدةٍ على الأقل')); return true; }
    var fb = PL.filter(function(k){ return k !== rpn; })[0], ownM = mfuData().own || {};
    Object.keys(ownM).forEach(function(c){ if (ownM[c] === rpn) mfuPut('own', c, (MFU.ownDef[c] && MFU.ownDef[c] !== rpn && PL.indexOf(MFU.ownDef[c]) > -1) ? MFU.ownDef[c] : fb); });
    mfuPut('party', rpn, Object.assign({}, mfuPartyRaw(rpn) || {}, { gone:true, at:Date.now() })); logEvent('حذفُ جهةٍ معالجة — ' + mfuPartyLabel(rpn)); render(1); return true; }   /* (V26.8) الأصليةُ تُحذَف أيضًا — لا آخرُ جهة */
  var mpe = e.target.closest('[data-mfupren]');
  if (mpe){ MFU.prn = mpe.getAttribute('data-mfupren'); render(1); var pi = document.querySelector('[data-mfuprn]'); if (pi){ pi.focus(); pi.select(); } return true; }
  if (e.target.closest('[data-mfuprst]')){ MFU.parties.forEach(function(k){ var r = mfuPartyRaw(k); if (r && (r.gone || r.t)) mfuPut('party', k, { at:Date.now() }); }); logEvent('استرجاعُ جهات المعالجة الأصلية'); toast(t('عادت الجهاتُ الأصلية')); render(1); return true; }
  var cu = e.target.closest('[data-chupd]');   /* (V27.0) تحديثٌ على التحدي */
  if (cu){ CHUP_OPEN = cu.getAttribute('data-chupd'); render(1); var ta = document.querySelector('[data-chupdtxt]'); if (ta) ta.focus(); return true; }
  if (e.target.closest('[data-chupdx]')){ CHUP_OPEN = ''; render(1); return true; }
  var cg = e.target.closest('[data-chupdgo]');
  if (cg){ var ck2 = cg.getAttribute('data-chupdgo'), ta2 = document.querySelector('[data-chupdtxt="' + ck2.replace(/"/g, '\\"') + '"]'), nt2 = ta2 ? ta2.value : '';
    if (!String(nt2 || '').trim()){ toast(t('اكتب ما حدث')); return true; }
    if (chalUpd(ck2, nt2, (CUR === 'mfu') ? 'office' : 'field')){ CHUP_OPEN = ''; toast(t('سُجّل التحديث')); render(1); } return true; }
  var cpo = e.target.closest('[data-chalpop]');   /* (V26.9) نافذةُ نقاط التحدي */
  if (cpo){ CHAL_POP = cpo.getAttribute('data-chalpop') || ''; chalPopSync(); return true; }
  if (e.target.closest('[data-chalpopx]')){ CHAL_POP = ''; chalPopSync(); return true; }
  var mfz = e.target.closest('[data-mfz]'), mft = e.target.closest('[data-mft]');   /* (V26.5) */
  if (mfz){ MFU.flt.z = mfz.getAttribute('data-mfz') || ''; MFU.flt.t = ''; render(1); return true; }
  if (mft){ MFU.flt.t = mft.getAttribute('data-mft') || ''; render(1); return true; }
  if (e.target.closest('[data-mfuedit]')){ MFU.edit = e.target.closest('[data-mfuedit]').getAttribute('data-mfuedit') || ''; render(1); return true; }
  if (e.target.closest('[data-mfucosall]')){ MFU.cosAll = !MFU.cosAll; render(1); return true; }
  /* (V24.0) ملخص العمل اليومي: كلُّ عملٍ يُخفى ويُظهَر بضغطةٍ على اسمه، والصفحات، ورفعُ المرشّحات */
  if (e.target.closest('[data-wdyser]')){ var wdyK = e.target.closest('[data-wdyser]').getAttribute('data-wdyser'); WDY.off[wdyK] = !WDY.off[wdyK]; render(1); return true; }
  if (e.target.closest('[data-wdypg]')){ var wdyPg = e.target.closest('[data-wdypg]').getAttribute('data-wdypg'); WDY.pg = wdyPg === 'p' ? WDY.pg - 1 : wdyPg === 'n' ? WDY.pg + 1 : (+wdyPg || 1); render(1); return true; }
  if (e.target.closest('[data-wdyreset]')){ WDY.mon = ''; WDY.day = ''; WDY.h1 = 0; WDY.h2 = 24; WDY.pg = 1; render(1); return true; }
  if (e.target.closest('[data-mfuchal]')){
    var mt = pmoVal('mcT'); if (!mt){ toast(t('اكتب التحدي')); return true; }
    if (mfuPut('chal', 'C' + Date.now().toString(36), { t:mt, m:pmoVal('mcM'), o:pmoVal('mcO'), r:pmoVal('mcR'), st:'مفتوح', at:Date.now(), by:STATE.meta.name || '', hist:mfuHist(null, 'new', '') })){ logEvent('تحدٍّ جديد — ' + mt.slice(0, 40), ''); toast(t('سُجّل التحدي — تجده أعلى القائمة')); render(1); }
    return true;
  }
  if (e.target.closest('[data-mfureq]')){
    var rt = pmoVal('mrT'); if (!rt){ toast(t('اكتب الطلب')); return true; }
    if (mfuPut('req', 'Q' + Date.now().toString(36), { t:rt, u:pmoVal('mrU'), s:pmoVal('mrS'), st:'جديد', at:Date.now(), by:STATE.meta.name || '', hist:mfuHist(null, 'new', '') })){ logEvent('طلبُ الوزارة — ' + rt.slice(0, 40), ''); toast(t('سُجّل الطلب — تجده أعلى القائمة')); render(1); }
    return true;
  }
  if (e.target.closest('[data-mfudel]')){
    var md = e.target.closest('[data-mfudel]').getAttribute('data-mfudel').split('|');
    if (mfuPut(md[0], md[1], { gone:true, at:Date.now() })){ toast(t('حُذف')); render(1); }
    return true;
  }
  /* (V37.75) ربطُ نظام البطاقات الخارجي */
  if (e.target.closest('[data-exttoksave]')){ var iv=document.getElementById('extTokInp'); extTokSave(iv ? iv.value : ''); return true; }
  if (e.target.closest('[data-exttokclear]')){ extTokClear(); return true; }
  /* (V38.12) زرُّ «تحديث» رُفع مع كروت المخيمات: التحديثُ صار بإعادة الجسر */
  if (e.target.closest('[data-iosnudge]')){
    var inv = e.target.closest('[data-iosnudge]').getAttribute('data-iosnudge');
    if (inv === 'install' && INSTALL_EVT){
      var ev = INSTALL_EVT; INSTALL_EVT = null; lsSet('nsk14.iosNudge', String(Date.now() + 864e5));
      try { ev.prompt(); if (ev.userChoice && ev.userChoice.then) ev.userChoice.then(function(r){ if (r && r.outcome === 'accepted') lsSet('nsk14.iosNudge', String(Date.now() + 30 * 864e5)); }); } catch (e2){ LS_ERR = e2; }
      render(1); return true;
    }
    lsSet('nsk14.iosNudge', String(Date.now() + (inv === 'done' ? 30 : 1) * 864e5)); render(1); return true;
  }
  if (e.target.closest('[data-idbretry]')){ toast(t('يُعاد فتحُ المخزن…')); idbRetryNow().then(function(){ toast(t(IDB_BAD ? 'ما زال لا يعمل — العملُ يُرفَع تلقائيًّا، فلا تغلق التطبيق' : 'عاد الحفظُ المحلي')); }); return true; }
  if (e.target.closest('[data-simapply]')){
    if (!may('settings')) { toast(t('الضبطُ للمدير')); return true; }
    var M = simState(), zs = zonesLive(), n0 = 0;
    Object.keys(M.w).forEach(function(k){ zs.forEach(function(z){ cfgSet('w', z + '|' + k, +M.w[k] || 0); n0++; }); });
    if (+M.target > 0) cfgSet('tgtSurvey', null, +M.target);
    logEvent('اعتُمدت الأوزانُ من المحاكي — ' + Object.keys(M.w).map(function(k){ return k + ' ' + M.w[k]; }).join(' · ') + ' · التارجت ' + nm(+M.target));
    toast(t('اعتُمدت الأوزانُ والتارجت — يُعاد حسابُ المستحقّ')); render(1); return true;
  }
  if (e.target.closest('[data-simot]')){
    if (!may('settings')) { toast(t('الضبطُ للمدير')); return true; }
    cfgSet('otRate', null, 1); logEvent('أُلغي معاملُ الإضافي — يُحتسب كلُّ شيءٍ بالسعر نفسه'); toast(t('أُلغي الإضافي — المعامل ١')); render(1); return true;
  }
  if (e.target.closest('[data-geojson]')){ geoJsonExport(); return true; }
  return CLICK_NEXT;
}
/* clickA — الجزء 4 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: lessonadd، retroadd، stakeadd، pmoedit، pmoedcancel، pmodel، basemapdl، basemaprm، scan، scanx، sun، budalert، pilot، kkview، pmz، site، wtmeet، wbsxl، minopen، minst، minok، minnote، minback، minre، stkopen، stkf، stkopenback، stknote، stkback، stkok، stkreopen */
function clickAPart4(e){
  var sid, pid, px;   /* تُكتب هنا قبل أن تُقرأ */
    if (e.target.closest('[data-lessonadd]')){
    var lt = pmoVal('lsT'); if (!lt){ toast(t('اكتب عنوان الدرس')); return true; }
    var lid = pmoEdId('lessons', 'L' + Date.now().toString(36)), led = PMO_ED.sec === 'lessons'; PMO_ED = { sec:'', id:'' };
    if (pmoPut('lessons', lid, { t:lt, d:pmoVal('lsD'), w:pmoVal('lsW'), c:pmoVal('lsC'), a:pmoVal('lsA'), o:pmoVal('lsO'), at:Date.now(), by:STATE.meta.name || '' })){ toast(t(led ? 'حُفظ التعديل' : 'سُجّل الدرس')); render(1); }
    return true;
  }
  if (e.target.closest('[data-retroadd]')){
    var rp = pmoVal('rtP'); if (!rp){ toast(t('اكتب الفترة')); return true; }
    var rid = pmoEdId('retros', 'R' + Date.now().toString(36)), red = PMO_ED.sec === 'retros'; PMO_ED = { sec:'', id:'' };
    if (pmoPut('retros', rid, { p:rp, g:pmoVal('rtG'), i:pmoVal('rtI'), a:pmoVal('rtA'), at:Date.now(), by:STATE.meta.name || '' })){ toast(t(red ? 'حُفظ التعديل' : 'سُجّلت المراجعة')); render(1); }
    return true;
  }
  if (e.target.closest('[data-stakeadd]')){
    var sn = pmoVal('shN'); if (!sn){ toast(t('اكتب الجهة أو الشخص')); return true; }
    var sid0 = pmoEdId('stake', 'S' + Date.now().toString(36)), sed = PMO_ED.sec === 'stake'; PMO_ED = { sec:'', id:'' };
    if (pmoPut('stake', sid0, { n:sn, r:pmoVal('shR'), inf:+pmoVal('shI') || 2, int:+pmoVal('shT') || 2, cur:pmoVal('shC'), want:pmoVal('shD'), s:pmoVal('shS'), o:pmoVal('shO'), at:Date.now(), by:STATE.meta.name || '' })){ toast(t(sed ? 'حُفظ التعديل' : 'أُضيف')); render(1); }
    return true;
  }
  var pme = e.target.closest('[data-pmoedit]');
  if (pme){ var pe = pme.getAttribute('data-pmoedit').split('|'); PMO_ED = { sec:pe[0], id:pe[1] }; render(1); pmoEdFill(); toast(t('عدّل ثم اضغط «احفظ التعديل»')); return true; }   /* (V28.2) */
  if (e.target.closest('[data-pmoedcancel]')){ PMO_ED = { sec:'', id:'' }; render(1); return true; }
  if (e.target.closest('[data-pmodel]')){
    var pd = e.target.closest('[data-pmodel]').getAttribute('data-pmodel').split('|');
    if (pmoPut(pd[0], pd[1], { gone:true, at:Date.now() })){ toast(t('حُذف')); render(1); }
    return true;
  }
  if (e.target.closest('[data-basemapdl]')){ basemapDownload(); return true; }
  if (e.target.closest('[data-basemaprm]')){ basemapRemove(); return true; }
  if (e.target.closest('[data-scan]')){ scanOpen(e.target.closest('[data-scan]').getAttribute('data-scan')); return true; }
  if (e.target.closest('[data-scanx]')){ scanClose(); return true; }
  /* (V21.8) :not(html) — وضعُ الشمس يضع data-sun على <html> نفسِه، فكانت أيُّ لمسةٍ لم يلتقطها
     معالجٌ قبله (على الخريطة مثلًا) تجد «[data-sun]» في أعلى الشجرة فتطفئه وحدَها */
  if (e.target.closest('[data-sun]:not(html)')){ sunSet(!SUN_ON); themeIcon(); toast(t(SUN_ON ? 'وضعُ الشمس: يعمل' : 'وضعُ الشمس: أُطفئ')); return true; }
  if (e.target.closest('[data-budalert]')){
    if (!may('users')) return true;
    cfgSet('budgetAlert', null, +e.target.closest('[data-budalert]').getAttribute('data-budalert') ? 1 : 0); render(1); return true;   /* cfgSet تدفع إلى settings/points بنفسها */
  }
  if (e.target.closest('[data-pilot]')){
    pid = e.target.closest('[data-pilot]').getAttribute('data-pilot'), px = siteFind(pid);
    if (!px || !may('users')) return true;
    siteOvSet(pid, { pilot: !px.pilot }); px.pilot = !px.pilot; logEvent((px.pilot ? 'صارت نقطةَ تجربة — ' : 'عادت نقطةً عادية — ') + pid);
    var tl = trialLinkSite(pid, px.pilot);   /* (V37.44) الخيارُ أ */
    toast(t({ created:'صارت نقطةَ تجربة — وأُضيفت إلى «التجارب»', matched:'صارت نقطةَ تجربة — ورُبطت بتجربتها الموجودة في «التجارب»', linked:'صارت نقطةَ تجربة — تجربتُها في «التجارب»', removed:'عادت نقطةً عادية — وحُذف سطرُها الفارغ من «التجارب»', kept:'عادت نقطةً عادية — وسطرُها في «التجارب» باقٍ لأن عليه بيانات' }[tl] || (px.pilot ? 'صارت نقطةَ تجربة' : 'عادت نقطةً عادية')));
    render(1); return true;
  }
  var kkv = e.target.closest('[data-kkview]');
  if (kkv){ KK_VIEW = kkv.getAttribute('data-kkview') === 'pts' ? 'pts' : 'sat'; render(1); return true; }
  var pmz = e.target.closest('[data-pmz]');
  if (pmz){ var k = pmz.getAttribute('data-pmz'); if (k === 'in') pmZoomAt(1.6); else if (k === 'out') pmZoomAt(1 / 1.6); else pmReset(); return true; }
  var li = e.target.closest('[data-site]');
  if (li && li.tagName === 'circle' && Date.now() - PM_CLICK_SKIP < 400) return true;   /* سحبٌ لا ضغطة */
  if (li && !SEL_MODE){ DETAIL_ID = li.getAttribute('data-site'); CUR = 'site'; render(); return true; }
  if (li && SEL_MODE){ lid = li.getAttribute('data-site');
                       if (!asnOf(lid)) selToggle(lid); render(1); return true; }

  /* محضرُ الاجتماع: ما بقي وما استُجدّ وما اكتمل — لا لوحةَ زياراتٍ ولا خطةً
     تفصيليةً ولا ملخّصًا تنفيذيًّا. من أرادها فلها أزرارُها (V17.18). */
  if (e.target.closest('[data-wtmeet]')){ toast(t('يُجهَّز محضرُ الاجتماع…')); expPdf(['wtmeet'].filter(expAllowed)); return true; }
  if (e.target.closest('[data-wbsxl]')){ wbsExcel(); return true; }
  /* اعتمادُ الوزارة */
  var mno = e.target.closest('[data-minopen]');
  if (mno){ MIN_OPEN = mno.getAttribute('data-minopen') || ''; render(1); return true; }
  var mns = e.target.closest('[data-minst]');
  if (mns){ MIN_ST = mns.getAttribute('data-minst') || 'pending'; MIN_OPEN = ''; render(1); return true; }
  var mok = e.target.closest('[data-minok]');
  if (mok){ var mid = mok.getAttribute('data-minok'), mEl = document.querySelector('[data-minnote="' + mid + '"]');
    if (minApprove(mid, mEl ? mEl.value : '')){ toast(t('اعتمدت الوزارةُ إعدادَ التركيب')); MIN_OPEN = ''; render(1); } return true; }
  var mbk = e.target.closest('[data-minback]');
  if (mbk){ var mid2 = mbk.getAttribute('data-minback'), mEl2 = document.querySelector('[data-minnote="' + mid2 + '"]');
    if (minReturn(mid2, mEl2 ? mEl2.value : '')){ toast(t('أُعيدت للمهندس بملاحظتكم')); MIN_OPEN = ''; render(1); } return true; }
  var mre = e.target.closest('[data-minre]');
  if (mre){ var mid3 = mre.getAttribute('data-minre'), mEl3 = document.querySelector('[data-minnote="' + mid3 + '"]');
    if (minResubmit(mid3, mEl3 ? mEl3.value : '')){ toast(t('رُفعت للوزارة ثانيةً')); MIN_OPEN = ''; render(1); } return true; }
  /* المتعذّر: فتحُ لوحة المراجعة، والقرار */
  var sko = e.target.closest('[data-stkopen]');
  if (sko){ STK_OPEN = sko.getAttribute('data-stkopen') || ''; render(1); return true; }
  var skf = e.target.closest('[data-stkf]');
  if (skf){ STK_F = skf.getAttribute('data-stkf') || ''; render(1); return true; }
  var skob = e.target.closest('[data-stkopenback]');
  if (skob){
    var oid = skob.getAttribute('data-stkopenback'), oEl = document.querySelector('[data-stknote="' + oid + '"]');
    if (svRevisit(oid, oEl ? oEl.value : '')){ toast(t('رُدّت — سيصل المشرفَ إشعارٌ بسببك')); STK_OPEN = ''; render(1); }
    return true;
  }
  var skb = e.target.closest('[data-stkback]');
  if (skb){
    sid = skb.getAttribute('data-stkback'); var nEl = document.querySelector('[data-stknote="' + sid + '"]');
    if (svRevisit(sid, nEl ? nEl.value : '')){ toast(t('رُدّت — سيصل المشرفَ إشعارٌ بسببك')); STK_OPEN = ''; render(1); }
    return true;
  }
  var skk = e.target.closest('[data-stkok]');
  if (skk){
    var sid2 = skk.getAttribute('data-stkok'), nEl2 = document.querySelector('[data-stknote="' + sid2 + '"]');
    if (stuckAccept(sid2, nEl2 ? nEl2.value : '')){ toast(t('قُبل التعذّرُ وسُجِّلت الحُجّة')); render(1); }
    return true;
  }
  var skr = e.target.closest('[data-stkreopen]');
  return CLICK_NEXT;
}
/* clickA — الجزء 5 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: stkreopen، wttab، wttrack، wtf، wtopen، wtclose، wtstat، wtnoteadd، wtsave2، wte2، wttools، wbsdos، dosclose، dossave، dositem، dosdel، dosfile، dosfdel، tour، tourclose، tourstop، tourprev، tournext، tourgo، phbulk، bugopen، bugclose، bugkind، bugsend، brief، briefall، trnew، trcost، trh، tritem، tridel، trdel، dqnoco، dqsplit، usrlog، … */
function clickAPart5(e){
  var a = e.target.closest('[data-p]');   /* بحثٌ صرف — يُعاد حسابُه */
  var skr = e.target.closest('[data-stkreopen]');   /* بحثٌ صرف — يُعاد حسابُه */
  var pr, sh, ni;   /* تُكتب هنا قبل أن تُقرأ */
    if (skr){ stuckReopen(skr.getAttribute('data-stkreopen')); toast(t('أُعيد فتحُه')); render(1); return true; }
  var wtb = e.target.closest('[data-wttab]');
  if (wtb){ WT_TAB = wtb.getAttribute('data-wttab'); render(1); return true; }
  var wtk = e.target.closest('[data-wttrack]');
  if (wtk){ WT_TRACK = wtk.getAttribute('data-wttrack'); render(1); return true; }
  var wtf = e.target.closest('[data-wtf]');
  if (wtf){ WT_F = wtf.getAttribute('data-wtf') || ''; render(1); return true; }
  var wto = e.target.closest('[data-wtopen]');
  if (wto){ WT_OPEN = wto.getAttribute('data-wtopen'); WT_NEW = false; render(1); return true; }
  if (e.target.closest('[data-wtclose]')){ WT_OPEN = ''; render(1); return true; }
  var wst = e.target.closest('[data-wtstat]');
  if (wst){ pr = wst.getAttribute('data-wtstat').split('|'); wtStatus(pr[0], pr[1]); return true; }
  var wna = e.target.closest('[data-wtnoteadd]');
  if (wna){ ni = document.getElementById('wtNote'); wtNote(wna.getAttribute('data-wtnoteadd'), ni ? ni.value : ''); return true; }
  var ws2 = e.target.closest('[data-wtsave2]');
  if (ws2){
    sh = ws2.closest('.wt-sheet'); var g3 = function(k){ var el = sh && sh.querySelector('[data-wte2="' + k + '"]'); return el ? el.value.trim() : ''; };
    if (!g3('n')){ toast(t('اسمُ المهمة مطلوب')); return true; }
    wtSet(ws2.getAttribute('data-wtsave2'), { n:g3('n'), who:g3('who'), due:g3('due'), track:g3('track'), d:g3('d'), wbs:g3('wbs') });
    toast(t('حُفظت المهمة')); return true;
  }
  if (e.target.closest('[data-wttools]')){ WT_TOOLS = !WT_TOOLS; render(1); return true; }
  var wdo = e.target.closest('[data-wbsdos]');
  if (wdo){ WBS_DOS = wdo.getAttribute('data-wbsdos'); render(1); return true; }
  if (e.target.closest('[data-dosclose]')){ WBS_DOS = ''; render(1); return true; }
  var dsv = e.target.closest('[data-dossave]');
  if (dsv){ dosSave(dsv.getAttribute('data-dossave')); return true; }
  var dit = e.target.closest('[data-dositem]');
  if (dit){ dosItemAdd(dit.getAttribute('data-dositem')); return true; }
  var ddl = e.target.closest('[data-dosdel]');
  if (ddl){ var p4 = ddl.getAttribute('data-dosdel').split('|'); dosItemDel(p4[0], +p4[1] || 0); return true; }
  var dfa = e.target.closest('[data-dosfile]');
  if (dfa){ dosFileAdd(dfa.getAttribute('data-dosfile')); return true; }
  var dfd = e.target.closest('[data-dosfdel]');
  if (dfd){ var p5 = dfd.getAttribute('data-dosfdel').split('|'); dosFileDel(p5[0], +p5[1] || 0); return true; }
  if (e.target.closest('[data-tour]')){ tourStart(); return true; }
  if (e.target.closest('[data-tourclose]')){ tourEnd(false); return true; }
  if (e.target.closest('[data-tourstop]')){ tourEnd(true); toast(t('لن تُعرَض ثانيةً — زرُّ 🎓 يفتحها متى شئت')); return true; }
  if (e.target.closest('[data-tourprev]')){ TOUR.i = Math.max(0, TOUR.i - 1); render(1); return true; }
  if (e.target.closest('[data-tournext]')){
    var TP = tourPages();
    if (TOUR.i >= TP.length - 1){ tourEnd(true); toast(t('تمّت الجولة — زرُّ 🎓 يفتحها متى شئت')); }
    else { TOUR.i++; render(1); }
    return true;
  }
  var tg = e.target.closest('[data-tourgo]');
  if (tg){ goPage(tg.getAttribute('data-tourgo')); render(1); return true; }
  if (e.target.closest('[data-phbulk]')){ phonesBulk(); return true; }
  if (e.target.closest('[data-bugopen]')){ BUG_OPEN = true; render(1); return true; }
  if (e.target.closest('[data-bugclose]')){ BUG_OPEN = false; render(1); return true; }
  var bk = e.target.closest('[data-bugkind]');
  if (bk){ BUG_KIND = bk.getAttribute('data-bugkind'); render(1); return true; }
  if (e.target.closest('[data-bugsend]')){ bugSend(); return true; }
  var brf = e.target.closest('[data-brief]');
  if (brf){ briefingSend(brf.getAttribute('data-brief')); return true; }
  if (e.target.closest('[data-briefall]')){ briefingCopyAll(); return true; }
  if (e.target.closest('[data-trnew]')){ trialAdd(); return true; }
  if (e.target.closest('[data-trcost]')){ trialToggleCost(); return true; }
  var trh = e.target.closest('[data-trh]');
  if (trh){ var pr2 = trh.getAttribute('data-trh').split('|'); trialHoursAdd(pr2[0], +pr2[1] || 0); return true; }
  var tri = e.target.closest('[data-tritem]');
  if (tri){ trialItemAdd(tri.getAttribute('data-tritem')); return true; }
  if (e.target.closest('[data-insrecalc]')){ insRecalcRun(); return true; }   /* (V37.77) */
  if (e.target.closest('[data-regpub]')){ regPublish(); return true; }   /* (V37.83) */
  var nks = e.target.closest('[data-nksave]'); if (nks){ var nid = nks.getAttribute('data-nksave'), nin = document.getElementById('nkIn' + nid); extNkSave(nid, nin ? nin.value : ''); return true; }   /* (V37.86) */
  var nkc = e.target.closest('[data-nkclear]'); if (nkc){ extNkSave(nkc.getAttribute('data-nkclear'), ''); return true; }
  if (e.target.closest('[data-nkbulk]')){ extBulkApply(); return true; }   /* (V37.87) */
  if (e.target.closest('[data-ex47ok]')){ ex47Apply(); return true; }   /* (V37.88) */
  var aqg = e.target.closest('[data-aqgo]'); if (aqg){ aqGoTo(aqg.getAttribute('data-aqgo')); return true; }   /* (V38.14) مساعدُ البيانات */
  if (e.target.closest('[data-aqxls]')){ assistQXls(); return true; }   /* (V38.16) */
  var aqr = e.target.closest('[data-aqrep]'); if (aqr){ aqRepExport(aqr.getAttribute('data-aqrep')); return true; }   /* (V38.17) */
  if (e.target.closest('[data-cted]')){ contCard.ed = 1; render(1); return true; }   /* (V38.8) */
  var stf = e.target.closest('[data-stf]'); if (stf){ EXT.stF = stf.getAttribute('data-stf'); EXT.stN = 30; render(1); return true; }   /* (V38.12) */
  if (e.target.closest('[data-stmore]')){ EXT.stN = (EXT.stN || 30) + 30; render(1); return true; }
  var sec = e.target.closest('[data-sec]'); if (sec){ var sv = sec.getAttribute('data-sec'); EXT.sec = (EXT.sec === sv) ? '' : sv; render(1); return true; }   /* (V38.13) */
  if (e.target.closest('[data-sugopen]')){ EXT.sugOpen = !EXT.sugOpen; render(1); return true; }
  if (e.target.closest('[data-stxls]')){ extStatusXls(); return true; }
  if (e.target.closest('[data-ctsave]')){ contSave(); return true; }
  var ovo = e.target.closest('[data-ovopen]'); if (ovo){ EXT.ovOpen = ovo.getAttribute('data-ovopen'); render(1); return true; }   /* (V38.7) */
  if (e.target.closest('[data-ovclose]')){ EXT.ovOpen = ''; render(1); return true; }
  var nks2 = e.target.closest('[data-nkser]'); if (nks2){ var sp2 = nks2.getAttribute('data-nkser').split('|'); extSerAdopt(sp2[0], sp2[1]); return true; }
  if (e.target.closest('[data-brbmk]')){ if (e.preventDefault) e.preventDefault(); toast(t('هذا الزرُّ يُسحَب إلى شريط الإشارات المرجعية ولا يُضغَط هنا — ثم يُضغَط من الشريط وأنت على موقع نظام البطاقات')); return true; }   /* (V38.6) */
  if (e.target.closest('[data-brcopy]')){ extBridgeCopy(); return true; }   /* (V37.93) */
  if (e.target.closest('[data-brok]')){ extBridgePaste(); return true; }
  var orl = e.target.closest('[data-orlink]'); if (orl){ var op = orl.getAttribute('data-orlink').split('|'), oin = document.getElementById('orIn' + op[0]); ex47OrphLink(op.slice(1).join('|'), oin ? oin.value : ''); return true; }   /* (V37.92) */
  var orp = e.target.closest('[data-orplace]'); if (orp){ ex47OrphPlace(orp.getAttribute('data-orplace')); return true; }
  if (e.target.closest('[data-orcancel]')){ NEWSITE.ex47 = null; NEWSITE.orph = ''; render(1); return true; }
  var nkg = e.target.closest('[data-nksug]'); if (nkg){ var sp = nkg.getAttribute('data-nksug').split('|'); extNkSave(sp[0], sp.slice(1).join('|')); return true; }
  var dsd = e.target.closest('[data-demostd]'); if (dsd){ demoStdSave(dsd.getAttribute('data-demostd')); return true; }   /* (V37.78) */
  var trk = e.target.closest('[data-trkit]'); if (trk){ trialKitLoad(trk.getAttribute('data-trkit')); return true; }   /* (V37.76) */
  var trx = e.target.closest('[data-tridel]');
  if (trx){ var pr3 = trx.getAttribute('data-tridel').split('|'); trialItemDel(pr3[0], +pr3[1] || 0); return true; }
  var trd = e.target.closest('[data-trdel]');
  if (trd){ trialRemove(trd.getAttribute('data-trdel')); return true; }
  if (e.target.closest('[data-dqnoco]')){ dqMarkNoCo(); return true; }
  if (e.target.closest('[data-dqsplit]')){ dqSplitCo(); return true; }
  var ulg = e.target.closest('[data-usrlog]');
  if (ulg){ USR.log = ulg.getAttribute('data-usrlog'); if (evAll().length < 50) evFetch(false); render(1); return true; }
  if (e.target.closest('[data-ulclose]')){ USR.log = ''; render(1); return true; }
  var uls = e.target.closest('[data-ulsite]');
  if (uls){ USR.log = ''; DETAIL_ID = uls.getAttribute('data-ulsite'); goPage('site'); render(1); return true; }
  if (e.target.closest('[data-nspin]')){ goPage('map'); pinStart(); return true; }
  var vas = e.target.closest('[data-visitasn]');
  if (vas){ visitAsnOpen(vas.getAttribute('data-visitasn')); return true; }
  if (e.target.closest('[data-pincancel]')){ pinCancel(); return true; }
  if (e.target.closest('[data-pin]')){ pinStart(); return true; }
  if (e.target.closest('[data-tfd]')){ if (TFD.on) tfdCancel(); else tfdStart(); return true; }   /* (V28.0) */
  if (e.target.closest('[data-tfdsave]')){ tfdSave(); return true; }
  if (e.target.closest('[data-tfdundo]')){ tfdUndo(); return true; }
  if (e.target.closest('[data-tfdfree]')){ TFD.free = !TFD.free; toast(t(TFD.free ? 'رسمٌ حرّ: النقطةُ حيث تضغط وتُوصَل بخطٍّ مستقيم' : 'عاد الالتصاقُ بالشوارع')); render(1); return true; }   /* (V28.1) */
  if (e.target.closest('[data-tfdcancel]')){ tfdCancel(); return true; }
  var tfdg = e.target.closest('[data-tfdgo]'); if (tfdg){ a = tfdg.getAttribute('data-tfdgo').split('|'); goPage('map'); tfdStart(+a[0], a[1]); return true; }
  var tfdc = e.target.closest('[data-tfdclear]'); if (tfdc){ var c2 = tfdc.getAttribute('data-tfdclear').split('|'); tfdClear(+c2[0], c2[1]); return true; }
  if (e.target.closest('[data-route]')){ if (ROUTE.on && ROUTE.mode === 'line') routeCancel(); else routeStart('line'); return true; }
  if (e.target.closest('[data-area]')){ if (ROUTE.on && ROUTE.mode === 'area') routeCancel(); else routeStart('area'); return true; }
  if (e.target.closest('[data-rtsave]')){ routeSave(); return true; }
  if (e.target.closest('[data-rtundo]')){ routeUndo(); return true; }
  if (e.target.closest('[data-rtregen]')){ routeRegen(); return true; }
  if (e.target.closest('[data-rtmin]')){ RT_MIN = !RT_MIN; render(1); return true; }
  if (e.target.closest('[data-rtcancel]')){ RT_MIN = false; routeCancel(); return true; }
  var slg = e.target.closest('[data-sitelog]');
  if (slg){ toast(t('يُجلَب سجلُّ النقطة…')); siteLogFetch(slg.getAttribute('data-sitelog')); return true; }
  var bgf = e.target.closest('[data-bugf]');
  return CLICK_NEXT;
}
/* clickA — الجزء 6 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: bugf، bugdone، bugok، bugdec، bugno، wtxl، wtmeetstart، wtmeetprev، wtmeetnext، wtmeetgo، wtmeetend، wtmeetexit، wtgo، wtwbs، wtdone، wtdel، wtnew، wtncancel، wtnsave، wtreset، wbstog، wbsedit، wbscancel، wbssave، wbse، wbsdel، wbsreset، wbsf، fl، fr، fz، tfw، tfwcamp، tfwcampx، tfwd، poil، bedstart، bedsave، bedcancel، beddel، … */
