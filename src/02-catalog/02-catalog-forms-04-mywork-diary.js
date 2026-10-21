/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-04-mywork-diary.js
   DOMAIN  : Catalogue & point — definitions, classification, permissions, survey edit
   PURPOSE : 'My work' screens, project diary, weight/target simulator and how dues are computed.
   DEFINES : perfRankTable, diaryRows, diaryBody, simState, simSave, simTypes, simW, simRows, simCard, moneyHowCard
   GLOBALS : STAGE_TAB, PERF_VIEW, SIM
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ «شغلي» — أربعُ شاشاتٍ كانت تجيب سؤالًا واحدًا ═══
   «مهامي» و«أدائي» و«فريقي» و«شغل فريقي»: أربعٌ في القائمة يراها الفنيُّ
   والمشرفُ معًا، وكلُّها تجيب «ما عملتُه وما أُسند إليّ». فكان يفتحها
   بالتناوب يبحث عن رقمه، والقائمةُ تطول بلا أن تزيد معرفةً.

   جُمعت في شاشةٍ بأربع شرائح. **ولم يُحذف شيء**: كلُّ جسمٍ نُقل كما هو —
   نفسُ الأرقام ونفسُ الجداول ونفسُ الصلاحيات — وإنما صار المدخلُ واحدًا.
   والشريحةُ لا تظهر لمن لا يملك أصلَها: من لا يرى «فريقي» لا تظهر له. */

