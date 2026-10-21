/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-07-layers-dismantle-svedit.js
   DOMAIN  : Catalogue & point — definitions, classification, permissions, survey edit
   PURPOSE : Three map layers (what each shows and assigns), dismantle and maintenance forms, the brief line on visit documents, and editing a survey without redoing it (svq*).
   DEFINES : disSave, maintList, maintSave, maintDone, maintDel, LAYER, svqMay, svqKeys, svqLabel, svqFmt, svqEditor, svqSheet, svqPhotoCount, svqKindLabel … (+5 more)
   GLOBALS : LAYERS, DISF, MNTF, DIS_COND, SVQ, TYPES_OPEN, SVQ_NUM, SVQ_OPT, SVQ_TEXT, BRIEF_ST
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الطبقات الثلاث — لكلٍّ ما تُظهر وما تُسند ═══
   المسحُ يرى الكلَّ ويُسند زيارة، والتركيبُ لا يرى إلا ما مُسح ويُسند تركيبًا،
   والفكُّ لا يرى إلا ما رُكِّب ويُسند فكًّا. فلا يُجدوَل عملٌ قبل ما يسبقه. */

var LAYERS = {
  survey: {
    n:'المسح', i:'\u{1F50D}', kind:'visit', c:'#4FA3FF',
    d:'كلُّ النقاط — تُحدَّد وتُسند زيارةً ميدانية.',
    pass:function(){ return true; },
    ready:function(x){ return !svDone(STATE.recs[x.id]); },
    done:function(x){ return svDone(STATE.recs[x.id]); },
    pts:function(x){ return ptsSurvey(x); },
    empty:'لا نقاط في هذا الترشيح.'
  },
  install: {
    n:'التركيب', i:'\u{1F527}', kind:'install', c:'#3AD6A0',
    d:'ما مُسح واعتُمد حلُّه وحده — يُجدوَل ويُسند تركيبًا.',
    /* كانت الطبقةُ تشترط المسحَ وحدَه بينما بوابةُ الإسناد (asnCommit)
       تشترط معه حلًّا معتمدًا — فتقول اللوحةُ «نقطتان جاهزتان» ثم يُسنِدهما
       المشرفُ فتُفلتَران كلتاهما ولا يفهم لماذا. صار الشرطُ واحدًا في
       الموضعين: لا تُعرَض جاهزةً إلا ما يُقبَل فعلًا. */
    pass:function(x){
      if (!svDone(STATE.recs[x.id])) return false;
      var so = solutionOf(x.id);
      return !!so && so.status === 'معتمد';
    },
    ready:function(x){ return !insDone(x.id); },
    done:function(x){ return insDone(x.id); },
    pts:function(x){ return ptsInstall(x); },
    empty:'لا نقطةَ حلُّها معتمد — التركيبُ لا يُجدوَل قبل اعتماد حلِّه في «حل التركيب».'
  },
  /* ═══ التفاصيلُ المختصرة — طبقةُ الوزارة (V16.88) ═══
     الوزارةُ تسأل بعد الزيارة: ما الذي وقع في هذه النقطة؟ والجوابُ كان في
     نموذج مسحٍ طويلٍ لا يفتحه غيرُ من ملأه. فصارت طبقةً رابعةً بجوار المسح
     والتركيب والفك: سطرٌ واحدٌ لكلِّ نقطةٍ زارها الميدان — «تمام» أو «تحدٍّ»
     أو «ملاحظة» — بلونه، تُضغَط النقطةُ فتُقرأ. والسطرُ يُكتَب على وثيقة
     الزيارة نفسِها (bst وbrief) لا في مجموعةٍ جديدة: يُزامَن ويُنسَخ احتياطيًّا
     ويُحكَم بقواعده كما هي — والزيارةُ هي صاحبةُ الخبر. */
  brief: {
    n:'تفاصيل مختصرة', i:'\u{1F4DD}', kind:'brief', c:'#E8C34B',
    d:'ما وقع في كلِّ نقطةٍ زارها الميدان — سطرٌ يُقرأ بلونه: تمام · تحدٍّ · ملاحظة.',
    /* كلُّ نقطةٍ نزل إليها الميدانُ — تمّت أو تعذّرت أو رُدّت: الشاشةُ تقول
       ما وقع، والمتعذّرُ خبرٌ كالمنجَز (V16.95) */
    pass:function(x){ return !!STATE.recs[x.id]; },
    ready:function(x){ return !briefOf(x.id); },
    done:function(x){ return !!briefOf(x.id); },
    pts:function(x){ return ptsSurvey(x); },
    empty:'لا زيارةَ تمّت بعد — التفاصيلُ تُكتَب على الزيارة.'
  },
  dis: {
    n:'الفك', i:'\u{1F9E9}', kind:'dis', c:'#C77DFF',
    d:'ما سُلِّم للعميل وحده — يُجدوَل للفك وإرجاع العُهدة.',
    /* الفكُّ إرجاعُ ما سُلِّم: لا يُفَكُّ ما لم يُحرَّر محضرُ تسليمه، وإلا
       فُكَّ ما لم يُسلَّم أصلًا فلا يُعرَف ما الذي أُرجع ومن سلَّمه. */
    pass:function(x){ return handDone(x.id); },
    ready:function(x){ return !disDone(x.id); },
    done:function(x){ return disDone(x.id); },
    pts:function(x){ return ptsDis(x); },
    empty:'لا نقطةَ سُلِّمت بعد — الفكُّ إرجاعُ ما سُلِّم، ويُحرَّر محضرُ التسليم في «التسليم والضمان».'
  }
};



