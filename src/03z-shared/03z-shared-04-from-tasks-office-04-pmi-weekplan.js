/* ============================================================================
   FILE    : src/03z-shared/03z-shared-04-from-tasks-office-04-pmi-weekplan.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-04-pmi-weekplan.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : BASE, baseDays, evm, WPLAN_WK, WPLAN_EDIT, WPLAN_PRI, WPLAN_ACT, WPLAN_PREFILL, wplanUpdates, wplanWeek, wplanItems, wplanLines
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ── خط الأساس: يُجمَّد فيصير مرجعًا لا يُعدَّل إلا بطلب تغيير ── */
var BASE = null;

function baseDays(){
  if (!BASE) return { elapsed:0, total:0, pct:0 };
  var total = (BASE.months || 4) * (cfgGet('days') || 26);
  var elapsed = Math.min(total, Math.max(0,
    Math.round((Date.now() - BASE.at) / 86400000)));
  return { elapsed:elapsed, total:total, pct: total ? elapsed / total : 0 };
}

/* ── القيمة المكتسبة — لغةُ المدقّق ── */
function evm(){
  if (!BASE) return null;
  var D = baseDays();
  var PV = Math.round(BASE.bac * D.pct);          /* المخطَّط حتى اليوم */

  var earned = 0, done = 0;
  STATE.sites.forEach(function(x){
    if (svVisited(STATE.recs[x.id])){ earned += ptsSurvey(x); done++; }   /* (V32.6) */
    var r = STATE.inss[x.id];
    if (r && r.status === 'مُركّب' && r.approved) earned += ptsInstall(x);
  });
  var EV = Math.round(earned * BASE.ph);          /* المكتسَب فعلًا */

  var AC = 0;
  scores().list.forEach(function(e){ AC += e.money; });
  buysList().forEach(function(b){ if (b.st === 'معتمد') AC += (+b.amt || 0); });
  AC = Math.round(AC);                            /* المنصرف الفعلي */

  var SV = EV - PV, CV = EV - AC;
  var SPI = PV ? (EV / PV) : 0;
  var CPI = AC ? (EV / AC) : 0;
  var EAC = CPI ? Math.round(BASE.bac / CPI) : BASE.bac;
  var ETC = Math.max(0, EAC - AC);
  var VAC = BASE.bac - EAC;
  var TCPI = (BASE.bac - AC) ? ((BASE.bac - EV) / (BASE.bac - AC)) : 0;

  /* المؤشراتُ تُعرَض بمنزلتين والتقديراتُ تُحسَب بالدقة الكاملة — فمن أعاد
     الحسابَ من الرقم المعروض خالفَ التقدير. تُصدَّر الدقةُ الكاملةُ معها
     باسمٍ صريحٍ فيُعاد الحسابُ عليها ويتطابق التقرير. */
  return { PV:PV, EV:EV, AC:AC, SV:SV, CV:CV,
           SPI:Math.round(SPI * 100) / 100, CPI:Math.round(CPI * 100) / 100,
           SPIx:SPI, CPIx:CPI, TCPIx:TCPI,
           EAC:EAC, ETC:ETC, VAC:VAC, TCPI:Math.round(TCPI * 100) / 100,
           BAC:BASE.bac, days:D, doneSites:done };
}

/* ═══ خطةُ الأسبوع — للمهندس وحدَه (V21.2) ═══
   «في التخطيط زوّد خطةَ الأسبوع، المهندسُ بس تبان له وهو اللي يحطّها: نقاط، وكلُّ
   نقطة فيها تفاصيل وملاحظات، وخطوات، واحتياجات، ونتائج مرجوّة». دفترُ المهندس
   الأسبوعيُّ: في settings/pmo (قراءةُ المهندس والمدير) تحت wplan، لكلِّ نقطةٍ أسبوعُها
   وعنوانُها وتفاصيلُها وخطواتُها (قائمةُ تحقّق) ومتطلباتُها ونتيجتُها المرجوّة وأولويتُها
   وحالتُها — ومنها مهمةٌ أسبوعيةٌ بضغطة، وما لم يُنجَز يُرحَّل للأسبوع القادم. */
var WPLAN_WK = '', WPLAN_EDIT = '';

var WPLAN_PRI = ['عالية', 'متوسطة', 'منخفضة'], WPLAN_ACT = null, WPLAN_PREFILL = null;

function wplanUpdates(x){ return (Array.isArray(x.hist) ? x.hist : []).filter(function(h){ return h.f === 'upd' || h.f === 'result' || h.f === 'close'; }); }

function wplanWeek(){ return WPLAN_WK || mfuWeekKey(); }

function wplanItems(wk){ return pmoList('wplan').filter(function(x){ return x.wk === wk; }).sort(function(a, b){ return WPLAN_PRI.indexOf(a.pri || 'متوسطة') - WPLAN_PRI.indexOf(b.pri || 'متوسطة') || (a.at || 0) - (b.at || 0); }); }

function wplanLines(v){ return String(v || '').split(/\n+/).map(function(l){ return l.trim(); }).filter(Boolean); }
