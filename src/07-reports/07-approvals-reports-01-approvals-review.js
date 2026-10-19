/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-01-approvals-review.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : Visit approvals by the engineer, challenge/notification search, review of unreachable and stalled points.
   DEFINES : svFacts, qMatch, siteParts, chalSitesQ, notifMineQ, chalSites, stuckList, stuckAccept, stuckReopen, idleStep, stuckPanel
   GLOBALS : SVA_ST, HO_DOC, SV_LABEL, CHAL_Q, STK_OPEN, MIN_ST, WR_DONE
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* ═══ اعتمادُ الزيارات — المهندسُ يراجع ما زاره المشرفُ قبل أن يُبنى عليه ═══
   الصفحةُ التي تُغلق الدورة: كلُّ زيارةٍ حُفظت تظهر هنا ببياناتها الجديدة —
   أين نُقلت النقطة، وما القياسات، وما التحديات، وكم صورة — فيعتمدها المهندسُ
   أو يردُّها «تحتاج زيارةً أخرى» بسببٍ يقرؤه المشرفُ في مهامّه. وفورَ الاعتماد
   يُقترَح حلُّها من الكتالوج نفسِه — قائمةٌ مبحوثةٌ أو نمطٌ جاهز — فلا يخرج
   المهندسُ إلى شاشةٍ أخرى ليُكمل ما بدأه. */
var SVA_ST = 'pending', SVA_REV = '', SVA_SOL = '', SVA_Q = '', SVA_PH = '';
var HO_DOC = '', HO_CO = '';   /* المحضرُ المعروض: نقطةً أو شركة */
var SV_LABEL = { mount:'التثبيت', power:'الكهرباء', height:'الارتفاع (متر)', cable:'طول الكابل (متر)',
  len_m:'الطول المتاح (متر)', wid_m:'العرض المتاح (متر)', hgt_m:'الارتفاع المتاح (متر)',
  fit:'هل الموقع مناسب للتركيب؟', tents:'عدد الغرف أو الخيام', gates:'عدد بوابات المخيم',
  corr_w:'عرض المسار للاتجاه الواحد (متر)', kits:'عدد الأطقم الكاملة المطلوبة', jam_pos:'الدور والجهة',
  power_yn:'هل يوجد مصدر كهرباء؟', kits_done:'أطقمٌ منجزة', old_base:'هل القاعدة أو التثبيت القديم موجود؟',
  old_cable:'هل مسار الكابل القديم سليم؟', cam_ok:'هل الكاميرا تعمل؟', router_sp:'هل يوجد مكان لتركيب راوتر؟',
  power_src:'أقرب مصدر كهرباء', pdist:'المسافة إلى المصدر (متر)', p24:'التغذية متاحة ٢٤ ساعة؟',
  old_net:'العنوان القائم (بادئة الشبكة)',
  power_note:'ماذا تغيّر؟', n_ant:'عدد الهوائيات', n_rdr:'عدد القارئات', n_cam:'عدد الكاميرات',
  n_sens:'عدد الحساسات البيئية', metal:'هياكل معدنية مؤثرة قرب النقطة؟', chal_note:'تفصيل التحديات',
  civil:'هل يحتاج أعمال مدنية؟', equip:'المعدات اللازمة للوصول', hours:'تقدير ساعات التركيب', crew_n:'عدد أفراد الطاقم' };
/* ما أفاد به المشرفُ في الزيارة — كلُّ حقلٍ له قيمة، بتسميته */
function svFacts(r){
  var out = [];
  if (r.loc && r.loc.from){
    var m = Math.round(distKm(r.loc.from, { lat:r.loc.lat, lng:r.loc.lng }) * 1000);
    out.push(['نُقلت النقطة', nm(m) + ' ' + t('م') + ' \u2014 ' + t('عن موقعها المسجَّل')]);
  }
  ['mount','power','height','cable'].concat(SV_EXTRA_KEYS).forEach(function(k){
    var v = r[k];
    if (v === '' || v == null || v === 0 || v === '0') return;
    out.push([SV_LABEL[k] || k, String(v)]);
  });
  if (r.chals && r.chals.length) out.push(['التحديات', r.chals.map(function(c){ return t(c); }).join(' \u00b7 ')]);
  if (r.note) out.push(['ملاحظة المشرف', r.note]);
  out.push(['الصور', nm((r.photos || []).length)]);
  return out;
}

/* ── التحديات الميدانية: من بيانات المسح الحقيقية لا من الخيال ──
   كل تحدٍّ يُختار وقت المسح (data-chal) يُحفَظ في STATE.recs[id].chals —
   موجودٌ منذ البداية ولم تقرأه أيُّ شاشة. النقطةُ «مفتوحة» ما دام لم
   يُعتمَد تركيبُها بعد؛ تُغلَق تلقائيًّا حين يُعتمَد — لا زرَّ إغلاقٍ
   يدويًّا يُنسى. */