/* ═══ الفكُّ والصيانة: نموذجان كانا ناقصَين ═══
   كان يُسنَد فكٌّ (UR) وصيانةٌ (MR) من الخريطة ومن التوزيع — ثم لا يجد
   الفنيُّ أين يُسجّل ما فعل. فلا تُغلَق المهمةُ، ولا تُرجَع العُهدةُ، ولا
   تُحتسَب نقاطٌ، ولا يُعرَف من صان ماذا. صار لكلٍّ نموذجُه:
     الفكُّ يُرجِع القطعَ بحالتها (سليم/تالف/مفقود) — فما سلِم يعود مخزونًا
   وما تلِف يُشطَب، ولا يُفكُّ إلا ما سُلِّم بمحضر.
     والصيانةُ تُسجَّل زيارةً بعد زيارة: عطلُها وما عُمل وما استُبدل — فتُخصَم
   القطعُ من العهدة، ويبقى للنقطة تاريخُ خدمة. */
var DISF = { site:'', items:{}, note:'', photos:{} };
var MNTF = { site:'', fault:'', act:'', parts:{}, note:'', photos:{} };
var DIS_COND = ['سليم','تالف','مفقود'];

function disSave(){
  var id = DISF.site;
  if (!id){ toast(t('اختر النقطة أولًا')); return; }
  if (!may('edit')){ toast(t('تسجيلُ الفك يحتاج صلاحية تعديل')); return; }
  var ins = STATE.inss[id];
  if (!ins || !insDone(id)){ toast(t('لا تركيبَ معتمدًا على هذه النقطة')); return; }
  if (typeof handDone === 'function' && !handDone(id)){
    toast(t('لم تُسلَّم بمحضر — الفكُّ إرجاعُ ما سُلِّم')); return;
  }
  if (disDone(id)){ toast(t('فُكَّت من قبل')); return; }
  var back = {}, n = 0;
  Object.keys(ins.parts || {}).forEach(function(k){
    var c = DISF.items[k] || 'سليم';
    back[k] = { qty:cfgN(ins.parts[k]), cond:c }; n += cfgN(ins.parts[k]);
  });
  if (!n){ toast(t('لا قطعَ مسجَّلةً على هذه النقطة')); return; }
  if (!DISF.photos.after){ toast(t('صورةُ الموضع بعد الفكِّ مطلوبة')); return; }
  var rec = { id:id, status:'تم الفك', items:back, note:DISF.note,
              by:STATE.meta.name || '', at:Date.now(), photos:Object.keys(DISF.photos) };
  STATE.diss = STATE.diss || {};
  STATE.diss[id] = rec;
  CORE.set('diss', id, rec);
  Object.keys(DISF.photos).forEach(function(k){
    if (typeof photoQueue === 'function') photoQueue(id, 'dis_' + k, DISF.photos[k].data);
  });
  /* ما سلِم يعود مخزونًا وما تلِف يُشطَب — والعهدةُ تُقفَل بالحالة لا بالعدد */
  Object.keys(back).forEach(function(k){
    var b = back[k];
    /* (V38.69) each return is its own ledger document — the summary «dis-<point>» never reached the office as a movement */
    mvWrite({ id:'dis-' + id + '-' + k, at:Date.now(), ts:Date.now(),
      kind: b.cond === 'سليم' ? 'إرجاع' : 'شطب',
      item:k, qty:b.qty, by:rec.by, site:id, note:'فك ' + id, dis:1 });   /* (V37.99) بالرمز كالتركيب — فيُقابل استهلاكَه في صفٍّ واحد، ومِن «رُكّب» لا من العهدة */
  });
  /* المهمةُ تُغلَق: لا يبقى فكٌّ مفتوحٌ على نقطةٍ فُكَّت */
  var tk = taskKindOf(id, 'dis');
  if (tk){ tk.status = 'معتمد'; tk.doneAt = Date.now(); CORE.set('tasks', tk.id, tk); }
  logEvent('فك — ' + id + ' \u00b7 ' + nm(n) + ' قطعة', id);
  if (typeof chSystem === 'function') chSystem(id, 'فُكَّت النقطة — ' + (STATE.meta.name || '') + ' \u00b7 ' + nm(n) + ' ' + t('قطعة'), '');   /* (V38.65) the point's history keeps its dismantling */
  stepDone('dis', id, nm(n) + ' ' + t('قطعة'), 0);
  toast(t('سُجِّل الفكُّ وأُرجعت العُهدة'));
  DISF = { site:'', items:{}, note:'', photos:{} };
  statBump(); render(1);
}
/* الشكلُ المخزَّنُ كائنٌ {id,list} لأن CORE.set يكتب الوثيقةَ في مكانها —
   فما وُضع مصفوفةً يعود كائنًا بعد أوّل حفظ. تُقرأ الحالتان. */
