/* ═══ (V37.75) المخيماتُ المركزية — إشغالٌ حيٌّ من نظام البطاقات ═══
   المصادر:
   · event.nusukcard.net/api/rfid/latest/stream  — قائمةُ القرّاء (بلا توكن غالبًا)
   · api.nusukcard.net/api/v1/tents             — قائمةُ المخيمات (Bearer)
   · api.nusukcard.net/api/v1/dashboards/tents/{id}/overview — الإشغال الحي (Bearer)
   · livefeed.nusukcard.net + liveViewApiKey     — البث المباشر (مفتاح عام)
   الربط: رقمُ القارئ (serial) لنقاطنا = readerId في نظامهم = rfidConnection في تفاصيل خيمتهم.
   التوكن: يحفظه المهندسُ في settings/extApi يدويًّا كلَّ ~٤ أيام.
   القواعد: قراءةٌ فقط — ممنوعٌ أي POST/PUT/DELETE على api.nusukcard.net.
   برّه أرقام الوزارة. ═══ */

var EXT = {
  tok: null, expAt: 0,          /* التوكن ووقت انتهائه */
  readers: null, readersAt: 0,  /* stream القرّاء (cache 5 دقائق) */
  tents: null, tentsAt: 0,      /* قائمة الخيام (cache ساعة) */
  ov: {},                       /* {tentId: {data, at}} overview cache */
  busy: false, err: ''          /* حالة أعلى مستوى */
};

/* ── مفاتيح ثابتة (من env.js المكشوف عامًّا) ── */
var EXT_API   = 'https://api.nusukcard.net/api/v1';
var EXT_STREAM= 'https://event.nusukcard.net/api/rfid/latest/stream';
var EXT_LIVE  = 'https://livefeed.nusukcard.net';
var EXT_LIVE_KEY = 'DJsowqfnR2qlP32BzySo_8hNUy3Wypn2xFBzCcPELlo';

/* ── قراءة التوكن من Firestore ── */
function extTokLoad(){
  if (!may('settings')) return Promise.resolve(null);   /* (V37.80) القاعدةُ لا تُقرئه إلا للمكتب */
  if (!FB.ready || !FB.db){ EXT._tokAsked = false; return Promise.resolve(null); }   /* يُعاد المحاولةُ حين تجهز القاعدة */
  return DB.col('settings').doc('extApi').get().then(function(doc){
    if (!doc || !doc.exists) return;
    var d = doc.data();
    EXT.tok = d.tok || null;
    EXT.expAt = d.expAt || 0;
    if (CUR === 'mfu' && tabCur('mfu') === 'mcamps') render(1);
  }).catch(function(e){ softErr('extApi', e, ''); });
}

/* ── حفظ توكن جديد ── */
function extTokSave(tok){
  if (!may('settings')){ toast(t('التوكنُ للمهندس وحدَه')); return; }
  var t0 = String(tok || '').trim();
  if (!t0){ toast(t('لصق التوكن أوّلًا')); return; }
  var expAt = 0;
  try {
    var pl = JSON.parse(atob(t0.split('.')[1]));
    expAt = (pl.exp || 0) * 1000;
  } catch(e){}
  EXT.tok = t0; EXT.expAt = expAt;
  CORE.set('cfg', 'extApi', { tok:t0, expAt:expAt, updAt:Date.now() }); CORE.saveSoon();
  toast(t(expAt ? ('حُفظ التوكن — يصلح حتى ' + new Date(expAt).toLocaleDateString('ar')) : 'حُفظ التوكن'));
  render(1);
}

/* ── مسح التوكن ── */
function extTokClear(){
  if (!may('settings')) return;
  EXT.tok = null; EXT.expAt = 0;
  CORE.set('cfg', 'extApi', { tok:'', expAt:0, updAt:Date.now() }); CORE.saveSoon();
  toast(t('مُسح التوكن'));
  render(1);
}

/* ── Fetch مساعد (Bearer + CORS headers) ── */
function extFetch(url, useBearer){
  /* (V37.80) Origin وReferer ترويستان محظورتان يُسقطهما المتصفحُ بصمت — المتصفحُ يرسلهما بنفسه */
  var hdrs = {};
  if (useBearer && EXT.tok) hdrs['Authorization'] = 'Bearer ' + EXT.tok;
  return fetch(url, { headers:hdrs, credentials:'omit' });
}

/* ── قائمة القرّاء (5 دقائق cache) ── */
function extReadersLoad(){
  if (EXT.bridge) return Promise.resolve(EXT.readers || null);   /* (V37.93) الجسرُ اليدويّ: لا طلبَ من التطبيق */
  if (EXT.readers && Date.now() - EXT.readersAt < 300000) return Promise.resolve(EXT.readers);
  return extFetch(EXT_STREAM, false).then(function(r){
    if (!r.ok) return extFetch(EXT_STREAM, true).then(function(r2){ return r2.ok ? r2.json() : null; });
    return r.json();
  }).then(function(arr){
    if (!arr || !Array.isArray(arr)){ EXT.rdErr = 'تعذّر قراءة بثّ القرّاء'; return null; }
    EXT.rdErr = '';
    var map = {};
    arr.forEach(function(x){ if (x.readerId) map[extSerKey(x.readerId)] = x; });   /* (V37.84) مفتاحٌ مطبَّع */
    EXT.readers = map; EXT.readersAt = Date.now();
    return map;
  }).catch(function(){ EXT.rdErr = 'تعذّر الوصول إلى بثّ القرّاء'; return null; });
}

/* ── قائمة الخيام (ساعة cache) ── */
function extTentsLoad(){
  if (EXT.bridge) return Promise.resolve(EXT.tents || null);   /* (V37.93) */
  if (!EXT.tok) return Promise.resolve(null);
  if (EXT.tents && Date.now() - EXT.tentsAt < 3600000) return Promise.resolve(EXT.tents);
  /* perPage=50, نجمع كل الصفحات */
  var all = {}, by = {}, page = 1, per = 50;
  function fetchPage(){
    return extFetch(EXT_API + '/tents?page=' + page + '&perPage=' + per, true)
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        if (!j || !j.data) return;
        (Array.isArray(j.data) ? j.data : [j.data]).forEach(function(t){
          if (!t.code) return;
          if (!all[t.code]) all[t.code] = t;
          var ck = extCodeKey(t.code); (by[ck] = by[ck] || []).push(t);   /* (V37.85) الرقمُ نفسُه قد يتكرّر في مشعرين */
        });
        /* (V37.80) شكلُ الترقيم غيرُ مؤكَّد: نكمل ما دامت الصفحةُ ممتلئة — بسقف ٦٠ صفحة */
        var got = Array.isArray(j.data) ? j.data.length : 0;
        var meta = (j.meta || {}).pagination || j.meta || {};
        var more = (meta.currentPage && meta.lastPage) ? meta.currentPage < meta.lastPage : got >= per;
        if (more && page < 60){ page++; return fetchPage(); }
      });
  }
  return fetchPage().then(function(){
    if (!Object.keys(all).length) return null;
    EXT.tents = all; EXT.tentsBy = by; EXT.tentsAt = Date.now(); return all;
  }).catch(function(){ return null; });
}

/* ── نظرة عامة لخيمة واحدة (طلب عند الفتح + cache دقيقة) ── */
function extOvLoad(tentId, forceRefresh){
  if (EXT.bridge) return Promise.resolve((tentId && EXT.ov[tentId]) ? EXT.ov[tentId].data : null);   /* (V37.93) */
  if (!EXT.tok || !tentId) return Promise.resolve(null);
  if (!forceRefresh && EXT.ov[tentId] && Date.now() - EXT.ov[tentId].at < 60000)
    return Promise.resolve(EXT.ov[tentId].data);
  return extFetch(EXT_API + '/dashboards/tents/' + tentId + '/overview', true)
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      var d = (j && j.data) ? j.data : null;
      if (d) EXT.ov[tentId] = { data:d, at:Date.now() };
      return d;
    }).catch(function(){ return null; });
}


/* ── كارت الإشغال ── */
function extOvCard(tentCode, ov, readerInfo, tentMeta){
  var cap   = (ov.occupancyStatus || {}).totalCapacity || 0;
  var wCard = (ov.occupancyStatus || {}).currentlyOccupied || 0;
  var woCard= (ov.occupancyStatus || {}).withoutBracelet || 0;
  var other = (ov.occupancyStatus || {}).fromOtherCamps || 0;
  var total = wCard + woCard + other;
  var pct   = cap ? Math.round(total / cap * 100) : 0;
  var barC  = pct >= 75 ? '#27AE60' : pct >= 40 ? '#E2B33C' : '#C0392B';
  var insideT = ((ov.averageTime || {}).insideCamp  || '—');
  var transitT= ((ov.averageTime || {}).transitTime || '—');

  /* آخر إشارة القارئ */
  var lastSeen = '', lastOk = false;
  if (readerInfo && readerInfo.timestamp){
    var ms = Date.now() - new Date(readerInfo.timestamp).getTime();
    var mins = Math.floor(ms/60000);
    lastOk = mins < 30;
    lastSeen = mins < 2 ? t('الآن') : mins < 60 ? nm(mins) + ' ' + t('د') : nm(Math.floor(mins/60)) + ' ' + t('س');
  }

  var group = (tentMeta && tentMeta.tentGroup) ? tentMeta.tentGroup : '';
  var op    = (tentMeta && tentMeta.serviceOperators && tentMeta.serviceOperators[0]) ? tentMeta.serviceOperators[0] : '';

  return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid ' + barC + '">'
    + '<div class="card-body">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px">'
    +   '<div><b class="num" style="font-size:18px">' + bdiText(tentCode) + '</b>'
    +   (group ? ' <span class="hint" style="font-size:13px">— ' + esc(group) + '</span>' : '')
    +   (op ? '<div class="hint" style="font-size:12px;margin-top:2px">' + esc(op) + '</div>' : '') + '</div>'
    +   '<div style="text-align:end">'
    +     '<div class="num" style="font-size:28px;font-weight:800;color:' + barC + '">' + nm(pct) + '%</div>'
    +     (lastSeen ? '<div class="hint" style="font-size:12px">'
    +       '<span style="width:8px;height:8px;border-radius:50%;display:inline-block;background:' + (lastOk ? '#27AE60' : '#E2B33C') + ';margin-inline-end:4px"></span>'
    +       esc(t('آخر إشارة')) + ' ' + lastSeen + '</div>' : '') + '</div>'
    + '</div>'
    + '<div style="background:var(--surface-2);border-radius:8px;height:8px;overflow:hidden;margin-bottom:10px">'
    +   '<div style="height:100%;width:' + Math.min(100,pct) + '%;background:' + barC + ';transition:width .4s"></div></div>'
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">'
    +   extStatBox(t('السعة'), nm(cap), '#5B6E7C')
    +   extStatBox(t('بكروت'), nm(wCard), '#2E86DE')
    +   extStatBox(t('بدون'), nm(woCard), '#E2B33C')
    +   extStatBox(t('من أخرى'), nm(other), '#8E44AD')
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">'
    +   '<div><span class="hint">' + esc(t('داخل المخيم')) + '</span> <b>' + esc(insideT) + '</b></div>'
    +   '<div><span class="hint">' + esc(t('وقت العبور')) + '</span> <b>' + esc(transitT) + '</b></div>'
    + '</div>'
    + '</div></div>';
}
function extStatBox(label, val, color){
  return '<div style="background:var(--surface-2);border-radius:8px;padding:6px 8px;text-align:center">'
    + '<div class="num" style="font-size:16px;font-weight:800;color:' + color + '">' + val + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + esc(label) + '</div></div>';
}

