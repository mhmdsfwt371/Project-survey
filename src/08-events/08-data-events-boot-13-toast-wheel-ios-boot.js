/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-13-toast-wheel-ios-boot.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Toast, label cells, mouse wheel never types numbers, iOS viewport stability, assistant scroll fix, file-input change handlers and the boot sequence.
   DEFINES : labelCells, toast, liteSync, qStaleSync, phStaleSync, assistSync, reflow, reflowSoon, assistGoHome
   GLOBALS : REFLOW_T
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
function labelCells(root){
  var tbs = root.querySelectorAll('.data-table');
  for (var i = 0; i < tbs.length; i++){
    var heads = tbs[i].querySelectorAll('thead th');
    var rows  = tbs[i].querySelectorAll('tbody tr');
    for (var r = 0; r < rows.length; r++){
      var cells = rows[r].children;
      var first = (cells[0] && cells[0].textContent.trim().split('\n')[0]) || '';
      for (var cI = 0; cI < cells.length; cI++){
        var col = (heads[cI] && heads[cI].textContent.trim()) || '';
        var fs = cells[cI].querySelectorAll('input,select,textarea');
        for (var f = 0; f < fs.length; f++){
          if (fs[f].getAttribute('aria-label')) continue;
          fs[f].setAttribute('aria-label',
            (col ? col + (first ? ' — ' + first.slice(0, 40) : '') : first) || t('حقل'));
        }
      }
    }
  }
}

function toast(label){
  var old = document.getElementById('nskToast');
  if (old) old.remove();
  var el = document.createElement('div');
  el.id = 'nskToast';
  el.setAttribute('role','status');
  /* لا ذيلَ بعد اليوم: «في المعاينة: لا فعل حقيقي» كانت تُذيَّل بها كلُّ
     رسالةٍ — أُزيلت في V14.26 وعادت، فحُرست بفحصٍ يمنع رجوعَها. */
  el.textContent = label;
  el.style.cssText = 'position:fixed;inset-block-end:20px;inset-inline:0;margin-inline:auto;'
    + 'width:max-content;max-width:88vw;background:var(--sidebar);color:var(--sidebar-ink);'
    + 'padding:11px 18px;border-radius:99px;font-size:13px;z-index:200;'
    + 'box-shadow:0 8px 28px rgba(0,0,0,.45);text-align:center';
  document.body.appendChild(el);
  setTimeout(function(){ if (el.parentNode) el.remove(); }, 2200);
}

/* ═══ عجلةُ الفأرة لا تكتب أرقامًا (V17.17) ═══
   حقلُ الرقم في المتصفّح يتغيّر بالعجلة إن كان تحت المؤشِّر ومركَّزًا —
   فيمرّر المستخدمُ الصفحةَ فتُكتَب قيمةٌ لم يقصدها في نسبةِ إنجازٍ أو سعرٍ
   أو زمن. تُفقَد البؤرةُ عند العجلة فلا تُكتَب إلا بيدٍ قاصدة. */
document.addEventListener('wheel', function(e){
  var el = e.target;
  if (el && el.tagName === 'INPUT' && el.type === 'number' && el === document.activeElement) el.blur();
}, { passive:true });