function maintList(id){
  var L = (STATE.maints || {})[id];
  if (Array.isArray(L)) return L;
  return (L && Array.isArray(L.list)) ? L.list : [];
}
function maintSave(){
  var id = MNTF.site;
  if (!id){ toast(t('اختر النقطة أولًا')); return; }
  if (!may('edit')){ toast(t('تسجيلُ الصيانة يحتاج صلاحية تعديل')); return; }
  if (!insDone(id)){ toast(t('الصيانةُ لما رُكِّب واعتُمد')); return; }
  if (!MNTF.fault){ toast(t('اكتب العطل')); return; }
  if (!MNTF.act){ toast(t('اكتب ما عُمل')); return; }
  var used = {}, n = 0;
  Object.keys(MNTF.parts || {}).forEach(function(k){
    var q = cfgN(MNTF.parts[k]); if (q > 0){ used[k] = q; n += q; }
  });
  var rec = { at:Date.now(), by:STATE.meta.name || '', fault:MNTF.fault,
              act:MNTF.act, parts:used, note:MNTF.note, photos:Object.keys(MNTF.photos) };
  STATE.maints = STATE.maints || {};
  var L2 = maintList(id).concat([rec]);
  STATE.maints[id] = { id:id, list:L2 };
  CORE.set('maints', id, STATE.maints[id]);
  Object.keys(MNTF.photos).forEach(function(k){
    if (typeof photoQueue === 'function') photoQueue(id, 'mnt_' + Date.now() + '_' + k, MNTF.photos[k].data);
  });
  Object.keys(used).forEach(function(k){
    /* (V38.72) the maintenance's parts reach the office ledger — they were pushed on this phone only */
    mvWrite({ id:'mt-' + id + '-' + k + '-' + Date.now().toString(36), at:Date.now(), ts:Date.now(), kind:'استهلاك',
      item:itemName(k), qty:used[k], by:rec.by, site:id, note:'صيانة ' + id });
  });
  var tk = taskKindOf(id, 'maint');
  if (tk){ tk.status = 'معتمد'; tk.doneAt = Date.now(); CORE.set('tasks', tk.id, tk); }
  logEvent('صيانة — ' + id + ' \u00b7 ' + MNTF.fault.slice(0, 40) + (n ? ' \u00b7 ' + nm(n) + ' قطعة' : ''));
  stepDone('maint', id, MNTF.fault.slice(0, 36), 0);
  toast(t('سُجِّلت الصيانة'));
  MNTF = { site:'', fault:'', act:'', parts:{}, note:'', photos:{} };
  statBump(); render(1);
}
function maintDone(id){ return maintList(id).length > 0; }
/* (V29.5) قيدُ صيانةٍ يُحذف للمهندس والمدير (قرارُ المالك) — بتأكيد، ويبقى أثرُه في سجل الأحداث؛ والقطعُ المستهلَكةُ تبقى حركةً في المخزون */
function maintDel(id, at){
  if (rankOf(ROLE) < rankOf('engineer')){ toast(t('حذفُ الصيانة للمهندس والمدير')); return; }
  var L = maintList(id), r = L.filter(function(x){ return String(x.at) === String(at); })[0]; if (!r) return;
  if (!confirm(t('حذفُ قيد الصيانة') + ' ' + id + ' \u2014 «' + String(r.fault || '').slice(0, 40) + '»؟')) return;
  var L2 = L.filter(function(x){ return x !== r; });
  STATE.maints = STATE.maints || {};
  STATE.maints[id] = { id:id, list:L2 }; CORE.set('maints', id, STATE.maints[id]);
  logEvent('حذف قيد صيانة — ' + id + ' \u00b7 ' + String(r.fault || '').slice(0, 40) + ' \u00b7 ' + (r.by || ''));
  toast(t('حُذف قيدُ الصيانة')); render(1);
}
function LAYER(){ return LAYERS[FIELD_MODE] || LAYERS.survey; }

/* ═══ التفاصيلُ المختصرة: حالةٌ وسطرٌ على وثيقة الزيارة ═══ */
/* ═══ تعديلُ المسح بلا إعادته (V22.3) ═══
   «لو بعدّل عرضَ البوابة أقدر أعدّلها دون تعديل كامل المسح والصور — أضغط الشاخص وأختار
   تعديلَ المسح وأحطّ اللي بعدّله ويتعدّل على طول». من نافذة النقطة المزارة: قائمةٌ بحقول
   الزيارة المكتوبة، وكلُّ حقلٍ يُعدَّل وحدَه ويُحفَظ فورًا — الصورُ وبقيةُ الحقول وصاحبُ الزيارة
   وتاريخُها كما هي. ويُسجَّل التعديلُ في الزيارة نفسِها (من، ومتى، ومن أيِّ قيمةٍ إلى أيّ) وفي
   سجلّ الأحداث. والمسحُ المعتمدُ إذا عدّله غيرُ المهندس عاد لانتظار الاعتماد — القاعدةُ لا تسمح
   لغيره بالكتابة على المعتمد، والتغييرُ على المعتمد يراه صاحبُ الاعتماد؛ ويُنبَّه المهندسُ في الحالين. */