/* ── بطاقة إعداد التوكن (للمهندس) ── */
function extTokCard(){
  var expMsg = '', expColor = '#27AE60';
  if (EXT.tok && EXT.expAt){
    var rem = EXT.expAt - Date.now();
    var days = Math.floor(rem / 86400000);
    if (rem < 0){ expMsg = t('انتهى التوكن — جدّده الآن'); expColor = '#C0392B'; }
    else if (days < 1){ expMsg = t('ينتهي خلال ساعات — جدّده'); expColor = '#E2B33C'; }
    else { expMsg = t('ينتهي بعد') + ' ' + nm(days) + ' ' + t('يوم'); }
  }
  var h = '<div class="card" style="margin:0 0 12px"><div class="card-body">'
    + '<div style="font-weight:700;margin-bottom:8px">🔑 ' + esc(t('ربط نظام البطاقات')) + '</div>';
  if (EXT.tok){
    h += '<div style="margin-bottom:8px;font-size:13px">'
      + '<span style="color:' + expColor + '">●</span> '
      + esc(expMsg) + '</div>'
      + btn('\u267B ' + t('تجديد التوكن'), 'btn-secondary btn-sm', ' data-exttokclear="1"');
  } else {
    h += '<p class="hint" style="font-size:13px;margin:0 0 8px">'
      + esc(t('افتح nusukcard.net ← Console في المتصفح ← شغّل:')) + '</p>'
      + '<code style="font-size:11px;display:block;background:var(--surface-2);padding:6px;border-radius:6px;direction:ltr;word-break:break-all;margin-bottom:8px">'
      + esc('copy(local' + "Storage.getItem('mj.accessToken'))")
      + '</code>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
      + '<input id="extTokInp" type="password" dir="ltr" autocomplete="off" placeholder="eyJ…" style="flex:1;min-width:0;font-size:12px" />'
      + btn(t('حفظ'), 'btn-primary btn-sm', ' data-exttoksave="1"') + '</div>';
  }
  h += '</div></div>';
  return h;
}

/* ── جرد التوافق: نقاطنا ↔ قرّاؤهم ↔ خيامهم ── */
var EXT_MATCH_STATE = null;   /* {matched:[{serial,tentCode,tentId,tentMeta,reader,point}], unmatched:[serial], at:ts} */

function extMatchLoad(forceRefresh){
  if (!forceRefresh && EXT_MATCH_STATE && Date.now() - EXT_MATCH_STATE.at < 300000)
    return Promise.resolve(EXT_MATCH_STATE);
  EXT.busy = true; EXT.err = '';   /* (V37.80) لا رسمَ من داخل الرسم — الشاشةُ تعرض «جارٍ التحميل» بنفسها */
  return Promise.all([extReadersLoad(), extTentsLoad()]).then(function(res){
    var readers = res[0] || {}, tents = res[1] || {};
    /* (V37.85) كلُّ نقطةٍ مركَّبة تُربَط بمفتاحين: المخيمُ بشاخصه وقربِه، والقارئُ بسيريالِه —
       وما يختلف فيه المفتاحان يُعلَّم تحذيرًا */
    var matched = [], unmatched = [];
    (STATE.sites || []).forEach(function(x){
      var ins = STATE.inss[x.id]; if (!ins || ins.status !== 'مُركّب') return;
      var L = extLink(x);
      var tent = L.tent || (L.reader ? extTentByCode(L.reader.locationName) : null);
      if (!tent && !L.reader){ if (L.ser) unmatched.push(L.ser); return; }
      matched.push({ serial:L.ser, tentCode:tent ? tent.code : ((L.reader && L.reader.locationName) || ''), tentId:tent ? tent.id : '', tentMeta:tent,
                     reader:L.reader, point:{ id:x.id, name:x.name || x.id, zone:x.zone || '' }, by:L.by, warn:L.warn });
    });
    EXT_MATCH_STATE = { matched:matched, unmatched:unmatched, at:Date.now() };
    if (EXT.rdErr) EXT.err = EXT.rdErr;
    EXT.busy = false; render(1); return EXT_MATCH_STATE;
  }).catch(function(e){ EXT.busy = false; EXT.err = String(e); render(1); return null; });
}

/* ── الشاشة الرئيسية ── */
var EXT_OV_LOADED = {};   /* {tentId: true} جُلبت بالفعل */
function mtCamps(){
  extBridgePendingApply();   /* (V37.94) ما جاءت به الإشارةُ المرجعية */
  /* أوّل مرة: حمّل التوكن من السحابة */
  if (!EXT.tok && !EXT._tokAsked){ EXT._tokAsked = true; extTokLoad(); }

  var h = '';

  /* بطاقة الإعداد — للمهندس فقط */
  extBridgeLoad();   /* (V37.93) آخرُ جسرٍ محفوظ — لكلِّ الحسابات */
  if (may('settings')) h += extBridgeCard() + mtDetails(t('طريقة التوكن — تعمل من موقع النظام فقط'), extTokCard(), '\u{1F511}') + ex47Card() + ex47OrphCard();   /* (V37.88) (V37.92) (V37.93) */

  if (!EXT.tok && !EXT.bridge){
    return h + (may('settings') ? alertBox('info', t('شغّل أمر الجسر من البطاقة أعلاه والصق ناتجه — فتعمل هذه الشاشة.')) : extSnapView());   /* (V37.81) (V37.93) */
  }

  /* تحميل المطابقات */
  if (!EXT_MATCH_STATE || EXT.busy){
    if (!EXT.busy) extMatchLoad();
    return h + '<div class="hint" style="text-align:center;padding:20px">⟳ ' + esc(t('جارٍ تحميل بيانات المخيمات…')) + '</div>';
  }

  if (EXT.err) h += alertBox('warn', t('خطأ في تحميل البيانات') + ': ' + EXT.err);

  var matched = EXT_MATCH_STATE.matched;
  var unmatched = EXT_MATCH_STATE.unmatched;
  h += extBulkCard();   /* (V37.87) الربطُ الجماعيّ — للمهندس */

  if (!matched.length){
    return h + alertBox('info', t('لم يُعثَر على مطابقة بين قرّاء نظامهم وسيريالات نقاطنا المُركَّبة.'));
  }

  /* زر تحديث + عداد */
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:6px">'
    + '<div class="hint" style="font-size:13px">' + nm(matched.length) + ' ' + esc(t('مخيم مطابق')) + (unmatched.length ? ' · ' + nm(unmatched.length) + ' ' + esc(t('غير مطابق')) : '') + '</div>'
    + btn('\u21BB ' + t('تحديث'), 'btn-secondary btn-sm', ' data-extrefresh="1"') + '</div>';

  /* لكل مخيم مطابق */
  matched.forEach(function(m){
    var tentId = m.tentId;
    if (!tentId){
      /* خيمة موجودة في القرّاء لكن ما في مطابقة بالكود في قائمة الخيام */
      h += '<div class="card" style="margin:0 0 10px;opacity:.6"><div class="card-body">'
        + '<b class="num">' + bdiText(m.tentCode || m.serial) + '</b>'
        + ' <span class="hint">' + esc(t('رُصد القارئ — خيمته غير موجودة في القائمة')) + '</span></div></div>';
      return;
    }
    var cached = EXT.ov[tentId];
    if (!EXT_OV_LOADED[tentId]){
      EXT_OV_LOADED[tentId] = true;
      extOvLoad(tentId).then(function(){ extSnapMaybe(); render(1); });   /* (V37.81) لقطةٌ للوزارة */
      h += '<div class="card" style="margin:0 0 10px"><div class="card-body">'
        + '<b class="num">' + bdiText(m.tentCode) + '</b>'
        + ' <span class="hint">⟳ ' + esc(t('يُحمَّل…')) + '</span></div></div>';
      return;
    }
    if (!cached){
      h += '<div class="card" style="margin:0 0 10px"><div class="card-body">'
        + '<b class="num">' + bdiText(m.tentCode) + '</b>'
        + ' <span class="hint">' + esc(t('تعذّر جلب الإشغال')) + '</span></div></div>';
      return;
    }
    if (m.warn) h += alertBox('warn', t('القارئ') + ' ' + (m.serial || '') + ' ' + t('مسجَّلٌ في النظام على') + ' ' + m.warn + ' ' + t('لا على مخيم النقطة') + ' ' + (m.point.name || m.point.id) + ' \u2014 ' + t('راجع السيريال'));   /* (V37.85) */
    h += extOvCard(m.tentCode, cached.data, m.reader, m.tentMeta);
  });

  /* قسم غير مطابق مطويّ */
  if (unmatched.length){
    h += mtDetails(t('قرّاء مُركَّبة لكن غير مطابقة في نظامهم') + ' (' + nm(unmatched.length) + ')',
      '<div class="hint" style="font-size:12px">' + unmatched.map(function(s){ return '<code>' + esc(s) + '</code>'; }).join(' · ') + '</div>', '📡');
  }

  return h;
}

/* ═══ (V37.80) سيريالُ القارئ من سجلّ التركيب ═══
   السيريالاتُ تُحفَظ بمفتاح القطعة (ins.serials[code]) — قطعةُ القارئ رمزُها يبدأ بـ rdr أو اسمُها «قارئ». */
/* (V37.84) مفتاحُ الربط بنظام البطاقات = رقمُ القارئ. يُطبَّع على الجانبين: أرقامٌ فقط بلا أصفارٍ بادئة —
   فمسافةٌ أو شرطةٌ أو صفرٌ في أوّل ما كتبه الفنيُّ لا تقطع الربط */
function extSerKey(v){ var d = String(v == null ? '' : v).replace(/\D/g, ''); return d.replace(/^0+/, '') || d; }
/* (V37.85) كودُ الخيمة يُطبَّع: أرقامٌ لاتينية، بلا مسافات، والشرطةُ كالمائلة — «٣٨ / ٥٦» = «38/56» */
function extCodeKey(c){
  return String(c == null ? '' : c).replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 0x660); })
    .replace(/\s+/g, '').replace(/[-_\\]/g, '/').toLowerCase();
}
function extTentByCode(code){ var L = EXT.tentsBy && EXT.tentsBy[extCodeKey(code)]; return (L && L[0]) || null; }
/* المخيمُ بشاخصه — والرقمُ نفسُه في منى وعرفات، فيُشترَط القربُ: أقربُ خيمةٍ بالكود في ٣٠٠ متر وإلا فلا */
function extTentForSite(x){
  if (!x || x.type !== 'مخيم' || !x.sign || !EXT.tentsBy || !+x.lat) return null;
  var L = EXT.tentsBy[extCodeKey(x.sign)] || [], best = null;
  L.forEach(function(tn){
    var la = +tn.latitude, ln = +tn.longitude; if (!la || !ln) return;
    var d = geoDist([+x.lat, +x.lng], [la, ln]); if (!best || d < best.d) best = { t:tn, d:d };
  });
  return (best && best.d <= 300) ? best : null;
}
/* الربطُ الكامل لنقطة: by = 'sign' | 'serial' | '' ، وwarn = موقعُ القارئ في النظام حين يخالف مخيمَ النقطة */
function extLink(x){
  var ins = STATE.inss[x.id], ser = extReaderSerial(ins);
  var rd = (ser && EXT.readers) ? EXT.readers[extSerKey(ser)] || null : null;
  if (x && x.nk){   /* (V37.86) اسمُ الربط الصريح يتقدّم كلَّ مفتاح */
    var key = extNameKey(x.nk), M = extNames(), hit = M && M[key];
    var on = { ser:ser, reader:rd, tent:extTentByCode(x.nk), dist:null, by:'name', warn:'', missing:!!(M && !hit) };
    if (!rd && hit && hit.rd.length) on.reader = EXT.readers[hit.rd[0]] || null;   /* الممرُّ بلا سيريال: قارئُه باسمه */
    if (rd && rd.locationName && extNameKey(rd.locationName) !== key) on.warn = String(rd.locationName);
    return on;
  }
  var ts = extTentForSite(x), exp = ts ? ts.t.code : ((x && x.type === 'مخيم' && x.sign) ? x.sign : '');
  var o = { ser:ser, reader:rd, tent:ts ? ts.t : null, dist:ts ? Math.round(ts.d) : null, by:ts ? 'sign' : (rd ? 'serial' : ''), warn:'' };
  if (rd && exp && rd.locationName && extCodeKey(rd.locationName) !== extCodeKey(exp)) o.warn = String(rd.locationName);
  return o;
}
function extReaderSerial(ins){
  var S = (ins && ins.serials) || {}, out = '';
  Object.keys(S).forEach(function(k){
    if (out) return; var v = String(S[k] || '').trim(); if (!v) return;
    if (/^rdr/i.test(k) || /قارئ/.test(itemName(k))) out = v;
  });
  return out;
}

