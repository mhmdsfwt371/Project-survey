
/* ═══ (V37.61) وحدةُ «التقرير التنفيذي» في ملفٍّ مستقل — نُقلت من 06-ministry-alerts.js (كان ٤٨٩ من ٥٢٠ ك.ب) قبل بناء التبويبات الخمسة.
   لا تغييرَ في السلوك: القالبُ في 06-exec-template.js، والقواعدُ والتصنيفُ الحيُّ والتصديرُ هنا. ═══ */
/* ═══ (V37.46) «التقرير التنفيذي» — قالبُ الوزارة نفسُه حرفيًّا، يُعبَّأ بالأرقام الحية عند كلِّ تصدير ═══
   طلبُ المالك: «تعمله زي الملف بالظبط … زرار ليه لوحده … ولما أعمل إكسبورت الداتا اللي جوه تتحدث». القالبُ مضمَّنٌ بأجزائه الاثني عشر
   كما وصل (القوائمُ المنسدلة، واتجاهُ الورقة، وتذييلُ «مقيد»)، وتُكتب الصفوفُ في خلاياه نفسِها بأنماطها. التحدياتُ الثماني في ستِّ مجموعاتٍ
   بحسب الإجراء والجهة، والنقطةُ ذاتُ التحديين تُعَدُّ في كلٍّ منهما، والصياغةُ على قاعدة الوزارة (لا تصريحَ ولا تعذّر). */
