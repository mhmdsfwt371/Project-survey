/* ============================================================================
   FILE    : src/03z-shared/03z-shared-18-from-mfu-tabs-04-followup-tabs.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-mfu-tabs-04-followup-tabs.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : MT_TILE, mtDot, mtGrid, mtOpen, mtXlsx, mtSites, MT_GRP, mtGrpOf, obsLocTags, mtStepSite, MT_COB, mtCoStats, MT_WF, MT_WPOP … (+10 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ (V37.62) تبويباتُ متابعة الوزارة الخمسة بفكرة الملخّص — قرارُ المالك: «الوزارة عاوزة تتابع بأسهل طريقة ممكنة» ═══
   القالبُ الواحد: حلقةٌ كبيرة (كم من كم) ← مربعاتٌ بأيقونةٍ ورقمٍ وكلمة ← كلُّ مربعٍ يفتح لوحتَه وإكسلَه (والمهامُّ تُصفّى في مكانها).
   القواعد: كلُّ نقطةٍ (أو مهمةٍ) في مربعٍ واحدٍ من كلِّ قسم فالأرقامُ تجمع؛ لا عمرَ معوِّقٍ ولا مقارنةً تُدين المشغّل؛ والتفاصيلُ القديمةُ كاملةً في قسمٍ مطويّ. */
var MT_TILE = 'background:var(--surface-2);border-radius:14px;padding:12px;touch-action:manipulation';

/* مربعٌ بنقطة لون (للحالات) — attrs يحمل ما يفتحه */
function mtDot(n, label, icon, color, attrs){
  return '<div role="button" tabindex="0"' + attrs + ' title="' + esc(t('اضغط للتفاصيل والإكسل')) + '" style="' + MT_TILE + ';display:flex;align-items:center;gap:10px;cursor:pointer"><span style="width:14px;height:14px;border-radius:50%;background:' + color + ';flex:0 0 auto"></span><div><div class="num" style="font-size:22px;font-weight:800">' + nm(n) + '</div><div style="font-size:13px">' + icon + ' ' + esc(t(label)) + ' \u203A</div></div></div>';
}

function mtGrid(cells, min){ return cells.length ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(' + (min || 150) + 'px,1fr));gap:8px;margin-bottom:12px">' + cells.join('') + '</div>' : ''; }

/* فئةٌ خاصة: details.mfu-add للنماذج القديمة داخلها */
function mtOpen(list, sub, zone){ return ' data-svlist="' + esc(list) + '"' + (sub ? ' data-svsub0="' + esc(sub) + '"' : '') + (zone ? ' data-svzone="' + esc(zone) + '"' : ''); }

function mtXlsx(name, head, rows){
  if (!rows.length){ toast(t('لا بيانات بعد')); return false; }
  return xlsxLoad().then(function(ok){ if (!ok){ toast(t('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة')); return false; }
    var aoa = [head.map(function(h){ return t(h); })].concat(rows), wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = head.map(function(_, i){ var w0 = 10; aoa.forEach(function(r){ w0 = Math.max(w0, Math.min(50, String(r[i] == null ? '' : r[i]).length + 2)); }); return { wch:w0 }; }); wb.Workbook = { Views:[{ RTL:true }] };
    XLSX.utils.book_append_sheet(wb, ws, t(name).slice(0, 30)); XLSX.writeFile(wb, t(name) + ' — ' + dayKey() + '.xlsx'); logEvent('تصدير ' + name + ' — ' + rows.length); toast(t('نزل الملف')); return true; });
}

function mtSites(){ return (STATE.sites || []).filter(function(x){ return !x.hidden && !x.deleted; }); }

