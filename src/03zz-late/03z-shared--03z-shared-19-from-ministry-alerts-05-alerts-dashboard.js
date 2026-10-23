/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-19-from-ministry-alerts-05-alerts-dashboard.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-19-from-ministry-alerts-05-alerts-dashboard.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : alRuleDays, alRuleList, alAll, alCard, svListSites, svListRows, svListCount, svObKey, svListRows0, svListHead, svListTitle, svListPop, svDashCols, svBaseOf, svZoneTot, svDashHtml, svPrimWhy, svStOf, svRing, svSubPass, svSubLabel, svSubUnit, svSubTitle, svPopFilter, svDashHtml0, svPhoPanel, mfuFltLabel
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function alRuleDays(k){ var d = +cfgGet(k) || 0; return d > 0 ? d : 0; }

function alRuleList(rule){
  var d = alRuleDays(rule[1]); if (!d) return [];
  return svListSites().filter(function(x){ try { return rule[3](x, STATE.recs[x.id], d); } catch (e){ return false; } });
}

function alAll(){   /* (V33.7) مرةً في الرسمة — الملخّصُ التنفيذيُّ وبطاقةُ التنبيهات كانا يمرّان على القواعد كلٌّ وحدَه */
  var mk = AL_RULES.map(function(r){ return alRuleDays(r[1]); }).join(','); if (DB.memo && DB.memo.al && DB.memo.al.k === mk) return DB.memo.al.v;
  var v = AL_RULES.map(function(rule){ var d = alRuleDays(rule[1]); return { k:rule[0], cfg:rule[1], label:t(rule[2]) + ' ' + nm(d) + ' ' + t('يوم'), days:d, sites:d ? alRuleList(rule) : [], off:!d }; });
  if (DB.memo) DB.memo.al = { k:mk, v:v }; return v; }

function alCard(){
  /* (V33.0) قرارُ المالك: لا «تصريح» في عرض الوزارة — قاعدةُ التصريح المعلّق تبقى للمكتب ولا تظهر هنا */
  var A = alAll().filter(function(a){ return !(CUR === 'mfu' && a.k === 'al_permit'); }), tot = A.reduce(function(a, b){ return a + b.sites.length; }, 0);
  return card('\u{1F6A8} ' + t('تنبيهات القواعد') + ' \u2014 ' + nm(tot),   /* (V30.6) */
    (may('settings') ? '<p class="hint" style="margin:0 0 6px">' + esc(t('تُضبَط أيامُها من ثوابت النظام')) + '</p>' : '') + '<div class="mfu-kpis">' + A.map(function(a){ return '<div class="mfu-kpi"' + (a.off ? '' : ' data-svlist="' + a.k + '" role="button" tabindex="0" style="cursor:pointer" title="' + esc(t('اضغط للقائمة والتصدير')) + '"') + '><div class="mfu-kpi-l">' + esc(a.label) + (a.off ? '' : ' \u203A') + '</div><div class="mfu-kpi-v"' + (a.sites.length ? ' style="color:#C0392B"' : '') + '>' + (a.off ? '<span class="hint">' + esc(t('معطَّلة')) + '</span>' : nm(a.sites.length)) + '</div></div>'; }).join('') + '</div>');
}

function svListSites(){   /* (V29.9) على صفحة الوزارة تتبع القوائمُ فلترَ المشعر والنوع */
  var all = STATE.sites || []; if (CUR !== 'mfu' || !(MFU.flt.z || MFU.flt.t)) return all;
  return all.filter(function(x){ var tx = taxOf(x); return (!MFU.flt.z || tx.g === MFU.flt.z) && (!MFU.flt.t || tx.t === MFU.flt.t); });
}

function svListRows(key){   /* (V31.6) القائمةُ تُحسَب مرةً في المهمة الواحدة — بطاقاتُ الملخّص وحدَها كانت تمرّ على النقاط عشرَ مرات */
  var mk = key + '|' + CUR + '|' + (MFU.flt.z || '') + '|' + (MFU.flt.t || '') + (/^al_/.test(key) ? '|' + AL_RULES.map(function(r){ return alRuleDays(r[1]); }).join(',') : ''), LM = DB.memo ? DB.memo.lists : null;   /* أيامُ القواعد في المفتاح: تغييرُها في المهمة نفسِها لا يُرجِع قائمةً قديمة */
  if (LM && LM[mk]) return LM[mk].slice();
  var res = svListRows0(key); if (LM) LM[mk] = res;
  return res.slice();
}

