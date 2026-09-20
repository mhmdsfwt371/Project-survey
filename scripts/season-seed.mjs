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
if (!Object.keys(patch).length && !trialsPatch && !twinsWrites.length){ console.log('لا شيءَ يُكتَب — كلُّ ما في الملف مضبوطٌ من قبل'); process.exit(0); }
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
