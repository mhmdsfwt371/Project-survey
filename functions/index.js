/* Nusuk Survey — integrations (V39.69, phase 0)
   ───────────────────────────────────────────────
   Read-only. Nothing here writes to AFAQY PRO or to the card system.
   · integTick — every 5 minutes: pulls our own devices from AFAQY PRO by IMEI and writes iotlive/_all.
   · integNow  — the «⟳ حدّث الآن» button: the same pull at once (engineer/admin only, at most once a minute for everyone).
   Credentials live in integ/<system> — the app writes them, no client can read them (firestore.rules), only this code.
   AFAQY PRO, from the documented «AVL Integration documentation» collection:
     POST {url}/auth/login { data:{ username, password } } → token (no code step)
     POST {url}/units/lists?token= { data:{ offset, limit, projection, filters:{ imei:{ value:[…], op:'in' } } } }
   Values are taken as the unit reports them (last_update.prms by each sensor's param); naming, units and RSSI→distance
   are tuned later from the first real replies (settings/integStatus.pro.sample keeps their field names only). */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({ region:'us-central1', maxInstances:2, memory:'256MiB', timeoutSeconds:120 });

const PRO_URL = 'https://api.afaqy.sa';
const shape = o => o && typeof o === 'object' ? (Array.isArray(o) ? '[' + (o.length ? shape(o[0]) : '') + ']' : '{' + Object.keys(o).slice(0, 40).join(',') + '}') : typeof o;
const num = x => (x == null || x === '' || !Number.isFinite(+x)) ? null : Math.round(+x * 100) / 100;
const ms = t => { if (!t) return 0; const n = +t; if (Number.isFinite(n)) return n < 1e12 ? n * 1000 : n; const d = Date.parse(t); return Number.isFinite(d) ? d : 0; };

async function proCall(url, path, data, token){
  const r = await fetch(url + path + (token ? (path.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token) : ''), {
    method:'POST', headers:{ 'content-type':'application/json', accept:'application/json' }, body:JSON.stringify({ data }) });
  const j = await r.json().catch(() => ({}));
  return { ok:r.ok, status:r.status, j };
}
const tokOf = j => (j && j.data && (j.data.token || j.data.access_token || j.data.accessToken)) || (j && (j.token || j.access_token)) || '';

/* our devices: every sensor and gateway with an IMEI/serial in a camp's sensor plan (sites/<id>.iotJ) */
async function ourDevices(){
  const mine = {}; let planned = 0;
  const take = (id, c) => { if (!c) return; [['s', c.sm], ['g', c.gm]].forEach(([k, arr]) => (arr || []).forEach((m, i) => {
    planned++; const s = String((m && m.serial) || '').trim(); if (s) mine[s.toLowerCase()] = { site:id, k, i, id:(m && m.id) || '' }; })); };
  const a = await db.collection('sites').where('iotJ', '>', '').get();   /* only camps with a plan — not the whole registry */
  a.forEach(d => { try { take(d.id, JSON.parse(d.data().iotJ)); } catch (e) { /* a broken plan is skipped */ } });
  return { mine, planned };
}

/* what a unit reports: each sensor by its param, plus the common names if no sensor is defined */
function valuesOf(u){
  const lu = u.last_update || {}, prms = lu.prms || {}, v = {};
  (Array.isArray(u.sensors) ? u.sensors : []).forEach(s => { const p = s && (s.param || s.parameter); const val = p != null ? num(prms[p]) : null;
    if (val != null) v[String(s.name || s.type || p).slice(0, 40)] = val; });
  ['temperature', 'temp', 'humidity', 'hum', 'battery', 'bat', 'battery_level', 'rssi', 'snr', 'ext_battery', 'int_battery', 'power', 'pwr_ext', 'pwr_int']
    .forEach(p => { const val = num(prms[p]); if (val != null && v[p] == null) v[p] = val; });
  return v;
}

