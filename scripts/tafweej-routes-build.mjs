/* ═══════════════════════════════════════════════════════════════════════════
   مولّدُ مسارات التفويج (V25.6) — node scripts/tafweej-routes-build.mjs <maps/mina-osm.json>
   ───────────────────────────────────────────────────────────────────────────
   لماذا: كانت المساراتُ تُطابَق قطعةً قطعةً من مخطّط الوزارة على شبكة الشوارع فخرجت مجزَّأةً
   (٢٣١ قطعةً في الدور الأول) وفيها لفاتٌ لا معنى لها. صار المسارُ يُبنى من الأصل الذي بُني له:
   لكلِّ مخيمٍ في ملف الوزارة (assign) أقصرُ طريقٍ على الشوارع الفعلية من المخيم إلى مداخل دوره
   (الذهاب) ومن مخارج دوره إلى المخيم (العودة) — مفضِّلًا الشوارعَ التي يمرّ بها المخطّطُ (خطوطُ
   الدور القديمة تُستعمَل دليلَ الممرّ: ما قرب منها أرخصُ ثلاثَ مرات) — فلا لفة، لأن أقصرَ طريقٍ
   لا يلفّ. ثم تُدمَج طرقُ مخيمات الدور في شبكةٍ واحدةٍ بلا تكرار.
   وأطرافُ الخطوط القديمة التي لا مخيمَ عندها (ولا هي على جسرٍ أو نفق) تُخرَج نقاطَ «احتمال مخيم»
   للتحقّق الميداني — قرارُ المالك.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'fs';

const osmPath = process.argv[2] || 'maps/mina-osm.json';
const html = readFileSync('index.html', 'utf8');
const RAW = JSON.parse(/var SITES_RAW = (\{.*?\});\n/.exec(html)[1]);
const POLY = JSON.parse(readFileSync('poly.json', 'utf8'));
const TF = JSON.parse(readFileSync('layers/tafweej.json', 'utf8'));
const OLD = JSON.parse(readFileSync('layers/tafweej-plan.json', 'utf8'));   /* خطوطُ المخطّط كما طُوبقت أوّلَ مرة (V24.3) — دليلُ الممرّ، لا ناتجُ هذا المولّد */
const OSM = JSON.parse(readFileSync(osmPath, 'utf8'));

const R = 6371000, rad = Math.PI / 180;
const dist = (a, b) => { const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad, s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };
const LAT0 = 21.41, KX = 111320 * Math.cos(LAT0 * rad), KY = 111320;
const xy = p => [(p[1] - 39.88) * KX, (p[0] - LAT0) * KY];
const segDist = (p, a, b) => { const P = xy(p), A = xy(a), B = xy(b); const dx = B[0] - A[0], dy = B[1] - A[1], l2 = dx * dx + dy * dy; let t = l2 ? ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); const X = A[0] + t * dx, Y = A[1] + t * dy; return Math.hypot(P[0] - X, P[1] - Y); };

/* ── السجل: المخيماتُ ونقاطُ الجمرات ── */
const camps = {}; RAW.g.forEach(r => { camps[r[0]] = { id: r[0], lat: +r[5], lng: +r[6] }; });
const pts = {}; RAW.p.forEach(r => { pts[r[0]] = { id: r[0], lat: +r[5], lng: +r[6] }; });
const campCenter = id => { const ring = POLY[id]; if (ring && ring.length >= 3){ let x = 0, y = 0; ring.forEach(p => { x += p[1]; y += p[0]; }); return [x / ring.length, y / ring.length]; } const c = camps[id]; return c ? [c.lat, c.lng] : null; };

