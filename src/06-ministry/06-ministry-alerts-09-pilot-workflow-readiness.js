/* ============================================================================
   FILE    : src/06-ministry/06-ministry-alerts-09-pilot-workflow-readiness.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Pilot installation timings, the workflow map, today's decisions box and season readiness.
   DEFINES : pilotRows, pilotCard, svReopen, wfStep, wfDiagram, wfBody
   GLOBALS : SURV_Q
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ نقاطُ التركيب التجريبيِّ — الزمنُ بين مراحلها (V17.95) ═══
   قبل موجة التركيب تُركَّب نقاطٌ قليلةٌ أوّلًا لتُقاس: كم بين الإسناد والتركيب،
   وبين التركيب والتدقيق، وبين التدقيق والتسليم، ثم الفكّ. يَسِمُ المديرُ النقطةَ
   «تجريبية» من نافذتها (تجاوزٌ في وثيقة الموقع كغيره)، والبطاقةُ تُقرأ من
   الوثائق والخطوات نفسِها — لا حقلَ جديدًا ولا حسابًا ثانيًا لدورة الحياة. */
function pilotRows(){
  var idx = taskIndex();
  return (STATE.sites || []).filter(function(x){ return x.pilot; }).map(function(x){
    var id = x.id, r = STATE.recs[id], ins = STATE.inss[id], dis = STATE.diss && STATE.diss[id], hd = (typeof handOf === 'function') ? handOf(id) : null;
    var tk = idx[id + '|install'];
    var st = [
      ['تمت الزيارة', svVisited(r) ? +r.at : 0],   /* (V32.6) */
      ['أُسند التركيب', tk ? +(tk.at || tk._at || 0) : 0],
      ['رُكّبت',      ins && ins.status === 'مُركّب' ? +ins.at : 0],
      ['دُقّقت',      ins && ins.approved ? +(ins.qaAt || ins._at || ins.at) : 0],
      ['سُلّمت',      hd ? +(hd.at || 0) : 0],
      ['فُكّت',       dis && dis.status === 'تم الفك' ? +dis.at : 0]
    ];
    return { x:x, life:lifeOf(x), st:st };
  });
}
function pilotCard(){
  var R = pilotRows(); if (!R.length) return '';
  var span = function(a, b){ if (!a || !b || b < a) return '—'; var h = (b - a) / 36e5; return h < 48 ? nm(Math.round(h)) + ' ' + t('س') : nm(Math.round(h / 24)) + ' ' + t('يوم'); };
  return card('التركيبُ التجريبي — الزمنُ بين المراحل',
    '<p class="hint" style="margin-top:0">' + esc(t('نقاطٌ جُعلت «نقاطَ تجربة» من نافذتها. الأرقامُ من وثائق المسح والتركيب والتسليم والفكّ نفسِها.')) + '</p>'
    + '<div style="overflow:auto"><table class="tbl"><thead><tr><th>' + esc(t('النقطة')) + '</th><th>' + esc(t('الحالة')) + '</th>'
    + R[0].st.map(function(p){ return '<th>' + esc(t(p[0])) + '</th>'; }).join('') + '<th>' + esc(t('إسناد←تركيب')) + '</th><th>' + esc(t('تركيب←تدقيق')) + '</th><th>' + esc(t('تدقيق←تسليم')) + '</th></tr></thead><tbody>'
    + R.map(function(o){ var s2 = o.st;
        return '<tr><td>' + siteIdHtml(o.x) + '</td><td>' + pill(t((LIFE[o.life] || LIFE.todo).n), '') + '</td>'
          + s2.map(function(p){ return '<td class="num">' + (p[1] ? esc(fmtDT(p[1])) : '—') + '</td>'; }).join('')
          + '<td class="num">' + span(s2[1][1], s2[2][1]) + '</td><td class="num">' + span(s2[2][1], s2[3][1]) + '</td><td class="num">' + span(s2[3][1], s2[4][1]) + '</td></tr>'; }).join('')
    + '</tbody></table></div>');
}
PAGE.dis = { m:'المتابعة', t:'الفك والمراحل',
  l:'ما بعد الموسم: فكُّ ما رُكِّب، وسلسلةُ المراحل التي مرّت بها كلُّ نقطة.',
  body:function(){
    var head = tabHead('dis'), cur = tabCur('dis');
    if (cur === 'chain') return head + pilotCard() + (function(){
    var R = chainRows();
    return '<p class="lede" style="margin:0 0 16px">'
      + esc(t('الأعدادُ ليست نهائيةً بطبعها: المواقعُ لم تُمسَح بعدُ فما يُفَكُّ يزيد، وحاجةُ التهيئة لا تُعرَف إلا بعد المسح، وما يُركَّب يتبع المسحَ، وما يُفَكُّ يتبع التركيب. فأساسُ كلِّ مرحلةٍ هنا هو منجَزُ ما قبلها — يكبر بكبره ويقف بوقوفه.'))
      + '</p>'

      + cardFlush('السلسلة',
          table(['المرحلة','أساسُها','عددُ الأساس','منجَز','المتبقّي','النسبة'],
            R.map(function(x){
              var left = Math.max(0, (x.baseN || 0) - x.done);
              return ['<strong>' + esc(t(x.n)) + '</strong>',
                      esc(t(x.base)),
                      x.baseN ? N(x.baseN) : '<span class="hint" style="margin:0">'
                        + esc(t('بانتظار ما قبله')) + '</span>',
                      N(x.done),
                      x.baseN ? N(left) : '—',
                      x.baseN ? pct(x.done, x.baseN) : '—'];
            })))

      + R.map(function(x){
          return card(x.n, '<p class="hint" style="margin:0">' + esc(t(x.d)) + '</p>');
        }).join('')

      + '<p class="hint">' + esc(t('لا يُقدَّر عددُ مرحلةٍ قبل أن يقع أساسُها. ومن أراد تقديرًا مبكّرًا فليقرأه من المواقع المسجَّلة — ويعلم أنه سقفٌ لا التزام.')) + '</p>';
  })();
    return head + (function(){
    var L = Object.keys(STATE.diss || {}).map(function(id){ return STATE.diss[id]; });
    var eligible = Object.keys(STATE.inss).filter(function(id){
      var r = STATE.inss[id];
      return r.status === 'مُركّب' && r.approved && !(STATE.diss && STATE.diss[id]);
    }).length;
    var sched = L.filter(function(x){ return x.status === 'مجدول'; }).length;
    var done  = L.filter(function(x){ return x.status === 'تم الفك'; }).length;
    var returned = STATE.moves.filter(function(m){
      return m.kind === 'إرجاع سليم' || m.kind === 'إرجاع تالف';
    }).length;

    return stats([['مُركّب قابل للفك', N(eligible)],
                  ['فك مجدول', N(sched), sched ? 'wrn' : ''],
                  ['تم الفك', N(done), 'ok'],
                  ['عُهدة مرتجعة', N(returned)]])
      + card('دورة الفك', flow(['مُركّب','فك مجدول','تم الفك','أُرجعت العُهدة'], done ? 3 : (sched ? 1 : 0))
        + '<p class="hint">' + esc(t('عند «تم الفك» تُفتح نافذة إرجاع العُهدة مبنيةً على قطع النقطة المعتمدة: السليم يعود متاحًا والتالف يُعزل.')) + '</p>')
      + (L.length
        ? cardFlush(t('سجلّ الفك') + ' — ' + nm(L.length),
            table(['النقطة','الحالة','الحالة الفنية','بواسطة','التاريخ'],
              L.sort(function(a,b){ return (b.at||0)-(a.at||0); }).slice(0,200).map(function(x){
                return [siteIdHtml(siteOf(x)),
                        pill(x.status, x.status === 'تم الفك' ? 'ok' : 'wrn'),
                        x.cond ? pill(x.cond, x.cond === 'تالف' ? 'bad' : 'ok') : '—',
                        esc(dispName(x.by) || '—'),
                        '<span class="num">' + esc(fmtDate(x.at||0)) + '</span>'];
              })))
        : '');
  })();
  }};

