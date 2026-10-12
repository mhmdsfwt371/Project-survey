
/* ═══ (V37.62) تبويباتُ متابعة الوزارة الخمسة بفكرة الملخّص — قرارُ المالك: «الوزارة عاوزة تتابع بأسهل طريقة ممكنة» ═══
   القالبُ الواحد: حلقةٌ كبيرة (كم من كم) ← مربعاتٌ بأيقونةٍ ورقمٍ وكلمة ← كلُّ مربعٍ يفتح لوحتَه وإكسلَه (والمهامُّ تُصفّى في مكانها).
   القواعد: كلُّ نقطةٍ (أو مهمةٍ) في مربعٍ واحدٍ من كلِّ قسم فالأرقامُ تجمع؛ لا عمرَ معوِّقٍ ولا مقارنةً تُدين المشغّل؛ والتفاصيلُ القديمةُ كاملةً في قسمٍ مطويّ. */
var MT_TILE = 'background:var(--surface-2);border-radius:14px;padding:12px;touch-action:manipulation';
function mtHero(pct, big, sub, color, label){
  return '<div style="display:flex;align-items:center;gap:16px;' + MT_TILE + ';margin:10px 0">' + svRing(pct, 100, color, label || (nm(pct) + '\u066A'))
    + '<div><div class="num" style="font-size:30px;font-weight:800;line-height:1.1">' + big + '</div><div class="hint" style="margin:2px 0 0;font-size:14px">' + sub + '</div></div></div>';
}
function mtSec(title, extra){ return '<div class="hint" style="margin:6px 0 6px;font-size:14px">' + esc(t(title)) + (extra || '') + '</div>'; }
/* مربعٌ بنقطة لون (للحالات) — attrs يحمل ما يفتحه */
function mtDot(n, label, icon, color, attrs){
  return '<div role="button" tabindex="0"' + attrs + ' title="' + esc(t('اضغط للتفاصيل والإكسل')) + '" style="' + MT_TILE + ';display:flex;align-items:center;gap:10px;cursor:pointer"><span style="width:14px;height:14px;border-radius:50%;background:' + color + ';flex:0 0 auto"></span><div><div class="num" style="font-size:22px;font-weight:800">' + nm(n) + '</div><div style="font-size:13px">' + icon + ' ' + esc(t(label)) + ' \u203A</div></div></div>';
}
/* مربعٌ بأيقونةٍ كبيرة (للأسباب والأنواع) */
function mtIcon(v, label, icon, attrs){
  return '<div role="button" tabindex="0"' + attrs + ' title="' + esc(t('اضغط للتفاصيل والإكسل')) + '" style="' + MT_TILE + ';text-align:center;padding:10px 6px;cursor:pointer"><div style="font-size:24px">' + icon + '</div><div class="num" style="font-size:18px;font-weight:800;margin-top:2px">' + v + '</div><div style="font-size:12px">' + esc(t(label)) + ' \u203A</div></div>';
}
function mtGrid(cells, min){ return cells.length ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(' + (min || 150) + 'px,1fr));gap:8px;margin-bottom:12px">' + cells.join('') + '</div>' : ''; }
function mtDetails(title, html, icon){ return '<details class="mt-more" style="margin-top:14px"><summary>' + (icon ? icon + ' ' : '') + esc(t(title)) + '</summary>' + html + '</details>'; }   /* فئةٌ خاصة: details.mfu-add للنماذج القديمة داخلها */
function mtOpen(list, sub, zone){ return ' data-svlist="' + esc(list) + '"' + (sub ? ' data-svsub0="' + esc(sub) + '"' : '') + (zone ? ' data-svzone="' + esc(zone) + '"' : ''); }
function mtAllBtn(kind){ return '<button type="button" class="btn btn-secondary" data-mtx="' + kind + '" style="display:block;width:100%;margin-top:14px">\u2B07 ' + esc(t('نزّل كل تفاصيل التبويب (إكسل)')) + '</button>'; }
function mtXlsx(name, head, rows){
  if (!rows.length){ toast(t('لا بيانات بعد')); return false; }
  return xlsxLoad().then(function(ok){ if (!ok){ toast(t('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة')); return false; }
    var aoa = [head.map(function(h){ return t(h); })].concat(rows), wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = head.map(function(_, i){ var w0 = 10; aoa.forEach(function(r){ w0 = Math.max(w0, Math.min(50, String(r[i] == null ? '' : r[i]).length + 2)); }); return { wch:w0 }; }); wb.Workbook = { Views:[{ RTL:true }] };
    XLSX.utils.book_append_sheet(wb, ws, t(name).slice(0, 30)); XLSX.writeFile(wb, t(name) + ' — ' + dayKey() + '.xlsx'); logEvent('تصدير ' + name + ' — ' + rows.length); toast(t('نزل الملف')); return true; });
}
function mtTabXlsx(kind){   /* (V37.63) كلُّ تفاصيل التبويب في ملفٍّ واحد */
  var stN = function(id){ var o = SV_ST.filter(function(z){ return z.k === svStOf(id); })[0]; return o ? t(o.n) : ''; };
  if (kind === 'week') return mtWeekXlsx(true);
  if (kind === 'inst') return mtXlsx('حالة التركيبات', ['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'الحالة'], mtSites().map(function(x){ var tx = taxOf(x); return [x.id, x.name || '', t(tx.g), t((TAX_DEF[tx.t] || { l:tx.t }).l), x.co || '', stN(x.id)]; }));
  if (kind === 'obs') return mtXlsx('التحديات والمعوقات', ['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'مين يعالجها', 'أهم تحدي', 'كل التحديات'], mtSites().filter(function(x){ return !!mtGrpOf(x.id); }).map(function(x){ var tx = taxOf(x), g = MT_GRP.filter(function(o){ return o.k === mtGrpOf(x.id); })[0], r = STATE.recs[x.id], pw = svPrimWhy(r), cc = r && svDone(r) ? chalCats(r) : [];
      return [x.id, x.name || '', t(tx.g), t((TAX_DEF[tx.t] || { l:tx.t }).l), x.co || '', g ? t(g.n) : '', pw > -1 ? t(SV_WHY[pw].n) : '', SV_WHY.filter(function(w){ return w.ks.some(function(k){ return cc.indexOf(k) > -1; }); }).map(function(w){ return t(w.n); }).join('، ')]; }));
  if (kind === 'daily'){ var from = Date.now() - 7 * 864e5, KN = { visit:'زيارة', ins:'تركيب', dis:'فك' };
    return mtXlsx('ملخص العمل اليومي', ['التاريخ', 'الوقت', 'النوع', 'النقطة', 'الاسم', 'الفني'], (STATE.steps || []).filter(function(x){ return +x.at >= from; }).sort(function(a, b){ return +b.at - +a.at; }).map(function(x){ var sid = mtStepSite(x), sx = siteFind(sid), d = new Date(+x.at); return [dayKey(+x.at), ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2), t(KN[x.kind] || x.kind || ''), sid, sx ? sx.name || '' : '', x.by || '']; })); }
  if (kind === 'cos') return mtXlsx('شركات الخدمة', ['الشركة', 'المخيمات', 'جاهزة', 'مُركّبة أو مجدولة', 'تحتاج تجهيز', 'تحتاج تنسيق', 'لسه', 'حالة الشركة'], mtCoStats().sort(function(a, b){ return (a.ready + a.ins) / a.n - (b.ready + b.ins) / b.n; }).map(function(o){ var b = MT_COB.filter(function(z){ return z.k === o.b; })[0]; return [o.co, o.n, o.ready, o.ins, o.prep, o.coord, o.todo, b ? t(b.n) : '']; }));
  return false;
}
function mtSites(){ return (STATE.sites || []).filter(function(x){ return !x.hidden && !x.deleted; }); }

