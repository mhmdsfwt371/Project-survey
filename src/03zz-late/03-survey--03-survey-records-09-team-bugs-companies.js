/* ============================================================================
   FILE    : src/03zz-late/03-survey--03-survey-records-09-team-bugs-companies.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03-survey/03-survey-records-09-team-bugs-companies.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : phoneClean, phonesBulk, bugSend, bugMayDecide, bugClose, bugDecide, bugsPageHtml, briefingText, briefingSend, briefingCopyAll, waLink, coRename, coEmailOf, mailOfficial, mailGo, coLiaisonOf, coStat, waText, waGo
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* ═══ أرقامُ الفريق دفعةً واحدة (V16.99) ═══
   الرقمُ حقلٌ في الحساب، وإدخالُه واحدًا واحدًا لخمسةَ عشرَ حسابًا يُؤجَّل
   فلا يُعمَل — و«بلاغُ اليوم» بلا أرقامٍ نصفُ شاشة. فصار يُلصَق الجدولُ كما
   هو من الهاتف أو من إكسل: سطرٌ لكلِّ شخصٍ فيه الاسمُ (أو اسمُ الدخول) ثم
   الرقم، بأيِّ فاصل — فيُطابَق بالاسم ويُحفَظ، ويُقال بالحرف من طُوبِق ومن
   لم يُعرَف اسمُه. */
function phoneClean(v){
  var d = String(v || '').replace(/[^\d+]/g, '');
  if (d.indexOf('+966') === 0) d = '0' + d.slice(4);
  else if (d.indexOf('966') === 0 && d.length >= 12) d = '0' + d.slice(3);
  return d;
}

function phonesBulk(){
  if (!may('users')){ toast(t('أرقامُ الفريق لمن يدير الحسابات')); return; }
  var el = document.getElementById('phBulk'); if (!el) return;
  var lines = String(el.value || '').split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
  if (!lines.length){ toast(t('ألصق الأرقامَ أوّلًا')); return; }
  var U = STATE.users || {}, done = 0, miss = [];
  lines.forEach(function(ln){
    var m = ln.match(/^(.*?)[\s,،\t|;:]+([+\d][\d\s-]{6,})$/);
    if (!m){ miss.push(ln.slice(0, 30)); return; }
    var who = m[1].trim(), ph = phoneClean(m[2]);
    if (!ph){ miss.push(ln.slice(0, 30)); return; }
    var uid = Object.keys(U).filter(function(k){
      var u = U[k] || {}; return u.name === who || u.user === who || dispName(u.name || '') === who;
    })[0];
    if (!uid){ miss.push(who.slice(0, 30)); return; }
    U[uid] = Object.assign({}, U[uid], { ph:ph });
    CORE.set('users', uid, U[uid]); done++;
  });
  logEvent('أرقامُ الفريق — حُفظ ' + done + ' رقمًا');
  toast(done ? (t('حُفظ') + ' ' + nm(done) + ' ' + t('رقمًا') + (miss.length ? ' \u00b7 ' + t('لم يُعرَف') + ' ' + nm(miss.length) : ''))
             : t('لم يُطابَق أيُّ اسم — تأكّد أن الأسماء كما في الحسابات'));
  if (miss.length) PH_MISS = miss; else PH_MISS = [];
  el.value = ''; render(1);
}

function bugSend(){
  var g = function(id){ var el = document.getElementById(id); return el ? String(el.value || '').trim() : ''; };
  var txt = g('bgTxt');
  if (txt.length < 10){ toast(t('اكتب ما حدث في سطرٍ على الأقل')); return; }
  var id = uid36();
  var r = { id:id, kind:BUG_KIND, txt:txt, want:g('bgWant'),
            by:STATE.meta.name || '', uid:myUid(), at:Date.now(),
            status:'جديد', ctx:bugCtx(), gh:0, diag:(typeof assistDiag === 'function' ? assistDiag() : null), viaAssist:!!BUG_FROM_ASSIST,   /* (V37.27) لقطةُ حالة الجهاز */
            box:(function(){ try { return boxText(); } catch (e){ return ''; } })() };   /* الصندوقُ الأسود في الكتابة نفسِها (V17.98) */
  if (!STATE.bugs) STATE.bugs = {};
  STATE.bugs[id] = r;
  CORE.set('bugs', id, r);
  logEvent('بلاغ — ' + BUG_KIND + ': ' + txt.slice(0, 60));
  try { notifPush('بلاغٌ جديد', BUG_KIND + ' — ' + txt.slice(0, 60), { lv:'مهم' }); } catch (e){ LS_ERR = e; }
  BUG_OPEN = false; BUG_FROM_ASSIST = '';
  toast(t('وصل البلاغ — يُفتَح في المستودع خلال دقائق'));
  render(1);
}

