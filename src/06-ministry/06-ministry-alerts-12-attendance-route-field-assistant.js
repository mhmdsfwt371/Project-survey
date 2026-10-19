/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-12-attendance-route-field-assistant.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Attendance (start/end my day), today's route, field assistant suggestions and WhatsApp to the technician on assignment.
   DEFINES : attKey, attToday, attInZone, attLocate, attMark, hm, attMyCard, attTeamCard, routeLocate, routeTasks, routeOrder, kmTxt, mapsUrl, fhNearest … (+10 more)
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
var ATT_IN  = { s:21.2, n:21.6, w:39.7, e:40.2 };   /* نطاقُ المشاعر */
function attKey(uid, day){ return uid + '_' + day; }
function attToday(){ return (STATE.att || {})[attKey(myUid(), dayKey(Date.now()))] || null; }
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
function hm(ms){ var d = new Date(ms); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
/* بطاقةُ الفنيّ: زرٌّ واحدٌ يقول ما بعده */
function attMyCard(){
  if (!isFieldRole(ROLE)) return '';
  var r = attToday();
  var st = !r || !r.in ? 'none' : (r.out ? 'done' : 'in');
  return card('\u{1F552} ' + t('يومي'),
      (st === 'none' ? '<p class="hint" style="margin:0 0 8px">' + esc(t('لم تبدأ بعد — اضغط حين تصل موقعَ العمل.')) + '</p>'
       : st === 'in' ? '<p style="margin:0 0 8px">' + esc(t('بدأتَ')) + ' <b class="num">' + esc(hm(r.in.at)) + '</b>'
           + (r.in.ok === false ? ' ' + pill('خارج النطاق','wrn') : '') + '</p>'
       : '<p style="margin:0 0 8px">' + esc(t('بدأتَ')) + ' <b class="num">' + esc(hm(r.in.at)) + '</b> \u00b7 '
           + esc(t('أنهيتَ')) + ' <b class="num">' + esc(hm(r.out.at)) + '</b> \u00b7 ' + nm(r.hours || 0) + ' ' + esc(t('ساعة')) + '</p>'),
      st === 'none' ? btn('\u25B6 ' + t('بدأتُ يومي'),'btn-primary btn-sm',' data-attin="1"')
      : st === 'in' ? btn('\u25A0 ' + t('أنهيتُ يومي'),'btn-secondary btn-sm',' data-attout="1"')
      : '');
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

/* ═══ طريقُ اليوم ═══
   كانت المهامُّ قائمةً بترتيب الإسناد — والفنيُّ في منى يمشي بينها كما
   جاءت: من الطرف إلى الطرف ثم يعود. فالفرقُ بين خمس نقاطٍ بترتيب القرب
   وخمسٍ عشوائيةٍ ساعةُ مشيٍ في الحرّ. صار «طريقُ اليوم»: يُلتقَط موقعُه،
   وتُرتَّب مهامُّه المفتوحةُ من الأقرب — ثم كلُّ تاليةٍ أقربُ إلى سابقتها
   (الجارُ الأقرب: يكفي لخمسٍ إلى خمس عشرة نقطةً ولا يحتاج أكثر) — وبجوار
   كلِّ نقطةٍ مسافتُها وزرُّ «اتجاهات» يفتح خرائطَ الجهاز نفسِه: أبل على
   الآيفون، جوجل على غيره. */
var ROUTE_POS = null;
function routeLocate(){
  return attLocate().then(function(loc){ ROUTE_POS = loc; render(1); return loc; });
}
function routeTasks(){
  var me = STATE.meta.name || '', out = [];
  Object.keys(STATE.tasks || {}).forEach(function(k){
    var x = STATE.tasks[k];
    if (x.to !== me || x.status === 'معتمد') return;
    var st = siteFind(x.site);
    if (!st || !st.lat || !st.lng) return;
    out.push({ task:x, site:st });
  });
  return out;
}
function routeOrder(items, from){
  var left = items.slice(), order = [], cur = from;
  while (left.length){
    var bi = 0, bd = Infinity;
    for (var i = 0; i < left.length; i++){
      var d = cur ? distKm(cur, left[i].site) : 0;
      if (d < bd){ bd = d; bi = i; }
    }
    var pick = left.splice(bi, 1)[0];
    pick.d = cur ? bd : null;
    order.push(pick);
    cur = { lat:pick.site.lat, lng:pick.site.lng };
  }
  return order;
}
function kmTxt(k){ return k < 1 ? (nm(Math.round(k * 1000)) + ' ' + t('م')) : (nm(Math.round(k * 10) / 10) + ' ' + t('كم')); }
function mapsUrl(lat, lng, label){
  var ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  return ios
    ? 'https://maps.apple.com/?daddr=' + lat + ',' + lng + '&q=' + encodeURIComponent(label || '')
    : 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '&travelmode=walking';
}
/* ═══ (V29.4) مساعدُ الميدان — اقتراحاتُ تسهيل العمل الميداني التي وافق عليها المالك («يلا بينا») ═══
   ١) الأقربُ إليّ: أقربُ النقاط التي لم تُمسح بعد من موقعي — للمشرف وللفني بلا انتظار إسناد.
   ٢) ملخّصُ اليوم الجاهز: ما سجّلتُه اليوم بنصٍّ يُنسَخ أو يُرسَل للمشرف بضغطة.
   ٣) تجهيزُ اليوم بلا نت: خريطةُ الجهاز وآخرُ البيانات وما ينتظر الرفع — في قائمةٍ واحدةٍ قبل الخروج.
   ٤) «انسخ من آخر زيارتي» في نموذج المسح (المسحُ الأسرع): الحقولُ الثابتةُ من آخر زيارةٍ لنفس النوع، والصورُ والتحدياتُ من الموقع. */
var FH_PREP = 0;
function fhNearest(n){
  var P = (typeof MYPOS === 'object' && MYPOS) || (typeof ROUTE_POS === 'object' && ROUTE_POS) || null; if (!P) return null;
  var out = [];
  (STATE.sites || []).forEach(function(x){ if (!+x.lat || !+x.lng) return; var r = STATE.recs[x.id]; if (r && svDone(r)) return; out.push({ x:x, d:distKm(P, x) }); });
  out.sort(function(a, b){ return a.d - b.d; });
  return out.slice(0, n || 5);
}
function fhToday(){
  var me = STATE.meta.name || '', day = dayKey(), O = { n:0, reach:0, un:0, ch:0, ids:[] };
  Object.keys(STATE.recs || {}).forEach(function(id){
    var r = STATE.recs[id]; if (!r || r.by !== me || dayKey(+r.at || 0) !== day) return;
    O.n++; O.ids.push(id);
    if (r.access && r.access !== 'تم الوصول') O.un++; else O.reach++;
    if (chalKeys(r.chals || []).some(function(k){ return k && k !== 'لا توجد تحديات'; })) O.ch++;
  });
  O.photos = (typeof PHOTO_Q === 'object' && PHOTO_Q) ? PHOTO_Q.length : 0;
  O.queue = (typeof CORE === 'object' && CORE.pending) ? (+CORE.pending() || 0) : 0;
  return O;
}
function fhTodayText(O){
  var L = [t('ملخص يوم') + ' ' + dayKey() + ' \u2014 ' + (STATE.meta.name || ''),
           t('زرتُ') + ' ' + O.n + ' ' + t('نقطة') + ': ' + t('وصلتُ') + ' ' + O.reach + '، ' + t('تعذّر') + ' ' + O.un + '، ' + t('فيها تحديات') + ' ' + O.ch + '.'];
  if (O.ids.length) L.push(t('النقاط') + ': ' + O.ids.slice(0, 20).join('، ') + (O.ids.length > 20 ? ' …' : ''));
  L.push(O.queue || O.photos ? t('بانتظار الرفع') + ': ' + O.queue + ' ' + t('تسجيل') + '، ' + O.photos + ' ' + t('صورة') : t('كلُّ عملي مرفوع'));
  return L.join('\n');
}
function fieldHelperCard(){
  if (!isFieldRole(ROLE)) return '';
  var near = fhNearest(5), O = fhToday(), bm = (typeof BASEMAP === 'object' && BASEMAP) || {};
  var ok = function(b, yes, no){ return '<span class="pill ' + (b ? 'ok' : 'wrn') + '">' + (b ? '\u2713 ' : '') + esc(b ? yes : no) + '</span>'; };   /* النصُّ مترجَمٌ عند الطلب */
  return card('\u{1F9F0} ' + t('مساعد الميدان'),
      '<h4 style="margin:0 0 6px">\u{1F4CD} ' + esc(t('الأقرب إليّ — تحتاج زيارة')) + '</h4>'
    + (near ? (near.length ? table(['النقطة', 'المسافة', ''], near.map(function(o){ return [siteIdHtml(o.x) + '<span class="hint" style="margin:0">' + esc(String(o.x.name || '').slice(0, 30)) + '</span>', '<span class="num">' + esc(kmTxt(o.d)) + '</span>',
          btn('\u25C8 ' + t('على الخريطة'), 'btn-quiet btn-sm', ' data-fly="' + esc(o.x.id) + '"') + ' <a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="' + esc(mapsUrl(o.x.lat, o.x.lng, o.x.id)) + '">\u2197 ' + esc(t('اتجاهات')) + '</a>']; }))
            : '<p class="hint" style="margin:0">' + esc(t('لا نقاطَ تحتاج زيارة')) + '</p>')
         : '<p class="hint" style="margin:0 0 6px">' + esc(t('حدِّد موقعك لتظهر أقربُ النقاط إليك')) + '</p>' + btn('\u{1F4CD} ' + t('حدِّد موقعي'), 'btn-primary btn-sm', ' data-fhpos="1"'))
    + '<h4 style="margin:12px 0 6px">\u{1F4CB} ' + esc(t('ملخّص يومي الجاهز')) + '</h4>'
    + '<pre style="white-space:pre-wrap;margin:0 0 6px;font:inherit;background:var(--surface-2);color:var(--ink);padding:8px;border-radius:8px">' + esc(fhTodayText(O)) + '</pre>'   /* (V30.6) */
    + '<div class="actions" style="margin:0">' + btn(t('نسخ'), 'btn-secondary btn-sm', ' data-fhcopy="1"') + btn('\u{1F4AC} ' + t('واتساب'), 'btn-secondary btn-sm', ' data-fhwa="1"') + '</div>'
    + '<h4 style="margin:12px 0 6px">\u{1F4F4} ' + esc(t('تجهيز اليوم بلا نت')) + '</h4>'
    + '<div class="chips" style="margin:0 0 6px">' + ok(!!bm.have, t('خريطة الجهاز محمّلة'), t(bm.loading ? 'خريطة الجهاز تُنزَّل…' : 'خريطة الجهاز لم تُنزَّل')) + ' '
    + ok(!O.queue, t('لا تسجيلات معلّقة'), nm(O.queue) + ' ' + t('تسجيل بانتظار الرفع')) + ' ' + ok(!O.photos, t('لا صور معلّقة'), nm(O.photos) + ' ' + t('صورة بانتظار الرفع')) + ' '
    + ok(!!near, t('موقعي معروف'), t('موقعي غير محدَّد')) + '</div>'
    + '<div class="actions" style="margin:0">' + btn('\u{1F4E5} ' + t('جهّز يومي'), 'btn-primary btn-sm', ' data-fhprep="1"') + btn('\u{1F504} ' + t('زامن الآن'), 'btn-secondary btn-sm', ' data-pull="1"') + '</div>'
    + (FH_PREP ? '<p class="hint" style="margin:6px 0 0">' + esc(t('بدأ التجهيز')) + ' \u00b7 ' + esc(agoTxt(FH_PREP)) + '</p>' : ''));
}
function routeCard(){
  if (!isFieldRole(ROLE)) return '';
  var items = routeTasks();
  if (!items.length) return '';
  var order = routeOrder(items, ROUTE_POS);
  var total = order.reduce(function(a, o){ return a + (o.d || 0); }, 0);
  return cardFlush('\u{1F9ED} ' + t('طريقُ اليوم') + ' \u2014 ' + nm(order.length),
      (ROUTE_POS
        ? '<p class="hint" style="margin:0 0 8px">' + esc(t('من موقعك — الأقربُ أوّلًا، ثم كلُّ تاليةٍ أقربُ إلى سابقتها')) + ' \u00b7 '
          + esc(t('المجموع')) + ' ' + esc(kmTxt(total)) + '</p>'
        : '<p class="hint" style="margin:0 0 8px">' + esc(t('بترتيب الإسناد — اضغط «من موقعي» ليُرتَّب من الأقرب')) + '</p>')
      + table(['#','النقطة','النوع','المسافة',''],
          order.map(function(o, i){
            var st = o.site, x = o.task;
            return [N(i + 1),
                    '<strong>' + esc(st.id) + '</strong><br><span class="hint" style="margin:0">' + esc((st.name || '').slice(0, 26)) + '</span>',
                    pill(kindLabel(x.kind), 'acc'),
                    o.d != null ? '<span class="num">' + esc(kmTxt(o.d)) + '</span>' : '\u2014',
                    '<a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="' + esc(mapsUrl(st.lat, st.lng, st.id)) + '">\u{1F4CD} ' + esc(t('اتجاهات')) + '</a>'];
          })),
      btn('\u{1F4CD} ' + t('من موقعي'),'btn-primary btn-sm',' data-routego="1"'));
}

/* ═══ واتساب للفنيِّ عند الإسناد ═══
   الإشعارُ داخلَ التطبيق لا يراه من لم يفتحه — فإسنادُ التاسعة يُرى في
   الحادية عشرة. والمتصفّحُ لا يُرسِل واتساب وحده: يفتح المحادثةَ والرسالةَ
   جاهزةً ويبقى الإرسالُ ضغطةً. فبعد كلِّ إسنادٍ زرٌّ واحد: يفتح واتساب
   الفنيِّ برسالةٍ فيها النقاطُ ونوعُ العمل والموعدُ ورابطُ التطبيق —
   وتُسجَّل في «آخر ما تمّ» أنه أُبلغ. وفي سجل الإسنادات زرٌّ لكلِّ إسنادٍ
   مفتوحٍ لمن لم يُبلَغ بعد. */
var WA_LAST = null;   /* آخرُ إسناد: { to, kind, ids, when } */
function techPhone(name){
  var U = STATE.users || {};
  for (var k in U) if (U[k] && U[k].name === name && U[k].ph) return String(U[k].ph);
  var x = techsList(1).filter(function(y){ return y.n === name; })[0];
  return x && x.ph ? String(x.ph) : '';
}
function waAsnText(to, kind, ids, when){
  var L = ids.map(function(id){
    var st = siteFind(id) || {};
    return '\u2022 ' + id + (st.name ? ' \u2014 ' + String(st.name).slice(0, 30) : '') + (st.zone ? ' (' + st.zone + ')' : '');
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
/* بطاقةٌ بعد الإسناد: أبلغه الآن */
function waAsnCard(){
  if (!WA_LAST || !WA_LAST.ids.length) return '';
  var w2 = WA_LAST, ph = techPhone(w2.to);
  return card('\u{1F4F1} ' + t('أبلغ') + ' ' + esc(w2.to),
      '<p class="hint" style="margin:0 0 8px">' + nm(w2.ids.length) + ' ' + esc(t('نقطة')) + ' \u2014 ' + esc(t(kindLabel(w2.kind)))
      + (ph ? '' : ' \u00b7 ' + pill('لا جوالَ محفوظ','off')) + '</p>',
      btn('\u{1F4F1} ' + t('واتساب'),'btn-primary btn-sm',' data-waasn="1"')
      + btn('\u2715','btn-quiet btn-sm',' data-waasnx="0"'));
}
function inboxItems(){
  var out = [], S = siteStats();
  var solWait = 0, qaWait = 0, ncrOpen = 0, chgWait = 0, handReadyN = 0, lateN = 0, tkWait = 0;
  Object.keys(STATE.inss).forEach(function(k){
    var r = STATE.inss[k];
    if (r && r.solution && r.solution.status === 'مقترح') solWait++;
    if (r && r.status === 'مُركّب' && !r.approved) qaWait++;
  });
  STATE.sites.forEach(function(x){ if (typeof handReady === 'function' && handReady(x)) handReadyN++; });
  if (typeof NCRS !== 'undefined') ncrOpen = NCRS.filter(function(x){ return x.st !== 'مغلق' && x.st !== 'ملغى'; }).length;
  if (typeof CHANGES !== 'undefined') chgWait = CHANGES.filter(function(x){ return x.st === 'مقدَّم'; }).length;
  var today = dayKey(Date.now());
  Object.keys(STATE.tasks).forEach(function(k){
    var x = STATE.tasks[k]; if (!x || x.status === 'معتمد') return;
    if (x.when && x.when < today && !svVisited(STATE.recs[x.site])) lateN++;   /* (V32.6) زيارةٌ تمّت بأيِّ نتيجة ليست متأخرة */
    if (x.kind === 'visit' && svReview(STATE.recs[x.site]) === 'pending') tkWait++;
  });
  out.push(['زياراتٌ تنتظر اعتمادك', S.pending, 'svappr', S.pending ? 'wrn' : 'ok']);
  out.push(['حلولٌ مقترحةٌ تنتظر اعتمادك', solWait, 'solution', solWait ? 'wrn' : 'ok']);
  out.push(['تركيباتٌ تنتظر التدقيق', qaWait, 'qa', qaWait ? 'wrn' : 'ok']);
  out.push(['نقاطٌ جاهزةٌ للتسليم', handReadyN, 'hand', handReadyN ? 'acc' : 'ok']);
  out.push(['بلاغاتُ عدمِ مطابقةٍ مفتوحة', ncrOpen, 'ncr', ncrOpen ? 'bad' : 'ok']);
  out.push(['طلباتُ تغييرٍ معلّقة', chgWait, 'chg', chgWait ? 'wrn' : 'ok']);
  out.push(['مهامُّ تجاوزت موعدَها', lateN, 'req', lateN ? 'bad' : 'ok']);
  out.push(['زياراتٌ مردودةٌ لم تُعَد', S.revisit, 'mywork', S.revisit ? 'wrn' : 'ok']);
  return out;
}
function inboxCard(){
  var L = inboxItems(), total = L.reduce(function(a, x){ return a + x[1]; }, 0);
  return card('\u{1F3AF} ' + t('قراراتُك اليوم') + ' — ' + nm(total),
      '<div class="list">' + L.map(function(x){
        return '<div class="list-item"><div class="li-main"><div class="li-t">' + esc(t(x[0])) + '</div></div>'
          + '<div class="li-end"><b class="num" style="margin-inline-end:8px">' + nm(x[1]) + '</b>'
          + (x[1] && seesPage(PARENT[x[2]] || x[2]) ? btn('\u{1F4CD}','btn-quiet btn-sm',' data-p="' + esc(x[2]) + '"') : '')
          + '</div></div>';
      }).join('') + '</div>'
      + '<p class="hint" style="margin:8px 0 0">' + esc(t(total ? 'كلُّ رقمٍ هنا قرارٌ ينتظرك — ويختفي حين تتّخذه.' : 'الطاولةُ نظيفة — لا قرارَ ينتظرك الآن.')) + '</p>');
}