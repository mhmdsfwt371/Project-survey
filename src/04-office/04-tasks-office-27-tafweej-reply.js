/* ============================================================================
   FILE    : src/04-office/04-tasks-office-27-tafweej-reply.js
   DOMAIN  : Office — «ردود أفاقي» (V47.15): AFAQY's reply to the tafweej monitoring plan, gate by gate
   PURPOSE : The tafweej management's sheet puts the corridor gates in two phases or outside the monitoring need. AFAQY answers
             every gate with no conditions: a gate in the phases is «مطابق»; a gate installed in 1447 and set outside is
             «رئيسية في رصد ١٤٤٧»; every other gate outside is «داعمة للرصد» for one reason — a flow the study says it has no
             counts for, a second read on a route that has phase gates, a side corridor no phase gate covers, or density by its
             camera. The reasons come from the sheet itself (its street and its peak), so the numbers add up and follow a newer
             sheet. Shown in «متابعة الوزارة ← ردود أفاقي» (each category opens its list beside the plan's own fields, with
             Excel) and under the plan in the point's card. A draft is seen inside AFAQY only; the engineer opens it to the
             tafweej management, then to the Ministry.
   DEFINES : PV.TAF_RP, PV.TAF_RP_ORDER, PV.TAF_RP_C, tafRp47, tafRpIndex, tafRpOf, tafRpFill, tafRpLine, tafRpTags, tafRpAll, tafRpStats, tafRpHead, tafRpRows, tafRpListReg, tafRpJmr2, tafRpRow, tafRpPubBar, tafReplyDash, tafReplyPop, tafRpWrite, tafReplyPub, tafReplyNote, tafReplyXlsx, clickTafReply
   GLOBALS : reads STATE.taf (settings/tafappr m: __plan, __reply, <id>.pl with t its street and q its peak, <id>.rn the note),
             PV.TAF1447, MFU.lists; writes through CORE.set('cfg', 'tafappr') as the plan does
   NOTE    : tafReplySt and tafReplySees are in core (03-survey-records-05) — the tab bar asks them before this chunk loads.
   ============================================================================ */

/* The six categories, in the order the board shows them. The words are the owner's: no «بشرط», no «إعادة تقييم». */
PV.TAF_RP = {
  match:{ s:'مطابق', c:'ok', t:'بوابات المرحلتين الأولى والثانية', d:'متفق على تصنيفها كما في الدراسة' },
  y47:{ s:'رئيسية في رصد ١٤٤٧', c:'y47', t:'نقاط موسم ١٤٤٧', d:'ركبت في الموسم الماضي وكانت من نقاط الرصد الرئيسية، ولها سجل قراءات يتيح المقارنة بين الموسمين' },
  acc:{ s:'داعمة للرصد', c:'sup', t:'دقة البيانات', d:'على {n} مسارا فيها بوابات من المرحلتين، فتضيف قراءة ثانية للفوج تحدد اتجاهه وسرعته وزمن وصوله' },
  cov:{ s:'داعمة للرصد', c:'sup', t:'تغطية الممرات الفرعية', d:'على {n} ممرا فرعيا لا تمر بها بوابات المرحلتين، فتبقى حركة الحجاج عليها مرئية' },
  den:{ s:'داعمة للرصد', c:'sup', t:'قياس الكثافة', d:'تقيس الكثافة بكاميرتها في موقعها، فتكمل صورة الازدحام بين البوابات' },
  unm:{ s:'داعمة للرصد', c:'sup', t:'تدفقات لم تقسها الدراسة', d:'امتداد شارع الرحمة نحو الحرم ونفق المعيصم: ذكرت الدراسة أنها لا تملك أعدادها، وهذه النقاط توفرها' }
};
PV.TAF_RP_ORDER = ['match', 'y47', 'acc', 'cov', 'den', 'unm'];
PV.TAF_RP_C = { ok:['#22C55E', 'rgba(34,197,94,.14)'], y47:['#A78BFA', 'rgba(139,92,246,.18)'], sup:['#60A5FA', 'rgba(59,130,246,.16)'] };

