/* ═══════════════════════════════════════════════════════════════════════════
   جردُ عامل الخدمة — node scripts/audit-sw.mjs
   ───────────────────────────────────────────────────────────────────────────
   يُشغَّل sw.js في بيئةٍ مصنوعةٍ بيدٍ (caches وfetch وRequest وResponse): الهيكلُ
   يُخدَم من الكاش بلا شبكة، وأوّلُ تثبيتٍ يجلب من الشبكة ويحفظ، والعاملُ الجديدُ
   يُثبِّت هيكلَه في كاشٍ باسمه ويُنشِّط فيحذف القديم، وdocs شبكةٌ أوّلًا، وsw.js
   شبكةٌ فقط — لا اعتمادَ على حزمة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import vm from 'vm';
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };
const src = readFileSync('sw.js', 'utf8');

class Req { constructor(url, init){ this.url = url; this.mode = (init && init.mode) || 'cors'; this.method = 'GET'; this.cache = init && init.cache; this.credentials = init && init.credentials; } }
class Res { constructor(body, status){ if (status && typeof status === 'object') status = status.status; this.body = body; this.status = status == null ? 200 : status; this.ok = this.status >= 200 && this.status < 300; } clone(){ return new Res(this.body, this.status); } }
function world(seedCaches){
  const stores = new Map();  /* name → Map(url → Response) */
  for (const [name, entries] of Object.entries(seedCaches || {})){ const m = new Map(); for (const [u, body] of Object.entries(entries)) m.set(u, new Res(body, 200)); stores.set(name, m); }
  const net = [];
  const norm = u => String(u).replace(/^\.\//, '/app/').replace(/^\/(?!app\/)/, '/app/');
  const mkCache = name => ({
    add: async r => { const u = typeof r === 'string' ? r : r.url; const res = await fetchImpl(new Req(u, { cache:'reload' })); if (!res.ok) throw new Error('add ' + u); (stores.get(name) || stores.set(name, new Map()).get(name)).set(norm(u), res); },
    put: async (r, res) => { const u = typeof r === 'string' ? r : r.url; (stores.get(name) || stores.set(name, new Map()).get(name)).set(norm(u), res); },
    match: async r => { const u = norm(typeof r === 'string' ? r : r.url); const m = stores.get(name); return m ? m.get(u) : undefined; }
  });
  const cachesApi = {
    open: async name => mkCache(name),
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    match: async r => { const u = norm(typeof r === 'string' ? r : r.url); for (const m of stores.values()){ if (m.has(u)) return m.get(u); } return undefined; }
  };
  const bodies = { '/app/index.html':'<html>shell</html>', '/app/manifest.webmanifest':'{}', '/app/icon-192.png':'png', '/app/icon-512.png':'png', '/app/vendor/leaflet/leaflet.js':'js', '/app/vendor/leaflet/leaflet.css':'css', '/app/vendor/leaflet/images/marker-icon.png':'png', '/app/vendor/leaflet/images/marker-shadow.png':'png', '/app/':'<html>shell</html>', '/app/docs/x.md':'doc', '/app/sw.js':'sw' };
  const fetchImpl = async r => { const u = norm(typeof r === 'string' ? r : r.url); net.push(u); if (world.offline) throw new Error('offline'); return new Res(bodies[u] == null ? '' : bodies[u], bodies[u] == null ? 404 : 200); };
  const handlers = {};
  const self = { addEventListener: (k, f) => { handlers[k] = f; }, skipWaiting: async () => { self.skipped = true; }, clients: { claim: async () => { self.claimed = true; } } };
  const ctx = vm.createContext({ self, caches: cachesApi, fetch: fetchImpl, Request: Req, Response: Res, setTimeout, clearTimeout, console, Promise });
  vm.runInContext(src, ctx);
  const run = async (kind, req) => { let p = null; const ev = { request: req, waitUntil: x => { p = x; }, respondWith: x => { p = x; } }; handlers[kind](ev); return p; };
  return { stores, net, run, self, Req, mkCache };
}
world.offline = false;

