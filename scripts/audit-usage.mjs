/* ═══════════════════════════════════════════════════════════════════════════
   جردُ استعمال الصفحات والقراءات — node scripts/audit-usage.mjs
   ───────────────────────────────────────────────────────────────────────────
   فتحُ الصفحات يُعَدُّ محليًّا ويركب نبضةَ الحضور نفسَها؛ النبضُ الصباحيُّ يجمعه
   عبر الأجهزة في وثيقةٍ واحدةٍ مرةً في اليوم؛ والبطاقةُ تجمع الثلاثين يومًا
   وتقيس قراءاتِ اليوم على الحصة — بلا كتابةٍ جديدةٍ من الجهاز ولا مستمع.
   ═════════════════════════════════════════════════════════════════════════ */
import './lib/jsdom-dict.cjs';   /* القاموسُ في نافذة الفحص بعد فصله (V21.6) */
import { appHtml } from './lib/src.mjs';   /* (V38.39) the whole app in production order — index.html is now the core only */
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = [];
const T = (c, n) => { if (c){ pass++; console.log('  \u2713 ' + n); } else { fails.push(n); console.log('  \u2717 ' + n); console.log('::error title=فحصٌ ساقط::' + String(n).replace(/[\r\n]+/g, ' ')); } };
const html = (await appHtml());

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
const today = new Date(Date.now() + 10800000).toISOString().slice(0, 10);
w.STATE.presence = { a:{ day:today, rd:20000 }, b:{ day:today, rd:16000 }, c:{ day:'2020-01-01', rd:99999 } };
const rt = w.readsToday();
T(rt.reads === 36000 && rt.devices === 2, 'قراءاتُ اليوم من نبضات اليوم وحدَها: ٣٦٠٠٠ على جهازين');
const dK = n => new Date((Date.now() - n * 864e5) + 10800000).toISOString().slice(0, 10);
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

/* (V38.81) cost job: clock hours, so each billing day is exactly Google's */
const uc = readFileSync('scripts/usage-cost.mjs', 'utf8');
T(/const END = new Date\(Math\.floor\(Date\.now\(\) \/ 3600000\) \* 3600000\)/.test(uc) && /'interval\.endTime': END/.test(uc) && !/'86400s'/.test(uc),
  'مهمّةُ التكلفة تقرأ ساعاتٍ على رأس الساعة — فكلُّ يومِ فوترةٍ هو يومُ جوجل بالضبط');
