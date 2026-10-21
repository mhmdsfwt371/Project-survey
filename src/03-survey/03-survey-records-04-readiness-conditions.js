/* ============================================================================
   FILE    : src/03-survey/03-survey-records-04-readiness-conditions.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : What is ready per request type and the condition chain explaining why a point cannot be assigned.
   DEFINES : asnReadyList, asnQuick, asnReadyCard, gateChain, gateFirst, gateCard, gateSay, asnCommit, mapSelBar, mineFiltered
   GLOBALS : ASN_READY, ASN_QCAP, MAP_SELECT, MY_ONLY
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الجاهزُ لكلِّ نوعِ طلب ═══
   كان إنشاءُ الطلب يبدأ من الخريطة دائمًا: تُفتَح، وتُبدَّل الطبقةُ إلى
   النوع المطلوب، وتُحدَّد النقاطُ واحدةً واحدةً أو بـ«حدّد الكل»، ثم يُفتَح
   اللوح. فمن أراد إسنادَ فكِّ ما سُلِّم لم يعرف كم هو ولا أين يبدأ — وسُئل:
   «أين طلبُ التركيب وطلبُ الفكّ؟ أمِن الخريطة فقط؟».
     صار في «توزيع الفرق» صفٌّ لكلِّ نوع: كم نقطةً جاهزةً له الآن، وما
   الشرطُ الذي يجعلها جاهزة، وزرٌّ واحدٌ يحدّدها كلَّها ويفتح لوحَ الإسناد
   على نوعها. والخريطةُ تبقى الطريقَ الآخر لمن أراد اختيارًا بعينه. */
var ASN_READY = {
  visit:   { layer:'survey',  why:'لم تُزر ولم تُسنَد بعد',
             ok:function(x){ return !svDone(STATE.recs[x.id]); } },
  install: { layer:'install', why:'اعتمدت الوزارةُ إعدادَها وحلُّها معتمدٌ ولم تُركَّب',
             ok:function(x){ var so = solutionOf(x.id);
                             return minOk(x.id) && !!so && so.status === 'معتمد' && !insDone(x.id); } },
  maint:   { layer:'install', why:'رُكِّبت واعتُمدت — تُخدَم في أثناء الموسم',
             ok:function(x){ return insDone(x.id); } },
  dis:     { layer:'dis',     why:'سُلِّمت بمحضرٍ ولم تُفَكّ',
             ok:function(x){ return (typeof handDone === 'function') && handDone(x.id) && !disDone(x.id); } }
};
function asnReadyList(kind){
  var R = ASN_READY[kind];
  if (!R) return [];
  /* الحجبُ بالنوع لا بأيِّ إسنادٍ مفتوح: كان `asnOf` يُرجِع أيَّ مهمةٍ
     مفتوحةٍ على النقطة أيًّا كان نوعُها — فنقطةٌ رُكِّبت وسُلِّمت ومهمةُ
     تركيبها لم تُغلَق بعد لا تظهر جاهزةً للصيانة ولا للفكِّ أبدًا، وهو
     الحالُ الغالبُ في الميدان: المهمةُ تُغلَق باعتماد المهندس لا بالتركيب.
     فيُسأل عن مهمةٍ **من هذا النوع** وحدَها. */
  return (STATE.sites || []).filter(function(x){
    return !taskKindOf(x.id, kind) && R.ok(x);
  });
}
/* زرٌّ واحد: يحدّد الجاهزَ ويفتح اللوحَ على نوعه في الخريطة */
var ASN_QCAP = 300;
function asnQuick(kind){
  if (!may('approve')){ toast(t('إنشاءُ الطلب للمهندس وحده')); return; }
  var L = asnReadyList(kind);
  if (!L.length){
    toast(t('لا نقطةَ جاهزةً لهذا النوع') + ' — ' + t(ASN_READY[kind].why));
    return;
  }
  selClear();
  var n = 0;
  L.forEach(function(x){ if (n < ASN_QCAP){ SEL[x.id] = 1; SEL_N++; n++; } });
  ASN_KIND = kind;
  FIELD_MODE = ASN_READY[kind].layer;
  ASN_MODE = (ASN_KIND_DEST[kind] === 'team') ? 'team' : 'tech';
  ASN_OPEN = true;
  goPage('map');
  render(1);
  /* إعادةُ الطلاء تفشل إن لم تُنشَأ الخريطةُ بعدُ — والرسمُ التالي يتولّاها */
  if (typeof mapPaint === 'function'){
    try { mapPaint(); }
    catch (e){ if (typeof softErr === 'function') softErr('طلاء الخريطة', e, ''); }
  }
  toast(nm(n) + ' ' + t('نقطةً جاهزةً حُدِّدت')
        + (L.length > n ? ' \u00b7 ' + nm(L.length - n) + ' ' + t('بقيت — أسندها بعدها') : ''));
}
function asnReadyCard(){
  var rows = Object.keys(ASN_READY).map(function(k){
    var K = WO_KINDS[k] || { i:'', n:k };
    var n = asnReadyList(k).length;
    var open = 0;
    Object.keys(STATE.tasks || {}).forEach(function(t2){
      var x = STATE.tasks[t2];
      if (x && x.kind === k && x.status !== 'معتمد') open++;
    });
    return [K.i + ' <strong>' + esc(t(K.n)) + '</strong><br>'
              + '<span class="hint" style="margin:0">' + esc(t(ASN_READY[k].why)) + '</span>',
            n ? '<b class="num">' + nm(n) + '</b>' : N(0),
            N(open),
            n && may('approve')
              ? btn(t('أسند') + ' \u2190', 'btn-primary btn-sm', ' data-asnq="' + k + '"')
              : '<span class="hint" style="margin:0">' + esc(t(n ? '—' : 'لا جاهزَ الآن')) + '</span>'];
  });
  return cardFlush('\u{1F4E6} ' + t('جاهزٌ للإسناد — لكلِّ نوعِ طلب'),
      table(['النوع والشرط','جاهز','مفتوحٌ الآن',''], rows)
      + '<p class="hint" style="margin:10px 0 0">'
      + esc(t('الزرُّ يحدّد الجاهزَ كلَّه ويفتح لوحَ الإسناد على نوعه — والخريطةُ تبقى الطريقَ الآخر لمن أراد اختيارًا بعينه.')) + '</p>');
}

