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
  if (!EXT.tok) return Promise.resolve(null);
  if (EXT.tents && Date.now() - EXT.tentsAt < 3600000) return Promise.resolve(EXT.tents);
  /* perPage=50, نجمع كل الصفحات */
  var all = {}, page = 1, per = 50;
  function fetchPage(){
    return extFetch(EXT_API + '/tents?page=' + page + '&perPage=' + per, true)
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        if (!j || !j.data) return;
        (Array.isArray(j.data) ? j.data : [j.data]).forEach(function(t){
          if (t.code) all[t.code] = t;
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
    EXT.tents = all; EXT.tentsAt = Date.now(); return all;
  }).catch(function(){ return null; });
}

/* ── نظرة عامة لخيمة واحدة (طلب عند الفتح + cache دقيقة) ── */
function extOvLoad(tentId, forceRefresh){
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

/* ── نقاطنا المركّبة مع سيريالاتها ── */
function extOurSerials(){
  var out = [];
  (STATE.sites || []).forEach(function(x){
    var ins = STATE.inss[x.id];
    if (!ins || ins.status !== 'مُركّب') return;
    var ser = extReaderSerial(ins);   /* (V37.80) السيريالُ في ins.serials بمفتاح قطعة القارئ — كان يُقرأ من حقلٍ لا وجود له */
    if (ser) out.push({ id:x.id, name:x.name || x.n || x.id, zone:x.zone || x.z || '', serial:ser, ins:ins });
  });
  return out;
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
    /* بناء خريطة tentCode → tentMeta */
    var byCode = tents;   /* key = code مثل "38/56" */
    var matched = [], unmatched = [];
    extOurSerials().forEach(function(pt){
      var reader = readers[extSerKey(pt.serial)];
      if (!reader){ unmatched.push(pt.serial); return; }
      var code = reader.locationName || '';
      var meta = byCode[code] || null;
      if (!meta){
        /* جرّب بحث جزئي كـ "38/56" في مفاتيح byCode */
        Object.keys(byCode).forEach(function(k){
          if (k === code || k.replace(/\//g,'_') === code.replace(/\//g,'_')) meta = byCode[k];
        });
      }
      matched.push({ serial:pt.serial, tentCode:code, tentId:meta ? meta.id : '', tentMeta:meta, reader:reader, point:pt });
    });
    EXT_MATCH_STATE = { matched:matched, unmatched:unmatched, at:Date.now() };
    if (EXT.rdErr) EXT.err = EXT.rdErr;
    EXT.busy = false; render(1); return EXT_MATCH_STATE;
  }).catch(function(e){ EXT.busy = false; EXT.err = String(e); render(1); return null; });
}

/* ── الشاشة الرئيسية ── */
var EXT_OV_LOADED = {};   /* {tentId: true} جُلبت بالفعل */
function mtCamps(){
  /* أوّل مرة: حمّل التوكن من السحابة */
  if (!EXT.tok && !EXT._tokAsked){ EXT._tokAsked = true; extTokLoad(); }

  var h = '';

  /* بطاقة الإعداد — للمهندس فقط */
  if (may('settings')) h += extTokCard();

  if (!EXT.tok){
    return h + (may('settings') ? alertBox('info', t('أضف توكن نظام البطاقات لتشغيل هذه الشاشة.')) : extSnapView());   /* (V37.81) */
  }

  /* تحميل المطابقات */
  if (!EXT_MATCH_STATE || EXT.busy){
    if (!EXT.busy) extMatchLoad();
    return h + '<div class="hint" style="text-align:center;padding:20px">⟳ ' + esc(t('جارٍ تحميل بيانات المخيمات…')) + '</div>';
  }

  if (EXT.err) h += alertBox('warn', t('خطأ في تحميل البيانات') + ': ' + EXT.err);

  var matched = EXT_MATCH_STATE.matched;
  var unmatched = EXT_MATCH_STATE.unmatched;

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
  var ins = STATE.inss[x.id], ser = extReaderSerial(ins), o = { ser:ser, loc:'', at:0, occ:'' };
  if (!ser) return o;
  var r = EXT.readers ? EXT.readers[extSerKey(ser)] : null;
  if (!r){   /* (V37.81) بلا بثٍّ حيّ: من لقطة المكتب */
    var Z = STATE.extSnap && STATE.extSnap.sites && STATE.extSnap.sites[x.id];
    if (!Z || extSerKey(Z.ser) !== extSerKey(ser)) return o;
    var C = STATE.extSnap.camps && STATE.extSnap.camps[Z.code];
    o.loc = Z.code || ''; o.at = Date.parse(Z.ts || '') || 0; o.snap = true;
    if (C){ var tt = C.w + C.wo + C.ot; o.occ = (C.cap ? Math.round(tt / C.cap * 100) + '٪ · ' : '') + tt + ' / ' + C.cap; }
    return o;
  }
  o.loc = r.locationName || ''; o.at = Date.parse(r.timestamp || '') || 0;
  var m = EXT_MATCH_STATE && EXT_MATCH_STATE.matched.filter(function(z){ return z.serial === ser; })[0];
  var ov = m && m.tentId && EXT.ov[m.tentId] && EXT.ov[m.tentId].data;
  if (ov && ov.occupancyStatus){
    var c = ov.occupancyStatus, tot = (c.currentlyOccupied || 0) + (c.withoutBracelet || 0) + (c.fromOtherCamps || 0);
    o.occ = (c.totalCapacity ? Math.round(tot / c.totalCapacity * 100) + '٪ · ' : '') + tot + ' / ' + (c.totalCapacity || 0);
  }
  return o;
}
/* تحميلُ بيانات نظام البطاقات عند فتح القائمة — مرةً في الدقيقة على الأكثر، ثم يُعاد الرسم */
function pilotKick(){
  if (EXT._plAt && Date.now() - EXT._plAt < 60000) return;
  EXT._plAt = Date.now();
  var tk = (!EXT.tok && !EXT._tokAsked) ? (EXT._tokAsked = true, extTokLoad()) : Promise.resolve(null);
  if (!may('settings')){ extSnapLoad(); return; }   /* (V37.81) غيرُ المكتب يقرأ اللقطة */
  tk.then(function(){ return extReadersLoad(); }).then(function(){
    if (EXT.tok && !EXT.busy) return extMatchLoad().then(function(st){
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
            nk.ser || (ins ? t('لا سيريال قارئ') : '\u2014'), (nk.loc ? nk.loc + (nk.snap ? ' \u00b7 ' + t('لقطة') : '') : '') || (nk.ser ? (EXT.readers || (STATE.extSnap && !may('settings')) ? t('غير ظاهر في نظام البطاقات') : may('settings') ? t('يُحمَّل…') : t('لا لقطةَ بعد')) : '\u2014'),
            nk.at ? pilotAgo(nk.at) : '\u2014', nk.occ || '\u2014'];
  });
}

/* ═══ (V37.81) لقطةُ المكتب — الوزارةُ ترى الإشغالَ بلا توكن ═══
   الإشغالُ يحتاج توكنَ حساب صاحب المشروع، وخوادمُ نظام البطاقات محجوبةٌ خارج المملكة فلا يجلبها
   الخادم. فجهازُ المكتب الذي يفتح الشاشة يحفظ «الأرقامَ وحدَها» في settings/extSnap — كلَّ ٥ دقائق
   على الأكثر — ويقرؤها الباقون مع وقت اللقطة. لا توكنَ ولا عنوانَ كاميرا ولا شيءَ غيرَ الأرقام. */
function extSnapMaybe(){
  if (!may('settings') || !EXT.tok || !EXT_MATCH_STATE) return;
  if (EXT._snapAt && Date.now() - EXT._snapAt < 5 * 60000) return;
  var sites = {}, camps = {}, nOv = 0;
  EXT_MATCH_STATE.matched.forEach(function(m){
    sites[m.point.id] = { ser:m.serial, code:m.tentCode || '', ts:(m.reader && m.reader.timestamp) || '' };
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
