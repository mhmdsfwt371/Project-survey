/* ============================================================================
   FILE    : src/04-office/04-tasks-office-07-incidents-milestones.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : Incidents (correct/delete) and milestones managed, not just read.
   DEFINES : (no top-level functions)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
PAGE.ipc = { m:'القسم المالي', t:'الشؤون المالية',
  l:'المستخلصاتُ ودفترُ المشتريات والميزانيةُ واعتمادُها.',
  body:function(){
    var head = tabHead('ipc'), cur = tabCur('ipc');
    if (cur === 'budget') return head + (function(){
    var B = { cap:cfgGet('budCap'), appAbove:cfgGet('budApp'), spent:buysSpent(), pending:0 };
    return '<p class="lede" style="margin:0 0 16px">' + esc(t('الميزانية سقفٌ يُقاس عليه المنصرف، وحدُّ الاعتماد مبلغٌ فوقه يلزم اعتماد المهندس قبل أن تدخل العملية المنصرفَ المعتمد. صفرٌ في أيٍّ منهما يعني بلا سقفٍ وبلا اعتماد.')) + '</p>'
      + (may('settings') ? card('الضبط',
          '<div class="grid cols-2">'
          + '<div class="field"><label>' + esc(t('الميزانية المعتمدة')) + ' (' + t('ريال') + ')</label>'
          +   cfgInput('budCap') + '</div>'
          + '<div class="field"><label>' + esc(t('حدّ الاعتماد للعملية الواحدة')) + ' (' + t('ريال') + ')</label>'
          +   cfgInput('budApp') + '</div>'
          + '</div>', btn('حفظ','btn-primary btn-sm',' data-cfgok="1"')) : '')
      + stats([['المنصرف المعتمد', N(B.spent)], ['من', N(B.cap), 'acc'],
               ['المتبقي', N(B.cap - B.spent), 'ok'], ['بانتظار الاعتماد', N(B.pending)]])
      + card('', meter('المستهلك من السقف المعتمد', B.spent, B.cap))
      + (trialsTotal()
          ? '<p class="hint" style="margin:6px 0 0">\u{1F9EA} ' + esc(t('مصروفُ التجارب')) + ': <b class="num">' + nm(trialsTotal()) + '</b> '
            + esc(t('ريال')) + ' \u00b7 ' + esc(t(trialInCost() ? 'داخلٌ في المنصرف أعلاه' : 'خارجٌ عن المنصرف أعلاه — يُغيَّر من تبويب «التجارب»')) + '</p>'
          : '')
      + '<p class="hint">' + esc(t('تغييرُ السقف لا يمسّ عمليةً مسجّلة — الوزن يُثبَّت لحظةَ الحدث.')) + '</p>';
  })();
    if (cur === 'buys') return head + (function(){
    var L = buysList();
    var spent = L.filter(function(b){ return b.st === 'معتمد'; })
                 .reduce(function(a,b){ return a + (+b.amt || 0); }, 0);
    var pend  = L.filter(function(b){ return b.st !== 'معتمد'; })
                 .reduce(function(a,b){ return a + (+b.amt || 0); }, 0);
    var cap = cfgGet('budCap') || 0;
    return stats([['إجمالي المنصرف', N(spent)],
                  ['الميزانية', N(cap), 'acc'],
                  ['المتبقي', N(cap - spent), (cap - spent) < 0 ? 'bad' : 'ok'],
                  ['بانتظار الاعتماد', N(pend), pend ? 'wrn' : '']])
      + card('المنصرف من الميزانية', meter('المستهلك من السقف المعتمد', spent, cap))
      + (may('money')
        ? card('تسجيل عملية شراء',
            '<div class="grid cols-3">'
            + '<div class="field"><label>' + esc(t('الصنف')) + '</label><input id="byItem" dir="auto"></div>'
            + '<div class="field"><label>' + esc(t('الفئة')) + '</label><select id="byCat">'
            +   catList().map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field"><label>' + esc(t('المورّد')) + '</label><select id="bySup">'
            +   supList().map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('')
            + '</select></div>'
            + '<div class="field"><label>' + esc(t('المبلغ')) + '</label>'
            +   '<input id="byAmt" type="number" min="1" step="1"></div>'
            + '<div class="field"><label>' + esc(t('المشعر')) + '</label><select id="byZone">'
            +   ['منى','عرفات','مزدلفة','—'].map(function(z){ return '<option value="' + esc(z) + '">' + esc(t(z)) + '</option>'; }).join('')
            + '</select></div>'
            /* لأيِّ تجربةٍ هذا الشراء — فيُعرَف مصروفُ كلِّ تجربةٍ على حدة */
            + (trialRows().length
                ? '<div class="field"><label>' + esc(t('لتجربة')) + '</label><select id="byTrial">'
                  + '<option value="">' + esc(t('— ليس لتجربة —')) + '</option>'
                  + trialRows().map(function(r){ return '<option value="' + esc(r.id) + '">' + esc(r.n) + '</option>'; }).join('')
                  + '</select></div>'
                : '')
            + '<div class="field"><label>' + esc(t('صورة الفاتورة')) + '</label>'   /* (V37.43) طلبُ المالك: رفعُ صورة الفاتورة — من الكاميرا أو المعرض */
            +   '<label class="btn btn-secondary" style="width:100%;justify-content:center;cursor:pointer">\u{1F9FE} ' + esc(t('صوّر الفاتورة أو اختر صورتها')) + '<input type="file" accept="image/*" data-buyphoto="1" style="display:none"></label>'
            +   '<div id="byPhPrev" class="hint" style="margin:4px 0 0">' + buyPhPrevHtml() + '</div></div>'
            + '</div>'
            + '<div class="actions">' + btn(BUY_ED ? '\u2714 ' + t('احفظ التعديل') : t('سجّل الشراء'),'btn-primary',' data-byadd="1"') + (BUY_ED ? btn(t('إلغاء التعديل'),'btn-quiet',' data-byedcancel="1"') : '') + '</div>'
            + '<p class="hint">' + esc(t('ما تجاوز حدَّ الاعتماد يُسجَّل «بانتظار الاعتماد» ولا يدخل المنصرف.')) + '</p>')
        : '')
      + cardFlush(t('العمليات') + ' — ' + nm(L.length),
          L.length
            ? table(['التاريخ','الصنف','الفئة','المشعر','المبلغ','المورّد','الحالة','الفاتورة',''],
                capList(L, 200).map(function(b){
                  return ['<span class="num">' + esc(dayKey(b.at)) + '</span>',
                          esc(b.item), esc(b.cat), esc(t(b.zone || '—')), N(b.amt), esc(b.sup),
                          pill(t(b.st), b.st === 'معتمد' ? 'ok' : 'wrn'),
                          buyInvCell(b),   /* (V37.43) */
                          buyMayEdit() ? btn('\u270E','btn-quiet btn-sm',' data-byedit="' + esc(b.id) + '" title="' + esc(t('تعديل')) + '"') + btn('\u2715','btn-quiet btn-sm',' data-bydel="' + esc(b.id) + '" title="' + esc(t('حذف')) + '"') : ''];   /* (V29.5) */
                }))
            : '<p class="hint" style="padding:16px">' + esc(t('لا مشترياتٍ بعد.')) + '</p>',
          may('exportAll') ? btn('⬇ إكسل','btn-secondary btn-sm',' data-xls="buys"') : '');
  })();
    return head + (function(){
    var v = (typeof evm === 'function') ? evm() : null;
    var paid = IPCS.filter(function(x){ return x.st === 'مصروف'; })
                   .reduce(function(a,x){ return a + x.amt; }, 0);
    var pend = IPCS.filter(function(x){ return x.st !== 'مصروف'; })
                   .reduce(function(a,x){ return a + x.amt; }, 0);
    var earned = v ? v.EV : 0;

    return stats([['المكتسَب حتى اليوم', N(earned), 'acc'],
                  ['قُدّم في مستخلصات', N(paid + pend)],
                  ['صُرف', N(paid), 'ok'],
                  ['لم يُصرف بعد', N(pend), pend ? 'wrn' : '']])

      + card('مستخلص جديد',
          '<div class="grid cols-3">'
          + '<div class="field"><label>' + esc(t('الفترة')) + '</label>'
          + '<input id="ipcPer" placeholder="' + esc(t('مثال: الشهر الأول')) + '"></div>'
          + '<div class="field"><label>' + esc(t('المبلغ')) + '</label>'
          + '<input type="number" id="ipcAmt" min="0" value="'
          + Math.max(0, Math.round(earned - paid - pend)) + '"></div>'
          + '<div class="field"><label>' + esc(t('الاستقطاع ٪')) + '</label>'
          + '<input type="number" id="ipcRet" min="0" max="20" value="5"></div>'
          + '</div>'
          + '<p class="hint" style="margin:0">' + esc(t('المبلغُ المقترحُ هو المكتسَبُ ناقصَ ما قُدّم — فلا يُطالَب بما طُولب به.')) + '</p>',
          btn('📄 أنشئ المستخلص','btn-primary',' data-ipcadd="1"'))

      + (IPCS.length
        ? cardFlush('المستخلصات',
            table(['#','الفترة','المبلغ','استقطاع','الصافي','الحالة',''],
              IPCS.map(function(x, i){
                var ret = Math.round(x.amt * x.retPct / 100);
                return ['<span class="num">IPC-' + nm(i+1) + '</span>', esc(x.period),
                        N(x.amt), N(ret), '<b>' + nm(x.amt - ret) + '</b>',
                        pill(x.st, x.st==='مصروف'?'ok':(x.st==='معتمد'?'acc':'warn')),
                        '<div class="actions">'
                        + (x.st === 'مقدَّم' ? btn('اعتمد','btn-quiet btn-sm',' data-ipcok="' + i + '"') : '')
                        + (x.st === 'معتمد' ? btn('صُرف','btn-quiet btn-sm',' data-ipcpay="' + i + '"') : '')
                        + '</div>'];
              }),
              ['','<b>' + t('الإجمالي') + '</b>',
               N(IPCS.reduce(function(a,x){ if (x.st === 'ملغى') return a; return a + x.amt; }, 0)),
               N(IPCS.reduce(function(a,x){ if (x.st === 'ملغى') return a; return a + Math.round(x.amt*x.retPct/100); }, 0)),
               '<b>' + nm(IPCS.reduce(function(a,x){ if (x.st === 'ملغى') return a; return a + x.amt - Math.round(x.amt*x.retPct/100); }, 0)) + '</b>',
               '','']),
            btn('⬇ إكسل — المستخلصات','btn-secondary btn-sm',' data-xls="ipc"'))
        : card('', alertBox('info','لا مستخلصاتٍ بعد — يُبنى المستخلصُ على المكتسَب المعتمَد.')))

      + card('دورة المستخلص',
          flow(['يُبنى من المكتسَب','يُقدَّم','يُعتمَد','يُصرَف'], 0)
          + '<p class="hint">' + esc(t('الاستقطاعُ يُحتجَز حتى انتهاء الضمان ثم يُفرَج عنه.')) + '</p>');
  })();
  }};

