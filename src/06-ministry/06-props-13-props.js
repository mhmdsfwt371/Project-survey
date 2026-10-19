/* ============================================================================
   FILE    : src/06-ministry/06-props-13-props.js
   DOMAIN  : Ministry follow-up — alerts, reports, Nusuk card system, what's new
   PURPOSE : Ministry props helpers.
   DEFINES : propList, propIs, propKeep, propFind, propMay, propLine, propPopHtml, propApprove, propReject, propMarkers, propChip, propSheetHtml, propGo
   GLOBALS : PROP_POP
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

function propApprove(id){
  if (!propMay()){ toast(t('اعتمادُ المقترحات للمهندس فما فوق')); return false; }
  var p = propFind(id); if (!p) return false;
  p.approved = true; p.appBy = (STATE.meta && STATE.meta.name) || ''; p.appAt = Date.now();
  STATE.props = propList().filter(function(q){ return q.id !== id; });
  if (!siteFind(id)){ STATE.sites.push(p); SITE_IX = null; SITE_TOK = null; }
  CORE.set('newsites', id, p); statBump(); logEvent('اعتمادُ مقترحةِ الوزارة — ' + id + ' \u00b7 ' + (p.zone || ''), id);
  PROP_POP = ''; PROP_SHEET = false; toast(id + ' \u00b7 ' + t('اعتُمدت — صارت نقطةً في السجل، جدوِل زيارتَها'));
  if (typeof visitAsnOpen === 'function') visitAsnOpen(id, true); else render(1);
  if (typeof mapPaint === 'function') mapPaint(); return true;
}
function propReject(id){
  if (!propMay()){ toast(t('اعتمادُ المقترحات للمهندس فما فوق')); return false; }
  var p = propFind(id); if (!p) return false;
  p.rejected = true; p.rejBy = (STATE.meta && STATE.meta.name) || ''; p.rejAt = Date.now();
  STATE.props = propList().filter(function(q){ return q.id !== id; });
  CORE.set('newsites', id, p); logEvent('رفضُ مقترحةِ الوزارة — ' + id, id);
  PROP_POP = ''; toast(id + ' \u00b7 ' + t('رُفضت المقترحة')); render(1); if (typeof mapPaint === 'function') mapPaint(); return true;
}

function propGo(id){ var p = propFind(id); if (!p || !(+p.lat && +p.lng)) return; PROP_SHEET = false; PROP_POP = id; if (typeof MAP !== 'undefined' && MAP){ try { MAP.setView([+p.lat, +p.lng], Math.max(MAP.getZoom(), 17)); } catch (e){ LS_ERR = e; } } render(1); if (typeof mapPaint === 'function') mapPaint(); }
