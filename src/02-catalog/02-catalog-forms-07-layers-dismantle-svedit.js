/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-07-layers-dismantle-svedit.js
   DOMAIN  : Catalogue & point — definitions, classification, permissions, survey edit
   PURPOSE : Three map layers (what each shows and assigns), dismantle and maintenance forms, the brief line on visit documents, and editing a survey without redoing it (svq*).
   DEFINES : maintList, LAYER, svqMay, svqKeys, svqLabel, svqFmt, svqEditor, svqSheet, svqPhotoCount, svqKindLabel, svqCanDel, svqPhotos … (+1 more)
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
  /* (V39.27) «التفاصيلُ المختصرة» كانت طبقةً رابعة (V16.88) — صارت خلاصةً في كلِّ طبقةٍ على سجلّها: الزيارةُ في المسح،
     والتركيبُ في التركيب، والفكُّ في الفك؛ إطارُ النقطة يقولها ونافذتُها تكتبها. ألوانُ المسح فيها مراحلُ الاعتماد أصلًا. */
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


/* الشكلُ المخزَّنُ كائنٌ {id,list} لأن CORE.set يكتب الوثيقةَ في مكانها —
   فما وُضع مصفوفةً يعود كائنًا بعد أوّل حفظ. تُقرأ الحالتان. */
