/* ============================================================================
   FILE    : src/06-ministry/06-ext-camps-03-nusuk-card-system.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Nusuk card system bridge: bulk linking, signal status, overview sheet, point status card, setup bar.
   DEFINES : extTokLoad, extTokSave, extTokClear, extFetch, extReadersLoad, extTentsLoad, extOvLoad, extOvCard, extStatBox, extTokCard, extMatchLoad, mtCamps, extSerKey, extCodeKey … (+65 more)
   GLOBALS : EXT, EXT_API, EXT_STREAM, EXT_LIVE, EXT_LIVE_KEY, EXT_MATCH_STATE, EXT_OV_LOADED
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

var EXT_LIVE  = 'https://livefeed.nusukcard.net';
var EXT_LIVE_KEY = 'DJsowqfnR2qlP32BzySo_8hNUy3Wypn2xFBzCcPELlo';

/* ── حفظ توكن جديد ── */
function extTokSave(tok){
  if (!may('settings')){ toast(t('التوكنُ للمهندس وحدَه')); return; }
  var t0 = String(tok || '').trim();
  if (!t0){ toast(t('لصق التوكن أوّلًا')); return; }
  var expAt = 0;
  try {
    var pl = JSON.parse(atob(t0.split('.')[1]));
    expAt = (pl.exp || 0) * 1000;
  } catch(e){}
  EXT.tok = t0; EXT.expAt = expAt;
  CORE.set('cfg', 'extApi', { tok:t0, expAt:expAt, updAt:Date.now() }); CORE.saveSoon();
  toast(t(expAt ? ('حُفظ التوكن — يصلح حتى ' + new Date(expAt).toLocaleDateString('ar')) : 'حُفظ التوكن'));
  render(1);
}

/* ── مسح التوكن ── */
function extTokClear(){
  if (!may('settings')) return;
  EXT.tok = null; EXT.expAt = 0;
  CORE.set('cfg', 'extApi', { tok:'', expAt:0, updAt:Date.now() }); CORE.saveSoon();
  toast(t('مُسح التوكن'));
  render(1);
}

/* ── كارت الإشغال ── */
function extOvCard(tentCode, ov, readerInfo, tentMeta){
  var cap   = (ov.occupancyStatus || {}).totalCapacity || 0;
  var wCard = (ov.occupancyStatus || {}).currentlyOccupied || 0;
  var woCard= (ov.occupancyStatus || {}).withoutBracelet || 0;
  var other = (ov.occupancyStatus || {}).fromOtherCamps || 0;
  var total = wCard + woCard + other;
  var pct   = cap ? Math.round(total / cap * 100) : 0;
  var barC  = pct >= 75 ? '#27AE60' : pct >= 40 ? '#E2B33C' : '#C0392B';
  var insideT = ((ov.averageTime || {}).insideCamp  || '—');
  var transitT= ((ov.averageTime || {}).transitTime || '—');

  /* آخر إشارة القارئ */
  var lastSeen = '', lastOk = false;
  if (readerInfo && readerInfo.timestamp){
    var ms = Date.now() - new Date(readerInfo.timestamp).getTime();
    var mins = Math.floor(ms/60000);
    lastOk = mins < 30;
    lastSeen = mins < 2 ? t('الآن') : mins < 60 ? nm(mins) + ' ' + t('د') : nm(Math.floor(mins/60)) + ' ' + t('س');
  }

  var group = (tentMeta && tentMeta.tentGroup) ? tentMeta.tentGroup : '';
  var op    = (tentMeta && tentMeta.serviceOperators && tentMeta.serviceOperators[0]) ? tentMeta.serviceOperators[0] : '';

  return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid ' + barC + '">'
    + '<div class="card-body">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px">'
    +   '<div><b class="num" style="font-size:18px">' + bdiText(tentCode) + '</b>'
    +   (group ? ' <span class="hint" style="font-size:13px">— ' + esc(group) + '</span>' : '')
    +   (op ? '<div class="hint" style="font-size:12px;margin-top:2px">' + esc(op) + '</div>' : '') + '</div>'
    +   '<div style="text-align:end">'
    +     '<div class="num" style="font-size:28px;font-weight:800;color:' + barC + '">' + nm(pct) + '%</div>'
    +     (lastSeen ? '<div class="hint" style="font-size:12px">'
    +       '<span style="width:8px;height:8px;border-radius:50%;display:inline-block;background:' + (lastOk ? '#27AE60' : '#E2B33C') + ';margin-inline-end:4px"></span>'
    +       esc(t('آخر إشارة')) + ' ' + lastSeen + '</div>' : '') + '</div>'
    + '</div>'
    + '<div style="background:var(--surface-2);border-radius:8px;height:8px;overflow:hidden;margin-bottom:10px">'
    +   '<div style="height:100%;width:' + Math.min(100,pct) + '%;background:' + barC + ';transition:width .4s"></div></div>'
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">'
    +   extStatBox(t('السعة'), nm(cap), '#5B6E7C')
    +   extStatBox(t('بكروت'), nm(wCard), '#2E86DE')
    +   extStatBox(t('بدون'), nm(woCard), '#E2B33C')
    +   extStatBox(t('من أخرى'), nm(other), '#8E44AD')
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">'
    +   '<div><span class="hint">' + esc(t('داخل المخيم')) + '</span> <b>' + esc(insideT) + '</b></div>'
    +   '<div><span class="hint">' + esc(t('وقت العبور')) + '</span> <b>' + esc(transitT) + '</b></div>'
    + '</div>'
    + '</div></div>';
}
function extStatBox(label, val, color){
  return '<div style="background:var(--surface-2);border-radius:8px;padding:6px 8px;text-align:center">'
    + '<div class="num" style="font-size:16px;font-weight:800;color:' + color + '">' + val + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + esc(label) + '</div></div>';
}

/* ── بطاقة إعداد التوكن (للمهندس) ── */
function extTokCard(){
  var expMsg = '', expColor = '#27AE60';
  if (EXT.tok && EXT.expAt){
    var rem = EXT.expAt - Date.now();
    var days = Math.floor(rem / 86400000);
    if (rem < 0){ expMsg = t('انتهى التوكن — جدّده الآن'); expColor = '#C0392B'; }
    else if (days < 1){ expMsg = t('ينتهي خلال ساعات — جدّده'); expColor = '#E2B33C'; }
    else { expMsg = t('ينتهي بعد') + ' ' + nm(days) + ' ' + t('يوم'); }
  }
  var h = '<div class="card" style="margin:0 0 12px"><div class="card-body">'
    + '<div style="font-weight:700;margin-bottom:8px">🔑 ' + esc(t('ربط نظام البطاقات')) + '</div>';
  if (EXT.tok){
    h += '<div style="margin-bottom:8px;font-size:13px">'
      + '<span style="color:' + expColor + '">●</span> '
      + esc(expMsg) + '</div>'
      + btn('\u267B ' + t('تجديد التوكن'), 'btn-secondary btn-sm', ' data-exttokclear="1"');
  } else {
    h += '<p class="hint" style="font-size:13px;margin:0 0 8px">'
      + esc(t('افتح nusukcard.net ← Console في المتصفح ← شغّل:')) + '</p>'
      + '<code style="font-size:11px;display:block;background:var(--surface-2);padding:6px;border-radius:6px;direction:ltr;word-break:break-all;margin-bottom:8px">'
      + esc('copy(local' + "Storage.getItem('mj.accessToken'))")
      + '</code>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
      + '<input id="extTokInp" type="password" dir="ltr" autocomplete="off" placeholder="eyJ…" style="flex:1;min-width:0;font-size:12px" />'
      + btn(t('حفظ'), 'btn-primary btn-sm', ' data-exttoksave="1"') + '</div>';
  }
  h += '</div></div>';
  return h;
}

   

   /* {tentId: true} جُلبت بالفعل */
