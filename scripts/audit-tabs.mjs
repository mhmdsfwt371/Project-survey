/* ═══════════════════════════════════════════════════════════════════════════
   جردُ الشرائح — يُشغَّل: node scripts/audit-tabs.mjs
   ───────────────────────────────────────────────────────────────────────────
   في V15.29 جُمعت ثلاثٌ وثلاثون شاشةً في ثماني صفحاتٍ بشرائح. والوعدُ كان
   «لا يتغيّر شيء»: كلُّ شريحةٍ تُفتَح بمعرِّفها القديم، ولا يراها إلا من كان
   يرى صفحتَها، ولا شريحةَ تظهر بندًا في القائمة بجوار أمِّها، والمساعدُ يجدها
   باسمها القديم. والوعدُ بلا حارسٍ ينكسر عند أول دمجٍ قادم — فهذا حارسُه:

     · كلُّ شريحةٍ ترسم للمهندس، والمعرِّفُ القديم يصل إلى أمِّه على شريحته
     · كلُّ دورٍ يرى من الشرائح ما كان يراه من الصفحات — لا أكثرَ ولا أقلّ
     · القائمةُ الجانبية لا تحوي شريحةً
     · المساعدُ يجد الشريحةَ باسم صفحتها القديم
     · «الوتيرة والهدف» و«المواعيد والأزمنة» تقرآن CFG لا تاريخًا مكتوبًا
     · كلُّ تعديلٍ في CFG يُقيَّد رفعُه إلى settings/points
   ═════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch { console.error('✗ jsdom غير مثبَّت:  npm i jsdom'); process.exit(2); }

let pass = 0; const fails = [];
const check = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); } };

const html = readFileSync('index.html', 'utf8');
const vc = new VirtualConsole(); const errs = [];
vc.on('jsdomError', e => { if (!/Not implemented/.test(String(e.message))) errs.push(String(e.message)); });
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:vc });
const w = dom.window, d = w.document;
w.HTMLCanvasElement.prototype.getContext = () => null;
if (!w.CSS) w.CSS = {}; if (!w.CSS.escape) w.CSS.escape = s => String(s);
{ const nodeUtil = require('util');
  if (!w.TextEncoder) w.TextEncoder = nodeUtil.TextEncoder; if (!w.TextDecoder) w.TextDecoder = nodeUtil.TextDecoder;
  if (w.URL && !w.URL.createObjectURL) w.URL.createObjectURL = () => 'blob:audit';
  if (!w.fetch) w.fetch = () => Promise.reject(new Error('no network in audit'));
  if (!w.matchMedia) w.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
  if (!w.scrollTo) w.scrollTo = () => {}; }
await new Promise(r => setTimeout(r, 800));
const lg = d.getElementById('lgGo'); if (lg) lg.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
await new Promise(r => setTimeout(r, 400));

console.log('\n══ ١ · كلُّ شريحةٍ ترسم، والمعرِّفُ القديم يصل إلى أمِّه ══');
w.ROLE = 'engineer';
const TABS = w.TABS || {};
check(Object.keys(TABS).length >= 8, `صفحاتٌ مدموجة: ${Object.keys(TABS).length}`);
{
  const broken = [];
  for (const pid of Object.keys(TABS)){
    for (const tb of TABS[pid]){
      w.CUR = tb[0]; let len = 0;
      try { w.render(1); len = (d.getElementById('content').textContent || '').trim().length; }
      catch (e){ broken.push(tb[0] + ' رمت: ' + e.message); continue; }
      if (w.CUR !== pid || w.PTAB[pid] !== tb[0] || len < 40) broken.push(tb[0] + ' → CUR=' + w.CUR + ' PTAB=' + w.PTAB[pid] + ' len=' + len);
    }
  }
  const nTabs = Object.values(TABS).reduce((a, t) => a + t.length, 0);
  check(broken.length === 0, broken.length ? 'شرائحُ مكسورة: ' + broken.slice(0, 4).join(' | ') : `الشرائحُ كلُّها ترسم على أمِّها (${nTabs})`);
}

console.log('\n══ ٢ · كلُّ دورٍ يرى من الشرائح ما كان يراه من الصفحات ══');
{
  const diff = [], stuck = [];
  for (const rn of Object.keys(w.ROLES)){
    w.ROLE = rn; const R = w.ROLES[rn];
    for (const pid of Object.keys(TABS)){
      const vis = w.tabsOf(pid).map(x => x[0]);
      /* V15.33: شريحةٌ لم تكن صفحةً قطّ (العنصر الخامس) لا تُطلَب في قوائم
         الأدوار — رؤيتُها رؤيةُ أمِّها، وقد يُضاف إليها شرطٌ مسمّى. فتُقارَن
         برؤية الأمّ لا بقائمةِ الدور. */
      const seeParent = (R.nav === '*' || R.nav.indexOf(pid) > -1)
        && !(w.PAGE_CAP[pid] && !(R.can || {})[w.PAGE_CAP[pid]]);
      const should = TABS[pid].map(x => x).filter(tb => tb[4]
        ? (seeParent && (tb[4] === 'self' || w.TAB_SEE[tb[4]](pid)))
        : ((R.nav === '*' || R.nav.indexOf(tb[0]) > -1)
           && !(w.PAGE_CAP[tb[0]] && !(R.can || {})[w.PAGE_CAP[tb[0]]]))).map(x => x[0]);
      if (vis.join() !== should.join()) diff.push(rn + '·' + pid + ' يرى [' + vis + '] وكان يرى [' + should + ']');
      if (vis.length){
        w.CUR = vis[vis.length - 1];
        try { w.render(1); } catch (e){ stuck.push(rn + '·' + pid + ': ' + e.message); }
        if (w.CUR !== pid) stuck.push(rn + '·' + pid + ' → ' + w.CUR);
      }
    }
  }
  w.ROLE = 'engineer';
  check(diff.length === 0, diff.length ? 'رؤيةٌ تغيّرت: ' + diff.slice(0, 3).join(' | ') : `الرؤيةُ محفوظةٌ بالحرف لكلِّ الأدوار (${Object.keys(w.ROLES).length})`);
  check(stuck.length === 0, stuck.length ? 'توجيهٌ مكسور: ' + stuck.slice(0, 3).join(' | ') : 'كلُّ دورٍ يصل إلى أمِّ الشريحة');
}

