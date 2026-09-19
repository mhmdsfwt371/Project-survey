/* ═══════════════════════════════════════════════════════════════════════════
   جسرُ ماي أفاقي — node scripts/myafaqy-bridge.mjs
   ───────────────────────────────────────────────────────────────────────────
   طلبُ التركيب يُنشأ في نُسُك ويُسنَد، فيُنشأ هناك آليًّا، وما يُقفَل هناك
   يُقفَل هنا. والهاتفُ لا يكلّم الواجهةَ أبدًا: هذا الجسرُ يعمل على السحابة
   بحساب تكاملٍ من الأسرار، كلَّ ربع ساعة.

   القاعدةُ الحاكمة: **لا مسارَ مخمَّنًا**. ما تأكّد كُتب افتراضًا (إنشاءُ المهمة
   والتعليقُ عليها)، وما لم يتأكّد — الدخولُ، وقراءةُ حالة المهمة، وقائمةُ
   الأصناف — يُضبَط بمتغيّراتٍ يلتقطها المهندسُ من المتصفّح في دقيقتين
   (docs/afaqy-api.md §٢). فما لم يُضبَط لا يُنفَّذ: يُقال إنه ينقص ولا يُخمَّن.

   الأسرار (Secrets):
     FIREBASE_SERVICE_ACCOUNT      حسابُ الخدمة (قائم)
     MYAFAQY_TOKEN                 توكنُ حساب التكامل — أو بدلَه:
     MYAFAQY_USER · MYAFAQY_PASS   مع MYAFAQY_LOGIN_PATH وMYAFAQY_TOKEN_PATH
   المتغيّرات (Variables):
     MYAFAQY_BASE                  مثل https://trainingbe.icsa.afaqy.sa — بلا هذا يُتخطّى كلُّ شيءٍ بهدوء
     MYAFAQY_TASK_ADD_PATH         افتراضًا Task/AddTask (مؤكَّد)
     MYAFAQY_COMMENT_PATH          افتراضًا Task/AddComment (مؤكَّد)
     MYAFAQY_TASK_ID_PATH          أين معرِّفُ المهمة في ردِّ الإنشاء — افتراضًا data.id
     MYAFAQY_TASK_TYPE_ID · MYAFAQY_CUSTOMER_ID · MYAFAQY_BRANCH_ID
     MYAFAQY_ASSIGNEE_MAP          JSON: { "اسمُ الفريق أو الفني في نُسُك": "معرِّفُه هناك" }
     MYAFAQY_ASSIGN_GROUP          1 إن كان المعرِّفُ معرِّفَ فريق (isAssignedToGroup)
     MYAFAQY_TASK_GET_PATH         مسارُ قراءة المهمة بـ{id} — يُلتقَط؛ بلا هذا لا يُقفَل شيءٌ من هناك
     MYAFAQY_TASK_GET_METHOD       GET افتراضًا
     MYAFAQY_STATUS_PATH           أين الحالةُ في ردِّ القراءة — افتراضًا data.status
     MYAFAQY_CLOSED_VALUES         افتراضًا Completed,Closed,Done,منجز,مغلق
     MYAFAQY_ITEMS_PATH            مسارُ قائمة الأصناف — يُلتقَط؛ MYAFAQY_ITEMS_METHOD (POST افتراضًا)
     MYAFAQY_ITEMS_BODY            جسمُ الطلب JSON — افتراضًا جسمُ القوائم المؤكَّد
     MYAFAQY_ITEMS_JSON_PATH       افتراضًا data.data
     MYAFAQY_ITEM_ID · MYAFAQY_ITEM_NAME · MYAFAQY_ITEM_PRICE · MYAFAQY_ITEM_UNIT   أسماءُ الحقول
   للجرد:
     BRIDGE_DB                     ملفُ JSON بدلَ القاعدة  ·  BRIDGE_DRY=1 يطبع ولا يكتب
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'fs';

const V = k => String(process.env[k] || '').trim();
const now = Date.now();
const pick = (o, path) => String(path || '').split('.').filter(Boolean).reduce((a, k) => (a == null ? a : a[k]), o);
const DRY = V('BRIDGE_DRY') === '1';
const out = { created:[], closed:[], items:0, skipped:[], missing:[] };

/* ── الإعداد ────────────────────────────────────────────────────────────── */
const BASE = V('MYAFAQY_BASE').replace(/\/+$/, '');
if (!BASE){ console.log('::notice title=جسرُ ماي أفاقي غيرُ مضبوط::MYAFAQY_BASE فارغ — لا شيءَ يُنفَّذ'); process.exit(0); }
const CFG = {
  add: V('MYAFAQY_TASK_ADD_PATH') || 'Task/AddTask',
  comment: V('MYAFAQY_COMMENT_PATH') || 'Task/AddComment',
  idPath: V('MYAFAQY_TASK_ID_PATH') || 'data.id',
  typeId: V('MYAFAQY_TASK_TYPE_ID'), customerId: V('MYAFAQY_CUSTOMER_ID'), branchId: V('MYAFAQY_BRANCH_ID'),
  assignGroup: V('MYAFAQY_ASSIGN_GROUP') === '1',
  get: V('MYAFAQY_TASK_GET_PATH'), getMethod: (V('MYAFAQY_TASK_GET_METHOD') || 'GET').toUpperCase(),
  statusPath: V('MYAFAQY_STATUS_PATH') || 'data.status',
  closed: (V('MYAFAQY_CLOSED_VALUES') || 'Completed,Closed,Done,منجز,مغلق').split(',').map(x => x.trim().toLowerCase()).filter(Boolean),
  items: V('MYAFAQY_ITEMS_PATH'), itemsMethod: (V('MYAFAQY_ITEMS_METHOD') || 'POST').toUpperCase(),
  itemsBody: V('MYAFAQY_ITEMS_BODY') || '{"selectedId":[],"pageNumber":0,"searchCriteria":"","pageSize":500}',
  itemsJson: V('MYAFAQY_ITEMS_JSON_PATH') || 'data.data',
  fId: V('MYAFAQY_ITEM_ID') || 'id', fName: V('MYAFAQY_ITEM_NAME') || 'name', fPrice: V('MYAFAQY_ITEM_PRICE') || 'price', fUnit: V('MYAFAQY_ITEM_UNIT') || 'unit'
};
let ASSIGN = {};
try { ASSIGN = JSON.parse(V('MYAFAQY_ASSIGNEE_MAP') || '{}'); } catch { console.log('::warning::MYAFAQY_ASSIGNEE_MAP ليس JSON — يُهمَل'); }

