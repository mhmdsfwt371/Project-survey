/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-11-clicks-doc-2.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Document-level click handlers part 2 (parts 4–7).
   DEFINES : onDocClickPart4, onDocClickPart5, onDocClickPart6, onDocClickPart7
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
function onDocClickPart4(e){
  var pzd = e.target.closest('[data-pzdrop]');   /* بحثٌ صرف — يُعاد حسابُه */
    if (pzd){
    var pd = (STATE.poison || [])[+pzd.getAttribute('data-pzdrop')];
    if (pd){ STATE.poison.splice(+pzd.getAttribute('data-pzdrop'), 1); logEvent('أُسقطت وثيقةٌ معزولة — ' + pd.kind + '/' + pd.id); CORE.saveLocal(); render(1); }
    return;
  }
  if (e.target.closest('[data-bkref]')){ bkFetch(true); toast(t('تُقرأ الحالة…')); return; }
  var cpk = e.target.closest('[data-copick]');
  if (cpk){
    var ix = cpk.getAttribute('data-copick').split(':');
    var rawK = (CO_CMP_KEYS || [])[+ix[0]];
    var grp = rawK && (CO_CMP || {})[rawK];
    if (grp) coPick(rawK, grp.parts[+ix[1]]);
    return;
  }
  if (e.target.closest('[data-coren]')){
    coRename((document.getElementById('coRenFrom') || {}).value, (document.getElementById('coRenTo') || {}).value);
    render(1); return;
  }
  var aq = e.target.closest('[data-asnq]');
  if (aq){ asnQuick(aq.getAttribute('data-asnq')); return; }
  var hsd = e.target.closest('[data-hsedel]');
  if (hsd){ hseDel(+hsd.getAttribute('data-hsedel')); return; }
  var rkd = e.target.closest('[data-rkdel]');
  if (rkd){ riskDel(rkd.getAttribute('data-rkdel')); return; }
  var rgk = e.target.closest('[data-regk]');
  if (rgk){
    var kv = rgk.getAttribute('data-regk');
    if (kv === REG_KIND){ toast(t(kv ? (WO_KINDS[kv] ? WO_KINDS[kv].n : kv) : 'كل الأنواع') + ' \u00b7 ' + t('معروضٌ الآن')); return; }
    REG_KIND = kv; REG_EDIT = ''; render(1); return;
  }
  var rgs = e.target.closest('[data-regs]');
  if (rgs){
    var sv2 = rgs.getAttribute('data-regs');
    if (sv2 === REG_ST){ toast(t(sv2 || 'كل الحالات') + ' \u00b7 ' + t('معروضٌ الآن')); return; }
    REG_ST = sv2; REG_EDIT = ''; render(1); return;
  }
  var rge = e.target.closest('[data-regedit]');
  if (rge){ REG_EDIT = rge.getAttribute('data-regedit'); render(1); return; }
  var rgv = e.target.closest('[data-regsave]');
  if (rgv){
    var rid = rgv.getAttribute('data-regsave');
    var tEl = document.querySelector('[data-regto="' + rid + '"]');
    var wEl = document.querySelector('[data-regwhen="' + rid + '"]');
    var pat = {};
    if (tEl) pat.to = tEl.value, pat.assignedTo = tEl.value;
    if (wEl) pat.when = wEl.value || '';
    regSet(rid, pat);
    REG_EDIT = ''; render(1); return;
  }
  var rgd = e.target.closest('[data-regdel]');
  if (rgd){ regDel(rgd.getAttribute('data-regdel')); return; }
  var wre = e.target.closest('[data-wredit]');
  if (wre){ WR_EDIT = wre.getAttribute('data-wredit'); render(1); return; }
  var wrs = e.target.closest('[data-wresave]');
  if (wrs){
    var wid = wrs.getAttribute('data-wresave');
    var qEl = document.getElementById('wrEQ_' + wid);
    var iEl = document.querySelector('[data-wreitem="' + wid + '"]');
    workReqEdit(wid, iEl ? iEl.value : '', qEl ? qEl.value : 0);
    WR_EDIT = ''; render(1); return;
  }
  if (e.target.closest('[data-rkadd]')){ riskAdd(); return; }
  if (e.target.closest('[data-hogo]')){
    var hs = (document.getElementById('hoSite') || {}).value;
    var ht = (document.getElementById('hoTo') || {}).value;
    var hn = (document.getElementById('hoNote') || {}).value;
    if (handSave(hs, ht, hn)){ HO_DOC = hs; toast(hs + ' \u00b7 ' + t('حُرِّر المحضر')); }
    render(1); return;
  }
  var hd = e.target.closest('[data-hodoc]');
  if (hd){
    var isSite = hd.getAttribute('data-hodoc') === 'site';
    var pick = (document.getElementById(isSite ? 'hoDocSite' : 'hoDocCo') || {}).value || '';
    /* القائمةُ الفارغةُ تجعل الزرَّ بلا أثر — فيُقال لماذا بدل الصمت */
    if (!pick){
      toast(t(isSite ? 'لا نقطةَ مُركّبةً معتمدةً بعد — لا محضرَ يُعرَض'
                     : 'لا شركةَ لها نقاطٌ مُركّبةٌ معتمدةٌ بعد'));
      return;
    }
    if (isSite){ HO_DOC = pick; HO_CO = ''; } else { HO_CO = pick; HO_DOC = ''; }
    render(1); return;
  }
  if (e.target.closest('[data-pkadd]')){ pkAdd(); return; }
  var pkrm = e.target.closest('[data-pkrm]');
  if (pkrm){ delete SOL_LINES[pkrm.getAttribute('data-pkrm')]; render(1); return; }
  if (e.target.closest('[data-patapply]')){ patApply((document.getElementById('patSel') || {}).value); return; }
  if (e.target.closest('[data-patsave]')){ if (patSave((document.getElementById('patName') || {}).value)) render(1); return; }
  var pdl = e.target.closest('[data-patdel]');
  if (pdl){ patDel(pdl.getAttribute('data-patdel')); return; }
  var svr = e.target.closest('[data-svreopen]');
  if (svr){ SURV_REOPEN = svr.getAttribute('data-svreopen'); render(1); return; }
  if (e.target.closest('[data-svreopencancel]')){ SURV_REOPEN = ''; render(1); return; }
  var svg = e.target.closest('[data-svreopengo]');
  if (svg){
    svReopen(svg.getAttribute('data-svreopengo'),
             (document.getElementById('reopenReason') || {}).value,
             (document.getElementById('reopenNote') || {}).value);
    return;
  }
  var evc = e.target.closest('[data-evcat]');
  if (evc){ EVF.cat = evc.getAttribute('data-evcat'); render(1); return; }
  var ue = e.target.closest('[data-usredit]');
  if (ue){ USR.edit = ue.getAttribute('data-usredit'); render(1); return; }
  var ud = e.target.closest('[data-usrdel]');
  if (ud){ usrDel(ud.getAttribute('data-usrdel')); return; }
  var ua = e.target.closest('[data-usract]');
  if (ua){ var id1 = ua.getAttribute('data-usract');
    usrSet(id1, { active: ((STATE.users||{})[id1]||{}).active === false }); return; }
  var urn = e.target.closest('[data-usrren]');
  if (urn){
    rid = urn.getAttribute('data-usrren');
    var uEl = document.querySelector('[data-usru="' + rid + '"]');
    if (usrRename(rid, uEl ? uEl.value : '')){ USR.edit = ''; render(1); }
    return;
  }
  var us = e.target.closest('[data-usrsave]');
  if (us){
    var id2 = us.getAttribute('data-usrsave');
    var nEl = document.querySelector('[data-usrn="' + id2 + '"]');
    var rEl = document.querySelector('[data-usrr="' + id2 + '"]');
    var patch = {};
    if (nEl) patch.name = String(nEl.value || '').trim();
    if (rEl) patch.role = rEl.value;
    var jEl = document.querySelector('[data-usrj="' + id2 + '"]');
    var sEl = document.querySelector('[data-usrs="' + id2 + '"]');
    if (jEl){
      patch.job = jEl.value;
      var uOld = (STATE.users || {})[id2] || {};
      if (patch.job !== (uOld.job || ''))
        patch.jobLog = (uOld.jobLog || []).concat([{ job:patch.job, at:Date.now(), by:STATE.meta.name || '' }]);
      /* الوظيفةُ تجرُّ دورَها ما لم يُغيَّر الدورُ بيدٍ في اللحظة نفسِها */
      if (patch.job && jobOf(patch.job) && (!rEl || rEl.value === uOld.role))
        patch.role = jobOf(patch.job).role || patch.role;
    }
    if (sEl) patch.sup = sEl.value;
    var dEl = document.querySelector('[data-usrd="' + id2 + '"]');
    if (dEl) patch.dept = dEl.value;
    var phEl = document.querySelector('[data-usrph="' + id2 + '"]');
    if (phEl) patch.ph = String(phEl.value || '').replace(/[^\d+]/g, '');
    if (!patch.name){ toast(t('الاسم مطلوب')); return; }
    USR.edit = ''; usrSet(id2, patch); return;
  }
  if (e.target.closest('[data-tkpurge]')){
    if (!may('users')){ toast(t('إدارةُ المستخدمين للمهندس وحده')); return; }
    /* الوثيقةُ الموروثةُ تُحذَف من السحابة، وأسماءُ الفرق التي لا حسابَ لها
       تُفرَغ — فلا يبقى مكانٌ ثانٍ يعيش فيه اسم. الحساباتُ لا تُمَسّ. */
    CORE.dirty('cfg', 'techs', null);
    STATE.techs = [];
    var cleaned = 0;
    crewsList().forEach(function(c){
      var keep = (c.members || []).filter(function(nm2){ return !!techUid(nm2); });
      cleaned += (c.members || []).length - keep.length;
      c.members = keep;
    });
    crewSave();
    logEvent('تنظيف قوائم الفنيين الموروثة — أُفرغ ' + nm(cleaned) + ' اسمًا بلا حساب');
    toast(t('مُسحت القوائمُ الموروثة') + (cleaned ? ' \u00b7 ' + nm(cleaned) + ' ' + t('اسمًا أُفرغ من الفرق') : ''));
    render(1); return;
  }
  ud = e.target.closest('[data-usrdel]');
  if (ud){
    var idD = ud.getAttribute('data-usrdel');
    if (!may('users')){ toast(t('إدارةُ المستخدمين للمهندس وحده')); return; }
    if (idD === (STATE.meta.uid || '')){ toast(t('لا تحذف حسابَك وأنت فيه')); return; }
    var uD = (STATE.users || {})[idD] || {};
    /* من له عملٌ مسجَّلٌ لا يُحذَف — سجلاتُه تحمل اسمَه */
    var wk = scores().list.filter(function(x){ return x.name === uD.name; })[0];
    var acts = wk ? (wk.survey + wk.install + wk.dis + wk.prep + wk.asm) : 0;
    if (acts){ toast(t('له') + ' ' + nm(acts) + ' ' + t('عملًا مسجَّلًا — عطِّله بدل حذفه')); return; }
    /* ومن عليه مهامُّ مفتوحةٌ أو طلبُ صرفٍ لم يُنفَّذ لا يُحذَف — وإلا صارت
       مهامُّه يتيمةً تُعرَض على «لا أحد» ويُنتظَر تنفيذُها إلى الأبد */
    var openT = Object.keys(STATE.tasks || {}).filter(function(k){
      var x = STATE.tasks[k]; return x && x.to === uD.name && x.status !== 'معتمد'; }).length;
    var openW = workReqList().filter(function(r){ return r.to === uD.name && r.status !== 'تم'; }).length;
    if (openT || openW){
      toast(t('عليه') + ' ' + nm(openT + openW) + ' ' + t('مهمةً مفتوحةً — أعد إسنادَها من «سجل الإسنادات» ثم احذف'));
      return;
    }
    delete STATE.users[idD];
    CORE.dirty('users', idD, null);
    logEvent('حذف حساب — ' + (uD.name || idD));
    toast(t('حُذف الحساب'));
    USR.edit = ''; render(1); return;
  }
  if (e.target.closest('[data-out]')){ signOut(); return; }
  if (e.target.closest('[data-serrclr]')){
    SOFT_ERRS = []; SOFT_SAID = {}; toast(t('مُسح سجلُّ الأعطال')); render(1); return;
  }
  if (e.target.closest('[data-verchk]')){ verCheck(); return; }
  var depa = e.target.closest('[data-depadd]');
  if (depa){ depTechAdd(depa.getAttribute('data-depadd')); return; }
  var bna = e.target.closest('[data-bnadd]');
  if (bna){
    var pfx = bna.getAttribute('data-bnadd');
    bonusAdd((document.getElementById(pfx + 'BnTech') || {}).value,
             (document.getElementById(pfx + 'BnPts') || {}).value,
             (document.getElementById(pfx + 'BnNote') || {}).value);
    return;
  }
  var bnd = e.target.closest('[data-bndel]');
  if (bnd){ bonusDel(bnd.getAttribute('data-bndel')); return; }
  var crc = e.target.closest('[data-crewcur]');
  if (crc){
    var cid = crc.getAttribute('data-crewcur');
    if (cid === CREW_CUR){ toast(t('هذا الفريقُ معروضٌ الآن')); return; }
    CREW_CUR = cid; CTEAM_CUR = ''; render(1); return;
  }
  var dtn = e.target.closest('[data-depteamnew]');
  if (dtn){ depTeamNew(dtn.getAttribute('data-depteamnew')); return; }
  var dtd = e.target.closest('[data-depteamdel]');
  if (dtd){ depTeamDel(dtd.getAttribute('data-depteamdel')); return; }
  var dtc = e.target.closest('[data-depteam]');
  if (dtc){
    var did = dtc.getAttribute('data-depteam');
    if (did === CTEAM_CUR){ toast(t('هذا الفريقُ معروضٌ الآن')); return; }
    CTEAM_CUR = did; render(1); return;
  }
  if (e.target.closest('[data-depmemadd]')){ depTeamAdd(); return; }
  var dmr = e.target.closest('[data-depmemrm]');
  if (dmr){ depTeamRm(+dmr.getAttribute('data-depmemrm')); return; }
  if (e.target.closest('[data-depeven]')){ depTeamEven(); return; }
  if (e.target.closest('[data-depbydef]')){ depTeamByRole(); return; }
  var cpt = e.target.closest('[data-capt]');
  if (cpt){
    /* تبديلُ الصلاحيات لمن يملك `roles` وحدَه — والمهندسُ لا يملكها،
       فمن يضبط الصلاحياتِ لا يوسّع صلاحيةَ نفسِه. */
    if (!may('roles')){ toast(t('تبديلُ الصلاحيات لمدير المشروع وحده')); return; }
    var p2 = cpt.getAttribute('data-capt').split('|');
    var R2 = ROLES[p2[0]]; if (!R2) return;
    R2.can = R2.can || {};
    if (R2.can[p2[1]]) delete R2.can[p2[1]]; else R2.can[p2[1]] = 1;
    CFG.roleCaps = (function(){
      var o2 = {}; Object.keys(ROLES).forEach(function(k){ o2[k] = ROLES[k].can || {}; }); return o2;
    })();
    CORE.set('cfg', 'roleCaps', CFG.roleCaps);
    /* القدرةُ التي لها خانةٌ في القاعدة تُكتَب فيها في اللحظة نفسِها — فلا شاشةٌ تعِد وقاعدةٌ تردّ */
    var pk2 = PM_CAP[p2[1]];
    if (pk2 && !pmLocked(pk2[0], pk2[1], p2[0])) pmSetDirect(pk2[0], pk2[1], p2[0], !!R2.can[p2[1]]);
    logEvent('صلاحية — ' + R2.n + ' · ' + p2[1] + ': ' + (R2.can[p2[1]] ? 'مُنحت' : 'سُحبت') + (pk2 ? ' · ' + t('وفي القاعدة') : ''));
    toast(t(R2.can[p2[1]] ? 'مُنحت' : 'سُحبت'));
    render(1); return;
  }
  if (e.target.closest('[data-esadd]')){ escAdd(); return; }
  var esd = e.target.closest('[data-esdel]');
  if (esd){ escDel(+esd.getAttribute('data-esdel')); return; }
  if (e.target.closest('[data-rcadd]')){ raciAdd(); return; }
  var rcd = e.target.closest('[data-rcdel]');
  if (rcd){ raciDel(+rcd.getAttribute('data-rcdel')); return; }
  if (e.target.closest('[data-lsadd]')){ lessAdd(); return; }
  if (e.target.closest('[data-lsshow]')){ LESS_SHOW = !LESS_SHOW; render(1); return; }   /* (V27.1) */
  var lsd = e.target.closest('[data-lsdel]');
  if (lsd){ lessDel(+lsd.getAttribute('data-lsdel')); return; }
  if (e.target.closest('[data-vhadd]')){ vehAdd(); return; }
  if (e.target.closest('[data-vaadd]')){ vehAsnAdd(); return; }
  if (e.target.closest('[data-vkadd]')){
    if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
    var g2 = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
    var vn = g2('vkN');
    if (!vn){ toast(t('اكتب اسم النوع')); return; }
    if (vehKinds().some(function(k){ return k.n === vn; })){ toast(t('النوعُ موجودٌ بالفعل')); return; }
    vehKinds().push({ id:'vk' + Date.now().toString(36), n:vn, d:g2('vkD'), cap:+g2('vkC') || 2 });
    vehKindSave(); logEvent('نوع سيارة جديد — ' + vn);
    toast(t('أُضيف النوع')); render(1); return;
  }
  var vhd = e.target.closest('[data-vhdel]');
  if (vhd){ vehDel(vhd.getAttribute('data-vhdel')); return; }
  var vae = e.target.closest('[data-vaend]');
  if (vae){ vehAsnEnd(vae.getAttribute('data-vaend')); return; }
  var vkd = e.target.closest('[data-vkdel]');
  if (vkd){
    if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
    var kid = vkd.getAttribute('data-vkdel');
    if (vehList().some(function(v){ return v.kind === kid; })){ toast(t('مستعملٌ — لا يُحذَف')); return; }
    var KL = vehKinds(), ki = -1;
    KL.forEach(function(k, n2){ if (k.id === kid) ki = n2; });
    if (ki > -1){ var kn = KL[ki].n; KL.splice(ki, 1); vehKindSave();
      logEvent('حذف نوع سيارة — ' + kn); toast(t('حُذف النوع')); render(1); }
    return;
  }
  if (e.target.closest('[data-shadd]')){ shipAdd(); return; }
  var shd = e.target.closest('[data-shdel]');
  if (shd){ shipDel(shd.getAttribute('data-shdel')); return; }
  if (e.target.closest('[data-fup]')){ fupExport(); return; }
  if (e.target.closest('[data-vkadd]')){ vehKindAdd(); return; }
  vkd = e.target.closest('[data-vkdel]');
  if (vkd){ vehKindDel(vkd.getAttribute('data-vkdel')); return; }
  if (e.target.closest('[data-tyadd]')){ typeAdd(); return; }
  if (e.target.closest('[data-typesopen]')){ TYPES_OPEN = e.target.closest('[data-typesopen]').getAttribute('data-typesopen') === '1'; render(1); return; }
  if (e.target.closest('[data-selname]')){ if (selRename((document.getElementById('selNamePfx') || {}).value, (document.getElementById('selNameFrom') || {}).value)){ ASN_OPEN = false; if (typeof mapPaint === 'function' && MAP) mapPaint(); } render(1); return; }   /* (V23.1) */
  if (e.target.closest('[data-seltype]')){ var stv = (document.getElementById('selType') || {}).value; if (selSetType(stv)){ ASN_OPEN = false; if (typeof mapPaint === 'function' && MAP) mapPaint(); } render(1); return; }   /* (V23.0) */
  var tym = e.target.closest('[data-tymove]');   /* (V23.0) */
  if (tym){ var tk0 = tym.getAttribute('data-tymove'), tsel = document.getElementById('tyMv_' + tk0); typeMoveDel(tk0, tsel ? tsel.value : ''); render(1); return; }
  var tyd = e.target.closest('[data-tydel]');
  if (tyd){ typeDel(tyd.getAttribute('data-tydel')); return; }
  var mxd = e.target.closest('[data-mxdel]');
  if (mxd){
    var mxp = mxd.getAttribute('data-mxdel').split('|');
    mxUndeclare(mxp[0], mxp.slice(1).join('|'));
    return;
  }
  if (e.target.closest('[data-mxdadd]')){ mxDeclareGo(); return; }
  if (e.target.closest('[data-jbadd]')){ jobAdd(); return; }
  var jbd = e.target.closest('[data-jbdel]');
  if (jbd){ jobDel(jbd.getAttribute('data-jbdel')); return; }
  if (e.target.closest('[data-craddgo]')){ crewAdd(); return; }
  if (e.target.closest('[data-wipego]')){ wipeGo(); return; }
  var tkd = e.target.closest('[data-tkdel]');
  if (tkd){ techDel(tkd.getAttribute('data-tkdel')); return; }
  var crd = e.target.closest('[data-crdel]');
  if (crd){ crewDel(crd.getAttribute('data-crdel')); return; }
  var sgo = e.target.closest('[data-stgout]');
  if (sgo){ var p3 = sgo.getAttribute('data-stgout').split('|'); stageOut(p3[0], p3[1]); return; }
  var sga = e.target.closest('[data-stgadd]');
  if (sga){ stageAdd(sga.getAttribute('data-stgadd')); return; }
  if (e.target.closest('[data-itadd]')){ itemAdd(); return; }
  var idl = e.target.closest('[data-itdel]');
  if (idl){ itemDel(idl.getAttribute('data-itdel')); return; }
  var izn = e.target.closest('[data-itzone]');
  if (izn){ itemZone(izn.getAttribute('data-itzone')); return; }
  if (e.target.closest('[data-mvadd]')){ moveAdd(); return; }
  if (e.target.closest('[data-byadd]')){ buyAdd(); return; }
  var bye = e.target.closest('[data-byedit]'); if (bye){ buyEdit(bye.getAttribute('data-byedit')); return; }   /* (V29.5) */
  var mdl = e.target.closest('[data-mntdel]'); if (mdl){ var mp2 = mdl.getAttribute('data-mntdel').split('|'); maintDel(mp2[0], mp2[1]); return; }
  var byd = e.target.closest('[data-bydel]'); if (byd){ buyDel(byd.getAttribute('data-bydel')); return; }
  if (e.target.closest('[data-byedcancel]')){ BUY_ED = ''; render(1); toast(t('أُلغي التعديل')); return; }
  if (e.target.closest('[data-supadd]')){ listAdd('sup'); return; }
  if (e.target.closest('[data-catadd]')){ listAdd('cat'); return; }
  var srm2 = e.target.closest('[data-suprm]');
  if (srm2){ listRm('sup', srm2.getAttribute('data-suprm')); return; }
  var crm = e.target.closest('[data-catrm]');
  if (crm){ listRm('cat', crm.getAttribute('data-catrm')); return; }
  if (e.target.closest('[data-nask]')){ notifAsk(); return; }
  if (e.target.closest('[data-ntest]')){
    notifSystem({ kind:'تجربة', text:'وصل إشعارُ النظام — القناةُ تعمل.', id:'test', site:'' });
    toast(t('أُرسل إشعارُ تجربة')); return;
  }
  var nrd = e.target.closest('[data-nread]');
  if (nrd){
    var k = nrd.getAttribute('data-nread');
    notifStore().forEach(function(n){ if (k === '*' || n.id === k) n.read = true; });
    CORE.saveSoon(); syncBadge(); render(1); return;
  }
  var nwa = e.target.closest('[data-nwa]'), nml = e.target.closest('[data-nmail]');
  if (nwa || nml){ logEvent('إرسال إشعار — ' + ((nwa||nml).getAttribute(nwa?'data-nwa':'data-nmail'))
      + ' · ' + (nwa ? 'واتساب' : 'بريد')); return; }
  var cal = e.target.closest('[data-coall]');
  if (cal){
    var on2 = cal.getAttribute('data-coall') === '1';
    CO_LIST.filter(function(c){ return coHit(c, CO_Q); })
      .forEach(function(c){
        var k = CO_SEL.indexOf(c);
        if (on2 && k < 0) CO_SEL.push(c);
        if (!on2 && k > -1) CO_SEL.splice(k, 1);
      });
    statBump(); render(1);
    toast(t(on2 ? 'حُدِّد الكل' : 'أُزيل التحديد'));
    return;
  }
  var cmo = e.target.closest('[data-comode]');
  if (cmo){
    CO_MODE = cmo.getAttribute('data-comode') === '1';
    statBump(); render(1);
    toast(t(CO_MODE ? 'الخريطةُ بألوان الشركات' : 'عاد لونُ الطبقة'));
    return;
  }
  var srm = e.target.closest('[data-selrm]');
  if (srm){ selToggle(srm.getAttribute('data-selrm')); render(1); return; }
  var pv = e.target.closest('[data-pview]');
  if (pv){ photoSeen(pv.getAttribute('data-pview')); return; }   /* الرابطُ يفتح، ونحن نسجّل */
  pd = e.target.closest('[data-pdel]');
  if (pd){
    var pid = pd.getAttribute('data-pdel');
    var why = (typeof prompt === 'function') ? prompt(t('سببُ الحذف')) : '';
    if (why === null) return;                    /* أُلغي */
    photoDelete(pid, why);
    return;
  }
  return CLICK_NEXT;
}
/* onDocClick — الجزء 5 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: pretry، acc، chal، fst */
function onDocClickPart5(e){
    if (e.target.closest('[data-pretry]')){
    while (PHOTO_FAIL.length) PHOTO_Q.push(PHOTO_FAIL.shift());
    toast(t('أُعيدت إلى الطابور'));
    photoFlush(); render(1); return;
  }
  var wy = e.target.closest('[data-why]');   /* (V37.1) سببُ عدم المسح — يحدّد حالةَ الوصول القديمة للتوافق */
  if (wy){ FORM.why = wy.getAttribute('data-why'); FORM.access = WHY_ACCESS[FORM.why] || 'منع دخول'; render(1); return; }
  var ac = e.target.closest('[data-acc]');
  if (ac){ FORM.access = ac.getAttribute('data-acc'); render(1); return; }
  var ch = e.target.closest('[data-chal]');
  if (ch){
    var v = ch.getAttribute('data-chal'), i = FORM.chals.indexOf(v);
    if (i > -1) FORM.chals.splice(i, 1); else FORM.chals.push(v);
    ch.classList.toggle('on');
    return;
  }
  var fs = e.target.closest('[data-fst]');
  return CLICK_NEXT;
}
/* onDocClick — الجزء 6 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: fst، svsave، svnext، inssave، insdraft، fix */
function onDocClickPart6(e){
  var fs = e.target.closest('[data-fst]');   /* بحثٌ صرف — يُعاد حسابُه */
    if (fs){ FORM.status = fs.getAttribute('data-fst'); render(1); return; }
  if (e.target.closest('[data-svsave]')){ svSave(0); return; }
  if (e.target.closest('[data-svnext]')){ svSave(1); return; }
  if (e.target.closest('[data-inssave]')){ insSave(0); return; }
  if (e.target.closest('[data-insdraft]')){ insSave(1); return; }
  var fxb = e.target.closest('[data-fix]');
  return CLICK_NEXT;
}
/* onDocClick — الجزء 7 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: fix، fixsend، apok، apno، appr، rej، solappr، solrej، solgo، pwa، swclear، probe، wa، wacopy، fhpos، fhcopy، fhwa، fhprep، pull، svcopy، nschal، mailsend، mailco، wasend، wapick، xls، expgo، k، kmz */
function onDocClickPart7(e){
  var fxb = e.target.closest('[data-fix]');   /* بحثٌ صرف — يُعاد حسابُه */
  var pr, ix, k, why;   /* تُكتب هنا قبل أن تُقرأ */
    if (fxb){ fixOpen(fxb.getAttribute('data-fix') === '0' ? '' : fxb.getAttribute('data-fix')); return; }
  var fxs = e.target.closest('[data-fixsend]');
  if (fxs){ fixSend(fxs.getAttribute('data-fixsend')); return; }
  var apk = e.target.closest('[data-apok]'), apn = e.target.closest('[data-apno]');
  if (apk || apn){
    var p = (apk || apn).getAttribute(apk ? 'data-apok' : 'data-apno').split('|');
    why = apn && typeof prompt === 'function' ? prompt(t('سببُ الردّ')) : '';
    if (apn && why === null) return;
    apprDecide(p[0], p.slice(1).join('|'), !!apk, why);
    return;
  }
  var ap = e.target.closest('[data-appr]');
  if (ap){ apprIns(ap.getAttribute('data-appr'), 1); return; }
  var rj = e.target.closest('[data-rej]');
  if (rj){ apprIns(rj.getAttribute('data-rej'), 0); return; }
  var sap = e.target.closest('[data-solappr]');
  if (sap){ solutionAppr(sap.getAttribute('data-solappr'), 1); return; }
  var srj = e.target.closest('[data-solrej]');
  if (srj){ solutionAppr(srj.getAttribute('data-solrej'), 0); return; }
  if (e.target.closest('[data-solgo]')){ solGo(); return; }
  if (e.target.closest('[data-pwa]')){ pwaInstall(); return; }
  if (e.target.closest('[data-swclear]')){ swClear(); return; }

  if (e.target.closest('[data-probe]')){ probeRun(); return; }
  var wa = e.target.closest('[data-wa]');
  if (wa){ waSend(wa.getAttribute('data-wa'), 0); return; }
  var wc = e.target.closest('[data-wacopy]');
  if (wc){ waSend(wc.getAttribute('data-wacopy'), 1); return; }
  if (e.target.closest('[data-fhpos]')){   /* (V29.4) */
    try { navigator.geolocation.getCurrentPosition(function(p){ MYPOS = { lat:p.coords.latitude, lng:p.coords.longitude, acc:p.coords.accuracy, at:Date.now() }; render(1); }, function(){ toast(t('تعذّر تحديدُ الموقع — فعِّل الموقع للتطبيق')); }, { enableHighAccuracy:true, timeout:15000, maximumAge:30000 }); } catch (er){ toast(t('تعذّر تحديدُ الموقع')); }
    return; }
  if (e.target.closest('[data-fhcopy]')){ var tx1 = fhTodayText(fhToday()); try { navigator.clipboard.writeText(tx1); toast(t('نُسخ الملخّص')); } catch (er){ toast(t('تعذّر النسخ')); } return; }
  if (e.target.closest('[data-fhwa]')){ try { window.open('https://wa.me/?text=' + encodeURIComponent(fhTodayText(fhToday())), '_blank', 'noopener'); toast(t('فُتح واتساب بالملخّص — اختر المشرف')); } catch (er){ toast(t('تعذّر الفتح')); } return; }
  if (e.target.closest('[data-fhprep]')){ FH_PREP = Date.now();
    if (typeof basemapDownload === 'function' && typeof BASEMAP === 'object' && BASEMAP && !BASEMAP.have && !BASEMAP.loading) basemapDownload().then(function(){ render(1); });
    var pb = document.querySelector('[data-pull]'); if (pb && pb.click) pb.click();
    toast(t('يُجهَّز اليوم: خريطةُ الجهاز وآخرُ البيانات — أبقِ التطبيقَ مفتوحًا على الشبكة دقيقة')); render(1); return; }
  var svc = e.target.closest('[data-svcopy]'); if (svc){ svCopyFrom(svc.getAttribute('data-svcopy')); render(1); return; }
  var nsc = e.target.closest('[data-nschal]');   /* (V29.7) تحدياتُ الموقع الجديد */
  if (nsc){ var cv = nsc.getAttribute('data-nschal'), L = (NEWSITE.chals || []).slice(); ix = L.indexOf(cv);
    if (ix > -1) L.splice(ix, 1); else if (cv === 'لا توجد تحديات') L = [cv]; else { L = L.filter(function(x){ return x !== 'لا توجد تحديات'; }); L.push(cv); }
    NEWSITE.chals = L; render(1); return; }
  var msd = e.target.closest('[data-mailsend]');   /* (V29.0) */
  if (msd){ var mp = msd.getAttribute('data-mailsend').split('|'); mailGo(mp[1], mp[0], ''); return; }
  if (e.target.closest('[data-mailco]')){ mailGo((document.getElementById('waCo') || {}).value || WA_CO, (document.getElementById('waKind') || {}).value || WA_KIND, (document.getElementById('waWhen') || {}).value || ''); return; }
  var wsd = e.target.closest('[data-wasend]');
  if (wsd){
    pr = wsd.getAttribute('data-wasend').split('|');
    waGo(pr[1], pr[0], '', 0);
    return;
  }
  var wp = e.target.closest('[data-wapick]');
  if (wp){
    var sel = document.getElementById('waCo');
    if (sel) sel.value = wp.getAttribute('data-wapick');
    var ph = document.getElementById('waPh');
    if (ph) ph.focus();
    return;
  }

  var xl = e.target.closest('[data-xls]');
  if (xl){
    k = xl.getAttribute('data-xls');
    toast('يُجهَّز الملف…');
    xlsExport(k === '*' ? null : [k]);
    return;
  }
  if (e.target.closest('[data-expgo]')){
    var picked = Array.prototype.filter.call(document.querySelectorAll('.expCk'), function(c){
      return c.checked && !c.disabled;
    }).map(function(c){ return c.getAttribute('data-k'); }).filter(expAllowed);   /* الشاشةُ تُرشِّح والمعالجُ يحرس */
    if (!picked.length){ toast(t('اختر قسمًا واحدًا على الأقل')); return; }
    var fmt = (document.getElementById('expFmt') || {}).value || 'xlsx';
    EXP_OPEN = false; render();
    toast(t('يُجهَّز الملف…'));
    /* كان الاختيارُ يُقرأ ولا يُستعمَل: من اختار PDF نزل له إكسل — أو لم ينزل شيء */
    if (fmt === 'xlsx' || fmt === 'both') xlsExport(picked);
    if (fmt === 'pdf' || fmt === 'both') expPdf(picked);
    return;
  }
  var kz = e.target.closest('[data-kmz]');
  if (kz){ kmzExport(kz.getAttribute('data-kmz')); return; }
  return CLICK_NEXT;
}
/* onDocClick — الجزء 8 من 9 (V33.0: قُسِّم المعالجُ للمستلِم؛ الترتيبُ نفسُه والسلوكُ نفسُه).
   يعالج: tpl، impgo، impx، usrrolef، months، crew، role، kmz، repside، repgo، reppack، sop، hseadd، ncradd، ncrok، ipcadd، ipcok، ipcpay، baseset، chgadd، chgok، chgno، stab، perfview، lasn، dsch، ddone، navx، move، movex، smark، fmark، psel، insform، asn، drvsave، drvtest، help، locate، newsite، … */
