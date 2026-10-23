/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-08-cameras-report-sw-update.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Ministry camera report, service worker registration, auto-update, version announcement, the epoch (no uploads from a pre-epoch device) and 'sync everyone now'.
   DEFINES : mohuDms, mohuPole, mohuSec, mohuSiteKey, mohuParse, camxRows, impRead, impValidate, impApply, swInstall, swBusy, swCancel, swApply, swNow … (+6 more)
   GLOBALS : SW_STATE, SW_RELOADED, SW_TICK, EPOCH_PENDING, SYNC_ALL_SEEN
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ تقريرُ كاميرات الوزارة بعناوينه — من داخل التطبيق لا من الشيفرة (V22.5) ═══
   «الكاميرات ٨٨ في الإكسل وفيهم بيانات الكاميرات والـIP — محتاجها كلها واضحة». الشيفرةُ منشورةٌ
   للعموم فلا تحمل عنوانَ شبكة؛ فيُرفَع التقريرُ نفسُه (بصيغة الوزارة كما هو) من «الأدوات ← الاستيراد»:
   يُقرأ على الجهاز، ويُطابَق عمودًا عمودًا بالنقاط (العمودُ والقطاعُ والموقع، وأدوارُ الجمرات)، ويُعرَض
   قبل الحفظ ما طابق وما لم يطابق ولماذا — ثم يُكتَب في قاعدة البيانات المحمية (تجاوزُ النقطة camx)
   فيقرؤه من دخل التطبيق وحده. وكلمةُ المرور لا تُقرأ ولا تُكتَب أبدًا. */
