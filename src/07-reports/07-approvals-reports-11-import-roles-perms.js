/* ============================================================================
   FILE    : src/07-reports/07-approvals-reports-11-import-roles-perms.js
   DOMAIN  : Approvals & reports — inventory, workshop, devices, notifications, roles
   PURPOSE : Import via downloaded template, roles (who sees and does what), the owner is never locked out, database permissions matrix, custom roles, ranks, org tree and merged pages.
   DEFINES : importCard, impPreviewCard, repcenterBody, isBossHere, R, may, pmLocked, pmDefault, pmMatrix, pmOverride, pmGet, pmToggle, pmDirty, pmSave … (+20 more)
   GLOBALS : IMPORTS, ROLES, ROLE, BOSS_EMAILS, PM_OPS, PM_COLS, PM_CAP, PM_DRAFT, ROLE_RANK, BASE_ROLES … (+5 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ الاستيراد — قالب يُنزَّل ثم يُملأ ثم يُرفع ═══ */

var IMPORTS = [
  ['sites','المواقع', ['المعرّف','المشعر','النوع','الشاخص','المربع','الشركة','خط العرض','خط الطول'],
   'يحدّث بيانات موقع موجود بمعرّفه — ولا ينشئ مواقع جديدة.'],
  ['ips','عناوين الأجهزة', ['معرّف الموقع','بادئة الشبكة','الراوتر','القارئ','الكاميرا'],
   'البادئة تكفي: العناوين تُشتقّ منها باصطلاح ‎.1 راوتر و‎.2 قارئ و‎.3 كاميرا.'],
  ['co','الشركات', ['اسم الشركة','مواقعها','المنسّق','الجوال'],
   'الاسم الحر كان يصنع شركتين من واحدة باختلاف حرف.'],
  ['items','القطع والأسعار', ['المنطقة','اسم القطعة','نقاط التركيب','نقاط التهيئة','نقاط التجميع','السعر'],
   'المنطقة إما «مخيم» أو «ممر» — وما عداهما يُرفض الصف.'],
  ['stock','توريد المخزون', ['الصنف','الكمية','المورّد','التاريخ','رقم الفاتورة'],
   'كل صف حركةُ توريدٍ تدخل الدفتر — ولا تُعدَّل بعدها بل تُوازَن بحركة.'],
  ['buys','المشتريات', ['التاريخ','الصنف','الفئة','المشعر','الكمية','سعر الوحدة','المورّد'],
   'الفئة والمورّد يجب أن يكونا من القائمتين المعتمدتين.'],
  ['fleet','السيارات', ['رقم اللوحة','النوع','الموديل','انتهاء الرخصة','الملكية','التكلفة الشهرية'],
   'اللوحةُ مفتاح: ما وُجد يُعدَّل وما لم يوجد يُنشَأ. والنوعُ من «أنواع السيارات».'],
  ['users','المستخدمون', ['المعرّف','الاسم','الدور','الحالة'],
   'يعدّل الاسمَ والدورَ والحالةَ لحسابٍ قائمٍ بمعرّفه — ولا يُنشئ حسابًا، فالإنشاءُ في المصادقة لا في القاعدة.']
];