/* ── القاعدةُ أو بديلُها ────────────────────────────────────────────────── */
let DB, saveDb, sites = [];
if (V('BRIDGE_DB')){
  DB = JSON.parse(readFileSync(V('BRIDGE_DB'), 'utf8'));
  saveDb = () => writeFileSync(V('BRIDGE_DB'), JSON.stringify(DB, null, 1));
} else if (V('FIREBASE_SERVICE_ACCOUNT')){
  const { createRequire } = await import('module');
  const admin = createRequire(import.meta.url)('firebase-admin');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(V('FIREBASE_SERVICE_ACCOUNT'))) });
  const fs = admin.firestore();
  const load = async (name, lim) => { const m = {}; (await fs.collection(name).limit(lim).get()).forEach(d => { m[d.id] = d.data(); }); return m; };
  DB = { tasks: await load('tasks', 5000), inss: await load('inss', 5000), newsites: await load('newsites', 3000), points: (await fs.collection('settings').doc('points').get()).data() || {} };
  saveDb = async () => {
    const b = fs.batch();
    for (const id of DB.__dirtyTasks || []) b.set(fs.collection('tasks').doc(id), DB.tasks[id], { merge:true });
    if (DB.__dirtyPoints) b.set(fs.collection('settings').doc('points'), { itP: DB.points.itP, _by:'myafaqy-bridge', _at: now }, { merge:true });
    await b.commit();
  };
} else { console.log('::notice::لا حسابَ خدمة — تجربةٌ جافة'); DB = { tasks:{}, inss:{}, newsites:{}, points:{} }; saveDb = () => {}; }
DB.__dirtyTasks = [];

