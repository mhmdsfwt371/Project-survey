/* ============================================================================
   FILE    : src/01-core/01-core-registry-08-egates-seed.js
   DOMAIN  : Core — language, engine, sync, registry
   PURPOSE : Al Mashaaer train: the nine station references and the provisional E-GATE inventory (no coordinates until verified), the station E-GATE card, verification editor and map points.
   DEFINES : egSeed, egStations, egSeedOf, egOvOf, egOf, egList, egOps, egIsStation, egCard, egSave, egAdd, egMapPoints
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */
/* ═══ (V38.31) قطار المشاعر — المحطاتُ التسعُ وجردُ البوابات الإلكترونية الأوّليّ ═══
   مصدرُ البيانات: ملفُ المالك Mashair_EGATE_Import_Manifest_PRELIMINARY.json (مراجعة 2026-10-19) وKMZ المحطات.
   المحطاتُ التسعُ بإحداثياتٍ مرجعيةٍ مؤكَّدة (WGS84 من عقد السكة في الخريطة المفتوحة) — وهي في سجلِّ النقاط.
   البواباتُ ٦٢ جردٌ أوّليٌّ من مراجعة الرسومات: بلا إحداثياتٍ عمدًا، ومعرِّفاتُها تسلسلٌ مؤقّتٌ لا أرقامُ الرسمة.
   لا يُنسَخ موقعُ المحطة لبوابة، ولا تُرسَم بوابةٌ على الخريطة حتى تُحقَّق إحداثياتُها من الرسم المُرجَّع أو المسح الميدانيّ.
   ما يحقّقه الميدانُ (الرقمُ الرسميُّ، الإحداثيات، القرّاءُ المربوطة، الحالةُ التشغيلية، مرجعُ الرسمة) يُكتَب طبقةً فوق
   المحطة في مجموعة sites (الحقل egates) — ولا يُعدَّل هذا الملف. */
