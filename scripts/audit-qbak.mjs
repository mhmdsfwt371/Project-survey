/* ═══════════════════════════════════════════════════════════════════════════
   جردُ احتياطيِّ الطابور — node scripts/audit-qbak.mjs
   ───────────────────────────────────────────────────────────────────────────
   الزيارةُ التي لم تُرفَع تبقى في localStorage حيث يسقط المخزن: تُكتَب مع الحفظ بلا
   صور، وتُستعاد عند الإقلاع إلى الطابور وإلى مكانها، وتُمحى حين يُرفَع كلُّ شيء —
   ونقصُ النموذج صندوقٌ ثابتٌ أعلاه لا رسالةٌ تختفي.
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
w.FB.signIn = () => Promise.resolve({ ok:true, role:'supervisor', name:'عمار' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {}; w.tourMaybe = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234'; d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500); const toasts = []; w.toast = m => toasts.push(String(m));
w.STATE.meta.online = false;   /* بلا شبكةٍ في الميدان */
const id = 'NSK-MIN-CAM-0016';

console.log('\n══ ١ · النقصُ يُكتَب أعلى النموذج ══');
w.goPage('map'); w.render(1); await wait(60); w.popOpenAt(id, null); await wait(100);
[...d.getElementById('pkPop').querySelectorAll('button')].find(e => /نموذج المسح/.test(e.textContent)).dispatchEvent(new w.MouseEvent('click', { bubbles:true })); await wait(200);
Object.assign(w.FORM, { access:'تم الوصول', mount:'', power:'كهرباء شركة', chals:['لا توجد تحديات'], wid_m:'2', hgt_m:'3', fit:'نعم', note:'' });
w.FORM.photos = { site:{ data:'data:image/jpeg;base64,AAAA' }, mount:{ data:'data:image/jpeg;base64,AAAA' } };
w.svSave(); await wait(50);
const eb = d.getElementById('svErr');
T(!w.STATE.recs[id] && !!eb && /لم تُحفَظ الزيارة/.test(eb.textContent) && /نوع التركيب/.test(eb.textContent), 'نقصُ «نوع التركيب» صندوقٌ أحمرُ ثابتٌ أعلى النموذج — لا رسالةٌ تختفي');

console.log('\n══ ٢ · الحفظُ بلا شبكة: احتياطيٌّ في localStorage بلا صور ══');
w.FORM.mount = 'عمود'; w.FORM.photos.site.data = 'data:image/jpeg;base64,' + 'A'.repeat(9000);
w.svSave(); await wait(600);
const bak = JSON.parse(w.localStorage.getItem('nsk14.qbak') || '[]');
const item = bak.find(it => it.kind === 'recs' && it.id === id);
T(!!w.STATE.recs[id] && !!item && item.v.access === 'تم الوصول' && item.v.mount === 'عمود', 'الزيارةُ حُفظت وفي الاحتياطيِّ نسخةٌ منها');
T(JSON.stringify(bak).length < 20000 && !bak.some(it => it.kind === 'photos'), 'بلا صور — الاحتياطيُّ صغيرٌ يتّسع له localStorage');

console.log('\n══ ٣ · سقط المخزنُ وأُعيد التحميل: تعود من الاحتياطيّ ══');
delete w.STATE.recs[id]; w.STATE.queue.length = 0;
const n = w.CORE.qbakRestore();
T(n >= 1 && !!w.STATE.recs[id] && w.STATE.queue.some(q => q.kind === 'recs' && q.id === id), 'الزيارةُ عادت إلى مكانها وإلى الطابور: ' + n);
T(w.CORE.qbakRestore() === 0 && w.STATE.queue.filter(q => q.kind === 'recs' && q.id === id).length === 1, 'واستعادةٌ ثانيةٌ لا تكرّرها');

console.log('\n══ ٤ · رُفع كلُّ شيءٍ: يُمحى الاحتياطيّ ══');
w.STATE.queue.length = 0; w.CORE.saveLocal(); await wait(50);
T(!w.localStorage.getItem('nsk14.qbak'), 'الطابورُ فارغ — لا احتياطيَّ يبقى');

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ احتياطيِّ الطابور نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