/* ── ٢ · حالة التركيبات ── */
function mtInst(){
  var S = mtSites(), N = S.length, stc = {};
  S.forEach(function(x){ var k = svStOf(x.id); stc[k] = (stc[k] || 0) + 1; });
  var ins = stc.ins || 0, pct = Math.round(ins / Math.max(1, N) * 100);
  var sts = SV_ST.filter(function(o){ return stc[o.k]; });
  var stTiles = sts.map(function(o){ return mtDot(stc[o.k], o.n, o.e, o.c, o.k === 'todo' ? mtOpen('rem') : mtOpen('sv', 'st:' + o.k)); });
  var bt = {}; S.forEach(function(x){ var ty = taxOf(x).t; var o = bt[ty] = bt[ty] || { n:0, i:0 }; o.n++; if (svStOf(x.id) === 'ins') o.i++; });
  var types = TAX_T.filter(function(ty){ return bt[ty]; }).map(function(ty){ var d = TAX_DEF[ty] || { l:ty, i:'\u25CF' }, o = bt[ty]; return mtIcon(nm(Math.round(o.i / o.n * 100)) + '\u066A', d.l, d.i, mtOpen('sv', 'type:' + ty)); });
  var bz = {}; S.forEach(function(x){ var z = taxOf(x).g; var o = bz[z] = bz[z] || { n:0, i:0 }; o.n++; if (svStOf(x.id) === 'ins') o.i++; });
  var zones = TAX_G.filter(function(z){ return bz[z]; }).map(function(z){ var o = bz[z], p = Math.round(o.i / o.n * 100);
    return '<div role="button" tabindex="0"' + mtOpen('sv', '', z) + ' style="' + MT_TILE + ';text-align:center;cursor:pointer"><div style="display:flex;justify-content:center;margin-bottom:6px">' + svRing(p, 54, '#14B8A6', nm(p) + '\u066A') + '</div><div style="font-size:13px">' + esc(t(z)) + ' \u203A</div><div class="hint num" style="margin:0;font-size:12px">' + nm(o.i) + ' / ' + nm(o.n) + '</div></div>'; });
  return mtHero(pct, nm(ins) + ' <span style="font-size:18px">' + esc(t('من')) + ' ' + nm(N) + '</span>', esc(t('نقطة اتركّبت')), '#14B8A6')
    + mtSec('حالها الآن') + mtGrid(stTiles) + mtSec('حسب النوع') + mtGrid(types, 96) + mtSec('المشاعر') + mtGrid(zones, 96)
    + mtAllBtn('inst') + mtDetails('التفاصيل الكاملة', mfuInst());
}

