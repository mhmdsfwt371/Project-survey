/* ============================================================================
   FILE    : src/04-office/04-tasks-office-05-account-backup-continuity.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Account document, identity from auth, pending-activation state, cause fixes that release blocked work, backup/Drive status, and the 'what depends on a person' continuity card.
   DEFINES : myUid, meInactive, meActivatedCheck, permRelease, myDocFetch, myDocFix, bkFetch, contRes, contLoad, contSave, contCard, bkAgeDays, bkCard
   GLOBALS : MYDOC, PZ_ARM, BK_STATE, BK_RAW
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ وثيقةُ حسابي: تُقرأ، وإن غابت تُنشأ ═══
   القاعدةُ تعرف الحسابَ من وثيقةٍ باسم معرِّفه — ومن لا وثيقةَ له يُرفَض كلُّ
   ما يكتب بـ«Missing or insufficient permissions»، ويظهر له دورُه صحيحًا في
   التطبيق لأنه محفوظٌ في جلسته، فيرى شاشاتِ المهندس ولا يصل عملُه. صار
   التطبيقُ يقرأ وثيقتَه عند الدخول ويضعها في مكانها، فإن غابت أنشأها فنيًّا
   (أدنى الأدوار — والقاعدةُ لا تسمح بأكثر) فيخرج من الحصار ويُرفَع عملُه،
   ثم يرقّيه المكتبُ إلى دوره الحقيقي. */
/* ═══ المعرِّفُ يُقرأ من المصادقة لا من الجلسة وحدَها ═══
   `STATE.meta.uid` يُملأ في مسار الدخول — ومن دخل ثم أُعيد تحميلُ الصفحة،
   أو دخل من مسارٍ آخر، بقي فارغًا والمصادقةُ عارفةٌ به. فيقول زرُّ الإصلاح
   «سجّل الدخول أوّلًا» لمن هو داخلٌ فعلًا، ويُرفَض كلُّ ما يكتب بلا مخرج:
   الوثيقةُ لا تُقرأ لأنه «غير مسجَّل»، ولا تُنشَأ لأن الزرَّ يرفض. */
function myUid(){
  if (STATE.meta.uid) return STATE.meta.uid;
  try {
    var u = FB.auth && FB.auth.currentUser;
    if (u && u.uid){ STATE.meta.uid = u.uid; return u.uid; }
  } catch (e){
    /* المصادقةُ إن لم تُهيَّأ بعدُ فليست عطلًا — لكنها تُسجَّل كي لا يُبتلَع
       سببُ بقاء المعرِّف فارغًا صامتًا. */
    if (typeof softErr === 'function') softErr('قراءة المعرِّف', e, '');
  }
  return '';
}
/* ═══ الحسابُ الذي ينتظر التفعيل (V17.93) ═══
   من سجّل نفسَه — أو عُطِّل — يعمل على جهازه ولا تقبل القاعدةُ رفعَه؛ فما
   يرفعه يُعزَل برفض صلاحيةٍ لا يُسقَط. تُقال الحالُ في لافتةٍ ثابتة، ويُتحقَّق
   في كلِّ نبضةٍ هل فعّله المكتب — فإن فُعِّل عاد المعزولُ إلى الطابور وحدَه. */
function meInactive(){
  var u = STATE.users && STATE.users[myUid()];
  return !!(u && u.active === false);
}
function meActivatedCheck(){
  if (!meInactive() || !STATE.meta.online) return Promise.resolve(false);
  return myDocFetch(true).then(function(has){
    if (!has || meInactive()) return false;
    var back = permRelease(true);
    logEvent('فُعِّل الحساب — ' + (back ? nm(back) + ' وثيقةً عادت للرفع' : 'لا معزول'));
    toast(t('فُعِّل حسابك — يُرفَع عملُك الآن'));
    render(1); return true;
  });
}
var MYDOC = { at:0, has:null, err:'' };
var PZ_ARM = 0;   /* ضغطةُ «أسقط الكل» الأولى — تُؤكَّد بثانية */
/* ═══ إصلاحُ السبب يُطلِق ما حُبس بسببه ═══
   الوثائقُ التي عُزلت لأن القاعدةَ رفضتها كانت تبقى معزولةً بعد زوال السبب:
   يُصلَح الحسابُ فلا يعود شيءٌ إلى الطابور، وينتظر صاحبُه أن يضغط ↻ على كلِّ
   واحدةٍ ولا يدري أن عليه ذلك. صار إصلاحُ الوثيقة يُعيد كلَّ ما عُزل برفضِ
   صلاحيةٍ إلى الطابور، ويُصفَّر تكتّمُ الرسائل، ويُدفَع الطابورُ فورًا. */
