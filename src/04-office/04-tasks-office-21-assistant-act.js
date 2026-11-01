/* ============================================================================
   FILE    : src/04-office/04-tasks-office-21-assistant-act.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : The assistant that acts (V43.16): «what do I do» questions — duplicate points, a point that does not show, who
             added what, who moved what — answered from this device's data with cards whose buttons run the real action
             (open and correct, show the group on the map, delete, restore, clear the map filter) under the user's own role.
   DEFINES : aqAct, aqActDupGroups, aqActDups, aqActMissing, aqActRecent, aqActMoves, aqActClick, aqActMap, aqActWho, aqActAgo
   NOTE    : Build order is the full path (see scripts/build.mjs). Owner decision (V43.16): grow the on-device assistant —
             no outside model, nothing leaves the phone. Every button calls the same function the screen's own button calls,
             so a permission the role lacks is refused here exactly as it is there.
   ============================================================================ */

/* the people named in the question («اللي ضافها خالد») — matched against the authors of manual additions */
function aqActWho(n){
  var names = {}; Object.keys(STATE.newsites || {}).forEach(function(k){ var v = STATE.newsites[k]; if (v && v.by) names[v.by] = 1; });
  (STATE.sites || []).forEach(function(x){ if (x && x.isNew && x.by) names[x.by] = 1; });
  return Object.keys(names).filter(function(nmv){ return aqNorm(nmv).split(/\s+/).some(function(w){ return w.length > 2 && n.indexOf(w) > -1; }); });
}
function aqActAgo(ms){
  if (!ms) return '';
  var m = Math.round((Date.now() - ms) / 60000);
  if (m < 60) return t('منذ') + ' ' + nm(Math.max(1, m)) + ' ' + t('د');
  if (m < 1440) return t('منذ') + ' ' + nm(Math.round(m / 60)) + ' ' + t('س');
  return t('منذ') + ' ' + nm(Math.round(m / 1440)) + ' ' + t('يوم');
}
function aqActBtn(lbl, spec, cls){   /* a leading icon stays as it is; the words are translated */
  var m = /^([^\u0600-\u06FF]*\s)?([\s\S]*)$/.exec(String(lbl)), txt = (m[1] || '') + (m[2] ? t(m[2]) : '');
  return '<button type="button" class="btn ' + (cls || 'btn-secondary') + ' btn-sm" data-aqact="' + esc(spec) + '">' + esc(txt) + '</button>'; }
function aqActState(x){
  var r = STATE.recs[x.id], i = STATE.inss[x.id];
  if (i && i.status === 'مُركّب') return t('مُركّب');
  if (r && svVisited(r)) return t('تمت زيارتها');
  return t('لم تُزَر');
}
function aqActRow(x, keep){
  var lk = siteLocked(x.id), canDel = mayDeleteFinal() && !lk;
  return '<div style="border-top:1px solid var(--line, #e2e2e2);padding:8px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b><bdi>' + esc(x.id) + '</bdi></b>'
    + (keep ? '<span class="pill ok">\u2B50 ' + esc(t('المقترح تسيبها')) + '</span>' : '') + '</div>'
    + '<div class="hint" style="margin:2px 0 6px">' + esc(x.name || '') + (x.sq || x.sign ? ' \u00b7 ' + esc(t('مربع')) + ' ' + esc(x.sq || '\u2014') + ' \u00b7 ' + esc(t('شاخص')) + ' ' + esc(x.sign || '\u2014') : '')
    + ' \u00b7 ' + esc(aqActState(x)) + (x.by ? ' \u00b7 ' + esc(t('أضافها')) + ' ' + esc(x.by) : '') + (x.at ? ' ' + esc(aqActAgo(x.at)) : '') + '</div>'
    + '<div class="actions" style="margin:0;flex-wrap:wrap;gap:6px">'
    + (maySiteEditBasic() ? aqActBtn('\u270E صحّح بياناتها', 'edit|' + x.id, 'btn-primary') : aqActBtn('افتحها', 'open|' + x.id, 'btn-primary'))
    + aqActBtn('\u{1F5FA} على الخريطة', 'map|' + x.id)
    + (canDel ? aqActBtn('\u{1F5D1} امسحها', 'del|' + x.id, 'btn-quiet') : '')
    + '</div>'
    + (!canDel && mayDeleteFinal() && lk ? '<p class="hint" style="margin:4px 0 0">' + esc(t('لا تُمسح — النقطة') + ' ' + t(lk)) + '</p>' : '')
    + '</div>';
}