/* ═══ (V37.80) كارتُ «التجارب والديمو» في متابعة الوزارة ═══
   طلبُ المالك: كارتٌ بجوار المسح والزيارة، يُضغط فتظهر نقاطُ التجربة بحالة تركيبها واتصالها
   (أونلاين/أوفلاين) وبيانات نظام البطاقات. الاتصالُ من نبضات أداة الفحص (hb) ثم فحص المتصفح،
   وبياناتُ البطاقات من بثّ القرّاء برقم القارئ المسجَّل في التركيب. */
function pilotSites(){ return (STATE.sites || []).filter(function(x){ return x && x.pilot; }); }
function pilotNet(x){
  var HB = STATE.hb || {}, up = 0, n = 0, at = 0;
  Object.keys(HB).forEach(function(k){
    var h = HB[k]; if (!h || h.site !== x.id || !h.st) return;
    n++; if (h.st === 'up') up++;
    var ts = Date.parse(h.ts || '') || +h.ts || 0; if (ts > at) at = ts;
  });
  if (n) return { st: up === n ? 'متصل' : up ? 'متصل جزئيًّا' : 'غير متصل', at:at, src:'أداة الفحص', up:up, n:n };
  var me = HB[x.id];
  if (me && typeof me.alive === 'boolean') return { st: me.alive ? 'متصل' : 'غير متصل', at:+me.at || 0, src:'فحص المتصفح', up:me.alive ? 1 : 0, n:1 };
  var nk = pilotNusuk(x);
  if (nk.at) return { st: Date.now() - nk.at < 30 * 60000 ? 'متصل' : 'غير متصل', at:nk.at, src:'نظام البطاقات', up:0, n:0 };
  return { st:'لا إشارة', at:0, src:'', up:0, n:0 };
}
function pilotNusuk(x){
  var ins = STATE.inss[x.id], ser = extReaderSerial(ins), o = { ser:ser, loc:'', at:0, occ:'', by:'', warn:'' };
  if (EXT.readers || EXT.tentsBy){   /* (V37.85) حيٌّ: بالشاخص والسيريال معًا */
    var L = extLink(x); o.by = L.by; o.warn = L.warn; o.missing = !!L.missing;
    if (L.reader){ o.loc = L.reader.locationName || ''; o.at = Date.parse(L.reader.timestamp || '') || 0; }
    else if (L.tent) o.loc = L.tent.code || '';
    var tn = L.tent || (L.reader ? extTentByCode(L.reader.locationName) : null);
    var ov = tn && EXT.ov[tn.id] && EXT.ov[tn.id].data;
    if (ov && ov.occupancyStatus){
      var c = ov.occupancyStatus, tot = (c.currentlyOccupied || 0) + (c.withoutBracelet || 0) + (c.fromOtherCamps || 0);
      o.occ = (c.totalCapacity ? Math.round(tot / c.totalCapacity * 100) + '٪ · ' : '') + tot + ' / ' + (c.totalCapacity || 0);
    }
    if (o.loc || o.by || o.missing) return o;
  }
  /* بلا بثٍّ حيّ: من لقطة المكتب (V37.81) */
  var Z = STATE.extSnap && STATE.extSnap.sites && STATE.extSnap.sites[x.id];
  if (!Z || (ser && Z.ser && extSerKey(Z.ser) !== extSerKey(ser))) return o;
  var C = STATE.extSnap.camps && STATE.extSnap.camps[Z.code];
  o.loc = Z.code || ''; o.at = Date.parse(Z.ts || '') || 0; o.snap = true; o.by = Z.by || ''; o.warn = Z.warn || '';
  if (C){ var tt = C.w + C.wo + C.ot; o.occ = (C.cap ? Math.round(tt / C.cap * 100) + '٪ · ' : '') + tt + ' / ' + C.cap; }
  return o;
}
/* شارةُ التحقق — تُقرأ في بطاقة التركيب وقائمة التجارب */
function extCheckText(o){
  if (!o) return '\u2014';
  if (o.warn) return '\u26A0 ' + t('القارئ على') + ' ' + o.warn;
  if (o.missing) return '\u26A0 ' + t('اسمُ الربط غيرُ موجودٍ في النظام');
  if (o.by === 'name' && o.at) return o.ser ? '\u2713 ' + t('مطابق — الاسم والقارئ') : '\u2713 ' + t('بالاسم — بلا سيريالٍ للتحقق');
  if (o.by === 'name') return '\u2713 ' + t('بالاسم') + (o.ser ? ' \u00b7 ' + t('القارئ لم يظهر بعد') : '');
  if (o.by === 'sign' && o.at) return '\u2713 ' + t('مطابق — الشاخص والقارئ');
  if (o.by === 'sign') return '\u2713 ' + t('بالشاخص') + (o.ser ? ' \u00b7 ' + t('القارئ لم يظهر بعد') : '');
  if (o.by === 'serial') return '\u2713 ' + t('بالسيريال');
  return o.ser ? t('القارئ لم يظهر بعد') : '\u2014';
}
function extCheckPill(x){
  if (!x || !STATE.inss[x.id]) return '';
  pilotKick();
  var o = pilotNusuk(x); if (!o.by && !o.warn && !o.ser) return '';
  return pill(extCheckText(o), (o.warn || o.missing) ? 'bad' : (o.by ? 'ok' : 'warn'));
}

function pilotKick(){
  if (EXT._plAt && Date.now() - EXT._plAt < 60000) return;
  EXT._plAt = Date.now();
  extBridgeLoad();   /* (V37.93) */
  var tk = (!EXT.tok && !EXT._tokAsked) ? (EXT._tokAsked = true, extTokLoad()) : Promise.resolve(null);
  if (!may('settings')){ extSnapLoad(); return; }   /* (V37.81) غيرُ المكتب يقرأ اللقطة */
  tk.then(function(){ return extReadersLoad(); }).then(function(){
    if ((EXT.tok || EXT.bridge) && !EXT.busy) return extMatchLoad().then(function(st){
      var ids = {}; (st ? st.matched : []).forEach(function(m){
        var p = siteFind(m.point.id); if (p && p.pilot && m.tentId && !ids[m.tentId]){ ids[m.tentId] = 1; extOvLoad(m.tentId); }
      });
      setTimeout(extSnapMaybe, 4000);   /* (V37.81) */
    });
  }).then(function(){ render(1); }).catch(function(e){ softErr('بيانات نظام البطاقات للتجارب', e, ''); });
}
function pilotAgo(at){
  if (!at) return '\u2014';
  var m = Math.floor((Date.now() - at) / 60000);
  return m < 2 ? t('الآن') : m < 60 ? m + ' ' + t('د') : m < 2880 ? Math.floor(m / 60) + ' ' + t('س') : Math.floor(m / 1440) + ' ' + t('يوم');
}
function pilotRowsList(){
  pilotKick();
  return pilotSites().map(function(x){
    var ins = STATE.inss[x.id], f = (typeof trialForSite === 'function') ? trialForSite(x.id) : null;
    var nt = pilotNet(x), nk = pilotNusuk(x);
    var insSt = !ins ? 'لم يُركَّب' : ins.status === 'مسودّة' ? 'مسودّة' : (ins.status || '') + ' · ' + (ins.approved ? 'معتمد' : 'بانتظار التدقيق');
    return [x.id, x.name || '', t(x.zone || ''), t(x.type || ''), f ? (f.row.n || '') + (f.row.out ? ' · ' + t(f.row.out) : '') : '\u2014',
            t(insSt), ins && ins.status !== 'مسودّة' ? String(insRevs(ins).length + 1) : '\u2014',
            t(nt.st) + (nt.n > 1 ? ' (' + nt.up + '/' + nt.n + ')' : '') + (nt.src ? ' \u00b7 ' + t(nt.src) : ''), pilotAgo(nt.at),
            nk.ser || (ins ? t('لا سيريال قارئ') : '\u2014'), extCheckText(nk),   /* (V37.85) التحقق */ (nk.loc ? nk.loc + (nk.snap ? ' \u00b7 ' + t('لقطة') : '') : '') || (nk.ser ? (EXT.readers || (STATE.extSnap && !may('settings')) ? t('غير ظاهر في نظام البطاقات') : may('settings') ? t('يُحمَّل…') : t('لا لقطةَ بعد')) : '\u2014'),
            nk.at ? pilotAgo(nk.at) : '\u2014', nk.occ || '\u2014'];
  });
}

/* ═══ (V37.81) لقطةُ المكتب — الوزارةُ ترى الإشغالَ بلا توكن ═══
   الإشغالُ يحتاج توكنَ حساب صاحب المشروع، وخوادمُ نظام البطاقات محجوبةٌ خارج المملكة فلا يجلبها
   الخادم. فجهازُ المكتب الذي يفتح الشاشة يحفظ «الأرقامَ وحدَها» في settings/extSnap — كلَّ ٥ دقائق
   على الأكثر — ويقرؤها الباقون مع وقت اللقطة. لا توكنَ ولا عنوانَ كاميرا ولا شيءَ غيرَ الأرقام. */
function extSnapMaybe(){
  if (!may('settings') || !(EXT.tok || EXT.bridge) || !EXT_MATCH_STATE) return;
  if (EXT._snapAt && Date.now() - EXT._snapAt < 5 * 60000) return;
  var sites = {}, camps = {}, nOv = 0;
  EXT_MATCH_STATE.matched.forEach(function(m){
    sites[m.point.id] = { ser:m.serial || '', code:m.tentCode || '', ts:(m.reader && m.reader.timestamp) || '', by:m.by || '', warn:m.warn || '' };
    var o = m.tentId && EXT.ov[m.tentId]; if (!o || !o.data) return;
    var c = o.data.occupancyStatus || {}, a = o.data.averageTime || {};
    camps[m.tentCode] = { cap:+c.totalCapacity || 0, w:+c.currentlyOccupied || 0, wo:+c.withoutBracelet || 0, ot:+c.fromOtherCamps || 0,
                          inT:String(a.insideCamp || ''), trT:String(a.transitTime || ''), at:o.at, grp:(m.tentMeta && m.tentMeta.tentGroup) || '' };
    nOv++;
  });
  if (!Object.keys(sites).length) return;
  EXT._snapAt = Date.now();
  var doc = { at:EXT._snapAt, by:STATE.meta.name || '', sites:sites, camps:camps, un:EXT_MATCH_STATE.unmatched.length };
  STATE.extSnap = doc;
  CORE.set('cfg', 'extSnap', doc); CORE.saveSoon();
}
function extSnapLoad(){
  if (!FB.ready || !FB.db) return Promise.resolve(null);
  if (EXT._snapLd && Date.now() - EXT._snapLd < 60000) return Promise.resolve(STATE.extSnap || null);
  EXT._snapLd = Date.now();
  return DB.col('settings').doc('extSnap').get().then(function(doc){
    if (doc && doc.exists){ STATE.extSnap = doc.data(); render(1); }
    return STATE.extSnap || null;
  }).catch(function(e){ softErr('لقطة نظام البطاقات', e, ''); return null; });
}
/* عرضُ اللقطة لمن لا يملك التوكن — بالكارت نفسِه */
function extSnapView(){
  var S = STATE.extSnap; extSnapLoad();
  if (!S || !S.sites) return alertBox('info', t('لا لقطةَ بعد — تظهر الأرقامُ هنا بعد أول فتحٍ لهذه الشاشة من جهاز المكتب.'));
  var age = pilotAgo(S.at), old = Date.now() - (+S.at || 0) > 30 * 60000;
  var h = alertBox(old ? 'warn' : 'info', t('لقطةٌ من جهاز المكتب') + ' \u00b7 ' + t('آخر تحديث') + ' ' + age + (old ? ' \u2014 ' + t('قديمة: تتجدّد حين يفتح المكتبُ الشاشة') : ''));
  var seen = {};
  Object.keys(S.sites).forEach(function(id){
    var z = S.sites[id], c = S.camps && S.camps[z.code];
    if (!c || seen[z.code]) return; seen[z.code] = 1;
    h += extOvCard(z.code, { occupancyStatus:{ totalCapacity:c.cap, currentlyOccupied:c.w, withoutBracelet:c.wo, fromOtherCamps:c.ot },
                             averageTime:{ insideCamp:c.inT || '\u2014', transitTime:c.trT || '\u2014' } },
                   z.ts ? { timestamp:z.ts } : null, { tentGroup:c.grp || '' });
  });
  return h;
}