/* `now=false` حين يتولّى المنادي الدفعَ بنفسه: كانت هذه تجدول دفعةً بعد
   جزءٍ من الثانية، فتسبق دفعةَ المنادي أو تُعطِّلها بالقفل — فيقول الزرُّ
   «رُفع ٠» ثم يُرفَع فعلًا بعد لحظة، فيُقرأ الرقمُ كذبًا. */
function permRelease(now){
  var PZ = STATE.poison || [], back = 0;
  STATE.poison = PZ.filter(function(x){
    if (!/permission|insufficient|PERMISSION_DENIED/i.test(String(x.err || ''))) return true;
    CORE.dirty(x.kind, x.id, x.v); back++;
    return false;
  });
  /* التكتّمُ يُصفَّر: كان يُقال مرةً واحدةً في العمر، فلا يُقال بعد الإصلاح
     إن فشل شيءٌ آخر — ولا يُقال إنه نجح. */
  SOFT_SAID = {};
  if (back) logEvent('عادت للرفع بعد إصلاح الصلاحية — ' + nm(back) + ' وثيقة');
  CORE.saveLocal();
  if (now !== false && STATE.meta.online)
    setTimeout(function(){ CORE._busy = false; CORE.flush(); }, 200);
  return back;
}
function myDocFetch(force){
  if (!myUid()) return Promise.resolve(null);
  /* بلا شبكةٍ تبقى الحالةُ «تُقرأ…» إلى الأبد — فيُظنُّ أن القراءةَ معلّقةٌ
     وهي لم تبدأ. تُهيَّأ الوصلةُ إن أمكن، وإلا قيلت الحالُ كما هي. */
  if (!FB.ready || !FB.db){
    if (!STATE.meta.online){ MYDOC.err = 'offline'; return Promise.resolve(null); }
    return FB.init().then(function(ok){ return ok ? myDocFetch(true) : null; }).catch(function(){ return null; });
  }
  if (!force && Date.now() - MYDOC.at < 60000) return Promise.resolve(MYDOC.has);
  MYDOC.at = Date.now();
  return DB.col('users').doc(myUid()).get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + doc.size;
    MYDOC.has = !!(doc && doc.exists);
    if (MYDOC.has){
      STATE.users = STATE.users || {};
      STATE.users[myUid()] = Object.assign({}, doc.data());
    }
    return MYDOC.has;
  }).catch(function(e){
    MYDOC.err = String(e && (e.message || e.code) || e).slice(0, 120);
    return null;
  });
}
function myDocFix(){
  if (!myUid()){ toast(t('سجّل الدخول أولًا')); return; }
  /* «لا شبكة» كانت تُقال والشبكةُ متصلة: الوصلةُ تُحمَّل كسولًا، فمن ضغط
     قبل أوّل قراءةٍ من السحابة وجد الزرَّ يقول ما ليس صحيحًا. تُهيَّأ أوّلًا،
     ولا يُقال «لا شبكة» إلا حين لا تكون. */
  if (!FB.ready || !FB.db){
    if (!STATE.meta.online){ toast(t('لا شبكة')); return; }
    return FB.init().then(function(ok){
      if (!ok){ toast(t('لا شبكة')); return false; }
      return myDocFix();
    });
  }
  return DB.col('users').doc(myUid()).get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + doc.size;
    if (doc && doc.exists){
      STATE.users[myUid()] = Object.assign({}, doc.data());
      MYDOC.has = true;
      var back0 = permRelease(false);
      /* الزرُّ يُنهي العملَ لا يُخبر عنه: يقرأ ويُطلِق ويدفع ثم يقول ما بقي */
      CORE._busy = false;
      return CORE.flush().then(function(sent){
        toast(t('الوثيقةُ موجودةٌ')
              + (back0 ? ' \u00b7 ' + nm(back0) + ' ' + t('عادت للرفع') : '')
              + ' \u00b7 ' + t('رُفع') + ' ' + nm(sent || 0)
              + ' \u00b7 ' + t('بقي') + ' ' + nm(STATE.queue.length));
        render(1); return true;
      });
    }
    /* القاعدةُ لا تقبل لمن يسجّل نفسَه إلا «فنيًّا غيرَ فعّال» (V17.93): يعمل على
       جهازه ويُرفَع عملُه حين يفعّله المكتبُ — لا حسابَ فعّالًا لمن لا يعرفه أحد */
    /* صاحبُ المشروع ببريده فوق القاعدة: وثيقتُه مديرًا فعّالًا ويُطلَق ما حُبس — وغيرُه ينتظر التفعيل */
    var boss = typeof isBossHere === 'function' && isBossHere();
    var v = { name:STATE.meta.name || lgRemembered() || '', user:STATE.meta.name || '',
              role:boss ? 'admin' : 'tech', active:!!boss, at:Date.now(), self:true, _by:myUid(), _at:Date.now() };
    return DB.col('users').doc(myUid()).set(v).then(function(){
      STATE.users[myUid()] = v;
      MYDOC.has = true;
      if (boss){ var back1 = permRelease(true); logEvent('إنشاء وثيقة حساب صاحب المشروع — ' + myUid()); toast(t('الوثيقةُ موجودةٌ') + (back1 ? ' \u00b7 ' + nm(back1) + ' ' + t('عادت للرفع') : '')); render(1); return true; }
      ROLE = 'tech'; STATE.meta.role = 'tech';
      logEvent('إنشاء وثيقة حساب ذاتيًّا (ينتظر التفعيل) — ' + myUid());
      toast(t('أُنشئت وثيقةُ حسابك — تنتظر تفعيلَ المكتب، وعملُك يبقى على هذا الجهاز ويُرفَع بعد التفعيل'));
      render(1); return true;
    }).catch(function(e){
      softErr('إنشاء وثيقة الحساب', e, 'تعذّر إنشاءُ وثيقة حسابك — راجع المكتب');
      return false;
    });
  }).catch(function(e){
    softErr('قراءة وثيقة الحساب', e, 'تعذّرت قراءةُ وثيقة حسابك');
    return false;
  });
}
/* ═══ حالةُ النسخ الاحتياطي والدرايف — تُقرأ من المستودع ═══
   السيرُ اليوميُّ ينجح كلَّ يوم ويقول «نجح» — وهو لا يحفظ شيئًا حين تغيب
   الأسرار: يكتب أعدادًا ويتخطّى الرفعَ بإشعارٍ لطيفٍ لا يقرؤه أحد. فظُنَّ
   أن النسخَ يعمل وهو لا يعمل. صار يكتب حالتَه في ملفّين علنيَّين لا بياناتَ
   فيهما (_meta.json و_drive.json)، والتطبيقُ يقرؤهما ويعرضهما حيث يُرى:
   هل أُخذت نسخةُ اليوم؟ وهل وصلت درايف؟ وإن لا — ما الذي ينقص بالحرف. */