function mtCamps(){
  extBridgePendingApply();   /* (V37.94) ما جاءت به الإشارةُ المرجعية */
  /* أوّل مرة: حمّل التوكن من السحابة */
  if (!EXT.tok && !EXT._tokAsked){ EXT._tokAsked = true; extTokLoad(); }

  var h = '';

  /* بطاقة الإعداد — للمهندس فقط */
  extBridgeLoad();   /* (V37.93) آخرُ جسرٍ محفوظ — لكلِّ الحسابات */
  /* (V38.13) «باعمل اسكرول كتير أوي»: الإعدادُ والبياناتُ (الجسر · ١٤٤٧ · خارج الخريطة · التوكن) شريطٌ واحدٌ
     يُفتَح منه قسمٌ واحدٌ عند الطلب، والحالةُ أوّلًا قائمةً مضغوطة، والمقترحاتُ تُعرَض عند الطلب */
  var setup = may('settings') ? extSetupBar() : '';
  if (!EXT.tok && !EXT.bridge){
    return h + setup + (may('settings') ? '' : extSnapView());   /* (V37.81) (V37.93) */
  }

  /* تحميل المطابقات */
  if (!EXT_MATCH_STATE || EXT.busy){
    if (!EXT.busy) extMatchLoad();
    return h + '<div class="hint" style="text-align:center;padding:20px">⟳ ' + esc(t('جارٍ تحميل بيانات المخيمات…')) + '</div>';
  }

  if (EXT.err) h += alertBox('warn', t('خطأ في تحميل البيانات') + ': ' + EXT.err);

  var matched = EXT_MATCH_STATE.matched;
  var unmatched = EXT_MATCH_STATE.unmatched;

  /* (V38.12) حالةُ النقاط أوّلًا (V38.13)، ثم الربطُ الجماعيّ، ثم شريطُ الإعداد */
  h += extStatusCard() + extBulkCard() + setup;

  /* قسم غير مطابق مطويّ */
  if (unmatched.length){
    h += mtDetails(t('قرّاء مُركَّبة لكن غير مطابقة في نظامهم') + ' (' + nm(unmatched.length) + ')',
      '<div class="hint" style="font-size:12px">' + unmatched.map(function(s){ return '<code>' + esc(s) + '</code>'; }).join(' · ') + '</div>', '📡');
  }

  return h;
}

/* ═══ (V37.80) سيريالُ القارئ من سجلّ التركيب ═══
   السيريالاتُ تُحفَظ بمفتاح القطعة (ins.serials[code]) — قطعةُ القارئ رمزُها يبدأ بـ rdr أو اسمُها «قارئ». */

function pilotRowsList(){
  pilotKick();
  return pilotSites().map(function(x){
    var ins = STATE.inss[x.id], f = (typeof trialForSite === 'function') ? trialForSite(x.id) : null;
    var nt = pilotNet(x), nk = pilotNusuk(x);
    var insSt = !ins ? 'لم يُركَّب' : ins.status === 'مسودّة' ? 'مسودّة' : (ins.status || '') + ' · ' + (ins.approved ? 'معتمد' : 'بانتظار التدقيق');
    return [x.id, x.name || '', t(x.zone || ''), t(x.type || ''), f ? (f.row.n || '') + (f.row.out ? ' · ' + t(f.row.out) : '') : '\u2014',
            t(insSt), ins && ins.status !== 'مسودّة' ? String(insRevs(ins).length + 1) : '\u2014',
            t(nt.st) + (nt.n > 1 ? ' (' + nt.up + '/' + nt.n + ')' : '') + (nt.src ? ' \u00b7 ' + t(nt.src) : ''), pilotAgo(nt.at),
            nk.ser || (ins ? t('لا سيريال قارئ') : '\u2014'), extCheckText(nk),   /* (V37.85) التحقق */ (nk.loc ? nk.loc + (nk.snap ? ' \u00b7 ' + t('لقطة') : '') : '') || (nk.ser ? (EXT.readers || (STATE.extSnap && !may('settings')) ? t('غير ظاهر في نظام البطاقات') : may('settings') ? t('يُحمَّل…') : t('لا لقطةَ بعد')) : '\u2014'),
            nk.at ? pilotAgo(nk.at) : '\u2014', nk.occ || '\u2014'];
  });
}

/* عرضُ اللقطة لمن لا يملك التوكن — بالكارت نفسِه */
function extSnapView(){
  var S = STATE.extSnap; extSnapLoad();
  if (!S || !S.sites) return alertBox('info', t('لا لقطةَ بعد — تظهر الأرقامُ هنا بعد أول فتحٍ لهذه الشاشة من جهاز المكتب.'));
  var age = pilotAgo(S.at), old = Date.now() - (+S.at || 0) > 30 * 60000;
  var h = alertBox(old ? 'warn' : 'info', t('لقطةٌ من جهاز المكتب') + ' \u00b7 ' + t('آخر تحديث') + ' ' + age + (old ? ' \u2014 ' + t('قديمة: تتجدّد حين يفتح المكتبُ الشاشة') : ''));
  var seen = {};
  Object.keys(S.sites).forEach(function(id){
    var z = S.sites[id], c = S.camps && S.camps[z.code];
    if (!c || seen[z.code]) return; seen[z.code] = 1;
    h += extOvCard(z.code, { occupancyStatus:{ totalCapacity:c.cap, currentlyOccupied:c.w, withoutBracelet:c.wo, fromOtherCamps:c.ot },
                             averageTime:{ insideCamp:c.inT || '\u2014', transitTime:c.trT || '\u2014' } },
                   z.ts ? { timestamp:z.ts } : null, { tentGroup:c.grp || '' });
  });
  return h;
}

function extNkSave(id, val){
  if (!may('settings')){ toast(t('الربطُ للمهندس فما فوق')); return; }
  var x = siteFind(id); if (!x) return;
  var v = String(val == null ? '' : val).trim(), key = extNameKey(v);
  if (v){
    var other = extLinkedBy()[key];
    if (other && other !== id){ toast(t('هذا الاسمُ مربوطٌ بالنقطة') + ' ' + other); return; }
    var M = extNames();
    if (M && !M[key] && !confirm(t('الاسمُ غيرُ ظاهرٍ في نظام البطاقات الآن. يُحفَظ على أيِّ حال؟'))){ toast(t('لم يُحفَظ')); return; }
  }
  x.nk = v; siteOvSet(id, { nk:v, nkAt:Date.now(), nkBy:STATE.meta.name || '' });
  EXT_MATCH_STATE = null;
  logEvent(v ? 'ربطُ نقطةٍ بنظام البطاقات — ' + id + ' ← ' + v : 'فكُّ ربط نقطةٍ بنظام البطاقات — ' + id, id);
  toast(t(v ? 'رُبطت النقطة' : 'فُكَّ الربط')); render(1);
}

