/* ============================================================================
   FILE    : src/02-catalog/02-definitions-10-assistant-answers.js
   DOMAIN  : Catalog & definitions — the assistant's data answers for the domains phase 1 only pointed to
   PURPOSE : (V47.5) Phase 2 of the brain plan: a question about sensors, shipments, vehicles, the pace, people's
             work, yesterday, the EXPO, versions, companies or the backup gets its numbers, computed now from the
             same sources the pages draw (iotDashHtml.rows, shipList/shipLate, vehList/vehAsnOf, zoneForecast,
             STATE.recs/inss, presenceRows, mfuCompanies, PV.BK_STATE) — and the page that holds the rest.
             Also: place names read from the registry itself (aqPlace: «نمرة», «الشعيبين») and a link to any
             page or tab whose title the question names (aqTitleLinks).
   DEFINES : aqAnswer, aqAns, aqPlace, aqTitleLinks, aqWho, aqTop
   GLOBALS : PV.AQ_NAMES
   PREFIX  : aq   (every function here starts with it — scripts/audit-names.mjs)
   NOTE    : An answer that has nothing to count says so and links the page — it never invents a number.
   ============================================================================ */

/* the assistant's answer: the router's cards, then a link to any page the question names by its title */
function aqAnswer(q){
  var h = aqAnswerBase(q);
  return h ? h + aqTitleLinks(' ' + aqNorm(q) + ' ', h) : '';
}

/* top-k rows of a { name: count } map, as aqRow lines */
function aqTop(by, k){
  return Object.keys(by).sort(function(a, b){ return by[b] - by[a]; }).slice(0, k || 6)
    .map(function(w){ return aqRow(w, nm(by[w])); }).join('');
}

/* a person's name as the Ministry may see it: never — the Ministry reads counts only */
function aqWho(name){ return (typeof ROLE !== 'undefined' && ROLE === 'viewer') ? '' : (name || t('بلا اسم')); }

/* A word in the question that names places in the registry — «نمرة», «الشعيبين», «المعيصم».
   Only a word that is not a holy site, a kind, a strong word of any intent or a question word, and that
   names some points but not most of them (then it is a place, not a common word). */
function aqPlace(n){
  var S = STATE.sites || [];
  if (!PV.AQ_NAMES || PV.AQ_NAMES.n !== S.length) PV.AQ_NAMES = { n:S.length, v:S.map(function(x){ return ' ' + aqNorm((x && x.name) || '') + ' '; }) };
  var STOP = /^(كام|كم|عدد|ايه|اي|ما|ماهي|مين|اين|فين|امتي|ازاي|كيف|هل|عندنا|فيه|فيها|في|من|علي|الي|اللي|الي|التي|النقاط|النقط|نقطه|نقاط|المواقع|موقع|حاله|عايز|عاوز|اعرف|دلوقتي|النهارده|امبارح|الاسبوع|كل|بتاع|بتاعه|بتاعت|بس|لسه|خلاص|اتعمل|حصل)$/;
  var toks = String(n).split(' ').filter(function(w){ return w.length >= 4 && !STOP.test(w); });
  for (var i = 0; i < toks.length; i++){
    var w = toks[i], bare = w.replace(/^ال/, '');
    if (bare.length < 3) continue;
    var sw = aqScope(' ' + w + ' ');
    if (sw.zone || sw.type) continue;
    if (PV.AQ_INTENTS.some(function(I){ return I.s.test(' ' + w + ' ') || (I.w && I.w.test(' ' + w + ' ')); })) continue;
    var hits = 0; PV.AQ_NAMES.v.forEach(function(nmv){ if (nmv.indexOf(' ' + w) > -1 || nmv.indexOf(' ' + bare) > -1 || nmv.indexOf(' ال' + bare) > -1) hits++; });
    if (hits && hits <= Math.max(3, S.length * 0.4)) return bare;
  }
  return '';
}

