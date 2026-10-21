/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-03-site-details-points.js
   DOMAIN  : Catalogue & point — definitions, classification, permissions, survey edit
   PURPOSE : Full site details page (PAGE.site) and technician points computed from work.
   DEFINES : stageOf, bonusList, bonusFor, mayBonus, bonusAdd, bonusDel, scores, scoreOf, stageList, stageTarget, dayCapOf
   GLOBALS : DETAIL_ID, STAGE_ROLES, TECH_STAGE, SCORE_CACHE
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ تفاصيل النقطة الكاملة ═══ */
var DETAIL_ID = '';

/* يُوسَم شريطُ الصور في شاشة الموقع أدناه */
PAGE.site = { m:'الميدان', t:'تفاصيل الموقع', l:'كلُّ ما عن نقطةٍ واحدة: بيانُها وزيارتُها وتركيبُها وصورُها وسجلُّها — تُفتَح من الخريطة أو من القوائم.',
  body:function(){
    /* (V38.69) no fallback to the first point — every button on this page writes to the point it shows */
    var x = siteFind(DETAIL_ID);
    if (!x) return alertBox('warn', t('النقطةُ غيرُ موجودة — ربما حُذفت أو دُمجت. افتحها من الخريطة أو من البحث.'));
    if (!x) return alertBox('warn','لا مواقع محمّلة.');
    var d = catDefOf(x);
    var rec = STATE.recs[x.id], ins = STATE.inss[x.id];
    var sv = !!rec, st = (ins && ins.status) || x.fstat || 'لم يبدأ';

    function row(k, v, edit){
      if (v === '' || v == null) return '';
      return '<div><span class="k">' + esc(t(k)) + '</span>'
        + '<span>' + v + (edit ? ' ' + btn('تعديل','btn-quiet btn-sm',' data-edit="' + edit + '"') : '')
        + '</span></div>';
    }

    return card(d.i + ' ' + esc(x.name),
        '<div class="pid" style="margin:0 0 10px">' + bdi(siteKey(x)) + (siteKey(x) !== x.id ? ' \u00b7 ' + bdi(x.id) : '') + '</div>'
        + '<div class="chips" style="margin:0 0 12px">'
        +   pill(x.zone,'acc') + ' ' + '<span class="pill" style="background:' + d.c + '22;color:' + d.c + '">'
        +   d.i + ' ' + esc(t(d.l)) + '</span> '
        +   (x.work ? pill(x.work,'info') : '') + ' '
        +   pill(sv ? 'تمت الزيارة' : 'لم يُزر', sv ? 'ok' : 'warn') + ' '
        +   pill(st, st==='مُركّب' ? 'ok' : (st==='متعذّر' ? 'off' : ''))
        + '</div>'
        + '<div class="actions">'
        + '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener"'
        + ' href="https://www.google.com/maps/dir/?api=1&destination=' + x.lat + ',' + x.lng + '">'
        + '↗ ' + esc(t('اتجاهات')) + '</a>'
        + btn('◈ ' + t('على الخريطة'),'btn-secondary btn-sm',' data-fly="' + esc(x.id) + '"')
        + btn('🔍 ' + t('امسح هذا الموقع'),'btn-secondary btn-sm',' data-form="' + esc(x.id) + '"')
        /* (V38.56) the install form from the site page — when an install task is open here, or it is installed, or ready */
        + (may('edit') && (taskKindOf(x.id, 'install') || insDone(x.id) || (((STATE.inss[x.id] || {}).solution || {}).status === 'معتمد' && typeof minOk === 'function' && minOk(x.id)))
            ? btn('🔧 ' + t('نموذج التركيب'),'btn-primary btn-sm',' data-insform="' + esc(x.id) + '"') : '')
        + (typeof insqMay === 'function' && insqMay(x.id) ? btn('\u270E ' + t('تعديل التركيب'),'btn-secondary btn-sm',' data-insq="' + esc(x.id) + '"') : '')   /* (V38.61) */
        + '</div>')

      + (SITE_ED && maySiteEditBasic() ? siteEditHtml(x) : '')   /* (V28.6) */
      + (typeof egCard === 'function' ? egCard(x) : '')   /* (V38.31) بواباتُ محطة القطار */
      + (rankOf(ROLE) >= rankOf('tech') && typeof chThreadHtml === 'function' ? chThreadHtml(x.id) : '')   /* (V38.60) the point's chat */
      + (typeof egIsGate === 'function' && egIsGate(x) ? (function(){   /* (V38.53) a train gate shows its station and its drawing pages, and opens them */
          var g = egOf(x), st = g && g.stn ? siteFind(g.stn) : null; if (!st) return '';
          return card('\u{1F686} ' + t('محطة البوابة'),
            '<div class="kk-zl" style="margin:0"><span>' + esc(st.name) + (g.pages.length ? '<br><span class="hint" style="margin:0">' + esc(t('صفحات الرسمة')) + ': ' + g.pages.map(nm).join('، ') + '</span>' : '') + '</span>'
            + btn('\u{1F4C4} ' + t('صفحة المحطة'), 'btn-secondary btn-sm', ' data-site="' + esc(st.id) + '"') + btn('\u25C8', 'btn-quiet btn-sm', ' data-fly="' + esc(st.id) + '" title="' + esc(t('على الخريطة')) + '"') + '</div>'
            + '<p class="hint" style="margin:6px 0 0">' + esc(g.moved ? t('موقعُ البوابة محدَّدٌ بالمسح') : t('موقعُ البوابة تقريبيٌّ من الرسمة — يُثبَّت من «تعديل البيانات» أو بسحب الدبّوس')) + '</p>');
        })() : '')
      + card('بيانات الموقع',
          '<div class="pop-rows" style="margin:0">'
          + row('اسم الموقع', esc(x.name), 'name')
          + row('رقم المربع', x.sq ? '<span class="num">' + esc(x.sq) + '</span>' : '', 'sq')
          + row('رقم الشاخص', x.sign ? '<span class="num">' + esc(x.sign) + '</span>' : '', 'sign')
          + row('المشعر', esc(x.zone), 'zone')   /* (V27.4) قرارُ المالك: كلُّ صفٍّ في البطاقة له «تعديل» — المشعرُ والتصنيفُ والمنطقةُ والإحداثياتُ والدور */
          + row('التصنيف', d.i + ' ' + esc(t(d.l)), 'type')
          + row('وجه العمل', esc(t(x.work)), 'work')
          + row('المنطقة', esc(x.region || '\u2014'), 'region')
          + row('الدور', siteFloor(x) != null ? esc(t(floorName(siteFloor(x)))) : '', 'floor')   /* (V22.2) */
          + camInfoRows(x, function(k, v){ return row(k, v); }) + camxRows(x, function(k, v){ return row(k, v); })   /* (V37.89) «عناوين الأجهزة» المكرَّرةُ هنا رُفعت — الصفوفُ أدناه تحملها وتُعدَّل */
          + row('شركة الخدمة / المشغّل', esc(x.co), 'co')
          + row('تصنيف الحجاج', esc(t(x.inout === 'خارج' ? 'حجاج خارج' : (x.inout === 'داخل' ? 'حجاج داخل' : x.inout))), 'inout')
      /* بيانةُ الموسم الماضي في التفاصيل كما هي في النموذج: من فتح النقطةَ
         ليقرأها لم يجد ما يقرؤه، فيرجع إلى ملفٍ خارج النظام. */
      + (function(){
          if (!S47){ s47Load(); return ''; }
          var v = s47Of(x.id);
          if (!v) return '';
          v = s47View(x);   /* (V37.89) المعدَّلُ يتقدّم الأصل — وكلُّ صفٍّ يُعدَّل */
          return s47Fields()
            .filter(function(r2){ return v[r2[0]]; })
            .map(function(r2){ return row(r2[1], esc(v[r2[0]]), 's47' + r2[0]); }).join('');
        })()
      /* نقطةُ الاتصال والعناوينُ الثلاثةُ المشتقّةُ منها */
      + (function(){
          var base = siteNetBase(x);
          if (!base) return maySiteEditBasic() ? row('نقطة الاتصال', '<span class="hint" style="margin:0">' + esc(t('غير مسجّلة')) + '</span>', 'net') : '';
          return row('نقطة الاتصال', '<span class="num" dir="ltr">' + esc(base) + '.0/24</span>', 'net')   /* (V37.89) كلُّ عنوانٍ يُعدَّل */
            + row('راوتر',  '<span class="num" dir="ltr">' + esc(x.ipRtr || (base + '.1')) + '</span>', 'ipRtr')
            + row('قارئ',   '<span class="num" dir="ltr">' + esc(x.ipRdr || (base + '.2')) + '</span>', 'ipRdr')
            + row('كاميرا', '<span class="num" dir="ltr">' + esc(x.ipCam || (base + '.3')) + '</span>', 'ipCam');
        })()
          + row('الإحداثيات', '<span class="num">' + x.lat.toFixed(6) + ', ' + x.lng.toFixed(6) + '</span>', 'lat')
          + '</div>')

      + (rec
        ? card('المسح',
            '<div class="pop-rows" style="margin:0">'
            + row('المنفِّذ', esc(rec.by))
            + row('التاريخ', '<span class="num">' + fmtDT2(rec.at, { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) + '</span>')
            + row('نوع التركيب', esc(rec.mount))
            + row('مصدر الكهرباء', esc(rec.power))
            + row('ارتفاع التركيب', rec.height ? nm(rec.height) + ' م' : '')
            + row('طول الكابل', rec.cable ? nm(rec.cable) + ' م' : '')
            + row('الصور', nm((rec.photos || []).length))
            + '</div>'
            + ((rec.chals || []).length
              ? '<div class="chips" style="margin:11px 0 0">'
                + rec.chals.map(function(c){ return pill(c,'warn'); }).join(' ') + '</div>'
              : '')
            + (rec.note ? '<p class="hint">' + esc(rec.note) + '</p>' : ''))
        : card('المسح', '<p class="hint" style="margin:0">' + esc(t('لم تتم زيارتها بعد.')) + '</p>',
            btn('امسح الآن','btn-primary btn-sm',' data-form="' + esc(x.id) + '"')))

      + (ins
        ? card('التركيب',
            '<div class="pop-rows" style="margin:0">'
            + row('الحالة', pill(ins.status, ins.status==='مُركّب'?'ok':'') + demoTag(x))   /* (V37.78) */
            + (x.type === 'مخيم' || extReaderSerial(ins) ? row('نظام البطاقات', extCheckPill(x) || '\u2014') : '')   /* (V37.85) الشاخصُ والقارئ */
            + row('المنفِّذ', esc(ins.by))
            + row('النقاط', N(ptsInstall(x)))   /* (V37.77) */
            + row('بادئة الشبكة', ins.prefix ? '<span class="num" dir="ltr">' + esc(ipsOf(ins.prefix)) + '</span>' : '')
            + row('الاعتماد', ins.approved ? pill('معتمد','ok') : pill('بانتظار التدقيق','warn'))
            + '</div>'
            + (Object.keys(ins.parts || {}).length
              ? table(['القطعة','الكمية','السيريال'],
                  Object.keys(ins.parts).map(function(k){
                    var it = itemsList().filter(function(i){ return i.code === k; })[0];
                    return [esc(it ? it.name : k), N(ins.parts[k]),   /* (V37.78) كان it[2] على كائنٍ فيظهر الاسمُ فارغًا */
                            '<span class="num">' + esc((ins.serials || {})[k] || '—') + '</span>'];
                  }))
              : '')
            + demoRevsHtml(x, ins)
            + '<div class="actions" style="margin:8px 0 0">' + insPhotoBtn(x, ins) + '</div>')   /* (V37.79) */
        : '')
      + extNkCard(x)   /* (V37.86) اسمُ الربط بنظام البطاقات */
      + ex47SiteCard(x)   /* (V37.90) أجهزةُ موسم ١٤٤٧ */

      + photoStrip(x.id)
      + card('دورة هذه النقطة',
          flow(['مسح','اعتماد المسح','جدولة','تركيب','تدقيق','مُركّب'],
               ins && ins.approved ? 5 : (ins ? 4 : (sv ? 1 : 0))))
      /* سجلُّ النقطة: من فعل ماذا ومتى — من أوّل يوم (V17.20) */
      + siteLogHtml(x.id);
  }};

/* ── الخريطة والقائمة تتبعان الترشيح ── */
/* ═══ نقاطُ الفنيين — تُحسب من العمل لا تُكتب ═══
   الأوزانُ في الإعدادات لا تتغيّر، وكلُّ ما يعمله الفنيُّ يُوزَن بها:
   زيارةٌ بوزنها، وتركيبٌ بنقاط قطعه، وفكٌّ بوزنه في معامل حالته.
   فيرى كلٌّ ما عمله ورقمَه بين فريقه، ويرى المهندسُ الجميع. */

var STAGE_ROLES = {
  eng:   { n:'مهندسو المناطق', i:'\u{1F393}', kinds:['visit','install'],
           d:'يديرون مناطقهم ويعتمدون ما يُرفَع فيها.' },
  cfg:   { n:'فنيو التهيئة',   i:'\u{1F6E0}', kinds:['prep'],
           d:'ضبطُ الجهاز وعنوانه ونظامه قبل النزول.' },
  asm:   { n:'فنيو التجميع',   i:'\u{1F9F0}', kinds:['asm'],
           d:'تركيبُ ما يدخل البوكس وتوصيلُه.' },
  ins:   { n:'فنيو التركيب',   i:'\u{1F527}', kinds:['install'],
           d:'تركيبُ النقطة في موقعها وتوثيقُها.' },
  srv:   { n:'فنيو المسح',     i:'\u{1F50D}', kinds:['visit'],
           d:'الزيارةُ الميدانيةُ وجمعُ ما لا يُعرف.' },
  dis:   { n:'فنيو الفك',      i:'\u{1F9E9}', kinds:['dis'],
           d:'الفكُّ وإرجاعُ العُهدة بحالتها.' }
};

/* لكلِّ فنيٍّ مرحلتُه — تُضبط في إسناد الأدوار */
var TECH_STAGE = {
  'أحمد':'ins', 'سالم':'ins', 'ماجد':'ins',
  'ياسر':'cfg', 'عبدالله':'ins', 'طارق':'ins',
  'خالد':'eng', 'فهد':'eng', 'محمد صفوت':'eng'
};

function stageOf(name){
  /* مرحلةُ الشخص من وظيفته: دورُ الوظيفة يقرّر الدورةَ التي يظهر فيها */
  var x = techsList().filter(function(y){ return y.n === name; })[0];
  var role = x && x.job ? (jobOf(x.job) || {}).role : '';
  var map = { tech:'srv', cprep:'prep', casm:'asm', cins:'ins' };
  if (map[role]) return map[role];
  return TECH_STAGE[name] || 'srv';
}

/* ── حصادُ العمل: يُمشَّط السجلُّ مرةً ويُخزَّن ── */
var SCORE_CACHE = null, SCORE_VER = -1;

/* ── نقاطُ الزيادة اليدوية: يضيفها مشرفٌ أو مهندسٌ بسببٍ مكتوب ──
   ليست تصحيحًا صامتًا لرقمٍ، بل سطرٌ جديدٌ له صاحبٌ ووقتٌ وسببٌ — يُحذَف
   لا يُعدَّل، فمن أراد تصويبَه أضاف سطرًا يُلغيه بسببٍ آخر. */
function bonusList(){ return Object.keys(STATE.bonus || {}).map(function(k){ return STATE.bonus[k]; }); }
function bonusFor(name){
  return bonusList().filter(function(b){ return b.tech === name; })
    .reduce(function(a,b){ return a + cfgN(b.pts); }, 0);
}
/* نقاطُ الزيادة قرارٌ فوق الميدان: المهندسُ ومديرُ المشروع والإدارةُ العليا —
   لا المشرف؛ فالمشرفُ يقيّم فريقَه بالتقرير لا بالنقاط، والنقاطُ تدخل
   المستحقَّ فلا تُترَك لمن يعمل مع من يقيّمه يومًا بيوم. */
function mayBonus(){ return rankOf(ROLE) >= rankOf('engineer'); }
function bonusAdd(tech, pts, note){
  if (!mayBonus()){ toast(t('نقاطُ الزيادة للمهندس ومدير المشروع فما فوق')); return; }
  tech = String(tech || '').trim();
  var p = cfgN(pts);
  if (!tech){ toast(t('اختر الفنيَّ أولًا')); return; }
  if (!p){ toast(t('اكتب عدد نقاطٍ غيرَ صفر')); return; }
  var id = 'bn' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  var b = { id:id, tech:tech, pts:p, note:String(note || '').trim(),
            by:STATE.meta.name || '', at:Date.now() };
  if (!STATE.bonus) STATE.bonus = {};
  STATE.bonus[id] = b;
  CORE.set('bonus', id, b);
  logEvent((p > 0 ? 'إضافة' : 'خصم') + ' نقاط زيادة — ' + tech + ' \u00b7 ' + nm(Math.abs(p))
           + (note ? ' \u00b7 ' + note : ''));
  toast(tech + ' \u00b7 ' + (p > 0 ? '+' : '') + nm(p) + ' ' + t('نقطة'));
  statBump();
  render(1);
}
function bonusDel(id){
  if (!mayBonus()){ toast(t('حذفُ نقاط الزيادة للمشرف أو المهندس وحدهما')); return; }
  var b = STATE.bonus && STATE.bonus[id];
  if (!b) return;
  delete STATE.bonus[id];
  CORE.dirty('bonus', id, null);
  logEvent('حذف سطر نقاط زيادة — ' + b.tech + ' \u00b7 ' + nm(b.pts));
  toast(t('حُذف السطر'));
  statBump();
  render(1);
}

function scores(){
  if (SCORE_CACHE && SCORE_VER === STAT_VER) return SCORE_CACHE;
  var by = Object.create(null);

  function ent(who){
    if (!who) who = '—';
    if (!by[who]) by[who] = {
      name:who, stage:stageOf(who),
      survey:0, install:0, dis:0, prep:0, asm:0,
      pSurvey:0, pInstall:0, pDis:0, pPrep:0, pAsm:0, pBonus:0, total:0,
      installT:Object.create(null), disT:Object.create(null), surveyT:Object.create(null),
      days:Object.create(null), last:0
    };
    return by[who];
  }

  /* المسح: كلُّ سجلٍّ بوزن نقطته */
  Object.keys(STATE.recs).forEach(function(id){
    var r = STATE.recs[id], x = siteFind(id);
    if (!x) return;
    var e = ent(r.by), pS = ptsSurvey(x);
    e.survey++;
    e.pSurvey += pS;
    /* بنوع الموقع: كم مخيمًا وكم ممرًّا مسح كلٌّ فعلًا — بالعدد والنقاط (V18.6) */
    var sT = catLabel(x) || x.type || 'أخرى';
    if (!e.surveyT[sT]) e.surveyT[sT] = { n:0, pts:0 };
    e.surveyT[sT].n++; e.surveyT[sT].pts += pS;
    var day = dayKey(r.at || Date.now());
    e.days[day] = (e.days[day] || 0) + 1;
    if ((r.at||0) > e.last) e.last = r.at || 0;
  });

  /* التركيب: المعتمدُ وحده يُحتسب — كما هو الأصل، ومصنَّفٌ بنوع الموقع
     (مخيمٌ أو ممرٌّ أو غيرهما) لأن لكلٍّ وزنَه المستقل */
  Object.keys(STATE.inss).forEach(function(id){
    var r = STATE.inss[id], x = siteFind(id);
    if (!x || r.status !== 'مُركّب') return;
    var e = ent(r.by), p = r.approved ? ptsInstall(x) : 0;
    e.install++;
    e.pInstall += p;
    if (!e.installT[x.type]) e.installT[x.type] = { n:0, pts:0 };
    e.installT[x.type].n++;
    e.installT[x.type].pts += p;
    var day = dayKey(r.at || Date.now());
    e.days[day] = (e.days[day] || 0) + 1;
    if ((r.at||0) > e.last) e.last = r.at || 0;
  });

  /* الفك: بحالته ومعاملها، ومصنَّفٌ بنوع الموقع كالتركيب تمامًا */
  if (STATE.diss) Object.keys(STATE.diss).forEach(function(id){
    var r = STATE.diss[id], x = siteFind(id);
    if (!x || r.status !== 'تم الفك') return;
    var e = ent(r.by), p = r.pts || ptsDis(x);
    e.dis++;
    e.pDis += p;
    if (!e.disT[x.type]) e.disT[x.type] = { n:0, pts:0 };
    e.disT[x.type].n++;
    e.disT[x.type].pts += p;
    if ((r.at||0) > e.last) e.last = r.at || 0;
  });

  /* الورشة: التهيئةُ والتجميعُ من دفتر الحركة */
  STATE.moves.forEach(function(m){
    if (!m || !m.by) return;
    if (m.kind === 'تهيئة'){ var e1 = ent(m.by); e1.prep++; e1.pPrep += itPrep(itemCode(m.item)) * (m.qty||1); }   /* (V37.99) */
    if (m.kind === 'تجميع'){ var e2 = ent(m.by); e2.asm++;  e2.pAsm  += itAsm(itemCode(m.item))  * (m.qty||1); }
  });

  /* نقاطُ الزيادة اليدوية: يضيفها مشرفٌ أو مهندسٌ بسببٍ مكتوب — لا تصنعُ
     عملًا وهميًّا، وتدخل الإجماليَّ كأيِّ نقطةٍ حقيقيةٍ أخرى */
  bonusList().forEach(function(b){
    var e = ent(b.tech);
    e.pBonus += cfgN(b.pts);
  });

  Object.keys(by).forEach(function(k){
    var e = by[k];
    e.total = Math.round((e.pSurvey + e.pInstall + e.pDis + e.pPrep + e.pAsm + e.pBonus) * 100) / 100;
    e.acts  = e.survey + e.install + e.dis + e.prep + e.asm;
    e.nDays = Object.keys(e.days).length;
    e.perDay = e.nDays ? Math.round(e.total / e.nDays * 10) / 10 : 0;

    /* الأوفر تايم: تارجتُ المرحلة يُقسَّم على أيام الشهر فيكون سقفَ اليوم،
       وما زاد عنه في يومٍ يُعدّ إضافيًّا. فلا يُقدَّر بل يُحسب من العمل نفسه. */
    var cap = dayCapOf(e);
    e.dayCap = Math.round(cap * 10) / 10;
    e.over = 0; e.regular = 0;
    if (cap){
      /* توزيعُ النقاط على الأيام بنسبة أعمال كلِّ يوم */
      var totalActs = e.acts || 1;
      Object.keys(e.days).forEach(function(dy){
        var share = e.total * (e.days[dy] / totalActs);
        if (share > cap){ e.regular += cap; e.over += (share - cap); }
        else e.regular += share;
      });
      e.over = Math.round(e.over * 10) / 10;
      e.regular = Math.round(e.regular * 10) / 10;
    } else { e.regular = e.total; }

    var ph = cfgGet('ph'), ov = cfgGet('otRate') || 1.5;
    e.money    = Math.round((e.regular * ph + e.over * ph * ov) * 100) / 100;
    e.moneyReg = Math.round(e.regular * ph * 100) / 100;
    e.moneyOT  = Math.round(e.over * ph * ov * 100) / 100;
  });

  var list = Object.keys(by).map(function(k){ return by[k]; });
  list.sort(function(a,b){ return b.total - a.total; });
  list.forEach(function(e, i){ e.rank = i + 1; });

  SCORE_CACHE = { list:list, byName:by, n:list.length };
  SCORE_VER = STAT_VER;
  return SCORE_CACHE;
}

function scoreOf(name){
  var S = scores();
  return S.byName[name] || { name:name, stage:stageOf(name), survey:0, install:0, dis:0,
    prep:0, asm:0, pSurvey:0, pInstall:0, pDis:0, pPrep:0, pAsm:0,
    total:0, acts:0, nDays:0, perDay:0, money:0, rank:S.n + 1, last:0, days:{} };
}

function stageList(stage){
  return scores().list.filter(function(e){ return e.stage === stage; });
}

/* تارجتُ المرحلة — من الإعدادات */
function stageTarget(stage){
  var Tg = T();
  return { eng:0, cfg:Tg.prep || 0, asm:Tg.asm || 0,
           ins:Tg.ins || 0, srv:Tg.survey || 0, dis:Tg.dis || 0 }[stage] || 0;
}

/* سقفُ اليوم: تارجتُ ما عمله موزونًا بأعماله ÷ أيام الشهر.
   فمن مرحلتُه تركيبٌ وعمل مسحًا يُقاس بتارجت المسح لا بتارجتٍ لا يخصّ عمله. */
function dayCapOf(e){
  var days = cfgGet('days');
  if (!days) return 0;
  var Tg = T();
  var mix = [[e.survey, Tg.survey], [e.install, Tg.ins], [e.dis, Tg.dis],
             [e.prep, Tg.prep], [e.asm, Tg.asm]];
  var acts = 0, weighted = 0;
  mix.forEach(function(m){ if (m[0] > 0){ acts += m[0]; weighted += m[0] * (m[1] || 0); } });
  var tgt = acts ? (weighted / acts) : stageTarget(e.stage);
  if (!tgt) tgt = stageTarget(e.stage);
  return tgt ? (tgt / days) : 0;
}

/* ── صفحة الفني: ما عمله ورقمُه ── */