/* ── التخطيط ────────────────────────────────────── */

/* إعادةُ تصنيف زيارةٍ تمّت كمتعذّرة: لا حذفَ للسجل ولا لصورِه — يبقى
   أثرًا، ويخرج من عِداد المُنجَز بتغيير access وحده حتى يُزار ثانيةً.
   قبولُ الوصولِ لا يعني الصحةَ الأبدية: موقعٌ قد يتغيّر بعد أن يُسجَّل. */
function svReopen(id, reason, note){
  if (!may('edit')){ toast(t('إعادةُ تصنيف الزيارة تحتاج صلاحية تعديل')); return; }
  var r = STATE.recs[id];
  if (!r){ toast(t('لا سجلَّ مسحٍ لهذه النقطة')); return; }
  if (!reason){ toast(t('اختر سبب التعذّر')); return; }
  var ins = STATE.inss && STATE.inss[id];
  if (ins && ins.status === 'مُركّب' && ins.approved){
    toast(t('النقطةُ مُركّبةٌ ومعتمدةٌ بالفعل — لا تُعاد إلى المسح')); return;
  }
  r.access = reason;
  r.reopenNote = String(note || '').trim();
  r.reopenBy = STATE.meta.name || '';
  r.reopenAt = Date.now();
  CORE.set('recs', id, r);
  logEvent('إعادة تصنيف زيارة كمتعذّرة — ' + id + ' \u00b7 ' + reason
           + (r.reopenNote ? (' \u00b7 ' + r.reopenNote) : ''));
  toast(id + ' \u00b7 ' + t('أُعيدت للقائمة — تحتاج زيارةً ثانية'));
  SURV_REOPEN = '';
  statBump();
  render(1);
}

