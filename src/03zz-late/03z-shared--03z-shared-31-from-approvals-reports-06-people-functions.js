/* (V38.90) moved by scripts/split-late.mjs from src/03z-shared/03z-shared-31-from-approvals-reports-06-people-functions.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function depTechAdd(crewId){
  if (!may('users')){ toast(t('إدارةُ الموظفين للمهندس وحده')); return; }
  var crew = crewOf(crewId);
  if (!crew) return;
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('depN');
  if (!n){ toast(t('اكتب اسم الموظف')); return; }
  /* لا يُخلَق شخصٌ من هنا: الأسماءُ من الحسابات وحدَها — وهذه الشاشةُ
     تنسبه لفريقه فقط. من لا حسابَ له يُنشأ أولًا في «الحسابات». */
  var uid = techUid(n);
  if (!uid){
    toast(t('لا حسابَ بهذا الاسم — أنشئه أولًا من «المستخدمون والأدوار ← الحسابات» ثم انسبه هنا'));
    return;
  }
  var u = Object.assign({}, STATE.users[uid], { crew:crew.n });
  if (g('depPh'))  u.ph  = g('depPh');
  if (g('depSup')) u.sup = g('depSup');
  STATE.users[uid] = u;
  CORE.set('users', uid, u);
  logEvent('نُسب لفريق — ' + n + ' \u00b7 ' + crew.n);
  toast(t('نُسب للفريق'));
  render(1);
}

/* (V27.1) السجلُّ القديمُ يُطوى حتى يُطلَب — صفحةُ الدروس لا تثقل بمحتواه */
function lessLegacyBody(){ if (!LESS_SHOW) return '<p class="hint" style="margin:8px 0">' + esc(t('سجل الدروس السريع')) + ' — ' + nm(lessList().length) + ' ' + btn(t('اعرض'), 'btn-quiet btn-sm', ' data-lsshow="1"') + '</p>';
  return '<details class="mfu-add" open><summary>' + esc(t('سجل الدروس السريع')) + '</summary>' + (function(){
    var L = lessList();
    return cardFlush(t('الدروس') + ' — ' + nm(L.length),
        L.length
          ? table(['المرحلة','ما وقع','ما فُعل',''],
              L.map(function(l, i){
                return [pill(l.p,'acc'),
                        /* (V27.1) كانت الصفوفُ حقولًا تُحرَّر في مكانها — نصٌّ الآن (الصفحةُ المدمجة تثقل بعشرين حقلًا)، والتحريرُ بحذفٍ وإعادةِ تسجيل */
                        esc(l.w), esc(l.a || ''),
                        may('settings')
                          ? btn('حذف','btn-quiet btn-sm',' data-lsdel="' + i + '"') : ''];
              }))
          : '<p class="hint" style="padding:16px">' + esc(t('لا دروسَ مسجَّلةٌ بعد.')) + '</p>',
        btn('⬇ إكسل — الدروس','btn-secondary btn-sm',' data-xls="less"'))
      + (may('settings')
        ? card('سجّل درسًا',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('المرحلة')) + '</label><select id="lqP">'
            +   ['التخطيط','المسح','التهيئة','التجميع','التركيب','الفك','الإغلاق']
                 .map(function(p){ return '<option value="' + esc(p) + '">' + esc(t(p)) + '</option>'; }).join('')
            +   '</select></div>'
            + '<div class="field"><label>' + esc(t('ما وقع')) + ' <span class="req">*</span></label>'
            +   '<input id="lqW" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('ما فُعل')) + '</label>'
            +   '<input id="lqA" dir="auto"></div>'
            + '</div>',
            btn('➕ سجّل الدرس','btn-primary btn-sm',' data-lsadd="1"'))
        : '')
      + '<p class="hint">' + esc(t('يُراجَع عند إغلاق المشروع ويُسلَّم مع وثائقه — فما كلّف مرةً لا يُكلِّف ثانية.')) + '</p>';
  })() + '</details>'; }