function bugMayDecide(){ return rankOf(effRole(ROLE)) >= rankOf('admin') || may('settings'); }

function bugClose(id){
  if (!bugMayDecide()){ toast(t('قرارُ البلاغات للمدير')); return false; }
  var b = (STATE.bugs || {})[id]; if (!b) return false;
  b.status = 'مغلق'; b.closedAt = Date.now(); b.closedBy = STATE.meta.name || ''; b.closeAsk = true;
  b.log = [{ at:b.closedAt, by:b.closedBy, what:'أُنجز وأُغلق' }].concat(Array.isArray(b.log) ? b.log : []).slice(0, 20);
  CORE.set('bugs', id, b);
  logEvent('إغلاقُ بلاغ — ' + String(b.txt || '').slice(0, 50), '', b.closedBy, b.closedAt);
  toast(t('أُغلق البلاغُ — ويُغلَق في المستودع مع دورة الجسر'));
  render(1); return true;
}

function bugDecide(id, ok, why){
  if (!bugMayDecide()){ toast(t('قرارُ البلاغات للمدير')); return false; }
  var b = (STATE.bugs || {})[id];
  if (!b){ toast(t('لا بلاغَ بهذا المعرّف')); return false; }
  why = String(why || '').trim();
  if (!ok && why.length < 3){ toast(t('اكتب سببَ الرفض')); return false; }
  b.status = ok ? 'مقبول' : 'مرفوض';
  b.decBy = STATE.meta.name || ''; b.decAt = Date.now(); b.decWhy = why;
  b.log = [{ at:b.decAt, by:b.decBy, what:(ok ? 'قُبل' : 'رُدّ') + (why ? ' — ' + why : '') }]
    .concat(Array.isArray(b.log) ? b.log : []).slice(0, 20);
  CORE.set('bugs', id, b);
  logEvent('قرارُ بلاغ — ' + (ok ? 'قُبل' : 'رُدّ') + ' · ' + String(b.txt || '').slice(0, 50), '', b.decBy, b.decAt);
  toast(t(ok ? 'قُبل البلاغُ — يدخل قائمةَ العمل' : 'رُدَّ البلاغُ — لا يُعمَل به'));
  BUG_DEC = ''; render(1);
  return true;
}