function egSeed(){ return egSeed.v || (egSeed.v = {"rev": "2026-10-19", "status": "PRELIMINARY_UNVERIFIED", "drawing": "CamScanner 05-05-2026 17.07.pdf; 32 pages", "stations": {"NSK-TRN-STN-0101": {"code": "AR1", "pages": [1], "n": 10, "src": "https://mapcarta.com/N4534861100"}, "NSK-TRN-STN-0102": {"code": "AR2", "pages": [2, 3], "n": 10, "src": "https://mapcarta.com/N1655978243"}, "NSK-TRN-STN-0103": {"code": "AR3", "pages": [4, 5, 6], "n": 10, "src": "https://mapcarta.com/N4534861098"}, "NSK-TRN-STN-0104": {"code": "MZ1", "pages": [7, 8], "n": 4, "src": "https://mapcarta.com/N4534838647"}, "NSK-TRN-STN-0105": {"code": "MZ2", "pages": [9, 10, 11], "n": 3, "src": "https://mapcarta.com/N4534834974"}, "NSK-TRN-STN-0106": {"code": "MZ3", "pages": [12, 13, 14, 15], "n": 4, "src": "https://mapcarta.com/N4534824625"}, "NSK-TRN-STN-0107": {"code": "MN1", "pages": [16, 17, 18], "n": 8, "src": "https://mapcarta.com/N4534822206"}, "NSK-TRN-STN-0108": {"code": "MN2", "pages": [19, 20, 21, 22], "n": 8, "src": "https://mapcarta.com/N4534822205"}, "NSK-TRN-STN-0109": {"code": "MN3", "pages": [23, 24, 25, 26, 27, 28, 29], "n": 5, "src": "https://mapcarta.com/N6024783454"}}, "gates": [{"id": "AR1-C01", "stn": "NSK-TRN-STN-0101", "pages": [1]}, {"id": "AR1-C02", "stn": "NSK-TRN-STN-0101", "pages": [1]}, {"id": "AR1-C03", "stn": "NSK-TRN-STN-0101", "pages": [1]}, {"id": "AR1-C04", "stn": "NSK-TRN-STN-0101", "pages": [1]}, {"id": "AR1-C05", "stn": "NSK-TRN-STN-0101", "pages": [1]}, {"id": "AR1-C06", "stn": "NSK-TRN-STN-0101", "pages": [1]}, {"id": "AR1-C07", "stn": "NSK-TRN-STN-0101", "pages": [1]}, {"id": "AR1-C08", "stn": "NSK-TRN-STN-0101", "pages": [1]}, {"id": "AR1-C09", "stn": "NSK-TRN-STN-0101", "pages": [1]}, {"id": "AR1-C10", "stn": "NSK-TRN-STN-0101", "pages": [1]}, {"id": "AR2-C01", "stn": "NSK-TRN-STN-0102", "pages": [2, 3]}, {"id": "AR2-C02", "stn": "NSK-TRN-STN-0102", "pages": [2, 3]}, {"id": "AR2-C03", "stn": "NSK-TRN-STN-0102", "pages": [2, 3]}, {"id": "AR2-C04", "stn": "NSK-TRN-STN-0102", "pages": [2, 3]}, {"id": "AR2-C05", "stn": "NSK-TRN-STN-0102", "pages": [2, 3]}, {"id": "AR2-C06", "stn": "NSK-TRN-STN-0102", "pages": [2, 3]}, {"id": "AR2-C07", "stn": "NSK-TRN-STN-0102", "pages": [2, 3]}, {"id": "AR2-C08", "stn": "NSK-TRN-STN-0102", "pages": [2, 3]}, {"id": "AR2-C09", "stn": "NSK-TRN-STN-0102", "pages": [2, 3]}, {"id": "AR2-C10", "stn": "NSK-TRN-STN-0102", "pages": [2, 3]}, {"id": "AR3-C01", "stn": "NSK-TRN-STN-0103", "pages": [4, 5, 6]}, {"id": "AR3-C02", "stn": "NSK-TRN-STN-0103", "pages": [4, 5, 6]}, {"id": "AR3-C03", "stn": "NSK-TRN-STN-0103", "pages": [4, 5, 6]}, {"id": "AR3-C04", "stn": "NSK-TRN-STN-0103", "pages": [4, 5, 6]}, {"id": "AR3-C05", "stn": "NSK-TRN-STN-0103", "pages": [4, 5, 6]}, {"id": "AR3-C06", "stn": "NSK-TRN-STN-0103", "pages": [4, 5, 6]}, {"id": "AR3-C07", "stn": "NSK-TRN-STN-0103", "pages": [4, 5, 6]}, {"id": "AR3-C08", "stn": "NSK-TRN-STN-0103", "pages": [4, 5, 6]}, {"id": "AR3-C09", "stn": "NSK-TRN-STN-0103", "pages": [4, 5, 6]}, {"id": "AR3-C10", "stn": "NSK-TRN-STN-0103", "pages": [4, 5, 6]}, {"id": "MZ1-C01", "stn": "NSK-TRN-STN-0104", "pages": [7, 8]}, {"id": "MZ1-C02", "stn": "NSK-TRN-STN-0104", "pages": [7, 8]}, {"id": "MZ1-C03", "stn": "NSK-TRN-STN-0104", "pages": [7, 8]}, {"id": "MZ1-C04", "stn": "NSK-TRN-STN-0104", "pages": [7, 8]}, {"id": "MZ2-C01", "stn": "NSK-TRN-STN-0105", "pages": [9, 10, 11]}, {"id": "MZ2-C02", "stn": "NSK-TRN-STN-0105", "pages": [9, 10, 11]}, {"id": "MZ2-C03", "stn": "NSK-TRN-STN-0105", "pages": [9, 10, 11]}, {"id": "MZ3-C01", "stn": "NSK-TRN-STN-0106", "pages": [12, 13, 14, 15]}, {"id": "MZ3-C02", "stn": "NSK-TRN-STN-0106", "pages": [12, 13, 14, 15]}, {"id": "MZ3-C03", "stn": "NSK-TRN-STN-0106", "pages": [12, 13, 14, 15]}, {"id": "MZ3-C04", "stn": "NSK-TRN-STN-0106", "pages": [12, 13, 14, 15]}, {"id": "MN1-C01", "stn": "NSK-TRN-STN-0107", "pages": [16, 17, 18]}, {"id": "MN1-C02", "stn": "NSK-TRN-STN-0107", "pages": [16, 17, 18]}, {"id": "MN1-C03", "stn": "NSK-TRN-STN-0107", "pages": [16, 17, 18]}, {"id": "MN1-C04", "stn": "NSK-TRN-STN-0107", "pages": [16, 17, 18]}, {"id": "MN1-C05", "stn": "NSK-TRN-STN-0107", "pages": [16, 17, 18]}, {"id": "MN1-C06", "stn": "NSK-TRN-STN-0107", "pages": [16, 17, 18]}, {"id": "MN1-C07", "stn": "NSK-TRN-STN-0107", "pages": [16, 17, 18]}, {"id": "MN1-C08", "stn": "NSK-TRN-STN-0107", "pages": [16, 17, 18]}, {"id": "MN2-C01", "stn": "NSK-TRN-STN-0108", "pages": [19, 20, 21, 22]}, {"id": "MN2-C02", "stn": "NSK-TRN-STN-0108", "pages": [19, 20, 21, 22]}, {"id": "MN2-C03", "stn": "NSK-TRN-STN-0108", "pages": [19, 20, 21, 22]}, {"id": "MN2-C04", "stn": "NSK-TRN-STN-0108", "pages": [19, 20, 21, 22]}, {"id": "MN2-C05", "stn": "NSK-TRN-STN-0108", "pages": [19, 20, 21, 22]}, {"id": "MN2-C06", "stn": "NSK-TRN-STN-0108", "pages": [19, 20, 21, 22]}, {"id": "MN2-C07", "stn": "NSK-TRN-STN-0108", "pages": [19, 20, 21, 22]}, {"id": "MN2-C08", "stn": "NSK-TRN-STN-0108", "pages": [19, 20, 21, 22]}, {"id": "MN3-C01", "stn": "NSK-TRN-STN-0109", "pages": [23, 24, 25, 26, 27, 28, 29]}, {"id": "MN3-C02", "stn": "NSK-TRN-STN-0109", "pages": [23, 24, 25, 26, 27, 28, 29]}, {"id": "MN3-C03", "stn": "NSK-TRN-STN-0109", "pages": [23, 24, 25, 26, 27, 28, 29]}, {"id": "MN3-C04", "stn": "NSK-TRN-STN-0109", "pages": [23, 24, 25, 26, 27, 28, 29]}, {"id": "MN3-C05", "stn": "NSK-TRN-STN-0109", "pages": [23, 24, 25, 26, 27, 28, 29]}]});
}
function egStations(){ return Object.keys(egSeed().stations); }
function egSeedOf(stationId){ return egSeed().gates.filter(function(g){ return g.stn === stationId; }); }
/* سجلُّ بوابةٍ كما يُقرأ: البذرةُ + ما حقّقه الميدان (طبقةُ sites.egates) */
function egOvOf(stationId){ var o = (typeof STATE !== 'undefined' && STATE.siteOv && STATE.siteOv[stationId]) || null; if (o && o.egates) return o.egates; var x = typeof siteFind === 'function' ? siteFind(stationId) : null; return (x && x.egates) || {}; }
function egOf(stationId, gateId){
  var ov = egOvOf(stationId)[gateId] || {};
  var sd = egSeedOf(stationId).filter(function(g){ return g.id === gateId; })[0] || { id:gateId, stn:stationId, pages:[] };
  return { id:gateId, stn:stationId, pages:sd.pages, no:ov.no || '', lat:(+ov.lat || null), lng:(+ov.lng || null), readers:ov.readers || '', op:ov.op || '', draw:ov.draw || '', note:ov.note || '', verified:!!(ov.lat && ov.lng), at:ov.at || 0, by:ov.by || '' };
}
function egList(stationId){
  var extra = Object.keys(egOvOf(stationId));
  var ids = egSeedOf(stationId).map(function(g){ return g.id; }); extra.forEach(function(k){ if (ids.indexOf(k) < 0) ids.push(k); });
  return ids.map(function(id){ return egOf(stationId, id); });
}

