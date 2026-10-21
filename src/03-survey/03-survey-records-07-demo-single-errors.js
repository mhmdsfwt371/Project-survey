/* ============================================================================
   FILE    : src/03-survey/03-survey-records-07-demo-single-errors.js
   DOMAIN  : Survey & installation — forms, points, assignment, plan
   PURPOSE : Demo-point kits, single-point form, production error capture, events carrying their point and actor.
   DEFINES : insPrefill47, ex47SiteCard, demoTag, insRevs, insRevSnap, partsDiff, demoRevsHtml, demoStdSave, insKind, insRevPhotoN, insPhotoBtn, insPhotoAdd, insSave, formGo … (+7 more)
   GLOBALS : SV_COPY_KEYS, ERR_SEEN
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ (V37.78) تجهيزاتُ نقطة الديمو ═══
   نقطةُ التجربة تُركَّب ثم تتغيّر: جهازٌ آخر، حساسٌ يُضاف، طريقةُ تثبيتٍ مختلفة — حتى يُتّفَق
   على القياسيّ. كان كلُّ حفظٍ يمحو ما قبله فيضيع تاريخُ ما جُرِّب. صار التركيبُ على نقطة الديمو
   يحفظ ما قبله «تجهيزةً» سابقة بقطعها وسيريالاتها ونقاطها ومنفّذها، ويُستهلَك من المخزن الفرقُ
   الزائدُ وحدَه لا العُدّةُ كلُّها من جديد. ويُعتمَد الأخيرُ قياسيًّا نمطًا يُطبَّق على النقاط كلِّها. */
/* (V37.90) تعبئةُ نموذج التركيب من بيانات ١٤٤٧ — مرةً لكلِّ نقطة، وفي الخانات الفارغة وحدَها:
   سيريالُ القارئ والراوتر والكاميرا على قطعها، وبادئةُ الشبكة. يراجعها الفنيُّ على الأجهزة. */
