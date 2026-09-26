/* ═══════════════════════════════════════════════════════════════════════════
   تغذيةُ الموسم — node scripts/season-seed.mjs
   ───────────────────────────────────────────────────────────────────────────
   بياناتُ المشروع المؤكَّدةُ تُكتَب مرةً في docs/season.json بمصدرها، ويُغذّى
   بها settings/points من السير — فلا يبقى النظامُ يعرض أصفارًا لأن أحدًا لم
   يفتح شاشةَ الإعدادات. والقاعدةُ الحاكمة: **لا يُكتَب إلا الحقلُ الفارغ** —
   ما ضبطه أحدٌ بيده في التطبيق لا يُمَسّ، فالسيرُ يملأ ولا يُصحِّح.
   التواريخُ تُخزَّن أرقامًا (مللي ثانية) كما تقرؤها CFG، والخرائطُ (avgRooms)
   تُدمَج مفتاحًا مفتاحًا.
     FIREBASE_SERVICE_ACCOUNT — حسابُ الخدمة؛ بلا حسابٍ يُطبَع ما كان سيُكتَب
     SEED_DRY=1               — تجربةٌ جافة: يُطبَع ولا يُكتَب
     SEED_SRC                 — بديلُ الملف (للجرد)
     SEED_DB                  — بديلُ القاعدة: ملفُ JSON بوثيقة points (للجرد)
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'fs';

const src = process.env.SEED_SRC || 'docs/season.json';
const season = JSON.parse(readFileSync(src, 'utf8'));
const S = season.settings || {};

const empty = v => v === undefined || v === null || v === '' || v === 0
  || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
const toStore = (k, v) => {
  if (k === 'dueSurvey' || k === 'dueInstall'){ const ms = Date.parse(String(v) + 'T00:00:00+03:00'); return Number.isFinite(ms) ? ms : null; }
  return v;
};

/* ── القاعدة أو بديلُها ────────────────────────────────────────────────── */
let cur = {}, write = null;
if (process.env.SEED_DB){
  cur = JSON.parse(readFileSync(process.env.SEED_DB, 'utf8'));
  write = (patch) => { Object.assign(cur, patch); writeFileSync(process.env.SEED_DB, JSON.stringify(cur, null, 1)); };
} else if (process.env.FIREBASE_SERVICE_ACCOUNT){
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const admin = require('firebase-admin');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  const ref = admin.firestore().collection('settings').doc('points');
  const doc = await ref.get();
  cur = doc.exists ? (doc.data() || {}) : {};
  write = (patch) => ref.set(patch, { merge:true });
} else {
  console.log('::notice title=تجربةٌ جافة::لا حسابَ خدمة — يُطبَع ما كان سيُكتَب ولا يُكتَب شيء');
}

/* ── القراراتُ الصريحة (V18.9): تُكتَب ولو كان الحقلُ مضبوطًا ──────────
   القاعدةُ العامةُ «لا يُكتَب إلا الفارغ» تحمي ما ضبطه أحدٌ بيده. لكنَّ صاحبَ
   المشروع يقرّر أحيانًا تغييرَ ما ضُبط (أوزانُ التحديات، تارجتُ الشهر، معاملُ
   الإضافي) ويريده مسجَّلًا بتاريخه وسببه في المستودع لا ضغطةً في شاشة. فالقرارُ
   يُكتَب في season.decisions بمعرِّفٍ فريد، ويُطبَّق مرةً واحدةً (يُختَم في
   settings/points.decisions) ثم لا يُعاد ولو بقي في الملف — وما يضبطه بعدها
   بيده يبقى له. الخرائطُ تُدمَج مفتاحًا مفتاحًا فلا يُمحى وزنٌ لم يُذكَر. */
const decisions = Array.isArray(season.decisions) ? season.decisions : [];
const done = (cur.decisions && typeof cur.decisions === 'object') ? cur.decisions : {};
const decPatch = {}, decApplied = [], decSkipped = [];
/* (V19.1) والقرارُ قد يمسُّ سجلَّ الأنواع (types: تسمياتٌ) ويدمج نوعًا في نوع (merge):
   تُعاد نقاطُ النوع المدموج إلى الباقي في sites وnewsites، وتُعاد مفاتيحُ التركيبات
   المعلَنة، ويُكتَب للمدموج شاهدُ حذف — مرةً واحدةً كسائر القرار. */
