/* ============================================================================
   FILE    : src/04-office/04-tasks-office-19-twin-engine.js
   DOMAIN  : Office chunk — the digital twin engine: real 3D models inside the 3D map
   PURPOSE : (V39.24) owner: «الديجيتال توين حاجة دايناميك: أدخل بالماوس جوّه المكان، أشوف الأجهزة المتركّبة بمواقعها
             عند مدخل المخيم — الريدر والراوتر — والحساسات جوّه في الغرف، وأقف بالماوس يظهر الـvalue». The map engine
             draws only flat-topped blocks; this file adds a real 3D engine (three.js, vendored, loaded only here)
             as a layer inside the same map, sharing its camera and depth: when the camera comes close (zoom 17.5+)
             the camps nearest the centre are rebuilt as models — every 8 m tent a body with a true pyramid roof,
             aligned to the camp's rows; the sensors at their real positions on the tent beams (2.4 m) with a halo in
             their status (or live) colour; the gateways as cabinets with their antenna; and the point's own devices
             from the installation record — reader on its pole, router, camera — at the camp's street entrance.
             Closer still (zoom 19.2+) the roofs lift off and the tents turn see-through, so the rooms and what is in
             them are seen from inside. The mouse over anything says its value; a tap opens its card. The flat
             blocks of the same camps hide while the models stand. Reads the same records; writes nothing.
   DEFINES : teState, teOn, teLoad, teLayer, teMaybe, teKey, teBuild, teClear, teFilters, teRay, teHoverHtml, teHit, teClick, teWalkOn, teWalkOff, teWalkDo, teWalkHtml
   PREFIX  : te   (every function here starts with it — scripts/audit-names.mjs)
   STATE   : teState() — the library, the layer, the scene's camps and origin — on the function, no new global.
   ============================================================================ */

function teState(){ return teState.s || (teState.s = { lib:false, loading:null, layer:null, ids:[], key:'', origin:null, hoverAt:0, hover:false }); }
function teOn(){ return typeof tentOn !== 'function' || tentOn(); }   /* the «الخيام» chip switches the models too */

function teLoad(){
  var S = teState();
  if (S.lib || window.THREE){ S.lib = true; return Promise.resolve(true); }
  if (S.loading) return S.loading;
  S.loading = new Promise(function(res){
    var js = document.createElement('script'); js.src = 'vendor/three/0.149.0/three.min.js';
    js.onload = function(){ S.lib = !!window.THREE; res(S.lib); };
    js.onerror = function(){ S.loading = null; res(false); };
    document.head.appendChild(js);
    setTimeout(function(){ if (!S.lib){ S.loading = null; res(false); } }, 20000);
  });
  return S.loading;
}

/* the map layer that hosts the scene: the map's camera drives three's camera; depth is shared with the extrusions */
function teLayer(){
  var S = teState(); if (S.layer || !M3 || !window.THREE) return S.layer;
  var THREE = window.THREE;
  S.layer = {
    id:'nsk-twin3d', type:'custom', renderingMode:'3d',
    onAdd:function(map, gl){
      this.camera = new THREE.Camera(); this.scene = new THREE.Scene(); this.root = new THREE.Group(); this.scene.add(this.root);
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.72));
      var sun = new THREE.DirectionalLight(0xffffff, 0.6); sun.position.set(-60, 120, 40); this.scene.add(sun);
      this.renderer = new THREE.WebGLRenderer({ canvas:map.getCanvas(), context:gl, antialias:true });
      this.renderer.autoClear = false;
    },
    render:function(gl, matrix){
      var o = S.origin; if (!o || !this.root.children.length) return;
      var m = new THREE.Matrix4().fromArray(matrix);
      var l = new THREE.Matrix4().makeTranslation(o.mx, o.my, o.mz).scale(new THREE.Vector3(o.s, -o.s, o.s)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState(); this.renderer.render(this.scene, this.camera);
    }
  };
  try { M3.addLayer(S.layer); } catch (e){ LS_ERR = e; S.layer = null; }
  return S.layer;
}

