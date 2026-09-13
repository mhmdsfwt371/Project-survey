/* ═══════════════════════════════════════════════════════════════════════════
   جردُ بلاغ اليوم — node scripts/audit-briefing.mjs
   ───────────────────────────────────────────────────────────────────────────
   المتابعةُ اليوميةُ كانت مكالماتٍ والأرقامُ في الهاتف لا في النظام (V16.97).
   يُثبَت هنا: الجوالُ يُكتَب ويُقرأ من صفِّ الحساب؛ وجدولُ البلاغ يعرف لكلِّ
   عضوٍ ما عليه اليومَ وما أنجزه وما عليه من مهامِّ الاجتماع؛ والرسالةُ تُبنى
   بأسماء النقاط ورابطِ التطبيق؛ وواتساب يُفتَح على رقمه بالصيغة الدولية؛
   ومن بلا جوالٍ يُقال له ذلك لا يُترَك صامتًا.
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
w.FB.signIn = () => Promise.resolve({ ok:true, role:'admin', name:'مدير' });
w.FB.legacyDone = () => true; w.pullDelta = () => Promise.resolve(0); w.liveWatch = () => {}; w.liveSmall = () => {};
d.getElementById('lgU').value = 'x'; d.getElementById('lgP').value = 'TestPass1234';
d.getElementById('lgGo').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await wait(1500);
const wrote = {}; w.CORE.set = (k, id, v) => { wrote[k + '/' + id] = v; };
const opened = []; w.open = (u) => { opened.push(u); return null; };
const click = sel => { const el = d.querySelector(sel); if (!el) return false; el.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); return true; };

/* أعضاءٌ وإسنادٌ وإنجازٌ اليوم */
w.STATE.users = {
  u1:{ user:'ahmed', name:'أحمد سعيد', role:'tech', active:true, ph:'0551234567' },
  u2:{ user:'khaled', name:'خالد بندر', role:'supervisor', active:true },
  u3:{ user:'exec1', name:'شعراوي', role:'exec', active:true, ph:'0500000000' }
};
w.STATE.sites = [{ id:'S1', name:'مخيم ١', zone:'منى', type:'مخيم', lat:21.41, lng:39.89 }, { id:'S2', name:'ممر ٢', zone:'منى', type:'ممر', lat:21.41, lng:39.89 }];
w.STATE.tasks = { t1:{ site:'S1', to:'أحمد سعيد', kind:'survey', status:'مُسند' }, t2:{ site:'S2', to:'أحمد سعيد', kind:'install', status:'مُسند' }, t3:{ site:'S1', to:'خالد بندر', kind:'survey', status:'مُسند' } };
w.STATE.recs = { S1:{ by:'أحمد سعيد', at:Date.now(), st:'تمت الزيارة' } };
w.STATE.wtask = { rows:[{ id:1, n:'كابل', who:'خالد بندر', st:'جاري العمل' }] };

const R = w.briefingRows();
T(R.length === 2 && !R.some(x => x.role === 'exec'), 'الجدولُ يضمُّ الميدانَ لا الإدارةَ العليا: ' + R.map(x => x.name).join(' · '));
const a = R.find(x => x.name === 'أحمد سعيد'), k = R.find(x => x.name === 'خالد بندر');
T(a.open === 2 && a.asn.survey.length === 1 && a.asn.install.length === 1 && a.done === 1, 'لكلِّ عضوٍ ما عليه اليومَ بنوعه وما أنجزه');
T(k.open === 1 && k.done === 0 && k.wt === 1 && k.ph === '', 'ومن لم يبدأ ومن بلا جوالٍ ومن عليه مهامُّ اجتماعٍ يُعرَفون');

/* الرسالة */
const txt = w.briefingText(a);
T(/أحمد سعيد/.test(txt) && /S1/.test(txt) && /مخيم ١/.test(txt) && /S2/.test(txt) && /github\.io\/Project-survey/.test(txt),
  'الرسالةُ بالاسم والنقاط بأسمائها ورابط التطبيق');
T(/لا إسنادَ عليك اليوم/.test(w.briefingText({ name:'x', asn:{ survey:[], install:[], dis:[] }, open:0, wt:0 })), 'ومن لا إسنادَ عليه تقول له ذلك بدل الصمت');

/* الشاشة */
w.goPage('perf'); w.render(1); await wait(150);
w.PTAB.perf = 'crewman'; w.render(1); await wait(200);
const main = d.getElementById('main') || d.body;
T(/بلاغ اليوم عبر واتساب/.test(main.textContent), 'البطاقةُ أوّلَ شريحة «الفرق»');
T(!!main.querySelector('[data-brief="u1"]') && main.querySelector('[data-brief="u2"]').hasAttribute('disabled'), 'زرٌّ لكلِّ عضو — ومعطَّلٌ لمن بلا جوال');
T(/بلا جوال/.test(main.textContent) && /لم يبدأ/.test(main.textContent), 'والجدولُ يقول بلا جوال ولم يبدأ بالكلمة');
click('[data-brief="u1"]'); await wait(100);
T(opened.length === 1 && /wa\.me\/966551234567\?text=/.test(opened[0]) && decodeURIComponent(opened[0]).indexOf('مخيم ١') > -1,
  'وضغطةُ واتساب تفتح رقمَه بالصيغة الدولية والرسالةَ كاملة');
opened.length = 0; w.briefingSend('u2');
T(opened.length === 0, 'ومن بلا جوالٍ لا يُفتَح له شيءٌ — ويُقال له');

/* الجوالُ من صفِّ الحساب */
w.goPage('users'); w.render(1); await wait(150);
w.USR_EDIT = 'u2'; w.render(1); await wait(150);
const ph = d.querySelector('[data-usrph="u2"]');
T(!!ph, 'حقلُ الجوال في صفِّ تحرير الحساب');
ph.value = '05 5987 6543';
const nEl = d.querySelector('[data-usrn="u2"]'); if (nEl) nEl.value = 'خالد بندر';
click('[data-usrsave="u2"]'); await wait(150);
T(w.STATE.users.u2.ph === '0559876543' && wrote['users/u2'] && wrote['users/u2'].ph === '0559876543', 'يُحفَظ على الحساب رقمًا نظيفًا ويُزامَن');
w.USR_EDIT = ''; w.render(1); await wait(120);
T(/0559876543/.test(main.textContent), 'ويُعرَض في الصفِّ بعد الحفظ');

T(errs.length === 0, 'بلا أخطاءِ متصفّح' + (errs.length ? ': ' + errs.slice(0, 2).join(' | ') : ''));
console.log(bad ? `\nجردُ بلاغ اليوم فشل ✗ (${bad})` : '\nبلاغُ اليوم: رقمٌ في النظام ورسالةٌ جاهزةٌ لكلِّ عضو ✅');
process.exit(bad ? 1 : 0);