/* ── ١ · النقاطُ المكرَّرة: ما أُضيف يدويًّا فوق بعضه (نفسُ المربع والشاخص، أو أقلُّ من ٤٠ م ونفسُ النوع) ── */
function aqActDupGroups(who){   /* (V43.17) shared by the assistant and the «added by hand» tab */
  var near = function(a, b){ var r = Math.PI / 180, x = (b.lng - a.lng) * r * Math.cos(a.lat * r), y = (b.lat - a.lat) * r; return 6371000 * Math.sqrt(x * x + y * y); };
  var key = function(x){ return String(x.sq || '').replace(/\s+/g, '') + '|' + String(x.sign || '').replace(/\s+/g, ''); };
  var adds = (STATE.sites || []).filter(function(x){ return x && x.isNew && +x.lat && +x.lng && (!who.length || who.indexOf(x.by) > -1); });
  var all = (STATE.sites || []).filter(function(x){ return x && +x.lat && +x.lng; });
  var used = {}, groups = [];
  adds.sort(function(a, b){ return (b.at || 0) - (a.at || 0); }).forEach(function(a){
    if (used[a.id]) return;
    var g = all.filter(function(b){
      if (b.id === a.id || used[b.id] || b.zone !== a.zone || b.type !== a.type) return false;
      var sameKey = a.type === 'مخيم' && key(a) !== '|' && key(a) === key(b);
      return sameKey || near({ lat:+a.lat, lng:+a.lng }, { lat:+b.lat, lng:+b.lng }) < 40;
    });
    if (!g.length) return;
    g.unshift(a); g.forEach(function(x){ used[x.id] = 1; }); groups.push(g);
  });
  /* the one to keep: the registry point if one is in the group, else the one with a visit or install, else the oldest */
  var pick = function(g){
    var reg = g.filter(function(x){ return !x.isNew; })[0]; if (reg) return reg.id;
    var done = g.filter(function(x){ return STATE.inss[x.id] || svVisited(STATE.recs[x.id]); })[0]; if (done) return done.id;
    return g.slice().sort(function(a, b){ return (a.at || 0) - (b.at || 0); })[0].id;
  };
  return { groups:groups, pick:pick };
}
function aqActDups(who){
  var G = aqActDupGroups(who), groups = G.groups, pick = G.pick;
  if (!groups.length) return aqCard(t('النقاط المكرَّرة'), '<p style="margin:0">' + esc(t('لا نقاطَ مضافةً فوق بعضها') + (who.length ? ' ' + t('لـ') + ' ' + who.join('، ') : '')) + ' \u2713</p>'
    + '<p class="hint" style="margin:6px 0 0">' + esc(t('أبحث في ما أُضيف يدويًّا: نفسُ المربع والشاخص، أو أقلُّ من ٤٠ مترًا ونفسُ النوع.')) + '</p>');
  return groups.slice(0, 6).map(function(g, gi){
    var keep = pick(g), ids = g.map(function(x){ return x.id; });
    return aqCard('\u{1F9E9} ' + t('مجموعة مكرَّرة') + ' ' + nm(gi + 1) + ' \u00b7 ' + nm(g.length) + ' ' + t('نقاط'),
      '<p class="hint" style="margin:0 0 4px">' + esc(t('سيب واحدةً وصحّح بياناتها من لوحة المخيم، وامسح الباقي.')) + (mayDeleteFinal() ? '' : ' ' + esc(t('الحذفُ للمهندس فما فوق — صحّح البيانات وبلّغ المهندس.'))) + '</p>'
      + g.map(function(x){ return aqActRow(x, x.id === keep); }).join(''),
      aqActBtn('\u{1F5FA} اعرض المجموعة على الخريطة', 'map|' + ids.join(','), 'btn-primary'));
  }).join('') + (groups.length > 6 ? '<p class="hint">' + esc(t('والباقي')) + ' ' + nm(groups.length - 6) + ' ' + esc(t('مجموعة')) + '</p>' : '');
}

