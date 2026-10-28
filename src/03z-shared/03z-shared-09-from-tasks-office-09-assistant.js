/* ============================================================================
   FILE    : src/03z-shared/03z-shared-09-from-tasks-office-09-assistant.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-09-assistant.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : assistDiag, aqNorm, aqTypes, aqScope, aqGo, aqCard, aqRow, aqPoint, aqAnswer
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
function aqNorm(q){
  return String(q || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[\u0660-\u0669]/g, function(d){ return String(d.charCodeAt(0) - 0x660); }).toLowerCase();
}

function aqTypes(){
  return [['مخيم', /مخيم/], ['ممر', /ممر/], ['كاميرا', /كامير/], ['جسر', /جسر|جسور/], ['محطة', /محطه|محطات|قطار/], ['بوابة', /بوابه|بوابات/], ['مبنى', /مبني|مباني/]];
}

function aqScope(n){
  var zs = {}; (STATE.sites || []).forEach(function(x){ if (x && x.zone) zs[x.zone] = 1; });
  var zone = Object.keys(zs).filter(function(z){ var k = aqNorm(z).replace(/^ال/, ''); return k.length > 2 && n.indexOf(k) > -1; })[0] || '';
  var ty = aqTypes().filter(function(p){ return p[1].test(n); })[0];
  return { zone:zone, type:ty ? ty[0] : '' };
}

function aqGo(lbl, target){ return '<button type="button" class="btn btn-primary btn-sm" data-aqgo="' + esc(target) + '">' + esc(t(lbl)) + ' \u2190</button>'; }

function aqCard(title, body, btns){
  return '<div class="card" style="margin:0 0 10px;border-inline-start:4px solid var(--ok, #2e9e6a)"><div class="pid">' + esc(t('مساعد البيانات')) + '</div>'
    + '<h4 style="margin:2px 0 6px">' + esc(title) + '</h4>' + body + (btns ? '<div class="actions" style="margin:8px 0 0;flex-wrap:wrap;gap:6px">' + btns + '</div>' : '') + '</div>';
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

function aqAnswer(q){
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
    if (L.length) return L.slice(0, 3).map(aqPoint).join('') + (L.length > 3 ? '<p class="hint">' + esc(t('والباقي')) + ' ' + nm(L.length - 3) + '</p>' : '');
  }
  var sc2 = aqScope(n), scopeTxt = [sc2.zone, sc2.type].filter(Boolean).join(' \u00b7 ');
  var pool = (STATE.sites || []).filter(function(x){ return x && (!sc2.zone || x.zone === sc2.zone) && (!sc2.type || x.type === sc2.type); });
  /* ٢ · إشارةُ القرّاء */
  if (/ترسل|بترسل|بيبعت|بتبعت|اشاره|اونلاين|اوفلاين|online|offline|مقطوع|(^|\s)شغال|القراء|قارئ/.test(n) && typeof extStatusRows === 'function'){   /* (V38.15) «شغال» كلمةً لا داخل «إشغال» */
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
  if (/رصيد|مخزن|مخزون|عهده|متاح|فاضل/.test(n) && typeof stockBalance === 'function'){
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
  /* ٤ · أعدادُ التركيب والمسح */
  if (/تركيب|اتركب|مركب|ركبنا|اتمسح|مسح|زياره|زيارات|زرنا|اعتماد|معتمد|انجاز|نسبه|كام|كم|عدد|قد ايه|اد ايه/.test(n) && !out && !/الوزاره|تحدي|معوق|اشغال|مهام|متاخر/.test(n)){
    var tot = pool.length, inst = pool.filter(function(x){ var i = STATE.inss[x.id]; return i && i.status === 'مُركّب'; }).length;
    var appr = pool.filter(function(x){ var i = STATE.inss[x.id]; return i && i.status === 'مُركّب' && i.approved; }).length;
    var vis = pool.filter(function(x){ return svVisited(STATE.recs[x.id]); }).length, reach = pool.filter(function(x){ var r = STATE.recs[x.id]; return svVisited(r) && r.access === 'تم الوصول'; }).length;
    var svA = pool.filter(function(x){ var r = STATE.recs[x.id]; return r && r.review === 'approved'; }).length;
    var pc = function(a){ return tot ? Math.round(a / tot * 100) + '%' : '\u2014'; };
    out += aqCard(t('التقدّم') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ' \u00b7 ' + t('كلُّ المشاعر')),
      aqRow('النقاط', nm(tot)) + aqRow('زيارات المسح', nm(vis) + ' (' + pc(vis) + ')') + aqRow('وُصل إليها', nm(reach)) + aqRow('مسحٌ معتمد', nm(svA))
      + aqRow('مُركّبة', nm(inst) + ' (' + pc(inst) + ')') + aqRow('تركيبٌ معتمد', nm(appr)),
      aqGo('المسح الميداني', 'page|msurv') + ' ' + aqGo('حالة التركيبات', 'page|minst'));
  }
  /* ٦ · (V38.15) المهامُّ الأسبوعية المتأخرة */
  if (/متاخر|تاخير|تأخير|المهام|مهام|مين متاخر/.test(n) && typeof wtRows === 'function'){
    var W = wtRows().filter(function(r){ return r && r.st !== 'مكتمل'; }), late = W.filter(wtLate).sort(function(a, b){ return wtDue(a) - wtDue(b); });
    var byWho = {}; late.forEach(function(r){ var k = r.who || t('بلا مسؤول'); byWho[k] = (byWho[k] || 0) + 1; });
    out += aqCard(t('المهام الأسبوعية'), aqRow('مفتوحة', nm(W.length)) + aqRow('متأخرة', nm(late.length))
      + late.slice(0, 5).map(function(r){ return aqRow(r.n, esc(r.who || '\u2014') + ' \u00b7 ' + nm(-wtDue(r)) + ' ' + esc(t('يوم'))); }).join('')
      + (Object.keys(byWho).length ? '<p class="hint" style="margin:6px 0 0">' + Object.keys(byWho).map(function(k){ return esc(k) + ' ' + nm(byWho[k]); }).join(' \u00b7 ') + '</p>' : ''),
      aqGo('المهام الأسبوعية', 'page|mweek'));
  }
  /* ٧ · (V38.15) التحدياتُ والمعوقات من زيارات المسح */
  if (/تحدي|تحديات|معوق|معوقات|عائق|عوائق|مشاكل|مشكله/.test(n)){
    var cc = {}, hasC = 0;
    pool.forEach(function(x){ var r = STATE.recs[x.id]; var L2 = (r && r.chals || []).filter(function(c){ return c && c !== 'لا توجد تحديات'; }); if (L2.length){ hasC++; L2.forEach(function(c){ cc[c] = (cc[c] || 0) + 1; }); } });
    var top = Object.keys(cc).sort(function(a, b){ return cc[b] - cc[a]; }).slice(0, 6);
    out += aqCard(t('التحديات والمعوقات') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ''), aqRow('نقاطٌ فيها تحدٍّ', nm(hasC)) + top.map(function(c){ return aqRow(c, nm(cc[c])); }).join('')
      + (!top.length ? '<p class="hint" style="margin:0">' + esc(t('لا تحدياتِ مسجّلة في هذا النطاق')) + '</p>' : ''), aqGo('التحديات والمعوقات', 'page|mobs'));
  }
  /* ٨ · (V38.15) اعتمادُ الوزارة */
  if (/الوزاره|اعتماد الوزاره|مراجعه الوزاره|الوزارة/.test(n) && !/تقرير|ملف/.test(n)){
    var mp = 0, ma = 0, mr = 0;
    pool.forEach(function(x){ var r = STATE.recs[x.id]; if (!r) return; if (r.minReview === 'pending') mp++; else if (r.minReview === 'approved') ma++; else if (r.minReview === 'revisit' || r.minReview === 'rejected') mr++; });
    out += aqCard(t('اعتماد الوزارة') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ''), aqRow('بانتظار الوزارة', nm(mp)) + aqRow('اعتمدتها الوزارة', nm(ma)) + aqRow('ردّتها الوزارة', nm(mr)),
      aqGo('اعتماد الوزارة', 'page|minappr'));
  }
  /* ٩ · (V38.15) الإشغالُ الأعلى من آخر جسر */
  if (/اشغال|زحمه|ازدحام|مليان|ممتلي|ممتلئ|اعلي اشغال/.test(n) && typeof extStatusRows === 'function'){
    var R3 = (extStatusRows() || []).filter(function(r){ return r.ov && r.pct != null && (!sc2.zone || r.x.zone === sc2.zone); }).sort(function(a, b){ return b.pct - a.pct; });
    out += aqCard(t('الإشغال') + (scopeTxt ? ' \u00b7 ' + scopeTxt : ''),
      (R3.length ? R3.slice(0, 6).map(function(r){ return aqRow(r.code || r.x.id, nm(r.pct) + '% \u00b7 ' + nm(r.tot) + '/' + nm(r.cap)); }).join('')
                 : '<p class="hint" style="margin:0">' + esc(t('لا أرقامَ إشغالٍ في آخر جسر — شغّل الجسر بعد الربط الجماعي')) + '</p>')
      + (EXT.bridge ? '<p class="hint" style="margin:6px 0 0">' + esc(t('بحسب آخر جسر')) + ' ' + esc(pilotAgo(EXT.bridge.at)) + '</p>' : ''),
      aqGo('المخيمات المركزية', 'page|mcamps|ov'));
  }
  /* ٥ · ما ينقص للجاهزية */
  if (/ناقص|جاهز|نجهز|معلق|المطلوب|الجاي|اعمل ايه|نعمل ايه/.test(n)){
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
  return out;
}
