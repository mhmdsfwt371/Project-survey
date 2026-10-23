/* ============================================================================
   FILE    : src/03zz-late/03-survey--03-survey-records-02-install-points.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03-survey/03-survey-records-02-install-points.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : insPtsOf, insRecalcRun, disSchedule, disComplete
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* ═══ (V37.77) نقاطُ تركيبٍ بعينه تُقرأ من مكانٍ واحد ═══
   كانت أربعُ شاشاتٍ تقرأ الرقمَ المحفوظ مع التركيب مباشرةً، فتركيبٌ سُجِّل وأوزانُ القطع
   صفرٌ يبقى صفرًا فيها وإن ضُبطت الأوزانُ بعدُ — بينما ptsInstall تحسبه من قطعه. */
function insPtsOf(id){ return ptsInstall(siteFind(id) || { id:id, type:'' }); }

function insRecalcRun(){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var P = insRecalcPlan(); if (!P.ch.length){ toast(t('لا شيءَ يُعاد احتسابه')); return; }
  if (!confirm(t('ستتغيّر نقاطُ') + ' ' + P.ch.length + ' ' + t('تركيبًا') + ' (' + Math.round(P.before) + ' → ' + Math.round(P.after) + '). ' + t('متابعة؟'))) return;
  var by = STATE.meta.name || '', at = Date.now();
  P.ch.forEach(function(x){
    var r = STATE.inss[x.id]; if (!r) return;
    CORE.set('inss', x.id, Object.assign({}, r, { pts:x.nw, ptsRe:{ at:at, by:by, old:x.old } }));
  });
  logEvent('إعادةُ احتساب نقاط التركيب — ' + P.ch.length + ' تركيب · ' + Math.round(P.before * 100) / 100 + ' ← ' + Math.round(P.after * 100) / 100);
  toast(t('أُعيد احتسابُ نقاط التركيب') + ' (' + nm(P.ch.length) + ')'); render(1);
}

function disSchedule(id){
  if (!may('edit')){ toast(t('جدولةُ الفك تحتاج صلاحية تعديل')); return; }
  /* لا يُفَكُّ ما لم يُركَّب: كان يُجدوَل أيُّ معرّفٍ يُمرَّر، فتظهر في جدول
     الفكِّ نقاطٌ لم يُوضَع فيها جهازٌ قط، ويُرسَل إليها طاقم. */
  var r0 = STATE.inss[id];
  if (!r0 || r0.status !== 'مُركّب' || !r0.approved){
    toast(t('الفكُّ يتاح بعد اعتماد تركيب النقطة'));
    return;
  }
  if (!STATE.diss) STATE.diss = {};
  STATE.diss[id] = { id:id, status:'مجدول', at:Date.now(), by:STATE.meta.name || '' };
  CORE.set('diss', id, STATE.diss[id]);
  logEvent('جدولة فك — ' + id, id);
  statBump(); toast(t('جُدوِل للفك')); render(1);
}

function disComplete(id, cond){
  if (!may('edit')){ toast(t('إتمامُ الفك يحتاج صلاحية تعديل')); return; }
  var sched = STATE.diss && STATE.diss[id];
  if (!sched || sched.status !== 'مجدول'){
    toast(t('جدوِل الفكَّ أولًا قبل إتمامه')); return;
  }
  var x = siteFind(id);
  STATE.diss[id] = { id:id, status:'تم الفك', cond:cond, at:Date.now(),
                     by:STATE.meta.name || '', pts:x ? ptsDis(x) : 0 };
  CORE.set('diss', id, STATE.diss[id]);
  /* العُهدةُ ترجع: السليمُ للمخزن والتالفُ يُعزَل — بمعرّفٍ فريدٍ لكل
     صنفٍ لا معرّف الموقع نفسِه، وإلا كتب صنفٌ فوق آخر في القاعدة. */
  var ins = STATE.inss[id];
  STATE.moves = STATE.moves || [];
  if (ins && ins.parts) Object.keys(ins.parts).forEach(function(k){
    var mv = { id:uid36(), at:dayKey(),
               kind: cond === 'تالف' ? 'إرجاع تالف' : 'إرجاع سليم',
               item:k, qty:ins.parts[k], by:STATE.meta.name || '—', site:id, cond:cond };
    STATE.moves.push(mv);
    CORE.dirty('moves', mv.id, mv);
  });
  logEvent('فك ' + cond + ' — ' + id, id);
  statBump(); toast(t('تم الفك') + ' · ' + t(cond)); render(1);
}