function bugsPageHtml(){
  var ALL = bugList();
  var cnt = function(st){ return ALL.filter(function(b){ return (b.status || 'جديد') === st; }).length; };
  var nNew = cnt('جديد'), nOk = cnt('مقبول') + cnt('مفتوح') + cnt('قيد التنفيذ'), nNo = cnt('مرفوض'), nDone = cnt('مغلق');
  var L = ALL.filter(function(b){
    var st = b.status || 'جديد';
    if (BUG_F === 'new') return st === 'جديد';
    if (BUG_F === 'ok')  return st === 'مقبول' || st === 'مفتوح' || st === 'قيد التنفيذ';
    if (BUG_F === 'no')  return st === 'مرفوض';
    if (BUG_F === 'done') return st === 'مغلق';
    if (BUG_F === 'عطل' || BUG_F === 'طلب جديد' || BUG_F === 'اقتراح') return (b.kind || '') === BUG_F;
    return true;
  });
  var chip = function(k, txt, n, cls){
    return '<button type="button" class="chip' + (BUG_F === k ? ' on' : '') + (cls ? ' ' + cls : '') + '" data-bugf="' + esc(k) + '">'
      + esc(t(txt)) + ' <span class="num">' + nm(n) + '</span></button>';
  };
  var open = ALL.filter(function(b){ return b.status !== 'مغلق'; }).length;
  return '<p class="lede" style="margin:0 0 16px">' + esc(t('كلُّ ما أُبلغ عنه واقتُرح وطُلب — بتاريخه. ما تقبله يدخل قائمةَ العمل، وما تردُّه يُقفَل بسببه ولا يُعمَل به.')) + '</p>'
    + stats([['الكل', N(ALL.length)], ['بانتظار قرارك', N(nNew), nNew ? 'wrn' : 'ok'],
             ['مقبولٌ — يُعمَل به', N(nOk), 'acc'], ['مردود', N(nNo)], ['مغلق', N(nDone), 'ok']])
    + '<div class="chips">' + chip('', 'الكل', ALL.length) + chip('new', 'بانتظار قرارك', nNew)
    +   chip('ok', 'مقبول', nOk) + chip('no', 'مردود', nNo) + chip('done', 'مغلق', nDone)
    +   chip('عطل', 'عطل', ALL.filter(function(b){ return b.kind === 'عطل'; }).length)
    +   chip('طلب جديد', 'طلب جديد', ALL.filter(function(b){ return b.kind === 'طلب جديد'; }).length)
    +   chip('اقتراح', 'اقتراح', ALL.filter(function(b){ return b.kind === 'اقتراح'; }).length)
    + '</div>'
    + (L.length
        ? L.map(function(b){
            var c = b.ctx || {};
            return card('', '<div class="wt-row" style="justify-content:space-between">'
              + '<div style="min-width:0"><strong>' + esc(b.txt || '') + '</strong>'
              +   '<div class="hint" style="margin:2px 0 0">' + esc(t(b.kind || '')) + ' \u00b7 ' + esc(dispName(b.by || ''))
              +     ' \u00b7 ' + esc(stepAgo(b.at || 0)) + (c.v ? ' \u00b7 ' + esc(c.v) : '')
              +     (c.page ? ' \u00b7 ' + esc(t(pageTitle(c.page) || c.page)) : '') + '</div></div>'
              + '<div class="wt-row" style="margin:0">' + pill(b.status || 'جديد', BUG_ST_C[b.status] || '')
              +   (b.gh ? '<a class="btn btn-quiet btn-sm" target="_blank" rel="noopener" href="https://github.com/mhmdsfwt371/Project-survey/issues/' + esc(b.gh) + '">#' + nm(b.gh) + '</a>' : '')
              + '</div></div>'
              + (b.want ? '<div class="hint" style="margin:6px 0 0">' + esc(t('المتوقَّع')) + ': ' + esc(b.want) + '</div>' : '')
              /* الصندوقُ الأسود خطًّا زمنيًّا — للمهندس فمن فوقه (V17.98) */
              + (b.box && rankOf(effRole(ROLE)) >= rankOf('engineer')
                  ? '<details style="margin:6px 0 0"><summary class="hint" style="margin:0;cursor:pointer">' + esc(t('الخطُّ الزمنيُّ للجهاز')) + ' \u00b7 ' + nm(String(b.box).split('\n').length) + ' ' + esc(t('سطر')) + '</summary>'
                    + '<pre dir="ltr" style="font-size:12px;line-height:1.6;white-space:pre-wrap;margin:6px 0 0">' + esc(String(b.box).slice(0, BOX_BYTES)) + '</pre></details>'
                  : '')
              /* تاريخُ البلاغ: قرارُه ومن قرّره ومتى، وما جرى بعده */
              + (b.decBy
                  ? '<div class="hint" style="margin:6px 0 0">'
                    + esc(t(b.status === 'مرفوض' ? 'رُدَّ بـ' : 'قَبِله')) + ' ' + esc(dispName(b.decBy))
                    + ' \u00b7 ' + esc(stepAgo(b.decAt || 0))
                    + (b.decWhy ? ' \u00b7 ' + esc(b.decWhy) : '') + '</div>'
                  : '')
              + ((Array.isArray(b.log) && b.log.length)
                  ? '<div class="wt-log" style="margin:6px 0 0">' + b.log.map(function(e){
                      return '<div class="wt-le"><span class="hint num" style="margin:0">' + esc(fmtDT(e.at)) + '</span> '
                        + esc(t(e.what || '')) + (e.by ? ' <b>' + esc(dispName(e.by)) + '</b>' : '') + '</div>';
                    }).join('') + '</div>'
                  : '')
              /* القرار: يُتَّخذ هنا — وما يُقبَل وحدَه يدخل قائمةَ العمل */
              /* ما قُبل ونُفِّذ يُغلقه المديرُ من هنا، والجسرُ يغلقه في المستودع (V17.56) */
              + (bugMayDecide() && (b.status === 'مقبول' || b.status === 'قيد التنفيذ' || b.status === 'مفتوح')
                  ? '<div class="actions" style="margin:8px 0 0">'
                    + btn('\u2714 ' + t('أُنجز — أغلق البلاغ'),'btn-secondary btn-sm',' data-bugdone="' + esc(b.id) + '"')
                    + '</div>'
                  : '')
              + (bugMayDecide() && (b.status || 'جديد') === 'جديد'
                  ? (BUG_DEC === b.id
                      ? '<div class="field" style="margin:8px 0 0"><label>' + esc(t('سببُ الردّ')) + '</label>'
                        + '<input id="bgWhy" dir="auto" placeholder="' + esc(t('يُكتَب لصاحب البلاغ — فيعرف لماذا')) + '"></div>'
                        + '<div class="actions" style="margin:6px 0 0">'
                        + btn('\u2716 ' + t('أكّد الردّ'),'btn-danger btn-sm',' data-bugno="' + esc(b.id) + '"')
                        + btn(t('إلغاء'),'btn-quiet btn-sm',' data-bugdec=""')
                        + '</div>'
                      : '<div class="actions" style="margin:8px 0 0">'
                        + btn('\u2714 ' + t('اقبل — يدخل قائمة العمل'),'btn-primary btn-sm',' data-bugok="' + esc(b.id) + '"')
                        + btn('\u2716 ' + t('ردّ'),'btn-quiet btn-sm',' data-bugdec="' + esc(b.id) + '"')
                        + '</div>')
                  : ''));
          }).join('')
        : card('', '<p class="hint" style="text-align:center;margin:0">' + esc(t('لا بلاغاتٍ بعد — الزرُّ 🛠 في الشريط العلويّ.')) + '</p>'));
}

