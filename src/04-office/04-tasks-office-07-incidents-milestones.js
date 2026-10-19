/* ============================================================================
   FILE    : src/04-office/04-tasks-office-07-incidents-milestones.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Incidents (correct/delete) and milestones managed, not just read.
   DEFINES : hseRecount, hseSet, hseDel, ncrAdd, ncrClose, ipcAdd, ipcStep, mileDates, mileOv, mileList, mileUpsert, mileAdd, mileRemove, mileDateOf … (+3 more)
   GLOBALS : NCRS, IPCS, MILES, MILE_EDIT, RACI_ACTS, LESSONS
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الحادثُ يُصحَّح ويُحذَف ═══
   كان الحادثُ يُسجَّل ولا يُمَسّ: من كتب «يومين مفقودين» وتبيّن أنها ثلاثةٌ
   لم يجد أين يصحّح، ومن سجّل حادثًا بالخطأ أبقاه في سجلٍّ يُعرَض على
   الوزارة. والأيامُ المفقودةُ تدخل مؤشِّراتِ السلامة — فخطأٌ فيها خطأٌ في
   الرقم المعلَن. صار يُعدَّل ويُحذَف، ويُعاد حسابُ المجموع من السجل نفسِه
   لا من عدّادٍ يُزاد ويُنسى. */
function hseRecount(){
  HSE.lost = HSE.incidents.reduce(function(a, x){ return a + cfgN(x.lost); }, 0);
}
function hseSet(i, patch){
  if (!may('approve')){ toast(t('تصحيحُ سجل الحوادث للمهندس وحده')); return; }
  var x = HSE.incidents[i];
  if (!x) return;
  Object.keys(patch).forEach(function(k){ x[k] = patch[k]; });
  x.editBy = STATE.meta.name || '';
  x.editAt = Date.now();
  hseRecount();
  CORE.dirty('hse', 'INC-' + (HSE.incidents.length - i), x);
  logEvent('تعديل حادث — ' + x.kind + ' \u00b7 ' + Object.keys(patch).join('،'));
}
function hseDel(i){
  if (!may('approve')){ toast(t('حذفُ الحادث للمهندس وحده')); return; }
  var x = HSE.incidents[i];
  if (!x) return;
  HSE.incidents.splice(i, 1);
  hseRecount();
  CORE.dirty('hse', 'INC-' + (HSE.incidents.length - i + 1), null);
  logEvent('حذف حادث — ' + x.kind + ' \u00b7 ' + (x.site || ''));
  toast(t('حُذف الحادث'));
  render(1);
}

/* ── عدم المطابقة NCR ── */
var NCRS = [];


function ncrAdd(){
  if (!may('edit')){ toast(t('فتحُ البلاغ يحتاج صلاحية تعديل')); return; }
  var site = (document.getElementById('ncrSite') || {}).value || '';
  var cat  = (document.getElementById('ncrCat') || {}).value || '';
  var sev  = (document.getElementById('ncrSev') || {}).value || '';
  var why  = (document.getElementById('ncrWhy') || {}).value || '';
  if (!why.trim()){ toast(t('اكتب الوصف')); return; }
  NCRS.push({ site:site, cat:cat, sev:sev, why:why, st:'مفتوح',
              by:STATE.meta.name || '', at:Date.now() });
  CORE.dirty('ncr', 'NCR-' + NCRS.length, NCRS[NCRS.length-1]);
  logEvent('بلاغ عدم مطابقة — ' + cat + (site ? ' · ' + site : ''), site);
  toast(t('فُتح البلاغ'));
  render(1);
}

function ncrClose(i){
  if (!may('approve')){ toast(t('إغلاقُ البلاغ للمهندس وحده')); return; }
  var x = NCRS[i];
  if (!x) return;
  x.st = 'مغلق'; x.closeBy = STATE.meta.name || ''; x.closeAt = Date.now();
  CORE.dirty('ncr', 'NCR-' + (i+1), x);
  logEvent('إغلاق بلاغ — ' + x.cat);
  toast(t('أُغلق'));
  render(1);
}

/* ── المستخلصات IPC ── */
var IPCS = [];