/* ═══ بحثُ التحديات والإشعارات بكلِّ حقل (V17.25) ═══
   البحثُ في الصف كلِّه: المعرِّفُ واسمُ النقطة ومشعرُها وشاخصُها ومربعُها
   وشركتُها ونوعُها، ونصُّ كلِّ تحدٍّ، والملاحظةُ، واسمُ المُفيد، والحالةُ.
   وفي الإشعارات: النصُّ والنوعُ والمستوى والوجهةُ والمرسِلُ والنقطةُ واسمُها
   والوقتُ. يُطابَق بلا حساسيةٍ لحالة الحرف، وبكلِّ كلمةٍ على حدة — فتُكتَب
   «منى ٥٠٦» فتُقصَر على ما جمعهما. */
var CHAL_Q = '', NTF_Q = '';
function qMatch(q, parts){
  var words = String(q || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  var hay = parts.filter(Boolean).join(' \u2022 ').toLowerCase();
  return words.every(function(wd){ return hay.indexOf(wd) > -1; });
}
function siteParts(st){
  st = st || {};
  return [st.id, st.name, st.zone, st.sign, st.sq, st.co, st.type, st.region, st.inout, st.work];
}
function chalSitesQ(){
  var L = chalSites(); if (!CHAL_Q) return L;
  return L.filter(function(x){
    return qMatch(CHAL_Q, [x.id].concat(siteParts(x.site), x.chals, [x.note, x.by, dispName(x.by),
      x.closed ? 'أُغلقت بالتركيب' : 'بانتظار حل']));
  });
}
function notifMineQ(){
  var L = notifMine(); if (!NTF_Q) return L;
  return L.filter(function(n){
    var st = n.site ? siteFind(n.site) : null;
    return qMatch(NTF_Q, [n.text, n.kind, t(n.kind), n.lv, n.to, dispName(n.to), n.by, dispName(n.by),
      n.site].concat(siteParts(st), [n.at ? fmtDT(n.at) : '', n.read ? 'مقروء' : 'غير مقروء']));
  });
}
function chalSites(){
  return Object.keys(STATE.recs).map(function(id){
    var r = STATE.recs[id];
    var reals = chalKeys(r.chals);   /* بالمفتاح الواحد (V17.95) */
    if (!reals.length) return null;
    var ins = STATE.inss && STATE.inss[id];
    return { id:id, site:siteFind(id), chals:reals, note:r.note || '', by:r.by || '',
             at:r.at || 0, closed:!!(ins && ins.status === 'مُركّب' && ins.approved) };
  }).filter(Boolean).sort(function(a,b){ return b.at - a.at; });
}


/* المتعذّر: زيارةٌ لم يُوصَل فيها. الراكد: زيارةٌ تمّت ولم يُرَكَّب موقعُها
   بعد — من نفس بيانات surveyList لا حسابٍ منفصل. */
/* ═══ المتعذّرُ يُراجَع ويُقرَّر فيه ═══
   كانت شاشةُ «المتعذّر والراكد» قائمةً تُقرأ: اسمُ النقطة وسببٌ ومنذ كم يوم —
   ولا صورةَ ولا فعل. والمهندسُ يريد أن يرى ما رآه المشرفُ ويحكمَ: أيعود
   المشرفُ ثانيةً؟ أم السببُ حقيقيٌّ فيُقبَل ويُرفَع لمن يحلُّه؟ فصار لكلِّ
   عنصرٍ لوحةُ مراجعةٍ بصوره وسببه وملاحظاته، وقرارٌ يُكتب ويُحفَظ ويُخبَر به
   صاحبُه — والمقبولُ يخرج من قائمة المتابعة إلى «مقبول» فلا يُسأل عنه كلَّ يوم. */
var STK_OPEN = '', STK_F = '';
var MIN_ST = 'pending', MIN_Q = '', MIN_OPEN = '', MIN_T = 0;
function stuckList(){
  var out = [];
  Object.keys(STATE.recs).forEach(function(id){
    var r = STATE.recs[id], x = siteFind(id);
    if (!x) return;
    var ins = STATE.inss && STATE.inss[id];
    /* ما رُكِّب ليس راكدًا بانتظار التركيب ولو لم يُدقَّق بعد (V17.77) — كان
       المُركَّبُ غيرُ المدقَّق يظهر «راكدًا» بسبب «جاهزةٌ ولم يُسنَد تركيبُها» */
    if (ins && ins.status === 'مُركّب') return;
    var days = Math.floor((Date.now() - (r.at || 0)) / 86400000);
    out.push({ id:id, site:x, rec:r, blocked:svStuck(r), accepted:!!(r.stuckOk), days:days });
  });
  return out.sort(function(a,b){ return b.days - a.days; });
}
function stuckAccept(id, note){
  if (!may('approve')){ toast(t('قرارُ المتعذّر للمهندس وحده')); return false; }
  var r = STATE.recs[id]; if (!r){ toast(t('لا سجلَّ مسحٍ لهذه النقطة')); return false; }
  note = String(note || '').trim();
  if (!note){ toast(t('اكتب القرار: لماذا يُقبَل التعذّرُ ومن يحلُّه')); return false; }
  r.stuckOk = true; r.stuckNote = note; r.stuckBy = STATE.meta.name || ''; r.stuckAt = Date.now();
  r.review = '';                                           /* لا تعود إلى صف الاعتماد */
  CORE.set('recs', id, r);
  logEvent('قبولُ تعذّرٍ — ' + id + ' \u00b7 ' + note, id);
  notifPush('قُبل التعذّر', id + ' — ' + note, { to:r.by || '', site:id, lv:'عادي' });
  STK_OPEN = ''; statBump(); return true;
}
function stuckReopen(id){
  if (!may('approve')){ toast(t('قرارُ المتعذّر للمهندس وحده')); return false; }
  var r = STATE.recs[id]; if (!r) return false;
  delete r.stuckOk; delete r.stuckNote; delete r.stuckBy; delete r.stuckAt;
  CORE.set('recs', id, r); logEvent('إعادةُ فتح تعذّرٍ — ' + id, id); statBump(); return true;
}
/* ═══ الراكدُ: أين وقف الطريقُ وما الخطوةُ التالية ═══
   الراكدُ زيارةٌ تمّت ولم تُركَّب — لكنّ السببَ يختلف: لم تُعتمَد تقنيًّا، أو
   تنتظر الوزارة، أو ردّتها الوزارة، أو لا حلَّ لها، أو الحلُّ لم يُعتمَد، أو
   كلُّ ذلك تمّ ولم يُسنَد تركيبٌ. فيُقال أيُّها هو ويُعرَض زرُّ الخطوة نفسِها
   — فلا يبقى الصفُّ سطرًا يُقرأ ولا يُفعَل به شيء. */
function idleStep(id){
  var r = STATE.recs[id] || {}, ms = minState(r), so = solutionOf(id), tk = taskKindOf(id, 'install');
  if (svReview(r) !== 'approved') return { why:'بانتظار الاعتماد التقني', go:'svappr', lbl:'افتح الاعتماد التقني', cap:'approve' };
  if (ms === 'returned')          return { why:'ردّتها الوزارة — تحتاج معالجة', go:'minappr', lbl:'افتح اعتماد الوزارة', cap:'approve' };
  if (ms !== 'approved')          return { why:'بانتظار اعتماد الوزارة', go:'minappr', lbl:'افتح اعتماد الوزارة', cap:'minapprove' };
  if (!so)                        return { why:'لا حلَّ مقترحًا بعد', go:'solution', lbl:'اقترح الحل', cap:'approve' };
  if (so.status !== 'معتمد')      return { why:'الحلُّ مقترحٌ ولم يُعتمَد', go:'solution', lbl:'اعتمد الحل', cap:'approve' };
  if (tk)                         return { why:'مجدولة للتركيب — تنتظر الفريق', go:'req', lbl:'افتح الطلبات', cap:'approve' };
  return { why:'جاهزةٌ ولم يُسنَد تركيبُها', go:'ready', lbl:'أسنِد تركيبًا', cap:'approve' };
}
function stuckPanel(x){
  var r = x.rec, id = x.id, site = x.site;
  if (!x.blocked){
    var st = idleStep(id);
    var m2 = [['أين وقفت', t(st.why)], ['المشرف / الفني', dispName(r.by) || '—'], ['تاريخ الزيارة', r.at ? fmtDT(r.at) : '—'],
              ['الاعتماد التقني', r.reviewBy ? dispName(r.reviewBy) + ' \u00b7 ' + (r.reviewAt ? dayKey(r.reviewAt) : '') : '—'],
              ['اعتماد الوزارة', minState(r) === 'approved' ? (dispName(r.minBy || '') + ' \u00b7 ' + (r.minAt ? dayKey(r.minAt) : '')) : (minState(r) === 'returned' ? t('أعادتها') + ' \u2014 ' + (r.minNote || '') : '—')],
              ['المشعر / المربع', (site.zone || '—') + (site.sq ? ' \u00b7 ' + site.sq : '')], ['الشاخص', site.sign || '—'], ['الشركة', site.co || '—'],
              ['الملاحظات', r.note || '—']];
    return '<tr class="stk-panel"><td colspan="6" style="background:rgba(255,255,255,.03);padding:12px 14px">'
      + '<div class="grid cols-2">'
      +   '<div>' + table(['البند','القيمة'], m2.map(function(m){ return [esc(t(m[0])), '<span dir="auto">' + esc(m[1]) + '</span>']; })) + '</div>'
      +   '<div><div class="hint" style="margin:0 0 6px">' + esc(t('صورُ الزيارة')) + ' \u00b7 ' + nm(photoCount(id)) + '</div>' + photoGalleryHtml(id) + '</div>'
      + '</div>'
      + '<div class="actions" style="margin:10px 0 0">'
      +   (may(st.cap) ? btn('\u27A4 ' + t(st.lbl),'btn-primary btn-sm',' data-p="' + esc(st.go) + '"') : '')
      +   btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(id) + '"')
      +   btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-site="' + esc(id) + '"')
      +   (may('approve') ? btn('\u{1F501} ' + t('يعود المشرف لزيارة أخرى'),'btn-secondary btn-sm',' data-stkopenback="' + esc(id) + '"') : '')
      + '</div>'
      + (may('approve') ? '<div class="field" style="margin-top:8px"><label>' + esc(t('سببُ الإعادة')) + '</label><input data-stknote="' + esc(id) + '" dir="auto" placeholder="' + esc(t('يُملأ عند إعادة الزيارة للمشرف')) + '"></div>' : '')
      + '</td></tr>';
  }
  var meta = [['المشرف / الفني', dispName(r.by) || '—'], ['التاريخ', r.at ? fmtDT(r.at) : '—'],
              ['حالة الوصول', r.access || '—'], ['السبب', r.reason || '—'], ['الملاحظات', r.note || r.reopenNote || '—'],
              ['المشعر / المربع', (site.zone || '—') + (site.sq ? ' \u00b7 ' + site.sq : '')], ['الشاخص', site.sign || '—'],
              ['الشركة', site.co || '—']];
  if (r.stuckOk) meta.push(['القرار', '\u2705 ' + (r.stuckNote || '') + ' \u2014 ' + dispName(r.stuckBy || '') + ' \u00b7 ' + (r.stuckAt ? fmtDate(r.stuckAt) : '')]);
  if (r.review === 'revisit') meta.push(['رُدّت لزيارة أخرى', (r.revisitNote || '') + ' \u2014 ' + dispName(r.revisitBy || '')]);
  return '<tr class="stk-panel"><td colspan="6" style="background:rgba(255,255,255,.03);padding:12px 14px">'
    + '<div class="grid cols-2">'
    +   '<div>' + table(['البند','القيمة'], meta.map(function(m){ return [esc(t(m[0])), '<span dir="auto">' + esc(m[1]) + '</span>']; })) + '</div>'
    +   '<div><div class="hint" style="margin:0 0 6px">' + esc(t('صورُ الزيارة')) + ' \u00b7 ' + nm(photoCount(id)) + '</div>' + photoGalleryHtml(id) + '</div>'
    + '</div>'
    + (may('approve') && !r.stuckOk
        ? '<div class="field" style="margin-top:10px"><label>' + esc(t('قرارُ المهندس')) + '</label>'
          + '<input data-stknote="' + esc(id) + '" dir="auto" placeholder="' + esc(t('مثال: تصريحُ دخولٍ مطلوبٌ من كدانة — يُرفَع للوزارة · أو: المشرفُ يعود مع الفني ومعه الأداة')) + '"></div>'
          + '<div class="actions" style="margin:8px 0 0">'
          + btn('\u{1F501} ' + t('يعود المشرفُ لزيارةٍ أخرى'),'btn-primary btn-sm',' data-stkback="' + esc(id) + '"')
          + btn('\u2705 ' + t('أقبل التعذّر — سببٌ حقيقيّ'),'btn-secondary btn-sm',' data-stkok="' + esc(id) + '"')
          + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(id) + '"')
          + btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-site="' + esc(id) + '"')
          + '</div><p class="hint" style="margin:6px 0 0">' + esc(t('«يعود المشرف»: تُردُّ الزيارةُ بسببك ويصله إشعارٌ. «أقبل التعذّر»: يخرج من هذه القائمة إلى «مقبول» وتُسجَّل الحُجّةُ باسمك.')) + '</p>'
        : (r.stuckOk && may('approve')
            ? '<div class="actions" style="margin:8px 0 0">' + btn('\u21A9 ' + t('أعد فتحه'),'btn-quiet btn-sm',' data-stkreopen="' + esc(id) + '"') + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(id) + '"') + '</div>'
            : '<div class="actions" style="margin:8px 0 0">' + btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(id) + '"') + btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-site="' + esc(id) + '"') + '</div>'))
    + '</td></tr>';
}


/* ── الورشة والمخزون ─────────────────────────────── */
var WR_DONE = '';



