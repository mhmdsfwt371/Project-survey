/* ============================================================================
   FILE    : src/03-survey/03-survey-records-11-weekly-tasks-paths.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : Weekly tasks as sentence cards, meeting mode, the one filter for screen and paper, and path filtering with each path's status.
   DEFINES : wtMay, wtLeaves, wtWbsName, wtForWbs, wtWbsBadge, wtMine, wtMeetList, wtFieldTxt, wtSince, wtPanelInner, wtMeetHtml, wtCardOf … (+19 more)
   GLOBALS : WT_F, WT_ST, WT_OPEN, WT_MEET, WT_STC, WT_LOGF, WT_TRACK, WT_TAB
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ متابعةُ المهام الأسبوعية ═══
   شيتُ «المهام» الذي يُدار به الاجتماعُ مرتين في الأسبوع: مهمةٌ ومسارٌ ووصفٌ
   ومسؤولٌ وحالةٌ وتاريخا رصدٍ واستحقاقٍ ومصدرٌ وآخرُ تحديث. كان إكسلًا بدوالٍّ
   تحسب المتأخرَ والمستحقَّ — فصار صفحتين: المهامُّ نفسُها تُضاف وتُعدَّل
   وتُنهى، ولوحةٌ تحسب ما كانت الدوالُّ تحسبه من تاريخ اليوم لا من خليةٍ. */
var WT_F = '', WT_Q = '', WT_NEW = false, WT_T = 0, WT_RESET = 0;
var WT_ST = ['مكتمل','جاري العمل','قيد الانتظار','متوقف'];
/* ═══ V16.81 — المهامُّ بطاقاتٌ تُقرأ كجملة، ولوحةٌ واحدةٌ للتعديل ═══
   كانت جدولًا من عشرة أعمدة يفتح عشرَ خاناتٍ في السطر عند التعديل، ويعدّله
   مديرُ المشروع وحدَه. صارت البطاقةُ تقول «ماذا — من — متى — أين وقفت»
   بلا ضغطة، وتُضغَط فتفتح لوحةً واحدة: الحالةُ شرائحُ تُضغَط، و«ما الجديد؟»
   يُضاف إلى سجلٍّ باسم كاتبه ووقته لا يمحو ما قبله. ومن يعدّل: المهندسُ فما
   فوق، والوزارةُ — لأن الاجتماعَ معها والمهامَّ مهامُّها أيضًا؛ والقاعدةُ
   تفتح لها وثيقةَ المهام وحدَها. وأدواتُ المكتب (استيرادٌ ومسحٌ) تبقى لمدير
   المشروع، فلا يمسح الجدولَ إلا من يملكه. */
var WT_OPEN = '', WT_TOOLS = false, WT_DONE_OPEN = false, WT_WBS = '';
function wtMay(){ var r = effRole(ROLE); return rankOf(r) >= 90 || r === 'viewer'; }
/* ═══ V16.82 — المهمةُ تُربَط ببند الخطة، والبندُ يقول كم مهمةً تحرّكه ═══
   الخطةُ تقول «ماذا ومتى» والمهامُّ تقول «ما اتُّفق عليه هذا الأسبوع لتحريكها»
   — وكانتا شاشتين لا تعرف إحداهما الأخرى، فيُسأل «إيه علاقة دي بدي؟». صار
   للمهمة حقلُ بندٍ اختياريّ، والبندُ في الخطة يحمل شارةَ مهامه المفتوحة
   (وتحمرُّ بما تأخّر) وتُضغَط فتفتح مهامَّه وحدَها. و«شغلي» يعرض مهامَّ
   الاجتماع التي على اسم صاحب الحساب — فلا يفتش عنها في قائمة الجميع. */
function wtLeaves(){ return wbsRows().filter(function(r){ return !wbsChildren(r.id).length; }); }
function wtWbsName(id){ var r = wbsRows().filter(function(x){ return String(x.id) === String(id); })[0]; return r ? r.n : ''; }
/* مهامُّ البند: ما رُبط به أو بأحد فروعه — مفتوحةً، ومتأخرةً */
function wtForWbs(id){
  var p = String(id || ''); if (!p) return { open:[], late:0 };
  var open = wtRows().filter(function(r){ var w = String(r.wbs || ''); return r.st !== 'مكتمل' && (w === p || w.indexOf(p + '.') === 0); });
  return { open:open, late:open.filter(wtLate).length };
}
function wtWbsBadge(id){
  var x = wtForWbs(id); if (!x.open.length) return '';
  return ' <button type="button" class="pill ' + (x.late ? 'bad' : 'acc') + '" data-wtgo="' + esc(id) + '" title="' + esc(t('مهامُّ الاجتماع لهذا البند')) + '" style="cursor:pointer">'
    + '\u{1F4CB} ' + nm(x.open.length) + (x.late ? ' \u00b7 ' + esc(t('متأخر')) + ' ' + nm(x.late) : '') + '</button>';
}
/* مهامّي من الاجتماع: ما كُتب على اسمي — بالاسم كما يُعرَض أو كما سُجّل */
function wtMine(){
  var me = String(STATE.meta.name || '').trim(), dn = String(dispName(me) || '').trim();
  if (!me) return [];
  return wtRows().filter(function(r){ var w = String(r.who || '').trim(); return r.st !== 'مكتمل' && w && (w === me || w === dn); });
}
/* ═══ V16.83 — وضعُ الاجتماع: المهامُّ واحدةً واحدة، والتقريرُ يقول ما تغيّر ═══
   الاجتماعُ كان يُدار بالتمرير في قائمةٍ طويلة، ومن يعرض يقفز بين المهام
   ويفوته ما تأخّر. صار «اجتماعُ الأسبوع» يمشي على المفتوح مهمةً مهمة —
   المتأخرُ أوّلًا — وفي كلِّ مهمةٍ اللوحةُ نفسُها: الحالةُ تُضغَط و«ما الجديد؟»
   يُكتَب على الهواء، وكلُّ من يفتح الشاشةَ يرى التحديثَ في ثوانٍ. و«إنهاءُ
   الاجتماع» يُصدِر التقريرَ ثم يختم وقتَه — فالتقريرُ التالي يقول ما تغيّر
   منذ هذا الختم، من سجل كلِّ مهمة، لا من الذاكرة. */