/* ── ٢ · نقطةٌ لا تظهر: موجودةٌ ومرشَّحة؟ مخفية؟ ممسوحة؟ لم تُرفع بعد من جهاز صاحبها؟ ── */
function aqActMissing(q, n, who){
  var code = (/n\d{3}[a-z]{0,2}/i.exec(q) || /nsk-[a-z]{3}-[a-z]{3}-n?\d{3,4}[a-z]{0,2}/i.exec(q) || [])[0];
  var hits = [];
  if (code){
    var C = code.toUpperCase();
    var pool = (STATE.sites || []).concat(STATE.hiddenSites || []);
    pool.forEach(function(x){ if (x && String(x.id).toUpperCase().indexOf(C) > -1) hits.push(x); });
    Object.keys(STATE.newsites || {}).forEach(function(k){ if (k.toUpperCase().indexOf(C) > -1 && !hits.some(function(h){ return h.id === k; })) hits.push(Object.assign({ id:k }, STATE.newsites[k])); });
    /* a final delete leaves only its witness in the site overrides — the point is gone from every list, so say who deleted it */
    Object.keys(STATE.siteOv || {}).forEach(function(k){ var o = STATE.siteOv[k]; if (o && o.deleted && k.toUpperCase().indexOf(C) > -1 && !hits.some(function(h){ return h.id === k; })) hits.push({ id:k, deleted:true, name:o.name || '' }); });
  } else {
    var since = Date.now() - 2 * 86400000;
    Object.keys(STATE.newsites || {}).forEach(function(k){ var v = STATE.newsites[k]; if (v && (v.at || 0) > since && (!who.length || who.indexOf(v.by) > -1)) hits.push(Object.assign({ id:k }, v, siteFind(k) || {})); });
    hits.sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
  }
  var filt = typeof FILT === 'object' && FILT && Object.keys(FILT).some(function(k){ return FILT[k]; });
  var rows = hits.slice(0, 8).map(function(x){
    var vis = siteFind(x.id), hid = (STATE.hiddenSites || []).some(function(h){ return h.id === x.id; }), ov = (STATE.siteOv || {})[x.id] || {};
    var del = (x.deleted || ov.deleted), why, btns = '';
    if (del){ why = '\u{1F5D1} ' + t('مُسحت نهائيًّا') + (ov.delBy || x.by ? ' \u00b7 ' + (ov.delBy || x.by) : '') + (ov.delAt || x.at ? ' ' + aqActAgo(ov.delAt || x.at) : ''); }
    else if (hid){ why = '\u{1F648} ' + t('مخفيّة') + (ov.hidBy ? ' \u00b7 ' + ov.hidBy : ''); if (maySiteEdit()) btns = aqActBtn('\u21BA استعدها', 'restore|' + x.id, 'btn-primary'); }
    else if (vis){ why = '\u2705 ' + t('موجودةٌ في السجلّ وعلى الخريطة') + (filt ? ' — ' + t('لكنَّ تصفية الخريطة قد تخفيها') : ''); btns = aqActBtn('\u{1F5FA} اعرضها على الخريطة', 'map|' + x.id, 'btn-primary') + (filt ? ' ' + aqActBtn('امسح التصفية', 'unfilt|' + x.id) : '') + ' ' + aqActBtn('افتحها', 'open|' + x.id); }
    else { why = '\u23F3 ' + t('مسجَّلةٌ ولم تصل سجلَّ هذا الجهاز بعد'); btns = aqActBtn('\u21BB اسحب الآن', 'pull|' + x.id, 'btn-primary'); }
    return '<div style="border-top:1px solid var(--line, #e2e2e2);padding:8px 0"><b><bdi>' + esc(x.id) + '</bdi></b>'
      + '<div class="hint" style="margin:2px 0 6px">' + esc(x.name || '') + (x.by ? ' \u00b7 ' + esc(t('أضافها')) + ' ' + esc(x.by) + ' ' + esc(aqActAgo(x.at)) : '') + '</div>'
      + '<div style="margin:0 0 6px">' + esc(why) + '</div>' + (btns ? '<div class="actions" style="margin:0;flex-wrap:wrap;gap:6px">' + btns + '</div>' : '') + '</div>';
  }).join('');
  var mine = (STATE.queue || []).filter(function(it){ return it && it.kind === 'newsites'; }).length;
  var tips = '<p class="hint" style="margin:8px 0 0">' + esc(t('لو اللي ضافها لا يراها هو نفسه: يقفل التطبيق ويفتحه مرتين ليصل آخرُ إصدار. ولو لم تظهر هنا إطلاقًا فهي لم تُرفع من جهازه بعد — يفتح الشبكة ويضغط «زامِن الآن».')) + '</p>'
    + (mine ? '<p class="hint" style="margin:4px 0 0">' + esc(t('على هذا الجهاز')) + ' ' + nm(mine) + ' ' + esc(t('إضافةٌ تنتظر الرفع')) + '</p>' : '');
  if (!hits.length) return aqCard(t('نقطةٌ لا تظهر'), '<p style="margin:0">' + esc(code ? t('لا نقطةَ بهذا الكود على هذا الجهاز') + ': ' + code : t('لا إضافاتٍ يدويةً في آخر يومين') + (who.length ? ' ' + t('لـ') + ' ' + who.join('، ') : '')) + '</p>' + tips,
    aqActBtn('\u21BB اسحب الآن', 'pull|', 'btn-primary'));
  return aqCard(code ? t('أين النقطة') + ' ' + code : t('الإضافاتُ اليدوية في آخر يومين') + (who.length ? ' \u00b7 ' + who.join('، ') : ''), rows + tips);
}

