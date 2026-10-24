/* ============================================================================
   FILE    : src/03z-shared/03z-shared-26-from-props-13-props.js
   DOMAIN  : Shared core — definitions the core needs before the deferrable domains load
   PURPOSE : Definitions moved verbatim from src/06-ministry/06-props-13-props.js (V38.38, stage A of core + chunks): the core (01–05, 08) references these names, so they must be in the first payload. Inline comments and version tags travel with each definition.
   DEFINES : propList, propIs, propKeep, propFind, propMay, propLine, propPopHtml, propMarkers, propChip, propSheetHtml
   NOTE    : Build order is the full path. Do not add new code here: put shared helpers in 01-core or 02-catalog.
   ============================================================================ */
/* ═══ (V37.69) مقترحاتُ الوزارة — قرارُ المالك «مقترحة أفضل»: النقطةُ التي تضيفها الوزارةُ تبقى خارجَ السجلِّ والعدِّ والتقارير حتى يعتمدها المهندس ═══
   تُحفَظ في newsites بمصدر «ministry» وغيرَ معتمدة، وتُمسَك هنا في STATE.props (لا STATE.sites) فلا تدخل ملخّصًا ولا تبويبًا ولا تقريرًا ولا إكسل.
   تُرسَم على الخريطة بعلامةٍ بنفسجيةٍ متقطّعةٍ للجميع (والوزارةُ ترى مقترحاتِها بعد إعادة الفتح)، وفي نافذتها: المهندسُ يعتمد (فتدخل السجلَّ وتُجدوَل زيارتُها) أو يرفض؛
   وغيرُه يقرأ «بانتظار اعتماد المهندس». وللمهندس شريحةٌ أعلى الخريطة بعددها تفتح قائمتَها. جردُ audit-props يحرس العدَّ قبل الاعتماد وبعده. */
function propList(){ if (!STATE.props) STATE.props = []; return STATE.props; }

function propIs(v){ return !!(v && v.origin === 'ministry' && v.approved !== true); }

function propKeep(v){
  if (!v || !v.id) return false;
  if (v.rejected || v.deleted || v.hidden){ STATE.props = propList().filter(function(p){ return p.id !== v.id; }); return false; }
  var ex = propList().filter(function(p){ return p.id === v.id; })[0];
  if (ex) Object.assign(ex, v); else propList().push(Object.assign({}, v));
  return true;
}

function propFind(id){ return propList().filter(function(p){ return p.id === id; })[0] || null; }

var PROP_POP = '', PROP_SHEET = false;

function propMay(){ return typeof may === 'function' && may('approve'); }

function propLine(p){ var tx = (TAX_DEF[p.type] || { l:p.type, i:'\u25CF' }); return tx.i + ' ' + esc(t(tx.l)) + ' \u2014 ' + esc(t(p.zone || '')) + (p.sq ? ' \u00b7 ' + esc(t('مربع')) + ' ' + esc(p.sq) : '') + (p.sign ? ' \u00b7 ' + esc(t('شاخص')) + ' ' + esc(p.sign) : ''); }

function propPopHtml(){
  var p = propFind(PROP_POP); if (!p) return '';
  return '<div class="svpop-veil" data-propclose="1" style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2000"></div>'
    + '<div class="svpop" role="dialog" aria-modal="true" style="position:fixed;z-index:2001;inset:auto 4vw 8vh 4vw;max-height:80vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid #9B51E0;border-radius:14px;padding:14px;box-shadow:0 10px 40px rgba(0,0,0,.35)">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">\u{1F3DB} ' + esc(t('مقترحة من الوزارة')) + '</h3>' + btn('\u2715', 'btn-quiet btn-sm', ' data-propclose="1" aria-label="' + esc(t('إغلاق')) + '"') + '</div>'
    + '<div style="margin:8px 0 4px;font-weight:700">' + esc(p.name || p.id) + '</div><div class="hint" style="margin:0">' + propLine(p) + '</div>'
    + (p.note ? '<p style="margin:8px 0 0">' + esc(p.note) + '</p>' : '')
    + '<div class="hint" style="margin:8px 0 0;font-size:12px">' + esc(t('أضافتها')) + ' ' + esc(p.by || t('الوزارة')) + ' \u00b7 ' + esc(fmtDate(p.at)) + ' \u00b7 <span class="num">' + (+p.lat).toFixed(5) + ', ' + (+p.lng).toFixed(5) + '</span></div>'
    + '<div class="actions" style="margin-top:12px">'
    + (propMay() ? btn('\u2705 ' + t('اعتمدها نقطةً رسمية'), 'btn-primary btn-sm', ' data-propok="' + esc(p.id) + '"') + btn('\u2715 ' + t('ارفضها'), 'btn-danger btn-sm', ' data-propno="' + esc(p.id) + '"') : '<span class="pill">\u23F3 ' + esc(t('بانتظار اعتماد المهندس')) + '</span>')
    + btn('\u2197 ' + t('اتجاهات'), 'btn-quiet btn-sm', ' data-propgo="' + esc(p.id) + '"') + '</div></div>';
}

function propMarkers(){
  if (typeof MAP === 'undefined' || !MAP || !MAP_TMP) return;
  propList().forEach(function(p){ if (!(+p.lat && +p.lng)) return;
    var mk = L.circleMarker([+p.lat, +p.lng], { renderer:MAP_CV, radius:9, color:'#9B51E0', weight:3, dashArray:'4 3', fillColor:'#9B51E0', fillOpacity:0.28 });
    mk.on('click', function(){ PROP_POP = p.id; POP_OPEN = false; render(1); }); mk.addTo(MAP_TMP); });
}

function propChip(){ var n = propList().length; if (!n) return ''; return '<button type="button" class="map-chip' + (PROP_SHEET ? ' on' : '') + '" data-propsheet="' + (PROP_SHEET ? '0' : '1') + '" style="border-color:#9B51E0">\u{1F3DB} ' + esc(t('مقترحات الوزارة')) + ' \u00b7 ' + nm(n) + '</button>'; }

function propSheetHtml(){
  if (!PROP_SHEET) return ''; var P = propList().slice().sort(function(a, b){ return (+b.at || 0) - (+a.at || 0); });
  return '<div class="map-sheet"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>\u{1F3DB} ' + esc(t('مقترحات الوزارة')) + ' \u00b7 ' + nm(P.length) + '</b>' + btn('\u2715', 'btn-quiet btn-sm', ' data-propsheet="0" aria-label="' + esc(t('إغلاق')) + '"') + '</div>'
    + (P.length ? P.map(function(p){ return '<div style="' + 'background:var(--surface-2);border-radius:12px;padding:10px;margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div style="flex:1;min-width:160px"><div style="font-weight:700">' + esc(p.name || p.id) + '</div><div class="hint" style="margin:2px 0 0;font-size:12px">' + propLine(p) + ' \u00b7 ' + esc(fmtDate(p.at)) + '</div></div>'
        + btn('\u{1F4CD}', 'btn-quiet btn-sm', ' data-propgo="' + esc(p.id) + '" title="' + esc(t('على الخريطة')) + '"') + (propMay() ? btn('\u2705 ' + t('اعتمد'), 'btn-primary btn-sm', ' data-propok="' + esc(p.id) + '"') + btn('\u2715', 'btn-danger btn-sm', ' data-propno="' + esc(p.id) + '" title="' + esc(t('ارفضها')) + '"') : '') + '</div>'; }).join('') : '<p class="hint">' + esc(t('لا مقترحات')) + '</p>') + '</div>';
}