/* ═══ (V37.87) الربطُ الجماعيّ — جدولُ غير المربوط بمقترحه، واعتمادٌ بضغطة ═══
   ١٨٠٠ نقطةٍ لا تُربَط واحدةً واحدة. يُقترح لكلِّ نقطةٍ غيرِ مربوطة اسمُها من الشاخص (المخيمات)
   أو من موقع قارئها؛ وما تزاحم عليه اقتراحان أو كان مربوطًا بغيرها لا يُعتمَد آليًّا بل يُعرَض
   تعارضًا يُحسَم بيد. ويُكشف المربوطُ باسمٍ لم يعد في النظام. */
function extBulkPlan(){
  var M = extNames(); if (!M) return null;
  var linked = extLinkedBy(), want = {}, P = { apply:[], conflicts:[], linked:0, unlinked:0, noSug:0, stale:[] };
  (STATE.sites || []).forEach(function(x){
    if (!x) return;
    if (x.nk){ P.linked++; if (!M[extNameKey(x.nk)]) P.stale.push(x.id); return; }
    P.unlinked++;
    var sgs = extSuggestSrc(x); if (!sgs){ P.noSug++; return; }
    var sg = sgs.v, k = extNameKey(sg);
    (want[k] = want[k] || []).push({ id:x.id, name:x.name || x.id, type:x.type || '', zone:x.zone || '', sug:sg, src:sgs.src });
  });
  Object.keys(want).forEach(function(k){
    var L = want[k];
    if (L.length > 1 || linked[k]) P.conflicts.push({ name:L[0].sug, ids:L.map(function(z){ return z.id; }).concat(linked[k] ? [linked[k] + ' \u2713'] : []) });
    else P.apply.push(L[0]);
  });
  return P;
}
function extBulkCard(){
  if (!may('settings')) return '';
  var P = extBulkPlan();
  if (!P) return card('الربط الجماعي بنظام البطاقات', '<p class="hint" style="margin:0">' + esc(t('يُحمَّل…')) + '</p>');
  var body = stats([['مربوطة', N(P.linked), 'ok'], ['غير مربوطة', N(P.unlinked)], ['لها اقتراح', N(P.apply.length), 'acc'], ['تعارض', N(P.conflicts.length), P.conflicts.length ? 'wrn' : '']]);
  if (P.apply.length){
    body += '<div class="actions" style="margin:8px 0 0">' + btn('\u2713 ' + t('اعتمد المقترحات') + ' (' + nm(P.apply.length) + ')', 'btn-primary btn-sm', ' data-nkbulk="1"')
      + btn((EXT.sugOpen ? '\u25B2 ' + t('أخفِ المقترحات') : '\u25BC ' + t('اعرض المقترحات')), 'btn-quiet btn-sm', ' data-sugopen="1"') + '</div>';   /* (V38.13) */
    if (EXT.sugOpen) body += table(['النقطة', 'النوع', 'الاقتراح', 'المصدر'], P.apply.slice(0, 50).map(function(z){
      return ['<bdi>' + esc(z.id) + '</bdi><br><span class="hint" style="margin:0">' + esc(z.name) + '</span>', esc(t(z.type)), '<b dir="ltr">' + esc(z.sug) + '</b>', esc(t(z.src))];
    })) + (P.apply.length > 50 ? '<p class="hint" style="margin:4px 0 0">' + esc(t('والباقي')) + ' ' + nm(P.apply.length - 50) + '</p>' : '');
  } else body += '<p class="hint" style="margin:6px 0 0">' + esc(t('لا مقترحاتٍ جديدة — كلُّ ما له اقتراحٌ مربوط')) + '</p>';
  if (P.conflicts.length) body += mtDetails(t('تعارضٌ يُحسَم بيد') + ' (' + nm(P.conflicts.length) + ')',
    table(['الاسم في النظام', 'النقاط'], P.conflicts.slice(0, 60).map(function(c){ return ['<b dir="ltr">' + esc(c.name) + '</b>', esc(c.ids.join(' \u00b7 '))]; })), '\u26A0');
  /* (V37.95) الاكتشافُ العكسيّ: مواقعُ في النظام لا تقابلها نقطةٌ عندنا — نقاطٌ ناقصةٌ من سجلّنا أو ركّبها غيرُنا */
  var M = extNames(), linked = extLinkedBy(), gaps = [];
  if (M) Object.keys(M).forEach(function(k){ if (!linked[k] && !(M[k].tent && extTentByCode(M[k].name) && (STATE.sites || []).some(function(x){ return x.type === 'مخيم' && x.sign && extCodeKey(x.sign) === extCodeKey(M[k].name) && extTentForSite(x); }))) gaps.push(M[k]); });
  if (gaps.length) body += mtDetails(t('مواقعُ في النظام لا تقابلها نقطةٌ عندنا') + ' (' + nm(gaps.length) + ')',
    '<p class="hint" style="margin:0 0 6px">' + esc(t('قرّاءٌ وخيامٌ مسجَّلةٌ عندهم ولم تُربَط بنقطةٍ في سجلّنا — إمّا ناقصةٌ من السجلّ أو خارج نطاقنا')) + '</p>'
    + '<div class="hint" style="font-size:12px" dir="ltr">' + gaps.slice(0, 150).map(function(g){ return esc(g.name) + (g.rd.length ? ' (' + g.rd.length + ')' : ''); }).join(' \u00b7 ') + (gaps.length > 150 ? ' \u2026' : '') + '</div>', '\u{1F50D}');
  if (P.stale.length) body += mtDetails(t('مربوطةٌ باسمٍ غيرِ موجودٍ في النظام') + ' (' + nm(P.stale.length) + ')',
    '<div class="hint" style="font-size:12px">' + P.stale.slice(0, 80).map(function(id){ return '<bdi>' + esc(id) + '</bdi>'; }).join(' \u00b7 ') + '</div>', '\u26A0');
  return card('الربط الجماعي بنظام البطاقات', body);
}
function extBulkApply(){
  if (!may('settings')){ toast(t('الربطُ للمهندس فما فوق')); return; }
  var P = extBulkPlan(); if (!P || !P.apply.length){ toast(t('لا مقترحاتٍ جديدة — كلُّ ما له اقتراحٌ مربوط')); return; }
  if (!confirm(t('تُربَط') + ' ' + P.apply.length + ' ' + t('نقطةً بأسمائها المقترحة. متابعة؟'))){ toast(t('لم يُربَط شيء — أُلغي')); return; }
  var by = STATE.meta.name || '', at = Date.now();
  P.apply.forEach(function(z){ var x = siteFind(z.id); if (!x) return; x.nk = z.sug; siteOvSet(z.id, { nk:z.sug, nkAt:at, nkBy:by, nkSrc:z.src }); });
  EXT_MATCH_STATE = null;
  logEvent('ربطٌ جماعيٌّ بنظام البطاقات — ' + P.apply.length + ' نقطة · تعارض ' + P.conflicts.length);
  toast(t('رُبطت') + ' ' + nm(P.apply.length) + ' ' + t('نقطة')); render(1);
}

