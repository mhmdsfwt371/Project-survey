/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-12-attendance-route-field-assistant.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Attendance (start/end my day), today's route, field assistant suggestions and WhatsApp to the technician on assignment.
   DEFINES : attInZone, attLocate, attMark, attTeamCard, routeLocate, waAsnText, waAsn
   GLOBALS : ATT_IN, ROUTE_POS, FH_PREP, WA_LAST
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الحضور: بدأتُ يومي · أنهيتُ يومي ═══
   النظامُ يعرف ما أُنجز ولا يعرف من كان موجودًا. بمئةٍ وخمسين شخصًا في ستة
   مشاعرَ أوّلُ سؤالِ المدير صباحًا: من بدأ؟ ومن لم يبدأ؟ ومن أنهى ومتى؟
     يضغط الفنيُّ بنفسه — لا يسجّل له أحد — ويُلتقَط موقعُه: داخلَ المشاعر
   أم خارجها. ولا يُرفَض الخارجُ: يُسجَّل ويُعلَّم «خارج النطاق» فيراه المشرفُ
   ويسأل — فالرفضُ في الميدان بجهازٍ يخطئ موقعَه عذاب. وثيقةٌ لكلِّ شخصٍ في
   كلِّ يوم، يكتبها صاحبُها وحدَه ويقرؤها من فوقه. */
var ATT_IN  = { s:21.2, n:21.6, w:39.7, e:40.2 };   

function attInZone(lat, lng){
  return lat > ATT_IN.s && lat < ATT_IN.n && lng > ATT_IN.w && lng < ATT_IN.e;
}
function attLocate(){
  return new Promise(function(res){
    if (!navigator.geolocation){ res(null); return; }
    var done = false, stop = setTimeout(function(){ if (!done){ done = true; res(null); } }, 12000);
    navigator.geolocation.getCurrentPosition(function(p){
      if (done) return; done = true; clearTimeout(stop);
      res({ lat:+p.coords.latitude.toFixed(6), lng:+p.coords.longitude.toFixed(6), acc:Math.round(p.coords.accuracy || 0) });
    }, function(){ if (!done){ done = true; clearTimeout(stop); res(null); } },
    { enableHighAccuracy:true, timeout:11000, maximumAge:60000 });
  });
}
function attMark(kind){
  if (!myUid()){ toast(t('سجّل الدخول أولًا')); return; }
  if (!isFieldRole(ROLE)){ toast(t('الحضورُ للميدان')); return; }
  var day = dayKey(Date.now()), k = attKey(myUid(), day);
  STATE.att = STATE.att || {};
  var r = STATE.att[k] || { id:k, uid:myUid(), name:STATE.meta.name || '', day:day, role:ROLE };
  if (kind === 'in'  && r.in){  toast(t('بدأتَ يومَك بالفعل') + ' \u00b7 ' + hm(r.in.at)); return; }
  if (kind === 'out' && !r.in){ toast(t('لم تبدأ يومَك بعد')); return; }
  if (kind === 'out' && r.out){ toast(t('أنهيتَ يومَك بالفعل') + ' \u00b7 ' + hm(r.out.at)); return; }
  toast(t('يُلتقَط موقعُك…'));
  return attLocate().then(function(loc){
    var stamp = { at:Date.now(), lat:loc ? loc.lat : null, lng:loc ? loc.lng : null,
                  acc:loc ? loc.acc : null, ok:loc ? attInZone(loc.lat, loc.lng) : null };
    r[kind] = stamp;
    if (kind === 'out' && r.in) r.hours = Math.round((stamp.at - r.in.at) / 360000) / 10;
    STATE.att[k] = r;
    CORE.set('att', k, r);
    logEvent((kind === 'in' ? 'بدأ يومَه' : 'أنهى يومَه') + ' — ' + (STATE.meta.name || '')
      + (loc ? (stamp.ok ? ' · داخل المشاعر' : ' · خارج النطاق') : ' · بلا موقع'));
    toast((kind === 'in' ? t('بدأ يومُك') : t('أُنهي يومُك') + ' \u00b7 ' + nm(r.hours || 0) + ' ' + t('ساعة'))
      + (loc ? (stamp.ok ? '' : ' \u00b7 ' + t('خارج نطاق المشاعر — يراها مشرفُك')) : ' \u00b7 ' + t('بلا موقع')));
    statBump(); render(1);
  });
}

