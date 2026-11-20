/* ============================================================================
   FILE    : src/03z-shared/03z-shared-09-from-tasks-office-09-assistant.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-09-assistant.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : assistDiag, aqNorm, aqTypes, aqScope, aqGo, aqCard, aqRow, aqPoint, aqAnswerBase
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ (V37.23) طلبُ المالك: «المساعد يقدر الشخص يكلّمه ويحدّدله المشكلة ويحلّهاله لو ممكن أو يقوله حلّها إزاي» ═══
   الطبقةُ الأولى بلا شبكةٍ وبلا كلفة: يقرأ حالةَ الجهاز نفسِه (الشبكة، النسخة، الطابور، الصور، الوضع الخفيف، المخزن) ويفهم الشكوى
   بكلماتها، ثم ينفّذ الحلَّ بزرٍّ حيث يملكه، ويشرح الخطواتِ حيث لا يملكه. */
function assistDiag(){
  var q = (STATE.queue || []).filter(function(it){ return it && it.kind !== 'presence' && it.kind !== 'stats'; }).length;
  var pq = (typeof PHOTO_Q === 'object' && PHOTO_Q) ? PHOTO_Q.length : 0, pf = (typeof PV.PHOTO_FAIL === 'object' && PV.PHOTO_FAIL) ? PV.PHOTO_FAIL.length : 0;
  var pz = (STATE.poison || []).length, on = !!STATE.meta.online, rms = typeof perfAvg === 'function' ? perfAvg('r') : 0, pms = typeof perfAvg === 'function' ? perfAvg('p') : 0;
  var bad = typeof PV.IDB_WHY !== 'undefined' && PV.IDB_WHY;
  return { q:q, pq:pq, pf:pf, pz:pz, on:on, rms:rms, pms:pms, lite:!!PV.LITE, idbBad:!!bad, ver:(typeof APP_VER !== 'undefined' ? APP_VER : ''), role:ROLE };
}

/* ═══ (V38.14) مساعدُ البيانات — أسئلةٌ عن بيانات المشروع تُجاب بالرقم من الجهاز نفسِه ═══
   المسارُ «أ» بقرار المالك: لا نموذجَ خارجيّ ولا بياناتٍ تخرج من الجهاز. يفهم بالعامية: نقطةٌ بمعرِّفها
   أو شاخصِها، وأعدادُ التركيب والمسح بمشعرٍ ونوع، وإشارةُ القرّاء، ورصيدُ صنفٍ في المخزن، وما ينقص
   للجاهزية — ويجيب بالرقم وزرٍّ إلى الشاشة. وما لا يفهمه يبقى في سجلّ الأسئلة ليُضاف. */
/* (V46.8) the brain hears the field as it speaks — Egyptian and Saudi words, common misspellings — mapped to the words below */
PV.AQ_SYN = [
  [/(^|\s)(كام|قديش|كمن|كم عدد|عدد)(?=\s|$)/g, '$1كم'], [/(^|\s)(فين|وين|مكان)(?=\s|$)/g, '$1اين'], [/(^|\s)(منو|من هو)(?=\s|$)/g, '$1مين'],
  [/(ركبوا|ركبنا|ركبتو|انركبت)/g, 'ركبت'],   /* verbs only — the report builder reads «مركبه» itself */
  [/(زاروا|زرنا|زورت)/g, 'زياره'],
  [/(سلموا|سلمنا)/g, 'سلمت'], [/(فكوا|فكينا)/g, 'فك'],
  [/(واقفه|واقف|متعطله|متعطل|اتاخرت|اتاخر)/g, 'متاخر'],
  [/(التفويج|تفويج|ادارة التفويج|اداره التفويج)/g, 'التفويج'], [/(الجمرات|جمرات|جمره)/g, 'الجمرات'],
  [/(عرفه|عرفات|عرفة)/g, 'عرفات'], [/(مزدلفه|مزدلفة)/g, 'مزدلفه'], [/(النهارده|النهاردة|اليوم ده|الحين|الان)/g, 'اليوم'],
  [/(مستنيه|مستنين|مستني|منتظره|منتظر|تنتظر|ينتظر|مستناه)/g, 'بانتظار'], [/^كم (?!نقط)/, 'كم نقطه ']
];
function aqNorm(q){
  var s = String(q || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 0x660); }).toLowerCase();
  (PV.AQ_SYN || []).forEach(function(r){ s = s.replace(r[0], r[1]); });
  s = s.replace(/\s+/g, ' ').trim();
  /* a question about what waits on the tafweej management is that card, whatever else it says */
  if (/التفويج/.test(s) && /بانتظار|متاخر|كم/.test(s) && !/رفض|اعتمد/.test(s) && !/بوابه|بوابات|ترددي|حاجز/.test(s)) s = 'النقاط بانتظار التفويج';   /* (V47.4) the tafweej gates inventory is another question */
  return s;
}