function importCard(){
  if (!may('importAll')) return '';
  return card('استيراد من إكسل',
    '<p class="hint" style="margin:0 0 14px">'
    + esc(t('نزّل القالب، املأه، ثم ارفعه. القالب يحمل الأعمدة بأسمائها وصفًّا نموذجيًّا يُحتذى.'))
    + '</p>'
    + IMPORTS.map(function(im){
        return '<div style="border:1px solid var(--line);border-radius:var(--radius-sm);'
          + 'padding:12px 14px;margin-bottom:10px">'
          + '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">'
          +   '<strong style="font-size:14px">'+esc(t(im[1]))+'</strong>'
          +   '<div class="actions">'
          +     btn('⬇ '+t('نزّل القالب'),'btn-secondary btn-sm',' data-tpl="'+im[0]+'"')
          +     '<label class="btn btn-primary btn-sm" style="cursor:pointer">⬆ '+esc(t('ارفع الملف'))
          +     '<input type="file" accept=".xlsx,.xls,.csv" data-imp="'+im[0]+'" '
          +     'style="display:none" aria-label="'+esc(t('ارفع الملف'))+'"></label>'
          +   '</div></div>'
          + '<div class="hint" style="margin:8px 0 0;font-size:12px">'
          +   '<span style="opacity:.75">'+esc(t('الأعمدة'))+':</span> '
          +   im[2].map(function(c){ return esc(t(c)); }).join(' · ')
          + '</div>'
          + '<div class="hint" style="margin:5px 0 0;font-size:11.5px">'+esc(t(im[3]))+'</div>'
          + '</div>';
      }).join('')
    + '<div style="padding:10px 0;border-top:1px solid var(--line)">'
    + '<b>' + esc(t('تقرير كاميرات الوزارة')) + '</b>'
    + '<div class="hint" style="margin:4px 0 8px;font-size:12px">' + esc(t('ارفع ملفَّ الوزارة كما هو (MOHU CPE AND CAMERA REPORT) — يُطابَق بالنقاط عمودًا عمودًا، وتظهر العناوينُ في نافذة كلِّ كاميرا لمن دخل التطبيق فقط. كلمةُ المرور لا تُحفَظ.')) + '</div>'
    + '<input type="file" accept=".xlsx,.xls" data-imp="mohu" aria-label="' + esc(t('تقرير كاميرات الوزارة')) + '">'
    + '</div>'
    + (IMP_PREVIEW ? impPreviewCard() : '')
    + '<div class="alert info" style="margin:14px 0 0"><span>'
    + esc(t('الرفع يعرض معاينةً قبل الحفظ: كم صفًّا سيُقبل وكم سيُرفض ولماذا — ولا يُكتب شيء قبل موافقتك.'))
    + '</span></div>');
}

function impPreviewCard(){
  var p = IMP_PREVIEW;
  var nm2 = p.kind === 'mohu' ? 'تقرير كاميرات الوزارة' : (IMPORTS.filter(function(i){ return i[0] === p.kind; })[0] || ['',''])[1];
  return card(t('معاينة ما رُفع') + ' — ' + t(nm2),
      (p.missing.length
        ? alertBox('error','أعمدةٌ ناقصةٌ في الملف: ' + p.missing.join(' · ') + ' — نزّل القالب واملأه.')
        : '')
    + stats([['سيُقبل', N(p.ok.length), 'ok'], ['سيُرفض', N(p.bad.length), p.bad.length?'bad':''],
             ['الأعمدة', N(p.head.length)], ['الناقص', N(p.missing.length), p.missing.length?'bad':'']])
    + (p.bad.length
        ? table(['الصف','السبب','أول قيمة'],
            p.bad.slice(0, 12).map(function(b){
              return ['<span class="num">' + nm(b.row) + '</span>', pill(b.why,'off'),
                      '<span class="hint" style="margin:0">' + esc(String(b.data[0]||'—')).slice(0,40) + '</span>'];
            }))
        : '')
    + '<div class="actions" style="margin-top:12px">'
    + (p.ok.length && !p.missing.length
        ? btn('احفظ ' + nm(p.ok.length) + ' صفًّا','btn-primary',' data-impgo="1"') : '')
    + btn('إلغاء','btn-secondary',' data-impx="1"') + '</div>');
}

