/* (V38.90) moved by scripts/split-late.mjs from src/02-catalog/02-catalog-forms-11-chat.js — reached only by clicks or by the office chunk,
   so it ships with app-office.js after the login screen. Edit it here. */
function chSend(site, to, text, kind){
  var tx = String(text || '').trim(); if (!tx) return null;
  var id = 'M-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  var v = { id:id, site:site || '', to:to || '', from:STATE.meta.name || '', role:ROLE || '', text:tx.slice(0, 1500), kind:kind || 'msg', at:Date.now() };
  STATE.msgs = STATE.msgs || {}; CORE.set('msgs', id, v); CORE.saveSoon();
  chSeen.at = Date.now();
  return v;
}

/* a line the system writes into the site's thread (installation saved, approved, returned) — with the addressee of the event */
function chSystem(site, text, to){ try { return chSend(site, to, text, 'sys'); } catch (e){ LS_ERR = e; return null; } }