/* ═══ سلسلةُ الشروط: لماذا لا يُسنَد هذا ═══
   الرفضُ كان جملةً واحدةً: «لا حلَّ معتمدًا» أو «لم تُسلَّم بمحضر». والجملةُ
   صحيحةٌ ولا تكفي: من يسمعها لا يعرف أينَ هو من السلسلة، ولا ما الخطوةُ
   التي تسبقها، ولا كم بقي حتى يصل. فصارت لكلِّ نوعٍ سلسلتُه معروضةً كاملةً:
   ما تمَّ منها بعلامته، وأوّلُ ما ينقص بسببه وزرِّ الذهاب إليه، وما بعده
   رماديًّا — فيُرى الطريقُ كلُّه لا العقبةُ وحدَها.
     والسلسلةُ واحدةٌ في كلِّ موضع: في لوح الإسناد، وفي نافذة النقطة،
   وفي رسالة الرفض — فلا يُقال في موضعٍ ما لا يُقال في آخر. */
function gateChain(kind, x){
  if (!x) return [];
  var id = x.id, r = STATE.recs[id], ins = STATE.inss[id] || {};
  var sv   = { t:'زيارةُ مسحٍ محفوظة',   ok:svDone(r),                    p:'svForm',   why:'لا تُخطَّط نقطةٌ لم تُزَر — القياساتُ والصورُ منها' };
  var svOk = { t:'اعتمادُ الزيارة',      ok:svReview(r) === 'approved',   p:'svappr',   why:'المهندسُ يراجع ما زاره الميدانُ قبل أن يُبنى عليه' };
  var sol  = { t:'حلٌّ معتمدٌ بالقطع',    ok:((ins.solution || {}).status === 'معتمد'), p:'solution', why:'لا يُركَّب شيءٌ قبل أن يُعتمَد ما يُركَّب' };
  var insD = { t:'تركيبٌ مسجَّل',         ok:insDone(id),                  p:'insForm',  why:'ما لم يُسجَّل تركيبُه لا يُدقَّق ولا يُسلَّم' };
  var qa   = { t:'اعتمادُ التركيب',      ok:!!ins.approved,                p:'qa',       why:'التدقيقُ الهندسيُّ يسبق التسليم — والصورُ والسيرياتُ تُراجَع' };
  var hd   = { t:'تسليمٌ بمحضر',          ok:(typeof handDone === 'function') && handDone(id), p:'hand', why:'الفكُّ إرجاعُ ما سُلِّم — فلا يُفَكُّ ما لم يُسلَّم' };
  var C = { visit:[], install:[sv, svOk, sol], maint:[sv, svOk, sol, insD, qa], dis:[sv, svOk, sol, insD, qa, hd] }[kind] || [];
  /* ولا يُسنَد ما هو مُسنَدٌ من نوعه بالفعل */
  var t2 = taskKindOf(id, kind);
  if (t2) C = C.concat([{ t:'ليس مُسنَدًا من قبل', ok:false, p:'reqreg',
                          why:'عليه إسنادٌ مفتوحٌ من هذا النوع — ' + (t2.no || '') + ' لـ' + (dispName(t2.to) || '') }]);
  return C;
}
function gateFirst(kind, x){
  var C = gateChain(kind, x);
  for (var i = 0; i < C.length; i++) if (!C[i].ok) return C[i];
  return null;
}
function gateCard(kind, x){
  var C = gateChain(kind, x);
  if (!C.length) return card('\u2705 ' + t('الطريقُ مفتوح'),
    '<p class="hint" style="margin:0">' + esc(t('لا شرطَ قبل هذا النوع — يُسنَد مباشرةً.')) + '</p>');
  var first = gateFirst(kind, x), hit = false;
  return cardFlush((first ? '\u26D4 ' : '\u2705 ') + t('ما يسبق هذه الخطوة'),
      table(['الخطوة','الحال','لماذا'],
        C.map(function(g){
          var cur = !g.ok && !hit; if (!g.ok) hit = true;
          return ['<strong style="' + (g.ok ? '' : 'opacity:.6') + '">' + esc(t(g.t)) + '</strong>',
                  g.ok ? pill('تمّ','ok')
                       : (cur ? pill('ابدأ هنا','off') : pill('بعده','')),
                  '<span class="hint" style="margin:0">' + esc(t(g.why)) + '</span>'
                    + (cur && seesPage(PARENT[g.p] || g.p)
                        ? ' ' + btn('\u2190 ' + t('اذهب'),'btn-quiet btn-sm',' data-p="' + esc(g.p) + '"') : '')];
        }))
      + '<p class="hint" style="margin:8px 0 0">'
      + esc(t(first ? 'أنجِز «ابدأ هنا» أوّلًا — وما بعده يُفتَح تلقائيًّا.'
                    : 'كلُّ ما يسبق هذه الخطوة تمّ — تُسنَد الآن.')) + '</p>');
}
/* رسالةُ الرفض تقول الخطوةَ الناقصةَ وسببَها لا «لا يجوز» — نصٌّ واحدٌ
   يستعمله المسارُ الفرديُّ والجماعيُّ ونافذةُ النقطة، فلا يُقال في موضعٍ
   ما لا يُقال في آخر. */
