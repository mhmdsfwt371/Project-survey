/* ============================================================================
   FILE    : src/03zz-late/08-events--08-data-events-boot-06-long-lists-storage-clicks.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/08-events/08-data-events-boot-06-long-lists-storage-clicks.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : actList, clickTables
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function actList(){
  if (ACTS_CACHE) return ACTS_CACHE;
  /* ═══ الخصائصُ تُشتقُّ من المستمع كلِّه لا من دالةٍ واحدة ═══
     كانت تُقرأ من `onDocClick` وحدَها. ولمّا طالت فصُلت أجزاؤها إلى
     `clickTables` و`clickA` صارت خصائصُ ما فُصل **غيرَ مسجّلة**: يضغط
     المستخدمُ «راجع» أو شريحةَ «متعذّرٌ يحتاج قرارًا» أو زرَّ اعتماد الوزارة
     فيبتلعها الحارسُ نفسُه ولا يقع شيء — وهو الحارسُ الذي كُتب ليمنع هذا
     بالضبط. تُقرأ الثلاثُ معًا. */
  var src = '';
  try {
    src = String(onDocClick)
        + (typeof clickTables === 'function' ? String(clickTables) : '')
        + (typeof clickA === 'function' ? String(clickA) : '');
    /* (V33.0) المعالجان صارا أجزاءً: نصُّ الأجزاء يُقرأ كذلك — وإلا ظنَّ الحارسُ كلَّ زرٍّ غيرَ مربوطٍ وابتلعه */
    for (var pi = 1; pi <= 30; pi++){
      if (typeof window['onDocClickPart' + pi] === 'function') src += String(window['onDocClickPart' + pi]);
      if (typeof window['onDocClickPart' + pi + 'b'] === 'function') src += String(window['onDocClickPart' + pi + 'b']);   /* (V38.97) a part cut in two */
      if (typeof window['clickAPart' + pi] === 'function') src += String(window['clickAPart' + pi]);
    }
    /* (V39.34) owner's screenshot: the X of the 3D «الطبقات» sheet did nothing and a toast «✕» appeared — its handler had moved
       into clickAMapViews (V39.31, to keep clickAPart7 under 150 lines) and this scan did not read it, so the guard swallowed
       every .btn whose action lived there (the X, «احفظ المنظر», «تحريك الأجهزة», «تم», «تراجع», «الشمال»). Now every global
       click handler is read by its name — a handler split out tomorrow is read too. */
    Object.keys(window).forEach(function(k){
      if (/^(click|onDocClick)[A-Z0-9]/.test(k) && !/^clickAPart[0-9]+$|^onDocClickPart[0-9]+b?$/.test(k)){
        try { if (typeof window[k] === 'function') src += String(window[k]); } catch (e2){ LS_ERR = e2; }
      }
    });
  } catch (e){ LS_ERR = e; }
  var found = src.match(/data-[\w-]+/g) || [];
  ACTS_CACHE = found.length >= 20 ? found.filter(function(v, i){ return found.indexOf(v) === i; })
                                  : null;
  return ACTS_CACHE;
}

/* ═══ نقراتُ الجداول والنوافذ ═══
   `onDocClick` تجاوزت ستّين ألفَ حرفٍ — دالةٌ بهذا الطول لا تُقرأ ولا تُصان،
   والحارسُ يمسك ذلك. فصُلت نقراتُ الجداول الحديثة (نافذةُ الشركات، جدولُ
   المتابعة، المهامُّ الأسبوعية، المعالم) إلى دالةٍ ترجع `true` إن التقطت
   الحدثَ فيتوقّف الباقي. */