/* ═══ بطاقةُ البوابات الإلكترونية على صفحة المحطة ═══
   أوّليّ: العددُ والمعرِّفاتُ من جرد الرسومات، لا إحداثياتَ حتى تُحقَّق. التحقيقُ يكتب فوق المحطة (sites.egates[id])
   خمسةَ حقول: الرقمُ الرسميُّ على الرسمة · الإحداثيات · القرّاءُ المربوطة · الحالةُ التشغيلية · مرجعُ الرسمة. */
function egOps(){ return ['غير مركّبة', 'قيد التركيب', 'تعمل', 'معطّلة', 'ملغاة']; }
function egIsStation(x){ return !!x && x.type === 'محطة' && !!egSeed().stations[x.id]; }
function egCard(x){
  if (!egIsStation(x)) return '';
  var L = egList(x.id), S = egSeed().stations[x.id], done = L.filter(function(g){ return g.verified; }).length, can = typeof maySiteEditBasic === 'function' && maySiteEditBasic();
  var head = alertBox('warn', t('جردٌ أوّليٌّ من مراجعة الرسومات (صفحات') + ' ' + S.pages.map(nm).join('، ') + ') — ' + t('العددُ والمعرِّفاتُ مؤقّتةٌ حتى تُطابَق على الرسومات الأصلية، ولا تُرسَم بوابةٌ على الخريطة قبل إحداثياتٍ محقَّقة'));
  var rows = L.map(function(g){
    var open = egCard.open === g.id;
    var line = '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 0;border-top:1px solid var(--line)">'
      + '<b class="num">' + esc(g.id) + '</b>'
      + (g.no ? pill(t('رقم الرسمة') + ' ' + g.no, 'acc') : pill('غير مطابَق', 'warn'))
      + (g.verified ? pill('\u{1F4CD} ' + t('إحداثياتٌ محقَّقة'), 'ok') : pill('بلا إحداثيات', ''))
      + (g.op ? pill(g.op, g.op === 'تعمل' ? 'ok' : g.op === 'معطّلة' ? 'bad' : 'info') : '')
      + (g.readers ? '<span class="hint" style="margin:0">' + esc(t('قرّاء')) + ': ' + esc(g.readers) + '</span>' : '')
      + '<span style="margin-inline-start:auto"></span>'
      + (can ? btn(open ? t('إغلاق') : '\u270E ' + t('تحقيق'), 'btn-quiet btn-sm', ' data-egopen="' + esc(open ? '' : g.id) + '"') : '')
      + '</div>';
    if (!open) return line;
    var inp = function(id, lbl, v, ph){ return '<div class="field"><label>' + esc(t(lbl)) + '</label><input id="' + id + '" value="' + esc(v || '') + '" placeholder="' + esc(ph || '') + '"></div>'; };
    return line + '<div class="grid cols-2" style="margin:4px 0 8px">'
      + inp('egNo', 'الرقم الرسمي على الرسمة', g.no, 'كما هو مطبوعٌ على الرسمة')
      + inp('egDraw', 'مرجع الرسمة', g.draw || (g.pages.length ? 'ص ' + g.pages.join('، ') : ''), 'رقم الصفحة أو اللوحة')
      + inp('egLat', 'خط العرض', g.lat, '21.xxxxx') + inp('egLng', 'خط الطول', g.lng, '39.xxxxx')
      + inp('egReaders', 'القرّاء المربوطة', g.readers, 'أرقام القرّاء التسلسلية — بفاصلة')
      + '<div class="field"><label>' + esc(t('الحالة التشغيلية')) + '</label><select id="egOp">' + [''].concat(egOps()).map(function(o){ return '<option value="' + esc(o) + '"' + (o === g.op ? ' selected' : '') + '>' + esc(o ? t(o) : '\u2014') + '</option>'; }).join('') + '</select></div>'
      + '</div><div class="field"><label>' + esc(t('ملاحظة')) + '</label><input id="egNote" value="' + esc(g.note) + '"></div>'
      + '<div class="actions">' + btn('\u2713 ' + t('احفظ التحقيق'), 'btn-primary btn-sm', ' data-egsave="' + esc(g.id) + '"') + btn(t('إلغاء'), 'btn-quiet btn-sm', ' data-egopen=""') + '</div>';
  }).join('');
  var add = can ? '<div class="actions" style="margin:8px 0 0">' + btn('+ ' + t('بوابة لم تكن في الجرد'), 'btn-secondary btn-sm', ' data-egadd="' + esc(x.id) + '"') + '</div>' : '';
  return card('\u{1F6AA} ' + t('البوابات الإلكترونية') + ' \u2014 ' + nm(L.length) + ' ' + t('(أوّلي — غير مؤكد)') + ' \u00b7 ' + nm(done) + ' ' + t('محقَّقة'),
    head + rows + add
    + '<p class="hint" style="margin:8px 0 0">' + esc(t('المصدر')) + ': ' + esc(egSeed().drawing) + ' \u00b7 ' + esc(t('مراجعة')) + ' ' + esc(egSeed().rev) + '</p>');
}
function egSave(stationId, gateId){
  if (!(typeof maySiteEditBasic === 'function' && maySiteEditBasic())){ toast(t('تحقيقُ البوابات للمشرف فما فوق')); return false; }
  var g = function(n){ var el = document.getElementById(n); return el ? String(el.value || '').trim() : ''; };
  var lat = parseFloat(g('egLat')), lng = parseFloat(g('egLng')), hasLL = g('egLat') || g('egLng');
  if (hasLL && !(lat > 15 && lat < 32 && lng > 34 && lng < 56)){ toast(t('إحداثياتٌ خارج المملكة — راجعها')); return false; }
  var x = siteFind(stationId); if (!x) return false;
  if (hasLL && Math.abs(lat - x.lat) < 1e-6 && Math.abs(lng - x.lng) < 1e-6){ toast(t('هذه إحداثياتُ المحطة نفسِها — لا تُنسَخ لبوابة')); return false; }   /* القاعدةُ ٤ */
  var rec = { no:g('egNo'), draw:g('egDraw'), readers:g('egReaders'), op:g('egOp'), note:g('egNote'), lat:hasLL ? lat : null, lng:hasLL ? lng : null, at:Date.now(), by:STATE.meta.name || '' };
  var eg = Object.assign({}, egOvOf(stationId)); eg[gateId] = rec;
  siteOvSet(stationId, { egates:eg });
  logEvent('تحقيقُ بوابة ' + gateId + ' في ' + stationId + (hasLL ? ' — بإحداثيات' : ''), stationId);
  egCard.open = ''; toast('\u2713 ' + t('حُفظ تحقيقُ البوابة')); return true;
}
function egAdd(stationId){
  var S = egSeed().stations[stationId]; if (!S) return;
  var n = egList(stationId).length + 1, id = S.code + '-X' + (n < 10 ? '0' + n : n);
  var eg = Object.assign({}, egOvOf(stationId)); eg[id] = { no:'', at:Date.now(), by:STATE.meta.name || '', note:'أُضيفت من الميدان' };
  siteOvSet(stationId, { egates:eg }); egCard.open = id; logEvent('بوابةٌ لم تكن في الجرد ' + id + ' — ' + stationId, stationId);
}
/* ما حُقِّق بإحداثياتٍ يُرسَم على الخريطة — بشكل البوابة، ولا شيءَ قبل ذلك */
function egMapPoints(){
  var out = [];
  egStations().forEach(function(sid){ egList(sid).forEach(function(g){ if (g.verified) out.push(g); }); });
  return out;
}
