/* ============================================================================
   FILE    : src/03zz-late/03z-shared--03z-shared-21-from-ministry-alerts-07-weekly-export-scope.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/03z-shared/03z-shared-21-from-ministry-alerts-07-weekly-export-scope.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : hijriToday, expScopeIds, expScopeLabel, mfuReport, mfuReport0
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
/* ═══ تصديرُ التحديث الأسبوعي (V20.2) ═══
   صفحةُ متابعة الوزارة تُصدَّر كما كان العرضُ الأسبوعيُّ يُرسَل: وورد وإكسل وPDF —
   من الجهاز نفسِه بلا خادمٍ ولا انتظار (الإكسلُ يحمّل محرّكَه أوّلَ مرةٍ ثم يُخبَّأ).
   مصدرٌ واحدٌ للأرقام (mfuReport) فلا تختلف صيغةٌ عن صيغة، والنصُّ عربيٌّ من اليمين
   بألوان العرض: أخضرُ غامق 163E35 وذهبيٌّ C8943E وبيجٌ FAF6F3، وخطُّ Alexandria. */
function hijriToday(){ var lang = (typeof LANG === 'string' && LANG) || 'ar', c = hijriToday.c, k = lang + '|' + Math.floor(Date.now() / 60000); if (c && c.k === k) return c.v;   /* (V33.7) منسّقُ التقويم مكلف — مرةً في الدقيقة؛ (V33.8) بلغة الواجهة */
  var v = ''; try { v = new Intl.DateTimeFormat((lang === 'ar' ? 'ar-SA' : lang === 'ur' ? 'ur-PK' : 'en-GB') + '-u-ca-islamic-umalqura', { day:'numeric', month:'long', year:'numeric' }).format(new Date()); } catch (e){ v = ''; } hijriToday.c = { k:k, v:v }; return v; }

function expScopeIds(){
  if (EXP.scope.m === 'sel') return selIds();
  if (EXP.scope.m === 'tax' && (EXP.scope.g || EXP.scope.t)) return (STATE.sites || []).filter(function(x){ var c = taxOf(x); return (!EXP.scope.g || c.g === EXP.scope.g) && (!EXP.scope.t || c.t === EXP.scope.t); }).map(function(x){ return x.id; });
  return null;
}

function expScopeLabel(){
  if (EXP.scope.m === 'sel') return t('نقاطٌ محدَّدة') + ' (' + nm(SEL_N) + ')';
  if (EXP.scope.m === 'tax' && (EXP.scope.g || EXP.scope.t)) return [EXP.scope.g, EXP.scope.t].filter(Boolean).map(function(v){ return t(v); }).join(' \u00b7 ');
  return '';
}

function mfuReport(){
  var ids = expScopeIds(); if (!ids) return mfuReport0();
  var keep = {}; ids.forEach(function(id){ keep[id] = 1; });
  var all = STATE.sites; STATE.sites = (all || []).filter(function(x){ return keep[x.id]; });
  try { var R = mfuReport0(), sl = expScopeLabel(); R.scope = sl; R.greg += ' \u2014 ' + t('النطاق') + ': ' + sl;
    (R.kpis || []).forEach(function(k){ k[3] = null; });   /* الفرقُ عن الأسبوع الماضي محسوبٌ للكلّ — لا يُقارَن به نطاقٌ جزئيّ */
    return R; }
  finally { STATE.sites = all; }
}

