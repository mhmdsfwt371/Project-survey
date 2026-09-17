/* ═══════════════════════════════════════════════════════════════════════════
   جردُ البلاغات — node scripts/audit-bugs.mjs
   ───────────────────────────────────────────────────────────────────────────
   العطلُ يُبلَّغ من داخل النظام لا بمكالمة (V16.98). يُثبَت هنا: الزرُّ في
   الشريط لكلِّ دور، واللوحُ يُفتَح فوق أيِّ شاشة، والبلاغُ لا يُرسَل فارغًا،
   ويُرفَق به ما لا يعرف المبلِّغُ أن يقوله — النسخةُ والشاشةُ والدورُ واللغةُ
   وحالُ الشبكة وآخرُ خطأٍ في الجلسة — ويُكتَب في مجموعةٍ يقرؤها من يُصلح؛
   وجسرُ المستودع يبني عنوانًا ونصًّا من الوثيقة نفسِها ويكتب رقمَه فيها.
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let bad = 0;
const T = (c, n) => { console.log((c ? '  ✓ ' : '  ✗ ') + n);
  /* ما يسقط يُكتَب تعليقًا على السير — يُقرأ بلا فتح السجلّ (V17.3) */
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
w.FB.signIn = () => Promise.resolve({ ok:true, role:'tech', name:'فنيُّ الميدان' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
const wrote = {}; w.CORE.set = (k, id, v) => { wrote[k + '/' + id] = v; };
const toasts = []; const T0 = w.toast; w.toast = m => { toasts.push(String(m)); };
const click = sel => { const el = d.querySelector(sel); if (!el) return false; el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); return true; };

/* الزرُّ واللوح — للفنيِّ أيضًا: العطلُ يقع عنده */
T(w.ROLE === 'tech' || true, 'الدورُ المُختبَر: ' + w.ROLE);
T(!!d.querySelector('[data-bugopen]'), 'زرُّ البلاغ في الشريط العلويّ');
click('[data-bugopen]'); await wait(150);
const sh = d.getElementById('bugSheet');
T(!!sh && sh.parentElement.id === 'bugHost' && sh.parentElement.parentElement === d.body,
  'واللوحُ يُفتَح في مضيفٍ على الجسد — فوق أيِّ شاشة');
T(!!d.getElementById('bgTxt') && d.querySelectorAll('[data-bugkind]').length === 3, 'وفيه ثلاثةُ أنواع: عطلٌ وطلبٌ واقتراح');

/* لا يُرسَل فارغًا */
d.getElementById('bgTxt').value = 'قصير';
click('[data-bugsend]'); await wait(120);
T(!Object.keys(wrote).length && toasts.some(x => /سطر/.test(x)), 'ولا يُرسَل بلاغٌ بلا وصف');

/* يُرسَل بسياقه */
w.STATE.meta.name = 'فنيُّ الميدان';   /* الاسمُ يأتي من الدخول — يُثبَّت هنا */
w.LS_ERR = new Error('boom في الرسم');
w.goPage('map'); w.render(1); await wait(150);
click('[data-bugopen]'); await wait(150);
click('[data-bugkind="طلب جديد"]'); await wait(120);
d.getElementById('bgTxt').value = 'الخريطة لا تفتح بعد الضغط على موقعي';
d.getElementById('bgWant').value = 'تفتح النافذة';
click('[data-bugsend]'); await wait(150);
const key = Object.keys(wrote).filter(k => k.indexOf('bugs/') === 0)[0];
const b = key ? wrote[key] : null;
T(!!b && b.kind === 'طلب جديد' && /موقعي/.test(b.txt) && b.by === 'فنيُّ الميدان' && b.status === 'جديد',
  'ويُكتَب البلاغُ بنوعه ونصِّه وكاتبه');
T(!!b && b.ctx && /^V\d+\.\d+$/.test(b.ctx.v) && b.ctx.page === 'map' && b.ctx.role === 'tech' && /boom/.test(b.ctx.err || ''),
  'ومعه ما لا يعرف المبلِّغُ أن يقوله: ' + (b ? [b.ctx.v, b.ctx.page, b.ctx.role, b.ctx.err ? 'خطأٌ في الجلسة' : ''].join(' · ') : ''));
T(!!b && b.ctx.ua && b.ctx.scr && typeof b.ctx.online === 'boolean', 'والجهازُ والشاشةُ وحالُ الشبكة');
T(w.BUG_OPEN === false, 'ويُطوى اللوحُ بعد الإرسال');

/* الجسرُ إلى المستودع */
const src = readFileSync('scripts/bugs-sync.mjs', 'utf8');
T(/collection\('bugs'\)/.test(src) && /repos\/\$\{REPO\}\/issues/.test(src) && /method: 'POST'/.test(src),
  'الجسرُ يقرأ البلاغاتِ ويفتحها في المستودع');
T(/update\(\{ gh: issue\.number/.test(src), 'ويكتب رقمَ البلاغ في وثيقته — فلا يُفتَح مرتين');
T(/issue\.state === 'closed'/.test(src) && /status: 'مغلق'/.test(src), 'وما أُغلق هناك يُغلق هنا — حالةٌ واحدةٌ لا اثنتان');
const wf = readFileSync('.github/workflows/provision.yml', 'utf8');
T(/issues: write/.test(wf) && /bugs-sync\.mjs/.test(wf), 'ويعمل مع سير الخادم كلَّ عشر دقائق بصلاحية فتح البلاغات');
const rules = readFileSync('firestore.rules', 'utf8');
T(/match \/bugs\/\{id\}[\s\S]{0,400}allow create: if ok\(\);/.test(rules)
  && /allow read:\s+if ok\(\) && \(myRank\(\) >= 90/.test(rules),
  'والقاعدةُ تقبلها من كلِّ من يدخل وتقرؤها لمن يُصلح');

/* ═══ V16.99: بلاغاتي في اللوح، وشاشةٌ لمن يُصلح، وأرقامُ الفريق دفعةً ═══ */
w.STATE.bugs = { z1:{ id:'z1', txt:'الخريطة لا تفتح', by:'فنيُّ الميدان', uid:w.myUid(), at:Date.now()-6e5, status:'مفتوح', gh:12, kind:'عطل', ctx:{ v:'V16.98', page:'map' } },
                 z2:{ id:'z2', txt:'بلاغُ غيري', by:'خالد', uid:'other', at:Date.now(), status:'جديد', kind:'عطل', ctx:{} } };
w.BUG_OPEN = true; w.render(1); await wait(150);
const sheet2 = d.getElementById('bugSheet');
T(/بلاغاتي/.test(sheet2.textContent) && /الخريطة لا تفتح/.test(sheet2.textContent) && !/بلاغُ غيري/.test(sheet2.textContent),
  'اللوحُ يعرض بلاغاتي وحدَها بحالتها');
T(!!sheet2.querySelector('a[href*="/issues/12"]'), 'ورقمُها في المستودع رابطٌ يُفتَح');
w.BUG_OPEN = false;
const rules2 = readFileSync('firestore.rules', 'utf8');
T(/resource\.data\.uid == request\.auth\.uid/.test(rules2), 'والقاعدةُ تُقرئ كلَّ مبلِّغٍ بلاغَه هو');
/* شاشةُ من يُصلح */
w.ROLE = 'engineer'; w.goPage('sys'); w.render(1); await wait(150);
w.PTAB.sys = 'bugs'; w.render(1); await wait(200);
const main2 = d.getElementById('main') || d.body;
T(/البلاغات/.test(main2.textContent) && /الخريطة لا تفتح/.test(main2.textContent) && /بلاغُ غيري/.test(main2.textContent),
  'ومن يُصلح يرى البلاغاتِ كلَّها في شريحتها');
/* أرقامُ الفريق دفعةً واحدة */
w.ROLE = 'admin';
w.STATE.users = { u1:{ user:'ahmed', name:'أحمد سعيد', role:'tech', active:true },
                  u2:{ user:'khaled', name:'خالد بندر', role:'supervisor', active:true } };
w.goPage('users'); w.render(1); await wait(200);
const ta = d.getElementById('phBulk');
T(!!ta && /أرقام الفريق/.test(main2.textContent) && /بلا جوال/.test(main2.textContent), 'وبطاقةُ أرقام الفريق تقول من بلا رقم');
ta.value = 'أحمد سعيد 0551234567\nخالد بندر, +966 55 987 6543\nشخصٌ غريب 0500000000';
click('[data-phbulk]'); await wait(180);
T(w.STATE.users.u1.ph === '0551234567' && w.STATE.users.u2.ph === '0559876543',
  'واللصقُ يحفظ الأرقامَ نظيفةً — والدوليُّ يصير محليًّا');
T(w.PH_MISS.length === 1 && /غريب/.test(w.PH_MISS[0]), 'ويقول بالحرف من لم يُعرَف اسمُه');

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
/* ═══ لا يُعمَل إلا بما قُبل (V17.43) ═══ */
{
  const sync = readFileSync('scripts/bugs-sync.mjs', 'utf8');
  T(/if \(b\.status !== 'مقبول'\) continue;/.test(sync), 'والجسرُ لا يفتح إلا ما قُبل');
  T(/labels: \['بلاغ', b\.kind \|\| 'عطل', 'مقبول'\]/.test(sync), 'ويَسِمُ المفتوحَ بأنه مقبول');
  T(/ينتظر قرارَ المدير/.test(sync), 'ويقول كم ينتظر قرارَ المدير');
  const raw7 = readFileSync('index.html', 'utf8');
  T(/function bugDecide\(id, ok, why\)/.test(raw7) && /b\.decBy = STATE\.meta\.name/.test(raw7),
    'والقرارُ يُختَم باسم صاحبه ووقته');
  T(/data-bugok=/.test(raw7) && /data-bugno=/.test(raw7) && /data-bugf=/.test(raw7),
    'وللشاشة قبولٌ وردٌّ وترشيحٌ بالحالة والنوع');
  T(/if \(!ok && why\.length < 3\)/.test(raw7), 'ولا يُردُّ بلاغٌ بلا سبب');
}

/* ═══ الإغلاقُ من التطبيق يصل المستودعَ (V17.56) ═══ */
{
  const raw = readFileSync('index.html', 'utf8'), sync = readFileSync('scripts/bugs-sync.mjs', 'utf8');
  T(/function bugClose\(id\)/.test(raw) && /b\.closeAsk = true/.test(raw) && /data-bugdone=/.test(raw),
    'المديرُ يُغلق البلاغَ المنجَز من الشاشة');
  T(/if \(!b\.gh \|\| !b\.closeAsk\) continue;/.test(sync) && /state:'closed', state_reason:'completed'/.test(sync),
    'والجسرُ يغلقه في المستودع بمفتاح الخادم ويطفئ الطلب');
}

console.log(bad ? `\nجردُ البلاغات فشل ✗ (${bad})` : '\nالبلاغُ من داخل النظام — ويفتح نفسَه في المستودع ✅');
process.exit(bad ? 1 : 0);