/* ── الشبكة من شوارع منى: كلُّ نقطةِ رسمٍ عقدة، والمشتركُ بين الشوارع يُوصَل بتطابق الإحداثيات ── */
const ways = OSM.elements.filter(e => e.type === 'way' && e.geometry && e.tags && e.tags.highway);
const nodes = new Map(), adj = new Map();   /* key → [lat,lng] ; key → [{to, w, mid, bridge}] */
const key = p => p[0].toFixed(6) + ',' + p[1].toFixed(6);
const addEdge = (a, b, meta) => { const ka = key(a), kb = key(b); if (ka === kb) return; if (!nodes.has(ka)) nodes.set(ka, a); if (!nodes.has(kb)) nodes.set(kb, b); const w = dist(a, b); const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; (adj.get(ka) || adj.set(ka, []).get(ka)).push({ to: kb, w, mid, meta }); (adj.get(kb) || adj.set(kb, []).get(kb)).push({ to: ka, w, mid, meta }); };
ways.forEach(wy => { const g = wy.geometry.map(p => [p.lat, p.lon]); const meta = { bridge: !!wy.tags.bridge, tunnel: !!wy.tags.tunnel, name: wy.tags.name || '' }; for (let i = 1; i < g.length; i++) addEdge(g[i - 1], g[i], meta); });
let nodeList = [...nodes.entries()]; const refreshNodes = () => { nodeList = [...nodes.entries()]; };
/* المخيماتُ مضلّعاتٌ: الطريقُ في الممرّات بينها لا داخلَها — العقدةُ داخل مخيمٍ لا تصلح بدايةً، والحافّةُ داخل مخيمٍ عشرُ كلفتها */
const inRingLL = (p, ring) => { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){ const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]; if (((yi > p[0]) !== (yj > p[0])) && (p[1] < (xj - xi) * (p[0] - yi) / ((yj - yi) || 1e-12) + xi)) inside = !inside; } return inside; };
const campPolys = Object.keys(POLY).map(id => { const ring = POLY[id]; if (!ring || ring.length < 3) return null; let a = 1e9, b = -1e9, c = 1e9, d = -1e9; ring.forEach(q => { a = Math.min(a, q[1]); b = Math.max(b, q[1]); c = Math.min(c, q[0]); d = Math.max(d, q[0]); }); return { id, ring, a, b, c, d }; }).filter(Boolean);
const campOf = p => { for (const o of campPolys){ if (p[0] < o.a || p[0] > o.b || p[1] < o.c || p[1] > o.d) continue; if (inRingLL(p, o.ring)) return o.id; } return null; };
const insideAny = new Map(); const insideCamp = k => { if (!insideAny.has(k)) insideAny.set(k, !!campOf(nodes.get(k))); return insideAny.get(k); };
const nearestNode = (p, maxM, free) => { let best = null, bd = maxM; for (const [k, q] of nodeList){ const d = dist(p, q); if (d < bd && (!free || !insideCamp(k))){ bd = d; best = k; } } return best; };

/* ── دليلُ الممرّ: خطوطُ الدور القديمة (ذهابًا وعودة) — فهرسُ شبكةٍ للسرعة ── */
const CELL = 60;
const guideIndex = fk => { const fl = OLD.floors[fk] || {}; const segs = []; ['go', 'back'].forEach(k => (fl[k] || []).forEach(pl => { for (let i = 1; i < pl.length; i++) segs.push([pl[i - 1], pl[i]]); })); const grid = new Map(); segs.forEach((sg, i) => { const A = xy(sg[0]), B = xy(sg[1]); const x0 = Math.floor(Math.min(A[0], B[0]) / CELL) - 1, x1 = Math.floor(Math.max(A[0], B[0]) / CELL) + 1, y0 = Math.floor(Math.min(A[1], B[1]) / CELL) - 1, y1 = Math.floor(Math.max(A[1], B[1]) / CELL) + 1; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++){ const c = x + ':' + y; (grid.get(c) || grid.set(c, []).get(c)).push(i); } }); return p => { const P = xy(p), c = Math.floor(P[0] / CELL) + ':' + Math.floor(P[1] / CELL); const cand = grid.get(c); if (!cand) return Infinity; let bd = Infinity; for (const i of cand){ const d = segDist(p, segs[i][0], segs[i][1]); if (d < bd) bd = d; } return bd; }; };

/* ── ديكسترا من عدّة منابع (مداخلُ الدور أو مخارجُه) بكلفةٍ تفضّل الممرّ ── */
const dijkstra = (sources, onPlan) => { const distTo = new Map(), prev = new Map(); const pq = []; const push = (d, k) => { pq.push([d, k]); let i = pq.length - 1; while (i > 0){ const p = (i - 1) >> 1; if (pq[p][0] <= pq[i][0]) break; [pq[p], pq[i]] = [pq[i], pq[p]]; i = p; } }; const pop = () => { const top = pq[0], last = pq.pop(); if (pq.length){ pq[0] = last; let i = 0; for (;;){ const l = 2 * i + 1, r = l + 1; let m = i; if (l < pq.length && pq[l][0] < pq[m][0]) m = l; if (r < pq.length && pq[r][0] < pq[m][0]) m = r; if (m === i) break; [pq[m], pq[i]] = [pq[i], pq[m]]; i = m; } } return top; }; sources.forEach(k => { distTo.set(k, 0); push(0, k); }); while (pq.length){ const [d, k] = pop(); if (d > distTo.get(k)) continue; for (const e of adj.get(k) || []){ const c = d + e.w * (onPlan(e.mid) ? 1 : 3) * (campOf(e.mid) ? 10 : 1); if (c < (distTo.has(e.to) ? distTo.get(e.to) : Infinity)){ distTo.set(e.to, c); prev.set(e.to, k); push(c, e.to); } } } return { distTo, prev }; };

