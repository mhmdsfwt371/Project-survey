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
  cat:() => { w.catList().push('فئةُ تجربة'); return 'فئةُ تجربة'; },
  tr:() => { w.trialRows().unshift({ id:'trT', n:'تجربةُ تجربة', date:'2026-10-07', hours:2, rep:'' }); return 'trT'; },
  hse:() => { w.HSE.incidents.unshift({ kind:'إصابة', site:'', lost:0, why:'حادثُ تجربة' }); return '0'; },
  depmem:() => { w.TEAMS.push({ id:'tmT', name:'فريقُ تجربة', members:[{ name:'فنيُّ تجربة', role:'tech', share:50 }] }); w.CTEAM_CUR = 'tmT'; return '0'; },
  tk:() => { (w.STATE.users = w.STATE.users || {}).uT = { name:'فنيُّ التجربة', role:'tech', ph:'0500000000' }; return 'فنيُّ التجربة'; },
  role:() => { w.CFG.roles = w.CFG.roles || { r:{} }; w.CFG.roles.r = w.CFG.roles.r || {}; w.CFG.roles.r.rT = { n:'دورُ تجربة', base:'tech', custom:true }; return 'rT'; }
};
const kinds = Object.keys(w.GED_REG);
T(kinds.length >= 18 && kinds.every(k => SEED[k]), 'كلُّ قائمةٍ في السجلّ لها تجربةٌ هنا (' + kinds.length + ')' + (kinds.filter(k => !SEED[k]).length ? ' — بلا تجربة: ' + kinds.filter(k => !SEED[k]).join('، ') : ''));
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
/* (V36.5) الحذفُ الموحّد: يظهر بجوار الخطوة وفي الحالة التي يُسمح فيها وحدَها، والملغى يخرج من الحسابات */
{ w.NCRS.push({ cat:'تجربة', st:'مفتوح', why:'x' }); const ni = w.NCRS.length - 1;
  w.IPCS.push({ period:'تجربة', amt:1000, retPct:10, st:'مقدَّم' }); const ii = w.IPCS.length - 1;
  w.IPCS.push({ period:'معتمد', amt:500, retPct:10, st:'معتمد' }); const ij = w.IPCS.length - 1;
  w.CHANGES.push({ kind:'نطاق', st:'مقدَّم', why:'x' }); const ci = w.CHANGES.length - 1;
  (w.STATE.vehAsn = w.STATE.vehAsn || {}).vaT = { id:'vaT', veh:'vhT', to:'فريق', kind:'دائم' };
  const host = d.createElement('div'); host.innerHTML = '<span><button data-ncrok="' + ni + '">x</button></span><span><button data-ipcok="' + ii + '">x</button></span><span><button data-chgok="' + ci + '">x</button></span><span><button data-vaend="vaT">x</button></span>'; d.body.appendChild(host);
  w.gdelInject(); const n = host.querySelectorAll('[data-gdel]').length;
  const sum0 = w.IPCS.reduce(function(a, x){ if (x.st === 'ملغى') return a; return a + x.amt; }, 0);
  const ok = w.gdelRun('ncr', String(ni)) && w.gdelRun('ipc', String(ii)) && w.gdelRun('chg', String(ci)) && w.gdelRun('va', 'vaT');
  const sum1 = w.IPCS.reduce(function(a, x){ if (x.st === 'ملغى') return a; return a + x.amt; }, 0);
  T(n === 4 && ok && w.NCRS[ni].st === 'ملغى' && w.IPCS[ii].st === 'ملغى' && w.CHANGES[ci].st === 'ملغى' && !w.STATE.vehAsn.vaT && sum1 === sum0 - 1000,
    'الحذفُ الموحّد: «🗑 حذف» بجوار خطوة البلاغ والمستخلص والطلب والإسناد، والملغى يخرج من مجموع المستخلصات');
  T(w.gdelRun('ipc', String(ij)) === false && w.IPCS[ij].st === 'معتمد', 'والمستخلصُ المعتمَدُ لا يُحذَف');
  host.remove(); }
const ev = JSON.stringify(w.STATE.evlog || {}) + JSON.stringify(w.STATE.events || []);
T(/تعديل خطر/.test(ev) || /تعديل/.test(ev), 'والتعديلُ يُسجَّل في الأحداث');
console.log(`\nنجح ${pass} · فشل ${fails.length}`);
if (fails.length){ console.log('جردُ التعديل الموحّد فشل ✗'); process.exit(1); }
console.log('جردُ التعديل الموحّد ✓'); process.exit(0);
