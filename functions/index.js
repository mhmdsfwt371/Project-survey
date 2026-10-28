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
const { defineSecret } = require('firebase-functions/params');
const { spawn } = require('child_process');
const path = require('path');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({ region:'us-central1', maxInstances:2, memory:'256MiB', timeoutSeconds:120 });

const PRO_URL = 'https://api.afaqy.sa';
/* (V39.99) the code step, built from the official AFAQY PRO web client (afaqy.pro, its own bundles — not guessed):
     POST {web}/auth/login            { data:JSON.stringify({ username, password, lang, expire, captcha }) }
        → status_code 200 + data.is_2fa + data.token (one-time) + data.methods [{ type:'phone'|'email', value }]
     POST {web}/auth/send_login_otp   { data:JSON.stringify({ method, token }) }          → data.expires_in
     POST {web}/auth/verify_login_otp { data:JSON.stringify({ otpcode:int, method, token }) } → status_code 200 + data.token
   Refusals by message: otp_expired, otp_blocked, Invalid_OTP, validation_error; 405 = wrong code. «expire» is the session
   length in hours (the web client asks 24). The one-time session lives in integ/afaqypro_otp — server-only like integ/*. */
const WEB_URL = 'https://api.afaqy.pro';
async function webCall(path, obj, token){
  const r = await fetch(WEB_URL + '/' + path + (token ? '?token=' + encodeURIComponent(token) : ''), {
    method:'POST', headers:{ 'content-type':'application/json', accept:'application/json' }, body:JSON.stringify({ data:JSON.stringify(obj) }) });
  const j = await r.json().catch(() => ({}));
  return { ok:r.ok, status:r.status, j };
}
const SESSION_HOURS = 720;   /* asked for; the platform keeps what it allows */
async function webLogin(cfg){
  const L = await webCall('auth/login', { username:cfg.user, password:cfg.pass, lang:'ar', expire:SESSION_HOURS, captcha:'' });
  const d = (L.j && L.j.data) || {};
  if (L.j && L.j.status_code === 200 && d.is_2fa && d.token){
    const methods = (Array.isArray(d.methods) ? d.methods : []).map(m => ({ type:String(m.type || ''), value:String(m.value || '').slice(0, 60) })).filter(m => m.type);
    await db.collection('integ').doc('afaqypro_otp').set({ token:d.token, methods, at:Date.now() });
    return { code:true, methods };
  }
  const t = tokOf(L.j);
  if (t) return { tok:t };
  return { err:String((L.j && L.j.message) || L.status).slice(0, 60), st:(L.j && L.j.status_code) || L.status };
}
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
  const pasted = cfg ? String(cfg.token || '').trim() : '';   /* (V40.0) a session token pasted in the app — used first; the account renews it */
  if (!cfg || cfg.on === false || ((!cfg.user || !cfg.pass) && !pasted)){ await status({ state:'off' }); return { state:'off' }; }
  const url = String(cfg.url || PRO_URL).replace(/\/+$/, '');
  const { mine, planned } = await ourDevices(); const imeis = Object.keys(mine);
  if (!imeis.length){ await status({ state:'ok', planned, withImei:0, matched:0, note:'no IMEI recorded yet' }); return { state:'ok', matched:0 }; }
  /* the token is kept between runs and renewed when refused — not a fresh login every five minutes */
  const tokRef = db.collection('integ').doc('afaqypro_tok'), T0 = (await tokRef.get()).data() || {}; let tok = T0.tok || '', base = T0.base || '';
  /* (V39.99) a token from the code step belongs to the web host — every call then goes there, in the web client's format */
  const call = (p, body, tk) => base === WEB_URL ? webCall(p.replace(/^\//, ''), body, tk) : proCall(url, p, body, tk);
  /* (V40.0) a newly pasted token takes over; which host issued it is learned on the first refusal (integration, then web) */
  if (pasted && pasted !== T0.pasted){ tok = pasted; base = ''; await tokRef.set({ tok, at:Date.now(), base:'', pasted }); }
  /* (V40.2) the owner changed the account to m.safwat and still saw nothing: the bridge kept the previous account's session
     (taken 13:59 by «safwat», which sees 2 units). A session older than the saved account is dropped — a new login follows */
  else if (!pasted && tok && cfg.at && (!T0.at || cfg.at > T0.at)){ tok = ''; base = ''; }
  const login = async () => {
    /* (V40.2) a code step in progress is not restarted by the 5-minute tick — a new one-time session would void the code
       the owner is about to type */
    const O = (await db.collection('integ').doc('afaqypro_otp').get()).data();
    if (O && O.token && Date.now() - (O.sentAt || O.at || 0) < 15 * 60000) throw Object.assign(new Error('code'), { methods:O.methods || [], sent:!!O.sentAt, method:O.method || '', expiresIn:O.expiresIn || 0 }); const L = await proCall(url, '/auth/login', { username:cfg.user, password:cfg.pass }); const two = !!(L.j && L.j.data && L.j.data.is_2fa), t = two ? '' : tokOf(L.j);   /* (V40.3) with two-step on, data.token is the one-time session, not a working token — it gave 401 on every call */
    if (!t){   /* (V39.76) the documented refusal is {message:'invalid_credentials', status_code:401} with HTTP 200 — «status_code» had
                  matched the old «code» test and showed «asked for a code». A code step is told only by its own words. */
      const sh = shape(L.j), msg = String((L.j && L.j.message) || '').slice(0, 60), needCode = two || /otp|verif|two.?factor|2fa|mfa/i.test(msg) || /\b(otp|verify|verification)\b/i.test(JSON.stringify(sh || ''));
      if (needCode){   /* (V39.99) the web login gives the one-time session the code step needs */
        const W = await webLogin(cfg);
        if (W.tok){ base = WEB_URL; await tokRef.set({ tok:W.tok, at:Date.now(), base:WEB_URL }); return W.tok; }
        if (W.code) throw Object.assign(new Error('code'), { methods:W.methods });
        throw Object.assign(new Error('login'), { st:W.st, msg:W.err });
      }
      throw Object.assign(new Error('login'), { st:(L.j && L.j.status_code) || L.status, shape:sh, msg:msg }); } await tokRef.set({ tok:t, at:Date.now(), base:'' }); base = ''; return t; };
  try {
    if (!tok) tok = await login();
    const units = []; let sample = null;
    for (let i = 0; i < imeis.length; i += 100){
      const body = { offset:0, limit:1000, simplify:0, projection:['basic', 'last_update', 'sensors'], filters:{ imei:{ value:imeis.slice(i, i + 100), op:'in' } } };
      let R = await call('/units/lists', body, tok);
      const refused = X => X.status === 401 || X.status === 403 || (X.j && (X.j.status_code === 401 || X.j.status_code === 403));
      if (refused(R) && pasted && tok === pasted && base !== WEB_URL){   /* (V40.0) a token from the web app belongs to the web host */
        base = WEB_URL; R = await call('/units/lists', body, tok);
        if (!refused(R)) await tokRef.set({ tok, at:Date.now(), base:WEB_URL, pasted });
      }
      if (refused(R)){
        if (!cfg.user || !cfg.pass) throw Object.assign(new Error('token'), { st:R.status });
        tok = await login(); R = await call('/units/lists', body, tok);
        /* (V40.3) refused even with a fresh session: say so — it was shown as «connected, 0 found» */
        if (refused(R)) throw Object.assign(new Error('refused'), { st:R.status, msg:String((R.j && R.j.message) || '').slice(0, 60) });
      }
      const arr = (R.j && R.j.data && (Array.isArray(R.j.data) ? R.j.data : R.j.data.data)) || [];
      if (!sample && arr.length) sample = { reply:shape(R.j), unit:shape(arr[0]), last:shape(arr[0].last_update), prms:shape((arr[0].last_update || {}).prms), sensors:shape(arr[0].sensors) };
      units.push(...arr);
    }
    /* (V40.1) a 15-character number is the platform's «Device Serial» (the IMEI without its last character): ask by that too */
    const got = new Set(); units.forEach(u => [u.imei, u.device_serial].forEach(x => { const k = String(x || '').trim().toLowerCase(); if (k) got.add(k); }));
    const rest = imeis.filter(k => !got.has(k));
    for (let i = 0; i < rest.length; i += 100){
      const body = { offset:0, limit:1000, simplify:0, projection:['basic', 'last_update', 'sensors'], filters:{ device_serial:{ value:rest.slice(i, i + 100), op:'in' } } };
      const R = await call('/units/lists', body, tok);
      const arr = (R.j && R.j.data && (Array.isArray(R.j.data) ? R.j.data : R.j.data.data)) || [];
      units.push(...arr);
    }
    /* (V40.2) still missing: find them by the platform's unit id. The units this account sees are read once (light, ids
       only, at most every 6 hours), our numbers are mapped to their unit id, then fetched by id — the same «id in» filter
       the official client uses. Only our own numbers are kept in integ/afaqypro_map. */
    const got2 = new Set(); units.forEach(u => [u.imei, u.device_serial].forEach(x => { const k = String(x || '').trim().toLowerCase(); if (k) got2.add(k); }));
    const left = imeis.filter(k => !got2.has(k));
    if (left.length){
      const mapRef = db.collection('integ').doc('afaqypro_map'); let M = (await mapRef.get()).data() || {};
      const need = !M.at || Date.now() - M.at > 6 * 3600e3 || M.user !== (cfg.user || '') || left.some(k => !(M.ids || {})[k] && !(M.miss || []).includes(k));
      if (need){
        const ids = {}, want = new Set(imeis); let seen = 0;
        for (let off = 0; off < 30000; off += 1000){
          const P = await call('/units/lists', { offset:off, limit:1000, projection:['basic'] }, tok);
          const arr = (P.j && P.j.data && (Array.isArray(P.j.data) ? P.j.data : P.j.data.data)) || []; seen += arr.length;
          arr.forEach(u => [u.imei, u.device_serial, u.device_gateway].forEach(x => { const k = String(x || '').trim().toLowerCase(); if (k && want.has(k) && u._id) ids[k] = String(u._id); }));
          if (arr.length < 1000) break;
        }
        M = { at:Date.now(), user:cfg.user || '', seen, ids, miss:left.filter(k => !ids[k]) }; await mapRef.set(M);
      }
      const idList = [...new Set(left.map(k => (M.ids || {})[k]).filter(Boolean))];
      for (let i = 0; i < idList.length; i += 100){
        const R = await call('/units/lists', { offset:0, limit:1000, simplify:0, projection:['basic', 'last_update', 'sensors'], filters:{ id:{ value:idList.slice(i, i + 100), op:'in' } } }, tok);
        units.push(...((R.j && R.j.data && (Array.isArray(R.j.data) ? R.j.data : R.j.data.data)) || []));
      }
    }
    /* (V40.1) none of ours found: how many units does this account see at all? A small number means the wrong account */
    let visible = null;
    if (!units.length){ const V = await call('/units/lists', { offset:0, limit:1, projection:['basic'] }, tok); const pg = V.j && (V.j.pagination || (V.j.data && V.j.data.pagination)); visible = pg && pg.allCount != null ? +pg.allCount : null; }
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
    await status({ state:'ok', planned, withImei:imeis.length, found:units.length, matched, visible, ms:Date.now() - now, sample:sample || null, err:'', httpStatus:0, msg:'', shape:'', methods:[], sent:false });   /* (V40.1) a success clears the last failure's fields */
    return { state:'ok', matched, found:units.length };
  } catch (e) {
    if (e.message === 'code'){ await status({ state:'code', methods:e.methods || [], sent:!!e.sent, method:e.method || '', expiresIn:e.expiresIn || 0, err:'', msg:'' }); return { state:'code' }; }   /* (V39.99 · V40.2 keeps a pending step as it is) */
    await status({ state:'err', err:String(e.message || e).slice(0, 120), httpStatus:e.st || 0, shape:e.shape || '', msg:e.msg || '' });
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

/* ═══ (V39.99) integOtp — the code step from the app: send the code by phone or e-mail, verify it, or start again ═══ */
exports.integOtp = onCall(async req => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'sign in');
  const boss = ['mohammed.safwat@afaqy.com', 'm.safwat@nusuk.local'].includes(String((req.auth.token || {}).email || '').toLowerCase());
  const u = boss ? null : await db.collection('users').doc(req.auth.uid).get(), role = boss ? 'admin' : (u && u.exists ? (u.data().role || 'tech') : 'none');
  if (role !== 'admin' && role !== 'engineer') throw new HttpsError('permission-denied', 'engineer or admin');
  if (u && u.exists && u.data().active === false) throw new HttpsError('permission-denied', 'inactive');
  const d = req.data || {}, op = String(d.op || ''), otpRef = db.collection('integ').doc('afaqypro_otp');
  const status = st => db.collection('settings').doc('integStatus').set({ pro:Object.assign({ at:Date.now(), why:'code' }, st) }, { merge:true });
  if (op === 'restart'){
    const cfg = (await db.collection('integ').doc('afaqypro').get()).data() || null;
    if (!cfg || !cfg.user || !cfg.pass) return { ok:false, err:'no_account' };
    const W = await webLogin(cfg);
    if (W.tok){ await db.collection('integ').doc('afaqypro_tok').set({ tok:W.tok, at:Date.now(), base:WEB_URL }); return Object.assign({ ok:true, done:true }, await proPull('code')); }
    if (W.code){ await status({ state:'code', methods:W.methods, sent:false, err:'', msg:'' }); return { ok:true, methods:W.methods }; }
    await status({ state:'err', err:'login', httpStatus:W.st || 0, msg:W.err || '' }); return { ok:false, err:W.err || 'login' };
  }
  const S = (await otpRef.get()).data() || null;
  if (!S || !S.token) return { ok:false, err:'no_session' };
  if (op === 'send'){
    const method = d.method === 'email' ? 'email' : 'phone';
    const R = await webCall('auth/send_login_otp', { method, token:S.token });
    const ex = (R.j && R.j.data && R.j.data.expires_in) || (R.j && (R.j.expires_in || (R.j.extra && R.j.extra.expires_in))) || 0;
    if (R.j && R.j.status_code === 200){ await otpRef.set({ method, sentAt:Date.now(), expiresIn:+ex || 0 }, { merge:true }); await status({ state:'code', methods:S.methods || [], sent:true, method, expiresIn:+ex || 0, err:'' }); return { ok:true, expiresIn:+ex || 0 }; }
    const m = String((R.j && R.j.message) || R.status).slice(0, 40); await status({ state:'code', methods:S.methods || [], sent:false, err:m }); return { ok:false, err:m, expiresIn:+ex || 0 };
  }
  if (op === 'verify'){
    const code = String(d.code || '').replace(/\D/g, '');
    if (code.length < 4) return { ok:false, err:'validation_error' };
    const R = await webCall('auth/verify_login_otp', { otpcode:parseInt(code, 10), method:S.method || 'phone', token:S.token });
    const tk = R.j && R.j.status_code === 200 && R.j.data && R.j.data.token;
    if (tk){ await db.collection('integ').doc('afaqypro_tok').set({ tok:tk, at:Date.now(), base:WEB_URL }); await otpRef.delete(); return Object.assign({ ok:true, done:true }, await proPull('code')); }
    const m = R.j && R.j.status_code === 405 ? 'Invalid_OTP' : String((R.j && R.j.message) || R.status).slice(0, 40);
    await status({ state:'code', methods:S.methods || [], sent:true, method:S.method || 'phone', err:m }); return { ok:false, err:m };
  }
  return { ok:false, err:'op' };
});

/* ═══ (V39.89) the accounts-and-photos job, moved from GitHub's best-effort cron to an exact 5-minute schedule ═══
   The same scripts that ran on GitHub (provision.mjs, photos-sync.mjs — copied into functions/jobs/ at deploy) run here as
   child processes with the same environment, read from Secret Manager (copied there by secrets-to-gsm.yml; nobody saw a
   value). A lease in settings/jobsLock stops two runs overlapping; settings/jobsStatus records each run for the app. */
const JOBS_SA = defineSecret('JOBS_FIREBASE_SA'), G_OAUTH = defineSecret('GDRIVE_OAUTH'), G_FOLDER = defineSecret('GDRIVE_FOLDER');
function runJob(file, env, ms){
  return new Promise(res => {
    const t0 = Date.now(); let out = '';
    const keep = d => { out += d; if (out.length > 20000) out = out.slice(-20000); };
    const p = spawn(process.execPath, [file], { cwd:path.join(__dirname, 'jobs'), env:Object.assign({}, process.env, env) });
    const k = setTimeout(() => p.kill('SIGKILL'), ms);
    p.stdout.on('data', keep); p.stderr.on('data', keep);
    p.on('close', code => { clearTimeout(k); res({ name:file.replace(/\.mjs$/, ''), code:code == null ? -1 : code, ms:Date.now() - t0, tail:out.split('\n').filter(Boolean).slice(-8).join('\n').slice(0, 1500) }); });
    p.on('error', e => { clearTimeout(k); res({ name:file, code:-1, ms:Date.now() - t0, tail:String(e.message || e).slice(0, 300) }); });
  });
}
exports.jobsTick = onSchedule({ schedule:'every 5 minutes', timeZone:'Asia/Riyadh', timeoutSeconds:540, memory:'1GiB', maxInstances:1, secrets:[JOBS_SA, G_OAUTH, G_FOLDER] }, async () => {
  const db = admin.firestore(), lock = db.collection('settings').doc('jobsLock'), now = Date.now();
  const got = await db.runTransaction(async tx => { const d = (await tx.get(lock)).data() || {}; if (d.until && d.until > now) return false; tx.set(lock, { until:now + 510000, by:'cloud', at:now }, { merge:true }); return true; });
  if (!got) return;
  const env = { FIREBASE_SERVICE_ACCOUNT:JOBS_SA.value(), GDRIVE_OAUTH:G_OAUTH.value(), GDRIVE_FOLDER:G_FOLDER.value(), JOBS_RUNNER:'cloud' };
  const steps = [];
  try {
    steps.push(await runJob('provision.mjs', env, 150000));
    steps.push(await runJob('photos-sync.mjs', env, 330000));
  } finally {
    await db.collection('settings').doc('jobsStatus').set({ at:Date.now(), started:now, ok:steps.length === 2 && steps.every(x => x.code === 0), by:'cloud', steps }).catch(() => {});
    await lock.set({ until:0 }, { merge:true }).catch(() => {});
  }
});
