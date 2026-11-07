/* ============================================================================
   FILE    : src/04-office/04-tasks-office-26-pipeline.js
   DOMAIN  : Office — the stage pipeline on the follow-up summary (V46.3)
   PURPOSE : Where every point stands now, as one line of stages: a node per stage with its count, flowing dashed green
             lines between occupied stages, a red pulse on a stage where something has waited over 7 days; a node opens
             the detail window with those points (the full list, a bar per person, the late ones in red, Excel)
   DEFINES : dsListReg, dsBento, PV.PIPE, PV.PIPE_WAIT_D, pipeCounts, pipeWaitDays, pipeReg, stagePipe
   ============================================================================ */
/* the owner's spec: «a stage pipeline (for anything with stages): nodes with counts, dashed green lines that flow between
   occupied stages, red pulse on a stage where something waits too long, click a stage…». Stages group the lifecycle as the
   field lives it; a stage that waits on someone (the engineer, the tafweej management, scheduling) counts its points idle
   over 7 days since the last thing that happened to them (the visit or its review). */
PV.PIPE = [
  { k:'todo',   n:'لم تُزر',                st:['todo', 'assigned', 'tomorrow'] },
  { k:'again',  n:'تحتاج زيارة أخرى',       st:['stuck', 'tech', 'revisit'] },
  { k:'review', n:'تنتظر اعتماد المهندس',   st:['visited'], wait:1 },
  { k:'taf',    n:'بانتظار إدارة التفويج',  st:['minwait'], wait:1 },
  { k:'ready',  n:'معتمدة — للجدولة',       st:['ready'], wait:1 },
  { k:'sched',  n:'مجدولة وقيد التركيب',    st:['sched', 'inprog', 'insfail'] },
  { k:'ins',    n:'مُركّبة',                st:['installed'] },
  { k:'hand',   n:'سُلِّمت',                st:['handed'] }
];
PV.PIPE_WAIT_D = 7;
function pipeWaitDays(id){
  var r = STATE.recs[id]; if (!r) return 0;
  var at = +(r.revAt || r.at || 0); if (!at) return 0;
  var d = Math.floor((Date.now() - at) / 86400000); return d > PV.PIPE_WAIT_D ? d : 0;
}
function pipeCounts(){
  var by = {}, late = {}; PV.PIPE.forEach(function(p){ by[p.k] = []; late[p.k] = 0; });
  var map = {}; PV.PIPE.forEach(function(p){ p.st.forEach(function(s){ map[s] = p; }); });
  (typeof svListSites === 'function' ? svListSites() : (STATE.sites || [])).forEach(function(x){
    var p = map[lifeOf(x)]; if (!p) return; by[p.k].push(x); if (p.wait && pipeWaitDays(x.id)) late[p.k]++;
  });
  return { by:by, late:late };
}
function pipeReg(C){
  PV.PIPE.forEach(function(p){
    var key = 'pipe|' + p.k;
    MFU.lists[key] = { title:t(p.n),
      base:function(){ var L = typeof svListSites === 'function' ? svListSites() : (STATE.sites || []); return { n:L.length, name:t('كلِّ النقاط'), zones:svZoneTot(L) }; },
      head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'آخر زيارة', 'بواسطة', 'الحالة'],
      rows:function(){ return (pipeCounts().by[p.k] || []).map(function(x){ var r = STATE.recs[x.id], c = taxOf(x);
        return [x.id, String(x.name || ''), t(c.g), t(c.t), String(x.co || ''), r && (r.revAt || r.at) ? dayKey(+(r.revAt || r.at)) : '', r ? (r.by || '') : '', t((LIFE[lifeOf(x)] || {}).n || '')]; }); } };
  });
}
function stagePipe(){
  var C = pipeCounts(); pipeReg(C);
  var nodes = PV.PIPE.map(function(p, i){
    var n = C.by[p.k].length, l = C.late[p.k], nxt = PV.PIPE[i + 1], flow = nxt && n && C.by[nxt.k].length;
    return '<button type="button" class="ds-node' + (n ? ' on' : '') + (l ? ' late' : '') + '" data-svlist="pipe|' + p.k + '" title="' + esc(t(p.n)) + '">'
      + '<b class="num">' + nm(n) + '</b><span>' + esc(t(p.n)) + '</span>'
      + (l ? '<em class="ds-late">' + nm(l) + ' ' + esc(t('متوقّفة')) + '</em>' : '') + '</button>'
      + (nxt ? '<i class="ds-link' + (flow ? ' flow' : '') + '" aria-hidden="true"></i>' : '');
  }).join('');
  return '<div class="card ds-pipe-card" style="margin:12px 0"><div class="pid">' + esc(t('خطُّ المراحل — أين تقف كلُّ نقطةٍ الآن')) + '</div>'
    + '<div class="ds-pipe">' + nodes + '</div>'
    + '<div class="hint" style="margin:8px 0 0">' + esc(t('اضغط مرحلةً لتفتح نقاطها. الأحمرُ: نقاطٌ تنتظر أكثرَ من ٧ أيام منذ آخر ما حدث لها.')) + '</div></div>';
}

/* (V46.4) the owner's spec — «bento summary grid: a 2×2 hero tile (total + a bar split by real sources), a 2×1 tile with a slowly
   turning gradient edge, a tile with an SVG ring (closed ÷ total) that fills on first view. Every visual is built from live
   numbers», and every tile opens the detail window. The split is by holy site; «closed» is installed or handed over. */