/* ═══ دورةُ العمل — الخريطةُ التي تشرح النظامَ لنفسه ═══
   سؤالُ كلِّ مستخدمٍ جديد: «أعمل إيه، وبعدين أروح فين؟». والجوابُ كان
   مبعثرًا في تلميحات الصفحات. فجُمع في شاشةٍ واحدة: كلُّ دورةٍ خطواتُها
   بالترتيب — من يفعلها، وأين (بزرٍّ يقفز إلى الشاشة نفسِها)، وما الذي يحدث
   بعدها. والأزرارُ لا تظهر إلا لمن يرى شاشتَها — فالفنيُّ لا يُدعى إلى شاشة
   اعتماد لا يملكها. */
function wfStep(n, who, what, page){
  var jump = '';
  if (page && seesPage(PARENT[page] || page)){
    var pm = pageMeta(page);
    jump = '<div style="margin-top:6px">' + btn('\u{1F4CD} ' + esc(t(pm ? pm.t : page)),
      'btn-secondary btn-sm', ' data-p="' + esc(page) + '"') + '</div>';
  }
  return '<div class="list-item" style="align-items:flex-start"><div class="li-main">'
    + '<div class="li-t"><span class="num">' + nm(n) + '.</span> ' + esc(t(what)) + '</div>'
    + '<div class="li-s">' + esc(t(who)) + '</div>' + jump
    + '</div></div>';
}

/* رسمُ الدورة: صناديقُ الحالات بألوانها من LIFE نفسِها — فما يراه على
   الخريطة يجده هنا بالحرف. SVG لا صورة: يكبر ويصغر ويُترجَم ويُطبَع. */