async function proPull(why){
  const now = Date.now(), cfgDoc = await db.collection('integ').doc('afaqypro').get(), cfg = cfgDoc.exists ? cfgDoc.data() : null;
  const status = async st => db.collection('settings').doc('integStatus').set({ pro:Object.assign({ at:Date.now(), why }, st) }, { merge:true });
  if (!cfg || cfg.on === false || !cfg.user || !cfg.pass){ await status({ state:'off' }); return { state:'off' }; }
  const url = String(cfg.url || PRO_URL).replace(/\/+$/, '');
  const { mine, planned } = await ourDevices(); const imeis = Object.keys(mine);
  if (!imeis.length){ await status({ state:'ok', planned, withImei:0, matched:0, note:'no IMEI recorded yet' }); return { state:'ok', matched:0 }; }
  /* the token is kept between runs and renewed when refused — not a fresh login every five minutes */
  const tokRef = db.collection('integ').doc('afaqypro_tok'); let tok = ((await tokRef.get()).data() || {}).tok || '';
  const login = async () => { const L = await proCall(url, '/auth/login', { username:cfg.user, password:cfg.pass }); const t = tokOf(L.j);
    if (!t){ const sh = shape(L.j), needCode = /otp|verif|two.?factor|2fa|mfa|\bcode\b/i.test(JSON.stringify(sh || '')) || /otp|verif|code/i.test(JSON.stringify(L.j || '').slice(0, 400));   /* (V39.72) a code-step reply is not a wrong password */
      throw Object.assign(new Error(needCode ? 'otp' : 'login'), { st:L.status, shape:sh }); } await tokRef.set({ tok:t, at:Date.now() }); return t; };
  try {
    if (!tok) tok = await login();
    const units = []; let sample = null;
    for (let i = 0; i < imeis.length; i += 100){
      const body = { offset:0, limit:1000, simplify:0, projection:['basic', 'last_update', 'sensors'], filters:{ imei:{ value:imeis.slice(i, i + 100), op:'in' } } };
      let R = await proCall(url, '/units/lists', body, tok);
      if (R.status === 401 || R.status === 403){ tok = await login(); R = await proCall(url, '/units/lists', body, tok); }
      const arr = (R.j && R.j.data && (Array.isArray(R.j.data) ? R.j.data : R.j.data.data)) || [];
      if (!sample && arr.length) sample = { reply:shape(R.j), unit:shape(arr[0]), last:shape(arr[0].last_update), prms:shape((arr[0].last_update || {}).prms), sensors:shape(arr[0].sensors) };
      units.push(...arr);
    }
    const snap = {}, camps = {}; let matched = 0;
    units.forEach(u => {
      const keys = [u.imei, u.device_serial, u.device_gateway].map(x => String(x || '').trim().toLowerCase()).filter(Boolean);
      const ser = keys.find(k => mine[k]); if (!ser) return; matched++;
      const hit = mine[ser], lu = u.last_update || {};
      snap[ser] = { site:hit.site, k:hit.k, i:hit.i, id:hit.id, u:String(u._id || ''), nm:String(u.name || '').slice(0, 60), t:ms(lu.dtt || lu.dts), v:valuesOf(u) };
    });
    Object.keys(snap).forEach(ser => { const r = snap[ser], C = camps[r.site] || (camps[r.site] = { at:0, s:{}, g:{} });
      (r.k === 's' ? C.s : C.g)[r.id || ser] = { at:r.t, v:r.v, serial:ser }; if (r.t > C.at) C.at = r.t; });
    await db.collection('iotlive').doc('_all').set({ at:Date.now(), n:matched, total:units.length, planned, src:'afaqy-pro', units:snap, camps });
    await status({ state:'ok', planned, withImei:imeis.length, found:units.length, matched, ms:Date.now() - now, sample:sample || null });
    return { state:'ok', matched, found:units.length };
  } catch (e) {
    await status({ state:'err', err:String(e.message || e).slice(0, 120), httpStatus:e.st || 0, shape:e.shape || '' });
    return { state:'err', err:String(e.message || e).slice(0, 120) };
  }
}

exports.integTick = onSchedule({ schedule:'every 5 minutes', timeZone:'Asia/Riyadh' }, async () => { await proPull('schedule'); });

exports.integNow = onCall(async req => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'sign in');
  /* the same reading as firestore.rules: users/<uid>.role, and the owner's accounts are admin */
  const boss = ['mohammed.safwat@afaqy.com', 'm.safwat@nusuk.local'].includes(String((req.auth.token || {}).email || '').toLowerCase());
  const u = boss ? null : await db.collection('users').doc(req.auth.uid).get(), role = boss ? 'admin' : (u && u.exists ? (u.data().role || 'tech') : 'none');
  if (role !== 'admin' && role !== 'engineer') throw new HttpsError('permission-denied', 'engineer or admin');
  if (u && u.exists && u.data().active === false) throw new HttpsError('permission-denied', 'inactive');
  const st = ((await db.collection('settings').doc('integStatus').get()).data() || {}).pro || {};
  if (st.at && Date.now() - st.at < 60000 && st.why === 'button') return { state:st.state, cached:true, at:st.at, matched:st.matched || 0 };
  return proPull('button');
});
