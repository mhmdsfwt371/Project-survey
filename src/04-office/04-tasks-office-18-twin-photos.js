/* ============================================================================
   FILE    : src/04-office/04-tasks-office-18-twin-photos.js
   DOMAIN  : Office chunk — the 3D map's digital twin, part four: the installation photos in their places
   PURPOSE : (V39.19) owner: the installation photos on the 3D map. Every point with photos gets a small pin at its
             place, showing its newest photo (from the Drive thumbnails, or the local copy while it waits to upload);
             a tap on the pin opens the point. Pins are HTML markers of the engine, placed on the terrain, kept to
             the sixty nearest the centre so a camp full of points stays readable; they appear from zoom 16.5 and
             follow the frame. The chip «الصور» with the 3D map switches them. Reads photosOf/phSrc; writes nothing.
   DEFINES : phPinOn, phPinTargets, phPinEl, phPinPaint, phPinClear
   PREFIX  : phPin   (every function here starts with it — scripts/audit-names.mjs)
   STATE   : phPinPaint.on (default on), phPinPaint.m (the live markers by site id) — on the function, no new global.
   ============================================================================ */

function phPinOn(){ return phPinPaint.on !== false; }

/* the points in the frame that have a photo, nearest the centre first, at most sixty */
function phPinTargets(){
  var out = [];
  if (!MAP_3D || !M3 || !phPinOn()) return out;
  var b, c, z; try { z = M3.getZoom(); if (z < 16.5) return out; b = M3.getBounds(); c = M3.getCenter(); } catch (e){ LS_ERR = e; return out; }
  (STATE.sites || []).forEach(function(x){
    if (!(+x.lat && +x.lng) || !b.contains([+x.lng, +x.lat])) return;
    var P = photosOf(x.id); if (!P.length) return;
    var src = phSrc(P[0][0], P[0][1], 160); if (!src) return;
    out.push({ site:x, src:src, d:Math.hypot((+x.lng - c.lng) * Math.cos(c.lat * Math.PI / 180), +x.lat - c.lat) });
  });
  out.sort(function(a, b2){ return a.d - b2.d; });
  return out.slice(0, 60);
}
/* the pin: a thumbnail that opens its point — data-site is what the app's click router already understands */
function phPinEl(x, src){
  var el = document.createElement('div'); el.className = 'ph-pin'; el.setAttribute('data-site', x.id); el.setAttribute('role', 'button'); el.setAttribute('aria-label', x.name || x.id); el.title = x.name || x.id;
  var img = document.createElement('img'); img.src = src; img.loading = 'lazy'; img.alt = ''; el.appendChild(img);
  return el;
}
function phPinPaint(){
  if (!MAP_3D || !M3 || !window.maplibregl) return;
  var M = phPinPaint.m || (phPinPaint.m = {}), keep = {};
  phPinTargets().forEach(function(tg){
    keep[tg.site.id] = 1;
    if (M[tg.site.id]) return;
    try {
      var mk = new maplibregl.Marker({ element:phPinEl(tg.site, tg.src), anchor:'bottom' }).setLngLat([+tg.site.lng, +tg.site.lat]).addTo(M3);
      M[tg.site.id] = mk;
    } catch (e){ LS_ERR = e; }
  });
  Object.keys(M).forEach(function(id){ if (!keep[id]){ try { M[id].remove(); } catch (e2){ LS_ERR = e2; } delete M[id]; } });
}
function phPinClear(){ var M = phPinPaint.m || {}; Object.keys(M).forEach(function(id){ try { M[id].remove(); } catch (e){ LS_ERR = e; } }); phPinPaint.m = {}; }
