/* ============================================================================
   FILE    : src/03z-shared/03z-shared-17-from-ext-camps-03-nusuk-card-system.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-ext-camps-03-nusuk-card-system.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : EXT, EXT_API, EXT_STREAM, extTokLoad, extFetch, extReadersLoad, extTentsLoad, extOvLoad, EXT_MATCH_STATE, extMatchLoad, EXT_OV_LOADED, extSerKey, extCodeKey, extTentByCode … (+26 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
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
  /* (V38.1) بلا توكنٍ محفوظٍ لا طلبَ إلى نظام البطاقات من التطبيق أصلًا: سياسةُ أمان الصفحة (CSP) لا تسمح بنطاقاتهم،
     فالطلبُ يُرفَض في المتصفح قبل أن يخرج — وهو ما أسقط اختبارَ المتصفح الحقيقي في السحابة، وما ظهر في جوال المالك
     «تعذّر الوصول إلى بثّ القرّاء». الطريقُ هو الجسر. */
  if (!EXT.tok){ EXT.rdErr = ''; return Promise.resolve(EXT.readers || null); }
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

/* ── جرد التوافق: نقاطنا ↔ قرّاؤهم ↔ خيامهم ── */
var EXT_MATCH_STATE = null;

/* {matched:[{serial,tentCode,tentId,tentMeta,reader,point}], unmatched:[serial], at:ts} */