var WT_MEET = false, WT_MI = 0, WT_MEND = 0;
function wtMeetList(){ var G = wtGroups(wtRows()); return G.late.concat(G.week, G.later, G.none); }
function wtFieldTxt(e){
  if (e.f === 'due') return (e.from && e.to && e.to > e.from ? t('تأجيل الموعد') : t('الموعد')) + ': ' + (e.from || '\u2014') + ' \u2190 ' + (e.to || '\u2014');
  return t(WT_LOGF[e.f] || e.f) + ': ' + (e.from || '\u2014') + ' \u2190 ' + (e.to || '\u2014');
}
function wtSince(){
  var since = (STATE.wtask && STATE.wtask.meetAt) || 0, out = [];
  wtRows().forEach(function(r){
    (Array.isArray(r.log) ? r.log : []).forEach(function(e){
      if ((e.at || 0) <= since) return;
      var what = e.note === 'أُنشئت' ? t('مهمةٌ جديدة') : (e.st ? t('الحالة') + ': ' + t(e.st) : e.f ? wtFieldTxt(e) : String(e.note || ''));
      if (what) out.push({ r:r, e:e, what:what });
    });
  });
  out.sort(function(a, b){ return (b.e.at || 0) - (a.e.at || 0); });
  return { since:since, items:out };
}


