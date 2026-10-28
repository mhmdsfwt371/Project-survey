/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-10-field-companies.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-10-field-companies.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : coDash, coBucketsAll, coBuckets, coPopRows, coPopHtml, coPopXls, coDashCard, siteCos, coPick
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* ═══ لوحةُ الشركات ═══
   القائمةُ وحدَها لا تُجيب: كم شركةً عندنا؟ وكم منها يخدم أكثرَ من مخيّم؟
   وكم في القائمة ولا مخيّمَ له؟ وكم بقي من الأسماء المركَّبة؟ فتُقرأ الأرقامُ
   أوّلًا ثم تُفتَح القائمة. والعدُّ بعد فكِّ المركَّبات — فيُحسَب المخيّمُ
   المشتركُ لكلِّ شركةٍ تخدمه لا لسطرٍ يحمل أسماءها ملتصقة. */
function coDash(){
  var byCo = {}, multi = 0, totalSites = 0;
  (STATE.sites || []).forEach(function(x){
    if (!x.co) return;
    totalSites++;
    coSplit(x.co).forEach(function(one){
      (byCo[one] = byCo[one] || { n:0, zones:{} }).n++;
      if (x.zone) byCo[one].zones[x.zone] = 1;
    });
  });
  var served = Object.keys(byCo);
  served.forEach(function(c){ if (byCo[c].n > 1) multi++; });
  var idle = CO_LIST.filter(function(c){ return !byCo[c]; }).length;
  var top = served.slice().sort(function(a, b){ return byCo[b].n - byCo[a].n; }).slice(0, 8);
  return { byCo:byCo, served:served.length, multi:multi, idle:idle,
           cmp:Object.keys(coCompounds()).length, top:top, sites:totalSites };
}

/* (V26.2) كانت تُحسَب لكلِّ شركةٍ بحلقةٍ على المواقع كلِّها (٤٢ شركة × ١٬٨٠٠ موقع في الرسمة) — صارت حلقةً واحدةً تُصفَّر مع الرسمة */
function coBucketsAll(){
  if (PV.CO_BK) return PV.CO_BK;
  var M = {};
  (STATE.sites || []).forEach(function(x){
    var co = x.co; if (!co) return;
    var out = M[co] || (M[co] = { all:[], sv:[], stuck:[], ins:[] });
    out.all.push(x);
    var r = STATE.recs[x.id];
    if (svVisited(r)) out.sv.push(x);   /* (V32.6) */
    else if (r && r.review !== 'revisit') out.stuck.push(x);
    var i2 = STATE.inss[x.id];
    if ((i2 && i2.status === 'مُركّب') || x.fstat === 'مُركّب') out.ins.push(x);
  });
  PV.CO_BK = M; return M;
}

function coBuckets(co){ return coBucketsAll()[co] || { all:[], sv:[], stuck:[], ins:[] }; }

function coPopRows(co, kind){
  var B = coBuckets(co), L = B[kind] || [];
  return L.map(function(x){
    var r = STATE.recs[x.id] || {}, i2 = STATE.inss[x.id] || {};
    var chal = (r.chals || []).filter(function(c){ return c !== 'لا توجد تحديات'; });
    return { x:x, r:r,
      why: kind === 'stuck' ? (r.reason || r.note || '—')
         : (chal.length ? chal.join(' \u00b7 ') : (r.note || '—')),
      who: r.by || '—', when: r.at ? dayKey(r.at) : '—',
      st: i2.status || x.fstat || (r.id ? svLabel(r) : 'لم يُزر') };
  });
}

