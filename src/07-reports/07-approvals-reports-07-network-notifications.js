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
  } catch (e){ LS_ERR = e; }
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

