/* ============================================================================
   FILE    : src/03-survey/03-survey-records-08-parts-history-onboarding.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : Parts picker, three items missing from the worker, the point's full history, and the first-run tour.
   DEFINES : patList, patSave, patDel, patApply, itemPickerHtml, pkAdd, solGo, apprIns, posWatch, distKm, distTxt, probeIp, probeOne, probeRun … (+9 more)
   GLOBALS : SOL_LINES, MYPOS, PROBE, SITE_LOG_MORE, LOG_KIND, TOUR
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ مُنتقي القطع — قائمةٌ واحدةٌ مبحوثةٌ وأنماطٌ جاهزة ═══
   كان اقتراحُ الحلِّ شبكةَ كلِّ أصناف الكتالوج بحقولِ كمّياتٍ فارغة — يبحث
   المهندسُ بعينه بين ثلاثين صنفًا عن أربعةٍ يريدها. صار قائمةً واحدةً تُبحَث
   بالكتابة، يُضاف منها الصنفُ بكمّيته سطرًا سطرًا. والأسطرُ التي تتكرّر من
   نقطةٍ لأخرى — قارئٌ وهوائيٌّ ولوحٌ شمسيٌّ وبطاريةٌ للمخيم القياسي — تُحفَظ
   نمطًا باسمٍ يُطبَّق بضغطة. والأنماطُ إعدادٌ يُرفَع ويُقرأ كسائر الإعدادات. */
