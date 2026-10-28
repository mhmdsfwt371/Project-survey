/* ============================================================================
   FILE    : src/08-events/08-data-events-boot-04-weights-zones.js
   DOMAIN  : Data & events — settings, users, click handlers, boot
   PURPOSE : Weight rows, zones from one source, display-name fixes and the constants card (incl. pending-upload limit).
   DEFINES : zoneList, zoneOptions, zoneRename, mxTypeMove, mxRowInfo, halves, mxTable, prepAsm
   GLOBALS : ZONE_CODE
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ صفُّ الوزن يُدار كاملًا: المشعرُ والنوعُ والوزنُ والحذف ══════════════
   كان الصفُّ يعرض المشعرَ والنوعَ نصًّا ويُعدَّل وزنُه وحدَه. فمن أراد أن
   يصحّح اسمَ مشعرٍ أو ينقل نوعًا لم يجد أين — والإضافةُ موجودةٌ والتصحيحُ لا.

   وإعادةُ تسمية المشعر ليست تسميةَ صفٍّ: هي تسميةُ كلِّ موقعٍ فيه. فتُكتَب
   المواقعُ كلُّها ويُقال كم كُتب — ولا تقع بلا علم. */

function zoneList(){
  var out = [];
  (STATE.sites || []).forEach(function(x){ if (x.zone && out.indexOf(x.zone) < 0) out.push(x.zone); });
  return out.sort(arCmp);
}
/* ═══ المشاعرُ من مصدرٍ واحد (V17.72) ═══
   كانت قوائمُ المشعر مكتوبةً بيد في ثلاثة مواضع — نموذجُ الموقع الجديد
   (ثلاثة مشاعر) ولوحُ الرسم والاستيرادُ (خمسة) — فمن أعلن مشعرًا جديدًا في
   مصفوفة الأوزان لم يجده حين يضيف نقطة. فصارت القائمةُ تُشتقُّ من الأساسية
   ومما أُعلن ومما في المواقع، ورمزُ المعرِّف من دالةٍ واحدة. */
function zoneOptions(){
  var out = PV.MX_ZONES.slice();
  var add = function(z){ z = String(z || '').trim(); if (z && out.indexOf(z) < 0) out.push(z); };
  ['مكة', 'المدينة', 'مواقع التفويج'].forEach(add);   /* (V29.7) مراكزُ التفويج تُختار دائمًا */
  zoneList().forEach(add);
  /* المعلَنُ في مصفوفة الأوزان يُخزَّن «مشعر|نوع» */
  (Array.isArray(CFG.mxExtra) ? CFG.mxExtra : []).forEach(function(x){ add(String(x || '').split('|')[0]); });
  return out;
}
PV.ZONE_CODE = { 'منى':'MIN', 'عرفات':'ARF', 'مزدلفة':'MUZ', 'مكة':'MAK', 'المدينة':'MAD', 'مواقع التفويج':'TFW', 'النوارية':'NWR' };

function zoneRename(oldName, newName){
  if (!may('settings')){ toast(t('المشاعرُ للمهندس وحده')); return; }
  newName = String(newName || '').trim();
  if (!newName || newName === oldName) return;
  if (zoneList().indexOf(newName) > -1){ toast(t('المشعرُ موجودٌ بالفعل')); return; }
  var n = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.zone !== oldName) return;
    x.zone = newName; n++;
    CORE.set('sites', x.id, { zone:newName });
  });
  /* الأوزانُ المخزَّنةُ بمفتاحٍ فيه اسمُ المشعر تُنقَل معه */
  ['w','dw'].forEach(function(p){
    var o = CFG[p] || {};
    Object.keys(o).forEach(function(k){
      if (k.indexOf(oldName + '|') !== 0) return;
      var nk = newName + k.slice(oldName.length);
      o[nk] = o[k]; delete o[k];
      CORE.set('cfg', p, o);
    });
  });
  SITE_IX = null; SITE_TOK = null;
  statBump();
  logEvent('إعادة تسمية مشعر — ' + oldName + ' → ' + newName + ' · ' + n + ' موقعًا');
  toast(nm(n) + ' ' + t('موقعًا نُقل إلى') + ' ' + newName);
  render(1);
}
/* نقلُ نوعِ صفٍّ: كلُّ مواقع هذا المشعر من هذا النوع تصير نوعًا آخر */
function mxTypeMove(zone, label, newType){
  if (!may('settings')){ toast(t('الأنواعُ للمهندس وحده')); return; }
  var T = typesList(), oldType = '';
  Object.keys(T).forEach(function(k){ if (T[k].l === label) oldType = k; });
  if (!oldType || oldType === newType) return;
  var n = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.zone !== zone || x.type !== oldType) return;
    x.type = newType; n++;
    CORE.set('sites', x.id, { type:newType });
  });
  SITE_IX = null; SITE_TOK = null;
  statBump();
  logEvent('نقل نوع — ' + zone + '/' + label + ' → ' + (T[newType] || {}).l + ' · ' + n);
  toast(nm(n) + ' ' + t('موقعًا نُقل إلى') + ' ' + ((T[newType] || {}).l || newType));
  render(1);
}


