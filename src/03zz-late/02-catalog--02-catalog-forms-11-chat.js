/* ============================================================================
   FILE    : src/03zz-late/02-catalog--02-catalog-forms-11-chat.js
   DOMAIN  : Late core — functions the core alone never reaches, shipped with app-office.js
   PURPOSE : Moved verbatim from src/02-catalog/02-catalog-forms-11-chat.js by scripts/split-late.mjs (V38.90): only the delegated click handlers or the office chunk call them, so they arrive a few seconds after the login screen instead of in the field's first payload. A click that needs one before the chunk lands is replayed when it does.
   DEFINES : chSend, chSystem
   NOTE    : Edit these functions here. audit-core-alone.mjs fails if code the core runs alone starts calling one without checking typeof first.
   ============================================================================ */
function chSend(site, to, text, kind, extra){
  var tx = String(text || '').trim(); if (!tx) return null;
  var id = 'M-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  var v = { id:id, site:site || '', to:to || '', from:STATE.meta.name || '', role:ROLE || '', text:tx.slice(0, 1500), kind:kind || 'msg', at:Date.now() };
  if (extra) Object.keys(extra).forEach(function(k){ if (!(k in v)) v[k] = extra[k]; });   /* (V39.7) a forwarded conversation names its owner (ref) */
  STATE.msgs = STATE.msgs || {}; CORE.set('msgs', id, v); CORE.saveSoon();
  chSeen.at = Date.now();
  return v;
}

/* a line the system writes into the site's thread (installation saved, approved, returned) — with the addressee of the event */
function chSystem(site, text, to){ try { return chSend(site, to, text, 'sys'); } catch (e){ LS_ERR = e; return null; } }