function repcenterBody(){ return (function(){
    if (EXP.repSide === 'sched'){
      return '<div class="chips">' + repChips() + '</div>' + (function(){
    return card('الدوريات',
        table(['الدورية','متى تُرسَل','الوقت','تقارير'],
          PERIODS.map(function(p){
            var n = CREW_REPORTS.filter(function(r){ return r[1] === p[0]; }).length;
            return [pill(p[1],'acc'), '<span class="hint" style="margin:0">' + esc(t(p[2])) + '</span>',
                    '<input type="time" data-crtime="' + p[0] + '" value="'
                      + ((CFG.crTime && CFG.crTime[p[0]]) || (p[0]==='day'?'17:00':'07:00'))
                      + '" style="max-width:130px">',
                    N(n)];
          })),
        btn('حفظ المواعيد','btn-primary btn-sm',' data-crsave="1"'))
      + alertBox('warn',
          t('الإرسالُ التلقائيُّ في الموعد يحتاج خادمًا مجدولًا — لم يُبنَ بعد. الأوقاتُ تُحفَظ الآن، والتقريرُ نفسُه يُصدَّر يدويًّا في «مركز التقارير».'))
      + PERIODS.map(function(p){
          var L = CREW_REPORTS.filter(function(r){ return r[1] === p[0]; });
          return cardFlush(t(p[1]) + ' — ' + nm(L.length),
            table(['التقرير','لمن','ما يحويه',''],
              L.map(function(r){
                return ['<strong>' + esc(t(r[0])) + '</strong>', pill(r[2],'info'),
                        '<span class="hint" style="margin:0">' + esc(t(r[3])) + '</span>',
                        '<div class="actions">'
                        + '<button type="button" class="btn btn-quiet btn-sm" data-p="reps">'
                        + esc(t('في مركز التقارير')) + '</button></div>'];
              })));
        }).join('')
      + card('قناة الإرسال',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('الوسيلة')) + '</label>'
          + '<select><option value="داخل التطبيق">' + esc(t('داخل التطبيق')) + '</option><option value="واتساب">' + esc(t('واتساب')) + '</option><option value="الاثنان">' + esc(t('الاثنان')) + '</option></select></div>'
          + '<div class="field"><label>' + esc(t('لغة التقرير')) + '</label>'
          + '<select><option>العربية</option><option>English</option><option>اردو</option></select></div>'
          + '</div>')
      + '<p class="hint">' + esc(t('التقرير يُبنى من الأرقام نفسها التي على الشاشة — فلا يفترق تقريرٌ عن لوحة.')) + '</p>';
      })();
    }
    var list = REPORTS.filter(function(r){ return r.side === EXP.repSide; });
    var pers = {};
    REPORTS.forEach(function(r){ pers[r.per] = (pers[r.per] || 0) + 1; });

    return '<div class="chips">' + repChips() + '</div>'

      + stats([['تقارير معرَّفة', N(REPORTS.length), 'acc'],
               ['يومية', N(pers['يومي'] || 0)],
               ['أسبوعية', N(pers['أسبوعي'] || 0)],
               ['شهرية', N(pers['شهري'] || 0)]])

      + list.map(function(r){
          var ready = r.sheets.filter(function(s){ return SHEETS[s]; });
          return card(r.i + ' ' + t(r.n),
            '<div class="pop-rows" style="margin:0">'
            + '<div><span class="k">' + esc(t('إلى')) + '</span><span>' + esc(t(r.to)) + '</span></div>'
            + '<div><span class="k">' + esc(t('الدورية')) + '</span><span>'
            +   pill(r.per, r.per==='يومي'?'acc':'') + '</span></div>'
            + '<div><span class="k">' + esc(t('موعده')) + '</span><span>' + esc(t(r.when)) + '</span></div>'
            + '<div><span class="k">' + esc(t('محتواه')) + '</span><span>' + esc(t(r.what)) + '</span></div>'
            + '<div><span class="k">' + esc(t('صيغته')) + '</span><span>' + esc(t(r.how)) + '</span></div>'
            + '<div><span class="k">' + esc(t('أوراقه')) + '</span><span>'
            +   ready.map(function(s){ return '<span class="pill">' + esc(t(SHEET_NAMES[s] || s)) + '</span>'; }).join(' ')
            +   '</span></div>'
            + '</div>',
            '<div class="actions">'
            + (may('exportAll') ? btn('⬇ ولّد التقرير','btn-primary btn-sm',' data-repgo="' + esc(r.id) + '"') : '')
            + btn('🖨 PDF','btn-secondary btn-sm',' data-print="1"')
            + '</div>');
        }).join('')

      + card('حزمةُ الجهة كاملةً',
          '<p class="hint" style="margin:0 0 12px">'
          + esc(t('كلُّ تقارير هذه الجهة في ملفٍّ واحدٍ بأوراقه — للأرشيف أو للمراجعة.'))
          + '</p>',
          may('exportAll')
            ? btn('📦 حزمة ' + (EXP.repSide==='co' ? t('الشركة') : t('الوزارة')),
                  'btn-primary',' data-reppack="' + EXP.repSide + '"')
            : '');
  })(); }
