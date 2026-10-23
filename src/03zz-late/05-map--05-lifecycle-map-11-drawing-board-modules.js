/* ============================================================================
   FILE    : src/03zz-late/05-map--05-lifecycle-map-11-drawing-board-modules.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/05-map/05-lifecycle-map-11-drawing-board-modules.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : dayDone, svdChals, chalOtherTexts, chalOtherCard, svdMetal, svdAvgRooms, svdRoomsOf, svdRows, svdMina, svdPool, svdCard, svdPicked, svdWhy, svdXls, svdashBody
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* ما أُنجز في يومٍ بعينه: من اللقطة المحفوظة إن وُجدت، وإلا من السجلات
   التي على هذا الجهاز — تقرؤه الوتيرةُ ولوحةُ «أمس · الآن · غدًا» معًا */
function dayDone(day){
  var snap = (STATE.stats || {})[day];
  if (snap) return { sv: snap.daySurvey || 0, ins: snap.dayInstall || 0, dis: snap.dayDismantle || 0 };
  var sv = 0, ins = 0, dis = 0;
  Object.keys(STATE.recs).forEach(function(k){
    var r = STATE.recs[k]; if (dayKey(r.at || r._at) === day && svVisited(r) && siteFind(k)) sv++; });   /* (V36.1) لا تُعَدّ زيارةُ نقطةٍ محذوفة */
  Object.keys(STATE.inss).forEach(function(k){
    var r = STATE.inss[k]; if (dayKey(r.at || r._at) === day && r.status === 'مُركّب') ins++; });
  Object.keys(STATE.diss || {}).forEach(function(k){
    var r = STATE.diss[k]; if (r && dayKey(r.at || r._at) === day && (r.status === 'تم الفك' || r.done)) dis++; });
  return { sv:sv, ins:ins, dis:dis };
}

function svdChals(r){   /* (V37.3) الفئاتُ الثماني في تفصيل المسح أيضًا — وما لم يُصنَّف «يراجع المهندس تصنيفه» */
  return chalCats(r).map(function(k){ return k === 'review' || !ccOf(k) ? 'يراجع المهندسُ تصنيفَه' : ccOf(k).n; });
}

/* النصوصُ الحرّةُ تحت «أخرى» — تُطبَّع (مسافاتٌ وتشكيلٌ وهمزات) وتُعَدّ، ليقرّر المهندسُ ما يصير خيارًا */
function chalOtherTexts(){
  var cnt = {}, raw = {};
  Object.keys(STATE.recs || {}).forEach(function(id){
    var r = STATE.recs[id]; if (!r || !(r.chals || []).some(function(c){ return chalKey(c) === 'أخرى'; })) return;
    var txt = String(r.chal_note || r.note || '').trim(); if (!txt) return;
    var k = txt.replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة\b/g, 'ه').replace(/\s+/g, ' ').toLowerCase().slice(0, 80);
    cnt[k] = (cnt[k] || 0) + 1; if (!raw[k]) raw[k] = txt.slice(0, 80);
  });
  return Object.keys(cnt).sort(function(a, b){ return cnt[b] - cnt[a]; }).map(function(k){ return { n:cnt[k], txt:raw[k] }; });
}

function chalOtherCard(){
  if (rankOf(ROLE) < rankOf('engineer')) return '';
  var L = chalOtherTexts();
  return card('ما كُتب تحت «أخرى»', '<p class="hint" style="margin-top:0">' + esc(t('الأكثرُ تكرارًا من النصوص الحرّة — لتقرّر ما يصير خيارًا في النموذج. لا يُضاف خيارٌ من تلقاء النظام.')) + '</p>'
    + (L.length ? '<table class="tbl"><thead><tr><th>' + esc(t('النص')) + '</th><th>' + esc(t('مرات')) + '</th></tr></thead><tbody>'
        + L.slice(0, 15).map(function(o){ return '<tr><td dir="auto">' + esc(o.txt) + '</td><td class="num">' + nm(o.n) + '</td></tr>'; }).join('') + '</tbody></table>'
      : '<p class="hint" style="margin:0">' + esc(t('لا نصَّ حرًّا تحت «أخرى» بعد.')) + '</p>'));
}

/* الهيكلُ والعارضة: حديدٌ يُشترى ويُجهَّز — يُفرَز وحدَه ليُخطَّط له مبكّرًا */
function svdMetal(ch){
  return ch.some(function(c){ return /^لا يوجد سطح تثبيت/.test(c) || /^العارضة/.test(c); });   /* (V37.3) واسمُ الفئة «العارضة ناقصة…» */
}