/* ── ٣ · من أضاف ماذا: الإضافاتُ اليدويةُ في آخر سبعة أيام، لكلِّ شخصٍ عددُه ── */
function aqActRecent(who){
  var since = Date.now() - 7 * 86400000, L = (STATE.sites || []).filter(function(x){ return x && x.isNew && (x.at || 0) > since && (!who.length || who.indexOf(x.by) > -1); })
    .sort(function(a, b){ return (b.at || 0) - (a.at || 0); });
  var by = {}; L.forEach(function(x){ var k = x.by || t('بلا اسم'); by[k] = (by[k] || 0) + 1; });
  if (!L.length) return aqCard(t('الإضافاتُ اليدوية'), '<p style="margin:0">' + esc(t('لا إضافاتٍ في آخر سبعة أيام')) + '</p>');
  return aqCard(t('الإضافاتُ اليدوية — آخر ٧ أيام') + ' \u00b7 ' + nm(L.length),
    Object.keys(by).sort(function(a, b){ return by[b] - by[a]; }).map(function(k){ return aqRow(k, nm(by[k])); }).join('')
    + L.slice(0, 8).map(function(x){ return aqActRow(x, false); }).join(''),
    aqActBtn('\u{1F5FA} اعرضها كلها على الخريطة', 'map|' + L.slice(0, 60).map(function(x){ return x.id; }).join(','), 'btn-primary')
    + (rankOf(ROLE) >= rankOf('supervisor') ? ' ' + aqGo('المضاف يدويًا', 'page|added') : '') + ' ' + aqActBtn('\u{1F9E9} فيها مكرَّر؟', 'ask|في نقط مكررة'));
}

/* ── ٤ · من حرّك ماذا: النقاطُ والحساساتُ والجيت واي — آخرُ التحريكات ── */
function aqActMoves(who){
  var L = [];
  Object.keys(STATE.siteOv || {}).forEach(function(id){
    var o = STATE.siteOv[id]; if (!o) return;
    if (o.movedAt) L.push({ id:id, what:t('النقطة'), by:o.movedBy || '', at:o.movedAt });
    if (o.iot && o.iot.at && typeof o.iot.at === 'number') L.push({ id:id, what:t('الحساسات والجيت واي'), by:o.iot.by || '', at:o.iot.at });
  });
  L = L.filter(function(m){ return !who.length || who.indexOf(m.by) > -1 || who.some(function(w){ return aqNorm(m.by).indexOf(aqNorm(w)) > -1; }); }).sort(function(a, b){ return b.at - a.at; });
  if (!L.length) return aqCard(t('آخر التحريكات'), '<p style="margin:0">' + esc(t('لا تحريكاتٍ مسجَّلة على هذا الجهاز')) + '</p>');
  return aqCard(t('آخر التحريكات') + ' \u00b7 ' + nm(L.length), L.slice(0, 10).map(function(m){
    return '<div class="kk-zl" style="margin:4px 0;align-items:center"><span><bdi>' + esc(m.id) + '</bdi> \u00b7 ' + esc(m.what) + '<br><span class="hint">' + esc(m.by || '\u2014') + ' ' + esc(aqActAgo(m.at)) + '</span></span>'
      + aqActBtn('\u{1F5FA}', 'map|' + m.id) + '</div>';
  }).join(''));
}