PAGE.exp = { m:'الأدوات', t:'التصدير والتقارير', l:'ما يخرج من النظام وما يدخل إليه — ومركزُ التقارير بدورياته.',
  body:function(){ var head = tabHead('exp'), cur = tabCur('exp'); return head + (cur === 'repcenter' ? repcenterBody() : PAGE.exp.body0()); },   /* (V27.1) مركزُ التقارير كان شريحةً في التقارير التنفيذية بمحتوى التصدير نفسِه */
  body0:function(){
    return regCard()   /* (V37.83) حمايةُ سجلّ النقاط — للأدمن */
      + card('ملف متابعة المشروع — بقالبه',
        '<p class="hint" style="margin:0 0 12px">'
        + esc(t('يُنزَّل الملفُ بقالبه كما هو — بتنسيقه الشرطيِّ وتعليقاتِه ومعادلاتِه — ولا يُكتَب فيه إلا نسبةُ الإنجاز في الصفوف الميدانية. والحالةُ والموقفُ الزمنيُّ والمتبقي يحسبها إكسلُ بنفسه عند الفتح.'))
        + '</p>'
        + '<div class="pop-rows" style="margin:0">'
        +   (function(){
              var done = 0, all = 0;
              FUP_ROWS.forEach(function(r){
                var p = fupPct(r[1], r[2], r[3], r[4]);
                if (p === null) return;
                all++; if (p > 0) done++;
              });
              return '<div><span class="k">' + esc(t('صفوفٌ يقرؤها النظام')) + '</span><span>'
                + nm(all) + ' ' + esc(t('من')) + ' ' + nm(FUP_ROWS.length) + '</span></div>'
                + '<div><span class="k">' + esc(t('فيها تقدّم')) + '</span><span>' + nm(done) + '</span></div>';
            })()
        + '</div>',
        btn('⬇ ملف المتابعة — محدَّثًا','btn-primary btn-sm',' data-fup="1"'))
      + card('تصدير تقرير اللوحة',
        '<p class="hint" style="margin:0 0 12px">'
        + esc(t('تسعةٌ وعشرون قسمًا قابلة للاختيار — إكسل ورقةً لكل قسم، أو PDF صفحةً لكل قسم برسمها.'))
        + '</p>'
        + '<div class="actions">'
        + btn('اختر الأقسام','btn-primary',' data-exp="1"')
        + btn('⬇ إكسل — الكل','btn-secondary',' data-xls="*"')
        + btn('🖨 PDF — الكل','btn-secondary',' data-print="1"')
        + '</div>')
      + card('تصديرات جاهزة',
          '<div class="actions">'
          + btn('🌍 KMZ — منى وعرفات','btn-secondary',' data-kmz="main"')
          + btn('🌍 KMZ — ' + t('الكل') + ' ' + nm((STATE.sites || []).length) + ' ' + t('نقطة'),'btn-secondary',' data-kmz="all"')   /* العددُ من السجلّ لا محفورًا (V22.2) */
          + btn('🌍 KMZ — إعادة تركيب ١٤٤٧','btn-secondary',' data-kmz="redo"')
          + btn('⬇ إكسل — المواقع','btn-secondary',' data-xls="sites"')
          + btn('⬇ إكسل — الشركات','btn-secondary',' data-xls="co"')
          + btn('⬇ إكسل — حركة المخزون','btn-secondary',' data-xls="invmv"')
          + btn('⬇ إكسل — أداء الفنيين','btn-secondary',' data-xls="techx"')
          + '</div>')
      + kmiCard()
      + importCard();
  }};

function pmToggle(col, op, role){
  if (!may('perms')){ toast(t('ضبطُ صلاحيات القاعدة للمهندس فما فوق')); return; }
  if (pmLocked(col, op, role)){ toast(t('ثابتٌ في القاعدة لا يُفتَح من هنا')); return; }
  if (!PM_DRAFT) PM_DRAFT = JSON.parse(JSON.stringify((CFG.perms && CFG.perms.m) || {}));
  PM_DRAFT[col] = PM_DRAFT[col] || {}; PM_DRAFT[col][role] = PM_DRAFT[col][role] || {};
  var ov = pmOverride(col, op, role);
  /* ضغطةٌ تقلب الافتراضيَّ إلى ضدّه، وضغطةٌ تعيده — null يعني افتراضيَّ القاعدة */
  PM_DRAFT[col][role][op] = (ov === null) ? !pmDefault(col, op, role) : null;
  render(1);
}