PAGE.mywork = { m:'الميدان', t:'شغلي',
  l:'مهامُّك وجدولُك وأداؤك وفريقُك — في شاشةٍ واحدة.',
  body:function(){
    var head = tabHead('mywork'), cur = tabCur('mywork');
    if (cur === 'mine') return head + (function(){
    /* كانت أصفارًا مكتوبةً وزرَّ تصديرٍ معطَّلًا بحجّة «نظامُ الإسناد غيرُ
       مبنيٍّ بعد» — وقد بُني (STATE.tasks وasnOfTech). فصارت تقرأ. */
    var me = STATE.meta.name || '';
    var mine = [];
    Object.keys(STATE.tasks).forEach(function(k){
      var x = STATE.tasks[k];
      if (x.to === me && x.status !== 'معتمد') mine.push(x);
    });
    mine.sort(function(a,b){ return (b.at || 0) - (a.at || 0); });

    var e = scoreOf(me);
    var Tg = T(), target = cfgN(Tg.survey) + cfgN(Tg.ins) + cfgN(Tg.dis);
    var day = dayKey();
    var doneToday = (e.days && e.days[day]) || 0;

    return attMyCard()
      + routeCard()
      + stats([['مُسند إليّ', N(mine.length), mine.length ? 'wrn' : 'ok'],
                  ['أنجزتُ اليوم', N(doneToday), 'ok'],
                  ['نقاطي هذا الشهر', N(Math.round(e.total)), 'acc'],
                  ['ترتيبي', e.rank ? nm(e.rank) : '—']])

      + (mine.length
        ? cardFlush(t('المُسند إليّ') + ' — ' + nm(mine.length),
            table(['الرقم','النوع','النقطة','الحالة'],
              mine.slice(0, 100).map(function(x){
                var st = siteFind(x.site);
                return ['<span class="num">' + esc(x.no || '—') + '</span>',
                        pill(kindLabel(x.kind), 'acc'),
                        '<strong>' + esc(x.site) + '</strong>'
                          + (st ? '<br><span class="hint" style="margin:0">'
                              + esc((st.name || '').slice(0, 28)) + '</span>' : ''),
                        pill(x.status || 'مُسند', 'wrn')];
              })))
        : card('لا مهامَ مسنَدةً إليك الآن',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('تظهر هنا فور أن يُسنِد إليك المشرفُ نقاطًا من «توزيع الفرق».')) + '</p>'))

      + card('شغلي وترتيبي',
          table(['البند','قيمتي'], [
            ['نقاط المسح', N(Math.round(e.pSurvey))],
            ['نقاط التركيب', N(Math.round(e.pInstall))],
            ['نقاط الفك', N(Math.round(e.pDis))],
            ['ترتيبي', e.rank ? nm(e.rank) : '—'],
            ['نسبتي من تارجتي', target ? pct(e.total, target) : '—']
          ]))
      + '<p class="hint">' + esc(t('ترتيبك يظهر بلا كشف أرقام زملائك — المقارنة تحفيزٌ لا مساءلةٌ علنية.')) + '</p>';
  })();
    if (cur === 'myscore') return head + (function(){
    var me = STATE.meta.name || '';
    var e = scoreOf(me);
    var peers = stageList(e.stage);
    var myRank = peers.findIndex(function(p){ return p.name === me; }) + 1;
    var tgt = stageTarget(e.stage);
    var R = STAGE_ROLES[e.stage] || { n:'—', i:'' };

    return stats([['نقاطي', N(e.total), 'acc'],
                  ['ترتيبي', myRank ? (nm(myRank) + ' / ' + nm(peers.length)) : '—',
                   myRank === 1 ? 'ok' : ''],
                  ['أعمالي', N(e.acts)],
                  ['أيام عملي', N(e.nDays)]])

      + card(R.i + ' ' + t(R.n),
          (tgt ? meter('من تارجت المرحلة', e.total, tgt) : '')
          + table(['العمل','العدد','النقاط'], [
              ['زيارة ميدانية', N(e.survey), N(Math.round(e.pSurvey*10)/10)],
              ['تركيب معتمد',   N(e.install), N(Math.round(e.pInstall*10)/10)],
              ['فك',            N(e.dis),    N(Math.round(e.pDis*10)/10)],
              ['تهيئة',         N(e.prep),   N(Math.round(e.pPrep*10)/10)],
              ['تجميع',         N(e.asm),    N(Math.round(e.pAsm*10)/10)]
            ].filter(function(r){ return r[1] !== '٠' || r[2] !== '٠'; })
             .concat([['<b>' + t('الإجمالي') + '</b>','', '<b>' + nm(e.total) + '</b>']])))

      + (cfgGet('ph')
        ? card('المستحَق',
            '<div class="stats" style="margin:0">'
            + stat('نقاطي', N(e.total))
            + stat('سعر النقطة', N(cfgGet('ph')) + ' ' + esc(t('ريال')))
            + stat('المستحَق', N(e.money) + ' ' + esc(t('ريال')), 'ok')
            + stat('متوسط اليوم', N(e.perDay))
            + '</div>'
            + (e.dayCap
              ? table(['البند','نقاط','سعر','مستحَق'], [
                  ['عادي', N(e.regular), N(cfgGet('ph')), N(e.moneyReg)],
                  ['إضافي', N(e.over), N(Math.round(cfgGet('ph') * (cfgGet('otRate')||1.5) * 100)/100),
                   N(e.moneyOT)]
                ], ['<b>' + t('الإجمالي') + '</b>', N(e.total), '', '<b>' + nm(e.money) + '</b>'])
                + '<p class="hint">سقفُ يومك <b>' + nm(e.dayCap) + '</b> نقطة — وما زاد عنه في يومٍ '
                + 'يُحتسب إضافيًّا بمعامل <b>' + nm(cfgGet('otRate') || 1.5) + '</b>.</p>'
              : '<p class="hint">' + esc(t('لم يُضبط تارجتُ مرحلتك — فلا يُفصَل الإضافيُّ عن العادي.')) + '</p>')
            + '<p class="hint">' + esc(t('النقاطُ تُحتسب من أوزان الإعدادات — والتركيبُ لا يُحتسب حتى يعتمده المهندس.')) + '</p>')
        : alertBox('warn','سعرُ النقطة لم يُضبط بعد — يُكتب في الإعدادات ← ثوابت النظام.'))

      + (peers.length > 1
        ? cardFlush('ترتيبي في ' + t(R.n),
            table(['#','الفني','أعمال','النقاط'],
              peers.slice(0, 20).map(function(p, i){
                var me2 = p.name === me;
                return [(me2 ? '<b>' + nm(i+1) + '</b>' : nm(i+1)),
                        me2 ? '<b>' + esc(p.name) + '</b>' : esc(p.name),
                        N(p.acts),
                        me2 ? '<b>' + nm(p.total) + '</b>' : N(p.total)];
              })),
            '<span class="hint" style="margin:0">' + esc(t('أرقامُ زملائك في مرحلتك وحدها — لا في غيرها')) + '</span>')
        : '')

      + card('كيف تُحسب نقاطي',
          flow(['أعمل','يُوزَن بالإعدادات','يُعتمد','يدخل نقاطي'], 0)
          + '<p class="hint">' + esc(t('وزنُ كل عملٍ ثابتٌ في الإعدادات ولا يتغيّر — وما تعمله يُوزَن به.')) + '</p>');})();
    if (cur === 'myteam') return head + (function(){
    var mine = techsList().filter(function(x){ return underNames(STATE.meta.name || '').indexOf(x.n) > -1; });
    var names = mine.map(function(x){ return x.n; });
    if (!names.length){
      return card('لا أحدَ تحت إشرافك بعد',
        '<p class="hint" style="margin:0">'
        + esc(t('حقلُ «المشرف» في سجل كلِّ موظفٍ هو ما يربطه بك — تأكّد أنه مكتوبٌ باسمك بالضبط في صفحة «الفرق».'))
        + '</p>');
    }
    var byName = scores().byName;
    var list = names.map(function(n){ return byName[n] || {
      name:n, survey:0, install:0, dis:0, pSurvey:0, pInstall:0, pDis:0,
      pBonus:bonusFor(n), total:bonusFor(n), installT:{}, disT:{}
    }; });
    list.sort(function(a,b){ return b.total - a.total; });

    return stats([['أفراد الفريق', N(names.length), 'acc'],
                  ['نقاط الفريق هذا الشهر', N(Math.round(list.reduce(function(a,e){ return a + e.total; }, 0)))]])
      + card('أداء فريقي هذا الشهر', techPerfTable(list, false))
      + '<p class="hint">' + esc(t('أرقام زملائك في الفرق الأخرى لا تظهر لك — المقارنة داخل فريقك وحده.')) + '</p>'
      + (maySupEng() ? bonusFormHtml(names, 'mt') : '')
      + bonusLogHtml(names);})();
    if (cur === 'board') return head + (function(){
      /* ═══ لوحةُ الفريق — من تحتي في صفٍّ لكلِّ واحد ═══
         الأداءُ في «فريقي» نقاطٌ ومعدّلات؛ وهذه العملُ نفسُه: ما أُسند لكلٍّ الآن،
         وما أنجزه اليوم، وما ينتظر اعتمادَ المهندس منه، ومتى ظهر آخرَ مرة. */
      var me = STATE.meta.name || '';
      /* آخرُ ظهورٍ من نبضات الحضور — تُجلَب كما تُجلَب في صحة النظام */
      if (may('users') || may('exportAll')) presenceFetch(false);
      var today = dayKey(Date.now()), U = STATE.users || {}, P = STATE.presence || {};
      var roleOf = {}; Object.keys(U).forEach(function(k){ var u = U[k]; if (u && u.name) roleOf[u.name] = u.role; });
      /* الكلُّ تحتي — ميدانًا ومكتبًا — بمرشِّح الدور: مديرُ المشروع يرى الجميع،
         والمهندسُ من تحته، والمشرفُ فريقَه. المهندسُ يُعَدُّ له اعتمادُه لا زياراتُه. */
      /* المطّلعُ الوزاريُّ ليس من الفريق: لا عملَ يُعَدُّ له، فصفُّه أصفارٌ تشوّش
         اللوحةَ — يُستبعَد كما يُستبعَد من قائمة الناس */
      var all = underNames(me).filter(function(n2){ return effRole(roleOf[n2] || 'tech') !== 'viewer'; });
      if (!all.length) return card('لا أحدَ تحت إشرافك بعد', '<p class="hint" style="margin:0">' + esc(t('حقلُ «مديره» في سجل كلِّ موظفٍ هو ما يربطه بك.')) + '</p>');
      var byRole = {}; all.forEach(function(n){ var r = effRole(roleOf[n] || 'tech'); byRole[r] = (byRole[r] || 0) + 1; });
      if (BOARD_ROLE && !byRole[BOARD_ROLE]) BOARD_ROLE = '';
      var names = BOARD_ROLE ? all.filter(function(n){ return effRole(roleOf[n] || 'tech') === BOARD_ROLE; }) : all;
      var chips = '<div class="chips">'
        + '<button type="button" class="chip' + (BOARD_ROLE ? '' : ' on') + '" data-boardrole="">' + esc(t('الكل')) + ' <span class="num">' + nm(all.length) + '</span></button>'
        + Object.keys(byRole).sort(function(a, b){ return rankOf(b) - rankOf(a); }).map(function(r){
            return '<button type="button" class="chip' + (BOARD_ROLE === r ? ' on' : '') + '" data-boardrole="' + esc(r) + '">'
              + esc(t((ROLES[r] || {}).n || r)) + ' <span class="num">' + nm(byRole[r]) + '</span></button>'; }).join('')
        + '</div>';
      var seen = {}; Object.keys(P).forEach(function(k){ var p = P[k]; if (p && p.name && (!seen[p.name] || p.at > seen[p.name])) seen[p.name] = p.at || 0; });
      var rows = names.map(function(n){
        var open = 0, doneToday = 0, visits = 0, pend = 0, inst = 0, appr = 0, dis = 0, mnt = 0, byKind = {};
        /* المُسندُ المفتوحُ بنوعه: زيارةٌ وتركيبٌ وصيانةٌ وفكٌّ وتهيئةٌ وتجميع — كلُّ ما يُسنَد */
        Object.keys(STATE.tasks || {}).forEach(function(k){ var x = STATE.tasks[k]; if (!x || x.to !== n) return;
          if (x.status === 'مُنجز' || x.status === 'معتمد'){ if (dayKey(x.doneAt || x.at) === today) doneToday++; }
          else { open++; byKind[x.kind || 'visit'] = (byKind[x.kind || 'visit'] || 0) + 1; } });
        Object.keys(STATE.diss || {}).forEach(function(k){ var r = STATE.diss[k]; if (r && r.by === n && r.status === 'تم الفك') dis++; });
        Object.keys(STATE.maints || {}).forEach(function(k){ var r = STATE.maints[k]; if (r && (r.by === n || r.to === n)) mnt++; });
        Object.keys(STATE.recs || {}).forEach(function(k){ var r = STATE.recs[k]; if (!r) return;
          if ((r.reviewBy === n && dayKey(r.reviewAt) === today) || (r.revisitBy === n && dayKey(r.revisitAt) === today)) appr++;
          if (r.by !== n) return;
          if (dayKey(r.at) === today) visits++; if (svReview(r) === 'pending') pend++; });
        Object.keys(STATE.inss || {}).forEach(function(k){ var r = STATE.inss[k]; if (r && r.by === n && r.status === 'مُركّب') inst++; });
        var ago = seen[n] ? Math.round((Date.now() - seen[n]) / 60000) : -1;
        var kinds = Object.keys(byKind).map(function(k){ return nm(byKind[k]) + ' ' + t((WO_KINDS[k] || { n:k }).n); }).join(' · ');
        return { n:n, role:roleOf[n] || '', open:open, kinds:kinds, done:doneToday, visits:visits, pend:pend, inst:inst, dis:dis, mnt:mnt, appr:appr, ago:ago };
      }).sort(function(a, b){ return (b.open + b.pend) - (a.open + a.pend) || arCmp(a.n, b.n); });
      var tot = rows.reduce(function(a, r){ a.open += r.open; a.visits += r.visits; a.pend += r.pend; return a; }, { open:0, visits:0, pend:0 });
      return chips
        + stats([['أفراد', N(rows.length), 'acc'], ['مُسند مفتوح', N(tot.open), tot.open ? 'wrn' : ''],
                    ['زيارات اليوم', N(tot.visits), 'ok'], ['بانتظار الاعتماد', N(tot.pend), tot.pend ? 'wrn' : 'ok']])
        + cardFlush(t('لوحة الفريق') + ' \u2014 ' + nm(rows.length),
            table(['الاسم','الدور','مُسند مفتوح','زيارات اليوم','بانتظار الاعتماد','مُركّب','فُكّ','صيانة','اعتمادات اليوم','آخر ظهور'], rows.map(function(r){
              return ['<strong>' + esc(dispName(r.n)) + '</strong>', esc(t((ROLES[r.role] || {}).n || r.role || '—')),
                      r.open ? '<b class="num">' + nm(r.open) + '</b>' + (r.kinds ? '<br><span class="hint" style="margin:0">' + esc(r.kinds) + '</span>' : '') : N(0), N(r.visits),
                      r.pend ? '<b class="num" style="color:#E8C34B">' + nm(r.pend) + '</b>' : N(0), N(r.inst), N(r.dis), N(r.mnt), N(r.appr),
                      r.ago < 0 ? '<span class="hint" style="margin:0">' + esc(t('لم يظهر')) + '</span>'
                        : (r.ago < 60 ? pill(nm(r.ago) + ' ' + t('د'), 'ok') : (r.ago < 1440 ? pill(nm(Math.round(r.ago / 60)) + ' ' + t('س'), 'wrn') : pill(nm(Math.round(r.ago / 1440)) + ' ' + t('يوم'), 'off')))];
            })))
        + (tot.pend && may('approve') ? '<div class="actions">' + btn('\u2705 ' + t('اعتماد الزيارات') + ' (' + nm(tot.pend) + ')','btn-primary btn-sm',' data-p="svappr"') + '</div>' : '');
    })();
    if (cur === 'mycrew') return head + (function(){
    var c = crewOf(CREW_VIEW);
    var S = crewStat(c);
    var K = c.kind === '*' ? null : WO_KINDS[c.kind];
    return '<div class="chips">' + CREWS.filter(function(x){ return x.kind !== '*'; }).map(function(x){
        return '<button type="button" class="chip' + (CREW_VIEW===x.id?' on':'') + '" data-crew="' + x.id + '">'
          + (WO_KINDS[x.kind] ? WO_KINDS[x.kind].i + ' ' : '') + esc(t(x.n)) + '</button>';
      }).join('') + '</div>'
      + stats([['اليوم','<span class="num">'+nm(S.day)+'</span>','ok'],
               ['هذا الأسبوع','<span class="num">'+nm(S.week)+'</span>'],
               ['هذا الشهر','<span class="num">'+nm(S.month)+'</span>','acc'],
               ['مفتوح','<span class="num">'+nm(S.open)+'</span>','wrn']])
      + (S.tgtM ? card('مقابل التارجت',
          meter('الشهري', S.month, S.tgtM)
          + meter('الأسبوعي', S.week, cfgWk(S.tgtM))) : '')
      + cardFlush('مهام الفريق',
          '<p class="hint" style="padding:16px;text-align:center;margin:0">' + esc(t('لا مهام مفتوحة من نوع '
          + esc(K ? t(K.n) : t('كل الأنواع')) + '.')) + '</p>',
          btn('⬇ تقرير فريقي','btn-quiet btn-sm disabled', ' disabled title="'+ esc(t('يحتاج قائمةَ مهامٍ فرديةً — غيرُ مبنيةٍ بعد. الإجماليّاتُ أعلاه حقيقيةٌ وتُقرأ الآن.')) + '"'))
      + card('دورة المهمة', flow(['مطلوب','قيد التنفيذ','منفّذ','معتمد'], 0)
        + '<p class="hint">' + esc(t('المهمة لا تُحتسب نقاطًا حتى يعتمدها المهندس — والإعادة تردّها بحالة «مُعاد» مع سبب.')) + '</p>');})();
    return head + attMyCard() + fieldHelperCard() + routeCard()   /* (V29.4) مساعدُ الميدان على «مهامي» */
      /* مهامُّ الاجتماع التي على اسمي — هنا حيث يبدأ كلٌّ يومَه، لا في قائمة الجميع */
      + (function(){
          var W = wtMine(); if (!W.length) return '';
          return cardFlush(t('مهامّي من الاجتماع') + ' — ' + nm(W.length),
            '<div class="grid cols-2 wt-grid">' + W.map(wtCardOf).join('') + '</div>');
        })()
      + '<div class="actions" style="margin:0 0 10px">' + btn('\u2B07 ' + t('إكسل') + ' \u2014 ' + t('مهامي'),'btn-secondary btn-sm',' data-xls="mywork"') + '</div>'
      + (function(){
    var me = STATE.meta.name || '';
    /* حالةُ مهمةِ زيارة: من تعليقة الحفظ إلى قرار المهندس */
    function taskPill(x){
      /* (V38.56) an install task is read from the installation record, not from the survey of the same site — it showed
         «معتمدة» (the survey's approval) before anything was installed */
      if (x.kind === 'install'){
        var ins = STATE.inss[x.site] || {};
        /* (V38.57) the installer must know the save reached the office, not only that it was saved on the phone */
        if ((STATE.poison || []).some(function(p){ return p && p.kind === 'inss' && String(p.id) === String(x.site); })) return pill('\u26A0 ' + t('لم يصل المكتب — يُعاد إرسالُه'), 'bad');
        if ((STATE.queue || []).some(function(q){ return q && q.kind === 'inss' && String(q.id) === String(x.site); })) return pill('\u23F3 ' + t('محفوظٌ على الجهاز — لم يُرفَع بعد'), 'wrn');
        if (ins.approved) return pill('اعتُمد التركيب', 'ok');
        if (ins.status === 'مُعاد') return pill('أُعيد للتصحيح', 'off');
        if (insDone(x.site)) return pill('رُكِّب — بانتظار التدقيق', 'acc');
        if (ins.status === 'قيد التركيب' || ins.status === 'مسودّة') return pill(ins.status, 'wrn');
        return pill('بانتظارك', 'warn');
      }
      var r = STATE.recs[x.site], rv = svReview(r);
      if (rv === 'approved') return pill('معتمدة', 'ok');
      if (rv === 'revisit')  return pill('تحتاج زيارة أخرى', 'off');
      if (rv === 'pending')  return pill('تمّت — بانتظار الاعتماد', 'acc');
      if (r && !svDone(r))   return pill(r.access || 'متعذّر', 'wrn');
      return pill('بانتظارك', 'warn');
    }
    /* المهندسُ والمديرُ يريان الإسناداتِ كلَّها — كلُّ مشرفٍ ونقاطُه التي سيزورها */
    if (may('approve')){
      var by = {}, open = 0, pend = 0, rev = 0;
      Object.keys(STATE.tasks).forEach(function(k){
        var x = STATE.tasks[k];
        if (!x || x.status === 'معتمد') return;
        (by[x.to || '—'] = by[x.to || '—'] || []).push(x); open++;
        var rv = svReview(STATE.recs[x.site]);
        if (rv === 'pending') pend++; else if (rv === 'revisit') rev++;
      });
      var sups = Object.keys(by).sort(function(a, b){ return by[b].length - by[a].length; });
      return attMyCard()
        + (may('settings') ? seedCard() + readyCard() : '')
        + inboxCard()
        + stats([['إسناداتٌ مفتوحة', N(open), 'acc'], ['مشرفون', N(sups.length)],
                    ['تمّت — تنتظر اعتمادك', N(pend), pend ? 'wrn' : ''],
                    ['تحتاج زيارة أخرى', N(rev), rev ? 'bad' : '']])
        + (pend ? alertBox('info', nm(pend) + ' ' + t('زيارةً تنتظر اعتمادك — من «اعتماد الزيارات».'))
                  + '<div class="actions" style="margin:-4px 0 12px">' + btn('✅ ' + t('اعتماد الزيارات'),'btn-primary btn-sm',' data-p="svappr"') + '</div>' : '')
        + (sups.length
          ? sups.map(function(sp){
              var L = by[sp];
              return cardFlush(esc(dispName(sp)) + ' — ' + nm(L.length) + ' ' + t('نقطة'),
                table(['النقطة','النوع','الموعد','الحالة'],
                  L.slice(0, 80).map(function(x){
                    var st = siteFind(x.site), k = WO_KINDS[x.kind] || { i:'', n:x.kind };
                    return ['<strong>' + esc(x.site) + '</strong><br><span class="hint" style="margin:0">'
                              + esc(((st && st.name) || '').slice(0, 28)) + '</span>',
                            k.i + ' ' + esc(t(k.n)),
                            x.when ? '<span class="num">' + esc(x.when) + '</span>' : '—',
                            taskPill(x)];
                  })));
            }).join('')
          : card('لا إسناداتٍ مفتوحة', '<p class="hint" style="text-align:center;margin:0">'
              + esc(t('أسند نقاطًا للمشرفين من الخريطة أو «توزيع الفرق» فتظهر هنا بمشرفها وحالتها.')) + '</p>'))
        + '<p class="hint">' + esc(t('الدورة: يُسنِد المهندسُ ← يزور المشرفُ ويحفظ ← تظهر في «اعتماد الزيارات» ← يعتمدها المهندسُ أو يردُّها «تحتاج زيارةً أخرى» فتعود إلى مهام المشرف بسبب الردّ.')) + '</p>';
    }
    var mine = [];
    Object.keys(STATE.tasks).forEach(function(k){
      var x = STATE.tasks[k];
      if (x.to === me && x.status !== 'معتمد') mine.push(x);
    });
    /* (V38.56) «done» and «returned» by the task's own kind: an installation is done when installed, returned when sent back */
    var done = mine.filter(function(x){ return x.kind === 'install' ? insDone(x.site) : svVisited(STATE.recs[x.site]); }).length;   /* (V32.8) تمت الزيارة بأيِّ نتيجة */
    var back = mine.filter(function(x){ return x.kind === 'install' ? (STATE.inss[x.site] || {}).status === 'مُعاد' : svReview(STATE.recs[x.site]) === 'revisit'; }).length;
    var myPts = (typeof scoreOf === 'function') ? (scoreOf(me) || {}).total || 0 : 0;

    return stats([['مُسند إليّ', N(mine.length), 'acc'],
                  ['أنجزتُ', N(done), 'ok'],
                  ['المتبقي', N(mine.length - done), mine.length-done?'wrn':''],
                  ['أُعيد إليّ', N(back), back ? 'bad' : ''],
                  ['نقاطي', N(myPts)]])
      + (mine.length
        ? cardFlush(t('مهامي') + ' — ' + nm(mine.length),
            '<div class="list">' + mine.slice(0, 60).map(function(x){
              var s = siteFind(x.site);
              if (!s) return '';
              var k = WO_KINDS[x.kind] || { i:'', n:x.kind };
              var rr = STATE.recs[x.site];
              var insR = x.kind === 'install' ? (STATE.inss[x.site] || {}) : null;   /* (V38.59) the return reason of an installation */
              var why = (rr && svReview(rr) === 'revisit' && rr.revisitNote)
                ? '<div class="hint" style="margin:2px 0 0;color:var(--danger)">\u21a9 ' + esc(rr.revisitNote) + '</div>'
                : (insR && insR.status === 'مُعاد' && insR.why ? '<div class="hint" style="margin:2px 0 0;color:var(--danger)">\u21a9 ' + esc(insR.why) + '</div>' : '');
              /* (V38.56) an install task opens its install form directly — the installer's next step; others open the site */
              return '<div class="list-item" ' + (x.kind === 'install' ? 'data-insform' : 'data-site') + '="' + esc(x.site) + '"><div class="li-main">'
                + '<div class="li-t">' + (s.sign ? esc(t('شاخص')) + ' ' + esc(s.sign) : esc(s.name.slice(0,36))) + '</div>'
                + '<div class="li-s"><span class="num">' + esc(x.site) + '</span> · '
                +   k.i + ' ' + esc(t(k.n)) + (x.when ? ' · ' + esc(x.when) : '') + '</div>' + why
                + '</div><div class="li-end">'
                + (typeof distTxt === 'function' && distTxt(s)
                    ? '<div class="num" style="margin-bottom:3px">\u{1F4CD} ' + distTxt(s) + '</div>' : '')
                + taskPill(x) + '</div></div>';
            }).join('') + '</div>',
            btn('🗺 على الخريطة','btn-secondary btn-sm',' data-mymap="1"'))
        : card('مهامي',
            '<p class="hint" style="text-align:center;margin:0">'
            + esc(t('لا مهام مسندة إليك — يُسندها المشرف من طلبات الزيارة.')) + '</p>',
            btn('\u2753 ' + t('كيف تسير الدورة؟'),'btn-quiet btn-sm',' data-p="wf"')))
      + card('دورة مهمتك', flow(['مُسندة إليك','نفّذتها وحفظت','بانتظار الاعتماد','معتمدة'], 0)   /* (V38.56) visit or installation */
        + '<p class="hint">' + esc(t('نقاطُك لا تُحسَب إلا بعد أن يعتمد المهندسُ ما نفّذته — وإذا أعادها «تحتاج زيارةً أخرى» ترجع إلى قائمتك ومعها سببُ الإعادة.')) + '</p>');})();
  }};
