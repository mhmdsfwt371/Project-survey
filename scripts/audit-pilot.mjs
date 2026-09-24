/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التركيب التجريبي — node scripts/audit-pilot.mjs
   ───────────────────────────────────────────────────────────────────────────
   النقطةُ تُوسَم تجريبيةً من نافذتها (تجاوزٌ في وثيقة الموقع كغيره)، والبطاقةُ
   في «الفك والمراحل ← السلسلة» تقرأ أزمنةَ المراحل من الوثائق نفسِها وتحسب ما
   بينها — والوسمُ للمدير وحدَه، ودليلُ التجربة موجود.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1');
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
const open = async (p, tab) => { w.goPage(p); w.render(1); await wait(60); const b = d.querySelector('[data-ptab="' + p + ':' + tab + '"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150); } return d.getElementById('content'); };
const wrote = []; w.CORE.set = (k, id, v) => { wrote.push([k, id, v]); };

console.log('\n══ ١ · الوسمُ من نافذة النقطة ══');
const x = w.STATE.sites.find(s => s.type === 'مخيم');
w.goPage('map'); w.render(1); await wait(120); w.popOpenAt(x.id, null); await wait(150);
const btn = d.querySelector('[data-pilot="' + x.id + '"]');
T(!!btn && /وَسِمها تجريبيةً/.test(btn.textContent), 'المديرُ يرى زرَّ الوسم');
btn.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(80);
T(x.pilot === true && wrote.some(r => r[0] === 'sites' && r[1] === x.id && r[2].pilot === true), 'والضغطُ يَسِم ويكتب تجاوزًا في وثيقة الموقع كغيره');
T(/أزل الوسم/.test(d.querySelector('[data-pilot="' + x.id + '"]').textContent), 'ويصير الزرُّ إزالةً');

console.log('\n══ ٢ · البطاقةُ تحسب الزمنَ بين المراحل من الوثائق ══');
const now = Date.now();
w.STATE.recs[x.id] = { id:x.id, at: now - 10 * 864e5, by:'أحمد', access:'تم الوصول', review:'approved' };
w.STATE.tasks = w.STATE.tasks || {};
w.STATE.tasks['T-P1'] = { id:'T-P1', site:x.id, kind:'install', at: now - 6 * 864e5, status:'منجز' };
w.STATE.inss[x.id] = { id:x.id, at: now - 4 * 864e5, status:'مُركّب', approved:true, qaAt: now - 3 * 864e5 };
w.TK_IX = null;   /* الفهرسُ يُبطَل كما يُبطله statBump */
const rows = w.pilotRows();
const st = rows.find(r => r.x.id === x.id).st;
T(rows.length === 1 && st[2][1] === now - 4 * 864e5 && st[3][1] === now - 3 * 864e5, 'صفٌّ للنقطة وأزمنةُ التركيب والتدقيق من الوثائق');
w.TK_IX = null; w.POP_OPEN = false; w.POP_SITE = null; const c = await open('dis', 'chain');
const tx = c.textContent;
T(/التركيبُ التجريبي/.test(tx) && tx.indexOf(x.id) > -1, 'والبطاقةُ في «الفك والمراحل ← السلسلة» تعرضها' + (/التركيبُ التجريبي/.test(tx) ? '' : ' — الشريحة: ' + JSON.stringify(tx.slice(0, 160)) + ' | rows=' + w.pilotRows().length + ' card=' + w.pilotCard().length + ' tab=' + w.tabCur('dis')));
T(/١ يوم|٢٤ س/.test(tx), 'وتحسب تركيب←تدقيق: يومٌ واحد');

console.log('\n══ ٣ · للمدير وحدَه، وبلا نقاطٍ تختفي ══');
w.ROLE = 'supervisor'; w.STATE.meta.role = 'supervisor'; w.goPage('map'); w.render(1); await wait(80); w.popOpenAt(x.id, null); await wait(120);
T(!d.querySelector('[data-pilot]'), 'المشرفُ لا يرى زرَّ الوسم');
w.ROLE = 'admin'; w.STATE.meta.role = 'admin';
w.STATE.sites.forEach(s => { delete s.pilot; });
T(w.pilotCard() === '', 'وبلا نقطةٍ موسومةٍ لا بطاقة');
T(existsSync('docs/pilot-install.md') && /قائمة/.test(readFileSync('docs/pilot-install.md', 'utf8')), 'ودليلُ التجربة docs/pilot-install.md موجود');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ التركيب التجريبي نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
