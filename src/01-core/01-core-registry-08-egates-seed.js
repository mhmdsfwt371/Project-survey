/* ============================================================================
   FILE    : src/01-core/01-core-registry-08-egates-seed.js
   DOMAIN  : Core — language, engine, sync, registry
   PURPOSE : Al Mashaaer train: the nine stations and their 62 E-GATE points (registry points at the station reference, owner decision Q-023), the station card listing its gates and the per-gate verification editor.
   DEFINES : egSeed, egStations, egIsStation, egIsGate, egList, egOf, egOps, egCard, egSave
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ============================================================================
   (V38.31 → V38.34) Al Mashaaer train — stations and E-GATE points
   Owner decision (Q-023, V38.34): every E-GATE is a regular registry point of the train zone, placed at its
   station's reference coordinates (±3 m ring so pins stay distinguishable), count per station as the owner
   gave them (62 total). They appear on the map and in every list and count like any point; the field survey
   corrects each gate's position through the normal site-edit path. The drawing pages per station come from
   the owner's manifest (revision 2026-10-19). Verification data per gate (official number on the drawing, connected
   readers, operational status, drawing reference) is written as an override layer on the gate's own site
   record (sites/<gateId>), never on this file.
   ========================================================================== */
function egSeed(){ return egSeed.v || (egSeed.v = {"rev": "2026-10-19", "drawing": "CamScanner 05-05-2026 17.07.pdf; 32 pages", "stations": {"NSK-TRN-STN-0101": {"code": "AR1", "pages": [1], "n": 10}, "NSK-TRN-STN-0102": {"code": "AR2", "pages": [2, 3], "n": 10}, "NSK-TRN-STN-0103": {"code": "AR3", "pages": [4, 5, 6], "n": 10}, "NSK-TRN-STN-0104": {"code": "MZ1", "pages": [7, 8], "n": 4}, "NSK-TRN-STN-0105": {"code": "MZ2", "pages": [9, 10, 11], "n": 3}, "NSK-TRN-STN-0106": {"code": "MZ3", "pages": [12, 13, 14, 15], "n": 4}, "NSK-TRN-STN-0107": {"code": "MN1", "pages": [16, 17, 18], "n": 8}, "NSK-TRN-STN-0108": {"code": "MN2", "pages": [19, 20, 21, 22], "n": 8}, "NSK-TRN-STN-0109": {"code": "MN3", "pages": [23, 24, 25, 26, 27, 28, 29], "n": 5}}}); }
function egStations(){ return Object.keys(egSeed().stations); }
function egIsStation(x){ return !!x && x.type === 'محطة' && !!egSeed().stations[x.id]; }
function egIsGate(x){ return !!x && x.type === 'بوابة' && /^NSK-TRN-EGT-/.test(String(x.id || '')); }
/* gate points of a station: registry points of type gate whose sq is the station code */
function egList(stationId){
  var S = egSeed().stations[stationId]; if (!S) return [];
  return STATE.sites.filter(function(x){ return egIsGate(x) && x.sq === S.code; }).map(egOf);
}
/* a gate as read: the point + its verification override (siteOv wins over the merged site object) */
function egOf(x){
  if (typeof x === 'string') x = siteFind(x);
  if (!x) return null;
  var ov = (STATE.siteOv && STATE.siteOv[x.id]) || {}, g = function(k){ return ov[k] !== undefined ? ov[k] : (x[k] || ''); };
  var st = STATE.sites.filter(function(s){ return egIsStation(s) && egSeed().stations[s.id].code === x.sq; })[0];
  var moved = !!(st && (Math.abs(+x.lat - +st.lat) > 0.0002 || Math.abs(+x.lng - +st.lng) > 0.0002));   /* > ~20 m from the reference = surveyed position */
  return { id:x.id, label:x.sign || x.id, stn:st ? st.id : '', pages:(st && egSeed().stations[st.id].pages) || [], lat:+x.lat, lng:+x.lng, moved:moved,
           no:g('gateNo'), readers:g('readers'), op:g('opStatus'), draw:g('drawRef'), note:g('gateNote'), at:ov.gateAt || 0, by:ov.gateBy || '' };
}
function egOps(){ return ['غير مركّبة', 'قيد التركيب', 'تعمل', 'معطّلة', 'ملغاة']; }
/* the card on the station page */
function egCard(x){
  if (!egIsStation(x)) return '';
  var L = egList(x.id), S = egSeed().stations[x.id], done = L.filter(function(g){ return g.no; }).length, can = typeof maySiteEditBasic === 'function' && maySiteEditBasic();
  var head = alertBox('warn', t('جردٌ أوّليٌّ من مراجعة الرسومات (صفحات') + ' ' + S.pages.map(nm).join('، ') + ') — ' + t('البواباتُ موضوعةٌ عند مرجع المحطة حتى يحدّد المسحُ موقعَ كلٍّ منها، والعددُ والمعرِّفاتُ مؤقّتةٌ حتى تُطابَق على الرسومات الأصلية'));
  var rows = L.map(function(g){
    var open = egCard.open === g.id;
    var line = '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 0;border-top:1px solid var(--line)">'
      + '<b class="num">' + esc(g.label) + '</b>'
      + (g.no ? pill(t('رقم الرسمة') + ' ' + g.no, 'acc') : pill('غير مطابَق', 'warn'))
      + (g.moved ? pill('\u{1F4CD} ' + t('موقعٌ محدَّدٌ بالمسح'), 'ok') : pill('عند مرجع المحطة', ''))
      + (g.op ? pill(g.op, g.op === 'تعمل' ? 'ok' : g.op === 'معطّلة' ? 'bad' : 'info') : '')
      + (g.readers ? '<span class="hint" style="margin:0">' + esc(t('قرّاء')) + ': ' + esc(g.readers) + '</span>' : '')
      + '<span style="margin-inline-start:auto"></span>'
      + btn('\u25C8', 'btn-quiet btn-sm', ' data-fly="' + esc(g.id) + '" title="' + esc(t('على الخريطة')) + '"')
      + btn('\u{1F4C4}', 'btn-quiet btn-sm', ' data-site="' + esc(g.id) + '" title="' + esc(t('تفاصيل الموقع')) + '"')
      + (can ? btn(open ? t('إغلاق') : '\u270E ' + t('تحقيق'), 'btn-quiet btn-sm', ' data-egopen="' + esc(open ? '' : g.id) + '"') : '')
      + '</div>';
    if (!open) return line;
    var inp = function(id, lbl, v, ph){ return '<div class="field"><label>' + esc(t(lbl)) + '</label><input id="' + id + '" value="' + esc(v || '') + '" placeholder="' + esc(ph || '') + '"></div>'; };
    return line + '<div class="grid cols-2" style="margin:4px 0 8px">'
      + inp('egNo', 'الرقم الرسمي على الرسمة', g.no, 'كما هو مطبوعٌ على الرسمة')
      + inp('egDraw', 'مرجع الرسمة', g.draw || (g.pages.length ? 'ص ' + g.pages.join('، ') : ''), 'رقم الصفحة أو اللوحة')
      + inp('egReaders', 'القرّاء المربوطة', g.readers, 'أرقام القرّاء التسلسلية — بفاصلة')
      + '<div class="field"><label>' + esc(t('الحالة التشغيلية')) + '</label><select id="egOp">' + [''].concat(egOps()).map(function(o){ return '<option value="' + esc(o) + '"' + (o === g.op ? ' selected' : '') + '>' + esc(o ? t(o) : '\u2014') + '</option>'; }).join('') + '</select></div>'
      + '</div><div class="field"><label>' + esc(t('ملاحظة')) + '</label><input id="egNote" value="' + esc(g.note) + '"></div>'
      + '<p class="hint" style="margin:0 0 6px">' + esc(t('موقعُ البوابة يُصحَّح من صفحة النقطة نفسِها (تعديل البيانات أو سحبُ الدبّوس على الخريطة)')) + '</p>'
      + '<div class="actions">' + btn('\u2713 ' + t('احفظ التحقيق'), 'btn-primary btn-sm', ' data-egsave="' + esc(g.id) + '"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-egopen=""') + '</div>';
  }).join('');
  return card('\u{1F6AA} ' + t('البوابات الإلكترونية') + ' \u2014 ' + nm(L.length) + ' \u00b7 ' + nm(done) + ' ' + t('مطابَقة على الرسمة'),
    head + rows + '<p class="hint" style="margin:8px 0 0">' + esc(t('المصدر')) + ': ' + esc(egSeed().drawing) + ' \u00b7 ' + esc(t('مراجعة')) + ' ' + esc(egSeed().rev) + ' \u00b7 ' + esc(t('بوابةٌ لم تكن في الجرد تُضاف كنقطةٍ غيرِ مسجّلةٍ من الميدان')) + '</p>');
}
function egSave(gateId){
  if (!(typeof maySiteEditBasic === 'function' && maySiteEditBasic())){ toast(t('تحقيقُ البوابات للمشرف فما فوق')); return false; }
  var x = siteFind(gateId); if (!x || !egIsGate(x)){ toast(t('لا بوابةَ بهذا المعرِّف')); return false; }
  var g = function(n){ var el = document.getElementById(n); return el ? String(el.value || '').trim() : ''; };
  siteOvSet(gateId, { gateNo:g('egNo'), drawRef:g('egDraw'), readers:g('egReaders'), opStatus:g('egOp'), gateNote:g('egNote'), gateAt:Date.now(), gateBy:STATE.meta.name || '' });
  logEvent('تحقيقُ بوابة ' + (x.sign || gateId) + (g('egNo') ? ' — رقمُ الرسمة ' + g('egNo') : ''), gateId);
  egCard.open = ''; toast('\u2713 ' + t('حُفظ تحقيقُ البوابة')); return true;
}
