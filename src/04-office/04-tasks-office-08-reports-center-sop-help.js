/* ============================================================================
   FILE    : src/04-office/04-tasks-office-08-reports-center-sop-help.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Reports centre, the operations guide (every cycle step by step) and 'what is this page' help.
   DEFINES : repChips, repGen, repPack
   GLOBALS : REPORTS, SOPS, SOP_CUR, HELP_OPEN, HELP
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

EXP.repSide = 'co';
/* شرائحُ مركز التقارير: الشركةُ والوزارةُ والدوريات — الثالثةُ كانت صفحةً
   مستقلةً «التقارير الدورية» في مجموعة الفرق تضبط متى يُرسَل ما يُعرَض هنا. */
function repChips(){
  var co = PV.REPORTS.filter(function(r){ return r.side==='co'; }).length;
  var cl = PV.REPORTS.filter(function(r){ return r.side==='cl'; }).length;
  return [['co','\u{1F3E2} ' + t('تقارير الشركة'), co],
          ['cl','\u{1F54B} ' + t('تقارير الوزارة'), cl],
          ['sched','\u23F0 ' + t('الدوريات'), PV.PERIODS.length]].map(function(c){
    return '<button type="button" class="chip' + (EXP.repSide===c[0]?' on':'') + '" data-repside="' + c[0] + '">'
      + esc(c[1]) + ' <span class="num">' + nm(c[2]) + '</span></button>';
  }).join('');
}

function repGen(id){
  var r = PV.REPORTS.filter(function(x){ return x.id === id; })[0];
  if (!r){ toast(t('تقريرٌ غير معرَّف')); return; }
  var keys = r.sheets.filter(function(s){ return SHEETS[s]; });
  if (!keys.length){ toast(t('لا أوراقَ لهذا التقرير')); return; }
  toast(t('يُجهَّز') + ' ' + t(r.n) + '…');
  logEvent('توليد تقرير — ' + r.n + ' → ' + r.to);
  xlsExport(keys, 'نسك-' + r.id + '-' + dayKey() + '.xlsx');
}

function repPack(side){
  var keys = {};
  PV.REPORTS.filter(function(r){ return r.side === side; })
         .forEach(function(r){ r.sheets.forEach(function(s){ if (SHEETS[s]) keys[s] = 1; }); });
  var list = Object.keys(keys);
  if (!list.length){ toast(t('لا أوراق')); return; }
  toast(nm(list.length) + ' ' + t('ورقةً تُجهَّز') + '…');
  logEvent('حزمة تقارير — ' + (side === 'co' ? 'الشركة' : 'الوزارة') + ' · ' + nm(list.length) + ' ورقة');
  xlsExport(list, 'نسك-حزمة-' + (side === 'co' ? 'الشركة' : 'الوزارة') + '-'
    + dayKey() + '.xlsx');
}

