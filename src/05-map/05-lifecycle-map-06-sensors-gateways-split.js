/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-06-sensors-gateways-split.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Sensors and gateways as first-class points, and splitting a camp.
   DEFINES : iotOf, iotCampIds, iotPad, iotSid, iotGid, iotAllGw, iotM, iotMax, iotRing, iotOutside, iotGrid, iotCentroid, iotMakePlan, iotGen … (+29 more)
   GLOBALS : IOT_ST, IOT_N, BED, SPLIT, SPLIT_COL
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ (V37.70) الحساسُ والجيت واي «زي باقي النقاط» — قرارُ المالك: رقمٌ خاصٌّ وبياناتٌ (الغرفة، السيريال، الحالة، ملاحظة)، ونافذةٌ لكلِّ جهاز،
   وتحريكٌ وإضافةٌ وحذفٌ للحساسات والجيت واي (أكثرُ من جيت واي للمخيم الكبير)، وخطّةٌ تُولَّد للمخيم الجديد أو الجزء المقسوم (١٢ حساسًا داخل حدوده)،
   وما خرج عن الحدود بعد تعديلها يُعلَّم بالأحمر ويُوزَّع من جديد، وإكسلٌ للحساسات. وتبقى خارجَ أرقام الوزارة بعدّادها الخاص (قرارُ V25.7).
   البنيةُ متوافقةٌ مع القديم: gw وsensors إحداثياتٌ كما كانت، ومعها gws (جيت واي إضافي) وsm/gm (بياناتُ الأجهزة بالترتيب نفسِه). */
