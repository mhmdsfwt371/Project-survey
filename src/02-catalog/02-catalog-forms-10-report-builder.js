/* ============================================================================
   FILE    : src/02-catalog/02-catalog-forms-10-report-builder.js
   DOMAIN  : Catalog & forms — sites, types, filters, site details, edits
   PURPOSE : (V38.43) Report builder — the owner composes any point report from dropdowns (place, owner category, type, survey,
             installation, card system, signal, occupancy, ministry, 1447 data, point location, challenges, company,
             technician, block, group-by; V38.45: also the challenges and the photos of those points; V38.47: the weekly tasks by status, track and owner) and sees the exact sentence and the conditions understood before computing.
             It feeds the existing reports-by-words engine (aqRepParse/aqRepData/aqRepCard), so every number has its
             list and its Excel/PDF; favourites are kept on the device by name.
   DEFINES : rbState, rbOptions, rbTypePhrase, rbSentence, rbPreviewHtml, rbShows, rbHtml, rbFavLocal, rbFavShared, rbFavs, rbFavMayShare, rbFavSave, rbFavPin, rbCountOf, rbSnap, rbPinnedHtml, rbPresets, rbPresetsAdd, rbFavDel, rbOnChange, rbPopChips, rbPopRows, rbPopKey, rbPopCols, rbPopRow, rbPopCard, rbPopName, rbRun, rbXls
   NOTE    : Build order is the full path (see scripts/build.mjs). New comments are written in English.
   ============================================================================ */