/* ── الاتصال ─────────────────────────────────────────────────────────────── */
let TOKEN = V('MYAFAQY_TOKEN');
async function call(path, method, body){
  const url = BASE + '/' + String(path).replace(/^\/+/, '');
  const h = { 'Content-Type':'application/json', Accept:'application/json' };
  if (TOKEN) h.Authorization = 'Bearer ' + TOKEN;
  const res = await fetch(url, { method, headers:h, body: body === undefined ? undefined : JSON.stringify(body) });
  const txt = await res.text();
  let j = null; try { j = JSON.parse(txt); } catch {}
  if (!res.ok) throw new Error(method + ' ' + path + ' → ' + res.status + ' ' + txt.slice(0, 160));
  if (j && j.success === false) throw new Error(method + ' ' + path + ' → success=false: ' + String(j.message || j.actualError || '').slice(0, 160));
  return j;
}
async function login(){
  if (TOKEN) return true;
  const p = V('MYAFAQY_LOGIN_PATH');
  if (!p || !V('MYAFAQY_USER') || !V('MYAFAQY_PASS')){ out.missing.push('MYAFAQY_TOKEN أو (MYAFAQY_LOGIN_PATH + MYAFAQY_USER + MYAFAQY_PASS)'); return false; }
  const j = await call(p, 'POST', { username: V('MYAFAQY_USER'), password: V('MYAFAQY_PASS') });
  TOKEN = String(pick(j, V('MYAFAQY_TOKEN_PATH') || 'data.token') || '');
  if (!TOKEN){ out.missing.push('MYAFAQY_TOKEN_PATH لا يجد التوكن في ردِّ الدخول'); return false; }
  return true;
}

/* ── ما يُرسَل: عنوانٌ يحمل مفتاحَ الربط، ووصفٌ يحمل الحلَّ بأصنافه ──────── */
const siteOf = id => (DB.newsites && DB.newsites[id]) || (sites.find(x => x.id === id)) || { id };
function describe(task){
  const s = siteOf(task.site), ins = DB.inss[task.site] || {};
  const sol = ins.solution && ins.solution.items ? ins.solution.items : {};
  const items = Object.keys(sol).map(k => k + ' × ' + sol[k]).join('، ');
  return [
    'نُسُك — طلبُ تركيب', 'النقطة: ' + task.site, s.name ? 'الاسم: ' + s.name : '', s.zone ? 'المشعر: ' + s.zone : '', s.type ? 'النوع: ' + s.type : '',
    items ? 'الأصناف: ' + items : 'الأصناف: (لا حلَّ معتمدًا على النقطة)',
    task.to ? 'المُسنَد إليه في نُسُك: ' + task.to : '', 'معرِّفُ المهمة في نُسُك: ' + task.id
  ].filter(Boolean).join('\n');
}
const isOpen = t => t && t.kind === 'ins' && !t.doneAt && ['معتمد', 'منجز', 'مغلق', 'ملغى'].indexOf(String(t.status || '')) < 0;

/* ── ١ · نُسُك ← ماي أفاقي: ما أُسند ولا معرِّفَ له يُنشأ هناك ───────────── */
async function pushNew(){
  const todo = Object.values(DB.tasks).filter(t => isOpen(t) && !(t.ext && t.ext.id));
  if (!todo.length) return;
  if (!await login()) return;
  for (const t of todo){
    const who = ASSIGN[t.to] || ASSIGN[t.team] || '';
    if (!who){ out.skipped.push(t.id + ' — لا معرِّفَ في MYAFAQY_ASSIGNEE_MAP للمُسنَد إليه «' + (t.to || t.team || '') + '»'); continue; }
    const body = { title: 'NSK ' + t.site + ' — تركيب', description: describe(t), assigneeId: who,
      branchId: CFG.branchId || undefined, taskTypeId: CFG.typeId || undefined, customerId: CFG.customerId || undefined,
      watchList: [], dueDate: t.when || t.due || undefined, isAssignedToGroup: CFG.assignGroup };
    if (DRY){ out.created.push(t.id + ' (جاف)'); continue; }
    try {
      const j = await call(CFG.add, 'POST', body);
      const ext = String(pick(j, CFG.idPath) || '');
      if (!ext){ out.skipped.push(t.id + ' — أُنشئ لكن MYAFAQY_TASK_ID_PATH لا يجد المعرِّف'); continue; }
      t.ext = { id: ext, at: now, status: 'open', tries: 0 };
      DB.__dirtyTasks.push(t.id); out.created.push(t.id + ' → #' + ext);
    } catch (e){
      t.ext = Object.assign(t.ext || {}, { tries: ((t.ext && t.ext.tries) || 0) + 1, err: String(e.message).slice(0, 160), errAt: now });
      DB.__dirtyTasks.push(t.id); out.skipped.push(t.id + ' — ' + String(e.message).slice(0, 120));
    }
  }
}