/* بطاقةُ المشرف: من بدأ ومن لم يبدأ — اليوم */
function attTeamCard(){
  if (rankOf(ROLE) < rankOf('supervisor')) return '';
  var day = dayKey(Date.now()), A = STATE.att || {};
  var people = techsList().filter(function(x){ return x.n !== STATE.meta.name; });
  var rows = [], inN = 0, outN = 0, offN = 0, farN = 0;
  people.forEach(function(x){
    var r = A[attKey(x.u, day)];
    if (!r || !r.in){ offN++; rows.push([esc(x.n), pill('لم يبدأ','off'), '\u2014', '\u2014']); return; }
    if (r.in.ok === false) farN++;
    if (r.out){ outN++; rows.push([esc(x.n), pill('أنهى','ok'), '<span class="num">' + esc(hm(r.in.at)) + '</span>', '<span class="num">' + esc(hm(r.out.at)) + ' \u00b7 ' + nm(r.hours || 0) + t('س') + '</span>']); }
    else { inN++; rows.push([esc(x.n) + (r.in.ok === false ? ' ' + pill('خارج النطاق','wrn') : ''), pill('يعمل','acc'), '<span class="num">' + esc(hm(r.in.at)) + '</span>', '\u2014']); }
  });
  rows.sort(function(a, b){ return (a[1].indexOf('لم يبدأ') > -1 ? 1 : 0) - (b[1].indexOf('لم يبدأ') > -1 ? 1 : 0); });
  return cardFlush('\u{1F552} ' + t('الحضورُ اليوم') + ' \u2014 ' + nm(people.length),
      stats([['يعمل', N(inN), 'acc'], ['أنهى', N(outN), 'ok'], ['لم يبدأ', N(offN), offN ? 'wrn' : ''], ['خارج النطاق', N(farN), farN ? 'bad' : '']])
      + (rows.length ? table(['الشخص','الحال','بدأ','أنهى'], capList(rows, 200)) : '')
      + '<p class="hint" style="margin:8px 0 0">' + esc(t('يضغط كلٌّ بنفسه عند الوصول والمغادرة — والموقعُ يُلتقَط. «خارج النطاق» تُسجَّل ولا تُرفَض: اسأل صاحبَها.')) + '</p>');
}

function routeLocate(){
  return attLocate().then(function(loc){ ROUTE_POS = loc; render(1); return loc; });
}

   
function waAsnText(to, kind, ids, when){
  var L = ids.map(function(id){
    var st = siteFind(id) || {};
    return '\u2022 ' + id + (st.name ? ' \u2014 ' + String(st.name).slice(0, 30) : '') + (st.zone ? ' (' + t(st.zone) + ')' : '');
  });
  return t('السلام عليكم') + ' ' + to + '\n'
    + t('أُسند إليك') + ' ' + nm(ids.length) + ' ' + t('نقطة') + ' \u2014 ' + t(kindLabel(kind))
    + (when ? ' \u00b7 ' + t('الموعد') + ' ' + when : '') + ':\n'
    + L.slice(0, 20).join('\n') + (L.length > 20 ? '\n\u2026 ' + t('والباقي في التطبيق') : '') + '\n\n'
    + t('افتح «مهامي» في التطبيق واضغط «من موقعي» لترتيب الطريق') + ':\n'
    + appUrl() + '\n'   /* (V38.29) */
    + '\u2014 ' + (STATE.meta.name || '');
}
function waAsn(to, kind, ids, when){
  if (!to || !ids || !ids.length){ toast(t('لا إسنادَ يُبلَّغ')); return false; }
  var ph = techPhone(to);
  if (!ph){ toast(t('لا جوالَ محفوظٌ لهذا الشخص — أضفه في الحسابات أوّلًا')); return false; }
  var txt = waAsnText(to, kind, ids, when);
  try { window.open(waLink(ph, txt), '_blank', 'noopener'); }
  catch (e){ toast(t('تعذّر الفتح')); return false; }
  ids.forEach(function(id){
    var tk = taskKindOf(id, kind);
    if (tk){ tk.waAt = Date.now(); CORE.set('tasks', tk.id, tk); }
  });
  logEvent('إبلاغ واتساب — ' + to + ' \u00b7 ' + nm(ids.length) + ' ' + t(kindLabel(kind)));
  toast(t('فُتح واتساب') + ' ' + to + ' \u2014 ' + t('اضغط إرسال'));
  statBump();
  return true;
}