/* لوحةُ المهمة من الداخل — تُستعمل في اللوحة المنزلقة وفي وضع الاجتماع سواء */
function wtPanelInner(r, me){
  var log = Array.isArray(r.log) ? r.log : [];
  var stRow = '<div class="chips" style="margin:0">' + WT_ST.map(function(x){
    var on = r.st === x;
    return me
      ? '<button type="button" class="chip' + (on ? ' on' : '') + '" data-wtstat="' + esc(r.id) + '|' + esc(x) + '">' + esc(t(x)) + '</button>'
      : (on ? pill(x, x === 'مكتمل' ? 'ok' : (x === 'جاري العمل' ? 'warn' : '')) : '');
  }).join('') + '</div>';
  var info = '<div class="pop-rows">'
    + '<div><span class="k">' + esc(t('المسؤول')) + '</span><span>' + wtAv(r.who) + ' ' + esc(r.who || t('بلا مسؤول')) + '</span></div>'
    + '<div><span class="k">' + esc(t('الاستحقاق')) + '</span><span>' + wtWhen(r) + (r.due ? ' <span class="num hint" style="margin:0">' + esc(r.due) + '</span>' : '') + '</span></div>'
    + (r.track ? '<div><span class="k">' + esc(t('المسار')) + '</span><span>' + esc(r.track) + (r.code && r.code !== r.track ? ' <span class="num hint" style="margin:0">' + esc(r.code) + '</span>' : '') + '</span></div>' : '')
    + (r.d ? '<div><span class="k">' + esc(t('الوصف')) + '</span><span>' + esc(r.d) + '</span></div>' : '')
    + (r.wbs ? '<div><span class="k">' + esc(t('بند الخطة')) + '</span><span><span class="num">' + esc(r.wbs) + '</span> ' + esc(wtWbsName(r.wbs)) + '</span></div>' : '')
    + '</div>';
  var note = me
    ? '<div class="field" style="margin-top:10px"><label>' + esc(t('ما الجديد؟')) + '</label>'
      + '<div style="display:flex;gap:6px"><input id="wtNote" dir="auto" placeholder="' + esc(t('سطرٌ واحد يقوله من يفتح المهمة بعدك')) + '" style="flex:1">'
      + btn('\u2795 ' + t('أضِف'),'btn-primary btn-sm',' data-wtnoteadd="' + esc(r.id) + '"') + '</div></div>'
    : '';
  var hist = log.length
    ? '<div class="hint" style="margin:10px 0 4px;font-weight:700">' + esc(t('السجل')) + '</div><div class="wt-log">' + log.slice(0, 8).map(function(e){
        return '<div class="wt-le"><span class="hint num" style="margin:0">' + esc(stepAgo(e.at || 0)) + '</span> <b>' + esc(dispName(e.by || '')) + '</b>'
          + (e.st ? ' ' + pill(e.st, e.st === 'مكتمل' ? 'ok' : (e.st === 'جاري العمل' ? 'warn' : '')) : '')
          + (e.note ? ' <span>' + esc(e.note) + '</span>' : '') + '</div>';
      }).join('') + '</div>'
    : (r.upd ? '<div class="hint" style="margin-top:8px">\u{1F4AC} ' + esc(r.upd) + '</div>' : '');
  return stRow + info + note + hist;
}
function wtMeetHtml(me){
  var L = wtMeetList();
  if (!L.length){ WT_MEET = false; return ''; }
  if (WT_MI >= L.length) WT_MI = L.length - 1;
  var r = L[WT_MI], late = wtLate(r), col = late ? '#E05252' : (WT_STC[r.st] || '#9FB0AA');
  var S = wtSince();
  return card('', '<div class="wt-row" style="justify-content:space-between">'
      + '<div><b>\u{1F5E3} ' + esc(t('اجتماع الأسبوع')) + '</b> <span class="num hint" style="margin:0">' + nm(WT_MI + 1) + ' ' + esc(t('من')) + ' ' + nm(L.length) + '</span>'
      +   ' <span class="hint" style="margin:0">\u00b7 ' + esc(t('منذ الاجتماع الماضي')) + ' <span class="num">' + nm(S.items.length) + '</span> ' + esc(t('تغييرًا')) + '</span></div>'
      + '<div class="actions" style="margin:0">'
      +   btn('\u2039 ' + t('السابق'),'btn-secondary btn-sm',' data-wtmeetprev="1"' + (WT_MI ? '' : ' disabled'))
      +   btn(t('التالي') + ' \u203A','btn-secondary btn-sm',' data-wtmeetnext="1"' + (WT_MI < L.length - 1 ? '' : ' disabled'))
      +   btn(WT_MEND ? '\u2705 ' + t('تأكيد الإنهاء — يُصدَر التقريرُ ويُختم') : '\u23F9 ' + t('إنهاء الاجتماع'), WT_MEND ? 'btn-primary btn-sm' : 'btn-quiet btn-sm', ' data-wtmeetend="1"')
      /* خروجٌ بلا ختم: يبقى كلُّ ما حُدِّث، ولا تقريرَ ولا تاريخَ اجتماع */
      +   btn('\u2715 ' + t('خروج بلا ختم'),'btn-quiet btn-sm',' data-wtmeetexit="1" title="' + esc(t('يبقى كلُّ ما حُدِّث — بلا تقريرٍ ولا ختم')) + '"')
      + '</div></div>')
    + '<div class="card wt-meet" style="border-inline-start:4px solid ' + col + '">'
    +   '<div class="wt-row"><span class="num hint" style="margin:0">#' + esc(r.id) + '</span><strong class="wt-n" style="font-size:16px">' + esc(r.n) + '</strong>' + wtWhen(r) + '</div>'
    +   wtPanelInner(r, me)
    + '</div>'
    + '<div class="chips" style="margin-top:8px">' + L.map(function(x, i){
        return '<button type="button" class="chip' + (i === WT_MI ? ' on' : '') + '" data-wtmeetgo="' + i + '" title="' + esc(x.n) + '" style="' + (wtLate(x) ? 'border-color:#E05252' : '') + '">' + nm(i + 1) + '</button>';
      }).join('') + '</div>';
}
var WT_STC = { 'مكتمل':'#3AD6A0', 'جاري العمل':'#E8C34B', 'قيد الانتظار':'#9FB0AA', 'متوقف':'#E05252' };
function wtCardOf(r){
  var late = wtLate(r), col = late ? '#E05252' : (WT_STC[r.st] || '#9FB0AA');
  var last = Array.isArray(r.log) && r.log[0];
  var lastTxt = last ? (esc(dispName(last.by || '')) + ' \u00b7 ' + esc(stepAgo(last.at || 0)) + (last.st ? ' \u00b7 ' + esc(t(last.st)) : '') + (last.note ? ' \u00b7 ' + esc(String(last.note).slice(0, 80)) : ''))
                     : (r.upd ? esc(String(r.upd).slice(0, 80)) : '');
  return '<button type="button" class="card wt-card' + (WT_OPEN === String(r.id) ? ' on' : '') + '" data-wtopen="' + esc(r.id) + '" style="border-inline-start:4px solid ' + col + '">'
    + '<div class="wt-row"><strong class="wt-n">' + esc(r.n) + '</strong>' + wtWhen(r) + '</div>'
    + '<div class="wt-row hint">' + wtAv(r.who) + '<span>' + esc(r.who || t('بلا مسؤول')) + '</span>'
    +   (r.due ? '<span class="num">\u{1F4C5} ' + esc(r.due) + '</span>' : '')
    +   (r.track ? '<span>\u{1F516} ' + esc(r.track) + '</span>' : '')
    +   (r.wbs ? '<span>\u{1F9ED} <span class="num">' + esc(r.wbs) + '</span> ' + esc(String(wtWbsName(r.wbs)).slice(0, 40)) + '</span>' : '')
    +   pill(r.st, r.st === 'مكتمل' ? 'ok' : (r.st === 'جاري العمل' ? 'warn' : (r.st === 'متوقف' ? 'bad' : ''))) + '</div>'
    + (lastTxt ? '<div class="hint wt-last">\u{1F4AC} ' + lastTxt + '</div>' : '')
    + (r.plan ? '<div class="hint wt-last">\u{1F5C2} ' + esc(t('من خطة الأسبوع')) + '</div>' : '')
    + (r.req ? '<div class="hint wt-last" style="color:' + (r.st === 'مكتمل' ? '#27AE60' : '#1C3674') + '">' + (r.st === 'مكتمل' ? '\u2713 ' + esc(t('نُفِّذ طلبُ الوزارة')) : '\u{1F4E8} ' + esc(t('تنفيذُ طلبٍ للوزارة'))) + '</div>' : '')
    + (r.chal ? '<div class="hint wt-last" style="color:' + (r.st === 'مكتمل' ? '#27AE60' : '#C0392B') + '">' + (r.st === 'مكتمل' ? '\u2713 ' + esc(t('تم حلُّ التحدي')) : '\u26A0 ' + esc(t('معالجةُ تحدٍّ')) ) + ': ' + esc(t(String(r.chal).replace(/^[FMT]:/, '').replace(/^C[0-9a-z]+$/, t('تحدٍّ مسجّل')))) + '</div>' : '')
    + '</button>';
}
/* قائمةُ بنود الخطة للاختيار — الأوراقُ وحدَها، بمعرِّفها واسمها */
function wtWbsSelect(cur, attr){
  var L = wtLeaves(); if (!L.length) return '';
  return '<select ' + attr + '><option value="">' + esc(t('— بلا بند —')) + '</option>' + L.map(function(x){
    return '<option value="' + esc(x.id) + '"' + (String(cur || '') === String(x.id) ? ' selected' : '') + '>' + esc(x.id + ' — ' + String(x.n).slice(0, 60)) + '</option>';
  }).join('') + '</select>';
}
function wtRows(){ return (STATE.wtask && Array.isArray(STATE.wtask.rows)) ? STATE.wtask.rows : []; }
function wtRow(id){ return wtRows().filter(function(x){ return String(x.id) === String(id); })[0] || null; }
/* السجلُّ: أحدثُه أوّلًا، عشرون سطرًا للمهمة تكفي اجتماعاتِ موسم */
function wtLogPush(r, e){
  e.at = Date.now(); e.by = STATE.meta.name || '';
  r.log = [e].concat(Array.isArray(r.log) ? r.log : []).slice(0, 20);
}

