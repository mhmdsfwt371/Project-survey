/* (V38.90) moved by scripts/split-late.mjs from src/03-survey/03-survey-records-10-wbs-plan-trials.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function wbsProjectPct(){ var top = wbsRows().filter(function(r){ return wbsDepth(r.id) === 1; }), pw = 0, pa = 0, w = 0; top.forEach(function(r){ var d = Math.max(1, +r.w || +r.dur || 1); pw += wbsPlanPct(r) * d; pa += wbsPct(r) * d; w += d; }); return { plan:w ? Math.round(pw / w) : 0, act:w ? Math.round(pa / w) : 0, rows:top.length }; }

function wbsPlanCard(){
  var R = wbsRows(); if (!R.length) return '';
  var P = wbsProjectPct(), leaves = R.filter(function(r){ return !wbsChildren(r.id).length && r.s && r.e; });
  var late = leaves.map(function(r){ return { r:r, v:wbsVar(r) }; }).filter(function(o){ return o.v <= -10 && wbsPct(o.r) < 100; }).sort(function(a, b){ return a.v - b.v; }).slice(0, 6);
  var auto = leaves.filter(function(r){ return wbsAutoPct(r) != null; }).length;
  return card('\u{1F4C8} ' + t('الخطة مقابل الفعلي'),   /* (V30.6) */
    '<p class="hint" style="margin:0 0 6px">' + esc(t('المخطّط من التواريخ، والفعليُّ من النظام حيث يُقاس')) + '</p><div class="mfu-kpis">' + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('الإنجاز المخطّط')) + '</div><div class="mfu-kpi-v">' + nm(P.plan) + '٪</div></div>'
    + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('الإنجاز الفعلي')) + '</div><div class="mfu-kpi-v" style="color:' + (P.act >= P.plan ? '#27AE60' : '#C0392B') + '">' + nm(P.act) + '٪</div></div>'
    + '<div class="mfu-kpi"><div class="mfu-kpi-l">' + esc(t('الانحراف')) + '</div><div class="mfu-kpi-v">' + wbsVarPill(P.act - P.plan) + '</div><div class="hint" style="margin:2px 0 0">' + nm(auto) + ' ' + esc(t('بندًا يُقاس تلقائيًّا')) + '</div></div></div>'
    + (late.length ? '<p class="hint" style="margin:8px 0 4px">' + esc(t('أكثرُ البنود تأخّرًا عن مخطّطها')) + '</p>' + table(['البند', 'المخطّط', 'الفعلي', 'الانحراف'], late.map(function(o){ return ['<span class="num hint" style="margin:0">' + esc(o.r.id) + '</span> ' + esc(o.r.n), nm(wbsPlanPct(o.r)) + '٪', nm(wbsPct(o.r)) + '٪', wbsVarPill(o.v)]; })) : '<p class="hint" style="margin:8px 0 0">' + esc(t('لا بندَ متأخرًا عن مخطّطه بأكثر من ١٠٪')) + '</p>'));
}

/* ═══ تصديرُ الخطة كما تُدار: بصيغِها وطيِّها وألوانها ═══
   يُبنى الملفُّ على شكل ملفِّ المتابعة نفسِه: صفُّ المواعيد الحاكمة بصيغِه
   النسبية (يُغيَّر يومُ عرفة فتتحرّك المواعيدُ كلُّها)، وصيغُ المدةِ والحالةِ
   والموقفِ الزمنيِّ والمتبقّي — فالملفُّ يُحدِّث نفسَه بعد التصدير كما كان
   يفعل قبل أن يدخل النظام. والآباءُ يجمعون أبناءهم بـMIN/MAX/AVERAGE على
   صفوفهم الفعلية، ومستوياتُ الطيِّ من عمق المعرِّف. */
function wbsKeyRow(){
  var K = wbsKeys();
  return K.length ? K : [{ n:'يوم عرفة ١٤٤٨هـ', d:'2027-05-15' }];
}