const decTypes = {}, decMerges = [], decDeclare = [], decRezone = [];
for (const dcn of decisions){
  if (!dcn || !dcn.id || (!dcn.set && !dcn.types && !dcn.merge)){ continue; }
  dcn.set = dcn.set || {};
  if (!done[dcn.id]){
    if (dcn.types && typeof dcn.types === 'object') for (const k of Object.keys(dcn.types)){ decTypes[k] = { ...(decTypes[k] || {}), ...dcn.types[k] }; decApplied.push(dcn.id + ': types.' + k + ' ← ' + JSON.stringify(dcn.types[k])); }
    if (Array.isArray(dcn.merge)) for (const m of dcn.merge){ if (m && m.from && m.to && m.from !== m.to){ decMerges.push(m); decApplied.push(dcn.id + ': دمجُ النوع «' + m.from + '» في «' + m.to + '»'); } }
    /* (V20.1) إعلانُ تركيباتٍ (مشعر|تسمية) ونقلُ نقاطٍ إلى مشعرٍ بمستطيلٍ جغرافيّ */
    if (Array.isArray(dcn.declare)) dcn.declare.forEach(k => { if (typeof k === 'string' && k.indexOf('|') > 0){ decDeclare.push(k); decApplied.push(dcn.id + ': إعلانُ «' + k + '»'); } });
    if (Array.isArray(dcn.rezone)) dcn.rezone.forEach(z => { if (z && z.to && Array.isArray(z.bbox) && z.bbox.length === 4){ decRezone.push(z); decApplied.push(dcn.id + ': نقاطُ المستطيل ' + z.bbox.join(',') + ' ← «' + z.to + '»'); } });
  }
  if (done[dcn.id]){ decSkipped.push(dcn.id + ' (طُبِّق ' + new Date(done[dcn.id]).toISOString().slice(0, 10) + ')'); continue; }
  for (const k of Object.keys(dcn.set)){
    const want = dcn.set[k];
    if (want && typeof want === 'object' && !Array.isArray(want)){
      const have = (decPatch[k] && typeof decPatch[k] === 'object') ? decPatch[k] : ((cur[k] && typeof cur[k] === 'object') ? cur[k] : {});
      decPatch[k] = { ...have, ...want };
      Object.keys(want).forEach(kk => decApplied.push(dcn.id + ': ' + k + '.' + kk + ' = ' + want[kk] + (have[kk] !== undefined && have[kk] !== want[kk] ? ' (كان ' + have[kk] + ')' : '')));
    } else {
      const v = toStore(k, want); if (v === null){ console.log('::warning::قرارٌ بقيمةٍ لا تُقرأ: ' + k); continue; }
      decPatch[k] = v; decApplied.push(dcn.id + ': ' + k + ' = ' + want + (cur[k] !== undefined && cur[k] !== v ? ' (كان ' + cur[k] + ')' : ''));
    }
  }
  decPatch.decisions = { ...(decPatch.decisions || done), [dcn.id]: Date.now() };
}

/* ── ما يُكتَب: الفارغُ وحدَه ─────────────────────────────────────────── */
const patch = {}, kept = [], filled = [];
for (const k of Object.keys(S)){
  const want = S[k] && S[k].value !== undefined ? S[k].value : S[k];
  if (want && typeof want === 'object' && !Array.isArray(want)){
    /* خريطةٌ: يُملأ المفتاحُ الفارغُ وحدَه */
    const have = (cur[k] && typeof cur[k] === 'object') ? cur[k] : {};
    const merged = { ...have }; let changed = false;
    for (const kk of Object.keys(want)){
      if (empty(have[kk])){ merged[kk] = want[kk]; changed = true; filled.push(k + '.' + kk + ' = ' + want[kk]); }
      else kept.push(k + '.' + kk + ' = ' + have[kk] + ' (مضبوطٌ بيد)');
    }
    if (changed) patch[k] = merged;
    continue;
  }
  const v = toStore(k, want);
  if (v === null){ console.log('::warning::قيمةٌ لا تُقرأ: ' + k + ' = ' + want); continue; }
  if (empty(cur[k])){ patch[k] = v; filled.push(k + ' = ' + want); }
  else kept.push(k + ' = ' + cur[k] + ' (مضبوطٌ بيد)');
}

