/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-07-network-notifications.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : Network addresses, notifications (four channels, one message), generated where read, collision detection, bell window and per-device controls.
   DEFINES : ipRows, ipSet, ipClear, vehKindSave, vehKindSet, vehKindAdd, vehKindDel, breakCell, rollupBy, rollupTable, techPerfTable, bonusFormHtml, bonusLogHtml, notifStore … (+26 more)
   GLOBALS : IP_Q, NOTIF_MAX, NOTIF_SEEN, NOTIF_LV, STEP_KINDS, CLASH, NPOP_BURST, POP_T, BELL_OPEN
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

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