function wfDiagram(){
  var rows = [
    { t:'دورة الزيارة', k:['todo','assigned','visited','ready'], why:'الرَّدُّ يعيدها إلى «تحتاج زيارةً أخرى» ثم تعود مسارَها.' },
    { t:'دورة التركيب', k:['ready','sched','installed'], why:'لا جدولةَ قبل اعتماد الحل، ولا نقاطَ قبل اعتماد التدقيق.' },
    { t:'بعد التركيب',  k:['installed','maint','dis'], why:'الصيانةُ في أثناء الموسم، والفكُّ بعده — كلاهما يُسنَد كما يُسنَد التركيب.' }
  ];
  /* النصُّ العربيُّ لا يُقَصُّ ولا يفيض: يُلَفُّ سطرين ويتّسع الصندوقُ لهما.
     كان `slice(22)` يقطع الكلمةَ نصفَها، والوصفُ يمتدُّ خارجَ إطاره فيركب
     على جاره — تُقرأ الصورةُ فتظنُّ الرسمَ معطوبًا. */
  var wrap = function(txt, per, lines){
    var w = String(txt || '').split(/\s+/), out2 = [], cur = '';
    for (var i = 0; i < w.length; i++){
      var nx = cur ? cur + ' ' + w[i] : w[i];
      if (nx.length > per && cur){ out2.push(cur); cur = w[i]; if (out2.length === lines - 1) break; }
      else cur = nx;
    }
    if (cur && out2.length < lines) out2.push(cur);
    var rest = w.slice(out2.join(' ').split(/\s+/).length).join(' ');
    if (rest && out2.length === lines) out2[lines - 1] = (out2[lines - 1] + ' …');
    return out2;
  };
  var W = 900, bw = 196, bh = 82, gap = 22, out = '';
  var y = 8;
  rows.forEach(function(r){
    out += '<text x="' + (W - 6) + '" y="' + (y + 14) + '" text-anchor="end" '
        +  'font-size="15" font-weight="700" fill="var(--ink)">' + esc(t(r.t)) + '</text>';
    y += 26;
    var n = r.k.length;
    var total = n * bw + (n - 1) * gap;
    var x0 = W - Math.round((W - total) / 2) - bw;   /* من اليمين لليسار */
    r.k.forEach(function(key, i){
      var L = LIFE[key] || LIFE.todo;
      var x = x0 - i * (bw + gap);
      var nm2 = wrap(t(L.n), 20, 2), ds = wrap(t(L.d), 26, 3);
      out += '<rect x="' + x + '" y="' + y + '" rx="10" width="' + bw + '" height="' + bh + '" '
          +  'fill="' + L.c + '" fill-opacity="0.18" stroke="' + L.c + '" stroke-width="2"/>'
          +  '<circle cx="' + (x + bw - 13) + '" cy="' + (y + 15) + '" r="5.5" fill="' + L.c + '"/>'
          +  nm2.map(function(ln, j){
               return '<text x="' + (x + bw - (j ? 12 : 25)) + '" y="' + (y + 19 + j * 15) + '" text-anchor="end" '
                 + 'font-size="12.5" font-weight="700" fill="var(--ink)">' + esc(ln) + '</text>';
             }).join('')
          +  ds.map(function(ln, j){
               return '<text x="' + (x + bw - 12) + '" y="' + (y + 22 + nm2.length * 15 + j * 13) + '" text-anchor="end" '
                 + 'font-size="10.5" fill="var(--ink-soft)">' + esc(ln) + '</text>';
             }).join('');
      if (i < n - 1){
        var ax = x - gap + 4, ay = y + bh / 2;
        out += '<line x1="' + (ax + gap - 8) + '" y1="' + ay + '" x2="' + (ax + 4) + '" y2="' + ay + '" '
            +  'stroke="var(--ink-soft)" stroke-width="2"/>'
            +  '<polygon points="' + ax + ',' + ay + ' ' + (ax + 8) + ',' + (ay - 5) + ' ' + (ax + 8) + ',' + (ay + 5) + '" '
            +  'fill="var(--ink-soft)"/>';
      }
    });
    y += bh + 10;
    out += '<text x="' + (W - 6) + '" y="' + (y + 10) + '" text-anchor="end" font-size="11" '
        +  'fill="var(--ink-soft)">' + esc(t(r.why)) + '</text>';
    y += 30;
  });
  return card('\u{1F5FA} ' + t('رسمُ الدورة — بألوان الخريطة نفسِها'),
      '<div style="overflow-x:auto"><svg viewBox="0 0 ' + W + ' ' + y + '" width="100%" '
      + 'style="min-width:820px;height:auto" role="img" aria-label="' + esc(t('رسم دورة حياة النقطة')) + '">'
      + out + '</svg></div>'
      + '<div class="chips" style="margin:10px 0 0">' + LIFE_ORDER.map(function(k){
          return '<span class="chip"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;'
            + 'background:' + LIFE[k].c + ';margin-inline-end:6px"></i>' + esc(t(LIFE[k].n)) + '</span>';
        }).join('') + '</div>'
      + '<p class="hint" style="margin:10px 0 0">'
      + esc(t('اللونُ نفسُه على الخريطة: تفتح الخريطةَ فتعرف موضعَ كلِّ نقطةٍ من الدورة بنظرة.')) + '</p>');
}
function wfBody(){
  var visit = [
    ['المهندس','يُنشئ طلبَ زيارةٍ (SR) أو يُسنِد نقاطًا من الخريطة لمشرفٍ بموعد','req'],
    ['المشرف','يفتح «شغلي ← مهامي» فيجد نقاطَه — وعلى الخريطة نقاطُه بلونٍ لا يشبه نقاطَ غيره','mywork'],
    ['المشرف','يزور النقطةَ ويملأ نموذجَ المسح بصورتَيه وقياساته — أو يسجّل تعذُّرَ الوصول بسببه','svForm'],
    ['النظام','تُحفَظ الزيارةُ «بانتظار الاعتماد» — وتظهر فورًا في اعتماد الزيارات ببياناتها الجديدة','svappr'],
    ['المهندس','يعتمد الزيارةَ فتُغلَق مهمتُها وتُحتسب نقاطُها — أو يردُّها «تحتاج زيارةً أخرى» بسببٍ مكتوب','svappr'],
    ['المشرف','إن رُدَّت وجدها في مهامّه بسبب الردّ — يزورها ثانيةً وتُحفَظ جولةً ثانيةً تنتظر الاعتماد','mywork']
  ];
  var install = [
    ['المهندس','بعد اعتماد الزيارة يقترح حلَّها: الأصنافُ وكمّياتُها من الكتالوج — يدويًّا أو بنمطٍ جاهز','solution'],
    ['المهندس','يعتمد الحلَّ — فتدخل النقطةُ طبقةَ التركيب ولا يُقبَل طلبُ تركيبٍ (DR) قبل ذلك','solution'],
    ['المهندس','يُسنِد التركيبَ لفريقٍ من الخريطة أو «توزيع الفرق» — التركيبُ عملُ أيدٍ لا يدٍ واحدة','req'],
    ['الفريق','يركّب ويملأ نموذجَ التركيب: صورتا قبلُ وبعدُ، والسيريالاتُ، والقطعُ المستهلكة','insForm'],
    ['النظام','تُخصَم القطعُ من المخزون في دفتر الحركة — فلا يُخصَم شيءٌ مرتين ولا يضيع','invmv'],
    ['المهندس','يدقّق التركيبَ في «التدقيق الهندسي» فيعتمده — أو يفتح عدمَ مطابقةٍ إن وجد خللًا','qa'],
    ['النظام','بالاعتماد تصير النقطةُ «مُركّب» وتُحتسب نقاطُ الفريق — وتظهر خضراءَ على الخريطة','map']
  ];
  var after = [
    ['المهندس','ما رُكِّب يُخدَم في أثناء الموسم: يُسنَد نوعُ «صيانة» (MR) لفريقٍ بموعد — فتصير النقطةُ صفراء','req'],
    ['الفريق','ينفّذ الصيانةَ ويوثّقها، وتُغلَق مهمتُها باعتماد المهندس فتعود النقطةُ خضراء','mywork'],
    ['المهندس','بعد الموسم يُسنَد نوعُ «فك» (PR) — فتصير النقطةُ حمراءَ حتى تُرجَع عُهدتُها','req'],
    ['الفريق','يفكّ ويُرجع القطعَ بحالتها في «الفك والعُهدة» — فتُغلَق دورةُ النقطة','disp2']
  ];
  var follow = [
    ['الجميع','«أمس · الآن · غدًا»: ما انتهى، وما يجري الآن ومن يفعله وأين، وما جُدول لغد','now'],
    ['الجميع','الخريطةُ تلوّن الدورةَ كلَّها — لم يُزر · مُسند · مجدولٌ غدًا · مردود · ينتظر · معتمد','map'],
    ['المكتب','«الوتيرة والهدف» تجيب «هنلحق؟» بالأرقام: المطلوبُ يوميًّا والانتهاءُ المتوقَّع','pace'],
    ['المكتب','التقاريرُ التنفيذية: اللوحةُ ومركزُ التقارير والملخّصُ المالي — للتصدير والاجتماعات','exec']
  ];
  function cyc(title, icon, steps, note){
    var i = 0;
    return card(icon + ' ' + t(title),
        '<div class="list">' + steps.map(function(st){ i++; return wfStep(i, st[0], st[1], st[2]); }).join('') + '</div>'
        + (note ? '<p class="hint" style="margin:10px 0 0">' + esc(t(note)) + '</p>' : ''));
  }
  return wfDiagram()
    + cyc('دورة الزيارة — حتى تُعتمَد', '\u{1F50D}', visit,
        'لا تُحتسب زيارةٌ في المنجَز وهي مردودة — والاعتمادُ وحدَه يفتح بابَ الحل.')
    + cyc('دورة التركيب — حتى يكتمل', '\u{1F527}', install,
        'البواباتُ بالترتيب: لا حلَّ قبل اعتماد الزيارة، ولا طلبَ تركيبٍ قبل اعتماد الحل، ولا نقاطَ قبل اعتماد التدقيق.')
    + cyc('بعد التركيب — الصيانة ثم الفك', '\u{1F6E1}', after,
        'الصيانةُ والفكُّ يُسنَدان بالمحرّك نفسِه: تُحدَّد النقاطُ من الخريطة، ويُختار النوع، ويُوضَع الموعد.')
    + cyc('المتابعة — من أين تُراقب', '\u{1F4CA}', follow, '');
}