/* ── التجاربُ: settings/trials — يُضاف ما ليس في السجل بمعرّفه (V17.73) ── */
let trialsPatch = null, trialsAdded = [];
try {
  const TR = JSON.parse(readFileSync(process.env.SEED_TRIALS || 'docs/trials.json', 'utf8'));
  const rows = Array.isArray(TR.rows) ? TR.rows : [];
  let curT = {};
  if (process.env.SEED_DB){ curT = cur.__trials || {}; }
  else if (process.env.FIREBASE_SERVICE_ACCOUNT){
    const { createRequire } = await import('module');
    const admin = createRequire(import.meta.url)('firebase-admin');
    const d = await admin.firestore().collection('settings').doc('trials').get();
    curT = d.exists ? (d.data() || {}) : {};
  }
  const have = Array.isArray(curT.rows) ? curT.rows : [];
  const ids = new Set(have.map(r => String(r.id)));
  const fresh = rows.filter(r => r && r.id && !ids.has(String(r.id))).map(r => ({ ...r, at: r.at || Date.now(), date: r.date || new Date().toISOString().slice(0, 10) }));
  if (fresh.length){
    trialsAdded = fresh.map(r => r.id + ' · ' + r.n);
    trialsPatch = { rows: have.concat(fresh), inCost: !!curT.inCost, at: Date.now(), by: 'season-seed' };
  }
} catch (e){ console.log('::warning::ملفُّ التجارب لا يُقرأ: ' + String(e.message).slice(0, 120)); }

/* ── التوأم: يُدمَج الواضحُ وحدَه — الأصلُ ما مُسح (V17.88) ─────────────────
   القاعدةُ نفسُها التي يفرضها التطبيقُ على المهندس: لا يُدمَج مُسِحٌ في غير
   مُسِح. وإن لم يُمسَح أحدُهما أو مُسح كلاهما فالقرارُ بشري. */
let twinsMerged = [], twinsLeft = [], twinsWrites = [];
try {
  const TW = JSON.parse(readFileSync(process.env.SEED_TWINS || 'docs/twins.json', 'utf8'));
  const done = r => !!r && (!r.access || r.access === 'تم الوصول') && r.review !== 'revisit';
  let recs = {}, ov = {};
  if (process.env.SEED_DB){ recs = cur.__recs || {}; ov = cur.__sites || {}; }
  else if (process.env.FIREBASE_SERVICE_ACCOUNT){
    const { createRequire } = await import('module');
    const admin = createRequire(import.meta.url)('firebase-admin'); const fs = admin.firestore();
    const ids = [].concat(...(TW.pairs || []));
    for (const id of ids){
      const r = await fs.collection('recs').doc(id).get(); if (r.exists) recs[id] = r.data();
      const o = await fs.collection('sites').doc(id).get(); if (o.exists) ov[id] = o.data();
    }
  }
  for (const [a, b] of (TW.pairs || [])){
    if ((ov[a] && (ov[a].hidden || ov[a].dupOf)) || (ov[b] && (ov[b].hidden || ov[b].dupOf))){ twinsLeft.push(a + ' ↔ ' + b + ' — دُمج من قبل'); continue; }
    const da = done(recs[a]), db_ = done(recs[b]);
    if (da === db_){ twinsLeft.push(a + ' ↔ ' + b + (da ? ' — كلاهما مُسح: قرارٌ بشري' : ' — لم يُمسَح أحدُهما بعد')); continue; }
    const keep = da ? a : b, dup = da ? b : a;
    twinsWrites.push({ id: dup, patch: { hidden:true, dupOf:keep, dupBy:'season-seed', dupAt: Date.now(), _by:'season-seed', _at: Date.now() } });
    twinsMerged.push(dup + ' → ' + keep);
  }
} catch (e){ console.log('::warning::ملفُّ التوأم لا يُقرأ: ' + String(e.message).slice(0, 120)); }