function briefingText(x){
  var L = [];
  L.push(t('السلام عليكم') + ' ' + x.name + ' \u2014 ' + t('بلاغ اليوم') + ' ' + dayKey(Date.now()));
  ['survey','install','dis'].forEach(function(k){
    if (!x.asn[k].length) return;
    L.push('');
    L.push('\u25B6 ' + t(kindLabel(k)) + ' \u2014 ' + nm(x.asn[k].length) + ' ' + t('نقطة') + ':');
    x.asn[k].slice(0, 15).forEach(function(id){ var st = siteFind(id) || {}; L.push('\u2022 ' + fsi(id) + (st.name ? ' \u2014 ' + fsiText(String(st.name).slice(0, 30)) : '')); });
    if (x.asn[k].length > 15) L.push('\u2026 ' + t('والباقي في التطبيق'));
  });
  if (!x.open) L.push(t('لا إسنادَ عليك اليوم — راجع «مهامي» فقد يصلك خلال النهار.'));
  if (x.wt) L.push('', '\u{1F4CB} ' + t('عليك') + ' ' + nm(x.wt) + ' ' + t('من مهام الاجتماع') + ' \u2014 ' + t('حدّث حالتَها من «مهامي»'));
  L.push('', t('افتح «مهامي» في التطبيق واضغط «من موقعي» لترتيب الطريق') + ':', appUrl());   /* (V38.29) */
  L.push('\u2014 ' + (STATE.meta.name || ''));
  return L.join('\n');
}

function briefingSend(uid){
  var x = briefingRows().filter(function(r){ return r.uid === uid; })[0];
  if (!x) return;
  if (!x.ph){ toast(t('لا جوالَ محفوظٌ لهذا الشخص — أضفه في الحسابات أوّلًا')); return; }
  try { window.open(waLink(x.ph, briefingText(x)), '_blank', 'noopener'); toast(t('فُتح واتساب') + ' \u2014 ' + t('اضغط إرسال')); }
  catch (e){ toast(t('تعذّر فتحُ واتساب')); }
  logEvent('بلاغُ اليوم — ' + x.name);
}

function briefingCopyAll(){
  var txt = briefingRows().map(briefingText).join('\n\n\u2014\u2014\u2014\n\n');
  var done = function(){ toast(t('نُسخت رسائلُ الفريق — ألصقها في مجموعة واتساب')); };
  try { navigator.clipboard.writeText(txt).then(done, function(){ toast(t('تعذّر النسخ')); }); }
  catch (e){ toast(t('تعذّر النسخ')); }
}

/* ── إشعار واتساب ── */
function waLink(phone, text){
  var p = String(phone || '').replace(/[^\d]/g, '');
  if (p.indexOf('0') === 0) p = '966' + p.slice(1);
  if (p && p.indexOf('966') !== 0 && p.length === 9) p = '966' + p;
  return 'https://wa.me/' + p + '?text=' + encodeURIComponent(text || '');
}