console.log('\n══ ٣ · القائمةُ والمساعد ══');
{
  w.CUR = 'over'; w.render(1);
  const navIds = [...d.querySelectorAll('#nav [data-p]')].map(a => a.getAttribute('data-p'));
  const kids = Object.keys(w.PARENT).filter(k => w.PARENT[k] !== k);
  const leak = navIds.filter(id => kids.indexOf(id) > -1);
  check(leak.length === 0, leak.length ? 'شرائحُ في القائمة: ' + leak.join('، ') : `القائمةُ ${navIds.length} بندًا بلا شريحة`);
  /* الشريحةُ التي لم تكن صفحةً تُفهرَس أيضًا — «أدائي» يُوجَد باسمه */
  const inner = w.helpSearch('أدائي').map(e => e.id);
  check(inner.indexOf('myscore') > -1, 'المساعدُ يجد الشريحةَ التي لم تكن صفحةً'
    + (inner.indexOf('myscore') > -1 ? '' : ' — وجد: ' + inner.slice(0, 3)));
  const hits = w.helpSearch('سجل عهدة السيارات').map(e => e.id);
  check(hits[0] === 'fleetLog', 'المساعدُ يجد الشريحةَ باسم صفحتها القديم' + (hits[0] === 'fleetLog' ? '' : ' — وجد: ' + hits.slice(0, 3)));
  /* الوصولُ بمعرِّف الأمِّ يفتح شريحتَها الأولى، وإعادةُ الرسم تُبقي المفتوحة */
  w.goPage('sup'); w.render(1);
  w.goPage('items'); w.render(1);
  const first = w.PTAB.items === 'items';
  w.PTAB.items = 'buycat'; w.render(1);
  check(first && w.PTAB.items === 'buycat', 'معرِّفُ الأمِّ يفتح شريحتَها الأولى، وإعادةُ الرسم لا تُغيّر المفتوحة');
}

console.log('\n══ ٤ · الوتيرةُ والمواعيدُ تقرآن CFG، والإعداداتُ تُرفَع ══');
{
  const due = Date.now() + 30 * 86400000;
  w.cfgSet('dueSurvey', null, due);
  w.CUR = 'pace'; w.render(1);
  const pc = d.getElementById('content').textContent;
  check(/أيامٌ للموعد|Days to deadline/.test(pc) && pc.indexOf(w.dayKey(due)) > -1, 'الوتيرةُ تقرأ الموعدَ من CFG وتعرضه');
  w.CUR = 'setup'; w.render(1);
  const dv = d.querySelector('[data-cfgdate="dueSurvey"]');
  check(!!dv && dv.value === w.dayKey(due), 'المواعيدُ تعرض القيمةَ المحفوظة');
  const before = w.STATE.queue.filter(q => q.kind === 'cfg' && q.id === 'points').length;
  w.cfgSet('tgtSurvey', null, 90);
  await new Promise(r => setTimeout(r, 1500));
  const after = w.STATE.queue.filter(q => q.kind === 'cfg' && q.id === 'points');
  const v = after.length ? after[after.length - 1].v : {};
  check(after.length >= 1 && 'tgtSurvey' in v && 'dueSurvey' in v && !('w' in v),
    'كلُّ مسارٍ لُمس يُقيَّد رفعُه إلى settings/points — وما لم يُلمَس لا يُكتَب' + (after.length ? ' (' + Object.keys(v).join('،') + ')' : ''));
  /* من لا يملك الإعدادات لا يُقيَّد له رفعٌ — القاعدةُ تردّه أصلًا */
  w.ROLE = 'tech'; const n0 = w.STATE.queue.length;
  w.cfgSet('tgtSurvey', null, 91);
  await new Promise(r => setTimeout(r, 1500));
  check(w.STATE.queue.length === n0, 'الفنيُّ لا يُقيَّد له رفعُ إعدادات');
  w.ROLE = 'engineer';
}

console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ console.log('\nجردُ الشرائح فشل ✗'); fails.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('جردُ الشرائح نظيف — الدمجُ لم يغيّر رؤيةَ أحدٍ ولا كسر رابطًا ✅');
/* المتصفّحُ الصوريُّ يُبقي مؤقّتاتِ المزامنة حيّةً — فيُنهى صراحةً */
process.exit(0);