function mohuDms(v){
  var m = String(v || '').match(/(\d+)°(\d+)'([\d.]+)"?\s*([NS])[^\d]*(\d+)°(\d+)'([\d.]+)"?\s*([EW])/);
  if (!m) return null;
  var a = +m[1] + m[2] / 60 + m[3] / 3600, b = +m[5] + m[6] / 60 + m[7] / 3600;
  return [m[4] === 'S' ? -a : a, m[8] === 'W' ? -b : b];
}
function mohuPole(p){ return String(p || '').toUpperCase().replace(/POLE/g, 'P').replace(/[^A-Z0-9]/g, ''); }
function mohuSec(p){ return String(p || '').toUpperCase().replace(/\s+/g, ''); }
function mohuSiteKey(x){
  var m = /كاميرا وزارة\s+(.*?)\s*(\[\d+ cams\])?\s*(\(PTZ\))?\s*-\s*(.+)$/.exec(String(x.name || ''));
  return m ? [mohuPole(m[1]), mohuSec(m[4])] : null;
}
function mohuParse(rows){
  var clean = function(v){ var s0 = String(v == null ? '' : v).trim(); return /PASS/i.test(s0) ? '' : s0; };   /* كلمةُ المرور لا تمرّ */
  var start = -1;
  rows.forEach(function(r, i){ if ((r || []).some(function(c){ return /^\s*SECTOR\s*$/i.test(String(c)); })) start = i; });
  var cur = { cpe:'', pole:'', ant:'', loc:'', status:'', sector:'', secAnt:'' }, cams = [];
  for (var i = start + 1; i < rows.length; i++){
    var r = (rows[i] || []).map(clean);
    if (!r.some(function(c){ return c; })) continue;
    if (/^SECTOR$/i.test(r[2])) continue;
    if (r[2]){ var ln = r[2].split(/\n/); cur.sector = ln[0].replace(/\s*\(\d+\)\s*$/, '').trim(); cur.secAnt = ln.slice(1).join(' ').trim(); }
    if (r[0] || r[3]){ cur.cpe = r[0]; cur.pole = r[3]; cur.ant = r[4]; cur.loc = r[11]; cur.status = r[12]; }
    if (!r[1] && !r[6]) continue;
    cams.push({ row:i + 1, n:r[1], vlan:r[5], ip:r[6], model:r[7], kind:/PTZ/i.test(r[8]) ? 'P' : (/LPR/i.test(r[8]) ? 'L' : 'F'),
                sector:cur.sector, secAnt:cur.secAnt, cpe:cur.cpe, pole:cur.pole, ant:cur.ant, loc:r[11] || cur.loc, status:r[12] || cur.status });
  }
  var cand = (STATE.sites || []).filter(function(x){ return x.type === 'كاميرا'; });
  var byId = {}, bad = [];
  cams.forEach(function(c){
    var id = '', L0 = String(c.loc).toUpperCase(), jam = /JAMARAT/.test(L0 + ' ' + c.sector.toUpperCase() + ' ' + c.pole.toUpperCase());
    if (jam){
      var cn = String(c.n || '').replace(/\D/g, '');   /* (V23.3) كلُّ كاميرا نقطتُها — تُطابَق برقمها كما في الإكسل */
      var byN = cn ? (STATE.sites || []).filter(function(x){ return /^NSK-JMR-CAM-/.test(x.id) && new RegExp('CAM\\s*' + cn + '(?!\\d)').test(x.name); })[0] : null;
      if (byN) id = byN.id;
      var pp = mohuPole(c.pole);
      if (id){ /* طابق برقمه */ } else if (pp === 'F144') id = 'NSK-JMR-CAM-0006'; else if (pp === 'F143') id = 'NSK-JMR-CAM-0007'; else if (pp === 'F131') id = 'NSK-JMR-CAM-0008';
      else if (/BACK/.test(L0)) id = 'NSK-JMR-CAM-0009';
      else { var fm = /\b(G|1ST|2ND|3RD|4TH)\s*F/.exec(L0); if (fm) id = 'NSK-JMR-CAM-000' + ({ G:1, '1ST':2, '2ND':3, '3RD':4, '4TH':5 })[fm[1]]; }
    } else {
      var ll = mohuDms(c.loc), kp = mohuPole(c.pole), ks = mohuSec(c.sector), best = null, bd = 9e9;
      cand.forEach(function(x){ var k = mohuSiteKey(x); if (!k || k[0] !== kp) return; var d = ll ? distKm({ lat:ll[0], lng:ll[1] }, x) * 1000 : (k[1] === ks ? 0 : 9e8); if (k[1] !== ks && d > 30) return; if (d < bd){ bd = d; best = x; } });
      if (best) id = best.id;
    }
    if (!id || !siteFind(id)){ bad.push({ row:c.row, why:(!c.loc || (!jam && !mohuDms(c.loc))) ? 'بلا إحداثيات ولا نقطةٍ تطابقه' : 'لا نقطةَ تطابقه', data:[(c.pole || c.cpe || ('كاميرا ' + c.n)) + ' · ' + c.sector] }); return; }
    var o = byId[id] = byId[id] || { id:id, camx:{ src:'MOHU 2026', at:Date.now(), by:STATE.meta.name || '', sector:c.sector, secAnt:c.secAnt, cpe:c.cpe, pole:c.pole, ant:c.ant, status:c.status, cams:[] } };
    o.camx.cams.push({ n:c.n, kind:c.kind, model:c.model, ip:c.ip, vlan:c.vlan });
  });
  var ok = Object.keys(byId).map(function(k){ return byId[k]; });
  IMP_PREVIEW = { kind:'mohu', ok:ok, bad:bad, head:['CPE','CAM','SECTOR','POLE','IP'], missing:start < 0 ? ['SECTOR'] : [], cams:cams.length };
  return IMP_PREVIEW;
}
/* صفوفُ النافذة من تقرير الوزارة المرفوع — لمن دخل التطبيق */
function camxRows(x, kvf){
  var c = camNetOf(x); if (!c || !Array.isArray(c.cams) || !c.cams.length) return '';   /* المرفوعُ ثم الثابتُ ثم العمودُ باسمه (V23.6) */
  var ltr = function(v){ return '<span dir="ltr" class="num">' + esc(v) + '</span>'; };
  /* (V23.6) كانت أسطرُ الطراز ورابطِ البثّ لا تلتفّ داخل عمود القيمة الضيّق فتفيض أفقيًّا ويبقى مكانُها مربعًا
     فارغًا. صارت كلُّ كاميرا كتلةً: سطرٌ بالعربية، وثلاثةٌ من اليسار تلتفّ بأيِّ موضع */
  var L = function(v){ return '<div dir="ltr" class="cx-l">' + v + '</div>'; };
  var list = '<div class="cx-box">' + c.cams.map(function(k){
    return '<div class="cx"><b>' + esc(t('كاميرا')) + ' ' + esc(k.n || '\u2014') + '</b> \u2014 ' + esc(t(k.kind === 'P' ? 'متحرّكة (PTZ)' : k.kind === 'L' ? 'قارئة لوحات (LPR)' : 'ثابتة (Bullet)'))
      + (k.ip ? L('IP ' + esc(k.ip) + (/\d/.test(k.vlan || '') ? ' \u00b7 VLAN ' + esc(k.vlan) : '')) : '')
      + (k.model ? L(esc(k.model) + (CAM_SPEC[k.model] ? ' \u00b7 ' + esc(CAM_SPEC[k.model]) : '')) : '')
      + (k.ip ? L('<span class="hint" style="margin:0;font-size:11px">rtsp://' + esc(k.ip) + ':554/cam/realmonitor?channel=1&amp;subtype=0</span>') : '')
      + '</div>';
  }).join('') + '</div>';
  return (c.cpe || c.ant ? kvf('المستقبِل على العمود', ltr([c.cpe, c.ant].filter(Boolean).join(' \u00b7 '))) : '')
    + (c.secAnt ? kvf('هوائي القطاع', ltr(c.secAnt)) : '')
    + (c.status ? kvf('حالة الوصلة', esc(c.status)) : '')
    + kvf('عناوين الكاميرات', list)
    + (x.lat && x.lng ? kvf('الخريطة', '<a href="https://maps.google.com/?q=' + (+x.lat) + ',' + (+x.lng) + '" target="_blank" rel="noopener">' + esc(t('افتح في خرائط جوجل')) + '</a>') : '');
}
function impRead(kind, file){
  return xlsxLoad().then(function(ok){
    if (!ok) return null;
    return new Promise(function(res){
      var fr = new FileReader();
      fr.onload = function(){
        try{
          var wb = XLSX.read(new Uint8Array(fr.result), { type:'array' });
          var ws = wb.Sheets[wb.SheetNames[0]];
          var rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
          res(kind === 'mohu' ? mohuParse(rows) : impValidate(kind, rows));   /* تقريرُ الوزارة بصيغته (V22.5) */
        }catch(e){ res(null); }
      };
      fr.onerror = function(){ res(null); };
      fr.readAsArrayBuffer(file);
    });
  });
}

function impValidate(kind, rows){
  var cols = IMP_COLS[kind] || [], head = rows[0] || [];
  var missing = cols.filter(function(c){ return head.indexOf(c) < 0; });
  var okRows = [], bad = [];
  for (var i = 1; i < rows.length; i++){
    var r = rows[i];
    if (!r || !r.length || r.every(function(v){ return v === ''; })) continue;
    var why = '';
    if (kind === 'sites'){
      if (!r[0]) why = 'بلا معرّف';
      else if (!siteFind(String(r[0]).trim())) why = 'معرّف غير موجود';
    } else if (kind === 'items'){
      var z = String(r[0]||'').trim();
      if (z !== 'مخيم' && z !== 'ممر') why = 'المنطقة إما مخيم أو ممر';   /* منطقتا الكتالوج لا أنواعُ المواقع */
      else if (!r[1]) why = 'بلا اسم';
    } else if (kind === 'buys'){
      if (DATA.buyCats.indexOf(String(r[2]||'').trim()) < 0) why = 'فئة غير معتمدة';
      else if (DATA.suppliers.indexOf(String(r[6]||'').trim()) < 0) why = 'مورّد غير معتمد';
    } else if (!r[0]) why = 'الحقل الأول فارغ';
    if (why) bad.push({ row:i+1, why:why, data:r });
    else okRows.push(r);
  }
  IMP_PREVIEW = { kind:kind, missing:missing, ok:okRows, bad:bad, head:head };
  return IMP_PREVIEW;
}


/* ═══ عامل الخدمة — التطبيق يفتح بلا شبكة ═══
   القشرة تُكاش عند التثبيت، والملفات الثقيلة عند أول طلب،
   والصفحاتُ شبكةٌ أولًا فإن تعذّرت فمن الكاش — فلا يُعرض قديمٌ وشبكةٌ حاضرة. */


var SW_STATE = { reg:null, ok:false, waiting:false };

function swInstall(){
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return Promise.resolve(false);
  /* يُسجَّل من `./sw.js` — والمتصفّحاتُ ترفض `blob:` لتسجيل العامل، فكان
     لا يُسجَّل عاملٌ أصلًا: لا عملَ بلا شبكة، ولا دورةَ تحديث، ولا إشعارَ
     نظام. والملفُّ في المستودع يُرقَّم كلَّ دفعةٍ ولا يُستعمَل. */
  try{
    return navigator.serviceWorker.register('./sw.js', { scope:'./' })
      .then(function(r){
        SW_STATE.reg = r; SW_STATE.ok = true;
        setTimeout(function(){ libsWarm(false); }, 30000);   /* (V38.54) keep the export libraries for offline — supervisors and up, when online and idle */
        r.addEventListener('updatefound', function(){
          var nw = r.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function(){
            if (nw.state === 'installed' && navigator.serviceWorker.controller){
              SW_STATE.waiting = true;
              swApply();
            }
          });
        });
        return true;
      })
      .catch(function(e){
        softErr('عامل الخدمة', e, 'تعذّر تجهيزُ العمل بلا شبكة — التطبيقُ يحتاج اتصالًا');
        return false;
      });
  }catch(e){ return Promise.resolve(false); }
}