var SVQ = { id:'', key:'', tmp:null, delAsk:'' };
var TYPES_OPEN = false;   /* بطاقةُ التصنيفات في «المواقع» مطويّةٌ حتى تُفتَح (V23.0) */
var SVQ_NUM = { len_m:1, wid_m:1, hgt_m:1, height:1, cable:1, tents:1, gates:1, corr_w:1, pdist:1, n_ant:1, n_rdr:1, n_cam:1, n_sens:1, hours:1, crew_n:1, kits:1, kits_done:1 };
var SVQ_OPT = { mount:['عمود','جدار','سور','هيكل قائم'], power:['شبكة','مولد','طاقة شمسية','لا يوجد'] };   /* (V38.25) «موقع النقطة» شرائحُ متعدّدةٌ لا قائمة */
var SVQ_TEXT = { note:1, chal_note:1, power_note:1, civil:1, equip:1 };
function svqMay(id){ var r = STATE.recs[id]; return !!r && !r.deleted && may('edit'); }
function svqKeys(rec){
  var ks = SV_ORDER.filter(function(k){ return k !== 'access' && rec[k] !== undefined && rec[k] !== null && rec[k] !== ''; });
  if (Array.isArray(rec.chals)) ks.splice(Math.min(ks.length, 3), 0, 'chals');
  /* (V38.20) وصفُ التحدي يظهر صفًّا للتعديل متى كان في الزيارة تحدٍّ — ولو لم يُكتَب بعد */
  /* (V38.23) «موقع النقطة» صفٌّ في كلِّ زيارةٍ وُصل فيها — تُضاف لزياراتٍ سابقةٍ لم تكن فيها */
  if (rec.access === 'تم الوصول' && ks.indexOf('loc') < 0 && locApplies(siteFind(rec.id))){ var mi = ks.indexOf('mount'); ks.splice(mi > -1 ? mi + 1 : 0, 0, 'loc'); }   /* (V38.24) للممرات والجمرات */
  var hasCh = (rec.chals || []).some(function(c){ return c && c !== 'لا توجد تحديات'; });
  if (hasCh && ks.indexOf('chal_note') < 0){ var ci = ks.indexOf('chals'); ks.splice(ci > -1 ? ci + 1 : ks.length, 0, 'chal_note'); }
  return ks;
}
function svqLabel(k){ if (String(k).indexOf('ph:') === 0) return 'صورة: ' + svqKindLabel(k.slice(3)); return k === 'chals' ? 'تحديات التركيب' : (SV_LABELS[k] || k); }
function svqFmt(v){ return Array.isArray(v) ? v.map(function(x){ return t(x); }).join(' \u00b7 ') : (v === '' || v == null ? '\u2014' : (typeof v === 'number' ? nm(v) : t(String(v)))); }
function svqEditor(k, rec, s){
  var v = rec[k];
  if (k === 'loc'){
    /* (V38.25) شرائحُ متعدّدةٌ كالتحديات — «لا شيء مما سبق» يُفرغ الباقي */
    var selL = SVQ.tmpL || locList(rec.loc);
    return '<p class="hint" style="margin:2px 0 6px">' + esc(t('اختر كل ما ينطبق')) + '</p><div class="chips" style="margin:4px 0 0">'
      + locOpts().map(function(o){ return '<button type="button" class="chip' + (selL.indexOf(o) > -1 ? ' on' : '') + '" data-svqloc="' + esc(o) + '">' + esc(t(o)) + '</button>'; }).join('') + '</div>';
  }
  if (k === 'chals'){
    /* (V38.20) قائمةُ التعديل كانت القديمةَ (بـ«أخرى — اذكرها في وصف التحدي») وقائمةُ المسح هي الفئاتُ الثماني — فصارت واحدة،
       ومعها «وصفُ التحدي بالتفصيل» في الموضع نفسِه: كان لا يظهر في التعديل إلا إن كُتب من قبل */
    var sel = SVQ.tmp || chalsToCats(rec.chals, rec.chal_note || rec.note);
    var noteV = SVQ.note != null ? SVQ.note : (rec.chal_note || '');
    var real = sel.filter(function(c){ return c && c !== 'لا توجد تحديات'; }).length;
    var oth = sel.indexOf(chalOther()) > -1;
    return '<p class="hint" style="margin:2px 0 6px">' + esc(t('اختر واحدًا أو أكثر — والتحدي مش في القائمة؟ اختر «أخرى» واكتب وصفه.')) + '</p>'
      + '<div class="chips" style="margin:4px 0 0">' + chalNames().map(function(c){ return '<button type="button" class="chip' + (sel.indexOf(c) > -1 ? ' on' : '') + '" data-svqch="' + esc(c) + '"' + (c === chalOther() ? ' style="border-style:dashed"' : '') + '>' + esc(t(c)) + '</button>'; }).join('') + '</div>'
      + (real ? '<div class="field" style="margin:10px 0 0"><label>' + esc(t('وصف التحدي بالتفصيل')) + ' '
          + (oth ? '<span class="req">*</span> <span class="hint" style="margin:0;font-weight:400">' + esc(t('مطلوب مع «أخرى»')) + '</span>' : '<span class="hint" style="margin:0;font-weight:400">' + esc(t('اختياري')) + '</span>')
          + '</label><textarea id="svqNote" rows="3" dir="auto" placeholder="' + esc(t('مثال: الجدار مائل ولا يتحمّل الحامل — نحتاج عمودًا بارتفاع ٣ م')) + '"' + (SVQ.err ? ' style="border-color:var(--bad,#e05252)"' : '') + '>' + esc(noteV) + '</textarea></div>'
          + (SVQ.err ? alertBox('bad', t(SVQ.err)) : '') : '');
  }
  if (SVQ_OPT[k]) return '<select id="svqIn">' + SVQ_OPT[k].filter(function(o){ return k !== 'mount' || o !== 'لوحة استرشادية' || locApplies(s) || v === o; }).map(function(o){   /* (V38.24) */ return '<option value="' + esc(o) + '"' + (v === o ? ' selected' : '') + '>' + esc(t(o)) + '</option>'; }).join('') + '</select>';
  if (v === 'نعم' || v === 'لا') return '<select id="svqIn">' + ['نعم','لا'].map(function(o){ return '<option value="' + o + '"' + (v === o ? ' selected' : '') + '>' + esc(t(o)) + '</option>'; }).join('') + '</select>';
  if (SVQ_NUM[k]) return '<input id="svqIn" type="number" step="0.1" min="0" inputmode="decimal" value="' + esc(v) + '">';
  if (SVQ_TEXT[k]) return '<textarea id="svqIn" rows="3" dir="auto">' + esc(v) + '</textarea>';
  return '<input id="svqIn" dir="auto" value="' + esc(v) + '">';
}
function svqSheet(){
  if (!SVQ.id) return '';
  var rec = STATE.recs[SVQ.id], s = siteFind(SVQ.id);
  if (!rec || !s || !svqMay(SVQ.id)){ SVQ.id = ''; return ''; }
  var boss = rankOf(ROLE) >= rankOf('engineer'), appr = rec.review === 'approved';
  var rows = svqKeys(rec).map(function(k){
    if (SVQ.key === k){
      return '<div class="svq-row on"><div class="svq-k">' + esc(t(svqLabel(k))) + '</div>' + svqEditor(k, rec, s)
        + '<div class="actions" style="margin:8px 0 0">' + btn('\u2713 ' + t(k === 'chals' ? 'احفظ التحديات والوصف' : 'احفظ هذا الحقل'), 'btn-primary btn-sm', ' data-svqsave="1"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-svqcancel="1"') + '</div></div>';
    }
    return '<div class="svq-row"><div class="svq-k">' + esc(t(svqLabel(k))) + '</div><div class="svq-v">' + esc(svqFmt(rec[k])) + '</div>'
      + btn('\u270E', 'btn-quiet btn-sm', ' data-svqk="' + esc(k) + '" aria-label="' + esc(t('عدّل')) + ' ' + esc(t(svqLabel(k))) + '"') + '</div>';
  }).join('');
  var hist = (Array.isArray(rec.edits) ? rec.edits : []).slice(-5).reverse().map(function(e){
    return '<li><span class="hint" style="margin:0">' + esc(fmtDT(e.at)) + ' \u00b7 ' + esc(dispName(e.by)) + '</span> — ' + esc(t(svqLabel(e.k))) + ': ' + esc(svqFmt(e.o)) + ' \u2190 ' + esc(svqFmt(e.v)) + '</li>';
  }).join('');
  return '<div class="svq-back" id="svqSheet" role="dialog" aria-modal="true"><div class="svq-box">'
    + '<div class="svq-h"><div><b>\u270E ' + esc(t('تعديل المسح')) + '</b><div class="hint" style="margin:2px 0 0"><span class="num">' + esc(siteKey(s)) + (siteKey(s) !== s.id ? ' \u00b7 ' + esc(s.id) : '') + '</span> \u00b7 ' + esc(s.name) + '</div></div>'
    + '<button type="button" class="npop-x" data-svqx="1" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<p class="hint" style="margin:6px 0 10px">' + esc(t(appr && !boss ? 'هذا المسحُ معتمد — تعديلُ أيِّ حقلٍ يعيده لانتظار اعتماد المهندس.' : 'اختر الحقلَ الذي تعدّله — يُحفَظ وحدَه، وتبقى الصورُ وبقيةُ المسح كما هي، ويُسجَّل التعديلُ باسمك.')) + '</p>'
    + (rows || '<p class="hint">' + esc(t('لا حقولَ مكتوبةً في هذه الزيارة — افتح نموذجَ المسح.')) + '</p>')
    + svqPhotos(rec)
    + (may('approve') ? '<div class="actions" style="margin-top:10px">' + btn('\u21AA ' + t('انقل هذه الزيارة إلى نقطتها الصحيحة'), 'btn-secondary btn-sm', ' data-svqmove="' + esc(rec.id) + '"') + '</div>' : '')   /* (V38.70) */
    + (hist ? '<div class="wp-sec" style="margin-top:10px">' + esc(t('آخر التعديلات')) + '</div><ul class="wp-steps">' + hist + '</ul>' : '')
    + '<div class="actions" style="margin:14px 0 0">' + btn('\u2715 ' + t('إغلاق'), 'btn-secondary', ' data-svqx="1" style="width:100%"') + '</div>'
    + '</div></div>';
}
/* (V22.3→V22.7) «لا يسمح لي بتعديل الصور»: صارت الصورُ في اللوح نفسِه — كلُّ خانةٍ تُستبدَل صورتُها
   أو تُضاف وحدَها، وتُضغَط على الجهاز وتُرفَع كصور النموذج، ويُسجَّل التعديلُ كغيره */