function pmSave(){
  if (!may('perms')){ toast(t('ضبطُ صلاحيات القاعدة للمهندس فما فوق')); return false; }
  if (!PM_DRAFT){ toast(t('لا تغييرَ يُحفَظ')); return false; }
  var m = PM_DRAFT, changed = 0;
  Object.keys(m).forEach(function(c){ Object.keys(m[c]).forEach(function(r){ Object.keys(m[c][r]).forEach(function(o){
    var v = m[c][r][o]; if (v === true || v === false) changed++;
  }); }); });
  var doc = { m:m, v:((CFG.perms && CFG.perms.v) || 0) + 1, at:Date.now(), by:STATE.meta.name || '' };
  CFG.perms = doc;
  CORE.set('cfg', 'perms', doc);
  PM_DRAFT = null;
  logEvent('مصفوفة صلاحيات القاعدة — ' + nm(changed) + ' خليةً معدَّلة · نسخة ' + nm(doc.v));
  toast(t('حُفظت — تنفذ في القاعدة الآن') + ' \u00b7 ' + nm(changed) + ' ' + t('خليةً معدَّلة'));
  render(1);
  return true;
}
function pmResetRole(role){
  if (!may('perms')){ toast(t('ضبطُ صلاحيات القاعدة للمهندس فما فوق')); return; }
  if (!PM_DRAFT) PM_DRAFT = JSON.parse(JSON.stringify((CFG.perms && CFG.perms.m) || {}));
  Object.keys(PM_DRAFT).forEach(function(c){
    if (PM_DRAFT[c][role]) Object.keys(PM_DRAFT[c][role]).forEach(function(o){ PM_DRAFT[c][role][o] = null; });
  });
  render(1);
}

/* المشرفُ والمهندسُ فقط — لا الفنيُّ ولا قائدُ فريقٍ ميدانيٍّ، رغم أن
   الثلاثةَ يرثون can.edit من «مشرف» فيجتازون may('edit') سواءً بسواء.
   نقاطُ الزيادة قرارُ من يشرف لا من يُنفَّذ له. */

function roleAdd(name, base, rank){
  if (!may('roles')){ toast(t('إضافةُ الأدوار لمدير المشروع وحده')); return false; }
  name = String(name || '').trim();
  if (!name){ toast(t('اكتب اسمَ الدور')); return false; }
  if (BASE_ROLES.indexOf(base) < 0){ toast(t('اختر الأساسَ من الأدوار الأساسية')); return false; }
  if (Object.keys(ROLES).some(function(k){ return ROLES[k].n === name; })){ toast(t('اسمُ الدور مستعملٌ من قبل')); return false; }
  var rk = cfgN(rank); if (!rk) rk = rankOf(base);
  if (rk > rankOf(ROLE)){ toast(t('لا تُنشئ دورًا أعلى من رتبتك')); return false; }
  var key = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  CFG.roles = CFG.roles || { r:{} }; CFG.roles.r = CFG.roles.r || {};
  CFG.roles.r[key] = { n:name, base:base, rank:rk, at:Date.now(), by:STATE.meta.name || '' };
  CFG.roles.v = (CFG.roles.v || 0) + 1; CFG.roles.at = Date.now();
  CORE.set('cfg', 'roles', CFG.roles);
  rolesApply();
  logEvent('دور جديد — ' + name + ' · ' + t('يرث') + ' ' + ROLES[base].n + ' · ' + t('رتبة') + ' ' + nm(rk));
  toast(t('أُضيف الدور') + ' ' + name + ' — ' + t('تنفذ في القاعدة الآن'));
  render(1);
  return key;
}
function roleDel(k){
  if (!may('roles')){ toast(t('حذفُ الأدوار لمدير المشروع وحده')); return false; }
  if (!ROLES[k] || !ROLES[k].custom){ toast(t('الأدوارُ الأساسيةُ لا تُحذَف')); return false; }
  var nU = roleUsers(k);
  if (nU){ toast(t('لا يُحذَف دورٌ عليه حسابات') + ' — ' + nm(nU)); return false; }
  var nm2 = ROLES[k].n;
  delete CFG.roles.r[k]; CFG.roles.v = (CFG.roles.v || 0) + 1; CFG.roles.at = Date.now();
  CORE.set('cfg', 'roles', CFG.roles);
  if (CFG.roleCaps && CFG.roleCaps[k]){ delete CFG.roleCaps[k]; CORE.set('cfg', 'roleCaps', CFG.roleCaps); }
  rolesApply();
  logEvent('حذف دور — ' + nm2);
  toast(t('حُذف الدور') + ' ' + nm2);
  render(1);
  return true;
}
/* خليةٌ في مصفوفة القاعدة تُكتَب صراحةً وتُحفَظ فورًا — من تبديل قدرةٍ في شاشة الأدوار */
function pmSetDirect(col, op, role, val){
  var m = JSON.parse(JSON.stringify((CFG.perms && CFG.perms.m) || {}));
  m[col] = m[col] || {}; m[col][role] = m[col][role] || {}; m[col][role][op] = !!val;
  var doc = { m:m, v:((CFG.perms && CFG.perms.v) || 0) + 1, at:Date.now(), by:STATE.meta.name || '' };
  CFG.perms = doc; PM_DRAFT = null;
  CORE.set('cfg', 'perms', doc);
}