function mxRowInfo(zone, label){
  var T = typesList(), tk = '';
  Object.keys(T).forEach(function(k){ if (T[k].l === label) tk = k; });
  return (STATE.sites || []).filter(function(x){
    return x.zone === zone && x.type === tk;
  }).length;
}

/* الصفُّ الكامل — يُستعمَل في «نقاط الزيارات» و«نقاط الفك» */
/* يشطر صفوفَ جدولٍ نصفين متجاورين حين يطول: أقلُّ من عشرةٍ يبقى واحدًا،
   فالقسمةُ لما لا يستحقُّ تُشتّت لا تُريح. */
function halves(title, head, rows, right){
  if (rows.length < 10) return cardFlush(title, table(head, rows), right);
  var m = Math.ceil(rows.length / 2);
  return cardFlush(title,
    '<div class="halves">'
    + '<div>' + table(head, rows.slice(0, m)) + '</div>'
    + '<div>' + table(head, rows.slice(m)) + '</div>'
    + '</div>', right);
}

function mxTable(path, label){
  /* عمودٌ لكلِّ مشعر: كان جدولًا واحدًا ضيّقًا يترك نصفَ الشاشة فارغًا ويطول
     نزولًا — فيُمرَّر كثيرًا ليُقرأ قليل. والمشاعرُ تُقارَن بنظرةٍ واحدة كما
     يُقارَن الممرُّ بالمخيم في شاشة التركيب. */
  var T = typesList(), byZone = {};
  mxRows().forEach(function(r){ (byZone[r[0]] = byZone[r[0]] || []).push(r); });
  var typeOpts = function(cur){
    return Object.keys(T).map(function(k){
      return '<option value="' + esc(k) + '"' + (T[k].l === cur ? ' selected' : '') + '>'
        + esc(t(T[k].l)) + '</option>';
    }).join('');
  };
  var Z = zoneList();
  return '<div class="grid cols-2" style="align-items:start">'
    + Object.keys(byZone).map(function(z){
        var L = byZone[z];
        return cardFlush(t(z) + ' — ' + nm(L.length) + ' ' + t('صنفًا'),
          table(['النوع', label, ''],
            L.map(function(r){
              var n = mxRowInfo(r[0], r[1]);
              /* الحذفُ يُلغي التركيبةَ من هذه البطاقة — لا النوعَ من
                 النظام كلِّه. كان يستدعي `typeDel` بالاسم المعروض، وهو خطأٌ
                 نجا بالمصادفة لأن المفتاح لا يطابق، لا لأنه صحيح. */
              return [may('settings')
                        ? '<select data-mxt="' + esc(r[0] + '|' + r[1]) + '">' + typeOpts(r[1]) + '</select>'
                        : esc(t(r[1])),
                      cfgInput(path, r[0] + '|' + r[1], { dec:1 }),
                      n ? '' : (may('settings')
                            ? btn('حذف','btn-quiet btn-sm',' data-mxdel="' + esc(r[0] + '|' + r[1]) + '"') : '')];
            })),
          may('settings')
            ? '<input value="' + esc(z) + '" data-mxz="' + esc(z) + '" dir="auto" '
              + 'style="max-width:150px" aria-label="' + esc(t('اسم المشعر')) + '">'
            : '');
      }).join('')
    + '</div>'
    /* إعلانُ تركيبةٍ جديدة: مشعرٌ فنوعٌ لم يقع فيه موقعٌ بعد — ليُضبَط
       وزنُه قبل وصول أول نقطةٍ منه، كإضافة كاميرات الوزارة في مشعرٍ لم
       تُسجَّل فيه بعد. */
    + (may('settings')
      ? card('إضافة تركيبة إلى مشعر',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('المشعر')) + '</label>'
          +   '<select id="mxdZ">'
          +   Z.map(function(z){ return '<option value="' + esc(z) + '">' + esc(t(z)) + '</option>'; }).join('')
          +   '<option value="__new">' + esc(t('مشعرٌ جديد…')) + '</option>'
          +   '</select></div>'
          + '<div class="field" id="mxdZnWrap" style="display:none">'
          +   '<label>' + esc(t('اسم المشعر الجديد')) + '</label><input id="mxdZn" dir="auto"></div>'
          + '<div class="field"><label>' + esc(t('النوع')) + '</label>'
          +   '<select id="mxdT">' + typeOpts('') + '</select></div>'
          + '</div>',
          btn('➕ ' + t('إضافة'),'btn-primary btn-sm',' data-mxdadd="1"'))
      : '')
    + '<p class="hint">'
    + esc(t('الوزنُ لكلِّ نقطةٍ من هذه التركيبة — لا لعددها. والعددُ يتغيّر: ما يُمسَح يزيد، وما يُهيَّأ يتبع المسحَ، وما يُركَّب يتبع المسحَ، وما يُفَكُّ يتبع التركيب. وتعديلُ اسم المشعر في رأس عموده يُعيد تسميتَه في كلِّ مواقعه، وتبديلُ النوع ينقلها إليه. والتركيبةُ التي لا مواقعَ عليها تُضاف وتُحذَف بحرّية — فهي إعلانٌ لا سجلّ.'))
    + '</p>';
}