function wtNote(id, note){
  var r = wtRow(id); note = String(note || '').trim();
  if (!r) return false;
  if (!note){ toast(t('اكتب ما الجديد أوّلًا')); return false; }
  wtLogPush(r, { note:note }); r.upd = note;
  if (wtSave()){ logEvent('مهمةٌ أسبوعية — ' + id + ' \u00b7 ملاحظة', id); toast(t('أُضيفت إلى سجل المهمة')); render(1); return true; }
  return false;
}
/* «أُنجز هذا الأسبوع» — من وقت الإنجاز لا من وجود الحالة */
function wtDoneWeek(r){
  if (r.st !== 'مكتمل') return false;
  var at = r.doneAt || 0;
  if (!at && Array.isArray(r.log)) r.log.forEach(function(e){ if (!at && e.st === 'مكتمل') at = e.at; });
  return !!at && (Date.now() - at) < 7 * 86400000;
}
/* الاستحقاقُ بكلماتٍ يقرؤها الجديد: «بعد ٣ أيام» لا «2026-09-14» */
function wtWhen(r){
  var d = wtDue(r);
  if (r.st === 'مكتمل') return pill('مكتمل', 'ok');
  if (!r.due) return pill('بلا تاريخ', 'off');
  if (d < 0) return pill(t('تأخّر') + ' ' + nm(-d) + ' ' + t('يوم'), 'bad');
  if (d === 0) return pill('اليوم', 'warn');
  if (d === 1) return pill('غدًا', 'warn');
  return pill(t('بعد') + ' ' + nm(d) + ' ' + t('يوم'), d <= 7 ? 'warn' : 'ok');
}
/* حرفان من اسم المسؤول في دائرة — يُعرَف صاحبُ المهمة بنظرة */
function wtAv(name){
  var w = String(name || '').trim().split(/\s+/).filter(Boolean);
  var ini = w.length ? w.slice(0, 2).map(function(x){ return x.charAt(0); }).join('') : '?';
  return '<span class="wt-av" title="' + esc(name || t('بلا مسؤول')) + '">' + esc(ini) + '</span>';
}
/* المجموعاتُ بترتيب القراءة: ما تأخّر أوّلًا، ثم الأسبوع، ثم الأبعد */
function wtGroups(L){
  var G = { late:[], week:[], later:[], none:[], done:[] };
  L.forEach(function(r){
    var d = wtDue(r);
    if (r.st === 'مكتمل') G.done.push(r);
    else if (!r.due) G.none.push(r);
    else if (d < 0) G.late.push(r);
    else if (d <= 7) G.week.push(r);
    else G.later.push(r);
  });
  G.done.sort(function(a, b){ return (b.doneAt || 0) - (a.doneAt || 0); });
  return G;
}
/* أسماءُ المسؤولين للاقتراح: ما سُمّي قبلُ في المهام، ومن يُرى من الحسابات */
function wtWhoList(){
  var seen = {}, out = [];
  wtRows().forEach(function(r){ var w = String(r.who || '').trim(); if (w && !seen[w]){ seen[w] = 1; out.push(w); } });
  try { (typeof usersList === 'function' ? usersList() : []).forEach(function(u){ var w = dispName(u.name || ''); if (w && !seen[w]){ seen[w] = 1; out.push(w); } }); } catch (e){ LS_ERR = e; }
  return out;
}
function wtSave(){
  if (!wtMay()){ toast(t('المهامُّ الأسبوعية للمهندس والوزارة فما فوق')); return false; }
  STATE.wtask = STATE.wtask || { rows:[] };
  STATE.wtask.at = Date.now(); STATE.wtask.by = STATE.meta.name || '';
  CORE.set('cfg', 'wtask', { rows:STATE.wtask.rows, at:STATE.wtask.at, by:STATE.wtask.by, meetAt:STATE.wtask.meetAt || 0, meetBy:STATE.wtask.meetBy || '' });
  CORE.saveSoon(); return true;
}
function wtDue(r){
  if (!r.due || r.st === 'مكتمل') return null;
  return Math.round((new Date(r.due) - new Date(dayKey(Date.now()))) / 86400000);
}
function wtLate(r){ var d = wtDue(r); return d != null && d < 0; }

var WT_LOGF = { due:'الموعد', who:'المسؤول', track:'المسار', n:'الاسم', wbs:'بند الخطة' };
function wtSet(id, patch){
  var r = wtRows().filter(function(x){ return String(x.id) === String(id); })[0]; if (!r) return;
  /* (V20.7) ما يهمُّ الوزارةَ من التعديل يُسجَّل بقيمتيه — التأجيلُ وتغييرُ المسؤول كانا يقعان بصمت */
  Object.keys(patch).forEach(function(k){ if (WT_LOGF[k] && String(r[k] || '') !== String(patch[k] || '')) wtLogPush(r, { f:k, from:String(r[k] || ''), to:String(patch[k] || '') }); });
  Object.keys(patch).forEach(function(k){ r[k] = patch[k]; });
  if (wtSave()){ logEvent('مهمةٌ أسبوعية — ' + id + ' \u00b7 ' + Object.keys(patch).join(','), id); render(1); }
}