;

/* ── تبويبُ كل مرحلة: فريقُها وأعمالُهم ── */
var STAGE_TAB = 'ins';

var PERF_VIEW = 'rank';

/* ── الترتيب العام: كلُّ من عمل، برقمه ومرتبته ومستحقّه ── */
function perfRankTable(){
  var S = scores();
  var Tg = T(), target = cfgN(Tg.survey) + cfgN(Tg.ins) + cfgN(Tg.dis);
  var sum = S.list.reduce(function(a,e){ return a + e.total; }, 0);
  var money = S.list.reduce(function(a,e){ return a + e.money; }, 0);

  return stats([['من عملوا', N(S.n), 'acc'],
                ['إجمالي الأعمال', N(S.list.reduce(function(a,e){return a+e.acts;},0))],
                ['إجمالي النقاط', N(Math.round(sum))],
                ['المستحَق', cfgGet('ph') ? N(Math.round(money)) + ' ' + t('ريال') : '—']])

    + (S.n
      ? cardFlush(t('الترتيب العام') + ' — ' + nm(S.n),
          table(['#','الاسم','المرحلة','زيارة','تركيب','فك','زيادة','الإجمالي','من التارجت','متوسط اليوم','المستحَق'],
            S.list.map(function(e){
              var R = STAGE_ROLES[e.stage] || { n:e.stage, i:'' };
              return [e.rank <= 3 ? '<b>' + nm(e.rank) + '</b>' : nm(e.rank),
                      '<strong>' + esc(dispName(e.name)) + '</strong>',
                      R.i + ' ' + esc(t(R.n)),
                      N(e.survey), N(e.install), N(e.dis),
                      e.pBonus ? ('<span class="' + (e.pBonus > 0 ? 'num' : 'req') + '">'
                                   + (e.pBonus > 0 ? '+' : '') + nm(Math.round(e.pBonus * 10) / 10) + '</span>') : '—',
                      '<b>' + nm(Math.round(e.total * 10) / 10) + '</b>',
                      target ? pct(e.total, target) : '—',
                      N(e.perDay), cfgGet('ph') ? N(e.money) : '—'];
            }),
            ['','<b>' + t('الإجمالي') + '</b>','',
             N(S.list.reduce(function(a,e){return a+e.survey;},0)),
             N(S.list.reduce(function(a,e){return a+e.install;},0)),
             N(S.list.reduce(function(a,e){return a+e.dis;},0)),
             N(Math.round(S.list.reduce(function(a,e){return a+e.pBonus;},0) * 10) / 10),
             '<b>' + nm(Math.round(sum)) + '</b>', '', '',
             cfgGet('ph') ? N(Math.round(money)) : '—']),
          '<div class="actions">'
          + btn('⬇ إكسل — التقرير','btn-secondary btn-sm',' data-xls="score"')
          + btn('🖨 PDF','btn-secondary btn-sm',' data-print="1"')
          + '</div>')
      : card('', alertBox('info','لا أعمال مسجّلةً بعد — تظهر هنا فورَ أول مسحٍ أو تركيب.')))

    + simCard()
    + moneyHowCard(S)
    /* المسحُ بنوع الموقع لكلِّ عضو: كم مخيمًا وكم ممرًّا فعلًا، وبكم نقطة، وكم في اليوم (V18.6) */
    + (function(){
        var L = S.list.filter(function(e){ return e.survey > 0; }); if (!L.length) return '';
        var types = {}; L.forEach(function(e){ Object.keys(e.surveyT).forEach(function(k){ types[k] = (types[k] || 0) + e.surveyT[k].n; }); });
        var cols = Object.keys(types).sort(function(a, b){ return types[b] - types[a]; }).slice(0, 5);
        var cell = function(o){ return o ? nm(o.n) + ' <span class="hint" style="margin:0">(' + nm(Math.round(o.pts)) + ')</span>' : '\u2014'; };
        return cardFlush(t('المسحُ بنوع الموقع لكلِّ عضو') + ' \u2014 ' + t('العدد (النقاط)'),
          table(['الاسم'].concat(cols.map(function(c){ return t(c); })).concat(['زيارات','نقاط المسح','أيام العمل','نقطة / يوم']),
            L.map(function(e){
              return ['<strong>' + esc(dispName(e.name)) + '</strong>'].concat(cols.map(function(c){ return cell(e.surveyT[c]); }))
                .concat([N(e.survey), N(Math.round(e.pSurvey)), N(e.nDays), N(e.nDays ? Math.round(e.pSurvey / e.nDays * 10) / 10 : 0)]);
            }),
            ['<b>' + t('الإجمالي') + '</b>'].concat(cols.map(function(c){ var n = 0, p = 0; L.forEach(function(e){ if (e.surveyT[c]){ n += e.surveyT[c].n; p += e.surveyT[c].pts; } }); return cell({ n:n, pts:p }); }))
              .concat([N(L.reduce(function(a, e){ return a + e.survey; }, 0)), N(Math.round(L.reduce(function(a, e){ return a + e.pSurvey; }, 0))), '', ''])),
          '<p class="hint" style="margin:8px 0 0">' + esc(t('«نقطة / يوم» = نقاطُ المسح ÷ الأيامِ التي عمل فيها. و«متوسط اليوم» في الترتيب العام يشمل كلَّ الأعمال لا المسحَ وحدَه.')) + '</p>');
      })()
    + card('توزيع النقاط على المراحل',
        table(['المرحلة','أفراد','أعمال','النقاط','٪'],
          Object.keys(STAGE_ROLES).map(function(k){
            var R = STAGE_ROLES[k], L = stageList(k);
            var p = L.reduce(function(a,e){ return a + e.total; }, 0);
            return [R.i + ' ' + esc(t(R.n)), N(L.length),
                    N(L.reduce(function(a,e){ return a + e.acts; }, 0)),
                    N(Math.round(p)),
                    sum ? nm(Math.round(p / sum * 100)) + '٪' : '٠٪'];
          })));
}