/* ═══ (V37.86) اسمُ الربط بنظام البطاقات — حقلٌ صريحٌ على كلِّ نقطة ═══
   الشاخصُ يكفي المخيماتِ وحدَها؛ والممراتُ والبواباتُ والمحطاتُ أسماؤها في النظام أخرى
   («King-Fahd-Gate3-L»). فلكلِّ نقطةٍ حقلٌ يحمل «اسم الموقع» كما في شاشة أجهزة القراءة عندهم:
   يُقارَن بعد التطبيع (بلا مسافات ولا فرقِ حروفٍ ولا فرقٍ بين - _ /)، وفريدٌ من الجهتين،
   ويُختار من قائمة أسمائهم لا يُكتَب حرًّا، ويُقترَح من الشاخص أو من موقع القارئ.
   ويُتحقَّق منه بثلاثة: وجودُ الاسم عندهم، وموقعُ القارئ بسيرياله، وعنوانُ كاميرا الخيمة ضمن
   شبكة النقطة — يُقارَن ولا يُخزَّن. */
function extNameKey(v){
  /* أرقامٌ وفواصلُ فقط (كودُ خيمة «38/56»): الفاصلُ يبقى — «1/112» غيرُ «11/12».
     وما فيه حروفٌ (اسمُ موقع): تُحذَف الفواصلُ كلُّها — «King Fahd_Gate3-L» = «kingfahdgate3l». */
  var s = String(v == null ? '' : v).replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 0x660); }).trim().toLowerCase();
  if (/^[\d\s\/\\\-_.]+$/.test(s)) return s.replace(/[\s\/\\\-_.]+/g, '/').replace(/^\/+|\/+$/g, '');
  return s.replace(/[\s\/\\\-_.]+/g, '');
}
function extNames(){
  if (!EXT.readers && !EXT.tents) return null;
  var stamp = (EXT.readersAt || 0) + '|' + (EXT.tentsAt || 0);
  if (EXT._nm && EXT._nmAt === stamp) return EXT._nm;
  var M = {};
  Object.keys(EXT.readers || {}).forEach(function(k){
    var r = EXT.readers[k], n = r && r.locationName; if (!n) return;
    var key = extNameKey(n); (M[key] = M[key] || { name:String(n), rd:[], tent:false }).rd.push(k);
  });
  Object.keys(EXT.tents || {}).forEach(function(c){ var key = extNameKey(c); (M[key] = M[key] || { name:c, rd:[], tent:false }).tent = true; });
  EXT._nm = M; EXT._nmAt = stamp; return M;
}
function extLinkedBy(){
  var o = {}; (STATE.sites || []).forEach(function(x){ if (x && x.nk) o[extNameKey(x.nk)] = x.id; }); return o;
}
function extSuggest(x){ var g = extSuggestSrc(x); return g ? g.v : ''; }
/* (V37.88) مصادرُ الاقتراح بالترتيب: الشاخصُ والقرب ← قارئُ التركيب ← قارئُ موسم ١٤٤٧ ← اسمٌ لاتينيٌّ في اسم النقطة */
function extSuggestSrc(x){
  if (!x) return null;
  var ts = extTentForSite(x); if (ts) return { v:String(ts.t.code), src:'الشاخص' };
  var ser = extReaderSerial(STATE.inss[x.id]), rd = (ser && EXT.readers) ? EXT.readers[extSerKey(ser)] : null;
  if (rd && rd.locationName) return { v:String(rd.locationName), src:'القارئ' };
  var o = x.ex47 && x.ex47.rdr && EXT.readers ? EXT.readers[extSerKey(x.ex47.rdr)] : null;
  if (o && o.locationName) return { v:String(o.locationName), src:'قارئ ١٤٤٧' };
  var M = extNames(), m = /[A-Za-z][A-Za-z0-9_\-.\/]{2,}/.exec(String(x.name || ''));
  if (M && m && M[extNameKey(m[0])]) return { v:M[extNameKey(m[0])].name, src:'اسم النقطة' };
  return null;
}
function extNkSave(id, val){
  if (!may('settings')){ toast(t('الربطُ للمهندس فما فوق')); return; }
  var x = siteFind(id); if (!x) return;
  var v = String(val == null ? '' : val).trim(), key = extNameKey(v);
  if (v){
    var other = extLinkedBy()[key];
    if (other && other !== id){ toast(t('هذا الاسمُ مربوطٌ بالنقطة') + ' ' + other); return; }
    var M = extNames();
    if (M && !M[key] && !confirm(t('الاسمُ غيرُ ظاهرٍ في نظام البطاقات الآن. يُحفَظ على أيِّ حال؟'))){ toast(t('لم يُحفَظ')); return; }
  }
  x.nk = v; siteOvSet(id, { nk:v, nkAt:Date.now(), nkBy:STATE.meta.name || '' });
  EXT_MATCH_STATE = null;
  logEvent(v ? 'ربطُ نقطةٍ بنظام البطاقات — ' + id + ' ← ' + v : 'فكُّ ربط نقطةٍ بنظام البطاقات — ' + id, id);
  toast(t(v ? 'رُبطت النقطة' : 'فُكَّ الربط')); render(1);
}
/* عنوانُ كاميرا الخيمة من تفاصيلها — في الذاكرة وحدَها، ويُقارَن بأول ثلاثة أجزاءٍ من شبكة النقطة */
function extCamCheck(x, tent){
  if (!x || !tent || !tent.id || !EXT.tok) return null;
  var d = EXT.tdet && EXT.tdet[tent.id];
  if (!d){
    EXT._tdq = EXT._tdq || {};
    if (!EXT._tdq[tent.id]){
      EXT._tdq[tent.id] = 1;
      extFetch(EXT_API + '/tents/' + tent.id, true).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
        var v = j && (j.data || j); EXT.tdet = EXT.tdet || {};
        EXT.tdet[tent.id] = { ip:String((v && v.cameraIP) || '') }; render(1);
      }).catch(function(e){ softErr('تفاصيل الخيمة', e, ''); });
    }
    return { st:'wait' };
  }
  var pre = String(((STATE.inss[x.id] || {}).prefix) || siteNetBase(x) || '').trim();   /* (V37.89) أو شبكةُ النقطة */
  if (!d.ip || !pre) return { st:'na' };
  var a = d.ip.split('.').slice(0, 3).join('.'), b = pre.split('.').slice(0, 3).join('.');
  return { st: a === b ? 'ok' : 'bad' };
}
function extNkCard(x){
  if (!x || (!may('settings') && !x.nk)) return '';
  pilotKick();
  var M = extNames(), L = extLink(x), sug = may('settings') ? extSuggest(x) : '';
  var key = x.nk ? extNameKey(x.nk) : '';
  var nameSt = !x.nk ? '\u2014' : !M ? t('يُحمَّل…') : M[key] ? '\u2713 ' + t('موجودٌ في النظام') : '\u26A0 ' + t('غيرُ موجودٍ في النظام');
  var rdSt = !L.ser ? t('لا سيريال قارئ') : !EXT.readers ? t('يُحمَّل…') : !L.reader ? t('القارئ لم يظهر بعد')
           : L.warn ? '\u26A0 ' + t('القارئ على') + ' ' + L.warn : '\u2713 ' + t('على الاسم نفسه');
  var cam = L.tent ? extCamCheck(x, L.tent) : null;
  var camSt = !cam ? t('غيرُ متاحٍ لهذه النقطة') : cam.st === 'wait' ? t('يُحمَّل…') : cam.st === 'na' ? t('لا شبكةَ مسجَّلة أو لا عنوان') : cam.st === 'ok' ? '\u2713 ' + t('ضمن شبكة النقطة') : '\u26A0 ' + t('خارج شبكة النقطة');
  var rows = '<div class="pop-rows" style="margin:0">'
    + '<div><span class="k">' + esc(t('اسم الربط')) + '</span><span>' + (x.nk ? '<b>' + bdiText(x.nk) + '</b>' : esc(t('غير مربوط'))) + '</span></div>'
    + (x.nk ? '<div><span class="k">' + esc(t('الاسم في النظام')) + '</span><span>' + esc(nameSt) + '</span></div>' : '')
    + '<div><span class="k">' + esc(t('القارئ بسيرياله')) + '</span><span>' + esc(rdSt) + '</span></div>'
    + (L.tent ? '<div><span class="k">' + esc(t('كاميرا الخيمة')) + '</span><span>' + esc(camSt) + '</span></div>' : '')
    + '</div>';
  var edit = '';
  if (may('settings')){
    var linked = extLinkedBy(), opts = '';
    if (M) Object.keys(M).sort().forEach(function(k){ if (!linked[k] || linked[k] === x.id) opts += '<option value="' + esc(M[k].name) + '">'; });
    edit = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0">'
      + '<input id="nkIn' + esc(x.id) + '" list="nkList' + esc(x.id) + '" dir="ltr" autocomplete="off" style="flex:1;min-width:160px" value="' + esc(x.nk || '') + '" placeholder="' + esc(t(M ? 'ابحث في أسماء النظام' : 'اسم الموقع كما في النظام')) + '">'
      + (opts ? '<datalist id="nkList' + esc(x.id) + '">' + opts + '</datalist>' : '')
      + btn(t('احفظ الربط'), 'btn-primary btn-sm', ' data-nksave="' + esc(x.id) + '"')
      + (x.nk ? btn(t('فُكَّ الربط'), 'btn-quiet btn-sm', ' data-nkclear="' + esc(x.id) + '"') : '')
      + '</div>'
      + (sug && extNameKey(sug) !== key ? '<div class="actions" style="margin:6px 0 0">' + btn('\u2728 ' + t('اقتراح') + ': ' + sug, 'btn-secondary btn-sm', ' data-nksug="' + esc(x.id) + '|' + esc(sug) + '"') + '</div>' : '');
  }
  return card('الربط بنظام البطاقات', rows + edit);
}

/* ═══ (V37.87) الربطُ الجماعيّ — جدولُ غير المربوط بمقترحه، واعتمادٌ بضغطة ═══
   ١٨٠٠ نقطةٍ لا تُربَط واحدةً واحدة. يُقترح لكلِّ نقطةٍ غيرِ مربوطة اسمُها من الشاخص (المخيمات)
   أو من موقع قارئها؛ وما تزاحم عليه اقتراحان أو كان مربوطًا بغيرها لا يُعتمَد آليًّا بل يُعرَض
   تعارضًا يُحسَم بيد. ويُكشف المربوطُ باسمٍ لم يعد في النظام. */