function wtImport(file){
  if (!may('settings')){ toast(t('المهامُّ الأسبوعية للمهندس فما فوق')); return; }
  xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var fr = new FileReader();
    fr.onload = function(){
      try {
        var wb = XLSX.read(new Uint8Array(fr.result), { type:'array', cellDates:true }), rows = [], id = 0;
        wb.SheetNames.forEach(function(nm){
          var A = XLSX.utils.sheet_to_json(wb.Sheets[nm], { header:1, raw:true }), hdr = -1;
          for (var i = 0; i < A.length; i++){ if (String(A[i][1] || '').trim() === 'المهمة'){ hdr = i; break; } }
          if (hdr < 0) return;
          for (var r = hdr + 1; r < A.length; r++){
            var row = A[r]; if (!row || !row[1]) continue;
            /* الأعمدةُ الثلاثةُ الأخيرةُ من ورقة المكتب تُحفَظ كما هي (V17.19):
               توقّفُ المهمة واجتماعا الأحد والأربعاء — ولولاها لفُقدت في كلِّ
               دورةِ تصديرٍ ورفع. والمحسوبةُ (ل · م · ن) لا تُقرأ: تُعاد بناءً. */
            rows.push({ id:++id, n:String(row[1]).trim(), track:String(row[2] || '').trim(), code:String(row[3] || '').trim(),
                        d:String(row[4] || '').trim(), who:String(row[5] || '').trim(), st:String(row[6] || 'قيد الانتظار').trim(),
                        seen:wbsDate(row[7]), due:wbsDate(row[8]), src:String(row[9] || '').trim(), upd:String(row[10] || '').trim(),
                        stop:String(row[14] || '').trim(), mSun:String(row[15] || '').trim(), mWed:String(row[16] || '').trim() });
          }
        });
        if (!rows.length){ toast(t('لم يُعثَر على عمود «المهمة» في الملف')); return; }
        STATE.wtask = { rows:rows };
        if (wtSave()){ logEvent('استيرادُ المهام الأسبوعية — ' + rows.length); toast(nm(rows.length) + ' ' + t('مهمةً استُوردت')); render(1); }
      } catch (e){ softErr('استيراد المهام', e, 'تعذّرت قراءةُ الملف'); }
    };
    fr.readAsArrayBuffer(file);
  });
}
function wtRemind(){
  if (!may('settings') || typeof notifPush !== 'function') return;
  var c = wtStats(), today = dayKey(Date.now());
  if (!(c.late + c.d0)) return;
  if (lsGet('nsk14.wtRemind') === today) return;
  lsSet('nsk14.wtRemind', today);
  notifPush('مهام الاجتماع', (c.late ? nm(c.late) + ' ' + t('متأخرة') : '') + (c.late && c.d0 ? ' \u00b7 ' : '') + (c.d0 ? nm(c.d0) + ' ' + t('مستحقة اليوم') : ''),
            { lv: c.late ? 'مهم' : 'عادي', to:STATE.meta.name || '' });
}
/* ═══ المرشِّحُ واحدٌ للشاشة وللورقة ═══
   كانت الورقةُ تُبنى من كلِّ الصفوف مهما رُشِّحت الشاشة: يرى المستخدمُ سبعةَ
   عشرَ ويُصدِّر اثنين وأربعين، فيرسلها إلى الوزارة وفيها ما لم يقصده. صار ما
   يُصدَّر هو ما يُرى — وبلا ترشيحٍ يُصدَّر الكلُّ كما كان. */
function wtFiltered(){
  return wtRows().filter(function(r){
    if (WT_TRACK && String(r.track || '').trim() !== WT_TRACK) return false;   /* بالمسار (V17.52) */
    if (WT_WBS){ var w = String(r.wbs || ''); if (!(w === WT_WBS || w.indexOf(WT_WBS + '.') === 0)) return false; }
    if (WT_Q && (r.n + ' ' + (r.who || '') + ' ' + (r.track || '') + ' ' + (r.upd || '') + ' ' + (r.wbs || '')).indexOf(WT_Q) < 0) return false;
    if (WT_F === 'late') return wtLate(r);
    if (WT_F === 'due'){ var d = wtDue(r); return d != null && d >= 0 && d <= 7; }
    if (WT_F === 'run') return r.st === 'جاري العمل';
    if (WT_F === 'wait') return r.st === 'قيد الانتظار';
    if (WT_F === 'done') return r.st === 'مكتمل';
    return true;
  });
}
/* ═══ الترشيحُ بالمسار وحالُ كلِّ مسار (V17.52) ═══
   المهامُّ سبعٌ وأربعون في ستة مسارات، والسؤالُ في كلِّ اجتماع: مسارُ جاهزية
   المواقع — كم فيه وكم تأخّر؟ فكان الجوابُ بالعين على سبعٍ وأربعين بطاقة.
   صار للمسار شريحتُه بعددِه ومتأخّرِه، وحين يُختار تُحسَب شرائحُ الحالة
   داخله وحدَه — فيُقرأ المسارُ بحاله لا الكلُّ بحالته. */