/* ── الدمج: حوافُّ الطرق كلِّها في شبكةٍ واحدة، ثم سلاسلُ بلا تكرار ── */
const chains = (edgeSet, orientFrom, cuts) => { const deg = new Map(), nb = new Map(); edgeSet.forEach(e => { const [a, b] = e.split('|'); deg.set(a, (deg.get(a) || 0) + 1); deg.set(b, (deg.get(b) || 0) + 1); (nb.get(a) || nb.set(a, []).get(a)).push(b); (nb.get(b) || nb.set(b, []).get(b)).push(a); }); const used = new Set(), out = []; const walk = (start, next) => { const pl = [start]; let prev = start, cur = next; used.add([prev, cur].sort().join('|')); pl.push(cur); while ((deg.get(cur) || 0) === 2 && !(cuts && cuts.has(cur))){ const nxt = nb.get(cur).find(n => n !== prev); if (!nxt) break; const ek = [cur, nxt].sort().join('|'); if (used.has(ek)) break; used.add(ek); pl.push(nxt); prev = cur; cur = nxt; } return pl; }; const starts = [...deg.keys()].filter(k => deg.get(k) !== 2 || (cuts && cuts.has(k))).sort((a, b) => orientFrom(a) - orientFrom(b));   /* المنابعُ (مداخلُ ومخارجُ الدور) حدودُ سلاسل ولو مرّ بها الطريق */ starts.forEach(s => nb.get(s).forEach(n => { const ek = [s, n].sort().join('|'); if (!used.has(ek)) out.push(walk(s, n)); })); [...deg.keys()].forEach(s => nb.get(s).forEach(n => { const ek = [s, n].sort().join('|'); if (!used.has(ek)) out.push(walk(s, n)); }));   /* دوائرُ بلا بداية */
  return out.map(pl => { const a = orientFrom(pl[0]), b = orientFrom(pl[pl.length - 1]); return (a <= b ? pl : pl.slice().reverse()).map(k => nodes.get(k).map(v => +v.toFixed(6))); }); };

const NEW = { v: 3, src: 'streets', note: '', floors: {}, ends: OLD.ends, maybe: [] };
const stats = [];
for (const fk of ['0', '1', '2', '3', '4']){
  const onPlan = (g => p => g(p) <= 25)(guideIndex(fk));
  const enIds = (OLD.ends.en[fk] || []).map(n => 'NSK-JMR-PNT-' + n), exIds = (OLD.ends.ex[fk] || []).map(n => 'NSK-JMR-PNT-' + n);
  /* المدخلُ والمخرجُ نقطتان في السجل لا عقدتان في الشبكة: تُوصَل كلٌّ منهما بأقرب عقدةٍ بوصلةٍ قصيرة فينتهي الذهابُ عند المدخل نفسِه وتبدأ العودةُ من المخرج نفسِه */
  const stub = id => { const q = pts[id]; if (!q) return null; const e = [q.lat, q.lng], n = nearestNode(e, 80); if (!n) return null; addEdge(nodes.get(n), e, { stub: true }); return key(e); };
  const enN = enIds.map(stub).filter(Boolean), exN = exIds.map(stub).filter(Boolean); refreshNodes();
  const campIds = Object.keys(TF.assign).filter(id => String(TF.assign[id]) === fk);
  const G = dijkstra(enN, onPlan), B = dijkstra(exN, onPlan);
  const goE = new Set(), backE = new Set(); let routed = 0, skipped = [];
  campIds.forEach(id => { const c = campCenter(id); const n = c && nearestNode(c, 220, true);   /* أقربُ عقدةٍ خارج المخيمات: الطريقُ يبدأ من بابه لا من داخله */ if (!n || !G.distTo.has(n) || !B.distTo.has(n)){ skipped.push(id); return; } routed++;
    for (let k = n; G.prev.has(k); k = G.prev.get(k)) goE.add([k, G.prev.get(k)].sort().join('|'));
    for (let k = n; B.prev.has(k); k = B.prev.get(k)) backE.add([k, B.prev.get(k)].sort().join('|')); });
  /* كلُّ مدخلٍ يصله ذهابٌ وكلُّ مخرجٍ تبدأ منه عودة (V24.8 — مخطّطُ الوزارة يستعملها كلَّها): المدخلُ الذي لم يكن أقربَ
     لأيِّ مخيمٍ يُوصَل بأقصر وصلةٍ إلى شبكة دوره */
  const nodesOf = E => { const S = new Set(); E.forEach(e => e.split('|').forEach(k => S.add(k))); return S; };
  const link = (E, from, onPlanFn) => { const S = nodesOf(E); if (S.has(from)) return; const D = dijkstra([from], onPlanFn); let best = null, bd = Infinity; S.forEach(k => { const d = D.distTo.get(k); if (d != null && d < bd){ bd = d; best = k; } }); if (best == null) return; for (let k = best; D.prev.has(k); k = D.prev.get(k)) E.add([k, D.prev.get(k)].sort().join('|')); };
  enN.forEach(k => link(goE, k, onPlan)); exN.forEach(k => link(backE, k, onPlan));
  const go = chains(goE, k => -(G.distTo.get(k) || 0), new Set(enN)), back = chains(backE, k => (B.distTo.get(k) || 0), new Set(exN));   /* الذهابُ يُوجَّه نحو المدخل، والعودةُ من المخرج إلى الخارج */
  NEW.floors[fk] = { go, back };
  const lenOf = ls => Math.round(ls.reduce((s, pl) => { for (let i = 1; i < pl.length; i++) s += dist(pl[i - 1], pl[i]); return s; }, 0));
  stats.push({ floor: fk, camps: campIds.length, routed, skipped: skipped.length, entrances: enN.length, exits: exN.length, goLines: go.length, goM: lenOf(go), backLines: back.length, backM: lenOf(back) });
  if (skipped.length) console.log('  الدور ' + fk + ' — بلا طريق (لا شارعَ قريبًا أو غيرُ موصول): ' + skipped.join(' '));
}