document.addEventListener('change', function(e){
  if (e.target && e.target.id === 'iotStatus' && typeof iotFieldLive === 'function'){ iotFieldLive('iotStatus', e.target.value); return; }   /* (V39.65) */
  /* (V38.43) report builder: a dropdown changed → preview and buttons follow */
  if (e.target && e.target.closest && e.target.closest('[data-rb]')){ rbOnChange(e.target.closest('[data-rb]')); return; }
  if (e.target && e.target.closest && e.target.closest('[data-vcn],[data-vcw],[data-vcp],[data-vco]')) catDraftCatch(e);   /* (V37.4) */
  var t0 = e.target;
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-fontup')){ fontUp(t0.getAttribute('data-fontup'), t0.files && t0.files[0]); return; }   /* (V28.9) */
  if (t0 && t0.hasAttribute && (t0.hasAttribute('data-expsg') || t0.hasAttribute('data-expst'))){ EXP.scope[t0.hasAttribute('data-expsg') ? 'g' : 't'] = t0.value; render(1); return; }   /* (V29.0) */
  var wdyF = t0 && t0.id ? ({ 'wdyMon':'mon', 'wdyDay':'day', 'wdyH1':'h1', 'wdyH2':'h2' })[t0.id] : '';   /* (V24.0) مرشّحاتُ ملخص العمل اليومي */
  if (wdyF){ WDY[wdyF] = (wdyF === 'h1' || wdyF === 'h2') ? +t0.value : t0.value; if (wdyF === 'mon') WDY.day = ''; WDY.pg = 1; render(1); return; }
  if (t0 && t0.id === 'asnTo'){ ASN_TO = t0.value; render(1); return; }
  /* (V37.82) اختيارُ قطعةٍ يملأ «سعر الوحدة» بسعر الكتالوج — ويبقى قابلًا للتعديل؛ وما كتبه المستخدمُ بيده لا يُكتَب فوقه */
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-tric')){
    var tp = document.getElementById('itP' + t0.getAttribute('data-tric')), op = t0.options[t0.selectedIndex];
    if (tp && (!tp.value || tp.getAttribute('data-auto') === '1')){
      var catP = op ? +(op.getAttribute('data-p') || 0) : 0;
      tp.value = catP ? String(catP) : ''; tp.setAttribute('data-auto', catP ? '1' : '0');
    }
    return;
  }
  if (t0 && t0.id && /^itP/.test(t0.id)) t0.setAttribute('data-auto', '0');   /* كتب بيده — لا يُستبدَل */
  if (t0 && t0.hasAttribute && (t0.hasAttribute('data-trz') || t0.hasAttribute('data-trt'))){ trialPick(t0.getAttribute(t0.hasAttribute('data-trz') ? 'data-trz' : 'data-trt'), t0.hasAttribute('data-trz') ? 'zone' : 'type', t0.value); return; }   /* (V37.76) مشعرُ التجربة ونوعُها */
  /* لونُ النوع وشكلُه: يُحفَظان عند الاختيار لا مع كلِّ حركةٍ في المنتقي (V17.60) */
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-tyc')){ typeSet(t0.getAttribute('data-tyc'), { c:t0.value }); render(1); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-tys')){ typeSet(t0.getAttribute('data-tys'), { s:t0.value }); render(1); return; }
  /* المسافةُ تُكتَب بلا إعادة بناء، وعند الخروج من الحقل يُحدَّث اللوحُ كلُّه (V17.58) */
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-rt') && String(t0.tagName).toUpperCase() === 'INPUT'){ render(1); return; }
  /* جدولُ المتابعة: إنجازُ بندٍ يُكتب ويُرفَع فورًا؛ وملفُّ الاستيراد */
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-kmifile')){ if (t0.files && t0.files[0]) kmiImport(t0.files[0]); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-kmiz')){ KMI_ZONE = t0.value; return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-kmit')){ KMI_TYPE = t0.value; return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-kmiw')){ KMI_WORK = t0.value.trim(); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-kmick') && KMI){
    var ix = +t0.getAttribute('data-kmick');
    if (KMI.rows[ix]) KMI.rows[ix].take = !!t0.checked;
    return;
  }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-mintype')){
    /* cfgSet(المسار، المفتاح، القيمة): المفتاحُ هو النوع — فيُرفَع ما تغيّر وحدَه بدمج */
    cfgSet('minType', t0.getAttribute('data-mintype'), +t0.value || 0); toast(t('حُفظ')); render(1); return;
  }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-wbspct')){ wbsSetPct(t0.getAttribute('data-wbspct'), t0.value); render(1); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-wtst')){ wtSet(t0.getAttribute('data-wtst'), { st:t0.value }); toast(t(t0.value)); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-wtfile')){ if (t0.files && t0.files[0]) wtImport(t0.files[0]); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-wbsfile')){ if (t0.files && t0.files[0]) wbsImport(t0.files[0]); return; }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-ex47')){ if (t0.files && t0.files[0]) ex47Import(t0.files[0]); return; }   /* (V37.88) */
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-brfile')){ if (t0.files && t0.files[0]) extFileImport(t0.files[0]); return; }
  /* (V38.30) استيرادُ ملفِّ انتظارٍ من جهازٍ آخر — للمهندس فما فوق */
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-qimport')){
    if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
    var qf2 = t0.files && t0.files[0]; if (!qf2) return;
    var qr = new FileReader();
    qr.onload = function(){ var o; try { o = JSON.parse(String(qr.result || '')); } catch (e4){ o = null; }
      var res = CORE.queueImport(o);
      if (res.bad){ toast(t('هذا ليس ملفَّ انتظار')); return; }
      toast('\u2713 ' + t('استُورد') + ' ' + nm(res.n) + ' ' + t('سجلًّا') + (res.skipped ? ' \u00b7 ' + t('تُرك') + ' ' + nm(res.skipped) + ' ' + t('(أحدثُ في القاعدة أو غيرُ صالح)') : '')); render(1); };
    qr.readAsText(qf2); return;
  }   /* (V37.94) */
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-tname')){
    var tmn = teamOf(CTEAM_CUR);
    if (tmn){ tmn.n = t0.value || tmn.n; CORE.dirty('teams', tmn.id, tmn); render(1); }
    return;
  }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-ns')){
    var nsk = t0.getAttribute('data-ns');
    NEWSITE[nsk] = t0.value;
    /* (V29.7) تغييرُ المشعر أو النوع أو المركز يعيد رسمَ النموذج — كانت حقولُ المخيم تبقى ظاهرةً بعد اختيار نوعٍ آخر */
    if (nsk === 'type'){ NEWSITE.chals = []; if (t0.value === 'LPR' && !/التفويج|النوار/.test(NEWSITE.zone)) NEWSITE.zone = 'مواقع التفويج'; }
    if (nsk === 'zone' || nsk === 'type' || nsk === 'center') render(1);
    return;
  }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-share')){
    var tm = teamOf(CTEAM_CUR), m = tm.members[+t0.getAttribute('data-share')];
    if (m){ m.share = cfgN(t0.value); CORE.dirty('teams', tm.id, tm); render(1); }
    return;
  }
  if (t0 && t0.hasAttribute && t0.hasAttribute('data-mrole')){
    var tm2 = teamOf(CTEAM_CUR), m2 = tm2.members[+t0.getAttribute('data-mrole')];
    if (m2){ m2.role = t0.value; CORE.dirty('teams', tm2.id, tm2); render(1); }
    return;
  }
  var el = e.target;
  if (el && el.hasAttribute){
    if (el.hasAttribute('data-nsphoto')){
      var nf = el.files && el.files[0];
      if (!nf) return;
      toast(t('تُضغط الصورة…'));
      shrink(nf, 1280, 0.72).then(function(p){
        if (!p){ toast(t('تعذّرت قراءة الصورة')); return; }
        NEWSITE.photos[el.getAttribute('data-nsphoto')] = p;
        render(1);
      });
      return;
    }
    if (el.hasAttribute('data-insph')){ insPhotoAdd(el.getAttribute('data-insph'), el.files ? Array.prototype.slice.call(el.files) : []); el.value = ''; return; }   /* (V37.79) صورُ تركيبٍ من المعرض أو اللاب */
    /* صورةُ التجربة تصعد فورًا بالخطِّ نفسِه تحت معرّف التجربة (V17.73) */
    if (el.hasAttribute('data-trph')){
      var tf = el.files && el.files[0], tid = el.getAttribute('data-trph');
      if (!tf) return;
      toast(t('تُضغط الصورة…'));
      shrink(tf, 1280, 0.72).then(function(p3){
        if (!p3){ toast(t('تعذّرت قراءة الصورة')); return; }
        photoQueue('TRIAL-' + tid, 'trial', p3.d);
        logEvent('صورةُ تجربة — ' + tid, 'TRIAL-' + tid);
        toast(t('صعدت الصورةُ إلى طابور الرفع')); render(1);
      });
      return;
    }
    /* صورةُ الفكِّ والصيانة — مخزنُ كلِّ نموذجٍ على حدة */
    if (el.hasAttribute('data-disph') || el.hasAttribute('data-mntph')){
      var isD = el.hasAttribute('data-disph');
      var kk = el.getAttribute(isD ? 'data-disph' : 'data-mntph');
      var nf2 = el.files && el.files[0];
      if (!nf2) return;
      toast(t('تُضغط الصورة…'));
      shrink(nf2, 1280, 0.72).then(function(p2){
        if (!p2){ toast(t('تعذّرت قراءة الصورة')); return; }
        (isD ? DISF : MNTF).photos[kk] = p2;
        render(1);
      });
      return;
    }
    if (el.hasAttribute('data-pkqty')){   /* (V23.1) كميةُ سطرٍ في منتقي الأجهزة — صفرٌ يرفع السطر */
      var pc = el.getAttribute('data-pkqty'), pv = Math.max(0, Math.round(cfgN(el.value) || 0));
      if (pv > 0) SOL_LINES[pc] = pv; else delete SOL_LINES[pc];
      render(1); return;
    }
    if (el.hasAttribute('data-chh')){ chHistState()[el.getAttribute('data-chh')] = el.value; render(1); return; }   /* (V38.67) the chat history's filters */
    if (el.hasAttribute('data-insqadd')){   /* (V38.61) photos added from «تعديل التركيب» */
      var flI = el.files ? Array.prototype.slice.call(el.files) : [], idI = el.getAttribute('data-insqadd');
      if (flI.length && idI && typeof insPhotoAdd === 'function') insPhotoAdd(idI, flI);
      return;
    }
    if (el.hasAttribute('data-svqadd')){   /* (V22.8) صورةٌ أو أكثر بنوعها */
      var fl = el.files ? Array.prototype.slice.call(el.files) : [], ak = (document.getElementById('svqPhKind') || {}).value || 'extra', aid = SVQ.id;
      if (!fl.length || !aid) return;
      toast(t('تُضغط الصور…'));
      fl.reduce(function(pr, f){ return pr.then(function(){ return shrink(f, 1280, 0.72).then(function(p){ if (p) svqPhoto(aid, ak, p); }); }); }, Promise.resolve()).then(function(){ render(1); });
      return;
    }
    if (el.hasAttribute('data-svqph')){   /* (V22.7) صورةٌ من لوح تعديل المسح */
      var qf = el.files && el.files[0], qk = el.getAttribute('data-svqph'), qid = SVQ.id;
      if (!qf || !qid) return;
      toast(t('تُضغط الصورة…'));
      shrink(qf, 1280, 0.72).then(function(p){
        if (!p){ toast(t('تعذّرت قراءة الصورة')); return; }
        if (svqPhoto(qid, qk, p)) render(1);
      });
      return;
    }
    if (el.hasAttribute('data-execov')){ var xid = el.getAttribute('data-execov'), stv = el.value || ''; if (execOvSet(xid, stv)){ logEvent('تصنيفُ التقرير التنفيذي — ' + xid + ' ← ' + (stv ? EXEC_L[stv][0] : 'تلقائي')); toast(t(stv ? 'حُفظ التصنيف — يصل كلَّ الأجهزة ويظهر في التقرير' : 'عاد التصنيف تلقائيًا')); } return; }   /* (V37.52) */
    if (el.hasAttribute('data-buyphoto')){   /* (V37.43) صورةُ الفاتورة — بلا رسمٍ كي لا تُمحى خاناتُ النموذج المكتوبة */
      var fileB = el.files && el.files[0]; if (!fileB) return;
      toast(t('تُضغط الصورة…'));
      shrink(fileB, 1600, 0.78).then(function(p){ if (!p){ toast(t('تعذّرت قراءة الصورة')); return; } BUY_PH = p; var pv = document.getElementById('byPhPrev'); if (pv) pv.innerHTML = buyPhPrevHtml(); toast(t('اختيرت صورة الفاتورة — تُرفع مع حفظ الشراء')); });
      el.value = ''; return;
    }
    if (el.hasAttribute('data-photo')){
      var file = el.files && el.files[0];
      if (!file) return;
      toast(t('تُضغط الصورة…'));
      shrink(file, 1280, 0.72).then(function(p){
        if (!p){ toast(t('تعذّرت قراءة الصورة')); return; }
        FORM.photos[el.getAttribute('data-photo')] = p;
        SVD.dirty = true; svDraftSave();   /* (V25.9) */
        render();
      });
      return;
    }
    if (el.hasAttribute('data-form')){ FORM[el.getAttribute('data-form')] = el.value; SVD.dirty = true; svDraftSoon(); if (el.getAttribute('data-form') === 'ctype') render(1); return; }   /* (V39.56) the barrier line follows the camp type */
    if (el.hasAttribute('data-part')){ FORM.parts[el.getAttribute('data-part')] = el.value; render(); return; }
    if (el.hasAttribute('data-simw')){ simState().w[el.getAttribute('data-simw')] = +el.value || 0; simSave(); render(1); return; }
    if (el.hasAttribute('data-simt')){ simState()[el.getAttribute('data-simt')] = +el.value || 0; simSave(); render(1); return; }
    if (el.hasAttribute('data-fch') || el.hasAttribute('data-mchalf')){
      var fa = (el.getAttribute('data-fch') || el.getAttribute('data-mchalf')).split('|'), fv = String(el.value || '').slice(0, 600);
      if (el.hasAttribute('data-fch')){ var cf = Object.assign({}, (mfuData().fch || {})[fa[0]] || {}); cf[fa[1]] = fv; cf.at = Date.now(); cf.by = STATE.meta.name || ''; cf.hist = mfuHist(cf, fa[1], fv); mfuPut('fch', fa[0], cf); }
      else { var mc = mfuList('chal').filter(function(x){ return x.id === fa[0]; })[0]; if (mc){ var mn = Object.assign({}, mc); delete mn.id; mn[fa[1] === 'owner' ? 'o' : fa[1]] = fv; mn.at = Date.now(); mn.hist = mfuHist(mc, fa[1], fv); mfuPut('chal', fa[0], mn); } }
      if (el.tagName === 'SELECT') render(1); return;
    }
    if (el.hasAttribute('data-tfdf')){ TFD.f = +el.value || 0; if (typeof TFW === 'object'){ TFW.f = TFD.f; tfwPaint(); } render(1); return; }   /* (V28.0) */
    if (el.hasAttribute('data-tfdd')){ TFD.d = el.value === 'back' ? 'back' : 'go'; if (typeof mapPaint === 'function') mapPaint(); render(1); return; }
    if (el.hasAttribute('data-mfuprn')){ var pk = el.getAttribute('data-mfuprn'); pv = String(el.value || '').trim().slice(0, 40); MFU.prn = ''; if (pv && pv !== mfuPartyLabel(pk)){ mfuPut('party', pk, Object.assign({}, mfuPartyRaw(pk) || {}, { t:pv, at:Date.now() })); logEvent('تعديلُ اسم جهةٍ معالجة — ' + pk + ' → ' + pv); } render(1); return; }   /* (V26.8) */
    if (el.hasAttribute('data-mfuown') || el.hasAttribute('data-mfuchalst') || el.hasAttribute('data-mfureqst') || el.hasAttribute('data-mfurequ')){
      if (el.hasAttribute('data-mfuown')){ var oc = el.getAttribute('data-mfuown'); if (mfuParties().indexOf(el.value) > -1) mfuPut('own', oc, el.value); render(1); return; }
      var sec = el.hasAttribute('data-mfuchalst') ? 'chal' : 'req', fid = el.getAttribute(el.hasAttribute('data-mfuchalst') ? 'data-mfuchalst' : (el.hasAttribute('data-mfureqst') ? 'data-mfureqst' : 'data-mfurequ'));
      var cur0 = mfuList(sec).filter(function(x){ return x.id === fid; })[0]; if (!cur0) return;
      var nx = Object.assign({}, cur0); delete nx.id; nx.at = Date.now();
      if (el.hasAttribute('data-mfurequ')) nx.u = String(el.value || '').slice(0, 600); else nx.st = el.value;
      nx.hist = mfuHist(cur0, el.hasAttribute('data-mfurequ') ? 'u' : 'st', el.hasAttribute('data-mfurequ') ? nx.u : nx.st);
      mfuPut(sec, fid, nx); if (!el.hasAttribute('data-mfurequ')) render(1); return;
    }
    if (el.hasAttribute('data-wpst') || el.hasAttribute('data-wpstep')){
      var wpid = (el.getAttribute('data-wpst') || el.getAttribute('data-wpstep')).split('|')[0], wx = pmoList('wplan').filter(function(x){ return x.id === wpid; })[0]; if (!wx) return;
      var wn = Object.assign({}, wx); delete wn.id;
      if (el.hasAttribute('data-wpst')){ wn.st = el.value; wn.hist = mfuHist(wx, 'st', wn.st); }
      else { var si = +el.getAttribute('data-wpstep').split('|')[1]; wn.sdone = (wx.sdone || []).slice(); wn.sdone[si] = !!el.checked; var ln = wplanLines(wx.steps); if (ln.length && wn.sdone.filter(Boolean).length === ln.length && !wplanFinal(wx)){ WPLAN_ACT = { id:wpid, kind:'result' }; toast(t('اكتملت الخطوات — سجّل النتيجة الفعلية')); } }   /* (V21.3) لا تمامَ بلا نتيجة */
      pmoPut('wplan', wpid, wn); render(1); return;
    }
    if (el.hasAttribute('data-stakecur')){
      var sid = el.getAttribute('data-stakecur'), sx = pmoList('stake').filter(function(x){ return x.id === sid; })[0];
      if (sx && PMO_LEVELS.indexOf(el.value) > -1){ var sy = Object.assign({}, sx); delete sy.id; sy.cur = el.value; sy.at = Date.now(); pmoPut('stake', sid, sy); render(1); }
      return;
    }
    if (el.hasAttribute('data-camkind')){
      var cid = el.getAttribute('data-camkind'), cx = siteFind(cid);
      if (cx && may('settings') && CAM_KINDS.indexOf(el.value) > -1){ siteOvSet(cid, { cam:el.value }); cx.cam = el.value; logEvent('نوعُ الكاميرا — ' + cid + ' ← ' + el.value); statBump(); render(1); }
      return;
    }
    if (el.hasAttribute('data-serial')){
      FORM.serials[el.getAttribute('data-serial')] = el.value;
      var oth = (typeof serialOwner === 'function') ? serialOwner(el.value, FORM.site) : '';
      if (oth && !el.__saidDup){ el.__saidDup = 1; toast(t('هذا الرقمُ مسجَّلٌ على نقطةٍ أخرى') + ': ' + oth); }
      return;
    }
  }
  var f = e.target;
  if (!f || !f.hasAttribute || !f.hasAttribute('data-imp')) return;
  file = f.files && f.files[0];
  if (!file) return;
  toast('يُقرَأ الملف…');
  impRead(f.getAttribute('data-imp'), file).then(function(p){
    if (!p){ toast('تعذّرت قراءة الملف'); return; }
    render();
  });
});