/* ═══ يوميات المشروع (V18.7) ═══
   سأل صاحبُ المشروع: أين الشاشةُ التي تقول ماذا حدث كلَّ يومٍ من أوّل يوم؟ لم تكن.
   هذه تجمع من السجلات نفسِها (الزياراتُ والتركيباتُ والفكُّ والمواقعُ الجديدةُ
   والاعتماداتُ) يومًا يومًا من أوّل يومِ عملٍ إلى اليوم — بلا فجوة: يومُ الصفر
   يُرى صفرًا — ومعه من عمل وكم، والتراكميُّ، وأعلى يوم. لا مصدرَ جديدًا ولا كتابة. */
function diaryRows(keep){
  var D = {}, ok = typeof keep === 'function' ? keep : null;   /* (V24.0) مرشِّحٌ اختياريٌّ على وقت كلِّ سجلٍّ لملخص العمل اليومي — وبلا مرشِّحٍ لا يتغيّر شيء */
  var blank = function(){ return { sv:0, ins:0, dis:0, nw:0, apr:0, min:0, who:{}, zones:{}, stuck:0, span:{} }; };
  var dayOf = function(t){ var n = +t; return n > 0 && (!ok || ok(n)) ? dayKey(n) : ''; };
  var add = function(day, k, who){ if (!day) return; var o = D[day] = D[day] || blank(); o[k]++; if (who){ o.who[who] = (o.who[who] || 0) + 1; } };
  var span = function(day, who, at){ if (!day || !who || !(+at)) return; var o = D[day]; var p = o.span[who] = o.span[who] || { a:+at, b:+at }; if (+at < p.a) p.a = +at; if (+at > p.b) p.b = +at; };
  Object.keys(STATE.recs || {}).forEach(function(id){ var r = STATE.recs[id]; if (!r) return; var dy = dayOf(r.at); add(dy, 'sv', r.by);
    if (dy){ var x = siteFind(id); var z = (x && x.zone) || '\u2014'; D[dy].zones[z] = (D[dy].zones[z] || 0) + 1; if (r.access && r.access !== 'تم الوصول') D[dy].stuck++; span(dy, r.by, r.at); }
    if (r.reviewAt) add(dayOf(r.reviewAt), 'apr'); if (r.minAt) add(dayOf(r.minAt), 'min'); });
  Object.keys(STATE.inss || {}).forEach(function(id){ var r = STATE.inss[id]; if (r && r.status === 'مُركّب'){ var dy = dayOf(r.at); add(dy, 'ins', r.by); span(dy, r.by, r.at); } });
  Object.keys(STATE.diss || {}).forEach(function(id){ var r = STATE.diss[id]; if (r && r.status === 'تم الفك') add(dayOf(r.at), 'dis', r.by); });
  Object.keys(STATE.newsites || {}).forEach(function(id){ var r = STATE.newsites[id]; if (r) add(dayOf(r.at), 'nw', r.by); });
  var days = Object.keys(D).sort(); if (!days.length) return [];
  var out = [], cum = 0, cumIns = 0, last = dayKey();
  for (var t = Date.parse(days[0] + 'T00:00:00Z'); ; t += 864e5){
    var k = dayKey(t), o = D[k] || blank();
    cum += o.sv; cumIns += o.ins;
    var names = Object.keys(o.who).sort(function(a, b){ return o.who[b] - o.who[a]; });
    /* ساعاتُ العمل: من أوّل سجلٍّ إلى آخره لكلِّ شخصٍ في اليوم — تقديرٌ من الأثر لا من ساعة حضور */
    var hrs = Object.keys(o.span).map(function(n){ return (o.span[n].b - o.span[n].a) / 36e5; }).filter(function(h){ return h > 0; });
    var hAvg = hrs.length ? Math.round(hrs.reduce(function(a, b){ return a + b; }, 0) / hrs.length * 10) / 10 : 0;
    var zs = Object.keys(o.zones).sort(function(a, b){ return o.zones[b] - o.zones[a]; }).map(function(z){ return { z:z, n:o.zones[z] }; });
    out.push({ day:k, sv:o.sv, ins:o.ins, dis:o.dis, nw:o.nw, apr:o.apr, min:o.min, people:names.length, top:names.slice(0, 3).map(function(n){ return dispName(n) + ' ' + nm(o.who[n]); }), cum:cum, cumIns:cumIns, acts:o.sv + o.ins + o.dis + o.nw,
               zones:zs, stuck:o.stuck, hAvg:hAvg, hSum:Math.round(hrs.reduce(function(a, b){ return a + b; }, 0) * 10) / 10 });
    if (k >= last || out.length > 400) break;
  }
  return out;
}
function diaryBody(){
  var R = diaryRows();
  if (!R.length) return card('', alertBox('info', 'لا أعمالَ مسجّلةً بعد — تبدأ اليومياتُ من أوّل زيارة.'));
  var work = R.filter(function(r){ return r.acts > 0; }), best = R.slice().sort(function(a, b){ return b.sv - a.sv; })[0];
  var avg = work.length ? Math.round(R.reduce(function(a, r){ return a + r.sv; }, 0) / work.length) : 0, maxSv = Math.max.apply(null, R.map(function(r){ return r.sv; })) || 1;
  var WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var office = effRole(ROLE) !== 'viewer';
  var rows = R.slice().reverse().map(function(r){
    var idle = r.acts === 0, wd = WD[new Date(Date.parse(r.day + 'T00:00:00Z')).getUTCDay()];
    var bar = '<div class="bar" style="min-width:60px" title="' + nm(r.sv) + '"><i style="width:' + Math.round(r.sv / maxSv * 100) + '%"></i></div>';
    return [(idle ? '<span class="hint" style="margin:0">' : '<b>') + '<span class="num">' + esc(fmtDate(Date.parse(r.day + 'T12:00:00Z'))) + '</span> ' + esc(t(wd)) + (idle ? '</span>' : '</b>'),
            idle ? '\u2014' : N(r.sv) + ' ' + bar,
            idle || !r.zones.length ? '' : '<span class="hint" style="margin:0">' + r.zones.map(function(o){ return esc(t(o.z)) + ' ' + nm(o.n); }).join(' \u00b7 ') + '</span>',
            idle ? '' : (r.stuck ? '<span class="req">' + nm(r.stuck) + '</span>' : N(0)),
            idle ? '' : N(r.ins), idle ? '' : N(r.dis), idle ? '' : N(r.nw), idle ? '' : N(r.apr + r.min),
            idle ? '' : N(r.people) + (office && r.top.length ? ' <span class="hint" style="margin:0">' + r.top.map(function(x){ return esc(x); }).join(' \u00b7 ') + '</span>' : ''),
            idle ? '' : (r.hAvg ? '<span class="num">' + nm(r.hAvg) + '</span>' : '\u2014'),
            '<span class="num">' + nm(r.cum) + '</span>'];
  });
  return stats([['أيامٌ منذ البداية', N(R.length)], ['أيامُ عمل', N(work.length), work.length ? 'ok' : ''],
                ['متوسط الزيارات في يوم عمل', N(avg)], ['أعلى يوم', best && best.sv ? nm(best.sv) + ' \u2014 ' + fmtDate(Date.parse(best.day + 'T12:00:00Z')) : '\u2014']])
    + cardFlush(t('يوميات المشروع') + ' \u2014 ' + t('الأحدثُ أوّلًا'),
        table(['اليوم', 'زيارات', 'المشاعر', 'متعذّر', 'تركيب', 'فك', 'مواقع جديدة', 'اعتمادات', 'من عملوا', 'ساعات الفرد', 'تراكمي المسح'], rows),
        '<div class="actions">' + btn('\u2B07 ' + t('إكسل — اليوميات'), 'btn-secondary btn-sm', ' data-xls="diary"') + '</div>')
    + '<p class="hint">' + esc(t('يومٌ بلا عملٍ يُرى صفرًا لا يُخفى. الزياراتُ بيوم تسجيلها، والاعتماداتُ (تقنيةٌ ووزارية) بيوم قرارها، والتراكميُّ زياراتٌ منذ أوّل يوم.')) + ' ' + esc(t('«ساعات الفرد»: من أوّل سجلٍّ إلى آخره في اليوم لكلِّ شخص (متوسطًا) — تقديرٌ من الأثر لا من ساعة حضور.')) + '</p>';
}
/* ═══ محاكي الأوزان والتارجت (V18.8) ═══
   قبل أن يُغيَّر وزنُ النقطة أو التارجت يُرى أثرُه على الأعمال المسجَّلة فعلًا:
   لكلِّ عضوٍ عددُ ما مسح من كلِّ نوع × الوزنِ المقترح = نقاطُه، ونقاطُه في يوم
   العمل، وإسقاطُها على الشهر، ونسبتُها من التارجت المقترح — فيُعرَف قبل الضبط
   هل يعدّيه أحد. الأرقامُ في الذاكرة حتى يُضغَط «اعتمد». */