/* ═══ قراراتُك اليوم — صندوقُ المهندس ═══
   ما ينتظر قرارَ المهندس كان موزَّعًا على ثماني شاشات: زياراتٌ تنتظر
   الاعتماد هنا، وحلولٌ مقترحةٌ هناك، وتركيباتٌ تنتظر التدقيق، وبلاغاتٌ،
   وتغييراتٌ، ونقاطٌ جاهزةٌ للتسليم — يفتحها بالتناوب ويسأل «هل بقي شيء؟».
   فجُمع ما ينتظره في بطاقةٍ واحدةٍ بأرقامه وزرِّ قفزٍ لكلٍّ: صفرٌ في الكلِّ
   يعني أن الطاولةَ نظيفة. */

/* ═══ جاهزيةُ الموسم ═══
   النظامُ كاملٌ والإعداداتُ صفر. أوزانُ الزيارة صفرٌ فلا نقطةَ تُحتسَب لأحد،
   والتارجتاتُ صفرٌ فلا وتيرةَ تُقاس، والمواعيدُ صفرٌ فلا تأخّرَ يُعرَف،
   والميزانيةُ صفرٌ فالقيمةُ المكتسبةُ تقسم على صفر. وكلٌّ منها يعطّل حسابًا
   بعينه في صمت: الشاشةُ تعمل وتعرض صفرًا، فيُظنُّ أن العملَ لم يبدأ.
     فصارت بطاقةٌ تقول ما ينقص قبل أن يبدأ الموسم، بترتيب الأثر: ما يُعطّل
   الحسابَ أوّلًا، ثم ما يُعطّل التقرير، ثم ما يُعطّل المحضر. ولكلِّ سطرٍ
   زرٌّ يذهب إلى موضع ضبطه — لا يُقال «اضبطه» ويُترَك البحثُ للناظر. */