/* ═══ إعادةُ تسمية شركة ═══
   اسمُ الشركة نصٌّ على كلِّ نقطةٍ من نقاطها — فخطأُ حرفٍ في الاستيراد يجعل
   الشركةَ الواحدةَ شركتين في كلِّ تقرير، ولا سبيلَ لتوحيدهما إلا نقطةً نقطة.
   صارت تُعاد تسميتُها مرةً فتتبعها نقاطُها ودفترُ جوالها ومحاضرُها. */
function coRename(oldName, newName){
  if (!may('settings')){ toast(t('إعادةُ التسمية للمهندس وحده')); return 0; }
  oldName = String(oldName || '').trim(); newName = String(newName || '').trim();
  if (!oldName || !newName || oldName === newName){ toast(t('اكتب اسمًا جديدًا مختلفًا')); return 0; }
  var n = 0;
  (STATE.sites || []).forEach(function(x){
    if (x.co !== oldName) return;
    x.co = newName; n++;
    CORE.set('sites', x.id, { co:newName });
  });
  if (!n){ toast(t('لا نقطةَ بهذا الاسم')); return 0; }
  var tel = coTelOf(oldName);
  if (tel){ coTel()[newName] = tel; delete coTel()[oldName]; CORE.set('cfg', 'cotel', Object.assign({}, coTel())); }
  statBump();
  logEvent('إعادة تسمية شركة — ' + oldName + ' \u2192 ' + newName + ' \u00b7 ' + nm(n) + ' نقطة');
  toast(nm(n) + ' ' + t('نقطةً انتقلت إلى الاسم الجديد'));
  return n;
}

/* (V29.0) ملاحظةُ «تحديثات المنصة» #٧: بريدُ الشركة في التواصل، وإشعارُها بالبريد بصيغةٍ رسمية. البريدُ يُحفَظ في دفتر الجوالات
   نفسِه (وثيقةٌ محجوبةٌ عن الوزارة والإدارة العليا) بمفتاح «e|الشركة»، والإرسالُ يفتح بريدَ الجهاز بالصيغة الرسمية جاهزةً. */
function coEmailOf(co){ return String(coTel()['e|' + co] || '').trim(); }

function mailOfficial(kind, co, when){
  var S = coStat(co), lz = coLiaisonOf(co), kn = WA_KINDS[kind] ? WA_KINDS[kind].n : t('إشعار');
  var sub = kn + ' \u2014 ' + co + ' \u2014 ' + t('مشروع قارئات نسك') + ' ١٤٤٨هـ';
  var L = ['السادة / ' + co + '                    المحترمين', '', 'السلام عليكم ورحمة الله وبركاته،', 'تحيةً طيبةً وبعد،', ''];
  if (kind === 'plan'){ L.push('نُفيدكم بأنّ فريقَ شركة أفاقي سيباشر تركيبَ قارئات بطاقة نسك في نقاطكم ضمن مشروع وزارة الحج والعمرة لموسم ١٤٤٨هـ.'); L.push('عددُ النقاط: ' + S.n + (when ? ' — الموعدُ المتوقّع: ' + when : '') + '.'); L.push(''); L.push('نأمل التكرّمَ بتسهيل دخول الفريق إلى المواقع وتوفيرِ مصدر كهرباءٍ عند كلِّ نقطة.'); }
  else if (kind === 'hand'){ L.push('نُفيدكم بإتمام تركيب قارئات بطاقة نسك في نقاطكم وتسليمِها.'); L.push('النقاطُ المركّبةُ المعتمدة: ' + S.ins + ' من ' + S.n + '، والمُسلَّمةُ بمحضر: ' + S.hd + (when ? ' — تاريخُ التسليم: ' + when : '') + '.'); L.push(''); L.push('محاضرُ التسليم مرفقةٌ بأرقام الأجهزة وسيرياتها، ومدّةُ الضمان تبدأ من تاريخها.'); }
  else { L.push('نُفيدكم بأنّ فريقَ شركة أفاقي سيباشر فكَّ الأجهزة من نقاطكم بعد انتهاء الموسم.'); L.push('النقاطُ التي سيُفكّ منها: ' + S.ins + (when ? ' — الموعدُ المتوقّع: ' + when : '') + '.'); L.push(''); L.push('نأمل التكرّمَ بتسهيل دخول الفريق، شاكرين تعاونكم طوال الموسم.'); }
  if (lz) L.push('ونأمل التنسيقَ مع ضابط الاتصال لديكم: ' + lz + '.');
  L.push(''); L.push('وتفضّلوا بقبول فائق الاحترام والتقدير،'); L.push(''); L.push(STATE.meta.name || ''); L.push(t('مشروع قارئات نسك — شركة أفاقي'));
  return { sub:sub, body:L.join('\n') };
}