function gateSay(g){
  if (!g) return false;
  toast(t('قبل هذه الخطوة') + ': ' + t(g.t) + ' \u2014 ' + t(g.why));
  return true;
}
function asnCommit(){
  if (ASN_MODE === 'team'){ asnTeamCommit(); return; }
  var to   = curTech();
  var kind = (document.getElementById('asnKind') || {}).value || ASN_KIND;
  var when = (document.getElementById('asnWhen') || {}).value || '';
  if (!to){ toast(t('اختر فنيًّا')); return; }

  var want = selIds();
  var had  = asnOfTech(to, kind);
  var add = 0, rm = 0, busy = 0, blockedSol = 0, firstBlock = null;
  /* موعدٌ مضى يُقبَل — قد يُسجَّل عملٌ بأثرٍ رجعيّ — لكن يُقال لئلّا يكون خطأَ أصبع */
  if (when && when < dayKey(Date.now())) toast(t('تنبيه: الموعدُ في الماضي') + ' \u00b7 ' + when);

  /* المُضاف */
  want.forEach(function(id){
    if (had.indexOf(id) > -1) return;
    var other = asnOf(id);
    if (other && other.to !== to){ busy++; return; }
    /* الشرطُ يُفحَص بالسلسلة نفسِها لكلِّ نوعٍ — لا للتركيب وحده */
    var gb = gateFirst(kind, siteFind(id));
    if (gb){ blockedSol++; if (!firstBlock) firstBlock = gb; return; }
    var tid = 'TK-' + kind + '-' + id;
    CORE.set('tasks', tid, {
      id:tid, no:reqNext(kind), site:id, kind:kind, to:to, assignedTo:to,
      status:'مطلوب', when:when, by:STATE.meta.name || '', at:Date.now()
    });
    add++;
  });

  /* المسحوب — ما كان لديه وخرج من التحديد */
  had.forEach(function(id){
    if (want.indexOf(id) > -1) return;
    var tk = asnOf(id);
    if (tk && tk.to === to && tk.status === 'مطلوب'){ CORE.rm('tasks', tk.id); rm++; }
  });

  if (!add && !rm){
    if (blockedSol && firstBlock) gateSay(firstBlock);
    else toast(t('لا تغيير'));
    return;
  }
  logEvent('إسناد ' + to + ' · +' + nm(add) + (rm ? ' \u2212' + nm(rm) : '')
           + ' \u00b7 ' + t(WO_KINDS[kind].n));
  selClear();
  ASN_BASE = [];
  ASN_OPEN = false;
  statBump();
  toast(to + ' \u00b7 ' + (add ? '+' + nm(add) + ' ' : '') + (rm ? '\u2212' + nm(rm) + ' ' : '')
        + '= ' + nm(asnOfTech(to, kind).length) + ' ' + t('نقطة')
        + (busy ? ' \u00b7 ' + nm(busy) + ' ' + t('مُسندةٌ لغيره') : '')
        + (blockedSol ? ' \u00b7 ' + nm(blockedSol) + ' ' + t('بلا حلٍّ معتمد') : ''));
  /* آخرُ إسنادٍ يُحفَظ ليُبلَّغ صاحبُه واتساب بضغطة */
  if (add){
    var addedIds = want.filter(function(id){
      var tk = taskKindOf(id, kind); return tk && tk.to === to && had.indexOf(id) < 0;
    });
    if (addedIds.length) WA_LAST = { to:to, kind:kind, ids:addedIds, when:when || '' };
  }
  render(1);
}