function svqPhotoCount(id){
  var n = (typeof photosOf === 'function' ? photosOf(id) : []).filter(function(p){ return !(p[1] || {}).del; }).length;
  (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q : []).forEach(function(q){ if (q && q.site === id) n++; });
  return n;
}
function svqKindLabel(k){ if (k === 'extra') return 'صورة إضافية'; var q = SV_PHOTOS.filter(function(p){ return p[0] === k; })[0]; return q ? q[1] : (k || 'صورة'); }
function svqCanDel(p, rec){ if (may('delete')) return true; return !!p && p.by === (STATE.meta.name || '') && (rec || {}).review !== 'approved'; }
/* (V22.8) «مش عارف أمسح صور وأزوّد صور جديدة»: صورُ الزيارة نفسُها بمصغّراتها — كلُّ صورةٍ تُحذَف
   (المهندسُ أيَّ صورة، والرافعُ صورتَه ما لم تُعتمَد الزيارة) بتأكيدٍ ثانٍ، وما في طابور الجهاز يُلغى،
   وتُضاف صورٌ جديدةٌ (واحدةٌ أو أكثر) بنوعها أو «صورة إضافية» — والحذفُ علامةٌ مسجَّلةٌ لا محوٌ صامت */
function svqPhotos(rec){
  /* (V38.61) the visit's photos only — the installation's are edited in «تعديل التركيب» */
  var id = rec.id, list = (typeof photosOf === 'function' ? photosOf(id) : []).filter(function(p){ return !(p[1] || {}).del && !/^ins/.test(String((p[1] || {}).kind || '')); });
  var q = (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q : []).map(function(x, i){ return [i, x]; }).filter(function(e){ return e[1] && e[1].site === id && !/^ins/.test(String(e[1].kind || '')); });
  var row = function(thumb, label, sub, act){ return '<div class="svq-row"><div class="svq-ph">' + thumb + '</div><div class="svq-k" style="flex:1 1 50%"><b style="color:var(--ink)">' + esc(t(label)) + '</b><div class="hint" style="margin:0;font-size:11.5px">' + sub + '</div></div>' + act + '</div>'; };
  var img = function(d){ return d ? '<img src="' + esc(d) + '" alt="" loading="lazy">' : '<span>\u{1F5BC}</span>'; };
  var h = '<div class="wp-sec" style="margin-top:12px">' + esc(t('صور الزيارة')) + ' \u00b7 ' + nm(list.length + q.length) + '</div>';
  h += list.map(function(p){
    var ph = p[1] || {}, ask = SVQ.delAsk === p[0];
    var act = svqCanDel(ph, rec)
      ? (ask ? btn(t('تأكيد الحذف'), 'btn-sm', ' data-svqdel="' + esc(p[0]) + '" style="background:#C0392B;color:#fff"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-svqdelx="1"')
             : btn('\u{1F5D1} ' + t('احذف'), 'btn-quiet btn-sm', ' data-svqdelask="' + esc(p[0]) + '"'))
      : '<span class="hint" style="margin:0;font-size:11px">' + esc(t('حذفُها للمهندس')) + '</span>';
    return row(img(ph.data || ph.thumb || ''), svqKindLabel(ph.kind), esc(fmtDT(ph.at)) + (ph.by ? ' \u00b7 ' + esc(dispName(ph.by)) : '') + (ph.link || ph.driveId ? ' \u00b7 ' + esc(t('على الدرايف')) : ''), act);
  }).join('');
  h += q.map(function(e){
    return row(img(e[1].data), svqKindLabel(e[1].kind), esc(t('في طابور جهازك — تُرفَع مع المزامنة')), btn('\u2715 ' + t('ألغِها'), 'btn-quiet btn-sm', ' data-svqqx="' + e[0] + '"'));
  }).join('');
  if (!list.length && !q.length) h += '<p class="hint">' + esc(t('لا صورَ لهذه الزيارة بعد.')) + '</p>';
  h += '<div class="svq-add"><label style="flex:1 1 55%">' + esc(t('نوع الصورة')) + '<select id="svqPhKind">'
    + SV_PHOTOS.map(function(p){ return '<option value="' + esc(p[0]) + '">' + esc(t(p[1])) + '</option>'; }).join('')
    + '<option value="extra" selected>' + esc(t('صورة إضافية')) + '</option></select></label>'
    + '<label class="btn btn-primary btn-sm" style="cursor:pointer;align-self:flex-end">\u{1F4F7} ' + esc(t('أضف صورة'))
    + '<input type="file" accept="image/*" multiple data-svqadd="1" style="display:none" aria-label="' + esc(t('أضف صورة')) + '"></label></div>'
    + '<p class="hint" style="margin:6px 0 0">' + esc(t('لاستبدال صورةٍ: احذف القديمةَ وأضف الجديدةَ بنوعها. والحذفُ يُسجَّل باسمك ولا يُمحى أثرُه.')) + '</p>';
  return h;
}
function svqPhotoDel(photoId){
  var p = (STATE.photos || {})[photoId], rec = p ? STATE.recs[p.site] : null;
  if (!p || !rec || p.del) return false;
  if (!svqCanDel(p, rec)){ toast(t('حذفُ هذه الصورة للمهندس')); return false; }
  var boss = rankOf(ROLE) >= rankOf('engineer'), now = Date.now(), who = STATE.meta.name || '';
  if (may('delete') && typeof photoDelete === 'function') photoDelete(photoId, 'من تعديل المسح');
  else {
    var dr = { site:p.site, kind:p.kind, at:p.at, by:p.by || p._by || '', del:{ by:who, at:now, why:'حذفها رافعُها من تعديل المسح' } };
    STATE.photos[photoId] = dr; CORE.set('photos', photoId, dr);  phTouch();   /* (V37.22) */
    logEvent('حذف صورة — ' + photoId + ' · من تعديل المسح', p.site);
  }
  var n = Object.assign({}, rec);
  n.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ k:'ph:' + (p.kind || 'extra'), o:'صورة', v:'حُذفت', by:who, at:now }]).slice(-30);
  n.eAt = now; n.eBy = who;
  var left = svqPhotoCount(p.site);
  n.phN = left;
  if (p.kind && !(typeof photosOf === 'function' ? photosOf(p.site) : []).some(function(e){ return !(e[1] || {}).del && e[1].kind === p.kind; })) n.photos = (Array.isArray(rec.photos) ? rec.photos : []).filter(function(k){ return k !== p.kind; });
  var back = rec.review === 'approved' && !boss;
  if (back){ n.review = 'pending'; n.minReview = ''; }
  CORE.set('recs', p.site, n);
  SVQ.delAsk = ''; statBump();
  toast(t(back ? 'حُذفت الصورة — وعاد المسحُ لانتظار الاعتماد' : 'حُذفت الصورة'));
  return true;
}
function svqPhoto(id, key, p){
  var rec = STATE.recs[id]; if (!rec || !svqMay(id) || !p || !p.data) return false;
  var boss = rankOf(ROLE) >= rankOf('engineer'), now = Date.now(), who = STATE.meta.name || '';
  var had = Array.isArray(rec.photos) && rec.photos.indexOf(key) > -1;
  if (typeof photoQueue === 'function') photoQueue(id, key, p.data);
  var n = Object.assign({}, rec);
  n.photos = (Array.isArray(rec.photos) ? rec.photos.slice() : []).filter(function(k){ return k !== key; }).concat([key]);
  n.phN = svqPhotoCount(id);   /* (V22.8) كلُّ صور الزيارة — في القاعدة وفي طابور الجهاز */
  n.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ k:'ph:' + key, o:had ? 'صورة سابقة' : '', v:'صورة جديدة', by:who, at:now }]).slice(-30);
  n.eAt = now; n.eBy = who;
  var back = rec.review === 'approved' && !boss;
  if (back){ n.review = 'pending'; n.minReview = ''; }
  CORE.set('recs', id, n);
  var lb = svqKindLabel(key);
  logEvent('تعديلُ صورة — ' + id + ' \u00b7 ' + lb + ' (إضافة)', id);
  if (rec.review === 'approved') notifPush('تعديلُ مسحٍ معتمد', t('صورة') + ': ' + t(lb) + ' — ' + id + (back ? ' — ' + t('عاد لانتظار الاعتماد') : ''), { site:id, lv:'مهم' });
  statBump();
  toast(t(back ? 'حُفظت الصورة — وعاد المسحُ لانتظار الاعتماد' : 'حُفظت الصورة — وتُرفَع مع المزامنة'));
  return true;
}
function svqSave(id, key, val, quiet){   /* (V38.20) quiet: جزءٌ من حفظٍ مركّب (التحديات + وصفُها) فلا يقول «لم يتغيّر شيء» */
  var rec = STATE.recs[id]; if (!rec || !svqMay(id)) return false;
  var old = key === 'chals' ? (rec.chals || []).slice() : key === 'loc' ? locList(rec.loc) : rec[key];
  if (SVQ_NUM[key]){ var nv = cfgN(val); if (!(nv > 0)){ toast(t('اكتب رقمًا أكبر من صفر')); return false; } val = nv; }
  else if (key === 'chals'){ if (!val || !val.length){ toast(t('اختر تحديًا واحدًا على الأقل — أو «لا توجد تحديات»')); return false; } }
  else if (key === 'loc'){ val = Array.isArray(val) ? val.slice() : locList(val); }   /* (V38.25) قائمة */
  else val = String(val == null ? '' : val).trim();
  if (JSON.stringify(old) === JSON.stringify(val)){ if (!quiet) toast(t('لم يتغيّر شيء')); return false; }
  var boss = rankOf(ROLE) >= rankOf('engineer'), now = Date.now(), who = STATE.meta.name || '';
  var n = Object.assign({}, rec);
  n[key] = val;
  n.edits = (Array.isArray(rec.edits) ? rec.edits : []).concat([{ k:key, o:old, v:val, by:who, at:now }]).slice(-30);
  n.eAt = now; n.eBy = who;
  var back = rec.review === 'approved' && !boss;
  if (back){ n.review = 'pending'; n.minReview = ''; }
  CORE.set('recs', id, n);
  var line = t(svqLabel(key)) + ': ' + svqFmt(old) + ' \u2190 ' + svqFmt(val);
  logEvent('تعديلُ مسح — ' + id + ' \u00b7 ' + line, id);
  if (rec.review === 'approved') notifPush('تعديلُ مسحٍ معتمد', line + ' — ' + id + (back ? ' — ' + t('عاد لانتظار الاعتماد') : ''), { site:id, lv:'مهم' });
  SVQ.key = ''; SVQ.tmp = null; SVQ.tmpL = null; SVQ.note = null; SVQ.err = '';
  statBump();
  if (!quiet) toast(t(back ? 'عُدِّل الحقل — وعاد المسحُ لانتظار الاعتماد' : 'عُدِّل الحقل — والباقي كما هو'));   /* (V38.21) الحفظُ المركّب يقول جملةً واحدة */
  return true;
}
var BRIEF_ST = ['تمام', 'تحدٍّ', 'ملاحظة'];

