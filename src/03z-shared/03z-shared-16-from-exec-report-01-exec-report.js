/* ============================================================================
   FILE    : src/03z-shared/03z-shared-16-from-exec-report-01-exec-report.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-exec-report-01-exec-report.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : execOvOf, execAutoOf, execLabelOf, execStatusMemo, ccGroupsOfSite, execOvRow, selExecHtml, execT1, execT2, execT3, execT4, execPolicy … (+1 more)
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* (V37.47) طلبُ المالك بنسختِه: «عاوز التقرير يكون كده». كلُّ نقطةٍ في صفٍّ واحدٍ فقط (مجموعُ «العدد» = كلُّ النقاط)، وعمودُ الجهة متروكٌ كما تركه،
   وصياغتُه وإجراءاتُه بحرفها، وقرارُه لكلِّ مجموعة: ما وسمه كلَّه بحالٍ واحدةٍ يبقى كذلك (مخيماتُ منى جاهزةٌ بانتظار التخصيص، الزايدي كهرباء، الهجرة ١
   سطحُ تثبيتٍ وكهرباء، كاميراتُ عرفة مظلات…)، وما قسّمه يُقسَم نقطةً نقطةً بالقاعدة نفسِها (تحدٍّ أيًّا كان ← سطحُ التثبيت، وإلا جاهزة). */
var EXEC_L = {   /* (V37.48) نسخةُ المالك (٣): صياغاتُه وإجراءاتُه بحرفها — والمسافاتُ في آخرها كما كتبها */
  READY:['لا توجد تحديات — جاهزة للتركيب', 'إدراج النقاط في جدول التركيب'],
  READY_COORD:['لا توجد تحديات — جاهزة للتركيب', 'التنسيق مع الجهة المسئولة '],
  READY_OP:['لا توجد تحديات تشغيليه حتى الان — جاهزة للتشغيل', 'إدراج النقاط في جدول التركيب'],
  TECH:['يحتاج الى زيارة تقنية', 'معدة للعمل على تشغيل الكاميرات'],
  MOUNT:['لا يوجد سطح تثبيت — يحتاج هيكلًا أو عمودًا', 'تصنيع وتوريد هياكل أو أعمدة تثبيت وتركيبها في النقاط'],
  MOUNT_SH:['لا يوجد سطح تثبيت — يحتاج هيكلًا أو عمودًا', 'تصنيع وتوريد هياكل أو عمل مظلات وتركيبها في النقاط'],
  MOUNT_E:['لا يوجد سطح تثبيت — يحتاج هيكلًا أو عمودًا + الكهرباء', 'تصنيع وتوريد هياكل أو أعمدة تثبيت وتركيبها في النقاط'],
  ELEC:['يوجد تحدى وهو الكهرباء', 'مناقشة كيفية التوصيل في الزايدى مع الجهة المختصة'],
  PERMIT:['يحتاج تصريح دخول', 'التنسيق مع الجهة المسئولة '],
  LOC:['الموقع الموجود غير صحيح', 'نحتاج دعم في تحديد الموقع'],
  BLOCK:['عائق في الموقع أو منظومة قائمة لجهة أخرى', 'التنسيق مع الجهة المالكة لمعالجة العائق أو اعتماد موقع بديل، والتنسيق مع المنظومة القائمة'],
  SCOPE:['التأكيد على ما إذا كانت ضمن نطاق العمل ', ''],
  SP_MINA:['دراسة عدد الفعلي للكاميرات المراد تغطيتها', 'معرفة العدد الفعلي+الية التشغيل '],
  SP_ARAFAT:['دراسة عدد الفعلي للكاميرات المراد تغطيتها', 'مناقشة العدد الفعلي+الية التشغيل '],
  WAIT_RAHMA:['في انتظار تحديد مسارات المؤدية لجبل الرحمة ', ''],
  WAIT_NAMIRA:['في انتظار تحديد مسارات المؤدية لمسجد نمرة  ', ''],
  WAIT_TRAIN:['في انتظار تحديد مسارات المستخدمة لتفويج القطار ', ''],
  ARAFAT_BTH:['اعتماد نقاط الممرات، لضمان عدم تكرار نقاط التغطية', ''],
  INSTALLED:['تم التركيب', 'تم التركيب واعتماده']   /* (V37.52) */
};