function insPrefill47(s, parts){
  var e = s && s.ex47; if (!e) return '';
  if (FORM._pre47 === s.id) return FORM._pre47msg || '';
  FORM._pre47 = s.id; FORM._pre47msg = '';
  if (STATE.inss[s.id] && STATE.inss[s.id].status && STATE.inss[s.id].status !== 'مسودّة') return '';   /* مركَّبةٌ قبلُ: لا تُعبَّأ فوقها */
  var did = [];
  var put = function(re, v, lbl){
    if (!v) return;
    var it = (parts || []).filter(function(i){ return re.test(i.code) || re.test(i.name || ''); })[0];
    if (!it || FORM.serials[it.code]) return;
    FORM.serials[it.code] = v; did.push(t(lbl));
  };
  put(/^rdr|قارئ/i, e.rdr, 'القارئ'); put(/راوتر|router|rtr/i, e.rtr, 'الراوتر'); put(/كاميرا|^cam/i, e.cam, 'الكاميرا');
  if (!FORM.prefix && (e.net || siteNetBase(s))){ FORM.prefix = e.net || siteNetBase(s); did.push(t('الشبكة')); }
  FORM._pre47msg = did.join('، ');
  return FORM._pre47msg;
}
/* بطاقةُ أجهزة ١٤٤٧ في صفحة النقطة */
function ex47SiteCard(x){
  var e = x && x.ex47; if (!e) return '';
  var r = function(k, v){ return v ? '<div><span class="k">' + esc(t(k)) + '</span><span dir="ltr" class="num">' + esc(v) + '</span></div>' : ''; };
  var nb = siteNetBase(x), diff = e.net && nb && e.net !== nb;
  return card('أجهزة موسم ١٤٤٧',
    '<div class="pop-rows" style="margin:0">'
    + r('الاسم في الملف', e.nm) + r('سيريال القارئ', e.rdr) + r('سيريال الراوتر', e.rtr) + r('سيريال الكاميرا', e.cam)
    + r('الشبكة', e.net ? e.net + '.0/24' : '')
    + (e.ready ? '<div><span class="k">' + esc(t('الجاهزية')) + '</span><span>' + esc(e.ready) + '</span></div>' : '')
    + (e.crane ? '<div><span class="k">' + esc(t('يحتاج رافعة')) + '</span><span>' + esc(t(/^(y|yes|نعم)/i.test(e.crane) ? 'نعم' : 'لا')) + '</span></div>' : '')
    + (e.eng ? '<div><span class="k">' + esc(t('المهندس')) + '</span><span>' + esc(e.eng) + '</span></div>' : '')
    + r('التاريخ', e.at)
    + '</div>'
    + (diff ? alertBox('warn', t('شبكةُ الملف') + ' ' + e.net + ' ' + t('تختلف عن شبكة النقطة') + ' ' + nb) : ''));
}
function demoTag(x){ return (x && x.pilot) ? ' ' + pill('\u{1F9EA} ' + t('ديمو'), 'warn') : ''; }
function insRevs(ins){ return (ins && Array.isArray(ins.revs)) ? ins.revs : []; }
function insRevSnap(ins){
  return { at:+ins.at || 0, by:ins.by || '', status:ins.status || '', parts:Object.assign({}, ins.parts || {}),
           serials:Object.assign({}, ins.serials || {}), pts:cfgN(ins.pts), approved:!!ins.approved };
}
function partsDiff(a, b){
  a = a || {}; b = b || {}; var out = [];
  Object.keys(Object.assign({}, a, b)).forEach(function(k){
    var d = cfgN(b[k]) - cfgN(a[k]); if (!d) return;
    out.push((d > 0 ? '+' : '\u2212') + nm(Math.abs(d)) + ' ' + itemName(k));
  });
  return out;
}
function demoRevsHtml(x, ins){
  var R = insRevs(ins); if (!x || !x.pilot || !ins) return '';
  var all = R.concat([insRevSnap(ins)]);
  var rows = all.map(function(r, i){
    var df = i ? partsDiff(all[i - 1].parts, r.parts) : [];
    return [(i === all.length - 1 ? '<b>' : '') + t('تجهيزة') + ' ' + nm(i + 1) + (i === all.length - 1 ? ' \u00b7 ' + t('الحالية') + '</b>' : ''),
            '<span class="num">' + esc(r.at ? fmtTime(r.at, { day:'2-digit', month:'2-digit' }) : '\u2014') + '</span><br><span class="hint" style="margin:0">' + esc(dispName(r.by || '')) + '</span>',
            N(r.pts), N(insRevPhotoN(x.id, i + 1)),
            i ? (df.length ? esc(df.join(' \u00b7 ')) : '<span class="hint" style="margin:0">' + esc(t('بلا تغيير في القطع')) + '</span>') : '<span class="hint" style="margin:0">' + esc(t('أول تركيب')) + '</span>'];
  }).reverse();
  return '<div class="hint" style="margin:12px 0 4px;font-weight:700">\u{1F9EA} ' + esc(t('تجهيزات الديمو')) + ' <span class="num">' + nm(all.length) + '</span></div>'
    + table(['التجهيزة','التاريخ','النقاط','الصور','ما تغيّر'], rows)
    + (may('settings') && Object.keys(ins.parts || {}).length
        ? '<div class="actions" style="margin:8px 0 0">' + btn('\u2B50 ' + t('اعتمد التجهيزة الحالية قياسيّة'),'btn-secondary btn-sm',' data-demostd="' + esc(x.id) + '"') + '</div>'
        : '');
}
/* الاعتمادُ القياسيُّ = نمطُ قطعٍ باسمٍ يظهر في «نمطٌ جاهز» عند حلِّ التركيب لكلِّ نقطة */
function demoStdSave(id){
  if (!may('settings')){ toast(t('حفظُ الأنماط للمهندس وحده')); return; }
  var x = siteFind(id), ins = STATE.inss[id]; if (!x || !ins || !Object.keys(ins.parts || {}).length) return;
  var def = t('قياسي') + ' \u2014 ' + t(x.type || '') ;
  var name = prompt(t('اسمُ النمط القياسيّ'), def); if (name == null) return;
  name = String(name).trim(); if (!name){ toast(t('اكتب اسمًا للنمط')); return; }
  var items = {}; Object.keys(ins.parts).forEach(function(k){ if (cfgN(ins.parts[k]) > 0) items[k] = cfgN(ins.parts[k]); });
  var L = patList().filter(function(p){ return p.n !== name; });
  L.push({ n:name, items:items, by:STATE.meta.name || '', at:Date.now(), from:id, rev:insRevs(ins).length + 1 });
  STATE.patterns = L; CORE.set('cfg', 'patterns', L.slice());
  logEvent('اعتمادُ تجهيزة ديمو قياسيّة — ' + id + ' · تجهيزة ' + (insRevs(ins).length + 1) + ' · ' + name, id);
  toast(t('اعتُمدت قياسيّة — تظهر في «نمطٌ جاهز»') + ' \u00b7 ' + name); render(1);
}

