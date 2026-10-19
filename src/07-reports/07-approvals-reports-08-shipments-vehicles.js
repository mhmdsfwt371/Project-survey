/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-08-shipments-vehicles.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : Shipments tracked, vehicles as moving custody with their own log.
   DEFINES : shipList, shipSave, shipLate, shipAdd, shipSet, shipDel, shipWatch, todayISO, msDay, vehKinds, vehKindName, vehList, vehOf, vehAsnList … (+16 more)
   GLOBALS : SHIP_ST, SHIP_Q, ASN_LABEL, VEH_KINDS_SEED, VEH_OWN, VEH_Q, VEH_FIT, VLOG_D
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
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
    .sort(function(a, b){ return arCmp(a.plate || '', b.plate || ''); });
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