/* ── صفحة الطلبات: الأرقام الحقيقية والإجراءات ── */
PAGE.req = { m:'الميدان', t:'الطلبات والتوزيع',
  l:'طلباتُ الزيارة وتوزيعُ الفرق عليها.',
  body:function(){
    var head = tabHead('req'), cur = tabCur('req');
    if (cur === 'reqreg') return head + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الإسنادات'),'btn-secondary btn-sm',' data-xls="asnreg"') + '</div>' + waAsnCard() + (function(){
    var L0 = regList();
    var byKind = {};
    L0.forEach(function(x){ byKind[x.kind] = (byKind[x.kind] || 0) + 1; });
    var kinds = Object.keys(WO_KINDS).filter(function(k){ return byKind[k]; });
    var L = L0.filter(function(x){
      if (REG_KIND && x.kind !== REG_KIND) return false;
      if (REG_ST && regStatus(x).t !== REG_ST) return false;
      if (REG_Q && (x.site + ' ' + (x.no || '') + ' ' + (x.to || '')).indexOf(REG_Q) < 0) return false;
      return true;
    });
    var sts = {};
    L0.forEach(function(x){ var st = regStatus(x).t; sts[st] = (sts[st] || 0) + 1; });
    var ed = may('approve');

    return '<div class="chips">'
      + '<button type="button" class="chip' + (REG_KIND ? '' : ' on') + '" data-regk="">'
      +   esc(t('كل الأنواع')) + ' <span class="num">' + nm(L0.length) + '</span></button>'
      + kinds.map(function(k){
          var K = WO_KINDS[k];
          return '<button type="button" class="chip' + (REG_KIND === k ? ' on' : '') + '" data-regk="' + k + '">'
            + K.i + ' ' + esc(t(K.n)) + ' <span class="num">' + nm(byKind[k]) + '</span></button>';
        }).join('') + '</div>'

      + '<div class="chips">'
      + '<button type="button" class="chip' + (REG_ST ? '' : ' on') + '" data-regs="">' + esc(t('كل الحالات')) + '</button>'
      + Object.keys(sts).map(function(st){
          return '<button type="button" class="chip' + (REG_ST === st ? ' on' : '') + '" data-regs="' + esc(st) + '">'
            + esc(t(st)) + ' <span class="num">' + nm(sts[st]) + '</span></button>';
        }).join('') + '</div>'

      + card('بحث',
          '<input type="search" id="regQ" data-regq="1" value="' + esc(REG_Q) + '" placeholder="'
          + esc(t('ابحث بالنقطة أو رقم الطلب أو المُسنَد إليه')) + '" dir="auto">')

      + (L.length
        ? cardFlush(t('السجل') + ' — ' + nm(L.length) + ' ' + t('من') + ' ' + nm(L0.length),
            table(['الطلب','النقطة','المُسنَد إليه','الموعد','الحالة',''],
              capList(L, 200).map(function(x){
                var st = regStatus(x), K = WO_KINDS[x.kind] || { i:'', n:x.kind };
                var site = siteFind(x.site);
                var on = REG_EDIT === x.id;
                return ['<span class="num">' + esc(x.no || '—') + '</span><br>'
                          + '<span class="hint" style="margin:0">' + K.i + ' ' + esc(t(K.n)) + '</span>',
                        '<span class="num">' + esc(x.site) + '</span><br>'
                          + '<span class="hint" style="margin:0">' + esc(((site && site.name) || '').slice(0, 22)) + '</span>',
                        on
                          ? '<select data-regto="' + esc(x.id) + '">'
                            + techsList().map(function(p2){
                                return '<option value="' + esc(p2.n) + '"' + (p2.n === x.to ? ' selected' : '') + '>'
                                  + esc(p2.n) + '</option>'; }).join('')
                            + crewsList().map(function(c){
                                return '<option value="' + esc(c.n) + '"' + (c.n === x.to ? ' selected' : '') + '>'
                                  + esc(c.n) + '</option>'; }).join('') + '</select>'
                          : esc(dispName(x.to) || '—'),
                        on
                          ? '<input type="date" value="' + esc(x.when || '') + '" data-regwhen="' + esc(x.id) + '" style="width:150px">'
                          : (x.when ? '<span class="num">' + esc(x.when) + '</span>' : '—'),
                        pill(st.t, st.c),
                        !ed ? '—'
                        : on
                          ? '<div class="actions" style="margin:0">'
                            + btn('احفظ','btn-primary btn-sm',' data-regsave="' + esc(x.id) + '"')
                            + btn('إلغاء','btn-quiet btn-sm',' data-regedit=""') + '</div>'
                          : '<div class="actions" style="margin:0">'
                            /* من لم يُبلَغ بعدُ يُبلَّغ واتساب من هنا — والمُبلَّغُ يُعلَّم */
                            + (x.status !== 'معتمد'
                                ? btn(x.waAt ? '\u2713\u{1F4F1}' : '\u{1F4F1}','btn-quiet btn-sm',' data-watask="' + esc(x.id) + '" aria-label="' + esc(t('واتساب')) + '"')
                                : '')
                            + btn('✎','btn-quiet btn-sm',' data-regedit="' + esc(x.id) + '" aria-label="' + esc(t('تعديل')) + '"')
                            + btn('🗺','btn-quiet btn-sm',' data-site="' + esc(x.site) + '" aria-label="' + esc(t('على الخريطة')) + '"')
                            + (st.t === 'منجَز' ? '' : btn('🗑','btn-danger btn-sm',' data-regdel="' + esc(x.id) + '" aria-label="' + esc(t('حذف')) + '"'))
                            + '</div>'];
              })))
        : card('', '<p class="hint" style="text-align:center;margin:0">'
            + esc(t(L0.length ? 'لا إسنادَ يطابق الترشيح.' : 'لا إسناداتٍ بعد — تُنشأ من الخريطة أو «طلبات الزيارة».')) + '</p>'))

      + '<p class="hint">' + esc(t('المنجَزُ لا يُحذَف: نقاطُ صاحبه بُنيت عليه. والزيارةُ التي تمّت تُعتمَد أو تُردُّ في «اعتماد الزيارات» ولا تُمحى.')) + '</p>';
  })();
    if (cur === 'assign') return head + (function(){
    var C = catCounts(), S = siteStats();
    var rows = [], keys = Object.keys(S.byKey);
    keys.sort();
    keys.forEach(function(k){
      var p = k.split('|'), tot = S.byKey[k], sv = 0, asn = 0;
      STATE.sites.forEach(function(x){
        if (x.zone !== p[0] || x.type !== p[1]) return;
        if (svDone(STATE.recs[x.id])) sv++;
        if (asnOf(x.id)) asn++;
      });
      var d = CAT_DEF[p[1]] || { l:p[1], i:'\u25CF' };
      var sub = '';
      if (p[1] === 'كاميرا'){   /* ثابتةٌ ومتحرّكة (V19.1) */
        var ck = {}; STATE.sites.forEach(function(x){ if (x.zone === p[0] && x.type === 'كاميرا'){ var q = camKind(x); ck[q] = (ck[q] || 0) + 1; } });
        sub = '<div class="hint" style="margin:2px 0 0">' + Object.keys(ck).map(function(q){ return esc(camKindLabel(q)) + ' ' + nm(ck[q]); }).join(' \u00b7 ') + '</div>';
      }
      rows.push([esc(p[0]), d.i + ' ' + esc(t(d.l)) + sub, N(tot), N(sv), N(asn),
                 '<b>' + nm(tot - sv - asn) + '</b>']);
    });
    var totAll = S.total, svAll = S.surveyed;
    var asnAll = 0;
    STATE.sites.forEach(function(x){ if (asnOf(x.id)) asnAll++; });

    return stats([['الإجمالي', N(totAll)], ['ممسوح', N(svAll), 'acc'],
                  ['مُسند', N(asnAll), 'wrn'], ['متاح', N(totAll - svAll - asnAll), 'ok']])
      + asnReadyCard()
      + cardFlush('المتاح لكل مشعرٍ ونوع',
          table(['المشعر','النوع','الإجمالي','ممسوح','مُسند','متاح'], rows,
                ['الإجمالي','', N(totAll), N(svAll), N(asnAll), N(totAll - svAll - asnAll)]),
          '<div class="actions">'
          + btn('➕ إنشاء طلب','btn-primary btn-sm',' data-asn="1"')
          + btn('🗺 تحديد من الخريطة','btn-secondary btn-sm',' data-asnmap="1"')
          + '</div>')
      + '<p class="hint">' + esc(t('«المتاح» ما يحتاج زيارةً ولم يُسند بعد. والأوزانُ والتارجت في شاشة الإعدادات.')) + '</p>';
  })();
    return head + (function(){
    var T = STATE.tasks, by = {};
    TK_ST.forEach(function(s){ by[s] = 0; });
    var rows = [];
    Object.keys(T).forEach(function(k){
      var x = T[k];
      by[x.status] = (by[x.status] || 0) + 1;
      rows.push(x);
    });
    rows.sort(function(a,b){ return b.at - a.at; });

    return stats([['مطلوب', N(by['مطلوب']||0)],
                  ['قيد التنفيذ', N(by['قيد التنفيذ']||0), 'wrn'],
                  ['منفّذ', N(by['منفّذ']||0), 'acc'],
                  ['معتمد', N(by['معتمد']||0), 'ok']])
      + card('دورة الطلب',
          flow(TK_ST.slice(0,4), 0)
          + '<p class="hint">' + esc(t('والإعادة ترجعه للمنفِّذ بحالة «مُعاد» مع سبب.')) + '</p>',
          '<div class="actions">'
          + btn('➕ إنشاء طلب','btn-primary btn-sm',' data-asn="1"')
          + btn('🗺 حدّد من الخريطة','btn-secondary btn-sm',' data-asnmap="1"')
          + '</div>')
      + (rows.length
        ? cardFlush(t('الطلبات') + ' — ' + nm(rows.length),
            table(['الرقم','النقطة','النوع','الفني','الموعد','الحالة',''],
              rows.slice(0, 60).map(function(x){
                var s = siteFind(x.site), k = WO_KINDS[x.kind] || { i:'', n:x.kind };
                return ['<span class="num">' + esc(x.no || '—') + '</span>',
                        '<strong>' + esc(x.site) + '</strong><br>'
                        + '<span class="hint" style="margin:0">' + esc((s && s.name || '').slice(0,32)) + '</span>',
                        k.i + ' ' + esc(t(k.n)), esc(x.to),
                        x.when ? '<span class="num">' + esc(x.when) + '</span>' : '—',
                        pill(x.status, x.status==='معتمد'?'ok':(x.status==='مُعاد'?'off':'warn')),
                        '<div class="actions">'
                        + (x.status !== 'معتمد'
                          ? btn('اعتمد','btn-quiet btn-sm',' data-tkok="' + esc(x.id) + '"') : '')
                        + btn('ألغِ','btn-quiet btn-sm',' data-tkrm="' + esc(x.id) + '"')
                        + '</div>'];
              })),
            btn('⬇ إكسل — المهام','btn-secondary btn-sm',' data-xls="tasks"'))
        : card('الطلبات',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('لا طلبات بعد — أنشئ أول طلب بتحديد نقاط من القائمة أو الخريطة.')) + '</p>'))
      + (ASN_OPEN ? asnSheet() : '');
  })();
  }};

