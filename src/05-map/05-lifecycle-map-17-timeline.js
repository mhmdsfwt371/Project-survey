/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-17-timeline.js
   DOMAIN  : Map — the time slider (the season replayed)
   PURPOSE : (V39.17) owner: a time slider that replays the season — drag it and the map shows the Holy Sites as they
             were on that day: what had been visited, installed, dismantled. Every record carries the moment it was
             written (the visit's `at`, the installation's `at`, the dismantling's `at`), and the slider colours each
             point by the furthest stage reached by that day: grey not yet visited, the survey colour visited, the
             installation colour installed, the dismantling colour dismantled. It overrides the point colour alone,
             on both maps, while it is on; the points, counts and filters stay as they are. It reads and never writes.
   DEFINES : timeDay, timeState, timeRange, timeStageAt, timeColorOf, timeBarHtml, timeSet, timeStep, timePlayToggle
   PREFIX  : time   (every function here starts with it — scripts/audit-names.mjs)
   STATE   : timeState() — the switch, the chosen day and the player — on the function, no new global.
   ============================================================================ */

/* midnight of the day a moment falls in (the device's clock) — its own name: dayStart lives elsewhere with another shape */
function timeDay(ts){ var d = new Date(+ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
function timeState(){ return timeState.s || (timeState.s = { on:false, day:0, min:0, max:0, timer:null }); }

/* the first and last day anything was recorded */
function timeRange(){
  var lo = Infinity, hi = 0, take = function(v){ var a = +(v && v.at) || 0; if (a > 0){ if (a < lo) lo = a; if (a > hi) hi = a; } };
  Object.keys(STATE.recs || {}).forEach(function(k){ take(STATE.recs[k]); });
  Object.keys(STATE.inss || {}).forEach(function(k){ take(STATE.inss[k]); });
  Object.keys(STATE.diss || {}).forEach(function(k){ take(STATE.diss[k]); });
  if (!isFinite(lo) || !hi){ var now = Date.now(); return { min:now - 864e5, max:now }; }
  return { min:lo, max:Math.max(hi, Date.now()) };
}
/* the stage a point had reached by the end of `day`: '' · 'visited' · 'installed' · 'dis' */
function timeStageAt(x, day){
  var end = day + 864e5 - 1, id = x.id, r = STATE.recs && STATE.recs[id], i = STATE.inss && STATE.inss[id], d = STATE.diss && STATE.diss[id];
  if (d && d.status === 'تم الفك' && (+d.at || 0) <= end) return 'dis';
  if (i && insStatusIs(i.status, 'مُركّب') && (+i.at || 0) <= end) return 'installed';
  if (r && (+r.at || 0) <= end) return 'visited';
  return '';
}
function timeColorOf(x){
  var st = timeStageAt(x, timeState().day);
  return st === 'dis' ? LAYERS.dis.c : st === 'installed' ? LAYERS.install.c : st === 'visited' ? LAYERS.survey.c : '#5B6570';
}
/* the bar under the chips: the day, the slider, back and forth a day, and play */
function timeBarHtml(){
  var S = timeState(); if (!S.on) return '';
  var R = timeRange(); S.min = timeDay(R.min); S.max = timeDay(R.max); if (!S.day || S.day < S.min || S.day > S.max) S.day = S.max;
  var days = Math.round((S.max - S.min) / 864e5), pos = Math.round((S.day - S.min) / 864e5);
  var n = { v:0, i:0, d:0 }; (STATE.sites || []).forEach(function(x){ var st = timeStageAt(x, S.day); if (st === 'visited') n.v++; else if (st === 'installed') n.i++; else if (st === 'dis') n.d++; });
  return '<div class="map-route-box" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    + '<b class="num">\u23F3 ' + esc(fmtDate(S.day)) + '</b>'
    + '<input type="range" min="0" max="' + days + '" value="' + pos + '" data-timeslide="1" aria-label="' + esc(t('اليوم')) + '" style="flex:1 1 160px;min-width:120px">'
    + btn('\u25C0', 'btn-quiet btn-sm', ' data-timestep="-1" aria-label="' + esc(t('اليوم السابق')) + '"') + btn('\u25B6', 'btn-quiet btn-sm', ' data-timestep="1" aria-label="' + esc(t('اليوم التالي')) + '"')
    + btn(S.timer ? '\u23F8 ' + t('إيقاف') : '\u25B6\u25B6 ' + t('تشغيل'), 'btn-secondary btn-sm', ' data-timeplay="1"')
    + '<span class="hint" style="margin:0">' + nm(n.v) + ' ' + esc(t('تمت الزيارة')) + ' \u00b7 ' + nm(n.i) + ' ' + esc(t('مُركّب')) + ' \u00b7 ' + nm(n.d) + ' ' + esc(t('فُكّ')) + '</span></div>';
}
/* set the day from the slider (a position in days from the first day) and repaint both maps */
function timeSet(pos){
  var S = timeState(); S.day = S.min + Math.max(0, Math.min(Math.round((S.max - S.min) / 864e5), +pos || 0)) * 864e5;
  try { if (typeof mapPaint === 'function') mapPaint(); } catch (e){ LS_ERR = e; }
  try { if (MAP_3D && typeof m3Paint === 'function') m3Paint(); } catch (e2){ LS_ERR = e2; }
  var lb = document.querySelector('.map-route-box b.num'); if (lb) lb.textContent = '\u23F3 ' + fmtDate(S.day);
}
function timeStep(d){ var S = timeState(); timeSet(Math.round((S.day - S.min) / 864e5) + d); render(); }
/* play: a day every 400 ms to the last day, then stops by itself */
function timePlayToggle(){
  var S = timeState();
  if (S.timer){ clearInterval(S.timer); S.timer = null; render(); return; }
  if (S.day >= S.max) S.day = S.min;
  S.timer = setInterval(function(){
    var pos = Math.round((S.day - S.min) / 864e5) + 1, last = Math.round((S.max - S.min) / 864e5);
    timeSet(pos); var sl = document.querySelector('[data-timeslide]'); if (sl) sl.value = String(Math.min(pos, last));
    if (pos >= last){ clearInterval(S.timer); S.timer = null; render(); }
  }, 400);
  render();
}
