/* ============================================================================
   FILE    : src/06-ministry/06-mfu-tabs-04-followup-tabs.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Ministry follow-up tabs: installation status, challenges (who handles, which challenge, by location per zone), daily summary.
   DEFINES : mtHero, mtSec, mtDot, mtIcon, mtGrid, mtDetails, mtOpen, mtAllBtn, mtXlsx, mtTabXlsx, mtSites, mtInst, mtGrpOf, obsLocCats … (+25 more)
   GLOBALS : MT_TILE, MT_GRP, MT_COB, MT_CO_ALL, MT_WF, MT_WST, MT_WWHO, HALL_URL, HALL
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

function mtHero(pct, big, sub, color, label){
  return '<div style="display:flex;align-items:center;gap:16px;' + MT_TILE + ';margin:10px 0">' + svRing(pct, 100, color, label || (nm(pct) + '\u066A'))
    + '<div><div class="num" style="font-size:30px;font-weight:800;line-height:1.1">' + big + '</div><div class="hint" style="margin:2px 0 0;font-size:14px">' + sub + '</div></div></div>';
}
function mtSec(title, extra){ return '<div class="hint" style="margin:6px 0 6px;font-size:14px">' + esc(t(title)) + (extra || '') + '</div>'; }

/* مربعٌ بأيقونةٍ كبيرة (للأسباب والأنواع) */
function mtIcon(v, label, icon, attrs){
  return '<div role="button" tabindex="0"' + attrs + ' title="' + esc(t('اضغط للتفاصيل والإكسل')) + '" style="' + MT_TILE + ';text-align:center;padding:10px 6px;cursor:pointer"><div style="font-size:24px">' + icon + '</div><div class="num" style="font-size:18px;font-weight:800;margin-top:2px">' + v + '</div><div style="font-size:12px">' + esc(t(label)) + ' \u203A</div></div>';
}

function mtDetails(title, html, icon){ return '<details class="mt-more" style="margin-top:14px"><summary>' + (icon ? icon + ' ' : '') + esc(t(title)) + '</summary>' + html + '</details>'; }   
function mtAllBtn(kind){ return '<button type="button" class="btn btn-secondary" data-mtx="' + kind + '" style="display:block;width:100%;margin-top:14px">\u2B07 ' + esc(t('نزّل كل تفاصيل التبويب (إكسل)')) + '</button>'; }

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
    return '<div role="button" tabindex="0"' + mtOpen('sv', '', z) + ' style="' + MT_TILE + ';text-align:center;cursor:pointer"><div style="display:flex;justify-content:center;margin-bottom:6px">' + svRing(p, 54, '#3AD6A0', nm(p) + '\u066A') + '</div><div style="font-size:13px">' + esc(t(z)) + ' \u203A</div><div class="hint num" style="margin:0;font-size:12px">' + nm(o.i) + ' / ' + nm(o.n) + '</div></div>'; });
  return mtHero(pct, nm(ins) + ' <span style="font-size:18px">' + esc(t('من')) + ' ' + nm(N) + '</span>', esc(t('نقطة اتركّبت')), '#3AD6A0')
    + mtSec('حالها الآن') + mtGrid(stTiles) + mtSec('حسب النوع') + mtGrid(types, 96) + mtSec('المشاعر') + mtGrid(zones, 96)
    + mtAllBtn('inst') + mtDetails('التفاصيل الكاملة', mfuInst());
}

/* ── ٤ · التحديات والمعوقات ── */

MT_GRP.forEach(function(g){ var G = CC_GROUPS.filter(function(x){ return x.g === g.k; })[0]; g.n = G ? G.n : g.k; });

/* ═══ (V38.22) التحدياتُ «حسب الموقع» — في كلِّ منطقة: تحت كوبري · مدخلُ أو مخرجُ نفق · لوحاتٌ استرشادية · بدون هيكل،
   والممراتُ وحدَها والمخيماتُ وحدَها (طلبُ المالك). الكوبري والنفقُ واللوحاتُ من اختيار الفني القديم أو كلماتِ وصف التحدي
   والملاحظة — لا من اسم فئة «عائق في الموقع (… نفق أو كوبري)» نفسِه؛ و«بدون هيكل» فئةُ «لا يوجد سطح تثبيت». النقطةُ قد
   تقع في أكثرَ من فئة. كلُّ رقمٍ يفتح قائمتَه بمنطقتها، وفيها الإكسل. */