/* (V37.79) نوعُ صورة التركيب يحمل رقمَ التجهيزة في نقطة الديمو — فتُفرَز على الدرايف في «تركيب/تجهيزة N» */
function insKind(site, ins, k){
  return (site && site.pilot) ? 'ins_r' + (insRevs(ins).length + 1) + '_' + k : 'ins_' + k;
}
function insRevPhotoN(id, n){
  var re = new RegExp('^ins_r' + n + '_'), c = 0;
  var hit = function(kind){ kind = String(kind || ''); return re.test(kind) || (n === 1 && /^ins_/.test(kind) && !/^ins_r\d+_/.test(kind)); };
  photosOf(id).forEach(function(e){ var p = e[1]; if (p && !p.del && hit(p.kind)) c++; });
  (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q : []).forEach(function(q){ if (q.site === id && hit(q.kind)) c++; });
  return c;
}
/* صورٌ تُضاف لتركيبٍ مسجَّلٍ من المعرض أو من اللاب — دون فتح النموذج ودون إعادة التركيب */
function insPhotoBtn(x, ins){
  if (!x || !ins || ins.status === 'مسودّة') return '';
  return '<label class="btn btn-quiet btn-sm" style="cursor:pointer">\u{1F4CE} ' + esc(t('أضِف صورًا لهذا التركيب'))
    + (x.pilot ? ' \u00b7 ' + esc(t('تجهيزة')) + ' ' + nm(insRevs(ins).length + 1) : '')
    + '<input type="file" accept="image/*" multiple data-insph="' + esc(x.id) + '" style="display:none"></label>';
}
function insPhotoAdd(id, files){
  var x = siteFind(id), ins = STATE.inss[id]; if (!x || !ins || !files || !files.length) return;
  toast(t('تُضغط الصور…') + ' (' + nm(files.length) + ')');
  var n = 0;
  files.reduce(function(pr, f){ return pr.then(function(){ return shrink(f, 1280, 0.72).then(function(p){ if (p && p.data){ photoQueue(id, insKind(x, ins, 'extra'), p.data); n++; } }); }); }, Promise.resolve())
    .then(function(){ logEvent('صورُ تركيب — ' + id + ' · ' + n + (x.pilot ? ' · تجهيزة ' + (insRevs(ins).length + 1) : ''), id);
      toast(t('صعدت الصورُ إلى طابور الرفع') + ' (' + nm(n) + ')'); render(1); });
}

