/* (V40.1) one-time read-only diagnosis of the AFAQY PRO bridge: what the last pull saw, which IMEIs we hold, and — with the
   stored session token, never printed — what the platform returns for those IMEIs and how many units this account sees at
   all. Writes nothing. */
import admin from 'firebase-admin';
const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
if (!raw){ console.log('::warning::FIREBASE_SERVICE_ACCOUNT غير مضبوط'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore();
const st = ((await db.collection('settings').doc('integStatus').get()).data() || {}).pro || {};
console.log('آخر سحب:', JSON.stringify({ state:st.state, why:st.why, at:st.at && new Date(st.at).toISOString(), planned:st.planned, withImei:st.withImei, found:st.found, matched:st.matched, err:st.err, httpStatus:st.httpStatus, msg:st.msg, sample:st.sample }));
const cfg = (await db.collection('integ').doc('afaqypro').get()).data() || {};
console.log('الحساب:', JSON.stringify({ user:cfg.user, url:cfg.url, on:cfg.on, hasToken:!!cfg.token }));
const T = (await db.collection('integ').doc('afaqypro_tok').get()).data() || {};
console.log('الجلسة:', JSON.stringify({ base:T.base || '(integration)', at:T.at && new Date(T.at).toISOString(), hasTok:!!T.tok }));
const mine = []; (await db.collection('sites').where('iotJ', '>', '').get()).forEach(d => { try { const c = JSON.parse(d.data().iotJ); [['s', c.sm], ['g', c.gm]].forEach(([k, a]) => (a || []).forEach(m => { const s = String((m && m.serial) || '').trim(); if (s) mine.push({ site:d.id, k, id:m.id || '', s }); })); } catch (e){} });
console.log('أرقامنا (' + mine.length + '):', mine.map(x => x.site + '/' + x.id + '=' + x.s).join(' | '));
if (!T.tok){ process.exit(0); }
const base = T.base || String(cfg.url || 'https://api.afaqy.sa').replace(/\/+$/, '');
const web = base === 'https://api.afaqy.pro';
const call = async (p, data) => { const r = await fetch(base + '/' + p + '?token=' + encodeURIComponent(T.tok), { method:'POST', headers:{ 'content-type':'application/json', accept:'application/json' }, body:JSON.stringify({ data: web ? JSON.stringify(data) : data }) }); const j = await r.json().catch(() => ({})); return { s:r.status, j }; };
const all = await call('units/lists', { offset:0, limit:1, projection:['basic'] });
console.log('كل ما يراه الحساب:', all.s, JSON.stringify({ status_code:all.j.status_code, message:all.j.message, pagination:all.j.pagination || (all.j.data && all.j.data.pagination), n:Array.isArray(all.j.data) ? all.j.data.length : null }));
const f = await call('units/lists', { offset:0, limit:50, projection:['basic'], filters:{ imei:{ value:mine.map(x => x.s), op:'in' } } });
const arr = Array.isArray(f.j.data) ? f.j.data : ((f.j.data && f.j.data.data) || []);
console.log('بأرقامنا:', f.s, JSON.stringify({ status_code:f.j.status_code, message:f.j.message, n:arr.length, units:arr.slice(0, 10).map(u => ({ name:u.name, imei:u.imei, serial:u.device_serial, owner:u.owner && (u.owner.username || u.owner) })) }));
const one = mine.find(x => /^24e12413605ed65a$/i.test(x.s)) || mine[0];
if (one){ const g = await call('units/lists', { offset:0, limit:5, projection:['basic'], filters:{ imei:{ value:one.s, op:'like' } } });
  const a2 = Array.isArray(g.j.data) ? g.j.data : ((g.j.data && g.j.data.data) || []);
  console.log('بحثُ «like» عن ' + one.s + ':', g.s, JSON.stringify({ status_code:g.j.status_code, message:g.j.message, n:a2.length, first:a2[0] && { name:a2[0].name, imei:a2[0].imei } })); }
process.exit(0);
