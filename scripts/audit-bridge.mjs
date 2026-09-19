/* ═══════════════════════════════════════════════════════════════════════════
   جردُ جسر ماي أفاقي — node scripts/audit-bridge.mjs
   ───────────────────────────────────────────────────────────────────────────
   الواجهةُ الحقيقيةُ ليست في متناول الجرد، فيُقام هنا خادمٌ وهميٌّ يردُّ بغلافها
   المؤكَّد { data, status, message, success } ويسجّل ما وصله. وتُنفَّذ عليه
   السيناريوهاتُ الثلاثة كما ستقع: إنشاءُ ما أُسند، وعدمُ تكراره، وإقفالُ ما
   أُقفل هناك، وملءُ الكتالوج بلا مسٍّ للمضبوط — ثم سيناريو «الناقص لا يُخمَّن»:
   بلا مسارِ قراءةٍ لا يُقفَل شيء، ويُقال ما ينقص.
   ═════════════════════════════════════════════════════════════════════════ */
import http from 'http';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { execFile } from 'child_process';
const exec = (args, env) => new Promise(res => execFile('node', args, { encoding:'utf8', env }, (err, stdout, stderr) => res(String(stdout || '') + String(stderr || ''))));

let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); }
  else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };

/* ── الخادمُ الوهمي ─────────────────────────────────────────────────────── */
const seen = [];                       /* كلُّ ما وصل: {method, path, body, auth} */
let nextId = 700; const remote = {};    /* المهامُّ هناك: id → status */
const srv = http.createServer((req, res) => {
  let raw = ''; req.on('data', c => { raw += c; });
  req.on('end', () => {
    let body = null; try { body = raw ? JSON.parse(raw) : null; } catch {}
    seen.push({ method: req.method, path: req.url, body, auth: req.headers.authorization || '' });
    const send = (o, code) => { res.writeHead(code || 200, { 'Content-Type':'application/json' }); res.end(JSON.stringify(o)); };
    if (!req.headers.authorization) return send({ success:false, message:'unauthorized' }, 401);
    if (req.url === '/Task/AddTask' && req.method === 'POST'){
      const id = ++nextId; remote[id] = 'Open';
      return send({ data:{ id }, status:200, message:'', success:true });
    }
    const g = /^\/Task\/GetById\/(\d+)$/.exec(req.url);
    if (g && req.method === 'GET') return send({ data:{ id:+g[1], status: remote[g[1]] || 'Open' }, success:true });
    if (req.url === '/Item/GetAll' && req.method === 'POST')
      return send({ data:{ data:[{ id:'RDR-01', name:'قارئ RFID', price:1200, unit:'قطعة' }, { id:'ANT-01', name:'هوائي', price:300, unit:'قطعة' }, { id:'GW-TZ', name:'جيت واي تي زون', price:900, unit:'قطعة' }], listCount:3 }, success:true });
    send({ success:false, message:'not found' }, 404);
  });
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + srv.address().port;

/* ── القاعدةُ الوهمية ────────────────────────────────────────────────────── */
const F = '/tmp/bridge-audit-db.json';
const db = () => JSON.parse(readFileSync(F, 'utf8'));
writeFileSync(F, JSON.stringify({
  tasks: {
    'TK1': { id:'TK1', site:'NSK-MIN-CMP-001', kind:'ins', to:'فريق أ', status:'مطلوب', at: Date.now() },
    'TK2': { id:'TK2', site:'NSK-MIN-CMP-002', kind:'ins', to:'فريق ب', status:'مطلوب', at: Date.now() },
    'TK3': { id:'TK3', site:'NSK-MIN-CMP-003', kind:'visit', to:'فريق أ', status:'مطلوب', at: Date.now() },
    'TK4': { id:'TK4', site:'NSK-MIN-CMP-004', kind:'ins', to:'فريق أ', status:'معتمد', doneAt: Date.now() - 1 }
  },
  inss: { 'NSK-MIN-CMP-001': { id:'NSK-MIN-CMP-001', solution:{ status:'معتمد', items:{ 'RDR-01':1, 'ANT-01':4 } } } },
  newsites: { 'NSK-MIN-CMP-001': { id:'NSK-MIN-CMP-001', name:'مخيمٌ تجريبي', zone:'منى', type:'مخيم' } },
  points: { itP: { 'ANT-01': { n:'هوائيٌّ ضُبط بيد', p:333 } } }
}));
const run = (extra) => exec(['scripts/myafaqy-bridge.mjs'], Object.assign({}, process.env, {
  BRIDGE_DB:F, MYAFAQY_BASE:BASE, MYAFAQY_TOKEN:'t-test', FIREBASE_SERVICE_ACCOUNT:'',
  MYAFAQY_ASSIGNEE_MAP:'{"فريق أ":"11"}', MYAFAQY_ASSIGN_GROUP:'1', MYAFAQY_TASK_TYPE_ID:'5', MYAFAQY_CUSTOMER_ID:'9',
  MYAFAQY_ITEMS_PATH:'Item/GetAll', MYAFAQY_STATUS_PATH:'data.status'
}, extra || {}));

console.log('\n══ ١ · ما أُسند يُنشأ هناك مرةً واحدة، وبمفتاح الربط في عنوانه ══');
{
  const out1 = await run({ MYAFAQY_TASK_GET_PATH:'' });
  const d1 = db();
  T(d1.tasks.TK1.ext && d1.tasks.TK1.ext.id === '701' && d1.tasks.TK1.ext.status === 'open', 'مهمةُ التركيب المُسنَدة أُنشئت وحُفظ معرِّفُها: #' + (d1.tasks.TK1.ext || {}).id);
  const add = seen.filter(x => x.path === '/Task/AddTask');
  T(add.length === 1 && add[0].body.title === 'NSK NSK-MIN-CMP-001 — تركيب' && add[0].body.isAssignedToGroup === true && add[0].body.assigneeId === '11',
    'وبالحقول المؤكَّدة: عنوانٌ يحمل NSK والمُسنَدُ إليه فريقٌ');
  T(/RDR-01 × 1/.test(add[0].body.description) && /ANT-01 × 4/.test(add[0].body.description) && /مخيمٌ تجريبي/.test(add[0].body.description), 'ووصفُها يحمل الحلَّ بأصنافه واسمَ النقطة');
  T(!d1.tasks.TK2.ext && /لا معرِّفَ في MYAFAQY_ASSIGNEE_MAP/.test(out1), 'ومن لا معرِّفَ له هناك لا يُرسَل — ويُقال لماذا');
  T(!d1.tasks.TK3.ext && !d1.tasks.TK4.ext, 'والزيارةُ والمنجَزُ لا يُرسَلان');
  T(/MYAFAQY_TASK_GET_PATH/.test(out1), 'وبلا مسارِ قراءةٍ يُقال إنه ينقص — لا يُخمَّن');
  T(add[0].auth === 'Bearer t-test', 'والتوكنُ في الترويسة لا في الرابط');
  const before = seen.length; await run({ MYAFAQY_TASK_GET_PATH:'' });
  T(seen.slice(before).filter(x => x.path === '/Task/AddTask').length === 0 && db().tasks.TK1.ext.id === '701', 'وتشغيلٌ ثانٍ لا يكرّر الإنشاء');
}

console.log('\n══ ٢ · ما أُقفل هناك يُقفَل هنا ══');
{
  await run({ MYAFAQY_TASK_GET_PATH:'Task/GetById/{id}' });
  T(db().tasks.TK1.ext.status === 'open' && db().tasks.TK1.status === 'مطلوب', 'ما دام مفتوحًا هناك يبقى مفتوحًا هنا');
  remote[701] = 'Completed';
  const out2 = await run({ MYAFAQY_TASK_GET_PATH:'Task/GetById/{id}' });
  const d2 = db();
  T(d2.tasks.TK1.status === 'منجز' && d2.tasks.TK1.doneAt > 0 && d2.tasks.TK1.ext.status === 'closed' && d2.tasks.TK1.ext.remote === 'completed',
    'وحين يُقفَل هناك تُقفَل المهمةُ هنا بوقتها وسببها');
  T(/أُقفل هنا \(1\)/.test(out2), 'ويُقال في الملخّص');
  const before = seen.length; await run({ MYAFAQY_TASK_GET_PATH:'Task/GetById/{id}' });
  T(seen.slice(before).filter(x => /GetById/.test(x.path)).length === 0, 'والمقفلُ لا يُستعلَم عنه ثانيةً');
}

console.log('\n══ ٣ · الأصنافُ تُملأ ولا تُصحَّح ══');
{
  const d3 = db();
  T(d3.points.itP['RDR-01'] && d3.points.itP['RDR-01'].n === 'قارئ RFID' && d3.points.itP['RDR-01'].p === 1200 && d3.points.itP['GW-TZ'], 'الغائبُ يُضاف باسمه وسعره ومصدره');
  T(d3.points.itP['ANT-01'].n === 'هوائيٌّ ضُبط بيد' && d3.points.itP['ANT-01'].p === 333, 'والمضبوطُ بيدٍ لا يُمَسّ');
  const items = seen.filter(x => x.path === '/Item/GetAll');
  T(items.length >= 1 && items[0].body && items[0].body.pageSize === 500 && Array.isArray(items[0].body.selectedId), 'وجسمُ القوائم المؤكَّدُ يُرسَل كما هو');
}

console.log('\n══ ٤ · بلا ضبطٍ لا شيءَ يُنفَّذ ولا يُخمَّن ══');
{
  const outN = await exec(['scripts/myafaqy-bridge.mjs'], Object.assign({}, process.env, { BRIDGE_DB:F, MYAFAQY_BASE:'', FIREBASE_SERVICE_ACCOUNT:'' }));
  T(/MYAFAQY_BASE فارغ/.test(outN), 'بلا عنوان الأساس يُتخطّى بهدوء');
  const before = seen.length;
  const outT = await run({ MYAFAQY_TOKEN:'', MYAFAQY_LOGIN_PATH:'' });
  T(seen.length === before && /MYAFAQY_TOKEN أو/.test(outT), 'وبلا توكنٍ ولا مسارِ دخولٍ لا يُطلَب شيءٌ — ويُقال ما ينقص');
  const y = readFileSync('.github/workflows/myafaqy.yml', 'utf8');
  T(/node scripts\/myafaqy-bridge\.mjs/.test(y) && /MYAFAQY_BASE:\s*\$\{\{\s*vars\.MYAFAQY_BASE/.test(y) && /MYAFAQY_TOKEN:\s*\$\{\{\s*secrets\.MYAFAQY_TOKEN/.test(y),
    'والسيرُ يقرأ العنوانَ من المتغيّرات والتوكنَ من الأسرار');
  const html = readFileSync('index.html', 'utf8');
  T(html.indexOf('MYAFAQY') < 0 && html.indexOf('crmbackend') < 0, 'والتطبيقُ نفسُه لا يعرف الواجهةَ — الهاتفُ لا يكلّمها');
}

try { unlinkSync(F); } catch {}
srv.close();
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ جسر ماي أفاقي نظيف \u2705');
process.exit(0);