/* called on every settle of the 3D camera: build when close, clear when far */
function teMaybe(force){
  if (!MAP_3D || !M3) return;
  var z; try { z = M3.getZoom(); } catch (e){ LS_ERR = e; return; }
  if (z < 18.5 || !teOn() || (typeof LITE !== 'undefined' && LITE)){ teClear(); return; }   /* (V39.28) the models from 18.5 */   /* far, switched off, or the light mode: the flat blocks only */
  teLoad().then(function(ok){ if (!ok || !MAP_3D) return; teLayer(); teBuild(!!force); });
}
/* what the scene shows depends on: the camps near the centre, their sensors and installations, the live mode, the zoom band */
function teKey(ids){
  var z = 0; try { z = M3.getZoom(); } catch (e){ LS_ERR = e; }
  return ids.join(',') + '|' + (z >= 19.2 ? 'open' : 'roof') + '|' + (liveState().on ? 'live' : '') + '|' + ids.map(function(id){
    var c = iotOf(id), r = (STATE.inss || {})[id]; return (c ? c.sensors.length + ':' + (c.at || '') + ':' + c.gw.join(',') : '-') + '/' + (r ? JSON.stringify(r.parts || {}) + (r.status || '') : '-') + '/' + (typeof iotFieldGate === 'function' && iotFieldGate(id) ? 'g' : '');
  }).join(';');
}
function teBuild(force){
  var S = teState(), L = S.layer; if (!L || !L.root || !window.THREE || typeof M3_FOOT !== 'object') return;
  var THREE = window.THREE, c0 = M3.getCenter(), z = M3.getZoom();
  var kx0 = 111320 * Math.cos(c0.lat * Math.PI / 180);
  /* the nearest six camps with a boundary within 250 m of the centre */
  var ids = Object.keys(M3_FOOT).map(function(id){ var R = M3_FOOT[id], ln = 0, la = 0; R.forEach(function(q){ ln += +q[0]; la += +q[1]; }); ln /= R.length; la /= R.length;
      return { id:id, d:Math.hypot((ln - c0.lng) * kx0, (la - c0.lat) * 111320) }; })
    .filter(function(a){ return a.d < 250; }).sort(function(a, b){ return a.d - b.d; }).slice(0, 6).map(function(a){ return a.id; }).sort();
  var key = teKey(ids);
  if (!force && key === S.key && S.origin && Math.hypot((S.origin.lng - c0.lng) * kx0, (S.origin.lat - c0.lat) * 111320) < 300) return;
  teClear(true);
  S.key = key; S.ids = ids; if (!ids.length){ teFilters([]); return; }
  /* the scene's origin: the centre, at the terrain's height there */
  var elev = function(ln, la){ try { var e = M3.queryTerrainElevation ? M3.queryTerrainElevation([ln, la]) : 0; return +e || 0; } catch (e1){ LS_ERR = e1; return 0; } };
  var e0 = elev(c0.lng, c0.lat), mc = maplibregl.MercatorCoordinate.fromLngLat([c0.lng, c0.lat], e0);
  S.origin = { lng:c0.lng, lat:c0.lat, mx:mc.x, my:mc.y, mz:mc.z, s:mc.meterInMercatorCoordinateUnits() };
  var X = function(ln){ return (ln - c0.lng) * kx0; }, Zc = function(la){ return -(la - c0.lat) * 111320; };
  var open = z >= 19.2, T_ = tentCfg();
  var bodyGeo = new THREE.BoxGeometry(T_.size - 0.4, T_.body, T_.size - 0.4), roofGeo = new THREE.ConeGeometry((T_.size - 0.4) / Math.SQRT2, 1.4, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  var bodyMat = new THREE.MeshLambertMaterial({ color:0xF3F0E7, transparent:true, opacity:open ? 0.28 : 0.9, depthWrite:!open });
  var roofMat = new THREE.MeshLambertMaterial({ color:0xE6E0D0 });
  var dummy = new THREE.Object3D();
  ids.forEach(function(id){
    var ring = M3_FOOT[id], x = siteFind(id), cl = 0, ca = 0; ring.forEach(function(q){ cl += +q[0]; ca += +q[1]; }); cl /= ring.length; ca /= ring.length;
    var y0 = elev(cl, ca) - e0 + T_.plinth;
    /* the tents: bodies and pyramid roofs, one instanced mesh each per camp */
    var cells = tentCells(ring);
    if (cells.length){
      var bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, cells.length), roofs = open ? null : new THREE.InstancedMesh(roofGeo, roofMat, cells.length);
      cells.forEach(function(cel, k){
        var b = cel.body, mx = (b[0][0] + b[1][0] + b[2][0] + b[3][0]) / 4, my = (b[0][1] + b[1][1] + b[2][1] + b[3][1]) / 4;
        var ang = Math.atan2((b[1][1] - b[0][1]) * 111320, (b[1][0] - b[0][0]) * kx0);
        dummy.position.set(X(mx), y0 + T_.body / 2, Zc(my)); dummy.rotation.set(0, ang, 0); dummy.updateMatrix(); bodies.setMatrixAt(k, dummy.matrix);
        if (roofs){ dummy.position.set(X(mx), y0 + T_.body + 0.7, Zc(my)); dummy.updateMatrix(); roofs.setMatrixAt(k, dummy.matrix); }
      });
      bodies.userData = { kind:'tent', camp:id }; L.root.add(bodies); if (roofs){ roofs.userData = { kind:'tent', camp:id }; L.root.add(roofs); }
    }
    /* the sensors on the beams, and the gateways as cabinets */
    var c = iotOf(id);
    if (c){
      var out = iotOutside(id, c);
      c.sensors.forEach(function(q, i){
        var m = c.sm[i] || {}, col = iotColor('s', m, out.indexOf(i) > -1, false);
        if (liveState().on){ var lv = liveSensor(id, m.id || iotSid(id, c, i)); col = !lv ? '#5B6570' : lv.on ? '#3ED598' : '#E05252'; }
        var g = new THREE.Group(); g.position.set(X(+q[1]), y0 + 2.4, Zc(+q[0]));
        var box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.16), new THREE.MeshLambertMaterial({ color:0xFAFAFA })); g.add(box);
        var halo = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10), new THREE.MeshBasicMaterial({ color:new THREE.Color(col), transparent:true, opacity:0.55 })); g.add(halo);
        g.userData = { kind:'s', camp:id, i:i }; box.userData = g.userData; halo.userData = g.userData; L.root.add(g);
      });
      iotAllGw(c).forEach(function(q, j){
        if (!q) return; var m = c.gm[j] || {};
        var g = new THREE.Group(); g.position.set(X(+q[1]), y0 - T_.plinth, Zc(+q[0]));
        var cab = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.5), new THREE.MeshLambertMaterial({ color:new THREE.Color(iotColor('g', m, false, false)) })); cab.position.y = 0.75; g.add(cab);
        var ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8), new THREE.MeshLambertMaterial({ color:0x333333 })); ant.position.set(0.25, 2.05, 0); g.add(ant);
        g.userData = { kind:'g', camp:id, i:j }; cab.userData = g.userData; ant.userData = g.userData; L.root.add(g);
      });
    }
    /* the point's own devices at the street entrance: reader on its pole, camera on its pole, router beside the cabinet */
    var r = (STATE.inss || {})[id], gate = (typeof iotFieldGate === 'function' && iotFieldGate(id)) || (x ? [+x.lat, +x.lng] : null);
    if (r && r.parts && gate){
      var has = function(re){ return Object.keys(r.parts).filter(function(k){ return re.test(k) && +r.parts[k] > 0; })[0] || ''; };
      var gx = X(+gate[1]) + 1.4, gz = Zc(+gate[0]), gy = y0 - T_.plinth;
      var pole = function(h, dx){ var p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 8), new THREE.MeshLambertMaterial({ color:0x9AA3AD })); p.position.set(gx + dx, gy + h / 2, gz); L.root.add(p); };
      var dev = function(code, geo, color, px, py){ if (!code) return; var mm = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color:new THREE.Color(color) })); mm.position.set(gx + px, gy + py, gz);
        mm.userData = { kind:'d', site:id, code:code, serial:((r.serials || {})[code] || '') }; L.root.add(mm); };
      var rd = has(/^rdr/), cm = has(/^cam/), rt = has(/^rtr/);
      if (rd){ pole(3, 0); dev(rd, new THREE.BoxGeometry(0.55, 0.55, 0.14), '#7C4DFF', 0, 2.6); }
      if (cm){ pole(3.6, 1.2); dev(cm, new THREE.CylinderGeometry(0.12, 0.12, 0.42, 12).rotateZ(Math.PI / 2), '#2D7DD2', 1.2, 3.5); }
      if (rt) dev(rt, new THREE.BoxGeometry(0.4, 0.1, 0.28), '#F5A623', -0.6, 1.0);
    }
  });
  teFilters(ids);
  try { M3.triggerRepaint(); } catch (e2){ LS_ERR = e2; }
}
/* remove the models (and give the flat blocks back) */
function teClear(keepKey){
  var S = teState(), L = S.layer;
  if (L && L.root){ L.root.children.slice().forEach(function(o){ L.root.remove(o); o.traverse(function(n){ if (n.geometry) n.geometry.dispose(); if (n.material) n.material.dispose(); }); }); }
  if (!keepKey){ S.key = ''; S.ids = []; teFilters([]); }
  try { if (M3) M3.triggerRepaint(); } catch (e){ LS_ERR = e; }
}
/* the flat layers of the same camps hide while their models stand */
function teFilters(ids){
  if (!M3 || !M3.getLayer) return;
  var not = function(prop){ return ['!', ['in', ['get', prop], ['literal', ids.length ? ids : ['\u0000']]]]; };
  try {
    if (M3.getLayer('nsk-tent')) M3.setFilter('nsk-tent', ids.length ? not('camp') : null);
    if (M3.getLayer('nsk-twin')) M3.setFilter('nsk-twin', ids.length ? not('site') : null);
    if (M3.getLayer('nsk-iot')) M3.setFilter('nsk-iot', ['all', ['==', ['geometry-type'], 'Polygon']].concat(ids.length ? [not('camp')] : []));
    if (M3.getLayer('nsk-iot-pt')) M3.setFilter('nsk-iot-pt', ['all', ['==', ['geometry-type'], 'Point']].concat(ids.length ? [not('camp')] : []));
  } catch (e){ LS_ERR = e; }
}
/* the ray under the mouse: the near and far points of that pixel, unprojected through the layer's matrix */
function teRay(point){
  var S = teState(), L = S.layer; if (!L || !L.camera || !L.root.children.length || !window.THREE) return null;
  var THREE = window.THREE, cv = M3.getCanvas(), w = cv.clientWidth || 1, h = cv.clientHeight || 1;
  var nx = point.x / w * 2 - 1, ny = 1 - point.y / h * 2, inv = L.camera.projectionMatrix.clone().invert();
  var a = new THREE.Vector3(nx, ny, -1).applyMatrix4(inv), b = new THREE.Vector3(nx, ny, 1).applyMatrix4(inv);
  var rc = new THREE.Raycaster(a, b.sub(a).normalize());
  var hits = rc.intersectObjects(L.root.children, true);
  for (var i = 0; i < hits.length; i++){ var u = hits[i].object.userData || {}; if (u.kind && u.kind !== 'tent') return u; }
  return hits.length ? (hits[0].object.userData || null) : null;
}
function teHoverHtml(u){
  if (!u) return '';
  if (u.kind === 's' || u.kind === 'g'){
    var c = iotOf(u.camp); if (!c) return '';
    var did = u.kind === 's' ? iotSid(u.camp, c, u.i) : iotGid(u.camp, c, u.i), h = m3HoverHtml('nsk-iot-pt', { camp:u.camp, kind:u.kind, i:u.i, did:did });
    if (u.kind === 's'){ var lv = liveSensor(u.camp, did); h += '<br>' + (lv ? esc(t('القراءة')) + ' <b class="num">' + esc(String(lv.v)) + '</b> \u00b7 ' + esc(pilotAgo(lv.at)) : '<span class="hint" style="margin:0">' + esc(t('لا قراءة بعد — بانتظار مصدر القراءات')) + '</span>'); }
    return h;
  }
  if (u.kind === 'd') return '<b>' + esc(t(itemName(u.code))) + '</b>' + (u.serial ? ' \u00b7 <span class="num">' + esc(u.serial) + '</span>' : '') + (u.code && /^rdr/.test(u.code) && liveState().on ? '<br>' + esc(liveTextOf(siteFind(u.site))) : '');
  if (u.kind === 'tent'){ var x = siteFind(u.camp); return x ? '<b>' + esc(x.name || x.id) + '</b>' : ''; }
  return '';
}
/* the mouse: a hit says its value; a tap opens the card — before the camp under it takes the tap */
function teHit(ev){
  var S = teState(); if (!S.ids.length) return false;
  var now = Date.now(); if (now - S.hoverAt < 60) return S.hover; S.hoverAt = now;
  var u = teRay(ev.point);
  if (u && u.kind !== 'tent'){ m3Hover(ev, teHoverHtml(u)); S.hover = true; return true; }
  if (S.hover){ m3Hover(null); S.hover = false; }
  return false;
}
function teClick(ev){
  var S = teState(); if (!S.ids.length || (ev.originalEvent && ev.originalEvent._nskTe)) return !!(ev.originalEvent && ev.originalEvent._nskTe);
  var u = teRay(ev.point); if (!u || u.kind === 'tent') return false;
  if (ev.originalEvent) ev.originalEvent._nskTe = true;
  var html = u.kind === 's' || u.kind === 'g' ? iotDevHtml(u.camp, u.kind, u.i) : dtwCardHtml({ site:u.site, code:u.code, i:0, serial:u.serial });
  try { new maplibregl.Popup({ closeButton:true, maxWidth:'290px' }).setLngLat(ev.lngLat).setHTML('<div class="iot-pop" dir="auto">' + html + '</div>').addTo(M3); } catch (e){ LS_ERR = e; }
  return true;
}