/* installed in 1447: the reinstall work, or «تم إنجازه» in the tafweej management's own 1447 file */
function tafRp47(x){ var m = ((PV.TAF1447 || {}).m || {})[x.id]; return x.work === 'إعادة تركيب ١٤٤٧' || !!(m && m[1] === 'd'); }
/* the phase gates by street, per holy site: zone|street → { n, p1, p2 } */
function tafRpIndex(){
  var I = {};
  tafSites('').forEach(function(q){ var pl = tafPlan(q.x.id); if (!pl || !pl.t || (pl.p !== 'p1' && pl.p !== 'p2')) return;
    var o = I[q.x.zone + '|' + pl.t] || (I[q.x.zone + '|' + pl.t] = { n:0, p1:0, p2:0 }); o.n++; o[pl.p]++; });
  return I;
}
/* one category per gate, first match wins — so every gate is counted once */
function tafRpOf(x, I){
  var pl = tafPlan(x.id); if (!pl || !pl.p) return null;
  if (pl.p === 'p1' || pl.p === 'p2') return { k:'match', pl:pl };
  var g = pl.t ? I[x.zone + '|' + pl.t] : null;
  if (tafRp47(x)) return { k:'y47', pl:pl, g:g };
  if (/شارع الرحمة|المعيصم|المعبصم/.test(String(x.name || ''))) return { k:'unm', pl:pl };
  if (g) return { k:'acc', pl:pl, g:g };
  return { k:pl.t ? 'cov' : 'den', pl:pl };
}
/* a sentence with its blanks: the street stays apart (bdi in a card, plain in Excel) */
function tafRpFill(tpl, v, html){
  var s = t(tpl).replace('{n}', v.n != null ? nm(v.n) : '').replace('{m}', v.m != null ? nm(v.m) : '').replace('{p}', v.p ? t(v.p) : '');
  if (!html) return s.replace('{s}', v.s || '');
  return esc(s.replace('{s}', '\u0001')).replace('\u0001', bdi(v.s || ''));
}
function tafRpLine(x, R, html){
  var pl = R.pl, g = R.g, L = [], F = function(tpl, v){ L.push(tafRpFill(tpl, v || {}, html)); };
  var ph = g ? (g.p1 && g.p2 ? 'من المرحلتين' : g.p1 ? 'من المرحلة الأولى' : 'من المرحلة الثانية') : '';
  if (R.k === 'match') return tafRpFill(pl.p === 'p1' ? 'متفق على إدراجها في المرحلة الأولى.' : 'متفق على إدراجها في المرحلة الثانية.', {}, html);
  if (R.k === 'y47'){ F('ركبت في موسم ١٤٤٧ وكانت من نقاط الرصد الرئيسية، ولها سجل قراءات.');
    if (g) F(g.n === 1 ? 'تقع على {s} مع بوابة {p}.' : 'تقع على {s} مع {n} بوابات {p}.', { s:pl.t, n:g.n, p:ph }); }
  if (R.k === 'acc') F(g.n === 1 ? 'تقع على {s} مع بوابة {p}، فتضيف قراءة ثانية للفوج تحدد اتجاهه وسرعته وزمن وصوله.' : 'تقع على {s} مع {n} بوابات {p}، فتضيف قراءة ثانية للفوج تحدد اتجاهه وسرعته وزمن وصوله.', { s:pl.t, n:g.n, p:ph });
  if (R.k === 'cov') F('تقع على {s}، ولا تمر به بوابات المرحلتين، فتبقى حركة الحجاج عليه مرئية.', { s:pl.t });
  if (R.k === 'den') F('تقيس الكثافة بكاميرتها في موقعها، فتكمل صورة الازدحام بين البوابات.');
  if (R.k === 'unm') F(/الرحمة/.test(String(x.name || '')) ? 'تخدم امتداد شارع الرحمة نحو الحرم، وهو تدفق ذكرت الدراسة أنها لا تملك أعداده، فتوفر هذه النقطة أعداده الفعلية وكثافته.'
    : 'تخدم مشاة العزيزية عبر نفق المعيصم، وهو تدفق ذكرت الدراسة أنها لا تملك أعداده، فتوفر هذه النقطة أعداده الفعلية وكثافته.');
  if (pl.q > 0) F('وتقدر الدراسة ذروتها بـ{m} حاجا في الساعة.', { m:pl.q });
  return L.join(' ');
}
function tafRpTags(R){
  if (R.k === 'match') return [];
  var T = R.k === 'y47' ? ['سجل قراءات ١٤٤٧'] : [];
  if ((R.k === 'y47' || R.k === 'acc') && R.g) T.push('قراءة ثانية على المسار');
  if (R.k === 'cov' || (R.k === 'y47' && !R.g && R.pl.t)) T.push('تغطية ممر فرعي');
  if (R.k === 'unm') T.push('تدفق لم تقسه الدراسة');
  T.push('قياس الكثافة');
  return T;
}
/* every gate of the plan with its category; the gates in the system the sheet never named are counted apart */
function tafRpAll(){
  var I = tafRpIndex(), out = [], none = 0;
  tafSites('').forEach(function(q){ var R = tafRpOf(q.x, I); if (R) out.push({ x:q.x, R:R }); else none++; });
  out.none = none; return out;
}
function tafRpStats(A){
  var S = { n:A.length, none:A.none || 0 };
  PV.TAF_RP_ORDER.forEach(function(k){ S[k] = { n:0, flow:0, max:0, st:{}, p1:0, p2:0, rah:0, mua:0 }; });
  A.forEach(function(a){ var s = S[a.R.k], pl = a.R.pl; s.n++;
    if (pl.q > 0){ s.flow++; if (pl.q > s.max) s.max = pl.q; }
    if (pl.t) s.st[a.x.zone + '|' + pl.t] = 1;
    if (pl.p === 'p1' || pl.p === 'p2') s[pl.p]++;
    if (a.R.k === 'unm'){ if (/الرحمة/.test(String(a.x.name || ''))) s.rah++; else s.mua++; } });
  return S;
}
function tafRpHead(){ return ['النقطة', 'الاسم', 'المشعر', 'مرحلة الرصد', 'الترتيب', 'المقطع', 'الشارع', 'رد أفاقي', 'السبب', 'ملاحظة أفاقي', 'الحالة']; }
function tafRpRows(k){
  return tafRpAll().filter(function(a){ return !k || a.R.k === k; }).map(function(a){ var x = a.x, pl = a.R.pl, o = tafOf(x.id) || {};
    return [x.id, String(x.name || ''), t(taxOf(x).g), t(tafPhaseDef(pl.p)[1]), pl.k != null ? pl.k : '', pl.s != null ? pl.s : '', pl.t || '',
      t(PV.TAF_RP[a.R.k].s), tafRpLine(x, a.R, false), o.rn || '', t((LIFE[lifeOf(x)] || {}).n || '')]; });
}
/* each category is a list of the Ministry follow-up: its board, its table with both sides, its Excel */
function tafRpListReg(){
  PV.TAF_RP_ORDER.forEach(function(k){ var D = PV.TAF_RP[k];
    MFU.lists['tafr_' + k] = { title:t(D.s) + ' — ' + t(D.t), head:tafRpHead(),
      base:function(){ var L = tafRpAll().map(function(a){ return a.x; }); return { n:L.length, name:t('بوابات خطة رصد التفويج'), zones:svZoneTot(L) }; },
      rows:function(){ return tafRpRows(k); }, note:function(){ return tafRpPopNote(k); } };
  });
}
/* the owner: «لكل كاتيجوري بوب اب يظهر فيها الاتنين» — a category's window opens on both sides: how the plan classes
   these gates, and AFAQY's reply with its reason; the table under it carries both per gate */