function mfuReport0(){
  var K = mfuKpis(), P = mfuPrev(), pc = function(a, b){ return b ? Math.round(a / b * 100) : 0; };
  K.srvd = (STATE.sites || []).filter(function(x){ return svDone(STATE.recs[x.id]); }).length;   /* (V37.35) الممسوحُ فعلًا — من تعريف حلقة «المسح» نفسِه */
  var dlt = function(cur, key){ return P && P[key] != null ? cur - P[key] : null; };
  var Z = {};
  (STATE.sites || []).forEach(function(x){ var k = x.zone + '|' + x.type; var o = Z[k] = Z[k] || { z:x.zone, ty:x.type, n:0, i:0 }; o.n++; if (mfuInstalled(x)) o.i++; });
  var flt = mfuFltLabel(), O = mfuObstaclesF(), byCat = {}, byParty = {}; mfuParties().forEach(function(p){ byParty[p] = 0; });   /* (V27.3) بفلتر الصفحة إن وُضع */
  O.forEach(function(o){ var seen = {}; o.cats.forEach(function(c){ byCat[c] = (byCat[c] || 0) + 1; var p = mfuOwnerOf(c); if (!seen[p]){ seen[p] = 1; byParty[p]++; } }); });
  return {
    greg:dayKey() + (flt ? ' \u2014 ' + t('بفلتر') + ': ' + flt : ''), hijri:hijriToday(), ver:appVer(), flt:flt,
    kpis:[['نسبة الزيارة', pc(K.sv, K.tot) + '٪', K.sv + ' من ' + K.tot, dlt(K.sv, 'sv')],   /* (V37.35) البندُ ٥: كان اسمُه «نسبة المسح» ورقمُه الزيارة — مصطلحُ المالك: «تمت الزيارة» أيُّ زيارة، و«المسح» ما وُصل ومُسح */
          ['نسبة المسح', pc(K.srvd, K.tot) + '٪', K.srvd + ' من ' + K.tot, null],
          ['تركيب المخيمات', pc(K.campIns, K.camp) + '٪', K.campIns + ' من ' + K.camp, dlt(K.campIns, 'campIns')],
          ['تركيب الممرات', pc(K.corIns, K.cor) + '٪', K.corIns + ' من ' + K.cor, dlt(K.corIns, 'corIns')],
          ['المعوقات القائمة', String(flt ? O.length : K.obs), flt || '', flt ? null : dlt(K.obs, 'obs')],
          K.ins ? ['شركات الخدمة (ممتاز · متوسط · ضعيف)', K.ex + ' · ' + K.md + ' · ' + K.wk, '', null] : ['شركات الخدمة', String(mfuCompanies().length), 'مرحلة المسح — لم يبدأ التواصل والتركيب', null],   /* (V29.1) */
          ['اعتماد تقني مكتمل', String(mfuMinWait()), 'نقطةً معتمدةً تقنيًّا', null],   /* (V37.35) قاعدةُ المالك: لا «بانتظار قرار الوزارة» فيما تراه الوزارة */
          ['تحدياتٌ مفتوحة', String(K.chal), '', null], ['طلباتٌ قيد المتابعة', String(K.req), '', null]],
    tasks:(wtRows().length ? mfuWeekRows().map(function(x){ var r = x.r;
            var link = r.chal ? (r.st === 'مكتمل' ? '✓ تحدٍّ حُلّ: ' : '⚠ تحدٍّ: ') + String(r.chal).replace(/^[FMT]:/, '') : r.req ? (r.st === 'مكتمل' ? '✓ طلبٌ نُفّذ' : '📨 طلب الوزارة') : '';
            return [r.n, r.track || '', r.who || '', x.late && r.st !== 'مكتمل' ? r.st + ' (متأخرة)' : r.st, r.due || '', String(x.upd).slice(0, 120), link]; })
          : mileList().map(function(m){ var p = Math.round(mileDone(m) * 100), d = mileDateOf(m); return [m.n, 'المعالم', '', p >= 100 ? 'مكتمل' : mileLate(m) ? 'متأخر' : p > 0 ? 'جارٍ' : 'لم يبدأ', d ? dayKey(d) : '', p + '٪', '']; })),
    inst:Object.keys(Z).map(function(k){ return Z[k]; }).sort(function(a, b){ return a.z < b.z ? -1 : a.z > b.z ? 1 : b.n - a.n; })
          .map(function(o){ return [o.z, (CAT_DEF[o.ty] || {}).l || o.ty, o.n, o.i, (o.n ? Math.round(o.i / o.n * 100) : 0) + '٪']; }),
    cos:(function(){ var C = mfuCompanies(), ph = C.some(function(c){ return c.ins > 0; });   /* (V29.1) المرحلة: لا تركيبَ بعد ⇒ لا تصنيفَ بالتركيب */
      return C.map(function(c){ return [c.co, coLiaisonOf(c.co) || '\u2014', c.n, c.sv, c.n - c.sv, c.chal, c.svp + '٪', c.ins, ph && c.ins ? t('التركيب') + ': ' + mfuLevel(c.pct)[0] + ' (' + c.pct + '٪)' : t('مرحلة المسح — لم يبدأ التواصل والتركيب')]; }); })(),
    phase:mfuCompanies().some(function(c){ return c.ins > 0; }) ? 'install' : 'survey',
    sv:svStats(), svz:svStats().zones, svd:svStats().detail, jmr:jmrConfirm().rows,   /* (V29.2) */
    brief:mfuBriefText().split('\n').map(function(l){ return [l]; }),   /* (V29.9) */
    obsTotal:O.length, parties:mfuParties().map(function(p){ return [mfuPartyLabel(p), byParty[p] || 0]; }),
    cats:Object.keys(byCat).sort(function(a, b){ return byCat[b] - byCat[a]; }).map(function(c){ return [c, byCat[c], mfuOwnerOf(c)]; }),
    chal:mfuAllChal().map(function(c){ return [MFU.src[c.src][0], c.t + (c.src === 'field' ? ' (' + c.n + ' نقطة)' : ''), c.party || '—', c.owner || '—', c.m || '—', c.st + (c.tk ? ' · مهمة #' + c.tk.id + ' ' + c.tk.st : '')]; }),
    req:mfuList('req').map(function(x, i){ var V = mfuReqView(x); return [i + 1, x.t || '', V.u + (V.uSrc ? ' (من المهمة #' + V.uSrc + ')' : ''), x.s || '', V.st + (V.blocked ? ' — متوقفة' : ''), V.tk ? '#' + V.tk.id + ' ' + V.tk.st : '—']; }),
    blocks:(function(){ var B = mfuWeekBlocks(), rows = [];
      B.done.slice(0, 10).forEach(function(r){ rows.push(['أبرز الأعمال المنجزة', r.n, (r.who ? r.who + ' · ' : '') + dayKey(mfuDoneAt(r))]); });
      B.next.slice(0, 10).forEach(function(r){ rows.push(['أبرز المهام القادمة', r.n, (r.who || 'بلا مسؤول') + (r.due ? ' · ' + r.due : '')]); });
      B.wait.slice(0, 6).forEach(function(r){ rows.push(['الاعتمادات والدعم المطلوب', r.n, r.st + (r.who ? ' · ' + r.who : '')]); });
      B.support.slice(0, 6).forEach(function(x){ rows.push(['الاعتمادات والدعم المطلوب', x.s, 'طلب الوزارة: ' + String(x.t || '').slice(0, 60)]); });
      B.late.slice(0, 10).forEach(function(r){ rows.push(['المهام المتأخرة', r.n, (r.who || 'بلا مسؤول') + ' · تأخّر ' + (-wtDue(r)) + ' يوم']); });
      return rows; })(),
    blk:(function(){ var B = mfuWeekBlocks(); return { done:B.done.length, doneLast:B.doneLast, next:B.next.length, late:B.late.length, wait:B.wait.length, meet:B.meet }; })(),
    weeks:(function(){ var snap = mfuData().snap || {}; return Object.keys(snap).sort().slice(-8).map(function(k){ var v = snap[k]; return [k, v.sv || 0, v.campIns || 0, v.corIns || 0, v.obs || 0]; }); })(),
    owners:mfuOwnersLoad().slice(0, 10).map(function(o){ return [o.n, o.chal, o.task, o.late]; }),
    updTitle:(function(){ var W0 = STATE.wtask || {}; return W0.meetAt && Date.now() - W0.meetAt < 14 * 864e5 ? 'ما تغيّر منذ آخر اجتماع (' + dayKey(W0.meetAt) + ')' : 'آخر التحديثات — هذا الأسبوع'; })(),
    upd:mfuTimeline((function(){ var W0 = STATE.wtask || {}; return W0.meetAt && Date.now() - W0.meetAt < 14 * 864e5 ? Math.max(1, (Date.now() - W0.meetAt) / 864e5) : 7; })(), 30).map(function(e){ return [dayKey(e.at), e.k, String(e.ref).slice(0, 80), String(e.txt).slice(0, 140), e.by]; }),
    daily:diaryRows().slice(-14).reverse().map(function(r){ return [r.day, r.sv, r.ins, r.dis, r.stuck || 0]; })   /* (V24.0) العملُ كلُّه بترتيب الصفحة */
  };
}
