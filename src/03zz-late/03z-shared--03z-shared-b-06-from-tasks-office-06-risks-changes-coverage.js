/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-b-06-from-tasks-office-06-risks-changes-coverage.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-b-06-from-tasks-office-06-risks-changes-coverage.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : riskDel, riskAdd, riskSignals, chgAdd, chgApply, chgDecide, hseAdd
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* الخطرُ المسجَّلُ بالخطأ يُحذَف — والمغلقُ يبقى في السجل شاهدًا */
function riskDel(id){
  if (!may('settings')){ toast(t('سجلُّ المخاطر للمهندس وحده')); return; }
  var L = risksList(), x = L.filter(function(r){ return r.id === id; })[0];
  if (!x) return;
  if (x.st === 'مغلق'){ toast(t('الخطرُ المغلق يبقى في السجل للرجوع إليه — لا يُحذَف')); return; }
  STATE.risks = L.filter(function(r){ return r.id !== id; });
  riskSave();
  logEvent('حذف خطر — ' + id + ' \u00b7 ' + x.t, id);
  toast(t('حُذف الخطر'));
  render(1);
}

function riskAdd(){
  if (!may('settings')){ toast(t('سجلُّ المخاطر للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var tt = g('rkT');
  if (!tt){ toast(t('اكتب وصفَ الخطر')); return; }
  var L = risksList();
  var n = L.length + 1, id = 'R' + n;
  while (L.some(function(x){ return x.id === id; })) id = 'R' + (++n);
  L.push({ id:id, t:tt, cat:g('rkC') || 'ميداني', p:cfgN(g('rkP')) || 3, i:cfgN(g('rkI')) || 3,
           resp:g('rkR') || 'تخفيف', plan:g('rkPl'), own:g('rkO') || (STATE.meta.name || ''),
           st:'مفتوح', at:Date.now(), by:STATE.meta.name || '' });
  riskSave();
  logEvent('خطر جديد — ' + id + ' \u00b7 ' + tt, id);
  toast(id + ' \u00b7 ' + t('سُجِّل الخطر'));
  render(1);
}

/* مؤشراتٌ حيّةٌ — من الأرقام لا من الذاكرة */
function riskSignals(){
  var out = [], v = (typeof evm === 'function') ? evm() : null;
  if (v && v.SPIx && v.SPIx < 0.9)  out.push(['bad', t('الجدولُ متأخّر') + ' — SPI ' + nm(v.SPI), 'plan']);
  if (v && v.CPIx && v.CPIx < 0.9)  out.push(['bad', t('الكلفةُ تتجاوز') + ' — CPI ' + nm(v.CPI), 'evm']);
  var rev = 0, blocked = 0;
  Object.keys(STATE.recs).forEach(function(k){
    var r = STATE.recs[k];
    if (svReview(r) === 'revisit') rev++;
    if (r && r.access && r.access !== 'تم الوصول') blocked++;
  });
  if (blocked) out.push([blocked > 20 ? 'bad' : 'wrn', nm(blocked) + ' ' + t('زيارةً متعذّرةً تحتاج قرارًا'), 'stuck']);
  if (rev)     out.push(['wrn', nm(rev) + ' ' + t('زيارةً مردودةً تنتظر إعادة'), 'svappr']);
  if (typeof NCRS !== 'undefined'){
    var maj = NCRS.filter(function(x){ return x.st !== 'مغلق' && x.st !== 'ملغى' && x.sev === 'جوهري'; }).length;
    if (maj) out.push(['bad', nm(maj) + ' ' + t('بلاغَ عدمِ مطابقةٍ جوهريًّا مفتوحًا'), 'ncr']);
  }
  var late = 0, today = dayKey(Date.now());
  Object.keys(STATE.tasks).forEach(function(k){
    var x = STATE.tasks[k];
    if (x && x.status !== 'معتمد' && x.when && x.when < today && !svVisited(STATE.recs[x.site])) late++;   /* (V32.8) */
  });
  if (late) out.push([late > 10 ? 'bad' : 'wrn', nm(late) + ' ' + t('مهمةً تجاوزت موعدَها'), 'req']);
  var resPct = cfgGet('reservePct') || 0, reserve = Math.round((cfgGet('budCap') || 0) * resPct / 100);
  if (v && reserve){
    var eaten = Math.max(0, v.EAC - v.BAC);
    if (eaten > reserve)          out.push(['bad', t('التقديرُ عند الاكتمال تجاوز الاحتياطيَّ') + ' — ' + nm(eaten - reserve), 'budm']);
    else if (eaten > reserve / 2) out.push(['wrn', t('استُهلك نصفُ الاحتياطي') + ' — ' + nm(eaten) + ' / ' + nm(reserve), 'budm']);
  }
  /* مهمةٌ على حسابٍ عُطِّل لا يراها أحدٌ ولا تُنجَز — تنتظر إلى الأبد */
  var offNames = {};
  Object.keys(STATE.users || {}).forEach(function(u){ if (STATE.users[u] && STATE.users[u].active === false && STATE.users[u].name) offNames[STATE.users[u].name] = 1; });
  var orphan = 0;
  Object.keys(STATE.tasks || {}).forEach(function(k){ var x = STATE.tasks[k]; if (x && x.status !== 'معتمد' && offNames[x.to]) orphan++; });
  if (orphan) out.push(['bad', nm(orphan) + ' ' + t('مهمةً على حسابٍ معطَّل — أعد إسنادَها'), 'reqreg']);
  var noNet = STATE.sites.filter(function(x){ return !x.net && !(typeof ipPreset === 'function' && ipPreset(x)); }).length;
  if (noNet > 100) out.push(['wrn', nm(noNet) + ' ' + t('نقطةً بلا بادئة شبكة'), 'ips']);
  /* نسخةٌ احتياطيةٌ لا تُؤخَذ أو لا تصل درايف: خطرٌ صامتٌ لا يظهر إلا يومَ الحاجة */
  if (may('settings')){
    bkFetch(false);
    var bm = BK_STATE.meta, bd = BK_STATE.drive;
    if (bm && !bm.ok) out.push(['bad', t('لا نسخةَ احتياطيةً تُؤخَذ') + ' — ' + t('BACKUP_KEY غير مضبوط'), 'hb']);
    else if (bm && bkAgeDays(bm) > 2) out.push(['bad', t('آخر نسخةٍ احتياطية منذ') + ' ' + nm(bkAgeDays(bm)) + ' ' + t('يوم'), 'hb']);
    if (bd && !bd.ok) out.push(['wrn', t('النسخةُ لا تُرفَع إلى درايف') + ' — ' + t('GDRIVE_SA غير مضبوط'), 'hb']);
  }
  if (!out.length) out.push(['ok', t('لا مؤشرَ خطرٍ حيًّا الآن'), '']);
  return out;
}

function chgAdd(){
  var kind = (document.getElementById('chgKind') || {}).value || 'نطاق';
  var imp  = (document.getElementById('chgImp') || {}).value || 'لا أثر';
  var why  = (document.getElementById('chgWhy') || {}).value || '';
  if (!why.trim()){ toast(t('اكتب المبرّر أولًا')); return; }
  var num = function(id){ var e = document.getElementById(id); return e ? (cfgN(e.value) || 0) : 0; };
  CHANGES.push({ kind:kind, imp:imp, why:why, by:STATE.meta.name || '',
                 at:Date.now(), st:'مقدَّم',
                 dCost:num('chgCost'), dDays:num('chgDays'), dScope:num('chgScope') });
  CORE.dirty('changes', 'CR-' + CHANGES.length, CHANGES[CHANGES.length-1]);
  logEvent('طلب تغيير — ' + kind + ' · ' + imp);
  toast(t('قُدّم الطلب'));
  render(1);
}

/* ═══ التغييرُ المعتمَدُ يُطبَّق على خط الأساس آليًّا ═══
   كان الاعتمادُ يقول «اعتُمد — جمّد خطَّ أساسٍ جديد» ويترك التطبيقَ للذاكرة:
   فيبقى خطُّ الأساس القديمُ يقيس المشروعَ على نطاقٍ وميزانيةٍ لم تعودا،
   وتقول القيمةُ المكتسبة «متجاوزٌ للكلفة» عن تغييرٍ اعتمده المدير بنفسه.
   صار الاعتمادُ يُطبِّق المقاديرَ: الكلفةُ تُضاف إلى الميزانية عند الاكتمال،
   والأيامُ تُزاح بها المواعيدُ المستهدفة، والنطاقُ يُعدَّل — ويُجمَّد خطُّ
   أساسٍ جديدٌ برقمٍ أعلى يحمل رقمَ التغيير سببًا، فيبقى القديمُ في سجله. */
function chgApply(c, no){
  if (!BASE){ toast(t('لا خطَّ أساسٍ مجمَّدًا بعد — جمّده أولًا من «المعالم»')); return false; }
  var dCost = +c.dCost || 0, dDays = +c.dDays || 0, dScope = +c.dScope || 0;
  if (!dCost && !dDays && !dScope) return false;
  var prev = BASE;
  BASE = JSON.parse(JSON.stringify(prev));
  BASE.ver = (prev.ver || 1) + 1;
  BASE.at = Date.now(); BASE.by = STATE.meta.name || '';
  BASE.bac = Math.round((prev.bac || 0) + dCost);
  BASE.scope = (prev.scope || 0) + dScope;
  BASE.reason = no + ' \u00b7 ' + c.kind;
  BASE.applied = (prev.applied || []).concat([{ no:no, dCost:dCost, dDays:dDays, dScope:dScope, at:Date.now() }]);
  if (dDays){
    /* المواعيدُ تُزاح — والوتيرةُ تقرؤها من الإعدادات فتتغيّر إجابةُ «هنلحق؟» معها */
    ['dueSurvey','dueInstall'].forEach(function(k){
      var v = cfgGet(k);
      if (v) cfgSet(k, null, v + dDays * 86400000);   /* المواعيدُ تُخزَّن ميلّي ثانية */
    });
  }
  CORE.set('baseline', 'v' + BASE.ver, BASE);
  logEvent('خط أساس جديد ' + nm(BASE.ver) + ' — تطبيق ' + no
           + (dCost ? ' \u00b7 كلفة ' + nm(dCost) : '') + (dDays ? ' \u00b7 أيام ' + nm(dDays) : '') + (dScope ? ' \u00b7 نطاق ' + nm(dScope) : ''));
  return true;
}

function chgDecide(i, ok){
  var c = CHANGES[i];
  if (!c) return;
  if (!may('approve')){ toast(t('قرارُ التغيير للمهندس وحده')); return; }
  if (c.st === 'معتمد' || c.st === 'مرفوض'){ toast(t('قُرِّر من قبل')); return; }
  c.st = ok ? 'معتمد' : 'مرفوض';
  c.decBy = STATE.meta.name || '';
  c.decAt = Date.now();
  var no = 'CR-' + (i+1), applied = false;
  if (ok) applied = chgApply(c, no);
  c.applied = applied;
  CORE.dirty('changes', no, c);
  logEvent((ok ? 'اعتماد' : 'رفض') + ' طلب تغيير — ' + no + ' \u00b7 ' + c.kind);
  toast(ok ? (applied ? t('اعتُمد وطُبِّق على خط الأساس') + ' \u00b7 ' + nm(BASE.ver) : t('اعتُمد — بلا أثرٍ مقيسٍ على خط الأساس')) : t('رُفض'));
  render(1);
}

function hseAdd(){
  var kind = (document.getElementById('hseKind') || {}).value || '';
  var site = (document.getElementById('hseSite') || {}).value || '';
  var lost = cfgN((document.getElementById('hseLost') || {}).value);
  var why  = (document.getElementById('hseWhy') || {}).value || '';
  if (!why.trim()){ toast(t('اكتب الوصف والإجراء')); return; }
  HSE.incidents.unshift({ kind:kind, site:site, lost:lost, why:why,
                          by:STATE.meta.name || '', at:Date.now() });
  HSE.lost += lost;
  CORE.dirty('hse', 'INC-' + HSE.incidents.length, HSE.incidents[0]);
  logEvent('حادث سلامة — ' + kind + (site ? ' · ' + site : ''), site);
  toast(t('سُجّل'));
  render(1);
}
