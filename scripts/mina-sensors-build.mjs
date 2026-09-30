/* ═══════════════════════════════════════════════════════════════════════════
   مولّدُ طبقة تخطيط حساسات منى (V25.7) — node scripts/mina-sensors-build.mjs
   ───────────────────────────────────────────────────────────────────────────
   قرارُ المالك: لكلِّ مخيمٍ في منى اثنتا عشرةَ غرفةً، لكلِّ غرفةٍ حساسُ حرارةٍ ورطوبة، وجيت واي واحدٌ
   يغطّيها كلَّها بحسب رسمة المخيم — طبقةٌ مبدئيةٌ يعدّلها هو من الميدان (نقلٌ وزيادةٌ ونقص).
   الحساسات: شبكةٌ ٣×٤ على محور المخيم الرئيس (المحاور الأساسية لرؤوس مضلّعه) مقصوصةٌ داخله؛ فإن
   نقصت عن اثنتي عشرةَ أُكملت من شبكةٍ أدقَّ بالأقرب إلى مركزه. الجيت واي: عند نقطة المخيم المسجَّلة
   (بابُه) إن كانت داخله وغطّت الحساساتِ كلَّها في ١٥٠ م، وإلا مركزُ أصغر دائرةٍ تحيط بالحساسات —
   ولا جيت واي ثانٍ: ما تجاوز ١٥٠ م يُدرَج في قائمة القرار بأحسن موضع.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync('index.html', 'utf8');
const RAW = JSON.parse(/var SITES_RAW = (\{.*?\});\n/.exec(html)[1]);
const POLY = JSON.parse(readFileSync('poly.json', 'utf8'));
const N = 12, COVER = 150;
const rad = Math.PI / 180, KX = 111320 * Math.cos(21.41 * rad), KY = 111320, LAT0 = 21.41, LNG0 = 39.88;
const xy = p => [(p[1] - LNG0) * KX, (p[0] - LAT0) * KY];            /* [lat,lng] → متر */
const ll = q => [+(LAT0 + q[1] / KY).toFixed(6), +(LNG0 + q[0] / KX).toFixed(6)];
const inRing = (q, ring) => { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){ const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]; if (((yi > q[1]) !== (yj > q[1])) && (q[0] < (xj - xi) * (q[1] - yi) / ((yj - yi) || 1e-12) + xi)) inside = !inside; } return inside; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* أصغرُ دائرةٍ تحيط بنقاط (ويلزل) */
const circle2 = (a, b) => ({ c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], r: dist(a, b) / 2 });
const circle3 = (a, b, c) => { const ax = a[0], ay = a[1], bx = b[0], by = b[1], cx = c[0], cy = c[1]; const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)); if (Math.abs(d) < 1e-9) return null; const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d, uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d; return { c: [ux, uy], r: dist([ux, uy], a) }; };
const inC = (p, C) => C && dist(p, C.c) <= C.r + 1e-6;
const mec = pts => { let C = null; const P = pts.slice(); for (let i = 0; i < P.length; i++){ if (inC(P[i], C)) continue; C = { c: P[i], r: 0 }; for (let j = 0; j < i; j++){ if (inC(P[j], C)) continue; C = circle2(P[i], P[j]); for (let k = 0; k < j; k++){ if (inC(P[k], C)) continue; C = circle3(P[i], P[j], P[k]) || C; } } } return C; };

