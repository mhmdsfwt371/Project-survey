/* تصديرُ تحديات مسح ١٤٤٨ من القاعدة — للدراسة. لا يُطبَع في السجل (المستودعُ عامّ) إلا أعداد؛ والملفّاتُ تُرفَع إلى درايف المالك */
import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const all = async n => (await db.collection(n).get()).docs.map(d => Object.assign({ _id:d.id }, d.data()));
const html = readFileSync('index.html', 'utf8');
const RAW = JSON.parse(/var SITES_RAW = (\{.*?\});\n/.exec(html)[1]);
const S47 = JSON.parse(readFileSync('season1447.json', 'utf8'));
const [recs, news, ovs, inss] = await Promise.all([all('recs'), all('newsites'), all('sites'), all('inss')]);
const OV = {}; ovs.forEach(o => { OV[o._id] = o; });
const SITE = {};
RAW.g.concat(RAW.p).forEach(r => { SITE[r[0]] = { id:r[0], name:r[1], zone:RAW.z[r[2]], type:RAW.t[r[3]], lng:+r[6] }; });
news.forEach(v => { if (!v || v.deleted || v.hidden || !v.id) return;   /* كالتطبيق: المخفيُّ والمحذوفُ لا يُدمَجان */ SITE[v.id] = SITE[v.id] || { id:v.id, name:v.name || v.id, zone:v.zone || '', type:v.type || '', lng:+v.lng || 0, isNew:1 }; });
Object.keys(OV).forEach(id => { const o = OV[id]; if (SITE[id]){ if (o.hidden){ delete SITE[id]; return; } ['name','zone','type'].forEach(k => { if (o[k]) SITE[id][k] = o[k]; }); } });
const classify = x => {
  const z = x.zone, t = x.type, area = (S47[x.id] && (S47[x.id].team || S47[x.id].iss)) || '';
  if (z === 'منى') return ['منى', { 'مخيم':'مخيمات', 'ممر':'ممرات', 'جسر':'ممرات', 'كاميرا':'كاميرات الرصد', 'LPR':'كاميرات الرصد' }[t] || ('أخرى — ' + t)];
  if (z === 'عرفات') return ['عرفات', { 'مخيم':'مخيمات', 'ممر':'ممرات', 'جسر':'ممرات', 'كاميرا':'كاميرات رصد', 'LPR':'كاميرات رصد' }[t] || ('أخرى — ' + t)];
  if (z === 'مواقع التفويج') return ['مراكز التفويج', /النوري|النوار/.test(x.name) ? 'النورية' : /الهجرة/.test(x.name) ? 'طريق الهجرة' : 'مواقع تفويج أخرى'];
  if (z === 'الجمرات') return ['منى', 'منشأة الجمرات'];
  if (z === 'مسجد نمرة') return ['عرفات', 'مسجد نمرة'];
  if (z === 'قطار المشاعر') return (/عرفات/.test(area) || (!area && x.lng >= 39.95)) ? ['عرفات', 'محطات قطار'] : ['منى', 'محطات قطار'];
  if (/مزدلفة/.test(z)) return ['مزدلفة', 'ممرات'];
  if (/النوري|النوار/.test(z + ' ' + x.name)) return ['مراكز التفويج', 'النورية'];
  if (/الهجرة/.test(z + ' ' + x.name)) return ['مراكز التفويج', 'طريق الهجرة'];
  return ['غير مصنف', z || '—'];
};
const chalKey = c => { c = String(c || '').trim(); if (/^لا يوجد سطح تثبيت/.test(c)) return 'لا يوجد سطح تثبيت'; if (/^أخرى/.test(c)) return 'أخرى'; return c; };
const INS = {}; inss.forEach(i => { INS[i._id] = i; });
const rows = [];
recs.forEach(r => {
  if (!r || r.deleted) return; const id = r.site || r._id; const x = SITE[id]; if (!x) return;
  const ch = [...new Set((Array.isArray(r.chals) ? r.chals : []).filter(c => c && c !== 'لا توجد تحديات').map(chalKey))];
  const reached = !r.access || r.access === 'تم الوصول';
  const installed = !!(INS[id] && INS[id].status === 'مُركّب');
  const [m, sub] = classify(x);
  rows.push({ id, name:x.name, main:m, sub, zone:x.zone, type:x.type, chals:ch, note:String(r.chal_note || r.note || '').trim().slice(0, 200), access:r.access || 'تم الوصول', reached, installed, review:r.review || '', at:r.at || 0, isNew:!!x.isNew });
});
const reg = {}; Object.values(SITE).forEach(x => { const k = classify(x).join('|'); reg[k] = (reg[k] || 0) + 1; });
const bySub = {}; const byChal = {}; const other = {}; const acc = {};
rows.forEach(r => {
  const k = r.main + '|' + r.sub; const b = bySub[k] || (bySub[k] = { main:r.main, sub:r.sub, visited:0, withChal:0, notReached:0, obst:0, chals:{} });
  b.visited++; const open = !r.installed;
  if (r.chals.length && open) b.withChal++; if (!r.reached && open) b.notReached++; if (open && (r.chals.length || !r.reached)) b.obst++;
  if (open) r.chals.forEach(c => { b.chals[c] = (b.chals[c] || 0) + 1; const t = byChal[c] || (byChal[c] = { total:0, mina:0, arafat:0, other:0 }); t.total++; if (r.main === 'منى') t.mina++; else if (r.main === 'عرفات') t.arafat++; else t.other++; });
  if (!r.reached && open) acc[r.access] = (acc[r.access] || 0) + 1;
  if (!r.reached && open){ const t = byChal['تعذّر الوصول'] || (byChal['تعذّر الوصول'] = { total:0, mina:0, arafat:0, other:0 }); t.total++; if (r.main === 'منى') t.mina++; else if (r.main === 'عرفات') t.arafat++; else t.other++; b.chals['تعذّر الوصول'] = (b.chals['تعذّر الوصول'] || 0) + 1; }
  if (r.chals.includes('أخرى') && r.note){ const k = r.note.replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/\s+/g, ' ').slice(0, 80); other[k] = (other[k] || 0) + 1; }
});
Object.keys(reg).forEach(k => { if (!bySub[k]){ const [m, s] = k.split('|'); bySub[k] = { main:m, sub:s, visited:0, withChal:0, notReached:0, obst:0, chals:{} }; } bySub[k].registry = reg[k]; });
const summary = { at:new Date().toISOString(), recs:rows.length, sites:Object.keys(SITE).length,
  withChal:rows.filter(r => r.chals.length && !r.installed).length, notReached:rows.filter(r => !r.reached && !r.installed).length,
  obst:rows.filter(r => !r.installed && (r.chals.length || !r.reached)).length,
  bySub:Object.values(bySub), byChal, access:acc, otherTop:Object.entries(other).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([t, n]) => ({ t, n })) };
mkdirSync('/tmp/exp', { recursive:true });
writeFileSync('/tmp/exp/detail.json', JSON.stringify(rows)); writeFileSync('/tmp/exp/summary.json', JSON.stringify(summary));
console.log('اكتمل الاستخراج — الأعدادُ في الملف المرفوع إلى الدرايف وحدَه (المستودعُ عامّ)');