/* ── «احتمال مخيم»: أطرافُ الخطوط القديمة التي لا مخيمَ ولا جمراتِ عندها وليست على جسرٍ أو نفق ── */
const inRing = (p, ring) => { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){ const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]; if (((yi > p[0]) !== (yj > p[0])) && (p[1] < (xj - xi) * (p[0] - yi) / ((yj - yi) || 1e-12) + xi)) inside = !inside; } return inside; };
const campList = Object.keys(camps).map(id => ({ id, c: campCenter(id) })).filter(x => x.c);
const nearCamp = p => { for (const x of campList){ if (dist(p, x.c) > 120) continue; if (dist(p, x.c) <= 60) return true; const ring = POLY[x.id]; if (ring && inRing(p, ring)) return true; } return false; };
const nearJmr = p => Object.values(pts).some(q => q.id.indexOf('NSK-JMR-') === 0 && dist(p, [q.lat, q.lng]) <= 120);
const onBridgeOrTunnel = p => { for (const wy of ways){ if (!wy.tags.bridge && !wy.tags.tunnel) continue; const g = wy.geometry; for (let i = 1; i < g.length; i++) if (segDist(p, [g[i - 1].lat, g[i - 1].lon], [g[i].lat, g[i].lon]) <= 15) return true; } return false; };
const maybe = [];
for (const fk of ['0', '1', '2', '3', '4']){ const fl = OLD.floors[fk] || {}; const pls = []; ['go', 'back'].forEach(k => (fl[k] || []).forEach(pl => pls.push(pl)));
  /* الطرفُ الحقيقيُّ وحدَه: القطعُ القديمةُ مجزَّأة، فطرفُ قطعةٍ يلامس قطعةً أخرى ليس نهايةَ خط */
  const allPts = []; pls.forEach((pl, i) => pl.forEach(q => allPts.push([q, i])));
  const TERM = +(process.env.TFW_TERM || 25);   /* طرفٌ حقيقيٌّ: لا قطعةَ أخرى في ٢٥ م */
  const terminal = (p, i) => !allPts.some(([q, j]) => j !== i && dist(p, q) <= TERM);
  pls.forEach((pl, i) => { [pl[0], pl[pl.length - 1]].forEach(p => { if (!terminal(p, i)) return; if (nearCamp(p) || nearJmr(p) || onBridgeOrTunnel(p)) return; if (maybe.some(m => dist([m.lat, m.lng], p) <= 40)) return; maybe.push({ lat: +p[0].toFixed(6), lng: +p[1].toFixed(6), floor: +fk }); }); }); }
NEW.maybe = maybe;
NEW.note = 'V25.6 — لكلِّ مخيمٍ في ملف الوزارة أقصرُ طريقٍ على شوارع منى الفعلية (OpenStreetMap، ODbL) من المخيم إلى مداخل دوره وعودةً من مخارجه، مفضِّلًا شوارعَ المخطّط (ما قرب منه ≤ ٢٥ م أرخصُ ثلاثَ مرات) — فلا لفة؛ وطرقُ مخيمات الدور مدمجةٌ شبكةً بلا تكرار. maybe: أطرافُ خطوط المخطّط القديمة التي لا مخيمَ عندها (وليست على جسرٍ أو نفق) — احتمالُ مخيمٍ يُتحقَّق ميدانيًّا. go: الذهاب · back: العودة.';
writeFileSync('layers/tafweej-routes.json', JSON.stringify(NEW));
console.table(stats);
console.log('احتمال مخيم:', maybe.length, '| حجم الملف:', Math.round(JSON.stringify(NEW).length / 1024) + ' ك.ب', '| عقد الشبكة:', nodes.size, '| شوارع:', ways.length);
