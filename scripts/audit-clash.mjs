/* ═══════════════════════════════════════════════════════════════════════════
   جردُ التعديل المتزامن — node scripts/audit-clash.mjs
   ───────────────────────────────────────────────────────────────────────────
   جهازان يكتبان على النقطة نفسِها: كان آخرُ من رفع يكسب بصمت. صار التصادمُ
   يُقال — عند وصول الوثيقة فوق تعديلٍ لم يُرفَع، وقبل الحفظ فوق ما سبقني
   إليه غيري — ولا يُبتلَع شيء. يُختبَر هنا الوصولُ والحفظُ والشارة.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + n); } };
const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 160)); });
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document; const wait = ms => new Promise(r => setTimeout(r, ms));
w.HTMLCanvasElement.prototype.getContext = () => null; if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }); w.scrollTo = () => {};
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'engineer', name:'مهندس' }); w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1600);
w.CORE.saveSoon = () => {}; w.photoFlush = () => {}; w.evFetch = () => {};
const toasts = []; const realToast = w.toast; w.toast = m => { toasts.push(String(m)); };
const me = w.STATE.meta.uid || 'me-uid'; w.STATE.meta.uid = me;
const site = w.STATE.sites[10];

console.log('\n══ ١ · وثيقةُ غيري تصل فوق تعديلٍ لم يُرفَع — يُقال ولا يُبتلَع ══');
{
  const n0 = w.notifStore().length;
  w.CORE.set('recs', site.id, { id:site.id, at:Date.now(), by:'مهندس', access:'تم الوصول', note:'تعديلي', _by:me, _at:Date.now() });
  T(w.STATE.queue.some(q => q.kind === 'recs' && q.id === site.id), 'تعديلي في الطابور لم يُرفَع بعد');
  w.CORE.applyDoc('recs', site.id, { id:site.id, at:Date.now(), by:'سالم', access:'تم الوصول', note:'تعديلُ سالم', _by:'other-uid', _byName:'سالم', _at:Date.now() + 10 });
  T(!!w.CLASH[site.id] && /سالم/.test(w.CLASH[site.id].by), 'التصادمُ يُسجَّل باسم من عدّل');
  T(w.notifStore().length === n0 + 1 && /تعديلٌ متزامن/.test(w.notifStore()[0].kind) && w.notifStore()[0].site === site.id, 'ويصل إشعارٌ مهمٌّ لصاحب الجهاز بالنقطة نفسِها');
  T(w.STATE.queue.some(q => q.kind === 'recs' && q.id === site.id), 'وتعديلي يبقى في الطابور — القرارُ لي لا للجهاز');
  w.POP_SITE = site.id;
  T(w.popHtml().indexOf('تعديلٌ متزامن') > -1, 'ونافذةُ النقطة تحمل شارةَ التصادم');
  const n1 = w.notifStore().length;
  w.CORE.applyDoc('recs', site.id, { id:site.id, note:'تعديلي المرفوع', _by:me, _at:Date.now() + 20 });
  T(w.notifStore().length === n1, 'ووثيقتي أنا حين تعود من السحابة لا تُعَدُّ تصادمًا');
  const other = w.STATE.sites[11]; const n2 = w.notifStore().length;
  w.CORE.applyDoc('recs', other.id, { id:other.id, note:'x', _by:'other-uid', _at:Date.now() });
  T(w.notifStore().length === n2 && !w.CLASH[other.id], 'ووثيقةُ غيري على نقطةٍ لا تعديلَ لي فيها تمرُّ بصمت');
}

console.log('\n══ ٢ · الحفظُ فوق ما سبقني إليه غيري يُطلَب فيه تأكيدٌ صريح ══');
{
  const s2 = w.STATE.sites[20];
  w.formGo(s2.id, 'new'); const opened = w.FORM.openedAt;
  T(opened > 0 && w.FORM.overwrite === false, 'لحظةُ الفتح تُختَم على النموذج');
  await wait(20);
  w.STATE.recs[s2.id] = { id:s2.id, at:Date.now(), by:'سالم', access:'تم الوصول', _by:'other-uid', _byName:'سالم', _at:Date.now() };
  Object.assign(w.FORM, { access:'تم الوصول', photos:{ site:{ data:'data:,a' }, mount:{ data:'data:,b' } }, mount:'عمود قائم', power:'كهرباء الموقع', chals:['لا توجد تحديات'], wid_m:4, hgt_m:3.5, fit:'مناسب', note:'زيارتي' });
  toasts.length = 0; w.svSave(0);
  T(/اضغط الحفظَ ثانيةً/.test(toasts[toasts.length - 1] || '') && w.STATE.recs[s2.id].note !== 'زيارتي', 'الحفظُ الأوّل يُوقَف ويُقال من سبقني');
  w.svSave(0);
  T(w.STATE.recs[s2.id].note === 'زيارتي', 'والحفظُ الثاني يكتب — قرارٌ صريح');
  const s3 = w.STATE.sites[21];
  w.formGo(s3.id, 'new'); await wait(20);
  w.STATE.recs[s3.id] = { id:s3.id, at:Date.now(), by:'مهندس', access:'تم الوصول', _by:me, _at:Date.now() };
  Object.assign(w.FORM, { access:'تم الوصول', photos:{ site:{ data:'data:,a' }, mount:{ data:'data:,b' } }, mount:'عمود قائم', power:'كهرباء الموقع', chals:['لا توجد تحديات'], wid_m:4, hgt_m:3.5, fit:'مناسب', note:'زيارتي أنا' });
  toasts.length = 0; w.svSave(0);
  T(w.STATE.recs[s3.id].note === 'زيارتي أنا', 'وما كتبتُه أنا بعد الفتح لا يوقفني');
}
w.toast = realToast;
T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs[0] : ''));
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ التعديل المتزامن نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