/* من يصلح مديرًا لصاحب هذا الدور: كلُّ حسابٍ مرتبتُه أعلى منه */

   /* اسمٌ قديم — النقاطُ للمهندس فما فوق */
/* القدرةُ المعلنةُ تُسأل هنا: كانت `can` تعلن إحدى عشرةَ قدرةً ولا يُسأل منها
   إلا أربع، فسبعٌ إعلانٌ بلا حارس. وكلُّ شاشةٍ ترتبط بقدرتها فيُسأل عنها. */
/* «موقع جديد» في قائمة كلِّ دورٍ ميدانيٍّ يملك التسجيل (V16.80): كان الزرُّ
   يُعرَض على الخريطة لمن يملك «edit»، والصفحةُ ليست في قائمته — فيُردُّ إلى
   أوّلِ شريحةٍ مرئيةٍ من «النماذج» وهي «المسح»، فيجد المشرفُ نموذجَ مسحٍ مكان
   نموذج الموقع الجديد. الزرُّ يُعرَض والصفحةُ تُرى — أو لا يُعرَض. */
var PAGE_CAP = {
  /* «الملخّص المالي» شاشةُ العميل لا شاشةُ الشركة: المستخلصُ المعتمَدُ وحده
     يراه، وهو مصرَّحٌ له في nav — فلا يُقيَّد بقدرة المال الداخلية. */
  ipc:'money', buys:'money', trials:'money', budget:'money', exec:'money',
  /* البلاغات: يراها من يبلّغ ومن يُصلح — لا قدرةَ خاصةً لها */
  invb:'inventory', invmv:'inventory', stock:'inventory',
  wos:'workshop', wday:'workshop',
  /* شاشةُ الحسابات كانت مقيَّدةً بقدرة الإنشاء وحدَها — فمن يقرأ ولا يُنشئ
     (الوزارةُ) لا يراها. صار القيدُ في القائمة (nav) والصفوفُ في canSeeUser،
     والأزرارُ في قدراتها — فتُقرأ بلا أن تُكتَب. */
  perms:'perms', assignRole:'users', roles:'users',
  svForm:'edit', insForm:'edit', newsite:'propose',
  qa:'approve', appr:'approve', esc:'approve', svappr:'approve',
  visits:'settings', prep:'settings', asm:'settings', install:'settings',
  disp:'settings', items:'settings', buycat:'settings', sup:'settings', consts:'settings',
  exp:'exportAll', retain:'delete', sync:'settings'
};
/* ═══ الصفحاتُ المدموجة — شرائحُ لا شاشات ═══
   أربعٌ وتسعون شاشةً في اثنتي عشرةَ مجموعة، وكثيرٌ منها يجيب سؤالًا واحدًا
   لشخصٍ واحد: «السيارات» و«إسناد السيارات» و«سجل عهدة السيارات» و«تكلفة
   الأسطول» و«سيارتي» — خمسُ شاشاتٍ عن الأسطول، يفتحها المرءُ بالتناوب يبحث
   عن رقمه. فجُمع ما يجيب سؤالًا واحدًا في شاشةٍ واحدةٍ بشرائح.

   ولم يُحذَف شيء: كلُّ شريحةٍ كانت صفحةً واحتفظت بمعرِّفها القديم — في
   قوائم الأدوار، وفي PAGE_CAP، وفي كلِّ زرِّ انتقالٍ (data-p / data-goto /
   CUR=). فلا تتغيّر صلاحيةُ أحدٍ ولا ينكسر رابط: المعرِّفُ القديم يُفتَح فيصل
   إلى الأمِّ على شريحته. والشريحةُ لا تظهر إلا لمن كان يرى صفحتَها — بقواعد
   seesPage نفسِها لا بقائمةٍ ثانية.

   كلُّ شريحة: [المعرِّفُ القديم، الاسمُ القصير، الأيقونة، وصفُ الصفحة الأصلية] */

          /* معرِّفُ الشريحة → أمُّها */
function tabsInit(){
  Object.keys(TABS).forEach(function(pid){
    TABS[pid].forEach(function(tb){ PARENT[tb[0]] = pid; });
  });
}
tabsInit();