var SOL_LINES = {}, SOL_Q = '', PAT_NAME = '';
function patList(){
  if (!Array.isArray(STATE.patterns)) STATE.patterns = [];
  return STATE.patterns;
}
function patSave(name){
  if (!may('settings')){ toast(t('حفظُ الأنماط للمهندس وحده')); return false; }
  name = String(name || '').trim();
  if (!name){ toast(t('اكتب اسمًا للنمط')); return false; }
  if (!Object.keys(SOL_LINES).length){ toast(t('أضِف الأسطرَ أولًا ثم احفظها نمطًا')); return false; }
  var L = patList().filter(function(x){ return x.n !== name; });
  var items = {}; Object.keys(SOL_LINES).forEach(function(c){ items[c] = cfgN(SOL_LINES[c]); });
  L.push({ n:name, items:items, by:STATE.meta.name || '', at:Date.now() });
  STATE.patterns = L;
  CORE.set('cfg', 'patterns', L.slice());
  logEvent('حفظ نمط قطع — ' + name + ' \u00b7 ' + nm(Object.keys(items).length) + ' صنف');
  toast(t('حُفظ النمطُ') + ' \u00b7 ' + name);
  PAT_NAME = '';
  return true;
}
function patDel(name){
  if (!may('settings')){ toast(t('حذفُ الأنماط للمهندس وحده')); return; }
  STATE.patterns = patList().filter(function(x){ return x.n !== name; });
  CORE.set('cfg', 'patterns', STATE.patterns.slice());
  logEvent('حذف نمط قطع — ' + name);
  render(1);
}
function patApply(name){
  var pt = patList().filter(function(x){ return x.n === name; })[0];
  if (!pt){ toast(t('اختر نمطًا')); return; }
  Object.keys(pt.items || {}).forEach(function(c){ if (cfgN(pt.items[c]) > 0) SOL_LINES[c] = cfgN(pt.items[c]); });
  toast(t('طُبِّق النمطُ') + ' \u00b7 ' + pt.n);
  render(1);
}
/* واجهةُ المنتقي — تُعرَض في «حل التركيب» وفي «اعتماد الزيارات» سواءً */
function itemPickerHtml(){
  var all = itemsList();
  var q = (typeof arNorm === 'function') ? arNorm(SOL_Q) : String(SOL_Q || '').trim();
  var hits = all.filter(function(i){
    if (!q) return true;
    var hay = (typeof arNorm === 'function') ? arNorm(i.name + ' ' + i.code) : (i.name + ' ' + i.code);
    return hay.indexOf(q) > -1;
  });
  var pats = patList();
  var lines = Object.keys(SOL_LINES).filter(function(c){ return cfgN(SOL_LINES[c]) > 0; });
  return (pats.length || may('settings')
      ? '<div class="grid cols-3" style="align-items:end">'
        + '<div class="field"><label>' + esc(t('نمطٌ جاهز')) + '</label>'
        +   '<select id="patSel">' + (pats.length ? '' : '<option value="">' + esc(t('لا أنماطَ محفوظةً بعد')) + '</option>')
        +   pats.map(function(pt){
              return '<option value="' + esc(pt.n) + '">' + esc(pt.n) + ' \u00b7 ' + nm(Object.keys(pt.items || {}).length) + ' ' + esc(t('صنف')) + '</option>';
            }).join('') + '</select></div>'
        + '<div class="field"><label>&nbsp;</label>' + btn('\u2699 ' + t('طبّق النمط'),'btn-secondary btn-sm',' data-patapply="1"' + (pats.length ? '' : ' disabled')) + '</div>'
        + (may('settings')
          ? '<div class="field"><label>' + esc(t('احفظ الأسطرَ الحاليةَ نمطًا')) + '</label>'
            + '<div class="actions" style="margin:0"><input id="patName" value="' + esc(PAT_NAME) + '" placeholder="' + esc(t('مثلًا: مخيم قياسي')) + '" dir="auto" style="flex:1">'
            + btn('\u{1F4BE} ' + t('احفظ نمطًا'),'btn-quiet btn-sm',' data-patsave="1"') + '</div></div>'
          : '')
        + '</div>'
        + (pats.length && may('settings')
          ? '<div class="chips" style="margin:0 0 10px">' + pats.map(function(pt){
              return '<span class="chip">' + esc(pt.n) + ' <button type="button" class="btn btn-quiet btn-sm" data-patdel="' + esc(pt.n) + '" aria-label="' + esc(t('حذف')) + '" style="padding:0 6px">\u2715</button></span>';
            }).join('') + '</div>'
          : '')
      : '')
    + '<div class="grid cols-3" style="align-items:end">'
    + '<div class="field"><label>' + esc(t('ابحث في الكتالوج')) + '</label>'
    +   '<input type="search" id="pkQ" data-pkq value="' + esc(SOL_Q) + '" placeholder="' + esc(t('اكتب جزءًا من اسم القطعة')) + '" dir="auto"></div>'
    + '<div class="field"><label>' + esc(t('القطعة')) + ' <span class="num">' + nm(hits.length) + '/' + nm(all.length) + '</span></label>'
    +   '<select id="pkItem">' + (hits.length ? '' : '<option value="">' + esc(t('لا صنفَ يطابق البحث')) + '</option>')
    +   capList(hits, 200).map(function(i){
          return '<option value="' + esc(i.code) + '">' + esc(i.name) + ' \u00b7 ' + esc(t(i.z === 'cor' ? 'ممر' : 'مخيم')) + '</option>';
        }).join('') + '</select></div>'
    + '<div class="field"><label>' + esc(t('الكمية')) + '</label>'
    +   '<div class="actions" style="margin:0"><input type="number" id="pkQty" min="1" value="1" inputmode="numeric" style="width:88px">'
    +   btn('\u2795 ' + t('أضِف'),'btn-secondary btn-sm',' data-pkadd="1"') + '</div></div>'
    + '</div>'
    + (lines.length
      ? table(['الصنف','الكمية',''], lines.map(function(c){
          /* (V23.1) «اخترت ١٢ أنتنة — ما أمسحش وأضيف، أعدّل على طول»: الكميةُ حقلٌ يُعدَّل في مكانه */
          return [esc(itemName(c)), '<input type="number" min="0" inputmode="numeric" value="' + esc(SOL_LINES[c]) + '" data-pkqty="' + esc(c) + '" style="width:88px" aria-label="' + esc(t('الكمية') + ' \u2014 ' + itemName(c)) + '">',
                  btn('\u2715','btn-quiet btn-sm',' data-pkrm="' + esc(c) + '" aria-label="' + esc(t('حذف')) + '"')];
        }))
      : '<p class="hint" style="margin:6px 0 0">' + esc(t('لا أسطرَ بعد — ابحث عن القطعة وأضفها بكمّيتها، أو طبّق نمطًا جاهزًا.')) + '</p>');
}
function pkAdd(){
  var sel = document.getElementById('pkItem'), q = document.getElementById('pkQty');
  var code = sel && sel.value, qty = cfgN(q && q.value);
  if (!code){ toast(t('اختر قطعةً من القائمة')); return; }
  if (!(qty > 0)){ toast(t('اكتب كمّيةً أكبرَ من صفر')); return; }
  SOL_LINES[code] = cfgN(SOL_LINES[code]) + qty;
  render(1);
}