function coPopHtml(){
  if (!PV.CO_POP) return '';
  var co = PV.CO_POP.co, kind = PV.CO_POP.kind, L = coPopRows(co, kind);
  var rows = L.map(function(o){
    var x = o.x;
    return ['<strong>' + esc(siteKey(x) !== x.id ? siteKey(x) : (x.name || x.id)) + '</strong><br><span class="num hint">' + esc(x.id) + '</span>',
            esc(x.sign || '—'),
            esc(t(x.zone || '—')) + (x.sq ? ' \u00b7 ' + esc(x.sq) : ''),
            esc(o.why.slice(0, 90)),
            esc(o.who) + '<br><span class="num hint">' + esc(o.when) + '</span>',
            pill(o.st, o.st === 'مُركّب' ? 'ok' : (o.st === 'متعذّر' ? 'bad' : 'wrn')),
            /* `data-cogo` محجوزةٌ منذ V14 لزرَّي «عرض» و«مسح التحديد» في مرشِّح
               الشركات على الخريطة — فمعالجُ النافذة الجديد كان يخطف ضغطتَهما
               ويفتح شاشةَ الاعتماد. اسمٌ خاصٌّ بها: `data-comap`. */
            (x.lat && x.lng ? btn('\u{1F5FA} ' + t('الخريطة'),'btn-quiet btn-sm',' data-comap="' + esc(x.id) + '"') : '')
            + btn('\u25C8 ' + t('التفاصيل'),'btn-quiet btn-sm',' data-copopsite="' + esc(x.id) + '"')];
  });
  return '<div id="coPopWrap" class="co-pop-wrap">'
    + '<div class="co-pop" role="dialog" aria-modal="true">'
    + '<div class="co-pop-head">'
    +   '<div><strong>' + esc(coName(co)) + '</strong>'
    +   '<div class="hint" style="margin:2px 0 0">' + esc(t(PV.CO_POP_LBL[kind] || '')) + ' \u00b7 ' + nm(L.length) + ' ' + esc(t('مخيّم')) + '</div></div>'
    +   '<div class="actions" style="margin:0">'
    +     btn('\u2B07 ' + t('إكسل'),'btn-secondary btn-sm',' data-copopxls="1"')
    +     btn('\u2715','btn-quiet btn-sm',' data-copopx="1" aria-label="' + esc(t('إغلاق')) + '"')
    +   '</div></div>'
    + '<div class="co-pop-body">'
    + (rows.length ? table(['المخيّم','الشاخص','الموقع', kind === 'stuck' ? 'سببُ التعذّر' : 'التحديات والملاحظات','مَن ومتى','الحالة',''], rows)
                   : '<p class="hint" style="padding:18px;text-align:center;margin:0">' + esc(t('لا مخيّماتٍ في هذه الخانة.')) + '</p>')
    + '</div></div></div>';
}

function coPopXls(){
  if (!PV.CO_POP) return;
  var L = coPopRows(PV.CO_POP.co, PV.CO_POP.kind);
  var out = [['المخيّم','المعرّف','الشاخص','المشعر','المربع','التحديات/السبب','مَن','متى','الحالة','خط العرض','خط الطول']];
  L.forEach(function(o){ var x = o.x;
    out.push([x.name || '', x.id, x.sign || '', x.zone || '', x.sq || '', o.why, o.who, o.when, o.st, x.lat || '', x.lng || '']); });
  xlsSheets([[t(PV.CO_POP_LBL[PV.CO_POP.kind] || 'مخيّمات'), out]], 'أفاقي — ' + coName(PV.CO_POP.co));
}

function coDashCard(){
  var D = coDash();
  return stats([['شركاتٌ في القائمة', N(CO_LIST.length), 'acc'],
                ['لها مخيّمات', N(D.served), D.served ? 'ok' : 'wrn'],
                ['على أكثرَ من مخيّم', N(D.multi), D.multi ? 'acc' : ''],
                ['في القائمة بلا مخيّم', N(D.idle), D.idle ? 'wrn' : 'ok'],
                ['أسماءٌ مركَّبةٌ لم تُوحَّد', N(D.cmp), D.cmp ? 'bad' : 'ok'],
                ['مواقعُ لها شركة', N(D.sites)]])
    + (D.top.length
      ? cardFlush('\u{1F3E2} ' + t('الأكثرُ مخيّمات'),
          table(['الشركة','مخيّماتها','مشاعرها'],
            D.top.map(function(c){
              var lb = coName(c);
              return [esc(lb.length > 44 ? lb.slice(0, 43) + '\u2026' : lb),
                      '<b class="num">' + nm(D.byCo[c].n) + '</b>',
                      esc(Object.keys(D.byCo[c].zones).map(function(z){ return t(z); }).join(' \u00b7 '))];
            })))
      : '');
}

/* شركاتُ نقطةٍ بعينها — واحدةٌ في الغالب، وقد تكون عدةً في المخيم المشترك */
function siteCos(x){ return coSplit(x && x.co); }

/* تُسنَد نقاطُ قيمةٍ مركَّبةٍ إلى واحدةٍ من أجزائها */
function coPick(raw, part){
  if (!may('settings')){ toast(t('توحيدُ الأسماء للمهندس وحده')); return 0; }
  var n = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.co !== raw) return;
    x.co = part; n++;
    CORE.set('sites', x.id, { co:part });
  });
  if (n){
    coFill(); statBump();
    logEvent('توحيد اسم مركَّب — ' + nm(n) + ' نقطة \u2190 ' + part);
    toast(nm(n) + ' ' + t('نقطةً صارت لـ') + ' ' + part);
    render(1);
  }
  return n;
}