var EXEC_ORDER_L = ['PERMIT', 'LOC', 'BLOCK', 'TECH', 'ELEC', 'MOUNT', 'MOUNT_SH', 'MOUNT_E', 'SCOPE', 'WAIT_RAHMA', 'WAIT_NAMIRA', 'WAIT_TRAIN', 'ARAFAT_BTH', 'SP_MINA', 'SP_ARAFAT', 'READY', 'READY_COORD', 'READY_OP', 'INSTALLED'];

var EXEC_PICK = ['READY', 'MOUNT', 'MOUNT_E', 'TECH', 'BLOCK', 'LOC', 'PERMIT', 'ELEC'];

function execOvOf(id){ var c = (CFG.execOv || {})[id]; if (c && c.s && EXEC_L[c.s]) return c.s; return CFG.execOvSeeded ? '' : (EXEC_OV[id] || ''); }

function execAutoOf(x){ return execStatus(STATE.recs[x.id], execPolicy(execT1(x), execT2(x) || '', execT3(x), execT4(x)), x, true); }

/* (V37.60) كانت تحذف القرارَ من CFG وتعيده */
function execLabelOf(st){ return String((EXEC_L[st] || [''])[0]).split(' — ')[0].trim(); }

/* (V37.53) التسميةُ الظاهرة — الحالاتُ المتعدّدةُ لتسميةٍ واحدةٍ شريحةٌ واحدة */
var EXEC_MEMO = { v:'', m:null };

function execStatusMemo(x){ var v = (typeof STAT_VER !== 'undefined' ? STAT_VER : 0) + ':' + (typeof CFG_VER !== 'undefined' ? CFG_VER : 0); if (EXEC_MEMO.v !== v){ EXEC_MEMO.v = v; EXEC_MEMO.m = {}; } var m = EXEC_MEMO.m; if (m[x.id] === undefined){ m[x.id] = execStatus(STATE.recs[x.id], execPolicy(execT1(x), execT2(x) || '', execT3(x), execT4(x)), x); } return m[x.id]; }

function ccGroupsOfSite(x){ var g = typeof mtGrpOf === 'function' ? mtGrpOf(x.id) : ''; return g ? [g] : []; }

/* (V37.64) توحيد: مجموعةٌ واحدةٌ لكلِّ نقطة — كما في تبويب التحديات */
function execOvRow(s){
  if (!may('settings') || !s) return '';
  var r = STATE.recs[s.id], cur = execOvOf(s.id), auto = execAutoOf(s), ins = typeof insDone === 'function' && insDone(s.id);
  var sel = '<select data-execov="' + esc(s.id) + '" aria-label="' + esc(t('تصنيف التقرير التنفيذي')) + '"' + (ins ? ' disabled' : '') + '><option value=""' + (cur ? '' : ' selected') + '>' + esc(t('تلقائي')) + ' — ' + esc((EXEC_L[auto] || [''])[0]) + '</option>'
    + EXEC_PICK.map(function(k){ return '<option value="' + k + '"' + (cur === k ? ' selected' : '') + '>' + esc(EXEC_L[k][0]) + '</option>'; }).join('') + '</select>';
  var tv = r && typeof techVisit === 'function' && !s.techDone && techVisit(s, r);
  return '<div class="field" style="margin:10px 0 0"><label>\u{1F4CB} ' + esc(t('تصنيف التقرير التنفيذي')) + (cur ? ' <span class="pill acc">' + esc(t('معدَّل يدويًا')) + '</span>' : '') + (ins ? ' <span class="pill ok">' + esc(t('تم التركيب')) + '</span>' : '') + '</label>' + sel + '</div>'
    + (tv ? '<div class="actions" style="margin:8px 0 0">' + btn('\u2714 ' + t('تمت الزيارة التقنية'), 'btn-secondary btn-sm', ' data-techdone="' + esc(s.id) + '" title="' + esc(t('تتحوّل من برتقالي إلى أزرق — زيارةٌ تمّت تنتظر الاعتماد')) + '"') + '</div>'
      : (s.techDone ? '<div class="actions" style="margin:8px 0 0">' + btn('\u21A9 ' + t('أعِدها «تحتاج زيارة تقنية»'), 'btn-quiet btn-sm', ' data-techundo="' + esc(s.id) + '"') + '</div>' : ''));
}

