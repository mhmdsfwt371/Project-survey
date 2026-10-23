/* ============================================================================
   FILE    : src/03zz-late/03-survey--03-survey-records-08-parts-history-onboarding.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03-survey/03-survey-records-08-parts-history-onboarding.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : patList, patSave, patDel, patApply, itemPickerHtml, pkAdd, solGo, apprIns, probeIp, probeOne, probeRun, siteLogFetch, tourStart, tourEnd
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
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
    if (typeof chSystem === 'function') chSystem(id, 'اعتمد المهندسُ التركيب — ' + nm(r.pts || 0) + ' ' + t('نقطة'), r.by || '');   /* (V38.60) */
    /* (V38.56) the install task closes with the approval — as the visit, dismantling and maintenance tasks do; it stayed
       «مطلوب» in the installer's «مهامي» forever and kept the site marked as already assigned */
    var tkI = taskKindOf(id, 'install');
    if (tkI){ tkI.status = 'معتمد'; tkI.doneAt = Date.now(); CORE.set('tasks', tkI.id, tkI); tasksTouched(); }
  } else {
    /* (V38.59) the reason travels with the return — the installer reads it in «مهامي» instead of guessing */
    var why = (typeof prompt === 'function') ? prompt(t('سببُ الردّ (يراه المنفِّذ)'), '') : '';
    if (why === null) return;
    r.status = 'مُعاد'; r.approved = false; r.why = String(why || '').trim() || 'أُعيد للتصحيح'; r.whyAt = Date.now();
    logEvent('ردّ تركيب — ' + id + (r.why ? ' · ' + r.why : ''), id);
    /* الردُّ يوقف العملَ حتى يُصحَّح — فهو عاجلٌ لا يُترَك للسجل */
    notifPush('ردّ', 'رُدَّ تركيبُك للتصحيح — ' + r.why, { to:r.by || '', site:id, lv:'عاجل' });
    if (typeof chSystem === 'function') chSystem(id, 'رُدَّ التركيبُ للتصحيح — ' + r.why, r.by || '');   /* (V38.60) */
  }
  CORE.set('inss', id, r);
  toast(ok ? t('اعتُمد') : t('رُدّ للمنفِّذ'));
  render();
}

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

function siteLogFetch(id){
  if (!FB.ready || !FB.db || SITE_LOG_MORE[id] || SITE_LOG_BUSY === id) return;
  SITE_LOG_BUSY = id;
  DB.col('events').where('site', '==', id).limit(200).get().then(function(sn){
    var L = []; sn.forEach(function(dd){ L.push(dd.data()); });
    FB.readCount = (FB.readCount || 0) + sn.size;
    SITE_LOG_MORE[id] = L; SITE_LOG_BUSY = ''; render(1);
  }).catch(function(e){ SITE_LOG_MORE[id] = []; SITE_LOG_BUSY = ''; softErr('سجل النقطة', e, ''); });
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