/* ═══ التحديثُ التلقائيّ ═══
   العاملُ يأخذ السيطرةَ فورًا، لكنّ الصفحةَ تبقى على شيفرتها القديمة حتى
   تُعاد. وكان يُقال «أغلق التطبيقَ وافتحه» — ومن لا يقرأ الرسالةَ يبقى على
   نسخةٍ قديمةٍ أسبوعًا، ويشكو من عطلٍ أُصلح.

   فتُعاد الصفحةُ بنفسها — إلا أن يكون المستخدمُ في نموذجٍ فيه ما لم يُحفَظ،
   فإعادةُ التحميل حينئذٍ تُضيع عملَه. فيُنتظَر حتى يخرج منه. */
var SW_RELOADED = false;
function swBusy(){
  /* نموذجٌ مفتوحٌ فيه إدخال، أو طابورٌ لم يُرفَع بعد */
  if (['svForm','insForm','newsite'].indexOf(CUR) > -1) return true;
  try { if (document.querySelector('input:focus, textarea:focus, select:focus')) return true; } catch (e){ LS_ERR = e; }
  return false;
}
var SW_TICK = null, SW_LEFT = 0;
function swCancel(){
  clearInterval(SW_TICK); SW_TICK = null;
  var b = document.getElementById('swBar');
  if (b) b.remove();
}
/* شريطٌ يعدُّ من خمسٍ ويقول ما سيقع، وفيه «حدّث الآن» و«لاحقًا».
   وكان التحديثُ يقع بعد سبعِ أعشارِ ثانيةٍ بلا مهلة — فمن كان يقرأ شيئًا
   فقده بلا إنذار. والتأجيلُ حقٌّ لمن يعمل. */