function selExecHtml(){
  var ids = selIds(), tv = ids.filter(function(id){ var x = siteFind(id), r = STATE.recs[id]; return x && r && !x.techDone && techVisit(x, r); }).length;
  return '<div class="field" style="margin:12px 0 0;padding:10px 0 0;border-top:1px solid var(--line)"><label>\u{1F4CB} ' + esc(t('المحدَّد في التقرير التنفيذي والزيارة التقنية')) + '</label>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
    + (tv ? btn('\u2714 ' + t('تمت الزيارة التقنية') + ' (' + nm(tv) + ')', 'btn-secondary btn-sm', ' data-seltech="1" title="' + esc(t('من برتقالي إلى أزرق دفعةً واحدة')) + '"') : '')
    + '<select id="selExec" aria-label="' + esc(t('تصنيف التقرير التنفيذي')) + '" style="flex:1 1 160px"><option value="">' + esc(t('تلقائي')) + '</option>' + EXEC_PICK.map(function(k){ return '<option value="' + k + '">' + esc(EXEC_L[k][0]) + '</option>'; }).join('') + '</select>'
    + btn(t('صنّف') + ' ' + nm(SEL_N), 'btn-secondary btn-sm', ' data-selexec="1"') + '</div></div>';
}

var EXEC_POLICY = {
  'النورية|كاميرات الحافلات':{ all:'READY' }, 'الزايدي|كاميرات الحافلات':{ all:'ELEC' }, 'الهجرة 1|كاميرات الحافلات':{ all:'MOUNT_E' },
  'الهجرة 2|كاميرات الحافلات':{ chal:'MOUNT_E', ready:'READY' }, '*|كاميرات البث@تفويج':{ all:'SCOPE' },
  'منى|مخيمات':{ all:'READY' }, 'منى|جمرات':{ all:'READY' }, '*|قطار':{ all:'READY' },
  'منى|كاميرات البث':{ chal:'READY_OP', ready:'READY_OP', block:'BLOCK' },
  'منى|ممرات':{ chal:'MOUNT_SH', ready:'READY' },
  'عرفه|مخيمات':{ chal:'MOUNT_E', ready:'READY' },
  'عرفه|ممرات|ممرات الطرق':{ chal:'MOUNT', ready:'READY_COORD' }, 'عرفه|ممرات|ممرات جبل الرحمه':{ all:'WAIT_RAHMA' },
  'عرفه|ممرات|ممرات مسجد نمرة':{ all:'WAIT_NAMIRA' }, 'عرفه|ممرات|ممرات القطار':{ all:'WAIT_TRAIN' },
  'عرفه|كاميرات الحافلات':{ all:'MOUNT_SH' }, 'عرفه|كاميرات البث':{ all:'ARAFAT_BTH' }
};

/* (V37.48) حكمُ المالك على كاميرات منى الثماني (ملفه ٣: ١ موقع غير صحيح · ١ عائق · ٤ زيارة تقنية · والباقي جاهزة) — من ملاحظات الفنيين */
var EXEC_OV = { 'NSK-MIN-CAM-0012':'LOC', 'NSK-MIN-CAM-0045':'BLOCK', 'NSK-MIN-CAM-0015':'TECH', 'NSK-JMR-CAM-0004':'TECH', 'NSK-JMR-CAM-0007':'TECH', 'NSK-JMR-CAM-0008':'TECH', 'NSK-MIN-CAM-0041':'READY_OP', 'NSK-MIN-CAM-0043':'READY_OP' };