/* (V33.7) العددُ بلا بناء الصفوف: بطاقاتُ الملخّص كانت تبني ثلاثَ قوائمَ كاملةٍ (تواريخُ وترجمةٌ لكلِّ نقطة) لتعدّها فقط */
function svListCount(key){
  if (!SV_LISTS[key]) return svListRows(key).length;
  var LM = DB.memo ? DB.memo.lists : null, mk = '#' + key + '|' + CUR + '|' + (MFU.flt.z || '') + '|' + (MFU.flt.t || '');
  if (LM && LM[mk] != null) return LM[mk];
  var f = SV_LISTS[key][1], n = 0; svListSites().forEach(function(x){ if (f(x, STATE.recs[x.id])) n++; });
  if (LM) LM[mk] = n; return n;
}

/* (V33.3) بطاقاتُ القاعة: قائمةُ نوعٍ بعينه بدون عوائق أو بعوائق — المفتاحُ obok|<النوع> أو obbad|<النوع> */
function svObKey(key){ var m = /^(obok|obbad)\|(.+)$/.exec(String(key || '')); return m ? { bad:m[1] === 'obbad', ty:m[2] } : null; }

function svListRows0(key){
  if (MFU.lists[key]) return MFU.lists[key].rows();
  var OK = svObKey(key);
  if (OK) return svListRows0(OK.bad ? 'chal' : 'clean').filter(function(row){ var x = siteFind(row[0]); return x && taxOf(x).t === OK.ty; });
  var L = SV_LISTS[key] || svDynList(key);   /* (V37.4) */
  if (!L && /^al_/.test(key)){ var rule = AL_RULES.filter(function(r){ return r[0] === key; })[0]; if (!rule) return [];   /* (V30.1) قوائمُ قواعد التنبيه */
    var ids = {}; alRuleList(rule).forEach(function(x){ ids[x.id] = 1; }); L = [t(rule[2]) + ' ' + nm(alRuleDays(rule[1])) + ' ' + t('يوم'), function(x){ return !!ids[x.id]; }]; }
  if (!L) return [];
  return svListSites().filter(function(x){ return L[1](x, STATE.recs[x.id]); }).map(function(x){
    var r = STATE.recs[x.id], c = taxOf(x);
    return [x.id, String(x.name || ''), t(c.g), t(c.t), String(x.co || ''), r && r.at ? dayKey(+r.at) : '', r ? (r.by || '') : '',
            key === 'badphoto' ? photosOf(x.id).filter(function(e){ return photoQualityFlags(e[1].q).length; }).map(function(e){ return (e[1].kind || '') + ': ' + photoQualityFlags(e[1].q).map(function(f){ return t(f); }).join('/'); }).join('، ') :
            (key === 'campins' || key === 'corins') ? (mfuInstalled(x) ? t('مُركّب') : t((STATE.inss[x.id] || {}).status || 'لم يبدأ')) :
            key === 'obs' ? (mfuObsMap()[x.id] || []).join('، ') :
            key === 'nophoto' ? t(svPhotoState(x, r)) : svStateText(r)];   /* (V37.3) الحالةُ وسببُها أو الفئاتُ الواضحة */
  });
}

function svListHead(key){ if (MFU.lists[key]) return MFU.lists[key].head; return ['النقطة', 'الاسم', 'المشعر', 'النوع', 'الشركة', 'آخر زيارة', 'بواسطة', key === 'nophoto' || key === 'al_nophoto' || key === 'badphoto' ? 'الصور' : (key === 'campins' || key === 'corins') ? 'التركيب' : key === 'obs' ? 'المعوّقات' : 'الحالة — سبب عدم المسح أو التحديات']; }