/* ── ٤ · التحديات والمعوقات ── */
var MT_GRP = [ { k:'make', n:'تصنيع وتجهيز', e:'\u{1F3ED}', c:'#F59E0B', w:[0, 2, 4] }, { k:'study', n:'زيارة تقنية', e:'\u{1F50E}', c:'#2E86DE', w:[1, 5] }, { k:'owner', n:'تنسيق مع المالك', e:'\u{1F91D}', c:'#EF4444', w:[3] }, { k:'access', n:'زيارة أخرى', e:'\u{1F501}', c:'#94A3B8', w:[] } ];
function mtGrpOf(id){ var st = svStOf(id); if (st === 'again') return 'access'; if (st !== 'prep' && st !== 'coord') return ''; var pw = svPrimWhy(STATE.recs[id]); for (var i = 0; i < MT_GRP.length; i++) if (MT_GRP[i].w.indexOf(pw) > -1) return MT_GRP[i].k; return 'study'; }
function mtObs(){
  var S = mtSites(), vis = 0, gc = {}, wc = {}, zc = {}, chal = 0;
  S.forEach(function(x){ var r = STATE.recs[x.id]; if (r && svVisited(r)) vis++; var g = mtGrpOf(x.id); if (!g) return; gc[g] = (gc[g] || 0) + 1;
    if (g !== 'access'){ chal++; var pw = svPrimWhy(r); if (pw > -1) wc[pw] = (wc[pw] || 0) + 1; var z = taxOf(x).g; zc[z] = (zc[z] || 0) + 1; } });
  var pct = Math.round(chal / Math.max(1, vis) * 100);
  var grp = MT_GRP.filter(function(g){ return gc[g.k]; }).map(function(g){ return mtDot(gc[g.k], g.n, g.e, g.c, mtOpen('sv', 'grp:' + g.k)); });
  var why = Object.keys(wc).map(Number).sort(function(a, b){ return wc[b] - wc[a]; }).map(function(wi){ var w = SV_WHY[wi]; return mtIcon(nm(wc[wi]), w.n, w.e, mtOpen('sv', 'why:' + wi)); });
  var zones = TAX_G.filter(function(z){ return zc[z]; }).map(function(z){ return mtIcon(nm(zc[z]), z, '\u{1F4CD}', mtOpen('sv', 'grp:all', z)); });
  return mtHero(pct, nm(chal), esc(t('نقطة عليها تحدي')) + '<br>' + esc(t('من')) + ' ' + nm(vis) + ' ' + esc(t('اتزارت')), '#F59E0B')
    + mtSec('مين يعالجها؟') + mtGrid(grp) + mtSec('التحدي', ' <span class="num">(' + nm(chal) + ')</span>') + mtGrid(why, 96)
    + '<p class="hint" style="margin:-6px 0 12px;font-size:12px">' + esc(t('كلُّ نقطةٍ محسوبةٌ مرةً بأهمِّ تحدٍّ فيها')) + '</p>'
    + mtSec('المشاعر') + mtGrid(zones, 96) + mtAllBtn('obs') + mtDetails('التفاصيل الكاملة وجهات المعالجة', mfuObs());
}