var SIM = null;
function simState(){
  if (SIM) return SIM;
  var raw = null; try { raw = JSON.parse(lsGet('nsk14.sim') || 'null'); } catch (e){ LS_ERR = e; }
  SIM = raw && raw.w ? raw : { w:{}, target:5000, days:26 };
  return SIM;
}
function simSave(){ try { lsSet('nsk14.sim', JSON.stringify(SIM)); } catch (e){ LS_ERR = e; } }
function simTypes(){
  var S = scores(), types = {};
  S.list.forEach(function(e){ Object.keys(e.surveyT || {}).forEach(function(k){ types[k] = (types[k] || 0) + e.surveyT[k].n; }); });
  return Object.keys(types).sort(function(a, b){ return types[b] - types[a]; });
}
function simW(k){ var v = simState().w[k]; return v == null ? 1 : +v; }
function simRows(){
  var S = scores(), M = simState();
  return S.list.filter(function(e){ return e.survey > 0; }).map(function(e){
    var pts = 0; Object.keys(e.surveyT || {}).forEach(function(k){ pts += e.surveyT[k].n * simW(k); });
    var perDay = e.nDays ? pts / e.nDays : 0, month = perDay * (+M.days || 26);
    return { name:e.name, pts:Math.round(pts * 10) / 10, days:e.nDays, perDay:Math.round(perDay * 10) / 10, month:Math.round(month), pct:M.target ? Math.round(month / M.target * 100) : 0, over: M.target ? month > M.target : false, dayMax: M.target && M.days ? Math.round(M.target / 30) : 0 };
  });
}
function simCard(){
  if (!(may('users') || may('settings'))) return '';
  var M = simState(), types = simTypes(); if (!types.length) return '';
  var rows = simRows(), cap = M.target ? Math.round(M.target / 30) : 0;
  return card('محاكي الأوزان والتارجت — قبل الضبط',
    '<p class="hint" style="margin-top:0">' + esc(t('غيّر الوزنَ لكلِّ نوعٍ والتارجتَ الشهريَّ وانظر أثرَهما على ما سُجّل فعلًا — لا يُغيَّر شيءٌ حتى تضغط «اعتمد».')) + '</p>'
    + '<div class="grid2" style="margin-bottom:8px">'
    + types.map(function(k){ return '<div class="field"><label>' + esc(t('وزن')) + ' ' + esc(t(k)) + '</label><input type="number" inputmode="decimal" step="0.5" min="0" value="' + simW(k) + '" data-simw="' + esc(k) + '"></div>'; }).join('')
    + '<div class="field"><label>' + esc(t('التارجت الشهري (نقطة)')) + '</label><input type="number" inputmode="numeric" min="0" value="' + (+M.target || 0) + '" data-simt="target"></div>'
    + '<div class="field"><label>' + esc(t('أيام العمل في الشهر')) + '</label><input type="number" inputmode="numeric" min="1" max="31" value="' + (+M.days || 26) + '" data-simt="days"></div></div>'
    + (cap ? '<p class="hint" style="margin:0 0 8px">' + esc(t('سقفُ اليوم عند هذا التارجت')) + ': <b class="num">' + nm(cap) + '</b> ' + esc(t('نقطة (التارجت ÷ ٣٠)')) + '</p>' : '')
    + table(['الاسم', 'نقاط بالأوزان المقترحة', 'أيام', 'نقطة / يوم', 'إسقاطُ الشهر', 'من التارجت', 'يعدّيه؟'],
        rows.map(function(r){ return ['<strong>' + esc(dispName(r.name)) + '</strong>', N(r.pts), N(r.days), N(r.perDay), N(r.month), r.pct ? pill(nm(r.pct) + '٪', r.over ? 'bad' : r.pct >= 80 ? 'wrn' : 'ok') : '\u2014', r.over ? '<span class="req">' + esc(t('نعم')) + '</span>' : esc(t('لا'))]; }))
    + '<div class="actions" style="margin-top:8px">' + btn('\u2713 ' + t('اعتمد الأوزانَ والتارجت'), 'btn-primary btn-sm', ' data-simapply="1"')
    + btn(t('ألغِ الإضافي الآن (المعامل = ١)'), 'btn-secondary btn-sm', ' data-simot="1"') + '</div>'
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('«اعتمد» يكتب الوزنَ لكلِّ مشعرٍ في مصفوفة الأوزان وتارجتَ المسح الشهري في ثوابت النظام — ويُعاد حسابُ المستحقّ لكلِّ ما سُجّل. «ألغِ الإضافي» يجعل ما فوق سقف اليوم يُحتسب بالسعر نفسه.')) + '</p>');
}
/* ═══ كيف يُحسب المستحقّ (V19.0) ═══
   سأل صاحبُ المشروع أمام الرقم: «الفلوس دي بتاعت إيه؟». الشاشةُ تجيب الآن بنفسها:
   المعادلةُ بقيمها الحالية، وأوزانُ ما سُجّل فعلًا، ومثالٌ محسوبٌ على أعلى عضو —
   وأين يُضبَط كلُّ رقم. لا حسابَ ثانٍ: القيمُ نفسُها التي تحسب بها scores(). */
