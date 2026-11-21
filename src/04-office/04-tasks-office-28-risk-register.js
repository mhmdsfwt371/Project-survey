/* ============================================================================
   FILE    : src/04-office/04-tasks-office-28-risk-register.js
   DOMAIN  : Office — «التخطيط والمخاطر» › «سجل المخاطر»
   PURPOSE : The register screen as the internal register reads (owner's request V47.16): the risk with its present
             situation under it, probability and impact, level and the management method it calls for, the action, owner,
             due date in Hijri and Gregorian, days left (red once passed while not closed), and status — with the Excel
             import (held for a two-step confirmation) beside the export, and the add form with the register's fields.
   DEFINES : rkBody, rkDueShow
   GLOBALS : —
   NOTE    : Internal to AFAQY — the page «plan» is not the Ministry's, and no Ministry page draws from the register.
   ============================================================================ */

/* the due date for the screen: Hijri above Gregorian, in the screen's numerals */
function rkDueShow(iso){
  if (!iso) return '—';
  var ar = (typeof LANG !== 'string') || LANG !== 'en', h = riskHijri(iso), p = String(iso).split('-');
  return (h ? '<span class="num">' + esc(riskDig(h)) + (ar ? 'هـ' : ' AH') + '</span><br>' : '')
    + '<span class="hint num" style="margin:0">' + esc(riskDig(p[2] + '/' + p[1] + '/' + p[0])) + (ar ? 'م' : '') + '</span>';
}