function svListTitle(key){ if (MFU.lists[key]) return t(MFU.lists[key].title); var OK = svObKey(key); if (OK) return t((TAX_DEF[OK.ty] || { l:OK.ty }).l) + ' \u2014 ' + t(OK.bad ? 'بعوائق' : 'بدون عوائق'); if (SV_LISTS[key]) return t(SV_LISTS[key][0]); var DL = svDynList(key); if (DL) return t(DL[0]); var rule = AL_RULES.filter(function(r){ return r[0] === key; })[0]; return rule ? t(rule[2]) + ' ' + nm(alRuleDays(rule[1])) + ' ' + t('يوم') : key; }

/* (V30.1) */
function svListPop(){
  if (!SV_POP || !(SV_LISTS[SV_POP] || svDynList(SV_POP) || MFU.lists[SV_POP] || svObKey(SV_POP) || /^al_/.test(SV_POP))) return '';
  var rowsAll = svListRows(SV_POP), head = svListHead(SV_POP), dcz = svDashCols(head);
  var zonesAll = []; if (dcz.zone > -1){ var zm = {}; rowsAll.forEach(function(r){ zm[String(r[dcz.zone] || '')] = 1; }); zonesAll = Object.keys(zm).filter(Boolean); }
  var rows = svPopFilter(rowsAll, head);   /* (V37.45 المشعر · V37.58 والمربعُ المضغوط) — المرشّحُ نفسُه في الإكسل */
  var shown = rows.slice(0, SV_SHOW);   /* (V37.27 المرحلةُ ٢) دفعاتٌ من ٨٠ — كانت ٣٠٠ صفٍّ دفعةً واحدة */
  var dc0 = svDashCols(head), canDash = dc0.zone > -1 || dc0.type > -1 || dc0.comp > -1;   /* (V37.41) طلبُ المالك: كلُّ نوافذ متابعة الوزارة لوحة */
  var asDash = canDash && SV_VIEW !== 'list';
  var PCN = {}, PP = STATE.photos || {}; Object.keys(PP).forEach(function(k){ var x = PP[k]; if (x && !x.del && x.site && !/^ins|^dis/.test(String(x.kind || ''))) PCN[x.site] = (PCN[x.site] || 0) + 1; });   /* (V38.75) the visit's photos */   /* (V37.14) فهرسٌ مرةً للنافذة */
  return '<div class="svpop-veil" data-svpopclose="1" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000"></div>'
    + '<div class="svpop" role="dialog" aria-modal="true" data-keepscroll="svpop:' + esc(SV_POP) + '" style="position:fixed;z-index:2001;inset:6vh 4vw auto 4vw;max-height:86vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.35)">'   /* (V30.6) ألوانُ التطبيق لا بياضٌ ثابت */
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0">' + (SV_SUB ? svSubTitle(rows) : esc(svListTitle(SV_POP)) + ' \u2014 ' + nm(rows.length)) + (SV_ZF && !SV_SUB ? ' <small class="hint" style="margin:0">' + [SV_ZF ? esc(t(SV_ZF)) : '', SV_SUB ? esc(t(svSubLabel())) : ''].filter(Boolean).join(' \u00b7 ') + ' \u00b7 ' + nm(rowsAll.length) + ' ' + esc(t('في الكل')) + '</small>' : '') + '</h3>'
    + '<div class="actions" style="margin:0">' + btn('\u2B07 ' + t('تصدير إكسل — التفاصيل'), 'btn-primary btn-sm', ' data-svpopxls="' + esc(SV_POP) + '"')
      + (canDash ? btn(asDash ? '\u2630 ' + t('القائمة') : '\u{1F4CA} ' + t('اللوحة'), 'btn-quiet btn-sm', ' data-svview="' + (asDash ? 'list' : 'dash') + '"') : '')
      + (canDash && asDash ? btn('\u{1F5A8} ' + t('طباعة اللوحة'), 'btn-quiet btn-sm', ' data-svprint="1"') : '')   /* (V37.45) */
      + btn('\u2715 ' + t('إغلاق'), 'btn-quiet btn-sm', ' data-svpopclose="1"') + '</div></div>'
    + (SV_STACK.length ? '<div class="actions" style="margin:8px 0 0">' + btn('\u2192 ' + t('رجوع'), 'btn-secondary', ' data-svback="1" title="' + esc(t('للشاشة السابقة')) + '"') + '</div>' : '')   /* (V37.59) رجوعٌ حقيقيٌّ للشاشة السابقة */
    + (zonesAll.length > 1 ? '<div class="chips" style="margin:8px 0 0">' + [['', 'كل المشاعر']].concat(zonesAll.map(function(z){ return [z, z]; })).map(function(z){ return '<button type="button" class="chip' + (SV_ZF === z[0] ? ' on' : '') + '" data-svzf="' + esc(z[0]) + '">' + esc(t(z[1])) + '</button>'; }).join('') + '</div>' : '')
    + (SV_POP === 'nophoto' ? '<p class="hint" style="margin:6px 0">' + esc(t('وجِّه الشبابَ لهذه النقاط لإضافة الصور من «تعديل المسح» — «التُقطت ولم تُرفع» تعني أن الصور على جهاز صاحب الزيارة: يفتح التطبيقَ على الشبكة.')) + '</p>' : '')
    /* (V37.6) طلبُ المالك: «عاوز هنا الصور — أقدر أفتح صور المخيم ده في كل التحديات وأسباب عدم المسح». عمودُ «الصور» في النافذة وحدَها (لا في الإكسل) */
    + (asDash && rows.length ? svDashHtml(SV_POP, rows, head) : '')
    + (!asDash && rows.length ? table(head.map(function(h){ return h; }).concat([t('الصور')]), shown.map(function(r){ var sx = siteFind(r[0]), pn = PCN[r[0]] || ((STATE.recs[r[0]] || {}).photos || []).length;   /* (V37.7 → V37.14: من الفهرس) */
        /* (V38.75) the name opens the point on the map too */
        return [ sx ? siteIdHtml(sx) : '<span class="num">' + esc(r[0]) + '</span>' ].concat(r.slice(1).map(function(c, ci){ return ci === 0 && sx && c ? '<span data-fly="' + esc(sx.id) + '" role="link" style="cursor:pointer">' + esc(c) + '</span>' : esc(c || '\u2014'); }))
          .concat([pn ? '<button type="button" class="btn btn-secondary btn-sm" data-svphotos="' + esc(r[0]) + '">\u{1F4F7} ' + nm(pn) + '</button>' : '<span class="hint" style="margin:0">' + esc(t('لا صور')) + '</span>']); }))
                   + (rows.length > shown.length ? '<div class="actions" style="justify-content:center;margin:10px 0">' + btn('\u2193 ' + t('عرض المزيد') + ' (' + nm(Math.min(80, rows.length - shown.length)) + ' ' + t('من') + ' ' + nm(rows.length - shown.length) + ')', 'btn-secondary btn-sm', ' data-svmore="1"') + '</div><p class="hint" style="text-align:center">' + esc(t('والكلُّ في ملف الإكسل')) + '</p>' : '')   /* (V37.27) */
                   : (asDash ? '' : '<p class="hint">' + esc(t('لا نقاط')) + '</p>'))   /* (V37.58) كانت تظهر تحت اللوحة */
    + '</div>'
    + (SV_PHO ? svPhoPanel(SV_PHO) : '');
}

