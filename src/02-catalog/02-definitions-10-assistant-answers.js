/* ============================================================================
   FILE    : src/02-catalog/02-definitions-10-assistant-answers.js
   DOMAIN  : Catalog & definitions — the assistant's data answers for the domains phase 1 only pointed to
   PURPOSE : (V47.5) Phase 2 of the brain plan: a question about sensors, shipments, vehicles, the pace, people's
             work, yesterday, the EXPO, versions, companies or the backup gets its numbers, computed now from the
             same sources the pages draw (iotDashHtml.rows, shipList/shipLate, vehList/vehAsnOf, zoneForecast,
             STATE.recs/inss, presenceRows, mfuCompanies, PV.BK_STATE) — and the page that holds the rest.
             Also: place names read from the registry itself (aqPlace: «نمرة», «الشعيبين») and a link to any
             page or tab whose title the question names (aqTitleLinks).
   DEFINES : aqAnswer, aqFollow, aqFollowAct, aqListBtn, aqSelBtn, aqSelGo, aqActBtns, aqAns, aqPlace, aqTitleLinks, aqWho, aqTop, aqTeachBox, aqTeachList, aqTeachPut, aqTeachSave, aqTeachDel,
             aqLocWords, aqLocOf, aqLocHas, aqLocBreak, aqPct, aqInst, aqChalSet
   GLOBALS : PV.AQ_NAMES, PV.AQ_CTX (the last question, for follow-ups), PV.AQ_POOL, PV.AQ_SELS
   PREFIX  : aq   (every function here starts with it — scripts/audit-names.mjs)
   NOTE    : An answer that has nothing to count says so and links the page — it never invents a number.
             (V47.8) Every number here comes from the definition its page uses — scripts/audit-brain-truth.mjs.
   ============================================================================ */

/* the assistant's answer: the router's cards, then a link to any page the question names by its title.
   (V47.6) A short follow-up («وفي عرفات؟», «والممرات», «طب نمرة», «صدّرهم») continues the last question. */
function aqAnswer(q){
  var F = aqFollow(q);
  if (F && F.act) return aqFollowAct(F);
  var qq = F ? F.eff : q, h = aqAnswerBase(qq);
  if (!h) return '';
  var n = ' ' + aqNorm(qq) + ' ', sc = aqScope(n);
  if (!sc.zone) sc.place = aqPlace(n);
  PV.AQ_CTX = { q:qq, sc:sc, ids:(PV.AQ_POOL || []).map(function(x){ return x.id; }), ttl:qq, at:Date.now() };
  return (F ? '<p class="hint" style="margin:0 0 8px">↪ ' + esc(t('فهمت')) + ': <bdi>' + esc(qq) + '</bdi></p>' : '') + h + aqTitleLinks(n, h);
}

/* Is this question a follow-up of the last one? Only when it has no question of its own (the router finds no
   intent), the last answer is recent, and it brings a new scope or an action. Returns { eff } — the last question
   with its place swapped — or { act } — what to do with the last answer's points — or null. */