var BK_STATE = { at:0, meta:null, drive:null, err:'' };
var BK_RAW = 'https://raw.githubusercontent.com/mhmdsfwt371/-Project-survey/main/backups/latest/';
function bkFetch(force){
  if (!force && Date.now() - BK_STATE.at < 30 * 60 * 1000) return;
  BK_STATE.at = Date.now();
  if (typeof fetch !== 'function' || !navigator.onLine) return;
  var got = 0;
  ['_meta.json','_drive.json'].forEach(function(f){
    fetch(BK_RAW + f + '?t=' + Date.now(), { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if (f === '_meta.json') BK_STATE.meta = j; else BK_STATE.drive = j; got++; if (got === 2 && CUR === 'sys') render(1); })
      .catch(function(e){ BK_STATE.err = String(e && e.message || e); });
  });
}
/* ═══ (V38.8) «ما يعتمد على شخص» — الاستمراريةُ بنظرةٍ واحدة ═══
   من يخلف صاحبَ المشروع يحتاج أن يعرف من أوّل يوم: هل الجسرُ يُشغَّل؟ هل النسخُ يُؤخَذ؟ متى ينتهي مفتاحُ الدفع؟
   ومن البديلُ المسمّى لكلِّ موردٍ لا يملكه إلا واحد؟ البدائلُ تُكتَب هنا (settings/continuity) فتُرى لكلِّ المكتب. */
