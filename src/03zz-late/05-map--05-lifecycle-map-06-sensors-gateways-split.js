/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-06-sensors-gateways-split.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-06-sensors-gateways-split.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : iotGrid, iotCentroid, iotMakePlan, iotGen, iotRedistribute, iotSplit, iotEditStart, iotDel, iotMetaSet, iotSave, iotXlsx, bedStart, bedDel, bedCommit, bedSave, bedReset, splitParts, splitStart, splitN, splitSuffix, splitSave
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
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
  if (S.length < PV.IOT_N) iotGrid(R, PV.IOT_N - S.length, S).forEach(function(p){ S.push(p); M.push({}); });
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

function iotEditStart(id, sel){
  if (!mayIot()){ toast(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')); return false; }
  var c = iotOf(id); if (!c){ toast(t('لا خطّةَ حساساتٍ لهذا المخيم')); return false; }
  IOT.on = true; iotLoad(); if (typeof iotFieldLoad === 'function') iotFieldLoad();   /* (V39.22) */
  var cp = function(q){ return [+q[0], +q[1]]; };
  IOT.edit = { id:id, gw:cp(c.gw), gws:(c.gws || []).map(cp), sensors:c.sensors.map(cp), sm:c.sensors.map(function(_, i){ return Object.assign({ id:iotSid(id, c, i), status:'مخطط' }, (c.sm || [])[i] || {}); }),
    gm:[c.gw].concat(c.gws || []).map(function(_, j){ return Object.assign({ id:iotGid(id, c, j), status:'مخطط' }, (c.gm || [])[j] || {}); }), sel:sel || null, add:false, addGw:false };
  POP_SITE = ''; POP_OPEN = false;   /* نافذةُ النقطة تُغلَق — وإلا ابتلع إغلاقُها أوّلَ نقرةٍ في لوحة التعديل */
  if (MAP && MAP.getZoom() < 17) MAP.setView([+c.gw[0], +c.gw[1]], 17, { animate:false });
  iotPaint(); render(1); toast(t('اضغط على حساسٍ أو الجيت واي ثم على مكانه الجديد')); return true;
}

function iotDel(){
  var E = IOT.edit; if (!E || !E.sel) return;
  if (E.sel.k === 's'){ E.sensors.splice(E.sel.i, 1); E.sm.splice(E.sel.i, 1); }
  else { if (!E.gws.length){ toast(t('المخيمُ يحتاج جيت واي واحدًا على الأقل')); return; } if (E.sel.i === 0){ E.gw = E.gws.shift(); E.gm.shift(); } else { E.gws.splice(E.sel.i - 1, 1); E.gm.splice(E.sel.i, 1); } }
  E.sel = null; iotPaint(); render(1);
}

/* (V39.65) owner: «باضيف بيانات الحساسات بس مش بيعمل save». The fields were read only when «حفظ البيانات» was pressed, into the
   edit session, and only «احفظ» wrote the plan — typing a serial and pressing «احفظ» (or leaving) lost it, and a redraw in
   between wiped what was typed. Now every keystroke goes into the selected device, «حفظ البيانات» writes the plan at once
   (the edit stays open), and «احفظ» takes what is in the fields before it writes and closes. */
function iotSelMeta(){ var E = IOT.edit; if (!E || !E.sel) return null; var A = E.sel.k === 's' ? E.sm : E.gm; if (!A) return null; if (!A[E.sel.i]) A[E.sel.i] = { status:'مخطط' }; return A[E.sel.i]; }
function iotFieldLive(id, val){ var m = iotSelMeta(), k = iotFieldLive.F[id]; if (!m || !k) return; if (k === 'room' && IOT.edit.sel.k !== 's') return;
  /* (V41.5) installation acceptance — a sensor becomes «مُركّب» only with a fresh reading and a signal that is not red */
  if (k === 'status' && val === 'مُركّب' && m.status !== 'مُركّب' && IOT.edit.sel.k === 's' && typeof iotDashHtml === 'function' && iotDashHtml.accept){
    var A = iotDashHtml.accept(m), eff = typeof effRole === 'function' ? effRole(ROLE) : ROLE, key = (m.id || '') + '|' + (m.serial || '');
    if (!A.ok){
      if ((eff === 'engineer' || eff === 'admin') && PV.ACC_ARM === key && Date.now() - (PV.ACC_AT || 0) < 10000){ PV.ACC_ARM = ''; logEvent('تجاوزُ قبول تركيب حساس — ' + (m.id || '') + ' \u00b7 ' + A.why, IOT.edit.id); }
      else { PV.ACC_ARM = key; PV.ACC_AT = Date.now(); var el = document.getElementById('iotStatus'); if (el) el.value = m.status || 'مخطط';
        toast(A.why + ((eff === 'engineer' || eff === 'admin') ? ' \u2014 ' + t('ولو متأكد: اختار «مُركّب» تاني خلال ١٠ ثواني (هيتسجّل تجاوز)') : '')); return; }
    }
  } m[k] = k === 'status' ? (String(val || '').trim() || 'مخطط') : String(val == null ? '' : val).trim(); }
iotFieldLive.F = { iotRoom:'room', iotSerial:'serial', iotModel:'model', iotTag:'tag', iotNote:'note', iotStatus:'status' };
/* a fallback for a field whose typing never reached the session (autofill): only an empty value is filled from the screen —
   every keystroke, clearing included, already arrived through iotFieldLive */
function iotMetaRead(){ var m = iotSelMeta(); if (!m) return; Object.keys(iotFieldLive.F).forEach(function(id){ var k = iotFieldLive.F[id], el = document.getElementById(id); if (el && String(el.value || '').trim() && !m[k]) iotFieldLive(id, el.value); }); }
function iotPersist(E){
  var maxM = iotMax(E.gw, E.sensors, E.gws);
  siteOvSet(E.id, { iot:{ gw:E.gw, gws:E.gws, sensors:E.sensors, sm:E.sm, gm:E.gm, maxM:maxM, at:Date.now(), by:STATE.meta.name || '' } });
  return maxM;
}
function iotMetaSet(){   /* بياناتُ المحدَّد من اللوحة */
  var E = IOT.edit; if (!E || !E.sel) return;
  var m = iotSelMeta(); if (!m) return;
  iotMetaRead();
  if (!mayIot()){ toast(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')); return; }
  if (!E.sensors.length){ toast(t('لا يُحفَظ مخيمٌ بلا حساسات')); return; }
  iotPersist(E);   /* (V39.65) written now — the edit stays open for the next device */
  logEvent('بياناتُ جهازٍ في خطة حساسات — ' + E.id + ' \u00b7 ' + (m.id || '') + (m.serial ? ' \u00b7 ' + m.serial : ''), E.id);
  toast(t('حُفظت بياناتُ الجهاز') + (m.serial ? ' \u00b7 ' + m.serial : '')); render(1);
}

function iotSave(){
  var E = IOT.edit; if (!E) return false;
  if (!mayIot()){ toast(t('تعديلُ الحساسات للمهندس فما فوق والمشرف')); return false; }
  if (!E.sensors.length){ toast(t('لا يُحفَظ مخيمٌ بلا حساسات')); return false; }
  iotMetaRead();   /* (V39.65) what is typed in the fields is part of the plan */
  var maxM = iotPersist(E);
  logEvent('تعديلُ حساسات مخيم — ' + E.id + ' \u00b7 ' + nm(E.sensors.length) + ' حساسًا \u00b7 ' + nm(1 + E.gws.length) + ' جيت واي \u00b7 أبعدُها ' + nm(maxM) + ' م', E.id);
  if (maxM > 150) toast(t('حُفظت — وحساسٌ أبعدُ من ١٥٠ م عن أقرب جيت واي') + ' (' + nm(maxM) + ' ' + t('م') + ') \u2014 ' + t('أضف جيت واي أو انقله نحو الحساسات'));
  else toast(t('حُفظت خطّةُ حساسات المخيم'));
  IOT.edit = null; iotPaint(); render(1); return true;
}

function iotXlsx(){   /* إكسلُ الحساسات — للمشتريات والتركيب */
  var rows = []; iotCampIds().forEach(function(id){ var c = iotOf(id); if (!c) return; var x = siteFind(id), nm0 = x ? (x.name || id) : id, out = iotOutside(id, c);
    iotAllGw(c).forEach(function(g, j){ var m = c.gm[j] || {}; rows.push([nm0, id, iotGid(id, c, j), t('جيت واي'), '', m.serial || '', m.status || 'مخطط', +g[0], +g[1], m.note || '', m.model || '', m.tag || '']); });
    c.sensors.forEach(function(q, i){ var m = c.sm[i] || {}; rows.push([nm0, id, iotSid(id, c, i), t('حساس حرارة ورطوبة'), m.room || '', m.serial || '', m.status || 'مخطط', +q[0], +q[1], (out.indexOf(i) > -1 ? t('خارج حدود المخيم') + ' — ' : '') + (m.note || ''), m.model || '', m.tag || '']); }); });
  if (typeof mtXlsx === 'function') return mtXlsx('حساسات منى', ['المخيم', 'رقم المخيم', 'رقم الجهاز', 'النوع', 'الغرفة', 'السيريال', 'الحالة', 'خط العرض', 'خط الطول', 'ملاحظة', 'الطراز', 'العلامة على الجهاز'], rows);   /* (V39.22) */
  return false;
}

function bedStart(id){
  if (!mayBoundsEdit()){ toast(t('تعديلُ الحدود للمشرف فما فوق')); return false; }
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
  if (!mayBoundsEdit()){ toast(t('تعديلُ الحدود للمشرف فما فوق')); return false; }
  var x = siteFind(BED.id); if (!x) return false;
  if (BED.pts.length < 3){ toast(t('الحدودُ ثلاثُ زوايا على الأقل')); return false; }
  var flat = []; BED.pts.forEach(function(q){ flat.push(+(+q[0]).toFixed(6), +(+q[1]).toFixed(6)); });
  var n = BED.pts.length;
  bedCommit(x, flat, 'تعديلُ حدود مخيم — ' + x.id + ' \u00b7 ' + nm(n) + ' زاوية');
  toast(t('حُفظت حدودُ المخيم')); return true;
}

function bedReset(){
  if (!BED || !BED.orig) return false;
  if (!mayBoundsEdit()){ toast(t('تعديلُ الحدود للمشرف فما فوق')); return false; }
  var x = siteFind(BED.id); if (!x) return false;
  bedCommit(x, [], 'رجوعٌ لحدود المخيم الأصلية — ' + x.id);
  toast(t('عادت حدودُ المخيم الأصلية')); return true;
}

/* { id, n, parts:[[ [lat,lng]… ]…] } */
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
  PV.SPLIT = { id:id, n:3, parts:splitParts(ring, 3) }; POP_OPEN = false; render(1); if (typeof mapPaint === 'function') mapPaint(); }

function splitN(n){ if (!PV.SPLIT) return; var x = siteFind(PV.SPLIT.id); PV.SPLIT.n = n; PV.SPLIT.parts = splitParts(campFoot(x), n); render(1); if (typeof mapPaint === 'function') mapPaint(); }

function splitSuffix(base, k){ var L0 = 'BCDEFGHIJ', id = base + '-' + L0[k - 1]; var g = 0; while (siteFind(id) && g < 30){ g++; id = base + '-' + L0[(k - 1 + g) % L0.length] + (g >= L0.length ? g : ''); } return id; }

function splitSave(){
  if (!PV.SPLIT) return false; if (!maySiteEdit()){ toast(t('تقسيمُ المخيم للمهندس فما فوق')); return false; }
  var x = siteFind(PV.SPLIT.id); if (!x || PV.SPLIT.parts.length < 2){ toast(t('التقسيمُ جزءان على الأقل')); return false; }
  var flat = function(pp){ var f = []; pp.forEach(function(q){ f.push(+(+q[0]).toFixed(6), +(+q[1]).toFixed(6)); }); return f; };
  var cen = function(pp){ var a = 0, b = 0; pp.forEach(function(q){ a += q[0]; b += q[1]; }); return [+(a / pp.length).toFixed(6), +(b / pp.length).toFixed(6)]; };
  var made = [], now = Date.now(), who = (STATE.meta && STATE.meta.name) || '';
  PV.SPLIT.parts.slice(1).forEach(function(pp, i){ var k = i + 1, id = splitSuffix(x.id, k), c = cen(pp), lab = ' (' + nm(k + 1) + ')';
    var site = { id:id, name:(x.name || x.id) + lab, zone:x.zone, type:'مخيم', co:x.co || '', sq:x.sq || '', sign:(x.sign || '') + lab, lat:c[0], lng:c[1], region:x.region || ('منطقة ' + (x.zone || '')),
      poly:flat(pp), polyBy:who, polyAt:now, tents:x.tents || 0, fstat:'لم يبدأ', inout:'', isNew:true, approved:true, appBy:who, appAt:now, by:who, at:now, origin:'office', splitOf:x.id, note:t('من تقسيم المخيم') + ' ' + x.id };
    STATE.sites.push(site); CORE.set('newsites', id, site); made.push(id); });
  if (x.zone === 'منى' || iotOf(x.id)){ try { iotSplit(x.id, [x.id].concat(made).map(function(pid, pi){ return { id:pid, ring:PV.SPLIT.parts[pi] }; })); } catch (eI){ LS_ERR = eI; } }   /* (V37.70) حساساتُ المخيم تتوزّع على الأجزاء وتُكمَّل إلى ١٢ */
  bedCommit(x, flat(PV.SPLIT.parts[0]), 'تقسيمُ مخيم — ' + x.id + ' إلى ' + PV.SPLIT.parts.length + ' أجزاء: ' + made.join('، '));   /* الجزءُ الأوّلُ بحدوده الجديدة — ويُعيد الرسمَ والعدّ */
  PV.SPLIT = null; SITE_IX = null; SITE_TOK = null; statBump(); render(1); if (typeof mapPaint === 'function') mapPaint();
  toast(t('قُسِّم المخيم') + ' — ' + nm(made.length + 1) + ' ' + t('مخيمات')); return made;
}