function svDashCols(head){   /* (V37.41) الأعمدةُ بأسمائها لا بمواضعها — فتعمل اللوحةُ على كلِّ قائمةٍ في صفحة الوزارة */
  var H = (head || []).map(function(h){ return String(h || ''); }), f = function(rx){ for (var i = 0; i < H.length; i++) if (rx.test(H[i])) return i; return -1; };
  var st = H.length - 1; if (/^الصور$|^التركيب$/.test(H[st] || '')) st = -1;
  var sn = st > -1 ? H[st] : ''; if (/^الحالة/.test(sn)) sn = 'الحالة والتحديات';   /* عنوانٌ قصيرٌ لا رأسُ العمود الطويل */
  return { zone:f(/المشعر/), type:f(/^النوع/), comp:f(/الشركة/), date:f(/آخر زيارة|التاريخ|تاريخ|آخر/), by:f(/بواسطة|المنفّذ|المنفذ|الفني|الفريق/), state:st, stateName:sn };
}

function svBaseOf(key){   /* قاعدةُ النسبة: قوائمُ الزيارة والمتبقي من كلِّ النقاط، وما سواها من المزار */
  var all = STATE.sites || []; if (/^(sv|rem)$/.test(key)) return { n:all.length, name:'كلِّ النقاط', zones:svZoneTot(all) };
  var vis = all.filter(function(x){ return svVisited(STATE.recs[x.id]); }); return { n:vis.length, name:'المزار', zones:svZoneTot(vis) };
}