/* the router: answers the questions above, '' for anything else (the older layers then answer) */
function aqAct(q){
  var n = aqNorm(q); if (!n) return '';
  var who = aqActWho(n);
  if (/مكرر|متكرر|دبل|دوبل|فوق بعض|نفس المكان|اتضاف (كذا|مرتين|تلات)|مرتين|تلات مرات|duplicate/.test(n)) return aqActDups(who);
  if (/مش ظاهر|مش باين|مش بتظهر|مش بيظهر|مبتظهرش|مش شايف|اختف|مختفي|راحت فين|راح فين|فين النقطه|مش لاقي|ملقتش|مش موجود/.test(n)) return aqActMissing(q, n, who);
  if (/(ازاي|كيف|اعمل ايه|عايز|عاوز)[^.]{0,25}(احرك|حرك|انقل|اغير مكان)/.test(n)) return aqCard(t('تحريكُ نقطةٍ أو أجهزتها'),
    '<ol style="margin:0;padding-inline-start:20px"><li>' + esc(t('افتح المخيم على الخريطة واضغطه.')) + '</li><li>' + esc(t('من بطاقته: «✥ تحريك الأجهزة» — تظهر النقطةُ وحساساتُها والجيت واي كلٌّ بعلامة.')) + '</li><li>'
      + esc(t('اسحب العلامةَ لمكانها الصحيح وأفلتها — يُحفَظ في اللحظة ويصل كلَّ الأجهزة، و«تراجع» يرجع آخرَ تحريك.')) + '</li></ol>'
      + (mayIot() ? '' : '<p class="hint" style="margin:6px 0 0">' + esc(t('تحريكُ الحساسات والجيت واي للمشرف فما فوق.')) + '</p>'),
    aqGo('افتح الخريطة', 'page|map') + ' ' + aqActBtn('مين حرّك إيه؟', 'ask|مين حرك'));
  if (/مين حرك|اتحرك|اتنقل|حركها|حرك|غير مكان|نقل الحساس|مكان الحساس/.test(n)) return aqActMoves(who);
  if (/مين ضاف|اتضاف|الاضافات|ضافوا|اضافات|نقط جديده|مخيمات جديده|ضاف ايه/.test(n)) return aqActRecent(who);
  return '';
}

/* the map shows every point of a group at once — waits for the map like mapFlySoon */
function aqActMap(ids){
  var P = ids.map(siteFind).filter(function(x){ return x && +x.lat && +x.lng; });
  if (!P.length){ toast(t('لا نقطةَ ظاهرةٌ لتُعرَض')); return; }
  ASSIST_OPEN = false; navPush(CUR); goPage('map'); render();
  var k = 0;
  (function go(){
    if (typeof MAP !== 'undefined' && MAP){
      if (P.length === 1) MAP.setView([+P[0].lat, +P[0].lng], 19);
      else MAP.fitBounds(P.map(function(x){ return [+x.lat, +x.lng]; }), { padding:[50, 50], maxZoom:19 });
      if (P.length === 1 && typeof POP_SITE !== 'undefined'){ POP_SITE = P[0].id; POP_OPEN = true; render(1); }
      return;
    }
    if (++k < 40) setTimeout(go, 250);
  })();
}

/* the buttons — each calls the screen's own function, so the role's limits hold here exactly as there */
function aqActClick(spec){
  var p = String(spec || '').split('|'), act = p[0], arg = p.slice(1).join('|');
  if (act === 'edit' || act === 'open'){ ASSIST_OPEN = false; DETAIL_ID = arg; CUR = 'site'; if (act === 'edit' && maySiteEditBasic()) PV.SITE_ED = 1; render(); return true; }
  if (act === 'map'){ aqActMap(arg.split(',').filter(Boolean)); return true; }
  if (act === 'unfilt'){ FILT = { zone:'', type:'', work:'', life:'', route:'', stg:'' }; aqActMap([arg]); return true; }
  if (act === 'del'){
    var x = siteFind(arg); if (!x) return true;
    var links = siteDelLinks(arg);
    if (!confirm(t('مسحٌ نهائيٌّ لـ') + ' ' + arg + (x.name ? ' — ' + x.name : '') + (links.length ? '\n' + t('ويُمسح معها') + ': ' + links.join('، ') : '') + '\n' + t('متأكد؟'))) return true;
    if (siteDeleteFinal(arg)){ var rs = document.getElementById('assistRes'); if (rs) rs.innerHTML = assistResHtml(); }
    return true;
  }
  if (act === 'restore'){ if (siteRestore(arg) !== false){ var rs2 = document.getElementById('assistRes'); if (rs2) rs2.innerHTML = assistResHtml(); } return true; }
  if (act === 'pull'){
    toast(t('جارٍ السحب…'));
    var done = function(){ var rs3 = document.getElementById('assistRes'); if (rs3) rs3.innerHTML = assistResHtml(); toast(t('اكتمل السحب')); };
    var P1 = typeof FB === 'object' && FB.pullFeeds ? FB.pullFeeds({ only:['sites', 'newsites', 'coreqs'] }) : Promise.resolve();
    Promise.resolve(P1).then(function(){ return typeof pullDelta === 'function' ? pullDelta({ why:'assist' }) : 0; }).then(done, done);
    return true;
  }
  if (act === 'dups'){ ASSIST_Q = t('في نقط مكررة؟'); ASSIST_OPEN = true; render(); return true; }   /* (V43.17) from the «added by hand» tab */
  if (act === 'ask'){ ASSIST_Q = arg; var q = document.getElementById('assistQ'); if (q) q.value = arg; var rs4 = document.getElementById('assistRes'); if (rs4) rs4.innerHTML = assistResHtml(); return true; }
  return false;
}