/* ═══ القيمةُ مع الصيغة ═══
   الملفُّ كان يحمل الصيغَ بلا قيمٍ محسوبة: إكسلُ المكتب يحسبها عند الفتح، أما
   معاينةُ الجوّال وجداولُ جوجل والقارئُ المستعجلُ فيرون المدةَ والحالةَ
   والموقفَ خانةً فارغة. صارت كلُّ صيغةٍ تُكتَب ومعها ناتجُها المحسوبُ هنا
   بالمنطق نفسِه — ويُطلَب من إكسل إعادةُ الحساب عند الفتح فتبقى الصيغُ هي
   الحاكمة. والتواريخُ كانت تنزاح يومًا (منتصفُ ليل مكة = مساءُ الأمس بتوقيت
   غرينتش) فتُكتَب بتوقيت غرينتش صراحةً. */
function xlDate(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }

function workDays(s0, e0){
  var a = xlDate(s0), b = xlDate(e0); if (!a || !b || b < a) return 0;
  var n = 0;
  for (var d = new Date(a); d <= b; d.setUTCDate(d.getUTCDate() + 1)){
    var wd = d.getUTCDay();                    /* ٥ الجمعة · ٦ السبت — عطلةٌ كما في الصيغة */
    if (wd !== 5 && wd !== 6) n++;
  }
  return n;
}