document.addEventListener('input', function(e){
  /* (V39.65) the sensor/gateway fields are written into the edit session as they are typed — a redraw or a «احفظ» without
     «حفظ البيانات» first no longer loses them (owner: «باضيف بيانات الحساسات بس مش بيعمل save») */
  if (e.target && /^iot(Room|Serial|Model|Tag|Note)$/.test(e.target.id || '') && typeof iotFieldLive === 'function'){ iotFieldLive(e.target.id, e.target.value); return; }
  /* (V38.74) the sites list searches as you type — a short pause after the last key, then the list follows (the field keeps
     its text and focus through the redraw: renderKeepGrab) */
  if (e.target && e.target.id === 'siteQ'){
    clearTimeout(renderKeepGrab.sqT); var qv = e.target.value;
    renderKeepGrab.sqT = setTimeout(function(){ if (SITE_Q === qv) return; SITE_Q = qv; LIST_SHOWN = LIST_PAGE; render(); }, 280);
    return;
  }
  if (e.target && e.target.closest && e.target.closest('input[data-rb]')){ rbOnChange(e.target.closest('input[data-rb]')); return; }   /* (V38.43) report builder boxes */
  if (e.target && e.target.closest && e.target.closest('[data-vcn],[data-vcw],[data-vcp],[data-vco]')) catDraftCatch(e);   /* (V37.4) مسوّدةُ محرّر التصنيفات */
  /* بحثُ الصفحة: يُصفّي المعروضَ في اللحظة — لا إعادةَ رسمٍ فلا تضيع البؤرة */
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-rt')){
    ROUTE[e.target.getAttribute('data-rt')] = e.target.value;
    /* حقلُ الكتابة لا يُعيد بناءَ اللوح (V17.58) — العددُ والخريطةُ في مكانهما؛
       والقائمةُ تُعيده لأن ما بعدها يتبدّل بها (المخيمُ حقولُه غيرُ حقول المسار) */
    if (String(e.target.tagName).toUpperCase() === 'INPUT'){ routeLive(); return; }
    render(1); return;
  }
  if (e.target && e.target.id === 'pgQ'){
    PG_Q = e.target.value;
    var bind = pgBindOf();
    if (bind){
      PG_LAST_BIND = bind;
      /* بحثُ الشاشة نفسِه: يُرشِّح البياناتِ كلَّها لا المعروضَ منها */
      bind(PG_Q.trim());
      clearTimeout(PG_T);
      PG_T = setTimeout(function(){ render(1); }, 220);   /* البؤرةُ تعود بآليةِ الرسم العامّة */
    } else pgFind(PG_Q);
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-minq')){ MIN_Q = e.target.value.trim(); clearTimeout(MIN_T); MIN_T = setTimeout(function(){ render(1); var el = document.querySelector('[data-minq]'); if (el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 250); return; }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-wtq')){ WT_Q = e.target.value.trim(); clearTimeout(WT_T); WT_T = setTimeout(function(){ render(1); var el = document.querySelector('[data-wtq]'); if (el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 250); return; }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-wbsq')){ WBS_Q = e.target.value.trim(); clearTimeout(WBS_T); WBS_T = setTimeout(function(){ render(1); var el2 = document.querySelector('[data-wbsq]'); if (el2){ el2.focus(); el2.setSelectionRange(el2.value.length, el2.value.length); } }, 250); return; }
  if (e.target && e.target.id === 'assistQ'){
    ASSIST_Q = e.target.value; var bkI = document.getElementById('assistBack'); if (bkI) bkI.hidden = !ASSIST_Q;   /* (V37.40) */
    /* (V36.1) بلاغُ المالك «البحث في المساعد بيسكرول لوحده»: كانت النافذةُ كلُّها تُستبدَل مع كلِّ حرفٍ ويُعاد تركيزُ حقلٍ جديد — فيعيد
       الآيفون حسابَ لوحة المفاتيح ويقفز بالشاشة. صارت النتائجُ وحدَها تُستبدَل (بعد ١٥٠ م.ث من آخر حرف) والحقلُ نفسُه باقٍ بتركيزه. */
    clearTimeout(assistResHtml.t);
    assistResHtml.t = setTimeout(function(){ var rs = document.getElementById('assistRes'); if (rs) rs.innerHTML = assistResHtml(); }, 150);
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-timeslide')){ timeSet(e.target.value); return; }   /* (V39.17) the slider moves the day without redrawing the bar */
  if (e.target && e.target.id === 'mapQ'){   /* (V39.4) the map search: the results only, never the map itself */
    var ms = mapUIHtml.s || (mapUIHtml.s = { open:true, q:'' }); ms.q = e.target.value || '';
    var mr = document.getElementById('mapQRes'); if (mr) mr.innerHTML = mapQResHtml(ms.q);
    return;
  }
  if (e.target && e.target.id === 'navQ'){
    NAV_Q = e.target.value;
    var nv = document.getElementById('nav');
    if (nv){
      nv.innerHTML = navHtml();
      var q = document.getElementById('navQ');
      if (q){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
    }
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-tkph')){
    techSet(e.target.getAttribute('data-tkph'), 'ph', e.target.value); return; }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-tkcrew')){
    techSet(e.target.getAttribute('data-tkcrew'), 'crew', e.target.value); render(1); return; }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-tksup')){
    techSet(e.target.getAttribute('data-tksup'), 'sup', e.target.value); render(1); return; }
  if (e.target && e.target.hasAttribute){
    var el2 = e.target;
    if (el2.hasAttribute('data-esw')){   escSet(+el2.getAttribute('data-esw'),   { w:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-esd')){   escSet(+el2.getAttribute('data-esd'),   { days:+el2.value || 1 }); return; }
    if (el2.hasAttribute('data-eswho')){ escSet(+el2.getAttribute('data-eswho'), { who:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-esto')){  escSet(+el2.getAttribute('data-esto'),  { to:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-esact')){ escSet(+el2.getAttribute('data-esact'), { act:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rca')){   raciSet(+el2.getAttribute('data-rca'),  { a:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rcr')){   raciSet(+el2.getAttribute('data-rcr'),  { R:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rcac')){  raciSet(+el2.getAttribute('data-rcac'), { A:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rcc')){   raciSet(+el2.getAttribute('data-rcc'),  { C:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rci')){   raciSet(+el2.getAttribute('data-rci'),  { I:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-lsw')){ lessSet(+el2.getAttribute('data-lsw'), { w:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-lsa')){ lessSet(+el2.getAttribute('data-lsa'), { a:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-vhp')){ vehSet(el2.getAttribute('data-vhp'), { plate:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-vhm')){ vehSet(el2.getAttribute('data-vhm'), { model:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-vhe')){ vehSet(el2.getAttribute('data-vhe'), { licExp:el2.value }); return; }
    if (el2.hasAttribute('data-vhk')){ vehSet(el2.getAttribute('data-vhk'), { kind:el2.value }); render(1); return; }
    if (el2.hasAttribute('data-vkn') || el2.hasAttribute('data-vkd') || el2.hasAttribute('data-vkc')){
      var vk = el2.getAttribute('data-vkn') || el2.getAttribute('data-vkd') || el2.getAttribute('data-vkc');
      var kk = vehKinds().filter(function(k){ return k.id === vk; })[0];
      if (kk){
        if (el2.hasAttribute('data-vkn')) kk.n = el2.value.trim();
        else if (el2.hasAttribute('data-vkd')) kk.d = el2.value.trim();
        else kk.cap = +el2.value || 1;
        vehKindSave();
      }
      return;
    }
    if (el2.hasAttribute('data-vhq')){
      VEH_Q = el2.value.trim(); render(1);
      var vq = document.getElementById('vhQ');
      if (vq){ vq.focus(); vq.setSelectionRange(vq.value.length, vq.value.length); }
      return;
    }
    var SH = { 'data-shi':'item', 'data-shqy':'qty', 'data-shs':'sup',
               'data-shst':'st', 'data-shsn':'sent', 'data-sheta':'eta', 'data-shgot':'got' };
    var shk = Object.keys(SH).filter(function(a){ return el2.hasAttribute(a); })[0];
    if (shk){
      var p3 = {}; p3[SH[shk]] = SH[shk] === 'qty' ? (+el2.value || 0) : el2.value;
      shipSet(el2.getAttribute(shk), p3);
      if (shk === 'data-shst' || shk === 'data-shgot') render(1);
      return;
    }
    if (el2.hasAttribute('data-shq')){
      SHIP_Q = el2.value.trim(); render(1);
      var sq = document.getElementById('shQ');
      if (sq){ sq.focus(); sq.setSelectionRange(sq.value.length, sq.value.length); }
      return;
    }
    if (el2.hasAttribute('data-ipn')){ ipSet(el2.getAttribute('data-ipn'), 'net',   el2.value); return; }
    if (el2.hasAttribute('data-ipr')){ ipSet(el2.getAttribute('data-ipr'), 'ipRtr', el2.value); return; }
    if (el2.hasAttribute('data-ipd')){ ipSet(el2.getAttribute('data-ipd'), 'ipRdr', el2.value); return; }
    if (el2.hasAttribute('data-ipc')){ ipSet(el2.getAttribute('data-ipc'), 'ipCam', el2.value); return; }
    if (el2.hasAttribute('data-ipq')){
      IP_Q = el2.value.trim(); render(1);
      var iq = document.getElementById('ipQ');
      if (iq){ iq.focus(); iq.setSelectionRange(iq.value.length, iq.value.length); }
      return;
    }
    if (el2.hasAttribute('data-crn')){ crewSet(el2.getAttribute('data-crn'), { n:el2.value.trim() }); render(1); return; }
    if (el2.hasAttribute('data-crk')){ crewSet(el2.getAttribute('data-crk'), { kind:el2.value }); return; }
    if (el2.hasAttribute('data-crd')){ crewSet(el2.getAttribute('data-crd'), { d:el2.value.trim() }); return; }
    if (el2.id === 'mxdZ'){
      var zw = document.getElementById('mxdZnWrap');
      if (zw) zw.style.display = el2.value === '__new' ? '' : 'none';
      return;
    }
    if (el2.hasAttribute('data-mxz')){
      zoneRename(el2.getAttribute('data-mxz'), el2.value); return;
    }
    if (el2.hasAttribute('data-mxt')){
      var p4 = el2.getAttribute('data-mxt').split('|');
      mxTypeMove(p4[0], p4[1], el2.value); return;
    }
    if (el2.hasAttribute('data-vkn')){ vehKindSet(el2.getAttribute('data-vkn'), { n:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-vkd')){ vehKindSet(el2.getAttribute('data-vkd'), { d:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-vkc')){ vehKindSet(el2.getAttribute('data-vkc'), { cap:+el2.value || 1 }); return; }
    if (el2.hasAttribute('data-tyl')){ typeSet(el2.getAttribute('data-tyl'), { l:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-tyi')){ typeSet(el2.getAttribute('data-tyi'), { i:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-jbn')){ jobSet(el2.getAttribute('data-jbn'), { n:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-jbd')){ jobSet(el2.getAttribute('data-jbd'), { d:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-jbr')){ jobSet(el2.getAttribute('data-jbr'), { role:el2.value }); render(1); return; }
    if (el2.hasAttribute('data-tkjob')){ jobAssign(el2.getAttribute('data-tkjob'), el2.value); render(1); return; }
    if (el2.hasAttribute('data-tkn')){  techSet(el2.getAttribute('data-tkn'),  { n:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-tkph')){ techSet(el2.getAttribute('data-tkph'), { ph:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-tkcr')){ techSet(el2.getAttribute('data-tkcr'), { crew:el2.value }); render(1); return; }
    if (el2.hasAttribute('data-cotel')){ coTelSet(el2.getAttribute('data-cotel'), el2.value); render(1); return; }
    if (el2.hasAttribute('data-coliaison')){ coLiaisonSet(el2.getAttribute('data-coliaison'), el2.value); return; }   /* (V28.5) بلا إعادة رسم — لا يضيع المؤشر */
    if (el2.hasAttribute('data-coemail')){ coEmailSet(el2.getAttribute('data-coemail'), el2.value); return; }   /* (V29.0) */
    if (el2.hasAttribute('data-waco')){ WA_CO = el2.value; render(1); return; }
    if (el2.hasAttribute('data-hop')){ hoSetParty(el2.getAttribute('data-hop'), el2.value); return; }
    if (el2.hasAttribute('data-hosn')){ hoSetSigner(+el2.getAttribute('data-hosn'), 'n', el2.value); return; }
    if (el2.hasAttribute('data-hosr')){ hoSetSigner(+el2.getAttribute('data-hosr'), 'role', el2.value); return; }
    if (el2.hasAttribute('data-hoso')){ hoSetSigner(+el2.getAttribute('data-hoso'), 'org', el2.value); return; }
    if (el2.hasAttribute('data-dissite')){ DISF.site = el2.value; DISF.items = {}; render(1); return; }
    if (el2.hasAttribute('data-discond')){ DISF.items[el2.getAttribute('data-discond')] = el2.value; return; }
    if (el2.hasAttribute('data-disnote')){ DISF.note = el2.value; return; }
    if (el2.hasAttribute('data-mntsite')){ MNTF.site = el2.value; render(1); return; }
    if (el2.hasAttribute('data-mntfault')){ MNTF.fault = el2.value; return; }
    if (el2.hasAttribute('data-mntact')){ MNTF.act = el2.value; return; }
    if (el2.hasAttribute('data-mntnote')){ MNTF.note = el2.value; return; }
    if (el2.hasAttribute('data-mntpart')){ MNTF.parts[el2.getAttribute('data-mntpart')] = cfgN(el2.value); return; }
    if (el2.hasAttribute('data-hsel')){ hseSet(+el2.getAttribute('data-hsel'), { lost:cfgN(el2.value) }); render(1); return; }
    if (el2.hasAttribute('data-hsew')){ hseSet(+el2.getAttribute('data-hsew'), { why:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rkp')){ riskSet(el2.getAttribute('data-rkp'), { p:Math.min(5, Math.max(1, cfgN(el2.value) || 1)) }); render(1); return; }
    if (el2.hasAttribute('data-rki')){ riskSet(el2.getAttribute('data-rki'), { i:Math.min(5, Math.max(1, cfgN(el2.value) || 1)) }); render(1); return; }
    if (el2.hasAttribute('data-rko')){ riskSet(el2.getAttribute('data-rko'), { own:el2.value.trim() }); return; }
    if (el2.hasAttribute('data-rkst')){ riskSet(el2.getAttribute('data-rkst'), { st:el2.value }); render(1); return; }
    if (el2.hasAttribute('data-tksup')){ techSet(el2.getAttribute('data-tksup'), { sup:el2.value.trim() }); return; }
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-vlgq')){
    VLOG_Q = e.target.value.trim();
    render(1);
    vq = document.getElementById('vlQ');
    if (vq){ vq.focus(); vq.setSelectionRange(vq.value.length, vq.value.length); }
    return;
  }
  if (e.target && e.target.id === 'patName'){ PAT_NAME = e.target.value; return; }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-itname')){
    itemRename(e.target.getAttribute('data-itname'), e.target.value);
    return;
  }
  /* بحثُ القوائم الطويلة: كلٌّ يحفظ نصَّه ويُعيد التركيزَ إلى مكانه بعد
     الرسم — وإلا خرج المؤشّرُ من الحقل عند كلِّ حرف. */
  var Q_MAP = { 'data-tkq':'TK_Q', 'data-itq':'IT_Q', 'data-jbq':'JB_Q', 'data-pkq':'SOL_Q', 'data-svaq':'SVA_Q', 'data-regq':'REG_Q' };
  var qk = Object.keys(Q_MAP).filter(function(a){
    return e.target.hasAttribute && e.target.hasAttribute(a); })[0];
  if (qk){
    var id3 = e.target.id, v3 = e.target.value.trim();
    if (Q_MAP[qk] === 'TK_Q') TK_Q = v3;
    else if (Q_MAP[qk] === 'IT_Q') IT_Q = v3;
    else if (Q_MAP[qk] === 'SOL_Q') SOL_Q = v3;
    else if (Q_MAP[qk] === 'SVA_Q') SVA_Q = v3;
    else if (Q_MAP[qk] === 'REG_Q') REG_Q = v3;
    else JB_Q = v3;
    render(1);
    var el3 = document.getElementById(id3);
    if (el3){ el3.focus(); el3.setSelectionRange(el3.value.length, el3.value.length); }
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-coq')){
    CO_Q = e.target.value.trim();
    render(1);
    var cq = document.getElementById('coQ');
    if (cq){ cq.focus(); cq.setSelectionRange(cq.value.length, cq.value.length); }
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-evf')){
    EVF[e.target.getAttribute('data-evf')] = e.target.value; render(1); return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-nmen')){
    var k = e.target.getAttribute('data-nmen'), v = e.target.value.trim();
    CFG.nameEn = CFG.nameEn || {};
    if (v) CFG.nameEn[k] = v; else delete CFG.nameEn[k];
    CORE.set('cfg', 'nameEn', CFG.nameEn);
    return;
  }
  if (e.target && e.target.id === 'survQ'){
    SURV_Q = e.target.value; render(1);
    sq = document.getElementById('survQ');
    if (sq){ sq.focus(); sq.setSelectionRange(sq.value.length, sq.value.length); }
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-usrq')){
    USR.q = e.target.value; render(1);
    var uq = document.getElementById('usrQ');
    if (uq){ uq.focus(); uq.setSelectionRange(uq.value.length, uq.value.length); }
    return;
  }
  if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-nsq')){
    NS_CO_Q = e.target.value;
    render(1);
    var q2 = document.getElementById('nsCoQ');   /* (V36.1) كان إعلانُه في كتلة المساعد التي لم تعد تحتاجه */
    if (q2){ q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }
    return;
  }
  var el = e.target;
  if (!el || !el.hasAttribute || !el.hasAttribute('data-cfg')) return;
  cfgSet(el.getAttribute('data-cfg'), el.getAttribute('data-cfgk'), el.value);
});

document.addEventListener('change', function(e){
  var el = e.target;
  /* «من كانت معه سيارةٌ في يومٍ بعينه»: الحقلان كانا يُرسَمان بقيمتهما
     ويُقرآن في الجدول — ولا شيءَ يكتبهما. فيكتب المرءُ تاريخًا فلا يتغيّر
     شيءٌ ويظنُّ أن لا إسنادَ في ذلك اليوم. أمسكه جردُ الأزرار. */
  if (el && el.hasAttribute && el.hasAttribute('data-vlgd')){
    VLOG_D = el.value || ''; render(1); return;
  }
  /* (V38.80) the database-cost period: editing either date keeps the other end of the period shown */
  if (el && el.hasAttribute && (el.hasAttribute('data-ucf') || el.hasAttribute('data-uct'))){
    if (typeof costRange !== 'function') return;   /* (V38.90) the cost card ships with the office chunk */
    var urg = USAGE.costF.r === 'custom' ? [USAGE.costF.from, USAGE.costF.to] : costRange(USAGE.costF.r);
    USAGE.costF.r = 'custom'; USAGE.costF.from = urg[0]; USAGE.costF.to = urg[1];
    if (el.hasAttribute('data-ucf')) USAGE.costF.from = el.value || ''; else USAGE.costF.to = el.value || '';
    render(1); return;
  }
  if (el && el.hasAttribute && el.hasAttribute('data-mld')){
    mileDateSet(el.getAttribute('data-mld'), el.value || ''); render(); return;
  }
  if (el && el.hasAttribute && el.hasAttribute('data-cfgdate')){
    var dv = el.value ? Date.parse(el.value) : 0;
    cfgSet(el.getAttribute('data-cfgdate'), null, isFinite(dv) ? dv : 0);
    render(); return;
  }
  if (!el || !el.hasAttribute || !el.hasAttribute('data-cfg')) return;
  cfgSet(el.getAttribute('data-cfg'), el.getAttribute('data-cfgk'), el.value);
  var path = el.getAttribute('data-cfg'), key = el.getAttribute('data-cfgk');
  render();                                   /* ينتشر الأثر في كل ما بُني فوقه */
  var back = document.querySelector('[data-cfg="' + path + '"]'
    + (key ? '[data-cfgk="' + CSS.escape(key) + '"]' : ':not([data-cfgk])'));
  if (back){ back.focus(); try{ back.select(); }catch(err){} }
});

/* مزامنةٌ دوريةٌ فارقية — كلُّ دقيقتين، ولا تعمل والتطبيق مخفيّ */
/* الرفعُ كلَّ دقيقتين — رخيصٌ ولا يُقرأ فيه شيء. والسحبُ أندرُ لأنه هو الذي
   يُحاسَب: المكتبُ كلَّ خمسِ دقائق، والميدانُ كلَّ ربعِ ساعةٍ ولا يسحب إلا
   ما كتبه هو. */
/* كانت هنا دورةٌ ثانيةٌ كلَّ دقيقتين توازي عدّادَ الرأس — صارت الدورةُ واحدةً:
   العدّادُ (syncCycle) يدفع كلَّ دقيقةٍ ويسحب حين يحين موعدُ النطاق */

/* الهروبُ يغلق ما هو مفتوح، الأحدثَ فالأقدم */
document.addEventListener('keydown', function(e){
  /* Ctrl+F يفتح بحثَ الصفحة — وهو أنفعُ هنا من بحث المتصفّح (V17.23) */
  if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')){
    var q = document.getElementById('pgQ');
    if (q){ e.preventDefault(); q.focus(); q.select(); return; }
  }
  if (e.key !== 'Escape') return;
  /* أوضاعُ الرسم أوّلًا: هي التي تحجز الضغطةَ التالية (V17.53) */
  if (typeof PIN_ON !== 'undefined' && PIN_ON){ pinCancel(); return; }
  if (typeof ROUTE === 'object' && ROUTE.on){ routeCancel(); return; }
  if (QUEUE_OPEN){ QUEUE_OPEN = false; render(1); return; }
  if (ASSIST_OPEN){ ASSIST_OPEN = false; render(1); return; }
  if (HELP_OPEN){ HELP_OPEN = false; render(1); return; }
  if (POP_OPEN){ POP_OPEN = false; render(1); return; }
  if (ASN_OPEN){ ASN_OPEN = false; render(1); return; }
  if (MAP_FILT_OPEN){ MAP_FILT_OPEN = false; render(1); return; }
  if (CO_OPEN){ CO_OPEN = false; render(1); return; }
  if (EXP_OPEN){ EXP_OPEN = false; render(1); return; }
  if (document.body.classList.contains('nav-open')){ document.body.classList.remove('nav-open'); return; }
});

/* سحبةٌ أفقيةٌ على القائمة تغلقها — كما تُغلَق الأدراج */
(function(){
  var x0 = 0, y0 = 0, on = false;
  var sb = document.querySelector('.sidebar');
  if (!sb) return;
  sb.addEventListener('touchstart', function(e){
    if (!document.body.classList.contains('nav-open')) return;
    var t = e.touches[0];
    x0 = t.clientX; y0 = t.clientY; on = true;
  }, { passive:true });
  sb.addEventListener('touchend', function(e){
    if (!on) return;
    on = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
    var rtl = document.documentElement.dir === 'rtl';
    /* في العربية القائمةُ يمينًا فتُغلَق بسحبٍ يمينًا، وفي الإنجليزية العكس */
    if ((rtl && dx > 0) || (!rtl && dx < 0)) document.body.classList.remove('nav-open');
  }, { passive:true });
})();

/* ═══ استقرارُ القياس على iOS ═══
   سفاري يرسم الصفحةَ ثم يتقلّص شريطُه فيتغيّر ارتفاعُ النافذة بعد أول رسمة.
   فتُحسَب الخريطةُ بارتفاعٍ ليس ارتفاعَها، وتظهر الشرائحُ مقصوصةً — ثم يخرج
   المستخدمُ ويعود فتُعاد الرسمةُ صحيحةً. والخروجُ والعودةُ ليسا حلًّا.

   `visualViewport` هو ما يتغيّر فعلًا في iOS لا `window` — فيُستمَع إليه.
   ويُعاد القياسُ عند العودة من الخلفية (`pageshow`) وعند دوران الجهاز،
   وبعد أول رسمةٍ بلحظاتٍ ليستقرَّ الشريط. */
/* ═══ (V36.1) بلاغُ المالك: «البحث في المساعد بيسكرول لفوق وتحت لوحده» ═══
   كانت نافذةُ المساعد جزءًا من كلِّ رسمة — فأيُّ رسمٍ في الخلفية (وصولُ بيانات، مزامنة، تنزيل) يستبدلها وفيها الحقلُ الذي يكتب فيه
   المستخدم: تضيع البؤرة، ويعيد الآيفون حسابَ لوحة المفاتيح فتقفز الشاشة. صارت في حاويةٍ ثابتةٍ خارج الرسم: تُبنى مرةً عند الفتح،
   وتُزال عند الإغلاق، ولا يمسّها رسمٌ آخر؛ والكتابةُ تستبدل النتائجَ وحدَها. */
/* (V37.8) اقتراحُ المالك: على جهاز الفنيّ — صورٌ معلّقةٌ أكثرَ من ساعة تُقال بشريطٍ ثابتٍ أعلى الشاشة في كلِّ صفحة (والخريطةُ معها)،
   بزرِّ «ارفع الآن». الصورُ التي ضاعت (١١٢ في عرفات) كانت على جهازين ولم تُرفع — والشريطُ يقولها قبل أن تضيع. */


function liteSync(){
  var old = document.getElementById('liteBar'); if (!LITE){ if (old) old.remove(); return; }
  if (old) return;
  var d = document.createElement('div'); d.id = 'liteBar'; d.setAttribute('role', 'status');
  d.style.cssText = 'position:fixed;inset-inline:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 8px);z-index:1900;background:#2C3E50;color:#fff;border-radius:12px;padding:8px 12px;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.35)';
  d.innerHTML = '\u{1FA99} ' + esc(t('الوضعُ الخفيف: التطبيقُ وقع مرتين فعمل بلا خريطةٍ مجسَّمة ولا فهرسِ صور.')) + ' <button type="button" class="btn btn-quiet btn-sm" data-liteoff="1" style="color:#fff">' + esc(t('الوضع الكامل')) + '</button>';
  document.body.appendChild(d);
}
function qStaleSync(){   /* (V37.29) البندُ ١ — الفنيُّ يعرف بنفسه قبل أن يُسأل */
  var old = document.getElementById('qStaleBar'), now = Date.now();
  var Q = (STATE.queue || []).filter(function(it){ return it && it.kind !== 'presence' && it.kind !== 'stats'; });
  var oldest = Q.reduce(function(a, it){ return Math.min(a, +it.at || now); }, now), bad = typeof IDB_WHY !== 'undefined' && IDB_WHY;
  var show = STATE.meta.online && ((Q.length && now - oldest > 3600000) || bad) && !(qStaleSync.snooze && now < qStaleSync.snooze);
  if (!show){ if (old) old.remove(); return; }
  if (old) return;
  var d = document.createElement('div'); d.id = 'qStaleBar'; d.setAttribute('role', 'alert');
  d.style.cssText = 'position:fixed;inset-inline:8px;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:1950;background:#7A4A00;color:#fff;border-radius:12px;padding:8px 12px;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.35)';
  d.innerHTML = '\u26A0 ' + esc(bad ? t('مخزن الجهاز فيه مشكلة — ارفع ما عليه ثم أعد ضبط التطبيق.') : nm(Q.length) + ' ' + t('كتابة لم تُرفع من أكثر من ساعة.'))
    + ' <button type="button" class="btn btn-quiet btn-sm" data-syncall="1" style="color:#fff">' + esc(t('زامِن الآن')) + '</button>'
    + (bad ? ' <button type="button" class="btn btn-quiet btn-sm" data-appreset="1" style="color:#fff">' + esc(t('إعادة ضبط التطبيق')) + '</button>' : '')
    + ' <button type="button" class="btn btn-quiet btn-sm" data-qstalex="1" style="color:#fff" aria-label="' + esc(t('إغلاق')) + '">\u2715</button>';
  document.body.appendChild(d);
}
function phStaleSync(){
  var old = document.getElementById('phStale'), mins = phQueueAge(), n = (typeof PHOTO_Q === 'object' && PHOTO_Q) ? PHOTO_Q.length : 0;
  if (!n || mins < 60 || Date.now() < (phStaleSync.snooze || 0)){ if (old) old.remove(); return; }
  var html = '\u26A0 ' + esc(t('عندك')) + ' <b>' + nm(n) + '</b> ' + esc(t('صورة لم تُرفع منذ')) + ' ' + nm(Math.floor(mins / 60)) + ' ' + esc(t('ساعة')) + ' — '
    + esc(STATE.meta.online ? t('اترك التطبيق مفتوحًا على الشبكة حتى تُرفع') : t('افتح الشبكة الآن — الصورُ على جهازك وحده'))
    + ' <button type="button" class="btn btn-primary btn-sm" data-phflushnow="1">\u2B06 ' + esc(t('ارفع الآن')) + '</button>'
    + ' <button type="button" class="btn btn-quiet btn-sm" data-phstalex="1" aria-label="' + esc(t('إغلاق')) + '" style="color:#fff">\u2715</button>';   /* (V37.13) يُؤجَّل نصفَ ساعة */
  if (!old){ old = document.createElement('div'); old.id = 'phStale'; old.setAttribute('role', 'alert'); old.style.cssText = 'position:fixed;inset-inline:8px;top:calc(env(safe-area-inset-top,0px) + 6px);z-index:1900;background:#B8860B;color:#fff;border-radius:12px;padding:8px 12px;font-size:13.5px;box-shadow:0 6px 20px rgba(0,0,0,.35)'; document.body.appendChild(old); }
  if (old.innerHTML !== html) old.innerHTML = html;
}
function assistSync(){
  var host = document.getElementById('assistHost');
  if (!host){ if (!ASSIST_OPEN) return; host = document.createElement('div'); host.id = 'assistHost'; document.body.appendChild(host); }
  if (!ASSIST_OPEN){ if (host.innerHTML) host.innerHTML = ''; return; }
  if (!document.getElementById('assistPop')) host.innerHTML = assistHtml();
}
function reflow(){
  try {
    document.documentElement.style.setProperty('--vh',
      ((window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01) + 'px');
    /* (V36.1) ارتفاعُ لوحة المفاتيح على الآيفون: الورقةُ السفلية (المساعد، النوافذ) تجلس فوقها لا تحتها */
    var vv = window.visualViewport, kb = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
    document.documentElement.style.setProperty('--kb', (kb > 60 ? kb : 0) + 'px');
  } catch (e){ LS_ERR = e; }
  if (CUR === 'map'){
    if (typeof mapDraw === 'function') mapDraw();
    if (typeof MAP !== 'undefined' && MAP){
      try { MAP.invalidateSize(); } catch (e){ LS_ERR = e; }
    }
  }
}
var REFLOW_T = null;
function reflowSoon(){ clearTimeout(REFLOW_T); REFLOW_T = setTimeout(reflow, 80); }

window.addEventListener('resize', reflowSoon, { passive:true });
window.addEventListener('orientationchange', function(){ setTimeout(reflow, 250); }, { passive:true });
window.addEventListener('pageshow', reflowSoon, { passive:true });
if (window.visualViewport){
  window.visualViewport.addEventListener('resize', reflowSoon, { passive:true });
  window.visualViewport.addEventListener('scroll', reflowSoon, { passive:true });
}
/* الرسمةُ الأولى: يستقرُّ شريطُ المتصفّح بعد جزءٍ من الثانية */
[120, 400, 900].forEach(function(ms){ setTimeout(reflow, ms); });

/* `--vh` يُضبَط قبل أول رسمة: القياسُ في `reflow` يقع بعد الرسم، فالاحتياطُ
   يحتاج قيمةً موجودةً من اللحظة الأولى. */
(function(){
  try {
    document.documentElement.style.setProperty('--vh',
      ((window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01) + 'px');
  } catch (e){ LS_ERR = e; }
})();

(function boot(){
  var th = 'light', lg = 'ar';
  try{ th = localStorage.getItem('nsk14.theme') || 'light'; lg = localStorage.getItem('nsk14.lang') || 'ar'; }catch(e){}
  setTheme(th);
  try { var sk0 = localStorage.getItem('nsk14.skin') || ''; document.documentElement.setAttribute('data-skin', sk0 === 'brand' ? 'brand' : 'ops'); if (sk0 !== 'brand' && typeof setTheme === 'function' && document.documentElement.getAttribute('data-theme') !== 'dark') setTheme('dark'); } catch (eSk){ LS_ERR = eSk; }   /* (V37.73) الافتراضيُّ غرفةُ التحكم */   /* (V37.33) */
  LANG = I18N[lg] ? lg : 'ar';
  document.documentElement.lang = LANG;
  try { shellLang(); } catch(e){}
  document.documentElement.dir  = I18N[LANG].dir;
  document.body.setAttribute('data-lang', LANG);

  document.getElementById('langSel').value  = LANG;
  document.getElementById('langSel').onchange = function(){ setLang(this.value); };
  langSync();
  /* الشريطُ العلويّ: قائمةُ لغاتٍ تُبنى من `I18N` فلا تُكتَب اللغاتُ مرتين
     ولا تُنسى واحدةٌ إن أُضيفت رابعة. */
  function langPaint(){
    var mn = document.getElementById('langMenu');
    if (!mn) return;
    mn.innerHTML = Object.keys(I18N).map(function(k){
      return '<button type="button" data-setlang="' + k + '" role="option"'
        + ' aria-selected="' + (LANG === k ? 'true' : 'false') + '">'
        + '<span>' + esc(I18N[k].name) + '</span>'
        + '<span class="lg-code">' + esc(k.toUpperCase()) + '</span></button>';
    }).join('');
  }
  function langMenu(open){
    var mn = document.getElementById('langMenu'), bt = document.getElementById('langTop');
    if (!mn || !bt) return;
    if (open){ langPaint(); langSync(); }
    mn.hidden = !open;
    bt.setAttribute('aria-expanded', open ? 'true' : 'false');
    /* (V21.8) «ع لا تعمل من فوق»: القائمةُ كانت تُفتَح فعلًا، لكنّ الرأسَ على الهاتف
       (overflow-x:hidden يجعل الرأسيَّ auto) يقصّ كلَّ ما ينزل تحته — فلا يُرى منها شيء.
       صارت تُنقَل إلى الجسد وتُثبَّت تحت الحرف بإحداثيّاته، فوق الخريطة وكلِّ شيء. */
    if (open){
      try {
        if (mn.parentNode !== document.body) document.body.appendChild(mn);
        var r = bt.getBoundingClientRect(), vw = window.innerWidth || document.documentElement.clientWidth || 360;
        mn.style.position = 'fixed'; mn.style.insetInlineEnd = 'auto'; mn.style.right = 'auto';
        mn.style.top = Math.round(r.bottom + 6) + 'px';
        var mw = mn.offsetWidth || 172;
        mn.style.left = Math.round(Math.max(8, Math.min(r.right - mw, vw - mw - 8))) + 'px';
      } catch (e){ LS_ERR = e; }
    }
  }
  document.addEventListener('click', function(e){
    try { boxAction(e); } catch (e0){ BOX_ERR = e0; }   /* الصندوقُ الأسود: معرِّفُ الفعل (V17.98) */
    var op = e.target.closest('[data-langmenu]');
    if (op){ langMenu(document.getElementById('langMenu').hidden); return; }
    var pick = e.target.closest('[data-setlang]');
    if (pick){ setLang(pick.getAttribute('data-setlang')); langMenu(false); return; }
    if (!e.target.closest('.lang-pick')) langMenu(false);
  });
  var tt = document.getElementById('themeTop');
  if (tt) tt.onclick = function(){
    /* (V21.8) زرٌّ واحدٌ بدل زرّين متجاورين: داكن ← فاتح ← الشمس ← داكن */
    var cur = document.documentElement.getAttribute('data-theme');
    if (SUN_ON){ sunSet(false); setTheme('dark'); toast(t('المظهر: داكن')); }
    else if (cur !== 'light'){ setTheme('light'); toast(t('المظهر: فاتح')); }
    else { sunSet(true); toast(t('المظهر: وضع الشمس — للشاشة تحت الشمس')); }
    themeIcon();
    render(1);
  };
  themeIcon();

  document.getElementById('themeBtn').onclick = function(){
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  };
  loadSites();
  manifestInject();
  i18nThen(loginPaint);   /* (V22.0) بلغةٍ غيرِ العربية تُرسَم شاشةُ الدخول بعد وصول قاموسها */
  bootAuto();
  watchNet();
  pwaWatch();
  swInstall();
  posWatch();
  CORE.loadLocal().then(function(){
    if (!document.getElementById('login')) render();   /* إن كان دخل بالفعل */
    syncBadge();
  }).catch(function(e){
    /* تعذُّرُ قراءة المحليِّ يعني بدءًا من فراغٍ ومعه ما لم يُرفَع بعد */
    softErr('قراءة البيانات المحلية', e, 'تعذّرت قراءةُ البيانات المحفوظة على الجهاز');
  });
})();

(function(){var s=document.createElement('style');s.textContent=LOGIN_CSS;document.head.appendChild(s);})();
/* (V37.40) رجوعُ المساعد: الزرُّ وزرُّ الرجوع في الهاتف — من سؤالٍ إلى صفحته الرئيسية، ومنها إلى الإغلاق */
function assistGoHome(){ ASSIST_Q = ''; var inp = document.getElementById('assistQ'); if (inp){ inp.value = ''; } var rs = document.getElementById('assistRes'); if (rs) rs.innerHTML = assistResHtml(); var bk = document.getElementById('assistBack'); if (bk) bk.hidden = true; }
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('popstate', function(){
  if (typeof ASSIST_OPEN === 'undefined' || !ASSIST_OPEN) return;
  if (ASSIST_Q){ assistGoHome(); try { history.pushState({ assist:1 }, ''); } catch (e){ LS_ERR = e; } }
  else { ASSIST_OPEN = false; try { render(1); } catch (e){ LS_ERR = e; } }
});
