/* ═══════════════════════════════════════════════════════════════════════════
   جردُ تسرُّبِ النقاط — node scripts/audit-site-bleed.mjs
   ───────────────────────────────────────────────────────────────────────────
   صورُ ممراتٍ ومخيماتٍ في منى صعدت إلى مخيمٍ في عرفات (V17.22). السببُ أن
   نموذجَ المسح كائنٌ واحدٌ يُعاد استعمالُه لكلِّ نقطة، وتبديلُ النقطة كان
   يكتب معرِّفَها ولا يمسح صورَ ما قبلها — فمن صوّر نقطةً ولم يحفظ ثم فتح
   غيرَها وحفظ، ذهبت الصورُ إلى الثانية. ولأن العطلَ من هذا النوع لا يُرى إلا
   بعد أن يُفسد البيانات، يُفحَص هنا على **كلِّ نقاط السجل** لا على عيّنة:
     ١ · الضغطُ على نقطةٍ يفتحها هي — النافذةُ تحمل معرِّفَها ونموذجُها كذلك.
     ٢ · وحفظُ الزيارة يكتب على معرِّفها وحدَه، ولا يمسُّ جارتَها.
     ٣ · وصورُ النموذج تُنسَب إلى نقطتها، ولا تتبع من تركها.
     ٤ · وتبديلُ النقطة قبل الحفظ يمسح ما لم يُحفَظ — لا يورّثه.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n);
  if (!c){ bad++; console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { const m = String(e.message || e); if (!/getContext|canvas/i.test(m)) errs.push(m.slice(0, 140)); });
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
w.scrollTo = () => {};
await wait(900);
w.FB.signIn = () => Promise.resolve({ ok:true, role:'supervisor', name:'مشرفُ الفحص' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1600);
w.STATE.meta.name = 'مشرفُ الفحص';
const wrote = [];
w.CORE.set = (k, id, v) => { wrote.push({ k, id, v }); (w.STATE[k] = w.STATE[k] || {})[id] = v; };
w.CORE.dirty = () => {}; w.CORE.saveSoon = () => {};
w.notifPush = () => {}; w.stepDone = () => {};

/* ═══ ١ · كلُّ نقطةٍ تُفتَح على نفسها ═══ */
const ALL = w.STATE.sites || [];
T(ALL.length > 1000, 'السجلُّ محمَّلٌ كاملًا: ' + w.nm(ALL.length) + ' نقطة');
let popBad = [], formBad = [];
for (const x of ALL){
  w.POP_SITE = x.id; w.POP_OPEN = true;
  const html = w.popHtml(x);
  if (!html || html.indexOf(x.id) < 0) popBad.push(x.id);
  w.formGo(x.id);
  if (w.FORM.site !== x.id) formBad.push(x.id);
  if (popBad.length > 3 || formBad.length > 3) break;
}
T(popBad.length === 0, 'ونافذةُ كلِّ نقطةٍ تحمل معرِّفَها' + (popBad.length ? ' — خالف: ' + popBad.join(' · ') : ''));
T(formBad.length === 0, 'ونموذجُها يفتح عليها' + (formBad.length ? ' — خالف: ' + formBad.join(' · ') : ''));
w.POP_OPEN = false;

/* ═══ ٢ · الصورُ لا تتبع من تركها ═══ */
const A = ALL.find(s => s.zone === 'منى') || ALL[0];
const B = ALL.find(s => s.zone === 'عرفات' && s.id !== A.id) || ALL[1];
T(!!A && !!B && A.id !== B.id, 'نقطتان من مشعرين: ' + A.id + ' · ' + B.id);
w.formGo(A.id);
w.FORM.photos = { site:{ data:'data:image/jpeg;base64,AAA' }, mount:{ data:'data:image/jpeg;base64,BBB' } };
w.FORM.access = 'تم الوصول'; w.FORM.note = 'صورٌ لنقطة منى';
T(Object.keys(w.FORM.photos).length === 2, 'صُوِّرت الأولى ولم تُحفَظ');
w.formGo(B.id);                                   /* تبديلُ النقطة قبل الحفظ */
T(Object.keys(w.FORM.photos).length === 0, 'فإذا فُتحت نقطةٌ أخرى لم تُورَّث صورُ الأولى');
T(w.FORM.note === '' && w.FORM.access === 'تم الوصول', 'ولا تُورَّث ملاحظتُها ولا حقولُها');

/* ═══ ٣ · الحفظُ يكتب على نقطته وحدَها ═══ */
w.PHOTO_Q.length = 0; wrote.length = 0;
w.formGo(B.id);
/* النموذجُ لا يُحفَظ ناقصًا — تُملأ شروطُه كما يملؤها الفنيّ */
Object.assign(w.FORM, { access:'تم الوصول', mount:'عمود', power:'طاقة شمسية',
  wid_m:4, hgt_m:3, fit:'مناسب', chals:['لا توجد تحديات'], note:'زيارةُ عرفات' });
w.FORM.photos = { site:{ data:'data:image/jpeg;base64,CCC' }, mount:{ data:'data:image/jpeg;base64,DDD' } };
w.svSave();
const recs = wrote.filter(x => x.k === 'recs');
T(recs.length === 1 && recs[0].id === B.id, 'حفظُ الزيارة يكتب على نقطته وحدَها: ' + recs.map(x => x.id).join(','));
T(w.PHOTO_Q.every(q => q.site === B.id), 'وصورُه تُنسَب إليه: ' + [...new Set(w.PHOTO_Q.map(q => q.site))].join(','));
T(!w.STATE.recs[A.id] || !w.STATE.recs[A.id].note || w.STATE.recs[A.id].note !== 'زيارةُ عرفات', 'ولا يمسُّ جارتَه');
T(Object.keys(w.FORM.photos).length === 0, 'والنموذجُ يُفرَّغ بعد الحفظ فلا يورَّث ما بعده');

/* ═══ ٤ · رقمُ الصورة لا يتصادم بين نقطتين ═══ */
w.PHOTO_Q.length = 0;
w.STATE.photos = { [A.id + '-1']:{ site:A.id, seq:1 }, [B.id + '-1']:{ site:B.id, seq:1 } };
T(w.photoNext(A.id) === 2 && w.photoNext(B.id) === 2, 'ورقمُ الصورة يُحسَب لكلِّ نقطةٍ على حدة');
w.photoQueue(A.id, 'site', 'data:image/jpeg;base64,DDD');
T(w.photoNext(B.id) === 2, 'وصورةٌ في نقطةٍ لا تزيد رقمَ الأخرى');

/* ═══ ٥ · القاعدةُ في الشيفرة: لا تبديلَ نقطةٍ بلا مسحٍ ═══ */
const raw = readFileSync('index.html', 'utf8');
const js = /<script[^>]*>([\s\S]*?)<\/script>/.exec(raw)[1];
T((js.match(/FORM\.site = (?!id;)/g) || []).length === 0,
  'ولا موضعَ يكتب نقطةَ النموذج مباشرةً — كلُّها تمرُّ بـformGo');

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
console.log(bad ? `\nجردُ تسرُّبِ النقاط فشل ✗ (${bad})` : '\nكلُّ نقطةٍ تُفتَح على نفسها، وما يُكتَب فيها لا يتسرّب إلى غيرها ✅');
process.exit(bad ? 1 : 0);