/* (V37.64) توحيد: الأسماءُ من تعريف المالك CC_GROUPS نفسِه، والألوانُ بمعنى واحدٍ في الخريطة واللوحات */
var MT_GRP = [ { k:'make', e:'\u{1F3ED}', c:'#F59E0B', w:[0, 2, 4] }, { k:'study', e:'\u{1F50E}', c:'#E67E22', w:[1, 5] }, { k:'owner', e:'\u{1F91D}', c:'#EF4444', w:[3] }, { k:'access', e:'\u{1F501}', c:'#8D6E63', w:[] } ];

/* (V38.76) the single definition: a point scheduled for installation keeps its challenge until it is installed (svStOf says
   «sched» first and dropped it from this tab while the hall screen and the follow-up counted it) */
function mtGrpOf(id){
  if (insDone(id)) return ''; var r = STATE.recs[id]; if (!r || !svVisited(r)) return ''; if (!svDone(r)) return 'access';
  var pw = svPrimWhyAny(r); if (pw < 0) return '';
  for (var i = 0; i < MT_GRP.length; i++) if (MT_GRP[i].w.indexOf(pw) > -1) return MT_GRP[i].k; return 'study';
}

/* (V38.26) كلُّ النقاط عدا المخيمات ومراكز التفويج */
function obsLocTags(x){
  var r = STATE.recs[x.id], out = {};
  if (!r || r.deleted || !svVisited(r) || !locApplies(x)) return null;   /* (V38.26) كلُّ النقاط عدا المخيمات ومراكز التفويج */
  var L = locList(r.loc), pick = 'اختيار الفني', txtSrc = 'وصف التحدي أو الملاحظة';
  var map = { 'تحت كوبري':'bridge', 'مدخل نفق':'tin', 'مخرج نفق':'tout', 'نفق — غير محدد':'tgen', 'لوحة استرشادية':'sign', 'بدون إطار معدني للتثبيت':'nomount', 'على مظلة':'canopy' };
  L.forEach(function(v){ if (map[v]) out[map[v]] = pick; });
  if (locOnly(x)) return out;   /* (V38.78) corridors and Jamarat: the location choice alone — no mount, no category, no words */
  if (r.mount === 'لوحة استرشادية') out.sign = pick;   /* ما حُفظ في V38.23 */
  if (chalCats(r).indexOf('mount') > -1 && !out.nomount) out.nomount = pick;   /* فئةُ «لا يوجد سطح تثبيت» */
  if (L.length) return out;   /* اختارَ الفنيُّ (ولو «لا شيء مما سبق») — لا استنتاجَ من الكلام */
  /* زياراتٌ أقدمُ بلا اختيار: من اختيار التحدي القديم أو كلمات الوصف والملاحظة — لا من اسم الفئة الجامعة «… نفق أو كوبري» */
  var nm0 = {}; ccList().forEach(function(o){ nm0[o.n] = 1; if (o.base) nm0[o.base] = 1; });
  var chals = Array.isArray(r.chals) ? r.chals : [];
  var own = arKey(chals.filter(function(c){ return c && !nm0[c] && c !== 'لا توجد تحديات'; }).join(' ')), txt = arKey([r.note || '', r.chal_note || ''].join(' '));
  var hit = function(rx){ return rx.test(own) ? pick : (rx.test(txt) ? txtSrc : ''); };
  var b = chals.indexOf('المسار تحت كوبري') > -1 ? pick : hit(/تحت\s*(ال)?(كوبري|كبري|جسر)|(^|\s)(ال)?(كوبري|كبري)/); if (b) out.bridge = b;
  var ti = hit(/(مدخل|بدايه|بداية)\s*(ال)?نفق/), to = hit(/(مخرج|نهايه|نهاية)\s*(ال)?نفق/);
  if (ti) out.tin = ti; if (to) out.tout = to;
  if (!ti && !to){ var tg = chals.indexOf('المسار داخل نفق') > -1 ? pick : hit(/نفق|انفاق/); if (tg) out.tgen = tg; }
  var sg = hit(/(لوحه|لوحات|لافته|لافتات)\s*(ال)?(استرشاد|ارشاد)|استرشادي|ارشادي/); if (sg) out.sign = sg;
  var cn = hit(/مظله|مظلات/); if (cn) out.canopy = cn;
  return out;
}