function rkBody(){
  var RL = risksList(), ed = may('settings');
  var RANK = { 'وقع فعلًا':0, 'حرج':1, 'مرتفع':2, 'متوسط':3, 'منخفض':4, 'مغلق':5 };
  var count = function(L, f){ return L.filter(f).length; };
  var live = RL.filter(function(r){ return riskSt(r) === 'قائم'; });
  var crit = count(live, function(r){ return riskLv(r).t === 'حرج'; }), high = count(live, function(r){ return riskLv(r).t === 'مرتفع'; });
  var occ = count(RL, function(r){ return riskSt(r) === 'وقع فعلًا'; }), shut = count(RL, function(r){ return riskSt(r) === 'مغلق'; });
  var over = count(RL, function(r){ var d = riskDays(r); return d != null && d < 0; });
  /* the gravest first; within a level, the register's own order (خ-٠١ before خ-٠٢) */
  var sorted = RL.map(function(r, k){ return { r:r, k:k }; })
    .sort(function(a, b){ return (RANK[riskLv(a.r).t] - RANK[riskLv(b.r).t]) || (a.k - b.k); })
    .map(function(o){ return o.r; });
  var sig = riskSignals();

  /* a register read from Excel waits here for the engineer's word — it replaces the register whole. The file is named
     without its extension: «… رقم 6.xlsx» inside Arabic text is reordered by the browser into «… رقم xlsx.6». */
  var P = PV.RISK_IMP, imp = '';
  if (ed && P && P.list && P.list.length){
    var byLv = {}; P.list.forEach(function(r){ var k = riskLv(r).t; byLv[k] = (byLv[k] || 0) + 1; });
    imp = card('', '<div class="alert warn" id="rkImpWait"><span>' + esc(t('سيُستبدل السجل كله بما في الملف')) + ' «' + esc(String(P.name).replace(/\.xlsx?$/i, '')) + '» \u2014 '
        + esc(t('المخاطر في الملف')) + ': ' + nm(P.list.length) + ' ('
        + Object.keys(RANK).filter(function(k){ return byLv[k]; }).map(function(k){ return esc(t(k)) + ' ' + nm(byLv[k]); }).join(' · ')
        + ')، ' + esc(t('وفي السجل الحالي')) + ': ' + nm(RL.length) + '.</span></div>'
      + '<div class="actions" style="margin:10px 0 0">' + btn('\u{1F5D1} ' + t('تأكيد الاستيراد — يُستبدل السجلُّ كلُّه'), 'btn-danger btn-sm', ' data-rkimpok="1"')
      + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-rkimpx="1"') + '</div>');
  }

  var stOpt = function(cur, attr){ return '<select ' + attr + '>' + PV.RISK_ST.map(function(s){ return '<option value="' + esc(s) + '"' + (cur === s ? ' selected' : '') + '>' + esc(t(s)) + '</option>'; }).join('') + '</select>'; };
  var rows = sorted.map(function(r){
    var L = riskLv(r), st = riskSt(r), d = riskDays(r);
    return ['<span class="num">' + esc(r.id) + '</span>',
      '<strong>' + esc(r.t || '') + '</strong>' + (r.ctx ? '<div class="hint" style="margin:3px 0 0;font-size:12px;font-weight:400;white-space:pre-line">' + esc(r.ctx) + '</div>' : ''),
      ed ? '<input type="number" min="1" max="5" value="' + esc(String(+r.p || 1)) + '" data-rkp="' + esc(r.id) + '" style="width:58px">' : N(+r.p || 0),
      ed ? '<input type="number" min="1" max="5" value="' + esc(String(+r.i || 1)) + '" data-rki="' + esc(r.id) + '" style="width:58px">' : N(+r.i || 0),
      '<span class="pill ' + L.c + '">' + esc(t(L.t)) + '</span>' + (st === 'قائم' ? ' <span class="hint num" style="margin:0">' + nm(riskScore(r)) + '</span>' : ''),
      '<span>' + esc(t(riskMethod(L.t))) + '</span>',
      r.plan ? '<span style="white-space:pre-line">' + esc(r.plan) + '</span>' : '—',
      ed ? '<input value="' + esc(r.own || '') + '" data-rko="' + esc(r.id) + '" dir="auto" style="width:110px">' : (r.own ? '<span>' + esc(r.own) + '</span>' : '—'),
      rkDueShow(r.due),
      d == null ? '—' : pill(nm(d), d < 0 ? 'off' : (d <= 7 ? 'warn' : '')),
      ed ? stOpt(st, 'data-rkst="' + esc(r.id) + '"') + ' ' + btn('\u{1F5D1}', 'btn-quiet btn-sm', ' data-rkdel="' + esc(r.id) + '" aria-label="' + esc(t('حذف')) + '"')
         : pill(st, st === 'مغلق' ? 'ok' : (st === 'وقع فعلًا' ? 'off' : 'warn'))];
  });
  var tools = btn('⬇ ' + t('إكسل — سجل المخاطر'), 'btn-secondary btn-sm', ' data-xls="risks"')
    + (ed ? ' <label class="btn btn-secondary btn-sm" style="cursor:pointer">⬆ ' + esc(t('استيراد من إكسل'))
          + '<input type="file" accept=".xlsx,.xls" data-rkfile="1" style="display:none"></label>' : '');

  var opt0 = function(list){ return '<option value="">—</option>' + list.map(function(c){ return '<option value="' + esc(c) + '">' + esc(t(c)) + '</option>'; }).join(''); };
  var fld = function(lbl, inner, wide){ return '<div class="field"' + (wide ? ' style="grid-column:1/-1"' : '') + '><label>' + lbl + '</label>' + inner + '</div>'; };
  var form = ed ? card('إضافة خطر',
      '<div class="grid cols-3">'
      + fld(esc(t('الخطر')) + ' <span class="req">*</span>', '<input id="rkT" dir="auto">', true)
      + fld(esc(t('الوضع الآن')), '<input id="rkX" dir="auto">', true)
      + fld(esc(t('الاحتمال')) + ' (' + nm(1) + '–' + nm(5) + ')', '<input type="number" id="rkP" min="1" max="5" value="3">')
      + fld(esc(t('الأثر')) + ' (' + nm(1) + '–' + nm(5) + ')', '<input type="number" id="rkI" min="1" max="5" value="3">')
      + fld(esc(t('الحالة')), stOpt('قائم', 'id="rkS"'))
      + fld(esc(t('الإجراء')), '<input id="rkPl" dir="auto">', true)
      + fld(esc(t('المسؤول')), '<input id="rkO" dir="auto">')
      + fld(esc(t('الموعد')), '<input type="date" id="rkD">')
      + fld(esc(t('المرجع')), '<input id="rkRf" dir="auto">')
      + fld(esc(t('الفئة')), '<select id="rkC">' + opt0(['ميداني', 'فني', 'مشتريات', 'موارد', 'مالي', 'جهات خارجية', 'سلامة']) + '</select>')
      + fld(esc(t('الاستجابة')), '<select id="rkR">' + opt0(['تخفيف', 'تجنّب', 'نقل', 'قبول']) + '</select>')
      + '</div>',
      btn('➕ ' + t('سجِّل الخطر'), 'btn-primary btn-sm', ' data-rkadd="1"')) : '';

  /* the matrix: each cell in its level's colour, with the live risks that sit in it */
  var mrows = [];
  for (var p = 5; p >= 1; p--){
    var cells = ['<b>' + nm(p) + '</b>'];
    for (var i = 1; i <= 5; i++){
      var here = live.filter(function(r){ return +r.p === p && +r.i === i; });
      cells.push('<span class="pill ' + riskLevel(p * i).c + '">' + nm(p * i) + (here.length ? ' · ' + here.map(function(r){ return esc(r.id); }).join(' ') : '') + '</span>');
    }
    mrows.push(cells);
  }
  /* one row per management method, with the levels that call for it (medium and low share the two-weekly follow-up) */
  var methods = [['وقع فعلًا'], ['حرج'], ['مرتفع'], ['متوسط', 'منخفض'], ['مغلق']];
  var anyResp = RL.some(function(r){ return r.resp; });

  return imp
    + stats([['قائمة', N(live.length), live.length ? 'wrn' : 'ok'],
             ['حرجة', N(crit), crit ? 'bad' : 'ok'],
             ['مرتفعة', N(high), high ? 'wrn' : ''],
             ['وقعت فعلًا', N(occ), occ ? 'bad' : 'ok'],
             ['تجاوزت موعدها', N(over), over ? 'bad' : 'ok'],
             ['مغلقة', N(shut), 'ok']])

    /* ما تقوله الأرقامُ الآن — لا ما كُتب في اجتماع */
    + card('\u{1F6A8} ' + t('مؤشرات خطرٍ حيّة — من البيانات نفسِها'),
        '<div class="list">' + sig.map(function(x){
          return '<div class="list-item"><div class="li-main"><div class="li-t">'
            + pill(x[0] === 'ok' ? 'سليم' : (x[0] === 'bad' ? 'حرج' : 'انتبه'), x[0] === 'ok' ? 'ok' : (x[0] === 'bad' ? 'off' : 'warn'))
            + ' ' + esc(x[1]) + '</div></div>'
            + (x[2] && seesPage(PARENT[x[2]] || x[2]) ? '<div class="li-end">' + btn('\u{1F4CD}', 'btn-quiet btn-sm', ' data-p="' + esc(x[2]) + '"') + '</div>' : '')
            + '</div>';
        }).join('') + '</div>'
        + '<p class="hint" style="margin:8px 0 0">' + esc(t('تُحسَب كلَّ رسمةٍ من الجدول والكلفة والزيارات والبلاغات والمهام — الخطرُ يُرى قبل أن يُكتَب.')) + '</p>')

    + cardFlush(t('السجل') + ' — ' + nm(RL.length),
        table(['الرقم', 'الخطر', 'الاحتمال', 'الأثر', 'المستوى', 'طريقة الإدارة', 'الإجراء', 'المسؤول', 'الموعد', 'الأيام المتبقية', 'الحالة'], rows), tools)
    + form

    + card('مصفوفة الاحتمال والأثر',
        table(['احتمال ↓ / أثر →', '١', '٢', '٣', '٤', '٥'], mrows)
        + '<p class="hint">' + esc(t('الدرجة حاصل ضرب الاحتمال في الأثر: من عشرين فأعلى حرج يحتاج قرارا من الإدارة خلال أسبوع، ومن اثني عشر مرتفع بمسؤول وموعد ومتابعة أسبوعية، ومن ستة متوسط يتابع كل أسبوعين. وما وقع فعلا مشكلة قائمة تدار بالتصعيد.')) + '</p>')

    + card('طريقة الإدارة',
        table(['طريقة الإدارة', 'المستوى', 'عددها'], methods.map(function(g){
          return ['<span>' + esc(t(riskMethod(g[0]))) + '</span>', '<span>' + g.map(function(k){ return esc(t(k)); }).join(' · ') + '</span>',
                  N(count(RL, function(r){ return g.indexOf(riskLv(r).t) > -1; }))];
        })))

    + (anyResp ? card('توزيع الاستجابات',
        table(['الاستجابة', 'عددها', 'ما تعنيه'], [
          ['تجنّب', N(count(RL, function(r){ return r.resp === 'تجنّب'; })), 'يُغيَّر الخطُّ فلا يقع'],
          ['تخفيف', N(count(RL, function(r){ return r.resp === 'تخفيف'; })), 'يُقلَّل احتمالُه أو أثرُه'],
          ['نقل',   N(count(RL, function(r){ return r.resp === 'نقل'; })),   'يُحمَّل طرفًا آخر'],
          ['قبول',  N(count(RL, function(r){ return r.resp === 'قبول'; })),  'يُحتمَل ويُرصَد له احتياطي']
        ])) : '');
}
