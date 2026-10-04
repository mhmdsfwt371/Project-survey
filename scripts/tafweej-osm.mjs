/* دراسةُ مواقع التفويج الثلاثة من خريطة الشارع المفتوحة: حدودُ الموقع، والطرقُ التي تعبرها (المداخل والمخارج)، واتجاهُ السير — قراءةٌ فقط.
   الناتجُ مضغوط: لكلِّ موقعٍ مضلّعُه إن وُجد، ونقاطُ عبور الطرق لحدوده بنوعها واتجاهها، وأسماءُ المعالم القريبة. */
import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('/tmp/exp', { recursive: true });
const SITES = [
  { key:'zaidi',  n:'الزايدي — مركز الترحيب والاستقبال (طريق مكة جدة السريع)', c:[21.412247, 39.744221], alt:[[21.3944, 39.7165], [21.4039, 39.7162]] },
  { key:'hijraM', n:'طريق الهجرة — مركز تفويج الحجاج (الجموم، قرب مكة)', c:[21.678187, 39.565172] },
  { key:'hijraD', n:'طريق الهجرة — شركة الأدلاء، مركز استقبال الحجاج (قرب المدينة)', c:[24.340387, 39.554609] }
];
const OP = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const q = async ql => { for (const u of OP){ try { const r = await fetch(u, { method:'POST', body:'data=' + encodeURIComponent(ql), headers:{ 'Content-Type':'application/x-www-form-urlencoded', 'User-Agent':'nusuk-survey-study' } }); if (r.ok) return await r.json(); } catch (e){} } return { elements:[] }; };
const R = 6371000, toR = x => x * Math.PI / 180;
const dist = (a, b) => { const dl = toR(b[0] - a[0]), dn = toR(b[1] - a[1]); const h = Math.sin(dl / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const inPoly = (p, ring) => { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){ const [yi, xi] = ring[i], [yj, xj] = ring[j]; if (((yi > p[0]) !== (yj > p[0])) && (p[1] < (xj - xi) * (p[0] - yi) / (yj - yi + 1e-15) + xi)) ins = !ins; } return ins; };
const area = ring => { let s = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){ s += (ring[j][1] * 111320 * Math.cos(toR(ring[j][0]))) * (ring[i][0] * 110574) - (ring[i][1] * 111320 * Math.cos(toR(ring[i][0]))) * (ring[j][0] * 110574); } return Math.abs(s / 2); };
const segX = (p1, p2, p3, p4) => { const d = (p4[1] - p3[1]) * (p2[0] - p1[0]) - (p4[0] - p3[0]) * (p2[1] - p1[1]); if (Math.abs(d) < 1e-18) return null; const ua = ((p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])) / d, ub = ((p2[0] - p1[0]) * (p1[1] - p3[1]) - (p2[1] - p1[1]) * (p1[0] - p3[0])) / d; if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null; return [p1[0] + ua * (p2[0] - p1[0]), p1[1] + ua * (p2[1] - p1[1]), ua]; };
const out = { at:new Date().toISOString(), sites:[] };
/* المعالمُ المسمّاة في النطاقات */
const named = await q(`[out:json][timeout:90];(nwr["name"~"تفويج|استقبال الحجاج|الترحيب|الأدلاء|الزايدي|Tafweej|Reception"](21.30,39.50,21.75,39.85);nwr["name"~"تفويج|استقبال الحجاج|الأدلاء|Reception"](24.20,39.40,24.50,39.70););out center tags 60;`);
out.named = (named.elements || []).map(e => ({ type:e.type, id:e.id, name:(e.tags || {}).name || '', tags:Object.fromEntries(Object.entries(e.tags || {}).filter(([k]) => /^(amenity|landuse|building|highway|shop|tourism|operator)$/.test(k))), c:e.center ? [e.center.lat, e.center.lon] : (e.lat ? [e.lat, e.lon] : null) })).slice(0, 60);
for (const S of SITES){
  const [la, lo] = S.c;
  const data = await q(`[out:json][timeout:120];(way["highway"](around:600,${la},${lo});way["landuse"](around:450,${la},${lo});way["amenity"](around:450,${la},${lo});way["building"](around:300,${la},${lo});way["area:highway"](around:450,${la},${lo});way["barrier"](around:450,${la},${lo});node["barrier"](around:450,${la},${lo}););out geom tags;`);
  const els = data.elements || [];
  const ways = els.filter(e => e.type === 'way' && e.geometry);
  const polys = ways.filter(w => { const g = w.geometry; return g.length > 3 && g[0].lat === g[g.length - 1].lat && g[0].lon === g[g.length - 1].lon && !(w.tags || {}).highway; })
    .map(w => ({ id:w.id, tags:w.tags || {}, ring:w.geometry.map(p => [p.lat, p.lon]) })).map(p => Object.assign(p, { a:area(p.ring), inside:inPoly(S.c, p.ring) }));
  /* الحدُّ: أكبرُ مضلّعٍ يحوي المركزَ ومساحتُه بين ١٬٥٠٠ م² و٢ كم² */
  const cand = polys.filter(p => p.inside && p.a > 1500 && p.a < 2e6).sort((a, b) => b.a - a.a);
  const B = cand[0] || null;
  const roads = ways.filter(w => (w.tags || {}).highway && !/^(footway|path|steps|pedestrian|cycleway|corridor)$/.test(w.tags.highway));
  const gates = [];
  if (B){
    roads.forEach(w => { const g = w.geometry.map(p => [p.lat, p.lon]); for (let i = 0; i + 1 < g.length; i++){ for (let j = 0; j + 1 < B.ring.length; j++){ const X = segX(g[i], g[i + 1], B.ring[j], B.ring[j + 1]); if (!X) continue;
      const inNext = inPoly(g[i + 1], B.ring), ow = (w.tags.oneway === 'yes' || w.tags.oneway === '1' || /motorway|_link/.test(w.tags.highway) && w.tags.oneway !== 'no') ? 1 : (w.tags.oneway === '-1' ? -1 : 0);
      let kind = 'دخول وخروج'; if (ow === 1) kind = inNext ? 'دخول' : 'خروج'; if (ow === -1) kind = inNext ? 'خروج' : 'دخول';
      gates.push({ lat:+X[0].toFixed(7), lng:+X[1].toFixed(7), kind, hw:w.tags.highway, name:w.tags.name || '', lanes:w.tags.lanes || '', wid:w.id }); } } });
  }
  /* بلا حدٍّ: وصلاتُ الطرق الخدمية بالطريق الرئيس قرب المركز */
  const links = [];
  if (!B){
    const main = roads.filter(w => /^(motorway|trunk|primary|secondary)$/.test(w.tags.highway));
    const mainNodes = new Map(); main.forEach(w => (w.nodes || []).forEach((n, i) => mainNodes.set(n, [w.geometry[i].lat, w.geometry[i].lon, w.tags.name || ''])));
    roads.filter(w => /^(service|unclassified|tertiary|residential|motorway_link|trunk_link|primary_link|secondary_link)$/.test(w.tags.highway)).forEach(w => (w.nodes || []).forEach((n, i) => { if (mainNodes.has(n)){ const p = mainNodes.get(n); const d0 = dist(S.c, [p[0], p[1]]); if (d0 < 650) links.push({ lat:+p[0].toFixed(7), lng:+p[1].toFixed(7), d:Math.round(d0), via:w.tags.highway, name:w.tags.name || '', main:p[2], oneway:w.tags.oneway || '', first:i === 0 }); } }));
  }
  /* تجميعُ البوابات المتقاربة (أقلّ من ٢٥ م) */
  const merged = []; gates.forEach(g => { const m = merged.find(x => x.kind === g.kind && dist([x.lat, x.lng], [g.lat, g.lng]) < 25); if (m){ m.n++; } else merged.push(Object.assign({ n:1 }, g)); });
  out.sites.push({ key:S.key, n:S.n, c:S.c, boundary:B ? { id:B.id, tags:Object.fromEntries(Object.entries(B.tags).filter(([k]) => !/^(source|created_by)/.test(k))).toString ? B.tags : {}, area:Math.round(B.a), ring:B.ring.length > 60 ? B.ring.filter((_, i) => i % Math.ceil(B.ring.length / 60) === 0) : B.ring } : null,
    polysInside:polys.filter(p => p.inside).map(p => ({ id:p.id, a:Math.round(p.a), tags:p.tags })).slice(0, 8),
    gates:merged.slice(0, 40), links:links.slice(0, 40),
    roadsNear:roads.map(w => ({ hw:w.tags.highway, name:w.tags.name || '', oneway:w.tags.oneway || '', lanes:w.tags.lanes || '' })).filter((r, i, a) => a.findIndex(z => z.hw === r.hw && z.name === r.name) === i).slice(0, 25),
    barriers:els.filter(e => e.type === 'node' && (e.tags || {}).barrier).map(e => ({ lat:e.lat, lng:e.lon, b:e.tags.barrier })).slice(0, 20) });
}
writeFileSync('/tmp/exp/tafweej-osm.json', JSON.stringify(out));
console.log(JSON.stringify(out.sites.map(s => [s.key, !!s.boundary, s.boundary && s.boundary.area, s.gates.length, s.links.length])), '| named', out.named.length);
