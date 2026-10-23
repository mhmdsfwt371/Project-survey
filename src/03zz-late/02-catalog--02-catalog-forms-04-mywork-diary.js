/* ============================================================================
   FILE    : src/03zz-late/02-catalog--02-catalog-forms-04-mywork-diary.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/02-catalog/02-catalog-forms-04-mywork-diary.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : diaryBody
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
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