function svZoneTot(L){ var m = {}; L.forEach(function(x){ m[x.zone] = (m[x.zone] || 0) + 1; }); return m; }

/* (V37.56) svInsight (جملةُ الخلاصة الطويلة) حُذفت بقرار المالك — اللوحةُ تُقرأ بالنظر */
function svDashHtml(key, rows, head){
  var ck = key + '|' + rows.length + '|' + (typeof STAT_VER !== 'undefined' ? STAT_VER : 0) + '|' + (typeof SV_ZF !== 'undefined' ? SV_ZF : '') + '|' + (typeof SV_SUB !== 'undefined' ? SV_SUB : '') + '|' + LANG;   /* (V37.45) تُحفَظ اللوحةُ: الفتحُ الثاني فوريّ */
  if (svDashHtml.ck === ck && svDashHtml.html) return svDashHtml.html;
  var html = svDashHtml0(key, rows, head); svDashHtml.ck = ck; svDashHtml.html = html; return html;
}

function svPrimWhy(rec){
  if (!rec || !svDone(rec)) return -1; var cc = chalCats(rec); if (!cc.length) return -1;
  for (var q = 0; q < SV_WHY_ORDER.length; q++){ var w = SV_WHY[SV_WHY_ORDER[q]]; if (w.ks.some(function(k){ return cc.indexOf(k) > -1; })) return SV_WHY_ORDER[q]; }
  return 5;
}

function svStOf(id){
  if (typeof insDone === 'function' && insDone(id)) return 'ins';
  if (typeof taskKindOf === 'function' && taskKindOf(id, 'install')) return 'sched';   /* (V37.62) */
  var r = STATE.recs[id]; if (!r || !svVisited(r)) return 'todo'; if (!svDone(r)) return 'again';
  var pw = svPrimWhy(r); if (pw < 0) return 'ready'; return pw === 3 ? 'coord' : 'prep';
}

function svRing(p, size, color, label){
  var deg = Math.max(0, Math.min(100, p)), inner = Math.round(size * 0.76);
  return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:conic-gradient(' + color + ' 0 ' + deg + '%,var(--line) 0);display:flex;align-items:center;justify-content:center;flex:0 0 auto">'
    + '<i style="width:' + inner + 'px;height:' + inner + 'px;border-radius:50%;background:var(--surface,#141B2A);display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:800;font-size:' + Math.round(size / 4.6) + 'px">' + label + '</i></div>';
}

/* (V37.58) المربعُ المضغوطُ داخل النافذة: «st:ready» أو «why:0» */
function svSubPass(id){
  if (!SV_SUB) return true; var p = SV_SUB.split(':');
  if (p[0] === 'st') return svStOf(id) === p[1];
  if (p[0] === 'why') return svStOf(id) !== 'ins' && svPrimWhy(STATE.recs[id]) === +p[1];   /* (V37.59) بالسبب الرئيس — كلُّ نقطةٍ في مربعٍ واحد */
  var x = siteFind(id);   /* (V37.62) مرشّحاتُ التبويبات الخمسة */
  if (p[0] === 'type') return !!x && taxOf(x).t === p[1];
  if (p[0] === 'neww') return mtGrpOf(id) === p[1] && mtNewWeek(id);   /* (V37.65) */
  if (p[0] === 'life') return !!x && lifeOf(x) === p[1];
  if (p[0] === 'co') return !!x && x.co === SV_SUB.slice(3);
  if (p[0] === 'cob'){ if (!x || x.type !== 'مخيم' || !x.co) return false; var cb = mtCoStats().filter(function(o){ return o.co === x.co; })[0]; return !!cb && cb.b === p[1]; }
  if (p[0] === 'grp') return p[1] === 'all' ? /^(prep|coord)$/.test(svStOf(id)) : mtGrpOf(id) === p[1];
  if (p[0] === 'day'){ var dk = p[1], kd = p[2] || ''; return (STATE.steps || []).some(function(st){ return mtStepSite(st) === id && dayKey(+st.at || 0) === dk && (!kd || st.kind === kd); }); }
  return true;
}