const OUT = { v: 1, note: 'V25.7 — طبقةُ تخطيطٍ مبدئية بقرار المالك: ١٢ حساسَ حرارةٍ ورطوبةٍ لكلِّ مخيمٍ في منى (غرفةٌ لكلِّ حساس) موزَّعةً داخل مضلّعه، وجيت واي واحدٌ يغطّيها في ١٥٠ م — عند نقطة المخيم إن كفت وإلا مركزُ أصغر دائرةٍ تحيط بها. تُعدَّل من الميدان: نقلٌ وزيادةٌ ونقص. ليست نقاطًا ولا تدخل في العدّادات ولا أرقام الوزارة. decide: مخيماتٌ لا يغطّيها جيت واي واحدٌ في ١٥٠ م — أحسنُ موضعٍ ومسافةُ أبعد حساس، للقرار.', camps: {}, decide: [] };
const camps = RAW.g.filter(r => String(r[0]).indexOf('NSK-MIN-CMP') === 0);
let made = 0, tiny = 0;
camps.forEach(r => {
  const id = r[0], ring = POLY[id]; if (!ring || ring.length < 3) return;
  const R = ring.map(p => xy([p[1], p[0]]));   /* poly.json: [lng,lat] */
  const cx = R.reduce((s, q) => s + q[0], 0) / R.length, cy = R.reduce((s, q) => s + q[1], 0) / R.length;
  /* المحورُ الرئيس بالمحاور الأساسية */
  let sxx = 0, syy = 0, sxy = 0; R.forEach(q => { sxx += (q[0] - cx) ** 2; syy += (q[1] - cy) ** 2; sxy += (q[0] - cx) * (q[1] - cy); });
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), ct = Math.cos(th), st = Math.sin(th);
  const rot = q => [(q[0] - cx) * ct + (q[1] - cy) * st, -(q[0] - cx) * st + (q[1] - cy) * ct], unrot = u => [cx + u[0] * ct - u[1] * st, cy + u[0] * st + u[1] * ct];
  const U = R.map(rot); const u0 = Math.min(...U.map(u => u[0])), u1 = Math.max(...U.map(u => u[0])), v0 = Math.min(...U.map(u => u[1])), v1 = Math.max(...U.map(u => u[1]));
  const grid = (nx, ny) => { const out = []; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++){ const u = u0 + (u1 - u0) * (i + 0.5) / nx, v = v0 + (v1 - v0) * (j + 0.5) / ny; const q = unrot([u, v]); if (inRing(q, R)) out.push(q); } return out; };
  let S = grid(4, 3); if (S.length > N) S = S.slice(0, N);
  if (S.length < N){ const fine = grid(9, 7).filter(q => !S.some(s => dist(s, q) < 1)).sort((a, b) => dist(a, [cx, cy]) - dist(b, [cx, cy])); while (S.length < N && fine.length) S.push(fine.shift()); }
  if (S.length < N){ tiny++; while (S.length < N) S.push([cx + (Math.random() - 0.5) * 4, cy + (Math.random() - 0.5) * 4]); }   /* مخيمٌ صغيرٌ جدًّا: تُكدَّس قرب مركزه ويُنقَل ميدانيًّا */
  /* الجيت واي: نقطةُ المخيم (بابُه) إن كانت داخله وكفت، وإلا مركزُ أصغر دائرة */
  const pin = xy([+r[5], +r[6]]); const C = mec(S);
  let gw = pin, at = 'pin', maxM = Math.max(...S.map(s => dist(s, pin)));
  if (!inRing(pin, R) || maxM > COVER){ gw = C.c; at = 'center'; maxM = C.r; if (!inRing(gw, R)){ /* المركزُ خارج المضلّع (مخيمٌ مقعّر): أقربُ حساسٍ إلى المركز */ let best = S[0], bd = Infinity; S.forEach(s => { const d = Math.max(...S.map(t => dist(s, t))); if (d < bd){ bd = d; best = s; } }); gw = best; maxM = bd; at = 'sensor'; } }
  OUT.camps[id] = { gw: ll(gw), at, maxM: Math.round(maxM), sensors: S.map(ll) };
  if (maxM > COVER) OUT.decide.push({ id, maxM: Math.round(maxM), gw: ll(gw) });
  made++;
});
writeFileSync('layers/mina-sensors.json', JSON.stringify(OUT));
const ats = Object.values(OUT.camps).reduce((a, c) => { a[c.at] = (a[c.at] || 0) + 1; return a; }, {});
console.log('مخيمات منى المولَّدة:', made, '| الجيت واي عند الباب:', ats.pin || 0, '· مركز:', ats.center || 0, '· عند حساس:', ats.sensor || 0, '| صغيرةٌ جدًّا:', tiny, '| للقرار (> ' + COVER + ' م):', OUT.decide.length, '| حجم:', Math.round(JSON.stringify(OUT).length / 1024) + ' ك.ب');