function rbState(){ return rbState.s || (rbState.s = { sel:{}, open:false }); }
/* each option group: key → [label, [ [value, caption, phrase], … ]]; phrase '' = no condition */
function rbOptions(){
  var zones = {}; (STATE.sites || []).forEach(function(x){ if (x && x.zone) zones[x.zone] = 1; });
  var zl = Object.keys(zones).sort().map(function(z){ return [z, z, 'في ' + z]; });
  var tl = (typeof aqTypes === 'function' ? aqTypes() : []).map(function(p){ return [p[0], p[0], rbTypePhrase(p[0])]; });
  var ll = (typeof locOpts === 'function' ? locOpts() : []).filter(function(o){ return o !== 'لا شيء مما سبق'; }).map(function(o){ return [o, o, o]; });
  var kinds = {}; Object.keys(STATE.photos || {}).forEach(function(k){ var p = STATE.photos[k]; if (p && p.kind) kinds[p.kind] = 1; });
  return [
    ['pop', 'التقرير عن', [['', 'النقاط', ''], ['chal', 'التحديات', ''], ['photo', 'الصور', ''], ['task', 'المهام الأسبوعية', '']]],
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
    ['ccat', 'فئة التحدي', [['', 'كلّ الفئات', '']].concat((typeof CHAL_CATS !== 'undefined' ? CHAL_CATS : []).map(function(c){ return [c.k, c.n, '']; }))],
    ['cdesc', 'وصف التحدي', [['', '—', ''], ['with', 'له وصف', ''], ['without', 'بلا وصف', '']]],
    ['pstat', 'حالة الصورة', [['', '—', ''], ['up', 'مرفوعة على الدرايف', ''], ['pend', 'بانتظار الرفع', '']]],
    ['pkind', 'نوع الصورة', [['', 'كلّ الأنواع', '']].concat(Object.keys(kinds).sort().map(function(k){ return [k, k, '']; }))],
    ['pwhen', 'زمن الصورة', [['', '—', ''], ['7', 'آخر ٧ أيام', ''], ['30', 'آخر ٣٠ يوم', '']]],
    ['tst', 'حالة المهمة', [['', 'كلّها', ''], ['open', 'مفتوحة (جارية أو بانتظار)', ''], ['late', 'متأخّرة عن موعدها', ''], ['week', 'موعدها خلال ٧ أيام', '']].concat((typeof WT_ST !== 'undefined' ? WT_ST : []).map(function(s){ return [s, s, '']; }))],
    ['ttrack', 'المسار', [['', 'كلّ المسارات', '']].concat((function(){ var m = {}; (typeof wtRows === 'function' ? wtRows() : []).forEach(function(r){ if (r && r.track) m[r.track] = 1; }); return Object.keys(m).sort().map(function(k){ return [k, k, '']; }); })())],
    ['twho', 'المسؤول', [['', 'الكلّ', '']].concat((function(){ var m = {}; (typeof wtRows === 'function' ? wtRows() : []).forEach(function(r){ if (r && r.who) m[r.who] = 1; }); return Object.keys(m).sort().map(function(k){ return [k, k, '']; }); })())],
    ['when', 'الزمن', [['', '—', ''], ['sv7', 'زيارة في آخر ٧ أيام', 'زيارتها في اخر 7 ايام'], ['sv30', 'زيارة في آخر ٣٠ يوم', 'زيارتها في اخر 30 يوم'], ['svold', 'زيارة أقدم من ٣٠ يوم', 'زيارتها اقدم من 30 يوم'], ['in7', 'تركيب في آخر ٧ أيام', 'تركيبها في اخر 7 ايام'], ['in30', 'تركيب في آخر ٣٠ يوم', 'تركيبها في اخر 30 يوم']]],
    ['group', 'حسب', [['', 'بلا تجميع', ''], ['zone', 'المشعر', 'حسب المشعر'], ['type', 'النوع', 'حسب النوع'], ['co', 'الشركة', 'حسب الشركة'], ['tech', 'الفني', 'حسب الفني'], ['block', 'المربع', 'حسب المربع'], ['ins', 'حالة التركيب', 'حسب حالة التركيب'], ['sv', 'حالة المسح', 'حسب حالة المسح'],
      ['ccat', 'فئة التحدي', ''], ['cgroup', 'جهة المعالجة', ''], ['pkind', 'نوع الصورة', ''], ['day', 'اليوم', ''], ['tst', 'حالة المهمة', ''], ['ttrack', 'المسار', ''], ['twho', 'المسؤول', '']]]
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
  var q = rbSentence(), P = aqRepParse(q), pop = rbState().sel.pop || '', n = pop ? rbPopRows(pop).length : aqRepData(q).rows.length;
  var chips = P.conds.map(function(c){ return pill(t(c.label), 'ok'); }).join(' ') + (P.group ? ' ' + pill(t('حسب') + ' ' + t(P.group.label), '') : '');
  if (!P.conds.length) chips = pill(t('كلُّ النقاط'), '') + ' ' + chips;
  if (pop === 'task') chips = pill(t('المهام الأسبوعية'), 'acc') + ' ' + rbPopChips(pop);
  else if (pop) chips = pill(t(pop === 'chal' ? 'التحديات' : 'الصور') + ' ' + t('في النقاط:'), 'acc') + ' ' + chips + ' ' + rbPopChips(pop);
  return (pop === 'task' ? '' : '<div class="hint" style="margin:6px 0 2px">' + esc(t('الجملة')) + ': <b>' + esc(q) + '</b></div>')
    + '<div style="margin:0 0 6px">' + esc(t('فهمت:')) + ' ' + chips + ' \u2014 <b class="num">' + nm(n) + '</b> ' + esc(t(pop === 'chal' ? 'تحدٍّ' : pop === 'photo' ? 'صورة' : pop === 'task' ? 'مهمة' : 'نقطة'))
    + (P.unknown.length ? ' ' + pill(t('ما فهمتش') + ': ' + P.unknown.join(' \u00b7 '), 'warn') : '') + '</div>';
}
/* an option group is shown only for the populations it applies to */
function rbShows(key, pop){
  if (key === 'ccat' || key === 'cdesc') return pop === 'chal';
  if (key === 'pstat' || key === 'pkind' || key === 'pwhen') return pop === 'photo';
  if (key === 'tst' || key === 'ttrack' || key === 'twho') return pop === 'task';
  /* the weekly tasks are not points: the point conditions do not apply to them */
  if (pop === 'task') return key === 'pop';
  return true;
}
function rbHtml(){
  var S = rbState(), O = rbOptions(), pop = S.sel.pop || '';
  /* (V38.46) compact on a phone: two columns always, small boxes, and only the essentials open — the rest under «more» */
  var sel = function(g){ return '<div class="field rb-f"><label>' + esc(t(g[1])) + '</label><select data-rb="' + esc(g[0]) + '">'
    + g[2].map(function(o){ return '<option value="' + esc(o[0]) + '"' + (S.sel[g[0]] === o[0] ? ' selected' : '') + '>' + esc(t(o[1])) + '</option>'; }).join('') + '</select></div>'; };
  var inp = function(k, lbl, ph, type){ return '<div class="field rb-f"><label>' + esc(t(lbl)) + '</label><input data-rb="' + k + '" type="' + (type || 'text') + '" value="' + esc(S.sel[k] || '') + '" placeholder="' + esc(t(ph)) + '"></div>'; };
  var ESS = { pop:1, zone:1, cat:1, type:1, sv:1, ins:1, ccat:1, cdesc:1, pstat:1, pkind:1, pwhen:1, tst:1, ttrack:1, twho:1 };
  var moreOn = Object.keys(S.sel).some(function(k){ return S.sel[k] && !ESS[k] && k !== 'group' && k !== 'occ'; });
  var favs = rbFavs();
  var q = rbSentence();
  return '<details class="card" style="margin:0 0 10px"' + (S.open ? ' open' : '') + ' data-rbopen="1"><summary style="cursor:pointer;font-weight:700">\u{1F9EE} ' + esc(t('منشئ التقارير')) + ' <span class="hint" style="font-weight:400">' + esc(t('اختر الشروط فيحسب العدد والقائمة والملف')) + '</span></summary>'
    + '<div class="rb-grid" style="margin:8px 0 0">' + O.filter(function(g){ return g[0] !== 'group' && ESS[g[0]] && rbShows(g[0], pop); }).map(sel).join('') + sel(O[O.length - 1]) + '</div>'
    + (pop === 'task' ? '' : '<details class="rb-more"' + (moreOn ? ' open' : '') + '><summary class="hint" style="cursor:pointer;margin:6px 0 2px">' + esc(t('المزيد من الشروط')) + ' \u25BE</summary><div class="rb-grid">'
    + O.filter(function(g){ return g[0] !== 'group' && !ESS[g[0]] && rbShows(g[0], pop); }).map(sel).join('')
    + (S.sel.ov === 'gt' || S.sel.ov === 'lt' ? inp('occ', 'نسبة الإشغال %', '50', 'number') : '')
    + inp('co', 'الشركة', 'جزء من الاسم') + inp('tech', 'الفني', 'الاسم') + inp('block', 'المربع', 'رقم المربع') + '</div></details>')
    + '<div id="rbPrev">' + rbPreviewHtml() + '</div>'
    + '<div class="actions">' + (pop ? btn('\u{1F9EE} ' + t('احسب'), 'btn-primary btn-sm', ' data-rbrun="' + esc(pop) + '"') + btn('\u2B07 ' + t('إكسل'), 'btn-secondary btn-sm', ' data-rbxls="' + esc(pop) + '"')
                                : btn('\u{1F9EE} ' + t('احسب'), 'btn-primary btn-sm', ' data-assistq="' + esc(q) + '"') + btn('\u2B07 ' + t('إكسل'), 'btn-secondary btn-sm', ' data-assistq="' + esc('إكسل ' + q) + '"'))
    + btn('\u2605 ' + t('احفظ كمفضّل'), 'btn-quiet btn-sm', ' data-rbsave="1"') + (rbFavMayShare() ? btn('\u{1F465} ' + t('مفضّل للفريق'), 'btn-quiet btn-sm', ' data-rbsave="team"') : '') + btn(t('مسح الشروط'), 'btn-quiet btn-sm', ' data-rbclear="1"') + (rbPresets().every(function(p){ return favs.some(function(f){ return f.name === p.name; }); }) ? '' : btn('\u26A1 ' + t('التقارير الجاهزة'), 'btn-quiet btn-sm', ' data-rbpresets="1" title="' + esc(t('ستّة تقارير لصحة البيانات تُثبَّت في أعلى المساعد')) + '"')) + '</div>'
    + '<div id="rbOut">' + (S.out || '') + '</div>'
    + (favs.length ? '<div class="pid" style="margin:8px 0 4px">' + esc(t('المفضّلة')) + '</div><div class="chips">' + favs.map(function(f, i){ return '<button type="button" class="chip" ' + (f.sel && f.sel.pop ? 'data-rbfav="' + i + '"' : 'data-assistq="' + esc(f.q) + '"') + ' title="' + esc(f.q) + (f.by ? ' \u2014 ' + esc(f.by) : '') + '">' + (f.shared ? '\u{1F465} ' : '\u2605 ') + esc(f.name) + '</button>' + (f.shared && !rbFavMayShare() ? '' : '<button type="button" class="chip" data-rbpin="' + i + '" title="' + esc(t(f.pin ? 'إلغاء التثبيت' : 'تثبيت في أعلى المساعد')) + '">' + (f.pin ? '\u{1F4CC}' : '\u{1F4CD}') + '</button><button type="button" class="chip" data-rbdel="' + i + '" title="' + esc(t('حذف')) + '">\u2715</button>'); }).join('') + '</div>' : '')
    + '</details>';
}
/* (V38.48) favourites: the team's shared ones live in the settings lists (CFG.lists.rbFav, one JSON string each — written by
   whoever may change settings, read by everyone), the personal ones on the device */
function rbFavLocal(){ try { return JSON.parse(localStorage.getItem('nsk14.rbFav') || '[]'); } catch (e){ return []; } }
function rbFavShared(){ var L = (CFG.lists && Array.isArray(CFG.lists.rbFav)) ? CFG.lists.rbFav : []; return L.map(function(s){ try { var f = JSON.parse(s); return f && f.name ? Object.assign({ shared:true }, f) : null; } catch (e){ return null; } }).filter(Boolean); }
function rbFavs(){ return rbFavShared().concat(rbFavLocal()); }
function rbFavMayShare(){ return typeof may === 'function' && may('settings'); }


function rbCountOf(f){
  var keep = rbState().sel; rbState().sel = Object.assign({}, f.sel || {});
  var n; try { n = (f.sel && f.sel.pop) ? rbPopRows(f.sel.pop).length : aqRepData(f.q || rbSentence()).rows.length; } catch (e){ n = -1; LS_ERR = e; }
  rbState().sel = keep; return n;
}
function rbSnap(){ try { return JSON.parse(localStorage.getItem('nsk14.rbSnap') || '{}'); } catch (e){ return {}; } }
function rbPinnedHtml(){
  var P = rbFavs().filter(function(f){ return f.pin; }); if (!P.length) return '';
  var S = rbSnap(), today = dayKey(Date.now()), changed = false;
  var cards = P.map(function(f, i){
    var n = rbCountOf(f), s = S[f.name] || {};
    if (s.day !== today){ S[f.name] = { day:today, n:n, prevDay:s.day || '', prevN:(s.day ? s.n : null) }; changed = true; s = S[f.name]; }
    var d = (s.prevN == null) ? null : n - s.prevN, unit = f.sel && f.sel.pop === 'chal' ? 'تحدٍّ' : f.sel && f.sel.pop === 'photo' ? 'صورة' : f.sel && f.sel.pop === 'task' ? 'مهمة' : 'نقطة';
    var open = (f.sel && f.sel.pop) ? ' data-rbfav="' + rbFavs().indexOf(f) + '"' : ' data-assistq="' + esc(f.q) + '"';
    return '<button type="button" class="kk-zl" style="width:100%;text-align:start;margin:3px 0"' + open + '><span>' + (f.shared ? '\u{1F465} ' : '\u{1F4CC} ') + esc(f.name) + '<br><span class="hint" style="margin:0">' + esc(t(unit)) + '</span></span>'
      + '<span><b class="num" style="font-size:1.2em">' + nm(n < 0 ? 0 : n) + '</b>' + (d == null ? '' : ' ' + pill((d > 0 ? '+' : '') + nm(d), d > 0 ? 'warn' : d < 0 ? 'ok' : '') + '<span class="hint" style="margin:0 4px">' + esc(t('منذ')) + ' ' + esc(s.prevDay) + '</span>') + '</span></button>';
  }).join('');
  if (changed){ try { localStorage.setItem('nsk14.rbSnap', JSON.stringify(S)); } catch (e){ LS_ERR = e; } }
  return card('\u{1F4CC} ' + t('تقاريري المثبّتة') + ' \u00b7 ' + nm(P.length), cards + '<p class="hint" style="margin:6px 0 0">' + esc(t('الرقمُ يُحسَب الآن من البيانات، والتغيُّر مقارنةً بآخر يومٍ فُتح فيه المساعد على هذا الجهاز')) + '</p>');
}
/* (V38.50) ready-made reports: six data-health favourites, pinned, added once on request (device-local, so each user picks) */
function rbPresets(){
  return [
    { name:'نقاط لم تُزَر', sel:{ sv:'un' } },
    { name:'مُركّبة ولا ترسل', sel:{ ins:'yes', sig:'off' } },
    { name:'بانتظار الاعتماد التقني', sel:{ sv:'pend' } },
    { name:'تحديات بلا وصف', sel:{ pop:'chal', cdesc:'without' } },
    { name:'صور بانتظار الرفع', sel:{ pop:'photo', pstat:'pend' } },
    { name:'مهام متأخّرة', sel:{ pop:'task', tst:'late' } }
  ];
}


/* a dropdown or box changed: keep the choice, refresh the preview and the buttons' sentence without redrawing the form */
function rbOnChange(el){
  var k = el.getAttribute('data-rb'); if (!k) return;
  rbState().sel[k] = el.value; rbState().open = true;
  var box = el.closest('details'); if (!box) return;
  if (k === 'ov' || k === 'pop'){ rbState().out = ''; box.outerHTML = rbHtml(); return; }   /* the occupancy box appears/disappears; the population changes the form */
  var pv = box.querySelector('#rbPrev'); if (pv) pv.innerHTML = rbPreviewHtml();
  var q = rbSentence(); box.querySelectorAll('[data-assistq]').forEach(function(b){ if (b.closest('.chips')) return; b.setAttribute('data-assistq', b.textContent.indexOf(t('إكسل')) > -1 ? 'إكسل ' + q : q); });
}
/* ── the challenge and photo populations: the point conditions pick the points, then each point expands ── */
function rbPopChips(pop){
  var S = rbState().sel, O = rbOptions(), cap = function(k){ var g = O.filter(function(x){ return x[0] === k; })[0], o = g && g[2].filter(function(x){ return x[0] === S[k]; })[0]; return o && S[k] ? o[1] : ''; };
  var keys = pop === 'chal' ? ['ccat', 'cdesc'] : pop === 'photo' ? ['pstat', 'pkind', 'pwhen'] : ['tst', 'ttrack', 'twho'];
  return keys.map(cap).filter(Boolean).map(function(c){ return pill(t(c), 'ok'); }).join(' ');
}
function rbPopRows(pop){
  var S = rbState().sel, rows = [];
  if (pop === 'task'){
    (typeof wtRows === 'function' ? wtRows() : []).forEach(function(r){
      if (!r) return;
      var late = typeof wtLate === 'function' && wtLate(r) && r.st !== 'مكتمل', due = typeof wtDue === 'function' ? wtDue(r) : null;
      if (S.tst === 'open' && (r.st === 'مكتمل' || r.st === 'متوقف')) return;
      if (S.tst === 'late' && !late) return;
      if (S.tst === 'week' && !(due != null && due >= 0 && due <= 7 && r.st !== 'مكتمل')) return;
      if (S.tst && ['open', 'late', 'week'].indexOf(S.tst) < 0 && r.st !== S.tst) return;
      if (S.ttrack && r.track !== S.ttrack) return; if (S.twho && r.who !== S.twho) return;
      rows.push({ x:{ id:'WT-' + r.id, name:r.n, zone:r.track || '' }, r:r, late:late, due:due, st:r.st, who:r.who || '', track:r.track || '', at:r.seen ? Date.parse(r.seen) || 0 : 0 });
    });
    return rows;
  }
  var sites = aqRepData(rbSentence()).rows;
  if (pop === 'chal'){
    var CN = {}; (typeof CHAL_CATS !== 'undefined' ? CHAL_CATS : []).forEach(function(c){ CN[c.k] = c.n; });
    var GN = {}; (typeof CC_GROUPS !== 'undefined' ? CC_GROUPS : []).forEach(function(g){ g.ks.forEach(function(k){ GN[k] = g.n; }); });
    sites.forEach(function(x){
      var r = STATE.recs[x.id]; if (!r || r.deleted) return;
      chalCats(r).forEach(function(k){
        if (S.ccat && k !== S.ccat) return;
        var d = String(r.chal_note || '').trim(); if (S.cdesc === 'with' && !d) return; if (S.cdesc === 'without' && d) return;
        rows.push({ x:x, k:k, n:CN[k] || k, grp:GN[k] || t('أخرى'), desc:d, by:r.by || '', at:r.at || 0 });
      });
    });
  } else if (pop === 'photo'){
    var ix = {}; sites.forEach(function(x){ ix[x.id] = x; });
    var lim = S.pwhen ? Date.now() - (+S.pwhen) * 86400000 : 0;
    if (S.pstat !== 'pend') Object.keys(STATE.photos || {}).forEach(function(k){ var p = STATE.photos[k]; if (!p || !ix[p.site]) return; if (S.pkind && p.kind !== S.pkind) return; if (lim && +(p.at || 0) < lim) return; var up = !!(p.link || p.driveId); if (S.pstat === 'up' && !up) return; rows.push({ x:ix[p.site], id:k, kind:p.kind || '', up:up, by:p.by || '', at:p.at || 0 }); });
    if (S.pstat !== 'up') (typeof PHOTO_Q !== 'undefined' ? PHOTO_Q : []).forEach(function(p, i){ if (!p || !ix[p.site]) return; if (S.pkind && p.kind !== S.pkind) return; if (lim && +(p.at || 0) < lim) return; rows.push({ x:ix[p.site], id:p.site + '-q' + i, kind:p.kind || '', up:false, by:STATE.meta.name || '', at:p.at || 0 }); });
  }
  return rows;
}


/* the change/input routing lives in the main listeners (08-events) — one listener per event, as the buttons audit expects;
   only the <details> open state is tracked here (toggle does not bubble) */
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('toggle', function(e){ var d = e.target; if (d && d.getAttribute && d.getAttribute('data-rbopen')) rbState().open = d.open; }, true);