function insSave(draft){
  var s = formSite();
  if (!s) return;
  if (!draft && !FORM.status){ toast(t('حدّد حالة التركيب أولًا')); return; }
  /* (V37.80) مسودّةٌ على نقطة ديمو مركَّبة كانت تمحو التجهيزةَ الحالية وتُخرجها من «المركَّب» — تُمنَع بصراحة */
  if (draft && s.pilot && STATE.inss[s.id] && STATE.inss[s.id].status && STATE.inss[s.id].status !== 'مسودّة'){ toast(t('نقطةُ ديمو مركَّبة: سجّل التجهيزة الجديدة مباشرةً — المسودّةُ تمحو الحالية')); return; }
  if (!draft && (!FORM.photos.before || !FORM.photos.after)){
    toast(t('صورتا قبل وبعد مطلوبتان'));
    return;
  }
  /* الرقمُ التسلسليُّ يعرّف الجهازَ بعينه: تكرارُه داخل النقطة الواحدة يعني
     أن جهازًا سُجّل مرتين أو أن رقمًا نُسخ خطأً — وكلاهما يُفسد العُهدة. */
  var sn = {}, dup = '';
  Object.keys(FORM.serials || {}).forEach(function(k){
    var v = String(FORM.serials[k] || '').trim();
    if (!v) return;
    if (sn[v]) dup = v; else sn[v] = 1;
  });
  if (dup){ toast(t('رقم تسلسليٌّ مكرّر داخل النقطة') + ': ' + dup); return; }
  /* (V38.56) the same serial on another site that was not dismantled is the same device recorded twice — custody breaks.
     Typing it only warned; now the save stops (the engineer may override after confirming, and it is logged) */
  var elsewhere = '';
  Object.keys(sn).forEach(function(v){ if (elsewhere) return; var o = serialOwner(v, s.id); if (o && !disDone(o)) elsewhere = v + ' \u2192 ' + o; });
  if (elsewhere){
    if (!(may('approve') && typeof confirm === 'function' && confirm(t('هذا الرقمُ مسجَّلٌ على نقطةٍ أخرى') + ': ' + elsewhere + ' — ' + t('سجّله هنا على أيِّ حال؟')))){
      toast(t('رقمٌ تسلسليٌّ مسجَّلٌ على نقطةٍ أخرى لم تُفَكّ') + ': ' + elsewhere + ' — ' + t('صحّحه، أو يفكّه المهندسُ من هناك أوّلًا')); return;
    }
    logEvent('سيريالٌ مكرَّرٌ بموافقة المهندس — ' + elsewhere + ' \u2192 ' + s.id, s.id);
  }
  var used = {}, n = 0;
  Object.keys(FORM.parts).forEach(function(k){
    var q = cfgN(FORM.parts[k]);
    if (q > 0){ used[k] = q; n += q; }
  });
  if (!draft && !n){ toast(t('سجّل القطع المستهلكة أولًا')); return; }

  /* (V37.78) نقطةُ الديمو: ما رُكِّب قبلُ يُحفَظ تجهيزةً سابقة، ويُستهلَك الفرقُ الزائدُ وحدَه */
  var prevIns = STATE.inss[s.id], keepRev = !!(s.pilot && prevIns && !prevIns.deleted && prevIns.status && prevIns.status !== 'مسودّة' && !draft);
  var nIns = {
    id:s.id, status: draft ? 'مسودّة' : FORM.status,
    by:STATE.meta.name || '', at:Date.now(),
    parts:used, serials:FORM.serials, prefix:FORM.prefix, pts:formPts(),
    approved:false, photos:Object.keys(FORM.photos)
  };
  if (s.pilot && prevIns && insRevs(prevIns).length) nIns.revs = insRevs(prevIns).slice(-30);
  if (keepRev) nIns.revs = insRevs(prevIns).concat([insRevSnap(prevIns)]).slice(-30);
  CORE.set('inss', s.id, nIns);
  /* (V38.57) the upload merges into the cloud document (which keeps the approved solution); the local copy keeps it too —
     it was dropped on the installer's device, so the site looked «without an approved solution» there after saving */
  if (prevIns && (prevIns.solution || prevIns.hand)) STATE.inss[s.id] = Object.assign({}, nIns, prevIns.solution ? { solution:prevIns.solution } : {}, prevIns.hand ? { hand:prevIns.hand } : {});
  Object.keys(FORM.photos).forEach(function(k){
    if (typeof photoQueue === 'function') photoQueue(s.id, (s.pilot ? 'ins_r' + (insRevs(nIns).length + 1) + '_' + k : 'ins_' + k), FORM.photos[k].data);   /* (V37.79) */
  });
  /* استهلاكُ القطع يدخل دفتر الحركة — فلا يُخصَم المخزونُ مرتين */
  if (!draft){
    var take = {};
    Object.keys(used).forEach(function(k){
      var q = keepRev ? used[k] - cfgN((prevIns.parts || {})[k]) : used[k];   /* (V37.78) */
      if (q > 0) take[k] = q;
    });
    Object.keys(take).forEach(function(k){
      STATE.moves.push({ at:dayKey(), kind:'استهلاك',
                         item:k, qty:take[k], by:STATE.meta.name || '—', site:s.id, cond:'' });
    });
    if (Object.keys(take).length) CORE.dirty('moves', s.id, take);
  }
  logEvent((draft ? 'مسودّة تركيب' : (keepRev ? 'تجهيزةُ ديمو ' + (insRevs(nIns).length + 1) : 'تركيب')) + ' — ' + s.id + ' · ' + nm(formPts()) + ' نقطة');
  /* (V38.60) the record goes into the point's chat: the office reads what was installed and the serials as they are saved */
  if (!draft && typeof chSystem === 'function') chSystem(s.id, (keepRev ? 'تجهيزةٌ جديدة' : 'رُكِّبت') + ' — ' + t(FORM.status) + ' \u00b7 ' + Object.keys(used).map(function(k){ var sn2 = (FORM.serials || {})[k]; return itemName(k) + ' \u00d7' + nm(used[k]) + (sn2 ? ' (' + sn2 + ')' : ''); }).join('، ') + ' \u00b7 ' + nm(Object.keys(FORM.photos).length) + ' ' + t('صورة'), '');
  if (!draft) stepDone('install', s.id, nm(n) + ' ' + t('قطعة'), formPts());
  toast(draft ? t('حُفظت مسودّة') : (t('تركيبٌ حُفظ — بانتظار التدقيق')));
  formReset();
  render();
}

