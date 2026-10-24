/* ============================================================================
   FILE    : src/05-map/05-lifecycle-map-03-export-import-docx.js
   DOMAIN  : Map & lifecycle — layers, export/import, login, ministry screen
   PURPOSE : Export/import with real data, ExcelJS for self-updating files, and Word export that stays inside the app.
   DEFINES : xlsxLoad, dlIOS, dlSheet, dl
   GLOBALS : XLSX_READY, EXLJS_READY, SHEETS, SHEET_NAMES
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ التصدير والاستيراد — بالبيانات الحقيقية ═══
   SheetJS يُحمَّل كسولًا عند أول تصديرٍ فلا يُثقل الإقلاع.
   وKMZ يُبنى بالكود — ضغطُ ZIP مكتوبٌ هنا فلا يحتاج مكتبةً ثالثة. */

var XLSX_READY = false, XLSX_LOADING = null;

function xlsxLoad(){
  if (XLSX_READY || (typeof window !== 'undefined' && window.XLSX)){ XLSX_READY = true; return Promise.resolve(true); }
  /* (V38.86) a second press while the engine is still loading said nothing — the press looked lost (and the click audit
     caught a different export button each run: whichever it pressed during the load). Every press now hears it. */
  if (XLSX_LOADING){ if (typeof toast === 'function') toast('\u23F3 ' + t('يُجهَّز محرّكُ الإكسل…')); return XLSX_LOADING; }
  /* (V38.54) own copy first (works offline once cached), the SheetJS CDN only as a fallback;
     (V38.55) the user sees at once that the press arrived — the first load can take seconds on the field network */
  if (typeof toast === 'function') toast('\u23F3 ' + t('يُجهَّز محرّكُ الإكسل…'));
  XLSX_LOADING = libLoad('vendor/xlsx/0.20.3/xlsx.full.min.js', 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js', 12000)
    .then(function(ok){ ok = !!(ok && window.XLSX); XLSX_READY = ok; if (!ok) setTimeout(function(){ XLSX_LOADING = null; }, 60000); return ok; });   /* a failure answers at once for a minute, then a retry is allowed */
  return XLSX_LOADING;
}

/* ═══ ExcelJS — للملفّ الذي يُحدِّث نفسَه ═══
   مكتبةُ الجداول التي نستعملها للتصدير لا تكتب تنسيقًا ولا تجميعَ صفوفٍ ولا
   تنسيقًا شرطيًّا — تكتب قيمًا. وملفُّ الخطة التفصيلية ليس قيمًا: صيغٌ تحسب
   المدةَ والحالةَ والموقفَ الزمنيَّ من تاريخ اليوم، وآباءٌ يجمعون أبناءهم،
   ومستوياتُ طيٍّ، وألوانٌ شرطية. فتُحمَّل مكتبةٌ ثانيةٌ لهذا الملفِّ وحدَه. */
var EXLJS_READY = false, EXLJS_LOADING = null;

/* ═══ (V33.7) بلاغُ المالك: «لما بعمل إكسبورت وورد بيطلّعني برّه السيستم ويدخّلني تاني» ═══
   على الآيفون والتطبيقُ مثبّتٌ على الشاشة الرئيسية، رابطُ التنزيل يفتح الملفَّ في معاينةٍ تحلّ محلَّ التطبيق نفسِه — فإذا رجع
   المستخدمُ أُعيد تحميلُ التطبيق ودخل بالجلسة المحفوظة. صار الآيفونُ يسلّم الملفَّ بقائمة المشاركة («حفظ في الملفات»، البريد،
   واتساب) والتطبيقُ في مكانه. وإن بُني الملفُّ بعد انتهاء لمسة المستخدم (القالبُ يُحمَّل) فلا تُفتح القائمةُ إلا بلمسةٍ جديدة —
   فيظهر زرٌّ «احفظ الملف» يفتحها. وغيرُ الآيفون كما كان. */
function dlIOS(){ var ua = (typeof navigator === 'object' && navigator.userAgent) || ''; return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); }
function dlSheet(file){
  var old = document.getElementById('dlSheet'); if (old) old.remove();
  var d = document.createElement('div'); d.id = 'dlSheet'; d.setAttribute('role', 'dialog');
  d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;background:var(--surface,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd);border-radius:14px;padding:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);text-align:center';
  d.innerHTML = '<div style="font-weight:700;margin:0 0 10px">' + esc(t('الملفُّ جاهز')) + ' \u2014 ' + esc(file.name) + '</div>'
    + '<button type="button" class="btn btn-primary" id="dlShareGo">\u{1F4E4} ' + esc(t('احفظ الملف أو شاركه')) + '</button> '
    + '<button type="button" class="btn btn-quiet" id="dlShareX">' + esc(t('إغلاق')) + '</button>';
  document.body.appendChild(d);
  document.getElementById('dlShareGo').onclick = function(){ navigator.share({ files:[file], title:file.name }).catch(function(e){ LS_ERR = e; }).then(function(){ d.remove(); }); };
  document.getElementById('dlShareX').onclick = function(){ d.remove(); };
}
function dl(blob, name){
  try{
    if (dlIOS() && typeof File === 'function' && navigator.canShare && navigator.share){
      var file = new File([blob], name, { type:blob.type || 'application/octet-stream' });
      if (navigator.canShare({ files:[file] })){
        navigator.share({ files:[file], title:name }).catch(function(e){ if (!/abort/i.test(String(e && e.name))) dlSheet(file); });
        return true;
      }
    }
    var u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); }, 4000);   /* (V33.7) ٤٠٠ م.ث قليلةٌ لبعض المتصفّحات */
    return true;
  }catch(e){ return false; }
}

