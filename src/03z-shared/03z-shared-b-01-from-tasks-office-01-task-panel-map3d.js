/* ============================================================================
   FILE    : src/03z-shared/03z-shared-b-01-from-tasks-office-01-task-panel-map3d.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/04-office/04-tasks-office-01-task-panel-map3d.js (V38.38–V38.39, stage A of core + chunks, pass b): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : chalPopHtml, chalPopSync, wtHostSync, wtSheet
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ نافذةُ نقاط التحدي (V26.9) — من صفحة التحديات والمعوقات في الميدان ═══ */
var CHAL_POP = '', CHUP_OPEN = '';

function chalPopHtml(){
  var cat = CHAL_POP, O = mfuObstaclesF().filter(function(o){ return cat === '*' || o.cats.indexOf(cat) > -1; });
  var rows = O.map(function(o){ var x = o.x, r = STATE.recs[x.id] || {}, nt = String(r.chal_note || r.note || '').trim();
    return '<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div><b>' + esc(siteKey(x) !== x.id ? siteKey(x) : (x.name || x.id)) + '</b>' + (x.sign ? ' \u00b7 ' + esc(t('شاخص')) + ' ' + esc(x.sign) : '') + ' <span class="num hint">' + bdi(x.id) + '</span></div>'
      + '<div class="hint" style="margin:2px 0">' + esc(t(x.zone || '')) + ' \u00b7 ' + esc(typeLabel(x.type || '')) + (cat === '*' ? ' \u00b7 ' + o.cats.map(function(c){ return esc(t(c)); }).join('، ') : '') + (r.access && r.access !== 'تم الوصول' ? ' \u00b7 ' + esc(t(r.access)) : '') + '</div>'
      + (nt ? '<div class="hint" style="margin:0 0 4px">' + esc(nt.slice(0, 200)) + '</div>' : '')
      + '<div class="actions" style="margin:0">' + btn('\u25C8 ' + t('على الخريطة'), 'btn-secondary btn-sm', ' data-fly="' + esc(x.id) + '"') + btn(t('التفاصيل'), 'btn-quiet btn-sm', ' data-site="' + esc(x.id) + '"') + '</div></div>'; }).join('');
  return '<div class="wt-back" data-chalpopx="0"></div>'
    + '<div class="pop wt-sheet" id="chalPop" role="dialog" aria-label="' + esc(t('نقاط التحدي')) + '">'
    + '<div class="pop-head"><div style="min-width:0"><h3 style="margin:0">' + esc(cat === '*' ? t('كل النقاط') : t(cat)) + '</h3><div class="hint" style="margin:2px 0 0">' + nm(O.length) + ' ' + esc(t('نقطة')) + ((MFU.flt.z || MFU.flt.t) ? ' \u00b7 ' + esc(t('بالفلتر')) : '') + '</div></div>'
    + '<button type="button" class="btn btn-quiet btn-sm pop-x" data-chalpopx="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">' + (rows || '<p class="hint">' + esc(t('لا نقاط.')) + '</p>') + '</div></div>';
}

function chalPopSync(){
  var host = document.getElementById('chalPopHost');
  if (!host){ host = document.createElement('div'); host.id = 'chalPopHost'; document.body.appendChild(host); }
  if (CHAL_POP && CUR !== 'survey') CHAL_POP = '';
  host.innerHTML = CHAL_POP ? chalPopHtml() : '';
}

function wtHostSync(){
  var host = document.getElementById('wtHost');
  if (!host){ host = document.createElement('div'); host.id = 'wtHost'; document.body.appendChild(host); }
  var show = WT_OPEN && (CUR === 'wtask' || CUR === 'mywork');
  host.innerHTML = show ? wtSheet(wtMay()) : '';
}

function wtSheet(me){
  if (!WT_OPEN) return '';
  var r = wtRow(WT_OPEN); if (!r){ WT_OPEN = ''; return ''; }
  var edit = me
    ? '<details style="margin-top:12px"><summary class="hint" style="cursor:pointer">\u270E ' + esc(t('تعديل البيانات')) + '</summary>'
      + '<div class="grid cols-2" style="margin-top:8px">'
      + '<div class="field" style="grid-column:1/-1"><label>' + esc(t('المهمة')) + '</label><input value="' + esc(r.n) + '" data-wte2="n" dir="auto"></div>'
      + '<div class="field"><label>' + esc(t('المسؤول')) + '</label><input value="' + esc(r.who || '') + '" data-wte2="who" dir="auto" list="wtWhoList"></div>'
      + '<div class="field"><label>' + esc(t('تاريخ الاستحقاق')) + '</label><input type="date" value="' + esc(r.due || '') + '" data-wte2="due"></div>'
      + '<div class="field"><label>' + esc(t('المسار')) + '</label><input value="' + esc(r.track || '') + '" data-wte2="track" dir="auto"></div>'
      + '<div class="field"><label>' + esc(t('الوصف')) + '</label><input value="' + esc(r.d || '') + '" data-wte2="d" dir="auto"></div>'
      + (wtLeaves().length ? '<div class="field" style="grid-column:1/-1"><label>' + esc(t('بند الخطة')) + '</label>' + wtWbsSelect(r.wbs, 'data-wte2="wbs"') + '</div>' : '')
      + '</div><div class="actions">' + btn('\u{1F4BE} ' + t('حفظ'),'btn-primary btn-sm',' data-wtsave2="' + esc(r.id) + '"')
      + btn('\u{1F5D1} ' + t('حذف'),'btn-quiet btn-sm',' data-wtdel="' + esc(r.id) + '"') + '</div></details>'
    : '';
  return '<div class="wt-back" data-wtclose="0"></div>'
    + '<div class="pop wt-sheet" id="wtSheet" role="dialog" aria-label="' + esc(t('المهمة')) + '">'
    + '<div class="pop-head"><div style="min-width:0"><div class="pid num hint" style="margin:0">#' + esc(r.id) + '</div><h3 style="margin-top:3px">' + esc(r.n) + '</h3></div>'
    + '<button type="button" class="btn btn-quiet btn-sm pop-x" data-wtclose="0" aria-label="' + esc(t('إغلاق')) + '">\u2715</button></div>'
    + '<div class="pop-body">' + wtPanelInner(r, me) + edit + '</div></div>';
}