console.log('يُملأ (' + filled.length + '):' + (filled.length ? '\n  ' + filled.join('\n  ') : ' لا شيء'));
console.log('يُترَك كما ضُبط (' + kept.length + '):' + (kept.length ? '\n  ' + kept.join('\n  ') : ' لا شيء'));
console.log('تجاربُ تُضاف (' + trialsAdded.length + '):' + (trialsAdded.length ? '\n  ' + trialsAdded.join('\n  ') : ' لا شيء'));
console.log('توائمُ تُدمَج (' + twinsMerged.length + '):' + (twinsMerged.length ? '\n  ' + twinsMerged.join('\n  ') : ' لا شيء'));
if (twinsLeft.length) console.log('توائمُ تُترَك للمهندس (' + twinsLeft.length + '):\n  ' + twinsLeft.join('\n  '));
console.log('قراراتٌ تُطبَّق (' + decApplied.length + '):' + (decApplied.length ? '\n  ' + decApplied.join('\n  ') : ' لا شيء'));
if (decSkipped.length) console.log('قراراتٌ طُبِّقت من قبل (' + decSkipped.length + '):\n  ' + decSkipped.join('\n  '));
/* القرارُ يغلب الملءَ: ما قرّره صاحبُ المشروع لا يُعيد الملءُ كتابتَه */
for (const k of Object.keys(decPatch)) patch[k] = decPatch[k];
if (!Object.keys(patch).length && !trialsPatch && !twinsWrites.length && !Object.keys(decTypes).length && !decMerges.length && !decDeclare.length && !decRezone.length){ console.log('لا شيءَ يُكتَب — كلُّ ما في الملف مضبوطٌ من قبل'); process.exit(0); }
if (process.env.SEED_DRY === '1' || !write){ console.log('(تجربةٌ جافة — لم يُكتَب)'); process.exit(0); }
if (Object.keys(patch).length){
  patch._by = 'season-seed'; patch._at = Date.now();
  await write(patch);
  console.log('✓ كُتب في settings/points: ' + Object.keys(patch).filter(k => k.charAt(0) !== '_').join(' · '));
}
if (twinsWrites.length){
  if (process.env.SEED_DB){ cur.__sites = cur.__sites || {}; twinsWrites.forEach(x => { cur.__sites[x.id] = Object.assign(cur.__sites[x.id] || {}, x.patch); }); writeFileSync(process.env.SEED_DB, JSON.stringify(cur, null, 1)); }
  else {
    const { createRequire } = await import('module');
    const admin = createRequire(import.meta.url)('firebase-admin'); const fs = admin.firestore(); const bt = fs.batch();
    twinsWrites.forEach(x => bt.set(fs.collection('sites').doc(x.id), x.patch, { merge:true }));
    await bt.commit();
  }
  console.log('✓ دُمج التوأم في sites: ' + twinsWrites.length);
}
/* ── إحصاءُ الأنواع (V19.2): كلُّ مفتاحٍ بتسميته وعددِ نقاطه — المفتاحُ الداخليُّ قد
   يختلف عن الاسم الظاهر، فيُقرأ هنا قبل أيِّ دمج ويُكتَب في تعليق السير ── */