PV.BENTO_C = ['#4CC35A', '#2E9C7E', '#E0A32E', '#7FB2E5', '#C9A27E', '#9FB0AA'];
function dsBento(SC){
  var L = typeof svListSites === 'function' ? svListSites() : (STATE.sites || []), n = L.length, z = {};
  L.forEach(function(x){ var g = taxOf(x).g || '\u2014'; z[g] = (z[g] || 0) + 1; });
  var zk = Object.keys(z).sort(function(a, b){ return z[b] - z[a]; });
  var today = dayKey(Date.now()), tv = L.filter(function(x){ var r = STATE.recs[x.id]; return r && r.at && dayKey(+r.at) === today; });
  var C = pipeCounts(), closed = C.by.ins.length + C.by.hand.length, pc = n ? Math.round(closed / n * 100) : 0, R = 40, len = 2 * Math.PI * R;
  MFU.lists['bento|all'] = { title:t('كلُّ النقاط'), head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'آخر زيارة', 'بواسطة', 'الحالة'],
    base:function(){ return { n:L.length, name:t('كلِّ النقاط'), zones:svZoneTot(L) }; },
    rows:function(){ return L.map(function(x){ var r = STATE.recs[x.id], c = taxOf(x); return [x.id, String(x.name || ''), t(c.g), t(c.t), String(x.co || ''), r && r.at ? dayKey(+r.at) : '', r ? (r.by || '') : '', t((LIFE[lifeOf(x)] || {}).n || '')]; }); } };
  MFU.lists['bento|today'] = { title:t('زيارات اليوم'), head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'آخر زيارة', 'بواسطة', 'الحالة'],
    base:function(){ return { n:L.length, name:t('كلِّ النقاط'), zones:svZoneTot(L) }; },
    rows:function(){ return tv.map(function(x){ var r = STATE.recs[x.id], c = taxOf(x); return [x.id, String(x.name || ''), t(c.g), t(c.t), String(x.co || ''), dayKey(+r.at), r.by || '', t((LIFE[lifeOf(x)] || {}).n || '')]; }); } };
  MFU.lists['bento|closed'] = { title:t('مُركّبة أو سُلِّمت'), head:MFU.lists['bento|all'].head, base:MFU.lists['bento|all'].base,
    rows:function(){ return MFU.lists['bento|all'].rows().filter(function(r){ var x = siteFind(r[0]); return x && /^(installed|handed)$/.test(lifeOf(x)); }); } };
  if (!MFU.lists['pipe|taf']) pipeReg(C);
  return '<div class="ds-bento">'
    + '<button type="button" class="ds-b hero" data-svlist="bento|all"><div class="k">' + esc(t('كلُّ النقاط')) + '</div><div class="v num">' + nm(n) + '</div>'
    +   '<div class="ds-split">' + zk.map(function(k, i){ return '<i style="width:' + (z[k] / n * 100).toFixed(2) + '%;background:' + PV.BENTO_C[i % PV.BENTO_C.length] + ';animation-delay:' + (i * 80) + 'ms"></i>'; }).join('') + '</div>'
    +   '<div class="ds-leg">' + zk.map(function(k, i){ return '<span style="--c:' + PV.BENTO_C[i % PV.BENTO_C.length] + '">' + esc(t(k)) + ' <b class="num">' + nm(z[k]) + '</b></span>'; }).join('') + '</div></button>'
    + '<button type="button" class="ds-b wide edge" data-svlist="bento|today"><div class="k">' + esc(t('زيارات اليوم')) + '</div><div class="v num">' + nm(tv.length) + '</div><div class="hint" style="margin:0">' + esc(today) + '</div></button>'
    + '<button type="button" class="ds-b ring" data-svlist="bento|closed"><svg class="ds-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="tr" cx="50" cy="50" r="' + R + '"/><circle class="fg" cx="50" cy="50" r="' + R + '" stroke-dasharray="' + len.toFixed(1) + '" style="--len:' + len.toFixed(1) + ';--off:' + (len * (1 - pc / 100)).toFixed(1) + '"/></svg>'
    +   '<div><div class="k">' + esc(t('مُركّبة أو سُلِّمت')) + '</div><div class="v num">' + nm(pc) + '\u066A</div><div class="hint" style="margin:0">' + nm(closed) + ' / ' + nm(n) + '</div></div></button>'
    + '<button type="button" class="ds-b" data-svlist="pipe|taf"><div class="k">' + esc(t('بانتظار إدارة التفويج')) + '</div><div class="v num">' + nm(C.by.taf.length) + '</div>' + (C.late.taf ? '<span class="ds-late">' + nm(C.late.taf) + ' ' + esc(t('متوقّفة')) + '</span>' : '') + '</button>'
    + '</div>';
}

/* (V46.5) a key handed out by dsList() becomes a detail-window list on first open */
function dsListReg(key){
  var D = PV.DSL && PV.DSL[key]; if (!D) return;
  if (D.head){ MFU.lists[key] = { title:t(D.title), head:D.head, rows:function(){ return D.items; }, base:function(){ return { n:D.items.length, name:t(D.title), zones:{} }; } }; return; }   /* (V46.6) a list of tasks, shipments, vehicles… */
  var pts = function(){ return (D.items || []).map(function(v){ return typeof v === 'string' ? siteFind(v) : (v && v.x ? v.x : v); }).filter(Boolean); };
  MFU.lists[key] = { title:t(D.title), head:['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'آخر زيارة', 'بواسطة', 'الحالة'],
    base:function(){ var L = STATE.sites || []; return { n:L.length, name:t('كلِّ النقاط'), zones:svZoneTot(L) }; },
    rows:function(){ return pts().map(function(x){ var r = STATE.recs[x.id], c = taxOf(x);
      return [x.id, String(x.name || ''), t(c.g), t(c.t), String(x.co || ''), r && r.at ? dayKey(+r.at) : '', r ? (r.by || '') : '', t((LIFE[lifeOf(x)] || {}).n || '')]; }); } };
}