T((uc.match(/doc\('cost'\)\.set\(/g) || []).length === 1 && /merge: false/.test(uc) && /trim\(120\)/.test(uc),
  'وكتابةٌ واحدةٌ لوثيقة التكلفة في كلِّ تشغيل، وسجلُّ الأجهزة يُقصّ على ١٢٠ يومًا');

/* (V38.84) the server's reads by job, the photo bridge's waste, and the page log per device per day */
{
  const { countReads, readsAdd } = await import('./lib/reads.mjs');
  const tmp = '/tmp/nusuk-reads-audit.json'; try { (await import('fs')).unlinkSync(tmp); } catch {}
  readsAdd(tmp, 'photos', '2026-10-22', 300); const m = readsAdd(tmp, 'photos', '2026-10-22', 5);
  T(m.photos['2026-10-22'] === 305, 'عدّادُ المهمّة يجمع عملياتِها في الملف المؤقّت يومًا بيوم (٣٠٠ + ٥)');
  class Q { async get(){ return { size: this.n || 0 }; } } class Dc { async get(){ return {}; } } class Fs { async getAll(...a){ return a; } }
  const st = countReads({ firestore: Object.assign(() => ({}), { Query:Q, DocumentReference:Dc, Firestore:Fs }) }, 'audit');
  const q = new Q(); q.n = 120; await q.get(); await new Q().get(); await new Dc().get(); await new Fs().getAll(1, 2);
  T(st.n === 120 + 1 + 1 + 2, 'ويعدّ الاستعلامَ بوثائقه (والفارغَ قراءةً)، والوثيقةَ، وgetAll — ' + st.n);
  const lib = readFileSync('scripts/lib/reads.mjs', 'utf8'), fl = readFileSync('scripts/reads-flush.mjs', 'utf8');
  T(/process\.on\('exit'/.test(lib) && /FieldValue\.increment/.test(fl) && /doc\('jobreads'\)/.test(fl), 'ويُضاف عند الخروج، ويُرفَع بزيادةٍ إلى settings/jobreads');
  const jobsScripts = ['backup', 'bugs-sync', 'devices', 'ministry-report', 'myafaqy-bridge', 'photos-sync', 'provision', 'pulse', 'report-system', 'season-seed', 'sysreport-write', 'usage-cost', 'weekly-pack'];
  const bare = jobsScripts.filter(f => { const x = readFileSync('scripts/' + f + '.mjs', 'utf8'); return !/from '\.\/lib\/reads\.mjs'/.test(x) || !/countReads\(admin, '[a-z]+'\)/.test(x); });
  T(!bare.length, 'كلُّ مهمّةٍ تقرأ القاعدةَ تعدّ قراءاتِها (' + jobsScripts.length + ')' + (bare.length ? ' — ناقص: ' + bare.join(' · ') : ''));
  const wfs = ['provision', 'provision-on-push', 'myafaqy', 'ministry', 'backup', 'devices', 'pulse', 'report', 'usage-cost', 'season'];
  const noFlush = wfs.filter(f => !/if: always\(\)\n\s+env:\n\s+FIREBASE_SERVICE_ACCOUNT: \$\{\{ secrets\.FIREBASE_SERVICE_ACCOUNT \}\}\n\s+run: node scripts\/reads-flush\.mjs/.test(readFileSync('.github/workflows/' + f + '.yml', 'utf8')));
  T(!noFlush.length, 'وكلُّ سيرٍ يشغّلها يرفع العدّادَ في آخره ولو تعثّر (' + wfs.length + ')' + (noFlush.length ? ' — ناقص: ' + noFlush.join(' · ') : ''));
  const ps = readFileSync('scripts/photos-sync.mjs', 'utf8');
  T(/doc\('photosShare'\)/.test(ps) && /if \(sh\.done\) throw/.test(ps) && /startAfter\(sh\.cursor\)/.test(ps) && /shared: true, data: admin\.firestore\.FieldValue\.delete\(\)/.test(ps),
    'نقلُ الصور لا يعيد قراءةَ ٣٠٠ صورةٍ منقولةٍ كلَّ دورة: مرورٌ واحدٌ بمؤشّرٍ ثم يُختَم، والجديدةُ تُوسَم مشارَكةً عند رفعها');
  const uc = readFileSync('scripts/usage-cost.mjs', 'utf8');
  T(/doc\('jobreads'\)/.test(uc) && /jobs \}, \{ merge: false \}/.test(uc) && /pgh_\[A-Za-z0-9\]\{1,16\}/.test(uc) && /Math\.max\(\+cur\[pg\] \|\| 0, usageNow\[day\]\[pg\]\)/.test(uc),
    'ومهمّةُ التكلفة تسمّي المهامَّ في settings/cost، وتجمع صفحاتِ كلِّ جهازٍ يومًا بيوم في settings/usage بالأكبر لا بالأحدث');
  T(/o\[pg\] = Math\.max\(\+cur\[pg\] \|\| 0, \+usage\.days\[day\]\[pg\] \|\| 0\)/.test(pl), 'والنبضُ الصباحيُّ يدمج اليومَ بالأكبر — لا يستبدله بمجموعٍ أصغر');
}

/* (V38.88) the registry published as one string, the previous copy kept, after every promotion */
{
  const rp = readFileSync('scripts/reg-publish.mjs', 'utf8'), se = readFileSync('.github/workflows/season.yml', 'utf8');
  T(/doc\('registryPrev'\)\.set\(/.test(rp) && rp.indexOf("doc('registryPrev')") < rp.indexOf('await ref.set(') && /json: JSON\.stringify\(rec\)/.test(rp) && /cur\.data\(\)\.ver === ver/.test(rp),
    'نشرُ سجلِّ النقاط نصٌّ واحدٌ ببصمته، ولا يُكتَب إلا إن تغيّر، والنسخةُ السابقةُ تُحفَظ قبله — لا يُمحى شيء');
  T(/node scripts\/reg-publish\.mjs/.test(se), 'ويجري بعد كلِّ ترقيةٍ في سير التغذية');
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ try { dom.window.close(); } catch {} process.exit(1); }
console.log('جردُ الاستعمال نظيف \u2705'); try { dom.window.close(); } catch {} process.exit(0);