PAGE.guide = { m:'المساعدة', t:'الأدلة',
  l:'دليلُك أنت بما تملكه من شاشات، ودليلُ العمليات خطوةً خطوة.',
  body:function(){
    var head = tabHead('guide'), cur = tabCur('guide');
    if (cur === 'wf') return head + wfBody();
    if (cur === 'guide') return head + (function(){
    /* المهندسُ يقرأ دليلَ أيِّ دورٍ ليعرف ما يراه فريقُه؛ وغيرُه يقرأ دليلَه */
    var pick = may('roles') || may('users');
    var cur = (pick && PV.GUIDE.role && ROLES[PV.GUIDE.role]) ? PV.GUIDE.role : ROLE;

    return (pick
      ? '<div class="chips">' + Object.keys(ROLES).map(function(k){
          return '<button type="button" class="chip' + (cur === k ? ' on' : '')
            + '" data-grole="' + k + '">' + esc(t(ROLES[k].n)) + '</button>';
        }).join('') + '</div>'
      : '')

      + roleGuide(cur)

      /* الملفُّ المُنزَّلُ كان واحدًا للجميع — فتقرأ الوزارةُ عن اعتماداتٍ لا
       تملكها. صار لكلِّ دورٍ ملفُّه، مُولَّدًا من الصلاحيات نفسِها التي
       تُولِّد هذه الصفحة. */
    + card('دليلُك — ملف وورد',
          '<div class="actions">'
          + '<a class="btn btn-primary btn-sm" href="docs/manuals/nusuk-manual-' + esc(cur) + '.docx" download>'
          +   '⬇ ' + esc(t('دليل') + ' ' + t(ROLES[cur].n) + ' — ' + t('وورد')) + '</a>'
          + (may('settings')
              ? '<a class="btn btn-secondary btn-sm" href="docs/nusuk-user-manual.docx" download>'
                + '⬇ ' + esc(t('الدليل الكامل — وورد')) + '</a>'
              : '')
          + '</div>'
          + '<p class="hint" style="margin:9px 0 0">'
          + esc(t('ما فوق يُشتقُّ من صلاحيات الدور لحظةَ فتحه — فمن غيّر صلاحيةً غيّر الدليلَ معها.'))
          + '</p>')

      + (may('settings')
          ? card('مراجع النظام',
              /* روابطُ فعليةٌ لملفاتٍ موجودة — لا أزرارُ توليدٍ وهمية.
                 ودليلُ النظام يحمل رقمَ نسخته في اسمه: من فتحه يعرف أيَّ
                 نسخةٍ يقرأ. */
              '<div class="actions">'
              /* اسمُ الملف من نسخة الرأس لا مكتوبًا بيد (V17.60): كان رقمًا حرفيًّا
                 يشيخ مع أوّل إصدارٍ فيُنزِّل ملفًا لا وجودَ له — وهو ما أمسكه جردُ
                 التصفير حين تبدّلت النسخة */
              + '<a class="btn btn-secondary btn-sm" href="docs/nusuk-system-'
              +   esc(appVer()) + '.docx" download>⬇ '
              +   esc(t('دليل النظام — وورد')) + '</a>'
              + '<a class="btn btn-secondary btn-sm" href="docs/nusuk-tech-spec.docx" download>⬇ '
              +   esc(t('المواصفة التقنية')) + '</a>'
              + '</div>')
          : '')
      + '<p class="hint">'+esc(t('كل دليل يُولَّد برقم النسخة نفسه — فلا يقرأ أحدٌ دليلًا لنسخةٍ غير التي بين يديه.'))+'</p>';
  })();
    return head + (function(){
    var s = SOPS.filter(function(x){ return x.id === PV.SOP_CUR; })[0] || SOPS[0];
    return '<div class="chips">' + SOPS.map(function(x){
        return '<button type="button" class="chip' + (PV.SOP_CUR===x.id?' on':'') + '" data-sop="' + esc(x.id) + '">'
          + x.i + ' ' + esc(t(x.n)) + '</button>';
      }).join('') + '</div>'

      + card(s.i + ' ' + t(s.n),
          '<div class="pop-rows" style="margin:0">'
          + '<div><span class="k">' + esc(t('من يملكها')) + '</span><span>' + esc(t(s.own)) + '</span></div>'
          + '<div><span class="k">' + esc(t('ما يبدؤها')) + '</span><span>' + esc(t(s.trig)) + '</span></div>'
          + '<div><span class="k">' + esc(t('خطواتها')) + '</span><span>' + N(s.steps.length) + '</span></div>'
          + '</div>')

      + cardFlush('الخطوات',
          table(['#','من','ما يفعل','أين'],
            s.steps.map(function(st, i){
              return ['<span class="num">' + nm(i+1) + '</span>',
                      '<span class="pill acc">' + esc(t(st[0])) + '</span>',
                      esc(t(st[1])),
                      st[2] === '—' ? '<span class="hint" style="margin:0">' + esc(t('تلقائي')) + '</span>'
                                    : '<span class="hint" style="margin:0">' + esc(t(st[2])) + '</span>'];
            })))

      + card('القواعد التي لا تُخرَق',
          '<div class="list">' + s.rules.map(function(r){
            return '<div class="list-item"><div class="li-main">'
              + '<div class="li-t">\u26A0 ' + esc(t(r)) + '</div></div></div>';
          }).join('') + '</div>')

      + card('التدفّق',
          flow(s.steps.map(function(st){ return st[0]; }), 0)
          + '<p class="hint">' + esc(t('هذا الدليلُ مرجعُ التدريب والمراجعة — ويُصدَّر مع وثائق المشروع.')) + '</p>',
          btn('⬇ إكسل — دليل العمليات','btn-secondary btn-sm',' data-xls="sop"'));
  })();
  }};

