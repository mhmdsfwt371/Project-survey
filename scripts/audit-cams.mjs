/* ═══════════════════════════════════════════════════════════════════════════
   جردُ عائلة كاميرات الوزارة — node scripts/audit-cams.mjs
   ───────────────────────────────────────────────────────────────────────────
   التسميةُ واحدةٌ مصحَّحة (والخطأُ الإملائيُّ في السجلِّ يُردُّ عند التحميل)، وLPR
   من العائلة، والفرعُ (ثابتة/متحرّكة) من اسم النقطة ويُصحَّح من نافذتها فيغلب،
   والوزنُ المكتوبُ بالتسمية القديمة يُقرأ، وجدولُ المتاح والتصديرُ يحملان الفرع.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
w.localStorage.setItem('nsk14.tour.x', '1'); await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); w.toast = () => {}; const wrote = []; w.CORE.set = (k, id, v) => { wrote.push([k, id, v]); };

console.log('\n══ ١ · التسميات ══');
T(w.CAT_DEF['كاميرا'].l === 'كاميرات الوزارة' && w.CAT_DEF['LPR'].l === 'كاميرات الوزارة — LPR', 'العائلةُ: «كاميرات الوزارة» و«كاميرات الوزارة — LPR»');
w.STATE.types = { 'كاميرا':{ l:'كاميرات فالوزارة', i:'x', c:'#000' }, 'LPR':{ l:'كاميرات قراءة اللوحات', i:'y', c:'#111' } }; w.TYPES_NORM = null; w.typesList();
T(w.CAT_DEF['كاميرا'].l === 'كاميرات الوزارة' && w.CAT_DEF['LPR'].l === 'كاميرات الوزارة — LPR', 'والخطأُ الإملائيُّ والتسميةُ القديمةُ في السجلِّ السحابيِّ تُردّان عند التحميل');
w.STATE.types = { 'LPR':{ l:'كاميرات الوزارة — LPR' } }; w.TYPES_NORM = null; w.typesList();
T(w.CAT_DEF['LPR'].i && w.CAT_DEF['LPR'].i !== 'undefined' && /^#/.test(w.CAT_DEF['LPR'].c), 'ومدخلٌ بتسميةٍ وحدَها يُكمَل رمزُه ولونُه من الأصل — لا «undefined» (V20.1)');

console.log('\n══ ٢ · الفرع ══');
const cams = w.STATE.sites.filter(x => x.type === 'كاميرا'), ptz = cams.filter(x => w.camKind(x) === 'PTZ'), bul = cams.filter(x => w.camKind(x) === 'Bullet');
T(cams.length >= 50 && ptz.length >= 5 && ptz.length + bul.length === cams.length && ptz.every(x => /PTZ/i.test(x.name)), 'من اسم النقطة: ' + bul.length + ' ثابتة و' + ptz.length + ' متحرّكة من ' + cams.length);
T(w.camKind({ type:'LPR' }) === 'LPR' && w.camKind({ type:'مخيم' }) === '', 'وLPR فرعٌ من العائلة، وغيرُ الكاميرا بلا فرع');
const x0 = bul[0];
w.goPage('map'); w.render(1); await wait(80); w.popOpenAt(x0.id, null); await wait(120);
const sel = d.querySelector('[data-camkind="' + x0.id + '"]');
T(!!sel && /ثابتة/.test(d.getElementById('pkPop').textContent), 'نافذةُ النقطة تقول الفرعَ وفيها تصحيحُه للمهندس');
sel.value = 'PTZ'; sel.dispatchEvent(new w.Event('change', { bubbles:true })); await wait(60);
T(w.camKind(w.siteFind(x0.id)) === 'PTZ' && wrote.some(r => r[0] === 'sites' && r[1] === x0.id && r[2].cam === 'PTZ'), 'والتصحيحُ تجاوزٌ في وثيقة الموقع يغلب الاسم');

console.log('\n══ ٣ · الوزنُ والإحصاءُ والتصدير ══');
w.CFG.w = { 'منى|كاميرات فالوزارة':1, 'عرفات|كاميرات LPR':1 };
T(w.cfgGet('w', 'منى|كاميرات الوزارة') === 1 && w.cfgGet('w', 'عرفات|كاميرات الوزارة — LPR') === 1, 'الوزنُ المكتوبُ بالتسمية القديمة يُقرأ للجديدة');
w.POP_OPEN = false; w.POP_SITE = null; w.goPage('req'); w.render(1); await wait(60); const b = d.querySelector('[data-ptab="req:assign"]'); if (b){ b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(150); }
const tx = d.getElementById('content').textContent;
T(/كاميرات الوزارة/.test(tx) && /ثابتة \(Bullet\)/.test(tx) && /متحرّكة \(PTZ\)/.test(tx), 'جدولُ المتاح يعرض الفرعين تحت كاميرات الوزارة');
const g = w.geoJsonBuild(), f = g.features.find(o => o.id === ptz[0].id);
T(f && f.properties.camera_kind === 'PTZ' && g.features.find(o => o.properties.type === 'مخيم').properties.camera_kind === null, 'والتصديرُ يحمل camera_kind');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ كاميرات الوزارة نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
