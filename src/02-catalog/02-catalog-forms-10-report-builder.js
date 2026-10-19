/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-10-report-builder.js
   DOMAIN  : Catalog & forms — sites, types, filters, site details, edits
   PURPOSE : (V38.43) Report builder — the owner composes any point report from dropdowns (place, owner category, type, survey,
             installation, card system, signal, occupancy, ministry, 1447 data, point location, challenges, company,
             technician, block, group-by) and sees the exact sentence and the conditions understood before computing.
             It feeds the existing reports-by-words engine (aqRepParse/aqRepData/aqRepCard), so every number has its
             list and its Excel/PDF; favourites are kept on the device by name.
   DEFINES : rbState, rbOptions, rbTypePhrase, rbSentence, rbPreviewHtml, rbHtml, rbFavs, rbFavSave, rbFavDel, rbOnChange
   NOTE    : Build order is the full path (see scripts/build.mjs). New comments are written in English.
   ============================================================================ */
function rbState(){ return rbState.s || (rbState.s = { sel:{}, open:false }); }
/* each option group: key → [label, [ [value, caption, phrase], … ]]; phrase '' = no condition */
function rbOptions(){
  var zones = {}; (STATE.sites || []).forEach(function(x){ if (x && x.zone) zones[x.zone] = 1; });
  var zl = Object.keys(zones).sort().map(function(z){ return [z, z, 'في ' + z]; });
  var tl = (typeof aqTypes === 'function' ? aqTypes() : []).map(function(p){ return [p[0], p[0], rbTypePhrase(p[0])]; });
  var ll = (typeof locOpts === 'function' ? locOpts() : []).filter(function(o){ return o !== 'لا شيء مما سبق'; }).map(function(o){ return [o, o, o]; });
  return [
    ['zone', 'المشعر', [['', 'كلّ المشاعر', '']].concat(zl)],
    ['cat', 'الفئة', [['', 'كلّ الفئات', '']].concat((typeof TAX_T !== 'undefined' ? TAX_T : []).filter(function(c){ return c !== 'مخيمات' && c !== 'ممرات'; }).map(function(c){ return [c, c, c]; }))],   /* camps and corridors are types */
    ['type', 'النوع', [['', 'كلّ الأنواع', '']].concat(tl)],
    ['sv', 'المسح', [['', '—', ''], ['un', 'لم تُزَر', 'لم تزر'], ['v', 'زيرت', 'اتزارت'], ['u', 'زيارة متعذّرة', 'متعذرة'], ['pend', 'بانتظار الاعتماد التقني', 'بانتظار الاعتماد'], ['appr', 'مسح معتمد', 'المسح معتمد'], ['rev', 'تحتاج زيارة أخرى', 'مردودة']]],
    ['ins', 'التركيب', [['', '—', ''], ['no', 'لم تُركَّب', 'مش مركبة'], ['yes', 'مُركّبة', 'مركبة'], ['appr', 'تركيب معتمد', 'مركبة تركيب معتمد']]],
    ['lnk', 'نظام البطاقات', [['', '—', ''], ['no', 'غير مربوطة', 'مش مربوطة'], ['yes', 'مربوطة', 'مربوطة']]],
    ['sig', 'الإشارة', [['', '—', ''], ['off', 'لا ترسل', 'مش بترسل'], ['on', 'ترسل', 'بترسل'], ['none', 'بلا قارئ ظاهر', 'بلا قارئ']]],
    ['ov', 'الإشغال', [['', '—', ''], ['none', 'بلا أرقام إشغال', 'بلا أرقام'], ['has', 'لها أرقام إشغال', 'ليها أرقام'], ['gt', 'فوق نسبة', 'اشغال فوق {n}'], ['lt', 'تحت نسبة', 'اشغال تحت {n}']]],
    ['min', 'الوزارة', [['', '—', ''], ['pend', 'بانتظار الوزارة', 'بانتظار الوزارة'], ['ret', 'ردّتها الوزارة', 'ردتها الوزارة'], ['appr', 'اعتمدتها الوزارة', 'اعتمدتها الوزارة']]],
    ['e47', 'بيانات ١٤٤٧', [['', '—', ''], ['has', 'لها بيانات ١٤٤٧', 'ليها بيانات 1447'], ['no', 'بلا بيانات ١٤٤٧', 'من غير بيانات 1447']]],
    ['loc', 'موقع النقطة', [['', '—', '']].concat(ll)],
    ['chal', 'التحديات', [['', '—', ''], ['any', 'فيها تحدٍّ', 'فيها تحدي']]],
    ['group', 'حسب', [['', 'بلا تجميع', ''], ['zone', 'المشعر', 'حسب المشعر'], ['type', 'النوع', 'حسب النوع'], ['co', 'الشركة', 'حسب الشركة'], ['tech', 'الفني', 'حسب الفني'], ['block', 'المربع', 'حسب المربع'], ['ins', 'حالة التركيب', 'حسب حالة التركيب'], ['sv', 'حالة المسح', 'حسب حالة المسح']]]
  ];
}
/* a word the parser recognises for each type */
function rbTypePhrase(ty){
  var P = { 'مخيم':'المخيمات', 'ممر':'الممرات', 'كاميرا':'الكاميرات', 'جسر':'الجسور', 'محطة':'المحطات', 'بوابة':'البوابات', 'مبنى':'المباني' };
  return P[ty] || ty;
}
/* the sentence the engine reads — shown to the owner as-is, so the language can be learned and typed later */
function rbSentence(sel){
  sel = sel || rbState().sel;
  var O = rbOptions(), parts = [], typeWord = 'النقاط', place = '', group = '';
  O.forEach(function(g){
    var v = sel[g[0]]; if (!v) return;
    var opt = g[2].filter(function(o){ return o[0] === v; })[0]; if (!opt || !opt[2]) return;
    var ph = opt[2].replace('{n}', String(+sel.occ || 50));
    if (g[0] === 'type') typeWord = ph; else if (g[0] === 'zone') place = ph; else if (g[0] === 'cat') place = (place ? place + ' ' : '') + 'في ' + ph; else if (g[0] === 'group') group = ph; else parts.push(ph);
  });
  if (sel.co) parts.push('شركة ' + String(sel.co).trim());
  if (sel.tech) parts.push('الفني ' + String(sel.tech).trim().split(/\s+/)[0]);
  if (sel.block) parts.push('مربع ' + String(sel.block).trim());
  var q = 'تقرير ' + typeWord + (place ? ' ' + place : '') + (parts.length ? ' اللي ' + parts.join(' و') : '') + (group ? ' ' + group : '');
  return q.replace(/\s+/g, ' ').trim();
}
function rbPreviewHtml(){
  var q = rbSentence(), P = aqRepParse(q), n = aqRepData(q).rows.length;
  var chips = P.conds.map(function(c){ return pill(t(c.label), 'ok'); }).join(' ') + (P.group ? ' ' + pill(t('حسب') + ' ' + t(P.group.label), '') : '');
  if (!P.conds.length) chips = pill(t('كلُّ النقاط'), '') + ' ' + chips;
  return '<div class="hint" style="margin:6px 0 2px">' + esc(t('الجملة')) + ': <b>' + esc(q) + '</b></div>'
    + '<div style="margin:0 0 6px">' + esc(t('فهمت:')) + ' ' + chips + ' \u2014 <b class="num">' + nm(n) + '</b> ' + esc(t('نقطة'))
    + (P.unknown.length ? ' ' + pill(t('ما فهمتش') + ': ' + P.unknown.join(' \u00b7 '), 'warn') : '') + '</div>';
}
function rbHtml(){
  var S = rbState(), O = rbOptions();
  var sel = function(g){ return '<div class="field"><label>' + esc(t(g[1])) + '</label><select data-rb="' + esc(g[0]) + '">'
    + g[2].map(function(o){ return '<option value="' + esc(o[0]) + '"' + (S.sel[g[0]] === o[0] ? ' selected' : '') + '>' + esc(t(o[1])) + '</option>'; }).join('') + '</select></div>'; };
  var inp = function(k, lbl, ph, type){ return '<div class="field"><label>' + esc(t(lbl)) + '</label><input data-rb="' + k + '" type="' + (type || 'text') + '" value="' + esc(S.sel[k] || '') + '" placeholder="' + esc(t(ph)) + '"></div>'; };
  var favs = rbFavs();
  var q = rbSentence();
  return '<details class="card" style="margin:0 0 10px"' + (S.open ? ' open' : '') + ' data-rbopen="1"><summary style="cursor:pointer;font-weight:700">\u{1F9EE} ' + esc(t('منشئ التقارير')) + ' <span class="hint" style="font-weight:400">' + esc(t('اختر الشروط فيحسب العدد والقائمة والملف')) + '</span></summary>'
    + '<div class="grid cols-2" style="margin:8px 0 0">' + O.filter(function(g){ return g[0] !== 'group'; }).map(sel).join('')
    + (S.sel.ov === 'gt' || S.sel.ov === 'lt' ? inp('occ', 'نسبة الإشغال %', '50', 'number') : '')
    + inp('co', 'الشركة', 'جزء من الاسم') + inp('tech', 'الفني', 'الاسم') + inp('block', 'المربع', 'رقم المربع')
    + sel(O[O.length - 1]) + '</div>'
    + '<div id="rbPrev">' + rbPreviewHtml() + '</div>'
    + '<div class="actions">' + btn('\u{1F9EE} ' + t('احسب'), 'btn-primary btn-sm', ' data-assistq="' + esc(q) + '"') + btn('\u2B07 ' + t('إكسل'), 'btn-secondary btn-sm', ' data-assistq="' + esc('إكسل ' + q) + '"')
    + btn('\u2605 ' + t('احفظ كمفضّل'), 'btn-quiet btn-sm', ' data-rbsave="1"') + btn(t('مسح الشروط'), 'btn-quiet btn-sm', ' data-rbclear="1"') + '</div>'
    + (favs.length ? '<div class="pid" style="margin:8px 0 4px">' + esc(t('المفضّلة')) + '</div><div class="chips">' + favs.map(function(f, i){ return '<button type="button" class="chip" data-assistq="' + esc(f.q) + '" title="' + esc(f.q) + '">\u2605 ' + esc(f.name) + '</button><button type="button" class="chip" data-rbdel="' + i + '" title="' + esc(t('حذف')) + '">\u2715</button>'; }).join('') + '</div>' : '')
    + '</details>';
}
function rbFavs(){ try { return JSON.parse(localStorage.getItem('nsk14.rbFav') || '[]'); } catch (e){ return []; } }
function rbFavSave(name){
  var q = rbSentence(); name = String(name || '').trim(); if (!name) return false;
  var L = rbFavs().filter(function(f){ return f.name !== name; }); L.push({ name:name, q:q, at:Date.now() });
  try { localStorage.setItem('nsk14.rbFav', JSON.stringify(L)); } catch (e){ LS_ERR = e; }
  logEvent('مفضّلةُ تقارير — ' + name + ' — ' + q); return true;
}
function rbFavDel(i){ var L = rbFavs(); L.splice(+i, 1); try { localStorage.setItem('nsk14.rbFav', JSON.stringify(L)); } catch (e){ LS_ERR = e; } }
/* a dropdown or box changed: keep the choice, refresh the preview and the buttons' sentence without redrawing the form */
function rbOnChange(el){
  var k = el.getAttribute('data-rb'); if (!k) return;
  rbState().sel[k] = el.value; rbState().open = true;
  var box = el.closest('details'); if (!box) return;
  if (k === 'ov'){ var det = box; det.outerHTML = rbHtml(); return; }   /* the occupancy box appears/disappears */
  var pv = box.querySelector('#rbPrev'); if (pv) pv.innerHTML = rbPreviewHtml();
  var q = rbSentence(); box.querySelectorAll('[data-assistq]').forEach(function(b){ if (b.closest('.chips')) return; b.setAttribute('data-assistq', b.textContent.indexOf(t('إكسل')) > -1 ? 'إكسل ' + q : q); });
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('change', function(e){ var el = e.target && e.target.closest ? e.target.closest('[data-rb]') : null; if (el) rbOnChange(el); });
  document.addEventListener('input', function(e){ var el = e.target && e.target.closest ? e.target.closest('input[data-rb]') : null; if (el) rbOnChange(el); });
  document.addEventListener('toggle', function(e){ var d = e.target; if (d && d.getAttribute && d.getAttribute('data-rbopen')) rbState().open = d.open; }, true);
}