function ex47Apply(){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  var P = EXT.ex47, ids = P ? Object.keys(P.set) : []; if (!ids.length){ toast(t('لا شيءَ يُعتمَد')); return; }
  if (!confirm(t('تُحفَظ بياناتُ ١٤٤٧ لـ') + ' ' + ids.length + ' ' + t('نقطةً، ويُحفَظ ما خارج السجلّ') + ' (' + (P.orph || []).length + ') ' + t('بعَلَم «ليست على الخريطة». متابعة؟'))){ toast(t('لم يُحفَظ — أُلغي')); return; }
  var at = Date.now(), by = STATE.meta.name || '';
  ids.forEach(function(id){ var x = siteFind(id); if (!x) return; var v = Object.assign({ by:by, imp:at }, P.set[id]); x.ex47 = v; siteOvSet(id, { ex47:v }); });
  ex47OrphMerge(P.orph || [], ids.map(function(id){ return extNameKey(P.set[id].nm); }));   /* (V37.92) ما خارج السجلّ يُحفَظ ببياناته وعَلَمِه */
  logEvent('استيرادُ بيانات موسم ١٤٤٧ — ' + ids.length + ' نقطة · خارج الخريطة ' + (P.orph || []).length);
  EXT.ex47 = null; toast(t('حُفظت بياناتُ ١٤٤٧') + ' (' + nm(ids.length) + ')'); render(1);
}
function ex47Card(){
  if (!may('settings')) return '';
  var have = (STATE.sites || []).filter(function(x){ return x && x.ex47; }).length, P = EXT.ex47, body;
  body = '<p class="hint" style="margin:0 0 8px">' + esc(t('ملف «تسليمات الممرات» كما هو: يُقرأ على جهازك وحدَه، ويُحفَظ لكلِّ نقطةٍ سيريالاتُها وشبكتُها — بلا كلمات مرورٍ ولا شرائح.')) + '</p>'
    + '<div class="pop-rows" style="margin:0"><div><span class="k">' + esc(t('نقاطٌ لها بياناتُ ١٤٤٧')) + '</span><span class="num">' + nm(have) + '</span></div></div>';
  if (P){
    var ids = Object.keys(P.set), wr = ids.filter(function(id){ return P.set[id].rdr; }).length;
    body += stats([['مخيماتٌ في الملف', N(P.campsN)], ['ممراتٌ ونقاطٌ أخرى', N(P.pathsN)], ['طابقت نقاطَنا', N(ids.length), 'ok'], ['لها سيريالُ قارئ', N(wr), 'acc'],
                   ['مخيمٌ رقمُه ليس في سجلّنا', N(P.miss.length), P.miss.length ? 'wrn' : ''], ['خارج سجلّنا', N(P.out.length)]])
      + (P.dup ? '<p class="hint" style="margin:4px 0 0">' + esc(t('صفوفٌ إضافيةٌ لنقاطٍ مكرَّرة تُحفَظ ضمن النقطة نفسِها')) + ': ' + nm(P.dup) + '</p>' : '')
      + (P.scrub ? '<p class="hint" style="margin:4px 0 0;color:#E2B33C">\u26A0 ' + esc(t('قيمٌ أُسقطت لأنها تشبه كلماتِ مرورٍ في خانات السيريال')) + ': ' + nm(P.scrub) + '</p>' : '')
      + (P.miss.length ? mtDetails(t('مخيمٌ رقمُه ليس في سجلّنا') + ' (' + nm(P.miss.length) + ')', '<div class="hint" style="font-size:12px" dir="ltr">' + P.miss.slice(0, 200).map(function(z){ return esc(z); }).join(' \u00b7 ') + '</div>', '\u26A0') : '')
      + (P.out.length ? mtDetails(t('خارج سجلّنا — الحرم والجمرات ومزدلفة وما لم يُعرَف') + ' (' + nm(P.out.length) + ')', '<div class="hint" style="font-size:12px" dir="ltr">' + P.out.slice(0, 200).map(function(z){ return esc(z); }).join(' \u00b7 ') + '</div>', '\u2139') : '')
      + '<div class="actions" style="margin:8px 0 0">' + btn('\u2713 ' + t('اعتمد بيانات ١٤٤٧') + ' (' + nm(ids.length) + ')', 'btn-primary btn-sm', ' data-ex47ok="1"') + '</div>';
  }
  body += '<label class="btn btn-secondary btn-sm" style="margin-top:8px;display:inline-flex">\u{1F4C2} ' + esc(t(P ? 'اختر ملفًّا آخر' : 'اختر ملف تسليمات الممرات')) + '<input type="file" accept=".xlsx,.xls" data-ex47="1" style="display:none"></label>';
  return card('بيانات موسم ١٤٤٧ — الأجهزةُ نفسُها هذا الموسم', body);
}

/* ═══ (V37.92) نقاطُ ملف ١٤٤٧ خارج السجلّ — تُحفَظ بعَلَم «ليست على الخريطة» ═══
   طلبُ المالك: «أيُّ حاجةٍ خارج السجلّ اسمح إنها تتضاف وادِّيها عَلَمًا يعرّفني إنها مش على الخريطة،
   أو قولّي اربطها بنقطةٍ على الخريطة». فلا تُرمى: تُحفَظ ببيانات أجهزتها في settings/ex47orph، ولكلٍّ منها
   طريقان: «اربطها بنقطة» (تنتقل بياناتُها إلى نقطةٍ قائمة) أو «ضعها على الخريطة» (نموذجُ نقطةٍ جديدةٍ
   معبّأٌ يُختار موضعُه بالخريطة، وتُحمَل بياناتُها إليها). ولا تدخل السجلَّ بلا موضعٍ — فلا تشوّه الخريطةَ ولا الأرقام. */