PAGE.pts = { m:'التخطيط', t:'نقاط المراحل',
  l:'وزنُ كلِّ مرحلةٍ ونقاطُها — زيارةٌ وتهيئةٌ وتجميعٌ وتركيبٌ وفك.',
  body:function(){
    var head = tabHead('pts'), cur = tabCur('pts');
    if (cur === 'prep') return head + (function(){ return prepAsm('prep'); })();
    if (cur === 'asm') return head + (function(){ return prepAsm('asm'); })();
    if (cur === 'install') return head + (function(){
    /* الممرُّ قصادَ المخيم: عمودان تُقارَن بهما القائمتان بنظرةٍ واحدة */
    return '<div class="grid cols-2" style="align-items:start">'
      + [['cor','الممر'],['camp','المخيم']].map(function(g){
          var L = itemsList().filter(function(x){ return x.z === g[0]; });
          return '<div>' + cardFlush(t(g[1]) + ' — ' + nm(L.length) + ' ' + t('قطعة'),
            L.length
              ? table(may('settings') ? ['القطعة','النقاط',''] : ['القطعة','النقاط'],
                  L.map(function(it){
                    var row = ['<input value="' + esc(it.name) + '" data-itname="' + esc(it.code) + '" dir="auto">',
                               cfgInput('itPts', it.code, { dec:1 })];
                    if (may('settings'))
                      row.push(btn('حذف','btn-quiet btn-sm',' data-itdel="' + esc(it.code) + '"'));
                    return row;
                  }))
              : '<p class="hint" style="text-align:center;margin:0;padding:16px">'
                + esc(t('لا قطع في هذه المنطقة.')) + '</p>') + '</div>';
        }).join('')
      + '</div>'
      + (may('settings') ? insRecalcCard() : '')   /* (V37.77) إعادةُ الاحتساب بأثرٍ رجعيٍّ معلَن */
      + (may('settings')
        ? card('أضِف صنفًا جديدًا',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('المنطقة')) + '</label>'
            +   '<select id="itZ"><option value="camp">' + esc(t('مخيم')) + '</option>'
            +   '<option value="cor">' + esc(t('ممر')) + '</option></select></div>'
            + '<div class="field"><label>' + esc(t('اسم القطعة')) + ' <span class="req">*</span></label>'
            +   '<input id="itN" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('نقاط تركيبها')) + '</label>'
            +   '<input id="itS" type="number" step="0.5" min="0" value="1"></div>'
            + '</div>',
            btn('➕ إضافة صنف','btn-primary btn-sm',' data-stgadd="itPts"'))
        : '')
      /* كان الوزنُ لنوعين: مخيمٌ وممر. والأنواعُ سبعةٌ — فمحطةُ القطارِ
         وبوابةُ المسجدِ ودورُ الجمرات تأخذ وزنَ الممر بلا أن يختارَه أحد.
         صار لكلِّ نوعٍ وزنُه كما في نقاط الزيارة. */
      + cardFlush('نقاط النقطة الكاملة — لكلِّ نوع',
          table(['النوع','نقاط التركيب'],
            Object.keys(CAT_DEF).map(function(ty){
              return [typeLabel(ty), cfgInput('insType', ty, { dec:1, step:'0.1' })];
            }))
          + '<p class="hint" style="padding:0 16px 14px">'
          + esc(t('نقاطُ تركيب النقطة الكاملة — يُقاس بها إنجاز الفني، وتُجمَع من نقاط قطعها. وما تُرك صفرًا يرجع للوزن العام أدناه.')) + '</p>',
          btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + card('الوزن العام — لما لم يُضبط نوعُه',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('نقاط تركيب المخيم')) + '</label>'
          +   cfgInput('insCamp', undefined, { dec:1, step:'0.1' }) + '</div>'
          + '<div class="field"><label>' + esc(t('نقاط تركيب الممر')) + '</label>'
          +   cfgInput('insCor', undefined, { dec:1, step:'0.1' }) + '</div>'
          + '</div>'
          + '<p class="hint">' + esc(t('يُستعمَل حين لا يُضبَط وزنُ النوع أعلاه — فلا ينكسر ما ضُبط قبل هذا الإصدار.')) + '</p>',
          btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + tgtBlock('tgtInsCamp', 'tgtInsCor');
  })();
    if (cur === 'disp') return head + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('الفكّ'),'btn-secondary btn-sm',' data-xls="dismantles"') + '</div>' + (function(){
    /* عمودُ «النقاط» كان يعرض وزنَ الزيارة المكتوبَ في الإعدادات — وليس هو
       ما يُفَكّ. الفكُّ يقع على ما رُكِّب فعلًا في الأرض، فيُجمَع تراكميًّا على
       مدار الموسم: كلُّ تركيبٍ معتمَدٍ يضيف قطعَه إلى مشعره ونوعه. فيقرأ
       المخطِّطُ ما ينتظره في كلِّ مكانٍ لا ما قدّره قبل أن يبدأ الموسم. */
    var built = {};
    Object.keys(STATE.inss || {}).forEach(function(id){
      var r = STATE.inss[id];
      if (!r || r.status !== 'مُركّب' || !r.approved) return;
      var x = siteFind(id); if (!x) return;
      var k = x.zone + '|' + catLabel(x), n = 0;
      Object.keys(r.parts || {}).forEach(function(p){ n += (+r.parts[p] || 0); });
      built[k] = (built[k] || 0) + n;
    });
    var anyBuilt = Object.keys(built).length > 0;
    return typesCard() + mxTable('dw', t('وزن الفك'))
      + cardFlush('قِطَعٌ رُكّبت',
        table(['المشعر','النوع','قِطَعٌ رُكّبت'],
          mxRows().map(function(r){
            var k = r[0] + '|' + r[1];
            return [esc(t(r[0])), esc(t(r[1])),
                    built[k] ? '<span class="num">' + N(built[k]) + '</span>' : '—'];
          })),
        '<p class="hint" style="margin:0">'
        + esc(t(anyBuilt
            ? 'عمودُ القطع يتراكم من التركيب المعتمَد على مدار الموسم — ولا يُكتَب بيد.'
            : 'عمودُ القطع يبقى فارغًا حتى يُعتمَد أولُ تركيب — ثم يتراكم من الأرض.'))
        + '</p>')
      + card('التارجت والمعاملان',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('تارجت الفك الشهري')) + '</label>'
          +   cfgInput('tgtDis') + '</div>'
          + '<div class="field"><label>' + esc(t('معامل السليم')) + '</label>'
          +   cfgInput('disOk', undefined, { dec:1, step:'0.05' }) + '</div>'
          + '<div class="field"><label>' + esc(t('معامل التالف')) + '</label>'
          +   cfgInput('disBad', undefined, { dec:1, step:'0.05' }) + '</div>'
          + '</div>', btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + '<p class="hint">' + esc(t('المعاملان يضربان وزن الفك بحسب حالة الجهاز المفكوك — فيتساوى الجهدُ ويختلف الناتج.')) + '</p>';
  })();
    return head + (function(){
    return typesCard() + mxTable('w', t('وزن الزيارة'))
      + card('التارجت',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('تارجت المسح الشهري')) + '</label>'
          +   cfgInput('tgtSurvey') + '</div>'
          + '<div class="field"><label>' + esc(t('تارجت المسح الأسبوعي')) + '</label>'
          +   cfgDerived(cfgWk(cfgGet('tgtSurvey'))) + '</div>'
          + '</div>')
      + '<p class="hint">' + esc(t('لا قيمةَ افتراضية: كل وزنٍ يبدأ صفرًا وتضبطه أنت — وما تكتبه هنا يسري فورًا على المسح والفنيين والتقارير.')) + '</p>';
  })();
  }};

