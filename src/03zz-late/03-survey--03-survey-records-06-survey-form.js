/* ============================================================================
   FILE    : src/03zz-late/03-survey--03-survey-records-06-survey-form.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03-survey/03-survey-records-06-survey-form.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : ipFillMissing, svSave
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function ipFillMissing(zoneOnly, typeOnly){
  if (!may('edit')){ toast(t('التحريرُ ليس من صلاحيتك')); return; }
  var used = {};
  (STATE.sites || []).forEach(function(x){ if (x.net) used[x.net] = 1; });
  var seq = {}, made = 0, skipped = 0, held = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.net) return;
    if (zoneOnly && x.zone !== zoneOnly) return;
    if (typeOnly && x.type !== typeOnly) return;
    if (ipPreset(x)){ held++; return; }
    var o2 = IP_OCT2[x.zone], o3b = IP_OCT3[x.type];
    if (o2 == null || o3b == null){ skipped++; return; }
    /* الشريحةُ للنوع في مشعره — والتسلسلُ يتقدّم في المشعر كلِّه لا في كلِّ
       نوعٍ على حدة، وإلا تصادمت أنواعٌ تتجاور شرائحُها عند الامتلاء. */
    var key = x.zone + '|' + x.type;
    var i = seq[key] || 0, net = '';
    /* لكلِّ نوعٍ في المشعر أربعون شبكةً (o3b … o3b+39)، وكلُّ شبكةٍ تحمل
       مئتين وخمسين نقطة — يكفي المشروعَ أضعافًا ويبقى المخطَّطُ مقروءًا. */
    while (i < 40 * 250){
      var o3 = o3b + Math.floor(i / 250), o4 = 1 + (i % 250);
      var cand = '10.' + o2 + '.' + o3 + '.' + o4;
      i++;
      if (!used[cand]){ net = cand; break; }
    }
    if (!net){ skipped++; return; }
    seq[key] = i;
    used[net] = 1;
    x.net = net;
    CORE.set('sites', x.id, { net:net, ipRtr:'', ipRdr:'', ipCam:'' });
    made++;
  });
  statBump();
  logEvent('توليد بادئات الشبكة — ' + nm(made) + ' نقطة'
           + (zoneOnly ? ' \u00b7 ' + zoneOnly : '') + (typeOnly ? ' \u00b7 ' + typeOnly : ''));
  toast(made ? (nm(made) + ' ' + t('نقطةً نالت بادئتَها')
                 + (held ? ' \u00b7 ' + nm(held) + ' ' + t('مُركّبةٌ سابقًا تُركت لتُقرأ من الميدان') : '')
                 + (skipped ? ' \u00b7 ' + nm(skipped) + ' ' + t('تُخُطِّيت') : ''))
             : (held ? nm(held) + ' ' + t('نقطةً عنوانُها قائمٌ في الميدان — لا يُخترَع لها بديل')
                     : t('لا نقطةَ بلا بادئةٍ في هذا الترشيح')));
  render(1);
}