/* ═══ نموذجٌ لنقطةٍ واحدة (V17.22) ═══
   النموذجُ كائنٌ واحدٌ يُعاد استعمالُه لكلِّ نقطة، وصورُه فيه. وتبديلُ النقطة
   كان يكتب FORM.site ولا يمسح ما قبلَه — فمن فتح نقطةً وصوّرها ولم يحفظ، ثم
   فتح غيرَها وحفظ، ذهبت صورُ الأولى إلى الثانية. هكذا صعدت صورُ ممرات منى
   إلى مخيمٍ في عرفات. فصار تبديلُ النقطة يمسح ما لم يُحفَظ، ويُقال ذلك. */
function formGo(id, why){
  id = String(id || '');
  if (FORM.site && FORM.site !== id){
    var n = Object.keys(FORM.photos || {}).length;
    if (typeof svDraftClear === 'function') svDraftClear();   /* (V25.9) تبديلُ النقطة يُسقط مسودةَ الأولى */
    formReset();
    if (n) toast(nm(n) + ' ' + t('صورةً لم تُحفَظ — أُلغيت مع تبديل النقطة'));
  }
  FORM.site = id;
  /* لحظةُ الفتح: ما وصل بعدها من غيري على النقطة نفسِها يُسأل عنه قبل الحفظ (V17.79) */
  FORM.openedAt = Date.now(); FORM.overwrite = false;
  if (why === 'new') formReset();
}
/* (V29.4) «انسخ من آخر زيارتي»: الحقولُ الثابتةُ لنفس النوع (التثبيت والكهرباء والمقاسات والملاءمة والمعدّات والتقدير)
   من آخر زيارةٍ سجّلتُها — والوصولُ والتحدياتُ والملاحظاتُ والصورُ والأعدادُ الخاصةُ بالموقع لا تُنسَخ أبدًا. */
