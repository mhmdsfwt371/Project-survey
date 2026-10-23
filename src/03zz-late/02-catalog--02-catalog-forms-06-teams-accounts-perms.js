/* (V38.90) moved by scripts/split-late.mjs from src/02-catalog/02-catalog-forms-06-teams-accounts-perms.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function crSaveTimes(){
  if (!may('settings')){ toast(t('إدارةُ التقارير للمهندس وحده')); return; }
  var vals = {};
  document.querySelectorAll('[data-crtime]').forEach(function(el){
    vals[el.getAttribute('data-crtime')] = el.value;
  });
  CFG.crTime = vals;
  CORE.set('cfg', 'crTime', vals);
  logEvent('حفظ مواعيد التقارير الدورية');
  toast(t('حُفظت المواعيد'));
}

/* الإسنادُ يعدّل سجلَّ الفنيِّ الحقيقيّ لا سطرًا في بذرة: كانت الحقولُ بلا
   معرّفاتٍ والزرَّان بلا خاصية، وتستعمل `ROLE_ORDER` وهو متغيّرٌ لا وجودَ
   له فتنفجر الشاشةُ لو نودي. */
function asnRoleSet(){
  if (!may('users')){ toast(t('إسنادُ الأدوار للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? e.value : ''; };
  var name = g('asnU'), jobId = g('asnJob');
  if (!name){ toast(t('اختر مستخدمًا')); return; }
  var job = jobsList().filter(function(j){ return j.id === jobId; })[0];
  if (!job){ toast(t('اختر وظيفة')); return; }
  var crew = g('asnCrew');
  techSet(name, { job:jobId, crew:crew || '' });
  logEvent('إسناد دور — ' + name + ' ← ' + job.n + (crew ? ' · ' + crew : ''));
  toast(t('أُسند الدور'));
  render(1);
}