function wbsExcel(){
  if (!wbsRows().length){ toast(t('لا جدولَ بعد')); return; }
  toast(t('يُجهَّز الملف…'));
  exlLoad().then(function(ok){
    if (!ok){ toast(t('تعذّر تحميلُ مكتبة إكسل')); return; }
    var E = window.ExcelJS, wb = new E.Workbook();
    wb.creator = 'قارئات أفاقي'; wb.created = new Date();
    var ws = wb.addWorksheet(t('متابعة مشروع قارئات أفاقي'), { views:[{ rightToLeft:true, state:'frozen', ySplit:5 }] });
    var GREEN = 'FF0E4C3F', SOFT = 'FFE6EFEB';
    var R = wbsRows(), K = wbsKeyRow();
    /* ١ · الترويسةُ والمواعيدُ الحاكمة */
    ws.getCell('A1').value = t('متابعة مشروع قارئات أفاقي') + ' — ' + t('حج ١٤٤٨هـ') + ' \u00b7 ' + (CFG.orgName || 'أفاقي');
    ws.getCell('A1').font = { bold:true, size:14, color:{ argb:GREEN } };
    ws.getCell('A2').value = t('المواعيد الحاكمة'); ws.getCell('A2').font = { bold:true };
    ws.getCell('A3').value = t('التاريخ'); ws.getCell('A4').value = t('المتبقي');
    K.slice(0, 11).forEach(function(k, i){
      var col = 2 + i, L = ws.getColumn(col).letter;
      ws.getCell(2, col).value = k.n;
      ws.getCell(2, col).font = { bold:true, size:10 };
      ws.getCell(3, col).value = xlDate(k.d);
      ws.getCell(3, col).numFmt = 'yyyy-mm-dd';
      var leftK = k.d ? Math.round((xlDate(k.d) - xlDate(dayKey(Date.now()))) / 86400000) : 0;
      ws.getCell(4, col).value = { formula:'IF(' + L + '3<TODAY(),"مضى ","")&TEXT(ABS(' + L + '3-TODAY()),"0")&" يوم"',
                                   result:(leftK < 0 ? 'مضى ' : '') + Math.abs(leftK) + ' يوم' };
      ws.getCell(4, col).font = { size:10, color:{ argb:'FF667788' } };
    });
    /* ٢ · العناوين */
    var HEAD = ['هيكل تقسيم العمل','اسم المهمة','تاريخ البدء','تاريخ الانتهاء','المدة','الإنجاز','الحالة',
                'الموقف الزمني','النوع','المسؤول','الجهة المعنية','المتبقي','ملاحظات المتابعة'];
    HEAD.forEach(function(h, i){
      var c = ws.getCell(5, i + 1);
      c.value = t(h);
      c.font = { bold:true, color:{ argb:'FFFFFFFF' } };
      c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:GREEN } };
      c.alignment = { horizontal:'center', vertical:'middle' };
    });
    /* ٣ · الصفوف — الصيغُ تُبنى على أرقام الصفوف الفعلية */
    var rowOf = {}; R.forEach(function(r, i){ rowOf[r.id] = 6 + i; });
    /* القيمُ المحسوبةُ بالمنطق نفسِه — للآباء من أبنائهم (تُحسَب من الورقة إلى الجذر) */
    var calc = {};
    var eff = function(r){
      if (calc[r.id]) return calc[r.id];
      var kids = wbsChildren(r.id), o;
      if (kids.length){
        var ks = kids.map(eff);
        var ss = ks.map(function(k){ return k.s; }).filter(Boolean).sort(), es = ks.map(function(k){ return k.e; }).filter(Boolean).sort();
        o = { s:ss[0] || '', e:es[es.length - 1] || '', pct:Math.round(ks.reduce(function(a, k){ return a + k.pct; }, 0) / ks.length) };
      } else o = { s:r.s || '', e:r.e || '', pct:Math.max(0, Math.min(100, +r.pct || 0)) };
      o.dur = (r.type === 'معلم') ? 0 : workDays(o.s, o.e);
      o.st = o.pct >= 100 ? 'مكتملة' : (o.pct > 0 ? 'قيد التنفيذ' : 'لم تبدأ');
      var today = dayKey(Date.now());
      o.tm = o.pct >= 100 ? 'مكتمل' : (o.e && today > o.e ? 'يستوجب المتابعة' : (o.s && today < o.s ? 'لم يحن موعده' : 'ضمن مدته'));
      o.left = o.pct >= 100 ? '—' : (o.e ? Math.round((xlDate(o.e) - xlDate(today)) / 86400000) : '');
      calc[r.id] = o; return o;
    };
    R.forEach(function(r, i){
      var n = 6 + i, dep = wbsDepth(r.id), v = eff(r);
      var kids = wbsChildren(r.id).map(function(k){ return rowOf[k.id]; }).filter(Boolean);
      var row = ws.getRow(n);
      row.getCell(1).value = '\u200f' + r.id;
      row.getCell(2).value = r.n;
      if (kids.length){
        row.getCell(3).value = { formula:'MIN(' + kids.map(function(x){ return 'C' + x; }).join(',') + ')', result:xlDate(v.s) };
        row.getCell(4).value = { formula:'MAX(' + kids.map(function(x){ return 'D' + x; }).join(',') + ')', result:xlDate(v.e) };
        row.getCell(6).value = { formula:'ROUND(AVERAGE(' + kids.map(function(x){ return 'F' + x; }).join(',') + '),0)', result:v.pct };
      } else {
        row.getCell(3).value = xlDate(r.s);
        row.getCell(4).value = xlDate(r.e);
        row.getCell(6).value = v.pct;
      }
      row.getCell(3).numFmt = 'yyyy-mm-dd'; row.getCell(4).numFmt = 'yyyy-mm-dd';
      row.getCell(5).value = { formula:'IF($I' + n + '="معلم",0,SUMPRODUCT((WEEKDAY(ROW(INDIRECT(INT($C' + n + ')&":"&INT($D' + n + '))),2)<5)+(WEEKDAY(ROW(INDIRECT(INT($C' + n + ')&":"&INT($D' + n + '))),2)=7)))', result:v.dur };
      row.getCell(7).value = { formula:'IF(F' + n + '>=100,"مكتملة",IF(F' + n + '>0,"قيد التنفيذ","لم تبدأ"))', result:v.st };
      row.getCell(8).value = { formula:'IF(F' + n + '>=100,"مكتمل",IF(TODAY()>INT(D' + n + '),"يستوجب المتابعة",IF(TODAY()<INT(C' + n + '),"لم يحن موعده","ضمن مدته")))', result:v.tm };
      row.getCell(9).value = r.type || 'مهمة';
      row.getCell(10).value = r.resp || '';
      row.getCell(11).value = r.party || '';
      row.getCell(12).value = { formula:'IF(F' + n + '>=100,"—",INT(D' + n + ')-TODAY())', result:v.left };
      row.getCell(13).value = r.note || '';
      row.outlineLevel = Math.max(0, dep - 1);
      if (kids.length){
        for (var ci = 1; ci <= 13; ci++){
          row.getCell(ci).font = { bold:true };
          row.getCell(ci).fill = { type:'pattern', pattern:'solid', fgColor:{ argb:SOFT } };
        }
      }
      for (var cj = 1; cj <= 13; cj++) row.getCell(cj).alignment = { vertical:'middle' };
      row.getCell(2).alignment = { vertical:'middle', wrapText:true, horizontal:'right' };
    });
    var last = 5 + R.length;
    /* ٤ · العرضُ والمرشِّحُ والتنسيقُ الشرطيّ */
    /* `ws.columns` غيرُ مهيَّأةٍ حتى يُطلَب العمودُ — والعرضُ يُضبَط عمودًا عمودًا */
    [16, 79, 13, 13, 12, 10, 13, 16, 12, 26, 22, 12, 50].forEach(function(w2, i){ ws.getColumn(i + 1).width = w2; });
    ws.properties.outlineProperties = { summaryBelow:false, summaryRight:false };
    ws.autoFilter = { from:{ row:5, column:1 }, to:{ row:last, column:13 } };
    var band = function(ref, rules){ ws.addConditionalFormatting({ ref:ref, rules:rules }); };
    /* شريطُ الإنجاز يحتاج حدَّيه صراحةً — بدونهما تسقط الكتابةُ كلُّها */
    band('F6:F' + last, [{ type:'dataBar', priority:1, minLength:0, maxLength:100,
                           color:{ argb:'FF2E75B6' }, cfvo:[{ type:'min' }, { type:'max' }] }]);
    var eq = function(txt, bg, fg){
      return { type:'cellIs', operator:'equal', formulae:['"' + txt + '"'], priority:1,
               style:{ fill:{ type:'pattern', pattern:'solid', bgColor:{ argb:bg } }, font:{ color:{ argb:fg || 'FF14324A' }, bold:true } } };
    };
    band('G6:G' + last, [eq('مكتملة','FFD7F5E6'), eq('قيد التنفيذ','FFFFF3CD')]);
    band('H6:H' + last, [eq('مكتمل','FFD7F5E6'), eq('ضمن مدته','FFE7F0FA'),
                         eq('يستوجب المتابعة','FFFBD5D5','FF8B1E1E'), eq('لم يحن موعده','FFEFF1F3','FF667788')]);
    band('L6:L' + last, [
      { type:'expression', formulae:['AND(ISNUMBER(L6),L6<=30,L6>=0)'], priority:1,
        style:{ fill:{ type:'pattern', pattern:'solid', bgColor:{ argb:'FFFFF3CD' } } } },
      { type:'expression', formulae:['AND(ISNUMBER(L6),L6<0)'], priority:2,
        style:{ fill:{ type:'pattern', pattern:'solid', bgColor:{ argb:'FFFBD5D5' } }, font:{ color:{ argb:'FF8B1E1E' }, bold:true } } }]);
    ws.getCell('A' + (last + 2)).value = t('صُدِّر من قارئات أفاقي') + ' \u00b7 ' + fmtDT()
      + ' \u00b7 ' + dispName(STATE.meta.name || '');
    ws.getCell('A' + (last + 2)).font = { size:9, color:{ argb:'FF889099' } };
    /* إكسلُ يُعيد الحسابَ عند الفتح — فالصيغُ تبقى الحاكمةَ والقيمُ المكتوبةُ للعرض الفوريّ */
    wb.calcProperties = { fullCalcOnLoad:true };
    wb.xlsx.writeBuffer().then(function(buf){
      dl(new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
         'متابعة-الخطة-التفصيلية-' + dayKey() + '.xlsx');
      logEvent('تصديرُ الخطة التفصيلية — ' + R.length + ' بندًا');
      toast(nm(R.length) + ' ' + t('بندًا صُدِّرت بالمعادلات والطيّ'));
    }).catch(function(e){ softErr('تصدير الخطة', e, 'تعذّر بناءُ الملف'); });
  });
}