var SV_COPY_KEYS = ['mount', 'power', 'height', 'cable', 'len_m', 'wid_m', 'hgt_m', 'fit', 'power_yn', 'power_src', 'pdist', 'p24', 'metal', 'civil', 'equip', 'hours', 'crew_n', 'n_ant', 'n_rdr', 'n_cam', 'n_sens', 'corr_w', 'router_sp'];
function svLastMine(s){
  var me = STATE.meta.name || '', best = null;
  Object.keys(STATE.recs || {}).forEach(function(id){ if (id === s.id) return; var r = STATE.recs[id], x = siteFind(id);
    if (!r || r.by !== me || !x || x.type !== s.type || !r.mount) return; if (!best || (+r.at || 0) > (+best.at || 0)) best = r; });
  return best;
}
function svCopyBar(s){
  var L = svLastMine(s); if (!L) return '';
  return '<div class="actions" style="margin:0 0 10px;align-items:center">' + btn('\u21BA ' + t('انسخ من آخر زيارتي'), 'btn-secondary btn-sm', ' data-svcopy="' + esc(L.id) + '"')
    + '<span class="hint" style="margin:0">' + esc(t('التثبيت والكهرباء والمقاسات من')) + ' ' + esc(siteKey(siteOf(L))) + ' \u00b7 ' + esc(t('الصور والتحديات من الموقع')) + '</span></div>';
}
function svCopyFrom(id){
  var r = STATE.recs[id]; if (!r){ toast(t('لا زيارة')); return; }
  var n = 0; SV_COPY_KEYS.forEach(function(k){ if (r[k] != null && r[k] !== '' && (FORM[k] == null || FORM[k] === '')){ FORM[k] = r[k]; n++; } });
  if (typeof SVD === 'object' && SVD) SVD.dirty = true; try { svDraftSoon(); } catch (e){ LS_ERR = e; }
  toast(n ? t('نُسخ') + ' ' + nm(n) + ' ' + t('حقلًا من') + ' ' + id + ' \u2014 ' + t('راجعها قبل الحفظ') : t('لا حقولَ فارغةً تُنسَخ'));
}
function formReset(){
  FORM.mount = FORM.power = FORM.height = FORM.cable = FORM.note = FORM.prefix = '';
  FORM.chals = []; FORM.photos = {}; FORM.parts = {}; FORM.serials = {};
  FORM.status = ''; FORM.access = 'تم الوصول'; FORM._pre47 = ''; FORM._pre47msg = '';   /* (V37.90) */
  SV_EXTRA_KEYS.forEach(function(k){ FORM[k] = ''; });
}

/* ═══ التقاطُ أخطاء الإنتاج ═══
   خطأٌ برمجيٌّ على هاتفٍ في الشمس لا يراه أحد: الشاشةُ تتجمّد أو زرٌّ يصمت،
   ويظنُّ الفنيُّ أنه أخطأ. صار كلُّ خطأٍ غيرِ ملتقَطٍ يُسجَّل في سجل الأحداث
   — الذي يُرفَع — برسالته وسطره ونسخته، فيقرؤه المكتبُ في «السجلات» ويعرف
   أيَّ زرٍّ وأيَّ نسخة. ويُرفَع الخطأُ الواحدُ مرةً لا في كلِّ إعادة رسم،
   وبسقفٍ يمنع إغراقَ السجل إن انفجر شيءٌ في حلقة. */