function obsLocCats(){
  /* (V38.25) خياراتُ المالك الستّ بترتيبها — و«نفق — غير محدد» لزياراتٍ لم تُحدِّد مدخلًا أو مخرجًا (يظهر إن وُجد) */
  return [['bridge', '\u{1F309}', 'تحت كوبري'], ['tin', '\u{1F687}', 'مدخل نفق'], ['tout', '\u{1F687}', 'مخرج نفق'], ['tgen', '\u{1F687}', 'نفق — غير محدد'],
          ['sign', '\u{1FAA7}', 'لوحة استرشادية'], ['nomount', '\u{1F3D7}', 'بدون إطار معدني للتثبيت'], ['canopy', '\u26F1', 'على مظلة']];
}
function obsLocGroups(){ return [['p', 'ممر', 'ممرات'], ['j', 'جسر', 'الجمرات'], ['c', 'كاميرا', 'كاميرات الوزارة'], ['s', 'محطة', 'المحطات'], ['g', 'بوابة', 'البوابات'], ['o', '*', 'نقاط أخرى']]; }   
function obsLocKey(k, g){ return 'loc_' + k + '_' + g; }
function obsLocGrp(x){ var G = obsLocGroups(); for (var i = 0; i < G.length; i++) if (G[i][1] === x.type) return G[i][0]; return 'o'; }
function obsLocLists(){
  obsLocCats().forEach(function(c){
    obsLocGroups().forEach(function(g){
      var key = obsLocKey(c[0], g[0]); if (MFU.lists[key]) return;
      MFU.lists[key] = { title:c[1] + ' ' + c[2] + ' — ' + g[2],
        head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'المصدر', 'موقع النقطة', 'وصف التحدي', 'الملاحظة'],
        rows:function(){
          return mtSites().filter(function(x){ return g[1] === '*' ? obsLocGrp(x) === 'o' : x.type === g[1]; }).map(function(x){ var tg = obsLocTags(x); return tg && tg[c[0]] ? [x, tg[c[0]]] : null; }).filter(Boolean)
            .map(function(p){ var x = p[0], r = STATE.recs[x.id] || {};
              return [x.id, x.name || '', taxOf(x).g, x.type, x.co || '', t(p[1]), locList(r.loc).map(function(v){ return t(v); }).join(' \u00b7 '), String(r.chal_note || ''), String(r.note || '')]; });
        } };
    });
  });
}
function mtObsLoc(){
  obsLocLists();
  var Z = {}, any = 0;
  mtSites().forEach(function(x){
    var tg = obsLocTags(x); if (!tg) return;
    var z = taxOf(x).g, gg = obsLocGrp(x);
    Object.keys(tg).forEach(function(k){ var o = Z[z] = Z[z] || {}; var c0 = o[k] = o[k] || {}; c0[gg] = (c0[gg] || 0) + 1; any++; });
  });
  if (!any) return '';
  var groups = obsLocGroups();
  var blocks = TAX_G.filter(function(z){ return Z[z]; }).map(function(z){
    var o = Z[z];
    var cells = obsLocCats().filter(function(c){ return c[0] !== 'tgen' || o.tgen; }).map(function(c){
      var v = o[c[0]] || {}, chips = groups.filter(function(g){ return v[g[0]]; }).map(function(g){
        return '<button type="button" class="chip"' + mtOpen(obsLocKey(c[0], g[0]), '', z) + ' style="margin:2px">' + esc(t(g[2])) + ' <b class="num">' + nm(v[g[0]]) + '</b></button>'; }).join('');
      return '<div style="border:1px solid var(--line);border-radius:12px;padding:8px 10px"><div style="font-size:13px;margin:0 0 4px">' + c[1] + ' ' + esc(t(c[2])) + '</div>'
        + (chips || '<span class="hint" style="margin:2px 6px;font-size:12px">\u2014</span>') + '</div>';
    }).join('');
    return '<div style="' + MT_TILE + ';margin:0 0 10px"><div style="font-weight:700;margin:0 0 8px">\u{1F4CD} ' + esc(t(z)) + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">' + cells + '</div></div>';
  }).join('');
  /* (V38.78) corridors and Jamarat count from «موقع النقطة» alone — the office sees which of them were visited without one */
  var none = '';
  if (ROLE !== 'viewer' && rankOf(ROLE) >= rankOf('engineer')){
    MFU.lists.locnone = MFU.lists.locnone || { title:'ممرات وجمرات زيرت بلا اختيار «موقع النقطة»', head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'الزائر'],
      rows:function(){ return mtSites().filter(function(x){ var r = STATE.recs[x.id]; return locOnly(x) && r && svVisited(r) && !locList(r.loc).length && !insDone(x.id); })
        .map(function(x){ var r = STATE.recs[x.id] || {}; return [x.id, x.name || '', taxOf(x).g, x.type, x.co || '', r.by || '']; }); } };
    var nn = MFU.lists.locnone.rows().length;
    if (nn) none = '<p class="hint" style="margin:-6px 0 12px;font-size:12px"><button type="button" class="chip"' + mtOpen('locnone', '', '') + ' style="margin:0 0 0 6px"><b class="num">' + nm(nn) + '</b></button>' + esc(t('ممرات وجمرات زيرت بلا اختيار «موقع النقطة» — لا تُعدّ عليها تحديات حتى يُحدَّد موقعها من «تعديل المسح»')) + '</p>';
  }
  return mtSec('حسب الموقع — في كل منطقة') + blocks
    + '<p class="hint" style="margin:-4px 0 12px;font-size:12px">' + esc(t('الممرات والجمرات من «موقع النقطة» وحده، وباقي النقاط عدا المخيمات ومراكز التفويج من «موقع النقطة» وللزيارات الأقدم بلا اختيار من كلمات وصف التحدي والملاحظة · كلُّها تحدٍّ عدا «على مظلة» (واللوحة التي عليها مظلة) · اضغط الرقم لقائمته وإكسلها')) + '</p>' + none;
}
function mtObs(){
  var S = mtSites(), vis = 0, gc = {}, wc = {}, zc = {}, chal = 0;
  S.forEach(function(x){ var r = STATE.recs[x.id]; if (r && svVisited(r)) vis++; var g = mtGrpOf(x.id); if (!g) return; gc[g] = (gc[g] || 0) + 1;
    if (g !== 'access'){ chal++; var pw = svPrimWhy(r); if (pw > -1) wc[pw] = (wc[pw] || 0) + 1; var z = taxOf(x).g; zc[z] = (zc[z] || 0) + 1; } });
  var pct = Math.round(chal / Math.max(1, vis) * 100);
  var grp = MT_GRP.filter(function(g){ return gc[g.k]; }).map(function(g){ return mtDot(gc[g.k], g.n, g.e, g.c, mtOpen('sv', 'grp:' + g.k)); });
  var why = Object.keys(wc).map(Number).sort(function(a, b){ return wc[b] - wc[a]; }).map(function(wi){ var w = SV_WHY[wi]; return mtIcon(nm(wc[wi]), w.n, w.e, mtOpen('sv', 'why:' + wi)); });
  var zones = TAX_G.filter(function(z){ return zc[z]; }).map(function(z){ return mtIcon(nm(zc[z]), z, '\u{1F4CD}', mtOpen('sv', 'grp:all', z)); });
  return mtHero(pct, nm(chal), esc(t('نقطة عليها تحدي')) + '<br>' + esc(t('من')) + ' ' + nm(vis) + ' ' + esc(t('اتزارت')), '#F59E0B')
    + mtObsLoc()   /* (V38.22) حسب الموقع في كلِّ منطقة */
    + mtSec('مين يعالجها؟') + mtGrid(grp) + mtSec('التحدي', ' <span class="num">(' + nm(chal) + ')</span>') + mtGrid(why, 96)
    + '<p class="hint" style="margin:-6px 0 12px;font-size:12px">' + esc(t('كلُّ نقطةٍ محسوبةٌ مرةً بأهمِّ تحدٍّ فيها')) + '</p>'
    + mtSec('المشاعر') + mtGrid(zones, 96) + mtAllBtn('obs') + mtDetails('التفاصيل الكاملة وجهات المعالجة', mfuObs());
}

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