/* ── ٢ · ماي أفاقي ← نُسُك: ما أُقفل هناك يُقفَل هنا ───────────────────────── */
async function pullClosed(){
  const open = Object.values(DB.tasks).filter(t => t.ext && t.ext.id && t.ext.status === 'open');
  if (!open.length) return;
  if (!CFG.get){ out.missing.push('MYAFAQY_TASK_GET_PATH — بلا مسارِ القراءة لا يُقفَل شيءٌ من هناك (' + open.length + ' مفتوحة)'); return; }
  if (!await login()) return;
  for (const t of open){
    try {
      const j = await call(CFG.get.replace('{id}', encodeURIComponent(t.ext.id)), CFG.getMethod, CFG.getMethod === 'GET' ? undefined : { id: t.ext.id });
      const st = String(pick(j, CFG.statusPath) || '').toLowerCase();
      if (st && CFG.closed.indexOf(st) > -1){
        t.ext.status = 'closed'; t.ext.closedAt = now; t.ext.remote = st;
        if (isOpen(t)){ t.status = 'منجز'; t.doneAt = now; t.doneBy = 'ماي أفاقي'; }
        DB.__dirtyTasks.push(t.id); out.closed.push(t.id + ' ← #' + t.ext.id + ' (' + st + ')');
      }
    } catch (e){ out.skipped.push(t.id + ' — قراءة: ' + String(e.message).slice(0, 120)); }
  }
}

/* ── ٣ · الأصناف: كتالوجُ الحل يُملأ ولا يُصحَّح ──────────────────────────── */
async function pullItems(){
  if (!CFG.items){ out.missing.push('MYAFAQY_ITEMS_PATH — بلا مسارِ الأصناف لا يُملأ الكتالوج'); return; }
  if (!await login()) return;
  let body; try { body = JSON.parse(CFG.itemsBody); } catch { body = undefined; }
  const j = await call(CFG.items, CFG.itemsMethod, CFG.itemsMethod === 'GET' ? undefined : body);
  const rows = pick(j, CFG.itemsJson);
  if (!Array.isArray(rows)){ out.missing.push('MYAFAQY_ITEMS_JSON_PATH لا يصل إلى مصفوفة'); return; }
  const cat = (DB.points.itP && typeof DB.points.itP === 'object') ? DB.points.itP : {};
  let n = 0;
  for (const r of rows){
    const id = String(r[CFG.fId] || '').trim(); if (!id) continue;
    if (cat[id] && (cat[id].n || cat[id].p)) continue;                 /* المضبوطُ بيدٍ لا يُمَسّ */
    cat[id] = { n: String(r[CFG.fName] || id), p: +r[CFG.fPrice] || 0, u: String(r[CFG.fUnit] || ''), src: 'myafaqy', at: now };
    n++;
  }
  if (n){ DB.points.itP = cat; DB.__dirtyPoints = true; }
  out.items = n;
}

/* ── التشغيل ─────────────────────────────────────────────────────────────── */
try { await pushNew(); } catch (e){ out.skipped.push('إنشاء: ' + String(e.message).slice(0, 160)); }
try { await pullClosed(); } catch (e){ out.skipped.push('إقفال: ' + String(e.message).slice(0, 160)); }
try { await pullItems(); } catch (e){ out.skipped.push('أصناف: ' + String(e.message).slice(0, 160)); }
if (!DRY && (DB.__dirtyTasks.length || DB.__dirtyPoints)) await saveDb();

const L = [];
L.push('أُنشئ هناك (' + out.created.length + '): ' + (out.created.join(' · ') || 'لا شيء'));
L.push('أُقفل هنا (' + out.closed.length + '): ' + (out.closed.join(' · ') || 'لا شيء'));
L.push('أصنافٌ أُضيفت للكتالوج: ' + out.items);
if (out.skipped.length) L.push('تعذّر (' + out.skipped.length + '):\n  ' + out.skipped.join('\n  '));
if (out.missing.length) L.push('ينقص ضبطُه (لا يُخمَّن):\n  ' + [...new Set(out.missing)].join('\n  '));
console.log(L.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY){ try { writeFileSync(process.env.GITHUB_STEP_SUMMARY, L.join('\n') + '\n', { flag:'a' }); } catch {} }
if (out.skipped.some(x => /→ \d{3}|success=false/.test(x))) console.log('::warning title=جسرُ ماي أفاقي::بعضُ الطلبات تعثّر — التفصيلُ أعلاه');
process.exit(0);