function execT1(x){ return /^(النوارية|مواقع التفويج|المدينة|الترددية)$/.test(x.zone) ? 'مراكز تفويج' : 'المشاعر المقدسة'; }

function execT2(x){ var n = String(x.name || '');
  if (execT1(x) === 'مراكز تفويج'){ if (x.zone === 'النوارية' || /النوارية|النورية/.test(n)) return 'النورية'; if (x.zone === 'الترددية' || /الزايدي/.test(n)) return 'الزايدي';
    if (x.zone === 'المدينة') return 'الهجرة 1'; if (x.zone === 'مواقع التفويج') return 'الهجرة 2'; return ''; }
  return x.zone === 'منى' ? 'منى' : x.zone === 'عرفات' ? 'عرفه' : /مزدلف/.test(x.zone || '') ? 'مزدلفه' : ''; }

function execT3(x){ var n = String(x.name || ''), ty = String(x.type || '');
  if (execT1(x) === 'مراكز تفويج') return (ty === 'LPR' || /LPR/i.test(n)) ? 'كاميرات الحافلات' : 'كاميرات البث';
  if (ty === 'مخيم') return 'مخيمات';
  if (ty === 'كاميرا' || ty === 'LPR') return x.zone === 'عرفات' ? 'كاميرات الحافلات' : 'كاميرات البث';   /* (V37.48) كاميراتُ عرفة الـ٢٢ = الحافلات (ملفُّ المالك ٣) */
  if (ty === 'ممر' || ty === 'بوابة') return 'ممرات';
  if (ty === 'محطة' || /قطار/.test(n)) return 'قطار'; if (ty === 'جسر' || /الجمرات/.test(n)) return 'جمرات'; return ty; }

/* محطةُ «منى ٣ (الجمرات)» قطار */
function execT4(x){ if (execT3(x) !== 'ممرات') return ''; var n = String(x.name || ''); return /نمرة/.test(n) ? 'ممرات مسجد نمرة' : /الرحمة|الرحمه/.test(n) ? 'ممرات جبل الرحمه' : /القطار|قطار/.test(n) ? 'ممرات القطار' : 'ممرات الطرق'; }

function execPolicy(c1, c2, c3, c4){ return EXEC_POLICY[c2 + '|' + c3 + '|' + c4] || EXEC_POLICY[c2 + '|' + c3] || (c1 === 'مراكز تفويج' && EXEC_POLICY['*|' + c3 + '@تفويج']) || EXEC_POLICY[c2 + '|*'] || EXEC_POLICY['*|' + c3] || null; }

function execStatus(r, pol, x, noOv){   /* (V37.60) noOv: الحسابُ التلقائيُّ دون قرار المهندس — بلا لمسٍ مؤقّتٍ لـCFG */
  if (x && typeof insDone === 'function' && insDone(x.id)) return 'INSTALLED';   /* (V37.52) الشغلُ يحدّث التقرير: ما رُكّب انتقل وحدَه */
  var ov = !noOv && x && execOvOf(x.id); if (ov) return ov;
  if (pol && pol.all) return pol.all;
  if (!r || !svVisited(r)) return 'PERMIT';
  if (!svDone(r)){ var why = String(r.access || ''); return /غير موجود|غير مطابق/.test(why) ? 'LOC' : 'PERMIT'; }
  var c = chalCats(r); if (!c.length) return (pol && pol.ready) || 'READY';
  if (pol && pol.block && (c.indexOf('block') > -1 || c.indexOf('legacy') > -1)) return pol.block;
  return (pol && pol.chal) || (c.indexOf('block') > -1 || c.indexOf('legacy') > -1 ? 'BLOCK' : 'MOUNT');
}