function dosSet(id, patch){
  if (!may('settings')){ toast(t('ملفُّ البند للمهندس فما فوق')); return false; }
  var r = wbsRow(id); if (!r) return false;
  r.dos = Object.assign({}, dosOf(r), patch, { at:Date.now(), by:STATE.meta.name || '' });
  if (wbsSave()){ logEvent('ملفُّ بند — ' + id, id); render(1); return true; }
  return false;
}

function dosSave(id){
  var g = function(k){ var el = document.getElementById('ds' + k); return el ? String(el.value || '').trim() : ''; };
  if (dosSet(id, { payer:g('Payer'), buy:g('Buy'), inst:g('Inst'), how:g('How'), where:g('Where'), val:g('Val'), gain:+g('Gain') || 0 }))
    toast(t('حُفظ ملفُّ البند'));
}

function dosItemAdd(id){
  var r = wbsRow(id); if (!r) return;
  var g = function(k){ var el = document.getElementById('di' + k); return el ? String(el.value || '').trim() : ''; };
  var n = g('N'); if (!n){ toast(t('اكتب اسمَ الصنف')); return; }
  var L = dosItems(r).slice(); L.push({ n:n, q:+g('Q') || 1, p:+g('P') || 0 });
  if (dosSet(id, { items:L })) toast(t('أُضيف الصنف'));
}

