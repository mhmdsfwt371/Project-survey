/* الوثائقُ اليتيمة: سجلاتٌ في القاعدة تشير إلى نقطةٍ ليست في السجلّ ولا في المواقع المضافة الحيّة — قراءةٌ فقط، لا حذف */
import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); admin.initializeApp({ credential: admin.credential.cert(sa) }); const db = admin.firestore();
mkdirSync('/tmp/exp', { recursive: true });
const REG = new Set(JSON.parse(readFileSync('scripts/reg-ids.json', 'utf8')));
const ns = (await db.collection('newsites').get()).docs.map(d => ({ id: d.id, v: d.data() || {} }));
const NEW = new Set(ns.filter(x => !x.v.deleted && !x.v.hidden).map(x => x.id)), NEWDEAD = new Set(ns.filter(x => x.v.deleted || x.v.hidden).map(x => x.id));
const known = id => REG.has(id) || NEW.has(id);
const out = { at: new Date().toISOString(), registry: REG.size, newsitesAlive: NEW.size, newsitesDead: NEWDEAD.size, collections: {} };
for (const [coll, how] of [['recs', 'id'], ['inss', 'id'], ['maints', 'id'], ['diss', 'id'], ['steps', 'site'], ['photos', 'site'], ['tasks', 'site'], ['sites', 'id']]){
  let snap; try { snap = await db.collection(coll).get(); } catch (e){ out.collections[coll] = { err: String(e).slice(0, 80) }; continue; }
  const o = { total: snap.size, orphan: 0, orphanTomb: 0, toDeadNewsite: 0, samples: [] };
  snap.docs.forEach(d => { const v = d.data() || {}; const sid = how === 'id' ? d.id : String(v.site || ''); if (!sid || known(sid)) return;
    if (v.deleted === true){ o.orphanTomb++; return; }
    o.orphan++; if (NEWDEAD.has(sid)) o.toDeadNewsite++;
    if (o.samples.length < 8) o.samples.push({ doc: d.id.slice(0, 40), site: sid.slice(0, 30), at: v.at || v._at || null, by: v.by || '' }); });
  out.collections[coll] = o;
}
writeFileSync('/tmp/exp/orphans.json', JSON.stringify(out));
console.log('done', JSON.stringify(Object.fromEntries(Object.entries(out.collections).map(([k, v]) => [k, v.orphan]))));
