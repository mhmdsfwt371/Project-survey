
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
  if (tk)                         return { why:'مُسندةٌ للتركيب — تنتظر الفريق', go:'req', lbl:'افتح الطلبات', cap:'approve' };
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



/* ═══ المخزنُ والمشترياتُ والكتالوج: من الحركة لا من البذرة ═══════════════
   كانت الأربعُ شاشاتٍ تعرض بذرةً مكتوبةً يومَ بُني الشكل: أربعةَ أصنافٍ
   وأربعَ حركاتٍ وعمليتَي شراء. تبدو عاملةً ولا تقبل إدخالًا — فلا يُسجَّل
   توريدٌ ولا صرفٌ ولا شراء، ويظلُّ الرصيدُ عددًا مكتوبًا لا ميزانًا.

   والرصيدُ لا يُكتَب: يُشتقُّ من الحركات. فمن أراد تصحيحَه سجّل حركةً
   تصحيحية — ولا يُعدَّل رقمٌ في مكانه فيضيع سببُه. */

function seedOnce(key, seed){
  if (!Array.isArray(STATE[key]) || !STATE[key].length) STATE[key] = (seed || []).slice();
  return STATE[key];
}

/* ── الكتالوج: قائمةُ القطع الأمّ، والقيمُ في الإعدادات ── */
function itemsList(){
  if (!Array.isArray(STATE.items) || !STATE.items.length){
    STATE.items = (DATA.items || []).map(function(r){
      return { z:r[0], code:r[1], name:r[2], pts:r[3], price:r[4], prep:r[5], asm:r[6] };
    });
  }
  return STATE.items;
}
function itemName(code){
  var x = itemsList().filter(function(i){ return i.code === code; })[0];
  return (x && x.name) || code;
}

/* ═══ طلباتُ الورشة: تهيئةٌ (CR) وتجميعٌ (AR) ═══
   كانت «طلبات المستودع» جدولَ تارجتاتٍ محسوبةً لا طلباتٍ فعلية — زرُّها
   معطَّلٌ بتصريحٍ صريح منذ V14.85. صار لكلِّ طلبٍ رقمٌ ومنفِّذٌ وتاريخٌ:
   يُطلب صنفٌ بكمية، وحين يُنفَّذ يُسجَّل في دفتر الحركة بنوعه الصحيح
   (تهيئة/تجميع) — فتُحسب نقاطُ scores() أخيرًا، لا تبقى صفرًا أبدًا. */

/* ═══ سجلُّ الطلبات والإسنادات ═══
   كلُّ إسنادٍ مهمةٌ لها رقمٌ ونوعٌ ومُسنَدٌ إليه وموعدٌ وحالة — زيارةٌ (SR)
   وتركيبٌ (DR) وفكٌّ (PR) وصيانةٌ (MR). وكانت تُنشأ من الخريطة وتُقرأ في
   «مهامي»، ولا مكانَ واحدٌ يُتابَع فيه النوعُ كلُّه: من أراد أن يرى كلَّ
   طلبات الفكِّ ويغيّر مُسنَدَ واحدٍ منها أو موعدَه أو يحذفه لم يجد أين.
     فصار سجلٌّ واحد: يُرشَّح بالنوع والحالة ويُبحَث، ويُعدَّل فيه المُسنَدُ
   إليه والموعد، ويُحذَف الطلبُ ما لم يُنجَز — والمنجَزُ لا يُحذَف لأن نقاطَ
   صاحبه بُنيت عليه، والمزورةُ تُعتمَد أو تُردّ لا تُمحى. */
var REG_KIND = '', REG_ST = '', REG_Q = '', REG_EDIT = '';
function regList(){
  var out = [];
  Object.keys(STATE.tasks || {}).forEach(function(k){
    var x = STATE.tasks[k];
    if (x && x.site) out.push(x);
  });
  return out.sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
function regStatus(x){
  if (x.status === 'معتمد') return { t:'منجَز', c:'ok' };
  var rv = svReview(STATE.recs[x.site]);
  if (x.kind === 'visit'){
    if (rv === 'revisit') return { t:'مردودة', c:'off' };
    if (rv === 'pending') return { t:'تنتظر الاعتماد', c:'acc' };
  }
  if (x.kind === 'install' && insDone(x.site)) return { t:'رُكِّبت', c:'ok' };
  if (x.kind === 'dis' && disDone(x.site))     return { t:'فُكَّت', c:'ok' };
  if (x.when && x.when < dayKey(Date.now()))   return { t:'متأخّرة', c:'off' };
  return { t:'مطلوبة', c:'warn' };
}
function regSet(id, patch){
  if (!may('approve')){ toast(t('تعديلُ الإسناد للمهندس وحده')); return; }
  var x = STATE.tasks[id];
  if (!x){ toast(t('لا إسنادَ بهذا المعرّف')); return; }
  if (x.status === 'معتمد'){ toast(t('إسنادٌ منجَزٌ لا يُعدَّل')); return; }
  var wasTo = x.to || '', wasWhen = x.when || '';
  Object.keys(patch).forEach(function(k){ x[k] = patch[k]; });
  CORE.set('tasks', id, x);
  logEvent('تعديل إسناد — ' + (x.no || id) + ' \u00b7 ' + wasTo + ' ' + wasWhen
           + ' \u2192 ' + (x.to || '') + ' ' + (x.when || ''));
  if (patch.to && patch.to !== wasTo)
    notifPush('إسناد', (x.no || '') + ' \u00b7 ' + x.site, { to:patch.to, site:x.site, lv:'عادي' });
  statBump();
}
function regDel(id){
  if (!may('approve')){ toast(t('حذفُ الإسناد للمهندس وحده')); return; }
  var x = STATE.tasks[id];
  if (!x) return;
  if (x.status === 'معتمد'){ toast(t('إسنادٌ منجَزٌ لا يُحذَف — نقاطُ صاحبه بُنيت عليه')); return; }
  if (x.kind === 'visit' && svDone(STATE.recs[x.site])){
    toast(t('زِيرت النقطةُ فعلًا — اعتمد الزيارةَ أو ردّها بدل الحذف')); return;
  }
  delete STATE.tasks[id]; if (typeof TK_IX !== 'undefined') TK_IX = null;
  CORE.rm('tasks', id);
  logEvent('حذف إسناد — ' + (x.no || id) + ' \u00b7 ' + x.site);
  toast(t('حُذف الإسناد'));
  statBump(); render(1);
}
function workReqList(){
  return Object.keys(STATE.workReqs || {}).map(function(k){ return STATE.workReqs[k]; })
    .sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
}
/* ═══ طلبُ صرفِ أصناف (IR) ═══
   كان صرفُ القطع من المستودع سطرًا يُكتَب في دفتر الحركة مباشرةً: لا رقمَ
   له ولا مُسنَدَ إليه ولا حالةَ تُتابَع — فمن طلب قطعًا لفنيٍّ لم يجد أين
   يسجّل الطلبَ حتى يُنفَّذ، ومن سُئل «أين طلبُ الصرف؟» لم يجد. صار نوعًا
   ثالثًا في طلبات الورشة بترقيمه (IR) ومُسنَدٍ إليه — فنيٍّ أو مشرف —
   وحين يُنفَّذ يُسجَّل «صرف» في دفتر الحركة باسم المُسنَد إليه، فتدخل القطعُ
   عُهدتَه لا عهدةَ من ضغط الزر. */
function workReqAdd(kind, item, qty, to){
  if (!may('edit')){ toast(t('طلبُ الورشة يحتاج صلاحية تعديل')); return; }
  var q = cfgN(qty);
  if (!item){ toast(t('اختر صنفًا')); return; }
  if (!q){ toast(t('اكتب كميةً غير صفر')); return; }
  if (kind === 'issue' && !to){ toast(t('اختر من يُصرَف له')); return; }
  var id = 'wr' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
  var rec = { id:id, no:reqNext(kind), kind:kind, item:item, qty:q, qtyDone:0,
              to:to || '', status:'مطلوب', by:STATE.meta.name || '', at:Date.now() };
  STATE.workReqs = STATE.workReqs || {};
  STATE.workReqs[id] = rec;
  CORE.set('workReqs', id, rec);
  logEvent({ prep:'طلب تهيئة — ', asm:'طلب تجميع — ', issue:'طلب صرف — ' }[kind] + rec.no + ' \u00b7 '
           + itemName(item) + ' \u00d7' + nm(q) + (to ? ' \u2190 ' + to : ''));
  if (to) notifPush('طلب صرف', rec.no + ' \u00b7 ' + itemName(item) + ' \u00d7' + nm(q), { to:to, lv:'عادي' });
  toast(rec.no + ' \u00b7 ' + t('أُنشئ الطلب'));
  statBump();
  render(1);
}
function workReqComplete(id, qtyDone){
  if (!may('edit')){ toast(t('تنفيذُ طلب الورشة يحتاج صلاحية تعديل')); return; }
  var r = STATE.workReqs && STATE.workReqs[id];
  if (!r){ toast(t('لا طلبَ بهذا المعرّف')); return; }
  var q = cfgN(qtyDone);
  if (!q){ toast(t('اكتب الكمية المُنفَّذة')); return; }
  var remain = r.qty - cfgN(r.qtyDone);
  if (q > remain){ toast(t('المتبقّي من الطلب') + ': ' + nm(remain)); return; }
  r.qtyDone = cfgN(r.qtyDone) + q;
  r.status = r.qtyDone >= r.qty ? 'تم' : 'قيد التنفيذ';
  r.doneBy = STATE.meta.name || '';
  r.doneAt = Date.now();
  CORE.set('workReqs', id, r);
  /* الصرفُ يُقيَّد باسم المُسنَد إليه — القطعُ تدخل عهدتَه هو */
  var mvKind = { prep:'تهيئة', asm:'تجميع', issue:'صرف' }[r.kind] || 'تهيئة';
  var mv = { id:uid36(), at:Date.now(), kind:mvKind, item:r.item, qty:q,
             by: r.kind === 'issue' ? (r.to || r.doneBy) : r.doneBy, req:r.no };
  STATE.moves = STATE.moves || [];
  STATE.moves.push(mv);
  CORE.dirty('moves', mv.id, mv);
  logEvent({ prep:'تنفيذ تهيئة — ', asm:'تنفيذ تجميع — ', issue:'تنفيذ صرف — ' }[r.kind] + r.no
           + ' \u00b7 ' + nm(q) + (r.kind === 'issue' && r.to ? ' \u2190 ' + r.to : ''));
  toast(r.no + ' \u00b7 ' + (r.status === 'تم' ? t('اكتمل الطلب') : t('تحديثٌ مُسجَّل')));
  statBump();
  render(1);
}
/* ═══ تعديلُ طلب الورشة ═══
   كان الطلبُ يُنشَأ ويُنفَّذ ويُلغى — ولا يُعدَّل. فمن كتب عشرةً وأراد اثنتي
   عشرةَ ألغى وأنشأ من جديدٍ برقمٍ جديد، فيبقى الرقمُ الأولُ في السجل بلا
   شيءٍ ويُسأل عنه. صار الصنفُ والكميةُ يُعدَّلان ما لم يُنفَّذ منه شيء —
   وبعد التنفيذ لا تُنقَص الكميةُ عمّا نُفِّذ فعلًا. */
function workReqEdit(id, item, qty){
  if (!may('edit')){ toast(t('تعديلُ طلب الورشة يحتاج صلاحية تعديل')); return; }
  var r = STATE.workReqs && STATE.workReqs[id];
  if (!r){ toast(t('لا طلبَ بهذا المعرّف')); return; }
  if (r.status === 'تم'){ toast(t('طلبٌ اكتمل لا يُعدَّل')); return; }
  var q = cfgN(qty), done = cfgN(r.qtyDone);
  if (!q){ toast(t('اكتب كميةً غير صفر')); return; }
  if (q < done){ toast(t('نُفِّذ منه') + ' ' + nm(done) + ' — ' + t('لا تُنقَص الكميةُ دونه')); return; }
  if (item && item !== r.item && done){ toast(t('نُفِّذ جزءٌ منه — لا يُبدَّل صنفُه')); return; }
  var was = itemName(r.item) + ' \u00d7' + nm(r.qty);
  if (item) r.item = item;
  r.qty = q;
  r.status = done >= q ? 'تم' : (done ? 'قيد التنفيذ' : 'مطلوب');
  r.editBy = STATE.meta.name || '';
  r.editAt = Date.now();
  CORE.set('workReqs', id, r);
  logEvent('تعديل طلب ورشة — ' + r.no + ' \u00b7 ' + was + ' \u2192 ' + itemName(r.item) + ' \u00d7' + nm(r.qty));
  toast(r.no + ' \u00b7 ' + t('عُدِّل الطلب'));
  statBump(); render(1);
}
function workReqCancel(id){
  if (!may('edit')){ toast(t('إلغاءُ طلب الورشة يحتاج صلاحية تعديل')); return; }
  var r = STATE.workReqs && STATE.workReqs[id];
  if (!r) return;
  if (r.qtyDone){ toast(t('طلبٌ نُفِّذ جزءٌ منه لا يُلغى — أكمله أو اتركه')); return; }
  delete STATE.workReqs[id];
  CORE.dirty('workReqs', id, null);
  logEvent('إلغاء طلب ورشة — ' + r.no);
  toast(t('أُلغي الطلب'));
  statBump();
  render(1);
}

/* ── الكتالوج: يُحرَّر ويُزاد ويُنقَص ─────────────────────────────────────
   كان مرسومًا بلا خاصيةٍ على أزراره، فيُكتَب ويُضغَط ولا يقع شيء. */
function itemSave(){
  STATE.items = itemsList().slice();
  CORE.set('cfg', 'items', STATE.items);
}
function itemRename(code, name){
  var x = itemsList().filter(function(i){ return i.code === code; })[0];
  if (!x) return;
  x.name = String(name || '').trim() || x.name;
  itemSave();
}
function itemZone(code){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var x = itemsList().filter(function(i){ return i.code === code; })[0];
  if (!x) return;
  x.z = x.z === 'cor' ? 'camp' : 'cor';
  itemSave();
  logEvent('نقل صنف — ' + x.name + ' → ' + (x.z === 'cor' ? 'ممر' : 'مخيم'));
  toast(t('نُقل إلى') + ' ' + t(x.z === 'cor' ? 'الممر' : 'المخيم'));
  render(1);
}
function itemDel(code){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var L = itemsList(), i = -1;
  L.forEach(function(x, k){ if (x.code === code) i = k; });
  if (i < 0) return;
  /* المستعملُ في تركيبٍ قائمٍ لا يُحذَف — وإلا فقدت السجلاتُ أسماءَ قطعها */
  var u = 0;
  Object.keys(STATE.inss || {}).forEach(function(id){
    var r = STATE.inss[id];
    if (r && r.parts && r.parts[code]) u++;
  });
  if (u){ toast(t('مستعملٌ في') + ' ' + nm(u) + ' ' + t('تركيبًا — لا يُحذَف')); return; }
  /* وما في طلبِ ورشةٍ مفتوحٍ أو حلٍّ مقترَحٍ أو معتمَدٍ لا يُحذَف — وإلا أشار
     الطلبُ والحلُّ إلى صنفٍ لا يوجد */
  var inReq = workReqList().filter(function(r){ return r.item === code && r.status !== 'تم'; }).length;
  var inSol = 0;
  Object.keys(STATE.inss || {}).forEach(function(id){
    var so = STATE.inss[id] && STATE.inss[id].solution;
    if (so && so.items && so.items[code]) inSol++;
  });
  if (inReq || inSol){
    toast(t('مستعملٌ في') + ' ' + nm(inReq) + ' ' + t('طلبَ ورشةٍ و') + nm(inSol) + ' ' + t('حلًّا — لا يُحذَف'));
    return;
  }
  var nm2 = L[i].name;
  L.splice(i, 1);
  itemSave();
  logEvent('حذف صنف — ' + nm2);
  toast(t('حُذف'));
  render(1);
}
/* إخراجُ صنفٍ من مرحلة: نقاطُه صفرٌ فيخرج — والصنفُ يبقى في الكتالوج،
   فالخروجُ من التهيئة ليس حذفًا من الوجود. */
function stageOut(path, code){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  cfgSet(path, code, 0);
  logEvent('إخراج من المرحلة — ' + itemName(code) + ' · ' + path);
  toast(t('أُخرِج من المرحلة'));
  render(1);
}
/* إضافةُ صنفٍ من شاشة المرحلة: يُنشَأ في الكتالوج ويُعطى نقاطَ مرحلته دفعةً */
function stageAdd(path){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var name = g('itN');
  if (!name){ toast(t('اكتب اسم القطعة')); return; }
  if (itemsList().some(function(i){ return i.name === name; })){ toast(t('موجودٌ بالفعل')); return; }
  var code = 'it' + Date.now().toString(36);
  itemsList().push({ z:g('itZ') || 'camp', code:code, name:name, pts:0, price:0, prep:0, asm:0 });
  itemSave();
  cfgSet(path, code, +g('itS') || 0);
  logEvent('صنف جديد — ' + name + ' · ' + path);
  toast(t('أُضيف الصنف'));
  render(1);
}

function itemAdd(){
  if (!may('settings')){ toast(t('الكتالوجُ للمهندس وحده')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var name = g('itN');
  if (!name){ toast(t('اكتب اسم القطعة')); return; }
  if (itemsList().some(function(i){ return i.name === name; })){ toast(t('موجودٌ بالفعل')); return; }
  var code = 'it' + Date.now().toString(36);
  itemsList().push({ z:g('itZ') || 'camp', code:code, name:name,
                     pts:+g('itP') || 0, price:+g('itR') || 0, prep:0, asm:0 });
  itemSave();
  cfgSet('itPts', code, +g('itP') || 0);
  cfgSet('itPrice', code, +g('itR') || 0);
  logEvent('صنف جديد — ' + name);
  toast(t('أُضيف الصنف'));
  render(1);
}

/* ── المخزن: الميزانُ من الحركات ──
   توريدٌ يزيد المخزن. وصرفٌ ينقله إلى عهدة المنفِّذ. واستهلاكٌ يُخرجه من
   العهدة إلى الميدان. وإرجاعٌ يعيده. وشطبٌ يعزله تالفًا. */
var MOVE_KINDS = ['توريد','صرف','استهلاك','إرجاع','شطب'];

function movesList(){
  return (STATE.moves || []).slice().filter(Boolean)
    .sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
}

function stockBalance(){
  var bal = {};
  function row(item){
    if (!bal[item]) bal[item] = { item:item, store:0, custody:0, used:0, scrap:0 };
    return bal[item];
  }
  movesList().forEach(function(m){
    var r = row(m.item || '—'), q = +m.qty || 0;
    if (m.kind === 'توريد')      r.store   += q;
    else if (m.kind === 'صرف'){  r.store   -= q; r.custody += q; }
    else if (m.kind === 'استهلاك'){ r.custody -= q; r.used += q; }
    else if (m.kind === 'إرجاع'){   r.custody -= q; r.store += q; }
    else if (m.kind === 'شطب'){     r.custody -= q; r.scrap += q; }
  });
  return Object.keys(bal).map(function(k){ return bal[k]; })
    .sort(function(a,b){ return (b.store + b.custody) - (a.store + a.custody); });
}

function moveAdd(){
  if (!may('inventory')){ toast(t('المخزونُ للمهندس وحده')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var kind = g('mvKind'), item = g('mvItem'), qty = +g('mvQty') || 0;
  if (!kind || MOVE_KINDS.indexOf(kind) < 0){ toast(t('اختر نوع الحركة')); return; }
  if (!item){ toast(t('اختر الصنف')); return; }
  if (qty <= 0){ toast(t('الكميةُ أكبرُ من صفر')); return; }
  /* الصرفُ وما بعده لا يتجاوز المتاح — والرصيدُ السالب عطلٌ لا حالة */
  var b = stockBalance().filter(function(x){ return x.item === item; })[0]
       || { store:0, custody:0 };
  if (kind === 'صرف' && qty > b.store){
    toast(t('المتاحُ في المخزن') + ': ' + nm(b.store)); return; }
  if (['استهلاك','إرجاع','شطب'].indexOf(kind) > -1 && qty > b.custody){
    toast(t('المتاحُ في العُهدة') + ': ' + nm(b.custody)); return; }

  var id = uid36();
  var mv = { id:id, kind:kind, item:item, qty:qty,
             by:g('mvBy'), site:g('mvSite'), note:g('mvNote'),
             at:Date.now(), user:STATE.meta.name || '' };
  STATE.moves = STATE.moves || [];
  STATE.moves.push(mv);
  CORE.dirty('moves', id, mv);
  logEvent('حركة مخزون — ' + kind + ' · ' + item + ' × ' + nm(qty));
  toast(t('سُجّلت الحركة'));
  render(1);
}

/* المنصرفُ يُحسَب مرةً في مكانٍ واحد: خمسةُ مواضعَ كانت تجمعه، ولو اختلف
   شرطُ واحدٍ منها عن الآخر تفرّقت الأرقامُ في تقريرٍ واحد. */
function buysSpent(){
  /* مصروفُ التجارب يدخل أو لا يدخل بحسب مفتاحِ الدفتر — والدفترُ يبقى كما هو.
     ومنذ V17.7 يشمل المصروفُ أصنافَ التجارب كما يشمل مشترياتِها المربوطة. */
  var inC = trialInCost();
  var base = buysList().reduce(function(a,b){
    if (b.st !== 'معتمد') return a;
    if (b.trial && !inC) return a;
    return a + (+b.amt || 0); }, 0);
  return base + (inC ? trialsItemsSpend() : 0);
}

/* ═══ التجارب: كلُّ ريالٍ وكلُّ ساعة — وقرارُ دخولها التكاليف (V16.96) ═══
   التجربةُ مصروفٌ ووقتٌ قبل أن تصير عملًا: يُشترى لها ويُجرَّب ثم يُقال هذا
   يصلح أو لا يصلح. وكان مصروفُها يذوب في دفتر المشتريات فلا يُعرَف كم كلّفت
   التجاربُ وحدَها، ولا وقتُها يُسجَّل أصلًا. فصار لها دفترٌ: اسمُ التجربة
   وتاريخُها وساعاتُها، ولكلِّ شراءٍ حقلٌ يقول لأيِّ تجربةٍ هو. و**قرارُ
   دخولها في تكاليف المشروع مفتاحٌ واحد**: إن رُفع خرج مصروفُ التجارب من
   المنصرف المعتمد وبقي مسجَّلًا في دفتره — يُرى ولا يُحسَب؛ وإن وُضع دخل.
   فالقرارُ يُبدَّل متى شئت ولا يُعاد تسجيلُ شيء. */
/* ═══ التجربةُ عُدّةٌ في موضعٍ تنتهي بقرار (V17.73) ═══
   كان الدفترُ يعرف من التجربة اسمَها وساعاتِها ومصروفَها — ولا يعرف ما جُرِّب
   ولا أين ولا بمَ انتهت. فصار لكلِّ تجربةٍ عُدّتُها (بوابةٌ وحساساتٌ بأعدادها)
   وموضعُها ونتيجتُها وتقريرُها على الدرايف وصورُها — تُرفَع بالخطِّ نفسِه الذي
   ترفع به صورُ النقاط (الهاتفُ يكتب والخادمُ ينقل) تحت معرّفٍ للتجربة. */
var TRIAL_OUT = { 'جارية':'', 'ناجحة':'ok', 'تحتاج إعادة':'warn', 'لم تنجح':'bad' };
function trialKitHtml(r, me){
  var kit = [];
  if (r.gw) kit.push(esc(r.gw) + (r.gwN ? ' \u00d7 ' + nm(r.gwN) : ''));
  if (r.sn) kit.push(esc(r.sn) + (r.snN ? ' \u00d7 ' + nm(r.snN) : ''));
  var ph = photosOf('TRIAL-' + r.id), q = (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q : []).filter(function(p){ return p.site === 'TRIAL-' + r.id; });
  var out = r.out || 'جارية';
  return '<div class="wt-row" style="margin:6px 0 0;gap:6px;flex-wrap:wrap">'
    + pill(t(out), TRIAL_OUT[out] || '')
    + (kit.length ? '<span class="hint" style="margin:0">' + kit.join(' \u00b7 ') + '</span>' : '')
    + (r.where ? '<span class="hint" style="margin:0">\u{1F4CD} ' + esc(r.where) + '</span>' : '')
    + (r.report ? '<a class="btn btn-quiet btn-sm" href="' + esc(r.report) + '" target="_blank" rel="noopener">\u{1F4C4} ' + esc(t('التقرير')) + '</a>' : '')
    + (ph.length || q.length ? '<span class="hint" style="margin:0">\u{1F4F7} ' + nm(ph.length + q.length) + '</span>' : '')
    + (me ? '<label class="btn btn-quiet btn-sm" style="cursor:pointer">\u{1F4F7} ' + esc(t('أضِف صورة'))
              + '<input type="file" accept="image/*" capture="environment" data-trph="' + esc(r.id) + '" style="display:none"></label>' : '')
    + '</div>';
}
function trialsDoc(){
  var d = STATE.trials;
  if (!d || !Array.isArray(d.rows)) d = STATE.trials = { rows:[], inCost:false, at:0, by:'' };
  return d;
}
function trialRows(){ return trialsDoc().rows; }
function trialOf(id){ return trialRows().filter(function(x){ return String(x.id) === String(id); })[0] || null; }
function trialInCost(){ return !!trialsDoc().inCost; }
function trialMay(){ return may('money'); }
function trialSave(){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return false; }
  var d = trialsDoc(); d.at = Date.now(); d.by = STATE.meta.name || '';
  CORE.set('cfg', 'trials', { rows:d.rows, inCost:!!d.inCost, at:d.at, by:d.by });
  CORE.saveSoon(); return true;
}
function trialAdd(){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var n = g('trN'); if (!n){ toast(t('اكتب اسمَ التجربة')); return; }
  var hrs = +g('trH') || 0;
  var rep = g('trRep');
  if (rep && !/^https?:\/\//i.test(rep)){ toast(t('رابطُ التقرير يبدأ بـ https')); return; }
  trialRows().unshift({ id:uid36(), n:n, date:g('trD') || dayKey(),
                        hours:hrs, note:g('trNote'), by:STATE.meta.name || '', at:Date.now(),
                        gw:g('trGw'), gwN:+g('trGwN') || 0, sn:g('trSn'), snN:+g('trSnN') || 0,
                        where:g('trWhere'), out:g('trOut') || 'جارية', report:rep });
  if (trialSave()){ logEvent('تجربة — ' + n + (hrs ? ' · ' + hrs + ' ساعة' : '')); toast(t('سُجّلت التجربة')); render(1); }
}
function trialHoursAdd(id, h){
  var r = trialOf(id); if (!r) return;
  r.hours = Math.max(0, (+r.hours || 0) + h);
  if (trialSave()){ toast(t('حُدّثت ساعاتُ التجربة')); render(1); }
}
function trialRemove(id){
  if (!trialMay()) return;
  if (trialTotal(trialOf(id) || { id:id }) > 0){ toast(t('لا تُحذَف تجربةٌ عليها مصروف')); return; }
  trialsDoc().rows = trialRows().filter(function(x){ return String(x.id) !== String(id); });
  if (trialSave()){ logEvent('حذفُ تجربة — ' + id, id); toast(t('حُذفت التجربة')); render(1); }
}
function trialToggleCost(){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var d = trialsDoc(); d.inCost = !d.inCost;
  if (trialSave()){
    logEvent('مصروفُ التجارب ' + (d.inCost ? 'داخلٌ في التكاليف' : 'خارجٌ عن التكاليف'));
    toast(t(d.inCost ? 'دخل مصروفُ التجارب في التكاليف' : 'خرج مصروفُ التجارب من التكاليف'));
    render(1);
  }
}
/* ═══ أصنافُ التجربة (V17.7) ═══
   بعضُ ما يُشترى للتجربة لا يمرُّ بدفتر المشتريات: قطعةٌ من السوق بفاتورةٍ
   صغيرة، أو سلكٌ وبطاريةٌ من المخزن. فصار لكلِّ تجربةٍ دفترُ أصنافٍ صغير:
   الصنفُ وكميتُه وسعرُ وحدته، فيُحسَب إجماليُّ السطر وإجماليُّ التجربة
   وإجماليُّ التجارب كلِّها — ويُطبَع مع التقرير. والمشترياتُ المربوطةُ تبقى
   كما هي: مصروفُ التجربة هو الاثنان معًا، ومفتاحُ «ضمن التكاليف» يحكمهما. */
function trialItems(r){ return Array.isArray(r && r.items) ? r.items : []; }
function itemsSum(r){
  return trialItems(r).reduce(function(a, x){ return a + (+x.q || 0) * (+x.p || 0); }, 0);
}
function trialTotal(r){ return itemsSum(r) + trialSpend(r.id); }
function trialsItemsSpend(){ return trialRows().reduce(function(a, r){ return a + itemsSum(r); }, 0); }
function trialsTotal(){ return trialsItemsSpend() + trialsSpend(); }
function trialItemAdd(id){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var r = trialOf(id); if (!r) return;
  var g = function(k){ var el = document.getElementById(k + id); return el ? String(el.value || '').trim() : ''; };
  var n = g('itN'); if (!n){ toast(t('اكتب اسمَ الصنف')); return; }
  var q = +g('itQ') || 1, p = +g('itP') || 0;
  if (!Array.isArray(r.items)) r.items = [];
  r.items.push({ n:n, q:q, p:p, at:Date.now(), by:STATE.meta.name || '' });
  if (trialSave()){ logEvent('صنفُ تجربة — ' + r.n + ' · ' + n); toast(t('أُضيف الصنف')); render(1); }
}
function trialItemDel(id, i){
  if (!trialMay()) return;
  var r = trialOf(id); if (!r || !Array.isArray(r.items)) return;
  r.items.splice(i, 1);
  if (trialSave()){ toast(t('حُذف الصنف')); render(1); }
}

/* مشترياتُ تجربةٍ بعينها، وساعاتُها، ومجموعُ الدفتر */
function trialBuys(id){ return buysList().filter(function(b){ return String(b.trial || '') === String(id); }); }
function trialSpend(id){ return trialBuys(id).reduce(function(a, b){ return a + (+b.amt || 0); }, 0); }
function trialsSpend(){ return buysList().reduce(function(a, b){ return a + (b.trial ? (+b.amt || 0) : 0); }, 0); }
function trialsHours(){ return trialRows().reduce(function(a, r){ return a + (+r.hours || 0); }, 0); }

/* ── المشتريات ── */
function buysList(){
  var B = STATE.buys || {};
  return Object.keys(B).map(function(k){ return B[k]; })
    .filter(Boolean).sort(function(a,b){ return (b.at || 0) - (a.at || 0); });
}
function supList(){ return seedOnce('sups', DATA.suppliers); }
function catList(){ return seedOnce('cats', DATA.buyCats); }

/* (V29.5) قرارُ المالك: «الحذفُ مسموحٌ للمهندس والمدير» في سجلات المكتب. المشترياتُ تُعدَّل وتُحذَف منهما؛ والمعتمدُ منها لا يُحذف
   إلا بسببٍ مكتوبٍ يدخل سجلَّ الأحداث (الأثرُ لا يُحذف) — فيبقى المنصرفُ مفسَّرًا. */
var BUY_ED = '';
function buyMayEdit(){ return may('money') && rankOf(ROLE) >= rankOf('engineer'); }
function buyEdit(id){
  var b = (STATE.buys || {})[id]; if (!b || !buyMayEdit()){ toast(t('تعديلُ المشتريات للمهندس والمدير')); return; }
  BUY_ED = id; render(1);
  setTimeout(function(){ var set = function(k, v){ var el = document.getElementById(k); if (el) el.value = v == null ? '' : v; };
    set('byItem', b.item); set('byCat', b.cat); set('bySup', b.sup); set('byAmt', b.amt); set('byZone', b.zone || '\u2014'); set('byTrial', b.trial || '');
    var f = document.getElementById('byItem'); if (f){ try { f.scrollIntoView({ block:'center' }); f.focus(); } catch (e){ LS_ERR = e; } } }, 30);
}
function buyDel(id){
  var b = (STATE.buys || {})[id]; if (!b) return;
  if (!buyMayEdit()){ toast(t('حذفُ المشتريات للمهندس والمدير')); return; }
  var why = '';
  if (b.st === 'معتمد'){ why = String(window.prompt(t('عمليةٌ معتمدةٌ داخل المنصرف — اكتب سببَ الحذف (يُحفَظ في سجل الأحداث):'), '') || '').trim(); if (!why){ toast(t('لم تُحذف — السببُ مطلوبٌ للمعتمد')); return; } }
  else if (!confirm(t('حذفُ عملية الشراء') + ' «' + b.item + '» (' + nm(b.amt) + ')؟')) return;
  logEvent('حذف مشترى — ' + b.item + ' · ' + nm(b.amt) + ' ريال · ' + b.sup + ' · ' + b.st + (why ? ' · السبب: ' + why : ''));
  CORE.rm('buys', id); if (BUY_ED === id) BUY_ED = '';
  toast(t('حُذفت العملية')); render(1);
}
function buyAdd(){
  if (!may('money')){ toast(t('المشترياتُ للمهندس وحده')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var item = g('byItem'), cat = g('byCat'), sup = g('bySup');
  var amt = +g('byAmt') || 0, zone = g('byZone'), trial = g('byTrial');
  if (!item){ toast(t('اكتب الصنف')); return; }
  if (catList().indexOf(cat) < 0){ toast(t('الفئةُ من القائمة المعتمدة')); return; }
  if (supList().indexOf(sup) < 0){ toast(t('المورّدُ من القائمة المعتمدة')); return; }
  if (amt <= 0){ toast(t('المبلغُ أكبرُ من صفر')); return; }

  var cap = cfgGet('budApp') || 0;
  var old = BUY_ED ? (STATE.buys || {})[BUY_ED] : null;   /* (V29.5) تعديلٌ لا عمليةٌ جديدة */
  var id = old ? old.id : uid36();
  var b = { id:id, item:item, cat:cat, sup:sup, amt:amt, zone:zone, trial:trial || '',
            at:old ? old.at : Date.now(), by:old ? old.by : (STATE.meta.name || ''),
            st: (cap && amt > cap) ? 'بانتظار الاعتماد' : 'معتمد' };
  if (old){ b.edAt = Date.now(); b.edBy = STATE.meta.name || ''; BUY_ED = ''; }
  if (!STATE.buys) STATE.buys = {};
  STATE.buys[id] = b;
  CORE.set('buys', id, b);
  logEvent((old ? 'تعديل مشترى — ' : 'مشترى — ') + item + ' · ' + nm(amt) + ' ريال · ' + b.st + (old && (old.amt !== amt || old.item !== item) ? ' (كان ' + old.item + ' · ' + nm(old.amt) + ')' : ''));
  if (b.st !== 'معتمد')
    notifPush('اعتماد شراء', 'مشترًى يتجاوز حدَّ الاعتماد — ' + item + ' · ' + nm(amt), { lv:'مهم' });
  toast(t(old ? 'حُفظ التعديل' : (b.st === 'معتمد' ? 'سُجّل المشترى' : 'سُجّل بانتظار اعتماد المهندس — تجاوز حدَّ الاعتماد')));
  render(1);
}

/* إضافةُ مورّدٍ أو فئةٍ إلى القائمة المعتمدة — والمستعملُ لا يُحذَف */
function listAdd(kind){
  if (!may('money')){ toast(t('المشترياتُ للمهندس وحده')); return; }
  var el = document.getElementById(kind === 'sup' ? 'supNew' : 'catNew');
  var v = el ? String(el.value || '').trim() : '';
  if (!v){ toast(t('اكتب الاسم أولًا')); return; }
  var L = kind === 'sup' ? supList() : catList();
  if (L.indexOf(v) > -1){ toast(t('موجودٌ بالفعل')); return; }
  L.push(v);
  CORE.set('cfg', kind === 'sup' ? 'sups' : 'cats', L.slice());
  logEvent((kind === 'sup' ? 'مورّد جديد — ' : 'فئة مشتريات جديدة — ') + v);
  toast(t('أُضيف'));
  render(1);
}
function listRm(kind, v){
  if (!may('money')){ toast(t('المشترياتُ للمهندس وحده')); return; }
  var used = buysList().filter(function(b){ return (kind === 'sup' ? b.sup : b.cat) === v; }).length;
  if (used){ toast(t('مستعملٌ في') + ' ' + nm(used) + ' ' + t('عملية — لا يُحذَف')); return; }
  var L = kind === 'sup' ? supList() : catList();
  var i = L.indexOf(v);
  if (i < 0) return;
  L.splice(i, 1);
  CORE.set('cfg', kind === 'sup' ? 'sups' : 'cats', L.slice());
  logEvent((kind === 'sup' ? 'حذف مورّد — ' : 'حذف فئة — ') + v);
  toast(t('حُذف'));
  render(1);
}

PAGE.inv = { m:'الورشة والمخزون', t:'المخزون',
  l:'الأرصدةُ وحركتُها وعُهدةُ كلِّ منفِّذ — في شاشةٍ واحدة.',
  body:function(){
    var head = tabHead('inv'), cur = tabCur('inv');
    if (cur === 'wos') return head + (function(){
    var Tg = T();
    var L = workReqList();
    var prepReq = L.filter(function(x){ return x.kind === 'prep'; });
    var asmReq  = L.filter(function(x){ return x.kind === 'asm'; });
    var openPrep = prepReq.filter(function(x){ return x.status !== 'تم'; }).length;
    var openAsm  = asmReq.filter(function(x){ return x.status !== 'تم'; }).length;

    var byItem = {};
    itemsList().forEach(function(i){ byItem[i.code] = i; });
    var pp = { camp:0, cor:0 }, pa = { camp:0, cor:0 };
    (STATE.moves || []).forEach(function(m){
      var it = byItem[m.item];
      if (!it) return;
      var zone = it.z === 'cor' ? 'cor' : 'camp';
      if (m.kind === 'تهيئة') pp[zone] += itPrep(m.item) * cfgN(m.qty);
      if (m.kind === 'تجميع') pa[zone] += itAsm(m.item) * cfgN(m.qty);
    });

    return stats([['طلباتُ تهيئةٍ مفتوحة', N(openPrep), openPrep ? 'wrn' : 'ok'],
                  ['طلباتُ تجميعٍ مفتوحة', N(openAsm), openAsm ? 'wrn' : 'ok'],
                  ['طلباتٌ مكتملة', N(L.filter(function(x){ return x.status === 'تم'; }).length), 'ok']])

      + card('الورشة مقابل التارجت',
          table(['المرحلة','النوع','نقاط الشهر','تارجت الشهر','٪','تارجت الأسبوع'], [
            ['تهيئة','مخيمات', N(Math.round(pp.camp)), N(Tg.prepCamp), pct(pp.camp,Tg.prepCamp), N(cfgWk(Tg.prepCamp))],
            ['تهيئة','ممرات',  N(Math.round(pp.cor)),  N(Tg.prepCor),  pct(pp.cor,Tg.prepCor),   N(cfgWk(Tg.prepCor))],
            ['تجميع','مخيمات', N(Math.round(pa.camp)), N(Tg.asmCamp), pct(pa.camp,Tg.asmCamp),  N(cfgWk(Tg.asmCamp))],
            ['تجميع','ممرات',  N(Math.round(pa.cor)),  N(Tg.asmCor),  pct(pa.cor,Tg.asmCor),    N(cfgWk(Tg.asmCor))]
          ], ['الإجمالي','', N(Math.round(pp.camp+pp.cor+pa.camp+pa.cor)), N(Tg.prep+Tg.asm),
              pct(pp.camp+pp.cor+pa.camp+pa.cor, Tg.prep+Tg.asm), N(cfgWk(Tg.prep+Tg.asm))]))

      + (may('edit')
        ? card('طلبٌ جديد',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('النوع')) + '</label>'
            + '<select id="wrKind"><option value="prep">' + esc(t('تهيئة')) + ' (CR)</option>'
            + '<option value="asm">' + esc(t('تجميع')) + ' (AR)</option>'
            + '<option value="issue">' + esc(t('صرف أصناف')) + ' (IR)</option></select></div>'
            + '<div class="field"><label>' + esc(t('الصنف')) + '</label>'
            + '<select id="wrItem">' + itemsList().map(function(i){
                return '<option value="' + esc(i.code) + '">' + esc(i.name) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('الكمية المطلوبة')) + '</label>'
            + '<input type="number" id="wrQty" min="1" value="10"></div>'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('يُصرَف له')) + '</label>'
            +   '<select id="wrTo"><option value="">— ' + esc(t('للورشة — بلا عهدة شخص')) + ' —</option>'
            +   techsList().map(function(x){
                  return '<option value="' + esc(x.n) + '">' + esc(x.n) + '</option>'; }).join('')
            +   '</select>'
            +   '<p class="hint" style="margin:6px 0 0">' + esc(t('يلزم مع «صرف أصناف» — القطعُ تدخل عُهدةَ من يُصرَف له لا عهدةَ من سجّل التنفيذ.')) + '</p></div>'
            + '</div>',
            btn('➕ إنشاء الطلب','btn-primary btn-sm',' data-wradd="1"'))
        : '')

      + (WR_DONE
        ? card(t('تسجيل تنفيذٍ') + ' — ' + esc(WR_DONE),
            '<div class="field" style="max-width:220px;margin:0"><label>' + esc(t('الكمية المُنفَّذة الآن')) + '</label>'
            + '<input type="number" id="wrDoneQty" min="1" value="1"></div>',
            btn('تأكيد','btn-primary btn-sm',' data-wrdonego="' + esc(WR_DONE) + '"')
            + btn('تراجع','btn-quiet btn-sm',' data-wrdonecancel="1"'))
        : '')

      + (L.length
        ? cardFlush(t('الطلبات') + ' — ' + nm(L.length),
            /* تسعةُ أعمدةٍ تدفع عمودَ الأزرار خارجَ شاشة الهاتف — فيُرى الجدولُ
               ولا يُبلَغ زرُّه. صارت ستةً: الطلبُ برقمه ونوعه، والصنفُ
               بمطلوبه ومنفَّذه، ومن أنشأه بتاريخه — والأزرارُ في عمودها. */
            table(['الطلب','الصنف','المطلوب / المنفَّذ','الحالة','أنشأه',''],
              L.map(function(r){
                var ed = WR_EDIT === r.id;
                return ['<span class="num">' + esc(r.no) + '</span><br>'
                          + (r.kind === 'prep' ? pill('تهيئة','acc')
                             : (r.kind === 'issue' ? pill('صرف','off') : pill('تجميع','warn'))),
                        ed && !cfgN(r.qtyDone)
                          ? '<select data-wreitem="' + esc(r.id) + '">' + itemsList().map(function(i){
                              return '<option value="' + esc(i.code) + '"' + (i.code === r.item ? ' selected' : '') + '>'
                                + esc(i.name) + '</option>'; }).join('') + '</select>'
                          : esc(itemName(r.item)),
                        ed
                          ? '<input type="number" min="1" id="wrEQ_' + esc(r.id) + '" value="' + esc(String(cfgN(r.qty))) + '" style="width:84px">'
                          : (N(r.qty) + ' / ' + N(r.qtyDone || 0)),
                        pill(r.status, r.status === 'تم' ? 'ok' : (r.status === 'قيد التنفيذ' ? 'warn' : 'off')),
                        '<span class="hint" style="margin:0">' + esc(dispName(r.by)) + '<br>'
                          + '<span class="num">' + esc(fmtDate(r.at)) + '</span></span>',
                        ed
                          ? '<div class="actions" style="margin:0">'
                            + btn('احفظ','btn-primary btn-sm',' data-wresave="' + esc(r.id) + '"')
                            + btn('إلغاء','btn-quiet btn-sm',' data-wredit=""') + '</div>'
                          : (r.status !== 'تم'
                          ? '<div class="actions" style="margin:0">'
                            + btn('سجّل تنفيذًا','btn-quiet btn-sm',' data-wrdone="' + esc(r.id) + '"')
                            + btn('✎','btn-quiet btn-sm',' data-wredit="' + esc(r.id) + '" aria-label="' + esc(t('تعديل')) + '"')
                            + (r.qtyDone ? '' : btn('🗑','btn-quiet btn-sm',' data-wrcancel="' + esc(r.id) + '" aria-label="' + esc(t('حذف')) + '"'))
                            + '</div>'
                          : '—')];
              })))
        : card('لا طلباتٍ بعد',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('أنشئ أوّل طلب تهيئةٍ أو تجميعٍ أعلاه.')) + '</p>'))

      + '<p class="hint">' + esc(t('كلُّ تنفيذٍ يُسجَّل في دفتر الحركة بنوعه الصحيح فيدخل حساب النقاط — لا تقديرَ ولا تارجت بلا منفَّذ.')) + '</p>';
  })();
    if (cur === 'wday') return head + (function(){
    var today = dayKey();
    var byName = Object.create(null);
    Object.keys(STATE.inss).forEach(function(id){
      var r = STATE.inss[id], x = siteFind(id);
      if (!x || r.status !== 'مُركّب' || !r.by) return;
      var day = dayKey(r.at || 0);
      if (day !== today) return;
      if (!byName[r.by]) byName[r.by] = { n:0, pts:0 };
      byName[r.by].n++;
      byName[r.by].pts += r.approved ? ptsInstall(x) : 0;
    });
    var names = Object.keys(byName).sort(function(a,b){ return byName[b].pts - byName[a].pts; });
    var totN = names.reduce(function(a,n){ return a + byName[n].n; }, 0);
    var totP = names.reduce(function(a,n){ return a + byName[n].pts; }, 0);

    return stats([['نفّذوا اليوم', N(names.length), 'acc'],
                  ['تركيباتٌ اليوم', N(totN)],
                  ['نقاطُ اليوم', N(Math.round(totP))]])

      + (names.length
        ? cardFlush(t('تركيبُ اليوم') + ' — ' + nm(names.length),
            table(['المنفِّذ','تركيب','نقاط'],
              names.map(function(n){ return [esc(n), N(byName[n].n), N(Math.round(byName[n].pts))]; }),
              ['<b>' + t('الإجمالي') + '</b>', N(totN), N(Math.round(totP))]))
        : card('تركيبُ اليوم',
            '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا تركيبَ اليوم بعد.')) + '</p>'))

      + alertBox('warn','التهيئةُ والتجميعُ لا يُحتسَبان هنا بعد — نظامُ طلبات الورشة (من نفَّذ ماذا) لم يُبنَ، كما في «طلبات المستودع».');
  })();
    if (cur === 'ships') return head + (function(){
    var L = shipList().filter(function(x){
      return !SHIP_Q || (x.ref + ' ' + (x.item || '') + ' ' + (x.sup || '')).indexOf(SHIP_Q) > -1;
    });
    var late = shipList().filter(function(x){ return shipLate(x) > 0; });
    var open = shipList().filter(function(x){ return !x.got; });

    return stats([['شحنات', N(shipList().length)],
                  ['في الطريق', N(open.length), open.length ? 'acc' : ''],
                  ['وصلت', N(shipList().length - open.length), 'ok'],
                  ['متأخرة', N(late.length), late.length ? 'bad' : 'ok']])

      + (late.length
        ? alertBox('warn', 'متأخرةٌ عن موعدها: '
            + late.map(function(x){ return x.ref + ' — ' + nm(shipLate(x)) + ' يومًا'; }).join(' · ')
            + '. الموعدُ المتوقَّعُ يُكتَب يومَ الشحن، فيُعرَف التأخّرُ يومَه لا بعد أسبوعين.')
        : '')

      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="shQ" data-shq="1" value="' + esc(SHIP_Q) + '" placeholder="'
      +     esc(t('ابحث برقم الشحنة أو الصنف أو المورّد')) + '" dir="auto">'
      + '</form>'

      + cardFlush(t('الشحنات') + ' — ' + nm(L.length),
          L.length
            ? table(['رقم الشحنة','الصنف','العدد','المورّد','الحالة','شُحنت','متوقَّع','وصلت','التأخّر',''],
                L.map(function(x){
                  var lt = shipLate(x);
                  return ['<strong>' + esc(x.ref) + '</strong>',
                          '<input value="' + esc(x.item || '') + '" data-shi="' + esc(x.id) + '" dir="auto">',
                          '<input type="number" min="0" value="' + esc(String(x.qty || 0))
                            + '" data-shqy="' + esc(x.id) + '" style="max-width:86px">',
                          '<input value="' + esc(x.sup || '') + '" data-shs="' + esc(x.id) + '" dir="auto">',
                          '<select data-shst="' + esc(x.id) + '">'
                            + SHIP_ST.map(function(v){
                                return '<option value="' + esc(v) + '"' + (x.st === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>';
                              }).join('') + '</select>',
                          '<input type="date" value="' + esc(x.sent || '') + '" data-shsn="' + esc(x.id) + '">',
                          '<input type="date" value="' + esc(x.eta || '') + '" data-sheta="' + esc(x.id) + '">',
                          '<input type="date" value="' + esc(x.got || '') + '" data-shgot="' + esc(x.id) + '">',
                          lt ? pill(nm(lt) + ' ' + t('يوم'), 'bad')
                             : (x.got ? pill(t('وصلت'), 'ok') : '—'),
                          (may('inventory') || may('money'))
                            ? (x.got ? '<span class="hint" style="margin:0">' + esc(t('وصلت')) + '</span>'
                                     : btn('حذف','btn-quiet btn-sm',' data-shdel="' + esc(x.id) + '"'))
                            : ''];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا شحناتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="ships"') : '')

      + ((may('inventory') || may('money'))
        ? card('تسجيل شحنة',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('رقم الشحنة')) + ' <span class="req">*</span></label>'
            +   '<input id="shRef" dir="auto" placeholder="SH-1448-001"></div>'
            + '<div class="field"><label>' + esc(t('الصنف')) + '</label><input id="shItem" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('العدد')) + '</label>'
            +   '<input id="shQty" type="number" min="0" value="0"></div>'
            + '<div class="field"><label>' + esc(t('المورّد')) + '</label>'
            +   '<select id="shSup"><option value="">— ' + esc(t('اختر')) + ' —</option>'
            +   supList().map(function(v){ return '<option>' + esc(v) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('تاريخ الشحن')) + '</label>'
            +   '<input id="shSent" type="date" value="' + esc(todayISO()) + '"></div>'
            + '<div class="field"><label>' + esc(t('الوصول المتوقَّع')) + ' <span class="req">*</span></label>'
            +   '<input id="shEta" type="date"></div>'
            + '</div>',
            btn('➕ تسجيل شحنة','btn-primary btn-sm',' data-shadd="1"'))
        : '')

      + '<p class="hint">' + esc(t('الوصولُ المتوقَّعُ يُكتَب يومَ الشحن — وبه يُحسَب التأخّرُ بنفسه ويصل إشعارٌ عاجلٌ مرةً في اليوم. والشحنةُ التي وصلت لا تُحذَف: سجلُّها أثرٌ يُسأل عنه.')) + '</p>';
  })();
    if (cur === 'invmv') return head + (function(){
    var L = movesList(), items = itemsList();
    return (may('inventory')
      ? card('تسجيل حركة',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('الحركة')) + '</label><select id="mvKind">'
          +   MOVE_KINDS.map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الصنف')) + '</label><select id="mvItem">'
          +   '<option value="">— ' + esc(t('اختر')) + ' —</option>'
          +   items.map(function(x){ return '<option>' + esc(x.name) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الكمية')) + '</label>'
          +   '<input id="mvQty" type="number" min="1" step="1"></div>'
          + '<div class="field"><label>' + esc(t('المنفِّذ')) + '</label><select id="mvBy">'
          +   '<option value="">—</option>'
          +   techsList(1).map(function(x){ return '<option>' + esc(x.n) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
          +   '<input id="mvSite" dir="ltr" placeholder="NSK-…"></div>'
          + '<div class="field"><label>' + esc(t('ملاحظة')) + '</label><input id="mvNote" dir="auto"></div>'
          + '</div>'
          + '<div class="actions">' + btn('سجّل الحركة','btn-primary',' data-mvadd="1"') + '</div>'
          + '<p class="hint">' + esc(t('الرصيدُ يُشتقُّ من الحركات — والتصحيحُ حركةٌ تصحيحيةٌ لا تعديلُ رقم.')) + '</p>')
      : '')
      + cardFlush(t('الحركات') + ' — ' + nm(L.length),
          L.length
            ? table(['التاريخ','الحركة','الصنف','الكمية','المنفِّذ','النقطة','سجّلها'],
                capList(L, 200).map(function(m){
                  var k = {'توريد':'ok','صرف':'acc','استهلاك':'warn','إرجاع':'info','شطب':'off'}[m.kind] || '';
                  return ['<span class="num">' + esc(dayKey(m.at)) + '</span>',
                          pill(t(m.kind), k), esc(m.item), N(m.qty),
                          esc(m.by || '—'),
                          '<span class="num">' + esc(m.site || '—') + '</span>',
                          esc(m.user || '—')];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا حركاتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="invmv"') : '');
  })();
    if (cur === 'stock') return head + (function(){
    var L = custodyByWho();
    var tot = L.reduce(function(a,r){ return a + r.total; }, 0);

    return stats([['من بيدهم عُهدة', N(L.length), L.length ? 'acc' : ''],
                  ['قطعٌ في العُهدة', N(tot)]])

      + (L.length
        ? cardFlush(t('العُهدة حسب المنفِّذ') + ' — ' + nm(L.length),
            table(['المنفِّذ','أصناف','قطع','التفصيل'],
              L.map(function(r){
                var ks = Object.keys(r.items).filter(function(k){ return r.items[k] > 0; });
                return ['<strong>' + esc(dispName(r.who)) + '</strong>', N(ks.length), N(r.total),
                        '<span class="hint" style="margin:0">'
                          + ks.map(function(k){ return esc(itemName(k)) + ' \u00d7' + nm(r.items[k]); }).join(' \u00b7 ')
                          + '</span>'];
              })))
        : card('لا عُهدةَ مصروفةً الآن',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('تظهر هنا فور أول صرفٍ من «دفتر حركة المخزون».')) + '</p>'))

      + '<p class="hint">' + esc(t('العُهدةُ صرفٌ ناقصَ ما استُهلك أو أُرجع أو شُطب — لا رقمَ يُكتب بيد.')) + '</p>';
  })();
    return head + (function(){
    var B = stockBalance();
    var tot = B.reduce(function(a,r){ return { store:a.store+r.store, custody:a.custody+r.custody,
                                               used:a.used+r.used, scrap:a.scrap+r.scrap }; },
                       { store:0, custody:0, used:0, scrap:0 });
    return stats([['في المخزن', N(tot.store), 'ok'],
                  ['في العُهدة', N(tot.custody), 'acc'],
                  ['رُكّب في الميدان', N(tot.used)],
                  ['تالف معزول', N(tot.scrap), tot.scrap ? 'bad' : '']])
      + cardFlush('الأرصدة حسب الصنف',
          B.length
            ? table(['الصنف','المخزن','العُهدة','رُكّب','تالف','الإجمالي'],
                B.map(function(r){
                  return [esc(r.item), N(r.store), N(r.custody), N(r.used),
                          r.scrap ? pill(nm(r.scrap),'off') : N(0),
                          '<b>' + N(r.store + r.custody + r.used + r.scrap) + '</b>'];
                }))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا حركاتٍ بعد — الرصيدُ يُشتقُّ من الحركات ولا يُكتَب بيد.')) + '</p>')
      + (B.some(function(r){ return r.store < 0 || r.custody < 0; })
          ? alertBox('warn','رصيدٌ سالبٌ في صنف — حركةٌ سُجّلت بلا ما يقابلها.') : '');
  })();
  }};


/* عُهدةُ كلِّ منفِّذ: صرفٌ إليه ناقصَ ما استُهلك أو أُرجع أو شُطب — بنفس
   معادلة stockBalance لكن مقسومةً بالاسم لا مجموعةً بالصنف. كان الجدولُ
   صفًّا واحدًا مكتوبًا بيد («فريق ١ · راوتر ×٣») يُعرَض ولو خلت الخزائن. */
function custodyByWho(){
  var by = {};
  function row(who){
    if (!by[who]) by[who] = { who:who, items:{}, total:0 };
    return by[who];
  }
  movesList().forEach(function(m){
    var who = m.by || '—', q = cfgN(m.qty), it = m.item || '—';
    if (!q) return;
    var d = 0;
    if (m.kind === 'صرف') d = q;
    else if (m.kind === 'استهلاك' || m.kind === 'إرجاع' || m.kind === 'شطب'
             || m.kind === 'إرجاع سليم' || m.kind === 'إرجاع تالف') d = -q;
    else return;
    var r = row(who);
    r.items[it] = (r.items[it] || 0) + d;
    r.total += d;
  });
  return Object.keys(by).map(function(k){ return by[k]; })
    .filter(function(r){ return r.total > 0; })
    .sort(function(a,b){ return b.total - a.total; });
}


/* ── المال ──────────────────────────────────────── */

/* ── الفنيون ────────────────────────────────────── */
/* ═══ الطاقمُ والفرقُ: قائمةٌ حيةٌ تُحرَّر لا بذرةٌ تُعرَض ═════════════════
   كان `TECHS` ستةَ أسماءٍ مكتوبةً في الشيفرة، وطاقمُ الموسم الماضي اثنان
   وأربعون فنيًّا مستخرجين من أوراق التنفيذ اليومية. ومن أراد إضافةَ فنيٍّ
   أو حذفَه أو نقلَه بين الفرق لم يجد أين. */



/* الفرقُ: تُضاف وتُحذَف كالفنيين */
/* ═══ نسخُ الأجهزة: كلُّ جهازٍ يقول نسختَه ═══
   كانت شريحةُ «نسخ الأجهزة» جدولًا مكتوبًا بيدٍ من عهد V14: اسمان ونسختان
   وإنذارٌ ثابت — فتقول للمكتب إن صاحبَ المشروع على إصدارٍ قديمٍ وهو على
   أحدثِ نسخة. صار كلُّ جهازٍ يكتب وثيقةَ حضوره `presence/{uid}` عند الدخول
   ثم كلَّ نصفِ ساعة: النسخةُ والدورُ والاسمُ والوقتُ ومعرِّفُ الجهاز — فيُقرأ
   من علِق على إصدارٍ قديمٍ من القاعدة لا من التخمين. والنسخةُ تُقرأ من
   الرأس نفسِه لا من ثابتٍ يشيخ. */
function appVer(){
  var b = document.querySelector('.ver-tag');
  var m = /V\d+\.\d+/.exec((b && b.textContent) || document.title || '');
  return m ? m[0] : '';
}
function agoTxt(ts){
  if (!ts) return '—';
  var m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return t('الآن');
  if (m < 60) return t('منذ') + ' ' + nm(m) + ' ' + t('د');
  var h = Math.round(m / 60);
  if (h < 48) return t('منذ') + ' ' + nm(h) + ' ' + t('س');
  return t('منذ') + ' ' + nm(Math.round(h / 24)) + ' ' + t('يوم');
}
var PRES = { at:0, ver:'', fetchAt:0 };
function presenceBeat(force){
  var u = myUid();
  if (!u) return false;
  try { if (typeof meActivatedCheck === 'function') meActivatedCheck(); } catch (e){ if (typeof softErr === 'function') softErr('activatedCheck', e, ''); }   /* هل فُعِّل الحسابُ؟ (V17.93) */
  var ver = appVer();
  if (!force && PRES.ver === ver && Date.now() - PRES.at < 10 * 60000) return false;
  PRES.at = Date.now(); PRES.ver = ver;
  var doc = { uid:u, name:STATE.meta.name || '', role:ROLE, ver:ver, at:Date.now(), reads:(typeof FB === 'object' && FB.readCount) || 0,
              day:dayKey(), dev:DEV_ID,
              ua:String((typeof navigator === 'object' && navigator.userAgent) || '').slice(0, 80),
              /* الاستهلاكُ والأداءُ والأعطالُ من الجهاز نفسِه (V17.34) */
              q:(STATE.queue || []).filter(function(it){ return it.kind !== 'presence' && it.kind !== 'stats'; }).length,
              pz:(STATE.poison || []).length,
              pq:(typeof PHOTO_Q === 'object' && PHOTO_Q.length) || 0, pf:(typeof PHOTO_FAIL === 'object' && PHOTO_FAIL.length) || 0,
              err:Object.keys(typeof ERR_SEEN === 'object' ? ERR_SEEN : {}).length,
              rms:perfAvg('r'), pms:perfAvg('p'), pulse:!!PULSE_UNSUB, up:Math.round((Date.now() - BOOT_AT) / 60000),
              /* قراءاتُ اليوم لا الجلسة — الجلسةُ قد تمتدّ أيامًا فيبدو الرقمُ فادحًا (V17.36) —
                 وعددُ السحبات الباردة: هي ما يرفع القراءاتِ بالآلاف */
              rd:(typeof readBudget === 'function' ? readBudget() : 0), cp:COLD_N,
              ps:(typeof PERSIST === 'object' ? PERSIST.st : ''), ib:IDB_BAD ? 1 : 0,   /* التخزينُ الدائمُ والمخزنُ المحلي (V17.93) */
              pg:(typeof pageUse === 'function' ? pageUse().n : {}),                       /* فتحُ الصفحات اليومَ (V17.95) */
              pf:(typeof perfSummary === 'function' ? perfSummary() : null),               /* مؤشّراتُ الأداء (V17.98) */
              on:(typeof navigator === 'object' && navigator.onLine !== false) };
  STATE.presence = STATE.presence || {};
  STATE.presence[u] = doc;
  CORE.dirty('presence', u, doc);
  return true;
}
setInterval(function(){ presenceBeat(false); }, 30 * 60000);
function presenceFetch(force){
  if (!FB.ready || !FB.db) return Promise.resolve(0);
  if (!force && Date.now() - PRES.fetchAt < 2 * 60000) return Promise.resolve(0);
  PRES.fetchAt = Date.now();
  return FB.db.collection('presence').limit(500).get().then(function(sn){
    FB.readCount = (FB.readCount || 0) + sn.size;
    STATE.presence = STATE.presence || {};
    sn.forEach(function(d){ STATE.presence[d.id] = d.data(); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    if (CUR === 'sys') render(1);
    return sn.size;
  }).catch(function(e){ softErr('سحب نسخ الأجهزة', e, ''); return 0; });
}
function presenceRows(){
  var P = STATE.presence || {};
  return Object.keys(P).map(function(k){ return Object.assign({ uid:k }, P[k] || {}); })
    .sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}

/* ═══ التصفير: بدايةُ الموسم من صفر ═══
   البياناتُ تتراكم من التجارب قبل أن يبدأ العمل — سجلاتٌ وحركاتٌ وأحداثٌ
   ومقترحات. والبدءُ بها يفسد كلَّ رقمٍ بعدها. والتصفيرُ لا يمسّ المواقعَ
   ولا الطاقمَ ولا الإعدادات: يمسح ما سُجِّل لا ما عُرِّف.
   ═══ كلُّ بندٍ باسمه في الطابور لا باسمه في الحالة ═══
   كان أمرُ الحذف يُقيَّد باسم البند في الحالة (`events`) والطابورُ يعرفه
   باسمٍ آخر (`evlog`) — فيذهب إلى «متفرقات» المقفولة، يُرفَض ثلاثًا ويُعزَل،
   وتمتلئ شاشةُ المزامنة بأحدَ عشرَ رفضًا يُنسَب إلى الحساب وسببُه اسمٌ.
   والإشعاراتُ محليةٌ لا مجموعةَ لها أصلًا. وسجلُّ الأحداث أثرٌ لا يُحذَف من
   القاعدة بقرار (V15.90): يُفرَغ من الجهاز ويبقى هناك — والتصفيرُ نفسُه
   أوّلُ ما يُكتَب فيه. */
var WIPE_KEYS = [
  /* [مفتاحُ الحالة، الاسم، نوعُ الطابور — null: يُفرَغ من هذا الجهاز فقط] */
  ['recs','سجلات المسح','recs'], ['inss','سجلات التركيب','inss'], ['diss','الفك','diss'],
  ['tasks','المهام','tasks'], ['photos','الصور','photos'], ['moves','حركات المخزون','moves'],
  ['buys','المشتريات','buys'], ['events','سجل الأحداث', null], ['notifs','الإشعارات', null],
  ['coreqs','طلبات الشركات','coreqs'], ['fixreqs','طلبات التصويب','fixreqs'],
  ['newsites','المواقع المقترحة','newsites'], ['stats','اللقطات اليومية','stats'],
  ['bonus','نقاط الزيادة','bonus'], ['workReqs','طلبات الورشة','workReqs']];

function wipeCounts(){
  return WIPE_KEYS.map(function(k){
    var v = STATE[k[0]];
    return [k[1], Array.isArray(v) ? v.length : (v ? Object.keys(v).length : 0), k[2]];
  });
}

function wipeGo(){
  if (!may('delete')){ toast(t('التصفيرُ للمهندس وحده')); return; }
  var el = document.getElementById('wipeOk');
  if (!el || String(el.value || '').trim() !== 'مسح نهائي'){
    toast(t('اكتب «مسح نهائي» حرفًا بحرف للتأكيد')); return;
  }
  /* كان يُفرِغ الذاكرةَ المحليةَ وحدَها ثم يعد بأن «السحابةَ تُصفَّر مع أول
     مزامنة» — ولا شيءَ يصفّرها: المزامنةُ ترفع ما في الطابور ثم تسحب ما في
     القاعدة، فتعود السجلاتُ كما كانت بعد دقائق. فصار يُسجَّل لكلِّ سجلٍّ له
     مجموعةٌ أمرُ حذفٍ صريحٌ في الطابور — باسم نوعه في الطابور — قبل إفراغ
     الذاكرة؛ وما هو من الجهاز فقط يُفرَغ هنا ويُقال. */
  var n = 0, dels = [], local = 0;
  WIPE_KEYS.forEach(function(k){
    var v = STATE[k[0]];
    var cnt = Array.isArray(v) ? v.length : (v ? Object.keys(v).length : 0);
    n += cnt;
    if (k[2]){
      var ids = Array.isArray(v)
        ? v.map(function(x){ return x && x.id; }).filter(Boolean)
        : Object.keys(v || {});
      ids.forEach(function(id){ dels.push([k[2], id]); });
    } else local += cnt;
    STATE[k[0]] = Array.isArray(v) ? [] : {};
  });
  /* مرآةُ الأحداث في الطابور تُفرَغ معها — وإلا رُفعت الأحداثُ القديمةُ ثانيةً */
  STATE.evlog = {};
  /* الطابورُ القديمُ يُفرَغ: ما لم يُرفَع من بياناتٍ مُصفَّرةٍ لا معنى لرفعه —
     والمعزولُ من قبل التصفير كذلك */
  if (STATE.queue) STATE.queue.length = 0;
  STATE.poison = [];
  /* ثم تُقيَّد أوامرُ الحذف — بعد الإفراغ لئلّا تُمحى معه */
  /* ما له شاهدُ قبرٍ يُصفَّر شاهدًا فيصل كلَّ جهازٍ سحبَ نسخةً قبل التصفير؛ والمحوُ
     الصامتُ لا يصل أحدًا — فتبقى السجلاتُ عند الآخرين كأن لم يُصفَّر شيء. */
  dels.forEach(function(d){
    if (CORE.TOMB[d[0]]) CORE.dirty(d[0], d[1], { id:String(d[1]), deleted:true, at:Date.now(), by:STATE.meta.name || '' });
    else CORE.dirty(d[0], d[1], null);
  });
  /* والحالةُ الميدانيةُ على المواقع تعود كما وُلدت */
  STATE.sites.forEach(function(x){ x.fstat = 'لم يبدأ'; });
  SITE_IX = null; SITE_TOK = null;
  /* عهدٌ جديدٌ لكلِّ الأجهزة: ما عندها يُفرَغ ولا يُرفَع — فتبدأ القاعدةُ جديدةً حقًّا */
  STATE.meta.epoch = Date.now();
  CORE.set('cfg', 'app', { epoch:STATE.meta.epoch, epochBy:STATE.meta.name || '', epochAt:STATE.meta.epoch });
  CORE.saveSoon(); statBump();
  logEvent('تصفير النظام — ' + nm(n) + ' سجلًّا · ' + nm(dels.length) + ' أمرَ حذفٍ للسحابة · '
           + nm(local) + ' أُفرغ من الجهاز');
  toast(t('صُفِّر النظام') + ' — ' + nm(n) + ' ' + t('سجلًّا'));
  render(1);
}

/* بطاقةُ المخزن المحلي (V17.93): قاعدةُ الجهاز تعمل أم الذاكرة، والتخزينُ الدائم */
function localStoreCard(){
  var idb = IDB_BAD ? pill(t('لا يعمل — الذاكرةُ فقط'), 'bad') : (_idb ? pill(t('يعمل'), 'ok') : pill(t('يُفتَح…'), ''));
  var ps = PERSIST.st === 'yes' ? pill(t('مُنح'), 'ok') : PERSIST.st === 'no' ? pill(t('لم يُمنَح'), 'wrn') : PERSIST.st === 'na' ? pill(t('غيرُ متاح'), '') : pill(t('لم يُسأل بعد'), '');
  return card('المخزنُ المحلي', '<div class="wt-row" style="gap:14px;flex-wrap:wrap">'
    + '<span>' + esc(t('قاعدةُ الجهاز')) + ': ' + idb + '</span>'
    + '<span>' + esc(t('التخزينُ الدائم')) + ': ' + ps + '</span>'
    + (IDB_BAD ? '<span class="hint" style="margin:0">' + esc(t('زامن الآن ولا تغلق التطبيق حتى يُرفَع عملُك.')) + '</span>' : '') + '</div>');
}
/* ═══ النبضُ والتقريرُ في التطبيق (V17.94) ═══
   كانا بلاغَين عامَّين في المستودع. صارا في settings/sysreport يقرؤهما المكتبُ
   هنا: نصُّ آخرِ نبضٍ وآخرِ تقريرٍ بتاريخهما — قراءةٌ واحدةٌ كلَّ عشر دقائق. */
var SYSREP = { at:0, v:null, err:'' };
function sysReportFetch(force){
  if (!(may('users') || rankOf(ROLE) >= rankOf('engineer') || effRole(ROLE) === 'exec')) return Promise.resolve(null);
  if (!force && Date.now() - SYSREP.at < 600000) return Promise.resolve(SYSREP.v);
  if (!FB.ready || !FB.db) return Promise.resolve(null);
  SYSREP.at = Date.now();
  return FB.db.collection('settings').doc('sysreport').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    SYSREP.v = (doc && doc.exists) ? doc.data() : {}; SYSREP.err = '';
    if (CUR === 'sys') render(1);
    return SYSREP.v;
  }).catch(function(e){ SYSREP.err = String(e && (e.message || e.code) || e).slice(0, 80); return null; });
}
function sysReportCard(){
  if (!(may('users') || rankOf(ROLE) >= rankOf('engineer') || effRole(ROLE) === 'exec')) return '';
  if (!SYSREP.v && !SYSREP.err) sysReportFetch();
  var v = SYSREP.v || {};
  var one = function(k, title){
    var x = v[k]; if (!x || !x.text) return '<p class="hint" style="margin:0">' + esc(t(title)) + ': ' + esc(t('لم يصل بعد')) + '</p>';
    return '<details><summary><b>' + esc(t(title)) + '</b> \u00b7 <span class="num">' + esc(fmtDT(x.at)) + '</span></summary>'
      + '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.7;margin:8px 0 0">' + esc(String(x.text).slice(0, 12000)) + '</pre></details>';
  };
  return card('ملخّصُ الصباح وتقريرُ النظام', one('pulse', 'ملخّصُ الصباح') + one('report', 'تقريرُ النظام')
    + (SYSREP.err ? '<p class="hint" style="margin:6px 0 0">' + esc(SYSREP.err) + '</p>' : ''));
}
/* ═══ بطاقةُ استعمال الصفحات وقراءات اليوم (V17.95) ═══
   الأيامُ الثلاثون يجمعها النبضُ الصباحيُّ في settings/usage (كتابةٌ واحدةٌ في
   اليوم) من نبضات الحضور؛ وقراءاتُ اليوم تُجمَع هنا من وثائق الحضور المحمَّلة
   أصلًا للمكتب — لا قراءةَ جديدةً ولا مستمعًا. الحصةُ المجانية ٥٠ ألف قراءةٍ في
   اليوم، والكهرمانيُّ عند ٧٠٪. */
var USAGE = { at:0, v:null };
function usageFetch(force){
  if (!(may('users') || may('exportAll'))) return Promise.resolve(null);
  if (!force && Date.now() - USAGE.at < 600000) return Promise.resolve(USAGE.v);
  if (!FB.ready || !FB.db) return Promise.resolve(null);
  USAGE.at = Date.now();
  return FB.db.collection('settings').doc('usage').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + 1;
    USAGE.v = (doc && doc.exists) ? doc.data() : {}; if (CUR === 'sys') render(1); return USAGE.v;
  }).catch(function(){ return null; });
}
function readsToday(){
  var day = dayKey(), sum = 0, n = 0;
  Object.keys(STATE.presence || {}).forEach(function(u){ var p = STATE.presence[u]; if (p && p.day === day){ sum += (+p.rd || 0); n++; } });
  return { reads:sum, devices:n };
}
function usageCard(){
  if (!(may('users') || may('exportAll'))) return '';
  if (!USAGE.v) usageFetch();
  var rt = readsToday(), QUOTA = 50000, pct = Math.round(rt.reads / QUOTA * 100);
  var days = (USAGE.v && USAGE.v.days) || {}, since = dayKey(Date.now() - 30 * 864e5);
  var keys = Object.keys(days).filter(function(k){ return k >= since; }).sort();   /* ثلاثون يومًا تقويميًّا لا آخرُ ثلاثين مفتاحًا */
  var tot = {}; keys.forEach(function(d){ var m = days[d] || {}; Object.keys(m).forEach(function(p){ tot[p] = (tot[p] || 0) + (+m[p] || 0); }); });
  var top = Object.keys(tot).sort(function(a, b){ return tot[b] - tot[a]; }).slice(0, 12);
  /* ما لم يُفتَح في ثلاثين يومًا من صفحات المكتب — لتقرّر ما يُدمَج أو يُخفى (V19.0) */
  var unused = '';
  if (keys.length >= 7){
    var vis = []; NAV.forEach(function(sct){ (sct.solo ? [[sct.id, sct.label]] : sct.items).forEach(function(i){ if (seesPage(i[0]) && vis.every(function(v){ return v[0] !== i[0]; })) vis.push(i); }); });
    var zero = vis.filter(function(i){ return !tot[i[0]]; });
    unused = '<p class="hint" style="margin:8px 0 0">' + esc(t('صفحاتٌ لم تُفتَح في ثلاثين يومًا')) + ' (' + nm(zero.length) + '): ' + (zero.length ? zero.slice(0, 20).map(function(i){ return esc(t(i[1])); }).join(' \u00b7 ') : '\u2014') + '</p>';
  }
  return card('استعمالُ الصفحات وقراءاتُ اليوم',
    '<div class="wt-row" style="gap:14px;flex-wrap:wrap;align-items:center"><span>' + esc(t('قراءاتُ اليوم تقريبًا')) + ': <b class="num">' + nm(rt.reads) + '</b> / ' + nm(QUOTA)
    + ' ' + pill(nm(pct) + '٪', pct >= 100 ? 'bad' : pct >= 70 ? 'wrn' : 'ok') + ' <span class="hint" style="margin:0">' + nm(rt.devices) + ' ' + esc(t('جهازًا أرسل بياناته اليوم')) + '</span></span></div>'
    + (top.length ? '<table class="tbl" style="margin-top:8px"><thead><tr><th>' + esc(t('الصفحة')) + '</th><th>' + esc(t('فتحاتٌ في ٣٠ يومًا')) + '</th></tr></thead><tbody>'
        + top.map(function(p){ return '<tr><td>' + esc(PAGE[p] ? t(PAGE[p].t) : p) + '</td><td class="num">' + nm(tot[p]) + '</td></tr>'; }).join('') + '</tbody></table>'
      : '<p class="hint" style="margin:8px 0 0">' + esc(t('لا تجميعَ بعد — يكتبه ملخّصُ الصباح مرةً في اليوم.')) + '</p>') + unused);
}
/* ═══ حارسُ التكلفة (V17.96) ═══
   الحصةُ المجانيةُ تكفي الموسمَ — لكنَّ حلقةً خاطئةً على جهازٍ واحدٍ تستهلكها في
   يوم، ولا يُعلَم إلا بالفاتورة. تنبيهُ الميزانية في Google Cloud يُضبَط يدًا
   مرةً واحدة (الخطواتُ في docs/cost-guard.md) ويؤشّره المديرُ هنا فيختفي من
   الجاهزية. */
function costGuardCard(){
  var on = !!cfgGet('budgetAlert');
  return card('حارسُ التكلفة', '<div class="wt-row" style="gap:12px;flex-wrap:wrap;align-items:center">'
    + '<span>' + esc(t('تنبيهُ ميزانية Google Cloud')) + ': ' + (on ? pill(t('مضبوط'), 'ok') : pill(t('غيرُ مضبوط'), 'wrn')) + '</span>'
    + btn(on ? t('أُلغي الضبط') : '\u2713 ' + t('ضبطتُه — أشِّر'), on ? 'btn-quiet btn-sm' : 'btn-primary btn-sm', ' data-budalert="' + (on ? 0 : 1) + '"')
    + '<a class="btn btn-quiet btn-sm" href="docs/cost-guard.md" target="_blank" rel="noopener">' + esc(t('خطواتُ الضبط')) + '</a></div>'
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('الحصةُ المجانية ٥٠ ألف قراءةٍ و٢٠ ألف كتابةٍ في اليوم — والتنبيهُ يبلّغك قبل أن تصل الفاتورة. قراءاتُ اليوم في صحة النظام ← الاستهلاك.')) + '</p>');
}
/* ═══ بطاقةُ أداء الميدان (V17.98) ═══
   من نبضات الحضور المحمَّلة أصلًا للمكتب: أبطأُ الأجهزة (الطرازُ من وكيل
   المستخدم، لا اسمٌ)، وأبطأُ الصفحات، والمؤشّراتُ الثلاثةُ على عتبات جوجل
   عند p75: LCP ≤ ٢٫٥ ث · INP ≤ ٢٠٠ مللي ثانية · CLS ≤ ٠٫١. غيابُ واجهةٍ = «—». */
function uaModel(ua){
  ua = String(ua || '');
  var m = /\(([^)]*)\)/.exec(ua), inner = m ? m[1] : '';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  var a = /Android[^;]*;\s*([^;)]+)/.exec(inner); if (a) return a[1].replace(/\s*Build.*$/, '').trim().slice(0, 24);
  if (/Windows/.test(ua)) return 'Windows'; if (/Macintosh/.test(ua)) return 'Mac';
  return 'جهاز';
}
function perfRows(){
  var out = [];
  Object.keys(STATE.presence || {}).forEach(function(u){ var p = STATE.presence[u]; if (p && p.pf && typeof p.pf === 'object') out.push({ uid:u, model:uaModel(p.ua), ver:p.ver, pf:p.pf }); });
  return out;
}
function perfCard(){
  if (!(may('users') || may('exportAll'))) return '';
  var R = perfRows(); if (!R.length) return '';
  var band = function(v, good, poor){ return v == null ? pill('\u2014', '') : pill(String(v), v <= good ? 'ok' : v <= poor ? 'wrn' : 'bad'); };
  var lcp = p75(R.map(function(r){ return r.pf.lcp && r.pf.lcp.p75; }).filter(function(x){ return x != null; }));
  var inp = p75(R.map(function(r){ return r.pf.inp && r.pf.inp.p75; }).filter(function(x){ return x != null; }));
  var cls = p75(R.map(function(r){ return r.pf.cls; }).filter(function(x){ return x != null; }));
  var devs = R.filter(function(r){ return r.pf.inp && r.pf.inp.p75 != null; }).sort(function(a, b){ return b.pf.inp.p75 - a.pf.inp.p75; }).slice(0, 5);
  var pages = {}; R.forEach(function(r){ Object.keys(r.pf.pages || {}).forEach(function(k){ var v = r.pf.pages[k]; if (v && v.p75 != null){ pages[k] = pages[k] || []; pages[k].push(v.p75); } }); });
  var pg = Object.keys(pages).map(function(k){ return [k, p75(pages[k])]; }).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 6);
  return card('أداءُ الميدان — ما يشعر به الفني',
    '<div class="wt-row" style="gap:14px;flex-wrap:wrap"><span>LCP p75: ' + band(lcp == null ? null : Math.round(lcp / 100) / 10, 2.5, 4) + ' ' + esc(t('ث')) + '</span>'
    + '<span>INP p75: ' + band(inp, 200, 500) + ' ' + esc(t('م.ث')) + '</span><span>CLS p75: ' + band(cls, 0.1, 0.25) + '</span>'
    + '<span class="hint" style="margin:0">' + nm(R.length) + ' ' + esc(t('جهازًا أرسل قياسًا اليوم')) + '</span></div>'
    + (devs.length ? '<table class="tbl" style="margin-top:8px"><thead><tr><th>' + esc(t('أبطأُ الأجهزة')) + '</th><th>INP p75</th><th>' + esc(t('فتح←خريطة')) + '</th><th>' + esc(t('مهامّ طويلة')) + '</th></tr></thead><tbody>'
        + devs.map(function(r){ return '<tr><td>' + esc(r.model) + ' <span class="hint" style="margin:0">' + esc(r.ver || '') + '</span></td><td class="num">' + nm(r.pf.inp.p75) + '</td><td class="num">' + (r.pf.open != null ? nm(r.pf.open) : '\u2014') + '</td><td class="num">' + (r.pf.lt != null ? nm(r.pf.lt) : '\u2014') + '</td></tr>'; }).join('') + '</tbody></table>' : '')
    + (pg.length ? '<table class="tbl" style="margin-top:8px"><thead><tr><th>' + esc(t('أبطأُ الصفحات')) + '</th><th>' + esc(t('رسمٌ p75 (م.ث)')) + '</th></tr></thead><tbody>'
        + pg.map(function(x){ return '<tr><td>' + esc(PAGE[x[0]] ? t(PAGE[x[0]].t) : x[0]) + '</td><td class="num">' + nm(x[1]) + '</td></tr>'; }).join('') + '</tbody></table>' : ''));
}
PAGE.sys = { m:'النظام', t:'صحة النظام',
  l:'سلامةُ البيانات ومزامنتُها ونسخُ الأجهزة وعمرُها وتصفيرُها — صيانةُ النظام كلُّها.',
  body:function(){
    var head = tabHead('sys'), cur = tabCur('sys');
    if (cur === 'hb') return head + (function(){
    /* الأربعةُ كانت أصفارًا مكتوبةً بيدٍ مهما نبضت الأجهزة — تُعَدُّ من النبضات:
       الوثيقةُ التي فيها `st` نبضةٌ، والتي فيها `from/to` انتقالٌ (hbev) */
    var HB = STATE.hb || {}, hbk = Object.keys(HB);
    var beats = hbk.filter(function(k){ return HB[k] && HB[k].st; });
    var up = beats.filter(function(k){ return HB[k].st === 'up'; }).length, down = beats.length - up;
    var gap = beats.filter(function(k){
      var h = HB[k]; return h.st === 'down' && h.since && Date.now() - Date.parse(h.since) >= 10 * 60000;
    }).length;
    var day0 = dayKey();
    var flap = hbk.filter(function(k){
      var h = HB[k]; return h && h.from && h.to && dayKey(Date.parse(h.ts) || 0) === day0;   /* (V26.2) يومُ مكة لا نصُّ التاريخ العالمي */
    }).length;
    return (may('settings') ? readyCard() : '')
      + bkCard()
      + (beats.length ? '' : alertBox('error','لم تصل أي إشارة بعد — شغّل أداة الفحص على جهاز المكتب المتصل بشبكة الميدان.'))
      + stats([['متصل', N(up), 'ok'], ['غير متصل', N(down), down ? 'bad' : ''],
               ['فاصل ≥١٠ دقائق', N(gap), gap ? 'wrn' : ''], ['متذبذب اليوم', N(flap)]])
      + card('اصطلاح العناوين', table(['الجهاز','آخر خانة','مثال'], [
          ['راوتر','<span class="num">.1</span>','<span class="num">10.20.30.1</span>'],
          ['قارئ','<span class="num">.2</span>','<span class="num">10.20.30.2</span>'],
          ['كاميرا','<span class="num">.3</span>','<span class="num">10.20.30.3</span>']
        ]));
  })();
    if (cur === 'probe') return head + (function(){
    var withIp = STATE.sites.filter(function(s){ return probeIp(s); }).length;
    var el = PROBE.t ? Math.round((Date.now() - PROBE.t) / 1000) : 0;
    return alertBox('info','المتصفّح لا يملك ping — تُطلَب صفحةُ الجهاز ويُقاس ردُّه. والردُّ بخطأٍ دليلُ حياةٍ أيضًا: المنفذُ موجود. الصمتُ وحده موت.')
      + stats([['عناوين مسجّلة', N(withIp), withIp?'':'wrn'],
               ['فُحص', N(PROBE.done)],
               ['حيّ', N(PROBE.up), 'ok'],
               ['صامت', N(PROBE.down), PROBE.down?'bad':'']])
      + card('التشغيل',
          (withIp
            ? '<div class="actions">'
              + btn(PROBE.on ? '⏸ ' + t('أوقف') : '▶ ' + t('ابدأ الفحص'),
                    PROBE.on ? 'btn-danger' : 'btn-primary', ' data-probe="1"')
              + (PROBE.on ? '<span class="hint" style="margin:0">'
                  + nm(PROBE.done) + ' / ' + nm(withIp) + ' · ' + nm(el) + ' ث</span>' : '')
              + '</div>'
              + (PROBE.on ? meter('التقدم', PROBE.done, withIp) : '')
            : '<p class="hint" style="margin:0">' + esc(t('لا عناوين بعد — تُشتقّ من بادئة الشبكة التي تُدخَل عند التركيب.')) + '</p>'))
      + (PROBE.log.length
        ? cardFlush('آخر ما فُحص',
            table(['النقطة','العنوان','الحالة'],
              PROBE.log.slice(0, 24).map(function(r){
                return ['<span class="num">' + esc(r.id) + '</span>',
                        '<span class="num" dir="ltr">' + esc(r.ip) + '</span>',
                        pill(r.alive ? 'حيّ' : 'صامت', r.alive ? 'ok' : 'off')];
              })))
        : '')
      + card('اصطلاح العناوين',
          table(['الجهاز','آخر خانة','مثال'], [
            ['راوتر','<span class="num">.1</span>','<span class="num" dir="ltr">10.20.30.1</span>'],
            ['قارئ','<span class="num">.2</span>','<span class="num" dir="ltr">10.20.30.2</span>'],
            ['كاميرا','<span class="num">.3</span>','<span class="num" dir="ltr">10.20.30.3</span>']
          ])
          + '<p class="hint">' + esc(t('تُشتقّ كلها من بادئةٍ واحدةٍ تُكتب مرةً عند التركيب.')) + '</p>');
  })();
    if (cur === 'drive') return head + (function(){
    drvCfg();
    var n = STATE.sites.length;
    var est = Math.round(n * 4 * 180 / 1024);   /* أربعُ صورٍ للنقطة بمئةٍ وثمانين كيلو */
    return (PHOTO_FAIL.length
        ? alertBox('warn','صورٌ تعذّر رفعُها بعد خمس محاولات — لم تُفقَد، وهي على هذا الجهاز.')
          + card('بانتظار إعادة المحاولة',
              '<div class="pop-rows" style="margin:0">'
              + PHOTO_FAIL.slice(0, 12).map(function(x){
                  return '<div><span class="k">' + esc(x.site) + ' · ' + esc(t(x.kind)) + '</span>'
                    + '<span>' + esc(x.why || t('سببٌ غير معروف')) + '</span></div>';
                }).join('') + '</div>',
              btn('أعد المحاولة','btn-primary btn-sm',' data-pretry="1"'))
        : '')
      + stats([['في الطابور', N(PHOTO_Q.length), PHOTO_Q.length?'wrn':'ok'],
                  ['تعذّر رفعُها', N(PHOTO_FAIL.length), PHOTO_FAIL.length?'wrn':'ok'],
                  ['رُفعت', N(Object.keys(STATE.photos || {}).length), 'ok'],
                  ['المتوقَّع للمشروع', N(est) + ' ' + t('ميجا')],
                  ['الإذن', DRV.ready ? t('ممنوح') : t('لم يُطلَب'), DRV.ready?'ok':'wrn']])

      + (drvCfg()
        ? alertBox('success','درايفك موصولٌ — الصورُ تُرفَع إليه ويُحفَظ رابطُها في السجل.')
        : alertBox('warn','لم يُوصَل درايفك بعد — الصورُ تُحفَظ على الجهاز وتنتظر.'))

      + card('الوصل',
          '<div class="field"><label>Client ID</label>'
          + '<input id="drvClient" dir="ltr" placeholder="xxxxx.apps.googleusercontent.com" value="'
          +   esc(DRV.clientId) + '"></div>'
          + '<div class="field"><label>' + esc(t('معرّف مجلّد المشروع')) + ' — ' + esc(t('اختياري')) + '</label>'
          + '<input id="drvFolder" dir="ltr" placeholder="1AbC…" value="' + esc(DRV.folderId) + '"></div>'
          + '<p class="hint">' + esc(t('المعرّفُ من رابط المجلّد في درايفك — ما بعد ‎/folders/‎. وإن تُرك فارغًا رُفعت في الجذر.')) + '</p>',
          '<div class="actions">'
          + btn('احفظ','btn-primary btn-sm',' data-drvsave="1"')
          + btn('اختبر الإذن','btn-secondary btn-sm',' data-drvtest="1"')
          + '</div>')

      + card('كيف يُنشَأ Client ID',
          table(['#','الخطوة'], [
            ['١','افتح console.cloud.google.com وأنشئ مشروعًا أو اختر قائمًا'],
            ['٢','فعّل Google Drive API من مكتبة الواجهات'],
            ['٣','في «بيانات الاعتماد» أنشئ OAuth client ID من نوع تطبيق ويب'],
            ['٤','أضف mhmdsfwt371.github.io إلى Authorized JavaScript origins'],
            ['٥','انسخ المعرّفَ والصقه أعلاه'],
            ['٦','أنشئ مجلّدًا في درايفك للمشروع وانسخ معرّفه من رابطه']
          ])
          + '<p class="hint">' + esc(t('النطاقُ المطلوبُ drive.file — لا يرى إلا ما يرفعه التطبيق، لا بقيةَ درايفك.')) + '</p>')

      + card('لماذا لا تُحفَظ في قاعدة البيانات',
          '<p class="hint" style="margin:0">'
          + esc(t('وثيقةُ Firestore لا تتجاوز ميغابايتًا، وصورةٌ واحدةٌ تقاربه. ولو حُفظت هناك لامتلأت الحصّةُ في أيام. أما درايفك فخمسةُ تيرا — تكفي المشروعَ مرارًا. ويبقى في السجل معرّفُ الملف ورابطُه فيُفتَح بضغطة.'))
          + '</p>');
  })();
    if (cur === 'bugs') return head + bugsPageHtml();
    if (cur === 'sys') return head + localStoreCard() + sysReportCard() + (function(){
    /* ═══ فحوصٌ حقيقيةٌ لا أصفارٌ مكتوبة ═══
       كانت الشاشةُ أربعةَ أصفارٍ بيدٍ — تقول «سليم» ولو كانت القاعدةُ مليئةً
       بالتناقض. صارت كلُّ خانةٍ تُحسَب من البيانات لحظةَ الفتح، وكلُّ رقمٍ فوق
       الصفر يُضغَط فيفتح ما فيه. ما يسوء يُرى هنا قبل أن تراه الوزارة. */
    var R = STATE.recs || {}, I = STATE.inss || {}, T = STATE.tasks || {}, U = STATE.users || {};
    var names = {}; Object.keys(U).forEach(function(k){ if (U[k] && U[k].name) names[U[k].name] = 1; });
    techsList(true).forEach(function(x){ names[x.n] = 1; });
    var q = {};
    q.insNoSol = Object.keys(I).filter(function(id){ var r = I[id]; var so = solutionOf(id); return r && r.status === 'مُركّب' && !(so && so.status === 'معتمد'); });
    q.schedNoSv = Object.keys(T).filter(function(k){ var x = T[k]; return x && x.kind === 'install' && x.status !== 'مُنجز' && x.status !== 'معتمد' && !svDone(R[x.site]); });
    q.negStock = stockBalance().filter(function(b){ return b.store < 0 || b.custody < 0; });
    q.buyNoSup = buysList().filter(function(b){ return !b.sup && !b.vendor; });
    q.noCoord = (STATE.sites || []).filter(function(x){ return !(+x.lat) || !(+x.lng); });
    var comp = coCompounds(); q.compound = Object.keys(comp);
    q.svNoPhoto = Object.keys(R).filter(function(id){ return svDone(R[id]) && !photoCount(id); });
    q.taskGhost = Object.keys(T).filter(function(k){ var x = T[k]; return x && x.to && x.status !== 'مُنجز' && x.status !== 'معتمد' && !names[x.to]; });
    q.dupUsers = usrDupes();
    q.poison = STATE.poison || [];
    q.oldRevisit = Object.keys(R).filter(function(id){ var r = R[id]; return r && r.review === 'revisit' && (Date.now() - (r.revisitAt || r.at || 0)) > 3 * 86400000; });
    var rowOf = function(lab, arr, sev, go, hint){
      var n = arr.length;
      return [esc(t(lab)) + (hint ? '<br><span class="hint" style="margin:0">' + esc(t(hint)) + '</span>' : ''),
              n ? pill(nm(n), sev || 'bad') : pill(nm(0), 'ok'),
              n && go ? btn(t('افتح'),'btn-quiet btn-sm',' data-p="' + esc(go) + '"') : ''];
    };
    var bad = q.insNoSol.length + q.schedNoSv.length + q.negStock.length + q.noCoord.length + q.taskGhost.length + q.dupUsers.length + q.poison.length;
    return (bad ? alertBox('warn', nm(bad) + ' ' + t('ملاحظةً تحتاج نظرًا — الأرقامُ أدناه حيّةٌ لحظةَ الفتح'))
                : alertBox('ok', t('لا تناقضَ في البيانات — كلُّ الفحوص صفر')))
      + cardFlush('فحوص التناقض', table(['الفحص','النتيجة',''], [
          rowOf('نقاط مُركّبة بلا حلٍّ معتمد', q.insNoSol, 'bad', 'qa', 'رُكّبت والحلُّ لم يُعتمَد — لا يُقفَل إقفالٌ ولا يُحسَب استلامٌ'),
          rowOf('تركيبات مُسندة لنقاطٍ لم تُمسح', q.schedNoSv, 'bad', 'req', 'إسنادُ تركيبٍ قبل المسح — الفنيُّ سيصل بلا حلّ'),
          rowOf('أصناف برصيد سالب', q.negStock, 'bad', 'inv', 'صرفٌ أكثرُ من التوريد — سجلٌّ ناقص'),
          rowOf('مشتريات بلا مورّد', q.buyNoSup, 'wrn', 'inv'),
          rowOf('مهام مُسندة لاسمٍ لا حسابَ له', q.taskGhost, 'bad', 'req', 'كُتب الاسمُ ولم يُطابق حسابًا — لا يصله شيء'),
          rowOf('حسابات مكرَّرة', q.dupUsers, 'bad', 'users'),
          rowOf('وثائق معزولة عن الرفع على هذا الجهاز', q.poison, 'bad', 'sync')
        ]))
      + cardFlush('جودة البيانات', table(['الفحص','النتيجة',''], [
          rowOf('مواقع بلا إحداثيات', q.noCoord, 'wrn', 'sites', 'لا تظهر على الخريطة ولا تُسنَد'),
          rowOf('أسماء شركات مركَّبة (تحمل أكثر من شركة)', q.compound, 'wrn', 'co', 'لا تُحسَب نقاطُها لشركةٍ — توحَّد من شاشة الشركات'),
          rowOf('زيارات تمّت بلا صورة', q.svNoPhoto, 'wrn', 'survey', 'المعتمِدُ لا يرى ما رآه المشرف'),
          rowOf('مردودة لزيارةٍ أخرى منذ أكثر من ٣ أيام', q.oldRevisit, 'wrn', 'svappr', 'رُدّت ولم تُزَر ثانيةً')
        ]));
  })();
    if (cur === 'sync') return head + (function(){
    /* كانت أربعةَ أصفارٍ مكتوبةً بيدٍ — والحارسُ لم يمسكها لأن جسمَ الصفحة
       التي بعدها كان يمدّها بمصدرٍ حيٍّ صدفةً. كُشفت حين حُذفت تلك الصفحة. */
    var Q = STATE.queue || [], PZ = STATE.poison || [];
    /* ═══ ما يكلّف يُرى قبل الفاتورة (V17.8) ═══
       القراءةُ من القاعدة تُحسَب على المشروع مالًا ووقتًا، ولا تظهر إلا في
       فاتورةٍ آخرَ الشهر. فيُعرَض هنا: كم قرأ هذا الجهازُ منذ فتحِ التطبيق،
       وتقديرُ ما يعنيه لو صار كلَّ يوم — ليُعرَف التسرّبُ يومَه لا بعد شهر. */
    var rdN = (typeof FB === 'object' && FB.readCount) || 0;
    var upMin = Math.max(1, Math.round((Date.now() - (BOOT_AT || Date.now())) / 60000));
    var perDay = Math.round(rdN / upMin * 60 * 8);      /* ثماني ساعاتِ عمل */
    var FREE = 50000;
    /* «Missing or insufficient permissions» بلا هويةٍ لا يُشخَّص: من يكتب؟
       وبأيِّ دورٍ في وثيقته؟ وهل هو فعّال؟ وهل وثيقتُه باسم uid أصلًا؟ */
    var me = STATE.meta || {}, uid0 = myUid();
    var myDoc = (STATE.users || {})[uid0] || null;
    if (uid0 && MYDOC.has === null) myDocFetch(false);
    var rdCard = card(t('قراءاتُ هذه الجلسة'),
      stats([['قُرئت الآن', N(rdN), rdN > 5000 ? 'wrn' : 'ok'],
             ['منذ الفتح', esc(nm(upMin) + ' ' + t('دقيقة'))],
             ['تقديرٌ ليومِ عملٍ كامل', N(perDay), perDay > FREE / 3 ? 'wrn' : 'ok'],
             ['الحصةُ المجانية', esc(nm(FREE) + ' / ' + t('يوم'))]])
      + '<p class="hint" style="margin:6px 0 0">'
      + esc(t('التقديرُ لهذا الجهاز وحدَه في ثماني ساعات. اضربه في عدد الأجهزة لتقدّر يومَ المشروع — والحصةُ المجانية خمسون ألفًا لكلِّ المشروع في اليوم.')) + '</p>');
    var idRows = [
      ['uid', uid0 ? '<span class="num" dir="ltr">' + esc(uid0) + '</span>' : pill('غير مسجَّل الدخول','off')],
      ['الاسم', esc(me.name || '—')],
      ['الدورُ في التطبيق', esc(t((ROLES[ROLE] || {}).n || ROLE))],
      ['وثيقةُ الحساب users/{uid}',
        myDoc ? pill('موجودة','ok')
              : (MYDOC.has === false ? pill('غيرُ موجودة — هذا سببُ الرفض','off')
                 : (MYDOC.err === 'offline' ? pill('بلا شبكة — تُقرأ عند الاتصال','warn')
                                            : pill('تُقرأ…','warn')))],
      ['دورُها', myDoc ? esc(t((ROLES[myDoc.role] || {}).n || myDoc.role || '—')) : '—'],
      ['active', myDoc ? (myDoc.active === false ? pill('false — معطَّل','off') : pill(myDoc.active === true ? 'true' : 'غير مكتوب (يُعدُّ فعّالًا)', myDoc.active === true ? 'ok' : 'warn')) : '—']
    ];
    var errs = SOFT_ERRS.filter(function(e){ return /رفع|sync|push/i.test(e.where || '') || /رفع/.test(e.msg || ''); });
    var day = dayKey();
    var today = SOFT_ERRS.filter(function(e){ return dayKey(e.at) === day; }).length;
    return rdCard + card('\u{1FAAA} ' + t('بأيِّ هويةٍ يكتب هذا الجهاز'),
        table(['','' ], idRows.map(function(r){ return [esc(t(r[0])), r[1]]; }))
        + '<p class="hint" style="margin:8px 0 0">' + esc(t('«Missing or insufficient permissions» معناه أن القاعدةَ لا تعرف هذا الحساب: وثيقتُه ليست باسم uid، أو دورُها ليس من الأدوار، أو active مكتوبةٌ false.')) + '</p>'
        + (uid0 && MYDOC.has === false
          ? alertBox('error', 'لا وثيقةَ لحسابك باسم معرِّفه — فكلُّ ما تكتبه يُرفَض. أنشئها الآن (فنيًّا) ليُرفَع عملُك، ثم اطلب من المكتب ترقيةَ دورك.')
            + '<div class="actions">' + btn('\u{1F527} ' + t('أنشئ وثيقة حسابي'),'btn-primary btn-sm',' data-mydocfix="1"') + '</div>'
          : '<div class="actions" style="margin-top:8px">'
            + btn('\u21BB ' + t('أعد قراءة وثيقتي'),'btn-quiet btn-sm',' data-mydocfix="1"') + '</div>'))
      + softErrCard()
      + (PZ.length
        ? cardFlush('\u26A0 ' + t('وثائقُ عُزلت عن الرفع') + ' — ' + nm(PZ.length),
            /* «حذفٌ» أم «كتابة»؟ كان الجدولُ لا يقول — فحذفٌ ردّته القاعدةُ يُقرأ
               رفضًا للحساب ويُبحَث في الوثيقة عن عيبٍ ليس فيها */
            table(['الأمر','النوع','المعرّف','السبب',''],
              PZ.map(function(x, i){
                return [x.v === null ? pill('حذف','off') : pill('كتابة','acc'),
                        esc(x.kind), '<span class="num">' + esc(String(x.id)) + '</span>',
                        '<span class="hint" style="margin:0">' + esc(x.err) + '</span>',
                        '<div class="actions" style="margin:0">'
                        + btn('\u21BB','btn-quiet btn-sm',' data-pzretry="' + i + '" aria-label="' + esc(t('أعد الرفع')) + '"')
                        + btn('\u{1F5D1}','btn-danger btn-sm',' data-pzdrop="' + i + '" aria-label="' + esc(t('أسقط')) + '"')
                        + '</div>'];
              }))
            + (PZ.length > 1
              ? '<div class="actions" style="margin:8px 0 0">'
                + btn('\u21BB ' + t('أعد رفع الكل'),'btn-secondary btn-sm',' data-pzall="retry"')
                + btn('\u{1F5D1} ' + t('أسقط الكل'),'btn-danger btn-sm',' data-pzall="drop"')
                + '</div>'
              : '')
            + '<p class="hint" style="margin:8px 0 0">' + esc(t('رُفضت ثلاثَ مرات فعُزلت كي لا تعيق ما بعدها — السببُ مكتوب: قيمةٌ غيرُ مقبولة أو قاعدةٌ تمنع. أعد رفعَها بعد الإصلاح، أو أسقطها إن كانت خطأً.')) + '</p>'
            + (PZ.some(function(x){ return x.v === null && /permission|insufficient/i.test(String(x.err || '')); })
              ? '<p class="hint" style="margin:6px 0 0">' + esc(t('أمرُ حذفٍ ردّته القاعدة ليس رفضًا للحساب: الحذفُ في تلك المجموعة للإدارة وحدَها — وسجلُّ الأحداث لا يُحذَف أبدًا.')) + '</p>'
              : ''))
        : '')
      /* الدورةُ تدفع كلَّ دقيقة — ومن رأى «بانتظار الرفع ١» ينتظر ولا يدري
         متى. زرٌّ يدفع الآن ويقول كم ذهب وكم بقي. */
      + (Q.length
        ? card('', '<div class="actions" style="margin:0">'
            + btn('\u2191 ' + t('ادفع الطابور الآن'),'btn-primary btn-sm',' data-pushnow="1"')
            + '<span class="hint" style="margin:0 10px">'
            + esc(t('الدورةُ تدفع تلقائيًّا كلَّ دقيقة — وهذا يدفع فورًا.')) + '</span></div>')
        : '')
      + stats([['بانتظار الرفع', N(Q.length), Q.length ? 'wrn' : 'ok'],
               ['أخطاءُ رفع', N(errs.length), errs.length ? 'bad' : 'ok'],
               ['أخطاءُ اليوم', N(today), today ? 'wrn' : 'ok'],
               ['الشبكة', pill(STATE.meta.online ? 'متصلة' : 'مقطوعة', STATE.meta.online ? 'ok' : 'off')]])
      + (Q.length
        ? cardFlush('الطابور — ' + nm(Q.length),
            table(['النوع','السجل','سُجّل'],
              Q.slice(0, 50).map(function(x){
                return [pill(t(Q_LBL[x.kind] || x.kind), 'acc'), '<strong>' + esc(String(x.id || '—')) + '</strong>',
                        '<span class="num">' + esc(fmtDT(x.at || 0)) + '</span>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا شيءَ بانتظار الرفع — كلُّ ما سُجّل وصل.')) + '</p>'));
  })();
    if (cur === 'dq') return head + (function(){
    var dup = dqDupPos(), noco = dqNoCo(), comp = dqCompound(), nosign = dqNoSign(), far = dqFar();
    var compN = Object.keys(comp).length, compPts = Object.keys(comp).reduce(function(a, k){ return a + comp[k].length; }, 0);
    var may2 = maySiteEdit();
    var row = function(x){ return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(x.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px">'
      + '<span>' + esc(x.id) + '</span><span class="hint" style="margin:0">' + esc((x.name || '').slice(0, 30)) + '</span></button>'; };
    return '<p class="lede" style="margin:0 0 12px">' + esc(t('عيوبٌ في البيانات لا في الشيفرة — كلُّ عيبٍ بعدده، وما يُصلَح دفعةً يُسجَّل باسمك ويُزامَن كأيِّ تعديل.')) + '</p>'
      + stats([['على إحداثيةٍ واحدة', N(dup.length), dup.length ? 'wrn' : 'ok'],
               ['مخيمٌ بلا شركة', N(noco.length), noco.length ? 'wrn' : 'ok'],
               ['اسمٌ مركَّب', N(compN), compN ? 'wrn' : 'ok'],
               ['بلا مربعٍ أو شاخص', N(nosign.length), nosign.length ? 'wrn' : 'ok'],
               ['بعيدةٌ عن مشعرها', N(far.length), far.length ? 'wrn' : 'ok']])
      + (far.length
          ? card('\u{1F9ED} ' + t('نقاطٌ بعيدةٌ عن مشعرها') + ' \u2014 ' + nm(far.length),
              '<p class="hint" style="margin:0 0 8px">' + esc(t('إحداثياتُها على بُعد كيلومتراتٍ من جسم المشعر — غالبًا نقطةٌ أُضيفت من الميدان والجهازُ في مكانٍ آخر. افتح النقطةَ وصحّح موضعَها من نافذتها (أو اعتمد إحداثيات الزيارة)، أو أخفِها إن كانت خطأً.')) + '</p>'
              + far.slice(0, 30).map(function(x){ return '<button type="button" class="btn btn-quiet btn-sm" data-site="' + esc(x.id) + '" style="width:100%;justify-content:space-between;margin-bottom:4px"><span>' + bdi(x.id) + ' <span class="hint" style="margin:0">' + esc(t(x.zone)) + '</span></span><span class="hint num" style="margin:0">' + esc((+x.lat).toFixed(5) + ', ' + (+x.lng).toFixed(5)) + '</span></button>'; }).join(''))
          : '')

      + card('\u{1F4CD} ' + t('نقطتان على إحداثيةٍ واحدة') + ' — ' + nm(dup.length),
          dup.length
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('أكثرُها المخيمُ الواحدُ مسجَّلًا مرتين بشاخصٍ مكتوبٍ بصفتين — فيُزار أحدُهما ويبقى توأمُه «لم يُزر» ويُعَدُّ في الإجمالي. اختر الأصلَ (ما مُسح إن مُسح أحدُهما) فيُدمَج التوأمُ فيه ويخرج من العدّ — ويُفَكُّ الدمجُ متى شئت. وإن كانا مخيمين حقًّا فافصل إحداثياتِهما من «تحريك».')) + '</p>'
              + dup.slice(0, 40).map(function(p){
                  var st = function(x){ var r = STATE.recs[x.id]; return svDone(r) ? '<span class="pill ok">' + esc(t('مُسح')) + '</span>' : '<span class="pill">' + esc(t('لم يُزر')) + '</span>'; };
                  var lab = function(x){ return '<b>' + esc(x.id) + '</b> <span class="hint" style="margin:0">' + esc((x.sq || '') + ' / ' + (x.sign || '')) + '</span> ' + st(x); };
                  var a = p[0], b = p[1], aS = svDone(STATE.recs[a.id]), bS = svDone(STATE.recs[b.id]);
                  var btnA = may2 && !(bS && !aS) ? btn(t('الأصلُ الأولى — ادمج الثانية'),'btn-quiet btn-sm',' data-dupkeep="' + esc(a.id) + '|' + esc(b.id) + '"') : '';
                  var btnB = may2 && !(aS && !bS) ? btn(t('الأصلُ الثانية — ادمج الأولى'),'btn-quiet btn-sm',' data-dupkeep="' + esc(b.id) + '|' + esc(a.id) + '"') : '';
                  return '<div class="card" style="margin:0 0 8px;padding:8px 10px"><div class="wt-row" style="justify-content:space-between;flex-wrap:wrap;gap:6px">'
                    + '<span>' + lab(a) + '</span><span>\u2194</span><span>' + lab(b) + '</span>'
                    + '<span class="hint num" style="margin:0">' + esc((+a.lat).toFixed(5)) + ', ' + esc((+a.lng).toFixed(5)) + '</span></div>'
                    + (btnA || btnB ? '<div class="actions" style="margin:6px 0 0">' + btnA + btnB + '</div>' : '') + '</div>';
                }).join('')
              + (dupMerged().length
                  ? '<p class="hint" style="margin:10px 0 4px">' + esc(t('مدمَجةٌ من قبل')) + ' <b class="num">' + nm(dupMerged().length) + '</b></p>'
                    + dupMerged().slice(0, 40).map(function(x){
                        return '<div class="wt-row" style="justify-content:space-between;margin:0 0 4px"><span>' + esc(x.id) + ' \u2192 ' + esc(x.dupOf) + '</span>'
                          + (may2 ? btn(t('فكّ الدمج'),'btn-quiet btn-sm',' data-dupundo="' + esc(x.id) + '"') : '') + '</div>'; }).join('')
                  : '')
            : '<p class="hint" style="margin:0">' + esc(t('لا تكرارَ في الإحداثيات.')) + '</p>')

      + card('\u{1F3E2} ' + t('مخيماتٌ بلا شركة') + ' — ' + nm(noco.length),
          (noco.length
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('تسقط من تقارير الشركات ولا يصلها إشعارُ مواعيد التركيب. إمّا تُعبَّأ من كشف التخصيص، أو تُوسَم «بلا تخصيص» فتُستثنى صراحةً بدل أن تُحسَب صفرًا صامتًا.')) + '</p>'
              + noco.slice(0, 30).map(row).join('')
              + (noco.length > 30 ? '<p class="hint" style="margin:6px 0 0">' + esc(t('يُعرَض ثلاثون — والباقي في شاشة المواقع بترشيح الشركة.')) + '</p>' : '')
            : '<p class="hint" style="margin:0">' + esc(t('كلُّ مخيمٍ له شركة.')) + '</p>'),
          (noco.length && may2) ? btn('\u{1F3F7} ' + t('صنّف الكلَّ «بلا تخصيص»'),'btn-secondary btn-sm',' data-dqnoco="1"') : '')

      + card('\u{1F517} ' + t('أسماءٌ مركَّبة') + ' — ' + nm(compN) + ' ' + t('اسمًا على') + ' ' + nm(compPts) + ' ' + t('نقطة'),
          (compN
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('خانةٌ واحدةٌ تحمل شركتين أو أكثر، فلا تُنسَب نقاطُها لأيٍّ منها في العدّ. الشطرُ يُبقي الأولى في «الشركة» ويضع الباقيَ في «شركات مشاركة» — فتُعَدُّ للأولى ويبقى الباقي مقروءًا.')) + '</p>'
              + Object.keys(comp).slice(0, 12).map(function(c){
                  return '<div class="wt-le"><b class="num">' + nm(comp[c].length) + '</b> \u00b7 <span dir="auto">' + esc(c.slice(0, 90)) + '</span></div>';
                }).join('')
            : '<p class="hint" style="margin:0">' + esc(t('لا أسماءَ مركَّبة.')) + '</p>'),
          (compN && may2) ? btn('\u2702 ' + t('اشطر الكلَّ إلى «شركة» و«شركات مشاركة»'),'btn-secondary btn-sm',' data-dqsplit="1"') : '')

      + card('\u{1F3AF} ' + t('مخيماتٌ بلا مربعٍ أو شاخص') + ' — ' + nm(nosign.length),
          nosign.length
            ? '<p class="hint" style="margin:0 0 8px">' + esc(t('الشاخصُ ما يقرؤه الفنيُّ على الأرض؛ بدونه يبحث بالإحداثية وحدها. تُستكمَل من «تعديل البيانات» في نافذة النقطة قبل إسنادها.')) + '</p>'
              + nosign.slice(0, 30).map(row).join('')
            : '<p class="hint" style="margin:0">' + esc(t('كلُّ مخيمٍ له مربعٌ وشاخص.')) + '</p>');
  })();
if (cur === 'usage') return head + usageCard() + perfCard() + (function(){
    if (may('users') || may('exportAll')) presenceFetch(false);
    var rows = presenceRows(), now = Date.now(), cur9 = appVer();
    var H = 3600000, work = (function(){ var h = new Date().getHours(); return h >= 7 && h <= 23; })();
    var totReads = 0, online = 0, stale = 0, old = 0, back = 0, errs = 0;
    /* الجسرُ: آخرُ تشغيلٍ له — إن تجاوز ٤٥ دقيقةً فالبلاغاتُ والصورُ الجديدةُ معلّقة (V17.39) */
    var br = (STATE.bridge || {}), brAge = br.at ? now - (+br.at || 0) : -1;
    var brStale = brAge < 0 || brAge > 45 * 60000;
    var T = rows.map(function(p){
      var age = now - (+p.at || 0), isOn = age < 15 * 60000, isStale = age > 2 * H && work;
      var oldV = p.ver && p.ver !== cur9, hasBack = (+p.q || 0) + (+p.pz || 0) + (+p.pf || 0) > 0;
      var reads = (p.rd != null) ? +p.rd : (+p.reads || 0);      /* اليومُ إن رُفع، وإلا الجلسة */
      totReads += reads; if (isOn) online++; if (isStale) stale++; if (oldV) old++; if (hasBack) back++; errs += (+p.err || 0);
      var flags = [];
      var tip = function(txt, cls, why){ return '<span class="pill ' + cls + '" title="' + esc(t(why)) + '">' + esc(t(txt)) + '</span>'; };
      if (isStale) flags.push(tip('منقطع', 'bad', 'لم يرسل الجهازُ إشارةً منذ أكثر من ساعتين في وقت العمل — مغلقٌ أو بلا شبكة'));
      if (oldV) flags.push(tip('نسخة قديمة', 'warn', 'على نسخةٍ أقدمَ من الحالية — يُحدَّث بإعادة فتح التطبيق على شبكة'));
      if (+p.pz || 0) flags.push(tip('طابورٌ مسموم', 'bad', 'وثيقةٌ رُفض رفعُها مرارًا فعُزلت كي لا توقف الطابور — تُراجَع في شاشة المزامنة: تُعاد أو تُهمَل'));
      if (+p.pf || 0) flags.push(tip(nm(p.pf) + ' ' + t('صور فشلت'), 'warn', 'صورٌ تعذّر رفعُها بعد خمس محاولات — تبقى على الجهاز حتى تُعاد'));
      if (reads > 3000) flags.push(tip('قراءاتٌ عالية', 'warn', 'قرأ اليومَ أكثرَ من ثلاثة آلاف وثيقة — طبيعيٌّ بعد سحبةٍ باردة، ويُراقَب إن تكرّر'));
      if ((+p.cp || 0) > 1) flags.push(tip(nm(p.cp) + ' ' + t('سحبات باردة'), 'warn', 'أعاد تحميلَ نطاقه كلِّه أكثرَ من مرة — كلُّ مرةٍ آلافُ القراءات'));
      if ((+p.rms || 0) > 400) flags.push(tip('رسمٌ بطيء', 'warn', 'متوسّطُ رسم الشاشة فوق ٤٠٠ م.ث — جهازٌ ضعيفٌ أو بياناتٌ ثقيلة'));
      if (p.pulse === false) flags.push(tip('بلا إشارة', 'warn', 'لم يتصل بإشعار التغيير — يعتمد على السحب الدوريِّ وحدَه'));
      return [
        '<b>' + esc(dispName(p.name || '')) + '</b><br><span class="hint" style="margin:0">' + esc(t(roleName(p.role) || p.role || '')) + ' \u00b7 ' + esc(p.ver || '—') + '</span>',
        '<span class="num">' + esc(p.at ? stepAgo(p.at) : '—') + '</span>' + (isOn ? ' ' + pill('متصل', 'ok') : ''),
        N(reads) + (p.rd == null ? ' <span class="hint" style="margin:0">' + esc(t('جلسة')) + '</span>' : ''),
        N(+p.q || 0) + (+p.pq ? ' + ' + nm(p.pq) + '\u{1F4F7}' : ''),
        N(+p.err || 0),
        '<span class="num">' + (p.rms != null ? nm(p.rms) + ' ' + t('م.ث') : '—') + '</span>',
        '<span class="num">' + (p.pms ? nm(p.pms) + ' ' + t('م.ث') : '—') + '</span>',
        flags.join(' ') || '<span class="pill ok" title="' + esc(t('لا شيءَ يستدعي النظر: متصلٌ وعلى النسخة الحالية وبلا طوابيرَ عالقةٍ ولا أخطاء')) + '">' + esc(t('سليم')) + '</span>'
      ];
    });
    /* ═══ خلاصةٌ بلا مصطلحات قبل الجدول التقنيّ (V17.35) ═══
       المهندسُ يريد جملةً: النظامُ بخير أم لا، ومن غاب، وماذا يلزم — والتفاصيلُ
       التقنيةُ لمن يريدها تحت «التفاصيل التقنية». */
    var okAll = !stale && !back && !old && totReads <= 40000;
    var plain = [];
    plain.push(okAll ? t('النظامُ يعمل بشكلٍ طبيعيّ: كلُّ الأجهزة تتزامن ولا شيءَ عالق.') : t('يوجد ما يستحقُّ نظرة:'));
    if (stale) plain.push(nm(stale) + ' ' + t('جهازًا لم يتزامن منذ أكثر من ساعتين في وقت العمل — قد يكون مغلقًا أو بلا شبكة.'));
    if (back)  plain.push(nm(back) + ' ' + t('جهازًا عنده عملٌ لم يُرفَع بعد (صورٌ أو زيارات) — يُفتَح على شبكةٍ فيُرفَع وحدَه.'));
    if (old)   plain.push(nm(old) + ' ' + t('جهازًا على نسخةٍ قديمة — يُعاد فتحُ التطبيق فيحدّث نفسَه.'));
    if (totReads > 40000) plain.push(t('استهلاكُ القاعدة اليوم قريبٌ من الحدِّ المجانيّ.'));
    if (errs) plain.push(nm(errs) + ' ' + t('خطأً برمجيًّا مسجَّلًا على الأجهزة — يراه المطوّرُ في السجل.'));
    return card((okAll ? '\u2705 ' : '\u26A0\uFE0F ') + t('الخلاصة'),
        '<p style="margin:0;font-size:15px;line-height:1.8">' + plain.map(esc).join('<br>') + '</p>'
        + '<p class="hint" style="margin:8px 0 0">' + esc(t('متصلٌ الآن')) + ' <b class="num">' + nm(online) + '</b> ' + t('من') + ' <b class="num">' + nm(rows.length) + '</b> \u00b7 '
        + esc(t('قراءاتُ اليوم')) + ' <b class="num">' + nm(totReads) + '</b> / ' + nm(50000) + '</p>')
      + '<details' + (okAll ? '' : ' open') + '><summary class="hint" style="cursor:pointer;margin:0 0 10px">\u{1F527} ' + esc(t('التفاصيل التقنية')) + '</summary>'
      + '<p class="lede" style="margin:0 0 12px">' + esc(t('كلُّ جهازٍ يقيس نفسَه ويرفع قياسَه مع إشارة حضوره: ما قرأ، وما ينتظر في طوابيره، وما وقع فيه من أخطاء، وكم يستغرق رسمُه وسحبُه.')) + '</p>'
      + stats([['أجهزة', N(rows.length)], ['متصلةٌ الآن', N(online), online ? 'ok' : ''],
               ['منقطعةٌ في وقت العمل', N(stale), stale ? 'wrn' : 'ok'],
               ['على نسخةٍ قديمة', N(old), old ? 'wrn' : 'ok'],
               ['بطوابيرَ عالقة', N(back), back ? 'wrn' : 'ok'],
               ['قراءاتُ اليوم كلِّها', N(totReads), totReads > 40000 ? 'wrn' : 'ok'],
               ['أخطاءٌ مسجَّلة', N(errs), errs ? 'wrn' : 'ok'],
               ['آخر تشغيلٍ للجسر', br.at ? esc(stepAgo(br.at)) : esc(t('لم يُسجَّل بعد')), brStale ? 'wrn' : 'ok']])
      + (brStale ? '<p class="hint" style="margin:0 0 8px;color:var(--warn)">' + esc(t('الجسرُ (الحساباتُ والصورُ والبلاغات) لم يعمل منذ أكثر من ٤٥ دقيقة — الجدولةُ تتأخّر أحيانًا. يُشغَّل يدويًّا من المستودع: Actions ← Provision ← Run workflow، ويعمل تلقائيًّا مع كلِّ دفعةِ نسخة.')) + '</p>' : '')
      + '<p class="hint" style="margin:0 0 8px">' + esc(t('الحصةُ المجانيةُ خمسون ألفَ قراءةٍ في اليوم للمشروع كلِّه — والأرقامُ هنا من آخر إشارةٍ لكلِّ جهاز (كلَّ نصف ساعة أو عند التغيّر).'))
      +   ' ' + esc(t('«قراءات» هي قراءاتُ اليوم؛ وما وُسم «جلسة» فمن نسخةٍ أقدمَ يعدُّ منذ الفتح. و«سحبة باردة» تعني أن الجهازَ أعاد تحميلَ نطاقه كلِّه — وهي ما يرفع القراءاتِ بالآلاف.')) + '</p>'
      + '<p class="hint" style="margin:0 0 8px">' + esc(t('مفتاحُ الحالات — اضغط أيَّ حالةٍ لترى معناها:')) + ' '
      +   esc(t('منقطع')) + ' = ' + esc(t('بلا إشارةٍ لساعتين في وقت العمل')) + ' \u00b7 '
      +   esc(t('طابورٌ مسموم')) + ' = ' + esc(t('وثيقةٌ رُفض رفعُها فعُزلت — تُراجَع في المزامنة')) + ' \u00b7 '
      +   esc(t('نسخة قديمة')) + ' = ' + esc(t('يُحدَّث بإعادة الفتح على شبكة')) + ' \u00b7 '
      +   esc(t('سليم')) + ' = ' + esc(t('لا شيءَ يستدعي النظر')) + '</p>'
      + card(t('الأجهزة'), rows.length
          ? table(['الجهاز','آخر ظهور','قراءات','طوابير','أخطاء','زمن الرسم','زمن السحب','الحالة'], T, null, { sticky:true })
          : '<p class="hint" style="margin:0">' + esc(t('لا إشاراتٍ بعد.')) + '</p>')
      + '</details>';
  })();
if (cur === 'vers') return head + (function(){
    /* كان جدولًا مكتوبًا بيدٍ من عهد V14 — اسمان ونسختان وإنذارٌ ثابت */
    if (may('users') || may('exportAll')) presenceFetch(false);
    var cur9 = appVer(), rows = presenceRows(), week = Date.now() - 7 * 86400000;
    var onCur = rows.filter(function(r){ return r.ver === cur9; }).length;
    var stale = rows.filter(function(r){ return r.ver && r.ver !== cur9 && (r.at || 0) > week; });
    /* حصةُ القاعدة تُرى من هنا: كلُّ جهازٍ يرسل عدَّ قراءاته في نبضة حضوره،
       ومجموعُ أجهزة اليوم تقديرٌ لما استُهلك — والرقمُ الحاسمُ في لوحة Firebase */
    var today = dayKey();
    var readsToday = rows.reduce(function(a, r){ return a + ((r.day === today && r.reads) || 0); }, 0);
    return stats([['أجهزة ظهرت', N(rows.length)],
                  ['على النسخة الحالية', N(onCur), 'ok'],
                  ['على إصدار أقدم', N(stale.length), stale.length ? 'bad' : 'ok'],
                  ['قراءات القاعدة اليوم — تقديرًا من الأجهزة', N(readsToday), readsToday > 40000 ? 'bad' : (readsToday > 25000 ? 'wrn' : 'ok')]])
      + '<p class="hint">' + esc(t('الرقمُ الفعليُّ في لوحة Firebase: Firestore ← Usage. والخطةُ Blaze لا توقف الخدمةَ عند الحصة (٥٠ ألف قراءة/يوم) بل تحاسب ما فوقها.')) + '</p>'
      + card('الأجهزة الظاهرة',
          (rows.length
            ? table(['المستخدم','النسخة','الدور','آخر ظهور'], rows.map(function(r){
                return [esc(dispName(r.name || r.uid)), pill(r.ver || '—', r.ver === cur9 ? 'ok' : 'off'),
                        esc(t((ROLES[r.role] || {}).n || r.role || '—')),
                        '<span class="num">' + esc(agoTxt(r.at)) + '</span>'];
              }))
            : '<p class="hint" style="margin:0">' + esc(t('لم يصل من أيِّ جهازٍ بعد — تُكتَب نسخةُ كلِّ جهازٍ حين يدخل.')) + '</p>')
          + '<div class="actions" style="margin-top:8px">'
          + btn('\u21BB ' + t('حدّث القائمة'),'btn-quiet btn-sm',' data-presfetch="1"') + '</div>')
      + (stale.length
        ? '<div class="alert error"><span>' + esc(t('أجهزةٌ على إصدارٍ قديم')) + ' — ' + nm(stale.length) + ': '
          + esc(stale.map(function(r){ return dispName(r.name || r.uid) + ' (' + (r.ver || '—') + ')'; }).join('، '))
          + ' — ' + esc(t('المفتوحُ منها يتحدّث تلقائيًّا خلال دقيقة — والمغلقُ حين يُفتَح.')) + '</span></div>'
        : (rows.length ? alertBox('ok','كلُّ الأجهزة الظاهرة على النسخة الحالية.') : ''));
  })();
    if (cur === 'retain') return head + (function(){
    /* أعدادُ السجلات تُعَدُّ من الحالة لا تُكتَب: كانت محفورةً «سجل الأحداث
       ٤٬٨٢٠» و«الصور ١٢» — أرقامَ يومٍ مضى تُقرأ اليومَ حجمًا حقيقيًّا،
       ويُبنى عليها قرارُ أرشفة. والحجمُ بالميغا يُقدَّر من العدد بمتوسّطٍ
       معلومٍ لكلِّ نوعٍ فيبقى تقديرًا معلنًا لا رقمًا مخترعًا. */
    var cnt = function(k){
      var v = STATE[k];
      return Array.isArray(v) ? v.length : Object.keys(v || {}).length;
    };
    var mb = function(n, kb){ return (n * kb / 1024).toFixed(1); };
    var SETS = [
      ['المواقع',       (STATE.sites || []).length, mb((STATE.sites || []).length, 1.4),
                        'دائم',      'أصل المشروع لا يُؤرشَف'],
      ['سجل الأحداث',   cnt('events'),  mb(cnt('events'), 0.4),
                        '٩٠ يومًا',  'يُؤرشَف شهريًّا في ملف مضغوط'],
      ['إشارات الأجهزة', cnt('hb'),   mb(cnt('hb'), 0.2),
                        '٣٠ يومًا',  'الأكثر نموًّا — إشارةٌ كل خمس دقائق'],
      ['الصور',         cnt('photos'),  mb(cnt('photos'), 1600),
                        'دائم',      'مضغوطة على الجهاز قبل الرفع'],
      ['دفتر المخزون',  cnt('moves'),   mb(cnt('moves'), 0.3),
                        'دائم',      'الأرصدة مشتقّة منه فلا يُمسّ'],
      ['المشتريات',     cnt('buys'),    mb(cnt('buys'), 0.3),
                        'دائم',      'مستند مالي'],
      ['سجل التدقيق',   cnt('events'),  mb(cnt('events'), 0.4),
                        '٣ سنوات',  'مدة المساءلة'],
      ['مسودّات محلية', (STATE.queue || []).length, mb((STATE.queue || []).length, 0.5),
                        '٧ أيام',    'تُمسح بعد المزامنة الناجحة']
    ];
    var tot = SETS.reduce(function(a,s){ return a + parseFloat(s[2]); }, 0);
    return stats([['الحجم الكلي', '<span class="num">'+tot.toFixed(1)+'</span> م.ب'],
                  ['سجلات', '<span class="num">'+nm(SETS.reduce(function(a,s){return a+s[1];},0))+'</span>'],
                  ['الأسرع نموًّا','إشارات','wrn'],
                  ['حدّ الخطة المجانية','١ ج.ب','acc']])
      + card('مجموعات البيانات',
          table(['المجموعة','سجلات','م.ب','مدة الاحتفاظ','السياسة'],
            SETS.map(function(s){
              return [esc(t(s[0])), '<span class="num">'+nm(s[1])+'</span>',
                      '<span class="num">'+s[2]+'</span>',
                      s[3]==='دائم' ? pill('دائم','acc') : pill(s[3],'warn'),
                      '<span class="hint" style="margin:0">'+esc(t(s[4]))+'</span>'];
            })),
          btn('تشغيل الأرشفة الآن','btn-quiet btn-sm disabled', ' disabled title="'
      + esc(t('الأرشفةُ التلقائيةُ تحتاج دالةً على الخادم — لم تُبنَ بعد. الحذفُ اليدويُّ من Firestore متاحٌ لمن يملك القاعدة.')) + '"'))
      /* كانت بطاقةً محفورةً تقول «لا نسخة فعلية — مطلوب مفتاح» بعد أن صار
         النسخُ يوميًّا إلى درايف — البطاقةُ الحيّةُ نفسُها التي في صحة الأجهزة */
      + bkCard()
      + card('دورة المزامنة', flow(['يُكتب محليًّا','في الطابور','رُفع','أُكِّد'],0)
        + '<p class="hint">' + esc(t('الكتابة تنجح دائمًا على الجهاز — والشبكة تفصيلٌ لاحق لا شرطٌ مسبق.')) + '</p>')
      + card('سياسة التعارض',
          table(['الحقل','السياسة','لماذا'], [
            ['حالة المسح','<span class="pill acc">' + esc(t('الأحدث يفوز')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('تقدُّمٌ لا يرجع')) + '</span>'],
            ['حالة التركيب','<span class="pill warn">' + esc(t('يُعرَض للمهندس')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('«مُركّب» و«متعذّر» لا يجتمعان')) + '</span>'],
            ['الإحداثيات','<span class="pill warn">' + esc(t('يُعرَض للمهندس')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('تحريكان مختلفان يعنيان خلافًا على الموقع')) + '</span>'],
            ['الصور','<span class="pill ok">' + esc(t('تُضاف كلها')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('لا صورة تُلغي أخرى')) + '</span>'],
            ['القطع المستهلكة','<span class="pill off">' + esc(t('يُرفض الثاني')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('وإلا استُهلك المخزون مرتين')) + '</span>'],
            ['الملاحظات','<span class="pill ok">' + esc(t('تُدمَج بسطر فاصل')) + '</span>',
             '<span class="hint" style="margin:0">' + esc(t('كلاهما شهادة')) + '</span>']
          ]),
          btn('حفظ السياسة','btn-quiet btn-sm disabled', ' disabled title="'
      + esc(t('مددُ الاحتفاظ أعلاه معلَنةٌ لا مضبوطة — تعديلُها يحتاج تطبيقَ الأرشفةِ أولًا.')) + '"'))
      + card('تعارضات بانتظار القرار',
          '<p class="hint">' + esc(t('لا تعارضات — تظهر هنا بالنسختين جنبًا إلى جنب ليختار المهندس.')) + '</p>')
      + card('طابور الرفع',
          '<div class="actions">'
          + btn('رفع الآن','btn-primary btn-sm',' data-pull="1"')
          + btn('عرض الطابور','btn-secondary btn-sm',' data-pq="1"')
          + '<span class="hint" style="margin:0">' + esc(t('آخر مزامنة')) + ' <span class="num">'
          + esc(STATE.meta.lastSync ? fmtTime(STATE.meta.lastSync, { hour:'2-digit', minute:'2-digit' }) : '—')
          + '</span></span></div>')
      + '<p class="hint">' + esc(t('«آخر كتابة تفوز» صامتةً هي أخطر سياسة: تمحو عمل زميلٍ بلا أن يعلم أحد. ما لا يُحسم آليًّا يُعرَض.')) + '</p>';
  })();
    return head + (function(){
    var C = wipeCounts(), tot = C.reduce(function(a, r){ return a + r[1]; }, 0);
    return alertBox('warn','يمسحُ ما سُجِّل من الجهاز ومن القاعدة: المسحُ والتركيبُ والفكُّ والمهامُّ والصورُ وحركاتُ المخزون والمشترياتُ والمقترحاتُ واللقطاتُ اليومية. وسجلُّ الأحداث والإشعاراتُ يُفرَغان من هذا الجهاز فقط — الأثرُ لا يُمحى من القاعدة. ولا يمسّ المواقعَ الألفَ والسبعمئةَ والسبعةَ والثمانين، ولا الطاقمَ، ولا الكتالوجَ، ولا الإعدادات — يمسح ما سُجِّل لا ما عُرِّف.')
      + halves(t('ما سيُمسَح') + ' — ' + nm(tot) + ' ' + t('سجلًّا'),
          ['البند','العدد'],
          C.map(function(r){
            return [esc(t(r[0])) + (r[2] ? '' : ' <span class="hint" style="margin:0">' + esc(t('من الجهاز فقط')) + '</span>'),
                    r[1] ? pill(nm(r[1]), 'wrn') : N(0)];
          }))
      + (may('delete')
        ? card('التأكيد',
            '<div class="field"><label>' + esc(t('اكتب «مسح نهائي» للتأكيد')) + '</label>'
            + '<input id="wipeOk" dir="auto" placeholder="مسح نهائي"></div>'
            + '<div class="actions">' + btn('صفّر الآن','btn-danger',' data-wipego="1"') + '</div>'
            + '<p class="hint">' + esc(t('لا رجعةَ بعدها — ولكلِّ سجلٍّ له مجموعةٌ أمرُ حذفٍ يُنفَّذ على السحابة فلا يعود مع المزامنة، وما هو من الجهاز فقط يُفرَغ هنا.')) + '</p>')
        : alertBox('info','التصفيرُ للمهندس وحده.'));
  })();
  }};

/* ═══ الفنيون والفرق: يُضافون ويُعدَّلون ويُحذَفون ═══════════════════════
   كان سجلُّ الفنيين قائمةَ عرضٍ: ستةُ أسماءٍ مخترعةٍ لا تُزاد ولا تُنقَص.
   ومن أراد فنيًّا جديدًا لم يجد أين يكتبه، ومن انصرف فنيٌّ لم يجد كيف
   يرفعه — فيبقى في التوزيع ويُسنَد إليه عملٌ لا يؤدّيه أحد. */

/* ═══ المصدرُ الواحدُ للأشخاص: الحسابات ═══
   كانت قائمةُ الفنيين قائمةً ثانيةً موازيةً للحسابات — تُزرَع في الشيفرة
   وتُضاف من شاشة الفرق وتُخزَّن في settings/techs — فالاسمُ الواحد يُكتَب في
   مكانين ويختلف فيهما، ومن حُذف من هنا بقي هناك. صارت القائمةُ تُشتقُّ من
   الحسابات: من له حسابٌ ظهر، ووظيفتُه تقرّر في أيِّ دورةٍ يظهر — الفنيُّ في
   دورة الفني وهكذا. ولا يُخزَّن شيءٌ باسم القائمة: التعديلُ يقع على وثيقة
   الحساب نفسِها. */
/* ═══ من يُسنَد إليه عملٌ ميدانيّ ═══
   كانت القائمةُ كلَّ الحسابات: يظهر فيها المشترياتُ والمحاسبُ والمستودعُ
   ومديرُ المشروع — ويُسنَد إليهم مسحٌ لن يذهبوا إليه. والإسنادُ إلى من لا
   يعمل ميدانًا ليس خطأَ عرضٍ فقط: تُحسَب له نقاطٌ، ويُنتظَر منه إنجازٌ،
   وتظهر مهمتُه في «المتأخّر» بلا صاحب.
     فالميدانُ ثلاثةٌ لا غير: فنيٌّ ومشرفٌ ومهندس — ومعهم أطقمُ التركيب
   والتجميع والتهيئة لأن عملَهم ميدانيٌّ كذلك. ومن سواهم يبقى في حسابه
   ولا يُسنَد إليه. */
var FIELD_ROLES = { tech:1, supervisor:1, engineer:1, cins:1, casm:1, cprep:1 };
function isFieldRole(r){ return !!FIELD_ROLES[effRole(r)]; }
/* الطاقمُ المنفِّذ: يرى على الخريطة وفي القائمة ما أُسند إليه وحده —
   والمشرفُ يرى الخريطةَ كلَّها وقائمتَه مُسنَدةً مع مفتاحٍ يفتح الكلّ */
function isCrewRole(r){ return ['tech','cins','casm','cprep','helper','driver'].indexOf(effRole(r)) > -1; }
var SITES_ALL = false;
function techsList(all){
  var out = [];
  Object.keys(STATE.users || {}).forEach(function(uid){
    var u = STATE.users[uid];
    if (!u || !u.name || u.active === false) return;
    /* `all` لشاشات الإدارة التي تعرض الناسَ كلَّهم — لا للإسناد */
    if (!all && !isFieldRole(u.role)) return;
    out.push({ n:u.name, u:uid, ph:u.ph || '', job:u.job || '', sup:u.sup || '', dept:u.dept || '',
               crew:u.crew || '', jobLog:u.jobLog || [], has:u.has || 0 });
  });
  return out.sort(function(a, b){ return a.n.localeCompare(b.n, 'ar'); });
}
function techUid(name){
  var U = STATE.users || {};
  for (var k in U) if (U[k] && U[k].name === name) return k;
  return '';
}

/* إضافةُ موظفٍ عامٍّ بلا فريقٍ لم تعد تُتاح من هنا: كل موظفٍ يُضاف من صفحة
   فريقه في «الفرق» (`depTechAdd`) فيُنسب لفريقٍ منذ لحظة ميلاده — لا يُترك
   بلا فريقٍ لينساه أحد. */
function techSet(name, patch){
  if (!may('users')){ toast(t('إدارةُ الفنيين للمهندس وحده')); return; }
  var uid = techUid(name);
  if (!uid){ toast(t('لا حسابَ بهذا الاسم — الأسماءُ تُضاف من الحسابات وحدَها')); return; }
  var u = Object.assign({}, STATE.users[uid], patch);
  STATE.users[uid] = u;
  CORE.set('users', uid, u);
}
function techDel(name){
  if (!may('users')){ toast(t('إدارةُ الفنيين للمهندس وحده')); return; }
  /* من له عملٌ مسجَّلٌ لا يُحذَف: سجلاتُه تحمل اسمَه، وحذفُه يُيتِّمها */
  var work = scores().list.filter(function(e){ return e.name === name; })[0];
  var acts = work ? (work.survey + work.install + work.dis + work.prep + work.asm) : 0;
  if (acts){
    toast(t('له') + ' ' + nm(acts) + ' ' + t('عملًا مسجَّلًا — لا يُحذَف'));
    return;
  }
  /* الحذفُ حذفُ حسابٍ — فالقائمةُ مشتقّةٌ منه */
  var uid = techUid(name);
  if (!uid) return;
  delete STATE.users[uid];
  CORE.dirty('users', uid, null);
  logEvent('حذف حساب — ' + name);
  toast(t('حُذف الحساب'));
  render(1);
}

/* الفرق: تُنشأ وتُحذَف، وأعضاؤها من سجل الفنيين لا من نصٍّ حرّ */
function crewsList(){
  if (!Array.isArray(STATE.crews) || !STATE.crews.length) STATE.crews = CREWS.slice();
  return STATE.crews;
}
function crewSave(){ CORE.set('cfg', 'crews', crewsList().slice()); }
function crewAdd(){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('crN');
  if (!n){ toast(t('اكتب اسم الفريق')); return; }
  if (crewsList().some(function(c){ return c.n === n; })){ toast(t('الاسمُ موجودٌ بالفعل')); return; }
  var id = 'cr' + Date.now().toString(36);
  crewsList().push({ id:id, n:n,
                     base:g('crRole') || 'supervisor', kind:g('crKind') || 'ins',
                     d:g('crD'), members:[] });
  crewSave();
  CREW_CUR = id;
  logEvent('فريق جديد — ' + n);
  toast(t('أُنشئ الفريق'));
  render(1);
}
function crewDel(id){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  /* يُقبَل المعرّفُ والاسمُ معًا: الشاشةُ تُرسل الاسمَ لأنه ما يراه
     المستخدمُ، والنداءُ القديمُ يُرسل المعرّف. */
  var L = crewsList(), i = -1, nm2 = '', id2 = '';
  L.forEach(function(c, k){ if (c.id === id || c.n === id){ i = k; nm2 = c.n; id2 = c.id; } });
  if (i < 0) return;
  var inIt = techsList().filter(function(x){ return x.crew === nm2; }).length;
  if (inIt){ toast(t('فيه') + ' ' + nm(inIt) + ' ' + t('موظفًا — انقلهم أولًا')); return; }
  var subs = TEAMS.filter(function(x){ return x.crew === nm2; }).length;
  if (subs){ toast(t('فيه') + ' ' + nm(subs) + ' ' + t('فرقًا فرعيةً — احذفها أولًا')); return; }
  L.splice(i, 1);
  crewSave();
  if (CREW_CUR === id2) CREW_CUR = L[0] ? L[0].id : '';
  logEvent('حذف فريق — ' + nm2);
  toast(t('حُذف الفريق'));
  render(1);
}

/* ═══ صفحةُ القسم الموحّدة ══════════════════════════════════════════════
   كانت ثلاث شاشاتٍ منفصلةً لمفهومٍ واحد: سجلُّ الفنيين (قائمةٌ مسطحةٌ لكل
   الموظفين)، وإدارةُ الفرق (اسمٌ ونوعٌ بلا أعضاء)، والفرقُ والأنصبةُ (تقسيمُ
   نقاطٍ من كل الفنيين بلا صلةٍ بفريقهم). فمن أراد يعرف من في فريق التركيب
   يفتح ثلاثَ شاشاتٍ ويقارن. صار لكل فريقٍ (قسمٍ) صفحتُه وحدها: موظفوه
   يُضافون فيها مباشرةً بلا اختيار فريقٍ من قائمة — والفرقُ الفرعيةُ
   (نسب الأنصبة) تُبنى من موظفيه هو لا من كل الفنيين. */

function crewTechs(crew){
  return techsList().filter(function(x){ return x.crew === crew.n; });
}
/* الفرقُ الفرعيةُ القديمةُ (قبل هذا الإصدار) لا تحمل حقل قسمٍ — تُستدَلُّ
   قسمُها من فريق أول عضوٍ فيها بدل أن تختفي من كل الصفحات. */
function crewTeams(crew){
  return TEAMS.filter(function(tm){
    if (tm.crew) return tm.crew === crew.n;
    var m0 = tm.members[0];
    var tx = m0 && techsList().filter(function(x){ return x.n === m0.name; })[0];
    return !!tx && tx.crew === crew.n;
  });
}
/* موظفون فريقهم فارغٌ أو يشير إلى فريقٍ محذوف — يظهرون هنا لا يختفون */
function unassignedTechs(){
  var names = crewsList().map(function(c){ return c.n; });
  return techsList().filter(function(x){ return !x.crew || names.indexOf(x.crew) < 0; });
}

function depTechAdd(crewId){
  if (!may('users')){ toast(t('إدارةُ الموظفين للمهندس وحده')); return; }
  var crew = crewOf(crewId);
  if (!crew) return;
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('depN');
  if (!n){ toast(t('اكتب اسم الموظف')); return; }
  /* لا يُخلَق شخصٌ من هنا: الأسماءُ من الحسابات وحدَها — وهذه الشاشةُ
     تنسبه لفريقه فقط. من لا حسابَ له يُنشأ أولًا في «الحسابات». */
  var uid = techUid(n);
  if (!uid){
    toast(t('لا حسابَ بهذا الاسم — أنشئه أولًا من «المستخدمون والأدوار ← الحسابات» ثم انسبه هنا'));
    return;
  }
  var u = Object.assign({}, STATE.users[uid], { crew:crew.n });
  if (g('depPh'))  u.ph  = g('depPh');
  if (g('depSup')) u.sup = g('depSup');
  STATE.users[uid] = u;
  CORE.set('users', uid, u);
  logEvent('نُسب لفريق — ' + n + ' \u00b7 ' + crew.n);
  toast(t('نُسب للفريق'));
  render(1);
}

function depTeamNew(crewId){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var crew = crewOf(crewId);
  if (!crew) return;
  var id = 'CT' + Date.now().toString(36);
  var tm = { id:id, n:'فريق ' + nm(crewTeams(crew).length + 1), crew:crew.n, kind:crew.kind, members:[] };
  TEAMS.push(tm);
  CTEAM_CUR = id;
  CORE.dirty('teams', id, tm);
  render(1);
}
function depTeamAdd(){
  var tm = teamOf(CTEAM_CUR);
  if (!tm){ toast(t('أنشئ فريقًا فرعيًّا أولًا')); return; }
  var n = (document.getElementById('depMemName') || {}).value;
  var r = (document.getElementById('depMemRole') || {}).value || 'tech';
  var sh = cfgN((document.getElementById('depMemShare') || {}).value);
  if (!n){ toast(t('لا موظفَ متاح')); return; }
  if (tm.members.some(function(m){ return m.name === n; })){ toast(t('هو في الفريق بالفعل')); return; }
  tm.members.push({ name:n, role:r, share:sh });
  CORE.dirty('teams', tm.id, tm);
  logEvent('إضافة ' + n + ' إلى ' + tm.n);
  toast(n + ' \u00b7 ' + t('أُضيف'));
  render(1);
}
function depTeamRm(i){
  var tm = teamOf(CTEAM_CUR);
  if (!tm) return;
  var m = tm.members[i];
  if (!m) return;
  tm.members.splice(i, 1);
  CORE.dirty('teams', tm.id, tm);
  logEvent('إخراج ' + m.name + ' من ' + tm.n);
  toast(m.name + ' \u00b7 ' + t('أُخرج'));
  render(1);
}
function depTeamEven(){
  var tm = teamOf(CTEAM_CUR), n = tm && tm.members.length;
  if (!tm || !n){ toast(t('لا أعضاءَ في هذا الفريق')); return; }
  var base = Math.floor(100 / n), rest = 100 - base * n;
  tm.members.forEach(function(m, i){ m.share = base + (i < rest ? 1 : 0); });
  CORE.dirty('teams', tm.id, tm);
  toast(t('وُزّعت بالتساوي'));
  render(1);
}
function depTeamByRole(){
  var tm = teamOf(CTEAM_CUR);
  if (!tm) return;
  var raw = tm.members.map(function(m){ return (TEAM_ROLE[m.role] || TEAM_ROLE.tech).def; });
  var sum = raw.reduce(function(a,b){ return a + b; }, 0);
  if (!sum){ toast(t('لا أعضاءَ في هذا الفريق')); return; }
  var acc = 0;
  tm.members.forEach(function(m, i){
    var v = (i === tm.members.length - 1) ? (100 - acc) : Math.round(raw[i] / sum * 100);
    m.share = v; acc += v;
  });
  CORE.dirty('teams', tm.id, tm);
  toast(t('وُزّعت بالأدوار'));
  render(1);
}
function depTeamDel(teamId){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var i = -1;
  TEAMS.forEach(function(x, k){ if (x.id === teamId) i = k; });
  if (i < 0) return;
  if (TEAMS[i].members.length){ toast(t('فيه أعضاء — أخرجهم أولًا')); return; }
  TEAMS.splice(i, 1);
  CORE.dirty('teams', teamId, null);
  if (CTEAM_CUR === teamId) CTEAM_CUR = '';
  toast(t('حُذف الفريق الفرعي'));
  render(1);
}

/* ═══ الوظائف: ما يعمله الشخصُ، ومنه يُشتقُّ دورُه ═══════════════════════════
   كان الشخصُ يُعطى دورًا مباشرةً — «فني» أو «مشرف» — والدورُ صلاحيةٌ لا وظيفة.
   فمسؤولُ المستودع ومشرفُ الميدان كلاهما «مشرف»، ولا يُعرَف من الاثنين من
   يستلم العهدةَ ومن ينزل المشاعر.

   والوظيفةُ تتغيّر في أثناء الموسم: من كان في التهيئة ينتقل إلى التركيب.
   فتُسجَّل النقلةُ بتاريخها ولا تُمحى الأولى — وإلا ضاع من عمل ماذا ومتى. */

var JOBS_SEED = [
  /* الوظيفةُ ما يعمله الشخص، والدورُ ما تسمح به القاعدة. وهذه الوظائفُ
     الإحدى عشرةُ هي هيكلُ الفريق كما هو في الأرض — ولكلٍّ دورٌ من السبعة
     التي تعرفها قواعدُ القاعدة، فلا يُنشَأ دورٌ لا تعرفه فتُرفَض كتابتُه. */
  { id:'j_exec',  n:'الإدارة العليا', role:'exec',       d:'فوق مدير المشروع: تطّلع على كلِّ شيءٍ وتعتمد — ولا تدير الأدوار.' },
  { id:'j_admin', n:'مدير المشروع',  role:'admin',      d:'صلاحيةٌ كاملة — ويُدير الأدوارَ والحسابات.' },
  { id:'j_eng',   n:'مهندس المشروع', role:'engineer',   d:'يدير التنفيذَ ويعتمد ما يرفعه الميدان — يرث من المدير دون إدارة الأدوار.' },
  { id:'j_buy',   n:'مشتريات',       role:'supervisor', d:'يسجّل المشترياتِ ويتابع المورّدين والفئات.' },
  { id:'j_store', n:'مستودع',        role:'supervisor', d:'يستلم التوريدَ ويصرف العهدةَ ويستقبل المرتجَع.' },
  { id:'j_acc',   n:'محاسب',         role:'supervisor', d:'يتابع المستخلصاتِ والميزانيةَ وتكلفةَ التشغيل.' },
  { id:'j_prep',  n:'مسؤول تهيئة',   role:'cprep',      d:'يضبط الجهازَ وعنوانَه ونظامَه ويفحصه قبل النزول.' },
  { id:'j_asm',   n:'مسؤول تجميع',   role:'casm',       d:'يجمّع مكوّناتِ البوكس ويوصّلها قبل النزول.' },
  { id:'j_sup',   n:'مشرف',          role:'supervisor', d:'يوزّع العملَ على فرقه ويتابع تنفيذَه في المشاعر.' },
  { id:'j_ins',   n:'فني تركيب',     role:'cins',       d:'يركّب في الموقع ويوثّق بالصور.' },
  { id:'j_tech',  n:'مساعد فني',     role:'tech',       d:'يمسح النقاطَ ويحدّث حالتَها ويصوّر.' },
  /* V16.40: حساباتُ الوزارة تُسلَّم — وكانت بلا وظيفةٍ فيُختار لها ما يرفع دورَها؛
     الوظيفةُ «مراقب الوزارة» تشتقُّ الدورَ الصحيح: قراءةٌ بلا كتابة */
  { id:'j_view',  n:'مراقب الوزارة', role:'viewer',     d:'يتابع ويصدّر — ولا يكتب حرفًا، والهواتفُ محجوبةٌ عنه.' },
  { id:'j_drv',   n:'سائق',          role:'tech',       d:'ينقل الفريقَ والعدّةَ — وتُسنَد إليه سيارة.' },
  { id:'j_view',  n:'مراقب وزاري',   role:'viewer',     d:'يقرأ التقدّمَ ولا يكتب شيئًا.' }
];

function jobsList(){
  if (!Array.isArray(STATE.jobs) || !STATE.jobs.length) STATE.jobs = JOBS_SEED.slice();
  /* وظيفةٌ زِيدت في البذرة بعد أن حُفظت القائمةُ في القاعدة لا تظهر — فتُلحَق
     بموضعها (الإدارةُ العليا أوّلًا) دون أن تمسَّ ما عدّله المكتب */
  JOBS_SEED.forEach(function(j, i){
    if (!STATE.jobs.some(function(x){ return x.id === j.id; })) STATE.jobs.splice(Math.min(i, STATE.jobs.length), 0, Object.assign({}, j));
  });
  return STATE.jobs;
}
function jobSave(){ CORE.set('cfg', 'jobs', jobsList().slice()); }
function jobOf(id){ return jobsList().filter(function(j){ return j.id === id; })[0] || null; }
function roleOfJob(id){ var j = jobOf(id); return j ? j.role : ''; }
function jobUsed(id){
  var n = 0;
  techsList().forEach(function(x){ if (x.job === id) n++; });
  Object.keys(STATE.users || {}).forEach(function(k){ if ((STATE.users[k] || {}).job === id) n++; });
  return n;
}

function jobAdd(){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('jbN');
  if (!n){ toast(t('اكتب اسم الوظيفة')); return; }
  if (jobsList().some(function(j){ return j.n === n; })){ toast(t('موجودةٌ بالفعل')); return; }
  jobsList().push({ id:'j' + Date.now().toString(36), n:n, role:g('jbR') || 'tech', d:g('jbD') });
  jobSave();
  logEvent('وظيفة جديدة — ' + n);
  toast(t('أُضيفت الوظيفة'));
  render(1);
}
function jobSet(id, patch){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var j = jobOf(id); if (!j) return;
  Object.keys(patch).forEach(function(k){ j[k] = patch[k]; });
  jobSave();
}
function jobDel(id){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var u = jobUsed(id);
  if (u){ toast(t('عليها') + ' ' + nm(u) + ' ' + t('شخصًا — انقلهم أولًا')); return; }
  var L = jobsList(), i = -1, nm2 = '';
  L.forEach(function(j, k){ if (j.id === id){ i = k; nm2 = j.n; } });
  if (i < 0) return;
  L.splice(i, 1);
  jobSave();
  logEvent('حذف وظيفة — ' + nm2);
  toast(t('حُذفت'));
  render(1);
}

/* إسنادُ وظيفةٍ لشخص: تُسجَّل النقلةُ ولا تُمحى السابقة */
function jobAssign(who, jobId){
  var uid = techUid(who);
  if (!uid) return;
  var u = STATE.users[uid];
  var was = u.job ? (jobOf(u.job) || {}).n : '';
  if (u.job === jobId) return;
  u = Object.assign({}, u, { job:jobId,
    jobLog:(u.jobLog || []).concat([{ job:jobId, at:Date.now(), by:STATE.meta.name || '' }]) });
  STATE.users[uid] = u;
  CORE.set('users', uid, u);
  var now = (jobOf(jobId) || {}).n || '—';
  logEvent('وظيفة — ' + who + ': ' + (was || 'بلا وظيفة') + ' → ' + now);
  notifPush('وظيفة', who + ': ' + (was || 'بلا وظيفة') + ' → ' + now, { to:who, lv:'عادي' });
}

/* سجلُّ الدروس: كان قائمةَ عرضٍ ثابتةً تُقرأ ولا يُكتَب فيها — والدرسُ الذي
   لا يُكتَب يومَ وقع لا يُكتَب أبدًا، فيُكرَّر في الموسم القادم. */
/* (V27.1) كان سجلُّ الدروس السريع شريحةً في التنظيم والدروسُ الموثّقة شريحةً في التقارير التنفيذية — صفحةٌ واحدة */
var LESS_SHOW = false;   /* (V27.1) السجلُّ القديمُ يُطوى حتى يُطلَب — صفحةُ الدروس لا تثقل بمحتواه */
function lessLegacyBody(){ if (!LESS_SHOW) return '<p class="hint" style="margin:8px 0">' + esc(t('سجل الدروس السريع')) + ' — ' + nm(lessList().length) + ' ' + btn(t('اعرض'), 'btn-quiet btn-sm', ' data-lsshow="1"') + '</p>';
  return '<details class="mfu-add" open><summary>' + esc(t('سجل الدروس السريع')) + '</summary>' + (function(){
    var L = lessList();
    return cardFlush(t('الدروس') + ' — ' + nm(L.length),
        L.length
          ? table(['المرحلة','ما وقع','ما فُعل',''],
              L.map(function(l, i){
                return [pill(l.p,'acc'),
                        /* (V27.1) كانت الصفوفُ حقولًا تُحرَّر في مكانها — نصٌّ الآن (الصفحةُ المدمجة تثقل بعشرين حقلًا)، والتحريرُ بحذفٍ وإعادةِ تسجيل */
                        esc(l.w), esc(l.a || ''),
                        may('settings')
                          ? btn('حذف','btn-quiet btn-sm',' data-lsdel="' + i + '"') : ''];
              }))
          : '<p class="hint" style="padding:16px">' + esc(t('لا دروسَ مسجَّلةٌ بعد.')) + '</p>',
        btn('⬇ إكسل — الدروس','btn-secondary btn-sm',' data-xls="less"'))
      + (may('settings')
        ? card('سجّل درسًا',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('المرحلة')) + '</label><select id="lqP">'
            +   ['التخطيط','المسح','التهيئة','التجميع','التركيب','الفك','الإغلاق']
                 .map(function(p){ return '<option value="' + esc(p) + '">' + esc(t(p)) + '</option>'; }).join('')
            +   '</select></div>'
            + '<div class="field"><label>' + esc(t('ما وقع')) + ' <span class="req">*</span></label>'
            +   '<input id="lqW" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('ما فُعل')) + '</label>'
            +   '<input id="lqA" dir="auto"></div>'
            + '</div>',
            btn('➕ سجّل الدرس','btn-primary btn-sm',' data-lsadd="1"'))
        : '')
      + '<p class="hint">' + esc(t('يُراجَع عند إغلاق المشروع ويُسلَّم مع وثائقه — فما كلّف مرةً لا يُكلِّف ثانية.')) + '</p>';
  })() + '</details>'; }
function lessList(){
  if (!Array.isArray(STATE.lessons) || !STATE.lessons.length) STATE.lessons = LESSONS.slice();
  return STATE.lessons;
}
function lessSave(){ CORE.set('cfg', 'lessons', lessList().slice()); }
function lessAdd(){
  if (!may('settings')){ toast(t('سجلُّ الدروس للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var w2 = g('lqW');
  if (!w2){ toast(t('اكتب ما وقع')); return; }
  lessList().push({ p:g('lqP') || 'المسح', w:w2, a:g('lqA') });
  lessSave(); logEvent('درس مستفاد — ' + w2.slice(0, 50));
  toast(t('سُجّل الدرس')); render(1);
}
function lessSet(i, patch){
  if (!may('settings')) return;
  var l = lessList()[i]; if (!l) return;
  Object.keys(patch).forEach(function(k){ l[k] = patch[k]; });
  lessSave();
}
function lessDel(i){
  if (!may('settings')){ toast(t('سجلُّ الدروس للمهندس وحده')); return; }
  var L = lessList(); if (!L[i]) return;
  var w2 = L[i].w; L.splice(i, 1); lessSave();
  logEvent('حذف درس — ' + String(w2).slice(0, 40));
  toast(t('حُذف')); render(1);
}

/* ═══ عناوينُ الشبكة ═══
   لكلِّ نقطةٍ مركَّبةٍ بادئةُ شبكةٍ وثلاثةُ عناوين: الراوترُ والقارئُ
   والكاميرا. تُستورَد من ملفٍ وتُصدَّر إليه — وكانت تُكتَب ولا تُعرَض،
   فمن أراد عنوانَ قارئٍ ليتصل به لم يجده إلا في ملفٍ خارج النظام. */
var IP_Q = '';
function ipRows(){
  return (STATE.sites || []).filter(function(x){
    if (!x.net && !x.ipRtr && !x.ipRdr && !x.ipCam) return false;
    if (!IP_Q) return true;
    return (x.id + ' ' + (x.name || '') + ' ' + (x.net || '')).indexOf(IP_Q) > -1;
  });
}
function ipSet(id, key, val){
  if (!may('edit')){ toast(t('التحريرُ ليس من صلاحيتك')); return; }
  var x = siteFind(id); if (!x) return;
  x[key] = String(val || '').trim();
  CORE.set('sites', id, { net:x.net || '', ipRtr:x.ipRtr || '', ipRdr:x.ipRdr || '', ipCam:x.ipCam || '' });
  statBump();
}

/* مسحُ عناوين نقطة: تُفرَغ الحقولُ الأربعةُ وتُقيَّد في الطابور — والنقطةُ
   نفسُها تبقى، فالعنوانُ صفةٌ لها لا هي. */
function ipClear(id){
  if (!may('edit')){ toast(t('التحريرُ ليس من صلاحيتك')); return; }
  var x = siteFind(id); if (!x) return;
  x.net = ''; x.ipRtr = ''; x.ipRdr = ''; x.ipCam = '';
  CORE.set('sites', id, { net:'', ipRtr:'', ipRdr:'', ipCam:'' });
  logEvent('مسح عناوين — ' + id, id);
  toast(t('مُسحت العناوين')); statBump(); render(1);
}


function vehKindSave(){ CORE.set('cfg', 'vehKinds', vehKinds().slice()); }
function vehKindSet(id, patch){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var k = vehKinds().filter(function(x){ return x.id === id; })[0];
  if (!k) return;
  Object.keys(patch).forEach(function(p){ k[p] = patch[p]; });
  vehKindSave();
}
function vehKindAdd(){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('vkN');
  if (!n){ toast(t('اكتب اسم النوع')); return; }
  if (vehKinds().some(function(x){ return x.n === n; })){ toast(t('النوعُ موجودٌ بالفعل')); return; }
  vehKinds().push({ id:'vk' + Date.now().toString(36), n:n, d:g('vkD'), cap:+g('vkC') || 2 });
  vehKindSave();
  logEvent('نوع سيارة جديد — ' + n);
  toast(t('أُضيف النوع'));
  render(1);
}
function vehKindDel(id){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var used = vehList().filter(function(v){ return v.kind === id; }).length;
  if (used){ toast(t('عليه') + ' ' + nm(used) + ' ' + t('سيارةً — لا يُحذَف')); return; }
  var L = vehKinds(), i = -1, nm2 = '';
  L.forEach(function(x, k){ if (x.id === id){ i = k; nm2 = x.n; } });
  if (i < 0) return;
  L.splice(i, 1);
  vehKindSave();
  logEvent('حذف نوع سيارة — ' + nm2);
  toast(t('حُذف النوع'));
  render(1);
}



/* ── تفصيلُ أداء الفني: عددٌ ووزنٌ لكلِّ نوعٍ، لا رقمٌ واحدٌ مجهولُ المصدر ── */
function breakCell(count, pts, byType){
  var lines = Object.keys(byType || {}).map(function(ty){
    var v = byType[ty];
    return esc(ty || '\u2014') + ': ' + nm(v.n) + ' (' + nm(Math.round(v.pts * 10) / 10) + ')';
  }).join('<br>');
  return '<div>' + N(count) + ' \u00b7 <span class="num">' + nm(Math.round(pts * 10) / 10)
    + '</span> ' + esc(t('نقطة'))
    + (lines ? '<div class="hint" style="margin:2px 0 0">' + lines + '</div>' : '') + '</div>';
}

/* ── تجميعُ الأداء: بالوظيفة أو بالفريق أو للمشروع كله ──
   نفسُ الحقول المشتقّة من scores() تُجمَع لا تُعاد حسابها — رقمٌ واحدٌ
   مصدرُه، يُعرَض على مستوياتٍ مختلفة. */
function rollupBy(keyFn, labelFn){
  var groups = Object.create(null), order = [];
  scores().list.forEach(function(e){
    var tx = techsList().filter(function(x){ return x.n === e.name; })[0];
    var k = keyFn(e, tx);
    if (k === null || k === undefined || k === '') k = 'بلا تصنيف';
    if (!groups[k]){
      groups[k] = { key:k, name:labelFn ? labelFn(k) : k, n:0,
        survey:0, pSurvey:0, install:0, pInstall:0, dis:0, pDis:0, pBonus:0, total:0 };
      order.push(k);
    }
    var g = groups[k];
    g.n++;
    g.survey += e.survey;   g.pSurvey += e.pSurvey;
    g.install += e.install; g.pInstall += e.pInstall;
    g.dis += e.dis;         g.pDis += e.pDis;
    g.pBonus += e.pBonus;   g.total += e.total;
  });
  return order.map(function(k){ return groups[k]; }).sort(function(a,b){ return b.total - a.total; });
}
function rollupTable(groups, labelHeader){
  var Tg = T(), perPerson = cfgN(Tg.survey) + cfgN(Tg.ins) + cfgN(Tg.dis);
  return table([labelHeader,'أفراد','زيارة','تركيب','فك','زيادة','الإجمالي','من التارجت'],
    groups.map(function(g){
      var target = perPerson * g.n;
      return [esc(t(g.name)), N(g.n),
              breakCell(g.survey, g.pSurvey), breakCell(g.install, g.pInstall), breakCell(g.dis, g.pDis),
              g.pBonus ? ('<span class="' + (g.pBonus > 0 ? 'num' : 'req') + '">'
                           + (g.pBonus > 0 ? '+' : '') + nm(Math.round(g.pBonus * 10) / 10) + '</span>') : '—',
              '<b>' + nm(Math.round(g.total * 10) / 10) + '</b>',
              target ? pct(g.total, target) : '—'];
    }));
}

function techPerfTable(list, showRank){
  var Tg = T(), target = cfgN(Tg.survey) + cfgN(Tg.ins) + cfgN(Tg.dis);
  return table((showRank ? ['#'] : []).concat(
      ['الفني','زيارة','تركيب','فك','زيادة','الإجمالي','من التارجت']),
    list.map(function(e, i){
      var row = [
        '<strong>' + esc(dispName(e.name)) + '</strong>',
        breakCell(e.survey, e.pSurvey),
        breakCell(e.install, e.pInstall, e.installT),
        breakCell(e.dis, e.pDis, e.disT),
        e.pBonus ? ('<span class="' + (e.pBonus > 0 ? 'num' : 'req') + '">'
                     + (e.pBonus > 0 ? '+' : '') + nm(Math.round(e.pBonus * 10) / 10) + '</span>') : '—',
        '<b>' + nm(Math.round(e.total * 10) / 10) + '</b>',
        target ? pct(e.total, target) : '—'
      ];
      return showRank ? [nm(i + 1)].concat(row) : row;
    }));
}

/* نموذجُ إضافة نقاط الزيادة: مشتركٌ بين تقرير المهندس (كل الفنيين) وفريقي
   (فنيّو المشرف وحدهم) — الفرقُ في قائمة من يظهر لا في المنطق */
function bonusFormHtml(techs, idPrefix){
  return card('إضافة نقاط زيادة',
      '<div class="grid cols-3">'
      + '<div class="field" style="margin:0"><label>' + esc(t('الفني')) + '</label>'
      + '<select id="' + idPrefix + 'BnTech">' + techs.map(function(n){
          return '<option>' + esc(n) + '</option>'; }).join('') + '</select></div>'
      + '<div class="field" style="margin:0"><label>' + esc(t('النقاط')) + '</label>'
      + '<input type="number" id="' + idPrefix + 'BnPts" placeholder="' + esc(t('مثلاً 20 أو -10')) + '"></div>'
      + '<div class="field" style="margin:0"><label>' + esc(t('السبب')) + '</label>'
      + '<input id="' + idPrefix + 'BnNote" dir="auto"></div>'
      + '</div>',
      btn('➕ إضافة','btn-primary btn-sm',' data-bnadd="' + idPrefix + '"'));
}

function bonusLogHtml(techs){
  var rows = bonusList().filter(function(b){ return techs.indexOf(b.tech) > -1; })
    .sort(function(a,b){ return b.at - a.at; });
  if (!rows.length) return '';
  return cardFlush(t('سجلُّ نقاط الزيادة') + ' — ' + nm(rows.length),
    table(['الفني','النقاط','السبب','بواسطة','الوقت',''],
      rows.slice(0, 40).map(function(b){
        return [esc(b.tech),
                '<span class="' + (b.pts > 0 ? 'num' : 'req') + '">' + (b.pts > 0 ? '+' : '') + nm(b.pts) + '</span>',
                esc(b.note || '—'), esc(b.by),
                '<span class="num">' + fmtDate(b.at) + '</span>',
                btn('حذف','btn-quiet btn-sm',' data-bndel="' + esc(b.id) + '"')];
      })));
}

/* ── صحة الأجهزة ────────────────────────────────── */

/* ── النظام ─────────────────────────────────────── */
/* ═══ الإشعارات: أربعُ قنواتٍ ورسالةٌ واحدة ═══════════════════════════════
   القديمُ كان يُشعِر بواتساب وحده، وبفتحِ نافذةٍ يدويًّا لكلِّ مرسَلٍ إليه.
   وهذا يعمل ما دام المرسِلُ جالسًا أمام الشاشة — ولا يعمل ليلًا ولا حين
   يكون المشرفُ في الميدان.

   فصارت الرسالةُ واحدةً تُولَّد مرةً، ثم تُرسَل بما يتاح:
     · داخل التطبيق — دائمًا، وتبقى حتى تُقرأ
     · إشعارُ النظام — يظهر على اللاب والجوّال والويب ولو كان التطبيق مغلقًا
       ما دام مثبَّتًا، بإذنٍ يُطلَب مرةً
     · واتساب — للمرسَل إليه بعينه، برقمه المسجَّل
     · بريد — يفتح المرسِلَ بنصٍّ جاهز

   والإشعارُ الذي لا يُقرأ لا يُحذَف: يبقى في المركز بمن أنشأه ومتى ولمن. */

var NOTIF_MAX = 200;

function notifStore(){ if (!STATE.notifs) STATE.notifs = []; return STATE.notifs; }
/* ═══ الإشعارُ يُولَد حيث يُقرأ لا حيث يُكتَب ═══
   كانت كلُّ الإشعارات تُدفَع على جهاز الفاعل: يعتمد المهندسُ فيُكتَب «اعتُمدت
   زيارتك» في مركز إشعاراته هو — والفنيُّ لا يصله شيء، ولا المهندسَ «زيارةٌ
   تمّت» حين يحفظ المشرف. الإشعاراتُ مخزنٌ محليٌّ بقرار (لا تُزامَن)، فالطريقُ
   الصحيحُ أن يولّدها الجهازُ المستقبِلُ لحظةَ وصولِ الوثيقة بالإنصات أو
   السحب: كلُّ وصولٍ يمرُّ بـCORE.applyDoc، وهناك يُقارَن الجديدُ بالقديم ويُقال
   لصاحب الشأن ما يعنيه. وعلامةٌ عاليةٌ (notifAt) تمنع إعادةَ الإخبار بما
   قيل، وتُهمِل التاريخَ عند أوّل دخول. */
var NOTIF_SEEN = {};
function notifConcerns(v){
  var me = STATE.meta.name || '';
  if (!me) return false;
  if (v.to === me || v.assignedTo === me || v.by === me) return true;
  return typeof underNames === 'function' && underNames(me).indexOf(v.by || v.to || '') > -1;
}
function notifOnArrival(kind, id, prev, v){
  if (!v || v.deleted || !STATE.meta.uid || v._by === STATE.meta.uid) return;
  var at = v._at || v.at || 0, mark = STATE.meta.notifAt || 0;
  if (!mark){ STATE.meta.notifAt = Date.now(); return; }          /* أوّلُ دخول: التاريخُ لا يُخبَر به */
  if (at < mark - 120000) return;
  var key = kind + ':' + id + ':' + at; if (NOTIF_SEEN[key]) return; NOTIF_SEEN[key] = 1;
  if (at > STATE.meta.notifAt) STATE.meta.notifAt = at;
  var p = prev || {}, who = dispName(v.by || v._byName || '') || '';
  var me = STATE.meta.name || '';
  if (kind === 'tasks'){
    if ((v.to === me || v.assignedTo === me) && p.to !== me && p.assignedTo !== me)
      notifPush('إسناد', (v.no || '') + ' \u00b7 ' + (v.site || '') + ' \u2014 ' + t(v.kind === 'install' ? 'تركيب' : (v.kind === 'visit' ? 'زيارة' : String(v.kind || ''))), { to:me, site:v.site || '', lv:'مهم', actor:(v.by || v._byName || who), at:at });
    else if (v.status === 'مُنجز' && p.status !== 'مُنجز' && (may('approve') || notifConcerns(v)))
      notifPush('تمّ', (v.no || '') + ' \u00b7 ' + (v.site || '') + ' \u2014 ' + (v.to || ''), { site:v.site || '', lv:'عادي', actor:(v.by || v._byName || who), at:at });
    return;
  }
  if (kind === 'recs'){
    var rv = svReview(v), pv = svReview(p);
    if (rv === 'pending' && (pv !== 'pending' || (v.at || 0) !== (p.at || 0)) && may('approve'))
      notifPush('زيارة تمّت', id + ' \u00b7 ' + who + ' \u2014 ' + t('بانتظار اعتمادك'), { site:id, lv:'مهم', actor:(v.by || v._byName || who), at:at });
    else if (rv === 'approved' && pv !== 'approved' && notifConcerns(v))
      notifPush('اعتماد تقني', t('اعتُمدت زيارةُ') + ' ' + id, { to:v.by || '', site:id, lv:'عادي', actor:(v.by || v._byName || who), at:at });
    /* الوزارةُ تُخبَر بما ينتظرها، والمهندسُ بما قرّرته */
    else if (minState(v) === 'pending' && minState(p) !== 'pending' && may('minapprove') && effRole(ROLE) === 'viewer')
      notifPush('بانتظار اعتمادكم', id + ' \u2014 ' + t('إعدادُ التركيب بانتظار اعتماد الوزارة'), { site:id, lv:'مهم', actor:(v.by || v._byName || who), at:at });
    else if (minState(v) === 'approved' && minState(p) !== 'approved' && (may('approve') || notifConcerns(v)))
      notifPush('اعتمدت الوزارة', id + ' \u2014 ' + t('جاهزةٌ للتركيب'), { site:id, lv:'مهم', actor:(v.by || v._byName || who), at:at });
    else if (minState(v) === 'returned' && minState(p) !== 'returned' && may('approve'))
      notifPush('ردّت الوزارة', id + (v.minNote ? ' \u2014 ' + v.minNote : ''), { site:id, lv:'عاجل', actor:(v.by || v._byName || who), at:at });
    else if (rv === 'revisit' && pv !== 'revisit' && notifConcerns(v))
      notifPush('تحتاج زيارة أخرى', id + (v.revisitNote ? ' \u2014 ' + v.revisitNote : ''), { to:v.by || '', site:id, lv:'عاجل', actor:(v.by || v._byName || who), at:at });
    return;
  }
  if (kind === 'inss'){
    if (v.status === 'مُركّب' && !v.approved && (p.status !== 'مُركّب' || (v.at || 0) !== (p.at || 0)) && may('approve'))
      notifPush('تركيب تمّ', id + ' \u00b7 ' + who + ' \u2014 ' + t('بانتظار التدقيق'), { site:id, lv:'مهم', actor:(v.by || v._byName || who), at:at });
    else if (v.approved && !p.approved && notifConcerns(v))
      notifPush('اعتماد', t('اعتُمد تركيبُ') + ' ' + id, { to:v.by || '', site:id, lv:'مهم', actor:(v.by || v._byName || who), at:at });
    return;
  }
  if (kind === 'diss' || kind === 'maints'){
    if ((v.to === me || v.assignedTo === me) && p.to !== me && p.assignedTo !== me)
      notifPush('إسناد', id + ' \u2014 ' + t(kind === 'diss' ? 'فك' : 'صيانة'), { to:me, site:id, lv:'مهم', actor:(v.by || v._byName || who), at:at });
  }
}
/* الأهميةُ تحدّد ما يُدفَع إلى نظام التشغيل وما يُترَك للمركز */
var NOTIF_LV = { عاجل:3, مهم:2, عادي:1 };


/* ═══ كلُّ خطوةٍ تُحفَظ تُعلَن ═══
   كان الحفظُ يُسجَّل في السجل ولا يُشعِر: يزور الفنيُّ ويركّب ويفكُّ ويصون —
   ولا يعلم المكتبُ إلا حين يفتح الشاشةَ ويعدّ. صار كلُّ حفظٍ يُعلن خطوتَه:
   إشعارٌ بلا وجهةٍ يراه المكتبُ كلُّه، وسطرٌ في «آخر ما تمّ» يقرؤه المهندسُ
   في «الآن» والوزارةُ في «نظرة عامة» — بمن فعل وأين ومتى وكم نقطةً كسب.
     والعلانيةُ لا تُغني عن الاعتماد: «تمّ» هنا تعني أُنجز العملُ لا أنه
   اعتُمد — والاعتمادُ خطوةٌ لها إشعارُها. */
var STEP_KINDS = {
  visit:   { n:'زيارةُ مسح',   i:'\u{1F50D}', code:'SR' },
  install: { n:'تركيب',        i:'\u{1F527}', code:'IR' },
  dis:     { n:'فك',           i:'\u{1F9E9}', code:'UR' },
  maint:   { n:'صيانة',        i:'\u{1F6E1}', code:'MR' },
  hand:    { n:'تسليم',        i:'\u{1F91D}', code:'HO' },
  newsite: { n:'موقعٌ جديد',   i:'\u{1F4CD}', code:'NS' }
};
function stepDone(kind, siteId, detail, pts){
  var K = STEP_KINDS[kind] || { n:kind, i:'', code:'' };
  var who = STATE.meta.name || '';
  var rec = { at:Date.now(), kind:kind, site:siteId || '', by:who,
              detail:String(detail || ''), pts:cfgN(pts) || 0 };
  STATE.steps = STATE.steps || [];
  rec.id = uid36();
  STATE.steps.unshift(rec);
  if (STATE.steps.length > 300) STATE.steps.length = 300;
  /* تُرفَع: لوحةُ الوزارة على جهازها لا ترى ما بقي في جهاز الفنيّ */
  CORE.set('steps', rec.id, rec);
  CORE.saveSoon();
  /* بلا وجهةٍ: يراه المكتبُ كلُّه — ومن يدير الناسَ يرى كلَّ شيءٍ أصلًا */
  notifPush('تمّ', K.i + ' ' + t(K.n) + (siteId ? ' \u00b7 ' + siteId : '')
            + (detail ? ' \u00b7 ' + detail : '')
            + (rec.pts ? ' \u00b7 ' + nm(rec.pts) + ' ' + t('نقطة') : ''),
            /* فاعلُ الخطوة صاحبُ الجهاز نفسُه — هو من نفّذها الآن */
            { site:siteId || '', lv:'عادي' });
  return rec;
}
/* «منذ كم» بلا مكتبة: دقائقُ ثم ساعاتٌ ثم تاريخ */
function stepAgo(at){
  var m = Math.floor((Date.now() - at) / 60000);
  if (m < 1) return t('الآن');
  if (m < 60) return t('منذ') + ' ' + nm(m) + ' ' + t('د');
  if (m < 1440) return t('منذ') + ' ' + nm(Math.floor(m / 60)) + ' ' + t('س');
  return fmtDate(at);
}
function stepsList(n){
  var L = STATE.steps || [];
  return n ? L.slice(0, n) : L;
}
function stepsCard(n){
  var L = stepsList(n || 12);
  /* الرقمُ خطواتٌ (كلُّ حفظٍ خطوة، والنقطةُ قد تُحفَظ مرتين) لا نقاطٌ — فيُقال
     العددان كي لا يُقارَن «٦٩ خطوة» بـ«٦٣ نقطةً مُسحت» */
  var uniq = {}; (STATE.steps || []).forEach(function(x){ if (x.site) uniq[x.kind + '|' + x.site] = 1; });
  var nSites = Object.keys(uniq).length;
  if (!L.length) return card('\u2705 ' + t('آخر ما تمّ'),
    '<p class="hint" style="text-align:center;margin:0">'
    + esc(t('لا خطوةَ سُجِّلت بعد — أوّلُ حفظٍ في أيِّ نموذجٍ يظهر هنا.')) + '</p>');
  return cardFlush('\u2705 ' + t('آخر ما تمّ') + ' \u2014 ' + nm(nSites) + ' ' + t('نقطة') + ' \u00b7 ' + nm(stepsList().length) + ' ' + t('خطوة'),
    table(['الخطوة','النقطة','مَن','متى'],
      L.map(function(r){
        var K = STEP_KINDS[r.kind] || { n:r.kind, i:'', code:'' };
        return [K.i + ' <strong>' + esc(t(K.n)) + '</strong>'
                  + (K.code ? ' <span class="num hint">' + esc(K.code) + '</span>' : '')
                  + (r.detail ? '<br><span class="hint" style="margin:0">' + esc(r.detail.slice(0, 40)) + '</span>' : ''),
                r.site ? '<span class="num">' + esc(r.site) + '</span>' : '\u2014',
                esc(dispName(r.by)),
                '<span class="hint num" style="margin:0">' + esc(stepAgo(r.at)) + '</span>'];
      })));
}
/* ═══ التصادم: من عدّل السجلَّ نفسَه في الوقت نفسِه (V17.79) ═══ */
var CLASH = {};
function clashNote(kind, id, local, remote){
  if (!remote || !remote._by || remote._by === STATE.meta.uid) return;
  var q = null;
  for (var i = 0; i < STATE.queue.length; i++) if (STATE.queue[i].kind === kind && STATE.queue[i].id === id){ q = STATE.queue[i]; break; }
  if (!q) return;
  var by = (typeof dispName === 'function' && dispName(remote._byName || remote._by)) || remote._byName || remote._by;
  CLASH[id] = { kind:kind, by:by, at:+remote._at || Date.now(), mine:q.at };
  notifPush('تعديلٌ متزامن', id + ' — ' + t('عدّلها') + ' ' + by + ' ' + t('وفي جهازك تعديلٌ لم يُرفَع بعد: سيُرفَع فوق تعديله — راجع النقطة'),
            { site:id, lv:'مهم', to:STATE.meta.name || '' });
  logEvent('تصادمُ تعديلٍ — ' + id + ' \u00b7 ' + by, id);
}
function clashPill(id){
  var c = CLASH[id];
  if (!c) return '';
  return '<span class="pill bad" title="' + esc(t('عدّلها غيرُك بينما تعديلُك لم يُرفَع')) + '">\u26A0 ' + esc(t('تعديلٌ متزامن')) + ' \u00b7 ' + esc(c.by) + '</span>';
}
/* هل سبقني غيري على النقطة بعد فتحي للنموذج؟ */
function svClashAhead(id){
  var cur = STATE.recs[id];
  if (!cur || !cur._by || cur._by === STATE.meta.uid) return null;
  if (!FORM.openedAt || !(+cur._at > FORM.openedAt)) return null;
  return { by:(typeof dispName === 'function' && dispName(cur._byName || cur._by)) || cur._by, at:+cur._at };
}
function notifPush(kind, text, opt){
  opt = opt || {};
  /* وقتُ الفعل وفاعلُه — لا لحظةُ وصولِ الوثيقة وصاحبُ الجهاز: كانت إشعاراتُ
     يومٍ كاملٍ تُختَم بلحظة فتح التطبيق فتُقرأ كأنها وقعت في دقيقةٍ واحدة. */
  var n = { id:uid36(), kind:kind, text:String(text || ''),
            lv:opt.lv || 'عادي', to:opt.to || '', site:opt.site || '',
            by:opt.actor || STATE.meta.name || '', at:+opt.at || Date.now(), read:false };
  notifStore().unshift(n);
  if (notifStore().length > NOTIF_MAX) notifStore().length = NOTIF_MAX;
  CORE.saveSoon();
  logEvent('إشعار — ' + kind + ' · ' + n.text.slice(0, 60), n.site || '', n.by, n.at);
  if (NOTIF_LV[n.lv] >= 2) notifSystem(n);
  /* داخل التطبيق: بطاقةٌ عائمةٌ تُرى فورًا — كانت الإشعاراتُ تُخزَّن ويعدُّ الجرسُ
     وحدَه، فمن لم ينظر إلى الشريط لم يعلم بشيءٍ حتى يفتح الصفحة. */
  notifPop(n);
  syncBadge();
  if (CUR === 'notif') render(1);
  return n;
}
/* ═══ التحكّمُ في الإشعارات على هذا الجهاز (V20.8) ═══
   «إزّاي أوقف الإشعارات على الموبايل، أو علامة ✕ للنافذة المنبثقة؟» — كانت البطاقاتُ
   العائمةُ بلا زرِّ إغلاق، وتتكدّس فوق الشاشة حين تصل دفعةٌ بعد مزامنة. فصار:
   ✕ على كلِّ بطاقة، وما وصل دفعةً (أكثرُ من اثنين في ثلاث ثوانٍ) بطاقةٌ واحدةٌ تقول
   العدد، و«كتم ساعة» من البطاقة نفسِها، وفي «حسابي» إيقافُ النوافذ المنبثقة أو إشعاراتِ
   الجهاز أو كتمُها حتى الغد — لهذا الجهاز وحدَه، والجرسُ يبقى يعدّ كلَّ شيء. */
function npopMuted(){ return lsGet('nsk14.npop') === '0' || Date.now() < (+lsGet('nsk14.nmute') || 0); }
function nsysMuted(){ return lsGet('nsk14.nsys') === '0' || Date.now() < (+lsGet('nsk14.nmute') || 0); }
var NPOP_BURST = { at:0, n:0, el:null };
function notifSettingsCard(){
  var pop = lsGet('nsk14.npop') !== '0', sys = lsGet('nsk14.nsys') !== '0', mute = +lsGet('nsk14.nmute') || 0, muted = Date.now() < mute;
  return card('الإشعارات على هذا الجهاز',
    '<div class="actions">'
    + btn((pop ? '\u2713 ' : '') + t(pop ? 'النوافذ المنبثقة تعمل — أوقفها' : 'شغّل النوافذ المنبثقة'), pop ? 'btn-quiet' : 'btn-secondary', ' data-nset="npop"')
    + btn((sys ? '\u2713 ' : '') + t(sys ? 'إشعارات الجهاز تعمل — أوقفها' : 'شغّل إشعارات الجهاز'), sys ? 'btn-quiet' : 'btn-secondary', ' data-nset="nsys"')
    + (muted ? btn('\u{1F514} ' + t('ألغِ الكتم'), 'btn-secondary', ' data-nset="unmute"') : btn('\u{1F515} ' + t('كتمٌ حتى الغد'), 'btn-quiet', ' data-nset="tomorrow"'))
    + '</div>'
    + (muted ? '<p class="hint">' + esc(t('مكتومٌ حتى')) + ' ' + esc(fmtDT(mute)) + '</p>' : '')
    + '<p class="hint">' + esc(t('الجرسُ يعدّ كلَّ شيءٍ دائمًا — هذا يوقف الإزعاجَ لا الإشعارات. ولإيقافها من النظام نفسِه: آيفون ← الإعدادات ← الإشعارات ← «متابعة المشروع» ← أوقف «السماح بالإشعارات». أندرويد: اضغط مطوّلًا على الإشعار ← إيقاف.')) + '</p>');
}
var POP_T = 0;
function notifPop(n){
  if (!n || typeof document === 'undefined' || !document.body) return;
  if (npopMuted()) return;   /* (V20.8) */
  var wrap0 = document.getElementById('notifPop'), now0 = Date.now();
  /* دفعةٌ (أكثرُ من اثنين في ثلاث ثوانٍ): بطاقةٌ واحدةٌ بالعدد بدل كومةٍ تغطّي الشاشة */
  if (now0 - NPOP_BURST.at < 3000){ NPOP_BURST.n++; } else { NPOP_BURST = { at:now0, n:1, el:null }; }
  NPOP_BURST.at = now0;
  if (NPOP_BURST.n > 2 && wrap0){
    if (!NPOP_BURST.el || !NPOP_BURST.el.parentNode){
      while (wrap0.firstChild) wrap0.removeChild(wrap0.firstChild);
      NPOP_BURST.el = document.createElement('div'); NPOP_BURST.el.className = 'notif-pop'; NPOP_BURST.el.dir = 'auto';
      NPOP_BURST.el.style.cssText = 'background:var(--card,#161b22);border:1px solid var(--line,#2a2f36);border-inline-start:4px solid #E8C34B;border-radius:12px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.45);cursor:pointer;position:relative';
      wrap0.appendChild(NPOP_BURST.el);
      setTimeout(function(){ if (NPOP_BURST.el && NPOP_BURST.el.parentNode) NPOP_BURST.el.remove(); }, 9000);
    }
    NPOP_BURST.el.setAttribute('data-p', 'notif');   /* إلى صفحة الإشعارات — الجرسُ مخفيٌّ على الهاتف */
    NPOP_BURST.el.innerHTML = '<button type="button" class="npop-x" data-npopx="1" aria-label="' + esc(t('إغلاق')) + '">\u2715</button>'
      + '<div style="font-weight:700;font-size:13px">\u{1F514} ' + nm(NPOP_BURST.n) + ' ' + esc(t('إشعاراتٍ جديدة')) + '</div>'
      + '<div class="hint" style="margin:2px 0 0;font-size:12.5px">' + esc(t('اضغط لرؤيتها في الجرس')) + ' \u00b7 <a href="#" data-nmute="1">' + esc(t('كتم ساعة')) + '</a></div>';
    return;
  }
  var wrap = document.getElementById('notifPop');
  if (!wrap){
    wrap = document.createElement('div'); wrap.id = 'notifPop';
    wrap.style.cssText = 'position:fixed;top:56px;inset-inline-end:12px;z-index:150;display:flex;flex-direction:column;gap:8px;max-width:min(360px,92vw)';
    document.body.appendChild(wrap);
  }
  var lv = n.lv === 'عاجل' ? '#E05252' : (n.lv === 'مهم' ? '#E8C34B' : '#3B9BF5');
  var el = document.createElement('div');
  el.className = 'notif-pop'; el.dir = 'auto';
  el.setAttribute('data-npop', n.id);
  el.style.cssText = 'background:var(--card,#161b22);border:1px solid var(--line,#2a2f36);border-inline-start:4px solid ' + lv
    + ';border-radius:12px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.45);cursor:pointer;animation:npop .25s ease';
  el.style.position = 'relative';
  el.innerHTML = '<button type="button" class="npop-x" data-npopx="1" aria-label="' + esc(t('إغلاق')) + '">\u2715</button>'
    + '<div style="font-weight:700;font-size:13px;padding-inline-end:26px">' + esc(t(n.kind)) + '</div>'
    + '<div class="hint" style="margin:2px 0 0;font-size:12.5px">' + esc(n.text) + '</div>'
    + '<div class="hint" style="margin:4px 0 0;font-size:11.5px"><a href="#" data-nmute="1">' + esc(t('كتم ساعة')) + '</a></div>';
  wrap.appendChild(el);
  clearTimeout(POP_T);
  setTimeout(function(){ if (el.parentNode) el.remove(); }, 9000);
  while (wrap.children.length > 3) wrap.removeChild(wrap.firstChild);
}
/* ═══ نافذةُ الجرس ═══
   كان الجرسُ يذهب إلى صفحة الإشعارات — فيترك المستخدمُ ما كان فيه ليرى
   سطرًا. صار يفتح نافذةً تحته بآخر عشرة: كلٌّ يُضغَط فيذهب إلى فعله، و«قرأت
   الكل» و«كل الإشعارات» في أسفلها. تُغلَق بالضغط خارجها. */
var BELL_OPEN = false;
function bellHtml(){
  var L = notifMine().slice(0, 10);
  var rows = L.length ? L.map(function(n){
    var lv = n.lv === 'عاجل' ? '#E05252' : (n.lv === 'مهم' ? '#E8C34B' : '#3B9BF5');
    return '<div class="bell-row' + (n.read ? '' : ' un') + '" data-npop="' + esc(n.id) + '" style="border-inline-start:3px solid ' + lv + '">'
      + '<div style="font-weight:600;font-size:12.5px">' + esc(t(n.kind)) + ' <span class="hint num" style="margin:0;font-weight:400">' + esc(stepAgo(n.at)) + '</span></div>'
      + '<div class="hint" style="margin:2px 0 0;font-size:12px">' + esc(n.text.slice(0, 90)) + '</div></div>';
  }).join('') : '<p class="hint" style="padding:14px;text-align:center;margin:0">' + esc(t('لا إشعاراتٍ بعد.')) + '</p>';
  return '<div id="bellPop" class="bell-pop" dir="auto">'
    + '<div class="bell-head"><strong>\u{1F514} ' + esc(t('الإشعارات')) + '</strong>'
    + (notifUnread() ? ' <span class="pill warn">' + nm(notifUnread()) + ' ' + esc(t('غير مقروء')) + '</span>' : '') + '</div>'
    + '<div class="bell-list">' + rows + '</div>'
    + '<div class="actions" style="padding:8px 10px;margin:0;border-top:1px solid var(--line)">'
    + btn(t('علّم الكل مقروءًا'),'btn-quiet btn-sm',' data-nreadall="1"')
    + btn(t('كل الإشعارات'),'btn-secondary btn-sm',' data-p="notif" data-bellclose="1"')
    + '</div></div>';
}
function bellToggle(open){
  BELL_OPEN = (open === undefined) ? !BELL_OPEN : !!open;
  var old = document.getElementById('bellPop'); if (old) old.remove();
  if (!BELL_OPEN) return;
  var host = document.getElementById('syncMeta') || document.body;
  var d = document.createElement('div'); d.innerHTML = bellHtml();
  document.body.appendChild(d.firstChild);
}
function notifPopGo(id){
  var n = notifStore().filter(function(x){ return x.id === id; })[0];
  var el = document.querySelector('[data-npop="' + id + '"]'); if (el) el.remove();
  if (!n) return;
  n.read = true;
  if (n.site && n.kind === 'زيارة تمّت' && may('approve')){ SVA_ST = 'pending'; SVA_Q = n.site; SVA_PH = n.site; goPage('svappr'); render(1); return; }
  if (n.site && n.kind === 'تركيب تمّ' && may('approve')){ goPage('qa'); render(1); return; }
  if (n.kind === 'مهام الاجتماع'){ WT_F = 'late'; goPage('wtask'); render(1); return; }
  if (n.site){ DETAIL_ID = n.site; goPage('site'); render(1); return; }
  goPage('notif'); render(1);
}

/* إشعارُ النظام: يظهر خارج التطبيق. الإذنُ يُطلَب مرةً ولا يُلحَّ فيه. */
function notifCan(){
  return (typeof Notification !== 'undefined') && Notification.permission === 'granted';
}
function notifAsk(){
  if (typeof Notification === 'undefined'){ toast(t('هذا المتصفّح لا يدعم إشعارات النظام')); return; }
  if (Notification.permission === 'granted'){ toast(t('الإذنُ ممنوحٌ سلفًا')); return; }
  if (Notification.permission === 'denied'){
    toast(t('الإذنُ مرفوضٌ من إعدادات المتصفّح — يُفتَح من هناك')); return;
  }
  Notification.requestPermission().then(function(p){
    toast(t(p === 'granted' ? 'مُنح الإذن — ستصلك الإشعارات' : 'لم يُمنَح الإذن'));
    render(1);
  });
}
function notifSystem(n){
  if (!notifCan() || nsysMuted()) return;   /* (V20.8) أوقفه صاحبُ الجهاز أو كتمه */
  var body = n.text + (n.site ? ' · ' + n.site : '');
  try {
    /* عبر عامل الخدمة إن وُجد — فيظهر ولو كان التطبيقُ مغلقًا */
    if (SW_STATE && SW_STATE.reg && SW_STATE.reg.showNotification){
      SW_STATE.reg.showNotification('أفاقي — ' + n.kind, { body:body, tag:n.id, dir:'rtl', lang:'ar' });
      return;
    }
    new Notification('أفاقي — ' + n.kind, { body:body, dir:'rtl', lang:'ar' });
  } catch (e){}
}

/* رقمُ المرسَل إليه من سجل الفنيين — ولا يُعرَض لمن مُنع من الهواتف */
function notifPhone(name){
  var x = techsList().filter(function(y){ return y.n === name; })[0];
  return (x && x.ph) || '';
}
function notifMail(n){
  var sub = 'أفاقي — ' + n.kind;
  var body = n.text + (n.site ? '\nالموقع: ' + n.site : '')
           + '\nالوقت: ' + fmtDT(n.at)
           + '\nمن: ' + (n.by || '—');
  return 'mailto:?subject=' + encodeURIComponent(sub) + '&body=' + encodeURIComponent(body);
}

/* ═══ الإشعارُ يصل صاحبَه ═══════════════════════════════════════════════════
   كان يُخزَّن بحقل `to` ولا يُرشَّح عليه: فيرى الفنيُّ إشعاراتِ المشروع
   كلَّها — اعتماداتٍ لا تخصّه، ومشترياتٍ لا يراها أصلًا، وتصعيداتٍ لغيره.
   والصندوقُ الذي يمتلئ بما لا يعنيني أتوقّف عن قراءته، فيضيع فيه ما يعنيني.

   والفريقُ مجموعةُ أشخاص: ما يُسنَد إليه يصل كلَّ عضوٍ فيه. ومن أُسند إليه
   بالاسم يصل إليه وحدَه. */

/* فرقُ الشخص: ما هو عضوٌ فيه */
function myCrews(who){
  var out = [];
  var me = techsList().filter(function(x){ return x.n === who; })[0];
  if (me && me.crew) out.push(me.crew);
  crewsList().forEach(function(c){
    if ((c.members || []).indexOf(who) > -1 && out.indexOf(c.n) < 0) out.push(c.n);
  });
  return out;
}
/* هل يخصُّني هذا الإشعار؟ */
function notifForMe(n){
  var me = STATE.meta.name || '';
  if (!n.to) return true;                       /* بلا وجهة: للجميع */
  if (n.to === me) return true;                 /* باسمي */
  if (myCrews(me).indexOf(n.to) > -1) return true;  /* لفريقي */
  if (may('users')) return true;                /* من يدير الناسَ يرى الكلّ */
  return false;
}
function notifMine(){
  return notifStore().filter(notifForMe);
}
function notifUnread(){
  return notifMine().filter(function(n){ return !n.read; }).length;
}

/* ═══ الشحنات: التوريدُ يُتابَع لا يُنتظَر ═══════════════════════════════════
   التصنيعُ والشحنُ والتخليصُ تقع خارجَ النظام — لكنَّ حالتَها تُدخَل فيه.
   وبلا موعدٍ متوقَّعٍ لا يُعرَف المتأخّرُ إلا حين يُسأل عنه، وحينئذٍ يكون قد
   تأخّر أسبوعين. فيُكتَب المتوقَّعُ يومَ الشحن، ويُحسَب التأخّرُ بنفسه. */

var SHIP_ST = ['قيد التصنيع','شُحنت','في التخليص','وصلت المستودع','متأخرة'];
var SHIP_Q = '';

function shipList(){
  var S = STATE.ships || {};
  return Object.keys(S).map(function(k){ return S[k]; }).filter(Boolean)
    .sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
}
function shipSave(x){ STATE.ships = STATE.ships || {}; STATE.ships[x.id] = x; CORE.set('ships', x.id, x); statBump(); }
function shipLate(x){
  if (x.got || !x.eta) return 0;
  var d = Math.floor((Date.now() - new Date(x.eta + 'T12:00:00').getTime()) / 86400000);
  return d > 0 ? d : 0;
}
function shipAdd(){
  if (!may('inventory') && !may('money')){ toast(t('الشحناتُ للمشتريات والمستودع')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var ref = g('shRef');
  if (!ref){ toast(t('اكتب رقم الشحنة')); return; }
  if (shipList().some(function(x){ return x.ref === ref; })){ toast(t('رقمُ الشحنة موجودٌ بالفعل')); return; }
  shipSave({ id:'sh' + Date.now().toString(36), ref:ref, item:g('shItem'), qty:+g('shQty') || 0,
             sup:g('shSup'), st:g('shSt') || SHIP_ST[0], sent:g('shSent'), eta:g('shEta'),
             got:'', at:Date.now(), by:STATE.meta.name || '' });
  logEvent('شحنة جديدة — ' + ref);
  notifPush('توريد', 'شحنةٌ جديدة: ' + ref + ' — ' + (g('shItem') || '') + ' · ' + nm(+g('shQty') || 0),
            { lv:'عادي' });
  toast(t('سُجّلت الشحنة'));
  render(1);
}
function shipSet(id, patch){
  if (!may('inventory') && !may('money')){ toast(t('الشحناتُ للمشتريات والمستودع')); return; }
  var x = (STATE.ships || {})[id]; if (!x) return;
  Object.keys(patch).forEach(function(k){ x[k] = patch[k]; });
  /* وصلت: يُقفَل التأخّرُ ويُسجَّل اليومُ إن لم يُكتَب */
  if (patch.st === 'وصلت المستودع' && !x.got) x.got = todayISO();
  shipSave(x);
}
function shipDel(id){
  if (!may('inventory') && !may('money')){ toast(t('الشحناتُ للمشتريات والمستودع')); return; }
  var x = (STATE.ships || {})[id]; if (!x) return;
  if (x.got){ toast(t('شحنةٌ وصلت — لا تُحذَف، سجلُّها أثر')); return; }
  delete STATE.ships[id];
  CORE.set('ships', id, null);
  logEvent('حذف شحنة — ' + x.ref);
  toast(t('حُذفت')); statBump(); render(1);
}
/* ما تأخّر يُنبَّه عليه مرةً في اليوم */
function shipWatch(){
  shipList().forEach(function(x){
    var late = shipLate(x);
    if (!late) return;
    if (x.warned === todayISO()) return;
    x.warned = todayISO();
    shipSave(x);
    notifPush('توريد', 'شحنةٌ متأخرة: ' + x.ref + ' — ' + nm(late) + ' يومًا بعد الموعد المتوقَّع',
              { lv:'عاجل' });
  });
}


PAGE.ev = { m:'النظام', t:'السجلات والإشعارات',
  l:'ما جرى ومن فعله ومتى، وما أُرسل، وما ينتظر اعتمادًا.',
  body:function(){
    var head = tabHead('ev'), cur = tabCur('ev');
    if (cur === 'ev') return head + (function(){
    /* ما في اليد قليلٌ؟ يُجلَب السجلُّ مرةً — فلا تُقرأ الشاشةُ فارغةً وهي مليئة */
    if (evAll().length < 50) evFetch(false);
    var all = evAll(), L = evRows();
    /* ═══ القائمةُ كلُّ الحسابات لا من ظهر في المحمَّل (V17.32) ═══
       كانت تُبنى من الأحداث التي في اليد وحدَها، فسبعةَ عشرَ حسابًا تظهر
       منها خمسة — فيُظَنُّ أن الباقيَ محجوبٌ، وإنما لا حدثَ لهم في الخمسمئة
       المحمَّلة. صارت تعرض كلَّ حسابٍ يراه صاحبُ الشاشة ومعه عددُ أحداثه في
       المحمَّل — فيُعرَف الفرقُ بين «لم يعمل» و«لم يُنزَل عملُه». */
    var evN = {};
    all.forEach(function(e){ var b = evActor(e).name; if (b) evN[b] = (evN[b] || 0) + 1; });
    var users = [], seen = {};
    usersList().forEach(function(p){
      var nx = (p[1] || {}).name || '';
      if (nx && !seen[nx]){ seen[nx] = 1; users.push(nx); }
    });
    Object.keys(evN).forEach(function(b){ if (!seen[b]){ seen[b] = 1; users.push(b); } });
    users.sort(function(a, b){ return (evN[b] || 0) - (evN[a] || 0) || String(a).localeCompare(String(b)); });
    var kinds = {}; all.forEach(function(e){ var k = evKind(e.what); kinds[k] = (kinds[k]||0)+1; });
    var cats = {};  all.forEach(function(e){ var c = evCat(e.what); if (c) cats[c] = (cats[c]||0)+1; });

    return stats([['كل الأحداث', N(all.length), 'acc']]
                 .concat(EV_CATS.map(function(c){ return [c[0], N(cats[c[0]] || 0)]; })))

      + '<div class="chips">'
      + '<button type="button" class="chip' + (!EVF.cat ? ' on' : '') + '" data-evcat="">'
      +   esc(t('الكل')) + ' <span class="num">' + nm(all.length) + '</span></button>'
      + EV_CATS.map(function(c){
          return '<button type="button" class="chip' + (EVF.cat===c[0]?' on':'') + '" data-evcat="' + esc(c[0]) + '">'
            + esc(t(c[0])) + ' <span class="num">' + nm(cats[c[0]] || 0) + '</span></button>';
        }).join('')
      + '</div>'

      + card('تصفية',
        '<div class="grid cols-2">'
        + '<div class="field"><label>' + esc(t('نوع الحدث')) + '</label>'
        + '<select data-evf="kind"><option value="">— ' + esc(t('الكل')) + ' —</option>'
        + Object.keys(kinds).sort().map(function(k){
            return '<option value="' + esc(k) + '"' + (EVF.kind===k?' selected':'') + '>' + esc(t(k)) + '</option>'; }).join('')
        + '</select></div>'
        + '<div class="field"><label>' + esc(t('المستخدم')) + '</label>'
        + '<select data-evf="by"><option value="">— ' + esc(t('الكل')) + ' —</option>'
        + users.map(function(u){
            /* القيمةُ الاسمُ وحدَه — والعدَدُ نصٌّ للعين لا جزءٌ من المفتاح */
            return '<option value="' + esc(u) + '"' + (EVF.by===u?' selected':'') + '>'
              + esc(u) + ' (' + nm(evN[u] || 0) + ')</option>'; }).join('')
        + '</select></div>'
        + '<div class="field"><label>' + esc(t('من')) + '</label>'
        + '<input type="datetime-local" data-evf="from" value="' + esc(EVF.from) + '"></div>'
        + '<div class="field"><label>' + esc(t('إلى')) + '</label>'
        + '<input type="datetime-local" data-evf="to" value="' + esc(EVF.to) + '"></div>'
        + '</div>'
        + '<div class="field"><label>' + esc(t('بحث في نص الحدث')) + '</label>'
        + '<input type="search" data-evf="q" value="' + esc(EVF.q) + '" dir="auto"></div>'
        + '<div class="actions">'
        + btn('امسح التصفية','btn-quiet btn-sm',' data-evclr="1"')
        + btn('\u{1F5C3} ' + t('اجلب السجلَّ من القاعدة'),'btn-quiet btn-sm',' data-evfetch="1"')
        + ((EVF.from || EVF.to) ? btn('\u{1F4C5} ' + t('اجلب هذا المدى من القاعدة'),'btn-secondary btn-sm',' data-evrange="1"') : '')
        + (EV_MORE ? btn('\u23EC ' + t('أنزِل أقدمَ خمسمئة'),'btn-quiet btn-sm',' data-evolder="1"') : '')
        + btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="ev"')
        + '</div>')

      + cardFlush(t('الأحداث') + ' — ' + nm(L.length) + ' ' + t('من') + ' ' + nm(all.length),
          L.length
            ? table(['الوقت','النوع','الحدث','المستخدم'],
                capList(L, 300).map(function(e){
                  return ['<span class="num">' + esc(e.day || '') + ' ' + esc(e.at || '') + '</span>',
                          pill(t(evKind(e.what)), evPillKind(e.what)),
                          esc(e.what || ''),
                          /* الفاعلُ أوّلًا — من حقله أو من نصِّه — ومن سجّله تحته */
                          (function(){
                            var a = evActor(e);
                            return esc(dispName(a.name) || '—')
                              + (a.from === 'text'
                                  ? '<br><span class="hint" style="margin:0">' + esc(t('من نصّ الحدث')) + '</span>'
                                  : (e.rec && e.rec !== e.by
                                      ? '<br><span class="hint" style="margin:0">' + esc(t('سُجِّل على')) + ' ' + esc(dispName(e.rec)) + '</span>'
                                      : ''));
                          })()];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا أحداثَ تطابق التصفية.')) + '</p>')

      + (L.length > 300
          ? ''
          : '')
      + '<p class="hint">' + esc(t('في اليد')) + ' <b class="num">' + nm(evAll().length) + '</b> '
      +   esc(t('حدثًا من سجلِّ القاعدة')) + ' — '
      +   esc(EV_MORE ? t('وثمّةَ أقدمُ لم يُنزَل بعد: استعمل «أنزِل أقدمَ خمسمئة» أو حدِّد مدًى بالتاريخ واجلبه.')
                      : t('وهذا كلُّ ما في القاعدة ضمن هذا النطاق.')) + '</p>'
      + '<p class="hint">' + esc(t('الأثرُ لا يُمحى: قواعدُ القاعدة تمنع حذفَ سجل الأحداث على الجميع. والشرائحُ أعلاه عدسةُ الحوكمة — نفس السجل، لا سجلٌّ ثانٍ.')) + '</p>';
  })();
    if (cur === 'appr') return head + (function(){
    var co = coReqList(), fx = fixList().filter(function(f){ return f.status === 'مطلوب'; });
    var by = buyPend();
    var all = [].concat(
      co.map(function(x){ return { k:'co',  id:x.name, at:x.at, x:x }; }),
      fx.map(function(x){ return { k:'fix', id:x.id,   at:x.at, x:x }; }),
      by.map(function(x){ return { k:'buy', id:x.id,   at:x.at, x:x }; })
    ).sort(function(a,b){ return (a.at || 0) - (b.at || 0); });

    var oldest = all.length
      ? Math.max(0, Math.round((Date.now() - (all[0].at || Date.now())) / 86400000))
      : null;
    var cap = cfgGet('budApp') || 0;

    function row(it){
      var x = it.x, ttl, det;
      if (it.k === 'co'){ ttl = t('شركة مقترحة'); det = x.name; }
      else if (it.k === 'fix'){
        ttl = t('تصويب بيان');
        det = x.site + ' · ' + esc(t(x.field)) + ': «' + esc(x.was || '—') + '» → «' + esc(x.val) + '»';
      } else {
        ttl = t('مشترًى فوق الحد');
        det = x.item + ' · ' + nm(x.amt) + ' ' + t('ريال') + ' · ' + esc(x.sup || '');
      }
      var days = Math.max(0, Math.round((Date.now() - (x.at || Date.now())) / 86400000));
      return [pill(ttl, it.k === 'buy' ? 'wrn' : 'off'),
              det + (x.why ? '<br><span class="hint" style="margin:0">' + esc(x.why) + '</span>' : ''),
              esc(dispName(x.by) || '—'),
              '<span class="num">' + nm(days) + ' ' + esc(t('يوم')) + '</span>',
              may('approve')
                ? btn('اعتمد','btn-primary btn-sm',' data-apok="' + it.k + '|' + esc(it.id) + '"')
                  + btn('ردّ','btn-quiet btn-sm',' data-apno="' + it.k + '|' + esc(it.id) + '"')
                : '<span class="hint" style="margin:0">' + esc(t('للمهندس')) + '</span>'];
    }

    return stats([['شركات مقترحة', N(co.length), co.length ? 'wrn' : 'ok'],
                  ['تصويبات بيانات', N(fx.length), fx.length ? 'wrn' : 'ok'],
                  ['مشتريات فوق الحد', N(by.length), by.length ? 'wrn' : 'ok'],
                  ['أقدم مقترح', oldest === null ? '—' : (nm(oldest) + ' ' + t('يوم')),
                    oldest > 3 ? 'bad' : '']])

      + cardFlush(t('بانتظار الاعتماد') + ' — ' + nm(all.length),
          all.length
            ? table(['النوع','التفصيل','مَن اقترح','منذ','القرار'], all.map(row))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا مقترحات — تظهر هنا فور اقتراح شركةٍ جديدة أو تصويبِ بيانٍ أو تجاوزِ مشترًى حدَّ الاعتماد.'))
              + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="appr"') : '')

      + card('القاعدة', flow(['يقترح المشرف','يراجع المهندس','يُعتمد أو يُردّ'], 0)
        + '<div class="pop-rows" style="margin:12px 0 0">'
        + '<div><span class="k">' + esc(t('شركة جديدة')) + '</span><span>'
        +   esc(t('يقترحها الميدانُ عند تسجيل موقعٍ مقترح — والاعتمادُ يُدخلها القائمةَ الموحّدة.'))
        + '</span></div>'
        + '<div><span class="k">' + esc(t('تصويب بيان')) + '</span><span>'
        +   esc(t('يطلبه الفنيُّ من نموذج المسح حين يجد خلافَ المسجَّل — والاعتمادُ يُطبِّقه على السجل.'))
        + '</span></div>'
        + '<div><span class="k">' + esc(t('مشترًى فوق الحد')) + '</span><span>'
        +   esc(t('يُنشئه النظامُ تلقائيًّا حين يتجاوز المبلغُ حدَّ الاعتماد')) + ' — '
        +   (cap ? nm(cap) + ' ' + esc(t('ريال')) : esc(t('غير مضبوط')))
        +   ' — ' + esc(t('ويُضبَط في «الميزانية والاعتماد».'))
        + '</span></div>'
        + '</div>'
        + '<div class="actions" style="margin-top:12px">'
        + btn('اضبط حدَّ الاعتماد','btn-secondary btn-sm',' data-p="budget"')
        + '</div>'
        + '<p class="hint">' + esc(t('الطلبُ لا يُحذَف باعتمادٍ ولا بردّ — يبقى بمن قرّر ومتى ولماذا.')) + '</p>');
  })();
    return head + (function(){
    var L = notifMineQ(), un = notifUnread();
    var perm = (typeof Notification === 'undefined') ? 'غير مدعوم' : Notification.permission;

    return stats([['غير مقروء', N(un), un ? 'wrn' : 'ok'],
                  ['الكل', N(L.length)],
                  ['إشعارُ النظام', t(perm === 'granted' ? 'ممنوح'
                                    : perm === 'denied' ? 'مرفوض' : 'لم يُطلَب'),
                    perm === 'granted' ? 'ok' : 'wrn']])
      /* (V21.1) الإيقافُ والكتمُ هنا حيث يبحث عنهما الناس — لا في «حسابي» وحدَه */
      + notifSettingsCard()
      + card('قنوات الوصول',
          '<p class="hint" style="margin:0 0 11px">'
          + esc(t('الرسالةُ تُولَّد مرةً وتُرسَل بما يتاح: داخل التطبيق دائمًا، وإشعارُ النظام على اللاب والجوّال والويب بإذنٍ يُطلَب مرة، وواتساب أو بريدٌ لمن يُقصَد بعينه.'))
          + '</p>'
          + '<div class="actions">'
          + (perm === 'granted'
              ? btn('جرّب إشعار النظام','btn-secondary btn-sm',' data-ntest="1"')
              : btn('اسمح بإشعار النظام','btn-primary btn-sm',' data-nask="1"'))
          + (un ? btn('علّم الكل مقروءًا','btn-quiet btn-sm',' data-nread="*"') : '')
          + btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="notif"')
          + '</div>')

      + cardFlush('السجل',
          L.length
            ? '<div class="notif-rows">' + table(['الوقت','النوع','الرسالة','إلى','قنوات'],
                capList(L, 200).map(function(n){
                  var ph = notifPhone(n.to);
                  return ['<span class="num">' + esc(fmtDT2(n.at, { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })) + '</span>',
                          pill(t(n.kind), n.lv === 'عاجل' ? 'bad' : n.lv === 'مهم' ? 'wrn' : 'off'),
                          (n.read ? '' : '<b>') + esc(n.text) + (n.read ? '' : '</b>')
                            + (n.site ? '<br><span class="hint" style="margin:0">' + esc(n.site) + '</span>' : ''),
                          esc(n.to || '—'),
                          (ph && may('phones')
                            ? '<a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="'
                              + esc(waLink(ph, n.text)) + '" data-nwa="' + esc(n.id) + '">واتساب</a>' : '')
                          + '<a class="btn btn-quiet btn-sm" href="' + esc(notifMail(n)) + '" data-nmail="'
                            + esc(n.id) + '">بريد</a>'
                          + (n.read ? '' : btn('قرأت','btn-quiet btn-sm',' data-nread="' + esc(n.id) + '"'))
                          /* أبسطُ طريق: من الإشعار إلى الاعتماد على النقطة نفسِها بضغطة */
                          + (n.site && (n.kind === 'زيارة تمّت') && may('approve')
                              ? btn('\u2705 ' + t('راجع واعتمد'),'btn-primary btn-sm',' data-ngo="svappr" data-nsite="' + esc(n.site) + '" data-nid="' + esc(n.id) + '"') : '')
                          + (n.site && (n.kind === 'تركيب تمّ') && may('approve')
                              ? btn('\u{1F50E} ' + t('دقّق التركيب'),'btn-primary btn-sm',' data-ngo="qa" data-nsite="' + esc(n.site) + '" data-nid="' + esc(n.id) + '"') : '')
                          + (n.site && (n.kind === 'إسناد' || n.kind === 'اعتماد' || n.kind === 'تحتاج زيارة أخرى')
                              ? btn('\u25C8 ' + t('افتح النقطة'),'btn-secondary btn-sm',' data-site="' + esc(n.site) + '"') : '')];
                })) + '</div>'
            : '<p class="hint" style="padding:16px">' + esc(t('لا إشعاراتٍ بعد.')) + '</p>');
  })();
  }};

/* أسماءُ الأعمال التي تُسنَد — تُقرأ في السيارات والمهامّ معًا */
var ASN_LABEL = { srv:'زيارة', ins:'تركيب', dis:'فك', buy:'مشتريات', prep:'تهيئة', asm:'تجميع' };
function todayISO(){ return dayKey(); }
function msDay(ms){ return ms ? dayKey(+ms) : '—'; }

/* ═══ السياراتُ: عهدةٌ متحرّكةٌ لها سجلٌّ كسجلّ الأجهزة ═══════════════════
   الفريقُ الميدانيُّ لا يعمل بلا سيارتين: واحدةٌ تحمل العدّةَ وأخرى ينتقل
   بها الناس. وكان التوزيعُ يُحسَب بعدد الفنيين وحدَهم — فيُسنَد إلى فريقٍ
   عملُ يومٍ كاملٍ وسيارتُه في الورشة، فلا يصل ولا يُعرَف لماذا تأخّر.

   فالسيارةُ مسنَدةٌ كالفنيّ: لها نوعٌ ولوحةٌ ورخصةٌ تنتهي، وتُسنَد إلى شخصٍ
   أو فريقٍ لنشاطٍ بعينه، وتُحسَب تكلفتُها في مصروف المشروع من يوم تشغيلها. */

var VEH_KINDS_SEED = [
  { id:'pickup', n:'بيك أب — للعدّة', d:'تحمل العدّةَ والقطعَ إلى الموقع', cap:2 },
  { id:'sedan',  n:'سيدان — للتنقّل', d:'ينتقل بها الفريقُ بين النقاط',   cap:4 },
  { id:'van',    n:'فان',             d:'فريقٌ كاملٌ وعدّتُه معًا',        cap:7 },
  { id:'truck',  n:'شاحنة',           d:'نقلُ توريدٍ ثقيلٍ إلى المستودع',  cap:2 }
];
var VEH_STATUS = ['متاحة','مُسندة','في الورشة','خارج الخدمة'];
var VEH_OWN    = ['ملك','مستأجرة'];
var VEH_Q = '', VEH_EDIT = '';

function vehKinds(){
  if (!Array.isArray(STATE.vehKinds) || !STATE.vehKinds.length)
    STATE.vehKinds = VEH_KINDS_SEED.map(function(k){ return Object.assign({}, k); });
  return STATE.vehKinds;
}
function vehKindName(id){
  var k = vehKinds().filter(function(x){ return x.id === id; })[0];
  return (k && k.n) || id || '—';
}
function vehList(){
  var V = STATE.vehicles || {};
  return Object.keys(V).map(function(k){ return V[k]; }).filter(Boolean)
    .sort(function(a, b){ return String(a.plate || '').localeCompare(String(b.plate || ''), 'ar'); });
}
function vehOf(id){ return (STATE.vehicles || {})[id] || null; }

/* الإسناد: سيارةٌ لشخصٍ أو فريقٍ لنشاطٍ بعينه. والسيارةُ المسنَدةُ لا تُسنَد
   ثانيةً في الوقت نفسِه — وإلا وقف فريقٌ ينتظر ما أُخذ منه. */
function vehAsnList(){
  var A = STATE.vehAsn || {};
  return Object.keys(A).map(function(k){ return A[k]; })
    .filter(function(x){ return x && !x.end; });
}
function vehAsnOf(vid){
  return vehAsnList().filter(function(a){ return a.veh === vid; })[0] || null;
}
function vehOfWho(who){
  return vehAsnList().filter(function(a){ return a.to === who; });
}

function vehSave(v){
  if (!STATE.vehicles) STATE.vehicles = {};
  STATE.vehicles[v.id] = v;
  CORE.set('vehicles', v.id, v);
  statBump();
}
function vehSet(id, patch){
  if (!may('fleet') && !may('settings')){ toast(t('السياراتُ للمهندس والمشتريات')); return; }
  var v = vehOf(id); if (!v) return;
  Object.keys(patch).forEach(function(k){ v[k] = patch[k]; });
  vehSave(v);
}
function vehAdd(){
  if (!may('fleet') && !may('settings')){ toast(t('السياراتُ للمهندس والمشتريات')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var plate = g('vhPlate');
  if (!plate){ toast(t('اكتب رقم اللوحة')); return; }
  if (vehList().some(function(x){ return x.plate === plate; })){ toast(t('اللوحةُ مسجَّلةٌ بالفعل')); return; }
  var id = 'vh' + Date.now().toString(36);
  vehSave({ id:id, plate:plate, kind:g('vhKind') || 'sedan', model:g('vhModel'),
            year:g('vhYear'), lic:g('vhLic'), licExp:g('vhLicExp'), insExp:g('vhInsExp'),
            own:g('vhOwn') || 'ملك', cost:+g('vhCost') || 0, start:g('vhStart') || todayISO(),
            st:'متاحة', note:'', at:Date.now(), by:STATE.meta.name || '' });
  logEvent('سيارة جديدة — ' + plate + ' · ' + vehKindName(g('vhKind')));
  toast(t('أُضيفت السيارة'));
  render(1);
}
function vehDel(id){
  if (!may('fleet') && !may('settings')){ toast(t('السياراتُ للمهندس والمشتريات')); return; }
  var v = vehOf(id); if (!v) return;
  if (vehAsnOf(id)){ toast(t('مُسنَدةٌ الآن — أنهِ الإسنادَ أولًا')); return; }
  delete STATE.vehicles[id];
  CORE.set('vehicles', id, null);
  logEvent('حذف سيارة — ' + v.plate);
  toast(t('حُذفت'));
  statBump(); render(1);
}

function vehAsnAdd(){
  if (!may('fleet') && !may('settings')){ toast(t('الإسنادُ للمهندس والمشتريات')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var vid = g('vaVeh'), who = g('vaTo'), kind = g('vaKind');
  if (!vid){ toast(t('اختر السيارة')); return; }
  if (!who){ toast(t('اختر من تُسنَد إليه')); return; }
  var vv = vehOf(vid);
  if (vv && kind && !vehFits(vv.kind, kind)){
    /* لا يُمنَع — قد لا يجد غيرَها — لكن يُقال ويبقى في السجل */
    toast(t('تنبيه: ') + vehKindName(vv.kind) + ' ' + t('لا تناسب') + ' ' + t(ASN_LABEL[kind] || kind));
  }
  var cur = vehAsnOf(vid);
  if (cur){ toast(t('مُسنَدةٌ إلى') + ' ' + cur.to + ' — ' + t('أنهِ الإسنادَ أولًا')); return; }
  var id = 'va' + Date.now().toString(36);
  if (!STATE.vehAsn) STATE.vehAsn = {};
  STATE.vehAsn[id] = { id:id, veh:vid, to:who, kind:kind || 'srv',
                       at:Date.now(), by:STATE.meta.name || '', end:0 };
  CORE.set('vehAsn', id, STATE.vehAsn[id]);
  vehSet(vid, { st:'مُسندة' });
  var v = vehOf(vid);
  logEvent('إسناد سيارة — ' + v.plate + ' → ' + who + ' · ' + kind);
  notifPush('سيارة', 'أُسندت إليك سيارة ' + v.plate + ' — ' + vehKindName(v.kind),
            { to:who, lv:'عادي' });
  toast(t('أُسندت السيارة'));
  render(1);
}
function vehAsnEnd(id){
  if (!may('fleet') && !may('settings')){ toast(t('الإسنادُ للمهندس والمشتريات')); return; }
  var a = (STATE.vehAsn || {})[id]; if (!a) return;
  a.end = Date.now();
  CORE.set('vehAsn', id, a);
  vehSet(a.veh, { st:'متاحة' });
  var v = vehOf(a.veh);
  logEvent('إنهاء إسناد سيارة — ' + (v ? v.plate : a.veh) + ' · كان مع ' + a.to);
  toast(t('أُنهي الإسناد'));
  render(1);
}

/* التقرير: كم متاحةٌ وكم مسنَدةٌ وكم ينقص — وينقص كم بالضبط */
function vehNeed(){
  var crews = (typeof crewsList === 'function') ? crewsList() : [];
  /* كلُّ فريقٍ ميدانيٍّ يحتاج اثنتين: واحدةٌ للعدّة وأخرى للتنقّل */
  var field = crews.filter(function(c){ return c.id !== 'eng'; });
  var want = field.length * 2;
  var have = vehList().filter(function(v){ return v.st !== 'خارج الخدمة'; }).length;
  return { crews:field.length, want:want, have:have, gap:Math.max(0, want - have) };
}
function vehExpiring(days){
  days = days || 30;
  var lim = Date.now() + days * 86400000;
  return vehList().filter(function(v){
    var a = v.licExp ? Date.parse(v.licExp) : 0;
    var b = v.insExp ? Date.parse(v.insExp) : 0;
    return (a && a < lim) || (b && b < lim);
  });
}
function vehCost(){
  return vehList().reduce(function(a, v){ return a + (+v.cost || 0); }, 0);
}


PAGE.fleet = { m:'الميدان', t:'السيارات',
  l:'أسطولُ المشروع كلُّه في شاشةٍ واحدة — الأسطولُ وإسنادُه وعُهدتُه وتكلفتُه وسيارتُك.',
  body:function(){
    var head = tabHead('fleet'), cur = tabCur('fleet');
    if (cur === 'fleetAsn') return head + (function(){
    var A = vehAsnList(), free = vehList().filter(function(v){ return v.st === 'متاحة'; });
    var people = techsList().map(function(x){ return x.n; });
    var crews = crewsList().map(function(c){ return c.n; });

    return stats([['إسناداتٌ قائمة', N(A.length)],
                  ['سياراتٌ متاحة', N(free.length), free.length ? 'ok' : 'wrn'],
                  ['فرقٌ بلا سيارة',
                    N(crews.filter(function(c){ return !vehOfWho(c).length; }).length), 'wrn']])

      + ((may('fleet') || may('settings'))
        ? card('إسنادٌ جديد',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('السيارة')) + ' <span class="req">*</span></label>'
            +   '<select id="vaVeh"><option value="">— ' + esc(t('اختر')) + ' —</option>'
            +   free.map(function(v){
                  return '<option value="' + esc(v.id) + '">' + esc(v.plate) + ' — '
                    + esc(vehKindName(v.kind)) + '</option>'; }).join('')
            +   '</select></div>'
            + '<div class="field"><label>' + esc(t('إلى')) + ' <span class="req">*</span></label>'
            +   '<select id="vaTo"><option value="">— ' + esc(t('اختر')) + ' —</option>'
            +   '<optgroup label="' + esc(t('فرق')) + '">'
            +     crews.map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('')
            +   '</optgroup>'
            +   '<optgroup label="' + esc(t('أشخاص')) + '">'
            +     people.map(function(p){ return '<option>' + esc(p) + '</option>'; }).join('')
            +   '</optgroup></select></div>'
            + '<div class="field"><label>' + esc(t('لأيِّ عمل')) + '</label><select id="vaKind">'
            +   Object.keys(ASN_LABEL).map(function(k){
                  return '<option value="' + esc(k) + '">' + esc(t(ASN_LABEL[k])) + '</option>'; }).join('')
            +   '</select></div>'
            + '</div>',
            btn('➕ أسنِد','btn-primary btn-sm',' data-vaadd="1"'))
        : '')

      + cardFlush(t('الإسنادات القائمة') + ' — ' + nm(A.length),
          A.length
            ? table(['السيارة','النوع','إلى','العمل','منذ',''],
                A.map(function(a){
                  var v = vehOf(a.veh) || { plate:a.veh, kind:'' };
                  var days = Math.max(0, Math.round((Date.now() - (a.at || Date.now())) / 86400000));
                  return ['<span class="num">' + esc(v.plate) + '</span>',
                          esc(vehKindName(v.kind)), esc(a.to),
                          pill(t(ASN_LABEL[a.kind] || a.kind), 'off'),
                          '<span class="num">' + nm(days) + ' ' + esc(t('يوم')) + '</span>',
                          (may('fleet') || may('settings'))
                            ? btn('أنهِ','btn-quiet btn-sm',' data-vaend="' + esc(a.id) + '"') : ''];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا إسناداتٍ قائمة.')) + '</p>')

      + '<p class="hint">' + esc(t('السيارةُ الواحدةُ لا تُسنَد مرتين في وقتٍ واحد — وإلا وقف فريقٌ ينتظر ما أُخذ منه.')) + '</p>';
  })();
    if (cur === 'fleetLog') return head + (function(){
    var all = vehAsnAll().slice().sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
    var mis = vehMismatch();
    var dayMs = VLOG_D ? new Date(VLOG_D + 'T12:00:00').getTime() : 0;
    var onDay = dayMs ? vehOnDay(dayMs) : [];
    var shown = all.filter(function(a){
      if (!VLOG_Q) return true;
      var v = vehOf(a.veh);
      return ((v ? v.plate : '') + ' ' + a.to).indexOf(VLOG_Q) > -1;
    });

    return stats([['إسناداتٌ في السجل', N(all.length)],
                  ['جاريةٌ الآن', N(all.filter(function(a){ return !a.end; }).length), 'acc'],
                  ['منتهية', N(all.filter(function(a){ return a.end; }).length)],
                  ['سيارةٌ لا تناسب عملَها', N(mis.length), mis.length ? 'bad' : 'ok']])

      + (mis.length
        ? alertBox('warn', 'سيارةٌ لا تناسب عملَها: '
            + mis.map(function(a){
                var v = vehOf(a.veh);
                return (v ? v.plate : a.veh) + ' — ' + vehKindName(v ? v.kind : '')
                  + ' مع ' + a.to + ' في ' + t(ASN_LABEL[a.kind] || a.kind);
              }).join(' · ')
            + '. العدّةُ تحتاج بيك أب أو فان، والتنقّلُ سيدان — ومن معه سيدانٌ وحدَه لا يحمل عدّتَه فيقف في الموقع بلا قطع.')
        : '')

      + card('من كانت معه سيارةٌ في يومٍ بعينه',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('التاريخ')) + '</label>'
          +   '<input type="date" id="vlD" data-vlgd="1" value="' + esc(VLOG_D) + '"></div>'
          + '<div class="field"><label>' + esc(t('بحث بلوحةٍ أو اسم')) + '</label>'
          +   '<input type="search" id="vlQ" data-vlgq="1" value="' + esc(VLOG_Q) + '" dir="auto"></div>'
          + '</div>'
          + (VLOG_D
            ? (onDay.length
              ? table(['اللوحة','النوع','كانت مع','العمل','من','إلى'],
                  onDay.map(function(x){
                    return ['<span class="num">' + esc(x.veh.plate) + '</span>',
                            esc(vehKindName(x.veh.kind)),
                            '<strong>' + esc(x.asn.to) + '</strong>',
                            esc(t(ASN_LABEL[x.asn.kind] || x.asn.kind || '—')),
                            '<span class="num">' + esc(msDay(x.asn.at)) + '</span>',
                            x.asn.end ? '<span class="num">' + esc(msDay(x.asn.end)) + '</span>'
                                      : pill(t('جارٍ'), 'ok')];
                  }))
              : '<p class="hint" style="padding:14px 0;margin:0">'
                + esc(t('لا سيارةَ كانت مُسنَدةً في هذا اليوم.')) + '</p>')
            : '<p class="hint" style="margin:11px 0 0">'
              + esc(t('اختر يومًا — تظهر كلُّ سيارةٍ كانت مُسنَدةً فيه ومن كانت معه.')) + '</p>'))

      + cardFlush(t('السجل كلُّه') + ' — ' + nm(shown.length),
          shown.length
            ? table(['اللوحة','النوع','إلى','العمل','من','إلى','المدة',''],
                capList(shown, 200).map(function(a){
                  var v = vehOf(a.veh);
                  var days = Math.max(1, Math.round(((a.end || Date.now()) - (a.at || Date.now())) / 86400000));
                  var fit = v && a.kind ? vehFits(v.kind, a.kind) : true;
                  return ['<span class="num">' + esc(v ? v.plate : a.veh) + '</span>',
                          esc(v ? vehKindName(v.kind) : '—'),
                          esc(a.to),
                          esc(t(ASN_LABEL[a.kind] || a.kind || '—')),
                          '<span class="num">' + esc(msDay(a.at)) + '</span>',
                          a.end ? '<span class="num">' + esc(msDay(a.end)) + '</span>' : pill(t('جارٍ'), 'ok'),
                          '<span class="num">' + nm(days) + ' ' + esc(t('يوم')) + '</span>',
                          fit ? '' : pill(t('لا تناسب'), 'bad')];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا إسناداتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="fleetLog"') : '')

      + '<p class="hint">' + esc(t('السجلُّ لا يُمحى: من أُنهي إسنادُه يبقى فيه بتاريخيه — فالمخالفةُ تأتي بعد شهرٍ بتاريخِ يومٍ مضى، ومن معه السيارةُ اليومَ لم يكن فيها يومَها.')) + '</p>';
  })();
    if (cur === 'fleetCost') return head + (function(){
    var L = vehList(), tot = vehCost();
    var byKind = {};
    L.forEach(function(v){ byKind[v.kind] = (byKind[v.kind] || 0) + (+v.cost || 0); });
    return stats([['سيارات', N(L.length)],
                  ['التكلفة الشهرية', N(tot)],
                  ['ملك', N(L.filter(function(v){ return v.own === 'ملك'; }).length)],
                  ['مستأجرة', N(L.filter(function(v){ return v.own === 'مستأجرة'; }).length), 'acc']])
      + cardFlush('حسب النوع',
          table(['النوع','عدد','التكلفة الشهرية'],
            vehKinds().map(function(k){
              return [esc(k.n), N(L.filter(function(v){ return v.kind === k.id; }).length),
                      N(byKind[k.id] || 0)];
            }), ['الإجمالي', N(L.length), N(tot)]))
      + cardFlush('التفصيل',
          L.length
            ? table(['اللوحة','النوع','الملكية','من تاريخ','أشهر','الشهرية','التراكمي'],
                L.map(function(v){
                  var mo = v.start
                    ? Math.max(1, Math.round((Date.now() - Date.parse(v.start)) / 2592000000)) : 1;
                  return ['<span class="num">' + esc(v.plate) + '</span>',
                          esc(vehKindName(v.kind)), esc(t(v.own || 'ملك')),
                          '<span class="num">' + esc(v.start || '—') + '</span>',
                          N(mo), N(+v.cost || 0), '<b>' + N((+v.cost || 0) * mo) + '</b>'];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا سياراتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="fleetCost"') : '')
      + '<p class="hint">' + esc(t('التراكميُّ يُحسَب من تاريخ التشغيل إلى اليوم — فما استُؤجر شهرًا لا يُحمَّل كما يُحمَّل ما عمل موسمًا.')) + '</p>';
  })();
    if (cur === 'myveh') return head + (function(){
    var me = STATE.meta.name || '';
    var mine = vehOfWho(me);
    var crew = (techsList().filter(function(x){ return x.n === me; })[0] || {}).crew || '';
    if (crew) mine = mine.concat(vehOfWho(crew));
    if (!mine.length)
      return card('', '<p class="hint" style="text-align:center;margin:0">'
        + esc(t('لا سيارةَ مُسنَدةً إليك الآن.')) + '</p>');
    return mine.map(function(a){
      var v = vehOf(a.veh) || {};
      return card(v.plate || '—',
        '<div class="pop-rows" style="margin:0">'
        + '<div><span class="k">' + esc(t('النوع')) + '</span><span>' + esc(vehKindName(v.kind)) + '</span></div>'
        + '<div><span class="k">' + esc(t('الموديل')) + '</span><span>' + esc(v.model || '—') + '</span></div>'
        + '<div><span class="k">' + esc(t('لأيِّ عمل')) + '</span><span>'
        +   esc(t(ASN_LABEL[a.kind] || a.kind)) + '</span></div>'
        + '<div><span class="k">' + esc(t('انتهاء الرخصة')) + '</span><span class="num">'
        +   esc(v.licExp || '—') + '</span></div>'
        + '</div>');
    }).join('');
  })();
    return head + (function(){
    var L = vehList().filter(function(v){
      if (!VEH_Q) return true;
      return (v.plate + ' ' + (v.model || '') + ' ' + vehKindName(v.kind)).indexOf(VEH_Q) > -1;
    });
    var need = vehNeed(), exp = vehExpiring(30);
    var byKind = {};
    vehList().forEach(function(v){ byKind[v.kind] = (byKind[v.kind] || 0) + 1; });

    return stats([['في الأسطول', N(vehList().length)],
                  ['متاحة', N(vehList().filter(function(v){ return v.st === 'متاحة'; }).length), 'ok'],
                  ['مُسندة', N(vehList().filter(function(v){ return v.st === 'مُسندة'; }).length), 'acc'],
                  ['نقصٌ عن الحاجة', N(need.gap), need.gap ? 'bad' : 'ok']])

      + (need.gap
        ? alertBox('warn', 'الفرقُ الميدانيةُ ' + nm(need.crews) + ' وتحتاج ' + nm(need.want)
            + ' سيارةً — المتاحُ ' + nm(need.have) + '، فالنقصُ ' + nm(need.gap)
            + '. سجّل طلبَ شراءٍ أو استئجار.')
        : '')
      + (exp.length
        ? alertBox('warn', nm(exp.length) + ' سيارةً رخصتُها أو تأمينُها ينتهي خلال شهر: '
            + exp.slice(0, 4).map(function(v){ return v.plate; }).join('، '))
        : '')

      + card('الأسطول حسب النوع',
          '<div class="chips" style="margin:0">'
          + vehKinds().map(function(k){
              return '<span class="cat">' + esc(t(k.n)) + ' <span class="n">'
                + nm(byKind[k.id] || 0) + '</span></span>';
            }).join('')
          + '</div>')

      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="vhQ" data-vhq="1" value="' + esc(VEH_Q) + '" placeholder="'
      +     esc(t('ابحث باللوحة أو الموديل أو النوع')) + '" dir="auto">'
      + '</form>'

      + cardFlush(t('السيارات') + ' — ' + nm(L.length),
          L.length
            ? table(['اللوحة','النوع','الموديل','الملكية','انتهاء الرخصة','الحالة','مع مَن',''],
                L.map(function(v){
                  var a = vehAsnOf(v.id);
                  var late = v.licExp && Date.parse(v.licExp) < Date.now() + 2592000000;
                  return ['<input value="' + esc(v.plate) + '" data-vhp="' + esc(v.id) + '" dir="ltr">',
                          '<select data-vhk="' + esc(v.id) + '">'
                            + vehKinds().map(function(k){
                                return '<option value="' + esc(k.id) + '"' + (v.kind === k.id ? ' selected' : '')
                                  + '>' + esc(t(k.n)) + '</option>'; }).join('') + '</select>',
                          '<input value="' + esc(v.model || '') + '" data-vhm="' + esc(v.id) + '" dir="auto">',
                          esc(t(v.own || 'ملك')),
                          '<input type="date" value="' + esc(v.licExp || '') + '" data-vhe="' + esc(v.id) + '"'
                            + (late ? ' style="border-color:var(--danger)"' : '') + '>',
                          pill(t(v.st || 'متاحة'), v.st === 'متاحة' ? 'ok'
                                : v.st === 'مُسندة' ? 'acc' : 'warn'),
                          a ? esc(a.to) + '<br><span class="hint" style="margin:0">'
                              + esc(t(ASN_LABEL[a.kind] || a.kind)) + '</span>' : '—',
                          (may('fleet') || may('settings'))
                            ? (a ? btn('أنهِ الإسناد','btn-quiet btn-sm',' data-vaend="' + esc(a.id) + '"')
                                 : btn('حذف','btn-quiet btn-sm',' data-vhdel="' + esc(v.id) + '"'))
                            : ''];
                }))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا سياراتٍ بعد — أضِفها أدناه أو استوردها من «التصدير والاستيراد».')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="fleet"') : '')

      + ((may('fleet') || may('settings'))
        ? card('إضافة سيارة',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('رقم اللوحة')) + ' <span class="req">*</span></label>'
            +   '<input id="vhPlate" dir="ltr" placeholder="ABC 1234"></div>'
            + '<div class="field"><label>' + esc(t('النوع')) + '</label><select id="vhKind">'
            +   vehKinds().map(function(k){ return '<option value="' + esc(k.id) + '">' + esc(t(k.n)) + '</option>'; }).join('')
            +   '</select></div>'
            + '<div class="field"><label>' + esc(t('الموديل')) + '</label><input id="vhModel" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('سنة الصنع')) + '</label><input id="vhYear" type="number" min="1990"></div>'
            + '<div class="field"><label>' + esc(t('رقم الرخصة')) + '</label><input id="vhLic" dir="ltr"></div>'
            + '<div class="field"><label>' + esc(t('انتهاء الرخصة')) + '</label><input id="vhLicExp" type="date"></div>'
            + '<div class="field"><label>' + esc(t('انتهاء التأمين')) + '</label><input id="vhInsExp" type="date"></div>'
            + '<div class="field"><label>' + esc(t('الملكية')) + '</label><select id="vhOwn">'
            +   VEH_OWN.map(function(o){ return '<option value="' + esc(o) + '">' + esc(t(o)) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('التكلفة الشهرية')) + '</label><input id="vhCost" type="number" min="0"></div>'
            + '<div class="field"><label>' + esc(t('من تاريخ')) + '</label><input id="vhStart" type="date" value="' + esc(todayISO()) + '"></div>'
            + '</div>',
            btn('➕ إضافة سيارة','btn-primary btn-sm',' data-vhadd="1"'))
        : '')

      + '<p class="hint">' + esc(t('اللوحةُ لا تتكرّر. والسيارةُ المسنَدةُ لا تُحذَف — يُنهى إسنادُها أولًا، فيبقى في السجل من كانت معه ومتى.')) + '</p>';
  })();
  }};

/* ═══ سجلُّ عهدة السيارات ═══════════════════════════════════════════════════
   الإسنادُ الجاري يُعرَف: من معه أيُّ سيارةٍ الآن. لكنَّ المخالفةَ تأتي بعد
   شهرٍ بتاريخِ يومٍ مضى — «هذه اللوحةُ في الثاني عشر من الشهر». ومن أنهى
   إسنادَه يومَها لم يعد في القائمة، فيُسأل من معه السيارةُ اليومَ عن يومٍ لم
   يكن فيها.

   فيُقرأ السجلُّ كلُّه — الجاري والمنتهي — ويُسأل بتاريخ: من كانت معه هذه
   السيارةُ في ذلك اليوم؟ */

function vehAsnAll(){
  var A = STATE.vehAsn || {};
  return Object.keys(A).map(function(k){ return A[k]; }).filter(Boolean);
}
/* من كانت معه سيارةٌ بعينها في يومٍ بعينه */
function vehHolderOn(vid, ms){
  var hit = null;
  vehAsnAll().forEach(function(a){
    if (a.veh !== vid) return;
    var from = +a.at || 0, to = +a.end || Infinity;
    if (ms >= from && ms <= to) hit = a;
  });
  return hit;
}
/* كلُّ ما كان مُسنَدًا في يومٍ بعينه — لكلِّ سيارات الأسطول */
function vehOnDay(ms){
  return vehList().map(function(v){
    var a = vehHolderOn(v.id, ms);
    return { veh:v, asn:a };
  }).filter(function(x){ return x.asn; });
}

/* ملاءمةُ النوع للعمل: العدّةُ تحتاج بيك أب، والتنقّلُ سيدان، والتوريدُ شاحنة.
   والفريقُ الذي معه سيدانٌ وحدَه لا يحمل عدّتَه — فيقف في الموقع بلا قطع. */
var VEH_FIT = {
  ins:  ['pickup','van','truck'],
  dis:  ['pickup','van','truck'],
  prep: ['pickup','van'],
  asm:  ['pickup','van'],
  srv:  ['sedan','van','pickup'],
  buy:  ['pickup','truck','sedan','van']
};
function vehFits(kindVeh, kindWork){
  var ok = VEH_FIT[kindWork];
  return !ok || ok.indexOf(kindVeh) > -1;
}
function vehMismatch(){
  return vehAsnList().filter(function(a){
    var v = vehOf(a.veh);
    return v && a.kind && !vehFits(v.kind, a.kind);
  });
}

var VLOG_D = '', VLOG_Q = '';

/* ═══ تصديرُ ملف المتابعة بقالبه ═══════════════════════════════════════════
   الملفُّ يحسب نفسَه بنفسه: الحالةُ والموقفُ الزمنيُّ والمتبقي والزمنُ المنقضي
   كلُّها معادلاتٌ في القالب. والوحيدُ المكتوبُ بيدٍ هو **نسبةُ الإنجاز** في
   الصفوف الطرفية — فلا يُكتَب غيرُها، ويعيد إكسل حسابَ الباقي عند الفتح.

   ولا يُعاد بناءُ الملف: يُفكُّ القالبُ ويُستبدَل رقمٌ داخلَ خليةٍ قائمة،
   ثم يُعاد كما هو. فالتنسيقُ الشرطيُّ والتعليقاتُ والألوانُ والمعادلاتُ تبقى
   بايتًا ببايت — وإعادةُ البناء تُضيّعها ولو بدت الأرقامُ صحيحة. */

/* الصفُّ الطرفيُّ: نطاقٌ × مرحلة. الأرقامُ من قراءة القالب نفسِه. */
var FUP_ROWS = [
  /* [صفّ, مشعر, نوع, مرحلة] */
  [73,'منى','مخيم','sv'],   [74,'منى','مخيم','asn'], [75,'منى','مخيم','ins'],
  [76,'منى','مخيم','ip'],   [77,'منى','مخيم','ok'],
  [79,'عرفات','مخيم','sv'], [80,'عرفات','مخيم','asn'],[81,'عرفات','مخيم','ins'],
  [82,'عرفات','مخيم','ip'], [83,'عرفات','مخيم','ok'],
  [85,'منى','ممر','sv'],    [86,'منى','ممر','asn'],   [87,'منى','ممر','ins'],
  [88,'منى','ممر','ip'],    [89,'منى','ممر','ok'],
  [91,'عرفات','ممر','sv'],  [92,'عرفات','ممر','asn'], [93,'عرفات','ممر','ins'],
  [94,'عرفات','ممر','ip'],  [95,'عرفات','ممر','ok'],
  [97,'منى','جسر','sv'],    [98,'منى','جسر','asn'],   [99,'منى','جسر','ins'],
  [100,'منى','جسر','ip'],   [101,'منى','جسر','ok'],
  [103,'منى','محطة','sv'],  [104,'منى','محطة','asn'], [105,'منى','محطة','ins'],
  [106,'منى','محطة','ip'],  [107,'منى','محطة','ok'],
  [109,'عرفات','محطة','sv'],[110,'عرفات','محطة','asn'],[111,'عرفات','محطة','ins'],
  [112,'عرفات','محطة','ip'],[113,'عرفات','محطة','ok'],
  [115,'عرفات','بوابة','sv'],[116,'عرفات','بوابة','asn'],[117,'عرفات','بوابة','ins'],
  [118,'عرفات','بوابة','ip'],[119,'عرفات','بوابة','ok'],
  [127,'منى','كاميرا','sv','تفعيل كاميرا قائمة'],[128,'منى','كاميرا','asn','تفعيل كاميرا قائمة'],[129,'منى','كاميرا','ins','تفعيل كاميرا قائمة'],
  [130,'منى','كاميرا','ip','تفعيل كاميرا قائمة'],[131,'منى','كاميرا','ok','تفعيل كاميرا قائمة'],
  /* كاميراتٌ جديدةٌ: تُفرَّق بوجه العمل لا بالنوع — «ترقية كاميرا» */
  [133,'منى','كاميرا','sv','ترقية كاميرا'],  [134,'منى','كاميرا','asn','ترقية كاميرا'],
  [135,'منى','كاميرا','ins','ترقية كاميرا'], [136,'منى','كاميرا','ip','ترقية كاميرا'],
  [137,'منى','كاميرا','ok','ترقية كاميرا'],
  /* الفكُّ: مشعرٌ كامل */
  [158,'منى','*','dis'], [159,'عرفات','*','dis'],
  /* ما يقيسه النظامُ خارجَ نطاقات الميدان */
  [44,'*','*','ipAll'],    /* الترقيمُ وتسجيلُ عناوين الأجهزة الثلاثة */
  [45,'*','*','custody'],  /* التخزينُ وتجهيزُ العُهدة لفرق التركيب */
  [160,'*','*','disJudge'],/* الجردُ وحكمُ سليمٍ أو تالفٍ لكل جهاز */
  [161,'*','*','custBack'],/* إرجاعُ العُهدة والتخزينُ وتقريرُ النسب */
  [151,'*','*','health'],  /* مراقبةُ صحة الأجهزة على مدار الساعة */
  [154,'*','*','esc']      /* التصعيدُ عند التذبذب المتكرر */
];

var FUP_MEMO = null;   /* (V26.1) يُصفَّر مع كلِّ رسمة */
function fupPct(zone, type, stage, work){
  var mk = zone + '|' + type + '|' + stage + '|' + (work || '');
  if (FUP_MEMO && mk in FUP_MEMO) return FUP_MEMO[mk];
  var v = fupPctRaw(zone, type, stage, work);
  if (FUP_MEMO) FUP_MEMO[mk] = v;
  return v;
}
function fupPctRaw(zone, type, stage, work){
  /* مقاييسُ لا تخصُّ نطاقًا بعينه — تُقاس على المشروع كلِّه */
  if (stage === 'ipAll'){
    var ins = Object.keys(STATE.inss || {}).filter(function(k){
      return STATE.inss[k] && STATE.inss[k].status === 'مُركّب'; });
    if (!ins.length) return null;
    var withIp = ins.filter(function(k){
      var x = siteFind(k); return x && x.net && x.ipRtr && x.ipRdr; }).length;
    return Math.round(withIp * 100 / ins.length);
  }
  if (stage === 'custody' || stage === 'custBack'){
    var mv = (STATE.moves || []).filter(Boolean);
    if (!mv.length) return null;
    var out = mv.filter(function(m){ return m && m.kind === 'صرف'; }).length;
    if (stage === 'custody') return out ? 100 : 0;
    var back = mv.filter(function(m){ return m && m.kind === 'إرجاع'; }).length;
    return out ? Math.min(100, Math.round(back * 100 / out)) : null;
  }
  if (stage === 'disJudge'){
    var D = Object.keys(STATE.diss || {}).map(function(k){ return STATE.diss[k]; })
      .filter(function(x){ return x && x.status === 'تم الفك'; });
    if (!D.length) return null;
    return Math.round(D.filter(function(x){ return x.cond; }).length * 100 / D.length);
  }
  if (stage === 'health'){
    var ins2 = Object.keys(STATE.inss || {}).filter(function(k){
      return STATE.inss[k] && STATE.inss[k].approved; });
    if (!ins2.length) return null;
    return Math.round(ins2.length * 100 / Math.max(1, (STATE.sites || []).length));
  }
  if (stage === 'esc'){
    var due = (typeof escDue === 'function') ? escDue() : [];
    var open = Object.keys(STATE.fixreqs || {}).length;
    if (!open && !due.length) return null;
    return open ? Math.round((open - due.length) * 100 / open) : 100;
  }
  var L = (STATE.sites || []).filter(function(x){
    return x.zone === zone && (type === '*' || x.type === type)
      && (!work || x.work === work);
  });
  if (!L.length) return null;              /* لا نقاطَ: لا يُكتَب شيء */
  var n = 0;
  L.forEach(function(x){
    var rec = STATE.recs[x.id], ins = STATE.inss[x.id];
    if (stage === 'sv'  && rec && svDone(rec)) n++;
    else if (stage === 'asn' && asnOf(x.id)) n++;
    else if (stage === 'ins' && ins && ins.status === 'مُركّب') n++;
    else if (stage === 'ip'  && x.net && x.ipRtr && x.ipRdr) n++;
    else if (stage === 'ok'  && ins && ins.approved) n++;
    else if (stage === 'dis' && (STATE.diss || {})[x.id]
             && STATE.diss[x.id].status === 'تم الفك') n++;
  });
  return Math.round(n * 100 / L.length);
}

/* قارئُ ZIP بلا ضغط: القالبُ مخزَّنٌ بـSTORE فلا يحتاج فكَّ ضغطٍ ولا مكتبة */
function zipRead(buf){
  var u = new Uint8Array(buf), dv = new DataView(buf), out = [], i = 0;
  while (i < u.length - 4){
    if (dv.getUint32(i, true) !== 0x04034b50) break;
    var nLen = dv.getUint16(i + 26, true), xLen = dv.getUint16(i + 28, true);
    var cSize = dv.getUint32(i + 18, true), method = dv.getUint16(i + 8, true);
    var nameB = u.subarray(i + 30, i + 30 + nLen);
    var name = new TextDecoder().decode(nameB);
    var dStart = i + 30 + nLen + xLen;
    out.push({ name:name, method:method, data:u.subarray(dStart, dStart + cSize) });
    i = dStart + cSize;
  }
  return out;
}
function zipWrite(files){
  var enc = new TextEncoder(), parts = [], central = [], off = 0;
  function crc32(b){
    var c, t = zipWrite._t;
    if (!t){ t = zipWrite._t = []; for (var n = 0; n < 256; n++){ c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } }
    c = 0 ^ (-1);
    for (var j = 0; j < b.length; j++) c = (c >>> 8) ^ t[(c ^ b[j]) & 0xFF];
    return (c ^ (-1)) >>> 0;
  }
  files.forEach(function(f){
    var nb = enc.encode(f.name), crc = crc32(f.data);
    var h = new Uint8Array(30 + nb.length), hv = new DataView(h.buffer);
    hv.setUint32(0, 0x04034b50, true); hv.setUint16(4, 20, true);
    hv.setUint16(8, 0, true); hv.setUint32(14, crc, true);
    hv.setUint32(18, f.data.length, true); hv.setUint32(22, f.data.length, true);
    hv.setUint16(26, nb.length, true);
    h.set(nb, 30);
    parts.push(h, f.data);
    var c = new Uint8Array(46 + nb.length), cv = new DataView(c.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(10, 0, true); cv.setUint32(16, crc, true);
    cv.setUint32(20, f.data.length, true); cv.setUint32(24, f.data.length, true);
    cv.setUint16(28, nb.length, true); cv.setUint32(42, off, true);
    c.set(nb, 46);
    central.push(c);
    off += h.length + f.data.length;
  });
  var cLen = central.reduce(function(a, c){ return a + c.length; }, 0);
  var e = new Uint8Array(22), ev = new DataView(e.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cLen, true); ev.setUint32(16, off, true);
  return new Blob(parts.concat(central, [e]), { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function fupExport(){
  if (!may('exportAll')){ toast(t('التصديرُ ليس من صلاحيتك')); return; }
  toast(t('يُجهَّز ملف المتابعة…'));
  fetch('docs/followup-template.xlsx').then(function(r){
    if (!r.ok) throw new Error('template ' + r.status);
    return r.arrayBuffer();
  }).then(function(buf){
    var files = zipRead(buf);
    if (!files.length) throw new Error('zip');
    var sheet = files.filter(function(f){ return f.name === 'xl/worksheets/sheet1.xml'; })[0];
    if (!sheet) throw new Error('sheet');
    var xml = new TextDecoder().decode(sheet.data), wrote = 0;

    FUP_ROWS.forEach(function(r){
      var pct = fupPct(r[1], r[2], r[3], r[4]);
      if (pct === null) return;
      var ref = 'F' + r[0];
      /* يُستبدَل الرقمُ داخلَ الخلية القائمة — لا تُنشَأ خليةٌ ولا يُمسُّ نمط */
      var re = new RegExp('(<c r="' + ref + '"[^>]*>)(?:<v>[^<]*</v>)?(</c>)');
      if (!re.test(xml)) return;
      xml = xml.replace(re, '$1<v>' + pct + '</v>$2');
      wrote++;
    });

    sheet.data = new TextEncoder().encode(xml);
    var blob = zipWrite(files);
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'متابعة-أفاقي-' + todayISO() + '.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    logEvent('تصدير ملف المتابعة — ' + wrote + ' صفًّا');
    toast(nm(wrote) + ' ' + t('صفًّا حُدِّث — الباقي يحسبه إكسل عند الفتح'));
  }).catch(function(e){
    softErr('ملف المتابعة', e, 'تعذّر تجهيزُ ملف المتابعة — جرّب مع اتصال');
  });
}





/* ═══ سجلُّ الأحداث ═══
   كان يعرض خمسةَ أسطرٍ ثابتةً من بيانات العرض لا السجلَّ الحقيقي — فالأثرُ
   التدقيقيُّ يُكتَب ولا يُقرأ، ومن سأل «من حذف هذه الصورة؟» لم يجد جوابًا.
   والحدثُ نصٌّ حر، فنوعُه يُشتقُّ من مفتتحه لا يُخزَّن معه. */
var EV_KINDS = [
  ['مسح',    /^مسح موقع|^تعذّر الوصول/],
  ['تركيب',  /^تركيب|^إتمام تركيب|^مسودّة تركيب/],
  ['اعتماد', /^اعتماد|^ردّ |^رُدّ/],
  ['فك',     /فك —|^جدولة فك/],
  ['صور',    /صورة/],
  ['حسابات', /^حساب|^طلب إضافة شركة/],
  ['مواقع',  /^موقع جديد/],
  ['مخزون',  /^عهدة|^صرف|^توريد|^شراء|^مشترى/],
  ['مال',    /^مستخلص|^ميزانية|^خط أساس/],
  ['نظام',   /^استيراد|^تصدير|^إعداد|^مزامنة/]
];
function evKind(what){
  var w = String(what || '');
  for (var i = 0; i < EV_KINDS.length; i++) if (EV_KINDS[i][1].test(w)) return EV_KINDS[i][0];
  return 'أخرى';
}
/* تصنيفُ الحوكمة: عدسةٌ أخرى فوق نفس الأحداث — لا «أيّ قسم» بل «أيّ فعل».
   كانت شاشةً منفصلةً (سجل التدقيق) تكرّر سجل الأحداث بمصفوفتها الخاصة —
   صارت فلاتر جاهزةً هنا فلا يُفتَح سجلٌّ ثانٍ لنفس البيانات. */
/* ═══ التصنيفُ بالفعل لا بكلمةٍ عابرة (V17.31) ═══
   كان «مالي» أوّلَ القائمة ونمطُه يشمل كلمةَ «اعتماد» — وكلُّ إشعارِ زيارةٍ
   ينتهي بـ«بانتظار اعتمادك». فصُنِّفت ثلاثُمئةٍ وإحدى وأربعون زيارةً مالًا،
   وقُرئت الشاشةُ على أن المشروعَ يصرف وهو يمسح. فصار التصنيفُ بالفعل نفسِه:
   أخصُّ الأنماط أولًا (زيارةٌ · تركيبٌ · فكٌّ · صورةٌ · مهمة)، ثم القرارُ
   (اعتمادٌ · ردٌّ ورفض)، ثم المالُ بكلماته وحدَه لا بكلمةٍ يشترك فيها مع
   غيره، ثم التعديلُ والدخول. والمالُ يُطابَق بما لا يقع إلا فيه: مشترياتٌ
   ومبلغٌ وسعرٌ وميزانيةٌ ومستخلصٌ وريال. */
var EV_CATS = [
  /* الردُّ قرارٌ لا زيارة — يُفحَص قبلها فلا تبتلعه كلمةُ «زيارة» فيه */
  ['رفض وحذف',  /رُدّت|رُفض|رفض|أُلغي|حُذف|شُطب|تراجعٌ عن ردّ/],
  ['زيارة',     /^زيارة|زيارة تمّت|مسح ميداني|تعذّر الوصول/],
  ['تركيب',     /^تركيب|رُكّب|تجميع|إعداد تركيب|حلّ تركيب/],
  ['فكّ',       /^فك|فكّ|إرجاعُ عهدة|جدولة فك/],
  ['صور',       /صورة|صور /],
  ['مهام',      /إسناد|مهمة|مهامّ|جدولة/],
  ['مخزون',     /مخزون|عهدة|شحنة|صرف قطع|استلام/],
  ['مالي',      /مشتر|مبلغ|سعر|ميزانية|مستخلص|ريال|فاتورة|حافز/],
  ['اعتماد',    /اعتُمد|اعتمادُ|الاعتماد|مُنحت|صُدِّق/],
  ['تعديل',     /عُدّل|تعديل|تغيير|حُدِّث/],
  ['حسابات',    /حساب|كلمة المرور|صلاحية|دور/],
  ['دخول',      /دخول|خروج|جلسة/]
];
function evCat(what){
  var w = String(what || '');
  for (var i = 0; i < EV_CATS.length; i++) if (EV_CATS[i][1].test(w)) return EV_CATS[i][0];
  return '';
}
function evPillKind(what){
  var w = String(what || '');
  if (/اعتُمد|مُنحت/.test(w)) return 'ok';
  if (/حُذف|رُفض|شُطب|سُحبت/.test(w)) return 'off';
  if (/عُدّل|تعديل|تغيير|حُدِّث/.test(w)) return 'warn';
  return 'off';
}
var EVF = { kind:'', by:'', from:'', to:'', q:'', cat:'' };

/* ═══ الأثرُ يُقرأ من القاعدة لا من الجهاز ═══
   كان `STATE.events` ذاكرةَ هذا الجهاز وحدَه: يفتح مديرُ المشروع السجلَّ فيرى
   حدثًا واحدًا — دخولَه هو — وقد كتب الفريقُ مئاتِ الأحداث. والأثرُ يُرفَع منذ
   V15 إلى «events» وما كان يُقرَأ. فصار المكتبُ يسحبه ويُدمَج بما على الجهاز
   بلا تكرار: ما رُفع وما لم يُرفَع بعدُ في قائمةٍ واحدةٍ مرتّبةٍ بالزمن. */
/* ═══ السجلُّ من القاعدة لا من ذاكرة الجلسة (V17.27) ═══
   الأحداثُ لا تُحفَظ على الجهاز (هي أثرٌ لا بيانات عمل)، والسحبُ الفارقيُّ
   يجلب ما كُتب بعد المؤشِّر وحدَه — فمع كلِّ إعادةِ تحميلٍ تُفرَّغ الشاشةُ
   وتقول «كل الأحداث ١»، والأثرُ كلُّه في القاعدة سليمٌ لا يُرى. فصارت
   الشاشةُ تجلب آخرَ خمسمئةِ حدثٍ مرةً عند فتحها إن كان ما بيدها قليلًا —
   بسقفٍ، ويُحصى في عدّاد القراءات، ولا يُعاد في الجلسة نفسِها. */
var EV_FETCHED = 0, EV_FETCHING = false, EV_MORE = false, EV_PAGE = 500;
/* ═══ الأثرُ كلُّه متاحٌ — على دفعاتٍ لا دفعةً واحدة (V17.28) ═══
   «آخرُ خمسمئة» كانت سقفَ أمانٍ لا حدَّ الأثر: الأثرُ كلُّه في القاعدة، وسحبُه
   جملةً قراءاتٌ بلا داعٍ وذاكرةٌ تُملأ بما لا يُقرأ. فصار على دفعات: خمسُمئةٍ
   عند الفتح، وزرٌّ يُنزِل الأقدمَ خمسَمئةٍ بعد خمسمئة ما دام هناك أقدم؛
   وإن حُدِّد مدًى بالتاريخ في التصفية جُلب **ذلك المدى بعينه** من القاعدة —
   فتُقرأ فترةٌ قديمةٌ بلا المرور بكلِّ ما بعدها. */
function evFetch(force, mode){
  if (!FB.ready || !FB.db || EV_FETCHING) return;
  if (!force && !mode && EV_FETCHED) return;
  EV_FETCHING = true;
  var q = FB.db.collection('events').orderBy('ts', 'desc');
  var ranged = false;
  if (mode === 'site' && /^NSK-/i.test(String(EVF.q || '').trim())){   /* (V30.8) تاريخُ نقطةٍ كاملًا — حقلٌ واحدٌ بلا ترتيبٍ فلا يحتاج فهرسًا مركّبًا */
    ranged = true; q = FB.db.collection('events').where('site', '==', String(EVF.q).trim());
  } else if (mode === 'range' && (EVF.from || EVF.to)){
    ranged = true;
    if (EVF.to)   q = q.where('ts', '<=', Date.parse(EVF.to));
    if (EVF.from) q = q.where('ts', '>=', Date.parse(EVF.from));
  } else if (mode === 'older'){
    var oldest = evAll().reduce(function(m, e){ return (e.ts && e.ts < m) ? e.ts : m; }, Infinity);
    if (isFinite(oldest)) q = q.where('ts', '<', oldest);
  }
  q.limit(EV_PAGE).get().then(function(sn){
    if (!STATE.evlog) STATE.evlog = {};
    sn.forEach(function(dd){ STATE.evlog[dd.id] = dd.data(); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    EV_MORE = !ranged && sn.size >= EV_PAGE;     /* امتلأت الدفعةُ؟ فثمّةَ أقدمُ منها */
    EV_FETCHED = Date.now(); EV_FETCHING = false;
    toast(nm(sn.size) + ' ' + t('حدثًا جُلبت') + (EV_MORE ? ' — ' + t('وثمّةَ أقدم') : ''));
    if (CUR === 'ev') render(1);
  }).catch(function(e){
    EV_FETCHING = false; EV_FETCHED = Date.now();
    softErr('جلب السجل', e, '');
  });
}
/* ═══ الفاعلُ يُقرأ من نصِّ الحدث حين لا يحمله حقلُه (V17.29) ═══
   الأحداثُ المكتوبةُ قبل وسم الفاعل تحمل اسمَ صاحب الجهاز في حقل «من»،
   واسمُ الفاعل الحقيقيِّ **مكتوبٌ في نصِّها**: «إشعار — زيارة تمّت ·
   NSK-MIN-CMP-0149 · عمار حسين احمد عميش — بانتظار اعتمادك». ولا يجوز أن
   يُكتَب على الوثيقة المخزَّنة اسمٌ لم تُكتَب به — تزويرٌ في سجلِّ تدقيق.
   فيُقرأ للعرض فقط: إن ذُكر في النصِّ اسمُ حسابٍ من حسابات النظام غيرِ
   صاحب الجهاز فهو الفاعل، ويُقال إنه مقروءٌ من النصّ لا مختومٌ في الحقل. */
var EV_NAMES = null, EV_NAMES_V = 0;
function evNames(){
  var n = Object.keys(STATE.users || {}).length;
  if (EV_NAMES && EV_NAMES_V === n) return EV_NAMES;
  EV_NAMES_V = n;
  EV_NAMES = Object.keys(STATE.users || {}).map(function(k){ return (STATE.users[k] || {}).name || ''; })
    .filter(function(x){ return x && x.length > 3; })
    .sort(function(a, b){ return b.length - a.length; });   /* الأطولُ أولًا فلا يبتلعه جزءٌ منه */
  return EV_NAMES;
}
function evActor(e){
  var by = String((e && e.by) || ''), txt = String((e && e.what) || '');
  var mine = STATE.meta.name || '';
  if (by && by !== mine) return { name:by, from:'field' };
  var L = evNames();
  for (var i = 0; i < L.length; i++){
    if (L[i] !== mine && txt.indexOf(L[i]) > -1) return { name:L[i], from:'text' };
  }
  return { name:by || '', from:'field' };
}
function evAll(){
  var byId = {}, out = [];
  (STATE.events || []).forEach(function(e){ if (e && e.id && !byId[e.id]){ byId[e.id] = 1; out.push(e); } });
  var C = STATE.evlog || {};
  Object.keys(C).forEach(function(k){
    var e = C[k]; if (!e || byId[e.id || k]) return;
    byId[e.id || k] = 1;
    out.push({ id:e.id || k, ts:e.ts || e._at || 0, at:e.at || '', day:e.day || '',
               what:e.what || '', by:e.by || '', dev:e.dev || '' });
  });
  return out.sort(function(a, b){ return (b.ts || 0) - (a.ts || 0); });
}
/* (V30.8) فكرةُ المالك #٨: البحثُ في سجلّ التدقيق بلا تشكيلٍ ولا حالةِ حروف، وفي النصِّ والنقطةِ والفاعل —
   و«سجلُّ النقطة» من نافذتها يجلب تاريخَها كلَّه من القاعدة لا من المحمَّل وحدَه */
function evNorm(v){ return String(v == null ? '' : v).replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase(); }
function evSiteHistory(id){ goPage('ev'); EVF = { kind:'', by:'', from:'', to:'', q:id, cat:'' }; PG_Q = id; PG_KEEP = true; render(1); evFetch(true, 'site'); }   /* صندوقُ رأس الصفحة يقود EVF.q (PG_BIND) — فيُملأ هو أيضًا */
function evRows(){
  var L = evAll();
  return L.filter(function(e){
    if (EVF.kind && evKind(e.what) !== EVF.kind) return false;
    if (EVF.cat && evCat(e.what) !== EVF.cat) return false;
    if (EVF.by && evActor(e).name !== EVF.by) return false;   /* بالفاعل لا بصاحب الجهاز */
    if (EVF.q){ var nq = evNorm(EVF.q); if ((evNorm(e.what) + ' ' + evNorm(e.site) + ' ' + evNorm(e.by) + ' ' + evNorm(evActor(e).name)).indexOf(nq) < 0) return false; }   /* (V30.8) النصُّ والنقطةُ والفاعل */
    /* التاريخُ والوقتُ معًا: `from` و`to` بصيغة datetime-local */
    if (EVF.from && e.ts < Date.parse(EVF.from)) return false;
    if (EVF.to   && e.ts > Date.parse(EVF.to))   return false;
    return true;
  });
}




/* ═══ نافذة النقطة — كل ما تحمله النقطة من إجراءات ═══
   الخريطة الحقيقية Leaflet: هذه النافذة هي ما يفتح عند النقر على أي نقطة. */

var BOOT_AT = Date.now();          /* لحظةُ فتحِ التطبيق — لتقدير ما يكلّف */
var POP_OPEN = false, POP_JUST = 0, POP_EV = null;
/* ═══ النقرةُ تُعرَف بعينها لا بوقتها ═══
   نقرةُ النقطة تفتح النافذةَ، ثم يصل الحدثُ نفسُه إلى معالج المستند الذي
   يُغلق كلَّ لوحٍ نُقر خارجه — فكانت النافذةُ تُفتَح وتُغلَق في اللحظة
   نفسها. وحُلَّ بمهلةٍ: «إن مضى أقلُّ من ثلاثِ مئةِ جزءٍ فاتركها». والمهلةُ
   تكفي حتى يبطئ الرسم: مخيماتٌ بمضلّعاتها عند التقريب، أو قائمةٌ طويلةٌ
   يُعاد بناؤها — فيتجاوز الرسمُ المهلةَ، ويصل الحدثُ بعدها، فتُغلَق النافذةُ
   قبل أن تُرى. ولا يقع ذلك إلا على الأجهزة البطيئة وفي أثقل الحالات، فيبدو
   العطلُ متقطّعًا لا يُصدَّق.
     فصارت النقرةُ تُعلَّم بعينها: يُحفَظ الحدثُ الأصليُّ نفسُه، ويقارنه
   معالجُ المستند بهويته — فلا يهمُّ كم استغرق الرسمُ، الحدثُ الذي فتحها لا
   يُغلقها أبدًا. والمهلةُ تبقى احتياطًا لمن لا حدثَ أصليَّ له. */
function popOpenAt(id, ev){
  POP_EV = (ev && (ev.originalEvent || ev.detail && ev.detail.originalEvent)) || ev || null;
  POP_JUST = Date.now();
  POP_SITE = id; POP_OPEN = true; render();
}

/* نافذةُ النقطة في p27 — بأفعالها الحقيقية */

/* ═══ مركز التصدير — قسمًا قسمًا كالقديم ═══ */

var EXP_SECS = [
  ['summary','الملخّص التنفيذي — أرقامُ المشروع في ورقة',1],
  ['over','نظرة عامة',1], ['minappr','اعتماد الوزارة لإعداد التركيب',1], ['wbs','متابعة الخطة التفصيلية',1], ['wtask','متابعة المهام الأسبوعية',1], ['wtaskAll','المهام — ورقة العمل',1], ['wtmeet','محضر الاجتماع',1], ['wtsince','ما تغيّر منذ الاجتماع الماضي',1], ['pace','الوتيرة والهدف',1],
  ['chalm','التحديات — أين وما هي وما المطلوب',1], ['chalpts','نقاط التحديات — كلُّ نقطةٍ بتحدّيها ووصفه وموقعها ومعالجته (بفلتر الصفحة إن وُضع)',1], ['inst','التركيب والجدولة',1],
  ['daily','معدل التركيب اليومي — آخر ١٤ يوم',1], ['reg','حسب المشعر ونوع النقطة',1],
  ['co','حسب شركة الخدمة — الأقل إنجازًا أولًا',1],
  ['setup','المواعيد المستهدفة وأزمنة التركيب',1],
  ['pipe','سلامة خط الإنتاج — مسح ← جدولة ← تركيب',1],
  ['assign','توزيع فرق التركيب',1], ['conote','إشعار الشركات بمواعيد التركيب',1],
  ['stock','عُهدة الأجهزة — القارئات مع الفرق والمخزن',1],
  ['survey','المسح الميداني',1], ['chal','التحديات الميدانية — إفادة المشرفين',1],
  ['stuck','المتعذّر — ما لم يصل إليه الميدان',1],
  ['idle','الراكد — زيارةٌ تمّت ولم يُركَّب موقعُها',1],
  ['qa','التدقيق الهندسي — اعتماد التركيبات والسيريالات',1],
  ['sys','سلامة البيانات — المشرف العام',1], ['ev','سجل الأحداث',1],
  ['invb','المخزون والعُهدة',1], ['invmv','دفتر حركة المخزون',1],
  ['wos','الورشة — طلبات التهيئة والتجميع والتركيب',1],
  ['wday','نقاط اليوم — لكل منفِّذ عبر المراحل',1],
  ['buys','المشتريات — ما اشتُري من السوق المحلي',1],
  ['score','أداء الفنيين — نقاطهم ومستحقّهم',1],
  ['stages','أداء المراحل — فريق كل مرحلة',1],
  ['recs','المسح الميداني — كل زيارة وحالتها',1],
  ['hb','صحة الأجهزة — إنذار مبكر',1], ['dis','الفك بعد الموسم',1],
  ['vers','نسخة التطبيق على الأجهزة',1],
  /* خمسُ أوراقٍ كانت تُبنى ولا يصلها منفذ: تُولَّد في كل تصديرٍ ثم تُرمى.
     ورقةٌ لا تُطلَب شيفرةٌ ميتة، والأصلُ أن تُوصَل لا أن تُحذَف. */
  ['work','وجه العمل — التوزيع والنسب',1],
  ['items','القطع والأسعار — الكتالوج كاملًا',1],
  ['crews','الطواقم ومعدلاتها اليومية',1],
  ['reps','مركز التقارير — ما يُرسَل ولمن ومتى',1],
  ['daily','الاتجاه اليومي — تسعون يومًا',1],
  ['ev','سجل الأحداث — كما هو مصفّى',1],
  ['users','المستخدمون وأدوارهم',1],
  ['notif','الإشعارات وقنواتها',1],
  ['appr','الاعتمادات — المقترح والقرار',1],
  ['ips','عناوين الشبكة',1],
  ['fleet','السيارات — الأسطول والإسناد',1],
  ['fleetCost','تكلفة الأسطول',1],
  ['fleetLog','سجل عهدة السيارات',1],
  ['ships','الشحنات والتوريد',1],
  ['roles','الأدوار والصلاحيات',1]
];

/* ═══ التصديرُ بعين الدور ═══
   كان الحوارُ يعرض الأقسامَ كلَّها لكلِّ أحد — فترى الوزارةُ «الأدوار والصلاحيات»
   و«عهدة السيارات» و«تكلفة الأسطول» وتختارها وتُصدَّر لها. صار كلُّ قسمٍ
   مربوطًا بشاشته: لا يُعرَض ولا يُصدَّر إلا لمن يرى تلك الشاشة. */
var EXP_PAGE = { summary:'over', minappr:'survey', wtsince:'wtask', wtaskAll:'wtask', wtmeet:'wtask', setup:'consts', pipe:'over', conote:'co', stock:'inv', wday:'perf', score:'perf', stages:'perf',
                 hb:'sys', vers:'sys', work:'over', items:'items', crews:'org', reps:'exec', appr:'ev', ips:'sys',
                 fleet:'fleet', fleetCost:'fleet', fleetLog:'fleet', ships:'inv', roles:'roles', invb:'inv', invmv:'inv',
                 wos:'inv', buys:'inv', notif:'ev', users:'users', recs:'survey', chal:'survey', stuck:'survey', qa:'survey',
                 chalm:'survey', chalpts:'mfu', assign:'req', inst:'over', daily:'over', pace:'over', reg:'over', dis:'dis', sys:'sys', ev:'ev', survey:'survey', co:'co', over:'over' };
function expAllowed(k){ var p = EXP_PAGE[k] || k; return typeof seesPage === 'function' ? seesPage(p) : true; }
/* ستةَ عشرَ قسمًا في القائمة بلا ورقةٍ تُبنى — كانت تُعرَض رماديةً مطفأةً
   فيظنُّ الناظرُ أن بياناتِه ناقصة، وهي شيفرةٌ لم تُوصَل. لا تُعرَض. */
function expSecs(){ return EXP_SECS.filter(function(x){ return expAllowed(x[0]) && !!SHEETS[x[0]]; }); }
/* ═══ PDF: ورقةٌ تُبنى وتُطبَع ═══
   الطباعةُ إلى PDF هي ما يملكه المتصفّحُ بلا مكتبة — تُبنى صفحةٌ نظيفةٌ
   بالأقسام المختارة في نافذةٍ مستقلّةٍ فيختار المستخدمُ «حفظ كـPDF». */
/* ═══ صفحةُ الغلاف: البطاقاتُ والأشرطةُ التي تُقرأ قبل الجداول ═══
   الجداولُ وحدَها لا تقول «الشغلُ تمام»: تُقرأ بعد أن يُعرَف الموقف. فالغلافُ
   بطاقاتٌ كبيرةٌ بأرقام المشروع، وأشرطةُ تقدّمٍ للمسح والتركيب، وأعمدةٌ لكلِّ
   مشعرٍ، وحلقةُ حالةٍ لدورة النقطة — كلُّها SVG مرسومٌ في الصفحة لا صورةٌ
   خارجية، فتُطبَع كما تُرى بلا مكتبةٍ ولا اتصال. */
function pdfTile(lab, val, sub, col){
  return '<div class="tile" style="border-top:4px solid ' + col + '">'
    + '<div class="tl">' + esc(t(lab)) + '</div><div class="tv">' + esc(String(val)) + '</div>'
    + (sub ? '<div class="ts">' + esc(sub) + '</div>' : '') + '</div>';
}
function pdfBar(lab, v, max, col){
  var p = max ? Math.min(100, Math.round(v / max * 100)) : 0;
  return '<div class="bar"><div class="bl"><span>' + esc(t(lab)) + '</span><span>' + nm(v) + ' / ' + nm(max) + ' \u00b7 ' + nm(p) + '٪</span></div>'
    + '<div class="btrack"><i style="width:' + p + '%;background:' + col + '"></i></div></div>';
}
/* أعمدةٌ رأسيةٌ بـSVG — لا مكتبةَ ولا صورة */
function pdfCols(rows, col){
  var mx = Math.max(1, Math.max.apply(null, rows.map(function(r){ return r[1]; })));
  var W = 96, H = 150, gap = 26, w = rows.length * (W + gap);
  return '<svg viewBox="0 0 ' + Math.max(360, w) + ' 210" style="width:100%;max-width:640px;height:auto">'
    + rows.map(function(r, i){
        var h = Math.round(r[1] / mx * H), x = i * (W + gap) + 12, y = 20 + (H - h);
        return '<rect x="' + x + '" y="' + y + '" width="' + W + '" height="' + Math.max(2, h) + '" rx="6" fill="' + col + '"></rect>'
          + '<text x="' + (x + W / 2) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="15" fill="#111" font-weight="700">' + nm(r[1]) + '</text>'
          + '<text x="' + (x + W / 2) + '" y="' + (H + 42) + '" text-anchor="middle" font-size="13" fill="#445">' + esc(r[0]) + '</text>';
      }).join('') + '</svg>';
}
/* حلقةٌ مقسَّمةٌ بحصص — دورةُ حياة النقطة بلونها */
function pdfDonut(parts){
  var tot = parts.reduce(function(a, p){ return a + p[1]; }, 0) || 1, R = 62, C = 2 * Math.PI * R, off = 0;
  return '<div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">'
    + '<svg viewBox="0 0 170 170" style="width:170px;height:170px">'
    + '<circle cx="85" cy="85" r="' + R + '" fill="none" stroke="#eef2f6" stroke-width="22"></circle>'
    + parts.map(function(p){
        var len = p[1] / tot * C, el = '<circle cx="85" cy="85" r="' + R + '" fill="none" stroke="' + p[2] + '" stroke-width="22"'
          + ' stroke-dasharray="' + len.toFixed(1) + ' ' + (C - len).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 85 85)"></circle>';
        off += len; return el;
      }).join('')
    + '</svg><div style="font-size:12px">'
    + parts.map(function(p){ return '<div style="margin:3px 0"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:' + p[2] + ';margin-inline-end:7px"></span>'
        + esc(t(p[0])) + ' <b>' + nm(p[1]) + '</b> <span style="color:#778">' + nm(Math.round(p[1] / tot * 100)) + '٪</span></div>'; }).join('')
    + '</div></div>';
}
function pdfCover(){
  var K = siteKeyStats(), S = K.total;
  var zones = {}; STATE.sites.forEach(function(x){ zones[x.zone] = (zones[x.zone] || 0) + (svDone(STATE.recs[x.id]) ? 1 : 0); });
  var zrows = Object.keys(zones).map(function(z){ return [z, zones[z]]; }).sort(function(a, b){ return b[1] - a[1]; });
  var life = {}; STATE.sites.forEach(function(x){ var l = lifeOf(x); life[l] = (life[l] || 0) + 1; });
  var parts = LIFE_ORDER.filter(function(k){ return life[k]; }).map(function(k){ return [LIFE[k].n, life[k], LIFE[k].c]; });
  var wt = (typeof wtStats === 'function') ? wtStats() : null;
  var pct = S.n ? Math.round(S.sv / S.n * 100) : 0;
  return '<div class="tiles">'
    + pdfTile('إجمالي المواقع', nm(S.n), '', '#1F4E79')
    + pdfTile('تم المسح', nm(S.sv), nm(pct) + '٪', '#2E75B6')
    + pdfTile('مُركّب', nm(S.ins), '', '#3AD6A0')
    + pdfTile('لم يُزر', nm(S.noRec), '', '#9FB0AA')
    + pdfTile('متعذّر', nm(S.stuck), '', '#8D6E63')
    + (wt ? pdfTile('مهامُّ متأخرة', nm(wt.late), nm(wt.all) + ' ' + t('مهمة'), wt.late ? '#E05252' : '#3AD6A0') : '')
    + '</div>'
    + '<div class="box">' + pdfBar('نسبة المسح من إجمالي المشروع', S.sv, S.n, '#2E75B6')
    + pdfBar('نسبة التركيب من إجمالي المشروع', S.ins, S.n, '#3AD6A0') + '</div>'
    + (zrows.length ? '<h3>' + esc(t('المسح المنجز حسب المشعر')) + '</h3><div class="box">' + pdfCols(zrows, '#2E75B6') + '</div>' : '')
    + (parts.length ? '<h3>' + esc(t('دورة النقطة — أين هي الآن')) + '</h3><div class="box">' + pdfDonut(parts) + '</div>' : '');
}
function expPdf(keys){
  var css = 'body{font:12px/1.6 system-ui,"Segoe UI",Tahoma;margin:20px;color:#111}'
    + 'h1{font-size:21px;margin:0 0 2px;color:#1F4E79}h2{font-size:14px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid #1F4E79;color:#1F4E79;page-break-after:avoid}'
    + 'h3{font-size:13px;margin:16px 0 6px;color:#334}'
    + 'table{width:100%;border-collapse:collapse;margin:0 0 10px;font-size:11px}'
    + 'th{background:#1F4E79;color:#fff;padding:5px 6px;text-align:start;font-weight:600}'
    + 'td{border-bottom:1px solid #dde3ea;padding:4px 6px}tr:nth-child(even) td{background:#f6f9fc}'
    + '.hint{color:#667;font-size:11px}'
    + '.tiles{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}'
    + '.tile{flex:1 1 150px;min-width:140px;border:1px solid #e3e9f0;border-radius:10px;padding:10px 12px;background:#fbfdff}'
    + '.tl{font-size:11.5px;color:#667}.tv{font-size:26px;font-weight:800;line-height:1.2;color:#12203a}.ts{font-size:11px;color:#667}'
    + '.box{border:1px solid #e3e9f0;border-radius:10px;padding:12px 14px;background:#fff;margin:0 0 10px}'
    + '.bar{margin:0 0 10px}.bl{display:flex;justify-content:space-between;font-size:11.5px;color:#445;margin-bottom:4px}'
    + '.btrack{height:10px;border-radius:99px;background:#eef2f6;overflow:hidden}.btrack i{display:block;height:100%;border-radius:99px}'
    + '@media print{h2{page-break-before:always}.cover{page-break-after:always}}';
  var body = '<div style="display:flex;align-items:center;gap:12px;margin:0 0 6px">'
    +   (LOGO ? '<img src="' + LOGO + '" alt="AFAQY" style="height:34px;width:auto">' : '')
    +   '<h1 style="margin:0">' + esc(t('قارئات أفاقي — تقرير اللوحة')) + '</h1></div>'
    + '<div class="hint">' + esc(t('حج ١٤٤٨هـ')) + ' \u00b7 ' + esc(t('قارئات أفاقي في المشاعر')) + ' \u00b7 '
    + esc(fmtDT()) + ' \u00b7 ' + esc(dispName(STATE.meta.name || '')) + '</div>';
  /* الغلافُ أولًا: البطاقاتُ والرسومُ ثم الجداول */
  try { body += '<div class="cover">' + pdfCover() + '</div>'; } catch (e){ softErr('غلاف التقرير', e, ''); }
  var n = 0;
  keys.forEach(function(k){
    var fn = SHEETS[k]; if (!fn) return;
    var rows; try { rows = fn(); } catch (e){ return; }
    if (!rows || rows.length < 2) return;
    var lab = (EXP_SECS.filter(function(x){ return x[0] === k; })[0] || [k, k])[1];
    body += '<h2>' + esc(t(lab)) + '</h2><table><thead><tr>'
      + rows[0].map(function(c){ return '<th>' + esc(String(c == null ? '' : c)) + '</th>'; }).join('')
      + '</tr></thead><tbody>'
      + rows.slice(1, 400).map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + esc(String(c == null ? '' : c)) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</tbody></table>'
      + (rows.length > 400 ? '<div class="hint">' + esc(t('عُرض أربعُمئة صفٍّ — والإكسلُ فيه الباقي')) + '</div>' : '');
    n++;
  });
  if (!n){ toast(t('لا بياناتٍ في الأقسام المختارة')); return; }
  var w2 = window.open('', '_blank');
  if (!w2){ toast(t('امنع حجبَ النوافذ لتصدير PDF')); return; }
  w2.document.write('<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">'
    + '<title>' + esc(t('قارئات أفاقي — تقرير اللوحة')) + '</title><style>' + css + '</style></head><body>'
    + body + '</body></html>');
  w2.document.close();
  setTimeout(function(){ try { w2.focus(); w2.print(); } catch (e){ softErr('طباعة PDF', e, 'افتح النافذةَ واطبع منها'); } }, 400);
  logEvent('تصدير PDF — ' + n + ' قسمًا');
  toast(nm(n) + ' ' + t('قسمًا — اختر «حفظ كـPDF» من نافذة الطباعة'));
}
function expHtml(){
  return '<div class="pop" id="expPop" style="width:min(430px,92vw);max-height:82vh;overflow:auto">'
    + '<div class="pop-head">'
    +   '<div><h3 style="color:var(--ink)">'+esc(t('تصدير تقرير اللوحة'))+'</h3>'
    +   '<p class="hint" style="margin:2px 0 0">'+esc(t('اختر الأقسام التي تريدها في التقرير'))+'</p></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm" data-exp="0" aria-label="'+esc(t('إغلاق'))+'">✕</button>'
    + '</div>'
    + '<div class="pop-body">'
    + '<div class="actions" style="margin:12px 0">'
    +   btn('تحديد الكل','btn-secondary btn-sm',' data-expall="1"')
    +   btn('إلغاء الكل','btn-secondary btn-sm',' data-expall="0"')
    + '</div>'
    + '<div id="expList" style="margin:0 0 14px">'
    +   expSecs().map(function(s){
          return '<label style="display:flex;gap:9px;align-items:flex-start;padding:7px 2px;'
            + 'border-bottom:1px solid var(--line-2);font-size:13.5px;cursor:pointer">'
            + '<input type="checkbox" class="expCk" data-k="'+esc(s[0])+'" checked'
            + ' style="width:18px;min-height:18px;margin-top:2px;flex:0 0 auto">'
            + '<span>'+esc(t(s[1]))+'</span></label>';
        }).join('')
    + '</div>'
    + '<div class="grid cols-2" style="margin-bottom:12px">'
    +   '<div class="field" style="margin:0"><label>'+esc(t('الصيغة'))+'</label>'
    +   '<select id="expFmt"><option value="xlsx">'+esc(t('إكسل — ورقة لكل قسم'))+'</option>'
    +   '<option value="pdf">'+esc(t('PDF — بالرسوم البيانية'))+'</option>'
    +   '<option value="both">'+esc(t('الاثنان معًا'))+'</option></select></div>'
    +   '<div class="field" style="margin:0"><label>'+esc(t('الرسوم البيانية'))+'</label>'
    +   '<select><option value="مضمّنة">'+esc(t('مضمّنة'))+'</option><option value="بدونها">'+esc(t('بدونها'))+'</option></select></div>'
    + '</div>'
    + '<div class="actions">' + btn('تصدير','btn-primary',' data-expgo="1"')
    +   btn('إلغاء','btn-secondary',' data-exp="0"') + '</div></div>'
    + '<p class="hint" style="font-size:11.5px">'
    +   esc(t('الإكسل ورقةٌ لكل قسم بعناوينها كما تظهر على الشاشة · والPDF صفحةٌ لكل قسم برسمها البياني.')) + '<br>'
    +   esc(t('يُصدَّر ما بعد التصفية — وبلا تصفيةٍ يُصدَّر الكلّ.'))
    + '</p></div>';
}

/* ═══ الاستيراد — قالب يُنزَّل ثم يُملأ ثم يُرفع ═══ */

var IMPORTS = [
  ['sites','المواقع', ['المعرّف','المشعر','النوع','الشاخص','المربع','الشركة','خط العرض','خط الطول'],
   'يحدّث بيانات موقع موجود بمعرّفه — ولا ينشئ مواقع جديدة.'],
  ['ips','عناوين الأجهزة', ['معرّف الموقع','بادئة الشبكة','الراوتر','القارئ','الكاميرا'],
   'البادئة تكفي: العناوين تُشتقّ منها باصطلاح ‎.1 راوتر و‎.2 قارئ و‎.3 كاميرا.'],
  ['co','الشركات', ['اسم الشركة','مواقعها','المنسّق','الجوال'],
   'الاسم الحر كان يصنع شركتين من واحدة باختلاف حرف.'],
  ['items','القطع والأسعار', ['المنطقة','اسم القطعة','نقاط التركيب','نقاط التهيئة','نقاط التجميع','السعر'],
   'المنطقة إما «مخيم» أو «ممر» — وما عداهما يُرفض الصف.'],
  ['stock','توريد المخزون', ['الصنف','الكمية','المورّد','التاريخ','رقم الفاتورة'],
   'كل صف حركةُ توريدٍ تدخل الدفتر — ولا تُعدَّل بعدها بل تُوازَن بحركة.'],
  ['buys','المشتريات', ['التاريخ','الصنف','الفئة','المشعر','الكمية','سعر الوحدة','المورّد'],
   'الفئة والمورّد يجب أن يكونا من القائمتين المعتمدتين.'],
  ['fleet','السيارات', ['رقم اللوحة','النوع','الموديل','انتهاء الرخصة','الملكية','التكلفة الشهرية'],
   'اللوحةُ مفتاح: ما وُجد يُعدَّل وما لم يوجد يُنشَأ. والنوعُ من «أنواع السيارات».'],
  ['users','المستخدمون', ['المعرّف','الاسم','الدور','الحالة'],
   'يعدّل الاسمَ والدورَ والحالةَ لحسابٍ قائمٍ بمعرّفه — ولا يُنشئ حسابًا، فالإنشاءُ في المصادقة لا في القاعدة.']
];

function importCard(){
  if (!may('importAll')) return '';
  return card('استيراد من إكسل',
    '<p class="hint" style="margin:0 0 14px">'
    + esc(t('نزّل القالب، املأه، ثم ارفعه. القالب يحمل الأعمدة بأسمائها وصفًّا نموذجيًّا يُحتذى.'))
    + '</p>'
    + IMPORTS.map(function(im){
        return '<div style="border:1px solid var(--line);border-radius:var(--radius-sm);'
          + 'padding:12px 14px;margin-bottom:10px">'
          + '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">'
          +   '<strong style="font-size:14px">'+esc(t(im[1]))+'</strong>'
          +   '<div class="actions">'
          +     btn('⬇ '+t('نزّل القالب'),'btn-secondary btn-sm',' data-tpl="'+im[0]+'"')
          +     '<label class="btn btn-primary btn-sm" style="cursor:pointer">⬆ '+esc(t('ارفع الملف'))
          +     '<input type="file" accept=".xlsx,.xls,.csv" data-imp="'+im[0]+'" '
          +     'style="display:none" aria-label="'+esc(t('ارفع الملف'))+'"></label>'
          +   '</div></div>'
          + '<div class="hint" style="margin:8px 0 0;font-size:12px">'
          +   '<span style="opacity:.75">'+esc(t('الأعمدة'))+':</span> '
          +   im[2].map(function(c){ return esc(t(c)); }).join(' · ')
          + '</div>'
          + '<div class="hint" style="margin:5px 0 0;font-size:11.5px">'+esc(t(im[3]))+'</div>'
          + '</div>';
      }).join('')
    + '<div style="padding:10px 0;border-top:1px solid var(--line)">'
    + '<b>' + esc(t('تقرير كاميرات الوزارة')) + '</b>'
    + '<div class="hint" style="margin:4px 0 8px;font-size:12px">' + esc(t('ارفع ملفَّ الوزارة كما هو (MOHU CPE AND CAMERA REPORT) — يُطابَق بالنقاط عمودًا عمودًا، وتظهر العناوينُ في نافذة كلِّ كاميرا لمن دخل التطبيق فقط. كلمةُ المرور لا تُحفَظ.')) + '</div>'
    + '<input type="file" accept=".xlsx,.xls" data-imp="mohu" aria-label="' + esc(t('تقرير كاميرات الوزارة')) + '">'
    + '</div>'
    + (IMP_PREVIEW ? impPreviewCard() : '')
    + '<div class="alert info" style="margin:14px 0 0"><span>'
    + esc(t('الرفع يعرض معاينةً قبل الحفظ: كم صفًّا سيُقبل وكم سيُرفض ولماذا — ولا يُكتب شيء قبل موافقتك.'))
    + '</span></div>');
}

function impPreviewCard(){
  var p = IMP_PREVIEW;
  var nm2 = p.kind === 'mohu' ? 'تقرير كاميرات الوزارة' : (IMPORTS.filter(function(i){ return i[0] === p.kind; })[0] || ['',''])[1];
  return card(t('معاينة ما رُفع') + ' — ' + t(nm2),
      (p.missing.length
        ? alertBox('error','أعمدةٌ ناقصةٌ في الملف: ' + p.missing.join(' · ') + ' — نزّل القالب واملأه.')
        : '')
    + stats([['سيُقبل', N(p.ok.length), 'ok'], ['سيُرفض', N(p.bad.length), p.bad.length?'bad':''],
             ['الأعمدة', N(p.head.length)], ['الناقص', N(p.missing.length), p.missing.length?'bad':'']])
    + (p.bad.length
        ? table(['الصف','السبب','أول قيمة'],
            p.bad.slice(0, 12).map(function(b){
              return ['<span class="num">' + nm(b.row) + '</span>', pill(b.why,'off'),
                      '<span class="hint" style="margin:0">' + esc(String(b.data[0]||'—')).slice(0,40) + '</span>'];
            }))
        : '')
    + '<div class="actions" style="margin-top:12px">'
    + (p.ok.length && !p.missing.length
        ? btn('احفظ ' + nm(p.ok.length) + ' صفًّا','btn-primary',' data-impgo="1"') : '')
    + btn('إلغاء','btn-secondary',' data-impx="1"') + '</div>');
}

function repcenterBody(){ return (function(){
    if (REP_SIDE === 'sched'){
      return '<div class="chips">' + repChips() + '</div>' + (function(){
    return card('الدوريات',
        table(['الدورية','متى تُرسَل','الوقت','تقارير'],
          PERIODS.map(function(p){
            var n = CREW_REPORTS.filter(function(r){ return r[1] === p[0]; }).length;
            return [pill(p[1],'acc'), '<span class="hint" style="margin:0">' + esc(t(p[2])) + '</span>',
                    '<input type="time" data-crtime="' + p[0] + '" value="'
                      + ((CFG.crTime && CFG.crTime[p[0]]) || (p[0]==='day'?'17:00':'07:00'))
                      + '" style="max-width:130px">',
                    N(n)];
          })),
        btn('حفظ المواعيد','btn-primary btn-sm',' data-crsave="1"'))
      + alertBox('warn',
          t('الإرسالُ التلقائيُّ في الموعد يحتاج خادمًا مجدولًا — لم يُبنَ بعد. الأوقاتُ تُحفَظ الآن، والتقريرُ نفسُه يُصدَّر يدويًّا في «مركز التقارير».'))
      + PERIODS.map(function(p){
          var L = CREW_REPORTS.filter(function(r){ return r[1] === p[0]; });
          return cardFlush(t(p[1]) + ' — ' + nm(L.length),
            table(['التقرير','لمن','ما يحويه',''],
              L.map(function(r){
                return ['<strong>' + esc(t(r[0])) + '</strong>', pill(r[2],'info'),
                        '<span class="hint" style="margin:0">' + esc(t(r[3])) + '</span>',
                        '<div class="actions">'
                        + '<button type="button" class="btn btn-quiet btn-sm" data-p="reps">'
                        + esc(t('في مركز التقارير')) + '</button></div>'];
              })));
        }).join('')
      + card('قناة الإرسال',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('الوسيلة')) + '</label>'
          + '<select><option value="داخل التطبيق">' + esc(t('داخل التطبيق')) + '</option><option value="واتساب">' + esc(t('واتساب')) + '</option><option value="الاثنان">' + esc(t('الاثنان')) + '</option></select></div>'
          + '<div class="field"><label>' + esc(t('لغة التقرير')) + '</label>'
          + '<select><option>العربية</option><option>English</option><option>اردو</option></select></div>'
          + '</div>')
      + '<p class="hint">' + esc(t('التقرير يُبنى من الأرقام نفسها التي على الشاشة — فلا يفترق تقريرٌ عن لوحة.')) + '</p>';
      })();
    }
    var list = REPORTS.filter(function(r){ return r.side === REP_SIDE; });
    var pers = {};
    REPORTS.forEach(function(r){ pers[r.per] = (pers[r.per] || 0) + 1; });

    return '<div class="chips">' + repChips() + '</div>'

      + stats([['تقارير معرَّفة', N(REPORTS.length), 'acc'],
               ['يومية', N(pers['يومي'] || 0)],
               ['أسبوعية', N(pers['أسبوعي'] || 0)],
               ['شهرية', N(pers['شهري'] || 0)]])

      + list.map(function(r){
          var ready = r.sheets.filter(function(s){ return SHEETS[s]; });
          return card(r.i + ' ' + t(r.n),
            '<div class="pop-rows" style="margin:0">'
            + '<div><span class="k">' + esc(t('إلى')) + '</span><span>' + esc(t(r.to)) + '</span></div>'
            + '<div><span class="k">' + esc(t('الدورية')) + '</span><span>'
            +   pill(r.per, r.per==='يومي'?'acc':'') + '</span></div>'
            + '<div><span class="k">' + esc(t('موعده')) + '</span><span>' + esc(t(r.when)) + '</span></div>'
            + '<div><span class="k">' + esc(t('محتواه')) + '</span><span>' + esc(t(r.what)) + '</span></div>'
            + '<div><span class="k">' + esc(t('صيغته')) + '</span><span>' + esc(t(r.how)) + '</span></div>'
            + '<div><span class="k">' + esc(t('أوراقه')) + '</span><span>'
            +   ready.map(function(s){ return '<span class="pill">' + esc(t(SHEET_NAMES[s] || s)) + '</span>'; }).join(' ')
            +   '</span></div>'
            + '</div>',
            '<div class="actions">'
            + (may('exportAll') ? btn('⬇ ولّد التقرير','btn-primary btn-sm',' data-repgo="' + esc(r.id) + '"') : '')
            + btn('🖨 PDF','btn-secondary btn-sm',' data-print="1"')
            + '</div>');
        }).join('')

      + card('حزمةُ الجهة كاملةً',
          '<p class="hint" style="margin:0 0 12px">'
          + esc(t('كلُّ تقارير هذه الجهة في ملفٍّ واحدٍ بأوراقه — للأرشيف أو للمراجعة.'))
          + '</p>',
          may('exportAll')
            ? btn('📦 حزمة ' + (REP_SIDE==='co' ? t('الشركة') : t('الوزارة')),
                  'btn-primary',' data-reppack="' + REP_SIDE + '"')
            : '');
  })(); }
PAGE.exp = { m:'الأدوات', t:'التصدير والتقارير', l:'ما يخرج من النظام وما يدخل إليه — ومركزُ التقارير بدورياته.',
  body:function(){ var head = tabHead('exp'), cur = tabCur('exp'); return head + (cur === 'repcenter' ? repcenterBody() : PAGE.exp.body0()); },   /* (V27.1) مركزُ التقارير كان شريحةً في التقارير التنفيذية بمحتوى التصدير نفسِه */
  body0:function(){
    return card('ملف متابعة المشروع — بقالبه',
        '<p class="hint" style="margin:0 0 12px">'
        + esc(t('يُنزَّل الملفُ بقالبه كما هو — بتنسيقه الشرطيِّ وتعليقاتِه ومعادلاتِه — ولا يُكتَب فيه إلا نسبةُ الإنجاز في الصفوف الميدانية. والحالةُ والموقفُ الزمنيُّ والمتبقي يحسبها إكسلُ بنفسه عند الفتح.'))
        + '</p>'
        + '<div class="pop-rows" style="margin:0">'
        +   (function(){
              var done = 0, all = 0;
              FUP_ROWS.forEach(function(r){
                var p = fupPct(r[1], r[2], r[3], r[4]);
                if (p === null) return;
                all++; if (p > 0) done++;
              });
              return '<div><span class="k">' + esc(t('صفوفٌ يقرؤها النظام')) + '</span><span>'
                + nm(all) + ' ' + esc(t('من')) + ' ' + nm(FUP_ROWS.length) + '</span></div>'
                + '<div><span class="k">' + esc(t('فيها تقدّم')) + '</span><span>' + nm(done) + '</span></div>';
            })()
        + '</div>',
        btn('⬇ ملف المتابعة — محدَّثًا','btn-primary btn-sm',' data-fup="1"'))
      + card('تصدير تقرير اللوحة',
        '<p class="hint" style="margin:0 0 12px">'
        + esc(t('تسعةٌ وعشرون قسمًا قابلة للاختيار — إكسل ورقةً لكل قسم، أو PDF صفحةً لكل قسم برسمها.'))
        + '</p>'
        + '<div class="actions">'
        + btn('اختر الأقسام','btn-primary',' data-exp="1"')
        + btn('⬇ إكسل — الكل','btn-secondary',' data-xls="*"')
        + btn('🖨 PDF — الكل','btn-secondary',' data-print="1"')
        + '</div>')
      + card('تصديرات جاهزة',
          '<div class="actions">'
          + btn('🌍 KMZ — منى وعرفات','btn-secondary',' data-kmz="main"')
          + btn('🌍 KMZ — ' + t('الكل') + ' ' + nm((STATE.sites || []).length) + ' ' + t('نقطة'),'btn-secondary',' data-kmz="all"')   /* العددُ من السجلّ لا محفورًا (V22.2) */
          + btn('🌍 KMZ — إعادة تركيب ١٤٤٧','btn-secondary',' data-kmz="redo"')
          + btn('⬇ إكسل — المواقع','btn-secondary',' data-xls="sites"')
          + btn('⬇ إكسل — الشركات','btn-secondary',' data-xls="co"')
          + btn('⬇ إكسل — حركة المخزون','btn-secondary',' data-xls="invmv"')
          + btn('⬇ إكسل — أداء الفنيين','btn-secondary',' data-xls="techx"')
          + '</div>')
      + kmiCard()
      + importCard();
  }};

/* ═══ الأدوار — من يرى ماذا ويفعل ماذا ═══
   الحجب بالبنية لا بالجافاسكربت وحده: بندٌ لا يُبنى أصلًا لمن لا يملكه. */

var ROLES = {
  /* ═══ الإدارةُ العليا فوق مديرِ المشروع ═══
     كان السلَّمُ ينتهي عند مديرِ المشروع: فلا مديرَ له، ولا يُسأل عن عمله
     أحدٌ داخل النظام — وهو في الواقع يرفع إلى إدارةٍ عليا في الشركة تسأل
     عن الربحية والمخاطر الكبرى والقرار. فأُضيفت مرتبةٌ فوقه بدورها:
     تقرأ الموقفَ التنفيذيَّ والمعالمَ والقيمةَ المكتسبةَ والمخاطر، ولا
     تعدّل ولا تعتمد ولا تضبط — فالإشرافُ لا يعني الإمساك بكلِّ مقبض.
     وبها صار مديرُ المشروع يُسنَد إلى مديرٍ كما يُسنَد غيرُه. */
  exec:{
    n:'الإدارة العليا', d:'الموقفُ التنفيذيُّ والمخاطرُ والقرار — قراءةً',
    guide:'دليل الإدارة العليا — الموقف والقرار',
    /* V16.25: الخريطةُ ولوحةُ الفريق — من فوقُ يرى ما تحته كلَّه، قراءةً */
    nav:['map','mywork','board','exec','mfu','mweek','msurv','minst','mcos','mobs','mreq','mdaily','kiosk','over','wbs','wtask','now','wplan','pace','miles','evm','budm','risks','chg','ncr','repcenter','exp','diary','pmi','lessons','stake','reg','guide','acct','notif'],
    can:{ provision:1, edit:0, approve:0, settings:0, money:1, inventory:0, workshop:0,
          exportAll:1, importAll:0, delete:0, users:0, phones:0 } },

  /* الأدمنُ فوق المهندس: يملك كلَّ شيءٍ ويُدير الأدوارَ نفسَها.
     والمهندسُ يرث منه ولا يملك تبديلَ الأدوار — فمن يضبط الصلاحياتِ لا
     يُصلح لأن يوسّع صلاحيةَ نفسِه بلا رقيب. */
  admin:{
    n:'مدير المشروع', d:'صلاحيةٌ كاملة — ويُدير الأدوارَ والحسابات',
    guide:'دليل المهندس — إدارة المشروع', nav:'*',
    can:{ provision:1, edit:1, approve:1, settings:1, money:1, inventory:1, workshop:1,
          exportAll:1, importAll:1, delete:1, users:1, phones:1, roles:1, fleet:1, perms:1, minapprove:1 } },

  engineer:{
    n:'مهندس', d:'صلاحية كاملة — يدير الحسابات والاعتمادات',
    guide:'دليل المهندس — إدارة المشروع',
    nav:'*',   /* بما فيه بند «الإعدادات» الذي يفتح الشاشة الكاملة */
    can:{ provision:1, edit:1, approve:1, settings:1, money:1, inventory:1, workshop:1,
          exportAll:1, importAll:1, delete:1, users:1, phones:1, perms:1 }
  },
  supervisor:{
    n:'مشرف', d:'الميدان ولوحة المتابعة — يسجّل الزيارةَ على أيِّ نقطة، ويعدّل بياناتِ النقطة الأساسية، ويردّ زيارةَ فريقه للتصحيح، ويُنشئ فنيّيه — والاعتمادُ والتصنيفُ للمهندس',   /* (V28.6) */
    guide:'دليل الفني والمشرف — العمل الميداني',
    /* V16.26: المشرفُ يرى الطلباتِ والتوزيع — طلباتِ زيارةِ فريقه وسجلَّ إسناداته
       وتوزيعَه؛ نطاقُ سحبه شجرتُه فلا يرى إلا ما يخصُّه */
    nav:['map','mywork','sites','sel','svForm','insForm','newsite','co','recs','tools','mine','over','wbs','wtask','now','pace','inst','reg','chalm','dis','users','req','reqreg','assign','guide','acct'],
    can:{ provision:1, edit:1, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:0, importAll:0, delete:0, users:0, phones:1 }
  },
  viewer:{
    n:'وزارة', d:'متابعةٌ وتصدير — لا تكتب حرفًا، والهواتف محجوبة حتى في القواعد',
    guide:'دليل الوزارة — المتابعة',
    /* V16.36: «الوتيرة» و«اليومي» و«التركيب» أرقامٌ تعرضها «نظرة عامة» و«مركز
       التقارير» نفسُها — فحُذفت من الوزارة لتبقى شاشاتُها ستًّا يُتابَع منها
       العمل: الخريطةُ ونظرةٌ عامةٌ والآنَ ومركزُ التقارير والمعالمُ والسجل. */
    /* V16.47: «المسح الميداني» ضمن متابعة العمل الميداني — تُتابَع كلُّ زيارةٍ
       ومن زارها ومتى، قراءةً؛ والأزرارُ لمن يملكها لا لها */
    /* V16.55: الوزارةُ ترى حساباتِ الوزارة وحدَها — قراءةً (can.users = 0) */
    /* V16.65: «المتعذّر والراكد» للوزارة قراءةً — بصوره وسببه وقرار المهندس */
    /* V16.66: اعتمادُ الوزارة لإعداد التركيب — فعلُها الوحيد في النظام */
    nav:['map','mfu','mweek','msurv','minst','mcos','mobs','mreq','mdaily','kiosk','over','wbs','wtask','now','repcenter','exp','diary','miles','reg','co','survey','minappr','stuck','chalm','dis','ncr','users','guide','acct'],
    /* minapprove: اعتمادُ إعداد التركيب — الفعلُ الوحيدُ الذي تكتبه الوزارة */
    can:{ edit:0, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:1, importAll:0, delete:0, users:0, phones:0, minapprove:1 }
  },
  /* الفني يرث «مشرف» ويعمل تحته: يرى المُسند إليه وينفّذه ولا يعتمد شيئًا */
  tech:{
    n:'فني', d:'ينفّذ ما يُسند إليه تحت مشرفه', base:'supervisor', kind:'*',
    guide:'دليل الفني — العمل الميداني',
    nav:['map','mywork','sites','sel','svForm','insForm','newsite','recs','mine','guide','acct'],
    can:{ edit:1, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:0, importAll:0, delete:0, users:0, phones:1 }
  },

  /* الفرق أدوارٌ مخصَّصةٌ ترث «مشرف» ويقيّدها نوعُ مهمتها — لا دورٌ أساسيٌّ جديد */
  cprep:{
    n:'فريق التهيئة', d:'الورشة — تهيئةً وحدها', base:'supervisor', kind:'prep',
    guide:'دليل الورشة — التهيئة',
    nav:['mywork','sites','recs','mine','wos','wday','guide','acct'],
    can:{ edit:1, approve:0, settings:0, money:0, inventory:0, workshop:1,
          exportAll:0, importAll:0, delete:0, users:0, phones:1 }
  },
  casm:{
    n:'فريق التجميع', d:'الورشة — تجميعًا وحده', base:'supervisor', kind:'asm',
    guide:'دليل الورشة — التجميع',
    nav:['mywork','sites','recs','mine','wos','wday','guide','acct'],
    can:{ edit:1, approve:0, settings:0, money:0, inventory:0, workshop:1,
          exportAll:0, importAll:0, delete:0, users:0, phones:1 }
  },
  cins:{
    n:'فريق التركيب', d:'الميدان — تركيبًا وتوثيقًا', base:'supervisor', kind:'install',
    guide:'دليل الميدان — التركيب',
    nav:['map','mywork','sites','sel','svForm','insForm','newsite','recs','mine','guide','acct'],
    can:{ edit:1, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:0, importAll:0, delete:0, users:0, phones:1 }
  },

  /* ثلاثةٌ مكتبية: كلٌّ يفتح بابَه ولا يفتح غيرَه */
  buyer:{
    n:'مشتريات', d:'يسجّل المشترياتِ ويتابع المورّدين — ولا يعتمد ولا يصرف عهدة',
    guide:'دليل المهندس — إدارة المشروع',
    nav:['buys','trials','ships','fleet','fleetAsn','fleetCost','over','guide','acct','notif'],
    can:{ edit:1, approve:0, settings:0, money:1, inventory:0, workshop:0,
          exportAll:1, importAll:1, delete:0, users:0, phones:1, fleet:1 } },

  store:{
    n:'مستودع', d:'يستلم التوريدَ ويصرف العهدةَ ويستقبل المرتجَع',
    guide:'دليل الميدان — التركيب',
    nav:['invb','invmv','wos','stock','ships','fleet','over','guide','acct','notif'],
    can:{ edit:1, approve:0, settings:0, money:0, inventory:1, workshop:1,
          exportAll:1, importAll:1, delete:0, users:0, phones:1 } },

  acct:{
    n:'محاسب', d:'يقرأ المالَ ويصدّره — ولا يسجّل شراءً ولا يعتمده',
    guide:'دليل المهندس — إدارة المشروع',
    nav:['buys','trials','ipc','budget','budm','evm','exec','fleetCost','over','guide','acct','notif'],
    can:{ edit:0, approve:0, settings:0, money:1, inventory:0, workshop:0,
          exportAll:1, importAll:0, delete:0, users:0, phones:0 } },

  /* اثنان ميدانيان تحت المشرف */
  helper:{
    n:'مساعد فني', d:'يعمل مع الفنيّ ولا يُسنَد إليه وحدَه',
    base:'supervisor', kind:'*', guide:'دليل الفني — العمل الميداني',
    nav:['map','mywork','sites','svForm','insForm','newsite','mine','guide','acct'],
    can:{ edit:1, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:0, importAll:0, delete:0, users:0, phones:0 } },

  driver:{
    n:'سائق', d:'ينقل الفريقَ والعُهدةَ — يرى مهامَّه وسيارتَه ولا يكتب سجلًّا',
    base:'supervisor', guide:'دليل الفني — العمل الميداني',
    nav:['map','mywork','myveh','mine','guide','acct'],
    can:{ edit:0, approve:0, settings:0, money:0, inventory:0, workshop:0,
          exportAll:0, importAll:0, delete:0, users:0, phones:0 } }
};

/* الدورُ قبل الدخول أدنى الأدوار — لا مهندسٌ كاملُ الصلاحية: يُرفَع بعد أن
   تُثبِت المصادقةُ الهويةَ، فلا يرى من لم يدخل شيئًا لا يراه الفنيّ. */
var ROLE = 'tech';
/* ═══ صاحبُ المشروع لا يُحبَس ═══
   القاعدةُ تعرف بريدَ صاحب المشروع مديرًا مهما قالت وثيقتُه (`isBoss`). وكان
   التطبيقُ يقرأ الدورَ من الوثيقة وحدَها — فإن كتبت عليها إعادةُ إصدارٍ أو
   لصقةٌ دورًا أدنى صار مطّلعًا في شاشاته: لا إعداداتٍ ولا حساباتٍ ولا سبيلَ
   لإصلاح نفسِه. التطبيقُ يطابق القاعدةَ: بريدُ صاحب المشروع مديرٌ دائمًا. */
var BOSS_EMAILS = ['mohammed.safwat@afaqy.com', 'm.safwat@nusuk.local'];
function isBossHere(){
  try { var u = FB.auth && FB.auth.currentUser; return !!(u && BOSS_EMAILS.indexOf(String(u.email || '').toLowerCase()) > -1); }
  catch (e){ return false; }
}
function R(){ return ROLES[ROLE] || ROLES.engineer; }
function may(k){
  /* «provision» تُشتقُّ من الرتبة: المشرفُ فما فوق — لا تُكتَب في كلِّ دور */
  if (k === 'provision') return rankOf(ROLE) >= rankOf('supervisor');
  /* ما لمصفوفة القاعدة قولٌ صريحٌ فيه يَغلب: فلا يظهر زرٌّ تردّه القاعدة */
  var pmk = PM_CAP[k];
  if (pmk){
    var ov = pmOverride(pmk[0], pmk[1], ROLE);
    if (ov !== null) return ov;
  }
  return !!R().can[k];
}
/* ═══ مصفوفةُ صلاحيات القاعدة ═══
   القاعدةُ ملفٌّ يُنشَر مع كلِّ دفعة — ومن أراد أن يفتح المشترياتِ لدور
   المشتريات انتظر إصدارًا. صارت القاعدةُ تقرأ وثيقةً واحدةً settings/perms
   مع كلِّ طلب: لكلِّ مجموعةٍ ولكلِّ دور {r,w,a,d} — القيمةُ الصريحةُ تحكم
   وnull يعني الافتراضيَّ المكتوبَ في القاعدة نفسِها. فما يُحفَظ هنا ينفذ في
   القاعدة في اللحظة نفسِها بلا نشر. والثوابتُ خارجها: الأثرُ لا يُحذَف،
   والهواتفُ لا تراها الوزارةُ ولا الإدارةُ العليا، وصاحبُ المشروع ببريده لا
   تحكمه — فلا يُقفَل على نفسه. والافتراضياتُ هنا مرآةُ القاعدة حرفًا بحرف
   ويحرسها جردٌ يقرأ الملفين. */
var PM_OPS = [['r','قراءة'], ['w','كتابة'], ['a','اعتماد'], ['d','حذف']];
var PM_COLS = [
  /* [المجموعة، الاسم، الافتراضيُّ لكلِّ عملية كما في القاعدة] */
  ['recs','زيارات المسح',              { r:'ok', w:'canW', a:'mgr', d:'mgr' }],
  ['inss','التركيبات',                  { r:'ok', w:'canW', a:'mgr', d:'mgr' }],
  ['tasks','المهام والإسنادات',         { r:'ok', w:'canW', d:'mgr' }],
  ['maints','زيارات الصيانة',           { r:'ok', w:'canW', d:'canW' }],
  ['steps','آخر ما تمّ',                { r:'ok', w:'canW' }],
  ['dismantles','الفك',                 { r:'ok', w:'canW', d:'mgr' }],
  ['photos','الصور',                    { r:'ok', w:'canW', d:'mgr' }],
  ['newsites','المواقع المقترحة',       { r:'ok', w:'canW', d:'mgr' }],
  ['coreqs','طلبات الشركات',            { r:'ok', w:'canW', a:'mgr', d:'mgr' }],
  ['fixreqs','طلبات التصويب',           { r:'ok', w:'canW', a:'mgr', d:'mgr' }],
  ['colist','قائمة الشركات',            { r:'ok', w:'mgr' }],
  ['users','الحسابات',                  { w:'mgr', d:'mgr' }],
  ['settings','الإعدادات',              { w:'mgr' }],
  ['phones','هواتف المكتب والشركات',    { r:'canW', w:'mgr' }],
  ['events','سجل الأحداث',              { r:'ok', w:'canW' }],
  ['stats','اللقطات اليومية',           { r:'ok', w:'canW', d:'mgr' }],
  ['sites','عناوين الشبكة',             { r:'ok', w:'canW' }],
  ['hb','إشارات الأجهزة',                { r:'ok', w:'canW', d:'canW' }],
  ['hbev','انتقالات صحة الأجهزة',       { r:'ok', w:'canW' }],
  ['inventory','حركات المخزون',         { r:'ok', w:'canW', d:'mgr' }],
  ['purchases','المشتريات',             { r:'mgr', w:'mgr', d:'mgr' }],
  ['ships','الشحنات',                   { r:'ok', w:'canW', d:'mgr' }],
  ['workreqs','طلبات الورشة',           { r:'ok', w:'canW', d:'mgr' }],
  ['teams','الفرق',                     { r:'ok', w:'canW', d:'mgr' }],
  ['vehicles','السيارات',               { r:'ok', w:'canW', d:'canW' }],
  ['vehAsn','إسناد السيارات',           { r:'ok', w:'canW' }],
  ['bonus','نقاط الزيادة',              { r:'ok', w:'r90', d:'r90' }],
  ['baseline','خط الأساس',              { r:'ok', w:'mgr' }],
  ['changes','طلبات التغيير',           { r:'ok', w:'canW', a:'mgr' }],
  ['hse','السلامة والحوادث',            { r:'ok', w:'canW', d:'mgr' }],
  ['ncr','عدم المطابقة',                { r:'ok', w:'canW', a:'mgr', d:'mgr' }],
  ['ipc','المستخلصات',                  { r:'mgrOrViewer', w:'mgr' }],
  ['accounts','الحسابات المالية (قديم)', { r:'mgr', w:'mgr' }],
  ['props','مواقع مقترحة (قديم)',       { r:'ok', w:'canW', d:'mgr' }],
  ['srvorders','أوامر الخدمة (قديم)',   { r:'ok', w:'canW', d:'mgr' }]
];
/* القدراتُ التي تقابلها خليةٌ في المصفوفة: ما قالته المصفوفةُ صراحةً يَغلب ROLES */
var PM_CAP = { edit:['recs','w'], approve:['recs','a'], settings:['settings','w'], money:['purchases','r'],
               users:['users','w'], delete:['recs','d'], phones:['phones','r'],
               inventory:['inventory','w'], workshop:['workreqs','w'] };
/* الثوابتُ التي لا تُفتَح من المصفوفة — تُعرَض مقفولةً */
function pmLocked(col, op, role){
  return col === 'phones' && op === 'r' && (role === 'viewer' || role === 'exec');
}
function pmDefault(col, op, role){
  var spec = PM_COLS.filter(function(c){ return c[0] === col; })[0];
  var d = spec && spec[2][op];
  if (!d) return false;
  var mgr = role === 'engineer' || role === 'admin';
  var fieldR = ['tech','cprep','casm','cins','helper','driver'].indexOf(role) > -1;
  var canW = mgr || ['supervisor','buyer','store','acct'].indexOf(role) > -1 || fieldR;
  var vw = role === 'viewer' || role === 'exec';
  return d === 'ok' ? true : d === 'canW' ? canW : d === 'mgr' ? mgr
       : d === 'r90' ? rankOf(role) >= 90 : d === 'mgrOrViewer' ? (mgr || vw) : false;
}
var PM_DRAFT = null, PM_ROLE = 'tech', PM_AT = 0;
function pmMatrix(){ return (PM_DRAFT || (CFG.perms && CFG.perms.m) || {}); }
function pmOverride(col, op, role){
  var v = ((pmMatrix()[col] || {})[role] || {})[op];
  return (v === true || v === false) ? v : null;
}
function pmGet(col, op, role){
  if (pmLocked(col, op, role)) return false;
  var ov = pmOverride(col, op, role);
  return ov === null ? pmDefault(col, op, role) : ov;
}
function pmToggle(col, op, role){
  if (!may('perms')){ toast(t('ضبطُ صلاحيات القاعدة للمهندس فما فوق')); return; }
  if (pmLocked(col, op, role)){ toast(t('ثابتٌ في القاعدة لا يُفتَح من هنا')); return; }
  if (!PM_DRAFT) PM_DRAFT = JSON.parse(JSON.stringify((CFG.perms && CFG.perms.m) || {}));
  PM_DRAFT[col] = PM_DRAFT[col] || {}; PM_DRAFT[col][role] = PM_DRAFT[col][role] || {};
  var ov = pmOverride(col, op, role);
  /* ضغطةٌ تقلب الافتراضيَّ إلى ضدّه، وضغطةٌ تعيده — null يعني افتراضيَّ القاعدة */
  PM_DRAFT[col][role][op] = (ov === null) ? !pmDefault(col, op, role) : null;
  render(1);
}
function pmDirty(){ return !!PM_DRAFT; }
function pmSave(){
  if (!may('perms')){ toast(t('ضبطُ صلاحيات القاعدة للمهندس فما فوق')); return false; }
  if (!PM_DRAFT){ toast(t('لا تغييرَ يُحفَظ')); return false; }
  var m = PM_DRAFT, changed = 0;
  Object.keys(m).forEach(function(c){ Object.keys(m[c]).forEach(function(r){ Object.keys(m[c][r]).forEach(function(o){
    var v = m[c][r][o]; if (v === true || v === false) changed++;
  }); }); });
  var doc = { m:m, v:((CFG.perms && CFG.perms.v) || 0) + 1, at:Date.now(), by:STATE.meta.name || '' };
  CFG.perms = doc;
  CORE.set('cfg', 'perms', doc);
  PM_DRAFT = null;
  logEvent('مصفوفة صلاحيات القاعدة — ' + nm(changed) + ' خليةً معدَّلة · نسخة ' + nm(doc.v));
  toast(t('حُفظت — تنفذ في القاعدة الآن') + ' \u00b7 ' + nm(changed) + ' ' + t('خليةً معدَّلة'));
  render(1);
  return true;
}
function pmResetRole(role){
  if (!may('perms')){ toast(t('ضبطُ صلاحيات القاعدة للمهندس فما فوق')); return; }
  if (!PM_DRAFT) PM_DRAFT = JSON.parse(JSON.stringify((CFG.perms && CFG.perms.m) || {}));
  Object.keys(PM_DRAFT).forEach(function(c){
    if (PM_DRAFT[c][role]) Object.keys(PM_DRAFT[c][role]).forEach(function(o){ PM_DRAFT[c][role][o] = null; });
  });
  render(1);
}
function pmRefresh(force){
  if (!FB.ready || !FB.db) return Promise.resolve(false);
  if (!force && Date.now() - PM_AT < 60000) return Promise.resolve(false);
  PM_AT = Date.now();
  return FB.db.collection('settings').doc('perms').get().then(function(doc){
    FB.readCount = (FB.readCount || 0) + doc.size;
    if (doc && doc.exists) CFG.perms = doc.data();
    return true;
  }).catch(function(e){ softErr('سحب مصفوفة الصلاحيات', e, ''); return false; });
}
function pmCard(){
  var roles = Object.keys(ROLES);
  if (roles.indexOf(PM_ROLE) < 0) PM_ROLE = roles[0];
  var ovN = 0, M = pmMatrix();
  Object.keys(M).forEach(function(c){ Object.keys(M[c]).forEach(function(r){ Object.keys(M[c][r]).forEach(function(o){
    if (M[c][r][o] === true || M[c][r][o] === false) ovN++; }); }); });
  var cur = CFG.perms || {};
  return alertBox('info', 'ما تحفظه هنا تقرؤه قاعدةُ البيانات مع كلِّ طلبٍ فينفذ فورًا بلا نشر. الافتراضيُّ هو ما كانت عليه القاعدة، والمعدَّلُ يُعلَّم. والثوابتُ مقفولة: سجلُّ الأحداث لا يُحذَف، والهواتفُ لا تراها الوزارة، وصاحبُ المشروع لا يُقفَل على نفسه.')
    + stats([['خلايا معدَّلة', N(ovN), ovN ? 'wrn' : ''],
             ['نسخة المصفوفة', N(cur.v || 0)],
             ['آخر حفظ', cur.at ? '<span class="num">' + esc(agoTxt(cur.at)) + '</span>' : '—']])
    + '<div class="chips" role="tablist" style="margin:0 0 10px">' + roles.map(function(k){
        return '<button type="button" class="chip' + (k === PM_ROLE ? ' on' : '') + '" role="tab" data-pmrole="' + esc(k) + '">'
          + esc(t(ROLES[k].n)) + '</button>';
      }).join('') + '</div>'
    + cardFlush(t('صلاحيات') + ' — ' + esc(t(ROLES[PM_ROLE].n)),
        table(['المجموعة'].concat(PM_OPS.map(function(o){ return o[1]; })),
          PM_COLS.map(function(c){
            return ['<strong>' + esc(t(c[1])) + '</strong> <span class="hint" style="margin:0" dir="ltr">' + esc(c[0]) + '</span>'].concat(
              PM_OPS.map(function(o){
                if (!c[2][o[0]]) return '<span class="hint" style="margin:0">—</span>';
                var lock = pmLocked(c[0], o[0], PM_ROLE), on = pmGet(c[0], o[0], PM_ROLE), ov = pmOverride(c[0], o[0], PM_ROLE);
                var cls = lock ? 'off' : on ? 'ok' : 'off';
                var mark = lock ? ' \u{1F512}' : (ov === null ? '' : ' *');
                return may('perms') && !lock
                  ? '<button type="button" class="pill ' + cls + '" style="border:0;cursor:pointer" data-pmk="' + esc(c[0] + '|' + o[0]) + '" title="'
                    + esc(t(ov === null ? 'افتراضيُّ القاعدة — اضغط لتقلبه' : 'معدَّل — اضغط لتعيده إلى الافتراضي')) + '">'
                    + (on ? '\u2713' : '\u2717') + mark + '</button>'
                  : pill((on ? '\u2713' : '\u2717') + mark, cls);
              }));
          })),
        (may('perms')
          ? btn('\u{1F4BE} ' + t('احفظ في القاعدة'), pmDirty() ? 'btn-primary btn-sm' : 'btn-secondary btn-sm', ' data-pmsave="1"')
            + btn('\u21BA ' + t('أعد هذا الدور إلى الافتراضي'),'btn-quiet btn-sm',' data-pmreset="1"')
            + btn('\u21BB ' + t('اقرأ من القاعدة'),'btn-quiet btn-sm',' data-pmrefresh="1"')
          : '')
        + '<p class="hint" style="margin:9px 0 0">' + esc(t('✓ مسموح · ✗ مرفوض · * معدَّلٌ عن الافتراضي · 🔒 ثابتٌ في القاعدة. «اعتماد» = كتابةُ approved/معتمد. الحذفُ الجماعيُّ (التصفير) يتبع خانةَ الحذف.')) + '</p>');
}
/* المشرفُ والمهندسُ فقط — لا الفنيُّ ولا قائدُ فريقٍ ميدانيٍّ، رغم أن
   الثلاثةَ يرثون can.edit من «مشرف» فيجتازون may('edit') سواءً بسواء.
   نقاطُ الزيادة قرارُ من يشرف لا من يُنفَّذ له. */
/* ═══ سلسلةُ الإدارة: مديرٌ لا مشرف ═══
   كان الحقلُ يُسمّى «مشرفه المباشر» ويُكتَب اسمًا حرًّا — فيُكتَب اسمُ من
   لا حسابَ له، ويُجعَل الفنيُّ مشرفًا على مشرفه، ولا شيءَ يمنع. صار
   «مديره»: حسابًا من النظام مرتبتُه أعلى. فالفنيُّ مديرُه مشرفُه،
   والمشرفُ مديرُه المهندس، والمهندسُ مديرُه مديرُ المشروع.
   والمرتبةُ تُقرأ من الدور — والدورُ يُشتقُّ من الوظيفة. */
var ROLE_RANK = { exec:110, admin:100, engineer:90, supervisor:70,
                  cprep:50, casm:50, cins:50,
                  tech:30, buyer:30, store:30, acct:30, helper:30, driver:30,
                  viewer:10 };
function rankOf(role){ return ROLE_RANK[role] != null ? ROLE_RANK[role] : 30; }
/* ═══ الأدوارُ المخصَّصة ═══
   كانت الأدوارُ أربعةَ عشرَ مكتوبةً في الشيفرة وفي القاعدة، ومن أراد «مندوبَ
   شركة» أو «قائدَ فرقة» انتظر إصدارًا. صار الدورُ يُضاف من شاشة الأدوار:
   اسمٌ وأساسٌ ورتبة — يرث شاشاتِ أساسه وقدراتِه، وتُعدَّل قدراتُه هنا وخانتُه
   في مصفوفة القاعدة بمفتاحه، والقاعدةُ تعامله بأساسه ورتبته (settings/roles)
   دون نشر. ويُحذَف إن لم يبقَ عليه حساب. والأساسيّةُ لا تُحذَف. */
var BASE_ROLES = ['exec','admin','engineer','supervisor','viewer','tech','cprep','casm','cins','buyer','store','acct','helper','driver'];
function effRole(r){ var x = ROLES[r]; return (x && x.custom && x.base) ? x.base : r; }
function rolesApply(){
  var R9 = (CFG.roles && CFG.roles.r) || {};
  /* ما زال مخصَّصًا وليس في الوثيقة: أُزيل */
  Object.keys(ROLES).forEach(function(k){ if (ROLES[k].custom && !R9[k]){ delete ROLES[k]; delete ROLE_RANK[k]; } });
  Object.keys(R9).forEach(function(k){
    var c = R9[k] || {}, b = ROLES[c.base] && !ROLES[c.base].custom ? ROLES[c.base] : ROLES.tech;
    if (BASE_ROLES.indexOf(k) > -1) return;   /* لا يُكتَب فوق أساسيّ */
    ROLES[k] = { n:c.n || k, d:c.d || (t('يرث') + ' ' + t(b.n)), base:c.base || 'tech', custom:true,
                 kind:b.kind, guide:b.guide, nav:Array.isArray(b.nav) ? b.nav.slice() : b.nav,
                 can:Object.assign({}, b.can || {}) };
    ROLE_RANK[k] = (typeof c.rank === 'number') ? c.rank : rankOf(c.base || 'tech');
  });
  /* القدراتُ المخصَّصةُ فوق الجميع */
  var caps = CFG.roleCaps || {};
  Object.keys(caps).forEach(function(k){
    if (ROLES[k] && caps[k] && typeof caps[k] === 'object') ROLES[k].can = Object.assign({}, ROLES[k].can || {}, caps[k]);
  });
  PERM_CACHE = null;
}
function roleUsers(k){
  return Object.keys(STATE.users || {}).filter(function(uid){ var u = STATE.users[uid]; return u && u.role === k; }).length;
}
function roleAdd(name, base, rank){
  if (!may('roles')){ toast(t('إضافةُ الأدوار لمدير المشروع وحده')); return false; }
  name = String(name || '').trim();
  if (!name){ toast(t('اكتب اسمَ الدور')); return false; }
  if (BASE_ROLES.indexOf(base) < 0){ toast(t('اختر الأساسَ من الأدوار الأساسية')); return false; }
  if (Object.keys(ROLES).some(function(k){ return ROLES[k].n === name; })){ toast(t('اسمُ الدور مستعملٌ من قبل')); return false; }
  var rk = cfgN(rank); if (!rk) rk = rankOf(base);
  if (rk > rankOf(ROLE)){ toast(t('لا تُنشئ دورًا أعلى من رتبتك')); return false; }
  var key = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  CFG.roles = CFG.roles || { r:{} }; CFG.roles.r = CFG.roles.r || {};
  CFG.roles.r[key] = { n:name, base:base, rank:rk, at:Date.now(), by:STATE.meta.name || '' };
  CFG.roles.v = (CFG.roles.v || 0) + 1; CFG.roles.at = Date.now();
  CORE.set('cfg', 'roles', CFG.roles);
  rolesApply();
  logEvent('دور جديد — ' + name + ' · ' + t('يرث') + ' ' + ROLES[base].n + ' · ' + t('رتبة') + ' ' + nm(rk));
  toast(t('أُضيف الدور') + ' ' + name + ' — ' + t('تنفذ في القاعدة الآن'));
  render(1);
  return key;
}
function roleDel(k){
  if (!may('roles')){ toast(t('حذفُ الأدوار لمدير المشروع وحده')); return false; }
  if (!ROLES[k] || !ROLES[k].custom){ toast(t('الأدوارُ الأساسيةُ لا تُحذَف')); return false; }
  var nU = roleUsers(k);
  if (nU){ toast(t('لا يُحذَف دورٌ عليه حسابات') + ' — ' + nm(nU)); return false; }
  var nm2 = ROLES[k].n;
  delete CFG.roles.r[k]; CFG.roles.v = (CFG.roles.v || 0) + 1; CFG.roles.at = Date.now();
  CORE.set('cfg', 'roles', CFG.roles);
  if (CFG.roleCaps && CFG.roleCaps[k]){ delete CFG.roleCaps[k]; CORE.set('cfg', 'roleCaps', CFG.roleCaps); }
  rolesApply();
  logEvent('حذف دور — ' + nm2);
  toast(t('حُذف الدور') + ' ' + nm2);
  render(1);
  return true;
}
/* خليةٌ في مصفوفة القاعدة تُكتَب صراحةً وتُحفَظ فورًا — من تبديل قدرةٍ في شاشة الأدوار */
function pmSetDirect(col, op, role, val){
  var m = JSON.parse(JSON.stringify((CFG.perms && CFG.perms.m) || {}));
  m[col] = m[col] || {}; m[col][role] = m[col][role] || {}; m[col][role][op] = !!val;
  var doc = { m:m, v:((CFG.perms && CFG.perms.v) || 0) + 1, at:Date.now(), by:STATE.meta.name || '' };
  CFG.perms = doc; PM_DRAFT = null;
  CORE.set('cfg', 'perms', doc);
}
/* ═══ الرتبةُ أعلى الاثنين ═══
   كان دورُ الوظيفة يغلب دورَ الحساب دائمًا. فمن دورُ حسابه «الإدارة العليا»
   ووظيفتُه «مدير المشروع» تُقرأ رتبتُه رتبةَ مديرِ المشروع — فلا يصلح مديرًا
   لمديرِ المشروع، ويُقال «لا حسابَ أعلى رتبةً بعد» وهو موجود.
     والوظيفةُ وصفُ عملٍ لا سقفُ صلاحية: من رُفع دورُه صراحةً لا تخفضه
   وظيفتُه القديمة. فتُقرأ الرتبةُ أعلى الاثنين. */
function roleOfUser(u){
  if (!u) return '';
  var byJob = '';
  if (u.job && typeof jobOf === 'function'){
    var j = jobOf(u.job);
    if (j && j.role) byJob = j.role;
  }
  var byAcc = u.role || '';
  if (!byJob) return byAcc;
  if (!byAcc) return byJob;
  return rankOf(byAcc) >= rankOf(byJob) ? byAcc : byJob;
}
/* من يصلح مديرًا لصاحب هذا الدور: كلُّ حسابٍ مرتبتُه أعلى منه */
/* ═══ من تحتَ فلان — الشجرةُ كلُّها لا الصفُّ الأوّل ═══
   الإدارةُ سلسلةٌ: شعراوي ← صفوت ← شكري ← لاشين ← المهندسون ← المشرفون ←
   الفنيّون ← المساعدون. ومن فوقُ يرى ما تحته إلى آخره، لا من يتبعه مباشرةً. */
function underNames(name){
  var U = STATE.users || {}, kids = {}, out = [], seen = {};
  Object.keys(U).forEach(function(k){
    var u = U[k]; if (!u || !u.name || u.active === false) return;
    (kids[u.sup || ''] = kids[u.sup || ''] || []).push(u.name);
  });
  var stack = [name || ''];
  while (stack.length){
    (kids[stack.pop()] || []).forEach(function(c){ if (!seen[c]){ seen[c] = 1; out.push(c); stack.push(c); } });
  }
  return out;
}
function mgrCandidates(role, exceptUid){
  var r = rankOf(role), U = STATE.users || {}, out = [];
  /* كان المديرُ من رتبةٍ أعلى حصرًا، فلم يُمكن أن يدير مهندسٌ مهندسًا — والسلسلةُ
     في الأرض أعمقُ من سلّم الأدوار (شكري ← لاشين ← المهندسون). فصار: الأعلى أو
     المساوي، ما لم يكن تحته أصلًا (فلا دورة). والوزارةُ مديرُها من المهندس فصاعدًا. */
  var eq = r === rankOf('engineer');           /* المساواةُ للمهندسين وحدَهم: مهندسٌ يدير مهندسًا — والباقي سلّم */
  var floor = effRole(role) === 'viewer' ? rankOf('engineer') : r;
  var me = exceptUid && U[exceptUid] ? U[exceptUid].name : '';
  var below = me ? underNames(me) : [];
  Object.keys(U).forEach(function(uid){
    var u = U[uid];
    if (!u || !u.name || u.active === false || uid === exceptUid) return;
    var ur = rankOf(roleOfUser(u));
    if (effRole(role) === 'viewer' ? ur < floor : (eq ? ur < r : ur <= r)) return;
    if (below.indexOf(u.name) > -1 || (me && u.name === me)) return;
    out.push({ uid:uid, n:u.name, role:roleOfUser(u) });
  });
  return out.sort(function(a, b){ return rankOf(b.role) - rankOf(a.role) || a.n.localeCompare(b.n, 'ar'); });
}
function mgrOptions(role, cur, exceptUid){
  var L = mgrCandidates(role, exceptUid);
  return '<option value="">— ' + esc(t('بلا مدير')) + ' —</option>'
    + L.map(function(x){
        return '<option value="' + esc(x.n) + '"' + (cur === x.n ? ' selected' : '') + '>'
          + esc(x.n) + ' \u00b7 ' + esc(t((ROLES[x.role] || {}).n || x.role)) + '</option>';
      }).join('')
    + (L.length ? '' : '<option value="" disabled>' + esc(t('لا حسابَ مرتبتُه أعلى بعد')) + '</option>');
}
/* أقسامُ الشركة — القائمةُ نفسُها التي تعرضها «خريطة التغطية» */
function deptOptions(cur){
  return '<option value="">— ' + esc(t('بلا قسم')) + ' —</option>'
    + ORG.co.units.map(function(u){
        return '<option value="' + esc(u.id) + '"' + (cur === u.id ? ' selected' : '') + '>'
          + u.i + ' ' + esc(t(u.n)) + '</option>';
      }).join('');
}
function deptName(id){
  var u = ORG.co.units.filter(function(x){ return x.id === id; })[0];
  return u ? (u.i + ' ' + t(u.n)) : '';
}
function maySupEng(){ return mayBonus(); }   /* اسمٌ قديم — النقاطُ للمهندس فما فوق */
/* القدرةُ المعلنةُ تُسأل هنا: كانت `can` تعلن إحدى عشرةَ قدرةً ولا يُسأل منها
   إلا أربع، فسبعٌ إعلانٌ بلا حارس. وكلُّ شاشةٍ ترتبط بقدرتها فيُسأل عنها. */
/* «موقع جديد» في قائمة كلِّ دورٍ ميدانيٍّ يملك التسجيل (V16.80): كان الزرُّ
   يُعرَض على الخريطة لمن يملك «edit»، والصفحةُ ليست في قائمته — فيُردُّ إلى
   أوّلِ شريحةٍ مرئيةٍ من «النماذج» وهي «المسح»، فيجد المشرفُ نموذجَ مسحٍ مكان
   نموذج الموقع الجديد. الزرُّ يُعرَض والصفحةُ تُرى — أو لا يُعرَض. */
var PAGE_CAP = {
  /* «الملخّص المالي» شاشةُ العميل لا شاشةُ الشركة: المستخلصُ المعتمَدُ وحده
     يراه، وهو مصرَّحٌ له في nav — فلا يُقيَّد بقدرة المال الداخلية. */
  ipc:'money', buys:'money', trials:'money', budget:'money', exec:'money',
  /* البلاغات: يراها من يبلّغ ومن يُصلح — لا قدرةَ خاصةً لها */
  invb:'inventory', invmv:'inventory', stock:'inventory',
  wos:'workshop', wday:'workshop',
  /* شاشةُ الحسابات كانت مقيَّدةً بقدرة الإنشاء وحدَها — فمن يقرأ ولا يُنشئ
     (الوزارةُ) لا يراها. صار القيدُ في القائمة (nav) والصفوفُ في canSeeUser،
     والأزرارُ في قدراتها — فتُقرأ بلا أن تُكتَب. */
  perms:'perms', assignRole:'users', roles:'users',
  svForm:'edit', insForm:'edit', newsite:'edit',
  qa:'approve', appr:'approve', esc:'approve', svappr:'approve',
  visits:'settings', prep:'settings', asm:'settings', install:'settings',
  disp:'settings', items:'settings', buycat:'settings', sup:'settings', consts:'settings',
  exp:'exportAll', retain:'delete', sync:'settings'
};
/* ═══ الصفحاتُ المدموجة — شرائحُ لا شاشات ═══
   أربعٌ وتسعون شاشةً في اثنتي عشرةَ مجموعة، وكثيرٌ منها يجيب سؤالًا واحدًا
   لشخصٍ واحد: «السيارات» و«إسناد السيارات» و«سجل عهدة السيارات» و«تكلفة
   الأسطول» و«سيارتي» — خمسُ شاشاتٍ عن الأسطول، يفتحها المرءُ بالتناوب يبحث
   عن رقمه. فجُمع ما يجيب سؤالًا واحدًا في شاشةٍ واحدةٍ بشرائح.

   ولم يُحذَف شيء: كلُّ شريحةٍ كانت صفحةً واحتفظت بمعرِّفها القديم — في
   قوائم الأدوار، وفي PAGE_CAP، وفي كلِّ زرِّ انتقالٍ (data-p / data-goto /
   CUR=). فلا تتغيّر صلاحيةُ أحدٍ ولا ينكسر رابط: المعرِّفُ القديم يُفتَح فيصل
   إلى الأمِّ على شريحته. والشريحةُ لا تظهر إلا لمن كان يرى صفحتَها — بقواعد
   seesPage نفسِها لا بقائمةٍ ثانية.

   كلُّ شريحة: [المعرِّفُ القديم، الاسمُ القصير، الأيقونة، وصفُ الصفحة الأصلية] */
/* السجلّ: الأمُّ وشرائحُها — كلُّ شريحةٍ بمعرِّفها القديم واسمها القصير وأيقونتها ووصفها الأصلي */
var TABS = {
  exp:[
    ['exp','التصدير والاستيراد','\u2B07','ما يخرج من النظام وما يدخل إليه.'],
    ['repcenter','مركز التقارير','\u{1F4D1}','قوائمُ التقارير ودورياتُها وحزمُها.']
  ],
  mywork:[
    ['mywork','مهامي','📋','ما أُسند إليك — وحالةُ كلِّ زيارةٍ منها.','self'],
    ['mine','جدولي','🗓','ما أُسند إليك — وترتيبك بلا أرقام زملائك.'],
    ['myscore','أدائي','🎯','نقاطُك وترتيبُك ومستحقُّك.','self'],
    ['myteam','فريقي','👥','من تحتك ونقاطُهم.','team'],
    ['board','لوحة الفريق','📊','من تحتك في شاشةٍ واحدة: ما أُسند لكلٍّ، وما أنجزه اليوم، وما ينتظر اعتمادك، وآخر ظهور.','team'],
    ['mycrew','شغل فريقي','🔧','ما على فريقك الميداني من عمل.','self']],
  fleet:[
    ['fleet','الأسطول','🚗','أسطولُ المشروع — لوحاتُه ورخصُه وتكلفتُه.'],
    ['fleetAsn','الإسناد','🔑','مَن يقود ماذا ولأيِّ عمل.'],
    ['fleetLog','سجل العُهدة','📒','من كانت معه أيُّ سيارةٍ وفي أيِّ يوم — للمخالفات والمساءلة.'],
    ['fleetCost','التكلفة','💰','ما تكلّفه السياراتُ شهريًّا ومنذ متى تعمل.'],
    ['myveh','سيارتي','🙋','ما أُسنِد إليك من مركبات.']],
  /* متابعةُ الوزارة (V20.0): عناوينُ العرض الأسبوعي الذي كان يُرسَل للاجتماعات */
  mfu:[
    ['mfu','الملخص','📋','الأرقامُ التي يُفتتح بها الاجتماع — ومقارنتُها بالأسبوع الماضي.'],
    ['msurv','المسح الميداني','🔍','نسبةُ المسح وما تبقّى والتحديات — بالمشعر والنوع، وتأكيدُ نقاط منشأة الجمرات بالأدوار.'],   /* (V29.2) */
    ['mweek','المهام الأسبوعية','🗓','مهامُّ الاجتماع كاملةً — تُحدَّث من هنا، وما يعالج تحدّيًا يُعرَف به.'],
    ['minst','حالة التركيبات','🔧','المخيماتُ والممراتُ وكلُّ نوعٍ بنسبة تركيبه في كلِّ مشعر.'],
    ['mcos','شركات الخدمة','🏢','لكلِّ شركةٍ مخيماتُها وما مُسح منها والتحديات — وفي التركيب ما رُكّب ومستواه.'],   /* (V29.1) بحسب المرحلة */
    ['mobs','التحديات والمعوقات','🚧','كلُّ عائقٍ بفئته وجهته وآلية معالجته ومسؤوله وحالته — بفلتر المشعر والنوع.'],
    ['mreq','طلبات الوزارة','📨','ما طلبته الوزارةُ وآخرُ إفادةٍ فيه والدعمُ المطلوب.'],
    ['mdaily','ملخص العمل اليومي','📈','المسح والتركيب والفك والمتعذر يوما بيوم.'],
    ['kiosk','شاشةُ القاعة','🏛','عرضٌ كبيرٌ يُقرأ من آخر القاعة ويتجدّد وحدَه كلَّ دقيقة.']],
  over:[
    ['over','الصورة العامة','📊','الصورة التنفيذية لحظيًّا — تُحدَّث مع كل عملية ميدانية.'],
    ['now','أمس · الآن · غدًا','⏱','ما انتهى، وما يجري الآن ومن يفعله وأين، وما هو مجدولٌ لغد.'],
    ['reg','حسب المشعر والنوع','🗺','التوزيع الكامل بالنسب.'],
    ['pace','الوتيرة والهدف','⏱','المطلوب يوميًّا لبلوغ الموعد، وتاريخ الانتهاء المتوقع.'],
    ['inst','التركيب والجدولة','🔧','ما جُدول وما نُفّذ وما تعذّر — بحالته ونوعه.'],
    ['svdash','تفاصيلُ المسح','📐','ما حُصر فعلًا: الغرفُ والخيام، وما لا تحدّيَ فيه، وما فيه تحدٍّ، وما يحتاج هيكلًا — ولكلِّ رقمٍ قائمتُه، تُصدَّر، ويطير كلُّ سطرٍ إلى نقطته على الخريطة.']],
  pts:[
    ['visits','الزيارات','🔍','وزن زيارة كل نوع وتارجت المسح.'],
    ['prep','التهيئة','⚙','نقاط تهيئة كل جهاز في الورشة.'],
    ['asm','التجميع','🧰','نقاط تجميع مكوّنات البوكس.'],
    ['install','التركيب','🔧','نقاط كل قطعة وتارجت التركيب.'],
    ['disp','الفك','📦','وزن الفك ومعاملا الحالة.']],
  inv:[
    ['invb','الأرصدة','📦','المخزن والعُهدة والتالف — مشتقّةً من دفتر الحركة لا مكتوبةً بإصبع.'],
    ['invmv','دفتر الحركة','📒','إلحاقيٌّ لا يُعدَّل — كل تصحيح حركةٌ جديدة تُوازنه.'],
    ['stock','عُهدة الأجهزة','👤','ما في يد كل منفِّذ الآن — من دفتر الحركة.'],
    ['ships','الشحنات والتوريد','🚛','ما شُحن ومتى يصل — وما تأخّر عن موعده.'],
    ['wos','الطلبات','📥','طلباتُ التهيئة والتجميع — رقمُها وحالتُها ومن نفَّذها ومتى.'],
    ['wday','نقاط اليوم','📆','ما نُفِّذ اليوم — تركيبًا حقيقيًّا؛ والتهيئةُ والتجميعُ حين يُبنى نظامُ طلباتهما.']],
  users:[
    ['users','الحسابات','👤','كل حساب ودوره في مكانٍ واحد — إنشاءً وبحثًا وتصفيةً بالنوع.'],
    ['assignRole','إسناد الأدوار','🔗','من في أيِّ وظيفةٍ وأيِّ فريق.'],
    ['roles','الأدوار والصلاحيات','🛡','الدورُ ما يستطيعه الشخصُ في النظام — لا ما يعمله في الميدان.'],
    ['jobs','الوظائف','💼','ما يعمله الشخصُ — ومنه يُشتقُّ دورُه وصلاحيتُه.'],
    ['perms','صلاحيات القاعدة','🔐','ما تقبله قاعدةُ البيانات لكلِّ دور — يُحفَظ هنا وينفذ في القاعدة فورًا.']],
  sys:[
    ['sys','سلامة البيانات','🩺','فحوص تكشف التناقض قبل أن يصير رقمًا في تقرير.'],
    ['bugs','البلاغات','🛠','ما أُبلغ عنه من التطبيق — وأين وصل في المستودع.'],
    ['sync','المزامنة والتعارض','🔄','ما يحدث حين يحرّر اثنان نقطةً واحدةً بلا شبكة.'],
    ['vers','نسخ الأجهزة','📱','نسخة التطبيق على كل جهاز — لاكتشاف من علِق على إصدار قديم.'],
    ['usage','الاستهلاك والأداء','📈','كلُّ جهاز: قراءاتُه وطوابيرُه وأعطالُه وزمنُ رسمه وسحبه — ومن سقط منها.'],
    ['dq','تصحيح البيانات','🧹','أربعةُ عيوبٍ في السجل — تُرى بعددها وتُصلَح دفعةً.'],
    ['retain','عمر البيانات','⏳','ما يبقى وما يُؤرشَف وما يُحذف — وحجم كلٍّ.'],
    ['wipe','تصفير البيانات','🗑','بدايةُ الموسم من صفر — تُمسَح السجلاتُ ويبقى التعريف.'],
    ['hb','صحة الأجهزة','💓','الإنذار المبكر لما رُكّب — يعمل من جهاز المكتب على شبكة الميدان.']],
  items:[
    ['items','القطع والأسعار','📋','كتالوج القطع وسعر كل قطعة.'],
    ['buycat','فئات المشتريات','🏷','تبويب مشتريات السوق المحلي.'],
    ['sup','المورّدون','🏪','قائمة موحّدة لمن نشتري منهم.'],
    ['consts','ثوابت النظام','🔢','أيام العمل وساعات اليوم.'],
    ['names','أسماء العرض','🏷','كيف تُكتَب أسماءُ الأشخاص والشركات بالإنجليزية — تصحيحٌ يُكتَب مرةً ويثبت.'],
    ['vehkind','أنواع السيارات','🚙','أنواعُ الأسطول وسعةُ كلٍّ — والعددُ يُشتقُّ مما أُضيف.']],
  org:[
    ['cover','خريطة التغطية','🗺','كلُّ قسمٍ في الشركة وكلُّ إدارةٍ عند العميل — وما يخصّه.'],
    ['raci','مصفوفة المسؤوليات','📋','من ينفّذ ومن يُساءل ومن يُستشار ومن يُبلَّغ.'],
    ['esc','التصعيد','🚨','ما تجاوز مهلتَه — ومن يُرفَع إليه.'],
    ['hse','السلامة والحوادث','🦺','ساعاتُ العمل الآمنة والحوادثُ والتصاريح — في موقعٍ يزدحم بالحجاج.']],
  forms:[
    ['svForm','المسح','🔍','البياناتُ المسجَّلة تُراجَع فقط ولا تُكتَب من جديد — اكتب ما لا نعرفه عن الموقع.'],
    ['insForm','التركيب','🔧','ما يُوثَّق عند إتمام التركيب — بصوره وسيرياته.'],
    ['disp2','الفك والعُهدة','📦','ما رُكِّب — يُجدوَل للفك وتُرجَع عُهدتُه بحالتها.'],
    ['newsite','موقع جديد','📍','ما لم يكن في القاعدة — يُسجَّل بموضعك ويُعتمَد لاحقًا.'],
    ['hand','التسليم والضمان','🤝','ما سُلِّم للعميل وما هو في الضمان.'],
    ['maintForm','الصيانة','🛡','عطلٌ يُسجَّل وإصلاحٌ يُوثَّق — فتُغلَق مهمةُ الصيانة.'],
    ['ips','عناوين الشبكة','🌐','بادئةُ كلِّ نقطةٍ وعناوينُ أجهزتها — تُستورَد وتُصدَّر.']],
  /* «الشركات» شاشةٌ بجسمها — تبقى تحت أمِّها، ويصلها الميدانُ بزرٍّ من
     «موقع جديد» فلا يخرج من النموذج ليضيف شركةً ثم يعود. */
  co:[
    ['co','حسب شركة الخدمة','🏢','لكلِّ شركةٍ مخيّماتُها — تُضاف وتُعدَّل وتُحذَف.'],
    ['conote','إشعار الشركات','📣','رسالةٌ جاهزةٌ لكل شركةٍ بموعد تركيبها — تُفتح في واتساب.']],
  sel:[
    ['sel','المحدَّد','☑','ما حدّدته من الخريطة — لعملٍ جماعي عليه.'],
    ['layers','الطبقات الثلاث','🗂','ما تُظهره كلُّ طبقةٍ وما تُسنده — ونقاطُها المحسوبة.']],
  /* الشرائحُ بترتيب دورة النقطة (V17.74): مسحٌ ← اعتمادٌ تقنيٌّ ← الحلُّ
     بأصنافه ← اعتمادُ الوزارة ← جاهزٌ للتركيب ← تدقيق ← عدمُ مطابقة — ثم ما
     خرج عن الدورة: الإفاداتُ والتحدياتُ والمتعذّرُ والراكد. كان «حلُّ التركيب»
     بعيدًا عن الاعتماد الذي يعتمد عليه، فمن اعتمد زيارةً لم يجد الخطوةَ التاليةَ
     بجواره. */
  survey:[
    ['survey','المسح الميداني','🔍','ما مُسح ومن مسحه ومتى — وإعادةُ تصنيف ما تعذّر منه لزيارةٍ ثانية.'],
    ['svappr','الاعتماد التقني','✅','ما زاره المشرفون ببياناته الجديدة — يعتمده المهندسُ تقنيًّا أو يردُّه لزيارةٍ أخرى، ثم يقترح حلَّه.'],
    ['solution','حل التركيب','🔧','الأجهزةُ المقترحة لكل نقطة — يعتمدها المهندس قبل أن تصير طلبَ تركيب.'],
    ['minappr','اعتماد الوزارة','🏛','ما اعتُمد تقنيًّا وينتظر اعتمادَ الوزارة لإعداد التركيب — تعتمده أو تُعيده بملاحظة.'],
    ['ready','جاهز للتركيب','🟠','ما اعتمدته الوزارةُ وحلُّه معتمدٌ ولم يُسنَد تركيبُه بعد — يُجدوَل من هنا.'],
    ['qa','التدقيق الهندسي','🔎','اعتماد التركيبات والسيريالات قبل الإقفال — ولا نقاطَ قبله.'],
    ['ncr','عدم المطابقة','🚫','ما خالف المواصفة — وإجراؤه التصحيحي حتى الإغلاق.'],
    ['chalm','التحديات والمعوقات','🚧','كلُّ معوقٍ بفلتر المشعر والنوع — واضغط التحدي ترى نقاطه. تُغلق تلقائيًّا عند التركيب.'],
    ['stuck','المتعذّر','\u26D4','ما لم يصل إليه الميدانُ — بسببه وقراره.'],
    ['idle','الراكد','\u23F8','زيارةٌ تمّت ولم يُركَّب موقعُها — بعمر الركود وسببه.']],
  req:[
    ['req','طلبات الزيارة','📨','إسناد زيارات المسح للفنيين واعتمادها.'],
    ['reqreg','سجل الإسنادات','🗂','كلُّ طلبٍ من كلِّ نوع — يُتابَع ويُعدَّل ويُحذَف.','self'],
    ['assign','توزيع الفرق','👥','ما أُسند وما بقي — لكل مشعرٍ ونوع.']],
  ev:[
    ['ev','سجل الأحداث','📜','كل تغيير بمن أجراه ومتى — خامًا أو مصنَّفًا بالحوكمة، من نفس السجل.'],
    ['notif','الإشعارات','🔔','ما يجب أن يعرفه أحدٌ الآن — وبأيِّ قناةٍ يصله.'],
    ['appr','الاعتمادات','✔','ما اقترحه المشرفون بانتظار قرارك.']],
  exec:[
    ['exec','اللوحة التنفيذية','🎯','ما يحتاجه القرار في شاشةٍ واحدة.'],
    ['diary','يوميات المشروع','📅','كلُّ يومٍ منذ أوّل يومِ عمل: كم مُسح ورُكّب وفُكّ واعتُمد، ومن عمل — والتراكميُّ إلى اليوم.'],
    ['pmi','مطابقة المنهجية','🎓','كلُّ بندٍ من دليل المعرفة والمنهج الرشيق ومنهج الذكاء الاصطناعي بدليله في النظام وحالته — تُحسَب من البيانات.'],
    ['lessons','الدروس والمراجعات','📝','الدروسُ المستفادةُ والمراجعاتُ الدورية: ما حدث، ولماذا، وما الإجراء، ومن يملكه.'],
    ['stake','أصحاب المصلحة','🤝','سجلُّ أصحاب المصلحة: التأثيرُ والاهتمام، والانخراطُ الحاليُّ والمطلوب، والخطة.'],
    ['budm','الملخّص المالي','💰','المنصرفُ من الميزانية بأبوابه — بلا مورّدين ولا فواتير.']],
  plan:[
    ['setup','المواعيد والأزمنة','📅','الموعد المستهدف وزمن التركيب لكل نوع.'],
    ['wplan','خطة الأسبوع','🗂','خطةُ المهندس للأسبوع: نقاطٌ بتفاصيلها وخطواتها ومتطلباتها ونتائجها — كلُّ نقطةٍ تُتمّ بنتيجة أو تُحدَّث أو تُغلَق. يراها المهندسون ومن فوقهم.'],
    ['miles','المعالم والتسليم','🏁','محطّاتُ المشروع وأوزانُها وما اعتمد عليه كلٌّ منها.'],
    ['evm','خط الأساس والقيمة','📈','أين نحن من المخطَّط — بلغةِ التقارير المعتمدة.'],
    ['risks','سجل المخاطر','⚠','ما قد يقع، واحتمالُه وأثرُه، ومن يملك الردَّ عليه.'],
    ['chg','ضبط التغيير','🔄','لا يُمسّ خطُّ الأساس إلا بطلبٍ يُوثَّق ويُقيَّم ويُعتمَد.'],
    ['crewplan','الطواقم والمعدلات','📊','كم فريقًا يلزم لبلوغ الموعد — محسوبًا من معدل كل نوع.'],
    ['pipe','سلامة خط الإنتاج','🛠','مسح ← جدولة ← تركيب — وأي تعارض بينها.']],
  perf:[
    ['perf','الأداء','🎯','أداءُ المشروع على خمسة مستويات: الترتيب العام، بالمرحلة، بالوظيفة، بالفريق، وللمشروع كله.'],
    ['crewman','الفرق','👥','كلُّ فريقٍ صفحتُه وحده: موظفوه وفرقُه الفرعية معًا.']],
  ipc:[
    ['ipc','المستخلصات','🧾','ما أُنجز واعتُمد — يُقدَّم للعميل ويُتابَع صرفُه.'],
    ['buys','دفتر المشتريات','🛒','مصروفات السوق المحلي بفواتيرها ومورّديها ومشاعرها.'],
    ['budget','الميزانية والاعتماد','📊','سقف الصرف وحدّ اعتماد المهندس.']],
  dis:[
    ['dis','الفك بعد الموسم','📦','جدولة الفك وإرجاع العُهدة بحالة كل صنف.'],
    ['chain','سلسلة المراحل','🔗','كلُّ عددٍ من الذي قبله — لا رقمَ ثابتًا قبل أوانه.']],
  guide:[
    ['guide','دليل الاستخدام','📘','دليلك أنت — بما تملكه من شاشات لا بما لا تملك.'],
    ['wf','دورة العمل','\u{1F5FA}','كلُّ دورةٍ خطوةً خطوة — من يفعل ماذا وأين، حتى الاعتماد.','self'],
    ['sop','دليل العمليات','📋','كلُّ دورةٍ في المشروع — من يبدأها ومن ينفّذها وأين وبأي قاعدة.']]
};
var PTAB = {};      /* الأمُّ → شريحتُها الحالية */
var PARENT = {};    /* معرِّفُ الشريحة → أمُّها */
function tabsInit(){
  Object.keys(TABS).forEach(function(pid){
    TABS[pid].forEach(function(tb){ PARENT[tb[0]] = pid; });
  });
}
tabsInit();
/* ═══ شريحةٌ لم تكن صفحةً قطّ ═══
   «شغلي» كانت تُدير تبويبَها بآليةٍ ثانيةٍ خاصّةٍ بها (MYW_TAB) — رأسُ شرائحَ
   مرسومٌ بيدٍ ومعالجُ نقرٍ ثانٍ وحالةٌ ثالثة. وآليتان تفعلان الشيءَ نفسَه
   عبءٌ لا ميزة: ما يُصلَح في إحداهما يُنسى في الأخرى. فوُحِّدتا.
   لكنَّ «أدائي» و«فريقي» و«شغل فريقي» لم تكن صفحاتٍ يومًا، فليست في قوائم
   الأدوار ولا تملك صلاحيةً خاصّة — فرؤيتُها رؤيةُ أمِّها. ويُعلَن ذلك
   صراحةً في العنصر الخامس من صفِّ الشريحة، ومعه شرطٌ إن كان لها شرط. */
var TAB_SEE = {
  /* «مهامي» و«أدائي» لمن له مهامُّ ونقاط — لا للإدارة العليا التي ترى لا تعمل */
  self: function(pid){ return seesRaw(pid) && !(pid === 'mywork' && effRole(ROLE) === 'exec'); },
  /* «فريقي» لمن تحته أحدٌ فعلًا، أو لمشرفٍ ومهندس */
  team: function(pid){
    var r = ROLE || (STATE.meta && STATE.meta.role) || '';
    return seesRaw(pid) && (r === 'supervisor' || r === 'engineer' || r === 'admin' || r === 'exec'
      || techsList().filter(function(x){ return underNames(STATE.meta.name || '').indexOf(x.n) > -1; }).length > 0);
  }
};
/* ما يراه هذا الدورُ من شرائح الأم — بقواعد الرؤية نفسِها */
function tabsOf(pid){
  return (TABS[pid] || []).filter(function(tb){
    var f = tb[4] && TAB_SEE[tb[4]];
    return f ? f(pid) : seesRaw(tb[0]);
  });
}
/* الشريحةُ الحالية — وتُردُّ إلى أوّلِ مرئيّةٍ إن لم تكن مرئية */
function tabCur(pid){
  var vis = tabsOf(pid);
  if (!vis.some(function(tb){ return tb[0] === PTAB[pid]; })) PTAB[pid] = vis.length ? vis[0][0] : '';
  return PTAB[pid];
}