var ERR_SEEN = {};
function errCapture(msg, src, line){
  try { boxNote('err', String(msg || '').slice(0, 60) + '@' + String(src || '').split('/').pop().slice(0, 20) + ':' + (line || 0)); } catch (e0){ BOX_ERR = e0; }
  try {
    var key = String(msg || '').slice(0, 80) + '@' + (line || 0);
    if (ERR_SEEN[key]) return;
    if (Object.keys(ERR_SEEN).length >= 20) return;
    ERR_SEEN[key] = 1;
    var ver = (document.querySelector('[data-p="vers"]') || {}).textContent || '';
    /* (V33.0) قياسُ الميدان (١٤ يومًا): ٣٣٥ من ٣٦٨ «خطأ برمجي» كانت أعطالَ مخزن المتصفّح في آيفون («Connection to Indexed Database
       server lost» و«internal error was encountered in the Indexed Database server») وفشلَ تحديث عامل الخدمة لانقطاع الشبكة — أعطالُ
       منصّةٍ لا أخطاءُ شيفرة، فكانت تغرق الأخطاءَ الحقيقية. تُسجَّل باسمها، ومخزنُ الجهاز يُعاد فتحُه فورًا لأن انقطاعه يقتل كلَّ
       اتصالاتِ الموقع ومنها اتصالُنا. */
    var plat = /Indexed Database server|IndexedDB|IDBDatabase|IDBTransaction|in-progress transaction|Failed to update a ServiceWorker|sw\.js load failed/i.test(String(msg || ''));
    if (plat && /Indexed Database|IDB|transaction/i.test(String(msg || '')) && typeof idbRetryNow === 'function' && typeof indexedDB !== 'undefined'){ try { idbRetryNow(); } catch (e1){ IDB_LOG_ERR = e1; } }
    logEvent((plat ? 'عطلٌ في متصفّح الجهاز — ' : 'خطأ برمجي — ') + String(msg || '').slice(0, 140)
             + ' \u00b7 ' + String(src || '').split('/').pop().slice(0, 40) + ':' + (line || 0)
             + (ver ? ' \u00b7 ' + String(ver).replace(/\s+/g, ' ').trim().slice(0, 20) : ''));
  } catch (e) {}
}
window.addEventListener('error', function(e){ errCapture(e.message, e.filename, e.lineno); });
window.addEventListener('unhandledrejection', function(e){
  var r = e && e.reason;
  errCapture('promise: ' + (r && (r.message || r)), '', 0);
});
/* من تقبل القاعدةُ أحداثَه: كلُّ دورٍ يكتب — لا الوزارةُ ولا الإدارةُ العليا */
function canWriteEvents(){
  var r = effRole(ROLE);
  return ['engineer','admin','supervisor','buyer','store','acct','tech','cprep','casm','cins','helper','driver'].indexOf(r) > -1;
}
/* ═══ الحدثُ يحمل نقطتَه (V17.20) ═══
   كان السجلُّ نصًّا حرًّا: «تمت الزيارة — NSK-MIN-RDR-0018». يُقرأ بالعين
   ولا يُستعلَم به: لا يُقال «أرني كلَّ ما جرى لهذه النقطة» إلا ببحثٍ نصيٍّ
   في الخمسمئة حدثٍ المحمَّلة. فصار لكلِّ حدثٍ حقلُ نقطته حين يخصُّ نقطة —
   فتُسأل القاعدةُ عنها مباشرةً مهما تقادمت. */
/* ═══ الحدثُ يحمل فاعلَه لا مستقبِلَه (V17.26) ═══
   كان «من» في السجل دائمًا صاحبَ الجهاز: يصل جهازَ المديرِ إشعارٌ بزيارةٍ
   سجّلها خالدٌ فيُكتَب «محمد صفوت — زيارة تمّت»، فلا يُعرَف من عمل ماذا وهو
   أصلُ ما يُراجَع. صار الفاعلُ وسيطًا: من كتب الوثيقةَ هو «من»، وصاحبُ
   الجهاز يُذكَر في «سُجِّل على». والوقتُ وقتُ الفعل لا وقتُ وصوله. */
function logEvent(what, site, who, when){
  var now = +when || Date.now();
  var mine = STATE.meta.name || '';
  var e = { id:uid36(), ts:now,
            at:fmtTime(now, { hour:'2-digit', minute:'2-digit' }),
            day:dayKey(now),
            what:what, by:String(who || mine), dev:DEV_ID };
  if (who && who !== mine) e.rec = mine;
  if (site) e.site = String(site);
  STATE.events.unshift(e);
  if (STATE.events.length > 500) STATE.events.length = 500;
  /* الأثرُ التدقيقيُّ يُرفَع: الوزارةُ تسأل من فعل ومتى، والذاكرةُ لا تجيب.
     — لكن القاعدةَ تقبل الحدثَ ممن يعمل لا ممن يطّلع: الوزارةُ والإدارةُ العليا
     تقرآن فقط، وكان حدثُ دخولهما يُدفَع فيُرفَض ويُعزَل ويُظهر لهما «عُزلت عن
     الرفع» في كلِّ جلسة. يبقى في جهازهما ولا يُرفَع. */
  if (typeof canWriteEvents === 'function' && !canWriteEvents()) return;
  if (!STATE.evlog) STATE.evlog = {};
  STATE.evlog[e.id] = e;
  CORE.dirty('evlog', e.id, e);
}


