/* ============================================================================
   FILE    : src/04-office/04-tasks-office-06-risks-changes-coverage.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Live risk register, approved changes applied to the baseline, and coverage from company departments to client management.
   DEFINES : (no top-level functions)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
PAGE.org = { m:'التخطيط', t:'التنظيم والسلامة',
  l:'من يغطّي ماذا ومن يُساءل — والحوادثُ وإجراءاتُ السلامة والدروس.',
  body:function(){
    var head = tabHead('org'), cur = tabCur('org');
    if (cur === 'hse') return head + (function(){
    var SC = scores();
    var manDays = SC.list.reduce(function(a,e){ return a + e.nDays; }, 0);
    var hrs = manDays * (cfgGet('hours') || 8);
    var n = HSE.incidents.length;
    /* معدّلُ التكرار: حوادثُ لكلِّ مئتَي ألف ساعةِ عمل — التعريفُ المعتمد */
    var trir = hrs ? Math.round(n * 200000 / hrs * 100) / 100 : 0;

    return stats([['ساعات عمل', N(hrs), 'acc'],
                  ['حوادث مسجّلة', N(n), n ? 'bad' : 'ok'],
                  ['أيام فُقدت', N(HSE.lost), HSE.lost ? 'wrn' : 'ok'],
                  ['معدّل التكرار', nm(trir), trir > 3 ? 'bad' : 'ok']])

      + card('تسجيل حادث',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('النوع')) + '</label>'
          + '<select id="hseKind">'
          + ['وشيك — بلا إصابة','إسعاف أولي','علاج طبي','فقدُ أيام عمل','ضررٌ بالمعدات']
              .map(function(k){ return '<option value="' + esc(k) + '">' + esc(t(k)) + '</option>'; }).join('')
          + '</select></div>'
          + '<div class="field"><label>' + esc(t('الموقع')) + '</label>'
          + '<input id="hseSite" placeholder="NSK-…" dir="ltr"></div>'
          + '<div class="field"><label>' + esc(t('أيام العمل المفقودة')) + '</label>'
          + '<input type="number" id="hseLost" min="0" value="0"></div>'
          + '</div>'
          + '<div class="field"><label>' + esc(t('الوصف والإجراء')) + '</label>'
          + '<textarea id="hseWhy" rows="2"></textarea></div>',
          btn('سجّل','btn-danger',' data-hseadd="1"'))

      + (n
        ? cardFlush('سجل الحوادث',
            table(['التاريخ','النوع','الموقع','أيام مفقودة','الإجراء',''],
              HSE.incidents.map(function(x, i){
                var ed = may('approve');
                return ['<span class="num">' + fmtDate(x.at) + '</span><br>'
                          + '<span class="hint" style="margin:0">' + esc(dispName(x.by)) + '</span>',
                        pill(x.kind, x.lost ? 'off' : 'warn'), '<span class="num">' + esc(x.site || '—') + '</span>',
                        /* N() تُعيد وسمَ span لا رقمًا — ووسمٌ داخل value="" يُغلق
                           الاقتباسَ فيُكسَر الحقلُ ولا يُرسَم. تُستعمل القيمةُ الخام. */
                        ed ? '<input type="number" min="0" value="' + esc(String(cfgN(x.lost))) + '" data-hsel="' + i + '" style="width:74px">' : N(x.lost),
                        ed ? '<input value="' + esc(x.why) + '" data-hsew="' + i + '" dir="auto">'
                           : '<span class="hint" style="margin:0">' + esc(x.why.slice(0,44)) + '</span>',
                        ed ? btn('🗑','btn-quiet btn-sm',' data-hsedel="' + i + '" aria-label="' + esc(t('حذف')) + '"') : '—'];
              })),
            btn('⬇ إكسل — السلامة','btn-secondary btn-sm',' data-xls="hse"'))
        : card('', alertBox('success','لا حوادثَ مسجّلة — والصفرُ هو الهدف.')))

      + card('اشتراطات الموقع',
          table(['الاشتراط','الإلزام','ملاحظة'], [
            ['خوذة وحذاء أمان', 'إلزامي', 'في كلِّ نقاط الممرات والجسور'],
            ['حزام ارتفاع', 'إلزامي', 'فوق مترين — أعمدةُ الكاميرات'],
            ['عزل الكهرباء قبل العمل', 'إلزامي', 'افصل التيار واقفله وعلّق بطاقةَ تحذيرٍ قبل فتح البوكس'],
            ['تصريح عملٍ ساخن', 'عند اللزوم', 'اللحامُ والقطع'],
            ['ماءٌ وظلٌّ للفريق', 'إلزامي', 'حرارةُ المشاعر تتجاوز الأربعين']
          ])
          + '<p class="hint">' + esc(t('معدّلُ التكرار = الحوادثُ × مئتَي ألفٍ ÷ ساعات العمل — وثلاثةٌ فأقلُّ مقبولٌ دوليًّا.')) + '</p>');
  })();
    if (cur === 'raci') return head + (function(){
    return card('المفتاح',
        table(['الرمز','المعنى','الشرط'], [
          ['<b>R</b>','المنفِّذ — يعمل','واحدٌ فأكثر'],
          ['<b>A</b>','المساءَل — يوقّع','واحدٌ لا غير'],
          ['<b>C</b>','المستشار — يُسأل قبل','اختياري'],
          ['<b>I</b>','المبلَّغ — يُخبَر بعد','اختياري']
        ]))
      + cardFlush(t('المصفوفة') + ' — ' + nm(raciList().length),
          table(['النشاط','R — ينفّذ','A — يُساءل','C — يُستشار','I — يُبلَّغ',''],
            raciList().map(function(r, ri){
              return ['<input value="' + esc(r.a) + '" data-rca="' + ri + '" dir="auto">',
                      '<input value="' + esc(r.R || '') + '" data-rcr="' + ri + '" dir="auto">',
                      '<input value="' + esc(r.A || '') + '" data-rcac="' + ri + '" dir="auto">',
                      '<input value="' + esc(r.C || '') + '" data-rcc="' + ri + '" dir="auto">',
                      '<input value="' + esc(r.I || '') + '" data-rci="' + ri + '" dir="auto">',
                      may('settings') ? btn('حذف','btn-quiet btn-sm',' data-rcdel="' + ri + '"') : ''];
            })),
          btn('⬇ إكسل — المسؤوليات','btn-secondary btn-sm',' data-xls="raci"'))
      + (may('settings')
        ? card('إضافة نشاط',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('النشاط')) + ' <span class="req">*</span></label><input id="rcA" dir="auto"></div>'
            + '<div class="field"><label>R — ' + esc(t('ينفّذ')) + '</label><input id="rcR" dir="auto"></div>'
            + '<div class="field"><label>A — ' + esc(t('يُساءل')) + '</label><input id="rcAc" dir="auto"></div>'
            + '<div class="field"><label>C — ' + esc(t('يُستشار')) + '</label><input id="rcC" dir="auto"></div>'
            + '<div class="field"><label>I — ' + esc(t('يُبلَّغ')) + '</label><input id="rcI" dir="auto"></div>'
            + '</div>',
            btn('➕ إضافة نشاط','btn-primary btn-sm',' data-rcadd="1"'))
        : '')
      + '<p class="hint">' + esc(t('لكلِّ نشاطٍ مساءَلٌ واحدٌ لا غير — فإن تعدّد ضاعت المسؤولية.')) + '</p>';
  })();
    if (cur === 'esc') return head + (function(){
    var L = escList(), due = escDue();
    var late = due.filter(function(x){ return x.days > 7; });
    var oldest = due.length ? due[0].days : null;

    return stats([['بانتظار التصعيد', N(due.length), due.length ? 'wrn' : 'ok'],
                  ['متأخر أكثر من أسبوع', N(late.length), late.length ? 'bad' : 'ok'],
                  ['قواعد مضبوطة', N(L.length)],
                  ['أقدم عنصر', oldest === null ? '—' : (nm(oldest) + ' ' + t('يوم')),
                    oldest > 7 ? 'bad' : '']])

      + cardFlush(t('قواعد التصعيد') + ' — ' + nm(L.length),
          table(['الحالة','بعد (يوم)','المسؤول','يُصعَّد إلى','الإجراء',''],
            L.map(function(r, i){
              return ['<input value="' + esc(r.w) + '" data-esw="' + i + '" dir="auto">',
                      '<input type="number" min="1" value="' + esc(String(r.days)) + '" data-esd="' + i + '" style="max-width:78px">',
                      '<input value="' + esc(r.who || '') + '" data-eswho="' + i + '" dir="auto">',
                      '<input value="' + esc(r.to || '') + '" data-esto="' + i + '" dir="auto">',
                      '<input value="' + esc(r.act || '') + '" data-esact="' + i + '" dir="auto">',
                      may('settings') ? btn('حذف','btn-quiet btn-sm',' data-esdel="' + i + '"') : ''];
            })),
          '<p class="hint" style="margin:0">' + esc(t('يُحفَظ فورَ كتابته — ولا زرَّ حفظٍ يَعِد بما وقع سلفًا.')) + '</p>')

      + (may('settings')
        ? card('إضافة قاعدة',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('الحالة')) + ' <span class="req">*</span></label><input id="esW" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('بعد (يوم)')) + '</label><input id="esD" type="number" min="1" value="3"></div>'
            + '<div class="field"><label>' + esc(t('المسؤول')) + '</label><input id="esWho" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('يُصعَّد إلى')) + '</label><input id="esTo" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('الإجراء')) + '</label><input id="esAct" dir="auto"></div>'
            + '</div>',
            btn('➕ إضافة قاعدة','btn-primary btn-sm',' data-esadd="1"'))
        : '')

      + cardFlush(t('قائمة التصعيد اليوم') + ' — ' + nm(due.length),
          due.length
            ? table(['الحالة','العنصر','منذ','يُرفَع إلى','الإجراء'],
                due.slice(0, 100).map(function(x){
                  return [pill(t(x.w), x.days > 7 ? 'bad' : 'wrn'),
                          '<span class="num">' + esc(x.what) + '</span>',
                          '<span class="num">' + nm(x.days) + ' ' + esc(t('يوم')) + '</span>',
                          esc(t(x.to || '—')),
                          '<span class="hint" style="margin:0">' + esc(t(x.act || '')) + '</span>'];
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا شيءَ تجاوز مهلتَه — كلُّ ما ينتظر داخلَ مدّته.')) + '</p>');
  })();
    return head + (function(){
    /* ═══ الشاشةُ شاشةٌ ولو كانت شريحةً (V17.14) ═══
       كانت القائمةُ تعدُّ صفحاتِ PAGE وحدَها، وأكثرُ ما تحتاجه الأقسامُ
       شرائحُ داخل صفحات (خطُّ الأساس، المخاطر، الميزانية، المورّدون…) —
       فقالت الخريطةُ «إدارة المشاريع ٠ من ٥ · ناقص ٥» وكلُّها موجودة.
       «ناقص» صار يعني حقًّا: شاشةٌ يحتاجها القسمُ ولم تُبنَ بعد. */
    var P = Object.keys(PAGE).concat(
      typeof FIELD_PAGES === 'object' ? Object.keys(FIELD_PAGES) : []);
    Object.keys(TABS).forEach(function(pg){ TABS[pg].forEach(function(tb){ if (P.indexOf(tb[0]) < 0) P.push(tb[0]); }); });
    function unitRows(side){
      return ORG[side].units.map(function(u){
        var have = u.pages.filter(function(p){ return P.indexOf(p) > -1; });
        var miss = u.pages.filter(function(p){ return P.indexOf(p) < 0; });
        return [u.i + ' <strong>' + esc(t(u.n)) + '</strong>',
                '<span class="hint" style="margin:0">' + esc(t(u.needs)) + '</span>',
                N(have.length) + ' / ' + N(u.pages.length),
                /* «ناقص ٣» كان نصًّا مركَّبًا بالجمع فلا يبلغه القاموس — تُترجَم
                   الكلمةُ وحدَها ويُلحَق بها الرقم */
                miss.length ? pill(t('ناقص') + ' ' + nm(miss.length), 'off') : pill('مغطّى', 'ok')];
      });
    }
    var all = ORG.co.units.concat(ORG.cl.units);
    var covered = all.filter(function(u){
      return u.pages.every(function(p){ return P.indexOf(p) > -1; }); }).length;

    return stats([['جهاتٌ تستخدم النظام', N(all.length), 'acc'],
                  ['مغطّاةٌ كاملًا', N(covered), covered===all.length?'ok':'wrn'],
                  ['أقسام الشركة', N(ORG.co.units.length)],
                  ['إدارات العميل', N(ORG.cl.units.length)]])

      + cardFlush(ORG.co.i + ' ' + t(ORG.co.n),
          table(['القسم','ما يحتاجه','شاشاته','الحالة'], unitRows('co')))

      + cardFlush(ORG.cl.i + ' ' + t(ORG.cl.n),
          table(['الإدارة','ما تحتاجه','شاشاتها','الحالة'], unitRows('cl')))

      + card('المبدأ',
          '<p class="hint" style="margin:0">'
          + esc(t('لكلِّ جهةٍ ما يخصّها: تراه كاملًا ولا ترى ما ليس لها. فالمالُ للمالية، والمورّدون للمشتريات، والمستخلصُ المعتمَدُ وحده للعميل.'))
          + '</p>');
  })();
  }};

