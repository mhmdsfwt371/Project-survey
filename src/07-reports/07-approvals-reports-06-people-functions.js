/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-06-people-functions.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : People and functions: who gets field work, unified department page, functions from which roles derive.
   DEFINES : techDel, crewSave, crewAdd, crewDel, depTeamNew, depTeamAdd, depTeamRm, depTeamEven, depTeamByRole, depTeamDel, roleOfJob, jobAdd … (+3 more)
   GLOBALS : FIELD_ROLES, SITES_ALL, JOBS_SEED, LESS_SHOW
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الفنيون والفرق: يُضافون ويُعدَّلون ويُحذَفون ═══════════════════════
   كان سجلُّ الفنيين قائمةَ عرضٍ: ستةُ أسماءٍ مخترعةٍ لا تُزاد ولا تُنقَص.
   ومن أراد فنيًّا جديدًا لم يجد أين يكتبه، ومن انصرف فنيٌّ لم يجد كيف
   يرفعه — فيبقى في التوزيع ويُسنَد إليه عملٌ لا يؤدّيه أحد. */

/* ═══ المصدرُ الواحدُ للأشخاص: الحسابات ═══
   كانت قائمةُ الفنيين قائمةً ثانيةً موازيةً للحسابات — تُزرَع في الشيفرة
   وتُضاف من شاشة الفرق وتُخزَّن في settings/techs — فالاسمُ الواحد يُكتَب في
   مكانين ويختلف فيهما، ومن حُذف من هنا بقي هناك. صارت القائمةُ تُشتقُّ من
   الحسابات: من له حسابٌ ظهر، ووظيفتُه تقرّر في أيِّ دورةٍ يظهر — الفنيُّ في
   دورة الفني وهكذا. ولا يُخزَّن شيءٌ باسم القائمة: التعديلُ يقع على وثيقة
   الحساب نفسِها. */

function techDel(name){
  if (!may('users')){ toast(t('إدارةُ الفنيين للمهندس وحده')); return; }
  /* من له عملٌ مسجَّلٌ لا يُحذَف: سجلاتُه تحمل اسمَه، وحذفُه يُيتِّمها */
  var work = scores().list.filter(function(e){ return e.name === name; })[0];
  var acts = work ? (work.survey + work.install + work.dis + work.prep + work.asm) : 0;
  if (acts){
    toast(t('له') + ' ' + nm(acts) + ' ' + t('عملًا مسجَّلًا — لا يُحذَف'));
    return;
  }
  /* الحذفُ حذفُ حسابٍ — فالقائمةُ مشتقّةٌ منه */
  var uid = techUid(name);
  if (!uid) return;
  delete STATE.users[uid];
  CORE.dirty('users', uid, null);
  logEvent('حذف حساب — ' + name);
  toast(t('حُذف الحساب'));
  render(1);
}

function crewSave(){ CORE.set('cfg', 'crews', crewsList().slice()); }
function crewAdd(){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('crN');
  if (!n){ toast(t('اكتب اسم الفريق')); return; }
  if (crewsList().some(function(c){ return c.n === n; })){ toast(t('الاسمُ موجودٌ بالفعل')); return; }
  var id = 'cr' + Date.now().toString(36);
  crewsList().push({ id:id, n:n,
                     base:g('crRole') || 'supervisor', kind:g('crKind') || 'ins',
                     d:g('crD'), members:[] });
  crewSave();
  PV.CREW_CUR = id;
  logEvent('فريق جديد — ' + n);
  toast(t('أُنشئ الفريق'));
  render(1);
}
function crewDel(id){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  /* يُقبَل المعرّفُ والاسمُ معًا: الشاشةُ تُرسل الاسمَ لأنه ما يراه
     المستخدمُ، والنداءُ القديمُ يُرسل المعرّف. */
  var L = crewsList(), i = -1, nm2 = '', id2 = '';
  L.forEach(function(c, k){ if (c.id === id || c.n === id){ i = k; nm2 = c.n; id2 = c.id; } });
  if (i < 0) return;
  var inIt = techsList().filter(function(x){ return x.crew === nm2; }).length;
  if (inIt){ toast(t('فيه') + ' ' + nm(inIt) + ' ' + t('موظفًا — انقلهم أولًا')); return; }
  var subs = TEAMS.filter(function(x){ return x.crew === nm2; }).length;
  if (subs){ toast(t('فيه') + ' ' + nm(subs) + ' ' + t('فرقًا فرعيةً — احذفها أولًا')); return; }
  L.splice(i, 1);
  crewSave();
  if (PV.CREW_CUR === id2) PV.CREW_CUR = L[0] ? L[0].id : '';
  logEvent('حذف فريق — ' + nm2);
  toast(t('حُذف الفريق'));
  render(1);
}