/* ── ٥ · ملخص العمل اليومي ── */
function mtStepSite(x){ return x.site || x.sid || x.siteId || ''; }
function mtDaily(){
  var now = Date.now(), today = dayKey(now), steps = STATE.steps || [], kinds = {}, people = {}, days = [];
  for (var i = 6; i >= 0; i--) days.push({ d:dayKey(now - i * 864e5), n:0 });
  steps.forEach(function(x){ var d = dayKey(+x.at || 0); if (d === today){ kinds[x.kind] = (kinds[x.kind] || 0) + 1; if (x.by) people[x.by] = 1; } days.forEach(function(o){ if (o.d === d) o.n++; }); });
  var tot = Object.keys(kinds).reduce(function(a, k){ return a + kinds[k]; }, 0), tech = Object.keys(people).length;
  var KN = [ ['visit', 'زيارة', '\u{1F6B6}'], ['ins', 'تركيب', '\u{1F527}'], ['dis', 'فك', '\u{1F9E9}'] ];
  var kt = KN.map(function(k){ return mtIcon(nm(kinds[k[0]] || 0), k[1], k[2], mtOpen('sv', 'day:' + today + ':' + k[0])); });
  var mx = Math.max.apply(null, days.map(function(o){ return o.n; }).concat([1]));
  var WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var bars = '<div style="display:flex;align-items:flex-end;gap:6px;height:110px;' + MT_TILE + ';padding:10px 8px 26px;margin-bottom:12px">' + days.map(function(o){ var wd = WD[new Date(o.d + 'T12:00:00').getDay()];
      return '<div role="button" tabindex="0"' + mtOpen('sv', 'day:' + o.d) + ' title="' + esc(t(wd)) + ' \u00b7 ' + nm(o.n) + '" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;cursor:pointer"><span class="num" style="font-size:11px">' + (o.n ? nm(o.n) : '') + '</span><i style="display:block;width:100%;height:' + Math.max(3, Math.round(o.n / mx * 70)) + 'px;background:var(--acc,#2E86DE);border-radius:4px 4px 0 0"></i><span style="font-size:10px;margin-top:4px;white-space:nowrap" class="hint">' + esc(t(wd)) + '</span></div>'; }).join('') + '</div>';
  return mtHero(tot ? 100 : 0, nm(tot), esc(t('خطوة اتعملت النهارده')) + (tech ? '<br>' + esc(t('من')) + ' ' + nm(tech) + ' ' + esc(t('فنيين')) : ''), 'var(--acc,#2E86DE)', esc(t('اليوم')))
    + mtGrid(kt, 96) + mtSec('آخر ٧ أيام — اضغط أي يوم') + bars + mtAllBtn('daily') + mtDetails('تفاصيل ساعة بساعة والشهور', mfuDaily());
}