/* ── الحفظ — يكتب في المحرك ويدخل الطابور ── */
function svSave(next){
  var s = formSite();
  if (!s){ toast(t('اختر النقطةَ أوّلًا — لا يُحفَظ مسحٌ بلا نقطته')); return; }   /* (V38.68) */
  /* سبقني غيري على النقطة بعد فتح النموذج (V17.79): يُقال ويُطلَب حفظٌ ثانٍ صريح */
  var ahead = svClashAhead(s.id);
  if (ahead && !FORM.overwrite){
    FORM.overwrite = true;
    toast(t('عدّلها') + ' ' + ahead.by + ' ' + t('بعد أن فتحتَ النموذج — اضغط الحفظَ ثانيةً لتكتب فوق تعديله، أو أعد فتح النقطة لتقرأه'));
    return;
  }
  var reached = FORM.access === 'تم الوصول';
  /* عددُ الصور المأخوذة يُختَم على الزيارة نفسِها (V17.33): فإذا وصلت الزيارةُ
     ولم تصل صورُها عرف المكتبُ أنها في طابور جهاز الفنيّ لا أنها لم تُؤخَذ. */
  var phN = Object.keys(FORM.photos || {}).filter(function(k){ return FORM.photos[k] && FORM.photos[k].data; }).length;
  if (!reached && !FORM.why){ toast(t('اختر سببَ عدم المسح من القائمة')); return; }   /* (V37.1) */
  if (!reached && whyOf(FORM.why) && whyOf(FORM.why).photo && !(FORM.photos.site && FORM.photos.site.data)){ toast(t('صورةُ إثباتٍ مطلوبة للسبب — اللقطةُ العامة')); return; }
  if (reached && (!FORM.photos.site || !FORM.photos.mount)){
    toast(t('الصورتان مطلوبتان قبل الحفظ'));
    try { var ct2 = document.getElementById('content'), eb2 = document.getElementById('svErr');
      if (ct2){ if (!eb2){ eb2 = document.createElement('div'); eb2.id = 'svErr'; eb2.setAttribute('role', 'alert'); eb2.style.cssText = 'background:#C0392B;color:#fff;border-radius:12px;padding:12px 14px;margin:0 0 10px;font-weight:700;position:sticky;top:0;z-index:5'; ct2.insertBefore(eb2, ct2.firstChild); }
        eb2.textContent = '\u26A0 ' + t('لم تُحفَظ الزيارة — أكمِل') + ': ' + t('الصورتان مطلوبتان قبل الحفظ'); } } catch (e){ LS_ERR = e; }
    return;
  }
  /* ما لا يُبنى عليه حلٌّ لا يُحفَظ: النوعُ والكهرباءُ والمقاسان والصلاحيةُ
     وتحدٍّ واحدٌ على الأقل («لا توجد تحديات» خيارٌ صريحٌ يُختار). */
  if (reached){
    var need = [];
    if (!FORM.mount) need.push('نوع التركيب');
    if (!FORM.power) need.push('مصدر الكهرباء');
    /* (V38.79) corridors and Jamarat: «موقع النقطة» is required instead of the challenge chips */
    if (locOnly(s)){ if (!locList(FORM.loc).length) need.push('موقع النقطة'); }
    else {
      if (!(FORM.chals || []).length) need.push('تحديات التركيب');
      if ((FORM.chals || []).indexOf(chalOther()) > -1 && !String(FORM.chal_note || '').trim()) need.push('وصف التحدي بالتفصيل');
    }   /* (V38.20) «أخرى» بلا وصفٍ لا تفيد المكتب */
    if (!cfgN(FORM.wid_m)) need.push('العرض المتاح (متر)');
    if (!cfgN(FORM.hgt_m)) need.push('الارتفاع المتاح (متر)');
    if (!FORM.fit) need.push('هل الموقع مناسب للتركيب؟');
    if (need.length){
      toast(t('أكمِل المطلوب') + ': ' + need.map(function(x){ return t(x); }).join(' \u00b7 '));
      /* (V21.0) ويبقى مكتوبًا أعلى النموذج حتى يُستكمَل — الرسالةُ العابرةُ لم تكن تُرى تحت الشمس */
      try { var ct = document.getElementById('content'), eb = document.getElementById('svErr');
        if (ct){ if (!eb){ eb = document.createElement('div'); eb.id = 'svErr'; eb.setAttribute('role', 'alert'); eb.style.cssText = 'background:#C0392B;color:#fff;border-radius:12px;padding:12px 14px;margin:0 0 10px;font-weight:700;position:sticky;top:0;z-index:5'; ct.insertBefore(eb, ct.firstChild); }
          eb.textContent = '\u26A0 ' + t('لم تُحفَظ الزيارة — أكمِل') + ': ' + need.map(function(x){ return t(x); }).join(' \u00b7 '); } } catch (e){ LS_ERR = e; }
      var first = document.querySelector('[data-form="' + (FORM.mount ? (FORM.power ? (FORM.wid_m ? (FORM.hgt_m ? 'fit' : 'hgt_m') : 'wid_m') : 'power') : 'mount') + '"]');
      if (first && first.scrollIntoView){ first.scrollIntoView({ block:'center', behavior:'smooth' }); try { first.focus(); } catch (e){ LS_ERR = e; } }
      return;
    }
  }
  var rec = {
    id:s.id, by:STATE.meta.name || '', at:Date.now(),
    mount:FORM.mount, power:FORM.power, height:cfgN(FORM.height), cable:cfgN(FORM.cable),
    chals:locOnly(s) ? [] : FORM.chals.slice(), note:FORM.note, photos:Object.keys(FORM.photos),
    access:FORM.access
  };
  /* (V37.1) السببُ والفئاتُ مفاتيحُ ثابتة؛ ومحاولاتُ الوصول وبدايةُ التوقف تُحمَل من الزيارة السابقة */
  if (!reached){ var pv = STATE.recs[s.id]; rec.why = FORM.why; rec.tries = (pv && svStuck(pv) ? (+pv.tries || 1) : 0) + 1; rec.stuckSince = (pv && svStuck(pv) && (+pv.stuckSince || +pv.at)) || Date.now(); }
  else rec.chalCats = locOnly(s) ? [] : chalCats({ chals:FORM.chals }).filter(function(k){ return k !== 'review'; });
  SV_EXTRA_KEYS.forEach(function(k){ if (FORM[k] !== '' && FORM[k] != null) rec[k] = FORM[k]; });
  if (rec.ctype !== 'ترددي') delete rec.tbar;   /* (V39.56) the barrier count belongs to a Taraddudi camp */
  try { var sxT = siteFind(rec.id || FORM.id || ''); if (sxT) delete sxT._tax; } catch (eT){ LS_ERR = eT; }   /* its type may have changed: the taxonomy is read again */
  /* العنوانُ الذي قرأه الفنيُّ من الجهاز يُكتَب على النقطة نفسِها — فتخرج من
     قائمة «بلا عنوان» بعنوانها الحقيقيِّ لا بعنوانٍ مولَّد */
  var netIn = String(FORM.old_net || '').trim().replace(/\.+$/, '');
  if (netIn && /^\d{1,3}(\.\d{1,3}){2,3}$/.test(netIn) && netIn !== s.net){
    s.net = netIn;
    CORE.set('sites', s.id, { net:netIn, ipRtr:s.ipRtr || '', ipRdr:s.ipRdr || '', ipCam:s.ipCam || '' });
    logEvent('عنوانُ شبكةٍ من الميدان — ' + s.id + ' \u00b7 ' + netIn, s.id);
  }
  /* تنتظر المهندسَ — وإن كانت عودةً بعد ردٍّ فهي جولةٌ ثانيةٌ تحمل سببَ الردّ */
  rec.review = 'pending';
  var prevRec = STATE.recs[s.id];
  if (prevRec && prevRec.review === 'revisit'){
    rec.round = (prevRec.round || 1) + 1;
    rec.prevNote = prevRec.revisitNote || '';
  } else if (prevRec && prevRec.round) rec.round = prevRec.round;
  if (prevRec && prevRec.loc) rec.loc = prevRec.loc;   /* التحريكُ لا يضيع بحفظ النموذج */
  if (prevRec && prevRec.src) rec.src = prevRec.src;   /* وأصلُ الزيارة كذلك (V17.57) */
  rec.phN = phN;
      CORE.set('recs', s.id, rec);
  Object.keys(FORM.photos).forEach(function(k){
    /* لا صورةَ خامٌ في القاعدة ولو تعذّر الطابور: تبقى محليًّا حتى يُضبَط درايف */
    if (typeof photoQueue === 'function') photoQueue(s.id, k, FORM.photos[k].data);
  });
  logEvent((reached ? 'مسح موقع — ' : 'تعذّر الوصول — ' + FORM.access + ' · ') + s.id, s.id);
  if (reached) stepDone('visit', s.id, '', formPts());
  /* تعذُّرُ الوصولِ يحتاج قرارًا من المكتب — تصريحٌ أو مخاطبةُ جهةٍ أو شطب */
  if (!reached) notifPush('تعذّر وصول', FORM.access + ' — ' + (FORM.note || ''),
                          { site:s.id, lv:'مهم' });
  toast(reached
    ? (nm(1) + ' ' + t('مسحٌ حُفظ') + ' · ' + t('في الطابور') + ' ' + nm(CORE.pending()))
    : t('سُجّل تعذُّرُ الوصول'));
  svDraftClear();   /* (V25.9) حُفظ المسح: لا مسودة */
  formReset();
  if (next){
    var un = STATE.sites.filter(function(x){ return !STATE.recs[x.id]; })[0];
    if (un) formGo(un.id);
  }
  render();
}
