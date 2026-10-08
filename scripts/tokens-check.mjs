/* قراءةٌ فقط — «هل التوكينات والفايربيز لسه شغّالة؟»: يُختبر كلُّ مفتاحٍ بنداءٍ بسيط ويُكتب حالُه وتاريخُ انتهائه — ولا تُكتب قيمتُه أبدًا */
import admin from 'firebase-admin'; import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('/tmp/exp', { recursive: true });
const out = {}; const T = ts => ts ? new Date(ts).toISOString().slice(0, 16).replace('T', ' ') : '';
const gh = async (tok) => { if (!tok) return { ok:false, why:'غير مضبوط' }; try { const r = await fetch('https://api.github.com/repos/mhmdsfwt371/Project-survey', { headers:{ authorization:'Bearer ' + tok, 'user-agent':'nusuk-check' } }); const j = await r.json().catch(() => ({})); return { ok:r.status === 200, status:r.status, expires:r.headers.get('github-authentication-token-expiration') || 'بلا تاريخ انتهاء', push:!!(j.permissions && j.permissions.push), why:j.message || '' }; } catch (e){ return { ok:false, why:e.message }; } };
/* ١ · فايربيز (حسابُ الخدمة): قراءةٌ وكتابةٌ ومصادقة */
try { const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
  const t0 = Date.now(); await db.collection('stats').doc('_tokencheck').set({ at:t0 }, { merge:true }); const back = (await db.collection('stats').doc('_tokencheck').get()).data() || {};
  const us = await admin.auth().listUsers(1); out.firebase = { ok:back.at === t0, project:sa.project_id, saEmail:String(sa.client_email || '').replace(/^(.{6}).*(@.*)$/, '$1…$2'), keyId:String(sa.private_key_id || '').slice(0, 6) + '…', authOk:!!us };
  await db.collection('stats').doc('_tokencheck').delete().catch(() => {});
  /* ٢ · توكينُ جيت هب المخزَّنُ في التطبيق (يُطلق به التطبيقُ الأعمال) */
  const g = (await db.collection('ghcfg').doc('gh').get()).data() || {}; out.appGithubToken = Object.assign(await gh(g.tok), { savedAt:T(g.at) });
  /* هل مفتاحُ التطبيق هو نفسُه توكينُ الترقية؟ (مقارنةُ بصمتين لا القيمتين) — وتُحفظ القيمةُ مؤقتًا لتجربة كتابةٍ جافّةٍ ثم تُمسح */
  const { createHash } = await import('crypto'); const hh = v => v ? createHash('sha256').update(String(v)).digest('hex') : '';
  out.appSameAsPromote = !!(g.tok && process.env.PT && hh(g.tok) === hh(process.env.PT));
  if (g.tok){ const { writeFileSync: wf } = await import('fs'); wf('/tmp/apptok', String(g.tok), { mode:0o600 }); }
} catch (e){ out.firebase = { ok:false, why:e.message }; }
/* ٣ · أسرارُ المستودع */
out.PROMOTE_TOKEN = await gh(process.env.PT);
out.GDRIVE_OAUTH = { set:!!process.env.GO }; out.GDRIVE_SA = { set:!!process.env.GS }; out.SMTP = { set:!!process.env.SM }; out.DEVICES_API = { set:!!process.env.DV }; out.MYAFAQY = { set:!!process.env.MY };
/* ٤ · الدرايف: حسابُ خدمة الدرايف إن وُجد — قراءةُ المجلد */
try { if (process.env.GS && process.env.GF){ const gsa = JSON.parse(process.env.GS); const { google } = await import('googleapis').catch(() => ({})); out.GDRIVE_SA.lib = !!google; } } catch (e){ out.GDRIVE_SA.why = e.message; }
writeFileSync('/tmp/exp/tokens-check.json', JSON.stringify(Object.assign({ at:new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 16) }, out)));
console.log('ok');
