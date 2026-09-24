/* ═══════════════════════════════════════════════════════════════════════════
   جردُ استعمال الصفحات والقراءات — node scripts/audit-usage.mjs
   ───────────────────────────────────────────────────────────────────────────
   فتحُ الصفحات يُعَدُّ محليًّا ويركب نبضةَ الحضور نفسَها؛ النبضُ الصباحيُّ يجمعه
   عبر الأجهزة في وثيقةٍ واحدةٍ مرةً في اليوم؛ والبطاقةُ تجمع الثلاثين يومًا
   وتقيس قراءاتِ اليوم على الحصة — بلا كتابةٍ جديدةٍ من الجهاز ولا مستمع.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');

console.log('\n══ ١ · لا كتابةَ جديدةً ولا مستمع ══');
const tick = /function pageTick\(id\)\{([\s\S]*?)\n\}/.exec(html)[1];
T(!/CORE\.|FB\./.test(tick) && /lsSet\('nsk14\.pg'/.test(tick), 'العدّادُ محليٌّ فقط (localStorage)');
T(/pg:\(typeof pageUse === 'function' \? pageUse\(\)\.n : \{\}\)/.test(html), 'ويركب نبضةَ الحضور نفسَها');
const uf = /function usageFetch\(force\)\{([\s\S]*?)\n\}/.exec(html)[1];
T(!/onSnapshot/.test(uf) && (uf.match(/\.get\(\)/g) || []).length === 1 && /600000/.test(uf), 'والبطاقةُ قراءةٌ واحدةٌ كلَّ عشر دقائق بلا مستمع');

const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1');
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);

console.log('\n══ ٢ · العدُّ محليًّا ══');
w.goPage('map'); w.goPage('map'); w.goPage('sites');
const u = w.pageUse();
T(u.n.map === 2 && u.n.sites === 1 && JSON.parse(w.localStorage.getItem('nsk14.pg')).n.map === 2, 'فتحُ الصفحات يُعَدُّ ويُحفَظ محليًّا: map ٢ · sites ١');
w.STATE.meta.uid = 'u1'; w.presenceBeat(true);
T(w.STATE.presence.u1.pg && w.STATE.presence.u1.pg.map === 2, 'والنبضةُ تحمله');

console.log('\n══ ٣ · البطاقة ══');
const today = new Date().toISOString().slice(0, 10);
w.STATE.presence = { a:{ day:today, rd:20000 }, b:{ day:today, rd:16000 }, c:{ day:'2020-01-01', rd:99999 } };
const rt = w.readsToday();
T(rt.reads === 36000 && rt.devices === 2, 'قراءاتُ اليوم من نبضات اليوم وحدَها: ٣٦٠٠٠ على جهازين');
const dK = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
w.USAGE.v = { days:{ [dK(3)]:{ map:5, sites:2 }, [dK(2)]:{ map:3 }, [dK(40)]:{ map:100 } } }; w.USAGE.at = Date.now();
const card = w.usageCard();
T(/٧٢٪/.test(card) && /wrn/.test(card), 'ونسبةُ الحصة ٧٢٪ كهرمانية عند ٧٠٪ فأكثر');
T(card.indexOf('>٨<') > -1 && card.indexOf('>٢<') > -1 && card.indexOf('>١٠٨<') === -1, 'الخريطةُ ٨ والمواقعُ ٢ — والقديمُ خارج الثلاثين يومًا لا يُعَدّ');
w.STATE.presence = { a:{ day:today, rd:1000 } };
T(/ok/.test(w.usageCard()), 'ودون ٧٠٪ خضراء');

console.log('\n══ ٤ · النبضُ الصباحيُّ يجمع عبر الأجهزة ══');
const dir = mkdtempSync(join(tmpdir(), 'nsk-us-'));
const src = join(dir, 'src.json'), out = join(dir, 'usage.json'), txt = join(dir, 'pulse.md');
writeFileSync(src, JSON.stringify({ recs:{}, tasks:{}, newsites:{}, bugs:{}, steps:{}, points:{},
  presence:{ d1:{ day:today, rd:12000, pg:{ map:4, sites:1 } }, d2:{ day:today, rd:30000, pg:{ map:1 } }, d3:{ day:'2026-09-01', rd:5, pg:{ over:2 } } } }));
execFileSync('node', ['scripts/pulse.mjs'], { encoding:'utf8', env:{ ...process.env, PULSE_SRC:src, PULSE_USAGE_OUT:out, PULSE_OUT:txt } });
const ag = JSON.parse(readFileSync(out, 'utf8')), md = readFileSync(txt, 'utf8');
T(ag.days[today].map === 5 && ag.days[today].sites === 1 && ag.days['2026-09-01'].over === 2, 'الصفحاتُ تُجمَع لكلِّ يومٍ عبر الأجهزة');
T(/قراءاتُ القاعدة اليوم ≈ \*\*٤٢٬٠٠٠\*\*/.test(md) && /فوق ٧٠٪/.test(md), 'وسطرُ القراءات في النبض بالرقم والتنبيه: ٤٢ ألفًا فوق ٧٠٪');
const pl = readFileSync('scripts/pulse.mjs', 'utf8');
T(/doc\('usage'\)\.set\(/.test(pl) && (pl.match(/doc\('usage'\)\.set\(/g) || []).length === 1 && /slice\(-45\)/.test(pl), 'وكتابةٌ واحدةٌ في اليوم لوثيقةٍ واحدة تُقصّ على ٤٥ يومًا');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ الاستعمال نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