var WT_TRACK = '';
function wtTracks(){
  var R = wtRows(), m = {};
  R.forEach(function(r){
    var k = String(r.track || '').trim(); if (!k) return;
    if (!m[k]) m[k] = { n:0, late:0, done:0, open:0 };
    m[k].n++;
    if (r.st === 'مكتمل') m[k].done++; else { m[k].open++; if (wtLate(r)) m[k].late++; }
  });
  return m;
}
function wtStats(){
  var R = wtRows().filter(function(r){ return !WT_TRACK || String(r.track || '').trim() === WT_TRACK; });
  var c = { all:R.length, done:0, run:0, wait:0, stop:0, late:0, d0:0, d1:0, week:0, next:0, month:0, none:0 };
  R.forEach(function(r){
    if (r.st === 'مكتمل'){ c.done++; return; }
    if (r.st === 'جاري العمل') c.run++; else if (r.st === 'متوقف') c.stop++; else c.wait++;
    var d = wtDue(r);
    if (d == null){ c.none++; return; }
    if (d < 0) c.late++; else if (d === 0) c.d0++; else if (d === 1) c.d1++; else if (d <= 7) c.week++; else if (d <= 14) c.next++; else if (d <= 31) c.month++;
  });
  return c;
}
var WT_TAB = 'list';
PAGE.wtask = { m:'المتابعة', t:'متابعة المهام الأسبوعية', l:'مهامُّ الاجتماع — كلُّ مهمةٍ بطاقةٌ تقول ماذا ومن ومتى وأين وقفت؛ اضغطها لتحدّث حالتَها أو تكتب ما الجديد. يعدّلها المهندسُ فما فوق والوزارة.',
  body:function(){
    var c = wtStats(), R = wtRows(), me = wtMay();
    /* ── اللوحة: ما كانت الدوالُّ تحسبه — من تاريخ اليوم ── */
    var dash = stats([['إجمالي المهام', N(c.all)], ['مكتملة', N(c.done), 'ok'],
                      ['قيد التنفيذ والانتظار', N(c.run + c.wait), 'wrn'], ['متأخرة', N(c.late), c.late ? 'bad' : 'ok']])
      + card(t('الاستحقاق القريب'), stats([['مستحق اليوم', N(c.d0), c.d0 ? 'wrn' : ''], ['غدًا', N(c.d1)],
                                            ['باقي الأسبوع', N(c.week)], ['الأسبوع القادم', N(c.next)],
                                            ['هذا الشهر', N(c.month)], ['بلا تاريخ', N(c.none), c.none ? 'wrn' : '']]))
      + (function(){
          var by = {}; R.forEach(function(r){ var k = r.track || '—'; by[k] = by[k] || { n:0, d:0, l:0 }; by[k].n++; if (r.st === 'مكتمل') by[k].d++; if (wtLate(r)) by[k].l++; });
          var ks = Object.keys(by).sort(function(a, b){ return by[b].n - by[a].n; });
          return ks.length ? cardFlush(t('حسب المسار'), table(['المسار','المهام','مكتملة','متأخرة','النسبة'],
            ks.map(function(k){ var x = by[k]; return [esc(k), N(x.n), N(x.d), x.l ? '<b class="num" style="color:#E05252">' + nm(x.l) + '</b>' : N(0),
              '<span class="num">' + nm(Math.round(x.d / x.n * 100)) + '٪</span>']; }))) : '';
        })()
      + (function(){
          var by = {}; R.forEach(function(r){ if (r.st === 'مكتمل') return; var k = r.who || '—'; by[k] = by[k] || { n:0, l:0 }; by[k].n++; if (wtLate(r)) by[k].l++; });
          var ks = Object.keys(by).sort(function(a, b){ return by[b].n - by[a].n; });
          return ks.length ? cardFlush(t('المفتوح على كلِّ جهة'), table(['الجهة','مفتوح','متأخر'],
            ks.map(function(k){ return [esc(k), N(by[k].n), by[k].l ? '<b class="num" style="color:#E05252">' + nm(by[k].l) + '</b>' : N(0)]; }))) : '';
        })()
      /* ما تغيّر منذ الاجتماع الماضي — من سجل كلِّ مهمة، لا من الذاكرة */
      + (function(){
          var S = wtSince(), wt = STATE.wtask || {};
          return card(t('ما تغيّر منذ الاجتماع الماضي') + ' — ' + nm(S.items.length)
              + (wt.meetAt ? ' <span class="hint" style="margin:0;font-weight:400">\u00b7 ' + esc(t('خُتم')) + ' ' + esc(stepAgo(wt.meetAt)) + (wt.meetBy ? ' \u00b7 ' + esc(dispName(wt.meetBy)) : '') + '</span>' : ''),
            S.items.length
              ? '<div class="wt-log">' + S.items.slice(0, 15).map(function(x){
                  return '<div class="wt-le"><b>' + esc(x.r.n) + '</b> \u2014 ' + esc(x.what) + ' <span class="hint num" style="margin:0">\u00b7 ' + esc(dispName(x.e.by || '')) + ' \u00b7 ' + esc(stepAgo(x.e.at || 0)) + '</span></div>';
                }).join('') + (S.items.length > 15 ? '<p class="hint" style="margin:6px 0 0">' + esc(t('والباقي في تقرير الاجتماع')) + '</p>' : '') + '</div>'
              : '<p class="hint" style="margin:0">' + esc(t('لا تغييرَ منذ الاجتماع الماضي')) + '</p>');
        })()
      /* عدّادُ الحياة: كم مهمةً مفتوحةً قال أحدٌ فيها شيئًا خلال أسبوع — وكم بلا مسؤولٍ أو تاريخ */
      + (function(){
          var open = R.filter(function(r){ return r.st !== 'مكتمل'; }), live = 0, noWho = 0, noDue = 0;
          open.forEach(function(r){
            var at = (Array.isArray(r.log) && r.log[0] && r.log[0].at) || 0;
            if (at && Date.now() - at < 7 * 86400000) live++;
            if (!String(r.who || '').trim()) noWho++;
            if (!r.due) noDue++;
          });
          return open.length ? stats([['حُدِّثت خلال أسبوع', '<span class="num">' + nm(live) + ' / ' + nm(open.length) + '</span>', live === open.length ? 'ok' : 'wrn'],
                                       ['بلا مسؤول', N(noWho), noWho ? 'bad' : 'ok'], ['بلا تاريخ', N(noDue), noDue ? 'wrn' : 'ok']]) : '';
        })();
    var tabs = '<div class="chips" style="margin-bottom:8px">'
      + '<button type="button" class="chip' + (WT_TAB === 'list' ? ' on' : '') + '" data-wttab="list">\u{1F4CB} ' + esc(t('المهام')) + ' <span class="num">' + nm(c.all) + '</span></button>'
      + '<button type="button" class="chip' + (WT_TAB === 'dash' ? ' on' : '') + '" data-wttab="dash">\u{1F4CA} ' + esc(t('لوحة المهام')) + '</button></div>';
    if (WT_TAB === 'dash') return tabs + dash;
    if (WT_MEET && me) return tabs + wtMeetHtml(me);

    /* ── الشريط: ثلاثةُ أرقامٍ يقرؤها الجديدُ قبل كلِّ شيء ── */
    var doneWk = R.filter(wtDoneWeek).length;
    var strip = stats([['متأخر', N(c.late), c.late ? 'bad' : 'ok'],
                       ['مستحق هذا الأسبوع', N(c.d0 + c.d1 + c.week), (c.d0 + c.d1 + c.week) ? 'wrn' : ''],
                       ['أُنجز هذا الأسبوع', N(doneWk), 'ok']]);

    /* ── الأفعال: «مهمة جديدة» لمن يعدّل، وأدواتُ المكتب مطويّةٌ لمن يملكها ── */
    var acts = (me || may('settings'))
      ? card('', '<div class="actions" style="margin:0">'
          + (me ? btn('\u2795 ' + t('مهمة جديدة'),'btn-primary btn-sm',' data-wtnew="1"') : '')
          + (me && wtMeetList().length ? btn('\u{1F5E3} ' + t('اجتماع الأسبوع'),'btn-secondary btn-sm',' data-wtmeetstart="1"') : '')
          + (may('settings') ? btn('\u{1F4C4} ' + t('محضر الاجتماع'),'btn-secondary btn-sm',' data-wtmeet="1" title="' + esc(t('ما بقي من الاجتماع الماضي · ما استُجدّ · ما اكتمل')) + '"') : '')
          + '</div>'
          /* ═══ دورةُ الورقة ظاهرةٌ دائمًا (V17.18) ═══
             من عدّل الجدولَ خارج النظام يحتاج الرفعَ في اللحظة، لا أن يفتح
             قائمةً مطويةً اسمُها «أدوات المكتب». صدِّر · عدِّل · ارفع — والرفعُ
             يستبدل الجدولَ كلَّه، والمسحُ بجواره بتأكيد. */
          + (may('settings')
              ? '<div class="actions" style="margin:8px 0 0">'
                + btn('\u2B07 ' + t('إكسل — الملف بمعادلاته'),'btn-secondary btn-sm',' data-wtxl="1" title="' + esc(t('ورقةُ المهام ولوحةُ المؤشِّرات — بالمعادلات كما يعمل عليها المكتب')) + '"')
                + '<label class="btn btn-primary btn-sm" style="cursor:pointer">\u2B06 ' + esc(t('ارفع الملف — يستبدل الجدول'))
                + '<input type="file" accept=".xlsx,.xls" data-wtfile="1" style="display:none"></label>'
                + (R.length ? btn('\u{1F5D1} ' + t(WT_RESET ? 'تأكيد المسح' : 'امسح الكل'), WT_RESET ? 'btn-danger btn-sm' : 'btn-quiet btn-sm', ' data-wtreset="1"') : '')
                + btn((WT_TOOLS ? '\u25BE ' : '\u2026 ') + t('المزيد'),'btn-quiet btn-sm',' data-wttools="1"')
                + '</div>'
                + (WT_TOOLS
                    ? '<div class="actions" style="margin:6px 0 0">'
                      + btn('\u2B07 ' + t('إكسل — ورقة العمل'),'btn-quiet btn-sm',' data-xls="wtaskAll"')
                      + btn('\u2B07 ' + t('إكسل — ما تراه الآن'),'btn-quiet btn-sm',' data-xls="wtask"')
                      + btn('\u{1F4C4} ' + t('ما تغيّر منذ الاجتماع الماضي'),'btn-quiet btn-sm',' data-xls="wtsince"')
                      + '</div>' : '')
              : ''))
      : '';

    var whoList = '<datalist id="wtWhoList">' + wtWhoList().map(function(w){ return '<option value="' + esc(w) + '">'; }).join('') + '</datalist>';
    var newForm = (WT_NEW && me)
      ? card(t('مهمة جديدة'),
          '<p class="hint" style="margin:0 0 8px">' + esc(t('المهمةُ سطرٌ واحد: ماذا — من — متى.')) + '</p>'
          + '<div class="grid cols-2">'
          + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('المهمة')) + '</label><input id="wtN" dir="auto" placeholder="' + esc(t('ماذا يُفعَل؟')) + '"></div>'
          + '<div class="field"><label>' + esc(t('المسؤول')) + '</label><input id="wtWho" dir="auto" list="wtWhoList"></div>'
          + '<div class="field"><label>' + esc(t('تاريخ الاستحقاق')) + '</label><input id="wtDue" type="date"></div>'
          + '<div class="field"><label>' + esc(t('المسار')) + '</label><input id="wtTr" dir="auto"></div>'
          + '<div class="field"><label>' + esc(t('الوصف')) + '</label><input id="wtD" dir="auto"></div>'
          + (wtLeaves().length ? '<div class="field" style="grid-column:1/-1"><label>' + esc(t('بند الخطة')) + '</label>' + wtWbsSelect(WT_WBS, 'id="wtWbs"') + '</div>' : '')
          + '</div><div class="actions">' + btn('\u{1F4BE} ' + t('حفظ'),'btn-primary btn-sm',' data-wtnsave="1"') + btn(t('إلغاء'),'btn-quiet btn-sm',' data-wtncancel="1"') + '</div>')
      : '';

    var chips = [['','الكل',c.all],['late','متأخر',c.late],['due','مستحق قريبًا',c.d0 + c.d1 + c.week],
                 ['run','جاري العمل',c.run],['wait','قيد الانتظار',c.wait],['done','مكتمل',c.done]];
    /* شرائحُ المسارات: عددُ مهامِّه ومتأخّرُه — تُشتقُّ من المهامِّ نفسِها */
    var TRK = wtTracks(), tks = Object.keys(TRK).sort(function(a, b){ return TRK[b].n - TRK[a].n; });
    var trkRow = tks.length
      ? '<div class="chips">'
        + '<button type="button" class="chip' + (WT_TRACK ? '' : ' on') + '" data-wttrack="">'
        +   esc(t('كل المسارات')) + ' <span class="num">' + nm(wtRows().length) + '</span></button>'
        + tks.map(function(k){
            var x = TRK[k];
            return '<button type="button" class="chip' + (WT_TRACK === k ? ' on' : '') + '" data-wttrack="' + esc(k) + '">'
              + esc(k) + ' <span class="num">' + nm(x.n) + '</span>'
              + (x.late ? ' <span class="pill bad" style="margin-inline-start:4px">' + nm(x.late) + '</span>' : '')
              + '</button>';
          }).join('')
        + '</div>'
      : '';
    var filt = trkRow
      + (WT_TRACK
          ? '<p class="hint" style="margin:0 0 6px">' + esc(WT_TRACK) + ' \u00b7 '
            + esc(t('مكتمل')) + ' ' + nm(TRK[WT_TRACK] ? TRK[WT_TRACK].done : 0) + ' \u00b7 '
            + esc(t('مفتوح')) + ' ' + nm(TRK[WT_TRACK] ? TRK[WT_TRACK].open : 0) + ' \u00b7 '
            + esc(t('متأخر')) + ' ' + nm(TRK[WT_TRACK] ? TRK[WT_TRACK].late : 0) + '</p>'
          : '')
      + '<div class="chips">' + chips.map(function(x){ return '<button type="button" class="chip' + (WT_F === x[0] ? ' on' : '') + '" data-wtf="' + x[0] + '">' + esc(t(x[1])) + ' <span class="num">' + nm(x[2]) + '</span></button>'; }).join('') + '</div>'
      + card('', '<input type="search" data-wtq value="' + esc(WT_Q) + '" placeholder="' + esc(t('ابحث بالمهمة أو المسؤول أو المسار')) + '" dir="auto">');

    var cardOf = wtCardOf;
    var wbsBar = WT_WBS
      ? card('', '<div class="wt-row"><span>\u{1F9ED} ' + esc(t('بند الخطة')) + ': <span class="num">' + esc(WT_WBS) + '</span> ' + esc(wtWbsName(WT_WBS)) + '</span>'
          + btn('\u2715 ' + t('كل المهام'),'btn-quiet btn-sm',' data-wtwbs=""') + '</div>')
      : '';
    var L = wtFiltered(), G = wtGroups(L);
    var order = [['late','متأخر','bad'], ['week','هذا الأسبوع','warn'], ['later','لاحقًا',''], ['none','بلا تاريخ','off']];
    var groups = order.map(function(g){
      var items = G[g[0]]; if (!items.length) return '';
      return '<div class="wt-group"><div class="wt-gh">' + pill(g[1], g[2]) + ' <span class="num hint" style="margin:0">' + nm(items.length) + '</span></div>'
        + '<div class="grid cols-2 wt-grid">' + items.map(cardOf).join('') + '</div></div>';
    }).join('')
      + (G.done.length
          ? '<div class="wt-group"><button type="button" class="btn btn-quiet btn-sm" data-wtdone="1">' + (WT_DONE_OPEN ? '\u25BE ' : '\u25B8 ') + esc(t('مكتمل')) + ' <span class="num">' + nm(G.done.length) + '</span></button>'
            + (WT_DONE_OPEN ? '<div class="grid cols-2 wt-grid">' + G.done.map(cardOf).join('') + '</div>' : '') + '</div>'
          : '');
    var empty = !R.length
      ? card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t(me ? 'لا مهامَّ بعد — المهمةُ سطرٌ واحد: ماذا — من — متى. أضف الأولى من «مهمة جديدة».' : 'لا مهامَّ بعد — يضيفها المكتب.')) + '</p>')
      : (!L.length ? card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا مهامَّ تطابق الترشيح')) + '</p>') : '');
    var byLine = (STATE.wtask && STATE.wtask.by)
      ? '<p class="hint" style="margin:6px 0 0">' + esc(t('آخر تحديث')) + ' ' + esc(dispName(STATE.wtask.by)) + ' ' + esc(stepAgo(STATE.wtask.at || 0)) + '</p>' : '';

    return tabs + strip + acts + newForm + whoList + wbsBar + filt + empty + groups + byLine;
  }};