function mailGo(co, kind, when){
  if (!co){ toast(t('اختر الشركة')); return; }
  var to = coEmailOf(co); if (!to){ toast(t('لا بريدَ محفوظٌ لهذه الشركة — احفظه في الجدول أوّلًا')); return; }
  var M = mailOfficial(kind || 'plan', co, when || '');
  try { window.location.href = 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(M.sub) + '&body=' + encodeURIComponent(M.body); }
  catch (e){ toast(t('تعذّر الفتح')); return; }
  logEvent('إشعار بريد رسمي — ' + (WA_KINDS[kind] ? WA_KINDS[kind].n : kind) + ' \u00b7 ' + co);
}

function coLiaisonOf(co){ return String(coLiaison()[co] || '').trim(); }

function coStat(co){
  var n = 0, sv = 0, ins = 0, hd = 0;
  STATE.sites.forEach(function(x){
    if (x.co !== co) return;
    n++;
    if (svVisited(STATE.recs[x.id])) sv++;
    var r = STATE.inss[x.id];
    if (r && r.status === 'مُركّب' && r.approved) ins++;
    if (typeof handDone === 'function' && handDone(x.id)) hd++;
  });
  return { n:n, sv:sv, ins:ins, hd:hd };
}

function waText(kind, co, when){
  var S = coStat(co), L = ['السلام عليكم ورحمة الله'];
  L.push('قارئات أفاقي — RFID · موسم ١٤٤٨هـ');
  L.push('');
  L.push('الشركة: ' + fsiText(co));
  if (kind === 'plan'){
    L.push('نُفيدكم بأن فريقَنا سيباشر تركيبَ نقاطكم.');
    L.push('عدد النقاط: ' + S.n);
    if (when) L.push('الموعد المتوقّع: ' + when);
    L.push('');
    L.push('نرجو تسهيلَ دخول الفريق وتوفيرَ مصدر كهرباء في الموقع.');
  } else if (kind === 'hand'){
    L.push('نُفيدكم بإتمام تركيب نقاطكم وتسليمِها.');
    L.push('نقاطٌ مُركّبةٌ معتمدة: ' + S.ins + ' من ' + S.n);
    L.push('سُلِّم منها بمحضر: ' + S.hd);
    if (when) L.push('تاريخ التسليم: ' + when);
    L.push('');
    L.push('محضرُ التسليم مرفقٌ بأرقام الأجهزة وسيرياتها، ومدةُ الضمان تبدأ من تاريخه.');
  } else {
    L.push('نُفيدكم بأن فريقَنا سيباشر فكَّ الأجهزة بعد انتهاء الموسم.');
    L.push('نقاطٌ سيُفَكّ منها: ' + S.ins);
    if (when) L.push('الموعد المتوقّع: ' + when);
    L.push('');
    L.push('نرجو تسهيلَ دخول الفريق. وشكرًا لتعاونكم طوال الموسم.');
  }
  L.push('');
  L.push('وتفضلوا بقبول التحية،');
  L.push(STATE.meta.name || '');
  return L.join('\n');
}

function waGo(co, kind, when, copy){
  if (!co){ toast(t('اختر الشركة')); return; }
  var txt = waText(kind || 'plan', co, when || '');
  if (copy){
    try { if (navigator.clipboard) navigator.clipboard.writeText(txt); toast(t('نُسخ النص')); }
    catch (e){ toast(t('تعذّر النسخ')); }
    return;
  }
  var ph = coTelOf(co);
  if (!ph){ toast(t('لا جوالَ محفوظٌ لهذه الشركة — احفظه في دفتر الجوالات أوّلًا')); return; }
  try { window.open(waLink(ph, txt), '_blank', 'noopener'); }
  catch (e){ toast(t('تعذّر الفتح')); return; }
  logEvent('إشعار واتساب — ' + (WA_KINDS[kind] ? WA_KINDS[kind].n : kind) + ' \u00b7 ' + co);
  notifPush('إشعار شركة', co + ' \u00b7 ' + t(WA_KINDS[kind] ? WA_KINDS[kind].n : ''), { lv:'عادي' });
}