function extMatchLoad(forceRefresh){
  if (!forceRefresh && EXT_MATCH_STATE && Date.now() - EXT_MATCH_STATE.at < 300000)
    return Promise.resolve(EXT_MATCH_STATE);
  EXT.busy = true; EXT.err = '';   /* (V37.80) لا رسمَ من داخل الرسم — الشاشةُ تعرض «جارٍ التحميل» بنفسها */
  return Promise.all([extReadersLoad(), extTentsLoad()]).then(function(res){
    var readers = res[0] || {};
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
var EXT_OV_LOADED = {};

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
    extSerNewOf(on, ser, x.nk);   /* (V38.7) استُبدل القارئُ في النظام؟ */
    return on;
  }
  var ts = extTentForSite(x), exp = ts ? ts.t.code : ((x && x.type === 'مخيم' && x.sign) ? x.sign : '');
  var o = { ser:ser, reader:rd, tent:ts ? ts.t : null, dist:ts ? Math.round(ts.d) : null, by:ts ? 'sign' : (rd ? 'serial' : ''), warn:'' };
  if (rd && exp && rd.locationName && extCodeKey(rd.locationName) !== extCodeKey(exp)) o.warn = String(rd.locationName);
  if (ts) extSerNewOf(o, ser, ts.t.code);   /* (V38.7) */
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

/* ═══ (V37.81) لقطةُ المكتب — الوزارةُ ترى الإشغالَ بلا توكن ═══
   الإشغالُ يحتاج توكنَ حساب صاحب المشروع، وخوادمُ نظام البطاقات محجوبةٌ خارج المملكة فلا يجلبها
   الخادم. فجهازُ المكتب الذي يفتح الشاشة يحفظ «الأرقامَ وحدَها» في settings/extSnap — كلَّ ٥ دقائق
   على الأكثر — ويقرؤها الباقون مع وقت اللقطة. لا توكنَ ولا عنوانَ كاميرا ولا شيءَ غيرَ الأرقام. */
function extSnapMaybe(){
  if (!may('settings') || !(EXT.tok || EXT.bridge) || !EXT_MATCH_STATE) return;
  if (EXT._snapAt && Date.now() - EXT._snapAt < 5 * 60000) return;
  var sites = {}, camps = {};
  EXT_MATCH_STATE.matched.forEach(function(m){
    sites[m.point.id] = { ser:m.serial || '', code:m.tentCode || '', ts:(m.reader && m.reader.timestamp) || '', by:m.by || '', warn:m.warn || '' };
    var o = m.tentId && EXT.ov[m.tentId]; if (!o || !o.data) return;
    var c = o.data.occupancyStatus || {}, a = o.data.averageTime || {};
    camps[m.tentCode] = { cap:+c.totalCapacity || 0, w:+c.currentlyOccupied || 0, wo:+c.withoutBracelet || 0, ot:+c.fromOtherCamps || 0,
                          inT:String(a.insideCamp || ''), trT:String(a.transitTime || ''), at:o.at, grp:(m.tentMeta && m.tentMeta.tentGroup) || '' };
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
    + (L.reader ? '<div><span class="k">' + esc(t('حالة القارئ')) + '</span><span>' + esc(extRdStateText(L.reader)) + '</span></div>' : '')   /* (V38.7) */
    + '</div>'
    + (L.serNew ? alertBox('warn', t('في النظام على هذا الموقع القارئ') + ' ' + L.serNew + ' ' + t('وسيريالُ التركيب عندنا') + ' ' + L.ser + ' \u2014 ' + t('إن استُبدل القارئُ فاعتمد الجديد'))
        + (may('settings') ? '<div class="actions" style="margin:6px 0 0">' + btn('\u{1F504} ' + t('اعتمد سيريال النظام') + ' ' + L.serNew, 'btn-secondary btn-sm', ' data-nkser="' + esc(x.id) + '|' + esc(L.serNew) + '"') + '</div>' : '') : '')
    + (L.tent || L.reader ? '<div class="actions" style="margin:8px 0 0">' + btn('\u{1F441} ' + t('عرض النظرة العامة'), 'btn-quiet btn-sm', ' data-ovopen="' + esc(x.id) + '"') + '</div>' : '');
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

/* القارئُ «متصل» إن قرأ في ربع الساعة السابقة للجسر — فالجسرُ لقطةٌ لا بثٌّ حيّ */
function extRdState(r){
  if (!r) return null;
  var ts = Date.parse(r.timestamp || '') || 0, ref = (EXT.bridge && EXT.bridge.at) || Date.now();
  return { on:!!ts && ref - ts <= 15 * 60000 && ref - ts >= -5 * 60000, ts:ts };
}

function extRdStateText(r){
  var st = extRdState(r); if (!st) return t('لا قارئ ظاهر');
  return (st.on ? '\u{1F7E2} ' + t('متصل عند آخر جسر') : '\u{1F534} ' + t('غير متصل')) + (st.ts ? ' \u00b7 ' + t('آخر قراءة') + ' ' + pilotAgo(st.ts) : '');
}

/* قرّاءُ الموقع في النظام بالاسم أو الكود — إن لم يكن سيريالُ تركيبنا بينها فالقارئُ استُبدل أو سُجِّل خطأً */
function extSerNewOf(o, ser, code){
  var M = extNames(), h = M && code && M[extNameKey(code)];
  if (!ser || !h || !h.rd.length) return;
  if (h.rd.indexOf(extSerKey(ser)) > -1) return;
  o.serNew = String((EXT.readers[h.rd[0]] || {}).readerId || h.rd[0]);
}

/* ═══ (V38.12) حالةُ النقاط من نظام البطاقات — محدَّثةٌ؟ ترسل إشارة؟ لها أرقامُ النظرة العامة؟ ═══
   سؤالُ المالك: «النقاط اللي جاية من النظام — أعرف إزاي إنها محدّثة، وبتبعت إشارة، وفيها أرقام زي النظرة
   العامة ولا لأ؟». كلُّ نقطةٍ مرتبطةٍ بأيِّ مفتاح (اسمُ الربط، الشاخص، سيريالُ التركيب، قارئُ ١٤٤٧) في صفّ:
   الإشارةُ نسبةً إلى وقت آخر جسر (الجسرُ لقطة)، وأرقامُ النظرة العامة إن جاءت فيه، وما يحتاج مراجعة. */
function extStatusRows(){
  if (!EXT.readers && !EXT.tentsBy) return null;
  var out = [];
  (STATE.sites || []).forEach(function(x){
    if (!x) return;
    var L = extLink(x), rd = L.reader, src = L.by;
    if (!rd && x.ex47 && x.ex47.rdr && EXT.readers){ rd = EXT.readers[extSerKey(x.ex47.rdr)] || null; if (rd && !src) src = '1447'; }
    if (!src && !rd && !x.nk) return;
    var tn = L.tent || (rd ? extTentByCode(rd.locationName) : null), ov = tn && EXT.ov[tn.id] && EXT.ov[tn.id].data;
    var st = extRdState(rd), c = (ov && ov.occupancyStatus) || {};
    var tot = (+c.currentlyOccupied || 0) + (+c.withoutBracelet || 0) + (+c.fromOtherCamps || 0), cap = +c.totalCapacity || 0;
    out.push({ x:x, by:src || (x.nk ? 'name' : ''), code:(tn && tn.code) || x.nk || (rd && rd.locationName) || '', ser:(rd && rd.readerId) || L.ser || (x.ex47 && x.ex47.rdr) || '',
      sig:!rd ? 'none' : st && st.on ? 'on' : 'off', ts:st ? st.ts : 0, ov:!!ov, pct:cap ? Math.round(tot / cap * 100) : null, tot:tot, cap:cap,
      chk:L.warn ? 'warn' : L.serNew ? 'ser' : L.missing ? 'miss' : '' });
  });
  return out;
}