var IOT_ST = ['مخطط', 'مُركّب', 'معطّل'];
var IOT_N = 12;
function iotOf(id){
  var ov = STATE.siteOv && STATE.siteOv[id] && STATE.siteOv[id].iot;
  var c = (ov && ov.gw && Array.isArray(ov.sensors)) ? ov : (IOT.data && IOT.data.camps ? IOT.data.camps[id] : null);
  if (!c) return null;
  var gws = Array.isArray(c.gws) ? c.gws : [], sm = Array.isArray(c.sm) ? c.sm : [], gm = Array.isArray(c.gm) ? c.gm : [];
  return { gw:c.gw, gws:gws, sensors:c.sensors, sm:sm, gm:gm, maxM:c.maxM, at:c.at, by:c.by, ov:!!ov };
}
function iotCampIds(){   /* المخيماتُ ذاتُ الخطّة: الطبقةُ المبدئيةُ وما عُدِّل أو وُلِّد */
  var ids = {}; if (IOT.data && IOT.data.camps) Object.keys(IOT.data.camps).forEach(function(k){ ids[k] = 1; });
  Object.keys(STATE.siteOv || {}).forEach(function(k){ var o = STATE.siteOv[k]; if (o && o.iot && o.iot.gw) ids[k] = 1; });
  return Object.keys(ids);
}
function iotPad(n){ return (n < 10 ? '0' : '') + n; }
function iotSid(id, c, i){ var m = (c.sm || [])[i]; return (m && m.id) || (id + '-S' + iotPad(i + 1)); }
function iotGid(id, c, j){ var m = (c.gm || [])[j]; return (m && m.id) || (id + '-GW' + (j + 1)); }
function iotAllGw(c){ return [c.gw].concat(c.gws || []); }
function iotM(a, b){ var r = Math.PI / 180, x = (b[1] - a[1]) * r * Math.cos(a[0] * r), y = (b[0] - a[0]) * r; return 6371000 * Math.sqrt(x * x + y * y); }
function iotMax(gw, S, gws){ var G = [gw].concat(gws || []), m = 0; S.forEach(function(q){ var d = Infinity; G.forEach(function(g){ d = Math.min(d, iotM(g, q)); }); m = Math.max(m, d); }); return Math.round(m); }   /* أبعدُ حساسٍ عن أقرب جيت واي */
function iotRing(id){ var x = siteFind(id), F = x && typeof campFoot === 'function' ? campFoot(x) : null; return F ? F.map(function(p){ return [p[1], p[0]]; }) : null; }   /* [[lat,lng]…] */
function iotOutside(id, c){ var R = iotRing(id); if (!R || !c) return []; var out = []; c.sensors.forEach(function(q, i){ if (!polyIn(q, R)) out.push(i); }); return out; }
function iotGrid(R, n, avoid){   /* n نقاطٍ متباعدةٍ داخل المضلّع */
  var la = R.map(function(p){ return p[0]; }), lo = R.map(function(p){ return p[1]; }), a0 = Math.min.apply(null, la), a1 = Math.max.apply(null, la), b0 = Math.min.apply(null, lo), b1 = Math.max.apply(null, lo);
  avoid = avoid || []; var pts = [];
  for (var k = 4; k <= 40 && pts.length < n; k += 2){ pts = []; for (var i = 0; i < k; i++) for (var j = 0; j < k; j++){ var p = [a0 + (a1 - a0) * (i + 0.5) / k, b0 + (b1 - b0) * (j + 0.5) / k]; if (polyIn(p, R) && !avoid.some(function(q){ return iotM(p, q) < 4; })) pts.push(p); } }
  if (pts.length <= n) return pts.map(function(p){ return [+p[0].toFixed(6), +p[1].toFixed(6)]; });
  var out = [], step = pts.length / n; for (var q = 0; q < n; q++) out.push(pts[Math.floor(q * step)]);
  return out.map(function(p){ return [+p[0].toFixed(6), +p[1].toFixed(6)]; });
}
function iotCentroid(R){ var a = 0, b = 0; R.forEach(function(p){ a += p[0]; b += p[1]; }); return [+(a / R.length).toFixed(6), +(b / R.length).toFixed(6)]; }
function iotMakePlan(id, R, keep){   /* keep: {sensors, sm} حساساتٌ قائمةٌ داخل الجزء — يُكمَّل إلى IOT_N */
  keep = keep || { sensors:[], sm:[] }; var S = keep.sensors.slice(), M = keep.sm.slice();
  if (S.length < IOT_N) iotGrid(R, IOT_N - S.length, S).forEach(function(p){ S.push(p); M.push({}); });
  var used = {}; M.forEach(function(m){ if (m && m.id) used[m.id] = 1; }); var nx = 1;
  M = M.map(function(m){ m = Object.assign({}, m || {}); if (!m.id || m.id.indexOf(id + '-S') !== 0){ while (used[id + '-S' + iotPad(nx)]) nx++; m.id = id + '-S' + iotPad(nx); used[m.id] = 1; } if (!m.status) m.status = 'مخطط'; return m; });
  var gw = keep.gw && polyIn(keep.gw, R) ? keep.gw : iotCentroid(R);
  return { gw:gw, gws:[], sensors:S, sm:M, gm:[{ id:id + '-GW1', status:(keep.gm0 && keep.gm0.status) || 'مخطط', serial:(keep.gm0 && keep.gm0.serial) || '', note:(keep.gm0 && keep.gm0.note) || '' }], maxM:iotMax(gw, S), at:Date.now(), by:(STATE.meta && STATE.meta.name) || '' };
}
function iotGen(id){   /* خطّةٌ لمخيمٍ بلا خطّة — ١٢ حساسًا داخل حدوده وجيت واي في مركزه */
  if (!mayIot()){ toast(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')); return false; }
  var R = iotRing(id); if (!R){ toast(t('ارسم حدودَ المخيم أوّلًا')); return false; }
  var P = iotMakePlan(id, R); siteOvSet(id, { iot:P }); logEvent('خطّةُ حساساتٍ جديدة — ' + id + ' \u00b7 ' + nm(P.sensors.length) + ' حساسًا', id);
  IOT.on = true; iotLoad(); toast(t('وُلِّدت خطّةُ الحساسات — اضبطها من «عدّل الحساسات»')); iotPaint(); render(1); return true;
}
function iotRedistribute(id){   /* ما خرج عن الحدود يُعاد داخلها — بياناتُه كما هي */
  if (!mayIot()){ toast(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')); return false; }
  var c = iotOf(id), R = iotRing(id); if (!c || !R) return false; var out = iotOutside(id, c); if (!out.length){ toast(t('كلُّ الحساسات داخل الحدود')); return false; }
  var inside = c.sensors.filter(function(q, i){ return out.indexOf(i) < 0; }), fresh = iotGrid(R, out.length, inside), S = c.sensors.slice();
  out.forEach(function(i, k){ if (fresh[k]) S[i] = fresh[k]; });
  var G = iotAllGw(c).map(function(g){ return polyIn(g, R) ? g : iotCentroid(R); });
  siteOvSet(id, { iot:{ gw:G[0], gws:G.slice(1), sensors:S, sm:c.sm, gm:c.gm, maxM:iotMax(G[0], S, G.slice(1)), at:Date.now(), by:(STATE.meta && STATE.meta.name) || '' } });
  logEvent('إعادةُ توزيع حساساتٍ داخل الحدود — ' + id + ' \u00b7 ' + nm(out.length), id); toast(t('أُعيد توزيعُ الحساسات داخل الحدود') + ' \u2014 ' + nm(out.length)); iotPaint(); render(1); return true;
}
function iotSplit(orig, parts){   /* (V37.70) تقسيمُ المخيم يوزّع حساساتِه على الأجزاء بمكانها، ويُكمِل كلَّ جزءٍ إلى ١٢ — parts: [{id, ring:[[lat,lng]…]}] */
  var c = iotOf(orig); var buckets = parts.map(function(){ return { sensors:[], sm:[] }; });
  if (c) c.sensors.forEach(function(q, i){ var k = -1; parts.some(function(p, pi){ if (polyIn(q, p.ring)){ k = pi; return true; } return false; }); if (k < 0) k = 0; buckets[k].sensors.push(q); buckets[k].sm.push((c.sm || [])[i] || {}); });
  parts.forEach(function(p, pi){ if (pi === 0 && c){ buckets[0].gw = c.gw; buckets[0].gm0 = (c.gm || [])[0]; } var P = iotMakePlan(p.id, p.ring, buckets[pi]); siteOvSet(p.id, { iot:P }); });
}
function iotDevHtml(id, kind, i){   /* نافذةُ الجهاز */
  var c = iotOf(id); if (!c) return ''; var x = siteFind(id), nm0 = x ? (x.name || id) : id, m = kind === 's' ? (c.sm[i] || {}) : (c.gm[i] || {});
  var did = kind === 's' ? iotSid(id, c, i) : iotGid(id, c, i), ttl = kind === 's' ? t('حساس حرارة ورطوبة') : t('جيت واي'), out = kind === 's' && iotOutside(id, c).indexOf(i) > -1;
  var row = function(k, v){ return v ? '<div><span class="hint" style="margin:0">' + esc(t(k)) + ':</span> ' + esc(v) + '</div>' : ''; };
  var cov = kind !== 's' ? '<div class="hint" style="margin:0">' + esc(t('يغطي')) + ' ' + nm(c.sensors.length) + ' ' + esc(t('حساسًا، أبعدها')) + ' ' + nm(iotMax(c.gw, c.sensors, c.gws)) + ' ' + esc(t('م')) + '</div>' : '';
  return '<b>' + esc(ttl) + '</b> <span class="num">' + esc(did) + '</span><br><span class="hint">' + esc(nm0) + '</span>'
    + row('الغرفة', m.room) + row('السيريال', m.serial) + row('الحالة', m.status || 'مخطط') + row('ملاحظة', m.note) + cov
    + (out ? '<div style="color:#E05252">\u26A0 ' + esc(t('خارج حدود المخيم')) + '</div>' : '')
    + (mayIot() ? '<div style="margin-top:6px">' + btn('\u270E ' + t('عدّل'), 'btn-quiet btn-sm', ' data-iotdev="' + esc(id) + '|' + kind + '|' + i + '"') + '</div>' : '');
}
function iotPaint(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try {
    if (IOT.layer && IOT.layer._map !== MAP) IOT.layer = null;
    if (IOT.layer) IOT.layer.clearLayers(); else IOT.layer = L.layerGroup().addTo(MAP);
  } catch (e){ LS_ERR = e; return; }
  if (IOT.edit){   /* (V25.8) مخيمُ التعديل وحدَه — نقرٌ على الشكل يحدِّده */
    var E = IOT.edit, R0 = iotRing(E.id);
    E.sensors.forEach(function(q, i){
      var on = E.sel && E.sel.k === 's' && E.sel.i === i, bad = R0 && !polyIn(q, R0);
      shapeMk(q, { renderer:MAP_CV, radius:on ? 8 : 6, color:on ? '#E05252' : (bad ? '#E05252' : '#fff'), weight:on ? 3 : (bad ? 2.4 : 1.2), fillColor:IOT_C.sensor, fillOpacity:.95, bubblingMouseEvents:false }, 'drop')
        .on('click', function(){ E.sel = { k:'s', i:i }; E.add = false; E.addGw = false; iotPaint(); render(1); }).addTo(IOT.layer);
    });
    [E.gw].concat(E.gws).forEach(function(g, j){
      var ong = E.sel && E.sel.k === 'g' && E.sel.i === j;
      shapeMk(g, { renderer:MAP_CV, radius:ong ? 11 : 9, color:ong ? '#E05252' : '#fff', weight:ong ? 3 : 1.5, fillColor:IOT_C.gw, fillOpacity:.98, bubblingMouseEvents:false }, 'star')
        .on('click', function(){ E.sel = { k:'g', i:j }; E.add = false; E.addGw = false; iotPaint(); render(1); }).addTo(IOT.layer);
    });
    return;
  }
  if (!IOT.on || MAP.getZoom() < IOT.Z) return;
  var b = MAP.getBounds().pad(0.1);
  iotCampIds().forEach(function(id){
    var c = iotOf(id); if (!c || !c.gw || !c.sensors) return; var G = iotAllGw(c);
    if (!G.some(function(g){ return b.contains(g); }) && !c.sensors.some(function(q){ return b.contains(q); })) return;
    var out = iotOutside(id, c);
    c.sensors.forEach(function(q, i){ var bad = out.indexOf(i) > -1;
      shapeMk(q, { renderer:MAP_CV, radius:5, color:bad ? '#E05252' : '#fff', weight:bad ? 2.4 : 1.2, fillColor:IOT_C.sensor, fillOpacity:.95, bubblingMouseEvents:false }, 'drop').bindPopup(iotDevHtml(id, 's', i)).addTo(IOT.layer); });
    G.forEach(function(g, j){ shapeMk(g, { renderer:MAP_CV, radius:8, color:'#fff', weight:1.5, fillColor:IOT_C.gw, fillOpacity:.98, bubblingMouseEvents:false }, 'star').bindPopup(iotDevHtml(id, 'g', j)).addTo(IOT.layer); });
  });
}
function iotEditStart(id, sel){
  if (!mayIot()){ toast(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')); return false; }
  var c = iotOf(id); if (!c){ toast(t('لا خطّةَ حساساتٍ لهذا المخيم')); return false; }
  IOT.on = true; iotLoad();
  var cp = function(q){ return [+q[0], +q[1]]; };
  IOT.edit = { id:id, gw:cp(c.gw), gws:(c.gws || []).map(cp), sensors:c.sensors.map(cp), sm:c.sensors.map(function(_, i){ return Object.assign({ id:iotSid(id, c, i), status:'مخطط' }, (c.sm || [])[i] || {}); }),
    gm:[c.gw].concat(c.gws || []).map(function(_, j){ return Object.assign({ id:iotGid(id, c, j), status:'مخطط' }, (c.gm || [])[j] || {}); }), sel:sel || null, add:false, addGw:false };
  POP_SITE = ''; POP_OPEN = false;   /* نافذةُ النقطة تُغلَق — وإلا ابتلع إغلاقُها أوّلَ نقرةٍ في لوحة التعديل */
  if (MAP && MAP.getZoom() < 17) MAP.setView([+c.gw[0], +c.gw[1]], 17, { animate:false });
  iotPaint(); render(1); toast(t('اضغط على حساسٍ أو الجيت واي ثم على مكانه الجديد')); return true;
}
function iotNextId(E, pre){ var used = {}; (pre === 'S' ? E.sm : E.gm).forEach(function(m){ used[m.id] = 1; }); var n = 1; while (used[E.id + '-' + pre + (pre === 'S' ? iotPad(n) : n)]) n++; return E.id + '-' + pre + (pre === 'S' ? iotPad(n) : n); }
function iotMapClick(ll){
  var E = IOT.edit; if (!E) return;
  var p = [+ll.lat.toFixed(6), +ll.lng.toFixed(6)];
  if (E.add){ E.sensors.push(p); E.sm.push({ id:iotNextId(E, 'S'), status:'مخطط' }); E.add = false; E.sel = { k:'s', i:E.sensors.length - 1 }; }
  else if (E.addGw){ E.gws.push(p); E.gm.push({ id:iotNextId(E, 'GW'), status:'مخطط' }); E.addGw = false; E.sel = { k:'g', i:E.gws.length }; }
  else if (E.sel){ if (E.sel.k === 'g'){ if (E.sel.i === 0) E.gw = p; else E.gws[E.sel.i - 1] = p; } else E.sensors[E.sel.i] = p; }
  else { toast(t('اختر حساسًا أو الجيت واي أوّلًا')); return; }
  iotPaint(); render(1);
}
function iotDel(){
  var E = IOT.edit; if (!E || !E.sel) return;
  if (E.sel.k === 's'){ E.sensors.splice(E.sel.i, 1); E.sm.splice(E.sel.i, 1); }
  else { if (!E.gws.length){ toast(t('المخيمُ يحتاج جيت واي واحدًا على الأقل')); return; } if (E.sel.i === 0){ E.gw = E.gws.shift(); E.gm.shift(); } else { E.gws.splice(E.sel.i - 1, 1); E.gm.splice(E.sel.i, 1); } }
  E.sel = null; iotPaint(); render(1);
}
function iotMetaSet(){   /* بياناتُ المحدَّد من اللوحة */
  var E = IOT.edit; if (!E || !E.sel) return;
  var m = E.sel.k === 's' ? E.sm[E.sel.i] : E.gm[E.sel.i]; if (!m) return;
  var v = function(k){ var el = document.getElementById(k); return el ? String(el.value || '').trim() : ''; };
  if (E.sel.k === 's') m.room = v('iotRoom'); m.serial = v('iotSerial'); m.status = v('iotStatus') || 'مخطط'; m.note = v('iotNote');
  toast(t('حُفظت بياناتُ الجهاز — اضغط «احفظ» للخطّة كلِّها')); render(1);
}
function iotSave(){
  var E = IOT.edit; if (!E) return false;
  if (!mayIot()){ toast(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')); return false; }
  if (!E.sensors.length){ toast(t('لا يُحفَظ مخيمٌ بلا حساسات')); return false; }
  var maxM = iotMax(E.gw, E.sensors, E.gws);
  siteOvSet(E.id, { iot:{ gw:E.gw, gws:E.gws, sensors:E.sensors, sm:E.sm, gm:E.gm, maxM:maxM, at:Date.now(), by:STATE.meta.name || '' } });
  logEvent('تعديلُ حساسات مخيم — ' + E.id + ' \u00b7 ' + nm(E.sensors.length) + ' حساسًا \u00b7 ' + nm(1 + E.gws.length) + ' جيت واي \u00b7 أبعدُها ' + nm(maxM) + ' م', E.id);
  if (maxM > 150) toast(t('حُفظت — وحساسٌ أبعدُ من ١٥٠ م عن أقرب جيت واي') + ' (' + nm(maxM) + ' ' + t('م') + ') \u2014 ' + t('أضف جيت واي أو انقله نحو الحساسات'));
  else toast(t('حُفظت خطّةُ حساسات المخيم'));
  IOT.edit = null; iotPaint(); render(1); return true;
}
function iotPanelHtml(){
  var E = IOT.edit; if (!E) return '';
  var x = siteFind(E.id), nm0 = x ? (x.name || E.id) : E.id, maxM = iotMax(E.gw, E.sensors, E.gws);
  var m = E.sel ? (E.sel.k === 's' ? E.sm[E.sel.i] : E.gm[E.sel.i]) : null;
  var sel = !E.sel ? t('لا شيءَ محدَّد') : (E.sel.k === 'g' ? t('جيت واي') : t('حساس')) + ' ' + ((m && m.id) || '');
  var fld = function(idx, lab, val){ return '<label style="display:flex;flex-direction:column;gap:2px;font-size:12px;min-width:120px;flex:1">' + esc(t(lab)) + '<input id="' + idx + '" value="' + esc(val || '') + '" style="padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink)"></label>'; };
  var form = m ? '<div class="wt-row" style="gap:6px;flex-wrap:wrap;margin:6px 0">' + (E.sel.k === 's' ? fld('iotRoom', 'الغرفة', m.room) : '') + fld('iotSerial', 'السيريال', m.serial)
      + '<label style="display:flex;flex-direction:column;gap:2px;font-size:12px;min-width:110px">' + esc(t('الحالة')) + '<select id="iotStatus" style="padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">' + IOT_ST.map(function(s){ return '<option' + ((m.status || 'مخطط') === s ? ' selected' : '') + ' value="' + esc(s) + '">' + esc(t(s)) + '</option>'; }).join('') + '</select></label>'
      + fld('iotNote', 'ملاحظة', m.note) + btn('\u2713 ' + t('حفظ البيانات'), 'btn-secondary btn-sm', ' data-iotmeta="1"') + '</div>' : '';
  var out = iotRing(E.id) ? E.sensors.filter(function(q){ return !polyIn(q, iotRing(E.id)); }).length : 0;
  return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0">'
    + '<b>' + esc(t('تعديل حساسات')) + ' \u2014 ' + esc(nm0) + '</b>'
    + '<span class="hint">' + nm(E.sensors.length) + ' ' + esc(t('حساسًا')) + ' \u00b7 ' + nm(1 + E.gws.length) + ' ' + esc(t('جيت واي')) + ' \u00b7 ' + esc(t('أبعدها')) + ' ' + nm(maxM) + ' ' + esc(t('م')) + (maxM > 150 ? ' \u26a0' : '') + (out ? ' \u00b7 <span style="color:#E05252">' + nm(out) + ' ' + esc(t('خارج الحدود')) + '</span>' : '') + '</span></div>'
    + '<p class="hint" style="margin:6px 0">' + (E.add ? esc(t('اضغط على الخريطة حيث يُوضَع الحساسُ الجديد')) : E.addGw ? esc(t('اضغط على الخريطة حيث يُوضَع الجيت واي الجديد')) : esc(t('المحدَّد')) + ': ' + esc(sel) + (E.sel ? ' \u2014 ' + esc(t('اضغط على مكانه الجديد')) : '')) + '</p>'
    + form
    + '<div class="actions">'
    + btn((E.add ? '\u2716 ' : '+ ') + t('أضف حساسًا'), 'btn-quiet btn-sm', ' data-iotadd="1"')
    + btn((E.addGw ? '\u2716 ' : '+ ') + t('أضف جيت واي'), 'btn-quiet btn-sm', ' data-iotaddgw="1"')
    + (E.sel ? btn('\u{1F5D1} ' + t('احذف المحدد'), 'btn-quiet btn-sm', ' data-iotdel="1"') : '')
    + btn('\u{1F4BE} ' + t('احفظ'), 'btn-primary btn-sm', ' data-iotsave="1"')
    + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-iotcancel="1"')
    + '</div></div>';
}
function iotCount(){ var g = 0, s = 0; iotCampIds().forEach(function(id){ var c = iotOf(id); if (c){ g += 1 + (c.gws || []).length; s += c.sensors.length; } }); return { g:g, s:s }; }
function iotXlsx(){   /* إكسلُ الحساسات — للمشتريات والتركيب */
  var rows = []; iotCampIds().forEach(function(id){ var c = iotOf(id); if (!c) return; var x = siteFind(id), nm0 = x ? (x.name || id) : id, out = iotOutside(id, c);
    iotAllGw(c).forEach(function(g, j){ var m = c.gm[j] || {}; rows.push([nm0, id, iotGid(id, c, j), t('جيت واي'), '', m.serial || '', m.status || 'مخطط', +g[0], +g[1], m.note || '']); });
    c.sensors.forEach(function(q, i){ var m = c.sm[i] || {}; rows.push([nm0, id, iotSid(id, c, i), t('حساس حرارة ورطوبة'), m.room || '', m.serial || '', m.status || 'مخطط', +q[0], +q[1], (out.indexOf(i) > -1 ? t('خارج حدود المخيم') + ' — ' : '') + (m.note || '')]); }); });
  if (typeof mtXlsx === 'function') return mtXlsx('حساسات منى', ['المخيم', 'رقم المخيم', 'رقم الجهاز', 'النوع', 'الغرفة', 'السيريال', 'الحالة', 'خط العرض', 'خط الطول', 'ملاحظة'], rows);
  return false;
}

var BED = null, BED_L = null;
function bedArea(P){
  if (!P || P.length < 3) return 0;
  var r = Math.PI / 180, kx = 111320 * Math.cos(P[0][0] * r), ky = 110540, a = 0;
  for (var i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][1] * kx) * (P[i][0] * ky) - (P[i][1] * kx) * (P[j][0] * ky);
  return Math.abs(a / 2);
}
function bedStart(id){
  if (!maySiteEdit()){ toast(t('تعديلُ الحدود للمهندس فما فوق')); return false; }
  var x = siteFind(id); if (!x || x.type !== 'مخيم'){ toast(t('لا مخيمَ بهذا المعرِّف')); return false; }
  if (!polyOf(x).length && !POLY && typeof polyLoad === 'function'){ polyLoad().then(function(){ if (POLY) bedStart(id); }); return false; }
  var F = campFoot(x);
  if (!F){   /* (V37.17) طلبُ المالك «حلٌّ جذريٌّ يدويّ»: مخيمٌ بلا حدود يُرسَم هنا مباشرةً — نقرةٌ لكلِّ زاوية */
    BED = { id:id, pts:[], sel:-1, orig:false, drawn:false, draw:true, hist:[] };
    POP_SITE = ''; POP_OPEN = false; if (MAP) MAP.closePopup();
    try { if (MAP && x.lat && x.lng) MAP.setView([+x.lat, +x.lng], Math.max(MAP.getZoom(), 18), { animate:false }); } catch (e){ LS_ERR = e; }
    bedPaint(); render(1); toast(t('اضغط على الخريطة عند كلِّ زاويةٍ بالترتيب، ثم «تمّ الرسم»')); return true;
  }
  var P = F.map(function(q){ return [+q[1], +q[0]]; });
  if (P.length > 3 && P[0][0] === P[P.length - 1][0] && P[0][1] === P[P.length - 1][1]) P.pop();   /* الحلقةُ المغلقةُ تُفتَح: الزاويةُ الأولى لا تتكرّر */
  BED = { id:id, pts:P, sel:-1, orig:!x.isNew && !!(POLY && POLY[id] && POLY[id].length >= 3), drawn:polyOf(x).length >= 3, draw:false, hist:[] };
  POP_SITE = ''; POP_OPEN = false; if (MAP) MAP.closePopup();
  try { if (MAP) MAP.fitBounds(L.latLngBounds(P).pad(0.35), { animate:false, maxZoom:19 }); } catch (e){ LS_ERR = e; }
  bedPaint(); render(1); toast(t('اسحب الزاوية لنقلها، واضغط النقطة الصغيرة بين زاويتين لإضافة زاوية')); return true;
}
function bedSnap(){ if (BED){ BED.hist = BED.hist || []; BED.hist.push(BED.pts.map(function(q){ return [q[0], q[1]]; })); if (BED.hist.length > 60) BED.hist.shift(); } }   /* (V37.17) سجلُّ التراجع */
function bedPaint(){
  if (typeof MAP === 'undefined' || !MAP || typeof L === 'undefined') return;
  try {
    if (BED_L && BED_L._map !== MAP) BED_L = null;
    if (BED_L) BED_L.clearLayers(); else BED_L = L.layerGroup().addTo(MAP);
  } catch (e){ LS_ERR = e; return; }
  if (!BED) return;
  var P = BED.pts, poly = null;
  if (P.length >= 3) poly = L.polygon(P, { renderer:MAP_CV, color:'#F5A623', weight:2.5, fillOpacity:0.18, dashArray:'6 4', interactive:false }).addTo(BED_L);
  else if (P.length === 2) poly = L.polyline(P, { renderer:MAP_CV, color:'#F5A623', weight:2.5, dashArray:'6 4', interactive:false }).addTo(BED_L);
  P.forEach(function(q, i){
    var mk = L.marker(q, { draggable:true, zIndexOffset:1000, icon:L.divIcon({ className:'bed-v' + (BED.sel === i ? ' on' : ''), iconSize:[30, 30] }) });
    mk.on('dragstart', function(){ bedSnap(); });
    mk.on('drag', function(e){ var ll = e.target.getLatLng(); BED.pts[i] = [+ll.lat.toFixed(6), +ll.lng.toFixed(6)]; if (poly) poly.setLatLngs(BED.pts); });
    mk.on('dragend', function(){ BED.sel = i; bedPaint(); render(1); });
    mk.on('click', function(){ BED.sel = i; bedPaint(); render(1); });
    mk.addTo(BED_L);
  });
  if (BED.draw || P.length < 3) return;   /* وضعُ الرسم: الزوايا وحدَها حتى «تمّ الرسم» */
  for (var k = 0; k < P.length; k++){
    (function(k){
      var a = P[k], b = P[(k + 1) % P.length], mid = [+((a[0] + b[0]) / 2).toFixed(6), +((a[1] + b[1]) / 2).toFixed(6)];
      L.marker(mid, { icon:L.divIcon({ className:'bed-m', iconSize:[18, 18] }) })
        .on('click', function(){ bedSnap(); BED.pts.splice(k + 1, 0, mid); BED.sel = k + 1; bedPaint(); render(1); })
        .addTo(BED_L);
    })(k);
  }
  /* مقبضُ الوسط: يُسحَب فينتقل الشكلُ كلُّه كما هو */
  var cy = P.reduce(function(a, q){ return a + q[0]; }, 0) / P.length, cx = P.reduce(function(a, q){ return a + q[1]; }, 0) / P.length, start = null, base = null;
  L.marker([cy, cx], { draggable:true, zIndexOffset:1100, icon:L.divIcon({ className:'bed-c', html:'\u2725', iconSize:[34, 34] }) })
    .on('dragstart', function(e){ bedSnap(); start = e.target.getLatLng(); base = BED.pts.map(function(q){ return [q[0], q[1]]; }); })
    .on('drag', function(e){ if (!start) return; var ll = e.target.getLatLng(), dy = ll.lat - start.lat, dx = ll.lng - start.lng; BED.pts = base.map(function(q){ return [+(q[0] + dy).toFixed(6), +(q[1] + dx).toFixed(6)]; }); if (poly) poly.setLatLngs(BED.pts); })
    .on('dragend', function(){ start = null; bedPaint(); render(1); })
    .addTo(BED_L);
}
function bedDel(){ if (!BED || BED.sel < 0 || BED.pts.length <= 3) return; bedSnap(); BED.pts.splice(BED.sel, 1); BED.sel = -1; bedPaint(); render(1); }
function bedCommit(x, flat, what){
  var patch = { poly:flat, polyBy:STATE.meta.name || '', polyAt:Date.now() };
  Object.assign(x, patch);
  if (x.isNew) CORE.set('newsites', x.id, x); else siteOvSet(x.id, patch);
  SITE_IX = null; SITE_TOK = null; statBump(); logEvent(what, x.id);
  BED = null; bedPaint(); mapPaint(); render(1);
}
function bedSave(){
  if (!BED) return false;
  if (!maySiteEdit()){ toast(t('تعديلُ الحدود للمهندس فما فوق')); return false; }
  var x = siteFind(BED.id); if (!x) return false;
  if (BED.pts.length < 3){ toast(t('الحدودُ ثلاثُ زوايا على الأقل')); return false; }
  var flat = []; BED.pts.forEach(function(q){ flat.push(+(+q[0]).toFixed(6), +(+q[1]).toFixed(6)); });
  var n = BED.pts.length;
  bedCommit(x, flat, 'تعديلُ حدود مخيم — ' + x.id + ' \u00b7 ' + nm(n) + ' زاوية');
  toast(t('حُفظت حدودُ المخيم')); return true;
}
function bedReset(){
  if (!BED || !BED.orig) return false;
  if (!maySiteEdit()){ toast(t('تعديلُ الحدود للمهندس فما فوق')); return false; }
  var x = siteFind(BED.id); if (!x) return false;
  bedCommit(x, [], 'رجوعٌ لحدود المخيم الأصلية — ' + x.id);
  toast(t('عادت حدودُ المخيم الأصلية')); return true;
}
/* ═══ (V37.67) «✂ قسّم المخيم» — قرارُ المالك: «مرونة: أعدّل حدود المخيم أو أقسم مخيمًا كبيرًا لثلاثة، وأيُّ زيادةٍ أو نقصٍ يتغيّر في التقرير»
   للمخيمات وحدَها وللمهندس فما فوق. يُقسَم المضلّعُ أجزاءً متساويةَ المساحة على محوره الأطول (معاينةٌ على الخريطة قبل الحفظ)، ثم تُضبَط حدودُ كلِّ جزءٍ بـ«عدّل الحدود».
   الجزءُ الأوّلُ يبقى برقم المخيم وبياناته ومسحه، والأجزاءُ الجديدةُ برقمه + B وC… («لم تُزر» تحتاج مسحًا) بالمشعر والشركة والمربع نفسها والاسمِ والشاخصِ + (٢)، (٣).
   والأجزاءُ نقاطٌ معتمدةٌ من المهندس، فتدخل كلَّ العدّاداتِ والتقاريرِ والإكسل تلقائيًّا — لا عدَّ يدويًّا. */
var SPLIT = null;   /* { id, n, parts:[[ [lat,lng]… ]…] } */
function splitParts(ring, n){   /* ring: [[lng,lat]…] من campFoot → أجزاءٌ [[lat,lng]…] متساويةُ المساحة */
  var lat0 = ring.reduce(function(a, p){ return a + p[1]; }, 0) / ring.length, kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110540;
  var P = ring.map(function(p){ return [p[0] * kx, p[1] * ky]; }), cx = 0, cy = 0; P.forEach(function(p){ cx += p[0]; cy += p[1]; }); cx /= P.length; cy /= P.length;
  var sxx = 0, syy = 0, sxy = 0; P.forEach(function(p){ var dx = p[0] - cx, dy = p[1] - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
  var ang = 0.5 * Math.atan2(2 * sxy, sxx - syy), ux = Math.cos(ang), uy = Math.sin(ang);   /* المحورُ الأطول */
  var proj = function(p){ return p[0] * ux + p[1] * uy; };
  var clip = function(poly, c, keepLow){ var out = []; for (var i = 0; i < poly.length; i++){ var a = poly[i], b = poly[(i + 1) % poly.length], da = proj(a) - c, db = proj(b) - c, ina = keepLow ? da <= 0 : da >= 0, inb = keepLow ? db <= 0 : db >= 0;
      if (ina) out.push(a); if (ina !== inb){ var tt = da / (da - db); out.push([a[0] + (b[0] - a[0]) * tt, a[1] + (b[1] - a[1]) * tt]); } } return out; };
  var area = function(poly){ var s = 0; for (var i = 0; i < poly.length; i++){ var a = poly[i], b = poly[(i + 1) % poly.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
  var lo = Math.min.apply(null, P.map(proj)), hi = Math.max.apply(null, P.map(proj)), tot = area(P), cuts = [lo];
  for (var k = 1; k < n; k++){ var a0 = cuts[cuts.length - 1], b0 = hi, want = tot * k / n; for (var it = 0; it < 50; it++){ var m = (a0 + b0) / 2; if (area(clip(P, m, true)) < want) a0 = m; else b0 = m; } cuts.push((a0 + b0) / 2); }
  cuts.push(hi);
  var parts = []; for (var q = 0; q < n; q++){ var pc = clip(clip(P, cuts[q], false), cuts[q + 1], true); if (pc.length >= 3) parts.push(pc.map(function(p){ return [p[1] / ky, p[0] / kx]; })); }
  return parts;
}
function splitStart(id){ var x = siteFind(id), ring = x && campFoot(x); if (!x || x.type !== 'مخيم'){ toast(t('التقسيمُ للمخيمات وحدَها')); return; } if (!maySiteEdit()){ toast(t('تقسيمُ المخيم للمهندس فما فوق')); return; } if (!ring){ toast(t('ارسم حدودَ المخيم أوّلًا')); return; }
  SPLIT = { id:id, n:3, parts:splitParts(ring, 3) }; POP_OPEN = false; render(1); if (typeof mapPaint === 'function') mapPaint(); }
function splitN(n){ if (!SPLIT) return; var x = siteFind(SPLIT.id); SPLIT.n = n; SPLIT.parts = splitParts(campFoot(x), n); render(1); if (typeof mapPaint === 'function') mapPaint(); }
var SPLIT_COL = ['#4FA3FF', '#FF8C42', '#3AD6A0', '#E64980', '#F5C400', '#9B51E0'];
function splitPaint(){ if (!SPLIT || !MAP_TMP) return; SPLIT.parts.forEach(function(pp, i){ L.polygon(pp, { renderer:MAP_CV, color:SPLIT_COL[i % 6], weight:2.5, dashArray:'6 4', fillColor:SPLIT_COL[i % 6], fillOpacity:0.3, interactive:false }).addTo(MAP_TMP); }); }
function splitPanelHtml(){ if (!SPLIT) return ''; var x = siteFind(SPLIT.id) || {};
  return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0"><b>\u2702 ' + esc(t('قسّم المخيم')) + ' \u2014 ' + esc(x.name || SPLIT.id) + '</b><span class="hint">' + nm(SPLIT.parts.length) + ' ' + esc(t('أجزاء')) + '</span></div>'
    + '<div class="chips" style="margin:8px 0">' + [2, 3, 4, 5, 6].map(function(k){ return '<button type="button" class="chip' + (SPLIT.n === k ? ' on' : '') + '" data-splitn="' + k + '">' + nm(k) + '</button>'; }).join('') + '</div>'
    + '<p class="hint" style="margin:0 0 8px">' + esc(t('أجزاءٌ متساويةُ المساحة على طول المخيم — الأوّلُ يبقى برقمه ومسحه، والباقي مخيماتٌ جديدةٌ تحتاج مسحًا. بعد الحفظ اضبط حدودَ كلِّ جزءٍ بـ«عدّل الحدود».')) + '</p>'
    + '<div class="actions">' + btn('\u2713 ' + t('احفظ التقسيم'), 'btn-primary btn-sm', ' data-splitsave="1"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-splitcancel="1"') + '</div></div>';
}
function splitSuffix(base, k){ var L0 = 'BCDEFGHIJ', id = base + '-' + L0[k - 1]; var g = 0; while (siteFind(id) && g < 30){ g++; id = base + '-' + L0[(k - 1 + g) % L0.length] + (g >= L0.length ? g : ''); } return id; }
function splitSave(){
  if (!SPLIT) return false; if (!maySiteEdit()){ toast(t('تقسيمُ المخيم للمهندس فما فوق')); return false; }
  var x = siteFind(SPLIT.id); if (!x || SPLIT.parts.length < 2){ toast(t('التقسيمُ جزءان على الأقل')); return false; }
  var flat = function(pp){ var f = []; pp.forEach(function(q){ f.push(+(+q[0]).toFixed(6), +(+q[1]).toFixed(6)); }); return f; };
  var cen = function(pp){ var a = 0, b = 0; pp.forEach(function(q){ a += q[0]; b += q[1]; }); return [+(a / pp.length).toFixed(6), +(b / pp.length).toFixed(6)]; };
  var made = [], now = Date.now(), who = (STATE.meta && STATE.meta.name) || '';
  SPLIT.parts.slice(1).forEach(function(pp, i){ var k = i + 1, id = splitSuffix(x.id, k), c = cen(pp), lab = ' (' + nm(k + 1) + ')';
    var site = { id:id, name:(x.name || x.id) + lab, zone:x.zone, type:'مخيم', co:x.co || '', sq:x.sq || '', sign:(x.sign || '') + lab, lat:c[0], lng:c[1], region:x.region || ('منطقة ' + (x.zone || '')),
      poly:flat(pp), polyBy:who, polyAt:now, tents:x.tents || 0, fstat:'لم يبدأ', inout:'', isNew:true, approved:true, appBy:who, appAt:now, by:who, at:now, origin:'office', splitOf:x.id, note:t('من تقسيم المخيم') + ' ' + x.id };
    STATE.sites.push(site); CORE.set('newsites', id, site); made.push(id); });
  if (x.zone === 'منى' || iotOf(x.id)){ try { iotSplit(x.id, [x.id].concat(made).map(function(pid, pi){ return { id:pid, ring:SPLIT.parts[pi] }; })); } catch (eI){ LS_ERR = eI; } }   /* (V37.70) حساساتُ المخيم تتوزّع على الأجزاء وتُكمَّل إلى ١٢ */
  bedCommit(x, flat(SPLIT.parts[0]), 'تقسيمُ مخيم — ' + x.id + ' إلى ' + SPLIT.parts.length + ' أجزاء: ' + made.join('، '));   /* الجزءُ الأوّلُ بحدوده الجديدة — ويُعيد الرسمَ والعدّ */
  SPLIT = null; SITE_IX = null; SITE_TOK = null; statBump(); render(1); if (typeof mapPaint === 'function') mapPaint();
  toast(t('قُسِّم المخيم') + ' — ' + nm(made.length + 1) + ' ' + t('مخيمات')); return made;
}

function bedPanelHtml(){
  if (!BED) return '';
  var x = siteFind(BED.id), nm0 = x ? (x.name || BED.id) : BED.id, H = (BED.hist || []).length;
  var undo = H ? btn('\u21B6 ' + t('تراجع'), 'btn-quiet btn-sm', ' data-bedundo="1"') : '';
  if (BED.draw) return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0">'
    + '<b>' + esc(t('رسم حدود')) + ' \u2014 ' + esc(nm0) + '</b><span class="hint">' + nm(BED.pts.length) + ' ' + esc(t('زاوية')) + '</span></div>'
    + '<p class="hint" style="margin:6px 0">' + esc(t('اضغط على الخريطة عند كلِّ زاويةٍ بالترتيب حول المخيم — تُسحَب الزاويةُ لتصحيحها.')) + '</p>'
    + '<div class="actions">' + (BED.pts.length >= 3 ? btn('\u2713 ' + t('تمّ الرسم'), 'btn-primary btn-sm', ' data-beddone="1"') : '') + undo
    + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-bedcancel="1"') + '</div></div>';
  return '<div class="map-route-box"><div class="wt-row" style="justify-content:space-between;align-items:center;gap:8px;margin:0">'
    + '<b>' + esc(t('تعديل حدود')) + ' \u2014 ' + esc(nm0) + '</b>'
    + '<span class="hint">' + nm(BED.pts.length) + ' ' + esc(t('زاوية')) + ' \u00b7 ' + nm(Math.round(bedArea(BED.pts))) + ' ' + esc(t('م²')) + '</span></div>'
    + '<p class="hint" style="margin:6px 0">' + esc(t(BED.sel >= 0 ? 'الزاويةُ المحدَّدة بالأحمر — اسحبها أو احذفها' : 'اسحب الزاوية لنقلها، والنقطةَ الصغيرة بين زاويتين لإضافة زاوية، والعلامةَ في الوسط لنقل الشكل كلِّه')) + '</p>'
    + '<div class="actions">'
    + btn('\u{1F4BE} ' + t('احفظ'), 'btn-primary btn-sm', ' data-bedsave="1"') + undo
    + (BED.sel >= 0 && BED.pts.length > 3 ? btn('\u{1F5D1} ' + t('احذف الزاوية'), 'btn-quiet btn-sm', ' data-beddel="1"') : '')
    + btn('\u270F ' + t('ارسم من جديد'), 'btn-quiet btn-sm', ' data-bedredraw="1"')
    + (BED.orig && BED.drawn ? btn('\u21BA ' + t('رجوع للحدود الأصلية'), 'btn-quiet btn-sm', ' data-bedreset="1"') : '')
    + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-bedcancel="1"')
    + '</div></div>';
}
/* صنفُ «القمر» على الإطار يتبع ما يُعرَض فعلًا: القمرُ لا يُقلَب في الوضع الداكن، وخريطةُ الجهاز تُقلَب ولو كان القمرُ مختارًا */
