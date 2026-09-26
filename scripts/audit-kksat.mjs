/* ═══════════════════════════════════════════════════════════════════════════
   جردُ القمر الصناعي في شاشة الوزارة — node scripts/audit-kksat.mjs
   ───────────────────────────────────────────────────────────────────────────
   بمحاكي ليفليت بيدٍ: الافتراضيُّ القمرُ الصناعي، وطبقةُ Esri نفسُها، ودائرةٌ لكلِّ
   نقطةٍ في جسم المشعر بلون حالتها، والضغطُ يفتحها، والإطارُ يبقى بين التجديدات،
   وزرُّ «نقاط» يعيد الخريطةَ المجرّدة، وبلا ليفليت تُرسَم المجرّدةُ بصمت.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');
function fakeL(w){
  const S = { maps:[], tiles:[], markers:[] };
  const map = el => { const m = { el, layers:[], handlers:{}, view:null, z:0, dragging:{ on:true, enable(){ m.dragging.on = true; }, disable(){ m.dragging.on = false; } }, remove(){ m.removed = true; }, setView(c, z){ m.view = c; m.z = z; return m; }, getCenter(){ return { lat:(m.view||[0,0])[0], lng:(m.view||[0,0])[1] }; }, getZoom(){ return m.z; }, fitBounds(b){ m.fit = b; m.view = [(b.s + b.n) / 2, (b.w + b.e) / 2]; m.z = 15; return m; }, on(k, f){ m.handlers[k] = f; return m; }, fire(k){ if (m.handlers[k]) m.handlers[k](); } }; S.maps.push(m); return m; };
  w.L = { Browser:{ touch:true }, map, tileLayer: (url, o) => ({ url, o, addTo(m){ S.tiles.push({ url, m }); return this; } }), canvas: () => ({}),
          circleMarker: (ll, o) => { const mk = { ll, o, on(k, f){ mk[k] = f; return mk; }, addTo(m){ S.markers.push(mk); m.layers.push(mk); return mk; } }; return mk; },
          latLngBounds: pts => ({ s:Math.min(...pts.map(p => p[0])), n:Math.max(...pts.map(p => p[0])), w:Math.min(...pts.map(p => p[1])), e:Math.max(...pts.map(p => p[1])) }) };
  return S;
}
async function boot(withL){
  let S = null;
  const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
  const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
  w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
  w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
  w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
  if (withL){ S = fakeL(w); w.mapInit = () => {}; w.mapPaint = () => {}; }   /* بعد الإقلاع: الخريطةُ الرئيسةُ لا تُبنى على المحاكي */
  w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
  d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  await wait(1500);
  const open = async (p, tab) => { w.goPage(p); w.render(1); await wait(60); const b = d.querySelector('[data-ptab="' + p + ':' + tab + '"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(200); } return d.getElementById('content'); };
  return { w, d, wait, dom, S, open };
}

console.log('\n══ ١ · مع ليفليت: القمرُ الصناعيُّ افتراضًا ══');
{
  const { w, d, wait, dom, S, open } = await boot(true);
  w.STATE.sites.push({ id:'NSK-MIN-CMP-9999', name:'ضالّة', zone:'منى', type:'مخيم', lat:21.6, lng:39.6 }); w.SITE_IX = null; w.statBump();
  const c = await open('mfu', 'kiosk'); await wait(300);
  T(w.KK_VIEW === 'sat' && !!d.getElementById('kkSat') && !d.querySelector('.kk-pts'), 'الافتراضيُّ القمرُ الصناعي لا النقاطُ المجرّدة');
  T(S.tiles.length === 1 && /World_Imagery/.test(S.tiles[0].url) && S.tiles[0].url === w.TILES.esri, 'وطبقةُ Esri نفسُها التي في الخريطة الرئيسة');
  const core = w.STATE.sites.filter(x => x.zone === 'منى' && +x.lat && +x.lng).length - 1;
  T(S.markers.length === core, 'ودائرةٌ لكلِّ نقطةٍ في جسم المشعر (البعيدةُ خارجَه): ' + S.markers.length);
  const x0 = w.STATE.sites.find(x => x.zone === 'منى' && +x.lat);
  const mk = S.markers.find(m => m.ll[0] === +x0.lat && m.ll[1] === +x0.lng);
  T(!!mk && mk.o.fillColor === w.LIFE[w.lifeOf(x0)].c, 'وبلون حالتها');
  T(/بعيدةٍ عن المشعر/.test(c.textContent), 'والبعيدةُ تُذكَر تحت الخريطة');
  const mm = S.maps[S.maps.length - 1], lk = d.querySelector('.kk-lock');
  T(mm.dragging.on === false && !!lk && /اضغط لتحريك/.test(lk.textContent), 'على اللمس: التحريكُ معطَّلٌ حتى تُضغَط الخريطة (تُمرَّر الصفحةُ بإصبع)');
  lk.click(); await wait(20);
  T(mm.dragging.on === true && /إيقاف التحريك/.test(lk.textContent), 'وضغطةٌ تفعّله ويظهر زرُّ الإيقاف');
  lk.click(); await wait(20);
  T(mm.dragging.on === false, 'والإيقافُ يعطّله ثانية');
  mk.click(); await wait(50);
  T(w.CUR === 'site' && w.DETAIL_ID === x0.id, 'والضغطُ على الدائرة يفتح النقطة');
  await open('mfu', 'kiosk'); await wait(300);
  const m1 = S.maps[S.maps.length - 1]; m1.setView([21.41, 39.88], 17); m1.fire('moveend');
  w.render(1); await wait(300);
  const m2 = S.maps[S.maps.length - 1];
  T(m2 !== m1 && m2.z === 17 && Math.abs(m2.view[0] - 21.41) < 1e-9, 'والإطارُ يبقى بين تجديدات الشاشة');
  d.querySelector('[data-kkview="pts"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(200);
  T(w.KK_VIEW === 'pts' && !!d.querySelector('.kk-pts') && !d.getElementById('kkSat'), 'وزرُّ «نقاط» يعيد الخريطةَ المجرّدة');
  d.querySelector('[data-kkview="sat"]').dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(200);
  T(w.KK_VIEW === 'sat' && !!d.getElementById('kkSat'), 'ويعود القمرُ الصناعيُّ بزرّه');
  dom.window.close();
}
console.log('\n══ ٢ · بلا ليفليت: النقاطُ المجرّدةُ بصمت ══');
{
  const { w, d, wait, dom, open } = await boot(false);
  await open('mfu', 'kiosk'); await wait(300);
  T(w.KK_VIEW === 'sat' && !!d.querySelector('.kk-pts') && !w.LS_ERR, 'الطلبُ قمرٌ صناعيٌّ والمكتبةُ غائبة: تُرسَم النقاطُ بلا خطأ');
  dom.window.close();
}
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ القمر الصناعي نظيف \u2705'); process.exit(0);