/* ── المتاح والمُسند: جدولٌ يُظهر ما بقي ── */

/* ── وضع التحديد على الخريطة ── */
var MAP_SELECT = false;

function mapSelBar(){
  if (!MAP_SELECT) return '';
  return '<div class="map-selbar">'
    + '<span>' + esc(t('اضغط النقاط على الخريطة لتحديدها ثم «أسند لفني»')) + '</span>'
    + '<b class="num">' + nm(SEL_N) + '</b>'
    + '<div class="actions" style="margin-inline-start:auto">'
    + btn('أسند لفني','btn-primary btn-sm',' data-asn="1"')
    + btn('إلغاء','btn-secondary btn-sm',' data-selmap="0"')
    + '</div></div>';
}

/* ── خريطة الفني: ما أُسند إليه وحده ── */
;

/* الفنيُّ يرى ما أُسند إليه وحده على الخريطة */
var MY_ONLY = false;

function mineFiltered(){
  var me = STATE.meta.name || '';
  var ids = Object.create(null);
  Object.keys(STATE.tasks).forEach(function(k){
    var x = STATE.tasks[k];
    if (x.to === me && x.status !== 'معتمد') ids[x.site] = 1;
  });
  return STATE.sites.filter(function(x){ return ids[x.id]; });
}

