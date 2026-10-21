/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-03-trials-invoices.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : Trials with cost and hours, trial kits from the catalogue, trial points on camps, and invoice photos.
   DEFINES : trialKitHtml, trialsDoc, trialRows, trialOf, trialInCost, trialMay, trialSave, trialAdd, trialHoursAdd, trialSiteNorm, trialForSite, trialLinkSite, trialLinkExisting, trialRemove … (+31 more)
   GLOBALS : TRIAL_OUT, BUY_ED, BUY_PH
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

function trialAdd(){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var n = g('trN'); if (!n){ toast(t('اكتب اسمَ التجربة')); return; }
  var hrs = +g('trH') || 0;
  var rep = g('trRep');
  if (rep && !/^https?:\/\//i.test(rep)){ toast(t('رابطُ التقرير يبدأ بـ https')); return; }
  trialRows().unshift({ id:uid36(), n:n, date:g('trD') || dayKey(),
                        hours:hrs, note:g('trNote'), by:STATE.meta.name || '', at:Date.now(),
                        gw:g('trGw'), gwN:+g('trGwN') || 0, sn:g('trSn'), snN:+g('trSnN') || 0,
                        where:g('trWhere'), out:g('trOut') || 'جارية', report:rep });
  if (trialSave()){ logEvent('تجربة — ' + n + (hrs ? ' · ' + hrs + ' ساعة' : '')); toast(t('سُجّلت التجربة')); render(1); }
}
function trialHoursAdd(id, h){
  var r = trialOf(id); if (!r) return;
  r.hours = Math.max(0, (+r.hours || 0) + h);
  if (trialSave()){ toast(t('حُدّثت ساعاتُ التجربة')); render(1); }
}

function trialLinkSite(id, on){
  if (!trialMay()) return '';
  var x = siteFind(id), f = trialForSite(id);
  if (on){
    if (f && f.how === 'linked') return 'linked';
    if (f){ f.row.site = id; if (!f.row.where && x) f.row.where = x.name || id; trialSave(); return 'matched'; }   /* ما أضافه المالكُ يدويًّا — يُربَط لا يُكرَّر */
    trialRows().unshift({ id:uid36(), n:t('تجربة') + ' — ' + ((x && x.name) || id), date:dayKey(), hours:0, note:'', by:STATE.meta.name || '', at:Date.now(), where:(x && x.name) || id, site:id, out:'جارية', report:'' });
    trialSave(); return 'created';
  }
  if (!f || f.how !== 'linked') return '';
  var r = f.row, empty = !(trialTotal(r) > 0) && !(+r.hours > 0) && !r.report && !(trialItems(r.id) || []).length;
  if (empty){ trialsDoc().rows = trialRows().filter(function(z){ return z !== r; }); trialSave(); return 'removed'; }
  return 'kept';
}

function trialRemove(id){
  if (!trialMay()) return;
  if (trialTotal(trialOf(id) || { id:id }) > 0){ toast(t('لا تُحذَف تجربةٌ عليها مصروف')); return; }
  trialsDoc().rows = trialRows().filter(function(x){ return String(x.id) !== String(id); });
  if (trialSave()){ logEvent('حذفُ تجربة — ' + id, id); toast(t('حُذفت التجربة')); render(1); }
}
function trialToggleCost(){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var d = trialsDoc(); d.inCost = !d.inCost;
  if (trialSave()){
    logEvent('مصروفُ التجارب ' + (d.inCost ? 'داخلٌ في التكاليف' : 'خارجٌ عن التكاليف'));
    toast(t(d.inCost ? 'دخل مصروفُ التجارب في التكاليف' : 'خرج مصروفُ التجارب من التكاليف'));
    render(1);
  }
}

/* قطعُ النوع كلُّها دفعةً — بكمية ١ وسعر الكتالوج، وما أُضيف قبلُ لا يتكرّر */
function trialKitLoad(id){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var r = trialOf(id); if (!r) return;
  if (!Array.isArray(r.items)) r.items = [];
  var have = {}; r.items.forEach(function(x){ have[x.code || x.n] = 1; have[x.n] = 1; });
  var add = trialCatItems(r.type).filter(function(i){ return !have[i.code] && !have[i.name]; });
  if (!add.length){ toast(t('كلُّ قطع النوع مضافةٌ بالفعل')); return; }
  add.forEach(function(i){ r.items.push({ n:i.name, code:i.code, q:1, p:+i.price || 0, at:Date.now(), by:STATE.meta.name || '' }); });
  if (trialSave()){ logEvent('قطعُ نوعٍ لتجربة — ' + r.n + ' · ' + r.type + ' · ' + add.length); toast(t('أُضيفت قطعُ النوع') + ' (' + nm(add.length) + ')'); render(1); }
}
function trialItemAdd(id){
  if (!trialMay()){ toast(t('التجاربُ للمهندس فما فوق')); return; }
  var r = trialOf(id); if (!r) return;
  var g = function(k){ var el = document.getElementById(k + id); return el ? String(el.value || '').trim() : ''; };
  var code = g('itC'), cat = code ? itemsList().filter(function(i){ return i.code === code; })[0] : null;
  var n = g('itN') || (cat ? cat.name : ''); if (!n){ toast(t('اختر قطعةً أو اكتب اسمَ الصنف')); return; }
  if (g('itN')) cat = null;   /* ما كُتب بيدٍ يغلب الاختيار */
  var q = +g('itQ') || 1, p = g('itP') !== '' ? (+g('itP') || 0) : (cat ? (+cat.price || 0) : 0);
  if (!Array.isArray(r.items)) r.items = [];
  r.items.push(cat ? { n:n, code:cat.code, q:q, p:p, at:Date.now(), by:STATE.meta.name || '' } : { n:n, q:q, p:p, at:Date.now(), by:STATE.meta.name || '' });
  if (trialSave()){ logEvent('صنفُ تجربة — ' + r.n + ' · ' + n); toast(t('أُضيف الصنف')); render(1); }
}
function trialItemDel(id, i){
  if (!trialMay()) return;
  var r = trialOf(id); if (!r || !Array.isArray(r.items)) return;
  r.items.splice(i, 1);
  if (trialSave()){ toast(t('حُذف الصنف')); render(1); }
}

/* (V29.5) قرارُ المالك: «الحذفُ مسموحٌ للمهندس والمدير» في سجلات المكتب. المشترياتُ تُعدَّل وتُحذَف منهما؛ والمعتمدُ منها لا يُحذف
   إلا بسببٍ مكتوبٍ يدخل سجلَّ الأحداث (الأثرُ لا يُحذف) — فيبقى المنصرفُ مفسَّرًا. */
var BUY_ED = '';

function buyEdit(id){
  var b = (STATE.buys || {})[id]; if (!b || !buyMayEdit()){ toast(t('تعديلُ المشتريات للمهندس والمدير')); return; }
  BUY_ED = id; render(1);
  setTimeout(function(){ var set = function(k, v){ var el = document.getElementById(k); if (el) el.value = v == null ? '' : v; };
    set('byItem', b.item); set('byCat', b.cat); set('bySup', b.sup); set('byAmt', b.amt); set('byZone', b.zone || '\u2014'); set('byTrial', b.trial || '');
    var f = document.getElementById('byItem'); if (f){ try { f.scrollIntoView({ block:'center' }); f.focus(); } catch (e){ LS_ERR = e; } } }, 30);
}
function buyDel(id){
  var b = (STATE.buys || {})[id]; if (!b) return;
  if (!buyMayEdit()){ toast(t('حذفُ المشتريات للمهندس والمدير')); return; }
  var why = '';
  if (b.st === 'معتمد'){ why = String(window.prompt(t('عمليةٌ معتمدةٌ داخل المنصرف — اكتب سببَ الحذف (يُحفَظ في سجل الأحداث):'), '') || '').trim(); if (!why){ toast(t('لم تُحذف — السببُ مطلوبٌ للمعتمد')); return; } }
  else if (!confirm(t('حذفُ عملية الشراء') + ' «' + b.item + '» (' + nm(b.amt) + ')؟')) return;
  logEvent('حذف مشترى — ' + b.item + ' · ' + nm(b.amt) + ' ريال · ' + b.sup + ' · ' + b.st + (why ? ' · السبب: ' + why : ''));
  CORE.rm('buys', id); if (BUY_ED === id) BUY_ED = '';
  toast(t('حُذفت العملية')); render(1);
}

function buyInvCell(b){
  if (!b || !b.inv) return '';
  var P = photosOf(b.inv).filter(function(x){ return !x[1].del; });
  var up = P.filter(function(x){ return x[1].link; })[0];
  if (up) return '<a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="' + esc(up[1].link) + '">\u{1F9FE} ' + esc(t('افتح')) + '</a>';
  var q = (PHOTO_Q || []).some(function(it){ return it.site === b.inv; });
  return '<span class="hint" style="margin:0">\u{1F9FE} ' + esc(t(q || P.length ? 'تُرفع…' : 'لم تصل')) + '</span>';
}
function buyAdd(){
  if (!may('money')){ toast(t('المشترياتُ للمهندس وحده')); return; }
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var item = g('byItem'), cat = g('byCat'), sup = g('bySup');
  var amt = +g('byAmt') || 0, zone = g('byZone'), trial = g('byTrial');
  if (!item){ toast(t('اكتب الصنف')); return; }
  if (catList().indexOf(cat) < 0){ toast(t('الفئةُ من القائمة المعتمدة')); return; }
  if (supList().indexOf(sup) < 0){ toast(t('المورّدُ من القائمة المعتمدة')); return; }
  if (amt <= 0){ toast(t('المبلغُ أكبرُ من صفر')); return; }

  var cap = cfgGet('budApp') || 0;
  var old = BUY_ED ? (STATE.buys || {})[BUY_ED] : null;   /* (V29.5) تعديلٌ لا عمليةٌ جديدة */
  var id = old ? old.id : uid36();
  var b = { id:id, item:item, cat:cat, sup:sup, amt:amt, zone:zone, trial:trial || '',
            at:old ? old.at : Date.now(), by:old ? old.by : (STATE.meta.name || ''),
            st: (cap && amt > cap) ? 'بانتظار الاعتماد' : 'معتمد' };
  if (old){ b.edAt = Date.now(); b.edBy = STATE.meta.name || ''; BUY_ED = ''; }
  if (old && old.inv) b.inv = old.inv;
  if (BUY_PH && BUY_PH.data){ b.inv = 'BUY-' + id; try { photoQueue(b.inv, 'invoice', BUY_PH.data); } catch (eP){ softErr('صورة الفاتورة', eP, 'تعذّر حفظ صورة الفاتورة — أعد اختيارها'); } BUY_PH = null; }   /* (V37.43) */
  if (!STATE.buys) STATE.buys = {};
  STATE.buys[id] = b;
  CORE.set('buys', id, b);
  logEvent((old ? 'تعديل مشترى — ' : 'مشترى — ') + item + ' · ' + nm(amt) + ' ريال · ' + b.st + (old && (old.amt !== amt || old.item !== item) ? ' (كان ' + old.item + ' · ' + nm(old.amt) + ')' : ''));
  if (b.st !== 'معتمد')
    notifPush('اعتماد شراء', 'مشترًى يتجاوز حدَّ الاعتماد — ' + item + ' · ' + nm(amt), { lv:'مهم' });
  toast(t(old ? 'حُفظ التعديل' : (b.st === 'معتمد' ? 'سُجّل المشترى' : 'سُجّل بانتظار اعتماد المهندس — تجاوز حدَّ الاعتماد')));
  render(1);
}

/* إضافةُ مورّدٍ أو فئةٍ إلى القائمة المعتمدة — والمستعملُ لا يُحذَف */
function listAdd(kind){
  if (!may('money')){ toast(t('المشترياتُ للمهندس وحده')); return; }
  var el = document.getElementById(kind === 'sup' ? 'supNew' : 'catNew');
  var v = el ? String(el.value || '').trim() : '';
  if (!v){ toast(t('اكتب الاسم أولًا')); return; }
  var L = kind === 'sup' ? supList() : catList();
  if (L.indexOf(v) > -1){ toast(t('موجودٌ بالفعل')); return; }
  L.push(v);
  CORE.set('cfg', kind === 'sup' ? 'sups' : 'cats', L.slice());
  logEvent((kind === 'sup' ? 'مورّد جديد — ' : 'فئة مشتريات جديدة — ') + v);
  toast(t('أُضيف'));
  render(1);
}
function listRm(kind, v){
  if (!may('money')){ toast(t('المشترياتُ للمهندس وحده')); return; }
  var used = buysList().filter(function(b){ return (kind === 'sup' ? b.sup : b.cat) === v; }).length;
  if (used){ toast(t('مستعملٌ في') + ' ' + nm(used) + ' ' + t('عملية — لا يُحذَف')); return; }
  var L = kind === 'sup' ? supList() : catList();
  var i = L.indexOf(v);
  if (i < 0) return;
  L.splice(i, 1);
  CORE.set('cfg', kind === 'sup' ? 'sups' : 'cats', L.slice());
  logEvent((kind === 'sup' ? 'حذف مورّد — ' : 'حذف فئة — ') + v);
  toast(t('حُذف'));
  render(1);
}

PAGE.inv = { m:'الورشة والمخزون', t:'المخزون',
  l:'الأرصدةُ وحركتُها وعُهدةُ كلِّ منفِّذ — في شاشةٍ واحدة.',
  body:function(){
    var head = tabHead('inv'), cur = tabCur('inv');
    if (cur === 'wos') return head + (function(){
    var Tg = T();
    var L = workReqList();
    var prepReq = L.filter(function(x){ return x.kind === 'prep'; });
    var asmReq  = L.filter(function(x){ return x.kind === 'asm'; });
    var openPrep = prepReq.filter(function(x){ return x.status !== 'تم'; }).length;
    var openAsm  = asmReq.filter(function(x){ return x.status !== 'تم'; }).length;

    var byItem = {};
    itemsList().forEach(function(i){ byItem[i.code] = i; });
    var pp = { camp:0, cor:0 }, pa = { camp:0, cor:0 };
    (STATE.moves || []).forEach(function(m){
      var it = byItem[itemCode(m.item)];   /* (V37.99) اسمًا كان أو رمزًا */
      if (!it) return;
      var zone = it.z === 'cor' ? 'cor' : 'camp';
      if (m.kind === 'تهيئة') pp[zone] += itPrep(it.code) * cfgN(m.qty);
      if (m.kind === 'تجميع') pa[zone] += itAsm(it.code) * cfgN(m.qty);
    });

    return stats([['طلباتُ تهيئةٍ مفتوحة', N(openPrep), openPrep ? 'wrn' : 'ok'],
                  ['طلباتُ تجميعٍ مفتوحة', N(openAsm), openAsm ? 'wrn' : 'ok'],
                  ['طلباتٌ مكتملة', N(L.filter(function(x){ return x.status === 'تم'; }).length), 'ok']])

      + card('الورشة مقابل التارجت',
          table(['المرحلة','النوع','نقاط الشهر','تارجت الشهر','٪','تارجت الأسبوع'], [
            ['تهيئة','مخيمات', N(Math.round(pp.camp)), N(Tg.prepCamp), pct(pp.camp,Tg.prepCamp), N(cfgWk(Tg.prepCamp))],
            ['تهيئة','ممرات',  N(Math.round(pp.cor)),  N(Tg.prepCor),  pct(pp.cor,Tg.prepCor),   N(cfgWk(Tg.prepCor))],
            ['تجميع','مخيمات', N(Math.round(pa.camp)), N(Tg.asmCamp), pct(pa.camp,Tg.asmCamp),  N(cfgWk(Tg.asmCamp))],
            ['تجميع','ممرات',  N(Math.round(pa.cor)),  N(Tg.asmCor),  pct(pa.cor,Tg.asmCor),    N(cfgWk(Tg.asmCor))]
          ], ['الإجمالي','', N(Math.round(pp.camp+pp.cor+pa.camp+pa.cor)), N(Tg.prep+Tg.asm),
              pct(pp.camp+pp.cor+pa.camp+pa.cor, Tg.prep+Tg.asm), N(cfgWk(Tg.prep+Tg.asm))]))

      + (may('edit')
        ? card('طلبٌ جديد',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('النوع')) + '</label>'
            + '<select id="wrKind"><option value="prep">' + esc(t('تهيئة')) + ' (CR)</option>'
            + '<option value="asm">' + esc(t('تجميع')) + ' (AR)</option>'
            + '<option value="issue">' + esc(t('صرف أصناف')) + ' (IR)</option></select></div>'
            + '<div class="field"><label>' + esc(t('الصنف')) + '</label>'
            + '<select id="wrItem">' + itemsList().map(function(i){
                return '<option value="' + esc(i.code) + '">' + esc(i.name) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('الكمية المطلوبة')) + '</label>'
            + '<input type="number" id="wrQty" min="1" value="10"></div>'
            + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('يُصرَف له')) + '</label>'
            +   '<select id="wrTo"><option value="">— ' + esc(t('للورشة — بلا عهدة شخص')) + ' —</option>'
            +   techsList().map(function(x){
                  return '<option value="' + esc(x.n) + '">' + esc(x.n) + '</option>'; }).join('')
            +   '</select>'
            +   '<p class="hint" style="margin:6px 0 0">' + esc(t('يلزم مع «صرف أصناف» — القطعُ تدخل عُهدةَ من يُصرَف له لا عهدةَ من سجّل التنفيذ.')) + '</p></div>'
            + '</div>',
            btn('➕ إنشاء الطلب','btn-primary btn-sm',' data-wradd="1"'))
        : '')

      + (WR_DONE
        ? card(t('تسجيل تنفيذٍ') + ' — ' + esc(WR_DONE),
            '<div class="field" style="max-width:220px;margin:0"><label>' + esc(t('الكمية المُنفَّذة الآن')) + '</label>'
            + '<input type="number" id="wrDoneQty" min="1" value="1"></div>',
            btn('تأكيد','btn-primary btn-sm',' data-wrdonego="' + esc(WR_DONE) + '"')
            + btn('تراجع','btn-quiet btn-sm',' data-wrdonecancel="1"'))
        : '')

      + (L.length
        ? cardFlush(t('الطلبات') + ' — ' + nm(L.length),
            /* تسعةُ أعمدةٍ تدفع عمودَ الأزرار خارجَ شاشة الهاتف — فيُرى الجدولُ
               ولا يُبلَغ زرُّه. صارت ستةً: الطلبُ برقمه ونوعه، والصنفُ
               بمطلوبه ومنفَّذه، ومن أنشأه بتاريخه — والأزرارُ في عمودها. */
            table(['الطلب','الصنف','المطلوب / المنفَّذ','الحالة','أنشأه',''],
              L.map(function(r){
                var ed = WR_EDIT === r.id;
                return ['<span class="num">' + esc(r.no) + '</span><br>'
                          + (r.kind === 'prep' ? pill('تهيئة','acc')
                             : (r.kind === 'issue' ? pill('صرف','off') : pill('تجميع','warn'))),
                        ed && !cfgN(r.qtyDone)
                          ? '<select data-wreitem="' + esc(r.id) + '">' + itemsList().map(function(i){
                              return '<option value="' + esc(i.code) + '"' + (i.code === r.item ? ' selected' : '') + '>'
                                + esc(i.name) + '</option>'; }).join('') + '</select>'
                          : esc(itemName(r.item)),
                        ed
                          ? '<input type="number" min="1" id="wrEQ_' + esc(r.id) + '" value="' + esc(String(cfgN(r.qty))) + '" style="width:84px">'
                          : (N(r.qty) + ' / ' + N(r.qtyDone || 0)),
                        pill(r.status, r.status === 'تم' ? 'ok' : (r.status === 'قيد التنفيذ' ? 'warn' : 'off')),
                        '<span class="hint" style="margin:0">' + esc(dispName(r.by)) + '<br>'
                          + '<span class="num">' + esc(fmtDate(r.at)) + '</span></span>',
                        ed
                          ? '<div class="actions" style="margin:0">'
                            + btn('احفظ','btn-primary btn-sm',' data-wresave="' + esc(r.id) + '"')
                            + btn('إلغاء','btn-quiet btn-sm',' data-wredit=""') + '</div>'
                          : (r.status !== 'تم'
                          ? '<div class="actions" style="margin:0">'
                            + btn('سجّل تنفيذًا','btn-quiet btn-sm',' data-wrdone="' + esc(r.id) + '"')
                            + btn('✎','btn-quiet btn-sm',' data-wredit="' + esc(r.id) + '" aria-label="' + esc(t('تعديل')) + '"')
                            + (r.qtyDone ? '' : btn('🗑','btn-quiet btn-sm',' data-wrcancel="' + esc(r.id) + '" aria-label="' + esc(t('حذف')) + '"'))
                            + '</div>'
                          : '—')];
              })))
        : card('لا طلباتٍ بعد',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('أنشئ أوّل طلب تهيئةٍ أو تجميعٍ أعلاه.')) + '</p>'))

      + '<p class="hint">' + esc(t('كلُّ تنفيذٍ يُسجَّل في دفتر الحركة بنوعه الصحيح فيدخل حساب النقاط — لا تقديرَ ولا تارجت بلا منفَّذ.')) + '</p>';
  })();
    if (cur === 'wday') return head + (function(){
    var today = dayKey();
    var byName = Object.create(null);
    Object.keys(STATE.inss).forEach(function(id){
      var r = STATE.inss[id], x = siteFind(id);
      if (!x || r.status !== 'مُركّب' || !r.by) return;
      var day = dayKey(r.at || 0);
      if (day !== today) return;
      if (!byName[r.by]) byName[r.by] = { n:0, pts:0 };
      byName[r.by].n++;
      byName[r.by].pts += r.approved ? ptsInstall(x) : 0;
    });
    var names = Object.keys(byName).sort(function(a,b){ return byName[b].pts - byName[a].pts; });
    var totN = names.reduce(function(a,n){ return a + byName[n].n; }, 0);
    var totP = names.reduce(function(a,n){ return a + byName[n].pts; }, 0);

    return stats([['نفّذوا اليوم', N(names.length), 'acc'],
                  ['تركيباتٌ اليوم', N(totN)],
                  ['نقاطُ اليوم', N(Math.round(totP))]])

      + (names.length
        ? cardFlush(t('تركيبُ اليوم') + ' — ' + nm(names.length),
            table(['المنفِّذ','تركيب','نقاط'],
              names.map(function(n){ return [esc(n), N(byName[n].n), N(Math.round(byName[n].pts))]; }),
              ['<b>' + t('الإجمالي') + '</b>', N(totN), N(Math.round(totP))]))
        : card('تركيبُ اليوم',
            '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا تركيبَ اليوم بعد.')) + '</p>'))

      + alertBox('warn','التهيئةُ والتجميعُ لا يُحتسَبان هنا بعد — نظامُ طلبات الورشة (من نفَّذ ماذا) لم يُبنَ، كما في «طلبات المستودع».');
  })();
    if (cur === 'ships') return head + (function(){
    var L = shipList().filter(function(x){
      return !SHIP_Q || (x.ref + ' ' + (x.item || '') + ' ' + (x.sup || '')).indexOf(SHIP_Q) > -1;
    });
    var late = shipList().filter(function(x){ return shipLate(x) > 0; });
    var open = shipList().filter(function(x){ return !x.got; });

    return stats([['شحنات', N(shipList().length)],
                  ['في الطريق', N(open.length), open.length ? 'acc' : ''],
                  ['وصلت', N(shipList().length - open.length), 'ok'],
                  ['متأخرة', N(late.length), late.length ? 'bad' : 'ok']])

      + (late.length
        ? alertBox('warn', 'متأخرةٌ عن موعدها: '
            + late.map(function(x){ return x.ref + ' — ' + nm(shipLate(x)) + ' يومًا'; }).join(' · ')
            + '. الموعدُ المتوقَّعُ يُكتَب يومَ الشحن، فيُعرَف التأخّرُ يومَه لا بعد أسبوعين.')
        : '')

      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="shQ" data-shq="1" value="' + esc(SHIP_Q) + '" placeholder="'
      +     esc(t('ابحث برقم الشحنة أو الصنف أو المورّد')) + '" dir="auto">'
      + '</form>'

      + cardFlush(t('الشحنات') + ' — ' + nm(L.length),
          L.length
            ? table(['رقم الشحنة','الصنف','العدد','المورّد','الحالة','شُحنت','متوقَّع','وصلت','التأخّر',''],
                L.map(function(x){
                  var lt = shipLate(x);
                  return ['<strong>' + esc(x.ref) + '</strong>',
                          '<input value="' + esc(x.item || '') + '" data-shi="' + esc(x.id) + '" dir="auto">',
                          '<input type="number" min="0" value="' + esc(String(x.qty || 0))
                            + '" data-shqy="' + esc(x.id) + '" style="max-width:86px">',
                          '<input value="' + esc(x.sup || '') + '" data-shs="' + esc(x.id) + '" dir="auto">',
                          '<select data-shst="' + esc(x.id) + '">'
                            + SHIP_ST.map(function(v){
                                return '<option value="' + esc(v) + '"' + (x.st === v ? ' selected' : '') + '>' + esc(t(v)) + '</option>';
                              }).join('') + '</select>',
                          '<input type="date" value="' + esc(x.sent || '') + '" data-shsn="' + esc(x.id) + '">',
                          '<input type="date" value="' + esc(x.eta || '') + '" data-sheta="' + esc(x.id) + '">',
                          '<input type="date" value="' + esc(x.got || '') + '" data-shgot="' + esc(x.id) + '">',
                          lt ? pill(nm(lt) + ' ' + t('يوم'), 'bad')
                             : (x.got ? pill(t('وصلت'), 'ok') : '—'),
                          (may('inventory') || may('money'))
                            ? (x.got ? '<span class="hint" style="margin:0">' + esc(t('وصلت')) + '</span>'
                                     : btn('حذف','btn-quiet btn-sm',' data-shdel="' + esc(x.id) + '"'))
                            : ''];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا شحناتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="ships"') : '')

      + ((may('inventory') || may('money'))
        ? card('تسجيل شحنة',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('رقم الشحنة')) + ' <span class="req">*</span></label>'
            +   '<input id="shRef" dir="auto" placeholder="SH-1448-001"></div>'
            + '<div class="field"><label>' + esc(t('الصنف')) + '</label><input id="shItem" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('العدد')) + '</label>'
            +   '<input id="shQty" type="number" min="0" value="0"></div>'
            + '<div class="field"><label>' + esc(t('المورّد')) + '</label>'
            +   '<select id="shSup"><option value="">— ' + esc(t('اختر')) + ' —</option>'
            +   supList().map(function(v){ return '<option>' + esc(v) + '</option>'; }).join('') + '</select></div>'
            + '<div class="field"><label>' + esc(t('تاريخ الشحن')) + '</label>'
            +   '<input id="shSent" type="date" value="' + esc(todayISO()) + '"></div>'
            + '<div class="field"><label>' + esc(t('الوصول المتوقَّع')) + ' <span class="req">*</span></label>'
            +   '<input id="shEta" type="date"></div>'
            + '</div>',
            btn('➕ تسجيل شحنة','btn-primary btn-sm',' data-shadd="1"'))
        : '')

      + '<p class="hint">' + esc(t('الوصولُ المتوقَّعُ يُكتَب يومَ الشحن — وبه يُحسَب التأخّرُ بنفسه ويصل إشعارٌ عاجلٌ مرةً في اليوم. والشحنةُ التي وصلت لا تُحذَف: سجلُّها أثرٌ يُسأل عنه.')) + '</p>';
  })();
    if (cur === 'invmv') return head + (function(){
    var L = movesList(), items = itemsList();
    /* (V38.69) installations saved before V38.69 consumed on the installer's phone only — one tap brings the ledger level */
    var gap = 0; Object.keys(STATE.inss || {}).forEach(function(id){ var r = STATE.inss[id]; if (!r || r.deleted || !r.status || insStatusIs(r.status, 'مسودّة') || insStatusIs(r.status, 'متعذّر')) return; var had = insConsumed(id); Object.keys(r.parts || {}).forEach(function(k){ if ((cfgN(r.parts[k]) || 0) !== (had[k] || 0)) gap++; }); });
    return (may('inventory') && gap
      ? card('', alertBox('warn', t('تركيباتٌ لم تصل دفترَ المخزن') + ': ' + nm(gap) + ' ' + t('صنفًا — سُجِّلت قبل إصلاح الدفتر (٣٨٫٦٩)'))
          + '<div class="actions">' + btn('\u2696 ' + t('سوِّ الدفتر مع التركيبات'), 'btn-primary btn-sm', ' data-mvsettle="1"') + '</div>'
          + '<p class="hint" style="margin:6px 0 0">' + esc(t('تُسجَّل حركةُ «استهلاك» باسم المنفِّذ لكلِّ ما رُكِّب ولم يُخصَم — مرةً واحدة، ولا تتكرّر لو ضُغطت ثانية.')) + '</p>')
      : '')
      + (may('inventory')
      ? card('تسجيل حركة',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('الحركة')) + '</label><select id="mvKind">'
          +   MOVE_KINDS.map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الصنف')) + '</label><select id="mvItem">'
          +   '<option value="">— ' + esc(t('اختر')) + ' —</option>'
          +   items.map(function(x){ return '<option>' + esc(x.name) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الكمية')) + '</label>'
          +   '<input id="mvQty" type="number" min="1" step="1"></div>'
          + '<div class="field"><label>' + esc(t('المنفِّذ')) + '</label><select id="mvBy">'
          +   '<option value="">—</option>'
          +   techsList(1).map(function(x){ return '<option>' + esc(x.n) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('النقطة')) + '</label>'
          +   '<input id="mvSite" dir="ltr" placeholder="NSK-…"></div>'
          + '<div class="field"><label>' + esc(t('ملاحظة')) + '</label><input id="mvNote" dir="auto"></div>'
          + '</div>'
          + '<div class="actions">' + btn('سجّل الحركة','btn-primary',' data-mvadd="1"') + '</div>'
          + '<p class="hint">' + esc(t('الرصيدُ يُشتقُّ من الحركات — والتصحيحُ حركةٌ تصحيحيةٌ لا تعديلُ رقم.')) + '</p>')
      : '')
      + cardFlush(t('الحركات') + ' — ' + nm(L.length),
          L.length
            ? table(['التاريخ','الحركة','الصنف','الكمية','المنفِّذ','النقطة','سجّلها'],
                capList(L, 200).map(function(m){
                  var k = {'توريد':'ok','صرف':'acc','استهلاك':'warn','إرجاع':'info','شطب':'off'}[m.kind] || '';
                  return ['<span class="num">' + esc(dayKey(m.at)) + '</span>',
                          pill(t(m.kind), k), esc(m.item), N(m.qty),
                          esc(m.by || '—'),
                          '<span class="num">' + esc(m.site || '—') + '</span>',
                          esc(m.user || '—') + ((may('inventory') && m.kind !== 'استهلاك' && Date.now() - (+m.at || 0) < 864e5) ? ' <button type="button" class="btn btn-quiet btn-sm" style="color:#E05252" data-mvdel="' + esc(m.id) + '">\u{1F5D1}</button>' : '')];   /* (V36.6) */
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا حركاتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="invmv"') : '');
  })();
    if (cur === 'stock') return head + (function(){
    var L = custodyByWho();
    var tot = L.reduce(function(a,r){ return a + r.total; }, 0);

    return stats([['من بيدهم عُهدة', N(L.length), L.length ? 'acc' : ''],
                  ['قطعٌ في العُهدة', N(tot)]])

      + (L.length
        ? cardFlush(t('العُهدة حسب المنفِّذ') + ' — ' + nm(L.length),
            table(['المنفِّذ','أصناف','قطع','التفصيل'],
              L.map(function(r){
                var ks = Object.keys(r.items).filter(function(k){ return r.items[k] > 0; });
                return ['<strong>' + esc(dispName(r.who)) + '</strong>', N(ks.length), N(r.total),
                        '<span class="hint" style="margin:0">'
                          + ks.map(function(k){ return esc(itemName(k)) + ' \u00d7' + nm(r.items[k]); }).join(' \u00b7 ')
                          + '</span>'];
              })))
        : card('لا عُهدةَ مصروفةً الآن',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('تظهر هنا فور أول صرفٍ من «دفتر حركة المخزون».')) + '</p>'))

      + '<p class="hint">' + esc(t('العُهدةُ صرفٌ ناقصَ ما استُهلك أو أُرجع أو شُطب — لا رقمَ يُكتب بيد.')) + '</p>';
  })();
    return head + (function(){
    var B = stockBalance();
    var tot = B.reduce(function(a,r){ return { store:a.store+r.store, custody:a.custody+r.custody,
                                               used:a.used+r.used, scrap:a.scrap+r.scrap }; },
                       { store:0, custody:0, used:0, scrap:0 });
    return stats([['في المخزن', N(tot.store), 'ok'],
                  ['في العُهدة', N(tot.custody), 'acc'],
                  ['رُكّب في الميدان', N(tot.used)],
                  ['تالف معزول', N(tot.scrap), tot.scrap ? 'bad' : '']])
      + cardFlush('الأرصدة حسب الصنف',
          B.length
            ? table(['الصنف','المخزن','العُهدة','رُكّب','تالف','الإجمالي'],
                B.map(function(r){
                  return [esc(r.item), N(r.store), N(r.custody), N(r.used),
                          r.scrap ? pill(nm(r.scrap),'off') : N(0),
                          '<b>' + N(r.store + r.custody + r.used + r.scrap) + '</b>'];
                }))
            : '<p class="hint" style="padding:16px">'
              + esc(t('لا حركاتٍ بعد — الرصيدُ يُشتقُّ من الحركات ولا يُكتَب بيد.')) + '</p>')
      + (B.some(function(r){ return r.store < 0 || r.custody < 0; })
          ? alertBox('warn','رصيدٌ سالبٌ في صنف — حركةٌ سُجّلت بلا ما يقابلها.') : '');
  })();
  }};

/* عُهدةُ كلِّ منفِّذ: صرفٌ إليه ناقصَ ما استُهلك أو أُرجع أو شُطب — بنفس
   معادلة stockBalance لكن مقسومةً بالاسم لا مجموعةً بالصنف. كان الجدولُ
   صفًّا واحدًا مكتوبًا بيد («فريق ١ · راوتر ×٣») يُعرَض ولو خلت الخزائن. */
function custodyByWho(){
  var by = {};
  function row(who){
    if (!by[who]) by[who] = { who:who, items:{}, total:0 };
    return by[who];
  }
  movesList().slice().sort(function(a, b){ return movAt(a) - movAt(b); }).forEach(function(m){   /* (V38.63) in time order */
    var who = m.by || '—', q = cfgN(m.qty), it = m.item || '—';
    if (!q) return;
    var d = 0;
    if (m.kind === 'صرف' || m.kind === 'تصحيح استهلاك') d = q;   /* (V38.62) a lowered installation returns to its installer */
    else if (m.kind === 'استهلاك'){ var held = (by[who] && by[who].items[it]) || 0; d = -Math.min(q, Math.max(0, held)); if (!d) return; }   /* (V38.63) the rest came from the store */
    else if (m.kind === 'إرجاع' || m.kind === 'شطب'
             || m.kind === 'إرجاع سليم' || m.kind === 'إرجاع تالف') d = -q;
    else return;
    var r = row(who);
    r.items[it] = (r.items[it] || 0) + d;
    r.total += d;
  });
  return Object.keys(by).map(function(k){ return by[k]; })
    .filter(function(r){ return r.total > 0; })
    .sort(function(a,b){ return b.total - a.total; });
}

/* ── المال ──────────────────────────────────────── */

/* ── الفنيون ────────────────────────────────────── */