function extBulkPlan(){
  var M = extNames(); if (!M) return null;
  var linked = extLinkedBy(), want = {}, P = { apply:[], conflicts:[], linked:0, unlinked:0, noSug:0, stale:[] };
  (STATE.sites || []).forEach(function(x){
    if (!x) return;
    if (x.nk){ P.linked++; if (!M[extNameKey(x.nk)]) P.stale.push(x.id); return; }
    P.unlinked++;
    var sgs = extSuggestSrc(x); if (!sgs){ P.noSug++; return; }
    var sg = sgs.v, k = extNameKey(sg);
    (want[k] = want[k] || []).push({ id:x.id, name:x.name || x.id, type:x.type || '', zone:x.zone || '', sug:sg, src:sgs.src });
  });
  Object.keys(want).forEach(function(k){
    var L = want[k];
    if (L.length > 1 || linked[k]) P.conflicts.push({ name:L[0].sug, ids:L.map(function(z){ return z.id; }).concat(linked[k] ? [linked[k] + ' \u2713'] : []) });
    else P.apply.push(L[0]);
  });
  return P;
}
function extBulkCard(){
  if (!may('settings')) return '';
  var P = extBulkPlan();
  if (!P) return card('الربط الجماعي بنظام البطاقات', '<p class="hint" style="margin:0">' + esc(t('يُحمَّل…')) + '</p>');
  var body = stats([['مربوطة', N(P.linked), 'ok'], ['غير مربوطة', N(P.unlinked)], ['لها اقتراح', N(P.apply.length), 'acc'], ['تعارض', N(P.conflicts.length), P.conflicts.length ? 'wrn' : '']]);
  if (P.apply.length){
    body += table(['النقطة', 'النوع', 'الاقتراح', 'المصدر'], P.apply.slice(0, 50).map(function(z){
      return ['<bdi>' + esc(z.id) + '</bdi><br><span class="hint" style="margin:0">' + esc(z.name) + '</span>', esc(t(z.type)), '<b dir="ltr">' + esc(z.sug) + '</b>', esc(t(z.src))];
    })) + (P.apply.length > 50 ? '<p class="hint" style="margin:4px 0 0">' + esc(t('والباقي')) + ' ' + nm(P.apply.length - 50) + '</p>' : '')
      + '<div class="actions" style="margin:8px 0 0">' + btn('\u2713 ' + t('اعتمد المقترحات') + ' (' + nm(P.apply.length) + ')', 'btn-primary btn-sm', ' data-nkbulk="1"') + '</div>';
  } else body += '<p class="hint" style="margin:6px 0 0">' + esc(t('لا مقترحاتٍ جديدة — كلُّ ما له اقتراحٌ مربوط')) + '</p>';
  if (P.conflicts.length) body += mtDetails(t('تعارضٌ يُحسَم بيد') + ' (' + nm(P.conflicts.length) + ')',
    table(['الاسم في النظام', 'النقاط'], P.conflicts.slice(0, 60).map(function(c){ return ['<b dir="ltr">' + esc(c.name) + '</b>', esc(c.ids.join(' \u00b7 '))]; })), '\u26A0');
  if (P.stale.length) body += mtDetails(t('مربوطةٌ باسمٍ غيرِ موجودٍ في النظام') + ' (' + nm(P.stale.length) + ')',
    '<div class="hint" style="font-size:12px">' + P.stale.slice(0, 80).map(function(id){ return '<bdi>' + esc(id) + '</bdi>'; }).join(' \u00b7 ') + '</div>', '\u26A0');
  return card('الربط الجماعي بنظام البطاقات', body);
}
function extBulkApply(){
  if (!may('settings')){ toast(t('الربطُ للمهندس فما فوق')); return; }
  var P = extBulkPlan(); if (!P || !P.apply.length){ toast(t('لا مقترحاتٍ جديدة — كلُّ ما له اقتراحٌ مربوط')); return; }
  if (!confirm(t('تُربَط') + ' ' + P.apply.length + ' ' + t('نقطةً بأسمائها المقترحة. متابعة؟'))){ toast(t('لم يُربَط شيء — أُلغي')); return; }
  var by = STATE.meta.name || '', at = Date.now();
  P.apply.forEach(function(z){ var x = siteFind(z.id); if (!x) return; x.nk = z.sug; siteOvSet(z.id, { nk:z.sug, nkAt:at, nkBy:by, nkSrc:z.src }); });
  EXT_MATCH_STATE = null;
  logEvent('ربطٌ جماعيٌّ بنظام البطاقات — ' + P.apply.length + ' نقطة · تعارض ' + P.conflicts.length);
  toast(t('رُبطت') + ' ' + nm(P.apply.length) + ' ' + t('نقطة')); render(1);
}

/* ═══ (V37.88) بياناتُ موسم ١٤٤٧ — تُستورَد من ملف «تسليمات الممرات» كما هو ═══
   تُركَّب النقاطُ هذا الموسمَ بأجهزة ١٤٤٧ نفسِها. وقارئُ ١٤٤٧ ما زال مسجَّلًا في نظام البطاقات،
   فسيريالُه يكشف اسمَ موقعه هناك — اقتراحُ ربطٍ لكلِّ نقطةٍ قبل تركيبها.
   يُقرأ في المتصفح وحدَه، ويُحفَظ لكلِّ نقطةٍ: سيريالُ القارئ والراوتر والكاميرا، وشبكتُها
   (أولُ ثلاثة أجزاء)، واسمُها في الملف، والمهندسُ والتاريخ. لا تُقرأ أعمدةُ المستخدم وكلمات
   المرور والواي فاي والشرائح والعناوين الفيزيائية أصلًا. المخيمُ برقمه («Camp4-547» = شاخص 4/547 في منى)،
   والممرُّ باسمه («SH 56-24» = Path-SH56-24، و«SH1-L» في الممر المظلل = Shaded-1L) ثم بالقرب ٦٠ مترًا. */