PAGE.ipc = { m:'القسم المالي', t:'الشؤون المالية',
  l:'المستخلصاتُ ودفترُ المشتريات والميزانيةُ واعتمادُها.',
  body:function(){
    var head = tabHead('ipc'), cur = tabCur('ipc');
    if (cur === 'budget') return head + (function(){
    var B = { cap:cfgGet('budCap'), appAbove:cfgGet('budApp'), spent:buysSpent(), pending:0 };
    return '<p class="lede" style="margin:0 0 16px">' + esc(t('الميزانية سقفٌ يُقاس عليه المنصرف، وحدُّ الاعتماد مبلغٌ فوقه يلزم اعتماد المهندس قبل أن تدخل العملية المنصرفَ المعتمد. صفرٌ في أيٍّ منهما يعني بلا سقفٍ وبلا اعتماد.')) + '</p>'
      + (may('settings') ? card('الضبط',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('الميزانية المعتمدة')) + ' (' + t('ريال') + ')</label>'
          +   cfgInput('budCap') + '</div>'
          + '<div class="field"><label>' + esc(t('حدّ الاعتماد للعملية الواحدة')) + ' (' + t('ريال') + ')</label>'
          +   cfgInput('budApp') + '</div>'
          + '</div>', btn('حفظ','btn-primary btn-sm',' data-cfgok="1"')) : '')
      + stats([['المنصرف المعتمد', N(B.spent)], ['من', N(B.cap), 'acc'],
               ['المتبقي', N(B.cap - B.spent), 'ok'], ['بانتظار الاعتماد', N(B.pending)]])
      + card('', meter('المستهلك من السقف المعتمد', B.spent, B.cap))
      + (trialsTotal()
          ? '<p class="hint" style="margin:6px 0 0">\u{1F9EA} ' + esc(t('مصروفُ التجارب')) + ': <b class="num">' + nm(trialsTotal()) + '</b> '
            + esc(t('ريال')) + ' \u00b7 ' + esc(t(trialInCost() ? 'داخلٌ في المنصرف أعلاه' : 'خارجٌ عن المنصرف أعلاه — يُغيَّر من تبويب «التجارب»')) + '</p>'
          : '')
      + '<p class="hint">' + esc(t('تغييرُ السقف لا يمسّ عمليةً مسجّلة — الوزن يُثبَّت لحظةَ الحدث.')) + '</p>';
  })();
    if (cur === 'buys') return head + (function(){
    var L = buysList();
    var spent = L.filter(function(b){ return b.st === 'معتمد'; })
                 .reduce(function(a,b){ return a + (+b.amt || 0); }, 0);
    var pend  = L.filter(function(b){ return b.st !== 'معتمد'; })
                 .reduce(function(a,b){ return a + (+b.amt || 0); }, 0);
    var cap = cfgGet('budCap') || 0;
    return stats([['إجمالي المنصرف', N(spent)],
                  ['الميزانية', N(cap), 'acc'],
                  ['المتبقي', N(cap - spent), (cap - spent) < 0 ? 'bad' : 'ok'],
                  ['بانتظار الاعتماد', N(pend), pend ? 'wrn' : '']])
      + card('المنصرف من الميزانية', meter('المستهلك من السقف المعتمد', spent, cap))
      + (may('money')
        ? card('تسجيل عملية شراء',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('الصنف')) + '</label><input id="byItem" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('الفئة')) + '</label><select id="byCat">'
            +   catList().map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field"><label>' + esc(t('المورّد')) + '</label><select id="bySup">'
            +   supList().map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field"><label>' + esc(t('المبلغ')) + '</label>'
            +   '<input id="byAmt" type="number" min="1" step="1"></div>'
            + '<div class="field"><label>' + esc(t('المشعر')) + '</label><select id="byZone">'
            +   ['منى','عرفات','مزدلفة','—'].map(function(z){ return '<option value="' + esc(z) + '">' + esc(t(z)) + '</option>'; }).join('')
            + '</select></div>'
            /* لأيِّ تجربةٍ هذا الشراء — فيُعرَف مصروفُ كلِّ تجربةٍ على حدة */
            + (trialRows().length
                ? '<div class="field"><label>' + esc(t('لتجربة')) + '</label><select id="byTrial">'
                  + '<option value="">' + esc(t('— ليس لتجربة —')) + '</option>'
                  + trialRows().map(function(r){ return '<option value="' + esc(r.id) + '">' + esc(r.n) + '</option>'; }).join('')
                  + '</select></div>'
                : '')
            + '<div class="field"><label>' + esc(t('صورة الفاتورة')) + '</label>'   /* (V37.43) طلبُ المالك: رفعُ صورة الفاتورة — من الكاميرا أو المعرض */
            +   '<label class="btn btn-secondary" style="width:100%;justify-content:center;cursor:pointer">\u{1F9FE} ' + esc(t('صوّر الفاتورة أو اختر صورتها')) + '<input type="file" accept="image/*" data-buyphoto="1" style="display:none"></label>'
            +   '<div id="byPhPrev" class="hint" style="margin:4px 0 0">' + buyPhPrevHtml() + '</div></div>'
            + '</div>'
            + '<div class="actions">' + btn(BUY_ED ? '\u2714 ' + t('احفظ التعديل') : t('سجّل الشراء'),'btn-primary',' data-byadd="1"') + (BUY_ED ? btn(t('إلغاء التعديل'),'btn-quiet',' data-byedcancel="1"') : '') + '</div>'
            + '<p class="hint">' + esc(t('ما تجاوز حدَّ الاعتماد يُسجَّل «بانتظار الاعتماد» ولا يدخل المنصرف.')) + '</p>')
        : '')
      + cardFlush(t('العمليات') + ' — ' + nm(L.length),
          L.length
            ? table(['التاريخ','الصنف','الفئة','المشعر','المبلغ','المورّد','الحالة','الفاتورة',''],
                capList(L, 200).map(function(b){
                  return ['<span class="num">' + esc(dayKey(b.at)) + '</span>',
                          esc(b.item), esc(b.cat), esc(t(b.zone || '—')), N(b.amt), esc(b.sup),
                          pill(t(b.st), b.st === 'معتمد' ? 'ok' : 'wrn'),
                          buyInvCell(b),   /* (V37.43) */
                          buyMayEdit() ? btn('\u270E','btn-quiet btn-sm',' data-byedit="' + esc(b.id) + '" title="' + esc(t('تعديل')) + '"') + btn('\u2715','btn-quiet btn-sm',' data-bydel="' + esc(b.id) + '" title="' + esc(t('حذف')) + '"') : ''];   /* (V29.5) */
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا مشترياتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="buys"') : '');
  })();
    return head + (function(){
    var v = (typeof evm === 'function') ? evm() : null;
    var paid = IPCS.filter(function(x){ return x.st === 'مصروف'; })
                   .reduce(function(a,x){ return a + x.amt; }, 0);
    var pend = IPCS.filter(function(x){ return x.st !== 'مصروف'; })
                   .reduce(function(a,x){ return a + x.amt; }, 0);
    var earned = v ? v.EV : 0;

    return stats([['المكتسَب حتى اليوم', N(earned), 'acc'],
                  ['قُدّم في مستخلصات', N(paid + pend)],
                  ['صُرف', N(paid), 'ok'],
                  ['لم يُصرف بعد', N(pend), pend ? 'wrn' : '']])

      + card('مستخلص جديد',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('الفترة')) + '</label>'
          + '<input id="ipcPer" placeholder="' + esc(t('مثال: الشهر الأول')) + '"></div>'
          + '<div class="field"><label>' + esc(t('المبلغ')) + '</label>'
          + '<input type="number" id="ipcAmt" min="0" value="'
          + Math.max(0, Math.round(earned - paid - pend)) + '"></div>'
          + '<div class="field"><label>' + esc(t('الاستقطاع ٪')) + '</label>'
          + '<input type="number" id="ipcRet" min="0" max="20" value="5"></div>'
          + '</div>'
          + '<p class="hint" style="margin:0">' + esc(t('المبلغُ المقترحُ هو المكتسَبُ ناقصَ ما قُدّم — فلا يُطالَب بما طُولب به.')) + '</p>',
          btn('📄 أنشئ المستخلص','btn-primary',' data-ipcadd="1"'))

      + (IPCS.length
        ? cardFlush('المستخلصات',
            table(['#','الفترة','المبلغ','استقطاع','الصافي','الحالة',''],
              IPCS.map(function(x, i){
                var ret = Math.round(x.amt * x.retPct / 100);
                return ['<span class="num">IPC-' + nm(i+1) + '</span>', esc(x.period),
                        N(x.amt), N(ret), '<b>' + nm(x.amt - ret) + '</b>',
                        pill(x.st, x.st==='مصروف'?'ok':(x.st==='معتمد'?'acc':'warn')),
                        '<div class="actions">'
                        + (x.st === 'مقدَّم' ? btn('اعتمد','btn-quiet btn-sm',' data-ipcok="' + i + '"') : '')
                        + (x.st === 'معتمد' ? btn('صُرف','btn-quiet btn-sm',' data-ipcpay="' + i + '"') : '')
                        + '</div>'];
              }),
              ['','<b>' + t('الإجمالي') + '</b>',
               N(IPCS.reduce(function(a,x){ if (x.st === 'ملغى') return a; return a + x.amt; }, 0)),
               N(IPCS.reduce(function(a,x){ if (x.st === 'ملغى') return a; return a + Math.round(x.amt*x.retPct/100); }, 0)),
               '<b>' + nm(IPCS.reduce(function(a,x){ if (x.st === 'ملغى') return a; return a + x.amt - Math.round(x.amt*x.retPct/100); }, 0)) + '</b>',
               '','']),
            btn('⬇ إكسل — المستخلصات','btn-secondary btn-sm',' data-xls="ipc"'))
        : card('', alertBox('info','لا مستخلصاتٍ بعد — يُبنى المستخلصُ على المكتسَب المعتمَد.')))

      + card('دورة المستخلص',
          flow(['يُبنى من المكتسَب','يُقدَّم','يُعتمَد','يُصرَف'], 0)
          + '<p class="hint">' + esc(t('الاستقطاعُ يُحتجَز حتى انتهاء الضمان ثم يُفرَج عنه.')) + '</p>');
  })();
  }};

function ipcAdd(){
  var per = (document.getElementById('ipcPer') || {}).value || ('الفترة ' + (IPCS.length + 1));
  var amt = cfgN((document.getElementById('ipcAmt') || {}).value);
  var ret = cfgN((document.getElementById('ipcRet') || {}).value);
  if (amt <= 0){ toast(t('المبلغ صفرٌ أو سالب')); return; }
  IPCS.push({ period:per, amt:amt, retPct:ret, st:'مقدَّم',
              by:STATE.meta.name || '', at:Date.now() });
  CORE.dirty('ipc', 'IPC-' + IPCS.length, IPCS[IPCS.length-1]);
  logEvent('مستخلص — ' + per + ' · ' + nm(amt));
  toast(t('قُدّم المستخلص'));
  render(1);
}

function ipcStep(i, st){
  var x = IPCS[i];
  if (!x) return;
  x.st = st; x.stBy = STATE.meta.name || ''; x.stAt = Date.now();
  CORE.dirty('ipc', 'IPC-' + (i+1), x);
  logEvent('مستخلص ' + st + ' — ' + x.period);
  toast(t(st));
  render(1);
}

/* ── المعالم والتسليم ── */
var MILES = [
  { id:'M1', n:'اعتماد النطاق وخط الأساس', d:'', w:5,  dep:'' },
  { id:'M2', n:'إتمام مسح عرفات',          d:'', w:20, dep:'M1' },
  { id:'M3', n:'إتمام مسح منى',            d:'', w:25, dep:'M1' },
  { id:'M4', n:'إتمام التهيئة والتجميع',    d:'', w:10, dep:'M2' },
  { id:'M5', n:'إتمام تركيب عرفات',        d:'', w:15, dep:'M4' },
  { id:'M6', n:'إتمام تركيب منى',          d:'', w:20, dep:'M4' },
  { id:'M7', n:'التشغيل التجريبي',         d:'', w:3,  dep:'M6' },
  { id:'M8', n:'التسليم الابتدائي',        d:'', w:2,  dep:'M7' }
];

/* ═══ تواريخُ المعالم ═══
   كانت المعالمُ بلا تواريخَ — وزنٌ وتبعيةٌ ونسبةُ إنجازٍ ولا موعدَ يُقاس
   عليه التأخّر. صار لكلِّ معلَمٍ موعدٌ مستهدَف: يُشتقُّ آليًّا من موعدَي
   انتهاء المسح والتركيب بتوزيع الأوزان على المسار، ويُضبَط باليد ويُحفَظ
   في settings/miles — واليدُ تغلب الاشتقاق. ومنه يُعرَف المتأخّرُ: موعدٌ
   مضى والإنجازُ دون التمام. */
function mileDates(){
  if (!Array.isArray(STATE.mileDates)) STATE.mileDates = [];
  return STATE.mileDates;
}
/* ═══ المعالمُ تُدار لا تُقرأ فقط ═══
   كانت ثمانيةً مكتوبةً في الشيفرة لا تُزاد ولا تُعدَّل ولا تُحذَف — والموعدُ
   وحدَه باليد. صار السجلُّ نفسُه (settings/miles) يحمل لكلِّ معلَمٍ ما عُدِّل:
   اسمًا ووزنًا وتبعيةً وإنجازًا يدويًّا، وإخفاءً لمن أُلغي، ومعالمَ جديدةً
   بمعرِّفاتٍ خاصة. والمضمَّنةُ تبقى أساسًا يُحسَب إنجازُها من الميدان. */
function mileOv(id){ return mileDates().filter(function(x){ return x.id === id; })[0] || {}; }
function mileList(){
  var out = [];
  MILES.forEach(function(m){
    var o = mileOv(m.id); if (o.hidden) return;
    out.push({ id:m.id, n:o.n || m.n, w:(o.w != null ? +o.w : m.w), dep:(o.dep != null ? o.dep : m.dep), builtin:true });
  });
  mileDates().forEach(function(o){ if (o.custom && !o.hidden) out.push({ id:o.id, n:o.n || o.id, w:+o.w || 0, dep:o.dep || '', custom:true }); });
  return out;
}
function mileUpsert(id, patch){
  if (!may('settings')){ toast(t('المعالم للمهندس وحده')); return false; }
  var L = mileDates().slice(), cur = L.filter(function(x){ return x.id === id; })[0];
  if (!cur){ cur = { id:id }; L.push(cur); }
  Object.keys(patch).forEach(function(k){ if (patch[k] === undefined || patch[k] === '') delete cur[k]; else cur[k] = patch[k]; });
  STATE.mileDates = L; CORE.set('cfg', 'miles', L.slice()); CORE.saveSoon();
  logEvent('معلَم — ' + id + ' \u00b7 ' + Object.keys(patch).join(','), id);
  return true;
}
function mileAdd(name, w, d, dep){
  if (!may('settings')){ toast(t('المعالم للمهندس وحده')); return false; }
  name = String(name || '').trim(); if (!name){ toast(t('اسمُ المعلَم مطلوب')); return false; }
  var id = 'X' + Date.now().toString(36).slice(-5).toUpperCase();
  mileUpsert(id, { custom:true, n:name, w:+w || 0, d:d || '', dep:dep || '', prog:0 });
  toast(t('أُضيف المعلَم') + ' ' + name); MILE_EDIT = ''; render(1); return true;
}
function mileRemove(id){
  if (!may('settings')){ toast(t('المعالم للمهندس وحده')); return false; }
  var o = mileOv(id);
  if (o.custom){ STATE.mileDates = mileDates().filter(function(x){ return x.id !== id; }); CORE.set('cfg', 'miles', STATE.mileDates.slice()); CORE.saveSoon(); }
  else mileUpsert(id, { hidden:true });
  logEvent('حذفُ معلَم — ' + id, id); toast(t('حُذف المعلَم')); MILE_EDIT = ''; render(1); return true;
}
var MILE_EDIT = '', MILE_NEW = false;
function mileDateOf(m){
  var manual = mileDates().filter(function(x){ return x.id === m.id; })[0];
  if (manual && manual.d) return manual.d;
  var dS = cfgGet('dueSurvey'), dI = cfgGet('dueInstall');
  if (!dS && !dI) return '';
  /* المسحُ وما قبله يقيس على موعد المسح، والباقي على موعد التركيب */
  var isSv = /مسح|النطاق/.test(m.n);
  var end = isSv ? (dS || dI) : (dI || dS);
  var start = BASE ? BASE.at : (end - (cfgGet('phase') || 4) * 30 * 86400000);
  var chain = MILES.filter(function(x){ return isSv ? /مسح|النطاق/.test(x.n) : !/مسح|النطاق/.test(x.n); });
  var tot = chain.reduce(function(a, x){ return a + x.w; }, 0) || 1, cum = 0;
  for (var i = 0; i < chain.length; i++){ cum += chain[i].w; if (chain[i].id === m.id) break; }
  var s0 = isSv ? start : ((dS && dS < end) ? dS : start);
  return dayKey(s0 + (end - s0) * (cum / tot));
}
function mileDateSet(id, d){
  if (!may('settings')){ toast(t('مواعيدُ المعالم للمهندس وحده')); return; }
  var L = mileDates().filter(function(x){ return x.id !== id; });
  if (d) L.push({ id:id, d:d });
  STATE.mileDates = L;
  CORE.set('cfg', 'miles', L.slice());
  logEvent('موعد معلَم — ' + id + ' \u00b7 ' + (d || 'أُعيد إلى الاشتقاق'), id);
}
function mileLate(m){
  var d = mileDateOf(m);
  return !!(d && d < dayKey(Date.now()) && mileDone(m) < 0.999);
}
function mileDone(m){
  /* إنجازٌ يدويٌّ كُتب من المكتب يغلب الاشتقاق — وللمعالم الجديدة لا مصدرَ غيرُه */
  var o = mileOv(m.id);
  if (o.prog != null && o.prog !== '') return Math.max(0, Math.min(1, (+o.prog || 0) / 100));
  if (m.custom || o.custom) return 0;
  var S = siteStats();
  var byZone = function(z, type){
    var tot = 0, done = 0;
    STATE.sites.forEach(function(x){
      if (x.zone !== z) return;
      tot++;
      if (type === 'survey' ? STATE.recs[x.id] : insDone(x.id)) done++;
    });
    return tot ? done / tot : 0;
  };
  switch (m.id){
    case 'M1': return BASE ? 1 : 0;
    case 'M2': return byZone('عرفات','survey');
    case 'M3': return byZone('منى','survey');
    case 'M4': return 0;
    case 'M5': return byZone('عرفات','install');
    case 'M6': return byZone('منى','install');
    case 'M7': case 'M8': return 0;
  }
  return 0;
}



/* ── RACI ── */
var RACI_ACTS = [
  ['اعتماد النطاق',            'مدير المشروع','الوزارة','المهندس','الجميع'],
  ['المسح الميداني',           'الفني','المشرف','—','المهندس'],
  ['اعتماد المسح',             'المهندس','مدير المشروع','—','المشرف'],
  ['شراء القطع',               'المشتريات','مدير المشروع','المالية','المخازن'],
  ['التهيئة والتجميع',         'فني الورشة','المهندس','—','العمليات'],
  ['التركيب',                  'فني التركيب','المشرف','المهندس','العمليات'],
  ['التدقيق والاعتماد',        'المهندس','مدير المشروع','الجودة','الفني'],
  ['بلاغ عدم المطابقة',        'الجودة','المهندس','—','المنفِّذ'],
  ['المستخلص',                 'المالية','مدير المشروع','الوزارة','الإدارة العليا'],
  ['التسليم الابتدائي',        'مدير المشروع','الوزارة','الهندسة والجودة','الجميع'],
  ['الفك وإرجاع العُهدة',      'فني الفك','المشرف','المخازن','المهندس']
];


/* ── سجل الدروس ── */
var LESSONS = [
  { p:'التخطيط', w:'قسمةُ التارجت على الأيام تُظهر الحاجةَ للفرق مبكرًا',
    a:'حُسبت الطواقمُ قبل بدء الموسم لا بعده' },
  { p:'التنفيذ', w:'الصورُ الخامُ تخنق الشبكةَ في المشاعر',
    a:'ضُغطت على الجهاز قبل الرفع' },
  { p:'التنفيذ', w:'الشبكةُ تنقطع فيضيع عملُ الفني',
    a:'حفظٌ محليٌّ أولًا وطابورُ رفعٍ يُستأنف' },
  { p:'الجودة', w:'احتسابُ النقاط قبل التدقيق يُغري بالتسرّع',
    a:'لا نقاطَ إلا بعد اعتماد المهندس' },
  { p:'التواصل', w:'الوصولُ للمخيمات يتعطّل بلا إشعارٍ مسبق',
    a:'رسالةٌ جاهزةٌ للشركة قبل الموعد' }
];