/* ── لوحة الإدارة العليا ── */
PAGE.exec = { m:'المتابعة', t:'التقارير التنفيذية',
  l:'اللوحةُ التنفيذية ومركزُ التقارير والملخّصُ المالي.',
  body:function(){
    var head = tabHead('exec'), cur = tabCur('exec');
    if (cur === 'diary') return head + diaryBody();
    if (cur === 'pmi') return head + pmiBody();
    if (cur === 'lessons') return head + lessonsBody();
    if (cur === 'stake') return head + stakeBody();
    if (cur === 'budm') return head + (function(){
    var cap = cfgGet('budCap'), spent = buysSpent();
    var byCat = {};
    buysList().forEach(function(b){ if (b.st !== 'معتمد') return;
      byCat[b.cat] = (byCat[b.cat] || 0) + (+b.amt || 0); });
    var cats = Object.keys(byCat).sort(function(a,b){ return byCat[b] - byCat[a]; });

    /* ═══ الاحتياطي ═══
       الميزانيةُ المعتمدةُ سقفٌ واحد — فلا يُعرَف إن كان التجاوزُ يأكل من
       احتياطيِّ المخاطر المرصود أم من لحم المشروع. صار الاحتياطيُّ نسبةً من
       السقف تُرصَد في الإعدادات، ويُقاس ما استُهلك منه: ما زاد عن التقدير
       عند الاكتمال على خطِّ الأساس هو ما أُكل من الاحتياطي. */
    var resPct = cfgGet('reservePct') || 0, reserve = Math.round(cap * resPct / 100);
    var v = (typeof evm === 'function') ? evm() : null;
    var eaten = v ? Math.max(0, v.EAC - v.BAC) : 0;
    return stats([['الميزانية المعتمدة', cap ? N(cap) : '—', 'acc'],
                  ['المنصرف', N(spent)],
                  ['المتبقي', cap ? N(cap - spent) : '—', cap ? 'ok' : ''],
                  ['نسبة الصرف', cap ? (nm(Math.round(spent / cap * 100)) + '٪') : '—'],
                  ['الاحتياطي المرصود', reserve ? N(reserve) : '—', reserve ? 'acc' : 'wrn'],
                  ['المستهلك من الاحتياطي', reserve ? N(Math.min(eaten, reserve)) : (eaten ? N(eaten) : '—'),
                   !reserve ? '' : (eaten > reserve ? 'bad' : (eaten ? 'wrn' : 'ok'))]])
      + (may('settings')
        ? card('احتياطي المخاطر',
            '<div class="grid cols-2"><div class="field" style="margin:0"><label>' + esc(t('نسبة الاحتياطي من السقف')) + ' (' + esc(t('٪')) + ')</label>'
            + cfgInput('reservePct', undefined, { dec:0 }) + '</div>'
            + '<div class="field" style="margin:0"><label>' + esc(t('قيمته')) + '</label><div class="num" style="padding:10px 0">' + (reserve ? nm(reserve) : '—') + '</div></div></div>'
            + (reserve ? meter('المستهلك من الاحتياطي', Math.min(eaten, reserve), reserve) : '')
            + '<p class="hint" style="margin:8px 0 0">' + esc(t('يُستهلك الاحتياطيُّ بقدر ما يزيد تقديرُ الاكتمال (EAC) على خط الأساس (BAC) — لا بما يُصرَف: الصرفُ في حدود الخط ليس استهلاكًا للاحتياطي.')) + '</p>'
            + (eaten > reserve && reserve ? alertBox('error', t('التقديرُ عند الاكتمال تجاوز الاحتياطيَّ كلَّه — يحتاج قرارَ إدارةٍ أو طلبَ تغيير.')) : ''))
        : (reserve && eaten > reserve ? alertBox('error', t('التقديرُ عند الاكتمال تجاوز الاحتياطيَّ كلَّه — يحتاج قرارَ إدارةٍ أو طلبَ تغيير.')) : ''))

      + (cap ? card('', meter('المستهلك من السقف المعتمد', spent, cap)) : '')

      + (cats.length
        ? cardFlush('المنصرف بأبوابه',
            table(['الباب','المبلغ','النسبة'],
              cats.map(function(c){
                return [esc(c), N(byCat[c]),
                        spent ? (nm(Math.round(byCat[c] / spent * 100)) + '٪') : '٠٪'];
              }),
              ['<b>' + t('الإجمالي') + '</b>', '<b>' + nm(spent) + '</b>', '١٠٠٪']),
            btn('⬇ إكسل — الملخّص','btn-secondary btn-sm',' data-xls="budm"'))
        : card('', alertBox('info','لا مصروفاتٍ مسجّلةً بعد.')))

      + card('كلفة العمل الميداني',
          (function(){
            var S = scores();
            var pts = S.list.reduce(function(a,e){ return a + e.total; }, 0);
            var pay = S.list.reduce(function(a,e){ return a + e.money; }, 0);
            return '<div class="stats" style="margin:0">'
              + stat('نقاطٌ أُنجزت', N(Math.round(pts)))
              + stat('سعر النقطة', cfgGet('ph') ? N(cfgGet('ph')) + ' ' + t('ريال') : '—')
              + stat('مستحقّ الفنيين', cfgGet('ph') ? N(Math.round(pay)) : '—', 'acc')
              + stat('من عملوا', N(S.n))
              + '</div>';
          })()
          + '<p class="hint">' + esc(t('محسوبٌ من أوزان الإعدادات وما سجّله كلُّ فنيٍّ — لا رقمَ مكتوبٌ بيد.')) + '</p>')

      + '<p class="hint">' + esc(t('تفاصيلُ المورّدين والفواتير في دفتر المشتريات — وهو للمهندس.')) + '</p>';
  })();
    return head + (function(){
    var S = siteStats(), v = (typeof evm === 'function') ? evm() : null;
    var SC = scores();
    var pay = SC.list.reduce(function(a,e){ return a + e.money; }, 0);
    var open = (typeof RISKS !== 'undefined')
      ? RISKS.filter(function(r){ return r.st === 'مفتوح' && riskScore(r) >= 12; }) : [];

    return stats([['الإنجاز', nm(S.total ? Math.round(S.surveyed / S.total * 100) : 0) + '٪',
                   'acc'],
                  ['أداء الجدول', v ? nm(v.SPI) : '—', v && v.SPI < 0.95 ? 'bad' : 'ok'],
                  ['أداء الكلفة', v ? nm(v.CPI) : '—', v && v.CPI < 0.95 ? 'bad' : 'ok'],
                  ['مخاطر حرجة', N(open.length), open.length ? 'bad' : 'ok']])

      + card('الموقف في سطر',
          v
            ? alertBox(v.SPI >= 0.95 && v.CPI >= 0.95 ? 'success' : (v.SPI < 0.9 ? 'error' : 'warn'),
                'أُنجز ' + nm(Math.round(v.EV)) + ' من ' + nm(v.BAC) + ' — '
                + t(evmVerdict(v).t) + '. والمتوقَّع عند الإتمام ' + nm(v.EAC)
                + (v.VAC < 0 ? ' بتجاوزٍ قدره ' + nm(-v.VAC) : ' بوفرٍ قدره ' + nm(v.VAC)) + '.')
            : alertBox('warn','لم يُجمَّد خطُّ أساسٍ بعد — فلا حكمَ على الأداء.'),
          btn('التفاصيل','btn-secondary btn-sm',' data-p="evm"'))

      + card('الأرقام الكبرى',
          table(['البند','القيمة','الملاحظة'], [
            ['نطاق المشروع', N(S.total), 'نقطةٌ في أربعة مشاعر'],
            ['تمت الزيارة', N(S.surveyed), S.total ? nm(Math.round(S.surveyed/S.total*100))+'٪' : ''],
            ['أُنجز تركيبًا', N(S.installed), S.total ? nm(Math.round(S.installed/S.total*100))+'٪' : ''],
            ['من يعملون', N(SC.n), 'فنيًّا ومهندسًا'],
            ['مستحقُّ العمل', cfgGet('ph') ? N(Math.round(pay)) : '—', 'محسوبٌ من الأوزان'],
            ['المنصرف على المشتريات', N(buysSpent()), cfgGet('budCap')
              ? nm(Math.round(buysSpent() / cfgGet('budCap') * 100)) + '٪ من السقف' : '']
          ]))

      + (open.length
        ? cardFlush('ما يحتاج قرارَك',
            table(['الخطر','الدرجة','المالك','الاستجابة'],
              open.map(function(r){
                var L = riskLevel(riskScore(r));
                return [esc(r.t), '<span class="pill ' + L.c + '">' + nm(riskScore(r)) + '</span>',
                        esc(r.own), esc(r.resp)];
              })),
            btn('السجل كاملًا','btn-secondary btn-sm',' data-p="risks"'))
        : card('', alertBox('success','لا مخاطرَ حرجةً مفتوحةً الآن.')));
  })();
  }};

