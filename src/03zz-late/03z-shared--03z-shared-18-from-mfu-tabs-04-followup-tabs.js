/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-18-from-mfu-tabs-04-followup-tabs.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-18-from-mfu-tabs-04-followup-tabs.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : mtDot, mtGrid, mtOpen, mtXlsx, mtSites, mtStepSite, mtCoStats, mtWCard, mtWSt, mtWWho, mtSupNeeded, mtWRows, mtWPopHtml, mtNewWeek, mtAlertsHtml
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* مربعٌ بنقطة لون (للحالات) — attrs يحمل ما يفتحه */
function mtDot(n, label, icon, color, attrs){
  return '<div role="button" tabindex="0"' + attrs + ' title="' + esc(t('اضغط للتفاصيل والإكسل')) + '" style="' + PV.MT_TILE + ';display:flex;align-items:center;gap:10px;cursor:pointer"><span style="width:14px;height:14px;border-radius:50%;background:' + color + ';flex:0 0 auto"></span><div><div class="num" style="font-size:22px;font-weight:800">' + nm(n) + '</div><div style="font-size:13px">' + icon + ' ' + esc(t(label)) + ' \u203A</div></div></div>';
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

/* ── ٥ · ملخص العمل اليومي ── */
function mtStepSite(x){ return x.site || x.sid || x.siteId || ''; }

function mtCoStats(){
  var by = {}; mtSites().forEach(function(x){ if (x.type !== 'مخيم' || !x.co) return; var o = by[x.co] = by[x.co] || { co:x.co, n:0, ready:0, prep:0, coord:0, ins:0, todo:0 }; o.n++; var st = svStOf(x.id); if (st === 'ins' || st === 'sched') o.ins++; else if (o[st] != null) o[st]++; else o.todo++; });
  return Object.keys(by).map(function(k){ var o = by[k]; o.b = o.coord ? 'coord' : o.prep ? 'prep' : (o.ready + o.ins === o.n ? 'ready' : 'todo'); return o; });
}

function mtWCard(r){ var COL = { done:'#22C55E', late:'#EF4444', run:'#2E86DE', wait:'#475569' }, s0 = mtWSt(r);
  return '<div style="' + PV.MT_TILE + ';display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="width:10px;height:10px;border-radius:50%;background:' + COL[s0] + ';flex:0 0 auto"></span><div style="flex:1;min-width:0"><div style="font-size:14px">' + esc(r.n || '\u2014') + '</div><div class="hint" style="margin:2px 0 0;font-size:12px">' + esc(r.who || '\u2014') + (r.due ? ' \u00b7 ' + esc(r.due) : '') + '</div></div><span class="pill">' + esc(t((PV.MT_WST.filter(function(o){ return o.k === s0; })[0] || {}).n || '')) + '</span></div>'; }

function mtWSt(r){ if (r.st === 'مكتمل') return 'done'; if (wtLate(r)) return 'late'; if (r.st === 'جاري العمل') return 'run'; return 'wait'; }

function mtWWho(r){ var w = String(r.who || ''); if (/أفاق|افاق|afaqy/i.test(w)) return 'afaqy'; if (/وزار/.test(w)) return 'min'; if (/شرك|مطوف|خدمة/.test(w)) return 'co'; return 'other'; }

function mtSupNeeded(r){ if (mtWWho(r) !== 'min' || r.st === 'مكتمل') return false; var d = wtDue(r); return d != null && d <= 7; }

/* (V37.65) «دعم من الوزارة» — تسميةُ المالك */
function mtWRows(){ var R = wtRows(); if (!PV.MT_WF) return R; var p = PV.MT_WF.split(':'); return R.filter(function(r){ return p[0] === 'sup' ? mtSupNeeded(r) : p[0] === 'st' ? mtWSt(r) === p[1] : mtWWho(r) === p[1]; }); }

function mtWPopHtml(card){
  card = card || mtWCard;   /* (V37.65) النافذةُ نفسُها من المهام الأسبوعية ومن تنبيه الملخّص */
  var pop = '';
  if (PV.MT_WPOP && PV.MT_WF){ var F = mtWRows(), p = PV.MT_WF.split(':'), lab = p[0] === 'sup' ? 'دعم من الوزارة' : p[0] === 'st' ? (PV.MT_WST.filter(function(o){ return o.k === p[1]; })[0] || {}).n : (PV.MT_WWHO.filter(function(o){ return o.k === p[1]; })[0] || {}).n;
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