/* ── ٣ · شركات الخدمة ── */
var MT_COB = [ { k:'ready', n:'مخيماتها جاهزة', e:'\u2705', c:'#22C55E' }, { k:'prep', n:'فيها تجهيز', e:'\u{1F6E0}', c:'#F59E0B' }, { k:'coord', n:'محتاجة تنسيق', e:'\u26A0\uFE0F', c:'#EF4444' }, { k:'todo', n:'لسه', e:'\u23F3', c:'#475569' } ];
var MT_CO_ALL = false;
function mtCoStats(){
  var by = {}; mtSites().forEach(function(x){ if (x.type !== 'مخيم' || !x.co) return; var o = by[x.co] = by[x.co] || { co:x.co, n:0, ready:0, prep:0, coord:0, ins:0, todo:0 }; o.n++; var st = svStOf(x.id); if (st === 'ins' || st === 'sched') o.ins++; else if (o[st] != null) o[st]++; else o.todo++; });
  return Object.keys(by).map(function(k){ var o = by[k]; o.b = o.coord ? 'coord' : o.prep ? 'prep' : (o.ready + o.ins === o.n ? 'ready' : 'todo'); return o; });
}
function mtCos(){
  var C = mtCoStats(), bc = {}; C.forEach(function(o){ bc[o.b] = (bc[o.b] || 0) + 1; });
  var pct = Math.round((bc.ready || 0) / Math.max(1, C.length) * 100);
  var tiles = MT_COB.filter(function(b){ return bc[b.k]; }).map(function(b){ return mtDot(bc[b.k], b.n, b.e, b.c, mtOpen('sv', 'cob:' + b.k)); });
  var rows = C.slice().sort(function(a, b){ return (a.ready + a.ins) / a.n - (b.ready + b.ins) / b.n || b.n - a.n; });
  var shown = MT_CO_ALL ? rows : rows.slice(0, 8);
  var cards = shown.map(function(o){ var ok = o.ready + o.ins, p = Math.round(ok / o.n * 100), col = p >= 100 ? '#22C55E' : p >= 50 ? '#F59E0B' : '#EF4444', need = o.prep + o.coord;
    return '<div role="button" tabindex="0"' + mtOpen('sv', 'co:' + o.co) + ' style="' + MT_TILE + ';display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:6px"><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span>' + esc(o.co) + '</span> \u203A</div><div class="hint" style="margin:2px 0 4px;font-size:12px">' + nm(ok) + ' ' + esc(t('من')) + ' ' + nm(o.n) + ' ' + esc(t('مخيم جاهزة')) + '</div><div style="height:7px;background:var(--line);border-radius:5px;overflow:hidden"><i style="display:block;height:100%;width:' + p + '%;background:' + col + '"></i></div></div>'
      + (need ? '<span class="pill">' + nm(need) + ' ' + esc(t('تجهيز')) + '</span>' : '<span class="pill ok">\u2705</span>') + '</div>'; }).join('');
  return mtHero(pct, nm(bc.ready || 0) + ' <span style="font-size:18px">' + esc(t('من')) + ' ' + nm(C.length) + '</span>', esc(t('شركة مخيماتها جاهزة')), '#22C55E')
    + mtGrid(tiles) + mtSec('الشركات — الأقل جاهزية أولًا') + cards
    + (rows.length > 8 ? '<div class="actions" style="justify-content:center">' + btn(MT_CO_ALL ? t('اعرض الأقل جاهزية فقط') : (t('اعرض الكل') + ' (' + nm(rows.length) + ')'), 'btn-secondary btn-sm', ' data-mtcoall="1"') + '</div>' : '')
    + mtAllBtn('cos') + mtDetails('التفاصيل الكاملة', mfuCos());
}