/* ── التدقيق الهندسي — الاعتماد يحوّل الحالة ── */
/* ── حلُّ التركيب: الأجهزةُ المقترحة قبل طلب التركيب ── */

function solGo(site){
  site = site || (document.getElementById('solSite') || {}).value;
  if (!site){ toast(t('لا نقطةَ مختارة')); return false; }
  var itemsMap = {};
  Object.keys(SOL_LINES).forEach(function(c){ if (cfgN(SOL_LINES[c]) > 0) itemsMap[c] = cfgN(SOL_LINES[c]); });
  if (!Object.keys(itemsMap).length){ toast(t('أضِف قطعةً واحدةً على الأقل')); return false; }
  var before = solutionOf(site);
  solutionSave(site, itemsMap);
  var after = solutionOf(site);
  if (after && after !== before){ SOL_LINES = {}; SOL_Q = ''; return true; }
  return !!(after && after.at !== (before && before.at));
}


function apprIns(id, ok){
  if (!may('approve')){ toast(t('اعتمادُ التركيب للمهندس وحده')); return; }
  var r = STATE.inss[id];
  if (!r) return;
  if (ok){
    r.approved = true; r.apprBy = STATE.meta.name || ''; r.apprAt = Date.now();
    var s = siteFind(id);
    if (s) s.fstat = 'مُركّب';
    logEvent('اعتماد تركيب — ' + id + ' · ' + nm(r.pts || 0) + ' نقطة', id);
    notifPush('اعتماد', 'اعتُمد تركيبُك — ' + nm(r.pts || 0) + ' نقطة',
              { to:r.by || '', site:id, lv:'مهم' });
    /* (V38.56) the install task closes with the approval — as the visit, dismantling and maintenance tasks do; it stayed
       «مطلوب» in the installer's «مهامي» forever and kept the site marked as already assigned */
    var tkI = taskKindOf(id, 'install');
    if (tkI){ tkI.status = 'معتمد'; tkI.doneAt = Date.now(); CORE.set('tasks', tkI.id, tkI); tasksTouched(); }
  } else {
    r.status = 'مُعاد'; r.approved = false; r.why = 'أُعيد للتصحيح';
    logEvent('ردّ تركيب — ' + id, id);
    /* الردُّ يوقف العملَ حتى يُصحَّح — فهو عاجلٌ لا يُترَك للسجل */
    notifPush('ردّ', 'رُدَّ تركيبُك للتصحيح — راجع النقطة', { to:r.by || '', site:id, lv:'عاجل' });
  }
  CORE.set('inss', id, r);
  toast(ok ? t('اعتُمد') : t('رُدّ للمنفِّذ'));
  render();
}

/* ═══ ثلاثةٌ نقصت عن العامل ═══
   المسافةُ من موقعك، وأداةُ فحص الأجهزة، وإشعارُ واتساب. */

/* ── المسافة: الأقربُ أولًا في قائمة المواقع ── */
var MYPOS = null, POS_WATCH = 0;