function dosItemDel(id, i){
  var r = wbsRow(id); if (!r) return;
  var L = dosItems(r).slice(); L.splice(i, 1);
  if (dosSet(id, { items:L })) toast(t('حُذف الصنف'));
}

function dosFileAdd(id){
  var r = wbsRow(id); if (!r) return;
  var g = function(k){ var el = document.getElementById('df' + k); return el ? String(el.value || '').trim() : ''; };
  var u = g('U'); if (!/^https?:\/\//i.test(u)){ toast(t('الرابطُ يبدأ بـhttp')); return; }
  var L = dosFiles(r).slice(); L.push({ n:g('N') || u.slice(0, 40), u:u, at:Date.now(), by:STATE.meta.name || '' });
  if (dosSet(id, { files:L })) toast(t('أُضيف الملف'));
}

function dosFileDel(id, i){
  var r = wbsRow(id); if (!r) return;
  var L = dosFiles(r).slice(); L.splice(i, 1);
  if (dosSet(id, { files:L })) toast(t('حُذف الملف'));
}

function wbsRemove(id){
  if (!may('settings')){ toast(t('جدولُ المتابعة للمهندس فما فوق')); return; }
  var p = String(id) + '.';
  STATE.wbs.rows = wbsRows().filter(function(x){ return String(x.id) !== String(id) && String(x.id).indexOf(p) !== 0; });
  if (wbsSave()){ logEvent('حذفُ بندٍ من جدول المتابعة — ' + id, id); toast(t('حُذف البند') + ' ' + id); WBS_EDIT = ''; render(1); }
}

function wbsEditSave(id, patch){
  if (!may('settings')){ toast(t('جدولُ المتابعة للمهندس فما فوق')); return; }
  var r = wbsRows().filter(function(x){ return String(x.id) === String(id); })[0]; if (!r) return;
  Object.keys(patch).forEach(function(k){ r[k] = patch[k]; });
  if (wbsSave()){ logEvent('تعديلُ بندٍ — ' + id, id); toast(t('حُفظ البند')); WBS_EDIT = ''; render(1); }
}

function wbsClear(){
  if (!may('settings')){ toast(t('جدولُ المتابعة للمهندس فما فوق')); return; }
  STATE.wbs = { rows:[], keys:[] };
  if (wbsSave()){ logEvent('مسحُ جدول المتابعة'); toast(t('مُسح الجدول — استورد ملفًا جديدًا')); WBS_RESET = 0; render(1); }
}