function ex47OrphLoad(){
  if (!FB.ready || !FB.db || !may('settings')) return;
  if (EXT._orAt && Date.now() - EXT._orAt < 60000) return;
  EXT._orAt = Date.now();
  DB.col('settings').doc('ex47orph').get().then(function(doc){
    var d = (doc && doc.exists) ? doc.data() : null;
    STATE.ex47orph = (d && Array.isArray(d.rows)) ? d.rows : [];
    if (CUR === 'mfu') render(1);
  }).catch(function(e){ softErr('نقاط ١٤٤٧ خارج الخريطة', e, ''); });
}
function ex47OrphSave(rows){
  STATE.ex47orph = rows;
  CORE.set('cfg', 'ex47orph', { rows:rows, at:Date.now(), by:STATE.meta.name || '' }); CORE.saveSoon();
}
function ex47OrphMerge(add, matchedKeys){
  var cur = (STATE.ex47orph || []).slice(), seen = {}, mk = {};
  (matchedKeys || []).forEach(function(k){ mk[k] = 1; });
  cur = cur.filter(function(o){ return !mk[extNameKey(o.nm)]; });
  cur.forEach(function(o){ seen[extNameKey(o.nm)] = 1; });
  add.forEach(function(o){ var k = extNameKey(o.nm); if (!seen[k]){ seen[k] = 1; cur.push(o); } });
  ex47OrphSave(cur);
}
function ex47OrphFind(nm){ return (STATE.ex47orph || []).filter(function(o){ return extNameKey(o.nm) === extNameKey(nm); })[0] || null; }
function ex47OrphDrop(nm){ ex47OrphSave((STATE.ex47orph || []).filter(function(o){ return extNameKey(o.nm) !== extNameKey(nm); })); }
/* اقتراحُ نقطةٍ للربط: المخيمُ بشاخصٍ يشترك في الشارع، والنقطةُ باسمٍ يحتوي اسمَها */
function ex47OrphGuess(o){
  if (o.kind === 'camp' && o.sign){
    var st = o.sign.split('/')[1];
    var L = (STATE.sites || []).filter(function(x){ return x.type === 'مخيم' && x.zone === 'منى' && x.sign && String(x.sign).split('/')[1] === st && !x.ex47; });
    return L.length === 1 ? L[0] : null;
  }
  var k = extNameKey(o.nm); if (k.length < 5) return null;
  return (STATE.sites || []).filter(function(x){ return x.type !== 'مخيم' && extNameKey(x.name).indexOf(k) > -1; })[0] || null;
}
function ex47OrphLink(nm, siteId){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  var o = ex47OrphFind(nm), x = siteFind(String(siteId || '').trim());
  if (!o){ toast(t('لا شيءَ يُعتمَد')); return; }
  if (!x){ toast(t('اكتب معرِّفَ نقطةٍ موجودة — مثال NSK-MIN-CMP-0449')); return; }
  var v = { nm:o.nm, rtr:o.rtr, rdr:o.rdr, cam:o.cam, net:o.net, eng:o.eng, at:o.at, ready:o.ready || '', crane:o.crane || '', maint:o.maint || '', by:STATE.meta.name || '', imp:Date.now(), linked:1 };
  x.ex47 = v; siteOvSet(x.id, { ex47:v }); ex47OrphDrop(nm);
  logEvent('ربطُ نقطةٍ من ملف ١٤٤٧ بنقطةٍ على الخريطة — ' + nm + ' ← ' + x.id, x.id);
  toast(t('رُبطت') + ' ' + nm + ' \u2190 ' + x.id); render(1);
}
function ex47OrphPlace(nm){
  if (!may('settings')){ toast(t('الاستيرادُ للمهندس فما فوق')); return; }
  var o = ex47OrphFind(nm); if (!o){ toast(t('لا شيءَ يُعتمَد')); return; }
  var camp = o.kind === 'camp';
  NEWSITE.zone = /arafat|عرفات/i.test(o.nm) ? 'عرفات' : (/jamarat|الجمرات/i.test(o.nm) ? 'الجمرات' : 'منى');
  NEWSITE.type = camp ? 'مخيم' : 'ممر';
  NEWSITE.sign = camp ? (o.sign || '') : ''; NEWSITE.nm = camp ? '' : o.nm;
  NEWSITE.lat = +o.lat || 0; NEWSITE.lng = +o.lng || 0; NEWSITE.byMap = !!(o.lat && o.lng);
  NEWSITE.note = t('من ملف تسليمات ١٤٤٧') + ': ' + o.nm;
  NEWSITE.ex47 = { nm:o.nm, rtr:o.rtr, rdr:o.rdr, cam:o.cam, net:o.net, eng:o.eng, at:o.at, ready:o.ready || '', crane:o.crane || '', maint:o.maint || '', by:STATE.meta.name || '', imp:Date.now() };
  NEWSITE.orph = o.nm;
  toast(t(o.lat && o.lng ? 'موضعُها من الملف — راجع البيانات واحفظ' : 'اختر موضعَها على الخريطة ثم احفظ'));
  goPage('newsite');
}
function ex47OrphCard(){
  if (!may('settings')) return '';
  if (!STATE.ex47orph) { ex47OrphLoad(); return ''; }
  var L = STATE.ex47orph; if (!L.length) return '';
  var opts = (STATE.sites || []).map(function(x){ return '<option value="' + esc(x.id) + '">' + esc(x.name || '') + '</option>'; }).join('');
  var rows = L.slice(0, 60).map(function(o, i){
    var gs = ex47OrphGuess(o), k = esc(o.nm);
    return [ '<b dir="ltr">' + esc(o.nm) + '</b><br>' + pill('\u{1F4CD} ' + t('ليست على الخريطة'), 'warn'),
             '<span class="num" dir="ltr">' + esc(o.rdr || '\u2014') + '</span>',
             '<input id="orIn' + i + '" list="orList" dir="ltr" autocomplete="off" style="min-width:150px" placeholder="NSK-…" value="' + esc(gs ? gs.id : '') + '">'
               + (gs ? '<div class="hint" style="margin:2px 0 0;font-size:11px">' + esc(t('اقتراح')) + ': ' + esc(gs.name || gs.id) + '</div>' : ''),
             btn(t('اربط'), 'btn-secondary btn-sm', ' data-orlink="' + i + '|' + k + '"') + ' ' + btn('\u{1F4CD} ' + t('ضعها على الخريطة'), 'btn-quiet btn-sm', ' data-orplace="' + k + '"') ];
  });
  return card('نقاط ملف ١٤٤٧ خارج الخريطة — ' + nm(L.length),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('محفوظةٌ ببيانات أجهزتها ولا تظهر على الخريطة حتى تُربَط بنقطةٍ قائمة أو يُختار موضعُها.')) + '</p>'
    + '<datalist id="orList">' + opts + '</datalist>'
    + table(['من الملف', 'سيريال القارئ', 'النقطة على الخريطة', ''], rows)
    + (L.length > 60 ? '<p class="hint" style="margin:4px 0 0">' + esc(t('والباقي')) + ' ' + nm(L.length - 60) + '</p>' : ''));
}

/* ═══ (V37.93) الجسرُ اليدويّ — نظامُ البطاقات بلا طلبٍ من التطبيق ═══
   أوّلُ تجربةٍ حقيقية من جوال المالك: «تعذّر الوصول إلى بثّ القرّاء». خوادمُ النظام لا تقبل طلبًا
   من غير موقعها، وهذا لا يُصلَح من جهتنا. فصار الطلبُ يخرج من موقعهم نفسِه: أمرٌ يُلصَق في
   الـConsole على nusukcard.net يجمع القرّاءَ والخيامَ وإشغالَ مخيماتنا وينسخها دفعةً، ويُلصَق
   ناتجُه هنا فيُحفَظ في settings/extBridge لكلِّ الحسابات. ولا يُحفَظ التوكنُ عندنا أصلًا. */
