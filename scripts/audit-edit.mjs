/* ═══ جردُ التعديل الموحّد (V36.2) — طلبُ المالك: «تعديل وحذف وإضافة لكل التفاصيل» ═══
   لكلِّ قائمةٍ في GED_REG: يُزرَع عنصرٌ، ويُرسَم زرُّ حذفه، فيجب أن يظهر «✎ تعديل» بجواره، وأن تفتح النافذةُ بقيمه، وأن يغيّر الحفظُ
   الحقلَ الأوّلَ فعلًا ويُسجَّل في الأحداث. ولا تُضاف قائمةٌ إلى السجلّ إلا مرّت من هنا. */
import './lib/jsdom-dict.cjs';
import { readFileSync } from 'fs'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const { JSDOM, VirtualConsole } = require('jsdom');
let pass = 0; const fails = []; const T = (c, n) => { if (c){ pass++; console.log('  ✓ ' + n); } else { fails.push(n); console.log('  ✗ ' + n); } };
const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts:'dangerously', pretendToBeVisual:true, url:'https://x.test/', virtualConsole:new VirtualConsole() });
const w = dom.window, d = w.document; w.HTMLCanvasElement.prototype.getContext = () => null; w.scrollTo = () => {};
await new Promise(r => setTimeout(r, 800));
w.loadSites(); w.ROLE = 'admin'; w.STATE.meta.role = 'admin'; w.STATE.meta.name = 'مدير'; w.CORE.set = () => {}; w.CORE.dirty = () => {}; w.toast = () => {};
const SEED = {
  rk:() => { w.risksList().push({ id:'R99', t:'خطرُ تجربة', cat:'ميداني', p:3, i:3, st:'مفتوح' }); return 'R99'; },
  ls:() => { w.lessList().push({ p:'المسح', w:'درسُ تجربة', a:'' }); return String(w.lessList().length - 1); },
  es:() => { w.escList().push({ w:'حالةُ تجربة', days:3, who:'', to:'', act:'' }); return String(w.escList().length - 1); },
  rc:() => { w.raciList().push({ a:'نشاطُ تجربة', R:'', A:'', C:'', I:'' }); return String(w.raciList().length - 1); },
  jb:() => { w.jobsList().push({ id:'jT', n:'وظيفةُ تجربة', role:'tech', d:'' }); return 'jT'; },
  vk:() => { w.vehKinds().push({ id:'vkT', n:'نوعُ تجربة', d:'', cap:2 }); return 'vkT'; },
  ty:() => { w.typesList()['تجربة'] = { l:'نوعُ تجربة', i:'●', c:'#888', s:'circle' }; return 'تجربة'; },
  vh:() => { (w.STATE.vehicles = w.STATE.vehicles || {}).vhT = { id:'vhT', plate:'أ ب ج ١٢٣', kind:'sedan', st:'متاحة' }; return 'vhT'; },
  sh:() => { (w.STATE.ships = w.STATE.ships || {}).shT = { id:'shT', ref:'SH-T', item:'قارئ', qty:5 }; return 'shT'; },
  bn:() => { (w.STATE.bonus = w.STATE.bonus || {}).bnT = { id:'bnT', tech:'فني', pts:5, note:'تجربة' }; return 'bnT'; },
  it:() => { w.itemsList().push({ z:'camp', code:'ITT', name:'صنفُ تجربة', pts:1, price:10 }); return 'ITT'; },
  sup:() => { w.supList().push('مورّدُ تجربة'); return 'مورّدُ تجربة'; },
  cat:() => { w.catList().push('فئةُ تجربة'); return 'فئةُ تجربة'; }
};
const kinds = Object.keys(w.GED_REG);
T(kinds.length >= 13 && kinds.every(k => SEED[k]), 'كلُّ قائمةٍ في السجلّ لها تجربةٌ هنا (' + kinds.length + ')');
for (const k of kinds){
  const R = w.GED_REG[k], id = SEED[k]();
  const host = d.createElement('div'); host.innerHTML = '<button data-' + R.del + '="' + id + '">x</button>'; d.body.appendChild(host);
  w.gedInject();
  const eb = host.querySelector('[data-ged]');
  w.GED = { k, id }; const h = w.gedHtml(); const tmp = d.createElement('div'); tmp.innerHTML = h; d.body.appendChild(tmp);
  const f0 = tmp.querySelector('#gedF0'); const before = f0 ? f0.value : null; if (f0) f0.value = before + ' معدَّل';
  const ok = w.gedSave(); const F = w.gedFind(k, R.key === '=' ? before + ' معدَّل' : id); const now = F ? (R.key === '=' ? F.x : F.x[R.f[0][0]]) : null;
  T(!!eb && !!f0 && before && ok && now === before + ' معدَّل', k + ' — ' + R.t + ': «✎ تعديل» بجوار الحذف، والنافذةُ بقيمه، والحفظُ يغيّره');
  host.remove(); tmp.remove();
}
const ev = JSON.stringify(w.STATE.evlog || {}) + JSON.stringify(w.STATE.events || []);
T(/تعديل خطر/.test(ev) || /تعديل/.test(ev), 'والتعديلُ يُسجَّل في الأحداث');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ console.log('جردُ التعديل الموحّد فشل ✗'); process.exit(1); }
console.log('جردُ التعديل الموحّد ✓'); process.exit(0);