function moneyHowCard(S){
  if (!(may('users') || may('money') || may('settings'))) return '';
  var ph = cfgGet('ph'), ot = cfgGet('otRate') || 1.5, tg = cfgGet('tgtSurvey'), days = cfgGet('days') || 30;
  var otOn = ot > 1 && tg > 0;
  /* مفاتيحُ الإحصاء «مشعر|نوعٌ خام»، ومفاتيحُ الأوزان «مشعر|تصنيفٌ عربيٌّ خام» */
  var K = siteKeyStats();
  var rows = K.keys.filter(function(k){ return K.by[k]; }).slice(0, 14).map(function(k){
    var z = k.split('|')[0], ty = k.split('|')[1], lab = (CAT_DEF[ty] && CAT_DEF[ty].l) || ty;
    var wv = cfgGet('w', z + '|' + lab) || cfgGet('w', lab);
    return [esc(t(z)), esc(t(lab)), wv ? N(wv) : '<span class="req">' + esc(t('بلا وزن')) + '</span>', N(K.sv && K.sv[k] || 0)];
  });
  var top = S.list[0];
  var ex = top ? '<p style="margin:8px 0 0">' + esc(t('مثال')) + ': <b>' + esc(dispName(top.name)) + '</b> \u2014 ' + nm(top.total) + ' ' + esc(t('نقطة')) + ' \u00d7 ' + nm(ph) + ' = <b>' + nm(Math.round(top.total * ph)) + '</b> ' + esc(t('ريال'))
    + (otOn && top.over ? ' <span class="hint" style="margin:0">(' + esc(t('منها إضافيٌّ')) + ' ' + nm(top.over) + ' \u00d7 ' + nm(ot) + ')</span>' : '') + '</p>' : '';
  return card('كيف يُحسب المستحقّ',
    '<p style="margin-top:0"><b>' + esc(t('المستحقّ = نقاطُ الأعمال المعتمدة × سعرُ النقطة')) + '</b>'
    + (otOn ? ' \u2014 ' + esc(t('وما زاد في يومٍ عن سقف اليوم')) + ' (' + nm(tg) + ' \u00f7 ' + nm(days) + ' = ' + nm(Math.round(tg / days)) + ') ' + esc(t('يُضرَب في')) + ' ' + nm(ot) : ' \u2014 ' + esc(t('بلا إضافي')))
    + '</p>'
    + stats([['سعرُ النقطة', nm(ph) + ' ' + t('ريال'), ph ? '' : 'wrn'], ['التارجتُ الشهريُّ للمسح', N(tg), tg ? '' : 'wrn'], ['معاملُ الإضافي', otOn ? nm(ot) : t('لا إضافي')]])
    + (rows.length ? table(['المشعر', 'النوع', 'وزنُ الزيارة', 'زياراتٌ مسجّلة'], rows) : '')
    + ex
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('النقاطُ من الأعمال المعتمدة وحدَها (المسحُ المعتمَدُ تقنيًّا، والتركيبُ المعتمَد، والفكّ، والورشة) — ويُعاد الحسابُ فورًا متى تغيّر وزنٌ أو سعر.')) + '</p>'
    + '<div class="actions">' + btn(t('اضبط الأوزان'), 'btn-quiet btn-sm', ' data-goto="pts"') + btn(t('اضبط السعر والتارجت'), 'btn-quiet btn-sm', ' data-goto="consts"') + '</div>');
}

/* (V38.60) the field chat page — the office and the installers in one thread per point, or person to person */
PAGE.chat = { m:'الميدان', t:'المحادثات',
  l:'المهندسُ في المكتب والمنفِّذُ في الموقع يتكلّمان هنا — على نقطةٍ بعينها أو مباشرةً، وكلُّ سطرٍ يبقى.',
  body:function(){ var head = tabHead('chat'), cur = tabCur('chat'); return head + (cur === 'chathist' ? chHistHtml() : chPageHtml()); } };   /* (V38.67) two tabs */
