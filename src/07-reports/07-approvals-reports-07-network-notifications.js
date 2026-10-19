/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-07-network-notifications.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : Network addresses, notifications (four channels, one message), generated where read, collision detection, bell window and per-device controls.
   DEFINES : stepsList, stepsCard, notifAsk, notifPhone, notifMail
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ── صحة الأجهزة ────────────────────────────────── */

/* ── النظام ─────────────────────────────────────── */

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