function tafRpPopNote(k){
  var S = tafRpStats(tafRpAll()), D = PV.TAF_RP[k], s = S[k], C = PV.TAF_RP_C[D.c];
  var plan = k === 'match' ? t(tafPhaseDef('p1')[1]) + ' ' + nm(s.p1) + ' · ' + t(tafPhaseDef('p2')[1]) + ' ' + nm(s.p2) : t(tafPhaseDef('out')[1]);
  var side = function(lbl, val, why, col){
    return '<div style="flex:1 1 150px;min-width:0;padding:8px 10px;border-radius:10px;background:rgba(127,127,127,.08);border-inline-start:3px solid ' + col + '">'
      + '<div class="hint" style="margin:0 0 2px;font-size:12px">' + esc(lbl) + '</div><b style="font-size:14px">' + esc(val) + '</b>'
      + (why ? '<div class="hint" style="margin:4px 0 0;font-size:12.5px">' + esc(why) + '</div>' : '') + '</div>'; };
  return '<div id="tafRpPopNote" style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 4px">'
    + side(t('تصنيف الخطة'), plan, '', k === 'match' ? C[0] : tafPhaseDef('out')[2])
    + side(t('رد أفاقي'), t(D.s) + (k === 'match' ? '' : ' — ' + t(D.t)), t(D.d).replace('{n}', nm(Object.keys(s.st).length)), C[0]) + '</div>';
}
/* the three exits of the Jamarat second floor: the study calls them missing; they are points of the system */
function tafRpJmr2(){ return (STATE.sites || []).filter(function(x){ return x && typeof isJmr === 'function' && isJmr(x) && /الدور الثاني/.test(String(x.name || '')) && /مخرج/.test(String(x.name || '')); }).length; }
function tafRpRow(k, S){
  var D = PV.TAF_RP[k], s = S[k], C = PV.TAF_RP_C[D.c], d = t(D.d).replace('{n}', nm(Object.keys(s.st).length)), ev = '';
  if (k === 'match') ev = t('المرحلة الأولى') + ' ' + nm(s.p1) + ' · ' + t('المرحلة الثانية') + ' ' + nm(s.p2);
  else if (k === 'unm') ev = t('شارع الرحمة') + ' ' + nm(s.rah) + ' · ' + t('نفق المعيصم') + ' ' + nm(s.mua);
  else if (s.flow) ev = (s.flow === s.n ? t('تقدر الدراسة مرور حجاج عليها كلها، حتى {m} حاجا في الساعة وقت الذروة') : t('تقدر الدراسة مرور حجاج على {n} منها، حتى {m} حاجا في الساعة وقت الذروة')).replace('{n}', nm(s.flow)).replace('{m}', nm(s.max));
  return '<div role="button" tabindex="0" data-svlist="tafr_' + k + '" id="tafRpRow_' + k + '" title="' + esc(t('التفاصيل')) + '" style="display:grid;grid-template-columns:minmax(96px,132px) 1fr auto;gap:10px;padding:11px 14px;align-items:start;border-top:1px solid var(--line, rgba(127,127,127,.22));cursor:pointer">'
    + '<span style="font-size:12.5px;padding:3px 8px;border-radius:8px;text-align:center;background:' + C[1] + ';color:' + C[0] + ';font-weight:700">' + esc(t(D.s)) + '</span>'
    + '<span style="min-width:0"><b>' + esc(t(D.t)) + '</b><br><span class="hint" style="margin:0;font-size:13px">' + esc(d) + '</span>' + (ev ? '<br><span class="hint" style="margin:0;font-size:12px;opacity:.8">' + esc(ev) + '</span>' : '') + '</span>'
    + '<b class="num" style="font-size:18px">' + nm(s.n) + ' <span class="ds-more" aria-hidden="true">›</span></b></div>';
}
function tafRpPubBar(M){
  var st = tafReplySt(), mine = typeof may === 'function' && may('approve');
  var L = { draft:['مسودة — لا تظهر خارج أفاقي', '#F2B134'], taf:['ظاهرة لإدارة التفويج', '#60A5FA'], all:['ظاهرة لإدارة التفويج والوزارة', '#22C55E'] }[st];
  var b = !mine || !M.f ? '' : st === 'draft' ? btn(t('إظهار لإدارة التفويج') + ' \u2190', 'btn-primary btn-sm', ' data-tafrst="taf"')
    : st === 'taf' ? btn(t('إظهار للوزارة أيضا') + ' \u2190', 'btn-primary btn-sm', ' data-tafrst="all"') + btn(t('إرجاع إلى مسودة'), 'btn-quiet btn-sm', ' data-tafrst="draft"')
    : btn(t('إخفاء عن الوزارة'), 'btn-secondary btn-sm', ' data-tafrst="taf"') + btn(t('إرجاع إلى مسودة'), 'btn-quiet btn-sm', ' data-tafrst="draft"');
  var R = (STATE.taf || {}).__reply || {};
  return '<div class="card" id="tafRpPub" style="margin:0 0 10px;padding:10px 14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
    + '<span class="hint" style="margin:0">' + esc(t('حالة الرد')) + ':</span><span class="pill" style="border-color:' + L[1] + ';color:' + L[1] + ';font-weight:700">' + esc(t(L[0])) + '</span>'
    + (st !== 'draft' && R.by ? '<span class="hint" style="margin:0">' + esc(t('اعتمده')) + ' ' + esc(R.by) + ' · ' + esc(dayKey(R.at || Date.now())) + '</span>' : '') + b + '</div>';
}
function tafReplyDash(){
  var M = tafPlanMeta();
  if (!tafReplySees()) return '<p class="hint">' + esc(t('لا رد بعد على خطة رصد التفويج.')) + '</p>';
  /* inside AFAQY, before any plan: say where the plan comes from */
  if (!M) return '<p class="hint" id="tafRpNoPlan">' + esc(t('استورد خطة رصد التفويج من تبويب اعتمادات إدارة التفويج ليظهر رد أفاقي على بواباتها.')) + '</p>';
  tafRpListReg();
  var A = tafRpAll(), S = tafRpStats(A), sup = S.acc.n + S.cov.n + S.den.n + S.unm.n, inside = !/^(viewer|tafweej)$/.test(effRole(ROLE)), j2 = tafRpJmr2();
  var pc = function(v){ return S.n ? (100 * v / S.n).toFixed(1) : 0; };
  var h = '<p class="lede" style="margin:0 0 10px">' + esc(t('رد أفاقي على كل بوابة في خطة رصد التفويج: ما يطابق الخطة، وما كان رئيسيا في رصد ١٤٤٧، وما يدعم الرصد ولماذا.')) + '</p>';
  if (inside) h += tafRpPubBar(M);
  if (inside && !M.f) h += '<div class="alert warn" style="margin:0 0 10px">' + esc(t('أعد استيراد شيت الخطة من تبويب اعتمادات إدارة التفويج لتظهر الأسباب بالمسارات والتدفق.')) + '</div>';
  h += '<div class="card" id="tafRpHero" style="margin:0 0 10px"><div style="display:flex;height:14px;border-radius:7px;overflow:hidden;background:rgba(127,127,127,.18)" aria-hidden="true">'
    + '<span style="width:' + pc(S.match.n) + '%;background:' + PV.TAF_RP_C.ok[0] + '"></span><span style="width:' + pc(S.y47.n) + '%;background:' + PV.TAF_RP_C.y47[0] + '"></span><span style="width:' + pc(sup) + '%;background:' + PV.TAF_RP_C.sup[0] + '"></span></div>'
    + '<div class="hint" style="display:flex;gap:14px;flex-wrap:wrap;margin:8px 0 0">'
    + [[t('مطابق'), S.match.n, 'ok'], [t('رئيسية في رصد ١٤٤٧'), S.y47.n, 'y47'], [t('داعمة للرصد'), sup, 'sup']].map(function(g){ return '<span style="display:inline-flex;align-items:center;gap:5px"><span style="width:9px;height:9px;border-radius:2px;display:inline-block;background:' + PV.TAF_RP_C[g[2]][0] + '"></span>' + esc(g[0]) + ' <b>' + nm(g[1]) + '</b></span>'; }).join('')
    + '<span>' + esc(t('المجموع')) + ' <b>' + nm(S.n) + '</b></span></div></div>';
  h += '<div class="card" id="tafRpCats" style="margin:0 0 10px;padding:0;overflow:hidden"><div style="margin-top:-1px">' + PV.TAF_RP_ORDER.filter(function(k){ return S[k].n; }).map(function(k){ return tafRpRow(k, S); }).join('') + '</div></div>';
  if (j2) h += '<p class="hint" id="tafRpJmr" style="margin:0 0 8px">ℹ ' + esc(t('مخارج الدور الثاني بمنشأة الجمرات موجودة في النظام ({n} نقاط)، فيكتمل طوق الجمرات دورا دورا.').replace('{n}', nm(j2))) + '</p>';
  if (inside && S.none) h += '<p class="hint" style="margin:0 0 8px">' + esc(t('نقاط في النظام لم يشملها شيت الدراسة')) + ': ' + nm(S.none) + '</p>';
  h += '<div class="actions" style="margin:0 0 8px">' + btn('⬇ ' + t('إكسل ردود أفاقي'), 'btn-secondary btn-sm', ' data-tafrxl="1"') + '</div>';
  return h + '<p class="hint" style="margin:0">' + esc(t('خطة الرصد')) + ': ' + esc(M.name || '') + ' · ' + esc(t('اضغط أي فئة لترى بواباتها بتصنيف الخطة ورد أفاقي معا، مع الإكسل.')) + '</p>';
}
/* the point's card: under the plan's own block */
function tafReplyPop(s){
  if (!s || !tafReplySees()) return '';
  var R = tafRpOf(s, tafRpIndex()); if (!R) return '';
  var D = PV.TAF_RP[R.k], C = PV.TAF_RP_C[D.c], o = tafOf(s.id) || {}, me = typeof may === 'function' && may('approve');
  return '<div class="card" id="tafRpCard" style="margin:8px 0;padding:10px 12px;border-inline-start:4px solid ' + C[0] + '">'
    + '<div class="hint" style="margin:0 0 6px;font-weight:700">\u{1F4AC} ' + esc(t('رد أفاقي')) + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="pill" style="border-color:' + C[0] + ';color:' + C[0] + ';background:' + C[1] + ';font-weight:700">' + esc(t(D.s)) + '</span>'
    + tafRpTags(R).map(function(g){ return '<span class="pill" style="border-color:' + C[0] + ';color:' + C[0] + '">' + esc(t(g)) + '</span>'; }).join('') + '</div>'
    + '<div style="margin:6px 0 0;font-size:13.5px">' + tafRpLine(s, R, true) + '</div>'
    + (o.rn ? '<div style="margin:4px 0 0;font-size:13.5px"><span class="hint" style="margin:0">' + esc(t('ملاحظة أفاقي')) + ':</span> ' + esc(o.rn) + '</div>' : '')
    + (me ? '<div style="display:flex;gap:6px;margin-top:6px"><input id="tafRpNote" dir="auto" value="' + esc(o.rn || '') + '" placeholder="' + esc(t('ملاحظة أفاقي')) + '" style="flex:1">' + btn('\u{1F4BE}', 'btn-secondary btn-sm', ' data-tafrnsave="' + esc(s.id) + '"') + '</div>' : '')
    + (tafReplySt() === 'draft' ? '<div class="hint" style="margin:6px 0 0">' + esc(t('مسودة · لا تظهر خارج أفاقي قبل الاعتماد')) + '</div>' : '')
    + '</div>';
}
/* writes join what is still queued for the same document, as the plan's writes do */
function tafRpWrite(patch){
  var pend = typeof tafPending === 'function' ? tafPending() : {}; Object.keys(pend).forEach(function(k){ if (!patch[k]) patch[k] = pend[k]; });
  STATE.taf = Object.assign({}, STATE.taf || {}, patch); if (DB.memo){ DB.memo.life = null; DB.memo.lists = {}; }
  CORE.set('cfg', 'tafappr', { m:patch, at:Date.now() });
}
function tafReplyPub(st){
  if (!(typeof may === 'function' && may('approve'))){ toast(t('اعتماد الرد للمهندس')); return false; }
  var M = tafPlanMeta(); if (!M){ toast(t('لا خطة رصد بعد')); return false; }
  st = st === 'taf' || st === 'all' ? st : 'draft';
  if (st !== 'draft' && !M.f){ toast(t('أعد استيراد شيت الخطة أولا')); return false; }
  if (st === 'all' && tafReplySt() !== 'all' && typeof confirm === 'function' && !confirm(t('سيظهر الرد لحسابات الوزارة. متابعة؟'))) return false;
  tafRpWrite({ __reply:{ st:st, at:Date.now(), by:STATE.meta.name || '' } });
  logEvent('ردود أفاقي على خطة رصد التفويج — ' + (st === 'all' ? 'ظاهرة لإدارة التفويج والوزارة' : st === 'taf' ? 'ظاهرة لإدارة التفويج' : 'مسودة'));
  toast(t('حُفظ')); render(1); return true;
}
/* a line of AFAQY's own on one gate — '' clears it (the server merges, so a key is emptied, not removed) */
function tafReplyNote(id, txt){
  if (!(typeof may === 'function' && may('approve')) || !tafPlan(id)){ toast(t('اعتماد الرد للمهندس')); return false; }
  var v = String(txt || '').trim().slice(0, 200), o = Object.assign({}, tafOf(id) || {}, { rn:v }), patch = {}; patch[id] = o;
  tafRpWrite(patch);
  logEvent('ملاحظة أفاقي — ' + id + (v ? ' · ' + v.slice(0, 120) : ''), id);
  toast(t('حُفظ')); render(1); return true;
}
function tafReplyXlsx(){
  var A = tafRpAll(), rows = A.map(function(a){ var x = a.x, pl = a.R.pl, o = tafOf(x.id) || {};
    return [x.id, String(x.name || ''), t(x.zone), t(tafPhaseDef(pl.p)[1]), pl.k != null ? pl.k : '', pl.s != null ? pl.s : '', pl.t || '', pl.q > 0 ? pl.q : '',
      t(PV.TAF_RP[a.R.k].s), t(PV.TAF_RP[a.R.k].t), tafRpLine(x, a.R, false), o.rn || '', t((LIFE[lifeOf(x)] || {}).n || ''), +x.lat || '', +x.lng || '']; });
  logEvent('تصدير ردود أفاقي — ' + rows.length);
  return mtXlsx('ردود أفاقي على خطة رصد التفويج', ['الرقم', 'الاسم', 'المشعر', 'مرحلة الرصد', 'الترتيب', 'المقطع', 'الشارع', 'ذروة الدراسة (حاج في الساعة)', 'رد أفاقي', 'الفئة', 'السبب', 'ملاحظة أفاقي', 'الحالة', 'خط العرض', 'خط الطول'], rows);
}
function clickTafReply(e){
  var el;
  if ((el = e.target.closest('[data-tafrst]'))){ tafReplyPub(el.getAttribute('data-tafrst')); return true; }
  if (e.target.closest('[data-tafrxl]')){ tafReplyXlsx(); return true; }
  if ((el = e.target.closest('[data-tafrnsave]'))){ var inp = document.getElementById('tafRpNote'); tafReplyNote(el.getAttribute('data-tafrnsave'), inp ? inp.value : ''); return true; }
  return false;
}