/* ── ١ · المهام الأسبوعية — تُصفّى في مكانها، والإكسلُ بما تراه ── */
var MT_WF = '', MT_WPOP = false;   /* (V37.63) مربعُ المهام يفتح نافذتَه */
var MT_WST = [ { k:'done', n:'خلصت', e:'\u2705', c:'#22C55E' }, { k:'late', n:'متأخرة', e:'\u23F0', c:'#EF4444' }, { k:'run', n:'شغالين عليها', e:'\u{1F504}', c:'#2E86DE' }, { k:'wait', n:'لسه', e:'\u23F3', c:'#475569' } ];
var MT_WWHO = [ { k:'afaqy', n:'أفاقي', e:'\u{1F3E2}' }, { k:'min', n:'الوزارة', e:'\u{1F3DB}' }, { k:'co', n:'شركة الخدمة', e:'\u26FA' }, { k:'other', n:'أخرى', e:'\u{1F465}' } ];
function mtWSt(r){ if (r.st === 'مكتمل') return 'done'; if (wtLate(r)) return 'late'; if (r.st === 'جاري العمل') return 'run'; return 'wait'; }
function mtWWho(r){ var w = String(r.who || ''); if (/أفاق|افاق|afaqy/i.test(w)) return 'afaqy'; if (/وزار/.test(w)) return 'min'; if (/شرك|مطوف|خدمة/.test(w)) return 'co'; return 'other'; }
function mtWRows(){ var R = wtRows(); if (!MT_WF) return R; var p = MT_WF.split(':'); return R.filter(function(r){ return p[0] === 'st' ? mtWSt(r) === p[1] : mtWWho(r) === p[1]; }); }
function mtWeek(){
  var R = wtRows(), N = R.length, sc = {}, wc = {}; R.forEach(function(r){ var s = mtWSt(r), w = mtWWho(r); sc[s] = (sc[s] || 0) + 1; wc[w] = (wc[w] || 0) + 1; });
  var pct = Math.round((sc.done || 0) / Math.max(1, N) * 100);
  var st = MT_WST.filter(function(o){ return sc[o.k]; }).map(function(o){ return mtDot(sc[o.k], o.n, o.e, o.c, ' data-mtwf="st:' + o.k + '"'); });
  var who = MT_WWHO.filter(function(o){ return wc[o.k]; }).map(function(o){ return mtIcon(nm(wc[o.k]), o.n, o.e, ' data-mtwf="who:' + o.k + '"'); });
  var COL = { done:'#22C55E', late:'#EF4444', run:'#2E86DE', wait:'#475569' };
  var card = function(r){ var s0 = mtWSt(r);
    return '<div style="' + MT_TILE + ';display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="width:10px;height:10px;border-radius:50%;background:' + COL[s0] + ';flex:0 0 auto"></span><div style="flex:1;min-width:0"><div style="font-size:14px">' + esc(r.n || '\u2014') + '</div><div class="hint" style="margin:2px 0 0;font-size:12px">' + esc(r.who || '\u2014') + (r.due ? ' \u00b7 ' + esc(r.due) : '') + '</div></div><span class="pill">' + esc(t((MT_WST.filter(function(o){ return o.k === s0; })[0] || {}).n || '')) + '</span></div>'; };
  var pop = '';
  if (MT_WPOP && MT_WF){ var F = mtWRows(), p = MT_WF.split(':'), lab = p[0] === 'st' ? (MT_WST.filter(function(o){ return o.k === p[1]; })[0] || {}).n : (MT_WWHO.filter(function(o){ return o.k === p[1]; })[0] || {}).n;
    pop = '<div class="svpop-veil" data-mtwclose="1" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000"></div><div class="svpop" role="dialog" aria-modal="true" style="position:fixed;z-index:2001;inset:6vh 4vw auto 4vw;max-height:86vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.35)">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0">' + esc(t('مهام')) + ' \u2014 ' + esc(t(lab || '')) + ' \u2014 ' + nm(F.length) + '</h3>' + btn('\u2715 ' + t('إغلاق'), 'btn-quiet btn-sm', ' data-mtwclose="1"') + '</div>'
      + '<div style="margin-top:10px">' + (F.length ? F.map(card).join('') : '<p class="hint">' + esc(t('لا مهام هنا')) + '</p>') + '</div>'
      + (F.length ? '<button type="button" class="btn btn-primary" data-mtwx="1" style="display:block;width:100%;margin-top:10px">\u2B07 ' + esc(t('نزّل التفاصيل (إكسل)')) + '</button>' : '') + '</div>'; }
  var list = N ? R.slice(0, 40).map(card).join('') : '<p class="hint">' + esc(t('لا مهامَّ أسبوعيةٌ بعد — تُضاف من «تحديث المهام» تحت.')) + '</p>';
  return pop + mtHero(pct, nm(sc.done || 0) + ' <span style="font-size:18px">' + esc(t('من')) + ' ' + nm(N) + '</span>', esc(t('مهمة خلصت')), '#22C55E')
    + mtGrid(st) + mtSec('على مين؟') + mtGrid(who, 96)
    + mtSec('كل المهام', ' <span class="num">(' + nm(N) + ')</span>') + list + (N ? mtAllBtn('week') : '');   /* (V37.63) بلا مهامٍّ لا زرَّ تصدير */
}
function mtWeekXlsx(all){
  var F = all ? wtRows() : mtWRows(); if (!F.length){ toast(t('لا بيانات بعد')); return false; }
  return xlsxLoad().then(function(ok){ if (!ok){ toast(t('تعذّر تحميل محرّك إكسل — تحقّق من الشبكة')); return false; }
    var rows = [[t('المهمة'), t('على مين'), t('موعدها'), t('الحالة'), t('المسار')]].concat(F.map(function(r){ return [r.n || '', r.who || '', r.due || '', t((MT_WST.filter(function(o){ return o.k === mtWSt(r); })[0] || {}).n || ''), r.track || '']; }));
    var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(rows); ws['!cols'] = [{ wch:50 }, { wch:20 }, { wch:12 }, { wch:14 }, { wch:16 }]; wb.Workbook = { Views:[{ RTL:true }] };
    XLSX.utils.book_append_sheet(wb, ws, t('المهام')); XLSX.writeFile(wb, t('المهام الأسبوعية') + ' — ' + dayKey() + '.xlsx'); logEvent('تصدير المهام الأسبوعية — ' + F.length); toast(t('نزل الملف')); return true; });
}