/* ═══ الغرفُ — لكلِّ غرفةٍ حساسُ حرارةٍ ورطوبة (V17.70) ═══
   عددُ الغرف ليس رقمًا للعلم: منه تُشترى الحساسات. فيُقرأ من عدِّ الميدان في
   الزيارة، وإلا من سجل الوزارة، وإلا — في منى وحدَها — متوسطُ اثنتي عشرة
   غرفةً للمخيم، ويُقال إنه مقدَّرٌ لا معدود. ومخيمُ منى الذي لم يُعَدَّ يُفرَز
   في بطاقةٍ ليُعَدَّ في الزيارة القادمة. */
function svdAvgRooms(zone){
  var v = cfgGet('avgRooms', zone);
  return v || (zone === 'منى' ? 12 : 0);
}

function svdRoomsOf(x, r){
  var f = r ? cfgN(r.tents) : 0;
  if (f) return { n:f, src:'field' };
  var g = cfgN(x.tents);
  if (g) return { n:g, src:'registry' };
  var a = x.type === 'مخيم' ? svdAvgRooms(x.zone) : 0;
  return a ? { n:a, src:'avg' } : { n:0, src:'none' };
}

function svdRows(){
  var out = [];
  (STATE.sites || []).forEach(function(x){
    var r = STATE.recs[x.id];
    if (!svVisited(r)) return;   /* (V32.6) */
    var ch = svdChals(r), rm = svdRoomsOf(x, r);
    out.push({ x:x, r:r, ch:ch, camp:x.type === 'مخيم', rooms:rm.n, src:rm.src, metal:svdMetal(ch),
               life:(typeof lifeOf === 'function' ? lifeOf(x) : '') });
  });
  return out;
}

/* مخيماتُ منى كلُّها — مُسِحت أو لم تُمسَح — لتقدير الحساسات المطلوبة للموسم */
function svdMina(){
  return (STATE.sites || []).filter(function(x){ return x.type === 'مخيم' && x.zone === 'منى'; })
    .map(function(x){ var r = STATE.recs[x.id], rm = svdRoomsOf(x, r && svDone(r) ? r : null);
      return { x:x, r:r, ch:[], camp:true, rooms:rm.n, src:rm.src, metal:false, life:(typeof lifeOf === 'function' ? lifeOf(x) : '') }; });
}

function svdPool(c){
  if (!SVD_MEMO) SVD_MEMO = { rows:svdRows(), mina:svdMina() };
  return c && c.pool === 'mina' ? SVD_MEMO.mina : SVD_MEMO.rows;
}

function svdCard(c){
  var R = svdPool(c).filter(c.f);
  var v = c.sum ? R.reduce(function(a, o){ return a + o.rooms; }, 0) : R.length;
  var on = SVD_PICK === c.k;
  return '<button class="btn ' + (on ? 'btn-primary' : 'btn-quiet') + '" data-svd="' + esc(c.k) + '"'
    + ' style="flex:1 1 160px;min-width:160px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px;text-align:start">'
    + '<span class="num" style="font-size:22px;line-height:1.1">' + nm(v)
    +   (c.of ? ' <span class="hint" style="font-size:12px">' + esc(t('من')) + ' ' + nm(c.of()) + '</span>' : '') + '</span>'
    + '<span>' + esc(t(c.t)) + '</span>'
    + (c.sum ? '<span class="hint" style="margin:0">' + esc(t('معدود')) + ' <b class="num">' + nm(R.filter(function(o){ return o.src === 'field' || o.src === 'registry'; }).reduce(function(a, o){ return a + o.rooms; }, 0)) + '</b>'
                 + ' \u00b7 ' + esc(t('مقدَّر')) + ' <b class="num">' + nm(R.filter(function(o){ return o.src === 'avg'; }).reduce(function(a, o){ return a + o.rooms; }, 0)) + '</b></span>' : '')
    + '<span class="hint" style="margin:0">' + esc(t(c.w)) + '</span></button>';
}

function svdPicked(){
  var c = SVD_CARDS.filter(function(x){ return x.k === SVD_PICK; })[0];
  return c ? svdPool(c).filter(c.f) : [];
}

function svdWhy(o){
  var rv = svNeedsRevisit(o.r) ? [t('تحتاج زيارة أخرى')] : [];   /* (V33.6) السببُ يُقال لا «لا توجد تحديات» */
  return (rv.length || o.ch.length) ? rv.concat(o.ch.map(function(c){ return t(c); })).join(' \u00b7 ') : t('لا توجد تحديات');
}

function svdXls(){
  var c = SVD_CARDS.filter(function(x){ return x.k === SVD_PICK; })[0];
  if (!c) return;
  var out = [['رقم الشاخص / الاسم','المعرّف','الاسم','المشعر','النوع','الشركة','المربع','الشاخص','الغرف/الخيام','مصدر العدد','الحالة','التحديات','مَن زار','متى','خط العرض','خط الطول']];
  svdPicked().forEach(function(o){
    out.push([siteKey(o.x), o.x.id, o.x.name || '', o.x.zone || '', o.x.type || '', o.x.co || '', o.x.sq || '', o.x.sign || '',
              o.rooms || '', SVD_SRC[o.src] || '', (LIFE[o.life] && LIFE[o.life].n) || '',
              o.ch.join(' | ') || (o.r ? 'لا توجد تحديات' : ''), (o.r && o.r.by) || '', o.r ? dayKey(o.r.at || 0) : '',
              o.x.lat || '', o.x.lng || '']);
  });
  xlsSheets([[t(c.t).slice(0, 28), out]], 'أفاقي — ' + t(c.t));
}