const norm = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
let typesNow = {}, census = {};
if (process.env.SEED_DB){
  typesNow = cur.__types || {};
  for (const col of ['__sitesCol', '__newsites']) for (const id of Object.keys(cur[col] || {})){ const ty = (cur[col][id] || {}).type; if (ty) census[ty] = (census[ty] || 0) + 1; }
} else if (write){
  const { createRequire } = await import('module');
  const admin = createRequire(import.meta.url)('firebase-admin'); const fs0 = admin.firestore();
  const td = await fs0.collection('settings').doc('types').get(); typesNow = td.exists ? (td.data() || {}) : {};
  for (const col of ['sites', 'newsites']){ const q = await fs0.collection(col).select('type').get(); q.docs.forEach(d => { const ty = (d.data() || {}).type; if (ty) census[ty] = (census[ty] || 0) + 1; }); }
}
{
  const rows = Object.keys(typesNow).filter(k => k.charAt(0) !== '_').map(k => { const v = typesNow[k] || {}; return '  «' + k + '» ← «' + (v.l || '') + '»' + (v.gone ? ' (محذوف)' : '') + ' — نقاطٌ في sites/newsites: ' + (census[k] || 0); });
  const orphan = Object.keys(census).filter(k => !typesNow[k]).map(k => '  «' + k + '» (بلا سجلّ) — ' + census[k]);
  console.log('إحصاءُ الأنواع (' + rows.length + '):' + (rows.length ? '\n' + rows.join('\n') : ' لا سجلّ') + (orphan.length ? '\nأنواعٌ في النقاط بلا سجلّ:\n' + orphan.join('\n') : ''));
}
/* الدمجُ بالتسمية (byLabel): كلُّ مفتاحٍ تسميتُه أو اسمُه «from» — غيرُ «to» — يُدمَج */
for (let i = decMerges.length - 1; i >= 0; i--){
  const m = decMerges[i]; if (!m.byLabel) continue;
  const keys = Object.keys(typesNow).filter(k => k.charAt(0) !== '_' && k !== m.to && !(typesNow[k] || {}).gone && (norm((typesNow[k] || {}).l) === norm(m.from) || norm(k) === norm(m.from)));
  Object.keys(census).forEach(k => { if (k !== m.to && norm(k) === norm(m.from) && keys.indexOf(k) < 0) keys.push(k); });
  decMerges.splice(i, 1, ...keys.map(k => ({ from:k, to:m.to })));
  console.log('دمجٌ بالتسمية «' + m.from + '» ← مفاتيحُ: ' + (keys.length ? keys.map(k => '«' + k + '» (' + (census[k] || 0) + ')').join(' · ') : 'لا شيء'));
}
/* ── الإعلانُ والنقلُ بين المشاعر (V20.1) ── */
if ((decDeclare.length || decRezone.length) && write){
  const inBox = (d, b) => d && +d.lat >= b[0] && +d.lng >= b[1] && +d.lat <= b[2] && +d.lng <= b[3];
  const renamed = (d, to) => { const nm0 = String(d.name || ''); const z0 = String(d.zone || ''); return z0 && nm0.indexOf(z0) === 0 ? to + nm0.slice(z0.length) : nm0; };
  if (process.env.SEED_DB){
    const arr = Object.keys(cur.__mxExtra || {}).filter(k => /^\d+$/.test(k)).sort((a, b) => a - b).map(k => cur.__mxExtra[k]);
    const next = [...new Set(arr.concat(decDeclare))]; const keep = {}; Object.keys(cur.__mxExtra || {}).filter(k => !/^\d+$/.test(k)).forEach(k => { keep[k] = cur.__mxExtra[k]; }); next.forEach((v, i) => { keep[i] = v; }); cur.__mxExtra = keep;
    const moved = [];
    for (const col of ['__sitesCol', '__newsites']) for (const id of Object.keys(cur[col] || {})){ const d = cur[col][id]; for (const z of decRezone){ if (d.zone !== z.to && inBox(d, z.bbox)){ d.name = renamed(d, z.to); d.zone = z.to; moved.push(id); } } }
    writeFileSync(process.env.SEED_DB, JSON.stringify(cur, null, 1));
    console.log('✓ إعلان: ' + decDeclare.length + ' — ونقاطٌ نُقلت: ' + (moved.length ? moved.join(' · ') : 'لا شيء'));
  } else {
    const { createRequire } = await import('module');
    const admin = createRequire(import.meta.url)('firebase-admin'); const fs = admin.firestore();
    if (decDeclare.length){
      const mx = await fs.collection('settings').doc('mxExtra').get(); const data = mx.exists ? (mx.data() || {}) : {};
      const arr = Object.keys(data).filter(k => /^\d+$/.test(k)).sort((a, b) => a - b).map(k => data[k]);
      const next = [...new Set(arr.concat(decDeclare))]; const out = {}; Object.keys(data).filter(k => !/^\d+$/.test(k)).forEach(k => { out[k] = data[k]; }); next.forEach((v, i) => { out[i] = v; });
      await fs.collection('settings').doc('mxExtra').set(out);
    }
    const moved = [];
    for (const z of decRezone) for (const col of ['newsites', 'sites']){
      const q = await fs.collection(col).get();
      let bt = fs.batch(), c = 0;
      for (const doc of q.docs){ const d = doc.data() || {}; if (d.zone === z.to || !inBox(d, z.bbox)) continue;
        bt.set(doc.ref, { zone:z.to, name:renamed(d, z.to), _by:'season-seed', _at:Date.now() }, { merge:true }); moved.push(doc.id + ' (' + (d.zone || '') + ')'); c++; if (c === 400){ await bt.commit(); bt = fs.batch(); c = 0; } }
      if (c) await bt.commit();
    }
    console.log('✓ إعلان: ' + decDeclare.length + ' — ونقاطٌ نُقلت إلى مشعرها: ' + (moved.length ? moved.join(' · ') : 'لا شيء'));
  }
}
/* ── سجلُّ الأنواع والدمج (V19.1) ── */
if ((Object.keys(decTypes).length || decMerges.length) && write){
  const mergedTypes = {}; decMerges.forEach(m => { mergedTypes[m.from] = { gone:true }; });
  const typesPatch = { ...decTypes, ...mergedTypes };
  const reKey = s0 => { let v = String(s0); decMerges.forEach(m => { const i = v.indexOf('|'); if (i > -1 && v.slice(i + 1) === m.from) v = v.slice(0, i + 1) + m.to; }); return v; };
  if (process.env.SEED_DB){
    cur.__types = { ...(cur.__types || {}) }; Object.keys(typesPatch).forEach(k => { cur.__types[k] = { ...(cur.__types[k] || {}), ...typesPatch[k] }; });
    let n = 0;
    for (const col of ['__sitesCol', '__newsites']) for (const id of Object.keys(cur[col] || {})){ const d = cur[col][id]; const m = decMerges.find(x => x.from === d.type); if (m){ d.type = m.to; n++; } }
    if (cur.__mxExtra){ const arr = Object.keys(cur.__mxExtra).filter(k => /^\d+$/.test(k)).sort((a, b) => a - b).map(k => reKey(cur.__mxExtra[k])); const uniq = [...new Set(arr)]; const keep = {}; Object.keys(cur.__mxExtra).filter(k => !/^\d+$/.test(k)).forEach(k => { keep[k] = cur.__mxExtra[k]; }); uniq.forEach((v, i) => { keep[i] = v; }); cur.__mxExtra = keep; }
    writeFileSync(process.env.SEED_DB, JSON.stringify(cur, null, 1));
    console.log('✓ الأنواع: ' + Object.keys(typesPatch).join(' · ') + ' — ونقاطٌ أُعيد نوعُها: ' + n);
  } else {
    const { createRequire } = await import('module');
    const admin = createRequire(import.meta.url)('firebase-admin'); const fs = admin.firestore();
    await fs.collection('settings').doc('types').set(typesPatch, { merge:true });
    let n = 0;
    for (const m of decMerges) for (const col of ['sites', 'newsites']){
      const q = await fs.collection(col).where('type', '==', m.from).get();
      let bt = fs.batch(), c = 0;
      for (const d of q.docs){ bt.set(d.ref, { type:m.to, _by:'season-seed', _at:Date.now() }, { merge:true }); c++; n++; if (c === 400){ await bt.commit(); bt = fs.batch(); c = 0; } }
      if (c) await bt.commit();
    }
    const mx = await fs.collection('settings').doc('mxExtra').get();
    if (mx.exists){
      const data = mx.data() || {}; const arr = Object.keys(data).filter(k => /^\d+$/.test(k)).sort((a, b) => a - b).map(k => reKey(data[k]));
      const uniq = [...new Set(arr)]; const next = {}; Object.keys(data).filter(k => !/^\d+$/.test(k)).forEach(k => { next[k] = data[k]; }); uniq.forEach((v, i) => { next[i] = v; });
      await fs.collection('settings').doc('mxExtra').set(next);
    }
    console.log('✓ الأنواع: ' + Object.keys(typesPatch).join(' · ') + ' — ونقاطٌ أُعيد نوعُها: ' + n);
  }
}
if (trialsPatch){
  if (process.env.SEED_DB){ cur.__trials = trialsPatch; writeFileSync(process.env.SEED_DB, JSON.stringify(cur, null, 1)); }
  else {
    const { createRequire } = await import('module');
    const admin = createRequire(import.meta.url)('firebase-admin');
    await admin.firestore().collection('settings').doc('trials').set(trialsPatch, { merge:true });
  }
  console.log('✓ أُضيفت التجاربُ إلى settings/trials: ' + trialsAdded.length);
}
process.exit(0);