function depTeamNew(crewId){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var crew = crewOf(crewId);
  if (!crew) return;
  var id = 'CT' + Date.now().toString(36);
  var tm = { id:id, n:'فريق ' + nm(crewTeams(crew).length + 1), crew:crew.n, kind:crew.kind, members:[] };
  TEAMS.push(tm);
  CTEAM_CUR = id;
  CORE.dirty('teams', id, tm);
  render(1);
}
function depTeamAdd(){
  var tm = teamOf(CTEAM_CUR);
  if (!tm){ toast(t('أنشئ فريقًا فرعيًّا أولًا')); return; }
  var n = (document.getElementById('depMemName') || {}).value;
  var r = (document.getElementById('depMemRole') || {}).value || 'tech';
  var sh = cfgN((document.getElementById('depMemShare') || {}).value);
  if (!n){ toast(t('لا موظفَ متاح')); return; }
  if (tm.members.some(function(m){ return m.name === n; })){ toast(t('هو في الفريق بالفعل')); return; }
  tm.members.push({ name:n, role:r, share:sh });
  CORE.dirty('teams', tm.id, tm);
  logEvent('إضافة ' + n + ' إلى ' + tm.n);
  toast(n + ' \u00b7 ' + t('أُضيف'));
  render(1);
}
function depTeamRm(i){
  var tm = teamOf(CTEAM_CUR);
  if (!tm) return;
  var m = tm.members[i];
  if (!m) return;
  tm.members.splice(i, 1);
  CORE.dirty('teams', tm.id, tm);
  logEvent('إخراج ' + m.name + ' من ' + tm.n);
  toast(m.name + ' \u00b7 ' + t('أُخرج'));
  render(1);
}
function depTeamEven(){
  var tm = teamOf(CTEAM_CUR), n = tm && tm.members.length;
  if (!tm || !n){ toast(t('لا أعضاءَ في هذا الفريق')); return; }
  var base = Math.floor(100 / n), rest = 100 - base * n;
  tm.members.forEach(function(m, i){ m.share = base + (i < rest ? 1 : 0); });
  CORE.dirty('teams', tm.id, tm);
  toast(t('وُزّعت بالتساوي'));
  render(1);
}
function depTeamByRole(){
  var tm = teamOf(CTEAM_CUR);
  if (!tm) return;
  var raw = tm.members.map(function(m){ return (PV.TEAM_ROLE[m.role] || PV.TEAM_ROLE.tech).def; });
  var sum = raw.reduce(function(a,b){ return a + b; }, 0);
  if (!sum){ toast(t('لا أعضاءَ في هذا الفريق')); return; }
  var acc = 0;
  tm.members.forEach(function(m, i){
    var v = (i === tm.members.length - 1) ? (100 - acc) : Math.round(raw[i] / sum * 100);
    m.share = v; acc += v;
  });
  CORE.dirty('teams', tm.id, tm);
  toast(t('وُزّعت بالأدوار'));
  render(1);
}
function depTeamDel(teamId){
  if (!may('users')){ toast(t('إدارةُ الفرق للمهندس وحده')); return; }
  var i = -1;
  TEAMS.forEach(function(x, k){ if (x.id === teamId) i = k; });
  if (i < 0) return;
  if (TEAMS[i].members.length){ toast(t('فيه أعضاء — أخرجهم أولًا')); return; }
  TEAMS.splice(i, 1);
  CORE.dirty('teams', teamId, null);
  if (CTEAM_CUR === teamId) CTEAM_CUR = '';
  toast(t('حُذف الفريق الفرعي'));
  render(1);
}

function roleOfJob(id){ var j = jobOf(id); return j ? j.role : ''; }

function jobAdd(){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var n = g('jbN');
  if (!n){ toast(t('اكتب اسم الوظيفة')); return; }
  if (jobsList().some(function(j){ return j.n === n; })){ toast(t('موجودةٌ بالفعل')); return; }
  jobsList().push({ id:'j' + Date.now().toString(36), n:n, role:g('jbR') || 'tech', d:g('jbD') });
  jobSave();
  logEvent('وظيفة جديدة — ' + n);
  toast(t('أُضيفت الوظيفة'));
  render(1);
}

function jobDel(id){
  if (!may('users')){ toast(t('الوظائفُ للمهندس وحده')); return; }
  var u = jobUsed(id);
  if (u){ toast(t('عليها') + ' ' + nm(u) + ' ' + t('شخصًا — انقلهم أولًا')); return; }
  var L = jobsList(), i = -1, nm2 = '';
  L.forEach(function(j, k){ if (j.id === id){ i = k; nm2 = j.n; } });
  if (i < 0) return;
  L.splice(i, 1);
  jobSave();
  logEvent('حذف وظيفة — ' + nm2);
  toast(t('حُذفت'));
  render(1);
}

/* سجلُّ الدروس: كان قائمةَ عرضٍ ثابتةً تُقرأ ولا يُكتَب فيها — والدرسُ الذي
   لا يُكتَب يومَ وقع لا يُكتَب أبدًا، فيُكرَّر في الموسم القادم. */
   

function lessAdd(){
  if (!may('settings')){ toast(t('سجلُّ الدروس للمهندس وحده')); return; }
  var g = function(id){ var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  var w2 = g('lqW');
  if (!w2){ toast(t('اكتب ما وقع')); return; }
  lessList().push({ p:g('lqP') || 'المسح', w:w2, a:g('lqA') });
  lessSave(); logEvent('درس مستفاد — ' + w2.slice(0, 50));
  toast(t('سُجّل الدرس')); render(1);
}

function lessDel(i){
  if (!may('settings')){ toast(t('سجلُّ الدروس للمهندس وحده')); return; }
  var L = lessList(); if (!L[i]) return;
  var w2 = L[i].w; L.splice(i, 1); lessSave();
  logEvent('حذف درس — ' + String(w2).slice(0, 40));
  toast(t('حُذف')); render(1);
}