function ex47Net(ip){ var m = /^(\d+\.\d+\.\d+)\.\d+$/.exec(String(ip || '').trim()); return m ? m[1] : ''; }
function ex47Date(v){ return (v && typeof v.getTime === 'function' && !isNaN(v.getTime())) ? v.toISOString().slice(0, 10) : (/\d{4}-\d{2}-\d{2}/.exec(String(v || '')) || [''])[0]; }
function ex47Plan(wb){
  /* (V37.91) الأعمدةُ تُقرأ بعناوينها لا بمواضعها — ملفُّ التسليمات تغيّر ترتيبُه بين نسختين
     (أُضيف «Provider Name» و«Camera Name» فانزاح القارئُ والكاميرا)، فالموضعُ الثابتُ كان سيقرأ عمودًا آخر */
  var find = function(re){ var n = wb.SheetNames.filter(function(k){ return re.test(k); })[0]; return n ? XLSX.utils.sheet_to_json(wb.Sheets[n], { header:1, raw:true, defval:'' }) : null; };
  var C = find(/camps/i), Pt = find(/paths/i), plan = { set:{}, campsN:0, pathsN:0, miss:[], out:[], dup:0, orph:[] };
  if (!C && !Pt) return null;
  var S = function(v){ return String(v == null ? '' : v).replace(/\u00a0/g, ' ').trim(); };
  var col = function(row, re, from, to){ for (var i = from || 0; i < Math.min(to == null ? row.length : to, row.length); i++){ if (re.test(S(row[i]))) return i; } return -1; };
  var signKey = function(v){ return String(v || '').replace(/\s+/g, '').toUpperCase(); };
  var mina = {}, others = [];
  (STATE.sites || []).forEach(function(x){
    if (x.type === 'مخيم'){ if (x.zone === 'منى' && x.sign){ var k0 = signKey(x.sign); if (!mina[k0]) mina[k0] = x; } return; }
    var m = /Path-([A-Za-z0-9_\-.]+)/i.exec(String(x.name || '')) || /([A-Za-z][A-Za-z0-9_\-. ]{3,})/.exec(String(x.name || ''));
    others.push({ x:x, k:m ? extNameKey(m[1]) : '' });
  });
  var put = function(id, v, nm0){
    if (plan.set[id]){ plan.dup++; (plan.set[id].more = plan.set[id].more || []).push({ nm:nm0, rdr:v.rdr, rtr:v.rtr, cam:v.cam }); return; }
    plan.set[id] = v;
  };
  /* ── المخيمات ── */
  if (C){
    var h = -1; for (var i0 = 0; i0 < Math.min(6, C.length); i0++){ if (col(C[i0], /^router$/i) > -1){ h = i0; break; } }
    if (h > -1){
      var H = C[h], Sub = C[h + 1] || [];
      var g = { rtr:col(H, /^router$/i), rdr:col(H, /^reader$/i), cam:col(H, /^camera$/i), eng:col(H, /engineer/i), at:col(H, /config\s*date/i) };
      var gl = col(H, /latitude/i), gn = col(H, /longitude/i);
      var starts = [g.rtr, g.rdr, g.cam, g.eng].filter(function(z){ return z > -1; }).sort(function(p, q){ return p - q; });
      var end = function(st){ var n = starts.filter(function(z){ return z > st; })[0]; return n == null ? H.length : n; };
      var ix = function(gs, re){ return gs > -1 ? col(Sub, re, gs, end(gs)) : -1; };
      var c = { rtrIp:ix(g.rtr, /^ip$/i), rtr:ix(g.rtr, /^serial$/i), rdrIp:ix(g.rdr, /^ip$/i), rdr:ix(g.rdr, /^serial$/i), camIp:ix(g.cam, /^ip$/i), cam:ix(g.cam, /^serial$/i) };
      var V = function(r, k){ return c[k] > -1 ? S(r[c[k]]) : ''; };
      C.slice(h + 2).forEach(function(r){
        var nm0 = S(r[0]); if (!nm0 || /^column\d*$/i.test(nm0)) return;
        plan.campsN++;
        var m = /^cam(?:p)?\s*[-_ ]?\s*([0-9a-z][0-9a-z\-]*?)\s*[-_\/. ]+\s*(\d+)\s*(?:\(.*\))?\s*(?:up|down)?$/i.exec(nm0);
        var x = m ? mina[signKey(m[1] + '/' + m[2])] : null;
        var rec = { nm:nm0, rtr:V(r, 'rtr'), rdr:V(r, 'rdr'), cam:V(r, 'cam'), net:ex47Net(V(r, 'rtrIp')) || ex47Net(V(r, 'rdrIp')),
                    eng:g.eng > -1 ? S(r[g.eng]) : '', at:g.at > -1 ? ex47Date(r[g.at]) : '' };
        if (!x){
          (m ? plan.miss : plan.out).push(nm0);
          plan.orph.push(Object.assign({ kind:'camp', sign:m ? (m[1] + '/' + m[2]).toUpperCase() : '',
            lat:+(gl > -1 ? r[gl] : 0) || 0, lng:+(gn > -1 ? r[gn] : 0) || 0 }, rec));   /* (V37.92) يُحفَظ بياناتُه لا اسمُه وحدَه */
          return;
        }
        put(x.id, rec, nm0);
      });
    }
  }
  /* ── الممرات والبوابات والطوابق ── */
  if (Pt && Pt.length){
    var P0 = Pt[0], pc = { lat:col(P0, /latitude/i), lng:col(P0, /longitude/i), ip:col(P0, /^ip$/i), ser:col(P0, /^serial$/i), eng:col(P0, /eng/i), at:col(P0, /^date$/i),
                           ready:col(P0, /الجاهزية/), crane:col(P0, /رافعة/), maint:col(P0, /صيانة/) };
    pc.kind = pc.ip > 0 ? pc.ip - 1 : 3;
    var num = function(v){ var f = parseFloat(S(v).replace('°', '')); return isFinite(f) ? f : 0; };
    var cur = null;
    var match = function(nm0, la, ln){
      var k = extNameKey(nm0), k2 = k.replace(/^path/, '');
      var sh = /^(?:path-?)?sh\s*-?\s*([1-7])\s*-?\s*([lr])$/i.exec(nm0.replace(/\s+/g, ''));
      var alias = sh ? extNameKey('shaded' + sh[1] + sh[2]) : '';
      var hit = others.filter(function(o){ return o.k && (o.k === k || o.k === k2 || o.k.replace(/^path/, '') === k2 || (alias && o.k === alias)); })[0];
      if (!hit && k2.length >= 6) hit = others.filter(function(o){ return o.k && o.k.length >= 6 && (o.k.slice(-k2.length) === k2 || k2.slice(-o.k.length) === o.k); })[0];
      if (!hit && la && ln){
        var best = null; others.forEach(function(o){ var d = geoDist([la, ln], [+o.x.lat, +o.x.lng]); if (!best || d < best.d) best = { o:o, d:d }; });
        if (best && best.d <= 60) hit = best.o;
      }
      return hit;
    };
    var flush = function(){
      if (!cur) return; plan.pathsN++;
      var hit = match(cur.nm, cur.lat, cur.lng);
      if (!hit){
        plan.out.push(cur.nm);
        plan.orph.push({ kind:'point', nm:cur.nm, rtr:cur.rtr || '', rdr:cur.rdr || '', cam:cur.cam || '', net:cur.net || '', eng:cur.eng || '', at:cur.at || '',
                         lat:cur.lat || 0, lng:cur.lng || 0, ready:cur.ready || '', crane:cur.crane || '', maint:cur.maint || '' });   /* (V37.92) */
        cur = null; return;
      }
      put(hit.x.id, { nm:cur.nm, rtr:cur.rtr || '', rdr:cur.rdr || '', cam:cur.cam || '', net:cur.net || '', eng:cur.eng || '', at:cur.at || '',
                      ready:cur.ready || '', crane:cur.crane || '', maint:cur.maint || '' }, cur.nm);
      cur = null;
    };
    Pt.slice(1).forEach(function(r){
      var nm0 = S(r[0]);
      if (nm0 && /[A-Za-z]/.test(nm0)){ flush(); cur = { nm:nm0, lat:pc.lat > -1 ? num(r[pc.lat]) : 0, lng:pc.lng > -1 ? num(r[pc.lng]) : 0,
        eng:pc.eng > -1 ? S(r[pc.eng]) : '', at:pc.at > -1 ? ex47Date(r[pc.at]) : '', ready:pc.ready > -1 ? S(r[pc.ready]) : '',
        crane:pc.crane > -1 ? S(r[pc.crane]) : '', maint:pc.maint > -1 ? S(r[pc.maint]) : '' }; }
      else if (nm0){ flush(); return; }   /* سطرُ عنوانٍ عربيّ («الممر المظلل …») لا نقطة */
      if (!cur) return;
      var kind = S(r[pc.kind]).toLowerCase(), sv = pc.ser > -1 ? S(r[pc.ser]) : '';
      if (kind === 'router'){ cur.rtr = sv; cur.net = ex47Net(r[pc.ip]); }
      else if (kind === 'reader') cur.rdr = sv;
      else if (kind === 'camera') cur.cam = sv;
    });
    flush();
  }
  /* (V37.92) حارسٌ أخير: في الملف صفٌّ لُصقت فيه كلمةُ مرورٍ في خانة سيريال (Camp-17-716) — فكلُّ قيمةٍ تشبه
     كلمةَ مرورٍ أو اسمَ دخولٍ تُسقَط قبل أن تُحفَظ، ويُعرَض عددُها */
  plan.scrub = 0;
  var bad = /[@#$%]|pass(word)?|admin|root/i, F = ['rtr', 'rdr', 'cam', 'net', 'eng', 'ready', 'crane', 'maint'];
  var clean = function(o){ F.forEach(function(k){ if (o[k] && bad.test(String(o[k]))){ o[k] = ''; plan.scrub++; } }); (o.more || []).forEach(clean); };
  Object.keys(plan.set).forEach(function(id){ clean(plan.set[id]); });
  plan.orph.forEach(clean);
  return plan;
}
function ex47Import(file){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var fr = new FileReader();
    fr.onload = function(){
      try {
        var wb = XLSX.read(new Uint8Array(fr.result), { type:'array', cellDates:true });
        var P = ex47Plan(wb);
        if (!P){ toast(t('لم أجد ورقتَي MINA Camps وMINA paths في الملف')); return; }
        EXT.ex47 = P; render(1);
      } catch (e){ softErr('استيراد ١٤٤٧', e, ''); toast(t('تعذّرت قراءةُ الملف')); }
    };
    fr.readAsArrayBuffer(file);
  });
}
function ex47Apply(){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  var P = EXT.ex47, ids = P ? Object.keys(P.set) : []; if (!ids.length){ toast(t('لا شيءَ يُعتمَد')); return; }
  if (!confirm(t('تُحفَظ بياناتُ ١٤٤٧ لـ') + ' ' + ids.length + ' ' + t('نقطةً، ويُحفَظ ما خارج السجلّ') + ' (' + (P.orph || []).length + ') ' + t('بعَلَم «ليست على الخريطة». متابعة؟'))){ toast(t('لم يُحفَظ — أُلغي')); return; }
  var at = Date.now(), by = STATE.meta.name || '';
  ids.forEach(function(id){ var x = siteFind(id); if (!x) return; var v = Object.assign({ by:by, imp:at }, P.set[id]); x.ex47 = v; siteOvSet(id, { ex47:v }); });
  ex47OrphMerge(P.orph || [], ids.map(function(id){ return extNameKey(P.set[id].nm); }));   /* (V37.92) ما خارج السجلّ يُحفَظ ببياناته وعَلَمِه */
  logEvent('استيرادُ بيانات موسم ١٤٤٧ — ' + ids.length + ' نقطة · خارج الخريطة ' + (P.orph || []).length);
  EXT.ex47 = null; toast(t('حُفظت بياناتُ ١٤٤٧') + ' (' + nm(ids.length) + ')'); render(1);
}
function ex47Card(){
  if (!may('settings')) return '';
  var have = (STATE.sites || []).filter(function(x){ return x && x.ex47; }).length, P = EXT.ex47, body;
  body = '<p class="hint" style="margin:0 0 8px">' + esc(t('ملف «تسليمات الممرات» كما هو: يُقرأ على جهازك وحدَه، ويُحفَظ لكلِّ نقطةٍ سيريالاتُها وشبكتُها — بلا كلمات مرورٍ ولا شرائح.')) + '</p>'
    + '<div class="pop-rows" style="margin:0"><div><span class="k">' + esc(t('نقاطٌ لها بياناتُ ١٤٤٧')) + '</span><span class="num">' + nm(have) + '</span></div></div>';
  if (P){
    var ids = Object.keys(P.set), wr = ids.filter(function(id){ return P.set[id].rdr; }).length;
    body += stats([['مخيماتٌ في الملف', N(P.campsN)], ['ممراتٌ ونقاطٌ أخرى', N(P.pathsN)], ['طابقت نقاطَنا', N(ids.length), 'ok'], ['لها سيريالُ قارئ', N(wr), 'acc'],
                   ['مخيمٌ رقمُه ليس في سجلّنا', N(P.miss.length), P.miss.length ? 'wrn' : ''], ['خارج سجلّنا', N(P.out.length)]])
      + (P.dup ? '<p class="hint" style="margin:4px 0 0">' + esc(t('صفوفٌ إضافيةٌ لنقاطٍ مكرَّرة تُحفَظ ضمن النقطة نفسِها')) + ': ' + nm(P.dup) + '</p>' : '')
      + (P.scrub ? '<p class="hint" style="margin:4px 0 0;color:#E2B33C">\u26A0 ' + esc(t('قيمٌ أُسقطت لأنها تشبه كلماتِ مرورٍ في خانات السيريال')) + ': ' + nm(P.scrub) + '</p>' : '')
      + (P.miss.length ? mtDetails(t('مخيمٌ رقمُه ليس في سجلّنا') + ' (' + nm(P.miss.length) + ')', '<div class="hint" style="font-size:12px" dir="ltr">' + P.miss.slice(0, 200).map(function(z){ return esc(z); }).join(' \u00b7 ') + '</div>', '\u26A0') : '')
      + (P.out.length ? mtDetails(t('خارج سجلّنا — الحرم والجمرات ومزدلفة وما لم يُعرَف') + ' (' + nm(P.out.length) + ')', '<div class="hint" style="font-size:12px" dir="ltr">' + P.out.slice(0, 200).map(function(z){ return esc(z); }).join(' \u00b7 ') + '</div>', '\u2139') : '')
      + '<div class="actions" style="margin:8px 0 0">' + btn('\u2713 ' + t('اعتمد بيانات ١٤٤٧') + ' (' + nm(ids.length) + ')', 'btn-primary btn-sm', ' data-ex47ok="1"') + '</div>';
  }
  body += '<label class="btn btn-secondary btn-sm" style="margin-top:8px;display:inline-flex">\u{1F4C2} ' + esc(t(P ? 'اختر ملفًّا آخر' : 'اختر ملف تسليمات الممرات')) + '<input type="file" accept=".xlsx,.xls" data-ex47="1" style="display:none"></label>';
  return card('بيانات موسم ١٤٤٧ — الأجهزةُ نفسُها هذا الموسم', body);
}

/* ═══ (V37.92) نقاطُ ملف ١٤٤٧ خارج السجلّ — تُحفَظ بعَلَم «ليست على الخريطة» ═══
   طلبُ المالك: «أيُّ حاجةٍ خارج السجلّ اسمح إنها تتضاف وادِّيها عَلَمًا يعرّفني إنها مش على الخريطة،
   أو قولّي اربطها بنقطةٍ على الخريطة». فلا تُرمى: تُحفَظ ببيانات أجهزتها في settings/ex47orph، ولكلٍّ منها
   طريقان: «اربطها بنقطة» (تنتقل بياناتُها إلى نقطةٍ قائمة) أو «ضعها على الخريطة» (نموذجُ نقطةٍ جديدةٍ
   معبّأٌ يُختار موضعُه بالخريطة، وتُحمَل بياناتُها إليها). ولا تدخل السجلَّ بلا موضعٍ — فلا تشوّه الخريطةَ ولا الأرقام. */
