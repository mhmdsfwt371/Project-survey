/* ============================================================================
   FILE    : src/04-office/04-tasks-office-26-pipeline.js
   DOMAIN  : Office — the stage pipeline on the follow-up summary (V46.3)
   PURPOSE : Where every point stands now, as one line of stages: a node per stage with its count, flowing dashed green
             lines between occupied stages, a red pulse on a stage where something has waited over 7 days; a node opens
             the detail window with those points (the full list, a bar per person, the late ones in red, Excel)
   DEFINES : PV.PIPE, PV.PIPE_WAIT_D, pipeCounts, pipeWaitDays, pipeReg, stagePipe
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