function svdashBody(){
  SVD_MEMO = null;
  var R = svdPool(), c = SVD_CARDS.filter(function(x){ return x.k === SVD_PICK; })[0];
  var rooms = R.reduce(function(a, o){ return a + (o.camp ? o.rooms : 0); }, 0);
  var byCh = {};
  R.forEach(function(o){ o.ch.forEach(function(x){ byCh[x] = (byCh[x] || 0) + 1; }); });
  var chTop = Object.keys(byCh).sort(function(a, b){ return byCh[b] - byCh[a]; });
  var L = svdPicked();
  return card('ما حُصر حتى الآن',
      '<p class="hint" style="margin-top:0">'
      + esc(t('من سجلات الزيارة نفسِها — ما لم تُسجَّل زيارتُه لا يُعَدُّ هنا. اضغط أيَّ بطاقةٍ لتفتح قائمتَها.')) + '</p>'
      + '<div class="wt-row" style="flex-wrap:wrap;gap:8px;align-items:stretch">'
      +   SVD_CARDS.map(svdCard).join('')
      + '</div>'
      + '<p class="hint" style="margin:8px 0 0">' + esc(t('نقاطٌ تمت زيارتها')) + ' <b class="num">' + nm(R.length) + '</b>'
      +   ' \u00b7 ' + esc(t('غرفةٌ وخيمةٌ محصورة')) + ' <b class="num">' + nm(rooms) + '</b></p>'
      /* المتوسطُ يُضبَط حيث يُقرأ (V17.71) — لا في شاشةٍ بعيدة */
      + (may('settings')
          ? '<div class="field" style="max-width:300px;margin:8px 0 0"><label>' + esc(t('متوسطُ غرف مخيم منى — حين لا يُعَدّ')) + '</label>'
            + cfgInput('avgRooms', 'منى', { dec:0 })
            + '<p class="hint" style="margin:4px 0 0">' + esc(t('فارغٌ يعني اثنتي عشرة غرفة')) + '</p></div>'
          : ''))
    + (chTop.length
        ? card('التحدياتُ بأنواعها',
            table(['التحدي','النقاط'], chTop.map(function(x){ return [esc(t(x)), N(byCh[x])]; }))
            + '<p class="hint">' + esc(t('نقطةٌ واحدةٌ قد تحمل أكثرَ من تحدٍّ — فمجموعُ الأسطر أكبرُ من عدد النقاط.')) + '</p>')
        : '')
    + (c
        ? card(c.t,
            '<div class="actions" style="margin:0 0 8px">'
            + btn('\u2913 ' + t('تصدير القائمة'),'btn-secondary btn-sm',' data-svdxls="1"')
            + btn(t('إغلاق القائمة'),'btn-quiet btn-sm',' data-svd="' + esc(c.k) + '"')
            + '</div>'
            + (L.length
                ? table(['المعرّف','المشعر','الغرف','الحالة','ما فيها','مَن زار','متى',''],
                    L.slice(0, 400).map(function(o){
                      var lf = LIFE[o.life];
                      return [siteIdHtml(o.x)
                                + (o.x.name ? '<br><span class="hint" style="margin:0">' + esc(o.x.name) + '</span>' : ''),
                              esc(t(o.x.zone || '')) + '<br><span class="hint" style="margin:0">' + esc(t(o.x.type || '')) + '</span>',
                              (o.rooms ? N(o.rooms) : '\u2014')
                                + (o.camp ? '<br><span class="hint" style="margin:0">' + esc(t(SVD_SRC[o.src] || '')) + '</span>' : ''),
                              lf ? '<span class="pill" style="border-color:' + esc(lf.c) + ';color:' + esc(lf.c) + '">' + esc(t(lf.n)) + '</span>' : '\u2014',
                              '<span class="hint" style="margin:0">' + esc(o.r ? svdWhy(o) : t('لم تُزر بعد')) + '</span>',
                              esc((o.r && o.r.by) || '\u2014'), esc(o.r ? dayKey(o.r.at || 0) : '\u2014'),
                              btn('\u{1F5FA} ' + t('على الخريطة'),'btn-quiet btn-sm',' data-fly="' + esc(o.x.id) + '"')];
                    }))
                  + (L.length > 400 ? '<p class="hint">' + esc(t('عُرض أوّلُ أربعمئة — والتصديرُ يشمل الكلَّ.')) + '</p>' : '')
                : alertBox('info','لا نقاطَ في هذه البطاقة بعد.')))
        : '');
}