function aqFollow(q){
  var C = PV.AQ_CTX; if (!C || Date.now() - C.at > 15 * 60000) return null;
  var n = ' ' + aqNorm(q) + ' ', W = n.trim().split(' ');
  if (aqRoute(q).list.length) return null;
  var act = /صدر|اكسل|excel|xlsx|طلعهم|نزلهم|ملف|pdf/.test(n) ? 'xls' : /حددهم|حددها|علمهم|اسندهم|وزعهم/.test(n) ? 'sel' : '';
  if (act) return W.length <= 5 ? { act:act } : null;
  var lead = /^ (و|طب|طيب|بالنسبه|كمان)/.test(n) || W.length <= 3;
  if (!lead) return null;
  var sc = aqScope(n), pl = !sc.zone ? aqPlace(n) : '', lo = sc.loc && sc.loc.length ? aqLocOf(n) : null;   /* (V47.8) «طب مدخل نفق» */
  if (!sc.zone && !sc.type && !pl && !lo) return null;
  var locW = lo ? (' ' + n + ' ').split(' ').filter(function(w0){ return w0 && lo.strip.indexOf(' ' + w0 + ' ') < 0; }) : [];
  /* a follow-up says nothing but its new place: every other word is a particle — «فين المخيمات المركزية» is a question */
  var rest = W.filter(function(w0){ var b0 = w0.replace(/^و/, ''); if (/^(و|طب|طيب|بالنسبه|كمان|في|فى|عن|ل|لل|بتاع|بتاعه|بتاعت|يا|ب|بس|برضه|نفس|الكلام|السؤال)$/.test(b0) || !b0) return false;
    if (locW.indexOf(aqNorm(w0)) > -1 || locW.indexOf(aqNorm(b0)) > -1) return false;
    var s0 = aqScope(' ' + b0 + ' '); return !(s0.zone || s0.type || (pl && b0.replace(/^ال/, '') === pl) || (pl && b0 === pl)); });
  if (rest.length) return null;
  var toks = String(C.q).split(/\s+/), mine = String(q).replace(/[؟?]/g, ' ').split(/\s+/).filter(Boolean);
  var kind = function(tok){ var k = ' ' + aqNorm(tok) + ' ', s2 = aqScope(k); return s2.zone ? 'z' : s2.type ? 'y' : (C.sc.place && aqNorm(tok).replace(/^ال/, '') === C.sc.place) ? 'p' : ''; };
  var swap = function(want, word){
    var at = -1; toks.forEach(function(tk, i){ if (at < 0 && (kind(tk) === want || (want !== 'y' && kind(tk) && kind(tk) !== 'y'))) at = i; });
    if (at > -1) toks[at] = word; else toks.push(want === 'y' ? word : (/^في$/.test(toks[toks.length - 1]) ? word : 'في ' + word));
  };
  mine.forEach(function(tk){ var k = ' ' + aqNorm(tk.replace(/^و/, '')) + ' ', s2 = aqScope(k), w0 = tk.replace(/^و(?=ال)/, '');
    if (s2.zone) swap('z', w0); else if (s2.type) swap('y', w0); else if (pl && aqNorm(w0).replace(/^ال/, '') === pl) swap('p', w0); });
  var eff = toks.join(' ').replace(/\s+/g, ' ').trim();
  if (lo){   /* the last question's location gives way to the new one, said as the dashboard says it */
    var en = ' ' + aqNorm(eff) + ' ', bare = aqLocOf(en), gone = bare.L.length ? en.trim().split(' ').filter(function(w0){ return bare.strip.indexOf(' ' + w0 + ' ') < 0; }) : [];
    var T0 = eff.split(/\s+/).filter(Boolean), at = -1, kept = [];   /* the new location takes the old one's place: «كم نقطة مدخل نفق في منى» */
    T0.forEach(function(tk){ if (gone.indexOf(aqNorm(tk)) > -1){ if (at < 0) at = kept.length; } else kept.push(tk); });
    if (at < 0){ if (/^(في|فى)$/.test(kept[kept.length - 1] || '')) kept.pop(); at = kept.length; }
    kept.splice(at, 0, lo.labels.join(' أو '));
    eff = kept.join(' ');
  }
  return eff && eff !== C.q ? { eff:eff } : null;
}

/* «صدّرهم» / «حدّدهم» after an answer: the points that answer was about, as a list (with Excel) or a selection */
function aqFollowAct(F){
  var C = PV.AQ_CTX, ids = (C && C.ids) || [];
  if (!ids.length) return aqCard(t('لا نقاطَ في الجواب السابق'), '', '');
  return aqCard(t('نقاط الجواب السابق') + ' · ' + nm(ids.length), '<p class="hint" style="margin:0">↪ <bdi>' + esc(C.q) + '</bdi></p>',
    aqListBtn('fu', C.q, ids, 'اعرض وصدّر إكسل') + (F.act === 'sel' ? aqSelBtn('fu', ids) : ''));
}

/* a list button: the Ministry dashboards' list, which carries its own Excel */
function aqListBtn(key, title, ids, lbl){
  if (!ids.length || typeof dsList !== 'function') return '';
  return ' <button type="button" class="btn btn-secondary btn-sm" data-svlist="' + esc(dsList('aq|' + key, title, ids)) + '">' + esc(t(lbl)) + ' <b class="num">' + nm(ids.length) + '</b></button>';
}