/* ── أوراق التقرير — كلٌّ من الأرقام التي على الشاشة ── */
var SHEETS = {
  vers: function(){
    var cur9 = appVer(), out = [['المستخدم','النسخة','الدور','آخر ظهور','الجهاز','الحالة']];
    presenceRows().forEach(function(r){
      out.push([r.name || r.uid, r.ver || '', (ROLES[r.role] || {}).n || r.role || '',
                r.at ? new Date(r.at).toISOString().slice(0, 16).replace('T', ' ') : '',
                r.dev || '', r.ver === cur9 ? 'الحالية' : 'أقدم']);
    });
    return out;
  },
  over: function(){
    /* الورقةُ والشاشةُ من حلقةٍ واحدةٍ بتعريفٍ واحد — لا يناقض الإجماليُّ صفوفَه */
    var K = siteKeyStats(), out = [['المشعر','النوع','العدد','تمت الزيارة','مُركّب']];
    K.keys.forEach(function(k){ var p = k.split('|'); out.push([p[0], p[1], K.by[k], K.sv[k] || 0, K.ins[k] || 0]); });
    out.push(['الإجمالي','', K.total.n, K.total.sv, K.total.ins]);
    return out;
  },
  /* ═══ ورقةُ الملخّص — أوّلُ ما يُفتَح ═══
     من يفتح ملفًا فيه ثلاثون ورقةً لا يعرف من أين يبدأ. فورقةٌ أولى تقول
     الموقفَ كلَّه في عشرين سطرًا: النقاطُ والمسحُ والتركيبُ ودورةُ الحياة
     والمشاعرُ والمهامُّ الأسبوعية والخطةُ التفصيلية. */
  summary: function(){
    var K = siteKeyStats(), S = K.total, out = [];
    /* النسبةُ بأرقام لغة الواجهة — «4٪» بأرقامٍ لاتينيةٍ في ورقةٍ عربيةٍ تُقرَأ عوجاء */
    var pc = function(v, t2){ return t2 ? nm(Math.round(v / t2 * 100)) + '٪' : '—'; };
    out.push(['قارئات أفاقي — الملخّص التنفيذي', '', '']);
    out.push(['التاريخ', fmtDT(), '']);
    out.push(['', '', '']);
    out.push(['المؤشر', 'العدد', 'النسبة']);
    out.push(['إجمالي المواقع', S.n, nm(100) + '٪']);
    out.push(['تمت الزيارة', S.sv, pc(S.sv, S.n)]);
    out.push(['مُركّب', S.ins, pc(S.ins, S.n)]);
    out.push(['لم يُزر', S.noRec, pc(S.noRec, S.n)]);
    out.push(['تحتاج زيارة أخرى', S.stuck, pc(S.stuck, S.n)]);
    out.push(['', '', '']);
    out.push(['دورة النقطة', 'العدد', 'النسبة']);
    var life = {}; STATE.sites.forEach(function(x){ var l = lifeOf(x); life[l] = (life[l] || 0) + 1; });
    LIFE_ORDER.forEach(function(k){ if (life[k]) out.push([LIFE[k].n, life[k], pc(life[k], S.n)]); });
    out.push(['', '', '']);
    out.push(['المشعر', 'العدد', 'تمت الزيارة']);
    var z = {}; STATE.sites.forEach(function(x){ z[x.zone] = z[x.zone] || { n:0, s:0 }; z[x.zone].n++; if (svVisited(STATE.recs[x.id])) z[x.zone].s++; });
    Object.keys(z).sort(function(a, b){ return z[b].n - z[a].n; }).forEach(function(k){ out.push([k, z[k].n, z[k].s]); });
    if (typeof wtStats === 'function' && wtRows().length){
      var c = wtStats();
      out.push(['', '', '']);
      out.push(['المهام الأسبوعية', 'العدد', '']);
      out.push(['إجمالي المهام', c.all, '']); out.push(['مكتملة', c.done, pc(c.done, c.all)]);
      out.push(['قيد التنفيذ والانتظار', c.run + c.wait, '']); out.push(['متأخرة', c.late, '']);
      out.push(['مستحق اليوم', c.d0, '']); out.push(['باقي الأسبوع', c.week, '']);
    }
    if (typeof wbsRows === 'function' && wbsRows().length){
      var R = wbsRows(), leaves = R.filter(function(r){ return !wbsChildren(r.id).length; });
      out.push(['', '', '']);
      out.push(['الخطة التفصيلية', 'العدد', '']);
      out.push(['بنود', leaves.length, '']);
      out.push(['مكتمل', leaves.filter(function(r){ return wbsPct(r) >= 100; }).length, '']);
      out.push(['متأخر', leaves.filter(function(r){ return wbsTiming(r) === 'متأخر'; }).length, '']);
      R.filter(function(r){ return wbsDepth(r.id) === 1; }).forEach(function(r){ out.push([r.n, wbsPct(r) + '٪', '']); });
    }
    return out;
  },
  minappr: function(){
    var out = [['رقم الشاخص / الاسم','النقطة','الاسم','المشعر','المربع','الشاخص','الشركة','المشرف','تاريخ الزيارة','الاعتماد التقني','تاريخه','حالة الوزارة','بواسطة','تاريخه','ملاحظة الوزارة','نوع التركيب','مصدر الكهرباء','العرض المتاح','الارتفاع المتاح','التحديات']];
    surveyList().filter(function(x){ return x.rec && svReview(x.rec) === 'approved'; }).forEach(function(x){ var r = x.rec, ms = minState(r);
      out.push([siteKey(x.site), x.id, x.site.name || '', x.site.zone || '', x.site.sq || '', x.site.sign || '', x.site.co || '', r.by || '', r.at ? dayKey(r.at) : '', r.reviewBy || '', r.reviewAt ? dayKey(r.reviewAt) : '',
                ms === 'approved' ? 'اعتمدت الوزارة' : (ms === 'returned' ? 'أعادتها الوزارة' : 'بانتظار الوزارة'), r.minBy || '', r.minAt ? dayKey(r.minAt) : '', r.minNote || '',
                r.mount || '', r.power || '', r.wid_m != null ? r.wid_m : '', r.hgt_m != null ? r.hgt_m : '', (r.chals || []).join(' · ')]); });
    return out;
  },
  /* ═══ ورقةُ المهام كاملةً — للتعديل خارج النظام ثم الرفع (V17.18) ═══
     الورقةُ التي يقرؤها التقريرُ مرشَّحةٌ كالشاشة، فمن صدّرها وهو يرى ترشيحًا
     ثم رفعها استبدل الجدولَ كلَّه بما رآه وضاع الباقي. فصارت ورقتان: ورقةُ
     التقرير (ما تراه) وورقةُ العمل (كلُّ المهام) — وترتيبُ أعمدتها هو الذي
     يقرؤه المستورِد حرفًا بحرف، فتدور الدورةُ: صدِّر · عدِّل · ارفع. */
  wtaskAll: function(){
    /* الأعمدةُ في مواضع ملفِّ المكتب نفسِها (V17.19): الثلاثةُ المحسوبةُ تُترَك
       فارغةً، واليدويةُ الثلاثةُ في مواضعها — فيقرؤها الاستيرادُ من أيِّ
       الورقتين صُدِّرت، ولا يضيع عمودٌ في الدورة. */
    var out = [['#','المهمة','مسار إدارة المشروع','كود المسار','الوصف','المسؤول','الحالة',
                'تاريخ الرصد (هجري)','تاريخ الاستحقاق (هجري)','مصدر المهمة','التحديث',
                'تاريخ الرصد (ميلادي)','تاريخ الاستحقاق (ميلادي)','فئة الاستحقاق',
                'توقف المهمة','اجتماع الاحد','اجتماع الاربعاء']];
    wtRows().forEach(function(r){ out.push([r.id, r.n, r.track, r.code, r.d, r.who, r.st, r.seen, r.due, r.src, r.upd, '', '', '', r.stop || '', r.mSun || '', r.mWed || '']); });
    return out;
  },
  /* ═══ ورقةُ الاجتماع: ما بقي · ما استُجدّ · ما اكتمل — لا غير (V17.18) ═══ */
  wtmeet: function(){
    var since = (STATE.wtask && STATE.wtask.meetAt) || 0;
    var out = [['القسم','المهمة','المسؤول','الاستحقاق','الحالة','ما قيل']];
    var say = function(r){
      var last = (Array.isArray(r.log) ? r.log : []).filter(function(e){ return (e.at || 0) > since; });
      var txt = last.map(function(e){ return e.note || (e.st ? t('الحالة') + ': ' + t(e.st) : ''); }).filter(Boolean).join(' \u00b7 ');
      return txt || r.upd || '';
    };
    /* ١ · ما بقي من الاجتماع الماضي: مفتوحٌ وكان قائمًا قبل الختم */
    wtRows().filter(function(r){ return r.st !== 'مكتمل' && (r.at || 0) <= since; })
      .forEach(function(r){ out.push([t('باقٍ من الاجتماع الماضي'), r.n, r.who || '', r.due || '', r.st, say(r)]); });
    /* ٢ · ما استُجدّ: مهامُّ فُتحت بعد الختم */
    wtRows().filter(function(r){ return r.st !== 'مكتمل' && (r.at || 0) > since; })
      .forEach(function(r){ out.push([t('مهمةٌ جديدة'), r.n, r.who || '', r.due || '', r.st, say(r)]); });
    /* ٣ · ما اكتمل منذ الاجتماع الماضي */
    wtRows().filter(function(r){ return r.st === 'مكتمل' && (r.doneAt || 0) > since; })
      .forEach(function(r){ out.push([t('اكتمل منذ الاجتماع الماضي'), r.n, r.who || '', r.due || '', r.st, say(r)]); });
    return out;
  },
  wtsince: function(){
    var out = [['#','المهمة','المسؤول','ما تغيّر','من','متى']], S = wtSince();
    S.items.forEach(function(x){ out.push([x.r.id, x.r.n, x.r.who || '', x.what, dispName(x.e.by || ''), fmtDT(x.e.at || 0)]); });
    return out;
  },
  wtask: function(){
    var out = [['#','المهمة','المسار','الكود','الوصف','المسؤول','الحالة','تاريخ الرصد','تاريخ الاستحقاق','المصدر','آخر تحديث','المتبقي']];
    wtFiltered().forEach(function(r){ var d = wtDue(r); out.push([r.id, r.n, r.track, r.code, r.d, r.who, r.st, r.seen, r.due, r.src, r.upd, d == null ? '—' : d]); });
    return out;
  },
  wbs: function(){
    var out = [['هيكل تقسيم العمل','البند','تاريخ البدء','تاريخ الانتهاء','المدة','الإنجاز ٪','الحالة','الموقف الزمني','النوع','المسؤول','الجهة المعنية','المتبقي']];
    wbsFiltered().forEach(function(r){ var l = wbsLeft(r); out.push([r.id, r.n, r.s, r.e, r.dur, wbsPct(r), wbsStatus(r), wbsTiming(r), r.type, r.resp, r.party, (l == null || wbsPct(r) >= 100) ? '—' : l]); });
    return out;
  },
  sites: function(){
    var out = [['رقم الشاخص / الاسم','المعرّف','الاسم','المشعر','النوع','وجه العمل','المربع','الشاخص','الشركة',
                'خط العرض','خط الطول','حالة المسح','حالة التركيب']];
    /* ما رُشِّح على الخريطة والقائمة هو ما يُصدَّر — وبلا ترشيحٍ الكلُّ */
    (typeof filtered === 'function' ? filtered() : STATE.sites).forEach(function(x){
      out.push([siteKey(x), x.id, x.name, x.zone, x.type, x.work, x.sq, x.sign, x.co, x.lat, x.lng,
                svLabel(STATE.recs[x.id]),
                (STATE.inss[x.id]||{}).status || x.fstat || 'لم يبدأ']);
    });
    return out;
  },
  qa: function(){
    var out = [['النقطة','المنفِّذ','القطع','النقاط','الحالة','الاعتماد','التاريخ']];
    Object.keys(STATE.inss).forEach(function(k){
      var r = STATE.inss[k];
      out.push([k, r.by || '', Object.keys(r.parts || {}).length, r.pts || 0,
                r.status || '', r.approved ? 'معتمد' : 'بانتظار التدقيق',
                dayKey(r.at || Date.now())]);
    });
    return out;
  },
  sop: function(){
    var out = [['الدورة','من يملكها','#','من','ما يفعل','أين']];
    SOPS.forEach(function(s){
      s.steps.forEach(function(st, i){
        out.push([s.n, s.own, i + 1, st[0], st[1], st[2]]);
      });
      s.rules.forEach(function(r){ out.push([s.n, s.own, '', 'قاعدة', r, '']); });
    });
    return out;
  },
  reps: function(){
    var out = [['التقرير','الجهة','إلى','الدورية','موعده','محتواه','أوراقه']];
    REPORTS.forEach(function(r){
      out.push([r.n, r.side === 'co' ? 'الشركة' : 'الوزارة', r.to, r.per, r.when, r.what,
                r.sheets.join(' · ')]);
    });
    return out;
  },
  hse: function(){
    var out = [['التاريخ','النوع','الموقع','أيام مفقودة','الإجراء','المسجِّل']];
    HSE.incidents.forEach(function(x){
      out.push([dayKey(x.at), x.kind, x.site || '',
                x.lost, x.why, x.by]);
    });
    return out;
  },
  ncr: function(){
    var out = [['المعرّف','النقطة','الفئة','الخطورة','الوصف','الحالة','المُبلِّغ']];
    NCRS.forEach(function(x, i){
      out.push(['NCR-' + (i+1), x.site || '', x.cat, x.sev, x.why, x.st, x.by]);
    });
    return out;
  },
  ipc: function(){
    var out = [['المعرّف','الفترة','المبلغ','استقطاع ٪','الصافي','الحالة']];
    IPCS.forEach(function(x, i){
      var r = Math.round(x.amt * x.retPct / 100);
      out.push(['IPC-' + (i+1), x.period, x.amt, x.retPct, x.amt - r, x.st]);
    });
    return out;
  },
  miles: function(){
    var out = [['المعرّف','المعلَم','الوزن ٪','يعتمد على','الإنجاز ٪','الحالة']];
    mileList().forEach(function(m){
      var p = Math.round(mileDone(m) * 100);
      out.push([m.id, m.n, m.w, m.dep || '', p, p>=100?'بلغ':(p>0?'جارٍ':'لم يبدأ')]);
    });
    return out;
  },
  raci: function(){
    return [['النشاط','R','A','C','I']].concat(RACI_ACTS.map(function(r){ return r.slice(); }));
  },
  less: function(){
    return [['المرحلة','ما وقع','ما فُعل']].concat(
      LESSONS.map(function(l){ return [l.p, l.w, l.a]; }));
  },
  evm: function(){
    var v = evm();
    if (!v) return [['المؤشّر','القيمة']];
    return [['المؤشّر','الرمز','القيمة'],
      ['المخطَّط حتى اليوم','PV',v.PV], ['المكتسَب','EV',v.EV], ['المنصرف','AC',v.AC],
      ['فرق الجدول','SV',v.SV], ['فرق الكلفة','CV',v.CV],
      ['أداء الجدول','SPI',v.SPI], ['أداء الكلفة','CPI',v.CPI],
      ['المتوقَّع عند الإتمام','EAC',v.EAC], ['المتبقّي','ETC',v.ETC],
      ['فرق الإتمام','VAC',v.VAC], ['كفاءة ما بقي','TCPI',v.TCPI],
      ['الميزانية الكلية','BAC',v.BAC]];
  },
  /* المحضرُ إكسل: الترويسةُ والأعمالُ والاعتمادُ في ورقةٍ واحدةٍ كما تُقدَّم */
  /* ورقةُ الدخول: تُطبَع وتُوزَّع مرةً — ثم تُمسَح الكلماتُ من القاعدة */
  provsheet: function(){
    var L = provList().filter(function(r){ return r.status === 'done' && r.pass; });
    var out = [['الاسم', 'اسم المستخدم', 'كلمة المرور', 'الدور', 'الوظيفة', 'الفريق', 'البريد']];
    L.sort(function(a, b){ return arCmp(a.crew || '', b.crew || ''); })
     .forEach(function(r){
       var j = r.job ? jobOf(r.job) : null;
       out.push([r.name || '', r.user, r.pass, (ROLES[r.role] || {}).n || r.role, j ? j.n : '', r.crew || '', r.email || '']);
     });
    return out;
  },
  /* ═══ ورقةٌ لكلِّ صفحةٍ فيها إسناد — بما في الصفحة وحدَها ═══ */
  /* (V26.6) نقاطُ التحديات: صفٌّ لكلِّ نقطةٍ وتحدٍّ — بفلتر صفحة التحديات والمعوقات إن وُضع، وإلا كلُّها */
  chalpts: function(){
    var out = [['المشعر','النوع','المعرّف','الاسم','الشاخص','العائق','وصف العائق','حالة الوصول','الجهة المسؤولة','من سيحلّه','آلية المعالجة','وصف المعالجة','آخر تاريخ','الحالة','مهمة المعالجة','المسّاح','تاريخ الزيارة','خط العرض','خط الطول']];
    var F = mfuData().fch || {}, CH = {}; mfuAllChal().forEach(function(c){ if (c.src === 'field') CH[c.t] = c; });
    (typeof mfuObstaclesF === 'function' ? mfuObstaclesF() : mfuObstacles()).forEach(function(o){
      var x = o.x, r = STATE.recs[x.id] || {};
      o.cats.forEach(function(c){ var f = F[c] || {}, it = CH[c] || {};
        out.push([taxOf(x).g, taxOf(x).t, x.id, x.name || '', x.sign || '', c, String(r.chal_note || r.note || ''), r.access || '', mfuOwnerOf(c), f.owner || '', f.m || '', f.desc || '', f.due || '', it.st || '', f.task ? '#' + f.task : '', r.by || '', r.at ? dayKey(r.at) : '', x.lat != null ? +x.lat : '', x.lng != null ? +x.lng : '']); });
    });
    return out;
  },
  asnreg: function(){
    var out = [['الطلب','النوع','النقطة','المشعر','المُسنَد إليه','الموعد','الحالة','أُبلغ واتساب','أُسند في','أسنده']];
    Object.keys(STATE.tasks || {}).map(function(k){ return STATE.tasks[k]; })
      .sort(function(a, b){ return (b.at || 0) - (a.at || 0); })
      .forEach(function(x){
        var st = siteFind(x.site) || {};
        out.push([x.no || '', kindLabel(x.kind), x.site, st.zone || '', x.to || '', x.when || '', x.status || '',
                  x.waAt ? dayKey(x.waAt) : '', x.at ? dayKey(x.at) : '', x.by || '']);
      });
    return out;
  },
  visits: function(){
    var out = [['النقطة','المشعر','النوع','الوصول','المراجعة','راجعه','الزائر','التاريخ','ملاحظة']];
    Object.keys(STATE.recs || {}).forEach(function(id){
      var r = STATE.recs[id], st = siteFind(id) || {};
      out.push([id, st.zone || '', st.type || '', r.access || '', svReview(r) || '', r.reviewBy || '', r.by || '', r.at ? dayKey(r.at) : '', r.note || '']);
    });
    return out;
  },
  installs: function(){
    var out = [['النقطة','المشعر','الحالة','اعتُمد','اعتمده','نفّذه','التاريخ','القطع','السيريالات']];
    Object.keys(STATE.inss || {}).forEach(function(id){
      var r = STATE.inss[id], st = siteFind(id) || {};
      var parts = Object.keys(r.parts || {}).map(function(k){ return itemName(k) + '×' + cfgN(r.parts[k]); }).join(' · ');
      var sn = Object.keys(r.serials || {}).map(function(k){ return itemName(k) + ':' + r.serials[k]; }).join(' · ');
      out.push([id, st.zone || '', r.status || '', r.approved ? 'نعم' : 'لا', r.apprBy || r.qaBy || '', r.by || '', r.at ? dayKey(r.at) : '', parts, sn]);
    });
    return out;
  },
  dismantles: function(){
    var out = [['النقطة','المشعر','الحالة','فكّه','التاريخ','سليم','تالف','مفقود','ملاحظة']];
    Object.keys(STATE.diss || {}).forEach(function(id){
      var r = STATE.diss[id], st = siteFind(id) || {}, it = r.items || {};
      var c = { ok:0, bad:0, lost:0 };
      Object.keys(it).forEach(function(k){ var q = cfgN((it[k] || {}).qty); var cd = (it[k] || {}).cond; if (cd === 'سليم') c.ok += q; else if (cd === 'تالف') c.bad += q; else c.lost += q; });
      out.push([id, st.zone || '', r.status || '', r.by || '', r.at ? dayKey(r.at) : '', c.ok, c.bad, c.lost, r.note || '']);
    });
    return out;
  },
  maints: function(){
    var out = [['النقطة','المشعر','التاريخ','الفنيّ','العطل','ما عُمل','القطع','ملاحظة']];
    Object.keys(STATE.maints || {}).forEach(function(id){
      var st = siteFind(id) || {};
      maintList(id).forEach(function(m){
        var parts = Object.keys(m.parts || {}).map(function(k){ return itemName(k) + '×' + cfgN(m.parts[k]); }).join(' · ');
        out.push([id, st.zone || '', m.at ? dayKey(m.at) : '', m.by || '', m.fault || '', m.act || '', parts, m.note || '']);
      });
    });
    return out;
  },
  attendance: function(){
    var out = [['اليوم','الشخص','الدور','بدأ','أنهى','ساعات','بدأ داخل النطاق','أنهى داخل النطاق']];
    Object.keys(STATE.att || {}).map(function(k){ return STATE.att[k]; })
      .sort(function(a, b){ return String(b.day).localeCompare(String(a.day)) || arCmp(a.name, b.name); })
      .forEach(function(r){
        out.push([r.day, r.name, (ROLES[r.role] || {}).n || r.role || '', r.in ? hm(r.in.at) : '', r.out ? hm(r.out.at) : '',
                  r.hours || '', r.in ? (r.in.ok === false ? 'لا' : (r.in.ok ? 'نعم' : '—')) : '', r.out ? (r.out.ok === false ? 'لا' : (r.out.ok ? 'نعم' : '—')) : '']);
      });
    return out;
  },
  mywork: function(){
    var me = STATE.meta.name || '', out = [['الطلب','النوع','النقطة','المشعر','الموعد','الحالة']];
    Object.keys(STATE.tasks || {}).map(function(k){ return STATE.tasks[k]; })
      .filter(function(x){ return x.to === me; })
      .forEach(function(x){ var st = siteFind(x.site) || {}; out.push([x.no || '', kindLabel(x.kind), x.site, st.zone || '', x.when || '', x.status || '']); });
    return out;
  },
  hodoc: function(){
    var id = HO_DOC || '', s2 = siteFind(id), r = STATE.inss[id], h = handOf(id);
    if (!s2 || !r) return [['لا محضرَ معروضٌ الآن — افتح محضرَ نقطةٍ أوّلًا']];
    var T = hoTpl(s2), out = [];
    out.push(['المملكة العربية السعودية']);
    out.push([hoParty('owner'), hoParty('agency')]);
    out.push([T.t]);
    out.push([]);
    out.push(['اسم المشروع', hoParty('project'), 'المقاول', hoParty('contractor')]);
    out.push(['الاستشاري', hoParty('consultant'), 'نوع التقديم', h && h.re ? 'إعادة تقديم' : 'جديد']);
    out.push(['رقم المحضر', h ? h.no : '', 'تاريخ المحضر', h ? fmtDate(h.at) : '']);
    out.push(['مكان الأعمال', s2.zone, T.loc, hoLocOf(s2)]);
    out.push([]);
    out.push(['البند', 'العدد', 'السيريال']);
    hoItems(id).forEach(function(o){ out.push([o.item, o.qty, o.sn]); });
    out.push([]);
    out.push(['يُقدَّم إلى', T.to === 'شركة تقديم الخدمة' ? (s2.co || '') : T.to]);
    out.push(['بادئة الشبكة', s2.net || '']);
    out.push(['نفّذه', r.by || '', 'اعتمده', r.qaBy || r.apprBy || '']);
    out.push(['سلَّم', h ? h.by : '', 'استلم عن العميل', h ? h.to : '']);
    out.push([]);
    out.push(['تعهدات الاستلام', String(T.pledge).replace('{co}', s2.co || '')]);
    out.push([]);
    out.push(['م', 'الاسم', 'صفته', 'الجهة', 'التوقيع']);
    hoSigners().forEach(function(g, i){ out.push([i + 1, g.n || '', g.role || '', g.org || '', '']); });
    return out;
  },
  risks: function(){
    var out = [['المعرّف','الخطر','الفئة','الاحتمال','الأثر','الدرجة','المستوى','الاستجابة','الخطة','المالك','الحالة']];
    risksList().slice().sort(function(a,b){ return riskScore(b) - riskScore(a); }).forEach(function(r){
      out.push([r.id, r.t, r.cat, r.p, r.i, riskScore(r), riskLevel(riskScore(r)).t,
                r.resp, r.plan, r.own, r.st]);
    });
    return out;
  },
  budm: function(){
    var byCat = {}, out = [['الباب','المبلغ','النسبة']];
    buysList().forEach(function(b){ if (b.st !== 'معتمد') return;
      byCat[b.cat] = (byCat[b.cat] || 0) + (+b.amt || 0); });
    var spent = buysSpent();
    Object.keys(byCat).forEach(function(c){
      out.push([c, byCat[c], spent ? Math.round(byCat[c]/spent*100) + '%' : '0%']);
    });
    out.push(['الإجمالي', spent, '100%']);
    return out;
  },
  wplan: function(){
    var out = [['الأسبوع','العنوان','الأولوية','الحالة','التفاصيل والملاحظات','الخطوات','منجز من الخطوات','الاحتياجات والمتطلبات','النتيجة المرجوّة','النتيجة الفعلية','سبب الإغلاق','التحديثات','مهمة أسبوعية']];
    wplanItems(wplanWeek()).forEach(function(x){ var st = wplanLines(x.steps); out.push([x.wk, x.t || '', x.pri || '', x.st || '', x.n || '', st.join(' | '), (x.sdone || []).filter(Boolean).length + '/' + st.length, x.needs || '', x.goal || '', x.result || '', x.closeWhy || '', wplanUpdates(x).map(function(h){ return dayKey(h.at) + ': ' + h.v; }).join(' | '), x.task ? '#' + x.task : '']); });
    return out;
  },
  pmi: function(){
    var out = [['الإطار','البند','العنوان','الدليل في النظام','القياس','الحالة']], F = { pmbok:'دليل المعرفة ٨', acp:'المنهج الرشيق', ai:'إدارة مشاريع الذكاء الاصطناعي' };
    pmiRows().forEach(function(r){ out.push([F[r.fw], r.code, r.title, r.ev, r.note, PMI_ST[r.st][0]]); });
    return out;
  },
  diary: function(){
    var out = [['اليوم','زيارات','المشاعر','تحتاج زيارة أخرى','تركيب','فك','مواقع جديدة','اعتمادات تقنية','اعتمادات الوزارة','من عملوا','الأكثر عملًا','ساعات الفرد (متوسط)','ساعات الفريق','تراكمي المسح','تراكمي التركيب']];
    diaryRows().slice().reverse().forEach(function(r){ out.push([r.day, r.sv, r.zones.map(function(o){ return o.z + ' ' + o.n; }).join(' · '), r.stuck, r.ins, r.dis, r.nw, r.apr, r.min, r.people, r.top.join(' · '), r.hAvg, r.hSum, r.cum, r.cumIns]); });
    return out;
  },
  score: function(){
    var S = scores();
    /* أعمدةُ المسح بنوع الموقع (عددٌ ونقاط) لكلِّ نوعٍ ظهر — (V18.6) */
    var types = {}; S.list.forEach(function(e){ Object.keys(e.surveyT || {}).forEach(function(k){ types[k] = (types[k] || 0) + e.surveyT[k].n; }); });
    var cols = Object.keys(types).sort(function(a, b){ return types[b] - types[a]; });
    var out = [['#','الاسم','المرحلة','زيارة','تركيب','فك','تهيئة','تجميع',
                'أعمال','أيام','النقاط','متوسط اليوم','نقاط المسح','نقاط المسح / يوم','المستحَق']
               .concat(cols.map(function(c){ return 'مسح ' + c; })).concat(cols.map(function(c){ return 'نقاط ' + c; }))];
    S.list.forEach(function(e){
      var R = STAGE_ROLES[e.stage] || { n:e.stage };
      out.push([e.rank, e.name, R.n, e.survey, e.install, e.dis, e.prep, e.asm,
                e.acts, e.nDays, e.total, e.perDay, Math.round(e.pSurvey * 10) / 10, e.nDays ? Math.round(e.pSurvey / e.nDays * 10) / 10 : 0, e.money]
               .concat(cols.map(function(c){ return e.surveyT[c] ? e.surveyT[c].n : 0; })).concat(cols.map(function(c){ return e.surveyT[c] ? Math.round(e.surveyT[c].pts * 10) / 10 : 0; })));
    });
    return out;
  },
  invb: function(){
    var out = [['الصنف','المخزن','العُهدة','رُكّب','تالف','الإجمالي']];
    stockBalance().forEach(function(r){
      out.push([r.item, r.store, r.custody, r.used, r.scrap,
                r.store + r.custody + r.used + r.scrap]);
    });
    return out;
  },
  invmv: function(){
    var out = [['التاريخ','الحركة','الصنف','الكمية','المنفِّذ','النقطة','سجّلها','ملاحظة']];
    movesList().forEach(function(m){
      out.push([dayKey(m.at), m.kind, m.item, m.qty,
                m.by || '', m.site || '', m.user || '', m.note || '']);
    });
    return out;
  },
  buys: function(){
    var out = [['التاريخ','الصنف','الفئة','المشعر','المبلغ','المورّد','الحالة','سجّلها']];
    buysList().forEach(function(b){
      out.push([dayKey(b.at), b.item, b.cat, b.zone || '',
                b.amt, b.sup, b.st, b.by || '']);
    });
    return out;
  },
  appr: function(){
    var out = [['النوع','التفصيل','مَن اقترح','التاريخ','الحالة','مَن قرّر','السبب']];
    coReqList().forEach(function(x){
      out.push(['شركة مقترحة', x.name, x.by || '',
                dayKey(x.at), x.status || '', x.by2 || '', x.why2 || '']);
    });
    fixList().forEach(function(x){
      out.push(['تصويب بيان', x.site + ' · ' + x.field + ': ' + (x.was || '—') + ' → ' + x.val,
                x.by || '', dayKey(x.at),
                x.status || '', x.by2 || '', x.why2 || x.why || '']);
    });
    buysList().forEach(function(b){
      if (b.st === 'معتمد' && !b.by2) return;
      out.push(['مشترًى فوق الحد', b.item + ' · ' + b.amt, b.by || '',
                dayKey(b.at), b.st || '', b.by2 || '', b.why2 || '']);
    });
    return out;
  },
  ships: function(){
    var out = [['رقم الشحنة','الصنف','العدد','المورّد','الحالة','تاريخ الشحن','الوصول المتوقَّع','وصلت','التأخّر (يوم)']];
    shipList().forEach(function(x){
      out.push([x.ref, x.item || '', x.qty || 0, x.sup || '', x.st || '',
                x.sent || '', x.eta || '', x.got || '', shipLate(x)]);
    });
    return out;
  },
  fleetLog: function(){
    var out = [['اللوحة','النوع','أُسندت إلى','العمل','من','إلى','المدة (يوم)','ملاءمة']];
    vehAsnAll().slice().sort(function(a, b){ return (b.at || 0) - (a.at || 0); })
      .forEach(function(a){
        var v = vehOf(a.veh);
        var days = Math.max(1, Math.round(((a.end || Date.now()) - (a.at || Date.now())) / 86400000));
        out.push([v ? v.plate : a.veh, v ? vehKindName(v.kind) : '', a.to,
                  ASN_LABEL[a.kind] || a.kind || '', msDay(a.at),
                  a.end ? msDay(a.end) : 'جارٍ', days,
                  (v && a.kind && !vehFits(v.kind, a.kind)) ? 'لا تناسب' : 'مناسبة']);
      });
    return out;
  },
  ips: function(){
    var out = [['رقم الشاخص / الاسم','معرّف الموقع','الموقع','المشعر','بادئة الشبكة','الراوتر','القارئ','الكاميرا']];
    (STATE.sites || []).forEach(function(x){
      if (!x.net && !x.ipRtr && !x.ipRdr && !x.ipCam) return;
      out.push([siteKey(x), x.id, x.name, x.zone, x.net || '', x.ipRtr || '', x.ipRdr || '', x.ipCam || '']);
    });
    return out;
  },
  fleet: function(){
    var out = [['اللوحة','النوع','الموديل','سنة الصنع','رقم الرخصة','انتهاء الرخصة',
                'انتهاء التأمين','الملكية','التكلفة الشهرية','من تاريخ','الحالة','مع مَن','العمل']];
    vehList().forEach(function(v){
      var a = vehAsnOf(v.id);
      out.push([v.plate, vehKindName(v.kind), v.model || '', v.year || '', v.lic || '',
                v.licExp || '', v.insExp || '', v.own || '', v.cost || 0, v.start || '',
                v.st || '', a ? a.to : '', a ? (ASN_LABEL[a.kind] || a.kind) : '']);
    });
    return out;
  },
  fleetCost: function(){
    var out = [['اللوحة','النوع','الملكية','من تاريخ','أشهر','الشهرية','التراكمي']];
    vehList().forEach(function(v){
      var mo = v.start ? Math.max(1, Math.round((Date.now() - Date.parse(v.start)) / 2592000000)) : 1;
      out.push([v.plate, vehKindName(v.kind), v.own || '', v.start || '', mo,
                +v.cost || 0, (+v.cost || 0) * mo]);
    });
    return out;
  },
  notif: function(){
    var out = [['الوقت','النوع','الأهمية','الرسالة','الموقع','إلى','أنشأه','مقروء']];
    (STATE.notifs || []).forEach(function(n){
      out.push([new Date(n.at).toISOString().slice(0,16).replace('T',' '),
                n.kind, n.lv, n.text, n.site || '', n.to || '', n.by || '',
                n.read ? 'نعم' : 'لا']);
    });
    return out;
  },

  /* سجلُّ الأحداث كما هو معروضٌ بعد التصفية — لا كلُّه: من صفّى ثم صدّر
     يريد ما صفّاه، ومن أراد الكلَّ مسح التصفية. */
  ev: function(){
    var out = [['اليوم','الوقت','النوع','الحدث','المستخدم','الجهاز']];
    (typeof evRows === 'function' ? evRows() : (STATE.events || [])).forEach(function(e){
      out.push([e.day || '', e.at || '', evKind(e.what), e.what || '', e.by || '', e.dev || '']);
    });
    return out;
  },

  users: function(){
    var out = [['اسم المستخدم','الاسم','الدور','الحالة','أُنشئ في','المعرّف']];
    var U = STATE.users || {};
    Object.keys(U).forEach(function(uid){
      var u = U[uid] || {};
      out.push([u.user || '', u.name || '', (ROLES[u.role] || {}).n || u.role || '',
                u.active === false ? 'معطل' : 'نشط', String(u.at || '').slice(0,10), uid]);
    });
    return out;
  },

  /* الاتجاهُ عبر الأيام — تقاريرُ الوزارةِ تُقرأ بالمقارنة لا باللقطة:
     رقمُ اليوم وحده لا يقول أمتقدّمون نحن أم متأخرون. */
  daily: function(){
    var H = statsHistory(90);
    var out = [['اليوم','مسحُ اليوم','تركيبُ اليوم','فكُّ اليوم','تعذُّرُ وصول',
                'تراكمُ المسح','تراكمُ التركيب','بانتظار الرفع']];
    H.forEach(function(r){
      out.push([r.day, r.daySurvey || 0, r.dayInstall || 0, r.dayDismantle || 0,
                r.dayBlocked || 0, r.surveyed || 0, r.installed || 0, r.pending || 0]);
    });
    if (H.length > 1){
      var f = H[0], l = H[H.length - 1];
      out.push(['الفرق بين أول يومٍ وآخره', '', '', '', '',
                (l.surveyed || 0) - (f.surveyed || 0),
                (l.installed || 0) - (f.installed || 0), '']);
    }
    return out;
  },

  /* المرحلةُ المفتوحةُ وحدها — كان الزرُّ يطلب «stage» ولا ورقةَ بهذا الاسم */
  stage: function(){
    var k = (typeof STAGE_TAB !== 'undefined' && STAGE_TAB) || Object.keys(STAGE_ROLES)[0];
    var out = [['المرحلة','المنفِّذ','أعمال','النقاط','المستحَق']];
    stageList(k).forEach(function(e){
      out.push([STAGE_ROLES[k].n, e.name, e.acts,
                Math.round(e.total), Math.round(e.total * cfgGet('ph'))]);
    });
    return out;
  },
  stages: function(){
    var out = [['المرحلة','أفراد','أعمال','النقاط','المستحَق']];
    Object.keys(STAGE_ROLES).forEach(function(k){
      var L = stageList(k);
      var p = L.reduce(function(a,e){ return a + e.total; }, 0);
      out.push([STAGE_ROLES[k].n, L.length,
                L.reduce(function(a,e){ return a + e.acts; }, 0),
                Math.round(p), Math.round(p * cfgGet('ph'))]);
    });
    return out;
  },
  recs: function(){
    var out = [['النقطة','الاسم','الحالة','الفني','التاريخ','ملاحظة']];
    surveyList().forEach(function(x){
      out.push([x.id, (x.site && x.site.name) || '', x.done ? 'تمت الزيارة' : (x.rec.access || 'تحتاج زيارة أخرى'),
                x.rec.by || '', x.rec.at ? dayKey(x.rec.at) : '',
                x.rec.note || x.rec.reopenNote || '']);
    });
    return out;
  },
  tasks: function(){
    var out = [['المعرّف','النقطة','النوع','الفني','الموعد','الحالة','أُسند في']];
    Object.keys(STATE.tasks).forEach(function(k){
      var x = STATE.tasks[k], K = WO_KINDS[x.kind] || { n:x.kind };
      /* تاريخٌ غائبٌ أو تالفٌ كان يُسقط التصديرَ كلَّه بـInvalid time value */
      var at = x.at ? new Date(x.at) : null;
      out.push([x.id, x.site, K.n, x.to || '', x.when || x.due || '',
                x.status || x.st || '',
                (at && isFinite(at.getTime())) ? at.toISOString().slice(0,10) : '']);
    });
    return out;
  },
  work: function(){
    var S = siteStats(), out = [['وجه العمل','النقاط','النسبة']];
    Object.keys(S.byWork).sort(function(a,b){ return S.byWork[b]-S.byWork[a]; }).forEach(function(k){
      out.push([k, S.byWork[k], Math.round(S.byWork[k]/S.total*100) + '%']);
    });
    out.push(['الإجمالي', S.total, '100%']);
    return out;
  },
  co: function(){
    var S = siteStats(), out = [['الشركة','مواقعها','تمت الزيارة','مُركّب','٪']];
    Object.keys(S.byCo).sort(function(a,b){ return S.byCo[b]-S.byCo[a]; }).forEach(function(c){
      out.push([c, S.byCo[c], 0, 0, '0%']);
    });
    return out;
  },
  items: function(){
    var out = [['المنطقة','المعرّف','القطعة','نقاط التركيب','نقاط التهيئة','نقاط التجميع','السعر']];
    itemsList().forEach(function(i){
      out.push([i.z==='cor'?'ممر':'مخيم', i.code, i.name,
                itPts(i.code), itPrep(i.code), itAsm(i.code), itPrice(i.code)]);
    });
    return out;
  },
techx: function(){
    var Tg = T(), out = [['الفني','زيارة','٪','تركيب','٪','فك','٪','الإجمالي']];
    scores().list.forEach(function(e){
      var x = [e.name, e.survey, e.install, e.dis];
      out.push([x[0], x[1], Tg.survey ? Math.round(x[1]/Tg.survey*100)+'%' : '—',
                x[2], Tg.ins ? Math.round(x[2]/Tg.ins*100)+'%' : '—',
                x[3], Tg.dis ? Math.round(x[3]/Tg.dis*100)+'%' : '—',
                x[1]+x[2]+x[3]]);
    });
    return out;
  },
  wos: function(){
    var Tg = T();
    return [['المرحلة','النوع','نقاط الشهر','تارجت الشهر','تارجت الأسبوع'],
            ['تهيئة','مخيمات',0,Tg.prepCamp,cfgWk(Tg.prepCamp)],
            ['تهيئة','ممرات',0,Tg.prepCor,cfgWk(Tg.prepCor)],
            ['تجميع','مخيمات',0,Tg.asmCamp,cfgWk(Tg.asmCamp)],
            ['تجميع','ممرات',0,Tg.asmCor,cfgWk(Tg.asmCor)],
            ['الإجمالي','',0,Tg.prep+Tg.asm,cfgWk(Tg.prep+Tg.asm)]];
  },
  crews: function(){
    var out = [['الفريق','مشرف','فنيون','معدّات','المعدل/يوم','النقاط','فرق لازمة','أفراد']];
    CREW_SPEC.forEach(function(s){
      var r = crewNeed(s, PLAN_MONTHS);
      out.push([s.n, r.sup, r.tech, r.gear, r.rate, r.units, r.crews, r.people]);
    });
    return out;
  },

  roles: function(){
    /* تُبنى من `ROLES` الحيّة لا من `ROLE_ORDER`/`PERMS` غيرِ الموجودتين —
       بقيةُ شاشة «الصلاحيات» القديمة المكرَّرة قبل حذفها. */
    var keys = Object.keys(ROLES);
    var caps = [];
    keys.forEach(function(k){
      Object.keys(ROLES[k].can || {}).forEach(function(c){ if (caps.indexOf(c) < 0) caps.push(c); });
    });
    var out = [['الدور'].concat(caps)];
    keys.forEach(function(k){
      out.push([ROLES[k].n].concat(caps.map(function(c){
        return (ROLES[k].can || {})[c] ? '✓' : '—';
      })));
    });
    return out;
  }
};

var SHEET_NAMES = {
  over:'نظرة عامة', sites:'المواقع', work:'أوجه العمل', co:'الشركات',
  score:'أداء الفنيين', stages:'أداء المراحل', recs:'المسح الميداني', tasks:'المهام', budm:'الملخّص المالي',
  evm:'القيمة المكتسبة', risks:'سجل المخاطر', hse:'السلامة', ncr:'عدم المطابقة',
  ipc:'المستخلصات', miles:'المعالم', raci:'المسؤوليات', less:'الدروس',
  sop:'دليل العمليات', reps:'كتالوج التقارير', qa:'التدقيق الهندسي', items:'القطع والأسعار',
  invb:'أرصدة المخزون', invmv:'دفتر الحركة', buys:'المشتريات',
  wos:'المستودع', crews:'الطواقم',
  ev:'سجل الأحداث', perms:'الصلاحيات'
};