/* ── ٥ · ملخص العمل اليومي ── */
function mtStepSite(x){ return x.site || x.sid || x.siteId || ''; }

/* ── ٣ · شركات الخدمة ── */
var MT_COB = [ { k:'ready', n:'مخيماتها جاهزة', e:'\u2705', c:'#22C55E' }, { k:'prep', n:'فيها تجهيز', e:'\u{1F6E0}', c:'#F59E0B' }, { k:'coord', n:'محتاجة تنسيق', e:'\u26A0\uFE0F', c:'#EF4444' }, { k:'todo', n:'لسه', e:'\u23F3', c:'#475569' } ];

function mtCoStats(){
  var by = {}; mtSites().forEach(function(x){ if (x.type !== 'مخيم' || !x.co) return; var o = by[x.co] = by[x.co] || { co:x.co, n:0, ready:0, prep:0, coord:0, ins:0, todo:0 }; o.n++; var st = svStOf(x.id); if (st === 'ins' || st === 'sched') o.ins++; else if (o[st] != null) o[st]++; else o.todo++; });
  return Object.keys(by).map(function(k){ var o = by[k]; o.b = o.coord ? 'coord' : o.prep ? 'prep' : (o.ready + o.ins === o.n ? 'ready' : 'todo'); return o; });
}

/* ── ١ · المهام الأسبوعية — تُصفّى في مكانها، والإكسلُ بما تراه ── */
var MT_WF = '', MT_WPOP = false;

function mtWCard(r){ var COL = { done:'#22C55E', late:'#EF4444', run:'#2E86DE', wait:'#475569' }, s0 = mtWSt(r);
  return '<div style="' + MT_TILE + ';display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="width:10px;height:10px;border-radius:50%;background:' + COL[s0] + ';flex:0 0 auto"></span><div style="flex:1;min-width:0"><div style="font-size:14px">' + esc(r.n || '\u2014') + '</div><div class="hint" style="margin:2px 0 0;font-size:12px">' + esc(r.who || '\u2014') + (r.due ? ' \u00b7 ' + esc(r.due) : '') + '</div></div><span class="pill">' + esc(t((MT_WST.filter(function(o){ return o.k === s0; })[0] || {}).n || '')) + '</span></div>'; }

/* (V37.63) مربعُ المهام يفتح نافذتَه */
var MT_WST = [ { k:'done', n:'خلصت', e:'\u2705', c:'#22C55E' }, { k:'late', n:'متأخرة', e:'\u23F0', c:'#EF4444' }, { k:'run', n:'شغالين عليها', e:'\u{1F504}', c:'#2E86DE' }, { k:'wait', n:'لسه', e:'\u23F3', c:'#475569' } ];

var MT_WWHO = [ { k:'afaqy', n:'أفاقي', e:'\u{1F3E2}' }, { k:'min', n:'الوزارة', e:'\u{1F3DB}' }, { k:'co', n:'شركة الخدمة', e:'\u26FA' }, { k:'other', n:'أخرى', e:'\u{1F465}' } ];

function mtWSt(r){ if (r.st === 'مكتمل') return 'done'; if (wtLate(r)) return 'late'; if (r.st === 'جاري العمل') return 'run'; return 'wait'; }

function mtWWho(r){ var w = String(r.who || ''); if (/أفاق|افاق|afaqy/i.test(w)) return 'afaqy'; if (/وزار/.test(w)) return 'min'; if (/شرك|مطوف|خدمة/.test(w)) return 'co'; return 'other'; }

function mtSupNeeded(r){ if (mtWWho(r) !== 'min' || r.st === 'مكتمل') return false; var d = wtDue(r); return d != null && d <= 7; }

