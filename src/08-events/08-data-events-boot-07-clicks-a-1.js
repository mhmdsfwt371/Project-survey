/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-07-clicks-a-1.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Delegated click handlers, group A part 1 (return true when the event is consumed).
   DEFINES : clickA, clickAPart1, clickAPart2
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ نقراتٌ منقولةٌ من onDocClick لتبقى تحت الحدّ — ترجع true إن التقطت الحدث ═══ */
function clickA(e){
  /* (V33.0) كان ٦٦٥ سطرًا؛ صار أجزاءً بالترتيب نفسِه — يُرجَع ما أرجعه الجزءُ الذي عالج النقرة */
  var r;
  if ((r = clickAPart1(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart2(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart3(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart4(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart5(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart6(e)) !== CLICK_NEXT) return r;
  if ((r = clickAPart7(e)) !== CLICK_NEXT) return r;
}
/* clickA — الجزء 1 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: assist، p، navtab، gt، g، open، nav، mode، pop، bst، bfsave، pq، help، exp، apick، asn، co، cofilt، comode، mfilt */
function clickAPart1(e){
  var asb = e.target.closest('[data-assist]');
  if (asb){ try { if (asb.getAttribute('data-assist') === '1') history.pushState({ assist:1 }, ''); } catch (eH){ LS_ERR = eH; }   /* (V37.40) زرُّ رجوع الهاتف يرجع داخل المساعد */ var tpx = document.getElementById('assistTip'); if (tpx) tpx.remove();   /* (V37.30) */
    if (asb.hasAttribute('data-p')){ ASSIST_OPEN = false; }
    else { ASSIST_OPEN = asb.getAttribute('data-assist') === '1'; render(1); return true; }
  }
  var a = e.target.closest('[data-p]');
  if (a){
    e.preventDefault();
    navPush(CUR);
    /* شريحةٌ من البحث (V19.0): معرِّفُ الشريحة نفسُه — والرسمُ يوصله إلى أمِّه على شريحته */
    goPage(a.getAttribute('data-navtab') || a.getAttribute('data-p'));
    NAV_Q = '';
    document.body.classList.remove('nav-open');
    render();
    return true;
  }
  var g = e.target.closest('[data-gt]');
  if (g){
    var sec = g.closest('.nav-section');
    var key = sec.getAttribute('data-g');
    var open = sec.getAttribute('data-open') !== 'false';
    OPEN[key] = !open;
    sec.setAttribute('data-open', open ? 'false' : 'true');
    g.setAttribute('aria-expanded', open ? 'false' : 'true');
    return true;
  }
  if (e.target.closest('[data-nav]')){
    /* (V23.9) «زرار أضغط عليه يعمل collapse للموديولز»: على الشاشة الكبيرة يُطوى الشريطُ الجانبيُّ ويتّسع المحتوى،
       ويُحفَظ الاختيار؛ وعلى الهاتف يبقى الدرجَ المنزلق كما كان */
    if (typeof window.matchMedia === 'function' && window.matchMedia('(min-width:901px)').matches){
      var off = !document.body.classList.contains('side-off');
      document.body.classList.toggle('side-off', off);
      lsSet('nsk14.sideoff', off ? '1' : '');
      if (off && NAV_Q){ NAV_Q = ''; render(1); }   /* (V24.0) الشريطُ بلا بحث — فلا يبقى مرشَّحًا بكلمةٍ لا تُرى */
      var bg = e.target.closest('[data-nav]'); bg.setAttribute('aria-expanded', off ? 'false' : 'true');
      setTimeout(function(){ try { if (typeof MAP !== 'undefined' && MAP && MAP.invalidateSize) MAP.invalidateSize(); if (typeof M3 !== 'undefined' && M3 && M3.resize) M3.resize(); } catch (e2){ LS_ERR = e2; } }, 260);
    } else document.body.classList.toggle('nav-open');
    return true;
  }
  var m = e.target.closest('[data-mode]');
  if (m){
    /* (V28.5) ملاحظةُ «تحديثات المنصة»: «التفاصيل المختصرة» حين تُفعَّل لا تُغلق — صارت الضغطةُ الثانيةُ عليها تُعيد الطبقةَ السابقة */
    var nmode = m.getAttribute('data-mode');
    if (nmode === 'brief' && FIELD_MODE === 'brief') nmode = (typeof FIELD_PREV === 'string' && FIELD_PREV && FIELD_PREV !== 'brief') ? FIELD_PREV : 'survey';
    else if (nmode === 'brief') FIELD_PREV = FIELD_MODE;
    FIELD_MODE = nmode;
    selClear();
    if (CUR !== 'map' && CUR !== 'layers') CUR = 'map';
    render(1);
    if (MAP) mapPaint();
    return true;
  }

  var pk = e.target.closest('[data-pop]');
  if (pk){ POP_OPEN = pk.getAttribute('data-pop') === '1'; render(); return true; }
  var bst = e.target.closest('[data-bst]');
  if (bst){
    var pr = bst.getAttribute('data-bst').split('|');
    var bi = document.getElementById('bfTxt');
    POP_JUST = Date.now(); briefSet(pr[0], pr[1], bi ? bi.value : null); return true;
  }
  var bfs = e.target.closest('[data-bfsave]');
  if (bfs){
    var bi2 = document.getElementById('bfTxt');
    POP_JUST = Date.now(); briefSet(bfs.getAttribute('data-bfsave'), '', bi2 ? bi2.value : ''); return true;
  }

  /* ═══ كلُّ لوحٍ يُغلَق بنقرةٍ خارجه ═══
     كانت نافذةُ النقطة وحدَها تُغلَق بالنقر خارجها، وسائرُ اللوحات — منتقي
     التصفية والمساعدُ والطابورُ والمساعدةُ والتصديرُ ولوحُ الإسناد ومنتقي
     الشركات — لا تُغلَق إلا بعلامة X. وعلامةُ X في زاويةِ لوحٍ على هاتفٍ
     بيدٍ واحدةٍ إجبارٌ على تصويبٍ لا يلزم: اليدُ تنقر حيث تشاء والمنطقُ
     يفهم. فوُحِّد السلوك: لكلِّ لوحٍ رايتُه ومعرِّفُه وزرُّ فتحه، والنقرةُ
     خارجَ الثلاثة تُغلقه. وأوّلُ ما يُغلَق ما فُتح آخرًا — فلا يُغلَق
     الأسفلُ ويبقى الأعلى. */
  var SHEETS = [
    { on:function(){ return POP_OPEN; },       off:function(){ POP_OPEN = false; },       sel:'#pkPop',           btn:'[data-pop]' },
    { on:function(){ return ASSIST_OPEN; },    off:function(){ ASSIST_OPEN = false; },    sel:'#assistPop',       btn:'[data-assist]' },
    { on:function(){ return QUEUE_OPEN; },     off:function(){ QUEUE_OPEN = false; },     sel:'#queuePop',        btn:'[data-pq]' },
    { on:function(){ return HELP_OPEN; },      off:function(){ HELP_OPEN = false; },      sel:'#helpPop',         btn:'[data-help]' },
    { on:function(){ return EXP_OPEN; },       off:function(){ EXP_OPEN = false; },       sel:'#expPop',          btn:'[data-exp]' },
    { on:function(){ return ASN_PICK; },       off:function(){ ASN_PICK = false; },       sel:'#asnPick',         btn:'[data-apick]' },
    { on:function(){ return ASN_OPEN; },       off:function(){ ASN_OPEN = false; },       sel:'#asnPop',          btn:'[data-asn]' },
    { on:function(){ return CO_OPEN; },        off:function(){ CO_OPEN = false; },        sel:'#coFilt',          btn:'[data-co],[data-cofilt],[data-comode]' },
    { on:function(){ return MAP_FILT_OPEN; },  off:function(){ MAP_FILT_OPEN = false; },  sel:'.map-sheet',       btn:'[data-mfilt]' }
  ];
  /* الحدثُ الذي فتح النافذةَ لا يُغلقها — بهويته، مهما استغرق الرسمُ */
  var justOpened = (POP_EV && POP_EV === e) || (Date.now() - POP_JUST <= 300);
  if (POP_EV && POP_EV !== e) POP_EV = null;
  if (!justOpened){
    for (var si = 0; si < SHEETS.length; si++){
      var sh = SHEETS[si];
      if (!sh.on()) continue;
      if (e.target.closest(sh.sel)) break;          /* النقرُ داخله شأنُه */
      if (sh.btn && e.target.closest(sh.btn)) break; /* وزرُّه يتولّاه بنفسه */
      sh.off(); render(); return true;
    }
  }
  return CLICK_NEXT;
}
/* clickA — الجزء 2 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: print، sel، boxcopy، briefcopy، svlist، svpopclose، svpopxls، expscope، expselgo، mfuexp، chaltask، wpwk، wpdo، wpact، wpcancel، wpedit، wpsave، wpdel، wpnext، wptask */
function clickAPart2(e){
    if (CUR === 'map' && e.target.closest('.mapcanvas')){ POP_OPEN = true; render(); return true; }

  if (e.target.closest('[data-print]')){ try{ window.print(); }catch (err){ LS_ERR = err; } return true; }

  var b = e.target.closest('.btn, .chip');
  if (b && !b.closest('#nav') && !b.hasAttribute('href')){
    /* كانت هذه قائمةً مكتوبةً بيدٍ من مئةٍ وعشر خصائص، وكلُّ زرٍّ جديدٍ يحتاج
       إضافةً إليها. ومن نسي — ونُسيت مرتين: منتقي الشركات وحالةُ الوصول —
       صار زرُّه يُنقَر فيبتلعه هذا الحارسُ نفسُه ولا يقع شيء.
       فصارت تُشتقُّ من نصِّ المستمع: من ربط معالجًا فقد سجّل خاصيتَه. */
    var acts = actList();
    var wired = !acts || acts.some(function(a){ return b.hasAttribute(a); });
    if (!wired){
      if (b.classList.contains('chip') && !b.closest('.map-top')){
        b.classList.toggle('on');   /* الشرائح اختيارٌ فعلي لا رسالة */
        return true;
      }
      toast(b.textContent.trim());
      return true;
    }
  }

  var sc = e.target.closest('[data-sel]');
  if (sc){
    var sid = sc.getAttribute('data-sel');
    if (!asnOf(sid)) selToggle(sid);
    render(1);
    return true;
  }
  if (e.target.closest('[data-boxcopy]')){ boxCopy(); return true; }
  if (e.target.closest('[data-briefcopy]')){ try { navigator.clipboard.writeText(mfuBriefText()); toast(t('نُسخ الملخّص')); } catch (er){ toast(t('تعذّر النسخ')); } return true; }   /* (V29.9) */
  var svl = e.target.closest('[data-svlist]');   /* (V29.6) */
  if (svl){ SV_POP = svl.getAttribute('data-svlist'); SV_PHO = ''; SV_VIEW = 'dash'; SV_SHOW = 80; SV_ZF = svl.getAttribute('data-svzone') || ''; SV_SUB = svl.getAttribute('data-svsub0') || ''; SV_STACK = [];   /* (V37.62) مربعُ التبويب يفتح لوحتَه مصفّاةً */   /* (V37.49) بطاقةُ المشعر تفتح لوحتَها مصفّاةً */
    if (KIOSK_ON) kioskCycleStop();   /* الضغطةُ توقف التنقّلَ التلقائي */   /* (V37.14) طلبُ المالك «الويندو بطيئة»: تُدرَج النافذةُ وحدَها بلا رسم الصفحة */
    var hostL = svl.closest('#content') || document.getElementById('content');
    if (hostL){ svPopRemove(); var tmpL = document.createElement('div'); tmpL.innerHTML = (svListPop() + supPopHtml()); while (tmpL.firstChild) hostL.appendChild(tmpL.firstChild); } else render(1);
    return true; }
  if (e.target.closest('[data-svpopclose]')){ SV_PHO = ''; SV_POP = ''; svPopRemove(); return true; }   /* (V37.14) بلا رسم */
  var phd = e.target.closest('[data-phdel]');   /* (V37.17) حذفُ صورةٍ مرفوعة: تختفي من التطبيق والتقارير ويبقى ملفُّها على الدرايف */
  if (phd){ var pid1 = phd.getAttribute('data-phdel'), pp = (STATE.photos || {})[pid1];
    if (pp && window.confirm(t('حذف هذه الصورة؟ تختفي من التطبيق والتقارير عند الجميع، ويبقى ملفُّها على الدرايف.'))){
      var dv = { by:STATE.meta.name || '', at:Date.now(), why:t('رُفعت خطأً') }; pp.del = dv; phTouch(); CORE.set('photos', pid1, { del:dv }); logEvent('حذفُ صورة — ' + (pp.site || '') + ' \u00b7 ' + (pp.kind || ''), pp.site || ''); statBump(); toast(t('حُذفت الصورة'));
      var bx1 = document.getElementById('svPhoBox'); if (bx1 && SV_PHO){ var host1 = bx1.parentNode; ['svPhoVeil', 'svPhoBox'].forEach(function(i0){ var e0 = document.getElementById(i0); if (e0) e0.remove(); }); var tm1 = document.createElement('div'); tm1.innerHTML = svPhoPanel(SV_PHO); while (tm1.firstChild) host1.appendChild(tm1.firstChild); } else render(1); }
    return true; }
  var phc = e.target.closest('[data-phclear]');   /* (V37.16) طلبُ المالك: حذفُ صورةٍ التُقطت خطأً قبل الحفظ */
  if (phc){ var pk = phc.getAttribute('data-phclear'); if (FORM && FORM.photos && FORM.photos[pk]){ delete FORM.photos[pk]; if (typeof SVD === 'object') SVD.dirty = true; if (typeof svDraftSave === 'function') svDraftSave(); toast(t('حُذفت الصورة — اختر غيرها')); render(1); } return true; }
  if (e.target.closest('[data-svmore]')){ SV_SHOW += 80; toast(t('عُرضت ٨٠ أخرى')); var bxM = document.querySelector('.svpop[data-keepscroll^="svpop:"]'), topM = bxM ? bxM.scrollTop : 0, hostM = (bxM && bxM.parentNode) || document.getElementById('content');   /* (V37.27) دفعةٌ أخرى في مكانها */
    if (hostM){ svPopRemove(); var tmpM = document.createElement('div'); tmpM.innerHTML = svListPop(); while (tmpM.firstChild) hostM.appendChild(tmpM.firstChild); var nb = document.querySelector('.svpop[data-keepscroll^="svpop:"]'); if (nb) nb.scrollTop = topM; } else render(1); return true; }
  var mwf = e.target.closest('[data-mtwf]');   /* (V37.62) المهامُّ تُصفّى في مكانها */
  if (mwf){ MT_WF = mwf.getAttribute('data-mtwf') || ''; MT_WPOP = !!MT_WF; render(1); return true; }
  if (e.target.closest('[data-mtwclose]')){ MT_WPOP = false; MT_WF = ''; render(1); return true; }
  if (e.target.closest('[data-mtwx]')){ mtWeekXlsx(); return true; }
  var mtx = e.target.closest('[data-mtx]'); if (mtx){ mtTabXlsx(mtx.getAttribute('data-mtx')); return true; }   /* (V37.63) */
  if (e.target.closest('[data-mtcoall]')){ MT_CO_ALL = !MT_CO_ALL; render(1); return true; }
  if (e.target.closest('[data-knnew]')){ knEdAdd(''); render(1); return true; }   /* (V37.74) المشاكل المعروفة */
  var kdl = e.target.closest('[data-kndel]'); if (kdl){ knEdRead(); knEdInit().splice(+kdl.getAttribute('data-kndel'), 1); render(1); return true; }
  if (e.target.closest('[data-kntry]')){ knTry(); return true; }
  if (e.target.closest('[data-hallcopy]')){ hallCopy(); return true; }   /* (V37.74) رابط القاعة */
  var pok = e.target.closest('[data-propok]'); if (pok){ propApprove(pok.getAttribute('data-propok')); return true; }   /* (V37.69) مقترحاتُ الوزارة */
  var pno = e.target.closest('[data-propno]'); if (pno){ propReject(pno.getAttribute('data-propno')); return true; }
  var pgo = e.target.closest('[data-propgo]'); if (pgo){ propGo(pgo.getAttribute('data-propgo')); return true; }
  if (e.target.closest('[data-propclose]')){ PROP_POP = ''; render(1); return true; }
  var psh = e.target.closest('[data-propsheet]'); if (psh){ PROP_SHEET = psh.getAttribute('data-propsheet') === '1'; PROP_POP = ''; render(1); return true; }
  var csp = e.target.closest('[data-campsplit]'); if (csp){ splitStart(csp.getAttribute('data-campsplit')); return true; }   /* (V37.67) قسّم المخيم */
  var spn = e.target.closest('[data-splitn]'); if (spn){ splitN(+spn.getAttribute('data-splitn')); return true; }
  if (e.target.closest('[data-splitsave]')){ splitSave(); return true; }
  if (e.target.closest('[data-splitcancel]')){ SPLIT = null; render(1); if (typeof mapPaint === 'function') mapPaint(); return true; }
  var ssb = e.target.closest('[data-svsub]');   /* (V37.58) مربعٌ في اللوحة يُضغط: نافذتُه بلوحتها وإكسلها */
  if (ssb){ var sv0 = ssb.getAttribute('data-svsub') || ''; if (SV_SUB === sv0) return true; SV_STACK.push({ sub:SV_SUB, zf:SV_ZF }); SV_SUB = sv0; svPopRefresh(); return true; }
  var szf = e.target.closest('[data-svzf]');   /* (V37.45) */
  if (e.target.closest('[data-svback]')){ var prv = SV_STACK.pop(); if (prv){ SV_SUB = prv.sub; SV_ZF = prv.zf; } svPopRefresh(); return true; }   /* (V37.59) */
  if (szf){ if ((szf.getAttribute('data-svzf') || '') !== SV_ZF) SV_STACK.push({ sub:SV_SUB, zf:SV_ZF }); SV_ZF = szf.getAttribute('data-svzf') || ''; svPopRefresh(); return true; }
  if (e.target.closest('[data-svprint]')){ document.documentElement.classList.add('print-pop'); setTimeout(function(){ try { window.print(); } catch (ePr){ LS_ERR = ePr; } setTimeout(function(){ document.documentElement.classList.remove('print-pop'); }, 500); }, 60); return true; }
  var svv = e.target.closest('[data-svview]');   /* (V37.16) اللوحة أو القائمة — في مكانها */
  if (svv){ SV_VIEW = svv.getAttribute('data-svview') === 'list' ? 'list' : 'dash'; var hostV = svv.closest('#content') || document.getElementById('content');
    if (hostV){ svPopRemove(); var tmpV = document.createElement('div'); tmpV.innerHTML = svListPop(); while (tmpV.firstChild) hostV.appendChild(tmpV.firstChild); } else render(1); return true; }
  var svx = e.target.closest('[data-svpopxls]'); if (svx){ svListXlsx(svx.getAttribute('data-svpopxls')); return true; }
  var exs = e.target.closest('[data-expscope]');   /* (V29.0) */
  if (exs){ EXP.scope.m = exs.getAttribute('data-expscope'); render(1); return true; }
  if (e.target.closest('[data-expselgo]')){ goPage('map'); MAP_SELECT = true; render(1); toast(t('اضغط النقاطَ لتحديدها ثم ارجع إلى التصدير')); return true; }
  if (e.target.closest('[data-execxls]')){ execXlsx(); return true; }   /* (V37.46) */
  if (e.target.closest('[data-mfuexp]')){ var ids0 = expScopeIds(); if (ids0 && !ids0.length){ toast(t('النطاقُ بلا نقاط — اختر مشعرًا أو حدِّد نقاطًا')); return true; }
    var fx = e.target.closest('[data-mfuexp]').getAttribute('data-mfuexp'); if (fx === 'xlsx') mfuXlsx(); else if (fx === 'pdf') mfuPdf(); else if (fx === 'pptx') mfuPptx(); else mfuDocx(); return true; }
  if (e.target.closest('[data-chaltask]')){
    var ck = e.target.closest('[data-chaltask]').getAttribute('data-chaltask'), cc = mfuAllChal().filter(function(x){ return x.key === ck; })[0];
    if (!cc) return true;
    var due = (cc.due && /^\d{4}-\d{2}-\d{2}$/.test(cc.due)) ? cc.due : dayKey(Date.now() + 7 * 864e5);   /* (V26.6) آخرُ تاريخٍ للمعالجة إن حُدِّد */
    if (wtAdd({ n:'معالجة: ' + t(cc.t), who:cc.owner || '', track:'التحديات', due:due, chal:ck, d:cc.desc || '', upd:cc.m || '' })){
      var tid = STATE.wtask.lastId;
      if (cc.src === 'field'){ var cf2 = Object.assign({}, (mfuData().fch || {})[cc.t] || {}); cf2.task = tid; cf2.at = Date.now(); cf2.hist = mfuHist(cf2, 'task', '#' + tid); mfuPut('fch', cc.t, cf2); }
      else if (cc.src === 'manual'){ var mc2 = mfuList('chal').filter(function(x){ return x.id === cc.id; })[0]; if (mc2){ var mn2 = Object.assign({}, mc2); delete mn2.id; mn2.task = tid; mn2.hist = mfuHist(mc2, 'task', '#' + tid); mfuPut('chal', cc.id, mn2); } }
      toast(t('أُنشئت مهمةُ المعالجة في المهام الأسبوعية')); render(1);
    }
    return true;
  }
  if (e.target.closest('[data-wpwk]')){ WPLAN_WK = e.target.closest('[data-wpwk]').getAttribute('data-wpwk'); WPLAN_EDIT = ''; WPLAN_ACT = null; WPLAN_PREFILL = null; render(1); return true; }
  if (e.target.closest('[data-wpdo]')){ var dp = e.target.closest('[data-wpdo]').getAttribute('data-wpdo').split('|'); WPLAN_ACT = { id:dp[0], kind:dp[1] }; render(1); setTimeout(function(){ var ta = document.getElementById('wpAct'); if (ta){ try { ta.focus(); } catch (e2){ LS_ERR = e2; } } }, 30); return true; }
  if (e.target.closest('[data-wpact]')){
    var ap = e.target.closest('[data-wpact]').getAttribute('data-wpact').split('|');
    if (ap[1] === 'cancel'){ WPLAN_ACT = null; render(1); return true; }
    var ax = pmoList('wplan').filter(function(x){ return x.id === ap[0]; })[0]; if (!ax || !wplanMay()) return true;
    var txt = pmoVal('wpAct'); if (!txt){ toast(t(ap[1] === 'result' ? 'اكتب النتيجة الفعلية' : ap[1] === 'upd' ? 'اكتب التحديث' : 'اكتب سبب الإغلاق')); return true; }
    var an = Object.assign({}, ax); delete an.id; an.at = Date.now();
    if (ap[1] === 'result'){ an.result = txt; an.st = 'تم'; an.hist = mfuHist(ax, 'result', txt); }
    else if (ap[1] === 'upd'){ an.st = 'بانتظار تجارب'; an.hist = mfuHist(ax, 'upd', txt); }
    else { an.closeWhy = txt; an.st = 'مغلق'; an.hist = mfuHist(ax, 'close', txt); var mk = document.getElementById('wpActNew'); if (mk && mk.checked){ WPLAN_PREFILL = { t:'', pri:ax.pri || 'متوسطة', n:t('بدلًا من') + ': ' + (ax.t || ''), steps:'', needs:ax.needs || '', goal:ax.goal || '' }; WPLAN_WK = mfuWeekKey(); } }
    WPLAN_ACT = null;
    if (pmoPut('wplan', ap[0], an)){ toast(t(ap[1] === 'result' ? 'تمّت بنتيجتها' : ap[1] === 'upd' ? 'سُجّل التحديث — بانتظار تجارب أخرى' : 'أُغلقت')); render(1); if (WPLAN_PREFILL) setTimeout(function(){ var el = document.getElementById('wpT'); if (el && el.scrollIntoView) el.scrollIntoView({ block:'center' }); }, 30); }
    return true;
  }
  if (e.target.closest('[data-wpcancel]')){ WPLAN_EDIT = ''; WPLAN_PREFILL = null; render(1); return true; }
  if (e.target.closest('[data-wpedit]')){ WPLAN_EDIT = e.target.closest('[data-wpedit]').getAttribute('data-wpedit'); render(1); setTimeout(function(){ var el = document.getElementById('wpT'); if (el && el.scrollIntoView) el.scrollIntoView({ block:'center' }); }, 30); return true; }
  if (e.target.closest('[data-wpsave]')){
    if (!wplanMay()) return true;
    var wt0 = pmoVal('wpT'); if (!wt0){ toast(t('اكتب عنوان النقطة')); return true; }
    var wid = e.target.closest('[data-wpsave]').getAttribute('data-wpsave') || ('P' + Date.now().toString(36));
    var prev = pmoList('wplan').filter(function(x){ return x.id === wid; })[0] || {};
    var item = Object.assign({}, prev, { wk:prev.wk || wplanWeek(), t:wt0, pri:pmoVal('wpP') || 'متوسطة', n:pmoVal('wpN'), steps:pmoVal('wpS'), needs:pmoVal('wpR'), goal:pmoVal('wpG'), st:prev.st || 'مخطط', at:prev.at || Date.now(), by:STATE.meta.name || '', hist:mfuHist(prev, prev.id ? 'edit' : 'new', wt0.slice(0, 60)) });
    delete item.id; if (wplanLines(item.steps).length !== wplanLines(prev.steps).length) item.sdone = [];
    if (pmoPut('wplan', wid, item)){ WPLAN_EDIT = ''; WPLAN_PREFILL = null; toast(t(prev.id ? 'حُفظ التعديل' : 'أُضيفت إلى الخطة')); render(1); }
    return true;
  }
  if (e.target.closest('[data-wpdel]')){ var did = e.target.closest('[data-wpdel]').getAttribute('data-wpdel'); if (pmoPut('wplan', did, { gone:true, at:Date.now() })){ toast(t('حُذف')); render(1); } return true; }
  if (e.target.closest('[data-wpnext]')){
    var nid = e.target.closest('[data-wpnext]').getAttribute('data-wpnext'), nx0 = pmoList('wplan').filter(function(x){ return x.id === nid; })[0];
    if (nx0){ var ni = Object.assign({}, nx0); delete ni.id; ni.wk = wplanNextWeek(nx0.wk); ni.st = 'مخطط'; ni.hist = mfuHist(nx0, 'next', ni.wk); if (pmoPut('wplan', nid, ni)){ toast(t('رُحّلت إلى') + ' ' + ni.wk); render(1); } }
    return true;
  }
  if (e.target.closest('[data-wptask]')){
    var pid = e.target.closest('[data-wptask]').getAttribute('data-wptask'), px = pmoList('wplan').filter(function(x){ return x.id === pid; })[0];
    if (!px) return true;
    if (wtAdd({ n:px.t, track:'خطة الأسبوع', due:dayKey(Date.now() + 7 * 864e5), plan:'P:' + pid, upd:px.goal || '' })){
      var pn = Object.assign({}, px); delete pn.id; pn.task = STATE.wtask.lastId; pn.st = pn.st === 'مخطط' ? 'جارٍ' : pn.st; pn.hist = mfuHist(px, 'task', '#' + pn.task);
      pmoPut('wplan', pid, pn); toast(t('أُنشئت المهمةُ الأسبوعية')); render(1);
    }
    return true;
  }
  return CLICK_NEXT;
}
/* clickA — الجزء 3 من 7 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: reqtask، svq، svqx، svqk، svqdelask، svqdelx، svqdel، svqqx، svqcancel، svqch، svqsave، sqall، mfupadd، mfuprm، mfupren، mfuprn، mfuprst، chupd، chupdtxt، chupdx، chupdgo، chalpop، chalpopx، mfz، mft، mfuedit، mfucosall، wdyser، wdypg، wdyreset، mfuchal، mfureq، mfudel، iosnudge، idbretry، simapply، simot، geojson */