function posWatch(){
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  try{
    POS_WATCH = navigator.geolocation.watchPosition(function(p){
      MYPOS = { lat:p.coords.latitude, lng:p.coords.longitude, at:Date.now() };
      if (CUR === 'sites') render(1);
    }, function(e){
      /* الرفضُ أو التعذُّرُ صامتًا يجعل الزرَّ يبدو معطوبًا وهو يعمل */
      softErr('تحديد الموقع', e,
        (e && e.code === 1) ? 'مُنع تحديدُ الموقع — اسمح به من إعدادات المتصفّح'
                            : 'تعذّر تحديدُ الموقع — جرّب في مكانٍ مكشوف');
    }, { enableHighAccuracy:false, maximumAge:60000, timeout:15000 });
  }catch(e){}
}

/* هافرساين مبسّط — نصفُ قطر الأرض بالكيلومترات */
function distKm(a, b){
  if (!a || !b) return null;
  var R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  var s = Math.sin(dLat/2) * Math.sin(dLat/2)
        + Math.cos(a.lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180)
        * Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
}

function distTxt(x){
  var k = distKm(MYPOS, x);
  if (k == null) return '';
  return k < 1 ? (nm(Math.round(k * 1000)) + ' م') : (nm(Math.round(k * 10) / 10) + ' كم');
}

/* ── أداة الفحص: تُشغَّل من جهاز المكتب على شبكة الميدان ── */
var PROBE = { on:false, done:0, up:0, down:0, log:[], t:0 };

function probeIp(site){
  var ins = STATE.inss[site.id] || {};
  var p = String(ins.prefix || '').trim();
  return p ? (p + '.1') : '';
}

function probeOne(ip){
  /* لا ping في المتصفح — تُطلَب صورةٌ وهميةٌ ويُقاس أيُّهما أسرع: الردُّ أم المهلة */
  return new Promise(function(res){
    if (typeof Image === 'undefined'){ res(false); return; }
    var done = false, img = new Image();
    var t = setTimeout(function(){ if (!done){ done = true; img.src = ''; res(false); } }, 2500);
    img.onload = img.onerror = function(){
      if (done) return;
      done = true; clearTimeout(t);
      /* حتى الخطأ دليلُ حياة: المنفذُ ردّ. الصمتُ وحده موت. */
      res(true);
    };
    try{ img.src = 'http://' + ip + '/favicon.ico?t=' + Date.now(); }
    catch(e){ clearTimeout(t); res(false); }
  });
}

function probeRun(){
  if (PROBE.on) { PROBE.on = false; render(1); return; }
  var targets = STATE.sites
    .map(function(s){ return { s:s, ip:probeIp(s) }; })
    .filter(function(x){ return x.ip; });
  if (!targets.length){ toast(t('لا عناوين مسجّلة — أدخل بادئة الشبكة عند التركيب')); return; }

  PROBE.on = true; PROBE.done = 0; PROBE.up = 0; PROBE.down = 0; PROBE.log = [];
  PROBE.t = Date.now();
  render(1);

  var i = 0;
  function step(){
    if (!PROBE.on || i >= targets.length){
      PROBE.on = false;
      logEvent('فحص الأجهزة — ' + nm(PROBE.up) + ' حيّ · ' + nm(PROBE.down) + ' صامت');
      render(1);
      return;
    }
    var batch = targets.slice(i, i + 6);
    i += 6;
    Promise.all(batch.map(function(x){
      return probeOne(x.ip).then(function(alive){
        PROBE.done++;
        if (alive) PROBE.up++; else PROBE.down++;
        STATE.hb = STATE.hb || {};
        STATE.hb[x.s.id] = { ip:x.ip, alive:alive, at:Date.now() };
        if (PROBE.log.length < 60)
          PROBE.log.unshift({ id:x.s.id, ip:x.ip, alive:alive });
      });
    })).then(function(){
      if (PROBE.done % 24 === 0) render(1);
      setTimeout(step, 60);
    });
  }
  step();
}