/* (V37.65) «دعم من الوزارة» — تسميةُ المالك */
function mtWRows(){ var R = wtRows(); if (!MT_WF) return R; var p = MT_WF.split(':'); return R.filter(function(r){ return p[0] === 'sup' ? mtSupNeeded(r) : p[0] === 'st' ? mtWSt(r) === p[1] : mtWWho(r) === p[1]; }); }

function mtWPopHtml(card){
  card = card || mtWCard;   /* (V37.65) النافذةُ نفسُها من المهام الأسبوعية ومن تنبيه الملخّص */
  var pop = '';
  if (MT_WPOP && MT_WF){ var F = mtWRows(), p = MT_WF.split(':'), lab = p[0] === 'sup' ? 'دعم من الوزارة' : p[0] === 'st' ? (MT_WST.filter(function(o){ return o.k === p[1]; })[0] || {}).n : (MT_WWHO.filter(function(o){ return o.k === p[1]; })[0] || {}).n;
    pop = '<div class="svpop-veil" data-mtwclose="1" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000"></div><div class="svpop" role="dialog" aria-modal="true" style="position:fixed;z-index:2001;inset:6vh 4vw auto 4vw;max-height:86vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.35)">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0">' + (p[0] === 'sup' ? esc(t(lab)) : esc(t('مهام')) + ' \u2014 ' + esc(t(lab || ''))) + ' \u2014 ' + nm(F.length) + '</h3>' + btn('\u2715 ' + t('إغلاق'), 'btn-quiet btn-sm', ' data-mtwclose="1"') + '</div>'
      + '<div style="margin-top:10px">' + (F.length ? F.map(card).join('') : '<p class="hint">' + esc(t('لا مهام هنا')) + '</p>') + '</div>'
      + (F.length ? '<button type="button" class="btn btn-primary" data-mtwx="1" style="display:block;width:100%;margin-top:10px">\u2B07 ' + esc(t('نزّل التفاصيل (إكسل)')) + '</button>' : '') + '</div>'; }
  return pop;
}

/* ═══ (V37.65) «تنبيهات الأسبوع» فوق متابعة الوزارة — قرارُ المالك على المقترح:
   ثلاثةُ تنبيهاتٍ بحدٍّ أقصى، كلُّها عن ما تقدر الوزارةُ تحرّكه، ولا تأخيرَ ولا مقارنةَ تدين المشغّل؛ والشريطُ لا يظهر إن خلت. كلُّ تنبيهٍ يفتح نافذتَه وإكسله. ═══ */
function mtNewWeek(id){ var r = STATE.recs[id]; var a = r ? +(r.at || r._at || 0) : 0; return a > 0 && Date.now() - a < 7 * 864e5; }

function mtAlertsHtml(){
  var al = [], sup = wtRows().filter(mtSupNeeded).length;
  if (sup) al.push(mtDot(sup, 'دعم من الوزارة', '\u{1F3DB}', '#2E86DE', ' data-mtwf="sup:min"'));
  var own = 0; mtSites().forEach(function(x){ if (mtGrpOf(x.id) === 'owner' && mtNewWeek(x.id)) own++; });
  if (own) al.push(mtDot(own, 'تحتاج تنسيق مع الجهة المالكة — جديدة هذا الأسبوع', '\u{1F91D}', '#EF4444', mtOpen('sv', 'neww:owner')));
  var appr = 0; mtSites().forEach(function(x){ if (lifeOf(x) === 'minwait') appr++; });
  if (appr) al.push(mtDot(appr, 'جاهزة لاعتماد الوزارة', '\u2705', '#22C55E', mtOpen('sv', 'life:minwait')));
  if (!al.length) return '';
  return '<div class="card mt-alerts" style="margin:0 0 12px"><div class="card-body"><div style="font-weight:700;margin-bottom:8px">\u{1F514} ' + esc(t('تنبيهات الأسبوع')) + '</div>' + mtGrid(al, 200) + '</div></div>';
}