/* (V39.25) owner: «أقدر بالماوس أدخل جوّه المكان» — after «ادخل المخيم» the camera walks: ↑/W forward and ↓/S back by
   2.5 m along the view, ←/A and →/D turn 15°, Esc leaves; on a phone the same four arrows stand at the bottom of the map.
   The map's own keyboard (which pans by screens) is off while walking and back when the walk ends. */
function teWalkOn(){
  var S = teState(); S.walk = true;
  try { if (M3 && M3.keyboard) M3.keyboard.disable(); } catch (e){ LS_ERR = e; }
  if (!teWalkOn.bound){
    teWalkOn.bound = true;
    document.addEventListener('keydown', function(ev){
      if (!teState().walk || !MAP_3D) return;
      var tg = ev.target && ev.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
      var k = ev.key, act = (k === 'ArrowUp' || k === 'w' || k === 'W') ? 'f' : (k === 'ArrowDown' || k === 's' || k === 'S') ? 'b' : (k === 'ArrowLeft' || k === 'a' || k === 'A') ? 'l' : (k === 'ArrowRight' || k === 'd' || k === 'D') ? 'r' : k === 'Escape' ? 'x' : '';
      if (!act) return; ev.preventDefault(); teWalkDo(act);
    });
  }
  render(1);
}
function teWalkOff(){
  var S = teState(); S.walk = false;
  try { if (M3 && M3.keyboard) M3.keyboard.enable(); } catch (e){ LS_ERR = e; }
  render(1);
}
function teWalkDo(act){
  if (act === 'x'){ teWalkOff(); return; }
  if (!M3) return;
  var c = M3.getCenter(), b = M3.getBearing();
  if (act === 'l' || act === 'r'){ try { M3.easeTo({ bearing:b + (act === 'l' ? -15 : 15), duration:220 }); } catch (e){ LS_ERR = e; } return; }
  var d = act === 'f' ? 2.5 : -2.5, r = b * Math.PI / 180, kx = 111320 * Math.cos(c.lat * Math.PI / 180);
  try { M3.easeTo({ center:[c.lng + Math.sin(r) * d / kx, c.lat + Math.cos(r) * d / 111320], duration:220 }); } catch (e2){ LS_ERR = e2; }
}
/* the walking pad over the map */
function teWalkHtml(){
  if (!teState().walk || !MAP_3D) return '';
  var b = function(a, ic, lab){ return '<button type="button" class="map-chip" data-tewalk="' + a + '" aria-label="' + esc(t(lab)) + '" style="min-width:44px;justify-content:center">' + ic + '</button>'; };
  return '<div class="map-route-box" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center">'
    + '<span class="hint" style="margin:0">\u{1F6B6} ' + esc(t('المشي داخل المخيم')) + '</span>'
    + b('l', '\u21BA', 'استدر يسارًا') + b('f', '\u25B2', 'إلى الأمام') + b('b', '\u25BC', 'إلى الخلف') + b('r', '\u21BB', 'استدر يمينًا')
    + '<button type="button" class="map-chip" data-tewalk="x">\u2716 ' + esc(t('اخرج')) + '</button></div>';
}