function swApply(){
  if (SW_RELOADED || SW_TICK) return;
  if (swBusy()){
    toast(t('نسخةٌ جديدةٌ جاهزة — تُطبَّق فور انتهائك'));
    setTimeout(swApply, 20000);
    return;
  }
  SW_LEFT = 5;
  var bar = document.createElement('div');
  bar.id = 'swBar'; bar.className = 'sw-bar';
  bar.innerHTML = '<span id="swTxt"></span>'
    + '<button type="button" class="btn btn-primary btn-sm" data-swnow="1">'
    + esc(t('حدّث الآن')) + '</button>'
    + '<button type="button" class="btn btn-quiet btn-sm" data-swlater="1">'
    + esc(t('لاحقًا')) + '</button>';
  document.body.appendChild(bar);
  var paint = function(){
    var el = document.getElementById('swTxt');
    if (el) el.textContent = t('نسخةٌ جديدةٌ نزلت — تُطبَّق بعد') + ' ' + nm(SW_LEFT);
  };
  paint();
  SW_TICK = setInterval(function(){
    SW_LEFT--;
    if (SW_LEFT > 0){ paint(); return; }
    swCancel(); swNow();
  }, 1000);
}
function swNow(){
  if (SW_RELOADED) return;
  SW_RELOADED = true; swCancel();
  toast(t('تُحدَّث النسخة…'));
  swLighten();
  setTimeout(function(){ try { location.reload(); } catch (e){ LS_ERR = e; } }, 600);
}
/* (V21.9) الانتقالُ إلى النسخة الجديدة كان يُحمِّل الصفحةَ الجديدةَ فوق القديمة بكلِّ ما فيها
   (خريطةٌ بألفٍ وثمانمئة نقطة، وشجرةُ الصفحة، والإنصاتُ الحيّ) — فذروةُ الذاكرة في سفاري
   الآيفون تتجاوز حدَّها فيُسقِطها. يُطفأ الثقيلُ أوّلًا ثم يُعاد التحميل. */