/* (V38.70) a visit saved on the wrong point (the formSite() fallback put 15 on Arafat 0001) moves to its right point: the
   record goes there for review again (marked with where it came from), the visit's own photos follow it (and the server moves
   their Drive files: rehome), and the wrong point returns to «not visited» with the move written on it. */
function svqVisitPhotos(src, rec){
  var day = dayKey(rec.at || 0);
  return (typeof photosOf === 'function' ? photosOf(src) : []).filter(function(p){ var ph = p[1] || {}; return !ph.del && !/^ins|^dis/.test(String(ph.kind || '')) && (ph.by || '') === (rec.by || '') && dayKey(ph.at || 0) === day; });
}
function svqMove(src){
  if (!may('approve')){ toast(t('نقلُ زيارةٍ للمهندس فما فوق')); return false; }
  var rec = STATE.recs[src], from = siteFind(src); if (!rec || !from) return false;
  var q = (typeof prompt === 'function') ? prompt(t('إلى أيِّ نقطة؟ — اكتب معرِّفها أو شاخصها (مثل 38/56)'), '') : '';
  if (!q) return false; q = String(q).trim();
  var to = siteFind(q) || (siteSearch(q, 2).length === 1 ? siteSearch(q, 1)[0] : null);
  if (!to){ toast(t('لم تُعرَف النقطة — اكتب المعرِّفَ كاملًا') + ': ' + q); return false; }
  if (to.id === src){ toast(t('هي النقطةُ نفسُها')); return false; }
  var ph = svqVisitPhotos(src, rec), has = !!STATE.recs[to.id] && !STATE.recs[to.id].deleted;
  var ok = (typeof confirm === 'function') ? confirm(t('تُنقَل زيارةُ') + ' ' + (rec.by || '') + ' (' + fmtDT(rec.at) + ') ' + t('ومعها') + ' ' + nm(ph.length) + ' ' + t('صورة') + ' ' + t('إلى') + ' ' + siteKey(to) + ' \u00b7 ' + to.name + (has ? '\n' + t('وللنقطة الهدف زيارةٌ ستُستبدَل') : '') + '\n' + t('متابعة؟')) : true;
  if (!ok) return false;
  var who = STATE.meta.name || '', now = Date.now();
  var moved = Object.assign({}, rec, { id:to.id, review:'pending', movedFrom:{ site:src, by:who, at:now } });
  delete moved.deleted;
  STATE.recs[to.id] = moved; CORE.set('recs', to.id, moved);
  ph.forEach(function(p){ var np = Object.assign({}, p[1], { site:to.id, rehome:true, movedFrom:src }); delete np.data; STATE.photos[p[0]] = np; CORE.set('photos', p[0], np); });
  if (typeof phTouch === 'function') phTouch();
  var gone = { id:src, deleted:true, movedTo:to.id, movedAt:now, movedBy:who, was:{ by:rec.by || '', at:rec.at || 0 } };
  STATE.recs[src] = gone; CORE.set('recs', src, gone);
  logEvent('نقل زيارة — ' + src + ' \u2192 ' + to.id + ' · ' + (rec.by || '') + ' ' + fmtDT(rec.at) + ' · ' + ph.length + ' صورة', src);
  logEvent('زيارةٌ وصلت بالنقل من ' + src + ' — ' + (rec.by || ''), to.id);
  if (typeof statBump === 'function') statBump();
  SVQ = { id:'', key:'', tmp:null };
  toast(t('نُقلت الزيارة إلى') + ' ' + siteKey(to) + ' — ' + t('بانتظار اعتمادها'));
  return true;
}
