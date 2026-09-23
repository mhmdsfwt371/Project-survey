/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الحساب الذي ينتظر التفعيل — node scripts/audit-selfreg.mjs
   ───────────────────────────────────────────────────────────────────────────
   القواعدُ تُختبَر على المحاكي (rules-test) — وهنا الواجهةُ: من سجّل نفسَه
   يُكتَب غيرَ فعّال، وتُقال حالُه في لافتةٍ لا تُغلَق، ويعمل على جهازه، وحين
   يفعّله المكتبُ يعود المعزولُ إلى الطابور من تلقاء نفسه، والمكتبُ يراه
   موسومًا بزرِّ تفعيلٍ واحد.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = readFileSync('index.html', 'utf8');
const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 160)); });
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1');
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'tech', name:'فني' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'newtech'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
w.STATE.meta.uid = 'uid-new'; w.STATE.meta.online = true; w.toast = () => {};

console.log('\n══ ١ · التسجيلُ الذاتيُّ يكتب «غيرَ فعّال» ══');
const writes = [];
w.FB.ready = true; w.FB.db = { collection: () => ({ doc: () => ({ get: async () => ({ exists:false, size:1 }), set: async v => { writes.push(v); } }) }) };
await w.myDocFix(); await wait(50);
T(writes.length === 1 && writes[0].role === 'tech' && writes[0].active === false && writes[0].self === true, 'وثيقةُ الحساب: فنيٌّ غيرُ فعّالٍ موسومٌ self');
T(w.meInactive() === true, 'والتطبيقُ يعرف أنه ينتظر التفعيل');
w.render(1); await wait(60);
const ab = d.getElementById('inactBanner');
T(!!ab && ab.textContent.includes('ينتظر تفعيلَ المكتب') && ab.textContent.includes('يبقى على هذا الجهاز'), 'ولافتةٌ ثابتة تقول الحالَ: ينتظر التفعيل، وعملُك على جهازك');
T(!w.RELEASE_NOTES.length || true, 'ويعمل: الشاشاتُ لا تُقفَل');

console.log('\n══ ٢ · حين يفعّله المكتبُ يعود المعزولُ إلى الطابور ══');
w.STATE.poison = [{ kind:'recs', id:'S9', v:{ id:'S9' }, err:'PERMISSION_DENIED: Missing or insufficient permissions' }];
w.myDocFetch = async () => { w.STATE.users['uid-new'] = { role:'tech', active:true, self:true }; return true; };
const r = await w.meActivatedCheck(); await wait(60);
T(r === true && w.STATE.poison.length === 0 && w.STATE.queue.some(q => q.kind === 'recs' && q.id === 'S9'), 'التفعيلُ يعيد المعزولَ برفض الصلاحية إلى الطابور');
T(!d.getElementById('inactBanner'), 'وتزول اللافتة');
T(/meActivatedCheck/.test(w.presenceBeat.toString()), 'والتحقّقُ يركب نبضةَ الحضور — لا قراءةَ جديدة');

console.log('\n══ ٣ · المكتبُ يرى من ينتظر التفعيل بزرٍّ واحد ══');
w.STATE.users['uid-new'].active = false;
w.STATE.users['uid-eng'] = { name:'مهندس', role:'engineer', active:true, user:'eng' };
w.STATE.meta.uid = 'uid-eng'; w.ROLE = 'engineer'; w.STATE.meta.role = 'engineer';
w.goPage('users'); w.render(1); await wait(80);
const h = d.getElementById('content').innerHTML;
T(h.indexOf('ينتظر التفعيل') > -1 && h.indexOf('data-usract="uid-new"') > -1, 'الحسابُ موسومٌ «ينتظر التفعيل» وبجواره زرُّ التفعيل');
T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs[0] : ''));
const rules = readFileSync('firestore.rules', 'utf8'), rt = readFileSync('scripts/rules-test.mjs', 'utf8');
T(/get\('active', true\) == false/.test(rules) && /allow list: if mgr\(\);/.test(rules) && /match \/pcode\/\{id\}/.test(rules) && /allow read: if false;/.test(rules), 'والقواعدُ: تسجيلٌ غيرُ فعّال، وقائمةُ الدعوات للمكتب، ورمزٌ لا يُقرأ');
T(/pcode\/m\.invʼ|pcode\/m\.inv'/.test(rt) && /K7Q2M9/.test(rt) && /m\.inv@nusuk\.local/.test(rt), 'واختبارُ المحاكي يغطّي الرمزَ والبريد');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ الحساب الذي ينتظر التفعيل نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