function swLighten(){
  bootOk('update');
  try { if (typeof liveStop === 'function') liveStop(); } catch (e){ LS_ERR = e; }
  try { if (typeof M3 !== 'undefined' && M3 && M3.remove){ M3.remove(); M3 = null; } } catch (e){ LS_ERR = e; }
  try { if (typeof MAP !== 'undefined' && MAP && MAP.remove){ MAP.remove(); MAP = null; } } catch (e){ LS_ERR = e; }
  try { ['content', 'mapBox'].forEach(function(id){ var el = document.getElementById(id); if (el) el.innerHTML = ''; }); } catch (e){ LS_ERR = e; }
}
/* ═══ النسخةُ تُعلَن من القاعدة ═══
   كان الجهازُ يعرف بالإصدار الجديد حين يسأل الخادمَ كلَّ ربع ساعة — فتبقى أجهزةٌ
   على إصدارٍ أقدم ساعةً وأكثر، والمكتبُ يرى ذلك في «نسخ الأجهزة» ولا يملك إلا
   أن يطلب من أصحابها الإغلاقَ والفتح. صار المكتبُ يكتب رقمَ نسخته في
   settings/app أوّلَ ما يدخل، وكلُّ جهازٍ مفتوحٍ يُنصِت إليه: نسخةٌ أعلى من نسختي
   = اسأل عامل الخدمة الآن، وإن لم يجد جديدًا (تأخّرُ النشر) يسأل كلَّ دقيقة حتى
   يجد. والمغلقُ يتحدّث حين يُفتَح — لا سبيلَ إلى جهازٍ مغلق. */
function verNum(v){ var m = /V(\d+)\.(\d+)/.exec(String(v || '')); return m ? (+m[1]) * 1000 + (+m[2]) : 0; }
function verPublish(){
  var mine = appVer(); if (!mine || !may('roles')) return;
  var cloud = (STATE.appVerCloud || '');
  if (verNum(mine) > verNum(cloud)){ STATE.appVerCloud = mine; CORE.set('cfg', 'app', { ver:mine, at:Date.now(), by:STATE.meta.name || '' }); }
}
/* ═══ العهدُ الجديد — لا يُرفَع من جهازٍ ما سبق العهدَ ═══
   «هنبدأ كلَّه على السيرفر جديدًا»: التصفيرُ يمحو القاعدةَ، لكن أجهزةَ الفريق
   تحمل طوابيرَ وسجلاتِ تجربةٍ ترفعها أوّلَ دخول فتعود القاعدةُ ملأى بالقديم.
   فصار للتصفير عهدٌ: رقمٌ في settings/app يقرؤه كلُّ جهازٍ قبل أن يدفع طابورَه
   (pullStatic قبل أيِّ رفع، والإنصاتُ لمن كان مفتوحًا): عهدٌ لا يعرفه = يُفرِغ
   ما عنده — سجلاتٍ وطابورًا ومعزولًا — ويسحب من القاعدة باردًا. الحساباتُ
   والإعداداتُ وطبقةُ النقاط تبقى لأنها في القاعدة أصلًا. */
var EPOCH_PENDING = false;   /* قراءةُ العهد جارية — لا رفعَ حتى تنتهي */
/* ═══ «زامِن الجميع الآن» ═══
   كان المكتبُ إن أراد أن يصل الفريقَ شيءٌ فورًا لا يملك إلا أن يطلب من كلٍّ أن
   يضغط المزامنة. والقاعدةُ تصل كلَّ جهازٍ مفتوحٍ أصلًا (settings/app منصَتٌ إليه):
   فرقمٌ يزيد هناك = أمرٌ بسحبٍ فوريٍّ يمرُّ به كلُّ مفتوح، والمغلقُ يسحب حين يُفتَح.
   ولمديرِ المشروع وحدَه — والقاعدةُ تحرسه لا الشاشةُ فقط. */
var SYNC_ALL_SEEN = 0;