function maintList(id){
  var L = (STATE.maints || {})[id];
  if (Array.isArray(L)) return L;
  return (L && Array.isArray(L.list)) ? L.list : [];
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
var SVQ_NUM = { tbar:1, len_m:1, wid_m:1, hgt_m:1, height:1, cable:1, tents:1, gates:1, corr_w:1, pdist:1, n_ant:1, n_rdr:1, n_cam:1, n_sens:1, hours:1, crew_n:1, kits:1, kits_done:1 };
var SVQ_OPT = { ctype:['عادي','ترددي'], mount:['عمود','جدار','سور','هيكل قائم'], power:['شبكة','مولد','طاقة شمسية','لا يوجد'] };   /* (V38.25) «موقع النقطة» شرائحُ متعدّدةٌ لا قائمة */
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
  /* (V38.79) corridors and Jamarat: the challenge is edited through «موقع النقطة» — no chips row */
  if (locOnly(siteFind(rec.id))) ks = ks.filter(function(k){ return k !== 'chals'; });
  /* (V39.62) owner: «مش لاقيه» — the camp type was only in the full survey form; visits made before it had no value, and this
     panel lists recorded values only. A visited camp now always shows «نوع المخيم», and the count of «الحاجز التنظيمي للتفويج» under a
     Taraddudi one (its own choice, else the boarding-stations match). */
  var sC = siteFind(rec.id);
  if (sC && sC.type === 'مخيم' && rec.access === 'تم الوصول'){
    ks = ks.filter(function(k){ return k !== 'ctype' && k !== 'tbar'; });
    var trd = rec.ctype ? rec.ctype === 'ترددي' : siteTard(sC);
    ks.unshift('ctype'); if (trd) ks.splice(1, 0, 'tbar');
  }
  return ks;
}
function svqLabel(k){ if (String(k).indexOf('ph:') === 0) return 'صورة: ' + svqKindLabel(k.slice(3)); return k === 'chals' ? 'تحديات التركيب' : (SV_LABELS[k] || k); }
function svqFmt(v){ return Array.isArray(v) ? v.filter(function(x){ return typeof x !== 'object' && !/^\[object /.test(String(x)); }).map(function(x){ return t(x); }).join(' \u00b7 ')   /* (V38.78) */ : (v === '' || v == null ? '\u2014' : (typeof v === 'number' ? nm(v) : t(String(v)))); }
function svqEditor(k, rec, s){
  if (k === 'ctype' && !rec.ctype) rec = Object.assign({}, rec, { ctype:siteTard(s) ? 'ترددي' : 'عادي' });   /* (V39.62) preselected from the boarding-stations match */
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
    + svqPhotos(rec) + phDeletedHtml(rec.id, false)   /* (V38.74) */
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
function svqCanDel(p, rec){
  /* (V38.74) an approved visit's photos are evidence — the project's management deletes them, not the field or the engineer */
  if ((rec || {}).review === 'approved') return rankOf(effRole(ROLE)) >= rankOf('admin');
  if (may('delete')) return true; return !!p && p.by === (STATE.meta.name || '');
}
/* (V22.8) «مش عارف أمسح صور وأزوّد صور جديدة»: صورُ الزيارة نفسُها بمصغّراتها — كلُّ صورةٍ تُحذَف
   (المهندسُ أيَّ صورة، والرافعُ صورتَه ما لم تُعتمَد الزيارة) بتأكيدٍ ثانٍ، وما في طابور الجهاز يُلغى،
   وتُضاف صورٌ جديدةٌ (واحدةٌ أو أكثر) بنوعها أو «صورة إضافية» — والحذفُ علامةٌ مسجَّلةٌ لا محوٌ صامت */
function svqPhotos(rec){
  /* (V38.61) the visit's photos only — the installation's are edited in «تعديل التركيب» */
  var id = rec.id, list = (typeof photosOf === 'function' ? photosOf(id) : []).filter(function(p){ return !(p[1] || {}).del && !/^ins/.test(String((p[1] || {}).kind || '')); });
  var q = (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q : []).map(function(x, i){ return [i, x]; }).filter(function(e){ return e[1] && e[1].site === id && !/^ins/.test(String(e[1].kind || '')); });
  var row = function(thumb, label, sub, act){ return '<div class="svq-row"><div class="svq-ph">' + thumb + '</div><div class="svq-k" style="flex:1 1 50%"><b style="color:var(--ink)">' + esc(t(label)) + '</b><div class="hint" style="margin:0;font-size:11.5px">' + sub + '</div></div>' + act + '</div>'; };
  /* (V38.84) «لا يمكن رؤية الصور المضافة إلا بعد نزول تحديث» (بلاغ ١٩ أكتوبر): الصفُّ كان يعرض data أو thumb وحدَهما — والصورةُ
     إذا وصلت الدرايف تُمحى data منها ولا thumb لها، فتظهر أيقونةً فارغة. يُعرَض كما يعرضه العارض (phSrc: الجهاز أو الطابور أو
     الدرايف)، وتُفتَح الصورةُ بالضغط عليها للتأكّد قبل حذفها أو استبدالها */
  var img = function(d, key){ return d ? '<img src="' + esc(d) + '" alt="" loading="lazy"' + (key ? ' data-phview="' + esc(key) + '" style="cursor:zoom-in"' : '') + '>' : '<span>\u{1F5BC}</span>'; };
  var h = '<div class="wp-sec" style="margin-top:12px">' + esc(t('صور الزيارة')) + ' \u00b7 ' + nm(list.length + q.length) + '</div>';
  h += list.map(function(p){
    var ph = p[1] || {}, ask = SVQ.delAsk === p[0];
    var act = svqCanDel(ph, rec)
      ? (ask ? btn(t('تأكيد الحذف'), 'btn-sm', ' data-svqdel="' + esc(p[0]) + '" style="background:#C0392B;color:#fff"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-svqdelx="1"')
             : btn('\u{1F5D1} ' + t('احذف'), 'btn-quiet btn-sm', ' data-svqdelask="' + esc(p[0]) + '"'))
      : '<span class="hint" style="margin:0;font-size:11px">' + esc(t('حذفُها للمهندس')) + '</span>';
    return row(img((typeof phSrc === 'function' ? phSrc(p[0], ph, 200) : '') || ph.data || ph.thumb || '', p[0]), svqKindLabel(ph.kind), esc(fmtDT(ph.at)) + (ph.by ? ' \u00b7 ' + esc(dispName(ph.by)) : '') + (ph.link || ph.driveId ? ' \u00b7 ' + esc(t('على الدرايف')) : ''), act);
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

var BRIEF_ST = ['تمام', 'تحدٍّ', 'ملاحظة'];