function prepAsm(pg){
  var get = pg === 'prep' ? itPrep : itAsm;
  var path = pg === 'prep' ? 'itPrep' : 'itAsm';
  var on = itemsList().filter(function(i){ return get(i.code) > 0; });
  var tot = on.reduce(function(a,i){ return a + get(i.code); }, 0);
  var h = '<p class="lede" style="margin:0 0 16px">' + esc(t(pg === 'prep'
      ? 'التهيئة عملُ الورشة قبل النزول: ضبط الجهاز وعنوانه ونظامه وفحصه. وهي للأجهزة ذات الإعداد وحدها — الكاميرات والقارئات والراوترات والحساسات والجيت واي.'
      : 'التجميع تركيب ما يدخل البوكس وتوصيله قبل النزول. وهو للمكوّنات التي تُجمَّع داخله وحدها.'))
    + '</p>';
  if (!on.length){
    h += card('', '<p class="hint" style="text-align:center;margin:0">'
      + esc(t(pg==='prep'?'لا أجهزة في التهيئة بعد.':'لا مكوّنات في التجميع بعد.')) + '</p>');
  } else {
    h += stats([[pg==='prep'?'أجهزة في التهيئة':'مكوّنات في التجميع', N(on.length), 'acc'],
                ['إجمالي النقاط', N(tot)]])
      + cardFlush((pg==='prep'?'أجهزة التهيئة':'مكوّنات التجميع') + ' — ' + nm(on.length),
          table(['الجهاز','المنطقة','النقاط',''],
            on.map(function(i){
              return ['<input value="' + esc(i.name) + '" data-itname="' + esc(i.code) + '" dir="auto">',
                      esc(t(i.z==='cor'?'ممر':'مخيم')),
                      cfgInput(path, i.code, { dec:1 }),
                      (may('settings')
                        ? btn('أخرِج من المرحلة','btn-quiet btn-sm',
                              ' data-stgout="' + esc(path + '|' + i.code) + '"')
                          + btn('احذف الصنف','btn-quiet btn-sm',' data-itdel="' + esc(i.code) + '"')
                        : '')];
            })));
  }
  h += (may('settings')
      ? card((pg === 'prep' ? 'أضِف صنفًا جديدًا للتهيئة' : 'أضِف صنفًا جديدًا للتجميع'),
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('المنطقة')) + '</label>'
          +   '<select id="itZ"><option value="camp">' + esc(t('مخيم')) + '</option>'
          +   '<option value="cor">' + esc(t('ممر')) + '</option></select></div>'
          + '<div class="field"><label>' + esc(t('اسم القطعة')) + ' <span class="req">*</span></label>'
          +   '<input id="itN" dir="auto"></div>'
          + '<div class="field"><label>' + esc(t('نقاط هذه المرحلة')) + '</label>'
          +   '<input id="itS" type="number" step="0.5" min="0" value="1"></div>'
          + '</div>',
          btn('➕ إضافة صنف','btn-primary btn-sm',' data-stgadd="' + path + '"'))
      : '')
     + cfgAddStage(path, pg)
     + tgtBlock(pg === 'prep' ? 'tgtPrepCamp' : 'tgtAsmCamp',
                pg === 'prep' ? 'tgtPrepCor'  : 'tgtAsmCor');
  if (pg === 'prep')
    h += '<p class="hint">' + esc(t('الهوائي والبطارية والكابل قطعٌ سلبيةٌ لا تُهيَّأ، فلا تظهر هنا أصلًا.')) + '</p>';
  return h;
}


