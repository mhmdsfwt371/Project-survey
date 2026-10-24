/* ============================================================================
   FILE    : src/04-office/04-tasks-office-09-assistant.js
   DOMAIN  : Office — photos, governance, assistant, word reports, drawing
   PURPOSE : The assistant: local search with no API, glossary, pending-upload window, diagnostics, usage learning, and the data assistant answering with numbers from the device.
   DEFINES : assistDiagSig, assistLiveSync
   GLOBALS : ASSIST_OPEN, ASSIST_Q, GLOSSARY, HELP_KEYWORDS, HELP_STEPS, QUEUE_OPEN, Q_LBL, ASSIST_INTENTS, ASSIST_QUICK, ASSIST_LOGGED … (+1 more)
   NOTE    : Build order is the full path (see scripts/build.mjs). Inline Arabic comments are the original
             decision log by version (owner decisions); new comments are written in English.
   ============================================================================ */

/* (V37.36) بلاغُ المالك: «صفحةُ المساعد مش بتتحدّث لوحدها بعد ما المزامنة تخلص» — حالةُ الجهاز تُقرأ عند الفتح وحدَه. صارت تُراقَب كلَّ ثانيتين
   ما دام المساعدُ مفتوحًا، وحين تتغيّر (طابورٌ فرغ، صورةٌ رُفعت، شبكةٌ عادت) تُستبدَل النتائجُ وحدَها والحقلُ باقٍ بما كُتب فيه. */
function assistDiagSig(){ try { var d = assistDiag(); return [d.q, d.pq, d.pf, d.pz, d.on ? 1 : 0, d.lite ? 1 : 0, d.idbBad ? 1 : 0].join('|'); } catch (e){ return ''; } }
function assistLiveSync(){
  if (!ASSIST_OPEN) { assistLiveSync.sig = ''; return; }
  var rs = document.getElementById('assistRes'); if (!rs) return;
  var sig = assistDiagSig(); if (!assistLiveSync.sig){ assistLiveSync.sig = sig; return; }
  if (sig !== assistLiveSync.sig){ assistLiveSync.sig = sig; rs.innerHTML = assistResHtml(); }
}
setInterval(function(){ try { assistLiveSync(); } catch (e){ LS_ERR = e; } }, 2000);