function ex47OrphLoad(){
  if (!FB.ready || !FB.db || !may('settings')) return;
  if (EXT._orAt && Date.now() - EXT._orAt < 60000) return;
  EXT._orAt = Date.now();
  DB.col('settings').doc('ex47orph').get().then(function(doc){
    var d = (doc && doc.exists) ? doc.data() : null;
    STATE.ex47orph = (d && Array.isArray(d.rows)) ? d.rows : [];
    if (CUR === 'mfu') render(1);
  }).catch(function(e){ softErr('نقاط ١٤٤٧ خارج الخريطة', e, ''); });
}
function ex47OrphSave(rows){
  STATE.ex47orph = rows;
  CORE.set('cfg', 'ex47orph', { rows:rows, at:Date.now(), by:STATE.meta.name || '' }); CORE.saveSoon();
}
function ex47OrphMerge(add, matchedKeys){
  var cur = (STATE.ex47orph || []).slice(), seen = {}, mk = {};
  (matchedKeys || []).forEach(function(k){ mk[k] = 1; });
  cur = cur.filter(function(o){ return !mk[extNameKey(o.nm)]; });
  cur.forEach(function(o){ seen[extNameKey(o.nm)] = 1; });
  add.forEach(function(o){ var k = extNameKey(o.nm); if (!seen[k]){ seen[k] = 1; cur.push(o); } });
  ex47OrphSave(cur);
}
function ex47OrphFind(nm){ return (STATE.ex47orph || []).filter(function(o){ return extNameKey(o.nm) === extNameKey(nm); })[0] || null; }
function ex47OrphDrop(nm){ ex47OrphSave((STATE.ex47orph || []).filter(function(o){ return extNameKey(o.nm) !== extNameKey(nm); })); }
/* اقتراحُ نقطةٍ للربط: المخيمُ بشاخصٍ يشترك في الشارع، والنقطةُ باسمٍ يحتوي اسمَها */
function ex47OrphGuess(o){
  if (o.kind === 'camp' && o.sign){
    var st = o.sign.split('/')[1];
    var L = (STATE.sites || []).filter(function(x){ return x.type === 'مخيم' && x.zone === 'منى' && x.sign && String(x.sign).split('/')[1] === st && !x.ex47; });
    return L.length === 1 ? L[0] : null;
  }
  var k = extNameKey(o.nm); if (k.length < 5) return null;
  return (STATE.sites || []).filter(function(x){ return x.type !== 'مخيم' && extNameKey(x.name).indexOf(k) > -1; })[0] || null;
}
function ex47OrphLink(nm, siteId){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  var o = ex47OrphFind(nm), x = siteFind(String(siteId || '').trim());
  if (!o){ toast(t('لا شيءَ يُعتمَد')); return; }
  if (!x){ toast(t('اكتب معرِّفَ نقطةٍ موجودة — مثال NSK-MIN-CMP-0449')); return; }
  var v = { nm:o.nm, rtr:o.rtr, rdr:o.rdr, cam:o.cam, net:o.net, eng:o.eng, at:o.at, ready:o.ready || '', crane:o.crane || '', maint:o.maint || '', by:STATE.meta.name || '', imp:Date.now(), linked:1 };
  x.ex47 = v; siteOvSet(x.id, { ex47:v }); ex47OrphDrop(nm);
  logEvent('ربطُ نقطةٍ من ملف ١٤٤٧ بنقطةٍ على الخريطة — ' + nm + ' ← ' + x.id, x.id);
  toast(t('رُبطت') + ' ' + nm + ' \u2190 ' + x.id); render(1);
}
function ex47OrphPlace(nm){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  var o = ex47OrphFind(nm); if (!o){ toast(t('لا شيءَ يُعتمَد')); return; }
  var camp = o.kind === 'camp';
  NEWSITE.zone = /arafat|عرفات/i.test(o.nm) ? 'عرفات' : (/jamarat|الجمرات/i.test(o.nm) ? 'الجمرات' : 'منى');
  NEWSITE.type = camp ? 'مخيم' : 'ممر';
  NEWSITE.sign = camp ? (o.sign || '') : ''; NEWSITE.nm = camp ? '' : o.nm;
  NEWSITE.lat = +o.lat || 0; NEWSITE.lng = +o.lng || 0; NEWSITE.byMap = !!(o.lat && o.lng);
  NEWSITE.note = t('من ملف تسليمات ١٤٤٧') + ': ' + o.nm;
  NEWSITE.ex47 = { nm:o.nm, rtr:o.rtr, rdr:o.rdr, cam:o.cam, net:o.net, eng:o.eng, at:o.at, ready:o.ready || '', crane:o.crane || '', maint:o.maint || '', by:STATE.meta.name || '', imp:Date.now() };
  NEWSITE.orph = o.nm;
  toast(t(o.lat && o.lng ? 'موضعُها من الملف — راجع البيانات واحفظ' : 'اختر موضعَها على الخريطة ثم احفظ'));
  goPage('newsite');
}
function ex47OrphCard(){
  if (!may('settings')) return '';
  if (!STATE.ex47orph) { ex47OrphLoad(); return ''; }
  var L = STATE.ex47orph; if (!L.length) return '';
  var opts = (STATE.sites || []).map(function(x){ return '<option value="' + esc(x.id) + '">' + esc(x.name || '') + '</option>'; }).join('');
  var rows = L.slice(0, 60).map(function(o, i){
    var gs = ex47OrphGuess(o), k = esc(o.nm);
    return [ '<b dir="ltr">' + esc(o.nm) + '</b><br>' + pill('\u{1F4CD} ' + t('ليست على الخريطة'), 'warn'),
             '<span class="num" dir="ltr">' + esc(o.rdr || '\u2014') + '</span>',
             '<input id="orIn' + i + '" list="orList" dir="ltr" autocomplete="off" style="min-width:150px" placeholder="NSK-…" value="' + esc(gs ? gs.id : '') + '">'
               + (gs ? '<div class="hint" style="margin:2px 0 0;font-size:11px">' + esc(t('اقتراح')) + ': ' + esc(gs.name || gs.id) + '</div>' : ''),
             btn(t('اربط'), 'btn-secondary btn-sm', ' data-orlink="' + i + '|' + k + '"') + ' ' + btn('\u{1F4CD} ' + t('ضعها على الخريطة'), 'btn-quiet btn-sm', ' data-orplace="' + k + '"') ];
  });
  return card('نقاط ملف ١٤٤٧ خارج الخريطة — ' + nm(L.length),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('محفوظةٌ ببيانات أجهزتها ولا تظهر على الخريطة حتى تُربَط بنقطةٍ قائمة أو يُختار موضعُها.')) + '</p>'
    + '<datalist id="orList">' + opts + '</datalist>'
    + table(['من الملف', 'سيريال القارئ', 'النقطة على الخريطة', ''], rows)
    + (L.length > 60 ? '<p class="hint" style="margin:4px 0 0">' + esc(t('والباقي')) + ' ' + nm(L.length - 60) + '</p>' : ''));
}

/* ═══ (V37.93) الجسرُ اليدويّ — نظامُ البطاقات بلا طلبٍ من التطبيق ═══
   أوّلُ تجربةٍ حقيقية من جوال المالك: «تعذّر الوصول إلى بثّ القرّاء». خوادمُ النظام لا تقبل طلبًا
   من غير موقعها، وهذا لا يُصلَح من جهتنا. فصار الطلبُ يخرج من موقعهم نفسِه: أمرٌ يُلصَق في
   الـConsole على nusukcard.net يجمع القرّاءَ والخيامَ وإشغالَ مخيماتنا وينسخها دفعةً، ويُلصَق
   ناتجُه هنا فيُحفَظ في settings/extBridge لكلِّ الحسابات. ولا يُحفَظ التوكنُ عندنا أصلًا. */
function extBridgeCodes(){
  var o = {};
  (STATE.sites || []).forEach(function(x){
    if (!x || x.type !== 'مخيم' || x.zone !== 'منى') return;
    var i = STATE.inss[x.id];
    if (!(x.pilot || x.nk || x.ex47 || (i && i.status && i.status !== 'مسودّة'))) return;
    var c = x.nk || x.sign; if (c) o[String(c)] = 1;
  });
  return Object.keys(o);
}
function extBridgeCmd(mode){
  /* (V37.94) mode='go': إشارةٌ مرجعية — تنقل المتصفحَ إلى تطبيقنا والبياناتُ في العنوان بعد # فتُستورَد وحدَها؛
     mode (افتراضي): نسخُ الناتج للصق */
  var tail = mode === 'go'
    ? "location.href=" + JSON.stringify(location.origin + location.pathname) + "+'#bridge='+encodeURIComponent(JSON.stringify(out));"
    : "copy(JSON.stringify(out));alert('نُسخت بياناتُ الجسر: '+out.rd.length+' قارئ · '+out.tn.length+' خيمة · '+out.ov.length+' إشغال — الصقها في التطبيق');";
  return [
    "(async()=>{try{",
    "const T=localStorage.getItem('mj.accessToken');if(!T){alert('سجّل الدخول في النظام أوّلًا');return;}",
    "const H={Authorization:'Bearer '+T},A='https://api.nusukcard.net/api/v1',W=", JSON.stringify(extBridgeCodes()), ";",
    "const j=async u=>{const r=await fetch(u,{headers:H});if(!r.ok)throw new Error(u.split('?')[0].split('/').slice(-2).join('/')+' '+r.status);return r.json();};",
    "const rs=await j('https://event.nusukcard.net/api/rfid/latest/stream');const rd=Array.isArray(rs)?rs:(rs.data||[]);",
    "let tn=[];for(let p=1;p<=80;p++){const x=await j(A+'/tents?page='+p+'&perPage=100');const d=Array.isArray(x.data)?x.data:[];tn=tn.concat(d);if(d.length<100)break;}",
    "const k=v=>String(v||'').replace(/\\s+/g,'').toLowerCase(),want=new Set(W.map(k)),pick=tn.filter(t=>want.has(k(t.code)));",
    "const ov=[];let i=0;const go=async()=>{while(i<pick.length){const t=pick[i++];try{const o=await j(A+'/dashboards/tents/'+t.id+'/overview'),d=o.data||o,c=d.occupancyStatus||{},a=d.averageTime||{};",
    "ov.push([t.id,c.totalCapacity||0,c.currentlyOccupied||0,c.withoutBracelet||0,c.fromOtherCamps||0,a.insideCamp||'',a.transitTime||'']);}catch(e){}}};",
    "await Promise.all([go(),go(),go(),go()]);",
    "const out={v:1,at:Date.now(),rd:rd.map(r=>[r.readerId,r.locationName,r.timestamp]),tn:tn.map(t=>[t.id,t.code,t.latitude,t.longitude,t.tentGroup||'',t.capacity||0]),ov:ov};",
    tail,
    "}catch(e){alert('تعذّر: '+e.message);}})()"
  ].join('');
}
function extBridgeApply(o, save){
  if (!o || o.v !== 1 || !Array.isArray(o.rd) || !Array.isArray(o.tn)) return false;
  var R = {}, T = {}, B = {};
  o.rd.forEach(function(r){ if (r && r[0]) R[extSerKey(r[0])] = { readerId:r[0], locationName:r[1] || '', timestamp:r[2] || '' }; });
  o.tn.forEach(function(r){
    if (!r || !r[1]) return;
    var tn = { id:String(r[0] || ''), code:String(r[1]), latitude:r[2], longitude:r[3], tentGroup:r[4] || '', capacity:r[5] || 0 };
    if (!T[tn.code]) T[tn.code] = tn;
    var ck = extCodeKey(tn.code); (B[ck] = B[ck] || []).push(tn);
  });
  var at = +o.at || Date.now();
  EXT.readers = R; EXT.readersAt = at; EXT.tents = T; EXT.tentsBy = B; EXT.tentsAt = at; EXT.rdErr = ''; EXT.err = '';
  (o.ov || []).forEach(function(v){
    if (!v || !v[0]) return;
    EXT.ov[String(v[0])] = { at:at, data:{ occupancyStatus:{ totalCapacity:+v[1] || 0, currentlyOccupied:+v[2] || 0, withoutBracelet:+v[3] || 0, fromOtherCamps:+v[4] || 0 },
                                            averageTime:{ insideCamp:v[5] || '\u2014', transitTime:v[6] || '\u2014' } } };
  });
  EXT.bridge = { at:at, rd:o.rd.length, tn:o.tn.length, ov:(o.ov || []).length, by:o.by || '' };
  EXT_MATCH_STATE = null; EXT_OV_LOADED = {};
  if (save){
    /* القاعدةُ لا تقبل مصفوفةً داخل مصفوفة — يُحفَظ نصًّا واحدًا */
    CORE.set('cfg', 'extBridge', { at:at, by:STATE.meta.name || '', json:JSON.stringify(o) }); CORE.saveSoon();
    logEvent('جسرُ نظام البطاقات — ' + o.rd.length + ' قارئ · ' + o.tn.length + ' خيمة · ' + (o.ov || []).length + ' إشغال');
  }
  return true;
}
function extBridgePaste(){
  if (!may('settings')){ toast(t('الجسرُ للمهندس فما فوق')); return; }
  var el = document.getElementById('brIn'), raw = el ? String(el.value || '').trim() : '';
  if (!raw){ toast(t('الصق ناتجَ الأمر أوّلًا')); return; }
  var o = null; try { o = JSON.parse(raw); } catch (e){ o = null; }
  if (!o || !extBridgeApply(o, true)){ toast(t('هذا ليس ناتجَ أمر الجسر — انسخه كاملًا وأعد اللصق')); return; }
  o.by = STATE.meta.name || '';
  toast(t('اعتُمد الجسر') + ' \u00b7 ' + nm(o.rd.length) + ' ' + t('قارئ') + ' \u00b7 ' + nm(o.tn.length) + ' ' + t('خيمة')); render(1);
}
function extBridgeLoad(){
  if (!FB.ready || !FB.db) return;
  if (EXT._brAt && Date.now() - EXT._brAt < 60000) return;
  EXT._brAt = Date.now();
  DB.col('settings').doc('extBridge').get().then(function(doc){
    var d = (doc && doc.exists) ? doc.data() : null; if (!d || !d.json) return;
    if (EXT.bridge && EXT.bridge.at >= (+d.at || 0)) return;
    var o = null; try { o = JSON.parse(d.json); } catch (e){ o = null; }
    if (o && extBridgeApply(o, false)){ EXT.bridge.by = d.by || ''; render(1); }
  }).catch(function(e){ softErr('جسر نظام البطاقات', e, ''); });
}
function extBridgeCopy(){
  var cmd = extBridgeCmd(), done = function(){ toast(t('نُسخ أمرُ الجسر — الصقه في الـConsole على موقع النظام')); };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(cmd).then(done, function(){ EXT._brShow = 1; render(1); }); return; }
  } catch (e){ LS_ERR = e; }
  EXT._brShow = 1; render(1);
}
function extBridgeCard(){
  if (!may('settings')) return '';
  var B = EXT.bridge, old = B && Date.now() - B.at > 6 * 3600000;
  var st = B ? alertBox(old ? 'warn' : 'success', t('آخر جسر') + ' ' + pilotAgo(B.at) + ' \u00b7 ' + B.rd + ' ' + t('قارئ') + ' \u00b7 ' + B.tn + ' ' + t('خيمة') + ' \u00b7 ' + B.ov + ' ' + t('إشغال') + (old ? ' \u2014 ' + t('قديم: جدّده') : ''))
             : alertBox('info', t('لا جسرَ بعد'));
  var n = nm(extBridgeCodes().length);
  return card('\u{1F309} ' + t('جسر نظام البطاقات'),
    st
    /* (V37.94) الطريقةُ الأولى: إشارةٌ مرجعية — ضغطةٌ واحدة على موقع النظام */
    + '<div style="font-weight:700;margin:10px 0 4px">\u2460 ' + esc(t('بضغطة واحدة — من اللاب')) + '</div>'
    + '<ol class="hint" style="margin:0 0 8px;padding-inline-start:18px;line-height:1.9">'
    + '<li>' + esc(t('اسحب هذا الزرَّ إلى شريط الإشارات المرجعية في كروم (مرةً واحدة)')) + ': <a class="btn btn-primary btn-sm" draggable="true" href="' + esc(extBridgeBmk()) + '" title="' + esc(t('اسحبني إلى شريط الإشارات المرجعية')) + '">\u{1F309} ' + esc(t('جسر البطاقات')) + '</a></li>'
    + '<li>' + esc(t('افتح موقع النظام وسجّل الدخول، ثم اضغط الإشارة المرجعية')) + '</li>'
    + '<li>' + esc(t('يجمع القرّاءَ والخيامَ والإشغال ويفتح هذا التطبيق وقد اعتُمد كلُّه وحدَه')) + '</li></ol>'
    + '<p class="hint" style="margin:0 0 10px">' + esc(t('يجمع إشغالَ مخيماتنا المربوطة والمركَّبة')) + ' (' + n + ') \u2014 ' + esc(t('بعد ربط مخيماتٍ جديدة اسحب الزرَّ من جديد ليشملها')) + '</p>'
    /* الطريقةُ الثانية: ملفُّ تصديرٍ من شاشات النظام */
    + '<div style="font-weight:700;margin:6px 0 4px">\u2461 ' + esc(t('أو ملف تصدير من شاشات النظام')) + '</div>'
    + '<p class="hint" style="margin:0 0 6px">' + esc(t('إن كان في شاشة «أجهزة القراءة» أو «إدارة المخيمات» زرُّ تصدير، ارفع ملفه هنا — يُقرأ بعناوين أعمدته')) + '</p>'
    + '<label class="btn btn-secondary btn-sm" style="display:inline-flex">\u{1F4C4} ' + esc(t('ارفع ملف تصدير')) + '<input type="file" accept=".xlsx,.xls,.csv" data-brfile="1" style="display:none"></label>'
    /* الطريقةُ الثالثة: الأمرُ واللصق — احتياطًا */
    + mtDetails(t('أو بالأمر واللصق (احتياطًا)'),
        '<ol class="hint" style="margin:0 0 8px;padding-inline-start:18px;line-height:1.9">'
        + '<li>' + esc(t('اضغط «انسخ أمر الجسر» هنا')) + '</li>'
        + '<li>' + esc(t('هناك: F12 ← Console ← الصق ← Enter (وإن رفض كروم اللصق اكتب allow pasting)')) + '</li>'
        + '<li>' + esc(t('انتظر رسالة «نُسخت بيانات الجسر» ثم الصق الناتج هنا واضغط «اعتمد»')) + '</li></ol>'
        + '<div class="actions" style="margin:0 0 8px">' + btn('\u{1F4CB} ' + t('انسخ أمر الجسر'), 'btn-secondary btn-sm', ' data-brcopy="1"') + '</div>'
        + (EXT._brShow ? '<textarea readonly dir="ltr" rows="3" style="width:100%;font-size:11px">' + esc(extBridgeCmd()) + '</textarea>' : '')
        + '<textarea id="brIn" dir="ltr" rows="3" style="width:100%;font-size:11px;margin-top:6px" placeholder="' + esc(t('الصق ناتجَ الأمر هنا')) + '"></textarea>'
        + '<div class="actions" style="margin:6px 0 0">' + btn('\u2713 ' + t('اعتمد'), 'btn-secondary btn-sm', ' data-brok="1"') + '</div>', '\u2462'));
}