PAGE.items = { m:'الإعدادات', t:'الكتالوج والقوائم',
  l:'ما نشتريه وممّن — والثوابتُ وأسماءُ العرض وأنواعُ السيارات.',
  body:function(){
    var head = tabHead('items'), cur = tabCur('items');
    if (cur === 'consts') return head + ghCard() + hoSetupCard() + costGuardCard() + fontsCard() + gmapsCard() + (function(){
    return card('الثوابت',
        '<div class="grid cols-3">'
        + '<div class="field"><label>' + esc(t('أيام العمل في الشهر')) + '</label>'
        +   cfgInput('days') + '</div>'
        + '<div class="field"><label>' + esc(t('ساعات العمل في اليوم')) + '</label>'
        +   cfgInput('hours') + '</div>'
        + '<div class="field"><label>' + esc(t('أيام العمل في الأسبوع')) + '</label>'
        +   cfgInput('daysWeek', undefined, { max:7 }) + '</div>'
        /* (V38.30) قرارُ المالك: ما ينتظر الرفع أكثرَ من هذه الأيام يُتجاهَل (يُحفَظ على الجهاز للتصدير) — ٠ = لا تجاهل */
        + '<div class="field"><label>' + esc(t('مهلة ما ينتظر الرفع (أيام — ٠ = لا تجاهل)')) + '</label>'
        +   cfgInput('queueTtl', undefined, { max:365 }) + '</div>'
        + '</div>'
        + '<div class="alert info" style="margin:4px 0 0"><span>'
        +   esc(t('ساعات الشهر القياسية')) + ': <b>' + nm(cfgGet('days')*cfgGet('hours')) + '</b> ' + esc(t('ساعة')) + '</span></div>',
        btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + catsCard()   /* (V37.4) طلبُ المالك: المسمّياتُ وجهاتُ الحل */
      + assistQCard()   /* (V37.38) أسئلةُ الناس للمساعد */
      + knownCard()   /* (V37.27) المشاكلُ المعروفة للمساعد */
      + card('القوائم — تُعدَّل من هنا لا من الشيفرة',   /* (V30.3) فكرةُ المالك #٤ */
          '<p class="hint" style="margin-top:0">' + esc(t('كلُّ سطرٍ بندٌ. اتركِ المربعَ فارغًا لتعود القائمةُ الأصلية. ما سُجّل من قبلُ بنصٍّ قديمٍ يبقى مقروءًا.')) + '</p>'
          + '<div class="grid cols-2">'
          + [['chalsCamp', 'تحديات المخيمات', CH_CAMP], ['chalsPath', 'تحديات الممرات وسائر النقاط', CH_PATH], ['reasonsCamp', 'أسباب إضافة مخيم غير مسجّل', PV.NS_REASONS], ['reasonsPt', 'أسباب إضافة نقطة غير مسجّلة', PV.NS_REASONS_PT]].map(function(L){
              var cur = (CFG.lists && Array.isArray(CFG.lists[L[0]]) && CFG.lists[L[0]].length) ? CFG.lists[L[0]] : [];
              return '<div class="field"><label>' + esc(t(L[1])) + ' <span class="hint">(' + esc(t('الأصلية')) + ' ' + nm(L[2].length) + ')</span></label><textarea data-lists="' + L[0] + '" rows="6" dir="auto" placeholder="' + esc(L[2].map(function(x){ return t(x); }).join('\n')) + '">' + esc(cur.join('\n')) + '</textarea></div>'; }).join('')
          + '</div>',
          btn('حفظ القوائم','btn-primary btn-sm',' data-listsok="1"'))
      + card('قواعد التنبيه (بالأيام)',   /* (V30.1) فكرةُ المالك #٢ — صفرٌ يعطّل القاعدة */
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('معوّق مفتوح أكثر من')) + '</label>' + cfgInput('alObsDays') + '</div>'
          + '<div class="field"><label>' + esc(t('تصريح دخول معلّق أكثر من')) + '</label>' + cfgInput('alPermitDays') + '</div>'
          + '<div class="field"><label>' + esc(t('أُعيدت للزيارة ولم تُزَر أكثر من')) + '</label>' + cfgInput('alRevisitDays') + '</div>'
          + '<div class="field"><label>' + esc(t('ممسوحة بلا صور أكثر من')) + '</label>' + cfgInput('alNoPhotoDays') + '</div>'
          + '<div class="field"><label>' + esc(t('مُسندة ولم تُزَر أكثر من')) + '</label>' + cfgInput('alAssignDays') + '</div>'
          + '<div class="field"><label>' + esc(t('تعذّر الوصول بلا محاولة أكثر من')) + '</label>' + cfgInput('alStaleDays') + '</div>'
          + '</div><p class="hint">' + esc(t('تظهر التنبيهاتُ في متابعة الوزارة ← الملخص وفي الملخّص التنفيذي، وكلُّ تنبيهٍ يفتح قائمتَه ويُصدَّر. صفرٌ يعطّل القاعدة.')) + '</p>',
          btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + card('سعر النقطة والإضافي',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('سعر النقطة')) + ' (' + t('ريال') + ')</label>'
          +   cfgInput('ph', undefined, { dec:1, step:'0.01' }) + '</div>'
          + '<div class="field"><label>' + esc(t('معامل الإضافي')) + '</label>'
          +   cfgInput('otRate', undefined, { dec:1, step:'0.05' }) + '</div>'
          + '</div>'
          + '<p class="hint">' + esc(t('تارجتُ المرحلة مقسومًا على أيام الشهر هو سقفُ اليوم — وما زاد عنه يُحتسب إضافيًّا بهذا المعامل. صفرٌ يعني بلا احتساب إضافي.')) + '</p>')
      + card('وزن المراحل في النقطة',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('التهيئة')) + ' ' + t('٪') + '</label>'
          +   cfgInput('stgCfg', undefined, { max:100 }) + '</div>'
          + '<div class="field"><label>' + esc(t('التجميع')) + ' ' + t('٪') + '</label>'
          +   cfgInput('stgVal', undefined, { max:100 }) + '</div>'
          + '<div class="field"><label>' + esc(t('التركيب')) + ' ' + t('٪') + '</label>'
          +   cfgInput('stgIns', undefined, { max:100 }) + '</div>'
          + '</div>'
          + '<div class="alert '
          + ((cfgGet('stgCfg') + cfgGet('stgVal') + cfgGet('stgIns')) === 100 ? 'success' : 'warn')
          + '" style="margin:4px 0 0"><span>' + esc(t('المجموع')) + ': <b>'
          + nm(cfgGet('stgCfg') + cfgGet('stgVal') + cfgGet('stgIns')) + '٪</b></span></div>'
          + '<p class="hint">' + esc(t('النقطة الواحدة تُقسَّم على مراحلها الثلاث — فمن هيّأ يأخذ نصيبه ومن جمّع نصيبه ومن ركّب نصيبه. والمجموع مئةٌ دائمًا.')) + '</p>',
          btn('حفظ','btn-primary btn-sm',' data-cfgok="1"'))
      + '<p class="hint">' + esc(t('هذه الثوابت يُشتقّ منها التارجت الأسبوعي من الشهري، وتقديرُ الأزمنة في التخطيط.')) + '</p>';
  })();
    if (cur === 'names') return head + (function(){
    var seen = {};
    function add(x){ if (x && /[\u0600-\u06FF]/.test(x)) seen[x] = 1; }
    techsList().forEach(function(x){ add(x.n); add(x.sup); });
    crewsList().forEach(function(x){ add(x.n); });
    (STATE.sites || []).forEach(function(x){ add(x.co); });
    add(STATE.meta.name);
    var L = Object.keys(seen).sort();
    var fix = CFG.nameEn || {};
    var done = L.filter(function(k){ return fix[k]; }).length;

    return stats([['أسماءٌ في النظام', N(L.length), 'acc'],
                  ['صُحّحت يدويًّا', N(done), done ? 'ok' : ''],
                  ['تُنقحَر آليًّا', N(L.length - done)]])

      + card('كيف تعمل',
          '<p class="hint" style="margin:0">'
          + esc(t('الاسمُ لا يُترجَم بل يُنقحَر: «محمد صفوت» تُكتَب Mohamed Safwat كما في جواز السفر. والنقحرةُ حسابٌ محليٌّ يجري في اللحظة — فمن يُضاف غدًا يُقرأ بالإنجليزية فورَ إضافته بلا تدخّل. والأرديةُ تُكتَب بالحرف العربيِّ نفسِه فيبقى الاسمُ كما هو.'))
          + '</p>')

      + (L.length
        ? cardFlush('الأسماء — ' + nm(L.length),
            table(['الاسم كما كُتب','كما يُقرأ بالإنجليزية','تصحيحُك'],
              capList(L, 300).map(function(k){
                return ['<strong>' + esc(k) + '</strong>',
                        '<span class="hint" style="margin:0">' + esc(dispName(k)) + '</span>',
                        may('settings')
                          ? '<input value="' + esc(fix[k] || '') + '" data-nmen="' + esc(k)
                            + '" dir="ltr" placeholder="' + esc(dispName(k)) + '">'
                          : esc(fix[k] || '—')];
              })))
        : card('', alertBox('info','لا أسماءَ عربيةً في النظام بعد.')))

      + '<p class="hint">ما يُكتَب هنا لا يمسُّ الاسمَ المخزَّن — يغيّر قراءتَه بالإنجليزية وحدها، فلا تنكسر السجلاتُ ولا التقارير.</p>';
  })();
    if (cur === 'vehkind') return head + (function(){
    var K = vehKinds(), V = vehList();
    var byKind = {}, costKind = {};
    V.forEach(function(v){
      byKind[v.kind] = (byKind[v.kind] || 0) + 1;
      costKind[v.kind] = (costKind[v.kind] || 0) + (+v.cost || 0);
    });
    return '<p class="lede" style="margin:0 0 16px">' + esc(t('النوعُ يُضاف هنا، والعددُ يُشتقُّ مما أُضيف من كلِّ نوعٍ في «السيارات» — لا يُكتَب بيدٍ فيتجمّد. والسعةُ عددُ من تحملهم، وبها تُحسَب حاجةُ الفرق.')) + '</p>'

      + stats([['أنواع', N(K.length)],
               ['في الأسطول', N(V.length)],
               ['تكلفةٌ شهرية', N(V.reduce(function(a, v){ return a + (+v.cost || 0); }, 0))]])

      + cardFlush(t('الأنواع') + ' — ' + nm(K.length),
          table(['النوع','ما يُستعمَل له','السعة','العدد','تكلفةٌ شهرية',''],
            K.map(function(k){
              var n2 = byKind[k.id] || 0;
              return ['<input value="' + esc(k.n) + '" data-vkn="' + esc(k.id) + '" dir="auto">',
                      '<input value="' + esc(k.d || '') + '" data-vkd="' + esc(k.id) + '" dir="auto">',
                      '<input type="number" min="1" value="' + esc(String(k.cap || 2))
                        + '" data-vkc="' + esc(k.id) + '" style="max-width:78px">',
                      n2 ? pill(nm(n2), 'acc') : N(0),
                      N(costKind[k.id] || 0),
                      (may('settings')
                        ? (n2 ? '<span class="hint" style="margin:0">' + esc(t('مستعمل')) + '</span>'
                              : btn('حذف','btn-quiet btn-sm',' data-vkdel="' + esc(k.id) + '"'))
                        : '')];
            })))

      + (may('settings')
        ? card('إضافة نوع',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('اسم النوع')) + ' <span class="req">*</span></label>'
            +   '<input id="vkN" dir="auto" placeholder="' + esc(t('ونش')) + '"></div>'
            + '<div class="field"><label>' + esc(t('ما يُستعمَل له')) + '</label>'
            +   '<input id="vkD" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('السعة')) + '</label>'
            +   '<input id="vkC" type="number" min="1" value="2"></div>'
            + '</div>',
            btn('➕ إضافة نوع','btn-primary btn-sm',' data-vkadd="1"'))
        : '')

      + '<p class="hint">' + esc(t('النوعُ الذي عليه سياراتٌ لا يُحذَف — انقلها إلى نوعٍ آخر أولًا. والتكلفةُ الشهريةُ تُجمَع من سيارات النوع فتُعرَف كلفةُ كلِّ صنفٍ على المشروع.')) + '</p>';
  })();
    if (cur === 'buycat') return head + (function(){
    var L = catList(), B = buysList();
    return '<p class="lede" style="margin:0 0 16px">' + esc(t('هذه التبويبات هي ما تُصنَّف به كل عملية شراء، وعليها يقوم تجميع المصروف. والفئة المستعملة في عملياتٍ قائمة لا تُحذف حتى لا يفقد تقريرها تصنيفه.')) + '</p>'
      + halves(t('الفئات') + ' — ' + nm(L.length),
          ['الفئة','عمليات','المصروف',''],
          L.map(function(c){
              var used = B.filter(function(b){ return b.cat === c; });
              var sum = used.reduce(function(a,b){ return a + (+b.amt || 0); }, 0);
              return [esc(c), N(used.length), N(sum),
                      used.length ? '<span class="hint" style="margin:0">' + esc(t('مستعملة')) + '</span>'
                                  : btn('احذف','btn-quiet btn-sm',' data-catrm="' + esc(c) + '"')];
            }),
          may('money')
            ? '<form class="inline-form" onsubmit="return false">'
              + '<input id="catNew" dir="auto" placeholder="' + esc(t('فئة جديدة')) + '">'
              + btn('إضافة فئة','btn-primary btn-sm',' data-catadd="1"') + '</form>'
            : '');
  })();
    if (cur === 'sup') return head + (function(){
    var L = supList(), B = buysList();
    return '<p class="lede" style="margin:0 0 16px">' + esc(t('قائمةٌ موحّدةٌ لمن نشتري منهم — كالشركات تمامًا. الاسم الحر كان يصنع مورّدَين من مورّدٍ واحد باختلاف حرف، فتفرّق تقريرُه. والمورّد المستعمل في عملياتٍ قائمة لا يُحذف.')) + '</p>'
      + cardFlush(t('المورّدون') + ' — ' + nm(L.length),
          table(['المورّد','عمليات','المصروف',''],
            L.map(function(c){
              var used = B.filter(function(b){ return b.sup === c; });
              var sum = used.reduce(function(a,b){ return a + (+b.amt || 0); }, 0);
              return [esc(c), N(used.length), N(sum),
                      used.length ? '<span class="hint" style="margin:0">' + esc(t('مستعمل')) + '</span>'
                                  : btn('احذف','btn-quiet btn-sm',' data-suprm="' + esc(c) + '"')];
            })),
          may('money')
            ? '<form class="inline-form" onsubmit="return false">'
              + '<input id="supNew" dir="auto" placeholder="' + esc(t('مورّد جديد')) + '">'
              + btn('إضافة مورّد','btn-primary btn-sm',' data-supadd="1"') + '</form>'
            : '');
  })();
    return head + (function(){
    /* الكتالوجُ يُحرَّر هنا: الاسمُ والمنطقةُ والنقاطُ والسعر، ويُضاف صنفٌ
       ويُحذَف. وكان النموذجُ مرسومًا وأزرارُه بلا خاصيةٍ فيبتلعها حارسُ
       الأزرار الميتة — يُكتَب الاسمُ ويُضغَط «حفظ» ولا يقع شيء.
       والممرُّ قصادَ المخيم لا تحته: عمودان تُقارَن بهما القائمتان. */
    var used = function(code){
      var n = 0;
      Object.keys(STATE.inss || {}).forEach(function(id){
        var r = STATE.inss[id];
        if (r && r.parts && r.parts[code]) n++;
      });
      return n;
    };
    var col = function(z, label){
      var L = itemsList().filter(function(x){
        return x.z === z && (!IT_Q || x.name.indexOf(IT_Q) > -1);
      });
      return cardFlush(t(label) + ' — ' + nm(L.length) + ' ' + t('قطعة'),
        L.length
          ? table(['القطعة','نقاط التركيب','السعر',''],
              L.map(function(it){
                var u = used(it.code);
                return ['<input value="' + esc(it.name) + '" data-itname="' + esc(it.code) + '" dir="auto">',
                        cfgInput('itPts', it.code, { dec:1 }),
                        cfgInput('itPrice', it.code),
                        (u ? '<span class="hint" style="margin:0">' + esc(t('مستعملة في')) + ' ' + nm(u) + '</span>'
                           : btn('حذف','btn-quiet btn-sm',' data-itdel="' + esc(it.code) + '"'))
                        + btn(z === 'cor' ? '→ مخيم' : '→ ممر', 'btn-quiet btn-sm',
                              ' data-itzone="' + esc(it.code) + '"')];
              }))
          : '<p class="hint" style="text-align:center;margin:0;padding:16px">'
            + esc(t('لا قطع في هذه المنطقة.')) + '</p>');
    };

    return '<p class="lede" style="margin:0 0 16px">' + esc(t('كلُّ حقلٍ هنا قابلٌ للتعديل: الاسمُ والمنطقةُ ونقاطُ التركيب والسعر — ويُحفَظ فورَ كتابته. ونقاطُ التهيئة والتجميع تُضبط كلٌّ في صفحتها. والصنفُ المستعملُ في تركيبٍ قائمٍ لا يُحذَف.')) + '</p>'
      + '<form class="inline-form" onsubmit="return false" style="margin:0 0 14px">'
      +   '<input type="search" id="itQ" data-itq="1" value="' + esc(IT_Q) + '" placeholder="'
      +     esc(t('ابحث باسم القطعة')) + '" dir="auto">'
      + '</form>'
      + '<div class="grid cols-2" style="align-items:start">'
      +   '<div>' + col('cor', 'الممر') + '</div>'
      +   '<div>' + col('camp', 'المخيم') + '</div>'
      + '</div>'
      + card('إضافة صنف',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('المنطقة')) + '</label>'
          +   '<select id="itZ"><option value="camp">' + esc(t('مخيم')) + '</option>'
          +   '<option value="cor">' + esc(t('ممر')) + '</option></select></div>'
          + '<div class="field"><label>' + esc(t('اسم القطعة')) + ' <span class="req">*</span></label>'
          +   '<input id="itN" dir="auto" placeholder="' + esc(t('مفتاح شبكة ٨ منافذ')) + '"></div>'
          + '<div class="field"><label>' + esc(t('نقاط تركيبها')) + '</label>'
          +   '<input id="itP" type="number" step="0.5" min="0" value="1"></div>'
          + '<div class="field"><label>' + esc(t('سعرها')) + '</label>'
          +   '<input id="itR" type="number" min="0" value="0"></div>'
          + '</div>',
          btn('➕ إضافة صنف','btn-primary btn-sm',' data-itadd="1"'))
      + '<p class="hint">' + esc(t('نقلُ الصنف بين الممر والمخيم ينقل معه احتسابَه في تقسيم النقاط. والحذفُ ممنوعٌ على ما رُكِّب — وإلا فقدت سجلاتُ التركيب أسماءَ قطعها.')) + '</p>';
  })();
  }};


/* ═══ أسماءُ العرض — تصحيحُ ما تُخطئ فيه النقحرة ═══
   النقحرةُ حسابٌ حرفيٌّ لا يعرف النطق، والعربيةُ لا تكتب الحركات — فـ«فريق»
   تصير Fryq. والصوابُ يُكتَب هنا مرةً فيثبت لكلِّ من يقرأ بالإنجليزية،
   ولا يُمَسُّ الاسمُ المخزَّنُ في القاعدة. */