const CACHE = /const CACHE = '([^']+)'/.exec(src)[1];
console.log('\n══ ١ · التثبيتُ يجلب الهيكلَ من الشبكة بـcache:reload ويحفظه في كاش النسخة ══');
{
  const W = world();
  await W.run('install', null);
  const shell = W.stores.get(CACHE);
  T(!!shell && shell.has('/app/index.html') && shell.has('/app/manifest.webmanifest') && shell.has('/app/vendor/leaflet/leaflet.js') && W.self.skipped === true, 'الهيكلُ (' + (shell ? shell.size : 0) + ' ملفات) في كاش ' + CACHE + ' والعاملُ لا ينتظر');
  T(W.net.includes('/app/index.html') && /c\.add\(new Request\(u, \{ cache: 'reload'/.test(src), 'وجُلب من الشبكة متجاوزًا كاشَ المتصفّح');
}
console.log('\n══ ٢ · الهيكلُ من الكاش أوّلًا: لا شبكةَ حين يوجد ══');
{
  const W = world({ [CACHE]: { '/app/index.html':'<html>cached</html>', '/app/':'<html>cached</html>' } });
  const res = await W.run('fetch', new W.Req('/app/', { mode:'navigate' }));
  T(res && res.body === '<html>cached</html>' && W.net.length === 0, 'فتحٌ وهو متّصل: من الكاش فورًا بلا طلب شبكة');
  world.offline = true;
  const res2 = await W.run('fetch', new W.Req('/app/index.html?x=1', { mode:'navigate' }));
  world.offline = false;
  T(res2 && res2.body === '<html>cached</html>', 'وبلا شبكة: من الكاش كذلك — والاستعلامُ في العنوان لا يُعمي المطابقة');
}
console.log('\n══ ٣ · أوّلُ تثبيتٍ بلا كاش: يجلب من الشبكة ويحفظ ══');
{
  const W = world();
  const res = await W.run('fetch', new W.Req('/app/', { mode:'navigate' }));
  await new Promise(r => setTimeout(r, 5));
  T(res && res.status === 200 && W.net.includes('/app/') && W.stores.get(CACHE) && W.stores.get(CACHE).has('/app/'), 'بلا كاش: شبكةٌ ثم يُحفَظ للمرة القادمة');
  world.offline = true;
  const W2 = world(); const r2 = await W2.run('fetch', new W2.Req('/app/', { mode:'navigate' }));
  world.offline = false;
  T(r2 && r2.status === 504, 'وبلا كاشٍ ولا شبكةٍ: ٥٠٤ صريحٌ لا تعليق' + (r2 && r2.status !== 504 ? ' — كان: ' + r2.status + ' ' + JSON.stringify(r2.body).slice(0, 30) + ' net=' + W2.net.join(',') : ''));
}
console.log('\n══ ٤ · العاملُ الجديد: كاشٌ باسمه، ويُحذَف القديم ══');
{
  const W = world({ 'nusuk-survey-v0.1': { '/app/index.html':'<html>old</html>' } });
  await W.run('install', null); await W.run('activate', null);
  T(!W.stores.has('nusuk-survey-v0.1') && W.stores.has(CACHE) && W.self.claimed === true, 'القديمُ حُذف والجديدُ تولّى الصفحات');
  const res = await W.run('fetch', new W.Req('/app/', { mode:'navigate' }));
  T(res && res.body === '<html>shell</html>', 'فالفتحُ التالي من الهيكل الجديد');
}
console.log('\n══ ٥ · docs شبكةٌ أوّلًا، وsw.js شبكةٌ فقط ══');
{
  const W = world({ [CACHE]: { '/app/docs/x.md':'old-doc', '/app/sw.js':'old-sw' } });
  const d = await W.run('fetch', new W.Req('/app/docs/x.md'));
  T(d && d.body === 'doc' && W.net.includes('/app/docs/x.md'), 'docs من الشبكة ولو كان في الكاش');
  const s = await W.run('fetch', new W.Req('/app/sw.js'));
  T(s && s.body === 'sw' && W.net.includes('/app/sw.js'), 'وsw.js من الشبكة دائمًا — فيُرى الجديد');
  world.offline = true; const W2 = world({ [CACHE]: { '/app/docs/x.md':'old-doc' } });
  const d2 = await W2.run('fetch', new W2.Req('/app/docs/x.md')); world.offline = false;
  T(d2 && d2.body === 'old-doc', 'وبلا شبكةٍ يعود docs إلى الكاش');
}
console.log('\n══ ٦ · مسارُ التحديث في التطبيق كما هو ══');
{
  const app = readFileSync('index.html', 'utf8');
  T(/controllerchange/.test(app) && /function swPoll\(\)/.test(app) && /SW_STATE\.reg\.update\(\)/.test(app) && /function verChase\(/.test(app), 'الصفحةُ تسأل عن العامل الجديد وتُعاد عند تولّيه، وزرُّ النسخة يطارد الجديد');
  T(!/3500\)/.test(src) && /caches\.match\(req\)\.then\(function \(hit\) \{ return hit \|\| \(isNav/.test(src), 'ولم يبقَ في العامل انتظارُ شبكةٍ للهيكل');
}
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length) process.exit(1);
console.log('جردُ عامل الخدمة نظيف \u2705');