/* ═══ (V37.94) بلا كتابة كود: إشارةٌ مرجعيةٌ بضغطة، وملفُّ تصديرٍ من النظام ═══
   طلبُ المالك: «كله يتم من الواجهة، مش عاوز أكتب كود». ثلاثُ طرقٍ بترتيب السهولة:
   ١) إشارةٌ مرجعية: تُسحَب مرةً إلى شريط المتصفح، ثم تُضغَط على موقع النظام — تجمع البيانات وتفتح تطبيقَنا
      والبياناتُ في العنوان بعد #، فيستوردها التطبيقُ ويحفظها وحدَه. لا Console ولا لصق.
   ٢) ملفُّ تصديرٍ من شاشات النظام (أجهزة القراءة أو المخيمات) يُرفَع هنا — إن كان التصديرُ متاحًا عندهم.
   ٣) الأمرُ واللصق (V37.93) احتياطًا. */
function extBridgeBmk(){ return 'javascript:' + encodeURIComponent(extBridgeCmd('go')); }
function extBridgeHashPick(){
  try {
    var h = String(location.hash || ''), i = h.indexOf('#bridge='); if (i < 0) return;
    var raw = decodeURIComponent(h.slice(i + 8));
    try { sessionStorage.setItem('nsk.bridgePending', raw); } catch (e0){ EXT._brPend = raw; }
    if (history && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  } catch (e){ LS_ERR = e; }
}
function extBridgePendingApply(){
  if (!FB.ready || !FB.db || !may('settings')) return;
  var raw = EXT._brPend || '';
  if (!raw){ try { raw = sessionStorage.getItem('nsk.bridgePending') || ''; } catch (e0){ raw = ''; } }
  if (!raw) return;
  EXT._brPend = ''; try { sessionStorage.removeItem('nsk.bridgePending'); } catch (e1){ LS_ERR = e1; }
  var o = null; try { o = JSON.parse(raw); } catch (e2){ o = null; }
  if (!o || !extBridgeApply(o, true)){ toast(t('وصلت بياناتٌ من الإشارة المرجعية لكنها غيرُ مقروءة')); return; }
  toast(t('اعتُمد الجسر') + ' \u00b7 ' + nm(o.rd.length) + ' ' + t('قارئ') + ' \u00b7 ' + nm(o.tn.length) + ' ' + t('خيمة'));
  if (CUR !== 'mfu') goPage('mfu'); render(1);
}
/* ملفُّ تصديرٍ من النظام: أعمدةٌ تُعرَف بعناوينها — قرّاء (رقم القارئ · اسم الموقع · آخر تحديث) أو خيام (الكود · السعة · الإحداثيات) */
function extArabicDigits(v){ return String(v == null ? '' : v).replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 0x660); }); }
function extTsParse(v){
  if (v && typeof v.getTime === 'function') return isNaN(v.getTime()) ? '' : v.toISOString();
  var s0 = extArabicDigits(v).trim(); if (!s0) return '';
  var m = /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/.exec(s0), tm = /(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s0);   /* الوقتُ قد يسبق التاريخ في تصدير النظام */
  if (!m){ var d0 = new Date(s0); return isNaN(d0.getTime()) ? '' : d0.toISOString(); }
  var hh = +(tm ? tm[1] : 0); if (/م/.test(s0) && hh < 12) hh += 12; if (/ص/.test(s0) && hh === 12) hh = 0;
  var d = new Date(+m[1], +m[2] - 1, +m[3], hh, +(tm ? tm[2] : 0), +(tm && tm[3] ? tm[3] : 0));
  return isNaN(d.getTime()) ? '' : d.toISOString();
}
function extFilePlan(wb){
  var S = function(v){ return String(v == null ? '' : v).replace(/\u00a0/g, ' ').trim(); };
  var rd = [], tn = [];
  wb.SheetNames.forEach(function(sn){
    var A = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header:1, raw:true, defval:'' }), h = -1, H = null;
    for (var i = 0; i < Math.min(10, A.length); i++){ if ((A[i] || []).some(function(c){ return /رقم القارئ|reader\s*id|readerid|serial|كود|code|اسم الخيمة|tent/i.test(S(c)); })){ h = i; H = A[i]; break; } }
    if (h < 0) return;
    var col = function(re){ for (var k = 0; k < H.length; k++) if (re.test(S(H[k]))) return k; return -1; };
    var cId = col(/رقم القارئ|reader\s*id|readerid|^serial$|السيريال/i), cLoc = col(/اسم الموقع|location|الموقع/i), cTs = col(/آخر تحديث|updated|timestamp|last/i);
    var cCode = col(/^(كود|code|الكود|رقم الخيمة|اسم الخيمة|tent code|tent)$/i), cCap = col(/السعة|capacity/i), cLat = col(/latitude|خط العرض/i), cLng = col(/longitude|خط الطول/i), cGrp = col(/المجموعة|group/i);
    if (cId > -1 && cLoc > -1){
      A.slice(h + 1).forEach(function(r){ var id = extArabicDigits(S(r[cId])); if (!/^\d{4,}$/.test(id)) return; rd.push([id, S(r[cLoc]), cTs > -1 ? extTsParse(r[cTs]) : '']); });
    } else if (cCode > -1){
      A.slice(h + 1).forEach(function(r){ var c = S(r[cCode]); if (!c) return; tn.push(['', c, cLat > -1 ? S(r[cLat]) : '', cLng > -1 ? S(r[cLng]) : '', cGrp > -1 ? S(r[cGrp]) : '', cCap > -1 ? +extArabicDigits(r[cCap]) || 0 : 0]); });
    }
  });
  if (!rd.length && !tn.length) return null;
  /* يُدمَج مع آخر جسر: ما لم يأتِ في الملف يبقى */
  var cur = EXT.bridge ? { rd:Object.keys(EXT.readers || {}).map(function(k){ var r = EXT.readers[k]; return [r.readerId, r.locationName, r.timestamp]; }),
                          tn:Object.keys(EXT.tents || {}).map(function(k){ var x = EXT.tents[k]; return [x.id, x.code, x.latitude, x.longitude, x.tentGroup, x.capacity]; }) } : { rd:[], tn:[] };
  return { v:1, at:Date.now(), rd:rd.length ? rd : cur.rd, tn:tn.length ? tn : cur.tn, ov:[], src:'file', nRd:rd.length, nTn:tn.length };
}
function extFileImport(file){
  if (!may('settings')){ toast(t('الجسرُ للمهندس فما فوق')); return; }
  xlsxLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var fr = new FileReader();
    fr.onload = function(){
      try {
        var wb = XLSX.read(new Uint8Array(fr.result), { type:'array', cellDates:true }), o = extFilePlan(wb);
        if (!o){ toast(t('لم أجد في الملف أعمدةَ القرّاء (رقم القارئ · اسم الموقع) ولا الخيام (الكود)')); return; }
        extBridgeApply(o, true);
        toast(t('اعتُمد ملفُّ النظام') + ' \u00b7 ' + nm(o.nRd) + ' ' + t('قارئ') + ' \u00b7 ' + nm(o.nTn) + ' ' + t('خيمة')); render(1);
      } catch (e){ softErr('ملف النظام', e, ''); toast(t('تعذّرت قراءةُ الملف')); }
    };
    fr.readAsArrayBuffer(file);
  });
}

extBridgeHashPick();   /* (V37.94) عند التحميل: بياناتُ الإشارة المرجعية إن وُجدت في العنوان */