function syncAllApply(v){
  var n = +v || 0;
  if (!n || n <= (SYNC_ALL_SEEN || 0)) return false;
  var first = !SYNC_ALL_SEEN;
  SYNC_ALL_SEEN = n;
  if (first) return false;                      /* أوّلُ قراءةٍ تضبط العلامةَ ولا تسحب */
  SYNC.pullAsk = true; FB._staticAt = 0; syncCycle();   /* أمرُ المكتب يجلب الثوابتَ أيضًا */
  toast(t('مزامنةٌ من المكتب — يُسحَب الآن'));
  return true;
}
function epochApply(cloud){
  cloud = +cloud || 0;
  if (!cloud || cloud === (STATE.meta.epoch || 0)) return false;
  var n = 0;
  WIPE_KEYS.forEach(function(k){ var v = STATE[k[0]]; n += Array.isArray(v) ? v.length : Object.keys(v || {}).length; STATE[k[0]] = Array.isArray(v) ? [] : {}; });
  ['steps','poison','queue'].forEach(function(k){ STATE[k] = []; });
  ['evlog','notifs','att','presence'].forEach(function(k){ STATE[k] = Array.isArray(STATE[k]) ? [] : {}; });
  STATE.notifs = [];
  (STATE.sites || []).forEach(function(x){ x.fstat = 'لم يبدأ'; });
  SITE_IX = null; SITE_TOK = null;
  STATE.meta.pullAt = {}; STATE.meta.notifAt = Date.now(); STATE.meta.epoch = cloud;
  CORE.saveSoon(); statBump();
  logEvent('عهدٌ جديد — أُفرغ هذا الجهاز (' + nm(n) + ' سجلًّا) وسُحب من القاعدة');
  toast(t('بدايةٌ جديدة من المكتب — أُفرغ هذا الجهازُ ويُسحَب من القاعدة'));
  return true;
}

/* (V38.54) vendored libraries — readiness on this device and the warm-up request to the service worker */
function libsWarm(force){
  try {
    if (!force && !(typeof rankOf === 'function' && rankOf(ROLE) >= rankOf('supervisor'))) return false;
    if (!navigator.onLine || !navigator.serviceWorker || !navigator.serviceWorker.controller) return false;
    if (!libsWarm.hooked){ libsWarm.hooked = true; navigator.serviceWorker.addEventListener('message', function(ev){ if (ev.data && ev.data.type === 'nsk-libs-warm') libsLinePaint(); }); }
    navigator.serviceWorker.controller.postMessage({ type:'nsk-warm-libs' }); libsWarm.at = Date.now(); return true;
  } catch (e){ LS_ERR = e; return false; }
}
function libsStatus(){
  var L = ['vendor/xlsx/0.20.3/xlsx.full.min.js', 'vendor/exceljs/4.4.0/exceljs.min.js', 'vendor/jszip/3.10.1/jszip.min.js', 'vendor/firebase/9.23.0/firebase-firestore-compat.js'];
  if (typeof caches === 'undefined' || !caches.open) return Promise.resolve({ ok:false, have:0, n:L.length });
  return caches.open('nusuk-lib').then(function(c){ return Promise.all(L.map(function(u){ return c.match(appUrl() + u).then(function(h){ return !!h; }); })); })
    .then(function(R){ var have = R.filter(Boolean).length; return { ok:have === L.length, have:have, n:L.length }; })
    .catch(function(){ return { ok:false, have:0, n:L.length }; });
}
function libsLinePaint(){
  var el = document.getElementById('libsLine'); if (!el) return;
  libsStatus().then(function(s){
    el.innerHTML = (s.ok ? '\u2705 ' + esc(t('مكتباتُ الدخول والتصدير محفوظةٌ على الجهاز — الإكسلُ والـPDF يعملان بلا شبكة'))
                         : '\u26A0 ' + esc(t('مكتباتُ التصدير لم تُحفَظ كلُّها على الجهاز بعد')) + ' (' + nm(s.have) + '/' + nm(s.n) + ') ' + btn(t('جهّزها الآن'), 'btn-secondary btn-sm', ' data-libswarm="1"'))
      + (libLoad.fellBack ? ' <span class="hint" style="margin:0">' + esc(t('استُعمل المصدرُ العامُّ احتياطًا')) + ' \u00d7' + nm(libLoad.fellBack) + '</span>' : '');
  });
}