/* (V37.47) القالبُ في 06-exec-template.js مضغوطًا — كان نصًّا صريحًا ٢٤٠ ك.ب فتجاوز سقفَ حجم الملف */
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
/* ═══ (V37.52) تصنيفُ التقرير التنفيذي طبقةٌ حيّة: تلقائيٌّ من البيانات، ويعلوه قرارُ المهندس (سحابيٌّ، يصل كلَّ الأجهزة)، ويعلوهما ما رُكّب فعلًا ═══ */
/* (V37.61) مراجعة: «if (k in CFG)» في سحب الإعدادات يُسقط كلَّ مفتاحٍ غير مسجَّل — فكان تصنيفُ المهندس اليدويُّ يبقى على جهازه وحدَه منذ ٣٧٫٥٢ */
if (!('execOv' in CFG)) CFG.execOv = null;
if (!('execOvSeeded' in CFG)) CFG.execOvSeeded = null;
var EXEC_PICK = ['READY', 'MOUNT', 'MOUNT_E', 'TECH', 'BLOCK', 'LOC', 'PERMIT', 'ELEC'];
function execOvOf(id){ var c = (CFG.execOv || {})[id]; if (c && c.s && EXEC_L[c.s]) return c.s; return CFG.execOvSeeded ? '' : (EXEC_OV[id] || ''); }   /* (V37.61) بعد البذر: السحابةُ وحدَها، فما يمسحه المهندسُ يبقى ممسوحًا */
function execOvSeed(){   /* (V37.61) قراراتُ المالك المكتوبةُ في الكود تُنقل إلى السحابة مرةً واحدة — أوّلُ مهندسٍ يفتح التطبيق */
  if (CFG.execOvSeeded || typeof may !== 'function' || !may('settings') || (typeof CFG_PULLED !== 'undefined' && !CFG_PULLED)) return 0;   /* لا بذرَ قبل وصول إعدادات السحابة — وإلا طغى على قراراتٍ موجودة */
  CFG.execOv = CFG.execOv || {}; var n = 0;
  Object.keys(EXEC_OV).forEach(function(id){ if (!CFG.execOv[id]){ CFG.execOv[id] = { s:EXEC_OV[id], by:'قرار المالك — الملف ٣', at:Date.now() }; n++; } });
  CFG.execOvSeeded = Date.now(); cfgPushSoon('execOv'); cfgPushSoon('execOvSeeded'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1;
  if (n) logEvent('نُقلت ' + n + ' من قرارات التقرير التنفيذي إلى السحابة'); return n;
}
function execOvSet(id, st){
  if (!may('settings')){ toast(t('تصنيفُ التقرير للمهندس وحدَه')); return false; }
  CFG.execOv = CFG.execOv || {}; CFG.execOv[id] = st && EXEC_L[st] ? { s:st, by:(STATE.meta && STATE.meta.name) || '', at:Date.now() } : null;   /* (V37.61) «تلقائي» = null لا حذف — الكتابةُ الدامجةُ في السحابة لا تمحو مفتاحًا محذوفًا محليًّا */
  cfgPushSoon('execOv'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1; statBump(); return true;
}
function execAutoOf(x){ return execStatus(STATE.recs[x.id], execPolicy(execT1(x), execT2(x) || '', execT3(x), execT4(x)), x, true); }   /* (V37.60) كانت تحذف القرارَ من CFG وتعيده */
function execLabelOf(st){ return String((EXEC_L[st] || [''])[0]).split(' — ')[0].trim(); }   /* (V37.53) التسميةُ الظاهرة — الحالاتُ المتعدّدةُ لتسميةٍ واحدةٍ شريحةٌ واحدة */
var EXEC_MEMO = { v:'', m:null };
function execStatusMemo(x){ var v = (typeof STAT_VER !== 'undefined' ? STAT_VER : 0) + ':' + (typeof CFG_VER !== 'undefined' ? CFG_VER : 0); if (EXEC_MEMO.v !== v){ EXEC_MEMO.v = v; EXEC_MEMO.m = {}; } var m = EXEC_MEMO.m; if (m[x.id] === undefined){ m[x.id] = execStatus(STATE.recs[x.id], execPolicy(execT1(x), execT2(x) || '', execT3(x), execT4(x)), x); } return m[x.id]; }
function ccGroupsOfSite(x){ var r = STATE.recs[x.id]; if (!r || !svVisited(r)) return []; if (!svDone(r)) return ['access']; var cc = chalCats(r), out = []; CC_GROUPS.forEach(function(g){ if (g.ks.some(function(k){ return cc.indexOf(k) > -1; })) out.push(g.g); }); return out; }
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
function techDoneSet(id, on){
  var x = siteFind(id); if (!x) return false; if (!may('settings')){ toast(t('الزيارةُ التقنيةُ يقرّها المهندس')); return false; }
  if (on){ x.techDone = Date.now(); siteOvSet(id, { techDone:x.techDone }); } else { delete x.techDone; siteOvSet(id, { techDone:null }); }
  statBump(); return true;
}
function selTechDone(){ var n = 0; selIds().forEach(function(id){ var x = siteFind(id), r = STATE.recs[id]; if (x && r && !x.techDone && techVisit(x, r) && techDoneSet(id, true)) n++; }); if (n) logEvent('تمت الزيارةُ التقنية لـ' + n + ' نقطة (جماعيًّا)'); return n; }
function selExecSet(st){ var n = 0; selIds().forEach(function(id){ if (execOvSet(id, st)) n++; }); if (n) logEvent('تصنيفُ التقرير التنفيذي: ' + n + ' نقطة ← ' + (st ? EXEC_L[st][0] : 'تلقائي')); return n; }
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
/* صفوفٌ ثابتةٌ بلا عدد — «قراراتٌ معلّقة» كتبها المالك؛ تظهر بلا عددٍ ما لم يكن في النظام نقاطٌ لمجموعتها (فتظهر بعددها) */
var EXEC_STATIC = [
  ['مراكز تفويج', 'النورية', 'كاميرات البث', '', 'SCOPE'], ['مراكز تفويج', 'الزايدي', 'كاميرات البث', '', 'SCOPE'],
  ['مراكز تفويج', 'الهجرة 1', 'كاميرات البث', '', 'SCOPE'], ['مراكز تفويج', 'الهجرة 2', 'كاميرات البث', '', 'SCOPE'],
  ['المشاعر المقدسة', 'منى', 'كاميرات مزودين الخدمة', '', 'SP_MINA'],
  ['المشاعر المقدسة', 'عرفه', 'ممرات', 'ممرات جبل الرحمه', 'WAIT_RAHMA'], ['المشاعر المقدسة', 'عرفه', 'ممرات', 'ممرات مسجد نمرة', 'WAIT_NAMIRA'],
  ['المشاعر المقدسة', 'عرفه', 'ممرات', 'ممرات القطار', 'WAIT_TRAIN'], ['المشاعر المقدسة', 'عرفه', 'كاميرات البث', '', 'ARAFAT_BTH'],
  ['المشاعر المقدسة', 'عرفه', 'كاميرات مزودين الخدمة', '', 'SP_ARAFAT']
];
var EXEC_O = { c1:['مراكز تفويج', 'المشاعر المقدسة'], c2:['النورية', 'الزايدي', 'الهجرة 1', 'الهجرة 2', 'منى', 'عرفه', 'مزدلفه'],
  c3:{ 'منى':['كاميرات مزودين الخدمة', 'كاميرات البث', 'مخيمات', 'ممرات', 'جمرات', 'قطار'], 'عرفه':['مخيمات', 'ممرات', 'كاميرات الحافلات', 'كاميرات البث', 'قطار', 'كاميرات مزودين الخدمة'], '*':['كاميرات الحافلات', 'كاميرات البث', 'مخيمات', 'ممرات', 'جمرات', 'قطار'] },
  c3all:['كاميرات البث', 'كاميرات الحافلات', 'مخيمات', 'ممرات', 'جمرات', 'قطار', 'كاميرات مزودين الخدمة'], c4:['', 'ممرات الطرق', 'ممرات جبل الرحمه', 'ممرات مسجد نمرة', 'ممرات القطار'] };
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
  if (ty === 'محطة' || /قطار/.test(n)) return 'قطار'; if (ty === 'جسر' || /الجمرات/.test(n)) return 'جمرات'; return ty; }   /* محطةُ «منى ٣ (الجمرات)» قطار */
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
function execRows(){
  var S = (STATE.sites || []).filter(function(x){ return !x.hidden && !x.deleted; });
  var known = S.filter(function(x){ return execT1(x) === 'مراكز تفويج' && execT2(x) && x.lat; });
  var t2 = function(x){ var v = execT2(x); if (v || execT1(x) !== 'مراكز تفويج' || !x.lat) return v; var best = null, bd = 1e9;
    known.forEach(function(k){ var d = Math.pow(k.lat - x.lat, 2) + Math.pow(k.lng - x.lng, 2); if (d < bd){ bd = d; best = k; } }); return best ? execT2(best) : 'الهجرة 2'; };
  var agg = {}, tot = { all:0, visited:0, surveyed:0, ready:0, chal:0, revisit:0, pending:0, installed:0 };
  S.forEach(function(x){ tot.all++; var r = STATE.recs[x.id], c1 = execT1(x), c2 = t2(x), c3 = execT3(x), c4 = execT4(x), st = execStatus(r, execPolicy(c1, c2, c3, c4), x), k = [c1, c2, c3, c4, st].join('|');
    agg[k] = (agg[k] || 0) + 1; if (r && svVisited(r)) tot.visited++; if (r && svDone(r)) tot.surveyed++;
    if (st === 'INSTALLED') tot.installed++; else if (/^READY/.test(st)) tot.ready++; else if (st === 'PERMIT' || st === 'LOC') tot.revisit++; else if (/^(SCOPE|WAIT_|ARAFAT_BTH|SP_)/.test(st)) tot.pending++; else tot.chal++; });
  var rows = Object.keys(agg).map(function(k){ var p = k.split('|'); return { c1:p[0], c2:p[1], c3:p[2], c4:p[3], b:p[4], n:agg[k] }; });
  EXEC_STATIC.forEach(function(s0){ if (!rows.some(function(r){ return r.c2 === s0[1] && r.c3 === s0[2] && r.c4 === s0[3]; })) rows.push({ c1:s0[0], c2:s0[1], c3:s0[2], c4:s0[3], b:s0[4], n:null }); });
  var ix = function(L, v){ var i = (L || []).indexOf(v); return i < 0 ? 99 : i; };
  var key = function(r){ var c4r = r.c3 === 'ممرات' ? (r.c4 === 'ممرات الطرق' && /^READY/.test(r.b) ? 9 : ix(EXEC_O.c4, r.c4)) : 0;   /* ممراتُ الطرق الجاهزةُ بعد الجبل ونمرة والقطار كما رتّبها المالك */
    var tail = r.b === 'SP_ARAFAT' ? 1 : 0;   /* كاميراتُ مزودي الخدمة في عرفة آخرَ الملف كما وضعها */
    var bo = r.c2 === 'الهجرة 2' && /^READY/.test(r.b) ? -1 : ix(EXEC_ORDER_L, r.b);   /* في الهجرة ٢ قدّم المالكُ الجاهزةَ */
    return [tail, ix(EXEC_O.c1, r.c1), ix(EXEC_O.c2, r.c2), ix(EXEC_O.c3[r.c2] || EXEC_O.c3['*'], r.c3), c4r, bo]; };
  rows.sort(function(a, b){ var A = key(a), B = key(b); for (var q = 0; q < A.length; q++) if (A[q] !== B[q]) return A[q] - B[q]; return 0; });
  return { rows:rows, tot:tot };
}

function execSheetXml(xml, rows){
  var esc0 = function(v){ return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var COLS = 'ABCDEFGH'.split(''), st = {};
  COLS.forEach(function(c){ var m = new RegExp('<c r="' + c + '2" s="(\\d+)"').exec(xml); st[c] = m ? m[1] : '14'; });
  var cell = function(c, r, v){ if (c === 'E') return v == null ? '<c r="E' + r + '" s="' + st[c] + '"/>' : '<c r="E' + r + '" s="' + st[c] + '"><v>' + (+v || 0) + '</v></c>';
    return v ? '<c r="' + c + r + '" s="' + st[c] + '" t="inlineStr"><is><t>' + esc0(v) + '</t></is></c>' : '<c r="' + c + r + '" s="' + st[c] + '"/>'; };
  var data = {}; rows.forEach(function(x, i){ var L = EXEC_L[x.b] || ['', '']; data[i + 2] = { A:x.c1, B:x.c2, C:x.c3, D:x.c4, E:x.n, F:L[0], G:L[1], H:'' }; });
  /* كلُّ صفٍّ من الثاني فما بعد: تُمحى خاناتُ A–H (ما كان في القالب من أرقام النسخة اليدوية) وتُكتب الحية — والقوائمُ في J–L باقية */
  xml = xml.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g, function(m0, rr, attrs, inner){ var r = +rr; if (r < 2) return m0;
    COLS.forEach(function(c){ inner = inner.replace(new RegExp('<c r="' + c + r + '"[^>]*?(\\/>|>[\\s\\S]*?<\\/c>)'), ''); });
    var nc = data[r] ? COLS.map(function(c){ return cell(c, r, data[r][c]); }).join('') : ''; delete data[r]; return '<row r="' + r + '"' + attrs + '>' + nc + inner + '</row>'; });
  xml = xml.replace(/<row r="(\d+)"([^>]*)\/>/g, function(m0, rr, attrs){ var r = +rr; if (!data[r]) return m0; var nc = COLS.map(function(c){ return cell(c, r, data[r][c]); }).join(''); delete data[r]; return '<row r="' + r + '"' + attrs + '>' + nc + '</row>'; });
  var extra = Object.keys(data).map(Number).sort(function(a, b){ return a - b; }).map(function(r){ return '<row r="' + r + '" spans="1:12">' + COLS.map(function(c){ return cell(c, r, data[r][c]); }).join('') + '</row>'; }).join('');
  if (extra){   /* صفوفٌ جديدةٌ تُدرَج في موضعها بالترتيب */
    var rowsArr = []; xml = xml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, function(m0, body){ return '<sheetData>' + body + extra + '</sheetData>'; });
    xml = xml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, function(m0, body){ var L = body.match(/<row r="\d+"[\s\S]*?<\/row>|<row r="\d+"[^>]*\/>/g) || []; L.sort(function(a, b){ return +/r="(\d+)"/.exec(a)[1] - +/r="(\d+)"/.exec(b)[1]; }); return '<sheetData>' + L.join('') + '</sheetData>'; });
  }
  /* (V37.48) القوائمُ المنسدلة: الخلايا التي فيها قيمٌ خارج قوائم Sheet2 (كاميرات مزودين الخدمة، ممرات القطار) تُستثنى كما استثناها المالك — والصفوفُ تتحرّك مع البيانات */
  var LST = { C:['كاميرات البث', 'كاميرات الحافلات', 'مخيمات', 'ممرات', 'جمرات', 'قطار'], D:['', 'ممرات الطرق', 'ممرات جبل الرحمه', 'ممرات مسجد نمرة'] };
  ['C', 'D'].forEach(function(col){
    var bad = []; rows.forEach(function(x, i){ var v = col === 'C' ? x.c3 : x.c4; if (LST[col].indexOf(v) < 0) bad.push(i + 2); });
    xml = xml.replace(new RegExp('(<xm:sqref>)(' + col + '\\d+:' + col + '\\d+(?: ' + col + '\\d+:' + col + '\\d+)*)(</xm:sqref>)'), function(m0, a1, ref, a3){
      var nums = ref.match(/\d+/g).map(Number), end = Math.max.apply(null, nums), out = [], from = 2;
      bad.forEach(function(b){ if (b > from) out.push(col + from + ':' + col + (b - 1)); from = b + 1; }); if (from <= end) out.push(col + from + ':' + col + end);
      return a1 + out.join(' ') + a3; });
  });
  return xml;
}
function execTplParts(){   /* (V37.47) فكُّ القالب مرةً ويُحفَظ */
  if (execTplParts.p) return execTplParts.p;
  if (typeof DecompressionStream !== 'function') return Promise.reject(new Error('no-inflate'));
  var bin = atob(EXEC_TPL_B64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  var inflate = function(bytes){ return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function(b){ return new Uint8Array(b); }); };
  execTplParts.p = Promise.all(zipRead(u.buffer).map(function(e){ return (e.method === 8 ? inflate(e.data) : Promise.resolve(e.data)).then(function(b){ return [e.name, new TextDecoder().decode(b)]; }); }));
  execTplParts.p.catch(function(){ execTplParts.p = null; });
  return execTplParts.p;
}
function execXlsx(){
  var R = execRows(); if (!R.rows.length){ toast(t('لا بيانات بعد')); return Promise.resolve(false); }
  toast(t('يُجهَّز التقرير التنفيذي…'));
  return execTplParts().then(function(parts){
    var files = parts.map(function(p){ return { name:p[0], data:p[0] === 'xl/worksheets/sheet1.xml' ? execSheetXml(p[1], R.rows) : p[1] }; });
    var ok = dl(new Blob([zipMany(files)], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'تقرير_المسح_التنفيذي_' + dayKey() + '.xlsx');
    if (ok !== false){ logEvent('تصديرُ التقرير التنفيذي — ' + R.rows.length + ' صفًّا · ' + R.tot.all + ' نقطة'); toast(t('صُدّر التقرير التنفيذي — بأرقام اللحظة')); }
    return ok;
  }).catch(function(e){ softErr('التقرير التنفيذي', e, String(e && e.message) === 'no-inflate' ? 'متصفحُ هذا الجهاز قديمٌ على فكِّ القالب — صدِّره من الكمبيوتر' : 'تعذّر تجهيز التقرير التنفيذي'); return false; });
}