/* a selection button — the office's bulk work («المحدَّد»); never for the Ministry or the field */
function aqSelBtn(key, ids){
  if (!ids.length || typeof may !== 'function' || !may('settings') || typeof selClear !== 'function') return '';
  PV.AQ_SELS = PV.AQ_SELS || {}; PV.AQ_SELS[key] = ids.slice();
  return ' <button type="button" class="btn btn-quiet btn-sm" data-aqsel="' + esc(key) + '">☑ ' + esc(t('حدّدها للعمل الجماعي')) + ' <b class="num">' + nm(ids.length) + '</b></button>';
}

function aqSelGo(key){
  var ids = (PV.AQ_SELS || {})[key] || []; if (!ids.length) return;
  selClear(); ids.forEach(function(id){ if (!SEL[id]){ SEL[id] = 1; SEL_N++; } });
  ASSIST_OPEN = false; if (typeof navPush === 'function') navPush(CUR); goPage('sel'); render();
  toast(t('حُدّدت') + ' ' + nm(ids.length));
}

/* the act buttons under a data card: the points behind each number */
function aqActBtns(kind, c){
  var P = c.pool || [], ttl = c.ttl || t('كلُّ المشاعر'), h = '';
  if (kind === 'progress'){
    var todo = P.filter(function(x){ return !svVisited(STATE.recs[x.id]); }).map(function(x){ return x.id; });
    var ins = P.filter(aqInst).map(function(x){ return x.id; });   /* (V47.8) installed as the summary counts it */
    h = aqListBtn('pall', ttl, P.map(function(x){ return x.id; }), 'كل النقاط') + aqListBtn('ptodo', t('لم تُزَر') + ' · ' + ttl, todo, 'لم تُزَر') + aqListBtn('pins', t('مُركّبة') + ' · ' + ttl, ins, 'مُركّبة') + aqSelBtn('ptodo', todo);
  } else if (kind === 'chal'){
    var ch = aqChalSet(P).ids;   /* (V47.8) the obstacles tab's own count */
    h = aqListBtn('chal', t('نقطة عليها تحدي') + ' · ' + ttl, ch, 'نقطة عليها تحدي') + aqSelBtn('chal', ch);
  } else if (kind === 'taf' && typeof tafInScope === 'function'){
    var pend = P.filter(function(x){ return tafInScope(x.id) && !tafDecision(x.id); }).map(function(x){ return x.id; });
    if (typeof tafPlanMeta === 'function' && tafPlanMeta()){   /* (V47.12) one list per phase of the plan */
      h = PV.TAF_PH.map(function(g){ var L = P.filter(function(x){ return (tafInScope(x.id) || tafPlan(x.id)) && tafPhase(x.id) === g[0]; }).map(function(x){ return x.id; }); return aqListBtn('taf' + (g[0] || 'none'), t(g[1]) + ' · ' + ttl, L, g[1]); }).join('');
    } else
    h = aqListBtn('taf', t('بانتظار اعتماد إدارة التفويج'), pend, 'بانتظار اعتماد إدارة التفويج');
  }
  return h;
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
  var toks = aqLocOf(' ' + n + ' ').strip.split(' ').filter(function(w){ return w.length >= 4 && !STOP.test(w); });   /* (V47.8) location words are a scope of their own */
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

/* ── (V47.8) accuracy: the brain counts with the pages' own definitions ──────────────────────────────────────
   The owner's report (17 Nov 2026, three screenshots): «كم نقطة تحت كبرى» got the progress of all 2,028 points —
   the location words were dropped without a word — and «(100%)» stood beside «لم تزر ٢». The cards also counted by
   rules of their own («وُصل إليها» by the access field alone, installed without the registry's mark, a challenge by
   any label) where each page has one definition. Now a location is a scope like an area (aqLocOf → obsLocTags over
   mtSites — the «حسب الموقع» dashboard itself), the progress card counts with svVisited/svDone/svStuck/svApproved and
   the summary's installed rule, the challenges card is the obstacles tab's own count (mtGrpOf, svPrimWhy), yesterday
   is dayDone, and a share never reads 100% before the last point nor 0% after the first. Held by audit-brain-truth. */

/* «where the point sits»: the words each option of the location dashboard is asked by — one list for the
   report-by-words (aqRepParse) and for the scope of every count (aqScope) */
function aqLocWords(){
  return [[/(تحت\s*)?(ال)?(كوبري|كبري|كباري)/, 'bridge', 'تحت كوبري'], [/مدخل\s*(ال)?نفق/, 'tin', 'مدخل نفق'], [/مخرج\s*(ال)?نفق/, 'tout', 'مخرج نفق'],
          [/(لوحه|لوحات)\s*(ال)?(استرشاد|ارشاد)[^\s]*/, 'sign', 'لوحة استرشادية'],
          [/(بدون|بلا|من غير)\s*(ال)?(اطار|هيكل)[^\s]*(\s*معدني)?(\s*(لل|ل)?تثبيت)?/, 'nomount', 'بدون إطار معدني للتثبيت'],
          [/(علي|فوق)\s*(ال)?(مظله|مظلات)/, 'canopy', 'على مظلة']];
}

/* the options a normalized question names: { L, keys, labels, strip: the question without their words } */
function aqLocOf(n){
  var L = aqLocWords().filter(function(m){ return m[0].test(n); });
  /* (V47.3) a bare «نفق» is any tunnel — only an entry or an exit already named makes it redundant */
  if (!L.some(function(m){ return m[1] === 'tin' || m[1] === 'tout'; }) && /(^|\s)(ال)?(نفق|انفاق)(\s|$)/.test(n)) L.push([/(ال)?(نفق|انفاق)/, 'tany', 'نفق']);
  var strip = ' ' + n + ' ';
  L.forEach(function(m){ strip = strip.replace(new RegExp('[^\\s]*(' + m[0].source + ')[^\\s]*', 'g'), ' '); });
  return { L:L, keys:L.map(function(m){ return m[1]; }), labels:L.map(function(m){ return m[2]; }), strip:strip.replace(/\s+/g, ' ') };
}

/* does point x sit where the keys say — the dashboard's own tags, never a second reading */
function aqLocHas(x, keys){
  var tg = typeof obsLocTags === 'function' ? obsLocTags(x) : null; if (!tg) return false;
  return keys.some(function(k){ return k === 'tany' ? !!(tg.tin || tg.tout || tg.tgen) : !!tg[k]; });
}

/* the pool by area and kind, as the location dashboard draws it: «منى — ممرات ١٣ · الجمرات ٢» */
function aqLocBreak(P){
  var G = typeof obsLocGroups === 'function' ? obsLocGroups() : [], Z = {};
  P.forEach(function(x){ var z = taxOf(x).g || x.zone || '—', g = typeof obsLocGrp === 'function' ? obsLocGrp(x) : 'o', o = Z[z] = Z[z] || {}; o[g] = (o[g] || 0) + 1; });
  var TG = typeof TAX_G !== 'undefined' ? TAX_G : [], order = TG.filter(function(z){ return Z[z]; }).concat(Object.keys(Z).filter(function(z){ return TG.indexOf(z) < 0; }));
  return order.map(function(z){ return aqRow(z, G.filter(function(g){ return Z[z][g[0]]; }).map(function(g){ return esc(t(g[2])) + ' ' + nm(Z[z][g[0]]); }).join(' · ')); }).join('');
}

/* a share, honest at both ends: 2,026 of 2,028 is 99.9% — never 100% while a point is left — and 1 of 2,028 is under 0.1%, never 0%.
   raw: plain digits, for a table that also goes to Excel */
function aqPct(a, b, raw){
  if (!b) return '—';
  var p = a / b * 100, r = Math.round(p), f0 = raw ? String : nm;
  if ((r === 100 && a < b) || (r === 0 && a > 0)){ var f = Math.floor(p * 10) / 10; return f > 0 ? f0(f) + '%' : '<' + f0(0.1) + '%'; }
  return f0(r) + '%';
}

/* installed, as the summary counts it (siteStats · siteKeyStats): the installation record, or the registry's own mark */
function aqInst(x){ var st = (STATE.inss[x.id] || {}).status; return st === 'مُركّب' || x.fstat === 'مُركّب'; }

/* the obstacles tab's own count (mtObs): a point with a challenge is visited, reached, not installed and has a primary
   reason (mtGrpOf) — each point once, by its most important challenge (svPrimWhy) */
function aqChalSet(P){
  var o = { vis:0, n:0, ids:[], gc:{}, wc:{} };
  P.forEach(function(x){
    if (!x || x.hidden || x.deleted) return;
    var r = STATE.recs[x.id]; if (r && svVisited(r)) o.vis++;
    var g = typeof mtGrpOf === 'function' ? mtGrpOf(x.id) : ''; if (!g) return;
    o.gc[g] = (o.gc[g] || 0) + 1;
    if (g !== 'access'){ o.n++; o.ids.push(x.id); var pw = typeof svPrimWhy === 'function' ? svPrimWhy(r) : -1; if (pw > -1) o.wc[pw] = (o.wc[pw] || 0) + 1; }   /* the office part brings it */
  });
  return o;
}

/* the progress of the pool — the survey screen's split and the summary's installed rule */
aqAns.progress = function(c){
  var P = c.pool || [], N = P.length, rec = function(x){ return STATE.recs[x.id]; }, cnt = function(f){ return P.filter(f).length; };
  var vis = cnt(function(x){ return svVisited(rec(x)); }), done = cnt(function(x){ return svDone(rec(x)); }), stuck = cnt(function(x){ return svStuck(rec(x)); });
  var rev = cnt(function(x){ var r = rec(x); return svReached(r) && r.review === 'revisit'; });
  var svA = typeof svApproved === 'function' ? cnt(function(x){ return svApproved(rec(x)); }) : -1;   /* the office part brings it — until then «—», never a guess */
  var ins = cnt(aqInst), insA = cnt(function(x){ var i = STATE.inss[x.id]; return !!(i && i.approved); });
  var min = typeof ROLE !== 'undefined' && ROLE === 'viewer', loc = !!(c.sc && c.sc.loc && c.sc.loc.length), svAt = svA < 0 ? '\u2014' : nm(svA);
  /* a location is recorded on a visit, so its points are all visited: the count, where they are, and how far installation got */
  var body = loc
    ? aqRow('النقاط', nm(N)) + (stuck ? aqRow('تحتاج زيارة أخرى', nm(stuck)) : '') + (rev && !min ? aqRow('أعادها المهندس', nm(rev)) : '')
      + aqRow('مسحٌ معتمد', svAt) + aqRow('مُركّبة', nm(ins) + ' (' + aqPct(ins, N) + ')') + aqRow('تركيبٌ معتمد', nm(insA))
      + (N ? '<div class="pid" style="margin:8px 0 4px">' + esc(t('حسب الموقع — في كل منطقة')) + '</div>' + aqLocBreak(P)
           : '<p class="hint" style="margin:6px 0 0">' + esc(t('لا نقاطَ تنطبق عليها الشروط')) + '</p>')
      + '<p class="hint" style="margin:4px 0 0">' + esc(t('موقع النقطة من زيارة المسح، بأرقام «حسب الموقع» نفسها')) + '</p>'
    : aqRow('النقاط', nm(N)) + aqRow('تمت الزيارة', nm(vis) + ' (' + aqPct(vis, N) + ')')
      + (min ? '' : aqRow('تم الوصول', nm(done))) + aqRow('تحتاج زيارة أخرى', nm(stuck)) + (min ? '' : aqRow('أعادها المهندس', nm(rev)))
      + aqRow('مسحٌ معتمد', svAt) + aqRow('مُركّبة', nm(ins) + ' (' + aqPct(ins, N) + ')') + aqRow('تركيبٌ معتمد', nm(insA));
  return aqCard(t('التقدّم') + ' \u00b7 ' + (c.ttl || t('كلُّ المشاعر')), body,
    aqGo('المسح الميداني', 'page|msurv') + ' ' + aqGo('حالة التركيبات', 'page|minst')
    + (loc && typeof seesPage === 'function' && seesPage('mobs') ? ' ' + aqGo('لوحة حسب الموقع', 'page|mobs') : '') + aqActBtns('progress', c));
};

/* the challenges of the pool — the obstacles tab's own headline, groups and reasons */
aqAns.chal = function(c){
  var o = aqChalSet(c.pool || []), G = (PV.MT_GRP || []).filter(function(g){ return o.gc[g.k]; });
  var why = Object.keys(o.wc).map(Number).sort(function(a, b){ return o.wc[b] - o.wc[a]; }).slice(0, 6), ttl = c.ttl || t('كلُّ المشاعر');
  return aqCard(t('التحديات والمعوقات') + ' · ' + ttl,
    aqRow('نقطة عليها تحدي', nm(o.n) + ' (' + aqPct(o.n, o.vis) + ' ' + esc(t('من')) + ' ' + nm(o.vis) + ' ' + esc(t('اتزارت')) + ')')
    + (G.length ? '<div class="pid" style="margin:8px 0 4px">' + esc(t('مين يعالجها؟')) + '</div>' + G.map(function(g){ return aqRow(g.n, nm(o.gc[g.k])); }).join('') : '')
    + (why.length ? '<div class="pid" style="margin:8px 0 4px">' + esc(t('التحدي')) + '</div>' + why.map(function(wi){ return aqRow(PV.SV_WHY[wi].n, nm(o.wc[wi])); }).join('')
      + '<p class="hint" style="margin:4px 0 0">' + esc(t('كلُّ نقطةٍ محسوبةٌ مرةً بأهمِّ تحدٍّ فيها')) + '</p>' : '')
    + (!o.n && !G.length ? '<p class="hint" style="margin:0">' + esc(t('لا تحدياتِ مسجّلة في هذا النطاق')) + '</p>' : ''),
    aqGo('التحديات والمعوقات', 'page|mobs') + aqListBtn('chal', t('نقطة عليها تحدي') + ' · ' + ttl, o.ids, 'نقطة عليها تحدي') + aqSelBtn('chal', o.ids));
};

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
  /* (V47.8) the totals are the «أمس · الآن · غدًا» page's own (dayDone: the day's snapshot, else the records it counts) */
  var today = /النهارده|اليوم/.test(c.n) && !/امبارح|امس/.test(c.n), day = dayKey(today ? Date.now() : Date.now() - 864e5);
  var sv = 0, ins = 0, appr = 0, by = {};
  Object.keys(STATE.recs || {}).forEach(function(id){ var r = STATE.recs[id]; if (r && dayKey(r.at || r._at) === day && svVisited(r) && siteFind(id)){ sv++; var w = aqWho(r.by); if (w) by[w] = (by[w] || 0) + 1; } });
  Object.keys(STATE.inss || {}).forEach(function(id){ var i = STATE.inss[id]; if (i && dayKey(i.at || i._at) === day && i.status === 'مُركّب'){ ins++; var w = aqWho(i.by); if (w) by[w] = (by[w] || 0) + 1; if (i.approved) appr++; } });
  var D = typeof dayDone === 'function' ? dayDone(day) : { sv:sv, ins:ins, dis:0 };
  return aqCard(t(today ? 'اليوم' : 'أمس') + ' · ' + day,
    aqRow('زيارات المسح', nm(D.sv)) + aqRow('تركيبات', nm(D.ins)) + aqRow('منها معتمدة', nm(appr)) + (D.dis ? aqRow('فك', nm(D.dis)) : '')
    + (Object.keys(by).length ? '<div class="pid" style="margin:8px 0 4px">' + esc(t('من عمل')) + '</div>' + aqTop(by, 4)
      + (D.sv !== sv || D.ins !== ins ? '<p class="hint" style="margin:4px 0 0">' + esc(t('الأسماء من السجلات كما هي الآن')) + '</p>' : '') : ''), go);
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

/* ═══ (V47.7) Phase 4: the office teaches the brain ═══
   A question the brain could not answer (or answered with «تقصد ايه؟») shows the engineer a small box: the words
   that mark the question, and where its answer is — one of the brain's answers or any page or tab. Saved once in
   CFG.lists.aqTeach (settings/points, synced to every device), the router reads it first (aqTaught in aqRoute). */
function aqTeachBox(q){
  if (typeof may !== 'function' || !may('settings')) return '';
  var opts = PV.AQ_INTENTS.filter(function(I){ return !I.go || seesPage(I.go.split('|')[1]); }).map(function(I){ return ['intent:' + I.id, '\u{1F4CA} ' + t(I.lbl)]; });
  var seen = {};
  (typeof pageIds === 'function' ? pageIds() : []).forEach(function(id){
    if (seen[id]) return; seen[id] = 1; var m = pageMeta(id); if (!m || !m.t || !seesPage(id)) return;
    opts.push(['page:' + id, '\u{1F4C4} ' + t(m.t) + (m.sub ? ' ‹ ' + t(m.sub) : '')]);
  });
  return '<details class="ds-more-d" id="aqTeachBox" style="margin:0 0 10px"><summary>\u{1F393} ' + esc(t('علّم المساعد جواب هذا السؤال')) + '</summary>'
    + '<p class="hint" style="margin:6px 0">' + esc(t('اكتب الكلمات التي تميّز السؤال، واختر أين جوابه — يتعلّمه المساعد للفريق كله.')) + '</p>'
    + '<input type="text" id="aqTeachP" dir="auto" style="width:100%;margin:0 0 6px" value="' + esc(String(q || '').replace(/[؟?]/g, '').trim()) + '" aria-label="' + esc(t('كلمات السؤال')) + '">'
    + '<select id="aqTeachTo" style="width:100%;margin:0 0 8px" aria-label="' + esc(t('جوابه')) + '">' + opts.map(function(o){ return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select>'
    + '<button type="button" class="btn btn-primary btn-sm" data-aqteach="1">' + esc(t('احفظ — يتعلّمه الفريق كله')) + '</button>'
    + aqTeachList() + '</details>';
}

/* what the office has taught so far, each with a delete */
function aqTeachList(){
  var L = aqTaught(); if (!L.length) return '';
  return '<div class="pid" style="margin:10px 0 4px">' + esc(t('ما تعلّمه المساعد')) + ' · ' + nm(L.length) + '</div>'
    + L.slice().sort(function(a, b){ return (b.at || 0) - (a.at || 0); }).slice(0, 30).map(function(o){
        var to = String(o.to).split(':'), lb = to[0] === 'page' ? ((pageMeta(to[1]) || {}).t || to[1]) : ((PV.AQ_INTENTS.filter(function(I){ return I.id === to[1]; })[0] || {}).lbl || to[1]);
        return '<div class="kk-zl" style="margin:3px 0;align-items:center"><span><bdi>' + esc(o.p) + '</bdi> ← ' + esc(t(lb)) + '</span>'
          + '<button type="button" class="btn btn-quiet btn-sm" data-aqteachdel="' + esc(o.p) + '" aria-label="' + esc(t('احذف')) + '">✕</button></div>';
      }).join('');
}

function aqTeachPut(L){
  CFG.lists = CFG.lists || {}; CFG.lists.aqTeach = L.map(function(o){ return JSON.stringify(o); });
  cfgPushSoon('lists'); CFG_VER = (typeof CFG_VER === 'number' ? CFG_VER : 0) + 1;
  var r = document.getElementById('assistRes'); if (r && typeof assistResHtml === 'function') r.innerHTML = assistResHtml();
}

function aqTeachSave(){
  if (typeof may !== 'function' || !may('settings')){ toast(t('تعليمُ المساعد للمهندس فما فوق')); return false; }
  var pe = document.getElementById('aqTeachP'), te = document.getElementById('aqTeachTo');
  var p = aqNorm(pe ? pe.value : '').replace(/[؟?!.,،]/g, ' ').replace(/\s+/g, ' ').trim(), to = te ? te.value : '';
  if (p.length < 3 || !/^(intent|page):/.test(to)){ toast(t('اكتب كلمات السؤال واختر جوابه')); return false; }
  var L = aqTaught().filter(function(o){ return o.p !== p; });
  L.push({ p:p, to:to, by:STATE.meta.name || '', at:Date.now() });
  aqTeachPut(L);
  logEvent('تعليمُ المساعد — ' + p + ' ← ' + to);
  toast(t('تعلّمه المساعد — يجيبه الآن للفريق كله'));
  return true;
}

function aqTeachDel(p){
  if (typeof may !== 'function' || !may('settings')) return false;
  aqTeachPut(aqTaught().filter(function(o){ return o.p !== p; }));
  logEvent('حذفُ درسٍ من المساعد — ' + p);
  return true;
}