function clickTables(e){
  /* نافذةُ مخيّمات الشركة: تُفتَح برقمٍ، وتُغلَق بالإكس أو بالضغط خارجَها */
  var cop = e.target.closest('[data-copop]');
  if (cop){ PV.CO_POP = { co:cop.getAttribute('data-copop'), kind:cop.getAttribute('data-cok') || 'all' }; render(1); return true; }
  if (e.target.closest('[data-copopx]')){ PV.CO_POP = null; render(1); return true; }
  if (e.target.closest('[data-copopxls]')){ coPopXls(); return true; }
  var cogo = e.target.closest('[data-comap]');
  if (cogo){ var gid = cogo.getAttribute('data-comap'); PV.CO_POP = null;
             POP_SITE = gid; POP_OPEN = true; CUR = 'map'; render();
             mapFlySoon(gid); return true; }   /* (V38.20) */
  var cst = e.target.closest('[data-copopsite]');
  if (cst){ DETAIL_ID = cst.getAttribute('data-copopsite'); PV.CO_POP = null; goPage('site'); render(1); return true; }
  if (PV.CO_POP && e.target.id === 'coPopWrap'){ PV.CO_POP = null; render(1); return true; }
  if (e.target.closest('[data-bell]')){ bellToggle(); return true; }
  if (e.target.closest('[data-bellclose]')){ bellToggle(false); /* ثم يكمل إلى data-p */ }
  if (PV.BELL_OPEN && !e.target.closest('#bellPop') && !e.target.closest('[data-bell]')) bellToggle(false);
  if (e.target.closest('[data-nreadall]')){ notifStore().forEach(function(n){ n.read = true; }); CORE.saveSoon(); syncBadge(); bellToggle(false); if (CUR === 'notif') render(1); return true; }
  if (e.target.closest('[data-npopx]')){ e.preventDefault(); var px = e.target.closest('.notif-pop'); if (px) px.remove(); return true; }   /* (V20.8) إغلاقٌ بلا انتقال */
  if (e.target.closest('[data-nmute]')){ e.preventDefault(); lsSet('nsk14.nmute', String(Date.now() + 3600000)); var pw = document.getElementById('notifPop'); if (pw) pw.innerHTML = ''; toast(t('كُتمت الإشعاراتُ ساعةً على هذا الجهاز')); return true; }
  if (e.target.closest('[data-nset]')){
    var ns = e.target.closest('[data-nset]').getAttribute('data-nset');
    if (ns === 'npop' || ns === 'nsys'){ var k0 = 'nsk14.' + ns; lsSet(k0, lsGet(k0) === '0' ? '1' : '0'); }
    else if (ns === 'tomorrow'){ var tm = new Date(); tm.setDate(tm.getDate() + 1); tm.setHours(7, 0, 0, 0); lsSet('nsk14.nmute', String(tm.getTime())); }
    else if (ns === 'unmute') lsSet('nsk14.nmute', '0');
    if (ns !== 'npop' || lsGet('nsk14.npop') === '0'){ var pw2 = document.getElementById('notifPop'); if (pw2) pw2.innerHTML = ''; }
    render(1); return true;
  }
  var npo = e.target.closest('[data-npop]');
  if (npo){ bellToggle(false); notifPopGo(npo.getAttribute('data-npop')); return true; }
  if (e.target.closest('[data-kmix]')){ PV.KMI = null; render(1); return true; }
  if (e.target.closest('[data-kmigo]')){ kmiApply(); return true; }
  var kma = e.target.closest('[data-kmiall]');
  if (kma && PV.KMI){
    var mode = kma.getAttribute('data-kmiall');
    PV.KMI.rows.forEach(function(r){ r.take = (mode === 'new') ? (r.st === 'new') : false; });
    render(1); return true;
  }
  var gg = e.target.closest('[data-guideg]');
  if (gg){ PV.GUIDE.g = gg.getAttribute('data-guideg') || ''; render(1); return true; }
  var lg = e.target.closest('[data-legend]');
  if (lg){ LEGEND_ON = lg.getAttribute('data-legend') === '1'; lsSet('nsk14.legend', LEGEND_ON ? '1' : '0'); render(1); if (CUR === 'map' && MAP) mapPaint(); return true; }
  if (e.target.closest('[data-syncall]')){ syncAllNow(); return true; }
  if (e.target.closest('[data-phfull]')){ STATE.meta.phFull = 0; photosBackfill(true); toast(t('جارٍ فحصُ صور الدرايف…')); render(1); return true; }   /* (V37.8) */
  if (e.target.closest('[data-appreset]')){ appResetGo(); return true; }   /* (V37.18) */
  if (e.target.closest('[data-buyphx]')){ PV.BUY_PH = null; var pvx = document.getElementById('byPhPrev'); if (pvx) pvx.innerHTML = buyPhPrevHtml(); return true; }   /* (V37.43) */
  var skb = e.target.closest('#skinRow [data-skin]');   /* (V37.33) */
  if (skb){ skinSet(skb.getAttribute('data-skin')); toast(t('تغيّر المظهر — على هذا الجهاز فقط')); return true; }
  if (e.target.closest('[data-assistback]')){ assistGoHome(); return true; }   /* (V37.40) */
  /* (V38.43) report builder: save a favourite, delete one, clear the conditions */
  var rbs = e.target.closest('[data-rbsave]'); if (rbs){ var nmF = prompt(t(rbs.getAttribute('data-rbsave') === 'team' ? 'اسم التقرير المشترك للفريق' : 'اسم التقرير المفضّل')); if (nmF && rbFavSave(nmF, rbs.getAttribute('data-rbsave') === 'team')){ toast('\u2605 ' + t('حُفظ')); var rsF = document.getElementById('assistRes'); if (rsF) rsF.innerHTML = assistResHtml(); else render(1); } return true; }
  var rbd = e.target.closest('[data-rbdel]'); if (rbd){ rbFavDel(rbd.getAttribute('data-rbdel')); var rsD = document.getElementById('assistRes'); if (rsD) rsD.innerHTML = assistResHtml(); else render(1); return true; }
  var rbr = e.target.closest('[data-rbrun]'); if (rbr){ rbRun(rbr.getAttribute('data-rbrun')); return true; }
  var rbx = e.target.closest('[data-rbxls]'); if (rbx){ rbXls(rbx.getAttribute('data-rbxls')); return true; }
  var rbf = e.target.closest('[data-rbfav]'); if (rbf){ var fv = rbFavs()[+rbf.getAttribute('data-rbfav')]; if (fv && fv.sel){ rbState().sel = Object.assign({}, fv.sel); rbState().open = true; var rsV = document.getElementById('assistRes'); if (rsV) rsV.innerHTML = assistResHtml(); else render(1); rbRun(fv.sel.pop); } return true; }
  var rbp = e.target.closest('[data-rbpin]'); if (rbp){ if (rbFavPin(rbp.getAttribute('data-rbpin'))){ var rsP = document.getElementById('assistRes'); if (rsP) rsP.innerHTML = assistResHtml(); else render(1); } return true; }
  /* (V38.60) the field chat */
  /* (V39.7) the engineer and above delete a line or a conversation — marked deleted (who and when), gone for everyone */
  var chd = e.target.closest('[data-chdel]'), chdt = e.target.closest('[data-chdelt]');
  if ((chd || chdt) && chMayDel()){
    var me0 = STATE.meta.name || '', ids = chd ? [chd.getAttribute('data-chdel')]
      : chMsgs().filter(function(v){ return chVisible(v) && chKey(v) === chdt.getAttribute('data-chdelt'); }).map(function(v){ return v.id; });
    if (!ids.length || !confirm(t(chd ? 'تُمسح الرسالة عند الجميع. متأكد؟' : 'تُمسح المحادثة كلُّها عند الجميع. متأكد؟'))) return true;
    ids.forEach(function(id){ var v0 = (STATE.msgs || {})[id]; if (!v0) return; CORE.set('msgs', id, Object.assign({}, v0, { deleted:true, delBy:me0, delAt:Date.now() })); });
    CORE.saveSoon(); if (chdt) chPageHtml.f = {}; toast('\u{1F5D1} ' + t(chd ? 'مُسحت الرسالة' : 'مُسحت المحادثة')); render(1); return true;
  }
  /* (V39.7) a conversation handed to someone at my rank or below: they get the question and a button to reply to its owner,
     and the owner is told who will answer */
  return clickTablesB(e);   /* (V39.90) split at a statement no local crosses — under the 150-line cap */
}
/* (V39.90) the second half of clickTables — same handlers, same order */
function clickTablesB(e){
  var chf2 = e.target.closest('[data-chfwd]');
  if (chf2){ var fk = chf2.getAttribute('data-chfwd'); chOpenHtml.fwd = chOpenHtml.fwd === fk ? '' : fk; render(1); return true; }
  var chft = e.target.closest('[data-chfwdto]');
  if (chft && chOpenHtml.fwd){
    var who2 = chft.getAttribute('data-chfwdto'), other = chOpenHtml.fwd.slice(3);
    var last = chMsgs().filter(function(v){ return chVisible(v) && chKey(v) === 'dm:' + other && v.from === other; }).slice(-3).map(function(v){ return v.text; }).join('\n');
    chSend('', who2, '\u21AA ' + t('محوّلة من') + ' ' + (dispName(other) || other) + (last ? ':\n' + last : ''), 'fwd', { ref:other });
    chSend('', other, '\u21AA ' + t('حوّلتُ سؤالك إلى') + ' ' + (dispName(who2) || who2) + ' — ' + t('هيردّ عليك هنا'), 'msg');
    chOpenHtml.fwd = ''; toast('\u21AA ' + t('حُوِّلت المحادثة إلى') + ' ' + (dispName(who2) || who2)); render(1); return true;
  }
  /* (V39.8) the beep on or off, and the system's notices asked for with a tap (a phone only asks after one) */
  if (e.target.closest('[data-chmute]')){ lsSet('nsk14.chMute', lsGet('nsk14.chMute') === '1' ? '0' : '1'); render(1); return true; }
  if (e.target.closest('[data-chnotif]')){
    try { Notification.requestPermission().then(function(p){ toast(p === 'granted' ? '\u{1F4E3} ' + t('تنبيهات الرسائل مفعّلة') : t('تنبيهات الرسائل مقفولة من إعدادات الجهاز')); render(1); }); } catch (eN){ LS_ERR = eN; }
    return true;
  }
  var chs = e.target.closest('[data-chsend]');
  if (chs){
    var key = chs.getAttribute('data-chsend'), ta = null;
    document.querySelectorAll('[data-chtext]').forEach(function(el){ if (!ta && el.getAttribute('data-chtext') === key) ta = el; });
    var txt = ta ? ta.value : '', site = key === '*' ? ((document.querySelector('[data-chsite-in]') || {}).value || '').trim() : key;
    var to = key === '*' ? ((document.querySelector('[data-chto-sel]') || {}).value || '') : (chs.getAttribute('data-chto') || '');
    if (key.indexOf('dm:') === 0){ to = key.slice(3); site = ''; } else if (key === 'team'){ to = ''; site = ''; }   /* (V38.65) person and team threads */
    if (!String(txt || '').trim()){ toast(t('اكتب الرسالةَ أوّلًا')); return true; }
    if (site && !siteFind(site)){ toast(t('النقطةُ غيرُ موجودة') + ': ' + site); return true; }
    if (site && !chScheduled(site)){ toast(t('هذه النقطةُ غيرُ مجدولةٍ للتركيب — لا محادثةَ عليها')); return true; }   /* (V38.67) */
    var sent = chSend(site, to, txt); if (ta) ta.value = ''; toast('\u{1F4AC} ' + t('أُرسلت'));
    if (sent && chOpenHtml.draft) delete chOpenHtml.draft[key];   /* (V39.4) the assistant's draft is sent — gone */
    if (key === '*' && sent && CUR === 'chat') chPageHtml.f = { open:chKey(sent) };   /* (V38.65) the conversation it started opens */
    render(1); return true;
  }
  var chf = e.target.closest('[data-chf]');
  if (chf){ var chfv = chf.getAttribute('data-chf'); chPageHtml.f = chfv === 'all' ? {} : chfv === 'sys' ? { sys:1 } : (chfv.indexOf('site:') === 0 ? { site:chfv.slice(5) } : { who:chfv.slice(4) }); toast(chfv === 'all' ? t('كلُّ الرسائل') : chfv === 'sys' ? t('سجل التركيب') : chfv.slice(chfv.indexOf(':') + 1)); render(1); return true; }
  var cho = e.target.closest('[data-chopen]');
  if (cho){ chPageHtml.f = { open:'site:' + cho.getAttribute('data-chopen') }; POP_OPEN = false; PTAB.chat = 'chat'; goPage('chat'); render(1); return true; }
  if (e.target.closest('[data-chhclear]')){ chHistState.s = null; render(1); return true; }   /* (V38.67) */
  var chot = e.target.closest('[data-chopen-t]');   /* (V38.65) a thread from the list */
  if (chot){ chPageHtml.f = { open:chot.getAttribute('data-chopen-t') }; render(1); return true; }
  var rbpr = e.target.closest('[data-rbpresets]'); if (rbpr){ var nP = rbPresetsAdd(); toast(nP ? '\u26A1 ' + t('أُضيفت') + ' ' + nm(nP) : t('كلُّها موجودةٌ أصلًا')); var rsR = document.getElementById('assistRes'); if (rsR) rsR.innerHTML = assistResHtml(); else render(1); return true; }
  var rbc = e.target.closest('[data-rbclear]'); if (rbc){ rbState().sel = {}; rbState().open = true; var rsC = document.getElementById('assistRes'); if (rsC) rsC.innerHTML = assistResHtml(); else render(1); return true; }
  var aq = e.target.closest('[data-assistq]');   /* (V37.30) سؤالٌ سريعٌ بنقرة */
  if (aq){ ASSIST_Q = aq.getAttribute('data-assistq'); var bkA = document.getElementById('assistBack'); if (bkA) bkA.hidden = false; try { assistLog(ASSIST_Q, true, true); } catch (eAL){ LS_ERR = eAL; } var inA = document.getElementById('assistQ'); if (inA) inA.value = ASSIST_Q; var rsA = document.getElementById('assistRes'); if (rsA) rsA.innerHTML = assistResHtml(); else render(1); return true; }
  if (e.target.closest('[data-qstalex]')){ qStaleSync.snooze = Date.now() + 1800000; var qb = document.getElementById('qStaleBar'); if (qb) qb.remove(); return true; }   /* (V37.29) */
  if (e.target.closest('[data-liteoff]')){ try { lsSet('nsk14.liteoff', String(Date.now())); } catch (e0){ LS_ERR = e0; } liteOff(); return true; }
  if (e.target.closest('[data-liteon]')){ liteOn(); return true; }   /* (V37.23) */
  if (e.target.closest('[data-phstalex]')){ phStaleSync.snooze = Date.now() + 30 * 60000; var ps0 = document.getElementById('phStale'); if (ps0) ps0.remove(); return true; }   /* (V37.13) */
  if (e.target.closest('[data-phflushnow]')){ if (!STATE.meta.online){ toast(t('افتح الشبكة أولًا')); return true; } photoFlush(); toast(t('جارٍ رفعُ الصور — اترك التطبيق مفتوحًا')); return true; }
  var phrf = e.target.closest('[data-phrefetch]');   /* (V37.7) أعد جلبَ صور النقطة */
  if (phrf){ var pid0 = phrf.getAttribute('data-phrefetch'); delete PV.PH_FETCH[pid0]; photosFetchSite(pid0); render(1); return true; }
  var svph = e.target.closest('[data-svphotos]');   /* (V37.6) صورُ النقطة من صفّ القائمة */
  if (svph){ PV.SV_PHO = svph.getAttribute('data-svphotos'); var hostP = (svph.closest('.svpop') || {}).parentNode || document.getElementById('content');   /* (V37.8) بلا إعادة رسم */
    if (hostP){ var tmpP = document.createElement('div'); tmpP.innerHTML = svPhoPanel(PV.SV_PHO); while (tmpP.firstChild) hostP.appendChild(tmpP.firstChild); } else render(1); return true; }
  if (e.target.closest('[data-svphoclose]')){ PV.SV_PHO = ''; ['svPhoVeil', 'svPhoBox'].forEach(function(i0){ var el0 = document.getElementById(i0); if (el0) el0.remove(); }); return true; }
  var phv = e.target.closest('[data-phview]');
  if (phv && phv.getAttribute('data-phview')){ photoView(phv.getAttribute('data-phview')); return true; }
  var phd = e.target.closest('[data-phdl]');
  if (phd){ photoDownload(phd.getAttribute('data-phdl')); return true; }
  if (e.target.closest('[data-phclose]')){ var pv = document.getElementById('phView'); if (pv) pv.remove(); return true; }
  var mle = e.target.closest('[data-mledit]');
  if (mle){ PV.MILE_EDIT = mle.getAttribute('data-mledit'); PV.MILE_NEW = false; render(1); return true; }
  if (e.target.closest('[data-mlcancel]')){ PV.MILE_EDIT = ''; render(1); return true; }
  var mls = e.target.closest('[data-mlsave]');
  if (mls){
    var mid = mls.getAttribute('data-mlsave'), tr = mls.closest('tr'), g = function(k){ var el = tr && tr.querySelector('[data-mle="' + k + '"]'); return el ? el.value : ''; };
    var w = +g('w'), pr = g('prog');
    if (mileUpsert(mid, { n:g('n').trim(), w:isNaN(w) ? undefined : w, dep:g('dep').trim(), prog:(pr === '' ? undefined : +pr) })){ toast(t('حُفظ المعلَم')); PV.MILE_EDIT = ''; render(1); }
    return true;
  }
  var mld = e.target.closest('[data-mldel]');
  if (mld){ mileRemove(mld.getAttribute('data-mldel')); return true; }
  if (e.target.closest('[data-mlnew]')){ PV.MILE_NEW = true; PV.MILE_EDIT = ''; render(1); return true; }
  if (e.target.closest('[data-mlncancel]')){ PV.MILE_NEW = false; render(1); return true; }
  if (e.target.closest('[data-mlnsave]')){
    var v = function(id){ var el = document.getElementById(id); return el ? el.value : ''; };
    if (mileAdd(v('mlnN'), v('mlnW'), v('mlnD'), v('mlnDep').trim())) PV.MILE_NEW = false;
    return true;
  }
  return false;
}