function contRes(){ return [['gh', 'GitHub — المستودع والأسرار'], ['fb', 'Firebase — القاعدة والحسابات'], ['nk', 'حساب نظام البطاقات (الجسر)'],
                ['bk', 'مفتاح النسخ الاحتياطي'], ['dec', 'قرارات الأوزان والسجلّ والاعتماد']]; }
function contLoad(){
  if (!FB.ready || !FB.db || (contLoad.at && Date.now() - contLoad.at < 60000)) return;
  contLoad.at = Date.now();
  DB.col('settings').doc('continuity').get().then(function(doc){ contLoad.d = (doc && doc.exists) ? doc.data() : {}; if (CUR === 'sys') render(1); })
    .catch(function(e){ softErr('الاستمرارية', e, ''); });
  if (!contLoad.dl && typeof fetch === 'function'){
    contLoad.dl = { items:[] };
    fetch('docs/deadlines.json', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if (j && j.items) contLoad.dl = j; if (CUR === 'sys') render(1); }).catch(function(e2){ LS_ERR = e2; });
  }
}
function contSave(){
  if (!may('perms')){ toast(t('تسميةُ البدائل للأدمن')); return; }
  var d = {}; contRes().forEach(function(r){ var el = document.getElementById('ct_' + r[0]); d[r[0]] = el ? String(el.value || '').trim() : ''; });
  d.at = Date.now(); d.by = STATE.meta.name || '';
  contLoad.d = d; contCard.ed = 0;
  CORE.set('cfg', 'continuity', d); CORE.saveSoon();
  logEvent('تسميةُ البدائل للموارد المعتمدة على شخص');
  toast(t('حُفظت البدائل')); render(1);
}
function contCard(){
  if (!may('settings')) return '';
  contLoad(); if (typeof extBridgeLoad === 'function') extBridgeLoad();
  var D = contLoad.d || {}, rows = [], now = Date.now();
  var B = (typeof EXT !== 'undefined') ? EXT.bridge : null, bh = B ? (now - B.at) / 3600000 : null;
  rows.push([esc(t('آخر جسر لنظام البطاقات')), B ? pill(bh < 12 ? 'حديث' : bh < 48 ? 'قديم' : 'متوقّف', bh < 12 ? 'ok' : bh < 48 ? 'warn' : 'bad') + ' ' + esc(pilotAgo(B.at)) + (B.by ? ' \u00b7 ' + esc(dispName(B.by)) : '') : pill('لم يُشغَّل', 'off')]);
  var m = BK_STATE.meta, ma = bkAgeDays(m);
  rows.push([esc(t('آخر نسخة احتياطية')), m ? pill(m.ok && ma <= 1 ? 'اليوم' : 'متأخرة', m.ok && ma <= 1 ? 'ok' : 'warn') + ' <span class="num">' + esc(String(m.at || '').slice(0, 10)) + '</span>' : '<span class="hint" style="margin:0">' + esc(t('يُقرأ…')) + '</span>']);
  var dl = ((contLoad.dl || {}).items || []).map(function(x){ return { at:x.at, what:x.what, d:Math.ceil((Date.parse(x.at) - now) / 86400000) }; })
    .filter(function(x){ return isFinite(x.d) && x.d >= 0; }).sort(function(a, b){ return a.d - b.d; });
  var key = dl.filter(function(x){ return /مفتاح الدفع/.test(x.what); })[0];
  rows.push([esc(t('انتهاء مفتاح الدفع')), key ? pill(key.d > 30 ? 'سليم' : 'يقترب', key.d > 30 ? 'ok' : 'bad') + ' <span class="num">' + esc(key.at) + '</span> \u00b7 ' + nm(key.d) + ' ' + esc(t('يوم')) : '\u2014']);
  if (dl[0]) rows.push([esc(t('أقرب موعد')), esc(dl[0].what) + ' \u00b7 <span class="num">' + esc(dl[0].at) + '</span> (' + nm(dl[0].d) + ' ' + esc(t('يوم')) + ')']);
  var named = contRes().filter(function(r){ return D[r[0]]; }).length;
  var res = contRes().map(function(r){
    return [esc(t(r[1])), contCard.ed && may('perms') ? '<input id="ct_' + r[0] + '" dir="auto" value="' + esc(D[r[0]] || '') + '" placeholder="' + esc(t('اسم البديل')) + '">'
      : (D[r[0]] ? esc(D[r[0]]) : pill('غير مسمّى', 'warn'))];
  });
  return card((named < contRes().length ? '\u26A0 ' : '\u{1F91D} ') + t('ما يعتمد على شخص'),
    table(['البند', 'الحالة'], rows)
    + '<h4 style="margin:12px 0 6px">' + esc(t('البدائل المسمّاة')) + ' (' + nm(named) + '/' + nm(contRes().length) + ')</h4>'
    + table(['المورد', 'البديل'], res)
    + (may('perms') ? '<div class="actions" style="margin:8px 0 0">' + (contCard.ed ? btn('\u2713 ' + t('احفظ البدائل'), 'btn-primary btn-sm', ' data-ctsave="1"') : btn('\u270F ' + t('سمِّ البدائل'), 'btn-secondary btn-sm', ' data-cted="1"')) + '</div>' : '')
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('التفاصيل في دليل التسليم §٧ وفي دليل العمليات (دورتا الجسر والربط).')) + '</p>');
}
function bkAgeDays(o){ return o && o.at ? Math.floor((Date.now() - new Date(o.at).getTime()) / 86400000) : null; }
function bkCard(){
  bkFetch(false);
  var m = BK_STATE.meta, dv = BK_STATE.drive;
  var rows = [];
  var mOk = !!(m && m.ok), dOk = !!(dv && dv.ok);
  var mAge = bkAgeDays(m), dAge = bkAgeDays(dv);
  rows.push([esc(t('نسخة القاعدة المشفَّرة')),
    m ? (mOk ? pill('أُخذت', mAge <= 1 ? 'ok' : 'warn') + ' <span class="num">' + esc(String(m.at).slice(0, 10)) + '</span>'
             : pill('لم تُؤخَذ', 'off'))
      : '<span class="hint" style="margin:0">' + esc(t('يُقرأ…')) + '</span>',
    m && !mOk ? esc(m.why || '') + (m.fix ? '<br><span class="hint" style="margin:0">' + esc(m.fix) + '</span>' : '')
              : (m ? nm(m.totalDocs || 0) + ' ' + esc(t('وثيقة')) : '')]);
  rows.push([esc(t('الرفع إلى درايف')),
    dv ? (dOk ? pill('وصل', dAge <= 1 ? 'ok' : 'warn') + ' <span class="num">' + esc(String(dv.day || dv.at).slice(0, 10)) + '</span>'
              : pill('لم يُرفَع', 'off'))
       : '<span class="hint" style="margin:0">' + esc(t('يُقرأ…')) + '</span>',
    dv && !dOk ? esc(dv.why || '') + (dv.fix ? '<br><span class="hint" style="margin:0">' + esc(dv.fix) + '</span>' : '')
               : (dv && dv.bytes ? esc(t('بيانات')) + ' ' + nm(Math.round((dv.bytes['backup-full.enc'] || dv.bytes['backup-full.json'] || 0) / 1024)) + ' ' + esc(t('ك.ب'))
                   + ' \u00b7 ' + esc(t('صور')) + ' ' + nm(Math.round((dv.bytes['photos.enc'] || dv.bytes['photos.json'] || 0) / 1024)) + ' ' + esc(t('ك.ب')) : '')]);
  var bad = (m && !mOk) || (dv && !dOk) || (mAge != null && mAge > 2);
  return card((bad ? '\u26A0 ' : '\u{1F5C4} ') + t('النسخ الاحتياطي والدرايف'),
      table(['ما يُنسَخ','آخر مرة','التفصيل'], rows)
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t('السيرُ يعمل يوميًّا الخامسةَ والنصفَ صباحًا. الملفّان علنيّان بلا بيانات — أعدادٌ وحالة؛ والنسخةُ نفسُها مشفَّرةٌ في المستودع وخامٌ في درايفك وحدَك.'))
      + '</p>'
      + (may('settings')
        ? '<div class="actions" style="margin-top:8px">' + btn('\u21BB ' + t('حدِّث الحالة'),'btn-quiet btn-sm',' data-bkref="1"') + '</div>'
        : ''));
}