function svSubLabel(){ if (!SV_SUB) return ''; var p = SV_SUB.split(':');
  if (p[0] === 'st'){ var o = SV_ST.filter(function(x){ return x.k === p[1]; })[0]; return o ? o.n : ''; }
  if (p[0] === 'neww') return 'تحتاج تنسيق مع الجهة المالكة — جديدة هذا الأسبوع';
  if (p[0] === 'life') return p[1] === 'minwait' ? 'جاهزة لاعتماد الوزارة' : ((LIFE[p[1]] || {}).n || p[1]);
  if (p[0] === 'type') return (TAX_DEF[p[1]] || { l:p[1] }).l; if (p[0] === 'co') return SV_SUB.slice(3);
  if (p[0] === 'cob'){ var b = MT_COB.filter(function(x){ return x.k === p[1]; })[0]; return b ? t('شركات') + ' — ' + t(b.n) : ''; }
  if (p[0] === 'grp'){ if (p[1] === 'all') return t('عليها تحدي'); var g = MT_GRP.filter(function(x){ return x.k === p[1]; })[0]; return g ? g.n : ''; }
  if (p[0] === 'day'){ var dd = new Date(p[1] + 'T12:00:00'), WDN = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']; return t(WDN[dd.getDay()]) + ' ' + nm(dd.getDate()) + '/' + nm(dd.getMonth() + 1) + (p[2] ? ' \u00b7 ' + t(({ visit:'زيارة', ins:'تركيب', dis:'فك' })[p[2]] || p[2]) : ''); }   /* (V37.62) اليومُ باسمه وتاريخه بالعربية */
  var w = SV_WHY[+p[1]]; return w ? w.n : ''; }

function svSubUnit(){ return /^(co|cob):/.test(SV_SUB) ? 'مخيم' : 'نقطة'; }

function svSubTitle(rows){
  var p = SV_SUB.split(':'), n = rows.length, lab = svSubLabel(), extra = '';
  if (p[0] === 'cob'){ lab = SV_COB_T[p[1]] || lab; var nc = mtCoStats().filter(function(o){ return o.b === p[1]; }).length; extra = ' ' + esc(t('في')) + ' ' + nm(nc) + ' ' + esc(t('شركة')); }
  if (p[0] === 'co') lab = t('مخيمات') + ' ' + SV_SUB.slice(3);
  if (p[0] === 'day') lab = t('شغل') + ' ' + lab;
  return esc(t(lab)) + ' \u2014 ' + nm(n) + ' ' + esc(t(svSubUnit())) + extra + (SV_ZF ? ' <small class="hint" style="margin:0">' + esc(t(SV_ZF)) + '</small>' : '');
}

function svPopFilter(rowsAll, head){
  var dcz = svDashCols(head);
  return rowsAll.filter(function(r){ return (!SV_ZF || dcz.zone < 0 || String(r[dcz.zone] || '') === SV_ZF) && svSubPass(r[0]); });
}

function svDashHtml0(key, rows, head){
  var C = svDashCols(head || svListHead(key)), n = rows.length, base = svBaseOf(key), sub = !!SV_SUB;
  var tile = 'background:var(--surface-2);border-radius:14px;padding:12px';
  var stc = {}, wc = {}, multi = 0;
  rows.forEach(function(r){ var k = svStOf(r[0]); stc[k] = (stc[k] || 0) + 1;
    if (k === 'prep' || k === 'coord'){ var rec = STATE.recs[r[0]], pw = svPrimWhy(rec); if (pw > -1 && pw !== 3){ wc[pw] = (wc[pw] || 0) + 1; var cc = chalCats(rec), kinds = SV_WHY.filter(function(w){ return w.ks.some(function(x){ return cc.indexOf(x) > -1; }); }).length; if (kinds > 1) multi++; } } });
  /* ١ · العنوان: في اللوحة الأمّ حلقةٌ بالنسبة، وداخلَ مربعٍ جملةٌ واحدةٌ بلا حلقةٍ ولا نسبة */
  var prog = /^(sv|srv|insd|hand|disd)$/.test(key), pct = Math.round(n / Math.max(1, base.n) * 100);
  var ringC = prog ? (pct >= 90 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444') : 'var(--acc,#2E86DE)';
  var hero = sub
    ? '<div style="' + tile + ';margin:10px 0;display:flex;align-items:center;gap:12px"><span style="font-size:30px">' + ((SV_ST.filter(function(o){ return 'st:' + o.k === SV_SUB; })[0] || {}).e || (SV_WHY[+String(SV_SUB).split(':')[1]] || {}).e || '\u25CF') + '</span><div><div class="num" style="font-size:30px;font-weight:800;line-height:1.1">' + nm(n) + '</div><div style="font-size:15px">' + esc(t(svSubUnit())) + ' \u2014 ' + esc(t(/^cob:/.test(SV_SUB) ? (SV_COB_T[SV_SUB.slice(4)] || svSubLabel()) : /^co:/.test(SV_SUB) ? t('مخيمات') + ' ' + SV_SUB.slice(3) : svSubLabel())) + '</div></div></div>'
    : '<div style="display:flex;align-items:center;gap:16px;' + tile + ';margin:10px 0">' + svRing(pct, 108, ringC, nm(pct) + '\u066A') + '<div><div class="num" style="font-size:34px;font-weight:800;line-height:1.1">' + nm(n) + '</div><div class="hint" style="margin:2px 0 0;font-size:14px">' + esc(t('نقطة')) + ' \u00b7 ' + esc(t('من')) + ' ' + nm(base.n) + '</div></div></div>';
  /* ٢ · حالُها الآن: كلُّ نقطةٍ مرةً واحدة — يختفي إن كانت كلُّها لونًا واحدًا */
  var sts = SV_ST.filter(function(o){ return stc[o.k]; });
  var stSec = sts.length > 1 ? '<div class="hint" style="margin:4px 0 6px;font-size:14px">' + esc(t('حالها الآن')) + '</div>'
    + '<div style="display:flex;height:22px;border-radius:12px;overflow:hidden;margin:4px 0 10px">' + sts.map(function(o){ return '<i title="' + esc(t(o.n)) + '" style="display:block;width:' + (stc[o.k] / n * 100).toFixed(2) + '%;background:' + o.c + '"></i>'; }).join('') + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px">' + sts.map(function(o){
        return '<div role="button" tabindex="0" data-svsub="st:' + o.k + '" title="' + esc(t('اضغط للتفاصيل والإكسل')) + '" style="' + tile + ';display:flex;align-items:center;gap:10px;cursor:pointer"><span style="width:14px;height:14px;border-radius:50%;background:' + o.c + ';flex:0 0 auto"></span><div><div class="num" style="font-size:22px;font-weight:800">' + nm(stc[o.k]) + '</div><div style="font-size:13px">' + o.e + ' ' + esc(t(o.n)) + ' \u203A</div>' + (o.k === 'coord' ? '<div class="hint" style="margin:0;font-size:11px">' + esc(t('عائق في الموقع')) + '</div>' : '') + '</div></div>'; }).join('') + '</div>' : '';
  /* ٣ · «تحتاج تجهيز — ليه؟»: بالسبب الرئيس فمجموعُها = البرتقالي بالضبط */
  var why = Object.keys(wc).map(Number).sort(function(a, b){ return wc[b] - wc[a]; }), prepN = why.reduce(function(a, wi){ return a + wc[wi]; }, 0);
  var whySec = why.length && !(sub && /^why:/.test(SV_SUB)) ? '<div class="hint" style="margin:4px 0 6px;font-size:14px">' + esc(t('تحتاج تجهيز — ليه؟')) + ' <span class="num">(' + nm(prepN) + ')</span></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:6px">'
    + why.map(function(wi){ var w = SV_WHY[wi]; return '<div role="button" tabindex="0" data-svsub="why:' + wi + '" title="' + esc(t('اضغط للتفاصيل والإكسل')) + '" style="' + tile + ';text-align:center;padding:10px 6px;cursor:pointer"><div style="font-size:24px">' + w.e + '</div><div class="num" style="font-size:18px;font-weight:800;margin-top:2px">' + nm(wc[wi]) + '</div><div style="font-size:12px">' + esc(t(w.n)) + ' \u203A</div></div>'; }).join('') + '</div>'
    + (multi ? '<p class="hint" style="margin:0 0 12px;font-size:12px">' + esc(t('كلُّ نقطةٍ محسوبةٌ مرةً بأهمِّ تحدٍّ فيها — و')) + nm(multi) + ' ' + esc(t('منها فيها تحدٍّ آخر كمان')) + '</p>' : '<div style="margin-bottom:12px"></div>') : '';
  /* ٤ · المشاعر: حلقاتٌ في اللوحة الأمّ، وأعدادٌ فقط داخلَ المربع */
  var zc = {}; if (C.zone > -1) rows.forEach(function(r){ var z = String(r[C.zone] || ''); if (z) zc[z] = (zc[z] || 0) + 1; });
  var zks = Object.keys(zc).sort(function(a, b){ return zc[b] - zc[a]; });
  var zoneSec = zks.length > 1 && !SV_ZF ? '<div class="hint" style="margin:4px 0 6px;font-size:14px">' + esc(t('المشاعر')) + '</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin-bottom:12px">'
    + zks.map(function(z){ var of = (base.zones || {})[z] || zc[z], zp = Math.round(zc[z] / Math.max(1, of) * 100);
      return '<div role="button" tabindex="0" data-svzf="' + esc(z) + '" style="' + tile + ';text-align:center;cursor:pointer" title="' + esc(t('اضغط لعرض هذا المشعر وحده')) + '">'
        + (sub ? '<div class="num" style="font-size:20px;font-weight:800">' + nm(zc[z]) + '</div>' : '<div style="display:flex;justify-content:center;margin-bottom:6px">' + svRing(zp, 56, prog ? (zp >= 90 ? '#22C55E' : zp >= 50 ? '#F59E0B' : '#EF4444') : 'var(--acc,#2E86DE)', nm(zp) + '\u066A') + '</div>')
        + '<div style="font-size:13px">' + esc(t(z)) + ' \u203A</div>' + (sub ? '' : '<div class="hint num" style="margin:0;font-size:12px">' + nm(zc[z]) + '</div>') + '</div>'; }).join('') + '</div>' : '';
  return hero + stSec + whySec + zoneSec
    + '<button type="button" class="btn btn-primary" data-svpopxls="1" style="display:block;width:100%;margin-top:12px">\u2B07 ' + esc(t('نزّل التفاصيل (إكسل)')) + '</button>';
}

function svPhoPanel(id){ var px = siteFind(id);
        return '<div id="svPhoVeil" data-svphoclose="1" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2002"></div>'
          + '<div id="svPhoBox" class="svpop" role="dialog" aria-modal="true" data-keepscroll="svpho" style="position:fixed;z-index:2003;inset:4vh 3vw auto 3vw;max-height:92vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.45)">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">\u{1F4F7} ' + (px ? siteIdHtml(px) + ' <span class="hint" style="margin:0">' + esc(px.name || '') + '</span>' : esc(id)) + '</h3>'
          + btn('\u2715 ' + t('رجوع للقائمة'), 'btn-quiet btn-sm', ' data-svphoclose="1"') + '</div>'
          + (px && STATE.recs[px.id] ? '<p class="hint" style="margin:6px 0 0">' + esc(svStateText(STATE.recs[px.id])) + '</p>' : '')
          + (photosOf(id).length ? '' : '<p class="hint">' + esc(photosMissingLine(id, STATE.recs[id])) + '</p>') + photoGalleryHtml(id) + '</div>'; }

/* (V27.3) بلاغُ المالك: التصديرُ من صفحة التحديات والمعوقات لم يكن يتبع الفلتر — التحديثُ الأسبوعيُّ (إكسل/وورد/بوربوينت/PDF)
   كان يقرأ المعوقاتِ كلَّها. صار يقرأ المرشَّحَ حين يُوضَع فلتر، ويكتب الفلترَ في سطر التاريخ واسم الملف والبطاقة؛ وبلا فلتر: الكلّ. */
function mfuFltLabel(){ return [MFU.flt.z || '', MFU.flt.t || ''].filter(Boolean).join(' \u00b7 '); }