/* pages and tabs the question names by their title: a link to each, unless the answer already has one */
function aqTitleLinks(n, out){
  if (typeof pageIds !== 'function') return '';
  var seen = {}, L = [], hay = ' ' + String(n).replace(/[^؀-ۿa-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  pageIds().forEach(function(id){
    if (seen[id]) return; seen[id] = 1;
    var m = pageMeta(id); if (!m || !m.t) return;
    var k = aqNorm(m.t).replace(/[^؀-ۿa-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (k.length < 3 || (hay.indexOf(' ' + k + ' ') < 0 && hay.indexOf(' و' + k + ' ') < 0)) return;   /* the whole title, word for word — «وسجل المخاطر» too */
    if (!seesPage(id) || out.indexOf('page|' + id) > -1 || out.indexOf('data-p="' + id + '"') > -1) return;
    L.push({ k:k, h:'<button type="button" class="chip" data-aqgo="page|' + esc(id) + '">' + esc(t(m.t)) + ' ←</button>' });
  });
  L.sort(function(a, b){ return b.k.length - a.k.length; });   /* the most specific title first */
  return L.length ? '<div class="chips" style="margin:-4px 0 10px">' + L.slice(0, 3).map(function(o){ return o.h; }).join('') + '</div>' : '';
}

/* the data answer of a domain intent — '' when its source is not on this device (the page card stands in) */
function aqAns(I, c){
  var go = aqGo('افتح', I.go), A = aqAns[I.id];
  return A ? (A(c, go) || '') : '';
}

aqAns.sensor = function(c, go){
  var R = typeof iotDashHtml === 'function' && iotDashHtml.rows ? iotDashHtml.rows() : null;
  if (!R){ if (typeof iotCount !== 'function') return ''; var k = iotCount(); if (k.loading) return ''; R = null;
    return aqCard(t('الحساسات والجيت واي'), aqRow('جيت واي في الخطة', nm(k.g)) + aqRow('حساسات في الخطة', nm(k.s)), go); }
  if (c.sc.zone) R = R.filter(function(r){ return r.zone === c.sc.zone; });
  var st = {}, LAB = iotDashHtml.LAB || {};
  R.forEach(function(r){ st[r.st] = (st[r.st] || 0) + 1; });
  var g = R.filter(function(r){ return r.kind !== 's'; }).length;
  return aqCard(t('الحساسات والجيت واي') + ' · ' + (c.sc.zone || t('كلُّ المشاعر')),
    aqRow('جيت واي', nm(g)) + aqRow('حساسات', nm(R.length - g))
    + ['ok', 'late', 'off', 'nor', 'nof', 'nos'].filter(function(k){ return st[k]; }).map(function(k){ var l = LAB[k] || ['', k]; return aqRow(l[0] + ' ' + l[1], nm(st[k])); }).join('')
    + (!R.length ? '<p class="hint" style="margin:0">' + esc(t('لا أجهزةَ في الخطة لهذا النطاق بعد')) + '</p>' : ''), go);
};

aqAns.ship = function(c, go){
  if (typeof shipList !== 'function') return '';
  var L = shipList(), late = L.filter(function(x){ return !x.got && shipLate(x) > 0; }).sort(function(a, b){ return shipLate(b) - shipLate(a); });
  var got = L.filter(function(x){ return x.got; }).length;
  return aqCard(t('الشحنات والتوريد'), aqRow('الشحنات', nm(L.length)) + aqRow('وصلت', nm(got)) + aqRow('في الطريق', nm(L.length - got - late.length)) + aqRow('متأخرة عن موعدها', nm(late.length))
    + late.slice(0, 5).map(function(x){ return aqRow((x.item || x.ref || '—') + (x.sup ? ' · ' + x.sup : ''), nm(shipLate(x)) + ' ' + esc(t('يوم'))); }).join('')
    + (!L.length ? '<p class="hint" style="margin:0">' + esc(t('لا شحناتِ مسجَّلة بعد')) + '</p>' : ''), go);
};

aqAns.veh = function(c, go){
  if (typeof vehList !== 'function') return '';
  var V = vehList(), dg = (String(c.q).replace(/[٠-٩]/g, function(d){ return String(d.charCodeAt(0) - 0x660); }).match(/\d{2,}/) || [])[0];
  var hit = dg ? V.filter(function(v){ return String(v.plate || '').replace(/[٠-٩]/g, function(d){ return String(d.charCodeAt(0) - 0x660); }).indexOf(dg) > -1; }) : [];
  if (hit.length){
    return hit.slice(0, 3).map(function(v){ var a = vehAsnOf(v.id);
      return aqCard(t('السيارة') + ' ' + (v.plate || ''), aqRow('النوع', esc(t(v.kind || '—'))) + aqRow('معه الآن', esc(a ? aqWho(a.to) || t('مُسندة') : t('غير مُسندة'))) + (a && a.at ? aqRow('منذ', esc(dayKey(+a.at))) : ''), go); }).join('');
  }
  var asn = V.filter(function(v){ return vehAsnOf(v.id); }).length;
  return aqCard(t('السيارات'), aqRow('السيارات', nm(V.length)) + aqRow('مُسندة', nm(asn)) + aqRow('متاحة', nm(V.length - asn))
    + (dg ? '<p class="hint" style="margin:6px 0 0">' + esc(t('لا سيارةَ بهذا الرقم')) + ' <bdi>' + esc(dg) + '</bdi></p>' : ''), go);
};

aqAns.pace = function(c, go){
  if (typeof zoneForecast !== 'function' || typeof siteKeyStats !== 'function') return '';
  var Z = c.sc.zone ? [c.sc.zone] : Object.keys(siteKeyStats().zones || {});
  var rows = Z.map(function(z){ var f = zoneForecast(z); if (!f) return '';
    var v = f.done ? t('اكتمل') : f.stalled ? t('لا وتيرةَ في أسبوعين') + ' · ' + nm(f.left) + ' ' + t('متبقٍّ')
      : t('يكتمل نحو') + ' ' + dayKey(f.eta) + ' · ' + nm(Math.round(f.rate * 7)) + ' ' + t('في الأسبوع') + (f.due ? ' · ' + t(f.late ? 'بعد الموعد' : 'قبل الموعد') : '');
    return aqRow(z, esc(v)); }).join('');
  return aqCard(t('الوتيرة والهدف') + ' · ' + t('المسح الميداني'), rows || '<p class="hint" style="margin:0">' + esc(t('لا نقاطَ في هذا النطاق')) + '</p>', go);
};

/* people's work in the last seven days, by the same records the scores read — names only for roles that see the page */
aqAns.perf = function(c, go){
  var from = Date.now() - 7 * 864e5, sv = {}, ins = {}, k = 0;
  Object.keys(STATE.recs || {}).forEach(function(id){ var r = STATE.recs[id]; if (r && !r.deleted && +r.at >= from && svVisited(r)){ var w = r.by || t('بلا اسم'); sv[w] = (sv[w] || 0) + 1; k++; } });
  Object.keys(STATE.inss || {}).forEach(function(id){ var i = STATE.inss[id]; if (i && !i.deleted && i.status === 'مُركّب' && +i.at >= from){ var w = i.by || t('بلا اسم'); ins[w] = (ins[w] || 0) + 1; k++; } });
  return aqCard(t('الأكثر عملًا') + ' · ' + t('آخر ٧ أيام'),
    (Object.keys(sv).length ? '<div class="pid" style="margin:4px 0">' + esc(t('زيارات المسح')) + '</div>' + aqTop(sv, 5) : '')
    + (Object.keys(ins).length ? '<div class="pid" style="margin:8px 0 4px">' + esc(t('التركيب')) + '</div>' + aqTop(ins, 5) : '')
    + (!k ? '<p class="hint" style="margin:0">' + esc(t('لا أعمالَ مسجَّلة في آخر ٧ أيام')) + '</p>' : ''), go);
};

aqAns.yday = function(c, go){
  var today = /النهارده|اليوم/.test(c.n) && !/امبارح|امس/.test(c.n), d = new Date(); if (!today) d.setDate(d.getDate() - 1);
  var day = dayKey(d.getTime()), sv = 0, ins = 0, appr = 0, by = {};
  Object.keys(STATE.recs || {}).forEach(function(id){ var r = STATE.recs[id]; if (r && !r.deleted && r.at && dayKey(+r.at) === day && svVisited(r)){ sv++; var w = aqWho(r.by); if (w) by[w] = (by[w] || 0) + 1; } });
  Object.keys(STATE.inss || {}).forEach(function(id){ var i = STATE.inss[id]; if (i && !i.deleted && i.at && dayKey(+i.at) === day && i.status === 'مُركّب'){ ins++; var w = aqWho(i.by); if (w) by[w] = (by[w] || 0) + 1; if (i.approved) appr++; } });
  return aqCard(t(today ? 'اليوم' : 'أمس') + ' · ' + day,
    aqRow('زيارات المسح', nm(sv)) + aqRow('تركيبات', nm(ins)) + aqRow('منها معتمدة', nm(appr))
    + (Object.keys(by).length ? '<div class="pid" style="margin:8px 0 4px">' + esc(t('من عمل')) + '</div>' + aqTop(by, 4) : ''), go);
};

aqAns.expo = function(c, go){
  if (!PV.EXPO){ if (typeof expoLoad === 'function') expoLoad(); return ''; }
  return aqCard(t('الإكسبو'), aqRow('أجهزة الإكسبو', nm((PV.EXPO.devs || []).length))
    + (PV.EXPO.url ? '<p style="margin:6px 0 0"><a href="' + esc(PV.EXPO.url) + '" target="_blank" rel="noopener">' + esc(t('بوابة مركز القيادة')) + ' ↗</a></p>' : ''), go);
};

aqAns.version = function(c, go){
  if (typeof appVer !== 'function') return '';
  var cur = appVer(), R = typeof presenceRows === 'function' ? presenceRows() : [], week = Date.now() - 7 * 864e5;
  var on = R.filter(function(r){ return r.ver === cur; }).length, old = R.filter(function(r){ return r.ver && r.ver !== cur && (r.at || 0) > week; }).length;
  return aqCard(t('النسخة الحالية') + ' · ' + cur, aqRow('أجهزة على النسخة الحالية', nm(on)) + aqRow('أجهزة على نسخة أقدم هذا الأسبوع', nm(old)), go);
};

aqAns.co = function(c, go){
  if (typeof mfuCompanies !== 'function') return '';
  var L = mfuCompanies() || [], one = L.filter(function(o){ var k = aqNorm(o.co); return k.length > 3 && c.n.indexOf(k) > -1; });
  var S = (one.length ? one : L.slice().sort(function(a, b){ return b.n - a.n; })).slice(0, 6);
  return aqCard(t('شركات الخدمة') + (one.length ? '' : ' · ' + nm(L.length)),
    S.map(function(o){ return aqRow(o.co, nm(o.sv) + ' / ' + nm(o.n) + ' ' + esc(t('زيارة')) + ' · ' + nm(o.ins) + ' ' + esc(t('مُركّبة'))); }).join('')
    + (!L.length ? '<p class="hint" style="margin:0">' + esc(t('لا شركاتِ مسجَّلة على المخيمات')) + '</p>' : ''), go);
};

/* the tafweej gates inventory — the same count as the summary card (tardBarStats) */
aqAns.gates = function(c){
  if (typeof tardBarStats !== 'function') return '';
  var TB = tardBarStats(c.sc.zone || undefined);
  return aqCard(t('حصر بوابات التفويج') + ' \u00b7 ' + (c.sc.zone || t('كلُّ المشاعر')),
    aqRow('مخيمات ترددي', nm(TB.conf)) + aqRow('بوابات التفويج', nm(TB.bars)) + aqRow('ترددي بلا عدد بوابات بعد', nm(TB.noCount)),
    aqGo('متابعة الوزارة', 'page|mfu'));
};

aqAns.backup = function(c, go){
  if (typeof bkCard !== 'function') return '';
  return bkCard() + '<div class="actions" style="margin:-4px 0 10px">' + go + '</div>';
};
