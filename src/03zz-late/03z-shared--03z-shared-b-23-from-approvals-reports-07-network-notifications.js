/* (V38.90) moved by scripts/split-late.mjs from src/03z-shared/03z-shared-b-23-from-approvals-reports-07-network-notifications.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
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