function extBridgeCodes(){
  var o = {};
  (STATE.sites || []).forEach(function(x){
    if (!x || x.type !== 'مخيم' || x.zone !== 'منى') return;
    var i = STATE.inss[x.id];
    if (!(x.pilot || x.nk || x.ex47 || (i && i.status && i.status !== 'مسودّة'))) return;
    var c = x.nk || x.sign; if (c) o[String(c)] = 1;
  });
  return Object.keys(o);
}
function extBridgeCmd(mode){
  /* (V37.94) mode='go': إشارةٌ مرجعية — تنقل المتصفحَ إلى تطبيقنا والبياناتُ في العنوان بعد # فتُستورَد وحدَها؛
     mode (افتراضي): نسخُ الناتج للصق */
  /* (V38.5) أوّلُ تشغيلٍ حقيقيّ من لاب المالك: الجلبُ كلُّه نجح، ثم سقط «copy is not defined» — أداةُ النسخ في
     الـConsole لا تبقى في النطاق بعد أوّل await. تُحفَظ مرجعًا قبل أيِّ انتظار، ويُنزَّل الناتجُ ملفًّا دائمًا
     (nusuk-bridge.json) يُرفَع في البطاقة نفسِها — فلا يتوقّف الجسرُ على النسخ. */
  var tail = mode === 'go'
    ? "location.href=" + JSON.stringify(location.origin + location.pathname) + "+'#bridge='+encodeURIComponent(JSON.stringify(out));"
    : "const js=JSON.stringify(out);let cp=false;try{if(CP){CP(js);cp=true;}}catch(e){}"
      /* (V38.9) اسمُ المتغيّر «jb»: جردُ خريطة المشاعر يمنع رابطَ Blob باسم المتغيّر الحرفيّ «b» في الملف كلِّه (درسُ أرشيف البلاط) فأسقط الإنتاجَ بنصِّ هذا الأمر */
      + "try{const jb=new Blob([js],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(jb);a.download='nusuk-bridge-'+out.at+'.json';document.body.appendChild(a);a.click();a.remove();}catch(e){}"
      + "alert('بياناتُ الجسر: '+out.rd.length+' قارئ · '+out.tn.length+' خيمة · '+out.ov.length+' إشغال — '+(cp?'نُسخت للصق، ':'')+'ونُزّل ملفُّ nusuk-bridge — ارفعه في التطبيق أو الصقه');";
  return [
    "(async()=>{const CP=(typeof copy==='function')?copy:null;try{",
    "const T=localStorage.getItem('mj.accessToken');if(!T){alert('سجّل الدخول في النظام أوّلًا');return;}",
    "const H={Authorization:'Bearer '+T},A='https://api.nusukcard.net/api/v1',W=", JSON.stringify(extBridgeCodes()), ";",
    "const j=async u=>{const r=await fetch(u,{headers:H});if(!r.ok)throw new Error(u.split('?')[0].split('/').slice(-2).join('/')+' '+r.status);return r.json();};",
    "const rs=await j('https://event.nusukcard.net/api/rfid/latest/stream');const rd=Array.isArray(rs)?rs:(rs.data||[]);",
    "let tn=[];for(let p=1;p<=80;p++){const x=await j(A+'/tents?page='+p+'&perPage=100');const d=Array.isArray(x.data)?x.data:[];tn=tn.concat(d);if(d.length<100)break;}",
    "const k=v=>String(v||'').replace(/\\s+/g,'').toLowerCase(),want=new Set(W.map(k)),pick=tn.filter(t=>want.has(k(t.code)));",
    "const ov=[];let i=0;const go=async()=>{while(i<pick.length){const t=pick[i++];try{const o=await j(A+'/dashboards/tents/'+t.id+'/overview'),d=o.data||o,c=d.occupancyStatus||{},a=d.averageTime||{};",
    "ov.push([t.id,c.totalCapacity||0,c.currentlyOccupied||0,c.withoutBracelet||0,c.fromOtherCamps||0,a.insideCamp||'',a.transitTime||'']);}catch(e){}}};",
    "await Promise.all([go(),go(),go(),go()]);",
    "const out={v:1,at:Date.now(),rd:rd.map(r=>[r.readerId,r.locationName,r.timestamp]),tn:tn.map(t=>[t.id,t.code,t.latitude,t.longitude,t.tentGroup||'',t.capacity||0]),ov:ov};",
    tail,
    "}catch(e){alert('تعذّر: '+e.message);}})()"
  ].join('');
}

function extBridgePaste(){
  if (!may('settings')){ toast(t('الجسرُ للمهندس فما فوق')); return; }
  var el = document.getElementById('brIn'), raw = el ? String(el.value || '').trim() : '';
  if (!raw){ toast(t('الصق ناتجَ الأمر أوّلًا')); return; }
  var o = null; try { o = JSON.parse(raw); } catch (e){ o = null; }
  if (!o || !extBridgeApply(o, true)){ toast(t('هذا ليس ناتجَ أمر الجسر — انسخه كاملًا وأعد اللصق')); return; }
  o.by = STATE.meta.name || '';
  toast(t('اعتُمد الجسر') + ' \u00b7 ' + nm(o.rd.length) + ' ' + t('قارئ') + ' \u00b7 ' + nm(o.tn.length) + ' ' + t('خيمة')); render(1);
}

function extBridgeCopy(){
  var cmd = extBridgeCmd(), done = function(){ toast(t('نُسخ أمرُ الجسر — الصقه في الـConsole على موقع النظام')); };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(cmd).then(done, function(){ EXT._brShow = 1; render(1); }); return; }
  } catch (e){ LS_ERR = e; }
  EXT._brShow = 1; render(1);
}
function extBridgeCard(){
  if (!may('settings')) return '';
  var B = EXT.bridge, old = B && Date.now() - B.at > 6 * 3600000;
  var st = B ? alertBox(old ? 'warn' : 'success', t('آخر جسر') + ' ' + pilotAgo(B.at) + ' \u00b7 ' + B.rd + ' ' + t('قارئ') + ' \u00b7 ' + B.tn + ' ' + t('خيمة') + ' \u00b7 ' + B.ov + ' ' + t('إشغال') + (old ? ' \u2014 ' + t('قديم: جدّده') : ''))
             : alertBox('info', t('لا جسرَ بعد'));
  var n = nm(extBridgeCodes().length);
  return card('\u{1F309} ' + t('جسر نظام البطاقات'),
    st
    /* (V37.94) الطريقةُ الأولى: إشارةٌ مرجعية — ضغطةٌ واحدة على موقع النظام */
    + '<div style="font-weight:700;margin:10px 0 4px">\u2460 ' + esc(t('بضغطة واحدة — من اللاب')) + '</div>'
    + '<ol class="hint" style="margin:0 0 8px;padding-inline-start:18px;line-height:1.9">'
    /* (V38.6) «مش عارف أشغّله»: الزرُّ لا يُضغَط هنا (سياسةُ الصفحة تمنع تشغيلَه فيبدو ميتًا) بل يُسحَب.
       الضغطُ يقول ذلك صراحةً، والشريطُ المخفيُّ يُظهَر بـ Ctrl+Shift+B */
    + '<li>' + esc(t('أظهر شريط الإشارات المرجعية في كروم: Ctrl + Shift + B')) + '</li>'
    + '<li>' + esc(t('اسحب هذا الزرَّ بالماوس وأفلته على الشريط (مرةً واحدة) — لا تضغطه هنا')) + ': <a class="btn btn-primary btn-sm" draggable="true" data-brbmk="1" href="' + esc(extBridgeBmk()) + '" title="' + esc(t('اسحبني إلى شريط الإشارات المرجعية')) + '">\u{1F309} ' + esc(t('جسر البطاقات')) + '</a></li>'
    + '<li>' + esc(t('افتح موقع النظام وسجّل الدخول، ثم اضغط الإشارة المرجعية')) + '</li>'
    + '<li>' + esc(t('يجمع القرّاءَ والخيامَ والإشغال ويفتح هذا التطبيق وقد اعتُمد كلُّه وحدَه')) + '</li></ol>'
    + '<p class="hint" style="margin:0 0 10px">' + esc(t('يجمع إشغالَ مخيماتنا المربوطة والمركَّبة')) + ' (' + n + ') \u2014 ' + esc(t('بعد ربط مخيماتٍ جديدة اسحب الزرَّ من جديد ليشملها')) + '</p>'
    /* الطريقةُ الثانية: ملفُّ تصديرٍ من شاشات النظام */
    + '<div style="font-weight:700;margin:6px 0 4px">\u2461 ' + esc(t('أو ملف تصدير من شاشات النظام')) + '</div>'
    + '<p class="hint" style="margin:0 0 6px">' + esc(t('إن كان في شاشة «أجهزة القراءة» أو «إدارة المخيمات» زرُّ تصدير، ارفع ملفه هنا — يُقرأ بعناوين أعمدته')) + '</p>'
    + '<label class="btn btn-secondary btn-sm" style="display:inline-flex">\u{1F4C4} ' + esc(t('ارفع ملف تصدير')) + '<input type="file" accept=".json,.xlsx,.xls,.csv" data-brfile="1" style="display:none"></label>'
    /* الطريقةُ الثالثة: الأمرُ واللصق — احتياطًا */
    + mtDetails(t('أو بالأمر واللصق (احتياطًا)'),
        '<ol class="hint" style="margin:0 0 8px;padding-inline-start:18px;line-height:1.9">'
        + '<li>' + esc(t('اضغط «انسخ أمر الجسر» هنا')) + '</li>'
        + '<li>' + esc(t('هناك: F12 ← Console ← الصق ← Enter (وإن رفض كروم اللصق اكتب allow pasting)')) + '</li>'
        + '<li>' + esc(t('ينزل ملفُّ nusuk-bridge — ارفعه بزرِّ «ارفع ملف تصدير» أعلاه، أو الصق الناتجَ هنا واضغط «اعتمد»')) + '</li></ol>'
        + '<div class="actions" style="margin:0 0 8px">' + btn('\u{1F4CB} ' + t('انسخ أمر الجسر'), 'btn-secondary btn-sm', ' data-brcopy="1"') + '</div>'
        + (EXT._brShow ? '<textarea readonly dir="ltr" rows="3" style="width:100%;font-size:11px">' + esc(extBridgeCmd()) + '</textarea>' : '')
        + '<textarea id="brIn" dir="ltr" rows="3" style="width:100%;font-size:11px;margin-top:6px" placeholder="' + esc(t('الصق ناتجَ الأمر هنا')) + '"></textarea>'
        + '<div class="actions" style="margin:6px 0 0">' + btn('\u2713 ' + t('اعتمد'), 'btn-secondary btn-sm', ' data-brok="1"') + '</div>', '\u2462'));
}