/* ═══ سجلُّ النقطة — كلُّ ما جرى لها من أوّل يوم (V17.20) ═══
   السؤالُ المتكرّر: من زار هذه النقطة؟ ومن رفع صورَها؟ ومن اعتمدها ومتى؟
   والجوابُ كان متفرّقًا: الزيارةُ في وثيقتها، والتركيبُ في وثيقته، والصورُ
   في مجموعتها، والاعتماداتُ ختومٌ داخل الزيارة، والأحداثُ نصٌّ حرّ. فيُجمَع
   هنا من مصادره كلِّها في خطٍّ زمنيٍّ واحد: ماذا جرى · بيد من · متى · وما
   يُثبته (صورةٌ أو ملفٌّ أو ختم). */
function siteLog(id){
  var out = [], push = function(at, what, who, kind, extra){
    if (!at && !who) return;
    out.push({ at:+at || 0, what:what, who:who || '', kind:kind || '', extra:extra || null });
  };
  var r = (STATE.recs || {})[id], ins = (STATE.inss || {})[id], ds = (STATE.diss || {})[id];
  if (r){
    push(r.at, 'الزيارة الميدانية' + (r.access && r.access !== 'تم الوصول' ? ' — ' + t('تعذّر الوصول') : ''), r.by, 'visit');
    if (r.revisitAt) push(r.revisitAt, 'رُدّت لزيارةٍ أخرى' + (r.revisitNote ? ' — ' + r.revisitNote : ''), r.revisitBy, 'back');
    if (r.apprAt || r.review === 'approved') push(r.apprAt || r.at, 'الاعتماد التقني', r.apprBy || r.by, 'ok');
    if (r.minAt) push(r.minAt, minState(r) === 'returned' ? ('أعادتها الوزارة' + (r.minNote ? ' — ' + r.minNote : '')) : 'اعتماد الوزارة', r.minBy, minState(r) === 'returned' ? 'back' : 'ok');
    if (r.briefAt) push(r.briefAt, 'تفاصيل مختصرة' + (r.bst ? ' — ' + t(r.bst) : '') + (r.brief ? ': ' + r.brief : ''), r.briefBy, 'note');
  }
  if (ins) push(ins.at, 'التركيب' + (ins.status ? ' — ' + t(ins.status) : '') + (ins.note ? ': ' + ins.note : ''), ins.by, 'ins');
  if (ds)  push(ds.at, 'الفكّ' + (ds.note ? ' — ' + ds.note : ''), ds.by, 'dis');
  /* صورٌ أُخذت ولم تصل: الزيارةُ تقول كم أخذ الفنيُّ، والسجلُّ يقول كم وصل */
  if (r && r.phN){
    var got = (typeof photosOf === 'function' ? photosOf(id) : []).filter(function(p){ return !(p[1] || {}).del; }).length;
    if (got < r.phN) push(r.at + 1, t('أُخذت') + ' ' + nm(r.phN) + ' ' + t('صور') + ' — ' + t('وصل') + ' ' + nm(got) + ' — ' + t('والباقي في طابور جهاز الفنيّ أو تعذّر رفعُه'), 'back');
  }
  /* الصورُ: من رفعها ومتى — ولكلِّ صورةٍ إثباتُها */
  (typeof photosOf === 'function' ? photosOf(id) : []).forEach(function(p){
    var ph = p[1] || {};
    push(ph.at, 'صورة' + (ph.kind ? ' — ' + t(ph.kind) : '') + (ph.del ? ' (' + t('محذوفة') + ')' : ''), ph.by, 'photo', p[0]);
  });
  /* المهامُّ المسنَدةُ على النقطة */
  Object.keys(STATE.tasks || {}).forEach(function(k){
    var x = STATE.tasks[k];
    if (x && x.site === id) push(x.at, 'إسناد ' + t(kindLabel(x.kind) || '') + (x.to ? ' — ' + x.to : ''), x.by, 'task');
  });
  /* الأحداثُ: ما حمل نقطتَه، وما ذكرها في نصِّه (للقديم قبل الوسم) */
  var EV = (STATE.evlog && Object.keys(STATE.evlog).length) ? Object.keys(STATE.evlog).map(function(k){ return STATE.evlog[k]; })
          : (STATE.events || []);
  EV.forEach(function(e){
    if (!e) return;
    if (e.site === id || (e.what && String(e.what).indexOf(id) > -1)) push(e.ts, e.what, e.by, 'ev');
  });
  (SITE_LOG_MORE[id] || []).forEach(function(e){ push(e.ts, e.what, e.by, 'ev'); });
  out.sort(function(a, b){ return b.at - a.at; });
  /* لا يتكرّر السطرُ نفسُه من مصدرين */
  var seen = {}, uniq = [];
  out.forEach(function(x){
    var k = x.at + '|' + x.what + '|' + x.who;
    if (!seen[k]){ seen[k] = 1; uniq.push(x); }
  });
  return uniq;
}
/* أحداثٌ تُجلَب من القاعدة عند الطلب — بسقفٍ، ولا تُقرأ إلا لمن فتح السجل */
var SITE_LOG_MORE = {}, SITE_LOG_BUSY = '';
function siteLogFetch(id){
  if (!FB.ready || !FB.db || SITE_LOG_MORE[id] || SITE_LOG_BUSY === id) return;
  SITE_LOG_BUSY = id;
  DB.col('events').where('site', '==', id).limit(200).get().then(function(sn){
    var L = []; sn.forEach(function(dd){ L.push(dd.data()); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    SITE_LOG_MORE[id] = L; SITE_LOG_BUSY = ''; render(1);
  }).catch(function(e){ SITE_LOG_MORE[id] = []; SITE_LOG_BUSY = ''; softErr('سجل النقطة', e, ''); });
}
var LOG_KIND = { visit:'\u{1F4CD}', ins:'\u{1F527}', dis:'\u{1F9E9}', photo:'\u{1F4F7}', ok:'\u2705',
                 back:'\u21A9', note:'\u{1F5E8}', task:'\u{1F4CB}', ev:'\u2022' };
function siteLogHtml(id){
  var L = siteLog(id);
  return card(t('سجلُّ النقطة') + ' — ' + nm(L.length),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('كلُّ ما جرى لهذه النقطة من أوّل يوم: من زارها ومن رفع صورَها ومن اعتمدها — بالتاريخ.')) + '</p>'
    + (L.length
        ? '<div class="wt-log">' + L.map(function(x){
            return '<div class="wt-le">'
              + '<span class="hint num" style="margin:0">' + esc(x.at ? fmtDT(x.at) : '—') + '</span> '
              + (LOG_KIND[x.kind] || '\u2022') + ' ' + esc(t(x.what))
              + (x.who ? ' <b>' + esc(dispName(x.who)) + '</b>' : '')
              + (x.kind === 'photo' && x.extra ? ' <a href="#" data-phview="' + esc(x.extra) + '">' + esc(t('الصورة')) + '</a>' : '')
              + '</div>';
          }).join('') + '</div>'
        : '<p class="hint" style="margin:0">' + esc(t('لا سجلَّ بعد لهذه النقطة.')) + '</p>'),
    btn('\u{1F5C3} ' + t('اجلب القديم من القاعدة'),'btn-quiet btn-sm',' data-sitelog="' + esc(id) + '"'));
}

/* ═══ جولةُ البداية (V17.0) ═══
   من يفتح النظامَ أوّلَ مرةٍ يرى ستَّ مجموعاتٍ وستًّا وعشرين شاشةً فلا يعرف
   من أين يبدأ، فيسأل جارَه أو يترك. والمساعدُ القائمُ يجيب من سأل — ومن لا
   يعرف ماذا يسأل لا يسأل. فصارت جولةٌ تفتح نفسَها أوّلَ دخولٍ لكلِّ حسابٍ
   جديد: خطوةٌ لكلِّ شاشةٍ **من شاشاته هو** — لا شاشاتِ غيره — بترتيب يومه،
   فيها ما تفعله الشاشةُ بكلمةٍ واحدة، ويُضاء بندُها في القائمة وهو يقرأ،
   وزرٌّ يأخذه إليها. وتُفتَح بعدها متى شاء من زرِّ القبّعة في الشريط. */
var TOUR = { open:false, i:0, skip:null, prime:null };   /* (V32.3) جولةُ البداية تملك حالتَها (كانت TOUR.open/TOUR.i/TOUR.skip/TOUR.prime) */
/* صفحاتٌ تُفتَح من غيرها لا من القائمة — لا تصلح خطوةً في جولة */
TOUR.skip = { site:1, sel:1, svappr:1, minappr:1 };
/* أوّلُ ما يُفتَح في اليوم — إن كان من شاشات صاحب الحساب */
TOUR.prime = ['map', 'mywork', 'wtask', 'over', 'perf', 'ipc', 'users', 'sys'];
function tourPages(){
  var r = effRole(ROLE), nav = (ROLES[r] || {}).nav;
  var vis = (nav === '*') ? Object.keys(PAGE).filter(function(k){ return seesRaw(k); })
                          : (nav || []).filter(function(k){ return PAGE[k] && seesRaw(k); });
  vis = vis.filter(function(k){ return !TOUR.skip[k]; });
  var head = TOUR.prime.filter(function(p){ return vis.indexOf(p) > -1; });
  var rest = vis.filter(function(p){ return head.indexOf(p) < 0; });
  return head.concat(rest).slice(0, 8);
}
function tourStart(){ TOUR.i = 0; TOUR.open = true; render(1); }
function tourEnd(said){
  /* من أغلقها بالزاوية أو بالخلفية فقد رآها — وكانت تُفتَح له مع كلِّ إقلاعٍ
     لأن الختمَ لا يُكتَب إلا بزرِّ «لا تعرضها ثانيةً»، فتصير الجولةُ إزعاجًا
     يوميًّا لا ترحيبًا بأوّل مرة (V17.1). تُختَم بأيِّ إغلاق، ويفتحها 🎓. */
  TOUR.open = false;
  try { lsSet('nsk14.tour', myUid() || '1'); } catch (e){ LS_ERR = e; }
  render(1);
}
function tourMaybe(){
  try { if (lsGet('nsk14.tour') === (myUid() || '1')) return; } catch (e){ return; }
  if (!tourPages().length) return;
  TOUR.i = 0; TOUR.open = true;
}
/* يُضاء بندُ الشاشة في القائمة مع خطوتها — فيُعرَف مكانُها لا اسمُها فقط */
function tourSpot(){
  try {
    /* (V31.8) قياسُ الإقلاع على جوالٍ مُبطّأ: هذه الدالةُ أكلت ١٫٨ ثانية في أول دخول — كانت تمسح وتُمرّر في كلِّ رسمة، والتمريرُ
       (scrollIntoView) يفرض تخطيطَ الصفحة كلِّها. صارت لا تفعل شيئًا إن لم يتغيّر البندُ المضاء وما زال مُضاءً */
    var P0 = TOUR.open ? tourPages() : [], id0 = P0.length ? P0[Math.min(TOUR.i, P0.length - 1)] : '', lit = document.querySelector('.tour-spot');
    if (tourSpot.k === id0 && (id0 ? !!lit : !lit)) return;
    tourSpot.k = id0;
    var old = document.querySelectorAll('.tour-spot');
    for (var i = 0; i < old.length; i++) old[i].classList.remove('tour-spot');
    if (!TOUR.open) return;
    var P = tourPages(); if (!P.length) return;
    var id = P[Math.min(TOUR.i, P.length - 1)];
    var el = document.querySelector('.nav a[data-p="' + id + '"], [data-p="' + id + '"]');
    if (el){
      el.classList.add('tour-spot');
      var sec = el.closest('.nav-section');
      if (sec && sec.getAttribute('data-open') === 'false'){ sec.setAttribute('data-open', 'true'); OPEN[sec.getAttribute('data-g')] = true; }
      if (el.scrollIntoView) setTimeout(function(){ try { if (el.isConnected) el.scrollIntoView({ block:'nearest' }); } catch (e2){ LS_ERR = e2; } }, 900);   /* (V31.8) التمريرُ بعد ظهور الواجهة لا قبلها — يفرض تخطيطَ الصفحة كلِّها */
    }
  } catch (e){ LS_ERR = e; }
}
function tourHtml(){
  if (!TOUR.open) return '';
  var P = tourPages(); if (!P.length){ TOUR.open = false; return ''; }
  if (TOUR.i >= P.length) TOUR.i = P.length - 1;
  var id = P[TOUR.i], pg = PAGE[id] || {}, last = TOUR.i === P.length - 1;
  return '<div class="wt-back" data-tourclose="0"></div>'
    + '<div class="pop wt-sheet" id="tourSheet" role="dialog" aria-label="' + esc(t('جولة البداية')) + '">'
    + '<div class="pop-head"><div style="min-width:0">'
    +   '<div class="pid hint" style="margin:0">\u{1F393} ' + esc(t('جولة البداية')) + ' \u00b7 <span class="num">' + nm(TOUR.i + 1) + ' ' + esc(t('من')) + ' ' + nm(P.length) + '</span></div>'
    +   '<h3 style="margin-top:3px">' + esc(t(pg.t || id)) + '</h3></div>'
    +   '<button type="button" class="btn btn-quiet btn-sm pop-x" data-tourclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">'
    +   '<div class="hint" style="margin:0 0 6px">' + esc(t('مكانها')) + ': <b>' + esc(t(pg.m || '')) + '</b> \u2190 ' + esc(t(pg.t || '')) + '</div>'
    +   '<p style="margin:0 0 10px;font-size:14px;line-height:1.7">' + esc(t(pg.l || t('شاشةٌ من شاشاتك — افتحها لترى ما فيها.'))) + '</p>'
    +   (TOUR.i === 0
        ? '<div class="alert info" style="margin:0 0 10px"><span>' + esc(t('هذه شاشاتُك أنت — لكلِّ دورٍ شاشاتُه. البندُ المضيءُ في القائمة هو مكانُ هذه الشاشة.')) + '</span></div>'
        : '')
    +   (last
        ? '<div class="alert ok" style="margin:0 0 10px"><span>' + esc(t('وبقيّةُ الشاشات في القائمة — والمساعدُ 🧭 يجيبك إن سألتَه بكلماتك، وزرُّ 🛠 يبلّغ عن أيِّ عطل.')) + '</span></div>'
        : '')
    +   '<div class="actions" style="margin:0">'
    +     btn('\u2190 ' + t('افتح هذه الشاشة'),'btn-primary btn-sm',' data-tourgo="' + esc(id) + '"')
    +     btn('\u2039 ' + t('السابق'),'btn-quiet btn-sm',' data-tourprev="1"' + (TOUR.i ? '' : ' disabled'))
    +     btn(last ? '\u2714 ' + t('تمّت الجولة') : t('التالي') + ' \u203A', last ? 'btn-secondary btn-sm' : 'btn-secondary btn-sm', ' data-tournext="1"')
    +   '</div>'
    +   '<p class="hint" style="margin:10px 0 0"><button type="button" class="btn btn-quiet btn-sm" data-tourstop="1">' + esc(t('لا تعرضها ثانيةً')) + '</button></p>'
    + '</div></div>';
}