var MT_CO_ALL = false;

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

   

   
function mtWeek(){
  var R = wtRows(), N = R.length, sc = {}, wc = {}; R.forEach(function(r){ var s = mtWSt(r), w = mtWWho(r); sc[s] = (sc[s] || 0) + 1; wc[w] = (wc[w] || 0) + 1; });
  var pct = Math.round((sc.done || 0) / Math.max(1, N) * 100);
  var st = MT_WST.filter(function(o){ return sc[o.k]; }).map(function(o){ return mtDot(sc[o.k], o.n, o.e, o.c, ' data-mtwf="st:' + o.k + '"'); });
  var who = MT_WWHO.filter(function(o){ return wc[o.k]; }).map(function(o){ return mtIcon(nm(wc[o.k]), o.n, o.e, ' data-mtwf="who:' + o.k + '"'); });
  var COL = { done:'#22C55E', late:'#EF4444', run:'#2E86DE', wait:'#475569' };
  var card = function(r){ var s0 = mtWSt(r);
    return '<div style="' + MT_TILE + ';display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="width:10px;height:10px;border-radius:50%;background:' + COL[s0] + ';flex:0 0 auto"></span><div style="flex:1;min-width:0"><div style="font-size:14px">' + esc(r.n || '\u2014') + '</div><div class="hint" style="margin:2px 0 0;font-size:12px">' + esc(r.who || '\u2014') + (r.due ? ' \u00b7 ' + esc(r.due) : '') + '</div></div><span class="pill">' + esc(t((MT_WST.filter(function(o){ return o.k === s0; })[0] || {}).n || '')) + '</span></div>'; };
  var pop = mtWPopHtml(card);
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

/* ═══ (V37.74) «رابط القاعة» — قرارُ المالك (البند ٦): جهازُ القاعة يفتح عرضَ القاعة بنفسه بلا ضغطة ═══
   الرابطُ ‎?hall=1 بعد الدخول يفتح ملخّصَ المتابعة في وضع القاعة، ويُبقي الشاشةَ مضيئة (قفلُ السكون)، ويسحب الجديدَ كلَّ خمس دقائق،
   ويعرض ساعةً و«آخر تحديث» في الزاوية، ويُخفي المؤشّرَ بعد ثلاث ثوانٍ بلا حركة، ويطلب ملءَ الشاشة عند أوّل لمسة (المتصفّحُ يشترط لمسة).
   وفي شريط الوضع زرُّ «🔗 رابط القاعة» ينسخه أو يشاركه. */
var HALL_URL = (typeof location !== 'undefined') && /[?&#]hall(=1)?\b/.test(String(location.search) + String(location.hash));
var HALL = { on:false, t:null, pull:null, at:0, idle:null };
function hallLink(){ return location.origin + location.pathname + '?hall=1'; }
function hallCopy(){ var u = hallLink();
  if (navigator.share){ navigator.share({ title:t('عرض القاعة'), url:u }).catch(function(){}); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(function(){ toast(t('نُسخ رابط القاعة — افتحه على جهاز القاعة بعد الدخول بحسابه')); }, function(){ toast(u); }); else toast(u); }
function hallClock(){ var el = document.getElementById('hallClock'); if (!document.body.classList.contains('kiosk')){ if (el) el.remove(); return; }
  if (!el){ el = document.createElement('div'); el.id = 'hallClock'; el.style.cssText = 'position:fixed;top:10px;inset-inline-start:12px;z-index:3000;background:rgba(0,0,0,.55);color:#fff;border-radius:12px;padding:6px 12px;font-size:15px;pointer-events:none'; document.body.appendChild(el); }
  var d = new Date(), hh = function(x){ return ('0' + x).slice(-2); }, last = (STATE.meta && STATE.meta.lastSync) || HALL.at;
  el.innerHTML = '<b class="num">' + nm(hh(d.getHours())) + ':' + nm(hh(d.getMinutes())) + '</b>' + (last ? ' \u00b7 <span style="opacity:.8">' + esc(t('آخر تحديث')) + ' <span class="num">' + nm(hh(new Date(last).getHours())) + ':' + nm(hh(new Date(last).getMinutes())) + '</span></span>' : ''); }
function hallBoot(){
  if (!HALL_URL || HALL.on) return; if (!document.getElementById('nav') || typeof ROLE === 'undefined' || !ROLE) return;   /* بعد الدخول */
  HALL.on = true; try { goPage('mfu'); PTAB.mfu = 'mfu'; } catch (e){ LS_ERR = e; }
  setTimeout(function(){ if (typeof KIOSK_ON !== 'undefined' && !KIOSK_ON) kioskToggle(); if (typeof wakeAcquire === 'function') wakeAcquire(); hallClock(); }, 400);
  HALL.t = setInterval(hallClock, 30000);
  HALL.pull = setInterval(function(){ if (typeof pullDelta === 'function') pullDelta().then(function(){ HALL.at = Date.now(); if (typeof render === 'function') render(1); hallClock(); }).catch(function(){}); }, 300000);
  var fsOnce = function(){ try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function(){}); } catch (e){ LS_ERR = e; } document.removeEventListener('click', fsOnce, true); };
  document.addEventListener('click', fsOnce, true);
  var idle = function(){ document.body.classList.remove('hall-idle'); clearTimeout(HALL.idle); HALL.idle = setTimeout(function(){ if (document.body.classList.contains('kiosk')) document.body.classList.add('hall-idle'); }, 3000); };
  ['mousemove', 'touchstart', 'keydown'].forEach(function(ev){ document.addEventListener(ev, idle, { passive:true }); }); idle();
  toast(t('عرض القاعة — المس الشاشة مرةً لملئها'));
}
if (typeof setInterval === 'function' && HALL_URL) var HALL_BOOT_T = setInterval(function(){ hallBoot(); if (HALL.on) clearInterval(HALL_BOOT_T); }, 1000);