function aqTypes(){
  return [['مخيم', /مخيم/], ['ممر', /ممر/], ['كاميرا', /كامير/], ['جسر', /جسر|جسور/], ['بوابة', /بوابه|بوابات/], ['محطة', /محطه|محطات|قطار/], ['مبنى', /مبني|مباني/]];
}

function aqScope(n){
  var zs = {}; (STATE.sites || []).forEach(function(x){ if (x && x.zone) zs[x.zone] = 1; });
  var zone = Object.keys(zs).filter(function(z){ var k = aqNorm(z).replace(/^ال/, ''); return k.length > 2 && n.indexOf(k) > -1; })[0] || '';
  var ty = aqTypes().filter(function(p){ return p[1].test(n); })[0];
  var lo = typeof aqLocOf === 'function' ? aqLocOf(n) : { keys:[], labels:[] };   /* (V47.8) «تحت كوبري» is a scope like «منى» — it was dropped */
  return { zone:zone, type:ty ? ty[0] : '', loc:lo.keys, locL:lo.labels };
}

function aqGo(lbl, target){ return '<button type="button" class="btn btn-primary btn-sm" data-aqgo="' + esc(target) + '">' + esc(t(lbl)) + ' \u2190</button>'; }

function aqCard(title, body, btns){
  return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid var(--ok, #2e9e6a)"><div class="pid">' + esc(t('مساعد البيانات')) + '</div>'
    + '<h4 style="margin:2px 0 6px">' + esc(title) + '</h4>' + body + (btns ? '<div class="actions" style="margin:8px 0 0;flex-wrap:wrap;gap:6px">' + btns + '</div>' : '')
    + '<div class="ds-src">' + esc(t('محسوبٌ الآن من بيانات النظام')) + ' \u00b7 ' + esc(new Date().toTimeString().slice(0, 5)) + '</div></div>';   /* (V46.8) the source of the number, under every answer */
}

function aqRow(k, v){ return '<div class="kk-zl" style="margin:3px 0"><span>' + esc(t(k)) + '</span><b class="num">' + v + '</b></div>'; }

function aqPoint(x){
  var r = STATE.recs[x.id], ins = STATE.inss[x.id], L = (typeof extLink === 'function') ? extLink(x) : {};
  var sv = !r ? t('لم تُزَر') : r.access !== 'تم الوصول' ? t('زيارةٌ متعذّرة') : r.review === 'approved' ? t('ممسوحة ومعتمدة') : t('ممسوحة — بانتظار الاعتماد');
  var ist = !ins ? t('لم تُركَّب') : ins.status === 'مُركّب' ? t('مُركّب') + (ins.approved ? ' \u00b7 ' + t('معتمد') : '') : t(ins.status || 'مسودّة');
  var tn = L.tent || (L.reader && typeof extTentByCode === 'function' ? extTentByCode(L.reader.locationName) : null), ov = tn && EXT.ov[tn.id] && EXT.ov[tn.id].data;
  var c = (ov && ov.occupancyStatus) || {}, tot = (+c.currentlyOccupied || 0) + (+c.withoutBracelet || 0) + (+c.fromOtherCamps || 0);
  var body = aqRow('المسح', esc(sv)) + aqRow('التركيب', esc(ist))
    + (L.by ? aqRow('الربط بنظام البطاقات', esc(t({ name:'الاسم', sign:'الشاخص', serial:'السيريال' }[L.by] || L.by)) + (tn ? ' \u00b7 <bdi>' + esc(tn.code) + '</bdi>' : '')) : '')
    + (L.reader ? aqRow('الإشارة', esc(extRdStateText(L.reader))) : '')
    + (ov ? aqRow('الإشغال', nm(tot) + ' / ' + nm(+c.totalCapacity || 0)) : '');
  return aqCard((x.name || x.id) + ' \u00b7 ' + x.id, body, aqGo('افتح النقطة', 'site|' + x.id) + (L.by || L.reader ? ' <button type="button" class="btn btn-quiet btn-sm" data-ovopen="' + esc(x.id) + '">\u{1F441} ' + esc(t('النظرة العامة')) + '</button>' : ''));
}

function aqAnswerBase(q){   /* (V47.5) wrapped by aqAnswer (02-definitions-10): title links, and the context of the last question */
  var n = aqNorm(q), out = '';
  /* (V38.17) تقريرٌ بالكلام أوّلًا: «إكسل/PDF للنقاط اللي …» */
  var RP = aqRepParse(q); if (RP.isRep && (RP.conds.length || RP.group)) return aqRepCard(q, aqRepData(q));
  /* (V38.52) «إزاي أطلع تقرير» → the report builder, not a guess */
  if (/(ازاي|كيف|عايز|عاوز|اعمل|اطلع)[^.]{0,30}(تقرير|احصائي|احصاء|عدد)/.test(n) && !RP.conds.length) return card('\u{1F9EE} ' + t('التقارير من المساعد'), '<p style="margin:0 0 6px">' + esc(t('اختر من «منشئ التقارير» تحت: التقرير عن (النقاط · التحديات · الصور · المهام) ثم الشروط ثم «احسب» — وترى الجملة والشروط التي فُهمت والعدد قبل الحساب، ثم القائمة وإكسل/ملف للطباعة.')) + '</p><p class="hint" style="margin:0">' + esc(t('أو اكتب مباشرة: «إكسل للمخيمات في منى اللي مش مركبة حسب الشركة»')) + '</p>');
  /* ١ · نقطةٌ بمعرِّفها أو شاخصِها */
  var idm = /nsk-[a-z]{3}-[a-z]{3}-\d{3,4}/i.exec(q), sgm = /(\d{1,3})\s*\/\s*(\d{1,4})/.exec(n);
  if (idm){ var x0 = siteFind(idm[0].toUpperCase()); if (x0) return aqPoint(x0); }
  if (sgm){
    var code = sgm[1] + '/' + sgm[2], sc = aqScope(n);
    var L = (STATE.sites || []).filter(function(x){ return x && x.sign && String(x.sign).replace(/\s+/g, '') === code && (!sc.zone || x.zone === sc.zone); });
    /* (V47.4) «حالة الجيتواي في 38/56»: the point, and the page that answers the rest of the question */
    var RTp = aqRoute(q), goP = PV.AQ_INTENTS.filter(function(I){ return I.go && RTp.list.indexOf(I.id) > -1; });
    if (L.length) return L.slice(0, 3).map(aqPoint).join('') + (L.length > 3 ? '<p class="hint">' + esc(t('والباقي')) + ' ' + nm(L.length - 3) + '</p>' : '') + goP.map(function(I){ return aqGoCard(I); }).join('');
  }
  var sc2 = aqScope(n); sc2.place = (!sc2.zone && typeof aqPlace === 'function') ? aqPlace(' ' + n + ' ') : '';   /* (V47.6) with a kind too: «ممرات نمرة» */   /* (V47.5) «نمرة»: a place named in the registry */
  var plTxt = sc2.place ? (String(q).split(/\s+/).filter(function(w){ return aqNorm(w).replace(/^ال/, '') === sc2.place; })[0] || sc2.place) : '';   /* shown as the question wrote it */
  var LQ = sc2.loc && sc2.loc.length ? sc2.loc : null;   /* (V47.8) a location counts over the dashboard's own points and tags */
  var scopeTxt = [LQ ? sc2.locL.join(' ' + t('أو') + ' ') : '', sc2.zone, sc2.type, plTxt].filter(Boolean).join(' \u00b7 ');
  var pool = (LQ && typeof mtSites === 'function' ? mtSites() : (STATE.sites || [])).filter(function(x){ return x && (!sc2.zone || x.zone === sc2.zone) && (!sc2.type || x.type === sc2.type) && (!sc2.place || aqNorm(x.name || '').indexOf(sc2.place) > -1) && (!LQ || aqLocHas(x, LQ)); });
  var AQC = { q:q, n:' ' + n + ' ', sc:sc2, pool:pool, ttl:scopeTxt }; PV.AQ_POOL = pool;   /* (V47.6) the scope a follow-up («صدّرهم») acts on */
  /* (V47.4) the router decides which section answers — the first known word no longer wins (aqRoute) */
  var RT = aqRoute(q);
  if (!RT.list.length) return RT.win === 'ask' ? aqAskCard(RT.ask) : '';
  var goL = PV.AQ_INTENTS.filter(function(I){ return I.go && RT.list.indexOf(I.id) > -1; }).concat(RT.ti ? [RT.ti] : []);   /* (V47.7) a page the office taught */
  if (goL.length === RT.list.length) return goL.map(function(I){ return aqGoCard(I, AQC); }).join('');
  /* ٢ · إشارةُ القرّاء */
  if (aqOn('reader') && typeof extStatusRows === 'function'){   /* (V38.15) «شغال» كلمةً لا داخل «إشغال» */
    var R = extStatusRows();
    if (!R) out += aqCard(t('إشارة القرّاء'), '<p class="hint" style="margin:0">' + esc(t('لا جسرَ بعد — شغّل الجسر من المخيمات المركزية')) + '</p>', aqGo('المخيمات المركزية', 'page|mcamps'));
    else {
      R = R.filter(function(r){ return (!sc2.zone || r.x.zone === sc2.zone) && (!sc2.type || r.x.type === sc2.type); });
      var cnt = function(f){ return R.filter(f).length; };
      out += aqCard(t('إشارة القرّاء') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ''),
        aqRow('مرتبطة بالنظام', nm(R.length)) + aqRow('🟢 ترسل', nm(cnt(function(r){ return r.sig === 'on'; }))) + aqRow('🔴 لا ترسل', nm(cnt(function(r){ return r.sig === 'off'; })))
        + aqRow('⚪ بلا قارئ ظاهر', nm(cnt(function(r){ return r.sig === 'none'; }))) + aqRow('📊 لها أرقام', nm(cnt(function(r){ return r.ov; })))
        + (EXT.bridge ? '<p class="hint" style="margin:6px 0 0">' + esc(t('بحسب آخر جسر')) + ' ' + esc(pilotAgo(EXT.bridge.at)) + '</p>' : ''),
        aqGo('اعرض اللي لا ترسل', 'page|mcamps|off') + ' ' + aqGo('اعرض الكل', 'page|mcamps|all'));
    }
  }
  /* ٣ · رصيدُ صنفٍ في المخزن */
  if (aqOn('stock') && typeof stockBalance === 'function'){
    var B = stockBalance(), hit = B.filter(function(b){ var k = aqNorm(b.item); return k.split(/\s+/).some(function(w){ return w.length > 3 && n.indexOf(w) > -1; }); });
    /* (V38.15) صنفٌ في الكتالوج بلا حركاتٍ بعد يُجاب بأصفاره لا بـ«أكبر الأرصدة» */
    if (!hit.length){
      var seen0 = {};
      itemsList().forEach(function(i){ var k = aqNorm(i.name || ''); if (!i.name || seen0[i.name]) return; if (k.split(/\s+/).some(function(w){ return w.length > 3 && n.indexOf(w) > -1; })){ seen0[i.name] = 1; hit.push({ item:i.name, store:0, custody:0, used:0, scrap:0 }); } });
    }
    var rows = (hit.length ? hit : B.slice().sort(function(a, b){ return b.store - a.store; })).slice(0, 6);
    out += aqCard(hit.length ? t('رصيد الصنف') : t('أكبر الأرصدة في المخزن'), rows.map(function(b){
      return aqRow(b.item, nm(b.store) + ' ' + esc(t('مخزن')) + ' \u00b7 ' + nm(b.custody) + ' ' + esc(t('عهدة')) + ' \u00b7 ' + nm(b.used) + ' ' + esc(t('رُكّب')));
    }).join('') || '<p class="hint" style="margin:0">' + esc(t('لا حركاتٍ في المخزن بعد')) + '</p>', aqGo('الأرصدة', 'page|invb'));
  }
  /* (V47.2) QA: «نقاط تحتاج زيارة تقنية» was answered with the general progress, and «مين متأخر في الزيارات؟» with the weekly tasks.
     Both read the lifecycle itself (lifeOf) — the same states the map and the brain count. The Ministry sees counts only: no names, no «returned». */
  var aqMin = typeof ROLE !== 'undefined' && ROLE === 'viewer';
  var aqList = function(key, title, ids, lbl){ return (ids.length && typeof MFU !== 'undefined') ? '<button type="button" class="btn btn-primary btn-sm" data-svlist="' + esc(dsList(key, title, ids)) + '">' + esc(t(lbl)) + '</button>' : aqGo('الخريطة', 'page|map'); };
  if (aqOn('techvis')){
    var tv = { tech:[], stuck:[], revisit:[] };
    pool.forEach(function(x){ var k = lifeOf(x); if (tv[k]) tv[k].push(x.id); });
    var tvAll = tv.tech.concat(tv.stuck, aqMin ? [] : tv.revisit);
    out += aqCard(t('نقاط تحتاج زيارة أخرى') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ' \u00b7 ' + t('كلُّ المشاعر')),
      aqRow('الإجمالي', nm(tvAll.length)) + aqRow('تحتاج زيارة تقنية', nm(tv.tech.length)) + aqRow('تحتاج زيارة أخرى تقنيا', nm(tv.stuck.length))
      + (aqMin ? '' : aqRow('أعادها المهندس لزيارة أخرى', nm(tv.revisit.length))),
      aqList('aq|tech', 'نقاط تحتاج زيارة أخرى', tvAll, 'اعرض النقاط'));
  }
  if (aqOn('latevis')){
    var lv = {}, lvIds = [], lvUn = 0, lvNow = Date.now();
    pool.forEach(function(x){
      var k = lifeOf(x);
      if (k === 'todo'){ lvUn++; return; }
      if (k !== 'assigned') return;
      var tk = taskKindOf(x.id, 'visit'); if (!tk || !tk.at || lvNow - (+tk.at) < 7 * 864e5) return;
      lvIds.push(x.id); var w = tk.to || t('بلا مسؤول'); lv[w] = (lv[w] || 0) + 1;
    });
    var lvWho = Object.keys(lv).sort(function(a, b){ return lv[b] - lv[a]; }).slice(0, 6);
    out += aqCard(t('الزيارات المتأخرة') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ' \u00b7 ' + t('كلُّ المشاعر')),
      aqRow('مسندة ولم تزر منذ أكثر من أسبوع', nm(lvIds.length))
      + (aqMin ? '' : lvWho.map(function(w){ return aqRow(w, nm(lv[w])); }).join(''))
      + aqRow('لم تزر ولم تسند بعد', nm(lvUn))
      + (!lvIds.length ? '<p class="hint" style="margin:6px 0 0">' + esc(t('لا زيارات متأخرة — كل ما أسند قبل أسبوع تمت زيارته')) + '</p>' : ''),
      aqList('aq|latevis', 'الزيارات المتأخرة', lvIds, 'اعرض النقاط'));
  }
  /* ٤ · أعدادُ التركيب والمسح */
  if (aqOn('progress') && !out) out += aqAns.progress(AQC);   /* (V47.8) the survey screen's split and the summary's installed rule — 02-definitions-10 */
  /* ٦ · (V38.15) المهامُّ الأسبوعية المتأخرة */
  if (aqOn('tasks') && typeof wtRows === 'function'){   /* (V47.2) late visits have their own card above */
    var W = wtRows().filter(function(r){ return r && r.st !== 'مكتمل'; }), late = W.filter(wtLate).sort(function(a, b){ return wtDue(a) - wtDue(b); });
    var byWho = {}; late.forEach(function(r){ var k = r.who || t('بلا مسؤول'); byWho[k] = (byWho[k] || 0) + 1; });
    out += aqCard(t('المهام الأسبوعية'), aqRow('مفتوحة', nm(W.length)) + aqRow('متأخرة', nm(late.length))
      + late.slice(0, 5).map(function(r){ return aqRow(r.n, esc(r.who || '\u2014') + ' \u00b7 ' + nm(-wtDue(r)) + ' ' + esc(t('يوم'))); }).join('')
      + (Object.keys(byWho).length ? '<p class="hint" style="margin:6px 0 0">' + Object.keys(byWho).map(function(k){ return esc(k) + ' ' + nm(byWho[k]); }).join(' \u00b7 ') + '</p>' : ''),
      aqGo('المهام الأسبوعية', 'page|mweek'));
  }
  /* ٧ · (V38.15) التحدياتُ والمعوقات من زيارات المسح */
  if (aqOn('chal')) out += aqAns.chal(AQC);   /* (V47.8) the obstacles tab's own count — 02-definitions-10 */
  /* ٨ · (V38.15) اعتمادُ الوزارة */
  if (aqOn('taf') && !/تقرير|ملف/.test(n)){   /* (V45.1) QA: counts the tafweej management's decisions, not the retired ministry approval */
    if (tafPlanMeta() && typeof tafPlanCount === 'function'){   /* (V47.12) the plan's phases stand where the approvals stood */
      /* the sheet calls every corridor point a gate («بوّابة»): the word is not a kind to filter by here — only the holy site narrows the plan */
      var PC = tafPlanCount((STATE.sites || []).filter(function(x){ return x && (tafInScope(x.id) || tafPlan(x.id)) && (!sc2.zone || x.zone === sc2.zone); }).map(function(x){ return { x:x }; }));
      out += aqCard(t('خطة رصد التفويج') + (sc2.zone ? ' \u00b7 ' + t(sc2.zone) : ''), PV.TAF_PH.map(function(g){ return aqRow(g[1], nm(PC[g[0]])); }).join('')
        + aqRow('أطقم المرحلة الأولى', nm(PC.kr.p1) + ' (' + t('موجود') + ' ' + nm(PC.kn.p1) + ')') + aqRow('أطقم المرحلة الثانية', nm(PC.kr.p2) + ' (' + t('موجود') + ' ' + nm(PC.kn.p2) + ')'),
        aqGo('اعتمادات إدارة التفويج', 'page|mfu') + aqActBtns('taf', AQC));
    } else {
    var mp = 0, ma = 0, mr = 0;
    pool.forEach(function(x){ if (!tafInScope(x.id)) return; var dd = tafDecision(x.id); if (dd === 'ok') ma++; else if (dd === 'no') mr++; else mp++; });
    out += aqCard(t('اعتماد إدارة التفويج') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ''), aqRow('بانتظار اعتماد إدارة التفويج', nm(mp)) + aqRow('اعتمدتها إدارة التفويج', nm(ma)) + aqRow('رفضتها إدارة التفويج', nm(mr)),
      aqGo('اعتمادات إدارة التفويج', 'page|mfu') + aqActBtns('taf', AQC));
    }
  }
  /* ٩ · (V38.15) الإشغالُ الأعلى من آخر جسر */
  if (aqOn('occ') && typeof extStatusRows === 'function'){
    var R3 = (extStatusRows() || []).filter(function(r){ return r.ov && r.pct != null && (!sc2.zone || r.x.zone === sc2.zone); }).sort(function(a, b){ return b.pct - a.pct; });
    out += aqCard(t('الإشغال') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ''),
      (R3.length ? R3.slice(0, 6).map(function(r){ return aqRow(r.code || r.x.id, nm(r.pct) + '% \u00b7 ' + nm(r.tot) + '/' + nm(r.cap)); }).join('')
                 : '<p class="hint" style="margin:0">' + esc(t('لا أرقامَ إشغالٍ في آخر جسر — شغّل الجسر بعد الربط الجماعي')) + '</p>')
      + (EXT.bridge ? '<p class="hint" style="margin:6px 0 0">' + esc(t('بحسب آخر جسر')) + ' ' + esc(pilotAgo(EXT.bridge.at)) + '</p>' : ''),
      aqGo('المخيمات المركزية', 'page|mcamps|ov'));
  }
  /* ٥ · ما ينقص للجاهزية */
  if (aqOn('gates')) out += aqAns.gates(AQC);   /* (V47.4) the tafweej gates inventory — moved to aqAns (V47.5) */
  if (aqOn('ready')){
    var items = [], zeroW = itemsList().filter(function(i){ return i.name && !itPts(i.code); }).length;
    if (zeroW) items.push([t('أصنافٌ بلا وزن نقاط'), nm(zeroW), 'page|install']);
    var B2 = EXT.bridge; if (!B2 || Date.now() - B2.at > 12 * 3600000) items.push([t('جسرُ نظام البطاقات'), B2 ? pilotAgo(B2.at) : t('لم يُشغَّل'), 'page|mcamps']);
    var pend = Object.keys(STATE.recs || {}).filter(function(k){ var r = STATE.recs[k]; return r && svDone(r) && r.review !== 'approved' && r.review !== 'revisit'; }).length;
    if (pend) items.push([t('زياراتٌ بانتظار الاعتماد التقني'), nm(pend), 'page|svappr']);
    var orN = (STATE.ex47orph || []).length; if (orN) items.push([t('نقاط ١٤٤٧ خارج الخريطة'), nm(orN), 'page|mcamps']);
    var D = (typeof contLoad === 'function' && contLoad.d) || null;
    if (D){ var un = contRes().filter(function(r){ return !D[r[0]]; }).length; if (un) items.push([t('بدائلُ غيرُ مسمّاة'), nm(un), 'page|hb']); }
    var qn = (STATE.queue || []).filter(function(it){ return it && it.kind !== 'presence' && it.kind !== 'stats'; }).length; if (qn) items.push([t('بانتظار الرفع على هذا الجهاز'), nm(qn), 'page|sync']);
    out += aqCard(t('ما ينقص للجاهزية'), items.length ? items.map(function(it){ return '<div class="kk-zl" style="margin:4px 0;align-items:center"><span>' + esc(it[0]) + '</span><span><b class="num">' + esc(String(it[1])) + '</b> <button type="button" class="btn btn-quiet btn-sm" data-aqgo="' + esc(it[2]) + '">\u2190</button></span></div>'; }).join('')
      : '<p style="margin:0">' + esc(t('لا شيءَ معلَّقٌ ممّا يُقاس هنا')) + ' \u2713</p>');
  }
  return out + goL.map(function(I){ return aqGoCard(I, AQC); }).join('');   /* (V47.4) a tie with a page: the data first, then where the rest is */
}