/* ═══ (V37.94) بلا كتابة كود: إشارةٌ مرجعيةٌ بضغطة، وملفُّ تصديرٍ من النظام ═══
   طلبُ المالك: «كله يتم من الواجهة، مش عاوز أكتب كود». ثلاثُ طرقٍ بترتيب السهولة:
   ١) إشارةٌ مرجعية: تُسحَب مرةً إلى شريط المتصفح، ثم تُضغَط على موقع النظام — تجمع البيانات وتفتح تطبيقَنا
      والبياناتُ في العنوان بعد #، فيستوردها التطبيقُ ويحفظها وحدَه. لا Console ولا لصق.
   ٢) ملفُّ تصديرٍ من شاشات النظام (أجهزة القراءة أو المخيمات) يُرفَع هنا — إن كان التصديرُ متاحًا عندهم.
   ٣) الأمرُ واللصق (V37.93) احتياطًا. */
function extBridgeBmk(){ return 'javascript:' + encodeURIComponent(extBridgeCmd('go')); }
function extBridgeHashPick(){
  try {
    var h = String(location.hash || ''), i = h.indexOf('#bridge='); if (i < 0) return;
    var raw = decodeURIComponent(h.slice(i + 8));
    try { sessionStorage.setItem('nsk.bridgePending', raw); } catch (e0){ EXT._brPend = raw; }
    if (history && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  } catch (e){ LS_ERR = e; }
}

extBridgeHashPick();   /* (V37.94) عند التحميل: بياناتُ الإشارة المرجعية إن وُجدت في العنوان */

/* ═══ (V38.7) حالةُ القارئ، واستبدالُه في النظام، والنظرةُ العامة بتصميم نظام البطاقات ═══
   أسئلةُ المالك بعد أوّل جسرٍ حقيقيّ: «الجهاز أونلاين ولا أوفلاين؟ ولو اتغيّر الريدر في النظام أعمل إيه؟
   وأعدّله عندنا يدويًّا؟ وأشوف قراءات النظرة العامة بنفس الديزاين؟» */

function extReaderKey(ins){
  var S = (ins && ins.serials) || {}, out = '';
  Object.keys(S).forEach(function(k){ if (!out && (/^rdr/i.test(k) || /قارئ/.test(itemName(k)))) out = k; });
  return out;
}
function extSerAdopt(id, ser){
  if (!may('settings')){ toast(t('الربطُ للمهندس فما فوق')); return; }
  var ins = STATE.inss[id], k = extReaderKey(ins);
  if (!ins || !k){ toast(t('لا قارئَ في تركيب هذه النقطة — عدّله من نموذج التركيب')); return; }
  var old = ins.serials[k];
  if (!confirm(t('يُستبدَل سيريالُ القارئ في التركيب') + ': ' + old + ' \u2190 ' + ser + '. ' + t('متابعة؟'))){ toast(t('لم يُحفَظ — أُلغي')); return; }
  var r = Object.assign({}, ins); r.serials = Object.assign({}, ins.serials); r.serials[k] = String(ser);
  r.serHist = (ins.serHist || []).concat([{ at:Date.now(), by:STATE.meta.name || '', key:k, old:old, nw:String(ser), src:'نظام البطاقات' }]);
  STATE.inss[id] = r; CORE.set('inss', id, r); CORE.saveSoon();
  EXT_MATCH_STATE = null;
  logEvent('استبدالُ سيريال القارئ من نظام البطاقات — ' + id + ' · ' + old + ' ← ' + ser, id);
  toast(t('حُدِّث سيريالُ القارئ')); render(1);
}

function extStatusCard(){
  var R = extStatusRows(), B = EXT.bridge;
  if (!R) return card('حالة النقاط من نظام البطاقات', alertBox('info', t('لا جسرَ بعد — شغّل الجسر من البطاقة أعلاه فتظهر هنا حالةُ كلِّ نقطة')));
  var n = function(f){ return R.filter(f).length; };
  var F = EXT.stF || 'all', flt = { all:function(){ return true; }, on:function(r){ return r.sig === 'on'; }, off:function(r){ return r.sig === 'off'; },
    none:function(r){ return r.sig === 'none'; }, ov:function(r){ return r.ov; }, noov:function(r){ return !r.ov; }, chk:function(r){ return !!r.chk; } };
  var chips = [['all', 'الكل', R.length], ['on', '🟢 ترسل', n(flt.on)], ['off', '🔴 لا ترسل', n(flt.off)], ['none', '⚪ بلا قارئ ظاهر', n(flt.none)],
               ['ov', '📊 لها أرقام', n(flt.ov)], ['noov', 'بلا أرقام', n(flt.noov)], ['chk', '⚠ تحتاج مراجعة', n(flt.chk)]];
  var rows = R.filter(flt[F] || flt.all), N = EXT.stN || 30;
  var by = { name:'الاسم', sign:'الشاخص', serial:'السيريال', '1447':'قارئ ١٤٤٧' };
  var sigTxt = function(r){ return r.sig === 'on' ? '\u{1F7E2} ' + t('ترسل') : r.sig === 'off' ? '\u{1F534} ' + t('لا ترسل') + (r.ts ? ' \u00b7 ' + pilotAgo(r.ts) : '') : '\u26AA ' + t('بلا قارئ ظاهر'); };
  var chkTxt = function(r){ return r.chk === 'warn' ? '\u26A0 ' + t('القارئ على موقعٍ آخر') : r.chk === 'ser' ? '\u26A0 ' + t('سيريالٌ مختلف') : r.chk === 'miss' ? '\u26A0 ' + t('الاسم غير موجود') : '\u2713'; };
  /* (V38.13) سطران لكلِّ نقطة بدل جدولٍ بسبعة أعمدة — يتّسع للجوال */
  var tb = '<div class="st-list">' + rows.slice(0, N).map(function(r){
      var dot = r.sig === 'on' ? '\u{1F7E2}' : r.sig === 'off' ? '\u{1F534}' : '\u26AA';
      var line2 = [t(by[r.by] || '\u2014'), r.ser ? String(r.ser) : '', r.sig === 'off' && r.ts ? pilotAgo(r.ts) : (r.sig === 'none' ? t('بلا قارئ ظاهر') : ''),
                   r.ov ? '\u{1F4CA} ' + (r.pct != null ? r.pct + '%' : '') + ' ' + r.tot + '/' + r.cap : t('بلا أرقام'), r.chk ? chkTxt(r) : ''].filter(Boolean).join(' \u00b7 ');
      return '<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line,rgba(127,127,127,.2))">'
        + '<span style="font-size:15px;flex:0 0 auto">' + dot + '</span>'
        + '<div style="flex:1;min-width:0"><div><b dir="ltr">' + esc(r.code || '\u2014') + '</b> <span class="hint" style="margin:0;font-size:12px"><bdi>' + esc(r.x.id) + '</bdi></span></div>'
        + '<div class="hint" style="margin:0;font-size:12px;overflow-wrap:anywhere">' + esc(line2) + '</div></div>'
        + btn('\u{1F441}', 'btn-quiet btn-sm', ' data-ovopen="' + esc(r.x.id) + '" title="' + esc(t('عرض النظرة العامة')) + '"') + '</div>';
    }).join('') + '</div>';
  return card('\u{1F4E1} ' + t('حالة النقاط من نظام البطاقات'),
    '<p class="hint" style="margin:0 0 8px">' + esc(t('«ترسل» = قرأ القارئُ في ربع الساعة قبل آخر جسر · «لها أرقام» = جاءت أرقامُ النظرة العامة في آخر جسر')) + (B ? ' \u00b7 ' + esc(t('آخر جسر')) + ' ' + esc(pilotAgo(B.at)) : '') + '</p>'
    + '<div class="chips" style="display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px">' + chips.map(function(c){
        return '<button type="button" class="chip' + (F === c[0] ? ' on' : '') + '" data-stf="' + c[0] + '">' + esc(t(c[1])) + ' <b class="num">' + nm(c[2]) + '</b></button>'; }).join('') + '</div>'
    + (rows.length ? tb : alertBox('info', t('لا نقاطَ في هذا التصنيف')))
    + '<div class="actions" style="margin:8px 0 0">'
    + (rows.length > N ? btn(t('عرض المزيد') + ' (' + nm(rows.length - N) + ')', 'btn-quiet btn-sm', ' data-stmore="1"') : '')   /* ثلاثون في كلِّ مرّة */
    + btn('\u2B07 ' + t('إكسل'), 'btn-secondary btn-sm', ' data-stxls="1"') + '</div>');
}
function extStatusXls(){
  var R = extStatusRows(); if (!R || !R.length){ toast(t('لا جسرَ بعد')); return; }
  var by = { name:'الاسم', sign:'الشاخص', serial:'السيريال', '1447':'قارئ ١٤٤٧' };
  var rows = [[t('النقطة'), t('الاسم'), t('الربط'), t('الكود في النظام'), t('القارئ'), t('الإشارة'), t('آخر قراءة'), t('السعة'), t('الإشغال'), t('النسبة'), t('التحقق')]];
  R.forEach(function(r){
    rows.push([r.x.id, r.x.name || '', t(by[r.by] || ''), r.code, String(r.ser || ''), t(r.sig === 'on' ? 'ترسل' : r.sig === 'off' ? 'لا ترسل' : 'بلا قارئ ظاهر'),
      r.ts ? new Date(r.ts).toISOString().replace('T', ' ').slice(0, 16) : '', r.ov ? r.cap : '', r.ov ? r.tot : '', r.ov && r.pct != null ? r.pct + '%' : '',
      r.chk === 'warn' ? t('القارئ على موقعٍ آخر') : r.chk === 'ser' ? t('سيريالٌ مختلف') : r.chk === 'miss' ? t('الاسم غير موجود') : '\u2713']);
  });
  xlsSheets([[t('حالة النقاط'), rows]], 'nusuk-points-status.xlsx');
}

/* ═══ (V38.13) شريطُ الإعداد والبيانات — قسمٌ واحدٌ مفتوحٌ عند الطلب ═══ */
function extSetupBar(){
  var B = EXT.bridge, S = EXT.sec == null ? (B ? '' : 'br') : EXT.sec, orN = (STATE.ex47orph || []).length;
  var tabs = [['br', '\u{1F309} ' + t('الجسر')], ['ex', '\u{1F4C2} ' + t('بيانات ١٤٤٧')], ['or', '\u{1F4CD} ' + t('خارج الخريطة') + (orN ? ' (' + nm(orN) + ')' : '')], ['tk', '\u{1F511} ' + t('التوكن')]];
  var old = B && Date.now() - B.at > 6 * 3600000;
  var bar = card('\u2699 ' + t('الإعداد والبيانات'),
    (B ? alertBox(old ? 'warn' : 'success', t('آخر جسر') + ' ' + pilotAgo(B.at) + ' \u00b7 ' + B.rd + ' ' + t('قارئ') + ' \u00b7 ' + B.tn + ' ' + t('خيمة') + ' \u00b7 ' + B.ov + ' ' + t('إشغال') + (old ? ' \u2014 ' + t('قديم: جدّده') : ''))
       : alertBox('info', t('لا جسرَ بعد')))
    + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 0">' + tabs.map(function(x){
        return '<button type="button" class="chip' + (S === x[0] ? ' on' : '') + '" data-sec="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>');
  var body = S === 'br' ? extBridgeCard() : S === 'ex' ? ex47Card() : S === 'or' ? ex47OrphCard() : S === 'tk' ? extTokCard() : '';
  if (S === 'or' && !body) body = card(t('خارج الخريطة'), '<p class="hint" style="margin:0">' + esc(t('لا نقاطَ خارج الخريطة')) + '</p>');
  return bar + body;
}
